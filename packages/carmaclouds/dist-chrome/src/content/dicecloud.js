(() => {
  // src/content/dicecloud-extraction.js
  function parseCharacterData(apiData, characterId) {
    console.log("CarmaClouds: Parsing character data...");
    if (!apiData.creatures || apiData.creatures.length === 0) {
      console.error("CarmaClouds: No creatures found in API response");
      throw new Error("No character data found in API response");
    }
    const creature = apiData.creatures[0];
    const variables = apiData.creatureVariables && apiData.creatureVariables[0] || {};
    const properties = apiData.creatureProperties || [];
    console.log("CarmaClouds: Creature:", creature.name);
    console.log("CarmaClouds: Variables count:", Object.keys(variables).length);
    console.log("CarmaClouds: Properties count:", properties.length);
    const characterName = creature.name || "";
    const calculateArmorClass = () => {
      const extractNumeric = (val) => {
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
          if (val.value !== void 0 && typeof val.value === "number")
            return val.value;
          if (val.calculation && typeof val.calculation === "string") {
            const bm = val.calculation.match(/^(\d+)/);
            if (bm)
              return parseInt(bm[1]);
          }
        }
        return null;
      };
      if (variables.armorClass && (variables.armorClass.total || variables.armorClass.value)) {
        const variableAC = variables.armorClass.total || variables.armorClass.value;
        console.log(`CarmaClouds: Using Dicecloud's calculated AC: ${variableAC}`);
        return variableAC;
      }
      if (creature && creature.denormalizedStats) {
        const tryKeys = ["armorClass", "ac", "armor"];
        for (const k of tryKeys) {
          if (creature.denormalizedStats.hasOwnProperty(k)) {
            const num = extractNumeric(creature.denormalizedStats[k]);
            if (num !== null) {
              console.log(`CarmaClouds: Using denormalizedStats.${k}:`, num);
              return num;
            }
          }
        }
      }
      const varNamesToCheck = ["armor", "armorClass", "armor_class", "ac", "acTotal"];
      for (const vn of varNamesToCheck) {
        if (variables.hasOwnProperty(vn)) {
          const v = variables[vn];
          const candidate = extractNumeric(v && (v.total ?? v.value ?? v));
          if (candidate !== null) {
            console.log(`CarmaClouds: Using variable ${vn}:`, candidate);
            return candidate;
          }
        }
      }
      let baseAC = 10;
      let armorAC = null;
      const acBonuses = [];
      properties.forEach((prop) => {
        if (prop.inactive || prop.disabled)
          return;
        const hasArmorStat = prop.stat === "armor" || Array.isArray(prop.stats) && prop.stats.includes("armor");
        if (hasArmorStat) {
          let amount = null;
          if (typeof prop.amount === "number") {
            amount = prop.amount;
          } else if (typeof prop.amount === "string") {
            amount = parseFloat(prop.amount);
          }
          if (amount !== null && !isNaN(amount)) {
            const operation = prop.operation || "";
            if (operation === "base" || operation === "Base value") {
              if (armorAC === null || amount > armorAC) {
                armorAC = amount;
              }
            } else if (operation === "add" || operation === "Add") {
              acBonuses.push({ name: prop.name, amount });
            }
          }
        }
      });
      let finalAC = armorAC !== null ? armorAC : baseAC;
      acBonuses.forEach((bonus) => {
        finalAC += bonus.amount;
      });
      console.log("CarmaClouds: Calculated AC:", finalAC);
      return finalAC;
    };
    let characterRace = "Unknown";
    let characterClass = "";
    let characterLevel = 0;
    const uniqueClasses = /* @__PURE__ */ new Set();
    let raceFound = false;
    console.log("CarmaClouds: Extracting basic character info...");
    const propertyTypes = {};
    properties.forEach((prop) => {
      if (prop && prop.type) {
        propertyTypes[prop.type] = (propertyTypes[prop.type] || 0) + 1;
      }
    });
    console.log("CarmaClouds: Property types in character:", propertyTypes);
    if (creature.race) {
      console.log("CarmaClouds: Found race on creature:", creature.race);
      characterRace = creature.race;
      raceFound = true;
    }
    if (creature.denormalizedStats && creature.denormalizedStats.race) {
      console.log("CarmaClouds: Found race in denormalizedStats:", creature.denormalizedStats.race);
      characterRace = creature.denormalizedStats.race;
      raceFound = true;
    }
    for (const prop of properties) {
      if (!prop)
        continue;
      if (!raceFound && prop.type === "folder" && prop.name) {
        const commonRaces = ["half-elf", "half-orc", "dragonborn", "tiefling", "halfling", "human", "elf", "dwarf", "gnome", "orc", "goblin", "kobold", "warforged", "tabaxi", "kenku", "aarakocra", "genasi", "aasimar", "firbolg", "goliath", "triton", "yuan-ti", "tortle", "lizardfolk", "bugbear", "hobgoblin", "changeling", "shifter", "kalashtar"];
        const nameMatchesRace = commonRaces.some((race) => new RegExp(`\\b${race}\\b`, "i").test(prop.name));
        if (nameMatchesRace) {
          const parentDepth = prop.ancestors ? prop.ancestors.length : 0;
          if (parentDepth <= 2) {
            console.log("CarmaClouds: Found race folder:", prop.name);
            characterRace = prop.name;
            raceFound = true;
          }
        }
      }
      if (!raceFound && (prop.type === "race" || prop.type === "species" || prop.type === "characterRace")) {
        if (prop.name) {
          console.log("CarmaClouds: Found race property:", prop.type, prop.name);
          characterRace = prop.name;
          raceFound = true;
        }
      }
      if (!raceFound && prop.type === "constant" && prop.name && prop.name.toLowerCase() === "race") {
        if (prop.value) {
          console.log("CarmaClouds: Found race as constant:", prop.value);
          characterRace = prop.value;
          raceFound = true;
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
        }
      }
      if (prop.type === "classLevel" && !prop.inactive && !prop.disabled) {
        characterLevel += 1;
      }
    }
    if (!raceFound && (!characterRace || characterRace === "Unknown")) {
      console.log("CarmaClouds: Race not found in properties, checking variables...");
      const raceVars = Object.keys(variables).filter(
        (key) => key.toLowerCase().includes("race") || key.toLowerCase().includes("species")
      );
      if (raceVars.length > 0) {
        console.log("CarmaClouds: Found race-related variables:", raceVars);
        raceVars.forEach((varName) => {
          console.log(`CarmaClouds: Raw data for "${varName}":`, variables[varName]);
        });
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
          const raceName2 = varName.replace(/race$/i, "").replace(/^race$/i, "");
          if (raceName2 && raceName2 !== varName.toLowerCase()) {
            return raceName2.charAt(0).toUpperCase() + raceName2.slice(1);
          }
          return null;
        };
        let raceName = null;
        let subraceName = null;
        const subRaceVar = raceVars.find((key) => key.toLowerCase() === "subrace");
        if (subRaceVar) {
          const subRaceValue = variables[subRaceVar];
          console.log("CarmaClouds: Found subRace variable:", subRaceValue);
          if (typeof subRaceValue === "object" && subRaceValue !== null) {
            if (subRaceValue.name) {
              subraceName = formatRaceName(subRaceValue.name);
            } else if (subRaceValue.text) {
              subraceName = formatRaceName(subRaceValue.text);
            } else if (subRaceValue.value) {
              subraceName = formatRaceName(subRaceValue.value);
            }
          } else if (typeof subRaceValue === "string") {
            subraceName = formatRaceName(subRaceValue);
          }
          if (subraceName && subraceName.toLowerCase() === "sub race") {
            console.log('CarmaClouds: Skipping generic "Sub Race" label, looking for actual subrace...');
            subraceName = null;
          }
        }
        if (!subraceName) {
          const subraceKeywords = ["fire", "water", "air", "earth", "firegenasi", "watergenasi", "airgenasi", "earthgenasi"];
          for (const varName of raceVars) {
            const varValue = variables[varName];
            const varNameLower = varName.toLowerCase();
            if (subraceKeywords.some((kw) => varNameLower.includes(kw))) {
              const isActive = typeof varValue === "boolean" ? varValue : typeof varValue === "object" && varValue !== null && varValue.value === true;
              if (isActive || varValue === true) {
                if (varNameLower.includes("fire"))
                  subraceName = "Fire";
                else if (varNameLower.includes("water"))
                  subraceName = "Water";
                else if (varNameLower.includes("air"))
                  subraceName = "Air";
                else if (varNameLower.includes("earth"))
                  subraceName = "Earth";
                if (subraceName) {
                  console.log("CarmaClouds: Found subrace from variable:", varName, "->", subraceName);
                  break;
                }
              }
            }
          }
        }
        const raceVar = raceVars.find((key) => key.toLowerCase() === "race");
        if (raceVar) {
          const raceValue = variables[raceVar];
          console.log("CarmaClouds: Found race variable:", raceValue);
          if (typeof raceValue === "object" && raceValue !== null) {
            if (raceValue.value && typeof raceValue.value === "object" && raceValue.value.value) {
              raceName = formatRaceName(raceValue.value.value);
              console.log("CarmaClouds: Extracted race from nested value.value:", raceName);
            } else if (raceValue.value && typeof raceValue.value === "string") {
              raceName = formatRaceName(raceValue.value);
            } else if (raceValue.name) {
              raceName = formatRaceName(raceValue.name);
            } else if (raceValue.text) {
              raceName = formatRaceName(raceValue.text);
            }
          } else if (typeof raceValue === "string") {
            raceName = formatRaceName(raceValue);
          }
        }
        if (!raceName) {
          for (const varName of raceVars) {
            const varValue = variables[varName];
            if (typeof varValue === "object" && varValue !== null && varValue.value === true) {
              const extracted = extractRaceFromVarName(varName);
              if (extracted) {
                raceName = extracted;
                console.log("CarmaClouds: Extracted race from variable name:", varName, "->", raceName);
                break;
              }
            }
          }
        }
        if (raceName && subraceName) {
          characterRace = `${raceName} - ${subraceName}`;
          console.log("CarmaClouds: Combined race and subrace:", characterRace);
        } else if (subraceName) {
          characterRace = subraceName;
          console.log("CarmaClouds: Using subrace as race:", characterRace);
        } else if (raceName) {
          characterRace = raceName;
          console.log("CarmaClouds: Using race:", characterRace);
        } else {
          console.log("CarmaClouds: Could not determine race from variables");
        }
      } else {
        console.log("CarmaClouds: No race variables found");
      }
    }
    console.log("CarmaClouds: Character preview:", characterName, characterLevel, characterRace, characterClass);
    const characterData = {
      // Metadata
      id: creature._id || characterId,
      name: characterName,
      url: window.location.href,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      source: "dicecloud",
      // Preview info (for character lists, etc.)
      preview: {
        race: characterRace,
        class: characterClass || "Unknown",
        level: characterLevel
      },
      // Raw DiceCloud API data - VTT adapters will parse this as needed
      raw: {
        creature,
        variables,
        properties
      }
    };
    console.log("CarmaClouds: Successfully stored character data:", characterData.name);
    return characterData;
  }

  // src/content/dicecloud.js
  var browserAPI = typeof browser !== "undefined" && browser.runtime ? browser : chrome;
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
    color: #ffffff;
    border: none;
    padding: 10px 18px;
    border-radius: 0 0 12px 12px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(22, 167, 90, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-top: none;
  `;
    syncButton.addEventListener("mouseenter", () => {
      syncButton.style.background = "linear-gradient(135deg, #1bc76b 0%, #0f9055 100%)";
      syncButton.style.transform = "translateY(-1px)";
      syncButton.style.boxShadow = "0 6px 16px rgba(27, 199, 107, 0.5), 0 2px 4px rgba(0, 0, 0, 0.2)";
    });
    syncButton.addEventListener("mouseleave", () => {
      syncButton.style.background = "linear-gradient(135deg, #16a75a 0%, #0d8045 100%)";
      syncButton.style.transform = "translateY(0)";
      syncButton.style.boxShadow = "0 4px 12px rgba(22, 167, 90, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2)";
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
        <div style="width: 16px; height: 16px; border: 2px solid #ffffff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <span>Syncing...</span>
      </div>
    `;
      button.disabled = true;
      const characterData = await extractCharacterData();
      if (!characterData) {
        throw new Error("Could not extract character data from DiceCloud");
      }
      console.log("CarmaClouds: Extracted character data:", characterData);
      console.log("CarmaClouds: \u{1F4E4} Sending message to background script...");
      let response;
      try {
        response = await browserAPI.runtime.sendMessage({
          type: "SYNC_CHARACTER_TO_CARMACLOUDS",
          data: characterData
        });
        console.log("CarmaClouds: \u{1F4E5} Received response from background:", response);
      } catch (error) {
        console.error("CarmaClouds: \u274C Error sending message to background:", error);
        throw new Error(`Failed to communicate with extension: ${error.message}`);
      }
      if (!response) {
        console.error("CarmaClouds: \u274C No response from background script (service worker may be inactive)");
        throw new Error("No response from extension background script");
      }
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
      const tokenResult = await browserAPI.storage.local.get(["dicecloud_auth_token"]);
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
      const characterData = parseCharacterData(data, characterId);
      characterData.raw = {
        creature: data.creatures?.[0] || {},
        variables: data.creatureVariables?.[0] || {},
        properties: data.creatureProperties || []
      };
      console.log("CarmaClouds: Successfully extracted character data:", characterData);
      console.log(
        "CarmaClouds: Preserved raw API data with",
        characterData.raw.properties.length,
        "properties"
      );
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
  browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getAuthData") {
      console.log("CarmaClouds: Auth data requested from popup");
      const authData = {
        localStorage: {},
        meteor: null
      };
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          authData.localStorage[key] = localStorage.getItem(key);
        }
      } catch (e) {
        console.warn("Could not access localStorage:", e);
      }
      const meteorUserId = localStorage.getItem("Meteor.userId");
      const meteorLoginToken = localStorage.getItem("Meteor.loginToken");
      if (meteorUserId || meteorLoginToken) {
        authData.meteor = {
          userId: meteorUserId,
          loginToken: meteorLoginToken
        };
        if (typeof Meteor !== "undefined" && Meteor.user) {
          try {
            const user = Meteor.user();
            if (user) {
              authData.meteor.username = user.username || user.emails?.[0]?.address || user.profile?.username || user.profile?.name || null;
            }
          } catch (e) {
            console.warn("Could not get Meteor user:", e);
          }
        }
      }
      console.log("CarmaClouds: Sending auth data:", {
        hasMeteorAuth: !!authData.meteor,
        localStorageKeys: Object.keys(authData.localStorage).length
      });
      sendResponse(authData);
      return true;
    }
  });
  waitForPageLoad();
})();
//# sourceMappingURL=dicecloud.js.map
