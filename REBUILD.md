# Rebuild: system-agnostic intermediate representation (IR)

**Branch:** `rebuild/system-agnostic-ir`
**Goal:** Stop translating DiceCloud into a fixed D&D 5e shape. Import what the sheet
actually configures, so non-D&D systems (custom attributes like sanity/glory,
charge-based spells, arbitrary resources, hit/recovery dice) "just work."

This is a clean rebuild of the parse + adapter layer. D&D output is reproduced as a
*derived view* on top of the generic model, not hardcoded.

## Principles

1. **Mirror DiceCloud, don't reinterpret it.** DiceCloud is already a generic stat
   engine. The IR should faithfully carry every property and its config.
2. **Key everything by `variableName`.** That is DiceCloud's stable identifier and how
   actions reference the resources they consume.
3. **D&D is a view, not the model.** The six abilities, skills, and spell-slot levels are
   derived from the IR when the character looks like D&D. Everything else still renders.
4. **Preserve reset + consumption.** Charges, uses, and their reset period (short/long
   rest) and the resource an action consumes are first-class - this is the data the
   current code drops.

## DiceCloud source model (what we actually get)

Each `creatureProperties` entry carries (relevant fields):
- `_id`, `type` (`attribute` | `action` | `spell` | `feature` | `item` | `folder` | `trigger` | ...)
- `name`, `tags[]`, `variableName`
- `attributeType` (for `type==='attribute'`): `ability | stat | modifier | hitDice | healthBar | resource | spellSlot | utility`
- `baseValue`, `value`, `total`, `damage` (amount consumed; current = `total - damage`)
- `reset` (e.g. `shortRest`, `longRest`)
- `hitDiceSize` (hitDice), spell-slot level (spellSlot)
- `uses` (actions/spells/features): `{ value/currentValue, max }` + `reset`
- `resources` (actions/spells): `attributesConsumed[]` / `itemsConsumed[]` linking to a
  `variableName`/`_id` + quantity  ← **the charge-based-spell data we currently ignore**

`creatureVariables` is the computed values map (keyed by `variableName`).
`creature` carries name, picture, denormalized stats.

> The current parser only branches on 4 attributeTypes (`healthBar`, `hitDice`,
> `resource`, `spellSlot`), reads abilities by hardcoded name, and captures `uses` as a
> bare `{current,max}` - dropping `reset` and `resources`. That is the root bug.

## The IR schema (proposal - this is the decision to lock)

```ts
interface Character {
  id: string;
  name: string;
  portrait?: string;
  systemHint?: 'dnd5e' | 'generic' | string;   // best-effort, never load-bearing
  attributes: Attribute[];                       // ALL attributes, every type
  actions: Action[];                             // action | spell | feature that does something
  inventory: Item[];
  proficiencies: Proficiency[];
  notes: Note[];
  byVar: Record<string, Attribute>;              // variableName -> attribute (fast lookup)
  raw?: unknown;                                  // keep raw for escape hatches during migration
}

interface Attribute {
  id: string;
  name: string;
  variableName: string;
  type: 'ability' | 'stat' | 'modifier' | 'hitDice' | 'healthBar'
      | 'resource' | 'spellSlot' | 'utility' | string;   // open set
  value: number;                 // current effective value
  total: number;                 // max / total
  damage?: number;               // consumed; current = total - damage
  modifier?: number;             // abilities: derived (floor((value-10)/2)) when applicable
  reset?: 'shortRest' | 'longRest' | null;
  hitDiceSize?: string;          // 'd6' (hitDice)
  spellSlotLevel?: number;       // (spellSlot)
  tags: string[];
  description?: string;
}

interface Action {
  id: string;
  name: string;
  kind: 'action' | 'spell' | 'feature';
  uses?: { current: number; max: number; reset?: 'shortRest' | 'longRest' | null };
  consumes: { variableName: string; amount: number }[];   // resources spent on use
  attack?: { bonus: number; ... };
  damage?: { formula: string; type?: string }[];
  save?: { ability: string; dc: number };
  spell?: { level: number; school?: string; components?: string;
            concentration?: boolean; castingTime?: string; range?: string; duration?: string };
  description?: string;
}
```

Key consequences:
- **HP, hit dice, spell slots, recovery die, sanity, glory, ki, rage** are all just
  `Attribute`s distinguished by `type` + `reset`. No special top-level fields.
- **A "2 charges, recharge on long rest" spell** = an `Action{kind:'spell'}` whose `uses`
  has `reset:'longRest'`, OR that `consumes` a named resource attribute. We render the
  real thing instead of synthesizing slots from class level.

## Architecture layers

```
raw DiceCloud
  -> normalize(raw): Character            // packages/core/src/ir/normalize.js  (pure, testable)
  -> views/dnd5e.js: deriveDnd(ir)        // the 6 abilities, skills, slot levels (optional)
  -> adapters render from Character (+ dnd view when present)
```

- `packages/core/src/ir/` - new home: `types`, `normalize`, `views/dnd5e`.
- Adapters (Roll20 / Owlbear / Foundry / Coyote) consume `Character`. Shared rendering of
  the generic attribute/resource/action lists lives once; D&D-specific layout is one
  shared view. This is also where the 4-adapter duplication collapses.

## Sequencing (clean rebuild, on this branch)

0. **Fixtures first.** Capture raw DiceCloud JSON for at least one D&D character and one
   non-D&D character (the d20 recovery-die sheet) into `packages/core/src/ir/__fixtures__/`.
   Everything below is tested against these.
1. `normalize()` + IR types. Snapshot-test the IR for both fixtures.
2. `deriveDnd()` view. Assert it reproduces today's D&D output for the D&D fixture.
3. Rebuild the **Owlbear** adapter on the IR (our pilot surface). Validate live.
4. Migrate Roll20, Foundry, Coyote adapters.
5. Delete the old D&D-centric parse paths (`parseForRollCloud` D&D plucking, slot
   synthesis, class-based hit dice, hardcoded ability/skill reads).

## Testing

- Pure `normalize()` enables real unit tests (none exist today). Snapshot IR per fixture.
- Golden test: `deriveDnd(normalize(dndFixture))` matches a captured known-good D&D shape.
- Non-D&D assertions: recovery die present with size; custom attributes surfaced;
  charge-based spell shows correct uses + reset.

## Decisions

- **Types: TypeScript** in `packages/core` (IR module is TS; long-term win over JSDoc).
- **Storage: a new dedicated Supabase table** for the IR (not a column on
  `clouds_characters`). Keeps the new model cleanly separated from the legacy parsed data
  during and after migration.
- **Fixtures via API:** pull real character JSON directly from the DiceCloud API
  (`scripts/fetch-dicecloud-fixtures.mjs`) using creds in `packages/carmaclouds/.env`.

## Still open

- **D&D detection** for the view: presence of `strength..charisma` variableNames and/or
  `dnd5e` tags. Treat as a hint only.
- New IR table name + columns (define once we see the IR shape settle).
