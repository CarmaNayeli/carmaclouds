/**
 * OwlCloud Adapter
 * Owlbear Rodeo integration for CarmaClouds
 * Loads the full OwlCloud popup UI
 */

import { parseForOwlCloud } from '../../../content/dicecloud-extraction.js';

export async function init(containerEl) {
  console.log('Initializing OwlCloud adapter...');

  try {
    // Show loading state
    containerEl.innerHTML = '<div class="loading">Loading OwlCloud...</div>';

    // Fetch synced characters from storage
    const result = await chrome.storage.local.get('carmaclouds_characters');
    const characters = result.carmaclouds_characters || [];

    console.log('Found', characters.length, 'synced characters');

    // Get the most recent character (for now - later we'll add character selection)
    const character = characters.length > 0 ? characters[0] : null;

    let parsedData = null;
    if (character && character.raw) {
      // Parse raw DiceCloud data for Owlbear Rodeo
      containerEl.innerHTML = '<div class="loading">Parsing character data...</div>';

      console.log('Parsing character for Owlbear Rodeo:', character.name);
      parsedData = parseForOwlCloud(character.raw);
      console.log('Parsed data:', parsedData);
    }

    // Fetch the OwlCloud popup HTML
    const htmlPath = chrome.runtime.getURL('src/popup/adapters/owlcloud/popup.html');
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
    const cssPath = chrome.runtime.getURL('src/popup/adapters/owlcloud/popup.css');
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

              // Store Owlbear-specific parsed data in database
              console.log('💾 Storing Owlbear parsed data to database...');
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
                      owlbear_data: parsedData,
                      updated_at: new Date().toISOString()
                    })
                  }
                );
                if (updateResponse.ok) {
                  console.log('✅ Owlbear data stored in database');
                } else {
                  console.warn('⚠️ Failed to store Owlbear data:', await updateResponse.text());
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

                await chrome.runtime.sendMessage({
                  action: 'storeCharacterData',
                  data: dataToStore,
                  slotId: character.slotId || 'slot-1'
                });
                console.log('✅ Local storage updated with parsed Owlbear data');

                // Notify any open popup to refresh and show the updated character
                chrome.runtime.sendMessage({
                  action: 'dataSynced',
                  characterName: dataToStore.name || 'Character'
                }).catch(() => {
                  console.log('ℹ️ No popup open to notify (normal)');
                });
              } catch (storageError) {
                console.warn('⚠️ Local storage update failed (non-fatal):', storageError);
              }

              // Get the active Owlbear Rodeo tab
              const tabs = await chrome.tabs.query({ url: '*://*.owlbear.rodeo/*' });
              if (tabs.length === 0) {
                throw new Error('No Owlbear Rodeo tab found. Please open Owlbear Rodeo first.');
              }

              // Send character data to Owlbear Rodeo content script
              await chrome.tabs.sendMessage(tabs[0].id, {
                type: 'PUSH_CHARACTER',
                data: parsedData
              });

              pushBtn.innerHTML = '✅ Pushed!';
              setTimeout(() => {
                pushBtn.innerHTML = originalText;
                pushBtn.disabled = false;
              }, 2000);
            } catch (error) {
              console.error('Error pushing to Owlbear Rodeo:', error);
              pushBtn.innerHTML = '❌ Failed';
              alert(`Failed to push to Owlbear Rodeo: ${error.message}`);
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

    // Listen for data sync notifications to refresh the UI
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'dataSynced') {
        console.log('📥 OwlCloud adapter received data sync notification:', message.characterName);
        // Reload the entire adapter to show updated character data
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
