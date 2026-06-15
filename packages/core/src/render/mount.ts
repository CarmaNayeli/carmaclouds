/**
 * Fetch a character's IR from clouds_character_ir and render it into a container.
 * Shared by every adapter surface (Owlbear popover, RollCloud popup-sheet, ...)
 * so each one is a couple of lines and the fetch/render/empty-state logic lives
 * in one place.
 */
import type { IRCharacter } from '../ir/types';
import { renderCharacterSheet, type RenderOpts } from './character';
import { h } from './h';

export interface IRTarget {
  url: string;
  anonKey: string;
}

/**
 * How to authorize the IR read after the owner-only RLS cutover (clouds_character_ir
 * is no longer anon-readable). Adapters supply whichever they have:
 *   - `accessToken`: the owner's Supabase JWT → direct table read, RLS serves their
 *     own row (used by the extension popup-sheet + the Owlbear popover, which hold a
 *     session).
 *   - `shareToken`: the per-character capability → the get_character_ir RPC, works
 *     with just the anon key and no session (used by Foundry, and by C&C's board).
 * With neither, it falls back to an anon table read (pre-cutover / dev only).
 */
export interface IRAuth {
  shareToken?: string | null;
  accessToken?: string | null;
}

/** GET the stored IR for a character, or null if there isn't one yet. */
export async function fetchCharacterIR(
  charId: string,
  target: IRTarget,
  auth: IRAuth = {},
): Promise<IRCharacter | null> {
  // Capability path: token-gated RPC (no session needed, cross-context).
  if (auth.shareToken) {
    const res = await fetch(`${target.url}/rest/v1/rpc/get_character_ir`, {
      method: 'POST',
      headers: {
        apikey: target.anonKey,
        Authorization: `Bearer ${target.anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_dicecloud_character_id: charId, p_share_token: auth.shareToken }),
    });
    if (!res.ok) return null;
    // The function returns the `ir` jsonb directly (or null).
    return (await res.json().catch(() => null)) ?? null;
  }

  // Owner path: read the table as the authenticated owner (RLS serves their row).
  // Falls back to the anon key when no token is given (pre-cutover / dev).
  const bearer = auth.accessToken || target.anonKey;
  const res = await fetch(
    `${target.url}/rest/v1/clouds_character_ir?dicecloud_character_id=eq.${encodeURIComponent(charId)}&select=ir`,
    { headers: { apikey: target.anonKey, Authorization: `Bearer ${bearer}` } },
  );
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  return rows?.[0]?.ir ?? null;
}

/**
 * Fetch + render into `container`. Returns the IR (or null). On no-IR / error it
 * renders a small message rather than throwing, so callers can fire-and-forget.
 */
export async function mountCharacterIR(
  container: Element,
  charId: string,
  target: IRTarget,
  opts: RenderOpts = {},
  auth: IRAuth = {},
): Promise<IRCharacter | null> {
  try {
    const ir = await fetchCharacterIR(charId, target, auth);
    if (!ir) {
      container.replaceChildren(h('div', {
        class: 'cc-empty', style: 'padding: 10px; font-size: 12px; opacity: 0.7;',
        text: 'No IR stored yet - re-sync this character from DiceCloud.',
      }));
      return null;
    }
    container.replaceChildren(renderCharacterSheet(ir, opts));
    return ir;
  } catch (e) {
    container.replaceChildren(h('div', {
      class: 'cc-empty', style: 'padding: 10px; font-size: 12px; opacity: 0.7;',
      text: 'Failed to load IR view.',
    }));
    return null;
  }
}

/**
 * Append a "⚗️ IR view (beta)" toggle + collapsible panel to `host`. The IR is
 * lazily fetched and rendered the first time the panel opens, using `getCharId()`
 * (read live, so it picks up whichever character is currently active).
 *
 * This is the whole per-adapter integration: one call.
 */
export function mountIRToggle(
  host: Element,
  getCharId: () => string | null | undefined,
  target: IRTarget,
  opts: RenderOpts = {},
  getAuth?: () => IRAuth | Promise<IRAuth>,
  label = '⚗️ IR view (beta)',
): { panel: HTMLElement; reload: () => void } {
  const btn = h('button', { class: 'cc-ir-toggle', text: label });
  const panel = h('div', { class: 'cc-ir-panel', style: 'display:none; margin-top:8px;' });
  let loaded = false;

  btn.addEventListener('click', async () => {
    const open = panel.style.display === 'none';
    panel.style.display = open ? 'block' : 'none';
    if (open && !loaded) {
      const id = getCharId();
      if (!id) {
        panel.replaceChildren(h('div', { class: 'cc-empty', text: 'No character loaded yet.' }));
        return;
      }
      // Resolve auth lazily, at open time, so a freshly-refreshed session token is used.
      let auth: IRAuth = {};
      try { if (getAuth) auth = (await getAuth()) || {}; } catch { auth = {}; }
      loaded = true;
      await mountCharacterIR(panel, id, target, opts, auth);
    }
  });

  host.append(btn, panel);
  return { panel, reload: () => { loaded = false; } };
}
