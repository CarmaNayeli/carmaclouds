# Supabase Migration Guide

## Overview

This guide helps you migrate your OwlCloud/RollCloud database to a new Supabase project with updated table names for multi-project compatibility.

## Table Name Changes

All tables now use the `clouds_` prefix for better multi-project support:

| Old Name | New Name |
|----------|----------|
| `rollcloud_characters` | `clouds_characters` |
| `rollcloud_pairings` | `clouds_pairings` |
| `owlcloud_commands` | `clouds_commands` |
| `owlcloud_turns` | `clouds_turns` |
| `auth_tokens` | `auth_tokens` (no change) |
| `pip2_instances` | `pip2_instances` (no change) |
| `guild_command_config` | `guild_command_config` (no change) |

## Storage Bucket Name Change

| Old Name | New Name |
|----------|----------|
| `owlcloud-assets` | `clouds-assets` |

---

## Migration Steps

### 1. Create New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project
3. Note down your new:
   - Project URL
   - Anon (public) key
   - Service role key

### 2. Run Migration SQL

1. Open the Supabase SQL Editor in your new project
2. Copy the entire contents of `MIGRATION_CONSOLIDATED.sql`
3. Paste and run it
4. Wait for all tables, indexes, policies, and functions to be created

### 3. Create Storage Bucket

1. Go to Storage in the Supabase Dashboard
2. Click "New bucket"
3. Name it `clouds-assets`
4. Set it to **Public**
5. Click "Create bucket"

### 4. Deploy Edge Functions

Deploy all edge functions to the new project:

```bash
# Login to Supabase CLI
supabase login

# Link to your new project
supabase link --project-ref YOUR_NEW_PROJECT_REF

# Deploy all functions
supabase functions deploy get-active-character
supabase functions deploy get-all-characters
supabase functions deploy set-active-character
supabase functions deploy update-character-hp
supabase functions deploy link-owlbear-player
supabase functions deploy upload-token-image
supabase functions deploy broadcast-command
supabase functions deploy server-config
```

### 5. Update Code References

You'll need to update table names in the following files:

#### Edge Functions (already using correct names in current code)

- `supabase/functions/get-active-character/index.ts` - Change `rollcloud_characters` → `clouds_characters`
- `supabase/functions/get-all-characters/index.ts` - Change `rollcloud_characters` → `clouds_characters`
- `supabase/functions/set-active-character/index.ts` - Change `rollcloud_characters` → `clouds_characters`
- `supabase/functions/update-character-hp/index.ts` - Change `rollcloud_characters` → `clouds_characters`
- `supabase/functions/link-owlbear-player/index.ts` - Change `rollcloud_characters` → `clouds_characters`

#### Browser Extension

Search for table name references in:
- `src/lib/supabase-client.js`
- `dist/chrome/src/background.js`
- Any files that reference `rollcloud_characters`, `rollcloud_pairings`, etc.

#### Storage Bucket References

Search for `owlcloud-assets` and replace with `clouds-assets`:
- `supabase/functions/upload-token-image/index.ts`
- `owlbear-extension/popover.js`
- Any other files referencing the storage bucket

#### Environment Variables

Update your `.env` files and Supabase Edge Function secrets:

```bash
# Update these environment variables
SUPABASE_URL=https://YOUR_NEW_PROJECT.supabase.co
SUPABASE_ANON_KEY=your_new_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_new_service_role_key
```

For edge functions:
```bash
supabase secrets set SUPABASE_URL=https://YOUR_NEW_PROJECT.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your_new_anon_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_new_service_role_key
```

### 6. Update Hardcoded References

In `src/lib/supabase-client.js`, update the hardcoded Supabase URL and key:

```javascript
// OLD
const SUPABASE_URL = 'https://gkfpxwvmumaylahtxqrk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// NEW
const SUPABASE_URL = 'https://YOUR_NEW_PROJECT.supabase.co'
const SUPABASE_ANON_KEY = 'your_new_anon_key_here'
```

### 7. Test Everything

After migration, test:

1. **Character Sync**: Open DiceCloud, verify character data syncs
2. **Discord Pairing**: Test `/owlcloud` command and pairing
3. **Token Uploads**: Drag a character token to Owlbear, verify it uploads
4. **Owlbear Popover**: Open the popover in Owlbear, verify character data loads
5. **Discord Commands**: Test bot commands from Discord
6. **Edge Functions**: Check function logs for errors

### 8. Data Migration (Optional)

If you need to migrate existing data from the old project:

1. Export data from old project using Supabase Dashboard or pg_dump
2. Transform table names in the export (rollcloud_* → clouds_*)
3. Import into new project

**Note**: This is optional if you're starting fresh or data is not critical.

---

## Validation Checklist

- [ ] MIGRATION_CONSOLIDATED.sql runs without errors
- [ ] All tables created (auth_tokens, clouds_characters, clouds_pairings, clouds_commands, clouds_turns, pip2_instances, guild_command_config)
- [ ] All indexes created
- [ ] All RLS policies created
- [ ] All triggers created
- [ ] Storage bucket `clouds-assets` created and set to public
- [ ] Edge functions deployed
- [ ] Edge function environment variables updated
- [ ] Extension code updated with new table names
- [ ] Extension code updated with new Supabase URL/keys
- [ ] Storage bucket name updated in code
- [ ] Character sync works
- [ ] Discord pairing works
- [ ] Token upload works
- [ ] Owlbear popover works
- [ ] Discord bot commands work

---

## Rollback Plan

If something goes wrong:

1. Keep your old Supabase project active
2. Revert environment variables to old project
3. Debug issues in new project without affecting users
4. Switch back when ready

---

## Questions?

Check the following files for reference:
- `MIGRATION_CONSOLIDATED.sql` - Complete migration script
- `supabase/functions/` - Edge functions that need table name updates
- `src/lib/supabase-client.js` - Client code with hardcoded credentials

---

## Post-Migration Optimizations

After successful migration, consider:

1. **Implement Caching** (from the caching plan):
   - HTTP caching headers in edge functions ✅ (already implemented)
   - IndexedDB caching in browser extension ✅ (already implemented)
   - Token image blob caching
   - localStorage caching in Owlbear popover

2. **Monitor Egress**: Check Supabase dashboard to ensure caching reduces egress by 80-90%

3. **Set Up Alerts**: Configure Supabase alerts for high usage
