/**
 * CarmaClouds Unified Background Service Worker
 * Handles cross-platform character sync and messaging
 */

console.log('CarmaClouds background service worker initialized');

// Keep service worker alive (Manifest V3 requirement)
let keepAliveInterval;

function keepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }

  keepAliveInterval = setInterval(() => {
    if (chrome.runtime?.id) {
      console.log('🔄 Keep-alive ping');
    } else {
      clearInterval(keepAliveInterval);
    }
  }, 20000); // Every 20 seconds
}

// Start keep-alive immediately
keepAlive();

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
    const result = await chrome.storage.local.get(['carmaclouds_characters', 'activeCharacterId']);
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
      // Return the full character object (includes id, name, and raw)
      return {
        success: true,
        data: activeCharacter
      };
    } else {
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

// Handle get all character profiles (RollCloud adapter compatibility)
// Converts carmaclouds storage format to old rollcloud format
async function handleGetAllCharacterProfiles() {
  try {
    const result = await chrome.storage.local.get('carmaclouds_characters');
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
    const result = await chrome.storage.local.get('carmaclouds_characters');
    const characters = result.carmaclouds_characters || [];
    const character = characters.find(char => char.id === characterId);

    if (!character) {
      return {
        success: false,
        error: 'Character not found'
      };
    }

    // Set active character ID
    await chrome.storage.local.set({ activeCharacterId: characterId });

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

// Helper functions to extract character info from DiceCloud raw data
function extractClass(rawData) {
  if (!rawData || !rawData.variables) return 'Unknown';
  for (const variable of rawData.variables) {
    if (variable.variableName === 'class') {
      return variable.value || 'Unknown';
    }
  }
  return 'Unknown';
}

function extractLevel(rawData) {
  if (!rawData || !rawData.variables) return 1;
  for (const variable of rawData.variables) {
    if (variable.variableName === 'level') {
      return variable.value || 1;
    }
  }
  return 1;
}

function extractRace(rawData) {
  if (!rawData || !rawData.variables) return 'Unknown';
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

    // Store character data in chrome.storage.local
    const storageKey = `carmaclouds_character_${characterData.name || 'unknown'}`;
    console.log('💾 Step 2: Saving individual character with key:', storageKey);

    await chrome.storage.local.set({
      [storageKey]: {
        ...characterData,
        syncedAt: new Date().toISOString(),
        platforms: ['dicecloud'] // Mark as available from DiceCloud
      }
    });
    console.log('✅ Step 2: Individual character saved');

    // Also update the characters list
    console.log('💾 Step 3: Getting characters list...');
    const result = await chrome.storage.local.get('carmaclouds_characters');
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
    await chrome.storage.local.set({ carmaclouds_characters: characters });
    console.log('✅ Step 5: Characters list saved');

    // Set as active character if none is set
    const storageCheck = await chrome.storage.local.get('activeCharacterId');
    if (!storageCheck.activeCharacterId && characterData.id) {
      console.log('💾 Step 6: Setting as active character:', characterData.id);
      await chrome.storage.local.set({ activeCharacterId: characterData.id });
      console.log('✅ Step 6: Active character ID set');
    }

    console.log('🎉 Character successfully synced to CarmaClouds storage');

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
chrome.runtime.onInstalled.addListener((details) => {
  console.log('CarmaClouds extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    console.log('CarmaClouds: First time installation');
  } else if (details.reason === 'update') {
    console.log('CarmaClouds: Extension updated');
  }
});
