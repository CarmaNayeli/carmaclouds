/**
 * FoundCloud for Foundry VTT
 * Companion module for the FoundCloud browser extension
 * Syncs DiceCloud V2 characters to Foundry with Discord integration
 *
 * @module FoundCloud
 * @version 1.2.3
 */

import { FoundCloudSettings } from './settings.js';
import { SupabaseBridge } from './supabase-bridge.js';
import { DiceCloudImporter } from './dicecloud-importer.js';
import { FoundCloudUI } from './ui.js';
import { FoundCloudSheet } from './foundcloud-sheet.js';

/**
 * Main FoundCloud module class
 */
class FoundCloud {
  constructor() {
    this.settings = null;
    this.bridge = null;
    this.importer = null;
    this.ui = null;
    this.initialized = false;
  }

  /**
   * Initialize the module
   */
  async initialize() {
    console.log('FoundCloud | Initializing module...');

    try {
      // Initialize settings
      this.settings = new FoundCloudSettings();
      await this.settings.register();
    } catch (error) {
      console.error('FoundCloud | Failed to initialize settings:', error);
    }

    try {
      // Initialize Supabase bridge
      this.bridge = new SupabaseBridge();
      await this.bridge.initialize();
    } catch (error) {
      console.error('FoundCloud | Failed to initialize Supabase bridge:', error);
      ui.notifications.warn('FoundCloud: Supabase connection failed. Import from cloud will not work.');
    }

    try {
      // Initialize DiceCloud importer
      this.importer = new DiceCloudImporter(this.bridge);
    } catch (error) {
      console.error('FoundCloud | Failed to initialize importer:', error);
    }

    // Always initialize UI so buttons work
    this.ui = new FoundCloudUI(this);

    // Mark as initialized even if some components failed
    this.initialized = true;
    console.log('FoundCloud | Module initialized (Supabase connected: ' + this.isSupabaseConnected() + ')');

    // Show welcome message on first load
    try {
      if (this.settings && this.settings.isFirstLoad()) {
        this.showWelcomeMessage();
      }
    } catch (error) {
      console.error('FoundCloud | Failed to show welcome message:', error);
    }
  }

  /**
   * Show welcome message to user
   */
  showWelcomeMessage() {
    const content = `
      <h2>Welcome to FoundCloud!</h2>
      <p>FoundCloud syncs your DiceCloud V2 characters to Foundry VTT via cloud sync.</p>
      <h3>Quick Setup:</h3>
      <ol>
        <li>Install the FoundCloud browser extension</li>
        <li>Login to DiceCloud in the extension</li>
        <li>Your characters are automatically synced to the cloud</li>
        <li>Import your characters using the FoundCloud button in the Actors sidebar</li>
      </ol>
      <p><strong>Note:</strong> This module uses Supabase for cloud sync. Characters are automatically available after the extension uploads them.</p>
      <p><strong>Need help?</strong> Visit the <a href="https://github.com/CarmaNayeli/foundCloud">GitHub repository</a> or message @Carmabella on Discord.</p>
    `;

    new Dialog({
      title: 'Welcome to FoundCloud',
      content: content,
      buttons: {
        ok: {
          icon: '<i class="fas fa-check"></i>',
          label: 'Got it!',
          callback: () => {
            this.settings.setFirstLoadComplete();
          }
        }
      },
      default: 'ok'
    }).render(true);
  }

  /**
   * Import a character from DiceCloud
   * @param {string} characterId - DiceCloud character ID
   */
  async importCharacter(characterId) {
    if (!this.initialized) {
      ui.notifications.error('FoundCloud: Module not initialized');
      return;
    }

    try {
      const actor = await this.importer.importCharacter(characterId);
      if (actor) {
        ui.notifications.info(`FoundCloud: Successfully imported ${actor.name}`);
        return actor;
      }
    } catch (error) {
      console.error('FoundCloud | Failed to import character:', error);
      ui.notifications.error(`FoundCloud: Failed to import character - ${error.message}`);
    }
  }

  /**
   * Check if Supabase is connected
   * @returns {boolean}
   */
  isSupabaseConnected() {
    return this.bridge && this.bridge.isConnected();
  }

  /**
   * Get available characters from Supabase
   * @returns {Promise<Array>}
   */
  async getAvailableCharacters() {
    if (!this.isSupabaseConnected()) {
      throw new Error('Supabase not connected');
    }
    return await this.bridge.getCharacters();
  }
}

// Create global instance
window.FoundCloud = new FoundCloud();

/**
 * Hook: Init
 * Register module settings and initialize core functionality
 */
Hooks.once('init', async () => {
  console.log('FoundCloud | Foundry VTT Module v1.3.0');
  console.log('FoundCloud | Initializing...');

  // Make FoundCloud API available globally
  game.foundcloud = window.FoundCloud;

  // Register the FoundCloud character sheet
  Actors.registerSheet('foundcloud', FoundCloudSheet, {
    types: ['character'],
    makeDefault: false,
    label: 'FoundCloud Sheet'
  });

  console.log('FoundCloud | Custom character sheet registered');

  // Register Handlebars helpers
  Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
  });

  Handlebars.registerHelper('neq', function(a, b) {
    return a !== b;
  });

  // Preload handlebars templates
  await loadTemplates([
    'modules/foundcloud/templates/foundcloud-sheet.hbs'
  ]);

  console.log('FoundCloud | Templates preloaded');
});

/**
 * Hook: Ready
 * Initialize module after Foundry is ready
 */
Hooks.once('ready', async () => {
  console.log('FoundCloud | Foundry ready, initializing module...');

  await game.foundcloud.initialize();

  // Check Supabase connection
  if (!game.foundcloud.isSupabaseConnected()) {
    console.warn('FoundCloud | Supabase connection failed');
    ui.notifications.error('FoundCloud: Failed to connect to Supabase. Check console for details.');
  } else {
    console.log('FoundCloud | Supabase connected successfully');
    ui.notifications.info('FoundCloud: Ready to import characters from DiceCloud!');
  }
});

/**
 * Hook: Render Actor Directory
 * Add FoundCloud import button to Actors sidebar
 */
Hooks.on('renderActorDirectory', (app, html, data) => {
  // Always add the button, even if not fully initialized
  if (!game.foundcloud) return;

  // Ensure html is a jQuery object (Foundry v13 compatibility)
  const $html = html instanceof jQuery ? html : $(html);

  // Check if button already exists (prevents duplicates)
  if ($html.find('.foundcloud-import-btn').length > 0) return;

  // Add import button to the sidebar
  const importButton = $(`
    <button class="foundcloud-import-btn" style="margin: 5px; flex: 0 0 100%;">
      <i class="fas fa-cloud-download-alt"></i> Import from DiceCloud
    </button>
  `);

  importButton.on('click', () => {
    if (!game.foundcloud.initialized) {
      ui.notifications.error('FoundCloud is still initializing. Please wait...');
      return;
    }
    if (!game.foundcloud.ui) {
      ui.notifications.error('FoundCloud UI not loaded. Try refreshing the page.');
      return;
    }
    game.foundcloud.ui.showImportDialog();
  });

  // Try multiple possible locations for the button
  const header = $html.find('.directory-header .action-buttons');
  if (header.length) {
    header.append(importButton);
  } else {
    $html.find('.directory-header').append(importButton);
  }
});

/**
 * Hook: Get Actor Sheet Header Buttons
 * Add sync button to character sheets
 */
Hooks.on('getActorSheetHeaderButtons', (sheet, buttons) => {
  if (sheet.actor.type !== 'character') return;

  // Check if this actor was imported from DiceCloud
  const diceCloudId = sheet.actor.getFlag('foundcloud', 'diceCloudId');
  if (!diceCloudId) return;

  buttons.unshift({
    label: 'Sync with DiceCloud',
    class: 'foundcloud-sync',
    icon: 'fas fa-sync',
    onclick: async () => {
      await game.foundcloud.importCharacter(diceCloudId);
      ui.notifications.info('Character synced with DiceCloud');
    }
  });
});

/**
 * Hook: Chat Message
 * TODO: Discord integration for rolls (Phase 5)
 * This will require browser extension integration or edge functions
 */
// Hooks.on('createChatMessage', async (message, options, userId) => {
//   // Discord roll notifications - to be implemented in Phase 5
// });

/**
 * Hook: Combat Turn
 * TODO: Discord turn notifications (Phase 5)
 * This will require browser extension integration or edge functions
 */
// Hooks.on('combatTurn', async (combat, updateData, updateOptions) => {
//   // Discord turn notifications - to be implemented in Phase 5
// });

// Export for use in other modules
export { FoundCloud };
