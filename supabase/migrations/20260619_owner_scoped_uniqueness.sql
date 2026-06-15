-- GDPR remediation — owner-scoped uniqueness (robustness hardening).
--
-- The uniqueness keys were owner-AGNOSTIC, so once owner-only RLS is enforced an
-- ownership change (anon -> account) or two users syncing the same DiceCloud
-- character collide:
--   * clouds_characters: UNIQUE (user_id_dicecloud, dicecloud_character_id)
--   * clouds_character_ir: GLOBAL UNIQUE (dicecloud_character_id)
-- Re-key both to (owner, dicecloud_character_id). Upsert on_conflict targets in
-- the client are updated to match (sync.ts, owlcloud adapter).

-- clouds_characters → unique (supabase_user_id, dicecloud_character_id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idx_clouds_characters_unique_char') THEN
    ALTER TABLE public.clouds_characters DROP CONSTRAINT idx_clouds_characters_unique_char;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_clouds_characters_unique_char') THEN
    DROP INDEX public.idx_clouds_characters_unique_char;
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS idx_clouds_characters_owner_char
  ON public.clouds_characters (supabase_user_id, dicecloud_character_id);

-- clouds_character_ir → drop global unique on dicecloud_character_id, add
-- unique (owner_id, dicecloud_character_id).
DO $$
DECLARE c TEXT;
BEGIN
  SELECT conname INTO c FROM pg_constraint
   WHERE conrelid = 'public.clouds_character_ir'::regclass AND contype = 'u'
     AND pg_get_constraintdef(oid) ILIKE '%(dicecloud_character_id)%';
  IF c IS NOT NULL THEN EXECUTE format('ALTER TABLE public.clouds_character_ir DROP CONSTRAINT %I', c); END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS idx_clouds_character_ir_owner_char
  ON public.clouds_character_ir (owner_id, dicecloud_character_id);
