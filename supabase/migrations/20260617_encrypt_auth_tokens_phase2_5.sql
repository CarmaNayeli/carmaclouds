-- GDPR remediation — Phase 2.5: encrypt DiceCloud tokens at rest.
--
-- Keeps server-side token storage (cross-browser sync) but makes the token
-- meaningless to anyone who only has the anon key or a raw DB dump:
--   * the encryption key lives in Supabase Vault (never shipped to the client);
--   * the token column holds pgcrypto ciphertext;
--   * read/write go through SECURITY DEFINER RPCs that only ever touch the row
--     where owner_id = auth.uid(), so one user can never decrypt another's token.
--
-- DEPENDS ON: Phase 1 owner_id column + the Phase 3 owner-only RLS. Apply this
-- AT the cutover, not before — until RLS restricts reads, encryption is moot.
--
-- Prereqs: extensions pgcrypto + supabase_vault enabled (Supabase has both).

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- 1. Encryption key in Vault. Generates a strong random passphrase once; rerunning
--    is a no-op (the secret name is unique). To rotate, delete+recreate and
--    re-encrypt existing rows.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'dicecloud_token_key') THEN
    PERFORM vault.create_secret(
      encode(gen_random_bytes(32), 'hex'),
      'dicecloud_token_key',
      'Symmetric key for encrypting DiceCloud session tokens at rest'
    );
  END IF;
END $$;

-- 2. Ciphertext column. The legacy plaintext `dicecloud_token` is dropped at the
--    end of this migration once data is migrated.
ALTER TABLE public.auth_tokens
  ADD COLUMN IF NOT EXISTS dicecloud_token_enc BYTEA;

-- 2a. Relax legacy NOT NULL columns the new RPC doesn't populate (the old
--     fingerprint `user_id` and plaintext `dicecloud_token`). They are dropped
--     entirely at the Phase 3 cutover; until then they must allow NULL so the
--     encrypted-store RPC can insert a row without them.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='auth_tokens' AND column_name='user_id') THEN
    EXECUTE 'ALTER TABLE public.auth_tokens ALTER COLUMN user_id DROP NOT NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='auth_tokens' AND column_name='dicecloud_token') THEN
    EXECUTE 'ALTER TABLE public.auth_tokens ALTER COLUMN dicecloud_token DROP NOT NULL';
  END IF;
END $$;

-- 3. Internal helpers (run as definer; can read Vault). Not exposed to anon/auth.
CREATE OR REPLACE FUNCTION public._dicecloud_token_key()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER SET search_path = public, vault AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'dicecloud_token_key';
$$;
REVOKE ALL ON FUNCTION public._dicecloud_token_key() FROM PUBLIC, anon, authenticated;

-- 4. Owner-scoped write RPC. Upserts the caller's own token row, encrypted.
CREATE OR REPLACE FUNCTION public.store_my_dicecloud_token(
  p_token TEXT,
  p_username TEXT DEFAULT 'DiceCloud User',
  p_user_id_dicecloud TEXT DEFAULT NULL,
  p_token_expires TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_owner UUID := auth.uid();
BEGIN
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'store_my_dicecloud_token: not authenticated';
  END IF;
  INSERT INTO public.auth_tokens (owner_id, dicecloud_token_enc, username, user_id_dicecloud, token_expires, updated_at)
  VALUES (
    v_owner,
    pgp_sym_encrypt(p_token, public._dicecloud_token_key()),
    p_username, p_user_id_dicecloud, p_token_expires, now()
  )
  ON CONFLICT (owner_id) DO UPDATE SET
    dicecloud_token_enc = EXCLUDED.dicecloud_token_enc,
    username            = EXCLUDED.username,
    user_id_dicecloud   = EXCLUDED.user_id_dicecloud,
    token_expires       = EXCLUDED.token_expires,
    updated_at          = now();
END $$;
REVOKE ALL ON FUNCTION public.store_my_dicecloud_token(TEXT, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.store_my_dicecloud_token(TEXT, TEXT, TEXT, TIMESTAMPTZ) TO authenticated;

-- 5. Owner-scoped read RPC. Returns ONLY the caller's decrypted token.
CREATE OR REPLACE FUNCTION public.get_my_dicecloud_token()
RETURNS TABLE (token TEXT, username TEXT, user_id_dicecloud TEXT, token_expires TIMESTAMPTZ)
LANGUAGE sql SECURITY DEFINER SET search_path = public, extensions AS $$
  SELECT
    pgp_sym_decrypt(t.dicecloud_token_enc, public._dicecloud_token_key()),
    t.username, t.user_id_dicecloud, t.token_expires
  FROM public.auth_tokens t
  WHERE t.owner_id = auth.uid()
    AND t.dicecloud_token_enc IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.get_my_dicecloud_token() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_dicecloud_token() TO authenticated;

-- 6. owner_id must be unique for the ON CONFLICT upsert above.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'auth_tokens_owner_id_key'
  ) THEN
    ALTER TABLE public.auth_tokens ADD CONSTRAINT auth_tokens_owner_id_key UNIQUE (owner_id);
  END IF;
END $$;

-- 7. After the client is switched to the RPCs and any existing rows are migrated,
--    drop the plaintext column (run once verified):
--    ALTER TABLE public.auth_tokens DROP COLUMN dicecloud_token;
--    Also drop the now-unused fingerprint/discord columns (bot is cut):
--    ALTER TABLE public.auth_tokens
--      DROP COLUMN IF EXISTS discord_user_id,
--      DROP COLUMN IF EXISTS discord_username,
--      DROP COLUMN IF EXISTS discord_global_name,
--      DROP COLUMN IF EXISTS browser_info;
