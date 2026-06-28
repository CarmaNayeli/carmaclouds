/**
 * CarmaClouds — D&D Beyond content script
 *
 * Adds a "Sync to CarmaClouds" button on a D&D Beyond character page. On click it
 * reads the character id from the URL and asks the background worker to fetch the
 * public character-service JSON, normalize it to the system-agnostic IR, and
 * upsert it into the cloud — the same central table the DiceCloud sync writes to,
 * so every adapter (Owlbear / Roll20 / Foundry / Coyotes & Candles) can read it.
 *
 * The character must be set to Public on D&D Beyond for the fetch to succeed.
 */

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Pull the numeric character id out of a D&D Beyond character URL.
// e.g. https://www.dndbeyond.com/characters/123456789 → "123456789"
function currentCharacterId() {
  const m = location.pathname.match(/\/characters\/(\d{1,20})(?:\/|$)/);
  return m ? m[1] : null;
}

function isExtensionContextValid() {
  try {
    return !!(browserAPI && browserAPI.runtime && browserAPI.runtime.id);
  } catch {
    return false;
  }
}

const BTN_ID = 'carmaclouds-ddb-sync-btn';
const CONTAINER_ID = 'carmaclouds-ddb-sync-container';

function ensureSpinKeyframes() {
  if (document.getElementById('carmaclouds-ddb-spin')) return;
  const style = document.createElement('style');
  style.id = 'carmaclouds-ddb-spin';
  style.textContent = '@keyframes cc-ddb-spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(style);
}

const idleContent =
  '<span style="display:flex;align-items:center;gap:8px;">' +
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
  '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>' +
  '<polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>' +
  '<span>Sync to CarmaClouds</span></span>';

function addSyncButton() {
  if (!currentCharacterId()) return; // only on a character page
  if (document.getElementById(CONTAINER_ID)) return;
  ensureSpinKeyframes();

  const container = document.createElement('div');
  container.id = CONTAINER_ID;
  container.style.cssText =
    'position:fixed;bottom:20px;right:20px;z-index:2147483000;font-family:system-ui,sans-serif;';

  const button = document.createElement('button');
  button.id = BTN_ID;
  button.innerHTML = idleContent;
  button.style.cssText =
    'display:flex;align-items:center;gap:8px;padding:10px 16px;border:none;border-radius:10px;' +
    'color:#fff;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.35);' +
    'background:linear-gradient(135deg,#16a75a 0%,#0d8045 100%);transition:background .2s,opacity .2s;';
  button.addEventListener('click', handleSync);

  container.appendChild(button);
  document.body.appendChild(container);
}

function showResult(button, ok, label, color) {
  button.innerHTML = '<span style="display:flex;align-items:center;gap:8px;">' +
    (ok
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>') +
    `<span>${label}</span></span>`;
  button.style.background = color;
}

async function handleSync() {
  const button = document.getElementById(BTN_ID);
  if (!button) return;

  if (!isExtensionContextValid()) {
    showResult(button, false, 'Reload the page', 'linear-gradient(135deg,#b45309,#92400e)');
    return;
  }

  const characterId = currentCharacterId();
  if (!characterId) {
    showResult(button, false, 'Open a character first', 'linear-gradient(135deg,#b45309,#92400e)');
    setTimeout(resetButton, 3000);
    return;
  }

  button.disabled = true;
  button.innerHTML =
    '<span style="display:flex;align-items:center;gap:8px;">' +
    '<span style="width:16px;height:16px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;display:inline-block;animation:cc-ddb-spin 1s linear infinite;"></span>' +
    '<span>Syncing…</span></span>';

  try {
    const response = await browserAPI.runtime.sendMessage({
      type: 'SYNC_DNDBEYOND_TO_CARMACLOUDS',
      characterId,
    });
    if (response && response.success) {
      showResult(button, true, 'Synced!', 'linear-gradient(135deg,#28a745,#1e7e34)');
    } else {
      const msg = (response && response.error) || 'Sync failed';
      showResult(button, false, msg.length > 40 ? 'Sync failed' : msg, 'linear-gradient(135deg,#dc2626,#991b1b)');
      console.warn('CarmaClouds (D&D Beyond):', msg);
    }
  } catch (err) {
    showResult(button, false, 'Extension error', 'linear-gradient(135deg,#dc2626,#991b1b)');
    console.error('CarmaClouds (D&D Beyond): sync message failed', err);
  } finally {
    setTimeout(resetButton, 3000);
  }
}

function resetButton() {
  const button = document.getElementById(BTN_ID);
  if (!button) return;
  button.disabled = false;
  button.innerHTML = idleContent;
  button.style.background = 'linear-gradient(135deg,#16a75a 0%,#0d8045 100%)';
}

// D&D Beyond is a single-page app, so the button must (re)appear on client-side
// navigations between characters, not just the first load.
function watch() {
  addSyncButton();
  let lastPath = location.pathname;
  setInterval(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      const existing = document.getElementById(CONTAINER_ID);
      if (existing) existing.remove();
      addSyncButton();
    }
  }, 1000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', watch);
} else {
  watch();
}
