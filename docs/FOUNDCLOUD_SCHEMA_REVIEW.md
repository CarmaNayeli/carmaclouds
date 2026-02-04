# FoundCloud Database Schema Review

## 📊 Current Database Structure

### Existing Tables

**1. `clouds_characters`** (Main character storage - used by OwlCloud)
- Stores all character data with full JSONB fields
- Has all necessary fields for D&D 5e characters
- Already has RLS policies for anon access
- **This is the table we should use for FoundCloud!**

**2. `clouds_pairings`** (Discord pairing)
- Links users to Discord webhooks
- Used for Discord integration

**3. `auth_tokens`** (Authentication)
- Stores DiceCloud tokens
- Has `apps` array field for multi-app support

**4. `rollcloud_characters`** (Roll20-specific)
- Separate table for Roll20 data
- Has additional Roll20-specific fields

---

## 🎯 Recommendation: Use `clouds_characters` for FoundCloud

### Why Not Create `foundcloud_characters`?

The existing `clouds_characters` table already has:
- ✅ All D&D 5e character fields (HP, AC, abilities, etc.)
- ✅ `raw_dicecloud_data` JSONB for full data storage
- ✅ RLS policies configured
- ✅ Proper indexes
- ✅ Multi-app support ready

Creating a separate `foundcloud_characters` table would:
- ❌ Duplicate data unnecessarily
- ❌ Require maintaining two identical schemas
- ❌ Complicate character sharing between apps
- ❌ Waste database storage

### Schema Comparison

**`clouds_characters` (existing):**
```sql
CREATE TABLE public.clouds_characters (
    id UUID PRIMARY KEY,
    user_id_dicecloud VARCHAR(255) NOT NULL,
    dicecloud_character_id VARCHAR(255) NOT NULL,
    character_name VARCHAR(255) NOT NULL,
    race VARCHAR(100),
    class VARCHAR(100),
    level INTEGER DEFAULT 1,
    alignment VARCHAR(50),
    hit_points JSONB,
    hit_dice JSONB,
    temporary_hp INTEGER DEFAULT 0,
    death_saves JSONB,
    inspiration BOOLEAN DEFAULT false,
    armor_class INTEGER DEFAULT 10,
    speed INTEGER DEFAULT 30,
    initiative INTEGER DEFAULT 0,
    proficiency_bonus INTEGER DEFAULT 2,
    attributes JSONB,
    attribute_mods JSONB,
    saves JSONB,
    skills JSONB,
    spell_slots JSONB,
    resources JSONB,
    conditions JSONB,
    raw_dicecloud_data JSONB,  -- Full character data here!
    pairing_id UUID,
    discord_user_id VARCHAR(255),
    owlbear_player_id TEXT,     -- OwlCloud uses this
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

**What FoundCloud needs:**
- ✅ All fields above (already present)
- ✅ `raw_dicecloud_data` for full character (already present)
- ✅ Platform identification (can use existing `owlbear_player_id` pattern or add `platform` field)

---

## 🔧 Required Changes

### 1. Add Platform Support to `clouds_characters`

**Option A: Add `platform` array field (RECOMMENDED)**
```sql
ALTER TABLE public.clouds_characters 
ADD COLUMN IF NOT EXISTS platform TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.clouds_characters.platform 
IS 'Array of platforms using this character: owlcloud, foundcloud, etc.';
```

**Option B: Add `foundry_actor_id` field**
```sql
ALTER TABLE public.clouds_characters 
ADD COLUMN IF NOT EXISTS foundry_actor_id TEXT;

COMMENT ON COLUMN public.clouds_characters.foundry_actor_id 
IS 'Foundry VTT actor ID for linking to Foundry actors';
```

### 2. Update Extension Code

**`foundcloud-popup.js`** - Change table name:
```javascript
// FROM:
const { error } = await supabase
  .from('foundcloud_characters')
  .upsert(characterData, { onConflict: 'dicecloud_character_id' });

// TO:
const { error } = await supabase
  .from('clouds_characters')
  .upsert({
    ...characterData,
    platform: ['foundcloud'],  // Add platform identifier
    owlbear_player_id: null    // Not used by Foundry
  }, { onConflict: 'dicecloud_character_id' });
```

### 3. Update Foundry Module

**`supabase-bridge.js`** - Change table name:
```javascript
// FROM:
const { data, error } = await this.supabase
  .from('foundcloud_characters')
  .select('*')

// TO:
const { data, error } = await this.supabase
  .from('clouds_characters')
  .select('*')
  .contains('platform', ['foundcloud'])  // Filter for Foundry characters
```

**`dicecloud-importer.js`** - Update field mappings:
- Already uses correct field names
- Just needs table name change

---

## 📋 Migration Plan

### Step 1: Add Platform Field (Optional but Recommended)
```sql
-- Run in Supabase SQL Editor
ALTER TABLE public.clouds_characters 
ADD COLUMN IF NOT EXISTS platform TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_clouds_characters_platform 
ON public.clouds_characters USING GIN (platform);

COMMENT ON COLUMN public.clouds_characters.platform 
IS 'Array of platforms using this character: owlcloud, foundcloud, rollcloud';
```

### Step 2: Update Extension Code
- Modify `foundcloud-popup.js` to use `clouds_characters`
- Add `platform: ['foundcloud']` to character data
- Update sync logic

### Step 3: Update Foundry Module
- Modify `supabase-bridge.js` to use `clouds_characters`
- Filter by `platform` array if field exists
- Update all queries

### Step 4: Test
- Sync character from extension
- Verify in Supabase `clouds_characters` table
- Import in Foundry
- Verify all data present

---

## 🎯 Benefits of Shared Table

1. **Data Consistency**: One source of truth for character data
2. **Cross-Platform**: Characters can be used in both OwlCloud and FoundCloud
3. **Simplified Maintenance**: One schema to maintain
4. **Storage Efficiency**: No duplicate character data
5. **Future-Proof**: Easy to add more platforms (RollCloud, etc.)

---

## 🚀 Next Steps

1. ✅ Add `platform` field to `clouds_characters` (optional)
2. ✅ Update `foundcloud-popup.js` to use `clouds_characters`
3. ✅ Update `supabase-bridge.js` to use `clouds_characters`
4. ✅ Update `dicecloud-importer.js` field mappings
5. ✅ Test sync flow
6. ✅ Delete `20260204_create_foundcloud_characters.sql` migration (not needed)

---

## 📝 SQL to Run

```sql
-- Add platform support to existing table
ALTER TABLE public.clouds_characters 
ADD COLUMN IF NOT EXISTS platform TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_clouds_characters_platform 
ON public.clouds_characters USING GIN (platform);

COMMENT ON COLUMN public.clouds_characters.platform 
IS 'Array of platforms using this character: owlcloud, foundcloud, rollcloud';

-- Update existing OwlCloud characters to have platform
UPDATE public.clouds_characters 
SET platform = ARRAY['owlcloud']
WHERE owlbear_player_id IS NOT NULL 
AND (platform IS NULL OR platform = '{}');
```

---

**Conclusion**: Use the existing `clouds_characters` table with a `platform` array field to identify which apps are using each character. This is cleaner, more efficient, and follows the existing pattern.
