/**
 * D&D 5e view derived from the system-agnostic IR.
 *
 * This is a *projection*, not the source of truth: it picks the six abilities,
 * skills, saves, HP, hit dice and spell-slot levels out of the generic IR so
 * existing D&D adapters keep their familiar shape. Non-D&D characters simply
 * produce a sparse view and render from the generic IR instead.
 */
import type { IRAttribute, IRCharacter } from '../types';

export const DND_ABILITIES = [
  'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
] as const;

export interface AbilityView {
  score: number;
  modifier: number;
}

export interface PoolView {
  current: number;
  max: number;
}

export interface HitDicePool extends PoolView {
  size?: string;
}

export interface Dnd5eView {
  abilities: Record<string, AbilityView>;
  /** Save bonus keyed by ability variableName. */
  saves: Record<string, number>;
  /** Skill bonus keyed by skill variableName. */
  skills: Record<string, number>;
  hitPoints: PoolView & { temp: number };
  hitDice: HitDicePool[];
  /** Spell slots keyed by level (1-9). */
  spellSlots: Record<number, PoolView>;
  proficiencyBonus: number;
  armorClass: number;
  speed: number;
  initiative: number;
}

const valOf = (a?: IRAttribute): number => a?.value ?? 0;

/** Current/max for a damageable attribute (HP, slots): current = total - damage. */
function pool(a?: IRAttribute): PoolView {
  if (!a) return { current: 0, max: 0 };
  return { current: a.total - a.damage, max: a.total };
}

export function deriveDnd(ir: IRCharacter): Dnd5eView {
  const { byVar } = ir;

  const abilities: Record<string, AbilityView> = {};
  for (const ab of DND_ABILITIES) {
    const a = byVar[ab];
    if (a) abilities[ab] = { score: a.value, modifier: a.modifier ?? Math.floor((a.value - 10) / 2) };
  }

  const saves: Record<string, number> = {};
  const skills: Record<string, number> = {};
  for (const s of ir.skills) {
    if (s.skillType === 'save') saves[s.ability || s.variableName] = s.value;
    else if (s.skillType === 'skill') skills[s.variableName] = s.value;
  }

  const hitDice = ir.attributes
    .filter((a) => a.type === 'hitDice')
    .map((a): HitDicePool => ({ current: a.value, max: a.total, size: a.hitDiceSize }));

  const spellSlots: Record<number, PoolView> = {};
  for (const a of ir.attributes) {
    if (a.type === 'spellSlot' && a.spellSlotLevel) {
      spellSlots[a.spellSlotLevel] = pool(a);
    }
  }

  const hp = pool(byVar['hitPoints']);

  return {
    abilities,
    saves,
    skills,
    hitPoints: { ...hp, temp: valOf(byVar['tempHP'] || byVar['temporaryHitPoints']) },
    hitDice,
    spellSlots,
    proficiencyBonus: valOf(byVar['proficiencyBonus']),
    armorClass: valOf(byVar['armorClass']),
    speed: valOf(byVar['speed']),
    initiative: valOf(byVar['initiative']),
  };
}
