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
  function isValidProperty(property) {
    if (!property)
      return false;
    if (property.inactive === true || property.disabled === true)
      return false;
    if (property.removed === true || property.soft_removed === true)
      return false;
    if (!property._id && !property.id)
      return false;
    return true;
  }
  function normalizeNameForDedupe(name) {
    if (!name)
      return "";
    return name.toLowerCase().trim().replace(/\b(a|an|the)\b/g, "").replace(/ing\b/g, "").replace(/dice/g, "die").replace(/ies\b/g, "y").replace(/s\b/g, "").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
  }
  function deduplicateByName(items) {
    const seen = /* @__PURE__ */ new Set();
    return items.filter((item) => {
      const normalized = normalizeNameForDedupe(item.name);
      if (seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
  }
  function evaluateConditionals(text, variables2 = {}) {
    if (!text || typeof text !== "string")
      return text;
    const conditionalPattern = /\[([^\[\]]+)\s*\?\s*"([^"]*)"\s*:\s*"([^"]*)"\]/g;
    let result2 = text;
    let match;
    while ((match = conditionalPattern.exec(text)) !== null) {
      const fullMatch = match[0];
      const condition = match[1].trim();
      const trueText = match[2];
      const falseText = match[3];
      let shouldShow = false;
      const comparisonMatch = condition.match(/^(\w+)\s*(>|<|>=|<=|==|!=)\s*(.+)$/);
      if (comparisonMatch) {
        const varName = comparisonMatch[1];
        const operator = comparisonMatch[2];
        const compareValue = comparisonMatch[3].trim();
        let varValue = variables2[varName];
        if (varValue === void 0) {
          varValue = variables2[varName.toLowerCase()];
        }
        const numVarValue = parseFloat(varValue);
        const numCompareValue = parseFloat(compareValue);
        if (!isNaN(numVarValue) && !isNaN(numCompareValue)) {
          switch (operator) {
            case ">":
              shouldShow = numVarValue > numCompareValue;
              break;
            case "<":
              shouldShow = numVarValue < numCompareValue;
              break;
            case ">=":
              shouldShow = numVarValue >= numCompareValue;
              break;
            case "<=":
              shouldShow = numVarValue <= numCompareValue;
              break;
            case "==":
              shouldShow = numVarValue === numCompareValue;
              break;
            case "!=":
              shouldShow = numVarValue !== numCompareValue;
              break;
          }
        } else {
          switch (operator) {
            case "==":
              shouldShow = varValue == compareValue;
              break;
            case "!=":
              shouldShow = varValue != compareValue;
              break;
          }
        }
      } else {
        const varName = condition;
        let varValue = variables2[varName];
        if (varValue === void 0) {
          varValue = variables2[varName.toLowerCase()];
        }
        shouldShow = !!(varValue && varValue !== 0 && varValue !== "0" && varValue !== false);
      }
      result2 = result2.replace(fullMatch, shouldShow ? trueText : falseText);
    }
    return result2;
  }
  function evaluateDamageFormula(formula, variables = {}) {
    if (!formula || typeof formula !== "string")
      return formula;
    let result = formula;
    const getVar = (name) => {
      if (!name)
        return void 0;
      if (variables[name] !== void 0) {
        return variables[name];
      }
      const lower = name.toLowerCase();
      if (variables[lower] !== void 0) {
        return variables[lower];
      }
      return void 0;
    };
    const variablePattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
    result = result.replace(variablePattern, (match, varName) => {
      if (varName === "d" || varName === "D")
        return match;
      if (["floor", "ceil", "round", "abs", "min", "max"].includes(varName.toLowerCase())) {
        return match;
      }
      const value = getVar(varName);
      if (value !== void 0) {
        const numValue = parseFloat(value);
        return isNaN(numValue) ? match : String(numValue);
      }
      return match;
    });
    try {
      if (/[\(\)\+\-\*\/]/.test(result)) {
        let evalFormula = result.replace(/\bfloor\s*\(/gi, "Math.floor(").replace(/\bceil\s*\(/gi, "Math.ceil(").replace(/\bround\s*\(/gi, "Math.round(").replace(/\babs\s*\(/gi, "Math.abs(").replace(/\bmin\s*\(/gi, "Math.min(").replace(/\bmax\s*\(/gi, "Math.max(");
        const diceParts = [];
        evalFormula = evalFormula.replace(/(\d+)d(\d+)/gi, (match) => {
          diceParts.push(match);
          return `__DICE${diceParts.length - 1}__`;
        });
        const parts = evalFormula.split(/(__DICE\d+__)/);
        const evaluatedParts = parts.map((part) => {
          if (part.startsWith("__DICE")) {
            const index = parseInt(part.match(/\d+/)[0]);
            return diceParts[index];
          }
          try {
            if (!/[a-zA-Z]/.test(part.replace(/Math\.(floor|ceil|round|abs|min|max)/g, ""))) {
              const evaluated = eval(part);
              if (!isNaN(evaluated) && isFinite(evaluated)) {
                return String(evaluated);
              }
            }
          } catch (e) {
          }
          return part;
        });
        result = evaluatedParts.join("");
      }
    } catch (e) {
      console.warn("Failed to evaluate damage formula:", formula, e);
    }
    result = result.replace(/\)\s*d\s*s/gi, "d10").replace(/\(\s*\)/g, "").replace(/\+\s*\+/g, "+").replace(/\s+/g, " ").trim();
    return result;
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
  function parseCharacterData(apiData, characterId) {
    console.log("CarmaClouds: Parsing character data...");
    if (!apiData.creatures || apiData.creatures.length === 0) {
      console.error("CarmaClouds: No creatures found in API response");
      throw new Error("No character data found in API response");
    }
    const creature = apiData.creatures[0];
    const variables2 = apiData.creatureVariables && apiData.creatureVariables[0] || {};
    const properties = apiData.creatureProperties || [];
    console.log("CarmaClouds: Creature:", creature.name);
    console.log("CarmaClouds: Variables count:", Object.keys(variables2).length);
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
      if (variables2.armorClass && (variables2.armorClass.total || variables2.armorClass.value)) {
        const variableAC = variables2.armorClass.total || variables2.armorClass.value;
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
        if (variables2.hasOwnProperty(vn)) {
          const v = variables2[vn];
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
      if (prop.type === "class" && prop.name && isValidProperty(prop)) {
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
      const raceVars = Object.keys(variables2).filter(
        (key) => key.toLowerCase().includes("race") || key.toLowerCase().includes("species")
      );
      if (raceVars.length > 0) {
        console.log("CarmaClouds: Found race-related variables:", raceVars);
        raceVars.forEach((varName) => {
          console.log(`CarmaClouds: Raw data for "${varName}":`, variables2[varName]);
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
          const subRaceValue = variables2[subRaceVar];
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
            const varValue = variables2[varName];
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
          const raceValue = variables2[raceVar];
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
            const varValue = variables2[varName];
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
        variables: variables2,
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
    const { creature, variables: variables2, properties } = rawData;
    const characterName = creature.name || "";
    let race = "Unknown";
    let characterClass = "";
    let level = 0;
    const uniqueClasses = /* @__PURE__ */ new Set();
    let raceFound = false;
    for (const prop of properties) {
      if (!prop)
        continue;
      if (!raceFound && prop.type === "folder" && prop.name) {
        const commonRaces = ["half-elf", "half-orc", "dragonborn", "tiefling", "halfling", "human", "elf", "dwarf", "gnome", "orc", "goblin", "kobold", "warforged", "tabaxi", "kenku", "aarakocra", "genasi", "aasimar", "firbolg", "goliath", "triton", "yuan-ti", "tortle", "lizardfolk", "bugbear", "hobgoblin", "changeling", "shifter", "kalashtar"];
        const nameMatchesRace = commonRaces.some((r) => new RegExp(`\\b${r}\\b`, "i").test(prop.name));
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
      if (prop.type === "class" && prop.name && isValidProperty(prop)) {
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
      const raceVars = Object.keys(variables2).filter(
        (key) => key.toLowerCase().includes("race") || key.toLowerCase().includes("species")
      );
      if (raceVars.length > 0) {
        raceVars.forEach((varName) => {
          console.log(`parseForRollCloud: Raw data for "${varName}":`, variables2[varName]);
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
          const subRaceValue = variables2[subRaceVar];
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
          const raceValue = variables2[raceVar];
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
            const varValue = variables2[varName];
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
      attributes[ability] = variables2[ability]?.total || variables2[ability]?.value || 10;
    });
    const attributeMods = {};
    Object.keys(attributes).forEach((attr) => {
      attributeMods[attr] = Math.floor((attributes[attr] - 10) / 2);
    });
    const saves = {};
    STANDARD_VARS.saves.forEach((save) => {
      if (variables2[save]) {
        const abilityName = save.replace("Save", "");
        saves[abilityName] = variables2[save].total || variables2[save].value || 0;
      }
    });
    const skills = {};
    STANDARD_VARS.skills.forEach((skill) => {
      if (variables2[skill]) {
        skills[skill] = variables2[skill].total || variables2[skill].value || 0;
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
      if (variables2.armorClass?.total || variables2.armorClass?.value) {
        return variables2.armorClass.total || variables2.armorClass.value;
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
        if (variables2.hasOwnProperty(vn)) {
          const candidate = extractNumeric(variables2[vn]?.total ?? variables2[vn]?.value ?? variables2[vn]);
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
    const extractText = (field) => {
      if (!field)
        return "";
      let text = "";
      if (typeof field === "string") {
        text = field;
      } else if (typeof field === "object" && field.text) {
        text = field.text;
      }
      return evaluateConditionals(text, variables2);
    };
    const spells = properties.filter((p) => p.type === "spell" && isValidProperty(p)).map((spell) => {
      const spellChildren = properties.filter((p) => {
        if (p.type !== "roll" && p.type !== "damage" && p.type !== "attack")
          return false;
        if (p.ancestors && Array.isArray(p.ancestors)) {
          return p.ancestors.some((ancestor) => {
            const ancestorId = typeof ancestor === "object" ? ancestor.id : ancestor;
            return ancestorId === spell._id;
          });
        }
        return false;
      });
      let attackRoll = "";
      const attackChild = spellChildren.find((c) => c.type === "attack" || c.type === "roll" && c.name && c.name.toLowerCase().includes("attack"));
      if (attackChild && attackChild.roll) {
        if (typeof attackChild.roll === "string") {
          attackRoll = attackChild.roll;
        } else if (typeof attackChild.roll === "object") {
          attackRoll = attackChild.roll.calculation || attackChild.roll.value || "use_spell_attack_bonus";
        }
      }
      if (!attackRoll) {
        const spellDescription = extractText(spell.description).toLowerCase();
        const spellSummary = extractText(spell.summary).toLowerCase();
        const fullText = `${spellDescription} ${spellSummary}`;
        const hasSpellAttack = /\b(ranged spell attack|melee spell attack|spell attack roll)\b/.test(fullText);
        if (hasSpellAttack) {
          attackRoll = "use_spell_attack_bonus";
          console.log(`\u2728 Detected spell attack in description for "${spell.name}", using spell attack bonus`);
        }
      }
      if (attackRoll && attackRoll !== "use_spell_attack_bonus") {
        attackRoll = evaluateDamageFormula(attackRoll, variables2);
      }
      const damageRolls = [];
      spellChildren.filter((c) => c.type === "damage" || c.type === "roll" && c.name && (c.name.toLowerCase().includes("damage") || c.name.toLowerCase().includes("heal"))).forEach((damageChild) => {
        let formula2 = "";
        if (damageChild.amount) {
          if (typeof damageChild.amount === "string") {
            formula2 = damageChild.amount;
          } else if (typeof damageChild.amount === "object") {
            formula2 = damageChild.amount.calculation || String(damageChild.amount.value || "");
          }
        } else if (damageChild.roll) {
          if (typeof damageChild.roll === "string") {
            formula2 = damageChild.roll;
          } else if (typeof damageChild.roll === "object") {
            formula2 = damageChild.roll.calculation || String(damageChild.roll.value || "");
          }
        } else if (damageChild.damage) {
          if (typeof damageChild.damage === "string") {
            formula2 = damageChild.damage;
          } else if (typeof damageChild.damage === "object") {
            formula2 = damageChild.damage.calculation || String(damageChild.damage.value || "");
          }
        }
        if (formula2) {
          const evaluatedFormula = evaluateDamageFormula(formula2, variables2);
          damageRolls.push({
            formula: evaluatedFormula,
            type: damageChild.damageType || "",
            name: damageChild.name || ""
          });
        }
      });
      const damage = damageRolls.length > 0 ? damageRolls[0].formula : "";
      const damageType = damageRolls.length > 0 ? damageRolls[0].type : "";
      let spellType = "utility";
      if (damageRolls.length > 0) {
        const hasHealingRoll = damageRolls.some(
          (roll) => roll.name.toLowerCase().includes("heal") || roll.type.toLowerCase().includes("heal")
        );
        const spellName = (spell.name || "").toLowerCase();
        const hasHealingName = spellName.includes("heal") || spellName.includes("cure") || spellName.includes("regenerat") || spellName.includes("revivif") || spellName.includes("restoration") || spellName.includes("raise") || spellName.includes("resurrect");
        const spellDesc = extractText(spell.description).toLowerCase();
        const hasHealingDesc = spellDesc.includes("regain") && spellDesc.includes("hit point");
        spellType = hasHealingRoll || hasHealingName || hasHealingDesc ? "healing" : "damage";
      }
      let isLifesteal = false;
      if (damageRolls.length >= 2) {
        const hasDamageRoll = damageRolls.some(
          (roll) => roll.type && roll.type.toLowerCase() !== "healing"
        );
        const hasHealingRoll = damageRolls.some(
          (roll) => roll.type && roll.type.toLowerCase() === "healing"
        );
        const spellName = (spell.name || "").toLowerCase();
        const spellDesc = extractText(spell.description).toLowerCase();
        const isVampiric = spellName.includes("vampiric") || spellDesc.includes("regain") && spellDesc.includes("damage");
        isLifesteal = hasDamageRoll && hasHealingRoll && isVampiric;
      }
      return {
        id: spell._id,
        name: spell.name || "Unnamed Spell",
        level: spell.level || 0,
        school: spell.school || "",
        spellType,
        castingTime: spell.castingTime || "",
        range: spell.range || "",
        components: spell.components || "",
        duration: spell.duration || "",
        description: extractText(spell.description),
        summary: extractText(spell.summary),
        ritual: spell.ritual || false,
        concentration: spell.concentration || false,
        prepared: spell.prepared !== false,
        alwaysPrepared: spell.alwaysPrepared || false,
        attackRoll,
        damage,
        damageType,
        damageRolls,
        isLifesteal
      };
    });
    const actions = properties.filter((p) => p.type === "action" && p.name && isValidProperty(p)).map((action) => {
      const actionChildren = properties.filter((p) => {
        if (p.type !== "roll" && p.type !== "damage" && p.type !== "attack")
          return false;
        if (p.ancestors && Array.isArray(p.ancestors)) {
          return p.ancestors.some((ancestor) => {
            const ancestorId = typeof ancestor === "object" ? ancestor.id : ancestor;
            return ancestorId === action._id;
          });
        }
        return false;
      });
      let attackRoll = "";
      if (action.attackRoll) {
        attackRoll = typeof action.attackRoll === "string" ? action.attackRoll : String(action.attackRoll.value || action.attackRoll.calculation || "");
      } else {
        const attackChild = actionChildren.find((c) => c.type === "attack" || c.type === "roll" && c.name && c.name.toLowerCase().includes("attack"));
        if (attackChild && attackChild.roll) {
          if (typeof attackChild.roll === "string") {
            attackRoll = attackChild.roll;
          } else if (typeof attackChild.roll === "object") {
            attackRoll = attackChild.roll.calculation || attackChild.roll.value || "";
          }
        }
      }
      if (attackRoll) {
        attackRoll = evaluateDamageFormula(attackRoll, variables2);
      }
      let damage = "";
      let damageType = "";
      if (action.damage) {
        damage = typeof action.damage === "string" ? action.damage : String(action.damage.value || action.damage.calculation || "");
      } else {
        const damageChild = actionChildren.find((c) => c.type === "damage" || c.type === "roll" && c.name && c.name.toLowerCase().includes("damage"));
        if (damageChild) {
          if (damageChild.amount) {
            if (typeof damageChild.amount === "string") {
              damage = damageChild.amount;
            } else if (typeof damageChild.amount === "object") {
              damage = damageChild.amount.calculation || String(damageChild.amount.value || "");
            }
          } else if (damageChild.roll) {
            if (typeof damageChild.roll === "string") {
              damage = damageChild.roll;
            } else if (typeof damageChild.roll === "object") {
              damage = damageChild.roll.calculation || String(damageChild.roll.value || "");
            }
          } else if (damageChild.damage) {
            if (typeof damageChild.damage === "string") {
              damage = damageChild.damage;
            } else if (typeof damageChild.damage === "object") {
              damage = damageChild.damage.calculation || String(damageChild.damage.value || "");
            }
          }
          if (damageChild.damageType) {
            damageType = damageChild.damageType;
          }
        }
      }
      if (damage) {
        damage = evaluateDamageFormula(damage, variables2);
      }
      if (damage && attackRoll) {
        const tags2 = action.tags || [];
        const description = extractText(action.description).toLowerCase();
        const summary = extractText(action.summary).toLowerCase();
        const isFinesse = tags2.some((t) => typeof t === "string" && t.toLowerCase().includes("finesse")) || description.includes("finesse") || summary.includes("finesse");
        if (isFinesse) {
          const hasAbilityMod = /\+\s*\d{1,2}(?!\d)/.test(damage) || /dexterityMod|strengthMod|dexMod|strMod/i.test(damage);
          if (!hasAbilityMod) {
            const strMod = parseFloat(variables2.strengthMod || variables2.strengthmod || 0);
            const dexMod = parseFloat(variables2.dexterityMod || variables2.dexteritymod || 0);
            const abilityMod = Math.max(strMod, dexMod);
            if (abilityMod > 0) {
              damage = `${damage} + ${abilityMod}`;
            } else if (abilityMod < 0) {
              damage = `${damage} - ${Math.abs(abilityMod)}`;
            }
          }
        }
      }
      if (!damageType && action.damageType) {
        damageType = action.damageType;
      }
      let actionType = "action";
      const tags = action.tags || [];
      const nameLower = (action.name || "").toLowerCase();
      const summaryLower = extractText(action.summary).toLowerCase();
      if (tags.some((t) => typeof t === "string" && t.toLowerCase().includes("bonus"))) {
        actionType = "bonus";
      } else if (tags.some((t) => typeof t === "string" && t.toLowerCase().includes("reaction"))) {
        actionType = "reaction";
      } else if (tags.some((t) => typeof t === "string" && t.toLowerCase().includes("free"))) {
        actionType = "free";
      } else if (tags.some((t) => typeof t === "string" && (t.toLowerCase().includes("legendary") || t.toLowerCase().includes("lair")))) {
        actionType = "free";
      } else if (tags.some((t) => typeof t === "string" && t.toLowerCase().includes("attack"))) {
        actionType = "action";
      } else if (nameLower.includes("bonus action") || summaryLower.includes("bonus action")) {
        actionType = "bonus";
      } else if (nameLower.includes("reaction") || summaryLower.includes("reaction")) {
        actionType = "reaction";
      } else if (nameLower.includes("free action") || summaryLower.includes("free action")) {
        actionType = "free";
      } else if (attackRoll || damage) {
        actionType = "action";
      }
      return {
        id: action._id,
        name: action.name,
        actionType,
        description: extractText(action.description),
        summary: extractText(action.summary),
        attackRoll,
        damage,
        damageType,
        uses: action.uses || 0,
        usesUsed: action.usesUsed || 0,
        reset: action.reset || "",
        resources: action.resources || {},
        tags: action.tags || []
      };
    });
    const spellSlots = {};
    console.log("\u{1F52E} Parsing spell slots from variables...");
    console.log("\u{1F52E} Available variables:", Object.keys(variables2).filter((k) => k.toLowerCase().includes("slot")));
    for (let level2 = 1; level2 <= 9; level2++) {
      const slotVar = variables2[`slotLevel${level2}`];
      if (slotVar) {
        const current = slotVar.value || 0;
        const max = slotVar.total || slotVar.max || slotVar.value || 0;
        console.log(`\u{1F52E} Level ${level2} spell slots:`, { current, max, slotVar });
        spellSlots[`level${level2}`] = {
          current,
          max
        };
      }
    }
    console.log("\u{1F52E} Final spell slots:", spellSlots);
    const resources = properties.filter((p) => p.type === "resource" || p.type === "attribute" && p.attributeType === "resource").map((resource) => ({
      id: resource._id,
      name: resource.name || "Unnamed Resource",
      current: resource.value || resource.currentValue || 0,
      max: resource.total || resource.max || 0,
      reset: resource.reset || "",
      variableName: resource.variableName || resource.varName || ""
    }));
    const inventory = properties.filter((p) => (p.type === "item" || p.type === "equipment" || p.type === "container") && isValidProperty(p)).map((item) => ({
      id: item._id,
      name: item.name || "Unnamed Item",
      quantity: item.quantity || 1,
      weight: item.weight || 0,
      value: item.value || 0,
      description: extractText(item.description),
      summary: extractText(item.summary),
      equipped: item.equipped || false,
      attuned: item.attuned || false,
      requiresAttunement: item.requiresAttunement || false
    }));
    const companions = extractCompanions(properties);
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
        current: variables2.hitPoints?.currentValue ?? variables2.hitPoints?.value ?? 0,
        max: variables2.hitPoints?.total ?? variables2.hitPoints?.max ?? 0
      },
      temporaryHP: variables2.temporaryHitPoints?.value ?? variables2.temporaryHitPoints?.currentValue ?? 0,
      armorClass: calculateAC(),
      speed: variables2.speed?.total || variables2.speed?.value || 30,
      initiative: variables2.initiative?.total || variables2.initiative?.value || 0,
      proficiencyBonus: variables2.proficiencyBonus?.total || variables2.proficiencyBonus?.value || 0,
      spellSlots,
      resources,
      inventory: deduplicateByName(inventory),
      spells: deduplicateByName(spells),
      actions: deduplicateByName(actions),
      companions
    };
  }
  function extractCompanions(properties) {
    console.log("\u{1F43E} Extracting companions from features...");
    console.log("\u{1F43E} Total properties to check:", properties.length);
    const propertyTypes = /* @__PURE__ */ new Set();
    properties.forEach((p) => {
      if (p && p.type)
        propertyTypes.add(p.type);
    });
    console.log("\u{1F43E} Property types available:", Array.from(propertyTypes).sort());
    const companionPatterns = [
      /companion/i,
      /beast of/i,
      /familiar/i,
      /summon/i,
      /mount/i,
      /steel defender/i,
      /homunculus/i,
      /drake/i,
      /primal companion/i,
      /beast master/i,
      /ranger's companion/i
    ];
    const companions = [];
    const potentialCompanions = properties.filter((p) => {
      if (!p || !p.name || p.inactive)
        return false;
      return companionPatterns.some((pattern) => pattern.test(p.name));
    });
    console.log(`\u{1F43E} Found ${potentialCompanions.length} properties matching companion patterns`);
    potentialCompanions.forEach((prop) => {
      console.log(`\u{1F43E} Potential companion: "${prop.name}" (type: ${prop.type})`);
    });
    const seenCompanions = /* @__PURE__ */ new Set();
    potentialCompanions.forEach((feature) => {
      if (feature.description) {
        console.log(`\u{1F43E} Parsing companion: ${feature.name}`);
        const companion = parseCompanionStatBlock(feature.name, feature.description);
        if (companion) {
          if (!seenCompanions.has(companion.name)) {
            companions.push(companion);
            seenCompanions.add(companion.name);
            console.log(`\u2705 Added companion: ${companion.name}`);
          } else {
            console.log(`\u23ED\uFE0F Skipping duplicate companion: ${companion.name}`);
          }
        } else {
          console.log(`\u26A0\uFE0F Failed to parse companion stat block for: ${feature.name}`);
        }
      } else {
        console.log(`\u26A0\uFE0F No description for potential companion: ${feature.name}`);
      }
    });
    console.log(`\u{1F43E} Total companions found: ${companions.length} (after deduplication)`);
    return companions;
  }
  function parseCompanionStatBlock(name, description) {
    let descText = typeof description === "object" ? description.value || description.text || "" : description;
    if (!descText || descText.trim() === "")
      return null;
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
      actions: []
    };
    const sizeTypeMatch = descText.match(/(Tiny|Small|Medium|Large|Huge|Gargantuan)\s+(\w+),\s*(\w+)/i);
    if (sizeTypeMatch) {
      companion.size = sizeTypeMatch[1];
      companion.type = sizeTypeMatch[2];
      companion.alignment = sizeTypeMatch[3];
    }
    const acMatch = descText.match(/\*\*AC\*\*\s+(\d+)|AC\s+(\d+)/i);
    if (acMatch)
      companion.ac = parseInt(acMatch[1] || acMatch[2]);
    const hpMatch = descText.match(/\*\*HP\*\*\s+(\d+\s*\([^)]+\))|HP\s+(\d+\s*\([^)]+\))/i);
    if (hpMatch)
      companion.hp = hpMatch[1] || hpMatch[2];
    const speedMatch = descText.match(/Speed\s+([^•\n]+)/i);
    if (speedMatch)
      companion.speed = speedMatch[1].trim();
    const abilityLine = descText.match(/\|\s*(\d+)\s*\(([+\-]\d+)\)\s*\|\s*(\d+)\s*\(([+\-]\d+)\)\s*\|\s*(\d+)\s*\(([+\-]\d+)\)\s*\|\s*(\d+)\s*\(([+\-]\d+)\)\s*\|\s*(\d+)\s*\(([+\-]\d+)\)\s*\|\s*(\d+)\s*\(([+\-]\d+)\)\s*\|/);
    if (abilityLine) {
      const abilities = ["str", "dex", "con", "int", "wis", "cha"];
      abilities.forEach((ability, i) => {
        const scoreIdx = i * 2 + 1;
        const modIdx = i * 2 + 2;
        if (abilityLine[scoreIdx] && abilityLine[modIdx]) {
          companion.abilities[ability] = {
            score: parseInt(abilityLine[scoreIdx]),
            modifier: parseInt(abilityLine[modIdx])
          };
        }
      });
    }
    const sensesMatch = descText.match(/Senses\s+([^•\n]+)/i);
    if (sensesMatch)
      companion.senses = sensesMatch[1].trim();
    const languagesMatch = descText.match(/Languages\s+([^•\n]+)/i);
    if (languagesMatch)
      companion.languages = languagesMatch[1].trim();
    const pbMatch = descText.match(/Proficiency Bonus\s+(\d+)/i);
    if (pbMatch)
      companion.proficiencyBonus = parseInt(pbMatch[1]);
    const featurePattern = /\*\*\*([^*\n.]+)\.\*\*\*\s*([^*\n]+)/gi;
    let featureMatch;
    while ((featureMatch = featurePattern.exec(descText)) !== null) {
      companion.features.push({
        name: featureMatch[1].trim(),
        description: featureMatch[2].trim()
      });
    }
    const actionsMatch = descText.match(/###?\s*Actions\s+([\s\S]+)/i);
    if (actionsMatch) {
      const actionsText = actionsMatch[1];
      const attackLines = actionsText.split("\n").filter((line) => line.includes("***") && line.includes("Melee Weapon Attack"));
      attackLines.forEach((attackLine) => {
        const nameMatch = attackLine.match(/\*\*\*(\w+)\.\*\*\*/);
        const bonusMatch = attackLine.match(/\*\*(\+\d+)\*\*/);
        const reachMatch = attackLine.match(/reach\s*([\d\s]+ft\.)/);
        const damageMatch = attackLine.match(/\*?Hit:\*?\s*\*\*([^*]+?)\*\*/);
        if (nameMatch && bonusMatch && reachMatch && damageMatch) {
          companion.actions.push({
            name: nameMatch[1].trim(),
            type: "attack",
            attackBonus: parseInt(bonusMatch[1]),
            reach: reachMatch[1].trim(),
            damage: damageMatch[1].trim()
          });
        }
      });
    }
    if (companion.ac > 0 || companion.hp || Object.keys(companion.abilities).length > 0) {
      return companion;
    }
    return null;
  }
  function parseForOwlCloud(rawData) {
    return parseForRollCloud(rawData);
  }
  function parseForFoundCloud(rawData, characterId = null) {
    console.log("\u{1F3B2} Parsing character for Foundry VTT...");
    const rollCloudData = parseForRollCloud(rawData, characterId);
    const foundryData = {
      // Basic info
      id: characterId || rollCloudData.id,
      name: rollCloudData.name,
      type: "character",
      // Attributes (abilities)
      attributes: {
        strength: rollCloudData.attributes?.strength || 10,
        dexterity: rollCloudData.attributes?.dexterity || 10,
        constitution: rollCloudData.attributes?.constitution || 10,
        intelligence: rollCloudData.attributes?.intelligence || 10,
        wisdom: rollCloudData.attributes?.wisdom || 10,
        charisma: rollCloudData.attributes?.charisma || 10,
        STR: rollCloudData.attributes?.strength || 10,
        DEX: rollCloudData.attributes?.dexterity || 10,
        CON: rollCloudData.attributes?.constitution || 10,
        INT: rollCloudData.attributes?.intelligence || 10,
        WIS: rollCloudData.attributes?.wisdom || 10,
        CHA: rollCloudData.attributes?.charisma || 10
      },
      // Hit points
      hit_points: {
        current: rollCloudData.hitPoints?.current || 0,
        max: rollCloudData.hitPoints?.max || 0
      },
      // Core stats
      armor_class: rollCloudData.armorClass || 10,
      speed: rollCloudData.speed || 30,
      initiative: rollCloudData.initiative || 0,
      proficiency_bonus: rollCloudData.proficiencyBonus || 2,
      // Character details
      level: rollCloudData.level || 1,
      race: rollCloudData.race || "Unknown",
      class: rollCloudData.class || "Unknown",
      alignment: rollCloudData.alignment || "",
      background: rollCloudData.background || "",
      // Skills (map to Foundry format)
      skills: rollCloudData.skills || {},
      // Saves
      saves: rollCloudData.saves || {},
      // Death saves
      death_saves: rollCloudData.deathSaves || { successes: 0, failures: 0 },
      // Inspiration
      inspiration: rollCloudData.inspiration || false,
      // Temporary HP
      temporary_hp: rollCloudData.hitPoints?.temp || 0,
      // Spells (keep full spell data)
      spells: rollCloudData.spells || [],
      spell_slots: rollCloudData.spellSlots || {},
      // Actions (keep full action data)
      actions: rollCloudData.actions || [],
      // Inventory
      inventory: rollCloudData.inventory || [],
      // Resources
      resources: rollCloudData.resources || [],
      // Companions
      companions: rollCloudData.companions || [],
      // Raw DiceCloud data for advanced features
      raw_dicecloud_data: {
        creature: rawData.creature || {},
        variables: rawData.variables || {},
        properties: rawData.properties || [],
        picture: rawData.creature?.picture,
        description: rawData.creature?.description,
        flySpeed: extractVariable(rawData.variables, "flySpeed"),
        swimSpeed: extractVariable(rawData.variables, "swimSpeed"),
        climbSpeed: extractVariable(rawData.variables, "climbSpeed"),
        damageImmunities: extractVariable(rawData.variables, "damageImmunities"),
        damageResistances: extractVariable(rawData.variables, "damageResistances"),
        damageVulnerabilities: extractVariable(rawData.variables, "damageVulnerabilities"),
        conditionImmunities: extractVariable(rawData.variables, "conditionImmunities"),
        languages: extractVariable(rawData.variables, "languages"),
        size: extractVariable(rawData.variables, "size") || "medium",
        currency: {
          pp: extractVariable(rawData.variables, "pp") || 0,
          gp: extractVariable(rawData.variables, "gp") || 0,
          ep: extractVariable(rawData.variables, "ep") || 0,
          sp: extractVariable(rawData.variables, "sp") || 0,
          cp: extractVariable(rawData.variables, "cp") || 0
        },
        experiencePoints: extractVariable(rawData.variables, "experiencePoints") || 0
      }
    };
    console.log("\u2705 Parsed for Foundry VTT:", foundryData.name);
    return foundryData;
  }
  function extractVariable(variables2, varName) {
    if (!variables2 || !variables2[varName])
      return null;
    const varData = variables2[varName];
    return varData.value !== void 0 ? varData.value : varData;
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
    } else if (request.action === "resetUIPositions") {
      console.log("\u{1F504} Resetting UI positions on DiceCloud");
      localStorage.removeItem("carmaclouds_button_position");
      const buttonContainer = document.querySelector("#carmaclouds-sync-button-container");
      if (buttonContainer) {
        buttonContainer.style.transform = "translate(0px, 0px)";
        console.log("\u2705 Reset button visual position to default");
      }
      console.log("\u2705 Reset DiceCloud sync button position");
      sendResponse({ success: true, message: "DiceCloud sync button position reset" });
      return true;
    }
  });
  waitForPageLoad();
})();
//# sourceMappingURL=dicecloud.js.map
