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

    // Update items if enabled (using raw_dicecloud_data if available)
    if (supabaseData.raw_dicecloud_data) {
      if (game.settings.get('foundcloud', 'importSpells')) {
        await this.syncItems(actor, supabaseData.raw_dicecloud_data, 'spell');
      }
      if (game.settings.get('foundcloud', 'importItems')) {
        await this.syncItems(actor, supabaseData.raw_dicecloud_data, 'equipment');
      }
      if (game.settings.get('foundcloud', 'importFeatures')) {
        await this.syncItems(actor, supabaseData.raw_dicecloud_data, 'feat');
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
    return {
      name: sb.character_name || 'Unnamed Character',
      type: 'character',
      img: sb.raw_dicecloud_data?.picture || 'icons/svg/mystery-man.svg',
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
   * Map abilities from Supabase attributes JSONB
   * @param {object} sb - Supabase data
   * @returns {object}
   */
  mapAbilitiesFromSupabase(sb) {
    const attrs = sb.attributes || {};

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
   * Map attributes (HP, AC, etc.) from Supabase
   * @param {object} sb - Supabase data
   * @returns {object}
   */
  mapAttributesFromSupabase(sb) {
    const hp = sb.hit_points || {};

    return {
      hp: {
        value: hp.current || 0,
        max: hp.max || 0,
        temp: sb.temporary_hp || 0
      },
      ac: {
        value: sb.armor_class || 10
      },
      init: {
        bonus: sb.initiative || 0
      },
      movement: {
        walk: sb.speed || 30,
        fly: sb.raw_dicecloud_data?.flySpeed || 0,
        swim: sb.raw_dicecloud_data?.swimSpeed || 0,
        climb: sb.raw_dicecloud_data?.climbSpeed || 0
      },
      death: {
        success: sb.death_saves?.successes || 0,
        failure: sb.death_saves?.failures || 0
      },
      inspiration: sb.inspiration || false
    };
  }

  /**
   * Map character details from Supabase
   * @param {object} sb - Supabase data
   * @returns {object}
   */
  mapDetailsFromSupabase(sb) {
    return {
      biography: {
        value: sb.raw_dicecloud_data?.description || '',
        public: ''
      },
      alignment: sb.alignment || '',
      race: sb.race || '',
      background: sb.raw_dicecloud_data?.background || '',
      level: sb.level || 1,
      xp: {
        value: sb.raw_dicecloud_data?.experiencePoints || 0
      }
    };
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
   * Map skills from Supabase
   * @param {object} sb - Supabase data
   * @returns {object}
   */
  mapSkillsFromSupabase(sb) {
    const skills = {};
    const skillData = sb.skills || {};
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
    const spells = {};
    const spellSlots = sb.spell_slots || {};

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
   * Sync items (spells, equipment, features) from raw DiceCloud data
   * @param {Actor} actor - Foundry actor
   * @param {object} rawData - raw_dicecloud_data from Supabase
   * @param {string} type - Item type
   */
  async syncItems(actor, rawData, type) {
    console.log(`FoundCloud | Syncing ${type} items for ${actor.name}...`);

    // Get items from raw DiceCloud data
    const diceCloudItems = rawData.items?.filter(item => {
      if (type === 'spell') return item.type === 'spell';
      if (type === 'equipment') return ['equipment', 'weapon', 'consumable'].includes(item.type);
      if (type === 'feat') return ['feat', 'class', 'background'].includes(item.type);
      return false;
    }) || [];

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
