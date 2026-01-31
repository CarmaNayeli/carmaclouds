/**
 * Character Cache Manager for Pip2 Bot
 * Reduces Supabase egress costs by caching character data
 * Uses @carmaclouds/core CacheManager with Discord-specific wrapper methods
 */

import { CacheManager } from '@carmaclouds/core';

class CharacterCacheManager {
  constructor() {
    // Use generic CacheManager from core with 15-minute TTL
    this.cache = new CacheManager({
      expiryMs: 15 * 60 * 1000, // 15 minutes - Discord commands need fresher data
      cleanupIntervalMs: 5 * 60 * 1000, // Cleanup every 5 minutes
      debug: true
    });
  }

  /**
   * Get cached character by Discord user ID
   */
  getByDiscordUser(discordUserId) {
    const cacheKey = `discord_${discordUserId}`;
    return this.cache.get(cacheKey);
  }

  /**
   * Get cached character by DiceCloud character ID
   */
  getByCharacterId(characterId) {
    const cacheKey = `character_${characterId}`;
    return this.cache.get(cacheKey);
  }

  /**
   * Get cached characters list by DiceCloud user ID
   */
  getByUserId(diceCloudUserId) {
    const cacheKey = `user_${diceCloudUserId}`;
    return this.cache.get(cacheKey);
  }

  /**
   * Store character in cache (multiple keys for different lookup patterns)
   */
  store(character) {
    if (!character) return;

    // Store under multiple keys for efficient lookups
    if (character.dicecloud_character_id) {
      this.cache.set(`character_${character.dicecloud_character_id}`, character);
    }
    if (character.discord_user_id && character.discord_user_id !== 'not_linked') {
      this.cache.set(`discord_${character.discord_user_id}`, character);
    }
    if (character.user_id_dicecloud) {
      this.cache.set(`user_${character.user_id_dicecloud}`, character);
    }

    console.log(`📦 [Cache] Stored character: ${character.character_name}`);
  }

  /**
   * Store multiple characters (for user character list)
   */
  storeMultiple(characters, diceCloudUserId) {
    if (!Array.isArray(characters) || characters.length === 0) return;

    // Store each character individually
    characters.forEach(char => this.store(char));

    // Also cache the full list under user ID
    if (diceCloudUserId) {
      const cacheKey = `user_${diceCloudUserId}`;
      this.cache.set(cacheKey, characters);
    }

    console.log(`📦 [Cache] Stored ${characters.length} characters for user ${diceCloudUserId}`);
  }

  /**
   * Invalidate cache for a specific character
   */
  invalidate(characterId, discordUserId, diceCloudUserId) {
    const keysToDelete = [];

    if (characterId) {
      keysToDelete.push(`character_${characterId}`);
    }
    if (discordUserId && discordUserId !== 'not_linked') {
      keysToDelete.push(`discord_${discordUserId}`);
    }
    if (diceCloudUserId) {
      keysToDelete.push(`user_${diceCloudUserId}`);
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
    });
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }
}

// Export singleton instance
export default new CharacterCacheManager();
