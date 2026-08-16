/**
 * OwlCloud Adapter
 * Owlbear Rodeo integration for CarmaClouds
 * Loads the full OwlCloud popup UI
 */

import { resolveCurrentCharacter, getCharacterIdFromOpenTab } from '../current-character.js';

// Detect browser API (Firefox uses 'browser', Chrome uses 'chrome')
const browserAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;

// Store auth subscription to prevent multiple listeners
let authSubscription = null;

export async function init(containerEl) {
  console.log('Initializing OwlCloud adapter...');

  try {
    // Show loading state
    containerEl.innerHTML = '<div class="loading">Loading OwlCloud...</div>';

    // Fetch synced characters and DiceCloud user ID from storage
    const result = await browserAPI.storage.local.get(['carmaclouds_characters', 'diceCloudUserId', 'activeCharacterId']) || {};
    const characters = result.carmaclouds_characters || [];
    const diceCloudUserId = result.diceCloudUserId;

    console.log('Found', characters.length, 'synced characters');
    console.log('DiceCloud User ID:', diceCloudUserId);

    // The character the player is actually looking at — never a positional pick,
    // which is how this tab used to get stuck on one character (see
    // ../current-character.js).
    const openTabCharId = await getCharacterIdFromOpenTab();
    const character = resolveCurrentCharacter(characters, openTabCharId, result.activeCharacterId);

    // Fetch the OwlCloud popup HTML
    const htmlPath = browserAPI.runtime.getURL('src/popup/adapters/owlcloud/popup.html');
    const response = await fetch(htmlPath);
    const html = await response.text();

    // Extract only the main content (not the full HTML document with header/footer)
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const mainContent = doc.querySelector('main');

    // Wrap content in a scoped container to prevent CSS conflicts
    const wrapper = document.createElement('div');
    wrapper.className = 'owlcloud-adapter-scope';
    wrapper.innerHTML = mainContent ? mainContent.innerHTML : doc.body.innerHTML;
    containerEl.innerHTML = '';
    containerEl.appendChild(wrapper);

    // Load and inject the CSS with scoping
    const cssPath = browserAPI.runtime.getURL('src/popup/adapters/owlcloud/popup.css');
    const cssResponse = await fetch(cssPath);
    let css = await cssResponse.text();

    // Scope all CSS rules to the adapter container
    css = css.replace(/(^|\})\s*([^{}@]+)\s*\{/gm, (match, closer, selector) => {
      // Don't scope @media, @keyframes, etc.
      if (selector.trim().startsWith('@')) return match;
      // Scope the selector
      const scopedSelector = selector.split(',').map(s => `.owlcloud-adapter-scope ${s.trim()}`).join(', ');
      return `${closer} ${scopedSelector} {`;
    });

    const style = document.createElement('style');
    style.textContent = css;
    containerEl.appendChild(style);

    const SUPABASE_URL = 'https://luiesmfjdcmpywavvfqm.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWVzbWZqZGNtcHl3YXZ2ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODYxNDksImV4cCI6MjA4NTQ2MjE0OX0.oqjHFf2HhCLcanh0HVryoQH7iSV7E9dHHZJdYehxZ0U';

    const loginPrompt = wrapper.querySelector('#loginPrompt');
    const syncBox = wrapper.querySelector('#syncBox');
    const pushedCharactersList = wrapper.querySelector('#pushedCharactersList');
    const noPushedCharacters = wrapper.querySelector('#noPushedCharacters');

    // Function to fetch and display pushed characters from database
    async function loadPushedCharacters() {
      if (!diceCloudUserId || !pushedCharactersList) return;

      try {
        // GDPR Phase 2: send the end-user JWT (falls back to anon). See gdpr-auth-migration.
        const __token = (typeof window.getSupabaseAccessToken === 'function') ? await window.getSupabaseAccessToken() : null;
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/clouds_characters?user_id_dicecloud=eq.${diceCloudUserId}&select=dicecloud_character_id,character_name,level,class,race`,
          {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${__token || SUPABASE_ANON_KEY}`
            }
          }
        );

        if (response.ok) {
          const pushedChars = await response.json();
          pushedCharactersList.innerHTML = '';

          if (pushedChars.length > 0) {
            if (noPushedCharacters) noPushedCharacters.classList.add('hidden');

            pushedChars.forEach(char => {
              const card = document.createElement('div');
              card.style.cssText = 'background: #1a1a1a; padding: 12px; border-radius: 8px; border: 1px solid #333; position: relative;';
              card.innerHTML = `
                <button
                  class="delete-char-btn"
                  data-char-id="${char.dicecloud_character_id}"
                  style="position: absolute; top: 8px; right: 8px; background: rgba(239, 68, 68, 0.2); border: 1px solid #EF4444; color: #EF4444; width: 24px; height: 24px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; transition: all 0.2s;"
                  title="Delete character from database"
                  onmouseover="this.style.background='rgba(239, 68, 68, 0.4)'"
                  onmouseout="this.style.background='rgba(239, 68, 68, 0.2)'">
                  ✕
                </button>
                <h4 style="color: #16a75a; margin: 0 0 6px 0; font-size: 14px; padding-right: 30px;">${char.character_name || 'Unknown'}</h4>
                <div style="display: flex; gap: 8px; font-size: 12px; color: #888;">
                  <span>Lvl ${char.level || '?'}</span>
                  <span>•</span>
                  <span>${char.class || 'Unknown'}</span>
                  <span>•</span>
                  <span>${char.race || 'Unknown'}</span>
                </div>
              `;

              // Add delete button handler
              const deleteBtn = card.querySelector('.delete-char-btn');
              if (deleteBtn) {
                deleteBtn.addEventListener('click', async (e) => {
                  e.stopPropagation();

                  if (!confirm(`Delete ${char.character_name || 'this character'} from the database?\n\nThis cannot be undone.`)) {
                    return;
                  }

                  try {
                    deleteBtn.disabled = true;
                    deleteBtn.textContent = '⏳';

                    const __delToken = (typeof window.getSupabaseAccessToken === 'function') ? await window.getSupabaseAccessToken() : null;
                    const response = await fetch(
                      `${SUPABASE_URL}/rest/v1/clouds_characters?dicecloud_character_id=eq.${char.dicecloud_character_id}&user_id_dicecloud=eq.${diceCloudUserId}`,
                      {
                        method: 'DELETE',
                        headers: {
                          'apikey': SUPABASE_ANON_KEY,
                          'Authorization': `Bearer ${__delToken || SUPABASE_ANON_KEY}`
                        }
                      }
                    );

                    if (response.ok) {
                      console.log('✅ Character deleted:', char.character_name);
                      // Reload the list
                      await loadPushedCharacters();
                    } else {
                      throw new Error(`Delete failed: ${response.status}`);
                    }
                  } catch (error) {
                    console.error('Error deleting character:', error);
                    alert(`Failed to delete: ${error.message}`);
                    deleteBtn.disabled = false;
                    deleteBtn.textContent = '✕';
                  }
                });
              }

              pushedCharactersList.appendChild(card);
            });
          } else {
            if (noPushedCharacters) noPushedCharacters.classList.remove('hidden');
          }
        }
      } catch (error) {
        console.error('Failed to load pushed characters:', error);
      }
    }

    // Check if user is logged in to BOTH DiceCloud AND Supabase. Use the service
    // worker's authoritative session (CC_AUTH_GET) so we get the same auth.uid()
    // the SW writes under. Cross-context sync: the Owlbear popover lists characters
    // by supabase_user_id, so OwlCloud needs a real (non-anonymous) account id the
    // popover can match — an anonymous id is per-browser and unreachable there.
    const supabase = window.supabaseClient;
    let supabaseUserId = null;
    if (typeof window.getSupabaseAuthInfo === 'function') {
      const info = await window.getSupabaseAuthInfo();
      supabaseUserId = (info && info.isAnonymous === false) ? info.userId : null;
    }

    if (!diceCloudUserId || !supabaseUserId) {
      // Show login prompt - need both logins
      if (loginPrompt) {
        loginPrompt.classList.remove('hidden');
        const titleEl = loginPrompt.querySelector('h3');
        const promptText = loginPrompt.querySelector('p');
        const openAuthBtn = loginPrompt.querySelector('#openAuthModalBtn');

        if (!diceCloudUserId) {
          // DiceCloud not logged in - show standard DiceCloud login prompt
          if (titleEl) titleEl.textContent = 'Login Required';
          if (promptText) promptText.textContent = 'Please login to DiceCloud to sync your characters.';
          if (openAuthBtn) {
            openAuthBtn.textContent = '🔐 Login to DiceCloud';
            openAuthBtn.addEventListener('click', () => {
              // Trigger the main popup's DiceCloud auth modal
              const authButton = document.querySelector('#dicecloud-auth-button');
              if (authButton) authButton.click();
            });
          }
        } else {
          // DiceCloud logged in but Supabase not - show "heads up" notification
          if (titleEl) titleEl.textContent = '⚠️ Heads Up!';
          if (promptText) {
            promptText.innerHTML = 'To auto-sync characters, you need a database username and password. <strong>It is NOT your DiceCloud login.</strong> Please register or sign in below.';
          }
          if (openAuthBtn) {
            openAuthBtn.textContent = '👤 Go to Account Tab';
            openAuthBtn.addEventListener('click', () => {
              // Open the auth modal first
              const authButton = document.querySelector('#dicecloud-auth-button');
              if (authButton) authButton.click();

              // Then switch to the Account (Supabase) tab manually
              setTimeout(() => {
                // Deactivate DiceCloud tab
                const dicecloudTab = document.querySelector('[data-auth-tab="dicecloud"]');
                const dicecloudContent = document.querySelector('#dicecloud-auth-content');
                if (dicecloudTab) dicecloudTab.classList.remove('active');
                if (dicecloudContent) dicecloudContent.classList.remove('active');

                // Activate Supabase tab
                const supabaseTab = document.querySelector('[data-auth-tab="supabase"]');
                const supabaseContent = document.querySelector('#supabase-auth-content');
                if (supabaseTab) supabaseTab.classList.add('active');
                if (supabaseContent) {
                  supabaseContent.classList.add('active');
                  supabaseContent.style.display = 'block';
                }
              }, 100);
            });
          }
        }
      }
      if (syncBox) syncBox.classList.add('hidden');
    } else {
      // User is logged in to both DiceCloud and Supabase
      if (loginPrompt) loginPrompt.classList.add('hidden');

      // Handle "Ready to Sync" box - only show if there are local characters
      // (`character` is resolved at the top of init() from the open DiceCloud
      // tab; this box used to re-pick positionally and shadow it.)
      if (character?.raw) {
        if (syncBox) syncBox.classList.remove('hidden');

        // Populate sync box with current character
        const nameEl = wrapper.querySelector('#syncCharName');
        const levelEl = wrapper.querySelector('#syncCharLevel');
        const classEl = wrapper.querySelector('#syncCharClass');
        const raceEl = wrapper.querySelector('#syncCharRace');

        if (nameEl) nameEl.textContent = character.name || 'Unknown';
        if (levelEl) levelEl.textContent = `Lvl ${character.preview?.level || '?'}`;
        if (classEl) classEl.textContent = character.preview?.class || 'Unknown';
        if (raceEl) raceEl.textContent = character.preview?.race || 'Unknown';

        // Add push to VTT button handler
        const pushBtn = wrapper.querySelector('#pushToVttBtn');
        if (pushBtn) {
          pushBtn.addEventListener('click', async () => {
            const originalText = pushBtn.innerHTML;
            try {
              pushBtn.disabled = true;
              pushBtn.innerHTML = '⏳ Pushing...';

              // Derive the owner id from the SAME service-worker session whose
              // token signs the fetch below (getSupabaseAccessToken). Reading it
              // from the popup's own getSession() can disagree with the SW token
              // and trip owner-only RLS (auth.uid() != supabase_user_id).
              let supabaseUserId = null;
              if (typeof window.getSupabaseAuthInfo === 'function') {
                const info = await window.getSupabaseAuthInfo();
                supabaseUserId = info?.userId || null;
              }

              // Prepare character data with ALL info including supabase_user_id
              const characterData = {
                dicecloud_character_id: character.id,
                character_name: character.name || 'Unknown',
                user_id_dicecloud: diceCloudUserId,
                level: character.preview?.level || null,
                class: character.preview?.class || null,
                race: character.preview?.race || null,
                raw_dicecloud_data: character.raw,
                is_active: false,
                updated_at: new Date().toISOString()
              };

              // Include Supabase user ID for cross-device sync
              if (supabaseUserId) {
                characterData.supabase_user_id = supabaseUserId;
                console.log('✅ Including Supabase user ID:', supabaseUserId);
              }

              // Push to database
              const __pushToken = (typeof window.getSupabaseAccessToken === 'function') ? await window.getSupabaseAccessToken() : null;
              const response = await fetch(
                `${SUPABASE_URL}/rest/v1/clouds_characters?on_conflict=supabase_user_id,dicecloud_character_id`,
                {
                  method: 'POST',
                  headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${__pushToken || SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates,return=representation'
                  },
                  body: JSON.stringify(characterData)
                }
              );

              if (response.ok) {
                console.log('✅ Character pushed:', character.name);
                pushBtn.innerHTML = '✅ Pushed!';

                // Clear the pushed character so a new one can be loaded. Drop
                // only this one — `carmaclouds_characters` is shared with the
                // RollCloud / FoundCloud / CoyoteCloud tabs, and removing the
                // whole key wiped their characters too.
                const { carmaclouds_characters: current = [] } =
                  await browserAPI.storage.local.get('carmaclouds_characters');
                await browserAPI.storage.local.set({
                  carmaclouds_characters: current.filter((c) => c.id !== character.id),
                });
                console.log('🗑️ Cleared pushed character from local storage:', character.name);

                // Reload pushed characters list
                await loadPushedCharacters();

                // Reload the entire adapter to show empty sync box
                setTimeout(async () => {
                  await init(containerEl);
                }, 1500);
              } else {
                const errorText = await response.text();
                throw new Error(`Push failed: ${errorText}`);
              }
            } catch (error) {
              console.error('Error pushing character:', error);
              pushBtn.innerHTML = '❌ Failed';
              alert(`Failed to push: ${error.message}`);
              setTimeout(() => {
                pushBtn.innerHTML = originalText;
                pushBtn.disabled = false;
              }, 2000);
            }
          });
        }
      } else {
        // No local characters - hide sync box
        if (syncBox) syncBox.classList.add('hidden');
      }

      // ALWAYS load and display pushed characters when logged in (independent of local storage)
      await loadPushedCharacters();
    }

    // Add copy button handler
    const copyBtn = wrapper.querySelector('#copyOwlbearUrlBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const urlInput = wrapper.querySelector('#owlbearExtensionUrl');
        if (urlInput) {
          try {
            await navigator.clipboard.writeText(urlInput.value);
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✓ Copied!';
            setTimeout(() => {
              copyBtn.textContent = originalText;
            }, 2000);
          } catch (err) {
            console.error('Failed to copy:', err);
            copyBtn.textContent = '✗ Failed';
            setTimeout(() => {
              copyBtn.textContent = 'Copy';
            }, 2000);
          }
        }
      });
    }

    // Listen for Supabase auth state changes to refresh the UI
    if (supabase) {
      // Unsubscribe from previous listener to prevent infinite loops
      if (authSubscription) {
        authSubscription.data.subscription.unsubscribe();
        console.log('🔓 Unsubscribed from previous auth listener');
      }

      // Set up new listener
      authSubscription = supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔐 OwlCloud adapter detected Supabase auth change:', event);
        // Only reload on actual auth changes, not initial session
        if (event !== 'INITIAL_SESSION') {
          console.log('🔄 Reloading adapter due to auth change');
          init(containerEl);
        }
      });
    }

    // Listen for data sync notifications to refresh the UI
    browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'dataSynced') {
        console.log('📥 OwlCloud adapter received data sync notification:', message.characterName);
        // Reload the entire adapter to show updated character data
        init(containerEl);
      }
    });

    // Listen for storage changes to refresh when characters are synced
    browserAPI.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.carmaclouds_characters) {
        console.log('📦 OwlCloud adapter detected character storage change');
        // Reload the adapter to show updated characters
        init(containerEl);
      }
    });

  } catch (error) {
    console.error('Failed to load OwlCloud UI:', error);
    containerEl.innerHTML = `
      <div class="error">
        <strong>Failed to load OwlCloud</strong>
        <p>${error.message}</p>
      </div>
    `;
  }
}
