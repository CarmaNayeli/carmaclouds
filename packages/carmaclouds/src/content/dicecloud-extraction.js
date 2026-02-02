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
export function parseCharacterData(apiData, characterId) {
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

  console.log('CarmaClouds: Extracting race, class, level from properties...');
  for (const prop of properties) {
    if (!prop) continue;

    // Extract race
    if (prop.type === 'race' || prop.type === 'species' || prop.type === 'characterRace') {
      if (prop.name) {
        characterRace = prop.name;
        console.log('CarmaClouds: Found race:', characterRace);
      }
    }

    // Extract class
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

    // Extract level
    if (prop.type === 'classLevel' && !prop.inactive && !prop.disabled) {
      characterLevel += 1;
      if (prop.name) {
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
    }
  }

  console.log('CarmaClouds: Extracted race:', characterRace, 'class:', characterClass || 'Unknown', 'level:', characterLevel);

  const characterData = {
    id: creature._id || characterId,
    name: creature.name || '',
    race: characterRace,
    class: characterClass || 'Unknown',
    level: characterLevel,
    background: '',
    alignment: creature.alignment || '',
    attributes: {},
    attributeMods: {},
    saves: {},
    skills: {},
    hitPoints: {
      current: (variables.hitPoints && (variables.hitPoints.currentValue ?? variables.hitPoints.value)) || 0,
      max: (variables.hitPoints && (variables.hitPoints.total ?? variables.hitPoints.max)) || 0
    },
    temporaryHP: (variables.temporaryHitPoints && (variables.temporaryHitPoints.value ?? variables.temporaryHitPoints.currentValue)) || 0,
    armorClass: calculateArmorClass(),
    speed: (variables.speed && (variables.speed.total || variables.speed.value)) || 30,
    initiative: (variables.initiative && (variables.initiative.total || variables.initiative.value)) || 0,
    proficiencyBonus: (variables.proficiencyBonus && (variables.proficiencyBonus.total || variables.proficiencyBonus.value)) || 0,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    source: 'dicecloud',
    rawDiceCloudData: {
      creature: creature,
      variables: variables,
      properties: properties
    }
  };

  // Extract ability scores
  STANDARD_VARS.abilities.forEach(ability => {
    if (variables[ability]) {
      characterData.attributes[ability] = variables[ability].total || variables[ability].value || 10;
    } else {
      characterData.attributes[ability] = 10; // Default
    }
  });

  // Calculate modifiers
  Object.keys(characterData.attributes).forEach(attr => {
    const score = characterData.attributes[attr] || 10;
    characterData.attributeMods[attr] = Math.floor((score - 10) / 2);
  });

  // Extract saves
  STANDARD_VARS.saves.forEach(save => {
    if (variables[save]) {
      const abilityName = save.replace('Save', '');
      characterData.saves[abilityName] = variables[save].total || variables[save].value || 0;
    }
  });

  // Extract skills
  STANDARD_VARS.skills.forEach(skill => {
    if (variables[skill]) {
      characterData.skills[skill] = variables[skill].total || variables[skill].value || 0;
    }
  });

  console.log('CarmaClouds: Successfully parsed character data:', characterData.name);
  return characterData;
}
