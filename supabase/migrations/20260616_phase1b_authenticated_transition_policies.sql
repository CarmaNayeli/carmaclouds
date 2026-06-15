-- GDPR remediation — Phase 1b: transitional permissive policies for `authenticated`.
--
-- Phase 2 clients send an end-user JWT, so PostgREST runs their requests as role
-- `authenticated`, NOT `anon`. Several tables' existing permissive policies are
-- scoped `TO anon`, so an authenticated request matches no policy and RLS denies
-- it (e.g. clouds_character_ir insert → 403 "violates row-level security policy").
--
-- Fix: add matching *permissive* (USING true) policies for the authenticated role
-- so the transition stays non-breaking while owner_id is still being populated.
-- These are deliberately wide-open and TEMPORARY — the Phase 3 cutover drops ALL
-- permissive policies (anon AND authenticated) and replaces them with owner-only
-- (auth.uid() = owner_id / supabase_user_id).
--
-- Idempotent: drops then recreates the named transition policies.

DO $$
DECLARE
  t TEXT;
  -- Every table that Phase 2 clients write/read with a JWT.
  tables TEXT[] := ARRAY[
    'clouds_character_ir', 'clouds_characters',
    'rollcloud_characters', 'owlcloud_characters',  -- legacy per-adapter (if present)
    'foundcloud_characters'                          -- (if present)
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS "transition authenticated select" ON public.%I', t);
      EXECUTE format('DROP POLICY IF EXISTS "transition authenticated insert" ON public.%I', t);
      EXECUTE format('DROP POLICY IF EXISTS "transition authenticated update" ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY "transition authenticated select" ON public.%I FOR SELECT TO authenticated USING (true)', t);
      EXECUTE format(
        'CREATE POLICY "transition authenticated insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', t);
      EXECUTE format(
        'CREATE POLICY "transition authenticated update" ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', t);
      RAISE NOTICE 'transition authenticated policies ensured on public.%', t;
    ELSE
      RAISE NOTICE 'skip: table public.% does not exist', t;
    END IF;
  END LOOP;
END $$;
