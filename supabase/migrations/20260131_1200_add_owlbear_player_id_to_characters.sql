-- Add owlbear_player_id column to clouds_characters table
ALTER TABLE public.clouds_characters
ADD COLUMN IF NOT EXISTS owlbear_player_id TEXT;

-- Create index for faster lookups by owlbear_player_id
CREATE INDEX IF NOT EXISTS idx_clouds_characters_owlbear_player_id
ON public.clouds_characters(owlbear_player_id);

-- Add comment explaining the column
COMMENT ON COLUMN public.clouds_characters.owlbear_player_id IS 'Owlbear Rodeo player ID for linking characters to Owlbear sessions';
