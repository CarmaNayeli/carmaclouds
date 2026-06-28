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
import { normalizeDndBeyond } from './dndbeyond';
import { toIRRow, type IRRow } from './persistence';
import type { IRCharacter, RawDiceCloud } from './types';

export interface SupabaseRestTarget {
  url: string;
  anonKey: string;
  /**
   * Optional end-user JWT (Supabase access token). When present it is sent as the
   * Authorization bearer so the row is attributed to the authenticated user
   * (owner_id self-stamps via the column default) and so Phase 3 RLS can enforce
   * per-user access. `apikey` always stays the anon key. Omit it to fall back to
   * the legacy anon-only behaviour.
   */
  authToken?: string;
  /** Optional owner uuid to stamp explicitly (the authenticated user's id). */
  ownerId?: string;
}

/**
 * Upsert an already-normalized IR into clouds_character_ir. Source-agnostic, so
 * DiceCloud and D&D Beyond (and any future source) share one write path.
 * Returns the IR. Throws on a real upsert error; callers should treat IR sync as
 * non-fatal (wrap in try/catch) so it never blocks the legacy sync.
 */
export async function upsertIR(
  ir: IRCharacter,
  target: SupabaseRestTarget,
): Promise<IRCharacter> {
  if (!ir.id) throw new Error('upsertIR: IR has no character id');

  const row = toIRRow(ir);
  if (target.ownerId) (row as IRRow & { owner_id?: string }).owner_id = target.ownerId;

  const res = await fetch(
    `${target.url}/rest/v1/clouds_character_ir?on_conflict=owner_id,dicecloud_character_id`,
    {
      method: 'POST',
      headers: {
        apikey: target.anonKey,
        Authorization: `Bearer ${target.authToken || target.anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(row),
    },
  );

  if (!res.ok) {
    throw new Error(`clouds_character_ir upsert failed: ${res.status} ${await res.text()}`);
  }
  return ir;
}

/**
 * Normalize raw DiceCloud data and upsert it into clouds_character_ir.
 */
export async function upsertCharacterIR(
  raw: RawDiceCloud,
  target: SupabaseRestTarget,
): Promise<IRCharacter> {
  return upsertIR(normalize(raw), target);
}

/**
 * Normalize a raw D&D Beyond character (the public character-service v5 payload,
 * the full `{ data }` envelope or a bare character) and upsert it into
 * clouds_character_ir. Mirrors upsertCharacterIR for the DiceCloud path.
 */
export async function upsertCharacterIRFromDndBeyond(
  raw: unknown,
  target: SupabaseRestTarget,
): Promise<IRCharacter> {
  const ir = normalizeDndBeyond(raw);
  if (!ir) throw new Error('upsertCharacterIRFromDndBeyond: could not read that D&D Beyond character');
  return upsertIR(ir, target);
}
