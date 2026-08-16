/**
 * Which locally-stored character is "the one you're working on".
 *
 * `carmaclouds_characters` is insertion-ordered and the background updates
 * entries in place, so positional picks (`chars[0]`, `chars[chars.length - 1]`)
 * resolve to "whichever character was first added earliest/latest, ever" — they
 * never follow the DiceCloud sheet you have open, and stick on one character no
 * matter how many times you re-sync a different one. Adapters should resolve by
 * identity instead, via the helpers here.
 */

const browserAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;

/**
 * Pick the character the player is actually looking at.
 * Preference: the character open in a DiceCloud tab → the last one synced from
 * DiceCloud (`activeCharacterId`, stamped by the background on every sync) →
 * newest `syncedAt` → last stored.
 */
export function resolveCurrentCharacter(chars, openTabCharId, activeCharacterId) {
  if (!chars || chars.length === 0) return null;
  const byId = (id) => (id ? chars.find((c) => c.id === id) : null);
  const newestSynced = chars
    .filter((c) => c.syncedAt)
    .sort((a, b) => new Date(b.syncedAt) - new Date(a.syncedAt))[0];
  return byId(openTabCharId)
    || byId(activeCharacterId)
    || newestSynced
    || chars[chars.length - 1];
}

/** DiceCloud character id from an open tab, preferring the focused one. */
export async function getCharacterIdFromOpenTab() {
  try {
    // `*://*.dicecloud.com/*` doesn't match bare `dicecloud.com`, so ask for both.
    const results = await Promise.all([
      browserAPI.tabs.query({ url: '*://*.dicecloud.com/*' }).catch(() => []),
      browserAPI.tabs.query({ url: '*://dicecloud.com/*' }).catch(() => []),
    ]);
    const seen = new Set();
    const tabs = results.flat().filter((t) => (seen.has(t.id) ? false : seen.add(t.id)));
    tabs.sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0));
    for (const tab of tabs) {
      const match = (tab.url || '').match(/\/character\/([^/?#]+)/);
      if (match) return match[1];
    }
  } catch (err) {
    console.warn('CarmaClouds: could not read the open DiceCloud tab:', err);
  }
  return null;
}

/** Read storage + tab state and resolve in one call. */
export async function loadCurrentCharacter() {
  const stored = await browserAPI.storage.local.get(['carmaclouds_characters', 'activeCharacterId']) || {};
  const chars = stored.carmaclouds_characters || [];
  const openTabCharId = await getCharacterIdFromOpenTab();
  return {
    character: resolveCurrentCharacter(chars, openTabCharId, stored.activeCharacterId),
    openTabCharId,
    characters: chars,
  };
}
