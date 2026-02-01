-- Add owlbear_player_id column to rollcloud_characters table
ALTER TABLE rollcloud_characters
ADD COLUMN IF NOT EXISTS owlbear_player_id TEXT;

-- Create index for faster lookups by owlbear_player_id
CREATE INDEX IF NOT EXISTS idx_rollcloud_characters_owlbear_player_id
ON rollcloud_characters(owlbear_player_id);

-- Add comment explaining the column
COMMENT ON COLUMN rollcloud_characters.owlbear_player_id IS 'Owlbear Rodeo player ID for linking characters to Owlbear sessions';
