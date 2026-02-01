/**
 * FoundCloud Custom Character Sheet
 * A custom ActorSheet that provides the FoundCloud UI for D&D 5e characters
 */

export class FoundCloudSheet extends dnd5e.applications.actor.ActorSheet5eCharacter {
  constructor(...args) {
    super(...args);

    // Combat state tracking
    this.combatState = {
      actionUsed: false,
      bonusActionUsed: false,
      movementUsed: false,
      reactionUsed: false,
      concentration: null,
      conditions: []
    };

    // Advantage state
    this.advantageState = 'normal'; // 'advantage', 'normal', 'disadvantage'

    // Filter states
    this.filters = {
      spellLevel: 'all',
      spellCategory: 'all',
      spellCastingTime: 'all',
      actionType: 'all',
      actionCategory: 'all',
      inventoryFilter: 'equipped'
    };

    // Search terms
    this.searchTerms = {
      actions: '',
      spells: '',
      inventory: ''
    };
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['foundcloud', 'sheet', 'actor', 'character'],
      template: 'modules/foundcloud/templates/foundcloud-sheet.hbs',
      width: 800,
      height: 900,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'combat' }],
      scrollY: ['.content-area'],
      dragDrop: [{ dragSelector: '.item-list .item', dropSelector: null }]
    });
  }

  /** @override */
  get template() {
    return 'modules/foundcloud/templates/foundcloud-sheet.hbs';
  }

  /** @override */
  async getData(options) {
    const context = await super.getData(options);
    const actor = this.actor;
    const system = actor.system;

    // Add FoundCloud-specific data
    context.foundcloud = {
      // Combat state
      combatState: this.combatState,
      advantageState: this.advantageState,

      // Computed advantage states for template
      isAdvantage: this.advantageState === 'advantage',
      isNormal: this.advantageState === 'normal',
      isDisadvantage: this.advantageState === 'disadvantage',

      // Character info
      characterName: actor.name,
      characterClass: this._getClassString(actor),
      characterLevel: system.details.level || 1,
      characterRace: system.details.race || 'Unknown',

      // Core stats
      armorClass: system.attributes.ac.value || 10,
      speed: system.attributes.movement.walk || 30,
      proficiencyBonus: system.attributes.prof || 2,

      // HP
      hp: {
        current: system.attributes.hp.value || 0,
        max: system.attributes.hp.max || 0,
        temp: system.attributes.hp.temp || 0
      },

      // Hit Dice
      hitDice: this._getHitDiceString(actor),

      // Death Saves
      deathSaves: {
        successes: system.attributes.death?.success || 0,
        failures: system.attributes.death?.failure || 0
      },

      // Inspiration
      inspiration: system.attributes.inspiration || false,

      // Initiative
      initiative: this._formatModifier(system.attributes.init?.total || system.abilities.dex.mod || 0),

      // Abilities with modifiers
      abilities: this._prepareAbilities(system),

      // Saving throws
      saves: this._prepareSaves(system),

      // Skills
      skills: this._prepareSkills(system),

      // Spell slots
      spellSlots: this._prepareSpellSlots(system),

      // Resources (class features with uses)
      resources: this._prepareResources(actor),

      // Actions & Attacks
      actions: this._prepareActions(actor),

      // Spells by level
      spells: this._prepareSpells(actor),

      // Inventory
      inventory: this._prepareInventory(actor),

      // Filters
      filters: this.filters,
      searchTerms: this.searchTerms,

      // Conditions list for dropdown
      conditionsList: this._getConditionsList()
    };

    return context;
  }

  /**
   * Get class string (e.g., "Fighter 5 / Wizard 3")
   */
  _getClassString(actor) {
    const classes = actor.items.filter(i => i.type === 'class');
    if (classes.length === 0) return 'Unknown';

    return classes.map(c => `${c.name} ${c.system.levels || 1}`).join(' / ');
  }

  /**
   * Get hit dice string
   */
  _getHitDiceString(actor) {
    const classes = actor.items.filter(i => i.type === 'class');
    if (classes.length === 0) return '0/0 d10';

    let total = 0;
    let used = 0;
    let dieSize = 'd10';

    for (const cls of classes) {
      total += cls.system.levels || 0;
      used += cls.system.hitDiceUsed || 0;
      // Use the first class's hit die
      if (cls === classes[0]) {
        dieSize = cls.system.hitDice || 'd10';
      }
    }

    return `${total - used}/${total} ${dieSize}`;
  }

  /**
   * Format modifier with + or -
   */
  _formatModifier(mod) {
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }

  /**
   * Prepare abilities data
   */
  _prepareAbilities(system) {
    const abilities = [];
    const abilityNames = {
      str: 'Strength',
      dex: 'Dexterity',
      con: 'Constitution',
      int: 'Intelligence',
      wis: 'Wisdom',
      cha: 'Charisma'
    };

    for (const [key, name] of Object.entries(abilityNames)) {
      const ability = system.abilities[key];
      abilities.push({
        key,
        name,
        abbr: key.toUpperCase(),
        value: ability.value || 10,
        mod: this._formatModifier(ability.mod || 0)
      });
    }

    return abilities;
  }

  /**
   * Prepare saving throws data
   */
  _prepareSaves(system) {
    const saves = [];
    const abilityNames = {
      str: 'Strength',
      dex: 'Dexterity',
      con: 'Constitution',
      int: 'Intelligence',
      wis: 'Wisdom',
      cha: 'Charisma'
    };

    for (const [key, name] of Object.entries(abilityNames)) {
      const ability = system.abilities[key];
      const save = ability.save || ability.mod || 0;
      const proficient = ability.proficient || 0;

      saves.push({
        key,
        name,
        abbr: key.toUpperCase(),
        mod: this._formatModifier(save),
        proficient: proficient > 0
      });
    }

    return saves;
  }

  /**
   * Prepare skills data
   */
  _prepareSkills(system) {
    const skills = [];
    const skillConfig = CONFIG.DND5E.skills;

    for (const [key, skill] of Object.entries(system.skills)) {
      const config = skillConfig[key] || {};
      skills.push({
        key,
        name: config.label || key,
        mod: this._formatModifier(skill.total || skill.mod || 0),
        proficient: skill.value > 0,
        expertise: skill.value >= 2,
        ability: skill.ability?.toUpperCase() || 'DEX'
      });
    }

    // Sort alphabetically
    skills.sort((a, b) => a.name.localeCompare(b.name));
    return skills;
  }

  /**
   * Prepare spell slots data
   */
  _prepareSpellSlots(system) {
    const slots = [];

    for (let i = 1; i <= 9; i++) {
      const slot = system.spells[`spell${i}`];
      if (slot && slot.max > 0) {
        slots.push({
          level: i,
          levelLabel: this._getOrdinal(i),
          current: slot.value || 0,
          max: slot.max || 0,
          isEmpty: (slot.value || 0) === 0
        });
      }
    }

    return slots;
  }

  /**
   * Get ordinal suffix
   */
  _getOrdinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  /**
   * Prepare resources (class features with uses)
   */
  _prepareResources(actor) {
    const resources = [];

    // Get items with limited uses
    const features = actor.items.filter(i =>
      (i.type === 'feat' || i.type === 'class') &&
      i.system.uses?.max > 0
    );

    for (const feat of features) {
      resources.push({
        id: feat.id,
        name: feat.name,
        current: feat.system.uses.value || 0,
        max: feat.system.uses.max || 0,
        recovery: feat.system.uses.per || 'day'
      });
    }

    return resources;
  }

  /**
   * Prepare actions and attacks
   */
  _prepareActions(actor) {
    const actions = [];

    // Get weapons and items with actions
    const items = actor.items.filter(i =>
      i.type === 'weapon' ||
      (i.hasAttack) ||
      (i.system.actionType && i.system.actionType !== 'none')
    );

    for (const item of items) {
      const actionType = this._determineActionType(item);
      const category = this._determineCategory(item);

      actions.push({
        id: item.id,
        name: item.name,
        img: item.img,
        actionType,
        actionTypeIcon: this._getActionTypeIcon(actionType),
        category,
        hasAttack: item.hasAttack,
        hasDamage: item.hasDamage,
        attackBonus: item.labels?.toHit || '',
        damage: item.labels?.damage || '',
        description: item.system.description?.value || '',
        uses: item.system.uses?.max > 0 ? {
          current: item.system.uses.value || 0,
          max: item.system.uses.max || 0
        } : null
      });
    }

    return actions;
  }

  /**
   * Determine action type (action, bonus, reaction, free)
   */
  _determineActionType(item) {
    const activation = item.system.activation?.type;
    if (activation === 'bonus') return 'bonus';
    if (activation === 'reaction') return 'reaction';
    if (activation === 'none' || activation === 'special') return 'free';
    return 'action';
  }

  /**
   * Determine category (damage, healing, utility)
   */
  _determineCategory(item) {
    if (item.system.damage?.parts?.length > 0) return 'damage';
    if (item.system.actionType === 'heal') return 'healing';
    return 'utility';
  }

  /**
   * Get action type icon
   */
  _getActionTypeIcon(type) {
    const icons = {
      action: '&#x2694;&#xFE0F;',
      bonus: '&#x26A1;',
      reaction: '&#x1F6E1;&#xFE0F;',
      free: '&#x1F193;'
    };
    return icons[type] || icons.action;
  }

  /**
   * Prepare spells organized by level
   */
  _prepareSpells(actor) {
    const spellsByLevel = {};

    // Initialize levels
    for (let i = 0; i <= 9; i++) {
      spellsByLevel[i] = {
        level: i,
        levelLabel: i === 0 ? 'Cantrips' : this._getOrdinal(i) + ' Level',
        spells: []
      };
    }

    // Get all spells
    const spells = actor.items.filter(i => i.type === 'spell');

    for (const spell of spells) {
      const level = spell.system.level || 0;
      const category = this._determineSpellCategory(spell);
      const castingTime = this._determineCastingTime(spell);

      spellsByLevel[level].spells.push({
        id: spell.id,
        name: spell.name,
        img: spell.img,
        level,
        school: spell.system.school || '',
        concentration: spell.system.components?.concentration || false,
        ritual: spell.system.components?.ritual || false,
        category,
        castingTime,
        castingTimeIcon: this._getActionTypeIcon(castingTime),
        description: spell.system.description?.value || '',
        hasAttack: spell.hasAttack,
        hasDamage: spell.hasDamage,
        damage: spell.labels?.damage || '',
        save: spell.system.save?.ability ? `DC ${spell.system.save.dc} ${spell.system.save.ability.toUpperCase()}` : ''
      });
    }

    // Filter out empty levels (except cantrips)
    const result = [];
    for (let i = 0; i <= 9; i++) {
      if (spellsByLevel[i].spells.length > 0 || i === 0) {
        result.push(spellsByLevel[i]);
      }
    }

    return result;
  }

  /**
   * Determine spell category
   */
  _determineSpellCategory(spell) {
    if (spell.system.actionType === 'heal') return 'healing';
    if (spell.system.damage?.parts?.length > 0) return 'damage';
    return 'utility';
  }

  /**
   * Determine casting time
   */
  _determineCastingTime(spell) {
    const activation = spell.system.activation?.type;
    if (activation === 'bonus') return 'bonus';
    if (activation === 'reaction') return 'reaction';
    return 'action';
  }

  /**
   * Prepare inventory items
   */
  _prepareInventory(actor) {
    const inventory = [];

    const items = actor.items.filter(i =>
      ['weapon', 'equipment', 'consumable', 'tool', 'loot', 'container'].includes(i.type)
    );

    for (const item of items) {
      inventory.push({
        id: item.id,
        name: item.name,
        img: item.img,
        type: item.type,
        quantity: item.system.quantity || 1,
        weight: item.system.weight || 0,
        equipped: item.system.equipped || false,
        attuned: item.system.attunement === 2,
        requiresAttunement: item.system.attunement === 1,
        isContainer: item.type === 'container',
        description: item.system.description?.value || ''
      });
    }

    // Sort: equipped first, then by name
    inventory.sort((a, b) => {
      if (a.equipped !== b.equipped) return b.equipped - a.equipped;
      return a.name.localeCompare(b.name);
    });

    return inventory;
  }

  /**
   * Get conditions list for dropdown
   */
  _getConditionsList() {
    return [
      { id: 'blinded', name: 'Blinded', icon: '&#x1F441;' },
      { id: 'charmed', name: 'Charmed', icon: '&#x1F496;' },
      { id: 'deafened', name: 'Deafened', icon: '&#x1F442;' },
      { id: 'frightened', name: 'Frightened', icon: '&#x1F628;' },
      { id: 'grappled', name: 'Grappled', icon: '&#x270B;' },
      { id: 'incapacitated', name: 'Incapacitated', icon: '&#x1F635;' },
      { id: 'invisible', name: 'Invisible', icon: '&#x1F47B;' },
      { id: 'paralyzed', name: 'Paralyzed', icon: '&#x26A1;' },
      { id: 'petrified', name: 'Petrified', icon: '&#x1FAA8;' },
      { id: 'poisoned', name: 'Poisoned', icon: '&#x2620;' },
      { id: 'prone', name: 'Prone', icon: '&#x1F6B6;' },
      { id: 'restrained', name: 'Restrained', icon: '&#x26D3;' },
      { id: 'stunned', name: 'Stunned', icon: '&#x2B50;' },
      { id: 'unconscious', name: 'Unconscious', icon: '&#x1F4A4;' },
      { id: 'exhaustion', name: 'Exhaustion', icon: '&#x1F62B;' },
      // Buffs
      { id: 'blessed', name: 'Blessed', icon: '&#x2728;' },
      { id: 'hasted', name: 'Hasted', icon: '&#x1F3C3;' },
      { id: 'enlarged', name: 'Enlarged', icon: '&#x2195;' },
      { id: 'invisible_buff', name: 'Greater Invisibility', icon: '&#x1F47B;' },
      { id: 'flying', name: 'Flying', icon: '&#x1F985;' },
      { id: 'raging', name: 'Raging', icon: '&#x1F4A2;' },
      { id: 'concentrating', name: 'Concentrating', icon: '&#x1F9E0;' }
    ];
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Only activate these listeners if the sheet is editable
    if (!this.isEditable) return;

    // ===== HEADER CONTROLS =====
    html.find('.close-btn').click(this._onCloseSheet.bind(this));
    html.find('#settings-btn').click(this._onOpenSettings.bind(this));

    // Theme toggle
    html.find('.theme-btn').click(this._onThemeToggle.bind(this));

    // ===== HP CONTROLS =====
    html.find('#hp-display').click(this._onHPClick.bind(this));
    html.find('#hp-display').contextmenu(this._onHPRightClick.bind(this));

    // ===== INITIATIVE =====
    html.find('#initiative-button').click(this._onInitiativeRoll.bind(this));

    // ===== REST BUTTONS =====
    html.find('#short-rest-btn').click(this._onShortRest.bind(this));
    html.find('#long-rest-btn').click(this._onLongRest.bind(this));

    // ===== ADVANTAGE TOGGLE =====
    html.find('#advantage-btn').click(() => this._setAdvantage('advantage'));
    html.find('#normal-btn').click(() => this._setAdvantage('normal'));
    html.find('#disadvantage-btn').click(() => this._setAdvantage('disadvantage'));

    // ===== COMBAT ECONOMY =====
    html.find('.action-economy-item').click(this._onToggleActionEconomy.bind(this));
    html.find('#turn-reset-btn').click(this._onResetTurn.bind(this));
    html.find('#round-reset-btn').click(this._onResetRound.bind(this));

    // ===== CONCENTRATION =====
    html.find('#drop-concentration-btn').click(this._onDropConcentration.bind(this));

    // ===== CONDITIONS =====
    html.find('#add-condition-btn').click(this._onToggleConditionsDropdown.bind(this));
    html.find('.condition-option').click(this._onAddCondition.bind(this));
    html.find('.condition-badge').click(this._onRemoveCondition.bind(this));

    // ===== DEATH SAVES =====
    html.find('#death-saves-display').click(this._onDeathSaveRoll.bind(this));

    // ===== INSPIRATION =====
    html.find('#inspiration-display').click(this._onToggleInspiration.bind(this));

    // ===== ABILITY CHECKS =====
    html.find('.ability-card').click(this._onAbilityRoll.bind(this));

    // ===== SAVING THROWS =====
    html.find('.save-card').click(this._onSaveRoll.bind(this));

    // ===== SKILL CHECKS =====
    html.find('.skill-card').click(this._onSkillRoll.bind(this));

    // ===== SPELL SLOTS =====
    html.find('.spell-slot-card').click(this._onUseSpellSlot.bind(this));
    html.find('.spell-slot-card').contextmenu(this._onRestoreSpellSlot.bind(this));

    // ===== RESOURCES =====
    html.find('.resource-use-btn').click(this._onUseResource.bind(this));
    html.find('.resource-restore-btn').click(this._onRestoreResource.bind(this));

    // ===== ACTIONS =====
    html.find('.attack-btn').click(this._onAttackRoll.bind(this));
    html.find('.damage-btn').click(this._onDamageRoll.bind(this));
    html.find('.use-btn').click(this._onUseAction.bind(this));
    html.find('.action-header').click(this._onToggleActionDescription.bind(this));

    // ===== SPELLS =====
    html.find('.cast-btn').click(this._onCastSpell.bind(this));
    html.find('.spell-header').click(this._onToggleSpellDescription.bind(this));

    // ===== FILTERS =====
    html.find('.filter-btn').click(this._onFilterClick.bind(this));
    html.find('#actions-search').on('input', this._onActionsSearch.bind(this));
    html.find('#spells-search').on('input', this._onSpellsSearch.bind(this));
    html.find('#inventory-search').on('input', this._onInventorySearch.bind(this));

    // ===== SECTION COLLAPSE =====
    html.find('.section h3').click(this._onToggleSection.bind(this));

    // ===== INVENTORY =====
    html.find('.item-equip-btn').click(this._onToggleEquipped.bind(this));
    html.find('.item-edit-btn').click(this._onEditItem.bind(this));
    html.find('.item-delete-btn').click(this._onDeleteItem.bind(this));
  }

  // ===== EVENT HANDLERS =====

  _onCloseSheet(event) {
    event.preventDefault();
    this.close();
  }

  _onOpenSettings(event) {
    event.preventDefault();
    // Open module settings
    game.settings.sheet.render(true);
  }

  _onThemeToggle(event) {
    event.preventDefault();
    const theme = event.currentTarget.dataset.theme;
    document.documentElement.setAttribute('data-theme', theme);
    // Save preference
    game.settings.set('foundcloud', 'theme', theme);
  }

  async _onHPClick(event) {
    event.preventDefault();
    // Open HP modification dialog
    const current = this.actor.system.attributes.hp.value;
    const max = this.actor.system.attributes.hp.max;

    new Dialog({
      title: 'Modify Hit Points',
      content: `
        <form>
          <div class="form-group">
            <label>Current HP: ${current}/${max}</label>
          </div>
          <div class="form-group">
            <label>Damage/Healing:</label>
            <input type="number" name="amount" value="0" autofocus />
            <p class="notes">Positive = healing, Negative = damage</p>
          </div>
        </form>
      `,
      buttons: {
        damage: {
          icon: '<i class="fas fa-minus"></i>',
          label: 'Damage',
          callback: (html) => {
            const amount = Math.abs(parseInt(html.find('[name="amount"]').val()) || 0);
            this.actor.applyDamage(amount);
          }
        },
        heal: {
          icon: '<i class="fas fa-plus"></i>',
          label: 'Heal',
          callback: (html) => {
            const amount = Math.abs(parseInt(html.find('[name="amount"]').val()) || 0);
            this.actor.applyDamage(-amount);
          }
        }
      },
      default: 'heal'
    }).render(true);
  }

  _onHPRightClick(event) {
    event.preventDefault();
    // Quick damage -1
    this.actor.applyDamage(1);
  }

  async _onInitiativeRoll(event) {
    event.preventDefault();
    await this.actor.rollInitiative({ createCombatants: true });
  }

  async _onShortRest(event) {
    event.preventDefault();
    await this.actor.shortRest();
  }

  async _onLongRest(event) {
    event.preventDefault();
    await this.actor.longRest();
  }

  _setAdvantage(state) {
    this.advantageState = state;
    this.render(false);
  }

  _getRollOptions() {
    const options = {};
    if (this.advantageState === 'advantage') options.advantage = true;
    if (this.advantageState === 'disadvantage') options.disadvantage = true;
    return options;
  }

  _onToggleActionEconomy(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const type = element.id.replace('-indicator', '').replace(/-/g, '');

    // Map element IDs to state keys
    const keyMap = {
      'action': 'actionUsed',
      'bonusaction': 'bonusActionUsed',
      'movement': 'movementUsed',
      'reaction': 'reactionUsed'
    };

    const key = keyMap[type];
    if (key) {
      this.combatState[key] = !this.combatState[key];
      element.dataset.used = this.combatState[key];
    }
  }

  _onResetTurn(event) {
    event.preventDefault();
    this.combatState.actionUsed = false;
    this.combatState.bonusActionUsed = false;
    this.combatState.movementUsed = false;
    this.render(false);
  }

  _onResetRound(event) {
    event.preventDefault();
    this.combatState.actionUsed = false;
    this.combatState.bonusActionUsed = false;
    this.combatState.movementUsed = false;
    this.combatState.reactionUsed = false;
    this.render(false);
  }

  _onDropConcentration(event) {
    event.preventDefault();
    this.combatState.concentration = null;
    this.render(false);
  }

  _onToggleConditionsDropdown(event) {
    event.preventDefault();
    const dropdown = this.element.find('.conditions-dropdown');
    dropdown.toggle();
  }

  _onAddCondition(event) {
    event.preventDefault();
    const conditionId = event.currentTarget.dataset.condition;
    if (!this.combatState.conditions.includes(conditionId)) {
      this.combatState.conditions.push(conditionId);
      this.render(false);
    }
  }

  _onRemoveCondition(event) {
    event.preventDefault();
    const conditionId = event.currentTarget.dataset.condition;
    this.combatState.conditions = this.combatState.conditions.filter(c => c !== conditionId);
    this.render(false);
  }

  async _onDeathSaveRoll(event) {
    event.preventDefault();
    await this.actor.rollDeathSave(this._getRollOptions());
  }

  async _onToggleInspiration(event) {
    event.preventDefault();
    const current = this.actor.system.attributes.inspiration;
    await this.actor.update({ 'system.attributes.inspiration': !current });
  }

  async _onAbilityRoll(event) {
    event.preventDefault();
    const ability = event.currentTarget.dataset.ability;
    await this.actor.rollAbilityTest(ability, this._getRollOptions());
  }

  async _onSaveRoll(event) {
    event.preventDefault();
    const ability = event.currentTarget.dataset.ability;
    await this.actor.rollAbilitySave(ability, this._getRollOptions());
  }

  async _onSkillRoll(event) {
    event.preventDefault();
    const skill = event.currentTarget.dataset.skill;
    await this.actor.rollSkill(skill, this._getRollOptions());
  }

  async _onUseSpellSlot(event) {
    event.preventDefault();
    const level = parseInt(event.currentTarget.dataset.level);
    const current = this.actor.system.spells[`spell${level}`].value;
    if (current > 0) {
      await this.actor.update({ [`system.spells.spell${level}.value`]: current - 1 });
    }
  }

  async _onRestoreSpellSlot(event) {
    event.preventDefault();
    const level = parseInt(event.currentTarget.dataset.level);
    const slot = this.actor.system.spells[`spell${level}`];
    if (slot.value < slot.max) {
      await this.actor.update({ [`system.spells.spell${level}.value`]: slot.value + 1 });
    }
  }

  async _onUseResource(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest('.resource-card').dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item && item.system.uses.value > 0) {
      await item.update({ 'system.uses.value': item.system.uses.value - 1 });
    }
  }

  async _onRestoreResource(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest('.resource-card').dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item && item.system.uses.value < item.system.uses.max) {
      await item.update({ 'system.uses.value': item.system.uses.value + 1 });
    }
  }

  async _onAttackRoll(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest('.action-card').dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item) {
      await item.rollAttack(this._getRollOptions());
    }
  }

  async _onDamageRoll(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest('.action-card').dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item) {
      await item.rollDamage(this._getRollOptions());
    }
  }

  async _onUseAction(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest('.action-card').dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item) {
      await item.use();
    }
  }

  _onToggleActionDescription(event) {
    event.preventDefault();
    const card = event.currentTarget.closest('.action-card');
    const description = card.querySelector('.action-description');
    if (description) {
      description.classList.toggle('expanded');
    }
  }

  async _onCastSpell(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest('.spell-card').dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item) {
      // Check concentration
      if (item.system.components?.concentration) {
        this.combatState.concentration = item.name;
      }
      await item.use();
    }
  }

  _onToggleSpellDescription(event) {
    event.preventDefault();
    const card = event.currentTarget.closest('.spell-card');
    const description = card.querySelector('.spell-description');
    if (description) {
      description.classList.toggle('expanded');
    }
  }

  _onFilterClick(event) {
    event.preventDefault();
    const btn = event.currentTarget;
    const filterType = btn.dataset.type;
    const filterValue = btn.dataset.filter;

    // Update active state
    btn.closest('.filter-group, div').querySelectorAll(`[data-type="${filterType}"]`).forEach(b => {
      b.classList.remove('active');
    });
    btn.classList.add('active');

    // Update filter state
    const filterMap = {
      'spell-level': 'spellLevel',
      'spell-category': 'spellCategory',
      'spell-casting-time': 'spellCastingTime',
      'action-type': 'actionType',
      'action-category': 'actionCategory',
      'inventory-filter': 'inventoryFilter'
    };

    if (filterMap[filterType]) {
      this.filters[filterMap[filterType]] = filterValue;
      this.render(false);
    }
  }

  _onActionsSearch(event) {
    this.searchTerms.actions = event.currentTarget.value.toLowerCase();
    this._applyFilters();
  }

  _onSpellsSearch(event) {
    this.searchTerms.spells = event.currentTarget.value.toLowerCase();
    this._applyFilters();
  }

  _onInventorySearch(event) {
    this.searchTerms.inventory = event.currentTarget.value.toLowerCase();
    this._applyFilters();
  }

  _applyFilters() {
    // Filter actions
    this.element.find('.action-card').each((i, el) => {
      const name = el.dataset.name?.toLowerCase() || '';
      const actionType = el.dataset.actionType || 'action';
      const category = el.dataset.category || 'utility';

      const matchesSearch = !this.searchTerms.actions || name.includes(this.searchTerms.actions);
      const matchesType = this.filters.actionType === 'all' || actionType === this.filters.actionType;
      const matchesCategory = this.filters.actionCategory === 'all' || category === this.filters.actionCategory;

      el.style.display = (matchesSearch && matchesType && matchesCategory) ? '' : 'none';
    });

    // Filter spells
    this.element.find('.spell-card').each((i, el) => {
      const name = el.dataset.name?.toLowerCase() || '';
      const level = el.dataset.level || '0';
      const category = el.dataset.category || 'utility';
      const castingTime = el.dataset.castingTime || 'action';

      const matchesSearch = !this.searchTerms.spells || name.includes(this.searchTerms.spells);
      const matchesLevel = this.filters.spellLevel === 'all' || level === this.filters.spellLevel;
      const matchesCategory = this.filters.spellCategory === 'all' || category === this.filters.spellCategory;
      const matchesTime = this.filters.spellCastingTime === 'all' || castingTime === this.filters.spellCastingTime;

      el.style.display = (matchesSearch && matchesLevel && matchesCategory && matchesTime) ? '' : 'none';
    });

    // Filter inventory
    this.element.find('.inventory-item').each((i, el) => {
      const name = el.dataset.name?.toLowerCase() || '';
      const equipped = el.dataset.equipped === 'true';
      const attuned = el.dataset.attuned === 'true';
      const isContainer = el.dataset.isContainer === 'true';

      const matchesSearch = !this.searchTerms.inventory || name.includes(this.searchTerms.inventory);
      let matchesFilter = true;

      switch (this.filters.inventoryFilter) {
        case 'equipped':
          matchesFilter = equipped;
          break;
        case 'attuned':
          matchesFilter = attuned;
          break;
        case 'container':
          matchesFilter = isContainer;
          break;
      }

      el.style.display = (matchesSearch && matchesFilter) ? '' : 'none';
    });
  }

  _onToggleSection(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const content = header.nextElementSibling;

    header.classList.toggle('collapsed');
    content.classList.toggle('collapsed');
  }

  async _onToggleEquipped(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest('.inventory-item').dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item) {
      await item.update({ 'system.equipped': !item.system.equipped });
    }
  }

  _onEditItem(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest('.inventory-item').dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item) {
      item.sheet.render(true);
    }
  }

  async _onDeleteItem(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest('.inventory-item').dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item) {
      const confirm = await Dialog.confirm({
        title: 'Delete Item',
        content: `<p>Are you sure you want to delete ${item.name}?</p>`
      });
      if (confirm) {
        await item.delete();
      }
    }
  }
}
