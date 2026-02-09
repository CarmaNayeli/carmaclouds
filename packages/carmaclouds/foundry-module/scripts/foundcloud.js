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
      <div style="display: flex; align-items: center; gap: 8px;">
        <button class="foundcloud-btn" id="foundcloud-auth-status-btn" title="Account Status" style="padding: 4px 8px; font-size: 12px;">
          <i class="fas fa-user"></i>
        </button>
        <button class="foundcloud-menu-close" title="Close">✕</button>
      </div>
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

  // Auth status button handler
  popupMenu.querySelector('#foundcloud-auth-status-btn').addEventListener('click', () => {
    game.foundcloud.ui.showAuthStatus();
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
    listContainer.innerHTML = '<div class="foundcloud-loading">Checking authentication...</div>';

    try {
      // Check if user is authenticated
      const isAuthenticated = await game.foundcloud.bridge.isAuthenticated();
      if (!isAuthenticated) {
        // Show inline login form in the character list area
        listContainer.innerHTML = `
          <div class="foundcloud-auth-container" style="padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <i class="fas fa-lock" style="font-size: 2.5em; color: #16a75a; margin-bottom: 8px;"></i>
              <h3 style="margin-bottom: 4px; font-size: 16px;">Sign In to FoundCloud</h3>
              <p style="color: #999; font-size: 12px;">Access your synced characters</p>
            </div>
            <form id="foundcloud-inline-auth-form" style="display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <label for="foundcloud-inline-email" style="font-size: 13px; font-weight: 600;">Email</label>
                <input type="email" id="foundcloud-inline-email" name="email" required autocomplete="email" placeholder="your@email.com" style="padding: 8px; border: 1px solid #444; border-radius: 4px; background: #2a2a2a; color: #e0e0e0; font-size: 13px;">
              </div>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <label for="foundcloud-inline-password" style="font-size: 13px; font-weight: 600;">Password</label>
                <input type="password" id="foundcloud-inline-password" name="password" required autocomplete="current-password" placeholder="Min 6 characters" minlength="6" style="padding: 8px; border: 1px solid #444; border-radius: 4px; background: #2a2a2a; color: #e0e0e0; font-size: 13px;">
              </div>
              <div id="foundcloud-inline-auth-error" style="display: none; color: #ff6400; font-size: 12px; padding: 8px; background: rgba(255, 100, 0, 0.1); border-radius: 4px;"></div>
              <div style="display: flex; gap: 8px; margin-top: 4px;">
                <button type="submit" class="foundcloud-btn" style="flex: 1; padding: 10px; font-size: 13px;">
                  <i class="fas fa-sign-in-alt"></i> Sign In
                </button>
                <button type="button" id="foundcloud-inline-signup-btn" class="foundcloud-btn" style="flex: 1; padding: 10px; font-size: 13px; background: #555;">
                  <i class="fas fa-user-plus"></i> Sign Up
                </button>
              </div>
              <p style="color: #888; font-size: 11px; text-align: center; margin-top: 4px;">
                Don't have an account? Click "Sign Up" to create one.
              </p>
            </form>
          </div>
        `;

        // Add inline form handlers
        const form = document.getElementById('foundcloud-inline-auth-form');
        const errorDiv = document.getElementById('foundcloud-inline-auth-error');
        const emailInput = document.getElementById('foundcloud-inline-email');
        const passwordInput = document.getElementById('foundcloud-inline-password');
        const signUpBtn = document.getElementById('foundcloud-inline-signup-btn');

        // Sign In handler
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = emailInput.value.trim();
          const password = passwordInput.value;

          try {
            errorDiv.style.display = 'none';
            await game.foundcloud.bridge.signIn(email, password);
            ui.notifications.info('Signed in successfully!');
            // Reload character list
            await loadCharacterList();
          } catch (error) {
            console.error('FoundCloud | Sign in failed:', error);
            errorDiv.textContent = `Sign in failed: ${error.message}`;
            errorDiv.style.display = 'block';
          }
        });

        // Sign Up handler
        signUpBtn.addEventListener('click', async () => {
          const email = emailInput.value.trim();
          const password = passwordInput.value;

          if (!email || !password) {
            errorDiv.textContent = 'Please enter email and password';
            errorDiv.style.display = 'block';
            return;
          }

          if (password.length < 6) {
            errorDiv.textContent = 'Password must be at least 6 characters long';
            errorDiv.style.display = 'block';
            return;
          }

          try {
            errorDiv.style.display = 'none';
            await game.foundcloud.bridge.signUp(email, password);
            ui.notifications.info('Account created successfully! You can now sign in.');
            errorDiv.style.display = 'none';
          } catch (error) {
            console.error('FoundCloud | Sign up failed:', error);
            errorDiv.textContent = `Sign up failed: ${error.message}`;
            errorDiv.style.display = 'block';
          }
        });

        return;
      }

      listContainer.innerHTML = '<div class="foundcloud-loading">Loading characters...</div>';
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
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="foundcloud-char-details">Level ${char.level || 1} ${char.class || char.character_class || 'Unknown'}${char.race ? ' \u2022 ' + char.race : ''}</div>
            <button class="foundcloud-import-btn foundcloud-download-btn" title="Import to Foundry">
              <i class="fas fa-download"></i>
            </button>
          </div>
        `;
        
        // Click to select
        item.addEventListener('click', (e) => {
          // Don't select if clicking the import button
          if (e.target.closest('.foundcloud-import-btn')) return;
          // Remove selection from all items
          listContainer.querySelectorAll('.foundcloud-character-item').forEach(i => i.classList.remove('selected'));
          // Select this item
          item.classList.add('selected');
        });

        // Import button click
        const importBtn = item.querySelector('.foundcloud-import-btn');
        if (importBtn) {
          importBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const charId = char.dicecloud_character_id;
            importBtn.disabled = true;
            importBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importing...';
            try {
              const actor = await game.foundcloud.importCharacter(charId);
              if (actor) {
                importBtn.innerHTML = '<i class="fas fa-check"></i> Imported!';
                setTimeout(() => {
                  actor.sheet.render(true);
                  popupMenu.style.display = 'none';
                }, 500);
              }
            } catch (err) {
              console.error('FoundCloud | Import failed:', err);
              importBtn.innerHTML = '<i class="fas fa-times"></i> Failed';
              ui.notifications.error('Import failed: ' + err.message);
              setTimeout(() => {
                importBtn.disabled = false;
                importBtn.innerHTML = '<i class="fas fa-download"></i> Import';
              }, 2000);
            }
          });
        }

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
