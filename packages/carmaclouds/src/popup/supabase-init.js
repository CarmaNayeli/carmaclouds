/**
 * Initialize Supabase client for browser extension
 * This must be a separate external file due to CSP restrictions on inline scripts
 */
import { createClient } from '@supabase/supabase-js';

window.createSupabaseClient = createClient;
console.log('✅ Supabase createClient loaded');
