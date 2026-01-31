# @carmaclouds/rollcloud 🎲

**RollCloud - Discord/platform integrations and features for dice rolling**

RollCloud provides enhanced dice rolling features and platform integrations for the CarmaClouds ecosystem. It leverages the Pip2 Discord bot for Discord features and integrates with other platforms for dice mechanics.

---

## Overview

RollCloud is the dice rolling and combat tracking layer of CarmaClouds. It:

- Provides enhanced dice rolling mechanics
- Tracks turn order and combat state
- Integrates with Discord via [@carmaclouds/pip](../pip/README.md)
- Supports character-based rolling with DiceCloud stats
- Enables cross-platform dice rolling (Discord, Owlbear, Roll20)

**Note:** RollCloud uses Pip2 for all Discord functionality. This package contains RollCloud-specific features and integrations.

---

## Structure

```
rollcloud/
├── src/
│   ├── dice/              # Dice rolling mechanics
│   ├── combat/            # Combat tracking
│   ├── integrations/      # Platform integrations
│   └── index.js
│
├── package.json
└── README.md
```

**Current Status:** Placeholder package. RollCloud features are currently implemented in [@carmaclouds/pip](../pip/README.md).

---

## Features (Planned)

### Dice Rolling Engine

- **Standard Rolls:** d4, d6, d8, d10, d12, d20, d100
- **Modifiers:** +/-, advantage/disadvantage
- **Character Integration:** Automatic stat/proficiency bonuses
- **Roll History:** Track and reference previous rolls
- **Criticals:** Auto-detect critical hits/failures

### Combat Tracking

- **Turn Order:** Initiative tracking
- **HP Management:** Damage, healing, temporary HP
- **Conditions:** Track status effects
- **Spell Slots:** Manage spell slot usage
- **Resources:** Track limited-use abilities

### Platform Integrations

- **Discord:** Via [@carmaclouds/pip](../pip/README.md) bot
- **Owlbear Rodeo:** Via [@carmaclouds/owlcloud](../owlcloud/README.md) extension
- **Roll20:** Webhook integration (planned)
- **Foundry VTT:** Via [@carmaclouds/foundcloud](../foundcloud/README.md) module (planned)

---

## Installation

```bash
# From monorepo root
npm install

# Or install specific package
cd packages/rollcloud
npm install
```

---

## Usage

### Current Implementation

RollCloud features are currently accessed via Pip2 Discord bot:

```bash
# In Discord
/roll 2d6+3                    # Basic dice roll
/roll check:perception         # Character skill check
/roll save:dexterity          # Saving throw
/roll attack:longsword        # Attack roll
```

See [@carmaclouds/pip README](../pip/README.md) for complete Discord command documentation.

### Future API (Planned)

```javascript
import { RollEngine, Combat } from '@carmaclouds/rollcloud';

// Dice rolling
const roll = RollEngine.roll('2d6+3');
// { total: 11, dice: [4, 4], modifier: 3 }

// Character-based roll
const check = await RollEngine.characterCheck(character, 'perception');
// { total: 18, dice: [15], modifier: 3, proficient: true }

// Combat tracking
const combat = new Combat();
combat.addCombatant(character, initiativeRoll);
combat.nextTurn();
```

---

## Integration with Core

RollCloud depends on shared utilities from `@carmaclouds/core`:

```javascript
import {
  CacheManager,
  CHARACTER_COMBAT,
  CHARACTER_SPELLS
} from '@carmaclouds/core';
```

---

## Dependencies

```json
{
  "dependencies": {
    "@carmaclouds/core": "^1.0.0",
    "@carmaclouds/pip": "^2.0.0"
  }
}
```

**Relationship with Pip2:**
- Pip2 provides Discord bot infrastructure
- RollCloud provides dice mechanics and combat logic
- RollCloud can be used by other platforms (Owlbear, Foundry) without Pip2

---

## Dice Notation

Supports standard dice notation:

```
2d6        # Roll two six-sided dice
1d20+5     # Roll d20, add 5
3d8-2      # Roll three d8, subtract 2
4d6kh3     # Roll four d6, keep highest 3 (ability score generation)
2d20kh1    # Advantage (roll 2d20, keep highest)
2d20kl1    # Disadvantage (roll 2d20, keep lowest)
```

---

## Character Integration

RollCloud automatically applies character stats to rolls:

```javascript
// Skill check example
/roll check:acrobatics

// RollCloud:
// 1. Fetches character from cache (@carmaclouds/core)
// 2. Gets dexterity modifier from character.attribute_mods
// 3. Checks proficiency in acrobatics from character.skills
// 4. Adds proficiency bonus if proficient
// 5. Rolls 1d20 + modifiers
// 6. Returns formatted result
```

---

## Combat System

### Turn Tracking

```javascript
// Example combat flow (planned API)
const combat = new Combat();

// Add combatants with initiative
combat.addCombatant(playerCharacter, 18);
combat.addCombatant(monster, 12);

// Start combat
combat.start();
// Current turn: playerCharacter (initiative 18)

// Next turn
combat.nextTurn();
// Current turn: monster (initiative 12)
```

### HP Management

Currently via Pip2 Discord commands:

```bash
/takedamage 10       # Reduce HP by 10
/heal 8              # Restore 8 HP
/heal 5 temp:true    # Add 5 temporary HP
```

---

## Platform Support

| Platform | Status | Integration |
|----------|--------|-------------|
| Discord | ✅ Active | Via [@carmaclouds/pip](../pip/README.md) |
| Owlbear Rodeo | ✅ Active | Via [@carmaclouds/owlcloud](../owlcloud/README.md) |
| Roll20 | 🚧 Planned | Webhook integration |
| Foundry VTT | 🚧 Planned | Via [@carmaclouds/foundcloud](../foundcloud/README.md) |

---

## Development

### Adding Dice Features

```javascript
// src/dice/roller.js (planned)
export class DiceRoller {
  static roll(notation) {
    // Parse notation: 2d6+3
    // Roll dice
    // Apply modifiers
    // Return result
  }

  static rollWithCharacter(notation, character, checkType) {
    // Get character modifiers from @carmaclouds/core types
    // Apply to roll
    // Return detailed result
  }
}
```

### Testing

```bash
npm test
```

---

## Roadmap

### Phase 1: Extract from Pip2 (Current)

- [ ] Move dice rolling logic from Pip2 to RollCloud package
- [ ] Create standalone dice engine
- [ ] Maintain Discord integration via Pip2

### Phase 2: Platform Expansion

- [ ] Owlbear Rodeo integration (via OwlCloud)
- [ ] Roll20 webhook support
- [ ] Foundry VTT module (via FoundCloud)

### Phase 3: Advanced Features

- [ ] Roll history and analytics
- [ ] Custom dice sets
- [ ] Macros and shortcuts
- [ ] Campaign-wide combat tracking

---

## Migration Notes

### Current Architecture

```
Discord → Pip2 (commands + dice logic)
Owlbear → OwlCloud extension → Supabase
```

### Future Architecture

```
Discord → Pip2 (commands) → RollCloud (dice logic)
Owlbear → OwlCloud → RollCloud
Roll20  → Webhook → RollCloud
Foundry → FoundCloud → RollCloud
```

All platforms share the same dice engine and combat tracking via RollCloud.

---

## Related Packages

- [@carmaclouds/core](../core/README.md) - Shared utilities, types, caching
- [@carmaclouds/pip](../pip/README.md) - Discord bot (uses RollCloud)
- [@carmaclouds/owlcloud](../owlcloud/README.md) - Browser extension
- [@carmaclouds/foundcloud](../foundcloud/README.md) - Foundry VTT module (planned)

---

## License

MIT

---

## Contributing

RollCloud is under active development. Contributions welcome!

1. Check existing Pip2 implementation for dice logic
2. Extract features to standalone RollCloud package
3. Ensure platform-agnostic design (not Discord-specific)
4. Use `@carmaclouds/core` for shared utilities
5. Write tests for dice mechanics
