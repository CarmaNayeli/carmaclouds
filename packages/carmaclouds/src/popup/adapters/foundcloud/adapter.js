/**
 * FoundCloud Adapter
 * Foundry VTT integration for CarmaClouds
 * Loads the FoundCloud popup UI
 */

export async function init(containerEl) {
  console.log('Initializing FoundCloud adapter...');

  try {
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

    // Import and initialize the FoundCloud popup logic
    const { default: initFoundCloudPopup } = await import('./foundcloud-popup.js');
    if (typeof initFoundCloudPopup === 'function') {
      initFoundCloudPopup();
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
