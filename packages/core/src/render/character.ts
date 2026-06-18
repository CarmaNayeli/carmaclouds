/**
 * System-agnostic character renderer. Builds a sheet DOM from an IRCharacter
 * using the `h()` builder (never innerHTML). Adapters mount the returned element
 * and supply roll/use callbacks.
 *
 * D&D characters get the familiar ability grid (derived view); every character -
 * D&D or not - also gets generic Resources / Attributes / Actions sections, which
 * is where custom stats and charge-with-reset abilities finally show up.
 */
import type { IRAction, IRAttribute, IRCharacter, IRSpellMeta } from '../ir/types';
import { deriveDnd, DND_ABILITIES } from '../ir/views/dnd5e';
import { h } from './h';

export interface RenderOpts {
  /** A modifier-based roll (ability/save/skill/attack) — e.g. ("STR check", +3). */
  onRoll?: (label: string, modifier: number) => void;
  /** A dice-formula roll (damage/healing) — e.g. ("Fireball damage", "8d6"). */
  onRollFormula?: (label: string, formula: string) => void;
  /** "Use"/"Cast" without rolling. */
  onUse?: (action: IRAction) => void;
}

/** One thing the user can DO with an action: cast/use, an attack, or a damage roll. */
interface ActionChoice {
  label: string;
  kind: 'use' | 'attack' | 'damage';
  run: () => void;
}

/** Collect the do-able choices for an action, given the wired callbacks. */
function actionChoices(action: IRAction, opts: RenderOpts): ActionChoice[] {
  const choices: ActionChoice[] = [];
  const isSpell = action.kind === 'spell';
  const hasRolls = !!action.attack || action.damage.length > 0;

  // Cast/Use (no roll): for spells always; for features/actions only when there's
  // nothing to roll (a pure attack/damage weapon doesn't get a bare "Use").
  if (opts.onUse && (isSpell || !hasRolls)) {
    choices.push({ label: isSpell ? 'Cast' : 'Use', kind: 'use', run: () => opts.onUse!(action) });
  }
  if (action.attack && opts.onRoll) {
    const bonus = action.attack.bonus;
    choices.push({
      label: `${isSpell ? 'Spell ' : ''}Attack ${signed(bonus)}`,
      kind: 'attack',
      run: () => opts.onRoll!(`${action.name} attack`, bonus),
    });
  }
  if (opts.onRollFormula) {
    for (const d of action.damage) {
      choices.push({
        label: d.type ? `${d.formula} ${d.type}` : d.formula,
        kind: 'damage',
        run: () => opts.onRollFormula!(`${action.name} damage`, d.formula),
      });
    }
  }
  return choices;
}

/** Modal offering each do-able choice (mirrors the legacy attack/damage popup). */
function openActionModal(action: IRAction, choices: ActionChoice[]): void {
  const close = () => overlay.remove();
  const btn = (c: ActionChoice) =>
    h('button', {
      class: `cc-modal-choice cc-modal-${c.kind}`,
      text: c.label,
      onClick: () => { c.run(); close(); },
    });
  const dialog = h('div', { class: 'cc-modal' },
    h('div', { class: 'cc-modal-title', text: action.name }),
    action.kind === 'spell' && action.spell
      ? h('div', { class: 'cc-modal-sub', text: action.spell.level === 0 ? 'Cantrip' : `Level ${action.spell.level} spell` })
      : null,
    h('div', { class: 'cc-modal-choices' }, ...choices.map(btn)),
    h('button', { class: 'cc-modal-cancel', text: 'Cancel', onClick: close }));
  const overlay = h('div', { class: 'cc-modal-overlay', onClick: (e: Event) => { if (e.target === overlay) close(); } }, dialog);
  document.body.appendChild(overlay);
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
  // Best-effort spellcasting summary (shown only when the sheet defines them).
  const spellDC = pick('spellSaveDC', 'spellSaveDc', 'spellDifficultyClass', 'spellDc');
  if (spellDC && spellDC.value) items.push(['Spell DC', String(spellDC.value)]);
  const spellAtk = pick('spellAttack', 'spellAttackBonus', 'spellAttackMod', 'spellAttackRoll');
  if (spellAtk && spellAtk.value) items.push(['Spell Atk', signed(spellAtk.value)]);

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

  // Order: hit dice, then spell slots ascending by level, then other resources.
  const rank = (a: IRAttribute) => (a.type === 'hitDice' ? 0 : a.type === 'spellSlot' ? 1 : 2);
  resources.sort((a, b) =>
    rank(a) - rank(b)
    || (a.spellSlotLevel ?? 0) - (b.spellSlotLevel ?? 0)
    || a.name.localeCompare(b.name));

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

/** V/S/M from a spell components map. */
function componentsStr(c?: Record<string, boolean>): string {
  if (!c) return '';
  return [c.verbal && 'V', c.somatic && 'S', c.material && 'M'].filter(Boolean).join(', ');
}

/** Labelled detail rows for a spell (whatever the sheet provides). */
function spellDetailRows(s: IRSpellMeta): [string, string][] {
  const rows: [string, string][] = [];
  if (s.castingTime) rows.push(['Casting Time', s.castingTime]);
  if (s.range) rows.push(['Range', s.range]);
  if (s.duration) rows.push(['Duration', s.duration]);
  if (s.school) rows.push(['School', s.school]);
  const comp = componentsStr(s.components);
  if (comp) rows.push(['Components', comp]);
  return rows;
}

const TIMING_LABEL: Record<string, string> = {
  action: 'Action', bonus: 'Bonus Action', reaction: 'Reaction', free: 'Free', long: 'Long Action',
};

/**
 * Detail rows for any action/spell, always non-empty so every entry gets a
 * consistent "Details" button. Spells show their casting block; other actions
 * show timing + consumed resources.
 */
function detailRows(action: IRAction): [string, string][] {
  if (action.kind === 'spell' && action.spell) {
    const rows = spellDetailRows(action.spell);
    if (rows.length === 0) {
      rows.push(['Level', action.spell.level === 0 ? 'Cantrip' : String(action.spell.level)]);
    }
    return rows;
  }
  const t = action.actionType;
  const rows: [string, string][] = [['Type', (t && (TIMING_LABEL[t] ?? t)) || 'Action']];
  if (action.consumes.length) {
    rows.push(['Consumes', action.consumes
      .map((c) => `${c.amount}${c.variableName ? ' ' + c.variableName : ''}`).join(', ')]);
  }
  return rows;
}

/** Build one action/spell element: name + meta + do/details buttons + description. */
function actionEl(action: IRAction, opts: RenderOpts): HTMLElement {
  const meta: HTMLElement[] = [];
  if (action.kind === 'spell' && action.spell) {
    const s = action.spell;
    meta.push(h('span', { class: 'cc-action-tag', text: s.level === 0 ? 'Cantrip' : `L${s.level}` }));
    if (s.school) meta.push(h('span', { class: 'cc-action-meta', text: s.school }));
    if (s.range) meta.push(h('span', { class: 'cc-action-meta', text: s.range }));
    if (s.concentration) meta.push(h('span', { class: 'cc-action-flag', title: 'Concentration', text: 'C' }));
    if (s.ritual) meta.push(h('span', { class: 'cc-action-flag', title: 'Ritual', text: 'R' }));
  }
  const usesEl = action.uses
    ? h('span', { class: 'cc-action-uses' }, poolPill(action.uses.current, action.uses.max), resetBadge(action.uses.reset))
    : null;

  // "Details" panel — always present (uniform across actions and spells): a detail
  // block (spell casting info, or timing/consumes) plus any free-text description.
  // h() uses textContent, so description markup renders as text.
  const desc = (action.description || '').trim();
  const rows = detailRows(action);
  const detailEls: (HTMLElement | null)[] = [
    h('div', { class: 'cc-detail-grid' },
      ...rows.map(([k, v]) => h('div', { class: 'cc-detail-row' },
        h('span', { class: 'cc-detail-key', text: k }),
        h('span', { class: 'cc-detail-val', text: v })))),
  ];
  if (desc) detailEls.push(h('div', { class: 'cc-detail-desc', text: desc }));

  const descPanel = h('div', { class: 'cc-action-desc', style: 'display:none;' }, ...detailEls);
  const detailsBtn = h('button', {
    class: 'cc-btn cc-btn-details', text: 'Details',
    onClick: () => {
      const open = descPanel.style.display === 'none';
      descPanel.style.display = open ? 'block' : 'none';
      detailsBtn.textContent = open ? 'Hide' : 'Details';
    },
  });

  // "Do the thing": one button if there's a single choice, else a modal opener.
  const choices = actionChoices(action, opts);
  let doBtn: HTMLElement | null = null;
  if (choices.length === 1) {
    const c = choices[0];
    doBtn = h('button', { class: `cc-btn cc-btn-${c.kind}`, text: c.label, onClick: c.run });
  } else if (choices.length > 1) {
    const label = action.kind === 'spell' ? 'Cast' : (action.attack || action.damage.length ? 'Roll' : 'Use');
    doBtn = h('button', { class: 'cc-btn cc-btn-do', text: label, onClick: () => openActionModal(action, choices) });
  }

  const row = h('div', { class: 'cc-action-row' },
    h('span', { class: 'cc-action-name', text: action.name }),
    ...meta,
    usesEl,
    h('div', { class: 'cc-action-controls' }, doBtn, detailsBtn));

  return h('div', {
      class: `cc-action cc-action-${action.kind}` + (action.active ? '' : ' cc-inactive'),
      dataset: { name: action.name.toLowerCase(), timing: action.actionType || '' },
    },
    row,
    descPanel);
}

/**
 * Search box + optional filter-chip groups that show/hide rows in `body`. Rows
 * carry data-* attributes; a chip matches when row.dataset[key] === val (the
 * "All" chip clears the group). Pure DOM, no framework.
 */
function filterControls(
  body: HTMLElement,
  placeholder: string,
  groups: { key: string; chips: { label: string; val: string }[] }[] = [],
): HTMLElement {
  const search = h('input', { class: 'cc-search', type: 'text', placeholder }) as HTMLInputElement;
  const active: Record<string, string> = {};
  const rows = () => Array.from(body.querySelectorAll<HTMLElement>('.cc-action, .cc-item'));

  const apply = () => {
    const q = search.value.trim().toLowerCase();
    for (const row of rows()) {
      const nameHit = !q || (row.dataset.name || '').includes(q);
      const chipHit = groups.every((g) => !active[g.key] || row.dataset[g.key] === active[g.key]);
      row.style.display = nameHit && chipHit ? '' : 'none';
    }
    // Hide spell-level subgroups that have no visible rows.
    for (const grp of Array.from(body.querySelectorAll<HTMLElement>('.cc-spell-group'))) {
      const any = Array.from(grp.querySelectorAll<HTMLElement>('.cc-action')).some((r) => r.style.display !== 'none');
      grp.style.display = any ? '' : 'none';
    }
  };
  search.addEventListener('input', apply);

  const chipRows = groups.map((g) => {
    const chipEls: HTMLElement[] = [];
    const allChip = h('button', { class: 'cc-chip cc-chip-active', text: 'All' });
    const setActive = (el: HTMLElement, val: string) => {
      active[g.key] = val;
      for (const c of chipEls) c.classList.toggle('cc-chip-active', c === el);
      apply();
    };
    allChip.addEventListener('click', () => setActive(allChip, ''));
    chipEls.push(allChip);
    for (const c of g.chips) {
      const el = h('button', { class: 'cc-chip', text: c.label });
      el.addEventListener('click', () => setActive(el, c.val));
      chipEls.push(el);
    }
    return h('div', { class: 'cc-chip-row' }, ...chipEls);
  });

  return h('div', { class: 'cc-controls' }, search, ...chipRows);
}

/** Actions & features (non-spell). Inactive entries (DiceCloud internal sub-effects
 *  like "End Effect -", conditional branches, toggled-off variants) are hidden. */
function actionsSection(ir: IRCharacter, opts: RenderOpts): HTMLElement | null {
  const acts = ir.actions.filter((a) => a.kind !== 'spell' && a.active);
  if (acts.length === 0) return null;
  const list = h('div', { class: 'cc-action-list' }, ...acts.map((a) => actionEl(a, opts)));
  const controls = filterControls(list, 'Search actions...', [
    { key: 'timing', chips: [
      { label: 'Action', val: 'action' },
      { label: 'Bonus', val: 'bonus' },
      { label: 'Reaction', val: 'reaction' },
      { label: 'Free', val: 'free' },
    ] },
  ]);
  return h('div', {}, sectionHeader('Actions'), controls, list);
}

/** Spells, grouped by level (Cantrips, Level 1, …) like the legacy sheet. */
function spellsSection(ir: IRCharacter, opts: RenderOpts): HTMLElement | null {
  const spells = ir.actions.filter((a) => a.kind === 'spell' && a.active);
  if (spells.length === 0) return null;

  const byLevel = new Map<number, IRAction[]>();
  for (const s of spells) {
    const lvl = s.spell?.level ?? 0;
    if (!byLevel.has(lvl)) byLevel.set(lvl, []);
    byLevel.get(lvl)!.push(s);
  }

  const groups: HTMLElement[] = [];
  for (const lvl of [...byLevel.keys()].sort((a, b) => a - b)) {
    const label = lvl === 0 ? 'Cantrips' : `Level ${lvl}`;
    const inLevel = byLevel.get(lvl)!.slice().sort((a, b) => a.name.localeCompare(b.name));
    groups.push(
      h('div', { class: 'cc-spell-group' },
        h('div', { class: 'cc-spell-group-label', text: label }),
        h('div', { class: 'cc-action-list' }, ...inLevel.map((s) => actionEl(s, opts)))),
    );
  }
  // Already grouped by level, so just a name search (it also hides empty groups).
  const wrap = h('div', { class: 'cc-spell-groups' }, ...groups);
  const controls = filterControls(wrap, 'Search spells...');
  return h('div', {}, sectionHeader('Spells'), controls, wrap);
}

/**
 * Active effects: only currently-active `buff`s (applied effects like Bless,
 * Spirit Guardians, Rage). DiceCloud `toggle` properties are deliberately NOT
 * shown — they're overwhelmingly internal config (spell-level gates, "load X
 * spells", proficiency switches) rather than player-facing conditions, so
 * surfacing them produced a wall of noise. Matches the legacy sheet's compact
 * "active effects" area.
 */
function conditionsSection(ir: IRCharacter): HTMLElement | null {
  const active = (ir.conditions || []).filter((c) => c.active && c.kind === 'buff');
  if (active.length === 0) return null;

  const list = h('div', { class: 'cc-condition-list' });
  for (const c of active) {
    list.appendChild(
      h('div', { class: 'cc-condition', title: c.description || undefined },
        h('span', { class: 'cc-condition-dot cc-on' }),
        h('span', { class: 'cc-condition-name', text: c.name })),
    );
  }
  return h('div', {}, sectionHeader('Active Effects'), list);
}

/** Inventory list with quantity + equipped marker. */
function inventorySection(ir: IRCharacter): HTMLElement | null {
  if (ir.inventory.length === 0) return null;
  const list = h('div', { class: 'cc-item-list' });
  for (const item of ir.inventory) {
    list.appendChild(
      h('div', {
          class: 'cc-item' + (item.equipped ? ' cc-equipped' : ''),
          dataset: { name: item.name.toLowerCase(), equip: item.equipped ? 'equipped' : '' },
        },
        item.equipped ? h('span', { class: 'cc-equipped-dot', title: 'Equipped' }) : null,
        h('span', { class: 'cc-item-name', text: item.name }),
        item.quantity !== 1 ? h('span', { class: 'cc-item-qty', text: `x${item.quantity}` }) : null),
    );
  }
  const controls = filterControls(list, 'Search inventory...', [
    { key: 'equip', chips: [{ label: 'Equipped', val: 'equipped' }] },
  ]);
  return h('div', {}, sectionHeader('Inventory'), controls, list);
}

/** Build the full character sheet element from an IR. */
export function renderCharacterSheet(ir: IRCharacter, opts: RenderOpts = {}): HTMLElement {
  // Class/level subtitle, e.g. "Cleric 6 / Wizard 2" (empty for classless systems).
  const classLine = (ir.classes || [])
    .map((c) => (c.level ? `${c.name} ${c.level}` : c.name))
    .join(' / ');

  const header = h('div', { class: 'cc-header' },
    ir.portrait ? h('img', { class: 'cc-portrait', src: ir.portrait, alt: ir.name }) : null,
    h('div', { class: 'cc-title' },
      h('div', { class: 'cc-name', text: ir.name || 'Unnamed' }),
      classLine ? h('div', { class: 'cc-classes', text: classLine }) : null,
      h('span', { class: 'cc-system', text: ir.systemHint })));

  // Order for play: identity, combat stats, the rollable ability/skill blocks,
  // then current effects + resources, then the action lists, then inventory.
  return h('div', { class: 'cc-sheet', dataset: { system: ir.systemHint } },
    header,
    combatStats(ir),
    abilityGrid(ir, opts),
    skillsSection(ir, opts),
    conditionsSection(ir),
    resourcesSection(ir),
    attributesSection(ir),
    actionsSection(ir, opts),
    spellsSection(ir, opts),
    inventorySection(ir));
}
