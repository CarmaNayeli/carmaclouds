# CarmaClouds Migration Status

**Last Updated:** 2026-01-31

## ✅ Completed

### 1. Core Package Setup
- ✅ Created `@carmaclouds/core` package structure
- ✅ Extracted shared TypeScript modules:
  - `types/character.ts` - Character type definitions
  - `cache/CacheManager.ts` - Generic cache manager
  - `supabase/fields.ts` - Supabase field definitions
- ✅ Extracted shared JavaScript modules (37 D&D Beyond modules + utilities):
  - `common/` - Browser polyfill, debug, HTML utils, theme manager
  - `lib/` - IndexedDB cache
  - `modules/` - All 37 D&D character sheet modules
  - `supabase/` - Supabase client and config
- ✅ Updated exports in [packages/core/src/index.ts](packages/core/src/index.ts)
- ✅ Built successfully with TypeScript

### 2. Pip2 (Discord Bot) Migration
- ✅ Moved to `packages/pip/`
- ✅ Updated all imports to use `@carmaclouds/core`:
  - `CHARACTER_COMBAT`, `CHARACTER_SPELLS`, `CHARACTER_RESOURCES`, etc.
  - `CacheManager` for character caching
  - `PAIRING_FIELDS` for extension integration
- ✅ Working examples:
  - [packages/pip/src/commands/roll.js](packages/pip/src/commands/roll.js:3)
  - [packages/pip/src/commands/cast.js](packages/pip/src/commands/cast.js:3)
  - [packages/pip/src/utils/characterCacheManager.js](packages/pip/src/utils/characterCacheManager.js:7)

### 3. Monorepo Infrastructure
- ✅ Root package.json with workspaces configuration
- ✅ Base TypeScript configuration ([tsconfig.base.json](tsconfig.base.json))
- ✅ Dependencies installed (`npm install` completed)
- ✅ Core package builds successfully (`npm run build -w @carmaclouds/core`)

---

## ⚠️ Remaining Work

### 1. Browser Extension Migrations

Both OwlCloud and RollCloud are browser extensions that use `importScripts()` for loading modules. They cannot directly import from `@carmaclouds/core` without a bundler.

#### Option A: Keep Current Structure (Recommended for now)
- Keep the JavaScript modules in each extension
- They're already optimized and working
- No breaking changes needed

#### Option B: Add Bundler (Future Enhancement)
Would require:
1. Add webpack/rollup/vite to owlcloud and rollcloud packages
2. Configure bundler to bundle @carmaclouds/core with the extension
3. Update manifest.json to reference bundled files
4. Test in both Firefox and Chrome
5. Update build scripts

### 2. Root Rollcloud Directory

**Status:** The root `rollcloud/` directory still exists and contains:
- The RollCloud browser extension (manifest.json, icons, installer)
- The Pip2 Discord bot (in `rollcloud/Pip2/`)

**Action Needed:**
- The Pip2 code has been copied to `packages/pip/` and migrated
- The RollCloud browser extension could be moved to `packages/rollcloud/`
- The root `rollcloud/` directory can be archived or removed once verified

**Recommendation:** Keep the root rollcloud directory for now as a backup until the browser extension bundler is set up.

---

## 📊 Package Status

| Package | Location | Status | Uses @carmaclouds/core? |
|---------|----------|--------|-------------------------|
| **core** | `packages/core/` | ✅ Complete | N/A (is the core) |
| **pip** (Discord bot) | `packages/pip/` | ✅ Complete | ✅ Yes |
| **owlcloud** (Browser ext) | `packages/owlcloud/` | ⚠️ Needs bundler | ❌ No (uses local files) |
| **rollcloud** (Browser ext) | `packages/rollcloud/` | ⚠️ Needs bundler | ❌ No (needs migration) |
| **foundcloud** | `packages/foundcloud/` | 📦 Placeholder | - |

---

## 🚀 How to Use

### Build Core Package
```bash
npm run build -w @carmaclouds/core
```

### Run Pip2 (Discord Bot)
```bash
cd packages/pip
npm start
```

### Using @carmaclouds/core in Your Code

```javascript
// Import types and utilities
import {
  CHARACTER_COMBAT,
  CHARACTER_SPELLS,
  CacheManager
} from '@carmaclouds/core';

// Create a cache manager
const cache = new CacheManager({
  expiryMs: 15 * 60 * 1000, // 15 minutes
  debug: true
});

// Use field definitions for Supabase queries
const query = `select=${CHARACTER_COMBAT}`;
```

---

## 📝 Current Exports from @carmaclouds/core

### Types
- `Character` - Character type definition
- `CacheStats` - Cache statistics type

### Classes
- `CacheManager<T>` - Generic cache manager

### Constants
- `CHARACTER_FULL` - All character fields
- `CHARACTER_COMBAT` - Combat-related fields
- `CHARACTER_SPELLS` - Spell-related fields
- `CHARACTER_RESOURCES` - Resource fields
- `CHARACTER_LIST` - Character list fields
- `PAIRING_FIELDS` - Extension pairing fields
- `FIELD_SETS` - Collection of all field sets

### Note on JavaScript Modules
The 37 JavaScript modules in `packages/core/src/modules/` and utilities in `common/` and `lib/` are **available in the package** but **not exported from the main entry point** because they're primarily used by browser extensions via `importScripts()`.

To use them in Node.js projects, you could:
1. Convert them to TypeScript and add proper exports
2. Or import them directly: `import * as diceRoller from '@carmaclouds/core/src/modules/dice-roller.js'`

---

## 🔧 Next Steps (Priority Order)

1. ✅ **Verify Pip2 functionality** - Test Discord bot in production
2. **Decide on browser extension strategy:**
   - Option A: Keep separate (current state - working)
   - Option B: Add bundler and migrate to @carmaclouds/core
3. **Archive root rollcloud directory** - Once Pip2 is verified working
4. **Document browser extension build process** - If going with Option B

---

## 📚 Related Documentation

- [Migration Guide](MIGRATION_GUIDE.md) - Original migration plan
- [Core Package](packages/core/README.md) - Core package documentation
- [Pip Package](packages/pip/README.md) - Discord bot documentation
- [OwlCloud Package](packages/owlcloud/README.md) - Browser extension documentation

---

## 🎯 Summary

The monorepo migration is **functionally complete** for the Node.js Discord bot (Pip2). The browser extensions (OwlCloud, RollCloud) can continue using their local JavaScript files until a bundler is set up. The core package provides TypeScript types and utilities that can be imported by any Node.js package in the monorepo.

**Core is working ✅**
**Pip2 is working ✅**
**Browser extensions need bundler for full migration ⚠️**
