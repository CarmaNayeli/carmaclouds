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

    // Set flags
    await actor.setFlag('foundcloud', 'diceCloudId', supabaseData.dicecloud_character_id);
    await actor.setFlag('foundcloud', 'supabaseId', supabaseData.id);
    await actor.setFlag('foundcloud', 'lastSync', Date.now());
    await actor.setFlag('foundcloud', 'discordEnabled', !!supabaseData.discord_user_id);

    // Import items if enabled (using foundcloud_parsed_data)
    const parsedData = supabaseData.foundcloud_parsed_data || {};
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

    // Update items if enabled (using foundcloud_parsed_data)
    const parsedData = supabaseData.foundcloud_parsed_data || {};
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
      img: parsed.raw_dicecloud_data?.picture || 'icons/svg/mystery-man.svg',
      system: {
        abilities: this.mapAbilitiesFromSupabase(sb),
        attributes: this.mapAttributesFromSupabase(sb),
        details: this.mapDetailsFromSupabase(sb),
        traits: this.mapTraitsFromSupabase(sb),
        currency: this.mapCurrencyFromSupabase(sb),
        skills: this.mapSkillsFromSupabase(sb),
        spells: this.mapSpellSlotsFromSupabase(sb)
      }
    };
  }

  /**
   * Map abilities from foundcloud_parsed_data
   * @param {object} sb - Supabase data
   * @returns {object}
   */
  mapAbilitiesFromSupabase(sb) {
    const parsed = sb.foundcloud_parsed_data || {};
    const attrs = parsed.attributes || {};

    return {
      str: { value: attrs.strength || attrs.STR || 10 },
      dex: { value: attrs.dexterity || attrs.DEX || 10 },
      con: { value: attrs.constitution || attrs.CON || 10 },
      int: { value: attrs.intelligence || attrs.INT || 10 },
      wis: { value: attrs.wisdom || attrs.WIS || 10 },
      cha: { value: attrs.charisma || attrs.CHA || 10 }
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
    
    console.log('FoundCloud | Mapped attributes - Hit Dice:', {
      value: parsed.level || 1,
      max: parsed.level || 1,
      denomination: this.getHitDieDenomination(parsed.class || sb.class),
      class: parsed.class || sb.class
    });
    
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
    console.log('FoundCloud | Mapped details:', {
      race: details.race,
      species: details.species,
      background: details.background,
      level: details.level
    });
    return details;
  }

  /**
   * Map traits from Supabase
   * @param {object} sb - Supabase data
   * @returns {object}
   */
  mapTraitsFromSupabase(sb) {
    const raw = sb.raw_dicecloud_data || {};

    return {
      size: this.mapSize(raw.size || 'medium'),
      di: { value: raw.damageImmunities || [] },
      dr: { value: raw.damageResistances || [] },
      dv: { value: raw.damageVulnerabilities || [] },
      ci: { value: raw.conditionImmunities || [] },
      languages: {
        value: raw.languages || []
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
    const currency = sb.raw_dicecloud_data?.currency || {};

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
   * @param {object} sb - Supabase data
   * @returns {object}
   */
  mapSkillsFromSupabase(sb) {
    const parsed = sb.foundcloud_parsed_data || {};
    const skills = {};
    const skillData = parsed.skills || {};
    const skillList = [
      'acr', 'ani', 'arc', 'ath', 'dec', 'his', 'ins',
      'itm', 'inv', 'med', 'nat', 'prc', 'prf', 'per',
      'rel', 'slt', 'ste', 'sur'
    ];

    skillList.forEach(skill => {
      skills[skill] = {
        value: skillData[skill]?.proficiency || skillData[skill] || 0,
        ability: this.getSkillAbility(skill)
      };
    });

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

    for (let i = 1; i <= 9; i++) {
      const levelKey = `level${i}`;
      const slot = spellSlots[levelKey] || {};

      spells[`spell${i}`] = {
        value: slot.current || 0,
        max: slot.max || 0,
        override: null
      };
    }

    return spells;
  }

  /**
   * Sync items (spells, equipment, features) from parsed DiceCloud data
   * @param {Actor} actor - Foundry actor
   * @param {object} parsedData - foundcloud_parsed_data from Supabase
   * @param {string} type - Item type
   */
  async syncItems(actor, parsedData, type) {
    console.log(`FoundCloud | Syncing ${type} items for ${actor.name}...`);
    console.log(`FoundCloud | Parsed data keys:`, Object.keys(parsedData));

    // Get items from parsed data based on type
    let diceCloudItems = [];
    if (type === 'feat') {
      // Features come from actions array
      diceCloudItems = parsedData.actions || [];
      console.log(`FoundCloud | Found ${diceCloudItems.length} actions in parsed data`);
    } else if (type === 'spell') {
      // Spells come from spells array
      diceCloudItems = parsedData.spells || [];
      console.log(`FoundCloud | Found ${diceCloudItems.length} spells in parsed data`);
    } else if (type === 'equipment') {
      // Equipment comes from inventory array
      diceCloudItems = parsedData.inventory || [];
      console.log(`FoundCloud | Found ${diceCloudItems.length} inventory items in parsed data`);
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
    return {
      name: dcItem.name || 'Unnamed Item',
      type: type,
      img: dcItem.image || `icons/svg/item-bag.svg`,
      system: {
        description: {
          value: dcItem.description || '',
          chat: '',
          unidentified: ''
        },
        source: 'DiceCloud',
        quantity: dcItem.quantity || 1,
        weight: dcItem.weight || 0,
        price: dcItem.value || 0,
        equipped: dcItem.equipped || false,
        identified: true
      }
    };
  }
}
