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
import { FoundCloudSheetSimple } from './foundcloud-sheet-simple.js';

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

  // Register the FoundCloud character sheets
  Actors.registerSheet('foundcloud', FoundCloudSheet, {
    types: ['character'],
    makeDefault: false,
    label: 'FoundCloud Sheet (Legacy)'
  });

  Actors.registerSheet('foundcloud', FoundCloudSheetSimple, {
    types: ['character'],
    makeDefault: false,
    label: 'FoundCloud Sheet'
  });

  console.log('FoundCloud | Custom character sheets registered');

  // Register Handlebars helpers
  Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
  });

  Handlebars.registerHelper('neq', function(a, b) {
    return a !== b;
  });

  // Preload handlebars templates
  await loadTemplates([
    'modules/foundcloud/templates/foundcloud-sheet.hbs',
    'modules/foundcloud/templates/foundcloud-sheet-simple.hbs'
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
 * Hook: Ready
 * Add FoundCloud collapsible side tab
 */
Hooks.once('ready', () => {
  if (!game.foundcloud) return;

  // Check if tab already exists (prevents duplicates)
  if (document.getElementById('foundcloud-side-tab')) return;

  // Create the side tab
  const sideTab = document.createElement('div');
  sideTab.id = 'foundcloud-side-tab';
  sideTab.className = 'foundcloud-side-tab';
  sideTab.innerHTML = `
    <div class="foundcloud-tab-content">
      <img src="modules/foundcloud/foundcloud-logo.png" alt="FoundCloud" class="foundcloud-logo">
      <span class="foundcloud-tab-text">Import from FoundCloud</span>
    </div>
  `;

  // Add to body
  document.body.appendChild(sideTab);

  // Create the popup menu
  const popupMenu = document.createElement('div');
  popupMenu.id = 'foundcloud-popup-menu';
  popupMenu.className = 'foundcloud-popup-menu';
  popupMenu.style.display = 'none';
  popupMenu.innerHTML = `
    <div class="foundcloud-menu-header">
      <h3>FoundCloud Characters</h3>
      <button class="foundcloud-menu-close" title="Close">✕</button>
    </div>
    <div class="foundcloud-menu-content">
      <div class="foundcloud-character-list" id="foundcloud-character-list">
        <div class="foundcloud-loading">Loading characters...</div>
      </div>
      <div class="foundcloud-menu-actions">
        <button class="foundcloud-btn foundcloud-open-sheet" id="foundcloud-open-sheet">
          <i class="fas fa-file-alt"></i> Open Character Sheet
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(popupMenu);

  // Click handler for side tab
  sideTab.addEventListener('click', async () => {
    if (!game.foundcloud.initialized) {
      ui.notifications.error('FoundCloud is still initializing. Please wait...');
      return;
    }

    // Toggle menu visibility
    const menu = document.getElementById('foundcloud-popup-menu');
    if (menu.style.display === 'none') {
      menu.style.display = 'block';
      await loadCharacterList();
    } else {
      menu.style.display = 'none';
    }
  });

  // Close button handler
  popupMenu.querySelector('.foundcloud-menu-close').addEventListener('click', () => {
    popupMenu.style.display = 'none';
  });

  // Open sheet button handler
  popupMenu.querySelector('#foundcloud-open-sheet').addEventListener('click', () => {
    const selected = popupMenu.querySelector('.foundcloud-character-item.selected');
    if (!selected) {
      ui.notifications.warn('Please select a character first');
      return;
    }
    const characterId = selected.dataset.characterId;
    openCharacterSheet(characterId);
  });

  // Load character list function
  async function loadCharacterList() {
    const listContainer = document.getElementById('foundcloud-character-list');
    listContainer.innerHTML = '<div class="foundcloud-loading">Loading characters...</div>';

    try {
      const characters = await game.foundcloud.getAvailableCharacters();
      
      if (!characters || characters.length === 0) {
        listContainer.innerHTML = '<div class="foundcloud-empty">No characters found. Sync your characters using the browser extension first.</div>';
        return;
      }

      listContainer.innerHTML = '';
      characters.forEach(char => {
        const item = document.createElement('div');
        item.className = 'foundcloud-character-item';
        item.dataset.characterId = char.dicecloud_character_id;
        item.innerHTML = `
          <div class="foundcloud-char-name">${char.character_name}</div>
          <div class="foundcloud-char-details">Level ${char.level || 1} ${char.character_class || 'Unknown'}</div>
        `;
        
        item.addEventListener('click', () => {
          // Remove selection from all items
          listContainer.querySelectorAll('.foundcloud-character-item').forEach(i => i.classList.remove('selected'));
          // Select this item
          item.classList.add('selected');
        });

        // Double-click to import
        item.addEventListener('dblclick', () => {
          game.foundcloud.ui.showImportDialog();
          popupMenu.style.display = 'none';
        });

        listContainer.appendChild(item);
      });
    } catch (error) {
      console.error('FoundCloud | Failed to load characters:', error);
      listContainer.innerHTML = '<div class="foundcloud-error">Failed to load characters. Check console for details.</div>';
    }
  }

  // Open character sheet function
  async function openCharacterSheet(characterId) {
    try {
      // Check if actor already exists
      const existingActor = game.actors.find(a => 
        a.getFlag('foundcloud', 'diceCloudId') === characterId
      );

      if (existingActor) {
        existingActor.sheet.render(true);
        popupMenu.style.display = 'none';
      } else {
        // Import first, then open
        ui.notifications.info('Importing character...');
        const actor = await game.foundcloud.importCharacter(characterId);
        if (actor) {
          actor.sheet.render(true);
          popupMenu.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('FoundCloud | Failed to open character sheet:', error);
      ui.notifications.error('Failed to open character sheet: ' + error.message);
    }
  }

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('foundcloud-popup-menu');
    const tab = document.getElementById('foundcloud-side-tab');
    if (menu && tab && !menu.contains(e.target) && !tab.contains(e.target)) {
      menu.style.display = 'none';
    }
  });
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
