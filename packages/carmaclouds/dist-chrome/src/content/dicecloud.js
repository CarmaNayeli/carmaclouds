// Initialize debug globally
if (typeof window !== "undefined" && !window.debug) { window.debug = { log: console.log, warn: console.warn, error: console.error, info: console.info, group: console.group, groupEnd: console.groupEnd, table: console.table, time: console.time, timeEnd: console.timeEnd, isEnabled: () => true }; }
const debug = window.debug;
// Supabase config will be set by browser.js
const SUPABASE_URL = typeof window !== "undefined" ? window.SUPABASE_URL : undefined;
const SUPABASE_ANON_KEY = typeof window !== "undefined" ? window.SUPABASE_ANON_KEY : undefined;
// SupabaseTokenManager will be set by browser.js
const SupabaseTokenManager = typeof window !== "undefined" ? window.SupabaseTokenManager : undefined;
(() => {
  // src/content/dicecloud.js
  console.log("CarmaClouds: DiceCloud content script loaded");
  function waitForPageLoad() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initializeDiceCloudSync);
    } else {
      initializeDiceCloudSync();
    }
  }
  function initializeDiceCloudSync() {
    console.log("CarmaClouds: Initializing DiceCloud sync...");
    setTimeout(() => {
      console.log("CarmaClouds: Attempting to add sync button...");
      addSyncButtonToDiceCloud();
    }, 1e3);
  }
  function addSyncButtonToDiceCloud() {
    console.log("CarmaClouds: addSyncButtonToDiceCloud called");
    if (document.querySelector("#carmaclouds-sync-btn")) {
      console.log("CarmaClouds: Sync button already exists");
      return;
    }
    console.log("CarmaClouds: Creating sync button container...");
    const buttonContainer = document.createElement("div");
    buttonContainer.id = "carmaclouds-sync-container";
    buttonContainer.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
    const dragHandle = document.createElement("div");
    dragHandle.innerHTML = "\u22EE\u22EE";
    dragHandle.style.cssText = `
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 4px 8px;
    border-radius: 4px 4px 0 0;
    cursor: move;
    font-size: 12px;
    text-align: center;
    user-select: none;
    border: 1px solid #333;
    border-bottom: none;
  `;
    const syncButton = document.createElement("button");
    syncButton.id = "carmaclouds-sync-btn";
    syncButton.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M23 4v6h-6M1 20v-6h6"/>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
      </svg>
      <span>Sync to CarmaClouds</span>
    </div>
  `;
    syncButton.style.cssText = `
    background: linear-gradient(135deg, #16a75a 0%, #0d8045 100%);
    color: #000000;
    border: none;
    padding: 8px 16px;
    border-radius: 0 0 6px 6px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border: 1px solid #333;
    border-top: none;
  `;
    syncButton.addEventListener("mouseenter", () => {
      syncButton.style.background = "linear-gradient(135deg, #1bc76b 0%, #0f9055 100%)";
      syncButton.style.transform = "translateY(-1px)";
      syncButton.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
    });
    syncButton.addEventListener("mouseleave", () => {
      syncButton.style.background = "linear-gradient(135deg, #16a75a 0%, #0d8045 100%)";
      syncButton.style.transform = "translateY(0)";
      syncButton.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
    });
    syncButton.addEventListener("click", handleSyncToCarmaClouds);
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    const savedPosition = localStorage.getItem("carmaclouds_button_position");
    if (savedPosition) {
      try {
        const pos = JSON.parse(savedPosition);
        const maxRight = window.innerWidth - 200;
        const maxBottom = window.innerHeight - 100;
        xOffset = Math.max(-window.innerWidth + 200, Math.min(maxRight, pos.x || 0));
        yOffset = Math.max(-100, Math.min(maxBottom, pos.y || 0));
        buttonContainer.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
      } catch (e) {
        console.warn("CarmaClouds: Could not restore button position");
      }
    }
    dragHandle.addEventListener("mousedown", dragStart);
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", dragEnd);
    function dragStart(e) {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      if (e.target === dragHandle) {
        isDragging = true;
        dragHandle.style.background = "rgba(0, 0, 0, 0.9)";
      }
    }
    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        const maxRight = window.innerWidth - 200;
        const maxBottom = window.innerHeight - 100;
        currentX = Math.max(-window.innerWidth + 200, Math.min(maxRight, currentX));
        currentY = Math.max(-100, Math.min(maxBottom, currentY));
        xOffset = currentX;
        yOffset = currentY;
        buttonContainer.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
    }
    function dragEnd(e) {
      if (isDragging) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
        dragHandle.style.background = "rgba(0, 0, 0, 0.8)";
        localStorage.setItem("carmaclouds_button_position", JSON.stringify({
          x: xOffset,
          y: yOffset
        }));
      }
    }
    buttonContainer.appendChild(dragHandle);
    buttonContainer.appendChild(syncButton);
    console.log("CarmaClouds: Adding button to document.body...");
    document.body.appendChild(buttonContainer);
    const addedButton = document.querySelector("#carmaclouds-sync-btn");
    console.log("CarmaClouds: Button verification:", addedButton ? "SUCCESS" : "FAILED");
    console.log("CarmaClouds: Sync button added to DiceCloud");
  }
  async function handleSyncToCarmaClouds() {
    const button = document.querySelector("#carmaclouds-sync-btn");
    const originalContent = button.innerHTML;
    try {
      button.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 16px; height: 16px; border: 2px solid #000; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <span>Syncing...</span>
      </div>
    `;
      button.disabled = true;
      const characterData = await extractCharacterData();
      if (!characterData) {
        throw new Error("Could not extract character data from DiceCloud");
      }
      console.log("CarmaClouds: Extracted character data:", characterData);
      const response = await chrome.runtime.sendMessage({
        type: "SYNC_CHARACTER_TO_CARMACLOUDS",
        data: characterData
      });
      if (response && response.success) {
        button.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>Synced!</span>
        </div>
      `;
        button.style.background = "linear-gradient(135deg, #28a745 0%, #1e7e34 100%)";
        setTimeout(() => {
          button.innerHTML = originalContent;
          button.style.background = "linear-gradient(135deg, #16a75a 0%, #0d8045 100%)";
          button.disabled = false;
        }, 3e3);
      } else {
        throw new Error(response?.error || "Failed to sync character data");
      }
    } catch (error) {
      console.error("CarmaClouds: Sync error:", error);
      button.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>Sync Failed</span>
      </div>
    `;
      button.style.background = "linear-gradient(135deg, #dc3545 0%, #c82333 100%)";
      setTimeout(() => {
        button.innerHTML = originalContent;
        button.style.background = "linear-gradient(135deg, #16a75a 0%, #0d8045 100%)";
        button.disabled = false;
      }, 3e3);
    }
  }
  async function extractCharacterData() {
    try {
      let getCharacterIdFromUrl = function() {
        const url = window.location.pathname;
        console.log("CarmaClouds: Parsing URL:", url);
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
            console.log("CarmaClouds: Found character ID:", match[1]);
            return match[1];
          }
        }
        console.error("CarmaClouds: Could not extract character ID from URL");
        return null;
      };
      console.log("CarmaClouds: Extracting character data using DiceCloud API...");
      const characterId = getCharacterIdFromUrl();
      if (!characterId) {
        throw new Error("Not on a character page. Navigate to a character sheet first.");
      }
      const tokenResult = await chrome.storage.local.get(["dicecloud_auth_token"]);
      const token = tokenResult.dicecloud_auth_token;
      if (!token) {
        throw new Error("Not logged in to DiceCloud. Please login via the extension popup.");
      }
      console.log("CarmaClouds: Fetching character data from API...");
      const API_BASE = "https://dicecloud.com/api";
      const timestamp = Date.now();
      const apiUrl = `${API_BASE}/creature/${characterId}?_t=${timestamp}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        },
        cache: "no-store"
      });
      console.log("CarmaClouds: API Response status:", response.status);
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("API token expired. Please login again via the extension popup.");
        }
        const errorText = await response.text();
        console.error("CarmaClouds: API Error Response:", errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log("CarmaClouds: Received API data");
      if (!data.creatures || data.creatures.length === 0) {
        throw new Error("No character data found in API response");
      }
      const creature = data.creatures[0];
      const variables = data.creatureVariables && data.creatureVariables[0] || {};
      const properties = data.creatureProperties || [];
      let characterRace = "Unknown";
      let characterClass = "";
      let characterLevel = 0;
      const uniqueClasses = /* @__PURE__ */ new Set();
      console.log("CarmaClouds: Extracting race, class, level from properties...");
      for (const prop of properties) {
        if (!prop)
          continue;
        if (prop.type === "race" || prop.type === "species" || prop.type === "characterRace") {
          if (prop.name) {
            characterRace = prop.name;
            console.log("CarmaClouds: Found race:", characterRace);
          }
        }
        if (prop.type === "class" && prop.name && !prop.inactive && !prop.disabled) {
          const cleanName = prop.name.replace(/\s*\[Multiclass\]/i, "").trim();
          const normalizedClassName = cleanName.toLowerCase().trim();
          if (!uniqueClasses.has(normalizedClassName)) {
            uniqueClasses.add(normalizedClassName);
            if (characterClass) {
              characterClass += ` / ${cleanName}`;
            } else {
              characterClass = cleanName;
            }
            console.log("CarmaClouds: Found class:", cleanName);
          }
        }
        if (prop.type === "classLevel" && !prop.inactive && !prop.disabled) {
          characterLevel += 1;
          if (prop.name) {
            const cleanName = prop.name.replace(/\s*\[Multiclass\]/i, "").trim();
            const normalizedClassName = cleanName.toLowerCase().trim();
            if (!uniqueClasses.has(normalizedClassName)) {
              uniqueClasses.add(normalizedClassName);
              if (characterClass) {
                characterClass += ` / ${cleanName}`;
              } else {
                characterClass = cleanName;
              }
            }
          }
        }
      }
      console.log("CarmaClouds: Extracted race:", characterRace, "class:", characterClass || "Unknown", "level:", characterLevel);
      const characterData = {
        id: creature._id || characterId,
        name: creature.name || "Unknown Character",
        race: characterRace,
        class: characterClass || "Unknown",
        level: characterLevel,
        alignment: creature.alignment || "",
        url: window.location.href,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        source: "dicecloud",
        // Core stats
        hitPoints: {
          current: variables.hitPoints && (variables.hitPoints.currentValue ?? variables.hitPoints.value) || 0,
          max: variables.hitPoints && (variables.hitPoints.total ?? variables.hitPoints.max) || 0
        },
        armorClass: variables.armorClass?.total || variables.armorClass?.value || 10,
        speed: variables.speed?.total || variables.speed?.value || 30,
        initiative: variables.initiative?.total || variables.initiative?.value || 0,
        proficiencyBonus: variables.proficiencyBonus?.total || variables.proficiencyBonus?.value || 0,
        // Abilities
        attributes: {
          strength: variables.strength?.total || variables.strength?.value || 10,
          dexterity: variables.dexterity?.total || variables.dexterity?.value || 10,
          constitution: variables.constitution?.total || variables.constitution?.value || 10,
          intelligence: variables.intelligence?.total || variables.intelligence?.value || 10,
          wisdom: variables.wisdom?.total || variables.wisdom?.value || 10,
          charisma: variables.charisma?.total || variables.charisma?.value || 10
        },
        // Store raw data for debugging
        rawDiceCloudData: {
          creature,
          variables,
          properties
        }
      };
      Object.keys(characterData.attributes).forEach((attr) => {
        const score = characterData.attributes[attr] || 10;
        characterData.attributes[attr] = score;
        characterData[`${attr}Mod`] = Math.floor((score - 10) / 2);
      });
      console.log("CarmaClouds: Successfully extracted character data:", characterData);
      return characterData;
    } catch (error) {
      console.error("CarmaClouds: Error extracting character data:", error);
      console.log("CarmaClouds: Trying fallback page extraction...");
      const characterName = document.querySelector('h1, .character-name, [data-testid="character-name"]')?.textContent?.trim();
      if (characterName) {
        return {
          name: characterName,
          level: "Unknown",
          class: "Unknown",
          race: "Unknown",
          url: window.location.href,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          source: "dicecloud",
          extractionError: error.message
        };
      }
      throw error;
    }
  }
  var style = document.createElement("style");
  style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
  document.head.appendChild(style);
  var lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      console.log("CarmaClouds: URL changed to:", url);
      setTimeout(() => {
        if (!document.querySelector("#carmaclouds-sync-btn")) {
          console.log("CarmaClouds: Button not found after navigation, re-adding...");
          addSyncButtonToDiceCloud();
        }
      }, 1500);
    }
  }).observe(document, { subtree: true, childList: true });
  waitForPageLoad();
})();
//# sourceMappingURL=dicecloud.js.map
