(() => {
  // ../../packages/core/src/common/browser-polyfill.js
  console.log("\u{1F310} Loading browser polyfill...");
  var globalScope = typeof window !== "undefined" ? window : self;
  var browserAPI2;
  if (typeof browser !== "undefined" && browser.runtime) {
    console.log("\u{1F98A} Detected Firefox");
    browserAPI2 = browser;
  } else if (typeof chrome !== "undefined" && chrome.runtime) {
    console.log("\u{1F310} Detected Chrome");
    const isChromeContextValid = () => {
      try {
        return chrome && chrome.runtime && chrome.runtime.id;
      } catch (error) {
        return false;
      }
    };
    browserAPI2 = {
      runtime: {
        sendMessage: (message, callback) => {
          if (typeof callback === "function") {
            try {
              if (!isChromeContextValid()) {
                console.error("\u274C Extension context invalidated");
                callback(null);
                return;
              }
              chrome.runtime.sendMessage(message, callback);
            } catch (error) {
              console.error("\u274C Extension context error:", error.message);
              callback(null);
            }
            return;
          }
          return new Promise((resolve, reject) => {
            try {
              if (!isChromeContextValid()) {
                reject(new Error("Extension context invalidated"));
                return;
              }
              chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              });
            } catch (error) {
              console.error("\u274C Extension context error:", error.message);
              reject(error);
            }
          });
        },
        onMessage: chrome.runtime.onMessage,
        getURL: (path) => {
          try {
            if (!isChromeContextValid())
              return null;
            return chrome.runtime.getURL(path);
          } catch (error) {
            console.error("\u274C Extension context error:", error.message);
            return null;
          }
        },
        getManifest: () => {
          try {
            if (!isChromeContextValid())
              return null;
            return chrome.runtime.getManifest();
          } catch (error) {
            console.error("\u274C Extension context error:", error.message);
            return null;
          }
        },
        get id() {
          try {
            if (!isChromeContextValid())
              return null;
            return chrome.runtime.id;
          } catch (error) {
            console.error("\u274C Extension context error:", error.message);
            return null;
          }
        },
        get lastError() {
          try {
            if (!isChromeContextValid())
              return null;
            return chrome.runtime.lastError;
          } catch (error) {
            return null;
          }
        },
        connectNative: (application) => {
          try {
            if (!isChromeContextValid()) {
              console.error("\u274C Extension context invalidated");
              return null;
            }
            const port = chrome.runtime.connectNative(application);
            if (chrome.runtime.lastError) {
              console.warn("\u26A0\uFE0F Native messaging error:", chrome.runtime.lastError.message);
              return null;
            }
            return port;
          } catch (error) {
            console.error("\u274C Native messaging error:", error.message);
            return null;
          }
        }
      },
      storage: {
        local: {
          get: (keys) => {
            return new Promise((resolve, reject) => {
              try {
                if (!isChromeContextValid()) {
                  reject(new Error("Extension context invalidated"));
                  return;
                }
                chrome.storage.local.get(keys, (result) => {
                  if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                  } else {
                    resolve(result);
                  }
                });
              } catch (error) {
                reject(new Error("Extension context invalidated"));
              }
            });
          },
          set: (items) => {
            return new Promise((resolve, reject) => {
              try {
                if (!isChromeContextValid()) {
                  reject(new Error("Extension context invalidated"));
                  return;
                }
                chrome.storage.local.set(items, () => {
                  if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                  } else {
                    resolve();
                  }
                });
              } catch (error) {
                reject(new Error("Extension context invalidated"));
              }
            });
          },
          remove: (keys) => {
            return new Promise((resolve, reject) => {
              try {
                if (!isChromeContextValid()) {
                  reject(new Error("Extension context invalidated"));
                  return;
                }
                chrome.storage.local.remove(keys, () => {
                  if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                  } else {
                    resolve();
                  }
                });
              } catch (error) {
                reject(new Error("Extension context invalidated"));
              }
            });
          },
          clear: () => {
            return new Promise((resolve, reject) => {
              try {
                if (!isChromeContextValid()) {
                  reject(new Error("Extension context invalidated"));
                  return;
                }
                chrome.storage.local.clear(() => {
                  if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                  } else {
                    resolve();
                  }
                });
              } catch (error) {
                reject(new Error("Extension context invalidated"));
              }
            });
          }
        }
      },
      tabs: {
        query: (queryInfo) => {
          return new Promise((resolve, reject) => {
            try {
              if (!isChromeContextValid()) {
                reject(new Error("Extension context invalidated"));
                return;
              }
              chrome.tabs.query(queryInfo, (tabs) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(tabs);
                }
              });
            } catch (error) {
              reject(new Error("Extension context invalidated"));
            }
          });
        },
        sendMessage: (tabId, message, callback) => {
          if (typeof callback === "function") {
            try {
              if (!isChromeContextValid()) {
                console.error("\u274C Extension context invalidated");
                callback(null);
                return;
              }
              chrome.tabs.sendMessage(tabId, message, callback);
            } catch (error) {
              console.error("\u274C Extension context error:", error.message);
              callback(null);
            }
            return;
          }
          return new Promise((resolve, reject) => {
            try {
              if (!isChromeContextValid()) {
                reject(new Error("Extension context invalidated"));
                return;
              }
              chrome.tabs.sendMessage(tabId, message, (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              });
            } catch (error) {
              console.error("\u274C Extension context error:", error.message);
              reject(error);
            }
          });
        },
        create: (createProperties) => {
          return new Promise((resolve, reject) => {
            try {
              if (!isChromeContextValid()) {
                reject(new Error("Extension context invalidated"));
                return;
              }
              chrome.tabs.create(createProperties, (tab) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(tab);
                }
              });
            } catch (error) {
              reject(new Error("Extension context invalidated"));
            }
          });
        },
        update: (tabId, updateProperties) => {
          return new Promise((resolve, reject) => {
            try {
              if (!isChromeContextValid()) {
                reject(new Error("Extension context invalidated"));
                return;
              }
              chrome.tabs.update(tabId, updateProperties, (tab) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(tab);
                }
              });
            } catch (error) {
              reject(new Error("Extension context invalidated"));
            }
          });
        }
      }
    };
  } else {
    console.error("\u274C FATAL: No browser API available!");
    throw new Error("No browser API available");
  }
  globalScope.browserAPI = browserAPI2;
  if (!globalScope.browserAPI || !globalScope.browserAPI.runtime) {
    console.error("\u274C FATAL: Browser API not available!");
    throw new Error("Browser API not available");
  }
  console.log("\u2705 Browser API ready:", typeof browser !== "undefined" && browserAPI2 === browser ? "Firefox" : "Chrome");

  // ../../packages/core/src/supabase/config.js
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

  // src/popup/popup.js
  var debug = window.debug || {
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
  document.addEventListener("DOMContentLoaded", () => {
    console.log("\u{1F680} Popup DOMContentLoaded fired");
    if (typeof browserAPI === "undefined" && typeof window.browserAPI === "undefined") {
      console.error("\u274C FATAL: browserAPI is not defined!");
      debug.error("\u274C FATAL: browserAPI is not defined!");
      document.body.innerHTML = `
      <div style="padding: 20px; color: red; font-family: Arial;">
        <h2>Error: Browser API Not Loaded</h2>
        <p>The browser polyfill failed to load.</p>
        <p><strong>Steps to fix:</strong></p>
        <ol>
          <li>Go to chrome://extensions/</li>
          <li>Click "Remove" on FoundCloud</li>
          <li>Reload the extension fresh</li>
        </ol>
        <p style="font-size: 12px; color: #666;">
          Check the console (F12) for more details.
        </p>
      </div>
    `;
      return;
    }
    console.log("\u2705 browserAPI is available");
    debug.log("\u2705 browserAPI is available");
    try {
      console.log("\u{1F680} About to call initializePopup()");
      initializePopup();
      console.log("\u2705 initializePopup() completed");
    } catch (error) {
      const logger = typeof debug !== "undefined" ? debug : console;
      console.error("\u274C Popup initialization error:", error);
      logger.error("\u274C Popup initialization error:", error);
      document.body.innerHTML = `
      <div style="padding: 20px; color: red; font-family: Arial;">
        <h2>Initialization Error</h2>
        <p>${error.message}</p>
        <pre style="background: #f0f0f0; padding: 10px; overflow: auto;">${error.stack}</pre>
      </div>
    `;
    }
    function initializePopup() {
      try {
        const manifest = browserAPI.runtime.getManifest();
        const versionDisplay = document.getElementById("versionDisplay");
        if (versionDisplay && manifest.version) {
          versionDisplay.textContent = `v${manifest.version}`;
        }
      } catch (e) {
        console.log("Could not read manifest version:", e);
      }
      checkExperimentalBuild();
      const loginSection = document.getElementById("loginSection");
      const mainSection = document.getElementById("mainSection");
      const autoConnectBtn = document.getElementById("autoConnectBtn");
      const usernameLoginForm = document.getElementById("usernameLoginForm");
      const usernameInput = document.getElementById("username");
      const passwordInput = document.getElementById("password");
      const usernameLoginBtn = document.getElementById("usernameLoginBtn");
      const loginError = document.getElementById("loginError");
      const logoutBtn = document.getElementById("logoutBtn");
      const exportBtn = document.getElementById("exportBtn");
      const importBtn = document.getElementById("importBtn");
      const importFile = document.getElementById("importFile");
      const cloudSyncBtn = document.getElementById("cloudSyncBtn");
      const characterSelector = document.getElementById("characterSelector");
      const characterSelect = document.getElementById("characterSelect");
      const statusIcon = document.getElementById("statusIcon");
      const statusText = document.getElementById("statusText");
      const characterInfo = document.getElementById("characterInfo");
      const charName = document.getElementById("charName");
      const charLevel = document.getElementById("charLevel");
      const charClass = document.getElementById("charClass");
      const charRace = document.getElementById("charRace");
      const syncBtn = document.getElementById("syncBtn");
      const showSheetBtn = document.getElementById("showSheetBtn");
      const clearBtn = document.getElementById("clearBtn");
      const syncCharacterToCloudBtn = document.getElementById("syncCharacterToCloudBtn");
      const howToBtn = document.getElementById("howToBtn");
      const settingsBtn = document.getElementById("settingsBtn");
      const settingsMenu = document.getElementById("settingsMenu");
      const autoBackwardsSyncToggle = document.getElementById("autoBackwardsSyncToggle");
      if (showSheetBtn) {
        showSheetBtn.disabled = false;
        showSheetBtn.style.display = "inline-block";
        showSheetBtn.style.width = "auto";
        showSheetBtn.style.height = "auto";
        showSheetBtn.style.padding = "8px 16px";
        showSheetBtn.style.margin = "5px";
        showSheetBtn.style.visibility = "visible";
      }
      checkLoginStatus();
      debug.log("\u{1F50D} Supabase availability check:", typeof SupabaseTokenManager !== "undefined" ? "Available" : "Not available");
      if (typeof SupabaseTokenManager !== "undefined") {
        const testManager = new SupabaseTokenManager();
        debug.log("\u{1F50D} Generated user ID:", testManager.generateUserId());
      }
      browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "dataSynced") {
          debug.log("\u{1F4E5} Received data sync notification:", message);
          loadCharacterData();
          showSuccess(`${message.characterName} synced successfully!`);
        }
      });
      let lastCharacterCount = 0;
      setInterval(async () => {
        try {
          const result = await browserAPI.storage.local.get(["characterProfiles"]);
          const profiles = result.characterProfiles || {};
          const currentCount = Object.keys(profiles).filter((id) => profiles[id].type !== "rollcloudPlayer").length;
          if (currentCount > lastCharacterCount) {
            debug.log("\u{1F504} Detected new character data via polling");
            loadCharacterData();
            showSuccess("New character data detected!");
          }
          lastCharacterCount = currentCount;
        } catch (error) {
        }
      }, 5e3);
      setInterval(async () => {
        try {
          if (typeof SupabaseTokenManager !== "undefined") {
            const supabaseManager = new SupabaseTokenManager();
            const sessionCheck = await supabaseManager.checkSessionValidity();
            if (!sessionCheck.valid) {
              debug.log("\u26A0\uFE0F Session conflict detected via polling, logging out:", sessionCheck.reason);
              await handleSessionConflict(sessionCheck);
              showLoginSection();
            }
          }
        } catch (error) {
          debug.error("\u274C Error in periodic session check:", error);
        }
      }, 1e4);
      autoConnectBtn.addEventListener("click", handleAutoConnect);
      usernameLoginForm.addEventListener("submit", handleUsernameLogin);
      logoutBtn.addEventListener("click", handleLogout);
      characterSelect.addEventListener("change", handleCharacterChange);
      syncBtn.addEventListener("click", handleSync);
      if (showSheetBtn) {
        showSheetBtn.addEventListener("click", handleShowSheet);
      } else {
        debug.error("\u274C showSheetBtn not found!");
      }
      if (howToBtn) {
        howToBtn.addEventListener("click", handleHowTo);
      }
      if (syncCharacterToCloudBtn) {
        syncCharacterToCloudBtn.addEventListener("click", handleSyncCharacterToCloud);
      }
      clearBtn.addEventListener("click", handleClear);
      if (settingsBtn && settingsMenu) {
        settingsBtn.addEventListener("click", toggleSettingsMenu);
        document.addEventListener("click", (event) => {
          if (!settingsBtn.contains(event.target) && !settingsMenu.contains(event.target)) {
            settingsMenu.classList.add("hidden");
          }
        });
      }
      if (exportBtn) {
        exportBtn.addEventListener("click", handleExport);
      }
      if (importBtn && importFile) {
        importBtn.addEventListener("click", () => importFile.click());
        importFile.addEventListener("change", handleImport);
      }
      if (cloudSyncBtn) {
        cloudSyncBtn.addEventListener("click", handleCloudSync);
      }
      document.getElementById("closeSlotModal").addEventListener("click", closeSlotModal);
      if (autoBackwardsSyncToggle) {
        loadAutoBackwardsSyncState();
        autoBackwardsSyncToggle.addEventListener("change", handleAutoBackwardsSyncToggle);
      }
      const setupDiscordBtn = document.getElementById("setupDiscordBtn");
      const cancelPairingBtn = document.getElementById("cancelPairingBtn");
      const disconnectDiscordBtn = document.getElementById("disconnectDiscordBtn");
      const testDiscordWebhookBtn = document.getElementById("testDiscordWebhook");
      const checkDiscordIntegrationBtn = document.getElementById("checkDiscordIntegration");
      const checkDiscordIntegrationNotConnectedBtn = document.getElementById("checkDiscordIntegrationNotConnected");
      const saveDiscordWebhookBtn = document.getElementById("saveDiscordWebhook");
      if (setupDiscordBtn) {
        loadDiscordConnectionState();
        setupDiscordBtn.addEventListener("click", handleSetupDiscord);
        if (cancelPairingBtn)
          cancelPairingBtn.addEventListener("click", handleCancelPairing);
        if (disconnectDiscordBtn)
          disconnectDiscordBtn.addEventListener("click", handleDisconnectDiscord);
        if (testDiscordWebhookBtn)
          testDiscordWebhookBtn.addEventListener("click", handleTestDiscordWebhook);
        if (checkDiscordIntegrationBtn)
          checkDiscordIntegrationBtn.addEventListener("click", handleCheckDiscordIntegration);
        if (checkDiscordIntegrationNotConnectedBtn)
          checkDiscordIntegrationNotConnectedBtn.addEventListener("click", handleCheckDiscordIntegration);
        if (saveDiscordWebhookBtn)
          saveDiscordWebhookBtn.addEventListener("click", handleSaveDiscordWebhook);
      }
      async function checkLoginStatus() {
        try {
          debug.log("\u{1F50D} Checking login status...");
          if (typeof SupabaseTokenManager !== "undefined") {
            const supabaseManager = new SupabaseTokenManager();
            const sessionCheck = await supabaseManager.checkSessionValidity();
            if (!sessionCheck.valid) {
              debug.log("\u26A0\uFE0F Session conflict detected, logging out:", sessionCheck.reason);
              await handleSessionConflict(sessionCheck);
              showLoginSection();
              return;
            }
          }
          const response = await Promise.race([
            browserAPI.runtime.sendMessage({ action: "checkLoginStatus" }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Service worker timeout")), 3e3))
          ]);
          debug.log("\u{1F4E5} Login status response:", response);
          if (response.success && response.loggedIn) {
            showMainSection();
          } else {
            debug.log("\u{1F504} Background script says not logged in, checking storage directly...");
            try {
              const result = await browserAPI.storage.local.get(["diceCloudToken", "username", "tokenExpires"]);
              debug.log("\u{1F4E6} Direct storage check result:", result);
              if (result.diceCloudToken) {
                debug.log("\u2705 Found token in storage, showing main section");
                showMainSection();
              } else {
                debug.log("\u274C No token found in storage, checking Supabase...");
                const { explicitlyLoggedOut } = await browserAPI.storage.local.get("explicitlyLoggedOut");
                if (explicitlyLoggedOut) {
                  debug.log("\u23ED\uFE0F Skipping Supabase restoration: user explicitly logged out");
                  showLoginSection();
                  return;
                }
                try {
                  if (typeof SupabaseTokenManager !== "undefined") {
                    debug.log("\u{1F310} Attempting to retrieve token from Supabase...");
                    const supabaseManager = new SupabaseTokenManager();
                    const userId = supabaseManager.generateUserId();
                    debug.log("\u{1F50D} Using user ID for Supabase lookup:", userId);
                    const supabaseResult = await supabaseManager.retrieveToken();
                    debug.log("\u{1F4E5} Supabase retrieval result:", supabaseResult);
                    if (supabaseResult.success) {
                      debug.log("\u2705 Found token in Supabase, restoring to local storage...");
                      await browserAPI.storage.local.set({
                        diceCloudToken: supabaseResult.token,
                        username: supabaseResult.username,
                        tokenExpires: supabaseResult.tokenExpires,
                        diceCloudUserId: supabaseResult.userId,
                        authId: supabaseResult.authId || supabaseResult.userId
                      });
                      await browserAPI.storage.local.remove("explicitlyLoggedOut");
                      const localProfiles = await browserAPI.storage.local.get(["profiles"]);
                      if (localProfiles.profiles) {
                        await browserAPI.storage.local.set({
                          profiles: localProfiles.profiles
                        });
                      }
                      debug.log("\u2705 Token and data restored from Supabase to local storage");
                      showMainSection();
                    } else {
                      debug.log("\u2139\uFE0F No token found in Supabase");
                      showLoginSection();
                    }
                  } else {
                    debug.log("\u274C Supabase not available, showing login");
                    showLoginSection();
                  }
                } catch (error) {
                  debug.error("\u274C Error retrieving from Supabase:", error);
                  showLoginSection();
                }
              }
            } catch (storageError) {
              debug.error("\u274C Storage check failed:", storageError);
              showLoginSection();
            }
          }
        } catch (error) {
          debug.error("\u274C Error checking login status:", error);
          try {
            const result = await browserAPI.storage.local.get(["diceCloudToken", "username", "tokenExpires"]);
            debug.log("\u{1F4E6} Direct storage check result (error fallback):", result);
            if (result.diceCloudToken) {
              debug.log("\u2705 Found token in storage, showing main section");
              showMainSection();
            } else {
              debug.log("\u274C No token found in storage, checking Supabase...");
              const { explicitlyLoggedOut } = await browserAPI.storage.local.get("explicitlyLoggedOut");
              if (explicitlyLoggedOut) {
                debug.log("\u23ED\uFE0F Skipping Supabase restoration (error fallback): user explicitly logged out");
                showLoginSection();
                return;
              }
              try {
                if (typeof SupabaseTokenManager !== "undefined") {
                  const supabaseManager = new SupabaseTokenManager();
                  const supabaseResult = await supabaseManager.retrieveToken();
                  if (supabaseResult.success) {
                    debug.log("\u2705 Found token in Supabase (error fallback), restoring to local storage...");
                    await browserAPI.storage.local.set({
                      diceCloudToken: supabaseResult.token,
                      username: supabaseResult.username,
                      tokenExpires: supabaseResult.tokenExpires
                    });
                    await browserAPI.storage.local.remove("explicitlyLoggedOut");
                    showMainSection();
                  } else {
                    debug.log("\u274C No token found in Supabase, showing login");
                    showLoginSection();
                  }
                } else {
                  debug.log("\u274C Supabase not available, showing login");
                  showLoginSection();
                }
              } catch (supabaseError) {
                debug.error("\u274C Supabase check failed:", supabaseError);
                showLoginSection();
              }
            }
          } catch (storageError) {
            debug.error("\u274C Storage check failed:", storageError);
            showLoginSection();
          }
        }
      }
      async function handleSessionConflict(sessionCheck) {
        try {
          debug.log("\u26A0\uFE0F Handling session conflict:", sessionCheck);
          await browserAPI.storage.local.remove([
            "diceCloudToken",
            "username",
            "tokenExpires",
            "diceCloudUserId",
            "authId",
            "currentSessionId",
            "sessionStartTime"
          ]);
          let conflictMessage = "You have been logged out because FoundCloud was opened in a different browser.";
          if (sessionCheck.reason === "conflict_detected" && sessionCheck.conflict) {
            const conflict = sessionCheck.conflict.conflictingSession;
            const detectedTime = new Date(conflict.detectedAt).toLocaleString();
            if (conflict.username && conflict.browserInfo) {
              const browserName = conflict.browserInfo.userAgent.includes("Chrome") ? "Chrome" : conflict.browserInfo.userAgent.includes("Firefox") ? "Firefox" : conflict.browserInfo.userAgent.includes("Edge") ? "Edge" : "another browser";
              conflictMessage = `You have been logged out because FoundCloud was opened in ${browserName} as "${conflict.username}" at ${detectedTime}.`;
            }
          } else if (sessionCheck.reason === "token_mismatch") {
            conflictMessage = "You have been logged out because your login session was invalidated by another device.";
          } else if (sessionCheck.reason === "session_not_found") {
            conflictMessage = "Your session has expired. Please log in again.";
          }
          showLoginError(conflictMessage);
          if (typeof SupabaseTokenManager !== "undefined") {
            const supabaseManager = new SupabaseTokenManager();
            await supabaseManager.clearConflictInfo();
          }
          debug.log("\u2705 Session conflict handled, user logged out");
        } catch (error) {
          debug.error("\u274C Error handling session conflict:", error);
          showLoginError("You have been logged out. Please log in again.");
        }
      }
      function showLoginSection() {
        loginSection.classList.remove("hidden");
        mainSection.classList.add("hidden");
      }
      function showMainSection() {
        loginSection.classList.add("hidden");
        mainSection.classList.remove("hidden");
        loadCharacterData();
      }
      async function handleAutoConnect() {
        try {
          autoConnectBtn.disabled = true;
          autoConnectBtn.textContent = "\u23F3 Checking...";
          hideLoginError();
          const [activeTab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
          let dicecloudTab = null;
          if (activeTab && activeTab.url && activeTab.url.includes("dicecloud.com")) {
            dicecloudTab = activeTab;
            debug.log("Using current active DiceCloud tab");
          } else {
            const tabs = await browserAPI.tabs.query({ url: "https://dicecloud.com/*" });
            if (tabs.length > 0) {
              dicecloudTab = tabs[0];
              debug.log("Found DiceCloud tab:", dicecloudTab.id);
            }
          }
          if (dicecloudTab) {
            autoConnectBtn.textContent = "\u23F3 Capturing token...";
            try {
              console.log("\u{1F4E1} About to send message to tab:", dicecloudTab.id);
              debug.log("\u{1F4E1} About to send message to tab:", dicecloudTab.id);
              const response = await new Promise((resolve) => {
                browserAPI.runtime.sendMessage({
                  action: "extractAuthToken",
                  tabId: dicecloudTab.id
                }, (response2) => {
                  console.log("\u{1F4E1} Received callback response:", response2);
                  debug.log("\u{1F4E1} Received callback response:", response2);
                  const actualResponse = response2.success ? response2.data : response2;
                  console.log("\u{1F4E1} Actual response object:", actualResponse);
                  debug.log("\u{1F4E1} Actual response object:", actualResponse);
                  resolve(actualResponse);
                });
              });
              console.log("\u{1F4E1} Received Promise response:", response);
              debug.log("\u{1F4E1} Received Promise response:", response);
              debug.log("\u{1F4E5} Token capture response:", response);
              console.log("\u{1F4E5} Token capture response (console):", response);
              if (response && response.success && response.token) {
                try {
                  debug.log("\u{1F4BE} Storing token directly in storage...");
                  const storageData = {
                    diceCloudToken: response.token,
                    diceCloudUserId: response.userId,
                    tokenExpires: response.tokenExpires,
                    username: response.username,
                    authId: response.authId
                  };
                  await browserAPI.storage.local.set(storageData);
                  await browserAPI.storage.local.remove("explicitlyLoggedOut");
                  debug.log("\u2705 Token stored successfully in direct storage:", storageData);
                  try {
                    if (typeof SupabaseTokenManager !== "undefined") {
                      const supabaseManager = new SupabaseTokenManager();
                      const supabaseResult = await supabaseManager.storeToken({
                        token: response.token,
                        userId: response.userId,
                        tokenExpires: response.tokenExpires,
                        username: response.username,
                        // Display username
                        authId: response.authId
                        // Auth ID for database
                      });
                      if (supabaseResult.success) {
                        debug.log("\u2705 Token also stored in Supabase for cross-session persistence");
                      } else {
                        debug.log("\u26A0\uFE0F Supabase storage failed (non-critical):", supabaseResult.error);
                      }
                    }
                  } catch (supabaseError) {
                    debug.log("\u26A0\uFE0F Supabase not available (non-critical):", supabaseError);
                  }
                  hideLoginError();
                  showMainSection();
                  loadCharacterData();
                } catch (storageError) {
                  debug.error("\u274C Direct storage failed:", storageError);
                  showLoginError("Failed to save login. Please try again.");
                  return;
                }
              } else {
                showLoginError("Please log in to DiceCloud, then click the button again.");
                await browserAPI.tabs.update(dicecloudTab.id, { active: true });
              }
            } catch (error) {
              debug.error("Error capturing token:", error);
              showLoginError("Error: " + error.message);
            }
          } else {
            autoConnectBtn.textContent = "\u23F3 Opening DiceCloud...";
            await browserAPI.tabs.create({
              url: "https://dicecloud.com",
              active: true
            });
            showLoginError("DiceCloud opened in new tab. Log in, then click this button again.");
          }
        } catch (error) {
          debug.error("Auto-connect error:", error);
          showLoginError("Error: " + error.message);
        } finally {
          autoConnectBtn.disabled = false;
          autoConnectBtn.textContent = "\u{1F510} Connect with DiceCloud";
        }
      }
      async function handleUsernameLogin(event) {
        event.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        if (!username || !password) {
          showLoginError("Please enter both username and password");
          return;
        }
        try {
          usernameLoginBtn.disabled = true;
          usernameLoginBtn.textContent = "\u23F3 Logging in...";
          hideLoginError();
          const response = await browserAPI.runtime.sendMessage({
            action: "loginToDiceCloud",
            username,
            password
          });
          if (response.success) {
            usernameLoginForm.reset();
            showMainSection();
            loadCharacterData();
          } else {
            showLoginError(response.error || "Login failed");
          }
        } catch (error) {
          debug.error("Login error:", error);
          showLoginError("Login failed: " + error.message);
        } finally {
          usernameLoginBtn.disabled = false;
          usernameLoginBtn.textContent = "\u{1F510} Login to DiceCloud";
        }
      }
      async function handleLogout() {
        try {
          try {
            if (typeof SupabaseTokenManager !== "undefined") {
              const supabaseManager = new SupabaseTokenManager();
              const supabaseResult = await supabaseManager.deleteToken();
              if (supabaseResult.success) {
                debug.log("\u2705 Token deleted from Supabase");
              } else {
                debug.log("\u26A0\uFE0F Supabase deletion failed (non-critical):", supabaseResult.error);
              }
            }
          } catch (supabaseError) {
            debug.log("\u26A0\uFE0F Supabase not available for logout (non-critical):", supabaseError);
          }
          await browserAPI.runtime.sendMessage({ action: "logout" });
          showLoginSection();
          clearCharacterDisplay();
        } catch (error) {
          debug.error("Logout error:", error);
        }
      }
      function showLoginError(message) {
        loginError.textContent = message;
        loginError.classList.remove("hidden");
      }
      function hideLoginError() {
        loginError.classList.add("hidden");
        loginError.textContent = "";
      }
      async function loadCharacterData() {
        try {
          const profilesResponse = await browserAPI.runtime.sendMessage({ action: "getAllCharacterProfiles" });
          const profiles = profilesResponse.success ? profilesResponse.profiles : {};
          const storageResult = await browserAPI.storage.local.get(["activeCharacterId"]);
          const activeCharacterId = storageResult.activeCharacterId;
          let activeCharacter = null;
          if (activeCharacterId && profiles[activeCharacterId]) {
            activeCharacter = profiles[activeCharacterId];
          } else {
            const activeResponse = await browserAPI.runtime.sendMessage({ action: "getCharacterData" });
            activeCharacter = activeResponse.success ? activeResponse.data : null;
          }
          const characterIds = Object.keys(profiles).filter(
            (id) => profiles[id].type !== "rollcloudPlayer"
          );
          if (characterIds.length > 0) {
            characterSelect.innerHTML = "";
            characterIds.forEach((id) => {
              const char = profiles[id];
              const option = document.createElement("option");
              option.value = id;
              option.textContent = `${char.name || "Unknown"} (${char.class || "No Class"} ${char.level || "?"})`;
              if (id === activeCharacterId) {
                option.selected = true;
              }
              characterSelect.appendChild(option);
            });
            characterSelector.classList.remove("hidden");
            if (activeCharacter) {
              syncCharacterToCloudBtn.classList.remove("hidden");
            } else {
              syncCharacterToCloudBtn.classList.add("hidden");
            }
          } else {
            characterSelect.innerHTML = '<option value="">No characters synced</option>';
            characterSelector.classList.add("hidden");
            syncCharacterToCloudBtn.classList.add("hidden");
          }
          if (activeCharacter) {
            displayCharacterData(activeCharacter);
          } else {
            clearCharacterDisplay();
          }
        } catch (error) {
          debug.error("Error loading character data:", error);
          clearCharacterDisplay();
        }
      }
      async function handleCharacterChange() {
        try {
          const selectedId = characterSelect.value;
          if (!selectedId) {
            syncCharacterToCloudBtn.classList.add("hidden");
            return;
          }
          syncCharacterToCloudBtn.classList.remove("hidden");
          if (selectedId.startsWith("db-")) {
            const profilesResponse = await browserAPI.runtime.sendMessage({ action: "getAllCharacterProfiles" });
            const profiles = profilesResponse.success ? profilesResponse.profiles : {};
            const dbChar = profiles[selectedId];
            if (dbChar) {
              await browserAPI.runtime.sendMessage({
                action: "storeCharacterData",
                data: dbChar,
                slotId: selectedId
              });
            }
          }
          await browserAPI.runtime.sendMessage({
            action: "setActiveCharacter",
            characterId: selectedId
          });
          await loadCharacterData();
          showSuccess("Switched to selected character");
        } catch (error) {
          debug.error("Error changing character:", error);
          showError("Failed to switch character");
        }
      }
      function displayCharacterData(data) {
        statusIcon.textContent = "\u2705";
        statusText.textContent = "Character data synced";
        characterInfo.classList.remove("hidden");
        charName.textContent = data.name || "-";
        charLevel.textContent = data.level || "-";
        charClass.textContent = data.class || "-";
        charRace.textContent = data.race || "-";
        showSheetBtn.disabled = false;
        clearBtn.disabled = false;
      }
      function clearCharacterDisplay() {
        statusIcon.textContent = "\u23F3";
        statusText.textContent = "No character data synced";
        characterInfo.classList.add("hidden");
        charName.textContent = "-";
        charLevel.textContent = "-";
        charClass.textContent = "-";
        charRace.textContent = "-";
        showSheetBtn.disabled = false;
        clearBtn.disabled = false;
      }
      async function handleSync() {
        try {
          syncBtn.disabled = true;
          syncBtn.textContent = "\u23F3 Refreshing...";
          statusIcon.textContent = "\u23F3";
          statusText.textContent = "Refreshing characters...";
          await refreshFromLocalStorage();
          await refreshFromDatabase();
          await loadCharacterData();
          showSuccess("Characters refreshed successfully!");
        } catch (error) {
          debug.error("Error refreshing characters:", error);
          showError("Error: " + error.message);
        } finally {
          syncBtn.disabled = false;
          syncBtn.textContent = "\u{1F504} Refresh Characters";
        }
      }
      async function refreshFromLocalStorage() {
        try {
          const profilesResponse = await browserAPI.runtime.sendMessage({ action: "getAllCharacterProfiles" });
          const profiles = profilesResponse.success ? profilesResponse.profiles : {};
          const characterCount = Object.keys(profiles).filter(
            (id) => profiles[id].type !== "rollcloudPlayer"
          ).length;
          console.log(`Found ${characterCount} characters in local storage`);
          return profiles;
        } catch (error) {
          console.error("Error refreshing from local storage:", error);
          throw error;
        }
      }
      async function refreshFromDatabase() {
        try {
          if (typeof SupabaseTokenManager === "undefined") {
            console.log("Cloud sync not available, skipping database refresh");
            return;
          }
          const supabaseManager = new SupabaseTokenManager();
          const result = await browserAPI.storage.local.get(["diceCloudToken", "username", "tokenExpires", "diceCloudUserId", "authId"]);
          if (!result.diceCloudToken) {
            console.log("No token found, skipping database refresh");
            return;
          }
          const supabaseResult = await supabaseManager.storeToken({
            token: result.diceCloudToken,
            userId: result.diceCloudUserId,
            tokenExpires: result.tokenExpires,
            username: result.username || "DiceCloud User",
            authId: result.authId || result.diceCloudUserId
          });
          if (supabaseResult.success) {
            console.log("Account data refreshed to cloud");
            const characterData = await supabaseManager.getCharacterData(result.diceCloudUserId);
            if (characterData.success && characterData.characters) {
              console.log(`Pulled ${Object.keys(characterData.characters).length} characters from cloud`);
              await mergeCloudDataToLocal(characterData.characters);
            }
          } else {
            console.error("Failed to refresh account to cloud:", supabaseResult.error);
          }
        } catch (error) {
          console.error("Error refreshing from database:", error);
        }
      }
      async function mergeCloudDataToLocal(cloudCharacters) {
        try {
          const localResponse = await browserAPI.runtime.sendMessage({ action: "getAllCharacterProfiles" });
          const localProfiles = localResponse.success ? localResponse.profiles : {};
          for (const [characterId, cloudData] of Object.entries(cloudCharacters)) {
            if (!localProfiles[characterId]) {
              await browserAPI.runtime.sendMessage({
                action: "storeCharacterData",
                data: cloudData.characterData,
                slotId: characterId
              });
              console.log(`Added cloud character ${characterId} to local storage`);
            }
          }
        } catch (error) {
          console.error("Error merging cloud data:", error);
        }
      }
      async function showSlotSelectionModal(tab) {
        const modal = document.getElementById("slotModal");
        const slotGrid = document.getElementById("slotGrid");
        const profilesResponse = await browserAPI.runtime.sendMessage({ action: "getAllCharacterProfiles" });
        const profiles = profilesResponse.success ? profilesResponse.profiles : {};
        slotGrid.innerHTML = "";
        const MAX_SLOTS = 10;
        for (let i = 1; i <= MAX_SLOTS; i++) {
          const slotId = `slot-${i}`;
          const existingChar = profiles[slotId];
          const slotCard = document.createElement("div");
          slotCard.className = existingChar ? "slot-card" : "slot-card empty";
          slotCard.dataset.slotId = slotId;
          if (existingChar) {
            slotCard.innerHTML = `
          <div class="slot-header">
            <span class="slot-number">Slot ${i}</span>
            <span class="slot-badge occupied">Occupied</span>
          </div>
          <div class="slot-info">
            <strong>${existingChar.name || "Unknown"}</strong>
          </div>
          <div class="slot-details">
            ${existingChar.class || "No Class"} ${existingChar.level || "?"} \u2022 ${existingChar.race || "Unknown Race"}
          </div>
        `;
          } else {
            slotCard.innerHTML = `
          <div class="slot-header">
            <span class="slot-number">Slot ${i}</span>
            <span class="slot-badge empty">Empty</span>
          </div>
          <div class="slot-info empty-text">
            Click to save character here
          </div>
        `;
          }
          slotCard.addEventListener("click", () => handleSlotSelection(slotId, tab));
          slotGrid.appendChild(slotCard);
        }
        modal.classList.remove("hidden");
      }
      function closeSlotModal() {
        const modal = document.getElementById("slotModal");
        modal.classList.add("hidden");
      }
      async function handleSlotSelection(slotId, tab) {
        try {
          closeSlotModal();
          syncBtn.disabled = true;
          syncBtn.textContent = "\u23F3 Syncing...";
          statusIcon.textContent = "\u23F3";
          statusText.textContent = "Syncing from Dice Cloud...";
          const response = await browserAPI.tabs.sendMessage(tab.id, {
            action: "syncCharacter",
            slotId
          });
          if (response && response.success) {
            await loadCharacterData();
            showSuccess(`Character synced to ${slotId.replace("slot-", "Slot ")}!`);
          } else {
            showError(response?.error || "Failed to sync character data");
          }
        } catch (error) {
          debug.error("Error syncing character:", error);
          showError("Error: " + error.message);
        } finally {
          syncBtn.disabled = false;
          syncBtn.textContent = "\u{1F504} Sync from Dice Cloud";
        }
      }
      async function handleShowSheet() {
        try {
          showSheetBtn.disabled = true;
          showSheetBtn.textContent = "\u23F3 Opening...";
          const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
          if (!tab.url || !tab.url.includes("roll20.net")) {
            showError("Please navigate to Roll20 first");
            showSheetBtn.disabled = false;
            showSheetBtn.textContent = "\u{1F4CB} Show Character Sheet";
            return;
          }
          const profilesResponse = await browserAPI.runtime.sendMessage({ action: "getAllCharacterProfiles" });
          const profiles = profilesResponse.success ? profilesResponse.profiles : {};
          const hasCharacters = Object.keys(profiles).some(
            (key) => profiles[key].type !== "rollcloudPlayer"
          );
          if (!hasCharacters) {
            const userConfirmed = confirm("No character data found.\n\nWould you like to open GM mode instead?");
            if (!userConfirmed) {
              showSheetBtn.disabled = false;
              showSheetBtn.textContent = "\u{1F4CB} Show Character Sheet";
              return;
            }
          }
          const response = await browserAPI.tabs.sendMessage(tab.id, { action: "showCharacterSheet" });
          if (response && response.success) {
            showSuccess("Character sheet opened!");
          } else if (!hasCharacters) {
            showSuccess("GM mode opened!");
          } else {
            debug.error("Failed to open character sheet:", response);
            showError("Failed to open character sheet");
          }
        } catch (error) {
          debug.error("Error showing character sheet:", error);
          showError("Error: " + error.message);
        } finally {
          showSheetBtn.disabled = false;
          showSheetBtn.textContent = "\u{1F4CB} Show Character Sheet";
        }
      }
      function toggleSettingsMenu(event) {
        event.stopPropagation();
        settingsMenu.classList.toggle("hidden");
      }
      function handleHowTo() {
        if (typeof browser !== "undefined" && browser.runtime && browser.runtime.openOptionsPage) {
          browser.runtime.openOptionsPage();
        } else if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.openOptionsPage) {
          chrome.runtime.openOptionsPage();
        } else {
          const welcomeUrl = browserAPI.runtime.getURL("src/options/welcome.html");
          browserAPI.tabs.create({ url: welcomeUrl });
        }
      }
      async function handleSyncCharacterToCloud() {
        try {
          syncCharacterToCloudBtn.disabled = true;
          syncCharacterToCloudBtn.textContent = "\u23F3 Syncing...";
          const selectedId = characterSelect.value;
          if (!selectedId) {
            showError("No character selected");
            return;
          }
          const profilesResponse = await browserAPI.runtime.sendMessage({ action: "getAllCharacterProfiles" });
          const profiles = profilesResponse.success ? profilesResponse.profiles : {};
          let characterData = profiles[selectedId];
          if (!characterData) {
            showError("Character data not found");
            return;
          }
          if (characterData.source === "database" && characterData._fullData) {
            const fullData = characterData._fullData.raw_dicecloud_data;
            if (fullData && typeof fullData === "object") {
              debug.log("\u{1F4E6} Using full character data from database raw_dicecloud_data");
              characterData = {
                ...fullData,
                source: "database",
                lastUpdated: characterData.lastUpdated || characterData._fullData.updated_at
              };
            } else {
              debug.warn("\u26A0\uFE0F Database profile missing raw_dicecloud_data, using summary only");
            }
          }
          const loginStatus = await browserAPI.runtime.sendMessage({ action: "checkLoginStatus" });
          const dicecloudUserId = loginStatus.userId;
          debug.log("\u{1F3AD} Syncing character to cloud:", {
            characterId: selectedId,
            characterName: characterData.name,
            dicecloudUserId
          });
          const result = await browserAPI.runtime.sendMessage({
            action: "syncCharacterToCloud",
            characterData: {
              ...characterData,
              id: selectedId,
              dicecloudUserId,
              // Include DiceCloud user ID
              userId: dicecloudUserId
              // Also as userId for backwards compatibility
            }
          });
          if (result.success) {
            showSuccess("Character synced to cloud!");
          } else {
            showError("Cloud sync failed: " + (result.error || "Unknown error"));
          }
        } catch (error) {
          debug.error("Error syncing character to cloud:", error);
          showError("Cloud sync error: " + error.message);
        } finally {
          syncCharacterToCloudBtn.disabled = false;
          syncCharacterToCloudBtn.textContent = "\u2601\uFE0F Sync Character to Cloud";
        }
      }
      async function handleClear() {
        try {
          clearBtn.disabled = true;
          const selectedId = characterSelect.value;
          if (selectedId) {
            await browserAPI.runtime.sendMessage({
              action: "clearCharacterData",
              characterId: selectedId
            });
            showSuccess("Character data cleared");
          } else {
            await browserAPI.runtime.sendMessage({ action: "clearCharacterData" });
            showSuccess("All character data cleared");
          }
          await loadCharacterData();
        } catch (error) {
          debug.error("Error clearing data:", error);
          showError("Error clearing data");
        } finally {
          clearBtn.disabled = false;
        }
      }
      async function handleExport() {
        try {
          exportBtn.disabled = true;
          exportBtn.textContent = "\u23F3 Exporting...";
          const profilesResponse = await browserAPI.runtime.sendMessage({ action: "getAllCharacterProfiles" });
          const profiles = profilesResponse.success ? profilesResponse.profiles : {};
          const characterProfiles = {};
          for (const [key, value] of Object.entries(profiles)) {
            if (!key.startsWith("rollcloudPlayer")) {
              characterProfiles[key] = value;
            }
          }
          if (Object.keys(characterProfiles).length === 0) {
            showError("No characters to export");
            return;
          }
          const exportData = {
            version: "1.0",
            exportDate: (/* @__PURE__ */ new Date()).toISOString(),
            characters: characterProfiles
          };
          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `rollcloud-characters-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showSuccess(`Exported ${Object.keys(characterProfiles).length} character(s)`);
        } catch (error) {
          debug.error("Error exporting characters:", error);
          showError("Error exporting: " + error.message);
        } finally {
          exportBtn.disabled = false;
          exportBtn.textContent = "\u{1F4E4} Export Characters";
        }
      }
      async function handleImport(event) {
        const file = event.target.files[0];
        if (!file)
          return;
        try {
          importBtn.disabled = true;
          importBtn.textContent = "\u23F3 Importing...";
          const text = await file.text();
          const importData = JSON.parse(text);
          if (!importData.characters || typeof importData.characters !== "object") {
            showError("Invalid import file format");
            return;
          }
          let importedCount = 0;
          for (const [characterId, characterData] of Object.entries(importData.characters)) {
            await browserAPI.runtime.sendMessage({
              action: "storeCharacterData",
              data: characterData,
              slotId: characterId
            });
            importedCount++;
          }
          await loadCharacterData();
          showSuccess(`Imported ${importedCount} character(s)`);
        } catch (error) {
          debug.error("Error importing characters:", error);
          if (error instanceof SyntaxError) {
            showError("Invalid JSON file");
          } else {
            showError("Error importing: " + error.message);
          }
        } finally {
          importBtn.disabled = false;
          importBtn.textContent = "\u{1F4E5} Import Characters";
          event.target.value = "";
        }
      }
      async function handleCloudSync() {
        try {
          cloudSyncBtn.disabled = true;
          cloudSyncBtn.textContent = "\u23F3 Syncing...";
          const result = await browserAPI.storage.local.get(["diceCloudToken", "username", "tokenExpires", "diceCloudUserId", "authId"]);
          if (!result.diceCloudToken) {
            showError("No token to sync. Please log in first.");
            return;
          }
          if (typeof SupabaseTokenManager === "undefined") {
            showError("Cloud sync not available");
            return;
          }
          const supabaseManager = new SupabaseTokenManager();
          debug.log("\u{1F310} Manual cloud sync - Browser ID:", supabaseManager.generateUserId());
          const supabaseResult = await supabaseManager.storeToken({
            token: result.diceCloudToken,
            userId: result.diceCloudUserId,
            tokenExpires: result.tokenExpires,
            username: result.username || "DiceCloud User",
            authId: result.authId || result.diceCloudUserId
          });
          if (supabaseResult.success) {
            showSuccess("Token synced to cloud!");
          } else {
            showError("Cloud sync failed: " + (supabaseResult.error || "Unknown error"));
          }
        } catch (error) {
          debug.error("Error syncing to cloud:", error);
          showError("Cloud sync error: " + error.message);
        } finally {
          cloudSyncBtn.disabled = false;
          cloudSyncBtn.textContent = "\u2601\uFE0F Sync to Cloud";
        }
      }
      function showSuccess(message) {
        statusIcon.textContent = "\u2705";
        statusText.textContent = message;
        setTimeout(() => {
          loadCharacterData();
        }, 2e3);
      }
      function showError(message) {
        statusIcon.textContent = "\u274C";
        statusText.textContent = message;
        setTimeout(() => {
          loadCharacterData();
        }, 3e3);
      }
      async function loadAutoBackwardsSyncState() {
        try {
          const result = await browserAPI.storage.local.get(["autoBackwardsSync"]);
          const isEnabled = result.autoBackwardsSync !== false;
          if (autoBackwardsSyncToggle) {
            autoBackwardsSyncToggle.checked = isEnabled;
          }
          debug.log("Auto backwards sync state loaded:", isEnabled);
        } catch (error) {
          debug.error("Error loading auto backwards sync state:", error);
        }
      }
      async function handleAutoBackwardsSyncToggle() {
        try {
          const isEnabled = autoBackwardsSyncToggle.checked;
          await browserAPI.storage.local.set({ autoBackwardsSync: isEnabled });
          const tabs = await browserAPI.tabs.query({ url: "*://app.roll20.net/*" });
          for (const tab of tabs) {
            try {
              await browserAPI.tabs.sendMessage(tab.id, {
                action: "setAutoBackwardsSync",
                enabled: isEnabled
              });
              debug.log("Sent auto backwards sync state to Roll20 tab:", tab.id, isEnabled);
            } catch (error) {
              debug.log("Could not send message to tab:", tab.id, error.message);
            }
          }
          debug.log("Auto backwards sync toggled:", isEnabled);
          const previousText = statusText.textContent;
          const previousIcon = statusIcon.textContent;
          statusIcon.textContent = "\u2705";
          statusText.textContent = `Auto backwards sync ${isEnabled ? "enabled" : "disabled"}`;
          setTimeout(() => {
            statusIcon.textContent = previousIcon;
            statusText.textContent = previousText;
          }, 2e3);
        } catch (error) {
          debug.error("Error toggling auto backwards sync:", error);
          showError("Failed to toggle auto backwards sync");
        }
      }
      let pairingPollInterval = null;
      let pairingExpiresAt = null;
      async function loadDiscordConnectionState() {
        try {
          const response = await browserAPI.runtime.sendMessage({ action: "getDiscordWebhook" });
          if (response.success && response.webhookUrl) {
            showDiscordConnected(response.serverName || "Discord Server");
          } else {
            showDiscordNotConnected();
          }
        } catch (error) {
          debug.error("Error loading Discord state:", error);
          showDiscordNotConnected();
        }
      }
      function showDiscordNotConnected() {
        document.getElementById("discordNotConnected").style.display = "block";
        document.getElementById("discordPairing").style.display = "none";
        document.getElementById("discordConnected").style.display = "none";
      }
      function showDiscordPairing(code) {
        document.getElementById("discordNotConnected").style.display = "none";
        document.getElementById("discordPairing").style.display = "block";
        document.getElementById("discordConnected").style.display = "none";
        document.getElementById("pairingCode").textContent = code;
      }
      function showDiscordConnected(serverName) {
        document.getElementById("discordNotConnected").style.display = "none";
        document.getElementById("discordPairing").style.display = "none";
        document.getElementById("discordConnected").style.display = "block";
        document.getElementById("discordServerName").textContent = serverName || "Discord Server";
      }
      function generatePairingCode() {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let code = "";
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      }
      async function handleSetupDiscord() {
        try {
          const setupBtn = document.getElementById("setupDiscordBtn");
          setupBtn.disabled = true;
          setupBtn.textContent = "\u23F3 Setting up...";
          let code = null;
          let installerProvided = false;
          try {
            debug.log("\u{1F50D} Requesting pairing code from installer...");
            await browserAPI.runtime.sendMessage({ action: "requestPairingCodeFromInstaller" });
            await new Promise((resolve) => setTimeout(resolve, 500));
            const stored = await browserAPI.storage.local.get(["installerPairingCode"]);
            if (stored.installerPairingCode) {
              code = stored.installerPairingCode;
              installerProvided = true;
              debug.log("\u{1F4E5} Using installer-provided pairing code:", code);
              await browserAPI.storage.local.remove(["installerPairingCode"]);
            }
          } catch (e) {
            debug.warn("Could not check for installer pairing code:", e);
          }
          if (!code) {
            code = generatePairingCode();
            debug.log("\u{1F3B2} Generated local pairing code:", code);
          }
          const loginStatus = await browserAPI.runtime.sendMessage({ action: "checkLoginStatus" });
          const diceCloudUsername = loginStatus.username || "Unknown";
          const diceCloudUserId = loginStatus.userId;
          if (!installerProvided) {
            const storeResult = await browserAPI.runtime.sendMessage({
              action: "createDiscordPairing",
              code,
              username: diceCloudUsername,
              diceCloudUserId
            });
            if (!storeResult.success) {
              throw new Error(storeResult.error || "Failed to create pairing");
            }
          }
          showDiscordPairing(code);
          pairingExpiresAt = Date.now() + 30 * 60 * 1e3;
          startPairingPoll(code);
        } catch (error) {
          debug.error("Discord setup error:", error);
          showDiscordStatus(`Setup failed: ${error.message}`, "error");
          showDiscordNotConnected();
        } finally {
          const setupBtn = document.getElementById("setupDiscordBtn");
          if (setupBtn) {
            setupBtn.disabled = false;
            setupBtn.textContent = "\u{1F3AE} Setup Discord";
          }
        }
      }
      function startPairingPoll(code) {
        const updateCountdown = () => {
          const remaining = Math.max(0, Math.floor((pairingExpiresAt - Date.now()) / 1e3));
          const mins = Math.floor(remaining / 60);
          const secs = remaining % 60;
          const countdownEl = document.getElementById("pairingCountdown");
          if (countdownEl) {
            countdownEl.textContent = `(${mins}:${secs.toString().padStart(2, "0")})`;
          }
          if (remaining <= 0) {
            handleCancelPairing();
            showDiscordStatus("Pairing expired. Please try again.", "error");
          }
        };
        pairingPollInterval = setInterval(async () => {
          updateCountdown();
          try {
            const result = await browserAPI.runtime.sendMessage({
              action: "checkDiscordPairing",
              code
            });
            debug.log("\u{1F4E5} Pairing check result:", {
              success: result.success,
              connected: result.connected,
              hasWebhookUrl: !!result.webhookUrl,
              webhookUrlPreview: result.webhookUrl ? `${result.webhookUrl.substring(0, 50)}...` : "(empty)",
              serverName: result.serverName,
              pairingId: result.pairingId
            });
            if (result.success && result.connected && result.webhookUrl) {
              clearInterval(pairingPollInterval);
              pairingPollInterval = null;
              debug.log("\u{1F517} Saving Discord webhook from pairing:", {
                webhookUrl: result.webhookUrl ? `${result.webhookUrl.substring(0, 50)}...` : "(empty)",
                serverName: result.serverName,
                pairingId: result.pairingId
              });
              const setResult = await browserAPI.runtime.sendMessage({
                action: "setDiscordWebhook",
                webhookUrl: result.webhookUrl,
                enabled: true,
                serverName: result.serverName,
                pairingId: result.pairingId,
                // For command polling
                discordUserId: result.discordUserId
                // Link to auth_tokens
              });
              debug.log("\u{1F4DD} setDiscordWebhook response:", setResult);
              showDiscordConnected(result.serverName);
              showDiscordStatus("Connected to Discord!", "success");
              debug.log("\u{1F504} Re-syncing character to cloud with Discord user ID");
              try {
                await handleSyncCharacterToCloud();
              } catch (e) {
                debug.warn("Could not re-sync character after Discord link:", e);
              }
            }
          } catch (error) {
            debug.error("Pairing poll error:", error);
          }
        }, 3e3);
        updateCountdown();
      }
      function handleCancelPairing() {
        if (pairingPollInterval) {
          clearInterval(pairingPollInterval);
          pairingPollInterval = null;
        }
        showDiscordNotConnected();
      }
      async function handleDisconnectDiscord() {
        try {
          await browserAPI.runtime.sendMessage({
            action: "setDiscordWebhook",
            webhookUrl: "",
            enabled: false
          });
          showDiscordNotConnected();
          showDiscordStatus("Disconnected from Discord", "success");
        } catch (error) {
          debug.error("Disconnect error:", error);
          showDiscordStatus(`Error: ${error.message}`, "error");
        }
      }
      async function handleTestDiscordWebhook() {
        const testBtn = document.getElementById("testDiscordWebhook");
        try {
          testBtn.disabled = true;
          testBtn.textContent = "\u23F3 Testing...";
          const response = await browserAPI.runtime.sendMessage({
            action: "testDiscordWebhook"
          });
          if (response.success) {
            showDiscordStatus("Test sent! Check Discord.", "success");
          } else {
            showDiscordStatus(`Test failed: ${response.error}`, "error");
          }
        } catch (error) {
          debug.error("Discord test error:", error);
          showDiscordStatus(`Error: ${error.message}`, "error");
        } finally {
          testBtn.disabled = false;
          testBtn.textContent = "\u{1F9EA} Test";
        }
      }
      async function handleSaveDiscordWebhook() {
        const webhookUrl = document.getElementById("discordWebhookUrl").value.trim();
        const saveBtn = document.getElementById("saveDiscordWebhook");
        if (!webhookUrl) {
          showDiscordStatus("Please enter a webhook URL", "error");
          return;
        }
        try {
          saveBtn.disabled = true;
          saveBtn.textContent = "\u23F3 Saving...";
          await browserAPI.runtime.sendMessage({
            action: "setDiscordWebhook",
            webhookUrl,
            enabled: true
          });
          showDiscordConnected("Manual Webhook");
          showDiscordStatus("Webhook saved!", "success");
        } catch (error) {
          debug.error("Save webhook error:", error);
          showDiscordStatus(`Error: ${error.message}`, "error");
        } finally {
          saveBtn.disabled = false;
          saveBtn.textContent = "\u{1F4BE} Save Webhook URL";
        }
      }
      async function handleCheckDiscordIntegration() {
        const checkBtn = document.getElementById("checkDiscordIntegration") || document.getElementById("checkDiscordIntegrationNotConnected");
        if (!checkBtn) {
          debug.error("Check Discord integration button not found");
          showDiscordStatus("Error: Button not found", "error");
          return;
        }
        const originalText = checkBtn.textContent;
        try {
          checkBtn.disabled = true;
          checkBtn.textContent = "\u23F3 Checking...";
          const result = await browserAPI.storage.local.get(["activeCharacterId", "characterProfiles"]);
          const activeCharacterId = result.activeCharacterId;
          const characterProfiles = result.characterProfiles || {};
          if (!activeCharacterId || !characterProfiles[activeCharacterId]) {
            showDiscordStatus("No active character found", "error");
            return;
          }
          const currentCharacter = characterProfiles[activeCharacterId];
          debug.log("\u{1F50D} Checking Discord integration for character:", currentCharacter.name);
          const response = await browserAPI.runtime.sendMessage({
            action: "checkDiscordCharacterIntegration",
            characterName: currentCharacter.name,
            characterId: currentCharacter.id
          });
          if (response.success) {
            if (response.found) {
              showDiscordStatus(`\u2705 ${currentCharacter.name} is active in Discord server: ${response.serverName}`, "success");
            } else {
              let message = `\u274C ${currentCharacter.name} is not currently active in any Discord server`;
              if (response.message === "Discord integration not configured") {
                message = `\u274C Discord integration not configured. Please set up Discord integration first.`;
              } else if (response.availableCharacter && response.availableCharacter.name !== currentCharacter.name) {
                message = `\u274C ${currentCharacter.name} is not active. Currently active: ${response.availableCharacter.name} (Level ${response.availableCharacter.level} ${response.availableCharacter.race} ${response.availableCharacter.class})`;
              }
              showDiscordStatus(message, "warning");
            }
          } else {
            showDiscordStatus(`Error checking integration: ${response.error}`, "error");
          }
        } catch (error) {
          debug.error("Check Discord integration error:", error);
          showDiscordStatus(`Error: ${error.message}`, "error");
        } finally {
          if (checkBtn) {
            checkBtn.disabled = false;
            checkBtn.textContent = originalText;
          }
        }
      }
      function showDiscordStatus(message, type) {
        const statusDiv = document.getElementById("discordStatus");
        if (statusDiv) {
          statusDiv.style.display = "block";
          statusDiv.textContent = message;
          statusDiv.style.color = type === "success" ? "#27ae60" : "#e74c3c";
          setTimeout(() => {
            statusDiv.style.display = "none";
          }, 3e3);
        }
      }
      function checkExperimentalBuild() {
        const experimentalIndicators = [
          () => {
            try {
              const manifest = browserAPI.runtime.getManifest();
              return manifest && manifest.name && manifest.name.includes("Experimental");
            } catch (e) {
              debug.log("\u{1F50D} Could not check manifest name:", e);
              return false;
            }
          },
          () => {
            try {
              const manifest = browserAPI.runtime.getManifest();
              const version = manifest && manifest.version;
              if (!version)
                return false;
              const parts = version.split(".");
              return parts.length === 4 && parts[3] === "1";
            } catch (e) {
              debug.log("\u{1F50D} Could not check manifest version:", e);
              return false;
            }
          }
        ];
        Promise.all(experimentalIndicators.map(
          (check) => Promise.resolve(check()).catch(() => false)
        )).then((results) => {
          const isExperimental = results.some((result) => result === true);
          if (isExperimental) {
            const experimentalNotice = document.getElementById("experimentalNotice");
            const versionDisplay = document.getElementById("versionDisplay");
            const experimentalInstructions = document.getElementById("experimentalInstructions");
            if (experimentalNotice) {
              experimentalNotice.classList.remove("hidden");
            }
            if (versionDisplay) {
              try {
                const manifest = browserAPI.runtime.getManifest();
                versionDisplay.textContent = `v${manifest.version} - Experimental Sync`;
              } catch (e) {
                versionDisplay.textContent = "Experimental Sync";
              }
            }
            if (experimentalInstructions) {
              experimentalInstructions.classList.remove("hidden");
            }
            debug.log("\u{1F9EA} Experimental build detected");
          } else {
            debug.log("\u{1F4E6} Standard build detected");
          }
        }).catch((error) => {
          debug.log("\u{1F50D} Error checking experimental build:", error);
          debug.log("\u{1F4E6} Assuming standard build");
        });
      }
    }
  });
})();
//# sourceMappingURL=popup.js.map
