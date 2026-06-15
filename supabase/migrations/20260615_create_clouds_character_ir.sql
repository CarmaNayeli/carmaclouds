-- CarmaClouds system-agnostic IR table
-- Stores the normalized, system-agnostic intermediate representation (IR) of a
-- DiceCloud character (see REBUILD.md). Kept separate from the legacy
-- clouds_characters / foundcloud_characters tables so the rebuild can run
-- alongside the old D&D-shaped data during migration.

CREATE TABLE IF NOT EXISTS clouds_character_ir (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dicecloud_character_id TEXT UNIQUE NOT NULL,
  character_name TEXT NOT NULL,
  -- Best-effort hint only ('dnd5e' | 'generic' | ...). Never load-bearing.
  system_hint TEXT,
  -- Full IRCharacter as produced by @carmaclouds/core normalize().
  ir JSONB NOT NULL,
  -- IR schema version, so consumers can migrate shape over time.
  ir_version INTEGER NOT NULL DEFAULT 1,
  -- Optional raw DiceCloud snapshot, to re-normalize without re-fetching.
  raw JSONB,
  platform TEXT[] DEFAULT ARRAY[]::TEXT[],
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clouds_character_ir_dicecloud_id
  ON clouds_character_ir(dicecloud_character_id);

CREATE INDEX IF NOT EXISTS idx_clouds_character_ir_name
  ON clouds_character_ir(character_name);

CREATE INDEX IF NOT EXISTS idx_clouds_character_ir_updated
  ON clouds_character_ir(updated_at DESC);

-- Row Level Security, matching the existing extension/adapter access pattern.
ALTER TABLE clouds_character_ir ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access"
  ON clouds_character_ir FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous insert"
  ON clouds_character_ir FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous update"
  ON clouds_character_ir FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Auto-maintain updated_at.
CREATE OR REPLACE FUNCTION update_clouds_character_ir_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_clouds_character_ir_updated_at
  BEFORE UPDATE ON clouds_character_ir
  FOR EACH ROW
  EXECUTE FUNCTION update_clouds_character_ir_updated_at();

COMMENT ON TABLE clouds_character_ir IS 'System-agnostic IR of DiceCloud characters for CarmaClouds (see REBUILD.md)';
