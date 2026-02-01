-- Add multi-app support to auth_tokens table
-- This allows tracking which apps a user uses (rollcloud, owlcloud, foundcloud)
-- and storing platform-specific IDs like Owlbear player ID

-- Add apps array column to track which apps the user uses
ALTER TABLE auth_tokens
ADD COLUMN IF NOT EXISTS apps TEXT[] DEFAULT '{}';

-- Add Owlbear player ID column
ALTER TABLE auth_tokens
ADD COLUMN IF NOT EXISTS owlbear_player_id TEXT;

-- Create index for faster lookups by owlbear_player_id
CREATE INDEX IF NOT EXISTS idx_auth_tokens_owlbear_player_id
ON auth_tokens(owlbear_player_id);

-- Add comment to explain the apps column
COMMENT ON COLUMN auth_tokens.apps IS 'Array of apps the user has connected: rollcloud, owlcloud, foundcloud, etc.';

-- Add comment to explain the owlbear_player_id column
COMMENT ON COLUMN auth_tokens.owlbear_player_id IS 'Owlbear Rodeo player ID for this user, used by OwlCloud';
