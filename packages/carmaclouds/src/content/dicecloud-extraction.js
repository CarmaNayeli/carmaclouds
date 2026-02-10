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
 * Validates if a property should be included (compensates for DiceCloud API cache issues)
 * Returns false for inactive, disabled, or likely-deleted items
 */
function isValidProperty(property) {
  if (!property) return false;

  // Filter out explicitly inactive or disabled items
  if (property.inactive === true || property.disabled === true) return false;

  // Filter out removed items (DiceCloud sometimes uses this flag)
  if (property.removed === true || property.soft_removed === true) return false;

  // Filter out items with null/undefined critical IDs (corrupted data)
  if (!property._id && !property.id) return false;

  return true;
}

/**
 * Normalizes a name for duplicate detection
 * Handles common variations: "Use a d8 Hit Die" vs "Using a d8 Hit Dice"
 */
function normalizeNameForDedupe(name) {
  if (!name) return '';

  return name
    .toLowerCase()
    .trim()
    // Remove common articles and prepositions
    .replace(/\b(a|an|the)\b/g, '')
    // Normalize verb forms (using -> use, adding -> add, etc)
    .replace(/ing\b/g, '')
    // Normalize plurals (dice -> die, dies -> die)
    .replace(/dice/g, 'die')
    .replace(/ies\b/g, 'y')
    .replace(/s\b/g, '')
    // Remove all non-alphanumeric except spaces
    .replace(/[^a-z0-9\s]/g, '')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Deduplicates an array of items based on normalized name similarity
 * Keeps the first occurrence of each unique normalized name
 */
function deduplicateByName(items) {
  const seen = new Set();
  return items.filter(item => {
    const normalized = normalizeNameForDedupe(item.name);
    if (seen.has(normalized)) {
      return false; // Skip duplicate
    }
    seen.add(normalized);
    return true;
  });
}

/**
 * Evaluates DiceCloud conditional expressions in text
 * Handles patterns like: [variable > 1 ? "text" : ""] or [variable ? "text" : ""]
 * @param {string} text - Text potentially containing conditionals
 * @param {object} variables - DiceCloud variables object for evaluation
 * @returns {string} Text with conditionals evaluated or cleaned
 */
function evaluateConditionals(text, variables = {}) {
  if (!text || typeof text !== 'string') return text;

  // Match DiceCloud conditional syntax: [condition ? "text" : "fallback"]
  // Supports nested quotes and multiple conditions
  const conditionalPattern = /\[([^\[\]]+)\s*\?\s*"([^"]*)"\s*:\s*"([^"]*)"\]/g;

  let result = text;
  let match;

  while ((match = conditionalPattern.exec(text)) !== null) {
    const fullMatch = match[0];
    const condition = match[1].trim();
    const trueText = match[2];
    const falseText = match[3];

    // Try to evaluate the condition
    let shouldShow = false;

    // Handle comparison operators: >, <, >=, <=, ==, !=
    const comparisonMatch = condition.match(/^(\w+)\s*(>|<|>=|<=|==|!=)\s*(.+)$/);
    if (comparisonMatch) {
      const varName = comparisonMatch[1];
      const operator = comparisonMatch[2];
      const compareValue = comparisonMatch[3].trim();

      // Get variable value (case-sensitive first, then try lowercase)
      let varValue = variables[varName];
      if (varValue === undefined) {
        varValue = variables[varName.toLowerCase()];
      }

      // Convert to number if possible
      const numVarValue = parseFloat(varValue);
      const numCompareValue = parseFloat(compareValue);

      if (!isNaN(numVarValue) && !isNaN(numCompareValue)) {
        switch (operator) {
          case '>': shouldShow = numVarValue > numCompareValue; break;
          case '<': shouldShow = numVarValue < numCompareValue; break;
          case '>=': shouldShow = numVarValue >= numCompareValue; break;
          case '<=': shouldShow = numVarValue <= numCompareValue; break;
          case '==': shouldShow = numVarValue === numCompareValue; break;
          case '!=': shouldShow = numVarValue !== numCompareValue; break;
        }
      } else {
        // String comparison fallback
        switch (operator) {
          case '==': shouldShow = varValue == compareValue; break;
          case '!=': shouldShow = varValue != compareValue; break;
        }
      }
    } else {
      // Simple boolean check (variable exists and is truthy)
      const varName = condition;
      let varValue = variables[varName];
      if (varValue === undefined) {
        varValue = variables[varName.toLowerCase()];
      }

      // Check if truthy (non-zero, non-empty, true)
      shouldShow = !!(varValue && varValue !== 0 && varValue !== '0' && varValue !== false);
    }

    // Replace the conditional with the appropriate text
    result = result.replace(fullMatch, shouldShow ? trueText : falseText);
  }

  return result;
}

/**
 * Evaluates and cleans damage formulas by substituting variables
 * Handles DiceCloud formula syntax like: 1d10 + floor((level+1)/6)d10
 * @param {string} formula - Damage formula potentially containing variables
 * @param {object} variables - DiceCloud variables object for evaluation
 * @returns {string} Formula with variables evaluated
 */
function evaluateDamageFormula(formula, variables = {}) {
  if (!formula || typeof formula !== 'string') return formula;

  let result = formula;

  // Helper to get variable value (case-insensitive)
  const getVar = (name) => {
    if (!name) return undefined;
    // Try exact case first
    if (variables[name] !== undefined) {
      return variables[name];
    }
    // Try lowercase
    const lower = name.toLowerCase();
    if (variables[lower] !== undefined) {
      return variables[lower];
    }
    return undefined;
  };

  // Replace variable references with their values
  // Match word boundaries to avoid partial replacements
  const variablePattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;

  result = result.replace(variablePattern, (match, varName) => {
    // Don't replace dice notation (d followed by numbers)
    if (varName === 'd' || varName === 'D') return match;

    // Don't replace common math functions
    if (['floor', 'ceil', 'round', 'abs', 'min', 'max'].includes(varName.toLowerCase())) {
      return match;
    }

    const value = getVar(varName);
    if (value !== undefined) {
      // Convert to number if possible
      const numValue = parseFloat(value);
      return isNaN(numValue) ? match : String(numValue);
    }

    return match;
  });

  // Evaluate mathematical expressions safely
  try {
    // Only evaluate if the formula contains parentheses or operators (not just dice notation)
    if (/[\(\)\+\-\*\/]/.test(result)) {
      // Replace floor/ceil/round with Math equivalents for evaluation
      let evalFormula = result
        .replace(/\bfloor\s*\(/gi, 'Math.floor(')
        .replace(/\bceil\s*\(/gi, 'Math.ceil(')
        .replace(/\bround\s*\(/gi, 'Math.round(')
        .replace(/\babs\s*\(/gi, 'Math.abs(')
        .replace(/\bmin\s*\(/gi, 'Math.min(')
        .replace(/\bmax\s*\(/gi, 'Math.max(');

      // Extract dice notation parts to preserve them
      const diceParts = [];
      evalFormula = evalFormula.replace(/(\d+)d(\d+)/gi, (match) => {
        diceParts.push(match);
        return `__DICE${diceParts.length - 1}__`;
      });

      // Try to evaluate the non-dice parts
      // Split by dice placeholders and evaluate each numeric part
      const parts = evalFormula.split(/(__DICE\d+__)/);
      const evaluatedParts = parts.map(part => {
        if (part.startsWith('__DICE')) {
          const index = parseInt(part.match(/\d+/)[0]);
          return diceParts[index];
        }

        // Try to evaluate as math expression
        try {
          // Only evaluate if it's a pure math expression (no letters except Math functions)
          if (!/[a-zA-Z]/.test(part.replace(/Math\.(floor|ceil|round|abs|min|max)/g, ''))) {
            const evaluated = eval(part);
            if (!isNaN(evaluated) && isFinite(evaluated)) {
              return String(evaluated);
            }
          }
        } catch (e) {
          // If evaluation fails, return original
        }

        return part;
      });

      result = evaluatedParts.join('');
    }
  } catch (e) {
    // If evaluation fails, return the variable-substituted version
    console.warn('Failed to evaluate damage formula:', formula, e);
  }

  // Clean up any malformed syntax
  result = result
    .replace(/\)\s*d\s*s/gi, 'd10')  // Fix ")ds" artifacts
    .replace(/\(\s*\)/g, '')  // Remove empty parentheses
    .replace(/\+\s*\+/g, '+')  // Fix double plus signs
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .trim();

  return result;
}

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
      const commonRaces = ['half-elf', 'half-orc', 'dragonborn', 'tiefling', 'halfling', 'human', 'elf', 'dwarf', 'gnome', 'orc', 'goblin', 'kobold', 'warforged', 'tabaxi', 'kenku', 'aarakocra', 'genasi', 'aasimar', 'firbolg', 'goliath', 'triton', 'yuan-ti', 'tortle', 'lizardfolk', 'bugbear', 'hobgoblin', 'changeling', 'shifter', 'kalashtar'];
      const nameMatchesRace = commonRaces.some(race => new RegExp(`\\b${race}\\b`, 'i').test(prop.name));
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
    if (prop.type === 'class' && prop.name && isValidProperty(prop)) {
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
        
        // Skip generic labels like "Sub Race" - they're not actual subraces
        if (subraceName && subraceName.toLowerCase() === 'sub race') {
          console.log('CarmaClouds: Skipping generic "Sub Race" label, looking for actual subrace...');
          subraceName = null;
        }
      }
      
      // If no valid subrace found, look for specific subrace variables
      if (!subraceName) {
        const subraceKeywords = ['fire', 'water', 'air', 'earth', 'firegenasi', 'watergenasi', 'airgenasi', 'earthgenasi'];
        for (const varName of raceVars) {
          const varValue = variables[varName];
          const varNameLower = varName.toLowerCase();
          
          // Check if variable name contains subrace keyword and has truthy value
          if (subraceKeywords.some(kw => varNameLower.includes(kw))) {
            const isActive = typeof varValue === 'boolean' ? varValue : 
                            (typeof varValue === 'object' && varValue !== null && varValue.value === true);
            
            if (isActive || varValue === true) {
              // Extract subrace from variable name
              if (varNameLower.includes('fire')) subraceName = 'Fire';
              else if (varNameLower.includes('water')) subraceName = 'Water';
              else if (varNameLower.includes('air')) subraceName = 'Air';
              else if (varNameLower.includes('earth')) subraceName = 'Earth';
              
              if (subraceName) {
                console.log('CarmaClouds: Found subrace from variable:', varName, '->', subraceName);
                break;
              }
            }
          }
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
export function parseForRollCloud(rawData) {
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
      const commonRaces = ['half-elf', 'half-orc', 'dragonborn', 'tiefling', 'halfling', 'human', 'elf', 'dwarf', 'gnome', 'orc', 'goblin', 'kobold', 'warforged', 'tabaxi', 'kenku', 'aarakocra', 'genasi', 'aasimar', 'firbolg', 'goliath', 'triton', 'yuan-ti', 'tortle', 'lizardfolk', 'bugbear', 'hobgoblin', 'changeling', 'shifter', 'kalashtar'];
      const nameMatchesRace = commonRaces.some(r => new RegExp(`\\b${r}\\b`, 'i').test(prop.name));
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

    if (prop.type === 'class' && prop.name && isValidProperty(prop)) {
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

  // Helper to extract text from DiceCloud text objects and evaluate conditionals
  const extractText = (field) => {
    if (!field) return '';
    let text = '';
    if (typeof field === 'string') {
      text = field;
    } else if (typeof field === 'object' && field.text) {
      text = field.text;
    }
    // Evaluate any conditional expressions using the character's variables
    return evaluateConditionals(text, variables);
  };

  // Parse spells from properties with child attack/damage extraction (exclude inactive/disabled)
  const spells = properties
    .filter(p => p.type === 'spell' && isValidProperty(p))
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

      // If no attack child found, check description for spell attack mentions
      if (!attackRoll) {
        const spellDescription = extractText(spell.description).toLowerCase();
        const spellSummary = extractText(spell.summary).toLowerCase();
        const fullText = `${spellDescription} ${spellSummary}`;

        // Check for ranged or melee spell attack mentions
        const hasSpellAttack = /\b(ranged spell attack|melee spell attack|spell attack roll)\b/.test(fullText);

        if (hasSpellAttack) {
          // Use special flag to indicate spell attack bonus should be used
          attackRoll = 'use_spell_attack_bonus';
          console.log(`✨ Detected spell attack in description for "${spell.name}", using spell attack bonus`);
        }
      }

      // Evaluate variables in attack roll formula
      if (attackRoll && attackRoll !== 'use_spell_attack_bonus') {
        attackRoll = evaluateDamageFormula(attackRoll, variables);
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
          // Evaluate variables in damage formula
          const evaluatedFormula = evaluateDamageFormula(formula, variables);
          damageRolls.push({
            formula: evaluatedFormula,
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

      // Detect lifesteal spells (damage + healing based on damage dealt)
      // These spells have both a damage roll and a healing roll, where healing is based on damage
      let isLifesteal = false;
      if (damageRolls.length >= 2) {
        const hasDamageRoll = damageRolls.some(roll =>
          roll.type && roll.type.toLowerCase() !== 'healing'
        );
        const hasHealingRoll = damageRolls.some(roll =>
          roll.type && roll.type.toLowerCase() === 'healing'
        );

        // Check if spell name or description indicates lifesteal
        const spellName = (spell.name || '').toLowerCase();
        const spellDesc = extractText(spell.description).toLowerCase();
        const isVampiric = spellName.includes('vampiric') ||
                          spellDesc.includes('regain') && spellDesc.includes('damage');

        isLifesteal = hasDamageRoll && hasHealingRoll && isVampiric;
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
        damageRolls: damageRolls,
        isLifesteal: isLifesteal
      };
    });

  // Parse actions from properties (exclude inactive/disabled)
  const actions = properties
    .filter(p => p.type === 'action' && p.name && isValidProperty(p))
    .map(action => {
      // Find child properties (attack rolls, damage) for this action
      const actionChildren = properties.filter(p => {
        if (p.type !== 'roll' && p.type !== 'damage' && p.type !== 'attack') return false;
        if (p.ancestors && Array.isArray(p.ancestors)) {
          return p.ancestors.some(ancestor => {
            const ancestorId = typeof ancestor === 'object' ? ancestor.id : ancestor;
            return ancestorId === action._id;
          });
        }
        return false;
      });

      // Extract attack roll from action or children
      let attackRoll = '';
      if (action.attackRoll) {
        attackRoll = typeof action.attackRoll === 'string' ? action.attackRoll : String(action.attackRoll.value || action.attackRoll.calculation || '');
      } else {
        // Check children for attack roll
        const attackChild = actionChildren.find(c => c.type === 'attack' || (c.type === 'roll' && c.name && c.name.toLowerCase().includes('attack')));
        if (attackChild && attackChild.roll) {
          if (typeof attackChild.roll === 'string') {
            attackRoll = attackChild.roll;
          } else if (typeof attackChild.roll === 'object') {
            attackRoll = attackChild.roll.calculation || attackChild.roll.value || '';
          }
        }
      }

      // Evaluate variables in attack roll formula
      if (attackRoll) {
        attackRoll = evaluateDamageFormula(attackRoll, variables);
      }

      // Extract damage from action or children
      let damage = '';
      let damageType = '';
      if (action.damage) {
        damage = typeof action.damage === 'string' ? action.damage : String(action.damage.value || action.damage.calculation || '');
      } else {
        // Check children for damage
        const damageChild = actionChildren.find(c => c.type === 'damage' || (c.type === 'roll' && c.name && c.name.toLowerCase().includes('damage')));
        if (damageChild) {
          // Try amount field first (standard damage property)
          if (damageChild.amount) {
            if (typeof damageChild.amount === 'string') {
              damage = damageChild.amount;
            } else if (typeof damageChild.amount === 'object') {
              damage = damageChild.amount.calculation || String(damageChild.amount.value || '');
            }
          }
          // Fallback to roll field
          else if (damageChild.roll) {
            if (typeof damageChild.roll === 'string') {
              damage = damageChild.roll;
            } else if (typeof damageChild.roll === 'object') {
              damage = damageChild.roll.calculation || String(damageChild.roll.value || '');
            }
          }
          // Fallback to damage field
          else if (damageChild.damage) {
            if (typeof damageChild.damage === 'string') {
              damage = damageChild.damage;
            } else if (typeof damageChild.damage === 'object') {
              damage = damageChild.damage.calculation || String(damageChild.damage.value || '');
            }
          }

          // Extract damage type from child
          if (damageChild.damageType) {
            damageType = damageChild.damageType;
          }
        }
      }

      // Evaluate variables in damage formula
      if (damage) {
        damage = evaluateDamageFormula(damage, variables);
      }

      // Check if this is a finesse weapon and add appropriate ability modifier to damage
      if (damage && attackRoll) {
        const tags = action.tags || [];
        const description = extractText(action.description).toLowerCase();
        const summary = extractText(action.summary).toLowerCase();

        // Check if finesse weapon
        const isFinesse = tags.some(t => typeof t === 'string' && t.toLowerCase().includes('finesse')) ||
                          description.includes('finesse') ||
                          summary.includes('finesse');

        if (isFinesse) {
          // Check if damage already includes an ability modifier
          // Look for patterns like "+X" where X is a single/double digit number
          const hasAbilityMod = /\+\s*\d{1,2}(?!\d)/.test(damage) || /dexterityMod|strengthMod|dexMod|strMod/i.test(damage);

          if (!hasAbilityMod) {
            // Get STR and DEX mods
            const strMod = parseFloat(variables.strengthMod || variables.strengthmod || 0);
            const dexMod = parseFloat(variables.dexterityMod || variables.dexteritymod || 0);

            // Use higher of STR or DEX for finesse
            const abilityMod = Math.max(strMod, dexMod);

            if (abilityMod > 0) {
              damage = `${damage} + ${abilityMod}`;
            } else if (abilityMod < 0) {
              damage = `${damage} - ${Math.abs(abilityMod)}`;
            }
          }
        }
      }

      // Fallback to action's damageType if not found in child
      if (!damageType && action.damageType) {
        damageType = action.damageType;
      }

      // Determine action type from tags or name
      // Valid values: 'action', 'bonus', 'reaction', 'free' (must match filter buttons)
      let actionType = 'action'; // default
      const tags = action.tags || [];
      const nameLower = (action.name || '').toLowerCase();
      const summaryLower = extractText(action.summary).toLowerCase();
      
      // Check tags first (most reliable)
      if (tags.some(t => typeof t === 'string' && t.toLowerCase().includes('bonus'))) {
        actionType = 'bonus';
      } else if (tags.some(t => typeof t === 'string' && t.toLowerCase().includes('reaction'))) {
        actionType = 'reaction';
      } else if (tags.some(t => typeof t === 'string' && t.toLowerCase().includes('free'))) {
        actionType = 'free';
      } else if (tags.some(t => typeof t === 'string' && (t.toLowerCase().includes('legendary') || t.toLowerCase().includes('lair')))) {
        actionType = 'free'; // Legendary actions shown as free actions
      } else if (tags.some(t => typeof t === 'string' && t.toLowerCase().includes('attack'))) {
        actionType = 'action'; // Attacks are actions
      }
      // Check name/summary if tags didn't match
      else if (nameLower.includes('bonus action') || summaryLower.includes('bonus action')) {
        actionType = 'bonus';
      } else if (nameLower.includes('reaction') || summaryLower.includes('reaction')) {
        actionType = 'reaction';
      } else if (nameLower.includes('free action') || summaryLower.includes('free action')) {
        actionType = 'free';
      } else if (attackRoll || damage) {
        // Has attack or damage, likely an attack action
        actionType = 'action';
      }

      return {
        id: action._id,
        name: action.name,
        actionType: actionType,
        description: extractText(action.description),
        summary: extractText(action.summary),
        attackRoll: attackRoll,
        damage: damage,
        damageType: damageType,
        uses: action.uses || 0,
        usesUsed: action.usesUsed || 0,
        reset: action.reset || '',
        resources: action.resources || {},
        tags: action.tags || []
      };
    });

  // Parse spell slots from variables
  // DiceCloud uses: slotLevel1, slotLevel2, etc.
  const spellSlots = {};
  console.log('🔮 Parsing spell slots from variables...');
  console.log('🔮 Available variables:', Object.keys(variables).filter(k => k.toLowerCase().includes('slot')));
  for (let level = 1; level <= 9; level++) {
    const slotVar = variables[`slotLevel${level}`];
    if (slotVar) {
      const current = slotVar.value || 0;
      const max = slotVar.total || slotVar.max || slotVar.value || 0;
      console.log(`🔮 Level ${level} spell slots:`, { current, max, slotVar });
      spellSlots[`level${level}`] = {
        current: current,
        max: max
      };
    }
  }
  console.log('🔮 Final spell slots:', spellSlots);

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
    .filter(p => (p.type === 'item' || p.type === 'equipment' || p.type === 'container') && isValidProperty(p))
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

  // Parse triggers from properties (conditional modifiers)
  const triggers = properties
    .filter(p => p.type === 'trigger' && isValidProperty(p))
    .map(trigger => {
      console.log('⚡ Found trigger:', {
        name: trigger.name,
        condition: trigger.condition,
        effects: trigger.effects,
        raw: trigger
      });

      return {
        id: trigger._id,
        name: trigger.name || 'Unnamed Trigger',
        condition: trigger.condition || '',
        description: extractText(trigger.description),
        summary: extractText(trigger.summary),
        tags: trigger.tags || [],
        // Store raw trigger data for edge case handlers
        raw: trigger
      };
    });

  console.log(`⚡ Parsed ${triggers.length} triggers:`, triggers.map(t => t.name));

  // Extract companions from features
  const companions = extractCompanions(properties);

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
    inventory: deduplicateByName(inventory),
    spells: deduplicateByName(spells),
    actions: deduplicateByName(actions),
    triggers: deduplicateByName(triggers),
    companions
  };
}

/**
 * Extract companions from properties (features with companion patterns)
 */
function extractCompanions(properties) {
  console.log('🐾 Extracting companions from features...');
  console.log('🐾 Total properties to check:', properties.length);
  
  // Debug: Check what types of properties we have
  const propertyTypes = new Set();
  properties.forEach(p => {
    if (p && p.type) propertyTypes.add(p.type);
  });
  console.log('🐾 Property types available:', Array.from(propertyTypes).sort());
  
  const companionPatterns = [
    /companion/i,
    /beast of/i,
    /familiar/i,
    /summon/i,
    /mount/i,
    /steel defender/i,
    /homunculus/i,
    /drake/i,
    /primal companion/i,
    /beast master/i,
    /ranger's companion/i
  ];

  const companions = [];
  
  // Check all properties, not just features - companions might be stored as actions, notes, or other types
  const potentialCompanions = properties.filter(p => {
    if (!p || !p.name || p.inactive) return false;
    return companionPatterns.some(pattern => pattern.test(p.name));
  });

  console.log(`🐾 Found ${potentialCompanions.length} properties matching companion patterns`);
  potentialCompanions.forEach(prop => {
    console.log(`🐾 Potential companion: "${prop.name}" (type: ${prop.type})`);
  });

  const seenCompanions = new Set();
  
  potentialCompanions.forEach(feature => {
    if (feature.description) {
      console.log(`🐾 Parsing companion: ${feature.name}`);
      const companion = parseCompanionStatBlock(feature.name, feature.description);
      if (companion) {
        // Deduplicate by companion name
        if (!seenCompanions.has(companion.name)) {
          companions.push(companion);
          seenCompanions.add(companion.name);
          console.log(`✅ Added companion: ${companion.name}`);
        } else {
          console.log(`⏭️ Skipping duplicate companion: ${companion.name}`);
        }
      } else {
        console.log(`⚠️ Failed to parse companion stat block for: ${feature.name}`);
      }
    } else {
      console.log(`⚠️ No description for potential companion: ${feature.name}`);
    }
  });

  console.log(`🐾 Total companions found: ${companions.length} (after deduplication)`);
  return companions;
}

/**
 * Parse companion stat block from description text
 */
function parseCompanionStatBlock(name, description) {
  let descText = typeof description === 'object' ? (description.value || description.text || '') : description;
  
  if (!descText || descText.trim() === '') return null;

  const companion = {
    name,
    size: '',
    type: '',
    alignment: '',
    ac: 0,
    hp: '',
    speed: '',
    abilities: {},
    senses: '',
    languages: '',
    proficiencyBonus: 0,
    features: [],
    actions: []
  };

  // Parse size/type (e.g., "Small beast, neutral")
  const sizeTypeMatch = descText.match(/(Tiny|Small|Medium|Large|Huge|Gargantuan)\s+(\w+),\s*(\w+)/i);
  if (sizeTypeMatch) {
    companion.size = sizeTypeMatch[1];
    companion.type = sizeTypeMatch[2];
    companion.alignment = sizeTypeMatch[3];
  }

  // Parse AC
  const acMatch = descText.match(/\*\*AC\*\*\s+(\d+)|AC\s+(\d+)/i);
  if (acMatch) companion.ac = parseInt(acMatch[1] || acMatch[2]);

  // Parse HP
  const hpMatch = descText.match(/\*\*HP\*\*\s+(\d+\s*\([^)]+\))|HP\s+(\d+\s*\([^)]+\))/i);
  if (hpMatch) companion.hp = hpMatch[1] || hpMatch[2];

  // Parse Speed
  const speedMatch = descText.match(/Speed\s+([^•\n]+)/i);
  if (speedMatch) companion.speed = speedMatch[1].trim();

  // Parse Abilities from markdown table
  const abilityLine = descText.match(/\|\s*(\d+)\s*\(([+\-]\d+)\)\s*\|\s*(\d+)\s*\(([+\-]\d+)\)\s*\|\s*(\d+)\s*\(([+\-]\d+)\)\s*\|\s*(\d+)\s*\(([+\-]\d+)\)\s*\|\s*(\d+)\s*\(([+\-]\d+)\)\s*\|\s*(\d+)\s*\(([+\-]\d+)\)\s*\|/);
  if (abilityLine) {
    const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    abilities.forEach((ability, i) => {
      const scoreIdx = (i * 2) + 1;
      const modIdx = (i * 2) + 2;
      if (abilityLine[scoreIdx] && abilityLine[modIdx]) {
        companion.abilities[ability] = {
          score: parseInt(abilityLine[scoreIdx]),
          modifier: parseInt(abilityLine[modIdx])
        };
      }
    });
  }

  // Parse Senses
  const sensesMatch = descText.match(/Senses\s+([^•\n]+)/i);
  if (sensesMatch) companion.senses = sensesMatch[1].trim();

  // Parse Languages
  const languagesMatch = descText.match(/Languages\s+([^•\n]+)/i);
  if (languagesMatch) companion.languages = languagesMatch[1].trim();

  // Parse Proficiency Bonus
  const pbMatch = descText.match(/Proficiency Bonus\s+(\d+)/i);
  if (pbMatch) companion.proficiencyBonus = parseInt(pbMatch[1]);

  // Parse Features (e.g., "***Flyby.*** Description")
  const featurePattern = /\*\*\*([^*\n.]+)\.\*\*\*\s*([^*\n]+)/gi;
  let featureMatch;
  while ((featureMatch = featurePattern.exec(descText)) !== null) {
    companion.features.push({
      name: featureMatch[1].trim(),
      description: featureMatch[2].trim()
    });
  }

  // Parse Actions
  const actionsMatch = descText.match(/###?\s*Actions\s+([\s\S]+)/i);
  if (actionsMatch) {
    const actionsText = actionsMatch[1];
    const attackLines = actionsText.split('\n').filter(line => line.includes('***') && line.includes('Melee Weapon Attack'));
    
    attackLines.forEach(attackLine => {
      const nameMatch = attackLine.match(/\*\*\*(\w+)\.\*\*\*/);
      const bonusMatch = attackLine.match(/\*\*(\+\d+)\*\*/);
      const reachMatch = attackLine.match(/reach\s*([\d\s]+ft\.)/);
      const damageMatch = attackLine.match(/\*?Hit:\*?\s*\*\*([^*]+?)\*\*/);
      
      if (nameMatch && bonusMatch && reachMatch && damageMatch) {
        companion.actions.push({
          name: nameMatch[1].trim(),
          type: 'attack',
          attackBonus: parseInt(bonusMatch[1]),
          reach: reachMatch[1].trim(),
          damage: damageMatch[1].trim()
        });
      }
    });
  }

  // Only return if we found at least some stats
  if (companion.ac > 0 || companion.hp || Object.keys(companion.abilities).length > 0) {
    return companion;
  }

  return null;
}

/**
 * Parse raw DiceCloud data into Owlbear Rodeo-specific format
 * Called by OwlCloud adapter when tab is loaded
 */
export function parseForOwlCloud(rawData) {
  // For now, use same format as Roll20
  return parseForRollCloud(rawData);
}

/**
 * Parse raw DiceCloud data into Foundry VTT-specific format
 * Maps to Foundry's D&D 5e system structure
 */
export function parseForFoundCloud(rawData, characterId = null) {
  console.log('🎲 Parsing character for Foundry VTT...');

  // First parse using RollCloud format to get standardized data
  const rollCloudData = parseForRollCloud(rawData, characterId);

  // Map to Foundry D&D 5e actor structure
  const foundryData = {
    // Basic info
    id: characterId || rollCloudData.id,
    name: rollCloudData.name,
    type: 'character',
    
    // Attributes (abilities)
    attributes: {
      strength: rollCloudData.attributes?.strength || 10,
      dexterity: rollCloudData.attributes?.dexterity || 10,
      constitution: rollCloudData.attributes?.constitution || 10,
      intelligence: rollCloudData.attributes?.intelligence || 10,
      wisdom: rollCloudData.attributes?.wisdom || 10,
      charisma: rollCloudData.attributes?.charisma || 10,
      STR: rollCloudData.attributes?.strength || 10,
      DEX: rollCloudData.attributes?.dexterity || 10,
      CON: rollCloudData.attributes?.constitution || 10,
      INT: rollCloudData.attributes?.intelligence || 10,
      WIS: rollCloudData.attributes?.wisdom || 10,
      CHA: rollCloudData.attributes?.charisma || 10
    },

    // Hit points
    hit_points: {
      current: rollCloudData.hitPoints?.current || 0,
      max: rollCloudData.hitPoints?.max || 0
    },

    // Core stats
    armor_class: rollCloudData.armorClass || 10,
    speed: rollCloudData.speed || 30,
    initiative: rollCloudData.initiative || 0,
    proficiency_bonus: rollCloudData.proficiencyBonus || 2,

    // Character details
    level: rollCloudData.level || 1,
    race: rollCloudData.race || 'Unknown',
    class: rollCloudData.class || 'Unknown',
    alignment: rollCloudData.alignment || '',
    background: rollCloudData.background || '',

    // Skills (map to Foundry format)
    skills: rollCloudData.skills || {},

    // Saves
    saves: rollCloudData.saves || {},

    // Death saves
    death_saves: rollCloudData.deathSaves || { successes: 0, failures: 0 },

    // Inspiration
    inspiration: rollCloudData.inspiration || false,

    // Temporary HP
    temporary_hp: rollCloudData.hitPoints?.temp || 0,

    // Spells (keep full spell data)
    spells: rollCloudData.spells || [],
    spell_slots: rollCloudData.spellSlots || {},

    // Actions (keep full action data)
    actions: rollCloudData.actions || [],

    // Inventory
    inventory: rollCloudData.inventory || [],

    // Resources
    resources: rollCloudData.resources || [],

    // Companions
    companions: rollCloudData.companions || [],

    // Raw DiceCloud data for advanced features
    raw_dicecloud_data: {
      creature: rawData.creature || {},
      variables: rawData.variables || {},
      properties: rawData.properties || [],
      picture: rawData.creature?.picture,
      description: rawData.creature?.description,
      flySpeed: extractVariable(rawData.variables, 'flySpeed'),
      swimSpeed: extractVariable(rawData.variables, 'swimSpeed'),
      climbSpeed: extractVariable(rawData.variables, 'climbSpeed'),
      damageImmunities: extractVariable(rawData.variables, 'damageImmunities'),
      damageResistances: extractVariable(rawData.variables, 'damageResistances'),
      damageVulnerabilities: extractVariable(rawData.variables, 'damageVulnerabilities'),
      conditionImmunities: extractVariable(rawData.variables, 'conditionImmunities'),
      languages: extractVariable(rawData.variables, 'languages'),
      size: extractVariable(rawData.variables, 'size') || 'medium',
      currency: {
        pp: extractVariable(rawData.variables, 'pp') || 0,
        gp: extractVariable(rawData.variables, 'gp') || 0,
        ep: extractVariable(rawData.variables, 'ep') || 0,
        sp: extractVariable(rawData.variables, 'sp') || 0,
        cp: extractVariable(rawData.variables, 'cp') || 0
      },
      experiencePoints: extractVariable(rawData.variables, 'experiencePoints') || 0
    }
  };

  console.log('✅ Parsed for Foundry VTT:', foundryData.name);
  return foundryData;
}

/**
 * Helper to extract variable value from DiceCloud variables
 */
function extractVariable(variables, varName) {
  if (!variables || !variables[varName]) return null;
  const varData = variables[varName];
  return varData.value !== undefined ? varData.value : varData;
}
