/**
 * normalizeDndBeyond(raw) -> IRCharacter
 *
 * The D&D Beyond sibling of normalize() (which handles DiceCloud). Maps a D&D
 * Beyond character (the public character-service v5 JSON) into the same
 * system-agnostic IR, so a DDB character renders through renderCharacterSheet -
 * with castable actions/spells, real damage formulas, and the derived D&D view -
 * exactly like a synced DiceCloud character. "Beyond20-style" read.
 *
 * DDB stores BASE ability scores plus a pile of modifiers (race/class/feat/item)
 * that must be summed to get real numbers, and it computes AC/HP rather than
 * storing them - so this is best-effort: reliable for identity, abilities, saves,
 * skills, HP, slots, and spells/actions, and a reasonable guess for AC and weapon
 * attacks. Defensive throughout: a missing field just doesn't populate.
 */
import type {
  IRAction,
  IRAttribute,
  IRCharacter,
  IRClassLevel,
  IRDamage,
  IRItem,
  IRSkill,
} from './types';

// ─── D&D math (inlined so core/ir stays dependency-free) ─────────────────────

const abilityModifier = (score: number): number => Math.floor((Number(score) - 10) / 2);
const proficiencyBonus = (level: number): number => Math.ceil(Math.max(1, Math.min(20, Number(level) || 1)) / 4) + 1;

type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
const STAT_ID_TO_ABILITY: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const ABILITY_FULL: Record<AbilityKey, string> = {
  str: 'strength', dex: 'dexterity', con: 'constitution',
  int: 'intelligence', wis: 'wisdom', cha: 'charisma',
};

const SKILLS: { name: string; ability: AbilityKey }[] = [
  { name: 'Acrobatics', ability: 'dex' }, { name: 'Animal Handling', ability: 'wis' },
  { name: 'Arcana', ability: 'int' }, { name: 'Athletics', ability: 'str' },
  { name: 'Deception', ability: 'cha' }, { name: 'History', ability: 'int' },
  { name: 'Insight', ability: 'wis' }, { name: 'Intimidation', ability: 'cha' },
  { name: 'Investigation', ability: 'int' }, { name: 'Medicine', ability: 'wis' },
  { name: 'Nature', ability: 'int' }, { name: 'Perception', ability: 'wis' },
  { name: 'Performance', ability: 'cha' }, { name: 'Persuasion', ability: 'cha' },
  { name: 'Religion', ability: 'int' }, { name: 'Sleight of Hand', ability: 'dex' },
  { name: 'Stealth', ability: 'dex' }, { name: 'Survival', ability: 'wis' },
];

const SKILL_SLUG_TO_NAME: Record<string, string> = {
  'acrobatics': 'Acrobatics', 'animal-handling': 'Animal Handling', 'arcana': 'Arcana',
  'athletics': 'Athletics', 'deception': 'Deception', 'history': 'History',
  'insight': 'Insight', 'intimidation': 'Intimidation', 'investigation': 'Investigation',
  'medicine': 'Medicine', 'nature': 'Nature', 'perception': 'Perception',
  'performance': 'Performance', 'persuasion': 'Persuasion', 'religion': 'Religion',
  'sleight-of-hand': 'Sleight of Hand', 'stealth': 'Stealth', 'survival': 'Survival',
};
const NAME_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(SKILL_SLUG_TO_NAME).map(([slug, name]) => [name, slug]),
);

const camel = (slug: string) => slug.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

// ─── Spell slots (full = the multiclass spellcaster table) ───────────────────

const FULL = [
  [2,0,0,0,0,0,0,0,0],[3,0,0,0,0,0,0,0,0],[4,2,0,0,0,0,0,0,0],[4,3,0,0,0,0,0,0,0],
  [4,3,2,0,0,0,0,0,0],[4,3,3,0,0,0,0,0,0],[4,3,3,1,0,0,0,0,0],[4,3,3,2,0,0,0,0,0],
  [4,3,3,3,1,0,0,0,0],[4,3,3,3,2,0,0,0,0],[4,3,3,3,2,1,0,0,0],[4,3,3,3,2,1,0,0,0],
  [4,3,3,3,2,1,1,0,0],[4,3,3,3,2,1,1,0,0],[4,3,3,3,2,1,1,1,0],[4,3,3,3,2,1,1,1,0],
  [4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1],
];
const HALF = [
  [0,0,0,0,0],[2,0,0,0,0],[3,0,0,0,0],[3,0,0,0,0],[4,2,0,0,0],[4,2,0,0,0],[4,3,0,0,0],[4,3,0,0,0],
  [4,3,2,0,0],[4,3,2,0,0],[4,3,3,0,0],[4,3,3,0,0],[4,3,3,1,0],[4,3,3,1,0],[4,3,3,2,0],[4,3,3,2,0],
  [4,3,3,3,1],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2],
];
const WARLOCK: [number, number][] = [
  [1,1],[2,1],[2,2],[2,2],[2,3],[2,3],[2,4],[2,4],[2,5],[2,5],
  [3,5],[3,5],[3,5],[3,5],[3,5],[3,5],[4,5],[4,5],[4,5],[4,5],
];
const FULL_CASTERS = new Set(['bard', 'cleric', 'druid', 'sorcerer', 'wizard']);
const HALF_CASTERS = new Set(['paladin', 'ranger']);

/** Slot totals keyed by spell level for a caster class label at a given level. */
function spellSlotsFor(classLabel: string, level: number): Record<number, number> {
  const cls = classLabel.trim().toLowerCase();
  const base = cls.split(/[\s(/]+/)[0];
  const lvl = Math.max(1, Math.min(20, level));
  const rowOut = (row: number[]): Record<number, number> => {
    const out: Record<number, number> = {};
    row.forEach((total, i) => { if (total > 0) out[i + 1] = total; });
    return out;
  };
  const fromFull = (casterLevel: number) => rowOut(FULL[Math.max(1, Math.min(20, casterLevel)) - 1]);

  if (cls.includes('warlock')) {
    const [slots, slotLevel] = WARLOCK[lvl - 1];
    return slots > 0 ? { [slotLevel]: slots } : {};
  }
  if (cls.includes('arcane trickster') || cls.includes('eldritch knight')) return fromFull(Math.ceil(lvl / 3));
  if (base === 'artificer' || cls.includes('artificer')) return fromFull(Math.ceil(lvl / 2));

  const table = (FULL_CASTERS.has(cls) || FULL_CASTERS.has(base)) ? FULL
    : (HALF_CASTERS.has(cls) || HALF_CASTERS.has(base)) ? HALF
    : null;
  return table ? rowOut(table[lvl - 1]) : {};
}

// ─── DDB schema (only the parts we read) ─────────────────────────────────────

type DbStat = { id?: number; value?: number | null };
type DbModifier = {
  type?: string; subType?: string; value?: number | null;
  friendlySubtypeName?: string; statId?: number | null;
  die?: { diceCount?: number | null; diceValue?: number | null; fixedValue?: number | null } | null;
};
type DbItemDef = {
  name?: string; filterType?: string; armorClass?: number; armorTypeId?: number;
  damage?: { diceString?: string } | null; damageType?: string;
  attackType?: number | null; properties?: { name?: string }[];
  grantedModifiers?: DbModifier[];
};
type DbItem = { equipped?: boolean; quantity?: number; definition?: DbItemDef };
type DbClass = {
  level?: number;
  definition?: { name?: string; spellCastingAbilityId?: number | null; canCastSpells?: boolean; hitDice?: number | null };
  subclassDefinition?: { name?: string } | null;
};
type DbSpell = {
  definition?: {
    name?: string; level?: number; school?: string;
    requiresSavingThrow?: boolean; requiresAttackRoll?: boolean;
    concentration?: boolean; ritual?: boolean;
    range?: { origin?: string | null; rangeValue?: number | null };
    modifiers?: DbModifier[]; description?: string;
  };
  prepared?: boolean;
};
type DbAction = {
  name?: string; description?: string | null; snippet?: string | null;
  limitedUse?: { maxUses?: number | null; resetType?: string | null; numberUsed?: number | null } | null;
};
type DbCharacter = {
  id?: number | string;
  name?: string;
  avatarUrl?: string | null;
  decorations?: { avatarUrl?: string | null };
  stats?: DbStat[]; bonusStats?: DbStat[]; overrideStats?: DbStat[];
  race?: { fullName?: string; baseName?: string; weightSpeeds?: { normal?: { walk?: number } } };
  classes?: DbClass[];
  baseHitPoints?: number; bonusHitPoints?: number | null; overrideHitPoints?: number | null;
  removedHitPoints?: number; temporaryHitPoints?: number;
  inventory?: DbItem[];
  modifiers?: Record<string, DbModifier[]>;
  classSpells?: { spells?: DbSpell[] }[];
  spells?: Record<string, DbSpell[]>;
  actions?: Record<string, DbAction[]>;
};

// Number(null)/Number('') are 0, but DDB uses null for "no value" (e.g. the
// null-filled overrideStats array), so treat those as absent.
const num = (x: unknown): number | undefined => {
  if (x == null || x === '') return undefined;
  const v = Number(x);
  return Number.isFinite(v) ? v : undefined;
};

const allModifiers = (c: DbCharacter): DbModifier[] => {
  const m = c.modifiers;
  if (!m || typeof m !== 'object') return [];
  return Object.values(m).flat().filter((x): x is DbModifier => !!x && typeof x === 'object');
};

function abilityScores(c: DbCharacter, mods: DbModifier[]): Record<AbilityKey, number> {
  const baseOf = (id: number) => num(c.stats?.find((s) => s.id === id)?.value) ?? 10;
  const bonusOf = (id: number) => num(c.bonusStats?.find((s) => s.id === id)?.value) ?? 0;
  const overrideOf = (id: number) => num(c.overrideStats?.find((s) => s.id === id)?.value);
  const out = {} as Record<AbilityKey, number>;
  STAT_ID_TO_ABILITY.forEach((ab, i) => {
    const id = i + 1;
    const ov = overrideOf(id);
    if (ov != null) { out[ab] = ov; return; }
    const full = ABILITY_FULL[ab];
    let bonus = bonusOf(id);
    let setTo = 0;
    for (const mod of mods) {
      if (mod.subType !== `${full}-score`) continue;
      if (mod.type === 'bonus') bonus += num(mod.value) ?? 0;
      else if (mod.type === 'set') setTo = Math.max(setTo, num(mod.value) ?? 0);
    }
    out[ab] = Math.max(baseOf(id) + bonus, setTo);
  });
  return out;
}

function armorClass(c: DbCharacter, scores: Record<AbilityKey, number>, mods: DbModifier[]): number | undefined {
  const dex = abilityModifier(scores.dex);
  const items = (c.inventory ?? []).filter((it) => it.equipped && it.definition);
  const armor = items.find((it) => it.definition?.filterType === 'Armor' && (it.definition.armorTypeId ?? 0) >= 1 && (it.definition.armorTypeId ?? 0) <= 3);
  const shield = items.find((it) => it.definition?.armorTypeId === 4);
  let ac: number;
  if (armor?.definition) {
    const baseAc = num(armor.definition.armorClass) ?? 10;
    const t = armor.definition.armorTypeId;
    ac = t === 3 ? baseAc : t === 2 ? baseAc + Math.min(dex, 2) : baseAc + dex;
  } else {
    ac = 10 + dex;
  }
  if (shield?.definition) ac += num(shield.definition.armorClass) ?? 2;
  for (const mod of mods) {
    if (mod.type === 'bonus' && (mod.subType === 'armor-class' || mod.subType === 'armored-armor-class')) ac += num(mod.value) ?? 0;
  }
  return ac > 0 ? ac : undefined;
}

type WeaponEntry = { name: string; toHit: number; dmgFormula?: string; damageType?: string };
function weaponEntries(c: DbCharacter, scores: Record<AbilityKey, number>, pb: number): WeaponEntry[] {
  const strMod = abilityModifier(scores.str);
  const dexMod = abilityModifier(scores.dex);
  const weapons = (c.inventory ?? []).filter((it) => it.definition?.filterType === 'Weapon');
  const chosen = weapons.some((w) => w.equipped) ? weapons.filter((w) => w.equipped) : weapons;
  return chosen.map((it) => {
    const def = it.definition!;
    const props = (def.properties ?? []).map((p) => (p.name ?? '').toLowerCase());
    const finesse = props.includes('finesse');
    const ranged = def.attackType === 2;
    const abMod = finesse ? Math.max(strMod, dexMod) : ranged ? dexMod : strMod;
    let magic = 0;
    for (const m of def.grantedModifiers ?? []) {
      if (m.type === 'bonus' && m.subType === 'magic') magic += num(m.value) ?? 0;
    }
    const dmgMod = abMod + magic;
    const dice = def.damage?.diceString;
    const dmgFormula = dice ? `${dice}${dmgMod ? (dmgMod > 0 ? `+${dmgMod}` : `${dmgMod}`) : ''}` : undefined;
    return { name: def.name || 'Weapon', toHit: abMod + pb + magic, dmgFormula, damageType: def.damageType?.toLowerCase() };
  });
}

function rangeLabel(r?: { origin?: string | null; rangeValue?: number | null }): string | undefined {
  if (!r) return undefined;
  if (r.origin && r.origin !== 'Ranged') return r.origin;
  const v = num(r.rangeValue);
  return v ? `${v} ft` : (r.origin ?? undefined);
}

function spellDamage(sp: DbSpell): IRDamage[] {
  const out: IRDamage[] = [];
  for (const m of sp.definition?.modifiers ?? []) {
    const isDamage = m.type === 'damage';
    const isHeal = m.type === 'bonus' && (m.subType === 'hit-points' || m.subType === 'healing');
    if (!isDamage && !isHeal) continue;
    const dc = num(m.die?.diceCount);
    const dv = num(m.die?.diceValue);
    const fixed = num(m.die?.fixedValue) ?? num(m.value);
    let formula = '';
    if (dv) formula = `${dc || 1}d${dv}${fixed ? `+${fixed}` : ''}`;
    else if (fixed) formula = `${fixed}`;
    if (!formula) continue;
    out.push({ formula, type: isHeal ? 'healing' : (m.friendlySubtypeName || m.subType || undefined) });
  }
  return out;
}

const RESET_MAP: Record<string, 'shortRest' | 'longRest'> = { short: 'shortRest', long: 'longRest' };
const SUBCLASS_CASTER = /arcane trickster|eldritch knight/i;

export function normalizeDndBeyond(input: unknown): IRCharacter | null {
  let root: unknown = input;
  if (typeof input === 'string') {
    try { root = JSON.parse(input); } catch { return null; }
  }
  if (!root || typeof root !== 'object') return null;
  const data = (root as { data?: unknown }).data;
  const c: DbCharacter = (data && typeof data === 'object') ? (data as DbCharacter) : (root as DbCharacter);
  if (!c || typeof c !== 'object' || !Array.isArray(c.stats)) return null;

  const mods = allModifiers(c);
  const scores = abilityScores(c, mods);
  const classes = (c.classes ?? []).filter((cl) => cl.definition?.name);
  const level = classes.reduce((sum, cl) => sum + (num(cl.level) ?? 0), 0) || 1;
  const pb = proficiencyBonus(level);

  const attributes: IRAttribute[] = [];
  const byVar: Record<string, IRAttribute> = {};
  const attr = (
    over: Partial<IRAttribute> & Pick<IRAttribute, 'variableName' | 'name' | 'type' | 'value' | 'total'>,
  ): IRAttribute => ({ id: over.variableName, damage: 0, reset: null, active: true, tags: [], ...over });
  const addAttr = (a: IRAttribute) => { attributes.push(a); byVar[a.variableName] = a; };

  // Abilities.
  for (let i = 0; i < 6; i++) {
    const ab = STAT_ID_TO_ABILITY[i];
    const full = ABILITY_FULL[ab];
    const score = scores[ab];
    addAttr(attr({ variableName: full, name: full, type: 'ability', value: score, total: score, modifier: abilityModifier(score) }));
  }

  // Core stats keyed by the variableNames the dnd5e view reads.
  const ac = armorClass(c, scores, mods);
  let speed = num(c.race?.weightSpeeds?.normal?.walk) ?? 30;
  let initBonus = 0;
  for (const m of mods) {
    if (m.type !== 'bonus') continue;
    if (m.subType === 'speed' || m.subType === 'innate-speed-walking') speed += num(m.value) ?? 0;
    if (m.subType === 'initiative') initBonus += num(m.value) ?? 0;
  }
  addAttr(attr({ variableName: 'proficiencyBonus', name: 'Proficiency Bonus', type: 'modifier', value: pb, total: pb }));
  if (ac != null) addAttr(attr({ variableName: 'armorClass', name: 'Armor Class', type: 'stat', value: ac, total: ac }));
  addAttr(attr({ variableName: 'speed', name: 'Speed', type: 'stat', value: speed, total: speed }));
  const init = abilityModifier(scores.dex) + initBonus;
  addAttr(attr({ variableName: 'initiative', name: 'Initiative', type: 'modifier', value: init, total: init }));

  // HP + temp HP.
  const conMod = abilityModifier(scores.con);
  let perLevelHp = 0;
  for (const m of mods) if (m.type === 'bonus' && m.subType === 'hit-points-per-level') perLevelHp += num(m.value) ?? 0;
  const maxHp = num(c.overrideHitPoints) ?? ((num(c.baseHitPoints) ?? 0) + conMod * level + perLevelHp * level + (num(c.bonusHitPoints) ?? 0));
  const removed = num(c.removedHitPoints) ?? 0;
  addAttr(attr({ variableName: 'hitPoints', name: 'Hit Points', type: 'healthBar', value: Math.max(0, maxHp - removed), total: maxHp, damage: removed }));
  const temp = num(c.temporaryHitPoints) ?? 0;
  if (temp) addAttr(attr({ variableName: 'tempHP', name: 'Temp HP', type: 'utility', value: temp, total: temp }));

  // Hit dice, one pool per class.
  for (const cl of classes) {
    const size = cl.definition?.hitDice ? `d${cl.definition.hitDice}` : undefined;
    const lvl = num(cl.level) ?? 0;
    const vn = `${camel((cl.definition!.name || 'class').toLowerCase().replace(/\s+/g, '-'))}HitDice`;
    addAttr(attr({ variableName: vn, name: `${cl.definition!.name} Hit Dice`, type: 'hitDice', value: lvl, total: lvl, hitDiceSize: size }));
  }

  // Spell slots (third casters / Artificer / pact magic handled by spellSlotsFor).
  const isSubCaster = (cl: DbClass) => SUBCLASS_CASTER.test(cl.subclassDefinition?.name ?? '');
  const caster = classes.find((cl) => cl.definition?.canCastSpells || (cl.definition?.spellCastingAbilityId ?? 0) > 0 || isSubCaster(cl));
  const casterLabel = caster ? `${caster.definition?.name ?? ''} ${caster.subclassDefinition?.name ?? ''}`.trim() : '';
  const castAbId = caster?.definition?.spellCastingAbilityId;
  let spellAbility: AbilityKey | undefined = castAbId && castAbId >= 1 && castAbId <= 6 ? STAT_ID_TO_ABILITY[castAbId - 1] : undefined;
  if (!spellAbility && caster && isSubCaster(caster)) spellAbility = 'int';
  if (caster) {
    const slots = spellSlotsFor(casterLabel, num(caster.level) ?? level);
    for (const [lvlStr, total] of Object.entries(slots)) {
      const L = Number(lvlStr);
      if (total > 0) addAttr(attr({ variableName: `spellSlotL${L}`, name: `Level ${L} Slots`, type: 'spellSlot', value: total, total, spellSlotLevel: L }));
    }
  }

  // Saves + skills (proficiency-aware roll bonuses).
  const skills: IRSkill[] = [];
  const skillMult: Record<string, number> = {};
  const saveProf = new Set<AbilityKey>();
  for (const m of mods) {
    const sub = m.subType ?? '';
    if (m.type === 'proficiency') {
      const ab = (Object.keys(ABILITY_FULL) as AbilityKey[]).find((a) => sub === `${ABILITY_FULL[a]}-saving-throws`);
      if (ab) { saveProf.add(ab); continue; }
      const name = SKILL_SLUG_TO_NAME[sub]; if (name) skillMult[name] = Math.max(skillMult[name] ?? 0, 1);
    } else if (m.type === 'expertise') {
      const name = SKILL_SLUG_TO_NAME[sub]; if (name) skillMult[name] = 2;
    } else if (m.type === 'half-proficiency') {
      const name = SKILL_SLUG_TO_NAME[sub]; if (name) skillMult[name] = Math.max(skillMult[name] ?? 0, 0.5);
    }
  }
  for (const ab of Object.keys(ABILITY_FULL) as AbilityKey[]) {
    const full = ABILITY_FULL[ab];
    const prof = saveProf.has(ab);
    skills.push({ id: `save-${ab}`, name: `${full} save`, variableName: `${full}Save`, skillType: 'save', ability: full, value: abilityModifier(scores[ab]) + (prof ? pb : 0), proficiency: prof ? 1 : 0, active: true, tags: [] });
  }
  for (const sk of SKILLS) {
    const mult = skillMult[sk.name] ?? 0;
    const value = abilityModifier(scores[sk.ability]) + Math.floor(pb * mult);
    const slug = NAME_TO_SLUG[sk.name] ?? sk.name.toLowerCase();
    skills.push({ id: `skill-${slug}`, name: sk.name, variableName: camel(slug), skillType: 'skill', ability: ABILITY_FULL[sk.ability], value, proficiency: mult, active: true, tags: [] });
  }

  // Actions: weapons, spells, limited-use features.
  const actions: IRAction[] = [];
  let aid = 0;
  const nextId = (p: string) => `${p}-${aid++}`;

  for (const w of weaponEntries(c, scores, pb)) {
    const damage: IRDamage[] = w.dmgFormula ? [{ formula: w.dmgFormula, type: w.damageType }] : [];
    actions.push({ id: nextId('wpn'), name: w.name, kind: 'action', actionType: 'action', active: true, consumes: [], attack: { bonus: w.toHit }, damage, tags: [] });
  }

  const spellMod = spellAbility ? abilityModifier(scores[spellAbility]) : 0;
  const seenSpell = new Set<string>();
  const addSpell = (sp?: DbSpell) => {
    const name = sp?.definition?.name?.trim();
    if (!name) return;
    const key = name.toLowerCase();
    if (seenSpell.has(key)) return;
    seenSpell.add(key);
    const def = sp!.definition!;
    const lvl = num(def.level) ?? 0;
    const attack = def.requiresAttackRoll ? { bonus: spellMod + pb } : undefined;
    actions.push({
      id: nextId('spell'), name, kind: 'spell', active: sp?.prepared !== false, consumes: [],
      attack, damage: spellDamage(sp!),
      spell: { level: lvl, school: def.school || undefined, range: rangeLabel(def.range), concentration: !!def.concentration, ritual: !!def.ritual },
      description: def.description || undefined, tags: [],
    });
  };
  for (const cs of c.classSpells ?? []) for (const sp of cs.spells ?? []) addSpell(sp);
  for (const list of Object.values(c.spells ?? {})) for (const sp of list ?? []) addSpell(sp);

  for (const list of Object.values(c.actions ?? {})) {
    for (const act of (list as DbAction[]) ?? []) {
      const lu = act.limitedUse;
      const max = num(lu?.maxUses);
      if (!act.name || !lu || !max) continue;
      const reset = RESET_MAP[String(lu.resetType ?? '').toLowerCase()] ?? null;
      actions.push({
        id: nextId('feat'), name: act.name, kind: 'feature', active: true, consumes: [],
        damage: [], uses: { current: Math.max(0, max - (num(lu.numberUsed) ?? 0)), max, reset },
        description: act.snippet || act.description || undefined, tags: [],
      });
    }
  }

  const inventory: IRItem[] = (c.inventory ?? [])
    .filter((it) => it.definition?.name)
    .map((it, i) => ({ id: `item-${i}`, name: it.definition!.name!, quantity: num(it.quantity) ?? 1, equipped: !!it.equipped, tags: [] }));

  const classLevels: IRClassLevel[] = classes.map((cl) => ({
    name: `${cl.definition!.name}${cl.subclassDefinition?.name ? ` (${cl.subclassDefinition.name})` : ''}`,
    level: num(cl.level) ?? 1,
  }));

  return {
    // Prefer the DDB character id (stable, unique) so cloud upserts key cleanly;
    // fall back to the name only when the id is missing.
    id: String(c.id ?? c.name ?? 'ddb'),
    name: c.name || 'Imported Character',
    portrait: c.decorations?.avatarUrl || c.avatarUrl || undefined,
    systemHint: 'dnd5e',
    attributes,
    skills,
    actions,
    inventory,
    conditions: [],
    classes: classLevels,
    byVar,
  };
}
