(() => {
  // src/background.js
  var browserAPI = typeof browser !== "undefined" && browser.runtime ? browser : chrome;
  console.log("CarmaClouds background service worker initialized");
  var SUPABASE_URL = "https://luiesmfjdcmpywavvfqm.supabase.co";
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWVzbWZqZGNtcHl3YXZ2ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODYxNDksImV4cCI6MjA4NTQ2MjE0OX0.oqjHFf2HhCLcanh0HVryoQH7iSV7E9dHHZJdYehxZ0U";
  var keepAliveInterval;
  function keepAlive() {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
    }
    keepAliveInterval = setInterval(() => {
      if (browserAPI.runtime?.id) {
        console.log("\u{1F504} Keep-alive ping");
      } else {
        clearInterval(keepAliveInterval);
      }
    }, 2e4);
  }
  keepAlive();
  browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
    keepAlive();
    console.log("\u{1F514} Background received message:", message.type || message.action);
    if (message.action === "getCharacterData") {
      console.log("\u{1F4CB} Getting character data for Roll20...");
      handleGetCharacterData(message.characterId).then((result) => {
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
      handleGetAllCharacterProfiles(message.supabaseUserId).then((result) => {
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
      browserAPI.runtime.sendMessage({
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
    if (message.action === "clearAllCloudData") {
      console.log("\u{1F5D1}\uFE0F Clearing all cloud character data...");
      handleClearAllCloudData().then((result) => {
        console.log("\u2705 Cloud data cleared successfully");
        sendResponse(result);
      }).catch((error) => {
        console.error("\u274C Failed to clear cloud data:", error);
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
  async function handleGetCharacterData(requestedCharacterId) {
    try {
      const result = await browserAPI.storage.local.get(["carmaclouds_characters", "activeCharacterId"]);
      const characters = result.carmaclouds_characters || [];
      const activeCharacterId = requestedCharacterId || result.activeCharacterId;
      let activeCharacter = null;
      if (activeCharacterId) {
        if (activeCharacterId.startsWith("slot-")) {
          const slotIndex = parseInt(activeCharacterId.replace("slot-", "")) - 1;
          if (slotIndex >= 0 && slotIndex < characters.length) {
            activeCharacter = characters[slotIndex];
          }
        } else {
          activeCharacter = characters.find((char) => char.id === activeCharacterId);
        }
      }
      if (!activeCharacter && characters.length > 0) {
        activeCharacter = characters[0];
      }
      if (activeCharacter) {
        let characterData = activeCharacter.rollcloud || activeCharacter;
        if (activeCharacter.rollcloud && !characterData.id) {
          characterData = {
            ...characterData,
            id: activeCharacter.id
          };
        }
        console.log("\u{1F4E4} Returning character data:", activeCharacter.name);
        console.log("   Using rollcloud format:", !!activeCharacter.rollcloud);
        console.log("   Character data keys:", Object.keys(characterData).slice(0, 25));
        console.log("   Has hitPoints:", !!characterData.hitPoints, "=", characterData.hitPoints);
        console.log("   Has name:", !!characterData.name, "=", characterData.name);
        console.log("   Has id:", !!characterData.id, "=", characterData.id);
        console.log("   Has spells:", Array.isArray(characterData.spells), characterData.spells?.length);
        console.log("   Has actions:", Array.isArray(characterData.actions), characterData.actions?.length);
        return {
          success: true,
          data: characterData
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
      const result = await browserAPI.storage.local.get("carmaclouds_characters");
      const characters = result.carmaclouds_characters || [];
      const characterId = characterData.id || characterData.dicecloud_character_id || slotId;
      if (!characterId) {
        throw new Error("Character data missing ID and no slotId provided");
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
          id: characterId,
          // Ensure ID is always set
          raw: existingCharacter.raw || characterData.raw,
          // Keep raw if it exists
          preview: existingCharacter.preview || characterData.preview
          // Keep preview if it exists
        };
        console.log("   Preserved raw data:", !!characters[existingIndex].raw);
      } else {
        console.log("\u2705 Adding new character:", characterData.name);
        characters.push({
          ...characterData,
          id: characterId
          // Ensure ID is always set
        });
      }
      await browserAPI.storage.local.set({ carmaclouds_characters: characters });
      console.log("\u2705 Character data stored successfully to carmaclouds_characters");
      console.log("   Total characters in array:", characters.length);
      return { success: true };
    } catch (error) {
      console.error("\u274C Error storing character data:", error);
      return { success: false, error: error.message };
    }
  }
  async function handleGetAllCharacterProfiles(supabaseUserId) {
    try {
      const result = await browserAPI.storage.local.get("carmaclouds_characters");
      let characters = result.carmaclouds_characters || [];
      console.log("\u{1F50D} getAllCharacterProfiles - Total characters in storage:", characters.length);
      if (supabaseUserId) {
        console.log("\u{1F50D} Fetching characters from Supabase for user:", supabaseUserId);
        try {
          const dbResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/clouds_characters?select=*&supabase_user_id=eq.${supabaseUserId}`,
            {
              headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Content-Type": "application/json"
              }
            }
          );
          if (dbResponse.ok) {
            const dbCharacters = await dbResponse.json();
            console.log("   Found", dbCharacters.length, "characters from Supabase");
            dbCharacters.forEach((dbChar) => {
              const existingIndex = characters.findIndex((c) => c.id === dbChar.dicecloud_character_id);
              let rawData = dbChar.raw_dicecloud_data || {};
              if (typeof rawData === "string") {
                try {
                  rawData = JSON.parse(rawData);
                } catch (e) {
                  console.warn("   Failed to parse raw_dicecloud_data for:", dbChar.character_name);
                  rawData = {};
                }
              }
              const characterEntry = {
                id: dbChar.dicecloud_character_id,
                name: dbChar.character_name || "Unknown",
                level: dbChar.level || "?",
                class: dbChar.class || "No Class",
                race: dbChar.race || "Unknown",
                raw: rawData,
                lastSynced: dbChar.updated_at || (/* @__PURE__ */ new Date()).toISOString(),
                rollcloud: null,
                // Parsed on-demand when RollCloud tab is used
                owlcloud: null,
                // Parsed on-demand when OwlCloud tab is used
                foundcloud: null
                // Parsed on-demand when FoundCloud tab is used
              };
              if (existingIndex >= 0) {
                characters[existingIndex] = characterEntry;
              } else {
                characters.push(characterEntry);
              }
            });
            console.log("   Merged: now have", characters.length, "total characters");
            await browserAPI.storage.local.set({ carmaclouds_characters: characters });
            console.log("   \u2705 Saved merged characters to local storage");
          }
        } catch (dbError) {
          console.error("   \u274C Error fetching from Supabase:", dbError);
        }
      }
      characters.forEach((char, index) => {
        console.log(`   Character ${index}:`, {
          id: char.id,
          name: char.name,
          class: char.class,
          level: char.level,
          race: char.race,
          hasRaw: !!char.raw
        });
      });
      const profiles = {};
      characters.forEach((char, index) => {
        if (char.id) {
          const profileKey = `slot-${index + 1}`;
          profiles[profileKey] = {
            id: char.id,
            name: char.name || "Unknown",
            character_name: char.name || "Unknown",
            class: char.class || "Unknown",
            level: char.level || 1,
            race: char.race || "Unknown",
            raw: char.raw
            // Include raw data for parsing
          };
          console.log(`   \u2705 Created ${profileKey}:`, profiles[profileKey].name);
        } else {
          console.log(`   \u26A0\uFE0F Skipped character at index ${index} - no ID`);
        }
      });
      console.log("\u{1F4CB} Returning profiles:", Object.keys(profiles));
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
      const result = await browserAPI.storage.local.get("carmaclouds_characters");
      const characters = result.carmaclouds_characters || [];
      const character = characters.find((char) => char.id === characterId);
      if (!character) {
        return {
          success: false,
          error: "Character not found"
        };
      }
      await browserAPI.storage.local.set({ activeCharacterId: characterId });
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
      const tabs = await browserAPI.tabs.query({ url: "*://app.roll20.net/*" });
      if (tabs.length === 0) {
        return {
          success: false,
          error: "No Roll20 tab found. Please open Roll20 first."
        };
      }
      const response = await browserAPI.tabs.sendMessage(tabs[0].id, {
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
      await browserAPI.storage.local.set({
        [storageKey]: {
          ...characterData,
          syncedAt: (/* @__PURE__ */ new Date()).toISOString(),
          platforms: ["dicecloud"]
          // Mark as available from DiceCloud
        }
      });
      console.log("\u2705 Step 2: Individual character saved");
      console.log("\u{1F4BE} Step 3: Getting characters list...");
      const result = await browserAPI.storage.local.get("carmaclouds_characters");
      const characters = result.carmaclouds_characters || [];
      console.log("\u2705 Step 3: Found", characters.length, "existing characters");
      console.log("\u{1F4BE} Step 4: Updating characters list...");
      const existingIndex = characters.findIndex((c) => c.id === characterData.id);
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
      await browserAPI.storage.local.set({ carmaclouds_characters: characters });
      console.log("\u2705 Step 5: Characters list saved");
      if (characterData.id) {
        console.log("\u{1F4BE} Step 6: Setting as active character:", characterData.id);
        await browserAPI.storage.local.set({ activeCharacterId: characterData.id });
        console.log("\u2705 Step 6: Active character ID set");
      }
      console.log("\u{1F389} Character successfully synced to CarmaClouds storage");
      try {
        console.log("\u{1F4BE} Step 7: Syncing to Supabase database...");
        const authResult = await browserAPI.storage.local.get(["diceCloudUserId", "username"]);
        const payload = {
          user_id_dicecloud: authResult.diceCloudUserId || null,
          dicecloud_character_id: characterData.id,
          character_name: characterData.name || "Unknown",
          raw_dicecloud_data: characterData,
          // Store the full character object with raw DiceCloud data
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        console.log("\u{1F4E4} Sending character to Supabase:", payload.character_name);
        const checkResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/clouds_characters?dicecloud_character_id=eq.${characterData.id}`,
          {
            method: "GET",
            headers: {
              "apikey": SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
            }
          }
        );
        let response;
        if (checkResponse.ok) {
          const existing = await checkResponse.json();
          if (existing && existing.length > 0) {
            console.log("\u{1F4DD} Updating existing character in Supabase...");
            response = await fetch(
              `${SUPABASE_URL}/rest/v1/clouds_characters?dicecloud_character_id=eq.${characterData.id}`,
              {
                method: "PATCH",
                headers: {
                  "apikey": SUPABASE_ANON_KEY,
                  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                  "Content-Type": "application/json",
                  "Prefer": "return=representation"
                },
                body: JSON.stringify(payload)
              }
            );
          } else {
            console.log("\u2795 Inserting new character to Supabase...");
            response = await fetch(
              `${SUPABASE_URL}/rest/v1/clouds_characters`,
              {
                method: "POST",
                headers: {
                  "apikey": SUPABASE_ANON_KEY,
                  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                  "Content-Type": "application/json",
                  "Prefer": "return=representation"
                },
                body: JSON.stringify(payload)
              }
            );
          }
          if (response.ok) {
            const result2 = await response.json();
            console.log("\u2705 Step 7: Character synced to Supabase:", result2);
          } else {
            const errorText = await response.text();
            console.error("\u274C Supabase sync failed:", response.status, errorText);
          }
        } else {
          console.error("\u274C Failed to check if character exists:", checkResponse.status);
        }
      } catch (supabaseError) {
        console.error("\u274C Failed to sync to Supabase (non-fatal):", supabaseError);
      }
      try {
        const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
        if (tabs.length > 0) {
          await browserAPI.tabs.sendMessage(tabs[0].id, {
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
  async function handleClearAllCloudData() {
    try {
      const result = await browserAPI.storage.local.get(["diceCloudUserId"]);
      const userId = result.diceCloudUserId;
      if (!userId) {
        throw new Error("No DiceCloud user ID found. Please log in first.");
      }
      console.log("\u{1F5D1}\uFE0F Deleting all characters for user:", userId);
      const response = await fetch(`${SUPABASE_URL}/rest/v1/clouds_characters?user_id_dicecloud=eq.${userId}`, {
        method: "DELETE",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete cloud data: ${response.status} - ${errorText}`);
      }
      const deletedChars = await response.json();
      const count = Array.isArray(deletedChars) ? deletedChars.length : 0;
      console.log(`\u2705 Deleted ${count} characters from cloud`);
      return {
        success: true,
        message: `Deleted ${count} character(s) from cloud storage.`
      };
    } catch (error) {
      console.error("\u274C Error clearing cloud data:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      handleGetCharacterData,
      handleStoreCharacterData,
      handleClearAllCloudData
    };
  }
  browserAPI.runtime.onInstalled.addListener((details) => {
    console.log("CarmaClouds extension installed/updated:", details.reason);
    if (details.reason === "install") {
      console.log("CarmaClouds: First time installation");
    } else if (details.reason === "update") {
      console.log("CarmaClouds: Extension updated");
    }
  });
})();
//# sourceMappingURL=background.js.map
