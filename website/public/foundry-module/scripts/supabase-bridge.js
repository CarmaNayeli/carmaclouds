/**
 * Supabase Bridge
 * Connects Foundry module to Supabase for character data sync
 * Replaces direct extension communication with database-mediated sync
 */

export class SupabaseBridge {
  constructor() {
    // Shared CarmaClouds Supabase instance
    this.supabaseUrl = 'https://luiesmfjdcmpywavvfqm.supabase.co';
    this.supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWVzbWZqZGNtcHl3YXZ2ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODYxNDksImV4cCI6MjA4NTQ2MjE0OX0.oqjHFf2HhCLcanh0HVryoQH7iSV7E9dHHZJdYehxZ0U';
    this.supabase = null;
    this.connected = false;
  }

  /**
   * Initialize Supabase connection
   */
  async initialize() {
    console.log('FoundCloud | Initializing Supabase bridge...');

    try {
      // Load Supabase client from CDN
      await this.loadSupabaseClient();

      // Create Supabase client
      this.supabase = window.supabase.createClient(
        this.supabaseUrl,
        this.supabaseAnonKey
      );

      // Test connection
      const { error } = await this.supabase
        .from('clouds_characters')
        .select('count')
        .limit(1);

      if (error) {
        console.error('FoundCloud | Supabase connection test failed:', error);
        this.connected = false;
      } else {
        this.connected = true;
        console.log('FoundCloud | Supabase connected successfully');
      }

    } catch (error) {
      console.error('FoundCloud | Failed to initialize Supabase:', error);
      this.connected = false;
    }
  }

  /**
   * Load Supabase client library from CDN
   * @returns {Promise<void>}
   */
  async loadSupabaseClient() {
    // Check if already loaded
    if (window.supabase) {
      console.log('FoundCloud | Supabase client already loaded');
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.onload = () => {
        console.log('FoundCloud | Supabase client loaded from CDN');
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Supabase client from CDN'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Check if connected to Supabase
   * @returns {boolean}
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Get all characters from Supabase
   * @returns {Promise<Array>}
   */
  async getCharacters() {
    if (!this.isConnected()) {
      throw new Error('Not connected to Supabase');
    }

    try {
      const { data, error } = await this.supabase
        .from('clouds_characters')
        .select('id, dicecloud_character_id, character_name, level, race, class, updated_at, platform')
        .contains('platform', ['foundcloud'])
        .order('character_name', { ascending: true });

      if (error) {
        console.error('FoundCloud | Failed to fetch characters:', error);
        throw error;
      }

      console.log(`FoundCloud | Found ${data?.length || 0} characters in Supabase`);
      return data || [];

    } catch (error) {
      console.error('FoundCloud | Error fetching characters:', error);
      throw error;
    }
  }

  /**
   * Get specific character by DiceCloud ID
   * @param {string} diceCloudId - DiceCloud character ID
   * @returns {Promise<object>}
   */
  async getCharacter(diceCloudId) {
    if (!this.isConnected()) {
      throw new Error('Not connected to Supabase');
    }

    try {
      const { data, error } = await this.supabase
        .from('clouds_characters')
        .select('*')
        .eq('dicecloud_character_id', diceCloudId)
        .single();

      if (error) {
        console.error('FoundCloud | Failed to fetch character:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Character not found in Supabase');
      }

      console.log(`FoundCloud | Fetched character: ${data.character_name}`);
      return data;

    } catch (error) {
      console.error('FoundCloud | Error fetching character:', error);
      throw error;
    }
  }

  /**
   * Get character by Supabase UUID
   * @param {string} uuid - Supabase character UUID
   * @returns {Promise<object>}
   */
  async getCharacterByUuid(uuid) {
    if (!this.isConnected()) {
      throw new Error('Not connected to Supabase');
    }

    try {
      const { data, error } = await this.supabase
        .from('clouds_characters')
        .select('*')
        .eq('id', uuid)
        .single();

      if (error) {
        console.error('FoundCloud | Failed to fetch character by UUID:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Character not found in Supabase');
      }

      return data;

    } catch (error) {
      console.error('FoundCloud | Error fetching character by UUID:', error);
      throw error;
    }
  }

  /**
   * Search characters by name
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>}
   */
  async searchCharacters(searchTerm) {
    if (!this.isConnected()) {
      throw new Error('Not connected to Supabase');
    }

    try {
      const { data, error } = await this.supabase
        .from('clouds_characters')
        .select('id, dicecloud_character_id, character_name, level, race, class, platform')
        .contains('platform', ['foundcloud'])
        .ilike('character_name', `%${searchTerm}%`)
        .order('character_name', { ascending: true });

      if (error) {
        console.error('FoundCloud | Failed to search characters:', error);
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('FoundCloud | Error searching characters:', error);
      throw error;
    }
  }

  /**
   * Subscribe to character updates in real-time
   * @param {string} diceCloudId - DiceCloud character ID
   * @param {Function} callback - Callback function when character updates
   * @returns {object} Subscription object
   */
  subscribeToCharacter(diceCloudId, callback) {
    if (!this.isConnected()) {
      console.warn('FoundCloud | Cannot subscribe: not connected to Supabase');
      return null;
    }

    const subscription = this.supabase
      .channel(`character-${diceCloudId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'clouds_characters',
          filter: `dicecloud_character_id=eq.${diceCloudId}`
        },
        (payload) => {
          console.log('FoundCloud | Character updated in Supabase:', payload);
          callback(payload.new);
        }
      )
      .subscribe();

    return subscription;
  }

  /**
   * Unsubscribe from character updates
   * @param {object} subscription - Subscription object
   */
  unsubscribe(subscription) {
    if (subscription) {
      subscription.unsubscribe();
    }
  }

  /**
   * Check if browser extension has recently updated a character
   * @param {string} diceCloudId - DiceCloud character ID
   * @param {number} withinMinutes - Check if updated within X minutes
   * @returns {Promise<boolean>}
   */
  async isRecentlyUpdated(diceCloudId, withinMinutes = 5) {
    try {
      const character = await this.getCharacter(diceCloudId);
      if (!character || !character.updated_at) {
        return false;
      }

      const updatedAt = new Date(character.updated_at);
      const now = new Date();
      const diffMinutes = (now - updatedAt) / (1000 * 60);

      return diffMinutes <= withinMinutes;

    } catch (error) {
      console.error('FoundCloud | Error checking character update time:', error);
      return false;
    }
  }

  /**
   * Get character update timestamp
   * @param {string} diceCloudId - DiceCloud character ID
   * @returns {Promise<Date|null>}
   */
  async getLastUpdateTime(diceCloudId) {
    try {
      const { data, error } = await this.supabase
        .from('clouds_characters')
        .select('updated_at')
        .eq('dicecloud_character_id', diceCloudId)
        .single();

      if (error || !data) {
        return null;
      }

      return new Date(data.updated_at);

    } catch (error) {
      console.error('FoundCloud | Error fetching last update time:', error);
      return null;
    }
  }

  /**
   * Test connection to Supabase
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    try {
      const { error } = await this.supabase
        .from('clouds_characters')
        .select('count')
        .limit(1);

      return !error;

    } catch (error) {
      console.error('FoundCloud | Connection test failed:', error);
      return false;
    }
  }
}
