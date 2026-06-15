/**
 * Supabase Client for Token Persistence
 * Stores and retrieves DiceCloud auth tokens across sessions/browsers
 */

// Supabase configuration
const SUPABASE_URL = 'https://luiesmfjdcmpywavvfqm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWVzbWZqZGNtcHl3YXZ2ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODYxNDksImV4cCI6MjA4NTQ2MjE0OX0.oqjHFf2HhCLcanh0HVryoQH7iSV7E9dHHZJdYehxZ0U';

/**
 * Supabase Token Manager
 */
class SupabaseTokenManager {
  constructor() {
    this.supabaseUrl = SUPABASE_URL;
    this.supabaseKey = SUPABASE_ANON_KEY;
    this.tableName = 'auth_tokens';

    // HEAVY character data cache to prevent egress costs
    // Cache persists for 1 hour in memory + 24 hours in localStorage
    this.characterCache = new Map();
    this.cacheExpiryMs = 60 * 60 * 1000; // 1 hour memory cache TTL
    this.persistentCacheExpiryMs = 24 * 60 * 60 * 1000; // 24 hours localStorage TTL
    this.cacheStorageKey = 'owlcloud_character_cache';

    // Load persistent cache on initialization
    this.loadPersistentCache();
  }

  /**
   * Generate a unique user ID based on browser fingerprint
   * Uses a persistent stored ID if available to survive browser updates/resolution changes
   */
  generateUserId() {
    // Try to return cached ID synchronously (set by async method)
    if (this._cachedUserId) {
      return this._cachedUserId;
    }

    // Fallback to fingerprint-based ID (used on first run before stored ID is loaded)
    return this._generateFingerprintUserId();
  }

  /**
   * Generate fingerprint-based user ID (internal helper)
   */
  _generateFingerprintUserId() {
    // Create a simple fingerprint from available browser info
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      // Use fallback for screen in service workers
      (typeof screen !== 'undefined' ? screen.width + 'x' + screen.height : 'unknown'),
      new Date().getTimezoneOffset()
    ].join('|');

    // Simple hash to create a consistent ID
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return 'user_' + Math.abs(hash).toString(36);
  }

  /**
   * Get or create a persistent user ID that survives browser updates
   * This prevents auth loss when Firefox updates change the userAgent
   */
  async getOrCreatePersistentUserId() {
    try {
      // Check if we have a stored persistent ID
      const stored = await browserAPI.storage.local.get(['persistentBrowserUserId']);

      if (stored.persistentBrowserUserId) {
        this._cachedUserId = stored.persistentBrowserUserId;
        return stored.persistentBrowserUserId;
      }

      // Generate new ID based on fingerprint and store it
      const newId = this._generateFingerprintUserId();
      await browserAPI.storage.local.set({ persistentBrowserUserId: newId });
      this._cachedUserId = newId;

      debug.log('🔑 Created persistent browser user ID:', newId);
      return newId;
    } catch (error) {
      debug.error('Failed to get/create persistent user ID:', error);
      // Fall back to fingerprint-based ID
      return this._generateFingerprintUserId();
    }
  }

  /**
   * Normalize date to ISO 8601 format for PostgreSQL
   * Handles Meteor date formats like "Sat Jan 25 2025 12:00:00 GMT+0300"
   */
  normalizeDate(dateValue) {
    if (!dateValue) return null;
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        debug.warn('⚠️ Invalid date value:', dateValue);
        return null;
      }
      return date.toISOString();
    } catch (e) {
      debug.warn('⚠️ Failed to normalize date:', dateValue, e);
      return null;
    }
  }

  /**
   * GDPR Phase 2.5 helpers — encrypted, owner-scoped token storage.
   * The token is encrypted at rest (Vault key, server-side) and only ever
   * read/written for the row where owner_id = auth.uid(), via SECURITY DEFINER
   * RPCs. The client never sees the encryption key.
   */
  _getAuthedSupabase() {
    return (typeof window !== 'undefined' && window.supabaseClient)
      || (typeof self !== 'undefined' && self.supabaseClient)
      || null;
  }

  async _ensureAuthSession(client) {
    const ensure = (typeof window !== 'undefined' && window.ensureSupabaseSession)
      || (typeof self !== 'undefined' && self.ensureSupabaseSession);
    if (ensure) {
      try { await ensure(client); } catch (_) { /* fail-safe */ }
    }
  }

  /** Store the token via the encrypted RPC. Returns { ok: true } on success. */
  async storeTokenEncrypted(tokenData) {
    try {
      const client = this._getAuthedSupabase();
      if (!client || typeof client.rpc !== 'function') return { ok: false };
      await this._ensureAuthSession(client);
      const { error } = await client.rpc('store_my_dicecloud_token', {
        p_token: tokenData.token,
        p_username: tokenData.username || 'DiceCloud User',
        p_user_id_dicecloud: tokenData.userId || null,
        p_token_expires: this.normalizeDate(tokenData.tokenExpires),
      });
      if (error) {
        debug.warn('⚠️ Encrypted token store unavailable, falling back:', error.message);
        return { ok: false };
      }
      return { ok: true };
    } catch (err) {
      debug.warn('⚠️ storeTokenEncrypted failed, falling back:', err?.message || err);
      return { ok: false };
    }
  }

  /**
   * Retrieve the token via the encrypted RPC.
   * Returns null when unavailable (caller falls back to legacy), a
   * { success:false, error } object for an expired token, or
   * { success:true, token, username, userId, tokenExpires } on success.
   */
  async retrieveTokenEncrypted() {
    try {
      const client = this._getAuthedSupabase();
      if (!client || typeof client.rpc !== 'function') return null;
      await this._ensureAuthSession(client);
      const { data, error } = await client.rpc('get_my_dicecloud_token');
      if (error) {
        debug.warn('⚠️ Encrypted token retrieve unavailable, falling back:', error.message);
        return null;
      }
      if (!data || data.length === 0) return null;
      const row = data[0];
      if (row.token_expires && new Date() >= new Date(row.token_expires)) {
        debug.log('⚠️ Encrypted token expired');
        return { success: false, error: 'Token expired' };
      }
      debug.log('✅ Token retrieved from Supabase (encrypted RPC)');
      return {
        success: true,
        token: row.token,
        username: row.username,
        userId: row.user_id_dicecloud,
        tokenExpires: row.token_expires,
      };
    } catch (err) {
      debug.warn('⚠️ retrieveTokenEncrypted failed, falling back:', err?.message || err);
      return null;
    }
  }

  /**
   * Store auth token in Supabase
   */
  async storeToken(tokenData) {
    try {
      debug.log('🌐 Storing token in Supabase...');

      // Clear any previous invalidation/conflict info FIRST when logging in
      // This prevents stale data from causing login failures
      await browserAPI.storage.local.remove(['sessionInvalidated', 'sessionConflict']);

      // The token is stored encrypted at rest via the owner-scoped RPC (Vault
      // key); auth_tokens is RPC-only — there is no plaintext fallback.
      const enc = await this.storeTokenEncrypted(tokenData);
      if (enc.ok) {
        debug.log('✅ Token stored in Supabase (encrypted RPC)');
        return { success: true };
      }
      debug.error('❌ storeToken: encrypted RPC unavailable (no Supabase session yet)');
      return { success: false, error: 'No Supabase session — cannot store token' };
    } catch (error) {
      debug.error('❌ Failed to store token in Supabase:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Retrieve auth token from Supabase
   */
  async retrieveToken() {
    try {
      debug.log('🌐 Retrieving token from Supabase...');

      // The token is read (and decrypted) only via the owner-scoped RPC.
      const enc = await this.retrieveTokenEncrypted();
      if (enc) return enc;
      return { success: false, error: 'No token found' };
    } catch (error) {
      debug.error('❌ Failed to retrieve token from Supabase:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get the caller's token record (used by older session-check call sites).
   * Backed by the owner-scoped encrypted RPC; returns the legacy `{ success,
   * tokenData }` shape. There is no session_id / discord / invalidated metadata
   * any more (that single-session system was removed), so callers only get the
   * token + expiry + dicecloud user id.
   */
  async getTokenFromDatabase() {
    const enc = await this.retrieveTokenEncrypted();
    if (enc && enc.success) {
      return {
        success: true,
        tokenData: {
          dicecloud_token: enc.token,
          username: enc.username,
          user_id_dicecloud: enc.userId,
          token_expires: enc.tokenExpires,
        },
      };
    }
    return { success: false, error: 'No token found' };
  }

  /**
   * Logout cleanup. auth_tokens is RPC-only and tokens expire on their own;
   * full erasure is delete_my_account_data(). Nothing to do for a plain logout.
   */
  async deleteToken() {
    debug.log('ℹ️ deleteToken: no-op (auth_tokens is RPC-only; tokens self-expire)');
    return { success: true };
  }

  /**
   * Store character data in Supabase (alias for storeCharacter)
   * Used by popup for character cloud sync
   */
  async storeCharacterData(characterSyncData) {
    try {
      debug.log('🎭 Storing character data in cloud:', characterSyncData.characterId);
      
      // Extract character data from the sync payload
      const characterData = characterSyncData.characterData;
      
      // Use the existing storeCharacter method
      const result = await this.storeCharacter(characterData);
      
      if (result.success) {
        debug.log('✅ Character data stored in cloud successfully');
      } else {
        debug.error('❌ Failed to store character data in cloud:', result.error);
      }
      
      return result;
    } catch (error) {
      debug.error('❌ Error in storeCharacterData:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get character data from Supabase (alias for getCharacter)
   * Used by popup for character cloud sync
   * Implements caching to reduce egress costs
   */
  async getCharacterData(diceCloudUserId, forceRefresh = false) {
    try {
      const cacheKey = `characters_${diceCloudUserId}`;

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = this.characterCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < this.cacheExpiryMs)) {
          debug.log('📦 Using cached character data (cache hit)');
          return {
            success: true,
            characters: cached.characters,
            count: cached.count,
            fromCache: true
          };
        }
      }

      debug.log('🎭 Retrieving character data from cloud for user:', diceCloudUserId);

      // Get all characters for this user
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/clouds_characters?user_id_dicecloud=eq.${diceCloudUserId}&select=*`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch characters: ${response.status}`);
      }

      const data = await response.json();

      // Format the response to match expected structure
      const characters = {};
      data.forEach(character => {
        characters[character.dicecloud_character_id] = {
          characterData: character,
          timestamp: character.updated_at
        };
      });

      // Store in cache
      this.characterCache.set(cacheKey, {
        characters: characters,
        count: data.length,
        timestamp: Date.now()
      });

      // Save to persistent storage for 24h caching
      await this.savePersistentCache();

      debug.log(`📦 Retrieved ${data.length} characters from cloud (cached for 1h memory + 24h storage)`);
      return {
        success: true,
        characters: characters,
        count: data.length,
        fromCache: false
      };
    } catch (error) {
      debug.error('❌ Failed to get character data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Store character data in Supabase
   * Links character to Discord pairing for bot commands
   */
  async storeCharacter(characterData, pairingCode = null) {
    try {
      debug.log('🎭 Storing character in Supabase:', characterData.name);

      const payload = {
        user_id_dicecloud: characterData.dicecloudUserId || characterData.userId || null,
        dicecloud_character_id: characterData.id,
        character_name: characterData.name || 'Unknown',
        race: characterData.race || null,
        class: characterData.class || null,
        level: characterData.level || 1,
        alignment: characterData.alignment || null,
        hit_points: characterData.hitPoints || { current: 0, max: 0 },
        hit_dice: characterData.hitDice || { current: 0, max: 0, type: 'd8' },
        temporary_hp: characterData.temporaryHP || 0,
        death_saves: characterData.deathSaves || { successes: 0, failures: 0 },
        inspiration: characterData.inspiration || false,
        armor_class: characterData.armorClass || 10,
        speed: characterData.speed || 30,
        initiative: characterData.initiative || 0,
        proficiency_bonus: characterData.proficiencyBonus || 2,
        attributes: characterData.attributes || {},
        attribute_mods: characterData.attributeMods || {},
        saves: characterData.saves || {},
        skills: characterData.skills || {},
        spell_slots: characterData.spellSlots || {},
        resources: characterData.resources || [],
        conditions: characterData.conditions || [],
        raw_dicecloud_data: characterData, // Store the FULL character object
        updated_at: new Date().toISOString()
      };

      // If pairing code provided, look up the pairing to link
      if (pairingCode) {
        const pairingResponse = await fetch(
          `${this.supabaseUrl}/rest/v1/clouds_pairings?pairing_code=eq.${pairingCode}&select=id,discord_user_id`,
          {
            headers: {
              'apikey': this.supabaseKey,
              'Authorization': `Bearer ${this.supabaseKey}`
            }
          }
        );
        if (pairingResponse.ok) {
          const pairings = await pairingResponse.json();
          if (pairings.length > 0) {
            // TODO: pairing_id field requires database migration - commented out for now
            // payload.pairing_id = pairings[0].id;
            payload.discord_user_id = pairings[0].discord_user_id;
          }
        }
      } else {
        // No pairing code provided - try to get Discord user ID from auth_tokens or pairings
        let discordUserId = null;

        // First, check auth_tokens
        try {
          const persistentUserId = await this.getOrCreatePersistentUserId();
          const authResponse = await fetch(
            `${this.supabaseUrl}/rest/v1/auth_tokens?user_id=eq.${persistentUserId}&select=discord_user_id`,
            {
              headers: {
                'apikey': this.supabaseKey,
                'Authorization': `Bearer ${this.supabaseKey}`
              }
            }
          );
          if (authResponse.ok) {
            const authTokens = await authResponse.json();
            if (authTokens.length > 0 && authTokens[0].discord_user_id) {
              discordUserId = authTokens[0].discord_user_id;
              debug.log('✅ Found Discord user ID from auth_tokens:', discordUserId);
            }
          }
        } catch (error) {
          debug.log('⚠️ Failed to check auth_tokens for Discord user ID:', error.message);
        }

        // If not in auth_tokens, check pairings table for this DiceCloud user
        if (!discordUserId && payload.user_id_dicecloud) {
          try {
            const pairingResponse = await fetch(
              `${this.supabaseUrl}/rest/v1/clouds_pairings?dicecloud_user_id=eq.${payload.user_id_dicecloud}&status=eq.connected&select=discord_user_id`,
              {
                headers: {
                  'apikey': this.supabaseKey,
                  'Authorization': `Bearer ${this.supabaseKey}`
                }
              }
            );
            if (pairingResponse.ok) {
              const pairings = await pairingResponse.json();
              if (pairings.length > 0 && pairings[0].discord_user_id) {
                discordUserId = pairings[0].discord_user_id;
                debug.log('✅ Found Discord user ID from pairings:', discordUserId);
              }
            }
          } catch (error) {
            debug.log('⚠️ Failed to check pairings for Discord user ID:', error.message);
          }
        }

        // Set the discord_user_id or use placeholder
        if (discordUserId) {
          payload.discord_user_id = discordUserId;
        } else {
          payload.discord_user_id = 'not_linked';
          debug.log('⚠️ No Discord user ID found, using placeholder');
        }
      }

      // Try to upsert (insert or update on conflict)
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/clouds_characters`,
        {
          method: 'POST',
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=minimal'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        debug.log('⚠️ Character POST failed, trying PATCH:', errorText);

        // Try update instead
        const updateResponse = await fetch(
          `${this.supabaseUrl}/rest/v1/rollcloud_characters?dicecloud_character_id=eq.${characterData.id}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': this.supabaseKey,
              'Authorization': `Bearer ${this.supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(payload)
          }
        );

        if (!updateResponse.ok) {
          const patchError = await updateResponse.text();
          throw new Error(`Character update failed: ${patchError}`);
        }
      }

      debug.log('✅ Character stored in Supabase:', characterData.name);

      // Invalidate cache for this character
      this.invalidateCharacterCache(characterData.id, payload.user_id_dicecloud, payload.discord_user_id);

      return { success: true };
    } catch (error) {
      debug.error('❌ Failed to store character:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Retrieve character data from Supabase by DiceCloud ID
   * Implements caching to reduce egress costs
   */
  async getCharacter(diceCloudCharacterId, forceRefresh = false) {
    try {
      const cacheKey = `character_${diceCloudCharacterId}`;

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = this.characterCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < this.cacheExpiryMs)) {
          debug.log('📦 Using cached character (cache hit)');
          return { success: true, character: cached.character, fromCache: true };
        }
      }

      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/clouds_characters?dicecloud_character_id=eq.${diceCloudCharacterId}&select=*`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch character: ${response.status}`);
      }

      const data = await response.json();
      if (data.length > 0) {
        // Store in cache
        this.characterCache.set(cacheKey, {
          character: data[0],
          timestamp: Date.now()
        });

        // Save to persistent storage
        await this.savePersistentCache();

        return { success: true, character: data[0], fromCache: false };
      }
      return { success: false, error: 'Character not found' };
    } catch (error) {
      debug.error('❌ Failed to get character:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get character by Discord user ID (for bot commands)
   * Implements caching to reduce egress costs
   */
  async getCharacterByDiscordUser(discordUserId, forceRefresh = false) {
    try {
      const cacheKey = `discord_${discordUserId}`;

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = this.characterCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < this.cacheExpiryMs)) {
          debug.log('📦 Using cached Discord character (cache hit)');
          return { success: true, character: cached.character, fromCache: true };
        }
      }

      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/clouds_characters?discord_user_id=eq.${discordUserId}&select=*&order=updated_at.desc&limit=1`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch character: ${response.status}`);
      }

      const data = await response.json();
      if (data.length > 0) {
        // Store in cache
        this.characterCache.set(cacheKey, {
          character: data[0],
          timestamp: Date.now()
        });

        // Save to persistent storage
        await this.savePersistentCache();

        return { success: true, character: data[0], fromCache: false };
      }
      return { success: false, error: 'No character linked to this Discord user' };
    } catch (error) {
      debug.error('❌ Failed to get character by Discord user:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get auth tokens by DiceCloud user ID
   */
  async getAuthTokens(dicecloudUserId) {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/auth_tokens?user_id_dicecloud=eq.${dicecloudUserId}&select=*`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get auth tokens: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      debug.error('❌ Failed to get auth tokens:', error);
      throw error;
    }
  }

  /**
   * Session validity. The old "one browser per account" single-session system
   * was removed (multi-device is fine under Supabase Auth), so this is always
   * valid. Kept as a stable no-op for existing callers.
   */
  async checkSessionValidity() {
    return { valid: true };
  }

  /**
   * Clear conflict information
   */
  async clearConflictInfo() {
    try {
      await browserAPI.storage.local.remove(['sessionConflict']);
      debug.log('🗑️ Cleared conflict information');
    } catch (error) {
      debug.error('❌ Failed to clear conflict info:', error);
    }
  }

  /**
   * Invalidate character cache for a specific character
   * Called when character data is updated
   */
  async invalidateCharacterCache(characterId, diceCloudUserId, discordUserId) {
    const keysToInvalidate = [];

    if (characterId) {
      keysToInvalidate.push(`character_${characterId}`);
    }
    if (diceCloudUserId) {
      keysToInvalidate.push(`characters_${diceCloudUserId}`);
    }
    if (discordUserId && discordUserId !== 'not_linked') {
      keysToInvalidate.push(`discord_${discordUserId}`);
    }

    keysToInvalidate.forEach(key => {
      if (this.characterCache.has(key)) {
        this.characterCache.delete(key);
        debug.log('🗑️ Invalidated cache:', key);
      }
    });

    // Update persistent storage to reflect invalidation
    await this.savePersistentCache();
  }

  /**
   * Clear all character cache (memory and persistent storage)
   */
  async clearCharacterCache() {
    this.characterCache.clear();

    // Clear persistent storage too
    if (typeof browserAPI !== 'undefined') {
      await browserAPI.storage.local.remove([this.cacheStorageKey]);
    }

    debug.log('🗑️ Cleared all character cache (memory + storage)');
  }

  /**
   * Get cache stats for debugging
   */
  getCacheStats() {
    return {
      size: this.characterCache.size,
      memoryExpiryMs: this.cacheExpiryMs,
      persistentExpiryMs: this.persistentCacheExpiryMs,
      entries: Array.from(this.characterCache.keys())
    };
  }

  /**
   * Load persistent cache from localStorage
   * Runs on initialization to restore cached data across sessions
   */
  async loadPersistentCache() {
    try {
      if (typeof browserAPI === 'undefined') {
        debug.log('⚠️ browserAPI not available yet, skipping cache load');
        return;
      }

      const stored = await browserAPI.storage.local.get([this.cacheStorageKey]);
      if (!stored || !stored[this.cacheStorageKey]) {
        debug.log('📦 No persistent cache found');
        return;
      }

      const persistentCache = stored[this.cacheStorageKey];
      const now = Date.now();
      let loadedCount = 0;

      for (const [key, value] of Object.entries(persistentCache)) {
        // Check if cache entry is still valid (within 24 hour TTL)
        if (value.timestamp && (now - value.timestamp < this.persistentCacheExpiryMs)) {
          this.characterCache.set(key, value);
          loadedCount++;
        }
      }

      debug.log(`📦 Loaded ${loadedCount} entries from persistent cache`);
    } catch (error) {
      debug.error('❌ Failed to load persistent cache:', error);
    }
  }

  /**
   * Save current cache to localStorage for persistence
   */
  async savePersistentCache() {
    try {
      if (typeof browserAPI === 'undefined') {
        return;
      }

      const cacheObject = {};
      for (const [key, value] of this.characterCache.entries()) {
        cacheObject[key] = value;
      }

      await browserAPI.storage.local.set({
        [this.cacheStorageKey]: cacheObject
      });

      debug.log('💾 Saved cache to persistent storage');
    } catch (error) {
      debug.error('❌ Failed to save persistent cache:', error);
    }
  }
}

/**
 * GDPR migration — Phase 1 foundation.
 *
 * Guarantee that a Supabase session (real JWT) exists, so that Phase 2 can send
 * `auth.uid()`-bearing requests and Phase 3 can enforce per-user RLS. If the
 * user already signed in with email/password we leave that session alone;
 * otherwise we fall back to an *anonymous* sign-in so nobody is forced to create
 * an account.
 *
 * Fails safe: if "Anonymous sign-ins" is not yet enabled in the Supabase
 * dashboard (Phase 0), signInAnonymously() errors and we simply no-op. That
 * keeps this code shippable before the dashboard switch is flipped, and the app
 * continues to work on the legacy anon-key path until the Phase 3 cutover.
 *
 * Returns the access token (JWT) if a session exists, otherwise null.
 */
async function ensureSupabaseSession(client) {
  try {
    const { data: { session } } = await client.auth.getSession();
    if (session?.access_token) {
      return session.access_token;
    }
    if (typeof client.auth.signInAnonymously !== 'function') {
      // Older supabase-js without anonymous auth — nothing to do.
      return null;
    }
    const { data, error } = await client.auth.signInAnonymously();
    if (error) {
      // Most likely: anonymous sign-ins not enabled yet (Phase 0 pending).
      debug.warn('⚠️ ensureSupabaseSession: anonymous sign-in unavailable —', error.message);
      return null;
    }
    debug.log('✅ ensureSupabaseSession: established anonymous session');
    return data?.session?.access_token || null;
  } catch (err) {
    debug.error('❌ ensureSupabaseSession failed:', err);
    return null;
  }
}

/**
 * Convenience for raw-fetch call sites (adapters, background): return the current
 * end-user access token, ensuring a session first. Returns null on any failure so
 * callers do `Bearer ${token || SUPABASE_ANON_KEY}` and stay on the legacy path.
 */
// The service worker is the single auth authority (see background.js CC_AUTH_*).
// Popup/adapter contexts ask it for the shared session rather than signing in
// themselves, so every context has the same auth.uid() and owner-only RLS accepts
// their writes.
function _ccRuntime() {
  const api = (typeof browserAPI !== 'undefined' && browserAPI)
    || (typeof chrome !== 'undefined' && chrome)
    || (typeof browser !== 'undefined' && browser)
    || null;
  return (api && api.runtime && api.runtime.sendMessage) ? api : null;
}

async function _ccAuthGetFromSW() {
  const api = _ccRuntime();
  if (!api) return null;
  try {
    return await api.runtime.sendMessage({ type: 'CC_AUTH_GET' });
  } catch (e) {
    debug.warn('⚠️ CC_AUTH_GET failed:', e?.message || e);
    return null;
  }
}

/** Make `client` use the SW's session (so its auth.uid() matches everything else). */
async function adoptSessionFromSW(client) {
  try {
    const resp = await _ccAuthGetFromSW();
    if (resp && resp.access_token && resp.refresh_token) {
      await client.auth.setSession({ access_token: resp.access_token, refresh_token: resp.refresh_token });
      debug.log('✅ adopted SW session', resp.isAnonymous ? '(anonymous)' : '(account)');
      return resp.access_token;
    }
    // No SW reachable (e.g. standalone/dev): fall back to local sign-in.
    return await ensureSupabaseSession(client);
  } catch (e) {
    debug.warn('⚠️ adoptSessionFromSW failed, local fallback:', e?.message || e);
    return await ensureSupabaseSession(client);
  }
}

/** Current access token, preferring the SW's session. */
async function getSupabaseAccessToken() {
  const resp = await _ccAuthGetFromSW();
  if (resp && resp.access_token) return resp.access_token;
  try {
    const client = (typeof window !== 'undefined' && window.supabaseClient)
      || (typeof self !== 'undefined' && self.supabaseClient) || null;
    if (!client) return null;
    await ensureSupabaseSession(client);
    const { data: { session } } = await client.auth.getSession();
    return session?.access_token || null;
  } catch (err) {
    debug.warn('⚠️ getSupabaseAccessToken failed:', err?.message || err);
    return null;
  }
}

/** Current { userId, isAnonymous, token } from the SW's session. */
async function getSupabaseAuthInfo() {
  const resp = await _ccAuthGetFromSW();
  if (resp) return { userId: resp.userId || null, isAnonymous: resp.isAnonymous, token: resp.access_token || null };
  try {
    const client = (typeof window !== 'undefined' && window.supabaseClient) || null;
    if (!client) return { userId: null, isAnonymous: null, token: null };
    const { data: { session } } = await client.auth.getSession();
    return {
      userId: session?.user?.id || null,
      isAnonymous: session?.user?.is_anonymous ?? null,
      token: session?.access_token || null,
    };
  } catch {
    return { userId: null, isAnonymous: null, token: null };
  }
}

// Export for use in other modules
// Always export to window/self for browser extensions
if (typeof window !== 'undefined') {
  window.SupabaseTokenManager = SupabaseTokenManager;
  window.ensureSupabaseSession = ensureSupabaseSession;
  window.getSupabaseAccessToken = getSupabaseAccessToken;
  window.getSupabaseAuthInfo = getSupabaseAuthInfo;
  window.adoptSupabaseSession = () => adoptSessionFromSW(window.supabaseClient);

  // Create global Supabase client for authentication (email/password login)
  // This is separate from SupabaseTokenManager which handles DiceCloud tokens
  const initSupabaseAuthClient = (origin) => {
    try {
      // CRITICAL: the popup must share ONE session with the background service
      // worker, or they get different auth.uid()s and write characters under
      // different owners — which the owner-only RLS then rejects on upsert. Back
      // the auth session with chrome.storage.local under the same storageKey the
      // SW uses ('cc-sb-auth'). See gdpr-auth-migration.
      const ccApi = (typeof browserAPI !== 'undefined' && browserAPI && browserAPI.storage) ? browserAPI
        : ((typeof chrome !== 'undefined' && chrome && chrome.storage) ? chrome
        : ((typeof browser !== 'undefined' && browser && browser.storage) ? browser : null));
      const opts = ccApi ? {
        auth: {
          storage: {
            getItem: (k) => ccApi.storage.local.get(k).then((r) => (r && r[k] != null ? r[k] : null)),
            setItem: (k, v) => ccApi.storage.local.set({ [k]: v }),
            removeItem: (k) => ccApi.storage.local.remove(k),
          },
          storageKey: 'cc-sb-auth',
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      } : undefined;
      window.supabaseClient = window.createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, opts);
      console.log(`✅ [Supabase Client] Created global Supabase auth client${origin}`);
      debug.log('✅ Created global Supabase auth client');
      // Adopt the service worker's session so the popup shares one auth.uid()
      // with the SW (the single auth authority). Non-blocking.
      adoptSessionFromSW(window.supabaseClient);
    } catch (error) {
      console.error('❌ [Supabase Client] Failed to create Supabase client:', error);
      debug.error('❌ Failed to create Supabase client:', error);
    }
  };

  console.log('🔍 [Supabase Client] Checking for createSupabaseClient function...', typeof window.createSupabaseClient);
  if (typeof window.createSupabaseClient === 'function') {
    initSupabaseAuthClient('');
  } else {
    console.warn('⚠️ [Supabase Client] createSupabaseClient function not available yet - will retry on DOMContentLoaded');
    // Retry after DOM loads (when module scripts have finished)
    window.addEventListener('DOMContentLoaded', () => {
      console.log('🔍 [Supabase Client] DOMContentLoaded - retrying createSupabaseClient check...', typeof window.createSupabaseClient);
      if (typeof window.createSupabaseClient === 'function' && !window.supabaseClient) {
        initSupabaseAuthClient(' (after DOMContentLoaded)');
      }
    });
  }
} else if (typeof self !== 'undefined') {
  self.ensureSupabaseSession = ensureSupabaseSession;
  self.getSupabaseAccessToken = getSupabaseAccessToken;
  // Service worker context
  self.SupabaseTokenManager = SupabaseTokenManager;
}

// Also export as module for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SupabaseTokenManager;
}
