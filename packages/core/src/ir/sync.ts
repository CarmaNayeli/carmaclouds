/**
 * Write the system-agnostic IR to Supabase. Called from each sync path alongside
 * the existing clouds_characters write, so the rebuild's data flows into its own
 * table without disturbing the legacy path. See REBUILD.md.
 *
 * Uses the Supabase REST API via fetch so it works everywhere the extension runs
 * (background service worker, content scripts, popups) regardless of whether a
 * supabase-js client is in scope.
 */
import { normalize } from './normalize';
import { toIRRow } from './persistence';
import type { IRCharacter, RawDiceCloud } from './types';

export interface SupabaseRestTarget {
  url: string;
  anonKey: string;
}

/**
 * Normalize raw DiceCloud data and upsert it into clouds_character_ir.
 * Returns the IR. Throws on a real upsert error; callers should treat IR sync as
 * non-fatal (wrap in try/catch) so it never blocks the legacy sync.
 */
export async function upsertCharacterIR(
  raw: RawDiceCloud,
  target: SupabaseRestTarget,
): Promise<IRCharacter> {
  const ir = normalize(raw);
  if (!ir.id) throw new Error('upsertCharacterIR: normalized IR has no character id');

  const res = await fetch(
    `${target.url}/rest/v1/clouds_character_ir?on_conflict=dicecloud_character_id`,
    {
      method: 'POST',
      headers: {
        apikey: target.anonKey,
        Authorization: `Bearer ${target.anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(toIRRow(ir)),
    },
  );

  if (!res.ok) {
    throw new Error(`clouds_character_ir upsert failed: ${res.status} ${await res.text()}`);
  }
  return ir;
}
