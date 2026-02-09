/**
 * FoundCloud Settings Manager
 * Handles module configuration and user preferences
 */

export class FoundCloudSettings {
  constructor() {
    this.namespace = 'foundcloud';
  }

  /**
   * Register all module settings
   */
  async register() {
    console.log('FoundCloud | Registering settings...');

    // First load flag
    game.settings.register(this.namespace, 'firstLoad', {
      name: 'First Load',
      scope: 'client',
      config: false,
      type: Boolean,
      default: true
    });

    // Extension connection status
    game.settings.register(this.namespace, 'extensionConnected', {
      name: 'Extension Connected',
      scope: 'client',
      config: false,
      type: Boolean,
      default: false
    });

    // Auto-sync on combat turn
    game.settings.register(this.namespace, 'autoSyncOnTurn', {
      name: 'Auto-sync on Combat Turn',
      hint: 'Automatically sync character data when their turn starts in combat',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false
    });

    // Discord integration enabled
    game.settings.register(this.namespace, 'discordEnabled', {
      name: 'Discord Integration',
      hint: 'Enable Discord turn notifications and roll announcements',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true
    });

    // Show import notifications
    game.settings.register(this.namespace, 'showImportNotifications', {
      name: 'Show Import Notifications',
      hint: 'Show notifications when characters are imported or synced',
      scope: 'client',
      config: true,
      type: Boolean,
      default: true
    });

    // Auto-detect extension
    game.settings.register(this.namespace, 'autoDetectExtension', {
      name: 'Auto-detect Extension',
      hint: 'Automatically detect and connect to the FoundCloud browser extension',
      scope: 'client',
      config: true,
      type: Boolean,
      default: true
    });

    // Import spells automatically
    game.settings.register(this.namespace, 'importSpells', {
      name: 'Import Spells',
      hint: 'Automatically import spells when syncing characters',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true
    });

    // Import items automatically
    game.settings.register(this.namespace, 'importItems', {
      name: 'Import Equipment',
      hint: 'Automatically import equipment and items when syncing characters',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true
    });

    // Import class features
    game.settings.register(this.namespace, 'importFeatures', {
      name: 'Import Class Features',
      hint: 'Automatically import class features when syncing characters',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true
    });

    // Override existing data
    game.settings.register(this.namespace, 'overrideExisting', {
      name: 'Override Existing Data',
      hint: 'When syncing, override existing character data in Foundry (if disabled, only updates missing values)',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false
    });

    // Debug mode
    game.settings.register(this.namespace, 'debugMode', {
      name: 'Debug Mode',
      hint: 'Enable detailed console logging for troubleshooting',
      scope: 'client',
      config: true,
      type: Boolean,
      default: false
    });

    // DiceCloud User ID
    game.settings.register(this.namespace, 'dicecloudUserId', {
      name: 'DiceCloud User ID (REQUIRED)',
      hint: 'REQUIRED for privacy: Your DiceCloud user ID from your profile URL (dicecloud.com/character/YOUR_USER_ID/...). Only characters owned by this ID will be visible.',
      scope: 'client',
      config: true,
      type: String,
      default: ''
    });

    console.log('FoundCloud | Settings registered');
  }

  /**
   * Check if this is the first load
   * @returns {boolean}
   */
  isFirstLoad() {
    return game.settings.get(this.namespace, 'firstLoad');
  }

  /**
   * Mark first load as complete
   */
  setFirstLoadComplete() {
    game.settings.set(this.namespace, 'firstLoad', false);
  }

  /**
   * Get a setting value
   * @param {string} key - Setting key
   * @returns {*}
   */
  get(key) {
    return game.settings.get(this.namespace, key);
  }

  /**
   * Set a setting value
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   */
  async set(key, value) {
    await game.settings.set(this.namespace, key, value);
  }

  /**
   * Check if debug mode is enabled
   * @returns {boolean}
   */
  isDebugMode() {
    return this.get('debugMode');
  }

  /**
   * Log debug message if debug mode is enabled
   * @param {...*} args - Arguments to log
   */
  debug(...args) {
    if (this.isDebugMode()) {
      console.log('FoundCloud [DEBUG]', ...args);
    }
  }
}
