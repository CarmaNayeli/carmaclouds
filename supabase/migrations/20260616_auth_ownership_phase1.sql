-- GDPR remediation — Phase 1 (ADDITIVE, non-breaking).
--
-- Goal: give every personal-data table an `owner_id` that points at a real
-- Supabase auth user, so that Phase 3 can replace the current wide-open
-- `USING (true)` policies with proper `auth.uid() = owner_id` isolation.
--
-- This migration ONLY adds columns + self-stamping defaults. It does NOT change
-- any RLS policy, so existing anon-key clients keep working unchanged. The
-- enforcement cutover lives in a later migration (Phase 3) and must not run
-- until the JWT-sending client (Phase 2) is broadly installed AND the Discord
-- bot has moved to the service_role key.
--
-- Prerequisite (Phase 0, done in the Supabase dashboard):
--   Authentication > Providers > enable "Anonymous sign-ins".

-- Default expression: stamp the authenticated caller onto new rows. Under the
-- current anon-key flows auth.uid() is NULL (column stays NULL, harmless);
-- once Phase 2 ships JWTs it resolves to the user's (possibly anonymous) id.
--
-- Table-existence guarded: this DB doesn't necessarily have every table the
-- migration history implies (e.g. foundcloud_characters was never deployed —
-- FoundCloud writes to clouds_characters with a 'foundry' platform tag). Each
-- table that DOES exist gets owner_id; missing ones are skipped with a NOTICE.

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'auth_tokens',          -- crown-jewel: DiceCloud session tokens
    'foundcloud_characters',-- may not exist in this DB
    'clouds_character_ir',  -- system-agnostic IR rows
    'clouds_pairings',      -- Discord linkage (personal data)
    'rollcloud_characters', -- legacy per-adapter table (may not exist)
    'owlcloud_characters'   -- legacy per-adapter table (may not exist)
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS owner_id UUID '
        'DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE', t);
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON public.%I(owner_id)',
        'idx_' || t || '_owner_id', t);
      EXECUTE format(
        'COMMENT ON COLUMN public.%I.owner_id IS %L', t,
        'Supabase auth user that owns this row (Phase 3 RLS key).');
      RAISE NOTICE 'owner_id ensured on public.%', t;
    ELSE
      RAISE NOTICE 'skip: table public.% does not exist', t;
    END IF;
  END LOOP;
END $$;

-- clouds_characters already has supabase_user_id (UUID -> auth.users); it is the
-- owner column for that table. Just make new authenticated writes self-stamp.
DO $$
BEGIN
  IF to_regclass('public.clouds_characters') IS NOT NULL THEN
    ALTER TABLE public.clouds_characters ALTER COLUMN supabase_user_id SET DEFAULT auth.uid();
    RAISE NOTICE 'supabase_user_id default set on public.clouds_characters';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Phase 3 enforcement (DO NOT RUN YET — kept here as the documented target).
-- Ships as its own migration once Phase 2 clients are live and the bot uses
-- service_role. Sketch:
--
--   DROP POLICY "Allow anonymous read access"  ON public.auth_tokens;
--   DROP POLICY "Allow anonymous read access"  ON public.foundcloud_characters;
--   ... (drop every "USING (true)" policy) ...
--
--   CREATE POLICY "Owner can read"   ON public.auth_tokens
--     FOR SELECT TO authenticated USING (auth.uid() = owner_id);
--   CREATE POLICY "Owner can write"  ON public.auth_tokens
--     FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
--   CREATE POLICY "Owner can update" ON public.auth_tokens
--     FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
--   CREATE POLICY "Owner can delete" ON public.auth_tokens
--     FOR DELETE TO authenticated USING (auth.uid() = owner_id);
--   -- service_role bypasses RLS automatically (Discord bot path).
--
-- Repeat per table, using supabase_user_id as the key for clouds_characters.
-- ---------------------------------------------------------------------------
