(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined")
      return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __commonJS = (cb, mod) => function __require2() {
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

  // ../core/src/common/debug.js
  var require_debug = __commonJS({
    "../core/src/common/debug.js"(exports, module) {
      "use strict";
      var DEBUG = true;
      var debug2 = {
        /**
         * General debug information
         * Only logged when DEBUG = true
         */
        log: (...args) => {
          if (DEBUG) {
            console.log(...args);
          }
        },
        /**
         * Warning messages
         * Only logged when DEBUG = true
         */
        warn: (...args) => {
          if (DEBUG) {
            console.warn(...args);
          }
        },
        /**
         * Error messages
         * ALWAYS logged, regardless of DEBUG mode
         */
        error: (...args) => {
          console.error(...args);
        },
        /**
         * Info messages (less noisy than log)
         * Only logged when DEBUG = true
         */
        info: (...args) => {
          if (DEBUG) {
            console.info(...args);
          }
        },
        /**
         * Group logs together for better readability
         * Only when DEBUG = true
         */
        group: (label, ...args) => {
          if (DEBUG) {
            console.group(label, ...args);
          }
        },
        groupEnd: () => {
          if (DEBUG) {
            console.groupEnd();
          }
        },
        /**
         * Table output for structured data
         * Only when DEBUG = true
         */
        table: (data) => {
          if (DEBUG) {
            console.table(data);
          }
        },
        /**
         * Performance timing
         * Only when DEBUG = true
         */
        time: (label) => {
          if (DEBUG) {
            console.time(label);
          }
        },
        timeEnd: (label) => {
          if (DEBUG) {
            console.timeEnd(label);
          }
        },
        /**
         * Check if debug mode is enabled
         */
        isEnabled: () => DEBUG
      };
      if (typeof module !== "undefined" && module.exports) {
        module.exports = debug2;
      }
      if (typeof window !== "undefined") {
        window.debug = debug2;
      }
      if (typeof self !== "undefined" && !self.window) {
        self.debug = debug2;
      }
    }
  });

  // ../core/src/common/html-utils.js
  var require_html_utils = __commonJS({
    "../core/src/common/html-utils.js"(exports, module) {
      "use strict";
      function escapeHTML(str) {
        if (!str)
          return "";
        if (typeof str !== "string")
          str = String(str);
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
      }
      function validateMessageOrigin(event, allowedOrigins) {
        if (!event || !event.origin) {
          debug.warn("\u274C Invalid message event or missing origin");
          return false;
        }
        const origin = event.origin;
        for (const allowed of allowedOrigins) {
          if (allowed.includes("*")) {
            const pattern = allowed.replace(/\./g, "\\.").replace(/\*/g, "[^.]+");
            const regex = new RegExp("^" + pattern + "$");
            if (regex.test(origin)) {
              debug.log("\u2705 Message origin validated:", origin);
              return true;
            }
          } else {
            if (origin === allowed) {
              debug.log("\u2705 Message origin validated:", origin);
              return true;
            }
          }
        }
        debug.warn("\u274C Rejected message from untrusted origin:", origin);
        return false;
      }
      function createHTMLUtils(config = {}) {
        const allowedOrigins = config.allowedOrigins || [
          "https://dicecloud.com",
          "https://*.dicecloud.com"
        ];
        const defaultOrigin = config.defaultOrigin || "https://dicecloud.com";
        return {
          escapeHTML,
          validateMessageOrigin,
          allowedOrigins,
          /**
           * Safe wrapper for postMessage with explicit origin
           * @param {Window} target - Target window
           * @param {*} message - Message to send
           * @param {string} origin - Target origin (defaults to configured default)
           */
          safePostMessage(target, message, origin = defaultOrigin) {
            if (!target || target.closed) {
              debug.warn("\u26A0\uFE0F Target window is closed or invalid");
              return false;
            }
            try {
              target.postMessage(message, origin);
              debug.log("\u{1F4E4} Message sent to:", origin);
              return true;
            } catch (error) {
              debug.error("\u274C Failed to send message:", error);
              return false;
            }
          },
          /**
           * Create a safe message handler with origin validation
           * @param {Function} handler - Message handler function (receives validated event)
           * @param {string[]} customAllowedOrigins - Optional custom allowed origins
           * @returns {Function} Wrapped handler with validation
           */
          createSafeMessageHandler(handler, customAllowedOrigins = null) {
            const origins = customAllowedOrigins || allowedOrigins;
            return function(event) {
              if (!validateMessageOrigin(event, origins)) {
                return;
              }
              handler(event);
            };
          }
        };
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = {
          escapeHTML,
          validateMessageOrigin,
          createHTMLUtils
        };
      }
      if (typeof window !== "undefined") {
        window.createHTMLUtils = createHTMLUtils;
      }
    }
  });

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
                const result = await browserAPI.storage.local.get(["theme"]);
                if (result.theme) {
                  this.currentTheme = result.theme;
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

  // ../core/src/supabase/client.js
  var require_client = __commonJS({
    "../core/src/supabase/client.js"(exports, module) {
      "use strict";
      var SUPABASE_URL2 = "https://luiesmfjdcmpywavvfqm.supabase.co";
      var SUPABASE_ANON_KEY2 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWVzbWZqZGNtcHl3YXZ2ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODYxNDksImV4cCI6MjA4NTQ2MjE0OX0.oqjHFf2HhCLcanh0HVryoQH7iSV7E9dHHZJdYehxZ0U";
      var SupabaseTokenManager = class {
        constructor() {
          this.supabaseUrl = SUPABASE_URL2;
          this.supabaseKey = SUPABASE_ANON_KEY2;
          this.tableName = "auth_tokens";
          this.characterCache = /* @__PURE__ */ new Map();
          this.cacheExpiryMs = 60 * 60 * 1e3;
          this.persistentCacheExpiryMs = 24 * 60 * 60 * 1e3;
          this.cacheStorageKey = "owlcloud_character_cache";
          this.loadPersistentCache();
        }
        /**
         * Generate a unique user ID based on browser fingerprint
         * Uses a persistent stored ID if available to survive browser updates/resolution changes
         */
        generateUserId() {
          if (this._cachedUserId) {
            return this._cachedUserId;
          }
          return this._generateFingerprintUserId();
        }
        /**
         * Generate fingerprint-based user ID (internal helper)
         */
        _generateFingerprintUserId() {
          const fingerprint = [
            navigator.userAgent,
            navigator.language,
            // Use fallback for screen in service workers
            typeof screen !== "undefined" ? screen.width + "x" + screen.height : "unknown",
            (/* @__PURE__ */ new Date()).getTimezoneOffset()
          ].join("|");
          let hash = 0;
          for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
          }
          return "user_" + Math.abs(hash).toString(36);
        }
        /**
         * Get or create a persistent user ID that survives browser updates
         * This prevents auth loss when Firefox updates change the userAgent
         */
        async getOrCreatePersistentUserId() {
          try {
            const stored = await browserAPI.storage.local.get(["persistentBrowserUserId"]);
            if (stored.persistentBrowserUserId) {
              this._cachedUserId = stored.persistentBrowserUserId;
              return stored.persistentBrowserUserId;
            }
            const newId = this._generateFingerprintUserId();
            await browserAPI.storage.local.set({ persistentBrowserUserId: newId });
            this._cachedUserId = newId;
            debug.log("\u{1F511} Created persistent browser user ID:", newId);
            return newId;
          } catch (error) {
            debug.error("Failed to get/create persistent user ID:", error);
            return this._generateFingerprintUserId();
          }
        }
        /**
         * Generate a unique session ID for this browser instance
         */
        generateSessionId() {
          const sessionData = [
            navigator.userAgent,
            navigator.language,
            // Use fallback for screen in service workers
            typeof screen !== "undefined" ? screen.width + "x" + screen.height : "unknown",
            (/* @__PURE__ */ new Date()).getTimezoneOffset(),
            Math.random().toString(36),
            Date.now().toString(36)
          ].join("|");
          let hash = 0;
          for (let i = 0; i < sessionData.length; i++) {
            const char = sessionData.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
          }
          return "session_" + Math.abs(hash).toString(36);
        }
        /**
         * Normalize date to ISO 8601 format for PostgreSQL
         * Handles Meteor date formats like "Sat Jan 25 2025 12:00:00 GMT+0300"
         */
        normalizeDate(dateValue) {
          if (!dateValue)
            return null;
          try {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) {
              debug.warn("\u26A0\uFE0F Invalid date value:", dateValue);
              return null;
            }
            return date.toISOString();
          } catch (e) {
            debug.warn("\u26A0\uFE0F Failed to normalize date:", dateValue, e);
            return null;
          }
        }
        /**
         * Store auth token in Supabase
         */
        async storeToken(tokenData) {
          try {
            debug.log("\u{1F310} Storing token in Supabase...");
            await browserAPI.storage.local.remove(["sessionInvalidated", "sessionConflict"]);
            const visitorId = await this.getOrCreatePersistentUserId();
            const sessionId = this.generateSessionId();
            if (tokenData.userId) {
              await this.invalidateOtherSessions(tokenData.userId, sessionId);
            }
            const conflictCheck = await this.checkForTokenConflicts(visitorId, tokenData.token);
            if (conflictCheck.hasConflict) {
              debug.log("\u26A0\uFE0F Token conflict detected - different browser logged in");
              await this.storeConflictInfo(conflictCheck);
            }
            const normalizedTokenExpires = this.normalizeDate(tokenData.tokenExpires);
            const payload = {
              user_id: visitorId,
              // Browser fingerprint for cross-session lookup
              session_id: sessionId,
              // Unique session identifier
              dicecloud_token: tokenData.token,
              username: tokenData.username || "DiceCloud User",
              user_id_dicecloud: tokenData.userId,
              // Store DiceCloud ID separately
              token_expires: normalizedTokenExpires,
              browser_info: {
                userAgent: navigator.userAgent,
                authId: tokenData.authId,
                // Store authId in browser_info for reference
                timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                sessionId
              },
              updated_at: (/* @__PURE__ */ new Date()).toISOString(),
              last_seen: (/* @__PURE__ */ new Date()).toISOString(),
              // Clear any previous invalidation (this is a fresh login)
              invalidated_at: null,
              invalidated_by_session: null,
              invalidated_reason: null
            };
            if (tokenData.discordUserId) {
              payload.discord_user_id = tokenData.discordUserId;
            }
            if (tokenData.discordUsername) {
              payload.discord_username = tokenData.discordUsername;
            }
            if (tokenData.discordGlobalName) {
              payload.discord_global_name = tokenData.discordGlobalName;
            }
            debug.log("\u{1F310} Storing with browser ID:", visitorId, "Session ID:", sessionId, "DiceCloud ID:", tokenData.authId);
            if (tokenData.discordUserId) {
              debug.log("\u{1F517} Linking Discord account:", tokenData.discordUsername);
            }
            const response = await fetch(`${this.supabaseUrl}/rest/v1/${this.tableName}`, {
              method: "POST",
              headers: {
                "apikey": this.supabaseKey,
                "Authorization": `Bearer ${this.supabaseKey}`,
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=minimal"
              },
              body: JSON.stringify(payload)
            });
            debug.log("\u{1F4E5} Supabase POST response status:", response.status);
            if (!response.ok) {
              const errorText = await response.text();
              debug.log("\u26A0\uFE0F Supabase POST failed, trying PATCH. Error:", response.status, errorText);
              const updatePayload = {
                dicecloud_token: tokenData.token,
                username: tokenData.username || "DiceCloud User",
                user_id_dicecloud: tokenData.userId,
                token_expires: normalizedTokenExpires,
                session_id: sessionId,
                // Update session ID to match local storage
                browser_info: {
                  userAgent: navigator.userAgent,
                  authId: tokenData.authId,
                  timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                  sessionId
                },
                updated_at: (/* @__PURE__ */ new Date()).toISOString(),
                last_seen: (/* @__PURE__ */ new Date()).toISOString(),
                // Clear any previous invalidation (this is a fresh login)
                invalidated_at: null,
                invalidated_by_session: null,
                invalidated_reason: null
              };
              if (tokenData.discordUserId) {
                updatePayload.discord_user_id = tokenData.discordUserId;
              }
              if (tokenData.discordUsername) {
                updatePayload.discord_username = tokenData.discordUsername;
              }
              if (tokenData.discordGlobalName) {
                updatePayload.discord_global_name = tokenData.discordGlobalName;
              }
              const updateResponse = await fetch(`${this.supabaseUrl}/rest/v1/${this.tableName}?user_id=eq.${visitorId}`, {
                method: "PATCH",
                headers: {
                  "apikey": this.supabaseKey,
                  "Authorization": `Bearer ${this.supabaseKey}`,
                  "Content-Type": "application/json",
                  "Prefer": "return=minimal"
                },
                body: JSON.stringify(updatePayload)
              });
              debug.log("\u{1F4E5} Supabase PATCH response status:", updateResponse.status);
              if (!updateResponse.ok) {
                const patchErrorText = await updateResponse.text();
                debug.error("\u274C Supabase PATCH also failed:", updateResponse.status, patchErrorText);
                throw new Error(`Supabase update failed: ${updateResponse.status} - ${patchErrorText}`);
              }
            }
            await this.storeCurrentSession(sessionId);
            debug.log("\u2705 Token stored in Supabase successfully");
            return { success: true };
          } catch (error) {
            debug.error("\u274C Failed to store token in Supabase:", error);
            return { success: false, error: error.message };
          }
        }
        /**
         * Retrieve auth token from Supabase
         */
        async retrieveToken() {
          try {
            debug.log("\u{1F310} Retrieving token from Supabase...");
            const userId = await this.getOrCreatePersistentUserId();
            debug.log("\u{1F50D} Using persistent user ID for lookup:", userId);
            const url = `${this.supabaseUrl}/rest/v1/${this.tableName}?user_id=eq.${userId}&select=*`;
            debug.log("\u{1F310} Supabase query URL:", url);
            const response = await fetch(url, {
              method: "GET",
              headers: {
                "apikey": this.supabaseKey,
                "Authorization": `Bearer ${this.supabaseKey}`,
                "Content-Type": "application/json"
              }
            });
            debug.log("\u{1F4E5} Supabase response status:", response.status);
            debug.log("\u{1F4E5} Supabase response headers:", response.headers);
            if (!response.ok) {
              const errorText = await response.text();
              debug.error("\u274C Supabase fetch failed:", response.status, errorText);
              throw new Error(`Supabase fetch failed: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            debug.log("\u{1F4E6} Supabase response data:", data);
            if (data && data.length > 0) {
              const tokenData = data[0];
              debug.log("\u{1F50D} Found token data:", tokenData);
              if (tokenData.invalidated_at) {
                debug.log("\u{1F6AB} Session was invalidated at:", tokenData.invalidated_at);
                debug.log("\u{1F6AB} Invalidated reason:", tokenData.invalidated_reason);
                await browserAPI.storage.local.remove(["diceCloudToken", "diceCloudUserId", "tokenExpires", "username", "currentSessionId"]);
                await browserAPI.storage.local.set({
                  sessionInvalidated: {
                    at: tokenData.invalidated_at,
                    reason: tokenData.invalidated_reason || "logged_in_elsewhere",
                    bySession: tokenData.invalidated_by_session
                  }
                });
                await this.deleteToken();
                return {
                  success: false,
                  error: "Session invalidated",
                  invalidated: true,
                  reason: tokenData.invalidated_reason || "Another browser logged in with this account"
                };
              }
              if (tokenData.token_expires) {
                const expiryDate = new Date(tokenData.token_expires);
                const now = /* @__PURE__ */ new Date();
                debug.log("\u23F0 Token expiry check:", { expiryDate, now, expired: now >= expiryDate });
                if (now >= expiryDate) {
                  debug.log("\u26A0\uFE0F Supabase token expired, removing...");
                  await this.deleteToken();
                  return { success: false, error: "Token expired" };
                }
              }
              if (tokenData.session_id) {
                await this.storeCurrentSession(tokenData.session_id);
                debug.log("\u{1F4BE} Restored session ID from Supabase:", tokenData.session_id);
              }
              debug.log("\u2705 Token retrieved from Supabase");
              return {
                success: true,
                token: tokenData.dicecloud_token,
                username: tokenData.username,
                userId: tokenData.user_id_dicecloud,
                tokenExpires: tokenData.token_expires,
                discordUserId: tokenData.discord_user_id,
                discordUsername: tokenData.discord_username,
                discordGlobalName: tokenData.discord_global_name
              };
            } else {
              debug.log("\u2139\uFE0F No token found in Supabase for user:", userId);
              return { success: false, error: "No token found" };
            }
          } catch (error) {
            debug.error("\u274C Failed to retrieve token from Supabase:", error);
            return { success: false, error: error.message };
          }
        }
        /**
         * Get raw token data from database (used for session checks)
         * Returns the full database record without processing
         */
        async getTokenFromDatabase() {
          try {
            debug.log("\u{1F310} Getting raw token data from Supabase...");
            const userId = await this.getOrCreatePersistentUserId();
            debug.log("\u{1F50D} Using persistent user ID:", userId);
            const url = `${this.supabaseUrl}/rest/v1/${this.tableName}?user_id=eq.${userId}&select=*`;
            const response = await fetch(url, {
              method: "GET",
              headers: {
                "apikey": this.supabaseKey,
                "Authorization": `Bearer ${this.supabaseKey}`,
                "Content-Type": "application/json"
              }
            });
            if (!response.ok) {
              const errorText = await response.text();
              debug.error("\u274C Supabase fetch failed:", response.status, errorText);
              return { success: false, error: `Fetch failed: ${response.status}` };
            }
            const data = await response.json();
            if (data && data.length > 0) {
              debug.log("\u2705 Found token data in database");
              return {
                success: true,
                tokenData: data[0]
              };
            } else {
              debug.log("\u2139\uFE0F No token found in database");
              return { success: false, error: "No token found" };
            }
          } catch (error) {
            debug.error("\u274C Failed to get token from database:", error);
            return { success: false, error: error.message };
          }
        }
        /**
         * Delete token from Supabase (logout)
         */
        async deleteToken() {
          try {
            debug.log("\u{1F310} Deleting token from Supabase...");
            const userId = await this.getOrCreatePersistentUserId();
            const response = await fetch(`${this.supabaseUrl}/rest/v1/${this.tableName}?user_id=eq.${userId}`, {
              method: "DELETE",
              headers: {
                "apikey": this.supabaseKey,
                "Authorization": `Bearer ${this.supabaseKey}`,
                "Content-Type": "application/json"
              }
            });
            if (!response.ok) {
              throw new Error(`Supabase delete failed: ${response.status}`);
            }
            debug.log("\u2705 Token deleted from Supabase");
            return { success: true };
          } catch (error) {
            debug.error("\u274C Failed to delete token from Supabase:", error);
            return { success: false, error: error.message };
          }
        }
        /**
         * Store character data in Supabase (alias for storeCharacter)
         * Used by popup for character cloud sync
         */
        async storeCharacterData(characterSyncData) {
          try {
            debug.log("\u{1F3AD} Storing character data in cloud:", characterSyncData.characterId);
            const characterData2 = characterSyncData.characterData;
            const result = await this.storeCharacter(characterData2);
            if (result.success) {
              debug.log("\u2705 Character data stored in cloud successfully");
            } else {
              debug.error("\u274C Failed to store character data in cloud:", result.error);
            }
            return result;
          } catch (error) {
            debug.error("\u274C Error in storeCharacterData:", error);
            return { success: false, error: error.message };
          }
        }
        /**
         * Get character data from Supabase (alias for getCharacter)
         * Used by popup for character cloud sync
         * Implements caching to reduce egress costs
         */
        async getCharacterData(diceCloudUserId, forceRefresh = false) {
          try {
            const cacheKey = `characters_${diceCloudUserId}`;
            if (!forceRefresh) {
              const cached = this.characterCache.get(cacheKey);
              if (cached && Date.now() - cached.timestamp < this.cacheExpiryMs) {
                debug.log("\u{1F4E6} Using cached character data (cache hit)");
                return {
                  success: true,
                  characters: cached.characters,
                  count: cached.count,
                  fromCache: true
                };
              }
            }
            debug.log("\u{1F3AD} Retrieving character data from cloud for user:", diceCloudUserId);
            const response = await fetch(
              `${this.supabaseUrl}/rest/v1/clouds_characters?user_id_dicecloud=eq.${diceCloudUserId}&select=*`,
              {
                headers: {
                  "apikey": this.supabaseKey,
                  "Authorization": `Bearer ${this.supabaseKey}`
                }
              }
            );
            if (!response.ok) {
              throw new Error(`Failed to fetch characters: ${response.status}`);
            }
            const data = await response.json();
            const characters = {};
            data.forEach((character) => {
              characters[character.dicecloud_character_id] = {
                characterData: character,
                timestamp: character.updated_at
              };
            });
            this.characterCache.set(cacheKey, {
              characters,
              count: data.length,
              timestamp: Date.now()
            });
            await this.savePersistentCache();
            debug.log(`\u{1F4E6} Retrieved ${data.length} characters from cloud (cached for 1h memory + 24h storage)`);
            return {
              success: true,
              characters,
              count: data.length,
              fromCache: false
            };
          } catch (error) {
            debug.error("\u274C Failed to get character data:", error);
            return { success: false, error: error.message };
          }
        }
        /**
         * Store character data in Supabase
         * Links character to Discord pairing for bot commands
         */
        async storeCharacter(characterData2, pairingCode = null) {
          try {
            debug.log("\u{1F3AD} Storing character in Supabase:", characterData2.name);
            const payload = {
              user_id_dicecloud: characterData2.dicecloudUserId || characterData2.userId || null,
              dicecloud_character_id: characterData2.id,
              character_name: characterData2.name || "Unknown",
              race: characterData2.race || null,
              class: characterData2.class || null,
              level: characterData2.level || 1,
              alignment: characterData2.alignment || null,
              hit_points: characterData2.hitPoints || { current: 0, max: 0 },
              hit_dice: characterData2.hitDice || { current: 0, max: 0, type: "d8" },
              temporary_hp: characterData2.temporaryHP || 0,
              death_saves: characterData2.deathSaves || { successes: 0, failures: 0 },
              inspiration: characterData2.inspiration || false,
              armor_class: characterData2.armorClass || 10,
              speed: characterData2.speed || 30,
              initiative: characterData2.initiative || 0,
              proficiency_bonus: characterData2.proficiencyBonus || 2,
              attributes: characterData2.attributes || {},
              attribute_mods: characterData2.attributeMods || {},
              saves: characterData2.saves || {},
              skills: characterData2.skills || {},
              spell_slots: characterData2.spellSlots || {},
              resources: characterData2.resources || [],
              conditions: characterData2.conditions || [],
              raw_dicecloud_data: characterData2,
              // Store the FULL character object
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            };
            if (pairingCode) {
              const pairingResponse = await fetch(
                `${this.supabaseUrl}/rest/v1/clouds_pairings?pairing_code=eq.${pairingCode}&select=id,discord_user_id`,
                {
                  headers: {
                    "apikey": this.supabaseKey,
                    "Authorization": `Bearer ${this.supabaseKey}`
                  }
                }
              );
              if (pairingResponse.ok) {
                const pairings = await pairingResponse.json();
                if (pairings.length > 0) {
                  payload.discord_user_id = pairings[0].discord_user_id;
                }
              }
            } else {
              let discordUserId = null;
              try {
                const persistentUserId = await this.getOrCreatePersistentUserId();
                const authResponse = await fetch(
                  `${this.supabaseUrl}/rest/v1/auth_tokens?user_id=eq.${persistentUserId}&select=discord_user_id`,
                  {
                    headers: {
                      "apikey": this.supabaseKey,
                      "Authorization": `Bearer ${this.supabaseKey}`
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
                debug.log("\u26A0\uFE0F Failed to check auth_tokens for Discord user ID:", error.message);
              }
              if (!discordUserId && payload.user_id_dicecloud) {
                try {
                  const pairingResponse = await fetch(
                    `${this.supabaseUrl}/rest/v1/clouds_pairings?dicecloud_user_id=eq.${payload.user_id_dicecloud}&status=eq.connected&select=discord_user_id`,
                    {
                      headers: {
                        "apikey": this.supabaseKey,
                        "Authorization": `Bearer ${this.supabaseKey}`
                      }
                    }
                  );
                  if (pairingResponse.ok) {
                    const pairings = await pairingResponse.json();
                    if (pairings.length > 0 && pairings[0].discord_user_id) {
                      discordUserId = pairings[0].discord_user_id;
                      debug.log("\u2705 Found Discord user ID from pairings:", discordUserId);
                    }
                  }
                } catch (error) {
                  debug.log("\u26A0\uFE0F Failed to check pairings for Discord user ID:", error.message);
                }
              }
              if (discordUserId) {
                payload.discord_user_id = discordUserId;
              } else {
                payload.discord_user_id = "not_linked";
                debug.log("\u26A0\uFE0F No Discord user ID found, using placeholder");
              }
            }
            const response = await fetch(
              `${this.supabaseUrl}/rest/v1/clouds_characters`,
              {
                method: "POST",
                headers: {
                  "apikey": this.supabaseKey,
                  "Authorization": `Bearer ${this.supabaseKey}`,
                  "Content-Type": "application/json",
                  "Prefer": "resolution=merge-duplicates,return=minimal"
                },
                body: JSON.stringify(payload)
              }
            );
            if (!response.ok) {
              const errorText = await response.text();
              debug.log("\u26A0\uFE0F Character POST failed, trying PATCH:", errorText);
              const updateResponse = await fetch(
                `${this.supabaseUrl}/rest/v1/rollcloud_characters?dicecloud_character_id=eq.${characterData2.id}`,
                {
                  method: "PATCH",
                  headers: {
                    "apikey": this.supabaseKey,
                    "Authorization": `Bearer ${this.supabaseKey}`,
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                  },
                  body: JSON.stringify(payload)
                }
              );
              if (!updateResponse.ok) {
                const patchError = await updateResponse.text();
                throw new Error(`Character update failed: ${patchError}`);
              }
            }
            debug.log("\u2705 Character stored in Supabase:", characterData2.name);
            this.invalidateCharacterCache(characterData2.id, payload.user_id_dicecloud, payload.discord_user_id);
            return { success: true };
          } catch (error) {
            debug.error("\u274C Failed to store character:", error);
            return { success: false, error: error.message };
          }
        }
        /**
         * Retrieve character data from Supabase by DiceCloud ID
         * Implements caching to reduce egress costs
         */
        async getCharacter(diceCloudCharacterId, forceRefresh = false) {
          try {
            const cacheKey = `character_${diceCloudCharacterId}`;
            if (!forceRefresh) {
              const cached = this.characterCache.get(cacheKey);
              if (cached && Date.now() - cached.timestamp < this.cacheExpiryMs) {
                debug.log("\u{1F4E6} Using cached character (cache hit)");
                return { success: true, character: cached.character, fromCache: true };
              }
            }
            const response = await fetch(
              `${this.supabaseUrl}/rest/v1/clouds_characters?dicecloud_character_id=eq.${diceCloudCharacterId}&select=*`,
              {
                headers: {
                  "apikey": this.supabaseKey,
                  "Authorization": `Bearer ${this.supabaseKey}`
                }
              }
            );
            if (!response.ok) {
              throw new Error(`Failed to fetch character: ${response.status}`);
            }
            const data = await response.json();
            if (data.length > 0) {
              this.characterCache.set(cacheKey, {
                character: data[0],
                timestamp: Date.now()
              });
              await this.savePersistentCache();
              return { success: true, character: data[0], fromCache: false };
            }
            return { success: false, error: "Character not found" };
          } catch (error) {
            debug.error("\u274C Failed to get character:", error);
            return { success: false, error: error.message };
          }
        }
        /**
         * Get character by Discord user ID (for bot commands)
         * Implements caching to reduce egress costs
         */
        async getCharacterByDiscordUser(discordUserId, forceRefresh = false) {
          try {
            const cacheKey = `discord_${discordUserId}`;
            if (!forceRefresh) {
              const cached = this.characterCache.get(cacheKey);
              if (cached && Date.now() - cached.timestamp < this.cacheExpiryMs) {
                debug.log("\u{1F4E6} Using cached Discord character (cache hit)");
                return { success: true, character: cached.character, fromCache: true };
              }
            }
            const response = await fetch(
              `${this.supabaseUrl}/rest/v1/clouds_characters?discord_user_id=eq.${discordUserId}&select=*&order=updated_at.desc&limit=1`,
              {
                headers: {
                  "apikey": this.supabaseKey,
                  "Authorization": `Bearer ${this.supabaseKey}`
                }
              }
            );
            if (!response.ok) {
              throw new Error(`Failed to fetch character: ${response.status}`);
            }
            const data = await response.json();
            if (data.length > 0) {
              this.characterCache.set(cacheKey, {
                character: data[0],
                timestamp: Date.now()
              });
              await this.savePersistentCache();
              return { success: true, character: data[0], fromCache: false };
            }
            return { success: false, error: "No character linked to this Discord user" };
          } catch (error) {
            debug.error("\u274C Failed to get character by Discord user:", error);
            return { success: false, error: error.message };
          }
        }
        /**
         * Get auth tokens by DiceCloud user ID
         */
        async getAuthTokens(dicecloudUserId) {
          try {
            const response = await fetch(
              `${this.supabaseUrl}/rest/v1/auth_tokens?user_id_dicecloud=eq.${dicecloudUserId}&select=*`,
              {
                headers: {
                  "apikey": this.supabaseKey,
                  "Authorization": `Bearer ${this.supabaseKey}`
                }
              }
            );
            if (!response.ok) {
              throw new Error(`Failed to get auth tokens: ${response.status}`);
            }
            return await response.json();
          } catch (error) {
            debug.error("\u274C Failed to get auth tokens:", error);
            throw error;
          }
        }
        /**
         * Update auth tokens with Discord information
         */
        async updateAuthTokens(dicecloudUserId, updateData) {
          try {
            const response = await fetch(
              `${this.supabaseUrl}/rest/v1/auth_tokens?user_id_dicecloud=eq.${dicecloudUserId}`,
              {
                method: "PATCH",
                headers: {
                  "apikey": this.supabaseKey,
                  "Authorization": `Bearer ${this.supabaseKey}`,
                  "Content-Type": "application/json",
                  "Prefer": "return=minimal"
                },
                body: JSON.stringify(updateData)
              }
            );
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Failed to update auth tokens: ${errorText}`);
            }
            debug.log("\u2705 Auth tokens updated successfully");
            return true;
          } catch (error) {
            debug.error("\u274C Failed to update auth tokens:", error);
            throw error;
          }
        }
        /**
         * Store current session ID locally
         */
        async storeCurrentSession(sessionId) {
          try {
            await browserAPI.storage.local.set({
              currentSessionId: sessionId,
              sessionStartTime: Date.now()
            });
            debug.log("\u{1F4BE} Stored current session ID:", sessionId);
          } catch (error) {
            debug.error("\u274C Failed to store session ID:", error);
          }
        }
        /**
         * Invalidate all other sessions for the same DiceCloud account
         * Called when logging in to ensure only one browser is logged in at a time
         * Only invalidates sessions from OTHER browsers (different user_id)
         */
        async invalidateOtherSessions(diceCloudUserId, currentSessionId) {
          try {
            if (!diceCloudUserId) {
              debug.warn("\u26A0\uFE0F No DiceCloud user ID provided, skipping invalidation");
              return;
            }
            debug.log("\u{1F512} Invalidating other sessions for DiceCloud user:", diceCloudUserId);
            const ourBrowserId = await this.getOrCreatePersistentUserId();
            debug.log("\u{1F50D} Our browser ID:", ourBrowserId);
            const queryUrl = `${this.supabaseUrl}/rest/v1/${this.tableName}?user_id_dicecloud=eq.${encodeURIComponent(diceCloudUserId)}&select=user_id,session_id,username,browser_info,invalidated_at`;
            debug.log("\u{1F50D} Query URL:", queryUrl);
            const response = await fetch(queryUrl, {
              headers: {
                "apikey": this.supabaseKey,
                "Authorization": `Bearer ${this.supabaseKey}`
              }
            });
            if (!response.ok) {
              const errorText = await response.text();
              debug.warn("\u26A0\uFE0F Failed to fetch other sessions:", response.status, errorText);
              return;
            }
            const otherSessions = await response.json();
            debug.log("\u{1F50D} Found sessions for this account:", otherSessions.length, otherSessions);
            if (otherSessions.length === 0) {
              debug.log("\u2139\uFE0F No other sessions found for this DiceCloud account");
              return;
            }
            let invalidatedCount = 0;
            for (const session of otherSessions) {
              if (session.user_id === ourBrowserId) {
                debug.log("\u23ED\uFE0F Skipping our own browser session:", session.session_id);
                continue;
              }
              if (session.invalidated_at) {
                debug.log("\u23ED\uFE0F Session already invalidated:", session.session_id);
                continue;
              }
              debug.log("\u{1F6AB} Invalidating session from other browser:", session.session_id, "browser:", session.user_id);
              const invalidateResponse = await fetch(
                `${this.supabaseUrl}/rest/v1/${this.tableName}?user_id=eq.${encodeURIComponent(session.user_id)}`,
                {
                  method: "PATCH",
                  headers: {
                    "apikey": this.supabaseKey,
                    "Authorization": `Bearer ${this.supabaseKey}`,
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
                  },
                  body: JSON.stringify({
                    invalidated_at: (/* @__PURE__ */ new Date()).toISOString(),
                    invalidated_by_session: currentSessionId,
                    invalidated_reason: "logged_in_elsewhere"
                  })
                }
              );
              if (invalidateResponse.ok) {
                const result = await invalidateResponse.json();
                debug.log("\u2705 Session invalidated:", session.session_id, "Result:", result);
                invalidatedCount++;
              } else {
                const errorText = await invalidateResponse.text();
                debug.warn("\u26A0\uFE0F Failed to invalidate session:", session.session_id, "Status:", invalidateResponse.status, "Error:", errorText);
                if (errorText.includes("column") && errorText.includes("does not exist")) {
                  debug.error("\u274C Database migration needed! Run supabase/add_session_invalidation.sql");
                }
              }
            }
            debug.log(`\u{1F512} Invalidation complete: ${invalidatedCount} session(s) invalidated`);
          } catch (error) {
            debug.error("\u274C Error invalidating other sessions:", error);
          }
        }
        /**
         * Check for token conflicts with existing sessions
         */
        async checkForTokenConflicts(userId, newToken) {
          try {
            const response = await fetch(
              `${this.supabaseUrl}/rest/v1/${this.tableName}?user_id=eq.${userId}&select=dicecloud_token,session_id,browser_info,username,last_seen`,
              {
                headers: {
                  "apikey": this.supabaseKey,
                  "Authorization": `Bearer ${this.supabaseKey}`
                }
              }
            );
            if (!response.ok) {
              debug.warn("\u26A0\uFE0F Failed to check for conflicts:", response.status);
              return { hasConflict: false };
            }
            const existingSessions = await response.json();
            debug.log("\u{1F50D} Checking for conflicts with existing sessions:", existingSessions.length);
            for (const session of existingSessions) {
              if (session.dicecloud_token !== newToken) {
                debug.log("\u26A0\uFE0F Found session with different token:", session.session_id);
                return {
                  hasConflict: true,
                  conflictingSession: {
                    sessionId: session.session_id,
                    username: session.username,
                    lastSeen: session.last_seen,
                    browserInfo: session.browser_info
                  }
                };
              }
            }
            return { hasConflict: false };
          } catch (error) {
            debug.error("\u274C Error checking for conflicts:", error);
            return { hasConflict: false };
          }
        }
        /**
         * Store conflict information for later display
         */
        async storeConflictInfo(conflictCheck) {
          try {
            await browserAPI.storage.local.set({
              sessionConflict: {
                detected: true,
                conflictingSession: conflictCheck.conflictingSession,
                detectedAt: Date.now()
              }
            });
            debug.log("\u{1F4BE} Stored conflict information");
          } catch (error) {
            debug.error("\u274C Failed to store conflict info:", error);
          }
        }
        /**
         * Check if current session has been invalidated by another login
         */
        async checkSessionValidity() {
          try {
            const { currentSessionId, sessionConflict, sessionInvalidated } = await browserAPI.storage.local.get(["currentSessionId", "sessionConflict", "sessionInvalidated"]);
            debug.log("\u{1F50D} checkSessionValidity - currentSessionId:", currentSessionId);
            debug.log("\u{1F50D} checkSessionValidity - sessionConflict:", sessionConflict);
            debug.log("\u{1F50D} checkSessionValidity - sessionInvalidated:", sessionInvalidated);
            if (!currentSessionId) {
              debug.log("\u2705 No session ID stored - session valid (new/fresh state)");
              return { valid: true, reason: "no_session" };
            }
            if (sessionInvalidated) {
              debug.log("\u26A0\uFE0F Found sessionInvalidated flag in local storage");
              return {
                valid: false,
                reason: "invalidated_by_other_login",
                invalidatedAt: sessionInvalidated.at,
                invalidatedReason: sessionInvalidated.reason
              };
            }
            if (sessionConflict && sessionConflict.detected) {
              debug.log("\u26A0\uFE0F Found sessionConflict flag in local storage");
              return { valid: false, reason: "conflict_detected", conflict: sessionConflict };
            }
            const userId = await this.getOrCreatePersistentUserId();
            debug.log("\u{1F50D} Checking session in database for user:", userId);
            const response = await fetch(
              `${this.supabaseUrl}/rest/v1/${this.tableName}?user_id=eq.${userId}&select=dicecloud_token,username,session_id,invalidated_at,invalidated_reason,invalidated_by_session`,
              {
                headers: {
                  "apikey": this.supabaseKey,
                  "Authorization": `Bearer ${this.supabaseKey}`
                }
              }
            );
            if (!response.ok) {
              debug.warn("\u26A0\uFE0F Database check failed with status:", response.status);
              return { valid: false, reason: "check_failed" };
            }
            const sessions = await response.json();
            debug.log("\u{1F50D} Found sessions in database:", sessions.length, sessions);
            if (sessions.length === 0) {
              debug.warn("\u26A0\uFE0F No session found in database for this browser");
              return { valid: false, reason: "session_not_found" };
            }
            const session = sessions[0];
            if (session.invalidated_at) {
              debug.log("\u{1F6AB} Session was invalidated by another login at:", session.invalidated_at);
              await browserAPI.storage.local.set({
                sessionInvalidated: {
                  at: session.invalidated_at,
                  reason: session.invalidated_reason || "logged_in_elsewhere",
                  bySession: session.invalidated_by_session
                }
              });
              return {
                valid: false,
                reason: "invalidated_by_other_login",
                invalidatedAt: session.invalidated_at,
                invalidatedReason: session.invalidated_reason
              };
            }
            if (session.session_id !== currentSessionId) {
              debug.log("\u26A0\uFE0F Session ID mismatch - local:", currentSessionId, "remote:", session.session_id);
              return { valid: false, reason: "session_replaced" };
            }
            const { diceCloudToken } = await browserAPI.storage.local.get("diceCloudToken");
            if (diceCloudToken && session.dicecloud_token !== diceCloudToken) {
              debug.log("\u26A0\uFE0F Token mismatch - local token differs from database");
              return { valid: false, reason: "token_mismatch" };
            }
            debug.log("\u2705 Session is valid");
            await this.updateSessionHeartbeat(currentSessionId);
            return { valid: true };
          } catch (error) {
            debug.error("\u274C Error checking session validity:", error);
            return { valid: true };
          }
        }
        /**
         * Update session heartbeat to keep session alive
         */
        async updateSessionHeartbeat(sessionId) {
          try {
            const userId = await this.getOrCreatePersistentUserId();
            const response = await fetch(
              `${this.supabaseUrl}/rest/v1/${this.tableName}?user_id=eq.${userId}&session_id=eq.${sessionId}`,
              {
                method: "PATCH",
                headers: {
                  "apikey": this.supabaseKey,
                  "Authorization": `Bearer ${this.supabaseKey}`,
                  "Content-Type": "application/json",
                  "Prefer": "return=minimal"
                },
                body: JSON.stringify({
                  last_seen: (/* @__PURE__ */ new Date()).toISOString()
                })
              }
            );
            if (!response.ok) {
              debug.error("\u274C Failed to update session heartbeat:", response.status);
            }
          } catch (error) {
            debug.error("\u274C Error updating session heartbeat:", error);
          }
        }
        /**
         * Clear conflict information
         */
        async clearConflictInfo() {
          try {
            await browserAPI.storage.local.remove(["sessionConflict"]);
            debug.log("\u{1F5D1}\uFE0F Cleared conflict information");
          } catch (error) {
            debug.error("\u274C Failed to clear conflict info:", error);
          }
        }
        /**
         * Invalidate character cache for a specific character
         * Called when character data is updated
         */
        async invalidateCharacterCache(characterId, diceCloudUserId, discordUserId) {
          const keysToInvalidate = [];
          if (characterId) {
            keysToInvalidate.push(`character_${characterId}`);
          }
          if (diceCloudUserId) {
            keysToInvalidate.push(`characters_${diceCloudUserId}`);
          }
          if (discordUserId && discordUserId !== "not_linked") {
            keysToInvalidate.push(`discord_${discordUserId}`);
          }
          keysToInvalidate.forEach((key) => {
            if (this.characterCache.has(key)) {
              this.characterCache.delete(key);
              debug.log("\u{1F5D1}\uFE0F Invalidated cache:", key);
            }
          });
          await this.savePersistentCache();
        }
        /**
         * Clear all character cache (memory and persistent storage)
         */
        async clearCharacterCache() {
          this.characterCache.clear();
          if (typeof browserAPI !== "undefined") {
            await browserAPI.storage.local.remove([this.cacheStorageKey]);
          }
          debug.log("\u{1F5D1}\uFE0F Cleared all character cache (memory + storage)");
        }
        /**
         * Get cache stats for debugging
         */
        getCacheStats() {
          return {
            size: this.characterCache.size,
            memoryExpiryMs: this.cacheExpiryMs,
            persistentExpiryMs: this.persistentCacheExpiryMs,
            entries: Array.from(this.characterCache.keys())
          };
        }
        /**
         * Load persistent cache from localStorage
         * Runs on initialization to restore cached data across sessions
         */
        async loadPersistentCache() {
          try {
            if (typeof browserAPI === "undefined") {
              debug.log("\u26A0\uFE0F browserAPI not available yet, skipping cache load");
              return;
            }
            const stored = await browserAPI.storage.local.get([this.cacheStorageKey]);
            if (!stored || !stored[this.cacheStorageKey]) {
              debug.log("\u{1F4E6} No persistent cache found");
              return;
            }
            const persistentCache = stored[this.cacheStorageKey];
            const now = Date.now();
            let loadedCount = 0;
            for (const [key, value] of Object.entries(persistentCache)) {
              if (value.timestamp && now - value.timestamp < this.persistentCacheExpiryMs) {
                this.characterCache.set(key, value);
                loadedCount++;
              }
            }
            debug.log(`\u{1F4E6} Loaded ${loadedCount} entries from persistent cache`);
          } catch (error) {
            debug.error("\u274C Failed to load persistent cache:", error);
          }
        }
        /**
         * Save current cache to localStorage for persistence
         */
        async savePersistentCache() {
          try {
            if (typeof browserAPI === "undefined") {
              return;
            }
            const cacheObject = {};
            for (const [key, value] of this.characterCache.entries()) {
              cacheObject[key] = value;
            }
            await browserAPI.storage.local.set({
              [this.cacheStorageKey]: cacheObject
            });
            debug.log("\u{1F4BE} Saved cache to persistent storage");
          } catch (error) {
            debug.error("\u274C Failed to save persistent cache:", error);
          }
        }
      };
      if (typeof window !== "undefined") {
        window.SupabaseTokenManager = SupabaseTokenManager;
        if (typeof window.createSupabaseClient === "function") {
          try {
            window.supabaseClient = window.createSupabaseClient(SUPABASE_URL2, SUPABASE_ANON_KEY2);
            debug.log("\u2705 Created global Supabase auth client");
          } catch (error) {
            debug.error("\u274C Failed to create Supabase client:", error);
          }
        }
      } else if (typeof self !== "undefined") {
        self.SupabaseTokenManager = SupabaseTokenManager;
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = SupabaseTokenManager;
      }
    }
  });

  // ../core/src/lib/indexeddb-cache.js
  var require_indexeddb_cache = __commonJS({
    "../core/src/lib/indexeddb-cache.js"(exports, module) {
      "use strict";
      var IndexedDBCache = class {
        constructor(dbName = "owlcloud_cache", version = 1) {
          this.dbName = dbName;
          this.version = version;
          this.db = null;
        }
        /**
         * Open the IndexedDB database and create object stores
         * @returns {Promise<IDBDatabase>}
         */
        async open() {
          return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
              this.db = request.result;
              resolve(this.db);
            };
            request.onupgradeneeded = (event) => {
              const db = event.target.result;
              if (!db.objectStoreNames.contains("characters")) {
                const charStore = db.createObjectStore("characters", { keyPath: "characterId" });
                charStore.createIndex("expiresAt", "expiresAt", { unique: false });
                charStore.createIndex("timestamp", "timestamp", { unique: false });
              }
              if (!db.objectStoreNames.contains("token_images")) {
                const imgStore = db.createObjectStore("token_images", { keyPath: "characterId" });
                imgStore.createIndex("expiresAt", "expiresAt", { unique: false });
              }
              if (!db.objectStoreNames.contains("metadata")) {
                db.createObjectStore("metadata", { keyPath: "key" });
              }
            };
          });
        }
        /**
         * Get a character from cache
         * @param {string} characterId - Character ID to retrieve
         * @returns {Promise<Object|null>} Character data or null if not found/expired
         */
        async getCharacter(characterId) {
          if (!this.db)
            throw new Error("Database not opened");
          const tx = this.db.transaction(["characters"], "readonly");
          const store = tx.objectStore("characters");
          const request = store.get(characterId);
          return new Promise((resolve, reject) => {
            request.onsuccess = () => {
              const result = request.result;
              if (!result || result.expiresAt && Date.now() > result.expiresAt) {
                if (result)
                  this.deleteCharacter(characterId);
                resolve(null);
                return;
              }
              resolve(result);
            };
            request.onerror = () => reject(request.error);
          });
        }
        /**
         * Store a character in cache
         * @param {string} characterId - Character ID
         * @param {Object} data - Character data to store
         * @param {number} ttlSeconds - Time to live in seconds (default 300 = 5 minutes)
         * @returns {Promise<boolean>}
         */
        async setCharacter(characterId, data, ttlSeconds = 300) {
          if (!this.db)
            throw new Error("Database not opened");
          const entry = {
            characterId,
            data,
            timestamp: Date.now(),
            version: data.updated_at || data.updatedAt || Date.now(),
            expiresAt: Date.now() + ttlSeconds * 1e3
          };
          const tx = this.db.transaction(["characters"], "readwrite");
          const store = tx.objectStore("characters");
          const request = store.put(entry);
          return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
          });
        }
        /**
         * Delete a character from cache
         * @param {string} characterId - Character ID to delete
         * @returns {Promise<boolean>}
         */
        async deleteCharacter(characterId) {
          if (!this.db)
            throw new Error("Database not opened");
          const tx = this.db.transaction(["characters"], "readwrite");
          const store = tx.objectStore("characters");
          const request = store.delete(characterId);
          return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
          });
        }
        /**
         * Get a token image from cache
         * @param {string} characterId - Character ID
         * @returns {Promise<Object|null>} Token image data or null if not found/expired
         */
        async getTokenImage(characterId) {
          if (!this.db)
            throw new Error("Database not opened");
          const tx = this.db.transaction(["token_images"], "readonly");
          const store = tx.objectStore("token_images");
          const request = store.get(characterId);
          return new Promise((resolve, reject) => {
            request.onsuccess = () => {
              const result = request.result;
              if (!result || result.expiresAt && Date.now() > result.expiresAt) {
                if (result)
                  this.deleteTokenImage(characterId);
                resolve(null);
                return;
              }
              resolve(result);
            };
            request.onerror = () => reject(request.error);
          });
        }
        /**
         * Store a token image in cache
         * @param {string} characterId - Character ID
         * @param {string} imageUrl - URL of the image
         * @param {Blob} blob - Image blob data
         * @param {number} ttlSeconds - Time to live in seconds (default 3600 = 1 hour)
         * @returns {Promise<boolean>}
         */
        async setTokenImage(characterId, imageUrl, blob, ttlSeconds = 3600) {
          if (!this.db)
            throw new Error("Database not opened");
          const entry = {
            characterId,
            imageUrl,
            blob,
            timestamp: Date.now(),
            expiresAt: Date.now() + ttlSeconds * 1e3
          };
          const tx = this.db.transaction(["token_images"], "readwrite");
          const store = tx.objectStore("token_images");
          const request = store.put(entry);
          return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
          });
        }
        /**
         * Delete a token image from cache
         * @param {string} characterId - Character ID
         * @returns {Promise<boolean>}
         */
        async deleteTokenImage(characterId) {
          if (!this.db)
            throw new Error("Database not opened");
          const tx = this.db.transaction(["token_images"], "readwrite");
          const store = tx.objectStore("token_images");
          const request = store.delete(characterId);
          return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
          });
        }
        /**
         * Clean up expired entries from all stores
         * @returns {Promise<number>} Number of entries deleted
         */
        async cleanupExpired() {
          if (!this.db)
            throw new Error("Database not opened");
          const now = Date.now();
          let deletedCount = 0;
          try {
            const charTx = this.db.transaction(["characters"], "readwrite");
            const charStore = charTx.objectStore("characters");
            const charIndex = charStore.index("expiresAt");
            const charRange = IDBKeyRange.upperBound(now);
            const charRequest = charIndex.openCursor(charRange);
            await new Promise((resolve, reject) => {
              charRequest.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                  cursor.delete();
                  deletedCount++;
                  cursor.continue();
                } else {
                  resolve();
                }
              };
              charRequest.onerror = () => reject(charRequest.error);
            });
          } catch (err) {
            console.error("Error cleaning character cache:", err);
          }
          try {
            const imgTx = this.db.transaction(["token_images"], "readwrite");
            const imgStore = imgTx.objectStore("token_images");
            const imgIndex = imgStore.index("expiresAt");
            const imgRange = IDBKeyRange.upperBound(now);
            const imgRequest = imgIndex.openCursor(imgRange);
            await new Promise((resolve, reject) => {
              imgRequest.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                  cursor.delete();
                  deletedCount++;
                  cursor.continue();
                } else {
                  resolve();
                }
              };
              imgRequest.onerror = () => reject(imgRequest.error);
            });
          } catch (err) {
            console.error("Error cleaning token image cache:", err);
          }
          return deletedCount;
        }
        /**
         * Get cache statistics
         * @returns {Promise<Object>} Cache stats
         */
        async getStats() {
          if (!this.db)
            throw new Error("Database not opened");
          const stats = {
            characters: 0,
            tokenImages: 0,
            totalSize: 0
          };
          const charTx = this.db.transaction(["characters"], "readonly");
          const charStore = charTx.objectStore("characters");
          const charCountRequest = charStore.count();
          stats.characters = await new Promise((resolve, reject) => {
            charCountRequest.onsuccess = () => resolve(charCountRequest.result);
            charCountRequest.onerror = () => reject(charCountRequest.error);
          });
          const imgTx = this.db.transaction(["token_images"], "readonly");
          const imgStore = imgTx.objectStore("token_images");
          const imgCountRequest = imgStore.count();
          stats.tokenImages = await new Promise((resolve, reject) => {
            imgCountRequest.onsuccess = () => resolve(imgCountRequest.result);
            imgCountRequest.onerror = () => reject(imgCountRequest.error);
          });
          return stats;
        }
        /**
         * Clear all cache data
         * @returns {Promise<boolean>}
         */
        async clearAll() {
          if (!this.db)
            throw new Error("Database not opened");
          const tx = this.db.transaction(["characters", "token_images"], "readwrite");
          const charStore = tx.objectStore("characters");
          const imgStore = tx.objectStore("token_images");
          charStore.clear();
          imgStore.clear();
          return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
          });
        }
      };
      if (typeof module !== "undefined" && module.exports) {
        module.exports = IndexedDBCache;
      }
    }
  });

  // ../core/src/modules/card-creator.js
  var require_card_creator = __commonJS({
    "../core/src/modules/card-creator.js"(exports, module) {
      "use strict";
      function createCard(title, main, sub, onClick) {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
    <strong>${title}</strong><br>
    <span class="bonus">${main}</span><br>
    ${sub ? `<span class="bonus">${sub}</span>` : ""}
  `;
        card.addEventListener("click", onClick);
        return card;
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
        header.innerHTML = `
    <div>
      <span style="font-weight: bold;">${spell.name}</span>
      ${spell.level ? `<span style="margin-left: 10px; color: var(--text-secondary);">Level ${spell.level}</span>` : ""}
      ${tags}
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="cast-btn" data-spell-index="${index}">\u2728 Cast</button>
      <button class="toggle-btn">\u25BC Details</button>
    </div>
  `;
        const desc = document.createElement("div");
        desc.className = "spell-description";
        desc.id = `spell-desc-${index}`;
        desc.innerHTML = `
    ${spell.castingTime ? `<div><strong>Casting Time:</strong> ${spell.castingTime}</div>` : ""}
    ${spell.range ? `<div><strong>Range:</strong> ${spell.range}</div>` : ""}
    ${spell.components ? `<div><strong>Components:</strong> ${spell.components}</div>` : ""}
    ${spell.duration ? `<div><strong>Duration:</strong> ${spell.duration}</div>` : ""}
    ${spell.school ? `<div><strong>School:</strong> ${spell.school}</div>` : ""}
    ${spell.source ? `<div><strong>Source:</strong> ${spell.source}</div>` : ""}
    ${spell.description ? `<div style="margin-top: 10px;">${spell.description}</div>` : ""}
  `;
        card.appendChild(header);
        card.appendChild(desc);
        const toggleBtn = header.querySelector(".toggle-btn");
        toggleBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          desc.classList.toggle("expanded");
          toggleBtn.textContent = desc.classList.contains("expanded") ? "\u25B2 Hide" : "\u25BC Details";
        });
        return card;
      }
      function createActionCard(action, index) {
        const card = document.createElement("div");
        card.className = "action-card";
        const header = document.createElement("div");
        header.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <strong>${action.name || "Action"}</strong>
        ${action.uses ? `<span class="uses-badge">${action.uses} uses</span>` : ""}
      </div>
      <div class="action-buttons" style="display: flex; gap: 8px;">
        ${action.attackRoll ? `<button class="attack-btn" data-action-index="${index}">\u2694\uFE0F Attack</button>` : ""}
        ${action.damage ? `<button class="damage-btn" data-action-index="${index}">\u{1F4A5} Damage</button>` : ""}
        ${action.uses ? `<button class="use-btn" data-action-index="${index}">\u2728 Use</button>` : ""}
        <button class="toggle-btn">\u25BC</button>
      </div>
    </div>
  `;
        const desc = document.createElement("div");
        desc.className = "action-description";
        desc.id = `action-desc-${index}`;
        if (action.description) {
          desc.innerHTML = `<div>${action.description}</div>`;
        }
        card.appendChild(header);
        card.appendChild(desc);
        const toggleBtn = header.querySelector(".toggle-btn");
        toggleBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          desc.classList.toggle("expanded");
          toggleBtn.textContent = desc.classList.contains("expanded") ? "\u25B2" : "\u25BC";
        });
        return card;
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = { createCard, createSpellCard, createActionCard };
      }
      if (typeof window !== "undefined") {
        window.CardCreator = { createCard, createSpellCard, createActionCard };
      }
    }
  });

  // ../core/src/modules/color-utils.js
  var require_color_utils = __commonJS({
    "../core/src/modules/color-utils.js"(exports, module) {
      "use strict";
      function getColorEmoji2(color) {
        const colorEmojiMap = {
          "#3498db": "\u{1F535}",
          // Blue
          "#e74c3c": "\u{1F534}",
          // Red
          "#27ae60": "\u{1F7E2}",
          // Green
          "#9b59b6": "\u{1F7E3}",
          // Purple
          "#e67e22": "\u{1F7E0}",
          // Orange
          "#f1c40f": "\u{1F7E1}",
          // Yellow
          "#95a5a6": "\u26AA",
          // Grey
          "#34495e": "\u26AB",
          // Black
          "#8b4513": "\u{1F7E4}"
          // Brown
        };
        return colorEmojiMap[color] || "\u{1F535}";
      }
      function getColorName(hexColor) {
        const colorMap = {
          "#3498db": "Blue",
          "#e74c3c": "Red",
          "#27ae60": "Green",
          "#9b59b6": "Purple",
          "#e67e22": "Orange",
          "#f1c40f": "Yellow",
          "#95a5a6": "Grey",
          "#34495e": "Black",
          "#8b4513": "Brown"
        };
        return colorMap[hexColor] || "Blue";
      }
      function getColoredBanner2(characterData2) {
        const color = characterData2.notificationColor || "#3498db";
        const emoji = getColorEmoji2(color);
        return `${emoji} `;
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = { getColorEmoji: getColorEmoji2, getColorName, getColoredBanner: getColoredBanner2 };
      }
      if (typeof window !== "undefined") {
        window.ColorUtils = { getColorEmoji: getColorEmoji2, getColorName, getColoredBanner: getColoredBanner2 };
        window.getColorEmoji = getColorEmoji2;
        window.getColorName = getColorName;
        window.getColoredBanner = getColoredBanner2;
      }
    }
  });

  // ../core/src/browser.js
  var import_debug = __toESM(require_debug());

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

  // ../core/src/browser.js
  var import_html_utils = __toESM(require_html_utils());
  var import_theme_manager = __toESM(require_theme_manager());

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
  function getProjectConfig(projectName) {
    const config = PROJECT_CONFIGS[projectName];
    if (!config) {
      throw new Error(`Unknown project: ${projectName}`);
    }
    return {
      ...config,
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_ANON_KEY
    };
  }

  // ../core/src/browser.js
  var import_client = __toESM(require_client());
  var import_indexeddb_cache = __toESM(require_indexeddb_cache());

  // ../core/src/modules/spell-edge-cases.js
  var SPELL_EDGE_CASES = {
    // Healing spells that should announce when used
    "cure wounds": {
      type: "healing_announcement",
      description: "Healing spell that announces usage"
    },
    "healing word": {
      type: "healing_announcement",
      description: "Healing spell that announces usage"
    },
    "lesser restoration": {
      type: "healing_announcement",
      description: "Healing spell that announces usage"
    },
    "mass cure wounds": {
      type: "healing_announcement",
      description: "Healing spell that announces usage"
    },
    "mass healing word": {
      type: "healing_announcement",
      description: "Healing spell that announces usage"
    },
    "heal": {
      type: "healing_announcement",
      description: "Healing spell that announces usage"
    },
    "regenerate": {
      type: "healing_announcement",
      description: "Healing spell that announces usage"
    },
    "mass heal": {
      type: "healing_announcement",
      description: "Healing spell that announces usage"
    },
    "true resurrection": {
      type: "healing_announcement",
      description: "Healing spell that announces usage"
    },
    // Spells that are too complicated for normal casting
    "wish": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention"
    },
    "miracle": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention",
      ruleset: "2014",
      notes: "3.5e spell, not in 2024 PHB"
    },
    "true polymorph": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention"
    },
    "shapechange": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention"
    },
    "astral projection": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention"
    },
    "etherealness": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention"
    },
    "plane shift": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention"
    },
    "teleport": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention"
    },
    "word of recall": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention"
    },
    "contingency": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention"
    },
    "glyph of warding": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention"
    },
    "symbol": {
      type: "conditional_damage",
      description: "Has conditional/situational damage - adds Cast button"
    },
    "meld into stone": {
      type: "conditional_damage",
      description: "Has conditional/situational damage - adds Cast button"
    },
    "geas": {
      type: "conditional_damage",
      description: "Has conditional/situational damage - adds Cast button"
    },
    "programmed illusion": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention"
    },
    "sequester": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention"
    },
    "clone": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention"
    },
    "magic jar": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention"
    },
    "imprisonment": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention"
    },
    "time stop": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention",
      ruleset: "2014",
      notes: "1d4+1 rounds"
    },
    "time stop (2024)": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention",
      ruleset: "2024",
      notes: "1d4+1 turns (changed from rounds)"
    },
    "mirage arcane": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention"
    },
    "forcecage": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention"
    },
    "maze": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention"
    },
    "simulacrum": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention"
    },
    "gate": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention"
    },
    // Reusable spells that need checkbox
    "spiritual weapon": {
      type: "reusable",
      description: "Can be recast without using spell slot",
      ruleset: "2014",
      notes: "Bonus action to summon, separate action to attack"
    },
    "spiritual weapon (2024)": {
      type: "reusable",
      description: "Can be recast without using spell slot",
      ruleset: "2024",
      notes: "Bonus action to summon AND attack on same turn"
    },
    "mage armor": {
      type: "reusable",
      description: "Can be recast without using spell slot"
    },
    "shield": {
      type: "reusable",
      description: "Can be recast without using spell slot"
    },
    "detect magic": {
      type: "reusable",
      description: "Can be recast without using spell slot",
      ruleset: "2014",
      notes: "Standard casting"
    },
    "detect magic (2024)": {
      type: "reusable",
      description: "Can be recast without using spell slot",
      ruleset: "2024",
      notes: "Now a ritual spell"
    },
    "guidance": {
      type: "reusable",
      description: "Can be recast without using spell slot",
      ruleset: "2014",
      notes: "Action, must be used before roll"
    },
    "guidance (2024)": {
      type: "reusable",
      description: "Can be recast without using spell slot",
      ruleset: "2024",
      notes: "Reaction, can be used after the roll"
    },
    "resistance": {
      type: "reusable",
      description: "Can be recast without using spell slot"
    },
    "virtue": {
      type: "reusable",
      description: "Can be recast without using spell slot",
      ruleset: "2014",
      notes: "3.5e spell, not in 2024 PHB"
    },
    "light": {
      type: "reusable",
      description: "Can be recast without using spell slot"
    },
    "fire bolt": {
      type: "reusable",
      description: "Can be recast without using spell slot"
    },
    "ray of frost": {
      type: "reusable",
      description: "Can be recast without using spell slot"
    },
    "shocking grasp": {
      type: "reusable",
      description: "Can be recast without using spell slot"
    },
    "toll the dead": {
      type: "reusable",
      description: "Can be recast without using spell slot"
    },
    "sacred flame": {
      type: "reusable",
      description: "Can be recast without using spell slot"
    },
    "eldritch blast": {
      type: "reusable",
      description: "Can be recast without using spell slot"
    },
    "poison spray": {
      type: "reusable",
      description: "Can be recast without using spell slot"
    },
    "frostbite": {
      type: "reusable",
      description: "Can be recast without using spell slot"
    },
    "true strike": {
      type: "reusable",
      description: "Can be recast without using spell slot",
      ruleset: "2014",
      notes: "Advantage on next attack roll"
    },
    "true strike (2024)": {
      type: "reusable",
      description: "Can be recast without using spell slot",
      ruleset: "2024",
      notes: "COMPLETELY REDESIGNED - advantage on next attack within same turn + extra damage"
    },
    "blade ward": {
      type: "reusable",
      description: "Can be recast without using spell slot"
    },
    "chill touch": {
      type: "reusable",
      description: "Can be recast without using spell slot"
    },
    "minor illusion": {
      type: "reusable",
      description: "Can be recast without using spell slot"
    },
    "prestidigitation": {
      type: "reusable",
      description: "Can be recast without using spell slot"
    },
    "thaumaturgy": {
      type: "reusable",
      description: "Can be recast without using spell slot"
    },
    "druidcraft": {
      type: "reusable",
      description: "Can be recast without using spell slot"
    },
    "mending": {
      type: "reusable",
      description: "Can be recast without using spell slot"
    },
    "arcane vigor": {
      type: "reusable",
      description: "Can be recast without using spell slot",
      ruleset: "2024",
      notes: "New 2024 cantrip - grants temporary HP"
    },
    "starry wisp": {
      type: "reusable",
      description: "Can be recast without using spell slot",
      ruleset: "2024",
      notes: "New 2024 cantrip - light and guidance effect"
    },
    "sorcerous burst": {
      type: "reusable",
      description: "Can be recast without using spell slot",
      ruleset: "2024",
      notes: "New 2024 sorcerer cantrip"
    },
    "conjure minor elementals": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention",
      ruleset: "2024",
      notes: "2024 replacement for old summoning spells"
    },
    "conjure celestial": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention",
      ruleset: "2024",
      notes: "2024 redesigned summoning spell"
    },
    "summon beast": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention",
      ruleset: "2024",
      notes: "2024 standardized summoning spell"
    },
    "summon fey": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention",
      ruleset: "2024",
      notes: "2024 standardized summoning spell"
    },
    "hunter's mark (2024)": {
      type: "reusable",
      description: "Can be recast without using spell slot",
      ruleset: "2024",
      notes: "Now a spell known for free, concentration changes"
    },
    "hex (2024)": {
      type: "reusable",
      description: "Can be recast without using spell slot",
      ruleset: "2024",
      notes: "Similar to Hunter's Mark changes"
    },
    "counterspell (2024)": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention",
      ruleset: "2024",
      notes: "Different DC calculation in 2024"
    },
    "healing spirit (2024)": {
      type: "too_complicated",
      description: "Too complicated for normal casting - requires DM intervention",
      ruleset: "2024",
      notes: "Nerfed heavily in 2024"
    }
  };
  function isEdgeCase2(spellName) {
    if (!spellName)
      return false;
    return SPELL_EDGE_CASES.hasOwnProperty(spellName.toLowerCase());
  }
  function getEdgeCase2(spellName, ruleset = null) {
    if (!spellName)
      return null;
    const lowerName = spellName.toLowerCase();
    if (ruleset) {
      const specificVersion = SPELL_EDGE_CASES[`${lowerName} (${ruleset})`];
      if (specificVersion)
        return specificVersion;
    }
    return SPELL_EDGE_CASES[lowerName] || null;
  }
  function applyEdgeCaseModifications(spell, options, characterData2 = null) {
    const ruleset = characterData2 ? detectRulesetFromCharacterData(characterData2) : "2014";
    const edgeCase = getEdgeCase2(spell.name, ruleset);
    if (!edgeCase)
      return { options, skipNormalButtons: false };
    debug.log(`\u{1F3AF} Applying ${ruleset} edge case for spell: ${spell.name}`);
    let modifiedOptions = options;
    let skipNormalButtons = false;
    switch (edgeCase.type) {
      case "healing_announcement":
        modifiedOptions = options.map((option) => ({
          ...option,
          edgeCaseNote: edgeCase.notes || "Announces healing usage"
        }));
        break;
      case "too_complicated":
        modifiedOptions = [];
        skipNormalButtons = true;
        break;
      case "reusable":
        modifiedOptions = options.map((option) => ({
          ...option,
          edgeCaseNote: edgeCase.notes || "Can be recast without spell slot"
        }));
        break;
      case "conditional_damage":
        if (options.length > 0) {
          modifiedOptions = [
            {
              type: "cast",
              label: "Cast Spell",
              icon: "\u2728",
              color: "#9b59b6",
              edgeCaseNote: edgeCase.notes || "Spell has conditional damage"
            },
            ...options
          ];
        }
        break;
      default:
        break;
    }
    return { options: modifiedOptions, skipNormalButtons };
  }
  function isReuseableSpell2(spellName, characterData2 = null) {
    const ruleset = characterData2 ? detectRulesetFromCharacterData(characterData2) : "2014";
    const edgeCase = getEdgeCase2(spellName, ruleset);
    return edgeCase && edgeCase.type === "reusable";
  }
  function isTooComplicatedSpell2(spellName, characterData2 = null) {
    const ruleset = characterData2 ? detectRulesetFromCharacterData(characterData2) : "2014";
    const edgeCase = getEdgeCase2(spellName, ruleset);
    return edgeCase && edgeCase.type === "too_complicated";
  }
  function detectRulesetFromCharacterData(characterData2) {
    if (!characterData2)
      return "2014";
    const features = characterData2.features || [];
    const actions = characterData2.actions || [];
    const spells = characterData2.spells || [];
    const has2024Indicators = [
      // Explicit 2024 markers (most reliable)
      () => features.some((f) => f.name && f.name.includes("2024")),
      () => spells.some((s) => s.description && s.description.includes("2024")),
      // 2024-specific resource patterns
      () => (characterData2.resources || []).some((r) => r.name && (r.name.includes("proficiency") && r.name.includes("uses"))),
      // 2024-specific feature wording (more specific)
      () => features.some((f) => f.description && typeof f.description === "string" && (f.description.includes("uses = proficiency bonus") || f.description.includes("proficiency bonus uses"))),
      // 2024-specific class feature patterns
      () => features.some((f) => f.description && typeof f.description === "string" && (f.description.includes("bonus action") && f.description.includes("reaction"))),
      // 2024-specific spell patterns
      () => spells.some((s) => s.description && typeof s.description === "string" && (s.description.includes("ritual") && s.level > 0))
    ];
    const has2024Features = has2024Indicators.some((check) => check());
    if (has2024Features) {
      debug.log("\u{1F50D} Detected 2024 ruleset from character data");
      return "2024";
    }
    debug.log("\u{1F50D} Defaulting to 2014 ruleset");
    return "2014";
  }
  if (typeof globalThis !== "undefined") {
    globalThis.SPELL_EDGE_CASES = SPELL_EDGE_CASES;
    globalThis.isEdgeCase = isEdgeCase2;
    globalThis.getEdgeCase = getEdgeCase2;
    globalThis.applyEdgeCaseModifications = applyEdgeCaseModifications;
    globalThis.isReuseableSpell = isReuseableSpell2;
    globalThis.isTooComplicatedSpell = isTooComplicatedSpell2;
    globalThis.detectRulesetFromCharacterData = detectRulesetFromCharacterData;
  }

  // ../core/src/modules/class-feature-edge-cases.js
  var CLASS_FEATURE_EDGE_CASES = {
    // ===== BARBARIAN FEATURES =====
    "rage": {
      type: "resource_tracking",
      resource: "rage_points",
      maxResource: "barbarian_level",
      duration: "1_minute",
      endCondition: "no_attack_or_damage",
      description: "Ends if no attack or damage since last turn"
    },
    "reckless attack": {
      type: "advantage_disadvantage",
      selfAdvantage: "attack",
      selfDisadvantage: "defense",
      description: "Advantage on attacks, disadvantage on attacks against you"
    },
    "danger sense": {
      type: "conditional_advantage",
      condition: "can_see_dex_save_source",
      appliesTo: "dexterity_save",
      description: "Advantage on Dex saves if you can see the source"
    },
    "relentless rage": {
      type: "death_save",
      trigger: "drop_to_0_hp_while_raging",
      saveType: "constitution",
      baseDC: 10,
      dcIncrement: 5,
      resetCondition: "short_rest",
      description: "Con save to drop to 1 HP instead of 0"
    },
    "persistent rage": {
      type: "override_condition",
      overrides: "rage_end_condition",
      description: "Rage doesn't end from not attacking/taking damage"
    },
    "retaliation": {
      type: "reaction",
      timing: "when_damaged_within_5ft",
      action: "melee_attack",
      description: "Reaction melee attack when damaged within 5ft"
    },
    "brutal critical": {
      type: "damage_bonus",
      timing: "critical_hit",
      effect: "extra_damage_dice",
      formula: "barbarian_level // 2",
      description: "Extra damage dice on critical hits (scales with level)"
    },
    "feral instinct": {
      type: "initiative_bonus",
      effect: "advantage_on_initiative",
      condition: "while_raging",
      additionalEffect: "cannot_be_surprised_while_raging",
      description: "Advantage on initiative, cannot be surprised while raging"
    },
    "primal champion": {
      type: "ability_score_increase",
      abilities: ["strength", "constitution"],
      amount: 4,
      maxScore: 24,
      description: "STR and CON increase by 4 (max 24)"
    },
    // ===== FIGHTER FEATURES =====
    "action surge": {
      type: "bonus_action",
      effect: "additional_action",
      limitation: "one_additional_action_even_with_multiple_uses",
      description: "Take one additional action on your turn"
    },
    "second wind": {
      type: "healing",
      actionType: "bonus_action",
      healingFormula: "1d10 + fighter_level",
      resource: "once_per_rest",
      description: "Bonus action to regain HP"
    },
    "indomitable": {
      type: "save_reroll",
      trigger: "failed_save",
      resource: "uses_per_long_rest",
      description: "Reroll a failed save"
    },
    "riposte": {
      type: "reaction",
      timing: "when_melee_attack_misses_you",
      action: "melee_attack",
      description: "Reaction attack when melee attack misses you"
    },
    "parry": {
      type: "reaction",
      timing: "when_hit",
      effect: "damage_reduction",
      formula: "superiority_die + dex_mod",
      description: "Reduce damage by superiority die + Dex mod"
    },
    "precision attack": {
      type: "attack_bonus",
      timing: "when_making_attack_roll",
      effect: "add_superiority_die",
      description: "Add superiority die to attack roll"
    },
    "eldritch strike": {
      type: "debuff",
      trigger: "weapon_attack_hit",
      effect: "disadvantage_on_next_spell_save",
      duration: "until_end_of_next_turn",
      description: "Target has disadvantage on next save vs your spell"
    },
    "war magic": {
      type: "bonus_action_combo",
      trigger: "cast_cantrip",
      action: "weapon_attack",
      description: "Cast cantrip + bonus action weapon attack"
    },
    "arcane charge": {
      type: "teleport",
      trigger: "action_surge",
      distance: "30_feet",
      description: "Teleport 30ft when using Action Surge"
    },
    "defensive duelist": {
      type: "reaction",
      timing: "when_attacked_with_finesse_weapon",
      effect: "add_proficiency_to_ac",
      condition: "wielding_finesse_weapon",
      description: "Reaction to add proficiency to AC when wielding finesse weapon"
    },
    "great weapon master": {
      type: "attack_option",
      choice: "bonus_attack_on_crit_kill_or_minus_5_plus_10",
      penalty: "minus_5_to_hit",
      bonus: "plus_10_damage",
      condition: "wielding_heavy_weapon",
      description: "Bonus attack on crit/kill OR -5 to hit for +10 damage"
    },
    "sharpshooter": {
      type: "attack_option",
      choice: "ignore_cover_range_or_minus_5_plus_10",
      penalty: "minus_5_to_hit",
      bonus: "plus_10_damage",
      condition: "using_ranged_weapon",
      effects: ["ignore_cover", "ignore_range_penalty"],
      description: "Ignore cover/range OR -5 to hit for +10 damage"
    },
    "lucky feat": {
      type: "resource_tracking",
      resource: "luck_points",
      maxResource: 3,
      resetCondition: "long_rest",
      effect: "reroll_or_force_enemy_reroll",
      description: "3 luck points to reroll or force enemy reroll"
    },
    "sentinel": {
      type: "reaction_opportunities",
      effects: ["multiple_reaction_attacks", "stop_creature_movement"],
      condition: "opportunity_attack",
      description: "Multiple reaction-based attack opportunities"
    },
    // ===== ROGUE FEATURES =====
    "sneak attack": {
      type: "conditional_damage",
      condition: "advantage_or_ally_within_5ft",
      damageFormula: "sneak_attack_dice",
      limitation: "once_per_turn",
      description: "Extra damage with advantage or ally adjacent"
    },
    "cunning action": {
      type: "bonus_action",
      options: ["dash", "disengage", "hide"],
      description: "Dash/Disengage/Hide as bonus action"
    },
    "uncanny dodge": {
      type: "reaction",
      timing: "when_hit_by_attack_you_can_see",
      effect: "half_damage",
      description: "Reaction to halve damage when hit"
    },
    "evasion": {
      type: "save_modifier",
      saveType: "dexterity",
      effect: "no_damage_on_success_half_on_failure",
      description: "Dex save: no damage on success, half on failure"
    },
    "reliable talent": {
      type: "minimum_roll",
      appliesTo: "proficient_ability_checks",
      minimum: 10,
      description: "Treat rolls below 10 as 10 on proficient checks"
    },
    "blindsense": {
      type: "senses",
      range: "10_feet",
      detects: "hidden_invisible_creatures",
      description: "Know location of hidden/invisible creatures within 10ft"
    },
    "slippery mind": {
      type: "save_reroll",
      trigger: "failed_wisdom_save",
      timing: "reaction",
      resource: "once_per_long_rest",
      description: "Reaction to succeed on failed Wis save"
    },
    "elusive": {
      type: "immunity",
      effect: "no_advantage_against_you_when_visible",
      description: "Attackers don't have advantage when they can see you"
    },
    "stroke of luck": {
      type: "success_conversion",
      trigger: "miss_attack_or_fail_ability_check",
      effect: "turn_into_hit_or_success",
      resource: "once_per_long_rest",
      description: "Turn miss into hit or failure into success"
    },
    "steady aim": {
      type: "bonus_action",
      effect: "advantage_on_next_attack",
      penalty: "lose_movement",
      condition: "ranged_attack",
      description: "Bonus action to get advantage but lose movement"
    },
    "soul of deceit": {
      type: "immunity",
      effects: ["immune_to_telepathy", "immune_to_mind_reading"],
      description: "Immune to telepathy/mind reading"
    },
    "death strike": {
      type: "conditional_damage",
      condition: "surprised_target",
      effect: "double_damage",
      trigger: "failed_save",
      saveType: "constitution",
      description: "Failed save = double damage on surprise"
    },
    // ===== MONK FEATURES =====
    "flurry of blows": {
      type: "bonus_action_attacks",
      trigger: "take_attack_action",
      cost: "1_ki_point",
      attacks: "two_unarmed_strikes",
      description: "Bonus action: 2 unarmed strikes for 1 ki"
    },
    "patient defense": {
      type: "bonus_action",
      cost: "1_ki_point",
      effect: "dodge_action",
      description: "Bonus action: Dodge for 1 ki"
    },
    "step of the wind": {
      type: "bonus_action",
      cost: "1_ki_point",
      effects: ["disengage_or_dash", "jump_distance_doubles"],
      description: "Bonus action: Disengage/Dash + double jump distance"
    },
    "deflect missiles": {
      type: "reaction",
      timing: "when_hit_by_ranged_weapon",
      effect: "damage_reduction",
      formula: "1d10 + dex_mod + monk_level",
      special: "can_catch_and_throw_missile_for_1_ki",
      description: "Reduce ranged damage, can throw back for 1 ki"
    },
    "deflect attacks": {
      type: "reaction",
      timing: "when_hit_by_attack",
      effect: "damage_reduction",
      formula: "1d10 + dex_mod + monk_level",
      special: "can_redirect_attack_for_1_ki",
      description: "2024 Monk: Reduce melee/ranged damage, can redirect for 1 ki"
    },
    "slow fall": {
      type: "damage_reduction",
      trigger: "falling",
      formula: "5 \xD7 monk_level",
      description: "Reduce falling damage by 5 \xD7 monk level"
    },
    "stunning strike": {
      type: "save_effect",
      trigger: "melee_weapon_attack_hit",
      cost: "1_ki_point",
      saveType: "constitution",
      effect: "stunned",
      description: "Force Con save or be stunned (1 ki)"
    },
    "stillness of mind": {
      type: "condition_end",
      timing: "action",
      conditions: ["charmed", "frightened"],
      description: "Action to end charmed or frightened"
    },
    "purity of body": {
      type: "immunity",
      effects: ["poison_immunity", "disease_immunity"],
      description: "Immune to poison and disease"
    },
    "diamond soul": {
      type: "save_reroll",
      trigger: "failed_save",
      cost: "1_ki_point",
      description: "Reroll failed save for 1 ki"
    },
    "empty body": {
      type: "defensive_buff",
      cost: "4_ki_points",
      effects: ["invisible", "resistance_to_all_damage_except_force"],
      description: "Invisible + resistance (except force) for 4 ki"
    },
    "wholeness of body": {
      type: "healing",
      actionType: "action",
      healingFormula: "monk_level * 3",
      cost: "action",
      description: "Action to heal monk level \xD7 3 HP"
    },
    "tongue of the sun and moon": {
      type: "language_understanding",
      effect: "understand_all_spoken_languages",
      description: "Understand all spoken languages"
    },
    "timeless body": {
      type: "immunity",
      effects: ["no_aging", "no_food_water_requirements"],
      description: "Don't age, no food/water requirements"
    },
    "perfect self": {
      type: "resource_recovery",
      trigger: "start_turn_with_0_ki",
      effect: "regain_4_ki_points",
      condition: "start_of_turn",
      description: "Regain 4 ki if you start turn with 0"
    },
    // ===== PALADIN FEATURES =====
    "divine smite": {
      type: "divine_smite_modal",
      trigger: "melee_weapon_attack_hit",
      resource: "spell_slot",
      damageFormula: "2d8 + 1d8_per_spell_level_above_1st",
      damageType: "radiant",
      description: "Expend spell slot for extra radiant damage"
    },
    "lay on hands": {
      type: "healing_pool",
      resource: "lay_on_hands_pool",
      poolSize: "5 \xD7 paladin_level",
      action: "touch",
      description: "Heal from pool (5 \xD7 level total)"
    },
    "divine sense": {
      type: "senses",
      actionType: "action",
      range: "60_feet",
      detects: ["celestials", "fiends", "undead"],
      description: "Detect celestials/fiends/undead within 60ft"
    },
    "aura of protection": {
      type: "save_bonus",
      range: "10_feet",
      bonus: "charisma_modifier",
      appliesTo: "saves",
      targets: "self_and_allies",
      description: "Allies within 10ft add Cha mod to saves"
    },
    "aura of courage": {
      type: "immunity",
      range: "10_feet",
      effect: "frightened_immunity",
      targets: "self_and_allies",
      description: "Allies within 10ft immune to frightened"
    },
    "cleansing touch": {
      type: "spell_end",
      actionType: "action",
      cost: "uses_equal_to_charisma_modifier",
      effect: "end_one_spell",
      description: "End one spell on touched creature"
    },
    "avenging angel": {
      type: "attack_penalty",
      range: "10_feet",
      condition: "attack_target_other_than_you",
      effect: "disadvantage",
      description: "Disadvantage on attacks against others within 10ft"
    },
    "improved divine smite": {
      type: "passive_damage",
      trigger: "melee_weapon_hit",
      damageFormula: "1d8",
      damageType: "radiant",
      description: "Always deal +1d8 radiant on melee weapon hits"
    },
    "divine health": {
      type: "immunity",
      effect: "disease_immunity",
      description: "Immunity to disease"
    },
    "sacred weapon": {
      type: "channel_divinity",
      actionType: "bonus_action",
      effect: "magical_weapon_plus_cha_to_attacks",
      duration: "1_minute",
      description: "Channel Divinity for magical weapon + add CHA to attacks"
    },
    "turn the unholy": {
      type: "channel_divinity",
      actionType: "action",
      effect: "turn_fiends_undead",
      saveType: "charisma",
      saveDC: "8 + proficiency + cha_mod",
      description: "Channel Divinity to turn fiends/undead"
    },
    // ===== RANGER FEATURES =====
    "favored enemy": {
      type: "advantage",
      appliesTo: ["survival_checks_to_track", "intelligence_checks_to_recall_info"],
      condition: "against_favored_enemy",
      description: "Advantage on tracking/recall checks vs favored enemy"
    },
    "natural explorer": {
      type: "terrain_benefits",
      condition: "in_favored_terrain",
      effects: [
        "difficult_terrain_no_slow",
        "cannot_get_lost_except_by_magic",
        "advantage_on_initiative_checks",
        "advantage_on_attacks_against_creatures_that_havent_acted_yet"
      ],
      description: "Various benefits in favored terrain"
    },
    "hunter's mark": {
      type: "conditional_damage",
      trigger: "hit_marked_creature",
      damageFormula: "1d6",
      moveable: true,
      description: "Extra 1d6 damage vs marked creature"
    },
    "colossus slayer": {
      type: "conditional_damage",
      trigger: "hit_creature_below_max_hp",
      damageFormula: "1d8",
      limitation: "once_per_turn",
      description: "Extra 1d8 damage vs creatures below max HP"
    },
    "horde breaker": {
      type: "bonus_attack",
      trigger: "attack_creature_with_enemy_within_5ft",
      condition: "second_enemy_within_reach",
      description: "Bonus attack against second enemy within 5ft"
    },
    "escape the horde": {
      type: "defense_bonus",
      trigger: "opportunity_attack_against_you",
      effect: "disadvantage_on_attack",
      description: "Opportunity attacks against you have disadvantage"
    },
    "multiattack defense": {
      type: "defense_bonus",
      trigger: "hit_by_attack",
      effect: "+4_ac_against_same_attacker_this_turn",
      description: "+4 AC against subsequent attacks from same attacker"
    },
    "vanish": {
      type: "stealth",
      actionType: "bonus_action",
      effect: "hide_plus_cannot_be_tracked_nonmagically",
      description: "Hide + cannot be tracked nonmagically"
    },
    "primeval awareness": {
      type: "senses",
      effect: "detect_creature_types",
      range: "1_to_6_miles",
      description: "Detect creature types within 1-6 miles"
    },
    "feral senses": {
      type: "advantage_override",
      effect: "no_disadvantage_on_attacks_vs_unseen_creatures",
      condition: "creatures_you_cannot_see",
      description: "Can't have disadvantage on attacks vs creatures you can't see"
    },
    "foe slayer": {
      type: "conditional_bonus",
      condition: "once_per_turn",
      effect: "add_wis_mod_to_attack_or_damage",
      appliesTo: ["attack_roll", "damage_roll"],
      description: "Add WIS mod to attack or damage once per turn"
    },
    // ===== CLERIC FEATURES =====
    "channel divinity": {
      type: "resource_feature",
      resource: "channel_divinity_uses",
      reset: "short_rest",
      options: "domain_specific",
      description: "Domain-specific abilities (uses reset on short rest)"
    },
    "turn undead": {
      type: "save_effect",
      actionType: "action",
      saveType: "wisdom",
      effect: "turned_and_flee",
      targets: "undead",
      description: "Undead fail save = turned and must flee"
    },
    "destroy undead": {
      type: "instant_kill",
      trigger: "undead_fails_turn_undead_save",
      condition: "cr_equal_or_below_threshold",
      description: "Destroy weak undead that fail Turn Undead"
    },
    "divine intervention": {
      type: "utility_dm_discretion",
      trigger: "roll_d100_equal_or_below_cleric_level",
      cooldown: "7_days",
      description: "Deity intervention on successful d100 roll"
    },
    "preserve life": {
      type: "aoe_healing",
      resource: "channel_divinity",
      healingFormula: "5 \xD7 cleric_level",
      distribution: "among_creatures",
      description: "Heal 5 \xD7 level distributed among creatures"
    },
    "wrath of the storm": {
      type: "reaction_damage",
      timing: "when_creature_within_5ft_hits_you",
      damageTypes: ["lightning", "thunder"],
      description: "Reaction lightning/thunder damage when hit within 5ft"
    },
    "blessed healer": {
      type: "self_healing",
      trigger: "cast_healing_spell_on_other",
      effect: "regain_hp_equal_to_2_plus_spell_level",
      description: "Heal yourself when healing others"
    },
    "disciple of life": {
      type: "healing_bonus",
      effect: "extra_healing",
      formula: "2_plus_spell_level",
      appliesTo: "all_healing_spells",
      description: "Extra 2+spell level healing"
    },
    "potent spellcasting": {
      type: "damage_bonus",
      appliesTo: "cantrip_damage",
      effect: "add_wis_mod_to_damage",
      description: "Add WIS mod to cantrip damage"
    },
    "divine strike": {
      type: "conditional_damage",
      condition: "weapon_attack",
      effect: "extra_damage",
      formula: "1d8_domain_dependent_2d8_at_14th_level",
      description: "Extra 1d8/2d8 damage (weapon dependent on domain)"
    },
    "corona of light": {
      type: "save_penalty",
      appliesTo: "enemy_saves",
      effects: ["disadvantage_vs_fire", "disadvantage_vs_radiant"],
      condition: "within_10_feet",
      description: "Enemies have disadvantage on saves vs fire/radiant"
    },
    // ===== WIZARD FEATURES =====
    "arcane recovery": {
      type: "resource_recovery",
      timing: "short_rest",
      resource: "spell_slots",
      formula: "wizard_level \xF7 2_rounded_up",
      maxLevel: "half_wizard_level",
      description: "Recover spell slots during short rest"
    },
    "spell mastery": {
      type: "at_will_casting",
      condition: "chosen_1st_and_2nd_level_spells",
      effect: "cast_without_slot",
      description: "Cast chosen 1st/2nd level spells at will"
    },
    "signature spells": {
      type: "free_casting",
      condition: "two_chosen_3rd_level_spells",
      trigger: "no_3rd_level_slots_remaining",
      limitation: "once_each_per_long_rest",
      description: "Free casting of chosen 3rd level spells when out of slots"
    },
    "sculpt spells": {
      type: "save_modification",
      condition: "evocation_spell",
      effect: "choose_creatures_to_auto_succeed_and_take_no_damage",
      description: "Protect allies from evocation spells"
    },
    "potent cantrip": {
      type: "damage_modification",
      condition: "cantrip_save_for_half_damage",
      effect: "still_take_half_damage_on_save",
      description: "Cantrips still deal half damage on successful save"
    },
    "empowered evocation": {
      type: "damage_bonus",
      condition: "evocation_spell",
      effect: "add_int_modifier_to_one_damage_roll",
      description: "Add Int mod to one evocation damage roll"
    },
    "overchannel": {
      type: "max_damage",
      condition: "1st_to_5th_level_spell",
      effect: "damage_rolls_are_maximum",
      drawback: "take_necrotic_damage",
      description: "Max damage but you take necrotic damage"
    },
    "portent": {
      type: "roll_replacement",
      resource: "portent_dice",
      trigger: "attack_roll_save_or_ability_check",
      condition: "creature_you_can_see",
      description: "Replace roll with portent die"
    },
    "expert divination": {
      type: "slot_recovery",
      trigger: "cast_divination_spell_2nd_level_or_higher",
      effect: "recover_spell_slot",
      maxLevel: "half_spell_level_rounded_down",
      description: "Recover spell slot after casting divination spells"
    },
    "benign transposition": {
      type: "teleport",
      trigger: "action_or_conjuration_spell_1st_level_or_higher",
      distance: "30_feet",
      options: ["teleport_self", "swap_places_with_willing_creature"],
      description: "Teleport or swap places when casting conjuration"
    },
    "instinctive charm": {
      type: "reaction_redirect",
      timing: "when_creature_attacks_you",
      effect: "wisdom_save_to_redirect_attack",
      description: "Reaction to redirect attack to another target"
    },
    "illusory reality": {
      type: "illusion_enhancement",
      trigger: "cast_illusion_spell",
      effect: "make_illusion_object_real",
      duration: "1_minute",
      description: "Make illusion object real for 1 minute"
    },
    "improved minor illusion": {
      type: "spell_enhancement",
      appliesTo: "minor_illusion",
      effect: "create_sound_and_image_simultaneously",
      description: "Can create sound AND image simultaneously"
    },
    "spell resistance": {
      type: "defense_bonus",
      effects: ["advantage_on_saves_vs_spells", "resistance_to_spell_damage"],
      description: "Advantage on saves vs spells, resistance to spell damage"
    },
    // ===== SORCERER FEATURES =====
    "flexible casting": {
      type: "resource_conversion",
      resource: "sorcery_points",
      conversion: "spell_slots_to_sorcery_points_and_vice_versa",
      description: "Convert spell slots \u2194 sorcery points"
    },
    "font of magic": {
      type: "resource_recovery",
      timing: "short_rest",
      resource: "sorcery_points",
      amount: "half_sorcery_points",
      limitation: "once_per_long_rest",
      description: "Regain half sorcery points on short rest"
    },
    "tides of chaos": {
      type: "advantage_with_wild_magic_trigger",
      trigger: "attack_roll_ability_check_or_save",
      effect: "advantage",
      drawback: "dm_may_trigger_wild_magic_surge",
      description: "Advantage but may trigger Wild Magic surge"
    },
    "metamagic variants": {
      type: "spell_modification_options",
      options: [
        {
          name: "quicken spell",
          effect: "cast_as_bonus_action",
          cost: "2_sorcery_points"
        },
        {
          name: "twinned spell",
          effect: "target_second_creature",
          cost: "1_sorcery_point"
        },
        {
          name: "heightened spell",
          effect: "disadvantage_on_save",
          cost: "3_sorcery_points"
        },
        {
          name: "empowered spell",
          effect: "reroll_damage_dice",
          cost: "1_sorcery_point"
        },
        {
          name: "subtle spell",
          effect: "no_verbal_somatic_components",
          cost: "1_sorcery_point"
        },
        {
          name: "distant spell",
          effect: "double_range",
          cost: "1_sorcery_point"
        },
        {
          name: "extended spell",
          effect: "double_duration",
          cost: "1_sorcery_point"
        }
      ],
      description: "Various spell modification options"
    },
    "elemental affinity": {
      type: "damage_bonus",
      condition: "draconic_origin_damage_type",
      effect: "add_cha_mod_to_one_damage_roll",
      description: "Add CHA mod to one damage roll of draconic type"
    },
    "bend luck": {
      type: "reaction_roll_modification",
      timing: "when_attack_save_or_check_made",
      effect: "add_or_subtract_1d4",
      description: "Reaction to add/subtract 1d4 from attack/save/check"
    },
    // ===== WARLOCK FEATURES =====
    "pact magic": {
      type: "resource_recovery",
      timing: "short_rest",
      resource: "all_spell_slots",
      description: "Regain all spell slots on short rest"
    },
    "mystic arcanum": {
      type: "limited_casting",
      resource: "once_per_long_rest_per_spell",
      spellLevels: [6, 7, 8, 9],
      description: "Cast 6th-9th level spells once per long rest each"
    },
    "dark one's blessing": {
      type: "healing_trigger",
      trigger: "reduce_creature_to_0_hp",
      effect: "gain_temp_hp",
      tempHpFormula: "warlock_level",
      description: "Temp HP when you reduce creature to 0"
    },
    "entropic ward": {
      type: "reaction",
      timing: "when_creature_succeeds_on_save_against_your_spell",
      effect: "impose_disadvantage_then_advantage_on_next_attack",
      description: "Reaction to impose disadvantage, then advantage on your next attack"
    },
    "thought shield": {
      type: "defense_bonus",
      effects: ["resistance_to_psychic", "reflect_psychic_damage"],
      description: "Resistance to psychic + reflect damage"
    },
    "eldritch invocations": {
      type: "feature_enhancement",
      notableOptions: [
        {
          name: "agonizing blast",
          effect: "add_cha_to_eldritch_blast_damage"
        },
        {
          name: "repelling blast",
          effect: "push_10ft_on_eldritch_blast_hit"
        },
        {
          name: "devil's sight",
          effect: "see_in_magical_darkness_120ft"
        },
        {
          name: "mask of many faces",
          effect: "at_will_disguise_self"
        }
      ],
      description: "Various eldritch invocations (too many to list)"
    },
    // ===== BARD FEATURES =====
    "bardic inspiration": {
      type: "resource_die",
      resource: "bardic_inspiration_die",
      duration: "10_minutes",
      trigger: "attack_roll_ability_check_or_save",
      effect: "add_die_to_roll",
      description: "Give d6/d8/d10/d12 to add to rolls"
    },
    "jack of all trades": {
      type: "skill_bonus",
      condition: "non_proficient_ability_checks",
      bonus: "half_proficiency_bonus",
      description: "Add half prof bonus to non-proficient checks"
    },
    "song of rest": {
      type: "healing_bonus",
      timing: "short_rest",
      condition: "allies_regain_hp",
      effect: "extra_hp",
      formula: "bardic_inspiration_die",
      description: "Allies regain extra HP during short rest"
    },
    "countercharm": {
      type: "save_bonus",
      range: "30_feet",
      condition: "saves_against_frightened_or_charmed",
      effect: "advantage",
      targets: "self_and_allies",
      description: "Advantage on saves vs frightened/charmed"
    },
    "cutting words": {
      type: "roll_subtraction",
      trigger: "attack_roll_ability_check_or_damage_roll",
      condition: "creature_you_can_see",
      effect: "subtract_bardic_inspiration_die",
      description: "Subtract Bardic Inspiration die from enemy rolls"
    },
    "peerless skill": {
      type: "roll_bonus",
      trigger: "ability_check",
      effect: "add_bardic_inspiration_die",
      description: "Add Bardic Inspiration die to ability check"
    },
    "mantle of inspiration": {
      type: "defensive_buff",
      actionType: "bonus_action",
      cost: "bardic_inspiration_die",
      effects: ["temp_hp_to_allies", "reaction_movement"],
      description: "Allies gain temp HP + reaction movement"
    },
    "magical secrets": {
      type: "spell_learning",
      effect: "learn_spells_from_other_classes",
      description: "Learn spells from other classes"
    },
    "superior inspiration": {
      type: "resource_recovery",
      trigger: "roll_initiative_with_no_inspiration_left",
      effect: "regain_one_use",
      description: "Regain one use when you roll initiative with none left"
    },
    "incomparable performance": {
      type: "social_aoe",
      actionType: "action",
      range: "60_feet",
      effects: ["charm_creatures", "frighten_creatures"],
      duration: "1_minute",
      description: "Use action to charm/frighten creatures within 60ft"
    },
    // ===== DRUID FEATURES =====
    "wild shape": {
      type: "transformation",
      resource: "uses",
      reset: "short_rest",
      revertCondition: "drop_to_0_hp",
      effect: "revert_with_previous_hp",
      description: "Transform into beast, revert with previous HP at 0 HP"
    },
    "combat wild shape": {
      type: "wild_shape_enhancement",
      actionType: "bonus_action",
      options: ["bonus_action_transform", "expend_spell_slots_to_heal_in_beast_form"],
      description: "Bonus action Wild Shape + heal in beast form"
    },
    "primal strike": {
      type: "damage_enhancement",
      condition: "in_beast_form",
      effect: "attacks_count_as_magical",
      description: "Beast form attacks count as magical"
    },
    "elemental wild shape": {
      type: "wild_shape_enhancement",
      condition: "wild_shape_use",
      options: ["transform_into_elemental"],
      description: "Wild Shape into elementals instead of beasts"
    },
    "thousand forms": {
      type: "at_will_spell",
      spell: "alter_self",
      description: "Cast Alter Self at will"
    },
    "circle forms": {
      type: "wild_shape_enhancement",
      effect: "higher_cr_beast_forms_based_on_level",
      description: "Transform into higher CR beasts based on level"
    },
    "symbiotic entity": {
      type: "alternative_wild_shape",
      condition: "use_wild_shape_charges",
      effects: ["temp_hp", "melee_damage_boost"],
      description: "Temp HP + damage boost instead of transforming"
    },
    "archdruid": {
      type: "wild_shape_enhancement",
      effect: "unlimited_wild_shapes",
      additionalEffects: ["ignore_verbal_somatic_components"],
      description: "Unlimited wild shapes, ignore verbal/somatic components"
    },
    // ===== 2024 PHB CHANGES =====
    "barbarian rage (2024)": {
      type: "resource_tracking",
      resource: "rage_points",
      maxResource: "barbarian_level",
      duration: "1_minute",
      endCondition: "no_attack_or_damage",
      damageBonus: "scales_with_level",
      ruleset: "2024",
      description: "Now adds more damage based on level (not just +2/+3/+4)"
    },
    "fighter second wind (2024)": {
      type: "healing",
      actionType: "bonus_action",
      healingFormula: "1d10 + 2 \xD7 fighter_level",
      resource: "once_per_rest",
      ruleset: "2024",
      description: "Now 1d10 + 2\xD7fighter level (was 1d10 + fighter level)"
    },
    "monk ki (2024)": {
      type: "resource_tracking",
      resource: "discipline_points_or_focus_points",
      ruleset: "2024",
      description: "Now called Discipline Points or Focus Points in some versions"
    },
    "paladin divine smite (2024)": {
      type: "resource_damage",
      trigger: "melee_weapon_attack_hit",
      resource: "spell_slot",
      condition: "part_of_attack_action",
      ruleset: "2024",
      description: "Now requires using a spell slot as part of the attack action (can't stockpile)"
    },
    "ranger favored enemy (2024)": {
      type: "advantage",
      appliesTo: ["survival_checks_to_track", "intelligence_checks_to_recall_info"],
      condition: "against_favored_enemy",
      ruleset: "2024",
      description: "Completely redesigned"
    },
    "sorcerer metamagic (2024)": {
      type: "spell_modification_options",
      ruleset: "2024",
      description: "Some options changed/rebalanced"
    },
    "warlock pact boon (2024)": {
      type: "feature_enhancement",
      ruleset: "2024",
      description: "Features associated with pacts changed significantly"
    },
    "bardic inspiration (2024)": {
      type: "resource_die",
      resource: "bardic_inspiration_die",
      duration: "10_minutes",
      trigger: "attack_roll_ability_check_or_save",
      effect: "add_die_to_roll",
      recharge: "short_rest_automatic",
      ruleset: "2024",
      description: "Now recharges on short rest automatically"
    }
  };
  function isClassFeatureEdgeCase2(featureName) {
    if (!featureName)
      return false;
    const normalizedLowerName = featureName.toLowerCase().replace(/[^a-z0-9\s:]/g, "").replace(/\s+/g, " ").trim();
    if (CLASS_FEATURE_EDGE_CASES.hasOwnProperty(normalizedLowerName)) {
      return true;
    }
    if (normalizedLowerName === "lay on hands: heal") {
      return true;
    }
    return false;
  }
  function getClassFeatureEdgeCase(featureName) {
    if (!featureName)
      return null;
    const normalizedLowerName = featureName.toLowerCase().replace(/[^a-z0-9\s:]/g, "").replace(/\s+/g, " ").trim();
    if (CLASS_FEATURE_EDGE_CASES.hasOwnProperty(normalizedLowerName)) {
      return CLASS_FEATURE_EDGE_CASES[normalizedLowerName];
    }
    if (normalizedLowerName === "lay on hands: heal") {
      return CLASS_FEATURE_EDGE_CASES["lay on hands"] || null;
    }
    return null;
  }
  function getClassFeaturesByType(type) {
    return Object.entries(CLASS_FEATURE_EDGE_CASES).filter(([name, config]) => config.type === type).map(([name, config]) => ({ name, ...config }));
  }
  function getAllClassFeatureEdgeCaseTypes() {
    const types = /* @__PURE__ */ new Set();
    Object.values(CLASS_FEATURE_EDGE_CASES).forEach((config) => {
      types.add(config.type);
    });
    return Array.from(types);
  }
  function applyClassFeatureEdgeCaseModifications2(feature, options) {
    const edgeCase = getClassFeatureEdgeCase(feature.name);
    if (!edgeCase) {
      return { options, skipNormalButtons: false };
    }
    const modifiedOptions = [...options];
    let skipNormalButtons = false;
    switch (edgeCase.type) {
      case "utility_dm_discretion":
        skipNormalButtons = true;
        break;
      case "resource_tracking":
        modifiedOptions.forEach((opt) => {
          opt.edgeCaseNote = `Resource: ${edgeCase.resource} (${edgeCase.maxResource})`;
        });
        break;
      case "advantage_disadvantage":
        modifiedOptions.forEach((opt) => {
          opt.edgeCaseNote = `\u2696\uFE0F ${edgeCase.description}`;
        });
        break;
      case "conditional_advantage":
        modifiedOptions.forEach((opt) => {
          opt.edgeCaseNote = `\u2705 ${edgeCase.condition}`;
        });
        break;
      case "reaction":
        modifiedOptions.forEach((opt) => {
          opt.edgeCaseNote = `\u26A1 ${edgeCase.timing}`;
        });
        break;
      case "save_reroll":
        modifiedOptions.forEach((opt) => {
          opt.edgeCaseNote = `\u{1F504} ${edgeCase.trigger}`;
        });
        break;
      case "bonus_action":
        modifiedOptions.forEach((opt) => {
          opt.edgeCaseNote = `\u26A1 Bonus Action`;
        });
        break;
      case "divine_smite_modal":
        skipNormalButtons = true;
        break;
      case "resource_damage":
        modifiedOptions.forEach((opt) => {
          opt.edgeCaseNote = `\u{1F4B0} Cost: ${edgeCase.resource}`;
        });
        break;
      case "healing_pool":
        skipNormalButtons = true;
        break;
      default:
        if (edgeCase.description) {
          modifiedOptions.forEach((opt) => {
            opt.edgeCaseNote = edgeCase.description;
          });
        }
        break;
    }
    return { options: modifiedOptions, skipNormalButtons };
  }
  if (typeof globalThis !== "undefined") {
    globalThis.CLASS_FEATURE_EDGE_CASES = CLASS_FEATURE_EDGE_CASES;
    globalThis.isClassFeatureEdgeCase = isClassFeatureEdgeCase2;
    globalThis.getClassFeatureEdgeCase = getClassFeatureEdgeCase;
    globalThis.applyClassFeatureEdgeCaseModifications = applyClassFeatureEdgeCaseModifications2;
    globalThis.getClassFeaturesByType = getClassFeaturesByType;
    globalThis.getAllClassFeatureEdgeCaseTypes = getAllClassFeatureEdgeCaseTypes;
  }

  // ../core/src/modules/racial-feature-edge-cases.js
  var RACIAL_FEATURE_EDGE_CASES = {
    // ===== HALFLING FEATURES =====
    "lucky": {
      type: "reroll",
      trigger: "roll_1_on_attack_save_or_check",
      condition: "self_or_ally_within_30_feet",
      effect: "reroll_the_die",
      description: "Reroll 1s on attacks/saves/checks (self or ally within 30ft)"
    },
    "brave": {
      type: "save_advantage",
      condition: "save_against_frightened",
      effect: "advantage",
      description: "Advantage on saves against being frightened"
    },
    "halfling nimbleness": {
      type: "movement_enhancement",
      effect: "can_move_through_space_of_creature_larger_than_you",
      description: "Move through space of creatures larger than you"
    },
    // ===== DWARF FEATURES =====
    "dwarven resilience": {
      type: "damage_resistance_and_save_advantage",
      damageType: "poison",
      saveAdvantage: "poison_saves",
      description: "Poison resistance + advantage on poison saves"
    },
    "stonecunning": {
      type: "skill_bonus",
      condition: "intelligence_check_recall_information_about_stonework",
      effect: "double_proficiency_bonus",
      description: "Double prof bonus on stonework history checks"
    },
    "dwarven toughness": {
      type: "hp_increase",
      effect: "+1_hp_per_level",
      description: "+1 HP per level"
    },
    // ===== ELF FEATURES =====
    "fey ancestry": {
      type: "save_advantage_and_immunity",
      saveAdvantage: "charmed_saves",
      immunity: "magic_sleep",
      description: "Advantage on charm saves + immune to magic sleep"
    },
    "trance": {
      type: "rest_replacement",
      effect: "meditate_4_hours_instead_of_sleep_8_hours",
      description: "Meditate 4 hours instead of sleeping 8 hours"
    },
    "mask of the wild": {
      type: "stealth_enhancement",
      condition: "in_natural_surroundings",
      effect: "attempt_to_hide_even_only_lightly_obscured",
      description: "Hide in natural surroundings when only lightly obscured"
    },
    // ===== HUMAN FEATURES =====
    "variant human": {
      type: "customizable",
      options: ["skill_proficiency", "feat"],
      description: "Choose 1 skill proficiency + 1 feat"
    },
    // ===== DRAGONBORN FEATURES =====
    "breath weapon": {
      type: "area_damage",
      actionType: "action",
      recharge: "short_rest",
      area: "15_foot_cone_30_foot_line",
      damageFormula: "2d6",
      damageType: "chosen_draconic_ancestry",
      saveType: "dexterity",
      saveDC: "8 + con_mod + prof_bonus",
      description: "Cone/line damage, Dex save for half"
    },
    "dragonborn damage resistance": {
      type: "damage_resistance",
      damageType: "chosen_draconic_ancestry",
      description: "Resistance to chosen damage type"
    },
    // ===== GNOME FEATURES =====
    "gnome cunning": {
      type: "save_advantage",
      saveTypes: ["intelligence", "wisdom", "charisma"],
      effect: "advantage",
      description: "Advantage on Int/Wis/Cha saves"
    },
    "artificer's lore": {
      type: "skill_bonus",
      condition: "intelligence_check_magical_technological_item",
      effect: "double_proficiency_bonus",
      description: "Double prof bonus on magic/tech item checks"
    },
    "tinker": {
      type: "crafting_ability",
      options: ["tiny_clockwork_device", "explosive_device", "minor_magic_item"],
      description: "Create tiny clockwork devices, explosives, or minor magic items"
    },
    // ===== HALF-ORC FEATURES =====
    "relentless endurance": {
      type: "death_prevention",
      trigger: "reduced_to_0_hp_but_not_killed",
      effect: "drop_to_1_hp_instead",
      resource: "once_per_long_rest",
      description: "Drop to 1 HP instead of 0 (once per long rest)"
    },
    "savage attacks": {
      type: "damage_bonus",
      trigger: "critical_hit_with_melee_weapon",
      effect: "add_one_damage_die",
      description: "Add one damage die to melee crits"
    },
    // ===== HALF-ELF FEATURES =====
    "skill versatility": {
      type: "skill_proficiency",
      effect: "two_skill_proficiencies",
      description: "Choose two skill proficiencies"
    },
    "half-elf fey ancestry": {
      type: "save_advantage_and_immunity",
      saveAdvantage: "charmed_saves",
      immunity: "magic_sleep",
      description: "Advantage on charm saves + immune to magic sleep"
    },
    // ===== TIEFLING FEATURES =====
    "hellish resistance": {
      type: "damage_resistance",
      damageType: "fire",
      description: "Fire resistance"
    },
    "innate spellcasting": {
      type: "innate_magic",
      spells: ["thaumaturgy", "hellish_rebuke", "darkness"],
      spellLevels: [0, 1, 2],
      description: "Innate ability to cast Thaumaturgy, Hellish Rebuke, Darkness"
    },
    // ===== AASIMAR FEATURES =====
    "celestial resistance": {
      type: "damage_resistance_and_save_advantage",
      damageTypes: ["necrotic", "radiant"],
      saveAdvantage: "charmed_frightened_saves",
      description: "Necrotic/radiant resistance + advantage on charm/frighten saves"
    },
    "healing hands": {
      type: "healing",
      resource: "once_per_long_rest",
      healingFormula: "character_level",
      action: "touch",
      description: "Heal HP equal to your level (once per long rest)"
    },
    "light bearer": {
      type: "light_cantrip",
      spell: "light",
      description: "Can cast Light cantrip at will"
    },
    "necrotic shroud": {
      type: "area_effect",
      actionType: "bonus_action",
      resource: "once_per_long_rest",
      area: "10_foot_radius",
      duration: "1_minute",
      effects: [
        "frightened_creatures_in_area",
        "extra_necrotic_damage_against_frightened"
      ],
      description: "Frighten creatures in 10ft, extra necrotic damage vs frightened"
    },
    "radiant consumption": {
      type: "area_damage_and_buff",
      actionType: "bonus_action",
      resource: "once_per_long_rest",
      area: "10_foot_radius",
      duration: "1_minute",
      effects: [
        "radiant_damage_to_hostile_creatures",
        "radiant_damage_to_self",
        "bright_light"
      ],
      description: "Radiant damage to enemies + self, bright light"
    },
    "radiant soul": {
      type: "flight_and_damage",
      actionType: "bonus_action",
      resource: "once_per_long_rest",
      duration: "1_minute",
      effects: [
        "fly_speed_equal_to_walking_speed",
        "extra_radiant_damage"
      ],
      description: "Fly + extra radiant damage"
    },
    "transformed": {
      type: "transformation",
      actionType: "action",
      resource: "once_per_long_rest",
      duration: "1_minute",
      effects: [
        "special_armor_class",
        "special_weapons",
        "fear_aura",
        "once_per_turn_blinding_light"
      ],
      description: "Transform with special AC, weapons, fear aura, blinding light"
    },
    // ===== FIRBOLG FEATURES =====
    "firbolg magic": {
      type: "innate_magic",
      spells: ["detect_magic", "disguise_self"],
      description: "Innate Detect Magic + Disguise Self"
    },
    "hidden step": {
      type: "stealth",
      actionType: "bonus_action",
      resource: "once_per_short_rest",
      effect: "invisible_until_next_turn_or_attack_or_cast_spell",
      description: "Bonus action invisibility until next turn/attack/cast"
    },
    "speech of beast and leaf": {
      type: "communication",
      effects: [
        "communicate_with_beasts_and_plants",
        "cannot_be_charmed_or_frightened_by_elementals_or_fey"
      ],
      description: "Talk to beasts/plants + immune to elemental/fey charm/frighten"
    },
    "firbolg powerful build": {
      type: "carry_capacity",
      effect: "double_carry_capacity_push_pull_lift",
      description: "Double carry/push/pull/lift capacity"
    },
    // ===== GOLIATH FEATURES =====
    "stone's endurance": {
      type: "damage_reduction",
      timing: "reaction",
      trigger: "take_damage",
      effect: "reduce_damage_by_1d12_plus_con_mod",
      resource: "once_per_short_rest",
      description: "Reaction: reduce damage by 1d12 + Con mod"
    },
    "goliath powerful build": {
      type: "carry_capacity",
      effect: "double_carry_capacity_push_pull_lift",
      description: "Double carry/push/pull/lift capacity"
    },
    "mountain born": {
      type: "environmental_adaptation",
      effects: ["cold_resistance", "acclimated_to_high_altitude"],
      description: "Cold resistance + acclimated to high altitude"
    },
    // ===== KENKU FEATURES =====
    "mimicry": {
      type: "sound_imitation",
      effect: "mimic_sounds_heard",
      limitation: "cannot_create_new_sounds",
      description: "Mimic sounds heard, cannot create new sounds"
    },
    "expert forgery": {
      type: "skill_bonus",
      condition: "forgery_duplications",
      effect: "add_double_proficiency_bonus",
      description: "Double prof bonus on forgery attempts"
    },
    // ===== LIZARDFOLK FEATURES =====
    "bite": {
      type: "natural_weapon",
      damageFormula: "1d4",
      damageType: "piercing",
      description: "Natural bite attack"
    },
    "cunning artisan": {
      type: "crafting_ability",
      effect: "craft_simple_weapon_from_corpse_bones",
      limitation: "one_per_long_rest",
      description: "Craft simple weapon from corpse/bone (1 per long rest)"
    },
    "hold breath": {
      type: "survival_ability",
      effect: "hold_breath_for_15_minutes",
      description: "Hold breath for 15 minutes"
    },
    "natural armor": {
      type: "armor_class",
      baseAC: "13 + dexterity_modifier",
      limitation: "cannot_wear_armor",
      description: "AC 13 + Dex (no armor)"
    },
    "hungry jaws": {
      type: "bonus_action_attack",
      actionType: "bonus_action",
      resource: "once_per_short_rest",
      damageFormula: "1d6",
      damageType: "piercing",
      condition: "must_hit_with_attack",
      description: "Bonus action bite attack for 1d6 piercing"
    },
    // ===== TABAXI FEATURES =====
    "cat's claws": {
      type: "natural_weapon",
      damageFormula: "1d4",
      damageType: "slashing",
      description: "Natural claw attacks (unarmed)"
    },
    "cat's talent": {
      type: "skill_bonus",
      skills: ["stealth", "perception"],
      effect: "double_proficiency_bonus",
      description: "Double prof bonus in Stealth and Perception"
    },
    "feline agility": {
      type: "movement_boost",
      trigger: "move_on_turn",
      effect: "double_speed_until_end_of_turn",
      limitation: "once_per_turn",
      resetType: "special",
      // Resets when you move 0 feet on a turn, NOT on rest
      description: "Double speed until end of turn. Recharges when you move 0 feet on a turn (not on rest)."
    },
    // ===== TRITON FEATURES =====
    "amphibious": {
      type: "environmental_adaptation",
      effects: ["breathe_air_and_water", "swim_speed_40ft"],
      description: "Breathe air/water + 40ft swim speed"
    },
    "control air and water": {
      type: "elemental_control",
      spells: ["fog_cloud", "gust_of_wind", "wall_of_water"],
      description: "Cast Fog Cloud, Gust of Wind, Wall of Water"
    },
    "guardian of the depths": {
      type: "environmental_resistance",
      condition: "10_minutes_in_crushing_pressure",
      effect: "resistance_to_cold_damage",
      description: "Cold resistance after 10min in crushing pressure"
    },
    "emissary of the sea": {
      type: "communication",
      effects: [
        "communicate_simple_ideas_with_beasts_aquatic",
        "understand_any_language_aquatic"
      ],
      description: "Talk to aquatic beasts + understand aquatic languages"
    },
    // ===== VERDAN FEATURES =====
    "black blood healing": {
      type: "healing",
      trigger: "take_poison_damage",
      effect: "regain_hp_equal_to_poison_damage_taken",
      description: "Regain HP when taking poison damage"
    },
    "persuasive": {
      type: "skill_bonus",
      skills: ["persuasion", "deception"],
      effect: "advantage",
      description: "Advantage on Persuasion and Deception checks"
    },
    "limited telepathy": {
      type: "telepathy",
      range: "30_feet",
      condition: "creatures_understand_at_least_one_language",
      description: "30ft telepathy with creatures that know a language"
    },
    // ===== CHANGELING FEATURES =====
    "shapechanger": {
      type: "transformation",
      actionType: "action",
      effect: "polymorph_into_humanoid",
      limitation: "same_size_and_sex",
      description: "Shapechange into humanoid of same size/sex"
    },
    "deceptive": {
      type: "skill_bonus",
      skills: ["deception", "stealth"],
      effect: "advantage",
      description: "Advantage on Deception and Stealth checks"
    },
    // ===== SATYR FEATURES =====
    "fey magic": {
      type: "innate_magic",
      spells: ["druidcraft", "charm_person"],
      description: "Innate Druidcraft + Charm Person"
    },
    "mirthful leapers": {
      type: "movement_enhancement",
      effects: [
        "jump_distance_doubled",
        "advantage_on_strength_athletics_checks_to_jump"
      ],
      description: "Double jump distance + advantage on jump Athletics checks"
    },
    "reveler": {
      type: "skill_bonus",
      skills: ["acrobatics", "persuasion"],
      effect: "advantage",
      description: "Advantage on Acrobatics and Persuasion checks"
    },
    // ===== OWLIN FEATURES =====
    "flight": {
      type: "flight",
      speed: "walking_speed",
      limitation: "medium_armor_only",
      description: "Fly at walking speed (medium armor only)"
    },
    "silent hunt": {
      type: "stealth_enhancement",
      effect: "no_disadvantage_on_stealth_checks_from_perception",
      description: "No disadvantage on Stealth from Perception"
    },
    // ===== LEONIN FEATURES =====
    "daunting roar": {
      type: "area_effect",
      actionType: "action",
      resource: "once_per_short_rest",
      area: "10_foot_radius",
      duration: "1_minute",
      effects: [
        "frightened_creatures_in_area",
        "creatures_can_use_save_to_end_effect_early"
      ],
      saveType: "wisdom",
      saveDC: "8 + strength_mod + prof_bonus",
      description: "Frighten creatures in 10ft for 1 minute (Wis save)"
    },
    "leonin damage resistance": {
      type: "damage_resistance",
      damageType: "necrotic",
      description: "Necrotic resistance"
    },
    "leonine agility": {
      type: "defense_bonus",
      condition: "not_wearing_heavy_armor",
      effect: "advantage_on_dexterity_saving_throws",
      description: "Advantage on Dex saves (not heavy armor)"
    },
    // ===== RAVENITE FEATURES =====
    "fire resistance": {
      type: "damage_resistance",
      damageType: "fire",
      description: "Fire resistance"
    },
    "wings of the raven": {
      type: "flight",
      speed: "30_feet",
      limitation: "no_heavy_armor",
      description: "30ft fly speed (no heavy armor)"
    },
    // ===== GITH FEATURES =====
    "astral knowledge": {
      type: "skill_bonus",
      effect: "proficient_in_two_skills",
      description: "Choose two skill proficiencies"
    },
    "gith psionics": {
      type: "innate_magic",
      spells: ["mage_hand", "jump", "misty_step"],
      description: "Innate Mage Hand, Jump, Misty Step"
    },
    "decadent mastery": {
      type: "skill_bonus",
      effect: "proficient_with_light_armor",
      description: "Light armor proficiency"
    },
    "void resistance": {
      type: "damage_resistance_and_save_advantage",
      damageTypes: ["psychic", "force"],
      saveAdvantage: "charmed_frightened_saves",
      description: "Psychic/force resistance + advantage on charm/frighten saves"
    },
    // ===== MISSING RACES =====
    "warf forged": {
      type: "defense_calculation",
      effect: "integrated_protection",
      description: "AC calculation includes integrated protection"
    },
    "warf constructed resilience": {
      type: "immunity",
      effects: ["poison_resistance", "disease_resistance", "advantage_vs_poison_disease_saves"],
      description: "Various immunities and resistances"
    },
    "aarakocra": {
      type: "flight_ability",
      effect: "fly_speed",
      description: "Flight speed"
    },
    "bugbear surprise attack": {
      type: "surprise_attack",
      effect: "advantage_on_attack_against_surprised_creatures",
      description: "Surprise attack advantage"
    },
    "bugbear long-limbed": {
      type: "reach_extension",
      effect: "5ft_reach",
      description: "Long-limbed reach"
    },
    "goblin fury of the small": {
      type: "damage_bonus",
      condition: "creature_larger_than_you",
      effect: "bonus_damage",
      description: "Bonus damage against larger creatures"
    },
    "goblin nimble escape": {
      type: "disengage",
      actionType: "bonus_action",
      effect: "hide_as_bonus_action",
      description: "Hide as bonus action"
    },
    "hobgoblin saving face": {
      type: "reroll",
      trigger: "failed_attack_or_check",
      effect: "reroll_with_advantage",
      description: "Reroll failed attack or check with advantage"
    },
    "kobold pack tactics": {
      type: "attack_bonus",
      condition: "ally_within_5ft",
      effect: "advantage_on_attack",
      description: "Advantage on attack when ally within 5ft"
    },
    "kobold sunlight sensitivity": {
      type: "disadvantage",
      condition: "in_sunlight",
      effect: "disadvantage_on_attacks_and_perception_checks",
      description: "Disadvantage in sunlight"
    },
    "orc aggressive": {
      type: "movement_bonus",
      actionType: "bonus_action",
      effect: "dash_toward_enemy",
      description: "Bonus action dash toward enemy"
    },
    "orc powerful build": {
      type: "carry_capacity",
      effect: "double_carrying_capacity",
      description: "Double carrying capacity"
    },
    "yuan-ti pureblood": {
      type: "immunity",
      effects: ["magic_resistance", "poison_immunity"],
      description: "Magic resistance + poison immunity"
    },
    "tortle natural armor": {
      type: "defense_bonus",
      effect: "ac_17_natural_armor",
      description: "Natural armor AC 17"
    },
    "tortle shell defense": {
      type: "defense_action",
      actionType: "action",
      effect: "add_shield_bonus_to_ac",
      description: "Action to add shield bonus to AC"
    },
    "grung poison skin": {
      type: "contact_poison",
      effect: "poison_on_contact",
      description: "Poison skin"
    },
    "grung standing leap": {
      type: "movement_enhancement",
      effect: "standing_jump",
      jumpDistance: "height",
      description: "Standing jump equal to height"
    },
    "centaur equine build": {
      type: "movement_type",
      effects: ["cannot_be_ridden", "no_climbing_swimming_costs_extra"],
      description: "Equine build limitations"
    },
    "centaur hooves": {
      type: "attack",
      actionType: "action",
      damageFormula: "2d4 + strength_mod",
      description: "Hooves attack"
    },
    "centaur charge": {
      type: "attack_bonus",
      condition: "move_at_least_20ft_straight_line",
      effect: "bonus_damage",
      description: "Bonus damage on charge"
    },
    // ===== 2024 RACIAL CHANGES =====
    "lucky (2024)": {
      type: "advantage",
      trigger: "roll_1_on_attack_save_or_check",
      condition: "self_or_ally_within_30_feet",
      effect: "advantage_instead_of_reroll",
      ruleset: "2024",
      description: "Now gives advantage instead of rerolls"
    },
    "breath weapon (2024)": {
      type: "damage_aoe",
      actionType: "action",
      damageFormula: "2d6_dragon_breath",
      saveType: "dexterity",
      saveDC: "8 + proficiency + con_mod",
      recharge: "short_rest",
      ruleset: "2024",
      description: "2024 version of dragonborn breath weapon"
    }
  };
  function isRacialFeatureEdgeCase2(featureName) {
    if (!featureName)
      return false;
    const lowerName = featureName.toLowerCase().trim();
    return RACIAL_FEATURE_EDGE_CASES.hasOwnProperty(lowerName);
  }
  function getRacialFeatureEdgeCase(featureName) {
    if (!featureName)
      return null;
    const lowerName = featureName.toLowerCase().trim();
    return RACIAL_FEATURE_EDGE_CASES[lowerName] || null;
  }
  function applyRacialFeatureEdgeCaseModifications2(feature, options) {
    const edgeCase = getRacialFeatureEdgeCase(feature.name);
    if (!edgeCase) {
      return { options, skipNormalButtons: false };
    }
    const modifiedOptions = [...options];
    let skipNormalButtons = false;
    switch (edgeCase.type) {
      case "innate_magic":
        modifiedOptions.forEach((opt) => {
          opt.edgeCaseNote = `\u{1F52E} ${edgeCase.spells.join(", ")}`;
        });
        break;
      case "damage_resistance":
        if (Array.isArray(edgeCase.damageTypes)) {
          modifiedOptions.forEach((opt) => {
            opt.edgeCaseNote = `\u{1F6E1}\uFE0F Resistance to: ${edgeCase.damageTypes.join(", ")}`;
          });
        } else {
          modifiedOptions.forEach((opt) => {
            opt.edgeCaseNote = `\u{1F6E1}\uFE0F Resistance to: ${edgeCase.damageType}`;
          });
        }
        break;
      case "save_advantage":
        if (Array.isArray(edgeCase.saveTypes)) {
          modifiedOptions.forEach((opt) => {
            opt.edgeCaseNote = `\u2705 Advantage on: ${edgeCase.saveTypes.join(", ")} saves`;
          });
        } else {
          modifiedOptions.forEach((opt) => {
            opt.edgeCaseNote = `\u2705 Advantage on: ${edgeCase.saveAdvantage}`;
          });
        }
        break;
      case "flight":
        modifiedOptions.forEach((opt) => {
          opt.edgeCaseNote = `\u{1FAB6} Fly ${edgeCase.speed} ${edgeCase.limitation ? `(${edgeCase.limitation})` : ""}`;
        });
        break;
      case "natural_weapon":
        modifiedOptions.forEach((opt) => {
          opt.edgeCaseNote = `\u2694\uFE0F ${edgeCase.damageFormula} ${edgeCase.damageType}`;
        });
        break;
      case "telepathy":
        modifiedOptions.forEach((opt) => {
          opt.edgeCaseNote = `\u{1F9E0} ${edgeCase.range} telepathy`;
        });
        break;
      case "skill_bonus":
        if (Array.isArray(edgeCase.skills)) {
          modifiedOptions.forEach((opt) => {
            opt.edgeCaseNote = `\u{1F4DA} Bonus to: ${edgeCase.skills.join(", ")}`;
          });
        } else {
          modifiedOptions.forEach((opt) => {
            opt.edgeCaseNote = `\u{1F4DA} ${edgeCase.condition}`;
          });
        }
        break;
      default:
        if (edgeCase.description) {
          modifiedOptions.forEach((opt) => {
            opt.edgeCaseNote = edgeCase.description;
          });
        }
        break;
    }
    return { options: modifiedOptions, skipNormalButtons };
  }
  if (typeof globalThis !== "undefined") {
    globalThis.RACIAL_FEATURE_EDGE_CASES = RACIAL_FEATURE_EDGE_CASES;
    globalThis.isRacialFeatureEdgeCase = isRacialFeatureEdgeCase2;
    globalThis.getRacialFeatureEdgeCase = getRacialFeatureEdgeCase;
    globalThis.applyRacialFeatureEdgeCaseModifications = applyRacialFeatureEdgeCaseModifications2;
  }

  // ../core/src/modules/combat-maneuver-edge-cases.js
  var COMBAT_MANEUVER_EDGE_CASES = {
    // ===== STANDARD COMBAT ACTIONS =====
    "grapple": {
      type: "contest_check",
      actionType: "action",
      attackType: "athletics",
      defenseType: "athletics_or_acrobatics",
      effect: "grappled_condition",
      description: "Athletics vs Athletics/Acrobatics to grapple target"
    },
    "shove": {
      type: "contest_check",
      actionType: "action",
      attackType: "athletics",
      defenseType: "athletics_or_acrobatics",
      effects: ["knock_prone", "push_5_feet"],
      description: "Athletics vs Athletics/Acrobatics to shove prone or push 5ft"
    },
    "opportunity attack": {
      type: "reaction",
      timing: "when_creature_leaves_your_reach",
      action: "weapon_attack",
      limitation: "one_per_creature_per_turn",
      description: "Reaction attack when creature leaves your reach"
    },
    "ready action": {
      type: "conditional_action",
      actionType: "action",
      trigger: "user_specified_condition",
      timing: "reaction",
      description: "Set trigger condition, then react with specified action"
    },
    "disarm": {
      type: "contest_check",
      actionType: "action",
      attackType: "attack_roll",
      defenseType: "athletics_or_acrobatics",
      effect: "target_drops_item",
      description: "Attack roll vs Athletics/Acrobatics to disarm target"
    },
    "overrun": {
      type: "contest_check",
      actionType: "action",
      attackType: "athletics",
      defenseType: "athletics_or_acrobatics",
      effect: "move_through_space",
      description: "Athletics vs Athletics/Acrobatics to move through space"
    },
    // ===== BATTLE MASTER MANEUVERS =====
    "bait and switch": {
      type: "defensive_swap",
      cost: "1_superiority_die",
      timing: "bonus_action",
      condition: "move_within_5ft_of_ally",
      effect: "swap_ac_bonuses",
      duration: "1_minute",
      description: "Move near ally to swap AC bonuses for 1 minute"
    },
    "brace": {
      type: "reaction_attack",
      cost: "1_superiority_die",
      timing: "reaction",
      condition: "creature_moves_into_your_reach",
      action: "weapon_attack",
      description: "Reaction attack when creature moves into reach"
    },
    "commander's strike": {
      type: "ally_reaction",
      cost: "1_superiority_die",
      timing: "on_your_turn",
      condition: "forgo_one_attack",
      effect: "ally_reaction_attack",
      description: "Forgo attack to give ally reaction attack"
    },
    "disarming attack": {
      type: "attack_with_debuff",
      cost: "1_superiority_die",
      timing: "on_hit",
      condition: "hit_attack",
      saveType: "strength",
      saveFailure: "drops_one_item",
      description: "Hit + Str save or target drops item"
    },
    "distracting strike": {
      type: "attack_with_debuff",
      cost: "1_superiority_die",
      timing: "on_hit",
      condition: "hit_attack",
      effect: "next_attack_disadvantage",
      duration: "until_your_next_turn",
      description: "Hit - next attack vs target has disadvantage"
    },
    "evasive footwork": {
      type: "bonus_action_defense",
      cost: "1_superiority_die",
      timing: "bonus_action",
      condition: "when_you_move",
      effect: "add_superiority_die_to_ac",
      duration: "until_you_stop_moving",
      description: "Move + add superiority die to AC while moving"
    },
    "feinting attack": {
      type: "bonus_action_setup",
      cost: "1_superiority_die",
      timing: "bonus_action",
      condition: "before_attack",
      effect: "advantage_on_next_attack",
      description: "Bonus action feint for advantage on next attack"
    },
    "goading attack": {
      type: "attack_with_debuff",
      cost: "1_superiority_die",
      timing: "on_hit",
      condition: "hit_attack",
      saveType: "wisdom",
      saveFailure: "disadvantage_on_attacks_against_others",
      duration: "1_minute",
      description: "Hit - Wis save or target has disadvantage on attacks vs others"
    },
    "lunging attack": {
      type: "attack_enhancement",
      cost: "1_superiority_die",
      timing: "when_making_attack",
      effect: "increase_reach_by_5_feet",
      description: "Increase reach by 5ft for this attack"
    },
    "maneuvering attack": {
      type: "ally_movement",
      cost: "1_superiority_die",
      timing: "on_hit",
      condition: "hit_attack",
      effect: "ally_reaction_move",
      distance: "half_speed",
      description: "Hit - ally can reaction move half speed without provoking"
    },
    "menacing attack": {
      type: "attack_with_debuff",
      cost: "1_superiority_die",
      timing: "on_hit",
      condition: "hit_attack",
      saveType: "wisdom",
      saveFailure: "frightened_condition",
      duration: "1_minute",
      description: "Hit - Wis save or target is frightened"
    },
    "pushing attack": {
      type: "attack_with_debuff",
      cost: "1_superiority_die",
      timing: "on_hit",
      condition: "hit_attack",
      saveType: "strength",
      saveFailure: "push_15_feet",
      description: "Hit - Str save or push target 15ft"
    },
    "rally": {
      type: "ally_buff",
      cost: "1_superiority_die",
      timing: "bonus_action",
      condition: "ally_can_see_or_hear_you",
      effect: "temp_hp",
      formula: "superiority_die",
      description: "Bonus action - ally gains temp HP equal to superiority die"
    },
    "riposte": {
      type: "reaction_attack",
      cost: "1_superiority_die",
      timing: "reaction",
      condition: "melee_attack_misses_you",
      action: "weapon_attack",
      description: "Reaction attack when melee attack misses you"
    },
    "sweeping attack": {
      type: "area_damage",
      cost: "1_superiority_die",
      timing: "on_hit",
      condition: "hit_creature_with_another_enemy_within_5ft",
      effect: "damage_to_second_creature",
      formula: "superiority_die",
      description: "Hit creature - second creature within 5ft takes superiority die damage"
    },
    "trip attack": {
      type: "attack_with_debuff",
      cost: "1_superiority_die",
      timing: "on_hit",
      condition: "hit_attack",
      saveType: "strength",
      saveFailure: "knocked_prone",
      description: "Hit - Str save or target is knocked prone"
    },
    // ===== OPTIONAL COMBAT RULES =====
    "cleave": {
      type: "bonus_attack",
      condition: "reduce_creature_to_0_hp_with_melee_attack",
      effect: "attack_another_creature_within_reach",
      limitation: "once_per_turn",
      description: "Reduce creature to 0 HP - bonus attack against another creature"
    },
    "mark": {
      type: "debuff",
      actionType: "bonus_action",
      condition: "hit_creature_with_weapon_attack",
      effect: "disadvantage_on_attacks_against_others",
      duration: "until_your_next_turn",
      description: "Hit - target has disadvantage on attacks vs others"
    },
    "shove aside": {
      type: "movement_control",
      condition: "hit_creature_with_melee_attack",
      effect: "push_creature_5_feet_away",
      description: "Hit - push creature 5ft away"
    },
    // ===== SPECIAL COMBAT SITUATIONS =====
    "flanking": {
      type: "situational_advantage",
      condition: "ally_opposite_side_of_enemy",
      effect: "advantage_on_melee_attacks",
      description: "Advantage on melee attacks when flanking with ally"
    },
    "help": {
      type: "advantage_grant",
      actionType: "action",
      effect: "advantage_on_next_ability_check_or_attack_roll",
      target: "ally",
      description: "Give ally advantage on next check/attack"
    },
    "dodge": {
      type: "defensive_action",
      actionType: "action",
      effects: [
        "attacks_against_you_have_disadvantage",
        "dex_saves_advantage"
      ],
      duration: "until_your_next_turn",
      description: "Disadvantage on attacks vs you + advantage on Dex saves"
    },
    "hide": {
      type: "stealth_action",
      actionType: "action",
      requirement: "cannot_be_seen",
      effect: "hidden_condition",
      description: "Become hidden if not seen"
    },
    "search": {
      type: "investigation_action",
      actionType: "action",
      effect: "make_intelligence_investigation_check",
      description: "Search area with Investigation check"
    },
    "improvise weapon": {
      type: "weapon_substitution",
      effect: "use_any_object_as_weapon",
      damage: "1d4",
      damageType: "varies_by_object",
      description: "Use any object as improvised weapon (1d4 damage)"
    },
    // ===== TWO-WEAPON FIGHTING =====
    "two-weapon fighting": {
      type: "bonus_action_attack",
      condition: "taking_attack_action_with_light_melee_weapon",
      requirement: "must_have_light_melee_weapon_in_other_hand",
      effect: "bonus_attack_with_offhand_weapon",
      damage: "no_ability_modifier_to_damage",
      description: "Bonus action attack with offhand light weapon (no mod to damage)"
    },
    // ===== DUAL WIELDER FEAT =====
    "dual wielder": {
      type: "two_weapon_enhancement",
      effects: [
        "no_light_weapon_requirement",
        "use_two_handed_melee_weapon_in_one_hand",
        "+1_ac_while_dual_wielding"
      ],
      description: "Dual wield non-light weapons +1 AC"
    },
    // ===== GRAPPLING SPECIAL CASES =====
    "escape grapple": {
      type: "contest_check",
      actionType: "action",
      attackType: "athletics_or_acrobatics",
      defenseType: "athletics",
      effect: "end_grappled_condition",
      description: "Athletics/Acrobatics vs Athletics to escape grapple"
    },
    "restrain with grapple": {
      type: "contest_check",
      actionType: "action",
      condition: "already_grappling_target",
      attackType: "athletics",
      defenseType: "athletics",
      effect: "restrained_condition",
      description: "Athletics vs Athletics to restrain grappled target"
    },
    // ===== SHIELD SPECIAL CASES =====
    "shield bash": {
      type: "bonus_action_attack",
      condition: "wielding_shield",
      effect: "melee_weapon_attack_with_shield",
      damage: "1d4_bludgeoning",
      description: "Bonus action shield bash (1d4 bludgeoning)"
    },
    "shield master feat": {
      type: "bonus_action_combo",
      condition: "take_attack_action_while_wielding_shield",
      effect: "shove_as_bonus_action",
      description: "Attack action + bonus action shove with shield"
    },
    // ===== MOUNTED COMBAT =====
    "mount combat": {
      type: "mounted_benefits",
      effects: [
        "advantage_on_attacks_against_creatures_smaller_than_mount",
        "mount_act_as_separate_creature",
        "can_use_mount_as_cover"
      ],
      description: "Various benefits while mounted"
    },
    "dismount": {
      type: "movement_action",
      actionType: "half_action",
      effect: "dismount_from_mount",
      description: "Half action to dismount"
    },
    // ===== UNDERWATER COMBAT =====
    "underwater combat": {
      type: "environmental_modifier",
      effects: [
        "ranged_weapon_attacks_have_disadvantage",
        "melee_weapon_attacks_with_thrown_weapons_have_disadvantage",
        "creatures_without_swim_speed_have_disadvantage_on_attacks"
      ],
      description: "Underwater combat penalties"
    },
    // ===== COVER =====
    "half cover": {
      type: "defense_bonus",
      effect: "+2_to_ac_and_dex_saves",
      description: "+2 AC and Dex saves"
    },
    "three-quarters cover": {
      type: "defense_bonus",
      effect: "+5_to_ac_and_dex_saves",
      description: "+5 AC and Dex saves"
    },
    "total cover": {
      type: "defense_immunity",
      effect: "cannot_be_targeted_by_attacks_or_spells",
      description: "Cannot be targeted by attacks or spells"
    },
    // ===== PRONE CONDITION =====
    "stand up": {
      type: "movement_action",
      actionType: "half_action",
      effect: "end_prone_condition",
      description: "Half action to stand from prone"
    },
    "attack prone creature": {
      type: "attack_modifier",
      condition: "target_prone_and_within_5_feet",
      effect: "advantage_on_melee_attacks",
      description: "Advantage on melee attacks vs prone within 5ft"
    },
    "ranged attack prone creature": {
      type: "attack_modifier",
      condition: "target_prone_and_beyond_5_feet",
      effect: "disadvantage_on_ranged_attacks",
      description: "Disadvantage on ranged attacks vs prone beyond 5ft"
    },
    // ===== MISSING COMBAT MANEUVERS =====
    "climbing onto a bigger creature": {
      type: "contest_check",
      actionType: "action",
      attackType: "athletics",
      defenseType: "athletics_or_acrobatics",
      condition: "target_larger_than_you",
      effect: "grapple_and_mount",
      description: "Contest to grapple/mount larger creature"
    },
    "tumble": {
      type: "contest_check",
      actionType: "bonus_action",
      attackType: "acrobatics",
      defenseType: "acrobatics",
      effect: "move_through_hostile_space",
      description: "Acrobatics vs Acrobatics to move through hostile space"
    },
    "called shot": {
      type: "attack_modifier",
      actionType: "action",
      effect: "disadvantage_for_specific_effect",
      condition: "dm_discretion",
      description: "Disadvantage to attack for specific effect (DM discretion)"
    },
    "disarm self": {
      type: "free_action",
      actionType: "free_action",
      effect: "drop_item",
      description: "Drop item as free action"
    },
    "don shield": {
      type: "equipment_action",
      actionType: "action",
      effect: "equip_shield",
      description: "Action to equip shield"
    },
    "doff shield": {
      type: "equipment_action",
      actionType: "action",
      effect: "remove_shield",
      description: "Action to remove shield"
    },
    "don armor": {
      type: "equipment_action",
      actionType: "time_based_action",
      effect: "equip_armor",
      description: "Time-based action to equip armor"
    },
    "doff armor": {
      type: "equipment_action",
      actionType: "time_based_action",
      effect: "remove_armor",
      description: "Time-based action to remove armor"
    },
    // ===== 2024 COMBAT MANEUVER CHANGES =====
    "grapple (2024)": {
      type: "contest_check",
      actionType: "action",
      attackType: "athletics",
      defenseType: "athletics_or_acrobatics",
      effect: "grappled_condition",
      ruleset: "2024",
      description: "2024 version of grapple rules"
    },
    "shove (2024)": {
      type: "contest_check",
      actionType: "action",
      attackType: "athletics",
      defenseType: "athletics_or_acrobatics",
      effects: ["knock_prone", "push_5_feet"],
      ruleset: "2024",
      description: "2024 version of shove rules"
    },
    // ===== 2024 WEAPON MASTERIES (NEW SYSTEM) =====
    "cleave (weapon mastery)": {
      type: "weapon_mastery",
      condition: "hit_creature",
      effect: "hit_second_target_within_5ft",
      description: "Hit second target within 5ft"
    },
    "graze": {
      type: "weapon_mastery",
      condition: "miss_attack",
      effect: "damage_equal_to_ability_mod",
      description: "Miss still deals damage equal to ability mod"
    },
    "nick": {
      type: "weapon_mastery",
      condition: "light_weapon",
      effect: "extra_attack_no_bonus_action",
      description: "Make extra attack with light weapon (no bonus action needed)"
    },
    "push": {
      type: "weapon_mastery",
      condition: "hit_creature",
      effect: "push_10ft",
      description: "Push 10ft on hit"
    },
    "sap": {
      type: "weapon_mastery",
      condition: "hit_creature",
      effect: "disadvantage_on_next_attack",
      description: "Disadvantage on next attack"
    },
    "slow": {
      type: "weapon_mastery",
      condition: "hit_creature",
      effect: "reduce_speed_by_10ft",
      description: "Reduce speed by 10ft"
    },
    "topple": {
      type: "weapon_mastery",
      condition: "hit_creature",
      effect: "knock_prone_on_failed_con_save",
      description: "Knock prone on failed CON save"
    },
    "vex": {
      type: "weapon_mastery",
      condition: "hit_creature",
      effect: "advantage_on_next_attack_vs_same_target",
      description: "Advantage on next attack vs same target"
    },
    // ===== 2024 FEATS SYSTEM =====
    "alert (2024)": {
      type: "initiative_bonus",
      effect: "add_proficiency_to_initiative",
      additionalEffect: "cannot_be_surprised",
      ruleset: "2024",
      description: "+Initiative equal to proficiency, cannot be surprised"
    },
    "lucky (2024 feat)": {
      type: "advantage",
      effect: "advantage_instead_of_reroll",
      ruleset: "2024",
      description: "Now gives advantage instead of rerolls"
    },
    "great weapon master (2024)": {
      type: "attack_option",
      choice: "redesigned_system",
      ruleset: "2024",
      description: "Redesigned completely"
    },
    "sharpshooter (2024)": {
      type: "attack_option",
      choice: "redesigned_system",
      ruleset: "2024",
      description: "Redesigned completely"
    }
  };
  function isCombatManeuverEdgeCase2(maneuverName) {
    if (!maneuverName)
      return false;
    const lowerName = maneuverName.toLowerCase().trim();
    return COMBAT_MANEUVER_EDGE_CASES.hasOwnProperty(lowerName);
  }
  function getCombatManeuverEdgeCase(maneuverName) {
    if (!maneuverName)
      return null;
    const lowerName = maneuverName.toLowerCase().trim();
    return COMBAT_MANEUVER_EDGE_CASES[lowerName] || null;
  }
  function applyCombatManeuverEdgeCaseModifications2(maneuver, options) {
    const edgeCase = getCombatManeuverEdgeCase(maneuver.name);
    if (!edgeCase) {
      return { options, skipNormalButtons: false };
    }
    const modifiedOptions = [...options];
    let skipNormalButtons = false;
    switch (edgeCase.type) {
      case "contest_check":
        modifiedOptions.forEach((opt) => {
          opt.edgeCaseNote = `\u2694\uFE0F ${edgeCase.attackType} vs ${edgeCase.defenseType}`;
        });
        break;
      case "reaction":
      case "reaction_attack":
        modifiedOptions.forEach((opt) => {
          opt.edgeCaseNote = `\u26A1 ${edgeCase.timing}`;
        });
        break;
      case "bonus_action":
      case "bonus_action_attack":
      case "bonus_action_defense":
      case "bonus_action_setup":
        modifiedOptions.forEach((opt) => {
          opt.edgeCaseNote = `\u26A1 Bonus Action`;
        });
        break;
      case "attack_with_debuff":
        modifiedOptions.forEach((opt) => {
          opt.edgeCaseNote = `\u{1F3AF} Hit + ${edgeCase.saveType} save or ${edgeCase.saveFailure}`;
        });
        break;
      case "ally_reaction":
      case "ally_movement":
      case "ally_buff":
        modifiedOptions.forEach((opt) => {
          opt.edgeCaseNote = `\u{1F91D} ${edgeCase.effect}`;
        });
        break;
      case "area_damage":
        modifiedOptions.forEach((opt) => {
          opt.edgeCaseNote = `\u{1F4A5} ${edgeCase.condition}: ${edgeCase.effect}`;
        });
        break;
      case "situational_advantage":
        modifiedOptions.forEach((opt) => {
          opt.edgeCaseNote = `\u2705 ${edgeCase.condition}`;
        });
        break;
      case "defensive_action":
        modifiedOptions.forEach((opt) => {
          opt.edgeCaseNote = `\u{1F6E1}\uFE0F ${edgeCase.effects.join(", ")}`;
        });
        break;
      case "environmental_modifier":
        modifiedOptions.forEach((opt) => {
          opt.edgeCaseNote = `\u{1F30D} ${edgeCase.effects.join(", ")}`;
        });
        break;
      default:
        if (edgeCase.description) {
          modifiedOptions.forEach((opt) => {
            opt.edgeCaseNote = edgeCase.description;
          });
        }
        break;
    }
    return { options: modifiedOptions, skipNormalButtons };
  }
  if (typeof globalThis !== "undefined") {
    globalThis.COMBAT_MANEUVER_EDGE_CASES = COMBAT_MANEUVER_EDGE_CASES;
    globalThis.isCombatManeuverEdgeCase = isCombatManeuverEdgeCase2;
    globalThis.getCombatManeuverEdgeCase = getCombatManeuverEdgeCase;
    globalThis.applyCombatManeuverEdgeCaseModifications = applyCombatManeuverEdgeCaseModifications2;
  }

  // ../core/src/modules/action-executor.js
  var METAMAGIC_COSTS = {
    "Careful Spell": 1,
    "Distant Spell": 1,
    "Empowered Spell": 1,
    "Extended Spell": 1,
    "Heightened Spell": 3,
    "Quickened Spell": 2,
    "Subtle Spell": 1,
    "Twinned Spell": "variable"
    // Cost equals spell level (min 1 for cantrips)
  };
  function calculateMetamagicCost(metamagicName, spellLevel) {
    const cost = METAMAGIC_COSTS[metamagicName];
    if (cost === "variable") {
      return Math.max(1, spellLevel);
    }
    return cost || 0;
  }
  function getAvailableMetamagic(characterData2) {
    if (!characterData2 || !characterData2.features) {
      return [];
    }
    const metamagicOptions = characterData2.features.filter((feature) => {
      const name = feature.name.trim();
      let matchedName = null;
      if (METAMAGIC_COSTS.hasOwnProperty(name)) {
        matchedName = name;
      } else {
        matchedName = Object.keys(METAMAGIC_COSTS).find(
          (key) => key.toLowerCase() === name.toLowerCase()
        );
      }
      if (matchedName) {
        feature._matchedName = matchedName;
        return true;
      }
      return false;
    }).map((feature) => {
      const matchedName = feature._matchedName || feature.name.trim();
      return {
        name: matchedName,
        cost: METAMAGIC_COSTS[matchedName],
        description: feature.description || ""
      };
    });
    return metamagicOptions;
  }
  function getSorceryPointsResource2(characterData2) {
    if (!characterData2 || !characterData2.resources) {
      return null;
    }
    const sorceryResource = characterData2.resources.find((r) => {
      const lowerName = r.name.toLowerCase().trim();
      return lowerName.includes("sorcery point") || lowerName === "sorcery points" || lowerName === "sorcery" || lowerName.includes("sorcerer point");
    });
    return sorceryResource || null;
  }
  function isMagicItemSpell(spell) {
    if (!spell.source)
      return false;
    const src = spell.source.toLowerCase();
    return src.includes("amulet") || src.includes("ring") || src.includes("wand") || src.includes("staff") || src.includes("rod") || src.includes("cloak") || src.includes("boots") || src.includes("bracers") || src.includes("gauntlets") || src.includes("helm") || src.includes("armor") || src.includes("weapon") || src.includes("talisman") || src.includes("orb") || src.includes("scroll") || src.includes("potion");
  }
  function isFreeSpell(spell) {
    return !!(spell.resources && spell.resources.itemsConsumed && spell.resources.itemsConsumed.length > 0);
  }
  function detectClassResources(characterData2) {
    const resources = [];
    const otherVars = characterData2 && characterData2.otherVariables || {};
    if (otherVars.ki !== void 0 || otherVars.kiPoints !== void 0) {
      const ki = otherVars.ki || otherVars.kiPoints || 0;
      const kiMax = otherVars.kiMax || otherVars.kiPointsMax || 0;
      const kiVarName = otherVars.ki !== void 0 ? "ki" : "kiPoints";
      if (kiMax > 0) {
        resources.push({
          name: "Ki",
          current: ki,
          max: kiMax,
          varName: kiVarName,
          variableName: kiVarName
        });
      }
    }
    if (otherVars.pactMagicSlots !== void 0) {
      const slots = otherVars.pactMagicSlots || 0;
      const slotsMax = otherVars.pactMagicSlotsMax || 0;
      if (slotsMax > 0) {
        resources.push({
          name: "Pact Magic",
          current: slots,
          max: slotsMax,
          varName: "pactMagicSlots",
          variableName: "pactMagicSlots"
        });
      }
    }
    let channelDivinityVarName = null;
    let channelDivinityUses = 0;
    let channelDivinityMax = 0;
    if (otherVars.channelDivinityCleric !== void 0) {
      channelDivinityVarName = "channelDivinityCleric";
      channelDivinityUses = otherVars.channelDivinityCleric || 0;
      channelDivinityMax = otherVars.channelDivinityClericMax || 0;
    } else if (otherVars.channelDivinityPaladin !== void 0) {
      channelDivinityVarName = "channelDivinityPaladin";
      channelDivinityUses = otherVars.channelDivinityPaladin || 0;
      channelDivinityMax = otherVars.channelDivinityPaladinMax || 0;
    } else if (otherVars.channelDivinity !== void 0) {
      channelDivinityVarName = "channelDivinity";
      channelDivinityUses = otherVars.channelDivinity || 0;
      channelDivinityMax = otherVars.channelDivinityMax || 0;
    }
    if (channelDivinityVarName && channelDivinityMax > 0) {
      resources.push({
        name: "Channel Divinity",
        current: channelDivinityUses,
        max: channelDivinityMax,
        varName: channelDivinityVarName,
        variableName: channelDivinityVarName
      });
    }
    return resources;
  }
  function getActionOptions2(action, characterData2 = null) {
    const options = [];
    if (action.attackRoll) {
      let formula = action.attackRoll;
      if (typeof formula === "number" || !formula.includes("d20")) {
        const bonus = parseInt(formula);
        formula = bonus >= 0 ? `1d20+${bonus}` : `1d20${bonus}`;
      }
      options.push({
        type: "attack",
        label: "Attack",
        formula,
        icon: "attack",
        color: "#e74c3c"
      });
    }
    const isValidDiceFormula = action.damage && (/\d*d\d+/.test(action.damage) || /\d*d\d+/.test(action.damage.replace(/\s*\+\s*/g, "+")));
    if (isValidDiceFormula) {
      const isHealing = action.damageType && action.damageType.toLowerCase().includes("heal");
      const isTempHP = action.damageType && (action.damageType.toLowerCase() === "temphp" || action.damageType.toLowerCase() === "temporary" || action.damageType.toLowerCase().includes("temp"));
      let btnText;
      if (isHealing) {
        btnText = "Heal";
      } else if (action.actionType === "feature" || !action.attackRoll) {
        btnText = "Roll";
      } else {
        btnText = "Damage";
      }
      options.push({
        type: isHealing ? "healing" : isTempHP ? "temphp" : "damage",
        label: btnText,
        formula: action.damage,
        icon: isTempHP ? "shield" : isHealing ? "heal" : "damage",
        color: isTempHP ? "#3498db" : isHealing ? "#27ae60" : "#e67e22"
      });
    }
    let edgeCaseResult;
    if (isClassFeatureEdgeCase(action.name)) {
      edgeCaseResult = applyClassFeatureEdgeCaseModifications(action, options);
    } else if (isRacialFeatureEdgeCase(action.name)) {
      edgeCaseResult = applyRacialFeatureEdgeCaseModifications(action, options);
    } else if (isCombatManeuverEdgeCase(action.name)) {
      edgeCaseResult = applyCombatManeuverEdgeCaseModifications(action, options);
    } else {
      edgeCaseResult = { options, skipNormalButtons: false };
    }
    return edgeCaseResult;
  }
  function resolveSpellCast(spell, characterData2, options = {}) {
    const {
      selectedSlotLevel = null,
      selectedMetamagic = [],
      skipSlotConsumption = false
    } = options;
    const result = {
      text: "",
      rolls: [],
      effects: [],
      slotUsed: null,
      metamagicUsed: [],
      isCantrip: false,
      isFreecast: false,
      resourceChanges: []
    };
    const magicItem = isMagicItemSpell(spell);
    const freeCast = isFreeSpell(spell);
    const isCantrip = !spell.level || spell.level === 0 || spell.level === "0";
    if (isCantrip || magicItem || freeCast || skipSlotConsumption) {
      result.isCantrip = isCantrip;
      result.isFreecast = magicItem || freeCast || skipSlotConsumption;
      const reason = skipSlotConsumption ? "concentration recast" : magicItem ? "magic item" : freeCast ? "free spell" : "cantrip";
      result.text = `Cast ${spell.name} (${reason})`;
      if (spell.concentration && !skipSlotConsumption) {
        result.effects.push({ type: "concentration", spell: spell.name });
      }
      if (isReuseableSpell(spell.name, characterData2) && !skipSlotConsumption) {
        result.effects.push({ type: "track_reusable", spell: spell.name });
      }
      if (spell.attackRoll && spell.attackRoll !== "(none)") {
        result.rolls.push({ type: "attack", formula: spell.attackRoll, name: `${spell.name} - Attack` });
      }
      if (spell.damageRolls && Array.isArray(spell.damageRolls)) {
        spell.damageRolls.forEach((roll2) => {
          if (roll2.damage) {
            const damageType = roll2.damageType || "damage";
            const isHealing = damageType.toLowerCase() === "healing";
            result.rolls.push({
              type: isHealing ? "healing" : "damage",
              formula: roll2.damage,
              name: `${spell.name} - ${isHealing ? "Healing" : damageType}`,
              damageType
            });
          }
        });
      } else if (spell.damage) {
        const damageType = spell.damageType || "damage";
        const isHealing = damageType.toLowerCase() === "healing";
        result.rolls.push({
          type: isHealing ? "healing" : "damage",
          formula: spell.damage,
          name: `${spell.name} - ${isHealing ? "Healing" : damageType}`,
          damageType
        });
      }
      return result;
    }
    const spellLevel = parseInt(spell.level);
    if (selectedSlotLevel !== null) {
      const isPactMagicSlot = typeof selectedSlotLevel === "string" && selectedSlotLevel.startsWith("pact:");
      let actualLevel, slotVar, slotLabel;
      if (isPactMagicSlot) {
        actualLevel = parseInt(selectedSlotLevel.split(":")[1]);
        slotVar = "pactMagicSlots";
        slotLabel = `Pact Magic (level ${actualLevel})`;
      } else {
        actualLevel = parseInt(selectedSlotLevel);
        slotVar = `level${actualLevel}SpellSlots`;
        slotLabel = actualLevel > spellLevel ? `Level ${actualLevel} slot (upcast from ${spell.level})` : `Level ${actualLevel} slot`;
      }
      result.slotUsed = {
        level: actualLevel,
        slotVar,
        isPactMagic: isPactMagicSlot,
        label: slotLabel
      };
      result.resourceChanges.push({ type: "spell_slot", slotVar, delta: -1 });
      if (selectedMetamagic && selectedMetamagic.length > 0) {
        let totalCost = 0;
        selectedMetamagic.forEach((meta) => {
          const cost = typeof meta.cost === "number" ? meta.cost : calculateMetamagicCost(meta.name, actualLevel);
          totalCost += cost;
          result.metamagicUsed.push({ name: meta.name, cost });
        });
        result.resourceChanges.push({ type: "sorcery_points", delta: -totalCost });
        result.text = `Cast ${spell.name} using ${slotLabel} + ${result.metamagicUsed.map((m) => m.name).join(", ")} (${totalCost} SP)`;
      } else {
        result.text = `Cast ${spell.name} using ${slotLabel}`;
      }
    } else {
      result.text = `Cast ${spell.name} (needs level ${spellLevel}+ slot)`;
      result.effects.push({ type: "needs_slot_selection", minLevel: spellLevel });
    }
    if (spell.concentration) {
      result.effects.push({ type: "concentration", spell: spell.name });
    }
    if (isReuseableSpell(spell.name, characterData2)) {
      result.effects.push({ type: "track_reusable", spell: spell.name });
    }
    if (spell.attackRoll && spell.attackRoll !== "(none)") {
      result.rolls.push({ type: "attack", formula: spell.attackRoll, name: `${spell.name} - Attack` });
    }
    if (spell.damageRolls && Array.isArray(spell.damageRolls)) {
      spell.damageRolls.forEach((roll2) => {
        if (roll2.damage) {
          const damageType = roll2.damageType || "damage";
          const isHealing = damageType.toLowerCase() === "healing";
          result.rolls.push({
            type: isHealing ? "healing" : "damage",
            formula: roll2.damage,
            name: `${spell.name} - ${isHealing ? "Healing" : damageType}`,
            damageType
          });
        }
      });
    } else if (spell.damage) {
      const damageType = spell.damageType || "damage";
      const isHealing = damageType.toLowerCase() === "healing";
      result.rolls.push({
        type: isHealing ? "healing" : "damage",
        formula: spell.damage,
        name: `${spell.name} - ${isHealing ? "Healing" : damageType}`,
        damageType
      });
    }
    if (isTooComplicatedSpell(spell.name, characterData2)) {
      result.effects.push({ type: "too_complicated", description: "Requires DM intervention" });
    }
    return result;
  }
  function resolveActionUse(action, characterData2 = null) {
    const result = {
      text: `${action.name}`,
      rolls: [],
      effects: [],
      edgeCase: null
    };
    const actionResult = getActionOptions2(action, characterData2);
    result.edgeCase = actionResult.skipNormalButtons ? actionResult : null;
    actionResult.options.forEach((opt) => {
      if (opt.formula) {
        result.rolls.push({
          type: opt.type,
          formula: opt.formula,
          name: `${action.name} - ${opt.label}`,
          damageType: action.damageType
        });
      }
    });
    if (action.description) {
      result.effects.push({ type: "description", text: action.description });
    }
    return result;
  }
  function prepareSpellsForDiscord(rawCharacterData) {
    const data = typeof rawCharacterData === "string" ? JSON.parse(rawCharacterData) : rawCharacterData;
    const characterData2 = data || {};
    const spells = characterData2.spells || [];
    const spellSlots = characterData2.spellSlots || {};
    let maxSpellSlotLevel = 0;
    for (let i = 9; i >= 1; i--) {
      const maxKey = `level${i}SpellSlotsMax`;
      if (spellSlots[maxKey] && spellSlots[maxKey] > 0) {
        maxSpellSlotLevel = i;
        break;
      }
    }
    const otherVars = characterData2.otherVariables || {};
    if (otherVars.pactMagicSlotsMax && otherVars.pactMagicSlotsMax > 0) {
      const pactLevel = otherVars.pactMagicSlotLevel || 1;
      maxSpellSlotLevel = Math.max(maxSpellSlotLevel, pactLevel);
    }
    const enrichedSpells = spells.map((spell) => {
      const baseLevel = parseInt(spell.level) || 0;
      const isCantrip = baseLevel === 0;
      const spellEdge = isEdgeCase(spell.name);
      let edgeCaseType = null;
      if (spellEdge) {
        const ec = getEdgeCase(spell.name);
        edgeCaseType = ec ? ec.type : null;
      }
      return {
        name: spell.name,
        baseLevel,
        upcastable: !isCantrip && baseLevel < 9,
        maxUpcastLevel: isCantrip ? 0 : Math.max(baseLevel, maxSpellSlotLevel),
        edgeOverride: spellEdge,
        edgeCaseType,
        concentration: !!spell.concentration,
        ritual: !!spell.ritual,
        school: spell.school || null,
        castingTime: spell.castingTime || null,
        range: spell.range || null,
        components: spell.components || null,
        duration: spell.duration || null,
        hasAttack: !!(spell.attackRoll && spell.attackRoll !== "(none)"),
        hasDamage: !!(spell.damage || spell.damageRolls && spell.damageRolls.length > 0),
        hasHealing: !!(spell.damageType && spell.damageType.toLowerCase().includes("heal"))
      };
    });
    const metamagic = getAvailableMetamagic(characterData2);
    return {
      spells: enrichedSpells,
      metamagic,
      maxSpellSlotLevel
    };
  }
  function prepareActionsForDiscord(rawCharacterData) {
    const data = typeof rawCharacterData === "string" ? JSON.parse(rawCharacterData) : rawCharacterData;
    const characterData2 = data || {};
    const actions = characterData2.actions || [];
    const enrichedActions = actions.map((action) => {
      const classEdge = isClassFeatureEdgeCase(action.name);
      const racialEdge = isRacialFeatureEdgeCase(action.name);
      const combatEdge = isCombatManeuverEdgeCase(action.name);
      const edgeOverride = classEdge || racialEdge || combatEdge;
      const isHealing = action.damageType && action.damageType.toLowerCase().includes("heal");
      const hasDamage = !!(action.damage && /\d*d\d+/.test(action.damage));
      return {
        name: action.name,
        actionType: action.actionType || "action",
        hasAttack: !!action.attackRoll,
        hasDamage: hasDamage && !isHealing,
        hasHealing: hasDamage && isHealing,
        edgeOverride,
        edgeCaseType: classEdge ? "class_feature" : racialEdge ? "racial_feature" : combatEdge ? "combat_maneuver" : null,
        range: action.range || null,
        description: action.description || null
      };
    });
    return { actions: enrichedActions };
  }
  function executeDiscordCast(commandData, characterData2) {
    const spell = commandData.spell_data || {};
    const castLevel = commandData.cast_level || commandData.spell_level || spell.level;
    const charName = commandData.character_name || "Character";
    const metamagicName = commandData.metamagic || null;
    if (isTooComplicatedSpell(spell.name, characterData2)) {
      return {
        text: `${charName} casts ${spell.name}! (DM adjudication required)`,
        rolls: [],
        effects: [{ type: "too_complicated", description: spell.description || "Requires DM intervention" }],
        slotUsed: null,
        metamagicUsed: [],
        embed: {
          title: `${charName} casts ${spell.name}`,
          description: "This spell requires DM adjudication.",
          spellLevel: parseInt(spell.level) || 0,
          castLevel: parseInt(castLevel) || 0
        }
      };
    }
    const selectedMetamagic = [];
    if (metamagicName) {
      const cost = calculateMetamagicCost(metamagicName, parseInt(castLevel) || 0);
      selectedMetamagic.push({ name: metamagicName, cost });
    }
    const result = resolveSpellCast(spell, characterData2, {
      selectedSlotLevel: parseInt(castLevel) || null,
      selectedMetamagic,
      skipSlotConsumption: false
    });
    const spellLevel = parseInt(spell.level) || 0;
    const isUpcast = parseInt(castLevel) > spellLevel;
    result.embed = {
      title: `${charName} casts ${spell.name}`,
      description: formatSpellSummary(spell, parseInt(castLevel)),
      spellLevel,
      castLevel: parseInt(castLevel) || spellLevel,
      isUpcast,
      metamagic: selectedMetamagic.map((m) => m.name)
    };
    return result;
  }
  function executeDiscordAction(commandData, characterData2) {
    const action = commandData.action_data || commandData.action || {};
    const charName = commandData.character_name || "Character";
    const result = resolveActionUse(action, characterData2);
    result.embed = {
      title: `${charName} uses ${action.name || commandData.action_name}`,
      description: formatActionSummary(action),
      actionType: action.actionType || commandData.action_type || "action"
    };
    return result;
  }
  function formatSpellSummary(spell, castLevel) {
    let desc = "";
    if (spell.castingTime)
      desc += `**Casting Time:** ${spell.castingTime}
`;
    if (spell.range)
      desc += `**Range:** ${spell.range}
`;
    if (spell.duration && spell.duration !== "Instantaneous")
      desc += `**Duration:** ${spell.duration}
`;
    if (spell.components)
      desc += `**Components:** ${spell.components}
`;
    if (spell.concentration)
      desc += `**Concentration:** Yes
`;
    if (spell.damageRolls && Array.isArray(spell.damageRolls) && spell.damageRolls.length > 0) {
      spell.damageRolls.forEach((roll2) => {
        if (roll2.damage) {
          const type = roll2.damageType || "damage";
          const isHealing = type.toLowerCase() === "healing";
          const label = isHealing ? "Healing" : type.charAt(0).toUpperCase() + type.slice(1);
          desc += `**${label}:** ${roll2.damage}`;
          if (castLevel && parseInt(spell.level) > 0 && castLevel > parseInt(spell.level)) {
            desc += ` (upcast to level ${castLevel})`;
          }
          desc += "\n";
        }
      });
    } else if (spell.damage) {
      const type = spell.damageType || "damage";
      const isHealing = type.toLowerCase() === "healing";
      const label = isHealing ? "Healing" : "Damage";
      desc += `**${label}:** ${spell.damage}`;
      if (castLevel && parseInt(spell.level) > 0 && castLevel > parseInt(spell.level)) {
        desc += ` (upcast to level ${castLevel})`;
      }
      desc += "\n";
    }
    if (!spell.damage && !spell.damageRolls) {
      if (spell.damageRoll)
        desc += `**Damage:** ${spell.damageRoll}
`;
      if (spell.healingRoll)
        desc += `**Healing:** ${spell.healingRoll}
`;
    }
    if (spell.attackRoll && spell.attackRoll !== "(none)") {
      desc += `**Attack:** ${spell.attackRoll}
`;
    }
    return desc || "Spell cast.";
  }
  function formatActionSummary(action) {
    let desc = "";
    if (action.attackRoll || action.attackBonus) {
      const formula = action.attackRoll || `+${action.attackBonus}`;
      desc += `**Attack:** ${formula}
`;
    }
    if (action.damage && /\d*d\d+/.test(action.damage)) {
      const type = action.damageType || "damage";
      const isHealing = type.toLowerCase().includes("heal");
      desc += `**${isHealing ? "Healing" : "Damage"}:** ${action.damage}`;
      if (action.damageType && !isHealing)
        desc += ` ${action.damageType}`;
      desc += "\n";
    }
    if (action.range)
      desc += `**Range:** ${action.range}
`;
    if (action.duration && action.duration !== "Instantaneous")
      desc += `**Duration:** ${action.duration}
`;
    return desc || "Action used.";
  }
  if (typeof globalThis !== "undefined") {
    globalThis.SPELL_EDGE_CASES = globalThis.SPELL_EDGE_CASES;
    globalThis.isEdgeCase = globalThis.isEdgeCase;
    globalThis.getEdgeCase = globalThis.getEdgeCase;
    globalThis.applyEdgeCaseModifications = globalThis.applyEdgeCaseModifications;
    globalThis.isReuseableSpell = globalThis.isReuseableSpell;
    globalThis.isTooComplicatedSpell = globalThis.isTooComplicatedSpell;
    globalThis.detectRulesetFromCharacterData = globalThis.detectRulesetFromCharacterData;
    globalThis.CLASS_FEATURE_EDGE_CASES = globalThis.CLASS_FEATURE_EDGE_CASES;
    globalThis.isClassFeatureEdgeCase = globalThis.isClassFeatureEdgeCase;
    globalThis.getClassFeatureEdgeCase = globalThis.getClassFeatureEdgeCase;
    globalThis.applyClassFeatureEdgeCaseModifications = globalThis.applyClassFeatureEdgeCaseModifications;
    globalThis.getClassFeaturesByType = globalThis.getClassFeaturesByType;
    globalThis.getAllClassFeatureEdgeCaseTypes = globalThis.getAllClassFeatureEdgeCaseTypes;
    globalThis.RACIAL_FEATURE_EDGE_CASES = globalThis.RACIAL_FEATURE_EDGE_CASES;
    globalThis.isRacialFeatureEdgeCase = globalThis.isRacialFeatureEdgeCase;
    globalThis.getRacialFeatureEdgeCase = globalThis.getRacialFeatureEdgeCase;
    globalThis.applyRacialFeatureEdgeCaseModifications = globalThis.applyRacialFeatureEdgeCaseModifications;
    globalThis.COMBAT_MANEUVER_EDGE_CASES = globalThis.COMBAT_MANEUVER_EDGE_CASES;
    globalThis.isCombatManeuverEdgeCase = globalThis.isCombatManeuverEdgeCase;
    globalThis.getCombatManeuverEdgeCase = globalThis.getCombatManeuverEdgeCase;
    globalThis.applyCombatManeuverEdgeCaseModifications = globalThis.applyCombatManeuverEdgeCaseModifications;
    globalThis.METAMAGIC_COSTS = METAMAGIC_COSTS;
    globalThis.calculateMetamagicCost = calculateMetamagicCost;
    globalThis.getAvailableMetamagic = getAvailableMetamagic;
    globalThis.getSorceryPointsResource = getSorceryPointsResource2;
    globalThis.isMagicItemSpell = isMagicItemSpell;
    globalThis.isFreeSpell = isFreeSpell;
    globalThis.detectClassResources = detectClassResources;
    globalThis.getActionOptions = getActionOptions2;
    globalThis.resolveSpellCast = resolveSpellCast;
    globalThis.resolveActionUse = resolveActionUse;
    globalThis.prepareSpellsForDiscord = prepareSpellsForDiscord;
    globalThis.prepareActionsForDiscord = prepareActionsForDiscord;
    globalThis.executeDiscordCast = executeDiscordCast;
    globalThis.executeDiscordAction = executeDiscordAction;
  }

  // ../core/src/modules/action-announcements.js
  (function() {
    "use strict";
    function announceAction2(action) {
      const colorBanner = getColoredBanner(characterData);
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
      let message = `&{template:default} {{name=${colorBanner}${characterData.name}}} {{${emoji} Action=${action.name}}} {{Type=${action.actionType || "action"}}}`;
      if (action.summary) {
        const resolvedSummary = resolveVariablesInFormula(action.summary);
        message += ` {{Summary=${resolvedSummary}}}`;
      }
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
      const colorEmoji = typeof getColorEmoji === "function" ? getColorEmoji(characterData.notificationColor) : "";
      const notificationText = colorEmoji ? `${colorEmoji} ${characterData.name} used ${action.name}!` : `\u2728 ${characterData.name} used ${action.name}!`;
      showNotification(notificationText);
      debug.log("\u2705 Action announcement displayed");
    }
    function postActionToChat(actionLabel, state) {
      const emoji = state === "used" ? "\u274C" : "\u2705";
      const message = `${emoji} ${characterData.name} ${state === "used" ? "uses" : "restores"} ${actionLabel}`;
      postToChatIfOpener(message);
      postActionEconomyToDiscord();
    }
    globalThis.announceAction = announceAction2;
    globalThis.postActionToChat = postActionToChat;
    console.log("\u2705 Action Announcements module loaded");
  })();

  // ../core/src/modules/action-display.js
  (function() {
    "use strict";
    function buildActionsDisplay2(container, actions) {
      container.innerHTML = "";
      let sneakAttackEnabled = false;
      let sneakAttackDamage = null;
      let elementalWeaponEnabled = false;
      let elementalWeaponDamage = null;
      debug.log("\u{1F50D} buildActionsDisplay called with actions:", actions.map((a) => ({ name: a.name, damage: a.damage, actionType: a.actionType })));
      debug.log("\u{1F50D} Total actions received:", actions.length);
      function normalizeActionName(name) {
        if (!name)
          return "";
        const suffixPatterns = [
          /\s*\(free\)$/i,
          /\s*\(free action\)$/i,
          /\s*\(bonus action\)$/i,
          /\s*\(bonus\)$/i,
          /\s*\(reaction\)$/i,
          /\s*\(action\)$/i,
          /\s*\(no spell slot\)$/i,
          /\s*\(at will\)$/i
        ];
        let normalized = name.trim();
        for (const pattern of suffixPatterns) {
          normalized = normalized.replace(pattern, "");
        }
        return normalized.trim();
      }
      const deduplicatedActions = [];
      const actionsByNormalizedName = {};
      const sortedActions = [...actions].sort((a, b) => {
        const normA = normalizeActionName(a.name || "");
        const normB = normalizeActionName(b.name || "");
        if (normA !== normB) {
          return normA.localeCompare(normB);
        }
        return (a.name || "").length - (b.name || "").length;
      });
      sortedActions.forEach((action) => {
        const actionName = (action.name || "").trim();
        const normalizedName = normalizeActionName(actionName);
        if (!normalizedName) {
          debug.log("\u26A0\uFE0F Skipping action with no name");
          return;
        }
        if (!actionsByNormalizedName[normalizedName]) {
          actionsByNormalizedName[normalizedName] = action;
          deduplicatedActions.push(action);
          debug.log(`\u{1F4DD} First occurrence of action: "${actionName}" (normalized: "${normalizedName}")`);
        } else {
          const existingAction = actionsByNormalizedName[normalizedName];
          if (action.source && !existingAction.source.includes(action.source)) {
            existingAction.source = existingAction.source ? existingAction.source + "; " + action.source : action.source;
            debug.log(`\u{1F4DD} Combined duplicate action "${actionName}": ${existingAction.source}`);
          }
          if (action.description && action.description !== existingAction.description) {
            existingAction.description = existingAction.description ? existingAction.description + "\n\n" + action.description : action.description;
            debug.log(`\u{1F4DD} Combined descriptions for "${actionName}"`);
          }
          if (action.uses && !existingAction.uses) {
            existingAction.uses = action.uses;
            debug.log(`\u{1F4DD} Added uses to "${actionName}"`);
          }
          if (action.damage && !existingAction.damage) {
            existingAction.damage = action.damage;
            debug.log(`\u{1F4DD} Added damage to "${actionName}"`);
          }
          if (action.attackRoll && !existingAction.attackRoll) {
            existingAction.attackRoll = action.attackRoll;
            debug.log(`\u{1F4DD} Added attackRoll to "${actionName}"`);
          }
          debug.log(`\u{1F504} Merged duplicate action: "${actionName}"`);
        }
      });
      debug.log(`\u{1F4CA} Deduplicated ${actions.length} actions to ${deduplicatedActions.length} unique actions`);
      let filteredActions = deduplicatedActions.filter((action) => {
        const actionName = (action.name || "").toLowerCase();
        if (actionName.includes("divine smite")) {
          if (actionName !== "divine smite" && !actionName.match(/^divine smite$/)) {
            debug.log(`\u23ED\uFE0F Filtering out duplicate Divine Smite entry: ${action.name}`);
            return false;
          } else {
            debug.log(`\u2705 Keeping main Divine Smite entry: ${action.name}`);
          }
        }
        if (actionName.includes("lay on hands")) {
          const normalizedActionName = action.name.toLowerCase().replace(/[^a-z0-9\s:]/g, "").replace(/\s+/g, " ").trim();
          const normalizedSearch = "lay on hands: heal";
          debug.log(`\u{1F50D} Found Lay on Hands action: "${action.name}"`);
          debug.log(`\u{1F50D} Normalized action name: "${normalizedActionName}"`);
          debug.log(`\u{1F50D} Normalized search term: "${normalizedSearch}"`);
          debug.log(`\u{1F50D} Do they match? ${normalizedActionName === normalizedSearch}`);
          debug.log(`\u{1F50D} Action object:`, action);
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
      debug.log(`\u{1F50D} Filtered ${deduplicatedActions.length} actions to ${filteredActions.length} actions`);
      const sneakAttackAction = deduplicatedActions.find(
        (a) => a.name === "Sneak Attack" || a.name.toLowerCase().includes("sneak attack")
      );
      debug.log("\u{1F3AF} Sneak Attack search result:", sneakAttackAction);
      if (sneakAttackAction && sneakAttackAction.damage) {
        sneakAttackDamage = sneakAttackAction.damage;
        const resolvedDamage = resolveVariablesInFormula(sneakAttackDamage);
        debug.log(`\u{1F3AF} Sneak Attack damage: "${sneakAttackDamage}" resolved to "${resolvedDamage}"`);
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
          debug.log(`\u{1F3AF} Sneak Attack toggle on our sheet: ${sneakAttackEnabled ? "ON" : "OFF"} (independent of DiceCloud)`);
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
        debug.log(`\u2694\uFE0F Elemental Weapon spell found, adding toggle`);
        elementalWeaponDamage = "1d4";
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
          debug.log(`\u2694\uFE0F Elemental Weapon toggle: ${elementalWeaponEnabled ? "ON" : "OFF"}`);
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
        debug.log(`\u{1F396}\uFE0F Lucky feat found, adding action button`);
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
          debug.log("\u23ED\uFE0F Skipping standalone Sneak Attack button (using toggle instead)");
          return;
        }
        if (action.damage && action.attackRoll && sneakAttackDamage) {
          const sneakPattern = new RegExp(`\\+?${sneakAttackDamage.replace(/[+\-]/g, "")}`, "g");
          const cleanedDamage = action.damage.replace(sneakPattern, "");
          if (cleanedDamage !== action.damage) {
            debug.log(`\u{1F9F9} Cleaned weapon damage: "${action.damage}" -> "${cleanedDamage}"`);
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
              debug.log(`\u{1F49A} Lay on Hands: Heal action clicked: ${action.name}, showing custom modal`);
              debug.log(`\u{1F49A} Normalized match: "${normalizedActionName}" === "${normalizedSearch}"`);
              const layOnHandsPool = getLayOnHandsResource();
              if (layOnHandsPool) {
                showLayOnHandsModal(layOnHandsPool);
              } else {
                showNotification("\u274C No Lay on Hands pool resource found", "error");
              }
              return;
            }
            if (action.name.toLowerCase().includes("lay on hands")) {
              debug.log(`\u{1F6A8} FALLBACK: Caught Lay on Hands action: "${action.name}"`);
              debug.log(`\u{1F6A8} This action didn't match 'lay on hands: heal' but contains 'lay on hands'`);
              debug.log(`\u{1F6A8} Showing modal anyway for debugging`);
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
          let actionAnnounced = false;
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
                debug.log(`\u{1F49A} Lay on Hands: Heal action clicked: ${action.name}, showing custom modal`);
                debug.log(`\u{1F49A} Normalized match: "${normalizedActionName}" === "${normalizedSearch}"`);
                const layOnHandsPool = getLayOnHandsResource();
                if (layOnHandsPool) {
                  showLayOnHandsModal(layOnHandsPool);
                } else {
                  showNotification("\u274C No Lay on Hands pool resource found", "error");
                }
                return;
              }
              if (action.name.toLowerCase().includes("lay on hands")) {
                debug.log(`\u{1F6A8} FALLBACK: Caught Lay on Hands action: "${action.name}"`);
                debug.log(`\u{1F6A8} This action didn't match 'lay on hands: heal' but contains 'lay on hands'`);
                debug.log(`\u{1F6A8} Showing modal anyway for debugging`);
                const layOnHandsPool = getLayOnHandsResource();
                if (layOnHandsPool) {
                  showLayOnHandsModal(layOnHandsPool);
                } else {
                  showNotification("\u274C No Lay on Hands pool resource found", "error");
                }
                return;
              }
              if (!actionAnnounced) {
                announceAction(action);
                actionAnnounced = true;
              }
              if (option.type === "attack") {
                markActionAsUsed("action");
                debug.log(`\u{1F3AF} Attack button clicked for "${action.name}", formula: "${option.formula}"`);
                console.log(`\u{1F3AF} ATTACK DEBUG: Rolling attack for ${action.name} with formula ${option.formula}`);
                try {
                  roll(`${action.name} Attack`, option.formula);
                  debug.log(`\u2705 Attack roll called successfully for "${action.name}"`);
                } catch (error) {
                  debug.error(`\u274C Error rolling attack for "${action.name}":`, error);
                  console.error("\u274C ATTACK ERROR:", error);
                  showNotification(`\u274C Error rolling attack: ${error.message}`, "error");
                }
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
                  debug.log(`\u2728 Used ${kiCost} Ki points for ${action.name}. Remaining: ${kiResource.current}/${kiResource.max}`);
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
                  debug.log(`\u2728 Used ${sorceryCost} Sorcery Points for ${action.name}. Remaining: ${sorceryResource.current}/${sorceryResource.max}`);
                  showNotification(`\u2728 ${action.name}! (${sorceryResource.current}/${sorceryResource.max} SP left)`);
                  buildSheet(characterData);
                }
                if (!decrementActionResources(action)) {
                  return;
                }
                const rollType = option.type === "healing" ? "Healing" : option.type === "temphp" ? "Temp HP" : "Damage";
                let damageFormula = option.formula;
                if (option.type === "damage" && sneakAttackEnabled && sneakAttackDamage && action.attackRoll) {
                  damageFormula += `+${sneakAttackDamage}`;
                  debug.log(`\u{1F3AF} Adding Sneak Attack to ${action.name} damage: ${damageFormula}`);
                }
                if (option.type === "damage" && elementalWeaponEnabled && elementalWeaponDamage && action.attackRoll) {
                  damageFormula += `+${elementalWeaponDamage}`;
                  debug.log(`\u2694\uFE0F Adding Elemental Weapon to ${action.name} damage: ${damageFormula}`);
                }
                roll(`${action.name} ${rollType}`, damageFormula);
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
              debug.log(`\u2728 Used ${kiCost} Ki points for ${action.name}. Remaining: ${kiResource.current}/${kiResource.max}`);
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
              debug.log(`\u2728 Used ${sorceryCost} Sorcery Points for ${action.name}. Remaining: ${sorceryResource.current}/${sorceryResource.max}`);
              showNotification(`\u2728 ${action.name}! (${sorceryResource.current}/${sorceryResource.max} SP left)`);
              buildSheet(characterData);
            }
            if (!decrementActionResources(action)) {
              return;
            }
            announceAction(action);
            const actionType = action.actionType || "action";
            debug.log(`\u{1F3AF} Action type for "${action.name}": "${actionType}"`);
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
        const hasDetails = action.description || action.summary || action.damageType || action.attackRoll || action.damage || action.source || action.range;
        if (hasDetails) {
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
            const descDiv = actionCard.querySelector(".action-details");
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
        if (hasDetails) {
          const detailsDiv = document.createElement("div");
          detailsDiv.className = "action-details";
          detailsDiv.style.display = "none";
          let detailsHTML = '<div style="margin-top: 10px; padding: 10px; background: var(--bg-secondary, #f5f5f5); border-radius: 4px; font-size: 0.9em;">';
          if (action.summary) {
            const resolvedSummary = resolveVariablesInFormula(action.summary);
            detailsHTML += `<div style="margin-bottom: 8px;"><strong>Summary:</strong> ${resolvedSummary}</div>`;
          }
          if (action.description) {
            const resolvedDescription = resolveVariablesInFormula(action.description);
            detailsHTML += `<div style="margin-bottom: 8px;">${resolvedDescription}</div>`;
          }
          const details = [];
          if (action.attackRoll)
            details.push(`<strong>Attack:</strong> ${action.attackRoll}`);
          if (action.damage)
            details.push(`<strong>Damage:</strong> ${action.damage}`);
          if (action.damageType)
            details.push(`<strong>Type:</strong> ${action.damageType}`);
          if (action.range)
            details.push(`<strong>Range:</strong> ${action.range}`);
          if (action.source)
            details.push(`<strong>Source:</strong> ${action.source}`);
          if (details.length > 0) {
            detailsHTML += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 0.85em;">${details.join(" \u2022 ")}</div>`;
          }
          detailsHTML += "</div>";
          detailsDiv.innerHTML = detailsHTML;
          actionCard.appendChild(detailsDiv);
        }
        container.appendChild(actionCard);
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
      buildActionsDisplay2(actionsContainer, characterData.actions);
      return true;
    }
    window.buildActionsDisplay = buildActionsDisplay2;
    window.decrementActionUses = decrementActionUses;
    console.log("\u2705 Action Display module loaded");
  })();

  // ../core/src/modules/action-filters.js
  (function() {
    "use strict";
    const actionFilters2 = {
      actionType: "all",
      category: "all",
      search: ""
    };
    function categorizeAction2(action) {
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
    function initializeActionFilters() {
      const actionsSearch = document.getElementById("actions-search");
      if (actionsSearch) {
        actionsSearch.addEventListener("input", (e) => {
          actionFilters2.search = e.target.value.toLowerCase();
          rebuildActions();
        });
      }
      document.querySelectorAll('[data-type="action-type"]').forEach((btn) => {
        btn.addEventListener("click", () => {
          actionFilters2.actionType = btn.dataset.filter;
          document.querySelectorAll('[data-type="action-type"]').forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          rebuildActions();
        });
      });
      document.querySelectorAll('[data-type="action-category"]').forEach((btn) => {
        btn.addEventListener("click", () => {
          actionFilters2.category = btn.dataset.filter;
          document.querySelectorAll('[data-type="action-category"]').forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          rebuildActions();
        });
      });
    }
    function rebuildActions() {
      if (!characterData || !characterData.actions)
        return;
      let filteredActions = characterData.actions.filter((action) => {
        if (actionFilters2.actionType !== "all") {
          const actionType = (action.actionType || "").toLowerCase();
          if (actionType !== actionFilters2.actionType) {
            return false;
          }
        }
        if (actionFilters2.category !== "all") {
          const category = categorizeAction2(action);
          if (category !== actionFilters2.category) {
            return false;
          }
        }
        if (actionFilters2.search) {
          const searchLower = actionFilters2.search.toLowerCase();
          const nameMatch = (action.name || "").toLowerCase().includes(searchLower);
          const descMatch = (action.description || "").toLowerCase().includes(searchLower);
          const summaryMatch = (action.summary || "").toLowerCase().includes(searchLower);
          if (!nameMatch && !descMatch && !summaryMatch) {
            return false;
          }
        }
        return true;
      });
      debug.log(`\u{1F50D} Filtered actions: ${filteredActions.length}/${characterData.actions.length} (type=${actionFilters2.actionType}, category=${actionFilters2.category}, search="${actionFilters2.search}")`);
      const container = document.getElementById("actions-container");
      buildActionsDisplay(container, filteredActions);
    }
    window.categorizeAction = categorizeAction2;
    window.initializeActionFilters = initializeActionFilters;
    window.rebuildActions = rebuildActions;
    Object.defineProperty(globalThis, "actionFilters", {
      get: () => actionFilters2,
      set: (value) => {
        if (value && typeof value === "object") {
          Object.assign(actionFilters2, value);
        }
      }
    });
    console.log("\u2705 Action Filters module loaded");
  })();

  // ../core/src/modules/action-options.js
  (function() {
    "use strict";
    function getActionOptions3(action) {
      const options = [];
      if (action.attackRoll) {
        let formula = action.attackRoll;
        if (typeof formula === "number" || typeof formula === "string" && !formula.includes("d20")) {
          const bonus = parseInt(formula);
          formula = bonus >= 0 ? `1d20+${bonus}` : `1d20${bonus}`;
        }
        options.push({
          type: "attack",
          label: "\u{1F3AF} Attack Roll",
          formula,
          icon: "\u{1F3AF}",
          color: "#e74c3c"
        });
      }
      const isValidDiceFormula = action.damage && (/\d*d\d+/.test(action.damage) || /\d*d\d+/.test(action.damage.replace(/\s*\+\s*/g, "+")));
      debug.log(`\u{1F3B2} Action "${action.name}" damage check:`, {
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
          btnText = "\u{1F4A5} Damage Roll";
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
        debug.log(`\u{1F50D} Edge case applied for "${action.name}": skipNormalButtons = ${edgeCaseResult.skipNormalButtons}`);
      } else if (isRacialFeatureEdgeCase(action.name)) {
        edgeCaseResult = applyRacialFeatureEdgeCaseModifications(action, options);
        debug.log(`\u{1F50D} Edge case applied for "${action.name}": skipNormalButtons = ${edgeCaseResult.skipNormalButtons}`);
      } else if (isCombatManeuverEdgeCase(action.name)) {
        edgeCaseResult = applyCombatManeuverEdgeCaseModifications(action, options);
        debug.log(`\u{1F50D} Edge case applied for "${action.name}": skipNormalButtons = ${edgeCaseResult.skipNormalButtons}`);
      } else {
        edgeCaseResult = { options, skipNormalButtons: false };
        debug.log(`\u{1F50D} No edge case for "${action.name}": skipNormalButtons = false`);
      }
      return edgeCaseResult;
    }
    globalThis.getActionOptions = getActionOptions3;
    console.log("\u2705 Action Options module loaded");
  })();

  // ../core/src/browser.js
  var import_card_creator = __toESM(require_card_creator());

  // ../core/src/modules/character-trait-popups.js
  (function() {
    "use strict";
    function getPopupThemeColors2() {
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
    function showHalflingLuckPopup2(rollData) {
      debug.log("\u{1F340} Halfling Luck popup called with:", rollData);
      if (!document.body) {
        debug.error("\u274C document.body not available for Halfling Luck popup");
        showNotification("\u{1F340} Halfling Luck triggered! (Popup failed to display)", "info");
        return;
      }
      debug.log("\u{1F340} Creating popup overlay...");
      const colors = getPopupThemeColors2();
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
      debug.log("\u{1F340} Setting popup content HTML...");
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
      debug.log("\u{1F340} Appending popup to document.body...");
      popupOverlay.appendChild(popupContent);
      document.body.appendChild(popupOverlay);
      document.getElementById("halflingRerollBtn").addEventListener("click", () => {
        debug.log("\u{1F340} User chose to reroll");
        performHalflingReroll(rollData);
        document.body.removeChild(popupOverlay);
      });
      document.getElementById("halflingKeepBtn").addEventListener("click", () => {
        debug.log("\u{1F340} User chose to keep roll");
        document.body.removeChild(popupOverlay);
      });
      popupOverlay.addEventListener("click", (e) => {
        if (e.target === popupOverlay) {
          debug.log("\u{1F340} User closed popup");
          document.body.removeChild(popupOverlay);
        }
      });
      debug.log("\u{1F340} Halfling Luck popup displayed");
    }
    function performHalflingReroll(originalRollData) {
      debug.log("\u{1F340} Performing Halfling reroll for:", originalRollData);
      const formula = originalRollData.rollType;
      const baseFormula = formula.split("+")[0];
      const rerollData = {
        name: `\u{1F340} ${originalRollData.rollName} (Halfling Luck)`,
        formula: baseFormula,
        color: "#2D8B83",
        characterName: characterData.name
      };
      debug.log("\u{1F340} Reroll data:", rerollData);
      showNotification("\u{1F340} Halfling Luck reroll initiated!", "success");
    }
    function showLuckyPopup2(rollData) {
      debug.log("\u{1F396}\uFE0F Lucky popup called with:", rollData);
      if (!document.body) {
        debug.error("\u274C document.body not available for Lucky popup");
        showNotification("\u{1F396}\uFE0F Lucky triggered! (Popup failed to display)", "info");
        return;
      }
      debug.log("\u{1F396}\uFE0F Creating Lucky popup overlay...");
      const colors = getPopupThemeColors2();
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
      debug.log("\u{1F396}\uFE0F Setting Lucky popup content HTML...");
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
      debug.log("\u{1F396}\uFE0F Appending Lucky popup to document.body...");
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
      debug.log("\u{1F396}\uFE0F Lucky popup displayed");
    }
    function performLuckyReroll(originalRollData) {
      debug.log("\u{1F396}\uFE0F Performing Lucky reroll for:", originalRollData);
      const baseFormula = originalRollData.rollType.replace(/[+-]\d+$/i, "");
      const rerollData = {
        name: `\u{1F396}\uFE0F ${originalRollData.rollName} (Lucky Reroll)`,
        formula: baseFormula,
        color: "#f39c12",
        characterName: characterData.name
      };
      showNotification("\u{1F396}\uFE0F Lucky reroll initiated!", "success");
    }
    function showTraitChoicePopup(rollData) {
      debug.log("\u{1F3AF} Trait choice popup called with:", rollData);
      if (!document.body) {
        debug.error("\u274C document.body not available for trait choice popup");
        showNotification("\u{1F3AF} Trait choice triggered! (Popup failed to display)", "info");
        return;
      }
      debug.log("\u{1F3AF} Creating trait choice overlay...");
      const colors = getPopupThemeColors2();
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
      debug.log("\u{1F3AF} Setting trait choice popup content HTML...");
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
      debug.log("\u{1F3AF} Appending trait choice popup to document.body...");
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
          debug.log(`\u{1F3AF} User chose trait: ${trait.name}`);
          popupOverlay.remove();
          if (trait.name === "Halfling Luck") {
            showHalflingLuckPopup2({
              rollResult: rollData.baseRoll,
              baseRoll: rollData.baseRoll,
              rollType: rollData.rollType,
              rollName: rollData.rollName
            });
          } else if (trait.name === "Lucky") {
            const luckyResource = getLuckyResource();
            showLuckyPopup2({
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
      debug.log("\u{1F3AF} Trait choice popup displayed");
    }
    function showWildMagicSurgePopup2(d100Roll, effect) {
      debug.log("\u{1F300} Wild Magic Surge popup called with:", d100Roll, effect);
      if (!document.body) {
        debug.error("\u274C document.body not available for Wild Magic Surge popup");
        showNotification(`\u{1F300} Wild Magic Surge! d100: ${d100Roll}`, "warning");
        return;
      }
      const colors = getPopupThemeColors2();
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
      debug.log("\u{1F300} Wild Magic Surge popup displayed");
    }
    function showBardicInspirationPopup2(rollData) {
      debug.log("\u{1F3B5} Bardic Inspiration popup called with:", rollData);
      if (!document.body) {
        debug.error("\u274C document.body not available for Bardic Inspiration popup");
        showNotification("\u{1F3B5} Bardic Inspiration available! (Popup failed to display)", "info");
        return;
      }
      debug.log("\u{1F3B5} Creating Bardic Inspiration popup overlay...");
      const colors = getPopupThemeColors2();
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
      debug.log("\u{1F3B5} Setting Bardic Inspiration popup content HTML...");
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
      debug.log("\u{1F3B5} Appending Bardic Inspiration popup to document.body...");
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
        debug.log("\u{1F3B5} User chose to use Bardic Inspiration");
        performBardicInspirationRoll(rollData);
        document.body.removeChild(popupOverlay);
      });
      declineBtn.addEventListener("click", () => {
        debug.log("\u{1F3B5} User declined Bardic Inspiration");
        showNotification("Bardic Inspiration declined", "info");
        document.body.removeChild(popupOverlay);
      });
      popupOverlay.addEventListener("click", (e) => {
        if (e.target === popupOverlay) {
          debug.log("\u{1F3B5} User closed Bardic Inspiration popup");
          document.body.removeChild(popupOverlay);
        }
      });
      debug.log("\u{1F3B5} Bardic Inspiration popup displayed");
    }
    function performBardicInspirationRoll(rollData) {
      debug.log("\u{1F3B5} Performing Bardic Inspiration roll with data:", rollData);
      const success = useBardicInspiration();
      if (!success) {
        debug.error("\u274C Failed to use Bardic Inspiration (no uses left?)");
        showNotification("\u274C Failed to use Bardic Inspiration", "error");
        return;
      }
      const dieSize = parseInt(rollData.inspirationDie.substring(1));
      const inspirationRoll = Math.floor(Math.random() * dieSize) + 1;
      debug.log(`\u{1F3B5} Rolled ${rollData.inspirationDie}: ${inspirationRoll}`);
      const inspirationMessage = `/roll ${rollData.inspirationDie}`;
      const chatMessage = `\u{1F3B5} Bardic Inspiration for ${rollData.rollName}: [[${inspirationRoll}]] (${rollData.inspirationDie})`;
      showNotification(`\u{1F3B5} Bardic Inspiration: +${inspirationRoll}!`, "success");
      debug.log("\u{1F3B5} Bardic Inspiration roll complete");
    }
    function showElvenAccuracyPopup2(rollData) {
      debug.log("\u{1F9DD} Elven Accuracy popup called with:", rollData);
      if (!document.body) {
        debug.error("\u274C document.body not available for Elven Accuracy popup");
        showNotification("\u{1F9DD} Elven Accuracy triggered!", "info");
        return;
      }
      const colors = getPopupThemeColors2();
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
        debug.log("\u{1F9DD} User chose to reroll with Elven Accuracy");
        performElvenAccuracyReroll(rollData);
        document.body.removeChild(popupOverlay);
      });
      keepBtn.addEventListener("click", () => {
        debug.log("\u{1F9DD} User chose to keep original advantage rolls");
        document.body.removeChild(popupOverlay);
      });
      popupOverlay.addEventListener("click", (e) => {
        if (e.target === popupOverlay) {
          document.body.removeChild(popupOverlay);
        }
      });
      debug.log("\u{1F9DD} Elven Accuracy popup displayed");
    }
    function performElvenAccuracyReroll(originalRollData) {
      debug.log("\u{1F9DD} Performing Elven Accuracy reroll for:", originalRollData);
      const thirdRoll = Math.floor(Math.random() * 20) + 1;
      const rerollData = {
        name: `\u{1F9DD} ${originalRollData.rollName} (Elven Accuracy - 3rd die)`,
        formula: "1d20",
        color: "#27ae60",
        characterName: characterData.name
      };
      debug.log("\u{1F9DD} Third die roll:", thirdRoll);
      showNotification(`\u{1F9DD} Elven Accuracy! Third die: ${thirdRoll}`, "success");
    }
    globalThis.getPopupThemeColors = getPopupThemeColors2;
    globalThis.showHalflingLuckPopup = showHalflingLuckPopup2;
    globalThis.showLuckyPopup = showLuckyPopup2;
    globalThis.showTraitChoicePopup = showTraitChoicePopup;
    globalThis.showWildMagicSurgePopup = showWildMagicSurgePopup2;
    globalThis.showBardicInspirationPopup = showBardicInspirationPopup2;
    globalThis.showElvenAccuracyPopup = showElvenAccuracyPopup2;
    globalThis.performHalflingReroll = performHalflingReroll;
    globalThis.performLuckyReroll = performLuckyReroll;
    globalThis.performBardicInspirationRoll = performBardicInspirationRoll;
    globalThis.performElvenAccuracyReroll = performElvenAccuracyReroll;
    debug.log("\u2705 Character Trait Popups module loaded");
  })();

  // ../core/src/modules/character-traits.js
  (function() {
    "use strict";
    let activeRacialTraits = [];
    let activeFeatTraits = [];
    const HalflingLuck = {
      name: "Halfling Luck",
      description: "When you roll a 1 on an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.",
      onRoll: function(rollResult, rollType, rollName) {
        debug.log(`\u{1F9EC} Halfling Luck onRoll called with: ${rollResult}, ${rollType}, ${rollName}`);
        debug.log(`\u{1F9EC} Halfling Luck DEBUG - rollType exists: ${!!rollType}, includes d20: ${rollType && rollType.includes("d20")}, rollResult === 1: ${parseInt(rollResult) === 1}`);
        const numericRollResult = parseInt(rollResult);
        if (rollType && rollType.includes("d20") && numericRollResult === 1) {
          debug.log(`\u{1F9EC} Halfling Luck: TRIGGERED! Roll was ${numericRollResult}`);
          try {
            showHalflingLuckPopup({
              rollResult: numericRollResult,
              baseRoll: numericRollResult,
              rollType,
              rollName
            });
          } catch (error) {
            debug.error("\u274C Error showing Halfling Luck popup:", error);
            showNotification("\u{1F340} Halfling Luck triggered! Check console for details.", "info");
          }
          return true;
        }
        debug.log(`\u{1F9EC} Halfling Luck: No trigger - Roll: ${numericRollResult}, Type: ${rollType}`);
        return false;
      }
    };
    const LuckyFeat = {
      name: "Lucky",
      description: "You have 3 luck points. When you make an attack roll, ability check, or saving throw, you can spend one luck point to roll an additional d20. You can then choose which of the d20 rolls to use.",
      onRoll: function(rollResult, rollType, rollName) {
        debug.log(`\u{1F396}\uFE0F Lucky feat onRoll called with: ${rollResult}, ${rollType}, ${rollName}`);
        const numericRollResult = parseInt(rollResult);
        if (rollType && rollType.includes("d20")) {
          debug.log(`\u{1F396}\uFE0F Lucky: Checking if we should offer reroll for ${numericRollResult}`);
          const luckyResource = getLuckyResource();
          if (!luckyResource || luckyResource.current <= 0) {
            debug.log(`\u{1F396}\uFE0F Lucky: No luck points available (${luckyResource?.current || 0})`);
            return false;
          }
          debug.log(`\u{1F396}\uFE0F Lucky: Has ${luckyResource.current} luck points available`);
          if (numericRollResult <= 10) {
            debug.log(`\u{1F396}\uFE0F Lucky: TRIGGERED! Offering reroll for roll ${numericRollResult}`);
            try {
              showLuckyPopup({
                rollResult: numericRollResult,
                baseRoll: numericRollResult,
                rollType,
                rollName,
                luckPointsRemaining: luckyResource.current
              });
            } catch (error) {
              debug.error("\u274C Error showing Lucky popup:", error);
              showNotification("\u{1F396}\uFE0F Lucky triggered! Check console for details.", "info");
            }
            return true;
          }
        }
        debug.log(`\u{1F396}\uFE0F Lucky: No trigger - Roll: ${numericRollResult}, Type: ${rollType}`);
        return false;
      }
    };
    const ElvenAccuracy = {
      name: "Elven Accuracy",
      description: "Whenever you have advantage on an attack roll using Dexterity, Intelligence, Wisdom, or Charisma, you can reroll one of the dice once.",
      onRoll: function(rollResult, rollType, rollName) {
        debug.log(`\u{1F9DD} Elven Accuracy onRoll called with: ${rollResult}, ${rollType}, ${rollName}`);
        if (rollType && rollType.includes("advantage") && rollType.includes("attack")) {
          debug.log(`\u{1F9DD} Elven Accuracy: TRIGGERED! Offering to reroll lower die`);
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
    const DwarvenResilience = {
      name: "Dwarven Resilience",
      description: "You have advantage on saving throws against poison.",
      onRoll: function(rollResult, rollType, rollName) {
        debug.log(`\u26CF\uFE0F Dwarven Resilience onRoll called with: ${rollResult}, ${rollType}, ${rollName}`);
        const lowerRollName = rollName.toLowerCase();
        if (rollType && rollType.includes("save") && lowerRollName.includes("poison")) {
          debug.log(`\u26CF\uFE0F Dwarven Resilience: TRIGGERED! Auto-applying advantage`);
          showNotification("\u26CF\uFE0F Dwarven Resilience: Advantage on poison saves!", "success");
          return true;
        }
        return false;
      }
    };
    const GnomeCunning = {
      name: "Gnome Cunning",
      description: "You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic.",
      onRoll: function(rollResult, rollType, rollName) {
        debug.log(`\u{1F3A9} Gnome Cunning onRoll called with: ${rollResult}, ${rollType}, ${rollName}`);
        const lowerRollName = rollName.toLowerCase();
        const isMentalSave = lowerRollName.includes("intelligence") || lowerRollName.includes("wisdom") || lowerRollName.includes("charisma") || lowerRollName.includes("int save") || lowerRollName.includes("wis save") || lowerRollName.includes("cha save");
        const isMagic = lowerRollName.includes("spell") || lowerRollName.includes("magic") || lowerRollName.includes("charm") || lowerRollName.includes("illusion");
        if (rollType && rollType.includes("save") && isMentalSave && isMagic) {
          debug.log(`\u{1F3A9} Gnome Cunning: TRIGGERED! Auto-applying advantage`);
          showNotification("\u{1F3A9} Gnome Cunning: Advantage on mental saves vs magic!", "success");
          return true;
        }
        return false;
      }
    };
    const ReliableTalent = {
      name: "Reliable Talent",
      description: "Whenever you make an ability check that lets you add your proficiency bonus, you treat a d20 roll of 9 or lower as a 10.",
      onRoll: function(rollResult, rollType, rollName) {
        debug.log(`\u{1F3AF} Reliable Talent onRoll called with: ${rollResult}, ${rollType}, ${rollName}`);
        const numericRollResult = parseInt(rollResult);
        if (rollType && rollType.includes("skill") && numericRollResult < 10) {
          debug.log(`\u{1F3AF} Reliable Talent: TRIGGERED! Minimum roll is 10`);
          showNotification(`\u{1F3AF} Reliable Talent: ${numericRollResult} becomes 10!`, "success");
          return true;
        }
        return false;
      }
    };
    const JackOfAllTrades = {
      name: "Jack of All Trades",
      description: "You can add half your proficiency bonus (rounded down) to any ability check you make that doesn't already include your proficiency bonus.",
      onRoll: function(rollResult, rollType, rollName) {
        debug.log(`\u{1F3B5} Jack of All Trades onRoll called with: ${rollResult}, ${rollType}, ${rollName}`);
        if (rollType && rollType.includes("skill")) {
          const profBonus = characterData.proficiencyBonus || 2;
          const halfProf = Math.floor(profBonus / 2);
          debug.log(`\u{1F3B5} Jack of All Trades: Reminder to add +${halfProf} if non-proficient`);
          showNotification(`\u{1F3B5} Jack: Add +${halfProf} if non-proficient`, "info");
          return true;
        }
        return false;
      }
    };
    const RageDamageBonus = {
      name: "Rage",
      description: "While raging, you gain bonus damage on melee weapon attacks using Strength.",
      onRoll: function(rollResult, rollType, rollName) {
        debug.log(`\u{1F621} Rage Damage onRoll called with: ${rollResult}, ${rollType}, ${rollName}`);
        const isRaging = characterData.conditions && characterData.conditions.some(
          (c) => c.toLowerCase().includes("rage") || c.toLowerCase().includes("raging")
        );
        if (isRaging && rollType && rollType.includes("attack")) {
          const level = characterData.level || 1;
          const rageDamage = level < 9 ? 2 : level < 16 ? 3 : 4;
          debug.log(`\u{1F621} Rage Damage: TRIGGERED! Adding +${rageDamage} damage`);
          showNotification(`\u{1F621} Rage: Add +${rageDamage} damage!`, "success");
          return true;
        }
        return false;
      }
    };
    const BrutalCritical = {
      name: "Brutal Critical",
      description: "You can roll one additional weapon damage die when determining the extra damage for a critical hit with a melee attack.",
      onRoll: function(rollResult, rollType, rollName) {
        debug.log(`\u{1F4A5} Brutal Critical onRoll called with: ${rollResult}, ${rollType}, ${rollName}`);
        const numericRollResult = parseInt(rollResult);
        if (rollType && rollType.includes("attack") && numericRollResult === 20) {
          const level = characterData.level || 1;
          const extraDice = level < 13 ? 1 : level < 17 ? 2 : 3;
          debug.log(`\u{1F4A5} Brutal Critical: TRIGGERED! Roll ${extraDice} extra weapon die/dice`);
          showNotification(`\u{1F4A5} Brutal Critical: Roll ${extraDice} extra weapon die!`, "success");
          return true;
        }
        return false;
      }
    };
    const PortentDice = {
      name: "Portent",
      description: "Roll two d20s and record the numbers. You can replace any attack roll, saving throw, or ability check made by you or a creature you can see with one of these rolls.",
      portentRolls: [],
      // Store portent rolls for the day
      rollPortentDice: function() {
        const roll1 = Math.floor(Math.random() * 20) + 1;
        const roll2 = Math.floor(Math.random() * 20) + 1;
        this.portentRolls = [roll1, roll2];
        debug.log(`\u{1F52E} Portent: Rolled ${roll1} and ${roll2}`);
        showNotification(`\u{1F52E} Portent: You rolled ${roll1} and ${roll2}`, "info");
        return this.portentRolls;
      },
      usePortentRoll: function(index) {
        if (index >= 0 && index < this.portentRolls.length) {
          const roll2 = this.portentRolls.splice(index, 1)[0];
          debug.log(`\u{1F52E} Portent: Used portent roll ${roll2}`);
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
    const WILD_MAGIC_EFFECTS = [
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
    const WildMagicSurge = {
      name: "Wild Magic Surge",
      description: "Immediately after you cast a sorcerer spell of 1st level or higher, the DM can have you roll a d20. If you roll a 1, roll on the Wild Magic Surge table.",
      onSpellCast: function(spellLevel) {
        if (spellLevel >= 1) {
          const surgeRoll = Math.floor(Math.random() * 20) + 1;
          debug.log(`\u{1F300} Wild Magic: Rolled ${surgeRoll} for surge check`);
          if (surgeRoll === 1) {
            const surgeTableRoll = Math.floor(Math.random() * 100) + 1;
            const effect = WILD_MAGIC_EFFECTS[surgeTableRoll - 1];
            debug.log(`\u{1F300} Wild Magic: SURGE! d100 = ${surgeTableRoll}: ${effect}`);
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
    const BardicInspiration = {
      name: "Bardic Inspiration",
      description: "You can inspire others through stirring words or music. As a bonus action, grant an ally a Bardic Inspiration die they can add to an ability check, attack roll, or saving throw.",
      onRoll: function(rollResult, rollType, rollName) {
        debug.log(`\u{1F3B5} Bardic Inspiration onRoll called with: ${rollResult}, ${rollType}, ${rollName}`);
        if (rollType && rollType.includes("d20")) {
          debug.log(`\u{1F3B5} Bardic Inspiration: Checking if we should offer inspiration for ${rollName}`);
          const inspirationResource = getBardicInspirationResource();
          if (!inspirationResource || inspirationResource.current <= 0) {
            debug.log(`\u{1F3B5} Bardic Inspiration: No uses available (${inspirationResource?.current || 0})`);
            return false;
          }
          debug.log(`\u{1F3B5} Bardic Inspiration: Has ${inspirationResource.current} uses available`);
          const level = characterData.level || 1;
          const inspirationDie = level < 5 ? "d6" : level < 10 ? "d8" : level < 15 ? "d10" : "d12";
          debug.log(`\u{1F3B5} Bardic Inspiration: TRIGGERED! Offering ${inspirationDie}`);
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
            debug.error("\u274C Error showing Bardic Inspiration popup:", error);
            showNotification(`\u{1F3B5} Bardic Inspiration available! (${inspirationDie})`, "info");
          }
          return true;
        }
        debug.log(`\u{1F3B5} Bardic Inspiration: No trigger - Type: ${rollType}`);
        return false;
      }
    };
    function initRacialTraits2() {
      debug.log("\u{1F9EC} Initializing racial traits...");
      debug.log("\u{1F9EC} Character data:", characterData);
      debug.log("\u{1F9EC} Character race:", characterData?.race);
      activeRacialTraits = [];
      if (!characterData || !characterData.race) {
        debug.log("\u{1F9EC} No race data available");
        return;
      }
      const race = characterData.race.toLowerCase();
      if (race.includes("halfling")) {
        debug.log("\u{1F9EC} Halfling detected, adding Halfling Luck trait");
        activeRacialTraits.push(HalflingLuck);
      }
      if (characterData.features && characterData.features.some(
        (f) => f.name && f.name.toLowerCase().includes("elven accuracy")
      )) {
        debug.log("\u{1F9DD} Elven Accuracy feat detected");
        activeRacialTraits.push(ElvenAccuracy);
      }
      if (race.includes("dwarf")) {
        debug.log("\u26CF\uFE0F Dwarf detected, adding Dwarven Resilience trait");
        activeRacialTraits.push(DwarvenResilience);
      }
      if (race.includes("gnome")) {
        debug.log("\u{1F3A9} Gnome detected, adding Gnome Cunning trait");
        activeRacialTraits.push(GnomeCunning);
      }
      debug.log(`\u{1F9EC} Initialized ${activeRacialTraits.length} racial traits`);
    }
    function initFeatTraits2() {
      debug.log("\u{1F396}\uFE0F Initializing feat traits...");
      debug.log("\u{1F396}\uFE0F Character features:", characterData?.features);
      activeFeatTraits = [];
      if (!characterData || !characterData.features) {
        debug.log("\u{1F396}\uFE0F No features data available");
        return;
      }
      debug.log("\u{1F396}\uFE0F Lucky feat will be available as an action button");
      debug.log(`\u{1F396}\uFE0F Initialized ${activeFeatTraits.length} feat traits`);
    }
    function initClassFeatures2() {
      debug.log("\u2694\uFE0F Initializing class features...");
      debug.log("\u2694\uFE0F Character class:", characterData?.class);
      debug.log("\u2694\uFE0F Character level:", characterData?.level);
      if (!characterData) {
        debug.log("\u2694\uFE0F No character data available");
        return;
      }
      const characterClass = (characterData.class || "").toLowerCase();
      const level = characterData.level || 1;
      if (characterClass.includes("rogue") && level >= 11) {
        debug.log("\u{1F3AF} Rogue 11+ detected, adding Reliable Talent");
        activeFeatTraits.push(ReliableTalent);
      }
      if (characterClass.includes("bard") && level >= 1) {
        debug.log("\u{1F3B5} Bard detected, adding Bardic Inspiration");
        activeFeatTraits.push(BardicInspiration);
      }
      if (characterClass.includes("bard") && level >= 2) {
        debug.log("\u{1F3B5} Bard detected, adding Jack of All Trades");
        activeFeatTraits.push(JackOfAllTrades);
      }
      if (characterClass.includes("barbarian")) {
        debug.log("\u{1F621} Barbarian detected, adding Rage Damage Bonus");
        activeFeatTraits.push(RageDamageBonus);
      }
      if (characterClass.includes("barbarian") && level >= 9) {
        debug.log("\u{1F4A5} Barbarian 9+ detected, adding Brutal Critical");
        activeFeatTraits.push(BrutalCritical);
      }
      if (characterClass.includes("wizard") && level >= 2) {
        const isDivination = characterData.features && characterData.features.some(
          (f) => f.name && (f.name.toLowerCase().includes("divination") || f.name.toLowerCase().includes("portent"))
        );
        if (isDivination) {
          debug.log("\u{1F52E} Divination Wizard detected, adding Portent");
          activeFeatTraits.push(PortentDice);
          PortentDice.rollPortentDice();
        }
      }
      if (characterClass.includes("sorcerer")) {
        const isWildMagic = characterData.features && characterData.features.some(
          (f) => f.name && f.name.toLowerCase().includes("wild magic")
        );
        if (isWildMagic) {
          debug.log("\u{1F300} Wild Magic Sorcerer detected, adding Wild Magic Surge");
          activeFeatTraits.push(WildMagicSurge);
        }
      }
      debug.log(`\u2694\uFE0F Initialized ${activeFeatTraits.length} class feature traits`);
    }
    function checkRacialTraits(rollResult, rollType, rollName) {
      debug.log(`\u{1F9EC} Checking racial traits for roll: ${rollResult} (${rollType}) - ${rollName}`);
      debug.log(`\u{1F9EC} Active racial traits count: ${activeRacialTraits.length}`);
      let traitTriggered = false;
      for (const trait of activeRacialTraits) {
        if (trait.onRoll && typeof trait.onRoll === "function") {
          const result = trait.onRoll(rollResult, rollType, rollName);
          if (result) {
            traitTriggered = true;
            debug.log(`\u{1F9EC} ${trait.name} triggered!`);
          }
        }
      }
      return traitTriggered;
    }
    function checkFeatTraits(rollResult, rollType, rollName) {
      debug.log(`\u{1F396}\uFE0F Checking feat traits for roll: ${rollResult} (${rollType}) - ${rollName}`);
      debug.log(`\u{1F396}\uFE0F Active feat traits count: ${activeFeatTraits.length}`);
      let traitTriggered = false;
      for (const trait of activeFeatTraits) {
        if (trait.onRoll && typeof trait.onRoll === "function") {
          const result = trait.onRoll(rollResult, rollType, rollName);
          if (result) {
            traitTriggered = true;
            debug.log(`\u{1F396}\uFE0F ${trait.name} triggered!`);
          }
        }
      }
      return traitTriggered;
    }
    function getBardicInspirationResource() {
      if (!characterData || !characterData.resources) {
        debug.log("\u{1F3B5} No characterData or resources for Bardic Inspiration detection");
        return null;
      }
      const inspirationResource = characterData.resources.find((r) => {
        const lowerName = r.name.toLowerCase().trim();
        return lowerName.includes("bardic inspiration") || lowerName === "bardic inspiration" || lowerName === "inspiration" || lowerName.includes("inspiration die") || lowerName.includes("inspiration dice");
      });
      if (inspirationResource) {
        debug.log(`\u{1F3B5} Found Bardic Inspiration resource: ${inspirationResource.name} (${inspirationResource.current}/${inspirationResource.max})`);
      } else {
        debug.log("\u{1F3B5} No Bardic Inspiration resource found in character data");
      }
      return inspirationResource;
    }
    function useBardicInspiration2() {
      debug.log("\u{1F3B5} useBardicInspiration called");
      const inspirationResource = getBardicInspirationResource();
      debug.log("\u{1F3B5} Bardic Inspiration resource found:", inspirationResource);
      if (!inspirationResource) {
        debug.error("\u274C No Bardic Inspiration resource found");
        return false;
      }
      if (inspirationResource.current <= 0) {
        debug.error(`\u274C No Bardic Inspiration uses available (current: ${inspirationResource.current})`);
        return false;
      }
      const oldCurrent = inspirationResource.current;
      inspirationResource.current--;
      debug.log(`\u2705 Used Bardic Inspiration (${oldCurrent} \u2192 ${inspirationResource.current})`);
      browserAPI.storage.local.set({ characterData });
      buildResourcesDisplay();
      return true;
    }
    function updateLuckyButtonText() {
      const luckyButton = document.querySelector("#lucky-action-button");
      if (luckyButton) {
        const luckyResource = getLuckyResource();
        if (luckyResource) {
          const pointsText = luckyResource.current > 0 ? ` (${luckyResource.current}/3)` : " (0/3)";
          luckyButton.textContent = `\u{1F396}\uFE0F Lucky${pointsText}`;
        }
      }
    }
    globalThis.initRacialTraits = initRacialTraits2;
    globalThis.initFeatTraits = initFeatTraits2;
    globalThis.initClassFeatures = initClassFeatures2;
    globalThis.checkRacialTraits = checkRacialTraits;
    globalThis.checkFeatTraits = checkFeatTraits;
    globalThis.getBardicInspirationResource = getBardicInspirationResource;
    globalThis.useBardicInspiration = useBardicInspiration2;
    globalThis.updateLuckyButtonText = updateLuckyButtonText;
    globalThis.activeRacialTraits = activeRacialTraits;
    globalThis.activeFeatTraits = activeFeatTraits;
    debug.log("\u2705 Character Traits module loaded");
  })();

  // ../core/src/browser.js
  var import_color_utils = __toESM(require_color_utils());

  // ../core/src/modules/companions-manager.js
  (function() {
    "use strict";
    function buildCompanionsDisplay(companions) {
      const container = document.getElementById("companions-container");
      const section = document.getElementById("companions-section");
      section.style.display = "block";
      container.innerHTML = "";
      companions.forEach((companion) => {
        debug.log("\u{1F50D} DEBUG: Companion object in popup:", companion);
        debug.log("\u{1F50D} DEBUG: Companion abilities:", companion.abilities);
        debug.log("\u{1F50D} DEBUG: Companion abilities keys:", Object.keys(companion.abilities));
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
            const announcement = `&{template:default} {{name=${getColoredBanner(characterData)}${characterData.name}'s ${name} attacks!}} {{Type=Companion Attack}}`;
            const messageData = {
              action: "announceSpell",
              message: announcement,
              color: characterData.notificationColor
            };
            if (window.opener && !window.opener.closed) {
              try {
                window.opener.postMessage(messageData, "*");
              } catch (error) {
                debug.log("\u274C Failed to send companion attack announcement:", error);
              }
            }
            roll(`${name} - Attack`, `1d20+${bonus}`);
          });
        });
        companionCard.querySelectorAll(".companion-damage-btn").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const name = btn.dataset.name;
            const damage = btn.dataset.damage;
            const announcement = `&{template:default} {{name=${getColoredBanner(characterData)}${characterData.name}'s ${name} deals damage!}} {{Type=Companion Damage}}`;
            const messageData = {
              action: "announceSpell",
              message: announcement,
              color: characterData.notificationColor
            };
            if (window.opener && !window.opener.closed) {
              try {
                window.opener.postMessage(messageData, "*");
              } catch (error) {
                debug.log("\u274C Failed to send companion damage announcement:", error);
              }
            }
            roll(`${name} - Damage`, damage);
          });
        });
        container.appendChild(companionCard);
      });
    }
    Object.assign(globalThis, {
      buildCompanionsDisplay
    });
    console.log("\u2705 Companions Manager module loaded");
  })();

  // ../core/src/modules/concentration-tracker.js
  (function() {
    "use strict";
    let concentratingSpell = null;
    function updateConcentrationDisplay() {
      const concentrationIndicator = document.getElementById("concentration-indicator");
      const concentrationSpell = document.getElementById("concentration-spell");
      if (!concentrationIndicator || !concentrationSpell)
        return;
      if (characterData && characterData.spellSlots) {
        const spellSlots = characterData.spellSlots;
        let hasSpellSlots = false;
        for (let level = 1; level <= 9; level++) {
          if ((spellSlots[`level${level}SpellSlotsMax`] || 0) > 0) {
            hasSpellSlots = true;
            break;
          }
        }
        if ((spellSlots.pactMagicSlotsMax || 0) > 0) {
          hasSpellSlots = true;
        }
        if (!hasSpellSlots) {
          concentrationIndicator.style.display = "none";
          return;
        }
      }
      if (concentratingSpell) {
        concentrationIndicator.style.display = "flex";
        if (concentrationSpell) {
          concentrationSpell.textContent = concentratingSpell;
        }
      } else {
        concentrationIndicator.style.display = "none";
      }
    }
    function initConcentrationTracker() {
      const dropConcentrationBtn = document.getElementById("drop-concentration-btn");
      if (dropConcentrationBtn) {
        dropConcentrationBtn.addEventListener("click", () => {
          dropConcentration();
        });
      }
      debug.log("\u2705 Concentration tracker initialized");
    }
    function setConcentration(spellName) {
      if (concentratingSpell && concentratingSpell !== spellName) {
        const previousSpell = concentratingSpell;
        showNotification(`\u26A0\uFE0F Dropped concentration on ${previousSpell} to concentrate on ${spellName}`);
        debug.log(`\u{1F504} Replacing concentration: ${previousSpell} \u2192 ${spellName}`);
      }
      concentratingSpell = spellName;
      if (characterData) {
        characterData.concentrationSpell = spellName;
        saveCharacterData();
      }
      updateConcentrationDisplay();
      if (typeof sendStatusUpdate === "function") {
        sendStatusUpdate();
      }
      if (!concentratingSpell || concentratingSpell === spellName) {
        showNotification(`\u{1F9E0} Concentrating on: ${spellName}`);
      }
      debug.log(`\u{1F9E0} Concentration set: ${spellName}`);
    }
    function dropConcentration() {
      if (!concentratingSpell)
        return;
      const spellName = concentratingSpell;
      concentratingSpell = null;
      if (characterData) {
        characterData.concentrationSpell = null;
        saveCharacterData();
      }
      updateConcentrationDisplay();
      if (typeof sendStatusUpdate === "function") {
        sendStatusUpdate();
      }
      showNotification(`\u2705 Dropped concentration on ${spellName}`);
      debug.log(`\u{1F5D1}\uFE0F Concentration dropped: ${spellName}`);
    }
    Object.defineProperty(window, "concentratingSpell", {
      get: () => concentratingSpell,
      set: (value) => {
        concentratingSpell = value;
      },
      configurable: true
    });
    window.updateConcentrationDisplay = updateConcentrationDisplay;
    window.initConcentrationTracker = initConcentrationTracker;
    window.setConcentration = setConcentration;
    window.dropConcentration = dropConcentration;
    debug.log("\u2705 Concentration Tracker module loaded");
  })();

  // ../core/src/modules/data-manager.js
  (function() {
    "use strict";
    let currentSlotId = null;
    let syncDebounceTimer = null;
    const characterCache = /* @__PURE__ */ new Map();
    function saveCharacterData2() {
      if (typeof characterData === "undefined" || !characterData) {
        debug.warn("\u26A0\uFE0F No character data to save");
        return;
      }
      if (typeof browserAPI !== "undefined") {
        browserAPI.runtime.sendMessage({
          action: "storeCharacterData",
          data: characterData,
          slotId: currentSlotId
          // CRITICAL: Pass slotId for proper persistence
        }).then(() => {
          debug.log(`\u{1F4BE} Saved character data to browser storage (slotId: ${currentSlotId})`);
        }).catch((err) => {
          debug.error("\u274C Failed to save character data:", err);
        });
      }
      if (syncDebounceTimer) {
        clearTimeout(syncDebounceTimer);
      }
      syncDebounceTimer = setTimeout(() => {
        sendSyncMessage();
        syncDebounceTimer = null;
      }, 300);
    }
    function sendSyncMessage() {
      if (typeof characterData === "undefined" || !characterData) {
        debug.warn("\u26A0\uFE0F No character data to sync");
        return;
      }
      debug.log("\u{1F504} Sending character data update to DiceCloud sync...");
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
        debug.log("\u{1F4BE} Sent character data update to parent window");
      }
    }
    function validateCharacterData(data) {
      if (!data)
        return { valid: false, missing: ["all data"] };
      const hasSpells = Array.isArray(data.spells);
      const hasActions = Array.isArray(data.actions);
      if (!hasSpells || !hasActions) {
        const missing = [];
        if (!hasSpells)
          missing.push("spells");
        if (!hasActions)
          missing.push("actions");
        return { valid: false, missing };
      }
      return { valid: true, missing: [] };
    }
    async function getActiveCharacterId() {
      if (typeof browserAPI === "undefined") {
        debug.warn("\u26A0\uFE0F browserAPI not available");
        return null;
      }
      const result = await browserAPI.storage.local.get(["activeCharacterId"]);
      return result.activeCharacterId || null;
    }
    async function setActiveCharacter(characterId) {
      if (typeof browserAPI === "undefined") {
        debug.warn("\u26A0\uFE0F browserAPI not available");
        return;
      }
      try {
        await browserAPI.storage.local.set({
          activeCharacterId: characterId
        });
        console.log(`\u2705 Set active character: ${characterId}`);
      } catch (error) {
        console.error("\u274C Failed to set active character:", error);
      }
    }
    async function loadAndBuildTabs() {
      if (typeof browserAPI === "undefined") {
        debug.warn("\u26A0\uFE0F browserAPI not available");
        return;
      }
      try {
        debug.log("\u{1F4CB} Loading character profiles for tabs...");
        const profilesResponse = await browserAPI.runtime.sendMessage({ action: "getAllCharacterProfiles" });
        const profiles = profilesResponse.success ? profilesResponse.profiles : {};
        debug.log("\u{1F4CB} Profiles loaded:", Object.keys(profiles));
        const activeCharacterId = await getActiveCharacterId();
        debug.log("\u{1F4CB} Active character ID:", activeCharacterId);
        buildCharacterTabs(profiles, activeCharacterId);
      } catch (error) {
        debug.error("\u274C Failed to load and build tabs:", error);
      }
    }
    async function loadCharacterWithTabs() {
      if (typeof browserAPI === "undefined") {
        debug.warn("\u26A0\uFE0F browserAPI not available");
        return;
      }
      if (typeof domReady !== "undefined" && !domReady) {
        debug.log("\u23F3 DOM not ready, queuing loadCharacterWithTabs...");
        if (typeof pendingOperations !== "undefined") {
          pendingOperations.push(loadCharacterWithTabs);
        }
        return;
      }
      try {
        await loadAndBuildTabs();
        currentSlotId = await getActiveCharacterId();
        debug.log("\u{1F4CB} Current slot ID set to:", currentSlotId);
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
              debug.log("\u2705 Loaded character from database:", activeCharacter.name);
            }
          } catch (dbError) {
            debug.warn("\u26A0\uFE0F Failed to load database character:", dbError);
          }
        } else {
          const activeResponse = await browserAPI.runtime.sendMessage({ action: "getCharacterData" });
          activeCharacter = activeResponse.success ? activeResponse.data : null;
        }
        if (activeCharacter) {
          const validation = validateCharacterData(activeCharacter);
          if (!validation.valid) {
            debug.warn("\u26A0\uFE0F Character data is incomplete or outdated");
            debug.warn(`Missing data: ${validation.missing.join(", ")}`);
            const characterName = activeCharacter.name || activeCharacter.character_name || "this character";
            const errorContainer = document.getElementById("main-content");
            if (errorContainer) {
              errorContainer.innerHTML = `
              <div style="padding: 40px; text-align: center; color: var(--text-primary);">
                <h2 style="color: #e74c3c; margin-bottom: 20px;">\u26A0\uFE0F Incomplete Character Data</h2>
                <p style="margin-bottom: 15px; font-size: 1.1em;">
                  The character data for <strong>${characterName}</strong> is missing ${validation.missing.join(" and ")}.
                </p>
                <p style="margin-bottom: 15px; color: var(--text-secondary);">
                  This usually happens when loading old cloud data that was saved before spells and actions were synced.
                </p>
                <div style="background: #2c3e50; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin-bottom: 10px; font-weight: bold;">To fix this:</p>
                  <ol style="text-align: left; max-width: 500px; margin: 0 auto; line-height: 1.8;">
                    <li>Go to your character on <a href="https://dicecloud.com" target="_blank" style="color: #3498db;">DiceCloud.com</a></li>
                    <li>Click the <strong>"Sync to Extension"</strong> button on the character page</li>
                    <li>Wait for the sync to complete</li>
                    <li>Reopen this character sheet</li>
                  </ol>
                </div>
                <p style="color: var(--text-secondary); font-size: 0.9em;">
                  Character ID: ${activeCharacter.id || activeCharacter.dicecloud_character_id || "unknown"}
                </p>
              </div>
            `;
            }
            return;
          }
          if (typeof globalThis.characterData !== "undefined") {
            globalThis.characterData = activeCharacter;
          }
          if (typeof buildSheet !== "undefined") {
            buildSheet(activeCharacter);
          }
          if (typeof initRacialTraits !== "undefined")
            initRacialTraits();
          if (typeof initFeatTraits !== "undefined")
            initFeatTraits();
          if (typeof initClassFeatures !== "undefined")
            initClassFeatures();
        } else {
          debug.error("\u274C No character data found");
        }
      } catch (error) {
        debug.error("\u274C Failed to load characters:", error);
      }
    }
    function buildCharacterTabs(profiles, activeCharacterId) {
      const tabsContainer = document.getElementById("character-tabs");
      if (!tabsContainer) {
        debug.warn("\u26A0\uFE0F character-tabs container not found!");
        return;
      }
      debug.log(`\u{1F3F7}\uFE0F Building character tabs. Active: ${activeCharacterId}`);
      debug.log(`\u{1F4CB} Profiles:`, Object.keys(profiles));
      tabsContainer.innerHTML = "";
      const maxSlots = 10;
      const databaseCharacters = Object.entries(profiles).filter(
        ([slotId, profile]) => slotId.startsWith("db-") || profile.source === "database" || profile.hasCloudVersion === true
      );
      databaseCharacters.forEach(([slotId, charInSlot], index) => {
        const isActive = slotId === activeCharacterId;
        const displayName = charInSlot.name || charInSlot.character_name || charInSlot._fullData && (charInSlot._fullData.character_name || charInSlot._fullData.name) || "Unknown";
        debug.log(`\u{1F310} DB Character: ${displayName} (active: ${isActive})`);
        const tab = document.createElement("div");
        tab.className = "character-tab database-tab";
        if (isActive) {
          tab.classList.add("active");
        }
        tab.dataset.slotId = slotId;
        tab.innerHTML = `
        <span class="slot-number">\u{1F310}</span>
        <span class="char-name">${displayName}</span>
        <span class="char-details">${charInSlot.level || 1} ${charInSlot.class || "Unknown"}</span>
      `;
        tab.addEventListener("click", (e) => {
          debug.log(`\u{1F5B1}\uFE0F Database tab clicked for ${slotId}`, charInSlot.name);
          if (typeof switchToCharacter === "function") {
            switchToCharacter(slotId);
          }
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
        if (charInSlot && (charInSlot.source === "database" || charInSlot.hasCloudVersion === true)) {
          debug.log(`  \u23ED\uFE0F Slot ${slotNum}: ${charInSlot.name} (skipped - shown in cloud section)`);
          continue;
        }
        if (charInSlot) {
          debug.log(`  \u{1F4CC} Slot ${slotNum}: ${charInSlot.name} (active: ${slotId === activeCharacterId})`);
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
            debug.log(`\u{1F5B1}\uFE0F Tab clicked for ${slotId}`, charInSlot.name);
            if (!e.target.classList.contains("close-tab")) {
              if (typeof switchToCharacter === "function") {
                switchToCharacter(slotId);
              }
            }
          });
          const closeBtn = tab.querySelector(".close-tab");
          closeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (typeof showClearCharacterOptions === "function") {
              showClearCharacterOptions(slotId, slotNum, charInSlot.name);
            }
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
    globalThis.saveCharacterData = saveCharacterData2;
    globalThis.sendSyncMessage = sendSyncMessage;
    globalThis.loadCharacterWithTabs = loadCharacterWithTabs;
    globalThis.loadAndBuildTabs = loadAndBuildTabs;
    globalThis.getActiveCharacterId = getActiveCharacterId;
    globalThis.setActiveCharacter = setActiveCharacter;
    globalThis.buildCharacterTabs = buildCharacterTabs;
    globalThis.validateCharacterData = validateCharacterData;
    Object.defineProperty(globalThis, "currentSlotId", {
      get: () => currentSlotId,
      set: (value) => {
        currentSlotId = value;
      }
    });
    Object.defineProperty(globalThis, "syncDebounceTimer", {
      get: () => syncDebounceTimer,
      set: (value) => {
        syncDebounceTimer = value;
      }
    });
    Object.defineProperty(globalThis, "characterCache", {
      get: () => characterCache
    });
  })();

  // ../core/src/modules/dice-roller.js
  (function() {
    "use strict";
    function safeMathEval(expr) {
      const tokens = [];
      let i = 0;
      expr = expr.replace(/\s+/g, "");
      while (i < expr.length) {
        if (expr.substr(i, 10) === "Math.floor") {
          tokens.push({ type: "function", value: "floor" });
          i += 10;
        } else if (expr.substr(i, 9) === "Math.ceil") {
          tokens.push({ type: "function", value: "ceil" });
          i += 9;
        } else if (expr.substr(i, 10) === "Math.round") {
          tokens.push({ type: "function", value: "round" });
          i += 10;
        } else if (expr.substr(i, 3) === "max") {
          tokens.push({ type: "function", value: "max" });
          i += 3;
        } else if (expr.substr(i, 3) === "min") {
          tokens.push({ type: "function", value: "min" });
          i += 3;
        } else if (expr[i] >= "0" && expr[i] <= "9" || expr[i] === ".") {
          let num = "";
          while (i < expr.length && (expr[i] >= "0" && expr[i] <= "9" || expr[i] === ".")) {
            num += expr[i];
            i++;
          }
          tokens.push({ type: "number", value: parseFloat(num) });
        } else if ("+-*/(),".includes(expr[i])) {
          tokens.push({ type: "operator", value: expr[i] });
          i++;
        } else {
          throw new Error(`Unexpected character: ${expr[i]}`);
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
          const funcName = token.value;
          pos++;
          if (pos >= tokens.length || tokens[pos].value !== "(") {
            throw new Error("Expected ( after function name");
          }
          pos++;
          const args = [];
          if (funcName === "max" || funcName === "min") {
            args.push(parseExpression());
            while (pos < tokens.length && tokens[pos].value === ",") {
              pos++;
              args.push(parseExpression());
            }
          } else {
            args.push(parseExpression());
          }
          if (pos >= tokens.length || tokens[pos].value !== ")") {
            throw new Error("Expected ) after function argument");
          }
          pos++;
          if (funcName === "floor")
            return Math.floor(args[0]);
          if (funcName === "ceil")
            return Math.ceil(args[0]);
          if (funcName === "round")
            return Math.round(args[0]);
          if (funcName === "max")
            return Math.max(...args);
          if (funcName === "min")
            return Math.min(...args);
          throw new Error(`Unknown function: ${funcName}`);
        }
        if (token.type === "operator" && token.value === "(") {
          pos++;
          const result = parseExpression();
          if (pos >= tokens.length || tokens[pos].value !== ")") {
            throw new Error("Mismatched parentheses");
          }
          pos++;
          return result;
        }
        if (token.type === "operator" && token.value === "-") {
          pos++;
          return -parseFactor();
        }
        throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
      }
      return parseExpression();
    }
    function evaluateMathInFormula(formula) {
      if (!formula || typeof formula !== "string") {
        return formula;
      }
      let currentFormula = formula;
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
            const result = safeMathEval(processedFormula);
            if (typeof result === "number" && !isNaN(result)) {
              debug.log(`\u2705 Evaluated simple math: ${currentFormula} = ${result} (iteration ${iterations})`);
              currentFormula = String(result);
              continue;
            }
          } catch (e) {
            debug.log(`\u26A0\uFE0F Could not evaluate math expression: ${currentFormula}`, e);
          }
        }
        const dicePattern = /^(.+?)(d\d+.*)$/i;
        const match = processedFormula.match(dicePattern);
        if (match) {
          const mathPart = match[1];
          const dicePart = match[2];
          const mathOnlyPattern = /^[\d\s+\-*/().\w]+$/;
          if (mathOnlyPattern.test(mathPart)) {
            try {
              const result = safeMathEval(mathPart);
              if (typeof result === "number" && !isNaN(result)) {
                debug.log(`\u2705 Evaluated dice formula math: ${mathPart} = ${result} (iteration ${iterations})`);
                currentFormula = String(result) + dicePart;
                continue;
              }
            } catch (e) {
              debug.log(`\u26A0\uFE0F Could not evaluate dice formula math: ${mathPart}`, e);
            }
          }
        }
      }
      if (iterations > 1) {
        debug.log(`\u{1F504} Formula simplified in ${iterations} iterations: "${formula}" -> "${currentFormula}"`);
      }
      return currentFormula;
    }
    function applyEffectModifiers(rollName, formula) {
      const rollLower = rollName.toLowerCase();
      let modifiedFormula = formula;
      const effectNotes = [];
      const allEffects = [
        ...activeBuffs.map((name) => ({ ...POSITIVE_EFFECTS.find((e) => e.name === name), type: "buff" })),
        ...activeConditions.map((name) => ({ ...NEGATIVE_EFFECTS.find((e) => e.name === name), type: "debuff" }))
      ].filter((e) => e && e.autoApply);
      debug.log(`\u{1F3B2} Checking effects for roll: ${rollName}`, allEffects);
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
          debug.log(`\u2705 Applied ${effect.name} (${effect.type}) to ${rollName}`);
        }
      }
      return { modifiedFormula, effectNotes };
    }
    function checkOptionalEffects(rollName, formula, onApply) {
      const rollLower = rollName.toLowerCase();
      const optionalEffects = [
        ...activeBuffs.map((name) => ({ ...POSITIVE_EFFECTS.find((e) => e.name === name), type: "buff" })),
        ...activeConditions.map((name) => ({ ...NEGATIVE_EFFECTS.find((e) => e.name === name), type: "debuff" }))
      ].filter((e) => e && !e.autoApply && e.modifier);
      if (optionalEffects.length === 0)
        return;
      debug.log(`\u{1F3B2} Checking optional effects for roll: ${rollName}`, optionalEffects);
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
        showOptionalEffectPopup(applicableEffects, rollName, formula, onApply);
      }
    }
    function showOptionalEffectPopup(effects, rollName, formula, onApply) {
      debug.log("\u{1F3AF} Showing optional effect popup for:", effects);
      if (!document.body) {
        debug.error("\u274C document.body not available for optional effect popup");
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
      debug.log("\u{1F3AF} Optional effect popup displayed");
    }
    function roll2(name, formula, prerolledResult = null) {
      debug.log("\u{1F3B2} Rolling:", name, formula, prerolledResult ? `(prerolled: ${prerolledResult})` : "");
      let resolvedFormula = resolveVariablesInFormula(formula);
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
        debug.log("\u{1F3AF} Found applicable optional effects, showing popup...");
        checkOptionalEffects(name, resolvedFormula, (chosenEffect) => {
          const { modifiedFormula: modifiedFormula2, effectNotes: effectNotes2 } = applyEffectModifiers(name, resolvedFormula);
          let finalFormula = modifiedFormula2;
          const isSkillOrAbilityCheck = rollLower.includes("check") || rollLower.includes("acrobatics") || rollLower.includes("animal") || rollLower.includes("arcana") || rollLower.includes("athletics") || rollLower.includes("deception") || rollLower.includes("history") || rollLower.includes("insight") || rollLower.includes("intimidation") || rollLower.includes("investigation") || rollLower.includes("medicine") || rollLower.includes("nature") || rollLower.includes("perception") || rollLower.includes("performance") || rollLower.includes("persuasion") || rollLower.includes("religion") || rollLower.includes("sleight") || rollLower.includes("stealth") || rollLower.includes("survival") || rollLower.includes("strength") || rollLower.includes("dexterity") || rollLower.includes("constitution") || rollLower.includes("intelligence") || rollLower.includes("wisdom") || rollLower.includes("charisma");
          debug.log(`\u{1F3AF} Applying chosen effect: ${chosenEffect.name}`, {
            modifier: chosenEffect.modifier,
            rollLower,
            hasSkillMod: !!chosenEffect.modifier?.skill,
            isSkillOrAbilityCheck,
            formulaBefore: finalFormula
          });
          if (chosenEffect.modifier?.skill && isSkillOrAbilityCheck) {
            finalFormula += ` + ${chosenEffect.modifier.skill}`;
            effectNotes2.push(`[${chosenEffect.icon} ${chosenEffect.name}: ${chosenEffect.modifier.skill}]`);
            debug.log(`\u2705 Added skill modifier: ${chosenEffect.modifier.skill}, formula now: ${finalFormula}`);
          } else if (chosenEffect.modifier?.attack && rollLower.includes("attack")) {
            finalFormula += ` + ${chosenEffect.modifier.attack}`;
            effectNotes2.push(`[${chosenEffect.icon} ${chosenEffect.name}: ${chosenEffect.modifier.attack}]`);
            debug.log(`\u2705 Added attack modifier: ${chosenEffect.modifier.attack}, formula now: ${finalFormula}`);
          } else {
            debug.log(`\u26A0\uFE0F No modifier applied - skill: ${chosenEffect.modifier?.skill}, check: ${rollLower.includes("check")}, attack: ${chosenEffect.modifier?.attack}`);
          }
          if (chosenEffect.type === "buff") {
            activeBuffs = activeBuffs.filter((e) => e !== chosenEffect.name);
            debug.log(`\u{1F5D1}\uFE0F Removed buff: ${chosenEffect.name}`);
          } else if (chosenEffect.type === "debuff") {
            activeConditions = activeConditions.filter((e) => e !== chosenEffect.name);
            debug.log(`\u{1F5D1}\uFE0F Removed debuff: ${chosenEffect.name}`);
          }
          updateEffectsDisplay();
          const formulaWithAdvantage2 = applyAdvantageToFormula(finalFormula, effectNotes2);
          executeRoll(name, formulaWithAdvantage2, effectNotes2, prerolledResult);
        });
        return;
      }
      const { modifiedFormula, effectNotes } = applyEffectModifiers(name, resolvedFormula);
      const formulaWithAdvantage = applyAdvantageToFormula(modifiedFormula, effectNotes);
      executeRoll(name, formulaWithAdvantage, effectNotes, prerolledResult);
    }
    function applyAdvantageToFormula(formula, effectNotes) {
      if (advantageState === "normal") {
        return formula;
      }
      if (!formula.includes("1d20") && !formula.includes("d20")) {
        return formula;
      }
      let modifiedFormula = formula;
      if (advantageState === "advantage") {
        modifiedFormula = modifiedFormula.replace(/1d20/g, "2d20kh1");
        modifiedFormula = modifiedFormula.replace(/(?<!\d)d20/g, "2d20kh1");
        effectNotes.push("[\u26A1 Advantage]");
        debug.log("\u26A1 Applied advantage to roll");
      } else if (advantageState === "disadvantage") {
        modifiedFormula = modifiedFormula.replace(/1d20/g, "2d20kl1");
        modifiedFormula = modifiedFormula.replace(/(?<!\d)d20/g, "2d20kl1");
        effectNotes.push("[\u26A0\uFE0F Disadvantage]");
        debug.log("\u26A0\uFE0F Applied disadvantage to roll");
      }
      setTimeout(() => setAdvantageState("normal"), 100);
      return modifiedFormula;
    }
    function executeRoll(name, formula, effectNotes, prerolledResult = null) {
      const colorBanner = getColoredBanner(characterData);
      let rollName = `${colorBanner}${characterData.name} rolls ${name}`;
      if (effectNotes.length > 0) {
        rollName += ` ${effectNotes.join(" ")}`;
      }
      if (characterData) {
        characterData.lastRoll = {
          name,
          formula,
          effectNotes
        };
        saveCharacterData();
      }
      const messageData = {
        action: "rollFromPopout",
        name: rollName,
        formula,
        color: characterData.notificationColor,
        characterName: characterData.name
      };
      if (prerolledResult !== null) {
        messageData.prerolledResult = prerolledResult;
      }
      showNotification(`\u{1F3B2} Rolling ${name}...`);
      debug.log("\u2705 Roll executed");
    }
    globalThis.safeMathEval = safeMathEval;
    globalThis.evaluateMathInFormula = evaluateMathInFormula;
    globalThis.applyEffectModifiers = applyEffectModifiers;
    globalThis.checkOptionalEffects = checkOptionalEffects;
    globalThis.showOptionalEffectPopup = showOptionalEffectPopup;
    globalThis.roll = roll2;
    globalThis.applyAdvantageToFormula = applyAdvantageToFormula;
    globalThis.executeRoll = executeRoll;
    debug.log("\u2705 Dice Roller module loaded");
  })();

  // ../core/src/browser.js
  if (typeof window !== "undefined") {
    window.SUPABASE_URL = SUPABASE_URL;
    window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
    window.SUPABASE_TABLES = TABLES;
    window.SUPABASE_PROJECT_CONFIGS = PROJECT_CONFIGS;
    window.getProjectConfig = getProjectConfig;
  }

  // src/content/dicecloud.js
  (function() {
    "use strict";
    const debug2 = window.debug;
    debug2.log("\u{1F3B2} OwlCloud: DiceCloud content script loaded");
    debug2.log("\u{1F4CD} Current URL:", window.location.href);
    const API_BASE = "https://dicecloud.com/api";
    const STANDARD_VARS = {
      abilities: ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"],
      abilityMods: ["strengthMod", "dexterityMod", "constitutionMod", "intelligenceMod", "wisdomMod", "charismaMod"],
      saves: ["strengthSave", "dexteritySave", "constitutionSave", "intelligenceSave", "wisdomSave", "charismaSave"],
      skills: [
        "acrobatics",
        "animalHandling",
        "arcana",
        "athletics",
        "deception",
        "history",
        "insight",
        "intimidation",
        "investigation",
        "medicine",
        "nature",
        "perception",
        "performance",
        "persuasion",
        "religion",
        "sleightOfHand",
        "stealth",
        "survival"
      ],
      spellSlots: [
        "level1SpellSlots",
        "level2SpellSlots",
        "level3SpellSlots",
        "level4SpellSlots",
        "level5SpellSlots",
        "level6SpellSlots",
        "level7SpellSlots",
        "level8SpellSlots",
        "level9SpellSlots",
        "level1SpellSlotsMax",
        "level2SpellSlotsMax",
        "level3SpellSlotsMax",
        "level4SpellSlotsMax",
        "level5SpellSlotsMax",
        "level6SpellSlotsMax",
        "level7SpellSlotsMax",
        "level8SpellSlotsMax",
        "level9SpellSlotsMax"
      ],
      combat: ["armorClass", "hitPoints", "speed", "initiative", "proficiencyBonus"]
    };
    function getPopupPosition(x, y, width = 200, height = 150) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      let adjustedX = x;
      if (x + width > viewportWidth) {
        adjustedX = viewportWidth - width - 10;
        if (adjustedX < 10)
          adjustedX = 10;
      }
      let adjustedY = y;
      if (y + height > viewportHeight) {
        adjustedY = viewportHeight - height - 10;
        if (adjustedY < 10)
          adjustedY = 10;
      }
      return { x: adjustedX, y: adjustedY };
    }
    function stripConditionalExpressions(text) {
      if (!text || typeof text !== "string")
        return text;
      let result = text;
      let changed = true;
      while (changed) {
        const before = result;
        result = result.replace(/\{[^{}]*\?[^{}]*\}/g, "");
        result = result.replace(/\{[\s]*\[[^\]]*\][\s]*\[[^\]]*\][\s]*\}/g, "");
        changed = before !== result;
      }
      result = result.replace(/\s{2,}/g, " ").trim();
      return result;
    }
    function getCharacterIdFromUrl() {
      const url = window.location.pathname;
      debug2.log("\u{1F50D} Parsing URL:", url);
      const patterns = [
        /\/character\/([^/]+)/,
        // /character/ABC123
        /\/character\/([^/]+)\/[^/]+/,
        // /character/ABC123/CharName
        /character=([^&]+)/
        // ?character=ABC123
      ];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          debug2.log("\u2705 Found character ID:", match[1]);
          return match[1];
        }
      }
      debug2.error("\u274C Could not extract character ID from URL");
      return null;
    }
    async function fetchCharacterDataFromAPI() {
      debug2.log("\u{1F4E1} Starting API fetch...");
      const characterId = getCharacterIdFromUrl();
      if (!characterId) {
        const error = "Not on a character page. Navigate to a character sheet first.";
        debug2.error("\u274C", error);
        throw new Error(error);
      }
      debug2.log("\u{1F510} Requesting API token from background...");
      let tokenResponse;
      try {
        tokenResponse = await browserAPI.runtime.sendMessage({ action: "getApiToken" });
        debug2.log("\u{1F511} Token response from background:", tokenResponse);
      } catch (error) {
        debug2.error("Extension context error:", error);
        debug2.log("\u{1F504} Background script not responding, trying direct storage...");
        try {
          const storageResult = await browserAPI.storage.local.get(["diceCloudToken", "tokenExpires", "username"]);
          debug2.log("\u{1F4E6} Direct storage result:", storageResult);
          if (storageResult.diceCloudToken) {
            tokenResponse = {
              success: true,
              token: storageResult.diceCloudToken,
              tokenExpires: storageResult.tokenExpires,
              username: storageResult.username
            };
            debug2.log("\u2705 Token obtained from direct storage");
          } else {
            debug2.error("\u274C No token found in storage, storage keys:", Object.keys(storageResult));
            throw new Error("No token found in storage");
          }
        } catch (storageError) {
          debug2.error("Storage fallback failed:", storageError);
          throw new Error("Extension reloaded. Please refresh the page.");
        }
      }
      if (tokenResponse && !tokenResponse.success) {
        debug2.log("\u{1F504} Background script reported failure, trying direct storage...");
        try {
          const storageResult = await browserAPI.storage.local.get(["diceCloudToken", "tokenExpires", "username"]);
          debug2.log("\u{1F4E6} Direct storage result (background failed):", storageResult);
          if (storageResult.diceCloudToken) {
            tokenResponse = {
              success: true,
              token: storageResult.diceCloudToken,
              tokenExpires: storageResult.tokenExpires,
              username: storageResult.username
            };
            debug2.log("\u2705 Token obtained from direct storage (background failed)");
          } else {
            debug2.error("\u274C No token found in storage, storage keys:", Object.keys(storageResult));
            throw new Error("No token found in storage");
          }
        } catch (storageError) {
          debug2.error("Storage fallback failed:", storageError);
          throw new Error("Extension reloaded. Please refresh the page.");
        }
      }
      debug2.log("\u{1F50D} Final token response:", tokenResponse);
      if (!tokenResponse.success || !tokenResponse.token) {
        const error = "Not logged in to DiceCloud. Please login via the extension popup.";
        debug2.error("\u274C", error);
        throw new Error(error);
      }
      debug2.log("\u2705 API token obtained");
      debug2.log("\u{1F4E1} Fetching character data for ID:", characterId);
      const timestamp = Date.now();
      const apiUrl = `${API_BASE}/creature/${characterId}?_t=${timestamp}`;
      debug2.log("\u{1F310} API URL:", apiUrl);
      try {
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${tokenResponse.token}`,
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
          },
          cache: "no-store"
        });
        debug2.log("\u{1F4E8} API Response status:", response.status);
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("API token expired. Please login again via the extension popup.");
          }
          const errorText = await response.text();
          debug2.error("\u274C API Error Response:", errorText);
          throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const data = await response.json();
        debug2.log("\u2705 Received API data:", data);
        debug2.log("\u{1F4CA} Data structure:", {
          hasCreatures: !!data.creatures,
          creaturesCount: data.creatures && data.creatures.length || 0,
          hasVariables: !!data.creatureVariables,
          variablesCount: data.creatureVariables && data.creatureVariables.length || 0,
          hasProperties: !!data.creatureProperties,
          propertiesCount: data.creatureProperties && data.creatureProperties.length || 0
        });
        return parseCharacterData(data);
      } catch (fetchError) {
        debug2.error("\u274C Fetch error:", fetchError);
        throw fetchError;
      }
    }
    function getHitDieTypeFromClass(levels) {
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
      if (levels && levels.length > 0) {
        const primaryClass = levels[0]?.name?.toLowerCase() || "";
        for (const [classKey, die] of Object.entries(hitDiceMap)) {
          if (primaryClass.includes(classKey)) {
            return die;
          }
        }
      }
      return "d8";
    }
    function parseCharacterData(apiData) {
      debug2.log("\u{1F527} Parsing character data...");
      if (!apiData.creatures || apiData.creatures.length === 0) {
        debug2.error("\u274C No creatures found in API response");
        throw new Error("No character data found in API response");
      }
      const creature = apiData.creatures[0];
      const variables = apiData.creatureVariables && apiData.creatureVariables[0] || {};
      const properties = apiData.creatureProperties || [];
      debug2.log("\u{1F4DD} Creature:", creature);
      debug2.log("\u{1F4CA} Variables count:", Object.keys(variables).length);
      debug2.log("\u{1F4CB} Properties count:", properties.length);
      try {
        const propArmorMatches = properties.filter((p) => {
          const name = p && p.name ? String(p.name) : "";
          const type = p && p.type ? String(p.type) : "";
          return /armor|\bac\b/i.test(name) || /armor|\bac\b/i.test(type);
        });
        debug2.log(`\u{1F6E1}\uFE0F Properties with type/name containing armor/AC: ${propArmorMatches.length}`, propArmorMatches.map((p) => ({
          id: p._id || p.id || null,
          name: p.name,
          type: p.type,
          stat: p.stat,
          stats: p.stats,
          operation: p.operation,
          amount: p.amount,
          inactive: p.inactive,
          disabled: p.disabled
        })));
      } catch (e) {
        debug2.warn("\u26A0\uFE0F Error while listing armor-like properties:", e && e.message ? e.message : e);
      }
      const calculateArmorClass = () => {
        let baseAC = 10;
        let armorAC = null;
        const acBonuses = [];
        debug2.log("\u{1F6E1}\uFE0F Calculating AC from properties...");
        try {
          const extractNumeric2 = (val) => {
            if (val === null || val === void 0)
              return null;
            if (typeof val === "number" && !isNaN(val))
              return val;
            if (typeof val === "string") {
              const parsed = parseFloat(val);
              return isNaN(parsed) ? null : parsed;
            }
            if (typeof val === "object") {
              if (val.total !== void 0 && typeof val.total === "number")
                return val.total;
              if (val.total !== void 0 && typeof val.total === "string") {
                const p = parseFloat(val.total);
                if (!isNaN(p))
                  return p;
              }
              if (val.value !== void 0 && typeof val.value === "number")
                return val.value;
              if (val.value !== void 0 && typeof val.value === "string") {
                const p = parseFloat(val.value);
                if (!isNaN(p))
                  return p;
              }
              if (val.calculation && typeof val.calculation === "string") {
                const bm = val.calculation.match(/^(\d+)/);
                if (bm)
                  return parseInt(bm[1]);
              }
              if (val.text && typeof val.text === "string") {
                const p = parseFloat(val.text);
                if (!isNaN(p))
                  return p;
              }
            }
            return null;
          };
          if (creature && creature.denormalizedStats) {
            const dn = creature.denormalizedStats;
            const tryKeys = ["armorClass", "ac", "armor"];
            for (const k of tryKeys) {
              if (dn.hasOwnProperty(k)) {
                const num = extractNumeric2(dn[k]);
                if (num !== null) {
                  debug2.log(`\u{1F6E1}\uFE0F Using denormalizedStats.${k}:`, num);
                  return num;
                }
              }
            }
          }
          if (creature && creature.armorClass !== void 0) {
            const num = extractNumeric2(creature.armorClass);
            if (num !== null) {
              debug2.log("\u{1F6E1}\uFE0F Using creature.armorClass:", num);
              return num;
            }
          }
          if (creature && creature.stats && creature.stats.ac !== void 0) {
            const num = extractNumeric2(creature.stats.ac);
            if (num !== null) {
              debug2.log("\u{1F6E1}\uFE0F Using creature.stats.ac:", num);
              return num;
            }
          }
          try {
            if (variables && Object.keys(variables).length > 0) {
              const varNamesToCheck = ["armor", "armorClass", "armor_class", "ac", "acTotal", "ac_total"];
              for (const vn of varNamesToCheck) {
                if (Object.prototype.hasOwnProperty.call(variables, vn)) {
                  const v = variables[vn];
                  const candidate = extractNumeric2(v && (v.total ?? v.value ?? v));
                  if (candidate !== null) {
                    debug2.log(`\u{1F6E1}\uFE0F Using variable ${vn}:`, candidate);
                    return candidate;
                  }
                }
              }
            }
          } catch (e) {
            debug2.warn("\u26A0\uFE0F Error while checking variables for AC:", e && e.message ? e.message : e);
          }
          try {
            if (Array.isArray(properties) && properties.length > 0) {
              const propAC = properties.find((p) => p && p.name && /\barmor class\b/i.test(p.name));
              if (propAC) {
                const propAmount = propAC.amount ?? propAC.value ?? propAC.total ?? propAC.baseValue ?? propAC;
                const propNum = extractNumeric2(propAmount);
                if (propNum !== null) {
                  debug2.log('\u{1F6E1}\uFE0F Using property "Armor Class":', propNum, propAC);
                  return propNum;
                }
              }
            }
          } catch (e) {
            debug2.warn("\u26A0\uFE0F Error while checking properties for Armor Class:", e && e.message ? e.message : e);
          }
        } catch (e) {
          debug2.warn("\u26A0\uFE0F Error while checking denormalized AC fields:", e && e.message ? e.message : e);
        }
        try {
          const findNumericRecursively = (obj, depth = 0, path = "") => {
            if (obj === null || obj === void 0 || depth > 6)
              return null;
            const lastKey = path.split(".").pop();
            const ignoreKeyRegex = /^(xp|experience|milestoneLevels?|milestonelevel|level|levels|hp|hitPoints?|hit_points?)$/i;
            if (typeof obj === "number" && !isNaN(obj)) {
              if (ignoreKeyRegex.test(lastKey || ""))
                return null;
              return { value: obj, path };
            }
            if (typeof obj === "string") {
              const p = parseFloat(obj);
              if (!isNaN(p)) {
                if (ignoreKeyRegex.test(lastKey || ""))
                  return null;
                return { value: p, path };
              }
              return null;
            }
            if (typeof obj === "object") {
              const preferKeys = ["armorClass", "armor", "ac", "total", "value", "computed"];
              for (const k of preferKeys) {
                if (Object.prototype.hasOwnProperty.call(obj, k)) {
                  const candidate = findNumericRecursively(obj[k], depth + 1, path ? `${path}.${k}` : k);
                  if (candidate)
                    return candidate;
                }
              }
              for (const key of Object.keys(obj)) {
                try {
                  const candidate = findNumericRecursively(obj[key], depth + 1, path ? `${path}.${key}` : key);
                  if (candidate)
                    return candidate;
                } catch (inner) {
                }
              }
            }
            return null;
          };
          if (creature && creature.denormalizedStats) {
            debug2.log("\u{1F6E1}\uFE0F Deep-scanning denormalizedStats for numeric AC candidates...");
            debug2.log("\u{1F6E1}\uFE0F denormalizedStats snapshot:", creature.denormalizedStats);
            const nameRegex = /armor|armorClass|armor_class|ac|ac_total/i;
            const findNamedNumericRecursively = (obj, depth = 0, path = "") => {
              if (obj === null || obj === void 0 || depth > 6)
                return null;
              const lastKey = path.split(".").pop();
              if (typeof obj === "number" && !isNaN(obj) && nameRegex.test(lastKey || ""))
                return { value: obj, path };
              if (typeof obj === "string") {
                const p = parseFloat(obj);
                if (!isNaN(p) && nameRegex.test(lastKey || ""))
                  return { value: p, path };
                return null;
              }
              if (typeof obj === "object") {
                const preferKeys = ["armorClass", "armor", "ac", "total", "value", "computed"];
                for (const k of preferKeys) {
                  if (Object.prototype.hasOwnProperty.call(obj, k)) {
                    const candidate = findNamedNumericRecursively(obj[k], depth + 1, path ? `${path}.${k}` : k);
                    if (candidate)
                      return candidate;
                  }
                }
                for (const key of Object.keys(obj)) {
                  try {
                    const candidate = findNamedNumericRecursively(obj[key], depth + 1, path ? `${path}.${key}` : key);
                    if (candidate)
                      return candidate;
                  } catch (inner) {
                  }
                }
              }
              return null;
            };
            const namedFound = findNamedNumericRecursively(creature.denormalizedStats, 0, "denormalizedStats");
            if (namedFound) {
              debug2.log(`\u{1F6E1}\uFE0F Found named numeric candidate in denormalizedStats at ${namedFound.path}:`, namedFound.value);
              return namedFound.value;
            }
            const found = findNumericRecursively(creature.denormalizedStats, 0, "denormalizedStats");
            if (found) {
              debug2.log(`\u{1F6E1}\uFE0F Found numeric candidate in denormalizedStats at ${found.path}:`, found.value);
              return found.value;
            }
          }
        } catch (e) {
          debug2.warn("\u26A0\uFE0F Error during deep denormalizedStats scan:", e && e.message ? e.message : e);
        }
        try {
          const armorVarKeys = Object.keys(variables || {}).filter((k) => /armor|\bac\b/i.test(k));
          if (armorVarKeys.length > 0) {
            debug2.log("\u{1F6E1}\uFE0F armor variable candidates:", armorVarKeys);
            for (const key of armorVarKeys) {
              try {
                const candidateVar = variables[key];
                const candidateNum = extractNumeric(candidateVar && (candidateVar.total ?? candidateVar.value ?? candidateVar));
                if (candidateNum !== null) {
                  debug2.log(`\u{1F6E1}\uFE0F Using variable ${key}:`, candidateNum);
                  return candidateNum;
                } else {
                  debug2.log(`\u{1F6E1}\uFE0F Variable ${key} exists but did not yield numeric AC:`, candidateVar);
                }
              } catch (inner) {
                debug2.log("\u26A0\uFE0F Error inspecting variable", key, inner && inner.message ? inner.message : inner);
              }
            }
          }
        } catch (e) {
          debug2.warn("\u26A0\uFE0F Error while scanning variables for AC:", e && e.message ? e.message : e);
        }
        debug2.log(`\u{1F6E1}\uFE0F Total properties to scan: ${properties.length}`);
        const effectProps = properties.filter((p) => p.type === "effect");
        debug2.log(`\u{1F6E1}\uFE0F Found ${effectProps.length} effect properties`);
        if (effectProps.length > 0) {
          debug2.log("\u{1F6E1}\uFE0F Sample effect properties:", effectProps.slice(0, 5).map((p) => ({
            name: p.name,
            type: p.type,
            stat: p.stat,
            stats: p.stats,
            operation: p.operation,
            amount: p.amount,
            inactive: p.inactive,
            disabled: p.disabled
          })));
          const armorEffects = effectProps.filter(
            (p) => p.stat === "armor" || Array.isArray(p.stats) && p.stats.includes("armor") || typeof p.stats === "string" && p.stats === "armor" || p.name && p.name.toLowerCase().includes("armor")
          );
          debug2.log(`\u{1F6E1}\uFE0F Found ${armorEffects.length} armor-related effects:`, armorEffects.map((p) => ({
            name: p.name,
            type: p.type,
            stat: p.stat,
            stats: p.stats,
            operation: p.operation,
            amount: p.amount,
            inactive: p.inactive,
            disabled: p.disabled,
            enabled: p.enabled,
            equipped: p.equipped,
            parent: p.parent
          })));
        }
        properties.forEach((prop) => {
          if (prop.inactive || prop.disabled)
            return;
          const spellACEffects = ["shield", "shield of faith", "armor of agathys", "mage armor", "barkskin"];
          if (prop.name && spellACEffects.some((spell) => prop.name.toLowerCase().includes(spell))) {
            debug2.log(`  \u23ED\uFE0F Skipping spell effect: ${prop.name} (only applies when spell is active)`);
            return;
          }
          const hasArmorStat = prop.stat === "armor" || Array.isArray(prop.stats) && prop.stats.includes("armor") || typeof prop.stats === "string" && prop.stats === "armor";
          if (hasArmorStat) {
            let amount = null;
            if (typeof prop.amount === "number") {
              amount = prop.amount;
            } else if (typeof prop.amount === "string") {
              amount = parseFloat(prop.amount);
            } else if (prop.amount && typeof prop.amount === "object" && prop.amount.calculation) {
              const calc = prop.amount.calculation;
              debug2.log(`\u{1F6E1}\uFE0F Found calculated armor amount: "${calc}" for ${prop.name || "Unnamed"}`);
              const baseMatch = calc.match(/^(\d+)/);
              if (baseMatch) {
                amount = parseInt(baseMatch[1]);
                debug2.log(`  \u{1F4CA} Extracted base AC value: ${amount} from calculation`);
              }
            }
            if (amount !== null && !isNaN(amount)) {
              const operation = prop.operation || "";
              debug2.log(`\u{1F6E1}\uFE0F Found armor effect: ${prop.name || "Unnamed"} - Operation: ${operation}, Amount: ${amount}`);
              if (operation === "base" || operation === "Base value") {
                if (armorAC === null || amount > armorAC) {
                  armorAC = amount;
                  debug2.log(`  \u2705 Set armor AC to ${amount} from ${prop.name || "Unnamed"}`);
                }
              } else if (operation === "add" || operation === "Add") {
                acBonuses.push({ name: prop.name, amount });
                debug2.log(`  \u2705 Added AC bonus: +${amount} from ${prop.name || "Unnamed"}`);
              }
            }
          }
        });
        debug2.log("\u{1F6E1}\uFE0F Full armorClass variable object:", variables.armorClass);
        if (variables.armorClass && (variables.armorClass.total || variables.armorClass.value)) {
          const variableAC = variables.armorClass.total || variables.armorClass.value;
          debug2.log(`\u{1F6E1}\uFE0F Using Dicecloud's calculated AC: ${variableAC}`);
          return variableAC;
        }
        let finalAC = armorAC !== null ? armorAC : baseAC;
        acBonuses.forEach((bonus) => {
          finalAC += bonus.amount;
        });
        debug2.log(`\u{1F6E1}\uFE0F Dicecloud didn't provide AC variable, calculating from effects:`);
        debug2.log(`   Base: ${armorAC !== null ? armorAC + " (armor)" : baseAC + " (unarmored)"}`);
        debug2.log(`   Bonuses: ${acBonuses.map((b) => `+${b.amount} (${b.name})`).join(", ") || "none"}`);
        debug2.log(`   Final AC: ${finalAC}`);
        return finalAC;
      };
      const characterData2 = {
        id: creature._id || getCharacterIdFromUrl(),
        // CRITICAL: Store character ID for proper persistence
        name: creature.name || "",
        race: "",
        class: "",
        level: 0,
        background: "",
        alignment: creature.alignment || "",
        attributes: {},
        attributeMods: {},
        saves: {},
        savingThrows: {},
        skills: {},
        features: [],
        spells: [],
        actions: [],
        spellSlots: {},
        inventory: [],
        proficiencies: [],
        hitPoints: {
          current: variables.hitPoints && (variables.hitPoints.currentValue ?? variables.hitPoints.value) || 0,
          max: variables.hitPoints && (variables.hitPoints.total ?? variables.hitPoints.max) || 0
        },
        temporaryHP: variables.temporaryHitPoints && (variables.temporaryHitPoints.value ?? variables.temporaryHitPoints.currentValue) || 0,
        hitDice: {
          current: creature.level || 1,
          max: creature.level || 1,
          type: getHitDieTypeFromClass(creature.levels || [])
        },
        armorClass: calculateArmorClass(),
        speed: variables.speed && (variables.speed.total || variables.speed.value) || 30,
        initiative: variables.initiative && (variables.initiative.total || variables.initiative.value) || 0,
        proficiencyBonus: variables.proficiencyBonus && (variables.proficiencyBonus.total || variables.proficiencyBonus.value) || 0,
        deathSaves: {
          successes: creature.deathSave && creature.deathSave.success || 0,
          failures: creature.deathSave && creature.deathSave.fail || 0
        },
        resources: [],
        // Ki Points, Sorcery Points, Rage, etc.
        companions: [],
        // NEW: Store companion creatures (Animal Companions, Find Familiar, etc.)
        conditions: [],
        // Active conditions (Guidance, Bless, etc.) that affect rolls
        kingdom: {},
        army: {},
        otherVariables: {},
        // Store raw API data for debugging and fallback
        rawDiceCloudData: {
          creature,
          variables,
          properties
        }
      };
      STANDARD_VARS.abilities.forEach((ability) => {
        if (variables[ability]) {
          characterData2.attributes[ability] = variables[ability].total || variables[ability].value || 10;
        }
      });
      Object.keys(characterData2.attributes).forEach((attr) => {
        const score = characterData2.attributes[attr] || 10;
        characterData2.attributeMods[attr] = Math.floor((score - 10) / 2);
      });
      STANDARD_VARS.abilityMods.forEach((mod) => {
        if (variables[mod]) {
          const abilityName = mod.replace("Mod", "");
          const diceCloudMod = variables[mod].total || variables[mod].value || 0;
          const calculatedMod = characterData2.attributeMods[abilityName] || 0;
          if (diceCloudMod !== 0 && diceCloudMod !== calculatedMod) {
            characterData2.attributeMods[abilityName] = diceCloudMod;
            debug2.log(`\u{1F4CA} Using Dice Cloud modifier for ${abilityName}: ${diceCloudMod} (calculated: ${calculatedMod})`);
          } else {
            debug2.log(`\u{1F4CA} Using calculated modifier for ${abilityName}: ${calculatedMod}`);
          }
        }
      });
      STANDARD_VARS.saves.forEach((save) => {
        if (variables[save]) {
          const abilityName = save.replace("Save", "");
          const saveValue = variables[save].total || variables[save].value || 0;
          characterData2.saves[abilityName] = saveValue;
          characterData2.savingThrows[abilityName] = saveValue;
        }
      });
      STANDARD_VARS.skills.forEach((skill) => {
        if (variables[skill]) {
          characterData2.skills[skill] = variables[skill].total || variables[skill].value || 0;
        }
      });
      debug2.log("\u{1F50D} Extracting spell slots...");
      characterData2.spellSlots = {};
      for (let level = 1; level <= 9; level++) {
        const diceCloudVarName = `slotLevel${level}`;
        const currentKey = `level${level}SpellSlots`;
        const maxKey = `level${level}SpellSlotsMax`;
        if (variables[diceCloudVarName]) {
          const currentSlots = variables[diceCloudVarName].value || 0;
          const maxSlots = variables[diceCloudVarName].total || variables[diceCloudVarName].value || 0;
          characterData2.spellSlots[currentKey] = currentSlots;
          characterData2.spellSlots[maxKey] = maxSlots;
          debug2.log(`  \u2705 Level ${level}: ${currentSlots}/${maxSlots} (from ${diceCloudVarName})`);
        } else {
          debug2.log(`  \u26A0\uFE0F Level ${level}: ${diceCloudVarName} not found in variables`);
        }
      }
      const pactMagicVarNames = [
        "pactMagicSlot",
        "pactMagicSlots",
        "pactSlot",
        "pactSlots",
        "warlockSlot",
        "warlockSlots",
        "warlockSpellSlots",
        "pactMagic",
        "pactMagicUses",
        "spellSlotsPact"
      ];
      const slotLevelVarNames = [
        "pactSlotLevelVisible",
        "pactSlotLevel",
        // TLoE/common DiceCloud naming - check first!
        "pactMagicSlotLevel",
        "warlockSlotLevel",
        "pactMagicLevel",
        "warlockSpellLevel",
        "pactCasterLevel",
        "slotLevel"
        // Generic slot level - check last as fallback
      ];
      let foundPactMagic = false;
      for (const varName of pactMagicVarNames) {
        if (variables[varName]) {
          const currentSlots = variables[varName].value || 0;
          const maxSlots = variables[varName].total || variables[varName].value || 0;
          let slotLevel = 1;
          const extractValue = (prop) => {
            if (prop === null || prop === void 0)
              return null;
            if (typeof prop === "number")
              return prop;
            if (typeof prop === "object") {
              return prop.value ?? prop.total ?? prop.currentValue ?? null;
            }
            return parseInt(prop) || null;
          };
          const slotLevelFromProp = extractValue(variables[varName].spellSlotLevel) ?? extractValue(variables[varName].slotLevel) ?? extractValue(variables[varName].level);
          if (slotLevelFromProp) {
            slotLevel = slotLevelFromProp;
            debug2.log(`  \u{1F4CA} Found slot level ${slotLevel} from ${varName} property`);
          } else {
            for (const levelVarName of slotLevelVarNames) {
              if (variables[levelVarName]) {
                slotLevel = extractValue(variables[levelVarName]) || variables[levelVarName].value || 1;
                debug2.log(`  \u{1F4CA} Found slot level ${slotLevel} from variable ${levelVarName}`);
                break;
              }
            }
          }
          if (slotLevel === 1 && variables.warlockLevel) {
            slotLevel = Math.min(5, Math.ceil(variables.warlockLevel.value / 2));
            debug2.log(`  \u{1F4CA} Calculated slot level ${slotLevel} from warlockLevel`);
          }
          characterData2.spellSlots.pactMagicSlots = currentSlots;
          characterData2.spellSlots.pactMagicSlotsMax = maxSlots;
          characterData2.spellSlots.pactMagicSlotLevel = slotLevel;
          debug2.log(`  \u2705 Pact Magic: ${currentSlots}/${maxSlots} at level ${slotLevel} (from ${varName})`);
          debug2.log(`  \u{1F4CB} Full ${varName} variable:`, JSON.stringify(variables[varName]));
          foundPactMagic = true;
          break;
        }
      }
      const slotRelatedVars = Object.keys(variables).filter((k) => {
        const lower = k.toLowerCase();
        return lower.includes("slot") || lower.includes("pact") || lower.includes("warlock") || lower.includes("spell") && !lower.includes("attack");
      });
      debug2.log("\u{1F50D} All slot/pact/warlock/spell related variables:", slotRelatedVars);
      if (slotRelatedVars.length > 0) {
        slotRelatedVars.forEach((varName) => {
          debug2.log(`   ${varName}:`, variables[varName]);
        });
      }
      debug2.log("\u{1F4CA} Final spell slots object:", characterData2.spellSlots);
      const kingdomSkills = [
        "agriculture",
        "arts",
        "boating",
        "defense",
        "engineering",
        "exploration",
        "folklore",
        "industry",
        "intrigue",
        "magic",
        "politics",
        "scholarship",
        "statecraft",
        "trade",
        "warfare",
        "wilderness"
      ];
      kingdomSkills.forEach((skill) => {
        const skillVar = `kingdom${skill.charAt(0).toUpperCase() + skill.slice(1)}`;
        if (variables[skillVar]) {
          characterData2.kingdom[skill] = variables[skillVar].value || 0;
        }
        const profVar = `${skillVar}ProficiencyTotal`;
        if (variables[profVar]) {
          characterData2.kingdom[`${skill}_proficiency_total`] = variables[profVar].value || 0;
        }
      });
      const kingdomCoreStats = ["culture", "economy", "loyalty", "stability"];
      kingdomCoreStats.forEach((stat) => {
        const statVar = `kingdom${stat.charAt(0).toUpperCase() + stat.slice(1)}`;
        if (variables[statVar]) {
          characterData2.kingdom[stat] = variables[statVar].value || 0;
        }
      });
      const armySkills = ["scouting", "maneuver", "morale", "ranged"];
      armySkills.forEach((skill) => {
        const skillVar = `army${skill.charAt(0).toUpperCase() + skill.slice(1)}`;
        if (variables[skillVar]) {
          characterData2.army[skill] = variables[skillVar].value || 0;
        }
      });
      if (variables.heroPoints) {
        characterData2.otherVariables.hero_points = variables.heroPoints.value || 0;
      }
      const knownVars = /* @__PURE__ */ new Set([
        ...STANDARD_VARS.abilities,
        ...STANDARD_VARS.abilityMods,
        ...STANDARD_VARS.saves,
        ...STANDARD_VARS.skills,
        "armorClass",
        "hitPoints",
        "speed",
        "initiative",
        "proficiencyBonus",
        "heroPoints",
        "_id",
        "_creatureId"
        // Skip internal MongoDB fields
      ]);
      kingdomSkills.forEach((skill) => {
        knownVars.add(`kingdom${skill.charAt(0).toUpperCase() + skill.slice(1)}`);
        knownVars.add(`kingdom${skill.charAt(0).toUpperCase() + skill.slice(1)}ProficiencyTotal`);
      });
      kingdomCoreStats.forEach((stat) => {
        knownVars.add(`kingdom${stat.charAt(0).toUpperCase() + stat.slice(1)}`);
      });
      armySkills.forEach((skill) => {
        knownVars.add(`army${skill.charAt(0).toUpperCase() + skill.slice(1)}`);
      });
      Object.keys(variables).forEach((varName) => {
        if (!knownVars.has(varName) && !varName.startsWith("_")) {
          const value = variables[varName] && variables[varName].value;
          if (value !== void 0 && value !== null) {
            characterData2.otherVariables[varName] = value;
          }
        }
      });
      debug2.log(`Extracted ${Object.keys(characterData2.otherVariables).length} additional variables`);
      debug2.log("\u{1F50D} Checking for race in otherVariables:", Object.keys(characterData2.otherVariables).filter((key) => key.toLowerCase().includes("race")).map((key) => `${key}: ${characterData2.otherVariables[key]}`));
      const propertyIdToName = /* @__PURE__ */ new Map();
      properties.forEach((prop) => {
        if (prop._id && prop.name) {
          propertyIdToName.set(prop._id, prop.name);
        }
      });
      debug2.log(`\u{1F4CB} Built property ID map with ${propertyIdToName.size} entries`);
      const sampleEntries = Array.from(propertyIdToName.entries()).slice(0, 10);
      debug2.log("\u{1F4CB} Sample property ID map entries:", sampleEntries);
      const classEntries = properties.filter((p) => p.type === "class" && p._id && p.name);
      debug2.log("\u{1F4CB} Class entries in map:", classEntries.map((p) => ({ id: p._id, name: p.name, type: p.type })));
      const uniqueClasses = /* @__PURE__ */ new Set();
      const uniqueResources = /* @__PURE__ */ new Set();
      const propertyTypes = /* @__PURE__ */ new Set();
      let raceFound = false;
      let racePropertyId = null;
      let raceName = null;
      apiData.creatureProperties.forEach((prop) => {
        propertyTypes.add(prop.type);
        const commonRaces = ["human", "elf", "dwarf", "halfling", "gnome", "half-elf", "half-orc", "dragonborn", "tiefling", "orc", "goblin", "kobold"];
        if (prop.type === "folder" && prop.name) {
          const nameMatchesRace = commonRaces.some((race) => prop.name.toLowerCase().includes(race));
          if (nameMatchesRace) {
            const parentDepth = prop.ancestors ? prop.ancestors.length : 0;
            debug2.log(`\u{1F50D} DEBUG: Found folder "${prop.name}" with parentDepth ${parentDepth}, ancestors:`, prop.ancestors);
            if (parentDepth <= 2) {
              debug2.log("\u{1F50D} Found potential race folder:", {
                name: prop.name,
                type: prop.type,
                _id: prop._id,
                parentDepth
              });
              if (!raceFound) {
                raceName = prop.name;
                racePropertyId = prop._id;
                characterData2.race = prop.name;
                debug2.log("\u{1F50D} Set race to:", prop.name, "(ID:", prop._id, ")");
                raceFound = true;
              }
            } else {
              debug2.log(`\u{1F50D} DEBUG: Skipping "${prop.name}" - parentDepth ${parentDepth} > 2`);
            }
          }
        }
        if (prop.type === "race") {
          debug2.log("\u{1F50D} Found race property:", prop);
          if (prop.name) {
            raceName = prop.name;
            racePropertyId = prop._id;
            characterData2.race = prop.name;
            debug2.log("\u{1F50D} Set race to:", prop.name, "(ID:", prop._id, ")");
            raceFound = true;
          }
        } else if (prop.type === "species") {
          debug2.log("\u{1F50D} Found species property:", prop);
          if (prop.name) {
            raceName = prop.name;
            racePropertyId = prop._id;
            characterData2.race = prop.name;
            debug2.log("\u{1F50D} Set race to (from species):", prop.name, "(ID:", prop._id, ")");
            raceFound = true;
          }
        } else if (prop.type === "characterRace") {
          debug2.log("\u{1F50D} Found characterRace property:", prop);
          if (prop.name) {
            raceName = prop.name;
            racePropertyId = prop._id;
            characterData2.race = prop.name;
            debug2.log("\u{1F50D} Set race to (from characterRace):", prop.name, "(ID:", prop._id, ")");
            raceFound = true;
          }
        }
        switch (prop.type) {
          case "class":
            if (prop.name && !prop.inactive && !prop.disabled) {
              const cleanName = prop.name.replace(/\s*\[Multiclass\]/i, "").trim();
              const normalizedClassName = cleanName.toLowerCase().trim();
              debug2.log(`\u{1F4DA} Found class property: "${prop.name}" (cleaned: "${cleanName}", normalized: "${normalizedClassName}")`);
              if (!uniqueClasses.has(normalizedClassName)) {
                debug2.log(`  \u2705 Adding class (not in set yet)`);
                uniqueClasses.add(normalizedClassName);
                if (characterData2.class) {
                  characterData2.class += ` / ${cleanName}`;
                } else {
                  characterData2.class = cleanName;
                }
              } else {
                debug2.log(`  \u23ED\uFE0F  Skipping class (already in set:`, Array.from(uniqueClasses), ")");
              }
            } else if (prop.name && (prop.inactive || prop.disabled)) {
              debug2.log(`  \u23ED\uFE0F  Skipping inactive/disabled class: ${prop.name}`);
            }
            break;
          case "classLevel":
            if (prop.inactive || prop.disabled) {
              if (prop.name) {
                debug2.log(`  \u23ED\uFE0F  Skipping inactive/disabled classLevel: ${prop.name}`);
              }
              break;
            }
            characterData2.level += 1;
            if (prop.name) {
              const cleanName = prop.name.replace(/\s*\[Multiclass\]/i, "").trim();
              const normalizedClassName = cleanName.toLowerCase().trim();
              debug2.log(`\u{1F4CA} Found classLevel property: "${prop.name}" (cleaned: "${cleanName}", normalized: "${normalizedClassName}")`);
              if (!uniqueClasses.has(normalizedClassName)) {
                debug2.log(`  \u2705 Adding class from classLevel (not in set yet)`);
                uniqueClasses.add(normalizedClassName);
                if (characterData2.class) {
                  characterData2.class += ` / ${cleanName}`;
                } else {
                  characterData2.class = cleanName;
                }
              } else {
                debug2.log(`  \u23ED\uFE0F  Skipping classLevel (already in set:`, Array.from(uniqueClasses), ")");
              }
            }
            break;
          case "race":
            if (prop.name) {
              characterData2.race = prop.name;
              debug2.log("\u{1F50D} Found race property:", prop.name);
            }
            break;
          case "species":
            if (prop.name) {
              characterData2.race = prop.name;
              debug2.log("\u{1F50D} Found species property (using as race):", prop.name);
            }
            break;
          case "characterRace":
            if (prop.name) {
              characterData2.race = prop.name;
              debug2.log("\u{1F50D} Found characterRace property:", prop.name);
            }
            break;
          case "background":
            if (prop.name) {
              characterData2.background = prop.name;
            }
            break;
          case "feature":
            if (prop.inactive || prop.disabled) {
              debug2.log(`\u23ED\uFE0F Skipping inactive/disabled feature: ${prop.name}`);
              break;
            }
            let featureSummary = "";
            if (prop.summary) {
              if (typeof prop.summary === "object" && prop.summary.value) {
                featureSummary = prop.summary.value;
              } else if (typeof prop.summary === "object" && prop.summary.text) {
                featureSummary = prop.summary.text;
              } else if (typeof prop.summary === "string") {
                featureSummary = prop.summary;
              }
            }
            featureSummary = stripConditionalExpressions(featureSummary);
            let featureDescription = "";
            if (prop.description) {
              if (typeof prop.description === "object" && prop.description.value) {
                featureDescription = prop.description.value;
              } else if (typeof prop.description === "object" && prop.description.text) {
                featureDescription = prop.description.text;
              } else if (typeof prop.description === "string") {
                featureDescription = prop.description;
              }
            }
            featureDescription = stripConditionalExpressions(featureDescription);
            const feature = {
              name: prop.name || "Unnamed Feature",
              summary: featureSummary,
              // Preserve summary separately
              description: featureDescription,
              // Preserve description separately
              uses: prop.uses,
              roll: prop.roll || "",
              damage: prop.damage || ""
            };
            characterData2.features.push(feature);
            const metamagicFeatureNames = [
              "Careful Spell",
              "Distant Spell",
              "Empowered Spell",
              "Extended Spell",
              "Heightened Spell",
              "Quickened Spell",
              "Subtle Spell",
              "Twinned Spell"
            ];
            const isMetamagicFeature = metamagicFeatureNames.some(
              (name) => name.toLowerCase() === feature.name.toLowerCase()
            );
            if (!isMetamagicFeature && (feature.roll || feature.damage)) {
              characterData2.actions.push({
                name: feature.name,
                actionType: "action",
                // Features with rolls are typically actions
                attackRoll: "",
                damage: feature.damage || feature.roll,
                damageType: "",
                summary: feature.summary,
                // Preserve summary separately
                description: feature.description
                // Preserve description separately
              });
              debug2.log(`\u2694\uFE0F Added feature with roll to actions: ${feature.name}`);
            }
            break;
          case "toggle":
            if (prop.inactive || prop.disabled) {
              debug2.log(`\u23ED\uFE0F Skipping inactive/disabled toggle: ${prop.name}`);
              break;
            }
            debug2.log(`\u{1F518} Found toggle: ${prop.name} (enabled on DiceCloud: ${prop.enabled})`);
            debug2.log(`\u{1F518} Toggle full object:`, prop);
            const conditionNames = [
              "guidance",
              "bless",
              "bane",
              "bardic inspiration",
              "inspiration",
              "advantage",
              "disadvantage",
              "resistance",
              "vulnerability"
            ];
            const isConditionToggle = conditionNames.some(
              (cond) => prop.name && prop.name.toLowerCase().includes(cond)
            );
            const toggleChildren = apiData.creatureProperties.filter((child) => {
              return child.parent && child.parent.id === prop._id;
            });
            debug2.log(`\u{1F518} Toggle "${prop.name}" has ${toggleChildren.length} children:`, toggleChildren.map((c) => c.name));
            debug2.log(`\u{1F518} Toggle children full objects:`, toggleChildren);
            if (isConditionToggle && prop.enabled) {
              let effectValue = "";
              toggleChildren.forEach((child) => {
                if (child.type === "effect" && child.amount) {
                  if (typeof child.amount === "string") {
                    effectValue = child.amount;
                  } else if (typeof child.amount === "object" && child.amount.calculation) {
                    effectValue = child.amount.calculation;
                  }
                }
              });
              characterData2.conditions.push({
                name: prop.name,
                effect: effectValue || "1d4",
                // Default to 1d4 if no effect found
                active: true,
                source: "dicecloud"
              });
              debug2.log(`\u2728 Added active condition: ${prop.name} (${effectValue || "1d4"})`);
            }
            toggleChildren.forEach((child) => {
              debug2.log(`\u{1F518}   Child "${child.name}" has type: ${child.type}`);
            });
            toggleChildren.forEach((child) => {
              if (child.inactive || child.disabled) {
                debug2.log(`\u23ED\uFE0F Skipping inactive/disabled toggle child: ${child.name}`);
                return;
              }
              if (child.type === "feature" || child.type === "damage" || child.type === "effect") {
                let childSummary = "";
                let childDescription = "";
                if (child.summary) {
                  if (typeof child.summary === "object" && child.summary.text) {
                    childSummary = child.summary.text;
                  } else if (typeof child.summary === "object" && child.summary.value) {
                    childSummary = child.summary.value;
                  } else if (typeof child.summary === "string") {
                    childSummary = child.summary;
                  }
                }
                if (child.description) {
                  if (typeof child.description === "object" && child.description.text) {
                    childDescription = child.description.text;
                  } else if (typeof child.description === "object" && child.description.value) {
                    childDescription = child.description.value;
                  } else if (typeof child.description === "string") {
                    childDescription = child.description;
                  }
                }
                if (!childSummary && prop.summary) {
                  if (typeof prop.summary === "object" && prop.summary.text) {
                    childSummary = prop.summary.text;
                  } else if (typeof prop.summary === "object" && prop.summary.value) {
                    childSummary = prop.summary.value;
                  } else if (typeof prop.summary === "string") {
                    childSummary = prop.summary;
                  }
                }
                if (!childDescription && prop.description) {
                  if (typeof prop.description === "object" && prop.description.text) {
                    childDescription = prop.description.text;
                  } else if (typeof prop.description === "object" && prop.description.value) {
                    childDescription = prop.description.value;
                  } else if (typeof prop.description === "string") {
                    childDescription = prop.description;
                  }
                }
                childSummary = stripConditionalExpressions(childSummary);
                childDescription = stripConditionalExpressions(childDescription);
                const combinedChildDescription = childSummary && childDescription ? childSummary + "\n\n" + childDescription : childSummary || childDescription || "";
                let damageValue = "";
                let rollValue = "";
                if (child.type === "damage") {
                  if (typeof child.amount === "string") {
                    damageValue = child.amount;
                  } else if (typeof child.amount === "object") {
                    damageValue = child.amount.value || child.amount.calculation || "";
                  }
                  debug2.log(`\u{1F3AF} Found damage property: "${child.name || prop.name}" with value: "${damageValue}"`);
                } else if (child.type === "effect" && child.operation === "add" && child.amount) {
                  if (typeof child.amount === "string") {
                    damageValue = child.amount;
                  } else if (typeof child.amount === "object") {
                    damageValue = child.amount.value || child.amount.calculation || "";
                  }
                } else {
                  rollValue = child.roll || "";
                  damageValue = child.damage || "";
                }
                const toggleFeature = {
                  name: child.name || prop.name || "Unnamed Feature",
                  summary: childSummary,
                  // Preserve summary separately
                  description: childDescription,
                  // Preserve description separately
                  uses: child.uses || prop.uses,
                  roll: rollValue,
                  damage: damageValue
                };
                debug2.log(`\u{1F518} Created toggle feature: "${toggleFeature.name}" with damage: "${damageValue}", roll: "${rollValue}"`);
                characterData2.features.push(toggleFeature);
                const validActionTypes = ["action", "bonus", "reaction", "free", "legendary", "lair", "other"];
                const hasValidActionType = child.actionType && validActionTypes.includes(child.actionType.toLowerCase());
                const hasValidRoll = typeof toggleFeature.roll === "string" && toggleFeature.roll.trim().length > 0;
                const hasValidDamage = typeof toggleFeature.damage === "string" && toggleFeature.damage.trim().length > 0;
                debug2.log(`\u{1F518} Checking "${toggleFeature.name}": hasValidRoll=${hasValidRoll}, hasValidDamage=${hasValidDamage}, hasValidActionType=${hasValidActionType}, type=${child.type}`);
                const isDamageEffect = child.type === "effect" && hasValidDamage;
                const shouldAddToActions = (child.type !== "effect" || isDamageEffect) && (hasValidRoll || hasValidDamage || hasValidActionType);
                debug2.log(`\u{1F518} shouldAddToActions for "${toggleFeature.name}": ${shouldAddToActions} (isDamageEffect=${isDamageEffect})`);
                if (shouldAddToActions) {
                  const defaultType = hasValidRoll || hasValidDamage ? "action" : "other";
                  characterData2.actions.push({
                    name: toggleFeature.name,
                    actionType: child.actionType || defaultType,
                    attackRoll: "",
                    damage: toggleFeature.damage || toggleFeature.roll,
                    damageType: child.damageType || "",
                    summary: toggleFeature.summary,
                    // Preserve summary separately
                    description: toggleFeature.description
                    // Preserve description separately
                  });
                  if (toggleFeature.damage || toggleFeature.roll) {
                    debug2.log(`\u2694\uFE0F Added toggle feature to actions: ${toggleFeature.name}`);
                  } else {
                    debug2.log(`\u2728 Added toggle non-attack feature to actions: ${toggleFeature.name} (${child.actionType || "feature"})`);
                  }
                }
              }
            });
            break;
          case "spell":
            if (prop.inactive || prop.disabled) {
              debug2.log(`\u23ED\uFE0F Skipping inactive/disabled spell: ${prop.name}`);
              break;
            }
            let summary = "";
            if (prop.summary) {
              if (typeof prop.summary === "object" && prop.summary.value) {
                summary = prop.summary.value;
              } else if (typeof prop.summary === "object" && prop.summary.text) {
                summary = prop.summary.text;
              } else if (typeof prop.summary === "string") {
                summary = prop.summary;
              }
            }
            let description = "";
            if (prop.description) {
              if (typeof prop.description === "object" && prop.description.value) {
                description = prop.description.value;
              } else if (typeof prop.description === "object" && prop.description.text) {
                description = prop.description.text;
              } else if (typeof prop.description === "string") {
                description = prop.description;
              }
            }
            summary = stripConditionalExpressions(summary);
            description = stripConditionalExpressions(description);
            let fullDescription = "";
            if (summary && description) {
              fullDescription = summary + "\n\n" + description;
            } else if (summary) {
              fullDescription = summary;
            } else if (description) {
              fullDescription = description;
            }
            let source = "Unknown Source";
            const parentId = typeof prop.parent === "object" ? prop.parent?.id : prop.parent;
            debug2.log(`\u{1F50D} Spell "${prop.name}" debug:`, {
              parent: prop.parent,
              parentId,
              parentInMap: parentId ? propertyIdToName.has(parentId) : false,
              parentName: parentId ? propertyIdToName.get(parentId) : null,
              ancestors: prop.ancestors,
              ancestorsInMap: prop.ancestors ? prop.ancestors.map((ancestor) => {
                const ancestorId = typeof ancestor === "object" ? ancestor.id : ancestor;
                return {
                  ancestor,
                  ancestorId,
                  inMap: propertyIdToName.has(ancestorId),
                  name: propertyIdToName.get(ancestorId)
                };
              }) : [],
              tags: prop.tags,
              libraryTags: prop.libraryTags
            });
            if (parentId && propertyIdToName.has(parentId)) {
              source = propertyIdToName.get(parentId);
              debug2.log(`\u2705 Found source from parent for "${prop.name}": ${source}`);
            } else if (prop.ancestors && prop.ancestors.length > 0) {
              let found = false;
              for (let i = prop.ancestors.length - 1; i >= 0 && !found; i--) {
                const ancestor = prop.ancestors[i];
                const ancestorId = typeof ancestor === "object" ? ancestor.id : ancestor;
                if (ancestorId && propertyIdToName.has(ancestorId)) {
                  source = propertyIdToName.get(ancestorId);
                  debug2.log(`\u2705 Found source from ancestor[${i}] for "${prop.name}": ${source}`);
                  found = true;
                }
              }
              if (!found) {
                debug2.log(`\u274C No source found in ${prop.ancestors.length} ancestors for "${prop.name}"`);
              }
            }
            if (source === "Unknown Source" && prop.libraryTags && prop.libraryTags.length > 0) {
              const classSpellTags = prop.libraryTags.filter(
                (tag) => tag.toLowerCase().endsWith("spell") && tag.toLowerCase() !== "spell"
              );
              if (classSpellTags.length > 0) {
                const classNames = classSpellTags.map((tag) => {
                  const className = tag.replace(/Spell$/i, "");
                  return className.charAt(0).toUpperCase() + className.slice(1);
                });
                source = classNames.join(" / ");
                debug2.log(`\u2705 Found source from libraryTags for "${prop.name}": ${source}`);
              }
            } else if (source === "Unknown Source" && prop.tags && prop.tags.length > 0) {
              source = prop.tags.join(", ");
              debug2.log(`\u2705 Found source from tags for "${prop.name}": ${source}`);
            }
            if (source === "Unknown Source") {
              debug2.log(`\u274C No source found for "${prop.name}"`);
            }
            const levelRequirement = source.match(/(\d+)(?:st|nd|rd|th)?\s+Level/i);
            const requiredLevel = levelRequirement ? parseInt(levelRequirement[1]) : 0;
            const characterLevel = characterData2.level || 1;
            if (requiredLevel > characterLevel) {
              debug2.log(`\u23ED\uFE0F Skipping "${prop.name}" from "${source}" (requires level ${requiredLevel}, character is level ${characterLevel})`);
              break;
            }
            if (prop.name === "Convert Spell Slot to Sorcery Points") {
              let fontOfMagicDesc = description;
              if (prop.ancestors && Array.isArray(prop.ancestors)) {
                for (const ancestor of prop.ancestors) {
                  const ancestorId = typeof ancestor === "object" ? ancestor.id : ancestor;
                  const ancestorProp = properties.find((p) => p._id === ancestorId);
                  if (ancestorProp && ancestorProp.name === "Font of Magic") {
                    if (ancestorProp.summary) {
                      fontOfMagicDesc = typeof ancestorProp.summary === "string" ? ancestorProp.summary : ancestorProp.summary.text || ancestorProp.summary.value || "";
                    } else if (ancestorProp.description) {
                      fontOfMagicDesc = typeof ancestorProp.description === "string" ? ancestorProp.description : ancestorProp.description.text || ancestorProp.description.value || "";
                    }
                    break;
                  }
                }
              }
              characterData2.actions.push({
                name: prop.name,
                actionType: "bonus",
                attackRoll: "",
                damage: "",
                damageType: "",
                description: fontOfMagicDesc,
                uses: null,
                usesUsed: 0,
                resources: null
              });
              debug2.log(`\u2728 Added Font of Magic conversion as action: ${prop.name}`);
              break;
            }
            let attackRoll = "";
            let damageRolls = [];
            const spellChildren = properties.filter((p) => {
              if (p.type !== "roll" && p.type !== "damage" && p.type !== "attack")
                return false;
              if (p.ancestors && Array.isArray(p.ancestors)) {
                const hasSpellAsAncestor = p.ancestors.some((ancestor) => {
                  const ancestorId = typeof ancestor === "object" ? ancestor.id : ancestor;
                  return ancestorId === prop._id;
                });
                if (hasSpellAsAncestor) {
                  console.log(`  \u2705 Including spell child: ${p.name} (${p.type})`, { amount: p.amount, roll: p.roll, inactive: p.inactive, disabled: p.disabled });
                }
                return hasSpellAsAncestor;
              }
              return false;
            });
            debug2.log(`\u{1F50D} Spell "${prop.name}" has ${spellChildren.length} child properties:`, spellChildren.map((c) => ({ type: c.type, name: c.name })));
            spellChildren.forEach((child) => {
              debug2.log(`  \u{1F4CB} Processing child: ${child.name} (${child.type})`);
              const spellNameLower = (prop.name || "").toLowerCase().trim();
              const isDefensiveSpell = spellNameLower === "shield" || spellNameLower.startsWith("shield ") || spellNameLower === "absorb elements" || spellNameLower === "counterspell";
              if (isDefensiveSpell && (child.type === "attack" || child.type === "roll" && child.name && child.name.toLowerCase().includes("attack"))) {
                debug2.log(`    \u{1F6E1}\uFE0F Defensive spell - skipping attack child: ${child.name}`);
                return;
              }
              if (child.type === "attack" || child.type === "roll" && child.name && child.name.toLowerCase().includes("attack")) {
                debug2.log(`    \u{1F3AF} Attack child found:`, { name: child.name, roll: child.roll, type: child.type });
                if (child.roll) {
                  if (typeof child.roll === "string") {
                    attackRoll = child.roll;
                  } else if (typeof child.roll === "object" && child.roll.value !== void 0) {
                    const bonus = child.roll.value;
                    attackRoll = bonus >= 0 ? `1d20+${bonus}` : `1d20${bonus}`;
                  } else if (typeof child.roll === "object" && child.roll.calculation) {
                    attackRoll = child.roll.calculation;
                  } else {
                    debug2.log(`    \u26A0\uFE0F Attack child has unexpected roll structure:`, child.roll);
                    attackRoll = "use_spell_attack_bonus";
                  }
                } else {
                  debug2.log(`    \u26A0\uFE0F Attack child has no roll property, using spell attack bonus`);
                  attackRoll = "use_spell_attack_bonus";
                }
                debug2.log(`    \u2705 Attack roll set to: ${attackRoll}`);
              }
              if (child.type === "damage" || child.type === "roll" && child.name && child.name.toLowerCase().includes("damage")) {
                debug2.log(`    \u{1F4CA} Damage child found:`, {
                  name: child.name,
                  amount: child.amount,
                  roll: child.roll,
                  damageType: child.damageType
                });
                let damageFormula = "";
                if (child.amount) {
                  if (typeof child.amount === "string") {
                    damageFormula = child.amount;
                    debug2.log(`      \u2192 Using amount string: "${damageFormula}"`);
                  } else if (typeof child.amount === "object") {
                    if (child.amount.value !== void 0) {
                      damageFormula = String(child.amount.value);
                      debug2.log(`      \u2192 Using amount.value: "${damageFormula}"`);
                    } else if (child.amount.calculation) {
                      damageFormula = child.amount.calculation;
                      debug2.log(`      \u2192 Using amount.calculation: "${damageFormula}"`);
                    }
                  }
                } else if (child.roll) {
                  if (typeof child.roll === "string") {
                    damageFormula = child.roll;
                    debug2.log(`      \u2192 Using roll string: "${damageFormula}"`);
                  } else if (typeof child.roll === "object") {
                    if (child.roll.value !== void 0) {
                      damageFormula = String(child.roll.value);
                      debug2.log(`      \u2192 Using roll.value: "${damageFormula}"`);
                    } else if (child.roll.calculation) {
                      damageFormula = child.roll.calculation;
                      debug2.log(`      \u2192 Using roll.calculation: "${damageFormula}"`);
                    }
                  }
                }
                if (damageFormula) {
                  const hasDiceNotation = /d\d+/i.test(damageFormula);
                  const isHalfDamageSave = !hasDiceNotation && /\w+Damage\s*\/\s*2|~target\.\w+\s*\/\s*2|floor\([^d)]+\/\s*2\)/i.test(damageFormula);
                  const isVariableReference = !hasDiceNotation && /^[~\w.]+$/.test(damageFormula.trim());
                  if (hasDiceNotation || !isHalfDamageSave && !isVariableReference) {
                    damageRolls.push({
                      damage: damageFormula,
                      damageType: child.damageType || "untyped"
                    });
                    console.log(`    \u2705 Added damage roll: ${damageFormula} (${child.damageType || "untyped"})`);
                  } else {
                    console.log(`    \u23ED\uFE0F Skipping non-roll formula: ${damageFormula} (hasDice: ${hasDiceNotation}, isHalfSave: ${isHalfDamageSave}, isVar: ${isVariableReference})`);
                  }
                }
              }
            });
            const uniqueDamageRolls = [];
            const seenRolls = /* @__PURE__ */ new Set();
            damageRolls.forEach((roll2) => {
              const key = `${roll2.damage}|${roll2.damageType}`;
              if (!seenRolls.has(key)) {
                seenRolls.add(key);
                uniqueDamageRolls.push(roll2);
              } else {
                console.log(`    \u{1F504} Skipping duplicate damage roll: ${roll2.damage} (${roll2.damageType})`);
              }
            });
            damageRolls = uniqueDamageRolls;
            const lowerDesc = fullDescription.toLowerCase();
            const hasTempHPKeyword = lowerDesc.includes("temporary hit point") || lowerDesc.includes("temp hp") || lowerDesc.includes("temporary hp");
            if (hasTempHPKeyword) {
              debug2.log(`  \u{1F6E1}\uFE0F Spell "${prop.name}" mentions temporary hit points`);
              if (damageRolls.length === 0) {
                debug2.log(`  \u{1F6E1}\uFE0F No damage children found, extracting temp HP from description`);
                const beforeTempHP = fullDescription.substring(0, fullDescription.toLowerCase().indexOf("temporary"));
                const dicePattern = /(\d+d\d+(?:\s*[+\-]\s*\d+)?)/i;
                const match = beforeTempHP.match(dicePattern);
                if (match) {
                  const formula = match[1].replace(/\s/g, "");
                  damageRolls.push({
                    damage: formula,
                    damageType: "temphp"
                  });
                  debug2.log(`  \u2705 Extracted temp HP dice formula from description: ${formula}`);
                } else {
                  const numberPattern = /(?:gain|additional)\s+(\d+)(?:\s+(?:additional))?\s+temporary/i;
                  const numberMatch = fullDescription.match(numberPattern);
                  if (numberMatch) {
                    const amount = numberMatch[1];
                    damageRolls.push({
                      damage: amount,
                      damageType: "temphp"
                    });
                    debug2.log(`  \u2705 Extracted temp HP fixed amount from description: ${amount}`);
                  }
                }
              } else {
                damageRolls.forEach((roll2) => {
                  if (roll2.damageType === "untyped" || !roll2.damageType || roll2.damageType === "healing") {
                    roll2.damageType = "temphp";
                    debug2.log(`  \u{1F6E1}\uFE0F Corrected ${prop.name} damage type to temphp`);
                  }
                });
              }
            }
            let damage = damageRolls.length > 0 ? damageRolls[0].damage : "";
            let damageType = damageRolls.length > 0 ? damageRolls[0].damageType : "";
            if (description) {
              const lowerDesc2 = description.toLowerCase();
              debug2.log(`  \u{1F50D} Checking description for spell attack (attackRoll currently: "${attackRoll}")`);
              const spellNameLower = (prop.name || "").toLowerCase();
              const isDefensiveSpell = spellNameLower === "shield" || spellNameLower.startsWith("shield ") || spellNameLower === "absorb elements" || spellNameLower === "counterspell";
              const hasOffensiveAttack = /\bmake\s+(?:a|an)\s+(?:\w+\s+){0,3}(spell attack|attack roll)\b/i.test(description);
              const hasDefensivePattern = /\b(hit by|when an?|against the|triggering)\s+(?:\w+\s+){0,2}attack/i.test(description);
              const hasAttackMention = hasOffensiveAttack && !hasDefensivePattern;
              if (!attackRoll && hasAttackMention && !isDefensiveSpell) {
                attackRoll = "use_spell_attack_bonus";
                debug2.log(`  \u{1F4A1} Found offensive attack pattern in description, marking for spell attack bonus`);
              } else if (!attackRoll) {
                debug2.log(`  \u26A0\uFE0F No attack pattern found in description for "${prop.name}"`);
              } else if (isDefensiveSpell && attackRoll) {
                debug2.log(`  \u{1F6E1}\uFE0F Defensive spell detected - removing attack roll`);
                attackRoll = "";
              } else {
                debug2.log(`  \u2139\uFE0F Attack roll already set from child properties, skipping description check`);
              }
              if (!damage) {
                const damagePattern = /(\d+d\d+(?:\s*\+\s*\d+)?)\s+(\w+)\s+damage/i;
                const damageMatch = description.match(damagePattern);
                if (damageMatch) {
                  damage = damageMatch[1].replace(/\s/g, "");
                  damageType = damageMatch[2];
                  debug2.log(`  \u{1F4A1} Found damage in description: ${damage} ${damageType}`);
                }
              }
            }
            let cleanRange = prop.range || "";
            if (cleanRange && cleanRange.toLowerCase().includes("spellsniper")) {
              debug2.log(`  \u{1F50D} Cleaning spellSniper from range: "${cleanRange}"`);
              let match = cleanRange.match(/\{(\d+)\s*\*\s*\([^)]*spellSniper[^)]*\)\}/i);
              if (match) {
                const baseValue = match[1];
                const afterMatch = cleanRange.substring(match.index + match[0].length).trim();
                cleanRange = `${baseValue} ${afterMatch}`.trim();
                debug2.log(`  \u2705 Extracted base range (pattern 1): "${cleanRange}"`);
              } else {
                match = cleanRange.match(/\{(\d+)[^}]*spellSniper[^}]*\}/i);
                if (match) {
                  const baseValue = match[1];
                  const afterMatch = cleanRange.substring(match.index + match[0].length).trim();
                  cleanRange = `${baseValue} ${afterMatch}`.trim();
                  debug2.log(`  \u2705 Extracted base range (pattern 2): "${cleanRange}"`);
                } else {
                  cleanRange = cleanRange.replace(/\{[^}]*spellSniper[^}]*\}/gi, "").trim();
                  debug2.log(`  \u2705 Removed spellSniper expression (fallback): "${cleanRange}"`);
                }
              }
            }
            const processedOrGroups = /* @__PURE__ */ new Set();
            damageRolls.forEach((roll2, index) => {
              if (processedOrGroups.has(index))
                return;
              const similarRolls = [];
              for (let i = index + 1; i < damageRolls.length; i++) {
                if (processedOrGroups.has(i))
                  continue;
                if (damageRolls[i].damage === roll2.damage && damageRolls[i].damageType !== roll2.damageType) {
                  similarRolls.push(i);
                }
              }
              if (similarRolls.length > 0) {
                const orGroupId = `or_group_${index}`;
                roll2.orGroup = orGroupId;
                roll2.orChoices = [
                  { damageType: roll2.damageType },
                  ...similarRolls.map((i) => ({ damageType: damageRolls[i].damageType }))
                ];
                similarRolls.forEach((i) => {
                  processedOrGroups.add(i);
                  damageRolls[i].orGroup = orGroupId;
                  damageRolls[i].isOrGroupMember = true;
                });
                debug2.log(`\u{1F500} Detected OR condition in "${prop.name}": ${roll2.damage} with types: ${roll2.orChoices.map((c) => c.damageType).join(" OR ")}`);
              }
            });
            let isLifesteal = false;
            const knownLifestealSpells = ["vampiric touch", "life transference", "absorb elements"];
            const isKnownLifesteal = prop.name && knownLifestealSpells.some(
              (name) => prop.name.toLowerCase().includes(name)
            );
            if (isKnownLifesteal) {
              isLifesteal = true;
              debug2.log(`\u{1F489} Detected lifesteal mechanic in "${prop.name}" (known lifesteal spell)`);
              const hasDamage = damageRolls.some((r) => r.damageType && r.damageType.toLowerCase() !== "healing" && r.damageType.toLowerCase() !== "temphp");
              const hasHealing = damageRolls.some((r) => r.damageType && r.damageType.toLowerCase() === "healing");
              if (hasDamage && !hasHealing) {
                debug2.log(`  \u{1F489} Adding synthetic healing roll for lifesteal spell "${prop.name}"`);
                const damageRoll = damageRolls.find((r) => r.damageType && r.damageType.toLowerCase() !== "healing" && r.damageType.toLowerCase() !== "temphp");
                if (damageRoll) {
                  const lowerDesc2 = fullDescription.toLowerCase();
                  const isHalfHealing = lowerDesc2.includes("half") && (lowerDesc2.includes("regain") || lowerDesc2.includes("heal"));
                  const healingFormula = isHalfHealing ? `(${damageRoll.damage}) / 2` : damageRoll.damage;
                  damageRolls.push({
                    damage: healingFormula,
                    damageType: "healing"
                  });
                  debug2.log(`  \u2705 Added healing roll: ${healingFormula}`);
                }
              }
            } else if (damageRolls.length >= 2) {
              const hasDamage = damageRolls.some((r) => r.damageType && r.damageType.toLowerCase() !== "healing");
              const hasHealing = damageRolls.some((r) => r.damageType && r.damageType.toLowerCase() === "healing");
              if (hasDamage && hasHealing) {
                const lowerDesc2 = fullDescription.toLowerCase();
                const lifesteaIndicators = [
                  "regain hit points equal to",
                  "regain a number of hit points equal to",
                  "regain hit points equal to half",
                  "heal for half the damage",
                  "regains hit points equal to",
                  "gain temporary hit points equal to",
                  "gain hit points equal to",
                  "equal to half the",
                  "equal to half of the",
                  "half the amount of",
                  "half of the",
                  // Vampiric Touch specific patterns
                  "you regain hit points",
                  "regain hp equal to",
                  "hp equal to half"
                ];
                isLifesteal = lifesteaIndicators.some(
                  (indicator) => lowerDesc2.includes(indicator) && (lowerDesc2.includes("damage") || lowerDesc2.includes("necrotic") || lowerDesc2.includes("dealt"))
                );
                if (isLifesteal) {
                  debug2.log(`\u{1F489} Detected lifesteal mechanic in "${prop.name}"`);
                } else {
                  debug2.log(`\u{1F50D} Not lifesteal: "${prop.name}" - has damage and healing but description doesn't match patterns`);
                  debug2.log(`    Description snippet: ${lowerDesc2.substring(0, 200)}`);
                }
              }
            }
            const finalSpellNameLower = (prop.name || "").toLowerCase();
            const isFinalDefensiveSpell = finalSpellNameLower === "shield" || finalSpellNameLower.startsWith("shield ") || finalSpellNameLower === "absorb elements" || finalSpellNameLower === "counterspell";
            if (isFinalDefensiveSpell && attackRoll) {
              debug2.log(`  \u{1F6E1}\uFE0F Defensive spell detected - removing attack roll (was: "${attackRoll}")`);
              attackRoll = "";
            }
            const knownAttackSpells = ["guiding bolt", "scorching ray", "eldritch blast", "fire bolt", "ray of frost", "chromatic orb"];
            const isKnownAttackSpell = prop.name && knownAttackSpells.some(
              (name) => prop.name.toLowerCase().includes(name)
            );
            if (isKnownAttackSpell && !attackRoll) {
              attackRoll = "use_spell_attack_bonus";
              debug2.log(`  \u2694\uFE0F Known attack spell "${prop.name}" missing attack roll - adding it`);
            }
            const knownCantripDamage = {
              "eldritch blast": { damage: "1d10", damageType: "force" },
              "fire bolt": { damage: "1d10", damageType: "fire" },
              "ray of frost": { damage: "1d8", damageType: "cold" },
              "chill touch": { damage: "1d8", damageType: "necrotic" },
              "sacred flame": { damage: "1d8", damageType: "radiant" },
              "toll the dead": { damage: "1d8", damageType: "necrotic" },
              "produce flame": { damage: "1d8", damageType: "fire" },
              "thorn whip": { damage: "1d6", damageType: "piercing" },
              "shocking grasp": { damage: "1d8", damageType: "lightning" },
              "acid splash": { damage: "1d6", damageType: "acid" },
              "poison spray": { damage: "1d12", damageType: "poison" },
              "frostbite": { damage: "1d6", damageType: "cold" },
              "infestation": { damage: "1d6", damageType: "poison" },
              "mind sliver": { damage: "1d6", damageType: "psychic" },
              "word of radiance": { damage: "1d6", damageType: "radiant" },
              "create bonfire": { damage: "1d8", damageType: "fire" },
              "thunderclap": { damage: "1d6", damageType: "thunder" },
              "primal savagery": { damage: "1d10", damageType: "acid" },
              "sapping sting": { damage: "1d4", damageType: "necrotic" }
            };
            if (damageRolls.length === 0 && prop.name) {
              const lowerName = prop.name.toLowerCase();
              for (const [cantripName, damageInfo] of Object.entries(knownCantripDamage)) {
                if (lowerName.includes(cantripName)) {
                  damageRolls.push({
                    damage: damageInfo.damage,
                    damageType: damageInfo.damageType
                  });
                  debug2.log(`  \u2705 Added default cantrip damage for "${prop.name}": ${damageInfo.damage} ${damageInfo.damageType}`);
                  break;
                }
              }
            }
            const isMeldIntoStone = prop.name && prop.name.toLowerCase().includes("meld into stone");
            if (isMeldIntoStone && damageRolls.length === 0) {
              debug2.log(`  \u{1FAA8} Meld into Stone detected - extracting conditional damage from description`);
              const damagePattern = /(\d+d\d+)(?:\s+\w+)?\s+damage/i;
              const match = fullDescription.match(damagePattern);
              if (match) {
                const formula = match[1];
                damageRolls.push({
                  damage: formula,
                  damageType: "bludgeoning"
                });
                debug2.log(`  \u2705 Added conditional damage for Meld into Stone: ${formula} bludgeoning`);
              }
            }
            if (attackRoll || damageRolls.length > 0) {
              debug2.log(`\u{1F4CA} Spell "${prop.name}" final values:`, {
                attackRoll: attackRoll || "(none)",
                damageRolls: damageRolls.length > 0 ? damageRolls : "(none)",
                isLifesteal,
                hasSummary: !!summary,
                hasDescription: !!description,
                fullDescriptionSnippet: fullDescription ? fullDescription.substring(0, 100) : ""
              });
            }
            characterData2.spells.push({
              name: prop.name || "Unnamed Spell",
              level: prop.level || 0,
              school: prop.school || "",
              castingTime: prop.castingTime || "",
              range: cleanRange,
              components: prop.components || "",
              duration: prop.duration || "",
              summary,
              // Preserve summary separately
              description,
              // Preserve description separately
              fullDescription,
              // Keep combined version for backward compatibility
              prepared: prop.prepared || false,
              source,
              concentration: prop.concentration || false,
              ritual: prop.ritual || false,
              attackRoll,
              damage,
              // First damage for backward compatibility
              damageType,
              // First damageType for backward compatibility
              damageRolls,
              // Array of all damage/healing rolls
              isLifesteal,
              // Flag for lifesteal mechanics
              resources: prop.resources || null,
              // Store resource consumption data
              castWithoutSpellSlots: prop.castWithoutSpellSlots || false
              // DiceCloud "doesn't require spell slot" toggle
            });
            break;
          case "item":
          case "equipment":
          case "container":
            let itemDescription = "";
            if (prop.description) {
              if (typeof prop.description === "string") {
                itemDescription = prop.description;
              } else if (typeof prop.description === "object") {
                itemDescription = prop.description.text || prop.description.value || "";
              }
            }
            itemDescription = stripConditionalExpressions(itemDescription);
            characterData2.inventory.push({
              _id: prop._id || null,
              name: prop.name || "Unnamed Item",
              plural: prop.plural || null,
              quantity: prop.quantity || 1,
              weight: prop.weight || 0,
              value: prop.value || 0,
              // Gold piece value
              description: itemDescription,
              equipped: prop.equipped || false,
              requiresAttunement: prop.requiresAttunement || false,
              attuned: prop.attuned || false,
              icon: prop.icon || null,
              // { name, shape, color }
              tags: prop.tags || [],
              parent: prop.parent || null,
              type: prop.type || "item",
              // Track if it's a container
              showIncrement: prop.showIncrement !== false
              // Default true
            });
            break;
          case "proficiency":
            characterData2.proficiencies.push({
              name: prop.name || "",
              type: prop.proficiencyType || "other"
            });
            break;
          case "action":
            if (prop.name && !prop.inactive && !prop.disabled) {
              let summary2 = "";
              if (prop.summary) {
                if (typeof prop.summary === "string") {
                  summary2 = prop.summary;
                } else if (typeof prop.summary === "object") {
                  summary2 = prop.summary.text || prop.summary.value || "";
                }
              }
              let description2 = "";
              if (prop.description) {
                if (typeof prop.description === "string") {
                  description2 = prop.description;
                } else if (typeof prop.description === "object") {
                  description2 = prop.description.text || prop.description.value || "";
                }
              }
              if (!description2 && summary2) {
                description2 = summary2;
              }
              if (prop.name === "Convert Sorcery Points to Spell Slot") {
                if (prop.ancestors && Array.isArray(prop.ancestors)) {
                  for (const ancestor of prop.ancestors) {
                    const ancestorId = typeof ancestor === "object" ? ancestor.id : ancestor;
                    const ancestorProp = properties.find((p) => p._id === ancestorId);
                    if (ancestorProp && ancestorProp.name === "Font of Magic") {
                      if (ancestorProp.summary) {
                        description2 = typeof ancestorProp.summary === "string" ? ancestorProp.summary : ancestorProp.summary.text || ancestorProp.summary.value || "";
                      } else if (ancestorProp.description) {
                        description2 = typeof ancestorProp.description === "string" ? ancestorProp.description : ancestorProp.description.text || ancestorProp.description.value || "";
                      }
                      break;
                    }
                  }
                }
              }
              let attackRoll2 = "";
              if (prop.attackRoll) {
                if (typeof prop.attackRoll === "string") {
                  attackRoll2 = prop.attackRoll;
                } else if (typeof prop.attackRoll === "object" && prop.attackRoll.value !== void 0) {
                  const bonus = prop.attackRoll.value;
                  attackRoll2 = bonus >= 0 ? `1d20+${bonus}` : `1d20${bonus}`;
                } else if (typeof prop.attackRoll === "number") {
                  const bonus = prop.attackRoll;
                  attackRoll2 = bonus >= 0 ? `1d20+${bonus}` : `1d20${bonus}`;
                }
              }
              const damageProperties = properties.filter((p) => {
                if (p.type !== "damage")
                  return false;
                if (p.ancestors && Array.isArray(p.ancestors)) {
                  return p.ancestors.some((ancestor) => ancestor.id === prop._id);
                }
                return p.parent && p.parent.id === prop._id;
              });
              let damage2 = "";
              let damageType2 = "";
              let damageComponents = [];
              if (damageProperties.length > 0) {
                for (const damageProp of damageProperties) {
                  let damageFormula = "";
                  if (damageProp.amount) {
                    if (typeof damageProp.amount === "string") {
                      damageFormula = damageProp.amount;
                    } else if (typeof damageProp.amount === "object") {
                      damageFormula = damageProp.amount.value || damageProp.amount.calculation || damageProp.amount.text || "";
                      if (damageProp.amount.effects && Array.isArray(damageProp.amount.effects)) {
                        for (const effect of damageProp.amount.effects) {
                          if (effect.operation === "add" && effect.amount) {
                            if (effect.amount.calculation) {
                              debug2.log(`\u23ED\uFE0F Skipping dice formula effect in weapon damage: ${effect.amount.calculation} (handled by separate action)`);
                              continue;
                            }
                            if (effect.amount.value !== void 0) {
                              const modifier = effect.amount.value;
                              if (modifier !== 0) {
                                damageFormula += modifier >= 0 ? `+${modifier}` : `${modifier}`;
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                  if (damageFormula) {
                    damageComponents.push({
                      formula: damageFormula,
                      type: damageProp.damageType || ""
                    });
                  }
                }
                if (damageComponents.length > 0) {
                  damage2 = damageComponents.map((d) => d.formula).join("+");
                  const types = damageComponents.map((d) => d.type).filter((t) => t);
                  damageType2 = types.length > 0 ? types.join(" + ") : "";
                }
              }
              const metamagicNames = [
                "Careful Spell",
                "Distant Spell",
                "Empowered Spell",
                "Extended Spell",
                "Heightened Spell",
                "Quickened Spell",
                "Subtle Spell",
                "Twinned Spell"
              ];
              const isMetamagic = metamagicNames.some(
                (name) => name.toLowerCase() === prop.name.toLowerCase()
              );
              if (isMetamagic) {
                const metamagicFeature = {
                  name: prop.name,
                  description: description2,
                  uses: prop.uses
                };
                characterData2.features.push(metamagicFeature);
                debug2.log(`\u{1F52E} Added metamagic action to features: ${prop.name}`);
              }
              const validActionTypes = ["action", "bonus", "reaction", "free", "legendary", "lair", "other"];
              const hasValidActionType = prop.actionType && validActionTypes.includes(prop.actionType.toLowerCase());
              if (!isMetamagic && (attackRoll2 || hasValidActionType)) {
                const action = {
                  _id: prop._id,
                  // Include DiceCloud property ID for syncing
                  name: prop.name,
                  actionType: prop.actionType || (attackRoll2 ? "action" : "other"),
                  // Attacks default to 'action'
                  attackRoll: attackRoll2,
                  damage: damage2,
                  damageType: damageType2,
                  summary: summary2,
                  // Preserve summary separately
                  description: description2,
                  // Preserve description separately
                  uses: prop.uses || null,
                  usesUsed: prop.usesUsed || 0,
                  usesLeft: prop.usesLeft,
                  // DiceCloud's computed uses remaining field
                  resources: prop.resources || null
                  // Store DiceCloud's structured resource consumption data
                };
                characterData2.actions.push(action);
                if (attackRoll2) {
                  debug2.log(`\u2694\uFE0F Added attack action: ${action.name} (attack: ${attackRoll2}, damage: ${damage2} ${damageType2})`);
                } else {
                  debug2.log(`\u2728 Added non-attack action: ${action.name} (${prop.actionType || "other"})`);
                }
              }
            } else if (prop.inactive || prop.disabled) {
              debug2.log(`\u23ED\uFE0F Skipped action: ${prop.name} (inactive: ${!!prop.inactive}, disabled: ${!!prop.disabled})`);
            }
            break;
          case "attribute":
            if (prop.name && (prop.attributeType === "resource" || prop.attributeType === "healthBar") && !prop.inactive && !prop.disabled) {
              debug2.log(`\u{1F50D} Potential resource found: ${prop.name} (type: ${prop.attributeType}, variable: ${prop.variableName || "none"})`);
              const lowerName = prop.name.toLowerCase();
              if (lowerName.includes("slot level to create")) {
                debug2.log(`\u23ED\uFE0F Skipping filtered resource: ${prop.name}`);
                break;
              }
              const extractNumericValue = (val, depth = 0) => {
                if (depth > 5)
                  return 0;
                if (typeof val === "number")
                  return val;
                if (typeof val === "string") {
                  const parsed = parseFloat(val);
                  return isNaN(parsed) ? 0 : parsed;
                }
                if (typeof val === "object" && val !== null) {
                  if (val.value !== void 0) {
                    const extracted = extractNumericValue(val.value, depth + 1);
                    if (extracted !== 0)
                      return extracted;
                  }
                  if (val.total !== void 0) {
                    const extracted = extractNumericValue(val.total, depth + 1);
                    if (extracted !== 0)
                      return extracted;
                  }
                  if (val.calculation !== void 0) {
                    const parsed = parseFloat(val.calculation);
                    if (!isNaN(parsed) && parsed !== 0)
                      return parsed;
                  }
                  if (val.text !== void 0) {
                    const parsed = parseFloat(val.text);
                    if (!isNaN(parsed) && parsed !== 0)
                      return parsed;
                  }
                  return 0;
                }
                return 0;
              };
              let currentValue = extractNumericValue(prop.value);
              if (currentValue === 0 && prop.damage !== void 0) {
                currentValue = extractNumericValue(prop.damage);
              }
              let maxValue = extractNumericValue(prop.baseValue);
              if (maxValue === 0 && prop.total !== void 0) {
                maxValue = extractNumericValue(prop.total);
              }
              const resource = {
                name: prop.name,
                variableName: prop.variableName || "",
                current: currentValue,
                max: maxValue,
                description: prop.description || ""
              };
              const damageValue = extractNumericValue(prop.damage);
              const baseValue = extractNumericValue(prop.baseValue);
              if (damageValue > 0 && baseValue > 0) {
                resource.current = Math.max(0, baseValue - damageValue);
              }
              const resourceKey = (prop.variableName || prop.name).toLowerCase();
              if (resource.max <= 0) {
                debug2.log(`  \u23ED\uFE0F  Skipping utility resource (max=0): ${resource.name}`);
                break;
              }
              if (!uniqueResources.has(resourceKey)) {
                uniqueResources.add(resourceKey);
                characterData2.resources.push(resource);
                debug2.log(`\u{1F48E} Added resource: ${resource.name} (${resource.current}/${resource.max})`);
              } else {
                debug2.log(`  \u23ED\uFE0F  Skipping duplicate resource: ${resource.name}`);
              }
            }
            break;
        }
      });
      debug2.log("\u{1F50D} All property types found in character:", Array.from(propertyTypes).sort());
      extractCompanions(characterData2, apiData);
      debug2.log("\u{1F50D} DEBUG: Checking for companions");
      debug2.log(
        "\u{1F4CA} Properties with type=creature:",
        apiData.creatureProperties.filter((p) => p.type === "creature").map((p) => ({
          name: p.name,
          type: p.type,
          tags: p.tags
        }))
      );
      debug2.log(
        '\u{1F4CA} Features with "companion" in name:',
        characterData2.features.filter((f) => /companion|beast/i.test(f.name)).map((f) => f.name)
      );
      if (racePropertyId && raceName) {
        debug2.log("\u{1F50D} Looking for subrace children of race property ID:", racePropertyId);
        const subraceProps = apiData.creatureProperties.filter((prop) => {
          const isChild = prop.parent && prop.parent.id === racePropertyId;
          const hasSubraceTag = prop.tags && Array.isArray(prop.tags) && prop.tags.some(
            (tag) => tag.toLowerCase().includes("subrace")
          );
          const isFolder = prop.type === "folder";
          if (isChild) {
            debug2.log("\u{1F50D} Found child of race:", {
              name: prop.name,
              type: prop.type,
              tags: prop.tags,
              hasSubraceTag,
              isFolder
            });
          }
          return isChild && hasSubraceTag && isFolder;
        });
        if (subraceProps.length > 0) {
          const subraceProp = subraceProps[0];
          debug2.log("\u{1F50D} Found subrace child property:", subraceProp.name, "with tags:", subraceProp.tags);
          characterData2.race = `${raceName} - ${subraceProp.name}`;
          debug2.log("\u{1F50D} Combined race with subrace:", characterData2.race);
        } else {
          debug2.log("\u{1F50D} No subrace children found for race");
        }
      }
      if (!raceFound && !characterData2.race) {
        debug2.log("\u{1F50D} Race not found in properties, checking otherVariables...");
        const raceVars = Object.keys(characterData2.otherVariables).filter(
          (key) => key.toLowerCase().includes("race") || key.toLowerCase().includes("species")
        );
        if (raceVars.length > 0) {
          const formatRaceName = (name) => {
            if (!name)
              return null;
            if (name.toLowerCase() === "custom" || name.toLowerCase() === "customlineage") {
              return "Custom Lineage";
            }
            let formatted = name.replace(/([a-z])([A-Z])/g, "$1 $2");
            formatted = formatted.split(" ").map(
              (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(" ");
            return formatted;
          };
          const extractRaceFromVarName = (varName) => {
            const raceName3 = varName.replace(/race$/i, "").replace(/^race$/i, "");
            if (raceName3 && raceName3 !== varName.toLowerCase()) {
              return raceName3.charAt(0).toUpperCase() + raceName3.slice(1);
            }
            return null;
          };
          let raceName2 = null;
          let suberaceName = null;
          const subRaceVar = raceVars.find((key) => key.toLowerCase() === "subrace");
          if (subRaceVar) {
            const subRaceValue = characterData2.otherVariables[subRaceVar];
            debug2.log(`\u{1F50D} DEBUG: subRace value:`, subRaceValue, `type:`, typeof subRaceValue);
            if (typeof subRaceValue === "object" && subRaceValue !== null) {
              debug2.log(`\u{1F50D} DEBUG: subRace object keys:`, Object.keys(subRaceValue));
              if (subRaceValue.name) {
                suberaceName = formatRaceName(subRaceValue.name);
                debug2.log(`\u{1F50D} Found subrace name: ${suberaceName}`);
              } else if (subRaceValue.text) {
                suberaceName = formatRaceName(subRaceValue.text);
                debug2.log(`\u{1F50D} Found subrace text: ${suberaceName}`);
              } else if (subRaceValue.value) {
                suberaceName = formatRaceName(subRaceValue.value);
                debug2.log(`\u{1F50D} Found subrace value: ${suberaceName}`);
              }
            } else if (typeof subRaceValue === "string") {
              suberaceName = formatRaceName(subRaceValue);
              debug2.log(`\u{1F50D} Found subrace string: ${suberaceName}`);
            }
          }
          const raceVar = raceVars.find((key) => key.toLowerCase() === "race");
          if (raceVar) {
            const raceValue = characterData2.otherVariables[raceVar];
            debug2.log(`\u{1F50D} DEBUG: race value:`, raceValue, `type:`, typeof raceValue);
            if (typeof raceValue === "object" && raceValue !== null) {
              debug2.log(`\u{1F50D} DEBUG: race object keys:`, Object.keys(raceValue));
              if (raceValue.name) {
                raceName2 = formatRaceName(raceValue.name);
                debug2.log(`\u{1F50D} Found race name: ${raceName2}`);
              } else if (raceValue.text) {
                raceName2 = formatRaceName(raceValue.text);
                debug2.log(`\u{1F50D} Found race text: ${raceName2}`);
              } else if (raceValue.value) {
                raceName2 = formatRaceName(raceValue.value);
                debug2.log(`\u{1F50D} Found race value: ${raceName2}`);
              }
            } else if (typeof raceValue === "string") {
              raceName2 = formatRaceName(raceValue);
              debug2.log(`\u{1F50D} Found race string: ${raceName2}`);
            }
          }
          if (!raceName2) {
            for (const varName of raceVars) {
              const varValue = characterData2.otherVariables[varName];
              if (typeof varValue === "object" && varValue !== null && varValue.value === true) {
                const extracted = extractRaceFromVarName(varName);
                if (extracted) {
                  raceName2 = extracted;
                  debug2.log(`\u{1F50D} Extracted race from variable name: ${varName} -> ${raceName2}`);
                  break;
                }
              }
            }
          }
          if (raceName2 && suberaceName) {
            characterData2.race = `${raceName2} - ${suberaceName}`;
            debug2.log(`\u{1F50D} Combined race and subrace: ${characterData2.race}`);
          } else if (suberaceName) {
            characterData2.race = suberaceName;
            debug2.log(`\u{1F50D} Using subrace as race: ${characterData2.race}`);
          } else if (raceName2) {
            characterData2.race = raceName2;
            debug2.log(`\u{1F50D} Using race: ${characterData2.race}`);
          } else {
            debug2.log("\u{1F50D} Could not determine race from variables:", raceVars);
          }
        } else {
          debug2.log("\u{1F50D} No race found in otherVariables either");
        }
      }
      if (characterData2.resources && characterData2.resources.length > 0) {
        debug2.log(`\u{1F50D} Found ${characterData2.resources.length} resources:`, characterData2.resources.map((r) => r.name));
        const hpResource = characterData2.resources.find(
          (r) => r.name.toLowerCase().includes("hit points") || r.name.toLowerCase() === "hp" || r.variableName?.toLowerCase() === "hitpoints"
        );
        const tempHpResource = characterData2.resources.find(
          (r) => r.name.toLowerCase().includes("temporary hit points") || r.name.toLowerCase().includes("temp hp") || r.variableName?.toLowerCase() === "temphitpoints"
        );
        debug2.log(`\u{1F50D} HP resource found: ${hpResource ? hpResource.name : "none"}`);
        debug2.log(`\u{1F50D} Temp HP resource found: ${tempHpResource ? tempHpResource.name : "none"}`);
        if (hpResource) {
          characterData2.hitPoints = {
            current: hpResource.current,
            max: hpResource.max
          };
          debug2.log(`\u{1F49A} Mapped HP resource: ${hpResource.name} (${hpResource.current}/${hpResource.max})`);
        }
        if (tempHpResource) {
          characterData2.temporaryHP = tempHpResource.current;
          debug2.log(`\u{1F499} Mapped Temp HP resource: ${tempHpResource.name} (${tempHpResource.current})`);
        }
      } else {
        debug2.log("\u{1F50D} No resources found in character data");
      }
      debug2.log("Parsed character data:", characterData2);
      return characterData2;
    }
    function extractCompanions(characterData2, apiData) {
      debug2.log("\u{1F43E}\u{1F43E}\u{1F43E} extractCompanions FUNCTION STARTED \u{1F43E}\u{1F43E}\u{1F43E}");
      debug2.log("\u{1F43E} Searching for companion creatures in features...");
      const companionPatterns = [
        /companion/i,
        /beast of/i,
        /familiar/i,
        /summon/i,
        /mount/i,
        /steel defender/i,
        /homunculus/i,
        /drake/i,
        /drake warden/i,
        /primal companion/i,
        /beast master/i,
        /ranger's companion/i
      ];
      debug2.log("\u{1F43E} Total features to check:", characterData2.features.length);
      characterData2.features.forEach((feature, index) => {
        const isCompanion = companionPatterns.some((pattern) => pattern.test(feature.name));
        if (isCompanion) {
          debug2.log(`\u{1F43E} Found potential companion: ${feature.name} (index ${index})`);
          debug2.log(`\u{1F50D} DEBUG: Feature object keys:`, Object.keys(feature));
          debug2.log(`\u{1F50D} DEBUG: Has description:`, !!feature.description);
          debug2.log(`\u{1F50D} DEBUG: Description value:`, feature.description);
          if (feature.description) {
            debug2.log(`\u{1F50D} DEBUG: Companion description:`, feature.description);
            const companion = parseCompanionStatBlock(feature.name, feature.description);
            if (companion) {
              characterData2.companions.push(companion);
              debug2.log(`\u2705 Added companion: ${companion.name}`);
            } else {
              debug2.log(`\u274C Failed to parse companion: ${feature.name} - no valid stat block found`);
            }
          } else {
            debug2.log(`\u26A0\uFE0F Companion ${feature.name} has no description - skipping (no stat block)`);
          }
        }
      });
      debug2.log(`\u{1F43E} Total companions found: ${characterData2.companions.length}`);
    }
    function parseCompanionStatBlock(name, description) {
      let descText = description;
      if (typeof description === "object" && description !== null) {
        descText = description.value || description.text || "";
      } else if (typeof description !== "string") {
        debug2.log(`\u26A0\uFE0F Companion "${name}" has invalid description type:`, typeof description);
        return null;
      }
      if (!descText || descText.trim() === "") {
        debug2.log(`\u26A0\uFE0F Companion "${name}" has empty description`);
        return null;
      }
      debug2.log(`\u{1F50D} DEBUG: Parsing companion "${name}" with description:`, descText);
      const companion = {
        name,
        size: "",
        type: "",
        alignment: "",
        ac: 0,
        hp: "",
        speed: "",
        abilities: {},
        senses: "",
        languages: "",
        proficiencyBonus: 0,
        features: [],
        actions: [],
        rawDescription: descText
      };
      const sizeTypeMatch = descText.match(/(Tiny|Small|Medium|Large|Huge|Gargantuan)\s+(\w+),\s*(\w+)/i);
      if (sizeTypeMatch) {
        companion.size = sizeTypeMatch[1];
        companion.type = sizeTypeMatch[2];
        companion.alignment = sizeTypeMatch[3];
        debug2.log(`\u2705 Parsed size/type: ${companion.size} ${companion.type}, ${companion.alignment}`);
      }
      const acPatterns = [
        /\*\*AC\*\*\s+(\d+)/i,
        /\*\*Armor Class\*\*\s+\*\*(\d+)\*\*/i,
        /AC\s+(\d+)/i,
        /Armor Class\s+(\d+)/i
      ];
      for (const pattern of acPatterns) {
        const acMatch = descText.match(pattern);
        if (acMatch) {
          companion.ac = parseInt(acMatch[1]);
          debug2.log(`\u2705 Parsed AC: ${companion.ac}`);
          break;
        }
      }
      const hpPatterns = [
        /\*\*HP\*\*\s+(\d+\s*\([^)]+\))/i,
        /\*\*Hit Points\*\*\s+\*\*(\d+\s*\([^)]+\))\*\*/i,
        /\*\*Hit Points\*\*\s+(\d+\s*\([^)]+\))/i,
        /HP\s+(\d+\s*\([^)]+\))/i,
        /Hit Points\s+(\d+\s*\([^)]+\))/i
      ];
      for (const pattern of hpPatterns) {
        const hpMatch = descText.match(pattern);
        if (hpMatch) {
          companion.hp = hpMatch[1];
          debug2.log(`\u2705 Parsed HP: ${companion.hp}`);
          break;
        }
      }
      const speedPatterns = [
        /Speed\s+([^•\n]+)/i,
        /\*\*Speed\*\*\s+([^•\n]+)/i
      ];
      for (const pattern of speedPatterns) {
        const speedMatch = descText.match(pattern);
        if (speedMatch) {
          companion.speed = speedMatch[1].trim();
          debug2.log(`\u2705 Parsed Speed: ${companion.speed}`);
          break;
        }
      }
      const abilities = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
      const lines = descText.split("\n");
      let abilityLine = null;
      debug2.log(`\u{1F50D} DEBUG: Checking ${lines.length} lines for ability table`);
      for (const line of lines) {
        if (line.match(/^>?\s*\|\s*\d+\s*\([+\-]\d+\)\s*\|\s*\d+\s*\([+\-]\d+\)\s*\|\s*\d+\s*\([+\-]\d+\)\s*\|\s*\d+\s*\([+\-]\d+\)\s*\|\s*\d+\s*\([+\-]\d+\)\s*\|\s*\d+\s*\([+\-]\d+\)\s*\|/)) {
          abilityLine = line;
          debug2.log(`\u{1F50D} DEBUG: Found matching ability line`);
        }
      }
      if (abilityLine) {
        debug2.log(`\u{1F50D} Found ability line: ${abilityLine}`);
        const cleanLine = abilityLine.replace(/^>\|/, "");
        const abilityValues = cleanLine.split("|").filter((val) => val.trim());
        debug2.log(`\u{1F50D} Split ability values:`, abilityValues);
        if (abilityValues.length >= 6) {
          const abilityScores = abilityValues.slice(-6);
          debug2.log(`\u{1F50D} Using ability scores:`, abilityScores);
          abilities.forEach((ability, index) => {
            if (index < abilityScores.length) {
              const abilityText = abilityScores[index].trim();
              debug2.log(`\u{1F50D} DEBUG: Processing ${ability} with text: "${abilityText}"`);
              const abilityMatch = abilityText.match(/(\d+)\s*\(([+\-]\d+)\)/);
              debug2.log(`\u{1F50D} DEBUG: ${ability} regex result:`, abilityMatch);
              if (abilityMatch) {
                companion.abilities[ability.toLowerCase()] = {
                  score: parseInt(abilityMatch[1]),
                  modifier: parseInt(abilityMatch[2])
                };
                debug2.log(`\u2705 Parsed ${ability}: ${abilityMatch[1]} (${abilityMatch[2]})`);
              } else {
                debug2.log(`\u274C Failed to parse ${ability} from "${abilityText}"`);
              }
            }
          });
        } else {
          debug2.log(`\u274C Not enough ability values found. Found ${abilityValues.length} values`);
        }
      } else {
        debug2.log(`\u274C No ability line found, trying fallback`);
        abilities.forEach((ability) => {
          const regex = new RegExp(ability + "\\s+(\\d+)\\s*\\(([+\\-]\\d+)\\)", "i");
          const match = descText.match(regex);
          if (match) {
            companion.abilities[ability.toLowerCase()] = {
              score: parseInt(match[1]),
              modifier: parseInt(match[2])
            };
            debug2.log(`\u2705 Parsed ${ability}: ${match[1]} (${match[2]})`);
          }
        });
      }
      const sensesPatterns = [
        /Senses\s+([^•\n]+)/i,
        /\*\*Senses\*\*\s+([^•\n]+)/i
      ];
      for (const pattern of sensesPatterns) {
        const sensesMatch = descText.match(pattern);
        if (sensesMatch) {
          companion.senses = sensesMatch[1].trim();
          debug2.log(`\u2705 Parsed Senses: ${companion.senses}`);
          break;
        }
      }
      const languagesPatterns = [
        /Languages\s+([^•\n]+)/i,
        /\*\*Languages\*\*\s+([^•\n]+)/i
      ];
      for (const pattern of languagesPatterns) {
        const languagesMatch = descText.match(pattern);
        if (languagesMatch) {
          companion.languages = languagesMatch[1].trim();
          debug2.log(`\u2705 Parsed Languages: ${companion.languages}`);
          break;
        }
      }
      const pbPatterns = [
        /Proficiency Bonus\s+(\d+)/i,
        /\*\*Proficiency Bonus\*\*\s+(\d+)/i
      ];
      for (const pattern of pbPatterns) {
        const pbMatch = descText.match(pattern);
        if (pbMatch) {
          companion.proficiencyBonus = parseInt(pbMatch[1]);
          debug2.log(`\u2705 Parsed Proficiency Bonus: ${companion.proficiencyBonus}`);
          break;
        }
      }
      const featurePattern = /\*\*\*([^*\n.]+)\.\*\*\*\s*([^*\n]+)/gi;
      let featureMatch;
      while ((featureMatch = featurePattern.exec(descText)) !== null) {
        companion.features.push({
          name: featureMatch[1].trim(),
          description: featureMatch[2].trim()
        });
        debug2.log(`\u2705 Parsed Feature: ${featureMatch[1].trim()}`);
      }
      const actionsMatch = descText.match(/###?\s*Actions\s+([\s\S]+)/i);
      if (actionsMatch) {
        const actionsText = actionsMatch[1];
        debug2.log(`\u{1F50D} DEBUG: Found actions section:`, actionsText);
        const attackLines = actionsText.split("\n").filter((line) => line.includes("***") && line.includes("Melee Weapon Attack"));
        attackLines.forEach((attackLine) => {
          debug2.log(`\u{1F50D} DEBUG: Processing attack line:`, attackLine);
          const nameMatch = attackLine.match(/\*\*\*(\w+)\.\*\*\*/);
          const bonusMatch = attackLine.match(/\*\*(\+\d+)\*\*/);
          const reachMatch = attackLine.match(/reach\s*([\d\s]+ft\.)/);
          let damageMatch = attackLine.match(/\*?Hit:\*?\s*\*\*([^*]+?)\*\*/);
          debug2.log(`\u{1F50D} DEBUG: Damage pattern 1 result:`, damageMatch);
          if (!damageMatch) {
            damageMatch = attackLine.match(/\*?Hit:\*?\s*\*\*([^*]+?)(?:\s+[a-z]+|$)/i);
            debug2.log(`\u{1F50D} DEBUG: Damage pattern 2 result:`, damageMatch);
          }
          if (!damageMatch) {
            damageMatch = attackLine.match(/\*?Hit:\*?\s*\*\*([^*]+)/);
            debug2.log(`\u{1F50D} DEBUG: Damage pattern 3 result:`, damageMatch);
          }
          debug2.log(`\u{1F50D} DEBUG: Final damage match:`, damageMatch);
          if (nameMatch && bonusMatch && reachMatch && damageMatch) {
            companion.actions.push({
              name: nameMatch[1].trim(),
              type: "attack",
              attackBonus: parseInt(bonusMatch[1]),
              reach: reachMatch[1].trim(),
              damage: damageMatch[1].trim()
            });
            debug2.log(`\u2705 Parsed Action: ${nameMatch[1].trim()}`);
            debug2.log(`\u{1F50D} DEBUG: Parsed damage: "${damageMatch[1].trim()}"`);
          } else {
            debug2.log(`\u274C Failed to parse attack. Matches:`, { nameMatch, bonusMatch, reachMatch, damageMatch });
          }
        });
      } else {
        debug2.log(`\u{1F50D} DEBUG: No actions section found`);
      }
      if (companion.ac > 0 || companion.hp || Object.keys(companion.abilities).length > 0) {
        debug2.log(`\u2705 Successfully parsed companion "${name}"`);
        debug2.log(`\u{1F50D} DEBUG: Final companion object:`, companion);
        return companion;
      }
      debug2.log(`\u274C Failed to parse any stats for companion "${name}"`);
      return null;
    }
    async function extractCharacterData() {
      try {
        debug2.log("\u{1F680} Starting character extraction...");
        const characterData2 = await fetchCharacterDataFromAPI();
        if (characterData2) {
          debug2.log("\u2705 Character data extracted via API:", characterData2.name);
          return characterData2;
        }
        debug2.log("\u{1F504} API failed, trying DOM extraction...");
        const domData = extractCharacterDataFromDOM();
        if (domData) {
          debug2.log("\u2705 Character data extracted via DOM:", domData.name);
          return domData;
        }
        debug2.error("\u274C Both API and DOM extraction failed");
        return null;
      } catch (error) {
        debug2.error("\u274C Error extracting character data:", error);
        throw error;
      }
    }
    function handleRollRequest(name, formula) {
      return new Promise((resolve, reject) => {
        debug2.log(`\u{1F3B2} Handling roll request: ${name} with formula ${formula}`);
        const rollResult = Math.floor(Math.random() * 20) + 1;
        const totalResult = rollResult + (formula.includes("+") ? parseInt(formula.split("+")[1]) : 0);
        const rollData = {
          name,
          formula,
          result: totalResult.toString(),
          baseRoll: rollResult.toString(),
          // Add the raw d20 roll!
          timestamp: Date.now()
        };
        debug2.log("\u{1F3B2} Simulated roll:", rollData);
        sendRollToRoll20(rollData);
        showNotification2(`Rolled ${name}: ${formula} = ${totalResult} \u{1F3B2}`, "success");
        resolve();
      });
    }
    function extractSpellsFromDOM(characterData2) {
      try {
        debug2.log("\u{1F50D} Extracting spells from DOM...");
        debug2.log("\u{1F50D} Current hostname:", window.location.hostname);
        debug2.log("\u{1F50D} Current URL:", window.location.href);
        const spellSelectors = [
          '[class*="spell"]',
          '[class*="magic"]',
          ".spell-item",
          ".spell-card",
          "[data-spell]",
          'div:contains("spell")',
          'li:contains("spell")',
          // Dice Cloud specific selectors
          ".v-card",
          // Vue.js cards
          ".v-sheet",
          // Vue.js sheets
          "[data-v-]",
          // Vue.js components
          ".ma-2",
          // Margin classes
          ".pa-2",
          // Padding classes
          ".text-h6",
          // Header text
          ".subtitle-1",
          // Subtitle text
          ".caption"
          // Caption text
        ];
        const spellElements = [];
        spellSelectors.forEach((selector) => {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach((el) => spellElements.push(el));
          } catch (e) {
          }
        });
        debug2.log(`\u{1F50D} Found ${spellElements.length} potential spell elements`);
        if (window.location.hostname !== "dicecloud.com" && !window.location.hostname.includes("dicecloud")) {
          debug2.log("\u{1F50D} Not in Dice Cloud, trying broader search...");
          const allElements = document.querySelectorAll("*");
          let spellTextElements = [];
          allElements.forEach((element) => {
            const text = element.textContent || element.innerText || "";
            if (text.toLowerCase().includes("spell") || text.toLowerCase().includes("level") && text.toLowerCase().includes("cantrip") || text.toLowerCase().includes("casting") || text.toLowerCase().includes("range") || text.toLowerCase().includes("duration")) {
              spellTextElements.push(element);
            }
          });
          debug2.log(`\u{1F50D} Found ${spellTextElements.length} elements with spell-related text`);
          spellElements.push(...spellTextElements);
        }
        spellElements.forEach((element, index) => {
          try {
            const text = element.textContent || element.innerText || "";
            const lowerText = text.toLowerCase();
            if (!lowerText.includes("spell") && !lowerText.includes("level") && !lowerText.includes("cantrip")) {
              return;
            }
            if (lowerText.includes("spell slots") || lowerText.includes("slot") || lowerText.includes("slots")) {
              debug2.log(`\u{1F50D} Skipping spell slot element: ${text.substring(0, 50)}`);
              return;
            }
            if (lowerText.includes("stats") || lowerText.includes("actions") || lowerText.includes("inventory") || lowerText.includes("features") || lowerText.includes("journal") || lowerText.includes("build") || lowerText.includes("hit points") || lowerText.includes("armor class") || lowerText.includes("speed")) {
              debug2.log(`\u{1F50D} Skipping navigation element: ${text.substring(0, 50)}`);
              return;
            }
            if (text.length < 20) {
              return;
            }
            if (text.includes(characterData2.name) || lowerText.includes("grey")) {
              debug2.log(`\u{1F50D} Skipping character name element: ${text.substring(0, 50)}`);
              return;
            }
            debug2.log(`\u{1F50D} Processing element ${index}:`, text.substring(0, 100));
            let spellName = "";
            const boldText = element.querySelector('strong, b, [class*="name"], [class*="title"], .text-h6, .subtitle-1');
            if (boldText) {
              spellName = boldText.textContent.trim();
            } else {
              const lines2 = text.split("\n").filter((line) => line.trim());
              spellName = lines2[0]?.trim() || "";
            }
            if (!spellName || spellName.length < 2 || spellName.toLowerCase().includes("level") || spellName.toLowerCase().includes("spell")) {
              return;
            }
            const knownSpells = ["detect magic", "disguise self", "summon fey", "fireball", "magic missile", "cure wounds"];
            if (knownSpells.includes(spellName.toLowerCase()) && text.length < 100) {
              debug2.log(`\u{1F50D} Skipping incomplete spell entry for "${spellName}"`);
              return;
            }
            let spellLevel = 0;
            const levelMatch = text.match(/level\s*(\d+)|cantrip|(\d+)(?:st|nd|rd|th)\s*level/i);
            if (levelMatch) {
              spellLevel = levelMatch[1] ? parseInt(levelMatch[1]) : levelMatch[2] ? parseInt(levelMatch[2]) : 0;
            }
            let description = "";
            const lines = text.split("\n").filter((line) => line.trim());
            if (lines.length > 2) {
              description = lines.slice(2).join("\n").trim();
            }
            description = description.replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "").replace(/\[object Object\]/g, "").trim();
            description = stripConditionalExpressions(description);
            if (description && description.length > 10) {
              const existingSpell = characterData2.spells.find(
                (s) => s.name.toLowerCase() === spellName.toLowerCase()
              );
              if (existingSpell) {
                existingSpell.description = description;
                debug2.log(`\u2705 Updated description for "${spellName}": "${description.substring(0, 50)}..."`);
              } else {
                characterData2.spells.push({
                  name: spellName,
                  level: spellLevel,
                  description,
                  school: "",
                  castingTime: "",
                  range: "",
                  components: "",
                  duration: "",
                  prepared: false
                });
                debug2.log(`\u2705 Added new spell "${spellName}" (Level ${spellLevel}): "${description.substring(0, 50)}..."`);
              }
            } else {
              debug2.log(`\u{1F50D} No meaningful description found for "${spellName}"`);
            }
          } catch (error) {
            debug2.error(`\u274C Error processing spell element ${index}:`, error);
          }
        });
        debug2.log(`\u2705 Spell extraction complete. Found ${characterData2.spells.length} spells with descriptions.`);
      } catch (error) {
        debug2.error("\u274C Error extracting spells from DOM:", error);
      }
    }
    function extractCharacterDataFromDOM() {
      try {
        debug2.log("\u{1F50D} Extracting character data from DOM...");
        const characterData2 = {
          id: getCharacterIdFromUrl(),
          // CRITICAL: Store character ID for proper persistence
          name: "",
          level: 1,
          class: "",
          race: "",
          attributes: {},
          attributeMods: {},
          skills: {},
          savingThrows: {},
          hitPoints: 0,
          armorClass: 10,
          speed: 30,
          proficiencyBonus: 2,
          initiative: 0,
          otherVariables: {},
          features: [],
          spells: []
        };
        const nameElement = document.querySelector('[class*="name"], [class*="character"], h1, h2');
        if (nameElement) {
          characterData2.name = nameElement.textContent.trim() || "Unknown Character";
        }
        const statElements = document.querySelectorAll('[class*="stat"], [class*="attribute"], [class*="ability"]');
        statElements.forEach((element) => {
          const text = element.textContent.trim();
          if (text.includes("STR") || text.includes("Strength")) {
            const match = text.match(/(\d+)/);
            if (match)
              characterData2.attributes.strength = parseInt(match[1]);
          }
          if (text.includes("DEX") || text.includes("Dexterity")) {
            const match = text.match(/(\d+)/);
            if (match)
              characterData2.attributes.dexterity = parseInt(match[1]);
          }
          if (text.includes("CON") || text.includes("Constitution")) {
            const match = text.match(/(\d+)/);
            if (match)
              characterData2.attributes.constitution = parseInt(match[1]);
          }
          if (text.includes("INT") || text.includes("Intelligence")) {
            const match = text.match(/(\d+)/);
            if (match)
              characterData2.attributes.intelligence = parseInt(match[1]);
          }
          if (text.includes("WIS") || text.includes("Wisdom")) {
            const match = text.match(/(\d+)/);
            if (match)
              characterData2.attributes.wisdom = parseInt(match[1]);
          }
          if (text.includes("CHA") || text.includes("Charisma")) {
            const match = text.match(/(\d+)/);
            if (match)
              characterData2.attributes.charisma = parseInt(match[1]);
          }
        });
        Object.keys(characterData2.attributes).forEach((attr) => {
          const score = characterData2.attributes[attr] || 10;
          characterData2.attributeMods[attr] = Math.floor((score - 10) / 2);
        });
        extractSpellsFromDOM(characterData2);
        debug2.log("\u2705 DOM extraction completed:", characterData2);
        return characterData2;
      } catch (error) {
        debug2.error("\u274C Error extracting from DOM:", error);
        return null;
      }
    }
    async function extractAndStoreCharacterData() {
      try {
        debug2.log("\u{1F680} Starting character extraction...");
        showNotification2("Extracting character data...", "info");
        const characterData2 = await fetchCharacterDataFromAPI();
        if (characterData2 && characterData2.name) {
          try {
            browserAPI.runtime.sendMessage({
              action: "storeCharacterData",
              data: characterData2
            }, (response) => {
              if (browserAPI.runtime.lastError) {
                debug2.error("\u274C Extension context error:", browserAPI.runtime.lastError);
                showNotification2("Extension reloaded. Please refresh the page.", "error");
                return;
              }
              if (response && response.success) {
                debug2.log("\u2705 Character data stored successfully");
                showNotification2(`${characterData2.name} extracted! Navigate to Roll20 to import.`, "success");
              } else {
                debug2.error("\u274C Failed to store character data:", response && response.error);
                showNotification2("Failed to store character data", "error");
              }
            });
          } catch (error) {
            debug2.error("\u274C Extension context invalidated:", error);
            showNotification2("Extension reloaded. Please refresh the page.", "error");
          }
        } else {
          debug2.error("\u274C No character name found");
          showNotification2("Failed to extract character data", "error");
        }
      } catch (error) {
        debug2.error("\u274C Error extracting character:", error);
        debug2.error("Stack trace:", error.stack);
        showNotification2(error.message, "error");
      }
    }
    function showNotification2(message, type = "info", duration = 5e3) {
      const colors = {
        success: "#4CAF50",
        error: "#f44336",
        info: "#2196F3"
      };
      const notification = document.createElement("div");
      notification.textContent = message;
      notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type] || colors.info};
      color: white;
      padding: 16px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
      max-width: 300px;
    `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), duration);
    }
    function addCheckStructureButton() {
      if (document.readyState !== "complete") {
        window.addEventListener("load", addCheckStructureButton);
        return;
      }
      if (!document.getElementById("dc-check-structure-btn")) {
        const debugButton = document.createElement("button");
        debugButton.id = "dc-check-structure-btn";
        debugButton.textContent = "\u{1F50D} Check Structure";
        debugButton.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 10000;
        background: #ff6b6b;
        color: white;
        border: none;
        padding: 10px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
      `;
        debugButton.addEventListener("click", async () => {
          console.log("\u{1F50D} [DiceCloud Structure] Fetching complete property structure...");
          const pathParts = window.location.pathname.split("/");
          let characterId = null;
          if (pathParts.includes("character")) {
            const characterIndex = pathParts.indexOf("character");
            if (characterIndex + 1 < pathParts.length) {
              characterId = pathParts[characterIndex + 1];
            }
          } else {
            characterId = pathParts[pathParts.length - 1];
          }
          console.log("\u{1F50D} [DiceCloud Structure] Extracted character ID:", characterId);
          if (characterId && characterId !== "New-Character") {
            try {
              const response = await fetch(`https://dicecloud.com/api/creature/${characterId}`, {
                headers: {
                  "Authorization": `Bearer ${localStorage.getItem("Meteor.loginToken")}`
                }
              });
              if (response.ok) {
                const data = await response.json();
                const properties = data.creatureProperties || [];
                console.log(`\u{1F50D} [DiceCloud Structure] Total properties: ${properties.length}`);
                const propertyMap = /* @__PURE__ */ new Map();
                properties.forEach((p) => {
                  if (p._id) {
                    propertyMap.set(p._id, p);
                  }
                });
                const buildHierarchy = (propId, visited = /* @__PURE__ */ new Set()) => {
                  if (visited.has(propId))
                    return { _circular: true };
                  visited.add(propId);
                  const prop = propertyMap.get(propId);
                  if (!prop)
                    return null;
                  const propCopy = { ...prop };
                  const children = properties.filter((p) => p.parent && p.parent.id === propId);
                  if (children.length > 0) {
                    propCopy.children = children.map((child) => buildHierarchy(child._id, new Set(visited)));
                  }
                  return propCopy;
                };
                const rootProperties = properties.filter((p) => !p.parent || !p.parent.id || !propertyMap.has(p.parent.id));
                const hierarchicalStructure = rootProperties.map((root) => buildHierarchy(root._id));
                const exportData = {
                  characterId,
                  exportDate: (/* @__PURE__ */ new Date()).toISOString(),
                  totalProperties: properties.length,
                  propertyTypes: Object.entries(
                    properties.reduce((acc, p) => {
                      const type = p.type || "unknown";
                      acc[type] = (acc[type] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([type, count]) => ({ type, count })),
                  properties: hierarchicalStructure,
                  allPropertiesFlat: properties
                };
                const jsonString = JSON.stringify(exportData, null, 2);
                const blob = new Blob([jsonString], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const downloadLink = document.createElement("a");
                downloadLink.href = url;
                downloadLink.download = `dicecloud-structure-${characterId}-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                URL.revokeObjectURL(url);
                console.log("\u{1F50D} [DiceCloud Structure] JSON file generated and download initiated");
                alert(`Structure exported!

Found ${properties.length} total properties

Property types: ${exportData.propertyTypes.map((t) => `${t.type}: ${t.count}`).join(", ")}

JSON file will download shortly.`);
              } else {
                console.error("\u{1F50D} [DiceCloud Structure] Failed to fetch character data:", response.status);
                alert("Failed to fetch character data. Make sure you're logged in.");
              }
            } catch (error) {
              console.error("\u{1F50D} [DiceCloud Structure] Error checking structure:", error);
              alert("Error fetching structure. Check console for details.");
            }
          } else {
            console.error("\u{1F50D} [DiceCloud Structure] Could not extract valid character ID from URL");
            alert("Could not extract character ID from URL. Make sure you're on a character page.");
          }
        });
        document.body.appendChild(debugButton);
        debug2.log("\u{1F50D} Check Structure button added");
      }
    }
    browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
      debug2.log("DiceCloud received message:", request);
      switch (request.action) {
        case "syncCharacter":
          syncCharacterData(request.slotId).then(() => {
            sendResponse({ success: true });
          }).catch((error) => {
            debug2.error("Error syncing character:", error);
            sendResponse({ success: false, error: error.message });
          });
          return true;
        case "rollInDiceCloud":
          handleRollRequest(request.roll.name, request.roll.formula).then(() => {
            debug2.log("\u2705 Roll handled in Dice Cloud");
            sendResponse({ success: true });
          }).catch((error) => {
            debug2.error("\u274C Failed to handle roll in Dice Cloud:", error);
            sendResponse({ success: false, error: error.message });
          });
          return true;
        case "extractCharacter":
          extractCharacterData().then((data) => {
            sendResponse({ success: true, data });
          }).catch((error) => {
            debug2.error("Error extracting character:", error);
            sendResponse({ success: false, error: error.message });
          });
          return true;
        case "discordLink":
          handleDiscordLink(request.dicecloudUserId, request.discordInfo).then(() => {
            sendResponse({ success: true });
          }).catch((error) => {
            debug2.error("Error handling Discord link:", error);
            sendResponse({ success: false, error: error.message });
          });
          return true;
        case "showSyncButton":
          const syncButton = document.getElementById("dc-sync-btn");
          if (syncButton) {
            syncButton.style.display = "";
            sessionStorage.removeItem("dc-sync-btn_hidden");
            localStorage.removeItem("dc-sync-btn_hidden");
            showNotification2("Sync button shown", "success");
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: "Sync button not found" });
          }
          return true;
        case "showLoginHint":
          try {
            const hintOverlay = document.createElement("div");
            hintOverlay.id = "owlcloud-login-hint";
            hintOverlay.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            max-width: 300px;
          `;
            hintOverlay.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 18px; margin-right: 8px;">\u{1F3B2}</span>
              <strong>OwlCloud Extension</strong>
            </div>
            <div>Please log in to DiceCloud (Google Sign-In or username/password), then click the "Connect with DiceCloud" button again.</div>
            <button onclick="this.parentElement.remove()" style="
              margin-top: 10px;
              background: white;
              color: #4CAF50;
              border: none;
              padding: 5px 10px;
              border-radius: 4px;
              cursor: pointer;
            ">Got it</button>
          `;
            const existingHint = document.getElementById("owlcloud-login-hint");
            if (existingHint) {
              existingHint.remove();
            }
            document.body.appendChild(hintOverlay);
            setTimeout(() => {
              if (hintOverlay.parentElement) {
                hintOverlay.remove();
              }
            }, 1e4);
            sendResponse({ success: true });
          } catch (error) {
            debug2.error("Error showing login hint:", error);
            sendResponse({ success: false, error: error.message });
          }
          return true;
        case "extractAuthToken":
          try {
            const loginToken = localStorage.getItem("Meteor.loginToken");
            const loginTokenExpires = localStorage.getItem("Meteor.loginTokenExpires");
            const userId = localStorage.getItem("Meteor.userId");
            if (loginToken && userId) {
              debug2.log("\u2705 Found auth token in localStorage");
              const authId = userId;
              let displayUsername = "DiceCloud User";
              try {
                debug2.log("\u{1F50D} Checking for Meteor.user()...");
                if (typeof window.Meteor !== "undefined" && window.Meteor.user) {
                  debug2.log("\u2705 Meteor object available:", typeof window.Meteor);
                  const meteorUser = window.Meteor.user();
                  debug2.log("\u{1F4E6} Meteor.user() result:", meteorUser);
                  if (meteorUser) {
                    displayUsername = meteorUser.username || meteorUser.emails?.[0]?.address || meteorUser.profile?.username || meteorUser.profile?.name || meteorUser.services?.google?.email || meteorUser.services?.facebook?.email || "DiceCloud User";
                    debug2.log("\u2705 Found display username via Meteor.user():", displayUsername);
                  } else {
                    debug2.log("\u274C Meteor.user() returned null/undefined");
                  }
                } else {
                  debug2.log("\u274C Meteor.user() not available. window.Meteor:", typeof window.Meteor);
                  debug2.log("\u{1F50D} Available window properties:", Object.keys(window).filter((k) => k.toLowerCase().includes("meteor")).slice(0, 10));
                }
              } catch (e) {
                debug2.log("\u26A0\uFE0F Meteor.user() error:", e.message);
              }
              if (displayUsername === "DiceCloud User") {
                try {
                  debug2.log("\u{1F50D} Checking localStorage for user data...");
                  const allKeys = Object.keys(localStorage);
                  debug2.log("\u{1F4CB} All localStorage keys:", allKeys);
                  const meteorUserKeys = allKeys.filter(
                    (key) => (key.includes("Meteor.user") || key.includes("user") || key.includes("User")) && !key.includes("Meteor.userId") && !key.includes("Meteor.loginToken")
                  );
                  debug2.log("\u{1F50D} Found user-related localStorage keys:", meteorUserKeys);
                  for (const meteorUserKey of meteorUserKeys) {
                    try {
                      const userData = localStorage.getItem(meteorUserKey);
                      debug2.log(`\u{1F4E6} Raw data from key "${meteorUserKey}":`, userData?.substring(0, 200));
                      if (userData) {
                        let parsed;
                        try {
                          parsed = JSON.parse(userData);
                          debug2.log(`\u{1F4E6} Parsed data from key "${meteorUserKey}":`, parsed);
                        } catch (parseError) {
                          debug2.log(`\u26A0\uFE0F Key "${meteorUserKey}" is not JSON, trying raw value`);
                          if (userData.length > 2 && userData !== "Chepi" && !userData.match(/^[a-zA-Z0-9]{10,}$/)) {
                            displayUsername = userData.trim();
                            debug2.log(`\u2705 Found display username from localStorage key "${meteorUserKey}":`, displayUsername);
                            break;
                          }
                          continue;
                        }
                        displayUsername = parsed.username || parsed.emails?.[0]?.address || parsed.profile?.username || parsed.profile?.name || parsed.name || parsed.email || "DiceCloud User";
                        if (displayUsername !== "DiceCloud User") {
                          debug2.log("\u2705 Found display username in localStorage:", displayUsername);
                          break;
                        }
                      }
                    } catch (keyError) {
                      debug2.log(`\u26A0\uFE0F Error processing key "${meteorUserKey}":`, keyError.message);
                    }
                  }
                  if (meteorUserKeys.length === 0) {
                    debug2.log("\u2139\uFE0F No additional user data keys found in localStorage (only Meteor.userId and tokens)");
                  }
                } catch (e) {
                  debug2.log("\u26A0\uFE0F Failed to check localStorage user data:", e.message);
                }
              }
              if (displayUsername === "DiceCloud User") {
                try {
                  const possibleUserObjects = [
                    window.currentUser,
                    window.user,
                    window.app?.currentUser,
                    window.app?.user,
                    window.$root?.currentUser,
                    window.$root?.user
                  ];
                  for (const userObj of possibleUserObjects) {
                    if (userObj) {
                      const candidateUsername = userObj.username || userObj.email || userObj.name;
                      if (candidateUsername && candidateUsername !== "Chepi") {
                        displayUsername = candidateUsername;
                        debug2.log("\u2705 Found display username in window object:", displayUsername);
                        break;
                      }
                    }
                  }
                } catch (e) {
                  debug2.log("\u26A0\uFE0F Failed to check window objects:", e.message);
                }
              }
              if (displayUsername === "DiceCloud User") {
                const possibleElements = [
                  ".user-menu .username",
                  ".user-info .username",
                  ".navbar .user-display-name",
                  "header .user-name",
                  ".profile .name",
                  ".avatar + span",
                  ".user-avatar + *"
                ];
                for (const selector of possibleElements) {
                  const el = document.querySelector(selector);
                  if (el && el.textContent && el.textContent.trim()) {
                    const candidate = el.textContent.trim();
                    if (candidate !== "Chepi" && candidate.length > 2 && !candidate.match(/^[A-Z][a-z]+$/)) {
                      displayUsername = candidate;
                      debug2.log(`\u2705 Found display username with selector "${selector}":`, displayUsername);
                      break;
                    }
                  }
                }
              }
              debug2.log("\u2705 Auth ID for database:", authId);
              debug2.log("\u2705 Display username for UI:", displayUsername);
              const responseData = {
                success: true,
                token: loginToken,
                userId,
                tokenExpires: loginTokenExpires,
                username: displayUsername,
                // Display username for UI
                authId
                // Auth ID for database storage
              };
              debug2.log("\u{1F4E4} About to send response:", responseData);
              sendResponse(responseData);
              return true;
            } else {
              debug2.warn("\u26A0\uFE0F No auth token found - user may not be logged in");
              sendResponse({
                success: false,
                error: "Not logged in to DiceCloud. Please log in first."
              });
              return true;
            }
          } catch (error) {
            debug2.error("\u274C Error extracting auth token:", error);
            sendResponse({
              success: false,
              error: "Failed to extract token: " + error.message
            });
            return true;
          }
        default:
          debug2.warn("Unknown action:", request.action);
          sendResponse({ success: false, error: "Unknown action" });
      }
    });
    function debugPageStructure() {
      debug2.log("=== DICECLOUD ROLL LOG DEBUG ===");
      const potentialSelectors = [
        ".dice-stream",
        '[class*="dice"]',
        '[class*="roll"]',
        '[class*="log"]',
        '[class*="sidebar"]',
        '[class*="right"]',
        "aside",
        '[role="complementary"]'
      ];
      debug2.log("Searching for roll log container...");
      potentialSelectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          debug2.log(`Found ${elements.length} element(s) matching "${selector}":`);
          elements.forEach((el, i) => {
            debug2.log(`  [${i}] Classes:`, el.className);
            debug2.log(`  [${i}] ID:`, el.id);
            debug2.log(`  [${i}] Tag:`, el.tagName);
            debug2.log(`  [${i}] Text preview:`, el.textContent && el.textContent.substring(0, 100));
          });
        }
      });
      debug2.log('\nSearching for elements with dice notation (e.g., "1d20 [ 6 ]", "2d6+3")...');
      const allElements = document.querySelectorAll("*");
      const dicePattern = /\d+d\d+\s*\[/i;
      const elementsWithDice = [];
      allElements.forEach((el) => {
        const text = el.textContent || "";
        if (text.match(dicePattern)) {
          elementsWithDice.push({
            tag: el.tagName,
            classes: el.className,
            id: el.id,
            text: text.substring(0, 100),
            parent: el.parentElement && el.parentElement.className,
            childCount: el.children.length,
            element: el
            // Store reference for inspection
          });
        }
      });
      if (elementsWithDice.length > 0) {
        debug2.log(`Found ${elementsWithDice.length} elements with dice notation:`);
        debug2.table(elementsWithDice.slice(0, 20));
        debug2.log("\n\u{1F4CB} Full element details (expand to inspect):");
        elementsWithDice.slice(0, 5).forEach((item, i) => {
          debug2.log(`
[${i}] Element:`, item.element);
          debug2.log(`[${i}] Full text (first 200 chars):
`, item.element.textContent.substring(0, 200));
          debug2.log(`[${i}] Parent chain:`, getParentChain(item.element));
        });
      } else {
        debug2.log("\u274C No elements with dice notation found!");
        debug2.log("This might mean:");
        debug2.log("1. No rolls have been made yet - try making a roll");
        debug2.log("2. Rolls appear in a different format");
        debug2.log("3. Rolls are in a shadow DOM or iframe");
      }
      function getParentChain(el) {
        const chain = [];
        let current = el;
        for (let i = 0; i < 5 && current; i++) {
          chain.push({
            tag: current.tagName,
            class: current.className,
            id: current.id
          });
          current = current.parentElement;
        }
        return chain;
      }
      debug2.log("\n=== END DEBUG ===");
      debug2.log("Instructions:");
      debug2.log("1. Make a test roll in DiceCloud");
      debug2.log("2. Run debugPageStructure() again to see the new elements");
      debug2.log('3. Right-click on the roll in the page and select "Inspect" to see its HTML structure');
    }
    function observeRollLog() {
      const findRollLog = () => {
        const selectors = [
          ".card-raised-background",
          // Primary roll log container
          ".character-log",
          // Alternative log container
          '[class*="log"]'
          // Fallback
        ];
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            debug2.log("\u2713 Roll log detection: Found roll log using selector:", selector);
            debug2.log("Roll log element:", element);
            return element;
          }
        }
        return null;
      };
      const rollLog = findRollLog();
      if (!rollLog) {
        debug2.log("\u23F3 Roll log not found, will retry in 2 seconds...");
        debug2.log("\u{1F4A1} Run window.debugDiceCloudRolls() in console for detailed debug info");
        setTimeout(observeRollLog, 2e3);
        return;
      }
      debug2.log("\u2705 Observing DiceCloud roll log for new rolls");
      debug2.log("\u{1F4CB} Roll log classes:", rollLog.className);
      debug2.log("\u{1F3B2} Ready to detect rolls!");
      const observerStartTime = Date.now();
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.className && node.className.includes("log-entry")) {
                const nodeTimestamp = node.getAttribute("data-timestamp") || node.querySelector("[data-timestamp]")?.getAttribute("data-timestamp");
                if (nodeTimestamp && parseInt(nodeTimestamp) > observerStartTime) {
                  debug2.log("\u{1F3B2} New roll detected:", node);
                  const rollData = parseRollFromElement(node);
                  if (rollData) {
                    debug2.log("\u2705 Successfully parsed roll:", rollData);
                    sendRollToRoll20(rollData);
                  } else {
                    debug2.log("\u26A0\uFE0F  Could not parse roll data from element");
                  }
                } else if (!nodeTimestamp) {
                  debug2.log("\u{1F504} Ignoring node without timestamp (likely existing content)");
                } else {
                  debug2.log("\u{1F504} Ignoring existing roll entry (added before observer started)");
                }
              }
            }
          });
        });
      });
      observer.observe(rollLog, {
        childList: true,
        subtree: true
      });
      debug2.log("\u{1F4A1} TIP: Make a test roll to see if it gets detected");
    }
    window.debugDiceCloudRolls = debugPageStructure;
    function parseRollFromElement(element) {
      try {
        const fullText = element.textContent || element.innerText || "";
        debug2.log("\u{1F50D} Full roll text:", fullText);
        const lines = fullText.split("\n").filter((line) => line.trim());
        const name = lines[0]?.trim() || "Unknown Roll";
        const formulaLine = lines.find((line) => line.includes("d20") || line.includes("d6") || line.includes("d8") || line.includes("d10") || line.includes("d12") || line.includes("d4"));
        if (!formulaLine) {
          debug2.log("\u26A0\uFE0F  No dice formula found in roll text");
          return null;
        }
        debug2.log("\u{1F4CA} Formula line:", formulaLine);
        const formulaMatch = formulaLine.match(/^(.+?)\s*=\s*(.+)$/);
        if (!formulaMatch) {
          debug2.log("\u26A0\uFE0F  Could not parse formula from:", formulaLine);
          return null;
        }
        const baseRollMatch = formulaMatch[1].match(/\[\s*(\d+)\s*\]/);
        const baseRoll = baseRollMatch ? baseRollMatch[1] : null;
        let formula = formulaMatch[1].replace(/\s*\[\s*\d+\s*\]\s*/g, "").trim();
        formula = formula.replace(/\s+/g, "");
        const result = formulaMatch[2].trim();
        debug2.log(`\u{1F4CA} Parsed: name="${name}", formula="${formula}", result="${result}", baseRoll="${baseRoll}"`);
        return {
          name,
          formula,
          result,
          baseRoll,
          // The actual die roll (e.g., "17" from "1d20 [ 17 ]")
          timestamp: Date.now()
        };
      } catch (error) {
        debug2.error("\u274C Error parsing roll element:", error);
        return null;
      }
    }
    const dragState = {
      positions: {},
      isDragging: false,
      currentElement: null,
      startX: 0,
      startY: 0,
      elementX: 0,
      elementY: 0
    };
    browserAPI.storage.local.get(["panelPositions"]).then((result) => {
      if (result.panelPositions) {
        dragState.positions = result.panelPositions;
      }
    }).catch((error) => {
      debug2.error("Failed to load panel positions:", error);
    });
    function savePositions() {
      browserAPI.storage.local.set({ panelPositions: dragState.positions });
    }
    function makeDraggable(element, handleSelector) {
      const elementId = element.id;
      let hasMoved = false;
      let clickTimeout = null;
      if (dragState.positions[elementId]) {
        const pos = dragState.positions[elementId];
        element.style.left = pos.x + "px";
        element.style.top = pos.y + "px";
        element.style.right = "auto";
        element.style.bottom = "auto";
      }
      const handle = handleSelector ? element.querySelector(handleSelector) : element;
      if (!handle)
        return;
      handle.addEventListener("mousedown", (e) => {
        if (e.target.classList.contains("history-toggle") || e.target.classList.contains("stats-toggle") || e.target.classList.contains("settings-toggle")) {
          return;
        }
        hasMoved = false;
        dragState.isDragging = false;
        dragState.currentElement = element;
        dragState.startX = e.clientX;
        dragState.startY = e.clientY;
        const rect = element.getBoundingClientRect();
        dragState.elementX = rect.left;
        dragState.elementY = rect.top;
        clickTimeout = setTimeout(() => {
          if (dragState.currentElement === element) {
            dragState.isDragging = true;
            element.style.transition = "none";
            element.style.opacity = "0.8";
            handle.style.cursor = "grabbing";
          }
        }, 100);
        e.preventDefault();
      });
      document.addEventListener("mousemove", (e) => {
        if (dragState.currentElement !== element)
          return;
        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          hasMoved = true;
          if (dragState.isDragging) {
            const newX = dragState.elementX + dx;
            const newY = dragState.elementY + dy;
            requestAnimationFrame(() => {
              const maxX = window.innerWidth - element.offsetWidth;
              const maxY = window.innerHeight - element.offsetHeight;
              const clampedX = Math.max(0, Math.min(newX, maxX));
              const clampedY = Math.max(0, Math.min(newY, maxY));
              element.style.left = clampedX + "px";
              element.style.top = clampedY + "px";
              element.style.right = "auto";
            });
            element.style.bottom = "auto";
          }
        }
        e.preventDefault();
      });
      document.addEventListener("mouseup", (e) => {
        if (dragState.currentElement !== element)
          return;
        clearTimeout(clickTimeout);
        const wasDragging = dragState.isDragging && hasMoved;
        dragState.isDragging = false;
        dragState.currentElement = null;
        let positionToSave = null;
        if (wasDragging) {
          const rect = element.getBoundingClientRect();
          positionToSave = {
            x: rect.left,
            y: rect.top
          };
        }
        element.style.transition = "";
        element.style.opacity = "1";
        handle.style.cursor = "move";
        if (positionToSave) {
          dragState.positions[elementId] = positionToSave;
          savePositions();
        }
      });
    }
    const rollStats = {
      history: [],
      settings: {
        enabled: true,
        showNotifications: true,
        showHistory: true,
        maxHistorySize: 20,
        advantageMode: "normal"
        // 'normal', 'advantage', 'disadvantage'
      },
      stats: {
        totalRolls: 0,
        averageRoll: 0,
        highestRoll: 0,
        lowestRoll: Infinity,
        criticalSuccesses: 0,
        criticalFailures: 0
      }
    };
    browserAPI.storage.local.get(["rollSettings"]).then((result) => {
      if (result.rollSettings) {
        Object.assign(rollStats.settings, result.rollSettings);
      }
      updateSettingsPanel();
    }).catch((error) => {
      debug2.error("Failed to load roll settings:", error);
      updateSettingsPanel();
    });
    function saveSettings() {
      browserAPI.storage.local.set({ rollSettings: rollStats.settings });
    }
    function detectAdvantageDisadvantage(rollData) {
      const name = rollData.name.toLowerCase();
      if (name.includes("advantage") || name.includes("adv")) {
        return "advantage";
      } else if (name.includes("disadvantage") || name.includes("dis")) {
        return "disadvantage";
      }
      return "normal";
    }
    function detectCritical(rollData) {
      const result = parseInt(rollData.result);
      const formula = rollData.formula.toLowerCase();
      if (formula.includes("d20") || formula.includes("1d20")) {
        if (result === 20)
          return "critical-success";
        if (result === 1)
          return "critical-failure";
      }
      return null;
    }
    function updateRollStatistics(rollData) {
      const result = parseInt(rollData.result);
      if (isNaN(result))
        return;
      rollStats.stats.totalRolls++;
      rollStats.stats.highestRoll = Math.max(rollStats.stats.highestRoll, result);
      rollStats.stats.lowestRoll = Math.min(rollStats.stats.lowestRoll, result);
      rollStats.stats.averageRoll = (rollStats.stats.averageRoll * (rollStats.stats.totalRolls - 1) + result) / rollStats.stats.totalRolls;
      const critical = detectCritical(rollData);
      if (critical === "critical-success")
        rollStats.stats.criticalSuccesses++;
      if (critical === "critical-failure")
        rollStats.stats.criticalFailures++;
    }
    function addToRollHistory(rollData) {
      const advantageType = detectAdvantageDisadvantage(rollData);
      const criticalType = detectCritical(rollData);
      rollStats.history.unshift({
        ...rollData,
        advantageType,
        criticalType,
        timestamp: Date.now()
      });
      if (rollStats.history.length > rollStats.settings.maxHistorySize) {
        rollStats.history = rollStats.history.slice(0, rollStats.settings.maxHistorySize);
      }
      updateRollStatistics(rollData);
      updateRollHistoryPanel();
      updateStatsPanel();
    }
    function showRollNotification(rollData) {
      if (!rollStats.settings.showNotifications)
        return;
      const critical = detectCritical(rollData);
      const advantage = detectAdvantageDisadvantage(rollData);
      let bgGradient = "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)";
      let icon = "\u{1F3B2}";
      if (critical === "critical-success") {
        bgGradient = "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)";
        icon = "\u2B50";
      } else if (critical === "critical-failure") {
        bgGradient = "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)";
        icon = "\u{1F480}";
      }
      const notification = document.createElement("div");
      notification.className = "dc-roll-notification";
      notification.innerHTML = `
      <div class="notification-icon">${icon}</div>
      <div class="notification-content">
        <div class="notification-title">${rollData.name}</div>
        <div class="notification-formula">${rollData.formula} = <strong>${rollData.result}</strong></div>
        <div class="notification-status">
          ${critical ? `<span class="critical-badge">${critical.toUpperCase().replace("-", " ")}</span>` : ""}
          ${advantage !== "normal" ? `<span class="advantage-badge">${advantage.toUpperCase()}</span>` : ""}
          <span>Sent to Roll20! \u{1F680}</span>
        </div>
      </div>
    `;
      notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: -450px;
      background: ${bgGradient};
      color: white;
      padding: 20px;
      border-radius: 16px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.4);
      z-index: 100001;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      min-width: 350px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: right 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      animation: pulse-glow 2s infinite;
    `;
      addNotificationStyles();
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.style.right = "20px";
      }, 10);
      setTimeout(() => {
        notification.style.right = "-450px";
        notification.style.opacity = "0";
        setTimeout(() => notification.remove(), 500);
      }, 4e3);
    }
    function addNotificationStyles() {
      if (document.querySelector(".dc-roll-notification-styles"))
        return;
      const style = document.createElement("style");
      style.className = "dc-roll-notification-styles";
      style.textContent = `
      .dc-roll-notification .notification-icon {
        font-size: 40px;
        animation: roll-bounce 0.8s ease-in-out infinite alternate;
      }

      .dc-roll-notification .notification-title {
        font-weight: bold;
        font-size: 15px;
        margin-bottom: 6px;
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
      }

      .dc-roll-notification .notification-formula {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 8px;
        font-family: 'Courier New', monospace;
      }

      .dc-roll-notification .notification-status {
        font-size: 12px;
        opacity: 0.95;
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }

      .dc-roll-notification .critical-badge,
      .dc-roll-notification .advantage-badge {
        background: rgba(255,255,255,0.3);
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: bold;
        letter-spacing: 0.5px;
      }

      @keyframes roll-bounce {
        0% { transform: rotate(-5deg) scale(1); }
        100% { transform: rotate(5deg) scale(1.15); }
      }

      @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 12px 32px rgba(0,0,0,0.4); }
        50% { box-shadow: 0 12px 48px rgba(255,255,255,0.3), 0 0 32px rgba(255,255,255,0.2); }
      }
    `;
      document.head.appendChild(style);
    }
    function createRollHistoryPanel() {
      if (document.getElementById("dc-roll-history"))
        return;
      const panel = document.createElement("div");
      panel.id = "dc-roll-history";
      panel.innerHTML = `
      <div class="history-header">
        <span class="history-title">\u{1F3B2} Roll History</span>
        <button class="history-toggle">\u2212</button>
      </div>
      <div class="history-content">
        <div class="history-list"></div>
      </div>
    `;
      panel.style.cssText = `
      position: fixed;
      bottom: 180px;
      right: 20px;
      background: rgba(20, 20, 30, 0.98);
      backdrop-filter: blur(12px);
      color: white;
      border-radius: 16px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.5);
      z-index: 10000;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      width: 380px;
      max-height: 500px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: ${rollStats.settings.showHistory ? "block" : "none"};
    `;
      addHistoryStyles();
      document.body.appendChild(panel);
      makeDraggable(panel, ".history-header");
      let isCollapsed = false;
      panel.querySelector(".history-header").addEventListener("click", (e) => {
        if (e.target === panel.querySelector(".history-toggle")) {
          const content = panel.querySelector(".history-content");
          const toggle = panel.querySelector(".history-toggle");
          if (isCollapsed) {
            content.style.display = "block";
            toggle.textContent = "\u2212";
          } else {
            content.style.display = "none";
            toggle.textContent = "+";
          }
          isCollapsed = !isCollapsed;
        }
      });
    }
    function addHistoryStyles() {
      if (document.querySelector(".dc-roll-history-styles"))
        return;
      const style = document.createElement("style");
      style.className = "dc-roll-history-styles";
      style.textContent = `
      #dc-roll-history .history-header {
        padding: 16px 20px;
        background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%);
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        border-radius: 16px 16px 0 0;
      }

      #dc-roll-history .history-title {
        font-weight: bold;
        font-size: 16px;
      }

      #dc-roll-history .history-toggle {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        transition: background 0.2s;
      }

      #dc-roll-history .history-toggle:hover {
        background: rgba(255,255,255,0.3);
      }

      #dc-roll-history .history-content {
        max-height: 440px;
        overflow-y: auto;
        padding: 12px;
      }

      #dc-roll-history .history-content::-webkit-scrollbar {
        width: 8px;
      }

      #dc-roll-history .history-content::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
      }

      #dc-roll-history .history-content::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
      }

      #dc-roll-history .history-item {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
        padding: 12px 14px;
        border-radius: 12px;
        margin-bottom: 8px;
        animation: slide-in-history 0.4s ease-out;
        border-left: 4px solid #8B5CF6;
        transition: all 0.2s;
      }

      #dc-roll-history .history-item:hover {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
        transform: translateX(-4px);
      }

      #dc-roll-history .history-item.critical-success {
        border-left-color: #A78BFA;
        background: linear-gradient(135deg, rgba(245, 87, 108, 0.2) 0%, rgba(240, 147, 251, 0.1) 100%);
      }

      #dc-roll-history .history-item.critical-failure {
        border-left-color: #8B5CF6;
        background: linear-gradient(135deg, rgba(78, 84, 200, 0.2) 0%, rgba(143, 148, 251, 0.1) 100%);
      }

      #dc-roll-history .history-item-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
        align-items: center;
      }

      #dc-roll-history .history-name {
        font-weight: 600;
        font-size: 14px;
      }

      #dc-roll-history .history-time {
        font-size: 11px;
        opacity: 0.6;
      }

      #dc-roll-history .history-formula {
        font-size: 13px;
        opacity: 0.95;
        font-family: 'Courier New', monospace;
        margin-bottom: 4px;
      }

      #dc-roll-history .history-badges {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      #dc-roll-history .history-badge {
        background: rgba(255,255,255,0.15);
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      @keyframes slide-in-history {
        from {
          opacity: 0;
          transform: translateX(30px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `;
      document.head.appendChild(style);
    }
    function updateRollHistoryPanel() {
      const panel = document.getElementById("dc-roll-history");
      if (!panel)
        return;
      const list = panel.querySelector(".history-list");
      if (!list)
        return;
      list.innerHTML = rollStats.history.map((roll2, index) => {
        const timeAgo = getTimeAgo(roll2.timestamp);
        const criticalClass = roll2.criticalType ? roll2.criticalType : "";
        let badges = "";
        if (roll2.criticalType) {
          badges += `<span class="history-badge">${roll2.criticalType.replace("-", " ")}</span>`;
        }
        if (roll2.advantageType && roll2.advantageType !== "normal") {
          badges += `<span class="history-badge">${roll2.advantageType}</span>`;
        }
        return `
        <div class="history-item ${criticalClass}" style="animation-delay: ${index * 0.03}s">
          <div class="history-item-header">
            <span class="history-name">${roll2.name}</span>
            <span class="history-time">${timeAgo}</span>
          </div>
          <div class="history-formula">${roll2.formula} = <strong>${roll2.result}</strong></div>
          ${badges ? `<div class="history-badges">${badges}</div>` : ""}
        </div>
      `;
      }).join("");
    }
    function getTimeAgo(timestamp) {
      const seconds = Math.floor((Date.now() - timestamp) / 1e3);
      if (seconds < 60)
        return "just now";
      if (seconds < 3600)
        return `${Math.floor(seconds / 60)}m ago`;
      if (seconds < 86400)
        return `${Math.floor(seconds / 3600)}h ago`;
      return `${Math.floor(seconds / 86400)}d ago`;
    }
    function createStatsPanel() {
      if (document.getElementById("dc-roll-stats"))
        return;
      const panel = document.createElement("div");
      panel.id = "dc-roll-stats";
      panel.innerHTML = `
      <div class="stats-header">
        <span class="stats-title">\u{1F4CA} Statistics</span>
        <button class="stats-toggle">\u2212</button>
      </div>
      <div class="stats-content">
        <div class="stat-item">
          <span class="stat-label">Total Rolls</span>
          <span class="stat-value" id="stat-total">0</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Average</span>
          <span class="stat-value" id="stat-average">0.0</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Highest</span>
          <span class="stat-value" id="stat-highest">0</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Lowest</span>
          <span class="stat-value" id="stat-lowest">\u221E</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">\u2B50 Critical Hits</span>
          <span class="stat-value" id="stat-crits">0</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">\u{1F480} Critical Fails</span>
          <span class="stat-value" id="stat-fails">0</span>
        </div>
      </div>
    `;
      panel.style.cssText = `
      position: fixed;
      bottom: 690px;
      right: 20px;
      background: rgba(20, 20, 30, 0.98);
      backdrop-filter: blur(12px);
      color: white;
      border-radius: 16px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.5);
      z-index: 10000;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      width: 380px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: ${rollStats.settings.showHistory ? "block" : "none"};
    `;
      addStatsStyles();
      document.body.appendChild(panel);
      makeDraggable(panel, ".stats-header");
      let isCollapsed = false;
      panel.querySelector(".stats-header").addEventListener("click", (e) => {
        if (e.target === panel.querySelector(".stats-toggle")) {
          const content = panel.querySelector(".stats-content");
          const toggle = panel.querySelector(".stats-toggle");
          if (isCollapsed) {
            content.style.display = "grid";
            toggle.textContent = "\u2212";
          } else {
            content.style.display = "none";
            toggle.textContent = "+";
          }
          isCollapsed = !isCollapsed;
        }
      });
    }
    function addStatsStyles() {
      if (document.querySelector(".dc-roll-stats-styles"))
        return;
      const style = document.createElement("style");
      style.className = "dc-roll-stats-styles";
      style.textContent = `
      #dc-roll-stats .stats-header {
        padding: 16px 20px;
        background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%);
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        border-radius: 16px 16px 0 0;
      }

      #dc-roll-stats .stats-title {
        font-weight: bold;
        font-size: 16px;
      }

      #dc-roll-stats .stats-toggle {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        transition: background 0.2s;
      }

      #dc-roll-stats .stats-toggle:hover {
        background: rgba(255,255,255,0.3);
      }

      #dc-roll-stats .stats-content {
        padding: 16px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      #dc-roll-stats .stat-item {
        background: rgba(255,255,255,0.05);
        padding: 12px;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      #dc-roll-stats .stat-label {
        font-size: 12px;
        opacity: 0.7;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      #dc-roll-stats .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #8B5CF6;
      }
    `;
      document.head.appendChild(style);
    }
    function updateStatsPanel() {
      const statsPanel = document.getElementById("dc-roll-stats");
      if (!statsPanel)
        return;
      const statTotal = document.getElementById("stat-total");
      const statAverage = document.getElementById("stat-average");
      const statHighest = document.getElementById("stat-highest");
      const statLowest = document.getElementById("stat-lowest");
      const statCrits = document.getElementById("stat-crits");
      const statFails = document.getElementById("stat-fails");
      if (statTotal) {
        statTotal.setAttribute("data-value", rollStats.stats.totalRolls);
        statTotal.textContent = rollStats.stats.totalRolls.toString();
      }
      if (statAverage)
        statAverage.textContent = rollStats.stats.averageRoll.toFixed(1);
      if (statHighest)
        statHighest.textContent = rollStats.stats.highestRoll.toString();
      if (statLowest) {
        statLowest.textContent = rollStats.stats.lowestRoll === Infinity ? "\u221E" : rollStats.stats.lowestRoll.toString();
      }
      if (statCrits)
        statCrits.textContent = rollStats.stats.criticalSuccesses.toString();
      if (statFails)
        statFails.textContent = rollStats.stats.criticalFailures.toString();
    }
    function createSettingsPanel() {
      if (document.getElementById("dc-roll-settings"))
        return;
      const panel = document.createElement("div");
      panel.id = "dc-roll-settings";
      panel.innerHTML = `
      <div class="settings-header">
        <span class="settings-title">\u2699\uFE0F Roll Settings</span>
        <button class="settings-toggle">\u2212</button>
      </div>
      <div class="settings-content">
        <div class="setting-group">
          <label class="setting-label">Roll Mode</label>
          <div class="toggle-buttons">
            <button class="toggle-btn ${rollStats.settings.advantageMode === "normal" ? "active" : ""}" data-mode="normal">
              Normal
            </button>
            <button class="toggle-btn ${rollStats.settings.advantageMode === "advantage" ? "active" : ""}" data-mode="advantage">
              Advantage
            </button>
            <button class="toggle-btn ${rollStats.settings.advantageMode === "disadvantage" ? "active" : ""}" data-mode="disadvantage">
              Disadvantage
            </button>
          </div>
          <div class="setting-description">
            <span id="mode-description">
              ${rollStats.settings.advantageMode === "advantage" ? "\u{1F3B2} Rolling with advantage (2d20kh1)" : rollStats.settings.advantageMode === "disadvantage" ? "\u{1F3B2} Rolling with disadvantage (2d20kl1)" : "\u{1F3B2} Rolling normally (1d20)"}
            </span>
          </div>
        </div>
      </div>
    `;
      panel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(20, 20, 30, 0.98);
      backdrop-filter: blur(12px);
      color: white;
      border-radius: 16px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.5);
      z-index: 10001;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      width: 380px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;
      addSettingsStyles();
      document.body.appendChild(panel);
      makeDraggable(panel, ".settings-header");
      let isCollapsed = false;
      panel.querySelector(".settings-header").addEventListener("click", (e) => {
        if (e.target === panel.querySelector(".settings-toggle")) {
          const content = panel.querySelector(".settings-content");
          const toggle = panel.querySelector(".settings-toggle");
          if (isCollapsed) {
            content.style.display = "block";
            toggle.textContent = "\u2212";
          } else {
            content.style.display = "none";
            toggle.textContent = "+";
          }
          isCollapsed = !isCollapsed;
        }
      });
      panel.querySelectorAll(".toggle-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const mode = btn.getAttribute("data-mode");
          rollStats.settings.advantageMode = mode;
          panel.querySelectorAll(".toggle-btn").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          const description = panel.querySelector("#mode-description");
          if (mode === "advantage") {
            description.textContent = "\u{1F3B2} Rolling with advantage (2d20kh1)";
          } else if (mode === "disadvantage") {
            description.textContent = "\u{1F3B2} Rolling with disadvantage (2d20kl1)";
          } else {
            description.textContent = "\u{1F3B2} Rolling normally (1d20)";
          }
          browserAPI.storage.local.set({ rollSettings: rollStats.settings });
          debug2.log("Roll mode changed to:", mode);
          showNotification2(`Roll mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`, "info");
        });
      });
    }
    function addSettingsStyles() {
      if (document.querySelector(".dc-roll-settings-styles"))
        return;
      const style = document.createElement("style");
      style.className = "dc-roll-settings-styles";
      style.textContent = `
      #dc-roll-settings .settings-header {
        padding: 16px 20px;
        background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%);
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        border-radius: 16px 16px 0 0;
      }

      #dc-roll-settings .settings-title {
        font-weight: bold;
        font-size: 16px;
      }

      #dc-roll-settings .settings-toggle {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        transition: background 0.2s;
      }

      #dc-roll-settings .settings-toggle:hover {
        background: rgba(255,255,255,0.3);
      }

      #dc-roll-settings .settings-content {
        padding: 20px;
      }

      #dc-roll-settings .setting-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      #dc-roll-settings .setting-label {
        font-size: 14px;
        font-weight: 600;
        opacity: 0.9;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      #dc-roll-settings .toggle-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 8px;
      }

      #dc-roll-settings .toggle-btn {
        background: rgba(255,255,255,0.08);
        border: 2px solid rgba(255,255,255,0.15);
        color: white;
        padding: 12px 16px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        transition: all 0.2s;
        text-align: center;
      }

      #dc-roll-settings .toggle-btn:hover {
        background: rgba(255,255,255,0.15);
        border-color: rgba(255,255,255,0.3);
        transform: translateY(-2px);
      }

      #dc-roll-settings .toggle-btn.active {
        background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%);
        border-color: #8B5CF6;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      #dc-roll-settings .setting-description {
        background: rgba(255,255,255,0.05);
        padding: 12px;
        border-radius: 8px;
        font-size: 12px;
        opacity: 0.8;
        text-align: center;
      }
    `;
      document.head.appendChild(style);
    }
    function updateSettingsPanel() {
      const panel = document.getElementById("dc-roll-settings");
      if (!panel)
        return;
      panel.querySelectorAll(".toggle-btn").forEach((btn) => {
        const mode = btn.getAttribute("data-mode");
        if (mode === rollStats.settings.advantageMode) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
      const description = panel.querySelector("#mode-description");
      if (description) {
        if (rollStats.settings.advantageMode === "advantage") {
          description.textContent = "\u{1F3B2} Rolling with advantage (2d20kh1)";
        } else if (rollStats.settings.advantageMode === "disadvantage") {
          description.textContent = "\u{1F3B2} Rolling with disadvantage (2d20kl1)";
        } else {
          description.textContent = "\u{1F3B2} Rolling normally (1d20)";
        }
      }
    }
    function applyAdvantageMode(formula, mode) {
      if (mode === "normal")
        return formula;
      const d20Regex = /(\d*)d20\b/gi;
      return formula.replace(d20Regex, (match, count) => {
        const diceCount = count ? parseInt(count) : 1;
        if (mode === "advantage") {
          return `${diceCount * 2}d20kh${diceCount}`;
        } else if (mode === "disadvantage") {
          return `${diceCount * 2}d20kl${diceCount}`;
        }
        return match;
      });
    }
    function sendRollToRoll20(rollData) {
      debug2.log("\u{1F680} sendRollToRoll20 called with:", rollData);
      if (!rollStats.settings.enabled) {
        debug2.log("\u26A0\uFE0F Roll forwarding disabled in settings");
        return;
      }
      const modifiedRoll = {
        ...rollData,
        formula: applyAdvantageMode(rollData.formula, rollStats.settings.advantageMode)
      };
      if (modifiedRoll.formula !== rollData.formula) {
        debug2.log(`Formula modified: ${rollData.formula} -> ${modifiedRoll.formula} (${rollStats.settings.advantageMode})`);
      }
      showRollNotification(modifiedRoll);
      addToRollHistory(modifiedRoll);
      debug2.log("\u{1F4E1} Sending roll to Roll20...");
      try {
        browserAPI.runtime.sendMessage({
          action: "sendRollToRoll20",
          roll: modifiedRoll
        }, (response) => {
          if (browserAPI.runtime.lastError) {
            debug2.error("\u274C Chrome runtime error:", browserAPI.runtime.lastError);
            showNotification2("Roll20 not available. Is Roll20 open?", "warning");
            return;
          }
          if (response && response.success) {
            debug2.log("\u2705 Roll sent to Roll20:", response);
            showNotification2(`${modifiedRoll.name} roll sent to Roll20! \u{1F3B2}`, "success");
          } else {
            debug2.error("\u274C Failed to send roll to Roll20:", response?.error);
            showNotification2("Roll20 not available. Is Roll20 open?", "warning");
          }
        });
      } catch (error) {
        debug2.error("Extension context invalidated:", error);
        showNotification2("Extension reloaded. Please refresh the page.", "error");
      }
    }
    function makeSyncButtonDraggable(button, storageKey) {
      let isDragging = false;
      let startX, startY, initialLeft, initialTop;
      const savedPosition = localStorage.getItem(`${storageKey}_position`);
      if (savedPosition) {
        try {
          const { left, top } = JSON.parse(savedPosition);
          const leftPx = parseInt(left);
          const topPx = parseInt(top);
          const isValidPosition = !isNaN(leftPx) && !isNaN(topPx) && leftPx >= -100 && leftPx <= window.innerWidth - 50 && topPx >= -100 && topPx <= window.innerHeight - 50;
          if (isValidPosition) {
            button.style.left = left;
            button.style.top = top;
            button.style.bottom = "auto";
          } else {
            debug2.log("\u{1F504} Clearing invalid button position");
            localStorage.removeItem(`${storageKey}_position`);
          }
        } catch (e) {
          debug2.error("Error parsing saved position:", e);
          localStorage.removeItem(`${storageKey}_position`);
        }
      }
      const savedVisibility = sessionStorage.getItem(`${storageKey}_hidden`);
      if (savedVisibility === "true") {
        button.style.display = "none";
      }
      button.addEventListener("mousedown", (e) => {
        if (e.button === 0) {
          isDragging = true;
          startX = e.clientX;
          startY = e.clientY;
          const rect = button.getBoundingClientRect();
          initialLeft = rect.left;
          initialTop = rect.top;
          requestAnimationFrame(() => {
            button.style.cursor = "grabbing";
          });
          e.preventDefault();
        }
      });
      document.addEventListener("mousemove", (e) => {
        if (isDragging) {
          const deltaX = e.clientX - startX;
          const deltaY = e.clientY - startY;
          const newLeft = initialLeft + deltaX;
          const newTop = initialTop + deltaY;
          button.style.left = `${newLeft}px`;
          button.style.top = `${newTop}px`;
          button.style.bottom = "auto";
        }
      });
      document.addEventListener("mouseup", () => {
        if (isDragging) {
          isDragging = false;
          button.style.cursor = "pointer";
          localStorage.setItem(`${storageKey}_position`, JSON.stringify({
            left: button.style.left,
            top: button.style.top
          }));
        }
      });
      button.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const existingMenu = document.getElementById("owlcloud-sync-context-menu");
        if (existingMenu)
          existingMenu.remove();
        const menu = document.createElement("div");
        menu.id = "owlcloud-sync-context-menu";
        const position = getPopupPosition(e.clientX, e.clientY, 200, 150);
        menu.style.cssText = `
        position: fixed;
        left: ${position.x}px;
        top: ${position.y}px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 100000;
        padding: 5px 0;
      `;
        const hideOption = document.createElement("div");
        hideOption.textContent = "\u{1F648} Hide Button";
        hideOption.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        font-size: 14px;
      `;
        hideOption.addEventListener("mouseenter", () => {
          hideOption.style.background = "#f0f0f0";
        });
        hideOption.addEventListener("mouseleave", () => {
          hideOption.style.background = "white";
        });
        hideOption.addEventListener("click", () => {
          button.style.display = "none";
          sessionStorage.setItem(`${storageKey}_hidden`, "true");
          menu.remove();
          showNotification2("Button hidden. Reload page to show it again.", "info");
        });
        const resetOption = document.createElement("div");
        resetOption.textContent = "\u{1F504} Reset Position";
        resetOption.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        font-size: 14px;
        border-top: 1px solid #eee;
      `;
        resetOption.addEventListener("mouseenter", () => {
          resetOption.style.background = "#f0f0f0";
        });
        resetOption.addEventListener("mouseleave", () => {
          resetOption.style.background = "white";
        });
        resetOption.addEventListener("click", () => {
          localStorage.removeItem(`${storageKey}_position`);
          button.style.left = "20px";
          button.style.top = "auto";
          button.style.bottom = "20px";
          menu.remove();
          showNotification2("Button position reset", "success");
        });
        menu.appendChild(hideOption);
        menu.appendChild(resetOption);
        document.body.appendChild(menu);
        setTimeout(() => {
          document.addEventListener("click", () => {
            menu.remove();
          }, { once: true });
        }, 0);
      });
    }
    function showSlotSelectionModal() {
      return new Promise((resolve, reject) => {
        let modal = document.getElementById("dc-slot-modal");
        if (modal) {
          modal.remove();
        }
        modal = document.createElement("div");
        modal.id = "dc-slot-modal";
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
        z-index: 100000;
        backdrop-filter: blur(3px);
      `;
        const modalContent = document.createElement("div");
        modalContent.style.cssText = `
        background: #2a2a2a;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        color: #fff;
      `;
        const header = document.createElement("div");
        header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      `;
        const title = document.createElement("h2");
        title.textContent = "\u{1F4E6} Choose Character Slot";
        title.style.cssText = `
        margin: 0;
        font-size: 24px;
        color: #8B5CF6;
      `;
        const closeBtn = document.createElement("button");
        closeBtn.textContent = "\u2715";
        closeBtn.style.cssText = `
        background: transparent;
        border: none;
        color: #fff;
        font-size: 28px;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background 0.2s;
      `;
        closeBtn.addEventListener("mouseenter", () => closeBtn.style.background = "rgba(255, 255, 255, 0.1)");
        closeBtn.addEventListener("mouseleave", () => closeBtn.style.background = "transparent");
        closeBtn.addEventListener("click", () => {
          modal.remove();
          reject(new Error("Slot selection cancelled"));
        });
        header.appendChild(title);
        header.appendChild(closeBtn);
        const helpText = document.createElement("p");
        helpText.textContent = "Select which slot to save this character to:";
        helpText.style.cssText = `
        margin: 0 0 20px 0;
        color: #aaa;
        font-size: 14px;
      `;
        const slotGrid = document.createElement("div");
        slotGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      `;
        browserAPI.runtime.sendMessage({ action: "getAllCharacterProfiles" }, (response) => {
          const profiles = response?.success ? response.profiles : {};
          const MAX_SLOTS = 10;
          for (let i = 1; i <= MAX_SLOTS; i++) {
            const slotId = `slot-${i}`;
            const existingChar = profiles[slotId];
            const slotCard = document.createElement("div");
            slotCard.style.cssText = `
            background: ${existingChar ? "#3a3a3a" : "#252525"};
            border: 2px solid ${existingChar ? "#8B5CF6" : "#404040"};
            border-radius: 8px;
            padding: 16px;
            cursor: pointer;
            transition: all 0.2s;
          `;
            slotCard.addEventListener("mouseenter", () => {
              slotCard.style.borderColor = "#8B5CF6";
              slotCard.style.transform = "translateY(-2px)";
              slotCard.style.boxShadow = "0 4px 12px rgba(78, 205, 196, 0.3)";
            });
            slotCard.addEventListener("mouseleave", () => {
              slotCard.style.borderColor = existingChar ? "#8B5CF6" : "#404040";
              slotCard.style.transform = "translateY(0)";
              slotCard.style.boxShadow = "none";
            });
            slotCard.addEventListener("click", () => {
              modal.remove();
              resolve(slotId);
            });
            const slotHeader = document.createElement("div");
            slotHeader.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          `;
            const slotNumber = document.createElement("span");
            slotNumber.textContent = `Slot ${i}`;
            slotNumber.style.cssText = `
            font-weight: bold;
            color: #fff;
            font-size: 14px;
          `;
            const slotBadge = document.createElement("span");
            slotBadge.textContent = existingChar ? "Occupied" : "Empty";
            slotBadge.style.cssText = `
            font-size: 11px;
            padding: 4px 8px;
            border-radius: 4px;
            background: ${existingChar ? "rgba(78, 205, 196, 0.2)" : "rgba(255, 255, 255, 0.1)"};
            color: ${existingChar ? "#8B5CF6" : "#999"};
          `;
            slotHeader.appendChild(slotNumber);
            slotHeader.appendChild(slotBadge);
            const slotInfo = document.createElement("div");
            if (existingChar) {
              slotInfo.innerHTML = `
              <div style="font-weight: bold; margin-bottom: 4px; font-size: 16px;">${existingChar.name || "Unknown"}</div>
              <div style="font-size: 13px; color: #999;">${existingChar.class || "No Class"} ${existingChar.level || "?"} \u2022 ${existingChar.race || "Unknown"}</div>
            `;
            } else {
              slotInfo.textContent = "Click to save here";
              slotInfo.style.cssText = `
              color: #666;
              font-size: 13px;
              font-style: italic;
            `;
            }
            slotCard.appendChild(slotHeader);
            slotCard.appendChild(slotInfo);
            slotGrid.appendChild(slotCard);
          }
        });
        modalContent.appendChild(header);
        modalContent.appendChild(helpText);
        modalContent.appendChild(slotGrid);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            modal.remove();
            reject(new Error("Slot selection cancelled"));
          }
        });
      });
    }
    function addSyncButton() {
      if (document.getElementById("dc-sync-btn"))
        return;
      const button = document.createElement("button");
      button.id = "dc-sync-btn";
      button.innerHTML = "\u{1F504} Sync to OwlCloud";
      button.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%);
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      z-index: 10000;
      box-shadow: 0 4px 15px rgba(78, 205, 196, 0.2);
      transition: transform 0.2s, box-shadow 0.2s;
      user-select: none;
    `;
      button.addEventListener("mouseenter", () => {
        button.style.boxShadow = "0 6px 20px rgba(78, 205, 196, 0.3)";
      });
      button.addEventListener("mouseleave", () => {
        button.style.boxShadow = "0 4px 15px rgba(78, 205, 196, 0.2)";
      });
      button.addEventListener("click", async () => {
        try {
          const slotId = await showSlotSelectionModal();
          await syncCharacterData(slotId);
        } catch (error) {
          if (error.message !== "Slot selection cancelled") {
            debug2.error("\u274C Error during sync:", error);
          }
        }
      });
      document.body.appendChild(button);
      makeSyncButtonDraggable(button, "dc-sync-btn");
      debug2.log("\u2705 Sync button added to Dice Cloud");
    }
    function syncCharacterData(slotId) {
      debug2.log("\u{1F504} Starting character data sync...", slotId ? `to ${slotId}` : "");
      const button = document.getElementById("dc-sync-btn");
      if (button) {
        button.innerHTML = "\u23F3 Syncing...";
        button.disabled = true;
      }
      return extractCharacterData().then((characterData2) => {
        if (!characterData2) {
          debug2.error("\u274C No character data found to sync");
          showNotification2("No character data found. Make sure you have a character open.", "error");
          if (button) {
            button.innerHTML = "\u{1F504} Sync to OwlCloud";
            button.disabled = false;
          }
          throw new Error("No character data found");
        }
        return new Promise((resolve, reject) => {
          const storeData = () => {
            browserAPI.runtime.sendMessage({
              action: "storeCharacterData",
              data: characterData2,
              slotId
            }, (response) => {
              if (browserAPI.runtime.lastError) {
                debug2.error("\u274C Extension context error:", browserAPI.runtime.lastError);
                debug2.log("\u{1F504} Background script not responding, trying direct storage...");
                browserAPI.storage.local.get(["characterProfiles"], (result) => {
                  if (browserAPI.runtime.lastError) {
                    debug2.error("\u274C Storage also failed:", browserAPI.runtime.lastError);
                    showNotification2("Extension context error. Please refresh the page.", "error");
                    if (button) {
                      button.innerHTML = "\u{1F504} Sync to OwlCloud";
                      button.disabled = false;
                    }
                    reject(new Error("Extension context error"));
                    return;
                  }
                  const profiles = result.characterProfiles || {};
                  profiles[slotId] = characterData2;
                  browserAPI.storage.local.set({ characterProfiles: profiles }, () => {
                    if (browserAPI.runtime.lastError) {
                      debug2.error("\u274C Direct storage failed:", browserAPI.runtime.lastError);
                      showNotification2("Storage error. Please refresh the page.", "error");
                      if (button) {
                        button.innerHTML = "\u{1F504} Sync to OwlCloud";
                        button.disabled = false;
                      }
                      reject(new Error("Storage error"));
                    } else {
                      debug2.log("\u2705 Character data synced via direct storage:", characterData2.name);
                      showNotification2(`\u2705 ${characterData2.name} synced to OwlCloud! \u{1F3B2}`, "success");
                      if (button) {
                        button.innerHTML = "\u2705 Synced!";
                        button.disabled = false;
                        setTimeout(() => {
                          button.innerHTML = "\u{1F504} Sync to OwlCloud";
                        }, 2e3);
                      }
                      try {
                        browserAPI.runtime.sendMessage({
                          action: "dataSynced",
                          slotId,
                          characterName: characterData2.name
                        }, (response2) => {
                          if (browserAPI.runtime.lastError) {
                            debug2.log("Popup notification failed (non-critical):", browserAPI.runtime.lastError);
                          } else {
                            debug2.log("\u2705 Popup notified successfully");
                          }
                        });
                      } catch (notifyError) {
                        debug2.log("Could not notify popup (non-critical):", notifyError);
                      }
                      resolve();
                    }
                  });
                });
              } else {
                debug2.log("\u2705 Character data synced to extension:", characterData2.name);
                showNotification2(`\u2705 ${characterData2.name} synced to OwlCloud! \u{1F3B2}`, "success");
                if (button) {
                  button.innerHTML = "\u2705 Synced!";
                  button.disabled = false;
                  setTimeout(() => {
                    button.innerHTML = "\u{1F504} Sync to OwlCloud";
                  }, 2e3);
                }
                resolve();
              }
            });
          };
          storeData();
        });
      }).catch((error) => {
        debug2.error("\u274C Error during character extraction:", error);
        if (error.message && error.message.includes("Not logged in")) {
          showNotification2("\u26A0\uFE0F Please login to DiceCloud first! Click the OwlCloud extension icon to login.", "error", 5e3);
        } else if (error.message && error.message.includes("Extension reloaded")) {
          showNotification2("Extension context error. Please refresh the page.", "error");
        } else {
          showNotification2("Failed to extract character data. Please try again.", "error");
        }
        if (button) {
          button.innerHTML = "\u{1F504} Sync to OwlCloud";
          button.disabled = false;
        }
        throw error;
      });
    }
    async function handleDiscordLink(dicecloudUserId, discordInfo) {
      debug2.log(`\u{1F517} Handling Discord link for user: ${dicecloudUserId}`);
      debug2.log(`\u{1F464} Discord info:`, discordInfo);
      try {
        const tokenResponse = await browserAPI.runtime.sendMessage({ action: "getApiToken" });
        if (!tokenResponse.success || !tokenResponse.token) {
          throw new Error("Not logged in to DiceCloud");
        }
        const { SupabaseTokenManager } = await import("./lib/supabase-client.js");
        const tokenManager = new SupabaseTokenManager();
        const authRecords = await tokenManager.getAuthTokens(dicecloudUserId);
        if (!authRecords || authRecords.length === 0) {
          throw new Error("No auth_tokens record found for user");
        }
        const updateData = {
          discord_user_id: discordInfo.userId,
          discord_username: discordInfo.username,
          discord_global_name: discordInfo.globalName,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        const success = await tokenManager.updateAuthTokens(dicecloudUserId, updateData);
        if (!success) {
          throw new Error("Failed to update auth_tokens with Discord info");
        }
        debug2.log(`\u2705 Successfully updated Discord link for user: ${dicecloudUserId}`);
        showNotification2("\u{1F517} Discord account linked successfully!", "success");
      } catch (error) {
        debug2.error("\u274C Error handling Discord link:", error);
        showNotification2("Failed to link Discord account", "error");
        throw error;
      }
    }
    async function autoRefreshToken() {
      try {
        const { explicitlyLoggedOut } = await browserAPI.storage.local.get("explicitlyLoggedOut");
        if (explicitlyLoggedOut) {
          debug2.log("\u23ED\uFE0F Skipping auto-refresh: user explicitly logged out");
          return;
        }
        const existingToken = await browserAPI.storage.local.get(["diceCloudToken", "diceCloudUserId"]);
        if (existingToken.diceCloudToken && existingToken.diceCloudUserId) {
          debug2.log("\u{1F4CB} Token already exists, skipping auto-refresh to preserve manual login");
          return;
        }
        const loginToken = localStorage.getItem("Meteor.loginToken");
        const userId = localStorage.getItem("Meteor.userId");
        if (loginToken && userId) {
          debug2.log("\u{1F504} Auto-refreshing DiceCloud auth token...");
          await browserAPI.storage.local.set({
            diceCloudToken: loginToken,
            diceCloudUserId: userId,
            tokenExpires: localStorage.getItem("Meteor.loginTokenExpires")
          });
          debug2.log("\u2705 Auth token auto-refreshed");
        } else {
          debug2.log("\u26A0\uFE0F No auth token found in localStorage (user may not be logged in)");
        }
      } catch (error) {
        debug2.error("Failed to auto-refresh token:", error);
      }
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        debug2.log("\u{1F4C4} DOM loaded, adding buttons...");
        addSyncButton();
        observeRollLog();
        autoRefreshToken();
      });
    } else {
      debug2.log("\u{1F4C4} DOM already loaded, adding buttons...");
      addSyncButton();
      observeRollLog();
      autoRefreshToken();
    }
  })();
})();
//# sourceMappingURL=dicecloud.js.map
