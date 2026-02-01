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

  // src/background-chrome.js
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
  debug.log("OwlCloud: Background script starting...");
  var browserAPI = typeof browser !== "undefined" && browser.runtime ? browser : chrome;
  var storage = {
    async get(keys) {
      return new Promise((resolve, reject) => {
        try {
          const result = browserAPI.storage.local.get(keys, (items) => {
            if (browserAPI.runtime.lastError) {
              reject(new Error(browserAPI.runtime.lastError.message));
            } else {
              resolve(items);
            }
          });
          if (result && typeof result.then === "function") {
            result.then(resolve).catch(reject);
          }
        } catch (error) {
          reject(error);
        }
      });
    },
    async set(items) {
      return new Promise((resolve, reject) => {
        try {
          const result = browserAPI.storage.local.set(items, () => {
            if (browserAPI.runtime.lastError) {
              reject(new Error(browserAPI.runtime.lastError.message));
            } else {
              resolve();
            }
          });
          if (result && typeof result.then === "function") {
            result.then(resolve).catch(reject);
          }
        } catch (error) {
          reject(error);
        }
      });
    },
    async remove(keys) {
      return new Promise((resolve, reject) => {
        try {
          const result = browserAPI.storage.local.remove(keys, () => {
            if (browserAPI.runtime.lastError) {
              reject(new Error(browserAPI.runtime.lastError.message));
            } else {
              resolve();
            }
          });
          if (result && typeof result.then === "function") {
            result.then(resolve).catch(reject);
          }
        } catch (error) {
          reject(error);
        }
      });
    }
  };
  if (browserAPI && browserAPI.storage && browserAPI.storage.onChanged) {
    browserAPI.storage.onChanged.addListener((changes, area) => {
      if (area !== "local")
        return;
      if (changes.diceCloudToken) {
        const oldVal = changes.diceCloudToken.oldValue;
        const newVal = changes.diceCloudToken.newValue;
        debug.log("\u{1F501} Storage change: diceCloudToken updated", { hasOld: !!oldVal, hasNew: !!newVal });
      }
      if (changes.explicitlyLoggedOut) {
        debug.log("\u{1F512} Storage change: explicitlyLoggedOut set/cleared", { old: changes.explicitlyLoggedOut.oldValue, new: changes.explicitlyLoggedOut.newValue });
      }
    });
    debug.log("\u{1F6F0}\uFE0F Storage change listener registered for debug");
  }
  (async () => {
    try {
      const startupStorage = await storage.get(["diceCloudToken", "diceCloudUserId", "tokenExpires", "username", "explicitlyLoggedOut"]);
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
            await storage.remove("tokenExpires");
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
  var isFirefox = typeof browser !== "undefined";
  debug.log("OwlCloud: Background script initialized on", isFirefox ? "Firefox" : "Chrome");
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
  var REALTIME_KEEPALIVE_ALARM = "realtimeKeepAlive";
  if (browserAPI.alarms) {
    browserAPI.alarms.onAlarm.addListener(async (alarm) => {
      if (alarm.name === REALTIME_KEEPALIVE_ALARM) {
        debug.log("\u23F0 Realtime keep-alive alarm triggered");
        const settings = await browserAPI.storage.local.get(["discordWebhookEnabled", "discordPairingId", "discordWebhookUrl"]);
        const hasWebhookIntegration = settings.discordWebhookEnabled && settings.discordWebhookUrl;
        const hasPairingIntegration = settings.discordPairingId;
        if (!hasWebhookIntegration && !hasPairingIntegration) {
          debug.log("\u23ED\uFE0F No active Discord connection, skipping realtime check");
          return;
        }
        if (!commandRealtimeSocket || commandRealtimeSocket.readyState !== WebSocket.OPEN) {
          debug.log("\u{1F504} WebSocket disconnected, reconnecting...");
          await subscribeToCommandRealtime(settings.discordPairingId);
        } else {
          debug.log("\u2705 WebSocket still connected");
        }
        drainPendingCommands();
      }
    });
    debug.log("\u{1F6F0}\uFE0F Realtime keep-alive alarm listener registered");
    browserAPI.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === "keepAlive") {
        debug.log("\u{1F493} Keep-alive alarm triggered");
      }
    });
  }
  function startRealtimeKeepAlive() {
    if (browserAPI.alarms) {
      browserAPI.alarms.create(REALTIME_KEEPALIVE_ALARM, { periodInMinutes: 1 });
      debug.log("\u23F0 Started realtime keep-alive alarm");
    }
  }
  function stopRealtimeKeepAlive() {
    if (browserAPI.alarms) {
      browserAPI.alarms.clear(REALTIME_KEEPALIVE_ALARM);
      debug.log("\u23F0 Stopped realtime keep-alive alarm");
    }
  }
  var keepAliveInterval = null;
  function keepServiceWorkerAlive(durationMs = 3e4) {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
    }
    debug.log("\u{1F493} Keeping service worker alive for", durationMs, "ms");
    if (chrome.alarms) {
      chrome.alarms.create("keepAlive", { delayInMinutes: durationMs / 6e4 });
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
          case "getActiveCharacter": {
            const character = await getActiveCharacter();
            response = { success: true, character };
            break;
          }
          case "clearCharacterData":
            await clearCharacterData(request.characterId);
            response = { success: true };
            break;
          case "deleteCharacterFromCloud":
            await deleteCharacterFromCloud(request.characterId);
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
                    `${SUPABASE_URL}/rest/v1/clouds_pairings?id=eq.${stored.discordPairingId}&select=discord_user_id,discord_username,discord_global_name`,
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
            let webhookUrlToTest = request.webhookUrl;
            if (!webhookUrlToTest) {
              const settings = await getDiscordWebhookSettings();
              webhookUrlToTest = settings.webhookUrl;
            }
            const testResult = await testDiscordWebhook(webhookUrlToTest);
            response = testResult;
            break;
          }
          case "getUserCharacters": {
            const characters = await getUserCharactersFromCloud(request.pairingId);
            response = { success: true, characters };
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
  async function clearExistingAuthData() {
    debug.log("\u{1F9F9} Clearing existing auth and character data for new login...");
    try {
      await new Promise((resolve, reject) => {
        const keysToRemove = [
          "diceCloudToken",
          "diceCloudUserId",
          "tokenExpires",
          "username",
          "characterProfiles",
          "activeCharacterId",
          "characterData",
          "explicitlyLoggedOut"
        ];
        try {
          const result = browserAPI.storage.local.remove(keysToRemove);
          if (result && typeof result.then === "function") {
            result.then(resolve).catch(reject);
          } else {
            browserAPI.runtime.lastError ? reject(new Error(browserAPI.runtime.lastError.message)) : resolve();
          }
        } catch (error) {
          reject(error);
        }
      });
      debug.log("\u2705 Existing auth data cleared successfully");
    } catch (error) {
      debug.error("\u274C Failed to clear existing auth data:", error);
    }
  }
  async function loginToDiceCloud(username, password) {
    try {
      keepServiceWorkerAlive(6e4);
      await clearExistingAuthData();
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
      await new Promise((resolve, reject) => {
        const storageData = {
          diceCloudToken: data.token,
          diceCloudUserId: data.id,
          tokenExpires: data.tokenExpires,
          username
        };
        debug.log("\u{1F4DD} Storing auth data:", {
          hasToken: !!data.token,
          userId: data.id,
          username
        });
        try {
          const result = browserAPI.storage.local.set(storageData);
          if (result && typeof result.then === "function") {
            result.then(resolve).catch(reject);
          } else {
            browserAPI.runtime.lastError ? reject(new Error(browserAPI.runtime.lastError.message)) : resolve();
          }
        } catch (error) {
          reject(error);
        }
      });
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
      await clearExistingAuthData();
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
      await new Promise((resolve, reject) => {
        debug.log("\u{1F4DD} setApiToken: Storing token data");
        try {
          const result = browserAPI.storage.local.set(storageData);
          if (result && typeof result.then === "function") {
            result.then(resolve).catch(reject);
          } else {
            browserAPI.runtime.lastError ? reject(new Error(browserAPI.runtime.lastError.message)) : resolve();
          }
        } catch (error) {
          reject(error);
        }
      });
      const verification = await new Promise((resolve, reject) => {
        try {
          const result = browserAPI.storage.local.get(["diceCloudToken", "diceCloudUserId", "tokenExpires", "username"]);
          if (result && typeof result.then === "function") {
            result.then(resolve).catch(reject);
          } else {
            browserAPI.runtime.lastError ? reject(new Error(browserAPI.runtime.lastError.message)) : resolve(result);
          }
        } catch (error) {
          reject(error);
        }
      });
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
      const currentState = await new Promise((resolve, reject) => {
        try {
          const result = browserAPI.storage.local.get(["diceCloudToken", "diceCloudUserId", "tokenExpires", "username", "explicitlyLoggedOut"]);
          if (result && typeof result.then === "function") {
            result.then(resolve).catch(reject);
          } else {
            browserAPI.runtime.lastError ? reject(new Error(browserAPI.runtime.lastError.message)) : resolve(result);
          }
        } catch (error) {
          reject(error);
        }
      });
      debug.log("\u{1F50D} Current storage before logout:", {
        hasToken: !!currentState.diceCloudToken,
        tokenLength: currentState.diceCloudToken ? currentState.diceCloudToken.length : 0,
        username: currentState.username,
        diceCloudUserId: currentState.diceCloudUserId,
        tokenExpires: currentState.tokenExpires,
        explicitlyLoggedOut: currentState.explicitlyLoggedOut
      });
      await new Promise((resolve, reject) => {
        debug.log("\u{1F4DD} logout: Setting explicitlyLoggedOut flag");
        try {
          const result = browserAPI.storage.local.set({ explicitlyLoggedOut: true });
          if (result && typeof result.then === "function") {
            result.then(resolve).catch(reject);
          } else {
            browserAPI.runtime.lastError ? reject(new Error(browserAPI.runtime.lastError.message)) : resolve();
          }
        } catch (error) {
          reject(error);
        }
      });
      await new Promise((resolve, reject) => {
        debug.log("\u{1F5D1}\uFE0F logout: Removing auth tokens");
        try {
          const result = browserAPI.storage.local.remove(["diceCloudToken", "diceCloudUserId", "tokenExpires", "username"]);
          if (result && typeof result.then === "function") {
            result.then(resolve).catch(reject);
          } else {
            browserAPI.runtime.lastError ? reject(new Error(browserAPI.runtime.lastError.message)) : resolve();
          }
        } catch (error) {
          reject(error);
        }
      });
      try {
        if (typeof SupabaseTokenManager !== "undefined") {
          debug.log("\u{1F5D1}\uFE0F logout: Removing auth token from Supabase database");
          const tokenManager = new SupabaseTokenManager();
          await tokenManager.deleteToken();
          debug.log("\u2705 logout: Token removed from Supabase");
        }
      } catch (dbError) {
        debug.warn("\u26A0\uFE0F logout: Failed to delete token from Supabase (non-fatal):", dbError.message);
      }
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
      if (!characterData.ownerUserId) {
        try {
          const stored = await browserAPI.storage.local.get(["diceCloudUserId"]);
          if (stored.diceCloudUserId) {
            characterData.ownerUserId = stored.diceCloudUserId;
          }
        } catch (e) {
          debug.warn("Could not retrieve DiceCloud user ID for ownership tagging:", e);
        }
      }
      const storageId = slotId || characterData.id || characterData._id || "default";
      try {
        const extractArmor = (obj) => {
          if (!obj || typeof obj !== "object")
            return null;
          if (typeof obj.armorClass === "number")
            return obj.armorClass;
          if (typeof obj.armor_class === "number")
            return obj.armor_class;
          if (obj.ac && typeof obj.ac === "object") {
            if (typeof obj.ac.base === "number")
              return obj.ac.base;
            if (typeof obj.ac.total === "number")
              return obj.ac.total;
          }
          if (obj.defenses && typeof obj.defenses === "object") {
            if (typeof obj.defenses.armor_class === "number")
              return obj.defenses.armor_class;
            if (typeof obj.defenses.armorClass === "number")
              return obj.defenses.armorClass;
          }
          return null;
        };
        let candidate = null;
        if (characterData && characterData.raw_dicecloud_data)
          candidate = characterData.raw_dicecloud_data;
        else if (characterData && characterData._fullData && characterData._fullData.raw_dicecloud_data)
          candidate = characterData._fullData.raw_dicecloud_data;
        else if (characterData && characterData._fullData)
          candidate = characterData._fullData;
        const seenLocal = /* @__PURE__ */ new Set();
        while (candidate && typeof candidate === "object" && candidate.raw_dicecloud_data && !seenLocal.has(candidate)) {
          seenLocal.add(candidate);
          candidate = candidate.raw_dicecloud_data;
        }
        const acFromRaw = extractArmor(candidate);
        if (typeof acFromRaw === "number") {
          characterData.armorClass = acFromRaw;
        } else if (!characterData.armorClass && characterData.ac && typeof characterData.ac === "number") {
          characterData.armorClass = characterData.ac;
        }
      } catch (e) {
        debug.warn("\u26A0\uFE0F Failed to derive armorClass for local save:", e && e.message ? e.message : e);
      }
      const result = await browserAPI.storage.local.get(["characterProfiles", "activeCharacterId"]);
      const characterProfiles = result.characterProfiles || {};
      const characterId = characterData.id || characterData._id;
      if (characterId) {
        for (const [existingSlotId, existingProfile2] of Object.entries(characterProfiles)) {
          if (existingSlotId === storageId)
            continue;
          const existingId = existingProfile2.id || existingProfile2._id;
          if (existingId === characterId) {
            debug.log(`\u{1F504} Deduplicating character: "${characterData.name}" found in ${existingSlotId}, removing before saving to ${storageId}`);
            delete characterProfiles[existingSlotId];
            break;
          }
        }
      }
      const existingProfile = characterProfiles[storageId];
      if (existingProfile && existingProfile.notificationColor) {
        if (!characterData.notificationColor || characterData.notificationColor === "#3498db") {
          debug.log(`\u{1F3A8} Preserving existing notification color: ${existingProfile.notificationColor}`);
          characterData.notificationColor = existingProfile.notificationColor;
        }
      }
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
      const extractFullData = (characterData) => {
        if (!characterData)
          return null;
        if (characterData.source === "database" && characterData._fullData) {
          const fullData = characterData._fullData.raw_dicecloud_data;
          if (fullData && typeof fullData === "object") {
            debug.log("\u{1F4E6} Extracting full character data from database raw_dicecloud_data");
            return {
              ...fullData,
              source: "database",
              lastUpdated: characterData.lastUpdated || characterData._fullData.updated_at,
              notificationColor: characterData._fullData.notification_color || fullData.notificationColor
            };
          } else {
            debug.warn("\u26A0\uFE0F Database profile missing raw_dicecloud_data, using summary only");
          }
        }
        return characterData;
      };
      if (characterId) {
        const characterData = characterProfiles[characterId] || null;
        return extractFullData(characterData);
      }
      const activeCharacterId = result.activeCharacterId;
      debug.log(`\u{1F3AF} Getting active character: activeCharacterId="${activeCharacterId}"`);
      debug.log(`\u{1F3AF} Available characters:`, Object.keys(characterProfiles));
      if (activeCharacterId && characterProfiles[activeCharacterId]) {
        const activeChar = characterProfiles[activeCharacterId];
        debug.log("\u2705 Retrieved active character data:", {
          id: activeCharacterId,
          name: activeChar.name || activeChar.character_name,
          class: activeChar.class,
          level: activeChar.level
        });
        return extractFullData(activeChar);
      }
      if (activeCharacterId) {
        debug.log(`\u{1F50D} Active character not found by key, searching by ID: ${activeCharacterId}`);
        for (const [key, profile] of Object.entries(characterProfiles)) {
          if (profile.source !== "database") {
            const charId = profile.id || profile._id || profile.dicecloud_character_id || profile.characterId;
            if (charId === activeCharacterId) {
              debug.log(`\u2705 Found matching local profile by ID: ${key}`);
              return extractFullData(profile);
            }
          }
        }
        for (const [key, profile] of Object.entries(characterProfiles)) {
          if (profile.source === "database") {
            const charId = profile.id || profile._id || profile.dicecloud_character_id || profile.characterId;
            if (charId === activeCharacterId) {
              debug.log(`\u2705 Found matching database profile by ID: ${key}`);
              return extractFullData(profile);
            }
          }
        }
        debug.warn(`\u26A0\uFE0F No profile found matching activeCharacterId: ${activeCharacterId}`);
      }
      const characterIds = Object.keys(characterProfiles);
      if (characterIds.length > 0) {
        const localProfile = characterIds.find((key) => {
          const profile = characterProfiles[key];
          return !profile.source || profile.source !== "database";
        });
        if (localProfile) {
          debug.log("No active character found, returning first local profile:", characterProfiles[localProfile]);
          return extractFullData(characterProfiles[localProfile]);
        }
        debug.log("No active character, returning first available:", characterProfiles[characterIds[0]]);
        return extractFullData(characterProfiles[characterIds[0]]);
      }
      return null;
    } catch (error) {
      debug.error("Failed to retrieve character data:", error);
      throw error;
    }
  }
  async function getAllCharacterProfiles() {
    try {
      let getCharId = function(profile) {
        return profile.id || profile._id || profile.dicecloud_character_id || profile.characterId || null;
      }, getFingerprint = function(profile) {
        const name = (profile.name || profile.character_name || "").trim().toLowerCase();
        const cls = (profile.class || "").trim().toLowerCase();
        const level = String(profile.level || "");
        return name ? `${name}|${cls}|${level}` : null;
      }, isDuplicate = function(profile, key) {
        const charId = getCharId(profile);
        if (charId && seenCharacterIds.has(charId)) {
          debug.log(`\u{1F504} Skipping duplicate "${profile.name || profile.character_name}" (key: ${key}), same char ID as: ${seenCharacterIds.get(charId)}`);
          return true;
        }
        const fp = getFingerprint(profile);
        if (fp && seenFingerprints.has(fp)) {
          debug.log(`\u{1F504} Skipping duplicate "${profile.name || profile.character_name}" (key: ${key}), same fingerprint as: ${seenFingerprints.get(fp)}`);
          return true;
        }
        return false;
      }, markSeen = function(profile, key) {
        const charId = getCharId(profile);
        if (charId)
          seenCharacterIds.set(charId, key);
        const fp = getFingerprint(profile);
        if (fp)
          seenFingerprints.set(fp, key);
      };
      const localResult = await browserAPI.storage.local.get(["characterProfiles"]);
      const localProfiles = localResult.characterProfiles || {};
      for (const id of Object.keys(localProfiles)) {
        const profile = localProfiles[id];
        if (profile.character_name && !profile.name) {
          profile.name = profile.character_name;
        }
      }
      let databaseCharacters = {};
      let currentDicecloudUserId = null;
      try {
        if (typeof SupabaseTokenManager !== "undefined") {
          const supabase2 = new SupabaseTokenManager();
          try {
            const stored = await browserAPI.storage.local.get(["diceCloudToken", "diceCloudUserId", "tokenExpires"]);
            if (stored.diceCloudToken && stored.diceCloudUserId) {
              let useStored = true;
              if (stored.tokenExpires) {
                const expiry = new Date(stored.tokenExpires);
                if (isNaN(expiry.getTime()) || expiry <= /* @__PURE__ */ new Date()) {
                  useStored = false;
                }
              }
              if (useStored) {
                currentDicecloudUserId = stored.diceCloudUserId;
                debug.log("\u{1F310} Using cached DiceCloud user from storage:", currentDicecloudUserId);
              } else {
                debug.log("\u{1F501} Cached token expired or invalid, falling back to Supabase lookup");
              }
            }
          } catch (e) {
            debug.warn("\u26A0\uFE0F Error reading stored token:", e);
          }
          if (!currentDicecloudUserId) {
            const tokenResult = await supabase2.retrieveToken();
            if (tokenResult.success && tokenResult.userId) {
              currentDicecloudUserId = tokenResult.userId;
              debug.log("\u{1F310} Fetching database characters for DiceCloud user:", currentDicecloudUserId);
            }
          }
          if (currentDicecloudUserId) {
            const response = await fetch(
              `${supabase2.supabaseUrl}/rest/v1/clouds_characters?user_id_dicecloud=eq.${currentDicecloudUserId}&select=*`,
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
      if (!currentDicecloudUserId) {
        try {
          const stored = await browserAPI.storage.local.get(["diceCloudUserId"]);
          currentDicecloudUserId = stored.diceCloudUserId || null;
        } catch (e) {
        }
      }
      if (currentDicecloudUserId) {
        for (const key of Object.keys(localProfiles)) {
          const profile = localProfiles[key];
          const profileOwner = profile.ownerUserId || profile.dicecloudUserId || profile.userId || profile.user_id_dicecloud || null;
          if (profileOwner && profileOwner !== currentDicecloudUserId) {
            debug.log(`\u{1F6AB} Filtering out character "${profile.name || profile.character_name}" (belongs to ${profileOwner}, current user is ${currentDicecloudUserId})`);
            delete localProfiles[key];
          }
        }
      }
      const seenCharacterIds = /* @__PURE__ */ new Map();
      const seenFingerprints = /* @__PURE__ */ new Map();
      const mergedProfiles = {};
      const dbCharactersByCharId = /* @__PURE__ */ new Map();
      const dbCharactersByFingerprint = /* @__PURE__ */ new Map();
      for (const [key, profile] of Object.entries(databaseCharacters)) {
        const charId = getCharId(profile);
        const fp = getFingerprint(profile);
        if (charId)
          dbCharactersByCharId.set(charId, { key, profile });
        if (fp)
          dbCharactersByFingerprint.set(fp, { key, profile });
      }
      for (const [key, profile] of Object.entries(localProfiles)) {
        const fp = getFingerprint(profile);
        const charId = getCharId(profile);
        const existingById = charId ? seenCharacterIds.get(charId) : null;
        const existingByFp = fp ? seenFingerprints.get(fp) : null;
        const dbMatch = charId && dbCharactersByCharId.get(charId) || fp && dbCharactersByFingerprint.get(fp);
        if (dbMatch) {
          profile.source = "database";
          profile.hasCloudVersion = true;
          profile.cloudSlotId = dbMatch.key;
          debug.log(`\u2601\uFE0F Local profile "${profile.name || profile.character_name}" has cloud version, marking as database source`);
          if (dbMatch.profile.notificationColor || dbMatch.profile.notification_color) {
            const dbColor = dbMatch.profile.notificationColor || dbMatch.profile.notification_color;
            if (profile.notificationColor !== dbColor) {
              debug.log(`\u{1F3A8} Updating local profile color from database: ${profile.notificationColor} -> ${dbColor}`);
              profile.notificationColor = dbColor;
            }
          }
        }
        if (existingById) {
          if (key.startsWith("slot-") && existingById.startsWith("db-")) {
            delete mergedProfiles[existingById];
            markSeen(profile, key);
            mergedProfiles[key] = profile;
          } else {
            debug.log(`\u{1F504} Skipping duplicate "${profile.name || profile.character_name}" (key: ${key}), same char ID as: ${existingById}`);
          }
          continue;
        }
        if (existingByFp) {
          if (key.startsWith("slot-") && !existingByFp.startsWith("slot-")) {
            delete mergedProfiles[existingByFp];
            markSeen(profile, key);
            mergedProfiles[key] = profile;
          } else {
            debug.log(`\u{1F504} Skipping duplicate "${profile.name || profile.character_name}" (key: ${key}), same fingerprint as: ${existingByFp}`);
          }
          continue;
        }
        markSeen(profile, key);
        mergedProfiles[key] = profile;
      }
      for (const [key, profile] of Object.entries(databaseCharacters)) {
        if (!isDuplicate(profile, key)) {
          markSeen(profile, key);
          mergedProfiles[key] = profile;
        } else {
          debug.log(`\u{1F512} Skipping database character ${key} because a local version exists (but marked with cloud source)`);
        }
      }
      debug.log("\u{1F4CB} Character profiles loaded:", {
        local: Object.keys(localProfiles).length,
        database: Object.keys(databaseCharacters).length,
        deduplicated: Object.keys(mergedProfiles).length
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
      let userFilter = "";
      try {
        try {
          const stored = await browserAPI.storage.local.get(["diceCloudUserId", "diceCloudToken", "tokenExpires"]);
          if (stored.diceCloudUserId && stored.diceCloudToken) {
            let useStored = true;
            if (stored.tokenExpires) {
              const expiry = new Date(stored.tokenExpires);
              if (isNaN(expiry.getTime()) || expiry <= /* @__PURE__ */ new Date()) {
                useStored = false;
              }
            }
            if (useStored) {
              userFilter = `&user_id_dicecloud=eq.${stored.diceCloudUserId}`;
              debug.log("\u{1F310} Using cached DiceCloud user for DB query:", stored.diceCloudUserId);
            }
          }
        } catch (e) {
          debug.warn("\u26A0\uFE0F Error reading stored user for DB query:", e);
        }
        if (!userFilter) {
          const tokenResult = await supabase2.retrieveToken();
          if (tokenResult.success && tokenResult.userId) {
            userFilter = `&user_id_dicecloud=eq.${tokenResult.userId}`;
          }
        }
      } catch (e) {
        debug.warn("Could not get user ID for database character query:", e);
      }
      const tryQuery = async (field, value) => {
        const url = `${supabase2.supabaseUrl}/rest/v1/clouds_characters?${field}=eq.${encodeURIComponent(value)}${userFilter}&select=*&order=updated_at.desc&limit=1`;
        const resp = await fetch(url, {
          headers: {
            "apikey": supabase2.supabaseKey,
            "Authorization": `Bearer ${supabase2.supabaseKey}`
          }
        });
        if (!resp.ok)
          return null;
        const arr = await resp.json();
        return arr && arr.length > 0 ? arr[0] : null;
      };
      let dbCharacter = null;
      dbCharacter = await tryQuery("dicecloud_character_id", characterId);
      if (!dbCharacter) {
        if (characterId && characterId.startsWith("db-")) {
          dbCharacter = await tryQuery("dicecloud_character_id", characterId.replace(/^db-/, ""));
        } else {
          dbCharacter = await tryQuery("dicecloud_character_id", `db-${characterId}`);
        }
      }
      if (!dbCharacter) {
        dbCharacter = await tryQuery("id", characterId);
      }
      if (!dbCharacter) {
        throw new Error("Character not found in database");
      }
      let rawData = dbCharacter.raw_dicecloud_data || dbCharacter._fullData || null;
      if (rawData && typeof rawData === "string") {
        try {
          rawData = JSON.parse(rawData);
          debug.log("\u{1F4E6} Parsed raw_dicecloud_data from JSON string");
        } catch (parseError) {
          debug.warn("\u26A0\uFE0F raw_dicecloud_data is a string but not valid JSON:", parseError.message);
          rawData = null;
        }
      }
      debug.log("\u{1F50D} POST-RETRIEVE: raw_dicecloud_data from Supabase:", {
        hasRawData: !!rawData,
        rawDataType: typeof rawData,
        rawDataIsArray: Array.isArray(rawData),
        hasSpells: !!(rawData && rawData.spells),
        spellsIsArray: Array.isArray(rawData?.spells),
        spellsLength: rawData?.spells?.length,
        hasActions: !!(rawData && rawData.actions),
        actionsIsArray: Array.isArray(rawData?.actions),
        actionsLength: rawData?.actions?.length,
        topLevelKeys: rawData ? Object.keys(rawData).slice(0, 30) : []
      });
      if (rawData && typeof rawData === "object" && !Array.isArray(rawData)) {
        let candidate = rawData;
        const seen = /* @__PURE__ */ new Set();
        while (candidate && typeof candidate === "object" && candidate.raw_dicecloud_data && !seen.has(candidate)) {
          seen.add(candidate);
          candidate = candidate.raw_dicecloud_data;
        }
        if (candidate && typeof candidate.id === "string" && candidate.id.startsWith("db-")) {
          if (candidate._id && typeof candidate._id === "string" && !candidate._id.startsWith("db-")) {
            candidate.id = candidate._id;
          } else if (candidate.raw_dicecloud_data && candidate.raw_dicecloud_data.id && !candidate.raw_dicecloud_data.id.startsWith("db-")) {
            candidate.id = candidate.raw_dicecloud_data.id;
          }
        }
        const fullCharacter = candidate;
        fullCharacter.source = "database";
        fullCharacter.lastUpdated = dbCharacter.updated_at;
        if (!fullCharacter.id) {
          fullCharacter.id = dbCharacter.dicecloud_character_id;
        }
        if (!fullCharacter.name) {
          fullCharacter.name = dbCharacter.character_name;
        }
        if (dbCharacter.notification_color) {
          fullCharacter.notificationColor = dbCharacter.notification_color;
        }
        debug.log("\u{1F50D} Database character data check:", {
          name: fullCharacter.name,
          hasSpells: !!fullCharacter.spells,
          spellsIsArray: Array.isArray(fullCharacter.spells),
          spellsLength: fullCharacter.spells?.length,
          hasActions: !!fullCharacter.actions,
          actionsIsArray: Array.isArray(fullCharacter.actions),
          actionsLength: fullCharacter.actions?.length,
          topLevelKeys: Object.keys(fullCharacter).slice(0, 30)
        });
        try {
          const keys = Object.keys(fullCharacter || {}).slice(0, 50);
          let sample = "";
          try {
            sample = JSON.stringify(fullCharacter, keys);
          } catch (e) {
            sample = "[unserializable fullCharacter]";
          }
          debug.log("\u2705 Loaded full character from database raw_dicecloud_data:", fullCharacter.name, {
            keys,
            sample: sample && sample.slice ? sample.slice(0, 2e3) : sample,
            lastUpdated: fullCharacter.lastUpdated
          });
        } catch (e) {
          debug.log("\u2705 Loaded full character from database raw_dicecloud_data:", fullCharacter.name);
        }
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
        notificationColor: dbCharacter.notification_color,
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
      const result = await browserAPI.storage.local.get(["characterProfiles"]);
      const characterProfiles = result.characterProfiles || {};
      const characterData = characterProfiles[characterId];
      debug.log(`\u{1F3AF} Setting active character: ${characterId}`);
      debug.log(`\u{1F3AF} Character data:`, characterData ? {
        name: characterData.name || characterData.character_name,
        class: characterData.class,
        level: characterData.level
      } : "NOT FOUND");
      await browserAPI.storage.local.set({
        activeCharacterId: characterId
      });
      debug.log(`\u2705 Active character set to: ${characterId}`);
      if (characterData && characterData.id) {
        try {
          await markCharacterActiveInSupabase(characterData.id, characterData.name || characterData.character_name);
        } catch (error) {
          debug.warn("\u26A0\uFE0F Failed to mark character as active in Supabase:", error);
        }
      }
      try {
        const tabs = await browserAPI.tabs.query({ url: "https://www.owlbear.rodeo/*" });
        for (const tab of tabs) {
          await browserAPI.tabs.sendMessage(tab.id, {
            action: "characterSelected",
            character: characterData
          });
          debug.log(`\u{1F4E8} Notified Owlbear tab ${tab.id} of character selection`);
        }
      } catch (error) {
        debug.log("\u2139\uFE0F No Owlbear tabs to notify (this is normal if not on Owlbear)");
      }
    } catch (error) {
      debug.error("Failed to set active character:", error);
      throw error;
    }
  }
  async function getActiveCharacter() {
    try {
      const result = await browserAPI.storage.local.get(["characterProfiles", "activeCharacterId"]);
      const activeCharacterId = result.activeCharacterId;
      if (!activeCharacterId) {
        debug.log("\u{1F4CB} No active character set");
        return null;
      }
      const characterProfiles = result.characterProfiles || {};
      const characterData = characterProfiles[activeCharacterId];
      if (!characterData) {
        debug.warn(`\u26A0\uFE0F Active character ${activeCharacterId} not found in profiles`);
        return null;
      }
      debug.log(`\u{1F3AF} Retrieved active character: ${characterData.name || characterData.character_name}`);
      return characterData;
    } catch (error) {
      debug.error("Failed to get active character:", error);
      return null;
    }
  }
  async function markCharacterActiveInSupabase(characterId, characterName) {
    if (!isSupabaseConfigured()) {
      debug.warn("Supabase not configured - cannot mark character as active");
      return;
    }
    try {
      debug.log(`\u{1F3AF} Marking character as active in Supabase: ${characterName} (${characterId})`);
      const pairingResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/clouds_characters?dicecloud_character_id=eq.${characterId}&select=discord_user_id`,
        {
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );
      if (pairingResponse.ok) {
        const characters = await pairingResponse.json();
        if (characters.length > 0) {
          const discordUserId = characters[0].discord_user_id;
          if (discordUserId && discordUserId !== "not_linked") {
            await fetch(
              `${SUPABASE_URL}/rest/v1/clouds_characters?discord_user_id=eq.${discordUserId}`,
              {
                method: "PATCH",
                headers: {
                  "apikey": SUPABASE_ANON_KEY,
                  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ is_active: false })
              }
            );
            const updateResponse = await fetch(
              `${SUPABASE_URL}/rest/v1/clouds_characters?dicecloud_character_id=eq.${characterId}`,
              {
                method: "PATCH",
                headers: {
                  "apikey": SUPABASE_ANON_KEY,
                  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ is_active: true })
              }
            );
            if (updateResponse.ok) {
              debug.log(`\u2705 Successfully marked ${characterName} as active in Supabase`);
            } else {
              debug.warn(`\u26A0\uFE0F Failed to update active status in Supabase: ${updateResponse.status}`);
            }
          } else {
            debug.warn(`\u26A0\uFE0F Character ${characterName} not linked to Discord user, cannot mark as active`);
          }
        } else {
          debug.warn(`\u26A0\uFE0F Character ${characterId} not found in Supabase`);
        }
      } else {
        debug.warn(`\u26A0\uFE0F Failed to query Supabase for character: ${pairingResponse.status}`);
      }
    } catch (error) {
      debug.error("\u274C Error marking character as active in Supabase:", error);
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
        const legacyKeys = [
          "characterProfiles",
          "activeCharacterId",
          "timestamp",
          "characterData",
          // Legacy single-character key
          "activeSlot",
          // Legacy slot system
          "slot1",
          "slot2",
          "slot3",
          "slot4",
          "slot5",
          // Legacy slots
          "currentCharacter",
          // Another legacy key
          "cachedCharacter"
          // Cache key
        ];
        await browserAPI.storage.local.remove(legacyKeys);
        debug.log("All character data cleared successfully (including legacy keys)");
      }
    } catch (error) {
      debug.error("Failed to clear character data:", error);
      throw error;
    }
  }
  async function deleteCharacterFromCloud(characterId) {
    try {
      if (!characterId) {
        throw new Error("Character ID is required");
      }
      if (!isSupabaseConfigured()) {
        throw new Error("Supabase not configured");
      }
      debug.log(`\u{1F5D1}\uFE0F Deleting character from cloud: ${characterId}`);
      const cleanId = characterId.startsWith("db-") ? characterId.replace("db-", "") : characterId;
      const idsToTry = [cleanId];
      if (cleanId !== characterId) {
        idsToTry.push(characterId);
      }
      let deleted = false;
      for (const idToDelete of idsToTry) {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/clouds_characters?dicecloud_character_id=eq.${encodeURIComponent(idToDelete)}`,
          {
            method: "DELETE",
            headers: {
              "apikey": SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
              "Prefer": "return=representation"
              // Return deleted rows to verify
            }
          }
        );
        if (response.ok) {
          const deletedRows = await response.json();
          if (deletedRows && deletedRows.length > 0) {
            debug.log(`\u2705 Deleted ${deletedRows.length} record(s) from cloud with ID: ${idToDelete}`);
            deleted = true;
          }
        }
      }
      if (!deleted) {
        debug.warn(`\u26A0\uFE0F No records found in cloud for character: ${characterId}`);
      }
      debug.log(`\u2705 Character delete from cloud completed: ${characterId}`);
      return { success: true };
    } catch (error) {
      debug.error("Failed to delete character from cloud:", error);
      throw error;
    }
  }
  browserAPI.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      debug.log("Extension installed");
      setTimeout(() => {
        openExtensionPopup();
      }, 1e3);
      try {
        browserAPI.storage.local.set({ requireDiscordResync: true });
        debug.log("Set requireDiscordResync flag after install");
      } catch (e) {
        debug.warn("Could not set requireDiscordResync flag:", e);
      }
    } else if (details.reason === "update") {
      debug.log("Extension updated to version", browserAPI.runtime.getManifest().version);
      try {
        browserAPI.storage.local.set({ requireDiscordResync: true });
        debug.log("Set requireDiscordResync flag after update");
      } catch (e) {
        debug.warn("Could not set requireDiscordResync flag on update:", e);
      }
      (async () => {
        try {
          const stored = await browserAPI.storage.local.get(["discordWebhookEnabled", "discordUserId", "discordPairingId"]);
          const discordConnected = stored.discordWebhookEnabled || stored.discordUserId || stored.discordPairingId;
          if (!discordConnected) {
            debug.log("No Discord integration detected on update; skipping automatic resync");
            return;
          }
          if (!isSupabaseConfigured()) {
            debug.log("Supabase not configured; skipping automatic resync");
            return;
          }
          debug.log("\u{1F501} Attempting automatic character resync after update (Discord connected)");
          keepServiceWorkerAlive(6e4);
          const activeChar = await getCharacterData();
          if (!activeChar) {
            debug.log("No active character found; nothing to resync");
            return;
          }
          const res = await storeCharacterToCloud(activeChar);
          if (res && res.success) {
            debug.log("\u2705 Automatic resync successful after update");
          } else {
            debug.warn("\u26A0\uFE0F Automatic resync failed after update:", res && res.error);
          }
        } catch (err) {
          debug.warn("\u26A0\uFE0F Automatic resync encountered an error on update:", err);
        } finally {
          setTimeout(() => stopKeepAlive(), 5e3);
        }
      })();
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
      if (webhookUrl && isSupabaseConfigured()) {
        try {
          const stored = await browserAPI.storage.local.get(["discordPairingId"]);
          if (stored.discordPairingId) {
            debug.log("\u2601\uFE0F Syncing webhook URL to pairing record:", stored.discordPairingId);
            await fetch(
              `${SUPABASE_URL}/rest/v1/clouds_pairings?id=eq.${stored.discordPairingId}`,
              {
                method: "PATCH",
                headers: {
                  "apikey": SUPABASE_ANON_KEY,
                  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                  "Content-Type": "application/json",
                  "Prefer": "return=minimal"
                },
                body: JSON.stringify({ webhook_url: webhookUrl })
              }
            );
            debug.log("\u2705 Webhook URL synced to pairing");
          }
        } catch (syncError) {
          debug.warn("\u26A0\uFE0F Failed to sync webhook to pairing:", syncError.message);
        }
      }
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
          title: "\u{1F3B2} OwlCloud Connected!",
          description: "Discord webhook integration is working correctly.",
          color: 5164484,
          // Teal color matching the extension theme
          footer: {
            text: "OwlCloud - Dice Cloud \u2192 Discord Bridge"
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
  var lastDiscordPost = 0;
  var DISCORD_RATE_LIMIT_MS = 1e3;
  async function postToDiscordWebhook(payload) {
    try {
      const settings = await getDiscordWebhookSettings();
      if (!settings.enabled || !settings.webhookUrl) {
        debug.log("Discord webhook disabled or not configured");
        return { success: false, error: "Webhook not configured" };
      }
      const now = Date.now();
      if (now - lastDiscordPost < DISCORD_RATE_LIMIT_MS) {
        debug.log("Discord rate limit - skipping post");
        return { success: false, error: "Rate limited" };
      }
      lastDiscordPost = now;
      const message = buildDiscordMessage(payload);
      const response = await fetch(settings.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message)
      });
      if (response.ok || response.status === 204) {
        debug.log("\u2705 Posted to Discord:", payload.type);
        return { success: true };
      } else {
        const errorText = await response.text();
        debug.warn("\u274C Discord post failed:", response.status);
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      debug.error("\u274C Discord post error:", error);
      return { success: false, error: error.message };
    }
  }
  function buildDiscordMessage(payload) {
    const { type, characterName, combatant, round, actions, initiative } = payload;
    const getIcon = (used) => used ? "\u274C" : "\u2705";
    const buildActionStatus = (acts) => {
      if (!acts)
        return null;
      return [
        `Action: ${getIcon(acts.action)}`,
        `Bonus: ${getIcon(acts.bonus)}`,
        `Move: ${getIcon(acts.movement)}`,
        `React: ${getIcon(acts.reaction)}`
      ].join(" | ");
    };
    const buildFooter = (eventType, charName, roundNum, acts) => {
      const parts = [eventType, charName];
      if (roundNum)
        parts.push(`Round:${roundNum}`);
      if (acts) {
        const actionBits = [
          acts.action ? "0" : "1",
          acts.bonus ? "0" : "1",
          acts.movement ? "0" : "1",
          acts.reaction ? "0" : "1"
        ].join("");
        parts.push(`Actions:${actionBits}`);
      }
      return parts.join("|");
    };
    if (type === "turnStart") {
      const actionStatus = buildActionStatus(actions);
      return {
        embeds: [{
          title: `\u{1F3B2} ${characterName}'s Turn`,
          description: actionStatus || "Combat turn started!",
          color: 5164484,
          // Teal - active turn
          fields: [
            { name: "Character", value: characterName, inline: true },
            ...round ? [{ name: "Round", value: String(round), inline: true }] : [],
            ...initiative ? [{ name: "Initiative", value: String(initiative), inline: true }] : []
          ],
          footer: { text: buildFooter("TURN_START", characterName, round, actions) },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }]
      };
    }
    if (type === "turnEnd") {
      return {
        embeds: [{
          title: `\u23F8\uFE0F ${characterName}'s Turn Ended`,
          color: 9807270,
          // Gray - inactive
          fields: [
            { name: "Character", value: characterName, inline: true }
          ],
          footer: { text: buildFooter("TURN_END", characterName, round) },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }]
      };
    }
    if (type === "actionUpdate") {
      const actionStatus = buildActionStatus(actions);
      const hasUsedActions = actions && (actions.action || actions.bonus);
      return {
        embeds: [{
          title: `\u2694\uFE0F ${characterName}`,
          description: actionStatus,
          color: hasUsedActions ? 15965202 : 5164484,
          // Orange if actions used, teal if available
          fields: [
            { name: "Character", value: characterName, inline: true },
            { name: "Status", value: hasUsedActions ? "Actions Used" : "Actions Available", inline: true }
          ],
          footer: { text: buildFooter("ACTION_UPDATE", characterName, round, actions) },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }]
      };
    }
    if (type === "combatStart") {
      return {
        embeds: [{
          title: "\u2694\uFE0F Combat Started!",
          description: combatant ? `First up: **${combatant}**` : "Roll for initiative!",
          color: 15158332,
          // Red - combat
          footer: { text: "COMBAT_START" },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }]
      };
    }
    if (type === "roundChange") {
      return {
        embeds: [{
          title: `\u{1F504} Round ${round}`,
          description: combatant ? `Current turn: **${combatant}**` : "New round begins!",
          color: 10181046,
          // Purple - round change
          footer: { text: `ROUND_CHANGE|Round:${round}` },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }]
      };
    }
    if (type === "roll") {
      const rollDisplay = rollString.replace(/\[\[([^\]]+)\]/g, "$1");
      return {
        embeds: [{
          title: `\u{1F3B2} ${characterName} rolls ${rollName}`,
          description: `**${rollDisplay}**`,
          color: 5164484,
          // Teal - roll
          fields: [
            { name: "Character", value: characterName || "Unknown", inline: true },
            { name: "Roll", value: rollDisplay, inline: true }
          ],
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }]
      };
    }
    return {
      content: payload.message || `\u{1F3B2} ${characterName || "Unknown"}: ${type}`
    };
  }
  async function linkDiscordUserToAuthTokens(discordUserId, discordUsername, discordGlobalName) {
    if (!isSupabaseConfigured() || !discordUserId) {
      debug.warn("Cannot link Discord user - Supabase not configured or no user ID");
      return { success: false };
    }
    try {
      const screenDimensions = typeof screen !== "undefined" && screen ? `${screen.width}x${screen.height}` : "0x0";
      const browserFingerprint = [
        navigator.userAgent,
        navigator.language,
        screenDimensions,
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
      const upsertPayload = {
        user_id: visitorId,
        discord_user_id: discordUserId,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (discordUsername) {
        upsertPayload.discord_username = discordUsername;
      }
      if (discordGlobalName) {
        upsertPayload.discord_global_name = discordGlobalName;
      }
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/auth_tokens`,
        {
          method: "POST",
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal"
          },
          body: JSON.stringify(upsertPayload)
        }
      );
      if (response.ok) {
        debug.log("\u2705 Discord user linked to auth_tokens via POST");
        const authResult = await browserAPI.storage.local.get(["diceCloudUserId"]);
        if (authResult.diceCloudUserId) {
          await linkDiscordUserToCharacters(discordUserId, authResult.diceCloudUserId);
        }
        return { success: true };
      } else {
        const errorText = await response.text();
        if (response.status === 409 && errorText.includes("auth_tokens_user_id_key")) {
          debug.log("\u26A0\uFE0F Auth token exists, trying PATCH update:", visitorId);
          const patchResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/auth_tokens?user_id=eq.${encodeURIComponent(visitorId)}`,
            {
              method: "PATCH",
              headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
              },
              body: JSON.stringify(upsertPayload)
            }
          );
          if (patchResponse.ok) {
            debug.log("\u2705 Discord user linked to auth_tokens via PATCH");
            const authResult = await browserAPI.storage.local.get(["diceCloudUserId"]);
            if (authResult.diceCloudUserId) {
              await linkDiscordUserToCharacters(discordUserId, authResult.diceCloudUserId);
            }
            return { success: true };
          } else {
            const patchError = await patchResponse.text();
            debug.error("\u274C PATCH also failed:", patchResponse.status, patchError);
            return { success: false, error: patchError };
          }
        }
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
        `${SUPABASE_URL}/rest/v1/clouds_characters?user_id_dicecloud=eq.${diceCloudUserId}&discord_user_id=eq.not_linked`,
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
      const screenDimensions = typeof screen !== "undefined" && screen ? `${screen.width}x${screen.height}` : "0x0";
      const browserFingerprint = [
        navigator.userAgent,
        navigator.language,
        screenDimensions,
        (/* @__PURE__ */ new Date()).getTimezoneOffset()
      ].join("|");
      let hash = 0;
      for (let i = 0; i < browserFingerprint.length; i++) {
        const char = browserFingerprint.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      const visitorId = "user_" + Math.abs(hash).toString(36);
      let dicecloudUserId = characterData.dicecloudUserId || characterData.userId || characterData.ownerUserId || null;
      if (!dicecloudUserId) {
        const stored = await browserAPI.storage.local.get(["diceCloudUserId"]);
        dicecloudUserId = stored.diceCloudUserId || null;
        if (dicecloudUserId) {
          debug.log("\u2705 Got DiceCloud user ID from storage:", dicecloudUserId);
        }
      }
      if (!dicecloudUserId) {
        debug.error("\u274C Cannot store character to cloud: no DiceCloud user ID available");
        return {
          success: false,
          error: "Cannot sync to cloud: not logged in to DiceCloud. Please login first."
        };
      }
      let resolvedCharId = characterData.id || characterData._id || null;
      const isStorageKey = (id) => {
        if (!id)
          return false;
        return /^(db-)+/.test(id) || /^slot-\d+$/.test(id) || /^db-slot-\d+$/.test(id);
      };
      const isDiceCloudId = (id) => {
        if (!id)
          return false;
        return /^[A-Za-z0-9]{17}$/.test(id);
      };
      if (resolvedCharId && isStorageKey(resolvedCharId)) {
        debug.warn(`\u26A0\uFE0F Character ID "${resolvedCharId}" looks like a storage key, not a DiceCloud ID`);
        const nested = characterData.raw_dicecloud_data || characterData._fullData || {};
        const possibleIds = [
          nested.dicecloud_character_id,
          nested._id,
          nested.id,
          characterData.dicecloud_character_id,
          characterData.dicecloudId,
          characterData.characterId,
          // Also check nested raw_dicecloud_data (for double-nested data)
          nested.raw_dicecloud_data?.id,
          nested.raw_dicecloud_data?._id
        ].filter((id) => id && !isStorageKey(id));
        const realId = possibleIds.find(isDiceCloudId) || possibleIds[0];
        if (realId) {
          resolvedCharId = realId;
          debug.log(`\u2705 Resolved real DiceCloud character ID: ${resolvedCharId}`);
        } else {
          const fingerprint = `${dicecloudUserId}-${characterData.name}-${characterData.class}-${characterData.level}`;
          let fpHash = 0;
          for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            fpHash = (fpHash << 5) - fpHash + char;
            fpHash = fpHash & fpHash;
          }
          resolvedCharId = `fp-${Math.abs(fpHash).toString(36)}`;
          debug.warn(`\u26A0\uFE0F Using fingerprint ID for dedup: ${resolvedCharId}`);
        }
      }
      const prepareRawForPayload = (data) => {
        try {
          let candidate = null;
          if (data && data._fullData && data._fullData.raw_dicecloud_data) {
            candidate = data._fullData.raw_dicecloud_data;
          } else if (data && data.raw_dicecloud_data) {
            candidate = data.raw_dicecloud_data;
          } else if (data && data._fullData) {
            candidate = data._fullData;
          }
          const seen = /* @__PURE__ */ new Set();
          while (candidate && typeof candidate === "object" && candidate.raw_dicecloud_data && !seen.has(candidate)) {
            seen.add(candidate);
            candidate = candidate.raw_dicecloud_data;
          }
          if (candidate && typeof candidate.id === "string" && candidate.id.startsWith("db-")) {
            if (candidate._id && typeof candidate._id === "string" && !candidate._id.startsWith("db-")) {
              candidate.id = candidate._id;
            } else if (candidate.raw_dicecloud_data && candidate.raw_dicecloud_data.id && !candidate.raw_dicecloud_data.id.startsWith("db-")) {
              candidate.id = candidate.raw_dicecloud_data.id;
            }
          }
          if (candidate && typeof candidate === "object") {
            if (candidate.armor_class && !candidate.armorClass)
              candidate.armorClass = candidate.armor_class;
            if (candidate.hit_points && !candidate.hitPoints)
              candidate.hitPoints = candidate.hit_points;
          }
          if (candidate && typeof candidate === "object")
            return candidate;
        } catch (e) {
          debug.warn("\u26A0\uFE0F Error while preparing raw_dicecloud_data for payload:", e && e.message ? e.message : e);
        }
        return data;
      };
      const extractArmorClass = (raw, fallback) => {
        if (!raw || typeof raw !== "object")
          return fallback;
        if (typeof raw.armorClass === "number")
          return raw.armorClass;
        if (typeof raw.armor_class === "number")
          return raw.armor_class;
        if (raw.ac && typeof raw.ac === "object") {
          if (typeof raw.ac.base === "number")
            return raw.ac.base;
          if (typeof raw.ac.total === "number")
            return raw.ac.total;
        }
        if (raw.defenses && typeof raw.defenses === "object") {
          if (typeof raw.defenses.armor_class === "number")
            return raw.defenses.armor_class;
          if (typeof raw.defenses.armorClass === "number")
            return raw.defenses.armorClass;
        }
        return fallback;
      };
      const preparedRaw = prepareRawForPayload(characterData);
      debug.log("\u{1F50D} PRE-SAVE: Prepared raw_dicecloud_data check:", {
        hasSpells: !!preparedRaw.spells,
        spellsIsArray: Array.isArray(preparedRaw.spells),
        spellsLength: preparedRaw.spells?.length,
        hasActions: !!preparedRaw.actions,
        actionsIsArray: Array.isArray(preparedRaw.actions),
        actionsLength: preparedRaw.actions?.length,
        topLevelKeys: Object.keys(preparedRaw || {}).slice(0, 30),
        rawDataSizeKB: (JSON.stringify(preparedRaw).length / 1024).toFixed(2)
      });
      const payload = {
        user_id_dicecloud: dicecloudUserId,
        dicecloud_character_id: resolvedCharId,
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
        armor_class: extractArmorClass(preparedRaw, characterData.armorClass || 10),
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
        notification_color: characterData.notificationColor || "#3498db",
        // Mark character as active when synced
        is_active: true,
        // Store the FULL parsed character object (but unwrap DB wrappers first)
        // The individual fields above are for Discord bot quick access
        raw_dicecloud_data: preparedRaw,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (pairingCode) {
        const pairingResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/clouds_pairings?pairing_code=eq.${pairingCode}&select=id,discord_user_id`,
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
              `${SUPABASE_URL}/rest/v1/clouds_pairings?dicecloud_user_id=eq.${payload.user_id_dicecloud}&status=eq.connected&select=id,discord_user_id,discord_username,discord_global_name,webhook_url`,
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
                debug.log("\u2705 Linked to pairing:", pairings[0].id);
                await linkDiscordUserToAuthTokens(
                  discordUserId,
                  pairings[0].discord_username,
                  pairings[0].discord_global_name
                );
                if (pairings[0].webhook_url) {
                  const currentSettings = await getDiscordWebhookSettings();
                  if (!currentSettings.webhookUrl) {
                    debug.log("\u2705 Restoring webhook URL from pairing");
                    await setDiscordWebhookSettings(pairings[0].webhook_url, true);
                  }
                }
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
                `${SUPABASE_URL}/rest/v1/clouds_pairings?id=eq.${stored.discordPairingId}&select=id,discord_user_id,discord_username,discord_global_name,webhook_url`,
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
                  debug.log("\u2705 Linked to pairing:", pairings[0].id);
                  await linkDiscordUserToAuthTokens(
                    discordUserId,
                    pairings[0].discord_username,
                    pairings[0].discord_global_name
                  );
                  if (pairings[0].webhook_url) {
                    const currentSettings = await getDiscordWebhookSettings();
                    if (!currentSettings.webhookUrl) {
                      debug.log("\u2705 Restoring webhook URL from stored pairing");
                      await setDiscordWebhookSettings(pairings[0].webhook_url, true);
                    }
                  }
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
      try {
        const raw = payload.raw_dicecloud_data;
        const rawKeys = raw && typeof raw === "object" && !Array.isArray(raw) ? Object.keys(raw) : [];
        let rawSample = "";
        try {
          if (raw && typeof raw === "object") {
            const allowed = rawKeys.slice(0, 50);
            rawSample = JSON.stringify(raw, allowed);
          } else {
            rawSample = String(raw);
          }
        } catch (e) {
          rawSample = "[unserializable raw_dicecloud_data]";
        }
        debug.log("\u{1F501} storeCharacterToCloud payload preview", {
          dicecloud_character_id: payload.dicecloud_character_id,
          character_name: payload.character_name,
          raw_keys_count: rawKeys.length,
          raw_keys: rawKeys.slice(0, 20),
          raw_sample: rawSample && rawSample.slice ? rawSample.slice(0, 2e3) : rawSample
        });
      } catch (e) {
        debug.warn("\u26A0\uFE0F Failed to produce storeCharacterToCloud payload preview:", e && e.message ? e.message : e);
      }
      try {
        const deleteResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/clouds_characters?user_id_dicecloud=eq.${encodeURIComponent(payload.user_id_dicecloud)}&character_name=eq.${encodeURIComponent(payload.character_name)}`,
          {
            method: "DELETE",
            headers: {
              "apikey": SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
              "Prefer": "return=minimal"
            }
          }
        );
        if (deleteResponse.ok) {
          debug.log("\u{1F9F9} Cleaned up existing character records before insert");
        }
      } catch (deleteError) {
        debug.warn("\u26A0\uFE0F Failed to cleanup existing records:", deleteError.message);
      }
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/clouds_characters`,
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
          `${SUPABASE_URL}/rest/v1/clouds_characters?dicecloud_character_id=eq.${characterData.id}`,
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
      await browserAPI.storage.local.set({
        lastSyncTime: (/* @__PURE__ */ new Date()).toISOString()
      });
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
        `${SUPABASE_URL}/rest/v1/clouds_characters?dicecloud_character_id=eq.${characterId}`,
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
      debug.log(`\u{1F50D} Character comparison: Discord="${characterName}" vs Active="${activeCharacterName}"`);
      debug.log(`\u{1F50D} Active character data:`, characterData);
      const normalizedDiscordName = characterName?.trim().toLowerCase();
      const normalizedActiveName = activeCharacterName?.trim().toLowerCase();
      debug.log(`\u{1F50D} Normalized comparison: Discord="${normalizedDiscordName}" vs Active="${normalizedActiveName}"`);
      if (characterData && normalizedDiscordName && normalizedActiveName && normalizedDiscordName === normalizedActiveName) {
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
        debug.log(`\u274C Comparison failed: "${normalizedDiscordName}" !== "${normalizedActiveName}"`);
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
          topic: `realtime:public:clouds_pairings:pairing_code=eq.${pairingCode}`,
          event: "phx_join",
          payload: {
            config: {
              broadcast: { self: false },
              presence: { key: "" },
              postgres_changes: [{
                event: "UPDATE",
                schema: "public",
                table: "clouds_pairings",
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
            `${SUPABASE_URL}/rest/v1/clouds_pairings?dicecloud_user_id=eq.${diceCloudUserId}&status=in.(pending,connected)`,
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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/clouds_pairings`, {
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
        `${SUPABASE_URL}/rest/v1/clouds_pairings?pairing_code=eq.${code}&select=*`,
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
  async function getUserCharactersFromCloud(pairingId = null) {
    if (!isSupabaseConfigured()) {
      debug.warn("Supabase not configured - cannot get user characters");
      return [];
    }
    try {
      let characters = [];
      if (pairingId) {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/clouds_pairings?id=eq.${pairingId}&select=discord_user_id`,
          {
            headers: {
              "apikey": SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
            }
          }
        );
        if (response.ok) {
          const pairings = await response.json();
          if (pairings.length > 0) {
            const discordUserId = pairings[0].discord_user_id;
            const charsResponse = await fetch(
              `${SUPABASE_URL}/rest/v1/clouds_characters?discord_user_id=eq.${discordUserId}&select=character_name,level,race,class,is_active,updated_at&order=updated_at.desc`,
              {
                headers: {
                  "apikey": SUPABASE_ANON_KEY,
                  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
                }
              }
            );
            if (charsResponse.ok) {
              characters = await charsResponse.json();
            }
          }
        }
      } else {
        const settings = await getDiscordWebhookSettings();
        if (settings.pairingId) {
          return await getUserCharactersFromCloud(settings.pairingId);
        }
      }
      debug.log(`\u{1F4CB} Retrieved ${characters.length} characters from cloud`);
      return characters;
    } catch (error) {
      debug.error("\u274C Error getting user characters from cloud:", error);
      return [];
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
        const topic = `realtime:public:clouds_commands`;
        const joinMessage = {
          topic,
          event: "phx_join",
          payload: {
            config: {
              postgres_changes: [{
                event: "INSERT",
                // ✅ Listen for new commands being inserted
                schema: "public",
                table: "clouds_commands",
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
        startRealtimeKeepAlive();
        commandRealtimeHeartbeat = setInterval(() => {
          if (commandRealtimeSocket && commandRealtimeSocket.readyState === WebSocket.OPEN) {
            commandRealtimeSocket.send(JSON.stringify({
              topic: "phoenix",
              event: "heartbeat",
              payload: {},
              ref: "cmd_hb_" + Date.now()
            }));
            drainPendingCommands();
          }
        }, 5e3);
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
    stopRealtimeKeepAlive();
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
        `${SUPABASE_URL}/rest/v1/clouds_commands?pairing_id=eq.${currentPairingId}&status=eq.pending&order=created_at.asc&limit=10`,
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
        case "rollhere":
          result = await executeRollHereCommand(command);
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
        case "use":
          result = await executeUseAbilityCommand(command);
          break;
        case "cast":
          result = await executeCastCommand(command);
          break;
        case "heal":
          result = await executeHealCommand(command);
          break;
        case "takedamage":
          result = await executeTakeDamageCommand(command);
          break;
        case "rest":
          result = await executeRestCommand(command);
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
  async function executeRollHereCommand(command) {
    const { action_name, command_data } = command;
    const rollString2 = command_data.roll_string || "1d20";
    const rollName2 = action_name || command_data.roll_name || "Roll";
    const characterName = command_data.character_name || "Unknown";
    debug.log("\u{1F3B2} Rolling in Discord:", rollString2, rollName2);
    try {
      const payload = {
        type: "roll",
        characterName,
        rollName: rollName2,
        rollString: rollString2,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      const result = await postToDiscordWebhook(payload);
      if (result.success) {
        debug.log("\u2705 Roll posted to Discord:", rollName2);
        return { success: true, message: `Rolled ${rollName2} in Discord` };
      } else {
        debug.error("\u274C Failed to post roll to Discord:", result.error);
        return { success: false, message: `Failed to roll in Discord: ${result.error}` };
      }
    } catch (error) {
      debug.error("\u274C Error executing rollhere command:", error);
      return { success: false, message: `Error: ${error.message}` };
    }
  }
  async function executeRollCommand(command) {
    const { action_name } = command;
    const rollName2 = action_name || "Discord Roll";
    debug.warn("\u274C Roll command not supported - Roll20 integration removed");
    return { success: false, message: `Roll command not supported: ${rollName2}` };
  }
  async function executeUseActionCommand(command, actionType) {
    const { action_name } = command;
    debug.warn("\u274C Use action command not supported - Roll20 integration removed");
    return { success: false, message: `Use action command not supported: ${actionType} ${action_name}` };
  }
  async function executeEndTurnCommand(command) {
    debug.warn("\u274C End turn command not supported - Roll20 integration removed");
    return { success: false, message: "End turn command not supported" };
  }
  async function executeUseAbilityCommand(command) {
    const { action_name } = command;
    debug.warn("\u274C Use ability command not supported - Roll20 integration removed");
    return { success: false, message: `Use ability command not supported: ${action_name}` };
  }
  async function executeCastCommand(command) {
    const { action_name, command_data } = command;
    try {
      const characterData = await getCharacterDataForDiscordCommand(command_data.character_name, command_data.character_id);
      if (!characterData) {
        debug.warn(`No character data found for Discord command: ${command_data.character_name}`);
        return { success: false, error: "Character not found" };
      }
      debug.warn("\u274C Cast spell command not supported - Roll20 integration removed");
      return { success: false, message: `Cast spell command not supported: ${action_name}` };
    } catch (error) {
      debug.error("Error executing Discord cast command:", error);
      return { success: false, error: error.message };
    }
  }
  async function executeHealCommand(command) {
    const { command_data } = command;
    debug.warn("\u274C Heal command not supported - Roll20 integration removed");
    return {
      success: false,
      message: command_data.is_temp ? `Temp HP command not supported` : `Heal command not supported`
    };
  }
  async function executeTakeDamageCommand(command) {
    const { command_data } = command;
    debug.warn("\u274C Take damage command not supported - Roll20 integration removed");
    return {
      success: false,
      message: `Take damage command not supported`
    };
  }
  async function executeRestCommand(command) {
    const { command_data } = command;
    debug.warn("\u274C Rest command not supported - Roll20 integration removed");
    return {
      success: false,
      message: `Rest command not supported`
    };
  }
  function safeJsonParse(jsonString, maxDepth = 20) {
    try {
      const seen = /* @__PURE__ */ new WeakSet();
      return JSON.parse(jsonString, (key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            debug.warn(`Circular reference detected for key: ${key}`);
            return "[Circular Reference]";
          }
          seen.add(value);
        }
        return value;
      });
    } catch (error) {
      debug.error("JSON parsing failed:", error.message);
      return null;
    }
  }
  async function getCharacterDataForDiscordCommand(characterName, characterId) {
    try {
      const result = await browserAPI.storage.local.get(["characterProfiles", "activeCharacterId"]);
      const characterProfiles = result.characterProfiles || {};
      const activeCharacterId = result.activeCharacterId;
      debug.log(`\u{1F3AF} Discord command looking for character: ${characterName}, activeCharacterId: ${activeCharacterId}`);
      if (activeCharacterId && characterProfiles[activeCharacterId]) {
        const activeChar = characterProfiles[activeCharacterId];
        if (!characterName || activeChar.character?.name === characterName || activeChar.name === characterName) {
          debug.log(`\u{1F4E5} Using active character for Discord command: ${activeChar.character?.name || activeChar.name}`);
          return activeChar.character || activeChar;
        }
      }
      if (characterName && characterProfiles) {
        for (const [id, profile] of Object.entries(characterProfiles)) {
          if (profile.type === "dicecloud" && (profile.character?.name === characterName || profile.name === characterName)) {
            debug.log(`\u{1F4E5} Found character by name in local storage for ${characterName}`);
            return profile.character || profile;
          }
        }
      }
      if (characterId && isSupabaseConfigured()) {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/raw_dicecloud_data?character_id=eq.${characterId}&select=*`,
          {
            headers: {
              "apikey": SUPABASE_ANON_KEY,
              "Content-Type": "application/json"
            }
          }
        );
        if (response.ok) {
          const responseText = await response.text();
          const data = safeJsonParse(responseText);
          if (data && Array.isArray(data) && data.length > 0) {
            debug.log(`\u{1F4E5} Retrieved character data from Supabase for ${characterName}`);
            return data[0].character_data;
          }
        }
      }
      debug.warn(`No character data found for ${characterName || "unknown character"}`);
      return null;
    } catch (error) {
      debug.error(`Error getting character data for ${characterName}:`, error);
      if (error.message && error.message.includes("Maximum call stack size exceeded")) {
        debug.error("Stack overflow detected in character data processing");
        return null;
      }
      return null;
    }
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
        `${SUPABASE_URL}/rest/v1/clouds_commands?id=eq.${commandId}`,
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
  async function cleanupDiscordCommands() {
    try {
      if (!isSupabaseConfigured()) {
        debug.log("Skipping command cleanup - Supabase not configured");
        return;
      }
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/cleanup_and_maintain_commands`,
        {
          method: "POST",
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );
      if (response.ok) {
        const result = await response.json();
        debug.log("\u{1F9F9} Command cleanup completed:", result);
      } else {
        debug.warn("Failed to run command cleanup:", response.status);
      }
    } catch (error) {
      debug.error("Error during command cleanup:", error);
    }
  }
  async function getCommandHealthMetrics() {
    try {
      if (!isSupabaseConfigured()) {
        return null;
      }
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/get_command_health_metrics`,
        {
          method: "POST",
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );
      if (response.ok) {
        const metrics = await response.json();
        debug.log("\u{1F4CA} Command health metrics:", metrics);
        if (metrics.cleanup_needed && metrics.length > 0) {
          debug.log("\u{1F9F9} Cleanup needed, running automatic cleanup...");
          await cleanupDiscordCommands();
        }
        return metrics[0] || metrics;
      } else {
        debug.warn("Failed to get command health metrics:", response.status);
        return null;
      }
    } catch (error) {
      debug.error("Error getting command health metrics:", error);
      return null;
    }
  }
  setInterval(async () => {
    try {
      await cleanupDiscordCommands();
    } catch (error) {
      debug.error("Periodic cleanup failed:", error);
    }
  }, 15 * 60 * 1e3);
  setInterval(async () => {
    try {
      await getCommandHealthMetrics();
    } catch (error) {
      debug.error("Health check failed:", error);
    }
  }, 5 * 60 * 1e3);
  (async () => {
    try {
      const settings = await browserAPI.storage.local.get(["discordWebhookEnabled", "discordPairingId", "discordWebhookUrl"]);
      debug.log("\u{1F504} Auto-start check - webhookEnabled:", settings.discordWebhookEnabled, "pairingId:", settings.discordPairingId ? "set" : "not set", "webhookUrl:", settings.discordWebhookUrl ? "set" : "not set");
      const hasWebhookIntegration = settings.discordWebhookEnabled && settings.discordWebhookUrl;
      const hasPairingIntegration = settings.discordPairingId;
      if (hasWebhookIntegration || hasPairingIntegration) {
        debug.log("\u2705 Discord integration detected, auto-starting command realtime subscription...");
        await subscribeToCommandRealtime(settings.discordPairingId);
      } else {
        debug.log("\u23ED\uFE0F Skipping auto-start - no Discord integration configured (webhook:", hasWebhookIntegration, "pairing:", hasPairingIntegration);
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
      installerPort = browserAPI.runtime.connectNative("com.owlcloud.installer");
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
//# sourceMappingURL=background-chrome.js.map
