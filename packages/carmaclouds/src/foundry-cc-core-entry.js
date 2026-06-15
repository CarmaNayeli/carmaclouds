/**
 * Entry bundled into the Foundry module as scripts/cc-core.js (ESM).
 *
 * The Foundry module loads as ES modules and can't import from @carmaclouds/core
 * directly, so this bundles the rebuild's IR + render layer into a single module
 * the FoundCloud sheet can `import('./cc-core.js')`.
 */
export { normalize, deriveDnd } from '@carmaclouds/core/ir';
export {
  renderCharacterSheet, h, setChildren,
  mountCharacterIR, fetchCharacterIR, mountIRToggle,
} from '@carmaclouds/core/render';
