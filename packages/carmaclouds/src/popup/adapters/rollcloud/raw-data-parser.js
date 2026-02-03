/**
 * Raw Data Parser Module
 * Converts raw DiceCloud data to the format expected by sheet-builder
 */

/**
 * Parse raw DiceCloud character data into sheet-builder format
 * @param {Object} rawData - Raw DiceCloud data with creature, variables, properties
 * @param {String} characterId - Character ID
 * @returns {Object} Formatted character data for sheet-builder
 */
export function parseRawCharacterData(rawData, characterId) {
  if (!rawData || !rawData.creature || !rawData.variables || !rawData.properties) {
    throw new Error('Invalid raw data format: missing creature, variables, or properties');
  }

  const { creature, variables, properties } = rawData;

  // Extract basic info
  const name = creature.name || 'Unknown Character';

  // Extract race, class, level
  let race = 'Unknown';
  let characterClass = '';
  let level = 0;
  const uniqueClasses = new Set();
  let raceFound = false;

  for (const prop of properties) {
    if (!prop) continue;

    // Check for race
    if (!raceFound && prop.type === 'folder' && prop.name) {
      const commonRaces = ['half-elf', 'half-orc', 'dragonborn', 'tiefling', 'aarakocra', 'lizardfolk', 'warforged', 'changeling', 'kalashtar', 'goliath', 'firbolg', 'genasi', 'yuan-ti', 'bugbear', 'hobgoblin', 'halfling', 'tortle', 'kobold', 'tabaxi', 'goblin', 'kenku', 'human', 'dwarf', 'gnome', 'triton', 'elf', 'orc', 'shifter'];
      const nameMatchesRace = commonRaces.some(r => prop.name.toLowerCase().includes(r));
      if (nameMatchesRace) {
        const parentDepth = prop.ancestors ? prop.ancestors.length : 0;
        if (parentDepth <= 2) {
          race = prop.name;
          raceFound = true;
        }
      }
    }

    if (!raceFound && (prop.type === 'race' || prop.type === 'species' || prop.type === 'characterRace')) {
      if (prop.name) {
        race = prop.name;
        raceFound = true;
      }
    }

    if (!raceFound && prop.type === 'constant' && prop.name && prop.name.toLowerCase() === 'race') {
      if (prop.value) {
        race = prop.value;
        raceFound = true;
      }
    }

    // Extract classes
    if (prop.type === 'class' && prop.name && !prop.inactive && !prop.disabled) {
      const cleanName = prop.name.replace(/\s*\[Multiclass\]/i, '').trim();
      if (cleanName) {
        uniqueClasses.add(cleanName);
        level += prop.level || 1;
      }
    }
  }

  characterClass = Array.from(uniqueClasses).join(' / ') || 'No Class';

  // Extract variables
  const getVar = (name) => {
    const varName = name.toLowerCase();
    return variables[varName] !== undefined ? variables[varName] : 0;
  };

  // Ability scores and modifiers
  const abilities = {
    strength: getVar('strength'),
    dexterity: getVar('dexterity'),
    constitution: getVar('constitution'),
    intelligence: getVar('intelligence'),
    wisdom: getVar('wisdom'),
    charisma: getVar('charisma')
  };

  const abilityMods = {
    strengthMod: getVar('strengthMod'),
    dexterityMod: getVar('dexterityMod'),
    constitutionMod: getVar('constitutionMod'),
    intelligenceMod: getVar('intelligenceMod'),
    wisdomMod: getVar('wisdomMod'),
    charismaMod: getVar('charismaMod')
  };

  // Combat stats
  const hitPoints = {
    current: getVar('hitPoints'),
    max: getVar('hitPoints'),
    temp: 0
  };

  const armorClass = getVar('armorClass') || 10;
  const proficiencyBonus = getVar('proficiencyBonus') || Math.floor((level - 1) / 4) + 2;
  const initiative = getVar('initiative') || abilityMods.dexterityMod;
  const speed = getVar('speed') || 30;

  // Hit dice
  const hitDiceUsed = getVar('hitDiceUsed') || 0;
  const hitDice = {
    current: Math.max(0, level - hitDiceUsed),
    max: level,
    die: 'd10' // Default, should be extracted from class
  };

  // Saving throws
  const saves = {
    strength: getVar('strengthSave'),
    dexterity: getVar('dexteritySave'),
    constitution: getVar('constitutionSave'),
    intelligence: getVar('intelligenceSave'),
    wisdom: getVar('wisdomSave'),
    charisma: getVar('charismaSave')
  };

  // Skills
  const skills = {
    acrobatics: getVar('acrobatics'),
    animalHandling: getVar('animalHandling'),
    arcana: getVar('arcana'),
    athletics: getVar('athletics'),
    deception: getVar('deception'),
    history: getVar('history'),
    insight: getVar('insight'),
    intimidation: getVar('intimidation'),
    investigation: getVar('investigation'),
    medicine: getVar('medicine'),
    nature: getVar('nature'),
    perception: getVar('perception'),
    performance: getVar('performance'),
    persuasion: getVar('persuasion'),
    religion: getVar('religion'),
    sleightOfHand: getVar('sleightOfHand'),
    stealth: getVar('stealth'),
    survival: getVar('survival')
  };

  // Helper function to find children of a property
  const findChildren = (parentId) => {
    return properties.filter(p => {
      if (!p || p.inactive || p.disabled) return false;
      if (p.ancestors && Array.isArray(p.ancestors)) {
        return p.ancestors.some(ancestor => {
          return ancestor.id === parentId || ancestor === parentId;
        });
      }
      return p.parent === parentId;
    });
  };

  // Extract actions, spells, features from properties
  const actions = [];
  const spells = [];
  const features = [];
  const resources = [];

  for (const prop of properties) {
    if (!prop || prop.inactive || prop.disabled) continue;

    // Actions
    if (prop.type === 'action' && prop.name) {
      const children = findChildren(prop._id);

      // Extract attack and damage from children
      let attackBonus = prop.attackBonus;
      const damages = [];

      for (const child of children) {
        if (child.type === 'attack' || (child.type === 'roll' && child.name?.toLowerCase().includes('attack'))) {
          if (child.roll) {
            attackBonus = typeof child.roll === 'string' ? child.roll : (child.roll.calculation || child.roll.value);
          }
        }

        if (child.type === 'damage' || (child.type === 'roll' && (child.name?.toLowerCase().includes('damage') || child.name?.toLowerCase().includes('heal')))) {
          let formula = '';
          if (child.amount) {
            formula = typeof child.amount === 'string' ? child.amount : (child.amount.calculation || String(child.amount.value || ''));
          } else if (child.roll) {
            formula = typeof child.roll === 'string' ? child.roll : (child.roll.calculation || String(child.roll.value || ''));
          } else if (child.damage) {
            formula = typeof child.damage === 'string' ? child.damage : (child.damage.calculation || String(child.damage.value || ''));
          }

          if (formula) {
            damages.push({
              formula,
              type: child.damageType || '',
              name: child.name || ''
            });
          }
        }
      }

      actions.push({
        name: prop.name,
        description: prop.description || '',
        actionType: prop.actionType || 'action',
        attackBonus: attackBonus,
        damage: damages.length > 0 ? damages : prop.damage,
        uses: prop.uses
      });
    }

    // Spells
    if (prop.type === 'spell' && prop.name) {
      const children = findChildren(prop._id);

      // Extract attack and damage from children
      let attackRoll = '';
      const damageRolls = [];

      for (const child of children) {
        if (child.type === 'attack' || (child.type === 'roll' && child.name?.toLowerCase().includes('attack'))) {
          if (child.roll) {
            attackRoll = typeof child.roll === 'string' ? child.roll : (child.roll.calculation || child.roll.value || 'use_spell_attack_bonus');
          }
        }

        if (child.type === 'damage' || (child.type === 'roll' && (child.name?.toLowerCase().includes('damage') || child.name?.toLowerCase().includes('heal')))) {
          let formula = '';
          if (child.amount) {
            formula = typeof child.amount === 'string' ? child.amount : (child.amount.calculation || String(child.amount.value || ''));
          } else if (child.roll) {
            formula = typeof child.roll === 'string' ? child.roll : (child.roll.calculation || String(child.roll.value || ''));
          } else if (child.damage) {
            formula = typeof child.damage === 'string' ? child.damage : (child.damage.calculation || String(child.damage.value || ''));
          }

          if (formula) {
            damageRolls.push({
              formula,
              type: child.damageType || '',
              name: child.name || ''
            });
          }
        }
      }

      spells.push({
        name: prop.name,
        level: prop.level || 0,
        school: prop.school || '',
        castingTime: prop.castingTime || '',
        range: prop.range || '',
        duration: prop.duration || '',
        description: prop.description || '',
        prepared: prop.prepared !== false,
        attackRoll: attackRoll,
        damage: damageRolls
      });
    }

    // Features
    if (prop.type === 'feature' && prop.name) {
      features.push({
        name: prop.name,
        description: prop.description || '',
        uses: prop.uses
      });
    }

    // Resources
    if (prop.type === 'resource' && prop.name) {
      resources.push({
        name: prop.name,
        value: prop.value || 0,
        max: prop.max || 0,
        reset: prop.reset || 'longRest'
      });
    }
  }

  // Spell slots
  const spellSlots = {};
  for (let i = 1; i <= 9; i++) {
    const maxSlots = getVar(`level${i}SpellSlots`) || 0;
    const usedSlots = getVar(`level${i}SpellSlotsUsed`) || 0;
    if (maxSlots > 0) {
      spellSlots[i] = {
        max: maxSlots,
        used: usedSlots,
        available: maxSlots - usedSlots
      };
    }
  }

  // Return formatted character data
  return {
    id: characterId,
    name,
    character_name: name,
    class: characterClass,
    level,
    race,

    // Combat stats
    hitPoints: hitPoints.current,
    hit_points: hitPoints.current,
    maxHitPoints: hitPoints.max,
    temporaryHP: hitPoints.temp,
    temporary_hp: hitPoints.temp,

    armorClass,
    armor_class: armorClass,

    initiative,
    speed,
    proficiencyBonus,
    proficiency_bonus: proficiencyBonus,

    // Hit dice
    hitDice: `${hitDice.current}/${hitDice.max} ${hitDice.die}`,
    hit_dice: hitDice,

    // Death saves
    deathSaves: {
      successes: 0,
      failures: 0
    },
    death_saves: {
      successes: 0,
      failures: 0
    },

    // Abilities
    abilities,
    attributeMods: abilityMods,
    attribute_mods: abilityMods,

    // Saves and skills
    saves,
    skills,

    // Actions, spells, features
    actions,
    spells,
    features,
    resources,

    // Spell slots
    spellSlots,
    spell_slots: spellSlots,

    // Keep raw data for reference
    raw: rawData,

    // Metadata
    lastSynced: new Date().toISOString(),
    source: 'rollcloud'
  };
}
