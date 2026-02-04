(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // ../core/src/common/theme-manager.js
  var require_theme_manager = __commonJS({
    "../core/src/common/theme-manager.js"(exports, module) {
      "use strict";
      function createThemeManager(config = {}) {
        const storageKey = config.storageKey || "theme";
        const eventName = config.eventName || "theme-changed";
        return {
          THEMES: {
            LIGHT: "light",
            DARK: "dark",
            SYSTEM: "system"
          },
          currentTheme: "system",
          systemPrefersDark: false,
          /**
           * Initialize theme manager
           */
          async init() {
            debug.log("\u{1F3A8} ThemeManager.init() starting...");
            try {
              if (typeof window === "undefined" || !window.matchMedia) {
                debug.warn("\u26A0\uFE0F window.matchMedia not available, defaulting to light theme");
                this.systemPrefersDark = false;
              } else {
                const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
                this.systemPrefersDark = darkModeQuery.matches;
                debug.log("\u{1F3A8} System dark mode query result:", {
                  matches: darkModeQuery.matches,
                  media: darkModeQuery.media,
                  systemPrefersDark: this.systemPrefersDark
                });
                console.log("\u{1F3A8} THEME DEBUG: Dark mode query matches:", darkModeQuery.matches);
                console.log("\u{1F3A8} THEME DEBUG: systemPrefersDark set to:", this.systemPrefersDark);
                if (darkModeQuery.media === "not all") {
                  debug.warn("\u26A0\uFE0F Dark mode media query not supported, defaulting to light theme");
                  this.systemPrefersDark = false;
                }
                try {
                  darkModeQuery.addEventListener("change", (e) => {
                    this.systemPrefersDark = e.matches;
                    debug.log("\u{1F3A8} System dark mode preference changed:", this.systemPrefersDark);
                    if (this.currentTheme === this.THEMES.SYSTEM) {
                      this.applyTheme(this.THEMES.SYSTEM);
                    }
                  });
                } catch (listenerError) {
                  debug.warn("\u26A0\uFE0F Could not add dark mode change listener:", listenerError);
                }
              }
            } catch (error) {
              debug.error("\u274C Error detecting system theme preference:", error);
              this.systemPrefersDark = false;
            }
            await this.loadThemePreference();
            this.applyTheme(this.currentTheme);
            debug.log("\u{1F3A8} Theme Manager initialized:", {
              currentTheme: this.currentTheme,
              effectiveTheme: this.getEffectiveTheme(this.currentTheme),
              systemPrefersDark: this.systemPrefersDark
            });
          },
          /**
           * Load theme preference from storage
           */
          async loadThemePreference() {
            try {
              if (typeof browserAPI !== "undefined" && browserAPI.storage) {
                const result2 = await browserAPI.storage.local.get(["theme"]);
                if (result2.theme) {
                  this.currentTheme = result2.theme;
                }
              } else if (typeof localStorage !== "undefined") {
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                  this.currentTheme = saved;
                }
              }
            } catch (error) {
              debug.error("Failed to load theme preference:", error);
            }
          },
          /**
           * Save theme preference to storage
           */
          async saveThemePreference(theme) {
            try {
              this.currentTheme = theme;
              if (typeof browserAPI !== "undefined" && browserAPI.storage) {
                await browserAPI.storage.local.set({ theme });
              } else if (typeof localStorage !== "undefined") {
                localStorage.setItem(storageKey, theme);
              }
              debug.log("\u{1F4BE} Theme preference saved:", theme);
            } catch (error) {
              debug.error("Failed to save theme preference:", error);
            }
          },
          /**
           * Apply theme to document
           */
          applyTheme(theme) {
            const effectiveTheme = this.getEffectiveTheme(theme);
            debug.log("\u{1F3A8} Applying theme:", {
              requested: theme,
              effective: effectiveTheme,
              systemPrefersDark: this.systemPrefersDark
            });
            console.log("\u{1F3A8} THEME DEBUG: Applying theme - requested:", theme, "effective:", effectiveTheme, "systemPrefersDark:", this.systemPrefersDark);
            document.documentElement.classList.remove("theme-light", "theme-dark");
            document.documentElement.classList.add(`theme-${effectiveTheme}`);
            document.documentElement.setAttribute("data-theme", effectiveTheme);
            console.log("\u{1F3A8} THEME DEBUG: Applied class:", `theme-${effectiveTheme}`, "to document element");
            console.log("\u{1F3A8} THEME DEBUG: Document classes:", document.documentElement.className);
            debug.log("\u{1F3A8} Theme applied successfully:", effectiveTheme);
          },
          /**
           * Get the effective theme (resolves 'system' to light/dark)
           */
          getEffectiveTheme(theme) {
            if (theme === this.THEMES.SYSTEM) {
              return this.systemPrefersDark ? this.THEMES.DARK : this.THEMES.LIGHT;
            }
            return theme;
          },
          /**
           * Set theme and save preference
           */
          async setTheme(theme) {
            if (!Object.values(this.THEMES).includes(theme)) {
              debug.error("Invalid theme:", theme);
              return;
            }
            await this.saveThemePreference(theme);
            this.applyTheme(theme);
            this.notifyThemeChange(theme);
          },
          /**
           * Notify about theme change (for communication between popup/content scripts)
           */
          notifyThemeChange(theme) {
            if (typeof browserAPI !== "undefined" && browserAPI.runtime) {
              browserAPI.runtime.sendMessage({
                action: "themeChanged",
                theme
              }).catch(() => {
              });
            }
            window.dispatchEvent(new CustomEvent(eventName, {
              detail: { theme }
            }));
          },
          /**
           * Get current theme
           */
          getCurrentTheme() {
            return this.currentTheme;
          },
          /**
           * Get effective theme (with system resolved)
           */
          getEffectiveCurrentTheme() {
            return this.getEffectiveTheme(this.currentTheme);
          },
          /**
           * Force refresh system preference detection
           * Call this if system theme detection seems incorrect
           */
          refreshSystemPreference() {
            try {
              if (window.matchMedia) {
                const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
                const oldValue = this.systemPrefersDark;
                this.systemPrefersDark = darkModeQuery.matches;
                debug.log("\u{1F504} Refreshed system preference:", {
                  oldValue,
                  newValue: this.systemPrefersDark,
                  mediaQuery: darkModeQuery.media,
                  matches: darkModeQuery.matches
                });
                if (this.currentTheme === this.THEMES.SYSTEM) {
                  this.applyTheme(this.THEMES.SYSTEM);
                }
                return this.systemPrefersDark;
              }
            } catch (error) {
              debug.error("\u274C Error refreshing system preference:", error);
            }
            return this.systemPrefersDark;
          }
        };
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = { createThemeManager };
      }
      if (typeof window !== "undefined") {
        window.createThemeManager = createThemeManager;
        if (!window.ThemeManager) {
          window.ThemeManager = createThemeManager({
            storageKey: "carmaclouds-theme",
            eventName: "carmaclouds-theme-changed"
          });
        }
      }
    }
  });

  // ../core/src/common/browser-polyfill.js
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
                chrome.storage.local.get(keys, (result2) => {
                  if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                  } else {
                    resolve(result2);
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

  // src/popup-sheet.js
  var import_theme_manager = __toESM(require_theme_manager(), 1);
  var debug2 = window.debug || {
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
  debug2.log("\u2705 Popup HTML loaded");
  if (typeof import_theme_manager.default !== "undefined") {
    import_theme_manager.default.init().then(() => {
      debug2.log("\u{1F3A8} Theme system initialized");
      const themeButtons = document.querySelectorAll(".theme-btn");
      themeButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const theme = btn.dataset.theme;
          import_theme_manager.default.setTheme(theme);
          themeButtons.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
        });
      });
      const currentTheme = import_theme_manager.default.getCurrentTheme();
      const activeBtn = document.querySelector(`[data-theme="${currentTheme}"]`);
      if (activeBtn) {
        themeButtons.forEach((b) => b.classList.remove("active"));
        activeBtn.classList.add("active");
      }
    });
  } else {
    debug2.warn("\u26A0\uFE0F ThemeManager not available");
  }
  var characterData = null;
  var currentSlotId = null;
  var felineAgilityUsed = false;
  var showCustomMacroButtons = false;
  var domReady = false;
  var pendingOperations = [];
  function hideGMControls() {
    const gmModeContainer = document.querySelector(".gm-mode-container");
    if (gmModeContainer) {
      gmModeContainer.style.display = "none";
      debug2.log("\u{1F451} Hidden GM mode toggle");
    }
    const settingsBtn = document.getElementById("settings-btn");
    if (settingsBtn) {
      settingsBtn.style.display = "none";
      debug2.log("\u{1F451} Hidden settings button");
    }
    const colorPickerContainer = document.querySelector(".color-picker-container");
    if (colorPickerContainer) {
      colorPickerContainer.style.display = "none";
      debug2.log("\u{1F451} Hidden color picker");
    }
    const titleElement = document.querySelector(".char-name-section");
    if (titleElement) {
      titleElement.innerHTML = titleElement.innerHTML.replace("\u{1F3B2} Character Sheet", "\u{1F3B2} Character Sheet (Read Only)");
    }
  }
  window.addEventListener("message", async (event) => {
    debug2.log("\u2705 Received message in popup:", event.data);
    if (event.data && event.data.action === "initCharacterSheet") {
      debug2.log("\u2705 Initializing character sheet with data:", event.data.data.name);
      const isFromGMPanel = event.data.source === "gm-panel";
      if (isFromGMPanel) {
        debug2.log("\u{1F451} Popup opened from GM panel - hiding GM controls");
        hideGMControls();
      }
      const initSheet = async () => {
        characterData = event.data.data;
        currentSlotId = await getActiveCharacterId();
        debug2.log("\u{1F4CB} Current slot ID set to:", currentSlotId);
        await loadAndBuildTabs();
        buildSheet(characterData);
        if (typeof displayCharacterPortrait === "function") {
          displayCharacterPortrait("char-portrait", characterData, 120);
        }
        initRacialTraits();
        initFeatTraits();
        initClassFeatures();
        if (characterData && characterData.id) {
          characterCache.set(characterData.id, JSON.parse(JSON.stringify(characterData)));
          debug2.log(`\u{1F4C2} Initialized cache for character: ${characterData.name}`);
        }
        if (window.opener) {
          window.opener.postMessage({
            action: "registerPopup",
            characterName: event.data.data.name
          }, "*");
          debug2.log(`\u2705 Sent registration message for: ${event.data.data.name}`);
          setTimeout(() => {
            checkCurrentTurnFromChat(event.data.data.name);
          }, 500);
        } else {
          debug2.warn(`\u26A0\uFE0F No window.opener available for: ${event.data.data.name}`);
        }
      };
      if (domReady) {
        await initSheet();
      } else {
        debug2.log("\u23F3 DOM not ready yet, queuing initialization...");
        pendingOperations.push(initSheet);
      }
    } else if (event.data && event.data.action === "loadCharacterData") {
      debug2.log("\u{1F4CB} Loading character data from GM panel:", event.data.characterData.name);
      hideGMControls();
      characterData = event.data.characterData;
      const initSheetFromGM = async () => {
        await loadAndBuildTabs();
        buildSheet(characterData);
        initRacialTraits();
        initFeatTraits();
        initClassFeatures();
        if (characterData && characterData.id) {
          characterCache.set(characterData.id, JSON.parse(JSON.stringify(characterData)));
          debug2.log(`\u{1F4C2} Initialized cache for character: ${characterData.name}`);
        }
      };
      if (domReady) {
        await initSheetFromGM();
      } else {
        debug2.log("\u23F3 DOM not ready yet, queuing GM panel initialization...");
        pendingOperations.push(initSheetFromGM);
      }
    }
  });
  function notifyParentReady() {
    try {
      if (window.opener && !window.opener.closed) {
        debug2.log("\u2705 Sending ready message to parent window...");
        window.opener.postMessage({ action: "popupReady" }, "*");
      } else {
        debug2.warn("\u26A0\uFE0F No parent window available, waiting for postMessage...");
      }
    } catch (error) {
      debug2.warn("\u26A0\uFE0F Could not notify parent (this is normal):", error.message);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", async () => {
      debug2.log("\u2705 DOM is ready");
      domReady = true;
      notifyParentReady();
      for (const operation of pendingOperations) {
        await operation();
      }
      pendingOperations = [];
    });
  } else {
    debug2.log("\u2705 DOM already ready");
    domReady = true;
    notifyParentReady();
  }
  debug2.log("\u2705 Waiting for character data via postMessage...");
  setTimeout(() => {
    if (!characterData && domReady) {
      debug2.log("\u23F1\uFE0F No data received via postMessage, loading from storage...");
      loadCharacterWithTabs();
    } else if (!characterData && !domReady) {
      debug2.log("\u23F3 DOM not ready yet, will retry fallback...");
      setTimeout(() => {
        if (!characterData) {
          debug2.log("\u23F1\uFE0F Retry: Loading from storage...");
          loadCharacterWithTabs();
        }
      }, 500);
    }
  }, 1500);
  async function loadAndBuildTabs() {
    try {
      debug2.log("\u{1F4CB} Loading character profiles for tabs...");
      const profilesResponse = await browserAPI.runtime.sendMessage({ action: "getAllCharacterProfiles" });
      const profiles = profilesResponse.success ? profilesResponse.profiles : {};
      debug2.log("\u{1F4CB} Profiles loaded:", Object.keys(profiles));
      const activeCharacterId = await getActiveCharacterId();
      debug2.log("\u{1F4CB} Active character ID:", activeCharacterId);
      buildCharacterTabs(profiles, activeCharacterId);
    } catch (error) {
      debug2.error("\u274C Failed to load and build tabs:", error);
    }
  }
  async function loadCharacterWithTabs() {
    if (!domReady) {
      debug2.log("\u23F3 DOM not ready, queuing loadCharacterWithTabs...");
      pendingOperations.push(loadCharacterWithTabs);
      return;
    }
    try {
      await loadAndBuildTabs();
      currentSlotId = await getActiveCharacterId();
      debug2.log("\u{1F4CB} Current slot ID set to:", currentSlotId);
      let activeCharacter = null;
      if (currentSlotId && currentSlotId.startsWith("db-")) {
        const characterId = currentSlotId.replace("db-", "");
        try {
          const dbResponse = await browserAPI.runtime.sendMessage({
            action: "getCharacterDataFromDatabase",
            characterId
          });
          if (dbResponse.success) {
            activeCharacter = dbResponse.data;
            debug2.log("\u2705 Loaded character from database:", activeCharacter.name);
          }
        } catch (dbError) {
          debug2.warn("\u26A0\uFE0F Failed to load database character:", dbError);
        }
      } else {
        const activeResponse = await browserAPI.runtime.sendMessage({ action: "getCharacterData" });
        activeCharacter = activeResponse.success ? activeResponse.data : null;
      }
      if (activeCharacter) {
        characterData = activeCharacter;
        buildSheet(characterData);
        if (typeof displayCharacterPortrait === "function") {
          displayCharacterPortrait("char-portrait", characterData, 120);
        }
        initRacialTraits();
        initFeatTraits();
        initClassFeatures();
      } else {
        debug2.error("\u274C No character data found");
      }
    } catch (error) {
      debug2.error("\u274C Failed to load characters:", error);
    }
  }
  async function getActiveCharacterId() {
    const result2 = await browserAPI.storage.local.get(["activeCharacterId"]);
    return result2.activeCharacterId || null;
  }
  function buildCharacterTabs(profiles, activeCharacterId) {
    const tabsContainer = document.getElementById("character-tabs");
    if (!tabsContainer) {
      debug2.warn("\u26A0\uFE0F character-tabs container not found!");
      return;
    }
    debug2.log(`\u{1F3F7}\uFE0F Building character tabs. Active: ${activeCharacterId}`);
    debug2.log(`\u{1F4CB} Profiles:`, Object.keys(profiles));
    tabsContainer.innerHTML = "";
    const maxSlots = 10;
    const databaseCharacters = Object.entries(profiles).filter(
      ([slotId, profile]) => slotId.startsWith("db-") && profile.source === "database"
    );
    databaseCharacters.forEach(([slotId, charInSlot], index) => {
      const isActive = slotId === activeCharacterId;
      debug2.log(`\u{1F310} DB Character: ${charInSlot.name} (active: ${isActive})`);
      const tab = document.createElement("div");
      tab.className = "character-tab database-tab";
      if (isActive) {
        tab.classList.add("active");
      }
      tab.dataset.slotId = slotId;
      tab.innerHTML = `
      <span class="slot-number">\u{1F310}</span>
      <span class="char-name">${charInSlot.name || "Unknown"}</span>
      <span class="char-details">${charInSlot.level || 1} ${charInSlot.class || "Unknown"}</span>
    `;
      tab.addEventListener("click", (e) => {
        debug2.log(`\u{1F5B1}\uFE0F Database tab clicked for ${slotId}`, charInSlot.name);
        switchToCharacter(slotId);
      });
      tabsContainer.appendChild(tab);
    });
    if (databaseCharacters.length > 0) {
      const separator = document.createElement("div");
      separator.className = "tab-separator";
      separator.innerHTML = '<span style="color: var(--text-secondary); font-size: 0.8em;">Local Characters</span>';
      tabsContainer.appendChild(separator);
    }
    for (let slotNum = 1; slotNum <= maxSlots; slotNum++) {
      const slotId = `slot-${slotNum}`;
      const charInSlot = profiles[slotId];
      if (charInSlot) {
        debug2.log(`  \u{1F4CC} Slot ${slotNum}: ${charInSlot.name} (active: ${slotId === activeCharacterId})`);
      }
      const tab = document.createElement("div");
      tab.className = "character-tab";
      tab.dataset.slotId = slotId;
      if (charInSlot) {
        const isActive = slotId === activeCharacterId;
        if (isActive) {
          tab.classList.add("active");
        }
        tab.innerHTML = `
        <span class="slot-number">${slotNum}</span>
        <span class="char-name">${charInSlot.name || "Unknown"}</span>
        <span class="close-tab" title="Clear slot">\u2715</span>
      `;
        tab.addEventListener("click", (e) => {
          debug2.log(`\u{1F5B1}\uFE0F Tab clicked for ${slotId}`, charInSlot.name);
          if (!e.target.classList.contains("close-tab")) {
            switchToCharacter(slotId);
          }
        });
        const closeBtn = tab.querySelector(".close-tab");
        closeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          clearCharacterSlot(slotId, slotNum);
        });
      } else {
        tab.classList.add("empty");
        tab.innerHTML = `
        <span class="slot-number">${slotNum}</span>
        <span class="char-name">Empty Slot</span>
      `;
      }
      tabsContainer.appendChild(tab);
    }
  }
  function checkCurrentTurnFromChat(characterName) {
    try {
      if (!window.opener) {
        debug2.warn("\u26A0\uFE0F No window.opener available for turn check");
        return;
      }
      window.opener.postMessage({
        action: "checkCurrentTurn",
        characterName
      }, "*");
      debug2.log(`\u{1F50D} Requested turn check for: ${characterName}`);
    } catch (error) {
      debug2.warn("\u26A0\uFE0F Error checking current turn:", error);
    }
  }
  async function switchToCharacter(characterId) {
    try {
      debug2.log(`\u{1F504} Switching to character: ${characterId}`);
      if (characterData && currentSlotId && currentSlotId !== characterId) {
        debug2.log("\u{1F4BE} Saving current character data before switching");
        const dataToSave = JSON.parse(JSON.stringify(characterData));
        if (typeof characterCache !== "undefined") {
          characterCache.set(currentSlotId, dataToSave);
          debug2.log(`\u2705 Cached current character data: ${characterData.name}`);
        }
        await browserAPI.runtime.sendMessage({
          action: "storeCharacterData",
          data: dataToSave,
          slotId: currentSlotId
        });
        debug2.log(`\u2705 Saved current character data to storage: ${characterData.name}`);
      }
      await setActiveCharacter(characterId);
      currentSlotId = characterId;
      let newCharacterData = null;
      if (characterId.startsWith("db-")) {
        const dbCharacterId = characterId.replace("db-", "");
        try {
          const dbResponse = await browserAPI.runtime.sendMessage({
            action: "getCharacterDataFromDatabase",
            characterId: dbCharacterId
          });
          if (dbResponse.success) {
            newCharacterData = dbResponse.data;
            debug2.log("\u2705 Loaded database character:", newCharacterData.name);
          } else {
            throw new Error(dbResponse.error || "Failed to load database character");
          }
        } catch (dbError) {
          debug2.error("\u274C Failed to load database character:", dbError);
          showNotification("\u274C Failed to load character from database", "error");
          return;
        }
      } else {
        const response = await browserAPI.runtime.sendMessage({
          action: "getCharacterData",
          characterId
        });
        if (response.success) {
          newCharacterData = response.data;
          debug2.log("\u2705 Loaded local character:", newCharacterData.name);
        } else {
          throw new Error(response.error || "Failed to load local character");
        }
      }
      if (newCharacterData) {
        characterData = newCharacterData;
        if (typeof characterCache !== "undefined") {
          characterCache.set(characterId, characterData);
        }
        buildSheet(characterData);
        if (typeof displayCharacterPortrait === "function") {
          displayCharacterPortrait("char-portrait", characterData, 120);
        }
        initRacialTraits();
        initFeatTraits();
        initClassFeatures();
        debug2.log("\u{1F504} Sending character data update to DiceCloud sync...");
        const channelDivinityResource = characterData.resources?.find(
          (r) => r.name && r.name.toLowerCase().includes("channel divinity")
        );
        const syncMessage = {
          action: "characterUpdate",
          characterId: characterData.id,
          characterName: characterData.name,
          hitPoints: characterData.hitPoints,
          temporaryHP: characterData.temporaryHP,
          spellSlots: characterData.spellSlots,
          channelDivinity: channelDivinityResource ? {
            current: channelDivinityResource.current,
            max: channelDivinityResource.max,
            variableName: channelDivinityResource.variableName || channelDivinityResource.varName
          } : null,
          resources: characterData.resources || [],
          actions: characterData.actions || [],
          deathSaves: characterData.deathSaves,
          inspiration: characterData.inspiration,
          conditions: characterData.conditions || [],
          source: characterData.source || "local"
        };
        try {
          const tabs = await browserAPI.tabs.query({ url: "*://app.roll20.net/*" });
          for (const tab of tabs) {
            browserAPI.tabs.sendMessage(tab.id, syncMessage).catch((err) => {
              debug2.warn(`Failed to send sync to tab ${tab.id}:`, err);
            });
          }
          debug2.log(`\u{1F4E4} Sent character update to ${tabs.length} Roll20 tabs`);
        } catch (syncError) {
          debug2.warn("Failed to send sync to Roll20 tabs:", syncError);
        }
        await loadAndBuildTabs();
        const source = characterData.source || "local";
        const sourceText = source === "database" ? "\u{1F310}" : "\u{1F4BE}";
        showNotification(`${sourceText} Switched to ${characterData.name}`, "success");
        debug2.log(`\u2705 Successfully switched to character: ${characterData.name}`);
      } else {
        throw new Error("No character data available");
      }
    } catch (error) {
      debug2.error("\u274C Failed to switch character:", error);
      showNotification("\u274C Failed to switch character", "error");
    }
  }
  async function clearCharacterSlot(slotId, slotNum) {
    if (!confirm(`Clear slot ${slotNum}? This will remove this character from the slot.`)) {
      return;
    }
    try {
      await browserAPI.runtime.sendMessage({
        action: "clearCharacterData",
        characterId: slotId
      });
      showNotification(`\u2705 Slot ${slotNum} cleared`);
      loadCharacterWithTabs();
    } catch (error) {
      debug2.error("\u274C Failed to clear slot:", error);
      showNotification("\u274C Failed to clear slot", "error");
    }
  }
  var advantageState = "normal";
  document.addEventListener("DOMContentLoaded", () => {
    const shortRestBtn = document.getElementById("short-rest-btn");
    const longRestBtn = document.getElementById("long-rest-btn");
    if (shortRestBtn) {
      shortRestBtn.addEventListener("click", takeShortRest);
    }
    if (longRestBtn) {
      longRestBtn.addEventListener("click", takeLongRest);
    }
    const advantageBtn = document.getElementById("advantage-btn");
    const normalBtn = document.getElementById("normal-btn");
    const disadvantageBtn = document.getElementById("disadvantage-btn");
    if (advantageBtn) {
      advantageBtn.addEventListener("click", () => setAdvantageState("advantage"));
    }
    if (normalBtn) {
      normalBtn.addEventListener("click", () => setAdvantageState("normal"));
    }
    if (disadvantageBtn) {
      disadvantageBtn.addEventListener("click", () => setAdvantageState("disadvantage"));
    }
  });
  async function setActiveCharacter(characterId) {
    try {
      await browserAPI.storage.local.set({
        activeCharacterId: characterId
      });
      console.log(`\u2705 Set active character: ${characterId}`);
    } catch (error) {
      console.error("\u274C Failed to set active character:", error);
    }
  }
  function setAdvantageState(state) {
    advantageState = state;
    const advantageBtn = document.getElementById("advantage-btn");
    const normalBtn = document.getElementById("normal-btn");
    const disadvantageBtn = document.getElementById("disadvantage-btn");
    [advantageBtn, normalBtn, disadvantageBtn].forEach((btn) => {
      if (btn) {
        btn.classList.remove("active");
        const color = btn.id.includes("advantage") ? "var(--accent-success)" : btn.id.includes("normal") ? "#3498db" : "var(--accent-danger)";
        btn.style.background = "transparent";
        btn.style.color = color;
        btn.style.borderColor = color;
      }
    });
    const activeBtn = state === "advantage" ? advantageBtn : state === "normal" ? normalBtn : disadvantageBtn;
    if (activeBtn) {
      activeBtn.classList.add("active");
      const color = state === "advantage" ? "var(--accent-success)" : state === "normal" ? "#3498db" : "var(--accent-danger)";
      activeBtn.style.background = color;
      activeBtn.style.color = "white";
    }
    debug2.log(`\u{1F3B2} Advantage state set to: ${state}`);
    showNotification(`\u{1F3B2} ${state === "advantage" ? "Advantage" : state === "disadvantage" ? "Disadvantage" : "Normal"} rolls selected`);
  }
  function buildSheet(data) {
    debug2.log("Building character sheet...");
    debug2.log("\u{1F4CA} Character data received:", data);
    debug2.log("\u2728 Spell slots data:", data.spellSlots);
    const charNameEl = document.getElementById("char-name");
    if (!charNameEl) {
      debug2.error("\u274C Critical DOM elements not found! DOM may not be ready yet.");
      debug2.log("\u23F3 Queuing buildSheet for when DOM is ready...");
      if (!domReady) {
        pendingOperations.push(() => buildSheet(data));
      } else {
        debug2.log("\u23F1\uFE0F DOM ready but elements missing - retrying in 100ms...");
        setTimeout(() => buildSheet(data), 100);
      }
      return;
    }
    if (data.concentration) {
      concentratingSpell = data.concentration;
      updateConcentrationDisplay();
      debug2.log(`\u{1F9E0} Restored concentration: ${concentratingSpell}`);
    } else {
      concentratingSpell = null;
      updateConcentrationDisplay();
    }
    charNameEl.textContent = data.name || "Character";
    const currentColorEmoji = getColorEmoji(data.notificationColor || "#3498db");
    const colorEmojiEl = document.getElementById("color-emoji");
    if (colorEmojiEl) {
      colorEmojiEl.textContent = currentColorEmoji;
    }
    const colorPaletteEl = document.getElementById("color-palette");
    if (colorPaletteEl) {
      colorPaletteEl.innerHTML = createColorPalette(data.notificationColor || "#3498db");
      colorPaletteEl.style.display = "none";
      colorPaletteEl.style.gridTemplateColumns = "repeat(4, 1fr)";
      colorPaletteEl.style.gap = "10px";
      colorPaletteEl.style.width = "180px";
    }
    initializeHitDice();
    if (data.temporaryHP === void 0) {
      data.temporaryHP = 0;
    }
    if (data.inspiration === void 0) {
      data.inspiration = false;
    }
    if (data.lastRoll === void 0) {
      data.lastRoll = null;
    }
    let raceName = "Unknown";
    if (data.race) {
      if (typeof data.race === "string") {
        raceName = data.race.charAt(0).toUpperCase() + data.race.slice(1);
      } else if (typeof data.race === "object") {
        let raceValue = data.race.value || data.race.name || data.race.text || data.race.variableName || data.race.displayName;
        if (!raceValue) {
          if (data.race.tags && Array.isArray(data.race.tags)) {
            const raceTags = data.race.tags.filter(
              (tag) => !tag.toLowerCase().includes("class") && !tag.toLowerCase().includes("level")
            );
            if (raceTags.length > 0) {
              raceValue = raceTags[0];
            }
          }
          if (!raceValue) {
            const keys = Object.keys(data.race);
            for (const key of keys) {
              if (typeof data.race[key] === "string" && data.race[key].length > 0 && data.race[key].length < 50) {
                raceValue = data.race[key];
                break;
              }
            }
          }
        }
        if (raceValue && typeof raceValue === "string") {
          raceName = raceValue.charAt(0).toUpperCase() + raceValue.slice(1);
        } else {
          debug2.warn("Could not extract race name from object:", data.race);
          raceName = "Unknown Race";
        }
      }
    }
    document.getElementById("char-class").textContent = data.class || "Unknown";
    document.getElementById("char-level").textContent = data.level || 1;
    document.getElementById("char-race").textContent = raceName;
    if (!data.hitDice) {
      data.hitDice = { current: 0, max: 0, type: "d6" };
    }
    document.getElementById("char-hit-dice").textContent = `${data.hitDice.current || 0}/${data.hitDice.max || 0} ${data.hitDice.type || "d6"}`;
    document.getElementById("char-ac").textContent = calculateTotalAC();
    document.getElementById("char-speed").textContent = `${data.speed || 30} ft`;
    document.getElementById("char-proficiency").textContent = `+${data.proficiencyBonus || 0}`;
    const deathSavesDisplay = document.getElementById("death-saves-display");
    const deathSavesValue = document.getElementById("death-saves-value");
    if (!data.deathSaves) {
      data.deathSaves = { successes: 0, failures: 0 };
    }
    deathSavesValue.innerHTML = `
    <span style="color: var(--accent-success);">\u2713${data.deathSaves.successes || 0}</span> /
    <span style="color: var(--accent-danger);">\u2717${data.deathSaves.failures || 0}</span>
  `;
    if (data.deathSaves.successes > 0 || data.deathSaves.failures > 0) {
      deathSavesDisplay.style.background = "var(--bg-action)";
    } else {
      deathSavesDisplay.style.background = "var(--bg-tertiary)";
    }
    const inspirationDisplay = document.getElementById("inspiration-display");
    const inspirationValue = document.getElementById("inspiration-value");
    if (data.inspiration) {
      inspirationValue.textContent = "\u2B50 Active";
      inspirationValue.style.color = "#f57f17";
      inspirationDisplay.style.background = "#fff9c4";
    } else {
      inspirationValue.textContent = "\u2606 None";
      inspirationValue.style.color = "var(--text-muted)";
      inspirationDisplay.style.background = "var(--bg-tertiary)";
    }
    const hpValue = document.getElementById("hp-value");
    if (!data.hitPoints) {
      data.hitPoints = { current: 0, max: 0, temporaryHP: 0 };
    }
    hpValue.textContent = `${data.hitPoints.current}${data.temporaryHP > 0 ? `+${data.temporaryHP}` : ""} / ${data.hitPoints.max}`;
    const initiativeValue = document.getElementById("initiative-value");
    initiativeValue.textContent = `+${data.initiative || 0}`;
    const hpDisplayOld = document.getElementById("hp-display");
    const hpDisplayNew = hpDisplayOld.cloneNode(true);
    hpDisplayOld.parentNode.replaceChild(hpDisplayNew, hpDisplayOld);
    const initiativeOld = document.getElementById("initiative-button");
    const initiativeNew = initiativeOld.cloneNode(true);
    initiativeOld.parentNode.replaceChild(initiativeNew, initiativeOld);
    const deathSavesOld = document.getElementById("death-saves-display");
    const deathSavesNew = deathSavesOld.cloneNode(true);
    deathSavesOld.parentNode.replaceChild(deathSavesNew, deathSavesOld);
    const inspirationOld = document.getElementById("inspiration-display");
    const inspirationNew = inspirationOld.cloneNode(true);
    inspirationOld.parentNode.replaceChild(inspirationNew, inspirationOld);
    hpDisplayNew.addEventListener("click", showHPModal);
    initiativeNew.addEventListener("click", () => {
      const initiativeBonus = data.initiative || 0;
      roll("Initiative", `1d20+${initiativeBonus}`);
    });
    deathSavesNew.addEventListener("click", showDeathSavesModal);
    inspirationNew.addEventListener("click", toggleInspiration);
    const hpPercent = data.hitPoints && data.hitPoints.max > 0 ? data.hitPoints.current / data.hitPoints.max * 100 : 0;
    if (hpPercent > 50) {
      hpDisplayNew.style.background = "var(--accent-success)";
    } else if (hpPercent > 25) {
      hpDisplayNew.style.background = "var(--accent-warning)";
    } else {
      hpDisplayNew.style.background = "var(--accent-danger)";
    }
    buildResourcesDisplay();
    buildSpellSlotsDisplay();
    const abilitiesGrid = document.getElementById("abilities-grid");
    abilitiesGrid.innerHTML = "";
    const abilities = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
    abilities.forEach((ability) => {
      const score = data.attributes?.[ability] || 10;
      const mod = data.attributeMods?.[ability] || 0;
      const card = createCard(ability.substring(0, 3).toUpperCase(), score, `+${mod}`, () => {
        roll(`${ability.charAt(0).toUpperCase() + ability.slice(1)} Check`, `1d20+${mod}`);
      });
      abilitiesGrid.appendChild(card);
    });
    const savesGrid = document.getElementById("saves-grid");
    savesGrid.innerHTML = "";
    abilities.forEach((ability) => {
      const bonus = data.savingThrows?.[ability] || 0;
      const card = createCard(`${ability.substring(0, 3).toUpperCase()}`, `+${bonus}`, "", () => {
        roll(`${ability.toUpperCase()} Save`, `1d20+${bonus}`);
      });
      savesGrid.appendChild(card);
    });
    const skillsGrid = document.getElementById("skills-grid");
    skillsGrid.innerHTML = "";
    const uniqueSkills = /* @__PURE__ */ new Map();
    Object.entries(data.skills || {}).forEach(([skill, bonus]) => {
      const normalizedSkill = skill.toLowerCase().trim();
      if (!uniqueSkills.has(normalizedSkill) || bonus > uniqueSkills.get(normalizedSkill).bonus) {
        uniqueSkills.set(normalizedSkill, { skill, bonus });
      }
    });
    const sortedSkills = Array.from(uniqueSkills.values()).sort(
      (a, b) => a.skill.localeCompare(b.skill)
    );
    sortedSkills.forEach(({ skill, bonus }) => {
      const displayName = skill.charAt(0).toUpperCase() + skill.slice(1).replace(/-/g, " ");
      const card = createCard(displayName, `${bonus >= 0 ? "+" : ""}${bonus}`, "", () => {
        roll(displayName, `1d20${bonus >= 0 ? "+" : ""}${bonus}`);
      });
      skillsGrid.appendChild(card);
    });
    const actionsContainer = document.getElementById("actions-container");
    if (data.actions && Array.isArray(data.actions) && data.actions.length > 0) {
      buildActionsDisplay(actionsContainer, data.actions);
    } else {
      actionsContainer.innerHTML = '<p style="text-align: center; color: #666;">No actions available</p>';
    }
    if (data.companions && Array.isArray(data.companions) && data.companions.length > 0) {
      buildCompanionsDisplay(data.companions);
    } else {
      const companionsSection = document.getElementById("companions-container");
      if (companionsSection) {
        companionsSection.style.display = "none";
      }
    }
    const inventoryContainer = document.getElementById("inventory-container");
    if (data.inventory && Array.isArray(data.inventory) && data.inventory.length > 0) {
      buildInventoryDisplay(inventoryContainer, data.inventory);
    } else {
      inventoryContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No items in inventory</p>';
    }
    const spellsContainer = document.getElementById("spells-container");
    if (data.spells && Array.isArray(data.spells) && data.spells.length > 0) {
      buildSpellsBySource(spellsContainer, data.spells);
      expandSectionByContainerId("spells-container");
    } else {
      spellsContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No spells prepared</p>';
      collapseSectionByContainerId("spells-container");
    }
    if (data.activeEffects) {
      activeBuffs = data.activeEffects.buffs || [];
      activeConditions = data.activeEffects.debuffs || [];
      debug2.log("\u2705 Restored active effects:", { buffs: activeBuffs, debuffs: activeConditions });
    } else {
      activeBuffs = [];
      activeConditions = [];
    }
    if (data.conditions && Array.isArray(data.conditions) && data.conditions.length > 0) {
      debug2.log("\u2728 Syncing conditions from Dicecloud:", data.conditions);
      data.conditions.forEach((condition2) => {
        const conditionName = condition2.name;
        const isPositive = POSITIVE_EFFECTS.some((e) => e.name === conditionName);
        const isNegative = NEGATIVE_EFFECTS.some((e) => e.name === conditionName);
        if (isPositive && !activeBuffs.includes(conditionName)) {
          activeBuffs.push(conditionName);
          debug2.log(`  \u2705 Added buff from Dicecloud: ${conditionName}`);
        } else if (isNegative && !activeConditions.includes(conditionName)) {
          activeConditions.push(conditionName);
          debug2.log(`  \u2705 Added debuff from Dicecloud: ${conditionName}`);
        }
      });
    }
    updateEffectsDisplay();
    initColorPalette();
    initializeFilters();
    debug2.log("\u2705 Sheet built successfully");
  }
  function buildSpellsBySource(container, spells) {
    debug2.log(`\u{1F4DA} buildSpellsBySource called with ${spells.length} spells`);
    debug2.log(`\u{1F4DA} Spell names: ${spells.map((s) => s.name).join(", ")}`);
    const eldritchBlast = spells.find((s) => s.name && s.name.toLowerCase().includes("eldritch blast"));
    if (eldritchBlast) {
      console.log("\u26A1 ELDRITCH BLAST DATA IN POPUP:", {
        name: eldritchBlast.name,
        attackRoll: eldritchBlast.attackRoll,
        damageRolls: eldritchBlast.damageRolls,
        damageRollsLength: eldritchBlast.damageRolls ? eldritchBlast.damageRolls.length : "undefined",
        damageRollsJSON: JSON.stringify(eldritchBlast.damageRolls)
      });
    }
    let filteredSpells = spells.filter((spell) => {
      const spellName = (spell.name || "").toLowerCase();
      if (spellName.includes("divine smite")) {
        if (spellName !== "divine smite" && !spellName.match(/^divine smite$/)) {
          debug2.log(`\u23ED\uFE0F Filtering out duplicate Divine Smite spell: ${spell.name}`);
          return false;
        } else {
          debug2.log(`\u2705 Keeping main Divine Smite spell: ${spell.name}`);
        }
      }
      if (spellFilters.level !== "all") {
        const spellLevel = parseInt(spell.level) || 0;
        if (spellLevel.toString() !== spellFilters.level) {
          return false;
        }
      }
      if (spellFilters.category !== "all") {
        const category = categorizeSpell(spell);
        if (category !== spellFilters.category) {
          return false;
        }
      }
      if (spellFilters.castingTime !== "all") {
        const castingTime = (spell.castingTime || "").toLowerCase();
        if (spellFilters.castingTime === "action") {
          if (!castingTime.includes("action") || castingTime.includes("bonus") || castingTime.includes("reaction")) {
            return false;
          }
        }
        if (spellFilters.castingTime === "bonus" && !castingTime.includes("bonus")) {
          return false;
        }
        if (spellFilters.castingTime === "reaction" && !castingTime.includes("reaction")) {
          return false;
        }
      }
      if (spellFilters.search) {
        const searchLower = spellFilters.search;
        const name = (spell.name || "").toLowerCase();
        const desc = (spell.description || "").toLowerCase();
        if (!name.includes(searchLower) && !desc.includes(searchLower)) {
          return false;
        }
      }
      return true;
    });
    debug2.log(`\u{1F50D} Filtered ${spells.length} spells to ${filteredSpells.length} spells`);
    const spellsByLevel = {};
    filteredSpells.forEach((spell, index) => {
      spell.index = index;
      const spellLevel = parseInt(spell.level) || 0;
      const levelKey = spellLevel === 0 ? "Cantrips" : `Level ${spellLevel} Spells`;
      if (!spellsByLevel[levelKey]) {
        spellsByLevel[levelKey] = [];
      }
      spellsByLevel[levelKey].push(spell);
    });
    container.innerHTML = "";
    const sortedLevels = Object.keys(spellsByLevel).sort((a, b) => {
      if (a === "Cantrips")
        return -1;
      if (b === "Cantrips")
        return 1;
      return a.localeCompare(b, void 0, { numeric: true });
    });
    sortedLevels.forEach((levelKey) => {
      const levelSection = document.createElement("div");
      levelSection.style.cssText = "margin-bottom: 20px;";
      const levelHeader = document.createElement("h4");
      levelHeader.textContent = `\u{1F4DA} ${levelKey}`;
      levelHeader.style.cssText = "color: #2c3e50; margin-bottom: 10px; padding: 5px; background: #ecf0f1; border-radius: 4px;";
      levelSection.appendChild(levelHeader);
      const sortedSpells = spellsByLevel[levelKey].sort((a, b) => {
        return (a.name || "").localeCompare(b.name || "");
      });
      const deduplicatedSpells = [];
      const spellsByName = {};
      debug2.log(`\u{1F4DA} Deduplicating ${sortedSpells.length} spells in ${levelKey}`);
      sortedSpells.forEach((spell) => {
        const spellName = spell.name || "Unnamed Spell";
        if (!spellsByName[spellName]) {
          spellsByName[spellName] = spell;
          deduplicatedSpells.push(spell);
          debug2.log(`\u{1F4DA} First occurrence: "${spellName}"`);
        } else {
          const existingSpell = spellsByName[spellName];
          debug2.log(`\u{1F4DA} Found duplicate: "${spellName}" - combining sources`);
          if (spell.source && !existingSpell.source.includes(spell.source)) {
            existingSpell.source += "; " + spell.source;
            debug2.log(`\u{1F4DA} Combined duplicate spell "${spellName}": ${existingSpell.source}`);
          }
        }
      });
      debug2.log(`\u{1F4DA} After deduplication: ${deduplicatedSpells.length} unique spells in ${levelKey}`);
      deduplicatedSpells.forEach((spell) => {
        const spellCard = createSpellCard(spell, spell.index);
        levelSection.appendChild(spellCard);
      });
      container.appendChild(levelSection);
    });
  }
  var sneakAttackEnabled = false;
  var sneakAttackDamage = "";
  var elementalWeaponEnabled = false;
  var elementalWeaponDamage = "1d4";
  var actionFilters = {
    actionType: "all",
    category: "all",
    search: ""
  };
  var spellFilters = {
    level: "all",
    category: "all",
    castingTime: "all",
    search: ""
  };
  var inventoryFilters = {
    filter: "equipped",
    // all, equipped, attuned, container
    search: ""
  };
  function categorizeAction(action) {
    const name = (action.name || "").toLowerCase();
    const damageType = (action.damageType || "").toLowerCase();
    if (damageType.includes("heal") || name.includes("heal") || name.includes("cure")) {
      return "healing";
    }
    if (action.damage && action.damage.includes("d")) {
      return "damage";
    }
    return "utility";
  }
  function categorizeSpell(spell) {
    if (spell.damageRolls && Array.isArray(spell.damageRolls) && spell.damageRolls.length > 0) {
      const hasHealing = spell.damageRolls.some(
        (roll2) => roll2.damageType && roll2.damageType.toLowerCase() === "healing"
      );
      const hasDamage = spell.damageRolls.some(
        (roll2) => !roll2.damageType || roll2.damageType.toLowerCase() !== "healing"
      );
      if (hasHealing && !hasDamage) {
        return "healing";
      } else if (hasDamage) {
        return "damage";
      }
    }
    if (spell.attackRoll && spell.attackRoll !== "(none)") {
      return "damage";
    }
    return "utility";
  }
  function initializeFilters() {
    const actionsSearch = document.getElementById("actions-search");
    if (actionsSearch) {
      actionsSearch.addEventListener("input", (e) => {
        actionFilters.search = e.target.value.toLowerCase();
        rebuildActions();
      });
    }
    document.querySelectorAll('[data-type="action-type"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        actionFilters.actionType = btn.dataset.filter;
        document.querySelectorAll('[data-type="action-type"]').forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        rebuildActions();
      });
    });
    document.querySelectorAll('[data-type="action-category"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        actionFilters.category = btn.dataset.filter;
        document.querySelectorAll('[data-type="action-category"]').forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        rebuildActions();
      });
    });
    const spellsSearch = document.getElementById("spells-search");
    if (spellsSearch) {
      spellsSearch.addEventListener("input", (e) => {
        spellFilters.search = e.target.value.toLowerCase();
        rebuildSpells();
      });
    }
    document.querySelectorAll('[data-type="spell-level"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        spellFilters.level = btn.dataset.filter;
        document.querySelectorAll('[data-type="spell-level"]').forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        rebuildSpells();
      });
    });
    document.querySelectorAll('[data-type="spell-category"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        spellFilters.category = btn.dataset.filter;
        document.querySelectorAll('[data-type="spell-category"]').forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        rebuildSpells();
      });
    });
    document.querySelectorAll('[data-type="spell-casting-time"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        spellFilters.castingTime = btn.dataset.filter;
        document.querySelectorAll('[data-type="spell-casting-time"]').forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        rebuildSpells();
      });
    });
    const inventorySearch = document.getElementById("inventory-search");
    if (inventorySearch) {
      inventorySearch.addEventListener("input", (e) => {
        inventoryFilters.search = e.target.value.toLowerCase();
        rebuildInventory();
      });
    }
    document.querySelectorAll('[data-type="inventory-filter"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        inventoryFilters.filter = btn.dataset.filter;
        document.querySelectorAll('[data-type="inventory-filter"]').forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        rebuildInventory();
      });
    });
  }
  function rebuildActions() {
    if (!characterData || !characterData.actions)
      return;
    const container = document.getElementById("actions-container");
    buildActionsDisplay(container, characterData.actions);
  }
  function rebuildSpells() {
    if (!characterData || !characterData.spells)
      return;
    const container = document.getElementById("spells-container");
    buildSpellsBySource(container, characterData.spells);
  }
  function rebuildInventory() {
    if (!characterData || !characterData.inventory)
      return;
    const container = document.getElementById("inventory-container");
    buildInventoryDisplay(container, characterData.inventory);
  }
  function getActionOptions(action) {
    const options = [];
    if (action.attackRoll) {
      let formula2 = action.attackRoll;
      if (typeof formula2 === "number" || !formula2.includes("d20")) {
        const bonus = parseInt(formula2);
        formula2 = bonus >= 0 ? `1d20+${bonus}` : `1d20${bonus}`;
      }
      options.push({
        type: "attack",
        label: "\u{1F3AF} Attack",
        formula: formula2,
        icon: "\u{1F3AF}",
        color: "#e74c3c"
      });
    }
    const isValidDiceFormula = action.damage && (/\d*d\d+/.test(action.damage) || /\d*d\d+/.test(action.damage.replace(/\s*\+\s*/g, "+")));
    debug2.log(`\u{1F3B2} Action "${action.name}" damage check:`, {
      damage: action.damage,
      isValid: isValidDiceFormula,
      attackRoll: action.attackRoll
    });
    if (isValidDiceFormula) {
      const isHealing = action.damageType && action.damageType.toLowerCase().includes("heal");
      const isTempHP = action.damageType && (action.damageType.toLowerCase() === "temphp" || action.damageType.toLowerCase() === "temporary" || action.damageType.toLowerCase().includes("temp"));
      let btnText;
      if (isHealing) {
        btnText = "\u{1F49A} Heal";
      } else if (action.actionType === "feature" || !action.attackRoll) {
        btnText = "\u{1F3B2} Roll";
      } else {
        btnText = "\u{1F4A5} Damage";
      }
      options.push({
        type: isHealing ? "healing" : isTempHP ? "temphp" : "damage",
        label: btnText,
        formula: action.damage,
        icon: isTempHP ? "\u{1F6E1}\uFE0F" : isHealing ? "\u{1F49A}" : "\u{1F4A5}",
        color: isTempHP ? "#3498db" : isHealing ? "#27ae60" : "#e67e22"
      });
    }
    let edgeCaseResult;
    if (isClassFeatureEdgeCase(action.name)) {
      edgeCaseResult = applyClassFeatureEdgeCaseModifications(action, options);
      debug2.log(`\u{1F50D} Edge case applied for "${action.name}": skipNormalButtons = ${edgeCaseResult.skipNormalButtons}`);
    } else if (isRacialFeatureEdgeCase(action.name)) {
      edgeCaseResult = applyRacialFeatureEdgeCaseModifications(action, options);
      debug2.log(`\u{1F50D} Edge case applied for "${action.name}": skipNormalButtons = ${edgeCaseResult.skipNormalButtons}`);
    } else if (isCombatManeuverEdgeCase(action.name)) {
      edgeCaseResult = applyCombatManeuverEdgeCaseModifications(action, options);
      debug2.log(`\u{1F50D} Edge case applied for "${action.name}": skipNormalButtons = ${edgeCaseResult.skipNormalButtons}`);
    } else {
      edgeCaseResult = { options, skipNormalButtons: false };
      debug2.log(`\u{1F50D} No edge case for "${action.name}": skipNormalButtons = false`);
    }
    return edgeCaseResult;
  }
  function buildActionsDisplay(container, actions) {
    container.innerHTML = "";
    debug2.log("\u{1F50D} buildActionsDisplay called with actions:", actions.map((a) => ({ name: a.name, damage: a.damage, actionType: a.actionType })));
    const deduplicatedActions = [];
    const actionsByName = {};
    const sortedActions = [...actions].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    sortedActions.forEach((action) => {
      const actionName = (action.name || "").trim();
      if (!actionName) {
        debug2.log("\u26A0\uFE0F Skipping action with no name");
        return;
      }
      if (!actionsByName[actionName]) {
        actionsByName[actionName] = action;
        deduplicatedActions.push(action);
        debug2.log(`\u{1F4DD} First occurrence of action: "${actionName}"`);
      } else {
        const existingAction = actionsByName[actionName];
        if (action.source && !existingAction.source.includes(action.source)) {
          existingAction.source = existingAction.source ? existingAction.source + "; " + action.source : action.source;
          debug2.log(`\u{1F4DD} Combined duplicate action "${actionName}": ${existingAction.source}`);
        }
        if (action.description && action.description !== existingAction.description) {
          existingAction.description = existingAction.description ? existingAction.description + "\n\n" + action.description : action.description;
          debug2.log(`\u{1F4DD} Combined descriptions for "${actionName}"`);
        }
        if (action.uses && !existingAction.uses) {
          existingAction.uses = action.uses;
          debug2.log(`\u{1F4DD} Added uses to "${actionName}"`);
        }
        if (action.damage && !existingAction.damage) {
          existingAction.damage = action.damage;
          debug2.log(`\u{1F4DD} Added damage to "${actionName}"`);
        }
        if (action.attackRoll && !existingAction.attackRoll) {
          existingAction.attackRoll = action.attackRoll;
          debug2.log(`\u{1F4DD} Added attackRoll to "${actionName}"`);
        }
        debug2.log(`\u{1F504} Merged duplicate action: "${actionName}"`);
      }
    });
    debug2.log(`\u{1F4CA} Deduplicated ${actions.length} actions to ${deduplicatedActions.length} unique actions`);
    let filteredActions = deduplicatedActions.filter((action) => {
      const actionName = (action.name || "").toLowerCase();
      if (actionName.includes("divine smite")) {
        if (actionName !== "divine smite" && !actionName.match(/^divine smite$/)) {
          debug2.log(`\u23ED\uFE0F Filtering out duplicate Divine Smite entry: ${action.name}`);
          return false;
        } else {
          debug2.log(`\u2705 Keeping main Divine Smite entry: ${action.name}`);
        }
      }
      if (actionName.includes("lay on hands")) {
        const normalizedActionName = action.name.toLowerCase().replace(/[^a-z0-9\s:]/g, "").replace(/\s+/g, " ").trim();
        const normalizedSearch = "lay on hands: heal";
        debug2.log(`\u{1F50D} Found Lay on Hands action: "${action.name}"`);
        debug2.log(`\u{1F50D} Normalized action name: "${normalizedActionName}"`);
        debug2.log(`\u{1F50D} Normalized search term: "${normalizedSearch}"`);
        debug2.log(`\u{1F50D} Do they match? ${normalizedActionName === normalizedSearch}`);
        debug2.log(`\u{1F50D} Action object:`, action);
      }
      if (actionFilters.actionType !== "all") {
        const actionType = (action.actionType || "").toLowerCase();
        if (actionType !== actionFilters.actionType) {
          return false;
        }
      }
      if (actionFilters.category !== "all") {
        const category = categorizeAction(action);
        if (category !== actionFilters.category) {
          return false;
        }
      }
      if (actionFilters.search) {
        const searchLower = actionFilters.search;
        const name = (action.name || "").toLowerCase();
        const desc = (action.description || "").toLowerCase();
        if (!name.includes(searchLower) && !desc.includes(searchLower)) {
          return false;
        }
      }
      return true;
    });
    debug2.log(`\u{1F50D} Filtered ${deduplicatedActions.length} actions to ${filteredActions.length} actions`);
    const sneakAttackAction = deduplicatedActions.find(
      (a) => a.name === "Sneak Attack" || a.name.toLowerCase().includes("sneak attack")
    );
    debug2.log("\u{1F3AF} Sneak Attack search result:", sneakAttackAction);
    if (sneakAttackAction && sneakAttackAction.damage) {
      sneakAttackDamage = sneakAttackAction.damage;
      const resolvedDamage = resolveVariablesInFormula(sneakAttackDamage);
      debug2.log(`\u{1F3AF} Sneak Attack damage: "${sneakAttackDamage}" resolved to "${resolvedDamage}"`);
      const toggleSection = document.createElement("div");
      toggleSection.style.cssText = "background: #2c3e50; color: white; padding: 10px; border-radius: 5px; margin-bottom: 10px; display: flex; align-items: center; gap: 10px;";
      const toggleLabel = document.createElement("label");
      toggleLabel.style.cssText = "display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: bold;";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = "sneak-attack-toggle";
      checkbox.checked = sneakAttackEnabled;
      checkbox.style.cssText = "width: 18px; height: 18px; cursor: pointer;";
      checkbox.addEventListener("change", (e) => {
        sneakAttackEnabled = e.target.checked;
        debug2.log(`\u{1F3AF} Sneak Attack toggle on our sheet: ${sneakAttackEnabled ? "ON" : "OFF"} (independent of DiceCloud)`);
      });
      const labelText = document.createElement("span");
      labelText.textContent = `Add Sneak Attack (${resolvedDamage}) to weapon damage`;
      toggleLabel.appendChild(checkbox);
      toggleLabel.appendChild(labelText);
      toggleSection.appendChild(toggleLabel);
      container.appendChild(toggleSection);
    }
    const hasElementalWeapon = characterData.spells && characterData.spells.some(
      (s) => s.name === "Elemental Weapon" || s.spell && s.spell.name === "Elemental Weapon"
    );
    if (hasElementalWeapon) {
      debug2.log(`\u2694\uFE0F Elemental Weapon spell found, adding toggle`);
      const elementalToggleSection = document.createElement("div");
      elementalToggleSection.style.cssText = "background: #8b4513; color: white; padding: 10px; border-radius: 5px; margin-bottom: 10px; display: flex; align-items: center; gap: 10px;";
      const elementalToggleLabel = document.createElement("label");
      elementalToggleLabel.style.cssText = "display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: bold;";
      const elementalCheckbox = document.createElement("input");
      elementalCheckbox.type = "checkbox";
      elementalCheckbox.id = "elemental-weapon-toggle";
      elementalCheckbox.checked = elementalWeaponEnabled;
      elementalCheckbox.style.cssText = "width: 18px; height: 18px; cursor: pointer;";
      elementalCheckbox.addEventListener("change", (e) => {
        elementalWeaponEnabled = e.target.checked;
        debug2.log(`\u2694\uFE0F Elemental Weapon toggle: ${elementalWeaponEnabled ? "ON" : "OFF"}`);
      });
      const elementalLabelText = document.createElement("span");
      elementalLabelText.textContent = `Add Elemental Weapon (${elementalWeaponDamage}) to weapon damage`;
      elementalToggleLabel.appendChild(elementalCheckbox);
      elementalToggleLabel.appendChild(elementalLabelText);
      elementalToggleSection.appendChild(elementalToggleLabel);
      container.appendChild(elementalToggleSection);
    }
    const hasLuckyFeat = characterData.features && characterData.features.some(
      (f) => f.name && f.name.toLowerCase().includes("lucky")
    );
    if (hasLuckyFeat) {
      debug2.log(`\u{1F396}\uFE0F Lucky feat found, adding action button`);
      const luckyActionSection = document.createElement("div");
      luckyActionSection.style.cssText = "background: #f39c12; color: white; padding: 12px; border-radius: 5px; margin-bottom: 10px;";
      const luckyButton = document.createElement("button");
      luckyButton.id = "lucky-action-button";
      luckyButton.style.cssText = `
      background: #e67e22;
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      width: 100%;
      transition: background 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    `;
      luckyButton.onmouseover = () => luckyButton.style.background = "#d35400";
      luckyButton.onmouseout = () => luckyButton.style.background = "#e67e22";
      const luckyResource = getLuckyResource();
      const luckPointsAvailable = luckyResource ? luckyResource.current : 0;
      luckyButton.innerHTML = `
      <span style="font-size: 16px;">\u{1F396}\uFE0F</span>
      <span>Use Lucky Point (${luckPointsAvailable}/3)</span>
    `;
      luckyButton.addEventListener("click", () => {
        const currentLuckyResource = getLuckyResource();
        if (!currentLuckyResource || currentLuckyResource.current <= 0) {
          showNotification("\u274C No luck points available!", "error");
          return;
        }
        showLuckyModal();
      });
      luckyActionSection.appendChild(luckyButton);
      container.appendChild(luckyActionSection);
    }
    filteredActions.forEach((action, index) => {
      if ((action.name === "Sneak Attack" || action.name.toLowerCase().includes("sneak attack")) && action.actionType === "feature") {
        debug2.log("\u23ED\uFE0F Skipping standalone Sneak Attack button (using toggle instead)");
        return;
      }
      if (action.damage && action.attackRoll && sneakAttackDamage) {
        const sneakPattern = new RegExp(`\\+?${sneakAttackDamage.replace(/[+\-]/g, "")}`, "g");
        const cleanedDamage = action.damage.replace(sneakPattern, "");
        if (cleanedDamage !== action.damage) {
          debug2.log(`\u{1F9F9} Cleaned weapon damage: "${action.damage}" -> "${cleanedDamage}"`);
          action.damage = cleanedDamage;
        }
      }
      const actionCard = document.createElement("div");
      actionCard.className = "action-card";
      const actionHeader = document.createElement("div");
      actionHeader.className = "action-header";
      const nameDiv = document.createElement("div");
      nameDiv.className = "action-name";
      let nameText = action.name;
      if (nameText === "Recover Spell Slot") {
        nameText = "Harness Divine Power";
      }
      if (action.uses) {
        const usesTotal = action.uses.total || action.uses.value || action.uses;
        const usesRemaining = action.usesLeft !== void 0 ? action.usesLeft : usesTotal - (action.usesUsed || 0);
        nameText += ` <span class="uses-badge">${usesRemaining}/${usesTotal} uses</span>`;
      }
      nameDiv.innerHTML = nameText;
      const buttonsDiv = document.createElement("div");
      buttonsDiv.className = "action-buttons";
      const actionOptionsResult = getActionOptions(action);
      const actionOptions = actionOptionsResult.options;
      if (actionOptionsResult.skipNormalButtons) {
        const actionBtn = document.createElement("button");
        actionBtn.className = "action-btn";
        actionBtn.textContent = "\u2728 Use";
        actionBtn.style.cssText = `
        background: #9b59b6;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
      `;
        actionBtn.addEventListener("click", () => {
          if (action.name.toLowerCase().includes("divine smite")) {
            showDivineSmiteModal(action);
            return;
          }
          const normalizedActionName = action.name.toLowerCase().replace(/[^a-z0-9\s:]/g, "").replace(/\s+/g, " ").trim();
          const normalizedSearch = "lay on hands: heal";
          if (normalizedActionName === normalizedSearch) {
            debug2.log(`\u{1F49A} Lay on Hands: Heal action clicked: ${action.name}, showing custom modal`);
            debug2.log(`\u{1F49A} Normalized match: "${normalizedActionName}" === "${normalizedSearch}"`);
            const layOnHandsPool = getLayOnHandsResource();
            if (layOnHandsPool) {
              showLayOnHandsModal(layOnHandsPool);
            } else {
              showNotification("\u274C No Lay on Hands pool resource found", "error");
            }
            return;
          }
          if (action.name.toLowerCase().includes("lay on hands")) {
            debug2.log(`\u{1F6A8} FALLBACK: Caught Lay on Hands action: "${action.name}"`);
            debug2.log(`\u{1F6A8} This action didn't match 'lay on hands: heal' but contains 'lay on hands'`);
            debug2.log(`\u{1F6A8} Showing modal anyway for debugging`);
            const layOnHandsPool = getLayOnHandsResource();
            if (layOnHandsPool) {
              showLayOnHandsModal(layOnHandsPool);
            } else {
              showNotification("\u274C No Lay on Hands pool resource found", "error");
            }
            return;
          }
          if (action.uses && !decrementActionUses(action)) {
            return;
          }
          if (!decrementActionResources(action)) {
            return;
          }
          announceAction(action);
        });
        buttonsDiv.appendChild(actionBtn);
      } else {
        actionOptions.forEach((option, optionIndex) => {
          const actionBtn = document.createElement("button");
          actionBtn.className = `${option.type}-btn`;
          const edgeCaseNote = option.edgeCaseNote ? `<div style="font-size: 0.7em; color: #666; margin-top: 1px;">${option.edgeCaseNote}</div>` : "";
          actionBtn.innerHTML = `${option.label}${edgeCaseNote}`;
          actionBtn.style.cssText = `
          background: ${option.color};
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: bold;
          margin-right: 4px;
          margin-bottom: 4px;
        `;
          actionBtn.addEventListener("click", () => {
            if (action.name.toLowerCase().includes("divine smite")) {
              showDivineSmiteModal(action);
              return;
            }
            const normalizedActionName = action.name.toLowerCase().replace(/[^a-z0-9\s:]/g, "").replace(/\s+/g, " ").trim();
            const normalizedSearch = "lay on hands: heal";
            if (normalizedActionName === normalizedSearch) {
              debug2.log(`\u{1F49A} Lay on Hands: Heal action clicked: ${action.name}, showing custom modal`);
              debug2.log(`\u{1F49A} Normalized match: "${normalizedActionName}" === "${normalizedSearch}"`);
              const layOnHandsPool = getLayOnHandsResource();
              if (layOnHandsPool) {
                showLayOnHandsModal(layOnHandsPool);
              } else {
                showNotification("\u274C No Lay on Hands pool resource found", "error");
              }
              return;
            }
            if (action.name.toLowerCase().includes("lay on hands")) {
              debug2.log(`\u{1F6A8} FALLBACK: Caught Lay on Hands action: "${action.name}"`);
              debug2.log(`\u{1F6A8} This action didn't match 'lay on hands: heal' but contains 'lay on hands'`);
              debug2.log(`\u{1F6A8} Showing modal anyway for debugging`);
              const layOnHandsPool = getLayOnHandsResource();
              if (layOnHandsPool) {
                showLayOnHandsModal(layOnHandsPool);
              } else {
                showNotification("\u274C No Lay on Hands pool resource found", "error");
              }
              return;
            }
            if (option.type === "attack") {
              markActionAsUsed("action");
              let attackFormula = option.formula;
              if (sneakAttackEnabled && sneakAttackDamage && action.attackRoll) {
                attackFormula += `+${sneakAttackDamage}`;
                debug2.log(`\u{1F3AF} Adding Sneak Attack to ${action.name}: ${attackFormula}`);
              }
              if (elementalWeaponEnabled && elementalWeaponDamage && action.attackRoll) {
                attackFormula += `+${elementalWeaponDamage}`;
                debug2.log(`\u2694\uFE0F Adding Elemental Weapon to ${action.name}: ${attackFormula}`);
              }
              roll(`${action.name} Attack`, attackFormula);
            } else if (option.type === "healing" || option.type === "temphp" || option.type === "damage") {
              if (action.uses && !decrementActionUses(action)) {
                return;
              }
              const kiCost = getKiCostFromAction(action);
              if (kiCost > 0) {
                const kiResource = getKiPointsResource();
                if (!kiResource) {
                  showNotification(`\u274C No Ki Points resource found`, "error");
                  return;
                }
                if (kiResource.current < kiCost) {
                  showNotification(`\u274C Not enough Ki Points! Need ${kiCost}, have ${kiResource.current}`, "error");
                  return;
                }
                kiResource.current -= kiCost;
                saveCharacterData();
                debug2.log(`\u2728 Used ${kiCost} Ki points for ${action.name}. Remaining: ${kiResource.current}/${kiResource.max}`);
                showNotification(`\u2728 ${action.name}! (${kiResource.current}/${kiResource.max} Ki left)`);
                buildSheet(characterData);
              }
              const sorceryCost = getSorceryPointCostFromAction(action);
              if (sorceryCost > 0) {
                const sorceryResource = getSorceryPointsResource();
                if (!sorceryResource) {
                  showNotification(`\u274C No Sorcery Points resource found`, "error");
                  return;
                }
                if (sorceryResource.current < sorceryCost) {
                  showNotification(`\u274C Not enough Sorcery Points! Need ${sorceryCost}, have ${sorceryResource.current}`, "error");
                  return;
                }
                sorceryResource.current -= sorceryCost;
                saveCharacterData();
                debug2.log(`\u2728 Used ${sorceryCost} Sorcery Points for ${action.name}. Remaining: ${sorceryResource.current}/${sorceryResource.max}`);
                showNotification(`\u2728 ${action.name}! (${sorceryResource.current}/${sorceryResource.max} SP left)`);
                buildSheet(characterData);
              }
              if (!decrementActionResources(action)) {
                return;
              }
              if (action.description && !action.attackRoll) {
                announceAction(action);
              }
              const rollType = option.type === "healing" ? "Healing" : option.type === "temphp" ? "Temp HP" : "Damage";
              roll(`${action.name} ${rollType}`, option.formula);
            }
          });
          buttonsDiv.appendChild(actionBtn);
        });
      }
      if (actionOptions.length === 0 && !actionOptionsResult.skipNormalButtons) {
        const useBtn = document.createElement("button");
        useBtn.className = "use-btn";
        useBtn.textContent = "\u2728 Use";
        useBtn.style.cssText = `
        background: #9b59b6;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
      `;
        useBtn.addEventListener("click", () => {
          if (action.name === "Divine Spark") {
            const channelDivinityResource = characterData.resources?.find(
              (r) => r.name === "Channel Divinity" || r.variableName === "channelDivinityCleric" || r.variableName === "channelDivinityPaladin" || r.variableName === "channelDivinity"
            );
            if (!channelDivinityResource) {
              showNotification("\u274C No Channel Divinity resource found", "error");
              return;
            }
            if (channelDivinityResource.current <= 0) {
              showNotification("\u274C No Channel Divinity uses remaining!", "error");
              return;
            }
            showDivineSparkModal(action, channelDivinityResource);
            return;
          }
          if (action.name === "Harness Divine Power" || action.name === "Recover Spell Slot") {
            const channelDivinityResource = characterData.resources?.find(
              (r) => r.name === "Channel Divinity" || r.variableName === "channelDivinityCleric" || r.variableName === "channelDivinityPaladin" || r.variableName === "channelDivinity"
            );
            if (!channelDivinityResource) {
              showNotification("\u274C No Channel Divinity resource found", "error");
              return;
            }
            if (channelDivinityResource.current <= 0) {
              showNotification("\u274C No Channel Divinity uses remaining!", "error");
              return;
            }
            showHarnessDivinePowerModal(action, channelDivinityResource);
            return;
          }
          if (action.name === "Elemental Weapon") {
            showElementalWeaponModal(action);
            return;
          }
          if (action.name === "Divine Intervention") {
            showDivineInterventionModal(action);
            return;
          }
          if (action.name === "Wild Shape" || action.name === "Combat Wild Shape") {
            showWildShapeModal(action);
            return;
          }
          if (action.name === "Shapechange") {
            showShapechangeModal(action);
            return;
          }
          if (action.name === "True Polymorph") {
            showTruePolymorphModal(action);
            return;
          }
          if (action.name && (action.name.includes("Conjure Animals") || action.name.includes("Conjure Elemental") || action.name.includes("Conjure Fey") || action.name.includes("Conjure Celestial"))) {
            showConjureModal(action);
            return;
          }
          if (action.name === "Planar Binding") {
            showPlanarBindingModal(action);
            return;
          }
          if (action.name === "Teleport") {
            showTeleportModal(action);
            return;
          }
          if (action.name === "Word of Recall") {
            showWordOfRecallModal(action);
            return;
          }
          if (action.name === "Contingency") {
            showContingencyModal(action);
            return;
          }
          if (action.name === "Glyph of Warding") {
            showGlyphOfWardingModal(action);
            return;
          }
          if (action.name === "Symbol") {
            showSymbolModal(action);
            return;
          }
          if (action.name === "Programmed Illusion") {
            showProgrammedIllusionModal(action);
            return;
          }
          if (action.name === "Sequester") {
            showSequesterModal(action);
            return;
          }
          if (action.name === "Clone") {
            showCloneModal(action);
            return;
          }
          if (action.name === "Astral Projection") {
            showAstralProjectionModal(action);
            return;
          }
          if (action.name === "Etherealness") {
            showEtherealnessModal(action);
            return;
          }
          if (action.name === "Magic Jar") {
            showMagicJarModal(action);
            return;
          }
          if (action.name === "Imprisonment") {
            showImprisonmentModal(action);
            return;
          }
          if (action.name === "Time Stop") {
            showTimeStopModal(action);
            return;
          }
          if (action.name === "Mirage Arcane") {
            showMirageArcaneModal(action);
            return;
          }
          if (action.name === "Forcecage") {
            showForcecageModal(action);
            return;
          }
          if (action.name === "Maze") {
            showMazeModal(action);
            return;
          }
          if (action.name === "Wish") {
            showWishModal(action);
            return;
          }
          if (action.name === "Simulacrum") {
            showSimulacrumModal(action);
            return;
          }
          if (action.name === "Gate") {
            showGateModal(action);
            return;
          }
          if (action.name === "Legend Lore") {
            showLegendLoreModal(action);
            return;
          }
          if (action.name === "Commune") {
            showCommuneModal(action);
            return;
          }
          if (action.name === "Augury") {
            showAuguryModal(action);
            return;
          }
          if (action.name === "Divination") {
            showDivinationModal(action);
            return;
          }
          if (action.name === "Contact Other Plane") {
            showContactOtherPlaneModal(action);
            return;
          }
          if (action.name === "Find the Path") {
            showFindThePathModal(action);
            return;
          }
          if (action.name === "Speak with Dead") {
            showSpeakWithDeadModal(action);
            return;
          }
          if (action.name === "Speak with Animals") {
            showSpeakWithAnimalsModal(action);
            return;
          }
          if (action.name === "Speak with Plants") {
            showSpeakWithPlantsModal(action);
            return;
          }
          if (action.name === "Zone of Truth") {
            showZoneOfTruthModal(action);
            return;
          }
          if (action.name === "Sending") {
            showSendingModal(action);
            return;
          }
          if (action.name === "Dream") {
            showDreamModal(action);
            return;
          }
          if (action.name === "Scrying") {
            showScryingModal(action);
            return;
          }
          if (action.name === "Dispel Evil and Good") {
            showDispelEvilAndGoodModal(action);
            return;
          }
          if (action.name === "Freedom of Movement") {
            showFreedomOfMovementModal(action);
            return;
          }
          if (action.name === "Nondetection") {
            showNondetectionModal(action);
            return;
          }
          if (action.name === "Protection from Energy") {
            showProtectionFromEnergyModal(action);
            return;
          }
          if (action.name === "Protection from Evil and Good") {
            showProtectionFromEvilAndGoodModal(action);
            return;
          }
          if (action.name === "Sanctuary") {
            showSanctuaryModal(action);
            return;
          }
          if (action.name === "Silence") {
            showSilenceModal(action);
            return;
          }
          if (action.name === "Magic Circle") {
            showMagicCircleModal(action);
            return;
          }
          if (action.name === "Greater Restoration") {
            showGreaterRestorationModal(action);
            return;
          }
          if (action.name === "Remove Curse") {
            showRemoveCurseModal(action);
            return;
          }
          if (action.name === "Revivify") {
            showRevivifyModal(action);
            return;
          }
          if (action.name === "Raise Dead") {
            showRaiseDeadModal(action);
            return;
          }
          if (action.name === "Resurrection") {
            showResurrectionModal(action);
            return;
          }
          if (action.name === "True Resurrection") {
            showTrueResurrectionModal(action);
            return;
          }
          if (action.name === "Detect Magic") {
            showDetectMagicModal(action);
            return;
          }
          if (action.name === "Identify") {
            showIdentifyModal(action);
            return;
          }
          if (action.name === "Dispel Magic") {
            showDispelMagicModal(action);
            return;
          }
          if (action.name === "Feather Fall") {
            showFeatherFallModal(action);
            return;
          }
          if (action.name === "Hellish Rebuke") {
            showHellishRebukeModal(action);
            return;
          }
          if (action.name === "Shield") {
            showShieldModal(action);
            return;
          }
          if (action.name === "Absorb Elements") {
            showAbsorbElementsModal(action);
            return;
          }
          if (action.name === "Counterspell") {
            showCounterspellModal(action);
            return;
          }
          if (action.name === "Fire Shield") {
            showFireShieldModal(action);
            return;
          }
          if (action.name === "Armor of Agathys") {
            showArmorOfAgathysModal(action);
            return;
          }
          if (action.name === "Meld into Stone") {
            showMeldIntoStoneModal(action);
            return;
          }
          if (action.name === "Vampiric Touch") {
            showVampiricTouchModal(action);
            return;
          }
          if (action.name === "Life Transference") {
            showLifeTransferenceModal(action);
            return;
          }
          if (action.name === "Geas") {
            showGeasModal(action);
            return;
          }
          if (action.name === "Symbol") {
            showSymbolModal(action);
            return;
          }
          if (action.name === "Spiritual Weapon") {
            showSpiritualWeaponModal(action);
            return;
          }
          if (action.name === "Flaming Sphere") {
            showFlamingSphereModal(action);
            return;
          }
          if (action.name === "Bigby's Hand") {
            showBigbysHandModal(action);
            return;
          }
          if (action.name === "Animate Objects") {
            showAnimateObjectsModal(action);
            return;
          }
          if (action.name === "Moonbeam") {
            showMoonbeamModal(action);
            return;
          }
          if (action.name === "Healing Spirit") {
            showHealingSpiritModal(action);
            return;
          }
          if (action.name === "Bless") {
            showBlessModal(action);
            return;
          }
          if (action.name === "Bane") {
            showBaneModal(action);
            return;
          }
          if (action.name === "Guidance") {
            showGuidanceModal(action);
            return;
          }
          if (action.name === "Resistance") {
            showResistanceModal(action);
            return;
          }
          if (action.name === "Hex") {
            showHexModal(action);
            return;
          }
          if (action.name === "Hunter's Mark") {
            showHuntersMarkModal(action);
            return;
          }
          if (action.name === "Magic Missile") {
            showMagicMissileModal(action);
            return;
          }
          if (action.name === "Scorching Ray") {
            showScorchingRayModal(action);
            return;
          }
          if (action.name === "Aid") {
            showAidModal(action);
            return;
          }
          if (action.name === "Spirit Guardians") {
            showSpiritGuardiansModal(action);
            return;
          }
          if (action.name === "Cloud of Daggers") {
            showCloudOfDaggersModal(action);
            return;
          }
          if (action.name === "Spike Growth") {
            showSpikeGrowthModal(action);
            return;
          }
          if (action.name === "Wall of Fire") {
            showWallOfFireModal(action);
            return;
          }
          if (action.name === "Haste") {
            showHasteModal(action);
            return;
          }
          if (action.name === "Booming Blade") {
            showBoomingBladeModal(action);
            return;
          }
          if (action.name === "Green-Flame Blade") {
            showGreenFlameBladeModal(action);
            return;
          }
          if (action.name === "Chromatic Orb") {
            showChromaticOrbModal(action);
            return;
          }
          if (action.name === "Dragon's Breath") {
            showDragonsBreathModal(action);
            return;
          }
          if (action.name === "Chaos Bolt") {
            showChaosBoltModal(action);
            return;
          }
          if (action.name === "Delayed Blast Fireball") {
            showDelayedBlastFireballModal(action);
            return;
          }
          if (action.name === "Polymorph") {
            showPolymorphModal(action);
            return;
          }
          if (action.name === "True Polymorph") {
            showTruePolymorphModal(action);
            return;
          }
          if (action.uses && !decrementActionUses(action)) {
            return;
          }
          const kiCost = getKiCostFromAction(action);
          if (kiCost > 0) {
            const kiResource = getKiPointsResource();
            if (!kiResource) {
              showNotification(`\u274C No Ki Points resource found`, "error");
              return;
            }
            if (kiResource.current < kiCost) {
              showNotification(`\u274C Not enough Ki Points! Need ${kiCost}, have ${kiResource.current}`, "error");
              return;
            }
            kiResource.current -= kiCost;
            saveCharacterData();
            debug2.log(`\u2728 Used ${kiCost} Ki points for ${action.name}. Remaining: ${kiResource.current}/${kiResource.max}`);
            showNotification(`\u2728 ${action.name}! (${kiResource.current}/${kiResource.max} Ki left)`);
            buildSheet(characterData);
          }
          const sorceryCost = getSorceryPointCostFromAction(action);
          if (sorceryCost > 0) {
            const sorceryResource = getSorceryPointsResource();
            if (!sorceryResource) {
              showNotification(`\u274C No Sorcery Points resource found`, "error");
              return;
            }
            if (sorceryResource.current < sorceryCost) {
              showNotification(`\u274C Not enough Sorcery Points! Need ${sorceryCost}, have ${sorceryResource.current}`, "error");
              return;
            }
            sorceryResource.current -= sorceryCost;
            saveCharacterData();
            debug2.log(`\u2728 Used ${sorceryCost} Sorcery Points for ${action.name}. Remaining: ${sorceryResource.current}/${sorceryResource.max}`);
            showNotification(`\u2728 ${action.name}! (${sorceryResource.current}/${sorceryResource.max} SP left)`);
            buildSheet(characterData);
          }
          if (!decrementActionResources(action)) {
            return;
          }
          announceAction(action);
          const actionType = action.actionType || "action";
          debug2.log(`\u{1F3AF} Action type for "${action.name}": "${actionType}"`);
          if (actionType === "bonus action" || actionType === "bonus" || actionType === "Bonus Action" || actionType === "Bonus") {
            markActionAsUsed("bonus action");
          } else if (actionType === "reaction" || actionType === "Reaction") {
            markActionAsUsed("reaction");
          } else {
            markActionAsUsed("action");
          }
        });
        buttonsDiv.appendChild(useBtn);
      }
      if (action.description) {
        const detailsBtn = document.createElement("button");
        detailsBtn.className = "details-btn";
        detailsBtn.textContent = "\u{1F4CB} Details";
        detailsBtn.style.cssText = `
        background: #34495e;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
        margin-right: 4px;
        margin-bottom: 4px;
      `;
        detailsBtn.addEventListener("click", () => {
          const descDiv = actionCard.querySelector(".action-description");
          if (descDiv) {
            descDiv.style.display = descDiv.style.display === "none" ? "block" : "none";
            detailsBtn.textContent = descDiv.style.display === "none" ? "\u{1F4CB} Details" : "\u{1F4CB} Hide";
          }
        });
        buttonsDiv.appendChild(detailsBtn);
      }
      actionHeader.appendChild(nameDiv);
      actionHeader.appendChild(buttonsDiv);
      actionCard.appendChild(actionHeader);
      if (action.description) {
        const descDiv = document.createElement("div");
        descDiv.className = "action-description";
        descDiv.style.display = "none";
        const resolvedDescription = resolveVariablesInFormula(action.description);
        descDiv.innerHTML = `
        <div style="margin-top: 10px; padding: 10px; background: var(--bg-secondary, #f5f5f5); border-radius: 4px; font-size: 0.9em;">${resolvedDescription}</div>
      `;
        actionCard.appendChild(descDiv);
      }
      container.appendChild(actionCard);
    });
  }
  function buildInventoryDisplay(container, inventory) {
    container.innerHTML = "";
    if (!inventory || inventory.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No items in inventory</p>';
      return;
    }
    debug2.log(`\u{1F392} Building inventory display with ${inventory.length} items`);
    let filteredInventory = inventory.filter((item) => {
      const lowerName = (item.name || "").toLowerCase();
      const coinPatterns = [
        "platinum piece",
        "gold piece",
        "silver piece",
        "copper piece",
        "electrum piece",
        "platinum coin",
        "gold coin",
        "silver coin",
        "copper coin",
        "electrum coin",
        "pp",
        "gp",
        "sp",
        "cp",
        "ep"
      ];
      const isCoin = coinPatterns.some((pattern) => {
        if (pattern.length <= 2) {
          return lowerName === pattern || lowerName === pattern + "s" || lowerName.match(new RegExp(`^\\d+\\s*${pattern}s?$`));
        }
        return lowerName.includes(pattern);
      });
      if (isCoin) {
        return false;
      }
      if (inventoryFilters.filter === "equipped" && !item.equipped) {
        return false;
      }
      if (inventoryFilters.filter === "attuned" && !item.attuned) {
        return false;
      }
      if (inventoryFilters.filter === "container" && item.type !== "container") {
        return false;
      }
      if (inventoryFilters.search) {
        const searchLower = inventoryFilters.search;
        const name = (item.name || "").toLowerCase();
        const desc = (item.description || "").toLowerCase();
        const tagsString = (item.tags || []).join(" ").toLowerCase();
        if (!name.includes(searchLower) && !desc.includes(searchLower) && !tagsString.includes(searchLower)) {
          return false;
        }
      }
      return true;
    });
    if (filteredInventory.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No items match filters</p>';
      return;
    }
    filteredInventory.sort((a, b) => {
      if (a.equipped && !b.equipped)
        return -1;
      if (!a.equipped && b.equipped)
        return 1;
      return (a.name || "").localeCompare(b.name || "");
    });
    filteredInventory.forEach((item) => {
      const itemCard = createInventoryCard(item);
      container.appendChild(itemCard);
    });
    debug2.log(`\u{1F392} Displayed ${filteredInventory.length} items`);
  }
  function createInventoryCard(item) {
    const card = document.createElement("div");
    card.className = "action-card";
    card.style.cssText = `
    background: var(--bg-card);
    border-left: 4px solid ${item.equipped ? "#27ae60" : item.attuned ? "#9b59b6" : "#95a5a6"};
    padding: 15px;
    margin-bottom: 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    ${item.equipped ? "box-shadow: 0 0 10px rgba(39, 174, 96, 0.3);" : ""}
  `;
    card.onmouseover = () => {
      card.style.background = "var(--bg-card-hover)";
      card.style.transform = "translateX(2px)";
    };
    card.onmouseout = () => {
      card.style.background = "var(--bg-card)";
      card.style.transform = "translateX(0)";
    };
    const header = document.createElement("div");
    header.style.cssText = "display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;";
    const nameSection = document.createElement("div");
    nameSection.style.cssText = "display: flex; align-items: center; gap: 8px;";
    const itemName = document.createElement("strong");
    itemName.textContent = item.name || "Unnamed Item";
    itemName.style.cssText = "color: var(--text-primary); font-size: 1.1em;";
    nameSection.appendChild(itemName);
    if (item.equipped) {
      const equippedBadge = document.createElement("span");
      equippedBadge.textContent = "\u2694\uFE0F Equipped";
      equippedBadge.style.cssText = "background: #27ae60; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75em; font-weight: bold;";
      nameSection.appendChild(equippedBadge);
    }
    if (item.attuned) {
      const attunedBadge = document.createElement("span");
      attunedBadge.textContent = "\u2728 Attuned";
      attunedBadge.style.cssText = "background: #9b59b6; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75em; font-weight: bold;";
      nameSection.appendChild(attunedBadge);
    }
    if (item.requiresAttunement && !item.attuned) {
      const requiresBadge = document.createElement("span");
      requiresBadge.textContent = "(Requires Attunement)";
      requiresBadge.style.cssText = "color: var(--text-muted); font-size: 0.85em; font-style: italic;";
      nameSection.appendChild(requiresBadge);
    }
    header.appendChild(nameSection);
    const metaSection = document.createElement("div");
    metaSection.style.cssText = "display: flex; flex-direction: column; align-items: flex-end; gap: 4px;";
    if (item.quantity > 1 || item.showIncrement) {
      const quantitySpan = document.createElement("span");
      quantitySpan.textContent = `\xD7${item.quantity}`;
      quantitySpan.style.cssText = "color: var(--text-secondary); font-weight: bold; font-size: 1.1em;";
      metaSection.appendChild(quantitySpan);
    }
    header.appendChild(metaSection);
    card.appendChild(header);
    if (item.weight && item.weight > 0) {
      const weightDiv = document.createElement("div");
      const totalWeight = item.weight * item.quantity;
      weightDiv.textContent = `\u2696\uFE0F ${totalWeight} lb${totalWeight !== 1 ? "s" : ""}`;
      weightDiv.style.cssText = "color: var(--text-secondary); font-size: 0.85em; margin-bottom: 4px;";
      card.appendChild(weightDiv);
    }
    if (item.tags && item.tags.length > 0) {
      const tagsDiv = document.createElement("div");
      tagsDiv.style.cssText = "display: flex; gap: 6px; flex-wrap: wrap; margin: 6px 0;";
      item.tags.forEach((tag) => {
        const tagSpan = document.createElement("span");
        tagSpan.textContent = tag;
        tagSpan.style.cssText = "background: var(--bg-tertiary); color: var(--text-secondary); padding: 2px 6px; border-radius: 8px; font-size: 0.75em;";
        tagsDiv.appendChild(tagSpan);
      });
      card.appendChild(tagsDiv);
    }
    if (item.description && item.description.trim()) {
      const descDiv = document.createElement("div");
      descDiv.style.cssText = "color: var(--text-secondary); font-size: 0.9em; margin-top: 8px; border-top: 1px solid var(--border-color); padding-top: 8px; line-height: 1.4; max-height: 0; overflow: hidden; transition: max-height 0.3s;";
      descDiv.innerHTML = item.description.replace(/\n/g, "<br>");
      card.addEventListener("click", () => {
        if (descDiv.style.maxHeight === "0px" || !descDiv.style.maxHeight) {
          descDiv.style.maxHeight = "500px";
          descDiv.style.paddingTop = "8px";
        } else {
          descDiv.style.maxHeight = "0px";
          descDiv.style.paddingTop = "0px";
        }
      });
      card.appendChild(descDiv);
    }
    return card;
  }
  function buildCompanionsDisplay(companions) {
    const container = document.getElementById("companions-container");
    const section = document.getElementById("companions-section");
    section.style.display = "block";
    container.innerHTML = "";
    companions.forEach((companion) => {
      debug2.log("\u{1F50D} DEBUG: Companion object in popup:", companion);
      debug2.log("\u{1F50D} DEBUG: Companion abilities:", companion.abilities);
      debug2.log("\u{1F50D} DEBUG: Companion abilities keys:", Object.keys(companion.abilities));
      const companionCard = document.createElement("div");
      companionCard.className = "action-card";
      companionCard.style.background = "var(--bg-card)";
      companionCard.style.borderColor = "var(--border-card)";
      const header = document.createElement("div");
      header.className = "action-header";
      header.style.cursor = "pointer";
      const nameDiv = document.createElement("div");
      nameDiv.innerHTML = `
      <div class="action-name">\u{1F43E} ${companion.name}</div>
      <div style="font-size: 0.85em; color: var(--text-secondary); font-style: italic;">
        ${companion.size} ${companion.type}${companion.alignment ? ", " + companion.alignment : ""}
      </div>
    `;
      header.appendChild(nameDiv);
      companionCard.appendChild(header);
      const statsDiv = document.createElement("div");
      statsDiv.className = "action-description expanded";
      statsDiv.style.display = "block";
      statsDiv.style.background = "var(--bg-secondary)";
      statsDiv.style.padding = "12px";
      statsDiv.style.borderRadius = "4px";
      statsDiv.style.marginTop = "10px";
      let statsHTML = '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 10px;">';
      if (companion.ac)
        statsHTML += `<div><strong>AC:</strong> ${companion.ac}</div>`;
      if (companion.hp)
        statsHTML += `<div><strong>HP:</strong> ${companion.hp}</div>`;
      if (companion.speed)
        statsHTML += `<div style="grid-column: span 3;"><strong>Speed:</strong> ${companion.speed}</div>`;
      statsHTML += "</div>";
      if (Object.keys(companion.abilities).length > 0) {
        statsHTML += '<div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; text-align: center; margin: 10px 0; padding: 8px; background: var(--bg-tertiary); border-radius: 4px;">';
        ["str", "dex", "con", "int", "wis", "cha"].forEach((ability) => {
          if (companion.abilities[ability]) {
            const abil = companion.abilities[ability];
            statsHTML += `
            <div>
              <div style="font-weight: bold; font-size: 0.75em; color: var(--text-secondary);">${ability.toUpperCase()}</div>
              <div style="font-size: 1.1em; color: var(--text-primary);">${abil.score}</div>
              <div style="font-size: 0.9em; color: var(--accent-success);">(${abil.modifier >= 0 ? "+" : ""}${abil.modifier})</div>
            </div>
          `;
          }
        });
        statsHTML += "</div>";
      }
      if (companion.senses)
        statsHTML += `<div style="margin: 5px 0; color: var(--text-primary);"><strong>Senses:</strong> ${companion.senses}</div>`;
      if (companion.languages)
        statsHTML += `<div style="margin: 5px 0; color: var(--text-primary);"><strong>Languages:</strong> ${companion.languages}</div>`;
      if (companion.proficiencyBonus)
        statsHTML += `<div style="margin: 5px 0; color: var(--text-primary);"><strong>Proficiency Bonus:</strong> +${companion.proficiencyBonus}</div>`;
      if (companion.features && companion.features.length > 0) {
        statsHTML += '<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color);">';
        companion.features.forEach((feature) => {
          statsHTML += `<div style="margin: 8px 0; color: var(--text-primary);"><strong>${feature.name}.</strong> ${feature.description}</div>`;
        });
        statsHTML += "</div>";
      }
      if (companion.actions && companion.actions.length > 0) {
        statsHTML += '<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color); color: var(--text-primary);"><strong>Actions</strong></div>';
        companion.actions.forEach((action) => {
          statsHTML += `
          <div style="margin: 10px 0; padding: 8px; background: var(--bg-action); border: 1px solid var(--accent-danger); border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="color: var(--text-primary);">
                <strong>${action.name}.</strong> Melee Weapon Attack: +${action.attackBonus} to hit, ${action.reach}. <em>Hit:</em> ${action.damage}
              </div>
              <div style="display: flex; gap: 8px;">
                <button class="attack-btn companion-attack-btn" data-name="${companion.name} - ${action.name}" data-bonus="${action.attackBonus}">\u2694\uFE0F Attack</button>
                <button class="damage-btn companion-damage-btn" data-name="${companion.name} - ${action.name}" data-damage="${action.damage}">\u{1F4A5} Damage</button>
              </div>
            </div>
          </div>
        `;
        });
      }
      statsDiv.innerHTML = statsHTML;
      companionCard.appendChild(statsDiv);
      companionCard.querySelectorAll(".companion-attack-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const name = btn.dataset.name;
          const bonus = parseInt(btn.dataset.bonus);
          roll(`${name} - Attack`, `1d20+${bonus}`);
        });
      });
      companionCard.querySelectorAll(".companion-damage-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const name = btn.dataset.name;
          const damage = btn.dataset.damage;
          roll(`${name} - Damage`, damage);
        });
      });
      container.appendChild(companionCard);
    });
  }
  function decrementActionUses(action) {
    if (!action.uses) {
      return true;
    }
    const usesTotal = action.uses.total || action.uses.value || action.uses;
    const usesUsed = action.usesUsed || 0;
    const usesRemaining = action.usesLeft !== void 0 ? action.usesLeft : usesTotal - usesUsed;
    if (usesRemaining <= 0) {
      showNotification(`\u274C No uses remaining for ${action.name}`, "error");
      return false;
    }
    action.usesUsed = usesUsed + 1;
    if (action.usesLeft !== void 0) {
      action.usesLeft = usesRemaining - 1;
    }
    const newRemaining = action.usesLeft !== void 0 ? action.usesLeft : usesTotal - action.usesUsed;
    saveCharacterData();
    showNotification(`\u2705 Used ${action.name} (${newRemaining}/${usesTotal} remaining)`);
    const actionsContainer = document.getElementById("actions-container");
    buildActionsDisplay(actionsContainer, characterData.actions);
    return true;
  }
  function buildResourcesDisplay() {
    const container = document.getElementById("resources-container");
    if (!characterData || !characterData.resources || characterData.resources.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #666;">No class resources available</p>';
      debug2.log("\u26A0\uFE0F No resources in character data");
      collapseSectionByContainerId("resources-container");
      return;
    }
    expandSectionByContainerId("resources-container");
    debug2.log(
      `\u{1F4CA} Building resources display with ${characterData.resources.length} resources:`,
      characterData.resources.map((r) => `${r.name} (${r.current}/${r.max})`)
    );
    const resourcesGrid = document.createElement("div");
    resourcesGrid.className = "spell-slots-grid";
    characterData.resources.forEach((resource) => {
      if (resource.max === 0) {
        debug2.log(`\u23ED\uFE0F Skipping resource with MAX = 0: ${resource.name}`);
        return;
      }
      const lowerName = resource.name.toLowerCase().trim();
      if (lowerName.includes("lucky point") || lowerName.includes("luck point") || lowerName === "lucky points" || lowerName === "lucky") {
        debug2.log(`\u23ED\uFE0F Skipping Lucky resource from display: ${resource.name}`);
        return;
      }
      debug2.log(`\u{1F4CA} Displaying resource: ${resource.name} (${resource.current}/${resource.max})`);
      const resourceCard = document.createElement("div");
      resourceCard.className = resource.current > 0 ? "spell-slot-card" : "spell-slot-card empty";
      resourceCard.innerHTML = `
      <div class="spell-slot-level">${resource.name}</div>
      <div class="spell-slot-count">${resource.current}/${resource.max}</div>
    `;
      resourceCard.addEventListener("click", () => {
        adjustResource(resource);
      });
      resourceCard.style.cursor = "pointer";
      resourcesGrid.appendChild(resourceCard);
    });
    container.innerHTML = "";
    container.appendChild(resourcesGrid);
    const note = document.createElement("p");
    note.style.cssText = "text-align: center; color: #95a5a6; font-size: 0.85em; margin-top: 10px;";
    note.textContent = "Click a resource to manually adjust";
    container.appendChild(note);
  }
  function adjustResource(resource) {
    const newValue = prompt(`Adjust ${resource.name}

Current: ${resource.current}/${resource.max}

Enter new current value (0-${resource.max}):`);
    if (newValue === null)
      return;
    const parsed = parseInt(newValue);
    if (isNaN(parsed) || parsed < 0 || parsed > resource.max) {
      alert(`Please enter a number between 0 and ${resource.max}`);
      return;
    }
    resource.current = parsed;
    if (characterData.otherVariables && resource.varName) {
      characterData.otherVariables[resource.varName] = resource.current;
    }
    saveCharacterData();
    buildSheet(characterData);
    showNotification(`\u2705 ${resource.name} updated to ${resource.current}/${resource.max}`);
  }
  function showSpellSlotRestorationModal(channelDivinityResource, maxSlotLevel) {
    const modal = document.createElement("div");
    modal.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;";
    const modalContent = document.createElement("div");
    modalContent.style.cssText = "background: white; padding: 30px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); min-width: 400px; max-width: 500px;";
    let slotButtonsHTML = "";
    const spellSlots = characterData.spellSlots || {};
    for (let level = 1; level <= maxSlotLevel; level++) {
      const slotVar = `level${level}SpellSlots`;
      const slotMaxVar = `level${level}SpellSlotsMax`;
      const current2 = spellSlots[slotVar] || 0;
      const max = spellSlots[slotMaxVar] || 0;
      const isAvailable = max > 0 && current2 < max;
      const disabled = !isAvailable ? "disabled" : "";
      const bgColor = isAvailable ? "#9b59b6" : "#bdc3c7";
      const cursor = isAvailable ? "pointer" : "not-allowed";
      const opacity = isAvailable ? "1" : "0.6";
      slotButtonsHTML += `
      <button
        class="spell-slot-restore-btn"
        data-level="${level}"
        ${disabled}
        style="width: 100%; padding: 15px; background: ${bgColor}; color: white; border: none; border-radius: 8px; cursor: ${cursor}; font-weight: bold; margin-bottom: 10px; opacity: ${opacity};">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>Level ${level} Spell Slot</span>
          <span style="font-size: 0.9em;">${current2}/${max}</span>
        </div>
      </button>
    `;
    }
    modalContent.innerHTML = `
    <h3 style="margin: 0 0 15px 0; color: #2c3e50; text-align: center;">\u{1F52E} Harness Divine Power</h3>
    <p style="text-align: center; margin-bottom: 20px; color: #555; font-size: 0.95em;">
      Choose which spell slot to restore (max level ${maxSlotLevel})
    </p>
    <div style="margin-bottom: 20px;">
      ${slotButtonsHTML}
    </div>
    <button id="cancel-restore-modal" style="width: 100%; padding: 12px; background: #7f8c8d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
      Cancel
    </button>
  `;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    const slotButtons = modal.querySelectorAll(".spell-slot-restore-btn:not([disabled])");
    slotButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const level = parseInt(button.getAttribute("data-level"));
        restoreSpellSlot(level, channelDivinityResource);
        modal.remove();
      });
    });
    document.getElementById("cancel-restore-modal").addEventListener("click", () => {
      modal.remove();
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  function restoreSpellSlot(level, channelDivinityResource) {
    const slotVar = `level${level}SpellSlots`;
    const slotMaxVar = `level${level}SpellSlotsMax`;
    if (!characterData.spellSlots) {
      showNotification("\u274C No spell slots available!", "error");
      return;
    }
    const current2 = characterData.spellSlots[slotVar] || 0;
    const max = characterData.spellSlots[slotMaxVar] || 0;
    if (max === 0) {
      showNotification("\u274C No spell slots at that level!", "error");
      return;
    }
    if (current2 >= max) {
      showNotification(`\u274C Level ${level} spell slots already full!`, "error");
      return;
    }
    characterData.spellSlots[slotVar] = Math.min(current2 + 1, max);
    channelDivinityResource.current = Math.max(0, channelDivinityResource.current - 1);
    if (characterData.otherVariables && channelDivinityResource.variableName) {
      characterData.otherVariables[channelDivinityResource.variableName] = channelDivinityResource.current;
    } else if (characterData.otherVariables && channelDivinityResource.varName) {
      characterData.otherVariables[channelDivinityResource.varName] = channelDivinityResource.current;
    }
    saveCharacterData();
    buildSheet(characterData);
    const colorBanner = getColoredBanner();
    const newCurrent = characterData.spellSlots[slotVar];
    const messageData = {
      action: "announceSpell",
      message: `&{template:default} {{name=${colorBanner}${characterData.name} uses Harness Divine Power}} {{\u{1F52E}=Restored a Level ${level} spell slot! (${newCurrent}/${max})}}`,
      color: characterData.notificationColor
    };
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage(messageData, "*");
      } catch (error) {
        debug2.warn("\u26A0\uFE0F Could not send via window.opener:", error.message);
        browserAPI.runtime.sendMessage({
          action: "relayRollToRoll20",
          roll: messageData
        });
      }
    } else {
      browserAPI.runtime.sendMessage({
        action: "relayRollToRoll20",
        roll: messageData
      });
    }
    showNotification(`\u{1F52E} Harness Divine Power! Restored Level ${level} spell slot. Channel Divinity: ${channelDivinityResource.current}/${channelDivinityResource.max}`);
    debug2.log(`\u2728 Harness Divine Power used to restore Level ${level} spell slot`);
  }
  function showDivineSparkModal(action, channelDivinityResource) {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
    const clericLevel = characterData.otherVariables?.clericLevel || characterData.otherVariables?.cleric?.level || 1;
    const wisdomMod = characterData.abilityScores?.wisdom?.modifier || 0;
    const diceArray = [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4];
    const numDice = diceArray[Math.min(clericLevel, 20) - 1] || 1;
    const modalContent = document.createElement("div");
    modalContent.style.cssText = `
    background: #2a2a2a;
    border-radius: 8px;
    padding: 24px;
    max-width: 400px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
    color: #fff;
  `;
    modalContent.innerHTML = `
    <h3 style="margin-top: 0; margin-bottom: 16px; color: #ffd700; text-align: center;">
      \u2728 Divine Spark
    </h3>
    <p style="margin-bottom: 8px; text-align: center; color: #ccc;">
      Roll: ${numDice}d8 + ${wisdomMod}
    </p>
    <p style="margin-bottom: 20px; text-align: center; font-size: 14px; color: #aaa;">
      Channel Divinity: ${channelDivinityResource.current}/${channelDivinityResource.max}
    </p>
    <p style="margin-bottom: 20px; text-align: center; color: #fff;">
      Choose the effect:
    </p>
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <button id="divine-spark-heal" style="
        padding: 12px 20px;
        font-size: 16px;
        border: 2px solid #4ade80;
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        color: white;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.2s;
      ">\u{1F49A} Heal Target</button>
      <button id="divine-spark-necrotic" style="
        padding: 12px 20px;
        font-size: 16px;
        border: 2px solid #a78bfa;
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        color: white;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.2s;
      ">\u{1F5A4} Necrotic Damage</button>
      <button id="divine-spark-radiant" style="
        padding: 12px 20px;
        font-size: 16px;
        border: 2px solid #fbbf24;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.2s;
      ">\u2728 Radiant Damage</button>
      <button id="divine-spark-cancel" style="
        padding: 10px 20px;
        font-size: 14px;
        background: #444;
        color: white;
        border: 1px solid #666;
        border-radius: 6px;
        cursor: pointer;
        margin-top: 8px;
      ">Cancel</button>
    </div>
  `;
    modal.appendChild(modalContent);
    const buttons = modalContent.querySelectorAll("button:not(#divine-spark-cancel)");
    buttons.forEach((btn) => {
      btn.addEventListener("mouseenter", () => {
        btn.style.transform = "scale(1.05)";
        btn.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "scale(1)";
        btn.style.boxShadow = "none";
      });
    });
    const executeDivineSpark = (type, color, damageType = null) => {
      channelDivinityResource.current -= 1;
      saveCharacterData();
      const choiceValue = type === "heal" ? 1 : type === "necrotic" ? 2 : 3;
      if (characterData.otherVariables) {
        characterData.otherVariables.divineSparkChoice = choiceValue;
      }
      const rollFormula = `${numDice}d8 + ${wisdomMod}`;
      const effectText = type === "heal" ? "Healing" : `${damageType} Damage`;
      const colorBanner = `<span style="color: ${color}; font-weight: bold;">`;
      const messageData = {
        action: "sendRoll20Message",
        message: `&{template:default} {{name=${colorBanner}${characterData.name} uses Divine Spark}} {{Effect=${effectText}}} {{Roll=[[${rollFormula}]]}} {{Channel Divinity=${channelDivinityResource.current}/${channelDivinityResource.max}}}`,
        color
      };
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage(messageData, "*");
        } catch (error) {
          debug2.warn("\u26A0\uFE0F Could not send via window.opener:", error.message);
          browserAPI.runtime.sendMessage({
            action: "relayRollToRoll20",
            roll: messageData
          });
        }
      } else {
        browserAPI.runtime.sendMessage({
          action: "relayRollToRoll20",
          roll: messageData
        });
      }
      showNotification(`\u2728 Divine Spark (${effectText})! Channel Divinity: ${channelDivinityResource.current}/${channelDivinityResource.max}`, "success");
      debug2.log(`\u2728 Divine Spark used: ${effectText}`);
      buildSheet(characterData);
      modal.remove();
    };
    document.getElementById("divine-spark-heal")?.addEventListener("click", () => {
      executeDivineSpark("heal", "#22c55e");
    });
    document.getElementById("divine-spark-necrotic")?.addEventListener("click", () => {
      executeDivineSpark("necrotic", "#8b5cf6", "Necrotic");
    });
    document.getElementById("divine-spark-radiant")?.addEventListener("click", () => {
      executeDivineSpark("radiant", "#f59e0b", "Radiant");
    });
    document.getElementById("divine-spark-cancel")?.addEventListener("click", () => {
      modal.remove();
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    document.body.appendChild(modal);
    requestAnimationFrame(() => {
      const healBtn = document.getElementById("divine-spark-heal");
      const necroticBtn = document.getElementById("divine-spark-necrotic");
      const radiantBtn = document.getElementById("divine-spark-radiant");
      const cancelBtn = document.getElementById("divine-spark-cancel");
      healBtn?.addEventListener("click", () => executeDivineSpark("heal", "#22c55e"));
      necroticBtn?.addEventListener("click", () => executeDivineSpark("necrotic", "#8b5cf6", "Necrotic"));
      radiantBtn?.addEventListener("click", () => executeDivineSpark("radiant", "#f59e0b", "Radiant"));
      cancelBtn?.addEventListener("click", () => modal.remove());
    });
  }
  function buildSpellSlotsDisplay() {
    const container = document.getElementById("spell-slots-container");
    if (!characterData || !characterData.spellSlots) {
      container.innerHTML = '<p style="text-align: center; color: #666;">No spell slots available</p>';
      debug2.log("\u26A0\uFE0F No spell slots in character data");
      collapseSectionByContainerId("spell-slots-container");
      return;
    }
    const slotsGrid = document.createElement("div");
    slotsGrid.className = "spell-slots-grid";
    let hasAnySlots = false;
    let totalCurrentSlots = 0;
    let totalMaxSlots = 0;
    const pactMagicSlotLevel = characterData.spellSlots?.pactMagicSlotLevel || characterData.otherVariables?.pactMagicSlotLevel || characterData.otherVariables?.pactSlotLevelVisible || characterData.otherVariables?.pactSlotLevel || characterData.otherVariables?.slotLevel;
    const pactMagicSlots = characterData.spellSlots?.pactMagicSlots ?? characterData.otherVariables?.pactMagicSlots ?? characterData.otherVariables?.pactSlot ?? 0;
    const pactMagicSlotsMax = characterData.spellSlots?.pactMagicSlotsMax ?? characterData.otherVariables?.pactMagicSlotsMax ?? characterData.otherVariables?.pactSlotMax ?? 0;
    const hasPactMagic = pactMagicSlotsMax > 0;
    const effectivePactLevel = pactMagicSlotLevel || (hasPactMagic ? 5 : 0);
    debug2.log(`\u{1F52E} Spell slots display - Pact Magic: level=${pactMagicSlotLevel} (effective=${effectivePactLevel}), slots=${pactMagicSlots}/${pactMagicSlotsMax}, hasPact=${hasPactMagic}`);
    if (hasPactMagic) {
      hasAnySlots = true;
      totalCurrentSlots += pactMagicSlots;
      totalMaxSlots += pactMagicSlotsMax;
      const slotCard = document.createElement("div");
      slotCard.className = pactMagicSlots > 0 ? "spell-slot-card pact-magic" : "spell-slot-card pact-magic empty";
      slotCard.style.cssText = "background: linear-gradient(135deg, #6b3fa0, #9b59b6); border: 2px solid #8e44ad;";
      slotCard.innerHTML = `
      <div class="spell-slot-level">Pact (${effectivePactLevel})</div>
      <div class="spell-slot-count">${pactMagicSlots}/${pactMagicSlotsMax}</div>
    `;
      slotCard.addEventListener("click", () => {
        adjustSpellSlot(`pact:${effectivePactLevel}`, pactMagicSlots, pactMagicSlotsMax, true);
      });
      slotCard.style.cursor = "pointer";
      slotCard.title = "Click to adjust Pact Magic slots (recharge on short rest)";
      slotsGrid.appendChild(slotCard);
    }
    for (let level = 1; level <= 9; level++) {
      const slotVar = `level${level}SpellSlots`;
      const slotMaxVar = `level${level}SpellSlotsMax`;
      const maxSlots = characterData.spellSlots[slotMaxVar] || 0;
      if (maxSlots > 0) {
        hasAnySlots = true;
        const currentSlots = characterData.spellSlots[slotVar] || 0;
        totalCurrentSlots += currentSlots;
        totalMaxSlots += maxSlots;
        const slotCard = document.createElement("div");
        slotCard.className = currentSlots > 0 ? "spell-slot-card" : "spell-slot-card empty";
        slotCard.innerHTML = `
        <div class="spell-slot-level">Level ${level}</div>
        <div class="spell-slot-count">${currentSlots}/${maxSlots}</div>
      `;
        slotCard.addEventListener("click", () => {
          adjustSpellSlot(level, currentSlots, maxSlots);
        });
        slotCard.style.cursor = "pointer";
        slotCard.title = "Click to adjust spell slots";
        slotsGrid.appendChild(slotCard);
      }
    }
    if (hasAnySlots) {
      container.innerHTML = "";
      const summaryCard = document.createElement("div");
      summaryCard.className = "spell-slots-summary";
      summaryCard.style.cssText = `
      background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
      color: white;
      padding: 12px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 15px;
      font-weight: bold;
      box-shadow: 0 2px 8px rgba(155, 89, 182, 0.3);
    `;
      const totalPercent = totalMaxSlots > 0 ? totalCurrentSlots / totalMaxSlots * 100 : 0;
      summaryCard.innerHTML = `
      <div style="font-size: 14px; opacity: 0.9;">Total Spell Slots</div>
      <div style="font-size: 20px; margin: 4px 0;">${totalCurrentSlots}/${totalMaxSlots}</div>
      <div style="font-size: 12px; opacity: 0.8;">${Math.round(totalPercent)}% remaining</div>
    `;
      container.appendChild(summaryCard);
      container.appendChild(slotsGrid);
      const note = document.createElement("p");
      note.style.cssText = "text-align: center; color: #666; font-size: 0.85em; margin-top: 8px;";
      note.textContent = "Click a slot to manually adjust";
      container.appendChild(note);
      debug2.log(`\u2728 Spell slots display: ${totalCurrentSlots}/${totalMaxSlots} total slots across ${Math.max(...Array.from({ length: 9 }, (_, i2) => i2 + 1).filter((level) => characterData.spellSlots[`level${level}SpellSlotsMax`] > 0))} levels`);
      expandSectionByContainerId("spell-slots-container");
    } else {
      container.innerHTML = '<p style="text-align: center; color: #666;">No spell slots available</p>';
      debug2.log("\u26A0\uFE0F Character has 0 max slots for all levels");
      collapseSectionByContainerId("spell-slots-container");
    }
  }
  function adjustSpellSlot(level, current2, max, isPactMagic = false) {
    const isPact = isPactMagic || typeof level === "string" && level.startsWith("pact:");
    const actualLevel = isPact ? parseInt(level.toString().split(":")[1] || level) : level;
    const slotLabel = isPact ? `Pact Magic (Level ${actualLevel})` : `Level ${actualLevel}`;
    const newValue = prompt(`Adjust ${slotLabel} Spell Slots

Current: ${current2}/${max}

Enter new current value (0-${max}):`);
    if (newValue === null)
      return;
    const parsed = parseInt(newValue);
    if (isNaN(parsed) || parsed < 0 || parsed > max) {
      showNotification("\u274C Invalid value", "error");
      return;
    }
    if (isPact) {
      characterData.spellSlots.pactMagicSlots = parsed;
    } else {
      const slotVar = `level${actualLevel}SpellSlots`;
      characterData.spellSlots[slotVar] = parsed;
    }
    saveCharacterData();
    buildSheet(characterData);
    showNotification(`\u2705 ${slotLabel} slots set to ${parsed}/${max}`);
  }
  function showHPModal() {
    const modal = document.createElement("div");
    modal.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;";
    const modalContent = document.createElement("div");
    modalContent.style.cssText = "background: white; padding: 30px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); min-width: 300px;";
    const currentHP = characterData.hitPoints.current;
    const maxHP = characterData.hitPoints.max;
    const tempHP = characterData.temporaryHP || 0;
    modalContent.innerHTML = `
    <h3 style="margin: 0 0 20px 0; color: #2c3e50; text-align: center;">Adjust Hit Points</h3>
    <div style="text-align: center; font-size: 1.2em; margin-bottom: 20px; color: #7f8c8d;">
      Current: <strong>${currentHP}${tempHP > 0 ? `+${tempHP}` : ""} / ${maxHP}</strong>
    </div>

    <div style="margin-bottom: 20px;">
      <label style="display: block; margin-bottom: 10px; font-weight: bold; color: #2c3e50;">Amount:</label>
      <input type="number" id="hp-amount" min="1" value="1" style="width: 100%; padding: 10px; font-size: 1.1em; border: 2px solid #bdc3c7; border-radius: 6px; box-sizing: border-box;">
    </div>

    <div style="margin-bottom: 25px;">
      <label style="display: block; margin-bottom: 10px; font-weight: bold; color: #2c3e50;">Action:</label>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
        <button id="hp-toggle-heal" style="padding: 12px; font-size: 0.9em; font-weight: bold; border: 2px solid #27ae60; background: #27ae60; color: white; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
          \u{1F49A} Heal
        </button>
        <button id="hp-toggle-damage" style="padding: 12px; font-size: 0.9em; font-weight: bold; border: 2px solid #bdc3c7; background: white; color: #7f8c8d; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
          \u{1F494} Damage
        </button>
        <button id="hp-toggle-temp" style="padding: 12px; font-size: 0.9em; font-weight: bold; border: 2px solid #bdc3c7; background: white; color: #7f8c8d; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
          \u{1F6E1}\uFE0F Temp HP
        </button>
      </div>
    </div>

    <div style="display: flex; gap: 10px;">
      <button id="hp-cancel" style="flex: 1; padding: 12px; font-size: 1em; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
        Cancel
      </button>
      <button id="hp-confirm" style="flex: 1; padding: 12px; font-size: 1em; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
        Confirm
      </button>
    </div>
  `;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    let actionType = "heal";
    const healBtn = document.getElementById("hp-toggle-heal");
    const damageBtn = document.getElementById("hp-toggle-damage");
    const tempBtn = document.getElementById("hp-toggle-temp");
    const amountInput = document.getElementById("hp-amount");
    const resetButtons = () => {
      healBtn.style.background = "white";
      healBtn.style.color = "#7f8c8d";
      healBtn.style.borderColor = "#bdc3c7";
      damageBtn.style.background = "white";
      damageBtn.style.color = "#7f8c8d";
      damageBtn.style.borderColor = "#bdc3c7";
      tempBtn.style.background = "white";
      tempBtn.style.color = "#7f8c8d";
      tempBtn.style.borderColor = "#bdc3c7";
    };
    healBtn.addEventListener("click", () => {
      actionType = "heal";
      resetButtons();
      healBtn.style.background = "#27ae60";
      healBtn.style.color = "white";
      healBtn.style.borderColor = "#27ae60";
    });
    damageBtn.addEventListener("click", () => {
      actionType = "damage";
      resetButtons();
      damageBtn.style.background = "#e74c3c";
      damageBtn.style.color = "white";
      damageBtn.style.borderColor = "#e74c3c";
    });
    tempBtn.addEventListener("click", () => {
      actionType = "temp";
      resetButtons();
      tempBtn.style.background = "#3498db";
      tempBtn.style.color = "white";
      tempBtn.style.borderColor = "#3498db";
    });
    document.getElementById("hp-cancel").addEventListener("click", () => {
      modal.remove();
    });
    document.getElementById("hp-confirm").addEventListener("click", () => {
      const amount = parseInt(amountInput.value);
      if (isNaN(amount) || amount <= 0) {
        showNotification("\u274C Please enter a valid amount", "error");
        return;
      }
      const oldHP = characterData.hitPoints.current;
      const oldTempHP = characterData.temporaryHP || 0;
      const colorBanner = getColoredBanner();
      let messageData;
      if (actionType === "heal") {
        characterData.hitPoints.current = Math.min(currentHP + amount, maxHP);
        const actualHealing = characterData.hitPoints.current - oldHP;
        if (actualHealing > 0 && characterData.deathSaves && (characterData.deathSaves.successes > 0 || characterData.deathSaves.failures > 0)) {
          characterData.deathSaves.successes = 0;
          characterData.deathSaves.failures = 0;
          debug2.log("\u267B\uFE0F Death saves reset due to healing");
        }
        showNotification(`\u{1F49A} Healed ${actualHealing} HP! (${characterData.hitPoints.current}${characterData.temporaryHP > 0 ? `+${characterData.temporaryHP}` : ""}/${maxHP})`);
        messageData = {
          action: "announceSpell",
          message: `&{template:default} {{name=${colorBanner}${characterData.name} regains HP}} {{\u{1F49A} Healing=${actualHealing} HP}} {{Current HP=${characterData.hitPoints.current}${characterData.temporaryHP > 0 ? `+${characterData.temporaryHP}` : ""}/${maxHP}}}`,
          color: characterData.notificationColor
        };
      } else if (actionType === "damage") {
        let remainingDamage = amount;
        let tempHPLost = 0;
        let actualDamage = 0;
        if (characterData.temporaryHP > 0) {
          tempHPLost = Math.min(characterData.temporaryHP, remainingDamage);
          characterData.temporaryHP -= tempHPLost;
          remainingDamage -= tempHPLost;
        }
        if (remainingDamage > 0) {
          characterData.hitPoints.current = Math.max(currentHP - remainingDamage, 0);
          actualDamage = oldHP - characterData.hitPoints.current;
        }
        const damageMsg = tempHPLost > 0 ? `\u{1F494} Took ${amount} damage! (${tempHPLost} temp HP${actualDamage > 0 ? ` + ${actualDamage} HP` : ""})` : `\u{1F494} Took ${actualDamage} damage!`;
        showNotification(`${damageMsg} (${characterData.hitPoints.current}${characterData.temporaryHP > 0 ? `+${characterData.temporaryHP}` : ""}/${maxHP})`);
        const damageDetails = tempHPLost > 0 ? `{{Temp HP Lost=${tempHPLost}}}${actualDamage > 0 ? ` {{HP Lost=${actualDamage}}}` : ""}` : `{{HP Lost=${actualDamage}}}`;
        messageData = {
          action: "announceSpell",
          message: `&{template:default} {{name=${colorBanner}${characterData.name} takes damage}} {{\u{1F494} Total Damage=${amount}}} ${damageDetails} {{Current HP=${characterData.hitPoints.current}${characterData.temporaryHP > 0 ? `+${characterData.temporaryHP}` : ""}/${maxHP}}}`,
          color: characterData.notificationColor
        };
      } else if (actionType === "temp") {
        const newTempHP = amount;
        if (newTempHP > oldTempHP) {
          characterData.temporaryHP = newTempHP;
          showNotification(`\u{1F6E1}\uFE0F Gained ${newTempHP} temp HP! (${characterData.hitPoints.current}+${characterData.temporaryHP}/${maxHP})`);
          messageData = {
            action: "announceSpell",
            message: `&{template:default} {{name=${colorBanner}${characterData.name} gains temp HP}} {{\u{1F6E1}\uFE0F Temp HP=${newTempHP}}} {{Current HP=${characterData.hitPoints.current}+${characterData.temporaryHP}/${maxHP}}}`,
            color: characterData.notificationColor
          };
        } else {
          showNotification(`\u26A0\uFE0F Kept ${oldTempHP} temp HP (higher than ${newTempHP})`);
          modal.remove();
          return;
        }
      }
      if (messageData) {
        if (window.opener && !window.opener.closed) {
          try {
            window.opener.postMessage(messageData, "*");
          } catch (error) {
            debug2.warn("\u26A0\uFE0F Could not send via window.opener:", error.message);
            browserAPI.runtime.sendMessage({
              action: "relayRollToRoll20",
              roll: messageData
            });
          }
        } else {
          browserAPI.runtime.sendMessage({
            action: "relayRollToRoll20",
            roll: messageData
          });
        }
      }
      saveCharacterData();
      buildSheet(characterData);
      modal.remove();
    });
    amountInput.focus();
    amountInput.select();
    amountInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        document.getElementById("hp-confirm").click();
      }
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  function toggleInspiration() {
    if (!characterData)
      return;
    if (!characterData.inspiration) {
      showGainInspirationModal();
    } else {
      showUseInspirationModal();
    }
  }
  function showGainInspirationModal() {
    const modal = document.createElement("div");
    modal.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;";
    const modalContent = document.createElement("div");
    modalContent.style.cssText = "background: white; padding: 30px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); min-width: 350px; max-width: 450px;";
    modalContent.innerHTML = `
    <h3 style="margin: 0 0 20px 0; color: #2c3e50; text-align: center;">\u2B50 Gain Inspiration</h3>
    <p style="text-align: center; margin-bottom: 25px; color: #555;">
      You're about to gain Inspiration! This can be used for:
    </p>
    <div style="margin-bottom: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
      <div style="margin-bottom: 12px;">
        <strong style="color: #3498db;">\u{1F4D6} D&D 2014:</strong> Gain advantage on an attack roll, saving throw, or ability check
      </div>
      <div>
        <strong style="color: #e74c3c;">\u{1F4D6} D&D 2024:</strong> Reroll any die immediately after rolling it
      </div>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
      <button id="gain-inspiration" style="padding: 15px; background: #27ae60; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
        \u2B50 Gain It
      </button>
      <button id="cancel-modal" style="padding: 15px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
        Cancel
      </button>
    </div>
  `;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    document.getElementById("gain-inspiration").addEventListener("click", () => {
      characterData.inspiration = true;
      const emoji = "\u2B50";
      debug2.log(`${emoji} Inspiration gained`);
      showNotification(`${emoji} Inspiration gained!`);
      const colorBanner = getColoredBanner();
      const messageData = {
        action: "announceSpell",
        message: `&{template:default} {{name=${colorBanner}${characterData.name} gains Inspiration}} {{${emoji}=You now have Inspiration!}}`,
        color: characterData.notificationColor
      };
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage(messageData, "*");
        } catch (error) {
          debug2.warn("\u26A0\uFE0F Could not send via window.opener:", error.message);
          browserAPI.runtime.sendMessage({
            action: "relayRollToRoll20",
            roll: messageData
          });
        }
      } else {
        browserAPI.runtime.sendMessage({
          action: "relayRollToRoll20",
          roll: messageData
        });
      }
      saveCharacterData();
      buildSheet(characterData);
      modal.remove();
    });
    document.getElementById("cancel-modal").addEventListener("click", () => {
      modal.remove();
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  function showUseInspirationModal() {
    const modal = document.createElement("div");
    modal.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;";
    const modalContent = document.createElement("div");
    modalContent.style.cssText = "background: white; padding: 30px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); min-width: 400px; max-width: 500px;";
    const lastRollInfo = characterData.lastRoll ? `<div style="margin-bottom: 20px; padding: 12px; background: #e8f5e9; border-left: 4px solid #27ae60; border-radius: 4px;">
         <strong>Last Roll:</strong> ${characterData.lastRoll.name}
       </div>` : `<div style="margin-bottom: 20px; padding: 12px; background: #ffebee; border-left: 4px solid #e74c3c; border-radius: 4px;">
         <strong>\u26A0\uFE0F No previous roll to reroll</strong>
       </div>`;
    modalContent.innerHTML = `
    <h3 style="margin: 0 0 20px 0; color: #2c3e50; text-align: center;">\u2728 Use Inspiration</h3>
    <p style="text-align: center; margin-bottom: 20px; color: #555;">
      How do you want to use your Inspiration?
    </p>
    ${lastRollInfo}
    <div style="display: grid; gap: 12px; margin-bottom: 20px;">
      <button id="use-2014" style="padding: 18px; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; text-align: left;">
        <div style="font-size: 1.1em; margin-bottom: 5px;">\u{1F4D6} D&D 2014 - Advantage</div>
        <div style="font-size: 0.85em; opacity: 0.9;">Gain advantage on your next attack roll, saving throw, or ability check</div>
      </button>
      <button id="use-2024" ${!characterData.lastRoll ? "disabled" : ""} style="padding: 18px; background: ${!characterData.lastRoll ? "#95a5a6" : "#e74c3c"}; color: white; border: none; border-radius: 8px; cursor: ${!characterData.lastRoll ? "not-allowed" : "pointer"}; font-weight: bold; text-align: left;">
        <div style="font-size: 1.1em; margin-bottom: 5px;">\u{1F4D6} D&D 2024 - Reroll</div>
        <div style="font-size: 0.85em; opacity: 0.9;">Reroll your last roll and use the new result</div>
      </button>
    </div>
    <button id="cancel-use-modal" style="width: 100%; padding: 12px; background: #7f8c8d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
      Cancel
    </button>
  `;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    document.getElementById("use-2014").addEventListener("click", () => {
      characterData.inspiration = false;
      const emoji = "\u2728";
      debug2.log(`${emoji} Inspiration spent (2014 - Advantage)`);
      showNotification(`${emoji} Inspiration used! Gain advantage on your next roll.`);
      const colorBanner = getColoredBanner();
      const messageData = {
        action: "announceSpell",
        message: `&{template:default} {{name=${colorBanner}${characterData.name} uses Inspiration (2014)}} {{${emoji}=Gain advantage on your next attack roll, saving throw, or ability check!}}`,
        color: characterData.notificationColor
      };
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage(messageData, "*");
        } catch (error) {
          debug2.warn("\u26A0\uFE0F Could not send via window.opener:", error.message);
          browserAPI.runtime.sendMessage({
            action: "relayRollToRoll20",
            roll: messageData
          });
        }
      } else {
        browserAPI.runtime.sendMessage({
          action: "relayRollToRoll20",
          roll: messageData
        });
      }
      saveCharacterData();
      buildSheet(characterData);
      modal.remove();
    });
    if (characterData.lastRoll) {
      document.getElementById("use-2024").addEventListener("click", () => {
        characterData.inspiration = false;
        const emoji = "\u2728";
        debug2.log(`${emoji} Inspiration spent (2024 - Reroll): ${characterData.lastRoll.name}`);
        showNotification(`${emoji} Inspiration used! Rerolling ${characterData.lastRoll.name}...`);
        const colorBanner = getColoredBanner();
        const messageData = {
          action: "announceSpell",
          message: `&{template:default} {{name=${colorBanner}${characterData.name} uses Inspiration (2024)}} {{${emoji}=Rerolling: ${characterData.lastRoll.name}}}`,
          color: characterData.notificationColor
        };
        if (window.opener && !window.opener.closed) {
          try {
            window.opener.postMessage(messageData, "*");
          } catch (error) {
            debug2.warn("\u26A0\uFE0F Could not send via window.opener:", error.message);
            browserAPI.runtime.sendMessage({
              action: "relayRollToRoll20",
              roll: messageData
            });
          }
        } else {
          browserAPI.runtime.sendMessage({
            action: "relayRollToRoll20",
            roll: messageData
          });
        }
        const lastRoll = characterData.lastRoll;
        executeRoll(lastRoll.name, lastRoll.formula, lastRoll.effectNotes || []);
        saveCharacterData();
        buildSheet(characterData);
        modal.remove();
      });
    }
    document.getElementById("cancel-use-modal").addEventListener("click", () => {
      modal.remove();
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  function showDeathSavesModal() {
    const modal = document.createElement("div");
    modal.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;";
    const modalContent = document.createElement("div");
    modalContent.style.cssText = "background: white; padding: 30px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); min-width: 300px;";
    const deathSaves = characterData.deathSaves || { successes: 0, failures: 0 };
    const successes = deathSaves.successes || 0;
    const failures = deathSaves.failures || 0;
    modalContent.innerHTML = `
    <h3 style="margin: 0 0 20px 0; color: #2c3e50; text-align: center;">Death Saves</h3>
    <div style="text-align: center; font-size: 1.2em; margin-bottom: 20px;">
      <div style="margin-bottom: 10px;">
        <span style="color: #27ae60; font-weight: bold;">Successes: ${successes}/3</span>
      </div>
      <div>
        <span style="color: #e74c3c; font-weight: bold;">Failures: ${failures}/3</span>
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <button id="roll-death-save" style="width: 100%; padding: 15px; font-size: 1.1em; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 15px;">
        \u{1F3B2} Roll Death Save
      </button>
    </div>

    <div style="margin-bottom: 20px; border-top: 1px solid #ecf0f1; padding-top: 20px;">
      <label style="display: block; margin-bottom: 10px; font-weight: bold; color: #2c3e50;">Manual Adjustment:</label>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
        <button id="add-success" style="padding: 10px; background: #27ae60; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
          + Success
        </button>
        <button id="add-failure" style="padding: 10px; background: #e74c3c; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
          + Failure
        </button>
      </div>
      <button id="reset-death-saves" style="width: 100%; padding: 10px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
        Reset All
      </button>
    </div>

    <button id="close-modal" style="width: 100%; padding: 12px; font-size: 1em; background: #7f8c8d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
      Close
    </button>
  `;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    document.getElementById("roll-death-save").addEventListener("click", () => {
      const rollResult = Math.floor(Math.random() * 20) + 1;
      debug2.log(`\u{1F3B2} Death Save rolled: ${rollResult}`);
      let message = "";
      let isSuccess = false;
      if (rollResult === 20) {
        if (!characterData.deathSaves)
          characterData.deathSaves = { successes: 0, failures: 0 };
        if (characterData.deathSaves.successes < 3) {
          characterData.deathSaves.successes += 2;
          if (characterData.deathSaves.successes > 3)
            characterData.deathSaves.successes = 3;
        }
        message = `\u{1F49A} NAT 20! Death Save Success x2 (${characterData.deathSaves.successes}/3)`;
        isSuccess = true;
      } else if (rollResult === 1) {
        if (!characterData.deathSaves)
          characterData.deathSaves = { successes: 0, failures: 0 };
        if (characterData.deathSaves.failures < 3) {
          characterData.deathSaves.failures += 2;
          if (characterData.deathSaves.failures > 3)
            characterData.deathSaves.failures = 3;
        }
        message = `\u{1F480} NAT 1! Death Save Failure x2 (${characterData.deathSaves.failures}/3)`;
      } else if (rollResult >= 10) {
        if (!characterData.deathSaves)
          characterData.deathSaves = { successes: 0, failures: 0 };
        if (characterData.deathSaves.successes < 3) {
          characterData.deathSaves.successes++;
        }
        message = `\u2713 Death Save Success (${characterData.deathSaves.successes}/3)`;
        isSuccess = true;
      } else {
        if (!characterData.deathSaves)
          characterData.deathSaves = { successes: 0, failures: 0 };
        if (characterData.deathSaves.failures < 3) {
          characterData.deathSaves.failures++;
        }
        message = `\u2717 Death Save Failure (${characterData.deathSaves.failures}/3)`;
      }
      saveCharacterData();
      showNotification(message);
      roll(`Death Save: ${rollResult}`, "1d20", rollResult);
      buildSheet(characterData);
      modal.remove();
    });
    document.getElementById("add-success").addEventListener("click", () => {
      if (!characterData.deathSaves)
        characterData.deathSaves = { successes: 0, failures: 0 };
      if (characterData.deathSaves.successes < 3) {
        characterData.deathSaves.successes++;
        saveCharacterData();
        showNotification(`\u2713 Death Save Success (${characterData.deathSaves.successes}/3)`);
        buildSheet(characterData);
        modal.remove();
      }
    });
    document.getElementById("add-failure").addEventListener("click", () => {
      if (!characterData.deathSaves)
        characterData.deathSaves = { successes: 0, failures: 0 };
      if (characterData.deathSaves.failures < 3) {
        characterData.deathSaves.failures++;
        saveCharacterData();
        showNotification(`\u2717 Death Save Failure (${characterData.deathSaves.failures}/3)`);
        buildSheet(characterData);
        modal.remove();
      }
    });
    document.getElementById("reset-death-saves").addEventListener("click", () => {
      characterData.deathSaves = { successes: 0, failures: 0 };
      saveCharacterData();
      showNotification("\u267B\uFE0F Death saves reset");
      buildSheet(characterData);
      modal.remove();
    });
    document.getElementById("close-modal").addEventListener("click", () => {
      modal.remove();
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  function createCard(title, main, sub, onClick) {
    return window.CardCreator.createCard(title, main, sub, onClick);
  }
  function createSpellCard(spell, index) {
    const card = document.createElement("div");
    card.className = "spell-card";
    const header = document.createElement("div");
    header.className = "spell-header";
    let tags = "";
    if (spell.concentration) {
      tags += '<span class="concentration-tag">\u{1F9E0} Concentration</span>';
    }
    if (spell.ritual) {
      tags += '<span class="ritual-tag">\u{1F4D6} Ritual</span>';
    }
    const castButtonHTML = `<button class="cast-spell-modal-btn" data-spell-index="${index}" style="padding: 6px 12px; background: #9b59b6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">\u2728 Cast</button>`;
    const overrideButtonHTML = showCustomMacroButtons ? `<button class="custom-macro-btn" data-spell-index="${index}" style="padding: 6px 12px; background: #34495e; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;" title="Configure custom macros for this spell">\u2699\uFE0F</button>` : "";
    header.innerHTML = `
    <div>
      <span style="font-weight: bold;">${spell.name}</span>
      ${spell.level ? `<span style="margin-left: 10px; color: #666;">Level ${spell.level}</span>` : ""}
      ${tags}
    </div>
    <div style="display: flex; gap: 8px;">
      ${castButtonHTML}
      ${overrideButtonHTML}
      <button class="toggle-btn">\u25BC Details</button>
    </div>
  `;
    const desc = document.createElement("div");
    desc.className = "spell-description";
    desc.id = `spell-desc-${index}`;
    if (spell.attackRoll || spell.damage) {
      debug2.log(`\u{1F4DD} Spell "${spell.name}" has attack/damage:`, { attackRoll: spell.attackRoll, damage: spell.damage, damageType: spell.damageType });
    }
    desc.innerHTML = `
    ${spell.castingTime ? `<div><strong>Casting Time:</strong> ${spell.castingTime}</div>` : ""}
    ${spell.range ? `<div><strong>Range:</strong> ${spell.range}</div>` : ""}
    ${spell.components ? `<div><strong>Components:</strong> ${spell.components}</div>` : ""}
    ${spell.duration ? `<div><strong>Duration:</strong> ${spell.duration}</div>` : ""}
    ${spell.school ? `<div><strong>School:</strong> ${spell.school}</div>` : ""}
    ${spell.source ? `<div><strong>Source:</strong> ${spell.source}</div>` : ""}
    ${spell.description ? `<div style="margin-top: 10px;">${spell.description}</div>` : ""}
    ${spell.formula ? `<button class="roll-btn">\u{1F3B2} Roll ${spell.formula}</button>` : ""}
  `;
    const toggleBtn = header.querySelector(".toggle-btn");
    header.addEventListener("click", (e) => {
      if (!e.target.classList.contains("roll-btn") && !e.target.classList.contains("cast-spell-modal-btn")) {
        desc.classList.toggle("expanded");
        toggleBtn.textContent = desc.classList.contains("expanded") ? "\u25B2 Hide" : "\u25BC Details";
      }
    });
    const rollBtn = desc.querySelector(".roll-btn");
    if (rollBtn && spell.formula) {
      rollBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        roll(spell.name, spell.formula);
      });
    }
    const castModalBtn = header.querySelector(".cast-spell-modal-btn");
    if (castModalBtn) {
      castModalBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (spell.name.toLowerCase().includes("divine smite")) {
          debug2.log(`\u26A1 Divine Smite cast button clicked: ${spell.name}, showing custom modal`);
          announceSpellDescription(spell);
          showDivineSmiteModal(spell);
          return;
        }
        const normalizedSpellName = spell.name.toLowerCase().replace(/[^a-z0-9\s:]/g, "").replace(/\s+/g, " ").trim();
        const normalizedSearch = "lay on hands: heal";
        if (normalizedSpellName === normalizedSearch) {
          debug2.log(`\u{1F49A} Lay on Hands: Heal cast button clicked: ${spell.name}, showing custom modal`);
          debug2.log(`\u{1F49A} Normalized match: "${normalizedSpellName}" === "${normalizedSearch}"`);
          announceSpellDescription(spell);
          const layOnHandsPool = getLayOnHandsResource();
          if (layOnHandsPool) {
            showLayOnHandsModal(layOnHandsPool);
          } else {
            showNotification("\u274C No Lay on Hands pool resource found", "error");
          }
          return;
        }
        if (spell.name.toLowerCase().includes("lay on hands")) {
          debug2.log(`\u{1F6A8} FALLBACK: Caught Lay on Hands spell: "${spell.name}"`);
          debug2.log(`\u{1F6A8} This spell didn't match 'lay on hands: heal' but contains 'lay on hands'`);
          debug2.log(`\u{1F6A8} Showing modal anyway for debugging`);
          announceSpellDescription(spell);
          const layOnHandsPool = getLayOnHandsResource();
          if (layOnHandsPool) {
            showLayOnHandsModal(layOnHandsPool);
          } else {
            showNotification("\u274C No Lay on Hands pool resource found", "error");
          }
          return;
        }
        const spellOptionsResult = getSpellOptions(spell);
        const options = spellOptionsResult.options;
        if (spellOptionsResult.skipNormalButtons) {
          announceSpellDescription(spell);
          castSpell(spell, index, null, null, [], false, true);
          return;
        }
        if (options.length === 0) {
          announceSpellDescription(spell);
          castSpell(spell, index, null, null, [], false, true);
        } else {
          const hasConcentrationRecast = spell.concentration && concentratingSpell === spell.name;
          if (!hasConcentrationRecast) {
            announceSpellDescription(spell);
            showSpellModal(spell, index, options, true);
          } else {
            showSpellModal(spell, index, options, false);
          }
        }
      });
    }
    const customMacroBtn = header.querySelector(".custom-macro-btn");
    if (customMacroBtn) {
      customMacroBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        showCustomMacroModal(spell, index);
      });
    }
    card.appendChild(header);
    card.appendChild(desc);
    return card;
  }
  function validateSpellData(spell) {
    const issues = [];
    const warnings = [];
    if (!spell.damageRolls && !spell.attackRoll) {
      console.log(`\u2139\uFE0F Spell "${spell.name}" has no attack or damage data (utility spell)`);
      return { valid: true, issues: [], warnings: [] };
    }
    if (spell.attackRoll && spell.attackRoll !== "(none)") {
      if (typeof spell.attackRoll !== "string" || spell.attackRoll.trim() === "") {
        issues.push(`Attack roll is invalid: ${spell.attackRoll}`);
      }
    }
    if (spell.damageRolls && Array.isArray(spell.damageRolls)) {
      spell.damageRolls.forEach((roll2, index) => {
        if (!roll2.damage) {
          issues.push(`Damage roll ${index} missing formula`);
        } else if (typeof roll2.damage !== "string" || roll2.damage.trim() === "") {
          issues.push(`Damage roll ${index} has invalid formula: ${roll2.damage}`);
        }
        if (!roll2.damageType) {
          warnings.push(`Damage roll ${index} missing damage type (will show as "untyped")`);
        }
        const hasDice = /d\d+/i.test(roll2.damage);
        if (!hasDice) {
          warnings.push(`Damage roll "${roll2.damage}" doesn't contain dice notation - might be a variable reference`);
        }
      });
    }
    const description = (spell.description || "").toLowerCase();
    const summary = (spell.summary || "").toLowerCase();
    const fullText = `${summary} ${description}`;
    if (fullText) {
      const hasAttackMention = /\b(spell attack|attack roll)\b/i.test(fullText);
      const hasAttackData = spell.attackRoll && spell.attackRoll !== "(none)";
      if (hasAttackMention && !hasAttackData) {
        warnings.push(`Description mentions attack but no attack roll found`);
      } else if (!hasAttackMention && hasAttackData) {
        warnings.push(`Has attack roll but description doesn't mention attack`);
      }
      const damageMentions = fullText.match(/(\d+d\d+)/g);
      const hasDamageMention = damageMentions && damageMentions.length > 0;
      const hasDamageData = spell.damageRolls && spell.damageRolls.length > 0;
      if (hasDamageMention && !hasDamageData) {
        warnings.push(`Description mentions ${damageMentions.join(", ")} but no damage rolls found`);
      } else if (hasDamageData && !hasDamageMention) {
        console.log(`\u2139\uFE0F "${spell.name}" has ${spell.damageRolls.length} damage rolls but description doesn't show explicit dice`);
      }
    }
    if (issues.length > 0) {
      console.warn(`\u274C Validation issues for spell "${spell.name}":`, issues);
    }
    if (warnings.length > 0) {
      console.warn(`\u26A0\uFE0F Validation warnings for spell "${spell.name}":`, warnings);
    }
    if (issues.length === 0 && warnings.length === 0) {
      console.log(`\u2705 Spell "${spell.name}" validated successfully`);
    }
    return { valid: issues.length === 0, issues, warnings };
  }
  function getSpellOptions(spell) {
    const validation = validateSpellData(spell);
    console.log(`\u{1F52E} getSpellOptions for "${spell.name}":`, {
      attackRoll: spell.attackRoll,
      damageRolls: spell.damageRolls,
      damageRollsLength: spell.damageRolls ? spell.damageRolls.length : "undefined",
      damageRollsContent: JSON.stringify(spell.damageRolls),
      concentration: spell.concentration
    });
    const options = [];
    const isShield = spell.name && spell.name.toLowerCase() === "shield";
    if (spell.attackRoll && spell.attackRoll !== "(none)" && !isShield) {
      let attackFormula = spell.attackRoll;
      if (attackFormula === "use_spell_attack_bonus") {
        const attackBonus = getSpellAttackBonus();
        attackFormula = attackBonus >= 0 ? `1d20+${attackBonus}` : `1d20${attackBonus}`;
      }
      options.push({
        type: "attack",
        label: "\u2694\uFE0F Spell Attack",
        formula: attackFormula,
        icon: "\u2694\uFE0F",
        color: "#e74c3c"
      });
    }
    if (spell.damageRolls && spell.damageRolls.length > 0) {
      if (spell.isLifesteal) {
        const damageRoll = spell.damageRolls.find((r) => r.damageType && r.damageType.toLowerCase() !== "healing");
        const healingRoll = spell.damageRolls.find((r) => r.damageType && r.damageType.toLowerCase() === "healing");
        if (damageRoll && healingRoll) {
          let displayFormula = damageRoll.damage;
          if (displayFormula.includes("~target.level") && characterData.level) {
            displayFormula = displayFormula.replace(/~target\.level/g, characterData.level);
          }
          displayFormula = resolveVariablesInFormula(displayFormula);
          displayFormula = evaluateMathInFormula(displayFormula);
          let damageTypeLabel = "";
          if (damageRoll.damageType && damageRoll.damageType !== "untyped") {
            damageTypeLabel = damageRoll.damageType.charAt(0).toUpperCase() + damageRoll.damageType.slice(1);
          }
          const healingFormula = healingRoll.damage.toLowerCase();
          let healingRatio = "full";
          if (healingFormula.includes("/ 2") || healingFormula.includes("*0.5") || healingFormula.includes("half")) {
            healingRatio = "half";
          }
          options.push({
            type: "lifesteal",
            label: `${displayFormula} ${damageTypeLabel} + Heal (${healingRatio})`,
            damageFormula: damageRoll.damage,
            healingFormula: healingRoll.damage,
            damageType: damageRoll.damageType,
            healingRatio,
            icon: "\u{1F489}",
            color: "linear-gradient(135deg, #c0392b 0%, #27ae60 100%)"
          });
        }
      } else {
        spell.damageRolls.forEach((roll2, index) => {
          if (roll2.isOrGroupMember) {
            return;
          }
          const isHealing = roll2.damageType && roll2.damageType.toLowerCase() === "healing";
          const isTempHP = roll2.damageType && (roll2.damageType.toLowerCase() === "temphp" || roll2.damageType.toLowerCase() === "temporary" || roll2.damageType.toLowerCase().includes("temp"));
          let displayFormula = roll2.damage;
          if (displayFormula.includes("~target.level") && characterData.level) {
            displayFormula = displayFormula.replace(/~target\.level/g, characterData.level);
          }
          displayFormula = resolveVariablesInFormula(displayFormula);
          displayFormula = evaluateMathInFormula(displayFormula);
          if (roll2.orChoices && roll2.orChoices.length > 1) {
            roll2.orChoices.forEach((choice) => {
              let damageTypeLabel = "";
              if (choice.damageType && choice.damageType !== "untyped") {
                damageTypeLabel = choice.damageType.charAt(0).toUpperCase() + choice.damageType.slice(1);
              }
              const label = damageTypeLabel ? `${displayFormula} ${damageTypeLabel}` : displayFormula;
              const choiceIsTempHP = choice.damageType === "temphp" || choice.damageType === "temporary" || choice.damageType && choice.damageType.toLowerCase().includes("temp");
              options.push({
                type: choiceIsTempHP ? "temphp" : isHealing ? "healing" : "damage",
                label,
                formula: roll2.damage,
                damageType: choice.damageType,
                index,
                icon: choiceIsTempHP ? "\u{1F6E1}\uFE0F" : isHealing ? "\u{1F49A}" : "\u{1F4A5}",
                color: choiceIsTempHP ? "#3498db" : isHealing ? "#27ae60" : "#e67e22"
              });
            });
          } else {
            let damageTypeLabel = "";
            if (roll2.damageType && roll2.damageType !== "untyped") {
              damageTypeLabel = roll2.damageType.charAt(0).toUpperCase() + roll2.damageType.slice(1);
            }
            const label = damageTypeLabel ? `${displayFormula} ${damageTypeLabel}` : displayFormula;
            options.push({
              type: isTempHP ? "temphp" : isHealing ? "healing" : "damage",
              label,
              formula: roll2.damage,
              // Keep original formula for actual rolling
              damageType: roll2.damageType,
              index,
              icon: isTempHP ? "\u{1F6E1}\uFE0F" : isHealing ? "\u{1F49A}" : "\u{1F4A5}",
              color: isTempHP ? "#3498db" : isHealing ? "#27ae60" : "#e67e22"
            });
          }
        });
      }
    }
    console.log(`\u{1F4CB} getSpellOptions "${spell.name}" - options before edge cases:`, options.map((o) => `${o.type}: ${o.label}`));
    const result2 = applyEdgeCaseModifications(spell, options);
    console.log(`\u{1F4CB} getSpellOptions "${spell.name}" - final options:`, result2.options?.map((o) => `${o.type}: ${o.label}`), "skipNormalButtons:", result2.skipNormalButtons);
    return result2;
  }
  function showSpellModal(spell, spellIndex, options, descriptionAnnounced = false) {
    const colors = getPopupThemeColors();
    const customMacros2 = getCustomMacros(spell.name);
    const hasCustomMacros = customMacros2 && customMacros2.buttons && customMacros2.buttons.length > 0;
    const overlay = document.createElement("div");
    overlay.className = "spell-modal-overlay";
    overlay.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;";
    const modal = document.createElement("div");
    modal.className = "spell-modal";
    modal.style.cssText = `background: ${colors.background}; padding: 24px; border-radius: 8px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.3);`;
    const header = document.createElement("div");
    header.style.cssText = `margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid ${colors.border};`;
    let levelText = "";
    if (spell.level === 0) {
      levelText = `<div style="color: ${colors.infoText}; font-size: 14px;">Cantrip</div>`;
    } else if (spell.level) {
      levelText = `<div style="color: ${colors.infoText}; font-size: 14px;">Level ${spell.level} Spell</div>`;
    }
    header.innerHTML = `
    <h2 style="margin: 0 0 8px 0; color: ${colors.heading};">Cast ${spell.name}</h2>
    ${levelText}
  `;
    modal.appendChild(header);
    let slotSelect = null;
    if (spell.level && spell.level > 0) {
      const slotSection = document.createElement("div");
      slotSection.style.cssText = `margin-bottom: 16px; padding: 12px; background: ${colors.infoBox}; border-radius: 6px;`;
      const slotLabel = document.createElement("label");
      slotLabel.style.cssText = `display: block; margin-bottom: 8px; font-weight: bold; color: ${colors.text};`;
      slotLabel.textContent = "Cast at level:";
      slotSelect = document.createElement("select");
      slotSelect.style.cssText = `width: 100%; padding: 8px; border: 2px solid ${colors.border}; border-radius: 4px; font-size: 14px; background: ${colors.background}; color: ${colors.text};`;
      const pactMagicSlotLevel = characterData.spellSlots?.pactMagicSlotLevel || characterData.otherVariables?.pactMagicSlotLevel || characterData.otherVariables?.pactSlotLevelVisible || characterData.otherVariables?.pactSlotLevel || characterData.otherVariables?.slotLevel;
      const pactMagicSlots = characterData.spellSlots?.pactMagicSlots ?? characterData.otherVariables?.pactMagicSlots ?? characterData.otherVariables?.pactSlot ?? 0;
      const pactMagicSlotsMax = characterData.spellSlots?.pactMagicSlotsMax ?? characterData.otherVariables?.pactMagicSlotsMax ?? characterData.otherVariables?.pactSlotMax ?? 0;
      const hasPactMagic = pactMagicSlotsMax > 0;
      const effectivePactLevel = pactMagicSlotLevel || (hasPactMagic ? 5 : 0);
      debug2.log(`\u{1F52E} Pact Magic check: level=${pactMagicSlotLevel} (effective=${effectivePactLevel}), slots=${pactMagicSlots}/${pactMagicSlotsMax}, hasPact=${hasPactMagic}`);
      let hasAnySlots = false;
      let firstValidOption = null;
      if (hasPactMagic && spell.level <= effectivePactLevel) {
        hasAnySlots = true;
        const option = document.createElement("option");
        option.value = `pact:${effectivePactLevel}`;
        option.textContent = `Level ${effectivePactLevel} - Pact Magic (${pactMagicSlots}/${pactMagicSlotsMax})`;
        option.disabled = pactMagicSlots === 0;
        slotSelect.appendChild(option);
        if (!option.disabled && !firstValidOption) {
          firstValidOption = option;
        }
        debug2.log(`\u{1F52E} Added Pact Magic slot option: Level ${effectivePactLevel} (${pactMagicSlots}/${pactMagicSlotsMax})`);
      }
      for (let level = spell.level; level <= 9; level++) {
        const slotsProp = `level${level}SpellSlots`;
        const maxSlotsProp = `level${level}SpellSlotsMax`;
        let available = characterData.spellSlots?.[slotsProp] || characterData[slotsProp] || 0;
        let max = characterData.spellSlots?.[maxSlotsProp] || characterData[maxSlotsProp] || 0;
        if (hasPactMagic && level === effectivePactLevel) {
          available = Math.max(0, available - pactMagicSlots);
          max = Math.max(0, max - pactMagicSlotsMax);
        }
        if (max > 0) {
          hasAnySlots = true;
          const option = document.createElement("option");
          option.value = level;
          option.textContent = `Level ${level} (${available}/${max} slots)`;
          option.disabled = available === 0;
          slotSelect.appendChild(option);
          if (!option.disabled && !firstValidOption) {
            firstValidOption = option;
          }
        }
      }
      if (firstValidOption) {
        firstValidOption.selected = true;
      }
      if (!hasAnySlots) {
        const noSlotsOption = document.createElement("option");
        noSlotsOption.value = spell.level;
        noSlotsOption.textContent = "No spell slots available";
        noSlotsOption.disabled = true;
        noSlotsOption.selected = true;
        slotSelect.appendChild(noSlotsOption);
      }
      slotSection.appendChild(slotLabel);
      slotSection.appendChild(slotSelect);
      modal.appendChild(slotSection);
      slotSelect.updateButtonLabels = null;
    }
    let skipSlotCheckbox = null;
    const isCantrip = spell.level === 0;
    const isConcentrationRecast = spell.concentration && concentratingSpell === spell.name;
    const isReuseableSpellType = !isCantrip && isReuseableSpell(spell.name, characterData);
    const castSpellsKey = `castSpells_${characterData.name}`;
    const castSpells = JSON.parse(localStorage.getItem(castSpellsKey) || "[]");
    const wasAlreadyCast = castSpells.includes(spell.name);
    if (!isCantrip && (isConcentrationRecast || isReuseableSpellType)) {
      const recastSection = document.createElement("div");
      recastSection.style.cssText = "margin-bottom: 16px; padding: 12px; background: #fff3cd; border-radius: 6px; border: 2px solid #f39c12;";
      const checkboxContainer = document.createElement("label");
      checkboxContainer.style.cssText = "display: flex; align-items: center; gap: 8px; cursor: pointer;";
      skipSlotCheckbox = document.createElement("input");
      skipSlotCheckbox.type = "checkbox";
      skipSlotCheckbox.checked = isConcentrationRecast || wasAlreadyCast;
      skipSlotCheckbox.style.cssText = "width: 20px; height: 20px;";
      const checkboxLabel = document.createElement("span");
      checkboxLabel.style.cssText = "font-weight: bold; color: #856404;";
      if (isConcentrationRecast) {
        checkboxLabel.textContent = "\u{1F9E0} Already concentrating - don't consume spell slot";
      } else if (wasAlreadyCast) {
        checkboxLabel.textContent = "\u2694\uFE0F Spell already active - don't consume spell slot";
      } else {
        checkboxLabel.textContent = "\u2694\uFE0F Reuse spell effect without consuming slot (first cast required)";
      }
      checkboxContainer.appendChild(skipSlotCheckbox);
      checkboxContainer.appendChild(checkboxLabel);
      recastSection.appendChild(checkboxContainer);
      const helpText = document.createElement("div");
      helpText.style.cssText = "font-size: 0.85em; color: #856404; margin-top: 6px; margin-left: 28px;";
      if (isConcentrationRecast) {
        helpText.textContent = "You can use this spell's effect again while concentrating on it without recasting.";
      } else {
        helpText.textContent = "You can use this spell's effect again while it's active without recasting.";
      }
      recastSection.appendChild(helpText);
      modal.appendChild(recastSection);
      skipSlotCheckbox.addEventListener("change", () => {
        if (slotSelect) {
          slotSelect.disabled = skipSlotCheckbox.checked;
          slotSelect.style.opacity = skipSlotCheckbox.checked ? "0.5" : "1";
        }
      });
      if (slotSelect && skipSlotCheckbox.checked) {
        slotSelect.disabled = true;
        slotSelect.style.opacity = "0.5";
      }
    }
    const metamagicCheckboxes = [];
    const validMetamagicNames = [
      "Careful Spell",
      "Distant Spell",
      "Empowered Spell",
      "Extended Spell",
      "Heightened Spell",
      "Quickened Spell",
      "Subtle Spell",
      "Twinned Spell"
    ];
    const metamagicFeatures = characterData.features ? characterData.features.filter(
      (f) => f.name && validMetamagicNames.includes(f.name)
    ) : [];
    if (metamagicFeatures.length > 0) {
      const metamagicSection = document.createElement("div");
      metamagicSection.style.cssText = `margin-bottom: 16px; padding: 12px; background: ${colors.infoBox}; border-radius: 6px; border: 1px solid ${colors.border};`;
      const metamagicTitle = document.createElement("div");
      metamagicTitle.style.cssText = `font-weight: bold; margin-bottom: 8px; color: ${colors.text};`;
      metamagicTitle.textContent = "Metamagic:";
      metamagicSection.appendChild(metamagicTitle);
      metamagicFeatures.forEach((feature) => {
        const checkboxContainer = document.createElement("label");
        checkboxContainer.style.cssText = "display: flex; align-items: center; gap: 8px; margin-bottom: 4px; cursor: pointer;";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = feature.name;
        checkbox.style.cssText = "width: 18px; height: 18px;";
        const label = document.createElement("span");
        label.textContent = feature.name;
        label.style.cssText = `font-size: 14px; color: ${colors.infoText};`;
        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(label);
        metamagicSection.appendChild(checkboxContainer);
        metamagicCheckboxes.push(checkbox);
      });
      modal.appendChild(metamagicSection);
    }
    let spellCast = false;
    let usedSlot = null;
    const hasAttack = options.some((opt) => opt.type === "attack");
    const hasDamage = options.some((opt) => opt.type === "damage" || opt.type === "healing");
    const optionsContainer = document.createElement("div");
    optionsContainer.style.cssText = "display: flex; flex-direction: column; gap: 12px;";
    function getResolvedLabel(option, selectedSlotLevel) {
      if (option.type === "attack") {
        return option.label;
      }
      let formula2 = option.type === "lifesteal" ? option.damageFormula : option.formula;
      debug2.log(`\u{1F3F7}\uFE0F getResolvedLabel called with formula: "${formula2}", slotLevel: ${selectedSlotLevel}`);
      if (selectedSlotLevel != null && formula2 && /slotlevel/i.test(formula2)) {
        const originalFormula = formula2;
        formula2 = formula2.replace(/slotlevel/gi, String(selectedSlotLevel));
        debug2.log(`  \u2705 Replaced slotLevel: "${originalFormula}" -> "${formula2}"`);
      }
      if (formula2 && formula2.includes("~target.level") && characterData.level) {
        formula2 = formula2.replace(/~target\.level/g, characterData.level);
      }
      formula2 = resolveVariablesInFormula(formula2);
      formula2 = evaluateMathInFormula(formula2);
      debug2.log(`  \u{1F4CA} Final resolved formula: "${formula2}"`);
      if (option.type === "lifesteal") {
        let damageTypeLabel = "";
        if (option.damageType && option.damageType !== "untyped") {
          damageTypeLabel = option.damageType.charAt(0).toUpperCase() + option.damageType.slice(1);
        }
        return `${formula2} ${damageTypeLabel} + Heal (${option.healingRatio})`;
      } else if (option.type === "damage" || option.type === "healing" || option.type === "temphp") {
        let damageTypeLabel = "";
        if (option.damageType && option.damageType !== "untyped") {
          damageTypeLabel = option.damageType.charAt(0).toUpperCase() + option.damageType.slice(1);
        }
        return damageTypeLabel ? `${formula2} ${damageTypeLabel}` : formula2;
      }
      return option.label;
    }
    const optionButtons = [];
    if (hasCustomMacros) {
      customMacros2.buttons.forEach((customBtn, index) => {
        const btn = document.createElement("button");
        btn.className = "spell-custom-macro-btn";
        btn.style.cssText = `
        padding: 12px 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        font-size: 16px;
        text-align: left;
        transition: opacity 0.2s, transform 0.2s;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      `;
        btn.innerHTML = customBtn.label;
        btn.addEventListener("mouseenter", () => {
          btn.style.opacity = "0.9";
          btn.style.transform = "translateY(-2px)";
        });
        btn.addEventListener("mouseleave", () => {
          btn.style.opacity = "1";
          btn.style.transform = "translateY(0)";
        });
        btn.addEventListener("click", () => {
          const colorBanner = getColoredBanner();
          const message = customBtn.macro;
          const messageData = {
            action: "announceSpell",
            message,
            color: characterData.notificationColor
          };
          if (window.opener && !window.opener.closed) {
            try {
              window.opener.postMessage(messageData, "*");
              debug2.log("\u2705 Custom macro sent via window.opener");
            } catch (error) {
              debug2.warn("\u26A0\uFE0F Could not send via window.opener:", error.message);
            }
          } else {
            browserAPI.runtime.sendMessage({
              action: "relayRollToRoll20",
              roll: messageData
            });
          }
          showNotification(`\u2728 ${spell.name} - Custom Macro Sent!`, "success");
          document.body.removeChild(overlay);
        });
        optionsContainer.appendChild(btn);
      });
      if (customMacros2.skipNormalButtons) {
        debug2.log(`\u2699\uFE0F Skipping normal spell buttons for "${spell.name}" (custom macros only)`);
        options = [];
      }
    }
    options.forEach((option) => {
      const btn = document.createElement("button");
      btn.className = `spell-option-btn-${option.type}`;
      const isLifesteal = option.type === "lifesteal";
      const boxShadow = isLifesteal ? "box-shadow: 0 4px 8px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(0,0,0,0.2);" : "";
      const border = isLifesteal ? "border: 2px solid rgba(255,255,255,0.3);" : "border: none;";
      btn.style.cssText = `
      padding: 12px 16px;
      background: ${option.color};
      color: white;
      ${border}
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
      font-size: 16px;
      text-align: left;
      transition: opacity 0.2s, transform 0.2s;
      ${boxShadow}
    `;
      const initialSlotLevel = spell.level || null;
      const resolvedLabel = getResolvedLabel(option, initialSlotLevel);
      const edgeCaseNote = option.edgeCaseNote ? `<div style="font-size: 0.8em; color: #666; margin-top: 2px;">${option.edgeCaseNote}</div>` : "";
      btn.innerHTML = `${option.icon} ${resolvedLabel}${edgeCaseNote}`;
      btn.dataset.optionIndex = optionButtons.length;
      btn.addEventListener("mouseenter", () => {
        btn.style.opacity = "0.9";
        if (isLifesteal)
          btn.style.transform = "translateY(-2px)";
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.opacity = "1";
        if (isLifesteal)
          btn.style.transform = "translateY(0)";
      });
      optionButtons.push({ button: btn, option });
      btn.addEventListener("click", () => {
        const selectedSlotLevel = slotSelect ? parseInt(slotSelect.value) : spell.level || null;
        const selectedMetamagic = metamagicCheckboxes.filter((cb) => cb.checked).map((cb) => cb.value);
        const skipSlot = skipSlotCheckbox ? skipSlotCheckbox.checked : false;
        if (option.type === "cast") {
          if (!descriptionAnnounced && !skipSlot) {
            announceSpellDescription(spell, selectedSlotLevel);
          }
          const afterCast = (spell2, slot) => {
            usedSlot = slot;
            showNotification(`\u2728 ${spell2.name} cast successfully!`, "success");
          };
          castSpell(spell, spellIndex, afterCast, selectedSlotLevel, selectedMetamagic, skipSlot, true);
          spellCast = true;
          btn.disabled = true;
          btn.style.opacity = "0.5";
          btn.style.cursor = "not-allowed";
        } else if (option.type === "attack") {
          if (!descriptionAnnounced && !skipSlot) {
            announceSpellDescription(spell, selectedSlotLevel);
          }
          const afterCast = (spell2, slot) => {
            usedSlot = slot;
            const attackBonus = getSpellAttackBonus();
            const attackFormula = attackBonus >= 0 ? `1d20+${attackBonus}` : `1d20${attackBonus}`;
            roll(`${spell2.name} - Spell Attack`, attackFormula);
          };
          castSpell(spell, spellIndex, afterCast, selectedSlotLevel, selectedMetamagic, skipSlot, true);
          spellCast = true;
          if (slotSelect)
            slotSelect.disabled = true;
          metamagicCheckboxes.forEach((cb) => cb.disabled = true);
          btn.disabled = true;
          btn.style.opacity = "0.5";
          btn.style.cursor = "not-allowed";
        } else if (option.type === "damage" || option.type === "healing" || option.type === "temphp") {
          if (!spellCast) {
            if (!descriptionAnnounced && !skipSlot) {
              announceSpellDescription(spell, selectedSlotLevel);
            }
            const afterCast = (spell2, slot) => {
              usedSlot = slot;
              let formula2 = option.formula;
              const actualSlotLevel = selectedSlotLevel != null ? selectedSlotLevel : slot && slot.level;
              if (actualSlotLevel != null) {
                formula2 = formula2.replace(/slotlevel/gi, actualSlotLevel);
              }
              if (formula2.includes("~target.level") && characterData.level) {
                formula2 = formula2.replace(/~target\.level/g, characterData.level);
              }
              formula2 = resolveVariablesInFormula(formula2);
              formula2 = evaluateMathInFormula(formula2);
              const label = option.type === "healing" ? `${spell2.name} - Healing` : option.type === "temphp" ? `${spell2.name} - Temp HP` : `${spell2.name} - Damage (${option.damageType || ""})`;
              roll(label, formula2);
            };
            castSpell(spell, spellIndex, afterCast, selectedSlotLevel, selectedMetamagic, skipSlot, true);
          } else {
            let formula2 = option.formula;
            const actualSlotLevel = selectedSlotLevel != null ? selectedSlotLevel : usedSlot && usedSlot.level;
            if (actualSlotLevel != null) {
              formula2 = formula2.replace(/slotlevel/gi, actualSlotLevel);
            }
            if (formula2.includes("~target.level") && characterData.level) {
              formula2 = formula2.replace(/~target\.level/g, characterData.level);
            }
            formula2 = resolveVariablesInFormula(formula2);
            formula2 = evaluateMathInFormula(formula2);
            const label = option.type === "healing" ? `${spell.name} - Healing` : option.type === "temphp" ? `${spell.name} - Temp HP` : `${spell.name} - Damage (${option.damageType || ""})`;
            roll(label, formula2);
          }
          document.body.removeChild(overlay);
        } else if (option.type === "lifesteal") {
          if (!descriptionAnnounced && !skipSlot) {
            announceSpellDescription(spell, selectedSlotLevel);
          }
          const afterCast = (spell2, slot) => {
            let damageFormula = option.damageFormula;
            const actualSlotLevel = selectedSlotLevel != null ? selectedSlotLevel : slot && slot.level;
            if (actualSlotLevel != null) {
              damageFormula = damageFormula.replace(/slotlevel/gi, actualSlotLevel);
            }
            if (damageFormula.includes("~target.level") && characterData.level) {
              damageFormula = damageFormula.replace(/~target\.level/g, characterData.level);
            }
            damageFormula = resolveVariablesInFormula(damageFormula);
            damageFormula = evaluateMathInFormula(damageFormula);
            roll(`${spell2.name} - Lifesteal Damage (${option.damageType})`, damageFormula);
            setTimeout(() => {
              const healingText = option.healingRatio === "half" ? "half" : "the full amount";
              const damageDealt = prompt(`\u{1F489} Lifesteal: Enter the damage dealt

You regain HP equal to ${healingText} of the damage.`);
              if (damageDealt && !isNaN(damageDealt)) {
                const damage = parseInt(damageDealt);
                const healing = option.healingRatio === "half" ? Math.floor(damage / 2) : damage;
                const oldHP = characterData.hitPoints.current;
                const maxHP = characterData.hitPoints.max;
                characterData.hitPoints.current = Math.min(oldHP + healing, maxHP);
                const actualHealing = characterData.hitPoints.current - oldHP;
                if (oldHP === 0 && actualHealing > 0) {
                  characterData.deathSaves = { successes: 0, failures: 0 };
                  debug2.log("\u267B\uFE0F Death saves reset due to healing");
                }
                saveCharacterData();
                buildSheet(characterData);
                const colorBanner = getColoredBanner();
                const message = `&{template:default} {{name=${colorBanner}${characterData.name} - Lifesteal}} {{\u{1F489} Damage Dealt=${damage}}} {{\u{1F49A} HP Regained=${actualHealing}}} {{Current HP=${characterData.hitPoints.current}/${maxHP}}}`;
                const messageData = {
                  action: "announceSpell",
                  message,
                  color: characterData.notificationColor
                };
                if (window.opener && !window.opener.closed) {
                  try {
                    window.opener.postMessage(messageData, "*");
                  } catch (error) {
                    debug2.warn("\u26A0\uFE0F Could not send via window.opener:", error.message);
                  }
                } else {
                  browserAPI.runtime.sendMessage({
                    action: "relayRollToRoll20",
                    roll: messageData
                  });
                }
                showNotification(`\u{1F489} Lifesteal! Dealt ${damage} damage, regained ${actualHealing} HP`, "success");
              }
            }, 500);
          };
          castSpell(spell, spellIndex, afterCast, selectedSlotLevel, selectedMetamagic, skipSlot, true);
          document.body.removeChild(overlay);
        }
      });
      optionsContainer.appendChild(btn);
    });
    if (slotSelect) {
      const updateButtonLabels = () => {
        const selectedSlotLevel = parseInt(slotSelect.value);
        optionButtons.forEach(({ button, option }) => {
          const resolvedLabel = getResolvedLabel(option, selectedSlotLevel);
          const edgeCaseNote = option.edgeCaseNote ? `<div style="font-size: 0.8em; color: #666; margin-top: 2px;">${option.edgeCaseNote}</div>` : "";
          button.innerHTML = `${option.icon} ${resolvedLabel}${edgeCaseNote}`;
        });
      };
      slotSelect.addEventListener("change", updateButtonLabels);
      updateButtonLabels();
    }
    if (hasAttack && hasDamage) {
      const doneBtn = document.createElement("button");
      doneBtn.style.cssText = "padding: 10px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;";
      doneBtn.textContent = "Done";
      doneBtn.addEventListener("click", () => {
        document.body.removeChild(overlay);
      });
      optionsContainer.appendChild(doneBtn);
    }
    modal.appendChild(optionsContainer);
    const cancelBtn = document.createElement("button");
    cancelBtn.style.cssText = "margin-top: 16px; padding: 10px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; width: 100%;";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => {
      document.body.removeChild(overlay);
    });
    modal.appendChild(cancelBtn);
    overlay.appendChild(modal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
    document.body.appendChild(overlay);
  }
  function handleSpellOption(spell, spellIndex, option) {
    if (option.type === "attack") {
      const afterCast = (spell2, slot) => {
        const attackBonus = getSpellAttackBonus();
        const attackFormula = attackBonus >= 0 ? `1d20+${attackBonus}` : `1d20${attackBonus}`;
        roll(`${spell2.name} - Spell Attack`, attackFormula);
      };
      castSpell(spell, spellIndex, afterCast);
    } else if (option.type === "damage" || option.type === "healing") {
      let damageType = option.damageType;
      if (option.orChoices && option.orChoices.length > 1) {
        const choiceText = option.orChoices.map((c, i2) => `${i2 + 1}. ${c.damageType}`).join("\n");
        const choice = prompt(`Choose damage type for ${spell.name}:
${choiceText}

Enter number (1-${option.orChoices.length}):`);
        if (choice === null)
          return;
        const choiceIndex = parseInt(choice) - 1;
        if (choiceIndex >= 0 && choiceIndex < option.orChoices.length) {
          damageType = option.orChoices[choiceIndex].damageType;
        } else {
          alert(`Invalid choice. Please try again.`);
          return;
        }
      }
      const afterCast = (spell2, slot) => {
        let formula2 = option.formula;
        if (slot && slot.level) {
          formula2 = formula2.replace(/slotlevel/gi, slot.level);
        }
        formula2 = resolveVariablesInFormula(formula2);
        formula2 = evaluateMathInFormula(formula2);
        const label = option.type === "healing" ? `${spell2.name} - Healing` : damageType ? `${spell2.name} - Damage (${damageType})` : `${spell2.name} - Damage`;
        roll(label, formula2);
      };
      castSpell(spell, spellIndex, afterCast);
    }
  }
  function getCustomMacros(spellName) {
    const key = `customMacros_${characterData.name}`;
    const allMacros = JSON.parse(localStorage.getItem(key) || "{}");
    return allMacros[spellName] || null;
  }
  function saveCustomMacros(spellName, macros) {
    const key = `customMacros_${characterData.name}`;
    const allMacros = JSON.parse(localStorage.getItem(key) || "{}");
    if (macros && macros.buttons && macros.buttons.length > 0) {
      allMacros[spellName] = macros;
    } else {
      delete allMacros[spellName];
    }
    localStorage.setItem(key, JSON.stringify(allMacros));
    debug2.log(`\u{1F4BE} Saved custom macros for "${spellName}":`, macros);
  }
  function showCustomMacroModal(spell, spellIndex) {
    const overlay = document.createElement("div");
    overlay.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;";
    const modal = document.createElement("div");
    modal.style.cssText = "background: white; padding: 24px; border-radius: 8px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.3);";
    const existingMacros = getCustomMacros(spell.name);
    const skipNormalButtons = existingMacros?.skipNormalButtons || false;
    modal.innerHTML = `
    <h2 style="margin: 0 0 16px 0; color: #333;">Custom Macros: ${spell.name}</h2>
    <p style="margin: 0 0 16px 0; color: #666; font-size: 14px;">
      Configure custom macro buttons for this spell. Use this for magic item spells or custom variants that don't work with the default buttons.
    </p>

    <div style="margin-bottom: 16px;">
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <input type="checkbox" id="skipNormalButtons" ${skipNormalButtons ? "checked" : ""} style="width: 18px; height: 18px;">
        <span style="font-weight: bold;">Replace default buttons (hide attack/damage buttons)</span>
      </label>
      <p style="margin: 4px 0 0 26px; color: #666; font-size: 13px;">
        Check this to only show your custom macros, hiding the default spell buttons
      </p>
    </div>

    <div id="macro-buttons-container" style="margin-bottom: 16px;">
      <!-- Macro buttons will be added here -->
    </div>

    <button id="add-macro-btn" style="padding: 8px 16px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-bottom: 16px;">
      \u2795 Add Macro Button
    </button>

    <div style="margin-top: 24px; padding-top: 16px; border-top: 2px solid #eee; display: flex; gap: 12px; justify-content: flex-end;">
      <button id="clear-macros-btn" style="padding: 10px 20px; background: #e74c3c; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
        \u{1F5D1}\uFE0F Clear All
      </button>
      <button id="cancel-macros-btn" style="padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
        Cancel
      </button>
      <button id="save-macros-btn" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
        \u{1F4BE} Save
      </button>
    </div>
  `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    const container = modal.querySelector("#macro-buttons-container");
    const addBtn = modal.querySelector("#add-macro-btn");
    const clearBtn = modal.querySelector("#clear-macros-btn");
    const cancelBtn = modal.querySelector("#cancel-macros-btn");
    const saveBtn = modal.querySelector("#save-macros-btn");
    let macroCounter = 0;
    function addMacroButton(label = "", macro = "") {
      const macroDiv = document.createElement("div");
      macroDiv.className = "macro-button-config";
      macroDiv.style.cssText = "padding: 12px; background: #f8f9fa; border-radius: 6px; margin-bottom: 12px; border: 2px solid #dee2e6;";
      macroDiv.dataset.macroId = macroCounter++;
      macroDiv.innerHTML = `
      <div style="margin-bottom: 8px;">
        <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #333;">Button Label:</label>
        <input type="text" class="macro-label" value="${label}" placeholder="e.g., \u2694\uFE0F Attack, \u{1F4A5} Damage, \u2728 Cast" style="width: 100%; padding: 8px; border: 2px solid #ddd; border-radius: 4px; font-size: 14px;">
      </div>
      <div style="margin-bottom: 8px;">
        <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #333;">Macro Text:</label>
        <textarea class="macro-text" placeholder="&{template:default} {{name=My Spell}} {{effect=Custom effect}}" style="width: 100%; padding: 8px; border: 2px solid #ddd; border-radius: 4px; font-size: 13px; font-family: monospace; min-height: 80px;">${macro}</textarea>
      </div>
      <button class="remove-macro-btn" style="padding: 6px 12px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
        \u274C Remove
      </button>
    `;
      const removeBtn = macroDiv.querySelector(".remove-macro-btn");
      removeBtn.addEventListener("click", () => {
        macroDiv.remove();
      });
      container.appendChild(macroDiv);
    }
    if (existingMacros && existingMacros.buttons && existingMacros.buttons.length > 0) {
      existingMacros.buttons.forEach((btn) => {
        addMacroButton(btn.label, btn.macro);
      });
    } else {
      addMacroButton();
    }
    addBtn.addEventListener("click", () => addMacroButton());
    clearBtn.addEventListener("click", () => {
      if (confirm(`Clear all custom macros for "${spell.name}"?`)) {
        saveCustomMacros(spell.name, null);
        document.body.removeChild(overlay);
        showNotification(`\u{1F5D1}\uFE0F Cleared custom macros for ${spell.name}`, "success");
      }
    });
    cancelBtn.addEventListener("click", () => {
      document.body.removeChild(overlay);
    });
    saveBtn.addEventListener("click", () => {
      const macroConfigs = Array.from(container.querySelectorAll(".macro-button-config"));
      const buttons = macroConfigs.map((config) => {
        const label = config.querySelector(".macro-label").value.trim();
        const macro = config.querySelector(".macro-text").value.trim();
        return { label, macro };
      }).filter((btn) => btn.label && btn.macro);
      const skipNormalButtons2 = modal.querySelector("#skipNormalButtons").checked;
      saveCustomMacros(spell.name, {
        buttons,
        skipNormalButtons: skipNormalButtons2
      });
      document.body.removeChild(overlay);
      showNotification(`\u{1F4BE} Saved custom macros for ${spell.name}`, "success");
    });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
  }
  function castSpell(spell, index, afterCast = null, selectedSlotLevel = null, selectedMetamagic = [], skipSlotConsumption = false, skipAnnouncement = false) {
    debug2.log("\u2728 Attempting to cast:", spell.name, spell, "at level:", selectedSlotLevel, "with metamagic:", selectedMetamagic, "skipSlot:", skipSlotConsumption, "skipAnnouncement:", skipAnnouncement);
    if (!characterData) {
      showNotification("\u274C Character data not available", "error");
      return;
    }
    const isMagicItemSpell = spell.source && (spell.source.toLowerCase().includes("amulet") || spell.source.toLowerCase().includes("ring") || spell.source.toLowerCase().includes("wand") || spell.source.toLowerCase().includes("staff") || spell.source.toLowerCase().includes("rod") || spell.source.toLowerCase().includes("cloak") || spell.source.toLowerCase().includes("boots") || spell.source.toLowerCase().includes("bracers") || spell.source.toLowerCase().includes("gauntlets") || spell.source.toLowerCase().includes("helm") || spell.source.toLowerCase().includes("armor") || spell.source.toLowerCase().includes("weapon") || spell.source.toLowerCase().includes("talisman") || spell.source.toLowerCase().includes("orb") || spell.source.toLowerCase().includes("scroll") || spell.source.toLowerCase().includes("potion"));
    const isFreeSpell = spell.resources && spell.resources.itemsConsumed && spell.resources.itemsConsumed.length > 0;
    if (!spell.level || spell.level === 0 || spell.level === "0" || isMagicItemSpell || isFreeSpell || skipSlotConsumption) {
      const reason = skipSlotConsumption ? "concentration recast" : isMagicItemSpell ? "magic item" : isFreeSpell ? "free spell" : "cantrip";
      debug2.log(`\u2728 Casting ${reason} (no spell slot needed)`);
      if (!skipAnnouncement) {
        announceSpellCast(spell, skipSlotConsumption ? "concentration recast (no slot)" : isMagicItemSpell || isFreeSpell ? `${spell.source} (no slot)` : null);
      }
      showNotification(`\u2728 ${skipSlotConsumption ? "Using" : "Cast"} ${spell.name}!`);
      if (spell.concentration && !skipSlotConsumption) {
        setConcentration(spell.name);
      }
      const shouldTrackAsReusable = isReuseableSpell(spell.name, characterData);
      if (shouldTrackAsReusable && !skipSlotConsumption) {
        const castSpellsKey = `castSpells_${characterData.name}`;
        const castSpells = JSON.parse(localStorage.getItem(castSpellsKey) || "[]");
        if (!castSpells.includes(spell.name)) {
          castSpells.push(spell.name);
          localStorage.setItem(castSpellsKey, JSON.stringify(castSpells));
          debug2.log(`\u2705 Tracked reuseable spell: ${spell.name}`);
        }
      }
      if (afterCast && typeof afterCast === "function") {
        setTimeout(() => {
          const fakeSlotLevel = skipSlotConsumption && selectedSlotLevel ? selectedSlotLevel : spell.level;
          const fakeSlot = (isMagicItemSpell || isFreeSpell || skipSlotConsumption) && fakeSlotLevel ? { level: parseInt(fakeSlotLevel) } : null;
          afterCast(spell, fakeSlot);
        }, 300);
      }
      return;
    }
    const spellLevel = parseInt(spell.level);
    if (selectedSlotLevel !== null) {
      const slotsObject = characterData.spellSlots || characterData;
      const isPactMagicSlot = typeof selectedSlotLevel === "string" && selectedSlotLevel.startsWith("pact:");
      let actualLevel, slotVar, currentSlots, slotLabel;
      if (isPactMagicSlot) {
        actualLevel = parseInt(selectedSlotLevel.split(":")[1]);
        slotVar = "pactMagicSlots";
        currentSlots = slotsObject.pactMagicSlots ?? characterData.otherVariables?.pactMagicSlots ?? 0;
        slotLabel = `Pact Magic (level ${actualLevel})`;
        debug2.log(`\u{1F52E} Using Pact Magic slot at level ${actualLevel}, current=${currentSlots}`);
      } else {
        actualLevel = parseInt(selectedSlotLevel);
        slotVar = `level${actualLevel}SpellSlots`;
        currentSlots = slotsObject[slotVar] || 0;
        slotLabel = `level ${actualLevel} slot`;
      }
      if (currentSlots <= 0) {
        showNotification(`\u274C No ${slotLabel} remaining!`, "error");
        return;
      }
      if (isPactMagicSlot) {
        if (slotsObject.pactMagicSlots !== void 0) {
          slotsObject.pactMagicSlots = currentSlots - 1;
        }
        if (characterData.otherVariables?.pactMagicSlots !== void 0) {
          characterData.otherVariables.pactMagicSlots = currentSlots - 1;
        }
        debug2.log(`\u{1F52E} Consumed Pact Magic slot: ${currentSlots} -> ${currentSlots - 1}`);
      } else {
        slotsObject[slotVar] = currentSlots - 1;
      }
      saveCharacterData();
      buildSheet(characterData);
      if (selectedMetamagic && selectedMetamagic.length > 0) {
        debug2.log("Metamagic selected:", selectedMetamagic);
      }
      selectedSlotLevel = actualLevel;
      if (!skipAnnouncement) {
        announceSpellCast(spell, slotLabel);
      }
      showNotification(`\u2728 Cast ${spell.name} using ${slotLabel}!`);
      if (spell.concentration) {
        setConcentration(spell.name);
      }
      const shouldTrackAsReusable = isReuseableSpell(spell.name, characterData);
      if (shouldTrackAsReusable) {
        const castSpellsKey = `castSpells_${characterData.name}`;
        const castSpells = JSON.parse(localStorage.getItem(castSpellsKey) || "[]");
        if (!castSpells.includes(spell.name)) {
          castSpells.push(spell.name);
          localStorage.setItem(castSpellsKey, JSON.stringify(castSpells));
          debug2.log(`\u2705 Tracked reuseable spell: ${spell.name}`);
        }
      }
      if (afterCast && typeof afterCast === "function") {
        setTimeout(() => {
          afterCast(spell, { level: selectedSlotLevel });
        }, 300);
      }
      return;
    }
    if (spell.name.toLowerCase().includes("divine smite")) {
      debug2.log(`\u26A1 Divine Smite spell detected, showing custom modal instead of upcast`);
      showDivineSmiteModal(spell);
      return;
    }
    showUpcastChoice(spell, spellLevel, afterCast);
  }
  function detectClassResources(spell) {
    return executorDetectClassResources(characterData);
  }
  function showResourceChoice(spell, spellLevel, spellSlots, maxSlots, classResources) {
    const modal = document.createElement("div");
    modal.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;";
    const modalContent = document.createElement("div");
    modalContent.style.cssText = "background: white; padding: 30px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); max-width: 400px; width: 90%;";
    let buttonsHTML = `
    <h3 style="margin: 0 0 20px 0; color: #2c3e50; text-align: center;">Cast ${spell.name}</h3>
    <p style="text-align: center; color: #7f8c8d; margin-bottom: 25px;">Choose a resource:</p>
    <div style="display: flex; flex-direction: column; gap: 12px;">
  `;
    if (spellSlots > 0) {
      buttonsHTML += `
      <button class="resource-choice-btn" data-type="spell-slot" data-level="${spellLevel}" style="padding: 15px; font-size: 1em; font-weight: bold; background: #9b59b6; color: white; border: 2px solid #9b59b6; border-radius: 8px; cursor: pointer; transition: all 0.2s; text-align: left;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>Level ${spellLevel} Spell Slot</span>
          <span style="background: rgba(255,255,255,0.3); padding: 4px 8px; border-radius: 4px; font-size: 0.9em;">${spellSlots}/${maxSlots}</span>
        </div>
      </button>
    `;
    }
    classResources.forEach((resource, idx) => {
      const colors = {
        "Ki": { bg: "#f39c12", border: "#f39c12" },
        "Sorcery Points": { bg: "#e74c3c", border: "#e74c3c" },
        "Pact Magic": { bg: "#16a085", border: "#16a085" },
        "Channel Divinity": { bg: "#3498db", border: "#3498db" }
      };
      const color = colors[resource.name] || { bg: "#95a5a6", border: "#95a5a6" };
      buttonsHTML += `
      <button class="resource-choice-btn" data-type="class-resource" data-index="${idx}" style="padding: 15px; font-size: 1em; font-weight: bold; background: ${color.bg}; color: white; border: 2px solid ${color.border}; border-radius: 8px; cursor: pointer; transition: all 0.2s; text-align: left;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>${resource.name}</span>
          <span style="background: rgba(255,255,255,0.3); padding: 4px 8px; border-radius: 4px; font-size: 0.9em;">${resource.current}/${resource.max}</span>
        </div>
      </button>
    `;
    });
    buttonsHTML += `
    </div>
    <button id="resource-cancel" style="width: 100%; margin-top: 20px; padding: 12px; font-size: 1em; background: #95a5a6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
      Cancel
    </button>
  `;
    modalContent.innerHTML = buttonsHTML;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    const resourceBtns = modalContent.querySelectorAll(".resource-choice-btn");
    resourceBtns.forEach((btn) => {
      btn.addEventListener("mouseenter", () => {
        btn.style.transform = "translateY(-2px)";
        btn.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "translateY(0)";
        btn.style.boxShadow = "none";
      });
      btn.addEventListener("click", () => {
        const type = btn.dataset.type;
        if (type === "spell-slot") {
          const level = parseInt(btn.dataset.level);
          modal.remove();
          showUpcastChoice(spell, level);
        } else if (type === "class-resource") {
          const resourceIdx = parseInt(btn.dataset.index);
          const resource = classResources[resourceIdx];
          modal.remove();
          if (useClassResource(resource, spell)) {
            announceSpellCast(spell, resource.name);
          }
        }
      });
    });
    document.getElementById("resource-cancel").addEventListener("click", () => {
      modal.remove();
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  function showUpcastChoice(spell, originalLevel, afterCast = null) {
    const availableSlots = [];
    const extractNum = (val) => {
      if (val === null || val === void 0)
        return 0;
      if (typeof val === "number")
        return val;
      if (typeof val === "object") {
        return val.value ?? val.total ?? val.currentValue ?? 0;
      }
      return parseInt(val) || 0;
    };
    const rawPactLevel = characterData.spellSlots?.pactMagicSlotLevel || characterData.otherVariables?.pactMagicSlotLevel || characterData.otherVariables?.pactSlotLevelVisible || characterData.otherVariables?.pactSlotLevel;
    const rawPactSlots = characterData.spellSlots?.pactMagicSlots ?? characterData.otherVariables?.pactMagicSlots ?? characterData.otherVariables?.pactSlot;
    const rawPactSlotsMax = characterData.spellSlots?.pactMagicSlotsMax ?? characterData.otherVariables?.pactMagicSlotsMax;
    const pactMagicSlots = extractNum(rawPactSlots);
    const pactMagicSlotsMax = extractNum(rawPactSlotsMax);
    const effectivePactLevel = extractNum(rawPactLevel) || (pactMagicSlotsMax > 0 ? 5 : 0);
    debug2.log("\u{1F52E} Pact Magic detection:", { rawPactLevel, rawPactSlots, rawPactSlotsMax, pactMagicSlots, pactMagicSlotsMax, effectivePactLevel });
    if (pactMagicSlotsMax > 0 && originalLevel <= effectivePactLevel) {
      availableSlots.push({
        level: effectivePactLevel,
        current: pactMagicSlots,
        max: pactMagicSlotsMax,
        slotVar: "pactMagicSlots",
        slotMaxVar: "pactMagicSlotsMax",
        isPactMagic: true,
        label: `Level ${effectivePactLevel} - Pact Magic`
      });
      debug2.log(`\u{1F52E} Added Pact Magic to upcast options: Level ${effectivePactLevel} (${pactMagicSlots}/${pactMagicSlotsMax})`);
    }
    for (let level = originalLevel; level <= 9; level++) {
      const slotVar = `level${level}SpellSlots`;
      const slotMaxVar = `level${level}SpellSlotsMax`;
      let current2 = characterData.spellSlots?.[slotVar] || 0;
      let max = characterData.spellSlots?.[slotMaxVar] || 0;
      if (pactMagicSlotsMax > 0 && level === effectivePactLevel) {
        continue;
      }
      if (max > 0) {
        availableSlots.push({ level, current: current2, max, slotVar, slotMaxVar });
      }
    }
    const metamagicOptions = getAvailableMetamagic();
    const sorceryPoints = getSorceryPointsResource();
    debug2.log("\u{1F52E} Metamagic detection:", {
      metamagicOptions,
      sorceryPoints,
      hasMetamagic: metamagicOptions.length > 0 && sorceryPoints && sorceryPoints.current > 0
    });
    const hasMetamagic = metamagicOptions.length > 0 && sorceryPoints && sorceryPoints.current > 0;
    debug2.log("\u{1F52E} Available slots for casting:", availableSlots);
    if (availableSlots.length === 0) {
      const noSlotsModal = document.createElement("div");
      noSlotsModal.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;";
      const noSlotsContent = document.createElement("div");
      noSlotsContent.style.cssText = "background: white; padding: 30px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); max-width: 400px; width: 90%; text-align: center;";
      noSlotsContent.innerHTML = `
      <h3 style="margin: 0 0 20px 0; color: #e67e22;">No Spell Slots Available</h3>
      <p style="color: #7f8c8d; margin-bottom: 20px;">You don't have any spell slots of level ${originalLevel} or higher to cast ${spell.name}.</p>
      <p style="color: #95a5a6; font-size: 0.9em; margin-bottom: 20px;">You can still cast if your GM allows it - no slot will be decremented.</p>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="no-slots-cancel" style="padding: 12px 25px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1em;">Cancel</button>
        <button id="no-slots-cast" style="padding: 12px 25px; background: #e67e22; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1em;">Cast Anyway</button>
      </div>
    `;
      noSlotsModal.appendChild(noSlotsContent);
      document.body.appendChild(noSlotsModal);
      document.getElementById("no-slots-cancel").onclick = () => noSlotsModal.remove();
      document.getElementById("no-slots-cast").onclick = () => {
        noSlotsModal.remove();
        castWithSlot(spell, {
          level: originalLevel,
          current: 0,
          max: 0,
          slotVar: null,
          noSlotUsed: true
        }, [], afterCast);
      };
      noSlotsModal.onclick = (e) => {
        if (e.target === noSlotsModal)
          noSlotsModal.remove();
      };
      return;
    }
    const modal = document.createElement("div");
    modal.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;";
    const modalContent = document.createElement("div");
    modalContent.style.cssText = "background: white; padding: 30px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); max-width: 400px; width: 90%;";
    let dropdownHTML = `
    <h3 style="margin: 0 0 20px 0; color: #2c3e50; text-align: center;">Cast ${spell.name}</h3>
    <p style="text-align: center; color: #7f8c8d; margin-bottom: 20px;">Level ${originalLevel} spell</p>

    <div style="margin-bottom: 25px;">
      <label style="display: block; margin-bottom: 10px; font-weight: bold; color: #2c3e50;">Spell Slot Level:</label>
      <select id="upcast-slot-select" style="width: 100%; padding: 12px; font-size: 1.1em; border: 2px solid #bdc3c7; border-radius: 6px; box-sizing: border-box; background: white;">
  `;
    availableSlots.forEach((slot, index) => {
      let label;
      const depleted = slot.current <= 0;
      const depletedMarker = depleted ? " [EMPTY]" : "";
      if (slot.isPactMagic) {
        label = `${slot.label} - ${slot.current}/${slot.max} remaining${depletedMarker}`;
      } else if (slot.level === originalLevel) {
        label = `Level ${slot.level} (Normal) - ${slot.current}/${slot.max} remaining${depletedMarker}`;
      } else {
        label = `Level ${slot.level} (Upcast) - ${slot.current}/${slot.max} remaining${depletedMarker}`;
      }
      dropdownHTML += `<option value="${index}" data-level="${slot.level}" data-pact="${slot.isPactMagic || false}" data-current="${slot.current}">${label}</option>`;
    });
    dropdownHTML += `
      </select>
    </div>
  `;
    if (hasMetamagic) {
      dropdownHTML += `
      <div style="margin-bottom: 20px; padding: 12px; background: #f8f9fa; border-radius: 8px; border: 2px solid #9b59b6;">
        <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; margin-bottom: 8px;" onclick="document.getElementById('metamagic-container').style.display = document.getElementById('metamagic-container').style.display === 'none' ? 'flex' : 'none'; this.querySelector('.toggle-arrow').textContent = document.getElementById('metamagic-container').style.display === 'none' ? '\u25B6' : '\u25BC';">
          <label style="font-weight: bold; color: #9b59b6; cursor: pointer;">\u2728 Metamagic (Sorcery Points: ${sorceryPoints.current}/${sorceryPoints.max})</label>
          <span class="toggle-arrow" style="color: #9b59b6; font-size: 0.8em;">\u25BC</span>
        </div>
        <div id="metamagic-container" style="display: flex; flex-direction: column; gap: 6px;">
    `;
      metamagicOptions.forEach((meta, index) => {
        const cost = meta.cost === "variable" ? calculateMetamagicCost(meta.name, originalLevel) : meta.cost;
        const canAfford = sorceryPoints.current >= cost;
        const disabledStyle = !canAfford ? "opacity: 0.5; cursor: not-allowed;" : "";
        dropdownHTML += `
          <label style="display: flex; align-items: center; padding: 8px; background: white; border-radius: 4px; cursor: pointer; ${disabledStyle}" title="${meta.description || ""}">
            <input type="checkbox" class="metamagic-option" data-name="${meta.name}" data-cost="${cost}" ${!canAfford ? "disabled" : ""} style="margin-right: 8px; width: 16px; height: 16px; cursor: pointer; flex-shrink: 0;">
            <span style="flex: 1; color: #2c3e50; font-size: 0.95em;">${meta.name}</span>
            <span style="color: #9b59b6; font-weight: bold; font-size: 0.9em;">${cost} SP</span>
          </label>
      `;
      });
      dropdownHTML += `
        </div>
        <div id="metamagic-cost" style="margin-top: 8px; text-align: right; font-weight: bold; color: #2c3e50; font-size: 0.9em;">Total Cost: 0 SP</div>
      </div>
    `;
    }
    dropdownHTML += `
    <div style="display: flex; gap: 10px;">
      <button id="upcast-cancel" style="flex: 1; padding: 12px; font-size: 1em; background: #95a5a6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
        Cancel
      </button>
      <button id="upcast-confirm" style="flex: 1; padding: 12px; font-size: 1em; background: #9b59b6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
        Cast Spell
      </button>
    </div>
  `;
    modalContent.innerHTML = dropdownHTML;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    const selectElement = document.getElementById("upcast-slot-select");
    const confirmBtn = document.getElementById("upcast-confirm");
    const cancelBtn = document.getElementById("upcast-cancel");
    let selectedMetamagic = [];
    if (hasMetamagic) {
      let updateMetamagicCost = function() {
        let totalCost = 0;
        selectedMetamagic = [];
        metamagicCheckboxes.forEach((checkbox) => {
          if (checkbox.checked) {
            const cost = parseInt(checkbox.dataset.cost);
            totalCost += cost;
            selectedMetamagic.push({
              name: checkbox.dataset.name,
              cost
            });
          }
        });
        costDisplay.textContent = `Total Cost: ${totalCost} SP`;
        if (totalCost > sorceryPoints.current) {
          confirmBtn.disabled = true;
          confirmBtn.style.opacity = "0.5";
          confirmBtn.style.cursor = "not-allowed";
        } else {
          confirmBtn.disabled = false;
          confirmBtn.style.opacity = "1";
          confirmBtn.style.cursor = "pointer";
        }
      };
      const metamagicCheckboxes = document.querySelectorAll(".metamagic-option");
      const costDisplay = document.getElementById("metamagic-cost");
      selectElement.addEventListener("change", () => {
        const selectedIndex = parseInt(selectElement.value);
        const selectedLevel = availableSlots[selectedIndex]?.level || originalLevel;
        metamagicCheckboxes.forEach((checkbox) => {
          const metaName = checkbox.dataset.name;
          const metaOption = metamagicOptions.find((m) => m.name === metaName);
          if (metaOption && metaOption.cost === "variable") {
            const newCost = calculateMetamagicCost(metaName, selectedLevel);
            checkbox.dataset.cost = newCost;
            const label = checkbox.closest("label");
            const costSpan = label.querySelector("span:last-child");
            costSpan.textContent = `${newCost} SP`;
            if (sorceryPoints.current < newCost && checkbox.checked) {
              checkbox.checked = false;
            }
          }
        });
        updateMetamagicCost();
      });
      metamagicCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", updateMetamagicCost);
      });
    }
    confirmBtn.addEventListener("click", () => {
      const selectedIndex = parseInt(selectElement.value);
      const selectedSlot = availableSlots[selectedIndex];
      debug2.log(`\u{1F52E} Selected slot from upcast modal:`, selectedSlot);
      if (selectedSlot.current <= 0) {
        modal.remove();
        const warnModal = document.createElement("div");
        warnModal.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10001;";
        const warnContent = document.createElement("div");
        warnContent.style.cssText = "background: white; padding: 30px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); max-width: 400px; width: 90%; text-align: center;";
        warnContent.innerHTML = `
        <h3 style="margin: 0 0 20px 0; color: #e67e22;">No Slots Remaining</h3>
        <p style="color: #7f8c8d; margin-bottom: 20px;">You have no ${selectedSlot.isPactMagic ? "Pact Magic" : `Level ${selectedSlot.level}`} spell slots remaining.</p>
        <p style="color: #95a5a6; font-size: 0.9em; margin-bottom: 20px;">You can still cast if your GM allows it - no slot will be decremented.</p>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button id="warn-cancel" style="padding: 12px 25px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1em;">Cancel</button>
          <button id="warn-cast" style="padding: 12px 25px; background: #e67e22; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1em;">Cast Anyway</button>
        </div>
      `;
        warnModal.appendChild(warnContent);
        document.body.appendChild(warnModal);
        document.getElementById("warn-cancel").onclick = () => warnModal.remove();
        document.getElementById("warn-cast").onclick = () => {
          warnModal.remove();
          castWithSlot(spell, { ...selectedSlot, noSlotUsed: true }, selectedMetamagic, afterCast);
        };
        warnModal.onclick = (e) => {
          if (e.target === warnModal)
            warnModal.remove();
        };
        return;
      }
      modal.remove();
      castWithSlot(spell, selectedSlot, selectedMetamagic, afterCast);
    });
    cancelBtn.addEventListener("click", () => {
      modal.remove();
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  function castWithSlot(spell, slot, metamagicOptions = [], afterCast = null) {
    if (!slot.noSlotUsed && slot.slotVar) {
      characterData.spellSlots[slot.slotVar] = slot.current - 1;
      if (slot.isPactMagic && characterData.otherVariables?.pactMagicSlots !== void 0) {
        characterData.otherVariables.pactMagicSlots = slot.current - 1;
      }
    }
    let totalMetamagicCost = 0;
    let metamagicNames = [];
    if (metamagicOptions && metamagicOptions.length > 0) {
      const sorceryPoints = getSorceryPointsResource();
      if (sorceryPoints) {
        metamagicOptions.forEach((meta) => {
          totalMetamagicCost += meta.cost;
          metamagicNames.push(meta.name);
        });
        sorceryPoints.current = Math.max(0, sorceryPoints.current - totalMetamagicCost);
        debug2.log(`\u2728 Used ${totalMetamagicCost} sorcery points for metamagic. Remaining: ${sorceryPoints.current}/${sorceryPoints.max}`);
      }
    }
    saveCharacterData();
    let resourceText;
    let notificationText;
    if (slot.noSlotUsed) {
      resourceText = `Level ${slot.level} (NO SLOT USED - slot not decremented)`;
      notificationText = `\u2728 Cast ${spell.name}! (no spell slot decremented)`;
      debug2.log(`\u26A0\uFE0F Cast without slot - no slot decremented`);
    } else if (slot.isPactMagic) {
      resourceText = `Pact Magic (Level ${slot.level})`;
      debug2.log(`\u2705 Used Pact Magic slot. Remaining: ${characterData.spellSlots[slot.slotVar]}/${slot.max}`);
      notificationText = `\u2728 Cast ${spell.name}! (${characterData.spellSlots[slot.slotVar]}/${slot.max} Pact slots left)`;
    } else if (slot.level > parseInt(spell.level)) {
      resourceText = `Level ${slot.level} slot (upcast from ${spell.level})`;
      debug2.log(`\u2705 Used spell slot. Remaining: ${characterData.spellSlots[slot.slotVar]}/${slot.max}`);
      notificationText = `\u2728 Cast ${spell.name}! (${characterData.spellSlots[slot.slotVar]}/${slot.max} slots left)`;
    } else {
      resourceText = `Level ${slot.level} slot`;
      debug2.log(`\u2705 Used spell slot. Remaining: ${characterData.spellSlots[slot.slotVar]}/${slot.max}`);
      notificationText = `\u2728 Cast ${spell.name}! (${characterData.spellSlots[slot.slotVar]}/${slot.max} slots left)`;
    }
    if (metamagicNames.length > 0) {
      resourceText += ` + ${metamagicNames.join(", ")} (${totalMetamagicCost} SP)`;
    }
    if (metamagicNames.length > 0) {
      const sorceryPoints = getSorceryPointsResource();
      notificationText += ` with ${metamagicNames.join(", ")}! (${sorceryPoints.current}/${sorceryPoints.max} SP left)`;
    }
    announceSpellCast(spell, resourceText);
    showNotification(notificationText);
    if (spell.concentration) {
      setConcentration(spell.name);
    }
    const shouldTrackAsReusable = isReuseableSpell(spell.name, characterData);
    if (shouldTrackAsReusable) {
      const castSpellsKey = `castSpells_${characterData.name}`;
      const castSpells = JSON.parse(localStorage.getItem(castSpellsKey) || "[]");
      if (!castSpells.includes(spell.name)) {
        castSpells.push(spell.name);
        localStorage.setItem(castSpellsKey, JSON.stringify(castSpells));
        debug2.log(`\u2705 Tracked reuseable spell: ${spell.name}`);
      }
    }
    buildSheet(characterData);
    if (afterCast && typeof afterCast === "function") {
      setTimeout(() => {
        afterCast(spell, slot);
      }, 300);
    }
  }
  function useClassResource(resource, spell) {
    if (resource.current <= 0) {
      showNotification(`\u274C No ${resource.name} remaining!`, "error");
      return false;
    }
    characterData.otherVariables[resource.varName] = resource.current - 1;
    saveCharacterData();
    debug2.log(`\u2705 Used ${resource.name}. Remaining: ${characterData.otherVariables[resource.varName]}/${resource.max}`);
    showNotification(`\u2728 Cast ${spell.name}! (${characterData.otherVariables[resource.varName]}/${resource.max} ${resource.name} left)`);
    if (spell.concentration) {
      setConcentration(spell.name);
    }
    const shouldTrackAsReusable = isReuseableSpell(spell.name, characterData);
    if (shouldTrackAsReusable) {
      const castSpellsKey = `castSpells_${characterData.name}`;
      const castSpells = JSON.parse(localStorage.getItem(castSpellsKey) || "[]");
      if (!castSpells.includes(spell.name)) {
        castSpells.push(spell.name);
        localStorage.setItem(castSpellsKey, JSON.stringify(castSpells));
        debug2.log(`\u2705 Tracked reuseable spell: ${spell.name}`);
      }
    }
    buildSheet(characterData);
    return true;
  }
  function getColorEmoji(color) {
    return window.ColorUtils.getColorEmoji(color);
  }
  function getColoredBanner() {
    return window.ColorUtils.getColoredBanner(characterData);
  }
  function getColorName(hexColor) {
    return window.ColorUtils.getColorName(hexColor);
  }
  function getSpellcastingAbilityMod() {
    if (!characterData || !characterData.abilityMods) {
      return 0;
    }
    const charClass = (characterData.class || "").toLowerCase();
    if (charClass.includes("cleric") || charClass.includes("druid") || charClass.includes("ranger") || charClass.includes("monk")) {
      return characterData.abilityMods.wisdomMod || 0;
    } else if (charClass.includes("wizard") || charClass.includes("artificer") || charClass.includes("eldritch knight") || charClass.includes("arcane trickster")) {
      return characterData.abilityMods.intelligenceMod || 0;
    } else if (charClass.includes("sorcerer") || charClass.includes("bard") || charClass.includes("warlock") || charClass.includes("paladin")) {
      return characterData.abilityMods.charismaMod || 0;
    }
    const intMod = characterData.abilityMods.intelligenceMod || 0;
    const wisMod = characterData.abilityMods.wisdomMod || 0;
    const chaMod = characterData.abilityMods.charismaMod || 0;
    return Math.max(intMod, wisMod, chaMod);
  }
  function getSpellAttackBonus() {
    const spellMod = getSpellcastingAbilityMod();
    const profBonus = characterData.proficiencyBonus || 0;
    return spellMod + profBonus;
  }
  function calculateTotalAC() {
    const baseAC = characterData.armorClass || 10;
    let totalAC = baseAC;
    const allEffects = [
      ...activeBuffs.map((name) => ({ ...POSITIVE_EFFECTS.find((e) => e.name === name), type: "buff" })),
      ...activeConditions.map((name) => ({ ...NEGATIVE_EFFECTS.find((e) => e.name === name), type: "debuff" }))
    ].filter((e) => e && e.autoApply && e.modifier && e.modifier.ac);
    for (const effect of allEffects) {
      const acMod = effect.modifier.ac;
      if (typeof acMod === "number") {
        totalAC += acMod;
        debug2.log(`\u{1F6E1}\uFE0F Applied AC modifier: ${acMod} from ${effect.name} (${effect.type})`);
      }
    }
    debug2.log(`\u{1F6E1}\uFE0F Total AC calculation: ${baseAC} (base) + modifiers = ${totalAC}`);
    return totalAC;
  }
  function announceSpellDescription(spell, castLevel = null) {
    const colorBanner = getColoredBanner();
    let tags = "";
    if (spell.concentration)
      tags += " \u{1F9E0} Concentration";
    if (spell.ritual)
      tags += " \u{1F4D6} Ritual";
    let message = `&{template:default} {{name=${colorBanner}${characterData.name} casts ${spell.name}!${tags}}}`;
    const spellLevel = parseInt(spell.level) || 0;
    const actualCastLevel = castLevel ? parseInt(castLevel) : spellLevel;
    if (spellLevel > 0) {
      let levelText = actualCastLevel > spellLevel ? `Level ${actualCastLevel} (upcast from ${spellLevel})` : `Level ${spellLevel}`;
      if (spell.school) {
        levelText += ` ${spell.school}`;
      }
      message += ` {{Level=${levelText}}}`;
    } else if (spell.school) {
      message += ` {{Level=${spell.school} cantrip}}`;
    }
    if (spell.castingTime) {
      message += ` {{Casting Time=${spell.castingTime}}}`;
    }
    if (spell.range) {
      message += ` {{Range=${spell.range}}}`;
    }
    if (spell.duration) {
      message += ` {{Duration=${spell.duration}}}`;
    }
    if (spell.components) {
      message += ` {{Components=${spell.components}}}`;
    }
    if (spell.source) {
      message += ` {{Source=${spell.source}}}`;
    }
    if (spell.description) {
      message += ` {{Description=${spell.description}}}`;
    }
    const messageData = {
      action: "announceSpell",
      spellName: spell.name,
      characterName: characterData.name,
      message,
      color: characterData.notificationColor
    };
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage(messageData, "*");
        debug2.log("\u2705 Spell description announced via window.opener");
      } catch (error) {
        debug2.warn("\u26A0\uFE0F Could not send via window.opener:", error.message);
      }
    } else {
      debug2.log("\u{1F4E1} Using background script to relay spell announcement to Roll20...");
      browserAPI.runtime.sendMessage({
        action: "relayRollToRoll20",
        roll: messageData
      }, (response) => {
        if (browserAPI.runtime.lastError) {
          debug2.error("\u274C Error relaying spell announcement:", browserAPI.runtime.lastError);
        } else if (response && response.success) {
          debug2.log("\u2705 Spell description announced to Roll20");
        }
      });
    }
  }
  function announceSpellCast(spell, resourceUsed) {
    if (resourceUsed) {
      const colorBanner = getColoredBanner();
      let message = `&{template:default} {{name=${colorBanner}${spell.name}}}`;
      message += ` {{Resource Used=${resourceUsed}}}`;
      const messageData = {
        action: "announceSpell",
        spellName: spell.name,
        characterName: characterData.name,
        message,
        color: characterData.notificationColor
      };
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage(messageData, "*");
          debug2.log("\u2705 Spell resource usage sent via window.opener");
        } catch (error) {
          debug2.warn("\u26A0\uFE0F Could not send via window.opener:", error.message);
        }
      } else {
        browserAPI.runtime.sendMessage({
          action: "relayRollToRoll20",
          roll: messageData
        }, (response) => {
          if (browserAPI.runtime.lastError) {
            debug2.error("\u274C Error relaying spell announcement:", browserAPI.runtime.lastError);
          }
        });
      }
    }
    if (spell.formula) {
      setTimeout(() => {
        roll(spell.name, spell.formula);
      }, 500);
    }
  }
  function getAvailableMetamagic() {
    const options = executorGetAvailableMetamagic(characterData);
    debug2.log("\u{1F52E} Found metamagic options:", options.map((m) => m.name));
    return options;
  }
  function getSorceryPointsResource() {
    return executorGetSorceryPointsResource(characterData);
  }
  function getKiPointsResource() {
    if (!characterData || !characterData.resources)
      return null;
    const kiResource = characterData.resources.find((r) => {
      const lowerName = r.name.toLowerCase();
      return lowerName.includes("ki point") || lowerName === "ki points" || lowerName === "ki";
    });
    return kiResource || null;
  }
  function getLayOnHandsResource() {
    if (!characterData || !characterData.resources)
      return null;
    const layOnHandsResource = characterData.resources.find((r) => {
      const lowerName = r.name.toLowerCase();
      return lowerName.includes("lay on hands") || lowerName === "lay on hands pool";
    });
    return layOnHandsResource || null;
  }
  function createThemedModal() {
    const modal = document.createElement("div");
    modal.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;";
    const modalContent = document.createElement("div");
    modalContent.className = "rollcloud-modal-content";
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDarkTheme = document.body.classList.contains("dark-theme") || document.body.classList.contains("theme-dark") || prefersDark;
    if (isDarkTheme) {
      modalContent.classList.add("theme-dark");
    } else {
      modalContent.classList.add("theme-light");
    }
    modalContent.style.cssText = "padding: 30px; border-radius: 12px; max-width: 500px; width: 90%; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 1px solid #e1e8ed;";
    return { modal, modalContent, isDarkTheme };
  }
  function showDivineSmiteModal(spell) {
    const availableSlots = [];
    const extractNum = (val) => {
      if (val === null || val === void 0)
        return 0;
      if (typeof val === "number")
        return val;
      if (typeof val === "object") {
        return val.value ?? val.total ?? val.currentValue ?? 0;
      }
      return parseInt(val) || 0;
    };
    const rawPactLevel = characterData.spellSlots?.pactMagicSlotLevel || characterData.otherVariables?.pactMagicSlotLevel || characterData.otherVariables?.pactSlotLevelVisible || characterData.otherVariables?.pactSlotLevel;
    const rawPactSlots = characterData.spellSlots?.pactMagicSlots ?? characterData.otherVariables?.pactMagicSlots ?? characterData.otherVariables?.pactSlot;
    const rawPactSlotsMax = characterData.spellSlots?.pactMagicSlotsMax ?? characterData.otherVariables?.pactMagicSlotsMax;
    const pactMagicSlots = extractNum(rawPactSlots);
    const pactMagicSlotsMax = extractNum(rawPactSlotsMax);
    const effectivePactLevel = extractNum(rawPactLevel) || (pactMagicSlotsMax > 0 ? 5 : 0);
    debug2.log("\u{1F52E} Pact Magic detection for Divine Smite:", { rawPactLevel, rawPactSlots, rawPactSlotsMax, pactMagicSlots, pactMagicSlotsMax, effectivePactLevel });
    if (pactMagicSlotsMax > 0) {
      availableSlots.push({
        level: effectivePactLevel,
        current: pactMagicSlots,
        max: pactMagicSlotsMax,
        slotVar: "pactMagicSlots",
        slotMaxVar: "pactMagicSlotsMax",
        isPactMagic: true,
        label: `Level ${effectivePactLevel} - Pact Magic (${pactMagicSlots}/${pactMagicSlotsMax})`
      });
      debug2.log(`\u{1F52E} Added Pact Magic to Divine Smite options: Level ${effectivePactLevel} (${pactMagicSlots}/${pactMagicSlotsMax})`);
    }
    for (let level = 1; level <= 5; level++) {
      const slotVar = `level${level}SpellSlots`;
      const slotMaxVar = `level${level}SpellSlotsMax`;
      let current2 = characterData.spellSlots?.[slotVar] || 0;
      let max = characterData.spellSlots?.[slotMaxVar] || 0;
      if (pactMagicSlotsMax > 0 && level === effectivePactLevel) {
        continue;
      }
      if (max > 0) {
        availableSlots.push({
          level,
          current: current2,
          max,
          slotVar,
          slotMaxVar,
          isPactMagic: false,
          label: `Level ${level} (${current2}/${max})`
        });
        debug2.log(`\u{1F52E} Added Level ${level} to Divine Smite options: ${current2}/${max}`);
      }
    }
    debug2.log("\u{1F52E} Available slots for Divine Smite:", availableSlots);
    availableSlots.sort((a, b) => a.level - b.level);
    const { modal, modalContent, isDarkTheme } = createThemedModal();
    const slotOptions = availableSlots.map(
      (slot, index) => `<option value="${index}" ${slot.current <= 0 ? "disabled" : ""}>
      ${slot.label} ${slot.current <= 0 ? "(No slots remaining)" : ""}
    </option>`
    ).join("");
    modalContent.innerHTML = `
    <h2 style="margin: 0 0 20px 0; font-size: 1.5em;">\u26A1 Divine Smite</h2>
    <p style="margin: 0 0 20px 0; font-size: 0.95em;">
      Expend a spell slot to deal extra radiant damage on a melee weapon hit
    </p>
    
    <div style="margin: 20px 0;">
      <label style="display: block; margin-bottom: 8px; font-size: 0.95em;">Choose Spell Slot:</label>
      <select id="spellSlotSelect" style="width: 100%; padding: 8px; font-size: 1em; border: 2px solid var(--accent-info); border-radius: 6px;">
        ${slotOptions}
      </select>
    </div>
    
    <div style="margin: 20px 0; text-align: left;">
      <h3 style="margin: 0 0 15px 0; font-size: 1.1em;">Damage Options:</h3>
      
      <label style="display: flex; align-items: center; margin: 10px 0; cursor: pointer;">
        <input type="checkbox" id="critCheckbox" style="margin-right: 10px; width: 18px; height: 18px;">
        <span>Critical Hit (double damage dice)</span>
      </label>
      
      <label style="display: flex; align-items: center; margin: 10px 0; cursor: pointer;">
        <input type="checkbox" id="fiendCheckbox" style="margin-right: 10px; width: 18px; height: 18px;">
        <span>Against Fiend or Undead (+1d8)</span>
      </label>
    </div>
    
    <div id="damagePreview" style="margin: 15px 0; padding: 10px; border-radius: 6px; font-weight: bold; display: none;">
      <!-- Hidden - damage shown only on button -->
    </div>
    
    <div style="margin-top: 25px; display: flex; gap: 10px; justify-content: center;">
      <button id="confirmDivineSmite" style="padding: 12px 24px; font-size: 1em; font-weight: bold; background: var(--accent-warning); color: white; border: none; border-radius: 6px; cursor: pointer;" disabled>
        Select Slot
      </button>
      <button id="cancelDivineSmite" style="padding: 12px 24px; font-size: 1em; font-weight: bold; background: var(--accent-danger); color: white; border: none; border-radius: 6px; cursor: pointer;">
        Cancel
      </button>
    </div>
  `;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    const critCheckbox = document.getElementById("critCheckbox");
    const fiendCheckbox = document.getElementById("fiendCheckbox");
    const slotSelect = document.getElementById("spellSlotSelect");
    const damagePreview = document.getElementById("damagePreview");
    const confirmBtn = document.getElementById("confirmDivineSmite");
    const cancelBtn = document.getElementById("cancelDivineSmite");
    function updateDamagePreview() {
      const selectedIndex = parseInt(slotSelect.value);
      if (isNaN(selectedIndex) || !availableSlots[selectedIndex]) {
        damagePreview.textContent = "Select a spell slot";
        confirmBtn.disabled = true;
        confirmBtn.textContent = "Select Slot";
        return;
      }
      const slot = availableSlots[selectedIndex];
      if (slot.current <= 0) {
        damagePreview.textContent = "No slots remaining";
        confirmBtn.disabled = true;
        confirmBtn.textContent = "No Slots";
        return;
      }
      const level = slot.level;
      const baseDice = 1 + level;
      let damageFormula = `${baseDice}d8`;
      if (fiendCheckbox.checked) {
        damageFormula += ` + 1d8`;
      }
      if (critCheckbox.checked) {
        damageFormula = `(${damageFormula}) * 2`;
      }
      damagePreview.textContent = `Damage: ${damageFormula} radiant`;
      updateConfirmButton(damageFormula, slot);
    }
    function updateConfirmButton(damageFormula, slot) {
      let buttonText = "\u26A1 ";
      let modifiers = [];
      if (damageFormula.includes("* 2")) {
        const baseMatch = damageFormula.match(/\(([^)]+)\) \* 2/);
        if (baseMatch) {
          const baseFormula = baseMatch[1];
          const baseParts = baseFormula.split(" + ").map((part2) => part2.trim());
          const mainDice = baseParts.find((part2) => part2.includes("d8") && !part2.includes("1d8"));
          if (mainDice) {
            buttonText += parseDamageFormula(mainDice);
          } else {
            buttonText += parseDamageFormula(baseFormula);
          }
          modifiers.push("(CRIT)");
        }
      } else {
        const baseParts = damageFormula.split(" + ").map((part2) => part2.trim());
        const mainDice = baseParts.find((part2) => part2.includes("d8") && !part2.includes("1d8"));
        if (mainDice) {
          buttonText += parseDamageFormula(mainDice);
        } else {
          buttonText += parseDamageFormula(damageFormula);
        }
      }
      if (damageFormula.includes("+ 1d8")) {
        modifiers.unshift("+1d8");
      }
      if (modifiers.length > 0) {
        buttonText += " " + modifiers.join(" ");
      }
      buttonText += ` Damage (Lvl ${slot.level})`;
      confirmBtn.innerHTML = buttonText;
      confirmBtn.disabled = false;
    }
    function parseDamageFormula(formula2) {
      const parts2 = formula2.split(" + ").map((part2) => part2.trim());
      let result2 = "";
      parts2.forEach((part2, index) => {
        if (part2.includes("d8")) {
          const diceMatch = part2.match(/(\d+)d8/);
          if (diceMatch) {
            const numDice = parseInt(diceMatch[1]);
            if (numDice === 1) {
              result2 += "1d8";
            } else {
              result2 += `${numDice}d8`;
            }
          }
        }
        if (index < parts2.length - 1) {
          result2 += " + ";
        }
      });
      return result2;
    }
    critCheckbox.addEventListener("change", updateDamagePreview);
    fiendCheckbox.addEventListener("change", updateDamagePreview);
    slotSelect.addEventListener("change", updateDamagePreview);
    confirmBtn.addEventListener("click", () => {
      const selectedIndex = parseInt(slotSelect.value);
      const slot = availableSlots[selectedIndex];
      if (slot.current <= 0) {
        showNotification(`\u274C No Level ${slot.level} spell slot available!`, "error");
        return;
      }
      const level = slot.level;
      const baseDice = 1 + level;
      let damageFormula = `${baseDice}d8`;
      if (fiendCheckbox.checked) {
        damageFormula += ` + 1d8`;
      }
      if (critCheckbox.checked) {
        damageFormula = `(${damageFormula}) * 2`;
      }
      if (slot.isPactMagic) {
        characterData.spellSlots[slot.slotVar] = Math.max(0, characterData.spellSlots[slot.slotVar] - 1);
      } else {
        characterData.spellSlots[slot.slotVar] = Math.max(0, characterData.spellSlots[slot.slotVar] - 1);
      }
      saveCharacterData();
      let description = `Divine Smite (Level ${level}`;
      if (critCheckbox.checked)
        description += ", Critical";
      if (fiendCheckbox.checked)
        description += ", vs Fiend/Undead";
      description += ")";
      announceAction({
        name: "Divine Smite",
        description
      });
      roll("Divine Smite", damageFormula);
      const remaining = slot.isPactMagic ? characterData.spellSlots[slot.slotVar] : characterData.spellSlots[slot.slotVar];
      showNotification(`\u26A1 Divine Smite! Used Level ${slot.level} slot (${remaining}/${slot.max} left)`);
      document.body.removeChild(modal);
      buildSheet(characterData);
    });
    cancelBtn.addEventListener("click", () => {
      document.body.removeChild(modal);
    });
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        document.body.removeChild(modal);
        document.removeEventListener("keydown", handleEscape);
      }
    };
    document.addEventListener("keydown", handleEscape);
    updateDamagePreview();
  }
  function handleLayOnHands(action) {
    const layOnHandsPool = getLayOnHandsResource();
    if (!layOnHandsPool) {
      showNotification(`\u274C No Lay on Hands pool resource found`, "error");
      return;
    }
    if (layOnHandsPool.current <= 0) {
      showNotification(`\u274C No Lay on Hands points remaining!`, "error");
      return;
    }
    showLayOnHandsModal(layOnHandsPool);
  }
  function showLayOnHandsModal(layOnHandsPool) {
    const { modal, modalContent, isDarkTheme } = createThemedModal();
    modalContent.innerHTML = `
    <h2 style="margin: 0 0 20px 0; font-size: 1.5em;">\u{1F49A} Lay on Hands</h2>
    <p style="margin: 0 0 15px 0; font-size: 1.1em;">
      Available Points: <strong>${layOnHandsPool.current}/${layOnHandsPool.max}</strong>
    </p>
    <p style="margin: 0 0 20px 0; font-size: 0.95em;">
      How many points do you want to spend?
    </p>
    <div style="margin: 20px 0;">
      <input type="number" id="layOnHandsAmount" min="1" max="${layOnHandsPool.current}" value="1" 
             style="width: 80px; padding: 8px; font-size: 1.1em; text-align: center; border: 2px solid var(--accent-info); border-radius: 6px;">
      <span style="margin-left: 10px; font-weight: bold;" id="healingDisplay">1 HP healed</span>
    </div>
    <div style="margin-top: 25px; display: flex; gap: 10px; justify-content: center;">
      <button id="confirmLayOnHands" style="padding: 12px 24px; font-size: 1em; font-weight: bold; background: var(--accent-success); color: white; border: none; border-radius: 6px; cursor: pointer;">
        Heal
      </button>
      <button id="cancelLayOnHands" style="padding: 12px 24px; font-size: 1em; font-weight: bold; background: var(--accent-danger); color: white; border: none; border-radius: 6px; cursor: pointer;">
        Cancel
      </button>
    </div>
  `;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    const amountInput = document.getElementById("layOnHandsAmount");
    const healingDisplay = document.getElementById("healingDisplay");
    const confirmBtn = document.getElementById("confirmLayOnHands");
    const cancelBtn = document.getElementById("cancelLayOnHands");
    function updateHealingDisplay() {
      const amount = parseInt(amountInput.value) || 0;
      healingDisplay.textContent = `${amount} HP healed`;
      healingDisplay.style.color = "#3498db";
    }
    amountInput.addEventListener("input", updateHealingDisplay);
    confirmBtn.addEventListener("click", () => {
      const amount = parseInt(amountInput.value);
      if (isNaN(amount) || amount < 1 || amount > layOnHandsPool.current) {
        showNotification(`\u274C Please enter a number between 1 and ${layOnHandsPool.current}`, "error");
        return;
      }
      layOnHandsPool.current -= amount;
      saveCharacterData();
      debug2.log(`\u{1F49A} Used ${amount} Lay on Hands points. Remaining: ${layOnHandsPool.current}/${layOnHandsPool.max}`);
      if (amount === 5) {
        announceAction({
          name: "Lay on Hands",
          description: `Cured disease/poison`
        });
        showNotification(`\u{1F49A} Lay on Hands: Cured disease/poison (${layOnHandsPool.current}/${layOnHandsPool.max} points left)`);
      } else {
        announceAction({
          name: "Lay on Hands",
          description: `Restored ${amount} HP`
        });
        showNotification(`\u{1F49A} Lay on Hands: Restored ${amount} HP (${layOnHandsPool.current}/${layOnHandsPool.max} points left)`);
      }
      document.body.removeChild(modal);
      buildSheet(characterData);
    });
    cancelBtn.addEventListener("click", () => {
      document.body.removeChild(modal);
    });
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        document.body.removeChild(modal);
        document.removeEventListener("keydown", handleEscape);
      }
    };
    document.addEventListener("keydown", handleEscape);
    amountInput.focus();
    amountInput.select();
  }
  function handleRecoverSpellSlot(action) {
    const profBonus = characterData.proficiencyBonus || 2;
    const maxLevel = Math.ceil(profBonus / 2);
    debug2.log(`\u{1F52E} Recover Spell Slot: proficiencyBonus=${profBonus}, maxLevel=${maxLevel}`);
    const eligibleSlots = [];
    for (let level = 1; level <= maxLevel && level <= 9; level++) {
      const slotKey = `level${level}SpellSlots`;
      const maxKey = `level${level}SpellSlotsMax`;
      if (characterData[slotKey] !== void 0 && characterData[maxKey] !== void 0) {
        const current2 = characterData[slotKey];
        const max = characterData[maxKey];
        if (current2 < max) {
          eligibleSlots.push({ level, current: current2, max, slotKey, maxKey });
        }
      }
    }
    if (eligibleSlots.length === 0) {
      showNotification(`\u274C No spell slots to recover (max level: ${maxLevel})`, "error");
      return;
    }
    if (eligibleSlots.length === 1) {
      const slot = eligibleSlots[0];
      recoverSpellSlot(slot, action, maxLevel);
      return;
    }
    let message = `Recover Spell Slot (max level: ${maxLevel})

Choose which spell slot to recover:

`;
    eligibleSlots.forEach((slot, index) => {
      message += `${index + 1}. Level ${slot.level}: ${slot.current}/${slot.max}
`;
    });
    const choice = prompt(message);
    if (choice === null)
      return;
    const choiceIndex = parseInt(choice) - 1;
    if (isNaN(choiceIndex) || choiceIndex < 0 || choiceIndex >= eligibleSlots.length) {
      showNotification("\u274C Invalid choice", "error");
      return;
    }
    const selectedSlot = eligibleSlots[choiceIndex];
    recoverSpellSlot(selectedSlot, action, maxLevel);
  }
  function recoverSpellSlot(slot, action, maxLevel) {
    characterData[slot.slotKey] = Math.min(characterData[slot.slotKey] + 1, characterData[slot.maxKey]);
    saveCharacterData();
    const description = `You expend a use of your Channel Divinity to fuel your spells. As a bonus action, you touch your holy symbol, utter a prayer, and regain one expended spell slot, the level of which can be no higher than ${maxLevel}.`;
    announceAction({
      name: action.name,
      description,
      actionType: action.actionType || "bonus"
    });
    showNotification(`\u{1F52E} Recovered Level ${slot.level} Spell Slot (${characterData[slot.slotKey]}/${characterData[slot.maxKey]})`, "success");
    buildSheet(characterData);
  }
  function findResourceByVariableName(variableName) {
    let resource = characterData.resources?.find((r) => r.variableName === variableName);
    if (resource) {
      return resource;
    }
    if (variableName === "channelDivinity" || variableName === "channelDivinityCleric" || variableName === "channelDivinityPaladin") {
      resource = characterData.resources?.find(
        (r) => r.name === "Channel Divinity" || r.variableName === "channelDivinityCleric" || r.variableName === "channelDivinityPaladin" || r.variableName === "channelDivinity"
      );
    }
    return resource;
  }
  function getResourceCostsFromAction(action) {
    if (!action || !action.resources || !action.resources.attributesConsumed) {
      return [];
    }
    const costs = action.resources.attributesConsumed.map((consumed) => {
      const quantity = consumed.quantity?.value || 0;
      return {
        name: consumed.statName || "",
        variableName: consumed.variableName || "",
        quantity
      };
    });
    if (costs.length > 0) {
      debug2.log(`\u{1F4B0} Resource costs for ${action.name}:`, costs);
      costs.forEach((cost) => {
        debug2.log(`   \u{1F4CB} Cost: ${cost.name || "unnamed"}, variableName: "${cost.variableName}", quantity: ${cost.quantity}`);
      });
    }
    return costs;
  }
  function getKiCostFromAction(action) {
    const costs = getResourceCostsFromAction(action);
    const kiCost = costs.find(
      (c) => c.variableName === "kiPoints" || c.name.toLowerCase().includes("ki point")
    );
    if (kiCost) {
      debug2.log(`\u{1F4A8} Ki cost for ${action.name}: ${kiCost.quantity} ki points`);
      return kiCost.quantity;
    }
    return 0;
  }
  function getSorceryPointCostFromAction(action) {
    const costs = getResourceCostsFromAction(action);
    const sorceryCost = costs.find(
      (c) => c.variableName === "sorceryPoints" || c.name.toLowerCase().includes("sorcery point")
    );
    if (sorceryCost) {
      debug2.log(`\u2728 Sorcery Point cost for ${action.name}: ${sorceryCost.quantity} SP`);
      return sorceryCost.quantity;
    }
    return 0;
  }
  function decrementActionResources(action) {
    const costs = getResourceCostsFromAction(action);
    if (!costs || costs.length === 0) {
      return true;
    }
    for (const cost of costs) {
      if (cost.variableName === "kiPoints" || cost.variableName === "sorceryPoints") {
        continue;
      }
      if (!cost.variableName) {
        debug2.log(`\u26A0\uFE0F Resource cost missing variableName for ${action.name}:`, cost);
        continue;
      }
      const resource = findResourceByVariableName(cost.variableName);
      if (!resource) {
        debug2.log(`\u26A0\uFE0F Resource not found: ${cost.variableName} for ${action.name}`);
        continue;
      }
      if (resource.current < cost.quantity) {
        showNotification(`\u274C Not enough ${cost.name || cost.variableName}! Need ${cost.quantity}, have ${resource.current}`, "error");
        return false;
      }
    }
    for (const cost of costs) {
      if (cost.variableName === "kiPoints" || cost.variableName === "sorceryPoints") {
        continue;
      }
      if (!cost.variableName) {
        continue;
      }
      const resource = findResourceByVariableName(cost.variableName);
      if (resource) {
        resource.current -= cost.quantity;
        if (characterData.otherVariables && resource.varName) {
          characterData.otherVariables[resource.varName] = resource.current;
        }
        debug2.log(`\u2705 Used ${cost.quantity} ${cost.name || cost.variableName} for ${action.name}. Remaining: ${resource.current}/${resource.max}`);
        showNotification(`\u2705 Used ${action.name}! (${resource.current}/${resource.max} ${cost.name || cost.variableName} left)`);
      }
    }
    saveCharacterData();
    buildSheet(characterData);
    return true;
  }
  function calculateMetamagicCost(metamagicName, spellLevel) {
    return executorCalculateMetamagicCost(metamagicName, spellLevel);
  }
  function showConvertSlotToPointsModal() {
    const sorceryPoints = getSorceryPointsResource();
    if (!sorceryPoints) {
      showNotification("\u274C No Sorcery Points resource found", "error");
      return;
    }
    const availableSlots = [];
    for (let level = 1; level <= 9; level++) {
      const slotVar = `level${level}SpellSlots`;
      const maxSlotVar = `level${level}SpellSlotsMax`;
      const current2 = characterData.spellSlots?.[slotVar] || 0;
      const max = characterData.spellSlots?.[maxSlotVar] || 0;
      if (current2 > 0) {
        availableSlots.push({ level, current: current2, max, slotVar, maxSlotVar });
      }
    }
    if (availableSlots.length === 0) {
      showNotification("\u274C No spell slots available to convert!", "error");
      return;
    }
    const modal = document.createElement("div");
    modal.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;";
    const modalContent = document.createElement("div");
    modalContent.style.cssText = "background: white; padding: 30px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); max-width: 400px; width: 90%;";
    let optionsHTML = `
    <h3 style="margin: 0 0 15px 0; color: #2c3e50; text-align: center;">Convert Spell Slot to Sorcery Points</h3>
    <p style="text-align: center; color: #e74c3c; margin-bottom: 20px; font-weight: bold;">Current: ${sorceryPoints.current}/${sorceryPoints.max} SP</p>

    <div style="margin-bottom: 25px;">
      <label style="display: block; margin-bottom: 10px; font-weight: bold; color: #2c3e50;">Expend Spell Slot:</label>
      <select id="slot-to-points-level" style="width: 100%; padding: 12px; font-size: 1.1em; border: 2px solid #bdc3c7; border-radius: 6px; box-sizing: border-box; background: white;">
  `;
    availableSlots.forEach((slot) => {
      optionsHTML += `<option value="${slot.level}">Level ${slot.level} - Gain ${slot.level} SP (${slot.current}/${slot.max} slots)</option>`;
    });
    optionsHTML += `
      </select>
    </div>

    <div style="display: flex; gap: 10px;">
      <button id="slot-cancel" style="flex: 1; padding: 12px; font-size: 1em; background: #95a5a6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
        Cancel
      </button>
      <button id="slot-confirm" style="flex: 1; padding: 12px; font-size: 1em; background: #9b59b6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
        Convert
      </button>
    </div>
  `;
    modalContent.innerHTML = optionsHTML;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    const selectElement = document.getElementById("slot-to-points-level");
    const confirmBtn = document.getElementById("slot-confirm");
    const cancelBtn = document.getElementById("slot-cancel");
    cancelBtn.addEventListener("click", () => {
      document.body.removeChild(modal);
    });
    confirmBtn.addEventListener("click", () => {
      const selectedLevel = parseInt(selectElement.value);
      const slotVar = `level${selectedLevel}SpellSlots`;
      const currentSlots = characterData.spellSlots?.[slotVar] || 0;
      if (currentSlots <= 0) {
        showNotification(`\u274C No Level ${selectedLevel} spell slots available!`, "error");
        return;
      }
      characterData.spellSlots[slotVar] -= 1;
      const pointsGained = selectedLevel;
      sorceryPoints.current = Math.min(sorceryPoints.current + pointsGained, sorceryPoints.max);
      saveCharacterData();
      const maxSlotVar = `level${selectedLevel}SpellSlotsMax`;
      const newSlotCount = characterData.spellSlots[slotVar];
      const maxSlots = characterData.spellSlots[maxSlotVar];
      showNotification(`\u2728 Gained ${pointsGained} Sorcery Points! (${sorceryPoints.current}/${sorceryPoints.max} SP, ${newSlotCount}/${maxSlots} slots)`);
      const colorBanner = getColoredBanner();
      const message = `&{template:default} {{name=${colorBanner}${characterData.name} uses Font of Magic\u26A1}} {{Action=Convert Spell Slot to Sorcery Points}} {{Result=Expended Level ${selectedLevel} spell slot for ${pointsGained} SP}} {{Sorcery Points=${sorceryPoints.current}/${sorceryPoints.max}}}`;
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({
          action: "roll",
          characterName: characterData.name,
          message,
          color: characterData.notificationColor
        }, "*");
      }
      document.body.removeChild(modal);
      buildSheet(characterData);
    });
  }
  function showFontOfMagicModal() {
    const sorceryPoints = getSorceryPointsResource();
    if (!sorceryPoints) {
      showNotification("\u274C No Sorcery Points resource found", "error");
      return;
    }
    const slotCosts = {
      1: 2,
      2: 3,
      3: 5,
      4: 6,
      5: 7
    };
    const modal = document.createElement("div");
    modal.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;";
    const modalContent = document.createElement("div");
    modalContent.style.cssText = "background: white; padding: 30px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); max-width: 400px; width: 90%;";
    let optionsHTML = `
    <h3 style="margin: 0 0 15px 0; color: #2c3e50; text-align: center;">Convert Sorcery Points to Spell Slot</h3>
    <p style="text-align: center; color: #e74c3c; margin-bottom: 20px; font-weight: bold;">Current: ${sorceryPoints.current}/${sorceryPoints.max} SP</p>

    <div style="margin-bottom: 25px;">
      <label style="display: block; margin-bottom: 10px; font-weight: bold; color: #2c3e50;">Create Spell Slot Level:</label>
      <select id="font-of-magic-slot" style="width: 100%; padding: 12px; font-size: 1.1em; border: 2px solid #bdc3c7; border-radius: 6px; box-sizing: border-box; background: white;">
  `;
    for (let level = 1; level <= 5; level++) {
      const cost = slotCosts[level];
      const canAfford = sorceryPoints.current >= cost;
      const slotVar = `level${level}SpellSlots`;
      const maxSlotVar = `level${level}SpellSlotsMax`;
      const currentSlots = characterData.spellSlots?.[slotVar] || 0;
      const maxSlots = characterData.spellSlots?.[maxSlotVar] || 0;
      const disabledAttr = canAfford ? "" : "disabled";
      const affordText = canAfford ? "" : " (not enough SP)";
      optionsHTML += `<option value="${level}" ${disabledAttr}>Level ${level} - ${cost} SP${affordText} (${currentSlots}/${maxSlots} slots)</option>`;
    }
    optionsHTML += `
      </select>
    </div>

    <div style="display: flex; gap: 10px;">
      <button id="font-cancel" style="flex: 1; padding: 12px; font-size: 1em; background: #95a5a6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
        Cancel
      </button>
      <button id="font-confirm" style="flex: 1; padding: 12px; font-size: 1em; background: #e74c3c; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
        Convert
      </button>
    </div>
  `;
    modalContent.innerHTML = optionsHTML;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    const selectElement = document.getElementById("font-of-magic-slot");
    const confirmBtn = document.getElementById("font-confirm");
    const cancelBtn = document.getElementById("font-cancel");
    cancelBtn.addEventListener("click", () => {
      document.body.removeChild(modal);
    });
    confirmBtn.addEventListener("click", () => {
      const selectedLevel = parseInt(selectElement.value);
      const cost = slotCosts[selectedLevel];
      if (sorceryPoints.current < cost) {
        showNotification(`\u274C Not enough Sorcery Points! Need ${cost}, have ${sorceryPoints.current}`, "error");
        return;
      }
      sorceryPoints.current -= cost;
      const slotVar = `level${selectedLevel}SpellSlots`;
      const maxSlotVar = `level${selectedLevel}SpellSlotsMax`;
      const maxSlots = characterData.spellSlots?.[maxSlotVar] || 0;
      characterData.spellSlots[slotVar] = Math.min((characterData.spellSlots[slotVar] || 0) + 1, maxSlots);
      saveCharacterData();
      const currentSlots = characterData.spellSlots[slotVar];
      showNotification(`\u2728 Created Level ${selectedLevel} spell slot! (${sorceryPoints.current}/${sorceryPoints.max} SP left, ${currentSlots}/${maxSlots} slots)`);
      const colorBanner = getColoredBanner();
      const message = `&{template:default} {{name=${colorBanner}${characterData.name} uses Font of Magic\u26A1}} {{Action=Convert Sorcery Points to Spell Slot}} {{Result=Created Level ${selectedLevel} spell slot for ${cost} SP}} {{Sorcery Points=${sorceryPoints.current}/${sorceryPoints.max}}}`;
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({
          action: "roll",
          characterName: characterData.name,
          message,
          color: characterData.notificationColor
        }, "*");
      }
      document.body.removeChild(modal);
      buildSheet(characterData);
    });
  }
  function announceAction(action) {
    const colorBanner = getColoredBanner();
    const actionTypeEmoji = {
      "bonus": "\u26A1",
      "reaction": "\u{1F6E1}\uFE0F",
      "action": "\u2694\uFE0F",
      "free": "\u{1F4A8}",
      "legendary": "\u{1F451}",
      "lair": "\u{1F3F0}",
      "other": "\u2728"
    };
    const emoji = actionTypeEmoji[action.actionType?.toLowerCase()] || "\u2728";
    const actionTypeText = action.actionType ? ` (${action.actionType})` : "";
    let message = `&{template:default} {{name=${colorBanner}${characterData.name} uses ${action.name}${emoji}}} {{Action Type=${action.actionType || "Other"}}}`;
    if (action.description) {
      const resolvedDescription = resolveVariablesInFormula(action.description);
      message += ` {{Description=${resolvedDescription}}}`;
    }
    if (action.uses) {
      const usesUsed = action.usesUsed || 0;
      const usesTotal = action.uses.total || action.uses.value || action.uses;
      const usesRemaining = action.usesLeft !== void 0 ? action.usesLeft : usesTotal - usesUsed;
      const usesText = `${usesRemaining} / ${usesTotal}`;
      message += ` {{Uses=${usesText}}}`;
    }
    const messageData = {
      action: "announceSpell",
      message,
      color: characterData.notificationColor
    };
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage(messageData, "*");
        showNotification(`\u2728 ${action.name} used!`);
        debug2.log("\u2705 Action announcement sent via window.opener");
        return;
      } catch (error) {
        debug2.warn("\u26A0\uFE0F Could not send via window.opener:", error.message);
      }
    }
    debug2.log("\u{1F4E1} Using background script to relay action announcement to Roll20...");
    browserAPI.runtime.sendMessage({
      action: "relayRollToRoll20",
      roll: messageData
    }, (response) => {
      if (browserAPI.runtime.lastError) {
        debug2.error("\u274C Error relaying action announcement:", browserAPI.runtime.lastError);
        showNotification("\u274C Failed to announce action");
      } else if (response && response.success) {
        debug2.log("\u2705 Action announcement relayed to Roll20");
        showNotification(`\u2728 ${action.name} used!`);
      }
    });
  }
  function createColorPalette(selectedColor) {
    const colors = [
      { name: "Blue", value: "#3498db", emoji: "\u{1F535}" },
      { name: "Red", value: "#e74c3c", emoji: "\u{1F534}" },
      { name: "Green", value: "#27ae60", emoji: "\u{1F7E2}" },
      { name: "Purple", value: "#9b59b6", emoji: "\u{1F7E3}" },
      { name: "Orange", value: "#e67e22", emoji: "\u{1F7E0}" },
      { name: "Teal", value: "#1abc9c", emoji: "\u{1F4A0}" },
      { name: "Pink", value: "#e91e63", emoji: "\u{1F496}" },
      { name: "Yellow", value: "#f1c40f", emoji: "\u{1F7E1}" },
      { name: "Grey", value: "#95a5a6", emoji: "\u26AA" },
      { name: "Black", value: "#34495e", emoji: "\u26AB" },
      { name: "Brown", value: "#8b4513", emoji: "\u{1F7E4}" }
    ];
    return colors.map((color) => {
      const isSelected = color.value === selectedColor;
      return `
      <div class="color-swatch"
           data-color="${color.value}"
           style="font-size: 1.5em; cursor: pointer; transition: all 0.2s; opacity: ${isSelected ? "1" : "0.85"}; transform: ${isSelected ? "scale(1.15)" : "scale(1)"}; filter: ${isSelected ? "drop-shadow(0 0 4px white)" : "none"}; text-align: center;"
           title="${color.name}">${color.emoji}</div>
    `;
    }).join("");
  }
  var colorPaletteDocumentListenerAdded = false;
  function initColorPalette() {
    if (!characterData.notificationColor) {
      characterData.notificationColor = "#3498db";
    }
    const toggleBtnOld = document.getElementById("color-toggle");
    const palette = document.getElementById("color-palette");
    if (!toggleBtnOld || !palette)
      return;
    const toggleBtn = toggleBtnOld.cloneNode(true);
    toggleBtnOld.parentNode.replaceChild(toggleBtn, toggleBtnOld);
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isVisible = palette.style.display === "grid";
      palette.style.display = isVisible ? "none" : "grid";
    });
    if (!colorPaletteDocumentListenerAdded) {
      document.addEventListener("click", (e) => {
        const currentToggleBtn = document.getElementById("color-toggle");
        const currentPalette = document.getElementById("color-palette");
        if (currentPalette && currentToggleBtn) {
          if (!currentPalette.contains(e.target) && e.target !== currentToggleBtn && !currentToggleBtn.contains(e.target)) {
            currentPalette.style.display = "none";
          }
        }
      });
      colorPaletteDocumentListenerAdded = true;
      debug2.log("\u{1F3A8} Added document-level color palette click listener");
    }
    document.querySelectorAll(".color-swatch").forEach((swatch) => {
      swatch.addEventListener("click", (e) => {
        const newColor = e.target.dataset.color;
        const oldColor = characterData.notificationColor;
        characterData.notificationColor = newColor;
        document.querySelectorAll(".color-swatch").forEach((s) => {
          const isSelected = s.dataset.color === newColor;
          s.style.opacity = isSelected ? "1" : "0.6";
          s.style.transform = isSelected ? "scale(1.2)" : "scale(1)";
          s.style.filter = isSelected ? "drop-shadow(0 0 4px white)" : "none";
        });
        const newEmoji = getColorEmoji(newColor);
        const colorEmojiEl = document.getElementById("color-emoji");
        if (colorEmojiEl) {
          colorEmojiEl.textContent = newEmoji;
        }
        palette.style.display = "none";
        saveCharacterData();
        syncColorToSupabase(newColor);
        showNotification(`\u{1F3A8} Notification color changed to ${e.target.title}!`);
      });
    });
  }
  async function syncColorToSupabase(color) {
    try {
      const response = await browserAPI.runtime.sendMessage({
        action: "syncCharacterColor",
        characterId: characterData.id,
        color
      });
      if (response && response.success) {
        debug2.log("\u{1F3A8} Color synced to Supabase successfully");
      } else {
        debug2.warn("\u26A0\uFE0F Failed to sync color to Supabase:", response?.error);
      }
    } catch (error) {
      debug2.warn("\u26A0\uFE0F Error syncing color to Supabase:", error);
    }
  }
  var syncDebounceTimer = null;
  function saveCharacterData() {
    browserAPI.runtime.sendMessage({
      action: "storeCharacterData",
      data: characterData,
      slotId: currentSlotId
      // CRITICAL: Pass slotId for proper persistence
    }).then(() => {
      debug2.log(`\u{1F4BE} Saved character data to browser storage (slotId: ${currentSlotId})`);
    }).catch((err) => {
      debug2.error("\u274C Failed to save character data:", err);
    });
    if (syncDebounceTimer) {
      clearTimeout(syncDebounceTimer);
    }
    syncDebounceTimer = setTimeout(() => {
      sendSyncMessage();
      syncDebounceTimer = null;
    }, 300);
  }
  function sendSyncMessage() {
    debug2.log("\u{1F504} Sending character data update to DiceCloud sync...");
    let channelDivinityForSync = null;
    const channelDivinityResource = characterData.resources?.find(
      (r) => r.name === "Channel Divinity" || r.variableName === "channelDivinityCleric" || r.variableName === "channelDivinityPaladin" || r.variableName === "channelDivinity" || r.varName === "channelDivinity"
    );
    if (channelDivinityResource) {
      channelDivinityForSync = {
        current: channelDivinityResource.current || 0,
        max: channelDivinityResource.max || 0
      };
    }
    const resourcesForSync = characterData.resources || [];
    console.log("[SYNC DEBUG] ========== SYNC MESSAGE DATA ==========");
    console.log("[SYNC DEBUG] Character Name:", characterData.name);
    console.log("[SYNC DEBUG] HP:", characterData.hitPoints?.current, "/", characterData.hitPoints?.max);
    console.log("[SYNC DEBUG] Temp HP:", characterData.temporaryHP);
    console.log("[SYNC DEBUG] Spell Slots:", characterData.spellSlots);
    console.log("[SYNC DEBUG] Channel Divinity (extracted):", channelDivinityForSync);
    console.log("[SYNC DEBUG] Channel Divinity (raw resource):", channelDivinityResource);
    console.log("[SYNC DEBUG] Resources (count):", resourcesForSync?.length);
    console.log("[SYNC DEBUG] Resources (full):", resourcesForSync);
    console.log("[SYNC DEBUG] Actions (count):", characterData.actions?.length);
    console.log("[SYNC DEBUG] Actions (full):", characterData.actions);
    console.log("[SYNC DEBUG] Death Saves:", characterData.deathSaves);
    console.log("[SYNC DEBUG] Inspiration:", characterData.inspiration);
    console.log("[SYNC DEBUG] =========================================");
    const syncMessage = {
      type: "characterDataUpdate",
      characterData: {
        name: characterData.name,
        hp: characterData.hitPoints.current,
        tempHp: characterData.temporaryHP || 0,
        maxHp: characterData.hitPoints.max,
        spellSlots: characterData.spellSlots || {},
        channelDivinity: channelDivinityForSync,
        resources: resourcesForSync,
        actions: characterData.actions || [],
        deathSaves: characterData.deathSaves,
        inspiration: characterData.inspiration,
        lastRoll: characterData.lastRoll
      }
    };
    window.postMessage(syncMessage, "*");
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(syncMessage, "*");
    }
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        action: "updateCharacterData",
        data: characterData
      }, "*");
      debug2.log("\u{1F4BE} Sent character data update to parent window");
      window.opener.postMessage({
        action: "updatePlayerData",
        characterName: characterData.name,
        data: {
          hp: characterData.hp,
          maxHp: characterData.maxHp,
          ac: characterData.ac,
          passivePerception: characterData.passivePerception || 10 + (characterData.perception || 0),
          initiative: characterData.initiative,
          conditions: characterData.conditions || [],
          concentration: characterData.concentration || null,
          deathSaves: characterData.deathSaves || null
        }
      }, "*");
      debug2.log("\u{1F465} Sent player data update to GM Panel");
    }
  }
  function resolveVariablesInFormula(formula) {
    if (!formula || typeof formula !== "string") {
      return formula;
    }
    debug2.log(`\u{1F527} resolveVariablesInFormula called with: "${formula}"`);
    if (!characterData.otherVariables || typeof characterData.otherVariables !== "object") {
      debug2.log("\u26A0\uFE0F No otherVariables available for formula resolution");
      return formula;
    }
    let resolvedFormula = formula;
    let variablesResolved = [];
    const bareVariablePattern = /^[a-zA-Z_][a-zA-Z0-9_.]*$/;
    if (bareVariablePattern.test(formula.trim())) {
      const varName = formula.trim();
      if (characterData.otherVariables.hasOwnProperty(varName)) {
        const variableValue = characterData.otherVariables[varName];
        let value = null;
        if (typeof variableValue === "number") {
          value = variableValue;
        } else if (typeof variableValue === "string") {
          value = variableValue;
        } else if (typeof variableValue === "object" && variableValue.value !== void 0) {
          value = variableValue.value;
        }
        if (value !== null && value !== void 0) {
          debug2.log(`\u2705 Resolved bare variable: ${varName} = ${value}`);
          return String(value);
        }
      }
      debug2.log(`\u26A0\uFE0F Bare variable not found in otherVariables: ${varName}`);
    }
    const getVariableValue = (varPath) => {
      const cleanPath = varPath.startsWith("#") ? varPath.substring(1) : varPath;
      if (cleanPath === "spellList.abilityMod" || cleanPath === "spellList.ability") {
        const charClass = (characterData.class || "").toLowerCase();
        let spellcastingAbility = null;
        if (charClass.includes("cleric") || charClass.includes("druid") || charClass.includes("ranger")) {
          spellcastingAbility = "wisdom";
        } else if (charClass.includes("wizard") || charClass.includes("artificer")) {
          spellcastingAbility = "intelligence";
        } else if (charClass.includes("bard") || charClass.includes("paladin") || charClass.includes("sorcerer") || charClass.includes("warlock")) {
          spellcastingAbility = "charisma";
        }
        if (spellcastingAbility && characterData.attributeMods && characterData.attributeMods[spellcastingAbility] !== void 0) {
          const modifier = characterData.attributeMods[spellcastingAbility];
          debug2.log(`\u2705 Resolved ${cleanPath} to ${spellcastingAbility} modifier: ${modifier}`);
          return modifier;
        }
      }
      if (cleanPath === "spellList.dc") {
        const profBonus = characterData.proficiencyBonus || 0;
        const spellMod = getVariableValue("#spellList.abilityMod");
        if (spellMod !== null) {
          const spellDC = 8 + profBonus + spellMod;
          debug2.log(`\u2705 Calculated spell DC: 8 + ${profBonus} + ${spellMod} = ${spellDC}`);
          return spellDC;
        }
      }
      if (cleanPath === "spellList.attackBonus") {
        const profBonus = characterData.proficiencyBonus || 0;
        const spellMod = getVariableValue("#spellList.abilityMod");
        if (spellMod !== null) {
          const attackBonus = profBonus + spellMod;
          debug2.log(`\u2705 Calculated spell attack bonus: ${profBonus} + ${spellMod} = ${attackBonus}`);
          return attackBonus;
        }
      }
      if (characterData.otherVariables.hasOwnProperty(cleanPath)) {
        const val = characterData.otherVariables[cleanPath];
        if (typeof val === "number")
          return val;
        if (typeof val === "boolean")
          return val;
        if (typeof val === "object" && val.value !== void 0)
          return val.value;
        if (typeof val === "string")
          return val;
      }
      const camelCase = cleanPath.replace(/\.([a-z])/g, (_, letter) => letter.toUpperCase());
      if (characterData.otherVariables.hasOwnProperty(camelCase)) {
        const val = characterData.otherVariables[camelCase];
        if (typeof val === "number")
          return val;
        if (typeof val === "boolean")
          return val;
        if (typeof val === "object" && val.value !== void 0)
          return val.value;
      }
      const alternatives = [
        cleanPath.replace(/\./g, ""),
        // Remove dots
        cleanPath.split(".").pop(),
        // Just the last part
        cleanPath.replace(/\./g, "_")
        // Underscores instead
      ];
      for (const alt of alternatives) {
        if (characterData.otherVariables.hasOwnProperty(alt)) {
          const val = characterData.otherVariables[alt];
          if (typeof val === "number")
            return val;
          if (typeof val === "boolean")
            return val;
          if (typeof val === "object" && val.value !== void 0)
            return val.value;
        }
      }
      return null;
    };
    const diceCloudRefPattern = /\((#[a-zA-Z_][a-zA-Z0-9_.]*)\)/g;
    let match;
    while ((match = diceCloudRefPattern.exec(formula)) !== null) {
      const varRef = match[1];
      const fullMatch2 = match[0];
      const value = getVariableValue(varRef);
      if (value !== null && typeof value === "number") {
        resolvedFormula = resolvedFormula.replace(fullMatch2, value);
        variablesResolved.push(`${varRef}=${value}`);
        debug2.log(`\u2705 Resolved DiceCloud reference: ${varRef} = ${value}`);
      } else {
        debug2.log(`\u26A0\uFE0F Could not resolve DiceCloud reference: ${varRef}, value: ${value}`);
      }
    }
    const parenthesesPattern = /\(([a-zA-Z_][a-zA-Z0-9_]*)\)/g;
    while ((match = parenthesesPattern.exec(formula)) !== null) {
      const variableName = match[1];
      const fullMatch2 = match[0];
      if (characterData.otherVariables.hasOwnProperty(variableName)) {
        const variableValue = characterData.otherVariables[variableName];
        let numericValue = null;
        if (typeof variableValue === "number") {
          numericValue = variableValue;
        } else if (typeof variableValue === "object" && variableValue.value !== void 0) {
          numericValue = variableValue.value;
        }
        if (numericValue !== null) {
          resolvedFormula = resolvedFormula.replace(fullMatch2, numericValue);
          variablesResolved.push(`${variableName}=${numericValue}`);
          debug2.log(`\u2705 Resolved variable: ${variableName} = ${numericValue}`);
        } else {
          debug2.log(`\u26A0\uFE0F Could not extract numeric value from variable: ${variableName}`, variableValue);
        }
      } else {
        debug2.log(`\u26A0\uFE0F Variable not found in otherVariables: ${variableName}`);
      }
    }
    const mathFuncPattern = /(ceil|floor|round|abs)\{([^}]+)\}/gi;
    while ((match = mathFuncPattern.exec(resolvedFormula)) !== null) {
      const funcName = match[1].toLowerCase();
      const expression = match[2];
      const fullMatch = match[0];
      let evalExpression = expression;
      for (const varName in characterData.otherVariables) {
        if (evalExpression.includes(varName)) {
          const variableValue = characterData.otherVariables[varName];
          let value = null;
          if (typeof variableValue === "number") {
            value = variableValue;
          } else if (typeof variableValue === "object" && variableValue.value !== void 0) {
            value = variableValue.value;
          }
          if (value !== null && typeof value === "number") {
            evalExpression = evalExpression.replace(new RegExp(varName, "g"), value);
          }
        }
      }
      try {
        if (/^[\d\s+\-*/().]+$/.test(evalExpression)) {
          const evalResult = eval(evalExpression);
          let result;
          switch (funcName) {
            case "ceil":
              result = Math.ceil(evalResult);
              break;
            case "floor":
              result = Math.floor(evalResult);
              break;
            case "round":
              result = Math.round(evalResult);
              break;
            case "abs":
              result = Math.abs(evalResult);
              break;
            default:
              result = evalResult;
          }
          resolvedFormula = resolvedFormula.replace(fullMatch, result);
          variablesResolved.push(`${funcName}{${expression}}=${result}`);
          debug2.log(`\u2705 Resolved math function: ${funcName}{${expression}} = ${result}`);
        }
      } catch (e) {
        debug2.log(`\u26A0\uFE0F Failed to evaluate ${funcName}{${expression}}`, e);
      }
    }
    function findMatchingParen(str, startIndex) {
      let depth = 1;
      for (let i2 = startIndex; i2 < str.length; i2++) {
        if (str[i2] === "(")
          depth++;
        else if (str[i2] === ")") {
          depth--;
          if (depth === 0)
            return i2;
        }
      }
      return -1;
    }
    function splitArgs(argsString2) {
      const args2 = [];
      let currentArg = "";
      let depth = 0;
      for (let i2 = 0; i2 < argsString2.length; i2++) {
        const char = argsString2[i2];
        if (char === "(") {
          depth++;
          currentArg += char;
        } else if (char === ")") {
          depth--;
          currentArg += char;
        } else if (char === "," && depth === 0) {
          args2.push(currentArg.trim());
          currentArg = "";
        } else {
          currentArg += char;
        }
      }
      if (currentArg) {
        args2.push(currentArg.trim());
      }
      return args2;
    }
    debug2.log(`\u{1F50D} Looking for max/min in formula: "${resolvedFormula}"`);
    const maxMinPattern = /(max|min)\(/gi;
    while ((match = maxMinPattern.exec(resolvedFormula)) !== null) {
      const func = match[1].toLowerCase();
      const funcStart = match.index;
      const argsStart = funcStart + match[0].length;
      const closingParen = findMatchingParen(resolvedFormula, argsStart);
      if (closingParen === -1) {
        debug2.log(`\u26A0\uFE0F No matching closing parenthesis for ${func} at position ${funcStart}`);
        continue;
      }
      const argsString = resolvedFormula.substring(argsStart, closingParen);
      const fullMatch = resolvedFormula.substring(funcStart, closingParen + 1);
      debug2.log(`\u{1F50D} Found max/min match: ${func}(${argsString})`);
      try {
        const args = splitArgs(argsString).map((arg) => {
          const trimmed = arg;
          debug2.log(`\u{1F50D} Resolving arg: "${trimmed}"`);
          const num = parseFloat(trimmed);
          if (!isNaN(num)) {
            debug2.log(`  \u2705 Parsed as number: ${num}`);
            return num;
          }
          const varVal = getVariableValue(trimmed);
          debug2.log(`  \u{1F50D} Variable lookup result: ${varVal}`);
          if (varVal !== null && typeof varVal === "number") {
            debug2.log(`  \u2705 Resolved as variable: ${varVal}`);
            return varVal;
          }
          let evalExpression = trimmed;
          const varPattern = /[a-zA-Z_][a-zA-Z0-9_.]*/g;
          let varMatch;
          const replacements = [];
          while ((varMatch = varPattern.exec(trimmed)) !== null) {
            const varName = varMatch[0];
            const value = getVariableValue(varName);
            if (value !== null && typeof value === "number") {
              replacements.push({ name: varName, value });
            }
          }
          replacements.sort((a, b) => b.name.length - a.name.length);
          for (const { name, value } of replacements) {
            evalExpression = evalExpression.replace(new RegExp(name.replace(/\./g, "\\."), "g"), value);
          }
          evalExpression = evalExpression.replace(/ceil\(/g, "Math.ceil(");
          evalExpression = evalExpression.replace(/floor\(/g, "Math.floor(");
          evalExpression = evalExpression.replace(/round\(/g, "Math.round(");
          evalExpression = evalExpression.replace(/abs\(/g, "Math.abs(");
          try {
            if (/^[\d\s+\-*/().Math]+$/.test(evalExpression)) {
              const result = eval(evalExpression);
              debug2.log(`  \u2705 Evaluated expression "${trimmed}" = ${result}`);
              return result;
            }
          } catch (e) {
            debug2.log(`  \u274C Failed to evaluate: "${trimmed}"`, e);
          }
          debug2.log(`  \u274C Could not resolve: "${trimmed}"`);
          return null;
        }).filter((v) => v !== null);
        if (args.length > 0) {
          const result2 = func === "max" ? Math.max(...args) : Math.min(...args);
          resolvedFormula = resolvedFormula.replace(fullMatch, result2);
          variablesResolved.push(`${func}(...)=${result2}`);
          debug2.log(`\u2705 Resolved ${func} function: ${fullMatch} = ${result2}`);
          maxMinPattern.lastIndex = 0;
        }
      } catch (e) {
        debug2.log(`\u26A0\uFE0F Failed to resolve ${func} function: ${fullMatch}`, e);
      }
    }
    const parenTernaryPattern = /\(([^)]+\?[^)]+:[^)]+)\)/g;
    while ((match = parenTernaryPattern.exec(resolvedFormula)) !== null) {
      const expression2 = match[1];
      const fullMatch2 = match[0];
      if (expression2.includes("?") && expression2.includes(":")) {
        const ternaryParts = expression2.match(/^(.+?)\s*\?\s*(.+?)\s*:\s*(.+?)$/);
        if (ternaryParts) {
          const condition2 = ternaryParts[1].trim();
          const trueValue = ternaryParts[2].trim();
          const falseValue = ternaryParts[3].trim();
          let conditionResult2 = false;
          const varValue2 = getVariableValue(condition2);
          if (varValue2 !== null) {
            conditionResult2 = Boolean(varValue2);
            debug2.log(`\u2705 Evaluated parentheses ternary condition: ${condition2} = ${conditionResult2}`);
          }
          const chosenValue = conditionResult2 ? trueValue : falseValue;
          resolvedFormula = resolvedFormula.replace(fullMatch2, chosenValue);
          variablesResolved.push(`(${condition2}?${trueValue}:${falseValue}) = ${chosenValue}`);
          debug2.log(`\u2705 Resolved parentheses ternary: (${expression2}) => ${chosenValue}`);
          parenTernaryPattern.lastIndex = 0;
        }
      }
    }
    const bracesPattern = /\{([^}]+)\}/g;
    while ((match = bracesPattern.exec(resolvedFormula)) !== null) {
      const expression = match[1];
      const fullMatch = match[0];
      let cleanExpr = expression.replace(/\*\*/g, "");
      const complexTernaryPattern = /^(.+?)\s*\?\s*(.+?)\s*:\s*(.+?)$/;
      const complexTernaryMatch = cleanExpr.match(complexTernaryPattern);
      if (complexTernaryMatch && cleanExpr.includes("?") && cleanExpr.includes(":")) {
        const condition = complexTernaryMatch[1].trim();
        const trueBranch = complexTernaryMatch[2].trim();
        const falseBranch = complexTernaryMatch[3].trim();
        let conditionResult = false;
        try {
          const simpleVarPattern = /^[a-zA-Z_][a-zA-Z0-9_.]*$/;
          if (simpleVarPattern.test(condition.trim())) {
            const varValue2 = getVariableValue(condition.trim());
            if (varValue2 !== null) {
              conditionResult = Boolean(varValue2);
            } else {
              conditionResult = false;
            }
            debug2.log(`\u2705 Evaluated simple variable condition: ${condition} = ${conditionResult}`);
          } else {
            let evalCondition = condition;
            const varPattern = /[a-zA-Z_][a-zA-Z0-9_.]*/g;
            let varMatch;
            const replacements = [];
            while ((varMatch = varPattern.exec(condition)) !== null) {
              const varName = varMatch[0];
              if (["true", "false", "null", "undefined"].includes(varName.toLowerCase())) {
                continue;
              }
              const value = getVariableValue(varName);
              if (value !== null) {
                if (typeof value === "number") {
                  replacements.push({ name: varName, value });
                } else if (typeof value === "boolean") {
                  replacements.push({ name: varName, value });
                } else if (typeof value === "string") {
                  const boolValue = value !== "" && value !== "0" && value.toLowerCase() !== "false";
                  replacements.push({ name: varName, value: boolValue });
                }
              } else {
                replacements.push({ name: varName, value: false });
              }
            }
            replacements.sort((a, b) => b.name.length - a.name.length);
            for (const { name, value } of replacements) {
              evalCondition = evalCondition.replace(new RegExp(name.replace(/\./g, "\\."), "g"), value);
            }
            if (/^[\w\s+\-*/><=!&|()\.]+$/.test(evalCondition)) {
              conditionResult = eval(evalCondition);
            }
          }
        } catch (e) {
          debug2.log(`\u26A0\uFE0F Failed to evaluate ternary condition: ${condition}`, e);
        }
        const chosenBranch = conditionResult ? trueBranch : falseBranch;
        let result = "";
        try {
          if (chosenBranch.includes("+")) {
            const parts = [];
            let current = "";
            let inString = false;
            let i = 0;
            while (i < chosenBranch.length) {
              const char = chosenBranch[i];
              if (char === '"') {
                if (inString) {
                  parts.push({ type: "string", value: current });
                  current = "";
                  inString = false;
                } else {
                  inString = true;
                }
                i++;
              } else if (char === "+" && !inString) {
                if (current.trim()) {
                  parts.push({ type: "expr", value: current.trim() });
                  current = "";
                }
                i++;
              } else {
                current += char;
                i++;
              }
            }
            if (current.trim()) {
              if (inString) {
                parts.push({ type: "string", value: current });
              } else {
                parts.push({ type: "expr", value: current.trim() });
              }
            }
            for (const part of parts) {
              if (part.type === "string") {
                result += part.value;
              } else {
                let exprResult = part.value;
                const floorMatch = exprResult.match(/floor\(([^)]+)\)/);
                if (floorMatch) {
                  const floorExpr = floorMatch[1];
                  let evalExpr = floorExpr;
                  const varPattern = /[a-zA-Z_][a-zA-Z0-9_.]*/g;
                  let varMatch;
                  const replacements = [];
                  while ((varMatch = varPattern.exec(floorExpr)) !== null) {
                    const varName = varMatch[0];
                    const value = getVariableValue(varName);
                    if (value !== null && typeof value === "number") {
                      replacements.push({ name: varName, value });
                    }
                  }
                  replacements.sort((a, b) => b.name.length - a.name.length);
                  for (const { name, value } of replacements) {
                    evalExpr = evalExpr.replace(new RegExp(name.replace(/\./g, "\\."), "g"), value);
                  }
                  if (/^[\d\s+\-*/().]+$/.test(evalExpr)) {
                    const floorResult = Math.floor(eval(evalExpr));
                    exprResult = exprResult.replace(floorMatch[0], floorResult);
                  }
                }
                const varValue = getVariableValue(exprResult);
                if (varValue !== null) {
                  result += varValue;
                } else if (/^[\d\s+\-*/().]+$/.test(exprResult)) {
                  result += eval(exprResult);
                } else {
                  result += exprResult;
                }
              }
            }
          } else if (chosenBranch.startsWith('"') && chosenBranch.endsWith('"')) {
            result = chosenBranch.slice(1, -1);
          } else {
            result = chosenBranch;
          }
          resolvedFormula = resolvedFormula.replace(fullMatch, result);
          variablesResolved.push(`${condition} ? ... : ... = "${result}"`);
          debug2.log(`\u2705 Resolved complex ternary: ${condition} (${conditionResult}) => "${result}"`);
          continue;
        } catch (e) {
          debug2.log(`\u26A0\uFE0F Failed to resolve ternary expression: ${cleanExpr}`, e);
        }
      }
      let simpleValue = getVariableValue(cleanExpr);
      if (simpleValue !== null) {
        resolvedFormula = resolvedFormula.replace(fullMatch, simpleValue);
        variablesResolved.push(`${cleanExpr}=${simpleValue}`);
        debug2.log(`\u2705 Resolved variable: ${cleanExpr} = ${simpleValue}`);
        continue;
      }
      const arrayPattern = /^\[([^\]]+)\]\[([^\]]+)\]$/;
      const arrayMatch = cleanExpr.match(arrayPattern);
      if (arrayMatch) {
        try {
          const arrayPart = arrayMatch[1];
          const indexPart = arrayMatch[2];
          const arrayValues = arrayPart.split(",").map((v) => {
            const trimmed2 = v.trim();
            const unquoted = trimmed2.replace(/^["']|["']$/g, "");
            const num2 = parseFloat(unquoted);
            return isNaN(num2) ? unquoted : num2;
          });
          let indexValue = getVariableValue(indexPart);
          if (indexValue !== null && !isNaN(indexValue)) {
            let result2 = arrayValues[indexValue];
            if (result2 === void 0 && indexValue > 0) {
              result2 = arrayValues[indexValue - 1];
              if (result2 !== void 0) {
                debug2.log(`\u{1F4CA} Array index ${indexValue} out of bounds, using ${indexValue - 1} instead`);
                indexValue = indexValue - 1;
              }
            }
            if (result2 !== void 0) {
              resolvedFormula = resolvedFormula.replace(fullMatch, result2);
              variablesResolved.push(`array[${indexValue}]=${result2}`);
              debug2.log(`\u2705 Resolved array indexing: ${cleanExpr} = ${result2}`);
              continue;
            } else {
              debug2.log(`\u26A0\uFE0F Array index ${indexValue} out of bounds (array length: ${arrayValues.length})`);
            }
          } else {
            debug2.log(`\u26A0\uFE0F Could not resolve index variable: ${indexPart}`);
          }
        } catch (e) {
          debug2.log(`\u26A0\uFE0F Failed to resolve array indexing: ${cleanExpr}`, e);
        }
      }
      const maxMinPattern = /^(max|min)\(([^)]+)\)$/i;
      const maxMinMatch = cleanExpr.match(maxMinPattern);
      if (maxMinMatch) {
        try {
          const func2 = maxMinMatch[1].toLowerCase();
          const args2 = maxMinMatch[2].split(",").map((arg2) => {
            const trimmed2 = arg2.trim();
            const num2 = parseFloat(trimmed2);
            if (!isNaN(num2))
              return num2;
            const varVal2 = getVariableValue(trimmed2);
            if (varVal2 !== null)
              return varVal2;
            return null;
          }).filter((v) => v !== null);
          if (args2.length > 0) {
            const result2 = func2 === "max" ? Math.max(...args2) : Math.min(...args2);
            resolvedFormula = resolvedFormula.replace(fullMatch, result2);
            variablesResolved.push(`${func2}(...)=${result2}`);
            debug2.log(`\u2705 Resolved ${func2} function: ${cleanExpr} = ${result2}`);
            continue;
          }
        } catch (e) {
          debug2.log(`\u26A0\uFE0F Failed to resolve ${cleanExpr}`, e);
        }
      }
      const mathFuncParenPattern = /^(ceil|floor|round|abs)\(([^)]+)\)$/i;
      const mathFuncParenMatch = cleanExpr.match(mathFuncParenPattern);
      if (mathFuncParenMatch) {
        try {
          const funcName = mathFuncParenMatch[1].toLowerCase();
          const expression = mathFuncParenMatch[2];
          let evalExpression = expression;
          const varPattern = /[a-zA-Z_][a-zA-Z0-9_.]*/g;
          let varMatch;
          const replacements = [];
          while ((varMatch = varPattern.exec(expression)) !== null) {
            const varName = varMatch[0];
            const value = getVariableValue(varName);
            if (value !== null && typeof value === "number") {
              replacements.push({ name: varName, value });
            }
          }
          replacements.sort((a, b) => b.name.length - a.name.length);
          for (const { name, value } of replacements) {
            evalExpression = evalExpression.replace(new RegExp(name.replace(/\./g, "\\."), "g"), value);
          }
          if (/^[\d\s+\-*/().]+$/.test(evalExpression)) {
            const evalResult = eval(evalExpression);
            let result;
            switch (funcName) {
              case "ceil":
                result = Math.ceil(evalResult);
                break;
              case "floor":
                result = Math.floor(evalResult);
                break;
              case "round":
                result = Math.round(evalResult);
                break;
              case "abs":
                result = Math.abs(evalResult);
                break;
              default:
                result = evalResult;
            }
            resolvedFormula = resolvedFormula.replace(fullMatch, result);
            variablesResolved.push(`${funcName}(${expression})=${result}`);
            debug2.log(`\u2705 Resolved math function: ${funcName}(${expression}) = ${result}`);
            continue;
          }
        } catch (e) {
          debug2.log(`\u26A0\uFE0F Failed to resolve ${cleanExpr}`, e);
        }
      }
      let evalExpression = cleanExpr;
      const varPattern = /[a-zA-Z_][a-zA-Z0-9_.]*/g;
      let varMatch;
      const replacements = [];
      while ((varMatch = varPattern.exec(cleanExpr)) !== null) {
        const varName = varMatch[0];
        const value = getVariableValue(varName);
        if (value !== null && typeof value === "number") {
          replacements.push({ name: varName, value });
        }
      }
      replacements.sort((a, b) => b.name.length - a.name.length);
      for (const { name, value } of replacements) {
        evalExpression = evalExpression.replace(new RegExp(name.replace(/\./g, "\\."), "g"), value);
      }
      try {
        if (/^[\d\s+\-*/().]+$/.test(evalExpression)) {
          const result = eval(evalExpression);
          resolvedFormula = resolvedFormula.replace(fullMatch, Math.floor(result));
          variablesResolved.push(`${cleanExpr}=${Math.floor(result)}`);
          debug2.log(`\u2705 Resolved expression: ${cleanExpr} = ${Math.floor(result)}`);
        } else {
          debug2.log(`\u26A0\uFE0F Could not resolve expression: ${cleanExpr} (eval: ${evalExpression})`);
        }
      } catch (e) {
        debug2.log(`\u26A0\uFE0F Failed to evaluate expression: ${cleanExpr}`, e);
      }
    }
    if (variablesResolved.length > 0) {
      debug2.log(`\u{1F527} Formula resolution: "${formula}" -> "${resolvedFormula}" (${variablesResolved.join(", ")})`);
    }
    resolvedFormula = resolvedFormula.replace(/\*\*/g, "");
    const inlineCalcPattern = /\{([^}]+)\}/g;
    resolvedFormula = resolvedFormula.replace(inlineCalcPattern, (fullMatch2, expression2) => {
      try {
        let resolvedExpr = expression2;
        const varPattern2 = /[a-zA-Z_][a-zA-Z0-9_.]*/g;
        resolvedExpr = resolvedExpr.replace(varPattern2, (varName) => {
          const value = getVariableValue(varName);
          return value !== null ? value : varName;
        });
        if (/[\d+\-*\/()]/.test(resolvedExpr)) {
          try {
            const result2 = Function('"use strict"; return (' + resolvedExpr + ")")();
            debug2.log(`\u2705 Evaluated inline calculation: {${expression2}} = ${result2}`);
            return result2;
          } catch (e) {
            debug2.log(`\u26A0\uFE0F Failed to evaluate inline calculation: {${expression2}}`, e);
          }
        }
        if (resolvedExpr !== expression2 && !/[a-zA-Z_]/.test(resolvedExpr)) {
          return resolvedExpr;
        }
      } catch (e) {
        debug2.log(`\u26A0\uFE0F Error processing inline calculation: {${expression2}}`, e);
      }
      return fullMatch2;
    });
    return resolvedFormula;
  }
  function safeMathEval(expr) {
    const tokens = [];
    let i2 = 0;
    expr = expr.replace(/\s+/g, "");
    while (i2 < expr.length) {
      if (expr.substr(i2, 10) === "Math.floor") {
        tokens.push({ type: "function", value: "floor" });
        i2 += 10;
      } else if (expr.substr(i2, 9) === "Math.ceil") {
        tokens.push({ type: "function", value: "ceil" });
        i2 += 9;
      } else if (expr.substr(i2, 10) === "Math.round") {
        tokens.push({ type: "function", value: "round" });
        i2 += 10;
      } else if (expr[i2] >= "0" && expr[i2] <= "9" || expr[i2] === ".") {
        let num2 = "";
        while (i2 < expr.length && (expr[i2] >= "0" && expr[i2] <= "9" || expr[i2] === ".")) {
          num2 += expr[i2];
          i2++;
        }
        tokens.push({ type: "number", value: parseFloat(num2) });
      } else if ("+-*/()".includes(expr[i2])) {
        tokens.push({ type: "operator", value: expr[i2] });
        i2++;
      } else {
        throw new Error(`Unexpected character: ${expr[i2]}`);
      }
    }
    let pos = 0;
    function parseExpression() {
      let left = parseTerm();
      while (pos < tokens.length && tokens[pos].type === "operator" && (tokens[pos].value === "+" || tokens[pos].value === "-")) {
        const op = tokens[pos].value;
        pos++;
        const right = parseTerm();
        left = op === "+" ? left + right : left - right;
      }
      return left;
    }
    function parseTerm() {
      let left = parseFactor();
      while (pos < tokens.length && tokens[pos].type === "operator" && (tokens[pos].value === "*" || tokens[pos].value === "/")) {
        const op = tokens[pos].value;
        pos++;
        const right = parseFactor();
        left = op === "*" ? left * right : left / right;
      }
      return left;
    }
    function parseFactor() {
      const token = tokens[pos];
      if (token.type === "number") {
        pos++;
        return token.value;
      }
      if (token.type === "function") {
        const funcName2 = token.value;
        pos++;
        if (pos >= tokens.length || tokens[pos].value !== "(") {
          throw new Error("Expected ( after function name");
        }
        pos++;
        const arg2 = parseExpression();
        if (pos >= tokens.length || tokens[pos].value !== ")") {
          throw new Error("Expected ) after function argument");
        }
        pos++;
        if (funcName2 === "floor")
          return Math.floor(arg2);
        if (funcName2 === "ceil")
          return Math.ceil(arg2);
        if (funcName2 === "round")
          return Math.round(arg2);
        throw new Error(`Unknown function: ${funcName2}`);
      }
      if (token.type === "operator" && token.value === "(") {
        pos++;
        const result2 = parseExpression();
        if (pos >= tokens.length || tokens[pos].value !== ")") {
          throw new Error("Mismatched parentheses");
        }
        pos++;
        return result2;
      }
      if (token.type === "operator" && token.value === "-") {
        pos++;
        return -parseFactor();
      }
      throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
    }
    return parseExpression();
  }
  function evaluateMathInFormula(formula2) {
    if (!formula2 || typeof formula2 !== "string") {
      return formula2;
    }
    let currentFormula = formula2;
    let previousFormula = null;
    let iterations = 0;
    const maxIterations = 10;
    while (currentFormula !== previousFormula && iterations < maxIterations) {
      previousFormula = currentFormula;
      iterations++;
      let processedFormula = currentFormula.replace(/floor\(/g, "Math.floor(");
      processedFormula = processedFormula.replace(/ceil\(/g, "Math.ceil(");
      processedFormula = processedFormula.replace(/round\(/g, "Math.round(");
      const simpleMathPattern = /^[\d\s+\-*/().]+$/;
      if (simpleMathPattern.test(processedFormula)) {
        try {
          const result2 = safeMathEval(processedFormula);
          if (typeof result2 === "number" && !isNaN(result2)) {
            debug2.log(`\u2705 Evaluated simple math: ${currentFormula} = ${result2} (iteration ${iterations})`);
            currentFormula = String(result2);
            continue;
          }
        } catch (e) {
          debug2.log(`\u26A0\uFE0F Could not evaluate math expression: ${currentFormula}`, e);
        }
      }
      const dicePattern = /^(.+?)(d\d+.*)$/i;
      const match2 = processedFormula.match(dicePattern);
      if (match2) {
        const mathPart = match2[1];
        const dicePart = match2[2];
        const mathOnlyPattern = /^[\d\s+\-*/().\w]+$/;
        if (mathOnlyPattern.test(mathPart)) {
          try {
            const result2 = safeMathEval(mathPart);
            if (typeof result2 === "number" && !isNaN(result2)) {
              debug2.log(`\u2705 Evaluated dice formula math: ${mathPart} = ${result2} (iteration ${iterations})`);
              currentFormula = String(result2) + dicePart;
              continue;
            }
          } catch (e) {
            debug2.log(`\u26A0\uFE0F Could not evaluate dice formula math: ${mathPart}`, e);
          }
        }
      }
    }
    if (iterations > 1) {
      debug2.log(`\u{1F504} Formula simplified in ${iterations} iterations: "${formula2}" -> "${currentFormula}"`);
    }
    return currentFormula;
  }
  function applyEffectModifiers(rollName, formula2) {
    const rollLower = rollName.toLowerCase();
    let modifiedFormula = formula2;
    const effectNotes = [];
    const allEffects = [
      ...activeBuffs.map((name) => ({ ...POSITIVE_EFFECTS.find((e) => e.name === name), type: "buff" })),
      ...activeConditions.map((name) => ({ ...NEGATIVE_EFFECTS.find((e) => e.name === name), type: "debuff" }))
    ].filter((e) => e && e.autoApply);
    debug2.log(`\u{1F3B2} Checking effects for roll: ${rollName}`, allEffects);
    for (const effect of allEffects) {
      if (!effect.modifier)
        continue;
      let applied = false;
      if (rollLower.includes("attack") && effect.modifier.attack) {
        const mod = effect.modifier.attack;
        if (mod === "advantage") {
          effectNotes.push(`[${effect.icon} ${effect.name}: Advantage]`);
          applied = true;
        } else if (mod === "disadvantage") {
          effectNotes.push(`[${effect.icon} ${effect.name}: Disadvantage]`);
          applied = true;
        } else {
          modifiedFormula += ` + ${mod}`;
          effectNotes.push(`[${effect.icon} ${effect.name}: ${mod}]`);
          applied = true;
        }
      }
      if (rollLower.includes("save") && (effect.modifier.save || effect.modifier.strSave || effect.modifier.dexSave)) {
        const mod = effect.modifier.save || rollLower.includes("strength") && effect.modifier.strSave || rollLower.includes("dexterity") && effect.modifier.dexSave;
        if (mod === "advantage") {
          effectNotes.push(`[${effect.icon} ${effect.name}: Advantage]`);
          applied = true;
        } else if (mod === "disadvantage") {
          effectNotes.push(`[${effect.icon} ${effect.name}: Disadvantage]`);
          applied = true;
        } else if (mod === "fail") {
          effectNotes.push(`[${effect.icon} ${effect.name}: Auto-fail]`);
          applied = true;
        } else if (mod) {
          modifiedFormula += ` + ${mod}`;
          effectNotes.push(`[${effect.icon} ${effect.name}: ${mod}]`);
          applied = true;
        }
      }
      if ((rollLower.includes("check") || rollLower.includes("perception") || rollLower.includes("stealth") || rollLower.includes("investigation") || rollLower.includes("insight") || rollLower.includes("persuasion") || rollLower.includes("deception") || rollLower.includes("intimidation") || rollLower.includes("athletics") || rollLower.includes("acrobatics")) && effect.modifier.skill) {
        const mod = effect.modifier.skill;
        if (mod === "advantage") {
          effectNotes.push(`[${effect.icon} ${effect.name}: Advantage]`);
          applied = true;
        } else if (mod === "disadvantage") {
          effectNotes.push(`[${effect.icon} ${effect.name}: Disadvantage]`);
          applied = true;
        } else {
          modifiedFormula += ` + ${mod}`;
          effectNotes.push(`[${effect.icon} ${effect.name}: ${mod}]`);
          applied = true;
        }
      }
      if (rollLower.includes("damage") && effect.modifier.damage) {
        modifiedFormula += ` + ${effect.modifier.damage}`;
        effectNotes.push(`[${effect.icon} ${effect.name}: +${effect.modifier.damage}]`);
        applied = true;
      }
      if (applied) {
        debug2.log(`\u2705 Applied ${effect.name} (${effect.type}) to ${rollName}`);
      }
    }
    return { modifiedFormula, effectNotes };
  }
  function checkOptionalEffects(rollName, formula2, onApply) {
    const rollLower = rollName.toLowerCase();
    const optionalEffects = [
      ...activeBuffs.map((name) => ({ ...POSITIVE_EFFECTS.find((e) => e.name === name), type: "buff" })),
      ...activeConditions.map((name) => ({ ...NEGATIVE_EFFECTS.find((e) => e.name === name), type: "debuff" }))
    ].filter((e) => e && !e.autoApply && e.modifier);
    if (optionalEffects.length === 0)
      return;
    debug2.log(`\u{1F3B2} Checking optional effects for roll: ${rollName}`, optionalEffects);
    const applicableEffects = [];
    for (const effect of optionalEffects) {
      let applicable = false;
      const isSkillCheck = rollLower.includes("check") || rollLower.includes("acrobatics") || rollLower.includes("animal") || rollLower.includes("arcana") || rollLower.includes("athletics") || rollLower.includes("deception") || rollLower.includes("history") || rollLower.includes("insight") || rollLower.includes("intimidation") || rollLower.includes("investigation") || rollLower.includes("medicine") || rollLower.includes("nature") || rollLower.includes("perception") || rollLower.includes("performance") || rollLower.includes("persuasion") || rollLower.includes("religion") || rollLower.includes("sleight") || rollLower.includes("stealth") || rollLower.includes("survival");
      if (isSkillCheck && effect.modifier.skill) {
        applicable = true;
      }
      if (rollLower.includes("attack") && effect.modifier.attack) {
        applicable = true;
      }
      if (rollLower.includes("save") && effect.modifier.save) {
        applicable = true;
      }
      if (effect.name.startsWith("Bardic Inspiration")) {
        if (rollLower.includes("check") || rollLower.includes("perception") || rollLower.includes("stealth") || rollLower.includes("investigation") || rollLower.includes("insight") || rollLower.includes("persuasion") || rollLower.includes("deception") || rollLower.includes("intimidation") || rollLower.includes("athletics") || rollLower.includes("acrobatics") || rollLower.includes("attack") || rollLower.includes("save")) {
          applicable = true;
        }
      }
      if (applicable) {
        applicableEffects.push(effect);
      }
    }
    if (applicableEffects.length > 0) {
      showOptionalEffectPopup(applicableEffects, rollName, formula2, onApply);
    }
  }
  function showOptionalEffectPopup(effects, rollName, formula2, onApply) {
    debug2.log("\u{1F3AF} Showing optional effect popup for:", effects);
    if (!document.body) {
      debug2.error("\u274C document.body not available for optional effect popup");
      return;
    }
    const colors = getPopupThemeColors();
    const popupOverlay = document.createElement("div");
    popupOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(2px);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
    const popupContent = document.createElement("div");
    popupContent.style.cssText = `
    background: ${colors.background};
    border-radius: 12px;
    padding: 24px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    text-align: center;
    border: 2px solid var(--accent-primary);
  `;
    const effectsList = effects.map((effect) => `
    <div style="margin: 12px 0; padding: 12px; background: ${effect.color}20; border: 2px solid ${effect.color}; border-radius: 8px; cursor: pointer; transition: all 0.2s;" 
         onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'"
         onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'"
         data-effect="${effect.name}" data-type="${effect.type}">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 1.2em;">${effect.icon}</span>
        <div style="flex: 1; text-align: left;">
          <div style="font-weight: bold; color: var(--text-primary);">${effect.name}</div>
          <div style="font-size: 0.85em; color: var(--text-secondary); margin-top: 2px;">${effect.description}</div>
        </div>
      </div>
    </div>
  `).join("");
    popupContent.innerHTML = `
    <div style="font-size: 24px; margin-bottom: 16px;">\u{1F3AF}</div>
    <h2 style="margin: 0 0 8px 0; color: ${colors.heading};">Optional Effect Available!</h2>
    <p style="margin: 0 0 16px 0; color: ${colors.text};">
      You can apply an optional effect to your <strong>${rollName}</strong> roll:
    </p>
    ${effectsList}
    <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
      <button id="skip-effect" style="background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;">
        Skip
      </button>
    </div>
  `;
    popupOverlay.appendChild(popupContent);
    document.body.appendChild(popupOverlay);
    popupContent.querySelectorAll("[data-effect]").forEach((effectDiv) => {
      effectDiv.addEventListener("click", () => {
        const effectName = effectDiv.dataset.effect;
        const effectType = effectDiv.dataset.type;
        const effect = effects.find((e) => e.name === effectName);
        if (effect && onApply) {
          onApply(effect);
        }
        document.body.removeChild(popupOverlay);
      });
    });
    document.getElementById("skip-effect").addEventListener("click", () => {
      document.body.removeChild(popupOverlay);
    });
    popupOverlay.addEventListener("click", (e) => {
      if (e.target === popupOverlay) {
        document.body.removeChild(popupOverlay);
      }
    });
    debug2.log("\u{1F3AF} Optional effect popup displayed");
  }
  function roll(name, formula2, prerolledResult = null) {
    debug2.log("\u{1F3B2} Rolling:", name, formula2, prerolledResult ? `(prerolled: ${prerolledResult})` : "");
    let resolvedFormula2 = resolveVariablesInFormula(formula2);
    const rollLower = name.toLowerCase();
    const optionalEffects = [
      ...activeBuffs.map((name2) => ({ ...POSITIVE_EFFECTS.find((e) => e.name === name2), type: "buff" })),
      ...activeConditions.map((name2) => ({ ...NEGATIVE_EFFECTS.find((e) => e.name === name2), type: "debuff" }))
    ].filter((e) => e && !e.autoApply && e.modifier);
    const hasApplicableOptionalEffects = optionalEffects.some((effect) => {
      const isSkillCheck = rollLower.includes("check") || rollLower.includes("acrobatics") || rollLower.includes("animal") || rollLower.includes("arcana") || rollLower.includes("athletics") || rollLower.includes("deception") || rollLower.includes("history") || rollLower.includes("insight") || rollLower.includes("intimidation") || rollLower.includes("investigation") || rollLower.includes("medicine") || rollLower.includes("nature") || rollLower.includes("perception") || rollLower.includes("performance") || rollLower.includes("persuasion") || rollLower.includes("religion") || rollLower.includes("sleight") || rollLower.includes("stealth") || rollLower.includes("survival");
      return isSkillCheck && effect.modifier.skill || rollLower.includes("attack") && effect.modifier.attack;
    });
    if (hasApplicableOptionalEffects) {
      debug2.log("\u{1F3AF} Found applicable optional effects, showing popup...");
      checkOptionalEffects(name, resolvedFormula2, (chosenEffect) => {
        const { modifiedFormula: modifiedFormula2, effectNotes: effectNotes2 } = applyEffectModifiers(name, resolvedFormula2);
        let finalFormula = modifiedFormula2;
        const isSkillOrAbilityCheck = rollLower.includes("check") || rollLower.includes("acrobatics") || rollLower.includes("animal") || rollLower.includes("arcana") || rollLower.includes("athletics") || rollLower.includes("deception") || rollLower.includes("history") || rollLower.includes("insight") || rollLower.includes("intimidation") || rollLower.includes("investigation") || rollLower.includes("medicine") || rollLower.includes("nature") || rollLower.includes("perception") || rollLower.includes("performance") || rollLower.includes("persuasion") || rollLower.includes("religion") || rollLower.includes("sleight") || rollLower.includes("stealth") || rollLower.includes("survival") || rollLower.includes("strength") || rollLower.includes("dexterity") || rollLower.includes("constitution") || rollLower.includes("intelligence") || rollLower.includes("wisdom") || rollLower.includes("charisma");
        debug2.log(`\u{1F3AF} Applying chosen effect: ${chosenEffect.name}`, {
          modifier: chosenEffect.modifier,
          rollLower,
          hasSkillMod: !!chosenEffect.modifier?.skill,
          isSkillOrAbilityCheck,
          formulaBefore: finalFormula
        });
        if (chosenEffect.modifier?.skill && isSkillOrAbilityCheck) {
          finalFormula += ` + ${chosenEffect.modifier.skill}`;
          effectNotes2.push(`[${chosenEffect.icon} ${chosenEffect.name}: ${chosenEffect.modifier.skill}]`);
          debug2.log(`\u2705 Added skill modifier: ${chosenEffect.modifier.skill}, formula now: ${finalFormula}`);
        } else if (chosenEffect.modifier?.attack && rollLower.includes("attack")) {
          finalFormula += ` + ${chosenEffect.modifier.attack}`;
          effectNotes2.push(`[${chosenEffect.icon} ${chosenEffect.name}: ${chosenEffect.modifier.attack}]`);
          debug2.log(`\u2705 Added attack modifier: ${chosenEffect.modifier.attack}, formula now: ${finalFormula}`);
        } else {
          debug2.log(`\u26A0\uFE0F No modifier applied - skill: ${chosenEffect.modifier?.skill}, check: ${rollLower.includes("check")}, attack: ${chosenEffect.modifier?.attack}`);
        }
        if (chosenEffect.type === "buff") {
          activeBuffs = activeBuffs.filter((e) => e !== chosenEffect.name);
          debug2.log(`\u{1F5D1}\uFE0F Removed buff: ${chosenEffect.name}`);
        } else if (chosenEffect.type === "debuff") {
          activeConditions = activeConditions.filter((e) => e !== chosenEffect.name);
          debug2.log(`\u{1F5D1}\uFE0F Removed debuff: ${chosenEffect.name}`);
        }
        updateEffectsDisplay();
        const formulaWithAdvantage2 = applyAdvantageToFormula(finalFormula, effectNotes2);
        executeRoll(name, formulaWithAdvantage2, effectNotes2, prerolledResult);
      });
      return;
    }
    const { modifiedFormula, effectNotes } = applyEffectModifiers(name, resolvedFormula2);
    const formulaWithAdvantage = applyAdvantageToFormula(modifiedFormula, effectNotes);
    executeRoll(name, formulaWithAdvantage, effectNotes, prerolledResult);
  }
  function applyAdvantageToFormula(formula2, effectNotes) {
    if (advantageState === "normal") {
      return formula2;
    }
    if (!formula2.includes("1d20") && !formula2.includes("d20")) {
      return formula2;
    }
    let modifiedFormula = formula2;
    if (advantageState === "advantage") {
      modifiedFormula = modifiedFormula.replace(/1d20/g, "2d20kh1");
      modifiedFormula = modifiedFormula.replace(/(?<!\d)d20/g, "2d20kh1");
      effectNotes.push("[\u26A1 Advantage]");
      debug2.log("\u26A1 Applied advantage to roll");
    } else if (advantageState === "disadvantage") {
      modifiedFormula = modifiedFormula.replace(/1d20/g, "2d20kl1");
      modifiedFormula = modifiedFormula.replace(/(?<!\d)d20/g, "2d20kl1");
      effectNotes.push("[\u26A0\uFE0F Disadvantage]");
      debug2.log("\u26A0\uFE0F Applied disadvantage to roll");
    }
    setTimeout(() => setAdvantageState("normal"), 100);
    return modifiedFormula;
  }
  function executeRoll(name, formula2, effectNotes, prerolledResult = null) {
    const colorBanner = getColoredBanner();
    let rollName = `${colorBanner}${characterData.name} rolls ${name}`;
    if (effectNotes.length > 0) {
      rollName += ` ${effectNotes.join(" ")}`;
    }
    if (characterData) {
      characterData.lastRoll = {
        name,
        formula: formula2,
        effectNotes
      };
      saveCharacterData();
    }
    const messageData = {
      action: "rollFromPopout",
      name: rollName,
      formula: formula2,
      color: characterData.notificationColor,
      characterName: characterData.name
    };
    if (prerolledResult !== null) {
      messageData.prerolledResult = prerolledResult;
    }
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage(messageData, "*");
        showNotification(`\u{1F3B2} Rolling ${name}...`);
        debug2.log("\u2705 Roll sent via window.opener");
        return;
      } catch (error) {
        debug2.warn("\u26A0\uFE0F Could not send via window.opener:", error.message);
      }
    }
    debug2.log("\u{1F4E1} Using background script to relay roll to Roll20...");
    browserAPI.runtime.sendMessage({
      action: "relayRollToRoll20",
      roll: messageData
    }, (response) => {
      if (browserAPI.runtime.lastError) {
        debug2.error("\u274C Error relaying roll:", browserAPI.runtime.lastError);
        showNotification("Failed to send roll. Please try from Roll20 page.", "error");
      } else if (response && response.success) {
        debug2.log("\u2705 Roll relayed to Roll20 via background script");
        showNotification(`\u{1F3B2} Rolling ${name}...`);
      } else {
        debug2.error("\u274C Failed to relay roll:", response?.error);
        showNotification("Failed to send roll. Make sure Roll20 tab is open.", "error");
      }
    });
  }
  function showNotification(message) {
    const notif = document.createElement("div");
    notif.style.cssText = "position: fixed; top: 20px; right: 20px; background: #27AE60; color: white; padding: 15px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10000;";
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 2e3);
  }
  function takeShortRest() {
    if (!characterData) {
      showNotification("\u274C Character data not available", "error");
      return;
    }
    const confirmed = confirm("Take a Short Rest?\n\nThis will:\n- Allow you to spend Hit Dice to restore HP\n- Restore Warlock spell slots\n- Restore some class features");
    if (!confirmed)
      return;
    debug2.log("\u2615 Taking short rest...");
    if (characterData.temporaryHP > 0) {
      characterData.temporaryHP = 0;
      debug2.log("\u2705 Cleared temporary HP");
    }
    debug2.log(`\u2139\uFE0F Inspiration status unchanged (${characterData.inspiration ? "active" : "none"})`);
    if (characterData.spellSlots && characterData.spellSlots.pactMagicSlotsMax !== void 0) {
      characterData.spellSlots.pactMagicSlots = characterData.spellSlots.pactMagicSlotsMax;
      debug2.log(`\u2705 Restored Pact Magic slots (spellSlots): ${characterData.spellSlots.pactMagicSlots}/${characterData.spellSlots.pactMagicSlotsMax}`);
    }
    if (characterData.otherVariables) {
      if (characterData.otherVariables.pactMagicSlotsMax !== void 0) {
        characterData.otherVariables.pactMagicSlots = characterData.otherVariables.pactMagicSlotsMax;
        debug2.log("\u2705 Restored Pact Magic slots (otherVariables)");
      }
      if (characterData.otherVariables.kiMax !== void 0) {
        characterData.otherVariables.ki = characterData.otherVariables.kiMax;
        debug2.log("\u2705 Restored Ki points");
      } else if (characterData.otherVariables.kiPointsMax !== void 0) {
        characterData.otherVariables.kiPoints = characterData.otherVariables.kiPointsMax;
        debug2.log("\u2705 Restored Ki points");
      }
      if (characterData.otherVariables.actionSurgeMax !== void 0) {
        characterData.otherVariables.actionSurge = characterData.otherVariables.actionSurgeMax;
      }
      if (characterData.otherVariables.secondWindMax !== void 0) {
        characterData.otherVariables.secondWind = characterData.otherVariables.secondWindMax;
      }
    }
    spendHitDice();
    if (characterData.resources && characterData.resources.length > 0) {
      characterData.resources.forEach((resource) => {
        const lowerName = resource.name.toLowerCase();
        if (lowerName.includes("sorcery") || lowerName.includes("rage")) {
          debug2.log(`\u23ED\uFE0F Skipping ${resource.name} (long rest only)`);
          return;
        }
        resource.current = resource.max;
        if (characterData.otherVariables && resource.varName) {
          characterData.otherVariables[resource.varName] = resource.current;
        }
        debug2.log(`\u2705 Restored ${resource.name} (${resource.current}/${resource.max})`);
      });
    }
    if (characterData.actions) {
      characterData.actions.forEach((action) => {
        if (action.uses && action.usesUsed > 0) {
          action.usesUsed = 0;
          debug2.log(`\u2705 Reset uses for ${action.name}`);
        }
      });
    }
    saveCharacterData();
    buildSheet(characterData);
    showNotification("\u2615 Short Rest complete! Resources recharged.");
    debug2.log("\u2705 Short rest complete");
    const colorBanner = getColoredBanner();
    const messageData = {
      action: "announceSpell",
      message: `&{template:default} {{name=${colorBanner}${characterData.name} takes a short rest}} {{=\u2615 Short rest complete. Resources recharged!}}`,
      color: characterData.notificationColor
    };
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage(messageData, "*");
      } catch (error) {
        debug2.warn("\u26A0\uFE0F Could not send via window.opener:", error.message);
        browserAPI.runtime.sendMessage({
          action: "relayRollToRoll20",
          roll: messageData
        });
      }
    } else {
      browserAPI.runtime.sendMessage({
        action: "relayRollToRoll20",
        roll: messageData
      });
    }
  }
  function getHitDieType() {
    const className = (characterData.class || "").toLowerCase();
    const hitDiceMap = {
      "barbarian": "d12",
      "fighter": "d10",
      "paladin": "d10",
      "ranger": "d10",
      "bard": "d8",
      "cleric": "d8",
      "druid": "d8",
      "monk": "d8",
      "rogue": "d8",
      "warlock": "d8",
      "sorcerer": "d6",
      "wizard": "d6"
    };
    for (const [classKey, die] of Object.entries(hitDiceMap)) {
      if (className.includes(classKey)) {
        return die;
      }
    }
    return "d8";
  }
  function initializeHitDice() {
    if (characterData.hitDice === void 0) {
      const level = characterData.level || 1;
      characterData.hitDice = {
        current: level,
        max: level,
        type: getHitDieType()
      };
    }
  }
  function spendHitDice() {
    initializeHitDice();
    const conMod = characterData.attributeMods?.constitution || 0;
    const hitDie = characterData.hitDice.type;
    const maxDice = parseInt(hitDie.substring(1));
    if (characterData.hitDice.current <= 0) {
      alert("You have no Hit Dice remaining to spend!");
      return;
    }
    let totalHealed = 0;
    let diceSpent = 0;
    while (characterData.hitDice.current > 0 && characterData.hitPoints.current < characterData.hitPoints.max) {
      const spend = confirm(
        `Spend a Hit Die? (${characterData.hitDice.current}/${characterData.hitDice.max} remaining)

Hit Die: ${hitDie}
CON Modifier: ${conMod >= 0 ? "+" : ""}${conMod}
Current HP: ${characterData.hitPoints.current}/${characterData.hitPoints.max}
HP Healed so far: ${totalHealed}`
      );
      if (!spend)
        break;
      const roll2 = Math.floor(Math.random() * maxDice) + 1;
      const healing = Math.max(1, roll2 + conMod);
      characterData.hitDice.current--;
      diceSpent++;
      const oldHP = characterData.hitPoints.current;
      characterData.hitPoints.current = Math.min(
        characterData.hitPoints.current + healing,
        characterData.hitPoints.max
      );
      const actualHealing = characterData.hitPoints.current - oldHP;
      totalHealed += actualHealing;
      debug2.log(`\u{1F3B2} Rolled ${hitDie}: ${roll2} + ${conMod} = ${healing} HP (restored ${actualHealing})`);
      if (window.opener && !window.opener.closed) {
        const colorBanner = getColoredBanner();
        window.opener.postMessage({
          action: "announceSpell",
          message: `&{template:default} {{name=${colorBanner}${characterData.name} spends hit dice}} {{Roll=\u{1F3B2} ${hitDie}: ${roll2} + ${conMod} CON}} {{HP Restored=${healing}}} {{Current HP=${characterData.hitPoints.current}/${characterData.hitPoints.max}}}`,
          color: characterData.notificationColor
        }, "*");
      }
    }
    if (diceSpent > 0) {
      showNotification(`\u{1F3B2} Spent ${diceSpent} Hit Dice and restored ${totalHealed} HP!`);
    } else {
      showNotification("No Hit Dice spent.");
    }
  }
  function takeLongRest() {
    if (!characterData) {
      showNotification("\u274C Character data not available", "error");
      return;
    }
    const confirmed = confirm("Take a Long Rest?\n\nThis will:\n- Fully restore HP\n- Restore all spell slots\n- Restore all class features\n- Restore half your hit dice (minimum 1)");
    if (!confirmed)
      return;
    debug2.log("\u{1F319} Taking long rest...");
    initializeHitDice();
    characterData.hitPoints.current = characterData.hitPoints.max;
    debug2.log("\u2705 Restored HP to max");
    if (characterData.temporaryHP > 0) {
      characterData.temporaryHP = 0;
      debug2.log("\u2705 Cleared temporary HP");
    }
    debug2.log(`\u2139\uFE0F Inspiration status unchanged (${characterData.inspiration ? "active" : "none"})`);
    const hitDiceRestored = Math.max(1, Math.floor(characterData.hitDice.max / 2));
    const oldHitDice = characterData.hitDice.current;
    characterData.hitDice.current = Math.min(
      characterData.hitDice.current + hitDiceRestored,
      characterData.hitDice.max
    );
    debug2.log(`\u2705 Restored ${characterData.hitDice.current - oldHitDice} hit dice (${characterData.hitDice.current}/${characterData.hitDice.max})`);
    if (characterData.spellSlots) {
      for (let level = 1; level <= 9; level++) {
        const slotVar = `level${level}SpellSlots`;
        const slotMaxVar = `level${level}SpellSlotsMax`;
        if (characterData.spellSlots[slotMaxVar] !== void 0) {
          characterData.spellSlots[slotVar] = characterData.spellSlots[slotMaxVar];
          debug2.log(`\u2705 Restored level ${level} spell slots`);
        }
      }
      if (characterData.spellSlots.pactMagicSlotsMax !== void 0) {
        characterData.spellSlots.pactMagicSlots = characterData.spellSlots.pactMagicSlotsMax;
        debug2.log(`\u2705 Restored Pact Magic slots: ${characterData.spellSlots.pactMagicSlots}/${characterData.spellSlots.pactMagicSlotsMax}`);
      }
    }
    if (characterData.resources && characterData.resources.length > 0) {
      characterData.resources.forEach((resource) => {
        resource.current = resource.max;
        if (characterData.otherVariables && resource.varName) {
          characterData.otherVariables[resource.varName] = resource.current;
        }
        debug2.log(`\u2705 Restored ${resource.name} (${resource.current}/${resource.max})`);
      });
    }
    if (characterData.otherVariables) {
      Object.keys(characterData.otherVariables).forEach((key) => {
        if (key.endsWith("Max")) {
          const baseKey = key.replace("Max", "");
          if (characterData.otherVariables[baseKey] !== void 0) {
            characterData.otherVariables[baseKey] = characterData.otherVariables[key];
            debug2.log(`\u2705 Restored ${baseKey}`);
          }
        }
      });
      if (characterData.otherVariables.kiMax !== void 0) {
        characterData.otherVariables.ki = characterData.otherVariables.kiMax;
      } else if (characterData.otherVariables.kiPointsMax !== void 0) {
        characterData.otherVariables.kiPoints = characterData.otherVariables.kiPointsMax;
      }
      if (characterData.otherVariables.sorceryPointsMax !== void 0) {
        characterData.otherVariables.sorceryPoints = characterData.otherVariables.sorceryPointsMax;
      }
      if (characterData.otherVariables.pactMagicSlotsMax !== void 0) {
        characterData.otherVariables.pactMagicSlots = characterData.otherVariables.pactMagicSlotsMax;
      }
      if (characterData.otherVariables.channelDivinityClericMax !== void 0) {
        characterData.otherVariables.channelDivinityCleric = characterData.otherVariables.channelDivinityClericMax;
      } else if (characterData.otherVariables.channelDivinityPaladinMax !== void 0) {
        characterData.otherVariables.channelDivinityPaladin = characterData.otherVariables.channelDivinityPaladinMax;
      } else if (characterData.otherVariables.channelDivinityMax !== void 0) {
        characterData.otherVariables.channelDivinity = characterData.otherVariables.channelDivinityMax;
      }
    }
    if (characterData.actions) {
      characterData.actions.forEach((action) => {
        if (action.uses && action.usesUsed > 0) {
          action.usesUsed = 0;
          debug2.log(`\u2705 Reset uses for ${action.name}`);
        }
      });
    }
    saveCharacterData();
    buildSheet(characterData);
    showNotification("\u{1F319} Long Rest complete! All resources restored.");
    debug2.log("\u2705 Long rest complete");
    const colorBanner = getColoredBanner();
    const messageData = {
      action: "announceSpell",
      message: `&{template:default} {{name=${colorBanner}${characterData.name} takes a long rest}} {{=\u{1F319} Long rest complete!}} {{HP=${characterData.hitPoints.current}/${characterData.hitPoints.max} (Fully Restored)}} {{=All spell slots and resources restored!}}`,
      color: characterData.notificationColor
    };
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage(messageData, "*");
      } catch (error) {
        debug2.warn("\u26A0\uFE0F Could not send via window.opener:", error.message);
        browserAPI.runtime.sendMessage({
          action: "relayRollToRoll20",
          roll: messageData
        });
      }
    } else {
      browserAPI.runtime.sendMessage({
        action: "relayRollToRoll20",
        roll: messageData
      });
    }
  }
  function initCollapsibleSections() {
    const sections = document.querySelectorAll(".section h3");
    sections.forEach((header) => {
      header.addEventListener("click", function() {
        const section = this.parentElement;
        const content = section.querySelector(".section-content");
        this.classList.toggle("collapsed");
        content.classList.toggle("collapsed");
      });
    });
  }
  function collapseSectionByContainerId(containerId) {
    const container = document.getElementById(containerId);
    if (!container)
      return;
    const section = container.closest(".section");
    if (!section)
      return;
    const header = section.querySelector("h3");
    const content = section.querySelector(".section-content");
    if (header && content) {
      header.classList.add("collapsed");
      content.classList.add("collapsed");
    }
  }
  function expandSectionByContainerId(containerId) {
    const container = document.getElementById(containerId);
    if (!container)
      return;
    const section = container.closest(".section");
    if (!section)
      return;
    const header = section.querySelector("h3");
    const content = section.querySelector(".section-content");
    if (header && content) {
      header.classList.remove("collapsed");
      content.classList.remove("collapsed");
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCollapsibleSections);
  } else {
    initCollapsibleSections();
  }
  function initCloseButton() {
    const closeBtn = document.getElementById("close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        window.close();
      });
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCloseButton);
  } else {
    initCloseButton();
  }
  window.addEventListener("beforeunload", () => {
    if (characterData && currentSlotId) {
      debug2.log("\u{1F4BE} Saving character data before window closes");
      browserAPI.runtime.sendMessage({
        action: "storeCharacterData",
        data: characterData,
        slotId: currentSlotId
        // CRITICAL: Pass slotId for proper persistence
      });
      debug2.log(`\u2705 Saved character data: ${characterData.name} (slotId: ${currentSlotId})`);
    }
  });
  function initCombatMechanics() {
    debug2.log("\u{1F3AE} Initializing combat mechanics...");
    initActionEconomy();
    initConditionsManager();
    initConcentrationTracker();
    initGMMode();
    debug2.log("\u2705 Combat mechanics initialized");
  }
  var isMyTurn = false;
  function initActionEconomy() {
    const actionIndicator = document.getElementById("action-indicator");
    const bonusActionIndicator = document.getElementById("bonus-action-indicator");
    const movementIndicator = document.getElementById("movement-indicator");
    const reactionIndicator = document.getElementById("reaction-indicator");
    const turnResetBtn = document.getElementById("turn-reset-btn");
    const roundResetBtn = document.getElementById("round-reset-btn");
    if (!actionIndicator) {
      debug2.warn("\u26A0\uFE0F Action economy elements not found");
      return;
    }
    updateActionEconomyAvailability();
    [actionIndicator, bonusActionIndicator, movementIndicator, reactionIndicator].forEach((indicator) => {
      if (indicator) {
        indicator.addEventListener("click", () => {
          if (indicator.dataset.disabled === "true") {
            showNotification("\u26A0\uFE0F Only reactions available when it's not your turn!");
            return;
          }
          const isUsed = indicator.dataset.used === "true";
          const actionLabel = indicator.querySelector(".action-label").textContent;
          if (!isUsed) {
            indicator.dataset.used = "true";
            debug2.log(`\u{1F3AF} ${actionLabel} used`);
            postActionToChat(actionLabel, "used");
          } else {
            showNotification(`\u26A0\uFE0F Use Turn/Round Reset to restore ${actionLabel}`);
          }
        });
      }
    });
    if (turnResetBtn) {
      turnResetBtn.addEventListener("click", () => {
        [actionIndicator, bonusActionIndicator, movementIndicator].forEach((indicator) => {
          if (indicator)
            indicator.dataset.used = "false";
        });
        debug2.log("\u{1F504} Turn reset: Action, Bonus Action, Movement restored");
        showNotification("\u{1F504} Turn reset!");
        postToChatIfOpener(`\u{1F504} ${characterData.name} resets turn actions!`);
        postActionEconomyToDiscord();
      });
    }
    if (roundResetBtn) {
      roundResetBtn.addEventListener("click", () => {
        [actionIndicator, bonusActionIndicator, movementIndicator, reactionIndicator].forEach((indicator) => {
          if (indicator)
            indicator.dataset.used = "false";
        });
        debug2.log("\u{1F504} Round reset: All actions restored");
        showNotification("\u{1F504} Round reset!");
        postToChatIfOpener(`\u{1F504} ${characterData.name} resets all actions!`);
        postActionEconomyToDiscord();
      });
    }
    debug2.log("\u2705 Action economy initialized");
  }
  function updateActionEconomyAvailability() {
    const actionIndicator = document.getElementById("action-indicator");
    const bonusActionIndicator = document.getElementById("bonus-action-indicator");
    const movementIndicator = document.getElementById("movement-indicator");
    const reactionIndicator = document.getElementById("reaction-indicator");
    const turnBasedActions = [actionIndicator, bonusActionIndicator, movementIndicator];
    if (isMyTurn) {
      [...turnBasedActions, reactionIndicator].forEach((indicator) => {
        if (indicator) {
          indicator.dataset.disabled = "false";
          indicator.style.removeProperty("opacity");
          indicator.style.removeProperty("cursor");
          indicator.style.removeProperty("pointer-events");
        }
      });
    } else {
      turnBasedActions.forEach((indicator) => {
        if (indicator) {
          indicator.dataset.disabled = "true";
          indicator.style.opacity = "0.3";
          indicator.style.cursor = "not-allowed";
          indicator.style.pointerEvents = "auto";
        }
      });
      if (reactionIndicator) {
        reactionIndicator.dataset.disabled = "false";
        reactionIndicator.style.removeProperty("opacity");
        reactionIndicator.style.removeProperty("cursor");
        reactionIndicator.style.removeProperty("pointer-events");
      }
    }
    debug2.log(`\u{1F504} Action economy updated: isMyTurn=${isMyTurn}, actions=${turnBasedActions.length > 0 ? "enabled" : "disabled"}, reaction=${reactionIndicator ? "enabled" : "N/A"}`);
  }
  function activateTurn() {
    debug2.log("\u2694\uFE0F Activating turn - setting isMyTurn = true");
    isMyTurn = true;
    const reactionIndicator = document.getElementById("reaction-indicator");
    if (reactionIndicator) {
      reactionIndicator.dataset.used = "false";
      debug2.log("\u{1F504} Reaction restored (one per round limit)");
    }
    updateActionEconomyAvailability();
    const actionEconomy = document.querySelector(".action-economy");
    if (actionEconomy) {
      actionEconomy.style.boxShadow = "0 0 20px rgba(78, 205, 196, 0.6)";
      actionEconomy.style.border = "2px solid #4ECDC4";
      debug2.log("\u2694\uFE0F Added visual highlight to action economy");
    }
    setTimeout(() => postActionEconomyToDiscord(), 100);
    debug2.log("\u2694\uFE0F Turn activated! All actions available.");
  }
  function deactivateTurn() {
    isMyTurn = false;
    updateActionEconomyAvailability();
    const actionEconomy = document.querySelector(".action-economy");
    if (actionEconomy) {
      actionEconomy.style.boxShadow = "";
      actionEconomy.style.border = "";
    }
    debug2.log("\u23F8\uFE0F Turn ended. Only reaction available.");
  }
  function markActionAsUsed(castingTime) {
    if (!castingTime) {
      debug2.warn("\u26A0\uFE0F No casting time provided to markActionAsUsed");
      return;
    }
    const actionIndicator = document.getElementById("action-indicator");
    const bonusActionIndicator = document.getElementById("bonus-action-indicator");
    const movementIndicator = document.getElementById("movement-indicator");
    const reactionIndicator = document.getElementById("reaction-indicator");
    const normalizedTime = castingTime.toLowerCase().trim();
    debug2.log(`\u{1F3AF} Marking action as used for casting time: "${castingTime}" (normalized: "${normalizedTime}")`);
    debug2.log(`\u{1F3AF} Available indicators: Action=${!!actionIndicator}, Bonus=${!!bonusActionIndicator}, Movement=${!!movementIndicator}, Reaction=${!!reactionIndicator}`);
    if (normalizedTime.includes("bonus")) {
      if (bonusActionIndicator && bonusActionIndicator.dataset.used !== "true") {
        bonusActionIndicator.dataset.used = "true";
        debug2.log(`\u{1F3AF} Bonus Action used for casting`);
      } else {
        debug2.log(`\u26A0\uFE0F Bonus Action indicator not found or already used`);
      }
    } else if (normalizedTime.includes("movement") || normalizedTime.includes("move")) {
      if (movementIndicator && movementIndicator.dataset.used !== "true") {
        movementIndicator.dataset.used = "true";
        debug2.log(`\u{1F3AF} Movement used for casting`);
      } else {
        debug2.log(`\u26A0\uFE0F Movement indicator not found or already used`);
      }
    } else if (normalizedTime.includes("reaction")) {
      if (reactionIndicator && reactionIndicator.dataset.used !== "true") {
        reactionIndicator.dataset.used = "true";
        debug2.log(`\u{1F3AF} Reaction used for casting (one per round limit)`);
      } else {
        debug2.log(`\u26A0\uFE0F Reaction indicator not found or already used this round`);
      }
    } else {
      if (actionIndicator && actionIndicator.dataset.used !== "true") {
        actionIndicator.dataset.used = "true";
        debug2.log(`\u{1F3AF} Action used for casting`);
      } else {
        debug2.log(`\u26A0\uFE0F Action indicator not found or already used`);
      }
    }
    updateActionEconomyAvailability();
  }
  function postActionToChat(actionLabel, state) {
    const emoji = state === "used" ? "\u274C" : "\u2705";
    const message = `${emoji} ${characterData.name} ${state === "used" ? "uses" : "restores"} ${actionLabel}`;
    postToChatIfOpener(message);
    postActionEconomyToDiscord();
  }
  function getActionEconomyState() {
    const actionIndicator = document.getElementById("action-indicator");
    const bonusActionIndicator = document.getElementById("bonus-action-indicator");
    const movementIndicator = document.getElementById("movement-indicator");
    const reactionIndicator = document.getElementById("reaction-indicator");
    return {
      action: actionIndicator?.dataset.used === "true",
      bonus: bonusActionIndicator?.dataset.used === "true",
      movement: movementIndicator?.dataset.used === "true",
      reaction: reactionIndicator?.dataset.used === "true"
    };
  }
  function postActionEconomyToDiscord() {
    if (!characterData || !characterData.name)
      return;
    const actions = getActionEconomyState();
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        action: "postToDiscordFromPopup",
        payload: {
          type: "actionUpdate",
          characterName: characterData.name,
          actions
        }
      }, "*");
      debug2.log(`\u{1F3AE} Discord: Posted action economy update for ${characterData.name}`);
    }
  }
  function postToChatIfOpener(message) {
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({
          action: "postChatMessageFromPopup",
          message
        }, "*");
        debug2.log(`\u{1F4E4} Posted to chat: ${message}`);
      }
    } catch (error) {
      debug2.warn("\u26A0\uFE0F Could not post to chat:", error);
    }
  }
  var POSITIVE_EFFECTS = [
    {
      name: "Bless",
      icon: "\u2728",
      color: "#f39c12",
      description: "+1d4 to attack rolls and saving throws",
      modifier: { attack: "1d4", save: "1d4" },
      autoApply: true
    },
    {
      name: "Guidance",
      icon: "\u{1F64F}",
      color: "#3498db",
      description: "+1d4 to one ability check",
      modifier: { skill: "1d4" },
      autoApply: false
      // User choice required
    },
    {
      name: "Bardic Inspiration (d6)",
      icon: "\u{1F3B5}",
      color: "#9b59b6",
      description: "Bard levels 1-4: +d6 to ability check, attack, or save",
      modifier: { attack: "d6", skill: "d6", save: "d6" },
      autoApply: false
    },
    {
      name: "Bardic Inspiration (d8)",
      icon: "\u{1F3B5}",
      color: "#9b59b6",
      description: "Bard levels 5-9: +d8 to ability check, attack, or save",
      modifier: { attack: "d8", skill: "d8", save: "d8" },
      autoApply: false
    },
    {
      name: "Bardic Inspiration (d10)",
      icon: "\u{1F3B5}",
      color: "#9b59b6",
      description: "Bard levels 10-14: +d10 to ability check, attack, or save",
      modifier: { attack: "d10", skill: "d10", save: "d10" },
      autoApply: false
    },
    {
      name: "Bardic Inspiration (d12)",
      icon: "\u{1F3B5}",
      color: "#9b59b6",
      description: "Bard levels 15-20: +d12 to ability check, attack, or save",
      modifier: { attack: "d12", skill: "d12", save: "d12" },
      autoApply: false
    },
    {
      name: "Haste",
      icon: "\u26A1",
      color: "#3498db",
      description: "+2 AC, advantage on DEX saves, extra action",
      modifier: { ac: 2, dexSave: "advantage" },
      autoApply: true
    },
    {
      name: "Enlarge",
      icon: "\u2B06\uFE0F",
      color: "#27ae60",
      description: "+1d4 weapon damage, advantage on STR checks/saves",
      modifier: { damage: "1d4", strCheck: "advantage", strSave: "advantage" },
      autoApply: true
    },
    {
      name: "Invisibility",
      icon: "\u{1F47B}",
      color: "#ecf0f1",
      description: "Advantage on attack rolls, enemies have disadvantage",
      modifier: { attack: "advantage" },
      autoApply: true
    },
    {
      name: "Shield of Faith",
      icon: "\u{1F6E1}\uFE0F",
      color: "#f39c12",
      description: "+2 AC",
      modifier: { ac: 2 },
      autoApply: true
    },
    {
      name: "Heroism",
      icon: "\u{1F9B8}",
      color: "#e67e22",
      description: "Immune to frightened, temp HP each turn",
      modifier: { frightened: "immune" },
      autoApply: true
    },
    {
      name: "Enhance Ability",
      icon: "\u{1F4AA}",
      color: "#27ae60",
      description: "Advantage on ability checks with chosen ability",
      modifier: { skill: "advantage" },
      autoApply: false
    },
    {
      name: "Aid",
      icon: "\u2764\uFE0F",
      color: "#e74c3c",
      description: "Max HP increased by 5",
      modifier: { maxHp: 5 },
      autoApply: true
    },
    {
      name: "True Strike",
      icon: "\u{1F3AF}",
      color: "#3498db",
      description: "Advantage on next attack roll",
      modifier: { attack: "advantage" },
      autoApply: true
    },
    {
      name: "Faerie Fire",
      icon: "\u2728",
      color: "#9b59b6",
      description: "Attackers have advantage against target",
      modifier: {},
      autoApply: false
    }
  ];
  var NEGATIVE_EFFECTS = [
    {
      name: "Bane",
      icon: "\u{1F480}",
      color: "#e74c3c",
      description: "-1d4 to attack rolls and saving throws",
      modifier: { attack: "-1d4", save: "-1d4" },
      autoApply: true
    },
    {
      name: "Poisoned",
      icon: "\u2620\uFE0F",
      color: "#27ae60",
      description: "Disadvantage on attack rolls and ability checks",
      modifier: { attack: "disadvantage", skill: "disadvantage" },
      autoApply: true
    },
    {
      name: "Frightened",
      icon: "\u{1F631}",
      color: "#e67e22",
      description: "Disadvantage on ability checks and attack rolls",
      modifier: { attack: "disadvantage", skill: "disadvantage" },
      autoApply: true
    },
    {
      name: "Stunned",
      icon: "\u{1F4AB}",
      color: "#9b59b6",
      description: "Incapacitated, auto-fail STR/DEX saves, attackers have advantage",
      modifier: { strSave: "fail", dexSave: "fail" },
      autoApply: true
    },
    {
      name: "Paralyzed",
      icon: "\u{1F9CA}",
      color: "#34495e",
      description: "Incapacitated, auto-fail STR/DEX saves, attacks within 5ft are crits",
      modifier: { strSave: "fail", dexSave: "fail" },
      autoApply: true
    },
    {
      name: "Restrained",
      icon: "\u26D3\uFE0F",
      color: "#7f8c8d",
      description: "Disadvantage on DEX saves and attack rolls",
      modifier: { attack: "disadvantage", dexSave: "disadvantage" },
      autoApply: true
    },
    {
      name: "Blinded",
      icon: "\u{1F648}",
      color: "#34495e",
      description: "Auto-fail sight checks, disadvantage on attacks",
      modifier: { attack: "disadvantage", perception: "disadvantage" },
      autoApply: true
    },
    {
      name: "Deafened",
      icon: "\u{1F649}",
      color: "#7f8c8d",
      description: "Auto-fail hearing checks",
      modifier: { perception: "disadvantage" },
      autoApply: true
    },
    {
      name: "Charmed",
      icon: "\u{1F496}",
      color: "#e91e63",
      description: "Cannot attack charmer, charmer has advantage on social checks",
      modifier: {},
      autoApply: false
    },
    {
      name: "Grappled",
      icon: "\u{1F93C}",
      color: "#f39c12",
      description: "Speed becomes 0",
      modifier: { speed: 0 },
      autoApply: true
    },
    {
      name: "Prone",
      icon: "\u2B07\uFE0F",
      color: "#95a5a6",
      description: "Disadvantage on attack rolls, melee attacks against you have advantage",
      modifier: { attack: "disadvantage" },
      autoApply: true
    },
    {
      name: "Incapacitated",
      icon: "\u{1F635}",
      color: "#c0392b",
      description: "Cannot take actions or reactions",
      modifier: {},
      autoApply: false
    },
    {
      name: "Unconscious",
      icon: "\u{1F634}",
      color: "#34495e",
      description: "Incapacitated, drop everything, auto-fail STR/DEX saves",
      modifier: { strSave: "fail", dexSave: "fail" },
      autoApply: true
    },
    {
      name: "Petrified",
      icon: "\u{1F5FF}",
      color: "#95a5a6",
      description: "Incapacitated, auto-fail STR/DEX saves, resistance to all damage",
      modifier: { strSave: "fail", dexSave: "fail" },
      autoApply: true
    },
    {
      name: "Slowed",
      icon: "\u{1F40C}",
      color: "#95a5a6",
      description: "Speed halved, -2 AC and DEX saves, no reactions",
      modifier: { ac: -2, dexSave: "-2" },
      autoApply: true
    },
    {
      name: "Hexed",
      icon: "\u{1F52E}",
      color: "#9b59b6",
      description: "Disadvantage on ability checks with chosen ability, extra damage to caster",
      modifier: { skill: "disadvantage" },
      autoApply: false
    },
    {
      name: "Cursed",
      icon: "\u{1F608}",
      color: "#c0392b",
      description: "Disadvantage on attacks and saves against caster",
      modifier: { attack: "disadvantage", save: "disadvantage" },
      autoApply: true
    }
  ];
  var activeConditions = [];
  var activeBuffs = [];
  function initConditionsManager() {
    const addConditionBtn = document.getElementById("add-condition-btn");
    if (addConditionBtn) {
      addConditionBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        showEffectsModal();
      });
    }
    debug2.log("\u2705 Effects manager initialized (buffs + debuffs)");
  }
  function showEffectsModal() {
    const modal = document.createElement("div");
    modal.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;";
    const modalContent = document.createElement("div");
    modalContent.style.cssText = "background: white; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); width: 90%; max-width: 600px; max-height: 80vh; display: flex; flex-direction: column; overflow: hidden;";
    const header = document.createElement("div");
    header.style.cssText = "padding: 20px; border-bottom: 2px solid #ecf0f1; background: #f8f9fa;";
    header.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h3 style="margin: 0; color: #2c3e50;">\u{1F3AD} Effects & Conditions</h3>
      <button id="effects-modal-close" style="background: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold;">\u2715</button>
    </div>
  `;
    const tabNav = document.createElement("div");
    tabNav.style.cssText = "display: flex; background: #ecf0f1; border-bottom: 2px solid #bdc3c7;";
    tabNav.innerHTML = `
    <button class="effects-tab-btn" data-tab="buffs" style="flex: 1; padding: 15px; background: white; border: none; border-bottom: 3px solid #27ae60; cursor: pointer; font-weight: bold; font-size: 1em; color: #27ae60; transition: all 0.2s;">\u2728 Buffs</button>
    <button class="effects-tab-btn" data-tab="debuffs" style="flex: 1; padding: 15px; background: transparent; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-weight: bold; font-size: 1em; color: #7f8c8d; transition: all 0.2s;">\u{1F480} Debuffs</button>
  `;
    const tabContent = document.createElement("div");
    tabContent.style.cssText = "padding: 20px; overflow-y: auto; flex: 1;";
    const buffsTab = document.createElement("div");
    buffsTab.className = "effects-tab-content";
    buffsTab.dataset.tab = "buffs";
    buffsTab.style.display = "block";
    buffsTab.innerHTML = POSITIVE_EFFECTS.map((effect) => `
    <div class="effect-option" data-effect="${effect.name}" data-type="positive" style="padding: 12px; margin-bottom: 10px; border: 2px solid ${effect.color}40; border-radius: 8px; cursor: pointer; transition: all 0.2s; background: white;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span class="effect-icon" style="font-size: 1.5em;">${effect.icon}</span>
        <div style="flex: 1;">
          <div class="effect-name" style="font-weight: bold; color: #2c3e50; margin-bottom: 4px;">${effect.name}</div>
          <div class="effect-description" style="font-size: 0.85em; color: #7f8c8d;">${effect.description}</div>
        </div>
      </div>
    </div>
  `).join("");
    const debuffsTab = document.createElement("div");
    debuffsTab.className = "effects-tab-content";
    debuffsTab.dataset.tab = "debuffs";
    debuffsTab.style.display = "none";
    debuffsTab.innerHTML = NEGATIVE_EFFECTS.map((effect) => `
    <div class="effect-option" data-effect="${effect.name}" data-type="negative" style="padding: 12px; margin-bottom: 10px; border: 2px solid ${effect.color}40; border-radius: 8px; cursor: pointer; transition: all 0.2s; background: white;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span class="effect-icon" style="font-size: 1.5em;">${effect.icon}</span>
        <div style="flex: 1;">
          <div class="effect-name" style="font-weight: bold; color: #2c3e50; margin-bottom: 4px;">${effect.name}</div>
          <div class="effect-description" style="font-size: 0.85em; color: #7f8c8d;">${effect.description}</div>
        </div>
      </div>
    </div>
  `).join("");
    tabContent.appendChild(buffsTab);
    tabContent.appendChild(debuffsTab);
    modalContent.appendChild(header);
    modalContent.appendChild(tabNav);
    modalContent.appendChild(tabContent);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    const tabButtons = tabNav.querySelectorAll(".effects-tab-btn");
    const tabContents = modalContent.querySelectorAll(".effects-tab-content");
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetTab = btn.dataset.tab;
        tabButtons.forEach((b) => {
          if (b.dataset.tab === targetTab) {
            b.style.background = "white";
            b.style.color = targetTab === "buffs" ? "#27ae60" : "#e74c3c";
            b.style.borderBottom = `3px solid ${targetTab === "buffs" ? "#27ae60" : "#e74c3c"}`;
          } else {
            b.style.background = "transparent";
            b.style.color = "#7f8c8d";
            b.style.borderBottom = "3px solid transparent";
          }
        });
        tabContents.forEach((content) => {
          content.style.display = content.dataset.tab === targetTab ? "block" : "none";
        });
      });
    });
    modalContent.querySelectorAll(".effect-option").forEach((option) => {
      option.addEventListener("mouseenter", () => {
        option.style.transform = "translateX(5px)";
        option.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
      });
      option.addEventListener("mouseleave", () => {
        option.style.transform = "translateX(0)";
        option.style.boxShadow = "none";
      });
    });
    modalContent.querySelectorAll(".effect-option").forEach((option) => {
      option.addEventListener("click", () => {
        const effectName = option.dataset.effect;
        const type = option.dataset.type === "positive" ? "positive" : "negative";
        addEffect(effectName, type);
        modal.remove();
      });
    });
    const closeBtn = modalContent.querySelector("#effects-modal-close");
    closeBtn.addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  function addEffect(effectName, type) {
    const effectsList = type === "positive" ? POSITIVE_EFFECTS : NEGATIVE_EFFECTS;
    const activeList = type === "positive" ? activeBuffs : activeConditions;
    if (activeList.includes(effectName)) {
      showNotification(`\u26A0\uFE0F ${effectName} already active`);
      return;
    }
    const effect = effectsList.find((e) => e.name === effectName);
    activeList.push(effectName);
    if (type === "positive") {
      activeBuffs = activeList;
    } else {
      activeConditions = activeList;
    }
    updateEffectsDisplay();
    showNotification(`${effect.icon} ${effectName} applied!`);
    debug2.log(`\u2705 Effect added: ${effectName} (${type})`);
    const message = type === "positive" ? `${effect.icon} ${characterData.name} gains ${effectName}!` : `${effect.icon} ${characterData.name} is now ${effectName}!`;
    postToChatIfOpener(message);
    if (!characterData.activeEffects) {
      characterData.activeEffects = { buffs: [], debuffs: [] };
    }
    if (type === "positive") {
      characterData.activeEffects.buffs = activeBuffs;
    } else {
      characterData.activeEffects.debuffs = activeConditions;
    }
    saveCharacterData();
  }
  function removeEffect(effectName, type) {
    const effectsList = type === "positive" ? POSITIVE_EFFECTS : NEGATIVE_EFFECTS;
    const effect = effectsList.find((e) => e.name === effectName);
    if (type === "positive") {
      activeBuffs = activeBuffs.filter((e) => e !== effectName);
    } else {
      activeConditions = activeConditions.filter((e) => e !== effectName);
    }
    updateEffectsDisplay();
    showNotification(`\u2705 ${effectName} removed`);
    debug2.log(`\u{1F5D1}\uFE0F Effect removed: ${effectName} (${type})`);
    const message = type === "positive" ? `\u2705 ${characterData.name} loses ${effectName}` : `\u2705 ${characterData.name} is no longer ${effectName}`;
    postToChatIfOpener(message);
    if (!characterData.activeEffects) {
      characterData.activeEffects = { buffs: [], debuffs: [] };
    }
    if (type === "positive") {
      characterData.activeEffects.buffs = activeBuffs;
    } else {
      characterData.activeEffects.debuffs = activeConditions;
    }
    saveCharacterData();
  }
  function addCondition(conditionName) {
    addEffect(conditionName, "negative");
  }
  function removeCondition(conditionName) {
    removeEffect(conditionName, "negative");
  }
  function updateEffectsDisplay() {
    const container = document.getElementById("active-conditions");
    if (!container)
      return;
    let html = "";
    if (activeBuffs.length > 0) {
      html += '<div style="margin-bottom: 15px;">';
      html += '<div style="font-size: 0.85em; font-weight: bold; color: #27ae60; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;"><span>\u2728</span> BUFFS</div>';
      html += activeBuffs.map((effectName) => {
        const effect = POSITIVE_EFFECTS.find((e) => e.name === effectName);
        return `
        <div class="effect-badge" data-effect="${effectName}" data-type="positive" title="${effect.description} - Click to remove" style="background: ${effect.color}20; border: 2px solid ${effect.color}; cursor: pointer; padding: 8px 12px; border-radius: 6px; margin-bottom: 8px; transition: all 0.2s;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="effect-badge-icon" style="font-size: 1.2em;">${effect.icon}</span>
            <div style="flex: 1;">
              <div style="font-weight: bold; color: var(--text-primary);">${effect.name}</div>
              <div style="font-size: 0.75em; color: var(--text-secondary); margin-top: 2px;">${effect.description}</div>
            </div>
            <span class="effect-badge-remove" style="font-weight: bold; opacity: 0.7; color: #e74c3c;">\u2715</span>
          </div>
        </div>
      `;
      }).join("");
      html += "</div>";
    }
    if (activeConditions.length > 0) {
      html += '<div style="margin-bottom: 15px;">';
      html += '<div style="font-size: 0.85em; font-weight: bold; color: #e74c3c; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;"><span>\u{1F480}</span> DEBUFFS</div>';
      html += activeConditions.map((effectName) => {
        const effect = NEGATIVE_EFFECTS.find((e) => e.name === effectName);
        return `
        <div class="effect-badge" data-effect="${effectName}" data-type="negative" title="${effect.description} - Click to remove" style="background: ${effect.color}20; border: 2px solid ${effect.color}; cursor: pointer; padding: 8px 12px; border-radius: 6px; margin-bottom: 8px; transition: all 0.2s;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="effect-badge-icon" style="font-size: 1.2em;">${effect.icon}</span>
            <div style="flex: 1;">
              <div style="font-weight: bold; color: var(--text-primary);">${effect.name}</div>
              <div style="font-size: 0.75em; color: var(--text-secondary); margin-top: 2px;">${effect.description}</div>
            </div>
            <span class="effect-badge-remove" style="font-weight: bold; opacity: 0.7; color: #e74c3c;">\u2715</span>
          </div>
        </div>
      `;
      }).join("");
      html += "</div>";
    }
    if (activeBuffs.length === 0 && activeConditions.length === 0) {
      html = '<div style="text-align: center; color: #888; padding: 15px; font-size: 0.9em;">No active effects</div>';
    }
    container.innerHTML = html;
    const acElement = document.getElementById("char-ac");
    if (acElement) {
      acElement.textContent = calculateTotalAC();
    }
    container.querySelectorAll(".effect-badge").forEach((badge) => {
      const effectName = badge.dataset.effect;
      const type = badge.dataset.type;
      badge.addEventListener("mouseenter", () => {
        badge.style.transform = "translateX(3px)";
        badge.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
      });
      badge.addEventListener("mouseleave", () => {
        badge.style.transform = "translateX(0)";
        badge.style.boxShadow = "none";
      });
      badge.addEventListener("click", () => {
        removeEffect(effectName, type);
      });
    });
  }
  function updateConditionsDisplay() {
    updateEffectsDisplay();
  }
  var concentratingSpell = null;
  function initConcentrationTracker() {
    const dropConcentrationBtn = document.getElementById("drop-concentration-btn");
    if (dropConcentrationBtn) {
      dropConcentrationBtn.addEventListener("click", () => {
        dropConcentration();
      });
    }
    debug2.log("\u2705 Concentration tracker initialized");
  }
  function setConcentration(spellName) {
    concentratingSpell = spellName;
    if (characterData) {
      characterData.concentration = spellName;
      saveCharacterData();
    }
    updateConcentrationDisplay();
    showNotification(`\u{1F9E0} Concentrating on: ${spellName}`);
    debug2.log(`\u{1F9E0} Concentration set: ${spellName}`);
  }
  function dropConcentration() {
    if (!concentratingSpell)
      return;
    const spellName = concentratingSpell;
    concentratingSpell = null;
    if (characterData) {
      characterData.concentration = null;
      saveCharacterData();
    }
    updateConcentrationDisplay();
    showNotification(`\u2705 Dropped concentration on ${spellName}`);
    debug2.log(`\u{1F5D1}\uFE0F Concentration dropped: ${spellName}`);
  }
  function updateConcentrationDisplay() {
    const concentrationIndicator = document.getElementById("concentration-indicator");
    const concentrationSpell = document.getElementById("concentration-spell");
    if (!concentrationIndicator)
      return;
    if (concentratingSpell) {
      concentrationIndicator.style.display = "flex";
      if (concentrationSpell) {
        concentrationSpell.textContent = concentratingSpell;
      }
    } else {
      concentrationIndicator.style.display = "none";
    }
  }
  function initGMMode() {
    const gmModeToggle = document.getElementById("gm-mode-toggle");
    if (gmModeToggle) {
      gmModeToggle.addEventListener("click", () => {
        const isActive = gmModeToggle.classList.contains("active");
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({
            action: "toggleGMMode",
            enabled: !isActive
          }, "*");
          debug2.log(`\u{1F451} GM Mode ${!isActive ? "enabled" : "disabled"}`);
        } else {
          browserAPI.runtime.sendMessage({
            action: "toggleGMMode",
            enabled: !isActive
          });
        }
        gmModeToggle.classList.toggle("active");
        showNotification(isActive ? "\u{1F451} GM Mode disabled" : "\u{1F451} GM Mode enabled!");
      });
      debug2.log("\u2705 GM Mode toggle initialized");
    }
  }
  function initShowToGM() {
    const showToGMBtn = document.getElementById("show-to-gm-btn");
    if (showToGMBtn) {
      showToGMBtn.addEventListener("click", () => {
        if (!characterData) {
          showNotification("\u26A0\uFE0F No character data to share", "warning");
          return;
        }
        try {
          const broadcastData = {
            type: "ROLLCLOUD_CHARACTER_BROADCAST",
            character: characterData,
            // Include ALL character data for complete sheet
            fullSheet: {
              ...characterData,
              // Ensure all sections are included
              attributes: characterData.attributes || {},
              skills: characterData.skills || [],
              savingThrows: characterData.savingThrows || {},
              actions: characterData.actions || [],
              spells: characterData.spells || [],
              features: characterData.features || [],
              equipment: characterData.equipment || [],
              inventory: characterData.inventory || {},
              resources: characterData.resources || {},
              spellSlots: characterData.spellSlots || {},
              companions: characterData.companions || [],
              conditions: characterData.conditions || [],
              notes: characterData.notes || "",
              background: characterData.background || "",
              personality: characterData.personality || {},
              proficiencies: characterData.proficiencies || [],
              languages: characterData.languages || [],
              // Add simplified properties for popout compatibility
              hp: characterData.hitPoints?.current || characterData.hp || 0,
              maxHp: characterData.hitPoints?.max || characterData.maxHp || 0,
              ac: characterData.armorClass || characterData.ac || 10,
              initiative: characterData.initiative || 0,
              passivePerception: characterData.passivePerception || 10,
              proficiency: characterData.proficiencyBonus || characterData.proficiency || 0,
              speed: characterData.speed || "30 ft"
            },
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          };
          const jsonString = JSON.stringify(broadcastData);
          const encodedData = btoa(unescape(encodeURIComponent(jsonString)));
          const broadcastMessage = `\u{1F451}[ROLLCLOUD:CHARACTER:${encodedData}]\u{1F451}`;
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({
              action: "postChatMessageFromPopup",
              message: broadcastMessage
            }, "*");
            showNotification(`\u{1F451} ${characterData.name} shared with GM!`, "success");
            debug2.log("\u{1F451} Character broadcast sent to GM:", characterData.name);
          } else {
            browserAPI.runtime.sendMessage({
              action: "postChatMessageFromPopup",
              message: broadcastMessage
            }).then(() => {
              showNotification(`\u{1F451} ${characterData.name} shared with GM!`, "success");
              debug2.log("\u{1F451} Character broadcast sent via background script:", characterData.name);
            }).catch((err) => {
              debug2.error("\u274C Failed to send character broadcast:", err);
              showNotification("\u274C Failed to share with GM", "error");
            });
          }
        } catch (error) {
          debug2.error("\u274C Error creating character broadcast:", error);
          showNotification("\u274C Failed to prepare character data", "error");
        }
      });
      debug2.log("\u2705 Show to GM button initialized in settings");
    } else {
      debug2.warn("\u26A0\uFE0F Show to GM button not found in settings");
    }
  }
  function initManualSyncButton() {
    const syncSection = document.getElementById("dicecloud-sync-section");
    const syncButton = document.getElementById("manual-sync-btn");
    const syncStatus = document.getElementById("sync-status");
    browserAPI.runtime.sendMessage({ action: "getManifest" }).then((response) => {
      if (response && response.success && response.manifest && response.manifest.name && response.manifest.name.includes("EXPERIMENTAL")) {
        if (syncSection) {
          syncSection.style.display = "block";
          debug2.log("\u{1F9EA} DiceCloud sync section shown (experimental build)");
        }
      }
    }).catch((err) => {
      debug2.log("\u{1F4E6} Not experimental build, hiding sync section");
    });
    if (syncButton) {
      syncButton.addEventListener("click", async () => {
        try {
          debug2.log("\u{1F504} Manual sync button clicked");
          syncButton.disabled = true;
          syncButton.textContent = "\u{1F504} Syncing...";
          if (syncStatus) {
            syncStatus.style.display = "block";
            syncStatus.style.background = "var(--accent-info)";
            syncStatus.style.color = "white";
            syncStatus.textContent = "\u23F3 Syncing to DiceCloud...";
          }
          if (!characterData) {
            throw new Error("No character data available");
          }
          const channelDivinityResource = characterData.resources?.find(
            (r) => r.name === "Channel Divinity" || r.variableName === "channelDivinityCleric" || r.variableName === "channelDivinityPaladin" || r.variableName === "channelDivinity"
          );
          const syncMessage = {
            type: "characterDataUpdate",
            characterData: {
              name: characterData.name,
              hp: characterData.hitPoints.current,
              tempHp: characterData.temporaryHP || 0,
              maxHp: characterData.hitPoints.max,
              spellSlots: characterData.spellSlots || {},
              channelDivinity: channelDivinityResource ? {
                current: channelDivinityResource.current,
                max: channelDivinityResource.max
              } : void 0,
              resources: characterData.resources || [],
              actions: characterData.actions || [],
              deathSaves: characterData.deathSaves,
              inspiration: characterData.inspiration,
              lastRoll: characterData.lastRoll
            }
          };
          debug2.log("\u{1F504} Sending manual sync message:", syncMessage);
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(syncMessage, "*");
            debug2.log("\u2705 Sync message sent via opener");
          } else {
            window.postMessage(syncMessage, "*");
            debug2.log("\u2705 Sync message sent to self");
          }
          await new Promise((resolve) => setTimeout(resolve, 1e3));
          if (syncStatus) {
            syncStatus.style.background = "var(--accent-success)";
            syncStatus.textContent = "\u2705 Synced successfully!";
          }
          showNotification("\u2705 Character data synced to DiceCloud!", "success");
          debug2.log("\u2705 Manual sync completed");
          setTimeout(() => {
            syncButton.disabled = false;
            syncButton.textContent = "\u{1F504} Sync to DiceCloud Now";
            if (syncStatus) {
              syncStatus.style.display = "none";
            }
          }, 2e3);
        } catch (error) {
          debug2.error("\u274C Manual sync failed:", error);
          if (syncStatus) {
            syncStatus.style.display = "block";
            syncStatus.style.background = "var(--accent-danger)";
            syncStatus.style.color = "white";
            syncStatus.textContent = "\u274C Sync failed: " + error.message;
          }
          showNotification("\u274C Sync failed: " + error.message, "error");
          syncButton.disabled = false;
          syncButton.textContent = "\u{1F504} Sync to DiceCloud Now";
        }
      });
      debug2.log("\u2705 Manual sync button initialized");
    } else {
      debug2.warn("\u26A0\uFE0F Manual sync button not found in settings");
    }
  }
  window.addEventListener("message", (event) => {
    if (event.data && event.data.action === "activateTurn") {
      debug2.log("\u{1F3AF} Your turn! Activating action economy...");
      debug2.log("\u{1F3AF} Received activateTurn event:", event.data);
      activateTurn();
      const actionIndicator = document.getElementById("action-indicator");
      const bonusActionIndicator = document.getElementById("bonus-action-indicator");
      const movementIndicator = document.getElementById("movement-indicator");
      [actionIndicator, bonusActionIndicator, movementIndicator].forEach((indicator) => {
        if (indicator) {
          indicator.dataset.used = "false";
          debug2.log(`\u{1F504} Reset ${indicator.id} to unused`);
        }
      });
      debug2.log("\u{1F504} Turn reset: Action, Bonus Action, Movement restored (automatic)");
      showNotification("\u2694\uFE0F Your turn!", "success");
    } else if (event.data && event.data.action === "deactivateTurn") {
      debug2.log("\u23F8\uFE0F Turn ended. Deactivating action economy...");
      debug2.log("\u23F8\uFE0F Received deactivateTurn event:", event.data);
      deactivateTurn();
    } else if (event.data && event.data.action === "rollResult") {
      debug2.log("\u{1F9EC} Received rollResult message:", event.data);
      if (event.data.checkRacialTraits && (activeRacialTraits.length > 0 || activeFeatTraits.length > 0)) {
        const { rollResult, baseRoll, rollType, rollName } = event.data;
        debug2.log(`\u{1F9EC} Checking racial traits for roll: ${baseRoll} (${rollType}) - ${rollName}`);
        debug2.log(`\u{1F9EC} Active racial traits count: ${activeRacialTraits.length}`);
        debug2.log(`\u{1F396}\uFE0F Active feat traits count: ${activeFeatTraits.length}`);
        debug2.log(`\u{1F9EC} Roll details - Total: ${rollResult}, Base: ${baseRoll}`);
        const racialTraitTriggered = checkRacialTraits(baseRoll, rollType, rollName);
        const triggeredRacialTraits = [];
        const featTraitTriggered = checkFeatTraits(baseRoll, rollType, rollName);
        const triggeredFeatTraits = [];
        if (racialTraitTriggered) {
          triggeredRacialTraits.push(...activeRacialTraits.filter((trait) => {
            const testResult = trait.onRoll(baseRoll, rollType, rollName);
            return testResult === true;
          }));
          debug2.log(`\u{1F9EC} Racial trait triggered for roll: ${baseRoll}`);
        }
        if (featTraitTriggered) {
          triggeredFeatTraits.push(...activeFeatTraits.filter((trait) => {
            const testResult = trait.onRoll(baseRoll, rollType, rollName);
            return testResult === true;
          }));
          debug2.log(`\u{1F396}\uFE0F Feat trait triggered for roll: ${baseRoll}`);
        }
        if (triggeredRacialTraits.length > 0 || triggeredFeatTraits.length > 0) {
          const allTriggeredTraits = [...triggeredRacialTraits, ...triggeredFeatTraits];
          if (allTriggeredTraits.length === 1) {
            const trait = allTriggeredTraits[0];
            if (trait.name === "Halfling Luck") {
              showHalflingLuckPopup({
                rollResult: baseRoll,
                baseRoll,
                rollType,
                rollName
              });
            } else if (trait.name === "Lucky") {
              const luckyResource = getLuckyResource();
              showLuckyPopup({
                rollResult: baseRoll,
                baseRoll,
                rollType,
                rollName,
                luckPointsRemaining: luckyResource?.current || 0
              });
            }
          } else {
            showTraitChoicePopup({
              rollResult: baseRoll,
              baseRoll,
              rollType,
              rollName,
              racialTraits: triggeredRacialTraits,
              featTraits: triggeredFeatTraits
            });
          }
        }
        if (!racialTraitTriggered && !featTraitTriggered) {
          debug2.log(`\u{1F9EC}\u{1F396}\uFE0F No traits triggered for roll: ${baseRoll}`);
        }
      } else {
        debug2.log(`\u{1F9EC} Skipping traits check - checkRacialTraits: ${event.data.checkRacialTraits}, racialTraits: ${activeRacialTraits.length}, featTraits: ${activeFeatTraits.length}`);
      }
    } else if (event.data && event.data.action === "showHalflingLuckPopup") {
      showHalflingLuckPopup(event.data.rollData);
    }
  });
  setTimeout(() => {
    initCombatMechanics();
  }, 100);
  var characterCache = /* @__PURE__ */ new Map();
  var activeRacialTraits = [];
  var activeFeatTraits = [];
  function initRacialTraits() {
    debug2.log("\u{1F9EC} Initializing racial traits...");
    debug2.log("\u{1F9EC} Character data:", characterData);
    debug2.log("\u{1F9EC} Character race:", characterData?.race);
    activeRacialTraits = [];
    if (!characterData || !characterData.race) {
      debug2.log("\u{1F9EC} No race data available");
      return;
    }
    const race = characterData.race.toLowerCase();
    if (race.includes("halfling")) {
      debug2.log("\u{1F9EC} Halfling detected, adding Halfling Luck trait");
      activeRacialTraits.push(HalflingLuck);
    }
    if (characterData.features && characterData.features.some(
      (f) => f.name && f.name.toLowerCase().includes("elven accuracy")
    )) {
      debug2.log("\u{1F9DD} Elven Accuracy feat detected");
      activeRacialTraits.push(ElvenAccuracy);
    }
    if (race.includes("dwarf")) {
      debug2.log("\u26CF\uFE0F Dwarf detected, adding Dwarven Resilience trait");
      activeRacialTraits.push(DwarvenResilience);
    }
    if (race.includes("gnome")) {
      debug2.log("\u{1F3A9} Gnome detected, adding Gnome Cunning trait");
      activeRacialTraits.push(GnomeCunning);
    }
    debug2.log(`\u{1F9EC} Initialized ${activeRacialTraits.length} racial traits`);
  }
  function initFeatTraits() {
    debug2.log("\u{1F396}\uFE0F Initializing feat traits...");
    debug2.log("\u{1F396}\uFE0F Character features:", characterData?.features);
    activeFeatTraits = [];
    if (!characterData || !characterData.features) {
      debug2.log("\u{1F396}\uFE0F No features data available");
      return;
    }
    debug2.log("\u{1F396}\uFE0F Lucky feat will be available as an action button");
    debug2.log(`\u{1F396}\uFE0F Initialized ${activeFeatTraits.length} feat traits`);
  }
  function initClassFeatures() {
    debug2.log("\u2694\uFE0F Initializing class features...");
    debug2.log("\u2694\uFE0F Character class:", characterData?.class);
    debug2.log("\u2694\uFE0F Character level:", characterData?.level);
    if (!characterData) {
      debug2.log("\u2694\uFE0F No character data available");
      return;
    }
    const characterClass = (characterData.class || "").toLowerCase();
    const level = characterData.level || 1;
    if (characterClass.includes("rogue") && level >= 11) {
      debug2.log("\u{1F3AF} Rogue 11+ detected, adding Reliable Talent");
      activeFeatTraits.push(ReliableTalent);
    }
    if (characterClass.includes("bard") && level >= 1) {
      debug2.log("\u{1F3B5} Bard detected, adding Bardic Inspiration");
      activeFeatTraits.push(BardicInspiration);
    }
    if (characterClass.includes("bard") && level >= 2) {
      debug2.log("\u{1F3B5} Bard detected, adding Jack of All Trades");
      activeFeatTraits.push(JackOfAllTrades);
    }
    if (characterClass.includes("barbarian")) {
      debug2.log("\u{1F621} Barbarian detected, adding Rage Damage Bonus");
      activeFeatTraits.push(RageDamageBonus);
    }
    if (characterClass.includes("barbarian") && level >= 9) {
      debug2.log("\u{1F4A5} Barbarian 9+ detected, adding Brutal Critical");
      activeFeatTraits.push(BrutalCritical);
    }
    if (characterClass.includes("wizard") && level >= 2) {
      const isDivination = characterData.features && characterData.features.some(
        (f) => f.name && (f.name.toLowerCase().includes("divination") || f.name.toLowerCase().includes("portent"))
      );
      if (isDivination) {
        debug2.log("\u{1F52E} Divination Wizard detected, adding Portent");
        activeFeatTraits.push(PortentDice);
        PortentDice.rollPortentDice();
      }
    }
    if (characterClass.includes("sorcerer")) {
      const isWildMagic = characterData.features && characterData.features.some(
        (f) => f.name && f.name.toLowerCase().includes("wild magic")
      );
      if (isWildMagic) {
        debug2.log("\u{1F300} Wild Magic Sorcerer detected, adding Wild Magic Surge");
        activeFeatTraits.push(WildMagicSurge);
      }
    }
    debug2.log(`\u2694\uFE0F Initialized ${activeFeatTraits.length} class feature traits`);
  }
  function checkRacialTraits(rollResult, rollType, rollName) {
    debug2.log(`\u{1F9EC} Checking racial traits for roll: ${rollResult} (${rollType}) - ${rollName}`);
    debug2.log(`\u{1F9EC} Active racial traits count: ${activeRacialTraits.length}`);
    let traitTriggered = false;
    for (const trait of activeRacialTraits) {
      if (trait.onRoll && typeof trait.onRoll === "function") {
        const result2 = trait.onRoll(rollResult, rollType, rollName);
        if (result2) {
          traitTriggered = true;
          debug2.log(`\u{1F9EC} ${trait.name} triggered!`);
        }
      }
    }
    return traitTriggered;
  }
  function checkFeatTraits(rollResult, rollType, rollName) {
    debug2.log(`\u{1F396}\uFE0F Checking feat traits for roll: ${rollResult} (${rollType}) - ${rollName}`);
    debug2.log(`\u{1F396}\uFE0F Active feat traits count: ${activeFeatTraits.length}`);
    let traitTriggered = false;
    for (const trait of activeFeatTraits) {
      if (trait.onRoll && typeof trait.onRoll === "function") {
        const result2 = trait.onRoll(rollResult, rollType, rollName);
        if (result2) {
          traitTriggered = true;
          debug2.log(`\u{1F396}\uFE0F ${trait.name} triggered!`);
        }
      }
    }
    return traitTriggered;
  }
  debug2.log("\u2705 Popup script fully loaded");
  function getPopupThemeColors() {
    const isDarkMode = document.documentElement.classList.contains("theme-dark") || document.documentElement.getAttribute("data-theme") === "dark";
    return {
      background: isDarkMode ? "#2d2d2d" : "#ffffff",
      text: isDarkMode ? "#e0e0e0" : "#333333",
      heading: isDarkMode ? "#ffffff" : "#2D8B83",
      border: isDarkMode ? "#444444" : "#f0f8ff",
      borderAccent: isDarkMode ? "#2D8B83" : "#2D8B83",
      infoBox: isDarkMode ? "#1a1a1a" : "#f0f8ff",
      infoText: isDarkMode ? "#b0b0b0" : "#666666"
    };
  }
  function showHalflingLuckPopup(rollData) {
    debug2.log("\u{1F340} Halfling Luck popup called with:", rollData);
    if (!document.body) {
      debug2.error("\u274C document.body not available for Halfling Luck popup");
      showNotification("\u{1F340} Halfling Luck triggered! (Popup failed to display)", "info");
      return;
    }
    debug2.log("\u{1F340} Creating popup overlay...");
    const colors = getPopupThemeColors();
    const popupOverlay = document.createElement("div");
    popupOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
    const popupContent = document.createElement("div");
    popupContent.style.cssText = `
    background: ${colors.background};
    border-radius: 12px;
    padding: 24px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    text-align: center;
  `;
    debug2.log("\u{1F340} Setting popup content HTML...");
    popupContent.innerHTML = `
    <div style="font-size: 24px; margin-bottom: 16px;">\u{1F340}</div>
    <h2 style="margin: 0 0 8px 0; color: ${colors.heading};">Halfling Luck!</h2>
    <p style="margin: 0 0 16px 0; color: ${colors.text};">
      You rolled a natural 1! As a Halfling, you can reroll this d20.
    </p>
    <div style="margin: 0 0 16px 0; padding: 12px; background: ${colors.infoBox}; border-radius: 8px; border-left: 4px solid ${colors.borderAccent}; color: ${colors.text};">
      <strong>Original Roll:</strong> ${rollData.rollName}<br>
      <strong>Result:</strong> ${rollData.baseRoll} (natural 1)<br>
      <strong>Total:</strong> ${rollData.rollResult}
    </div>
    <div style="display: flex; gap: 12px; justify-content: center;">
      <button id="halflingRerollBtn" style="
        background: #2D8B83;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
      ">\u{1F3B2} Reroll</button>
      <button id="halflingKeepBtn" style="
        background: #e74c3c;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
      ">Keep Roll</button>
    </div>
  `;
    debug2.log("\u{1F340} Appending popup to document.body...");
    popupOverlay.appendChild(popupContent);
    document.body.appendChild(popupOverlay);
    document.getElementById("halflingRerollBtn").addEventListener("click", () => {
      debug2.log("\u{1F340} User chose to reroll");
      performHalflingReroll(rollData);
      document.body.removeChild(popupOverlay);
    });
    document.getElementById("halflingKeepBtn").addEventListener("click", () => {
      debug2.log("\u{1F340} User chose to keep roll");
      document.body.removeChild(popupOverlay);
    });
    popupOverlay.addEventListener("click", (e) => {
      if (e.target === popupOverlay) {
        debug2.log("\u{1F340} User closed popup");
        document.body.removeChild(popupOverlay);
      }
    });
    debug2.log("\u{1F340} Halfling Luck popup displayed");
  }
  function showLuckyPopup(rollData) {
    debug2.log("\u{1F396}\uFE0F Lucky popup called with:", rollData);
    if (!document.body) {
      debug2.error("\u274C document.body not available for Lucky popup");
      showNotification("\u{1F396}\uFE0F Lucky triggered! (Popup failed to display)", "info");
      return;
    }
    debug2.log("\u{1F396}\uFE0F Creating Lucky popup overlay...");
    const colors = getPopupThemeColors();
    const popupOverlay = document.createElement("div");
    popupOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
    const popupContent = document.createElement("div");
    popupContent.style.cssText = `
    background: ${colors.background};
    border-radius: 12px;
    padding: 24px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    text-align: center;
  `;
    debug2.log("\u{1F396}\uFE0F Setting Lucky popup content HTML...");
    popupContent.innerHTML = `
    <div style="font-size: 24px; margin-bottom: 16px;">\u{1F396}\uFE0F</div>
    <h2 style="margin: 0 0 8px 0; color: #f39c12;">Lucky Feat!</h2>
    <p style="margin: 0 0 16px 0; color: ${colors.text};">
      You rolled a ${rollData.baseRoll}! You have ${rollData.luckPointsRemaining} luck points remaining.
    </p>
    <div style="margin: 0 0 16px 0; padding: 12px; background: ${colors.infoBox}; border-radius: 8px; border-left: 4px solid #f39c12; color: ${colors.text};">
      <strong>Original Roll:</strong> ${rollData.rollName}<br>
      <strong>Result:</strong> ${rollData.baseRoll}<br>
      <strong>Luck Points:</strong> ${rollData.luckPointsRemaining}/3
    </div>
    <div style="display: flex; gap: 12px; justify-content: center;">
      <button id="luckyRerollBtn" style="
        background: #f39c12;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        transition: background 0.2s;
      ">
        \u{1F3B2} Reroll (Use Luck Point)
      </button>
      <button id="luckyKeepBtn" style="
        background: #95a5a6;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        transition: background 0.2s;
      ">
        Keep Roll
      </button>
    </div>
  `;
    popupOverlay.appendChild(popupContent);
    document.body.appendChild(popupOverlay);
    debug2.log("\u{1F396}\uFE0F Appending Lucky popup to document.body...");
    const rerollBtn = document.getElementById("luckyRerollBtn");
    const keepBtn = document.getElementById("luckyKeepBtn");
    rerollBtn.addEventListener("mouseenter", () => rerollBtn.style.background = "#e67e22");
    rerollBtn.addEventListener("mouseleave", () => rerollBtn.style.background = "#f39c12");
    keepBtn.addEventListener("mouseenter", () => keepBtn.style.background = "#7f8c8d");
    keepBtn.addEventListener("mouseleave", () => keepBtn.style.background = "#95a5a6");
    rerollBtn.addEventListener("click", () => {
      if (useLuckyPoint()) {
        performLuckyReroll(rollData);
        popupOverlay.remove();
      } else {
        alert("No luck points available!");
      }
    });
    keepBtn.addEventListener("click", () => {
      popupOverlay.remove();
    });
    popupOverlay.addEventListener("click", (e) => {
      if (e.target === popupOverlay) {
        popupOverlay.remove();
      }
    });
    debug2.log("\u{1F396}\uFE0F Lucky popup displayed");
  }
  function performLuckyReroll(originalRollData) {
    debug2.log("\u{1F396}\uFE0F Performing Lucky reroll for:", originalRollData);
    const baseFormula = originalRollData.rollType.replace(/[+-]\d+$/i, "");
    const rerollData = {
      name: `\u{1F396}\uFE0F ${originalRollData.rollName} (Lucky Reroll)`,
      formula: baseFormula,
      color: "#f39c12",
      characterName: characterData.name
    };
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        action: "rollFromPopout",
        ...rerollData
      }, "*");
      debug2.log("\u{1F396}\uFE0F Lucky reroll sent via window.opener");
    } else {
      browserAPI.runtime.sendMessage({
        action: "relayRollToRoll20",
        roll: rerollData
      });
    }
    showNotification("\u{1F396}\uFE0F Lucky reroll initiated!", "success");
  }
  function showTraitChoicePopup(rollData) {
    debug2.log("\u{1F3AF} Trait choice popup called with:", rollData);
    if (!document.body) {
      debug2.error("\u274C document.body not available for trait choice popup");
      showNotification("\u{1F3AF} Trait choice triggered! (Popup failed to display)", "info");
      return;
    }
    debug2.log("\u{1F3AF} Creating trait choice overlay...");
    const colors = getPopupThemeColors();
    const popupOverlay = document.createElement("div");
    popupOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
    const popupContent = document.createElement("div");
    popupContent.style.cssText = `
    background: ${colors.background};
    border-radius: 12px;
    padding: 24px;
    max-width: 450px;
    width: 90%;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    text-align: center;
  `;
    let traitOptionsHTML = "";
    const allTraits = [...rollData.racialTraits, ...rollData.featTraits];
    allTraits.forEach((trait, index) => {
      let icon = "";
      let color = "";
      let description = "";
      if (trait.name === "Halfling Luck") {
        icon = "\u{1F340}";
        color = "#2D8B83";
        description = "Reroll natural 1s (must use new roll)";
      } else if (trait.name === "Lucky") {
        icon = "\u{1F396}\uFE0F";
        color = "#f39c12";
        const luckyResource = getLuckyResource();
        description = `Reroll any roll (${luckyResource?.current || 0}/3 points left)`;
      }
      traitOptionsHTML += `
      <button class="trait-option-btn" data-trait-index="${index}" data-trait-color="${color}" style="
        background: ${color};
        color: white;
        border: none;
        padding: 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        margin: 8px 0;
        transition: transform 0.2s, background 0.2s;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
      ">
        <span style="font-size: 20px;">${icon}</span>
        <div style="text-align: left;">
          <div style="font-weight: bold;">${trait.name}</div>
          <div style="font-size: 12px; opacity: 0.9;">${description}</div>
        </div>
      </button>
    `;
    });
    debug2.log("\u{1F3AF} Setting trait choice popup content HTML...");
    popupContent.innerHTML = `
    <div style="font-size: 24px; margin-bottom: 16px;">\u{1F3AF}</div>
    <h2 style="margin: 0 0 8px 0; color: ${colors.heading};">Multiple Traits Available!</h2>
    <p style="margin: 0 0 16px 0; color: ${colors.text};">
      You rolled a ${rollData.baseRoll}! Choose which trait to use:
    </p>
    <div style="margin: 0 0 16px 0; padding: 12px; background: ${colors.infoBox}; border-radius: 8px; border-left: 4px solid #3498db; color: ${colors.text};">
      <strong>Original Roll:</strong> ${rollData.rollName}<br>
      <strong>Result:</strong> ${rollData.baseRoll}<br>
      <strong>Total:</strong> ${rollData.rollResult}
    </div>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${traitOptionsHTML}
    </div>
    <button id="cancelTraitBtn" style="
      background: #95a5a6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      margin-top: 8px;
      transition: background 0.2s;
    ">
      Keep Original Roll
    </button>
  `;
    popupOverlay.appendChild(popupContent);
    document.body.appendChild(popupOverlay);
    debug2.log("\u{1F3AF} Appending trait choice popup to document.body...");
    const traitButtons = document.querySelectorAll(".trait-option-btn");
    const cancelBtn = document.getElementById("cancelTraitBtn");
    traitButtons.forEach((btn, index) => {
      const originalColor = btn.dataset.traitColor;
      btn.addEventListener("mouseenter", () => {
        btn.style.transform = "translateY(-2px)";
        btn.style.background = originalColor + "dd";
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "translateY(0)";
        btn.style.background = originalColor;
      });
      btn.addEventListener("click", () => {
        const trait = allTraits[index];
        debug2.log(`\u{1F3AF} User chose trait: ${trait.name}`);
        popupOverlay.remove();
        if (trait.name === "Halfling Luck") {
          showHalflingLuckPopup({
            rollResult: rollData.baseRoll,
            baseRoll: rollData.baseRoll,
            rollType: rollData.rollType,
            rollName: rollData.rollName
          });
        } else if (trait.name === "Lucky") {
          const luckyResource = getLuckyResource();
          showLuckyPopup({
            rollResult: rollData.baseRoll,
            baseRoll: rollData.baseRoll,
            rollType: rollData.rollType,
            rollName: rollData.rollName,
            luckPointsRemaining: luckyResource?.current || 0
          });
        }
      });
    });
    cancelBtn.addEventListener("mouseenter", () => cancelBtn.style.background = "#7f8c8d");
    cancelBtn.addEventListener("mouseleave", () => cancelBtn.style.background = "#95a5a6");
    cancelBtn.addEventListener("click", () => {
      popupOverlay.remove();
    });
    popupOverlay.addEventListener("click", (e) => {
      if (e.target === popupOverlay) {
        popupOverlay.remove();
      }
    });
    debug2.log("\u{1F3AF} Trait choice popup displayed");
  }
  function showWildMagicSurgePopup(d100Roll, effect) {
    debug2.log("\u{1F300} Wild Magic Surge popup called with:", d100Roll, effect);
    if (!document.body) {
      debug2.error("\u274C document.body not available for Wild Magic Surge popup");
      showNotification(`\u{1F300} Wild Magic Surge! d100: ${d100Roll}`, "warning");
      return;
    }
    const colors = getPopupThemeColors();
    const popupOverlay = document.createElement("div");
    popupOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
    const popupContent = document.createElement("div");
    popupContent.style.cssText = `
    background: ${colors.background};
    border-radius: 12px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    text-align: center;
  `;
    popupContent.innerHTML = `
    <div style="font-size: 32px; margin-bottom: 16px;">\u{1F300}</div>
    <h2 style="margin: 0 0 8px 0; color: #9b59b6;">Wild Magic Surge!</h2>
    <p style="margin: 0 0 16px 0; color: ${colors.text};">
      Your spell triggers a wild magic surge!
    </p>
    <div style="margin: 0 0 16px 0; padding: 16px; background: ${colors.infoBox}; border-radius: 8px; border-left: 4px solid #9b59b6; color: ${colors.text}; text-align: left;">
      <div style="text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 12px; color: #9b59b6;">
        d100 Roll: ${d100Roll}
      </div>
      <div style="font-size: 14px; line-height: 1.6;">
        ${effect}
      </div>
    </div>
    <button id="closeWildMagicBtn" style="
      background: #9b59b6;
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      font-size: 14px;
      transition: background 0.2s;
    ">Got it!</button>
  `;
    popupOverlay.appendChild(popupContent);
    document.body.appendChild(popupOverlay);
    const closeBtn = document.getElementById("closeWildMagicBtn");
    closeBtn.addEventListener("mouseenter", () => closeBtn.style.background = "#8e44ad");
    closeBtn.addEventListener("mouseleave", () => closeBtn.style.background = "#9b59b6");
    closeBtn.addEventListener("click", () => {
      document.body.removeChild(popupOverlay);
    });
    popupOverlay.addEventListener("click", (e) => {
      if (e.target === popupOverlay) {
        document.body.removeChild(popupOverlay);
      }
    });
    const colorBanner = getColoredBanner();
    const message = `&{template:default} {{name=${colorBanner}${characterData.name} - Wild Magic Surge! \u{1F300}}} {{d100 Roll=${d100Roll}}} {{Effect=${effect}}}`;
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        action: "announceSpell",
        message
      }, "*");
    }
    debug2.log("\u{1F300} Wild Magic Surge popup displayed");
  }
  function showBardicInspirationPopup(rollData) {
    debug2.log("\u{1F3B5} Bardic Inspiration popup called with:", rollData);
    if (!document.body) {
      debug2.error("\u274C document.body not available for Bardic Inspiration popup");
      showNotification("\u{1F3B5} Bardic Inspiration available! (Popup failed to display)", "info");
      return;
    }
    debug2.log("\u{1F3B5} Creating Bardic Inspiration popup overlay...");
    const colors = getPopupThemeColors();
    const popupOverlay = document.createElement("div");
    popupOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
    const popupContent = document.createElement("div");
    popupContent.style.cssText = `
    background: ${colors.background};
    border-radius: 12px;
    padding: 24px;
    max-width: 450px;
    width: 90%;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    text-align: center;
  `;
    debug2.log("\u{1F3B5} Setting Bardic Inspiration popup content HTML...");
    popupContent.innerHTML = `
    <div style="font-size: 32px; margin-bottom: 16px;">\u{1F3B5}</div>
    <h2 style="margin: 0 0 8px 0; color: ${colors.heading};">Bardic Inspiration!</h2>
    <p style="margin: 0 0 16px 0; color: ${colors.text};">
      Add a <strong>${rollData.inspirationDie}</strong> to this roll?
    </p>
    <div style="margin: 0 0 16px 0; padding: 12px; background: ${colors.infoBox}; border-radius: 8px; border-left: 4px solid #9b59b6; color: ${colors.text};">
      <strong>Current Roll:</strong> ${rollData.rollName}<br>
      <strong>Base Result:</strong> ${rollData.baseRoll}<br>
      <strong>Inspiration Die:</strong> ${rollData.inspirationDie}<br>
      <strong>Uses Left:</strong> ${rollData.usesRemaining}
    </div>
    <div style="margin-bottom: 16px; padding: 12px; background: ${colors.infoBox}; border-radius: 8px; color: ${colors.text}; font-size: 13px; text-align: left;">
      <strong>\u{1F4A1} How it works:</strong><br>
      \u2022 Roll the inspiration die and add it to your total<br>
      \u2022 Can be used on ability checks, attack rolls, or saves<br>
      \u2022 Only one inspiration die can be used per roll
    </div>
    <div style="display: flex; gap: 12px; justify-content: center;">
      <button id="bardicUseBtn" style="
        background: #9b59b6;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
        transition: background 0.2s;
      ">\u{1F3B2} Use Inspiration</button>
      <button id="bardicDeclineBtn" style="
        background: #7f8c8d;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
        transition: background 0.2s;
      ">Decline</button>
    </div>
  `;
    debug2.log("\u{1F3B5} Appending Bardic Inspiration popup to document.body...");
    popupOverlay.appendChild(popupContent);
    document.body.appendChild(popupOverlay);
    const useBtn = document.getElementById("bardicUseBtn");
    const declineBtn = document.getElementById("bardicDeclineBtn");
    useBtn.addEventListener("mouseenter", () => {
      useBtn.style.background = "#8e44ad";
    });
    useBtn.addEventListener("mouseleave", () => {
      useBtn.style.background = "#9b59b6";
    });
    declineBtn.addEventListener("mouseenter", () => {
      declineBtn.style.background = "#95a5a6";
    });
    declineBtn.addEventListener("mouseleave", () => {
      declineBtn.style.background = "#7f8c8d";
    });
    useBtn.addEventListener("click", () => {
      debug2.log("\u{1F3B5} User chose to use Bardic Inspiration");
      performBardicInspirationRoll(rollData);
      document.body.removeChild(popupOverlay);
    });
    declineBtn.addEventListener("click", () => {
      debug2.log("\u{1F3B5} User declined Bardic Inspiration");
      showNotification("Bardic Inspiration declined", "info");
      document.body.removeChild(popupOverlay);
    });
    popupOverlay.addEventListener("click", (e) => {
      if (e.target === popupOverlay) {
        debug2.log("\u{1F3B5} User closed Bardic Inspiration popup");
        document.body.removeChild(popupOverlay);
      }
    });
    debug2.log("\u{1F3B5} Bardic Inspiration popup displayed");
  }
  function performBardicInspirationRoll(rollData) {
    debug2.log("\u{1F3B5} Performing Bardic Inspiration roll with data:", rollData);
    const success = useBardicInspiration();
    if (!success) {
      debug2.error("\u274C Failed to use Bardic Inspiration (no uses left?)");
      showNotification("\u274C Failed to use Bardic Inspiration", "error");
      return;
    }
    const dieSize = parseInt(rollData.inspirationDie.substring(1));
    const inspirationRoll = Math.floor(Math.random() * dieSize) + 1;
    debug2.log(`\u{1F3B5} Rolled ${rollData.inspirationDie}: ${inspirationRoll}`);
    const inspirationMessage = `/roll ${rollData.inspirationDie}`;
    const chatMessage = `\u{1F3B5} Bardic Inspiration for ${rollData.rollName}: [[${inspirationRoll}]] (${rollData.inspirationDie})`;
    showNotification(`\u{1F3B5} Bardic Inspiration: +${inspirationRoll}!`, "success");
    browserAPI.runtime.sendMessage({
      action: "rollDice",
      rollData: {
        message: chatMessage,
        characterName: characterData.name || "Character"
      }
    });
    debug2.log("\u{1F3B5} Bardic Inspiration roll complete");
  }
  function showElvenAccuracyPopup(rollData) {
    debug2.log("\u{1F9DD} Elven Accuracy popup called with:", rollData);
    if (!document.body) {
      debug2.error("\u274C document.body not available for Elven Accuracy popup");
      showNotification("\u{1F9DD} Elven Accuracy triggered!", "info");
      return;
    }
    const colors = getPopupThemeColors();
    const popupOverlay = document.createElement("div");
    popupOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
    const popupContent = document.createElement("div");
    popupContent.style.cssText = `
    background: ${colors.background};
    border-radius: 12px;
    padding: 24px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    text-align: center;
  `;
    popupContent.innerHTML = `
    <div style="font-size: 24px; margin-bottom: 16px;">\u{1F9DD}</div>
    <h2 style="margin: 0 0 8px 0; color: #27ae60;">Elven Accuracy!</h2>
    <p style="margin: 0 0 16px 0; color: ${colors.text};">
      You have advantage! Would you like to reroll the lower die?
    </p>
    <div style="margin: 0 0 16px 0; padding: 12px; background: ${colors.infoBox}; border-radius: 8px; border-left: 4px solid #27ae60; color: ${colors.text};">
      <strong>Roll:</strong> ${rollData.rollName}<br>
      <strong>Type:</strong> Advantage attack roll
    </div>
    <div style="display: flex; gap: 12px; justify-content: center;">
      <button id="elvenRerollBtn" style="
        background: #27ae60;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
      ">\u{1F3B2} Reroll Lower Die</button>
      <button id="elvenKeepBtn" style="
        background: #95a5a6;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
      ">Keep Rolls</button>
    </div>
  `;
    popupOverlay.appendChild(popupContent);
    document.body.appendChild(popupOverlay);
    const rerollBtn = document.getElementById("elvenRerollBtn");
    const keepBtn = document.getElementById("elvenKeepBtn");
    rerollBtn.addEventListener("mouseenter", () => rerollBtn.style.background = "#229954");
    rerollBtn.addEventListener("mouseleave", () => rerollBtn.style.background = "#27ae60");
    keepBtn.addEventListener("mouseenter", () => keepBtn.style.background = "#7f8c8d");
    keepBtn.addEventListener("mouseleave", () => keepBtn.style.background = "#95a5a6");
    rerollBtn.addEventListener("click", () => {
      debug2.log("\u{1F9DD} User chose to reroll with Elven Accuracy");
      performElvenAccuracyReroll(rollData);
      document.body.removeChild(popupOverlay);
    });
    keepBtn.addEventListener("click", () => {
      debug2.log("\u{1F9DD} User chose to keep original advantage rolls");
      document.body.removeChild(popupOverlay);
    });
    popupOverlay.addEventListener("click", (e) => {
      if (e.target === popupOverlay) {
        document.body.removeChild(popupOverlay);
      }
    });
    debug2.log("\u{1F9DD} Elven Accuracy popup displayed");
  }
  function performElvenAccuracyReroll(originalRollData) {
    debug2.log("\u{1F9DD} Performing Elven Accuracy reroll for:", originalRollData);
    const thirdRoll = Math.floor(Math.random() * 20) + 1;
    const rerollData = {
      name: `\u{1F9DD} ${originalRollData.rollName} (Elven Accuracy - 3rd die)`,
      formula: "1d20",
      color: "#27ae60",
      characterName: characterData.name
    };
    debug2.log("\u{1F9DD} Third die roll:", thirdRoll);
    const colorBanner = getColoredBanner();
    const message = `&{template:default} {{name=${colorBanner}${characterData.name} uses Elven Accuracy! \u{1F9DD}}} {{Action=Reroll lower die}} {{Third d20=${thirdRoll}}} {{=Choose the highest of all three rolls!}}`;
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        action: "announceSpell",
        message
      }, "*");
    } else {
      browserAPI.runtime.sendMessage({
        action: "relayRollToRoll20",
        roll: { ...rerollData, result: thirdRoll }
      });
    }
    showNotification(`\u{1F9DD} Elven Accuracy! Third die: ${thirdRoll}`, "success");
  }
  function showLuckyModal() {
    debug2.log("\u{1F396}\uFE0F Lucky modal called");
    const luckyResource = getLuckyResource();
    if (!luckyResource || luckyResource.current <= 0) {
      showNotification("\u274C No luck points available!", "error");
      return;
    }
    const modal = document.createElement("div");
    modal.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;";
    const modalContent = document.createElement("div");
    modalContent.style.cssText = "background: white; border-radius: 8px; padding: 20px; max-width: 400px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);";
    modalContent.innerHTML = `
    <h3 style="margin: 0 0 15px 0; color: #f39c12;">\u{1F396}\uFE0F Use Lucky Point</h3>
    <p style="margin: 0 0 15px 0; color: #666;">Choose what to use Lucky for:</p>
    <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
      <strong>Luck Points:</strong> ${luckyResource.current}/${luckyResource.max}
    </div>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <button id="luckyOffensive" style="padding: 10px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">\u2694\uFE0F Attack/Check/Saving Throw</button>
      <button id="luckyDefensive" style="padding: 10px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">\u{1F6E1}\uFE0F Against Attack on You</button>
      <button id="luckyCancel" style="padding: 10px; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
    </div>
  `;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    document.getElementById("luckyOffensive").addEventListener("click", () => {
      if (useLuckyPoint()) {
        modal.remove();
        rollLuckyDie("offensive");
      }
    });
    document.getElementById("luckyDefensive").addEventListener("click", () => {
      if (useLuckyPoint()) {
        modal.remove();
        rollLuckyDie("defensive");
      }
    });
    document.getElementById("luckyCancel").addEventListener("click", () => {
      modal.remove();
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal)
        modal.remove();
    });
    debug2.log("\u{1F396}\uFE0F Lucky modal displayed");
  }
  function rollLuckyDie(type) {
    debug2.log(`\u{1F396}\uFE0F Rolling Lucky d20 for ${type}`);
    const luckyRoll = Math.floor(Math.random() * 20) + 1;
    const rollData = {
      name: `\u{1F396}\uFE0F ${characterData.name} uses Lucky`,
      formula: "1d20",
      characterName: characterData.name
    };
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        action: "rollFromPopout",
        ...rollData
      }, "*");
      debug2.log("\u{1F396}\uFE0F Lucky roll sent via window.opener");
    } else {
      browserAPI.runtime.sendMessage({
        action: "relayRollToRoll20",
        roll: rollData
      });
    }
    if (type === "offensive") {
      showNotification(`\u{1F396}\uFE0F Lucky roll: ${luckyRoll}! Use this instead of your next d20 roll.`, "success");
    } else {
      showNotification(`\u{1F396}\uFE0F Lucky defense roll: ${luckyRoll}! Compare against attacker's roll.`, "success");
    }
    debug2.log(`\u{1F396}\uFE0F Lucky d20 result: ${luckyRoll} - sent to chat`);
  }
  function performHalflingReroll(originalRollData) {
    debug2.log("\u{1F340} Performing Halfling reroll for:", originalRollData);
    const formula2 = originalRollData.rollType;
    const baseFormula = formula2.split("+")[0];
    const rerollData = {
      name: `\u{1F340} ${originalRollData.rollName} (Halfling Luck)`,
      formula: baseFormula,
      color: "#2D8B83",
      characterName: characterData.name
    };
    debug2.log("\u{1F340} Reroll data:", rerollData);
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        action: "rollFromPopout",
        ...rerollData
      }, "*");
    } else {
      browserAPI.runtime.sendMessage({
        action: "relayRollToRoll20",
        roll: rerollData
      });
    }
    showNotification("\u{1F340} Halfling Luck reroll initiated!", "success");
  }
  var HalflingLuck = {
    name: "Halfling Luck",
    description: "When you roll a 1 on an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.",
    onRoll: function(rollResult, rollType, rollName) {
      debug2.log(`\u{1F9EC} Halfling Luck onRoll called with: ${rollResult}, ${rollType}, ${rollName}`);
      debug2.log(`\u{1F9EC} Halfling Luck DEBUG - rollType exists: ${!!rollType}, includes d20: ${rollType && rollType.includes("d20")}, rollResult === 1: ${parseInt(rollResult) === 1}`);
      const numericRollResult = parseInt(rollResult);
      if (rollType && rollType.includes("d20") && numericRollResult === 1) {
        debug2.log(`\u{1F9EC} Halfling Luck: TRIGGERED! Roll was ${numericRollResult}`);
        try {
          showHalflingLuckPopup({
            rollResult: numericRollResult,
            baseRoll: numericRollResult,
            rollType,
            rollName
          });
        } catch (error) {
          debug2.error("\u274C Error showing Halfling Luck popup:", error);
          showNotification("\u{1F340} Halfling Luck triggered! Check console for details.", "info");
        }
        return true;
      }
      debug2.log(`\u{1F9EC} Halfling Luck: No trigger - Roll: ${numericRollResult}, Type: ${rollType}`);
      return false;
    }
  };
  var LuckyFeat = {
    name: "Lucky",
    description: "You have 3 luck points. When you make an attack roll, ability check, or saving throw, you can spend one luck point to roll an additional d20. You can then choose which of the d20 rolls to use.",
    onRoll: function(rollResult, rollType, rollName) {
      debug2.log(`\u{1F396}\uFE0F Lucky feat onRoll called with: ${rollResult}, ${rollType}, ${rollName}`);
      const numericRollResult = parseInt(rollResult);
      if (rollType && rollType.includes("d20")) {
        debug2.log(`\u{1F396}\uFE0F Lucky: Checking if we should offer reroll for ${numericRollResult}`);
        const luckyResource = getLuckyResource();
        if (!luckyResource || luckyResource.current <= 0) {
          debug2.log(`\u{1F396}\uFE0F Lucky: No luck points available (${luckyResource?.current || 0})`);
          return false;
        }
        debug2.log(`\u{1F396}\uFE0F Lucky: Has ${luckyResource.current} luck points available`);
        if (numericRollResult <= 10) {
          debug2.log(`\u{1F396}\uFE0F Lucky: TRIGGERED! Offering reroll for roll ${numericRollResult}`);
          try {
            showLuckyPopup({
              rollResult: numericRollResult,
              baseRoll: numericRollResult,
              rollType,
              rollName,
              luckPointsRemaining: luckyResource.current
            });
          } catch (error) {
            debug2.error("\u274C Error showing Lucky popup:", error);
            showNotification("\u{1F396}\uFE0F Lucky triggered! Check console for details.", "info");
          }
          return true;
        }
      }
      debug2.log(`\u{1F396}\uFE0F Lucky: No trigger - Roll: ${numericRollResult}, Type: ${rollType}`);
      return false;
    }
  };
  var ElvenAccuracy = {
    name: "Elven Accuracy",
    description: "Whenever you have advantage on an attack roll using Dexterity, Intelligence, Wisdom, or Charisma, you can reroll one of the dice once.",
    onRoll: function(rollResult, rollType, rollName) {
      debug2.log(`\u{1F9DD} Elven Accuracy onRoll called with: ${rollResult}, ${rollType}, ${rollName}`);
      if (rollType && rollType.includes("advantage") && rollType.includes("attack")) {
        debug2.log(`\u{1F9DD} Elven Accuracy: TRIGGERED! Offering to reroll lower die`);
        showElvenAccuracyPopup({
          rollName,
          rollType,
          rollResult
        });
        return true;
      }
      return false;
    }
  };
  var DwarvenResilience = {
    name: "Dwarven Resilience",
    description: "You have advantage on saving throws against poison.",
    onRoll: function(rollResult, rollType, rollName) {
      debug2.log(`\u26CF\uFE0F Dwarven Resilience onRoll called with: ${rollResult}, ${rollType}, ${rollName}`);
      const lowerRollName = rollName.toLowerCase();
      if (rollType && rollType.includes("save") && lowerRollName.includes("poison")) {
        debug2.log(`\u26CF\uFE0F Dwarven Resilience: TRIGGERED! Auto-applying advantage`);
        showNotification("\u26CF\uFE0F Dwarven Resilience: Advantage on poison saves!", "success");
        return true;
      }
      return false;
    }
  };
  var GnomeCunning = {
    name: "Gnome Cunning",
    description: "You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic.",
    onRoll: function(rollResult, rollType, rollName) {
      debug2.log(`\u{1F3A9} Gnome Cunning onRoll called with: ${rollResult}, ${rollType}, ${rollName}`);
      const lowerRollName = rollName.toLowerCase();
      const isMentalSave = lowerRollName.includes("intelligence") || lowerRollName.includes("wisdom") || lowerRollName.includes("charisma") || lowerRollName.includes("int save") || lowerRollName.includes("wis save") || lowerRollName.includes("cha save");
      const isMagic = lowerRollName.includes("spell") || lowerRollName.includes("magic") || lowerRollName.includes("charm") || lowerRollName.includes("illusion");
      if (rollType && rollType.includes("save") && isMentalSave && isMagic) {
        debug2.log(`\u{1F3A9} Gnome Cunning: TRIGGERED! Auto-applying advantage`);
        showNotification("\u{1F3A9} Gnome Cunning: Advantage on mental saves vs magic!", "success");
        return true;
      }
      return false;
    }
  };
  var ReliableTalent = {
    name: "Reliable Talent",
    description: "Whenever you make an ability check that lets you add your proficiency bonus, you treat a d20 roll of 9 or lower as a 10.",
    onRoll: function(rollResult, rollType, rollName) {
      debug2.log(`\u{1F3AF} Reliable Talent onRoll called with: ${rollResult}, ${rollType}, ${rollName}`);
      const numericRollResult = parseInt(rollResult);
      if (rollType && rollType.includes("skill") && numericRollResult < 10) {
        debug2.log(`\u{1F3AF} Reliable Talent: TRIGGERED! Minimum roll is 10`);
        showNotification(`\u{1F3AF} Reliable Talent: ${numericRollResult} becomes 10!`, "success");
        return true;
      }
      return false;
    }
  };
  var JackOfAllTrades = {
    name: "Jack of All Trades",
    description: "You can add half your proficiency bonus (rounded down) to any ability check you make that doesn't already include your proficiency bonus.",
    onRoll: function(rollResult, rollType, rollName) {
      debug2.log(`\u{1F3B5} Jack of All Trades onRoll called with: ${rollResult}, ${rollType}, ${rollName}`);
      if (rollType && rollType.includes("skill")) {
        const profBonus = characterData.proficiencyBonus || 2;
        const halfProf = Math.floor(profBonus / 2);
        debug2.log(`\u{1F3B5} Jack of All Trades: Reminder to add +${halfProf} if non-proficient`);
        showNotification(`\u{1F3B5} Jack: Add +${halfProf} if non-proficient`, "info");
        return true;
      }
      return false;
    }
  };
  var RageDamageBonus = {
    name: "Rage",
    description: "While raging, you gain bonus damage on melee weapon attacks using Strength.",
    onRoll: function(rollResult, rollType, rollName) {
      debug2.log(`\u{1F621} Rage Damage onRoll called with: ${rollResult}, ${rollType}, ${rollName}`);
      const isRaging = characterData.conditions && characterData.conditions.some(
        (c) => c.toLowerCase().includes("rage") || c.toLowerCase().includes("raging")
      );
      if (isRaging && rollType && rollType.includes("attack")) {
        const level = characterData.level || 1;
        const rageDamage = level < 9 ? 2 : level < 16 ? 3 : 4;
        debug2.log(`\u{1F621} Rage Damage: TRIGGERED! Adding +${rageDamage} damage`);
        showNotification(`\u{1F621} Rage: Add +${rageDamage} damage!`, "success");
        return true;
      }
      return false;
    }
  };
  var BrutalCritical = {
    name: "Brutal Critical",
    description: "You can roll one additional weapon damage die when determining the extra damage for a critical hit with a melee attack.",
    onRoll: function(rollResult, rollType, rollName) {
      debug2.log(`\u{1F4A5} Brutal Critical onRoll called with: ${rollResult}, ${rollType}, ${rollName}`);
      const numericRollResult = parseInt(rollResult);
      if (rollType && rollType.includes("attack") && numericRollResult === 20) {
        const level = characterData.level || 1;
        const extraDice = level < 13 ? 1 : level < 17 ? 2 : 3;
        debug2.log(`\u{1F4A5} Brutal Critical: TRIGGERED! Roll ${extraDice} extra weapon die/dice`);
        showNotification(`\u{1F4A5} Brutal Critical: Roll ${extraDice} extra weapon die!`, "success");
        return true;
      }
      return false;
    }
  };
  var PortentDice = {
    name: "Portent",
    description: "Roll two d20s and record the numbers. You can replace any attack roll, saving throw, or ability check made by you or a creature you can see with one of these rolls.",
    portentRolls: [],
    // Store portent rolls for the day
    rollPortentDice: function() {
      const roll1 = Math.floor(Math.random() * 20) + 1;
      const roll2 = Math.floor(Math.random() * 20) + 1;
      this.portentRolls = [roll1, roll2];
      debug2.log(`\u{1F52E} Portent: Rolled ${roll1} and ${roll2}`);
      showNotification(`\u{1F52E} Portent: You rolled ${roll1} and ${roll2}`, "info");
      return this.portentRolls;
    },
    usePortentRoll: function(index) {
      if (index >= 0 && index < this.portentRolls.length) {
        const roll2 = this.portentRolls.splice(index, 1)[0];
        debug2.log(`\u{1F52E} Portent: Used portent roll ${roll2}`);
        showNotification(`\u{1F52E} Portent: Applied roll of ${roll2}`, "success");
        return roll2;
      }
      return null;
    },
    onRoll: function(rollResult, rollType, rollName) {
      if (this.portentRolls.length > 0) {
        showNotification(`\u{1F52E} ${this.portentRolls.length} Portent dice available`, "info");
      }
      return false;
    }
  };
  var WILD_MAGIC_EFFECTS = [
    "Roll on this table at the start of each of your turns for the next minute, ignoring this result on subsequent rolls.",
    "Roll on this table at the start of each of your turns for the next minute, ignoring this result on subsequent rolls.",
    "For the next minute, you can see any invisible creature if you have line of sight to it.",
    "For the next minute, you can see any invisible creature if you have line of sight to it.",
    "A modron chosen and controlled by the DM appears in an unoccupied space within 5 feet of you, then disappears 1 minute later.",
    "A modron chosen and controlled by the DM appears in an unoccupied space within 5 feet of you, then disappears 1 minute later.",
    "You cast Fireball as a 3rd-level spell centered on yourself.",
    "You cast Fireball as a 3rd-level spell centered on yourself.",
    "You cast Magic Missile as a 5th-level spell.",
    "You cast Magic Missile as a 5th-level spell.",
    "Roll a d10. Your height changes by a number of inches equal to the roll. If the roll is odd, you shrink. If the roll is even, you grow.",
    "Roll a d10. Your height changes by a number of inches equal to the roll. If the roll is odd, you shrink. If the roll is even, you grow.",
    "You cast Confusion centered on yourself.",
    "You cast Confusion centered on yourself.",
    "For the next minute, you regain 5 hit points at the start of each of your turns.",
    "For the next minute, you regain 5 hit points at the start of each of your turns.",
    "You grow a long beard made of feathers that remains until you sneeze, at which point the feathers explode out from your face.",
    "You grow a long beard made of feathers that remains until you sneeze, at which point the feathers explode out from your face.",
    "You cast Grease centered on yourself.",
    "You cast Grease centered on yourself.",
    "Creatures have disadvantage on saving throws against the next spell you cast in the next minute that involves a saving throw.",
    "Creatures have disadvantage on saving throws against the next spell you cast in the next minute that involves a saving throw.",
    "Your skin turns a vibrant shade of blue. A Remove Curse spell can end this effect.",
    "Your skin turns a vibrant shade of blue. A Remove Curse spell can end this effect.",
    "An eye appears on your forehead for the next minute. During that time, you have advantage on Wisdom (Perception) checks that rely on sight.",
    "An eye appears on your forehead for the next minute. During that time, you have advantage on Wisdom (Perception) checks that rely on sight.",
    "For the next minute, all your spells with a casting time of 1 action have a casting time of 1 bonus action.",
    "For the next minute, all your spells with a casting time of 1 action have a casting time of 1 bonus action.",
    "You teleport up to 60 feet to an unoccupied space of your choice that you can see.",
    "You teleport up to 60 feet to an unoccupied space of your choice that you can see.",
    "You are transported to the Astral Plane until the end of your next turn, after which time you return to the space you previously occupied or the nearest unoccupied space if that space is occupied.",
    "You are transported to the Astral Plane until the end of your next turn, after which time you return to the space you previously occupied or the nearest unoccupied space if that space is occupied.",
    "Maximize the damage of the next damaging spell you cast within the next minute.",
    "Maximize the damage of the next damaging spell you cast within the next minute.",
    "Roll a d10. Your age changes by a number of years equal to the roll. If the roll is odd, you get younger (minimum 1 year old). If the roll is even, you get older.",
    "Roll a d10. Your age changes by a number of years equal to the roll. If the roll is odd, you get younger (minimum 1 year old). If the roll is even, you get older.",
    "1d6 flumphs controlled by the DM appear in unoccupied spaces within 60 feet of you and are frightened of you. They vanish after 1 minute.",
    "1d6 flumphs controlled by the DM appear in unoccupied spaces within 60 feet of you and are frightened of you. They vanish after 1 minute.",
    "You regain 2d10 hit points.",
    "You regain 2d10 hit points.",
    "You turn into a potted plant until the start of your next turn. While a plant, you are incapacitated and have vulnerability to all damage. If you drop to 0 hit points, your pot breaks, and your form reverts.",
    "You turn into a potted plant until the start of your next turn. While a plant, you are incapacitated and have vulnerability to all damage. If you drop to 0 hit points, your pot breaks, and your form reverts.",
    "For the next minute, you can teleport up to 20 feet as a bonus action on each of your turns.",
    "For the next minute, you can teleport up to 20 feet as a bonus action on each of your turns.",
    "You cast Levitate on yourself.",
    "You cast Levitate on yourself.",
    "A unicorn controlled by the DM appears in a space within 5 feet of you, then disappears 1 minute later.",
    "A unicorn controlled by the DM appears in a space within 5 feet of you, then disappears 1 minute later.",
    "You can't speak for the next minute. Whenever you try, pink bubbles float out of your mouth.",
    "You can't speak for the next minute. Whenever you try, pink bubbles float out of your mouth.",
    "A spectral shield hovers near you for the next minute, granting you a +2 bonus to AC and immunity to Magic Missile.",
    "A spectral shield hovers near you for the next minute, granting you a +2 bonus to AC and immunity to Magic Missile.",
    "You are immune to being intoxicated by alcohol for the next 5d6 days.",
    "You are immune to being intoxicated by alcohol for the next 5d6 days.",
    "Your hair falls out but grows back within 24 hours.",
    "Your hair falls out but grows back within 24 hours.",
    "For the next minute, any flammable object you touch that isn't being worn or carried by another creature bursts into flame.",
    "For the next minute, any flammable object you touch that isn't being worn or carried by another creature bursts into flame.",
    "You regain your lowest-level expended spell slot.",
    "You regain your lowest-level expended spell slot.",
    "For the next minute, you must shout when you speak.",
    "For the next minute, you must shout when you speak.",
    "You cast Fog Cloud centered on yourself.",
    "You cast Fog Cloud centered on yourself.",
    "Up to three creatures you choose within 30 feet of you take 4d10 lightning damage.",
    "Up to three creatures you choose within 30 feet of you take 4d10 lightning damage.",
    "You are frightened by the nearest creature until the end of your next turn.",
    "You are frightened by the nearest creature until the end of your next turn.",
    "Each creature within 30 feet of you becomes invisible for the next minute. The invisibility ends on a creature when it attacks or casts a spell.",
    "Each creature within 30 feet of you becomes invisible for the next minute. The invisibility ends on a creature when it attacks or casts a spell.",
    "You gain resistance to all damage for the next minute.",
    "You gain resistance to all damage for the next minute.",
    "A random creature within 60 feet of you becomes poisoned for 1d4 hours.",
    "A random creature within 60 feet of you becomes poisoned for 1d4 hours.",
    "You glow with bright light in a 30-foot radius for the next minute. Any creature that ends its turn within 5 feet of you is blinded until the end of its next turn.",
    "You glow with bright light in a 30-foot radius for the next minute. Any creature that ends its turn within 5 feet of you is blinded until the end of its next turn.",
    "You cast Polymorph on yourself. If you fail the saving throw, you turn into a sheep for the spell's duration.",
    "You cast Polymorph on yourself. If you fail the saving throw, you turn into a sheep for the spell's duration.",
    "Illusory butterflies and flower petals flutter in the air within 10 feet of you for the next minute.",
    "Illusory butterflies and flower petals flutter in the air within 10 feet of you for the next minute.",
    "You can take one additional action immediately.",
    "You can take one additional action immediately.",
    "Each creature within 30 feet of you takes 1d10 necrotic damage. You regain hit points equal to the sum of the necrotic damage dealt.",
    "Each creature within 30 feet of you takes 1d10 necrotic damage. You regain hit points equal to the sum of the necrotic damage dealt.",
    "You cast Mirror Image.",
    "You cast Mirror Image.",
    "You cast Fly on a random creature within 60 feet of you.",
    "You cast Fly on a random creature within 60 feet of you.",
    "You become invisible for the next minute. During that time, other creatures can't hear you. The invisibility ends if you attack or cast a spell.",
    "You become invisible for the next minute. During that time, other creatures can't hear you. The invisibility ends if you attack or cast a spell.",
    "If you die within the next minute, you immediately come back to life as if by the Reincarnate spell.",
    "If you die within the next minute, you immediately come back to life as if by the Reincarnate spell.",
    "Your size increases by one size category for the next minute.",
    "Your size increases by one size category for the next minute.",
    "You and all creatures within 30 feet of you gain vulnerability to piercing damage for the next minute.",
    "You and all creatures within 30 feet of you gain vulnerability to piercing damage for the next minute.",
    "You are surrounded by faint, ethereal music for the next minute.",
    "You are surrounded by faint, ethereal music for the next minute.",
    "You regain all expended sorcery points.",
    "You regain all expended sorcery points."
  ];
  var WildMagicSurge = {
    name: "Wild Magic Surge",
    description: "Immediately after you cast a sorcerer spell of 1st level or higher, the DM can have you roll a d20. If you roll a 1, roll on the Wild Magic Surge table.",
    onSpellCast: function(spellLevel) {
      if (spellLevel >= 1) {
        const surgeRoll = Math.floor(Math.random() * 20) + 1;
        debug2.log(`\u{1F300} Wild Magic: Rolled ${surgeRoll} for surge check`);
        if (surgeRoll === 1) {
          const surgeTableRoll = Math.floor(Math.random() * 100) + 1;
          const effect = WILD_MAGIC_EFFECTS[surgeTableRoll - 1];
          debug2.log(`\u{1F300} Wild Magic: SURGE! d100 = ${surgeTableRoll}: ${effect}`);
          showWildMagicSurgePopup(surgeTableRoll, effect);
          return true;
        } else {
          showNotification(`\u{1F300} Wild Magic check: ${surgeRoll} (no surge)`, "info");
        }
      }
      return false;
    },
    onRoll: function(rollResult, rollType, rollName) {
      return false;
    }
  };
  var BardicInspiration = {
    name: "Bardic Inspiration",
    description: "You can inspire others through stirring words or music. As a bonus action, grant an ally a Bardic Inspiration die they can add to an ability check, attack roll, or saving throw.",
    onRoll: function(rollResult, rollType, rollName) {
      debug2.log(`\u{1F3B5} Bardic Inspiration onRoll called with: ${rollResult}, ${rollType}, ${rollName}`);
      if (rollType && rollType.includes("d20")) {
        debug2.log(`\u{1F3B5} Bardic Inspiration: Checking if we should offer inspiration for ${rollName}`);
        const inspirationResource = getBardicInspirationResource();
        if (!inspirationResource || inspirationResource.current <= 0) {
          debug2.log(`\u{1F3B5} Bardic Inspiration: No uses available (${inspirationResource?.current || 0})`);
          return false;
        }
        debug2.log(`\u{1F3B5} Bardic Inspiration: Has ${inspirationResource.current} uses available`);
        const level = characterData.level || 1;
        const inspirationDie = level < 5 ? "d6" : level < 10 ? "d8" : level < 15 ? "d10" : "d12";
        debug2.log(`\u{1F3B5} Bardic Inspiration: TRIGGERED! Offering ${inspirationDie}`);
        try {
          showBardicInspirationPopup({
            rollResult: parseInt(rollResult),
            baseRoll: parseInt(rollResult),
            rollType,
            rollName,
            inspirationDie,
            usesRemaining: inspirationResource.current
          });
        } catch (error) {
          debug2.error("\u274C Error showing Bardic Inspiration popup:", error);
          showNotification(`\u{1F3B5} Bardic Inspiration available! (${inspirationDie})`, "info");
        }
        return true;
      }
      debug2.log(`\u{1F3B5} Bardic Inspiration: No trigger - Type: ${rollType}`);
      return false;
    }
  };
  function getBardicInspirationResource() {
    if (!characterData || !characterData.resources) {
      debug2.log("\u{1F3B5} No characterData or resources for Bardic Inspiration detection");
      return null;
    }
    const inspirationResource = characterData.resources.find((r) => {
      const lowerName = r.name.toLowerCase().trim();
      return lowerName.includes("bardic inspiration") || lowerName === "bardic inspiration" || lowerName === "inspiration" || lowerName.includes("inspiration die") || lowerName.includes("inspiration dice");
    });
    if (inspirationResource) {
      debug2.log(`\u{1F3B5} Found Bardic Inspiration resource: ${inspirationResource.name} (${inspirationResource.current}/${inspirationResource.max})`);
    } else {
      debug2.log("\u{1F3B5} No Bardic Inspiration resource found in character data");
    }
    return inspirationResource;
  }
  function useBardicInspiration() {
    debug2.log("\u{1F3B5} useBardicInspiration called");
    const inspirationResource = getBardicInspirationResource();
    debug2.log("\u{1F3B5} Bardic Inspiration resource found:", inspirationResource);
    if (!inspirationResource) {
      debug2.error("\u274C No Bardic Inspiration resource found");
      return false;
    }
    if (inspirationResource.current <= 0) {
      debug2.error(`\u274C No Bardic Inspiration uses available (current: ${inspirationResource.current})`);
      return false;
    }
    const oldCurrent = inspirationResource.current;
    inspirationResource.current--;
    debug2.log(`\u2705 Used Bardic Inspiration (${oldCurrent} \u2192 ${inspirationResource.current})`);
    browserAPI.storage.local.set({ characterData });
    buildResourcesDisplay();
    return true;
  }
  function getLuckyResource() {
    if (!characterData || !characterData.resources) {
      debug2.log("\u{1F396}\uFE0F No characterData or resources for Lucky detection");
      return null;
    }
    const luckyResource = characterData.resources.find((r) => {
      const lowerName = r.name.toLowerCase().trim();
      return lowerName.includes("lucky point") || lowerName.includes("luck point") || lowerName === "lucky points" || lowerName === "lucky";
    });
    if (luckyResource) {
      debug2.log(`\u{1F396}\uFE0F Found Lucky resource: ${luckyResource.name} (${luckyResource.current}/${luckyResource.max})`);
    } else {
      debug2.log("\u{1F396}\uFE0F No Lucky resource found in character data");
    }
    return luckyResource;
  }
  function useLuckyPoint() {
    debug2.log("\u{1F396}\uFE0F useLuckyPoint called");
    const luckyResource = getLuckyResource();
    debug2.log("\u{1F396}\uFE0F Lucky resource found:", luckyResource);
    if (!luckyResource) {
      debug2.error("\u274C No Lucky resource found");
      return false;
    }
    if (luckyResource.current <= 0) {
      debug2.error(`\u274C No Lucky points available (current: ${luckyResource.current})`);
      return false;
    }
    const oldCurrent = luckyResource.current;
    luckyResource.current--;
    debug2.log(`\u{1F396}\uFE0F Used Lucky point. ${oldCurrent} \u2192 ${luckyResource.current}/${luckyResource.max}`);
    saveCharacterData();
    buildResourcesDisplay();
    updateLuckyButtonText();
    debug2.log("\u{1F396}\uFE0F Lucky button updated and character data saved");
    return true;
  }
  function updateLuckyButtonText() {
    const luckyButton = document.querySelector("#lucky-action-button");
    if (luckyButton) {
      const luckyResource = getLuckyResource();
      const luckPointsAvailable = luckyResource ? luckyResource.current : 0;
      luckyButton.innerHTML = `
      <span style="font-size: 16px;">\u{1F396}\uFE0F</span>
      <span>Use Lucky Point (${luckPointsAvailable}/3)</span>
    `;
      debug2.log(`\u{1F396}\uFE0F Lucky button updated to show ${luckPointsAvailable}/3`);
    }
  }
  function saveWindowSize() {
    const width = window.outerWidth;
    const height = window.outerHeight;
    browserAPI.storage.local.set({
      popupWindowSize: { width, height }
    });
    debug2.log(`\u{1F4BE} Saved window size: ${width}x${height}`);
  }
  async function loadWindowSize() {
    try {
      const result2 = await browserAPI.storage.local.get(["popupWindowSize"]);
      if (result2.popupWindowSize) {
        const { width, height } = result2.popupWindowSize;
        window.resizeTo(width, height);
        debug2.log(`\u{1F4D0} Restored window size: ${width}x${height}`);
      }
    } catch (error) {
      debug2.warn("\u26A0\uFE0F Could not restore window size:", error);
    }
  }
  function initWindowSizeTracking() {
    loadWindowSize();
    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        saveWindowSize();
      }, 500);
    });
    debug2.log("\u{1F4D0} Window size tracking initialized");
  }
  if (domReady) {
    initWindowSizeTracking();
  } else {
    pendingOperations.push(initWindowSizeTracking);
  }
  var customMacros = [];
  async function loadCustomMacros() {
    try {
      const result2 = await browserAPI.storage.local.get(["customMacros"]);
      customMacros = result2.customMacros || [];
      debug2.log(`\u{1F3B2} Loaded ${customMacros.length} custom macros`);
      updateMacrosDisplay();
    } catch (error) {
      debug2.error("\u274C Failed to load custom macros:", error);
    }
  }
  function saveAllCustomMacros() {
    browserAPI.storage.local.set({ customMacros });
    debug2.log(`\u{1F4BE} Saved ${customMacros.length} custom macros`);
  }
  function addCustomMacro(name, formula2, description = "") {
    const macro = {
      id: Date.now().toString(),
      name,
      formula: formula2,
      description,
      createdAt: Date.now()
    };
    customMacros.push(macro);
    saveAllCustomMacros();
    updateMacrosDisplay();
    debug2.log(`\u2705 Added custom macro: ${name} (${formula2})`);
    return macro;
  }
  function deleteCustomMacro(macroId) {
    customMacros = customMacros.filter((m) => m.id !== macroId);
    saveAllCustomMacros();
    updateMacrosDisplay();
    debug2.log(`\u{1F5D1}\uFE0F Deleted macro: ${macroId}`);
  }
  function executeMacro(macro) {
    debug2.log(`\u{1F3B2} Executing macro: ${macro.name} (${macro.formula})`);
    announceAction(
      macro.name,
      macro.formula,
      "",
      macro.description || `Custom macro: ${macro.formula}`
    );
  }
  function updateMacrosDisplay() {
    const container = document.getElementById("custom-macros-container");
    if (!container)
      return;
    if (customMacros.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #888; padding: 15px;">No custom macros yet. Click "Add Macro" to create one.</p>';
      return;
    }
    container.innerHTML = customMacros.map((macro) => `
    <div class="macro-item" style="
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.2s;
    ">
      <div style="flex: 1;">
        <div style="font-weight: bold; color: var(--text-primary); margin-bottom: 4px;">
          ${macro.name}
        </div>
        <div style="font-family: monospace; color: var(--accent-info); font-size: 0.9em; margin-bottom: 4px;">
          ${macro.formula}
        </div>
        ${macro.description ? `<div style="font-size: 0.85em; color: var(--text-secondary);">${macro.description}</div>` : ""}
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="macro-roll-btn" data-macro-id="${macro.id}" style="
          background: var(--accent-primary);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.2s;
        ">
          \u{1F3B2} Roll
        </button>
        <button class="macro-delete-btn" data-macro-id="${macro.id}" style="
          background: var(--accent-danger);
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        ">
          \u{1F5D1}\uFE0F
        </button>
      </div>
    </div>
  `).join("");
    container.querySelectorAll(".macro-roll-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const macroId = btn.dataset.macroId;
        const macro = customMacros.find((m) => m.id === macroId);
        if (macro)
          executeMacro(macro);
      });
    });
    container.querySelectorAll(".macro-delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const macroId = btn.dataset.macroId;
        const macro = customMacros.find((m) => m.id === macroId);
        if (macro && confirm(`Delete macro "${macro.name}"?`)) {
          deleteCustomMacro(macroId);
        }
      });
    });
  }
  function showSettingsModal() {
    const existingModal = document.getElementById("settings-modal");
    if (existingModal) {
      document.body.removeChild(existingModal);
    }
    const modal = document.createElement("div");
    modal.id = "settings-modal";
    modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
    modal.innerHTML = `
    <div style="
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      border-radius: 12px;
      max-width: 700px;
      width: 90%;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    ">
      <!-- Header -->
      <div style="
        padding: 20px;
        border-bottom: 2px solid var(--border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <h3 style="margin: 0; color: var(--text-primary);">\u2699\uFE0F Settings</h3>
        <button id="settings-close-btn" style="
          background: var(--accent-danger);
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
        ">\u2715</button>
      </div>
      
      <!-- Tabs -->
      <div style="
        display: flex;
        border-bottom: 2px solid var(--border-color);
        background: var(--bg-tertiary);
      ">
        <button class="settings-tab active" data-tab="theme" style="
          flex: 1;
          padding: 12px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-weight: bold;
          color: var(--text-secondary);
          transition: all 0.2s;
        ">\u{1F3A8} Theme</button>
        <button class="settings-tab" data-tab="macros" style="
          flex: 1;
          padding: 12px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-weight: bold;
          color: var(--text-secondary);
          transition: all 0.2s;
        ">\u{1F3B2} Custom Macros</button>
        <button class="settings-tab" data-tab="gm" style="
          flex: 1;
          padding: 12px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-weight: bold;
          color: var(--text-secondary);
          transition: all 0.2s;
        ">\u{1F451} GM Integration</button>
      </div>
      
      <!-- Content -->
      <div style="
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      ">
        <!-- Theme Tab -->
        <div id="theme-tab-content" class="settings-tab-content">
          <h4 style="margin: 0 0 15px 0; color: var(--text-primary);">Choose Theme</h4>
          <div style="display: flex; gap: 15px; margin-bottom: 20px;">
            <button class="theme-option" data-theme="light" style="
              flex: 1;
              padding: 20px;
              background: var(--bg-primary);
              border: 3px solid var(--border-color);
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 8px;
            ">
              <span style="font-size: 2em;">\u2600\uFE0F</span>
              <span style="font-weight: bold; color: var(--text-primary);">Light</span>
            </button>
            <button class="theme-option" data-theme="dark" style="
              flex: 1;
              padding: 20px;
              background: var(--bg-primary);
              border: 3px solid var(--border-color);
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 8px;
            ">
              <span style="font-size: 2em;">\u{1F319}</span>
              <span style="font-weight: bold; color: var(--text-primary);">Dark</span>
            </button>
            <button class="theme-option active" data-theme="system" style="
              flex: 1;
              padding: 20px;
              background: var(--bg-primary);
              border: 3px solid var(--accent-primary);
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 8px;
            ">
              <span style="font-size: 2em;">\u{1F4BB}</span>
              <span style="font-weight: bold; color: var(--text-primary);">System</span>
            </button>
          </div>
          <p style="color: var(--text-secondary); font-size: 0.9em; margin: 0;">
            System theme automatically matches your operating system's appearance settings.
          </p>
        </div>
        
        <!-- Macros Tab -->
        <div id="macros-tab-content" class="settings-tab-content" style="display: none;">
          <!-- Setting: Show gear buttons on spells -->
          <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 8px; margin-bottom: 15px;">
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
              <input type="checkbox" id="show-macro-buttons-setting" style="width: 18px; height: 18px;" ${showCustomMacroButtons ? "checked" : ""}>
              <span style="color: var(--text-primary); font-weight: bold;">Show \u2699\uFE0F macro buttons on spells</span>
            </label>
            <p style="margin: 8px 0 0 28px; color: var(--text-secondary); font-size: 0.85em;">
              When enabled, shows a gear button on each spell to configure custom Roll20 macros.
            </p>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h4 style="margin: 0; color: var(--text-primary);">Your Custom Macros</h4>
            <button id="add-macro-btn-settings" style="
              padding: 8px 16px;
              background: var(--accent-primary);
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-weight: bold;
            ">\u2795 Add Macro</button>
          </div>
          <div id="custom-macros-container-settings"></div>
        </div>
        
        <!-- GM Integration Tab -->
        <div id="gm-tab-content" class="settings-tab-content" style="display: none;">
          <h4 style="margin: 0 0 15px 0; color: var(--text-primary);">\u{1F451} GM Integration</h4>

          <!-- DiceCloud Sync Section -->
          <div id="dicecloud-sync-section" style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px; margin-bottom: 20px; display: none;">
            <h5 style="margin: 0 0 10px 0; color: var(--text-primary);">\u{1F504} DiceCloud Sync</h5>
            <p style="margin: 0 0 15px 0; color: var(--text-secondary); font-size: 0.9em;">
              Manually sync all character data to DiceCloud. This updates HP, spell slots, Channel Divinity, class resources, and all other tracked values.
            </p>
            <button id="manual-sync-btn" style="
              background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
              color: white;
              border: none;
              border-radius: 8px;
              padding: 12px 24px;
              font-size: 1em;
              font-weight: bold;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              width: 100%;
            ">
              \u{1F504} Sync to DiceCloud Now
            </button>
            <div id="sync-status" style="margin-top: 10px; padding: 8px; border-radius: 6px; font-size: 0.9em; display: none;"></div>
          </div>

          <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <h5 style="margin: 0 0 10px 0; color: var(--text-primary);">Share Character with GM</h5>
            <p style="margin: 0 0 15px 0; color: var(--text-secondary); font-size: 0.9em;">
              Share your complete character sheet with the Game Master. This sends all your character data including abilities, skills, actions, spells, and equipment.
            </p>
            <button id="show-to-gm-btn" class="show-to-gm-btn" style="
              background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
              color: white;
              border: none;
              border-radius: 8px;
              padding: 12px 24px;
              font-size: 1em;
              font-weight: bold;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              width: 100%;
            ">
              \u{1F451} Share Character with GM
            </button>
          </div>
          
          <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <h5 style="margin: 0 0 10px 0; color: var(--text-primary);">How It Works</h5>
            <ul style="margin: 0; padding-left: 20px; color: var(--text-secondary); font-size: 0.9em;">
              <li>Click the button above to share your character</li>
              <li>Your character data appears in the Roll20 chat</li>
              <li>The GM receives your complete character sheet</li>
              <li>GM can view your stats, actions, and spells</li>
              <li>Helps GM track party composition and abilities</li>
            </ul>
          </div>
          
          <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px;">
            <h5 style="margin: 0 0 10px 0; color: var(--text-primary);">Privacy Note</h5>
            <p style="margin: 0; color: var(--text-secondary); font-size: 0.9em;">
              Only share character data when requested by your GM. The shared data includes your complete character sheet for game management purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
    document.body.appendChild(modal);
    modal.querySelectorAll(".settings-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const tabName = tab.dataset.tab;
        modal.querySelectorAll(".settings-tab").forEach((t) => {
          t.classList.remove("active");
          t.style.color = "var(--text-secondary)";
          t.style.background = "transparent";
        });
        tab.classList.add("active");
        tab.style.color = "var(--text-primary)";
        tab.style.background = "var(--bg-secondary)";
        modal.querySelectorAll(".settings-tab-content").forEach((content) => {
          content.style.display = "none";
        });
        modal.querySelector(`#${tabName}-tab-content`).style.display = "block";
      });
    });
    const currentTheme = import_theme_manager.default.getCurrentTheme();
    modal.querySelectorAll(".theme-option").forEach((option) => {
      if (option.dataset.theme === currentTheme) {
        option.style.borderColor = "var(--accent-primary)";
        option.classList.add("active");
      }
      option.addEventListener("click", () => {
        const theme = option.dataset.theme;
        import_theme_manager.default.setTheme(theme);
        modal.querySelectorAll(".theme-option").forEach((opt) => {
          opt.style.borderColor = "var(--border-color)";
          opt.classList.remove("active");
        });
        option.style.borderColor = "var(--accent-primary)";
        option.classList.add("active");
      });
    });
    updateMacrosDisplayInSettings();
    initShowToGM();
    initManualSyncButton();
    modal.querySelector("#add-macro-btn-settings").addEventListener("click", () => {
      showAddMacroModal();
    });
    const macroButtonsCheckbox = modal.querySelector("#show-macro-buttons-setting");
    if (macroButtonsCheckbox) {
      macroButtonsCheckbox.addEventListener("change", (e) => {
        showCustomMacroButtons = e.target.checked;
        localStorage.setItem("showCustomMacroButtons", showCustomMacroButtons ? "true" : "false");
        debug2.log(`\u2699\uFE0F Custom macro buttons ${showCustomMacroButtons ? "enabled" : "disabled"}`);
        rebuildSpells();
      });
    }
    modal.querySelector("#settings-close-btn").addEventListener("click", () => {
      document.body.removeChild(modal);
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }
  function showAddMacroModal() {
    const modal = document.createElement("div");
    modal.id = "add-macro-modal";
    modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
  `;
    modal.innerHTML = `
    <div style="
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      border-radius: 12px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    ">
      <h3 style="margin: 0 0 20px 0; color: var(--text-primary);">\u{1F3B2} Add Custom Macro</h3>
      
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 6px; font-weight: bold; color: var(--text-primary);">
          Macro Name
        </label>
        <input type="text" id="macro-name-input" placeholder="e.g., Sneak Attack" style="
          width: 100%;
          padding: 10px;
          border: 2px solid var(--border-color);
          border-radius: 6px;
          font-size: 14px;
          background: var(--bg-primary);
          color: var(--text-primary);
        ">
      </div>
      
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 6px; font-weight: bold; color: var(--text-primary);">
          Roll Formula
        </label>
        <input type="text" id="macro-formula-input" placeholder="e.g., 3d6" style="
          width: 100%;
          padding: 10px;
          border: 2px solid var(--border-color);
          border-radius: 6px;
          font-size: 14px;
          font-family: monospace;
          background: var(--bg-primary);
          color: var(--text-primary);
        ">
        <small style="color: var(--text-secondary); font-size: 0.85em;">
          Examples: 1d20+5, 2d6+3, 8d6, 1d20+dexterity.modifier
        </small>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 6px; font-weight: bold; color: var(--text-primary);">
          Description (optional)
        </label>
        <input type="text" id="macro-description-input" placeholder="e.g., Extra damage on hit" style="
          width: 100%;
          padding: 10px;
          border: 2px solid var(--border-color);
          border-radius: 6px;
          font-size: 14px;
          background: var(--bg-primary);
          color: var(--text-primary);
        ">
      </div>
      
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="macro-cancel-btn" style="
          padding: 10px 20px;
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border: 2px solid var(--border-color);
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
        ">
          Cancel
        </button>
        <button id="macro-save-btn" style="
          padding: 10px 20px;
          background: var(--accent-primary);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
        ">
          Save Macro
        </button>
      </div>
    </div>
  `;
    document.body.appendChild(modal);
    document.getElementById("macro-name-input").focus();
    document.getElementById("macro-cancel-btn").addEventListener("click", () => {
      document.body.removeChild(modal);
    });
    document.getElementById("macro-save-btn").addEventListener("click", () => {
      const name = document.getElementById("macro-name-input").value.trim();
      const formula2 = document.getElementById("macro-formula-input").value.trim();
      const description = document.getElementById("macro-description-input").value.trim();
      if (!name || !formula2) {
        alert("Please enter both a name and formula for the macro.");
        return;
      }
      addCustomMacro(name, formula2, description);
      document.body.removeChild(modal);
      updateMacrosDisplayInSettings();
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }
  function updateMacrosDisplayInSettings() {
    const container = document.getElementById("custom-macros-container-settings");
    if (!container)
      return;
    if (customMacros.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #888; padding: 15px;">No custom macros yet. Click "Add Macro" to create one.</p>';
      return;
    }
    container.innerHTML = customMacros.map((macro) => `
    <div class="macro-item" style="
      background: var(--bg-primary);
      border: 2px solid var(--border-color);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.2s;
    ">
      <div style="flex: 1;">
        <div style="font-weight: bold; color: var(--text-primary); margin-bottom: 4px;">
          ${macro.name}
        </div>
        <div style="font-family: monospace; color: var(--accent-info); font-size: 0.9em; margin-bottom: 4px;">
          ${macro.formula}
        </div>
        ${macro.description ? `<div style="font-size: 0.85em; color: var(--text-secondary);">${macro.description}</div>` : ""}
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="macro-roll-btn" data-macro-id="${macro.id}" style="
          background: var(--accent-primary);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.2s;
        ">
          \u{1F3B2} Roll
        </button>
        <button class="macro-delete-btn" data-macro-id="${macro.id}" style="
          background: var(--accent-danger);
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        ">
          \u{1F5D1}\uFE0F
        </button>
      </div>
    </div>
  `).join("");
    container.querySelectorAll(".macro-roll-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const macroId = btn.dataset.macroId;
        const macro = customMacros.find((m) => m.id === macroId);
        if (macro) {
          executeMacro(macro);
          const settingsModal = document.getElementById("settings-modal");
          if (settingsModal) {
            document.body.removeChild(settingsModal);
          }
        }
      });
    });
    container.querySelectorAll(".macro-delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const macroId = btn.dataset.macroId;
        const macro = customMacros.find((m) => m.id === macroId);
        if (macro && confirm(`Delete macro "${macro.name}"?`)) {
          deleteCustomMacro(macroId);
          updateMacrosDisplayInSettings();
        }
      });
    });
  }
  function initCustomMacros() {
    loadCustomMacros();
    const savedSetting = localStorage.getItem("showCustomMacroButtons");
    showCustomMacroButtons = savedSetting === "true";
    debug2.log(`\u2699\uFE0F Custom macro buttons setting: ${showCustomMacroButtons ? "enabled" : "disabled"}`);
    debug2.log("\u{1F3B2} Custom macros system initialized");
  }
  function initSettingsButton() {
    const settingsBtn = document.getElementById("settings-btn");
    if (settingsBtn) {
      settingsBtn.addEventListener("click", showSettingsModal);
      debug2.log("\u2699\uFE0F Settings button initialized");
    }
  }
  if (window.opener && !characterData) {
    window.opener.postMessage({ action: "requestCharacterData" }, "*");
    debug2.log("\u{1F4CB} Requested character data from parent window");
  }
  if (domReady) {
    initCustomMacros();
    initSettingsButton();
  } else {
    pendingOperations.push(initCustomMacros);
    pendingOperations.push(initSettingsButton);
  }
})();
//# sourceMappingURL=popup-sheet.js.map
