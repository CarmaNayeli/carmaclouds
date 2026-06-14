/**
 * Entry bundled into the Owlbear extension as owlbear-extension/cc-core.js.
 *
 * The Owlbear popover loads as a classic (non-bundled) script, so it can't import
 * from @carmaclouds/core directly. This IIFE bundle exposes the rebuild's IR +
 * render layer on window for popover.js to use.
 */
import { normalize, deriveDnd } from '@carmaclouds/core/ir';
import { renderCharacterSheet, h, setChildren } from '@carmaclouds/core/render';

window.CarmaCloudsCore = { normalize, deriveDnd, renderCharacterSheet, h, setChildren };
