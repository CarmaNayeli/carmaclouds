-- GDPR remediation — data minimisation: drop dead legacy columns on auth_tokens.
--
-- After Phase 2.5/3 the token is stored encrypted (dicecloud_token_enc) and read
-- via the owner-scoped RPCs. These columns are no longer written or read:
--   * dicecloud_token       — old PLAINTEXT token (superseded by ciphertext)
--   * user_id               — old browser-fingerprint hash (pseudonymous personal data)
--   * browser_info          — userAgent etc. (kept "for debugging")
--   * discord_user_id/username/global_name — Discord bot is cut
-- Removing them deletes the last plaintext credential + the fingerprint data.

ALTER TABLE public.auth_tokens
  DROP COLUMN IF EXISTS dicecloud_token,
  DROP COLUMN IF EXISTS user_id,
  DROP COLUMN IF EXISTS browser_info,
  DROP COLUMN IF EXISTS discord_user_id,
  DROP COLUMN IF EXISTS discord_username,
  DROP COLUMN IF EXISTS discord_global_name;

-- Drop the debug view if it referenced any dropped columns (recreated only if needed).
DROP VIEW IF EXISTS public.auth_tokens_debug;
