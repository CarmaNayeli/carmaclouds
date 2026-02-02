(() => {
  // ../core/src/supabase/config.js
  var SUPABASE_URL = "https://luiesmfjdcmpywavvfqm.supabase.co";
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWVzbWZqZGNtcHl3YXZ2ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODYxNDksImV4cCI6MjA4NTQ2MjE0OX0.oqjHFf2HhCLcanh0HVryoQH7iSV7E9dHHZJdYehxZ0U";
  var TABLES = {
    // Shared tables
    AUTH_TOKENS: "auth_tokens",
    PAIRINGS: "clouds_pairings",
    // Project-specific character tables
    OWLCLOUD_CHARACTERS: "clouds_characters",
    ROLLCLOUD_CHARACTERS: "rollcloud_characters",
    FOUNDCLOUD_CHARACTERS: "foundcloud_characters"
    // Future
  };
  var PROJECT_CONFIGS = {
    owlcloud: {
      characterTable: TABLES.OWLCLOUD_CHARACTERS,
      pairingTable: TABLES.PAIRINGS,
      cacheStorageKey: "owlcloud_character_cache"
    },
    rollcloud: {
      characterTable: TABLES.ROLLCLOUD_CHARACTERS,
      pairingTable: TABLES.PAIRINGS,
      cacheStorageKey: "rollcloud_character_cache"
    },
    foundcloud: {
      characterTable: TABLES.FOUNDCLOUD_CHARACTERS,
      pairingTable: TABLES.PAIRINGS,
      cacheStorageKey: "foundcloud_character_cache"
    }
  };

  // src/background.js
  var debug = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    info: console.info.bind(console),
    group: console.group.bind(console),
    groupEnd: console.groupEnd.bind(console),
    table: console.table.bind(console),
    time: console.time.bind(console),
    timeEnd: console.timeEnd.bind(console),
    isEnabled: () => true
  };
  debug.log("FoundCloud: Background script starting...");
  (async () => {
    try {
      const startupStorage = await browserAPI.storage.local.get(["diceCloudToken", "diceCloudUserId", "tokenExpires", "username", "explicitlyLoggedOut"]);
      debug.log("\u{1F680} Background script startup storage state:", {
        hasToken: !!startupStorage.diceCloudToken,
        tokenLength: startupStorage.diceCloudToken ? startupStorage.diceCloudToken.length : 0,
        tokenStart: startupStorage.diceCloudToken ? startupStorage.diceCloudToken.substring(0, 20) + "..." : "none",
        username: startupStorage.username,
        diceCloudUserId: startupStorage.diceCloudUserId,
        tokenExpires: startupStorage.tokenExpires,
        explicitlyLoggedOut: startupStorage.explicitlyLoggedOut,
        allKeys: Object.keys(startupStorage)
      });
      if (startupStorage.diceCloudToken && !startupStorage.explicitlyLoggedOut) {
        debug.log("\u2705 Service worker restarted with valid auth state");
        if (startupStorage.tokenExpires) {
          const expiryDate = new Date(startupStorage.tokenExpires);
          const now = /* @__PURE__ */ new Date();
          if (!isNaN(expiryDate.getTime()) && now < expiryDate) {
            debug.log("\u2705 Token is still valid on startup");
          } else if (isNaN(expiryDate.getTime())) {
            debug.warn("\u26A0\uFE0F Invalid expiry date on startup, clearing it");
            await browserAPI.storage.local.remove("tokenExpires");
          } else {
            debug.warn("\u23F0 Token expired on startup, logging out");
            await logout();
          }
        }
      } else if (startupStorage.explicitlyLoggedOut) {
        debug.log("\u23ED\uFE0F Service worker restarted after explicit logout");
      } else {
        debug.log("\u{1F50D} No auth state found on startup");
      }
    } catch (error) {
      debug.error("Failed to check startup storage:", error);
    }
  })();
  var browserAPI = typeof browser !== "undefined" && browser.runtime ? browser : chrome;
  var isFirefox = typeof browser !== "undefined";
  debug.log("FoundCloud: Background script initialized on", isFirefox ? "Firefox" : "Chrome");
  if (!isFirefox && chrome.runtime && chrome.runtime.onSuspend) {
    chrome.runtime.onSuspend.addListener(() => {
      debug.log("\u{1F50C} Service worker suspending - saving state...");
    });
  }
  if (!isFirefox && chrome.runtime && chrome.runtime.onSuspendCanceled) {
    chrome.runtime.onSuspendCanceled.addListener(() => {
      debug.log("\u267B\uFE0F Service worker suspension canceled");
    });
  }
  if (!isFirefox && chrome.runtime && chrome.runtime.onStartup) {
    chrome.runtime.onStartup.addListener(() => {
      debug.log("\u{1F680} Chrome startup event received");
    });
  }
  var keepAliveInterval = null;
  function keepServiceWorkerAlive(durationMs = 3e4) {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
    }
    debug.log("\u{1F493} Keeping service worker alive for", durationMs, "ms");
    if (chrome.alarms) {
      chrome.alarms.create("keepAlive", { delayInMinutes: durationMs / 6e4 });
      chrome.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === "keepAlive") {
          debug.log("\u{1F493} Keep-alive alarm triggered");
        }
      });
    } else {
      keepAliveInterval = setInterval(() => {
        debug.log("\u{1F493} Service worker keep-alive ping");
      }, 25e3);
      setTimeout(() => {
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
          debug.log("\u{1F493} Keep-alive interval cleared");
        }
      }, durationMs);
    }
  }
  function stopKeepAlive() {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
    if (chrome.alarms) {
      chrome.alarms.clear("keepAlive");
    }
    debug.log("\u{1F494} Keep-alive stopped");
  }
  if (isFirefox) {
    debug.log("\u{1F98A} Firefox detected - checking extension context...");
    try {
      const manifest = browserAPI.runtime.getManifest();
      debug.log("\u2705 Firefox runtime accessible, version:", manifest.version);
    } catch (error) {
      debug.error("\u274C Firefox runtime not accessible:", error);
    }
    try {
      browserAPI.storage.local.get(["test"], (result) => {
        if (browserAPI.runtime.lastError) {
          debug.error("\u274C Firefox storage error:", browserAPI.runtime.lastError);
        } else {
          debug.log("\u2705 Firefox storage working");
        }
      });
    } catch (error) {
      debug.error("\u274C Firefox storage test error:", error);
    }
  }
  var API_BASE = "https://dicecloud.com/api";
  browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    debug.log("Background received message:", request);
    debug.log("Message sender:", sender);
    if (sender.tab && request.action === "extractAuthToken") {
      debug.log("\u{1F4E4} Passing extractAuthToken to content script - not handling in background");
      return false;
    }
    (async () => {
      try {
        let response;
        switch (request.action) {
          case "storeCharacterData":
            await storeCharacterData(request.data, request.slotId);
            try {
              if (typeof SupabaseTokenManager !== "undefined") {
                const webhookSettings = await browserAPI.storage.local.get(["discordWebhookEnabled", "discordUserId"]);
                const shouldAutoSync = request.syncToCloud || webhookSettings.discordWebhookEnabled || webhookSettings.discordUserId;
                if (shouldAutoSync) {
                  debug.log("\u2601\uFE0F Auto-syncing character to cloud (Discord connected)");
                  await storeCharacterToCloud(request.data, request.pairingCode);
                }
              }
            } catch (syncError) {
              debug.warn("\u26A0\uFE0F Auto-sync to cloud failed (non-fatal):", syncError.message);
            }
            response = { success: true };
            break;
          case "syncCharacterToCloud": {
            const syncResult = await storeCharacterToCloud(request.characterData, request.pairingCode);
            response = syncResult;
            break;
          }
          case "syncCharacterColor": {
            const syncResult = await syncCharacterColorToSupabase(request.characterId, request.color);
            response = syncResult;
            break;
          }
          case "checkDiscordCharacterIntegration": {
            const checkResult = await checkDiscordCharacterIntegration(request.characterName, request.characterId);
            response = checkResult;
            break;
          }
          case "fetchDiceCloudAPI": {
            const fetchResult = await fetchFromDiceCloudAPI(request.url, request.token);
            response = fetchResult;
            break;
          }
          case "getCharacterData": {
            const data = await getCharacterData(request.characterId);
            response = { success: true, data };
            break;
          }
          case "getCharacterDataFromDatabase": {
            const data = await getCharacterDataFromDatabase(request.characterId);
            response = { success: true, data };
            break;
          }
          case "getAllCharacterProfiles": {
            const profiles = await getAllCharacterProfiles();
            response = { success: true, profiles };
            break;
          }
          case "setActiveCharacter":
            await setActiveCharacter(request.characterId);
            response = { success: true };
            break;
          case "clearCharacterData":
            await clearCharacterData(request.characterId);
            response = { success: true };
            break;
          case "loginToDiceCloud": {
            const authData = await loginToDiceCloud(request.username, request.password);
            response = { success: true, authData };
            break;
          }
          case "setApiToken": {
            await setApiToken(request.token, request.userId, request.tokenExpires, request.username);
            response = { success: true };
            break;
          }
          case "getApiToken": {
            const token = await getApiToken();
            response = { success: true, token };
            break;
          }
          case "getManifest": {
            const manifest = browserAPI.runtime.getManifest();
            response = { success: true, manifest };
            break;
          }
          case "logout":
            await logout();
            response = { success: true };
            break;
          case "rollResult":
            debug.log("\u{1F9EC} Forwarding roll result to Roll20 for popup:", request);
            const roll20Tabs = await browserAPI.tabs.query({ url: "*://app.roll20.net/*" });
            if (roll20Tabs.length > 0) {
              await browserAPI.tabs.sendMessage(roll20Tabs[0].id, {
                action: "forwardToPopup",
                rollResult: request.rollResult,
                baseRoll: request.baseRoll,
                characterName: request.characterName,
                characterId: request.characterId
              });
              response = { success: true };
            } else {
              response = { success: false, error: "No Roll20 tabs found" };
            }
            break;
          case "relayRollToRoll20": {
            debug.log("\u{1F3B2} Relaying roll to Roll20:", request.roll);
            const r20Tabs = await browserAPI.tabs.query({ url: "*://app.roll20.net/*" });
            if (r20Tabs.length > 0) {
              for (const tab of r20Tabs) {
                try {
                  await browserAPI.tabs.sendMessage(tab.id, {
                    action: "rollFromPopout",
                    roll: request.roll,
                    name: request.roll?.name,
                    formula: request.roll?.formula,
                    characterName: request.roll?.characterName
                  });
                  debug.log("\u2705 Roll relayed to Roll20 tab:", tab.id);
                } catch (tabError) {
                  debug.warn("\u26A0\uFE0F Could not send to tab", tab.id, tabError.message);
                }
              }
              response = { success: true };
            } else {
              debug.warn("\u26A0\uFE0F No Roll20 tabs found to relay roll");
              response = { success: false, error: "No Roll20 tabs found" };
            }
            break;
          }
          case "extractAuthToken": {
            if (request.tabId) {
              debug.log("\u{1F4E4} Forwarding extractAuthToken to tab:", request.tabId);
              try {
                const contentResponse = await browserAPI.tabs.sendMessage(request.tabId, {
                  action: "extractAuthToken"
                });
                debug.log("\u{1F4E5} Received response from content script:", contentResponse);
                response = { success: true, data: contentResponse };
              } catch (error) {
                debug.error("\u274C Error forwarding to content script:", error);
                response = { success: false, error: error.message };
              }
            } else {
              response = { success: false, error: "No tabId provided" };
            }
            break;
          }
          case "checkLoginStatus": {
            const loginStatus = await checkLoginStatus();
            response = { success: true, ...loginStatus };
            break;
          }
          case "toggleGMMode": {
            debug.log("\u{1F451} Received toggleGMMode request, forwarding to Roll20 tabs");
            await sendGMModeToggleToRoll20Tabs(request.enabled);
            response = { success: true };
            break;
          }
          case "createDiscordPairing": {
            const pairingResult = await createDiscordPairing(request.code, request.username, request.diceCloudUserId);
            response = pairingResult;
            break;
          }
          case "checkDiscordPairing": {
            const checkResult = await checkDiscordPairing(request.code);
            response = checkResult;
            break;
          }
          case "setDiscordWebhook": {
            const enabled = request.enabled !== void 0 ? request.enabled : !!request.webhookUrl;
            debug.log("\u{1F4DD} setDiscordWebhook called:", {
              webhookUrl: request.webhookUrl ? `${request.webhookUrl.substring(0, 50)}...` : "(empty)",
              enabled,
              serverName: request.serverName,
              pairingId: request.pairingId
            });
            await setDiscordWebhookSettings(request.webhookUrl, enabled, request.serverName);
            if (request.pairingId) {
              currentPairingId = request.pairingId;
              await browserAPI.storage.local.set({
                currentPairingId: request.pairingId,
                discordPairingId: request.pairingId
              });
              subscribeToCommandRealtime(request.pairingId);
            }
            if (request.discordUserId && request.discordUserId !== "null") {
              await linkDiscordUserToAuthTokens(
                request.discordUserId,
                request.discordUsername,
                request.discordGlobalName
              );
            }
            response = { success: true };
            break;
          }
          case "getDiscordWebhook": {
            const settings = await getDiscordWebhookSettings();
            if (settings.enabled && settings.webhookUrl) {
              const stored = await browserAPI.storage.local.get(["discordPairingId"]);
              if (stored.discordPairingId && isSupabaseConfigured()) {
                try {
                  const pairingResponse = await fetch(
                    `${SUPABASE_URL}/rest/v1/rollcloud_pairings?id=eq.${stored.discordPairingId}&select=discord_user_id,discord_username,discord_global_name`,
                    {
                      headers: {
                        "apikey": SUPABASE_ANON_KEY,
                        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
                      }
                    }
                  );
                  if (pairingResponse.ok) {
                    const pairings = await pairingResponse.json();
                    if (pairings.length > 0 && pairings[0].discord_user_id) {
                      await linkDiscordUserToAuthTokens(
                        pairings[0].discord_user_id,
                        pairings[0].discord_username,
                        pairings[0].discord_global_name
                      );
                    }
                  }
                } catch (e) {
                  debug.warn("Could not sync discord_user_id on getDiscordWebhook:", e);
                }
              }
            }
            response = { success: true, ...settings };
            break;
          }
          case "testDiscordWebhook": {
            const testResult = await testDiscordWebhook(request.webhookUrl);
            response = testResult;
            break;
          }
          case "requestPairingCodeFromInstaller": {
            if (installerPort) {
              installerPort.postMessage({ type: "getPairingCode" });
              response = { success: true, message: "Pairing code requested from installer" };
            } else {
              const port = await connectToInstaller();
              if (port) {
                port.postMessage({ type: "getPairingCode" });
                response = { success: true, message: "Connected and requested pairing code" };
              } else {
                response = { success: false, error: "Could not connect to installer" };
              }
            }
            break;
          }
          case "getRealtimeStatus": {
            const realtimeConnected = commandRealtimeSocket && commandRealtimeSocket.readyState === WebSocket.OPEN;
            const settings = await browserAPI.storage.local.get(["discordPairingId", "discordWebhookEnabled"]);
            response = {
              success: true,
              realtimeConnected,
              socketState: commandRealtimeSocket ? commandRealtimeSocket.readyState : null,
              currentPairingId,
              storedPairingId: settings.discordPairingId,
              webhookEnabled: settings.discordWebhookEnabled,
              supabaseConfigured: isSupabaseConfigured()
            };
            debug.log("Realtime status:", response);
            break;
          }
          default:
            debug.warn("Unknown action:", request.action);
            response = { success: false, error: "Unknown action: " + request.action };
            break;
        }
        debug.log("Sending response:", response);
        sendResponse(response);
      } catch (error) {
        debug.error("Error handling message:", error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  });
  async function loginToDiceCloud(username, password) {
    try {
      keepServiceWorkerAlive(6e4);
      const isEmail = username.includes("@");
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(isEmail ? {
          email: username,
          password
        } : {
          username,
          password
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Login failed: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      await browserAPI.storage.local.set({
        diceCloudToken: data.token,
        diceCloudUserId: data.id,
        tokenExpires: data.tokenExpires,
        username
      });
      await browserAPI.storage.local.remove(["explicitlyLoggedOut"]);
      debug.log("Successfully logged in to DiceCloud");
      debug.log("Token expires:", data.tokenExpires);
      setTimeout(() => stopKeepAlive(), 5e3);
      return data;
    } catch (error) {
      stopKeepAlive();
      debug.error("Failed to login to DiceCloud:", error);
      throw error;
    }
  }
  async function setApiToken(token, userId = null, tokenExpires = null, username = null) {
    try {
      keepServiceWorkerAlive(3e4);
      debug.log("\u{1F510} setApiToken called:", {
        tokenLength: token ? token.length : 0,
        tokenStart: token ? token.substring(0, 20) + "..." : "none",
        userId,
        tokenExpires,
        username
      });
      if (!token || token.length < 10) {
        throw new Error("Invalid API token format");
      }
      const storageData = {
        diceCloudToken: token,
        username: username || "DiceCloud User"
      };
      if (userId) {
        storageData.diceCloudUserId = userId;
      }
      if (tokenExpires) {
        storageData.tokenExpires = tokenExpires;
      }
      await browserAPI.storage.local.set(storageData);
      await browserAPI.storage.local.remove(["explicitlyLoggedOut"]);
      const existing = await browserAPI.storage.local.get(["tokenExpires"]);
      if (existing.tokenExpires) {
        const testDate = new Date(existing.tokenExpires);
        if (isNaN(testDate.getTime())) {
          debug.warn("\u{1F9F9} Clearing invalid tokenExpires format:", existing.tokenExpires);
          await browserAPI.storage.local.remove("tokenExpires");
        }
      }
      const verification = await browserAPI.storage.local.get(["diceCloudToken", "diceCloudUserId", "tokenExpires", "username"]);
      debug.log("\u2705 setApiToken verification:", {
        storedToken: verification.diceCloudToken ? verification.diceCloudToken.substring(0, 20) + "..." : "none",
        storedUserId: verification.diceCloudUserId,
        storedUsername: verification.username,
        storedExpires: verification.tokenExpires
      });
      debug.log("Successfully stored API token");
      setTimeout(() => stopKeepAlive(), 3e3);
      return { success: true };
    } catch (error) {
      stopKeepAlive();
      debug.error("Failed to store API token:", error);
      throw error;
    }
  }
  async function getApiToken() {
    try {
      const result = await browserAPI.storage.local.get(["diceCloudToken", "tokenExpires"]);
      debug.log("\u{1F50D} getApiToken called, storage result:", {
        hasToken: !!result.diceCloudToken,
        tokenLength: result.diceCloudToken ? result.diceCloudToken.length : 0,
        tokenStart: result.diceCloudToken ? result.diceCloudToken.substring(0, 20) + "..." : "none",
        tokenExpires: result.tokenExpires,
        allKeys: Object.keys(result)
      });
      if (!result.diceCloudToken) {
        debug.warn("\u274C No diceCloudToken found in storage");
        return null;
      }
      if (result.tokenExpires) {
        let expiryDate;
        if (typeof result.tokenExpires === "number") {
          expiryDate = new Date(result.tokenExpires);
        } else if (typeof result.tokenExpires === "string") {
          expiryDate = new Date(result.tokenExpires);
          if (isNaN(expiryDate.getTime())) {
            debug.warn("\u26A0\uFE0F Invalid tokenExpires date format:", result.tokenExpires);
            expiryDate = null;
          }
        }
        const now = /* @__PURE__ */ new Date();
        debug.log("\u{1F50D} Token expiry check:", {
          tokenExpires: result.tokenExpires,
          expiryDate: expiryDate ? expiryDate.toISOString() : "invalid",
          now: now.toISOString(),
          isExpired: expiryDate ? now >= expiryDate : "unknown"
        });
        if (expiryDate && now >= expiryDate) {
          debug.warn("\u23F0 API token has expired, logging out");
          await logout();
          return null;
        }
      }
      debug.log("\u2705 getApiToken returning valid token");
      return result.diceCloudToken;
    } catch (error) {
      debug.error("Failed to retrieve API token:", error);
      throw error;
    }
  }
  async function checkLoginStatus() {
    try {
      const result = await browserAPI.storage.local.get(["diceCloudToken", "username", "tokenExpires", "diceCloudUserId"]);
      debug.log("\u{1F50D} checkLoginStatus called, storage result:", {
        hasToken: !!result.diceCloudToken,
        tokenLength: result.diceCloudToken ? result.diceCloudToken.length : 0,
        tokenStart: result.diceCloudToken ? result.diceCloudToken.substring(0, 20) + "..." : "none",
        username: result.username,
        diceCloudUserId: result.diceCloudUserId,
        tokenExpires: result.tokenExpires,
        allKeys: Object.keys(result)
      });
      if (!result.diceCloudToken) {
        debug.warn("\u274C checkLoginStatus: No diceCloudToken found");
        return { loggedIn: false };
      }
      if (result.tokenExpires) {
        let expiryDate;
        if (typeof result.tokenExpires === "number") {
          expiryDate = new Date(result.tokenExpires);
        } else if (typeof result.tokenExpires === "string") {
          expiryDate = new Date(result.tokenExpires);
          if (isNaN(expiryDate.getTime())) {
            debug.warn("\u26A0\uFE0F Invalid tokenExpires date format in checkLoginStatus:", result.tokenExpires);
            expiryDate = null;
          }
        }
        const now = /* @__PURE__ */ new Date();
        debug.log("\u{1F50D} Login status expiry check:", {
          tokenExpires: result.tokenExpires,
          expiryDate: expiryDate ? expiryDate.toISOString() : "invalid",
          now: now.toISOString(),
          isExpired: expiryDate ? now >= expiryDate : "unknown"
        });
        if (expiryDate && now >= expiryDate) {
          debug.warn("\u23F0 Session expired - please login again");
          await logout();
          return { loggedIn: false };
        }
      }
      debug.log("\u2705 checkLoginStatus: User is logged in");
      return {
        loggedIn: true,
        username: result.username || "DiceCloud User",
        userId: result.diceCloudUserId || null
      };
    } catch (error) {
      debug.error("Failed to check login status:", error);
      throw error;
    }
  }
  async function logout() {
    try {
      debug.warn("\u{1F6AA} logout() called - getting current storage state...");
      const currentState = await browserAPI.storage.local.get(["diceCloudToken", "diceCloudUserId", "tokenExpires", "username", "explicitlyLoggedOut"]);
      debug.log("\u{1F50D} Current storage before logout:", {
        hasToken: !!currentState.diceCloudToken,
        tokenLength: currentState.diceCloudToken ? currentState.diceCloudToken.length : 0,
        username: currentState.username,
        diceCloudUserId: currentState.diceCloudUserId,
        tokenExpires: currentState.tokenExpires,
        explicitlyLoggedOut: currentState.explicitlyLoggedOut
      });
      await browserAPI.storage.local.set({ explicitlyLoggedOut: true });
      await browserAPI.storage.local.remove(["diceCloudToken", "diceCloudUserId", "tokenExpires", "username"]);
      debug.warn("\u{1F6AA} logout() completed - storage cleared");
    } catch (error) {
      debug.error("Failed to logout:", error);
      throw error;
    }
  }
  async function storeCharacterData(characterData, slotId) {
    try {
      if (characterData.character_name && !characterData.name) {
        characterData.name = characterData.character_name;
      }
      const storageId = slotId || characterData.id || characterData._id || "default";
      const result = await browserAPI.storage.local.get(["characterProfiles", "activeCharacterId"]);
      const characterProfiles = result.characterProfiles || {};
      characterProfiles[storageId] = characterData;
      const updates = {
        characterProfiles,
        timestamp: Date.now()
      };
      if (!result.activeCharacterId) {
        updates.activeCharacterId = storageId;
        debug.log(`Setting active character to: ${storageId}`);
      } else {
        debug.log(`Keeping existing active character: ${result.activeCharacterId}`);
      }
      await browserAPI.storage.local.set(updates);
      debug.log(`Character data stored successfully for ID: ${storageId}`, characterData);
    } catch (error) {
      debug.error("Failed to store character data:", error);
      throw error;
    }
  }
  async function getCharacterData(characterId = null) {
    try {
      const result = await browserAPI.storage.local.get(["characterProfiles", "activeCharacterId", "characterData"]);
      if (result.characterData && !result.characterProfiles) {
        debug.log("Migrating old single character data to profiles...");
        const charId = result.characterData.characterId || result.characterData._id || "default";
        const characterProfiles2 = {};
        characterProfiles2[charId] = result.characterData;
        await browserAPI.storage.local.set({
          characterProfiles: characterProfiles2,
          activeCharacterId: charId
        });
        await browserAPI.storage.local.remove("characterData");
        return result.characterData;
      }
      const characterProfiles = result.characterProfiles || {};
      if (characterId) {
        return characterProfiles[characterId] || null;
      }
      const activeCharacterId = result.activeCharacterId;
      if (activeCharacterId && characterProfiles[activeCharacterId]) {
        debug.log("Retrieved active character data:", characterProfiles[activeCharacterId]);
        return characterProfiles[activeCharacterId];
      }
      const characterIds = Object.keys(characterProfiles);
      if (characterIds.length > 0) {
        debug.log("No active character, returning first available:", characterProfiles[characterIds[0]]);
        return characterProfiles[characterIds[0]];
      }
      return null;
    } catch (error) {
      debug.error("Failed to retrieve character data:", error);
      throw error;
    }
  }
  async function getAllCharacterProfiles() {
    try {
      const localResult = await browserAPI.storage.local.get(["characterProfiles"]);
      const localProfiles = localResult.characterProfiles || {};
      for (const id of Object.keys(localProfiles)) {
        const profile = localProfiles[id];
        if (profile.character_name && !profile.name) {
          profile.name = profile.character_name;
        }
      }
      let databaseCharacters = {};
      try {
        if (typeof SupabaseTokenManager !== "undefined") {
          const supabase2 = new SupabaseTokenManager();
          const tokenResult = await supabase2.retrieveToken();
          if (tokenResult.success && tokenResult.userId) {
            debug.log("\u{1F310} Fetching database characters for DiceCloud user:", tokenResult.userId);
            const response = await fetch(
              `${supabase2.supabaseUrl}/rest/v1/rollcloud_characters?user_id_dicecloud=eq.${tokenResult.userId}&select=*`,
              {
                headers: {
                  "apikey": supabase2.supabaseKey,
                  "Authorization": `Bearer ${supabase2.supabaseKey}`
                }
              }
            );
            if (response.ok) {
              const characters = await response.json();
              debug.log(`\u{1F4E6} Found ${characters.length} characters in database`);
              characters.forEach((character) => {
                const slotId = `db-${character.dicecloud_character_id}`;
                databaseCharacters[slotId] = {
                  name: character.character_name,
                  id: character.dicecloud_character_id,
                  source: "database",
                  lastUpdated: character.updated_at,
                  race: character.race,
                  class: character.class,
                  level: character.level,
                  // Store full character data for loading
                  _fullData: character
                };
              });
            } else {
              debug.warn("\u26A0\uFE0F Failed to fetch database characters:", response.status);
            }
          }
        }
      } catch (dbError) {
        debug.warn("\u26A0\uFE0F Failed to load database characters:", dbError);
      }
      const mergedProfiles = { ...localProfiles, ...databaseCharacters };
      debug.log("\u{1F4CB} Character profiles loaded:", {
        local: Object.keys(localProfiles).length,
        database: Object.keys(databaseCharacters).length,
        total: Object.keys(mergedProfiles).length
      });
      return mergedProfiles;
    } catch (error) {
      debug.error("Failed to retrieve character profiles:", error);
      throw error;
    }
  }
  async function getCharacterDataFromDatabase(characterId) {
    try {
      if (typeof SupabaseTokenManager === "undefined") {
        throw new Error("SupabaseTokenManager not available");
      }
      const supabase2 = new SupabaseTokenManager();
      const response = await fetch(
        `${supabase2.supabaseUrl}/rest/v1/rollcloud_characters?dicecloud_character_id=eq.${characterId}&select=*&order=updated_at.desc&limit=1`,
        {
          headers: {
            "apikey": supabase2.supabaseKey,
            "Authorization": `Bearer ${supabase2.supabaseKey}`
          }
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch database character: ${response.status}`);
      }
      const characters = await response.json();
      if (characters.length === 0) {
        throw new Error("Character not found in database");
      }
      const dbCharacter = characters[0];
      let rawData = dbCharacter.raw_dicecloud_data;
      if (rawData && typeof rawData === "string") {
        try {
          rawData = JSON.parse(rawData);
          debug.log("\u{1F4E6} Parsed raw_dicecloud_data from JSON string");
        } catch (parseError) {
          debug.warn("\u26A0\uFE0F raw_dicecloud_data is a string but not valid JSON:", parseError.message);
          rawData = null;
        }
      }
      if (rawData && typeof rawData === "object" && !Array.isArray(rawData)) {
        const fullCharacter = rawData;
        fullCharacter.source = "database";
        fullCharacter.lastUpdated = dbCharacter.updated_at;
        if (!fullCharacter.id) {
          fullCharacter.id = dbCharacter.dicecloud_character_id;
        }
        if (!fullCharacter.name) {
          fullCharacter.name = dbCharacter.character_name;
        }
        debug.log(
          "\u2705 Loaded full character from database raw_dicecloud_data:",
          fullCharacter.name,
          "HP:",
          JSON.stringify(fullCharacter.hitPoints),
          "AC:",
          fullCharacter.armorClass,
          "Prof:",
          fullCharacter.proficiencyBonus
        );
        return fullCharacter;
      }
      debug.warn("\u26A0\uFE0F No raw_dicecloud_data found (type:", typeof rawData, "), using database fields directly");
      debug.warn("\u26A0\uFE0F DB record keys:", Object.keys(dbCharacter));
      const characterData = {
        // Use the exact database field names to maintain consistency
        id: dbCharacter.dicecloud_character_id,
        name: dbCharacter.character_name,
        race: dbCharacter.race,
        class: dbCharacter.class,
        level: dbCharacter.level,
        alignment: dbCharacter.alignment,
        hitPoints: dbCharacter.hit_points,
        hitDice: dbCharacter.hit_dice,
        temporaryHP: dbCharacter.temporary_hp,
        deathSaves: dbCharacter.death_saves,
        inspiration: dbCharacter.inspiration,
        armorClass: dbCharacter.armor_class,
        speed: dbCharacter.speed,
        initiative: dbCharacter.initiative,
        proficiencyBonus: dbCharacter.proficiency_bonus,
        attributes: dbCharacter.attributes,
        attributeMods: dbCharacter.attribute_mods,
        saves: dbCharacter.saves,
        skills: dbCharacter.skills,
        spellSlots: dbCharacter.spell_slots,
        resources: dbCharacter.resources,
        conditions: dbCharacter.conditions,
        // Preserve the raw database record for debugging
        rawDiceCloudData: dbCharacter,
        source: "database",
        lastUpdated: dbCharacter.updated_at
      };
      debug.log("\u2705 Loaded character from database (individual fields):", characterData.name);
      return characterData;
    } catch (error) {
      debug.error("\u274C Failed to get character data from database:", error);
      throw error;
    }
  }
  async function setActiveCharacter(characterId) {
    try {
      await browserAPI.storage.local.set({
        activeCharacterId: characterId
      });
      debug.log(`Active character set to: ${characterId}`);
      try {
        const tabs = await browserAPI.tabs.query({ url: "*://app.roll20.net/*" });
        if (tabs.length > 0) {
          const result = await browserAPI.storage.local.get(["characterProfiles"]);
          const characterProfiles = result.characterProfiles || {};
          const characterData = characterProfiles[characterId];
          if (characterData && characterData.id) {
            debug.log(`Broadcasting active character change to Roll20 tabs: ${characterData.id}`);
            for (const tab of tabs) {
              browserAPI.tabs.sendMessage(tab.id, {
                action: "activeCharacterChanged",
                characterId: characterData.id,
                slotId: characterId
              }).catch((err) => {
                debug.warn(`Failed to notify tab ${tab.id} about character change:`, err);
              });
            }
          }
        }
      } catch (error) {
        debug.warn("Failed to broadcast character change to Roll20 tabs:", error);
      }
    } catch (error) {
      debug.error("Failed to set active character:", error);
      throw error;
    }
  }
  async function clearCharacterData(characterId = null) {
    try {
      if (characterId) {
        const result = await browserAPI.storage.local.get(["characterProfiles", "activeCharacterId"]);
        const characterProfiles = result.characterProfiles || {};
        const activeCharacterId = result.activeCharacterId;
        delete characterProfiles[characterId];
        const updates = {
          characterProfiles
        };
        if (activeCharacterId === characterId) {
          const remainingIds = Object.keys(characterProfiles);
          if (remainingIds.length > 0) {
            updates.activeCharacterId = remainingIds[0];
            debug.log(`Active character was cleared, switching to ${remainingIds[0]}`);
          } else {
            updates.activeCharacterId = null;
            debug.log("No characters remaining, clearing active character ID");
          }
        }
        await browserAPI.storage.local.set(updates);
        debug.log(`Character profile cleared for ID: ${characterId}`);
      } else {
        await browserAPI.storage.local.remove(["characterProfiles", "activeCharacterId", "timestamp"]);
        debug.log("All character data cleared successfully");
      }
    } catch (error) {
      debug.error("Failed to clear character data:", error);
      throw error;
    }
  }
  async function sendRollToAllRoll20Tabs(rollData) {
    try {
      const tabs = await browserAPI.tabs.query({ url: "*://app.roll20.net/*" });
      if (tabs.length === 0) {
        debug.warn("\u26A0\uFE0F No Roll20 tabs found - roll not sent");
        return { success: false, error: "No Roll20 tabs open. Please open Roll20 in a browser tab." };
      }
      let successCount = 0;
      let failCount = 0;
      const errors = [];
      for (const tab of tabs) {
        try {
          await browserAPI.tabs.sendMessage(tab.id, {
            action: "postRollToChat",
            roll: rollData
          });
          successCount++;
        } catch (err) {
          failCount++;
          debug.warn(`Failed to send roll to tab ${tab.id}:`, err.message);
          errors.push(`Tab ${tab.id}: ${err.message}`);
        }
      }
      if (successCount > 0) {
        debug.log(`\u2705 Roll sent to ${successCount}/${tabs.length} Roll20 tab(s)`);
        return { success: true, tabsSent: successCount, tabsFailed: failCount };
      } else {
        debug.error(`\u274C Failed to send roll to any Roll20 tabs. Errors: ${errors.join(", ")}`);
        return { success: false, error: "Failed to send roll to Roll20. Try refreshing the Roll20 page." };
      }
    } catch (error) {
      debug.error("Failed to send roll to Roll20 tabs:", error);
      return { success: false, error: error.message };
    }
  }
  async function sendGMModeToggleToRoll20Tabs(enabled) {
    try {
      const tabs = await browserAPI.tabs.query({ url: "*://app.roll20.net/*" });
      if (tabs.length === 0) {
        debug.warn("No Roll20 tabs found");
        return;
      }
      const promises = tabs.map((tab) => {
        return browserAPI.tabs.sendMessage(tab.id, {
          action: "toggleGMMode",
          enabled
        }).catch((err) => {
          debug.warn(`Failed to send GM Mode toggle to tab ${tab.id}:`, err);
        });
      });
      await Promise.all(promises);
      debug.log(`GM Mode toggle sent to ${tabs.length} Roll20 tab(s)`);
    } catch (error) {
      debug.error("Failed to send GM Mode toggle to Roll20 tabs:", error);
      throw error;
    }
  }
  browserAPI.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      debug.log("Extension installed");
      setTimeout(() => {
        openExtensionPopup();
      }, 1e3);
    } else if (details.reason === "update") {
      debug.log("Extension updated to version", browserAPI.runtime.getManifest().version);
    }
  });
  async function openExtensionPopup() {
    try {
      debug.log("\u{1F680} Opening extension popup after installation...");
      if (!isFirefox) {
        browserAPI.runtime.openOptionsPage();
        debug.log("\u2705 Opened options page for Chrome");
      } else {
        try {
          browserAPI.runtime.openOptionsPage();
          debug.log("\u2705 Opened options page for Firefox");
        } catch (error) {
          debug.log("\u26A0\uFE0F Could not open options page:", error);
        }
      }
    } catch (error) {
      debug.log("\u274C Error opening popup/options:", error);
    }
  }
  async function setDiscordWebhookSettings(webhookUrl, enabled = true, serverName = null) {
    try {
      const settings = {
        discordWebhookUrl: webhookUrl || "",
        discordWebhookEnabled: enabled
      };
      if (serverName) {
        settings.discordServerName = serverName;
      }
      debug.log("\u{1F4DD} Saving Discord webhook settings:", {
        webhookUrl: webhookUrl ? `${webhookUrl.substring(0, 50)}...` : "(empty)",
        enabled,
        serverName
      });
      await browserAPI.storage.local.set(settings);
      const verification = await browserAPI.storage.local.get(["discordWebhookUrl", "discordWebhookEnabled"]);
      debug.log("\u2705 Discord webhook settings verified:", {
        storedUrl: verification.discordWebhookUrl ? `${verification.discordWebhookUrl.substring(0, 50)}...` : "(empty)",
        storedEnabled: verification.discordWebhookEnabled
      });
    } catch (error) {
      debug.error("Failed to save Discord webhook settings:", error);
      throw error;
    }
  }
  async function getDiscordWebhookSettings() {
    try {
      const result = await browserAPI.storage.local.get([
        "discordWebhookUrl",
        "discordWebhookEnabled",
        "discordServerName"
      ]);
      return {
        webhookUrl: result.discordWebhookUrl || "",
        enabled: result.discordWebhookEnabled !== false,
        // Default to true if URL exists
        serverName: result.discordServerName || null
      };
    } catch (error) {
      debug.error("Failed to get Discord webhook settings:", error);
      return { webhookUrl: "", enabled: false, serverName: null };
    }
  }
  async function testDiscordWebhook(webhookUrl) {
    try {
      if (!webhookUrl || !webhookUrl.includes("discord.com/api/webhooks")) {
        return { success: false, error: "Invalid Discord webhook URL" };
      }
      const testEmbed = {
        embeds: [{
          title: "\u{1F3B2} FoundCloud Connected!",
          description: "Discord webhook integration is working correctly.",
          color: 5164484,
          // Teal color matching the extension theme
          footer: {
            text: "FoundCloud - Dice Cloud \u2192 Roll20 Bridge"
          },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }]
      };
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testEmbed)
      });
      if (response.ok || response.status === 204) {
        debug.log("\u2705 Discord webhook test successful");
        return { success: true };
      } else {
        const errorText = await response.text();
        debug.warn("\u274C Discord webhook test failed:", response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }
    } catch (error) {
      debug.error("\u274C Discord webhook test error:", error);
      return { success: false, error: error.message };
    }
  }
  async function linkDiscordUserToAuthTokens(discordUserId, discordUsername, discordGlobalName) {
    if (!isSupabaseConfigured() || !discordUserId) {
      debug.warn("Cannot link Discord user - Supabase not configured or no user ID");
      return { success: false };
    }
    try {
      const browserFingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + "x" + screen.height,
        (/* @__PURE__ */ new Date()).getTimezoneOffset()
      ].join("|");
      let hash = 0;
      for (let i = 0; i < browserFingerprint.length; i++) {
        const char = browserFingerprint.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      const visitorId = "user_" + Math.abs(hash).toString(36);
      debug.log("\u{1F517} Linking Discord user to auth_tokens:", discordUserId, discordUsername, discordGlobalName, "for browser:", visitorId);
      const updatePayload = {
        discord_user_id: discordUserId,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (discordUsername) {
        updatePayload.discord_username = discordUsername;
      }
      if (discordGlobalName) {
        updatePayload.discord_global_name = discordGlobalName;
      }
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/auth_tokens?user_id=eq.${visitorId}`,
        {
          method: "PATCH",
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify(updatePayload)
        }
      );
      if (response.ok) {
        debug.log("\u2705 Discord user linked to auth_tokens");
        const authResult = await browserAPI.storage.local.get(["diceCloudUserId"]);
        if (authResult.diceCloudUserId) {
          await linkDiscordUserToCharacters(discordUserId, authResult.diceCloudUserId);
        }
        return { success: true };
      } else {
        const errorText = await response.text();
        debug.error("\u274C Failed to link Discord user:", response.status, errorText);
        return { success: false, error: errorText };
      }
    } catch (error) {
      debug.error("\u274C Error linking Discord user:", error);
      return { success: false, error: error.message };
    }
  }
  async function linkDiscordUserToCharacters(discordUserId, diceCloudUserId) {
    if (!isSupabaseConfigured())
      return;
    try {
      debug.log("\u{1F517} Linking Discord user to existing characters:", discordUserId);
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/rollcloud_characters?user_id_dicecloud=eq.${diceCloudUserId}&discord_user_id=eq.not_linked`,
        {
          method: "PATCH",
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({
            discord_user_id: discordUserId,
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          })
        }
      );
      if (response.ok) {
        debug.log("\u2705 Updated existing characters with Discord user ID");
      } else {
        debug.warn("\u26A0\uFE0F Could not update existing characters:", response.status);
      }
    } catch (error) {
      debug.warn("\u26A0\uFE0F Error updating existing characters:", error);
    }
  }
  async function storeCharacterToCloud(characterData, pairingCode = null) {
    if (!isSupabaseConfigured()) {
      debug.warn("Supabase not configured - character sync unavailable");
      return {
        success: false,
        error: "Cloud sync not available. Supabase not configured.",
        supabaseNotConfigured: true
      };
    }
    try {
      debug.log("\u{1F3AD} Storing character in Supabase:", characterData.name || characterData.id);
      const browserFingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + "x" + screen.height,
        (/* @__PURE__ */ new Date()).getTimezoneOffset()
      ].join("|");
      let hash = 0;
      for (let i = 0; i < browserFingerprint.length; i++) {
        const char = browserFingerprint.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      const visitorId = "user_" + Math.abs(hash).toString(36);
      let dicecloudUserId = characterData.dicecloudUserId || characterData.userId || null;
      if (!dicecloudUserId) {
        const stored = await browserAPI.storage.local.get(["diceCloudUserId"]);
        dicecloudUserId = stored.diceCloudUserId || null;
        if (dicecloudUserId) {
          debug.log("\u2705 Got DiceCloud user ID from storage:", dicecloudUserId);
        }
      }
      const payload = {
        user_id_dicecloud: dicecloudUserId,
        dicecloud_character_id: characterData.id,
        character_name: characterData.name || "Unknown",
        race: characterData.race || null,
        class: characterData.class || null,
        level: characterData.level || 1,
        alignment: characterData.alignment || null,
        hit_points: characterData.hitPoints || { current: 0, max: 0 },
        hit_dice: characterData.hitDice || { current: 0, max: 0, type: "d8" },
        temporary_hp: characterData.temporaryHP || 0,
        death_saves: characterData.deathSaves || { successes: 0, failures: 0 },
        inspiration: characterData.inspiration || false,
        armor_class: characterData.armorClass || 10,
        speed: characterData.speed || 30,
        initiative: characterData.initiative || 0,
        proficiency_bonus: characterData.proficiencyBonus || 2,
        attributes: characterData.attributes || {},
        attribute_mods: characterData.attributeMods || {},
        saves: characterData.saves || {},
        skills: characterData.skills || {},
        spell_slots: characterData.spellSlots || {},
        resources: characterData.resources || [],
        conditions: characterData.conditions || [],
        // Store the FULL parsed character object so it can be rebuilt exactly
        // The individual fields above are for Discord bot quick access
        raw_dicecloud_data: characterData,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (pairingCode) {
        const pairingResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/rollcloud_pairings?pairing_code=eq.${pairingCode}&select=id,discord_user_id`,
          {
            headers: {
              "apikey": SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
            }
          }
        );
        if (pairingResponse.ok) {
          const pairings = await pairingResponse.json();
          if (pairings.length > 0) {
            payload.pairing_id = pairings[0].id;
            payload.discord_user_id = pairings[0].discord_user_id;
            debug.log("\u2705 Linked to pairing:", pairings[0].id);
          }
        }
      } else {
        let discordUserId = null;
        try {
          const authResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/auth_tokens?user_id=eq.${visitorId}&select=discord_user_id`,
            {
              headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
              }
            }
          );
          if (authResponse.ok) {
            const authTokens = await authResponse.json();
            if (authTokens.length > 0 && authTokens[0].discord_user_id) {
              discordUserId = authTokens[0].discord_user_id;
              debug.log("\u2705 Found Discord user ID from auth_tokens:", discordUserId);
            }
          }
        } catch (error) {
          debug.warn("\u26A0\uFE0F Failed to check auth_tokens:", error.message);
        }
        if (!discordUserId && payload.user_id_dicecloud) {
          try {
            const pairingResponse = await fetch(
              `${SUPABASE_URL}/rest/v1/rollcloud_pairings?dicecloud_user_id=eq.${payload.user_id_dicecloud}&status=eq.connected&select=discord_user_id,discord_username,discord_global_name`,
              {
                headers: {
                  "apikey": SUPABASE_ANON_KEY,
                  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
                }
              }
            );
            if (pairingResponse.ok) {
              const pairings = await pairingResponse.json();
              if (pairings.length > 0 && pairings[0].discord_user_id) {
                discordUserId = pairings[0].discord_user_id;
                debug.log("\u2705 Found Discord user ID from pairings:", discordUserId);
                await linkDiscordUserToAuthTokens(
                  discordUserId,
                  pairings[0].discord_username,
                  pairings[0].discord_global_name
                );
              }
            }
          } catch (error) {
            debug.warn("\u26A0\uFE0F Failed to check pairings:", error.message);
          }
        }
        if (!discordUserId) {
          try {
            const stored = await browserAPI.storage.local.get(["discordPairingId"]);
            if (stored.discordPairingId) {
              const pairingResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/rollcloud_pairings?id=eq.${stored.discordPairingId}&select=discord_user_id,discord_username,discord_global_name`,
                {
                  headers: {
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
                  }
                }
              );
              if (pairingResponse.ok) {
                const pairings = await pairingResponse.json();
                if (pairings.length > 0 && pairings[0].discord_user_id) {
                  discordUserId = pairings[0].discord_user_id;
                  debug.log("\u2705 Found Discord user ID from stored pairing:", discordUserId);
                  await linkDiscordUserToAuthTokens(
                    discordUserId,
                    pairings[0].discord_username,
                    pairings[0].discord_global_name
                  );
                }
              }
            }
          } catch (error) {
            debug.warn("\u26A0\uFE0F Failed to check stored pairing:", error.message);
          }
        }
        payload.discord_user_id = discordUserId || "not_linked";
        if (!discordUserId) {
          debug.log("\u26A0\uFE0F No Discord user ID found from any source, using placeholder");
        }
      }
      debug.log("\u{1F4E4} Sending character payload to Supabase:", payload.character_name);
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/rollcloud_characters`,
        {
          method: "POST",
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal"
          },
          body: JSON.stringify(payload)
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        debug.log("\u26A0\uFE0F Character POST failed, trying PATCH:", response.status, errorText);
        const updateResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/rollcloud_characters?dicecloud_character_id=eq.${characterData.id}`,
          {
            method: "PATCH",
            headers: {
              "apikey": SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
              "Prefer": "return=minimal"
            },
            body: JSON.stringify(payload)
          }
        );
        if (!updateResponse.ok) {
          const patchError = await updateResponse.text();
          debug.error("\u274C Character PATCH also failed:", updateResponse.status, patchError);
          throw new Error(`Character update failed: ${patchError}`);
        }
        debug.log("\u2705 Character updated via PATCH");
      } else {
        debug.log("\u2705 Character inserted via POST");
      }
      debug.log("\u2705 Character stored in Supabase:", characterData.name);
      return { success: true };
    } catch (error) {
      debug.error("\u274C Failed to store character in Supabase:", error);
      return { success: false, error: error.message };
    }
  }
  async function syncCharacterColorToSupabase(characterId, color) {
    if (!isSupabaseConfigured()) {
      debug.warn("Supabase not configured - color sync unavailable");
      return {
        success: false,
        error: "Color sync not available. Supabase not configured.",
        supabaseNotConfigured: true
      };
    }
    try {
      debug.log("\u{1F3A8} Syncing character color to Supabase:", characterId, color);
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/rollcloud_characters?dicecloud_character_id=eq.${characterId}`,
        {
          method: "PATCH",
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({
            notification_color: color
          })
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        debug.error("\u274C Failed to sync color to Supabase:", response.status, errorText);
        return { success: false, error: `Sync failed: ${response.status}` };
      }
      debug.log("\u2705 Character color synced to Supabase successfully");
      return { success: true };
    } catch (error) {
      debug.error("\u274C Failed to sync character color to Supabase:", error);
      return { success: false, error: error.message };
    }
  }
  async function checkDiscordCharacterIntegration(characterName, characterId) {
    try {
      debug.log(`\u{1F50D} Checking Discord integration for character: ${characterName} (${characterId})`);
      const webhookResult = await getDiscordWebhookSettings();
      const pairingResult = await browserAPI.storage.local.get(["discordPairingId", "discordPairingCode"]);
      debug.log(`\u{1F50D} Webhook result:`, { hasUrl: !!webhookResult.webhookUrl, enabled: webhookResult.enabled });
      debug.log(`\u{1F50D} Pairing result:`, { hasPairingId: !!pairingResult.discordPairingId, hasCode: !!pairingResult.discordPairingCode });
      const hasWebhookIntegration = webhookResult.webhookUrl && webhookResult.enabled;
      const hasPairingIntegration = pairingResult.discordPairingId || pairingResult.discordPairingCode;
      if (!hasWebhookIntegration && !hasPairingIntegration) {
        debug.log("\u274C Discord integration not configured - no webhook or pairing found");
        return {
          success: true,
          found: false,
          serverName: null,
          message: "Discord integration not configured"
        };
      }
      let serverName = webhookResult.serverName;
      if (hasWebhookIntegration) {
        const webhookUrl = new URL(webhookResult.webhookUrl);
        const botId = webhookUrl.pathname.split("/")[2];
        debug.log(`\u{1F916} Checking with bot ID: ${botId} for character: ${characterName}`);
      } else if (hasPairingIntegration) {
        debug.log(`\u{1F916} Checking with pairing system for character: ${characterName}`);
        serverName = "Discord Server (Paired)";
      }
      const characterData = await getCharacterData();
      const activeCharacterName = characterData?.character_name || characterData?.name;
      if (characterData && activeCharacterName === characterName) {
        debug.log(`\u2705 Character ${characterName} found in local storage and matches Discord integration`);
        return {
          success: true,
          found: true,
          serverName: serverName || "Unknown Server",
          message: `Character ${characterName} is active in Discord server: ${serverName || "Unknown Server"}`,
          characterData: {
            name: activeCharacterName,
            race: characterData.race,
            class: characterData.class,
            level: characterData.level,
            discordServer: serverName
          }
        };
      } else {
        debug.log(`\u274C Character ${characterName} not found in local storage or doesn't match active character`);
        return {
          success: true,
          found: false,
          serverName: null,
          message: `Character ${characterName} is not currently active in Discord`,
          availableCharacter: characterData ? {
            name: activeCharacterName,
            race: characterData.race,
            class: characterData.class,
            level: characterData.level
          } : null
        };
      }
    } catch (error) {
      debug.error("\u274C Error checking Discord character integration:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async function fetchFromDiceCloudAPI(url, token) {
    try {
      debug.log("\u{1F50C} Fetching from DiceCloud API:", url);
      const headers = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch(url, {
        method: "GET",
        headers
      });
      if (!response.ok) {
        const errorText = await response.text();
        debug.error("\u274C DiceCloud API fetch failed:", response.status, errorText);
        return { success: false, error: `API error: ${response.status}` };
      }
      const data = await response.json();
      debug.log("\u2705 DiceCloud API fetch successful");
      return { success: true, data };
    } catch (error) {
      debug.error("\u274C Failed to fetch from DiceCloud API:", error);
      return { success: false, error: error.message };
    }
  }
  function isSupabaseConfigured() {
    return SUPABASE_URL && !SUPABASE_URL.includes("your-project") && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== "your-anon-key";
  }
  var realtimeSocket = null;
  var realtimeHeartbeat = null;
  var currentPairingCode = null;
  function subscribeToRealtimePairing(pairingCode) {
    if (!isSupabaseConfigured()) {
      debug.warn("Cannot subscribe to Realtime - Supabase not configured");
      return;
    }
    currentPairingCode = pairingCode;
    if (realtimeSocket) {
      realtimeSocket.close();
    }
    const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];
    const wsUrl = `wss://${projectRef}.supabase.co/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;
    debug.log("\u{1F50C} Connecting to Supabase Realtime for pairing:", pairingCode);
    try {
      realtimeSocket = new WebSocket(wsUrl);
      realtimeSocket.onopen = () => {
        debug.log("\u2705 Realtime WebSocket connected");
        const joinMessage = {
          topic: `realtime:public:rollcloud_pairings:pairing_code=eq.${pairingCode}`,
          event: "phx_join",
          payload: {
            config: {
              broadcast: { self: false },
              presence: { key: "" },
              postgres_changes: [{
                event: "UPDATE",
                schema: "public",
                table: "rollcloud_pairings",
                filter: `pairing_code=eq.${pairingCode}`
              }]
            }
          },
          ref: "1"
        };
        realtimeSocket.send(JSON.stringify(joinMessage));
        realtimeHeartbeat = setInterval(() => {
          if (realtimeSocket && realtimeSocket.readyState === WebSocket.OPEN) {
            realtimeSocket.send(JSON.stringify({
              topic: "phoenix",
              event: "heartbeat",
              payload: {},
              ref: Date.now().toString()
            }));
          }
        }, 3e4);
      };
      realtimeSocket.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          debug.log("\u{1F4E8} Realtime message:", message.event);
          if (message.event === "postgres_changes" && message.payload?.data?.record) {
            const record = message.payload.data.record;
            if (record.status === "connected" && record.discord_user_id) {
              debug.log("\u{1F389} Pairing completed via Realtime! Discord user:", record.discord_user_id);
              await linkDiscordUserToAuthTokens(
                record.discord_user_id,
                record.discord_username,
                record.discord_global_name
              );
              if (record.webhook_url) {
                debug.log("\u{1F4DD} Saving webhook URL from Realtime:", record.webhook_url.substring(0, 50) + "...");
                await setDiscordWebhookSettings(record.webhook_url, true, record.discord_guild_name);
                await browserAPI.storage.local.set({
                  currentPairingId: record.id,
                  discordPairingId: record.id
                });
                subscribeToCommandRealtime(record.id);
                debug.log("\u2705 Discord webhook and pairing ID saved from Realtime");
              }
              try {
                await browserAPI.runtime.sendMessage({
                  action: "pairingComplete",
                  discordUserId: record.discord_user_id,
                  discordUsername: record.discord_username,
                  discordGlobalName: record.discord_global_name,
                  webhookUrl: record.webhook_url,
                  serverName: record.discord_guild_name,
                  pairingId: record.id
                });
              } catch (e) {
                debug.log("Could not notify popup (probably not open)");
              }
              unsubscribeFromRealtimePairing();
            }
          }
        } catch (e) {
          debug.warn("Error processing Realtime message:", e);
        }
      };
      realtimeSocket.onerror = (error) => {
        debug.warn("Realtime WebSocket error:", error);
      };
      realtimeSocket.onclose = () => {
        debug.log("\u{1F50C} Realtime WebSocket closed");
        if (realtimeHeartbeat) {
          clearInterval(realtimeHeartbeat);
          realtimeHeartbeat = null;
        }
      };
    } catch (error) {
      debug.error("Failed to connect to Realtime:", error);
    }
  }
  function unsubscribeFromRealtimePairing() {
    if (realtimeSocket) {
      realtimeSocket.close();
      realtimeSocket = null;
    }
    if (realtimeHeartbeat) {
      clearInterval(realtimeHeartbeat);
      realtimeHeartbeat = null;
    }
    currentPairingCode = null;
    debug.log("\u{1F50C} Unsubscribed from Realtime pairing updates");
  }
  async function createDiscordPairing(code, diceCloudUsername, diceCloudUserId) {
    if (!isSupabaseConfigured()) {
      debug.warn("Supabase not configured - pairing unavailable");
      return {
        success: false,
        error: "Automatic pairing not available. Please use manual webhook setup.",
        supabaseNotConfigured: true
      };
    }
    try {
      if (diceCloudUserId) {
        try {
          const expireResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/rollcloud_pairings?dicecloud_user_id=eq.${diceCloudUserId}&status=in.(pending,connected)`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                "Prefer": "return=minimal"
              },
              body: JSON.stringify({ status: "expired" })
            }
          );
          if (expireResponse.ok) {
            debug.log("\u{1F9F9} Expired old pairings (pending + connected) for user:", diceCloudUserId);
          }
        } catch (expireError) {
          debug.warn("\u26A0\uFE0F Could not expire old pairings:", expireError.message);
        }
      }
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rollcloud_pairings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Prefer": "return=representation"
        },
        body: JSON.stringify({
          pairing_code: code,
          dicecloud_username: diceCloudUsername,
          dicecloud_user_id: diceCloudUserId,
          // Store the actual DiceCloud user ID (Meteor ID)
          status: "pending"
        })
      });
      if (response.ok) {
        debug.log("\u2705 Discord pairing created:", code, "for DiceCloud user:", diceCloudUserId);
        subscribeToRealtimePairing(code);
        return { success: true, code };
      } else {
        const error = await response.text();
        debug.error("\u274C Failed to create pairing:", error);
        return { success: false, error: "Failed to create pairing code" };
      }
    } catch (error) {
      debug.error("\u274C Supabase error:", error);
      return { success: false, error: error.message };
    }
  }
  async function checkDiscordPairing(code) {
    if (!isSupabaseConfigured()) {
      return { success: false, error: "Supabase not configured", supabaseNotConfigured: true };
    }
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/rollcloud_pairings?pairing_code=eq.${code}&select=*`,
        {
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const pairing = data[0];
          if (pairing.status === "connected" && pairing.webhook_url) {
            debug.log("\u2705 Discord pairing connected!");
            return {
              success: true,
              connected: true,
              webhookUrl: pairing.webhook_url,
              serverName: pairing.discord_guild_name,
              pairingId: pairing.id,
              // Return pairing ID for command polling
              discordUserId: pairing.discord_user_id,
              // Return Discord user ID to link to auth_tokens
              discordUsername: pairing.discord_username,
              discordGlobalName: pairing.discord_global_name
            };
          } else {
            return { success: true, connected: false };
          }
        } else {
          return { success: false, error: "Pairing code not found" };
        }
      } else {
        return { success: false, error: "Failed to check pairing" };
      }
    } catch (error) {
      debug.error("\u274C Supabase check error:", error);
      return { success: false, error: error.message };
    }
  }
  var commandRealtimeSocket = null;
  var commandRealtimeHeartbeat = null;
  var currentPairingId = null;
  var commandRealtimeReconnectTimeout = null;
  async function subscribeToCommandRealtime(pairingId) {
    if (!pairingId) {
      const settings = await browserAPI.storage.local.get(["discordPairingId"]);
      pairingId = settings.discordPairingId;
    }
    if (!pairingId) {
      debug.warn("No pairing ID available for command subscription");
      return;
    }
    if (!isSupabaseConfigured()) {
      debug.warn("Supabase not configured \u2014 cannot subscribe to commands");
      return;
    }
    if (commandRealtimeSocket && commandRealtimeSocket.readyState === WebSocket.OPEN && currentPairingId === pairingId) {
      debug.log("Command realtime already connected for pairing:", pairingId);
      return;
    }
    unsubscribeFromCommandRealtime();
    currentPairingId = pairingId;
    const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];
    const wsUrl = `wss://${projectRef}.supabase.co/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;
    debug.log("\u{1F50C} Connecting to Supabase Realtime for commands, pairing:", pairingId);
    try {
      commandRealtimeSocket = new WebSocket(wsUrl);
      commandRealtimeSocket.onopen = () => {
        debug.log("\u2705 Command Realtime WebSocket connected");
        const topic = `realtime:public:rollcloud_commands`;
        const joinMessage = {
          topic,
          event: "phx_join",
          payload: {
            config: {
              postgres_changes: [{
                event: "INSERT",
                // ✅ Listen for new commands being inserted
                schema: "public",
                table: "rollcloud_commands",
                // ✅ Correct table
                filter: `pairing_id=eq.${pairingId}`
                // ✅ Only this pairing's commands
              }]
            }
          },
          ref: "cmd_1"
        };
        debug.log("\u{1F4E4} Subscribing to postgres_changes:", JSON.stringify(joinMessage, null, 2));
        commandRealtimeSocket.send(JSON.stringify(joinMessage));
        commandRealtimeHeartbeat = setInterval(() => {
          if (commandRealtimeSocket && commandRealtimeSocket.readyState === WebSocket.OPEN) {
            commandRealtimeSocket.send(JSON.stringify({
              topic: "phoenix",
              event: "heartbeat",
              payload: {},
              ref: "cmd_hb_" + Date.now()
            }));
          }
        }, 3e4);
        drainPendingCommands();
      };
      commandRealtimeSocket.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          debug.log("\u{1F4E8} RAW Realtime message:", JSON.stringify(message).substring(0, 500));
          if (message.event === "phx_reply") {
            if (message.payload?.status === "ok") {
              debug.log("\u2705 Realtime subscription confirmed for topic:", message.topic || "unknown");
            } else {
              debug.error("\u274C Realtime subscription FAILED:", message.payload?.response || message.payload);
            }
            return;
          }
          if (message.event === "system" && message.payload?.status === "ok") {
            debug.log("\u2705 Realtime system ready:", message.payload?.message || "connected");
            return;
          }
          if (message.event === "postgres_changes") {
            const payload = message.payload;
            debug.log("\u{1F4E5} postgres_changes event received:", payload?.data?.type || "unknown type");
            if (payload?.data?.type === "INSERT" && payload.data.record) {
              const record = payload.data.record;
              debug.log("\u{1F4E5} New command inserted! Type:", record.command_type, "ID:", record.id);
              if (record.status === "pending") {
                debug.log("\u26A1 Executing command:", record.command_type);
                await executeCommand(record);
              } else {
                debug.log("\u23ED\uFE0F Skipping command with status:", record.status);
              }
            }
            return;
          }
          if (message.event === "broadcast") {
            const record = message.payload?.record ?? message.payload?.new ?? message.payload;
            debug.log("\u{1F4E5} Broadcast received! Record:", JSON.stringify(record).substring(0, 300));
            if (record && record.status === "pending") {
              debug.log("\u{1F4E5} Realtime command received via broadcast:", record.command_type, record.id);
              await executeCommand(record);
            }
          }
        } catch (e) {
          debug.warn("Error processing command Realtime message:", e);
        }
      };
      commandRealtimeSocket.onerror = (error) => {
        debug.warn("Command Realtime WebSocket error:", error);
      };
      commandRealtimeSocket.onclose = () => {
        debug.log("\u{1F50C} Command Realtime WebSocket closed");
        if (commandRealtimeHeartbeat) {
          clearInterval(commandRealtimeHeartbeat);
          commandRealtimeHeartbeat = null;
        }
        if (currentPairingId) {
          debug.log("\u23F3 Scheduling command realtime reconnect in 5s...");
          commandRealtimeReconnectTimeout = setTimeout(() => {
            if (currentPairingId) {
              subscribeToCommandRealtime(currentPairingId);
            }
          }, 5e3);
        }
      };
    } catch (error) {
      debug.error("Failed to connect to command Realtime:", error);
    }
  }
  function unsubscribeFromCommandRealtime() {
    if (commandRealtimeReconnectTimeout) {
      clearTimeout(commandRealtimeReconnectTimeout);
      commandRealtimeReconnectTimeout = null;
    }
    if (commandRealtimeSocket) {
      commandRealtimeSocket.close();
      commandRealtimeSocket = null;
    }
    if (commandRealtimeHeartbeat) {
      clearInterval(commandRealtimeHeartbeat);
      commandRealtimeHeartbeat = null;
    }
    debug.log("\u{1F507} Unsubscribed from command Realtime");
  }
  async function drainPendingCommands() {
    if (!isSupabaseConfigured() || !currentPairingId)
      return;
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/rollcloud_commands?pairing_id=eq.${currentPairingId}&status=eq.pending&order=created_at.asc&limit=10`,
        {
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );
      if (!response.ok) {
        debug.warn("Failed to drain pending commands:", response.status);
        return;
      }
      const commands = await response.json();
      if (commands.length > 0) {
        debug.log(`\u{1F4E5} Draining ${commands.length} pending command(s)`);
        for (const command of commands) {
          await executeCommand(command);
        }
      }
    } catch (error) {
      debug.error("Drain pending commands error:", error);
    }
  }
  async function executeCommand(command) {
    debug.log("\u26A1 Executing command:", command.command_type, command);
    try {
      await updateCommandStatus(command.id, "processing");
      let result;
      switch (command.command_type) {
        case "roll":
          result = await executeRollCommand(command);
          break;
        case "use_action":
          result = await executeUseActionCommand(command, "action");
          break;
        case "use_bonus":
          result = await executeUseActionCommand(command, "bonus");
          break;
        case "end_turn":
          result = await executeEndTurnCommand(command);
          break;
        case "use_ability":
          result = await executeUseAbilityCommand(command);
          break;
        case "cast":
          result = await executeCastCommand(command);
          break;
        default:
          result = { success: false, error: `Unknown command type: ${command.command_type}` };
      }
      await updateCommandStatus(
        command.id,
        result.success ? "completed" : "failed",
        result
      );
      debug.log("\u2705 Command executed:", command.command_type, result);
    } catch (error) {
      debug.error("\u274C Command execution failed:", error);
      await updateCommandStatus(command.id, "failed", null, error.message);
    }
  }
  async function executeRollCommand(command) {
    const { action_name, command_data } = command;
    const rollString = command_data.roll_string || `/roll 1d20`;
    const rollName = action_name || command_data.roll_name || "Discord Roll";
    const rollData = {
      formula: rollString,
      name: rollName,
      source: "discord",
      characterName: command_data.character_name,
      characterId: command_data.character_id,
      checkType: command_data.check_type,
      advantage: command_data.advantage,
      disadvantage: command_data.disadvantage,
      count: command_data.count,
      sides: command_data.sides,
      modifier: command_data.modifier
    };
    const result = await sendRollToAllRoll20Tabs(rollData);
    if (!result || !result.success) {
      const errorMsg = result?.error || "Failed to send roll to Roll20";
      debug.error("\u274C Roll command failed:", errorMsg);
      return { success: false, message: errorMsg };
    }
    return { success: true, message: `Rolled ${rollName}` };
  }
  async function executeUseActionCommand(command, actionType) {
    const { action_name, command_data } = command;
    const tabs = await browserAPI.tabs.query({ url: "*://app.roll20.net/*" });
    for (const tab of tabs) {
      try {
        await browserAPI.tabs.sendMessage(tab.id, {
          action: "useActionFromDiscord",
          actionType,
          actionName: action_name,
          commandData: command_data
        });
      } catch (err) {
        debug.warn(`Failed to send action to tab ${tab.id}:`, err);
      }
    }
    return { success: true, message: `Used ${actionType}: ${action_name}` };
  }
  async function executeEndTurnCommand(command) {
    const tabs = await browserAPI.tabs.query({ url: "*://app.roll20.net/*" });
    for (const tab of tabs) {
      try {
        await browserAPI.tabs.sendMessage(tab.id, {
          action: "endTurnFromDiscord"
        });
      } catch (err) {
        debug.warn(`Failed to send end turn to tab ${tab.id}:`, err);
      }
    }
    return { success: true, message: "Turn ended" };
  }
  async function executeUseAbilityCommand(command) {
    const { action_name, command_data } = command;
    const tabs = await browserAPI.tabs.query({ url: "*://app.roll20.net/*" });
    for (const tab of tabs) {
      try {
        await browserAPI.tabs.sendMessage(tab.id, {
          action: "useAbilityFromDiscord",
          abilityName: action_name,
          abilityData: command_data
        });
      } catch (err) {
        debug.warn(`Failed to send ability use to tab ${tab.id}:`, err);
      }
    }
    return { success: true, message: `Used ability: ${action_name}` };
  }
  async function executeCastCommand(command) {
    const { action_name, command_data } = command;
    const tabs = await browserAPI.tabs.query({ url: "*://app.roll20.net/*" });
    for (const tab of tabs) {
      try {
        await browserAPI.tabs.sendMessage(tab.id, {
          action: "castSpellFromDiscord",
          spellName: action_name,
          spellData: command_data
        });
      } catch (err) {
        debug.warn(`Failed to send cast to tab ${tab.id}:`, err);
      }
    }
    return { success: true, message: `Cast spell: ${action_name}` };
  }
  async function updateCommandStatus(commandId, status, result = null, errorMessage = null) {
    if (!isSupabaseConfigured())
      return;
    try {
      const update = {
        status,
        processed_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (result) {
        update.result = result;
      }
      if (errorMessage) {
        update.error_message = errorMessage;
      }
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/rollcloud_commands?id=eq.${commandId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify(update)
        }
      );
      if (!response.ok) {
        debug.warn("Failed to update command status:", response.status);
      }
    } catch (error) {
      debug.error("Error updating command status:", error);
    }
  }
  (async () => {
    try {
      const settings = await browserAPI.storage.local.get(["discordWebhookEnabled", "discordPairingId"]);
      debug.log("\u{1F504} Auto-start check - webhookEnabled:", settings.discordWebhookEnabled, "pairingId:", settings.discordPairingId ? "set" : "not set");
      if (settings.discordWebhookEnabled && settings.discordPairingId) {
        debug.log("Auto-starting command realtime subscription...");
        await subscribeToCommandRealtime(settings.discordPairingId);
      } else {
        debug.log("\u23ED\uFE0F Skipping auto-start - webhook not enabled or no pairing ID");
      }
    } catch (error) {
      debug.warn("Failed to auto-start command realtime:", error);
    }
  })();
  var installerPort = null;
  async function connectToInstaller() {
    try {
      if (installerPort) {
        return installerPort;
      }
      installerPort = browserAPI.runtime.connectNative("com.rollcloud.installer");
      installerPort.onMessage.addListener((message) => {
        debug.log("Received message from installer:", message);
        handleInstallerMessage(message);
      });
      installerPort.onDisconnect.addListener(() => {
        debug.log("Disconnected from installer");
        installerPort = null;
      });
      installerPort.postMessage({ type: "ping" });
      debug.log("\u2705 Connected to installer via native messaging");
      return installerPort;
    } catch (error) {
      debug.warn("Failed to connect to installer:", error);
      return null;
    }
  }
  function handleInstallerMessage(message) {
    switch (message.type) {
      case "pong":
        debug.log("\u2705 Installer is available, requesting pairing code...");
        if (installerPort) {
          installerPort.postMessage({ type: "getPairingCode" });
        }
        break;
      case "pairingCode":
        if (message.code) {
          debug.log("\u{1F4E5} Received pairing code from installer:", message.code);
          handleInstallerPairingCode(message.code, message.username);
        } else {
          debug.log("No pairing code available from installer (code is null)");
        }
        break;
      default:
        debug.warn("Unknown message type from installer:", message.type);
    }
  }
  async function handleInstallerPairingCode(code, installerUsername = null) {
    try {
      await browserAPI.storage.local.set({
        installerPairingCode: code,
        pairingSource: "installer"
      });
      let diceCloudUsername = installerUsername;
      if (!diceCloudUsername) {
        const loginStatus = await checkLoginStatus();
        diceCloudUsername = loginStatus.username || "DiceCloud User";
      }
      debug.log("\u{1F4E4} Creating Discord pairing with code:", code, "username:", diceCloudUsername);
      const result = await createDiscordPairing(code, diceCloudUsername);
      if (result.success) {
        debug.log("\u2705 Pairing created from installer code");
        broadcastToPopup({
          action: "installerPairingStarted",
          code
        });
      } else {
        debug.error("Failed to create pairing from installer code:", result.error);
      }
    } catch (error) {
      debug.error("Error handling installer pairing code:", error);
    }
  }
  async function broadcastToPopup(message) {
    try {
      await browserAPI.runtime.sendMessage(message);
    } catch (error) {
      debug.log("Popup not available for broadcast");
    }
  }
  (async () => {
    setTimeout(async () => {
      await connectToInstaller();
    }, 2e3);
  })();
})();
//# sourceMappingURL=background.js.map
