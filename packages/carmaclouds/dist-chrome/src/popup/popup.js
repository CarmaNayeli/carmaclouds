(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __glob = (map) => (path) => {
    var fn = map[path];
    if (fn)
      return fn();
    throw new Error("Module not found in bundle: " + path);
  };
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/content/dicecloud-extraction.js
  function parseForRollCloud(rawData) {
    if (!rawData || !rawData.creature || !rawData.variables || !rawData.properties) {
      throw new Error("Invalid raw data format");
    }
    const { creature, variables, properties } = rawData;
    let race = "Unknown";
    let characterClass = "";
    let level = 0;
    const uniqueClasses = /* @__PURE__ */ new Set();
    let raceFound = false;
    for (const prop of properties) {
      if (!prop)
        continue;
      if (!raceFound && prop.type === "folder" && prop.name) {
        const commonRaces = ["human", "elf", "dwarf", "halfling", "gnome", "half-elf", "half-orc", "dragonborn", "tiefling", "orc", "goblin", "kobold", "warforged", "tabaxi", "kenku", "aarakocra", "genasi", "aasimar", "firbolg", "goliath", "triton", "yuan-ti", "tortle", "lizardfolk", "bugbear", "hobgoblin", "changeling", "shifter", "kalashtar"];
        const nameMatchesRace = commonRaces.some((r) => prop.name.toLowerCase().includes(r));
        if (nameMatchesRace) {
          const parentDepth = prop.ancestors ? prop.ancestors.length : 0;
          if (parentDepth <= 2) {
            race = prop.name;
            raceFound = true;
          }
        }
      }
      if (!raceFound && (prop.type === "race" || prop.type === "species" || prop.type === "characterRace")) {
        if (prop.name) {
          race = prop.name;
          raceFound = true;
        }
      }
      if (!raceFound && prop.type === "constant" && prop.name && prop.name.toLowerCase() === "race") {
        if (prop.value) {
          race = prop.value;
          raceFound = true;
        }
      }
      if (prop.type === "class" && prop.name && !prop.inactive && !prop.disabled) {
        const cleanName = prop.name.replace(/\s*\[Multiclass\]/i, "").trim();
        const normalizedClassName = cleanName.toLowerCase().trim();
        if (!uniqueClasses.has(normalizedClassName)) {
          uniqueClasses.add(normalizedClassName);
          characterClass = characterClass ? `${characterClass} / ${cleanName}` : cleanName;
        }
      }
      if (prop.type === "classLevel" && !prop.inactive && !prop.disabled) {
        level += 1;
      }
    }
    if (!raceFound && (!race || race === "Unknown")) {
      const raceVars = Object.keys(variables).filter(
        (key) => key.toLowerCase().includes("race") || key.toLowerCase().includes("species")
      );
      if (raceVars.length > 0) {
        raceVars.forEach((varName) => {
          console.log(`parseForRollCloud: Raw data for "${varName}":`, variables[varName]);
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
        }
        const raceVar = raceVars.find((key) => key.toLowerCase() === "race");
        if (raceVar) {
          const raceValue = variables[raceVar];
          if (typeof raceValue === "object" && raceValue !== null) {
            if (raceValue.value && typeof raceValue.value === "object" && raceValue.value.value) {
              raceName = formatRaceName(raceValue.value.value);
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
                break;
              }
            }
          }
        }
        if (raceName && subraceName) {
          race = `${raceName} - ${subraceName}`;
        } else if (subraceName) {
          race = subraceName;
        } else if (raceName) {
          race = raceName;
        }
      }
    }
    const attributes = {};
    STANDARD_VARS.abilities.forEach((ability) => {
      attributes[ability] = variables[ability]?.total || variables[ability]?.value || 10;
    });
    const attributeMods = {};
    Object.keys(attributes).forEach((attr) => {
      attributeMods[attr] = Math.floor((attributes[attr] - 10) / 2);
    });
    const saves = {};
    STANDARD_VARS.saves.forEach((save) => {
      if (variables[save]) {
        const abilityName = save.replace("Save", "");
        saves[abilityName] = variables[save].total || variables[save].value || 0;
      }
    });
    const skills = {};
    STANDARD_VARS.skills.forEach((skill) => {
      if (variables[skill]) {
        skills[skill] = variables[skill].total || variables[skill].value || 0;
      }
    });
    const calculateAC = () => {
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
        }
        return null;
      };
      if (variables.armorClass?.total || variables.armorClass?.value) {
        return variables.armorClass.total || variables.armorClass.value;
      }
      if (creature.denormalizedStats) {
        const tryKeys = ["armorClass", "ac", "armor"];
        for (const k of tryKeys) {
          if (creature.denormalizedStats.hasOwnProperty(k)) {
            const num = extractNumeric(creature.denormalizedStats[k]);
            if (num !== null)
              return num;
          }
        }
      }
      const varNamesToCheck = ["armor", "armorClass", "armor_class", "ac", "acTotal"];
      for (const vn of varNamesToCheck) {
        if (variables.hasOwnProperty(vn)) {
          const candidate = extractNumeric(variables[vn]?.total ?? variables[vn]?.value ?? variables[vn]);
          if (candidate !== null)
            return candidate;
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
          let amount = typeof prop.amount === "number" ? prop.amount : parseFloat(prop.amount);
          if (!isNaN(amount)) {
            const operation = prop.operation || "";
            if (operation === "base" || operation === "Base value") {
              if (armorAC === null || amount > armorAC)
                armorAC = amount;
            } else if (operation === "add" || operation === "Add") {
              acBonuses.push({ name: prop.name, amount });
            }
          }
        }
      });
      let finalAC = armorAC !== null ? armorAC : baseAC;
      acBonuses.forEach((bonus) => finalAC += bonus.amount);
      return finalAC;
    };
    return {
      name: characterName,
      race,
      class: characterClass || "Unknown",
      level,
      background: "",
      alignment: creature.alignment || "",
      attributes,
      attributeMods,
      saves,
      skills,
      hitPoints: {
        current: variables.hitPoints?.currentValue ?? variables.hitPoints?.value ?? 0,
        max: variables.hitPoints?.total ?? variables.hitPoints?.max ?? 0
      },
      temporaryHP: variables.temporaryHitPoints?.value ?? variables.temporaryHitPoints?.currentValue ?? 0,
      armorClass: calculateAC(),
      speed: variables.speed?.total || variables.speed?.value || 30,
      initiative: variables.initiative?.total || variables.initiative?.value || 0,
      proficiencyBonus: variables.proficiencyBonus?.total || variables.proficiencyBonus?.value || 0
    };
  }
  function parseForOwlCloud(rawData) {
    return parseForRollCloud(rawData);
  }
  function parseForFoundCloud(rawData) {
    return parseForRollCloud(rawData);
  }
  var STANDARD_VARS;
  var init_dicecloud_extraction = __esm({
    "src/content/dicecloud-extraction.js"() {
      STANDARD_VARS = {
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
        combat: ["armorClass", "hitPoints", "speed", "initiative", "proficiencyBonus"]
      };
    }
  });

  // src/popup/adapters/foundcloud/adapter.js
  var adapter_exports = {};
  __export(adapter_exports, {
    init: () => init
  });
  async function init(containerEl) {
    console.log("Initializing FoundCloud adapter...");
    try {
      containerEl.innerHTML = '<div class="loading">Loading FoundCloud...</div>';
      const result = await chrome.storage.local.get("carmaclouds_characters");
      const characters = result.carmaclouds_characters || [];
      console.log("Found", characters.length, "synced characters");
      const character = characters.length > 0 ? characters[0] : null;
      let parsedData = null;
      if (character && character.raw) {
        containerEl.innerHTML = '<div class="loading">Parsing character data...</div>';
        console.log("Parsing character for Foundry VTT:", character.name);
        parsedData = parseForFoundCloud(character.raw);
        console.log("Parsed data:", parsedData);
      }
      const htmlPath = chrome.runtime.getURL("src/popup/adapters/foundcloud/popup.html");
      const response = await fetch(htmlPath);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const container = doc.querySelector(".foundcloud-container");
      const sections = container ? Array.from(container.children).filter((el) => !el.matches("header, .header, footer")).map((el) => el.outerHTML).join("") : doc.body.innerHTML;
      const wrapper = document.createElement("div");
      wrapper.className = "foundcloud-adapter-scope";
      wrapper.innerHTML = sections;
      containerEl.innerHTML = "";
      containerEl.appendChild(wrapper);
      const cssPath = chrome.runtime.getURL("src/popup/adapters/foundcloud/popup.css");
      const cssResponse = await fetch(cssPath);
      let css = await cssResponse.text();
      css = css.replace(/(^|\})\s*([^{}@]+)\s*\{/gm, (match, closer, selector) => {
        if (selector.trim().startsWith("@"))
          return match;
        const scopedSelector = selector.split(",").map((s) => `.foundcloud-adapter-scope ${s.trim()}`).join(", ");
        return `${closer} ${scopedSelector} {`;
      });
      const style = document.createElement("style");
      style.textContent = css;
      containerEl.appendChild(style);
      if (parsedData && character) {
        const characterInfo = wrapper.querySelector("#characterInfo");
        const statusSection = wrapper.querySelector("#status");
        if (characterInfo) {
          characterInfo.classList.remove("hidden");
          const nameEl = characterInfo.querySelector("#charName");
          const levelEl = characterInfo.querySelector("#charLevel");
          const classEl = characterInfo.querySelector("#charClass");
          const raceEl = characterInfo.querySelector("#charRace");
          if (nameEl)
            nameEl.textContent = character.name || "-";
          if (levelEl)
            levelEl.textContent = character.preview?.level || "-";
          if (classEl)
            classEl.textContent = character.preview?.class || "-";
          if (raceEl)
            raceEl.textContent = character.preview?.race || "Unknown";
          const pushBtn = characterInfo.querySelector("#pushToVttBtn");
          if (pushBtn) {
            pushBtn.addEventListener("click", async () => {
              const originalText = pushBtn.innerHTML;
              try {
                pushBtn.disabled = true;
                pushBtn.innerHTML = "\u23F3 Pushing...";
                alert("Foundry VTT cloud sync not yet implemented. Coming soon!");
                pushBtn.innerHTML = originalText;
                pushBtn.disabled = false;
              } catch (error) {
                console.error("Error pushing to Foundry VTT:", error);
                pushBtn.innerHTML = "\u274C Failed";
                alert(`Failed to push to Foundry VTT: ${error.message}`);
                setTimeout(() => {
                  pushBtn.innerHTML = originalText;
                  pushBtn.disabled = false;
                }, 2e3);
              }
            });
          }
        }
        if (statusSection) {
          const statusIcon = statusSection.querySelector("#statusIcon");
          const statusText = statusSection.querySelector("#statusText");
          if (statusIcon)
            statusIcon.textContent = "\u2705";
          if (statusText)
            statusText.textContent = `Character synced: ${character.name}`;
        }
      }
      const copyBtn = wrapper.querySelector("#copyUrlBtn");
      if (copyBtn) {
        copyBtn.addEventListener("click", async () => {
          const urlInput = wrapper.querySelector("#moduleUrl");
          if (urlInput) {
            try {
              await navigator.clipboard.writeText(urlInput.value);
              const originalText = copyBtn.textContent;
              copyBtn.textContent = "\u2713 Copied!";
              setTimeout(() => {
                copyBtn.textContent = originalText;
              }, 2e3);
            } catch (err) {
              console.error("Failed to copy:", err);
              copyBtn.textContent = "\u2717 Failed";
              setTimeout(() => {
                copyBtn.textContent = "Copy";
              }, 2e3);
            }
          }
        });
      }
    } catch (error) {
      console.error("Failed to load FoundCloud UI:", error);
      containerEl.innerHTML = `
      <div class="error">
        <strong>Failed to load FoundCloud</strong>
        <p>${error.message}</p>
      </div>
    `;
    }
  }
  var init_adapter = __esm({
    "src/popup/adapters/foundcloud/adapter.js"() {
      init_dicecloud_extraction();
    }
  });

  // src/popup/adapters/owlcloud/adapter.js
  var adapter_exports2 = {};
  __export(adapter_exports2, {
    init: () => init2
  });
  async function init2(containerEl) {
    console.log("Initializing OwlCloud adapter...");
    try {
      containerEl.innerHTML = '<div class="loading">Loading OwlCloud...</div>';
      const result = await chrome.storage.local.get("carmaclouds_characters");
      const characters = result.carmaclouds_characters || [];
      console.log("Found", characters.length, "synced characters");
      const character = characters.length > 0 ? characters[0] : null;
      let parsedData = null;
      if (character && character.raw) {
        containerEl.innerHTML = '<div class="loading">Parsing character data...</div>';
        console.log("Parsing character for Owlbear Rodeo:", character.name);
        parsedData = parseForOwlCloud(character.raw);
        console.log("Parsed data:", parsedData);
      }
      const htmlPath = chrome.runtime.getURL("src/popup/adapters/owlcloud/popup.html");
      const response = await fetch(htmlPath);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const mainContent = doc.querySelector("main");
      const wrapper = document.createElement("div");
      wrapper.className = "owlcloud-adapter-scope";
      wrapper.innerHTML = mainContent ? mainContent.innerHTML : doc.body.innerHTML;
      containerEl.innerHTML = "";
      containerEl.appendChild(wrapper);
      const cssPath = chrome.runtime.getURL("src/popup/adapters/owlcloud/popup.css");
      const cssResponse = await fetch(cssPath);
      let css = await cssResponse.text();
      css = css.replace(/(^|\})\s*([^{}@]+)\s*\{/gm, (match, closer, selector) => {
        if (selector.trim().startsWith("@"))
          return match;
        const scopedSelector = selector.split(",").map((s) => `.owlcloud-adapter-scope ${s.trim()}`).join(", ");
        return `${closer} ${scopedSelector} {`;
      });
      const style = document.createElement("style");
      style.textContent = css;
      containerEl.appendChild(style);
      if (parsedData && character) {
        const characterInfo = wrapper.querySelector("#characterInfo");
        const statusSection = wrapper.querySelector("#status");
        if (characterInfo) {
          characterInfo.classList.remove("hidden");
          const nameEl = characterInfo.querySelector("#charName");
          const levelEl = characterInfo.querySelector("#charLevel");
          const classEl = characterInfo.querySelector("#charClass");
          const raceEl = characterInfo.querySelector("#charRace");
          if (nameEl)
            nameEl.textContent = character.name || "-";
          if (levelEl)
            levelEl.textContent = character.preview?.level || "-";
          if (classEl)
            classEl.textContent = character.preview?.class || "-";
          if (raceEl)
            raceEl.textContent = character.preview?.race || "Unknown";
          const pushBtn = characterInfo.querySelector("#pushToVttBtn");
          if (pushBtn) {
            pushBtn.addEventListener("click", async () => {
              const originalText = pushBtn.innerHTML;
              try {
                pushBtn.disabled = true;
                pushBtn.innerHTML = "\u23F3 Pushing...";
                const tabs = await chrome.tabs.query({ url: "*://*.owlbear.rodeo/*" });
                if (tabs.length === 0) {
                  throw new Error("No Owlbear Rodeo tab found. Please open Owlbear Rodeo first.");
                }
                await chrome.tabs.sendMessage(tabs[0].id, {
                  type: "PUSH_CHARACTER",
                  data: parsedData
                });
                pushBtn.innerHTML = "\u2705 Pushed!";
                setTimeout(() => {
                  pushBtn.innerHTML = originalText;
                  pushBtn.disabled = false;
                }, 2e3);
              } catch (error) {
                console.error("Error pushing to Owlbear Rodeo:", error);
                pushBtn.innerHTML = "\u274C Failed";
                alert(`Failed to push to Owlbear Rodeo: ${error.message}`);
                setTimeout(() => {
                  pushBtn.innerHTML = originalText;
                  pushBtn.disabled = false;
                }, 2e3);
              }
            });
          }
        }
        if (statusSection) {
          const statusIcon = statusSection.querySelector("#statusIcon");
          const statusText = statusSection.querySelector("#statusText");
          if (statusIcon)
            statusIcon.textContent = "\u2705";
          if (statusText)
            statusText.textContent = `Character synced: ${character.name}`;
        }
      }
      const copyBtn = wrapper.querySelector("#copyOwlbearUrlBtn");
      if (copyBtn) {
        copyBtn.addEventListener("click", async () => {
          const urlInput = wrapper.querySelector("#owlbearExtensionUrl");
          if (urlInput) {
            try {
              await navigator.clipboard.writeText(urlInput.value);
              const originalText = copyBtn.textContent;
              copyBtn.textContent = "\u2713 Copied!";
              setTimeout(() => {
                copyBtn.textContent = originalText;
              }, 2e3);
            } catch (err) {
              console.error("Failed to copy:", err);
              copyBtn.textContent = "\u2717 Failed";
              setTimeout(() => {
                copyBtn.textContent = "Copy";
              }, 2e3);
            }
          }
        });
      }
    } catch (error) {
      console.error("Failed to load OwlCloud UI:", error);
      containerEl.innerHTML = `
      <div class="error">
        <strong>Failed to load OwlCloud</strong>
        <p>${error.message}</p>
      </div>
    `;
    }
  }
  var init_adapter2 = __esm({
    "src/popup/adapters/owlcloud/adapter.js"() {
      init_dicecloud_extraction();
    }
  });

  // src/popup/adapters/rollcloud/adapter.js
  var adapter_exports3 = {};
  __export(adapter_exports3, {
    init: () => init3
  });
  async function init3(containerEl) {
    console.log("Initializing RollCloud adapter...");
    try {
      containerEl.innerHTML = '<div class="loading">Loading RollCloud...</div>';
      const result = await chrome.storage.local.get("carmaclouds_characters");
      const characters = result.carmaclouds_characters || [];
      console.log("Found", characters.length, "synced characters");
      const character = characters.length > 0 ? characters[0] : null;
      let parsedData = null;
      if (character && character.raw) {
        containerEl.innerHTML = '<div class="loading">Parsing character data...</div>';
        console.log("Parsing character for Roll20:", character.name);
        parsedData = parseForRollCloud(character.raw);
        console.log("Parsed data:", parsedData);
      }
      const htmlPath = chrome.runtime.getURL("src/popup/adapters/rollcloud/popup.html");
      const response = await fetch(htmlPath);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const mainContent = doc.querySelector("main");
      const wrapper = document.createElement("div");
      wrapper.className = "rollcloud-adapter-scope";
      wrapper.innerHTML = mainContent ? mainContent.innerHTML : doc.body.innerHTML;
      containerEl.innerHTML = "";
      containerEl.appendChild(wrapper);
      const cssPath = chrome.runtime.getURL("src/popup/adapters/rollcloud/popup.css");
      const cssResponse = await fetch(cssPath);
      let css = await cssResponse.text();
      css = css.replace(/(^|\})\s*([^{}@]+)\s*\{/gm, (match, closer, selector) => {
        if (selector.trim().startsWith("@"))
          return match;
        const scopedSelector = selector.split(",").map((s) => `.rollcloud-adapter-scope ${s.trim()}`).join(", ");
        return `${closer} ${scopedSelector} {`;
      });
      const style = document.createElement("style");
      style.textContent = css;
      containerEl.appendChild(style);
      if (parsedData && character) {
        const characterInfo = wrapper.querySelector("#characterInfo");
        const statusSection = wrapper.querySelector("#status");
        if (characterInfo) {
          characterInfo.classList.remove("hidden");
          const nameEl = characterInfo.querySelector("#charName");
          const levelEl = characterInfo.querySelector("#charLevel");
          const classEl = characterInfo.querySelector("#charClass");
          const raceEl = characterInfo.querySelector("#charRace");
          if (nameEl)
            nameEl.textContent = character.name || "-";
          if (levelEl)
            levelEl.textContent = character.preview?.level || "-";
          if (classEl)
            classEl.textContent = character.preview?.class || "-";
          if (raceEl)
            raceEl.textContent = character.preview?.race || "Unknown";
          const pushBtn = characterInfo.querySelector("#pushToVttBtn");
          if (pushBtn) {
            pushBtn.addEventListener("click", async () => {
              const originalText = pushBtn.innerHTML;
              try {
                pushBtn.disabled = true;
                pushBtn.innerHTML = "\u23F3 Pushing...";
                const tabs = await chrome.tabs.query({ url: "*://app.roll20.net/*" });
                if (tabs.length === 0) {
                  throw new Error("No Roll20 tab found. Please open Roll20 first.");
                }
                await chrome.tabs.sendMessage(tabs[0].id, {
                  type: "PUSH_CHARACTER",
                  data: parsedData
                });
                pushBtn.innerHTML = "\u2705 Pushed!";
                setTimeout(() => {
                  pushBtn.innerHTML = originalText;
                  pushBtn.disabled = false;
                }, 2e3);
              } catch (error) {
                console.error("Error pushing to Roll20:", error);
                pushBtn.innerHTML = "\u274C Failed";
                alert(`Failed to push to Roll20: ${error.message}`);
                setTimeout(() => {
                  pushBtn.innerHTML = originalText;
                  pushBtn.disabled = false;
                }, 2e3);
              }
            });
          }
        }
        if (statusSection) {
          const statusIcon = statusSection.querySelector("#statusIcon");
          const statusText = statusSection.querySelector("#statusText");
          if (statusIcon)
            statusIcon.textContent = "\u2705";
          if (statusText)
            statusText.textContent = `Character synced: ${character.name}`;
        }
      }
    } catch (error) {
      console.error("Failed to load RollCloud UI:", error);
      containerEl.innerHTML = `
      <div class="error">
        <strong>Failed to load RollCloud</strong>
        <p>${error.message}</p>
      </div>
    `;
    }
  }
  var init_adapter3 = __esm({
    "src/popup/adapters/rollcloud/adapter.js"() {
      init_dicecloud_extraction();
    }
  });

  // import("./adapters/**/*/adapter.js") in src/popup/popup.js
  var globImport_adapters_adapter_js = __glob({
    "./adapters/foundcloud/adapter.js": () => Promise.resolve().then(() => (init_adapter(), adapter_exports)),
    "./adapters/owlcloud/adapter.js": () => Promise.resolve().then(() => (init_adapter2(), adapter_exports2)),
    "./adapters/rollcloud/adapter.js": () => Promise.resolve().then(() => (init_adapter3(), adapter_exports3))
  });

  // src/popup/popup.js
  var loadedAdapters = {
    rollcloud: null,
    owlcloud: null,
    foundcloud: null
  };
  async function getSettings() {
    const result = await chrome.storage.local.get("carmaclouds_settings") || {};
    return result.carmaclouds_settings || {
      lastActiveTab: "rollcloud",
      enabledVTTs: ["rollcloud", "owlcloud", "foundcloud"]
    };
  }
  async function saveSettings(settings) {
    await chrome.storage.local.set({ carmaclouds_settings: settings });
  }
  function showLoginRequired(contentEl, tabName) {
    const tabNames = {
      rollcloud: "RollCloud",
      owlcloud: "OwlCloud",
      foundcloud: "FoundCloud"
    };
    contentEl.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; text-align: center;">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#16a75a" stroke-width="2" style="margin-bottom: 20px;">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
      <h2 style="color: #e0e0e0; margin: 0 0 10px 0; font-size: 20px;">DiceCloud Login Required</h2>
      <p style="color: #b0b0b0; margin: 0 0 20px 0; font-size: 14px; line-height: 1.5;">
        ${tabNames[tabName]} needs access to your DiceCloud account to sync characters.<br>
        Click the <strong style="color: #16a75a;">Login</strong> button in the header to get started.
      </p>
      <button
        id="open-auth-from-tab"
        style="background: #16a75a; color: #000; font-weight: 700; border: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; cursor: pointer; transition: background 0.2s ease;"
      >
        \u{1F510} Open Login Modal
      </button>
    </div>
  `;
    const btn = contentEl.querySelector("#open-auth-from-tab");
    if (btn) {
      btn.addEventListener("click", openAuthModal);
      btn.addEventListener("mouseover", () => {
        btn.style.background = "#1bc76b";
      });
      btn.addEventListener("mouseout", () => {
        btn.style.background = "#16a75a";
      });
    }
  }
  async function switchTab(tabName) {
    console.log(`Switching to ${tabName} tab`);
    document.querySelectorAll(".tab-button").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });
    document.querySelectorAll(".tab-pane").forEach((pane) => {
      pane.classList.toggle("active", pane.id === `${tabName}-content`);
    });
    const contentEl = document.getElementById(`${tabName}-content`);
    const token = await getAuthToken();
    if (!token) {
      showLoginRequired(contentEl, tabName);
      loadedAdapters[tabName] = null;
    } else {
      if (!loadedAdapters[tabName]) {
        console.log(`Loading ${tabName} adapter for the first time...`);
        try {
          const module = await globImport_adapters_adapter_js(`./adapters/${tabName}/adapter.js`);
          loadedAdapters[tabName] = module;
          if (module.init && typeof module.init === "function") {
            await module.init(contentEl);
          }
        } catch (error) {
          console.error(`Failed to load ${tabName} adapter:`, error);
          contentEl.innerHTML = `
          <div class="error">
            <strong>Failed to load ${tabName}</strong>
            <p>${error.message}</p>
          </div>
        `;
        }
      }
    }
    const settings = await getSettings();
    settings.lastActiveTab = tabName;
    await saveSettings(settings);
  }
  function openSettingsModal() {
    const modal = document.getElementById("settings-modal");
    modal.classList.add("active");
  }
  function closeSettingsModal() {
    const modal = document.getElementById("settings-modal");
    modal.classList.remove("active");
  }
  function openAuthModal() {
    const modal = document.getElementById("dicecloud-auth-modal");
    modal.classList.add("active");
    updateAuthView();
  }
  function closeAuthModal() {
    const modal = document.getElementById("dicecloud-auth-modal");
    modal.classList.remove("active");
  }
  async function getAuthToken() {
    const result = await chrome.storage.local.get("dicecloud_auth_token");
    return result?.dicecloud_auth_token || null;
  }
  async function saveAuthToken(token) {
    await chrome.storage.local.set({ dicecloud_auth_token: token });
    await updateAuthStatus();
    await updateAuthView();
    try {
      if (typeof SupabaseTokenManager !== "undefined") {
        const supabaseManager = new SupabaseTokenManager();
        const result = await chrome.storage.local.get(["username", "diceCloudUserId"]);
        const dbResult = await supabaseManager.storeToken({
          token,
          userId: result.diceCloudUserId || result.username,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString(),
          // 24 hours from now
          lastChecked: (/* @__PURE__ */ new Date()).toISOString()
        });
        if (dbResult.success) {
          console.log("\u2705 Auth token synced to database");
        } else {
          console.log("\u26A0\uFE0F Failed to sync auth token to database:", dbResult.error);
        }
      }
    } catch (dbError) {
      console.log("\u26A0\uFE0F Database sync not available:", dbError);
    }
    await reloadCurrentTab();
  }
  async function clearAuthToken() {
    await chrome.storage.local.remove("dicecloud_auth_token");
    updateAuthStatus();
    updateAuthView();
    await reloadCurrentTab();
  }
  async function reloadCurrentTab() {
    const activeTab = document.querySelector(".tab-button.active");
    if (activeTab) {
      const tabName = activeTab.dataset.tab;
      loadedAdapters[tabName] = null;
      await switchTab(tabName);
    }
  }
  async function updateAuthStatus() {
    const token = await getAuthToken();
    const statusText = document.getElementById("auth-status-text");
    if (token) {
      statusText.textContent = "Logged In";
      statusText.style.color = "#000000";
    } else {
      statusText.textContent = "Login";
      statusText.style.color = "white";
    }
  }
  async function updateAuthView() {
    const token = await getAuthToken();
    const loginView = document.getElementById("auth-login-view");
    const loggedInView = document.getElementById("auth-logged-in-view");
    if (token) {
      loginView.classList.add("hidden");
      loggedInView.classList.remove("hidden");
    } else {
      loginView.classList.remove("hidden");
      loggedInView.classList.add("hidden");
    }
  }
  async function autoConnect() {
    const btn = document.getElementById("autoConnectBtn");
    const errorDiv = document.getElementById("loginError");
    try {
      btn.disabled = true;
      btn.textContent = "\u23F3 Checking...";
      errorDiv.classList.add("hidden");
      const tabs = await chrome.tabs.query({ url: "*://*.dicecloud.com/*" });
      if (!tabs || tabs.length === 0) {
        errorDiv.innerHTML = '<div style="background: #0d4a30; color: #16a75a; padding: 12px; border-radius: 6px; border: 1px solid #16a75a;"><strong>Navigate to DiceCloud First</strong><br>Open <a href="https://dicecloud.com" target="_blank" style="color: #1bc76b; text-decoration: underline;">dicecloud.com</a> in a tab, log in, then click this button to connect.</div>';
        errorDiv.classList.remove("hidden");
        btn.disabled = false;
        btn.textContent = "\u{1F510} Connect with DiceCloud";
        return;
      }
      try {
        let results;
        if (typeof chrome !== "undefined" && chrome.scripting) {
          results = await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
              const authData2 = {
                localStorage: {},
                sessionStorage: {},
                meteor: null,
                authToken: null
              };
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes("auth") || key.includes("token") || key.includes("meteor") || key.includes("login"))) {
                  authData2.localStorage[key] = localStorage.getItem(key);
                }
              }
              for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && (key.includes("auth") || key.includes("token") || key.includes("meteor") || key.includes("login"))) {
                  authData2.sessionStorage[key] = sessionStorage.getItem(key);
                }
              }
              if (window.Meteor && window.Meteor.userId) {
                authData2.meteor = {
                  userId: window.Meteor.userId(),
                  loginToken: window.Meteor._localStorage && window.Meteor._localStorage.getItem("Meteor.loginToken")
                };
              }
              if (window.authToken)
                authData2.authToken = window.authToken;
              if (window.token)
                authData2.authToken = window.token;
              return authData2;
            }
          });
        } else if (typeof browser !== "undefined" && browser.tabs) {
          results = await browser.tabs.executeScript(tabs[0].id, {
            code: `
            // Try to get auth data from localStorage, sessionStorage, or window object
            const authData = {
              localStorage: {},
              sessionStorage: {},
              meteor: null,
              authToken: null
            };
            
            // Check localStorage
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.includes('auth') || key.includes('token') || key.includes('meteor') || key.includes('login'))) {
                authData.localStorage[key] = localStorage.getItem(key);
              }
            }
            
            // Check sessionStorage
            for (let i = 0; i < sessionStorage.length; i++) {
              const key = sessionStorage.key(i);
              if (key && (key.includes('auth') || key.includes('token') || key.includes('meteor') || key.includes('login'))) {
                authData.sessionStorage[key] = sessionStorage.getItem(key);
              }
            }
            
            // Check for Meteor/MongoDB auth (common in DiceCloud)
            if (window.Meteor && window.Meteor.userId) {
              authData.meteor = {
                userId: window.Meteor.userId(),
                loginToken: window.Meteor._localStorage && window.Meteor._localStorage.getItem('Meteor.loginToken')
              };
            }
            
            // Check for any global auth variables
            if (window.authToken) authData.authToken = window.authToken;
            if (window.token) authData.authToken = window.token;
            
            authData;
          `
          });
        } else {
          throw new Error("No scripting API available");
        }
        const authData = results[0]?.result;
        console.log("Auth data from DiceCloud page:", authData);
        let token = null;
        if (authData?.meteor?.loginToken) {
          token = authData.meteor.loginToken;
        } else if (authData?.authToken) {
          token = authData.authToken;
        } else {
          for (const [key, value] of Object.entries(authData?.localStorage || {})) {
            if (value && value.length > 10) {
              token = value;
              break;
            }
          }
        }
        if (token) {
          await saveAuthToken(token);
          errorDiv.classList.add("hidden");
          closeAuthModal();
          return;
        }
      } catch (scriptError) {
        console.warn("Could not inject script:", scriptError);
      }
      const cookies = await chrome.cookies.getAll({ domain: ".dicecloud.com" });
      console.log("Available DiceCloud cookies:", cookies.map((c) => ({ name: c.name, domain: c.domain, value: c.value ? "***" : "empty" })));
      const authCookie = cookies.find(
        (c) => c.name === "dicecloud_auth" || c.name === "meteor_login_token" || c.name === "authToken" || c.name === "loginToken" || c.name === "userId" || c.name === "token" || c.name.includes("auth") || c.name.includes("token")
      );
      if (authCookie && authCookie.value) {
        await saveAuthToken(authCookie.value);
        errorDiv.classList.add("hidden");
        closeAuthModal();
      } else {
        const cookieNames = cookies.map((c) => c.name).join(", ");
        const cookieCount = cookies.length;
        errorDiv.innerHTML = `<div style="color: #ff6b6b;">No login detected. Found ${cookieCount} cookies: ${cookieNames || "none"}. Make sure you're logged in to DiceCloud in your open tab, then click the button again.</div>`;
        errorDiv.classList.remove("hidden");
        btn.disabled = false;
        btn.textContent = "\u{1F510} Connect with DiceCloud";
      }
    } catch (error) {
      console.error("Auto-connect error:", error);
      errorDiv.innerHTML = `<div style="color: #ff6b6b;">Error: ${error.message}</div>`;
      errorDiv.classList.remove("hidden");
      btn.disabled = false;
      btn.textContent = "\u{1F510} Connect with DiceCloud";
    }
  }
  async function manualLogin(username, password) {
    const btn = document.getElementById("usernameLoginBtn");
    const errorDiv = document.getElementById("loginError");
    try {
      btn.disabled = true;
      btn.textContent = "\u23F3 Logging in...";
      errorDiv.classList.add("hidden");
      const endpoints = [
        "https://dicecloud.com/api/login",
        "https://v2.dicecloud.com/api/login",
        "https://app.dicecloud.com/api/login",
        "https://dicecloud.com/login",
        "https://v2.dicecloud.com/login"
      ];
      let lastError = null;
      let success = false;
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying login endpoint: ${endpoint}`);
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
            mode: "cors",
            credentials: "omit"
          });
          console.log(`Response status: ${response.status}`);
          if (response.ok) {
            const data = await response.json();
            console.log(`Success with ${endpoint}:`, data);
            if (data.token || data.authToken || data.loginToken) {
              const token = data.token || data.authToken || data.loginToken;
              await saveAuthToken(token);
              errorDiv.classList.add("hidden");
              closeAuthModal();
              success = true;
              break;
            }
          } else {
            console.warn(`Failed with ${endpoint}: ${response.status} ${response.statusText}`);
          }
        } catch (endpointError) {
          console.warn(`Failed with ${endpoint}:`, endpointError.message);
          lastError = endpointError;
        }
      }
      if (!success) {
        throw new Error(`Login failed. Tried ${endpoints.length} endpoints. Last error: ${lastError?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Manual login error:", error);
      errorDiv.innerHTML = `<div style="color: #ff6b6b;">${error.message}</div>`;
      errorDiv.classList.remove("hidden");
    } finally {
      btn.disabled = false;
      btn.textContent = "\u{1F510} Login to DiceCloud";
    }
  }
  async function logout() {
    await clearAuthToken();
    closeAuthModal();
  }
  async function checkAndUpdateAuthToken() {
    try {
      if (typeof SupabaseTokenManager === "undefined") {
        console.log("\u26A0\uFE0F SupabaseTokenManager not available, skipping auth token check");
        return;
      }
      const supabaseManager = new SupabaseTokenManager();
      const result = await chrome.storage.local.get(["diceCloudToken", "username", "tokenExpires", "diceCloudUserId", "authId"]);
      if (!result.diceCloudToken) {
        console.log("\u26A0\uFE0F No auth token found, skipping auth token check");
        return;
      }
      console.log("\u{1F50D} Checking auth token validity...");
      try {
        const syncResult = await supabaseManager.storeToken({
          token: result.diceCloudToken,
          userId: result.diceCloudUserId || result.username,
          expires: result.tokenExpires || new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString(),
          lastChecked: (/* @__PURE__ */ new Date()).toISOString()
        });
        if (syncResult.success) {
          console.log("\u2705 Auth token synced to database");
        } else {
          console.log("\u26A0\uFE0F Failed to sync auth token to database:", syncResult.error);
        }
      } catch (syncError) {
        console.log("\u26A0\uFE0F Database sync failed:", syncError);
      }
      const sessionCheck = await supabaseManager.checkSessionValidity();
      if (!sessionCheck.valid) {
        console.log("\u26A0\uFE0F Auth token session is invalid, attempting to refresh...");
        const refreshResult = await supabaseManager.refreshToken();
        if (refreshResult.success) {
          console.log("\u2705 Auth token refreshed successfully");
          await chrome.storage.local.set({
            diceCloudToken: refreshResult.token,
            tokenExpires: refreshResult.expires,
            diceCloudUserId: refreshResult.userId
          });
          try {
            await supabaseManager.storeToken({
              token: refreshResult.token,
              userId: refreshResult.userId,
              expires: refreshResult.expires,
              lastChecked: (/* @__PURE__ */ new Date()).toISOString()
            });
            console.log("\u2705 Refreshed token synced to database");
          } catch (refreshSyncError) {
            console.log("\u26A0\uFE0F Failed to sync refreshed token:", refreshSyncError);
          }
          await updateAuthStatus();
          showNotification("\u2705 Authentication refreshed", "success");
        } else {
          console.log("\u274C Failed to refresh auth token");
          showNotification("\u274C Authentication expired. Please log in again.", "error");
        }
      } else {
        console.log("\u2705 Auth token is valid and synced");
      }
    } catch (error) {
      console.error("\u274C Error checking auth token:", error);
    }
  }
  async function init4() {
    console.log("Initializing CarmaClouds popup...");
    const settings = await getSettings();
    const lastTab = settings.lastActiveTab || "rollcloud";
    document.querySelectorAll(".tab-button").forEach((btn) => {
      btn.addEventListener("click", () => {
        switchTab(btn.dataset.tab);
      });
    });
    document.getElementById("settings-button").addEventListener("click", openSettingsModal);
    document.getElementById("close-settings").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeSettingsModal();
    });
    document.getElementById("refresh-button").addEventListener("click", async () => {
      const activeTab = document.querySelector(".tab-button.active")?.dataset.tab;
      if (activeTab) {
        await checkAndUpdateAuthToken();
        loadedAdapters[activeTab] = null;
        await switchTab(activeTab);
      }
    });
    document.getElementById("settings-modal").addEventListener("click", (e) => {
      if (e.target.id === "settings-modal") {
        closeSettingsModal();
      }
    });
    document.getElementById("dicecloud-auth-button").addEventListener("click", openAuthModal);
    document.getElementById("close-dicecloud-auth").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeAuthModal();
    });
    document.getElementById("dicecloud-auth-modal").addEventListener("click", (e) => {
      if (e.target.id === "dicecloud-auth-modal") {
        closeAuthModal();
      }
    });
    document.getElementById("autoConnectBtn").addEventListener("click", autoConnect);
    document.getElementById("usernameLoginForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      manualLogin(username, password);
    });
    document.getElementById("logoutBtn").addEventListener("click", logout);
    await updateAuthStatus();
    document.getElementById("open-website").addEventListener("click", (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: "https://carmaclouds.vercel.app" });
    });
    document.getElementById("open-github").addEventListener("click", (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: "https://github.com/CarmaNayeli/carmaclouds" });
    });
    document.getElementById("open-issues").addEventListener("click", (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: "https://github.com/CarmaNayeli/carmaclouds/issues" });
    });
    document.getElementById("open-sponsor").addEventListener("click", (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: "https://github.com/sponsors/CarmaNayeli/" });
    });
    await switchTab(lastTab);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init4);
  } else {
    init4();
  }
})();
//# sourceMappingURL=popup.js.map
