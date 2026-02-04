-- Add supabase_user_id column to clouds_characters table for cross-device auth
ALTER TABLE public.clouds_characters
ADD COLUMN IF NOT EXISTS supabase_user_id UUID;

-- Create index for faster lookups by supabase_user_id
CREATE INDEX IF NOT EXISTS idx_clouds_characters_supabase_user_id
ON public.clouds_characters(supabase_user_id);

-- Add foreign key reference to auth.users (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_clouds_characters_supabase_user'
  ) THEN
    ALTER TABLE public.clouds_characters
    ADD CONSTRAINT fk_clouds_characters_supabase_user
    FOREIGN KEY (supabase_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add comment explaining the column
COMMENT ON COLUMN public.clouds_characters.supabase_user_id IS 'Supabase auth user ID for cross-device character sync';
