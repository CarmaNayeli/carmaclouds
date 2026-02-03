/**
 * FoundCloud Adapter
 * Foundry VTT integration for CarmaClouds
 * Loads the FoundCloud popup UI for Supabase sync
 */

import initFoundCloudPopup from './foundcloud-popup.js';

// Detect browser API (Firefox uses 'browser', Chrome uses 'chrome')
const browserAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;

export async function init(containerEl) {
  console.log('Initializing FoundCloud adapter...');

  try {
    // Show loading state
    containerEl.innerHTML = '<div class="loading">Loading FoundCloud...</div>';

    // Fetch the FoundCloud popup HTML
    const htmlPath = browserAPI.runtime.getURL('src/popup/adapters/foundcloud/popup.html');
    const response = await fetch(htmlPath);
    const html = await response.text();

    // Parse HTML and extract body content
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const bodyContent = doc.body;

    // Wrap content in a scoped container to prevent CSS conflicts
    const wrapper = document.createElement('div');
    wrapper.className = 'foundcloud-adapter-scope';
    wrapper.innerHTML = bodyContent.innerHTML;
    containerEl.innerHTML = '';
    containerEl.appendChild(wrapper);

    // Load and inject the CSS with scoping
    const cssPath = browserAPI.runtime.getURL('src/popup/adapters/foundcloud/popup.css');
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

    // Initialize the FoundCloud popup logic
    initFoundCloudPopup();

    console.log('✅ FoundCloud adapter initialized');

  } catch (error) {
    console.error('Failed to load FoundCloud UI:', error);
    containerEl.innerHTML = `
      <div class="error" style="padding: 40px 20px; text-align: center; color: #dc3545;">
        <strong>Failed to load FoundCloud</strong>
        <p>${error.message}</p>
      </div>
    `;
  }
}
