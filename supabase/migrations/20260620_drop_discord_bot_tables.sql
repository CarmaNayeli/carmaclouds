-- GDPR/cleanup: drop orphaned Discord-bot + Pip2 tables.
--
-- The Discord bot and Pip2 are cut. The extension references none of these tables,
-- yet they remained anon-readable (USING (true) + GRANT ALL TO anon) while holding
-- Discord user ids, usernames, and message ids. Dropping them removes that personal
-- data and the wide-open surface entirely (data minimisation).
--
-- If the bot/Pip2 is rebuilt later, recreate the schema WITH owner-scoped RLS from
-- the start (auth.uid() = owner), not USING (true).

DROP TABLE IF EXISTS public.clouds_commands CASCADE;
DROP TABLE IF EXISTS public.clouds_turns CASCADE;
DROP TABLE IF EXISTS public.pip2_instances CASCADE;
DROP TABLE IF EXISTS public.guild_command_config CASCADE;

-- Also remove any leftover scheduled jobs that referenced the bot tables.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobname)
    FROM cron.job
    WHERE command ILIKE '%clouds_commands%'
       OR command ILIKE '%clouds_turns%'
       OR command ILIKE '%pip2_instances%';
  END IF;
END $$;

-- NOTE: clouds_pairings (Discord pairing data) is intentionally NOT dropped here —
-- it was already locked to owner-only RLS in the Phase 3 cutover and is FK-referenced
-- by the character tables. Drop it separately if you want it gone too.
