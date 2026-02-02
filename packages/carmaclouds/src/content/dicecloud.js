/**
 * DiceCloud Content Script
 * Adds sync button to DiceCloud website and captures character data
 */

import { parseCharacterData } from './dicecloud-extraction.js';

console.log('CarmaClouds: DiceCloud content script loaded');

// Wait for page to load
function waitForPageLoad() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDiceCloudSync);
  } else {
    initializeDiceCloudSync();
  }
}

// Initialize the DiceCloud sync functionality
function initializeDiceCloudSync() {
  console.log('CarmaClouds: Initializing DiceCloud sync...');
  
  // Wait a bit for any dynamic content to load
  setTimeout(() => {
    console.log('CarmaClouds: Attempting to add sync button...');
    addSyncButtonToDiceCloud();
  }, 1000); // Reduced from 2000ms to 1000ms for faster appearance
}

// Add sync button to DiceCloud interface
function addSyncButtonToDiceCloud() {
  console.log('CarmaClouds: addSyncButtonToDiceCloud called');
  
  // Check if button already exists
  if (document.querySelector('#carmaclouds-sync-btn')) {
    console.log('CarmaClouds: Sync button already exists');
    return;
  }

  console.log('CarmaClouds: Creating sync button container...');

  // Create sync button container
  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'carmaclouds-sync-container';
  buttonContainer.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  // Create draggable handle
  const dragHandle = document.createElement('div');
  dragHandle.innerHTML = '⋮⋮';
  dragHandle.style.cssText = `
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 4px 8px;
    border-radius: 4px 4px 0 0;
    cursor: move;
    font-size: 12px;
    text-align: center;
    user-select: none;
    border: 1px solid #333;
    border-bottom: none;
  `;

  // Create sync button
  const syncButton = document.createElement('button');
  syncButton.id = 'carmaclouds-sync-btn';
  syncButton.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M23 4v6h-6M1 20v-6h6"/>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
      </svg>
      <span>Sync to CarmaClouds</span>
    </div>
  `;
  
  // Style the button with white text, soft edges, and glow effect
  syncButton.style.cssText = `
    background: linear-gradient(135deg, #16a75a 0%, #0d8045 100%);
    color: #ffffff;
    border: none;
    padding: 10px 18px;
    border-radius: 0 0 12px 12px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(22, 167, 90, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-top: none;
  `;

  syncButton.addEventListener('mouseenter', () => {
    syncButton.style.background = 'linear-gradient(135deg, #1bc76b 0%, #0f9055 100%)';
    syncButton.style.transform = 'translateY(-1px)';
    syncButton.style.boxShadow = '0 6px 16px rgba(27, 199, 107, 0.5), 0 2px 4px rgba(0, 0, 0, 0.2)';
  });

  syncButton.addEventListener('mouseleave', () => {
    syncButton.style.background = 'linear-gradient(135deg, #16a75a 0%, #0d8045 100%)';
    syncButton.style.transform = 'translateY(0)';
    syncButton.style.boxShadow = '0 4px 12px rgba(22, 167, 90, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2)';
  });

  // Add click handler
  syncButton.addEventListener('click', handleSyncToCarmaClouds);

  // Add drag functionality
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  // Restore saved position with bounds checking
  const savedPosition = localStorage.getItem('carmaclouds_button_position');
  if (savedPosition) {
    try {
      const pos = JSON.parse(savedPosition);
      // Keep button on screen by clamping offsets
      const maxRight = window.innerWidth - 200; // Button width ~200px
      const maxBottom = window.innerHeight - 100; // Button height ~100px
      xOffset = Math.max(-window.innerWidth + 200, Math.min(maxRight, pos.x || 0));
      yOffset = Math.max(-100, Math.min(maxBottom, pos.y || 0));
      buttonContainer.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
    } catch (e) {
      console.warn('CarmaClouds: Could not restore button position');
    }
  }

  dragHandle.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === dragHandle) {
      isDragging = true;
      dragHandle.style.background = 'rgba(0, 0, 0, 0.9)';
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      // Keep button on screen while dragging
      const maxRight = window.innerWidth - 200;
      const maxBottom = window.innerHeight - 100;
      currentX = Math.max(-window.innerWidth + 200, Math.min(maxRight, currentX));
      currentY = Math.max(-100, Math.min(maxBottom, currentY));

      xOffset = currentX;
      yOffset = currentY;

      buttonContainer.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }
  }

  function dragEnd(e) {
    if (isDragging) {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
      dragHandle.style.background = 'rgba(0, 0, 0, 0.8)';
      
      // Save position to localStorage
      localStorage.setItem('carmaclouds_button_position', JSON.stringify({
        x: xOffset,
        y: yOffset
      }));
    }
  }

  // Assemble the container
  buttonContainer.appendChild(dragHandle);
  buttonContainer.appendChild(syncButton);

  // Add to page (fixed position, not in any container)
  console.log('CarmaClouds: Adding button to document.body...');
  document.body.appendChild(buttonContainer);
  
  // Verify the button was added
  const addedButton = document.querySelector('#carmaclouds-sync-btn');
  console.log('CarmaClouds: Button verification:', addedButton ? 'SUCCESS' : 'FAILED');
  console.log('CarmaClouds: Sync button added to DiceCloud');
}

// Handle sync to CarmaClouds
async function handleSyncToCarmaClouds() {
  const button = document.querySelector('#carmaclouds-sync-btn');
  const originalContent = button.innerHTML;
  
  try {
    // Show loading state
    button.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 16px; height: 16px; border: 2px solid #ffffff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <span>Syncing...</span>
      </div>
    `;
    button.disabled = true;

    // Get character data from DiceCloud page
    const characterData = await extractCharacterData();
    
    if (!characterData) {
      throw new Error('Could not extract character data from DiceCloud');
    }

    console.log('CarmaClouds: Extracted character data:', characterData);

    // Send data to extension background script
    console.log('CarmaClouds: 📤 Sending message to background script...');

    let response;
    try {
      response = await chrome.runtime.sendMessage({
        type: 'SYNC_CHARACTER_TO_CARMACLOUDS',
        data: characterData
      });
      console.log('CarmaClouds: 📥 Received response from background:', response);
    } catch (error) {
      console.error('CarmaClouds: ❌ Error sending message to background:', error);
      throw new Error(`Failed to communicate with extension: ${error.message}`);
    }

    if (!response) {
      console.error('CarmaClouds: ❌ No response from background script (service worker may be inactive)');
      throw new Error('No response from extension background script');
    }

    if (response && response.success) {
      // Show success state
      button.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>Synced!</span>
        </div>
      `;
      button.style.background = 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)';
      
      // Reset after 3 seconds
      setTimeout(() => {
        button.innerHTML = originalContent;
        button.style.background = 'linear-gradient(135deg, #16a75a 0%, #0d8045 100%)';
        button.disabled = false;
      }, 3000);
    } else {
      throw new Error(response?.error || 'Failed to sync character data');
    }

  } catch (error) {
    console.error('CarmaClouds: Sync error:', error);
    
    // Show error state
    button.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>Sync Failed</span>
      </div>
    `;
    button.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
    
    // Reset after 3 seconds
    setTimeout(() => {
      button.innerHTML = originalContent;
      button.style.background = 'linear-gradient(135deg, #16a75a 0%, #0d8045 100%)';
      button.disabled = false;
    }, 3000);
  }
}

// Extract character data from DiceCloud page
async function extractCharacterData() {
  try {
    console.log('CarmaClouds: Extracting character data using DiceCloud API...');
    
    // Extract character ID from URL
    function getCharacterIdFromUrl() {
      const url = window.location.pathname;
      console.log('CarmaClouds: Parsing URL:', url);

      const patterns = [
        /\/character\/([^/]+)/,           // /character/ABC123
        /\/character\/([^/]+)\/[^/]+/,    // /character/ABC123/CharName
        /character=([^&]+)/,              // ?character=ABC123
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          console.log('CarmaClouds: Found character ID:', match[1]);
          return match[1];
        }
      }

      console.error('CarmaClouds: Could not extract character ID from URL');
      return null;
    }
    
    const characterId = getCharacterIdFromUrl();
    if (!characterId) {
      throw new Error('Not on a character page. Navigate to a character sheet first.');
    }

    // Get API token from extension storage
    const tokenResult = await chrome.storage.local.get(['dicecloud_auth_token']);
    const token = tokenResult.dicecloud_auth_token;
    
    if (!token) {
      throw new Error('Not logged in to DiceCloud. Please login via the extension popup.');
    }

    console.log('CarmaClouds: Fetching character data from API...');
    
    // Fetch character data from DiceCloud API
    const API_BASE = 'https://dicecloud.com/api';
    const timestamp = Date.now();
    const apiUrl = `${API_BASE}/creature/${characterId}?_t=${timestamp}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store'
    });

    console.log('CarmaClouds: API Response status:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('API token expired. Please login again via the extension popup.');
      }
      const errorText = await response.text();
      console.error('CarmaClouds: API Error Response:', errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('CarmaClouds: Received API data');

    // Parse the character data using comprehensive extraction
    const characterData = parseCharacterData(data, characterId);
    console.log('CarmaClouds: Successfully extracted character data:', characterData);
    return characterData;
    
  } catch (error) {
    console.error('CarmaClouds: Error extracting character data:', error);
    
    // Fallback to basic page extraction if API fails
    console.log('CarmaClouds: Trying fallback page extraction...');
    
    const characterName = document.querySelector('h1, .character-name, [data-testid="character-name"]')?.textContent?.trim();
    if (characterName) {
      return {
        name: characterName,
        level: 'Unknown',
        class: 'Unknown', 
        race: 'Unknown',
        url: window.location.href,
        timestamp: new Date().toISOString(),
        source: 'dicecloud',
        extractionError: error.message
      };
    }
    
    throw error;
  }
}

// Add CSS animation for loading spinner
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

// Watch for URL changes (for client-side routing)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    console.log('CarmaClouds: URL changed to:', url);
    // Re-check if we should add the button
    setTimeout(() => {
      if (!document.querySelector('#carmaclouds-sync-btn')) {
        console.log('CarmaClouds: Button not found after navigation, re-adding...');
        addSyncButtonToDiceCloud();
      }
    }, 1500);
  }
}).observe(document, { subtree: true, childList: true });

// Initialize when page loads
waitForPageLoad();
