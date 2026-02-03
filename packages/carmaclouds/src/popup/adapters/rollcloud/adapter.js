/**
 * RollCloud Adapter
 * Roll20 integration for CarmaClouds
 * Loads the full RollCloud popup UI
 */

import { parseForRollCloud, parseCharacterData } from '../../../content/dicecloud-extraction.js';

// Detect browser API (Firefox uses 'browser', Chrome uses 'chrome')
const browserAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;

export async function init(containerEl) {
  console.log('Initializing RollCloud adapter...');

  try {
    // Show loading state
    containerEl.innerHTML = '<div class="loading">Loading RollCloud...</div>';

    // Fetch synced characters from storage
    const result = await browserAPI.storage.local.get('carmaclouds_characters') || {};
    const characters = result.carmaclouds_characters || [];

    console.log('Found', characters.length, 'synced characters');

    // Get the most recent character (for now - later we'll add character selection)
    const character = characters.length > 0 ? characters[0] : null;

    let parsedData = null;
    if (character && character.raw) {
      // Parse raw DiceCloud data for Roll20
      containerEl.innerHTML = '<div class="loading">Parsing character data...</div>';

      console.log('Parsing character for Roll20:', character.name);
      parsedData = parseForRollCloud(character.raw);
      console.log('Parsed data:', parsedData);
    }

    // Fetch the RollCloud popup HTML
    const htmlPath = browserAPI.runtime.getURL('src/popup/adapters/rollcloud/popup.html');
    const response = await fetch(htmlPath);
    const html = await response.text();

    // Extract only the main content (not the full HTML document with header/footer)
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const mainContent = doc.querySelector('main');

    // Wrap content in a scoped container to prevent CSS conflicts
    const wrapper = document.createElement('div');
    wrapper.className = 'rollcloud-adapter-scope';
    wrapper.innerHTML = mainContent ? mainContent.innerHTML : doc.body.innerHTML;
    containerEl.innerHTML = '';
    containerEl.appendChild(wrapper);

    // Load and inject the CSS with scoping
    const cssPath = browserAPI.runtime.getURL('src/popup/adapters/rollcloud/popup.css');
    const cssResponse = await fetch(cssPath);
    let css = await cssResponse.text();

    // Scope all CSS rules to the adapter container
    css = css.replace(/(^|\})\s*([^{}@]+)\s*\{/gm, (match, closer, selector) => {
      // Don't scope @media, @keyframes, etc.
      if (selector.trim().startsWith('@')) return match;
      // Scope the selector
      const scopedSelector = selector.split(',').map(s => `.rollcloud-adapter-scope ${s.trim()}`).join(', ');
      return `${closer} ${scopedSelector} {`;
    });

    const style = document.createElement('style');
    style.textContent = css;
    containerEl.appendChild(style);

    // Initialize the new UI elements (login prompt, sync box, etc.)
    await initializeRollCloudUI(wrapper, characters);

    // Populate character info directly if we have data
    if (parsedData && character) {
      // Show character info card
      const characterInfo = wrapper.querySelector('#characterInfo');
      const statusSection = wrapper.querySelector('#status');

      if (characterInfo) {
        characterInfo.classList.remove('hidden');

        // Populate character fields
        const nameEl = characterInfo.querySelector('#charName');
        const levelEl = characterInfo.querySelector('#charLevel');
        const classEl = characterInfo.querySelector('#charClass');
        const raceEl = characterInfo.querySelector('#charRace');

        if (nameEl) nameEl.textContent = character.name || '-';
        if (levelEl) levelEl.textContent = character.preview?.level || '-';
        if (classEl) classEl.textContent = character.preview?.class || '-';
        if (raceEl) raceEl.textContent = character.preview?.race || 'Unknown';

        // Add push to VTT button handler
        const pushBtn = characterInfo.querySelector('#pushToVttBtn');
        if (pushBtn) {
          pushBtn.addEventListener('click', async () => {
            const originalText = pushBtn.innerHTML;
            try {
              pushBtn.disabled = true;
              pushBtn.innerHTML = '⏳ Pushing...';

              // Store Roll20-specific parsed data in database
              console.log('💾 Storing Roll20 parsed data to database...');
              const SUPABASE_URL = 'https://luiesmfjdcmpywavvfqm.supabase.co';
              const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWVzbWZqZGNtcHl3YXZ2ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODYxNDksImV4cCI6MjA4NTQ2MjE0OX0.oqjHFf2HhCLcanh0HVryoQH7iSV7E9dHHZJdYehxZ0U';

              try {
                const updateResponse = await fetch(
                  `${SUPABASE_URL}/rest/v1/clouds_characters?dicecloud_character_id=eq.${character.id}`,
                  {
                    method: 'PATCH',
                    headers: {
                      'apikey': SUPABASE_ANON_KEY,
                      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                      'Content-Type': 'application/json',
                      'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                      roll20_data: parsedData,
                      updated_at: new Date().toISOString()
                    })
                  }
                );
                if (updateResponse.ok) {
                  console.log('✅ Roll20 data stored in database');
                } else {
                  console.warn('⚠️ Failed to store Roll20 data:', await updateResponse.text());
                }
              } catch (dbError) {
                console.warn('⚠️ Database update failed (non-fatal):', dbError);
              }

              // Also update local storage with parsed data so popup can use it
              console.log('💾 Updating local storage with parsed data...');
              try {
                // Add the character ID to parsed data so storage can find it
                const dataToStore = {
                  ...parsedData,
                  id: character.id,
                  dicecloud_character_id: character.id
                };

                await browserAPI.runtime.sendMessage({
                  action: 'storeCharacterData',
                  data: dataToStore,
                  slotId: character.slotId || 'slot-1'
                });
                console.log('✅ Local storage updated with parsed Roll20 data');

                // Notify any open popup to refresh and show the updated character
                browserAPI.runtime.sendMessage({
                  action: 'dataSynced',
                  characterName: dataToStore.name || 'Character'
                }).catch(() => {
                  console.log('ℹ️ No popup open to notify (normal)');
                });
              } catch (storageError) {
                console.warn('⚠️ Local storage update failed (non-fatal):', storageError);
              }

              // Get the active Roll20 tab
              const tabs = await browserAPI.tabs.query({ url: '*://app.roll20.net/*' });
              if (tabs.length === 0) {
                throw new Error('No Roll20 tab found. Please open Roll20 first.');
              }

              // Send character data to Roll20 content script
              await browserAPI.tabs.sendMessage(tabs[0].id, {
                type: 'PUSH_CHARACTER',
                data: parsedData
              });

              pushBtn.innerHTML = '✅ Pushed!';
              setTimeout(() => {
                pushBtn.innerHTML = originalText;
                pushBtn.disabled = false;
              }, 2000);
            } catch (error) {
              console.error('Error pushing to Roll20:', error);
              pushBtn.innerHTML = '❌ Failed';
              alert(`Failed to push to Roll20: ${error.message}`);
              setTimeout(() => {
                pushBtn.innerHTML = originalText;
                pushBtn.disabled = false;
              }, 2000);
            }
          });
        }
      }

      // Update status to show success
      if (statusSection) {
        const statusIcon = statusSection.querySelector('#statusIcon');
        const statusText = statusSection.querySelector('#statusText');
        if (statusIcon) statusIcon.textContent = '✅';
        if (statusText) statusText.textContent = `Character synced: ${character.name}`;
      }
    }

    // Listen for data sync notifications to refresh the UI
    browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'dataSynced') {
        console.log('📥 RollCloud adapter received data sync notification:', message.characterName);
        // Reload the entire adapter to show updated character data
        init(containerEl);
      }
    });

  } catch (error) {
    console.error('Failed to load RollCloud UI:', error);
    containerEl.innerHTML = `
      <div class="error">
        <strong>Failed to load RollCloud</strong>
        <p>${error.message}</p>
      </div>
    `;
  }
}

/**
 * Initialize RollCloud UI elements (auth check, sync buttons, character list)
 */
async function initializeRollCloudUI(wrapper, characters) {
  try {
    const loginPrompt = wrapper.querySelector('#loginPrompt');
    const syncBox = wrapper.querySelector('#syncBox');
    const pushedCharactersSection = wrapper.querySelector('#pushedCharactersSection');
    const pushToRoll20Btn = wrapper.querySelector('#pushToRoll20Btn');
    const openAuthModalBtn = wrapper.querySelector('#openAuthModalBtn');

    // Check if user is authenticated to DiceCloud
    const result = await browserAPI.storage.local.get(['diceCloudToken', 'dicecloud_auth_token', 'activeCharacterId']);
    const hasDiceCloudToken = !!(result.diceCloudToken || result.dicecloud_auth_token);
    const token = result.diceCloudToken || result.dicecloud_auth_token;

    console.log('RollCloud auth check:', { hasDiceCloudToken, hasActiveChar: !!result.activeCharacterId });

    if (!hasDiceCloudToken) {
      // Show login prompt
      if (loginPrompt) loginPrompt.classList.remove('hidden');
      if (syncBox) syncBox.classList.add('hidden');
      if (pushedCharactersSection) pushedCharactersSection.classList.add('hidden');

      // Add login button handler
      if (openAuthModalBtn) {
        openAuthModalBtn.addEventListener('click', () => {
          // Open DiceCloud in a new tab for login
          browserAPI.tabs.create({ url: 'https://dicecloud.com' });
        });
      }
      return;
    }

    // User is authenticated - show sync box
    if (loginPrompt) loginPrompt.classList.add('hidden');
    if (syncBox) syncBox.classList.remove('hidden');
    if (pushedCharactersSection) pushedCharactersSection.classList.remove('hidden');

    // Update sync box with current character info
    if (result.activeCharacterId && characters.length > 0) {
      const activeChar = characters.find(c => c.id === result.activeCharacterId) || characters[0];

      const syncCharName = wrapper.querySelector('#syncCharName');
      const syncCharLevel = wrapper.querySelector('#syncCharLevel');
      const syncCharClass = wrapper.querySelector('#syncCharClass');
      const syncCharRace = wrapper.querySelector('#syncCharRace');

      if (syncCharName) syncCharName.textContent = activeChar.name || 'Unknown';
      if (syncCharLevel) syncCharLevel.textContent = `Lvl ${activeChar.level || '?'}`;
      if (syncCharClass) syncCharClass.textContent = activeChar.class || 'No Class';
      if (syncCharRace) syncCharRace.textContent = activeChar.race || 'Unknown';
    }

    // Add push button handler
    if (pushToRoll20Btn) {
      pushToRoll20Btn.addEventListener('click', () => handlePushToRoll20(token, result.activeCharacterId, wrapper));
    }

    // Display synced characters
    displaySyncedCharacters(wrapper, characters);

  } catch (error) {
    console.error('Error initializing RollCloud UI:', error);
  }
}

/**
 * Handle pushing character to Roll20
 */
async function handlePushToRoll20(token, activeCharacterId, wrapper) {
  const pushBtn = wrapper.querySelector('#pushToRoll20Btn');
  if (!pushBtn) return;

  const originalText = pushBtn.textContent;

  try {
    pushBtn.disabled = true;
    pushBtn.textContent = '⏳ Syncing...';

    if (!activeCharacterId) {
      throw new Error('No active character selected');
    }

    // Fetch character from DiceCloud API
    const response = await fetch(`https://dicecloud.com/api/creature/${activeCharacterId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error(`Failed to fetch character: ${response.status}`);

    const charData = await response.json();
    const rawData = {
      creature: charData.creatures?.[0] || {},
      variables: charData.creatureVariables?.[0] || {},
      properties: charData.creatureProperties || []
    };

    // Parse using OwlCloud's parser for consistency
    const parsedChar = parseCharacterData(charData, activeCharacterId);

    // Store in local storage
    const existingChars = await browserAPI.storage.local.get('carmaclouds_characters');
    const characters = existingChars.carmaclouds_characters || [];

    const existingIndex = characters.findIndex(c => c.id === activeCharacterId);
    const characterEntry = {
      id: activeCharacterId,
      name: parsedChar.name || 'Unknown',
      level: parsedChar.preview?.level || parsedChar.level || '?',
      class: parsedChar.preview?.class || parsedChar.class || 'No Class',
      race: parsedChar.preview?.race || parsedChar.race || 'Unknown',
      raw: rawData,
      lastSynced: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      characters[existingIndex] = characterEntry;
    } else {
      characters.push(characterEntry);
    }

    await browserAPI.storage.local.set({ carmaclouds_characters: characters });

    pushBtn.textContent = '✓ Synced!';
    pushBtn.style.background = 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)';

    // Refresh the character list
    displaySyncedCharacters(wrapper, characters);

    setTimeout(() => {
      pushBtn.textContent = originalText;
      pushBtn.style.background = '';
      pushBtn.disabled = false;
    }, 2000);

  } catch (error) {
    console.error('Sync current error:', error);
    pushBtn.textContent = '❌ Failed';
    alert(`Sync failed: ${error.message}`);
    setTimeout(() => {
      pushBtn.textContent = originalText;
      pushBtn.disabled = false;
    }, 2000);
  }
}

/**
 * Display synced characters in the list
 */
function displaySyncedCharacters(wrapper, characters) {
  const pushedCharactersList = wrapper.querySelector('#pushedCharactersList');
  const noPushedCharacters = wrapper.querySelector('#noPushedCharacters');

  if (!pushedCharactersList || !noPushedCharacters) return;

  if (characters.length === 0) {
    pushedCharactersList.innerHTML = '';
    noPushedCharacters.classList.remove('hidden');
    return;
  }

  noPushedCharacters.classList.add('hidden');
  pushedCharactersList.innerHTML = '';

  characters.forEach(char => {
    const card = document.createElement('div');
    card.style.cssText = 'padding: 12px; background: #2a2a2a; border-radius: 8px; border: 1px solid #333;';

    const name = char.name || 'Unknown';
    const level = char.level || '?';
    const charClass = char.class || 'No Class';
    const race = char.race || 'Unknown';

    card.innerHTML = `
      <h4 style="color: #fff; margin: 0 0 8px 0; font-size: 15px;">${name}</h4>
      <div style="display: flex; gap: 12px; font-size: 12px; color: #b0b0b0;">
        <span>Lvl ${level}</span>
        <span>•</span>
        <span>${charClass}</span>
        <span>•</span>
        <span>${race}</span>
      </div>
    `;

    pushedCharactersList.appendChild(card);
  });
}

