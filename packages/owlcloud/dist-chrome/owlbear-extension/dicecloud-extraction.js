/**
 * Comprehensive DiceCloud character data extraction
 * Copied from proven OwlCloud implementation
 */

// Standardized DiceCloud variable names
const STANDARD_VARS = {
  abilities: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'],
  abilityMods: ['strengthMod', 'dexterityMod', 'constitutionMod', 'intelligenceMod', 'wisdomMod', 'charismaMod'],
  saves: ['strengthSave', 'dexteritySave', 'constitutionSave', 'intelligenceSave', 'wisdomSave', 'charismaSave'],
  skills: [
    'acrobatics', 'animalHandling', 'arcana', 'athletics', 'deception', 'history',
    'insight', 'intimidation', 'investigation', 'medicine', 'nature', 'perception',
    'performance', 'persuasion', 'religion', 'sleightOfHand', 'stealth', 'survival'
  ],
  combat: ['armorClass', 'hitPoints', 'speed', 'initiative', 'proficiencyBonus']
};

/**
 * Determines hit die type from character class (D&D 5e)
 */
function getHitDieTypeFromClass(levels) {
  const hitDiceMap = {
    'barbarian': 'd12',
    'fighter': 'd10',
    'paladin': 'd10',
    'ranger': 'd10',
    'bard': 'd8',
    'cleric': 'd8',
    'druid': 'd8',
    'monk': 'd8',
    'rogue': 'd8',
    'warlock': 'd8',
    'sorcerer': 'd6',
    'wizard': 'd6'
  };

  if (levels && levels.length > 0) {
    const primaryClass = levels[0]?.name?.toLowerCase() || '';
    for (const [classKey, die] of Object.entries(hitDiceMap)) {
      if (primaryClass.includes(classKey)) {
        return die;
      }
    }
  }

  return 'd8'; // Default
}

/**
 * Parses API response into structured character data
 */
function parseCharacterData(apiData, characterId) {
  console.log('CarmaClouds: Parsing character data...');

  if (!apiData.creatures || apiData.creatures.length === 0) {
    console.error('CarmaClouds: No creatures found in API response');
    throw new Error('No character data found in API response');
  }

  const creature = apiData.creatures[0];
  const variables = (apiData.creatureVariables && apiData.creatureVariables[0]) || {};
  const properties = apiData.creatureProperties || [];

  console.log('CarmaClouds: Creature:', creature.name);
  console.log('CarmaClouds: Variables count:', Object.keys(variables).length);
  console.log('CarmaClouds: Properties count:', properties.length);

  // Extract character name early to ensure proper scope
  const characterName = creature.name || '';

  // Calculate AC from multiple sources
  const calculateArmorClass = () => {
    // Helper: try to coerce a variety of shapes into a numeric AC
    const extractNumeric = (val) => {
      if (val === null || val === undefined) return null;
      if (typeof val === 'number' && !isNaN(val)) return val;
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? null : parsed;
      }
      if (typeof val === 'object') {
        if (val.total !== undefined && typeof val.total === 'number') return val.total;
        if (val.value !== undefined && typeof val.value === 'number') return val.value;
        if (val.calculation && typeof val.calculation === 'string') {
          const bm = val.calculation.match(/^(\d+)/);
          if (bm) return parseInt(bm[1]);
        }
      }
      return null;
    };

    // Check if Dicecloud provided a calculated AC (most reliable)
    if (variables.armorClass && (variables.armorClass.total || variables.armorClass.value)) {
      const variableAC = variables.armorClass.total || variables.armorClass.value;
      console.log(`CarmaClouds: Using Dicecloud's calculated AC: ${variableAC}`);
      return variableAC;
    }

    // Try denormalizedStats
    if (creature && creature.denormalizedStats) {
      const tryKeys = ['armorClass', 'ac', 'armor'];
      for (const k of tryKeys) {
        if (creature.denormalizedStats.hasOwnProperty(k)) {
          const num = extractNumeric(creature.denormalizedStats[k]);
          if (num !== null) {
            console.log(`CarmaClouds: Using denormalizedStats.${k}:`, num);
            return num;
          }
        }
      }
    }

    // Check variables for AC
    const varNamesToCheck = ['armor', 'armorClass', 'armor_class', 'ac', 'acTotal'];
    for (const vn of varNamesToCheck) {
      if (variables.hasOwnProperty(vn)) {
        const v = variables[vn];
        const candidate = extractNumeric(v && (v.total ?? v.value ?? v));
        if (candidate !== null) {
          console.log(`CarmaClouds: Using variable ${vn}:`, candidate);
          return candidate;
        }
      }
    }

    // Calculate from properties (base + armor + bonuses)
    let baseAC = 10;
    let armorAC = null;
    const acBonuses = [];

    properties.forEach(prop => {
      if (prop.inactive || prop.disabled) return;

      const hasArmorStat = prop.stat === 'armor' ||
                          (Array.isArray(prop.stats) && prop.stats.includes('armor'));

      if (hasArmorStat) {
        let amount = null;
        if (typeof prop.amount === 'number') {
          amount = prop.amount;
        } else if (typeof prop.amount === 'string') {
          amount = parseFloat(prop.amount);
        }

        if (amount !== null && !isNaN(amount)) {
          const operation = prop.operation || '';

          if (operation === 'base' || operation === 'Base value') {
            if (armorAC === null || amount > armorAC) {
              armorAC = amount;
            }
          } else if (operation === 'add' || operation === 'Add') {
            acBonuses.push({ name: prop.name, amount });
          }
        }
      }
    });

    let finalAC = armorAC !== null ? armorAC : baseAC;
    acBonuses.forEach(bonus => {
      finalAC += bonus.amount;
    });

    console.log('CarmaClouds: Calculated AC:', finalAC);
    return finalAC;
  };

  // Extract race, class, and level from properties
  let characterRace = 'Unknown';
  let characterClass = '';
  let characterLevel = 0;
  const uniqueClasses = new Set();
  let raceFound = false;

  console.log('CarmaClouds: Extracting basic character info...');

  // Debug: Log all property types to help identify race
  const propertyTypes = {};
  properties.forEach(prop => {
    if (prop && prop.type) {
      propertyTypes[prop.type] = (propertyTypes[prop.type] || 0) + 1;
    }
  });
  console.log('CarmaClouds: Property types in character:', propertyTypes);

  // Check if race is stored directly on creature
  if (creature.race) {
    console.log('CarmaClouds: Found race on creature:', creature.race);
    characterRace = creature.race;
    raceFound = true;
  }
  if (creature.denormalizedStats && creature.denormalizedStats.race) {
    console.log('CarmaClouds: Found race in denormalizedStats:', creature.denormalizedStats.race);
    characterRace = creature.denormalizedStats.race;
    raceFound = true;
  }

  for (const prop of properties) {
    if (!prop) continue;

    // Check for race as a folder (DiceCloud often stores races as folders)
    // Look for folders with common race names at the top level
    if (!raceFound && prop.type === 'folder' && prop.name) {
      const commonRaces = ['human', 'elf', 'dwarf', 'halfling', 'gnome', 'half-elf', 'half-orc', 'dragonborn', 'tiefling', 'orc', 'goblin', 'kobold', 'warforged', 'tabaxi', 'kenku', 'aarakocra', 'genasi', 'aasimar', 'firbolg', 'goliath', 'triton', 'yuan-ti', 'tortle', 'lizardfolk', 'bugbear', 'hobgoblin', 'changeling', 'shifter', 'kalashtar'];
      const nameMatchesRace = commonRaces.some(race => prop.name.toLowerCase().includes(race));
      if (nameMatchesRace) {
        const parentDepth = prop.ancestors ? prop.ancestors.length : 0;
        if (parentDepth <= 2) { // Top-level or near top-level folder
          console.log('CarmaClouds: Found race folder:', prop.name);
          characterRace = prop.name;
          raceFound = true;
        }
      }
    }

    // Extract race for preview - check multiple possible types
    if (!raceFound && (prop.type === 'race' || prop.type === 'species' || prop.type === 'characterRace')) {
      if (prop.name) {
        console.log('CarmaClouds: Found race property:', prop.type, prop.name);
        characterRace = prop.name;
        raceFound = true;
      }
    }

    // Check if it's a constant named "Race" (DiceCloud v2 stores race as a constant)
    if (!raceFound && prop.type === 'constant' && prop.name && prop.name.toLowerCase() === 'race') {
      if (prop.value) {
        console.log('CarmaClouds: Found race as constant:', prop.value);
        characterRace = prop.value;
        raceFound = true;
      }
    }

    // Extract class for preview
    if (prop.type === 'class' && prop.name && !prop.inactive && !prop.disabled) {
      const cleanName = prop.name.replace(/\s*\[Multiclass\]/i, '').trim();
      const normalizedClassName = cleanName.toLowerCase().trim();
      if (!uniqueClasses.has(normalizedClassName)) {
        uniqueClasses.add(normalizedClassName);
        if (characterClass) {
          characterClass += ` / ${cleanName}`;
        } else {
          characterClass = cleanName;
        }
      }
    }

    // Extract level for preview
    if (prop.type === 'classLevel' && !prop.inactive && !prop.disabled) {
      characterLevel += 1;
    }
  }

  // Fallback: Check for race in variables if not found in properties
  if (!raceFound && (!characterRace || characterRace === 'Unknown')) {
    console.log('CarmaClouds: Race not found in properties, checking variables...');
    const raceVars = Object.keys(variables).filter(key =>
      key.toLowerCase().includes('race') || key.toLowerCase().includes('species')
    );

    if (raceVars.length > 0) {
      console.log('CarmaClouds: Found race-related variables:', raceVars);

      // Log raw data for each race variable
      raceVars.forEach(varName => {
        console.log(`CarmaClouds: Raw data for "${varName}":`, variables[varName]);
      });

      // Helper function to format camelCase race names
      const formatRaceName = (name) => {
        if (!name) return null;
        if (name.toLowerCase() === 'custom' || name.toLowerCase() === 'customlineage') {
          return 'Custom Lineage';
        }
        let formatted = name.replace(/([a-z])([A-Z])/g, '$1 $2');
        formatted = formatted.split(' ').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
        return formatted;
      };

      // Helper function to extract race name from variable name
      const extractRaceFromVarName = (varName) => {
        const raceName = varName.replace(/race$/i, '').replace(/^race$/i, '');
        if (raceName && raceName !== varName.toLowerCase()) {
          return raceName.charAt(0).toUpperCase() + raceName.slice(1);
        }
        return null;
      };

      let raceName = null;
      let subraceName = null;

      // Check for subRace first
      const subRaceVar = raceVars.find(key => key.toLowerCase() === 'subrace');
      if (subRaceVar) {
        const subRaceValue = variables[subRaceVar];
        console.log('CarmaClouds: Found subRace variable:', subRaceValue);
        if (typeof subRaceValue === 'object' && subRaceValue !== null) {
          if (subRaceValue.name) {
            subraceName = formatRaceName(subRaceValue.name);
          } else if (subRaceValue.text) {
            subraceName = formatRaceName(subRaceValue.text);
          } else if (subRaceValue.value) {
            subraceName = formatRaceName(subRaceValue.value);
          }
        } else if (typeof subRaceValue === 'string') {
          subraceName = formatRaceName(subRaceValue);
        }
      }

      // Check for race variable
      const raceVar = raceVars.find(key => key.toLowerCase() === 'race');
      if (raceVar) {
        const raceValue = variables[raceVar];
        console.log('CarmaClouds: Found race variable:', raceValue);
        if (typeof raceValue === 'object' && raceValue !== null) {
          // Check for nested value.value (DiceCloud constants have this structure)
          if (raceValue.value && typeof raceValue.value === 'object' && raceValue.value.value) {
            raceName = formatRaceName(raceValue.value.value);
            console.log('CarmaClouds: Extracted race from nested value.value:', raceName);
          } else if (raceValue.value && typeof raceValue.value === 'string') {
            raceName = formatRaceName(raceValue.value);
          } else if (raceValue.name) {
            raceName = formatRaceName(raceValue.name);
          } else if (raceValue.text) {
            raceName = formatRaceName(raceValue.text);
          }
        } else if (typeof raceValue === 'string') {
          raceName = formatRaceName(raceValue);
        }
      }

      // If we didn't find race/subrace with names, look for specific race variables
      if (!raceName) {
        for (const varName of raceVars) {
          const varValue = variables[varName];
          if (typeof varValue === 'object' && varValue !== null && varValue.value === true) {
            const extracted = extractRaceFromVarName(varName);
            if (extracted) {
              raceName = extracted;
              console.log('CarmaClouds: Extracted race from variable name:', varName, '->', raceName);
              break;
            }
          }
        }
      }

      // Combine race and subrace if we have both
      if (raceName && subraceName) {
        characterRace = `${raceName} - ${subraceName}`;
        console.log('CarmaClouds: Combined race and subrace:', characterRace);
      } else if (subraceName) {
        characterRace = subraceName;
        console.log('CarmaClouds: Using subrace as race:', characterRace);
      } else if (raceName) {
        characterRace = raceName;
        console.log('CarmaClouds: Using race:', characterRace);
      } else {
        console.log('CarmaClouds: Could not determine race from variables');
      }
    } else {
      console.log('CarmaClouds: No race variables found');
    }
  }

  console.log('CarmaClouds: Character preview:', characterName, characterLevel, characterRace, characterClass);

  // Store just raw data + metadata - parsing happens per-VTT when tabs load
  const characterData = {
    // Metadata
    id: creature._id || characterId,
    name: characterName,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    source: 'dicecloud',

    // Preview info (for character lists, etc.)
    preview: {
      race: characterRace,
      class: characterClass || 'Unknown',
      level: characterLevel
    },

    // Raw DiceCloud API data - VTT adapters will parse this as needed
    raw: {
      creature: creature,
      variables: variables,
      properties: properties
    }
  };

  console.log('CarmaClouds: Successfully stored character data:', characterData.name);
  return characterData;
}

/**
 * Parse raw DiceCloud data into Roll20-specific format
 * Called by RollCloud adapter when tab is loaded
 */
function parseForRollCloud(rawData) {
  if (!rawData || !rawData.creature || !rawData.variables || !rawData.properties) {
    throw new Error('Invalid raw data format');
  }

  const { creature, variables, properties } = rawData;

  // Extract character name early to ensure proper scope
  const characterName = creature.name || '';

  // Extract race, class, level
  let race = 'Unknown';
  let characterClass = '';
  let level = 0;
  const uniqueClasses = new Set();
  let raceFound = false;

  for (const prop of properties) {
    if (!prop) continue;

    // Check for race as a folder (DiceCloud often stores races as folders)
    if (!raceFound && prop.type === 'folder' && prop.name) {
      const commonRaces = ['human', 'elf', 'dwarf', 'halfling', 'gnome', 'half-elf', 'half-orc', 'dragonborn', 'tiefling', 'orc', 'goblin', 'kobold', 'warforged', 'tabaxi', 'kenku', 'aarakocra', 'genasi', 'aasimar', 'firbolg', 'goliath', 'triton', 'yuan-ti', 'tortle', 'lizardfolk', 'bugbear', 'hobgoblin', 'changeling', 'shifter', 'kalashtar'];
      const nameMatchesRace = commonRaces.some(r => prop.name.toLowerCase().includes(r));
      if (nameMatchesRace) {
        const parentDepth = prop.ancestors ? prop.ancestors.length : 0;
        if (parentDepth <= 2) {
          race = prop.name;
          raceFound = true;
        }
      }
    }

    // Check for race property types
    if (!raceFound && (prop.type === 'race' || prop.type === 'species' || prop.type === 'characterRace')) {
      if (prop.name) {
        race = prop.name;
        raceFound = true;
      }
    }

    // DiceCloud v2 stores race as a constant
    if (!raceFound && prop.type === 'constant' && prop.name && prop.name.toLowerCase() === 'race') {
      if (prop.value) {
        race = prop.value;
        raceFound = true;
      }
    }

    if (prop.type === 'class' && prop.name && !prop.inactive && !prop.disabled) {
      const cleanName = prop.name.replace(/\s*\[Multiclass\]/i, '').trim();
      const normalizedClassName = cleanName.toLowerCase().trim();
      if (!uniqueClasses.has(normalizedClassName)) {
        uniqueClasses.add(normalizedClassName);
        characterClass = characterClass ? `${characterClass} / ${cleanName}` : cleanName;
      }
    }

    if (prop.type === 'classLevel' && !prop.inactive && !prop.disabled) {
      level += 1;
    }
  }

  // Fallback: Check for race in variables if not found in properties
  if (!raceFound && (!race || race === 'Unknown')) {
    const raceVars = Object.keys(variables).filter(key =>
      key.toLowerCase().includes('race') || key.toLowerCase().includes('species')
    );

    if (raceVars.length > 0) {
      // Log raw data for each race variable
      raceVars.forEach(varName => {
        console.log(`parseForRollCloud: Raw data for "${varName}":`, variables[varName]);
      });

      // Helper function to format camelCase race names
      const formatRaceName = (name) => {
        if (!name) return null;
        if (name.toLowerCase() === 'custom' || name.toLowerCase() === 'customlineage') {
          return 'Custom Lineage';
        }
        let formatted = name.replace(/([a-z])([A-Z])/g, '$1 $2');
        formatted = formatted.split(' ').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
        return formatted;
      };

      // Helper function to extract race name from variable name
      const extractRaceFromVarName = (varName) => {
        const raceName = varName.replace(/race$/i, '').replace(/^race$/i, '');
        if (raceName && raceName !== varName.toLowerCase()) {
          return raceName.charAt(0).toUpperCase() + raceName.slice(1);
        }
        return null;
      };

      let raceName = null;
      let subraceName = null;

      // Check for subRace first
      const subRaceVar = raceVars.find(key => key.toLowerCase() === 'subrace');
      if (subRaceVar) {
        const subRaceValue = variables[subRaceVar];
        if (typeof subRaceValue === 'object' && subRaceValue !== null) {
          if (subRaceValue.name) {
            subraceName = formatRaceName(subRaceValue.name);
          } else if (subRaceValue.text) {
            subraceName = formatRaceName(subRaceValue.text);
          } else if (subRaceValue.value) {
            subraceName = formatRaceName(subRaceValue.value);
          }
        } else if (typeof subRaceValue === 'string') {
          subraceName = formatRaceName(subRaceValue);
        }
      }

      // Check for race variable
      const raceVar = raceVars.find(key => key.toLowerCase() === 'race');
      if (raceVar) {
        const raceValue = variables[raceVar];
        if (typeof raceValue === 'object' && raceValue !== null) {
          // Check for nested value.value (DiceCloud constants have this structure)
          if (raceValue.value && typeof raceValue.value === 'object' && raceValue.value.value) {
            raceName = formatRaceName(raceValue.value.value);
          } else if (raceValue.value && typeof raceValue.value === 'string') {
            raceName = formatRaceName(raceValue.value);
          } else if (raceValue.name) {
            raceName = formatRaceName(raceValue.name);
          } else if (raceValue.text) {
            raceName = formatRaceName(raceValue.text);
          }
        } else if (typeof raceValue === 'string') {
          raceName = formatRaceName(raceValue);
        }
      }

      // If we didn't find race/subrace with names, look for specific race variables
      if (!raceName) {
        for (const varName of raceVars) {
          const varValue = variables[varName];
          if (typeof varValue === 'object' && varValue !== null && varValue.value === true) {
            const extracted = extractRaceFromVarName(varName);
            if (extracted) {
              raceName = extracted;
              break;
            }
          }
        }
      }

      // Combine race and subrace if we have both
      if (raceName && subraceName) {
        race = `${raceName} - ${subraceName}`;
      } else if (subraceName) {
        race = subraceName;
      } else if (raceName) {
        race = raceName;
      }
    }
  }

  // Build attributes
  const attributes = {};
  STANDARD_VARS.abilities.forEach(ability => {
    attributes[ability] = variables[ability]?.total || variables[ability]?.value || 10;
  });

  // Calculate modifiers
  const attributeMods = {};
  Object.keys(attributes).forEach(attr => {
    attributeMods[attr] = Math.floor((attributes[attr] - 10) / 2);
  });

  // Extract saves
  const saves = {};
  STANDARD_VARS.saves.forEach(save => {
    if (variables[save]) {
      const abilityName = save.replace('Save', '');
      saves[abilityName] = variables[save].total || variables[save].value || 0;
    }
  });

  // Extract skills
  const skills = {};
  STANDARD_VARS.skills.forEach(skill => {
    if (variables[skill]) {
      skills[skill] = variables[skill].total || variables[skill].value || 0;
    }
  });

  // Calculate AC using the comprehensive logic
  const calculateAC = () => {
    const extractNumeric = (val) => {
      if (val === null || val === undefined) return null;
      if (typeof val === 'number' && !isNaN(val)) return val;
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? null : parsed;
      }
      if (typeof val === 'object') {
        if (val.total !== undefined && typeof val.total === 'number') return val.total;
        if (val.value !== undefined && typeof val.value === 'number') return val.value;
      }
      return null;
    };

    if (variables.armorClass?.total || variables.armorClass?.value) {
      return variables.armorClass.total || variables.armorClass.value;
    }

    if (creature.denormalizedStats) {
      const tryKeys = ['armorClass', 'ac', 'armor'];
      for (const k of tryKeys) {
        if (creature.denormalizedStats.hasOwnProperty(k)) {
          const num = extractNumeric(creature.denormalizedStats[k]);
          if (num !== null) return num;
        }
      }
    }

    const varNamesToCheck = ['armor', 'armorClass', 'armor_class', 'ac', 'acTotal'];
    for (const vn of varNamesToCheck) {
      if (variables.hasOwnProperty(vn)) {
        const candidate = extractNumeric(variables[vn]?.total ?? variables[vn]?.value ?? variables[vn]);
        if (candidate !== null) return candidate;
      }
    }

    let baseAC = 10;
    let armorAC = null;
    const acBonuses = [];

    properties.forEach(prop => {
      if (prop.inactive || prop.disabled) return;

      const hasArmorStat = prop.stat === 'armor' || (Array.isArray(prop.stats) && prop.stats.includes('armor'));

      if (hasArmorStat) {
        let amount = typeof prop.amount === 'number' ? prop.amount : parseFloat(prop.amount);
        if (!isNaN(amount)) {
          const operation = prop.operation || '';
          if (operation === 'base' || operation === 'Base value') {
            if (armorAC === null || amount > armorAC) armorAC = amount;
          } else if (operation === 'add' || operation === 'Add') {
            acBonuses.push({ name: prop.name, amount });
          }
        }
      }
    });

    let finalAC = armorAC !== null ? armorAC : baseAC;
    acBonuses.forEach(bonus => finalAC += bonus.amount);
    return finalAC;
  };

  // Helper to extract text from DiceCloud text objects
  const extractText = (field) => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (typeof field === 'object' && field.text) return field.text;
    return '';
  };

  // Parse spells from properties with child attack/damage extraction
  const spells = properties
    .filter(p => p.type === 'spell')
    .map(spell => {
      // Find child properties (attack rolls, damage) for this spell
      const spellChildren = properties.filter(p => {
        if (p.type !== 'roll' && p.type !== 'damage' && p.type !== 'attack') return false;
        if (p.ancestors && Array.isArray(p.ancestors)) {
          return p.ancestors.some(ancestor => {
            const ancestorId = typeof ancestor === 'object' ? ancestor.id : ancestor;
            return ancestorId === spell._id;
          });
        }
        return false;
      });

      // Extract attack roll from children
      let attackRoll = '';
      const attackChild = spellChildren.find(c => c.type === 'attack' || (c.type === 'roll' && c.name && c.name.toLowerCase().includes('attack')));
      if (attackChild && attackChild.roll) {
        if (typeof attackChild.roll === 'string') {
          attackRoll = attackChild.roll;
        } else if (typeof attackChild.roll === 'object') {
          attackRoll = attackChild.roll.calculation || attackChild.roll.value || 'use_spell_attack_bonus';
        }
      }

      // Extract damage rolls from children
      const damageRolls = [];
      spellChildren.filter(c => c.type === 'damage' || (c.type === 'roll' && c.name && (c.name.toLowerCase().includes('damage') || c.name.toLowerCase().includes('heal')))).forEach(damageChild => {
        let formula = '';
        // Try amount field first (standard damage property)
        if (damageChild.amount) {
          if (typeof damageChild.amount === 'string') {
            formula = damageChild.amount;
          } else if (typeof damageChild.amount === 'object') {
            formula = damageChild.amount.calculation || String(damageChild.amount.value || '');
          }
        }
        // Fallback to roll field (alternative structure)
        else if (damageChild.roll) {
          if (typeof damageChild.roll === 'string') {
            formula = damageChild.roll;
          } else if (typeof damageChild.roll === 'object') {
            formula = damageChild.roll.calculation || String(damageChild.roll.value || '');
          }
        }
        // Fallback to damage field
        else if (damageChild.damage) {
          if (typeof damageChild.damage === 'string') {
            formula = damageChild.damage;
          } else if (typeof damageChild.damage === 'object') {
            formula = damageChild.damage.calculation || String(damageChild.damage.value || '');
          }
        }

        if (formula) {
          damageRolls.push({
            formula: formula,
            type: damageChild.damageType || '',
            name: damageChild.name || ''
          });
        }
      });

      // First damage roll for backward compatibility
      const damage = damageRolls.length > 0 ? damageRolls[0].formula : '';
      const damageType = damageRolls.length > 0 ? damageRolls[0].type : '';

      // Determine spell type (damage, healing, utility)
      let spellType = 'utility';
      if (damageRolls.length > 0) {
        // Check if any damage roll is healing type
        const hasHealingRoll = damageRolls.some(roll =>
          roll.name.toLowerCase().includes('heal') ||
          roll.type.toLowerCase().includes('heal')
        );

        // Also check spell name for healing keywords
        const spellName = (spell.name || '').toLowerCase();
        const hasHealingName = spellName.includes('heal') ||
          spellName.includes('cure') ||
          spellName.includes('regenerat') ||
          spellName.includes('revivif') ||
          spellName.includes('restoration') ||
          spellName.includes('raise') ||
          spellName.includes('resurrect');

        // Check description for healing keywords
        const spellDesc = extractText(spell.description).toLowerCase();
        const hasHealingDesc = spellDesc.includes('regain') && spellDesc.includes('hit point');

        spellType = (hasHealingRoll || hasHealingName || hasHealingDesc) ? 'healing' : 'damage';
      }

      return {
        id: spell._id,
        name: spell.name || 'Unnamed Spell',
        level: spell.level || 0,
        school: spell.school || '',
        spellType: spellType,
        castingTime: spell.castingTime || '',
        range: spell.range || '',
        components: spell.components || '',
        duration: spell.duration || '',
        description: extractText(spell.description),
        summary: extractText(spell.summary),
        ritual: spell.ritual || false,
        concentration: spell.concentration || false,
        prepared: spell.prepared !== false,
        alwaysPrepared: spell.alwaysPrepared || false,
        attackRoll: attackRoll,
        damage: damage,
        damageType: damageType,
        damageRolls: damageRolls
      };
    });

  // Parse actions from properties (exclude inactive/disabled)
  const actions = properties
    .filter(p => p.type === 'action' && p.name && !p.inactive && !p.disabled)
    .map(action => {
      // Extract attack roll and damage from the action
      let attackRoll = '';
      if (action.attackRoll) {
        attackRoll = typeof action.attackRoll === 'string' ? action.attackRoll : String(action.attackRoll.value || action.attackRoll.calculation || '');
      }

      let damage = '';
      let damageType = '';
      if (action.damage) {
        damage = typeof action.damage === 'string' ? action.damage : String(action.damage.value || action.damage.calculation || '');
      }
      if (action.damageType) {
        damageType = action.damageType;
      }

      // Extract uses properly - DiceCloud stores uses/quantity as objects with value/max
      let uses = null;
      if (action.uses && typeof action.uses === 'object') {
        uses = {
          value: action.uses.value || action.uses.currentValue || 0,
          max: action.uses.max || action.uses.total || 0
        };
      } else if (action.quantity && typeof action.quantity === 'object') {
        uses = {
          value: action.quantity.value || action.quantity.currentValue || 0,
          max: action.quantity.max || action.quantity.total || 0
        };
      }

      return {
        id: action._id,
        name: action.name,
        actionType: action.actionType || 'action',
        description: extractText(action.description),
        summary: extractText(action.summary),
        attackRoll: attackRoll,
        damage: damage,
        damageType: damageType,
        uses: uses,
        reset: action.reset || '',
        resources: action.resources || {},
        tags: action.tags || []
      };
    });

  // Parse spell slots from variables
  // DiceCloud uses: slotLevel1, slotLevel2, etc.
  const spellSlots = {};
  for (let level = 1; level <= 9; level++) {
    const slotVar = variables[`slotLevel${level}`];
    if (slotVar) {
      const current = slotVar.value || 0;
      const max = slotVar.total || slotVar.max || slotVar.value || 0;
      spellSlots[`level${level}SpellSlots`] = current;
      spellSlots[`level${level}SpellSlotsMax`] = max;
    }
  }

  // Parse resources from properties (only resource-type attributes)
  const resources = properties
    .filter(p => p.type === 'resource' || (p.type === 'attribute' && p.attributeType === 'resource'))
    .map(resource => ({
      id: resource._id,
      name: resource.name || 'Unnamed Resource',
      current: resource.value || resource.currentValue || 0,
      max: resource.total || resource.max || 0,
      reset: resource.reset || '',
      variableName: resource.variableName || resource.varName || ''
    }));

  // Parse inventory from properties (items, equipment, and containers, exclude inactive)
  const inventory = properties
    .filter(p => (p.type === 'item' || p.type === 'equipment' || p.type === 'container') && !p.inactive)
    .map(item => ({
      id: item._id,
      name: item.name || 'Unnamed Item',
      quantity: item.quantity || 1,
      weight: item.weight || 0,
      value: item.value || 0,
      description: extractText(item.description),
      summary: extractText(item.summary),
      equipped: item.equipped || false,
      attuned: item.attuned || false,
      requiresAttunement: item.requiresAttunement || false
    }));

  // Parse features from properties (features, traits, proficiencies, exclude inactive)
  // List of D&D 5e skills to exclude from features
  const skillNames = ['acrobatics', 'animal handling', 'arcana', 'athletics', 'deception',
                      'history', 'insight', 'intimidation', 'investigation', 'medicine',
                      'nature', 'perception', 'performance', 'persuasion', 'religion',
                      'sleight of hand', 'stealth', 'survival'];

  const features = properties
    .filter(p => {
      if (p.inactive || p.disabled) return false;
      if (p.type === 'feature' || p.type === 'trait' || p.type === 'buff') return true;

      // For proficiencies, exclude skill proficiencies
      if (p.type === 'proficiency') {
        const name = (p.name || '').toLowerCase().trim();
        return !skillNames.includes(name);
      }

      return false;
    })
    .map(feature => {
      // Extract uses properly - DiceCloud stores uses/quantity as objects with value/max
      let uses = null;

      // Debug logging for features with "blessed" or "channel" in the name
      if (feature.name && (feature.name.toLowerCase().includes('blessed') || feature.name.toLowerCase().includes('channel'))) {
        console.log(`🔍 Feature "${feature.name}" raw data:`, {
          uses: feature.uses,
          quantity: feature.quantity,
          reset: feature.reset,
          usesUsed: feature.usesUsed
        });
      }

      if (feature.uses && typeof feature.uses === 'object') {
        uses = {
          value: feature.uses.value || feature.uses.currentValue || 0,
          max: feature.uses.max || feature.uses.total || 0
        };
      } else if (feature.quantity && typeof feature.quantity === 'object') {
        uses = {
          value: feature.quantity.value || feature.quantity.currentValue || 0,
          max: feature.quantity.max || feature.quantity.total || 0
        };
      }

      return {
        id: feature._id,
        name: feature.name || 'Unnamed Feature',
        description: extractText(feature.description),
        summary: extractText(feature.summary),
        uses: uses,
        reset: feature.reset || '',
        tags: feature.tags || []
      };
    });

  return {
    name: characterName,
    race,
    class: characterClass || 'Unknown',
    level,
    background: '',
    alignment: creature.alignment || '',
    attributes,
    attributeMods,
    saves,
    skills,
    hitPoints: {
      current: variables.hitPoints?.currentValue ?? variables.hitPoints?.value ?? 0,
      max: variables.hitPoints?.total ?? variables.hitPoints?.max ?? 0
    },
    temporaryHP: variables.temporaryHitPoints?.value ?? variables.temporaryHitPoints?.currentValue ?? 0,
    armorClass: calculateAC(),
    speed: variables.speed?.total || variables.speed?.value || 30,
    initiative: variables.initiative?.total || variables.initiative?.value || 0,
    proficiencyBonus: variables.proficiencyBonus?.total || variables.proficiencyBonus?.value || 0,
    spellSlots,
    resources,
    inventory,
    spells,
    actions,
    features
  };
}

/**
 * Parse raw DiceCloud data into Owlbear Rodeo-specific format
 * Called by OwlCloud adapter when tab is loaded
 */
function parseForOwlCloud(rawData) {
  // For now, use same format as Roll20
  return parseForRollCloud(rawData);
}

/**
 * Parse raw DiceCloud data into Foundry VTT-specific format
 * Called by FoundCloud adapter when tab is loaded
 */
function parseForFoundCloud(rawData) {
  // For now, use same format as Roll20
  // TODO: Customize for Foundry VTT's data structure
  return parseForRollCloud(rawData);
}

// Expose functions to global scope for use in popover.js
if (typeof window !== 'undefined') {
  window.parseCharacterData = parseCharacterData;
  window.parseForRollCloud = parseForRollCloud;
}
