/**
 * OwlCloud Adapter
 * Owlbear Rodeo integration for CarmaClouds
 * Loads the full OwlCloud popup UI
 */

export async function init(containerEl) {
  console.log('Initializing OwlCloud adapter...');

  try {
    // Show loading state
    containerEl.innerHTML = '<div class="loading">Loading OwlCloud...</div>';

    // Fetch synced characters and DiceCloud user ID from storage
    const result = await chrome.storage.local.get(['carmaclouds_characters', 'diceCloudUserId']);
    const characters = result.carmaclouds_characters || [];
    const diceCloudUserId = result.diceCloudUserId;

    console.log('Found', characters.length, 'synced characters');
    console.log('DiceCloud User ID:', diceCloudUserId);

    // Get the most recent character (for now - later we'll add character selection)
    const character = characters.length > 0 ? characters[0] : null;

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
    if (character && character.raw) {
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
              pushBtn.innerHTML = '⏳ Syncing...';

              if (!diceCloudUserId) {
                throw new Error('DiceCloud User ID not found. Please log in to DiceCloud first.');
              }

              // Store raw DiceCloud data in database
              console.log('💾 Storing raw character data to database...');
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
                      raw_dicecloud_data: character.raw,
                      user_id_dicecloud: diceCloudUserId,
                      updated_at: new Date().toISOString()
                    })
                  }
                );
                if (updateResponse.ok) {
                  console.log('✅ Raw character data stored in database');
                } else {
                  const errorText = await updateResponse.text();
                  console.warn('⚠️ Failed to store character data:', errorText);
                  throw new Error(`Database sync failed: ${errorText}`);
                }
              } catch (dbError) {
                console.error('⚠️ Database update failed:', dbError);
                throw dbError;
              }

              // Show success with the DiceCloud User ID
              pushBtn.innerHTML = '✅ Synced!';

              // Display the DiceCloud User ID for copy/paste
              if (statusSection) {
                const statusIcon = statusSection.querySelector('#statusIcon');
                const statusText = statusSection.querySelector('#statusText');
                if (statusIcon) statusIcon.textContent = '✅';
                if (statusText) {
                  statusText.innerHTML = `
                    <div style="margin-bottom: 10px;">Character synced to database!</div>
                    <div style="background: var(--bg-secondary, #f5f5f5); padding: 10px; border-radius: 4px; font-family: monospace;">
                      <div style="margin-bottom: 5px; font-size: 12px; opacity: 0.8;">Your DiceCloud User ID:</div>
                      <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="text" value="${diceCloudUserId}" readonly style="flex: 1; padding: 8px; border: 1px solid var(--border-color, #ddd); border-radius: 4px; font-family: monospace; font-size: 14px; background: white;">
                        <button id="copyUserIdBtn" style="padding: 8px 12px; background: #16a75a; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Copy</button>
                      </div>
                      <div style="margin-top: 8px; font-size: 11px; opacity: 0.7;">Paste this into the Owlbear extension to link your character.</div>
                    </div>
                  `;

                  // Add copy button handler
                  const copyBtn = statusSection.querySelector('#copyUserIdBtn');
                  if (copyBtn) {
                    copyBtn.addEventListener('click', async () => {
                      try {
                        await navigator.clipboard.writeText(diceCloudUserId);
                        copyBtn.textContent = '✓ Copied!';
                        setTimeout(() => {
                          copyBtn.textContent = 'Copy';
                        }, 2000);
                      } catch (err) {
                        console.error('Failed to copy:', err);
                      }
                    });
                  }
                }
              }

              setTimeout(() => {
                pushBtn.innerHTML = originalText;
                pushBtn.disabled = false;
              }, 3000);
            } catch (error) {
              console.error('Error syncing to database:', error);
              pushBtn.innerHTML = '❌ Failed';
              alert(`Failed to sync to database: ${error.message}`);
              setTimeout(() => {
                pushBtn.innerHTML = originalText;
                pushBtn.disabled = false;
              }, 2000);
            }
          });
        }
      }

      // Update status to show character loaded
      if (statusSection) {
        const statusIcon = statusSection.querySelector('#statusIcon');
        const statusText = statusSection.querySelector('#statusText');
        if (statusIcon) statusIcon.textContent = '📋';
        if (statusText) statusText.textContent = `Ready to sync: ${character.name}`;
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
