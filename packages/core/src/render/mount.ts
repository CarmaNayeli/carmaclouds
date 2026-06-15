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

/** GET the stored IR for a character, or null if there isn't one yet. */
export async function fetchCharacterIR(
  charId: string,
  target: IRTarget,
): Promise<IRCharacter | null> {
  const res = await fetch(
    `${target.url}/rest/v1/clouds_character_ir?dicecloud_character_id=eq.${encodeURIComponent(charId)}&select=ir`,
    { headers: { apikey: target.anonKey, Authorization: `Bearer ${target.anonKey}` } },
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
): Promise<IRCharacter | null> {
  try {
    const ir = await fetchCharacterIR(charId, target);
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
      loaded = true;
      await mountCharacterIR(panel, id, target, opts);
    }
  });

  host.append(btn, panel);
  return { panel, reload: () => { loaded = false; } };
}
