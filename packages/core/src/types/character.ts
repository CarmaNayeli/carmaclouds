/**
 * Shared Character Types for CarmaClouds
 */

export interface HitPoints {
  current: number;
  max: number;
}

export interface HitDice {
  current: number;
  max: number;
  type: string;
}

export interface DeathSaves {
  successes: number;
  failures: number;
}

export interface Attributes {
  strength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
}

export interface AttributeMods {
  strength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
}

export interface Character {
  dicecloud_character_id: string;
  character_name: string;
  class?: string;
  level?: number;
  race?: string;
  alignment?: string;
  hit_points?: HitPoints;
  hit_dice?: HitDice;
  temporary_hp?: number;
  death_saves?: DeathSaves;
  armor_class?: number;
  speed?: number;
  initiative?: number;
  proficiency_bonus?: number;
  attributes?: Attributes;
  attribute_mods?: AttributeMods;
  saves?: Record<string, any>;
  skills?: Record<string, any>;
  spell_slots?: Record<string, any>;
  resources?: any[];
  conditions?: any[];
  discord_user_id?: string;
  user_id_dicecloud?: string;
  owlbear_player_id?: string;
  is_active?: boolean;
  updated_at?: string;
  raw_dicecloud_data?: any;
}

export interface CharacterCache {
  data: Character | Character[];
  timestamp: number;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  stores: number;
  invalidations: number;
  hitRate: string;
  expiryMinutes?: number;
  memoryExpiryMs?: number;
  persistentExpiryMs?: number;
  entries?: string[];
}
