/**
 * Supabase Configuration
 * Single Supabase instance shared across all CarmaClouds projects
 */

// Shared Supabase instance
export const SUPABASE_URL = 'https://luiesmfjdcmpywavvfqm.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWVzbWZqZGNtcHl3YXZ2ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODYxNDksImV4cCI6MjA4NTQ2MjE0OX0.oqjHFf2HhCLcanh0HVryoQH7iSV7E9dHHZJdYehxZ0U';

/**
 * Table names for different projects
 */
export const TABLES = {
  // Shared tables
  AUTH_TOKENS: 'auth_tokens',
  PAIRINGS: 'clouds_pairings',

  // Project-specific character tables
  OWLCLOUD_CHARACTERS: 'clouds_characters',
  ROLLCLOUD_CHARACTERS: 'rollcloud_characters',
  FOUNDCLOUD_CHARACTERS: 'foundcloud_characters', // Future
};

/**
 * Project-specific configurations
 */
export const PROJECT_CONFIGS = {
  owlcloud: {
    characterTable: TABLES.OWLCLOUD_CHARACTERS,
    pairingTable: TABLES.PAIRINGS,
    cacheStorageKey: 'owlcloud_character_cache',
  },
  rollcloud: {
    characterTable: TABLES.ROLLCLOUD_CHARACTERS,
    pairingTable: TABLES.PAIRINGS,
    cacheStorageKey: 'rollcloud_character_cache',
  },
  foundcloud: {
    characterTable: TABLES.FOUNDCLOUD_CHARACTERS,
    pairingTable: TABLES.PAIRINGS,
    cacheStorageKey: 'foundcloud_character_cache',
  },
};

/**
 * Get configuration for a specific project
 * @param {string} projectName - Project name (owlcloud, rollcloud, foundcloud)
 * @returns {Object} Project configuration
 */
export function getProjectConfig(projectName) {
  const config = PROJECT_CONFIGS[projectName];
  if (!config) {
    throw new Error(`Unknown project: ${projectName}`);
  }
  return {
    ...config,
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_ANON_KEY,
  };
}
