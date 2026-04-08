-- Add owlcloud_parsed_data column to clouds_characters
-- Stores character data pre-parsed into OwlCloud (Owlbear Rodeo extension) format
-- so the extension can display stats without re-parsing raw DiceCloud data.

ALTER TABLE clouds_characters
  ADD COLUMN IF NOT EXISTS owlcloud_parsed_data jsonb DEFAULT '{}';
