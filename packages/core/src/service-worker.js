/**
 * Service Worker Bundle
 * Imports only modules needed by service workers (no DOM dependencies)
 */

// Common utilities
import './common/debug.js';

// Supabase client and config
import { SUPABASE_URL, SUPABASE_ANON_KEY, TABLES, PROJECT_CONFIGS, getProjectConfig } from './supabase/config.js';
import './supabase/client.js';

// Export Supabase config globally for service worker context
const globalScope = typeof self !== 'undefined' ? self : {};
globalScope.SUPABASE_URL = SUPABASE_URL;
globalScope.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
globalScope.SUPABASE_TABLES = TABLES;
globalScope.SUPABASE_PROJECT_CONFIGS = PROJECT_CONFIGS;
globalScope.getProjectConfig = getProjectConfig;
