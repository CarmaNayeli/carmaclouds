-- Migration: Simplify clouds_characters table to use VTT-specific JSON columns
-- This removes individual stat columns and adds separate JSON columns for each VTT platform

-- Add new VTT-specific JSON columns
ALTER TABLE clouds_characters
ADD COLUMN IF NOT EXISTS roll20_data JSONB,
ADD COLUMN IF NOT EXISTS owlbear_data JSONB,
ADD COLUMN IF NOT EXISTS foundry_data JSONB;

-- Drop the individual stat columns that are now redundant
-- (keeping basic metadata columns like character_name, user_id_dicecloud, etc.)
ALTER TABLE clouds_characters
DROP COLUMN IF EXISTS race,
DROP COLUMN IF EXISTS class,
DROP COLUMN IF EXISTS level,
DROP COLUMN IF EXISTS alignment,
DROP COLUMN IF EXISTS hit_points,
DROP COLUMN IF EXISTS hit_dice,
DROP COLUMN IF EXISTS temporary_hp,
DROP COLUMN IF EXISTS death_saves,
DROP COLUMN IF EXISTS inspiration,
DROP COLUMN IF EXISTS armor_class,
DROP COLUMN IF EXISTS speed,
DROP COLUMN IF EXISTS initiative,
DROP COLUMN IF EXISTS proficiency_bonus,
DROP COLUMN IF EXISTS attributes,
DROP COLUMN IF EXISTS attribute_mods,
DROP COLUMN IF EXISTS saves,
DROP COLUMN IF EXISTS skills,
DROP COLUMN IF EXISTS spell_slots,
DROP COLUMN IF EXISTS resources,
DROP COLUMN IF EXISTS conditions;

-- Add indexes for the VTT data columns for faster queries
CREATE INDEX IF NOT EXISTS idx_clouds_characters_roll20_data ON clouds_characters USING GIN (roll20_data);
CREATE INDEX IF NOT EXISTS idx_clouds_characters_owlbear_data ON clouds_characters USING GIN (owlbear_data);
CREATE INDEX IF NOT EXISTS idx_clouds_characters_foundry_data ON clouds_characters USING GIN (foundry_data);

-- Comment on the table to document the new structure
COMMENT ON TABLE clouds_characters IS 'Stores character data with raw DiceCloud API response and VTT-specific parsed data';
COMMENT ON COLUMN clouds_characters.raw_dicecloud_data IS 'Original DiceCloud API response (stored on sync)';
COMMENT ON COLUMN clouds_characters.roll20_data IS 'Parsed data for Roll20 (populated when pushing to Roll20)';
COMMENT ON COLUMN clouds_characters.owlbear_data IS 'Parsed data for Owlbear Rodeo (populated when pushing to Owlbear)';
COMMENT ON COLUMN clouds_characters.foundry_data IS 'Parsed data for Foundry VTT (populated when pushing to Foundry)';
