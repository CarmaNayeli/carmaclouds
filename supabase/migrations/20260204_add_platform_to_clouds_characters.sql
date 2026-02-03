-- Add platform support to clouds_characters table
-- Allows tracking which apps (owlcloud, foundcloud, rollcloud) use each character

-- Add platform array field
ALTER TABLE public.clouds_characters 
ADD COLUMN IF NOT EXISTS platform TEXT[] DEFAULT '{}';

-- Create GIN index for efficient array queries
CREATE INDEX IF NOT EXISTS idx_clouds_characters_platform 
ON public.clouds_characters USING GIN (platform);

-- Add comment for documentation
COMMENT ON COLUMN public.clouds_characters.platform 
IS 'Array of platforms using this character: owlcloud, foundcloud, rollcloud';

-- Update existing OwlCloud characters to have platform identifier
UPDATE public.clouds_characters 
SET platform = ARRAY['owlcloud']
WHERE owlbear_player_id IS NOT NULL 
AND (platform IS NULL OR platform = '{}');

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Platform field added to clouds_characters table';
  RAISE NOTICE 'Existing OwlCloud characters updated with platform identifier';
END $$;
