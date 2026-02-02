(() => {
  // src/content/dicecloud-extraction.js
  var STANDARD_VARS = {
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
    let characterName2 = creature.name || "";
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
        const commonRaces = ["human", "elf", "dwarf", "halfling", "gnome", "half-elf", "half-orc", "dragonborn", "tiefling", "orc", "goblin", "kobold", "warforged", "tabaxi", "kenku", "aarakocra", "genasi", "aasimar", "firbolg", "goliath", "triton", "yuan-ti", "tortle", "lizardfolk", "bugbear", "hobgoblin", "changeling", "shifter", "kalashtar"];
        const nameMatchesRace = commonRaces.some((race) => prop.name.toLowerCase().includes(race));
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
    console.log("CarmaClouds: Character preview:", characterName2, characterLevel, characterRace, characterClass);
    const characterData = {
      // Metadata
      id: creature._id || characterId,
      name: characterName2,
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
})();
//# sourceMappingURL=dicecloud-extraction.js.map
