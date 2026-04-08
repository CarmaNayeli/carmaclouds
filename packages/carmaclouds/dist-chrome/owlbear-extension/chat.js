/**
 * OwlCloud Chat Window Script
 *
 * Standalone chat interface for OwlCloud
 */

/* global OBR */

// ============== State ==============

let currentCharacter = null;
let isOwlbearReady = false;
let currentPlayerId = null;
let lastLoadedMessageId = null;

// Supabase configuration
const SUPABASE_URL = 'https://luiesmfjdcmpywavvfqm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWVzbWZqZGNtcHl3YXZ2ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODYxNDksImV4cCI6MjA4NTQ2MjE0OX0.oqjHFf2HhCLcanh0HVryoQH7iSV7E9dHHZJdYehxZ0U';
const SUPABASE_HEADERS = {
  'apikey': SUPABASE_ANON_KEY,
  'Content-Type': 'application/json'
};

// ============== Theme Synchronization ==============

/**
 * Apply theme from sheet popover to chat window
 */
function applyThemeFromSheet() {
  try {
    // Get current theme from localStorage (set by sheet popover)
    const currentTheme = localStorage.getItem('owlcloud-theme');
    if (!currentTheme) return;

    // Define theme colors (same as sheet popover)
    const themes = {
      purple: {
        primary: '#8B5CF6',
        primaryLight: '#A78BFA',
        primaryLighter: '#C4B5FD',
        gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
        bgPrimary: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        bgSecondary: 'rgba(26, 26, 46, 0.8)',
        bgAccent: 'rgba(139, 92, 246, 0.15)',
        bgCard: 'rgba(139, 92, 246, 0.1)',
        bgHover: 'rgba(139, 92, 246, 0.2)',
        textPrimary: '#e0e0e0',
        textSecondary: '#c0c0c0',
        textMuted: '#9ca3af',
        textOnPrimary: '#ffffff',
        textOnLight: '#1f2937'
      },
      blue: {
        primary: '#3B82F6',
        primaryLight: '#60A5FA',
        primaryLighter: '#93C5FD',
        gradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
        bgPrimary: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        bgSecondary: 'rgba(15, 23, 42, 0.8)',
        bgAccent: 'rgba(59, 130, 246, 0.15)',
        bgCard: 'rgba(59, 130, 246, 0.1)',
        bgHover: 'rgba(59, 130, 246, 0.2)',
        textPrimary: '#e0e0e0',
        textSecondary: '#c0c0c0',
        textMuted: '#9ca3af',
        textOnPrimary: '#ffffff',
        textOnLight: '#1f2937'
      },
      green: {
        primary: '#10B981',
        primaryLight: '#34D399',
        primaryLighter: '#6EE7B7',
        gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
        bgPrimary: 'linear-gradient(135deg, #052e16 0%, #0a4d2a 50%, #0f6b3e 100%)',
        bgSecondary: 'rgba(5, 46, 22, 0.8)',
        bgAccent: 'rgba(16, 185, 129, 0.15)',
        bgCard: 'rgba(16, 185, 129, 0.1)',
        bgHover: 'rgba(16, 185, 129, 0.2)',
        textPrimary: '#e0e0e0',
        textSecondary: '#c0c0c0',
        textMuted: '#9ca3af',
        textOnPrimary: '#ffffff',
        textOnLight: '#1f2937'
      },
      red: {
        primary: '#EF4444',
        primaryLight: '#F87171',
        primaryLighter: '#FCA5A5',
        gradient: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
        bgPrimary: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #991b1b 100%)',
        bgSecondary: 'rgba(69, 10, 10, 0.8)',
        bgAccent: 'rgba(239, 68, 68, 0.15)',
        bgCard: 'rgba(239, 68, 68, 0.1)',
        bgHover: 'rgba(239, 68, 68, 0.2)',
        textPrimary: '#e0e0e0',
        textSecondary: '#c0c0c0',
        textMuted: '#9ca3af',
        textOnPrimary: '#ffffff',
        textOnLight: '#1f2937'
      },
      orange: {
        primary: '#F97316',
        primaryLight: '#FB923C',
        primaryLighter: '#FDBA74',
        gradient: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
        bgPrimary: 'linear-gradient(135deg, #431407 0%, #7c2d12 50%, #9a3412 100%)',
        bgSecondary: 'rgba(67, 20, 7, 0.8)',
        bgAccent: 'rgba(249, 115, 22, 0.15)',
        bgCard: 'rgba(249, 115, 22, 0.1)',
        bgHover: 'rgba(249, 115, 22, 0.2)',
        textPrimary: '#e0e0e0',
        textSecondary: '#c0c0c0',
        textMuted: '#9ca3af',
        textOnPrimary: '#ffffff',
        textOnLight: '#1f2937'
      },
      yellow: {
        primary: '#EAB308',
        primaryLight: '#FACC15',
        primaryLighter: '#FDE047',
        gradient: 'linear-gradient(135deg, #EAB308 0%, #FACC15 100%)',
        bgPrimary: 'linear-gradient(135deg, #422006 0%, #713f12 50%, #854d0e 100%)',
        bgSecondary: 'rgba(66, 34, 6, 0.8)',
        bgAccent: 'rgba(234, 179, 8, 0.15)',
        bgCard: 'rgba(234, 179, 8, 0.1)',
        bgHover: 'rgba(234, 179, 8, 0.2)',
        textPrimary: '#1f2937',
        textSecondary: '#374151',
        textMuted: '#6b7280',
        textOnPrimary: '#ffffff',
        textOnLight: '#1f2937'
      },
      pink: {
        primary: '#EC4899',
        primaryLight: '#F472B6',
        primaryLighter: '#F9A8D4',
        gradient: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
        bgPrimary: 'linear-gradient(135deg, #500724 0%, #831843 50%, #9f1239 100%)',
        bgSecondary: 'rgba(80, 7, 36, 0.8)',
        bgAccent: 'rgba(236, 72, 153, 0.15)',
        bgCard: 'rgba(236, 72, 153, 0.1)',
        bgHover: 'rgba(236, 72, 153, 0.2)',
        textPrimary: '#e0e0e0',
        textSecondary: '#c0c0c0',
        textMuted: '#9ca3af',
        textOnPrimary: '#ffffff',
        textOnLight: '#1f2937'
      },
      brown: {
        primary: '#92400E',
        primaryLight: '#B45309',
        primaryLighter: '#D97706',
        gradient: 'linear-gradient(135deg, #92400E 0%, #B45309 100%)',
        bgPrimary: 'linear-gradient(135deg, #1c0f0a 0%, #442c1e 50%, #5c341e 100%)',
        bgSecondary: 'rgba(28, 15, 10, 0.8)',
        bgAccent: 'rgba(146, 64, 14, 0.15)',
        bgCard: 'rgba(146, 64, 14, 0.1)',
        bgHover: 'rgba(146, 64, 14, 0.2)',
        textPrimary: '#e0e0e0',
        textSecondary: '#c0c0c0',
        textMuted: '#9ca3af',
        textOnPrimary: '#ffffff',
        textOnLight: '#1f2937'
      },
      grey: {
        primary: '#6B7280',
        primaryLight: '#9CA3AF',
        primaryLighter: '#D1D5DB',
        gradient: 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)',
        bgPrimary: 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #4b5563 100%)',
        bgSecondary: 'rgba(31, 41, 55, 0.8)',
        bgAccent: 'rgba(107, 114, 128, 0.15)',
        bgCard: 'rgba(107, 114, 128, 0.1)',
        bgHover: 'rgba(107, 114, 128, 0.2)',
        textPrimary: '#e0e0e0',
        textSecondary: '#c0c0c0',
        textMuted: '#9ca3af',
        textOnPrimary: '#ffffff',
        textOnLight: '#1f2937'
      },
      black: {
        primary: '#1F2937',
        primaryLight: '#374151',
        primaryLighter: '#4B5563',
        gradient: 'linear-gradient(135deg, #1F2937 0%, #374151 100%)',
        bgPrimary: 'linear-gradient(135deg, #000000 0%, #111827 50%, #1f2937 100%)',
        bgSecondary: 'rgba(0, 0, 0, 0.8)',
        bgAccent: 'rgba(31, 41, 55, 0.15)',
        bgCard: 'rgba(31, 41, 55, 0.1)',
        bgHover: 'rgba(31, 41, 55, 0.2)',
        textPrimary: '#ffffff',
        textSecondary: '#e5e7eb',
        textMuted: '#9ca3af',
        textOnPrimary: '#ffffff',
        textOnLight: '#1f2937'
      },
      white: {
        primary: '#F9FAFB',
        primaryLight: '#F3F4F6',
        primaryLighter: '#E5E7EB',
        gradient: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
        bgPrimary: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
        bgSecondary: 'rgba(248, 250, 252, 0.9)',
        bgAccent: 'rgba(249, 250, 251, 0.5)',
        bgCard: 'rgba(249, 250, 251, 0.8)',
        bgHover: 'rgba(241, 245, 249, 0.9)',
        textPrimary: '#1f2937',
        textSecondary: '#374151',
        textMuted: '#6b7280',
        textOnPrimary: '#ffffff',
        textOnLight: '#1f2937'
      }
    };

    const theme = themes[currentTheme];
    if (!theme) return;

    const root = document.documentElement;
    
    // Update CSS variables
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-primary-light', theme.primaryLight);
    root.style.setProperty('--theme-primary-lighter', theme.primaryLighter);
    root.style.setProperty('--theme-gradient', theme.gradient);
    root.style.setProperty('--theme-bg-primary', theme.bgPrimary);
    root.style.setProperty('--theme-bg-secondary', theme.bgSecondary);
    root.style.setProperty('--theme-bg-accent', theme.bgAccent);
    root.style.setProperty('--theme-bg-card', theme.bgCard);
    root.style.setProperty('--theme-bg-hover', theme.bgHover);
    root.style.setProperty('--theme-text-primary', theme.textPrimary);
    root.style.setProperty('--theme-text-secondary', theme.textSecondary);
    root.style.setProperty('--theme-text-muted', theme.textMuted);
    root.style.setProperty('--theme-text-on-primary', theme.textOnPrimary);
    root.style.setProperty('--theme-text-on-light', theme.textOnLight);
    
    // Update body background and color
    document.body.style.background = theme.bgPrimary;
    document.body.style.color = theme.textPrimary;
    
    console.log(`🎨 Chat applied theme: ${currentTheme}`);
  } catch (error) {
    console.error('Failed to apply theme to chat:', error);
  }
}

/**
 * Listen for theme changes from sheet popover
 */
function setupThemeListener() {
  // Listen for storage changes (when theme changes in sheet popover)
  window.addEventListener('storage', (e) => {
    if (e.key === 'owlcloud-theme') {
      applyThemeFromSheet();
    }
  });
  
  // Also check periodically for theme changes
  setInterval(() => {
    applyThemeFromSheet();
  }, 1000);
}

// ============== DOM Elements ==============

const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');
const chatCloseBtn = document.getElementById('chat-close-btn');
const characterNameEl = document.getElementById('character-name');

// ============== Owlbear SDK Initialization ==============

OBR.onReady(async () => {
  isOwlbearReady = true;
  console.log('🦉 Owlbear SDK ready in chat window');

  // Initialize theme synchronization
  setupThemeListener();
  applyThemeFromSheet();

  // Set up Dice+ result listener for !roll commands
  setupChatDicePlusListener();

  // Get player ID
  currentPlayerId = await OBR.player.getId();

  // Check for active character
  await checkForActiveCharacter();

  // Load chat history from metadata
  await loadChatHistory();

  // Listen for messages from character sheet
  OBR.room.onMetadataChange((metadata) => {
    const message = metadata['com.owlcloud.chat/latest-message'];
    if (message && message.timestamp) {
      handleCharacterSheetMessage(message);
    }

    // Listen for new chat messages
    const messages = metadata['com.owlcloud.chat/messages'];
    if (messages && Array.isArray(messages)) {
      loadNewMessages(messages);
    }
  });

  // Listen for roll mode changes from popover
  OBR.player.onChange(async (player) => {
    const rollMode = player.metadata?.['owlcloud.rollMode'];
    updateRollModeIndicator(rollMode || 'normal');
  });

  // Set initial roll mode
  const player = await OBR.player.getMetadata();
  updateRollModeIndicator(player['owlcloud.rollMode'] || 'normal');
});

// ============== Character Management ==============

/**
 * Check for active character
 */
async function checkForActiveCharacter() {
  try {
    // First try to get from localStorage (set by popover)
    const storedCharacter = localStorage.getItem('owlcloud-active-character');
    if (storedCharacter) {
      try {
        currentCharacter = JSON.parse(storedCharacter);
        characterNameEl.textContent = currentCharacter.name || 'Unknown Character';
        console.log('✅ Chat: Loaded character from localStorage:', currentCharacter.name);
        return;
      } catch (e) {
        console.warn('Failed to parse stored character:', e);
      }
    }

    // Fallback: query Supabase
    const playerId = await OBR.player.getId();
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/characters?owlbear_player_id=${encodeURIComponent(playerId)}&fields=essential`,
      { headers: SUPABASE_HEADERS }
    );

    if (!response.ok) {
      console.error('Failed to get character:', response.statusText);
      return;
    }

    const data = await response.json();

    if (data.success && data.character) {
      currentCharacter = data.character;
      characterNameEl.textContent = currentCharacter.name || 'Unknown Character';
    }
  } catch (error) {
    console.error('Error checking for active character:', error);
  }
}

// ============== Message Handling ==============

let lastProcessedTimestamp = 0;

/**
 * Handle messages from character sheet
 */
function handleCharacterSheetMessage(message) {
  // Prevent duplicate processing
  if (message.timestamp <= lastProcessedTimestamp) {
    return;
  }
  lastProcessedTimestamp = message.timestamp;

  const characterName = message.character?.name || 'Character';

  switch (message.type) {
    case 'roll':
      if (message.data) {
        const { name, rolls, modifier, total } = message.data;
        const rollsText = rolls.join(' + ');
        const modText = modifier !== 0 ? ` ${modifier >= 0 ? '+' : ''}${modifier}` : '';
        const text = `🎲 ${name}: ${rollsText}${modText} = <strong>${total}</strong>`;
        addChatMessageToMetadata(text, 'roll', characterName);
      }
      break;

    case 'action':
      if (message.data) {
        const { actionName, details } = message.data;
        addChatMessageToMetadata(`⚔️ ${actionName} - ${details}`, 'action', characterName);
      }
      break;

    case 'spell':
      if (message.data) {
        const { spellName, level } = message.data;
        const levelText = level === 0 ? 'Cantrip' : `Level ${level}`;
        addChatMessageToMetadata(`✨ ${spellName} (${levelText})`, 'spell', characterName);
      }
      break;

    case 'combat':
      if (message.data && message.data.text) {
        addChatMessageToMetadata(message.data.text, 'combat', characterName);
      }
      break;

    default:
      console.warn('Unknown message type:', message.type);
  }
}

/**
 * Load chat history from room metadata
 */
async function loadChatHistory() {
  try {
    const metadata = await OBR.room.getMetadata();
    const messages = metadata['com.owlcloud.chat/messages'];

    if (messages && Array.isArray(messages)) {
      messages.forEach(msg => {
        displayChatMessage(msg.text, msg.type, msg.author, msg.timestamp, msg.details, msg.themeColor);
        lastLoadedMessageId = msg.id;
      });
      scrollChatToBottom();
    }
  } catch (error) {
    console.error('Error loading chat history:', error);
  }
}

/**
 * Load new messages from metadata
 */
function loadNewMessages(messages) {
  if (!Array.isArray(messages)) return;

  const newMessages = messages.filter(msg =>
    !lastLoadedMessageId || msg.id > lastLoadedMessageId
  );

  newMessages.forEach(msg => {
    displayChatMessage(msg.text, msg.type, msg.author, msg.timestamp, msg.details, msg.themeColor);
    lastLoadedMessageId = msg.id;
  });

  if (newMessages.length > 0) {
    scrollChatToBottom();
  }
}

// ============== Chat Functions ==============

/**
 * Scroll chat to bottom
 */
function scrollChatToBottom() {
  setTimeout(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 100);
}

/**
 * Display a message in the chat UI (local only, doesn't save to metadata)
 * @param {string} text - Message text
 * @param {string} type - Message type: 'system', 'roll', 'action', 'spell', 'combat', 'user'
 * @param {string} author - Message author (optional)
 * @param {number} timestamp - Message timestamp (optional)
 * @param {object} details - Message details (optional)
 * @param {string} themeColor - Theme color for author name (optional)
 */
function displayChatMessage(text, type = 'system', author = null, timestamp = null, details = null, themeColor = null) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${type}`;

  const now = timestamp ? new Date(timestamp) : new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Build message HTML
  let messageHTML = '';

  if (author) {
    // Use theme color for author name if provided, otherwise use default
    const authorStyle = themeColor ? `style="color: ${themeColor}"` : '';
    messageHTML = `
      <div class="chat-message-header">
        <span class="chat-message-author" ${authorStyle}>${author}</span>
        <span class="chat-message-time">${timeStr}</span>
      </div>
      <div class="chat-message-text">${text}</div>
    `;
  } else {
    messageHTML = `<div class="chat-message-text">${text}</div>`;
  }

  // Add expandable details if present
  if (details) {
    const detailsHTML = typeof details === 'string' ? details : JSON.stringify(details, null, 2);
    messageHTML += `
      <div class="chat-message-details" style="display: none; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--theme-border); font-size: 12px; color: var(--theme-text-muted);">
        ${detailsHTML}
      </div>
    `;

    // Make message clickable to toggle details
    messageDiv.style.cursor = 'pointer';
    messageDiv.title = 'Click to expand details';
    messageDiv.onclick = function() {
      const detailsEl = this.querySelector('.chat-message-details');
      if (detailsEl) {
        const isHidden = detailsEl.style.display === 'none';
        detailsEl.style.display = isHidden ? 'block' : 'none';
        this.title = isHidden ? 'Click to collapse' : 'Click to expand details';
      }
    };
  }

  messageDiv.innerHTML = messageHTML;
  chatMessages.appendChild(messageDiv);

  // Limit chat history to last 100 messages
  const messages = chatMessages.querySelectorAll('.chat-message');
  if (messages.length > 100) {
    messages[0].remove();
  }

  scrollChatToBottom();
}

/**
 * Add a message to chat and save to room metadata (shared with all players)
 * @param {string} text - Message text
 * @param {string} type - Message type: 'system', 'roll', 'action', 'spell', 'combat', 'user'
 * @param {string} author - Message author (optional)
 */
async function addChatMessageToMetadata(text, type = 'system', author = null) {
  if (!isOwlbearReady) return;

  try {
    const metadata = await OBR.room.getMetadata();
    const messages = metadata['com.owlcloud.chat/messages'] || [];

    // Strip HTML tags and truncate to reduce metadata size
    const plainText = text.replace(/<[^>]*>/g, '');
    const truncatedText = plainText.length > 500 ? plainText.substring(0, 497) + '...' : plainText;

    // Get current theme color
    const currentTheme = localStorage.getItem('owlcloud-theme') || 'purple';
    const themeColors = {
      purple: '#8B5CF6',
      blue: '#3B82F6', 
      green: '#10B981',
      red: '#EF4444',
      orange: '#F97316',
      yellow: '#EAB308',
      pink: '#EC4899',
      brown: '#92400E',
      grey: '#6B7280',
      black: '#1F2937',
      white: '#F9FAFB'
    };
    const themeColor = themeColors[currentTheme] || themeColors.purple;

    const newMessage = {
      id: Date.now() + Math.random(), // Unique ID
      text: truncatedText,
      type: type,
      author: author,
      playerId: currentPlayerId,
      timestamp: Date.now(),
      themeColor: themeColor // Add theme color to message
    };

    // Auto-cleanup: Remove messages older than 30 minutes
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    const recentMessages = messages.filter(msg => msg.timestamp > thirtyMinutesAgo);

    // Add new message and limit to last 10 messages (reduced from 20 to save space)
    const updatedMessages = [...recentMessages, newMessage].slice(-10);

    await OBR.room.setMetadata({
      'com.owlcloud.chat/messages': updatedMessages
    });
  } catch (error) {
    console.error('Error adding message to metadata:', error);
  }
}

// ============== Dice Rolling ==============

const OWLCLOUD_EXTENSION_ID = 'com.owlcloud.extension';

/**
 * Build a stat lookup map from the stored character data.
 * Supports: {STR}, {DEX}, {CON}, {INT}, {WIS}, {CHA}, {PROF},
 *           {STR_SAVE} etc., and full skill names like {PERCEPTION}.
 */
function buildStatLookup(char) {
  if (!char) return {};
  const mods = char.attributeMods || {};
  const saves = char.savingThrows || {};
  const skills = char.skills || {};
  const prof = char.proficiencyBonus || 2;

  // Abbreviation → full name map
  const abilityMap = {
    STR: 'strength', DEX: 'dexterity', CON: 'constitution',
    INT: 'intelligence', WIS: 'wisdom', CHA: 'charisma'
  };

  const lookup = { PROF: prof, PROFICIENCY: prof };

  // Ability mod abbreviations and full names
  for (const [abbr, full] of Object.entries(abilityMap)) {
    const val = mods[full] ?? 0;
    lookup[abbr] = val;
    lookup[full.toUpperCase()] = val;
  }

  // Saving throws: {STR_SAVE}, {STRENGTH_SAVE}
  for (const [abbr, full] of Object.entries(abilityMap)) {
    const val = saves[full] ?? mods[full] ?? 0;
    lookup[`${abbr}_SAVE`] = val;
    lookup[`${full.toUpperCase()}_SAVE`] = val;
  }

  // Skills (camelCase keys from owlcloud_parsed_data)
  for (const [key, val] of Object.entries(skills)) {
    if (typeof val === 'number') {
      lookup[key.toUpperCase()] = val;
    } else if (val && typeof val.modifier === 'number') {
      lookup[key.toUpperCase()] = val.modifier;
    }
  }

  return lookup;
}

/**
 * Substitute {VAR} tokens in a formula string.
 * Returns the substituted formula, or null if an unknown variable is used.
 */
function substituteVars(formula, lookup) {
  let resolved = formula;
  const unknowns = [];

  resolved = resolved.replace(/\{([^}]+)\}/g, (_, name) => {
    const key = name.trim().toUpperCase();
    if (key in lookup) {
      const val = lookup[key];
      // Render negative modifiers with parentheses so they parse cleanly
      return val < 0 ? `(${val})` : String(val);
    }
    unknowns.push(name);
    return `{${name}}`;
  });

  return { resolved, unknowns };
}

/**
 * Parse and roll a dice formula like "2d6 + 1d8 + 3 - 1"
 * @param {string} formula - Already-substituted dice formula string
 * @returns {{ result: number, breakdown: string }|null}
 */
function rollDiceFormula(formula) {
  // Strip outer parens wrapping negative numbers, normalize spaces
  const normalized = formula.replace(/\s+/g, '').replace(/\((-?\d+)\)/g, '$1').toLowerCase();

  const re = /([+-]?)(\d*d\d+|\d+)/gi;
  const tokens = [];
  let match;
  while ((match = re.exec(normalized)) !== null) {
    const sign = match[1] === '-' ? -1 : 1;
    tokens.push({ sign, part: match[2] });
  }

  if (tokens.length === 0) return null;

  let total = 0;
  const parts = [];

  for (const { sign, part } of tokens) {
    if (part.includes('d')) {
      const [countStr, sidesStr] = part.split('d');
      const count = parseInt(countStr) || 1;
      const sides = parseInt(sidesStr);
      if (isNaN(sides) || sides < 1 || count < 1 || count > 100) return null;

      const rolls = [];
      for (let i = 0; i < count; i++) rolls.push(Math.floor(Math.random() * sides) + 1);
      const subtotal = rolls.reduce((a, b) => a + b, 0) * sign;
      total += subtotal;

      const rollStr = rolls.length === 1 ? `[${rolls[0]}]` : `[${rolls.join('+')}]`;
      parts.push({ label: `${count}d${sides}`, rollStr, value: subtotal, sign });
    } else {
      const mod = parseInt(part) * sign;
      if (isNaN(mod)) return null;
      total += mod;
      parts.push({ label: String(Math.abs(mod)), rollStr: null, value: mod, sign });
    }
  }

  // Build breakdown: "2d6: [3+5] + 3 - 1d4: [2]"
  let breakdown = '';
  parts.forEach((p, i) => {
    const isFirst = i === 0;
    const neg = p.value < 0;
    const sep = isFirst ? '' : (neg ? ' - ' : ' + ');
    if (p.rollStr) {
      breakdown += `${sep}${p.label}: ${p.rollStr}`;
    } else {
      breakdown += `${sep}${p.label}`;
    }
  });

  return { result: total, breakdown };
}

// Pending !roll requests waiting on Dice+ result: rollId → { resolve, reject }
const chatPendingRolls = new Map();

/**
 * Set up listener for Dice+ roll results (called once after OBR is ready).
 */
function setupChatDicePlusListener() {
  OBR.broadcast.onMessage('dice-plus/roll-result', (event) => {
    const result = event.data?.result || event.data;
    if (!result || result.rollId === undefined) return;

    const pending = chatPendingRolls.get(result.rollId);
    if (!pending) return;

    chatPendingRolls.delete(result.rollId);
    pending.resolve({ totalValue: result.totalValue, rollSummary: result.rollSummary });
  });
}

/**
 * Send to Dice+ and wait for its result (up to 5s), then fall back to local roll.
 * Returns { totalValue, breakdown } where breakdown comes from Dice+ or local.
 */
async function rollViaDicePlus(diceNotation, localFallback) {
  return new Promise(async (resolveOuter) => {
    let settled = false;

    // Timeout: fall back to local result if Dice+ doesn't respond
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      chatPendingRolls.delete(rollId);
      resolveOuter(localFallback);
    }, 5000);

    const rollId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    chatPendingRolls.set(rollId, {
      resolve: (result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolveOuter({ totalValue: result.totalValue, breakdown: result.rollSummary || String(result.totalValue) });
      }
    });

    try {
      const playerId = await OBR.player.getId();
      const playerName = await OBR.player.getName();

      await OBR.broadcast.sendMessage('dice-plus/roll-request', {
        rollId,
        playerId,
        playerName,
        rollTarget: 'everyone',
        diceNotation,
        showResults: false,
        timestamp: Date.now(),
        source: OWLCLOUD_EXTENSION_ID
      }, { destination: 'ALL' });
    } catch (e) {
      // Dice+ not installed — fall back immediately
      console.warn('Dice+ not available:', e.message);
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        chatPendingRolls.delete(rollId);
        resolveOuter(localFallback);
      }
    }
  });
}

/**
 * Send a user message
 */
async function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  const characterName = currentCharacter?.name || 'You';

  // Handle !roll / !r command
  const rollMatch = text.match(/^!r(?:oll)?\s+(.+)/i);
  if (rollMatch) {
    chatInput.value = '';
    const rawFormula = rollMatch[1].trim();

    // Substitute {VAR} tokens with character stats
    const lookup = buildStatLookup(currentCharacter);
    const { resolved, unknowns } = substituteVars(rawFormula, lookup);

    if (unknowns.length > 0) {
      displayChatMessage(`❌ Unknown variable(s): ${unknowns.map(u => `{${u}}`).join(', ')}`, 'system');
      return;
    }

    const local = rollDiceFormula(resolved);
    if (!local) {
      displayChatMessage(`❌ Invalid dice formula: <em>${rawFormula}</em>`, 'system');
      return;
    }

    const displayFormula = rawFormula !== resolved ? `${rawFormula} → ${resolved}` : rawFormula;

    // Roll via Dice+ (waits for 3D result), falls back to local if unavailable
    const { totalValue, breakdown } = await rollViaDicePlus(resolved, {
      totalValue: local.result,
      breakdown: local.breakdown
    });

    const msg = `🎲 <strong>${displayFormula}</strong>: ${breakdown} = <strong>${totalValue}</strong>`;
    await addChatMessageToMetadata(msg, 'roll', characterName);
    return;
  }

  // Add regular user message to shared chat
  await addChatMessageToMetadata(text, 'user', characterName);
  chatInput.value = '';
}

// ============== Event Listeners ==============

chatSendBtn.addEventListener('click', sendChatMessage);

chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendChatMessage();
  }
});

chatCloseBtn.addEventListener('click', async () => {
  if (isOwlbearReady) {
    try {
      await OBR.popover.close('com.owlcloud.chat');
    } catch (error) {
      console.error('Error closing chat:', error);
    }
  }
});

// ============== Expose Chat Functions ==============

// Expose chat functions for other windows to call
window.owlcloudChat = {
  addMessage: addChatMessageToMetadata,
  announceRoll: async (rollName, formula, result) => {
    const characterName = currentCharacter?.name || 'Character';
    const text = `🎲 ${rollName}: ${formula} = <strong>${result}</strong>`;
    await addChatMessageToMetadata(text, 'roll', characterName);
  },
  announceAction: async (actionName, details = '') => {
    const characterName = currentCharacter?.name || 'Character';
    const text = details ? `⚔️ ${actionName} - ${details}` : `⚔️ ${actionName}`;
    await addChatMessageToMetadata(text, 'action', characterName);
  },
  announceSpell: async (spellName, level, details = '') => {
    const characterName = currentCharacter?.name || 'Character';
    const levelText = level === 0 ? 'Cantrip' : `Level ${level}`;
    const text = details ? `✨ ${spellName} (${levelText}) - ${details}` : `✨ ${spellName} (${levelText})`;
    await addChatMessageToMetadata(text, 'spell', characterName);
  },
  announceCombat: async (text) => {
    const characterName = currentCharacter?.name || 'Character';
    await addChatMessageToMetadata(text, 'combat', characterName);
  }
};

// ============== Roll Mode Indicator ==============

/**
 * Update the roll mode indicator badge
 */
function updateRollModeIndicator(mode) {
  const indicator = document.getElementById('roll-mode-indicator');
  if (!indicator) return;

  // Remove all mode classes
  indicator.classList.remove('advantage', 'disadvantage');

  // Set appropriate class and text
  if (mode === 'advantage') {
    indicator.classList.add('advantage');
    indicator.textContent = 'ADV';
  } else if (mode === 'disadvantage') {
    indicator.classList.add('disadvantage');
    indicator.textContent = 'DIS';
  } else {
    // Normal mode - hide indicator
    indicator.textContent = '';
  }
}

console.log('💬 Chat window initialized');
