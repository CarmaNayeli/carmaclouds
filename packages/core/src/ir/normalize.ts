/**
 * normalize(raw) -> IRCharacter
 *
 * Pure transform from a raw DiceCloud API response into the system-agnostic IR.
 * No D&D assumptions: every attribute is carried with its type/reset, every
 * action/spell keeps its real uses + consumed resources.
 */
import type {
  IRAction,
  IRAttribute,
  IRCharacter,
  IRClassLevel,
  IRCondition,
  IRConsumes,
  IRDamage,
  IRItem,
  IRSkill,
  RawDiceCloud,
  ResetPeriod,
} from './types';

const DND_ABILITIES = [
  'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
];

// Branch types whose damage is NOT dealt on a normal use of the action: a
// successful save (target takes half/none) and a miss. Damage gated behind these
// is skipped so an action surfaces its on-use damage, not the saved-for-half copy.
const DAMAGE_EXCLUDING_BRANCHES = new Set(['successfulSave', 'miss']);

/**
 * Best-effort system hint (never load-bearing). PF2e also uses the six abilities,
 * so we additionally require D&D-5e-specific signals: a single proficiencyBonus
 * variable and a class-based hit-dice attribute.
 */
function detectSystem(byVar: Record<string, IRAttribute>): 'dnd5e' | 'generic' {
  const hasAbilities = DND_ABILITIES.every((ab) => byVar[ab]);
  const hasProfBonus = !!byVar['proficiencyBonus'];
  const hasHitDice = Object.values(byVar).some((a) => a.type === 'hitDice');
  return hasAbilities && hasProfBonus && hasHitDice ? 'dnd5e' : 'generic';
}

/** Coerce a DiceCloud value (number, calculation object, or string) to a number. */
function numOf(v: any): number {
  if (v == null) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'object') return numOf(v.value ?? v.total ?? 0);
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** True when a DiceCloud calculation/value is actually present (not just absent). */
function has(v: any): boolean {
  return v != null && !(typeof v === 'object' && v.value == null && v.total == null);
}

/**
 * Pull display text from a DiceCloud inline field ({ text } | { value } | string).
 * Prefers the resolved `value` (inline { … } calcs already computed) over the raw
 * `text` template, then strips the markdown bold the sheets don't render.
 */
function textOf(d: any): string | undefined {
  if (!d) return undefined;
  let t: string | undefined;
  if (typeof d === 'string') t = d;
  else t = (typeof d.value === 'string' && d.value.trim()) ? d.value : (d.text || undefined);
  if (!t) return undefined;
  return t.replace(/\*\*/g, '') || undefined;
}

/**
 * Full display text for a property. DiceCloud splits text across `summary` (the
 * short/inline line the legacy sheet reads) and `description` (longer body); use
 * both, combining them when both are present and distinct.
 */
function descOf(p: any): string | undefined {
  const s = textOf(p.summary);
  const d = textOf(p.description);
  if (s && d && s !== d) return `${s}\n\n${d}`;
  return s ?? d;
}

/**
 * Tiny safe arithmetic evaluator (no eval/Function — extension CSP forbids them).
 * Supports + - * / ( ) and min/max/floor/ceil/round/abs. Returns null on any
 * leftover (e.g. an unresolved identifier), so callers can fall back.
 */
function evalArith(s: string): number | null {
  let i = 0;
  const skip = () => { while (i < s.length && /\s/.test(s[i])) i++; };
  const FNS = ['max', 'min', 'floor', 'ceil', 'round', 'abs'];
  function expr(): number {
    let v = term(); skip();
    while (s[i] === '+' || s[i] === '-') { const o = s[i++]; const r = term(); v = o === '+' ? v + r : v - r; skip(); }
    return v;
  }
  function term(): number {
    let v = factor(); skip();
    while (s[i] === '*' || s[i] === '/') { const o = s[i++]; const r = factor(); v = o === '*' ? v * r : v / r; skip(); }
    return v;
  }
  function factor(): number {
    skip();
    if (s[i] === '(') { i++; const v = expr(); skip(); if (s[i] === ')') i++; return v; }
    if (s[i] === '-') { i++; return -factor(); }
    if (s[i] === '+') { i++; return factor(); }
    const fn = /^([a-zA-Z_]\w*)\s*\(/.exec(s.slice(i));
    if (fn && FNS.includes(fn[1])) {
      i += fn[0].length;
      const args = [expr()]; skip();
      while (s[i] === ',') { i++; args.push(expr()); skip(); }
      if (s[i] === ')') i++;
      switch (fn[1]) {
        case 'max': return Math.max(...args);
        case 'min': return Math.min(...args);
        case 'floor': return Math.floor(args[0]);
        case 'ceil': return Math.ceil(args[0]);
        case 'round': return Math.round(args[0]);
        default: return Math.abs(args[0]);
      }
    }
    const num = /^\d+(\.\d+)?/.exec(s.slice(i));
    if (num) { i += num[0].length; return parseFloat(num[0]); }
    throw new Error('parse');
  }
  try {
    const v = expr(); skip();
    return i >= s.length && Number.isFinite(v) ? v : null;
  } catch { return null; }
}

/**
 * Resolve DiceCloud inline calculations `{ … }` embedded in a string (e.g.
 * "{120 * (1 + spellSniper)} feet" -> "120 feet"), substituting variable values.
 * A calc that can't be fully resolved (unknown identifier) is dropped rather than
 * shown raw, so variables like `spellSniper` never leak into the display.
 */
function resolveInline(text: string | undefined, vars: Record<string, number>): string | undefined {
  if (!text || !text.includes('{')) return text || undefined;
  const out = text.replace(/\{([^}]*)\}/g, (_m, e: string) => {
    const sub = e.replace(/[a-zA-Z_]\w*/g, (id: string) =>
      (['max', 'min', 'floor', 'ceil', 'round', 'abs'].includes(id)) ? id
        : (id in vars ? String(vars[id]) : id));
    const v = evalArith(sub);
    return v == null ? '' : String(Number.isInteger(v) ? v : +v.toFixed(2));
  });
  return out.replace(/\s{2,}/g, ' ').trim() || undefined;
}

/** A spell meta field as a resolved string ({ text,value } object or raw string). */
function metaStr(field: any, vars: Record<string, number>): string | undefined {
  const t = (field && typeof field === 'object') ? textOf(field) : (field || undefined);
  return resolveInline(t, vars);
}

/** Flatten the raw variable scope to variableName -> number for inline-calc resolution. */
function buildVars(raw: RawDiceCloud): Record<string, number> {
  const vars: Record<string, number> = {};
  const rv: any = (raw as any)?.variables ?? raw?.creatureVariables;
  if (Array.isArray(rv)) {
    for (const v of rv) if (v?.variableName) vars[v.variableName] = numOf(v.value ?? v);
  } else if (rv && typeof rv === 'object') {
    for (const [k, val] of Object.entries(rv)) vars[k] = numOf(val);
  }
  return vars;
}

function resetOf(p: any): ResetPeriod {
  return p.reset ?? null;
}

/** Whether a property has been soft-deleted (truly gone). */
function isRemoved(p: any): boolean {
  return !p || p.removed === true;
}

/**
 * Whether a property is currently active. Deactivated properties (e.g. an
 * unprepared spell, a toggled-off feature) are still imported - we carry this
 * flag so adapters can grey them out rather than dropping data.
 */
function activeOf(p: any): boolean {
  return !p.inactive && !p.deactivatedBySelf && !p.deactivatedByAncestor;
}

function normalizeAttribute(p: any): IRAttribute {
  const value = numOf(p.value);
  const total = numOf(p.total);
  const damage = numOf(p.damage);

  const attr: IRAttribute = {
    id: p._id,
    name: p.name ?? p.variableName ?? '',
    variableName: p.variableName ?? '',
    type: p.attributeType ?? 'stat',
    value,
    total,
    damage,
    reset: resetOf(p),
    active: activeOf(p),
    tags: Array.isArray(p.tags) ? p.tags : [],
    description: descOf(p),
  };

  if (p.attributeType === 'ability') {
    attr.modifier = has(p.modifier) ? numOf(p.modifier) : Math.floor((value - 10) / 2);
  }
  if (p.attributeType === 'hitDice' && p.hitDiceSize) {
    attr.hitDiceSize = String(p.hitDiceSize);
  }
  if (p.attributeType === 'spellSlot' && has(p.spellSlotLevel)) {
    attr.spellSlotLevel = numOf(p.spellSlotLevel);
  }
  return attr;
}

function normalizeSkill(p: any): IRSkill {
  return {
    id: p._id,
    name: p.name ?? p.variableName ?? '',
    variableName: p.variableName ?? '',
    skillType: p.skillType ?? 'skill',
    value: numOf(p.value),
    ability: p.ability || undefined,
    proficiency: numOf(p.proficiency),
    active: activeOf(p),
    tags: Array.isArray(p.tags) ? p.tags : [],
  };
}

function normalizeItem(p: any): IRItem {
  return {
    id: p._id,
    name: p.name ?? '',
    plural: p.plural || undefined,
    quantity: p.quantity != null ? numOf(p.quantity) : 1,
    equipped: !!p.equipped,
    weight: has(p.weight) ? numOf(p.weight) : undefined,
    value: has(p.value) ? numOf(p.value) : undefined,
    description: descOf(p),
    tags: Array.isArray(p.tags) ? p.tags : [],
  };
}

function consumesOf(p: any): IRConsumes[] {
  const consumed = p.resources?.attributesConsumed;
  if (!Array.isArray(consumed)) return [];
  return consumed.map((c: any): IRConsumes => ({
    variableName: c.variableName || undefined,
    propertyId: c._id || c.variableId || undefined,
    amount: numOf(c.quantity ?? c.amount ?? 1),
  }));
}

// Safely evaluate a pure-arithmetic expression (numbers, + - * / %, parens, and
// floor/ceil/round). Returns null if anything unresolved remains (a target ref, a
// named variable DiceCloud couldn't resolve), so the caller keeps it symbolic.
function safeArith(expr: string): number | null {
  const e = expr
    .replace(/\bfloor\b/g, 'Math.floor')
    .replace(/\bceil\b/g, 'Math.ceil')
    .replace(/\bround\b/g, 'Math.round');
  if (!e.trim()) return null;
  // Whitelist: only math after the allowed function names are removed.
  if (!/^[\d+\-*/%(). ,]*$/.test(e.replace(/Math\.(floor|ceil|round)/g, ''))) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const v = (Function(`"use strict"; return (${e});`) as () => unknown)();
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

// Split an additive expression into signed terms at the top level (parens aware),
// handling a leading unary +/-.
function splitTerms(s: string): { sign: number; term: string }[] {
  const out: { sign: number; term: string }[] = [];
  let depth = 0, cur = '', sign = 1;
  const flush = () => { if (cur.trim() !== '') out.push({ sign, term: cur.trim() }); cur = ''; };
  for (const c of s) {
    if (c === '(') depth++;
    else if (c === ')') depth--;
    if (depth === 0 && (c === '+' || c === '-')) {
      if (cur.trim() === '') { sign = c === '-' ? -1 : 1; continue; } // unary sign
      flush();
      sign = c === '-' ? -1 : 1;
      continue;
    }
    cur += c;
  }
  flush();
  return out;
}

// Strip a pair of parentheses that wrap the whole string.
function unwrap(t: string): string {
  if (t[0] !== '(' || t[t.length - 1] !== ')') return t;
  let depth = 0;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '(') depth++;
    else if (t[i] === ')') { depth--; if (depth === 0) return i === t.length - 1 ? t.slice(1, -1).trim() : t; }
  }
  return t;
}

/**
 * Turn DiceCloud's partly-resolved calculation `value` into a clean rollable dice
 * expression. DiceCloud already substitutes character variables (e.g.
 * "2d10 + cleric.level" -> "2d10 + 10", "(slotLevel)d8 + #spellList.abilityMod"
 * -> "(slotLevel)d8 + 4", "(floor((level+1)/6)+1)d6" -> "2d6"). What's left is
 * `slotLevel` (only known when a spell is cast — we use the spell's base level for
 * a base-level roll) and the arithmetic around the dice counts, which we evaluate
 * and reformat to "NdM + K". Anything still unresolved (e.g. ~target.* refs) is
 * left in place rather than dropped.
 */
export function resolveDamageFormula(value: string, slotLevel: number): string {
  if (!value) return '';
  const s = value.replace(/\bslot[lL]evel\b/gi, String(slotLevel || 0));

  const dice: string[] = [];
  let flat = 0;
  const symbolic: string[] = [];

  for (const { sign, term } of splitTerms(s)) {
    const t = unwrap(term);
    const die = t.match(/^(.*?)d(\d+)$/i);
    if (die) {
      const coef = die[1].trim();
      const n = coef === '' ? 1 : safeArith(coef);
      if (n != null) {
        const count = Math.max(0, Math.trunc(Math.abs(n)));
        if (count > 0) dice.push(`${sign < 0 ? '-' : ''}${count}d${die[2]}`);
        continue;
      }
    }
    const num = safeArith(t);
    if (num != null) { flat += sign * num; continue; }
    symbolic.push(`${sign < 0 ? '- ' : '+ '}${term}`);
  }

  let out = dice.join(' + ');
  if (flat) out += `${out ? (flat > 0 ? ' + ' : ' - ') : (flat < 0 ? '-' : '')}${Math.abs(flat)}`;
  for (const sym of symbolic) out += `${out ? ' ' : ''}${sym}`;
  return out.replace(/^\+\s*/, '').trim() || s;
}

function normalizeAction(
  p: any,
  damageByOwner: Record<string, any[]>,
  attackByParent: Record<string, any[]>,
  vars: Record<string, number>,
): IRAction {
  const kind: IRAction['kind'] =
    p.type === 'spell' ? 'spell' : p.type === 'feature' ? 'feature' : 'action';

  // Prefer DiceCloud's resolved `value` (character vars already substituted) over
  // the raw `calculation`, then finish the resolution (slot level + arithmetic).
  const spellLevel = p.type === 'spell' ? numOf(p.level) : 0;
  const damage = (damageByOwner[p._id] ?? [])
    .map((d): IRDamage => {
      const raw = String(d.amount?.value ?? d.amount?.calculation ?? '');
      const out: IRDamage = { formula: resolveDamageFormula(raw, spellLevel), type: d.damageType || undefined };
      // Keep the slot-parameterized form so consumers can re-resolve for upcasting.
      if (p.type === 'spell' && spellLevel > 0 && /\bslot[lL]evel\b/i.test(raw)) out.scaling = raw;
      return out;
    })
    .filter((d) => d.formula);

  const action: IRAction = {
    id: p._id,
    name: p.name ?? '',
    kind,
    actionType: p.actionType || undefined,
    active: activeOf(p),
    consumes: consumesOf(p),
    damage,
    tags: Array.isArray(p.tags) ? p.tags : [],
    description: descOf(p),
  };

  const max = numOf(p.uses);
  if (has(p.uses) && max > 0) {
    const current = has(p.usesLeft) ? numOf(p.usesLeft) : Math.max(0, max - numOf(p.usesUsed));
    action.uses = { current, max, reset: resetOf(p) };
  }

  // Attack roll: on the action itself (type 'action'), or on a child `attack`
  // property (common for weapons), or — for a type 'attack' property — its `roll`.
  if (has(p.attackRoll)) {
    action.attack = { bonus: numOf(p.attackRoll) };
  } else if (p.type === 'attack' && has(p.roll)) {
    action.attack = { bonus: numOf(p.roll) };
  } else {
    const atk = attackByParent[p._id]?.[0];
    if (atk && (has(atk.attackRoll) || has(atk.roll))) {
      action.attack = { bonus: numOf(atk.attackRoll ?? atk.roll) };
    }
  }

  if (kind === 'spell') {
    action.spell = {
      level: numOf(p.level),
      school: p.school || undefined,
      castingTime: metaStr(p.castingTime, vars),
      range: metaStr(p.range, vars),
      duration: metaStr(p.duration, vars),
      components: p.components || undefined,
      concentration: p.components?.concentration ?? undefined,
      ritual: p.components?.ritual ?? undefined,
    };
  }

  return action;
}

/** Whether a property should appear in `actions` (things that do something). */
function isActionLike(p: any): boolean {
  if (p.type === 'action' || p.type === 'spell') return true;
  // Include only features that have a limited-use pool (e.g. Channel Divinity).
  if (p.type === 'feature') return has(p.uses) && numOf(p.uses) > 0;
  return false;
}

export function normalize(raw: RawDiceCloud): IRCharacter {
  // Accept both the REST API shape ({ creatures[], creatureProperties[] }) and the
  // extension's internal shape ({ creature, properties[] }).
  const creature = raw?.creatures?.[0] ?? raw?.creature ?? {};
  const allProps = raw?.creatureProperties ?? raw?.properties ?? [];
  const props = allProps.filter((p) => !isRemoved(p));

  const attributes = props
    .filter((p) => p.type === 'attribute')
    .map(normalizeAttribute);

  const skills = props
    .filter((p) => p.type === 'skill')
    .map(normalizeSkill);

  // Attack-roll props sit directly under their owning action/item (parent.id).
  const attackByParent: Record<string, any[]> = {};
  for (const p of props) {
    const pid = p.parent?.id;
    if (pid && p.type === 'attack') (attackByParent[pid] ??= []).push(p);
  }

  // Damage props, however, are frequently nested under a `branch` (hit / failedSave
  // / successfulSave) rather than being a direct child — so a direct-parent lookup
  // misses most weapon and save-spell damage. Walk each damage prop up to its
  // nearest owning action/spell/feature/item and attach it there, skipping damage
  // gated behind a successful-save or miss branch (the "no/half damage" copy).
  const propById: Record<string, any> = {};
  for (const p of props) propById[p._id] = p;
  const isDamageOwner = (p: any): boolean =>
    !!p && (p.actionType === 'attack' || p.type === 'action' || p.type === 'spell' ||
            p.type === 'feature' || p.type === 'item');
  const damageByOwner: Record<string, any[]> = {};
  for (const p of props) {
    if (p.type !== 'damage') continue;
    const anc = p.ancestors ?? [];
    let excluded = false;
    let ownerId: string | undefined;
    for (let i = anc.length - 1; i >= 0; i--) {  // nearest-first up the chain
      const node = propById[anc[i].id];
      if (!node) continue;
      if (node.type === 'branch' && DAMAGE_EXCLUDING_BRANCHES.has(node.branchType)) excluded = true;
      if (isDamageOwner(node)) { ownerId = node._id; break; }
    }
    if (!ownerId && p.parent?.id) ownerId = p.parent.id;  // fall back to direct parent
    if (ownerId && !excluded) (damageByOwner[ownerId] ??= []).push(p);
  }

  const vars = buildVars(raw);
  const actions = props.filter(isActionLike).map((p) => normalizeAction(p, damageByOwner, attackByParent, vars));

  // Equipped weapons: DiceCloud models a weapon's attack/damage as child
  // properties of the item, so they don't appear as actions on their own. Surface
  // each equipped weapon that has an attack or damage as a rollable attack action
  // (deduped against any action that already represents it by name).
  const haveAction = new Set(actions.filter((a) => a.active).map((a) => a.name.toLowerCase()));
  const weaponActions = props
    .filter((p) => p.type === 'item' && p.equipped &&
      ((attackByParent[p._id]?.length ?? 0) > 0 || (damageByOwner[p._id]?.length ?? 0) > 0))
    .filter((p) => !haveAction.has((p.name ?? '').toLowerCase()))
    .map((p) => normalizeAction({ ...p, type: 'action' }, damageByOwner, attackByParent, vars));
  actions.push(...weaponActions);

  const inventory = props
    .filter((p) => p.type === 'item')
    .map(normalizeItem);

  // Buffs + toggles: the character's activatable conditions/effects.
  const conditions: IRCondition[] = props
    .filter((p) => p.type === 'buff' || p.type === 'toggle')
    .map((p): IRCondition => ({
      id: p._id,
      name: p.name ?? '',
      kind: p.type,
      active: activeOf(p),
      description: descOf(p),
    }))
    .filter((c) => c.name);

  // Class/level lines (DiceCloud `class` properties).
  const classes: IRClassLevel[] = props
    .filter((p) => p.type === 'class')
    .map((p): IRClassLevel => ({ name: p.name ?? '', level: numOf(p.level) }))
    .filter((c) => c.name);

  const byVar: Record<string, IRAttribute> = {};
  for (const a of attributes) {
    if (a.variableName) byVar[a.variableName] = a;
  }

  return {
    id: creature._id ?? '',
    name: creature.name ?? '',
    portrait: creature.picture || creature.avatarPicture || undefined,
    systemHint: detectSystem(byVar),
    attributes,
    skills,
    actions,
    inventory,
    conditions,
    classes,
    byVar,
  };
}
