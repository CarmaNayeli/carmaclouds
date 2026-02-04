# CarmaClouds Monorepo Migration Guide

## Overview

This guide will help you migrate your existing OwlCloud and RollCloud (Pip2) codebases into the new CarmaClouds monorepo structure.

---

## Monorepo Structure

```
carmaclouds/
├── packages/
│   ├── core/              # Shared utilities (DONE ✅)
│   │   ├── src/
│   │   │   ├── cache/     # CacheManager class
│   │   │   ├── supabase/  # Field definitions
│   │   │   ├── types/     # TypeScript types
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── owlcloud/          # Browser extension (TO MIGRATE)
│   │   ├── src/           # Move from /src
│   │   ├── owlbear-extension/  # Move from /owlbear-extension
│   │   ├── manifest.json
│   │   └── package.json
│   │
│   ├── rollcloud/         # Discord bot (TO MIGRATE)
│   │   ├── src/           # Move from /Pip2/src
│   │   ├── .env
│   │   └── package.json
│   │
│   └── foundcloud/        # Future Foundry module (PLACEHOLDER)
│       └── package.json
│
├── supabase/              # Shared Supabase functions (MOVE HERE)
│   └── functions/
│       └── characters/
│
├── package.json           # Root workspace config (DONE ✅)
├── tsconfig.base.json     # Shared TypeScript config (DONE ✅)
└── README.md
```

---

## Migration Steps

### 1. Move OwlCloud Code

Since OwlCloud is the most optimized, we'll use it as the reference implementation.

```bash
cd /c/Users/c_dow/owlCloud

# Copy OwlCloud browser extension
cp -r src carmaclouds/packages/owlcloud/
cp -r owlbear-extension carmaclouds/packages/owlcloud/
cp manifest.json carmaclouds/packages/owlcloud/

# Copy config files
cp -r .web-ext-config.js carmaclouds/packages/owlcloud/ 2>/dev/null || true
```

**Update imports in OwlCloud:**
- Replace custom cache implementations with `@carmaclouds/core`
- Update Supabase field references to use core package

### 2. Move RollCloud (Pip2) Code

```bash
# Copy Pip2 Discord bot
cp -r Pip2/src carmaclouds/packages/rollcloud/
cp Pip2/.env carmaclouds/packages/rollcloud/.env.example
cp Pip2/package.json carmaclouds/packages/rollcloud/package-old.json

# Copy deploy script
cp Pip2/src/deploy-commands.js carmaclouds/packages/rollcloud/src/
```

**Update imports in RollCloud:**
```javascript
// OLD:
const { CHARACTER_COMBAT } = require('../utils/supabaseFields');
const cacheManager = require('../utils/characterCacheManager');

// NEW:
import { CHARACTER_COMBAT, CacheManager } from '@carmaclouds/core';
const cacheManager = new CacheManager<Character>({ expiryMs: 15 * 60 * 1000 });
```

### 3. Move Supabase Edge Functions

```bash
# Move shared edge functions to root
cp -r supabase carmaclouds/
```

### 4. Install Dependencies

```bash
cd carmaclouds

# Install root dependencies and link workspaces
npm install

# This will automatically install dependencies for all packages
```

### 5. Build Core Package

```bash
# Build core package first (other packages depend on it)
npm run build -w @carmaclouds/core
```

---

## Package-Specific Migration

### OwlCloud Migration

**Files to update:**

1. **src/lib/supabase-client.js** → Convert to TypeScript and use core types:
```typescript
import { CacheManager, Character } from '@carmaclouds/core';

const characterCache = new CacheManager<Character>({
  expiryMs: 60 * 60 * 1000, // 1 hour
  debug: true
});
```

2. **Update package.json** scripts:
```json
{
  "scripts": {
    "build": "web-ext build",
    "dev": "web-ext run",
    "lint": "web-ext lint"
  }
}
```

### RollCloud Migration

**Files to update:**

1. **Delete old utility files** (now in core):
```bash
rm -f src/utils/characterCacheManager.js
rm -f src/utils/supabaseFields.js
```

2. **Update all command files:**
```javascript
// Update imports
import {
  CHARACTER_COMBAT,
  CHARACTER_SPELLS,
  CHARACTER_RESOURCES,
  PAIRING_FIELDS
} from '@carmaclouds/core';
```

3. **Update characterCache.js:**
```javascript
import { CacheManager, Character } from '@carmaclouds/core';

const cacheManager = new CacheManager<Character>({
  expiryMs: 15 * 60 * 1000,
  debug: process.env.NODE_ENV === 'development'
});
```

---

## Environment Variables

### Root .env (optional)
```bash
# Shared across all packages
SUPABASE_URL=https://luiesmfjdcmpywavvfqm.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

### Package-specific .env files

**rollcloud/.env:**
```bash
# Discord
DISCORD_TOKEN=your_discord_token
CLIENT_ID=your_client_id
GUILD_ID=your_guild_id

# Supabase (can inherit from root)
SUPABASE_URL=https://luiesmfjdcmpywavvfqm.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
```

---

## Testing Migration

### Test Core Package
```bash
cd packages/core
npm run build
# Should compile without errors
```

### Test OwlCloud
```bash
cd packages/owlcloud
npm run dev
# Extension should load in browser
```

### Test RollCloud
```bash
cd packages/rollcloud
npm run dev
# Bot should start and connect to Discord
```

---

## Import Path Examples

### Before (old structure):
```javascript
// Pip2/src/commands/roll.js
const { CHARACTER_COMBAT } = require('../utils/supabaseFields');
const cacheManager = require('../utils/characterCacheManager');
```

### After (monorepo):
```javascript
// packages/rollcloud/src/commands/roll.js
import { CHARACTER_COMBAT, CacheManager } from '@carmaclouds/core';
import type { Character } from '@carmaclouds/core';

const cache = new CacheManager<Character>({ expiryMs: 15 * 60 * 1000 });
```

---

## Deployment Updates

### RollCloud (Render)

Update your Render deployment to:
1. **Root Directory:** `carmaclouds/packages/rollcloud`
2. **Build Command:** `npm install && npm run deploy-commands`
3. **Start Command:** `npm start`

### Supabase Edge Functions

```bash
cd carmaclouds
supabase functions deploy characters
```

---

## Benefits of Monorepo

✅ **Shared Code:** Cache manager, types, utilities used across all packages
✅ **Consistent Dependencies:** One package-lock.json for easier management
✅ **Easier Refactoring:** Changes to shared code propagate automatically
✅ **Type Safety:** TypeScript types shared across packages
✅ **Atomic Commits:** Related changes across packages in single commit
✅ **Future-Ready:** Easy to add FoundCloud or other packages

---

## Next Steps

1. **Backup current code:** `git commit -am "Backup before monorepo migration"`
2. **Run migration scripts** (provided below)
3. **Test each package** independently
4. **Update CI/CD** configurations
5. **Update documentation**

---

## Quick Migration Script

```bash
#!/bin/bash
# Run this from /c/Users/c_dow/owlCloud

set -e

echo "🚀 Starting CarmaClouds migration..."

# Step 1: Move OwlCloud
echo "📦 Moving OwlCloud..."
cp -r src carmaclouds/packages/owlcloud/
cp -r owlbear-extension carmaclouds/packages/owlcloud/
cp manifest.json carmaclouds/packages/owlcloud/

# Step 2: Move RollCloud
echo "📦 Moving RollCloud..."
cp -r Pip2/src carmaclouds/packages/rollcloud/
cp Pip2/.env carmaclouds/packages/rollcloud/.env.example

# Step 3: Move Supabase
echo "📦 Moving Supabase functions..."
cp -r supabase carmaclouds/

# Step 4: Install
echo "📥 Installing dependencies..."
cd carmaclouds
npm install

# Step 5: Build core
echo "🔨 Building core package..."
npm run build -w @carmaclouds/core

echo "✅ Migration complete! Review changes and test each package."
```

---

## Rollback Plan

If something goes wrong:

```bash
# The original code is still in the parent directory
cd /c/Users/c_dow/owlCloud
# Just delete carmaclouds folder and continue with old structure
```

---

**Questions?** Check the package READMEs or review the core package source code for examples.
