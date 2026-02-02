/**
 * CarmaClouds Unified Background Service Worker
 * Handles cross-platform character sync and messaging
 */

console.log('CarmaClouds background service worker initialized');

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  // Handle different message types
  switch (message.type) {
    case 'CHARACTER_UPDATED':
      handleCharacterUpdate(message.data);
      break;
    case 'SYNC_REQUEST':
      handleSyncRequest(message.data);
      break;
    case 'SYNC_CHARACTER_TO_CARMACLOUDS':
      handleSyncToCarmaClouds(message.data, sendResponse);
      return true; // Keep channel open for async response
    default:
      console.warn('Unknown message type:', message.type);
  }

  return true; // Keep channel open for async response
});

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
async function handleSyncToCarmaClouds(characterData, sendResponse) {
  try {
    console.log('Syncing character to CarmaClouds:', characterData);
    
    // Store character data in chrome.storage.local
    const storageKey = `carmaclouds_character_${characterData.name || 'unknown'}`;
    await chrome.storage.local.set({
      [storageKey]: {
        ...characterData,
        syncedAt: new Date().toISOString(),
        platforms: ['dicecloud'] // Mark as available from DiceCloud
      }
    });
    
    // Also update the characters list
    const result = await chrome.storage.local.get('carmaclouds_characters');
    const characters = result.carmaclouds_characters || [];
    
    // Add or update character in the list
    const existingIndex = characters.findIndex(c => c.name === characterData.name);
    if (existingIndex >= 0) {
      characters[existingIndex] = {
        ...characters[existingIndex],
        ...characterData,
        syncedAt: new Date().toISOString(),
        platforms: [...(characters[existingIndex].platforms || []), 'dicecloud']
      };
    } else {
      characters.push({
        ...characterData,
        syncedAt: new Date().toISOString(),
        platforms: ['dicecloud']
      });
    }
    
    await chrome.storage.local.set({ carmaclouds_characters: characters });
    
    console.log('Character successfully synced to CarmaClouds storage');
    
    sendResponse({ 
      success: true, 
      message: 'Character synced successfully',
      characterCount: characters.length
    });
    
  } catch (error) {
    console.error('Error syncing character to CarmaClouds:', error);
    sendResponse({ 
      success: false, 
      error: error.message 
    });
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
