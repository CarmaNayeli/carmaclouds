-- Shared read RPCs for cross-project consumers (Coyotes & Candles VTT).
--
-- WHY THIS EXISTS:
--   C&C's "meet" VTT reads synced characters straight from this project with the
--   public anon key: the import picker reads `clouds_characters`, and the
--   "IR view (beta)" reads `clouds_character_ir`. That only worked because those
--   tables shipped wide-open `anon ... USING (true)` policies.
--
--   The GDPR remediation (20260618 phase-3 cutover) makes those tables
--   OWNER-ONLY (`TO authenticated USING (auth.uid() = owner_id / supabase_user_id)`),
--   which is correct - but it drops all anon access, so C&C's anon-key reads would
--   return nothing and the IR view + import would silently break.
--
--   These SECURITY DEFINER functions are the sanctioned, narrow bridge: anon may
--   call them to read EXACTLY the fields C&C needs and nothing else. The
--   underlying tables stay locked down - no table SELECT, no INSERT, no UPDATE.
--
-- ACCESS MODEL (two trust levels, mirroring how the product already works):
--   * IMPORT (user-initiated): list_user_characters / get_parsed_character are
--     keyed by the DiceCloud USER id. This matches the existing UX, which lets a
--     player paste their DiceCloud user id to pull their roster - i.e. "by user
--     id" is the accepted import trust boundary (the same as DiceCloud's own
--     share-by-link model).
--   * PASSIVE IR RENDER (auto-loaded on the board): get_character_ir requires a
--     per-character SHARE TOKEN, so a bare DiceCloud character id (which appears
--     in DiceCloud URLs) cannot trigger an IR read on its own. The importer
--     obtains the token from get_parsed_character at import time and stores it on
--     the C&C sheet; the IR view passes it back. This needs NO extension change.
--
-- POST-CUTOVER CORRECTNESS:
--   20260619_owner_scoped_uniqueness re-keys both tables to
--   (owner, dicecloud_character_id), so `dicecloud_character_id` is no longer
--   globally unique. Reads are therefore disambiguated by the DiceCloud user id
--   (import) or by the unique share token (IR view), never a bare-id `limit 1`.
--
-- All functions: SECURITY DEFINER (bypass RLS), STABLE, pinned search_path,
-- return jsonb (type-agnostic), EXECUTE granted to anon + authenticated only.

set search_path = public;

-- ─── share token on the IR rows ───────────────────────────────────────────────
-- Per-character capability secret. NOT NULL + default backfills every existing
-- row with a random token. On upsert (extension sync uses merge-duplicates and
-- never sends this column) the existing token is preserved, so it stays stable
-- across re-syncs.
alter table public.clouds_character_ir
  add column if not exists share_token uuid not null default gen_random_uuid();

-- ─── 1. Summary list of a DiceCloud user's synced characters (import picker) ────
create or replace function public.list_user_characters(p_dicecloud_user_id text)
returns jsonb
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'dicecloud_character_id', c.dicecloud_character_id,
        'character_name',         c.character_name,
        'level',                  c.level,
        'class',                  c.class,
        'race',                   c.race
      )
      order by c.updated_at desc
    ),
    '[]'::jsonb
  )
  from public.clouds_characters c
  where c.user_id_dicecloud = p_dicecloud_user_id;
$$;

-- ─── 2. Full parsed payload for one character + its IR share token (import) ─────
-- Scoped by the DiceCloud user id so it stays deterministic once the tables are
-- owner-keyed. The joined IR token lets the importer store it on the C&C sheet so
-- the passive IR view can later read the IR (which is token-gated below). The
-- join matches the IR row owned by the same auth user as the clouds_characters
-- row; `is not distinct from` makes the pre-cutover all-NULL state join too.
create or replace function public.get_parsed_character(
  p_dicecloud_character_id text,
  p_dicecloud_user_id      text default null
)
returns jsonb
language sql
security definer
stable
set search_path = ''
as $$
  select to_jsonb(t)
  from (
    select c.character_name, c.level, c.class, c.race, c.foundcloud_parsed_data,
           ir.share_token as ir_share_token
    from public.clouds_characters c
    left join public.clouds_character_ir ir
      on ir.dicecloud_character_id = c.dicecloud_character_id
     and ir.owner_id is not distinct from c.supabase_user_id
    where c.dicecloud_character_id = p_dicecloud_character_id
      and (p_dicecloud_user_id is null or c.user_id_dicecloud = p_dicecloud_user_id)
    order by c.updated_at desc
    limit 1
  ) t;
$$;

-- ─── 3. IR for one character, gated by the share token (IR view) ───────────────
create or replace function public.get_character_ir(
  p_dicecloud_character_id text,
  p_share_token            uuid
)
returns jsonb
language sql
security definer
stable
set search_path = ''
as $$
  select ir
  from public.clouds_character_ir
  where dicecloud_character_id = p_dicecloud_character_id
    and share_token = p_share_token
  limit 1;
$$;

-- Drop the old single-arg signatures if a prior version of this migration created
-- them (overloads would otherwise linger and bypass the new gating).
drop function if exists public.get_character_ir(text);
drop function if exists public.get_parsed_character(text);

-- Lock execution to the API roles only (not the broad public pseudo-role).
revoke execute on function public.list_user_characters(text)        from public;
revoke execute on function public.get_parsed_character(text, text)   from public;
revoke execute on function public.get_character_ir(text, uuid)       from public;

grant execute on function public.list_user_characters(text)        to anon, authenticated;
grant execute on function public.get_parsed_character(text, text)   to anon, authenticated;
grant execute on function public.get_character_ir(text, uuid)       to anon, authenticated;

notify pgrst, 'reload schema';
