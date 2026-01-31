/**
 * Browser Extension Bundle
 * Imports all modules needed by browser extensions
 */

// Common utilities
import './common/debug.js';
import './common/browser-polyfill.js';
import './common/html-utils.js';
import './common/theme-manager.js';

// Supabase client
import './supabase/client.js';
import './supabase/config.js';

// Libraries
import './lib/indexeddb-cache.js';

// Edge case modules
import './modules/spell-edge-cases.js';
import './modules/class-feature-edge-cases.js';
import './modules/racial-feature-edge-cases.js';
import './modules/combat-maneuver-edge-cases.js';

// Action system
import './modules/action-executor.js';
import './modules/action-announcements.js';
import './modules/action-display.js';
import './modules/action-filters.js';
import './modules/action-options.js';

// Other modules
import './modules/card-creator.js';
import './modules/character-trait-popups.js';
import './modules/character-traits.js';
import './modules/color-utils.js';
import './modules/companions-manager.js';
import './modules/concentration-tracker.js';
import './modules/data-manager.js';
import './modules/dice-roller.js';
