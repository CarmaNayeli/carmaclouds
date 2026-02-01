/**
 * Browser Extension Core Bundle
 * Only includes modules needed by background script/service worker
 */

// Common utilities
import './common/debug.js';
import './common/browser-polyfill.js';

// Supabase client and config (make config globally available)
import { SUPABASE_URL, SUPABASE_ANON_KEY, TABLES, PROJECT_CONFIGS, getProjectConfig } from './supabase/config.js';
import './supabase/client.js';

// Export Supabase config globally for legacy code
// TODO: Fix race condition - code sometimes checks for Supabase config before this executes,
// causing brief "Supabase not configured" flash before it connects successfully
const globalScope = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {});
if (globalScope) {
  globalScope.SUPABASE_URL = SUPABASE_URL;
  globalScope.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
  globalScope.SUPABASE_TABLES = TABLES;
  globalScope.SUPABASE_PROJECT_CONFIGS = PROJECT_CONFIGS;
  globalScope.getProjectConfig = getProjectConfig;
}

// Libraries
import './lib/indexeddb-cache.js';

// Edge case modules (needed for character processing)
import './modules/spell-edge-cases.js';
import './modules/class-feature-edge-cases.js';
import './modules/racial-feature-edge-cases.js';
import './modules/combat-maneuver-edge-cases.js';

// Core modules needed for background script
import './modules/action-executor.js';
import './modules/action-announcements.js';
import './modules/card-creator.js';
import './modules/color-utils.js';
import './modules/companions-manager.js';
import './modules/concentration-tracker.js';
import './modules/data-manager.js';
import './modules/dice-roller.js';

// Note: Action display, filters, and options are NOT included here
// They should only be imported in popup/content scripts where window is available
