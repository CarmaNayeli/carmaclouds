/**
 * CoyoteCloud Adapter
 * Coyotes & Candles integration for CarmaClouds
 *
 * Coyotes & Candles (https://coyotesandcandles.com) has a built-in VTT with its
 * own 5e character sheet system. CoyoteCloud syncs the player's DiceCloud
 * character to the CarmaClouds cloud, then the C&C "meet" room imports it via its
 * "Import from DiceCloud" picker. This tab handles the sync + tells the player
 * how to import (and doubles as cross-promotion both ways).
 *
 * Renders its UI inline (no separate popup.html) and reuses the same
 * parse + Supabase write that FoundCloud uses, so the cloud row carries
 * `foundcloud_parsed_data` for the C&C side to map.
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@carmaclouds/core/supabase/config.js';
import { parseForFoundCloud, parseForOwlCloud } from '../../../content/dicecloud-extraction.js';

const browserAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;
const COYOTES_URL = 'https://coyotesandcandles.com';

// Prefer the popup's shared, authenticated client; fall back to a fresh one.
function getSupabase() {
  return window.supabaseClient || createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export async function init(containerEl) {
  console.log('Initializing CoyoteCloud adapter...');
  const supabase = getSupabase();

  // Adopt the service worker's authoritative session before reading it, so the
  // sync writes carry the owner's auth.uid() (stamped into supabase_user_id) and
  // survive the owner-only RLS cutover. Without this we race the non-blocking
  // bootstrap adoption and can write as an unowned anon row. Matches the
  // FoundCloud / OwlCloud adapters.
  if (typeof window !== 'undefined' && window.adoptSupabaseSession) {
    try { await window.adoptSupabaseSession(); } catch (_) { /* fall through to anon */ }
  }

  const stored = await browserAPI.storage.local.get(['carmaclouds_characters', 'diceCloudUserId']) || {};
  const localChars = stored.carmaclouds_characters || [];
  const dicecloudUserId = stored.diceCloudUserId || null;

  // The most recently synced-from-DiceCloud character (ready to push to cloud).
  const pending = localChars.length > 0 ? localChars[localChars.length - 1] : null;

  let sessionUserId = null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    sessionUserId = session?.user?.id || null;
  } catch (_) { /* not logged in */ }

  containerEl.innerHTML = renderShell({ dicecloudUserId });

  const $ = (sel) => containerEl.querySelector(sel);

  // ── DiceCloud user id (for the manual-import fallback on the C&C side) ──
  const copyIdBtn = $('#cc-copy-id');
  if (copyIdBtn && dicecloudUserId) {
    copyIdBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(dicecloudUserId);
        copyIdBtn.textContent = '✓ Copied';
        setTimeout(() => { copyIdBtn.textContent = 'Copy'; }, 1500);
      } catch (_) { copyIdBtn.textContent = '✗'; }
    });
  }

  // ── Open Coyotes & Candles ──
  $('#cc-open-site')?.addEventListener('click', () => browserAPI.tabs.create({ url: COYOTES_URL }));

  // ── Sync the pending character to the cloud ──
  const syncBox = $('#cc-sync-box');
  const syncBtn = $('#cc-sync-btn');
  if (pending && pending.raw && syncBox) {
    syncBox.style.display = 'block';
    $('#cc-pending-name').textContent = pending.name || 'Unknown';
    $('#cc-pending-meta').textContent = [
      pending.preview?.level ? `Lvl ${pending.preview.level}` : null,
      pending.preview?.class, pending.preview?.race,
    ].filter(Boolean).join(' · ');

    syncBtn?.addEventListener('click', async () => {
      const original = syncBtn.innerHTML;
      syncBtn.disabled = true;
      syncBtn.innerHTML = '⏳ Syncing…';
      try {
        await syncCharacterToCloud(supabase, pending, { dicecloudUserId });
        syncBtn.innerHTML = '✅ Synced to CoyoteCloud!';
        await loadSyncedList(supabase, containerEl, dicecloudUserId);
      } catch (err) {
        console.error('CoyoteCloud sync failed:', err);
        syncBtn.innerHTML = '❌ Failed';
        $('#cc-status').textContent = err.message || 'Sync failed.';
        setTimeout(() => { syncBtn.innerHTML = original; syncBtn.disabled = false; }, 2000);
      }
    });
  }

  // ── Opt-in write-back toggle (captures DiceCloud token; enables C&C → DiceCloud) ──
  const wbToggle = $('#cc-writeback-toggle');
  const wbStatus = $('#cc-writeback-status');
  async function refreshWbStatus() {
    const { coyotecloudWritebackEnabled, diceCloudToken } = await browserAPI.storage.local.get(['coyotecloudWritebackEnabled', 'diceCloudToken']);
    if (wbToggle) wbToggle.checked = !!coyotecloudWritebackEnabled;
    if (!wbStatus) return;
    if (!coyotecloudWritebackEnabled) wbStatus.textContent = 'Off. Turn on to push sheet changes from C&C back to DiceCloud.';
    else if (diceCloudToken) wbStatus.textContent = '✓ On — DiceCloud token captured.';
    else wbStatus.textContent = 'On — open dicecloud.com (logged in) once to capture your login token.';
  }
  if (wbToggle) {
    await refreshWbStatus();
    wbToggle.addEventListener('change', async () => {
      if (wbToggle.checked) {
        await browserAPI.storage.local.set({ coyotecloudWritebackEnabled: true });
      } else {
        // Turning off clears both the flag and the stored session token.
        await browserAPI.storage.local.set({ coyotecloudWritebackEnabled: false });
        await browserAPI.storage.local.remove('diceCloudToken');
      }
      setTimeout(refreshWbStatus, 700);
    });
  }

  await loadSyncedList(supabase, containerEl, dicecloudUserId);
}

/** Write the character to clouds_characters with foundcloud_parsed_data. */
async function syncCharacterToCloud(supabase, char, { dicecloudUserId }) {
  // Establish + read the session at WRITE time (not init), and require it: the
  // cloud table is owner-only RLS, so the row must be stamped with auth.uid().
  if (typeof window !== 'undefined' && window.adoptSupabaseSession) {
    try { await window.adoptSupabaseSession(); } catch (_) { /* fall through */ }
  }
  let sessionUserId = null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    sessionUserId = session?.user?.id || null;
  } catch (_) { /* handled below */ }
  if (!sessionUserId) {
    throw new Error('Could not sign in to sync. Reload the extension (and update to the latest version), then try again.');
  }

  const parsed = parseForFoundCloud(char.raw, char.id);
  const owl = parseForOwlCloud(char.raw, char.id);
  const row = {
    dicecloud_character_id: char.id,
    character_name: char.name,
    level: parsed?.level || char.preview?.level || 1,
    race: parsed?.race || char.preview?.race || 'Unknown',
    class: parsed?.class || char.preview?.class || 'Unknown',
    foundcloud_parsed_data: parsed || {},
    owlcloud_parsed_data: owl || {},
    raw_dicecloud_data: char.raw || {},
    user_id_dicecloud: dicecloudUserId,
    supabase_user_id: sessionUserId,
    updated_at: new Date().toISOString(),
  };

  // Check-then-write rather than upsert: clouds_characters has no single-column
  // unique constraint on dicecloud_character_id (it's a composite with
  // user_id_dicecloud), so onConflict:'dicecloud_character_id' errors with
  // "no unique or exclusion constraint matching the ON CONFLICT specification".
  const { data: existing, error: checkError } = await supabase
    .from('clouds_characters')
    .select('id')
    .eq('dicecloud_character_id', char.id)
    .limit(1);
  if (checkError) throw new Error(checkError.message);

  let error;
  if (existing && existing.length > 0) {
    ({ error } = await supabase.from('clouds_characters').update(row).eq('dicecloud_character_id', char.id));
  } else {
    ({ error } = await supabase.from('clouds_characters').insert(row));
  }
  if (error) throw new Error(error.message);
}

/** Load + render the list of characters already in the cloud for this user. */
async function loadSyncedList(supabase, containerEl, dicecloudUserId) {
  const listEl = containerEl.querySelector('#cc-synced-list');
  const emptyEl = containerEl.querySelector('#cc-synced-empty');
  if (!listEl || !dicecloudUserId) return;
  try {
    const { data, error } = await supabase
      .from('clouds_characters')
      .select('dicecloud_character_id,character_name,level,class,race')
      .eq('user_id_dicecloud', dicecloudUserId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    listEl.innerHTML = '';
    if (!data || data.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }
    if (emptyEl) emptyEl.style.display = 'none';
    for (const c of data) {
      const card = document.createElement('div');
      card.style.cssText = 'background:#1a1a1a;padding:10px 12px;border-radius:8px;border:1px solid #333;';
      card.innerHTML = `
        <div style="color:#e8b840;font-weight:600;font-size:14px;">${escapeHtml(c.character_name || 'Unknown')}</div>
        <div style="color:#888;font-size:12px;margin-top:2px;">
          ${[c.level ? `Lvl ${c.level}` : '', c.class || '', c.race || ''].filter(Boolean).join(' · ')}
        </div>`;
      listEl.appendChild(card);
    }
  } catch (err) {
    console.error('Failed to load CoyoteCloud characters:', err);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderShell({ dicecloudUserId }) {
  return `
    <div style="padding:14px 12px;color:#e0e0e0;font-size:14px;">
      <div style="text-align:center;margin-bottom:14px;">
        <h2 style="margin:0 0 4px;font-size:18px;color:#e8b840;">CoyoteCloud</h2>
        <p style="margin:0;color:#b0b0b0;font-size:13px;line-height:1.5;">
          Bring your DiceCloud character into the
          <strong>Coyotes &amp; Candles</strong> built-in VTT.
        </p>
      </div>

      <div id="cc-sync-box" style="display:none;background:#141414;border:1px solid #333;border-radius:10px;padding:12px;margin-bottom:14px;">
        <div style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px;">Ready to sync</div>
        <div id="cc-pending-name" style="color:#fff;font-weight:600;"></div>
        <div id="cc-pending-meta" style="color:#888;font-size:12px;margin-bottom:10px;"></div>
        <button id="cc-sync-btn" class="btn btn-primary" style="width:100%;padding:10px;border:none;border-radius:6px;background:#e8b840;color:#1a1a1a;font-weight:700;cursor:pointer;">
          ☁️ Sync to CoyoteCloud
        </button>
        <div id="cc-status" style="color:#e57373;font-size:12px;text-align:center;margin-top:6px;"></div>
      </div>

      <div style="background:#141414;border:1px solid #333;border-radius:10px;padding:12px;margin-bottom:14px;">
        <div style="font-weight:600;margin-bottom:6px;">How to import in your game</div>
        <ol style="margin:0;padding-left:18px;color:#b0b0b0;font-size:13px;line-height:1.6;">
          <li>Open your room on <strong>Coyotes &amp; Candles</strong>.</li>
          <li>In the board, open <strong>Sheets</strong> → <strong>Import from DiceCloud</strong>.</li>
          <li>Pick this character — it maps straight into the 5e sheet.</li>
        </ol>
        <button id="cc-open-site" style="margin-top:10px;width:100%;padding:9px;border:1px solid #e8b840;border-radius:6px;background:transparent;color:#e8b840;font-weight:600;cursor:pointer;">
          🌙 Open Coyotes &amp; Candles
        </button>
      </div>

      <div style="background:#141414;border:1px solid #333;border-radius:10px;padding:12px;margin-bottom:14px;">
        <label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;">
          <input type="checkbox" id="cc-writeback-toggle" style="margin-top:3px;" />
          <span style="font-size:13px;color:#b0b0b0;line-height:1.5;">
            <strong style="color:#e0e0e0;">Sync changes back to DiceCloud</strong> (experimental)<br/>
            Lets the C&amp;C sheet push HP, temp HP, death saves, inspiration &amp; spell slots to <em>your</em> DiceCloud character. Captures your DiceCloud login token on this device so writes can authenticate.
          </span>
        </label>
        <div id="cc-writeback-status" style="font-size:12px;color:#888;margin-top:8px;"></div>
      </div>

      ${dicecloudUserId ? `
      <div style="background:#141414;border:1px solid #333;border-radius:10px;padding:12px;margin-bottom:14px;">
        <div style="font-size:12px;color:#888;margin-bottom:6px;">No extension on your game device? Paste this DiceCloud user id into the import box:</div>
        <div style="display:flex;gap:8px;align-items:center;">
          <code style="flex:1;background:#000;border:1px solid #333;border-radius:6px;padding:6px 8px;font-size:12px;color:#9cc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(dicecloudUserId)}</code>
          <button id="cc-copy-id" style="padding:6px 10px;border:1px solid #555;border-radius:6px;background:#222;color:#ddd;cursor:pointer;">Copy</button>
        </div>
      </div>` : ''}

      <div>
        <div style="font-weight:600;margin-bottom:8px;">Your synced characters</div>
        <div id="cc-synced-empty" style="display:none;color:#888;font-size:13px;">Nothing synced yet. Sync a character from DiceCloud to get started.</div>
        <div id="cc-synced-list" style="display:flex;flex-direction:column;gap:8px;"></div>
      </div>
    </div>
  `;
}
