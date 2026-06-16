/**
 * System-agnostic intermediate representation (IR) for a DiceCloud character.
 *
 * The IR mirrors DiceCloud's own generic stat engine instead of a fixed D&D 5e
 * shape: every attribute is carried with its type and reset period, every action/
 * spell references the resources it actually consumes. D&D conveniences (the six
 * abilities, skills, spell-slot levels) are derived from this by `views/dnd5e`,
 * never baked in here.
 *
 * See REBUILD.md for the design rationale.
 */

/** DiceCloud attributeType, kept open so unknown/custom systems still round-trip. */
export type AttributeType =
  | 'ability'
  | 'stat'
  | 'modifier'
  | 'hitDice'
  | 'healthBar'
  | 'resource'
  | 'spellSlot'
  | 'utility'
  | (string & {});

/** How a use/charge pool refreshes. Open set; DiceCloud commonly uses the rest kinds. */
export type ResetPeriod = 'shortRest' | 'longRest' | (string & {}) | null;

/** A single attribute of any type. HP, hit dice, spell slots, ki, sanity, glory... */
export interface IRAttribute {
  id: string;
  name: string;
  variableName: string;
  type: AttributeType;
  /** Current effective value (for damageable attrs this is total - damage). */
  value: number;
  /** Max / total. */
  total: number;
  /** Amount consumed/reduced (healthBar, resource). */
  damage: number;
  /** Derived ability modifier, when the attribute is an ability score. */
  modifier?: number;
  reset: ResetPeriod;
  /** False when the property is toggled/deactivated (e.g. an unprepared spell). Still imported. */
  active: boolean;
  /** e.g. 'd6' for hitDice attributes. */
  hitDiceSize?: string;
  /** Slot level for spellSlot attributes. */
  spellSlotLevel?: number;
  tags: string[];
  description?: string;
}

/**
 * A trained/rollable proficiency. DiceCloud models D&D skills, saves, tool/language/
 * armor/weapon proficiencies - and custom things like 13th Age backgrounds - all as
 * `skill` properties distinguished by skillType.
 */
export interface IRSkill {
  id: string;
  name: string;
  variableName: string;
  /** 'skill' | 'save' | 'check' | 'language' | 'armor' | 'weapon' | custom. */
  skillType: string;
  /** Computed roll bonus. */
  value: number;
  /** Linked ability variableName, when any. */
  ability?: string;
  /** Proficiency multiplier (0, 0.5, 1, 2). */
  proficiency: number;
  active: boolean;
  tags: string[];
}

export interface IRItem {
  id: string;
  name: string;
  plural?: string;
  quantity: number;
  equipped: boolean;
  weight?: number;
  value?: number;
  description?: string;
  tags: string[];
}

export interface IRUses {
  current: number;
  max: number;
  reset: ResetPeriod;
}

/** A resource an action/spell spends when used. */
export interface IRConsumes {
  variableName?: string;
  propertyId?: string;
  amount: number;
}

export interface IRDamage {
  formula: string;
  type?: string;
}

export interface IRSpellMeta {
  level: number;
  school?: string;
  castingTime?: string;
  range?: string;
  duration?: string;
  components?: Record<string, boolean>;
  concentration?: boolean;
  ritual?: boolean;
}

/** Anything that "does something": an action, a spell, or an activatable feature. */
export interface IRAction {
  id: string;
  name: string;
  kind: 'action' | 'spell' | 'feature';
  /** DiceCloud action timing: 'action' | 'bonus' | 'reaction' | 'free' | 'long' | custom. */
  actionType?: string;
  /** False when toggled/deactivated (e.g. an unprepared spell). Still imported. */
  active: boolean;
  /** Limited-use pool, with reset period (the "2 charges, recharge on long rest" case). */
  uses?: IRUses;
  /** Resources spent on use, by DiceCloud variableName / property id. */
  consumes: IRConsumes[];
  attack?: { bonus: number };
  damage: IRDamage[];
  spell?: IRSpellMeta;
  description?: string;
  tags: string[];
}

/**
 * A buff or toggle — DiceCloud's activatable conditions/effects (rage, bless, a
 * stance, a feature toggle). Carried with its on/off state so the sheet can show
 * what's currently affecting the character.
 */
export interface IRCondition {
  id: string;
  name: string;
  /** 'buff' (an applied effect) | 'toggle' (a user switch) | custom. */
  kind: 'buff' | 'toggle' | (string & {});
  active: boolean;
  description?: string;
}

/** A class + its level (DiceCloud `class` property). Empty for non-class systems. */
export interface IRClassLevel {
  name: string;
  level: number;
}

/** The normalized character. Generic first; D&D is a derived view on top. */
export interface IRCharacter {
  id: string;
  name: string;
  portrait?: string;
  /** Best-effort hint, never load-bearing. */
  systemHint: 'dnd5e' | 'generic' | (string & {});
  attributes: IRAttribute[];
  skills: IRSkill[];
  actions: IRAction[];
  inventory: IRItem[];
  /** Active buffs / toggles (conditions affecting the character). */
  conditions: IRCondition[];
  /** Class/level lines; empty for classless systems. */
  classes: IRClassLevel[];
  /** variableName -> attribute, for fast lookup by adapters and the D&D view. */
  byVar: Record<string, IRAttribute>;
}

/**
 * Raw DiceCloud data we normalize from. Two shapes occur in the wild:
 *  - REST `/api/creature/{id}`: { creatures[], creatureProperties[], creatureVariables[] }
 *  - the extension's internal store: { creature, properties[], variables }
 * normalize() accepts either.
 */
export interface RawDiceCloud {
  creatures?: any[];
  creatureProperties?: any[];
  creatureVariables?: any[];
  creature?: any;
  properties?: any[];
  variables?: any;
}
