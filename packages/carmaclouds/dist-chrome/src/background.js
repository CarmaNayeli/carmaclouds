(() => {
  // src/background.js
  console.log("CarmaClouds background service worker initialized");
  var SUPABASE_URL = "https://luiesmfjdcmpywavvfqm.supabase.co";
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWVzbWZqZGNtcHl3YXZ2ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODYxNDksImV4cCI6MjA4NTQ2MjE0OX0.oqjHFf2HhCLcanh0HVryoQH7iSV7E9dHHZJdYehxZ0U";
  var keepAliveInterval;
  function keepAlive() {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
    }
    keepAliveInterval = setInterval(() => {
      if (chrome.runtime?.id) {
        console.log("\u{1F504} Keep-alive ping");
      } else {
        clearInterval(keepAliveInterval);
      }
    }, 2e4);
  }
  keepAlive();
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    keepAlive();
    console.log("\u{1F514} Background received message:", message.type || message.action);
    if (message.action === "getCharacterData") {
      console.log("\u{1F4CB} Getting character data for Roll20...");
      handleGetCharacterData().then((result) => {
        console.log("\u2705 Character data retrieved:", result);
        sendResponse(result);
      }).catch((error) => {
        console.error("\u274C Failed to get character data:", error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }
    if (message.action === "getAllCharacterProfiles") {
      console.log("\u{1F4CB} Getting all character profiles...");
      handleGetAllCharacterProfiles().then((result) => {
        console.log("\u2705 Character profiles retrieved:", result);
        sendResponse(result);
      }).catch((error) => {
        console.error("\u274C Failed to get character profiles:", error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }
    if (message.action === "setActiveCharacter") {
      console.log("\u{1F4CB} Setting active character:", message.characterId);
      handleSetActiveCharacter(message.characterId).then((result) => {
        console.log("\u2705 Active character set:", result);
        sendResponse(result);
      }).catch((error) => {
        console.error("\u274C Failed to set active character:", error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }
    if (message.action === "requestPreparedData") {
      console.log("\u{1F4E4} Character sheet requesting prepared data");
      handleRequestPreparedData().then((result) => {
        console.log("\u2705 Prepared data request completed:", result.success ? "success" : "failed");
        sendResponse(result);
      }).catch((error) => {
        console.error("\u274C Failed to handle prepared data request:", error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }
    if (message.action === "notifyPopupUpdate") {
      console.log("\u{1F514} Notifying popup sheets of character data update");
      chrome.runtime.sendMessage({
        type: "UPDATE_CHARACTER_DATA",
        data: message.data
      }).catch(() => {
        console.log("\u2139\uFE0F No popup open to notify");
      });
      sendResponse({ success: true });
      return false;
    }
    if (message.action === "storeCharacterData") {
      console.log("\u{1F4BE} Storing character data to local storage:", message.data?.name);
      handleStoreCharacterData(message.data, message.slotId).then((result) => {
        console.log("\u2705 Character data stored successfully");
        sendResponse(result);
      }).catch((error) => {
        console.error("\u274C Failed to store character data:", error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }
    switch (message.type) {
      case "CHARACTER_UPDATED":
        handleCharacterUpdate(message.data);
        return false;
      case "SYNC_REQUEST":
        handleSyncRequest(message.data);
        return false;
      case "SYNC_CHARACTER_TO_CARMACLOUDS":
        console.log("\u{1F504} Starting SYNC_CHARACTER_TO_CARMACLOUDS handler...");
        handleSyncToCarmaClouds(message.data).then((result) => {
          console.log("\u2705 Sync completed, sending response:", result);
          sendResponse(result);
        }).catch((error) => {
          console.error("\u274C Sync failed:", error);
          sendResponse({ success: false, error: error.message });
        });
        return true;
      default:
        console.warn("Unknown message type:", message.type);
        return false;
    }
  });
  async function handleGetCharacterData() {
    try {
      const result = await chrome.storage.local.get(["carmaclouds_characters", "activeCharacterId"]);
      const characters = result.carmaclouds_characters || [];
      const activeCharacterId = result.activeCharacterId;
      let activeCharacter = null;
      if (activeCharacterId) {
        activeCharacter = characters.find((char) => char.id === activeCharacterId);
      }
      if (!activeCharacter && characters.length > 0) {
        activeCharacter = characters[0];
      }
      if (activeCharacter) {
        console.log("\u{1F4E4} Returning character data:", activeCharacter.name);
        console.log("   Has hitPoints:", !!activeCharacter.hitPoints);
        console.log("   Has raw:", !!activeCharacter.raw);
        return {
          success: true,
          data: activeCharacter
        };
      } else {
        console.log("\u274C No character data found in storage");
        console.log("   Characters array length:", characters.length);
        console.log("   Active character ID:", activeCharacterId);
        return {
          success: false,
          error: "No character data found"
        };
      }
    } catch (error) {
      console.error("Error getting character data:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async function handleStoreCharacterData(characterData, slotId) {
    try {
      console.log("\u{1F4BE} Storing character to slot:", slotId || "default");
      const result = await chrome.storage.local.get("carmaclouds_characters");
      const characters = result.carmaclouds_characters || [];
      const characterId = characterData.id || characterData.dicecloud_character_id;
      if (!characterId) {
        throw new Error("Character data missing ID");
      }
      const existingIndex = characters.findIndex((char) => char.id === characterId);
      if (existingIndex >= 0) {
        console.log("\u2705 Updating existing character:", characterData.name);
        console.log("   Has hitPoints:", !!characterData.hitPoints);
        console.log("   Has spells:", Array.isArray(characterData.spells));
        console.log("   Has actions:", Array.isArray(characterData.actions));
        const existingCharacter = characters[existingIndex];
        characters[existingIndex] = {
          ...characterData,
          raw: existingCharacter.raw || characterData.raw,
          // Keep raw if it exists
          preview: existingCharacter.preview || characterData.preview
          // Keep preview if it exists
        };
        console.log("   Preserved raw data:", !!characters[existingIndex].raw);
      } else {
        console.log("\u2705 Adding new character:", characterData.name);
        characters.push(characterData);
      }
      await chrome.storage.local.set({ carmaclouds_characters: characters });
      console.log("\u2705 Character data stored successfully to carmaclouds_characters");
      console.log("   Total characters in array:", characters.length);
      return { success: true };
    } catch (error) {
      console.error("\u274C Error storing character data:", error);
      return { success: false, error: error.message };
    }
  }
  async function handleGetAllCharacterProfiles() {
    try {
      const result = await chrome.storage.local.get("carmaclouds_characters");
      const characters = result.carmaclouds_characters || [];
      const profiles = {};
      characters.forEach((char) => {
        if (char.id && char.raw) {
          profiles[char.id] = {
            id: char.id,
            name: char.name || char.raw.name || "Unknown",
            character_name: char.name || char.raw.name || "Unknown",
            class: extractClass(char.raw),
            level: extractLevel(char.raw),
            race: extractRace(char.raw),
            ...char.raw
            // Include all raw data for compatibility
          };
        }
      });
      return {
        success: true,
        profiles
      };
    } catch (error) {
      console.error("Error getting character profiles:", error);
      return {
        success: false,
        error: error.message,
        profiles: {}
      };
    }
  }
  async function handleSetActiveCharacter(characterId) {
    try {
      const result = await chrome.storage.local.get("carmaclouds_characters");
      const characters = result.carmaclouds_characters || [];
      const character = characters.find((char) => char.id === characterId);
      if (!character) {
        return {
          success: false,
          error: "Character not found"
        };
      }
      await chrome.storage.local.set({ activeCharacterId: characterId });
      return {
        success: true,
        characterId
      };
    } catch (error) {
      console.error("Error setting active character:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async function handleRequestPreparedData() {
    try {
      const tabs = await chrome.tabs.query({ url: "*://app.roll20.net/*" });
      if (tabs.length === 0) {
        return {
          success: false,
          error: "No Roll20 tab found. Please open Roll20 first."
        };
      }
      const response = await chrome.tabs.sendMessage(tabs[0].id, {
        type: "REQUEST_PREPARED_DATA"
      });
      if (response && response.success) {
        return {
          success: true,
          data: response.data,
          timestamp: response.timestamp,
          age: response.age
        };
      } else {
        return {
          success: false,
          error: response?.error || 'No prepared character data available. Please use "Push to Roll20" first.'
        };
      }
    } catch (error) {
      console.error("Error requesting prepared data:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  function extractClass(rawData) {
    if (!rawData || !rawData.variables || !Array.isArray(rawData.variables))
      return "Unknown";
    for (const variable of rawData.variables) {
      if (variable.variableName === "class") {
        return variable.value || "Unknown";
      }
    }
    return "Unknown";
  }
  function extractLevel(rawData) {
    if (!rawData || !rawData.variables || !Array.isArray(rawData.variables))
      return 1;
    for (const variable of rawData.variables) {
      if (variable.variableName === "level") {
        return variable.value || 1;
      }
    }
    return 1;
  }
  function extractRace(rawData) {
    if (!rawData || !rawData.variables || !Array.isArray(rawData.variables))
      return "Unknown";
    for (const variable of rawData.variables) {
      if (variable.variableName === "race") {
        return variable.value || "Unknown";
      }
    }
    return "Unknown";
  }
  async function handleCharacterUpdate(data) {
    console.log("Character updated:", data);
  }
  async function handleSyncRequest(data) {
    console.log("Sync requested:", data);
  }
  async function handleSyncToCarmaClouds(characterData) {
    try {
      console.log("\u{1F4BE} Step 1: Starting sync for character:", characterData.name);
      const storageKey = `carmaclouds_character_${characterData.name || "unknown"}`;
      console.log("\u{1F4BE} Step 2: Saving individual character with key:", storageKey);
      await chrome.storage.local.set({
        [storageKey]: {
          ...characterData,
          syncedAt: (/* @__PURE__ */ new Date()).toISOString(),
          platforms: ["dicecloud"]
          // Mark as available from DiceCloud
        }
      });
      console.log("\u2705 Step 2: Individual character saved");
      console.log("\u{1F4BE} Step 3: Getting characters list...");
      const result = await chrome.storage.local.get("carmaclouds_characters");
      const characters = result.carmaclouds_characters || [];
      console.log("\u2705 Step 3: Found", characters.length, "existing characters");
      console.log("\u{1F4BE} Step 4: Updating characters list...");
      const existingIndex = characters.findIndex((c) => c.name === characterData.name);
      if (existingIndex >= 0) {
        console.log("\u{1F4DD} Updating existing character at index", existingIndex);
        characters[existingIndex] = {
          ...characters[existingIndex],
          ...characterData,
          syncedAt: (/* @__PURE__ */ new Date()).toISOString(),
          platforms: [...characters[existingIndex].platforms || [], "dicecloud"]
        };
      } else {
        console.log("\u2795 Adding new character to list");
        characters.push({
          ...characterData,
          syncedAt: (/* @__PURE__ */ new Date()).toISOString(),
          platforms: ["dicecloud"]
        });
      }
      console.log("\u{1F4BE} Step 5: Saving updated characters list...");
      await chrome.storage.local.set({ carmaclouds_characters: characters });
      console.log("\u2705 Step 5: Characters list saved");
      const storageCheck = await chrome.storage.local.get("activeCharacterId");
      if (!storageCheck.activeCharacterId && characterData.id) {
        console.log("\u{1F4BE} Step 6: Setting as active character:", characterData.id);
        await chrome.storage.local.set({ activeCharacterId: characterData.id });
        console.log("\u2705 Step 6: Active character ID set");
      }
      console.log("\u{1F389} Character successfully synced to CarmaClouds storage");
      try {
        console.log("\u{1F4BE} Step 7: Syncing to Supabase database...");
        const authResult = await chrome.storage.local.get(["diceCloudUserId", "username"]);
        const payload = {
          user_id_dicecloud: authResult.diceCloudUserId || null,
          dicecloud_character_id: characterData.id,
          character_name: characterData.name || "Unknown",
          raw_dicecloud_data: characterData,
          // Store the full character object with raw DiceCloud data
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        console.log("\u{1F4E4} Sending character to Supabase:", payload.character_name);
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/clouds_characters?dicecloud_character_id=eq.${characterData.id}`,
          {
            method: "POST",
            headers: {
              "apikey": SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
              "Prefer": "resolution=merge-duplicates,return=representation"
            },
            body: JSON.stringify(payload)
          }
        );
        if (response.ok) {
          const result2 = await response.json();
          console.log("\u2705 Step 7: Character synced to Supabase:", result2);
        } else {
          const errorText = await response.text();
          console.error("\u274C Supabase sync failed:", response.status, errorText);
        }
      } catch (supabaseError) {
        console.error("\u274C Failed to sync to Supabase (non-fatal):", supabaseError);
      }
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length > 0) {
          await chrome.tabs.sendMessage(tabs[0].id, {
            action: "dataSynced",
            characterName: characterData.name
          });
          console.log("\u{1F4E4} Sent dataSynced message to popup");
        }
      } catch (tabError) {
        console.log("\u26A0\uFE0F Could not send sync notification to popup:", tabError);
      }
      return {
        success: true,
        message: "Character synced successfully",
        characterCount: characters.length
      };
    } catch (error) {
      console.error("\u274C Error syncing character to CarmaClouds:", error);
      return {
        success: false,
        error: error.message
      };
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
