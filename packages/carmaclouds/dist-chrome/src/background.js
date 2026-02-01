// Initialize debug globally
if (typeof window !== "undefined" && !window.debug) { window.debug = { log: console.log, warn: console.warn, error: console.error, info: console.info, group: console.group, groupEnd: console.groupEnd, table: console.table, time: console.time, timeEnd: console.timeEnd, isEnabled: () => true }; }
const debug = window.debug;
// Supabase config will be set by browser.js
const SUPABASE_URL = typeof window !== "undefined" ? window.SUPABASE_URL : undefined;
const SUPABASE_ANON_KEY = typeof window !== "undefined" ? window.SUPABASE_ANON_KEY : undefined;
// SupabaseTokenManager will be set by browser.js
const SupabaseTokenManager = typeof window !== "undefined" ? window.SupabaseTokenManager : undefined;
(() => {
  // src/background.js
  console.log("CarmaClouds background service worker initialized");
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Background received message:", message);
    switch (message.type) {
      case "CHARACTER_UPDATED":
        handleCharacterUpdate(message.data);
        break;
      case "SYNC_REQUEST":
        handleSyncRequest(message.data);
        break;
      default:
        console.warn("Unknown message type:", message.type);
    }
    return true;
  });
  async function handleCharacterUpdate(data) {
    console.log("Character updated:", data);
  }
  async function handleSyncRequest(data) {
    console.log("Sync requested:", data);
  }
})();
//# sourceMappingURL=background.js.map
