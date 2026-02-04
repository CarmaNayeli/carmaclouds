# VTT Data Architecture

## Overview

The CarmaClouds extension now uses a simplified database schema with VTT-specific JSON columns instead of individual stat columns. This allows each VTT platform to have its own optimized data structure.

## Database Schema

### clouds_characters Table

**Metadata Columns:**
- `id` - Primary key (UUID)
- `user_id_dicecloud` - DiceCloud user ID
- `dicecloud_character_id` - DiceCloud character ID (unique)
- `character_name` - Character name
- `created_at` - Record creation timestamp
- `updated_at` - Last update timestamp
- `pairing_id` - Discord pairing ID (if applicable)
- `discord_user_id` - Discord user ID (if applicable)
- `owlbear_player_id` - Owlbear player ID (if applicable)
- `is_active` - Whether character is active
- `notification_color` - Color for notifications
- `supabase_user_id` - Supabase user ID (if using auth)

**Data Columns (all JSONB):**
- `raw_dicecloud_data` - Original DiceCloud API response (stored on sync)
- `roll20_data` - Parsed data for Roll20 (populated when pushing to Roll20)
- `owlbear_data` - Parsed data for Owlbear Rodeo (populated when pushing to Owlbear)
- `foundry_data` - Parsed data for Foundry VTT (populated when pushing to Foundry)

## Data Flow

### 1. Sync to CarmaClouds (from DiceCloud page)

**Trigger:** User clicks "Sync to CarmaClouds" button on DiceCloud character page

**Flow:**
1. `dicecloud.js` extracts character data from DiceCloud API
2. Sends message to `background.js` with type `SYNC_CHARACTER_TO_CARMACLOUDS`
3. `background.js` stores to local storage
4. `background.js` syncs to Supabase with:
   - `user_id_dicecloud`
   - `dicecloud_character_id`
   - `character_name`
   - `raw_dicecloud_data` (full DiceCloud API response)
   - `updated_at`

**Database Update:**
```sql
INSERT INTO clouds_characters (
  user_id_dicecloud,
  dicecloud_character_id,
  character_name,
  raw_dicecloud_data,
  updated_at
) VALUES (...)
ON CONFLICT (dicecloud_character_id) DO UPDATE SET
  raw_dicecloud_data = EXCLUDED.raw_dicecloud_data,
  updated_at = EXCLUDED.updated_at;
```

### 2. Push to Roll20

**Trigger:** User clicks "Push to Roll20" button in extension popup

**Flow:**
1. `rollcloud/adapter.js` loads character from local storage
2. Parses raw data using `parseForRollCloud(character.raw)`
3. Updates database with parsed Roll20 data:
   ```sql
   UPDATE clouds_characters
   SET roll20_data = <parsed_data>,
       updated_at = NOW()
   WHERE dicecloud_character_id = <character_id>;
   ```
4. Sends parsed data to Roll20 content script
5. Content script injects character into Roll20 character sheet

**Parsed Data Structure:**
See `dicecloud-extraction.js` → `parseForRollCloud()` for the complete structure.

### 3. Push to Owlbear Rodeo

**Trigger:** User clicks "Push to Owlbear" button in extension popup

**Flow:**
1. `owlcloud/adapter.js` loads character from local storage
2. Parses raw data using `parseForOwlbear(character.raw)` ⚠️ **TO BE IMPLEMENTED**
3. Updates database with parsed Owlbear data:
   ```sql
   UPDATE clouds_characters
   SET owlbear_data = <parsed_data>,
       updated_at = NOW()
   WHERE dicecloud_character_id = <character_id>;
   ```
4. Sends parsed data to Owlbear content script
5. Content script integrates with Owlbear Rodeo

**Parsed Data Structure:**
⚠️ **TO BE DEFINED** - Will be different from Roll20 format

### 4. Push to Foundry VTT

**Trigger:** User clicks "Push to Foundry" button in extension popup

**Flow:**
1. `foundcloud/adapter.js` loads character from local storage
2. Parses raw data using `parseForFoundry(character.raw)` ⚠️ **TO BE IMPLEMENTED**
3. Updates database with parsed Foundry data:
   ```sql
   UPDATE clouds_characters
   SET foundry_data = <parsed_data>,
       updated_at = NOW()
   WHERE dicecloud_character_id = <character_id>;
   ```
4. Sends parsed data to Foundry content script
5. Content script integrates with Foundry VTT

**Parsed Data Structure:**
⚠️ **TO BE DEFINED** - Will be different from Roll20 format

## Files Modified

### Database
- `database-migration-vtt-json-columns.sql` - Migration to add VTT-specific JSON columns

### Background Worker
- `packages/carmaclouds/src/background.js`
  - Simplified sync payload to only include raw_dicecloud_data
  - Removed individual stat fields from sync

### Roll20 Adapter
- `packages/carmaclouds/src/popup/adapters/rollcloud/adapter.js`
  - Added database update to store `roll20_data` when pushing to Roll20
  - Happens before sending to Roll20 content script

### Owlbear Adapter
- `packages/carmaclouds/src/popup/adapters/owlcloud/adapter.js`
  - ⚠️ **NEEDS UPDATE** - Add database sync for `owlbear_data`
  - ⚠️ **NEEDS PARSER** - Create `parseForOwlbear()` function

### Foundry Adapter
- `packages/carmaclouds/src/popup/adapters/foundcloud/adapter.js`
  - ⚠️ **NEEDS UPDATE** - Add database sync for `foundry_data`
  - ⚠️ **NEEDS PARSER** - Create `parseForFoundry()` function

## Benefits of This Architecture

1. **Cleaner Schema** - No need to maintain dozens of individual columns
2. **VTT-Specific Optimization** - Each VTT can have exactly the data structure it needs
3. **Flexibility** - Easy to add new VTT platforms without schema changes
4. **Caching** - Parsed data is cached in database, no need to re-parse on every load
5. **Raw Data Preservation** - Original DiceCloud data is always available for re-parsing
6. **Smaller Sync Payload** - "Sync to CarmaClouds" only stores raw data, not parsed data

## TODO

- [ ] Run database migration on Supabase
- [ ] Test Roll20 sync with new schema
- [ ] Create `parseForOwlbear()` function
- [ ] Update Owlbear adapter to sync `owlbear_data`
- [ ] Create `parseForFoundry()` function
- [ ] Update Foundry adapter to sync `foundry_data`
- [ ] Update any queries that relied on individual stat columns
- [ ] Test all VTT platforms with new architecture
