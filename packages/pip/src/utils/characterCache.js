/**
 * Optimized Character Cache and Fetching System
 * Prevents duplicate database calls and improves performance
 * Uses CharacterCacheManager for HEAVY caching (15 min TTL)
 */

import cacheManager from './characterCacheManager.js';

// Supabase config
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

/**
 * Get cached character data or fetch from database
 * @param {string} discordUserId - Discord user ID
 * @returns {Promise<Object|null>} Character data or null
 */
async function getActiveCharacter(discordUserId) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn('Supabase not configured');
    return null;
  }

  // Check cache first using new cache manager
  const cached = cacheManager.getByDiscordUser(discordUserId);
  if (cached) {
    return cached;
  }

  console.log(`[DB FETCH] Active character for ${discordUserId}`);

  try {
    // Optimized query - only fetch essential fields (reduces egress!)
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/clouds_characters?discord_user_id=eq.${discordUserId}&is_active=eq.true&select=dicecloud_character_id,character_name,class,level,race,alignment,hit_points,armor_class,speed,attributes,attribute_mods,discord_user_id,user_id_dicecloud&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch active character:', response.status);
      return null;
    }

    const data = await response.json();
    const character = data.length > 0 ? data[0] : null;

    // Store in cache manager (15 min TTL)
    if (character) {
      cacheManager.store(character);
    }

    return character;
  } catch (error) {
    console.error('Error fetching active character:', error);
    return null;
  }
}

/**
 * Set active character with caching
 * @param {string} discordUserId - Discord user ID
 * @param {string} characterName - Character name to set as active
 * @returns {Promise<{success: boolean, character?: Object, error?: string}>}
 */
async function setActiveCharacter(discordUserId, characterName) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // First, get all characters for this user (optimized fields)
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/clouds_characters?discord_user_id=eq.${discordUserId}&select=id,dicecloud_character_id,character_name,class,level,race,alignment,hit_points,armor_class,speed,attributes,attribute_mods,discord_user_id,user_id_dicecloud`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    );

    if (!response.ok) {
      return { success: false, error: `Failed to fetch characters: ${response.status}` };
    }

    const characters = await response.json();

    // Find the character by name (case-insensitive)
    const character = characters.find(char =>
      char.character_name.toLowerCase() === characterName.toLowerCase()
    );

    if (!character) {
      return { success: false, error: 'Character not found' };
    }

    // Update all characters to set only this one as active
    const updatePromises = characters.map(char => {
      const isActive = char.character_name.toLowerCase() === characterName.toLowerCase();

      return fetch(
        `${SUPABASE_URL}/rest/v1/clouds_characters?id=eq.${char.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          },
          body: JSON.stringify({ is_active: isActive })
        }
      );
    });

    await Promise.all(updatePromises);

    // Invalidate cache for this user (all their characters)
    cacheManager.invalidate(
      character.dicecloud_character_id,
      discordUserId,
      character.user_id_dicecloud
    );

    // Cache the new active character
    const activeCharacter = { ...character, is_active: true };
    cacheManager.store(activeCharacter);

    return { success: true, character };
  } catch (error) {
    console.error('Error setting active character:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Clear cache for a specific user
 * @param {string} discordUserId - Discord user ID
 */
function clearUserCache(discordUserId) {
  cacheManager.invalidate(null, discordUserId, null);
}

/**
 * Clear all cache
 */
function clearAllCache() {
  cacheManager.clear();
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  return cacheManager.getStats();
}

// Cache manager handles auto-cleanup internally

export {
  getActiveCharacter,
  setActiveCharacter,
  clearUserCache,
  clearAllCache,
  getCacheStats
};
