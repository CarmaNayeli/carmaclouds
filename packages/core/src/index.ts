/**
 * @carmaclouds/core
 * Shared utilities and types for CarmaClouds packages
 *
 * Note: This package contains both TypeScript and JavaScript modules.
 * The TypeScript modules are exported below. The JavaScript modules
 * (common/, lib/, modules/) are available in the package but not
 * exported from the main entry point as they're primarily used by
 * browser extensions via importScripts.
 */

// Types
export * from './types/character';

// Cache Manager
export * from './cache/CacheManager';
export { CacheManager } from './cache/CacheManager';

// Supabase Field Definitions
export * from './supabase/fields';
export { FIELD_SETS } from './supabase/fields';
