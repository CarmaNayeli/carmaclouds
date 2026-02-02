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
      case "SYNC_CHARACTER_TO_CARMACLOUDS":
        handleSyncToCarmaClouds(message.data, sendResponse);
        return true;
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
  async function handleSyncToCarmaClouds(characterData, sendResponse) {
    try {
      console.log("Syncing character to CarmaClouds:", characterData);
      const storageKey = `carmaclouds_character_${characterData.name || "unknown"}`;
      await chrome.storage.local.set({
        [storageKey]: {
          ...characterData,
          syncedAt: (/* @__PURE__ */ new Date()).toISOString(),
          platforms: ["dicecloud"]
          // Mark as available from DiceCloud
        }
      });
      const result = await chrome.storage.local.get("carmaclouds_characters");
      const characters = result.carmaclouds_characters || [];
      const existingIndex = characters.findIndex((c) => c.name === characterData.name);
      if (existingIndex >= 0) {
        characters[existingIndex] = {
          ...characters[existingIndex],
          ...characterData,
          syncedAt: (/* @__PURE__ */ new Date()).toISOString(),
          platforms: [...characters[existingIndex].platforms || [], "dicecloud"]
        };
      } else {
        characters.push({
          ...characterData,
          syncedAt: (/* @__PURE__ */ new Date()).toISOString(),
          platforms: ["dicecloud"]
        });
      }
      await chrome.storage.local.set({ carmaclouds_characters: characters });
      console.log("Character successfully synced to CarmaClouds storage");
      sendResponse({
        success: true,
        message: "Character synced successfully",
        characterCount: characters.length
      });
    } catch (error) {
      console.error("Error syncing character to CarmaClouds:", error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }
  chrome.runtime.onInstalled.addListener((details) => {
    console.log("CarmaClouds extension installed/updated:", details.reason);
    if (details.reason === "install") {
      console.log("CarmaClouds: First time installation");
    } else if (details.reason === "update") {
      console.log("CarmaClouds: Extension updated");
    }
  });
})();
//# sourceMappingURL=background.js.map
