/**
 * Initialize Supabase client for browser extension
 * This must be a separate external file due to CSP restrictions on inline scripts
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

window.createSupabaseClient = createClient;
console.log('✅ Supabase createClient loaded');
