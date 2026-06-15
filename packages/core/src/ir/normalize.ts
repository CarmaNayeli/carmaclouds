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

/** Pull display text out of a DiceCloud description ({ text } | { value } | string). */
function textOf(d: any): string | undefined {
  if (!d) return undefined;
  if (typeof d === 'string') return d || undefined;
  return d.text ?? d.value ?? undefined;
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
    description: textOf(p.description),
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
    description: textOf(p.description),
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

function normalizeAction(p: any, damageByParent: Record<string, any[]>): IRAction {
  const kind: IRAction['kind'] =
    p.type === 'spell' ? 'spell' : p.type === 'feature' ? 'feature' : 'action';

  const damage = (damageByParent[p._id] ?? [])
    .map((d): IRDamage => ({
      formula: d.amount?.calculation ?? String(d.amount?.value ?? ''),
      type: d.damageType || undefined,
    }))
    .filter((d) => d.formula);

  const action: IRAction = {
    id: p._id,
    name: p.name ?? '',
    kind,
    active: activeOf(p),
    consumes: consumesOf(p),
    damage,
    tags: Array.isArray(p.tags) ? p.tags : [],
    description: textOf(p.description),
  };

  const max = numOf(p.uses);
  if (has(p.uses) && max > 0) {
    const current = has(p.usesLeft) ? numOf(p.usesLeft) : Math.max(0, max - numOf(p.usesUsed));
    action.uses = { current, max, reset: resetOf(p) };
  }

  if (has(p.attackRoll)) {
    action.attack = { bonus: numOf(p.attackRoll) };
  }

  if (kind === 'spell') {
    action.spell = {
      level: numOf(p.level),
      school: p.school || undefined,
      castingTime: p.castingTime || undefined,
      range: p.range || undefined,
      duration: p.duration || undefined,
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

  // Damage is stored as child `damage` properties pointing at their action/spell.
  const damageByParent: Record<string, any[]> = {};
  for (const p of props) {
    if (p.type === 'damage' && p.parent?.id) {
      (damageByParent[p.parent.id] ??= []).push(p);
    }
  }

  const actions = props.filter(isActionLike).map((p) => normalizeAction(p, damageByParent));

  const inventory = props
    .filter((p) => p.type === 'item')
    .map(normalizeItem);

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
    byVar,
  };
}
