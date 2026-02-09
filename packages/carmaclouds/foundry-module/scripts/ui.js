/**
 * FoundCloud UI Components
 * Handles dialog windows and user interface
 */

export class FoundCloudUI {
  constructor(foundcloud) {
    this.foundcloud = foundcloud;
  }

  /**
   * Show authentication dialog for Supabase login
   */
  async showAuthDialog() {
    const content = `
      <form id="foundcloud-auth-form">
        <div class="form-group">
          <label for="foundcloud-email">Email</label>
          <input type="email" id="foundcloud-email" name="email" required autocomplete="email" placeholder="your@email.com" style="width: 100%; padding: 8px; margin-top: 4px;">
        </div>
        <div class="form-group" style="margin-top: 12px;">
          <label for="foundcloud-password">Password</label>
          <input type="password" id="foundcloud-password" name="password" required autocomplete="current-password" placeholder="Min 6 characters" minlength="6" style="width: 100%; padding: 8px; margin-top: 4px;">
        </div>
        <div id="foundcloud-auth-error" style="display: none; color: #ff6400; margin-top: 12px; padding: 8px; background: rgba(255, 100, 0, 0.1); border-radius: 4px;"></div>
        <p style="margin-top: 12px; font-size: 12px; color: #999;">
          Don't have an account? Click "Sign Up" to create one.
        </p>
      </form>
    `;

    new Dialog({
      title: 'FoundCloud Authentication',
      content: content,
      buttons: {
        signin: {
          icon: '<i class="fas fa-sign-in-alt"></i>',
          label: 'Sign In',
          callback: async (html) => {
            const email = html.find('[name="email"]').val().trim();
            const password = html.find('[name="password"]').val();
            const errorDiv = html.find('#foundcloud-auth-error');

            try {
              await this.foundcloud.bridge.signIn(email, password);
              ui.notifications.info('Signed in successfully!');
              // Show import dialog after successful login
              this.showImportDialog();
            } catch (error) {
              console.error('FoundCloud | Sign in failed:', error);
              ui.notifications.error(`Sign in failed: ${error.message}`);
            }
          }
        },
        signup: {
          icon: '<i class="fas fa-user-plus"></i>',
          label: 'Sign Up',
          callback: async (html) => {
            const email = html.find('[name="email"]').val().trim();
            const password = html.find('[name="password"]').val();
            const errorDiv = html.find('#foundcloud-auth-error');

            if (password.length < 6) {
              ui.notifications.error('Password must be at least 6 characters long');
              return;
            }

            try {
              await this.foundcloud.bridge.signUp(email, password);
              ui.notifications.info('Account created successfully! You can now sign in.');
            } catch (error) {
              console.error('FoundCloud | Sign up failed:', error);
              ui.notifications.error(`Sign up failed: ${error.message}`);
            }
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Cancel'
        }
      },
      default: 'signin'
    }).render(true);
  }

  /**
   * Show import dialog to select a character
   */
  async showImportDialog() {
    // Check if Supabase is connected
    if (!this.foundcloud.isSupabaseConnected()) {
      this.showSupabaseNotConnectedDialog();
      return;
    }

    // Check if user is authenticated
    const isAuthenticated = await this.foundcloud.bridge.isAuthenticated();
    if (!isAuthenticated) {
      // Show auth dialog instead
      this.showAuthDialog();
      return;
    }

    try {
      // Get available characters from Supabase
      const characters = await this.foundcloud.getAvailableCharacters();

      if (!characters || characters.length === 0) {
        ui.notifications.warn('No characters found in Supabase. Sync your characters using the browser extension first.');
        return;
      }

      // Build character selection HTML - using dicecloud_character_id from Supabase
      const characterOptions = characters.map(char => `
        <option value="${char.dicecloud_character_id}">${char.character_name} (Level ${char.level || 1})</option>
      `).join('');

      const content = `
        <form>
          <div class="form-group">
            <label for="character-select">Select Character:</label>
            <select id="character-select" name="characterId" style="width: 100%;">
              ${characterOptions}
            </select>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" name="importSpells" checked />
              Import Spells
            </label>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" name="importItems" checked />
              Import Equipment
            </label>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" name="importFeatures" checked />
              Import Class Features
            </label>
          </div>
        </form>
      `;

      new Dialog({
        title: 'Import Character from DiceCloud',
        content: content,
        buttons: {
          import: {
            icon: '<i class="fas fa-download"></i>',
            label: 'Import',
            callback: async (html) => {
              const characterId = html.find('[name="characterId"]').val();
              const importSpells = html.find('[name="importSpells"]').is(':checked');
              const importItems = html.find('[name="importItems"]').is(':checked');
              const importFeatures = html.find('[name="importFeatures"]').is(':checked');

              // Temporarily set import settings
              await game.settings.set('foundcloud', 'importSpells', importSpells);
              await game.settings.set('foundcloud', 'importItems', importItems);
              await game.settings.set('foundcloud', 'importFeatures', importFeatures);

              // Import character
              ui.notifications.info('Importing character...');
              await this.foundcloud.importCharacter(characterId);
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: 'Cancel'
          }
        },
        default: 'import'
      }).render(true);

    } catch (error) {
      console.error('FoundCloud | Failed to show import dialog:', error);
      ui.notifications.error(`Failed to load characters: ${error.message}`);
    }
  }

  /**
   * Show Supabase not connected dialog
   */
  showSupabaseNotConnectedDialog() {
    const content = `
      <div style="text-align: center;">
        <p><i class="fas fa-exclamation-triangle" style="font-size: 3em; color: #ff6400;"></i></p>
        <h2>Supabase Connection Failed</h2>
        <p>FoundCloud could not connect to the Supabase database.</p>
        <div style="background: rgba(255, 100, 0, 0.1); border: 1px solid rgba(255, 100, 0, 0.3); border-radius: 8px; padding: 12px; margin: 16px 0;">
          <h3 style="margin-top: 0;">📦 Browser Extension Required</h3>
          <p style="text-align: left;">FoundCloud is not standalone. You need the CarmaClouds browser extension to sync your DiceCloud characters.</p>
          <p><a href="https://github.com/CarmaNayeli/carmaclouds/releases/latest" target="_blank" style="color: #ff6400; font-weight: bold;">Download CarmaClouds Extension →</a></p>
        </div>
        <h3>Troubleshooting:</h3>
        <ol style="text-align: left;">
          <li>Check your internet connection</li>
          <li>Verify Supabase service is online</li>
          <li>Check browser console for detailed errors</li>
          <li>Try refreshing the Foundry page</li>
        </ol>
        <h3>Once Connected:</h3>
        <ol style="text-align: left;">
          <li>Install the CarmaClouds browser extension</li>
          <li>Open the FoundCloud tab in the extension</li>
          <li>Click "☁️ Sync to Cloud" on your characters</li>
          <li>Import them here in Foundry</li>
        </ol>
        <p><strong>Help:</strong> <a href="https://carmaclouds.vercel.app" target="_blank">CarmaClouds Website</a></p>
      </div>
    `;

    new Dialog({
      title: 'Supabase Not Connected',
      content: content,
      buttons: {
        retry: {
          icon: '<i class="fas fa-sync"></i>',
          label: 'Retry Connection',
          callback: async () => {
            ui.notifications.info('Testing Supabase connection...');
            const connected = await this.foundcloud.bridge.testConnection();
            if (connected) {
              ui.notifications.info('Supabase connected!');
              location.reload(); // Reload to reinitialize
            } else {
              ui.notifications.error('Still cannot connect to Supabase');
            }
          }
        },
        close: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Close'
        }
      },
      default: 'retry'
    }).render(true);
  }

  /**
   * Show sync confirmation dialog
   * @param {Actor} actor - Actor to sync
   */
  showSyncDialog(actor) {
    const diceCloudId = actor.getFlag('foundcloud', 'diceCloudId');
    const lastSync = actor.getFlag('foundcloud', 'lastSync');
    const lastSyncDate = lastSync ? new Date(lastSync).toLocaleString() : 'Never';

    const content = `
      <div>
        <p>Sync <strong>${actor.name}</strong> with DiceCloud?</p>
        <p><small>Last synced: ${lastSyncDate}</small></p>
        <hr>
        <div class="form-group">
          <label>
            <input type="checkbox" name="overrideExisting" />
            Override existing data
          </label>
          <p class="notes">If checked, all character data will be overwritten. If unchecked, only missing values will be updated.</p>
        </div>
      </div>
    `;

    new Dialog({
      title: 'Sync Character',
      content: content,
      buttons: {
        sync: {
          icon: '<i class="fas fa-sync"></i>',
          label: 'Sync Now',
          callback: async (html) => {
            const override = html.find('[name="overrideExisting"]').is(':checked');
            await game.settings.set('foundcloud', 'overrideExisting', override);

            ui.notifications.info(`Syncing ${actor.name}...`);
            await this.foundcloud.importCharacter(diceCloudId);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Cancel'
        }
      },
      default: 'sync'
    }).render(true);
  }

  /**
   * Show user auth status dialog
   */
  async showAuthStatus() {
    const session = await this.foundcloud.bridge.getSession();

    if (!session) {
      this.showAuthDialog();
      return;
    }

    const content = `
      <div style="text-align: center;">
        <p><i class="fas fa-user-circle" style="font-size: 3em; color: #16a75a;"></i></p>
        <h2>Signed In</h2>
        <div style="background: rgba(22, 167, 90, 0.1); border: 1px solid rgba(22, 167, 90, 0.3); border-radius: 8px; padding: 12px; margin: 16px 0;">
          <p style="font-weight: 600; color: #e0e0e0;">${session.user.email}</p>
        </div>
        <p style="color: #999; font-size: 13px;">Your characters are synced to this account.</p>
      </div>
    `;

    new Dialog({
      title: 'FoundCloud Authentication Status',
      content: content,
      buttons: {
        signout: {
          icon: '<i class="fas fa-sign-out-alt"></i>',
          label: 'Sign Out',
          callback: async () => {
            try {
              await this.foundcloud.bridge.signOut();
              ui.notifications.info('Signed out successfully');
            } catch (error) {
              console.error('FoundCloud | Sign out failed:', error);
              ui.notifications.error(`Sign out failed: ${error.message}`);
            }
          }
        },
        close: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Close'
        }
      },
      default: 'close'
    }).render(true);
  }

  /**
   * Show connection status indicator
   */
  showConnectionStatus() {
    const connected = this.foundcloud.isSupabaseConnected();
    const statusClass = connected ? 'connected' : 'disconnected';
    const statusText = connected ? 'Supabase Connected' : 'Supabase Disconnected';
    const statusIcon = connected ? 'check' : 'times';

    const $status = $(`
      <div id="foundcloud-status" class="foundcloud-status ${statusClass}">
        <i class="fas fa-${statusIcon}"></i>
        <span>FoundCloud: ${statusText}</span>
      </div>
    `);

    // Add to UI (bottom left corner)
    $('body').append($status);

    // Click to retry connection
    $status.on('click', async () => {
      ui.notifications.info('Testing Supabase connection...');
      const connected = await this.foundcloud.bridge.testConnection();
      if (connected) {
        ui.notifications.info('Supabase connected!');
        $status.removeClass('disconnected').addClass('connected');
        $status.find('span').text('FoundCloud: Supabase Connected');
        $status.find('i').attr('class', 'fas fa-check');
      } else {
        ui.notifications.warn('Supabase connection failed');
      }
    });
  }

  /**
   * Show import progress notification
   * @param {string} characterName - Character name
   */
  showImportProgress(characterName) {
    return ui.notifications.info(`Importing ${characterName}...`, { permanent: true });
  }

  /**
   * Clear import progress notification
   * @param {Notification} notification - Notification to clear
   */
  clearImportProgress(notification) {
    if (notification) {
      notification.remove();
    }
  }
}
