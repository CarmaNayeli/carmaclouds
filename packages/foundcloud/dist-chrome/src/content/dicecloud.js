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

  // src/content/dicecloud.js
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
  (function() {
    "use strict";
    debug.log("\u{1F3B2} FoundCloud: DiceCloud content script loaded");
    debug.log("\u{1F4CD} Current URL:", window.location.href);
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
    function getCharacterIdFromUrl() {
      const url = window.location.pathname;
      debug.log("\u{1F50D} Parsing URL:", url);
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
          debug.log("\u2705 Found character ID:", match[1]);
          return match[1];
        }
      }
      debug.error("\u274C Could not extract character ID from URL");
      return null;
    }
    async function fetchCharacterDataFromAPI() {
      debug.log("\u{1F4E1} Starting API fetch...");
      const characterId = getCharacterIdFromUrl();
      if (!characterId) {
        const error = "Not on a character page. Navigate to a character sheet first.";
        debug.error("\u274C", error);
        throw new Error(error);
      }
      debug.log("\u{1F510} Requesting API token from background...");
      let tokenResponse;
      try {
        tokenResponse = await browserAPI.runtime.sendMessage({ action: "getApiToken" });
        debug.log("\u{1F511} Token response from background:", tokenResponse);
      } catch (error) {
        debug.error("Extension context error:", error);
        debug.log("\u{1F504} Background script not responding, trying direct storage...");
        try {
          const storageResult = await browserAPI.storage.local.get(["diceCloudToken", "tokenExpires", "username"]);
          debug.log("\u{1F4E6} Direct storage result:", storageResult);
          if (storageResult.diceCloudToken) {
            tokenResponse = {
              success: true,
              token: storageResult.diceCloudToken,
              tokenExpires: storageResult.tokenExpires,
              username: storageResult.username
            };
            debug.log("\u2705 Token obtained from direct storage");
          } else {
            debug.error("\u274C No token found in storage, storage keys:", Object.keys(storageResult));
            throw new Error("No token found in storage");
          }
        } catch (storageError) {
          debug.error("Storage fallback failed:", storageError);
          throw new Error("Extension reloaded. Please refresh the page.");
        }
      }
      if (tokenResponse && !tokenResponse.success) {
        debug.log("\u{1F504} Background script reported failure, trying direct storage...");
        try {
          const storageResult = await browserAPI.storage.local.get(["diceCloudToken", "tokenExpires", "username"]);
          debug.log("\u{1F4E6} Direct storage result (background failed):", storageResult);
          if (storageResult.diceCloudToken) {
            tokenResponse = {
              success: true,
              token: storageResult.diceCloudToken,
              tokenExpires: storageResult.tokenExpires,
              username: storageResult.username
            };
            debug.log("\u2705 Token obtained from direct storage (background failed)");
          } else {
            debug.error("\u274C No token found in storage, storage keys:", Object.keys(storageResult));
            throw new Error("No token found in storage");
          }
        } catch (storageError) {
          debug.error("Storage fallback failed:", storageError);
          throw new Error("Extension reloaded. Please refresh the page.");
        }
      }
      debug.log("\u{1F50D} Final token response:", tokenResponse);
      if (!tokenResponse.success || !tokenResponse.token) {
        const error = "Not logged in to DiceCloud. Please login via the extension popup.";
        debug.error("\u274C", error);
        throw new Error(error);
      }
      debug.log("\u2705 API token obtained");
      debug.log("\u{1F4E1} Fetching character data for ID:", characterId);
      const timestamp = Date.now();
      const apiUrl = `${API_BASE}/creature/${characterId}?_t=${timestamp}`;
      debug.log("\u{1F310} API URL:", apiUrl);
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
        debug.log("\u{1F4E8} API Response status:", response.status);
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("API token expired. Please login again via the extension popup.");
          }
          const errorText = await response.text();
          debug.error("\u274C API Error Response:", errorText);
          throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const data = await response.json();
        debug.log("\u2705 Received API data:", data);
        debug.log("\u{1F4CA} Data structure:", {
          hasCreatures: !!data.creatures,
          creaturesCount: data.creatures && data.creatures.length || 0,
          hasVariables: !!data.creatureVariables,
          variablesCount: data.creatureVariables && data.creatureVariables.length || 0,
          hasProperties: !!data.creatureProperties,
          propertiesCount: data.creatureProperties && data.creatureProperties.length || 0
        });
        return parseCharacterData(data);
      } catch (fetchError) {
        debug.error("\u274C Fetch error:", fetchError);
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
      debug.log("\u{1F527} Parsing character data...");
      if (!apiData.creatures || apiData.creatures.length === 0) {
        debug.error("\u274C No creatures found in API response");
        throw new Error("No character data found in API response");
      }
      const creature = apiData.creatures[0];
      const variables = apiData.creatureVariables && apiData.creatureVariables[0] || {};
      const properties = apiData.creatureProperties || [];
      debug.log("\u{1F4DD} Creature:", creature);
      debug.log("\u{1F4CA} Variables count:", Object.keys(variables).length);
      debug.log("\u{1F4CB} Properties count:", properties.length);
      const calculateArmorClass = () => {
        let baseAC = 10;
        let armorAC = null;
        const acBonuses = [];
        debug.log("\u{1F6E1}\uFE0F Calculating AC from properties...");
        debug.log(`\u{1F6E1}\uFE0F Total properties to scan: ${properties.length}`);
        const effectProps = properties.filter((p) => p.type === "effect");
        debug.log(`\u{1F6E1}\uFE0F Found ${effectProps.length} effect properties`);
        if (effectProps.length > 0) {
          debug.log("\u{1F6E1}\uFE0F Sample effect properties:", effectProps.slice(0, 5).map((p) => ({
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
          debug.log(`\u{1F6E1}\uFE0F Found ${armorEffects.length} armor-related effects:`, armorEffects.map((p) => ({
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
            debug.log(`  \u23ED\uFE0F Skipping spell effect: ${prop.name} (only applies when spell is active)`);
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
              debug.log(`\u{1F6E1}\uFE0F Found calculated armor amount: "${calc}" for ${prop.name || "Unnamed"}`);
              const baseMatch = calc.match(/^(\d+)/);
              if (baseMatch) {
                amount = parseInt(baseMatch[1]);
                debug.log(`  \u{1F4CA} Extracted base AC value: ${amount} from calculation`);
              }
            }
            if (amount !== null && !isNaN(amount)) {
              const operation = prop.operation || "";
              debug.log(`\u{1F6E1}\uFE0F Found armor effect: ${prop.name || "Unnamed"} - Operation: ${operation}, Amount: ${amount}`);
              if (operation === "base" || operation === "Base value") {
                if (armorAC === null || amount > armorAC) {
                  armorAC = amount;
                  debug.log(`  \u2705 Set armor AC to ${amount} from ${prop.name || "Unnamed"}`);
                }
              } else if (operation === "add" || operation === "Add") {
                acBonuses.push({ name: prop.name, amount });
                debug.log(`  \u2705 Added AC bonus: +${amount} from ${prop.name || "Unnamed"}`);
              }
            }
          }
        });
        debug.log("\u{1F6E1}\uFE0F Full armorClass variable object:", variables.armorClass);
        if (variables.armorClass && (variables.armorClass.total || variables.armorClass.value)) {
          const variableAC = variables.armorClass.total || variables.armorClass.value;
          debug.log(`\u{1F6E1}\uFE0F Using Dicecloud's calculated AC: ${variableAC}`);
          return variableAC;
        }
        let finalAC = armorAC !== null ? armorAC : baseAC;
        acBonuses.forEach((bonus) => {
          finalAC += bonus.amount;
        });
        debug.log(`\u{1F6E1}\uFE0F Dicecloud didn't provide AC variable, calculating from effects:`);
        debug.log(`   Base: ${armorAC !== null ? armorAC + " (armor)" : baseAC + " (unarmored)"}`);
        debug.log(`   Bonuses: ${acBonuses.map((b) => `+${b.amount} (${b.name})`).join(", ") || "none"}`);
        debug.log(`   Final AC: ${finalAC}`);
        return finalAC;
      };
      const characterData = {
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
          characterData.attributes[ability] = variables[ability].total || variables[ability].value || 10;
        }
      });
      Object.keys(characterData.attributes).forEach((attr) => {
        const score = characterData.attributes[attr] || 10;
        characterData.attributeMods[attr] = Math.floor((score - 10) / 2);
      });
      STANDARD_VARS.abilityMods.forEach((mod) => {
        if (variables[mod]) {
          const abilityName = mod.replace("Mod", "");
          const diceCloudMod = variables[mod].total || variables[mod].value || 0;
          const calculatedMod = characterData.attributeMods[abilityName] || 0;
          if (diceCloudMod !== 0 && diceCloudMod !== calculatedMod) {
            characterData.attributeMods[abilityName] = diceCloudMod;
            debug.log(`\u{1F4CA} Using Dice Cloud modifier for ${abilityName}: ${diceCloudMod} (calculated: ${calculatedMod})`);
          } else {
            debug.log(`\u{1F4CA} Using calculated modifier for ${abilityName}: ${calculatedMod}`);
          }
        }
      });
      STANDARD_VARS.saves.forEach((save) => {
        if (variables[save]) {
          const abilityName = save.replace("Save", "");
          const saveValue = variables[save].total || variables[save].value || 0;
          characterData.saves[abilityName] = saveValue;
          characterData.savingThrows[abilityName] = saveValue;
        }
      });
      STANDARD_VARS.skills.forEach((skill) => {
        if (variables[skill]) {
          characterData.skills[skill] = variables[skill].total || variables[skill].value || 0;
        }
      });
      debug.log("\u{1F50D} Extracting spell slots...");
      characterData.spellSlots = {};
      for (let level = 1; level <= 9; level++) {
        const diceCloudVarName = `slotLevel${level}`;
        const currentKey = `level${level}SpellSlots`;
        const maxKey = `level${level}SpellSlotsMax`;
        if (variables[diceCloudVarName]) {
          const currentSlots = variables[diceCloudVarName].value || 0;
          const maxSlots = variables[diceCloudVarName].total || variables[diceCloudVarName].value || 0;
          characterData.spellSlots[currentKey] = currentSlots;
          characterData.spellSlots[maxKey] = maxSlots;
          debug.log(`  \u2705 Level ${level}: ${currentSlots}/${maxSlots} (from ${diceCloudVarName})`);
        } else {
          debug.log(`  \u26A0\uFE0F Level ${level}: ${diceCloudVarName} not found in variables`);
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
            debug.log(`  \u{1F4CA} Found slot level ${slotLevel} from ${varName} property`);
          } else {
            for (const levelVarName of slotLevelVarNames) {
              if (variables[levelVarName]) {
                slotLevel = extractValue(variables[levelVarName]) || variables[levelVarName].value || 1;
                debug.log(`  \u{1F4CA} Found slot level ${slotLevel} from variable ${levelVarName}`);
                break;
              }
            }
          }
          if (slotLevel === 1 && variables.warlockLevel) {
            slotLevel = Math.min(5, Math.ceil(variables.warlockLevel.value / 2));
            debug.log(`  \u{1F4CA} Calculated slot level ${slotLevel} from warlockLevel`);
          }
          characterData.spellSlots.pactMagicSlots = currentSlots;
          characterData.spellSlots.pactMagicSlotsMax = maxSlots;
          characterData.spellSlots.pactMagicSlotLevel = slotLevel;
          debug.log(`  \u2705 Pact Magic: ${currentSlots}/${maxSlots} at level ${slotLevel} (from ${varName})`);
          debug.log(`  \u{1F4CB} Full ${varName} variable:`, JSON.stringify(variables[varName]));
          foundPactMagic = true;
          break;
        }
      }
      const slotRelatedVars = Object.keys(variables).filter((k) => {
        const lower = k.toLowerCase();
        return lower.includes("slot") || lower.includes("pact") || lower.includes("warlock") || lower.includes("spell") && !lower.includes("attack");
      });
      debug.log("\u{1F50D} All slot/pact/warlock/spell related variables:", slotRelatedVars);
      if (slotRelatedVars.length > 0) {
        slotRelatedVars.forEach((varName) => {
          debug.log(`   ${varName}:`, variables[varName]);
        });
      }
      debug.log("\u{1F4CA} Final spell slots object:", characterData.spellSlots);
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
          characterData.kingdom[skill] = variables[skillVar].value || 0;
        }
        const profVar = `${skillVar}ProficiencyTotal`;
        if (variables[profVar]) {
          characterData.kingdom[`${skill}_proficiency_total`] = variables[profVar].value || 0;
        }
      });
      const kingdomCoreStats = ["culture", "economy", "loyalty", "stability"];
      kingdomCoreStats.forEach((stat) => {
        const statVar = `kingdom${stat.charAt(0).toUpperCase() + stat.slice(1)}`;
        if (variables[statVar]) {
          characterData.kingdom[stat] = variables[statVar].value || 0;
        }
      });
      const armySkills = ["scouting", "maneuver", "morale", "ranged"];
      armySkills.forEach((skill) => {
        const skillVar = `army${skill.charAt(0).toUpperCase() + skill.slice(1)}`;
        if (variables[skillVar]) {
          characterData.army[skill] = variables[skillVar].value || 0;
        }
      });
      if (variables.heroPoints) {
        characterData.otherVariables.hero_points = variables.heroPoints.value || 0;
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
            characterData.otherVariables[varName] = value;
          }
        }
      });
      debug.log(`Extracted ${Object.keys(characterData.otherVariables).length} additional variables`);
      debug.log("\u{1F50D} Checking for race in otherVariables:", Object.keys(characterData.otherVariables).filter((key) => key.toLowerCase().includes("race")).map((key) => `${key}: ${characterData.otherVariables[key]}`));
      const propertyIdToName = /* @__PURE__ */ new Map();
      properties.forEach((prop) => {
        if (prop._id && prop.name) {
          propertyIdToName.set(prop._id, prop.name);
        }
      });
      debug.log(`\u{1F4CB} Built property ID map with ${propertyIdToName.size} entries`);
      const sampleEntries = Array.from(propertyIdToName.entries()).slice(0, 10);
      debug.log("\u{1F4CB} Sample property ID map entries:", sampleEntries);
      const classEntries = properties.filter((p) => p.type === "class" && p._id && p.name);
      debug.log("\u{1F4CB} Class entries in map:", classEntries.map((p) => ({ id: p._id, name: p.name, type: p.type })));
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
            debug.log(`\u{1F50D} DEBUG: Found folder "${prop.name}" with parentDepth ${parentDepth}, ancestors:`, prop.ancestors);
            if (parentDepth <= 2) {
              debug.log("\u{1F50D} Found potential race folder:", {
                name: prop.name,
                type: prop.type,
                _id: prop._id,
                parentDepth
              });
              if (!raceFound) {
                raceName = prop.name;
                racePropertyId = prop._id;
                characterData.race = prop.name;
                debug.log("\u{1F50D} Set race to:", prop.name, "(ID:", prop._id, ")");
                raceFound = true;
              }
            } else {
              debug.log(`\u{1F50D} DEBUG: Skipping "${prop.name}" - parentDepth ${parentDepth} > 2`);
            }
          }
        }
        if (prop.type === "race") {
          debug.log("\u{1F50D} Found race property:", prop);
          if (prop.name) {
            raceName = prop.name;
            racePropertyId = prop._id;
            characterData.race = prop.name;
            debug.log("\u{1F50D} Set race to:", prop.name, "(ID:", prop._id, ")");
            raceFound = true;
          }
        } else if (prop.type === "species") {
          debug.log("\u{1F50D} Found species property:", prop);
          if (prop.name) {
            raceName = prop.name;
            racePropertyId = prop._id;
            characterData.race = prop.name;
            debug.log("\u{1F50D} Set race to (from species):", prop.name, "(ID:", prop._id, ")");
            raceFound = true;
          }
        } else if (prop.type === "characterRace") {
          debug.log("\u{1F50D} Found characterRace property:", prop);
          if (prop.name) {
            raceName = prop.name;
            racePropertyId = prop._id;
            characterData.race = prop.name;
            debug.log("\u{1F50D} Set race to (from characterRace):", prop.name, "(ID:", prop._id, ")");
            raceFound = true;
          }
        }
        switch (prop.type) {
          case "class":
            if (prop.name && !prop.inactive && !prop.disabled) {
              const cleanName = prop.name.replace(/\s*\[Multiclass\]/i, "").trim();
              const normalizedClassName = cleanName.toLowerCase().trim();
              debug.log(`\u{1F4DA} Found class property: "${prop.name}" (cleaned: "${cleanName}", normalized: "${normalizedClassName}")`);
              if (!uniqueClasses.has(normalizedClassName)) {
                debug.log(`  \u2705 Adding class (not in set yet)`);
                uniqueClasses.add(normalizedClassName);
                if (characterData.class) {
                  characterData.class += ` / ${cleanName}`;
                } else {
                  characterData.class = cleanName;
                }
              } else {
                debug.log(`  \u23ED\uFE0F  Skipping class (already in set:`, Array.from(uniqueClasses), ")");
              }
            } else if (prop.name && (prop.inactive || prop.disabled)) {
              debug.log(`  \u23ED\uFE0F  Skipping inactive/disabled class: ${prop.name}`);
            }
            break;
          case "classLevel":
            if (prop.inactive || prop.disabled) {
              if (prop.name) {
                debug.log(`  \u23ED\uFE0F  Skipping inactive/disabled classLevel: ${prop.name}`);
              }
              break;
            }
            characterData.level += 1;
            if (prop.name) {
              const cleanName = prop.name.replace(/\s*\[Multiclass\]/i, "").trim();
              const normalizedClassName = cleanName.toLowerCase().trim();
              debug.log(`\u{1F4CA} Found classLevel property: "${prop.name}" (cleaned: "${cleanName}", normalized: "${normalizedClassName}")`);
              if (!uniqueClasses.has(normalizedClassName)) {
                debug.log(`  \u2705 Adding class from classLevel (not in set yet)`);
                uniqueClasses.add(normalizedClassName);
                if (characterData.class) {
                  characterData.class += ` / ${cleanName}`;
                } else {
                  characterData.class = cleanName;
                }
              } else {
                debug.log(`  \u23ED\uFE0F  Skipping classLevel (already in set:`, Array.from(uniqueClasses), ")");
              }
            }
            break;
          case "race":
            if (prop.name) {
              characterData.race = prop.name;
              debug.log("\u{1F50D} Found race property:", prop.name);
            }
            break;
          case "species":
            if (prop.name) {
              characterData.race = prop.name;
              debug.log("\u{1F50D} Found species property (using as race):", prop.name);
            }
            break;
          case "characterRace":
            if (prop.name) {
              characterData.race = prop.name;
              debug.log("\u{1F50D} Found characterRace property:", prop.name);
            }
            break;
          case "background":
            if (prop.name) {
              characterData.background = prop.name;
            }
            break;
          case "feature":
            if (prop.inactive || prop.disabled) {
              debug.log(`\u23ED\uFE0F Skipping inactive/disabled feature: ${prop.name}`);
              break;
            }
            const feature = {
              name: prop.name || "Unnamed Feature",
              description: prop.description || "",
              uses: prop.uses,
              roll: prop.roll || "",
              damage: prop.damage || ""
            };
            characterData.features.push(feature);
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
              characterData.actions.push({
                name: feature.name,
                actionType: "feature",
                attackRoll: "",
                damage: feature.damage || feature.roll,
                damageType: "",
                description: feature.description
              });
              debug.log(`\u2694\uFE0F Added feature with roll to actions: ${feature.name}`);
            }
            break;
          case "toggle":
            if (prop.inactive || prop.disabled) {
              debug.log(`\u23ED\uFE0F Skipping inactive/disabled toggle: ${prop.name}`);
              break;
            }
            debug.log(`\u{1F518} Found toggle: ${prop.name} (enabled on DiceCloud: ${prop.enabled})`);
            debug.log(`\u{1F518} Toggle full object:`, prop);
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
            debug.log(`\u{1F518} Toggle "${prop.name}" has ${toggleChildren.length} children:`, toggleChildren.map((c) => c.name));
            debug.log(`\u{1F518} Toggle children full objects:`, toggleChildren);
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
              characterData.conditions.push({
                name: prop.name,
                effect: effectValue || "1d4",
                // Default to 1d4 if no effect found
                active: true,
                source: "dicecloud"
              });
              debug.log(`\u2728 Added active condition: ${prop.name} (${effectValue || "1d4"})`);
            }
            toggleChildren.forEach((child) => {
              debug.log(`\u{1F518}   Child "${child.name}" has type: ${child.type}`);
            });
            toggleChildren.forEach((child) => {
              if (child.inactive || child.disabled) {
                debug.log(`\u23ED\uFE0F Skipping inactive/disabled toggle child: ${child.name}`);
                return;
              }
              if (child.type === "feature" || child.type === "damage" || child.type === "effect") {
                let childDescription = "";
                if (child.summary) {
                  if (typeof child.summary === "object" && child.summary.text) {
                    childDescription = child.summary.text;
                  } else if (typeof child.summary === "string") {
                    childDescription = child.summary;
                  }
                } else if (child.description) {
                  if (typeof child.description === "object" && child.description.text) {
                    childDescription = child.description.text;
                  } else if (typeof child.description === "string") {
                    childDescription = child.description;
                  }
                }
                if (!childDescription && prop.summary) {
                  if (typeof prop.summary === "object" && prop.summary.text) {
                    childDescription = prop.summary.text;
                  } else if (typeof prop.summary === "string") {
                    childDescription = prop.summary;
                  }
                }
                if (!childDescription && prop.description) {
                  if (typeof prop.description === "object" && prop.description.text) {
                    childDescription = prop.description.text;
                  } else if (typeof prop.description === "string") {
                    childDescription = prop.description;
                  }
                }
                let damageValue = "";
                let rollValue = "";
                if (child.type === "damage") {
                  if (typeof child.amount === "string") {
                    damageValue = child.amount;
                  } else if (typeof child.amount === "object") {
                    damageValue = child.amount.value || child.amount.calculation || "";
                  }
                  debug.log(`\u{1F3AF} Found damage property: "${child.name || prop.name}" with value: "${damageValue}"`);
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
                  description: childDescription,
                  uses: child.uses || prop.uses,
                  roll: rollValue,
                  damage: damageValue
                };
                debug.log(`\u{1F518} Created toggle feature: "${toggleFeature.name}" with damage: "${damageValue}", roll: "${rollValue}"`);
                characterData.features.push(toggleFeature);
                const validActionTypes = ["action", "bonus", "reaction", "free", "legendary", "lair", "other"];
                const hasValidActionType = child.actionType && validActionTypes.includes(child.actionType.toLowerCase());
                const hasValidRoll = typeof toggleFeature.roll === "string" && toggleFeature.roll.trim().length > 0;
                const hasValidDamage = typeof toggleFeature.damage === "string" && toggleFeature.damage.trim().length > 0;
                debug.log(`\u{1F518} Checking "${toggleFeature.name}": hasValidRoll=${hasValidRoll}, hasValidDamage=${hasValidDamage}, hasValidActionType=${hasValidActionType}, type=${child.type}`);
                const isDamageEffect = child.type === "effect" && hasValidDamage;
                const shouldAddToActions = (child.type !== "effect" || isDamageEffect) && (hasValidRoll || hasValidDamage || hasValidActionType);
                debug.log(`\u{1F518} shouldAddToActions for "${toggleFeature.name}": ${shouldAddToActions} (isDamageEffect=${isDamageEffect})`);
                if (shouldAddToActions) {
                  characterData.actions.push({
                    name: toggleFeature.name,
                    actionType: child.actionType || "feature",
                    attackRoll: "",
                    damage: toggleFeature.damage || toggleFeature.roll,
                    damageType: child.damageType || "",
                    description: toggleFeature.description
                  });
                  if (toggleFeature.damage || toggleFeature.roll) {
                    debug.log(`\u2694\uFE0F Added toggle feature to actions: ${toggleFeature.name}`);
                  } else {
                    debug.log(`\u2728 Added toggle non-attack feature to actions: ${toggleFeature.name} (${child.actionType || "feature"})`);
                  }
                }
              }
            });
            break;
          case "spell":
            if (prop.inactive || prop.disabled) {
              debug.log(`\u23ED\uFE0F Skipping inactive/disabled spell: ${prop.name}`);
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
            debug.log(`\u{1F50D} Spell "${prop.name}" debug:`, {
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
              debug.log(`\u2705 Found source from parent for "${prop.name}": ${source}`);
            } else if (prop.ancestors && prop.ancestors.length > 0) {
              let found = false;
              for (let i = prop.ancestors.length - 1; i >= 0 && !found; i--) {
                const ancestor = prop.ancestors[i];
                const ancestorId = typeof ancestor === "object" ? ancestor.id : ancestor;
                if (ancestorId && propertyIdToName.has(ancestorId)) {
                  source = propertyIdToName.get(ancestorId);
                  debug.log(`\u2705 Found source from ancestor[${i}] for "${prop.name}": ${source}`);
                  found = true;
                }
              }
              if (!found) {
                debug.log(`\u274C No source found in ${prop.ancestors.length} ancestors for "${prop.name}"`);
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
                debug.log(`\u2705 Found source from libraryTags for "${prop.name}": ${source}`);
              }
            } else if (source === "Unknown Source" && prop.tags && prop.tags.length > 0) {
              source = prop.tags.join(", ");
              debug.log(`\u2705 Found source from tags for "${prop.name}": ${source}`);
            }
            if (source === "Unknown Source") {
              debug.log(`\u274C No source found for "${prop.name}"`);
            }
            const levelRequirement = source.match(/(\d+)(?:st|nd|rd|th)?\s+Level/i);
            const requiredLevel = levelRequirement ? parseInt(levelRequirement[1]) : 0;
            const characterLevel = characterData.level || 1;
            if (requiredLevel > characterLevel) {
              debug.log(`\u23ED\uFE0F Skipping "${prop.name}" from "${source}" (requires level ${requiredLevel}, character is level ${characterLevel})`);
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
              characterData.actions.push({
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
              debug.log(`\u2728 Added Font of Magic conversion as action: ${prop.name}`);
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
            debug.log(`\u{1F50D} Spell "${prop.name}" has ${spellChildren.length} child properties:`, spellChildren.map((c) => ({ type: c.type, name: c.name })));
            spellChildren.forEach((child) => {
              debug.log(`  \u{1F4CB} Processing child: ${child.name} (${child.type})`);
              const isShieldSpell2 = prop.name && prop.name.toLowerCase().trim() === "shield";
              if (isShieldSpell2 && (child.type === "attack" || child.type === "roll" && child.name && child.name.toLowerCase().includes("attack"))) {
                debug.log(`    \u{1F6E1}\uFE0F Shield spell - skipping attack child: ${child.name}`);
                return;
              }
              if (child.type === "attack" || child.type === "roll" && child.name && child.name.toLowerCase().includes("attack")) {
                debug.log(`    \u{1F3AF} Attack child found:`, { name: child.name, roll: child.roll, type: child.type });
                if (child.roll) {
                  if (typeof child.roll === "string") {
                    attackRoll = child.roll;
                  } else if (typeof child.roll === "object" && child.roll.value !== void 0) {
                    const bonus = child.roll.value;
                    attackRoll = bonus >= 0 ? `1d20+${bonus}` : `1d20${bonus}`;
                  } else if (typeof child.roll === "object" && child.roll.calculation) {
                    attackRoll = child.roll.calculation;
                  } else {
                    debug.log(`    \u26A0\uFE0F Attack child has unexpected roll structure:`, child.roll);
                    attackRoll = "use_spell_attack_bonus";
                  }
                } else {
                  debug.log(`    \u26A0\uFE0F Attack child has no roll property, using spell attack bonus`);
                  attackRoll = "use_spell_attack_bonus";
                }
                debug.log(`    \u2705 Attack roll set to: ${attackRoll}`);
              }
              if (child.type === "damage" || child.type === "roll" && child.name && child.name.toLowerCase().includes("damage")) {
                debug.log(`    \u{1F4CA} Damage child found:`, {
                  name: child.name,
                  amount: child.amount,
                  roll: child.roll,
                  damageType: child.damageType
                });
                let damageFormula = "";
                if (child.amount) {
                  if (typeof child.amount === "string") {
                    damageFormula = child.amount;
                    debug.log(`      \u2192 Using amount string: "${damageFormula}"`);
                  } else if (typeof child.amount === "object") {
                    if (child.amount.value !== void 0) {
                      damageFormula = String(child.amount.value);
                      debug.log(`      \u2192 Using amount.value: "${damageFormula}"`);
                    } else if (child.amount.calculation) {
                      damageFormula = child.amount.calculation;
                      debug.log(`      \u2192 Using amount.calculation: "${damageFormula}"`);
                    }
                  }
                } else if (child.roll) {
                  if (typeof child.roll === "string") {
                    damageFormula = child.roll;
                    debug.log(`      \u2192 Using roll string: "${damageFormula}"`);
                  } else if (typeof child.roll === "object") {
                    if (child.roll.value !== void 0) {
                      damageFormula = String(child.roll.value);
                      debug.log(`      \u2192 Using roll.value: "${damageFormula}"`);
                    } else if (child.roll.calculation) {
                      damageFormula = child.roll.calculation;
                      debug.log(`      \u2192 Using roll.calculation: "${damageFormula}"`);
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
            damageRolls.forEach((roll) => {
              const key = `${roll.damage}|${roll.damageType}`;
              if (!seenRolls.has(key)) {
                seenRolls.add(key);
                uniqueDamageRolls.push(roll);
              } else {
                console.log(`    \u{1F504} Skipping duplicate damage roll: ${roll.damage} (${roll.damageType})`);
              }
            });
            damageRolls = uniqueDamageRolls;
            const lowerDesc = fullDescription.toLowerCase();
            const hasTempHPKeyword = lowerDesc.includes("temporary hit point") || lowerDesc.includes("temp hp") || lowerDesc.includes("temporary hp");
            if (hasTempHPKeyword) {
              debug.log(`  \u{1F6E1}\uFE0F Spell "${prop.name}" mentions temporary hit points`);
              if (damageRolls.length === 0) {
                debug.log(`  \u{1F6E1}\uFE0F No damage children found, extracting temp HP from description`);
                const beforeTempHP = fullDescription.substring(0, fullDescription.toLowerCase().indexOf("temporary"));
                const dicePattern = /(\d+d\d+(?:\s*[+\-]\s*\d+)?)/i;
                const match = beforeTempHP.match(dicePattern);
                if (match) {
                  const formula = match[1].replace(/\s/g, "");
                  damageRolls.push({
                    damage: formula,
                    damageType: "temphp"
                  });
                  debug.log(`  \u2705 Extracted temp HP dice formula from description: ${formula}`);
                } else {
                  const numberPattern = /(?:gain|additional)\s+(\d+)(?:\s+(?:additional))?\s+temporary/i;
                  const numberMatch = fullDescription.match(numberPattern);
                  if (numberMatch) {
                    const amount = numberMatch[1];
                    damageRolls.push({
                      damage: amount,
                      damageType: "temphp"
                    });
                    debug.log(`  \u2705 Extracted temp HP fixed amount from description: ${amount}`);
                  }
                }
              } else {
                damageRolls.forEach((roll) => {
                  if (roll.damageType === "untyped" || !roll.damageType || roll.damageType === "healing") {
                    roll.damageType = "temphp";
                    debug.log(`  \u{1F6E1}\uFE0F Corrected ${prop.name} damage type to temphp`);
                  }
                });
              }
            }
            let damage = damageRolls.length > 0 ? damageRolls[0].damage : "";
            let damageType = damageRolls.length > 0 ? damageRolls[0].damageType : "";
            if (description) {
              const lowerDesc2 = description.toLowerCase();
              debug.log(`  \u{1F50D} Checking description for spell attack (attackRoll currently: "${attackRoll}")`);
              const isShield = prop.name && prop.name.toLowerCase() === "shield";
              const hasAttackMention = /\b(spell attack|attack roll)\b/i.test(description);
              if (!attackRoll && hasAttackMention && !isShield) {
                attackRoll = "use_spell_attack_bonus";
                debug.log(`  \u{1F4A1} Found attack pattern in description, marking for spell attack bonus`);
              } else if (!attackRoll) {
                debug.log(`  \u26A0\uFE0F No attack pattern found in description for "${prop.name}"`);
              } else if (isShield && attackRoll) {
                debug.log(`  \u{1F6E1}\uFE0F Shield spell detected - removing attack roll`);
                attackRoll = "";
              } else {
                debug.log(`  \u2139\uFE0F Attack roll already set from child properties, skipping description check`);
              }
              if (!damage) {
                const damagePattern = /(\d+d\d+(?:\s*\+\s*\d+)?)\s+(\w+)\s+damage/i;
                const damageMatch = description.match(damagePattern);
                if (damageMatch) {
                  damage = damageMatch[1].replace(/\s/g, "");
                  damageType = damageMatch[2];
                  debug.log(`  \u{1F4A1} Found damage in description: ${damage} ${damageType}`);
                }
              }
            }
            let cleanRange = prop.range || "";
            if (cleanRange && cleanRange.toLowerCase().includes("spellsniper")) {
              debug.log(`  \u{1F50D} Cleaning spellSniper from range: "${cleanRange}"`);
              let match = cleanRange.match(/\{(\d+)\s*\*\s*\([^)]*spellSniper[^)]*\)\}/i);
              if (match) {
                const baseValue = match[1];
                const afterMatch = cleanRange.substring(match.index + match[0].length).trim();
                cleanRange = `${baseValue} ${afterMatch}`.trim();
                debug.log(`  \u2705 Extracted base range (pattern 1): "${cleanRange}"`);
              } else {
                match = cleanRange.match(/\{(\d+)[^}]*spellSniper[^}]*\}/i);
                if (match) {
                  const baseValue = match[1];
                  const afterMatch = cleanRange.substring(match.index + match[0].length).trim();
                  cleanRange = `${baseValue} ${afterMatch}`.trim();
                  debug.log(`  \u2705 Extracted base range (pattern 2): "${cleanRange}"`);
                } else {
                  cleanRange = cleanRange.replace(/\{[^}]*spellSniper[^}]*\}/gi, "").trim();
                  debug.log(`  \u2705 Removed spellSniper expression (fallback): "${cleanRange}"`);
                }
              }
            }
            const processedOrGroups = /* @__PURE__ */ new Set();
            damageRolls.forEach((roll, index) => {
              if (processedOrGroups.has(index))
                return;
              const similarRolls = [];
              for (let i = index + 1; i < damageRolls.length; i++) {
                if (processedOrGroups.has(i))
                  continue;
                if (damageRolls[i].damage === roll.damage && damageRolls[i].damageType !== roll.damageType) {
                  similarRolls.push(i);
                }
              }
              if (similarRolls.length > 0) {
                const orGroupId = `or_group_${index}`;
                roll.orGroup = orGroupId;
                roll.orChoices = [
                  { damageType: roll.damageType },
                  ...similarRolls.map((i) => ({ damageType: damageRolls[i].damageType }))
                ];
                similarRolls.forEach((i) => {
                  processedOrGroups.add(i);
                  damageRolls[i].orGroup = orGroupId;
                  damageRolls[i].isOrGroupMember = true;
                });
                debug.log(`\u{1F500} Detected OR condition in "${prop.name}": ${roll.damage} with types: ${roll.orChoices.map((c) => c.damageType).join(" OR ")}`);
              }
            });
            let isLifesteal = false;
            const knownLifestealSpells = ["vampiric touch", "life transference", "absorb elements"];
            const isKnownLifesteal = prop.name && knownLifestealSpells.some(
              (name) => prop.name.toLowerCase().includes(name)
            );
            if (isKnownLifesteal) {
              isLifesteal = true;
              debug.log(`\u{1F489} Detected lifesteal mechanic in "${prop.name}" (known lifesteal spell)`);
              const hasDamage = damageRolls.some((r) => r.damageType && r.damageType.toLowerCase() !== "healing" && r.damageType.toLowerCase() !== "temphp");
              const hasHealing = damageRolls.some((r) => r.damageType && r.damageType.toLowerCase() === "healing");
              if (hasDamage && !hasHealing) {
                debug.log(`  \u{1F489} Adding synthetic healing roll for lifesteal spell "${prop.name}"`);
                const damageRoll = damageRolls.find((r) => r.damageType && r.damageType.toLowerCase() !== "healing" && r.damageType.toLowerCase() !== "temphp");
                if (damageRoll) {
                  const lowerDesc2 = fullDescription.toLowerCase();
                  const isHalfHealing = lowerDesc2.includes("half") && (lowerDesc2.includes("regain") || lowerDesc2.includes("heal"));
                  const healingFormula = isHalfHealing ? `(${damageRoll.damage}) / 2` : damageRoll.damage;
                  damageRolls.push({
                    damage: healingFormula,
                    damageType: "healing"
                  });
                  debug.log(`  \u2705 Added healing roll: ${healingFormula}`);
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
                  debug.log(`\u{1F489} Detected lifesteal mechanic in "${prop.name}"`);
                } else {
                  debug.log(`\u{1F50D} Not lifesteal: "${prop.name}" - has damage and healing but description doesn't match patterns`);
                  debug.log(`    Description snippet: ${lowerDesc2.substring(0, 200)}`);
                }
              }
            }
            const isShieldSpell = prop.name && prop.name.toLowerCase() === "shield";
            if (isShieldSpell && attackRoll) {
              debug.log(`  \u{1F6E1}\uFE0F Shield spell detected - removing attack roll (was: "${attackRoll}")`);
              attackRoll = "";
            }
            const knownAttackSpells = ["guiding bolt", "scorching ray", "eldritch blast", "fire bolt", "ray of frost", "chromatic orb"];
            const isKnownAttackSpell = prop.name && knownAttackSpells.some(
              (name) => prop.name.toLowerCase().includes(name)
            );
            if (isKnownAttackSpell && !attackRoll) {
              attackRoll = "use_spell_attack_bonus";
              debug.log(`  \u2694\uFE0F Known attack spell "${prop.name}" missing attack roll - adding it`);
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
                  debug.log(`  \u2705 Added default cantrip damage for "${prop.name}": ${damageInfo.damage} ${damageInfo.damageType}`);
                  break;
                }
              }
            }
            const isMeldIntoStone = prop.name && prop.name.toLowerCase().includes("meld into stone");
            if (isMeldIntoStone && damageRolls.length === 0) {
              debug.log(`  \u{1FAA8} Meld into Stone detected - extracting conditional damage from description`);
              const damagePattern = /(\d+d\d+)(?:\s+\w+)?\s+damage/i;
              const match = fullDescription.match(damagePattern);
              if (match) {
                const formula = match[1];
                damageRolls.push({
                  damage: formula,
                  damageType: "bludgeoning"
                });
                debug.log(`  \u2705 Added conditional damage for Meld into Stone: ${formula} bludgeoning`);
              }
            }
            if (attackRoll || damageRolls.length > 0) {
              debug.log(`\u{1F4CA} Spell "${prop.name}" final values:`, {
                attackRoll: attackRoll || "(none)",
                damageRolls: damageRolls.length > 0 ? damageRolls : "(none)",
                isLifesteal,
                hasSummary: !!summary,
                hasDescription: !!description,
                fullDescriptionSnippet: fullDescription ? fullDescription.substring(0, 100) : ""
              });
            }
            characterData.spells.push({
              name: prop.name || "Unnamed Spell",
              level: prop.level || 0,
              school: prop.school || "",
              castingTime: prop.castingTime || "",
              range: cleanRange,
              components: prop.components || "",
              duration: prop.duration || "",
              description: fullDescription,
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
              resources: prop.resources || null
              // Store resource consumption data
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
            characterData.inventory.push({
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
            characterData.proficiencies.push({
              name: prop.name || "",
              type: prop.proficiencyType || "other"
            });
            break;
          case "action":
            if (prop.name && !prop.inactive && !prop.disabled) {
              let description2 = "";
              if (prop.summary) {
                if (typeof prop.summary === "string") {
                  description2 = prop.summary;
                } else if (typeof prop.summary === "object") {
                  description2 = prop.summary.text || prop.summary.value || "";
                }
              } else if (prop.description) {
                if (typeof prop.description === "string") {
                  description2 = prop.description;
                } else if (typeof prop.description === "object") {
                  description2 = prop.description.text || prop.description.value || "";
                }
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
                              debug.log(`\u23ED\uFE0F Skipping dice formula effect in weapon damage: ${effect.amount.calculation} (handled by separate action)`);
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
                characterData.features.push(metamagicFeature);
                debug.log(`\u{1F52E} Added metamagic action to features: ${prop.name}`);
              }
              const validActionTypes = ["action", "bonus", "reaction", "free", "legendary", "lair", "other"];
              const hasValidActionType = prop.actionType && validActionTypes.includes(prop.actionType.toLowerCase());
              if (!isMetamagic && (attackRoll2 || hasValidActionType)) {
                const action = {
                  _id: prop._id,
                  // Include DiceCloud property ID for syncing
                  name: prop.name,
                  actionType: prop.actionType || "other",
                  attackRoll: attackRoll2,
                  damage: damage2,
                  damageType: damageType2,
                  description: description2,
                  uses: prop.uses || null,
                  usesUsed: prop.usesUsed || 0,
                  usesLeft: prop.usesLeft,
                  // DiceCloud's computed uses remaining field
                  resources: prop.resources || null
                  // Store DiceCloud's structured resource consumption data
                };
                characterData.actions.push(action);
                if (attackRoll2) {
                  debug.log(`\u2694\uFE0F Added attack action: ${action.name} (attack: ${attackRoll2}, damage: ${damage2} ${damageType2})`);
                } else {
                  debug.log(`\u2728 Added non-attack action: ${action.name} (${prop.actionType || "other"})`);
                }
              }
            } else if (prop.inactive || prop.disabled) {
              debug.log(`\u23ED\uFE0F Skipped action: ${prop.name} (inactive: ${!!prop.inactive}, disabled: ${!!prop.disabled})`);
            }
            break;
          case "attribute":
            if (prop.name && (prop.attributeType === "resource" || prop.attributeType === "healthBar") && !prop.inactive && !prop.disabled) {
              debug.log(`\u{1F50D} Potential resource found: ${prop.name} (type: ${prop.attributeType}, variable: ${prop.variableName || "none"})`);
              const lowerName = prop.name.toLowerCase();
              if (lowerName.includes("hit point") || lowerName === "hp" || lowerName.includes("slot level to create")) {
                debug.log(`\u23ED\uFE0F Skipping filtered resource: ${prop.name}`);
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
                debug.log(`  \u23ED\uFE0F  Skipping utility resource (max=0): ${resource.name}`);
                break;
              }
              if (!uniqueResources.has(resourceKey)) {
                uniqueResources.add(resourceKey);
                characterData.resources.push(resource);
                debug.log(`\u{1F48E} Added resource: ${resource.name} (${resource.current}/${resource.max})`);
              } else {
                debug.log(`  \u23ED\uFE0F  Skipping duplicate resource: ${resource.name}`);
              }
            }
            break;
        }
      });
      debug.log("\u{1F50D} All property types found in character:", Array.from(propertyTypes).sort());
      extractCompanions(characterData, apiData);
      debug.log("\u{1F50D} DEBUG: Checking for companions");
      debug.log(
        "\u{1F4CA} Properties with type=creature:",
        apiData.creatureProperties.filter((p) => p.type === "creature").map((p) => ({
          name: p.name,
          type: p.type,
          tags: p.tags
        }))
      );
      debug.log(
        '\u{1F4CA} Features with "companion" in name:',
        characterData.features.filter((f) => /companion|beast/i.test(f.name)).map((f) => f.name)
      );
      if (racePropertyId && raceName) {
        debug.log("\u{1F50D} Looking for subrace children of race property ID:", racePropertyId);
        const subraceProps = apiData.creatureProperties.filter((prop) => {
          const isChild = prop.parent && prop.parent.id === racePropertyId;
          const hasSubraceTag = prop.tags && Array.isArray(prop.tags) && prop.tags.some(
            (tag) => tag.toLowerCase().includes("subrace")
          );
          const isFolder = prop.type === "folder";
          if (isChild) {
            debug.log("\u{1F50D} Found child of race:", {
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
          debug.log("\u{1F50D} Found subrace child property:", subraceProp.name, "with tags:", subraceProp.tags);
          characterData.race = `${raceName} - ${subraceProp.name}`;
          debug.log("\u{1F50D} Combined race with subrace:", characterData.race);
        } else {
          debug.log("\u{1F50D} No subrace children found for race");
        }
      }
      if (!raceFound && !characterData.race) {
        debug.log("\u{1F50D} Race not found in properties, checking otherVariables...");
        const raceVars = Object.keys(characterData.otherVariables).filter(
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
            const subRaceValue = characterData.otherVariables[subRaceVar];
            debug.log(`\u{1F50D} DEBUG: subRace value:`, subRaceValue, `type:`, typeof subRaceValue);
            if (typeof subRaceValue === "object" && subRaceValue !== null) {
              debug.log(`\u{1F50D} DEBUG: subRace object keys:`, Object.keys(subRaceValue));
              if (subRaceValue.name) {
                suberaceName = formatRaceName(subRaceValue.name);
                debug.log(`\u{1F50D} Found subrace name: ${suberaceName}`);
              } else if (subRaceValue.text) {
                suberaceName = formatRaceName(subRaceValue.text);
                debug.log(`\u{1F50D} Found subrace text: ${suberaceName}`);
              } else if (subRaceValue.value) {
                suberaceName = formatRaceName(subRaceValue.value);
                debug.log(`\u{1F50D} Found subrace value: ${suberaceName}`);
              }
            } else if (typeof subRaceValue === "string") {
              suberaceName = formatRaceName(subRaceValue);
              debug.log(`\u{1F50D} Found subrace string: ${suberaceName}`);
            }
          }
          const raceVar = raceVars.find((key) => key.toLowerCase() === "race");
          if (raceVar) {
            const raceValue = characterData.otherVariables[raceVar];
            debug.log(`\u{1F50D} DEBUG: race value:`, raceValue, `type:`, typeof raceValue);
            if (typeof raceValue === "object" && raceValue !== null) {
              debug.log(`\u{1F50D} DEBUG: race object keys:`, Object.keys(raceValue));
              if (raceValue.name) {
                raceName2 = formatRaceName(raceValue.name);
                debug.log(`\u{1F50D} Found race name: ${raceName2}`);
              } else if (raceValue.text) {
                raceName2 = formatRaceName(raceValue.text);
                debug.log(`\u{1F50D} Found race text: ${raceName2}`);
              } else if (raceValue.value) {
                raceName2 = formatRaceName(raceValue.value);
                debug.log(`\u{1F50D} Found race value: ${raceName2}`);
              }
            } else if (typeof raceValue === "string") {
              raceName2 = formatRaceName(raceValue);
              debug.log(`\u{1F50D} Found race string: ${raceName2}`);
            }
          }
          if (!raceName2) {
            for (const varName of raceVars) {
              const varValue = characterData.otherVariables[varName];
              if (typeof varValue === "object" && varValue !== null && varValue.value === true) {
                const extracted = extractRaceFromVarName(varName);
                if (extracted) {
                  raceName2 = extracted;
                  debug.log(`\u{1F50D} Extracted race from variable name: ${varName} -> ${raceName2}`);
                  break;
                }
              }
            }
          }
          if (raceName2 && suberaceName) {
            characterData.race = `${raceName2} - ${suberaceName}`;
            debug.log(`\u{1F50D} Combined race and subrace: ${characterData.race}`);
          } else if (suberaceName) {
            characterData.race = suberaceName;
            debug.log(`\u{1F50D} Using subrace as race: ${characterData.race}`);
          } else if (raceName2) {
            characterData.race = raceName2;
            debug.log(`\u{1F50D} Using race: ${characterData.race}`);
          } else {
            debug.log("\u{1F50D} Could not determine race from variables:", raceVars);
          }
        } else {
          debug.log("\u{1F50D} No race found in otherVariables either");
        }
      }
      debug.log("Parsed character data:", characterData);
      return characterData;
    }
    function extractCompanions(characterData, apiData) {
      debug.log("\u{1F43E}\u{1F43E}\u{1F43E} extractCompanions FUNCTION STARTED \u{1F43E}\u{1F43E}\u{1F43E}");
      debug.log("\u{1F43E} Searching for companion creatures in features...");
      const companionPatterns = [
        /companion/i,
        /beast of/i,
        /familiar/i,
        /summon/i,
        /mount/i,
        /steel defender/i,
        /homunculus/i,
        /drake/i
      ];
      debug.log("\u{1F43E} Total features to check:", characterData.features.length);
      characterData.features.forEach((feature, index) => {
        const isCompanion = companionPatterns.some((pattern) => pattern.test(feature.name));
        if (isCompanion) {
          debug.log(`\u{1F43E} Found potential companion: ${feature.name} (index ${index})`);
          debug.log(`\u{1F50D} DEBUG: Feature object keys:`, Object.keys(feature));
          debug.log(`\u{1F50D} DEBUG: Has description:`, !!feature.description);
          debug.log(`\u{1F50D} DEBUG: Description value:`, feature.description);
          if (feature.description) {
            debug.log(`\u{1F50D} DEBUG: Companion description:`, feature.description);
            const companion = parseCompanionStatBlock(feature.name, feature.description);
            if (companion) {
              characterData.companions.push(companion);
              debug.log(`\u2705 Added companion: ${companion.name}`);
            } else {
              debug.log(`\u274C Failed to parse companion: ${feature.name} - no valid stat block found`);
            }
          } else {
            debug.log(`\u26A0\uFE0F Companion ${feature.name} has no description - skipping (no stat block)`);
          }
        }
      });
      debug.log(`\u{1F43E} Total companions found: ${characterData.companions.length}`);
    }
    function parseCompanionStatBlock(name, description) {
      let descText = description;
      if (typeof description === "object" && description !== null) {
        descText = description.value || description.text || "";
      } else if (typeof description !== "string") {
        debug.log(`\u26A0\uFE0F Companion "${name}" has invalid description type:`, typeof description);
        return null;
      }
      if (!descText || descText.trim() === "") {
        debug.log(`\u26A0\uFE0F Companion "${name}" has empty description`);
        return null;
      }
      debug.log(`\u{1F50D} DEBUG: Parsing companion "${name}" with description:`, descText);
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
        debug.log(`\u2705 Parsed size/type: ${companion.size} ${companion.type}, ${companion.alignment}`);
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
          debug.log(`\u2705 Parsed AC: ${companion.ac}`);
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
          debug.log(`\u2705 Parsed HP: ${companion.hp}`);
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
          debug.log(`\u2705 Parsed Speed: ${companion.speed}`);
          break;
        }
      }
      const abilities = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
      const lines = descText.split("\n");
      let abilityLine = null;
      debug.log(`\u{1F50D} DEBUG: Checking ${lines.length} lines for ability table`);
      for (const line of lines) {
        if (line.match(/^>?\s*\|\s*\d+\s*\([+\-]\d+\)\s*\|\s*\d+\s*\([+\-]\d+\)\s*\|\s*\d+\s*\([+\-]\d+\)\s*\|\s*\d+\s*\([+\-]\d+\)\s*\|\s*\d+\s*\([+\-]\d+\)\s*\|\s*\d+\s*\([+\-]\d+\)\s*\|/)) {
          abilityLine = line;
          debug.log(`\u{1F50D} DEBUG: Found matching ability line`);
        }
      }
      if (abilityLine) {
        debug.log(`\u{1F50D} Found ability line: ${abilityLine}`);
        const cleanLine = abilityLine.replace(/^>\|/, "");
        const abilityValues = cleanLine.split("|").filter((val) => val.trim());
        debug.log(`\u{1F50D} Split ability values:`, abilityValues);
        if (abilityValues.length >= 6) {
          const abilityScores = abilityValues.slice(-6);
          debug.log(`\u{1F50D} Using ability scores:`, abilityScores);
          abilities.forEach((ability, index) => {
            if (index < abilityScores.length) {
              const abilityText = abilityScores[index].trim();
              debug.log(`\u{1F50D} DEBUG: Processing ${ability} with text: "${abilityText}"`);
              const abilityMatch = abilityText.match(/(\d+)\s*\(([+\-]\d+)\)/);
              debug.log(`\u{1F50D} DEBUG: ${ability} regex result:`, abilityMatch);
              if (abilityMatch) {
                companion.abilities[ability.toLowerCase()] = {
                  score: parseInt(abilityMatch[1]),
                  modifier: parseInt(abilityMatch[2])
                };
                debug.log(`\u2705 Parsed ${ability}: ${abilityMatch[1]} (${abilityMatch[2]})`);
              } else {
                debug.log(`\u274C Failed to parse ${ability} from "${abilityText}"`);
              }
            }
          });
        } else {
          debug.log(`\u274C Not enough ability values found. Found ${abilityValues.length} values`);
        }
      } else {
        debug.log(`\u274C No ability line found, trying fallback`);
        abilities.forEach((ability) => {
          const regex = new RegExp(ability + "\\s+(\\d+)\\s*\\(([+\\-]\\d+)\\)", "i");
          const match = descText.match(regex);
          if (match) {
            companion.abilities[ability.toLowerCase()] = {
              score: parseInt(match[1]),
              modifier: parseInt(match[2])
            };
            debug.log(`\u2705 Parsed ${ability}: ${match[1]} (${match[2]})`);
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
          debug.log(`\u2705 Parsed Senses: ${companion.senses}`);
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
          debug.log(`\u2705 Parsed Languages: ${companion.languages}`);
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
          debug.log(`\u2705 Parsed Proficiency Bonus: ${companion.proficiencyBonus}`);
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
        debug.log(`\u2705 Parsed Feature: ${featureMatch[1].trim()}`);
      }
      const actionsMatch = descText.match(/###?\s*Actions\s+([\s\S]+)/i);
      if (actionsMatch) {
        const actionsText = actionsMatch[1];
        debug.log(`\u{1F50D} DEBUG: Found actions section:`, actionsText);
        const attackLines = actionsText.split("\n").filter((line) => line.includes("***") && line.includes("Melee Weapon Attack"));
        attackLines.forEach((attackLine) => {
          debug.log(`\u{1F50D} DEBUG: Processing attack line:`, attackLine);
          const nameMatch = attackLine.match(/\*\*\*(\w+)\.\*\*\*/);
          const bonusMatch = attackLine.match(/\*\*(\+\d+)\*\*/);
          const reachMatch = attackLine.match(/reach\s*([\d\s]+ft\.)/);
          let damageMatch = attackLine.match(/\*?Hit:\*?\s*\*\*([^*]+?)\*\*/);
          debug.log(`\u{1F50D} DEBUG: Damage pattern 1 result:`, damageMatch);
          if (!damageMatch) {
            damageMatch = attackLine.match(/\*?Hit:\*?\s*\*\*([^*]+?)(?:\s+[a-z]+|$)/i);
            debug.log(`\u{1F50D} DEBUG: Damage pattern 2 result:`, damageMatch);
          }
          if (!damageMatch) {
            damageMatch = attackLine.match(/\*?Hit:\*?\s*\*\*([^*]+)/);
            debug.log(`\u{1F50D} DEBUG: Damage pattern 3 result:`, damageMatch);
          }
          debug.log(`\u{1F50D} DEBUG: Final damage match:`, damageMatch);
          if (nameMatch && bonusMatch && reachMatch && damageMatch) {
            companion.actions.push({
              name: nameMatch[1].trim(),
              type: "attack",
              attackBonus: parseInt(bonusMatch[1]),
              reach: reachMatch[1].trim(),
              damage: damageMatch[1].trim()
            });
            debug.log(`\u2705 Parsed Action: ${nameMatch[1].trim()}`);
            debug.log(`\u{1F50D} DEBUG: Parsed damage: "${damageMatch[1].trim()}"`);
          } else {
            debug.log(`\u274C Failed to parse attack. Matches:`, { nameMatch, bonusMatch, reachMatch, damageMatch });
          }
        });
      } else {
        debug.log(`\u{1F50D} DEBUG: No actions section found`);
      }
      if (companion.ac > 0 || companion.hp || Object.keys(companion.abilities).length > 0) {
        debug.log(`\u2705 Successfully parsed companion "${name}"`);
        debug.log(`\u{1F50D} DEBUG: Final companion object:`, companion);
        return companion;
      }
      debug.log(`\u274C Failed to parse any stats for companion "${name}"`);
      return null;
    }
    async function extractCharacterData() {
      try {
        debug.log("\u{1F680} Starting character extraction...");
        const characterData = await fetchCharacterDataFromAPI();
        if (characterData) {
          debug.log("\u2705 Character data extracted via API:", characterData.name);
          return characterData;
        }
        debug.log("\u{1F504} API failed, trying DOM extraction...");
        const domData = extractCharacterDataFromDOM();
        if (domData) {
          debug.log("\u2705 Character data extracted via DOM:", domData.name);
          return domData;
        }
        debug.error("\u274C Both API and DOM extraction failed");
        return null;
      } catch (error) {
        debug.error("\u274C Error extracting character data:", error);
        throw error;
      }
    }
    function handleRollRequest(name, formula) {
      return new Promise((resolve, reject) => {
        debug.log(`\u{1F3B2} Handling roll request: ${name} with formula ${formula}`);
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
        debug.log("\u{1F3B2} Simulated roll:", rollData);
        sendRollToRoll20(rollData);
        showNotification(`Rolled ${name}: ${formula} = ${totalResult} \u{1F3B2}`, "success");
        resolve();
      });
    }
    function extractSpellsFromDOM(characterData) {
      try {
        debug.log("\u{1F50D} Extracting spells from DOM...");
        debug.log("\u{1F50D} Current hostname:", window.location.hostname);
        debug.log("\u{1F50D} Current URL:", window.location.href);
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
        debug.log(`\u{1F50D} Found ${spellElements.length} potential spell elements`);
        if (window.location.hostname !== "dicecloud.com" && !window.location.hostname.includes("dicecloud")) {
          debug.log("\u{1F50D} Not in Dice Cloud, trying broader search...");
          const allElements = document.querySelectorAll("*");
          let spellTextElements = [];
          allElements.forEach((element) => {
            const text = element.textContent || element.innerText || "";
            if (text.toLowerCase().includes("spell") || text.toLowerCase().includes("level") && text.toLowerCase().includes("cantrip") || text.toLowerCase().includes("casting") || text.toLowerCase().includes("range") || text.toLowerCase().includes("duration")) {
              spellTextElements.push(element);
            }
          });
          debug.log(`\u{1F50D} Found ${spellTextElements.length} elements with spell-related text`);
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
              debug.log(`\u{1F50D} Skipping spell slot element: ${text.substring(0, 50)}`);
              return;
            }
            if (lowerText.includes("stats") || lowerText.includes("actions") || lowerText.includes("inventory") || lowerText.includes("features") || lowerText.includes("journal") || lowerText.includes("build") || lowerText.includes("hit points") || lowerText.includes("armor class") || lowerText.includes("speed")) {
              debug.log(`\u{1F50D} Skipping navigation element: ${text.substring(0, 50)}`);
              return;
            }
            if (text.length < 20) {
              return;
            }
            if (text.includes(characterData.name) || lowerText.includes("grey")) {
              debug.log(`\u{1F50D} Skipping character name element: ${text.substring(0, 50)}`);
              return;
            }
            debug.log(`\u{1F50D} Processing element ${index}:`, text.substring(0, 100));
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
              debug.log(`\u{1F50D} Skipping incomplete spell entry for "${spellName}"`);
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
            if (description && description.length > 10) {
              const existingSpell = characterData.spells.find(
                (s) => s.name.toLowerCase() === spellName.toLowerCase()
              );
              if (existingSpell) {
                existingSpell.description = description;
                debug.log(`\u2705 Updated description for "${spellName}": "${description.substring(0, 50)}..."`);
              } else {
                characterData.spells.push({
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
                debug.log(`\u2705 Added new spell "${spellName}" (Level ${spellLevel}): "${description.substring(0, 50)}..."`);
              }
            } else {
              debug.log(`\u{1F50D} No meaningful description found for "${spellName}"`);
            }
          } catch (error) {
            debug.error(`\u274C Error processing spell element ${index}:`, error);
          }
        });
        debug.log(`\u2705 Spell extraction complete. Found ${characterData.spells.length} spells with descriptions.`);
      } catch (error) {
        debug.error("\u274C Error extracting spells from DOM:", error);
      }
    }
    function extractCharacterDataFromDOM() {
      try {
        debug.log("\u{1F50D} Extracting character data from DOM...");
        const characterData = {
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
          characterData.name = nameElement.textContent.trim() || "Unknown Character";
        }
        const statElements = document.querySelectorAll('[class*="stat"], [class*="attribute"], [class*="ability"]');
        statElements.forEach((element) => {
          const text = element.textContent.trim();
          if (text.includes("STR") || text.includes("Strength")) {
            const match = text.match(/(\d+)/);
            if (match)
              characterData.attributes.strength = parseInt(match[1]);
          }
          if (text.includes("DEX") || text.includes("Dexterity")) {
            const match = text.match(/(\d+)/);
            if (match)
              characterData.attributes.dexterity = parseInt(match[1]);
          }
          if (text.includes("CON") || text.includes("Constitution")) {
            const match = text.match(/(\d+)/);
            if (match)
              characterData.attributes.constitution = parseInt(match[1]);
          }
          if (text.includes("INT") || text.includes("Intelligence")) {
            const match = text.match(/(\d+)/);
            if (match)
              characterData.attributes.intelligence = parseInt(match[1]);
          }
          if (text.includes("WIS") || text.includes("Wisdom")) {
            const match = text.match(/(\d+)/);
            if (match)
              characterData.attributes.wisdom = parseInt(match[1]);
          }
          if (text.includes("CHA") || text.includes("Charisma")) {
            const match = text.match(/(\d+)/);
            if (match)
              characterData.attributes.charisma = parseInt(match[1]);
          }
        });
        Object.keys(characterData.attributes).forEach((attr) => {
          const score = characterData.attributes[attr] || 10;
          characterData.attributeMods[attr] = Math.floor((score - 10) / 2);
        });
        extractSpellsFromDOM(characterData);
        debug.log("\u2705 DOM extraction completed:", characterData);
        return characterData;
      } catch (error) {
        debug.error("\u274C Error extracting from DOM:", error);
        return null;
      }
    }
    async function extractAndStoreCharacterData() {
      try {
        debug.log("\u{1F680} Starting character extraction...");
        showNotification("Extracting character data...", "info");
        const characterData = await fetchCharacterDataFromAPI();
        if (characterData && characterData.name) {
          try {
            browserAPI.runtime.sendMessage({
              action: "storeCharacterData",
              data: characterData
            }, (response) => {
              if (browserAPI.runtime.lastError) {
                debug.error("\u274C Extension context error:", browserAPI.runtime.lastError);
                showNotification("Extension reloaded. Please refresh the page.", "error");
                return;
              }
              if (response && response.success) {
                debug.log("\u2705 Character data stored successfully");
                showNotification(`${characterData.name} extracted! Navigate to Roll20 to import.`, "success");
              } else {
                debug.error("\u274C Failed to store character data:", response && response.error);
                showNotification("Failed to store character data", "error");
              }
            });
          } catch (error) {
            debug.error("\u274C Extension context invalidated:", error);
            showNotification("Extension reloaded. Please refresh the page.", "error");
          }
        } else {
          debug.error("\u274C No character name found");
          showNotification("Failed to extract character data", "error");
        }
      } catch (error) {
        debug.error("\u274C Error extracting character:", error);
        debug.error("Stack trace:", error.stack);
        showNotification(error.message, "error");
      }
    }
    function showNotification(message, type = "info", duration = 5e3) {
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
        debug.log("\u{1F50D} Check Structure button added");
      }
    }
    browserAPI.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
      debug.log("DiceCloud received message:", request);
      switch (request.action) {
        case "syncCharacter":
          syncCharacterData(request.slotId).then(() => {
            sendResponse({ success: true });
          }).catch((error) => {
            debug.error("Error syncing character:", error);
            sendResponse({ success: false, error: error.message });
          });
          return true;
        case "rollInDiceCloud":
          handleRollRequest(request.roll.name, request.roll.formula).then(() => {
            debug.log("\u2705 Roll handled in Dice Cloud");
            sendResponse({ success: true });
          }).catch((error) => {
            debug.error("\u274C Failed to handle roll in Dice Cloud:", error);
            sendResponse({ success: false, error: error.message });
          });
          return true;
        case "extractCharacter":
          extractCharacterData().then((data) => {
            sendResponse({ success: true, data });
          }).catch((error) => {
            debug.error("Error extracting character:", error);
            sendResponse({ success: false, error: error.message });
          });
          return true;
        case "discordLink":
          handleDiscordLink(request.dicecloudUserId, request.discordInfo).then(() => {
            sendResponse({ success: true });
          }).catch((error) => {
            debug.error("Error handling Discord link:", error);
            sendResponse({ success: false, error: error.message });
          });
          return true;
        case "showSyncButton":
          const syncButton = document.getElementById("dc-sync-btn");
          if (syncButton) {
            syncButton.style.display = "";
            sessionStorage.removeItem("dc-sync-btn_hidden");
            localStorage.removeItem("dc-sync-btn_hidden");
            showNotification("Sync button shown", "success");
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: "Sync button not found" });
          }
          return true;
        case "showLoginHint":
          try {
            const hintOverlay = document.createElement("div");
            hintOverlay.id = "rollcloud-login-hint";
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
              <strong>FoundCloud Extension</strong>
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
            const existingHint = document.getElementById("rollcloud-login-hint");
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
            debug.error("Error showing login hint:", error);
            sendResponse({ success: false, error: error.message });
          }
          return true;
        case "extractAuthToken":
          try {
            const loginToken = localStorage.getItem("Meteor.loginToken");
            const loginTokenExpires = localStorage.getItem("Meteor.loginTokenExpires");
            const userId = localStorage.getItem("Meteor.userId");
            if (loginToken && userId) {
              debug.log("\u2705 Found auth token in localStorage");
              const authId = userId;
              let displayUsername = "DiceCloud User";
              try {
                debug.log("\u{1F50D} Checking for Meteor.user()...");
                if (typeof window.Meteor !== "undefined" && window.Meteor.user) {
                  debug.log("\u2705 Meteor object available:", typeof window.Meteor);
                  const meteorUser = window.Meteor.user();
                  debug.log("\u{1F4E6} Meteor.user() result:", meteorUser);
                  if (meteorUser) {
                    displayUsername = meteorUser.username || meteorUser.emails?.[0]?.address || meteorUser.profile?.username || meteorUser.profile?.name || meteorUser.services?.google?.email || meteorUser.services?.facebook?.email || "DiceCloud User";
                    debug.log("\u2705 Found display username via Meteor.user():", displayUsername);
                  } else {
                    debug.log("\u274C Meteor.user() returned null/undefined");
                  }
                } else {
                  debug.log("\u274C Meteor.user() not available. window.Meteor:", typeof window.Meteor);
                  debug.log("\u{1F50D} Available window properties:", Object.keys(window).filter((k) => k.toLowerCase().includes("meteor")).slice(0, 10));
                }
              } catch (e) {
                debug.log("\u26A0\uFE0F Meteor.user() error:", e.message);
              }
              if (displayUsername === "DiceCloud User") {
                try {
                  debug.log("\u{1F50D} Checking localStorage for user data...");
                  const allKeys = Object.keys(localStorage);
                  debug.log("\u{1F4CB} All localStorage keys:", allKeys);
                  const meteorUserKeys = allKeys.filter(
                    (key) => (key.includes("Meteor.user") || key.includes("user") || key.includes("User")) && !key.includes("Meteor.userId") && !key.includes("Meteor.loginToken")
                  );
                  debug.log("\u{1F50D} Found user-related localStorage keys:", meteorUserKeys);
                  for (const meteorUserKey of meteorUserKeys) {
                    try {
                      const userData = localStorage.getItem(meteorUserKey);
                      debug.log(`\u{1F4E6} Raw data from key "${meteorUserKey}":`, userData?.substring(0, 200));
                      if (userData) {
                        let parsed;
                        try {
                          parsed = JSON.parse(userData);
                          debug.log(`\u{1F4E6} Parsed data from key "${meteorUserKey}":`, parsed);
                        } catch (parseError) {
                          debug.log(`\u26A0\uFE0F Key "${meteorUserKey}" is not JSON, trying raw value`);
                          if (userData.length > 2 && userData !== "Chepi" && !userData.match(/^[a-zA-Z0-9]{10,}$/)) {
                            displayUsername = userData.trim();
                            debug.log(`\u2705 Found display username from localStorage key "${meteorUserKey}":`, displayUsername);
                            break;
                          }
                          continue;
                        }
                        displayUsername = parsed.username || parsed.emails?.[0]?.address || parsed.profile?.username || parsed.profile?.name || parsed.name || parsed.email || "DiceCloud User";
                        if (displayUsername !== "DiceCloud User") {
                          debug.log("\u2705 Found display username in localStorage:", displayUsername);
                          break;
                        }
                      }
                    } catch (keyError) {
                      debug.log(`\u26A0\uFE0F Error processing key "${meteorUserKey}":`, keyError.message);
                    }
                  }
                  if (meteorUserKeys.length === 0) {
                    debug.log("\u2139\uFE0F No additional user data keys found in localStorage (only Meteor.userId and tokens)");
                  }
                } catch (e) {
                  debug.log("\u26A0\uFE0F Failed to check localStorage user data:", e.message);
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
                        debug.log("\u2705 Found display username in window object:", displayUsername);
                        break;
                      }
                    }
                  }
                } catch (e) {
                  debug.log("\u26A0\uFE0F Failed to check window objects:", e.message);
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
                      debug.log(`\u2705 Found display username with selector "${selector}":`, displayUsername);
                      break;
                    }
                  }
                }
              }
              debug.log("\u2705 Auth ID for database:", authId);
              debug.log("\u2705 Display username for UI:", displayUsername);
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
              debug.log("\u{1F4E4} About to send response:", responseData);
              return responseData;
            } else {
              debug.warn("\u26A0\uFE0F No auth token found - user may not be logged in");
              return {
                success: false,
                error: "Not logged in to DiceCloud. Please log in first."
              };
            }
          } catch (error) {
            debug.error("\u274C Error extracting auth token:", error);
            return {
              success: false,
              error: "Failed to extract token: " + error.message
            };
          }
        default:
          debug.warn("Unknown action:", request.action);
          sendResponse({ success: false, error: "Unknown action" });
      }
    });
    function debugPageStructure() {
      debug.log("=== DICECLOUD ROLL LOG DEBUG ===");
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
      debug.log("Searching for roll log container...");
      potentialSelectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          debug.log(`Found ${elements.length} element(s) matching "${selector}":`);
          elements.forEach((el, i) => {
            debug.log(`  [${i}] Classes:`, el.className);
            debug.log(`  [${i}] ID:`, el.id);
            debug.log(`  [${i}] Tag:`, el.tagName);
            debug.log(`  [${i}] Text preview:`, el.textContent && el.textContent.substring(0, 100));
          });
        }
      });
      debug.log('\nSearching for elements with dice notation (e.g., "1d20 [ 6 ]", "2d6+3")...');
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
        debug.log(`Found ${elementsWithDice.length} elements with dice notation:`);
        debug.table(elementsWithDice.slice(0, 20));
        debug.log("\n\u{1F4CB} Full element details (expand to inspect):");
        elementsWithDice.slice(0, 5).forEach((item, i) => {
          debug.log(`
[${i}] Element:`, item.element);
          debug.log(`[${i}] Full text (first 200 chars):
`, item.element.textContent.substring(0, 200));
          debug.log(`[${i}] Parent chain:`, getParentChain(item.element));
        });
      } else {
        debug.log("\u274C No elements with dice notation found!");
        debug.log("This might mean:");
        debug.log("1. No rolls have been made yet - try making a roll");
        debug.log("2. Rolls appear in a different format");
        debug.log("3. Rolls are in a shadow DOM or iframe");
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
      debug.log("\n=== END DEBUG ===");
      debug.log("Instructions:");
      debug.log("1. Make a test roll in DiceCloud");
      debug.log("2. Run debugPageStructure() again to see the new elements");
      debug.log('3. Right-click on the roll in the page and select "Inspect" to see its HTML structure');
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
            debug.log("\u2713 Roll log detection: Found roll log using selector:", selector);
            debug.log("Roll log element:", element);
            return element;
          }
        }
        return null;
      };
      const rollLog = findRollLog();
      if (!rollLog) {
        debug.log("\u23F3 Roll log not found, will retry in 2 seconds...");
        debug.log("\u{1F4A1} Run window.debugDiceCloudRolls() in console for detailed debug info");
        setTimeout(observeRollLog, 2e3);
        return;
      }
      debug.log("\u2705 Observing DiceCloud roll log for new rolls");
      debug.log("\u{1F4CB} Roll log classes:", rollLog.className);
      debug.log("\u{1F3B2} Ready to detect rolls!");
      const observerStartTime = Date.now();
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.className && node.className.includes("log-entry")) {
                const nodeTimestamp = node.getAttribute("data-timestamp") || node.querySelector("[data-timestamp]")?.getAttribute("data-timestamp");
                if (nodeTimestamp && parseInt(nodeTimestamp) > observerStartTime) {
                  debug.log("\u{1F3B2} New roll detected:", node);
                  const rollData = parseRollFromElement(node);
                  if (rollData) {
                    debug.log("\u2705 Successfully parsed roll:", rollData);
                    sendRollToRoll20(rollData);
                  } else {
                    debug.log("\u26A0\uFE0F  Could not parse roll data from element");
                  }
                } else if (!nodeTimestamp) {
                  debug.log("\u{1F504} Ignoring node without timestamp (likely existing content)");
                } else {
                  debug.log("\u{1F504} Ignoring existing roll entry (added before observer started)");
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
      debug.log("\u{1F4A1} TIP: Make a test roll to see if it gets detected");
    }
    window.debugDiceCloudRolls = debugPageStructure;
    function parseRollFromElement(element) {
      try {
        const fullText = element.textContent || element.innerText || "";
        debug.log("\u{1F50D} Full roll text:", fullText);
        const lines = fullText.split("\n").filter((line) => line.trim());
        const name = lines[0]?.trim() || "Unknown Roll";
        const formulaLine = lines.find((line) => line.includes("d20") || line.includes("d6") || line.includes("d8") || line.includes("d10") || line.includes("d12") || line.includes("d4"));
        if (!formulaLine) {
          debug.log("\u26A0\uFE0F  No dice formula found in roll text");
          return null;
        }
        debug.log("\u{1F4CA} Formula line:", formulaLine);
        const formulaMatch = formulaLine.match(/^(.+?)\s*=\s*(.+)$/);
        if (!formulaMatch) {
          debug.log("\u26A0\uFE0F  Could not parse formula from:", formulaLine);
          return null;
        }
        const baseRollMatch = formulaMatch[1].match(/\[\s*(\d+)\s*\]/);
        const baseRoll = baseRollMatch ? baseRollMatch[1] : null;
        let formula = formulaMatch[1].replace(/\s*\[\s*\d+\s*\]\s*/g, "").trim();
        formula = formula.replace(/\s+/g, "");
        const result = formulaMatch[2].trim();
        debug.log(`\u{1F4CA} Parsed: name="${name}", formula="${formula}", result="${result}", baseRoll="${baseRoll}"`);
        return {
          name,
          formula,
          result,
          baseRoll,
          // The actual die roll (e.g., "17" from "1d20 [ 17 ]")
          timestamp: Date.now()
        };
      } catch (error) {
        debug.error("\u274C Error parsing roll element:", error);
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
      debug.error("Failed to load panel positions:", error);
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
      debug.error("Failed to load roll settings:", error);
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
      let bgGradient = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
      let icon = "\u{1F3B2}";
      if (critical === "critical-success") {
        bgGradient = "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)";
        icon = "\u2B50";
      } else if (critical === "critical-failure") {
        bgGradient = "linear-gradient(135deg, #4e54c8 0%, #8f94fb 100%)";
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
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
        border-left: 4px solid #667eea;
        transition: all 0.2s;
      }

      #dc-roll-history .history-item:hover {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
        transform: translateX(-4px);
      }

      #dc-roll-history .history-item.critical-success {
        border-left-color: #f5576c;
        background: linear-gradient(135deg, rgba(245, 87, 108, 0.2) 0%, rgba(240, 147, 251, 0.1) 100%);
      }

      #dc-roll-history .history-item.critical-failure {
        border-left-color: #4e54c8;
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
      list.innerHTML = rollStats.history.map((roll, index) => {
        const timeAgo = getTimeAgo(roll.timestamp);
        const criticalClass = roll.criticalType ? roll.criticalType : "";
        let badges = "";
        if (roll.criticalType) {
          badges += `<span class="history-badge">${roll.criticalType.replace("-", " ")}</span>`;
        }
        if (roll.advantageType && roll.advantageType !== "normal") {
          badges += `<span class="history-badge">${roll.advantageType}</span>`;
        }
        return `
        <div class="history-item ${criticalClass}" style="animation-delay: ${index * 0.03}s">
          <div class="history-item-header">
            <span class="history-name">${roll.name}</span>
            <span class="history-time">${timeAgo}</span>
          </div>
          <div class="history-formula">${roll.formula} = <strong>${roll.result}</strong></div>
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
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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
        color: #667eea;
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
          debug.log("Roll mode changed to:", mode);
          showNotification(`Roll mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`, "info");
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
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-color: #667eea;
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
      debug.log("\u{1F680} sendRollToRoll20 called with:", rollData);
      if (!rollStats.settings.enabled) {
        debug.log("\u26A0\uFE0F Roll forwarding disabled in settings");
        return;
      }
      const modifiedRoll = {
        ...rollData,
        formula: applyAdvantageMode(rollData.formula, rollStats.settings.advantageMode)
      };
      if (modifiedRoll.formula !== rollData.formula) {
        debug.log(`Formula modified: ${rollData.formula} -> ${modifiedRoll.formula} (${rollStats.settings.advantageMode})`);
      }
      showRollNotification(modifiedRoll);
      addToRollHistory(modifiedRoll);
      debug.log("\u{1F4E1} Sending roll to Roll20...");
      try {
        browserAPI.runtime.sendMessage({
          action: "sendRollToRoll20",
          roll: modifiedRoll
        }, (response) => {
          if (browserAPI.runtime.lastError) {
            debug.error("\u274C Chrome runtime error:", browserAPI.runtime.lastError);
            showNotification("Roll20 not available. Is Roll20 open?", "warning");
            return;
          }
          if (response && response.success) {
            debug.log("\u2705 Roll sent to Roll20:", response);
            showNotification(`${modifiedRoll.name} roll sent to Roll20! \u{1F3B2}`, "success");
          } else {
            debug.error("\u274C Failed to send roll to Roll20:", response?.error);
            showNotification("Roll20 not available. Is Roll20 open?", "warning");
          }
        });
      } catch (error) {
        debug.error("Extension context invalidated:", error);
        showNotification("Extension reloaded. Please refresh the page.", "error");
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
            debug.log("\u{1F504} Clearing invalid button position");
            localStorage.removeItem(`${storageKey}_position`);
          }
        } catch (e) {
          debug.error("Error parsing saved position:", e);
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
        const existingMenu = document.getElementById("rollcloud-sync-context-menu");
        if (existingMenu)
          existingMenu.remove();
        const menu = document.createElement("div");
        menu.id = "rollcloud-sync-context-menu";
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
          showNotification("Button hidden. Reload page to show it again.", "info");
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
          showNotification("Button position reset", "success");
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
        color: #4ECDC4;
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
            border: 2px solid ${existingChar ? "#4ECDC4" : "#404040"};
            border-radius: 8px;
            padding: 16px;
            cursor: pointer;
            transition: all 0.2s;
          `;
            slotCard.addEventListener("mouseenter", () => {
              slotCard.style.borderColor = "#4ECDC4";
              slotCard.style.transform = "translateY(-2px)";
              slotCard.style.boxShadow = "0 4px 12px rgba(78, 205, 196, 0.3)";
            });
            slotCard.addEventListener("mouseleave", () => {
              slotCard.style.borderColor = existingChar ? "#4ECDC4" : "#404040";
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
            color: ${existingChar ? "#4ECDC4" : "#999"};
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
      button.innerHTML = "\u{1F504} Sync to FoundCloud";
      button.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%);
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
            debug.error("\u274C Error during sync:", error);
          }
        }
      });
      document.body.appendChild(button);
      makeSyncButtonDraggable(button, "dc-sync-btn");
      debug.log("\u2705 Sync button added to Dice Cloud");
    }
    function syncCharacterData(slotId) {
      debug.log("\u{1F504} Starting character data sync...", slotId ? `to ${slotId}` : "");
      const button = document.getElementById("dc-sync-btn");
      if (button) {
        button.innerHTML = "\u23F3 Syncing...";
        button.disabled = true;
      }
      return extractCharacterData().then((characterData) => {
        if (!characterData) {
          debug.error("\u274C No character data found to sync");
          showNotification("No character data found. Make sure you have a character open.", "error");
          if (button) {
            button.innerHTML = "\u{1F504} Sync to FoundCloud";
            button.disabled = false;
          }
          throw new Error("No character data found");
        }
        return new Promise((resolve, reject) => {
          const storeData = () => {
            browserAPI.runtime.sendMessage({
              action: "storeCharacterData",
              data: characterData,
              slotId
            }, (response) => {
              if (browserAPI.runtime.lastError) {
                debug.error("\u274C Extension context error:", browserAPI.runtime.lastError);
                debug.log("\u{1F504} Background script not responding, trying direct storage...");
                browserAPI.storage.local.get(["characterProfiles"], (result) => {
                  if (browserAPI.runtime.lastError) {
                    debug.error("\u274C Storage also failed:", browserAPI.runtime.lastError);
                    showNotification("Extension context error. Please refresh the page.", "error");
                    if (button) {
                      button.innerHTML = "\u{1F504} Sync to FoundCloud";
                      button.disabled = false;
                    }
                    reject(new Error("Extension context error"));
                    return;
                  }
                  const profiles = result.characterProfiles || {};
                  profiles[slotId] = characterData;
                  browserAPI.storage.local.set({ characterProfiles: profiles }, () => {
                    if (browserAPI.runtime.lastError) {
                      debug.error("\u274C Direct storage failed:", browserAPI.runtime.lastError);
                      showNotification("Storage error. Please refresh the page.", "error");
                      if (button) {
                        button.innerHTML = "\u{1F504} Sync to FoundCloud";
                        button.disabled = false;
                      }
                      reject(new Error("Storage error"));
                    } else {
                      debug.log("\u2705 Character data synced via direct storage:", characterData.name);
                      showNotification(`\u2705 ${characterData.name} synced to FoundCloud! \u{1F3B2}`, "success");
                      if (button) {
                        button.innerHTML = "\u2705 Synced!";
                        button.disabled = false;
                        setTimeout(() => {
                          button.innerHTML = "\u{1F504} Sync to FoundCloud";
                        }, 2e3);
                      }
                      try {
                        browserAPI.runtime.sendMessage({
                          action: "dataSynced",
                          slotId,
                          characterName: characterData.name
                        }, (response2) => {
                          if (browserAPI.runtime.lastError) {
                            debug.log("Popup notification failed (non-critical):", browserAPI.runtime.lastError);
                          } else {
                            debug.log("\u2705 Popup notified successfully");
                          }
                        });
                      } catch (notifyError) {
                        debug.log("Could not notify popup (non-critical):", notifyError);
                      }
                      resolve();
                    }
                  });
                });
              } else {
                debug.log("\u2705 Character data synced to extension:", characterData.name);
                showNotification(`\u2705 ${characterData.name} synced to FoundCloud! \u{1F3B2}`, "success");
                if (button) {
                  button.innerHTML = "\u2705 Synced!";
                  button.disabled = false;
                  setTimeout(() => {
                    button.innerHTML = "\u{1F504} Sync to FoundCloud";
                  }, 2e3);
                }
                resolve();
              }
            });
          };
          storeData();
        });
      }).catch((error) => {
        debug.error("\u274C Error during character extraction:", error);
        if (error.message && error.message.includes("Not logged in")) {
          showNotification("\u26A0\uFE0F Please login to DiceCloud first! Click the FoundCloud extension icon to login.", "error", 5e3);
        } else if (error.message && error.message.includes("Extension reloaded")) {
          showNotification("Extension context error. Please refresh the page.", "error");
        } else {
          showNotification("Failed to extract character data. Please try again.", "error");
        }
        if (button) {
          button.innerHTML = "\u{1F504} Sync to FoundCloud";
          button.disabled = false;
        }
        throw error;
      });
    }
    async function handleDiscordLink(dicecloudUserId, discordInfo) {
      debug.log(`\u{1F517} Handling Discord link for user: ${dicecloudUserId}`);
      debug.log(`\u{1F464} Discord info:`, discordInfo);
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
        debug.log(`\u2705 Successfully updated Discord link for user: ${dicecloudUserId}`);
        showNotification("\u{1F517} Discord account linked successfully!", "success");
      } catch (error) {
        debug.error("\u274C Error handling Discord link:", error);
        showNotification("Failed to link Discord account", "error");
        throw error;
      }
    }
    async function autoRefreshToken() {
      try {
        const { explicitlyLoggedOut } = await browserAPI.storage.local.get("explicitlyLoggedOut");
        if (explicitlyLoggedOut) {
          debug.log("\u23ED\uFE0F Skipping auto-refresh: user explicitly logged out");
          return;
        }
        const existingToken = await browserAPI.storage.local.get(["diceCloudToken", "diceCloudUserId"]);
        if (existingToken.diceCloudToken && existingToken.diceCloudUserId) {
          debug.log("\u{1F4CB} Token already exists, skipping auto-refresh to preserve manual login");
          return;
        }
        const loginToken = localStorage.getItem("Meteor.loginToken");
        const userId = localStorage.getItem("Meteor.userId");
        if (loginToken && userId) {
          debug.log("\u{1F504} Auto-refreshing DiceCloud auth token...");
          await browserAPI.storage.local.set({
            diceCloudToken: loginToken,
            diceCloudUserId: userId,
            tokenExpires: localStorage.getItem("Meteor.loginTokenExpires")
          });
          debug.log("\u2705 Auth token auto-refreshed");
        } else {
          debug.log("\u26A0\uFE0F No auth token found in localStorage (user may not be logged in)");
        }
      } catch (error) {
        debug.error("Failed to auto-refresh token:", error);
      }
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        debug.log("\u{1F4C4} DOM loaded, adding buttons...");
        addSyncButton();
        observeRollLog();
        autoRefreshToken();
      });
    } else {
      debug.log("\u{1F4C4} DOM already loaded, adding buttons...");
      addSyncButton();
      observeRollLog();
      autoRefreshToken();
    }
  })();
})();
//# sourceMappingURL=dicecloud.js.map
