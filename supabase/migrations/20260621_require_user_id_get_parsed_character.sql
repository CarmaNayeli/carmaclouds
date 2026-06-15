-- Harden get_parsed_character: require the DiceCloud user id.
--
-- 20260620_shared_read_rpcs made p_dicecloud_user_id optional (default null),
-- which let a caller pull a character's parsed payload AND its ir_share_token
-- from a bare dicecloud_character_id (those appear in DiceCloud URLs) using the
-- public anon key. That defeats the share-token gate on get_character_ir, since
-- the token could be fetched with just the char id.
--
-- Import is the "by user id" trust boundary (the player pastes their DiceCloud
-- user id; the picker is list_user_characters(user_id)), so user id is always
-- available here. Make it mandatory and filter strictly by it — no bare-id path.

-- Must DROP first: the existing function has a parameter default, and
-- CREATE OR REPLACE cannot remove defaults ("cannot remove parameter defaults").
DROP FUNCTION IF EXISTS public.get_parsed_character(text, text);

CREATE FUNCTION public.get_parsed_character(
  p_dicecloud_character_id text,
  p_dicecloud_user_id      text
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT to_jsonb(t)
  FROM (
    SELECT c.character_name, c.level, c.class, c.race, c.foundcloud_parsed_data,
           ir.share_token AS ir_share_token
    FROM public.clouds_characters c
    LEFT JOIN public.clouds_character_ir ir
      ON ir.dicecloud_character_id = c.dicecloud_character_id
     AND ir.owner_id IS NOT DISTINCT FROM c.supabase_user_id
    WHERE c.dicecloud_character_id = p_dicecloud_character_id
      AND p_dicecloud_user_id IS NOT NULL
      AND c.user_id_dicecloud = p_dicecloud_user_id
    ORDER BY c.updated_at DESC
    LIMIT 1
  ) t;
$$;

-- Lock execution to the API roles only (DROP above cleared prior grants).
REVOKE EXECUTE ON FUNCTION public.get_parsed_character(text, text) FROM public;
GRANT  EXECUTE ON FUNCTION public.get_parsed_character(text, text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
