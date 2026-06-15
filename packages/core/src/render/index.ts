/**
 * System-agnostic render layer for the rebuild. DOM construction only (no
 * innerHTML); adapters mount the returned elements. See REBUILD.md.
 */
export { h, setChildren } from './h';
export type { HChild, HProps } from './h';
export { renderCharacterSheet } from './character';
export type { RenderOpts } from './character';
export { fetchCharacterIR, mountCharacterIR, mountIRToggle } from './mount';
export type { IRTarget } from './mount';
