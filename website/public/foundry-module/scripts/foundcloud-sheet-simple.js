/**
 * FoundCloud Simplified Character Sheet
 * Standalone sheet matching RollCloud structure with orange theme
 * Extends base ActorSheet only (no D&D 5e dependencies)
 */

export class FoundCloudSheetSimple extends ActorSheet {
  constructor(...args) {
    super(...args);

    // Combat state tracking (matches RollCloud)
    this.combatState = {
      actionUsed: false,
      bonusActionUsed: false,
      movementUsed: false,
      reactionUsed: false,
      concentration: null,
      conditions: []
    };

    // Advantage state (matches RollCloud)
    this.advantageState = 'normal'; // 'advantage', 'normal', 'disadvantage'

    // Filter states (matches RollCloud)
    this.filters = {
      spellLevel: 'all',
      spellCategory: 'all',
      spellCastingTime: 'all',
      actionType: 'all',
      actionCategory: 'all',
      inventoryFilter: 'equipped'
    };

    // Search terms (matches RollCloud)
    this.searchTerms = {
      actions: '',
      spells: '',
      inventory: ''
    };

    // Theme preference
    this.theme = 'dark';
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['foundcloud-simple', 'sheet', 'actor', 'character'],
      template: 'modules/foundcloud/templates/foundcloud-sheet-simple.hbs',
      width: 800,
      height: 900,
      scrollY: ['.content-area'],
      resizable: true
    });
  }

  /** @override */
  get template() {
    return 'modules/foundcloud/templates/foundcloud-sheet-simple.hbs';
  }

  /** @override */
  async getData(options) {
    const context = await super.getData(options);
    const actor = this.actor;
    const system = actor.system;

    // Build sheet data - spread directly into context so the template can access
    // (template uses {{characterClass}} not {{foundcloud.characterClass}})
    const sheetData = {
      // Combat state
      combatState: this.combatState,
      advantageState: this.advantageState,

      // Advantage states for template
      isAdvantage: this.advantageState === 'advantage',
      isNormal: this.advantageState === 'normal',
      isDisadvantage: this.advantageState === 'disadvantage',

      // Theme
      isLightTheme: this.theme === 'light',
      theme: this.theme,

      // Player color for chat and token border
      playerColor: this.actor.getFlag('foundcloud', 'playerColor') || '#3ea895',

      // Character info
      characterClass: this._getClassString(system),
      characterLevel: system.details?.level || 1,
      characterRace: system.details?.race || system.details?.species || 'Unknown',

      // Hit Dice
      hitDice: this._getHitDiceString(system),

      // Core stats
      armorClass: system.attributes?.ac?.value || 10,
      speed: system.attributes?.movement?.walk || 30,
      proficiencyBonus: system.attributes?.prof || 2,
      initiative: this._getInitiativeBonus(system),

      // HP
      hp: {
        current: system.attributes?.hp?.value || 0,
        max: system.attributes?.hp?.max || 0,
        temp: system.attributes?.hp?.temp || 0
      },

      // Death Saves
      deathSaves: {
        successes: system.attributes?.death?.success || 0,
        failures: system.attributes?.death?.failure || 0
      },

      // Inspiration
      inspiration: system.attributes?.inspiration || false,

      // Abilities
      abilities: this._prepareAbilities(system),

      // Saves
      saves: this._prepareSaves(system),

      // Skills
      skills: this._prepareSkills(system),

      // Resources
      resources: this._prepareResources(system),

      // Spell Slots
      spellSlots: this._prepareSpellSlots(system),

      // Spells
      spells: this._prepareSpells(actor).filter(spell => this._filterSpell(spell)),

      // Actions
      actions: this._prepareActions(actor).filter(action => this._filterAction(action)),

      // Inventory
      inventory: this._prepareInventory(actor),

      // Conditions list for dropdown
      conditionsList: this._getConditionsList(),

      // Status bar computed fields
      hpPercent: (system.attributes?.hp?.max || 0) > 0 ? Math.round(((system.attributes?.hp?.value || 0) / (system.attributes?.hp?.max || 1)) * 100) : 0,
      hpClass: (system.attributes?.hp?.max || 0) > 0 ? ((system.attributes?.hp?.value || 0) <= (system.attributes?.hp?.max || 0) * 0.25 ? 'critical' : (system.attributes?.hp?.value || 0) <= (system.attributes?.hp?.max || 0) * 0.5 ? 'low' : '') : '',
      spellSlotsSummary: this._getSpellSlotsSummary(system)
    };

    // Spread into root context so template can access directly
    Object.assign(context, sheetData);
    context.foundcloud = sheetData;

    return context;
  }

  /**
   * Get class string
   */
  _getClassString(system) {
    // Try class Items first (D&D 5e populates system.classes from embedded Items)
    const classes = system.classes || {};
    const classNames = Object.values(classes).map(c => c.name || c.identifier).filter(Boolean);
    if (classNames.length > 0) return classNames.join(' / ');

    // Fallback: check actor flags for imported class name
    const flagClass = this.actor.getFlag('foundcloud', 'className');
    if (flagClass) return flagClass;

    return 'Unknown';
  }

  /**
   * Get hit dice string
   */
  _getHitDiceString(system) {
    const classes = system.classes || {};
    let totalDice = 0;
    let totalMax = 0;
    let diceType = 'd8';

    for (const cls of Object.values(classes)) {
      const levels = cls.levels || cls.system?.levels || 0;
      const hitDice = cls.hitDice || cls.system?.hitDice || 'd8';
      totalMax += levels;
      diceType = hitDice;
    }

    totalDice = system.attributes?.hd?.value || totalMax;
    return `${totalDice}/${totalMax} ${diceType}`;
  }

  /**
   * Get spell slots summary string for status bar (e.g. "5/8")
   */
  _getSpellSlotsSummary(system) {
    const spells = system.spells || {};
    let available = 0;
    let total = 0;
    for (let i = 1; i <= 9; i++) {
      const slot = spells[`spell${i}`] || {};
      const max = slot.max || slot.override || 0;
      if (max > 0) {
        total += max;
        available += slot.value !== undefined ? slot.value : max;
      }
    }
    return total > 0 ? `${available}/${total}` : null;
  }

  /**
   * Get initiative bonus
   */
  _getInitiativeBonus(system) {
    const dex = parseInt(system.abilities?.dex?.mod) || 0;
    const bonus = parseInt(system.attributes?.init?.bonus) || 0;
    const total = dex + bonus;
    // Format: "+3", "-2", or "+0" (not "+00")
    if (total === 0) return '+0';
    return total > 0 ? `+${total}` : `${total}`;
  }

  /**
   * Prepare abilities
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
      const ability = system.abilities?.[key] || {};
      const value = ability.value || 10;
      const mod = ability.mod || Math.floor((value - 10) / 2);
      
      abilities.push({
        key,
        name,
        abbr: key.toUpperCase(),
        value,
        mod: mod >= 0 ? `+${mod}` : `${mod}`
      });
    }

    return abilities;
  }

  /**
   * Prepare saves
   */
  _prepareSaves(system) {
    const saves = [];
    const abilityNames = {
      str: 'STR',
      dex: 'DEX',
      con: 'CON',
      int: 'INT',
      wis: 'WIS',
      cha: 'CHA'
    };

    const profBonus = system.attributes?.prof || 2;

    for (const [key, abbr] of Object.entries(abilityNames)) {
      const ability = system.abilities?.[key] || {};
      const save = ability.save || {};
      const proficient = save.proficient || 0;
      const abilityMod = ability.mod || 0;

      // D&D 5e stores total at save.value, but compute if missing
      let saveMod = save.value || save.total;
      if (saveMod === undefined) {
        saveMod = abilityMod + (proficient > 0 ? profBonus : 0);
      }

      saves.push({
        key,
        abbr,
        mod: saveMod >= 0 ? `+${saveMod}` : `${saveMod}`,
        proficient: proficient > 0
      });
    }

    return saves;
  }

  /**
   * Prepare skills
   */
  _prepareSkills(system) {
    const skills = [];
    const skillList = {
      acr: { name: 'Acrobatics', ability: 'dex' },
      ani: { name: 'Animal Handling', ability: 'wis' },
      arc: { name: 'Arcana', ability: 'int' },
      ath: { name: 'Athletics', ability: 'str' },
      dec: { name: 'Deception', ability: 'cha' },
      his: { name: 'History', ability: 'int' },
      ins: { name: 'Insight', ability: 'wis' },
      itm: { name: 'Intimidation', ability: 'cha' },
      inv: { name: 'Investigation', ability: 'int' },
      med: { name: 'Medicine', ability: 'wis' },
      nat: { name: 'Nature', ability: 'int' },
      prc: { name: 'Perception', ability: 'wis' },
      prf: { name: 'Performance', ability: 'cha' },
      per: { name: 'Persuasion', ability: 'cha' },
      rel: { name: 'Religion', ability: 'int' },
      slt: { name: 'Sleight of Hand', ability: 'dex' },
      ste: { name: 'Stealth', ability: 'dex' },
      sur: { name: 'Survival', ability: 'wis' }
    };

    for (const [key, info] of Object.entries(skillList)) {
      const skill = system.skills?.[key] || {};
      const proficient = skill.proficient || 0;
      const mod = skill.total || 0;

      skills.push({
        key,
        name: info.name,
        ability: info.ability.toUpperCase(),
        mod: mod >= 0 ? `+${mod}` : `${mod}`,
        proficient: proficient === 1,
        expertise: proficient === 2
      });
    }

    return skills;
  }

  /**
   * Prepare resources
   */
  _prepareResources(system) {
    const resources = [];
    const resourceKeys = ['primary', 'secondary', 'tertiary'];

    for (const key of resourceKeys) {
      const resource = system.resources?.[key];
      if (resource && resource.max > 0) {
        resources.push({
          id: key,
          name: resource.label || key,
          current: resource.value || 0,
          max: resource.max || 0,
          recovery: resource.sr ? 'Short Rest' : resource.lr ? 'Long Rest' : 'Manual'
        });
      }
    }

    return resources;
  }

  /**
   * Prepare spell slots
   */
  _prepareSpellSlots(system) {
    const slots = [];
    const spells = system.spells || {};

    for (let level = 1; level <= 9; level++) {
      const slot = spells[`spell${level}`] || {};
      const max = slot.max || slot.override || 0;
      const current = slot.value !== undefined ? slot.value : max;

      slots.push({
        level,
        levelLabel: this._getOrdinal(level) + ' Level',
        current,
        max,
        isEmpty: max === 0
      });
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
   * Prepare spells
   */
  _prepareSpells(actor) {
    const spells = [];
    const spellItems = actor.items.filter(i => i.type === 'spell');

    for (const spell of spellItems) {
      const system = spell.system;
      spells.push({
        id: spell.id,
        name: spell.name,
        level: system.level || 0,
        school: system.school || '',
        concentration: system.components?.concentration || false,
        ritual: system.components?.ritual || false,
        category: this._determineSpellCategory(system),
        castingTime: this._determineCastingTime(system),
        description: system.description?.value || '',
        hasAttack: !!system.actionType && system.actionType !== 'save',
        hasDamage: system.damage?.parts?.length > 0,
        damage: this._formatDamage(system.damage)
      });
    }

    return spells;
  }

  /**
   * Determine spell category
   */
  _determineSpellCategory(system) {
    if (system.actionType === 'heal') return 'healing';
    if (system.damage?.parts?.length > 0) return 'damage';
    return 'utility';
  }

  /**
   * Determine casting time
   */
  _determineCastingTime(system) {
    const activation = system.activation?.type;
    if (activation === 'bonus') return 'bonus';
    if (activation === 'reaction') return 'reaction';
    return 'action';
  }

  /**
   * Format damage
   */
  _formatDamage(damage) {
    if (!damage || !damage.parts || damage.parts.length === 0) return '';
    return damage.parts.map(p => p[0]).join(' + ');
  }

  /**
   * Prepare actions
   */
  _prepareActions(actor) {
    const actions = [];
    // Include all weapons, feats, and consumables (don't require activation type)
    const actionItems = actor.items.filter(i =>
      ['weapon', 'feat', 'consumable'].includes(i.type)
    );

    for (const item of actionItems) {
      const system = item.system;

      // Determine activation type, default to 'action' if not set
      const activationType = system.activation?.type || 'action';

      actions.push({
        id: item.id,
        name: item.name,
        actionType: this._getActionType(activationType),
        category: this._determineActionCategory(system),
        description: system.description?.value || '',
        hasAttack: !!system.actionType && system.actionType !== 'save',
        hasDamage: system.damage?.parts?.length > 0,
        attackBonus: system.attackBonus ? `+${system.attackBonus}` : '',
        damage: this._formatDamage(system.damage)
      });
    }

    return actions;
  }

  /**
   * Get action type
   */
  _getActionType(activationType) {
    if (activationType === 'bonus') return 'bonus';
    if (activationType === 'reaction') return 'reaction';
    if (activationType === 'none') return 'free';
    return 'action';
  }

  /**
   * Determine action category
   */
  _determineActionCategory(system) {
    if (system.actionType === 'heal') return 'healing';
    if (system.damage?.parts?.length > 0) return 'damage';
    return 'utility';
  }

  /**
   * Filter spell based on current filter state
   */
  _filterSpell(spell) {
    // Level filter
    if (this.filters.spellLevel !== 'all' && spell.level !== parseInt(this.filters.spellLevel)) {
      return false;
    }

    // Category filter
    if (this.filters.spellCategory !== 'all' && spell.category !== this.filters.spellCategory) {
      return false;
    }

    // Casting time filter
    if (this.filters.spellCastingTime !== 'all' && spell.castingTime !== this.filters.spellCastingTime) {
      return false;
    }

    // Search filter
    if (this.searchTerms.spells && !spell.name.toLowerCase().includes(this.searchTerms.spells)) {
      return false;
    }

    return true;
  }

  /**
   * Filter action based on current filter state
   */
  _filterAction(action) {
    // Action type filter
    if (this.filters.actionType !== 'all' && action.actionType !== this.filters.actionType) {
      return false;
    }

    // Category filter
    if (this.filters.actionCategory !== 'all' && action.category !== this.filters.actionCategory) {
      return false;
    }

    // Search filter
    if (this.searchTerms.actions && !action.name.toLowerCase().includes(this.searchTerms.actions)) {
      return false;
    }

    return true;
  }

  /**
   * Prepare inventory
   */
  _prepareInventory(actor) {
    const inventory = [];
    const items = actor.items.filter(i =>
      ['weapon', 'equipment', 'consumable', 'tool', 'loot', 'container'].includes(i.type)
    );

    for (const item of items) {
      const system = item.system;
      inventory.push({
        id: item.id,
        name: item.name,
        quantity: system.quantity || 1,
        weight: system.weight || 0,
        equipped: system.equipped || false,
        attuned: system.attunement === 2,
        requiresAttunement: system.attunement === 1
      });
    }

    return inventory;
  }

  /**
   * Get conditions list
   */
  _getConditionsList() {
    return [
      { id: 'blinded', name: 'Blinded', icon: '👁️' },
      { id: 'charmed', name: 'Charmed', icon: '💖' },
      { id: 'deafened', name: 'Deafened', icon: '👂' },
      { id: 'frightened', name: 'Frightened', icon: '😨' },
      { id: 'grappled', name: 'Grappled', icon: '✋' },
      { id: 'incapacitated', name: 'Incapacitated', icon: '😵' },
      { id: 'invisible', name: 'Invisible', icon: '👻' },
      { id: 'paralyzed', name: 'Paralyzed', icon: '⚡' },
      { id: 'petrified', name: 'Petrified', icon: '🪨' },
      { id: 'poisoned', name: 'Poisoned', icon: '☠️' },
      { id: 'prone', name: 'Prone', icon: '🚶' },
      { id: 'restrained', name: 'Restrained', icon: '⛓️' },
      { id: 'stunned', name: 'Stunned', icon: '⭐' },
      { id: 'unconscious', name: 'Unconscious', icon: '💤' },
      { id: 'exhaustion', name: 'Exhaustion', icon: '😫' }
    ];
  }

  /** @override */
  async activateListeners(html) {
    super.activateListeners(html);

    if (!this.isEditable) return;

    // Apply custom player color to portrait border and ensure token setup
    const playerColor = this.actor.getFlag('foundcloud', 'playerColor') || '#3ea895';
    html.find('#char-portrait').css('border-color', playerColor);

    // Ensure token uses portrait and colored ring (must complete before drag)
    await this._ensureTokenSetup(playerColor);

    // Theme toggle
    html.find('.theme-btn').click(this._onThemeToggle.bind(this));

    // Settings & Close
    html.find('#settings-btn').click(this._onOpenSettings.bind(this));
    html.find('#close-btn').click(this._onCloseSheet.bind(this));

    // Player color picker
    html.find('#player-color').change(this._onPlayerColorChange.bind(this));

    // Draggable portrait
    html.find('#char-portrait').on('dragstart', this._onDragPortrait.bind(this));

    // HP management
    html.find('#hp-display').click(this._onHPClick.bind(this));

    // Initiative
    html.find('#initiative-button').click(this._onInitiativeRoll.bind(this));

    // Rest buttons
    html.find('#short-rest-btn').click(this._onShortRest.bind(this));
    html.find('#long-rest-btn').click(this._onLongRest.bind(this));

    // Advantage toggle (header + status bar)
    html.find('#advantage-btn, .status-adv-btn[data-adv="advantage"]').click(() => this._setAdvantage('advantage'));
    html.find('#normal-btn, .status-adv-btn[data-adv="normal"]').click(() => this._setAdvantage('normal'));
    html.find('#disadvantage-btn, .status-adv-btn[data-adv="disadvantage"]').click(() => this._setAdvantage('disadvantage'));

    // Combat economy
    html.find('.action-economy-item').click(this._onToggleActionEconomy.bind(this));
    html.find('#turn-reset-btn').click(this._onResetTurn.bind(this));
    html.find('#round-reset-btn').click(this._onResetRound.bind(this));

    // Concentration
    html.find('#drop-concentration-btn').click(this._onDropConcentration.bind(this));

    // Conditions
    html.find('#add-condition-btn').click(this._onToggleConditionsDropdown.bind(this));
    html.find('.condition-option').click(this._onAddCondition.bind(this));
    html.find('.condition-badge').click(this._onRemoveCondition.bind(this));

    // Death saves
    html.find('#death-saves-display').click(this._onDeathSaveRoll.bind(this));

    // Inspiration
    html.find('#inspiration-display').click(this._onToggleInspiration.bind(this));

    // Abilities, saves, skills
    html.find('.ability-card').click(this._onAbilityRoll.bind(this));
    html.find('.save-card').click(this._onSaveRoll.bind(this));
    html.find('.skill-card').click(this._onSkillRoll.bind(this));

    // Spell slots
    html.find('.spell-slot-card').click(this._onUseSpellSlot.bind(this));
    html.find('.spell-slot-card').contextmenu(this._onRestoreSpellSlot.bind(this));

    // Resources
    html.find('.resource-use-btn').click(this._onUseResource.bind(this));
    html.find('.resource-restore-btn').click(this._onRestoreResource.bind(this));

    // Spells
    html.find('.cast-btn').click(this._onCastSpell.bind(this));
    html.find('.spell-header').click(this._onToggleSpellDescription.bind(this));

    // Actions
    html.find('.attack-btn').click(this._onAttackRoll.bind(this));
    html.find('.damage-btn').click(this._onDamageRoll.bind(this));
    html.find('.action-header').click(this._onToggleActionDescription.bind(this));

    // Filters
    html.find('.filter-btn').click(this._onFilterClick.bind(this));
    html.find('#actions-search').on('input', this._onActionsSearch.bind(this));
    html.find('#spells-search').on('input', this._onSpellsSearch.bind(this));
    html.find('#inventory-search').on('input', this._onInventorySearch.bind(this));
  }

  // ===== EVENT HANDLERS =====

  _onThemeToggle(event) {
    event.preventDefault();
    this.theme = event.currentTarget.dataset.theme;

    // Update the form's data-theme attribute immediately for CSS
    const form = this.element.find('form');
    if (form.length) {
      form.attr('data-theme', this.theme);
    }

    // Update button states
    this.element.find('.theme-btn').removeClass('active');
    event.currentTarget.classList.add('active');
  }

  _onOpenSettings(event) {
    event.preventDefault();
    // Open Foundry module settings for foundcloud
    const settingsApp = new SettingsConfig();
    settingsApp.render(true);
  }

  _onCloseSheet(event) {
    event.preventDefault();
    this.close();
  }

  async _onPlayerColorChange(event) {
    event.preventDefault();
    const color = event.target.value;
    await this.actor.setFlag('foundcloud', 'playerColor', color);

    // Update portrait border color
    const portrait = this.element.find('#char-portrait');
    if (portrait.length) {
      portrait.css('border-color', color);
    }

    // Update actor prototype token to use portrait image and colored ring
    const updates = {
      'prototypeToken.texture.src': this.actor.img,  // Use portrait as token image
      'prototypeToken.ring.subject.scale': 1.0,      // Enable ring
      'prototypeToken.ring.colors.ring': color       // Set ring color
    };

    await this.actor.update(updates);
  }

  /**
   * Ensure token is configured to use portrait image and colored ring
   */
  async _ensureTokenSetup(color) {
    // Only update if needed
    const needsUpdate =
      this.actor.prototypeToken?.texture?.src !== this.actor.img ||
      this.actor.prototypeToken?.ring?.colors?.ring !== color;

    if (needsUpdate) {
      await this.actor.update({
        'prototypeToken.texture.src': this.actor.img,
        'prototypeToken.ring.subject.scale': 1.0,
        'prototypeToken.ring.colors.ring': color
      }, { diff: false, render: false });
    }
  }

  _onDragPortrait(event) {
    // Set up drag data for creating a token when dropped on canvas
    const dragData = {
      type: 'Actor',
      uuid: this.actor.uuid
    };
    event.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  }

  async _onHPClick(event) {
    event.preventDefault();
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
            <label>Amount:</label>
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

  async _onInitiativeRoll(event) {
    event.preventDefault();
    try {
      await this.actor.rollInitiative({ createCombatants: true });
    } catch (error) {
      console.error("Error rolling initiative:", error);
      ui.notifications.error("Failed to roll initiative.");
    }
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
    const used = element.dataset.used === 'true';
    element.dataset.used = !used;
    
    // Update combat state
    const id = element.id;
    if (id === 'action-indicator') this.combatState.actionUsed = !used;
    if (id === 'bonus-action-indicator') this.combatState.bonusActionUsed = !used;
    if (id === 'movement-indicator') this.combatState.movementUsed = !used;
    if (id === 'reaction-indicator') this.combatState.reactionUsed = !used;
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
    const dropdown = event.currentTarget.closest('.conditions-manager').querySelector('.conditions-dropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  }

  _onAddCondition(event) {
    event.preventDefault();
    const condition = event.currentTarget.dataset.condition;
    if (!this.combatState.conditions.includes(condition)) {
      this.combatState.conditions.push(condition);
      this.render(false);
    }
  }

  _onRemoveCondition(event) {
    event.preventDefault();
    const condition = event.currentTarget.dataset.condition;
    const index = this.combatState.conditions.indexOf(condition);
    if (index > -1) {
      this.combatState.conditions.splice(index, 1);
      this.render(false);
    }
  }

  async _onDeathSaveRoll(event) {
    event.preventDefault();
    const roll = await new Roll('1d20').evaluate({ async: true });
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: 'Death Saving Throw'
    });
  }

  async _onToggleInspiration(event) {
    event.preventDefault();
    const current = this.actor.system.attributes.inspiration;
    await this.actor.update({ 'system.attributes.inspiration': !current });
  }

  async _onAbilityRoll(event) {
    event.preventDefault();
    const ability = event.currentTarget.dataset.ability;
    try {
      await this.actor.rollAbilityTest(ability, this._getRollOptions());
    } catch (error) {
      console.error("Error rolling ability check:", error);
      ui.notifications.error(`Failed to roll ${ability.toUpperCase()} ability check.`);
    }
  }

  async _onSaveRoll(event) {
    event.preventDefault();
    const ability = event.currentTarget.dataset.ability;
    try {
      await this.actor.rollAbilitySave(ability, this._getRollOptions());
    } catch (error) {
      console.error("Error rolling saving throw:", error);
      ui.notifications.error(`Failed to roll ${ability.toUpperCase()} saving throw.`);
    }
  }

  async _onSkillRoll(event) {
    event.preventDefault();
    const skill = event.currentTarget.dataset.skill;
    try {
      await this.actor.rollSkill(skill, this._getRollOptions());
    } catch (error) {
      console.error("Error rolling skill:", error);
      ui.notifications.error("Failed to roll skill check.");
    }
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
    const max = this.actor.system.spells[`spell${level}`].max;
    await this.actor.update({ [`system.spells.spell${level}.value`]: max });
  }

  _onUseResource(event) {
    event.preventDefault();
    const resourceId = event.currentTarget.dataset.resourceId;
    const current = this.actor.system.resources[resourceId].value;
    if (current > 0) {
      this.actor.update({ [`system.resources.${resourceId}.value`]: current - 1 });
    }
  }

  _onRestoreResource(event) {
    event.preventDefault();
    const resourceId = event.currentTarget.dataset.resourceId;
    const max = this.actor.system.resources[resourceId].max;
    this.actor.update({ [`system.resources.${resourceId}.value`]: max });
  }

  async _onCastSpell(event) {
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item) {
      try {
        if (item.use) {
          await item.use();
        } else if (item.roll) {
          await item.roll();
        } else {
          ui.notifications.warn("This spell cannot be cast from the sheet.");
        }
      } catch (error) {
        console.error("Error casting spell:", error);
        ui.notifications.error("Failed to cast spell.");
      }
    }
  }

  _onToggleSpellDescription(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest('.spell-card').dataset.itemId;
    const description = event.currentTarget.closest('.spell-card').querySelector('.spell-description');
    description.classList.toggle('expanded');
  }

  async _onAttackRoll(event) {
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item) {
      try {
        await item.rollAttack(this._getRollOptions());
      } catch (error) {
        console.error("Error rolling attack:", error);
        ui.notifications.error(`Failed to roll attack for ${item.name}.`);
      }
    }
  }

  async _onDamageRoll(event) {
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item) {
      try {
        await item.rollDamage();
      } catch (error) {
        console.error("Error rolling damage:", error);
        ui.notifications.error(`Failed to roll damage for ${item.name}.`);
      }
    }
  }

  _onToggleActionDescription(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest('.action-card').dataset.itemId;
    const description = event.currentTarget.closest('.action-card').querySelector('.action-description');
    description.classList.toggle('expanded');
  }

  _onFilterClick(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const filterType = button.dataset.type;
    const filterValue = button.dataset.filter;

    // Update filter state
    this.filters[filterType] = filterValue;

    // Update button states
    const container = button.closest('div');
    container.querySelectorAll('.filter-btn').forEach(btn => {
      if (btn.dataset.type === filterType) {
        btn.classList.toggle('active', btn.dataset.filter === filterValue);
      }
    });

    this.render(false);
  }

  _onActionsSearch(event) {
    this.searchTerms.actions = event.target.value.toLowerCase();
    this.render(false);
  }

  _onSpellsSearch(event) {
    this.searchTerms.spells = event.target.value.toLowerCase();
    this.render(false);
  }

  _onInventorySearch(event) {
    this.searchTerms.inventory = event.target.value.toLowerCase();
    this.render(false);
  }
}
