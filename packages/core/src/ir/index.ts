/**
 * System-agnostic IR for DiceCloud characters. See REBUILD.md.
 */
export * from './types';
export { normalize } from './normalize';
export { deriveDnd, DND_ABILITIES } from './views/dnd5e';
export type { Dnd5eView, AbilityView, PoolView, HitDicePool } from './views/dnd5e';
export { IR_VERSION, toIRRow } from './persistence';
export type { IRRow } from './persistence';
export { upsertCharacterIR } from './sync';
