/**
 * Optimized Supabase Field Selections
 * Reduces egress costs by fetching only needed fields
 */

// Essential character fields for most operations
export const CHARACTER_ESSENTIAL = [
  'dicecloud_character_id',
  'character_name',
  'class',
  'level',
  'race',
  'alignment',
  'discord_user_id',
  'user_id_dicecloud',
  'is_active'
].join(',');

// Full character data for detailed views
export const CHARACTER_FULL = [
  'dicecloud_character_id',
  'character_name',
  'class',
  'level',
  'race',
  'alignment',
  'hit_points',
  'hit_dice',
  'temporary_hp',
  'death_saves',
  'armor_class',
  'speed',
  'initiative',
  'proficiency_bonus',
  'attributes',
  'attribute_mods',
  'saves',
  'skills',
  'spell_slots',
  'resources',
  'conditions',
  'discord_user_id',
  'user_id_dicecloud',
  'owlbear_player_id',
  'is_active',
  'updated_at'
].join(',');

// Combat-focused fields
export const CHARACTER_COMBAT = [
  'dicecloud_character_id',
  'character_name',
  'class',
  'level',
  'hit_points',
  'temporary_hp',
  'armor_class',
  'speed',
  'initiative',
  'proficiency_bonus',
  'attributes',
  'attribute_mods',
  'saves',
  'conditions',
  'discord_user_id'
].join(',');

// Spell-focused fields
export const CHARACTER_SPELLS = [
  'dicecloud_character_id',
  'character_name',
  'class',
  'level',
  'spell_slots',
  'proficiency_bonus',
  'attributes',
  'attribute_mods',
  'raw_dicecloud_data',
  'discord_user_id'
].join(',');

// Resource management fields
export const CHARACTER_RESOURCES = [
  'dicecloud_character_id',
  'character_name',
  'class',
  'level',
  'hit_points',
  'hit_dice',
  'spell_slots',
  'resources',
  'discord_user_id'
].join(',');

// Minimal fields for character list
export const CHARACTER_LIST = [
  'dicecloud_character_id',
  'character_name',
  'class',
  'level',
  'race',
  'hit_points',
  'armor_class',
  'is_active',
  'discord_user_id'
].join(',');

// Pairing fields
export const PAIRING_FIELDS = [
  'id',
  'pairing_code',
  'discord_user_id',
  'dicecloud_user_id',
  'status',
  'created_at',
  'expires_at'
].join(',');

export const FIELD_SETS = {
  essential: CHARACTER_ESSENTIAL,
  full: CHARACTER_FULL,
  combat: CHARACTER_COMBAT,
  spells: CHARACTER_SPELLS,
  resources: CHARACTER_RESOURCES,
  list: CHARACTER_LIST,
  pairing: PAIRING_FIELDS
} as const;

export type FieldSetName = keyof typeof FIELD_SETS;
