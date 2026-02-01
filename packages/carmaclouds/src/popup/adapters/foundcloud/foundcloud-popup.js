/**
 * FoundCloud Popup Logic
 * Manages character sync to Supabase for Foundry VTT
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@carmaclouds/core/supabase/config.js';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Storage keys
const STORAGE_KEYS = {
  CHARACTERS: 'rollcloud_character_cache', // Shared with rollcloud for now
  LAST_SYNC: 'foundcloud_last_sync'
};

let characters = [];

/**
 * Initialize the popup
 */
export default function initFoundCloudPopup() {
  console.log('FoundCloud popup initializing...');

  // Load characters from cache
  loadCharacters();

  // Set up event listeners
  document.getElementById('syncAllBtn')?.addEventListener('click', syncAllCharacters);
  document.getElementById('copyUrlBtn')?.addEventListener('click', copyModuleUrl);
}

/**
 * Load characters from local storage
 */
async function loadCharacters() {
  try {
    const storage = await chrome.storage.local.get(STORAGE_KEYS.CHARACTERS);
    const cachedData = storage[STORAGE_KEYS.CHARACTERS];

    if (cachedData && cachedData.characters) {
      characters = cachedData.characters;
      renderCharacterList();
    } else {
      showEmptyState();
    }
  } catch (error) {
    console.error('Failed to load characters:', error);
    showError('Failed to load characters from cache');
  }
}

/**
 * Render the character list
 */
function renderCharacterList() {
  const listEl = document.getElementById('characterList');
  if (!listEl) return;

  if (characters.length === 0) {
    showEmptyState();
    return;
  }

  listEl.innerHTML = characters.map(char => {
    const syncStatus = char.syncedToFoundCloud ? 'synced' : 'not-synced';
    const syncText = char.syncedToFoundCloud
      ? `Synced ${getRelativeTime(char.lastSyncTime)}`
      : 'Not synced';

    return `
      <div class="character-item" data-char-id="${char.id}">
        <div class="character-header">
          <div class="character-info">
            <div class="character-name">${escapeHtml(char.name)}</div>
            <div class="character-details">
              Level ${char.variables?.level || '?'}
              ${char.variables?.race || 'Unknown'}
              ${char.variables?.class || 'Unknown'}
            </div>
          </div>
          <div class="sync-status ${syncStatus}">
            <span class="sync-indicator"></span>
            <span>${syncText}</span>
          </div>
        </div>
        <div class="character-actions">
          <button class="btn btn-small btn-primary" onclick="window.syncCharacter('${char.id}')">
            Sync to Cloud
          </button>
          <button class="btn btn-small btn-secondary" onclick="window.viewCharacter('${char.id}')">
            View
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Expose functions to window for onclick handlers
  window.syncCharacter = syncCharacter;
  window.viewCharacter = viewCharacter;
}

/**
 * Show empty state
 */
function showEmptyState() {
  const listEl = document.getElementById('characterList');
  if (!listEl) return;

  listEl.innerHTML = `
    <div class="loading">
      <p>No DiceCloud characters found</p>
      <p style="font-size: 12px; margin-top: 8px;">
        Visit <a href="https://dicecloud.com" target="_blank" style="color: #ff6b35;">DiceCloud</a>
        to load your characters
      </p>
    </div>
  `;
}

/**
 * Sync all characters to Supabase
 */
async function syncAllCharacters() {
  const btn = document.getElementById('syncAllBtn');
  if (!btn) return;

  btn.disabled = true;
  btn.textContent = 'Syncing...';

  try {
    let syncedCount = 0;
    for (const char of characters) {
      await syncCharacterToSupabase(char);
      syncedCount++;
    }

    showSuccess(`Successfully synced ${syncedCount} character(s) to cloud`);

    // Reload characters to update sync status
    await loadCharacters();
  } catch (error) {
    console.error('Failed to sync all characters:', error);
    showError('Failed to sync characters: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sync All';
  }
}

/**
 * Sync individual character to Supabase
 */
async function syncCharacter(charId) {
  const char = characters.find(c => c.id === charId);
  if (!char) return;

  try {
    await syncCharacterToSupabase(char);

    // Update local sync status
    char.syncedToFoundCloud = true;
    char.lastSyncTime = new Date().toISOString();

    // Save to storage
    await chrome.storage.local.set({
      [STORAGE_KEYS.CHARACTERS]: { characters }
    });

    showSuccess(`${char.name} synced to cloud`);
    renderCharacterList();
  } catch (error) {
    console.error('Failed to sync character:', error);
    showError(`Failed to sync ${char.name}: ` + error.message);
  }
}

/**
 * Sync character data to Supabase
 */
async function syncCharacterToSupabase(char) {
  const characterData = {
    dicecloud_character_id: char.id,
    character_name: char.name,
    level: char.variables?.level || 1,
    race: char.variables?.race || 'Unknown',
    class: char.variables?.class || 'Unknown',
    character_data: char, // Full character object
    platform: ['foundry'], // Platform array
    updated_at: new Date().toISOString()
  };

  // Upsert to foundcloud_characters table
  const { error } = await supabase
    .from('foundcloud_characters')
    .upsert(characterData, {
      onConflict: 'dicecloud_character_id'
    });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * View character (open DiceCloud sheet)
 */
function viewCharacter(charId) {
  chrome.tabs.create({
    url: `https://dicecloud.com/character/${charId}`
  });
}

/**
 * Copy module URL to clipboard
 */
async function copyModuleUrl() {
  const input = document.getElementById('moduleUrl');
  const btn = document.getElementById('copyUrlBtn');

  if (!input || !btn) return;

  try {
    await navigator.clipboard.writeText(input.value);

    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.background = '#22c55e';

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
    }, 2000);
  } catch (error) {
    console.error('Failed to copy:', error);
    showError('Failed to copy URL');
  }
}

/**
 * Show success message
 */
function showSuccess(message) {
  showStatus(message, 'success');
}

/**
 * Show error message
 */
function showError(message) {
  showStatus(message, 'error');
}

/**
 * Show status message
 */
function showStatus(message, type) {
  const statusEl = document.getElementById('statusMessage');
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;

  setTimeout(() => {
    statusEl.classList.add('hidden');
  }, 5000);
}

/**
 * Get relative time string
 */
function getRelativeTime(timestamp) {
  if (!timestamp) return 'never';

  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

/**
 * Escape HTML
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
