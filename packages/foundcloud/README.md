# @carmaclouds/foundcloud 🎭

**Foundry VTT module for DiceCloud integration**

*Coming Soon*

---

## Planned Features

- Import DiceCloud characters into Foundry VTT
- Bi-directional sync between DiceCloud and Foundry
- Automated HP and resource tracking
- Spell slot management
- Real-time updates

---

## Development Status

⏳ **Planned** - Not yet started

---

## Contributing

If you'd like to help build FoundCloud, check out the core package first to understand the shared utilities:

- [@carmaclouds/core](../core/README.md)
- [OwlCloud](../owlcloud/README.md) - Reference implementation
- [RollCloud](../rollcloud/README.md) - Discord bot example

---

## Architecture Ideas

```typescript
import { CacheManager, Character, FIELD_SETS } from '@carmaclouds/core';

class FoundCloudModule {
  private cache: CacheManager<Character>;

  constructor() {
    this.cache = new CacheManager({
      expiryMs: 15 * 60 * 1000 // 15 minutes
    });
  }

  async importCharacter(diceCloudId: string) {
    // Implementation here
  }

  async syncToFoundry(character: Character) {
    // Implementation here
  }
}
```

---

## Resources

- [Foundry VTT API](https://foundryvtt.com/api/)
- [Module Development Guide](https://foundryvtt.com/article/module-development/)
- [DiceCloud API](https://dicecloud.com/api)
