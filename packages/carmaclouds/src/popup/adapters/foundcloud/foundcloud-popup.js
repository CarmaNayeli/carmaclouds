/**
 * FoundCloud Popup Logic
 * Manages character sync to Supabase for Foundry VTT
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@carmaclouds/core/supabase/config.js';
import { parseForFoundCloud } from '../../../content/dicecloud-extraction.js';

// Detect browser API (Firefox uses 'browser', Chrome uses 'chrome')
const browserAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let characters = [];

/**
 * Initialize the popup
 */
export default function initFoundCloudPopup() {
  console.log('FoundCloud popup initializing...');

  // Load characters from unified storage
  loadCharacters();

  // Set up event listeners
  document.getElementById('copyUrlBtn')?.addEventListener('click', copyModuleUrl);
}

/**
 * Load characters from unified carmaclouds_characters storage
 */
async function loadCharacters() {
  try {
    // Get all character profiles from unified storage (same as OwlCloud)
    const profilesResponse = await browserAPI.runtime.sendMessage({ action: 'getAllCharacterProfiles' });
    const profiles = profilesResponse.success ? profilesResponse.profiles : {};

    // Convert profiles object to array
    characters = Object.values(profiles).filter(char => 
      char && char.id && char.name
    );

    console.log(`FoundCloud: Loaded ${characters.length} characters from unified storage`);

    if (characters.length > 0) {
      renderCharacterList();
    } else {
      showEmptyState();
    }
  } catch (error) {
    console.error('Failed to load characters:', error);
    showError('Failed to load characters from storage');
  }
}

/**
 * Render the character list
 */
function renderCharacterList() {
  const listEl = document.getElementById('characterList');
  const emptyState = document.getElementById('emptyState');
  
  if (!listEl) return;

  if (characters.length === 0) {
    listEl.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  listEl.style.display = 'flex';
  if (emptyState) emptyState.style.display = 'none';

  listEl.innerHTML = characters.map(char => {
    const level = char.level || char.preview?.level || '?';
    const race = char.race || char.preview?.race || 'Unknown';
    const charClass = char.class || char.preview?.class || 'Unknown';

    return `
      <div style="background: #2a2a2a; border-radius: 8px; padding: 16px; border: 1px solid #333;">
        <div style="margin-bottom: 12px;">
          <div style="color: #e0e0e0; font-size: 16px; font-weight: 600; margin-bottom: 4px;">
            ${escapeHtml(char.name)}
          </div>
          <div style="color: #888; font-size: 13px;">
            Level ${level} ${charClass} • ${race}
          </div>
        </div>
        <button 
          class="sync-btn" 
          data-char-id="${char.id}"
          style="width: 100%; padding: 10px; background: #16a75a; color: #000; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px;"
        >
          ☁️ Sync to Cloud
        </button>
      </div>
    `;
  }).join('');

  // Add event listeners to sync buttons
  document.querySelectorAll('.sync-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const charId = e.target.dataset.charId;
      await syncCharacter(charId);
    });
  });
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
  if (!char) {
    console.error('Character not found:', charId);
    return;
  }

  // Find the button and update its state
  const btn = document.querySelector(`.sync-btn[data-char-id="${charId}"]`);
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Syncing...';
  }

  try {
    await syncCharacterToSupabase(char);

    showSuccess(`${char.name} synced to cloud`);
    
    if (btn) {
      btn.textContent = '✓ Synced!';
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = '🔄 Re-sync to Cloud';
      }, 2000);
    }
  } catch (error) {
    console.error('Failed to sync character:', error);
    showError(`Failed to sync ${char.name}: ` + error.message);
    
    if (btn) {
      btn.disabled = false;
      btn.textContent = '❌ Failed - Retry';
    }
  }
}

/**
 * Sync character data to Supabase
 */
async function syncCharacterToSupabase(char) {
  // Get current auth session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error('Not authenticated. Please log in to sync characters.');
  }

  // Get DiceCloud user ID from storage
  const authResult = await browserAPI.storage.local.get(['diceCloudUserId']);
  const dicecloudUserId = authResult.diceCloudUserId || null;

  // Parse character data using imported parseForFoundCloud
  const parsedData = parseForFoundCloud(char.raw, char.id);

  // Build character data with basic fields and parsed data in single JSON column
  const characterData = {
    dicecloud_character_id: char.id,
    character_name: char.name,
    level: parsedData?.level || char.level || 1,
    race: parsedData?.race || char.race || 'Unknown',
    class: parsedData?.class || char.class || 'Unknown',
    foundcloud_parsed_data: parsedData || {},
    raw_dicecloud_data: char.raw || {},
    platform: ['foundcloud'],
    supabase_user_id: session.user.id,
    user_id_dicecloud: dicecloudUserId
  };

  // Check if character already exists
  const { data: existing } = await supabase
    .from('clouds_characters')
    .select('id')
    .eq('dicecloud_character_id', char.id)
    .single();

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from('clouds_characters')
      .update(characterData)
      .eq('dicecloud_character_id', char.id);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    // Insert new record
    const { error } = await supabase
      .from('clouds_characters')
      .insert(characterData);

    if (error) {
      throw new Error(error.message);
    }
  }
}

/**
 * View character (open DiceCloud sheet)
 */
function viewCharacter(charId) {
  browserAPI.tabs.create({
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
