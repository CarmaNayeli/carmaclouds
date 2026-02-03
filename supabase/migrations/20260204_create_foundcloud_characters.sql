-- FoundCloud Characters Table
-- Stores DiceCloud character data for Foundry VTT sync

CREATE TABLE IF NOT EXISTS foundcloud_characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dicecloud_character_id TEXT UNIQUE NOT NULL,
  character_name TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  race TEXT,
  class TEXT,
  character_data JSONB NOT NULL,
  platform TEXT[] DEFAULT ARRAY['foundry'],
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on dicecloud_character_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_foundcloud_characters_dicecloud_id 
  ON foundcloud_characters(dicecloud_character_id);

-- Create index on character_name for search
CREATE INDEX IF NOT EXISTS idx_foundcloud_characters_name 
  ON foundcloud_characters(character_name);

-- Create index on updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_foundcloud_characters_updated 
  ON foundcloud_characters(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE foundcloud_characters ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous read access (for Foundry module to import)
CREATE POLICY "Allow anonymous read access"
  ON foundcloud_characters
  FOR SELECT
  TO anon
  USING (true);

-- Policy: Allow anonymous insert/update (for browser extension to sync)
CREATE POLICY "Allow anonymous insert"
  ON foundcloud_characters
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update"
  ON foundcloud_characters
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_foundcloud_characters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
CREATE TRIGGER trigger_foundcloud_characters_updated_at
  BEFORE UPDATE ON foundcloud_characters
  FOR EACH ROW
  EXECUTE FUNCTION update_foundcloud_characters_updated_at();

-- Add comment to table
COMMENT ON TABLE foundcloud_characters IS 'Stores DiceCloud V2 character data for Foundry VTT integration via FoundCloud';
