-- GDPR remediation — Phase 3 CUTOVER (BREAKING). Run ONCE, deliberately.
--
-- PREREQUISITES (all must be true before running):
--   * Phase 1  (owner_id columns)        applied.
--   * Phase 1b (transition policies)     applied.
--   * Phase 2.5 (encrypt_auth_tokens)    applied  (Vault key + RPCs exist).
--   * The Phase 2 JWT client is installed by every active user.
--   * Users have been told they must re-log in and re-sync (data is WIPED below).
--
-- This is the moment the wide-open `USING (true)` access ends. After it, every
-- personal-data table is readable/writable ONLY by its authenticated owner
-- (auth.uid() = owner_id, or supabase_user_id for clouds_characters), and
-- auth_tokens is reachable only through the encrypted owner-scoped RPCs.

-- 0. WIPE legacy/unowned data. Only a couple of real users; a clean slate avoids
--    any backfill and purges the old plaintext tokens + fingerprint rows.
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'auth_tokens', 'clouds_characters', 'clouds_character_ir',
    'foundcloud_characters', 'rollcloud_characters', 'owlcloud_characters',
    'clouds_pairings'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('TRUNCATE TABLE public.%I CASCADE', t);
      RAISE NOTICE 'wiped public.%', t;
    END IF;
  END LOOP;
END $$;

-- 1. Drop EVERY existing policy on these tables (legacy "Allow anonymous …",
--    "Users can …", and the Phase 1b "transition …" ones) — by name, dynamically,
--    so we don't depend on remembering each policy's name.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'auth_tokens', 'clouds_characters', 'clouds_character_ir',
        'foundcloud_characters', 'rollcloud_characters', 'owlcloud_characters',
        'clouds_pairings'
      ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 2. Owner-only policies for the owner_id tables.
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'clouds_character_ir', 'foundcloud_characters',
    'rollcloud_characters', 'owlcloud_characters', 'clouds_pairings'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('CREATE POLICY "Owner can select" ON public.%I FOR SELECT TO authenticated USING (auth.uid() = owner_id)', t);
      EXECUTE format('CREATE POLICY "Owner can insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id)', t);
      EXECUTE format('CREATE POLICY "Owner can update" ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id)', t);
      EXECUTE format('CREATE POLICY "Owner can delete" ON public.%I FOR DELETE TO authenticated USING (auth.uid() = owner_id)', t);
      RAISE NOTICE 'owner-only policies set on public.%', t;
    END IF;
  END LOOP;
END $$;

-- 3. clouds_characters uses supabase_user_id as its owner column.
DO $$
BEGIN
  IF to_regclass('public.clouds_characters') IS NOT NULL THEN
    ALTER TABLE public.clouds_characters ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Owner can select" ON public.clouds_characters FOR SELECT TO authenticated USING (auth.uid() = supabase_user_id);
    CREATE POLICY "Owner can insert" ON public.clouds_characters FOR INSERT TO authenticated WITH CHECK (auth.uid() = supabase_user_id);
    CREATE POLICY "Owner can update" ON public.clouds_characters FOR UPDATE TO authenticated USING (auth.uid() = supabase_user_id) WITH CHECK (auth.uid() = supabase_user_id);
    CREATE POLICY "Owner can delete" ON public.clouds_characters FOR DELETE TO authenticated USING (auth.uid() = supabase_user_id);
    RAISE NOTICE 'owner-only policies set on public.clouds_characters';
  END IF;
END $$;

-- 4. auth_tokens: NO anon/authenticated table policies remain (dropped in step 1).
--    RLS stays ON, so the table is reachable only via the SECURITY DEFINER RPCs
--    (store_my_/get_my_dicecloud_token) and the service_role. A leaked anon key
--    now gets exactly nothing from it.
ALTER TABLE public.auth_tokens ENABLE ROW LEVEL SECURITY;

-- NOTE (known edge): clouds_character_ir.dicecloud_character_id is globally UNIQUE,
-- so two different owners cannot both hold the same DiceCloud character id; the
-- second importer's upsert will be denied by the owner check. Acceptable for now;
-- revisit if shared-character import is ever needed (make the key (owner_id, id)).
