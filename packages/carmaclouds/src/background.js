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
    handleGetCharacterData()
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
    handleGetAllCharacterProfiles()
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
async function handleGetCharacterData() {
  try {
    const result = await browserAPI.storage.local.get(['carmaclouds_characters', 'activeCharacterId']);
    const characters = result.carmaclouds_characters || [];
    const activeCharacterId = result.activeCharacterId;

    // Try to find active character first
    let activeCharacter = null;
    if (activeCharacterId) {
      activeCharacter = characters.find(char => char.id === activeCharacterId);
    }

    // Fall back to first character if no active character found
    if (!activeCharacter && characters.length > 0) {
      activeCharacter = characters[0];
    }

    if (activeCharacter) {
      // Return the full character object
      console.log('📤 Returning character data:', activeCharacter.name);
      console.log('   Has hitPoints:', !!activeCharacter.hitPoints);
      console.log('   Has raw:', !!activeCharacter.raw);
      return {
        success: true,
        data: activeCharacter
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

    // Find character by ID
    const characterId = characterData.id || characterData.dicecloud_character_id;
    if (!characterId) {
      throw new Error('Character data missing ID');
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
        raw: existingCharacter.raw || characterData.raw, // Keep raw if it exists
        preview: existingCharacter.preview || characterData.preview // Keep preview if it exists
      };
      console.log('   Preserved raw data:', !!characters[existingIndex].raw);
    } else {
      // Add new character
      console.log('✅ Adding new character:', characterData.name);
      characters.push(characterData);
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
async function handleGetAllCharacterProfiles() {
  try {
    const result = await browserAPI.storage.local.get('carmaclouds_characters');
    const characters = result.carmaclouds_characters || [];

    // Convert carmaclouds array format to rollcloud object format
    // Old format: { [characterId]: { name, class, level, race, ...raw data } }
    const profiles = {};

    characters.forEach(char => {
      if (char.id && char.raw) {
        profiles[char.id] = {
          id: char.id,
          name: char.name || char.raw.name || 'Unknown',
          character_name: char.name || char.raw.name || 'Unknown',
          class: extractClass(char.raw),
          level: extractLevel(char.raw),
          race: extractRace(char.raw),
          ...char.raw // Include all raw data for compatibility
        };
      }
    });

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
    const existingIndex = characters.findIndex(c => c.name === characterData.name);
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

    // Set as active character if none is set
    const storageCheck = await browserAPI.storage.local.get('activeCharacterId');
    if (!storageCheck.activeCharacterId && characterData.id) {
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

      // Upsert to Supabase (insert or update if exists)
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/clouds_characters?dicecloud_character_id=eq.${characterData.id}`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=representation'
          },
          body: JSON.stringify(payload)
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Step 7: Character synced to Supabase:', result);
      } else {
        const errorText = await response.text();
        console.error('❌ Supabase sync failed:', response.status, errorText);
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

// Handle extension installation
browserAPI.runtime.onInstalled.addListener((details) => {
  console.log('CarmaClouds extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    console.log('CarmaClouds: First time installation');
  } else if (details.reason === 'update') {
    console.log('CarmaClouds: Extension updated');
  }
});
