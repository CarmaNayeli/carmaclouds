/**
 * Persistence shape for the clouds_character_ir table (see the matching SQL
 * migration). The IR is already plain JSON, so this just frames the upsert row
 * and stamps the schema version.
 */
import type { IRCharacter, RawDiceCloud } from './types';

/** Bump when the IR shape changes in a way consumers must migrate for. */
export const IR_VERSION = 1;

export interface IRRow {
  dicecloud_character_id: string;
  character_name: string;
  system_hint: string;
  ir: IRCharacter;
  ir_version: number;
  raw?: RawDiceCloud;
}

/**
 * Build the row to upsert into clouds_character_ir.
 *
 *   supabase.from('clouds_character_ir')
 *     .upsert(toIRRow(normalize(raw), raw), { onConflict: 'dicecloud_character_id' })
 *
 * Pass `raw` to keep a re-normalizable snapshot; omit it to store IR only.
 */
export function toIRRow(ir: IRCharacter, raw?: RawDiceCloud): IRRow {
  return {
    dicecloud_character_id: ir.id,
    character_name: ir.name,
    system_hint: ir.systemHint,
    ir,
    ir_version: IR_VERSION,
    ...(raw ? { raw } : {}),
  };
}
