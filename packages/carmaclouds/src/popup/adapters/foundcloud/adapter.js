/**
 * FoundCloud Adapter
 * Foundry VTT integration for CarmaClouds
 * Loads the FoundCloud popup UI
 */

import { parseForFoundCloud } from '../../../content/dicecloud-extraction.js';

export async function init(containerEl) {
  console.log('Initializing FoundCloud adapter...');

  try {
    // Show loading state
    containerEl.innerHTML = '<div class="loading">Loading FoundCloud...</div>';

    // Fetch synced characters from storage
    const result = await chrome.storage.local.get('carmaclouds_characters');
    const characters = result.carmaclouds_characters || [];

    console.log('Found', characters.length, 'synced characters');

    // Get the most recent character (for now - later we'll add character selection)
    const character = characters.length > 0 ? characters[0] : null;

    let parsedData = null;
    if (character && character.raw) {
      // Parse raw DiceCloud data for Foundry VTT
      containerEl.innerHTML = '<div class="loading">Parsing character data...</div>';

      console.log('Parsing character for Foundry VTT:', character.name);
      parsedData = parseForFoundCloud(character.raw);
      console.log('Parsed data:', parsedData);
    }

    // Fetch the FoundCloud popup HTML
    const htmlPath = chrome.runtime.getURL('src/popup/adapters/foundcloud/popup.html');
    const response = await fetch(htmlPath);
    const html = await response.text();

    // Extract only the main content section (not headers/footers)
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    // FoundCloud uses different structure - get the content without header
    const container = doc.querySelector('.foundcloud-container');
    const sections = container ? Array.from(container.children).filter(el => !el.matches('header, .header, footer')).map(el => el.outerHTML).join('') : doc.body.innerHTML;

    // Wrap content in a scoped container to prevent CSS conflicts
    const wrapper = document.createElement('div');
    wrapper.className = 'foundcloud-adapter-scope';
    wrapper.innerHTML = sections;
    containerEl.innerHTML = '';
    containerEl.appendChild(wrapper);

    // Load and inject the CSS with scoping
    const cssPath = chrome.runtime.getURL('src/popup/adapters/foundcloud/popup.css');
    const cssResponse = await fetch(cssPath);
    let css = await cssResponse.text();

    // Scope all CSS rules to the adapter container
    css = css.replace(/(^|\})\s*([^{}@]+)\s*\{/gm, (match, closer, selector) => {
      // Don't scope @media, @keyframes, etc.
      if (selector.trim().startsWith('@')) return match;
      // Scope the selector
      const scopedSelector = selector.split(',').map(s => `.foundcloud-adapter-scope ${s.trim()}`).join(', ');
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

              // For Foundry, we sync to cloud database
              // The Foundry module will pull from there
              // TODO: Implement cloud sync for Foundry VTT
              alert('Foundry VTT cloud sync not yet implemented. Coming soon!');

              pushBtn.innerHTML = originalText;
              pushBtn.disabled = false;
            } catch (error) {
              console.error('Error pushing to Foundry VTT:', error);
              pushBtn.innerHTML = '❌ Failed';
              alert(`Failed to push to Foundry VTT: ${error.message}`);
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
    const copyBtn = wrapper.querySelector('#copyUrlBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const urlInput = wrapper.querySelector('#moduleUrl');
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

  } catch (error) {
    console.error('Failed to load FoundCloud UI:', error);
    containerEl.innerHTML = `
      <div class="error">
        <strong>Failed to load FoundCloud</strong>
        <p>${error.message}</p>
      </div>
    `;
  }
}
