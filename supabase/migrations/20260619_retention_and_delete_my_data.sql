-- GDPR remediation — retention + right-to-erasure self-service.

-- 1. delete_my_account_data(): erases everything owned by the caller. Owner-scoped
--    (auth.uid()), SECURITY DEFINER so it can clear auth_tokens (which is otherwise
--    RPC-only). Exposed to authenticated users; the popup "Delete my data" button
--    calls it. Tables guarded so it works whether or not each one exists.
CREATE OR REPLACE FUNCTION public.delete_my_account_data()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  u UUID := auth.uid();
BEGIN
  IF u IS NULL THEN
    RAISE EXCEPTION 'delete_my_account_data: not authenticated';
  END IF;
  IF to_regclass('public.clouds_characters')   IS NOT NULL THEN DELETE FROM public.clouds_characters   WHERE supabase_user_id = u; END IF;
  IF to_regclass('public.clouds_character_ir') IS NOT NULL THEN DELETE FROM public.clouds_character_ir WHERE owner_id = u; END IF;
  IF to_regclass('public.foundcloud_characters') IS NOT NULL THEN DELETE FROM public.foundcloud_characters WHERE owner_id = u; END IF;
  IF to_regclass('public.rollcloud_characters')  IS NOT NULL THEN DELETE FROM public.rollcloud_characters  WHERE owner_id = u; END IF;
  IF to_regclass('public.owlcloud_characters')   IS NOT NULL THEN DELETE FROM public.owlcloud_characters   WHERE owner_id = u; END IF;
  IF to_regclass('public.clouds_pairings')       IS NOT NULL THEN DELETE FROM public.clouds_pairings       WHERE owner_id = u; END IF;
  IF to_regclass('public.auth_tokens')           IS NOT NULL THEN DELETE FROM public.auth_tokens           WHERE owner_id = u; END IF;
END $$;
REVOKE ALL ON FUNCTION public.delete_my_account_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account_data() TO authenticated;

-- 2. Retention: purge stale auth tokens daily (they're short-lived and re-created
--    on login). Requires pg_cron (enabled on Supabase). Idempotent: unschedule first.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('cc-cleanup-expired-auth-tokens')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cc-cleanup-expired-auth-tokens');
    PERFORM cron.schedule(
      'cc-cleanup-expired-auth-tokens',
      '0 3 * * *',
      $cron$ DELETE FROM public.auth_tokens
             WHERE token_expires IS NOT NULL
               AND token_expires < now() - interval '7 days' $cron$
    );
  ELSE
    RAISE NOTICE 'pg_cron not enabled — enable it (Database > Extensions) to auto-purge expired tokens.';
  END IF;
END $$;
