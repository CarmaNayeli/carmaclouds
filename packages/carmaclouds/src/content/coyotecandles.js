/**
 * CoyoteCloud bridge — content script for Coyotes & Candles
 *
 * Coyotes & Candles has a built-in VTT (the "meet" room) with its own character
 * sheet system. This script bridges identity so that the site's "Import from
 * DiceCloud" picker can find the characters this user synced to the CarmaClouds
 * cloud: it posts the user's DiceCloud user id (and a best-effort local roster)
 * into the page, where the C&C import UI listens for it. The page then reads the
 * full parsed character from the cloud and maps it into its sheet system.
 *
 * Protocol (window.postMessage):
 *   page → us:  { source: 'coyotes-meet',  type: 'coyotecloud:request' }
 *   us → page:  { source: 'carmaclouds',   type: 'coyotecloud:characters',
 *                 dicecloudUserId, characters: [{ dicecloud_character_id,
 *                 character_name, level, class, race }] }
 */

const browserAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;

async function getBridgePayload() {
  const result = await browserAPI.storage.local.get(['diceCloudUserId', 'carmaclouds_characters']) || {};
  const dicecloudUserId = result.diceCloudUserId || null;
  // Best-effort local roster; the page falls back to a cloud lookup by user id
  // (the cloud is authoritative and survives local storage being cleared).
  const characters = (result.carmaclouds_characters || []).map((c) => ({
    dicecloud_character_id: c.id,
    character_name: c.name || 'Unknown',
    level: c.preview?.level ?? c.level ?? null,
    class: c.preview?.class ?? c.class ?? null,
    race: c.preview?.race ?? c.race ?? null,
    // Each character carries its own DiceCloud owner id (from the raw creature),
    // so the C&C import can look it up even if the global login was cleared.
    user_id_dicecloud: c.raw?.creature?.owner || dicecloudUserId || null,
  }));
  return { dicecloudUserId, characters };
}

async function postRoster() {
  const { dicecloudUserId, characters } = await getBridgePayload();
  window.postMessage({ source: 'carmaclouds', type: 'coyotecloud:characters', dicecloudUserId, characters }, window.location.origin);
}

// Respond when the page asks (it announces itself when the import panel mounts),
// and bridge write-back requests through to the background service worker (which
// speaks DiceCloud's DDP protocol).
window.addEventListener('message', (e) => {
  if (e.source !== window) return;
  const d = e.data;
  if (!d || d.source !== 'coyotes-meet') return;

  if (d.type === 'coyotecloud:request') {
    postRoster();
    return;
  }

  if (d.type === 'coyotecloud:writeback') {
    const { requestId, dicecloudCharacterId, values } = d;
    const reply = (payload) => window.postMessage(
      { source: 'carmaclouds', type: 'coyotecloud:writeback-result', requestId, ...payload },
      window.location.origin,
    );
    browserAPI.runtime.sendMessage({ action: 'coyotecloudWriteback', dicecloudCharacterId, values })
      .then((res) => reply({
        ok: !!(res && res.ok),
        error: res && res.error,
        applied: res && res.applied,
        failed: res && res.failed,
      }))
      .catch((err) => reply({ ok: false, error: String((err && err.message) || err) }));
  }
});

// Proactively announce on load too, in case the page is already listening.
postRoster();

// Keep the page in sync if the user syncs a new character while it's open.
browserAPI.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.carmaclouds_characters || changes.diceCloudUserId)) {
    postRoster();
  }
});
