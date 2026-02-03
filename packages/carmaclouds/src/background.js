/**
 * CarmaClouds Unified Background Service Worker
 * Handles cross-platform character sync and messaging
 */

// Detect browser API (Firefox uses 'browser', Chrome uses 'chrome')
const browserAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;

console.log('CarmaClouds background service worker initialized');

// Supabase configuration for direct API calls
const SUPABASE_URL = 'https://luiesmfjdcmpywavvfqm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWVzbWZqZGNtcHl3YXZ2ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODYxNDksImV4cCI6MjA4NTQ2MjE0OX0.oqjHFf2HhCLcanh0HVryoQH7iSV7E9dHHZJdYehxZ0U';

// Keep service worker alive (Manifest V3 requirement)
let keepAliveInterval;

function keepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }

  keepAliveInterval = setInterval(() => {
    if (browserAPI.runtime?.id) {
      console.log('🔄 Keep-alive ping');
    } else {
      clearInterval(keepAliveInterval);
    }
  }, 20000); // Every 20 seconds
}

// Start keep-alive immediately
keepAlive();

// Listen for messages from content scripts
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Restart keep-alive on every message
  keepAlive();
  console.log('🔔 Background received message:', message.type || message.action);

  // Handle action-based messages (from Roll20 content scripts)
  if (message.action === 'getCharacterData') {
    console.log('📋 Getting character data for Roll20...');
    handleGetCharacterData(message.characterId)
      .then(result => {
        console.log('✅ Character data retrieved:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('❌ Failed to get character data:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  // Handle getAllCharacterProfiles for RollCloud adapter compatibility
  if (message.action === 'getAllCharacterProfiles') {
    console.log('📋 Getting all character profiles...');
    handleGetAllCharacterProfiles(message.supabaseUserId)
      .then(result => {
        console.log('✅ Character profiles retrieved:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('❌ Failed to get character profiles:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  // Handle setActiveCharacter for RollCloud adapter compatibility
  if (message.action === 'setActiveCharacter') {
    console.log('📋 Setting active character:', message.characterId);
    handleSetActiveCharacter(message.characterId)
      .then(result => {
        console.log('✅ Active character set:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('❌ Failed to set active character:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  // Handle requestPreparedData from character sheet popup
  if (message.action === 'requestPreparedData') {
    console.log('📤 Character sheet requesting prepared data');
    handleRequestPreparedData()
      .then(result => {
        console.log('✅ Prepared data request completed:', result.success ? 'success' : 'failed');
        sendResponse(result);
      })
      .catch(error => {
        console.error('❌ Failed to handle prepared data request:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  // Handle notifyPopupUpdate - notify open popup sheets of updated character data
  if (message.action === 'notifyPopupUpdate') {
    console.log('🔔 Notifying popup sheets of character data update');
    browserAPI.runtime.sendMessage({
      type: 'UPDATE_CHARACTER_DATA',
      data: message.data
    }).catch(() => {
      console.log('ℹ️ No popup open to notify');
    });
    sendResponse({ success: true });
    return false;
  }

  // Handle storeCharacterData - store parsed character data to local storage
  if (message.action === 'storeCharacterData') {
    console.log('💾 Storing character data to local storage:', message.data?.name);
    handleStoreCharacterData(message.data, message.slotId)
      .then(result => {
        console.log('✅ Character data stored successfully');
        sendResponse(result);
      })
      .catch(error => {
        console.error('❌ Failed to store character data:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  // Handle clearAllCloudData - delete all character data from Supabase
  if (message.action === 'clearAllCloudData') {
    console.log('🗑️ Clearing all cloud character data...');
    handleClearAllCloudData()
      .then(result => {
        console.log('✅ Cloud data cleared successfully');
        sendResponse(result);
      })
      .catch(error => {
        console.error('❌ Failed to clear cloud data:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  // Handle different message types
  switch (message.type) {
    case 'CHARACTER_UPDATED':
      handleCharacterUpdate(message.data);
      return false; // No async response needed
    case 'SYNC_REQUEST':
      handleSyncRequest(message.data);
      return false; // No async response needed
    case 'SYNC_CHARACTER_TO_CARMACLOUDS':
      console.log('🔄 Starting SYNC_CHARACTER_TO_CARMACLOUDS handler...');
      // Handle async response properly for Manifest V3
      handleSyncToCarmaClouds(message.data)
        .then(result => {
          console.log('✅ Sync completed, sending response:', result);
          sendResponse(result);
        })
        .catch(error => {
          console.error('❌ Sync failed:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep channel open for async response
    default:
      console.warn('Unknown message type:', message.type);
      return false; // No async response for unknown messages
  }
});

// Handle get character data request
async function handleGetCharacterData(requestedCharacterId) {
  try {
    const result = await browserAPI.storage.local.get(['carmaclouds_characters', 'activeCharacterId']);
    const characters = result.carmaclouds_characters || [];
    const activeCharacterId = requestedCharacterId || result.activeCharacterId;

    // Try to find requested/active character
    let activeCharacter = null;
    if (activeCharacterId) {
      // Check if it's a slot-based ID (slot-1, slot-2, etc.)
      if (activeCharacterId.startsWith('slot-')) {
        const slotIndex = parseInt(activeCharacterId.replace('slot-', '')) - 1;
        if (slotIndex >= 0 && slotIndex < characters.length) {
          activeCharacter = characters[slotIndex];
        }
      } else {
        // Find by DiceCloud character ID
        activeCharacter = characters.find(char => char.id === activeCharacterId);
      }
    }

    // Fall back to first character if no active character found
    if (!activeCharacter && characters.length > 0) {
      activeCharacter = characters[0];
    }

    if (activeCharacter) {
      // Return the rollcloud parsed format (for sheet-builder)
      // If not yet parsed, return character with raw data
      let characterData = activeCharacter.rollcloud || activeCharacter;
      
      // Ensure the returned data always has the id field from the parent character
      if (activeCharacter.rollcloud && !characterData.id) {
        characterData = {
          ...characterData,
          id: activeCharacter.id
        };
      }

      console.log('📤 Returning character data:', activeCharacter.name);
      console.log('   Using rollcloud format:', !!activeCharacter.rollcloud);
      console.log('   Character data keys:', Object.keys(characterData).slice(0, 25));
      console.log('   Has hitPoints:', !!characterData.hitPoints, '=', characterData.hitPoints);
      console.log('   Has name:', !!characterData.name, '=', characterData.name);
      console.log('   Has id:', !!characterData.id, '=', characterData.id);
      console.log('   Has spells:', Array.isArray(characterData.spells), characterData.spells?.length);
      console.log('   Has actions:', Array.isArray(characterData.actions), characterData.actions?.length);

      return {
        success: true,
        data: characterData
      };
    } else {
      console.log('❌ No character data found in storage');
      console.log('   Characters array length:', characters.length);
      console.log('   Active character ID:', activeCharacterId);
      return {
        success: false,
        error: 'No character data found'
      };
    }
  } catch (error) {
    console.error('Error getting character data:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Handle store character data - update character in local storage
async function handleStoreCharacterData(characterData, slotId) {
  try {
    console.log('💾 Storing character to slot:', slotId || 'default');

    // Get current characters array
    const result = await browserAPI.storage.local.get('carmaclouds_characters');
    const characters = result.carmaclouds_characters || [];

    // Find character by ID - use slotId as fallback if no character ID is set
    const characterId = characterData.id || characterData.dicecloud_character_id || slotId;
    if (!characterId) {
      throw new Error('Character data missing ID and no slotId provided');
    }

    const existingIndex = characters.findIndex(char => char.id === characterId);

    if (existingIndex >= 0) {
      // Update existing character - merge with existing to preserve raw data
      console.log('✅ Updating existing character:', characterData.name);
      console.log('   Has hitPoints:', !!characterData.hitPoints);
      console.log('   Has spells:', Array.isArray(characterData.spells));
      console.log('   Has actions:', Array.isArray(characterData.actions));

      // Preserve the original raw DiceCloud data when updating with parsed data
      const existingCharacter = characters[existingIndex];
      characters[existingIndex] = {
        ...characterData,
        id: characterId, // Ensure ID is always set
        raw: existingCharacter.raw || characterData.raw, // Keep raw if it exists
        preview: existingCharacter.preview || characterData.preview // Keep preview if it exists
      };
      console.log('   Preserved raw data:', !!characters[existingIndex].raw);
    } else {
      // Add new character
      console.log('✅ Adding new character:', characterData.name);
      characters.push({
        ...characterData,
        id: characterId // Ensure ID is always set
      });
    }

    // Save back to storage
    await browserAPI.storage.local.set({ carmaclouds_characters: characters });
    console.log('✅ Character data stored successfully to carmaclouds_characters');
    console.log('   Total characters in array:', characters.length);

    return { success: true };
  } catch (error) {
    console.error('❌ Error storing character data:', error);
    return { success: false, error: error.message };
  }
}

// Handle get all character profiles (RollCloud adapter compatibility)
// Converts carmaclouds storage format to old rollcloud format
async function handleGetAllCharacterProfiles(supabaseUserId) {
  try {
    const result = await browserAPI.storage.local.get('carmaclouds_characters');
    let characters = result.carmaclouds_characters || [];

    console.log('🔍 getAllCharacterProfiles - Total characters in storage:', characters.length);

    // Also fetch from Supabase if authenticated
    if (supabaseUserId) {
      console.log('🔍 Fetching characters from Supabase for user:', supabaseUserId);
      try {
        const dbResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/clouds_characters?select=*&supabase_user_id=eq.${supabaseUserId}`,
          {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Content-Type': 'application/json'
            }
          }
        );

        if (dbResponse.ok) {
          const dbCharacters = await dbResponse.json();
          console.log('   Found', dbCharacters.length, 'characters from Supabase');

          // Merge database characters with local storage
          dbCharacters.forEach(dbChar => {
            const existingIndex = characters.findIndex(c => c.id === dbChar.dicecloud_character_id);

            // Parse raw_dicecloud_data if it's a JSON string
            let rawData = dbChar.raw_dicecloud_data || {};
            if (typeof rawData === 'string') {
              try {
                rawData = JSON.parse(rawData);
              } catch (e) {
                console.warn('   Failed to parse raw_dicecloud_data for:', dbChar.character_name);
                rawData = {};
              }
            }

            // Convert database format to local storage format with VTT-specific fields
            const characterEntry = {
              id: dbChar.dicecloud_character_id,
              name: dbChar.character_name || 'Unknown',
              level: dbChar.level || '?',
              class: dbChar.class || 'No Class',
              race: dbChar.race || 'Unknown',
              raw: rawData,
              lastSynced: dbChar.updated_at || new Date().toISOString(),
              rollcloud: null,  // Parsed on-demand when RollCloud tab is used
              owlcloud: null,   // Parsed on-demand when OwlCloud tab is used
              foundcloud: null  // Parsed on-demand when FoundCloud tab is used
            };

            if (existingIndex >= 0) {
              characters[existingIndex] = characterEntry;
            } else {
              characters.push(characterEntry);
            }
          });

          console.log('   Merged: now have', characters.length, 'total characters');

          // Save merged list back to local storage
          await browserAPI.storage.local.set({ carmaclouds_characters: characters });
          console.log('   ✅ Saved merged characters to local storage');
        }
      } catch (dbError) {
        console.error('   ❌ Error fetching from Supabase:', dbError);
        // Continue with local storage characters only
      }
    }

    characters.forEach((char, index) => {
      console.log(`   Character ${index}:`, {
        id: char.id,
        name: char.name,
        class: char.class,
        level: char.level,
        race: char.race,
        hasRaw: !!char.raw
      });
    });

    // Convert carmaclouds array format to rollcloud object format
    // Old format: { [characterId]: { name, class, level, race, ...raw data } }
    const profiles = {};

    characters.forEach((char, index) => {
      if (char.id) {
        // Assign to regular slot numbers (slot-1, slot-2, etc.)
        const profileKey = `slot-${index + 1}`;
        profiles[profileKey] = {
          id: char.id,
          name: char.name || 'Unknown',
          character_name: char.name || 'Unknown',
          class: char.class || 'Unknown',
          level: char.level || 1,
          race: char.race || 'Unknown',
          raw: char.raw // Include raw data for parsing
        };
        console.log(`   ✅ Created ${profileKey}:`, profiles[profileKey].name);
      } else {
        console.log(`   ⚠️ Skipped character at index ${index} - no ID`);
      }
    });

    console.log('📋 Returning profiles:', Object.keys(profiles));
    return {
      success: true,
      profiles: profiles
    };
  } catch (error) {
    console.error('Error getting character profiles:', error);
    return {
      success: false,
      error: error.message,
      profiles: {}
    };
  }
}

// Handle set active character (RollCloud adapter compatibility)
async function handleSetActiveCharacter(characterId) {
  try {
    // Verify character exists
    const result = await browserAPI.storage.local.get('carmaclouds_characters');
    const characters = result.carmaclouds_characters || [];
    const character = characters.find(char => char.id === characterId);

    if (!character) {
      return {
        success: false,
        error: 'Character not found'
      };
    }

    // Set active character ID
    await browserAPI.storage.local.set({ activeCharacterId: characterId });

    return {
      success: true,
      characterId: characterId
    };
  } catch (error) {
    console.error('Error setting active character:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Handle request for prepared character data from popup
async function handleRequestPreparedData() {
  try {
    // Find Roll20 tab
    const tabs = await browserAPI.tabs.query({ url: '*://app.roll20.net/*' });
    
    if (tabs.length === 0) {
      return {
        success: false,
        error: 'No Roll20 tab found. Please open Roll20 first.'
      };
    }

    // Request prepared data from Roll20 content script
    const response = await browserAPI.tabs.sendMessage(tabs[0].id, {
      type: 'REQUEST_PREPARED_DATA'
    });

    if (response && response.success) {
      return {
        success: true,
        data: response.data,
        timestamp: response.timestamp,
        age: response.age
      };
    } else {
      return {
        success: false,
        error: response?.error || 'No prepared character data available. Please use "Push to Roll20" first.'
      };
    }
  } catch (error) {
    console.error('Error requesting prepared data:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper functions to extract character info from DiceCloud raw data
function extractClass(rawData) {
  if (!rawData || !rawData.variables || !Array.isArray(rawData.variables)) return 'Unknown';
  for (const variable of rawData.variables) {
    if (variable.variableName === 'class') {
      return variable.value || 'Unknown';
    }
  }
  return 'Unknown';
}

function extractLevel(rawData) {
  if (!rawData || !rawData.variables || !Array.isArray(rawData.variables)) return 1;
  for (const variable of rawData.variables) {
    if (variable.variableName === 'level') {
      return variable.value || 1;
    }
  }
  return 1;
}

function extractRace(rawData) {
  if (!rawData || !rawData.variables || !Array.isArray(rawData.variables)) return 'Unknown';
  for (const variable of rawData.variables) {
    if (variable.variableName === 'race') {
      return variable.value || 'Unknown';
    }
  }
  return 'Unknown';
}

// Handle character updates
async function handleCharacterUpdate(data) {
  console.log('Character updated:', data);
  // TODO: Sync to Supabase
}

// Handle sync requests
async function handleSyncRequest(data) {
  console.log('Sync requested:', data);
  // TODO: Fetch from Supabase
}

// Handle sync to CarmaClouds from DiceCloud
async function handleSyncToCarmaClouds(characterData) {
  try {
    console.log('💾 Step 1: Starting sync for character:', characterData.name);

    // Store character data in browserAPI.storage.local
    const storageKey = `carmaclouds_character_${characterData.name || 'unknown'}`;
    console.log('💾 Step 2: Saving individual character with key:', storageKey);

    await browserAPI.storage.local.set({
      [storageKey]: {
        ...characterData,
        syncedAt: new Date().toISOString(),
        platforms: ['dicecloud'] // Mark as available from DiceCloud
      }
    });
    console.log('✅ Step 2: Individual character saved');

    // Also update the characters list
    console.log('💾 Step 3: Getting characters list...');
    const result = await browserAPI.storage.local.get('carmaclouds_characters');
    const characters = result.carmaclouds_characters || [];
    console.log('✅ Step 3: Found', characters.length, 'existing characters');

    // Add or update character in the list
    console.log('💾 Step 4: Updating characters list...');
    const existingIndex = characters.findIndex(c => c.id === characterData.id);
    if (existingIndex >= 0) {
      console.log('📝 Updating existing character at index', existingIndex);
      characters[existingIndex] = {
        ...characters[existingIndex],
        ...characterData,
        syncedAt: new Date().toISOString(),
        platforms: [...(characters[existingIndex].platforms || []), 'dicecloud']
      };
    } else {
      console.log('➕ Adding new character to list');
      characters.push({
        ...characterData,
        syncedAt: new Date().toISOString(),
        platforms: ['dicecloud']
      });
    }

    console.log('💾 Step 5: Saving updated characters list...');
    await browserAPI.storage.local.set({ carmaclouds_characters: characters });
    console.log('✅ Step 5: Characters list saved');

    // Set the synced character as active (always update to the most recently synced)
    if (characterData.id) {
      console.log('💾 Step 6: Setting as active character:', characterData.id);
      await browserAPI.storage.local.set({ activeCharacterId: characterData.id });
      console.log('✅ Step 6: Active character ID set');
    }

    console.log('🎉 Character successfully synced to CarmaClouds storage');

    // Sync to Supabase database
    try {
      console.log('💾 Step 7: Syncing to Supabase database...');

      // Get auth info to include user_id_dicecloud and username
      const authResult = await browserAPI.storage.local.get(['diceCloudUserId', 'username']);

      // Prepare character data for Supabase - only raw data at sync time
      // VTT-specific parsed data (roll20_data, owlbear_data, foundry_data) is added when pushing to VTT
      const payload = {
        user_id_dicecloud: authResult.diceCloudUserId || null,
        dicecloud_character_id: characterData.id,
        character_name: characterData.name || 'Unknown',
        raw_dicecloud_data: characterData, // Store the full character object with raw DiceCloud data
        updated_at: new Date().toISOString()
      };

      console.log('📤 Sending character to Supabase:', payload.character_name);

      // Check if character already exists
      const checkResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/clouds_characters?dicecloud_character_id=eq.${characterData.id}`,
        {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );

      let response;
      if (checkResponse.ok) {
        const existing = await checkResponse.json();
        
        if (existing && existing.length > 0) {
          // Character exists - update it
          console.log('📝 Updating existing character in Supabase...');
          response = await fetch(
            `${SUPABASE_URL}/rest/v1/clouds_characters?dicecloud_character_id=eq.${characterData.id}`,
            {
              method: 'PATCH',
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              },
              body: JSON.stringify(payload)
            }
          );
        } else {
          // Character doesn't exist - insert it
          console.log('➕ Inserting new character to Supabase...');
          response = await fetch(
            `${SUPABASE_URL}/rest/v1/clouds_characters`,
            {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              },
              body: JSON.stringify(payload)
            }
          );
        }

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Step 7: Character synced to Supabase:', result);
        } else {
          const errorText = await response.text();
          console.error('❌ Supabase sync failed:', response.status, errorText);
        }
      } else {
        console.error('❌ Failed to check if character exists:', checkResponse.status);
      }
    } catch (supabaseError) {
      console.error('❌ Failed to sync to Supabase (non-fatal):', supabaseError);
      // Don't fail the entire sync if Supabase fails
    }

    // Send message to popup to notify about the sync
    try {
      const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 0) {
        await browserAPI.tabs.sendMessage(tabs[0].id, {
          action: 'dataSynced',
          characterName: characterData.name
        });
        console.log('📤 Sent dataSynced message to popup');
      }
    } catch (tabError) {
      console.log('⚠️ Could not send sync notification to popup:', tabError);
    }

    return {
      success: true,
      message: 'Character synced successfully',
      characterCount: characters.length
    };

  } catch (error) {
    console.error('❌ Error syncing character to CarmaClouds:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Clear all character data from Supabase cloud storage
 */
async function handleClearAllCloudData() {
  try {
    // Get the user's DiceCloud user ID
    const result = await browserAPI.storage.local.get(['diceCloudUserId']);
    const userId = result.diceCloudUserId;
    
    if (!userId) {
      throw new Error('No DiceCloud user ID found. Please log in first.');
    }
    
    console.log('🗑️ Deleting all characters for user:', userId);
    
    // Delete all characters for this user from Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/clouds_characters?user_id_dicecloud=eq.${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete cloud data: ${response.status} - ${errorText}`);
    }
    
    const deletedChars = await response.json();
    const count = Array.isArray(deletedChars) ? deletedChars.length : 0;
    
    console.log(`✅ Deleted ${count} characters from cloud`);
    
    return {
      success: true,
      message: `Deleted ${count} character(s) from cloud storage.`
    };
  } catch (error) {
    console.error('❌ Error clearing cloud data:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleGetCharacterData,
    handleStoreCharacterData,
    handleClearAllCloudData
  };
}

// Handle extension installation
browserAPI.runtime.onInstalled.addListener((details) => {
  console.log('CarmaClouds extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    console.log('CarmaClouds: First time installation');
  } else if (details.reason === 'update') {
    console.log('CarmaClouds: Extension updated');
  }
});
