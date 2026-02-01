// Initialize debug globally
if (typeof window !== "undefined" && !window.debug) { window.debug = { log: console.log, warn: console.warn, error: console.error, info: console.info, group: console.group, groupEnd: console.groupEnd, table: console.table, time: console.time, timeEnd: console.timeEnd, isEnabled: () => true }; }
const debug = window.debug;
// Supabase config will be set by browser.js
const SUPABASE_URL = typeof window !== "undefined" ? window.SUPABASE_URL : undefined;
const SUPABASE_ANON_KEY = typeof window !== "undefined" ? window.SUPABASE_ANON_KEY : undefined;
// SupabaseTokenManager will be set by browser.js
const SupabaseTokenManager = typeof window !== "undefined" ? window.SupabaseTokenManager : undefined;
(() => {
  // owlbear-extension/popover.js
  var currentCharacter = null;
  var allCharacters = [];
  var isOwlbearReady = false;
  var rollMode = "normal";
  var OWLCLOUD_EXTENSION_ID = "com.owlcloud.extension";
  var dicePlusReady = false;
  var pendingRolls = /* @__PURE__ */ new Map();
  var SUPABASE_URL = "https://luiesmfjdcmpywavvfqm.supabase.co";
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWVzbWZqZGNtcHl3YXZ2ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODYxNDksImV4cCI6MjA4NTQ2MjE0OX0.oqjHFf2HhCLcanh0HVryoQH7iSV7E9dHHZJdYehxZ0U";
  var SUPABASE_HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Content-Type": "application/json"
  };
  var supabase = null;
  var currentUser = null;
  var statusText = document.getElementById("status-text");
  var characterSection = document.getElementById("character-section");
  var noCharacterSection = document.getElementById("no-character-section");
  var characterInfo = document.getElementById("character-info");
  var syncCharacterBtn = document.getElementById("sync-character-btn");
  var openExtensionBtn = document.getElementById("open-extension-btn");
  var linkExtensionBtn = document.getElementById("link-extension-btn");
  var openChatWindowBtn = document.getElementById("open-chat-window-btn");
  var ThemeManager = {
    // Predefined themes
    themes: {
      purple: {
        name: "Purple",
        primary: "#8B5CF6",
        primaryLight: "#A78BFA",
        primaryLighter: "#C4B5FD",
        gradient: "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)",
        background: "rgba(139, 92, 246, 0.1)",
        border: "rgba(139, 92, 246, 0.3)",
        shadow: "rgba(139, 92, 246, 0.4)"
      },
      blue: {
        name: "Blue",
        primary: "#3B82F6",
        primaryLight: "#60A5FA",
        primaryLighter: "#93C5FD",
        gradient: "linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)",
        background: "rgba(59, 130, 246, 0.1)",
        border: "rgba(59, 130, 246, 0.3)",
        shadow: "rgba(59, 130, 246, 0.4)"
      },
      green: {
        name: "Green",
        primary: "#10B981",
        primaryLight: "#34D399",
        primaryLighter: "#6EE7B7",
        gradient: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
        background: "rgba(16, 185, 129, 0.1)",
        border: "rgba(16, 185, 129, 0.3)",
        shadow: "rgba(16, 185, 129, 0.4)"
      },
      red: {
        name: "Red",
        primary: "#EF4444",
        primaryLight: "#F87171",
        primaryLighter: "#FCA5A5",
        gradient: "linear-gradient(135deg, #EF4444 0%, #F87171 100%)",
        background: "rgba(239, 68, 68, 0.1)",
        border: "rgba(239, 68, 68, 0.3)",
        shadow: "rgba(239, 68, 68, 0.4)"
      },
      amber: {
        name: "Amber",
        primary: "#F59E0B",
        primaryLight: "#FBBF24",
        primaryLighter: "#FCD34D",
        gradient: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
        background: "rgba(245, 158, 11, 0.1)",
        border: "rgba(245, 158, 11, 0.3)",
        shadow: "rgba(245, 158, 11, 0.4)"
      }
    },
    // Current active theme
    currentTheme: "purple",
    /**
     * Initialize theme manager
     */
    init() {
      const savedTheme = localStorage.getItem("owlcloud-theme");
      if (savedTheme && this.themes[savedTheme]) {
        this.currentTheme = savedTheme;
      }
      this.applyTheme();
    },
    /**
     * Apply current theme to all elements
     */
    applyTheme() {
      const theme = this.themes[this.currentTheme];
      if (!theme)
        return;
      this.updateCSSVariables(theme);
      this.updateInlineStyles(theme);
      localStorage.setItem("owlcloud-theme", this.currentTheme);
      console.log(`\u{1F3A8} Applied theme: ${theme.name}`);
    },
    /**
     * Update CSS custom properties
     */
    updateCSSVariables(theme) {
      const root = document.documentElement;
      root.style.setProperty("--theme-primary", theme.primary);
      root.style.setProperty("--theme-primary-light", theme.primaryLight);
      root.style.setProperty("--theme-primary-lighter", theme.primaryLighter);
      root.style.setProperty("--theme-gradient", theme.gradient);
      root.style.setProperty("--theme-background", theme.background);
      root.style.setProperty("--theme-border", theme.border);
      root.style.setProperty("--theme-shadow", theme.shadow);
    },
    /**
     * Update inline styles that use hardcoded colors
     */
    updateInlineStyles(theme) {
      this.updateCharacterPortraits(theme);
      this.updateCircularImageBorders(theme);
    },
    /**
     * Update character portrait borders
     */
    updateCharacterPortraits(theme) {
      const portraits = document.querySelectorAll("#settings-portrait, .character-portrait");
      portraits.forEach((portrait) => {
        if (portrait) {
          portrait.style.borderColor = theme.primary;
          portrait.style.boxShadow = `0 4px 12px ${theme.shadow}`;
        }
      });
    },
    /**
     * Update circular image borders (for tokens)
     */
    updateCircularImageBorders(theme) {
    },
    /**
     * Switch to a different theme
     */
    switchTheme(themeName) {
      if (this.themes[themeName]) {
        this.currentTheme = themeName;
        this.applyTheme();
        return true;
      }
      return false;
    },
    /**
     * Get current theme
     */
    getCurrentTheme() {
      return this.themes[this.currentTheme];
    },
    /**
     * Get all available themes
     */
    getAvailableThemes() {
      return Object.keys(this.themes).map((key) => ({
        key,
        ...this.themes[key]
      }));
    }
  };
  function initializeThemeSelector() {
    const themeSelector = document.getElementById("theme-selector");
    if (!themeSelector)
      return;
    const themes = ThemeManager.getAvailableThemes();
    const currentTheme = ThemeManager.getCurrentTheme();
    themes.forEach((theme) => {
      const themeOption = document.createElement("div");
      themeOption.className = `theme-option ${theme.key === ThemeManager.currentTheme ? "active" : ""}`;
      themeOption.dataset.theme = theme.key;
      themeOption.innerHTML = `
      <div class="theme-color-preview" style="background: ${theme.primary}"></div>
      <div class="theme-name">${theme.name}</div>
    `;
      themeOption.addEventListener("click", () => {
        document.querySelectorAll(".theme-option").forEach((opt) => opt.classList.remove("active"));
        themeOption.classList.add("active");
        ThemeManager.switchTheme(theme.key);
      });
      themeSelector.appendChild(themeOption);
    });
  }
  function initializeTabs() {
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");
    const brandingHeader = document.getElementById("branding-header");
    const characterHeader = document.getElementById("character-header");
    const tabsNav = document.querySelector(".tabs-nav");
    if (tabsNav) {
      tabsNav.addEventListener("wheel", (e) => {
        e.preventDefault();
        tabsNav.scrollLeft += e.deltaY;
      });
    }
    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const tabName = button.getAttribute("data-tab");
        tabButtons.forEach((btn) => btn.classList.remove("active"));
        tabContents.forEach((content) => content.classList.remove("active"));
        button.classList.add("active");
        document.getElementById(`tab-${tabName}`).classList.add("active");
        if (tabName === "settings") {
          brandingHeader.style.display = "block";
          characterHeader.style.display = "none";
        } else {
          brandingHeader.style.display = "none";
          characterHeader.style.display = "block";
        }
        console.log(`\u{1F4D1} Switched to tab: ${tabName}`);
      });
    });
  }
  initializeTabs();
  OBR.onReady(async () => {
    isOwlbearReady = true;
    console.log("\u{1F989} Owlbear SDK ready");
    statusText.textContent = "Connected to Owlbear Rodeo";
    const sheetHeight = 460;
    try {
      await OBR.popover.setHeight(sheetHeight);
    } catch (error) {
      console.error("Error setting popover height:", error);
    }
    initializeSupabaseAuth();
    checkForActiveCharacter();
    checkDicePlusReady();
    setupDicePlusListeners();
  });
  async function checkDicePlusReady() {
    if (!isOwlbearReady)
      return;
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      const requestId = `ready_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log("\u{1F50D} Checking for Dice+ extension...");
      let responseReceived = false;
      let unsubscribed = false;
      const debugUnsubscribe = OBR.broadcast.onMessage("*", (event) => {
        if (event.id.includes("dice-plus") || event.id.includes("dice+")) {
          console.log("\u{1F41B} DEBUG - Received broadcast on channel:", event.id, "data:", event.data);
        }
      });
      const unsubscribe = OBR.broadcast.onMessage("dice-plus/isReady", (event) => {
        console.log("\u{1F4E8} Received dice-plus/isReady message:", event.data);
        if (event.data.requestId === requestId) {
          console.log("\u2705 RequestId matches:", requestId);
          if (event.data.ready || event.data.timestamp) {
            responseReceived = true;
            dicePlusReady = true;
            console.log("\u2705 Dice+ broadcast received - 3D dice enabled!");
          }
          if (!unsubscribed) {
            unsubscribed = true;
            unsubscribe();
          }
        } else {
          console.log("\u26A0\uFE0F RequestId mismatch. Expected:", requestId, "Got:", event.data.requestId);
        }
      });
      console.log("\u{1F4E1} Sending dice-plus/isReady broadcast with requestId:", requestId);
      await OBR.broadcast.sendMessage("dice-plus/isReady", {
        requestId,
        timestamp: Date.now()
      }, { destination: "ALL" });
      console.log("\u2705 Broadcast sent, waiting 3 seconds for response...");
      await new Promise((resolve) => setTimeout(resolve, 3e3));
      if (!unsubscribed) {
        unsubscribed = true;
        unsubscribe();
      }
      debugUnsubscribe();
      if (!responseReceived) {
        console.warn("\u26A0\uFE0F Dice+ not detected - 3D dice disabled, using built-in roller");
        dicePlusReady = false;
      }
    } catch (error) {
      console.warn("Failed to check Dice+ status:", error);
      dicePlusReady = false;
    }
  }
  function setupDicePlusListeners() {
    if (!isOwlbearReady)
      return;
    OBR.broadcast.onMessage(`${OWLCLOUD_EXTENSION_ID}/roll-result`, (event) => {
      const { rollId, totalValue, rollSummary, groups } = event.data;
      if (!rollId || totalValue === void 0) {
        console.warn("\u{1F6AB} Invalid roll result structure, ignoring:", event.data);
        return;
      }
      const pendingRoll = pendingRolls.get(rollId);
      if (!pendingRoll) {
        console.warn("Received result for unknown roll:", rollId);
        return;
      }
      pendingRolls.delete(rollId);
      handleDicePlusResult(pendingRoll, totalValue, rollSummary, groups);
    });
    OBR.broadcast.onMessage(`${OWLCLOUD_EXTENSION_ID}/roll-error`, (event) => {
      const { rollId, error } = event.data;
      console.error("Dice+ roll error:", error);
      const pendingRoll = pendingRolls.get(rollId);
      if (pendingRoll) {
        pendingRolls.delete(rollId);
        console.warn("Falling back to built-in dice roller");
        executeLocalRoll(pendingRoll);
      }
    });
    OBR.broadcast.onMessage("dice-plus/roll-result", (event) => {
      console.log("\u{1F4E8} Dice+ roll-result received:", event.data);
      const { result } = event.data;
      if (!result || !result.rollId || result.totalValue === void 0) {
        console.warn("\u{1F6AB} Invalid Dice+ result structure, ignoring:", result);
        return;
      }
      const { rollId, totalValue, rollSummary, groups } = result;
      const pendingRoll = pendingRolls.get(rollId);
      if (!pendingRoll) {
        console.warn("Received result for unknown roll:", rollId);
        return;
      }
      pendingRolls.delete(rollId);
      handleDicePlusResult(pendingRoll, totalValue, rollSummary, groups);
    });
  }
  async function sendToDicePlus(diceNotation, rollContext) {
    console.log("\u{1F3B2} sendToDicePlus called:", { diceNotation, isOwlbearReady, dicePlusReady });
    if (!isOwlbearReady || !dicePlusReady) {
      console.log("\u26A0\uFE0F Falling back to local roll - OBR ready:", isOwlbearReady, "Dice+ ready:", dicePlusReady);
      return null;
    }
    try {
      const rollId = `roll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const playerId = await OBR.player.getId();
      const playerName = await OBR.player.getName();
      pendingRolls.set(rollId, rollContext);
      console.log("\u{1F4E1} Sending roll request to Dice+:", { rollId, diceNotation });
      await OBR.broadcast.sendMessage("dice-plus/roll-request", {
        rollId,
        playerId,
        playerName,
        rollTarget: "everyone",
        // Show to all players
        diceNotation,
        showResults: false,
        // Hide Dice+ popup (OwlCloud chat shows results instead)
        timestamp: Date.now(),
        source: OWLCLOUD_EXTENSION_ID
      }, { destination: "ALL" });
      return rollId;
    } catch (error) {
      console.error("Failed to send to Dice+:", error);
      return null;
    }
  }
  async function handleDicePlusResult(rollContext, totalValue, rollSummary, groups) {
    const { name, modifier, type, isDeathSave, isDamageRoll, actionName, damageFormula } = rollContext;
    console.log("\u{1F3B2} Dice+ result received:", {
      totalValue,
      totalValueType: typeof totalValue,
      rollSummary,
      modifier,
      rollContext
    });
    const numericTotal = typeof totalValue === "number" ? totalValue : parseInt(totalValue) || 0;
    console.log("\u{1F3B2} After parsing:", { numericTotal, modifier, willSubtract: modifier || 0 });
    if (isDeathSave && currentCharacter) {
      const roll = numericTotal;
      let message = "";
      let messageType = "combat";
      if (roll === 20) {
        message = `\u{1F480} Death Save: <strong>20 (Natural 20!)</strong> - Regain 1 HP!`;
        if (!currentCharacter.hitPoints) {
          currentCharacter.hitPoints = { current: 0, max: 0 };
        }
        currentCharacter.hitPoints.current = 1;
        populateStatsTab(currentCharacter);
      } else if (roll === 1) {
        message = `\u{1F480} Death Save: <strong>1 (Natural 1!)</strong> - Two failures!`;
      } else if (roll >= 10) {
        message = `\u{1F480} Death Save: <strong>${roll}</strong> - Success`;
      } else {
        message = `\u{1F480} Death Save: <strong>${roll}</strong> - Failure`;
      }
      if (isOwlbearReady) {
        OBR.notification.show(`${currentCharacter.name}: Death Save = ${roll}`, roll >= 10 ? "SUCCESS" : "ERROR");
      }
      console.log("\u{1F480}", message);
      await addChatMessage(message, messageType, currentCharacter.name);
      return;
    }
    if (isDamageRoll) {
      const rolls = groups && groups[0] ? groups[0].dice.filter((d) => d.kept).map((d) => d.value) : [];
      const message = `${actionName} Damage: <strong>${numericTotal}</strong>`;
      let detailsHtml = `<strong>Formula:</strong> ${damageFormula}<br>
                       <strong>Rolls:</strong> ${rolls.join(", ")}`;
      if (modifier) {
        detailsHtml += `<br>Modifier: ${modifier >= 0 ? "+" : ""}${modifier}`;
      }
      detailsHtml += `<br>Calculation: ${rolls.join(" + ")}`;
      if (modifier) {
        detailsHtml += ` ${modifier >= 0 ? "+" : ""}${modifier}`;
      }
      detailsHtml += ` = ${numericTotal}`;
      if (isOwlbearReady) {
        OBR.notification.show(`${currentCharacter?.name || "Character"}: ${actionName} Damage = ${numericTotal}`, "INFO");
      }
      console.log("\u2694\uFE0F", message);
      await addChatMessage(message, "combat", currentCharacter?.name, detailsHtml);
      return;
    }
    let rawRoll = numericTotal;
    let finalTotal = numericTotal;
    if (rollSummary) {
      const rollMatch = rollSummary.match(/^\[(\d+)\]/);
      if (rollMatch) {
        rawRoll = parseInt(rollMatch[1]);
      }
    }
    finalTotal = numericTotal;
    console.log("\u{1F50D} Dice+ calculation debug:", {
      numericTotal,
      modifier,
      rollContext,
      rollSummary,
      parsedRawRoll: rawRoll,
      finalTotal,
      willCalculateFinal: finalTotal
    });
    const result = {
      total: rawRoll,
      rolls: groups && groups[0] ? groups[0].dice.filter((d) => d.kept).map((d) => d.value) : [rawRoll],
      modifier: modifier || 0,
      formula: rollSummary,
      mode: rollContext.mode || "normal",
      // Override the final calculation in showRollResult
      _overrideFinal: finalTotal
    };
    await showRollResult(name, result);
  }
  async function executeLocalRoll(rollContext) {
    const { name, modifier, type, mode } = rollContext;
    let result;
    if (type === "d20") {
      result = rollD20Local();
    } else {
      result = rollDiceLocal(rollContext.formula);
    }
    result.total += modifier || 0;
    result.modifier = modifier || 0;
    await showRollResult(name, result);
  }
  async function initializeSupabaseAuth() {
    try {
      supabase = window.createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false
        }
      });
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        currentUser = session.user;
        console.log("\u2705 User already signed in:", currentUser.email);
        updateAuthUI();
      } else {
        console.log("\u2139\uFE0F No active session");
        updateAuthUI();
      }
      supabase.auth.onAuthStateChange(async (event, session2) => {
        console.log("\u{1F510} Auth state changed:", event);
        currentUser = session2?.user || null;
        updateAuthUI();
        if (event === "SIGNED_IN") {
          await linkExistingCharacterToUser();
        }
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          checkForActiveCharacter();
        }
      });
    } catch (error) {
      console.error("Failed to initialize Supabase Auth:", error);
    }
  }
  async function signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error)
        throw error;
      console.log("\u2705 Signed in successfully");
      return { success: true };
    } catch (error) {
      console.error("Sign in error:", error);
      return { success: false, error: error.message };
    }
  }
  async function signUp(email, password) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      if (error)
        throw error;
      console.log("\u2705 Signed up successfully");
      return { success: true };
    } catch (error) {
      console.error("Sign up error:", error);
      return { success: false, error: error.message };
    }
  }
  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error)
        throw error;
      console.log("\u2705 Signed out successfully");
      return { success: true };
    } catch (error) {
      console.error("Sign out error:", error);
      return { success: false, error: error.message };
    }
  }
  window.signOut = signOut;
  async function linkExistingCharacterToUser() {
    if (!currentUser)
      return;
    try {
      const playerId = await OBR.player.getId();
      console.log("\u{1F517} Checking for existing character to link...");
      const userCharResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/characters?supabase_user_id=${encodeURIComponent(currentUser.id)}&active_only=true&fields=essential`,
        { headers: SUPABASE_HEADERS }
      );
      if (userCharResponse.ok) {
        const userData = await userCharResponse.json();
        if (userData.success && userData.character) {
          console.log("\u2705 User already has a linked character");
          return;
        }
      }
      const playerCharResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/characters?owlbear_player_id=${encodeURIComponent(playerId)}&active_only=true&fields=full`,
        { headers: SUPABASE_HEADERS }
      );
      if (!playerCharResponse.ok) {
        console.log("\u2139\uFE0F No existing character found to link");
        return;
      }
      const playerData = await playerCharResponse.json();
      if (playerData.success && playerData.character) {
        console.log("\u{1F517} Linking existing character to user account...");
        const character = playerData.character.raw_dicecloud_data || playerData.character;
        const linkResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/characters`,
          {
            method: "POST",
            headers: SUPABASE_HEADERS,
            body: JSON.stringify({
              owlbearPlayerId: playerId,
              supabaseUserId: currentUser.id,
              character
            })
          }
        );
        if (linkResponse.ok) {
          const linkData = await linkResponse.json();
          console.log("\u2705 Character successfully linked to account!", linkData);
          if (isOwlbearReady) {
            OBR.notification.show("Character linked to your account!", "SUCCESS");
          }
          if (linkData.success && linkData.character) {
            const characterData = linkData.character.raw_dicecloud_data || linkData.character;
            const cacheKey = `owlcloud_char_${currentUser.id}`;
            localStorage.setItem(cacheKey, JSON.stringify(characterData));
            displayCharacter(characterData);
            await fetchAllCharacters();
          } else {
            await checkForActiveCharacter();
          }
          updateAuthUI();
        } else {
          const errorText = await linkResponse.text();
          console.error("\u274C Failed to link character:", errorText);
          if (isOwlbearReady) {
            OBR.notification.show("Failed to link character to account", "ERROR");
          }
        }
      }
    } catch (error) {
      console.error("Error linking character to user:", error);
      if (isOwlbearReady) {
        OBR.notification.show("Error linking character: " + (error.message || "Unknown error"), "ERROR");
      }
    }
  }
  function updateAuthUI() {
    const authSection = document.getElementById("auth-section");
    if (!authSection)
      return;
    if (currentUser) {
      authSection.innerHTML = `
      <div style="padding: 16px; background: rgba(139, 92, 246, 0.1); border-radius: 8px; border: 1px solid rgba(139, 92, 246, 0.3);">
        <div style="margin-bottom: 12px;">
          <div style="font-size: 12px; color: #A78BFA; margin-bottom: 4px;">Signed in as</div>
          <div style="font-weight: 600; color: #e0e0e0;">${currentUser.email}</div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button
            onclick="handleFetchCharacter()"
            id="fetch-character-btn"
            style="width: 100%; padding: 8px; background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%); border: none; border-radius: 6px; color: white; font-weight: 600; cursor: pointer; transition: all 0.2s;">
            \u{1F504} Fetch Character
          </button>
          ${currentCharacter ? `
          <button
            onclick="handleUnsyncCharacter()"
            id="unsync-character-btn"
            style="width: 100%; padding: 8px; background: rgba(251, 146, 60, 0.2); border: 1px solid #FB923C; border-radius: 6px; color: #FB923C; font-weight: 600; cursor: pointer; transition: all 0.2s;">
            \u{1F513} Unsync from Owlbear
          </button>
          ` : ""}
          <button
            onclick="signOut()"
            style="width: 100%; padding: 8px; background: rgba(239, 68, 68, 0.2); border: 1px solid #EF4444; border-radius: 6px; color: #EF4444; font-weight: 600; cursor: pointer; transition: all 0.2s;">
            Sign Out
          </button>
        </div>
        <div id="fetch-status" style="margin-top: 8px; font-size: 12px; display: none;"></div>
      </div>
    `;
    } else {
      authSection.innerHTML = `
      <div style="padding: 16px; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.3);">
        <div style="font-weight: 600; color: #A78BFA; font-size: 14px; margin-bottom: 8px;">
          \u{1F510} Cross-Device Character Sync
        </div>
        <div style="margin-bottom: 12px; color: #c0c0c0; font-size: 12px; line-height: 1.4;">
          Create a free account to access your characters from any device. This is separate from your DiceCloud login.
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <input
            type="email"
            id="auth-email"
            placeholder="Email"
            style="padding: 8px 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(138, 92, 246, 0.3); border-radius: 6px; color: #e0e0e0; font-size: 14px;">
          <input
            type="password"
            id="auth-password"
            placeholder="Password (min 6 characters)"
            style="padding: 8px 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(138, 92, 246, 0.3); border-radius: 6px; color: #e0e0e0; font-size: 14px;">
          <div style="display: flex; gap: 8px;">
            <button
              onclick="handleSignIn()"
              style="flex: 1; padding: 8px; background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%); border: none; border-radius: 6px; color: white; font-weight: 600; cursor: pointer; transition: all 0.2s;">
              Sign In
            </button>
            <button
              onclick="handleSignUp()"
              style="flex: 1; padding: 8px; background: rgba(139, 92, 246, 0.2); border: 1px solid #8B5CF6; border-radius: 6px; color: #A78BFA; font-weight: 600; cursor: pointer; transition: all 0.2s;">
              Sign Up
            </button>
          </div>
          <div style="color: #888; font-size: 11px; margin-top: 4px; text-align: center;">
            New? Click <strong>Sign Up</strong> to create an account
          </div>
          <div id="auth-error" style="color: #EF4444; font-size: 12px; margin-top: 4px; display: none;"></div>
        </div>
      </div>
    `;
    }
  }
  window.handleSignIn = async function() {
    const email = document.getElementById("auth-email").value;
    const password = document.getElementById("auth-password").value;
    const errorDiv = document.getElementById("auth-error");
    if (!email || !password) {
      errorDiv.textContent = "Please enter email and password";
      errorDiv.style.display = "block";
      return;
    }
    const result = await signIn(email, password);
    if (!result.success) {
      errorDiv.textContent = result.error;
      errorDiv.style.display = "block";
    }
  };
  window.handleSignUp = async function() {
    const email = document.getElementById("auth-email").value;
    const password = document.getElementById("auth-password").value;
    const errorDiv = document.getElementById("auth-error");
    if (!email || !password) {
      errorDiv.textContent = "Please enter email and password";
      errorDiv.style.display = "block";
      return;
    }
    if (password.length < 6) {
      errorDiv.textContent = "Password must be at least 6 characters";
      errorDiv.style.display = "block";
      return;
    }
    const result = await signUp(email, password);
    if (!result.success) {
      errorDiv.textContent = result.error;
      errorDiv.style.display = "block";
    } else {
      errorDiv.textContent = "Check your email to confirm your account!";
      errorDiv.style.color = "#10B981";
      errorDiv.style.display = "block";
    }
  };
  window.handleFetchCharacter = async function() {
    const fetchBtn = document.getElementById("fetch-character-btn");
    const statusDiv = document.getElementById("fetch-status");
    if (!fetchBtn || !statusDiv)
      return;
    fetchBtn.disabled = true;
    fetchBtn.textContent = "\u23F3 Fetching...";
    statusDiv.style.display = "block";
    statusDiv.style.color = "#A78BFA";
    statusDiv.textContent = "Loading character...";
    try {
      await checkForActiveCharacter();
      statusDiv.style.color = "#10B981";
      statusDiv.textContent = "\u2713 Character loaded successfully!";
      setTimeout(() => {
        statusDiv.style.display = "none";
      }, 3e3);
    } catch (error) {
      console.error("Fetch character error:", error);
      statusDiv.style.color = "#EF4444";
      statusDiv.textContent = `\u2717 Error: ${error.message || "Failed to fetch character"}`;
    } finally {
      fetchBtn.disabled = false;
      fetchBtn.textContent = "\u{1F504} Fetch Character";
    }
  };
  window.handleUnsyncCharacter = async function() {
    if (!currentCharacter) {
      console.warn("No character to unsync");
      return;
    }
    const unsyncBtn = document.getElementById("unsync-character-btn");
    const statusDiv = document.getElementById("fetch-status");
    if (!unsyncBtn || !statusDiv)
      return;
    if (!confirm(`Unsync ${currentCharacter.name} from this Owlbear session?

This will disconnect the character from this room. You can sync a different character afterwards.`)) {
      return;
    }
    unsyncBtn.disabled = true;
    unsyncBtn.textContent = "\u23F3 Unsyncing...";
    statusDiv.style.display = "block";
    statusDiv.style.color = "#FB923C";
    statusDiv.textContent = "Unsyncing character...";
    try {
      const playerId = await OBR.player.getId();
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/unsync-character`,
        {
          method: "POST",
          headers: SUPABASE_HEADERS,
          body: JSON.stringify({
            owlbearPlayerId: playerId,
            supabaseUserId: currentUser?.id
          })
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to unsync: ${errorText}`);
      }
      const result = await response.json();
      if (result.success) {
        console.log("\u2705 Character unsynced successfully");
        const cacheKey = currentUser ? `owlcloud_char_${currentUser.id}` : `owlcloud_char_${playerId}`;
        const versionKey = `${cacheKey}_version`;
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(versionKey);
        currentCharacter = null;
        allCharacters = [];
        statusDiv.style.color = "#10B981";
        statusDiv.textContent = "\u2713 Character unsynced! You can now sync a different character.";
        if (isOwlbearReady) {
          OBR.notification.show("Character unsynced from Owlbear session", "SUCCESS");
        }
        showNoCharacter();
        updateAuthUI();
        setTimeout(() => {
          statusDiv.style.display = "none";
        }, 5e3);
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error) {
      console.error("Unsync error:", error);
      statusDiv.style.color = "#EF4444";
      statusDiv.textContent = `\u2717 Error: ${error.message || "Failed to unsync character"}`;
      if (isOwlbearReady) {
        OBR.notification.show(`Error unsyncing character: ${error.message}`, "ERROR");
      }
      unsyncBtn.disabled = false;
      unsyncBtn.textContent = "\u{1F513} Unsync from Owlbear";
    }
  };
  async function checkForActiveCharacter() {
    try {
      const playerId = await OBR.player.getId();
      let queryParam;
      let cacheKey;
      if (currentUser) {
        queryParam = `supabase_user_id=${encodeURIComponent(currentUser.id)}&active_only=true`;
        cacheKey = `owlcloud_char_${currentUser.id}`;
        console.log("\u{1F3AD} Checking for character with user ID:", currentUser.id);
      } else {
        queryParam = `owlbear_player_id=${encodeURIComponent(playerId)}`;
        cacheKey = `owlcloud_char_${playerId}`;
        console.log("\u{1F3AD} Checking for character with player ID:", playerId);
      }
      const versionKey = `${cacheKey}_version`;
      const cachedChar = localStorage.getItem(cacheKey);
      const cachedVersion = localStorage.getItem(versionKey);
      if (cachedChar) {
        try {
          displayCharacter(JSON.parse(cachedChar));
        } catch (e) {
          console.warn("Failed to parse cached character:", e);
        }
      }
      const headers = { ...SUPABASE_HEADERS };
      if (cachedVersion) {
        headers["If-None-Match"] = cachedVersion;
      }
      const fetchUrl = `${SUPABASE_URL}/functions/v1/characters?${queryParam}&fields=full`;
      console.log("\u{1F310} Fetching character from:", fetchUrl);
      console.log("\u{1F511} Headers:", headers);
      const response = await fetch(fetchUrl, { headers });
      console.log("\u{1F4E1} Response received:", response.status, response.statusText);
      if (response.status === 304) {
        console.log("\u2705 Character unchanged, using cache");
        if (cachedChar) {
          await fetchAllCharacters();
        }
        return;
      }
      if (!response.ok) {
        console.error("Failed to get character:", response.statusText);
        if (!cachedChar) {
          showNoCharacter();
        }
        return;
      }
      const data = await response.json();
      const etag = response.headers.get("etag");
      console.log("\u{1F4E6} Response data:", data);
      if (data.success && data.character) {
        console.log("\u{1F4E6} Character data received:", data.character);
        console.log("  - Has raw_dicecloud_data:", !!data.character.raw_dicecloud_data);
        console.log("  - Has character_name:", !!data.character.character_name);
        let characterData = data.character.raw_dicecloud_data || data.character;
        if (!data.character.raw_dicecloud_data && data.character.character_name) {
          console.log("\u{1F504} Transforming database fields to UI format");
          characterData = {
            ...characterData,
            id: characterData.dicecloud_character_id,
            name: characterData.character_name,
            class: characterData.class,
            race: characterData.race,
            level: characterData.level,
            hitPoints: {
              current: characterData.hp_current || 0,
              max: characterData.hp_max || 0
            },
            armorClass: characterData.armor_class,
            proficiencyBonus: characterData.proficiency_bonus
          };
        }
        console.log("\u2705 Final character data for display:", characterData);
        localStorage.setItem(cacheKey, JSON.stringify(characterData));
        if (etag) {
          localStorage.setItem(versionKey, etag);
        }
        displayCharacter(characterData);
        await fetchAllCharacters();
        updateAuthUI();
      } else {
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(versionKey);
        showNoCharacter();
      }
    } catch (error) {
      console.error("\u274C Error checking for active character:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      showNoCharacter();
    }
  }
  async function fetchAllCharacters() {
    try {
      const playerId = await OBR.player.getId();
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/characters?owlbear_player_id=${encodeURIComponent(playerId)}&fields=list`,
        { headers: SUPABASE_HEADERS }
      );
      if (!response.ok) {
        console.error("Failed to get characters:", response.statusText);
        return;
      }
      const data = await response.json();
      if (data.success && data.characters && data.characters.length > 0) {
        allCharacters = data.characters;
        displayCharacterList();
      }
    } catch (error) {
      console.error("Error fetching all characters:", error);
    }
  }
  function displayCharacterList() {
    const characterListSection = document.getElementById("character-list-section");
    const characterList = document.getElementById("character-list");
    if (!allCharacters || allCharacters.length <= 1) {
      characterListSection.style.display = "none";
      return;
    }
    characterListSection.style.display = "block";
    let html = "";
    allCharacters.forEach((character) => {
      const isActive = currentCharacter && character.id === currentCharacter.id;
      html += `
      <div class="character-list-item ${isActive ? "active" : ""}" onclick="switchToCharacter('${character.id}')">
        <div class="character-list-item-name">${character.name || "Unknown Character"}</div>
        <div class="character-list-item-details">
          Level ${character.level || "?"} ${character.race || ""} ${character.class || ""}
          ${isActive ? "\u2022 Active" : ""}
        </div>
      </div>
    `;
    });
    characterList.innerHTML = html;
  }
  window.switchToCharacter = async function(characterId) {
    try {
      const character = allCharacters.find((c) => c.id === characterId);
      if (!character) {
        console.error("Character not found:", characterId);
        return;
      }
      const playerId = await OBR.player.getId();
      const requestBody = {
        owlbearPlayerId: playerId,
        character
      };
      if (currentUser) {
        requestBody.supabaseUserId = currentUser.id;
      }
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/characters`,
        {
          method: "POST",
          headers: SUPABASE_HEADERS,
          body: JSON.stringify(requestBody)
        }
      );
      const result = await response.json();
      if (response.ok && result.success) {
        displayCharacter(character);
        displayCharacterList();
        updateAuthUI();
        if (isOwlbearReady) {
          OBR.notification.show(`Switched to ${character.name}`, "SUCCESS");
        }
      } else {
        console.error("Failed to switch character:", result.error);
        if (isOwlbearReady) {
          OBR.notification.show("Failed to switch character", "ERROR");
        }
      }
    } catch (error) {
      console.error("Error switching character:", error);
      if (isOwlbearReady) {
        OBR.notification.show("Error switching character", "ERROR");
      }
    }
  };
  function displayCharacter(character) {
    currentCharacter = character;
    characterSection.style.display = "block";
    noCharacterSection.style.display = "none";
    console.log("\u{1F5BC}\uFE0F Checking for portrait in character data:");
    console.log("  character.picture:", character.picture);
    console.log("  character.avatarPicture:", character.avatarPicture);
    console.log("  character.rawDiceCloudData?.creature?.picture:", character.rawDiceCloudData?.creature?.picture);
    console.log("  character.rawDiceCloudData?.creature?.avatarPicture:", character.rawDiceCloudData?.creature?.avatarPicture);
    const portraitUrl = character.picture || character.avatarPicture || character.rawDiceCloudData?.creature?.picture || character.rawDiceCloudData?.creature?.avatarPicture;
    characterInfo.innerHTML = `
    <div style="display: flex; align-items: center; gap: 16px;">
      ${portraitUrl ? `<img id="settings-portrait" src="${portraitUrl}" alt="Character Portrait" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid var(--theme-primary); object-fit: cover; box-shadow: 0 4px 12px var(--theme-shadow);">` : ""}
      <div style="flex: 1;">
        <div class="character-name">${character.name || "Unknown Character"}</div>
        <div class="character-detail">Level ${character.level || "?"} ${character.race || ""} ${character.class || ""}</div>
        <div class="character-detail">HP: ${character.hitPoints?.current || 0} / ${character.hitPoints?.max || 0}</div>
      </div>
    </div>
  `;
    const settingsPortrait = document.getElementById("settings-portrait");
    if (settingsPortrait && portraitUrl) {
      setupPortraitDrag(settingsPortrait, character, portraitUrl);
    }
    const characterHeaderName = document.getElementById("character-header-name");
    const characterHeaderDetails = document.getElementById("character-header-details");
    const characterPortrait = document.getElementById("character-portrait");
    if (characterHeaderName && characterHeaderDetails) {
      characterHeaderName.textContent = character.name || "Unknown Character";
      characterHeaderDetails.textContent = `Level ${character.level || "?"} ${character.race || ""} ${character.class || ""}`;
    }
    if (characterPortrait) {
      if (portraitUrl) {
        characterPortrait.src = portraitUrl;
        characterPortrait.style.display = "block";
        console.log("\u2705 Portrait loaded from:", portraitUrl);
        setupPortraitDrag(characterPortrait, character, portraitUrl);
      } else {
        characterPortrait.style.display = "none";
        console.log("\u274C No portrait found");
      }
    }
    populateStatsTab(character);
    populateAbilitiesTab(character);
    populateFeaturesTab(character);
    populateActionsTab(character);
    populateSpellsTab(character);
    populateInventoryTab(character);
    console.log("\u{1F3AD} Displaying character:", character.name);
  }
  async function uploadCircularTokenToSupabase(dataUrl, characterId) {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const filename = `token-${characterId}-${Date.now()}.png`;
      const formData = new FormData();
      formData.append("file", blob, filename);
      formData.append("characterId", characterId);
      const uploadResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/upload-token-image`,
        {
          method: "POST",
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: formData
        }
      );
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }
      const data = await uploadResponse.json();
      return data.url;
    } catch (error) {
      console.error("Failed to upload token image:", error);
      throw error;
    }
  }
  async function createCircularImage(imageUrl, size) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const borderWidth = Math.max(8, size * 0.04);
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.save();
        const radius = size / 2 - borderWidth / 2;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        const scale = Math.max(size / img.width, size / img.height);
        const x = size / 2 - img.width / 2 * scale;
        const y = size / 2 - img.height / 2 * scale;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        ctx.restore();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
        const theme = ThemeManager.getCurrentTheme();
        ctx.strokeStyle = theme ? theme.primary : "#8B5CF6";
        ctx.lineWidth = borderWidth;
        ctx.stroke();
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => {
        console.warn("Failed to load image for circular crop, using original");
        resolve(imageUrl);
      };
      img.src = imageUrl;
    });
  }
  function setupPortraitDrag(portraitElement, character, portraitUrl) {
    if (!isOwlbearReady)
      return;
    portraitElement.draggable = true;
    portraitElement.style.cursor = "grab";
    portraitElement.title = "Drag to map (GM) or click to add token";
    portraitElement.addEventListener("dragstart", (e) => {
      portraitElement.style.cursor = "grabbing";
      e.dataTransfer.effectAllowed = "copy";
      e.dataTransfer.setData("text/uri-list", portraitUrl);
      e.dataTransfer.setData("text/plain", portraitUrl);
      e.dataTransfer.setData("text/html", `<img src="${portraitUrl}" alt="${character.name}">`);
      e.dataTransfer.setData("DownloadURL", `image/png:${character.name}.png:${portraitUrl}`);
      const img = new Image();
      img.src = portraitUrl;
      e.dataTransfer.setDragImage(portraitElement, 50, 50);
      console.log("\u{1F3A8} Dragging portrait for", character.name, "- URL:", portraitUrl);
    });
    portraitElement.addEventListener("dragend", () => {
      portraitElement.style.cursor = "grab";
    });
    portraitElement.onclick = async (e) => {
      if (e.detail === 0)
        return;
      try {
        console.log("\u{1F3A8} Creating token for", character.name);
        const dpi = await OBR.scene.grid.getDpi();
        console.log("\u{1F3A8} Creating circular token image...");
        const circularDataUrl = await createCircularImage(portraitUrl, dpi * 2);
        console.log("\u{1F4E4} Uploading to Supabase...");
        const circularImageUrl = await uploadCircularTokenToSupabase(circularDataUrl, character.id);
        const playerId = await OBR.player.getId();
        const token = buildImage(
          {
            height: dpi,
            width: dpi,
            url: circularImageUrl,
            mime: "image/png"
          },
          {
            dpi,
            offset: { x: 0, y: 0 }
          }
        ).layer("CHARACTER").locked(false).name(character.name || "Character").plainText(character.name || "Character").metadata({
          owlcloud: {
            characterId: character.id,
            characterName: character.name,
            diceCloudId: character.diceCloudId,
            playerId
          }
        }).build();
        console.log("\u{1F3A8} Token built:", token);
        await OBR.scene.items.addItems([token]);
        OBR.notification.show(`Added ${character.name} to map`, "SUCCESS");
        console.log("\u2705 Token created successfully with metadata:", token.metadata);
      } catch (error) {
        console.error("\u274C Error creating token:", error);
        OBR.notification.show(`Failed to create token: ${error.message}`, "ERROR");
      }
    };
  }
  function populateStatsTab(character) {
    const statsContent = document.getElementById("stats-content");
    const hp = character.hitPoints || {};
    const tempHP = character.temporaryHP || 0;
    const ac = character.armorClass || 10;
    const speed = character.speed || 30;
    const initiative = character.initiative || 0;
    const proficiencyBonus = character.proficiencyBonus || Math.floor((character.level || 1) / 4) + 2;
    let html = `
    <div class="stat-grid">
      <div class="stat-box" style="cursor: pointer;" onclick="adjustHP()" title="Click to adjust HP">
        <div class="stat-label">HP</div>
        <div class="stat-value">${hp.current || 0}</div>
        <div class="stat-modifier">/ ${hp.max || 0}</div>
      </div>

      ${tempHP > 0 ? `
      <div class="stat-box">
        <div class="stat-label">Temp HP</div>
        <div class="stat-value" style="color: #60A5FA;">${tempHP}</div>
      </div>
      ` : ""}

      <div class="stat-box">
        <div class="stat-label">AC</div>
        <div class="stat-value">${ac}</div>
      </div>

      <div class="stat-box">
        <div class="stat-label">Speed</div>
        <div class="stat-value">${speed}</div>
        <div class="stat-modifier">ft</div>
      </div>

      <div class="stat-box" style="cursor: pointer;" onclick="rollInitiative(${initiative})" title="Click to roll initiative">
        <div class="stat-label">Initiative</div>
        <div class="stat-value">${initiative >= 0 ? "+" : ""}${initiative}</div>
      </div>

      <div class="stat-box">
        <div class="stat-label">Prof Bonus</div>
        <div class="stat-value">+${proficiencyBonus}</div>
      </div>
    </div>
  `;
    if (character.hitDice) {
      const hitDice = character.hitDice;
      html += `
      <div class="section-header">Hit Dice</div>
      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-label">Hit Dice</div>
          <div class="stat-value">${hitDice.current || 0}</div>
          <div class="stat-modifier">/ ${hitDice.max || 0} d${hitDice.type || "8"}</div>
        </div>
      </div>
    `;
    }
    if (character.deathSaves && (character.deathSaves.successes > 0 || character.deathSaves.failures > 0)) {
      html += `
      <div class="section-header">Death Saves</div>
      <div class="stat-grid">
        <div class="stat-box" style="border-color: #10B981;">
          <div class="stat-label">Successes</div>
          <div class="stat-value" style="color: #10B981;">${character.deathSaves.successes || 0}</div>
        </div>
        <div class="stat-box" style="border-color: #EF4444;">
          <div class="stat-label">Failures</div>
          <div class="stat-value" style="color: #EF4444;">${character.deathSaves.failures || 0}</div>
        </div>
      </div>
      <button class="rest-btn" onclick="rollDeathSave()" style="margin-top: 8px;">\u{1F480} Roll Death Save</button>
    `;
    }
    const hasSpellSlots = character.spellSlots && Object.keys(character.spellSlots).some(
      (key) => key.includes("Max") && character.spellSlots[key] > 0
    );
    if (hasSpellSlots) {
      html += '<div class="section-header">Spell Slots</div>';
      html += '<div class="spell-slots-grid">';
      for (let level = 1; level <= 9; level++) {
        const current = character.spellSlots[`level${level}SpellSlots`] || 0;
        const max = character.spellSlots[`level${level}SpellSlotsMax`] || 0;
        if (max > 0) {
          html += `
          <div class="slot-card ${current === 0 ? "empty" : ""}" style="cursor: pointer;" onclick="adjustSpellSlot(${level})" title="Click to adjust spell slots">
            <div class="slot-level">Level ${level}</div>
            <div class="slot-count">${current}/${max}</div>
          </div>
        `;
        }
      }
      const pactCurrent = character.spellSlots.pactMagicSlots || 0;
      const pactMax = character.spellSlots.pactMagicSlotsMax || 0;
      const pactLevel = character.spellSlots.pactMagicSlotLevel || 1;
      if (pactMax > 0) {
        html += `
        <div class="slot-card pact-magic ${pactCurrent === 0 ? "empty" : ""}" style="cursor: pointer;" onclick="adjustSpellSlot(null, true)" title="Click to adjust pact magic slots">
          <div class="slot-level">Pact ${pactLevel}</div>
          <div class="slot-count">${pactCurrent}/${pactMax}</div>
        </div>
      `;
      }
      html += "</div>";
    }
    if (character.resources && character.resources.length > 0) {
      const filteredResources = character.resources.filter((r) => {
        if (r.max === 0)
          return false;
        const lowerName = r.name.toLowerCase().trim();
        if (lowerName.includes("lucky point") || lowerName === "lucky")
          return false;
        if (lowerName.includes("hit point") || lowerName === "hp")
          return false;
        if (lowerName === "spell level")
          return false;
        return true;
      });
      if (filteredResources.length > 0) {
        html += '<div class="section-header">Class Resources</div>';
        html += '<div class="resource-grid">';
        filteredResources.forEach((resource) => {
          html += `
          <div class="resource-card" style="cursor: pointer;" onclick="adjustResource('${resource.name.replace(/'/g, "\\'")}') " title="Click to adjust ${resource.name}">
            <div class="resource-name">${resource.name}</div>
            <div class="resource-value">${resource.current || 0}</div>
            <div class="resource-max">/ ${resource.max || 0}</div>
          </div>
        `;
        });
        html += "</div>";
      }
    }
    html += `
    <div class="rest-buttons">
      <button class="rest-btn" onclick="takeShortRest()">
        \u23F8\uFE0F Short Rest
      </button>
      <button class="rest-btn" onclick="takeLongRest()">
        \u{1F6CC} Long Rest
      </button>
    </div>
  `;
    statsContent.innerHTML = html;
  }
  function populateAbilitiesTab(character) {
    const abilitiesContent = document.getElementById("abilities-content");
    const abilityNames = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
    const abilityShortNames = { strength: "STR", dexterity: "DEX", constitution: "CON", intelligence: "INT", wisdom: "WIS", charisma: "CHA" };
    let html = '<div class="section-header">Ability Scores & Saving Throws</div>';
    html += '<div class="ability-grid">';
    abilityNames.forEach((abilityName) => {
      const score = character.attributes?.[abilityName] || 10;
      const modifier = character.attributeMods?.[abilityName] || Math.floor((score - 10) / 2);
      const saveMod = character.savingThrows?.[abilityName] || modifier;
      const isProficient = saveMod !== modifier;
      const abilityLabel = abilityShortNames[abilityName];
      html += `
      <div class="ability-box ${isProficient ? "save-proficient" : ""}">
        <div style="padding: 8px; text-align: center;">
          <div class="ability-name">${abilityLabel}</div>
          <div class="ability-score" style="font-size: 18px; font-weight: bold;">${score}</div>
        </div>
        <div style="display: flex; border-top: 1px solid rgba(139, 92, 246, 0.3);">
          <div style="flex: 1; padding: 6px; cursor: pointer; text-align: center; border-right: 1px solid rgba(139, 92, 246, 0.3);" onclick="event.stopPropagation(); event.preventDefault(); rollAbilityCheck('${abilityLabel}', ${modifier})" title="Roll ${abilityLabel} check">
            <div style="font-size: 11px; color: #A78BFA; pointer-events: none;">Check</div>
            <div style="font-weight: bold; pointer-events: none;">${modifier >= 0 ? "+" : ""}${modifier}</div>
          </div>
          <div style="flex: 1; padding: 6px; cursor: pointer; text-align: center;" onclick="event.stopPropagation(); event.preventDefault(); rollSavingThrow('${abilityLabel}', ${saveMod})" title="Roll ${abilityLabel} save">
            <div style="font-size: 11px; color: ${isProficient ? "#10B981" : "#A78BFA"}; pointer-events: none;">Save</div>
            <div style="font-weight: bold; color: ${isProficient ? "#10B981" : "inherit"}; pointer-events: none;">${saveMod >= 0 ? "+" : ""}${saveMod}</div>
          </div>
        </div>
      </div>
    `;
    });
    html += "</div>";
    if (character.skills && Object.keys(character.skills).length > 0) {
      html += '<div class="section-header">Skills</div>';
      html += '<div class="skill-list">';
      const skillNames = {
        acrobatics: "Acrobatics",
        animalHandling: "Animal Handling",
        arcana: "Arcana",
        athletics: "Athletics",
        deception: "Deception",
        history: "History",
        insight: "Insight",
        intimidation: "Intimidation",
        investigation: "Investigation",
        medicine: "Medicine",
        nature: "Nature",
        perception: "Perception",
        performance: "Performance",
        persuasion: "Persuasion",
        religion: "Religion",
        sleightOfHand: "Sleight of Hand",
        stealth: "Stealth",
        survival: "Survival"
      };
      Object.entries(character.skills).forEach(([skillKey, bonus]) => {
        const skillName = skillNames[skillKey] || skillKey;
        const skillAbilityMap = {
          acrobatics: "dexterity",
          animalHandling: "wisdom",
          arcana: "intelligence",
          athletics: "strength",
          deception: "charisma",
          history: "intelligence",
          insight: "wisdom",
          intimidation: "charisma",
          investigation: "intelligence",
          medicine: "wisdom",
          nature: "intelligence",
          perception: "wisdom",
          performance: "charisma",
          persuasion: "charisma",
          religion: "intelligence",
          sleightOfHand: "dexterity",
          stealth: "dexterity",
          survival: "wisdom"
        };
        const baseAbility = skillAbilityMap[skillKey] || "strength";
        const baseMod = character.attributeMods?.[baseAbility] || 0;
        const profBonus = character.proficiencyBonus || 2;
        let proficiencyClass = "";
        if (bonus === baseMod + profBonus) {
          proficiencyClass = "skill-proficient";
        } else if (bonus === baseMod + profBonus * 2) {
          proficiencyClass = "skill-expert";
        }
        html += `
        <div class="skill-item ${proficiencyClass}" onclick="rollSkillCheck('${skillName}', ${bonus})" title="Click to roll ${skillName}">
          <span class="skill-name">${skillName}</span>
          <span class="skill-bonus">${bonus >= 0 ? "+" : ""}${bonus}</span>
        </div>
      `;
      });
      html += "</div>";
    }
    abilitiesContent.innerHTML = html;
  }
  function populateFeaturesTab(character) {
    const featuresContent = document.getElementById("features-content");
    let html = "";
    if (character.features && character.features.length > 0) {
      const filteredFeatures = character.features.filter((feature) => {
        const name = (feature.name || "").toLowerCase();
        return !name.match(/^spellcasting\s*\[/i) && name !== "spellcasting";
      });
      if (filteredFeatures.length > 0) {
        html += '<div class="feature-list">';
        filteredFeatures.forEach((feature, index) => {
          const featureId = `feature-${index}`;
          const uses = feature.uses;
          let resourceName = null;
          const featureName = (feature.name || "").toLowerCase();
          if (featureName.includes("channel divinity")) {
            resourceName = "Channel Divinity";
          } else if (featureName.includes("ki point") || featureName.includes("ki ")) {
            resourceName = "Ki Points";
          } else if (featureName.includes("bardic inspiration")) {
            resourceName = "Bardic Inspiration";
          } else if (featureName.includes("superiority")) {
            resourceName = "Superiority Dice";
          } else if (featureName.includes("sorcery point")) {
            resourceName = "Sorcery Points";
          }
          let useButtonHtml = "";
          if (uses && uses.value !== void 0) {
            useButtonHtml = `<button class="rest-btn" style="margin-top: 8px; width: 100%;" onclick="event.stopPropagation(); useFeatureWithUses('${(feature.name || "Feature").replace(/'/g, "\\'")}')">\u2728 Use (${uses.value}/${uses.max || uses.value})</button>`;
          } else if (resourceName) {
            useButtonHtml = `<button class="rest-btn" style="margin-top: 8px; width: 100%;" onclick="event.stopPropagation(); useFeature('${(feature.name || "Feature").replace(/'/g, "\\'")}', '${resourceName}')">\u2728 Use</button>`;
          }
          let featureText = "";
          if (feature.summary) {
            featureText += `<div class="feature-description">${feature.summary}</div>`;
          }
          if (feature.description) {
            featureText += `<div class="feature-description">${feature.description}</div>`;
          }
          html += `
          <div class="feature-card">
            <div class="feature-header" onclick="toggleFeatureCard('${featureId}')" style="cursor: pointer;">
              <div class="feature-name">${feature.name || "Unknown Feature"}</div>
              <span class="expand-icon">\u25BC</span>
            </div>
            <div id="${featureId}" class="feature-details">
              ${featureText}
              ${feature.source ? `<div class="feature-metadata"><div class="feature-meta-item"><span class="feature-meta-label">Source:</span> ${feature.source}</div></div>` : ""}
              ${useButtonHtml}
            </div>
          </div>
        `;
        });
        html += "</div>";
      } else {
        html = '<div class="empty-state">No features available</div>';
      }
    } else {
      html = '<div class="empty-state">No features available</div>';
    }
    featuresContent.innerHTML = html;
  }
  function populateActionsTab(character) {
    const actionsContent = document.getElementById("actions-content");
    let html = "";
    if (character.actions && character.actions.length > 0) {
      const deduplicatedActions = deduplicateActions(character.actions);
      html += '<div class="feature-list">';
      deduplicatedActions.forEach((action, index) => {
        const actionId = `action-${index}`;
        const actionType = action.actionType || "Action";
        const damage = action.damage || "";
        const attackRoll = action.attackRoll || "";
        const uses = action.uses;
        let attackBonus = 0;
        if (attackRoll) {
          const bonusMatch = attackRoll.match(/[+-](\d+)/);
          if (bonusMatch) {
            attackBonus = parseInt(bonusMatch[0]);
          }
        }
        let damageFormula = damage;
        const hasAttack = attackRoll && attackRoll.trim();
        const hasDamage = damage && damage.trim();
        let rollButtonHtml = "";
        if (hasAttack || hasDamage) {
          rollButtonHtml = '<div style="display: flex; gap: 8px; margin-top: 8px;">';
          if (hasAttack) {
            rollButtonHtml += `<button class="rest-btn" style="flex: 1;" onclick="event.stopPropagation(); rollAttackOnly('${(action.name || "Action").replace(/'/g, "\\'")}', ${attackBonus})">\u{1F3AF} Attack</button>`;
          }
          if (hasDamage) {
            rollButtonHtml += `<button class="rest-btn" style="flex: 1;" onclick="event.stopPropagation(); rollDamageOnly('${(action.name || "Action").replace(/'/g, "\\'")}', '${damageFormula}')">\u{1F4A5} Damage</button>`;
          }
          rollButtonHtml += "</div>";
        }
        const useButtonHtml = uses && uses.value !== void 0 ? `<button class="rest-btn" style="margin-top: 8px; width: 100%;" onclick="event.stopPropagation(); useAction('${(action.name || "Action").replace(/'/g, "\\'")}')">\u2728 Use</button>` : "";
        const hasRollAction = hasAttack || hasDamage;
        const attackTypePrefix = hasRollAction ? "attack" : "utility";
        const fullActionType = `${attackTypePrefix} | ${actionType.toLowerCase()}`;
        let actionText = "";
        if (action.summary) {
          actionText += `<div class="feature-description">${action.summary}</div>`;
        }
        if (action.description) {
          actionText += `<div class="feature-description">${action.description}</div>`;
        }
        html += `
        <div class="feature-card">
          <div class="feature-header" onclick="toggleFeatureCard('${actionId}')" style="cursor: pointer;">
            <div class="feature-name">${action.name || "Unknown Action"}</div>
            <span class="expand-icon">\u25BC</span>
          </div>
          <div id="${actionId}" class="feature-details">
            <div class="feature-metadata">
              <div class="feature-meta-item"><span class="feature-meta-label">Type:</span> ${fullActionType}</div>
              ${attackRoll ? `<div class="feature-meta-item"><span class="feature-meta-label">Attack:</span> ${attackRoll}</div>` : ""}
              ${damage ? `<div class="feature-meta-item"><span class="feature-meta-label">Damage:</span> ${damage}</div>` : ""}
              ${uses && uses.value !== void 0 ? `<div class="feature-meta-item"><span class="feature-meta-label">Uses:</span> ${uses.value}/${uses.max || uses.value}</div>` : ""}
            </div>
            ${actionText}
            ${rollButtonHtml}
            ${useButtonHtml}
          </div>
        </div>
      `;
      });
      html += "</div>";
    } else {
      html = '<div class="empty-state">No actions available</div>';
    }
    actionsContent.innerHTML = html;
  }
  function deduplicateActions(actions) {
    const normalizeActionName = (name) => {
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
    };
    const deduplicatedActions = [];
    const actionsByNormalizedName = {};
    const sortedActions = [...actions].sort((a, b) => {
      const normA = normalizeActionName(a.name || "");
      const normB = normalizeActionName(b.name || "");
      if (normA !== normB)
        return normA.localeCompare(normB);
      return (a.name || "").length - (b.name || "").length;
    });
    sortedActions.forEach((action) => {
      const normalizedName = normalizeActionName(action.name || "");
      if (!normalizedName)
        return;
      const actionLower = (action.name || "").toLowerCase();
      if (actionLower.includes("divine smite") && actionLower !== "divine smite") {
        return;
      }
      if (!actionsByNormalizedName[normalizedName]) {
        actionsByNormalizedName[normalizedName] = action;
        deduplicatedActions.push(action);
      } else {
        const existing = actionsByNormalizedName[normalizedName];
        if (action.source && !existing.source?.includes(action.source)) {
          existing.source = existing.source ? existing.source + "; " + action.source : action.source;
        }
        if (action.damage && !existing.damage)
          existing.damage = action.damage;
        if (action.attackRoll && !existing.attackRoll)
          existing.attackRoll = action.attackRoll;
        if (action.uses && !existing.uses)
          existing.uses = action.uses;
      }
    });
    return deduplicatedActions;
  }
  function populateSpellsTab(character) {
    const spellsContent = document.getElementById("spells-content");
    if (!character.spells || character.spells.length === 0) {
      spellsContent.innerHTML = '<div class="empty-state">No spells available</div>';
      return;
    }
    const filteredSpells = character.spells.filter((spell) => {
      const spellName = (spell.name || "").toLowerCase();
      if (spellName.includes("divine smite") && spellName !== "divine smite") {
        return false;
      }
      return true;
    });
    const spellsByLevel = {};
    filteredSpells.forEach((spell) => {
      const spellLevel = parseInt(spell.level) || 0;
      const levelKey = spellLevel === 0 ? "Cantrips" : `Level ${spellLevel}`;
      if (!spellsByLevel[levelKey]) {
        spellsByLevel[levelKey] = [];
      }
      spellsByLevel[levelKey].push(spell);
    });
    let html = "";
    const levelOrder = ["Cantrips", "Level 1", "Level 2", "Level 3", "Level 4", "Level 5", "Level 6", "Level 7", "Level 8", "Level 9"];
    levelOrder.forEach((levelKey, index) => {
      if (!spellsByLevel[levelKey])
        return;
      const spells = spellsByLevel[levelKey];
      const spellLevelId = "spell-level-" + index + "-" + Date.now();
      html += `<div class="spell-level-group">`;
      html += `<div class="spell-level-header collapsible" onclick="toggleCollapsible('${spellLevelId}')" style="cursor: pointer; user-select: none; display: flex; justify-content: space-between; align-items: center;">${levelKey} (${spells.length})<span style="font-size: 12px; transition: transform 0.2s ease;">\u25BC</span></div>`;
      html += `<div id="${spellLevelId}" class="collapsible-content">`;
      html += `<div class="spell-list">`;
      spells.forEach((spell, spellIndex) => {
        const spellCardId = `spell-${index}-${spellIndex}`;
        const isConcentration = spell.concentration || false;
        const isRitual = spell.ritual || false;
        const castingTime = spell.castingTime || "";
        const range = spell.range || "";
        const components = spell.components || "";
        const duration = spell.duration || "";
        const spellLevel = parseInt(spell.level) || 0;
        const attackRoll = spell.attackRoll || spell.attack || "";
        const damage = spell.damage || "";
        const healing = spell.healing || "";
        let attackBonus = 0;
        if (attackRoll) {
          const bonusMatch = attackRoll.match(/[+-](\d+)/);
          if (bonusMatch) {
            attackBonus = parseInt(bonusMatch[0]);
          }
        }
        let spellButtonsHtml = '<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">';
        spellButtonsHtml += `<button class="rest-btn" style="flex: 1; min-width: 100px;" onclick="event.stopPropagation(); castSpell('${(spell.name || "Unknown Spell").replace(/'/g, "\\'")}', ${spellLevel})">\u2728 Cast</button>`;
        if (attackRoll && attackRoll.trim()) {
          spellButtonsHtml += `<button class="rest-btn" style="flex: 1; min-width: 100px;" onclick="event.stopPropagation(); rollAttackOnly('${(spell.name || "Unknown Spell").replace(/'/g, "\\'")}', ${attackBonus})">\u{1F3AF} Attack</button>`;
        }
        const spellNameLower = (spell.name || "").toLowerCase();
        const spellTextLower = ((spell.summary || "") + " " + (spell.description || "")).toLowerCase();
        const isHealingSpell = spellNameLower.includes("cure") || spellNameLower.includes("heal") || spellNameLower.includes("restoration") || spellNameLower.includes("revivify") || spellNameLower.includes("regenerate") || spellTextLower.includes("regain") || spellTextLower.includes("regains") || spellTextLower.includes("restores") || spellTextLower.includes("hit points") && !spellTextLower.includes("damage");
        if (damage && damage.trim()) {
          if (isHealingSpell) {
            spellButtonsHtml += `<button class="rest-btn" style="flex: 1; min-width: 100px;" onclick="event.stopPropagation(); rollHealing('${(spell.name || "Unknown Spell").replace(/'/g, "\\'")}', '${damage}')">\u{1F49A} Healing</button>`;
          } else {
            spellButtonsHtml += `<button class="rest-btn" style="flex: 1; min-width: 100px;" onclick="event.stopPropagation(); rollDamageOnly('${(spell.name || "Unknown Spell").replace(/'/g, "\\'")}', '${damage}')">\u{1F4A5} Damage</button>`;
          }
        }
        if (healing && healing.trim()) {
          spellButtonsHtml += `<button class="rest-btn" style="flex: 1; min-width: 100px;" onclick="event.stopPropagation(); rollHealing('${(spell.name || "Unknown Spell").replace(/'/g, "\\'")}', '${healing}')">\u{1F49A} Healing</button>`;
        }
        spellButtonsHtml += "</div>";
        let spellText = "";
        if (spell.summary) {
          spellText += `<div class="spell-description">${spell.summary}</div>`;
        }
        if (spell.description) {
          spellText += `<div class="spell-description">${spell.description}</div>`;
        }
        html += `
        <div class="spell-card ${isConcentration ? "concentration" : ""} ${isRitual ? "ritual" : ""}">
          <div class="spell-card-header" onclick="toggleFeatureCard('${spellCardId}')" style="cursor: pointer;">
            <span class="spell-name">${spell.name || "Unknown Spell"}</span>
            <div class="spell-badges">
              ${isConcentration ? '<span class="spell-concentration-badge">C</span>' : ""}
              ${isRitual ? '<span class="spell-ritual-badge">R</span>' : ""}
              <span class="expand-icon">\u25BC</span>
            </div>
          </div>
          <div id="${spellCardId}" class="spell-details">
            <div class="feature-metadata">
              ${castingTime ? `<div class="feature-meta-item"><span class="feature-meta-label">Casting Time:</span> ${castingTime}</div>` : ""}
              ${range ? `<div class="feature-meta-item"><span class="feature-meta-label">Range:</span> ${range}</div>` : ""}
              ${components ? `<div class="feature-meta-item"><span class="feature-meta-label">Components:</span> ${components}</div>` : ""}
              ${duration ? `<div class="feature-meta-item"><span class="feature-meta-label">Duration:</span> ${duration}</div>` : ""}
              ${isConcentration ? '<div class="feature-meta-item"><span class="feature-meta-label">Concentration:</span> Yes</div>' : ""}
              ${isRitual ? '<div class="feature-meta-item"><span class="feature-meta-label">Ritual:</span> Yes</div>' : ""}
              ${attackRoll ? `<div class="feature-meta-item"><span class="feature-meta-label">Attack:</span> ${attackRoll}</div>` : ""}
              ${damage ? `<div class="feature-meta-item"><span class="feature-meta-label">Damage:</span> ${damage}</div>` : ""}
              ${healing ? `<div class="feature-meta-item"><span class="feature-meta-label">Healing:</span> ${healing}</div>` : ""}
            </div>
            ${spellText}
            ${spellButtonsHtml}
          </div>
        </div>
      `;
      });
      html += `</div></div></div>`;
    });
    spellsContent.innerHTML = html;
  }
  function populateInventoryTab(character) {
    const inventoryContent = document.getElementById("inventory-content");
    if (!character.inventory || character.inventory.length === 0) {
      inventoryContent.innerHTML = '<div class="empty-state">No items in inventory</div>';
      return;
    }
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
    const filteredInventory = character.inventory.filter((item) => {
      const lowerName = (item.name || "").toLowerCase();
      const isCoin = coinPatterns.some((pattern) => {
        if (pattern.length <= 2) {
          return lowerName === pattern || lowerName === pattern + "s" || lowerName.match(new RegExp(`^\\d+\\s*${pattern}s?$`));
        }
        return lowerName.includes(pattern);
      });
      return !isCoin;
    });
    if (filteredInventory.length === 0) {
      inventoryContent.innerHTML = '<div class="empty-state">No items in inventory</div>';
      return;
    }
    filteredInventory.sort((a, b) => {
      if (a.equipped && !b.equipped)
        return -1;
      if (!a.equipped && b.equipped)
        return 1;
      return (a.name || "").localeCompare(b.name || "");
    });
    let html = '<div class="inventory-grid">';
    filteredInventory.forEach((item) => {
      const itemClass = item.equipped ? "equipped" : item.attuned ? "attuned" : "";
      const tags = [];
      if (item.equipped)
        tags.push("Equipped");
      if (item.attuned)
        tags.push("Attuned");
      if (item.type)
        tags.push(item.type);
      html += `
      <div class="item-card ${itemClass}">
        <div class="item-info">
          <div class="item-name">
            ${item.name || "Unknown Item"}
            ${item.quantity > 1 ? `<span class="item-quantity">\xD7${item.quantity}</span>` : ""}
          </div>
          ${tags.length > 0 ? `<div class="item-tags">${tags.join(" \u2022 ")}</div>` : ""}
        </div>
      </div>
    `;
    });
    html += "</div>";
    inventoryContent.innerHTML = html;
  }
  function showNoCharacter() {
    characterSection.style.display = "none";
    noCharacterSection.style.display = "block";
    statusText.textContent = "No character selected";
  }
  syncCharacterBtn.addEventListener("click", () => {
    const message = {
      type: "OWLCLOUD_SYNC_CHARACTER",
      source: "owlbear-extension"
    };
    window.parent.postMessage(message, "https://www.owlbear.rodeo");
    if (isOwlbearReady) {
      OBR.notification.show("Syncing character from DiceCloud...", "INFO");
    }
    statusText.textContent = "Syncing character...";
    setTimeout(checkForActiveCharacter, 2e3);
  });
  openExtensionBtn.addEventListener("click", () => {
    const message = {
      type: "OWLCLOUD_OPEN_POPUP",
      source: "owlbear-extension"
    };
    window.parent.postMessage(message, "https://www.owlbear.rodeo");
    alert("Please click the OwlCloud extension icon in your browser toolbar to select a character.");
  });
  var isChatOpen = false;
  openChatWindowBtn.addEventListener("click", async () => {
    if (!isOwlbearReady) {
      alert("Owlbear SDK not ready. Please wait a moment and try again.");
      return;
    }
    if (isChatOpen) {
      await OBR.popover.close("com.owlcloud.chat");
      isChatOpen = false;
      openChatWindowBtn.textContent = "\u{1F4AC} Open Chat Window";
    } else {
      const chatHeight = 460;
      await OBR.popover.open({
        id: "com.owlcloud.chat",
        url: "/extension/owlbear-extension/chat.html",
        height: chatHeight,
        width: 400,
        anchorOrigin: { horizontal: "LEFT", vertical: "BOTTOM" },
        transformOrigin: { horizontal: "LEFT", vertical: "BOTTOM" },
        disableClickAway: true
      });
      isChatOpen = true;
      openChatWindowBtn.textContent = "\u{1F4AC} Close Chat Window";
    }
  });
  linkExtensionBtn.addEventListener("click", async () => {
    try {
      if (!isOwlbearReady) {
        alert("Owlbear SDK not ready. Please wait a moment and try again.");
        return;
      }
      const playerId = await OBR.player.getId();
      console.log("\u{1F517} Linking player ID:", playerId);
      const dicecloudUserId = prompt(
        "Enter your DiceCloud User ID:\n\nYou can find this in the OwlCloud extension popup after syncing a character.\nIt looks like: aBcDeFgHiJkLmNoP1"
      );
      if (!dicecloudUserId || dicecloudUserId.trim() === "") {
        return;
      }
      linkExtensionBtn.textContent = "\u23F3 Linking...";
      linkExtensionBtn.disabled = true;
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/link-owlbear-player`,
        {
          method: "POST",
          headers: SUPABASE_HEADERS,
          body: JSON.stringify({
            owlbearPlayerId: playerId,
            dicecloudUserId: dicecloudUserId.trim()
          })
        }
      );
      const result = await response.json();
      if (response.ok && result.success) {
        alert(`\u2705 Successfully linked! ${result.linkedCharacters} character(s) are now connected to Owlbear.`);
        checkForActiveCharacter();
      } else {
        alert(`\u274C Linking failed: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error linking to extension:", error);
      alert(`\u274C Error: ${error.message}`);
    } finally {
      linkExtensionBtn.textContent = "\u{1F517} Link to Browser Extension";
      linkExtensionBtn.disabled = false;
    }
  });
  window.addEventListener("message", (event) => {
    if (event.origin !== "https://www.owlbear.rodeo") {
      return;
    }
    const { type, data } = event.data;
    switch (type) {
      case "OWLCLOUD_ACTIVE_CHARACTER_RESPONSE":
        if (data && data.character) {
          displayCharacter(data.character);
          updateAuthUI();
        } else {
          showNoCharacter();
        }
        break;
      case "OWLCLOUD_CHARACTER_UPDATED":
        if (data && data.character) {
          displayCharacter(data.character);
          updateAuthUI();
          if (isOwlbearReady) {
            OBR.notification.show(`Character updated: ${data.character.name}`, "SUCCESS");
          }
        }
        break;
      case "OWLCLOUD_SYNC_COMPLETE":
        if (isOwlbearReady) {
          OBR.notification.show("Character synced successfully", "SUCCESS");
        }
        statusText.textContent = "Connected to Owlbear Rodeo";
        checkForActiveCharacter();
        break;
      case "OWLCLOUD_ERROR":
        if (isOwlbearReady) {
          OBR.notification.show(`Error: ${data.message}`, "ERROR");
        }
        statusText.textContent = `Error: ${data.message}`;
        break;
      default:
        break;
    }
  });
  function postRollToOwlbear(rollData) {
    if (!isOwlbearReady) {
      console.warn("Owlbear not ready, cannot post roll");
      return;
    }
    const rollResult = rollData.result || "?";
    const rollName = rollData.name || "Roll";
    const characterName = rollData.characterName || "Unknown";
    OBR.notification.show(
      `${characterName} rolled ${rollName}: ${rollResult}`,
      "INFO"
    );
    console.log("\u{1F3B2} Roll posted to Owlbear:", rollData);
  }
  window.addEventListener("message", (event) => {
    if (event.origin !== "https://www.owlbear.rodeo") {
      return;
    }
    if (event.data.type === "OWLCLOUD_POST_ROLL") {
      postRollToOwlbear(event.data.data);
    }
  });
  async function addChatMessage(text, type = "system", author = null, details = null) {
    if (!isOwlbearReady)
      return;
    try {
      const playerId = await OBR.player.getId();
      const metadata = await OBR.room.getMetadata();
      const messages = metadata["com.owlcloud.chat/messages"] || [];
      const plainText = text.replace(/<[^>]*>/g, "");
      const truncatedText = plainText.length > 500 ? plainText.substring(0, 497) + "..." : plainText;
      let truncatedDetails = null;
      if (details) {
        const plainDetails = details.replace(/<[^>]*>/g, "");
        truncatedDetails = plainDetails.length > 300 ? plainDetails.substring(0, 297) + "..." : plainDetails;
      }
      const newMessage = {
        id: Date.now() + Math.random(),
        text: truncatedText,
        type,
        author: author || (currentCharacter ? currentCharacter.name : "Character"),
        playerId,
        timestamp: Date.now(),
        details: truncatedDetails
        // Optional expandable details (truncated)
      };
      const thirtyMinutesAgo = Date.now() - 30 * 60 * 1e3;
      const recentMessages = messages.filter((msg) => msg.timestamp > thirtyMinutesAgo);
      const updatedMessages = [...recentMessages, newMessage].slice(-10);
      await OBR.room.setMetadata({
        "com.owlcloud.chat/messages": updatedMessages
      });
      console.log("\u{1F4E8} Chat message added:", text);
    } catch (error) {
      console.error("Error adding chat message:", error);
    }
  }
  window.setRollMode = async function(mode) {
    rollMode = mode;
    document.querySelectorAll(".roll-mode-btn").forEach((btn) => btn.classList.remove("active"));
    if (mode === "advantage") {
      document.getElementById("roll-advantage-btn")?.classList.add("active");
    } else if (mode === "disadvantage") {
      document.getElementById("roll-disadvantage-btn")?.classList.add("active");
    } else {
      document.getElementById("roll-normal-btn")?.classList.add("active");
    }
    if (isOwlbearReady) {
      try {
        await OBR.player.setMetadata({
          "owlcloud.rollMode": mode
        });
      } catch (error) {
        console.error("Failed to set roll mode metadata:", error);
      }
    }
  };
  async function rollD20(name, modifier = 0) {
    let diceNotation;
    if (rollMode === "advantage") {
      diceNotation = "2d20kh1";
    } else if (rollMode === "disadvantage") {
      diceNotation = "2d20kl1";
    } else {
      diceNotation = "1d20";
    }
    if (modifier !== 0) {
      diceNotation += (modifier >= 0 ? "+" : "") + modifier;
    }
    const rollContext = {
      name,
      modifier,
      type: "d20",
      mode: rollMode
    };
    const rollId = await sendToDicePlus(diceNotation, rollContext);
    if (rollId) {
      return { pending: true, rollId };
    }
    return rollD20Local();
  }
  function rollD20Local() {
    if (rollMode === "advantage") {
      const roll1 = Math.floor(Math.random() * 20) + 1;
      const roll2 = Math.floor(Math.random() * 20) + 1;
      const total = Math.max(roll1, roll2);
      return { total, rolls: [roll1, roll2], modifier: 0, formula: "2d20 (advantage)", count: 2, sides: 20, mode: "advantage" };
    } else if (rollMode === "disadvantage") {
      const roll1 = Math.floor(Math.random() * 20) + 1;
      const roll2 = Math.floor(Math.random() * 20) + 1;
      const total = Math.min(roll1, roll2);
      return { total, rolls: [roll1, roll2], modifier: 0, formula: "2d20 (disadvantage)", count: 2, sides: 20, mode: "disadvantage" };
    } else {
      const roll = Math.floor(Math.random() * 20) + 1;
      return { total: roll, rolls: [roll], modifier: 0, formula: "1d20", count: 1, sides: 20, mode: "normal" };
    }
  }
  async function rollDice(formula, name, modifier = 0) {
    const rollContext = {
      name,
      modifier,
      formula,
      type: "custom"
    };
    const rollId = await sendToDicePlus(formula, rollContext);
    if (rollId) {
      return { pending: true, rollId };
    }
    return rollDiceLocal(formula);
  }
  function rollDiceLocal(formula) {
    const match = formula.match(/(\d+)?d(\d+)([+-]\d+)?/i);
    if (!match) {
      console.error("Invalid dice formula:", formula);
      return { total: 0, rolls: [], formula };
    }
    const count = parseInt(match[1] || "1");
    const sides = parseInt(match[2]);
    const modifier = parseInt(match[3] || "0");
    const rolls = [];
    let total = modifier;
    for (let i = 0; i < count; i++) {
      const roll = Math.floor(Math.random() * sides) + 1;
      rolls.push(roll);
      total += roll;
    }
    return { total, rolls, modifier, formula, count, sides };
  }
  async function showRollResult(name, result) {
    let detailsHtml = "";
    const finalTotal = result._overrideFinal !== void 0 ? result._overrideFinal : result.modifier !== void 0 ? result.total + result.modifier : result.total;
    console.log("\u{1F50D} showRollResult debug:", {
      name,
      resultTotal: result.total,
      resultModifier: result.modifier,
      overrideFinal: result._overrideFinal,
      calculatedFinalTotal: finalTotal
    });
    if (result.mode === "advantage" && result.rolls.length === 2) {
      detailsHtml = `<strong>Advantage:</strong> Rolled 2d20, taking higher<br>
                   Roll 1: ${result.rolls[0]}<br>
                   Roll 2: ${result.rolls[1]}<br>
                   <strong>Selected:</strong> ${result.total}`;
      if (result.modifier !== 0) {
        detailsHtml += `<br><strong>Modifier:</strong> ${result.modifier >= 0 ? "+" : ""}${result.modifier}`;
      }
      detailsHtml += `<br><strong>Formula:</strong> ${result.total}`;
      if (result.modifier !== 0) {
        detailsHtml += ` ${result.modifier >= 0 ? "+" : ""}${result.modifier}`;
      }
      detailsHtml += ` = ${finalTotal}`;
    } else if (result.mode === "disadvantage" && result.rolls.length === 2) {
      detailsHtml = `<strong>Disadvantage:</strong> Rolled 2d20, taking lower<br>
                   Roll 1: ${result.rolls[0]}<br>
                   Roll 2: ${result.rolls[1]}<br>
                   <strong>Selected:</strong> ${result.total}`;
      if (result.modifier !== 0) {
        detailsHtml += `<br><strong>Modifier:</strong> ${result.modifier >= 0 ? "+" : ""}${result.modifier}`;
      }
      detailsHtml += `<br><strong>Formula:</strong> ${result.total}`;
      if (result.modifier !== 0) {
        detailsHtml += ` ${result.modifier >= 0 ? "+" : ""}${result.modifier}`;
      }
      detailsHtml += ` = ${finalTotal}`;
    } else {
      detailsHtml = `<strong>Roll:</strong> 1d20 = ${result.rolls[0]}`;
      if (result.modifier !== 0) {
        detailsHtml += `<br><strong>Modifier:</strong> ${result.modifier >= 0 ? "+" : ""}${result.modifier}`;
      }
      detailsHtml += `<br><strong>Formula:</strong> ${result.rolls[0]}`;
      if (result.modifier !== 0) {
        detailsHtml += ` ${result.modifier >= 0 ? "+" : ""}${result.modifier}`;
      }
      detailsHtml += ` = ${finalTotal}`;
    }
    const modText = result.modifier !== 0 && !name.includes(`(${result.modifier >= 0 ? "+" : ""}${result.modifier})`) ? ` (${result.modifier >= 0 ? "+" : ""}${result.modifier})` : "";
    const message = `${name}${modText}: <strong>${finalTotal}</strong>`;
    if (isOwlbearReady) {
      OBR.notification.show(`${currentCharacter?.name || "Character"}: ${name} = ${finalTotal}`, "INFO");
    }
    console.log("\u{1F3B2}", message);
    await addChatMessage(message, "roll", currentCharacter?.name, detailsHtml);
  }
  window.rollAbilityCheck = async function(abilityName, modifier) {
    console.log("\u{1F3B2} rollAbilityCheck called:", abilityName, modifier);
    const name = `${abilityName} Check (${modifier >= 0 ? "+" : ""}${modifier})`;
    const result = await rollD20(name, modifier);
    if (result.pending)
      return;
    const total = result.total + modifier;
    await showRollResult(name, { ...result, total, modifier });
  };
  window.rollSavingThrow = async function(abilityName, modifier) {
    console.log("\u{1F3B2} rollSavingThrow called:", abilityName, modifier);
    const name = `${abilityName} Save (${modifier >= 0 ? "+" : ""}${modifier})`;
    const result = await rollD20(name, modifier);
    if (result.pending)
      return;
    const total = result.total + modifier;
    await showRollResult(name, { ...result, total, modifier });
  };
  window.rollSkillCheck = async function(skillName, bonus) {
    const name = `${skillName} (${bonus >= 0 ? "+" : ""}${bonus})`;
    const result = await rollD20(name, bonus);
    if (result.pending)
      return;
    const total = result.total + bonus;
    await showRollResult(name, { ...result, total, modifier: bonus });
  };
  window.rollInitiative = async function(initiativeBonus) {
    const name = `Initiative (${initiativeBonus >= 0 ? "+" : ""}${initiativeBonus})`;
    const result = await rollD20(name, initiativeBonus);
    if (result.pending)
      return;
    const total = result.total + initiativeBonus;
    await showRollResult(name, { ...result, total, modifier: initiativeBonus });
  };
  window.rollDeathSave = async function() {
    if (!currentCharacter)
      return;
    const result = await rollDice("1d20", "Death Save", 0);
    if (result.pending) {
      const rollContext = pendingRolls.get(result.rollId);
      if (rollContext) {
        rollContext.isDeathSave = true;
      }
      return;
    }
    const roll = result.total;
    let message = "";
    let messageType = "combat";
    if (roll === 20) {
      message = `\u{1F480} Death Save: <strong>20 (Natural 20!)</strong> - Regain 1 HP!`;
      if (!currentCharacter.hitPoints) {
        currentCharacter.hitPoints = { current: 0, max: 0 };
      }
      currentCharacter.hitPoints.current = 1;
      populateStatsTab(currentCharacter);
    } else if (roll === 1) {
      message = `\u{1F480} Death Save: <strong>1 (Natural 1!)</strong> - Two failures!`;
    } else if (roll >= 10) {
      message = `\u{1F480} Death Save: <strong>${roll}</strong> - Success`;
    } else {
      message = `\u{1F480} Death Save: <strong>${roll}</strong> - Failure`;
    }
    if (isOwlbearReady) {
      OBR.notification.show(`${currentCharacter.name}: Death Save = ${roll}`, roll >= 10 ? "SUCCESS" : "ERROR");
    }
    console.log("\u{1F480}", message);
    await addChatMessage(message, messageType, currentCharacter.name);
  };
  window.rollAttackOnly = async function(actionName, attackBonus) {
    const bonusText = attackBonus ? ` (+${attackBonus})` : "";
    const name = `${actionName} Attack${bonusText}`;
    const attackRoll = await rollD20(name, attackBonus || 0);
    if (attackRoll.pending)
      return;
    const attackTotal = attackRoll.total + (attackBonus || 0);
    const message = `${actionName} Attack${bonusText}: <strong>${attackTotal}</strong>`;
    let detailsHtml = "";
    if (attackRoll.mode === "advantage" && attackRoll.rolls.length === 2) {
      detailsHtml = `<strong>Advantage:</strong> Rolled 2d20, taking higher<br>
                   Roll 1: ${attackRoll.rolls[0]}<br>
                   Roll 2: ${attackRoll.rolls[1]}<br>
                   <strong>Selected:</strong> ${attackRoll.total}`;
    } else if (attackRoll.mode === "disadvantage" && attackRoll.rolls.length === 2) {
      detailsHtml = `<strong>Disadvantage:</strong> Rolled 2d20, taking lower<br>
                   Roll 1: ${attackRoll.rolls[0]}<br>
                   Roll 2: ${attackRoll.rolls[1]}<br>
                   <strong>Selected:</strong> ${attackRoll.total}`;
    } else {
      detailsHtml = `<strong>Attack Roll:</strong> 1d20 = ${attackRoll.rolls[0]}`;
    }
    if (attackBonus) {
      detailsHtml += `<br><strong>Attack Bonus:</strong> +${attackBonus}`;
    }
    detailsHtml += `<br><strong>Formula:</strong> ${attackRoll.total}`;
    if (attackBonus) {
      detailsHtml += ` + ${attackBonus}`;
    }
    detailsHtml += ` = ${attackTotal}`;
    if (isOwlbearReady) {
      OBR.notification.show(`${currentCharacter?.name || "Character"}: ${actionName} Attack = ${attackTotal}`, "INFO");
    }
    console.log("\u2694\uFE0F", message);
    await addChatMessage(message, "action", currentCharacter?.name, detailsHtml);
  };
  window.rollDamageOnly = async function(actionName, damageFormula) {
    if (!damageFormula || !damageFormula.trim())
      return;
    const name = `${actionName} Damage`;
    const damageRoll = await rollDice(damageFormula, name, 0);
    if (damageRoll.pending) {
      const rollContext = pendingRolls.get(damageRoll.rollId);
      if (rollContext) {
        rollContext.isDamageRoll = true;
        rollContext.actionName = actionName;
        rollContext.damageFormula = damageFormula;
      }
      return;
    }
    const message = `${actionName} Damage: <strong>${damageRoll.total}</strong>`;
    let detailsHtml = `<strong>Formula:</strong> ${damageFormula}<br>
                     <strong>Rolls:</strong> ${damageRoll.rolls.join(", ")}`;
    if (damageRoll.modifier) {
      detailsHtml += `<br>Modifier: ${damageRoll.modifier >= 0 ? "+" : ""}${damageRoll.modifier}`;
    }
    detailsHtml += `<br>Calculation: ${damageRoll.rolls.join(" + ")}`;
    if (damageRoll.modifier) {
      detailsHtml += ` ${damageRoll.modifier >= 0 ? "+" : ""}${damageRoll.modifier}`;
    }
    detailsHtml += ` = ${damageRoll.total}`;
    if (isOwlbearReady) {
      OBR.notification.show(`${currentCharacter?.name || "Character"}: ${actionName} Damage = ${damageRoll.total}`, "INFO");
    }
    console.log("\u2694\uFE0F", message);
    await addChatMessage(message, "damage", currentCharacter?.name, detailsHtml);
  };
  window.rollHealing = async function(spellName, healingFormula) {
    if (!healingFormula || !healingFormula.trim())
      return;
    const healingRoll = rollDice(healingFormula);
    const message = `${spellName} Healing: <strong>${healingRoll.total}</strong>`;
    let detailsHtml = `<strong>Formula:</strong> ${healingFormula}<br>
                     <strong>Rolls:</strong> ${healingRoll.rolls.join(", ")}`;
    if (healingRoll.modifier) {
      detailsHtml += `<br>Modifier: ${healingRoll.modifier >= 0 ? "+" : ""}${healingRoll.modifier}`;
    }
    detailsHtml += `<br>Calculation: ${healingRoll.rolls.join(" + ")}`;
    if (healingRoll.modifier) {
      detailsHtml += ` ${healingRoll.modifier >= 0 ? "+" : ""}${healingRoll.modifier}`;
    }
    detailsHtml += ` = ${healingRoll.total}`;
    if (isOwlbearReady) {
      OBR.notification.show(`${currentCharacter?.name || "Character"}: ${spellName} Healing = ${healingRoll.total}`, "INFO");
    }
    console.log("\u{1F49A}", message);
    await addChatMessage(message, "healing", currentCharacter?.name, detailsHtml);
  };
  window.rollAttack = async function(actionName, attackBonus, damageFormula) {
    await rollAttackOnly(actionName, attackBonus);
    if (damageFormula && damageFormula.trim()) {
      await rollDamageOnly(actionName, damageFormula);
    }
  };
  window.castSpell = async function(spellName, level) {
    if (!currentCharacter)
      return;
    if (level > 0) {
      if (!currentCharacter.spellSlots) {
        console.warn("No spell slots available on character");
        return;
      }
      const slotKey2 = `level${level}SpellSlots`;
      const current = currentCharacter.spellSlots[slotKey2] || 0;
      if (current === 0) {
        if (isOwlbearReady) {
          OBR.notification.show(`No Level ${level} spell slots remaining!`, "ERROR");
        }
        return;
      }
      currentCharacter.spellSlots[slotKey2] = current - 1;
      populateStatsTab(currentCharacter);
    }
    const levelText = level === 0 ? "Cantrip" : `Level ${level} Spell`;
    const message = `\u2728 Casts <strong>${spellName}</strong> (${levelText})`;
    let details = `<strong>${spellName}</strong><br>${levelText}`;
    if (level > 0 && slotKey) {
      const remaining = currentCharacter.spellSlots[slotKey] || 0;
      details += `<br>Spell Slot Used: Level ${level}<br>Remaining Slots: ${remaining}`;
    }
    if (isOwlbearReady) {
      OBR.notification.show(`${currentCharacter?.name || "Character"} casts ${spellName}`, "INFO");
    }
    console.log("\u2728", message);
    await addChatMessage(message, "spell", currentCharacter?.name, details);
  };
  window.adjustHP = async function() {
    if (!currentCharacter)
      return;
    console.log("\u{1FA7A} adjustHP called, current character:", currentCharacter.name);
    console.log("  Current HP object:", currentCharacter.hitPoints);
    const currentHP = currentCharacter.hitPoints?.current || 0;
    const maxHP = currentCharacter.hitPoints?.max || 0;
    const adjustment = prompt(`Current HP: ${currentHP}/${maxHP}

Enter HP adjustment (negative for damage, positive for healing):`);
    if (adjustment === null)
      return;
    const amount = parseInt(adjustment);
    if (isNaN(amount))
      return;
    const newHP = Math.max(0, Math.min(maxHP, currentHP + amount));
    console.log(`  Adjustment: ${amount}, New HP: ${newHP}/${maxHP}`);
    if (!currentCharacter.hitPoints) {
      currentCharacter.hitPoints = { current: 0, max: 0 };
    }
    currentCharacter.hitPoints.current = newHP;
    console.log("  Updated currentCharacter.hitPoints:", currentCharacter.hitPoints);
    const message = amount > 0 ? `${currentCharacter.name} heals ${amount} HP (${newHP}/${maxHP})` : `${currentCharacter.name} takes ${Math.abs(amount)} damage (${newHP}/${maxHP})`;
    if (isOwlbearReady) {
      OBR.notification.show(message, amount > 0 ? "SUCCESS" : "WARNING");
    }
    const messageType = amount > 0 ? "healing" : "damage";
    console.log("  Sending message to chat:", message);
    await addChatMessage(message, messageType, currentCharacter.name);
    console.log("  Re-rendering stats tab with currentCharacter:", currentCharacter.hitPoints);
    populateStatsTab(currentCharacter);
  };
  window.adjustSpellSlot = function(level, isPactMagic = false) {
    if (!currentCharacter || !currentCharacter.spellSlots)
      return;
    const slotKey2 = isPactMagic ? "pactMagicSlots" : `level${level}SpellSlots`;
    const maxKey = isPactMagic ? "pactMagicSlotsMax" : `level${level}SpellSlotsMax`;
    const current = currentCharacter.spellSlots[slotKey2] || 0;
    const max = currentCharacter.spellSlots[maxKey] || 0;
    const slotName = isPactMagic ? `Pact Magic` : `Level ${level} Spell Slot`;
    const adjustment = prompt(`${slotName}: ${current}/${max}

Enter adjustment (negative to use, positive to restore):`);
    if (adjustment === null)
      return;
    const amount = parseInt(adjustment);
    if (isNaN(amount))
      return;
    const newCount = Math.max(0, Math.min(max, current + amount));
    currentCharacter.spellSlots[slotKey2] = newCount;
    populateStatsTab(currentCharacter);
    if (isOwlbearReady) {
      const message = amount > 0 ? `Restored ${amount} ${slotName}` : `Used ${Math.abs(amount)} ${slotName}`;
      OBR.notification.show(message, "INFO");
    }
  };
  window.adjustResource = function(resourceName) {
    if (!currentCharacter || !currentCharacter.resources)
      return;
    const resource = currentCharacter.resources.find((r) => r.name === resourceName);
    if (!resource)
      return;
    const current = resource.current || 0;
    const max = resource.max || 0;
    const adjustment = prompt(`${resourceName}: ${current}/${max}

Enter adjustment (negative to use, positive to restore):`);
    if (adjustment === null)
      return;
    const amount = parseInt(adjustment);
    if (isNaN(amount))
      return;
    const newCount = Math.max(0, Math.min(max, current + amount));
    resource.current = newCount;
    populateStatsTab(currentCharacter);
    if (isOwlbearReady) {
      const message = amount > 0 ? `Restored ${amount} ${resourceName}` : `Used ${Math.abs(amount)} ${resourceName}`;
      OBR.notification.show(message, "INFO");
    }
  };
  window.useFeature = async function(featureName, resourceName = null) {
    if (!currentCharacter)
      return;
    if (resourceName && currentCharacter.resources) {
      const resource = currentCharacter.resources.find((r) => r.name === resourceName);
      if (resource && resource.current > 0) {
        resource.current -= 1;
        populateStatsTab(currentCharacter);
      } else if (resource && resource.current === 0) {
        if (isOwlbearReady) {
          OBR.notification.show(`No ${resourceName} remaining!`, "ERROR");
        }
        return;
      }
    }
    const message = `\u2728 Uses <strong>${featureName}</strong>${resourceName ? ` (${resourceName})` : ""}`;
    await addChatMessage(message, "action", currentCharacter.name);
    if (isOwlbearReady) {
      OBR.notification.show(`${currentCharacter.name} uses ${featureName}`, "INFO");
    }
  };
  window.useFeatureWithUses = async function(featureName) {
    if (!currentCharacter || !currentCharacter.features)
      return;
    const feature = currentCharacter.features.find((f) => f.name === featureName);
    if (!feature) {
      console.warn(`Feature "${featureName}" not found`);
      return;
    }
    if (!feature.uses || feature.uses.value === void 0) {
      console.warn(`Feature "${featureName}" has no uses tracking`);
      return;
    }
    if (feature.uses.value <= 0) {
      if (isOwlbearReady) {
        OBR.notification.show(`No uses of ${featureName} remaining!`, "ERROR");
      }
      return;
    }
    feature.uses.value -= 1;
    populateFeaturesTab(currentCharacter);
    const message = `\u2728 Uses <strong>${featureName}</strong> (${feature.uses.value}/${feature.uses.max || feature.uses.value + 1} remaining)`;
    await addChatMessage(message, "action", currentCharacter.name);
    if (isOwlbearReady) {
      OBR.notification.show(`${currentCharacter.name} uses ${featureName}`, "INFO");
    }
  };
  window.useAction = async function(actionName) {
    if (!currentCharacter || !currentCharacter.actions)
      return;
    const action = currentCharacter.actions.find((a) => a.name === actionName);
    if (!action) {
      console.warn(`Action "${actionName}" not found`);
      return;
    }
    if (!action.uses || action.uses.value === void 0) {
      console.warn(`Action "${actionName}" has no uses tracking`);
      return;
    }
    if (action.uses.value <= 0) {
      if (isOwlbearReady) {
        OBR.notification.show(`No uses of ${actionName} remaining!`, "ERROR");
      }
      return;
    }
    action.uses.value -= 1;
    populateActionsTab(currentCharacter);
    const message = `\u2728 Uses <strong>${actionName}</strong> (${action.uses.value}/${action.uses.max || action.uses.value + 1} remaining)`;
    await addChatMessage(message, "action", currentCharacter.name);
    if (isOwlbearReady) {
      OBR.notification.show(`${currentCharacter.name} uses ${actionName}`, "INFO");
    }
  };
  window.takeShortRest = async function() {
    if (!currentCharacter)
      return;
    const confirm2 = window.confirm(
      "Take a Short Rest?\n\n\u2022 Spend Hit Dice to recover HP\n\u2022 Recover some class resources\n\u2022 Takes 1 hour"
    );
    if (!confirm2)
      return;
    const hitDice = currentCharacter.hitDice;
    if (hitDice && hitDice.current > 0) {
      const spend = window.prompt(`You have ${hitDice.current}/${hitDice.max} Hit Dice (d${hitDice.type})

How many do you want to spend?`);
      if (spend) {
        const count = Math.min(parseInt(spend) || 0, hitDice.current);
        if (count > 0) {
          let totalHealing = 0;
          for (let i = 0; i < count; i++) {
            const roll = Math.floor(Math.random() * hitDice.type) + 1;
            const conMod = currentCharacter.attributeMods?.constitution || 0;
            totalHealing += roll + conMod;
          }
          const currentHP = currentCharacter.hitPoints?.current || 0;
          const maxHP = currentCharacter.hitPoints?.max || 0;
          const newHP = Math.min(maxHP, currentHP + totalHealing);
          currentCharacter.hitPoints.current = newHP;
          currentCharacter.hitDice.current -= count;
          if (isOwlbearReady) {
            OBR.notification.show(`Short Rest: Spent ${count} Hit Dice, recovered ${totalHealing} HP`, "SUCCESS");
          }
        }
      }
    }
    populateStatsTab(currentCharacter);
  };
  window.takeLongRest = async function() {
    if (!currentCharacter)
      return;
    const confirm2 = window.confirm(
      "Take a Long Rest?\n\n\u2022 Recover all HP\n\u2022 Recover all spell slots\n\u2022 Recover half of total Hit Dice\n\u2022 Recover all resources\n\u2022 Takes 8 hours"
    );
    if (!confirm2)
      return;
    const maxHP = currentCharacter.hitPoints?.max || 0;
    currentCharacter.hitPoints.current = maxHP;
    if (currentCharacter.spellSlots) {
      for (let level = 1; level <= 9; level++) {
        const maxKey = `level${level}SpellSlotsMax`;
        const currentKey = `level${level}SpellSlots`;
        if (currentCharacter.spellSlots[maxKey]) {
          currentCharacter.spellSlots[currentKey] = currentCharacter.spellSlots[maxKey];
        }
      }
      if (currentCharacter.spellSlots.pactMagicSlotsMax) {
        currentCharacter.spellSlots.pactMagicSlots = currentCharacter.spellSlots.pactMagicSlotsMax;
      }
    }
    if (currentCharacter.hitDice) {
      const recovered = Math.max(1, Math.floor(currentCharacter.hitDice.max / 2));
      currentCharacter.hitDice.current = Math.min(
        currentCharacter.hitDice.max,
        currentCharacter.hitDice.current + recovered
      );
    }
    if (currentCharacter.resources) {
      currentCharacter.resources.forEach((resource) => {
        resource.current = resource.max;
      });
    }
    if (isOwlbearReady) {
      OBR.notification.show(`Long Rest: ${currentCharacter.name} is fully rested!`, "SUCCESS");
    }
    populateStatsTab(currentCharacter);
  };
  window.toggleCollapsible = function(elementId) {
    const element = document.getElementById(elementId);
    const header = element.previousElementSibling;
    if (element && header) {
      element.classList.toggle("collapsed");
      header.classList.toggle("collapsed");
      const arrow = header.querySelector('span[style*="transition"]');
      if (arrow) {
        const isCollapsed = element.classList.contains("collapsed");
        arrow.style.transform = isCollapsed ? "rotate(-90deg)" : "rotate(0deg)";
      }
    }
  };
  window.toggleFeatureCard = function(cardId) {
    const card = document.getElementById(cardId);
    if (!card)
      return;
    const parentCard = card.parentElement;
    if (parentCard) {
      parentCard.classList.toggle("expanded");
    }
  };
  console.log("\u{1F3B2} OwlCloud Owlbear extension popover loaded");
  statusText.textContent = "Initializing...";
  ThemeManager.init();
  initializeThemeSelector();
  setTimeout(() => {
    if (!isOwlbearReady) {
      statusText.textContent = "Waiting for Owlbear SDK...";
    }
  }, 1e3);
  console.log("\u{1F3B2} OwlCloud popover initialized");
})();
//# sourceMappingURL=popover.js.map
