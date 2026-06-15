/**
 * System-agnostic character renderer. Builds a sheet DOM from an IRCharacter
 * using the `h()` builder (never innerHTML). Adapters mount the returned element
 * and supply roll/use callbacks.
 *
 * D&D characters get the familiar ability grid (derived view); every character -
 * D&D or not - also gets generic Resources / Attributes / Actions sections, which
 * is where custom stats and charge-with-reset abilities finally show up.
 */
import type { IRAction, IRAttribute, IRCharacter } from '../ir/types';
import { deriveDnd, DND_ABILITIES } from '../ir/views/dnd5e';
import { h } from './h';

export interface RenderOpts {
  /** Called when a rollable element (ability/save/skill) is clicked. */
  onRoll?: (label: string, modifier: number) => void;
  /** Called when an action/spell "use" is clicked. */
  onUse?: (action: IRAction) => void;
}

const RESET_LABEL: Record<string, string> = { shortRest: 'SR', longRest: 'LR' };
const signed = (n: number) => `${n >= 0 ? '+' : ''}${n}`;

function sectionHeader(title: string): HTMLElement {
  return h('div', { class: 'section-header', text: title });
}

/** Small badge showing a reset period (SR / LR / raw). */
function resetBadge(reset: string | null | undefined): HTMLElement | null {
  if (!reset) return null;
  return h('span', { class: 'cc-reset-badge', text: RESET_LABEL[reset] ?? reset });
}

/** current / max pill, e.g. "2 / 2". */
function poolPill(current: number, max: number): HTMLElement {
  return h('span', { class: 'cc-pool' },
    h('span', { class: 'cc-pool-current', text: String(current) }),
    ' / ',
    h('span', { class: 'cc-pool-max', text: String(max) }));
}

/** Top combat-stats strip (HP / AC / Speed / Init / Prof) - whichever exist. */
function combatStats(ir: IRCharacter): HTMLElement | null {
  const { byVar } = ir;
  // DiceCloud sheets name these variably; try common aliases.
  const pick = (...names: string[]) => names.map((n) => byVar[n]).find(Boolean);
  const items: [string, string][] = [];

  const hp = pick('hitPoints', 'hp');
  if (hp) items.push(['HP', `${hp.total - hp.damage}/${hp.total}`]);
  const ac = pick('armorClass', 'armor', 'ac');
  if (ac && ac.value) items.push(['AC', String(ac.value)]);
  const speed = pick('speed', 'walkingSpeed');
  if (speed && speed.value) items.push(['Speed', String(speed.value)]);
  const init = pick('initiative', 'initiativeBonus', 'initiativeMod');
  if (init) items.push(['Init', signed(init.value)]);
  const prof = pick('proficiencyBonus', 'proficiency');
  if (prof && prof.value) items.push(['Prof', signed(prof.value)]);

  if (items.length === 0) return null;
  return h('div', { class: 'cc-combat' },
    ...items.map(([label, val]) =>
      h('div', { class: 'cc-stat' },
        h('div', { class: 'cc-stat-label', text: label }),
        h('div', { class: 'cc-stat-value', text: val }))));
}

/** Trained skills (skillType 'skill'), clickable to roll. */
function skillsSection(ir: IRCharacter, opts: RenderOpts): HTMLElement | null {
  const skills = ir.skills.filter((s) => s.skillType === 'skill' && s.active && s.variableName);
  if (skills.length === 0) return null;

  const list = h('div', { class: 'cc-skill-list' });
  for (const s of skills) {
    list.appendChild(
      h('div', {
          class: 'cc-skill' + (s.proficiency > 0 ? ' cc-proficient' : ''),
          title: `Roll ${s.name}`,
          onClick: () => opts.onRoll?.(s.name, s.value),
        },
        h('span', { class: 'cc-skill-name', text: s.name }),
        h('span', { class: 'cc-skill-bonus', text: signed(s.value) })),
    );
  }
  return h('div', {}, sectionHeader('Skills'), list);
}

/** D&D ability grid (only when the derived view has abilities). */
function abilityGrid(ir: IRCharacter, opts: RenderOpts): HTMLElement | null {
  const dnd = deriveDnd(ir);
  if (Object.keys(dnd.abilities).length === 0) return null;

  const grid = h('div', { class: 'ability-grid' });
  for (const ab of DND_ABILITIES) {
    const a = dnd.abilities[ab];
    if (!a) continue;
    const label = ab.slice(0, 3).toUpperCase();
    const save = dnd.saves[ab];

    const rollCell = (kind: string, value: number) =>
      h('div', {
          class: 'cc-ability-roll',
          title: `Roll ${label} ${kind === 'CHK' ? 'check' : 'save'}`,
          onClick: () => opts.onRoll?.(`${label} ${kind === 'CHK' ? 'check' : 'save'}`, value),
        },
        h('div', { class: 'cc-roll-label', text: kind }),
        h('div', { class: 'cc-roll-val', text: signed(value) }));

    grid.appendChild(
      h('div', { class: 'ability-box' },
        h('div', { class: 'ability-name', text: label }),
        h('div', { class: 'ability-score', text: String(a.score) }),
        h('div', { class: 'cc-ability-rolls' },
          rollCell('CHK', a.modifier),
          save !== undefined ? rollCell('SAV', save) : null)),
    );
  }
  return h('div', {}, sectionHeader('Abilities'), grid);
}

/** Resources: anything with a max + (usually) a reset - charges, slots, hit dice. */
function resourcesSection(ir: IRCharacter): HTMLElement | null {
  const isResourceLike = (a: IRAttribute) =>
    (a.type === 'resource' || a.type === 'spellSlot' || a.type === 'hitDice') && a.total > 0;
  const resources = ir.attributes.filter(isResourceLike);
  if (resources.length === 0) return null;

  const list = h('div', { class: 'cc-resource-list' });
  for (const r of resources) {
    const current = r.total - r.damage;
    const sizeNote = r.hitDiceSize ? ` ${r.hitDiceSize}` : '';
    list.appendChild(
      h('div', { class: 'cc-resource' + (r.active ? '' : ' cc-inactive') },
        h('span', { class: 'cc-resource-name', text: r.name + sizeNote }),
        poolPill(current, r.total),
        resetBadge(r.reset)),
    );
  }
  return h('div', {}, sectionHeader('Resources'), list);
}

/**
 * Generic attributes: custom stats with no D&D analog (sanity, glory, ...). We
 * skip the ones already shown elsewhere (abilities, resources, HP, modifiers).
 */
function attributesSection(ir: IRCharacter): HTMLElement | null {
  // Hide structural types (shown elsewhere) and 'utility' (internal computed
  // values like Class DC / proficiency ranks). What's left is deliberate custom
  // stats - sanity, glory, corruption, etc.
  const hidden = new Set([
    'ability', 'modifier', 'healthBar', 'resource', 'spellSlot', 'hitDice', 'utility',
  ]);
  // Also drop zero-valued entries - on sparse sheets these are unset internals
  // (Speed 0, Size 0, Level 0) rather than meaningful custom stats.
  const custom = ir.attributes.filter((a) => !hidden.has(a.type) && a.variableName && a.value !== 0);
  if (custom.length === 0) return null;

  const list = h('div', { class: 'cc-attr-list' });
  for (const a of custom) {
    list.appendChild(
      h('div', { class: 'cc-attr' + (a.active ? '' : ' cc-inactive') },
        h('span', { class: 'cc-attr-name', text: a.name }),
        h('span', { class: 'cc-attr-value', text: String(a.value) })),
    );
  }
  return h('div', {}, sectionHeader('Attributes'), list);
}

/** Actions & spells, showing real uses (current/max + reset). */
function actionsSection(ir: IRCharacter, opts: RenderOpts): HTMLElement | null {
  if (ir.actions.length === 0) return null;

  const list = h('div', { class: 'cc-action-list' });
  for (const action of ir.actions) {
    const meta: HTMLElement[] = [];
    if (action.kind === 'spell' && action.spell) {
      meta.push(h('span', { class: 'cc-action-tag', text: `L${action.spell.level}` }));
    }
    if (action.attack) {
      meta.push(h('span', { class: 'cc-action-attack', title: 'Attack bonus', text: signed(action.attack.bonus) }));
    }
    for (const d of action.damage) {
      meta.push(h('span', { class: 'cc-action-damage', text: d.type ? `${d.formula} ${d.type}` : d.formula }));
    }
    const usesEl = action.uses
      ? h('span', { class: 'cc-action-uses' }, poolPill(action.uses.current, action.uses.max), resetBadge(action.uses.reset))
      : null;

    list.appendChild(
      h('div', {
          class: `cc-action cc-action-${action.kind}` + (action.active ? '' : ' cc-inactive'),
          onClick: opts.onUse ? () => opts.onUse!(action) : undefined,
        },
        h('span', { class: 'cc-action-name', text: action.name }),
        ...meta,
        usesEl),
    );
  }
  return h('div', {}, sectionHeader('Actions & Spells'), list);
}

/** Inventory list with quantity + equipped marker. */
function inventorySection(ir: IRCharacter): HTMLElement | null {
  if (ir.inventory.length === 0) return null;
  const list = h('div', { class: 'cc-item-list' });
  for (const item of ir.inventory) {
    list.appendChild(
      h('div', { class: 'cc-item' + (item.equipped ? ' cc-equipped' : '') },
        item.equipped ? h('span', { class: 'cc-equipped-dot', title: 'Equipped' }) : null,
        h('span', { class: 'cc-item-name', text: item.name }),
        item.quantity !== 1 ? h('span', { class: 'cc-item-qty', text: `x${item.quantity}` }) : null),
    );
  }
  return h('div', {}, sectionHeader('Inventory'), list);
}

/** Build the full character sheet element from an IR. */
export function renderCharacterSheet(ir: IRCharacter, opts: RenderOpts = {}): HTMLElement {
  const header = h('div', { class: 'cc-header' },
    ir.portrait ? h('img', { class: 'cc-portrait', src: ir.portrait, alt: ir.name }) : null,
    h('div', { class: 'cc-title' },
      h('div', { class: 'cc-name', text: ir.name || 'Unnamed' }),
      h('span', { class: 'cc-system', text: ir.systemHint })));

  return h('div', { class: 'cc-sheet', dataset: { system: ir.systemHint } },
    header,
    combatStats(ir),
    abilityGrid(ir, opts),
    skillsSection(ir, opts),
    resourcesSection(ir),
    actionsSection(ir, opts),
    attributesSection(ir),
    inventorySection(ir));
}
