/**
 * DiceCloud Character Importer (Supabase Version)
 * Maps character data from Supabase rollcloud_characters table to Foundry VTT actors
 */

export class DiceCloudImporter {
  constructor(bridge) {
    this.bridge = bridge; // SupabaseBridge instance
  }

  /**
   * Import a character from Supabase
   * @param {string} diceCloudId - DiceCloud character ID
   * @returns {Promise<Actor>}
   */
  async importCharacter(diceCloudId) {
    console.log(`FoundCloud | Importing character ${diceCloudId}...`);

    try {
      // Get character data from Supabase
      const supabaseData = await this.bridge.getCharacter(diceCloudId);
      if (!supabaseData) {
        throw new Error('Character not found in Supabase');
      }

      console.log('FoundCloud | Character data received from Supabase:', supabaseData.character_name);

      // Check if character already exists in Foundry
      const existingActor = game.actors.find(a =>
        a.getFlag('foundcloud', 'diceCloudId') === diceCloudId
      );

      if (existingActor) {
        // Update existing actor
        console.log(`FoundCloud | Updating existing actor: ${existingActor.name}`);
        await this.updateActor(existingActor, supabaseData);
        return existingActor;
      } else {
        // Create new actor
        console.log('FoundCloud | Creating new actor...');
        return await this.createActor(supabaseData);
      }

    } catch (error) {
      console.error('FoundCloud | Failed to import character:', error);
      throw error;
    }
  }

  /**
   * Create a new Foundry actor from Supabase data
   * @param {object} supabaseData - Character data from rollcloud_characters table
   * @returns {Promise<Actor>}
   */
  async createActor(supabaseData) {
    const actorData = this.mapSupabaseToFoundryActor(supabaseData);

    // Create the actor
    const actor = await Actor.create(actorData);

    // Set the FoundCloud custom sheet
    await actor.setFlag('core', 'sheetClass', 'foundcloud.FoundCloudSheetSimple');

    // Set flags
    await actor.setFlag('foundcloud', 'diceCloudId', supabaseData.dicecloud_character_id);
    await actor.setFlag('foundcloud', 'supabaseId', supabaseData.id);
    await actor.setFlag('foundcloud', 'lastSync', Date.now());
    await actor.setFlag('foundcloud', 'discordEnabled', !!supabaseData.discord_user_id);
    const pd = supabaseData.foundcloud_parsed_data || {};
    await actor.setFlag('foundcloud', 'className', pd.class || supabaseData.class || 'Unknown');

    // Create class Item(s) so D&D 5e system calculates proficiency, hit dice, etc.
    const parsedData = supabaseData.foundcloud_parsed_data || {};
    await this.syncClassItems(actor, parsedData, supabaseData);

    // Import items if enabled (using foundcloud_parsed_data)
    if (parsedData && Object.keys(parsedData).length > 0) {
      if (game.settings.get('foundcloud', 'importFeatures')) {
        await this.syncItems(actor, parsedData, 'feat');
      }
      if (game.settings.get('foundcloud', 'importSpells')) {
        await this.syncItems(actor, parsedData, 'spell');
      }
      if (game.settings.get('foundcloud', 'importItems')) {
        await this.syncItems(actor, parsedData, 'equipment');
      }
    }

    console.log(`FoundCloud | Created actor: ${actor.name}`);
    return actor;
  }

  /**
   * Update an existing Foundry actor with Supabase data
   * @param {Actor} actor - Foundry actor
   * @param {object} supabaseData - Character data from Supabase
   * @returns {Promise<Actor>}
   */
  async updateActor(actor, supabaseData) {
    const overrideExisting = game.settings.get('foundcloud', 'overrideExisting');
    const actorData = this.mapSupabaseToFoundryActor(supabaseData);

    // Update actor data
    await actor.update({
      name: actorData.name,
      img: actorData.img,
      system: actorData.system
    });

    // Update class Items
    const parsedData = supabaseData.foundcloud_parsed_data || {};
    await this.syncClassItems(actor, parsedData, supabaseData);

    // Update items if enabled (using foundcloud_parsed_data)
    if (parsedData && Object.keys(parsedData).length > 0) {
      if (game.settings.get('foundcloud', 'importFeatures')) {
        await this.syncItems(actor, parsedData, 'feat');
      }
      if (game.settings.get('foundcloud', 'importSpells')) {
        await this.syncItems(actor, parsedData, 'spell');
      }
      if (game.settings.get('foundcloud', 'importItems')) {
        await this.syncItems(actor, parsedData, 'equipment');
      }
    }

    // Update sync timestamp
    await actor.setFlag('foundcloud', 'lastSync', Date.now());
    await actor.setFlag('foundcloud', 'supabaseUpdatedAt', supabaseData.updated_at);

    console.log(`FoundCloud | Updated actor: ${actor.name}`);
    return actor;
  }

  /**
   * Map Supabase data to Foundry actor structure
   * @param {object} sb - Supabase rollcloud_characters row
   * @returns {object} Foundry actor data
   */
  mapSupabaseToFoundryActor(sb) {
    const parsed = sb.foundcloud_parsed_data || {};
    return {
      name: sb.character_name || 'Unnamed Character',
      type: 'character',
      img: parsed.raw_dicecloud_data?.picture || parsed.raw_dicecloud_data?.creature?.picture || 'icons/svg/mystery-man.svg',
      system: {
        abilities: this.mapAbilitiesFromSupabase(sb),
        attributes: this.mapAttributesFromSupabase(sb),
        details: this.mapDetailsFromSupabase(sb),
        traits: this.mapTraitsFromSupabase(sb),
        currency: this.mapCurrencyFromSupabase(sb),
        skills: this.mapSkillsFromSupabase(sb),
        spells: this.mapSpellSlotsFromSupabase(sb),
        resources: this.mapResourcesFromSupabase(sb)
      }
    };
  }

  /**
   * Map abilities from foundcloud_parsed_data (including save proficiency)
   * @param {object} sb - Supabase data
   * @returns {object}
   */
  mapAbilitiesFromSupabase(sb) {
    const parsed = sb.foundcloud_parsed_data || {};
    const attrs = parsed.attributes || {};
    const saves = parsed.saves || {};

    // Determine save proficiency by comparing save total to ability modifier
    // If save total > ability mod, the character is likely proficient
    const profBonus = parsed.proficiency_bonus || 2;
    const getSaveProficiency = (abilityName, abilityValue) => {
      const mod = Math.floor((abilityValue - 10) / 2);
      const saveTotal = saves[abilityName] || 0;
      // If save total >= mod + proficiency bonus, they're proficient
      return (saveTotal >= mod + profBonus && saveTotal > mod) ? 1 : 0;
    };

    const strVal = attrs.strength || attrs.STR || 10;
    const dexVal = attrs.dexterity || attrs.DEX || 10;
    const conVal = attrs.constitution || attrs.CON || 10;
    const intVal = attrs.intelligence || attrs.INT || 10;
    const wisVal = attrs.wisdom || attrs.WIS || 10;
    const chaVal = attrs.charisma || attrs.CHA || 10;

    return {
      str: { value: strVal, proficient: getSaveProficiency('strength', strVal) },
      dex: { value: dexVal, proficient: getSaveProficiency('dexterity', dexVal) },
      con: { value: conVal, proficient: getSaveProficiency('constitution', conVal) },
      int: { value: intVal, proficient: getSaveProficiency('intelligence', intVal) },
      wis: { value: wisVal, proficient: getSaveProficiency('wisdom', wisVal) },
      cha: { value: chaVal, proficient: getSaveProficiency('charisma', chaVal) }
    };
  }

  /**
   * Map attributes (HP, AC, etc.) from foundcloud_parsed_data
   * @param {object} sb - Supabase data
   * @returns {object}
   */
  mapAttributesFromSupabase(sb) {
    const parsed = sb.foundcloud_parsed_data || {};
    const hp = parsed.hit_points || {};

    const attributes = {
      hp: {
        value: hp.current || 0,
        max: hp.max || 0,
        temp: parsed.temporary_hp || 0
      },
      ac: {
        value: parsed.armor_class || 10
      },
      init: {
        bonus: parsed.initiative || 0
      },
      movement: {
        walk: parsed.speed || 30,
        fly: parsed.flySpeed || 0,
        swim: parsed.swimSpeed || 0,
        climb: parsed.climbSpeed || 0
      },
      death: {
        success: parsed.death_saves?.successes || 0,
        failure: parsed.death_saves?.failures || 0
      },
      inspiration: parsed.inspiration || false,
      hd: {
        value: parsed.level || 1,
        max: parsed.level || 1,
        denomination: this.getHitDieDenomination(parsed.class || sb.class)
      }
    };
    
    return attributes;
  }

  /**
   * Get hit die denomination based on class
   * @param {string} className - Character class name
   * @returns {number}
   */
  getHitDieDenomination(className) {
    const hitDice = {
      'barbarian': 12,
      'fighter': 10,
      'paladin': 10,
      'ranger': 10,
      'bard': 8,
      'cleric': 8,
      'druid': 8,
      'monk': 8,
      'rogue': 8,
      'warlock': 8,
      'sorcerer': 6,
      'wizard': 6
    };
    return hitDice[className?.toLowerCase()] || 8;
  }

  /**
   * Map character details from Supabase
   * @param {object} sb - Supabase data
   * @returns {object}
   */
  mapDetailsFromSupabase(sb) {
    const parsed = sb.foundcloud_parsed_data || {};
    const details = {
      biography: {
        value: parsed.raw_dicecloud_data?.description || '',
        public: ''
      },
      alignment: parsed.alignment || sb.alignment || '',
      race: parsed.race || sb.race || '',
      background: parsed.background || '',
      level: parsed.level || sb.level || 1,
      xp: {
        value: parsed.raw_dicecloud_data?.experiencePoints || 0
      },
      species: parsed.race || sb.race || ''
    };
    return details;
  }

  /**
   * Map traits from Supabase
   * Extracted trait values are in foundcloud_parsed_data.raw_dicecloud_data (pre-extracted)
   * @param {object} sb - Supabase data
   * @returns {object}
   */
  mapTraitsFromSupabase(sb) {
    // The extracted fields (size, damageImmunities, etc.) are stored in
    // foundcloud_parsed_data.raw_dicecloud_data by parseForFoundCloud
    const parsed = sb.foundcloud_parsed_data || {};
    const extracted = parsed.raw_dicecloud_data || {};

    return {
      size: this.mapSize(extracted.size || 'medium'),
      di: { value: extracted.damageImmunities || [] },
      dr: { value: extracted.damageResistances || [] },
      dv: { value: extracted.damageVulnerabilities || [] },
      ci: { value: extracted.conditionImmunities || [] },
      languages: {
        value: extracted.languages || []
      }
    };
  }

  /**
   * Map size to Foundry size code
   * @param {string} size - Size name
   * @returns {string}
   */
  mapSize(size) {
    const sizeMap = {
      'tiny': 'tiny',
      'small': 'sm',
      'medium': 'med',
      'large': 'lg',
      'huge': 'huge',
      'gargantuan': 'grg'
    };
    return sizeMap[size?.toLowerCase()] || 'med';
  }

  /**
   * Map currency from Supabase
   * @param {object} sb - Supabase data
   * @returns {object}
   */
  mapCurrencyFromSupabase(sb) {
    const parsed = sb.foundcloud_parsed_data || {};
    const extracted = parsed.raw_dicecloud_data || {};
    const currency = extracted.currency || {};

    return {
      pp: currency.pp || 0,
      gp: currency.gp || 0,
      ep: currency.ep || 0,
      sp: currency.sp || 0,
      cp: currency.cp || 0
    };
  }

  /**
   * Map skills from foundcloud_parsed_data
   * DiceCloud stores skills as full camelCase names (e.g. 'acrobatics', 'animalHandling')
   * Foundry D&D 5e expects abbreviated keys (e.g. 'acr', 'ani')
   * @param {object} sb - Supabase data
   * @returns {object}
   */
  mapSkillsFromSupabase(sb) {
    const parsed = sb.foundcloud_parsed_data || {};
    const skills = {};
    const skillData = parsed.skills || {};

    // Map from DiceCloud full names to Foundry abbreviations
    const skillNameToAbbr = {
      'acrobatics': 'acr',
      'animalHandling': 'ani',
      'arcana': 'arc',
      'athletics': 'ath',
      'deception': 'dec',
      'history': 'his',
      'insight': 'ins',
      'intimidation': 'itm',
      'investigation': 'inv',
      'medicine': 'med',
      'nature': 'nat',
      'perception': 'prc',
      'performance': 'prf',
      'persuasion': 'per',
      'religion': 'rel',
      'sleightOfHand': 'slt',
      'stealth': 'ste',
      'survival': 'sur'
    };

    // Determine skill proficiency by comparing total to base ability mod
    const attrs = parsed.attributes || {};
    const profBonus = parsed.proficiency_bonus || 2;
    const abilityForSkill = {
      acr: 'dexterity', ani: 'wisdom', arc: 'intelligence', ath: 'strength',
      dec: 'charisma', his: 'intelligence', ins: 'wisdom', itm: 'charisma',
      inv: 'intelligence', med: 'wisdom', nat: 'intelligence', prc: 'wisdom',
      prf: 'charisma', per: 'charisma', rel: 'intelligence', slt: 'dexterity',
      ste: 'dexterity', sur: 'wisdom'
    };

    for (const [fullName, abbr] of Object.entries(skillNameToAbbr)) {
      const total = skillData[fullName] || skillData[abbr] || 0;
      const abilityName = abilityForSkill[abbr];
      const abilityVal = attrs[abilityName] || 10;
      const abilityMod = Math.floor((abilityVal - 10) / 2);

      // Determine proficiency level: 0 = none, 1 = proficient, 2 = expertise
      let profValue = 0;
      if (total >= abilityMod + (profBonus * 2)) {
        profValue = 2; // expertise
      } else if (total >= abilityMod + profBonus) {
        profValue = 1; // proficient
      }

      skills[abbr] = {
        value: profValue,
        ability: this.getSkillAbility(abbr)
      };
    }

    return skills;
  }

  /**
   * Get ability for a skill
   * @param {string} skill - Skill code
   * @returns {string}
   */
  getSkillAbility(skill) {
    const skillAbilities = {
      acr: 'dex', ani: 'wis', arc: 'int', ath: 'str', dec: 'cha',
      his: 'int', ins: 'wis', itm: 'cha', inv: 'int', med: 'wis',
      nat: 'int', prc: 'wis', prf: 'cha', per: 'cha', rel: 'int',
      slt: 'dex', ste: 'dex', sur: 'wis'
    };
    return skillAbilities[skill] || 'int';
  }

  /**
   * Map spell slots from Supabase
   * @param {object} sb - Supabase data
   * @returns {object}
   */
  mapSpellSlotsFromSupabase(sb) {
    const parsed = sb.foundcloud_parsed_data || {};
    const spells = {};
    const spellSlots = parsed.spell_slots || {};

    console.log('🔮 [IMPORTER] Mapping spell slots from Supabase...');
    console.log('🔮 [IMPORTER] parsed.spell_slots:', spellSlots);

    for (let i = 1; i <= 9; i++) {
      const levelKey = `level${i}`;
      const slot = spellSlots[levelKey] || {};

      console.log(`🔮 [IMPORTER] Level ${i} slot data:`, {
        levelKey,
        slot,
        'slot.current': slot.current,
        'slot.max': slot.max
      });

      spells[`spell${i}`] = {
        value: slot.current || 0,
        max: slot.max || 0,
        override: null
      };

      console.log(`🔮 [IMPORTER] Created spell${i}:`, spells[`spell${i}`]);
    }

    console.log('🔮 [IMPORTER] Final spells object:', spells);
    return spells;
  }

  /**
   * Map resources from Supabase
   * @param {object} sb - Supabase data
   * @returns {object}
   */
  mapResourcesFromSupabase(sb) {
    const parsed = sb.foundcloud_parsed_data || {};
    const resources = parsed.resources || [];

    const resourcesMap = {
      primary: { value: 0, max: 0, sr: false, lr: false, label: '' },
      secondary: { value: 0, max: 0, sr: false, lr: false, label: '' },
      tertiary: { value: 0, max: 0, sr: false, lr: false, label: '' }
    };

    // Map first 3 resources to D&D 5e's resource slots
    const slots = ['primary', 'secondary', 'tertiary'];
    resources.slice(0, 3).forEach((res, index) => {
      resourcesMap[slots[index]] = {
        value: res.current || res.value || 0,
        max: res.max || res.total || 0,
        sr: res.reset === 'shortRest' || res.reset === 'short',
        lr: res.reset === 'longRest' || res.reset === 'long',
        label: res.name || res.label || `Resource ${index + 1}`
      };
    });

    return resourcesMap;
  }

  /**
   * Create or update class Items on the actor
   * D&D 5e derives level, proficiency, hit dice from class Items
   * @param {Actor} actor - Foundry actor
   * @param {object} parsedData - foundcloud_parsed_data from Supabase
   * @param {object} supabaseData - full Supabase row
   */
  async syncClassItems(actor, parsedData, supabaseData) {
    const className = parsedData.class || supabaseData.class || 'Unknown';
    const totalLevel = parsedData.level || supabaseData.level || 1;

    // Parse class string (may be "Fighter / Wizard" for multiclass)
    const classParts = className.split(/\s*\/\s*/);

    // Remove existing class items to avoid duplicates on re-sync
    const existingClasses = actor.items.filter(i => i.type === 'class');
    if (existingClasses.length > 0) {
      await actor.deleteEmbeddedDocuments('Item', existingClasses.map(i => i.id));
    }

    if (classParts.length === 1) {
      // Single class: assign all levels
      await actor.createEmbeddedDocuments('Item', [{
        name: classParts[0].trim(),
        type: 'class',
        system: {
          levels: totalLevel,
          hitDice: `d${this.getHitDieDenomination(classParts[0].trim())}`,
          hitDiceUsed: 0
        }
      }]);
    } else {
      // Multiclass: split levels evenly as best guess (DiceCloud doesn't tell us per-class levels easily)
      // First class gets the majority of levels
      const levelsPerClass = Math.floor(totalLevel / classParts.length);
      const remainder = totalLevel % classParts.length;

      const classItems = classParts.map((cls, index) => ({
        name: cls.trim(),
        type: 'class',
        system: {
          levels: levelsPerClass + (index === 0 ? remainder : 0),
          hitDice: `d${this.getHitDieDenomination(cls.trim())}`,
          hitDiceUsed: 0
        }
      }));

      await actor.createEmbeddedDocuments('Item', classItems);
    }

    console.log(`FoundCloud | Created class items for ${className} (level ${totalLevel})`);
  }

  /**
   * Sync items (spells, equipment, features) from parsed DiceCloud data
   * @param {Actor} actor - Foundry actor
   * @param {object} parsedData - foundcloud_parsed_data from Supabase
   * @param {string} type - Item type
   */
  async syncItems(actor, parsedData, type) {
    console.log(`FoundCloud | Syncing ${type} items for ${actor.name}...`);

    // Get items from parsed data based on type
    let diceCloudItems = [];
    if (type === 'feat') {
      // Features come from actions array
      diceCloudItems = parsedData.actions || [];
    } else if (type === 'spell') {
      // Spells come from spells array
      diceCloudItems = parsedData.spells || [];
    } else if (type === 'equipment') {
      // Equipment comes from inventory array
      diceCloudItems = parsedData.inventory || [];
    }

    // Get existing items from actor
    const existingItems = actor.items.filter(item => item.type === type);

    // Create a map of existing items by name
    const existingMap = new Map(existingItems.map(item => [item.name, item]));

    // Add or update items
    for (const dcItem of diceCloudItems) {
      const existingItem = existingMap.get(dcItem.name);

      if (existingItem) {
        // Update existing item
        await existingItem.update({
          'system.description.value': dcItem.description || ''
        });
      } else {
        // Create new item
        const itemData = this.mapToFoundryItem(dcItem, type);
        await actor.createEmbeddedDocuments('Item', [itemData]);
      }
    }

    console.log(`FoundCloud | Synced ${diceCloudItems.length} ${type} items`);
  }

  /**
   * Map DiceCloud item to Foundry item
   * @param {object} dcItem - DiceCloud item
   * @param {string} type - Item type
   * @returns {object}
   */
  mapToFoundryItem(dcItem, type) {
    const baseItem = {
      name: dcItem.name || 'Unnamed Item',
      type: type,
      img: dcItem.image || this.getDefaultIcon(type),
      system: {
        description: {
          value: dcItem.description || '',
          chat: '',
          unidentified: ''
        },
        source: 'DiceCloud'
      }
    };

    // Map type-specific fields
    if (type === 'spell') {
      return this.mapSpellItem(dcItem, baseItem);
    } else if (type === 'feat') {
      return this.mapFeatItem(dcItem, baseItem);
    } else if (type === 'equipment' || type === 'weapon' || type === 'consumable') {
      return this.mapEquipmentItem(dcItem, baseItem);
    }

    return baseItem;
  }

  /**
   * Map DiceCloud spell to Foundry spell Item
   */
  mapSpellItem(dcSpell, baseItem) {
    baseItem.system = {
      ...baseItem.system,
      level: dcSpell.level || 0,
      school: this.mapSchool(dcSpell.school),
      components: {
        vocal: dcSpell.components?.vocal || dcSpell.components?.v || false,
        somatic: dcSpell.components?.somatic || dcSpell.components?.s || false,
        material: dcSpell.components?.material || dcSpell.components?.m || false,
        ritual: dcSpell.ritual || false,
        concentration: dcSpell.concentration || false
      },
      materials: {
        value: dcSpell.materials || dcSpell.components?.materials || '',
        consumed: false,
        cost: 0,
        supply: 0
      },
      activation: {
        type: this.mapActivationType(dcSpell.castingTime),
        cost: 1,
        condition: ''
      },
      duration: {
        value: this.parseDuration(dcSpell.duration),
        units: this.parseDurationUnits(dcSpell.duration)
      },
      target: {
        value: dcSpell.targets || 1,
        width: null,
        units: dcSpell.targetType || '',
        type: this.mapTargetType(dcSpell.range)
      },
      range: {
        value: this.parseRange(dcSpell.range),
        long: null,
        units: this.parseRangeUnits(dcSpell.range)
      },
      uses: {
        value: null,
        max: '',
        per: null,
        recovery: ''
      },
      actionType: this.mapActionType(dcSpell.attackRoll, dcSpell.savingThrow),
      damage: {
        parts: this.parseDamageParts(dcSpell.damageRoll),
        versatile: ''
      },
      save: {
        ability: this.parseSaveAbility(dcSpell.savingThrow),
        dc: null,
        scaling: 'spell'
      },
      scaling: {
        mode: dcSpell.higherLevels ? 'level' : 'none',
        formula: ''
      },
      prepared: true
    };
    return baseItem;
  }

  /**
   * Map DiceCloud action/feature to Foundry feat Item
   */
  mapFeatItem(dcFeat, baseItem) {
    baseItem.system = {
      ...baseItem.system,
      activation: {
        type: this.mapActivationType(dcFeat.actionType || dcFeat.uses?.type),
        cost: 1,
        condition: ''
      },
      duration: {
        value: null,
        units: ''
      },
      target: {
        value: null,
        width: null,
        units: '',
        type: ''
      },
      range: {
        value: this.parseRange(dcFeat.range),
        long: null,
        units: this.parseRangeUnits(dcFeat.range)
      },
      uses: {
        value: dcFeat.uses?.value || dcFeat.uses?.current || null,
        max: dcFeat.uses?.max || dcFeat.uses?.total || '',
        per: dcFeat.uses?.reset || '',
        recovery: ''
      },
      actionType: this.mapActionType(dcFeat.attackRoll, dcFeat.savingThrow),
      attackBonus: this.parseAttackBonus(dcFeat.attackRoll),
      damage: {
        parts: this.parseDamageParts(dcFeat.damageRoll),
        versatile: ''
      },
      save: {
        ability: this.parseSaveAbility(dcFeat.savingThrow),
        dc: null,
        scaling: 'spell'
      }
    };
    return baseItem;
  }

  /**
   * Map DiceCloud equipment to Foundry equipment Item
   */
  mapEquipmentItem(dcItem, baseItem) {
    baseItem.system = {
      ...baseItem.system,
      quantity: dcItem.quantity || 1,
      weight: dcItem.weight || 0,
      price: {
        value: dcItem.value || dcItem.cost || 0,
        denomination: 'gp'
      },
      equipped: dcItem.equipped || false,
      rarity: dcItem.rarity || '',
      identified: true,
      attuned: dcItem.attuned || false,
      attunement: dcItem.requiresAttunement ? 1 : 0
    };

    // If it has attack/damage, add those fields
    if (dcItem.attackRoll || dcItem.damageRoll) {
      baseItem.type = 'weapon';
      baseItem.system.activation = {
        type: 'action',
        cost: 1,
        condition: ''
      };
      baseItem.system.actionType = this.mapActionType(dcItem.attackRoll, null);
      baseItem.system.attackBonus = this.parseAttackBonus(dcItem.attackRoll);
      baseItem.system.damage = {
        parts: this.parseDamageParts(dcItem.damageRoll),
        versatile: ''
      };
      baseItem.system.range = {
        value: this.parseRange(dcItem.range),
        long: null,
        units: this.parseRangeUnits(dcItem.range)
      };
    }

    return baseItem;
  }

  // Helper methods for mapping

  getDefaultIcon(type) {
    const icons = {
      spell: 'icons/svg/book.svg',
      feat: 'icons/svg/upgrade.svg',
      weapon: 'icons/svg/sword.svg',
      equipment: 'icons/svg/item-bag.svg',
      consumable: 'icons/svg/pill.svg'
    };
    return icons[type] || 'icons/svg/item-bag.svg';
  }

  mapSchool(school) {
    const schoolMap = {
      'abjuration': 'abj',
      'conjuration': 'con',
      'divination': 'div',
      'enchantment': 'enc',
      'evocation': 'evo',
      'illusion': 'ill',
      'necromancy': 'nec',
      'transmutation': 'trs'
    };
    if (!school) return 'evo';
    const lower = school.toLowerCase();
    return schoolMap[lower] || lower.substring(0, 3);
  }

  mapActivationType(castingTime) {
    if (!castingTime) return 'action';
    const lower = castingTime.toLowerCase();
    if (lower.includes('bonus')) return 'bonus';
    if (lower.includes('reaction')) return 'reaction';
    if (lower.includes('minute')) return 'minute';
    if (lower.includes('hour')) return 'hour';
    return 'action';
  }

  mapActionType(attackRoll, savingThrow) {
    if (savingThrow) return 'save';
    if (!attackRoll) return 'util';
    const lower = attackRoll.toLowerCase();
    if (lower.includes('spell') || lower.includes('ranged spell')) return 'rsak';
    if (lower.includes('melee spell')) return 'msak';
    if (lower.includes('ranged')) return 'rwak';
    if (lower.includes('melee')) return 'mwak';
    return 'other';
  }

  mapTargetType(range) {
    if (!range) return 'creature';
    const lower = range.toLowerCase();
    if (lower.includes('self')) return 'self';
    if (lower.includes('cone')) return 'cone';
    if (lower.includes('line')) return 'line';
    if (lower.includes('radius') || lower.includes('sphere')) return 'radius';
    if (lower.includes('cube')) return 'cube';
    return 'creature';
  }

  parseRange(range) {
    if (!range) return null;
    const match = range.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  parseRangeUnits(range) {
    if (!range) return 'ft';
    const lower = range.toLowerCase();
    if (lower.includes('self')) return 'self';
    if (lower.includes('touch')) return 'touch';
    if (lower.includes('mile')) return 'mi';
    if (lower.includes('km')) return 'km';
    return 'ft';
  }

  parseDuration(duration) {
    if (!duration) return null;
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  parseDurationUnits(duration) {
    if (!duration) return 'inst';
    const lower = duration.toLowerCase();
    if (lower.includes('instant')) return 'inst';
    if (lower.includes('round')) return 'round';
    if (lower.includes('minute')) return 'minute';
    if (lower.includes('hour')) return 'hour';
    if (lower.includes('day')) return 'day';
    return 'inst';
  }

  parseSaveAbility(savingThrow) {
    if (!savingThrow) return '';
    const lower = savingThrow.toLowerCase();
    if (lower.includes('str')) return 'str';
    if (lower.includes('dex')) return 'dex';
    if (lower.includes('con')) return 'con';
    if (lower.includes('int')) return 'int';
    if (lower.includes('wis')) return 'wis';
    if (lower.includes('cha')) return 'cha';
    return '';
  }

  parseAttackBonus(attackRoll) {
    if (!attackRoll) return 0;
    const match = attackRoll.match(/[+\-]\s*(\d+)/);
    return match ? parseInt(match[1]) * (attackRoll.includes('-') ? -1 : 1) : 0;
  }

  parseDamageParts(damageRoll) {
    if (!damageRoll) return [];
    // Simple parsing: look for dice notation and damage type
    const parts = [];
    const formulas = damageRoll.split(/(?:plus|\+|,)/i);
    for (const formula of formulas) {
      const trimmed = formula.trim();
      if (!trimmed) continue;

      // Try to extract damage type
      const typeMatch = trimmed.match(/(slashing|piercing|bludgeoning|fire|cold|lightning|thunder|poison|acid|necrotic|radiant|force|psychic)/i);
      const damageType = typeMatch ? typeMatch[1].toLowerCase() : '';

      // Extract dice formula
      const diceMatch = trimmed.match(/(\d+d\d+(?:\s*[+\-]\s*\d+)?)/i);
      if (diceMatch) {
        parts.push([diceMatch[1], damageType]);
      }
    }
    return parts;
  }
}
