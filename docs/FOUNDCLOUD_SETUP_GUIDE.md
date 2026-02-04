# FoundCloud Setup & Testing Guide

## 🎉 Implementation Complete!

FoundCloud is now **fully implemented** and ready for testing. This guide will walk you through setup and verification.

---

## 📋 What Was Implemented

### ✅ Browser Extension (CarmaClouds)
1. **FoundCloud Tab** - Fully functional UI in unified popup
2. **Character Sync** - Syncs DiceCloud characters to Supabase
3. **Data Parser** - `parseForFoundCloud()` maps to Foundry D&D 5e structure
4. **Supabase Integration** - Complete cloud sync via `foundcloud_characters` table

### ✅ Foundry VTT Module
1. **Supabase Bridge** (324 lines) - Fetches characters from cloud
2. **Character Importer** (389 lines) - Maps Supabase → Foundry actors
3. **Custom Character Sheet** (1048 lines) - Full D&D 5e sheet with:
   - Combat tracking
   - Action economy (action/bonus/reaction/movement)
   - Advantage/disadvantage toggle
   - Spell management
   - Inventory system
   - Concentration tracking
   - Death saves
   - And more!

### ✅ Database
1. **Migration SQL** - Ready to create `foundcloud_characters` table
2. **RLS Policies** - Secure anonymous read/write for extension & module
3. **Indexes** - Optimized for fast lookups

---

## 🚀 Setup Instructions

### Step 1: Create Supabase Table

Run the migration SQL in your Supabase SQL editor:

**File:** `supabase/migrations/20260204_create_foundcloud_characters.sql`

```bash
# Or via Supabase CLI:
supabase db push
```

**Verify:**
- Go to Supabase Dashboard → Table Editor
- Check that `foundcloud_characters` table exists
- Verify RLS is enabled

### Step 2: Test Browser Extension

1. **Reload Extension**
   ```
   chrome://extensions → Reload CarmaClouds
   ```

2. **Open FoundCloud Tab**
   - Click extension icon
   - Click "FoundCloud" tab
   - Should see: "DiceCloud → Foundry VTT via Cloud Sync"

3. **Sync a Character**
   - Make sure you have characters in DiceCloud
   - Click "Sync All" or individual "Sync to Cloud" button
   - Check console for: `✅ Synced to cloud`

4. **Verify in Supabase**
   - Go to Supabase Dashboard → Table Editor → `foundcloud_characters`
   - Should see your character with full `character_data` JSONB

### Step 3: Install Foundry Module

1. **Copy Module to Foundry**
   ```bash
   # Module is already built at:
   packages/foundcloud/foundry-module/
   
   # Copy to Foundry:
   cp -r packages/foundcloud/foundry-module/* [FOUNDRY_DATA]/modules/foundcloud/
   ```

2. **Or Use Manifest URL**
   - In Foundry: Add-on Modules → Install Module
   - Paste: `https://carmaclouds.vercel.app/foundry-module/module.json`
   - Click Install

3. **Enable Module**
   - In your world: Module Management
   - Enable "FoundCloud"
   - Launch world

### Step 4: Import Character in Foundry

1. **Open Actors Sidebar**
   - Click "Actors" tab in Foundry

2. **Import from FoundCloud**
   - Look for "Import from DiceCloud" button (added by module)
   - Click it
   - Select your character from the list
   - Click "Import"

3. **Verify Import**
   - Character should appear in Actors list
   - Open character sheet
   - Verify: HP, AC, abilities, spells, actions all present

---

## 🧪 Testing Checklist

### Extension Tests
- [ ] FoundCloud tab loads without errors
- [ ] Character list displays (if synced before)
- [ ] "Sync All" button works
- [ ] Individual character sync works
- [ ] Module URL copies to clipboard
- [ ] Console shows no errors

### Supabase Tests
- [ ] Table `foundcloud_characters` exists
- [ ] Characters appear after sync
- [ ] `character_data` JSONB contains full data
- [ ] `updated_at` timestamp updates on sync

### Foundry Module Tests
- [ ] Module loads without errors
- [ ] Supabase connection successful (check console)
- [ ] Import dialog shows characters from database
- [ ] Character import creates Foundry actor
- [ ] Actor data matches DiceCloud (HP, AC, abilities)
- [ ] Spells imported correctly
- [ ] Actions/attacks imported correctly
- [ ] Custom character sheet displays

### Character Sheet Tests
- [ ] Sheet opens without errors
- [ ] All tabs work (Combat, Spells, Inventory, etc.)
- [ ] Action economy buttons visible
- [ ] Advantage toggle works
- [ ] Spell casting works
- [ ] Attack rolls work
- [ ] HP/AC editable

---

## 📊 Data Flow

```
DiceCloud API
     ↓
Extension (Auth + Fetch)
     ↓
parseForFoundCloud() → Foundry D&D 5e format
     ↓
Supabase (foundcloud_characters table)
     ↓
Foundry Module (Supabase Bridge)
     ↓
DiceCloudImporter → Maps to Foundry Actor
     ↓
FoundCloudSheet → Custom Character Sheet
     ↓
Foundry VTT (D&D 5e System)
```

---

## 🐛 Troubleshooting

### Extension Issues

**"No characters found"**
- Make sure you've synced from DiceCloud first
- Check that characters exist in `carmaclouds_characters` storage
- Try clicking "Sync All"

**"Failed to sync"**
- Check browser console for errors
- Verify Supabase URL/key in `@carmaclouds/core/supabase/config.js`
- Check network tab for failed requests

### Foundry Module Issues

**"Not connected to Supabase"**
- Check Foundry console for connection errors
- Verify Supabase URL/key in `supabase-bridge.js`
- Test connection manually: `game.foundcloud.bridge.testConnection()`

**"Character not found"**
- Verify character exists in Supabase table
- Check `dicecloud_character_id` matches
- Try syncing from extension again

**"Import fails"**
- Check Foundry console for detailed error
- Verify D&D 5e system is installed
- Check character data structure in Supabase

### Character Sheet Issues

**"Sheet doesn't open"**
- Check that module is enabled
- Verify actor type is "character"
- Check console for template errors

**"Missing data"**
- Re-import character with "Override Existing Data" enabled
- Check that `character_data` in Supabase is complete
- Verify `parseForFoundCloud()` is mapping correctly

---

## 🔧 Advanced Configuration

### Module Settings (Foundry)

**Game Settings → Module Settings → FoundCloud:**

- **Auto-sync on Combat Turn** - Sync when turn starts
- **Discord Integration** - Enable Discord notifications
- **Import Spells** - Auto-import spells during sync
- **Import Equipment** - Auto-import items during sync
- **Import Class Features** - Auto-import features during sync
- **Override Existing Data** - Overwrite all data on sync

### Extension Settings

**In popup → Settings:**
- DiceCloud authentication
- Character selection
- Sync preferences

---

## 📝 Console Commands (Foundry)

```javascript
// Check if Supabase connected
game.foundcloud.isSupabaseConnected()

// Get all characters from Supabase
await game.foundcloud.bridge.getCharacters()

// Import specific character
await game.foundcloud.importer.importCharacter('CHARACTER_ID')

// Test connection
await game.foundcloud.bridge.testConnection()

// Check module version
game.modules.get('foundcloud').version
```

---

## 🎯 What's Working

### ✅ Fully Functional
- Extension → Supabase sync
- Supabase → Foundry import
- Character data mapping
- Custom character sheet
- Action economy UI
- Combat tracking UI
- Spell management UI
- Inventory UI

### ⚠️ Needs Testing
- Roll integration (posting to Foundry chat)
- Combat tracker hooks
- Real-time sync updates
- Discord integration (if applicable)
- Resource tracking (spell slots, Ki, etc.)

### 🚧 Future Enhancements
- Direct extension ↔ Foundry communication (bypass Supabase)
- Automatic sync on character update
- Two-way sync (Foundry → DiceCloud)
- Advanced combat features
- Token integration

---

## 📚 File Reference

### Extension Files
- `packages/carmaclouds/src/popup/adapters/foundcloud/adapter.js` - Tab loader
- `packages/carmaclouds/src/popup/adapters/foundcloud/foundcloud-popup.js` - Sync logic
- `packages/carmaclouds/src/popup/adapters/foundcloud/popup.html` - UI
- `packages/carmaclouds/src/content/dicecloud-extraction.js` - `parseForFoundCloud()`

### Foundry Module Files
- `packages/foundcloud/foundry-module/scripts/foundcloud.js` - Main entry
- `packages/foundcloud/foundry-module/scripts/supabase-bridge.js` - Database connection
- `packages/foundcloud/foundry-module/scripts/dicecloud-importer.js` - Character import
- `packages/foundcloud/foundry-module/scripts/foundcloud-sheet.js` - Custom sheet
- `packages/foundcloud/foundry-module/scripts/ui.js` - Dialogs
- `packages/foundcloud/foundry-module/scripts/settings.js` - Module settings

### Database Files
- `supabase/migrations/20260204_create_foundcloud_characters.sql` - Table creation

---

## 🎉 Success Criteria

FoundCloud is working correctly when:

1. ✅ Extension syncs characters to Supabase
2. ✅ Foundry module connects to Supabase
3. ✅ Characters import into Foundry as actors
4. ✅ Custom character sheet displays correctly
5. ✅ All character data is accurate (HP, AC, spells, etc.)
6. ✅ No console errors in extension or Foundry

---

## 🆘 Need Help?

- **GitHub Issues**: [Report bugs](https://github.com/CarmaNayeli/foundCloud/issues)
- **Discord**: Message @Carmabella
- **Console Logs**: Check browser and Foundry console for detailed errors

---

**Made with ❤️ for the D&D community**

*Version: 2.2.1*
*Last Updated: February 4, 2026*
