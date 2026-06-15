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
  var COIN_DENOMINATIONS = { copper: "cp", silver: "sp", electrum: "ep", gold: "gp", platinum: "pp" };
  function coinDenomination(name) {
    const m = String(name || "").trim().match(/^(copper|silver|electrum|gold|platinum)\s+pieces?\b/i);
    return m ? COIN_DENOMINATIONS[m[1].toLowerCase()] : null;
  }
  function extractCurrency(properties) {
    const currency = { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };
    if (!Array.isArray(properties))
      return currency;
    for (const p of properties) {
      if (!p || p.type !== "item")
        continue;
      const denom = coinDenomination(p.name);
      if (!denom)
        continue;
      const qty = typeof p.quantity === "number" ? p.quantity : Number(p.quantity) || 0;
      currency[denom] += qty;
    }
    return currency;
  }
  function extractBackground(properties) {
    if (!Array.isArray(properties))
      return "";
    const slot = properties.find((p) => p && p.type === "propertySlot" && (p.name === "Background" || Array.isArray(p.tags) && p.tags.includes("backgroundSlot")));
    if (!slot || !slot._id)
      return "";
    const fillers = properties.filter((p) => p && p.type === "folder" && p.parent && p.parent.id === slot._id);
    const filler = fillers.find((p) => Array.isArray(p.tags) && p.tags.includes("background")) || fillers[0];
    return filler && filler.name ? String(filler.name).trim() : "";
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
      let v = variables[name];
      if (v === void 0)
        v = variables[name.toLowerCase()];
      if (v === void 0)
        return void 0;
      if (v !== null && typeof v === "object")
        return v.value ?? v.total ?? void 0;
      return v;
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
  function evalArith(expr) {
    if (typeof expr !== "string" || !/^[\d+\-*/.\s]+$/.test(expr))
      return null;
    const tokens = expr.replace(/\s+/g, "").match(/\d+\.?\d*|[+\-*/]/g);
    if (!tokens || tokens.length === 0)
      return null;
    const terms = [parseFloat(tokens[0])];
    if (isNaN(terms[0]))
      return null;
    for (let i = 1; i < tokens.length; i += 2) {
      const op = tokens[i];
      const n = parseFloat(tokens[i + 1]);
      if (isNaN(n))
        return null;
      if (op === "*")
        terms[terms.length - 1] *= n;
      else if (op === "/")
        terms[terms.length - 1] /= n;
      else if (op === "+")
        terms.push(n);
      else if (op === "-")
        terms.push(-n);
      else
        return null;
    }
    const sum = terms.reduce((a, b) => a + b, 0);
    return isFinite(sum) ? sum : null;
  }
  function bestFormula(obj) {
    if (obj == null)
      return "";
    if (typeof obj === "string")
      return obj;
    if (typeof obj === "number")
      return String(obj);
    const val = obj.value;
    const calc = obj.calculation;
    if (typeof val === "number")
      return String(val);
    if (typeof val === "string" && val && !/[\[\]]/.test(val) && /^[0-9dD+\-*/(). ]+$/.test(val.replace(/\s/g, ""))) {
      return val;
    }
    return calc || (typeof val === "string" ? val : "");
  }
  function buildRollVarMap(properties) {
    const map = {};
    for (const p of properties || []) {
      if (!p)
        continue;
      if (p.type === "roll" && p.variableName && p.roll) {
        const calc = bestFormula(p.roll);
        if (calc)
          map[p.variableName] = calc;
      }
    }
    return map;
  }
  function resolveDiceCloudScaling(formula2, rollVarMap, slotLevel, depth = 0) {
    if (!formula2 || typeof formula2 !== "string" || depth > 6)
      return formula2;
    let out = formula2;
    out = out.replace(/\bslotLevel\b/g, String(slotLevel));
    out = out.replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g, (name) => {
      if (name === "d" || name === "D")
        return name;
      if (rollVarMap && Object.prototype.hasOwnProperty.call(rollVarMap, name)) {
        const sub = resolveDiceCloudScaling(rollVarMap[name], rollVarMap, slotLevel, depth + 1);
        return /[+\-]/.test(sub) ? `(${sub})` : sub;
      }
      return name;
    });
    out = out.replace(/\[\s*([^\[\]]+?)\s*\]\s*\[\s*(\d+)\s*\]/g, (m, list, idx) => {
      const arr = list.split(",").map((s) => s.trim());
      const i = parseInt(idx, 10) - 1;
      return i >= 0 && i < arr.length ? arr[i] : m;
    });
    out = out.replace(/\(\s*([0-9+\-*/.\s]+?)\s*\)/g, (m, expr) => {
      const v = evalArith(expr);
      return v !== null ? String(v) : m;
    });
    return out;
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
    const rollVarMap = buildRollVarMap(properties);
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
      } else if (typeof field === "object") {
        text = typeof field.value === "string" && field.value.trim() ? field.value : field.text || "";
      }
      return evaluateConditionals(text, variables2).replace(/\*\*/g, "");
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
        attackRoll = bestFormula(attackChild.roll) || "use_spell_attack_bonus";
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
        attackRoll = evaluateDamageFormula(resolveDiceCloudScaling(attackRoll, rollVarMap, spell.level || 1), variables2);
      }
      const damageRolls = [];
      spellChildren.filter((c) => c.type === "damage" || c.type === "roll" && c.name && (c.name.toLowerCase().includes("damage") || c.name.toLowerCase().includes("heal"))).forEach((damageChild) => {
        let formula2 = "";
        if (damageChild.amount) {
          if (typeof damageChild.amount === "string") {
            formula2 = damageChild.amount;
          } else if (typeof damageChild.amount === "object") {
            formula2 = bestFormula(damageChild.amount);
          }
        } else if (damageChild.roll) {
          if (typeof damageChild.roll === "string") {
            formula2 = damageChild.roll;
          } else if (typeof damageChild.roll === "object") {
            formula2 = bestFormula(damageChild.roll);
          }
        } else if (damageChild.damage) {
          if (typeof damageChild.damage === "string") {
            formula2 = damageChild.damage;
          } else if (typeof damageChild.damage === "object") {
            formula2 = bestFormula(damageChild.damage);
          }
        }
        if (formula2) {
          const evaluatedFormula = evaluateDamageFormula(resolveDiceCloudScaling(formula2, rollVarMap, spell.level || 1), variables2);
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
    const actions = properties.filter((p) => (p.type === "action" || p.type === "attack") && p.name && isValidProperty(p)).map((action) => {
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
        attackRoll = bestFormula(action.attackRoll);
      } else if (action.type === "attack" && action.roll) {
        attackRoll = bestFormula(action.roll);
      } else {
        const attackChild = actionChildren.find((c) => c.type === "attack" || c.type === "roll" && c.name && c.name.toLowerCase().includes("attack"));
        if (attackChild && attackChild.roll) {
          attackRoll = bestFormula(attackChild.roll);
        }
      }
      if (attackRoll) {
        attackRoll = evaluateDamageFormula(resolveDiceCloudScaling(attackRoll, rollVarMap, 1), variables2);
      }
      let damage = "";
      let damageType = "";
      if (action.damage) {
        damage = bestFormula(action.damage);
      } else {
        const damageChild = actionChildren.find((c) => c.type === "damage" || c.type === "roll" && c.name && c.name.toLowerCase().includes("damage"));
        if (damageChild) {
          if (damageChild.amount) {
            if (typeof damageChild.amount === "string") {
              damage = damageChild.amount;
            } else if (typeof damageChild.amount === "object") {
              damage = bestFormula(damageChild.amount);
            }
          } else if (damageChild.roll) {
            if (typeof damageChild.roll === "string") {
              damage = damageChild.roll;
            } else if (typeof damageChild.roll === "object") {
              damage = bestFormula(damageChild.roll);
            }
          } else if (damageChild.damage) {
            if (typeof damageChild.damage === "string") {
              damage = damageChild.damage;
            } else if (typeof damageChild.damage === "object") {
              damage = bestFormula(damageChild.damage);
            }
          }
          if (damageChild.damageType) {
            damageType = damageChild.damageType;
          }
        }
      }
      if (damage) {
        damage = evaluateDamageFormula(resolveDiceCloudScaling(damage, rollVarMap, 1), variables2);
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
    console.log("\u{1F52E} Parsing spell slots...");
    console.log("\u{1F52E} Available slot variables:", Object.keys(variables2).filter((k) => k.toLowerCase().includes("slot")));
    const spellSlotProps = properties.filter((p) => p.type === "attribute" && p.attributeType === "spellSlot");
    console.log("\u{1F52E} spellSlot properties:", spellSlotProps);
    for (const prop of spellSlotProps) {
      const level2 = prop.level || parseInt((prop.variableName || "").replace(/\D/g, ""), 10);
      if (level2 >= 1 && level2 <= 9) {
        spellSlots[`level${level2}`] = {
          current: prop.value ?? prop.total ?? 0,
          max: prop.total ?? prop.value ?? 0
        };
      }
    }
    for (let level2 = 1; level2 <= 9; level2++) {
      if (spellSlots[`level${level2}`])
        continue;
      const slotVar = variables2[`slotLevel${level2}`] || variables2[`spellSlot${level2}`];
      if (slotVar) {
        const current = slotVar.value ?? 0;
        const max = slotVar.total ?? slotVar.max ?? slotVar.value ?? 0;
        console.log(`\u{1F52E} Level ${level2} spell slots (variable fallback):`, { current, max, slotVar });
        spellSlots[`level${level2}`] = { current, max };
      }
    }
    const numOf2 = (v) => {
      if (v == null)
        return void 0;
      if (typeof v === "number")
        return v;
      if (typeof v === "object")
        return v.value ?? v.total ?? void 0;
      const n = Number(v);
      return Number.isFinite(n) ? n : void 0;
    };
    const pactProp = spellSlotProps.find((p) => p.variableName === "pactSlot" || Array.isArray(p.tags) && p.tags.includes("pactSpellSlot"));
    const pactMax = (pactProp && (pactProp.total ?? pactProp.value)) ?? numOf2(variables2.pactSlot);
    if (pactMax && pactMax > 0) {
      const pactCurrent = (pactProp && (pactProp.value ?? pactProp.total)) ?? numOf2(variables2.pactSlot) ?? pactMax;
      const pactLevel = numOf2(variables2.pactSlotLevelVisible) ?? numOf2(variables2.pactSlotLevel) ?? numOf2(variables2.pactCasterLevel) ?? 1;
      spellSlots.pactMagicSlots = pactCurrent;
      spellSlots.pactMagicSlotsMax = pactMax;
      spellSlots.pactMagicSlotLevel = pactLevel;
      console.log(`\u{1F52E} Pact Magic: ${pactCurrent}/${pactMax} at level ${pactLevel}`);
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
    const triggers = properties.filter((p) => p.type === "trigger" && isValidProperty(p)).map((trigger) => {
      console.log("\u26A1 Found trigger:", {
        name: trigger.name,
        condition: trigger.condition,
        effects: trigger.effects,
        raw: trigger
      });
      return {
        id: trigger._id,
        name: trigger.name || "Unnamed Trigger",
        condition: trigger.condition || "",
        description: extractText(trigger.description),
        summary: extractText(trigger.summary),
        tags: trigger.tags || [],
        // Store raw trigger data for edge case handlers
        raw: trigger
      };
    });
    console.log(`\u26A1 Parsed ${triggers.length} triggers:`, triggers.map((t) => t.name));
    const features = properties.filter((p) => p && p.type === "feature" && p.name && isValidProperty(p)).map((f) => ({
      name: f.name,
      description: extractText(f.description),
      summary: extractText(f.summary),
      source: Array.isArray(f.tags) ? f.tags.join(", ") : "",
      uses: f.uses && (f.uses.max ?? 0) > 0 ? { current: f.uses.value ?? f.uses.currentValue ?? 0, max: f.uses.max ?? 0 } : void 0
    }));
    const companions = extractCompanions(properties);
    return {
      name: characterName,
      race,
      class: characterClass || "Unknown",
      level,
      background: extractBackground(properties),
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
      features: deduplicateByName(features),
      triggers: deduplicateByName(triggers),
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
  function parseForOwlCloud(rawData, characterId = null) {
    console.log("\u{1F989} Parsing character for OwlCloud...");
    const base = parseForRollCloud(rawData, characterId);
    const { creature, properties = [], variables: variables2 = {} } = rawData || {};
    const abilityNames = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
    const savingThrows = {};
    abilityNames.forEach((a) => {
      savingThrows[a] = base.saves?.[a] ?? base.attributeMods?.[a] ?? 0;
    });
    const features = (properties || []).filter((p) => p && p.type === "feature" && p.name).map((p) => ({
      name: p.name,
      description: p.description || "",
      source: Array.isArray(p.tags) ? p.tags.join(", ") : "",
      uses: p.uses && (p.uses.max ?? 0) > 0 ? { current: p.uses.value ?? p.uses.currentValue ?? 0, max: p.uses.max ?? 0 } : void 0
    }));
    const normDie = (s) => {
      const m = String(s ?? "").match(/d?\s*(\d+)/i);
      return m ? `d${m[1]}` : null;
    };
    const hitDiceProps = (properties || []).filter(
      (p) => p && p.type === "attribute" && p.attributeType === "hitDice"
    );
    let hitDice;
    if (hitDiceProps.length > 0) {
      let current = 0, max = 0;
      for (const p of hitDiceProps) {
        current += Number(p.value ?? p.currentValue ?? 0) || 0;
        max += Number(p.total ?? p.value ?? 0) || 0;
      }
      const size = normDie(hitDiceProps[0].hitDiceSize) || normDie(hitDiceProps[0].name) || "d8";
      hitDice = { current, max, type: size };
    } else {
      const classLower = (base.class || "").toLowerCase();
      const hitDieMap = {
        "barbarian": 12,
        "fighter": 10,
        "paladin": 10,
        "ranger": 10,
        "bard": 8,
        "cleric": 8,
        "druid": 8,
        "monk": 8,
        "rogue": 8,
        "warlock": 8,
        "sorcerer": 6,
        "wizard": 6
      };
      let hitDieType = 8;
      for (const [cls, die] of Object.entries(hitDieMap)) {
        if (classLower.includes(cls)) {
          hitDieType = die;
          break;
        }
      }
      const hitDiceUsed = variables2?.hitDiceUsed?.value ?? variables2?.hitDiceUsed?.total ?? 0;
      hitDice = {
        current: Math.max(0, (base.level || 1) - hitDiceUsed),
        max: base.level || 1,
        type: `d${hitDieType}`
      };
    }
    const picture = creature?.picture || creature?.avatarPicture || null;
    return {
      id: characterId || base.id,
      name: base.name,
      race: base.race,
      class: base.class,
      level: base.level,
      hitPoints: base.hitPoints,
      temporaryHP: base.temporaryHP || 0,
      armorClass: base.armorClass,
      speed: base.speed,
      initiative: base.initiative,
      proficiencyBonus: base.proficiencyBonus,
      hitDice,
      attributes: base.attributes,
      attributeMods: base.attributeMods,
      savingThrows,
      skills: base.skills,
      spells: base.spells || [],
      spellSlots: base.spellSlots || {},
      actions: base.actions || [],
      features,
      resources: base.resources || [],
      inventory: base.inventory || [],
      picture
    };
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
        // Coins live as inventory items ("Gold piece", etc.), not as variables.
        currency: extractCurrency(rawData.properties),
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

  // ../core/dist/ir/normalize.js
  var DND_ABILITIES = [
    "strength",
    "dexterity",
    "constitution",
    "intelligence",
    "wisdom",
    "charisma"
  ];
  function detectSystem(byVar) {
    const hasAbilities = DND_ABILITIES.every((ab) => byVar[ab]);
    const hasProfBonus = !!byVar["proficiencyBonus"];
    const hasHitDice = Object.values(byVar).some((a) => a.type === "hitDice");
    return hasAbilities && hasProfBonus && hasHitDice ? "dnd5e" : "generic";
  }
  function numOf(v) {
    if (v == null)
      return 0;
    if (typeof v === "number")
      return Number.isFinite(v) ? v : 0;
    if (typeof v === "object")
      return numOf(v.value ?? v.total ?? 0);
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  function has(v) {
    return v != null && !(typeof v === "object" && v.value == null && v.total == null);
  }
  function textOf(d) {
    if (!d)
      return void 0;
    if (typeof d === "string")
      return d || void 0;
    return d.text ?? d.value ?? void 0;
  }
  function resetOf(p) {
    return p.reset ?? null;
  }
  function isRemoved(p) {
    return !p || p.removed === true;
  }
  function activeOf(p) {
    return !p.inactive && !p.deactivatedBySelf && !p.deactivatedByAncestor;
  }
  function normalizeAttribute(p) {
    const value = numOf(p.value);
    const total = numOf(p.total);
    const damage = numOf(p.damage);
    const attr = {
      id: p._id,
      name: p.name ?? p.variableName ?? "",
      variableName: p.variableName ?? "",
      type: p.attributeType ?? "stat",
      value,
      total,
      damage,
      reset: resetOf(p),
      active: activeOf(p),
      tags: Array.isArray(p.tags) ? p.tags : [],
      description: textOf(p.description)
    };
    if (p.attributeType === "ability") {
      attr.modifier = has(p.modifier) ? numOf(p.modifier) : Math.floor((value - 10) / 2);
    }
    if (p.attributeType === "hitDice" && p.hitDiceSize) {
      attr.hitDiceSize = String(p.hitDiceSize);
    }
    if (p.attributeType === "spellSlot" && has(p.spellSlotLevel)) {
      attr.spellSlotLevel = numOf(p.spellSlotLevel);
    }
    return attr;
  }
  function normalizeSkill(p) {
    return {
      id: p._id,
      name: p.name ?? p.variableName ?? "",
      variableName: p.variableName ?? "",
      skillType: p.skillType ?? "skill",
      value: numOf(p.value),
      ability: p.ability || void 0,
      proficiency: numOf(p.proficiency),
      active: activeOf(p),
      tags: Array.isArray(p.tags) ? p.tags : []
    };
  }
  function normalizeItem(p) {
    return {
      id: p._id,
      name: p.name ?? "",
      plural: p.plural || void 0,
      quantity: p.quantity != null ? numOf(p.quantity) : 1,
      equipped: !!p.equipped,
      weight: has(p.weight) ? numOf(p.weight) : void 0,
      value: has(p.value) ? numOf(p.value) : void 0,
      description: textOf(p.description),
      tags: Array.isArray(p.tags) ? p.tags : []
    };
  }
  function consumesOf(p) {
    const consumed = p.resources?.attributesConsumed;
    if (!Array.isArray(consumed))
      return [];
    return consumed.map((c) => ({
      variableName: c.variableName || void 0,
      propertyId: c._id || c.variableId || void 0,
      amount: numOf(c.quantity ?? c.amount ?? 1)
    }));
  }
  function normalizeAction(p, damageByParent) {
    const kind = p.type === "spell" ? "spell" : p.type === "feature" ? "feature" : "action";
    const damage = (damageByParent[p._id] ?? []).map((d) => ({
      formula: d.amount?.calculation ?? String(d.amount?.value ?? ""),
      type: d.damageType || void 0
    })).filter((d) => d.formula);
    const action = {
      id: p._id,
      name: p.name ?? "",
      kind,
      active: activeOf(p),
      consumes: consumesOf(p),
      damage,
      tags: Array.isArray(p.tags) ? p.tags : [],
      description: textOf(p.description)
    };
    const max = numOf(p.uses);
    if (has(p.uses) && max > 0) {
      const current = has(p.usesLeft) ? numOf(p.usesLeft) : Math.max(0, max - numOf(p.usesUsed));
      action.uses = { current, max, reset: resetOf(p) };
    }
    if (has(p.attackRoll)) {
      action.attack = { bonus: numOf(p.attackRoll) };
    }
    if (kind === "spell") {
      action.spell = {
        level: numOf(p.level),
        school: p.school || void 0,
        castingTime: p.castingTime || void 0,
        range: p.range || void 0,
        duration: p.duration || void 0,
        components: p.components || void 0,
        concentration: p.components?.concentration ?? void 0,
        ritual: p.components?.ritual ?? void 0
      };
    }
    return action;
  }
  function isActionLike(p) {
    if (p.type === "action" || p.type === "spell")
      return true;
    if (p.type === "feature")
      return has(p.uses) && numOf(p.uses) > 0;
    return false;
  }
  function normalize(raw) {
    var _a;
    const creature = raw?.creatures?.[0] ?? raw?.creature ?? {};
    const allProps = raw?.creatureProperties ?? raw?.properties ?? [];
    const props = allProps.filter((p) => !isRemoved(p));
    const attributes = props.filter((p) => p.type === "attribute").map(normalizeAttribute);
    const skills = props.filter((p) => p.type === "skill").map(normalizeSkill);
    const damageByParent = {};
    for (const p of props) {
      if (p.type === "damage" && p.parent?.id) {
        (damageByParent[_a = p.parent.id] ?? (damageByParent[_a] = [])).push(p);
      }
    }
    const actions = props.filter(isActionLike).map((p) => normalizeAction(p, damageByParent));
    const inventory = props.filter((p) => p.type === "item").map(normalizeItem);
    const conditions = props.filter((p) => p.type === "buff" || p.type === "toggle").map((p) => ({
      id: p._id,
      name: p.name ?? "",
      kind: p.type,
      active: activeOf(p),
      description: textOf(p.description)
    })).filter((c) => c.name);
    const classes = props.filter((p) => p.type === "class").map((p) => ({ name: p.name ?? "", level: numOf(p.level) })).filter((c) => c.name);
    const byVar = {};
    for (const a of attributes) {
      if (a.variableName)
        byVar[a.variableName] = a;
    }
    return {
      id: creature._id ?? "",
      name: creature.name ?? "",
      portrait: creature.picture || creature.avatarPicture || void 0,
      systemHint: detectSystem(byVar),
      attributes,
      skills,
      actions,
      inventory,
      conditions,
      classes,
      byVar
    };
  }

  // ../core/dist/ir/persistence.js
  var IR_VERSION = 1;
  function toIRRow(ir, raw) {
    return {
      dicecloud_character_id: ir.id,
      character_name: ir.name,
      system_hint: ir.systemHint,
      ir,
      ir_version: IR_VERSION,
      ...raw ? { raw } : {}
    };
  }

  // ../core/dist/ir/sync.js
  async function upsertCharacterIR(raw, target) {
    const ir = normalize(raw);
    if (!ir.id)
      throw new Error("upsertCharacterIR: normalized IR has no character id");
    const row = toIRRow(ir);
    if (target.ownerId)
      row.owner_id = target.ownerId;
    const res = await fetch(`${target.url}/rest/v1/clouds_character_ir?on_conflict=owner_id,dicecloud_character_id`, {
      method: "POST",
      headers: {
        apikey: target.anonKey,
        Authorization: `Bearer ${target.authToken || target.anonKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(row)
    });
    if (!res.ok) {
      throw new Error(`clouds_character_ir upsert failed: ${res.status} ${await res.text()}`);
    }
    return ir;
  }

  // src/lib/dicecloud-sync.js
  var DiceCloudSync = class {
    constructor(ddpClient) {
      this.ddp = ddpClient;
      this.characterId = null;
      this.propertyCache = /* @__PURE__ */ new Map();
      this.previousValues = /* @__PURE__ */ new Map();
      this.enabled = false;
      this.requestQueue = [];
      this.isProcessingQueue = false;
      this.minRequestDelay = 250;
      this.lastRequestTime = 0;
      this.maxRetries = 3;
      this.propertyVariants = {
        "Channel Divinity": ["channelDivinity", "channelDivinityCleric", "channelDivinityPaladin"],
        "Ki Points": ["kiPoints", "ki", "kiPoint"],
        "Sorcery Points": ["sorceryPoints", "sorceryPoint", "sorceryPt"],
        "Bardic Inspiration": ["bardicInspiration", "bardic", "inspiration"],
        "Superiority Dice": ["superiorityDice", "superiority"],
        "Lay on Hands": ["layOnHands", "layOnHandsPool"],
        "Wild Shape": ["wildShape", "wildShapeUses"],
        "Rage": ["rage", "rageUses", "rages"],
        "Action Surge": ["actionSurge", "actionSurgeUses"],
        "Indomitable": ["indomitable", "indomitableUses"],
        "Second Wind": ["secondWind", "secondWindUses"],
        "Sneak Attack": ["sneakAttack", "sneakAttackDice"],
        "Cunning Action": ["cunningAction"],
        "Arcane Recovery": ["arcaneRecovery", "arcaneRecoveryUses"],
        "Song of Rest": ["songOfRest"],
        "Font of Magic": ["fontOfMagic"],
        "Metamagic": ["metamagic"],
        "Warlock Spell Slots": ["warlockSpellSlots", "pactMagicSlots"],
        "Pact Magic": ["pactMagic", "pactMagicSlots"],
        "Divine Sense": ["divineSense", "divineSenseUses"],
        "Divine Smite": ["divineSmite"],
        "Aura of Protection": ["auraOfProtection"],
        "Cleansing Touch": ["cleansingTouch", "cleansingTouchUses"],
        "Harness Divine Power": ["harnessDivinePower"],
        "Wild Companion": ["wildCompanion", "wildCompanionUses"],
        "Natural Recovery": ["naturalRecovery"],
        "Beast Spells": ["beastSpells"],
        "Favored Foe": ["favoredFoe", "favoredFoeUses"],
        "Deft Explorer": ["deftExplorer"],
        "Primal Awareness": ["primalAwareness"],
        "Eldritch Invocations": ["eldritchInvocations"],
        "Pact Boon": ["pactBoon"],
        "Mystic Arcanum": ["mysticArcanum"],
        "Eldritch Master": ["eldritchMaster"],
        "Signature Spells": ["signatureSpells"],
        "Spell Mastery": ["spellMastery"],
        "Heroic Inspiration": ["heroicInspiration", "inspiration"],
        "Temporary Hit Points": ["temporaryHitPoints", "tempHitPoints", "tempHP"],
        "Hit Points": ["hitPoints", "hp", "health"],
        "Death Saves - Success": ["deathSaveSuccesses", "succeededSaves", "deathSaves.successes"],
        "Death Saves - Failure": ["deathSaveFails", "failedSaves", "deathSaves.failures"]
      };
    }
    /**
     * Add a request to the queue
     * @param {Function} requestFn - Async function that makes the DDP call
     * @param {string} description - Description for logging
     * @returns {Promise} - Resolves when request completes
     */
    async queueRequest(requestFn, description = "DDP Request") {
      return new Promise((resolve, reject) => {
        const queueItem = {
          requestFn,
          description,
          resolve,
          reject,
          retries: 0,
          timestamp: Date.now()
        };
        this.requestQueue.push(queueItem);
        console.log(`[DiceCloud Sync] Queued: ${description} (Queue size: ${this.requestQueue.length})`);
        if (!this.isProcessingQueue) {
          this.processQueue();
        }
      });
    }
    /**
     * Process the request queue sequentially
     */
    async processQueue() {
      if (this.isProcessingQueue) {
        return;
      }
      this.isProcessingQueue = true;
      while (this.requestQueue.length > 0) {
        const item = this.requestQueue[0];
        try {
          const timeSinceLastRequest = Date.now() - this.lastRequestTime;
          if (timeSinceLastRequest < this.minRequestDelay) {
            const delayNeeded = this.minRequestDelay - timeSinceLastRequest;
            console.log(`[DiceCloud Sync] Rate limiting: waiting ${delayNeeded}ms before next request`);
            await this.sleep(delayNeeded);
          }
          console.log(`[DiceCloud Sync] Processing: ${item.description} (${this.requestQueue.length} remaining)`);
          this.lastRequestTime = Date.now();
          const result2 = await item.requestFn();
          this.requestQueue.shift();
          item.resolve(result2);
          console.log(`[DiceCloud Sync] Completed: ${item.description}`);
        } catch (error) {
          console.error(`[DiceCloud Sync] Error: ${item.description}`, error);
          const isTooManyRequests = error.message?.includes("too many requests") || error.message?.includes("rate limit") || error.error === "too-many-requests" || error.error === 429;
          if (isTooManyRequests && item.retries < this.maxRetries) {
            item.retries++;
            const backoffDelay = Math.min(1e3 * Math.pow(2, item.retries), 1e4);
            console.warn(`[DiceCloud Sync] Rate limited. Retry ${item.retries}/${this.maxRetries} after ${backoffDelay}ms`);
            await this.sleep(backoffDelay);
          } else {
            this.requestQueue.shift();
            item.reject(error);
            if (isTooManyRequests) {
              console.error(`[DiceCloud Sync] Max retries reached for: ${item.description}`);
            }
          }
        }
      }
      this.isProcessingQueue = false;
      console.log("[DiceCloud Sync] Queue processing complete");
    }
    /**
     * Sleep utility
     * @param {number} ms - Milliseconds to sleep
     */
    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Initialize sync for a character
     * @param {string} characterId - DiceCloud character ID
     */
    async initialize(characterId) {
      this.characterId = characterId;
      this.propertyCache.clear();
      console.log("[DiceCloud Sync] Initializing for character:", characterId);
      console.log("[DiceCloud Sync] DDP client status:", this.ddp.isConnected());
      try {
        if (!this.ddp.isConnected()) {
          console.log("[DiceCloud Sync] Connecting to DDP...");
          await this.ddp.connect();
          console.log("[DiceCloud Sync] DDP connected successfully");
        }
        await this.buildPropertyCache();
        const result2 = await browserAPI.storage.local.get(["autoBackwardsSync"]);
        const autoBackwardsSync = result2.autoBackwardsSync !== false;
        this.enabled = autoBackwardsSync;
        console.log("[DiceCloud Sync] Initialized successfully");
        console.log("[DiceCloud Sync] Auto backwards sync preference:", autoBackwardsSync);
        console.log("[DiceCloud Sync] Sync enabled:", this.enabled);
      } catch (error) {
        console.error("[DiceCloud Sync] Initialization failed:", error);
        throw error;
      }
    }
    /**
     * Map all variant names to a single property ID
     * @param {string} canonicalName - The canonical property name
     * @param {string} foundVariableName - The variable name that was actually found in DiceCloud
     * @param {string} propertyId - The property _id from DiceCloud
     */
    cachePropertyWithVariants(canonicalName, foundVariableName, propertyId) {
      this.propertyCache.set(canonicalName, propertyId);
      const variants = this.propertyVariants[canonicalName];
      if (variants) {
        for (const variant of variants) {
          this.propertyCache.set(variant, propertyId);
        }
        console.log(`[DiceCloud Sync] \u{1F5FA}\uFE0F  Mapped ${canonicalName} (found as "${foundVariableName}") to ${propertyId}`);
        console.log(`[DiceCloud Sync]     All variants cached: ${variants.join(", ")}`);
      } else {
        console.log(`[DiceCloud Sync] Cached property: ${canonicalName} -> ${propertyId}`);
      }
    }
    /**
     * Find a property in the raw API data by checking all possible variant names
     * @param {Array} properties - Array of properties from DiceCloud API
     * @param {string} canonicalName - The canonical property name to search for
     * @param {Object} filter - Optional filter criteria (type, attributeType, etc.)
     * @returns {Object|null} The found property or null
     */
    findPropertyByVariants(properties, canonicalName, filter = {}) {
      const variants = this.propertyVariants[canonicalName];
      if (!variants) {
        return properties.find((p) => {
          if (p.removed || p.inactive)
            return false;
          if (p.name !== canonicalName && p.variableName !== canonicalName)
            return false;
          for (const [key, value] of Object.entries(filter)) {
            if (p[key] !== value)
              return false;
          }
          return true;
        });
      }
      for (const variant of variants) {
        const property = properties.find((p) => {
          if (p.removed || p.inactive)
            return false;
          if (p.variableName !== variant && p.name !== variant)
            return false;
          for (const [key, value] of Object.entries(filter)) {
            if (p[key] !== value)
              return false;
          }
          return true;
        });
        if (property) {
          console.log(`[DiceCloud Sync] \u{1F50D} Found ${canonicalName} using variant "${variant}" (variableName: ${property.variableName})`);
          return property;
        }
      }
      return null;
    }
    /**
     * Build cache of property names to IDs
     */
    async buildPropertyCache() {
      console.log("[DiceCloud Sync] Building property cache...");
      const result2 = await browserAPI.storage.local.get(["activeCharacterId", "characterProfiles"]);
      const { activeCharacterId, characterProfiles } = result2;
      console.log("[DiceCloud Sync] Storage result:", { activeCharacterId, characterProfilesKeys: characterProfiles ? Object.keys(characterProfiles) : null });
      if (activeCharacterId && characterProfiles && characterProfiles[activeCharacterId]) {
        const characterData = characterProfiles[activeCharacterId];
        console.log("[DiceCloud Sync] Building cache from character data:", characterData.name);
        if (!characterData.id) {
          console.warn("[DiceCloud Sync] Character data has no DiceCloud ID, skipping cache build");
          console.warn("[DiceCloud Sync] This is likely the default/placeholder character");
          return;
        }
        const currentValuesFromAPI = {};
        const tokenResult = await browserAPI.storage.local.get(["diceCloudToken"]);
        const { diceCloudToken } = tokenResult;
        if (diceCloudToken && characterData.id) {
          console.log("[DiceCloud Sync] Fetching raw DiceCloud API data for property cache...");
          try {
            const response = await browserAPI.runtime.sendMessage({
              action: "fetchDiceCloudAPI",
              url: `https://dicecloud.com/api/creature/${characterData.id}`,
              token: diceCloudToken
            });
            if (response.success && response.data) {
              const apiData = response.data;
              console.log("[DiceCloud Sync] Received API data for property cache");
              if (apiData.creatureProperties && Array.isArray(apiData.creatureProperties)) {
                console.log(`[DiceCloud Sync] Processing ${apiData.creatureProperties.length} raw properties`);
                const allProperties = {};
                for (const property of apiData.creatureProperties) {
                  if (property._id && property.name) {
                    if (!allProperties[property.name]) {
                      allProperties[property.name] = [];
                    }
                    allProperties[property.name].push(property);
                  }
                }
                const selectBestProperty = (name, properties, criteria = {}) => {
                  if (properties.length === 1)
                    return properties[0];
                  const {
                    requiredType,
                    requiredAttributeType,
                    requiredFields = [],
                    sortBy = null,
                    debug = false
                  } = criteria;
                  if (debug) {
                    console.log(`[DiceCloud Sync] All ${name} properties found:`);
                    properties.forEach((p) => {
                      console.log(`  - ${p.name} (${p.type}): id=${p._id}, value=${p.value}, baseValue=${p.baseValue}, total=${p.total}, damage=${p.damage}, attributeType=${p.attributeType || "none"}`);
                    });
                  }
                  if (requiredType && requiredAttributeType && requiredFields.length > 0) {
                    const exactMatches = properties.filter(
                      (p) => p.type === requiredType && p.attributeType === requiredAttributeType && requiredFields.every((field) => p[field] !== void 0) && !p.removed && !p.inactive
                    );
                    if (exactMatches.length > 0) {
                      return sortBy ? exactMatches.sort(sortBy)[0] : exactMatches[0];
                    }
                  }
                  if (requiredType && requiredAttributeType) {
                    const typeMatches = properties.filter(
                      (p) => p.type === requiredType && p.attributeType === requiredAttributeType && !p.removed && !p.inactive
                    );
                    if (typeMatches.length > 0) {
                      return sortBy ? typeMatches.sort(sortBy)[0] : typeMatches[0];
                    }
                  }
                  if (requiredType) {
                    const typeOnly = properties.filter(
                      (p) => p.type === requiredType && !p.removed && !p.inactive
                    );
                    if (typeOnly.length > 0) {
                      return sortBy ? typeOnly.sort(sortBy)[0] : typeOnly[0];
                    }
                  }
                  if (requiredFields.length > 0) {
                    const withFields = properties.filter(
                      (p) => requiredFields.every((field) => p[field] !== void 0) && !p.removed && !p.inactive
                    );
                    if (withFields.length > 0) {
                      return sortBy ? withFields.sort(sortBy)[0] : withFields[0];
                    }
                  }
                  const active = properties.find((p) => !p.removed && !p.inactive);
                  return active || properties[0];
                };
                for (const [propertyName, properties] of Object.entries(allProperties)) {
                  let selectedProperty = properties[0];
                  if (propertyName === "Hit Points") {
                    selectedProperty = selectBestProperty("Hit Points", properties, {
                      requiredType: "attribute",
                      requiredAttributeType: "healthBar",
                      requiredFields: ["damage"],
                      sortBy: (a, b) => (b.total || 0) - (a.total || 0),
                      debug: true
                    });
                    if (selectedProperty) {
                      this.propertyCache.set("Hit Points", selectedProperty._id);
                      console.log(`[DiceCloud Sync] Selected Hit Points property: ${selectedProperty.name} -> ${selectedProperty._id} (type: ${selectedProperty.type}, attributeType: ${selectedProperty.attributeType || "none"}, value: ${selectedProperty.value}, total: ${selectedProperty.total}, baseValue: ${selectedProperty.baseValue}, damage: ${selectedProperty.damage})`);
                      const currentHP = (selectedProperty.total || 0) - (selectedProperty.damage || 0);
                      currentValuesFromAPI["Hit Points"] = currentHP;
                      console.log(`[DiceCloud Sync] \u{1F4CA} Extracted current HP value: ${currentHP} (total: ${selectedProperty.total}, damage: ${selectedProperty.damage})`);
                    } else {
                      console.log(`[DiceCloud Sync] No suitable Hit Points property found`);
                    }
                    continue;
                  }
                  if (propertyName.includes("Hit Points") && propertyName !== "Hit Points" && !propertyName.includes("Temporary")) {
                    const classHP = properties.find(
                      (p) => p.type !== "skill" && (p.value !== void 0 || p.skillValue !== void 0)
                    );
                    if (classHP) {
                      this.propertyCache.set("Hit Points", classHP._id);
                      console.log(`[DiceCloud Sync] Cached class-specific HP as main Hit Points: ${propertyName} -> ${classHP._id} (type: ${classHP.type})`);
                    }
                    continue;
                  }
                  const spellSlotMatch = propertyName.match(/^(\d+(?:st|nd|rd|th)) Level$/);
                  if (spellSlotMatch) {
                    selectedProperty = selectBestProperty(propertyName, properties, {
                      requiredType: "attribute",
                      requiredAttributeType: "spellSlot",
                      requiredFields: ["value"],
                      debug: properties.length > 1
                    });
                    if (selectedProperty) {
                      this.propertyCache.set(propertyName, selectedProperty._id);
                      const slotLevel = spellSlotMatch[1].replace(/\D/g, "");
                      this.propertyCache.set(`spellSlot${slotLevel}`, selectedProperty._id);
                      console.log(`[DiceCloud Sync] Cached spell slot: ${propertyName} -> ${selectedProperty._id} (attributeType: ${selectedProperty.attributeType})`);
                      const currentSlots = selectedProperty.value || 0;
                      currentValuesFromAPI[`spellSlot${slotLevel}`] = currentSlots;
                      console.log(`[DiceCloud Sync] \u{1F4CA} Extracted current spell slot value for level ${slotLevel}: ${currentSlots}`);
                    }
                    continue;
                  }
                  if (propertyName === "Channel Divinity") {
                    selectedProperty = selectBestProperty("Channel Divinity", properties, {
                      requiredType: "attribute",
                      requiredAttributeType: "resource",
                      requiredFields: ["damage"],
                      debug: properties.length > 1
                    });
                    if (selectedProperty) {
                      this.propertyCache.set("Channel Divinity", selectedProperty._id);
                      console.log(`[DiceCloud Sync] Cached Channel Divinity: ${selectedProperty._id} (attributeType: ${selectedProperty.attributeType})`);
                      const currentCD = selectedProperty.value || 0;
                      currentValuesFromAPI["Channel Divinity"] = currentCD;
                      console.log(`[DiceCloud Sync] \u{1F4CA} Extracted current Channel Divinity value: ${currentCD}`);
                    }
                    continue;
                  }
                  this.propertyCache.set(propertyName, selectedProperty._id);
                  console.log(`[DiceCloud Sync] Cached property: ${propertyName} -> ${selectedProperty._id}`);
                }
                const actionsByName = {};
                apiData.creatureProperties.forEach((p) => {
                  if (p.type === "action" && p.name && p.uses !== void 0 && p.uses !== null && !p.removed && !p.inactive && !this.propertyCache.has(p.name)) {
                    if (!actionsByName[p.name]) {
                      actionsByName[p.name] = [];
                    }
                    actionsByName[p.name].push(p);
                  }
                });
                let actionCount = 0;
                for (const [actionName, actions] of Object.entries(actionsByName)) {
                  const action = selectBestProperty(actionName, actions, {
                    requiredType: "action",
                    requiredFields: ["uses"],
                    debug: actions.length > 1
                  });
                  if (action) {
                    this.propertyCache.set(action.name, action._id);
                    const maxUses = action.uses?.value ?? action.uses;
                    const usedUses = action.usesUsed ?? 0;
                    console.log(`[DiceCloud Sync] Cached action with uses: ${action.name} -> ${action._id} (${usedUses}/${maxUses} used)`);
                    actionCount++;
                  }
                }
                console.log(`[DiceCloud Sync] Found ${actionCount} actions with limited uses`);
                if (allProperties["Temporary Hit Points"]) {
                  const tempHP = selectBestProperty("Temporary Hit Points", allProperties["Temporary Hit Points"], {
                    requiredType: "attribute",
                    requiredAttributeType: "healthBar",
                    requiredFields: ["value"],
                    debug: allProperties["Temporary Hit Points"].length > 1
                  });
                  if (tempHP) {
                    this.propertyCache.set("Temporary Hit Points", tempHP._id);
                    console.log(`[DiceCloud Sync] Cached Temporary Hit Points: ${tempHP._id} (attributeType: ${tempHP.attributeType})`);
                    const currentTempHP = tempHP.value || 0;
                    currentValuesFromAPI["Temporary Hit Points"] = currentTempHP;
                    console.log(`[DiceCloud Sync] \u{1F4CA} Extracted current Temp HP value: ${currentTempHP}`);
                  }
                }
                ["Succeeded Saves", "Failed Saves"].forEach((saveName) => {
                  if (allProperties[saveName]) {
                    const deathSave = selectBestProperty(saveName, allProperties[saveName], {
                      requiredType: "attribute",
                      requiredAttributeType: "spellSlot",
                      debug: allProperties[saveName].length > 1
                    });
                    if (deathSave) {
                      this.propertyCache.set(saveName, deathSave._id);
                      console.log(`[DiceCloud Sync] Cached Death Save: ${saveName} -> ${deathSave._id} (attributeType: ${deathSave.attributeType})`);
                    }
                  }
                });
                ["d6 Hit Dice", "d8 Hit Dice", "d10 Hit Dice", "d12 Hit Dice"].forEach((diceName) => {
                  if (allProperties[diceName]) {
                    const hitDie = selectBestProperty(diceName, allProperties[diceName], {
                      requiredType: "attribute",
                      requiredAttributeType: "hitDice",
                      debug: allProperties[diceName].length > 1
                    });
                    if (hitDie) {
                      this.propertyCache.set(diceName, hitDie._id);
                      console.log(`[DiceCloud Sync] Cached Hit Die: ${diceName} -> ${hitDie._id} (attributeType: ${hitDie.attributeType})`);
                    }
                  }
                });
                if (allProperties["Heroic Inspiration"] || allProperties["Inspiration"]) {
                  const inspirationProps = allProperties["Heroic Inspiration"] || allProperties["Inspiration"];
                  const inspiration = selectBestProperty("Inspiration", inspirationProps, {
                    requiredType: "attribute",
                    requiredAttributeType: "resource",
                    debug: inspirationProps.length > 1
                  });
                  if (inspiration) {
                    this.propertyCache.set("Heroic Inspiration", inspiration._id);
                    this.propertyCache.set("Inspiration", inspiration._id);
                    console.log(`[DiceCloud Sync] Cached Inspiration: ${inspiration._id} (attributeType: ${inspiration.attributeType})`);
                  }
                }
                const classResourceNames = [
                  "Ki Points",
                  "Sorcery Points",
                  "Bardic Inspiration",
                  "Superiority Dice",
                  "Lay on Hands",
                  "Wild Shape",
                  "Rage",
                  "Action Surge",
                  "Indomitable",
                  "Second Wind",
                  "Sneak Attack",
                  "Cunning Action",
                  "Arcane Recovery",
                  "Song of Rest",
                  "Font of Magic",
                  "Metamagic",
                  "Sorcery Point",
                  "Warlock Spell Slots",
                  "Pact Magic",
                  "Eldritch Invocations"
                ];
                let classResourceCount = 0;
                for (const resourceName of classResourceNames) {
                  if (allProperties[resourceName] && !this.propertyCache.has(resourceName)) {
                    const resource = selectBestProperty(resourceName, allProperties[resourceName], {
                      requiredType: "attribute",
                      requiredAttributeType: "resource",
                      requiredFields: ["damage"],
                      debug: allProperties[resourceName].length > 1
                    });
                    if (resource) {
                      this.propertyCache.set(resourceName, resource._id);
                      console.log(`[DiceCloud Sync] Cached class resource: ${resourceName} -> ${resource._id} (attributeType: ${resource.attributeType})`);
                      const currentValue = resource.value || 0;
                      currentValuesFromAPI[resourceName] = currentValue;
                      console.log(`[DiceCloud Sync] \u{1F4CA} Extracted current value for ${resourceName}: ${currentValue}`);
                      classResourceCount++;
                    }
                  }
                }
                console.log(`[DiceCloud Sync] Found ${classResourceCount} class resources`);
                const restorableByName = {};
                apiData.creatureProperties.forEach((p) => {
                  if (p.type === "attribute" && p.name && p.reset && p.reset !== "none" && !p.removed && !p.inactive && !this.propertyCache.has(p.name)) {
                    if (!restorableByName[p.name]) {
                      restorableByName[p.name] = [];
                    }
                    restorableByName[p.name].push(p);
                  }
                });
                let restorableCount = 0;
                for (const [attrName, attrs] of Object.entries(restorableByName)) {
                  const attr = selectBestProperty(attrName, attrs, {
                    requiredType: "attribute",
                    requiredFields: ["reset"],
                    debug: attrs.length > 1
                  });
                  if (attr) {
                    this.propertyCache.set(attr.name, attr._id);
                    console.log(`[DiceCloud Sync] Cached restorable attribute: ${attr.name} (resets on ${attr.reset}) -> ${attr._id}`);
                    restorableCount++;
                  }
                }
                console.log(`[DiceCloud Sync] Found ${restorableCount} additional restorable attributes`);
                const customAttrsByName = {};
                apiData.creatureProperties.forEach((p) => {
                  if (p.type === "attribute" && p.name && !p.removed && !p.inactive && !this.propertyCache.has(p.name) && (p.value !== void 0 || p.baseValue !== void 0)) {
                    if (!customAttrsByName[p.name]) {
                      customAttrsByName[p.name] = [];
                    }
                    customAttrsByName[p.name].push(p);
                  }
                });
                let customAttrCount = 0;
                for (const [attrName, attrs] of Object.entries(customAttrsByName)) {
                  const attr = selectBestProperty(attrName, attrs, {
                    requiredType: "attribute",
                    requiredFields: ["value"],
                    debug: attrs.length > 1
                  });
                  if (attr) {
                    this.propertyCache.set(attr.name, attr._id);
                    console.log(`[DiceCloud Sync] Cached custom attribute: ${attr.name} -> ${attr._id} (value: ${attr.value}, baseValue: ${attr.baseValue})`);
                    const currentValue = attr.value !== void 0 ? attr.value : attr.baseValue || 0;
                    currentValuesFromAPI[attr.name] = currentValue;
                    console.log(`[DiceCloud Sync] \u{1F4CA} Extracted current value for ${attr.name}: ${currentValue}`);
                    customAttrCount++;
                  }
                }
                console.log(`[DiceCloud Sync] Found ${customAttrCount} additional custom attributes to cache`);
                const togglesByName = {};
                apiData.creatureProperties.forEach((p) => {
                  if (p.type === "toggle" && p.name && !p.removed && !p.inactive && !this.propertyCache.has(p.name)) {
                    if (!togglesByName[p.name]) {
                      togglesByName[p.name] = [];
                    }
                    togglesByName[p.name].push(p);
                  }
                });
                let toggleCount = 0;
                for (const [toggleName, toggles] of Object.entries(togglesByName)) {
                  const toggle = selectBestProperty(toggleName, toggles, {
                    requiredType: "toggle",
                    debug: toggles.length > 1
                  });
                  if (toggle) {
                    this.propertyCache.set(toggle.name, toggle._id);
                    console.log(`[DiceCloud Sync] Cached toggle: ${toggle.name} -> ${toggle._id}`);
                    toggleCount++;
                  }
                }
                console.log(`[DiceCloud Sync] Found ${toggleCount} toggles`);
                console.log("[DiceCloud Sync] \u{1F5FA}\uFE0F  Starting comprehensive variant mapping...");
                for (const [canonicalName, variants] of Object.entries(this.propertyVariants)) {
                  let foundProperty = null;
                  let foundVariant = null;
                  for (const variant of variants) {
                    const property = apiData.creatureProperties.find((p) => {
                      if (p.removed || p.inactive)
                        return false;
                      if (p.variableName === variant || p.name === variant) {
                        if (canonicalName === "Channel Divinity" || canonicalName === "Ki Points" || canonicalName === "Sorcery Points" || canonicalName === "Bardic Inspiration") {
                          return p.type === "attribute" && p.attributeType === "resource";
                        }
                        if (canonicalName === "Temporary Hit Points") {
                          return p.type === "attribute" && p.attributeType === "healthBar";
                        }
                        if (canonicalName === "Hit Points") {
                          return p.type === "attribute" && p.attributeType === "healthBar";
                        }
                        return p.type === "attribute" || p.type === "action";
                      }
                      return false;
                    });
                    if (property) {
                      foundProperty = property;
                      foundVariant = variant;
                      break;
                    }
                  }
                  if (foundProperty) {
                    this.cachePropertyWithVariants(canonicalName, foundVariant, foundProperty._id);
                    if (foundProperty.value !== void 0) {
                      currentValuesFromAPI[canonicalName] = foundProperty.value;
                      console.log(`[DiceCloud Sync] \u{1F4CA} Extracted current value for ${canonicalName}: ${foundProperty.value}`);
                    }
                  }
                }
                console.log("[DiceCloud Sync] \u2705 Comprehensive variant mapping complete");
              }
            } else {
              console.warn("[DiceCloud Sync] Failed to fetch API data for property cache:", response.error);
            }
          } catch (error) {
            console.error("[DiceCloud Sync] Error fetching API data for property cache:", error);
          }
        }
        if (characterData.actions && Array.isArray(characterData.actions)) {
          console.log(`[DiceCloud Sync] Processing ${characterData.actions.length} actions`);
          for (const action of characterData.actions) {
            if (action.name) {
              if (!this.propertyCache.has(action.name)) {
                const propertyId = this.findPropertyId(action.name);
                if (propertyId) {
                  this.propertyCache.set(action.name, propertyId);
                  console.log(`[DiceCloud Sync] Cached action: ${action.name} -> ${propertyId}`);
                } else {
                  console.warn(`[DiceCloud Sync] No property ID found for action: ${action.name}`);
                }
              }
            }
          }
        }
        console.log(`[DiceCloud Sync] Property cache built with ${this.propertyCache.size} entries`);
        console.log("[DiceCloud Sync] Available properties:", Array.from(this.propertyCache.keys()));
        console.log("[DiceCloud Sync] Initializing previousValues from current character data...");
        await this.initializePreviousValues(characterData, currentValuesFromAPI);
      } else {
        console.warn("[DiceCloud Sync] No character data available for cache building");
        console.warn("[DiceCloud Sync] activeCharacterId:", activeCharacterId);
        console.warn("[DiceCloud Sync] characterProfiles:", characterProfiles);
      }
    }
    /**
     * Initialize previousValues from character data to avoid syncing everything on first update
     * @param {Object} characterData - Character data object
     * @param {Object} apiValues - Current values extracted from DiceCloud API (optional)
     */
    async initializePreviousValues(characterData, apiValues = {}) {
      console.log("[DiceCloud Sync] Populating previousValues to establish baseline...");
      if (apiValues["Hit Points"] !== void 0) {
        this.previousValues.set("Hit Points", apiValues["Hit Points"]);
        console.log(`[DiceCloud Sync] \u{1F4CA} Initialized Hit Points from API: ${apiValues["Hit Points"]}`);
      } else if (characterData.hp !== void 0) {
        this.previousValues.set("Hit Points", characterData.hp);
      }
      if (apiValues["Temporary Hit Points"] !== void 0) {
        this.previousValues.set("Temporary Hit Points", apiValues["Temporary Hit Points"]);
        console.log(`[DiceCloud Sync] \u{1F4CA} Initialized Temp HP from API: ${apiValues["Temporary Hit Points"]}`);
      } else if (characterData.tempHp !== void 0) {
        this.previousValues.set("Temporary Hit Points", characterData.tempHp);
      }
      if (characterData.maxHp !== void 0) {
        this.previousValues.set("Max Hit Points", characterData.maxHp);
      }
      for (let level = 1; level <= 9; level++) {
        const cacheKey = `spellSlot${level}`;
        if (characterData.spellSlots) {
          const currentKey = `level${level}SpellSlots`;
          const maxKey = `level${level}SpellSlotsMax`;
          if (characterData.spellSlots[currentKey] !== void 0 && characterData.spellSlots[maxKey] !== void 0) {
            if (characterData.spellSlots[maxKey] > 0) {
              this.previousValues.set(cacheKey, characterData.spellSlots[currentKey]);
              console.log(`[DiceCloud Sync] \u{1F4CA} Initialized spell slot level ${level} from extension: ${characterData.spellSlots[currentKey]}`);
            }
          }
        } else if (apiValues[cacheKey] !== void 0) {
          this.previousValues.set(cacheKey, apiValues[cacheKey]);
          console.log(`[DiceCloud Sync] \u{1F4CA} Initialized spell slot level ${level} from API (fallback): ${apiValues[cacheKey]}`);
        }
      }
      if (apiValues["Channel Divinity"] !== void 0) {
        this.previousValues.set("Channel Divinity", apiValues["Channel Divinity"]);
        console.log(`[DiceCloud Sync] \u{1F4CA} Initialized Channel Divinity from API: ${apiValues["Channel Divinity"]}`);
      } else if (characterData.channelDivinity && characterData.channelDivinity.current !== void 0) {
        this.previousValues.set("Channel Divinity", characterData.channelDivinity.current);
      }
      if (characterData.resources && Array.isArray(characterData.resources)) {
        for (const resource of characterData.resources) {
          if (resource.name && resource.current !== void 0) {
            this.previousValues.set(resource.name, resource.current);
          }
        }
      }
      if (characterData.actions && Array.isArray(characterData.actions)) {
        for (const action of characterData.actions) {
          if (action.name && action.uses && action.usesUsed !== void 0) {
            const cacheKey = `action_${action.name}`;
            this.previousValues.set(cacheKey, action.usesUsed);
          }
        }
      }
      if (characterData.deathSaves) {
        if (characterData.deathSaves.successes !== void 0) {
          this.previousValues.set("Succeeded Saves", characterData.deathSaves.successes);
        }
        if (characterData.deathSaves.failures !== void 0) {
          this.previousValues.set("Failed Saves", characterData.deathSaves.failures);
        }
      }
      if (characterData.inspiration !== void 0) {
        this.previousValues.set("Inspiration", characterData.inspiration);
      }
      if (apiValues && Object.keys(apiValues).length > 0) {
        for (const [key, value] of Object.entries(apiValues)) {
          if (!this.previousValues.has(key)) {
            this.previousValues.set(key, value);
            console.log(`[DiceCloud Sync] \u{1F4CA} Initialized ${key} from API: ${value}`);
          }
        }
      }
      console.log(`[DiceCloud Sync] Initialized ${this.previousValues.size} previous values`);
    }
    /**
     * Increment action uses (e.g., used 1 of 3 uses)
     * @param {string} actionName - Name of the action
     * @param {number} amount - Amount to increment (usually 1)
     */
    async incrementActionUses(actionName, amount = 1) {
      if (!this.enabled) {
        console.warn("[DiceCloud Sync] Sync not enabled");
        return;
      }
      const propertyId = this.findPropertyId(actionName);
      if (!propertyId) {
        console.warn(`[DiceCloud Sync] Property not found: ${actionName}`);
        return;
      }
      return this.queueRequest(
        async () => {
          console.log(`[DiceCloud Sync] Incrementing uses for ${actionName} (${propertyId}) by ${amount}`);
          const result2 = await this.ddp.call("creatureProperties.update", {
            _id: propertyId,
            path: ["usesUsed"],
            value: amount
          });
          console.log("[DiceCloud Sync] \u23F3 Increment request sent:", result2);
          return result2;
        },
        `Increment ${actionName} uses`
      );
    }
    /**
     * Set action uses to a specific value
     * @param {string} actionName - Name of the action
     * @param {number} value - New value for usesUsed
     */
    async setActionUses(actionName, value) {
      if (!this.enabled) {
        console.warn("[DiceCloud Sync] Sync not enabled");
        return;
      }
      const propertyId = this.findPropertyId(actionName);
      if (!propertyId) {
        console.warn(`[DiceCloud Sync] Property not found: ${actionName}`);
        return;
      }
      return this.queueRequest(
        async () => {
          console.log(`[DiceCloud Sync] Setting uses for ${actionName} (${propertyId}) to ${value}`);
          const result2 = await this.ddp.call("creatureProperties.update", {
            _id: propertyId,
            path: ["usesUsed"],
            value
          });
          console.log("[DiceCloud Sync] \u23F3 Set uses request sent:", result2);
          return result2;
        },
        `Set ${actionName} uses to ${value}`
      );
    }
    /**
     * Update attribute value (HP, Ki Points, Sorcery Points, etc.)
     * @param {string} attributeName - Name of the attribute
     * @param {number} value - New value
     */
    async updateAttributeValue(attributeName, value) {
      if (!this.enabled) {
        console.warn("[DiceCloud Sync] Sync not enabled");
        return;
      }
      const propertyId = this.findPropertyId(attributeName);
      if (!propertyId) {
        console.warn(`[DiceCloud Sync] Property not found: ${attributeName}`);
        return;
      }
      console.log(`[DiceCloud Sync] Updating attribute ${attributeName} (${propertyId}) to ${value}`);
      const updatePayload = {
        _id: propertyId,
        path: ["value"],
        // Default, will be updated based on property type
        value
      };
      try {
        const tokenResult = await browserAPI.storage.local.get(["diceCloudToken"]);
        const { diceCloudToken } = tokenResult;
        if (diceCloudToken) {
          const characterId = this.characterId;
          const currentResponse = await browserAPI.runtime.sendMessage({
            action: "fetchDiceCloudAPI",
            url: `https://dicecloud.com/api/creature/${characterId}`,
            token: diceCloudToken
          });
          if (currentResponse.success && currentResponse.data) {
            const property = currentResponse.data.creatureProperties.find((p) => p._id === propertyId);
            if (property) {
              console.log("[DiceCloud Sync] Property before update:", {
                id: property._id,
                name: property.name,
                type: property.type,
                attributeType: property.attributeType,
                value: property.value,
                baseValue: property.baseValue,
                total: property.total,
                damage: property.damage,
                skillValue: property.skillValue,
                dirty: property.dirty
              });
              let fieldName = "value";
              let updateValue = value;
              let useHealthBarMethod = false;
              if (property.type === "skill") {
                fieldName = "skillValue";
              } else if (property.type === "effect") {
                fieldName = property.calculation ? "calculation" : "value";
              } else if (property.type === "attribute" && property.attributeType === "healthBar") {
                console.log(`[DiceCloud Sync] HealthBar update: currentHP=${property.value}, newCurrentHP=${value}, total=${property.total}, currentDamage=${property.damage}`);
                useHealthBarMethod = true;
                updateValue = value;
              } else if (property.type === "attribute") {
                fieldName = "value";
              }
              console.log(`[DiceCloud Sync] Using field name: ${fieldName} for property type: ${property.type}, attributeType: ${property.attributeType || "none"}`);
              console.log(`[DiceCloud Sync] Use healthBar method: ${useHealthBarMethod}`);
              if (useHealthBarMethod) {
                updatePayload.operation = "set";
                updatePayload.value = updateValue;
                delete updatePayload.path;
              } else {
                updatePayload.path = [fieldName];
                updatePayload.value = updateValue;
              }
            }
          }
        } else {
          console.warn("[DiceCloud Sync] No DiceCloud token available for verification");
        }
      } catch (error) {
        console.error("[DiceCloud Sync] Failed to get current property value:", error);
      }
      let methodName = "creatureProperties.update";
      if (updatePayload.operation === "set" && !updatePayload.path) {
        methodName = "creatureProperties.damage";
      }
      console.log(`[DiceCloud Sync] Using DDP method: ${methodName}`);
      console.log("[DiceCloud Sync] DDP update payload:", JSON.stringify(updatePayload, null, 2));
      return this.queueRequest(
        async () => {
          const result2 = await this.ddp.call(methodName, updatePayload);
          console.log(`[DiceCloud Sync] \u23F3 Update request sent using ${methodName}:`, result2);
          console.log("[DiceCloud Sync] Checking if update was applied...");
          setTimeout(async () => {
            try {
              const tokenResult = await browserAPI.storage.local.get(["diceCloudToken"]);
              const { diceCloudToken } = tokenResult;
              if (diceCloudToken) {
                console.log("[DiceCloud Sync] Verifying update for property:", propertyId);
                console.log("[DiceCloud Sync] Character ID available:", this.characterId);
                const characterId = this.characterId;
                if (!characterId) {
                  console.error("[DiceCloud Sync] No character ID available for verification");
                  return;
                }
                const verifyResponse = await browserAPI.runtime.sendMessage({
                  action: "fetchDiceCloudAPI",
                  url: `https://dicecloud.com/api/creature/${characterId}`,
                  token: diceCloudToken
                });
                console.log("[DiceCloud Sync] Verification API response:", verifyResponse);
                if (verifyResponse.success && verifyResponse.data) {
                  console.log("[DiceCloud Sync] Verification API data received, looking for property:", propertyId);
                  console.log("[DiceCloud Sync] Total properties in response:", verifyResponse.data.creatureProperties?.length);
                  const property = verifyResponse.data.creatureProperties.find((p) => p._id === propertyId);
                  if (property) {
                    console.log("[DiceCloud Sync] Property after update:", {
                      id: property._id,
                      name: property.name,
                      type: property.type,
                      attributeType: property.attributeType,
                      value: property.value,
                      total: property.total,
                      baseValue: property.baseValue,
                      damage: property.damage,
                      dirty: property.dirty,
                      lastUpdated: property.lastUpdated
                    });
                    if (property.value === value) {
                      console.log("[DiceCloud Sync] \u2705 SUCCESS: Value updated correctly!");
                    } else {
                      console.warn("[DiceCloud Sync] \u274C ISSUE: Value did not change. Expected:", value, "Actual:", property.value);
                      if (property.total && property.damage !== void 0) {
                        const calculatedValue = property.total - property.damage;
                        console.log(`[DiceCloud Sync] Calculated value: ${property.total} - ${property.damage} = ${calculatedValue}`);
                      }
                    }
                  } else {
                    console.warn("[DiceCloud Sync] Property not found in character data");
                    console.log(
                      "[DiceCloud Sync] Available HP properties:",
                      verifyResponse.data.creatureProperties.filter((p) => p.name && p.name.toLowerCase().includes("hit points")).map((p) => ({ id: p._id, name: p.name, value: p.value }))
                    );
                  }
                } else {
                  console.error("[DiceCloud Sync] Failed to verify update:", verifyResponse.error);
                }
              } else {
                console.warn("[DiceCloud Sync] No DiceCloud token available for verification");
              }
            } catch (error) {
              console.error("[DiceCloud Sync] Failed to verify update:", error);
            }
          }, 1e3);
          return result2;
        },
        `Update ${attributeName} to ${value}`
      );
    }
    /**
     * Update spell slot current value
     * @param {number} level - Spell level (1-9)
     * @param {number} slotsRemaining - Number of slots remaining
     */
    async updateSpellSlot(level, slotsRemaining) {
      if (!this.enabled) {
        console.warn("[DiceCloud Sync] Sync not enabled");
        return;
      }
      try {
        const slotKey = `spellSlot${level}`;
        const slotName = `${level}${this.getOrdinalSuffix(level)} Level`;
        let propertyId = this.findPropertyId(slotKey);
        if (!propertyId) {
          propertyId = this.findPropertyId(slotName);
        }
        if (!propertyId) {
          console.warn(`[DiceCloud Sync] \u274C Spell slot level ${level} not found in property cache`);
          console.warn(`[DiceCloud Sync] Tried keys: "${slotKey}", "${slotName}"`);
          const spellSlotProps = Array.from(this.propertyCache.keys()).filter((name) => name.toLowerCase().includes("level") || name.toLowerCase().includes("spell"));
          console.warn(`[DiceCloud Sync] Cached spell-related properties:`, spellSlotProps);
          return;
        }
        console.log(`[DiceCloud Sync] Updating spell slot level ${level} to ${slotsRemaining} remaining`);
        const debugTokenResult = await browserAPI.storage.local.get(["diceCloudToken"]);
        if (debugTokenResult.diceCloudToken && this.characterId) {
          const debugResponse = await browserAPI.runtime.sendMessage({
            action: "fetchDiceCloudAPI",
            url: `https://dicecloud.com/api/creature/${this.characterId}`,
            token: debugTokenResult.diceCloudToken
          });
          if (debugResponse.success && debugResponse.data) {
            const spellSlotProp = debugResponse.data.creatureProperties.find((p) => p._id === propertyId);
            if (spellSlotProp) {
              console.log(`[DiceCloud Sync] \u{1F50D} Spell slot property structure:
` + JSON.stringify(spellSlotProp, null, 2));
            }
          }
        }
        const result2 = await this.queueRequest(
          () => this.ddp.call("creatureProperties.update", {
            _id: propertyId,
            path: ["value"],
            value: slotsRemaining
          }),
          `Update spell slot level ${level} to ${slotsRemaining}`
        );
        console.log(`[DiceCloud Sync] \u23F3 Spell slot level ${level} update request sent:`, result2);
        return result2;
      } catch (error) {
        console.error(`[DiceCloud Sync] \u274C Failed to update spell slot level ${level}:`, error);
        throw error;
      }
    }
    /**
     * Fetch character data from DiceCloud API
     * @param {string} characterId - The character ID
     * @returns {Promise<object>} The API response data
     */
    async fetchDiceCloudData(characterId) {
      const tokenResult = await browserAPI.storage.local.get(["diceCloudToken"]);
      if (!tokenResult.diceCloudToken) {
        throw new Error("No DiceCloud token found");
      }
      const response = await browserAPI.runtime.sendMessage({
        action: "fetchDiceCloudAPI",
        url: `https://dicecloud.com/api/creature/${characterId}`,
        token: tokenResult.diceCloudToken
      });
      if (!response.success) {
        throw new Error("API request failed");
      }
      return response.data;
    }
    /**
     * Update Channel Divinity uses
     * @param {number} usesRemaining - Number of uses remaining
     */
    async updateChannelDivinity(usesRemaining) {
      if (!this.enabled) {
        console.warn("[DiceCloud Sync] Sync not enabled");
        return;
      }
      try {
        const propertyId = this.findPropertyId("Channel Divinity");
        if (!propertyId) {
          console.warn("[DiceCloud Sync] Channel Divinity not found");
          return;
        }
        console.log(`[DiceCloud Sync] Updating Channel Divinity to ${usesRemaining} uses remaining`);
        const apiData = await this.fetchDiceCloudData(this.characterId);
        const property = apiData?.creatureProperties?.find((p) => p._id === propertyId);
        if (!property) {
          console.error("[DiceCloud Sync] Could not find Channel Divinity property in API data");
          return;
        }
        const total = property.total || property.baseValue?.value || 3;
        console.log(`[DiceCloud Sync] Resource calculation: total=${total}, usesRemaining=${usesRemaining}, damage=${property.damage || 0}`);
        console.log(`[DiceCloud Sync] Channel Divinity before update:`, {
          value: property.value,
          damage: property.damage,
          total: property.total
        });
        const result2 = await this.queueRequest(
          () => this.ddp.call("creatureProperties.damage", {
            _id: propertyId,
            value: usesRemaining,
            operation: "set"
          }),
          `Update Channel Divinity to ${usesRemaining}`
        );
        console.log("[DiceCloud Sync] \u23F3 Channel Divinity update request sent:", result2);
        if (this.characterId) {
          console.log("[DiceCloud Sync] Verifying Channel Divinity update...");
          try {
            const verifyData = await this.fetchDiceCloudData(this.characterId);
            if (verifyData && verifyData.creatureProperties) {
              const verifiedProperty = verifyData.creatureProperties.find((p) => p._id === propertyId);
              if (verifiedProperty) {
                const actualUsesRemaining = (verifiedProperty.total || total) - (verifiedProperty.damage || 0);
                console.log(`[DiceCloud Sync] Channel Divinity after update:`, {
                  value: verifiedProperty.value,
                  damage: verifiedProperty.damage,
                  total: verifiedProperty.total,
                  calculatedUsesRemaining: actualUsesRemaining
                });
                if (actualUsesRemaining === usesRemaining || verifiedProperty.value === usesRemaining) {
                  console.log("[DiceCloud Sync] \u2705 SUCCESS: Channel Divinity updated correctly!");
                } else {
                  console.warn(`[DiceCloud Sync] \u26A0\uFE0F WARNING: Channel Divinity value mismatch! Expected ${usesRemaining}, got ${actualUsesRemaining}`);
                }
              }
            }
          } catch (verifyError) {
            console.warn("[DiceCloud Sync] Could not verify Channel Divinity update:", verifyError);
          }
        }
        return result2;
      } catch (error) {
        console.error("[DiceCloud Sync] Failed to update Channel Divinity:", error);
        throw error;
      }
    }
    /**
     * Update any generic resource by name
     * @param {string} resourceName - Name of the resource (Ki Points, Sorcery Points, etc.)
     * @param {number} value - New value
     */
    async updateResource(resourceName, value) {
      if (!this.enabled) {
        console.warn("[DiceCloud Sync] Sync not enabled");
        return;
      }
      try {
        const propertyId = this.findPropertyId(resourceName);
        if (!propertyId) {
          console.warn(`[DiceCloud Sync] \u274C Resource "${resourceName}" not found in property cache`);
          console.warn(`[DiceCloud Sync] Available cached properties:`, Array.from(this.propertyCache.keys()).sort());
          const similarNames = Array.from(this.propertyCache.keys()).filter((name) => name.toLowerCase().includes(resourceName.toLowerCase()) || resourceName.toLowerCase().includes(name.toLowerCase())).slice(0, 5);
          if (similarNames.length > 0) {
            console.warn(`[DiceCloud Sync] \u{1F4A1} Did you mean one of these? ${similarNames.join(", ")}`);
          }
          return;
        }
        console.log(`[DiceCloud Sync] Updating ${resourceName} to ${value}`);
        const result2 = await this.queueRequest(
          () => this.ddp.call("creatureProperties.update", {
            _id: propertyId,
            path: ["value"],
            value
          }),
          `Update ${resourceName} to ${value}`
        );
        console.log(`[DiceCloud Sync] \u23F3 ${resourceName} update request sent:`, result2);
        return result2;
      } catch (error) {
        console.error(`[DiceCloud Sync] \u274C Failed to update ${resourceName}:`, error);
        throw error;
      }
    }
    /**
     * Update Temporary Hit Points
     * @param {number} tempHP - Temporary HP value
     */
    async updateTemporaryHP(tempHP) {
      return this.updateResource("Temporary Hit Points", tempHP);
    }
    /**
     * Update Death Saves
     * @param {number} succeeded - Number of succeeded death saves
     * @param {number} failed - Number of failed death saves
     */
    async updateDeathSaves(succeeded, failed) {
      const results = [];
      if (succeeded !== void 0) {
        results.push(await this.updateResource("Succeeded Saves", succeeded));
      }
      if (failed !== void 0) {
        results.push(await this.updateResource("Failed Saves", failed));
      }
      return results;
    }
    /**
     * Update Hit Dice remaining
     * @param {string} dieType - Die type ('d6', 'd8', 'd10', 'd12')
     * @param {number} remaining - Number of hit dice remaining
     */
    async updateHitDice(dieType, remaining) {
      const resourceName = `${dieType} Hit Dice`;
      return this.updateResource(resourceName, remaining);
    }
    /**
     * Update Inspiration/Heroic Inspiration
     * @param {number} value - Inspiration value (typically 0 or 1)
     */
    async updateInspiration(value) {
      return this.updateResource("Heroic Inspiration", value);
    }
    /**
     * Update toggle state (conditions, active features, etc.)
     * @param {string} toggleName - Name of the toggle
     * @param {boolean} enabled - Whether the toggle is enabled
     */
    async updateToggle(toggleName, enabled) {
      if (!this.enabled) {
        console.warn("[DiceCloud Sync] Sync not enabled");
        return;
      }
      try {
        const propertyId = this.findPropertyId(toggleName);
        if (!propertyId) {
          console.warn(`[DiceCloud Sync] Toggle "${toggleName}" not found`);
          return;
        }
        console.log(`[DiceCloud Sync] Setting toggle ${toggleName} to ${enabled ? "enabled" : "disabled"}`);
        const result2 = await this.queueRequest(
          () => this.ddp.call("creatureProperties.update", {
            _id: propertyId,
            path: ["enabled"],
            value: enabled
          }),
          `Update toggle ${toggleName} to ${enabled ? "enabled" : "disabled"}`
        );
        console.log(`[DiceCloud Sync] \u23F3 Toggle ${toggleName} update request sent:`, result2);
        return result2;
      } catch (error) {
        console.error(`[DiceCloud Sync] Failed to update toggle ${toggleName}:`, error);
        throw error;
      }
    }
    /**
     * Helper to get ordinal suffix (1st, 2nd, 3rd, etc.)
     */
    getOrdinalSuffix(num) {
      const j = num % 10;
      const k = num % 100;
      if (j === 1 && k !== 11)
        return "st";
      if (j === 2 && k !== 12)
        return "nd";
      if (j === 3 && k !== 13)
        return "rd";
      return "th";
    }
    findPropertyId(attributeName) {
      const propertyId = this.propertyCache.get(attributeName);
      if (propertyId) {
        console.log(`[DiceCloud Sync] \u2705 Found property ID for "${attributeName}": ${propertyId}`);
        return propertyId;
      }
      for (const [canonicalName, variants] of Object.entries(this.propertyVariants)) {
        if (variants.includes(attributeName) || canonicalName === attributeName) {
          const canonicalId = this.propertyCache.get(canonicalName);
          if (canonicalId) {
            console.log(`[DiceCloud Sync] \u{1F50D} Found "${attributeName}" via canonical name "${canonicalName}": ${canonicalId}`);
            this.propertyCache.set(attributeName, canonicalId);
            return canonicalId;
          }
          for (const variant of variants) {
            const variantId = this.propertyCache.get(variant);
            if (variantId) {
              console.log(`[DiceCloud Sync] \u{1F50D} Found "${attributeName}" via variant "${variant}": ${variantId}`);
              this.propertyCache.set(attributeName, variantId);
              return variantId;
            }
          }
        }
      }
      if (attributeName === "Hit Points" || attributeName === "hitPoints" || attributeName === "hp") {
        console.log("[DiceCloud Sync] Looking for Hit Points alternatives...");
        const hpRelatedProps = Array.from(this.propertyCache.keys()).filter(
          (name) => name.toLowerCase().includes("hit points") || name.toLowerCase().includes("hp") || name.toLowerCase().includes("health")
        );
        console.log("[DiceCloud Sync] HP-related properties found:", hpRelatedProps);
        const classSpecificHP = hpRelatedProps.find((name) => name !== "Hit Points" && name.includes("Hit Points"));
        if (classSpecificHP) {
          const classSpecificId = this.propertyCache.get(classSpecificHP);
          console.log(`[DiceCloud Sync] Using class-specific HP: ${classSpecificHP} -> ${classSpecificId}`);
          return classSpecificId;
        }
      }
      if (attributeName === "Channel Divinity" || attributeName === "channelDivinity" || attributeName === "channelDivinityCleric" || attributeName === "channelDivinityPaladin") {
        console.log("[DiceCloud Sync] Looking for Channel Divinity alternatives...");
        const cdRelatedProps = Array.from(this.propertyCache.keys()).filter(
          (name) => name.toLowerCase().includes("channel divinity") || name.toLowerCase().includes("channeldivinity")
        );
        console.log("[DiceCloud Sync] Channel Divinity-related properties found:", cdRelatedProps);
        const classSpecificCD = cdRelatedProps.find(
          (name) => name !== "Channel Divinity" && (name.includes("Channel Divinity") || name.includes("channelDivinity"))
        );
        if (classSpecificCD) {
          const classSpecificId = this.propertyCache.get(classSpecificCD);
          console.log(`[DiceCloud Sync] Using class-specific Channel Divinity: ${classSpecificCD} -> ${classSpecificId}`);
          return classSpecificId;
        }
        if (cdRelatedProps.length > 0) {
          const anyCD = cdRelatedProps[0];
          const anyCDId = this.propertyCache.get(anyCD);
          console.log(`[DiceCloud Sync] Using Channel Divinity variant: ${anyCD} -> ${anyCDId}`);
          return anyCDId;
        }
      }
      console.warn(`[DiceCloud Sync] \u274C Property ID not found for: "${attributeName}"`);
      console.warn(`[DiceCloud Sync] Available properties (showing first 20):`, Array.from(this.propertyCache.keys()).slice(0, 20));
      const potentialMatches = Array.from(this.propertyCache.keys()).filter(
        (name) => name.toLowerCase().includes(attributeName.toLowerCase()) || attributeName.toLowerCase().includes(name.toLowerCase())
      );
      if (potentialMatches.length > 0) {
        console.warn(`[DiceCloud Sync] \u{1F4A1} Potential matches:`, potentialMatches);
      }
      return null;
    }
    setupRoll20EventListeners() {
      console.log("[DiceCloud Sync] Setting up Roll20 event listeners...");
      window.addEventListener("message", (event) => {
        if (event.data.type === "characterDataUpdate") {
          console.log("[SYNC DEBUG] Received characterDataUpdate message");
          console.log("[SYNC DEBUG] Full event.data:", event.data);
          console.log("[SYNC DEBUG] event.data.characterData:", event.data.characterData);
          console.log("[SYNC DEBUG] channelDivinity in message:", event.data.characterData?.channelDivinity);
          console.log("[SYNC DEBUG] resources in message:", event.data.characterData?.resources);
          this.handleCharacterDataUpdate(event.data.characterData);
        }
      });
      window.addEventListener("message", (event) => {
        if (event.data.type === "actionUsageUpdate") {
          this.handleActionUsageUpdate(event.data.actionName, event.data.usesUsed);
        }
      });
      window.addEventListener("message", (event) => {
        if (event.data.type === "attributeUpdate") {
          this.handleAttributeUpdate(event.data.attributeName, event.data.value);
        }
      });
      console.log("[DiceCloud Sync] Roll20 event listeners set up");
    }
    /**
     * Handle character data updates from Roll20
     * @param {Object} characterData - Updated character data
     */
    async handleCharacterDataUpdate(characterData) {
      if (!this.enabled) {
        console.warn("[DiceCloud Sync] Sync not enabled, ignoring update");
        return;
      }
      console.log("[DiceCloud Sync] ========== HANDLING CHARACTER DATA UPDATE ==========");
      console.log("[DiceCloud Sync] Character:", characterData.name);
      console.log("[DiceCloud Sync] Received data keys:", Object.keys(characterData));
      console.log("[DiceCloud Sync] Resources:", characterData.resources);
      console.log("[DiceCloud Sync] Channel Divinity:", characterData.channelDivinity);
      console.log("[DiceCloud Sync] Death Saves:", characterData.deathSaves);
      console.log("[DiceCloud Sync] Inspiration:", characterData.inspiration);
      console.log("[DiceCloud Sync] Actions:", characterData.actions);
      console.log("[DiceCloud Sync] Property Cache size:", this.propertyCache.size);
      console.log("[DiceCloud Sync] Property Cache keys:", Array.from(this.propertyCache.keys()));
      console.log("[DiceCloud Sync] ========================================");
      if (this.previousValues.size === 0) {
        console.log("[DiceCloud Sync] \u{1F527} previousValues is empty, initializing from first update (no sync)");
        await this.initializePreviousValues(characterData);
        return;
      }
      const hasChanged = (key, newValue) => {
        const oldValue = this.previousValues.get(key);
        if (oldValue === void 0) {
          console.log(`[DiceCloud Sync] \u{1F4E5} Initializing ${key}: ${newValue} (no sync)`);
          this.previousValues.set(key, newValue);
          return false;
        }
        const changed = oldValue !== newValue;
        if (changed) {
          console.log(`[DiceCloud Sync] \u270F\uFE0F Value changed for ${key}: ${oldValue} -> ${newValue} (will sync)`);
          this.previousValues.set(key, newValue);
        }
        return changed;
      };
      if (characterData.hp !== void 0 && hasChanged("Hit Points", characterData.hp)) {
        await this.updateAttributeValue("Hit Points", characterData.hp);
      }
      if (characterData.tempHp !== void 0 && hasChanged("Temporary Hit Points", characterData.tempHp)) {
        await this.updateAttributeValue("Temporary Hit Points", characterData.tempHp);
      }
      if (characterData.maxHp !== void 0 && hasChanged("Max Hit Points", characterData.maxHp)) {
        await this.updateAttributeValue("Max Hit Points", characterData.maxHp);
      }
      if (characterData.spellSlots) {
        for (let level = 1; level <= 9; level++) {
          const currentKey = `level${level}SpellSlots`;
          const maxKey = `level${level}SpellSlotsMax`;
          if (characterData.spellSlots[currentKey] !== void 0 && characterData.spellSlots[maxKey] !== void 0) {
            if (characterData.spellSlots[maxKey] > 0) {
              const cacheKey = `spellSlot${level}`;
              const currentValue = characterData.spellSlots[currentKey];
              const previousValue = this.previousValues.get(cacheKey);
              console.log(`[SYNC DEBUG] Spell Slot Level ${level} - previous: ${previousValue}, current: ${currentValue}`);
              if (hasChanged(cacheKey, currentValue)) {
                console.log(`[DiceCloud Sync] \u2705 Syncing spell slot level ${level}: ${currentValue}/${characterData.spellSlots[maxKey]}`);
                await this.updateSpellSlot(level, currentValue);
              } else {
                console.log(`[SYNC DEBUG] \u23ED\uFE0F Spell slot level ${level} unchanged (${currentValue}), skipping sync`);
              }
            }
          }
        }
      }
      console.log("[SYNC DEBUG] characterData.channelDivinity:", characterData.channelDivinity);
      console.log("[SYNC DEBUG] characterData.resources:", characterData.resources);
      if (characterData.channelDivinity && characterData.channelDivinity.current !== void 0) {
        const currentValue = characterData.channelDivinity.current;
        const previousValue = this.previousValues.get("Channel Divinity");
        console.log(`[SYNC DEBUG] Channel Divinity - previous: ${previousValue}, current: ${currentValue}`);
        if (hasChanged("Channel Divinity", currentValue)) {
          console.log(`[DiceCloud Sync] \u2705 Syncing Channel Divinity: ${currentValue}/${characterData.channelDivinity.max}`);
          await this.updateChannelDivinity(currentValue);
        } else {
          console.log(`[SYNC DEBUG] \u23ED\uFE0F Channel Divinity unchanged (${currentValue}), skipping sync`);
        }
      } else {
        console.log("[SYNC DEBUG] Channel Divinity check failed - object is null or current is undefined");
      }
      console.log("[SYNC DEBUG] Checking resources for sync...");
      if (characterData.resources && Array.isArray(characterData.resources)) {
        console.log(`[SYNC DEBUG] Found ${characterData.resources.length} resources in characterData`);
        for (const resource of characterData.resources) {
          console.log(`[SYNC DEBUG] Resource: ${resource.name} - current: ${resource.current}, max: ${resource.max}`);
          if (resource.name && resource.current !== void 0) {
            const propertyId = this.findPropertyId(resource.name);
            console.log(`[SYNC DEBUG] Property ID for ${resource.name}: ${propertyId || "NOT FOUND"}`);
            if (hasChanged(resource.name, resource.current)) {
              console.log(`[DiceCloud Sync] \u2705 Syncing resource ${resource.name}: ${resource.current}/${resource.max}`);
              await this.updateResource(resource.name, resource.current);
            } else {
              console.log(`[SYNC DEBUG] \u23ED\uFE0F Resource ${resource.name} unchanged, skipping sync`);
            }
          } else {
            console.log(`[SYNC DEBUG] \u274C Resource ${resource.name} missing name or current value`);
          }
        }
      } else {
        console.log("[SYNC DEBUG] No resources array in characterData");
      }
      console.log("[SYNC DEBUG] Checking death saves for sync...");
      if (characterData.deathSaves) {
        console.log(`[SYNC DEBUG] Death saves object:`, characterData.deathSaves);
        if (characterData.deathSaves.successes !== void 0) {
          const propertyId = this.findPropertyId("Succeeded Saves");
          console.log(`[SYNC DEBUG] Property ID for Succeeded Saves: ${propertyId || "NOT FOUND"}`);
          if (hasChanged("Succeeded Saves", characterData.deathSaves.successes)) {
            console.log(`[DiceCloud Sync] \u2705 Syncing Succeeded Saves: ${characterData.deathSaves.successes}`);
            await this.updateDeathSaves(characterData.deathSaves.successes, void 0);
          } else {
            console.log(`[SYNC DEBUG] \u23ED\uFE0F Succeeded Saves unchanged, skipping sync`);
          }
        }
        if (characterData.deathSaves.failures !== void 0) {
          const propertyId = this.findPropertyId("Failed Saves");
          console.log(`[SYNC DEBUG] Property ID for Failed Saves: ${propertyId || "NOT FOUND"}`);
          if (hasChanged("Failed Saves", characterData.deathSaves.failures)) {
            console.log(`[DiceCloud Sync] \u2705 Syncing Failed Saves: ${characterData.deathSaves.failures}`);
            await this.updateDeathSaves(void 0, characterData.deathSaves.failures);
          } else {
            console.log(`[SYNC DEBUG] \u23ED\uFE0F Failed Saves unchanged, skipping sync`);
          }
        }
      } else {
        console.log("[SYNC DEBUG] No deathSaves object in characterData");
      }
      console.log("[SYNC DEBUG] Checking inspiration for sync...");
      if (characterData.inspiration !== void 0) {
        const propertyId = this.findPropertyId("Inspiration");
        console.log(`[SYNC DEBUG] Inspiration value: ${characterData.inspiration}, Property ID: ${propertyId || "NOT FOUND"}`);
        if (hasChanged("Inspiration", characterData.inspiration)) {
          console.log(`[DiceCloud Sync] \u2705 Syncing Inspiration: ${characterData.inspiration}`);
          await this.updateInspiration(characterData.inspiration);
        } else {
          console.log(`[SYNC DEBUG] \u23ED\uFE0F Inspiration unchanged, skipping sync`);
        }
      } else {
        console.log("[SYNC DEBUG] No inspiration value in characterData");
      }
      console.log("[SYNC DEBUG] Checking actions for sync...");
      if (characterData.actions && Array.isArray(characterData.actions)) {
        console.log(`[SYNC DEBUG] Found ${characterData.actions.length} actions in characterData`);
        for (const action of characterData.actions) {
          console.log(`[SYNC DEBUG] Action: ${action.name} - uses: ${action.uses}, usesUsed: ${action.usesUsed}, _id: ${action._id}`);
          if (action.name && action.uses && action.usesUsed !== void 0 && action._id) {
            const cacheKey = `action_${action.name}`;
            if (hasChanged(cacheKey, action.usesUsed)) {
              console.log(`[DiceCloud Sync] \u2705 Syncing action ${action.name}: ${action.usesUsed} uses used`);
              await this.setActionUses(action._id, action.usesUsed);
            } else {
              console.log(`[SYNC DEBUG] \u23ED\uFE0F Action ${action.name} unchanged, skipping sync`);
            }
          } else {
            console.log(`[SYNC DEBUG] \u274C Action ${action.name} missing required fields (uses: ${action.uses}, usesUsed: ${action.usesUsed}, _id: ${action._id})`);
          }
        }
      } else {
        console.log("[SYNC DEBUG] No actions array in characterData");
      }
    }
    /**
     * Handle action usage updates from Roll20
     * @param {string} actionName - Name of the action
     * @param {number} usesUsed - New uses used value
     */
    async handleActionUsageUpdate(actionName, usesUsed) {
      if (!this.enabled) {
        console.warn("[DiceCloud Sync] Sync not enabled, ignoring action update");
        return;
      }
      console.log(`[DiceCloud Sync] Handling action usage update: ${actionName} -> ${usesUsed}`);
      await this.setActionUses(actionName, usesUsed);
    }
    /**
     * Handle attribute updates from Roll20
     * @param {string} attributeName - Name of the attribute
     * @param {number} value - New value
     */
    async handleAttributeUpdate(attributeName, value) {
      if (!this.enabled) {
        console.warn("[DiceCloud Sync] Sync not enabled, ignoring attribute update");
        return;
      }
      console.log(`[DiceCloud Sync] Handling attribute update: ${attributeName} -> ${value}`);
      await this.updateAttributeValue(attributeName, value);
    }
    /**
     * Check if sync is enabled
     * @returns {boolean} True if sync is enabled
     */
    isEnabled() {
      return this.enabled;
    }
    /**
     * Disable sync
     */
    disable() {
      this.enabled = false;
      console.log("[DiceCloud Sync] Sync disabled");
    }
    /**
     * Enable sync
     */
    enable() {
      if (this.characterId && this.ddp.isConnected()) {
        this.enabled = true;
        console.log("[DiceCloud Sync] Sync enabled");
      } else {
        console.warn("[DiceCloud Sync] Cannot enable sync - not initialized");
      }
    }
  };
  var dicecloud_sync_default = DiceCloudSync;
  if (typeof window !== "undefined") {
    window.initializeDiceCloudSync = async function() {
      console.log("[DiceCloud Sync] Global initialization called");
      console.log("[DiceCloud Sync] Current URL:", window.location.href);
      try {
        const tokenResult = await browserAPI.storage.local.get(["diceCloudToken"]);
        const { diceCloudToken } = tokenResult;
        if (window.diceCloudSync && window.diceCloudSync.ddp && window.diceCloudSync.ddp.isConnected()) {
          console.log("[DiceCloud Sync] DDP already connected, checking authentication...");
          if (diceCloudToken) {
            console.log("[DiceCloud Sync] Authenticating existing DDP connection...");
            try {
              const result2 = await window.diceCloudSync.ddp.call("login", {
                resume: diceCloudToken
              });
              console.log("[DiceCloud Sync] DDP authentication successful:", result2);
              const charResult = await browserAPI.storage.local.get(["activeCharacterId", "characterProfiles"]);
              const { activeCharacterId, characterProfiles } = charResult;
              if (activeCharacterId && characterProfiles && characterProfiles[activeCharacterId]) {
                const profileData = characterProfiles[activeCharacterId];
                if (profileData && profileData.id) {
                  console.log("[DiceCloud Sync] Re-initializing with character:", profileData.id);
                  await window.diceCloudSync.initialize(profileData.id);
                }
              }
              return;
            } catch (error) {
              console.error("[DiceCloud Sync] Authentication failed:", error);
            }
          } else {
            console.log("[DiceCloud Sync] Already initialized, skipping");
            return;
          }
        }
        console.log("[DiceCloud Sync] Creating new DDP client...");
        const ddpClient = new DDPClient("wss://dicecloud.com/websocket");
        if (diceCloudToken) {
          console.log("[DiceCloud Sync] Setting up DDP authentication...");
          ddpClient.onConnected = async () => {
            console.log("[DiceCloud Sync] DDP connected, authenticating...");
            try {
              const result2 = await ddpClient.call("login", {
                resume: diceCloudToken
              });
              console.log("[DiceCloud Sync] DDP authentication successful:", result2);
            } catch (error) {
              console.error("[DiceCloud Sync] DDP authentication failed:", error);
            }
          };
          console.log("[DiceCloud Sync] About to connect to DDP...");
          try {
            await ddpClient.connect();
            console.log("[DiceCloud Sync] DDP connect() completed");
          } catch (error) {
            console.error("[DiceCloud Sync] DDP connect() failed:", error);
          }
        } else {
          console.warn("[DiceCloud Sync] No DiceCloud token found for DDP authentication");
          console.log("[DiceCloud Sync] About to connect to DDP without token...");
          try {
            await ddpClient.connect();
            console.log("[DiceCloud Sync] DDP connect() completed without token");
          } catch (error) {
            console.error("[DiceCloud Sync] DDP connect() failed without token:", error);
          }
        }
        const sync = new DiceCloudSync(ddpClient);
        window.diceCloudSync = sync;
        console.log("[DiceCloud Sync] Sync instance created, checking for active character...");
        let retryCount = 0;
        const MAX_RETRIES = 3;
        const tryInitialize = async () => {
          try {
            console.log("[DiceCloud Sync] Trying to initialize... (attempt", retryCount + 1, "/", MAX_RETRIES, ")");
            if (typeof browserAPI !== "undefined" && browserAPI && browserAPI.storage && browserAPI.storage.local) {
              console.log("[DiceCloud Sync] Browser API available, checking storage...");
              const result2 = await browserAPI.storage.local.get(["activeCharacterId", "characterProfiles", "carmaclouds_characters"]);
              const { activeCharacterId, characterProfiles, carmaclouds_characters } = result2;
              console.log("[DiceCloud Sync] Storage result:", { activeCharacterId, characterProfilesKeys: characterProfiles ? Object.keys(characterProfiles) : null, carmacloudChars: carmaclouds_characters ? carmaclouds_characters.length : 0 });
              if (activeCharacterId && characterProfiles && characterProfiles[activeCharacterId]) {
                const characterData = characterProfiles[activeCharacterId];
                console.log("[DiceCloud Sync] Character data for key:", activeCharacterId, characterData);
                if (characterProfiles && typeof characterProfiles === "object") {
                  console.log("[DiceCloud Sync] Checking characterProfiles object:", Object.keys(characterProfiles));
                  const profileData = characterProfiles[activeCharacterId] || characterProfiles.default || characterProfiles["slot-1"];
                  if (profileData && profileData.id) {
                    console.log("[DiceCloud Sync] Found character data in characterProfiles:", profileData);
                    console.log("[DiceCloud Sync] Found DiceCloud character ID:", profileData.id);
                    await sync.initialize(profileData.id);
                    sync.setupRoll20EventListeners();
                    console.log("[DiceCloud Sync] Event listeners set up");
                    console.log("[DiceCloud Sync] Global initialization complete");
                    return;
                  }
                }
              } else if (activeCharacterId && carmaclouds_characters && carmaclouds_characters.length > 0) {
                const character = carmaclouds_characters.find((char) => char.id === activeCharacterId);
                if (character && character.id) {
                  console.log("[DiceCloud Sync] Found character in carmaclouds format:", character.name);
                  console.log("[DiceCloud Sync] DiceCloud character ID:", character.id);
                  await sync.initialize(character.id);
                  sync.setupRoll20EventListeners();
                  console.log("[DiceCloud Sync] Event listeners set up");
                  console.log("[DiceCloud Sync] Global initialization complete");
                  return;
                } else {
                  console.warn("[DiceCloud Sync] Character not found in carmaclouds_characters array");
                }
              } else {
                console.warn("[DiceCloud Sync] No active character found in storage");
                console.log("[DiceCloud Sync] All storage keys:", Object.keys(result2));
                console.log("[DiceCloud Sync] All storage data:", result2);
              }
            } else {
              console.warn("[DiceCloud Sync] Browser API not available");
            }
            retryCount++;
            if (retryCount < MAX_RETRIES) {
              console.log("[DiceCloud Sync] Retrying in 2 seconds...");
              setTimeout(tryInitialize, 2e3);
            } else {
              console.log("[DiceCloud Sync] Max retries reached, stopping initialization attempts");
              console.log("[DiceCloud Sync] Sync will remain available for manual initialization via message handlers");
            }
          } catch (error) {
            if (error.message && error.message.includes("Extension context invalidated")) {
              console.warn("[DiceCloud Sync] Extension context invalidated - service worker terminated.");
              console.warn("[DiceCloud Sync] This happens when Chrome terminates the background service worker.");
              console.warn("[DiceCloud Sync] The extension will reinitialize when the page is refreshed or the extension is reloaded.");
              return;
            }
            console.error("[DiceCloud Sync] Error during initialization:", error);
            console.log("[DiceCloud Sync] Retrying in 5 seconds...");
            setTimeout(tryInitialize, 5e3);
          }
        };
        tryInitialize();
      } catch (error) {
        console.error("[DiceCloud Sync] Failed to create sync instance:", error);
        console.error("[DiceCloud Sync] Error details:", error.stack);
      }
    };
    if (window.location.hostname === "app.roll20.net") {
      console.log("[DiceCloud Sync] Detected Roll20, initializing sync...");
      setTimeout(() => {
        window.initializeDiceCloudSync();
      }, 1e3);
      if (typeof browserAPI !== "undefined" && browserAPI && browserAPI.storage && browserAPI.storage.onChanged) {
        browserAPI.storage.onChanged.addListener((changes, areaName) => {
          if (areaName === "local" && changes.diceCloudToken) {
            const newToken = changes.diceCloudToken.newValue;
            const oldToken = changes.diceCloudToken.oldValue;
            if (newToken && newToken !== oldToken) {
              console.log("[DiceCloud Sync] Token detected, re-initializing with authentication...");
              window.initializeDiceCloudSync();
            }
          }
        });
        console.log("[DiceCloud Sync] Storage listener registered for token changes");
      }
    }
    ;
  }

  // src/lib/meteor-ddp-client.js
  var MeteorDDPClient = class {
    constructor(url) {
      this.url = url;
      this.ws = null;
      this.sessionId = null;
      this.connected = false;
      this.nextId = 1;
      this.pendingMethods = /* @__PURE__ */ new Map();
      this.subscriptions = /* @__PURE__ */ new Map();
      this.heartbeatInterval = null;
      this.reconnectAttempts = 0;
      this.maxReconnectAttempts = 5;
      this.onConnected = null;
      this.onDisconnected = null;
      this.onError = null;
    }
    /**
     * Connect to DiceCloud Meteor server
     */
    async connect() {
      return new Promise((resolve, reject) => {
        const wsUrl = this.url.replace("https://", "wss://").replace("http://", "ws://");
        console.log("[DDP] Connecting to:", wsUrl);
        this.ws = new WebSocket(wsUrl);
        this.ws.onopen = () => {
          console.log("[DDP] WebSocket opened");
          this.send({
            msg: "connect",
            version: "1",
            support: ["1", "pre2", "pre1"]
          });
        };
        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
            if (message.msg === "connected" && !this.connected) {
              this.connected = true;
              this.sessionId = message.session;
              this.reconnectAttempts = 0;
              this.startHeartbeat();
              console.log("[DDP] Connected with session:", this.sessionId);
              if (this.onConnected)
                this.onConnected();
              resolve(this.sessionId);
            }
          } catch (error) {
            console.error("[DDP] Failed to parse message:", error);
            if (this.onError)
              this.onError(error);
          }
        };
        this.ws.onerror = (error) => {
          console.error("[DDP] WebSocket error:", error);
          if (this.onError)
            this.onError(error);
          reject(error);
        };
        this.ws.onclose = () => {
          console.log("[DDP] WebSocket closed");
          this.connected = false;
          this.stopHeartbeat();
          if (this.onDisconnected)
            this.onDisconnected();
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1e3 * Math.pow(2, this.reconnectAttempts), 3e4);
            console.log(`[DDP] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
            setTimeout(() => this.connect(), delay);
          }
        };
      });
    }
    /**
     * Disconnect from server
     */
    disconnect() {
      this.stopHeartbeat();
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      this.connected = false;
      this.sessionId = null;
    }
    /**
     * Send a message to the server
     */
    send(message) {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        console.warn("[DDP] Cannot send message - WebSocket not open");
        return false;
      }
      const json = JSON.stringify(message);
      if (message.msg !== "ping" && message.msg !== "pong") {
        console.log("[DDP] Sending:", message.msg, message);
      }
      this.ws.send(json);
      return true;
    }
    /**
     * Handle incoming messages from server
     */
    handleMessage(message) {
      if (message.msg !== "ping" && message.msg !== "pong") {
        console.log("[DDP] Received:", message.msg, message);
      }
      switch (message.msg) {
        case "connected":
          break;
        case "failed":
          console.error("[DDP] Connection failed:", message);
          break;
        case "ping":
          this.send({ msg: "pong", id: message.id });
          break;
        case "pong":
          break;
        case "result":
          this.handleMethodResult(message);
          break;
        case "updated":
          console.log("[DDP] Methods updated:", message.methods);
          break;
        case "ready":
          this.handleSubscriptionReady(message);
          break;
        case "nosub":
          this.handleSubscriptionError(message);
          break;
        case "added":
        case "changed":
        case "removed":
          break;
        case "error":
          console.error("[DDP] Protocol error:", message);
          break;
        default:
          console.warn("[DDP] Unknown message type:", message.msg);
      }
    }
    /**
     * Handle method call result
     */
    handleMethodResult(message) {
      const { id, error, result: result2 } = message;
      const pending = this.pendingMethods.get(id);
      if (!pending) {
        console.warn("[DDP] Received result for unknown method:", id);
        return;
      }
      this.pendingMethods.delete(id);
      if (error) {
        console.error("[DDP] Method error:", error);
        pending.reject(new Error(error.message || error.reason || "Method call failed"));
      } else {
        console.log("[DDP] Method result:", result2);
        pending.resolve(result2);
      }
    }
    /**
     * Handle subscription ready
     */
    handleSubscriptionReady(message) {
      const { subs } = message;
      for (const id of subs) {
        const sub = this.subscriptions.get(id);
        if (sub && sub.resolve) {
          sub.resolve();
        }
      }
    }
    /**
     * Handle subscription error
     */
    handleSubscriptionError(message) {
      const { id, error } = message;
      const sub = this.subscriptions.get(id);
      if (sub && sub.reject) {
        sub.reject(new Error(error?.message || "Subscription failed"));
      }
      this.subscriptions.delete(id);
    }
    /**
     * Call a Meteor method
     */
    async call(methodName, ...params) {
      if (!this.connected) {
        throw new Error("Not connected to server");
      }
      const id = String(this.nextId++);
      return new Promise((resolve, reject) => {
        this.pendingMethods.set(id, { resolve, reject });
        this.send({
          msg: "method",
          method: methodName,
          params,
          id
        });
        setTimeout(() => {
          if (this.pendingMethods.has(id)) {
            this.pendingMethods.delete(id);
            reject(new Error(`Method call timeout: ${methodName}`));
          }
        }, 3e4);
      });
    }
    /**
     * Subscribe to a publication
     */
    async subscribe(name, ...params) {
      if (!this.connected) {
        throw new Error("Not connected to server");
      }
      const id = String(this.nextId++);
      return new Promise((resolve, reject) => {
        this.subscriptions.set(id, { name, params, resolve, reject });
        this.send({
          msg: "sub",
          id,
          name,
          params
        });
        setTimeout(() => {
          if (this.subscriptions.has(id)) {
            const sub = this.subscriptions.get(id);
            this.subscriptions.delete(id);
            reject(new Error(`Subscription timeout: ${name}`));
          }
        }, 3e4);
      });
    }
    /**
     * Unsubscribe from a publication
     */
    unsubscribe(subscriptionId) {
      this.send({
        msg: "unsub",
        id: subscriptionId
      });
      this.subscriptions.delete(subscriptionId);
    }
    /**
     * Login with token (resume token from API)
     */
    async loginWithToken(token) {
      try {
        const result2 = await this.call("login", {
          resume: token
        });
        console.log("[DDP] Logged in:", result2);
        return result2;
      } catch (error) {
        console.error("[DDP] Login failed:", error);
        throw error;
      }
    }
    /**
     * Start heartbeat ping-pong
     */
    startHeartbeat() {
      this.stopHeartbeat();
      this.heartbeatInterval = setInterval(() => {
        if (this.connected) {
          const pingId = String(this.nextId++);
          this.send({
            msg: "ping",
            id: pingId
          });
        }
      }, 25e3);
    }
    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
    }
    /**
     * Get connection status
     */
    isConnected() {
      return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
    }
  };
  if (typeof window !== "undefined") {
    window.DDPClient = MeteorDDPClient;
  }
  var meteor_ddp_client_default = MeteorDDPClient;

  // ../../node_modules/tslib/tslib.es6.mjs
  function __rest(s, e) {
    var t = {};
    for (var p in s)
      if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
          t[p[i]] = s[p[i]];
      }
    return t;
  }
  function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result2) {
        result2.done ? resolve(result2.value) : adopt(result2.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  }

  // ../../node_modules/@supabase/functions-js/dist/module/helper.js
  var resolveFetch = (customFetch) => {
    if (customFetch) {
      return (...args) => customFetch(...args);
    }
    return (...args) => fetch(...args);
  };

  // ../../node_modules/@supabase/functions-js/dist/module/types.js
  var FunctionsError = class extends Error {
    constructor(message, name = "FunctionsError", context) {
      super(message);
      this.name = name;
      this.context = context;
    }
  };
  var FunctionsFetchError = class extends FunctionsError {
    constructor(context) {
      super("Failed to send a request to the Edge Function", "FunctionsFetchError", context);
    }
  };
  var FunctionsRelayError = class extends FunctionsError {
    constructor(context) {
      super("Relay Error invoking the Edge Function", "FunctionsRelayError", context);
    }
  };
  var FunctionsHttpError = class extends FunctionsError {
    constructor(context) {
      super("Edge Function returned a non-2xx status code", "FunctionsHttpError", context);
    }
  };
  var FunctionRegion;
  (function(FunctionRegion2) {
    FunctionRegion2["Any"] = "any";
    FunctionRegion2["ApNortheast1"] = "ap-northeast-1";
    FunctionRegion2["ApNortheast2"] = "ap-northeast-2";
    FunctionRegion2["ApSouth1"] = "ap-south-1";
    FunctionRegion2["ApSoutheast1"] = "ap-southeast-1";
    FunctionRegion2["ApSoutheast2"] = "ap-southeast-2";
    FunctionRegion2["CaCentral1"] = "ca-central-1";
    FunctionRegion2["EuCentral1"] = "eu-central-1";
    FunctionRegion2["EuWest1"] = "eu-west-1";
    FunctionRegion2["EuWest2"] = "eu-west-2";
    FunctionRegion2["EuWest3"] = "eu-west-3";
    FunctionRegion2["SaEast1"] = "sa-east-1";
    FunctionRegion2["UsEast1"] = "us-east-1";
    FunctionRegion2["UsWest1"] = "us-west-1";
    FunctionRegion2["UsWest2"] = "us-west-2";
  })(FunctionRegion || (FunctionRegion = {}));

  // ../../node_modules/@supabase/functions-js/dist/module/FunctionsClient.js
  var FunctionsClient = class {
    /**
     * Creates a new Functions client bound to an Edge Functions URL.
     *
     * @example
     * ```ts
     * import { FunctionsClient, FunctionRegion } from '@supabase/functions-js'
     *
     * const functions = new FunctionsClient('https://xyzcompany.supabase.co/functions/v1', {
     *   headers: { apikey: 'public-anon-key' },
     *   region: FunctionRegion.UsEast1,
     * })
     * ```
     */
    constructor(url, { headers = {}, customFetch, region = FunctionRegion.Any } = {}) {
      this.url = url;
      this.headers = headers;
      this.region = region;
      this.fetch = resolveFetch(customFetch);
    }
    /**
     * Updates the authorization header
     * @param token - the new jwt token sent in the authorisation header
     * @example
     * ```ts
     * functions.setAuth(session.access_token)
     * ```
     */
    setAuth(token) {
      this.headers.Authorization = `Bearer ${token}`;
    }
    /**
     * Invokes a function
     * @param functionName - The name of the Function to invoke.
     * @param options - Options for invoking the Function.
     * @example
     * ```ts
     * const { data, error } = await functions.invoke('hello-world', {
     *   body: { name: 'Ada' },
     * })
     * ```
     */
    invoke(functionName_1) {
      return __awaiter(this, arguments, void 0, function* (functionName, options = {}) {
        var _a;
        let timeoutId;
        let timeoutController;
        try {
          const { headers, method, body: functionArgs, signal, timeout } = options;
          let _headers = {};
          let { region } = options;
          if (!region) {
            region = this.region;
          }
          const url = new URL(`${this.url}/${functionName}`);
          if (region && region !== "any") {
            _headers["x-region"] = region;
            url.searchParams.set("forceFunctionRegion", region);
          }
          let body;
          if (functionArgs && (headers && !Object.prototype.hasOwnProperty.call(headers, "Content-Type") || !headers)) {
            if (typeof Blob !== "undefined" && functionArgs instanceof Blob || functionArgs instanceof ArrayBuffer) {
              _headers["Content-Type"] = "application/octet-stream";
              body = functionArgs;
            } else if (typeof functionArgs === "string") {
              _headers["Content-Type"] = "text/plain";
              body = functionArgs;
            } else if (typeof FormData !== "undefined" && functionArgs instanceof FormData) {
              body = functionArgs;
            } else {
              _headers["Content-Type"] = "application/json";
              body = JSON.stringify(functionArgs);
            }
          } else {
            if (functionArgs && typeof functionArgs !== "string" && !(typeof Blob !== "undefined" && functionArgs instanceof Blob) && !(functionArgs instanceof ArrayBuffer) && !(typeof FormData !== "undefined" && functionArgs instanceof FormData)) {
              body = JSON.stringify(functionArgs);
            } else {
              body = functionArgs;
            }
          }
          let effectiveSignal = signal;
          if (timeout) {
            timeoutController = new AbortController();
            timeoutId = setTimeout(() => timeoutController.abort(), timeout);
            if (signal) {
              effectiveSignal = timeoutController.signal;
              signal.addEventListener("abort", () => timeoutController.abort());
            } else {
              effectiveSignal = timeoutController.signal;
            }
          }
          const response = yield this.fetch(url.toString(), {
            method: method || "POST",
            // headers priority is (high to low):
            // 1. invoke-level headers
            // 2. client-level headers
            // 3. default Content-Type header
            headers: Object.assign(Object.assign(Object.assign({}, _headers), this.headers), headers),
            body,
            signal: effectiveSignal
          }).catch((fetchError) => {
            throw new FunctionsFetchError(fetchError);
          });
          const isRelayError = response.headers.get("x-relay-error");
          if (isRelayError && isRelayError === "true") {
            throw new FunctionsRelayError(response);
          }
          if (!response.ok) {
            throw new FunctionsHttpError(response);
          }
          let responseType = ((_a = response.headers.get("Content-Type")) !== null && _a !== void 0 ? _a : "text/plain").split(";")[0].trim();
          let data;
          if (responseType === "application/json") {
            data = yield response.json();
          } else if (responseType === "application/octet-stream" || responseType === "application/pdf") {
            data = yield response.blob();
          } else if (responseType === "text/event-stream") {
            data = response;
          } else if (responseType === "multipart/form-data") {
            data = yield response.formData();
          } else {
            data = yield response.text();
          }
          return { data, error: null, response };
        } catch (error) {
          return {
            data: null,
            error,
            response: error instanceof FunctionsHttpError || error instanceof FunctionsRelayError ? error.context : void 0
          };
        } finally {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
        }
      });
    }
  };

  // ../../node_modules/@supabase/postgrest-js/dist/index.mjs
  var PostgrestError = class extends Error {
    /**
    * @example
    * ```ts
    * import PostgrestError from '@supabase/postgrest-js'
    *
    * throw new PostgrestError({
    *   message: 'Row level security prevented the request',
    *   details: 'RLS denied the insert',
    *   hint: 'Check your policies',
    *   code: 'PGRST301',
    * })
    * ```
    */
    constructor(context) {
      super(context.message);
      this.name = "PostgrestError";
      this.details = context.details;
      this.hint = context.hint;
      this.code = context.code;
    }
  };
  var PostgrestBuilder = class {
    /**
    * Creates a builder configured for a specific PostgREST request.
    *
    * @example
    * ```ts
    * import PostgrestQueryBuilder from '@supabase/postgrest-js'
    *
    * const builder = new PostgrestQueryBuilder(
    *   new URL('https://xyzcompany.supabase.co/rest/v1/users'),
    *   { headers: new Headers({ apikey: 'public-anon-key' }) }
    * )
    * ```
    */
    constructor(builder) {
      var _builder$shouldThrowO, _builder$isMaybeSingl;
      this.shouldThrowOnError = false;
      this.method = builder.method;
      this.url = builder.url;
      this.headers = new Headers(builder.headers);
      this.schema = builder.schema;
      this.body = builder.body;
      this.shouldThrowOnError = (_builder$shouldThrowO = builder.shouldThrowOnError) !== null && _builder$shouldThrowO !== void 0 ? _builder$shouldThrowO : false;
      this.signal = builder.signal;
      this.isMaybeSingle = (_builder$isMaybeSingl = builder.isMaybeSingle) !== null && _builder$isMaybeSingl !== void 0 ? _builder$isMaybeSingl : false;
      if (builder.fetch)
        this.fetch = builder.fetch;
      else
        this.fetch = fetch;
    }
    /**
    * If there's an error with the query, throwOnError will reject the promise by
    * throwing the error instead of returning it as part of a successful response.
    *
    * {@link https://github.com/supabase/supabase-js/issues/92}
    */
    throwOnError() {
      this.shouldThrowOnError = true;
      return this;
    }
    /**
    * Set an HTTP header for the request.
    */
    setHeader(name, value) {
      this.headers = new Headers(this.headers);
      this.headers.set(name, value);
      return this;
    }
    then(onfulfilled, onrejected) {
      var _this = this;
      if (this.schema === void 0) {
      } else if (["GET", "HEAD"].includes(this.method))
        this.headers.set("Accept-Profile", this.schema);
      else
        this.headers.set("Content-Profile", this.schema);
      if (this.method !== "GET" && this.method !== "HEAD")
        this.headers.set("Content-Type", "application/json");
      const _fetch = this.fetch;
      let res = _fetch(this.url.toString(), {
        method: this.method,
        headers: this.headers,
        body: JSON.stringify(this.body),
        signal: this.signal
      }).then(async (res$1) => {
        let error = null;
        let data = null;
        let count = null;
        let status = res$1.status;
        let statusText = res$1.statusText;
        if (res$1.ok) {
          var _this$headers$get2, _res$headers$get;
          if (_this.method !== "HEAD") {
            var _this$headers$get;
            const body = await res$1.text();
            if (body === "") {
            } else if (_this.headers.get("Accept") === "text/csv")
              data = body;
            else if (_this.headers.get("Accept") && ((_this$headers$get = _this.headers.get("Accept")) === null || _this$headers$get === void 0 ? void 0 : _this$headers$get.includes("application/vnd.pgrst.plan+text")))
              data = body;
            else
              data = JSON.parse(body);
          }
          const countHeader = (_this$headers$get2 = _this.headers.get("Prefer")) === null || _this$headers$get2 === void 0 ? void 0 : _this$headers$get2.match(/count=(exact|planned|estimated)/);
          const contentRange = (_res$headers$get = res$1.headers.get("content-range")) === null || _res$headers$get === void 0 ? void 0 : _res$headers$get.split("/");
          if (countHeader && contentRange && contentRange.length > 1)
            count = parseInt(contentRange[1]);
          if (_this.isMaybeSingle && _this.method === "GET" && Array.isArray(data))
            if (data.length > 1) {
              error = {
                code: "PGRST116",
                details: `Results contain ${data.length} rows, application/vnd.pgrst.object+json requires 1 row`,
                hint: null,
                message: "JSON object requested, multiple (or no) rows returned"
              };
              data = null;
              count = null;
              status = 406;
              statusText = "Not Acceptable";
            } else if (data.length === 1)
              data = data[0];
            else
              data = null;
        } else {
          var _error$details;
          const body = await res$1.text();
          try {
            error = JSON.parse(body);
            if (Array.isArray(error) && res$1.status === 404) {
              data = [];
              error = null;
              status = 200;
              statusText = "OK";
            }
          } catch (_unused) {
            if (res$1.status === 404 && body === "") {
              status = 204;
              statusText = "No Content";
            } else
              error = { message: body };
          }
          if (error && _this.isMaybeSingle && (error === null || error === void 0 || (_error$details = error.details) === null || _error$details === void 0 ? void 0 : _error$details.includes("0 rows"))) {
            error = null;
            status = 200;
            statusText = "OK";
          }
          if (error && _this.shouldThrowOnError)
            throw new PostgrestError(error);
        }
        return {
          error,
          data,
          count,
          status,
          statusText
        };
      });
      if (!this.shouldThrowOnError)
        res = res.catch((fetchError) => {
          var _fetchError$name2;
          let errorDetails = "";
          const cause = fetchError === null || fetchError === void 0 ? void 0 : fetchError.cause;
          if (cause) {
            var _cause$message, _cause$code, _fetchError$name, _cause$name;
            const causeMessage = (_cause$message = cause === null || cause === void 0 ? void 0 : cause.message) !== null && _cause$message !== void 0 ? _cause$message : "";
            const causeCode = (_cause$code = cause === null || cause === void 0 ? void 0 : cause.code) !== null && _cause$code !== void 0 ? _cause$code : "";
            errorDetails = `${(_fetchError$name = fetchError === null || fetchError === void 0 ? void 0 : fetchError.name) !== null && _fetchError$name !== void 0 ? _fetchError$name : "FetchError"}: ${fetchError === null || fetchError === void 0 ? void 0 : fetchError.message}`;
            errorDetails += `

Caused by: ${(_cause$name = cause === null || cause === void 0 ? void 0 : cause.name) !== null && _cause$name !== void 0 ? _cause$name : "Error"}: ${causeMessage}`;
            if (causeCode)
              errorDetails += ` (${causeCode})`;
            if (cause === null || cause === void 0 ? void 0 : cause.stack)
              errorDetails += `
${cause.stack}`;
          } else {
            var _fetchError$stack;
            errorDetails = (_fetchError$stack = fetchError === null || fetchError === void 0 ? void 0 : fetchError.stack) !== null && _fetchError$stack !== void 0 ? _fetchError$stack : "";
          }
          return {
            error: {
              message: `${(_fetchError$name2 = fetchError === null || fetchError === void 0 ? void 0 : fetchError.name) !== null && _fetchError$name2 !== void 0 ? _fetchError$name2 : "FetchError"}: ${fetchError === null || fetchError === void 0 ? void 0 : fetchError.message}`,
              details: errorDetails,
              hint: "",
              code: ""
            },
            data: null,
            count: null,
            status: 0,
            statusText: ""
          };
        });
      return res.then(onfulfilled, onrejected);
    }
    /**
    * Override the type of the returned `data`.
    *
    * @typeParam NewResult - The new result type to override with
    * @deprecated Use overrideTypes<yourType, { merge: false }>() method at the end of your call chain instead
    */
    returns() {
      return this;
    }
    /**
    * Override the type of the returned `data` field in the response.
    *
    * @typeParam NewResult - The new type to cast the response data to
    * @typeParam Options - Optional type configuration (defaults to { merge: true })
    * @typeParam Options.merge - When true, merges the new type with existing return type. When false, replaces the existing types entirely (defaults to true)
    * @example
    * ```typescript
    * // Merge with existing types (default behavior)
    * const query = supabase
    *   .from('users')
    *   .select()
    *   .overrideTypes<{ custom_field: string }>()
    *
    * // Replace existing types completely
    * const replaceQuery = supabase
    *   .from('users')
    *   .select()
    *   .overrideTypes<{ id: number; name: string }, { merge: false }>()
    * ```
    * @returns A PostgrestBuilder instance with the new type
    */
    overrideTypes() {
      return this;
    }
  };
  var PostgrestTransformBuilder = class extends PostgrestBuilder {
    /**
    * Perform a SELECT on the query result.
    *
    * By default, `.insert()`, `.update()`, `.upsert()`, and `.delete()` do not
    * return modified rows. By calling this method, modified rows are returned in
    * `data`.
    *
    * @param columns - The columns to retrieve, separated by commas
    */
    select(columns) {
      let quoted = false;
      const cleanedColumns = (columns !== null && columns !== void 0 ? columns : "*").split("").map((c) => {
        if (/\s/.test(c) && !quoted)
          return "";
        if (c === '"')
          quoted = !quoted;
        return c;
      }).join("");
      this.url.searchParams.set("select", cleanedColumns);
      this.headers.append("Prefer", "return=representation");
      return this;
    }
    /**
    * Order the query result by `column`.
    *
    * You can call this method multiple times to order by multiple columns.
    *
    * You can order referenced tables, but it only affects the ordering of the
    * parent table if you use `!inner` in the query.
    *
    * @param column - The column to order by
    * @param options - Named parameters
    * @param options.ascending - If `true`, the result will be in ascending order
    * @param options.nullsFirst - If `true`, `null`s appear first. If `false`,
    * `null`s appear last.
    * @param options.referencedTable - Set this to order a referenced table by
    * its columns
    * @param options.foreignTable - Deprecated, use `options.referencedTable`
    * instead
    */
    order(column, { ascending = true, nullsFirst, foreignTable, referencedTable = foreignTable } = {}) {
      const key = referencedTable ? `${referencedTable}.order` : "order";
      const existingOrder = this.url.searchParams.get(key);
      this.url.searchParams.set(key, `${existingOrder ? `${existingOrder},` : ""}${column}.${ascending ? "asc" : "desc"}${nullsFirst === void 0 ? "" : nullsFirst ? ".nullsfirst" : ".nullslast"}`);
      return this;
    }
    /**
    * Limit the query result by `count`.
    *
    * @param count - The maximum number of rows to return
    * @param options - Named parameters
    * @param options.referencedTable - Set this to limit rows of referenced
    * tables instead of the parent table
    * @param options.foreignTable - Deprecated, use `options.referencedTable`
    * instead
    */
    limit(count, { foreignTable, referencedTable = foreignTable } = {}) {
      const key = typeof referencedTable === "undefined" ? "limit" : `${referencedTable}.limit`;
      this.url.searchParams.set(key, `${count}`);
      return this;
    }
    /**
    * Limit the query result by starting at an offset `from` and ending at the offset `to`.
    * Only records within this range are returned.
    * This respects the query order and if there is no order clause the range could behave unexpectedly.
    * The `from` and `to` values are 0-based and inclusive: `range(1, 3)` will include the second, third
    * and fourth rows of the query.
    *
    * @param from - The starting index from which to limit the result
    * @param to - The last index to which to limit the result
    * @param options - Named parameters
    * @param options.referencedTable - Set this to limit rows of referenced
    * tables instead of the parent table
    * @param options.foreignTable - Deprecated, use `options.referencedTable`
    * instead
    */
    range(from, to, { foreignTable, referencedTable = foreignTable } = {}) {
      const keyOffset = typeof referencedTable === "undefined" ? "offset" : `${referencedTable}.offset`;
      const keyLimit = typeof referencedTable === "undefined" ? "limit" : `${referencedTable}.limit`;
      this.url.searchParams.set(keyOffset, `${from}`);
      this.url.searchParams.set(keyLimit, `${to - from + 1}`);
      return this;
    }
    /**
    * Set the AbortSignal for the fetch request.
    *
    * @param signal - The AbortSignal to use for the fetch request
    */
    abortSignal(signal) {
      this.signal = signal;
      return this;
    }
    /**
    * Return `data` as a single object instead of an array of objects.
    *
    * Query result must be one row (e.g. using `.limit(1)`), otherwise this
    * returns an error.
    */
    single() {
      this.headers.set("Accept", "application/vnd.pgrst.object+json");
      return this;
    }
    /**
    * Return `data` as a single object instead of an array of objects.
    *
    * Query result must be zero or one row (e.g. using `.limit(1)`), otherwise
    * this returns an error.
    */
    maybeSingle() {
      if (this.method === "GET")
        this.headers.set("Accept", "application/json");
      else
        this.headers.set("Accept", "application/vnd.pgrst.object+json");
      this.isMaybeSingle = true;
      return this;
    }
    /**
    * Return `data` as a string in CSV format.
    */
    csv() {
      this.headers.set("Accept", "text/csv");
      return this;
    }
    /**
    * Return `data` as an object in [GeoJSON](https://geojson.org) format.
    */
    geojson() {
      this.headers.set("Accept", "application/geo+json");
      return this;
    }
    /**
    * Return `data` as the EXPLAIN plan for the query.
    *
    * You need to enable the
    * [db_plan_enabled](https://supabase.com/docs/guides/database/debugging-performance#enabling-explain)
    * setting before using this method.
    *
    * @param options - Named parameters
    *
    * @param options.analyze - If `true`, the query will be executed and the
    * actual run time will be returned
    *
    * @param options.verbose - If `true`, the query identifier will be returned
    * and `data` will include the output columns of the query
    *
    * @param options.settings - If `true`, include information on configuration
    * parameters that affect query planning
    *
    * @param options.buffers - If `true`, include information on buffer usage
    *
    * @param options.wal - If `true`, include information on WAL record generation
    *
    * @param options.format - The format of the output, can be `"text"` (default)
    * or `"json"`
    */
    explain({ analyze = false, verbose = false, settings = false, buffers = false, wal = false, format = "text" } = {}) {
      var _this$headers$get;
      const options = [
        analyze ? "analyze" : null,
        verbose ? "verbose" : null,
        settings ? "settings" : null,
        buffers ? "buffers" : null,
        wal ? "wal" : null
      ].filter(Boolean).join("|");
      const forMediatype = (_this$headers$get = this.headers.get("Accept")) !== null && _this$headers$get !== void 0 ? _this$headers$get : "application/json";
      this.headers.set("Accept", `application/vnd.pgrst.plan+${format}; for="${forMediatype}"; options=${options};`);
      if (format === "json")
        return this;
      else
        return this;
    }
    /**
    * Rollback the query.
    *
    * `data` will still be returned, but the query is not committed.
    */
    rollback() {
      this.headers.append("Prefer", "tx=rollback");
      return this;
    }
    /**
    * Override the type of the returned `data`.
    *
    * @typeParam NewResult - The new result type to override with
    * @deprecated Use overrideTypes<yourType, { merge: false }>() method at the end of your call chain instead
    */
    returns() {
      return this;
    }
    /**
    * Set the maximum number of rows that can be affected by the query.
    * Only available in PostgREST v13+ and only works with PATCH and DELETE methods.
    *
    * @param value - The maximum number of rows that can be affected
    */
    maxAffected(value) {
      this.headers.append("Prefer", "handling=strict");
      this.headers.append("Prefer", `max-affected=${value}`);
      return this;
    }
  };
  var PostgrestReservedCharsRegexp = /* @__PURE__ */ new RegExp("[,()]");
  var PostgrestFilterBuilder = class extends PostgrestTransformBuilder {
    /**
    * Match only rows where `column` is equal to `value`.
    *
    * To check if the value of `column` is NULL, you should use `.is()` instead.
    *
    * @param column - The column to filter on
    * @param value - The value to filter with
    */
    eq(column, value) {
      this.url.searchParams.append(column, `eq.${value}`);
      return this;
    }
    /**
    * Match only rows where `column` is not equal to `value`.
    *
    * @param column - The column to filter on
    * @param value - The value to filter with
    */
    neq(column, value) {
      this.url.searchParams.append(column, `neq.${value}`);
      return this;
    }
    /**
    * Match only rows where `column` is greater than `value`.
    *
    * @param column - The column to filter on
    * @param value - The value to filter with
    */
    gt(column, value) {
      this.url.searchParams.append(column, `gt.${value}`);
      return this;
    }
    /**
    * Match only rows where `column` is greater than or equal to `value`.
    *
    * @param column - The column to filter on
    * @param value - The value to filter with
    */
    gte(column, value) {
      this.url.searchParams.append(column, `gte.${value}`);
      return this;
    }
    /**
    * Match only rows where `column` is less than `value`.
    *
    * @param column - The column to filter on
    * @param value - The value to filter with
    */
    lt(column, value) {
      this.url.searchParams.append(column, `lt.${value}`);
      return this;
    }
    /**
    * Match only rows where `column` is less than or equal to `value`.
    *
    * @param column - The column to filter on
    * @param value - The value to filter with
    */
    lte(column, value) {
      this.url.searchParams.append(column, `lte.${value}`);
      return this;
    }
    /**
    * Match only rows where `column` matches `pattern` case-sensitively.
    *
    * @param column - The column to filter on
    * @param pattern - The pattern to match with
    */
    like(column, pattern) {
      this.url.searchParams.append(column, `like.${pattern}`);
      return this;
    }
    /**
    * Match only rows where `column` matches all of `patterns` case-sensitively.
    *
    * @param column - The column to filter on
    * @param patterns - The patterns to match with
    */
    likeAllOf(column, patterns) {
      this.url.searchParams.append(column, `like(all).{${patterns.join(",")}}`);
      return this;
    }
    /**
    * Match only rows where `column` matches any of `patterns` case-sensitively.
    *
    * @param column - The column to filter on
    * @param patterns - The patterns to match with
    */
    likeAnyOf(column, patterns) {
      this.url.searchParams.append(column, `like(any).{${patterns.join(",")}}`);
      return this;
    }
    /**
    * Match only rows where `column` matches `pattern` case-insensitively.
    *
    * @param column - The column to filter on
    * @param pattern - The pattern to match with
    */
    ilike(column, pattern) {
      this.url.searchParams.append(column, `ilike.${pattern}`);
      return this;
    }
    /**
    * Match only rows where `column` matches all of `patterns` case-insensitively.
    *
    * @param column - The column to filter on
    * @param patterns - The patterns to match with
    */
    ilikeAllOf(column, patterns) {
      this.url.searchParams.append(column, `ilike(all).{${patterns.join(",")}}`);
      return this;
    }
    /**
    * Match only rows where `column` matches any of `patterns` case-insensitively.
    *
    * @param column - The column to filter on
    * @param patterns - The patterns to match with
    */
    ilikeAnyOf(column, patterns) {
      this.url.searchParams.append(column, `ilike(any).{${patterns.join(",")}}`);
      return this;
    }
    /**
    * Match only rows where `column` matches the PostgreSQL regex `pattern`
    * case-sensitively (using the `~` operator).
    *
    * @param column - The column to filter on
    * @param pattern - The PostgreSQL regular expression pattern to match with
    */
    regexMatch(column, pattern) {
      this.url.searchParams.append(column, `match.${pattern}`);
      return this;
    }
    /**
    * Match only rows where `column` matches the PostgreSQL regex `pattern`
    * case-insensitively (using the `~*` operator).
    *
    * @param column - The column to filter on
    * @param pattern - The PostgreSQL regular expression pattern to match with
    */
    regexIMatch(column, pattern) {
      this.url.searchParams.append(column, `imatch.${pattern}`);
      return this;
    }
    /**
    * Match only rows where `column` IS `value`.
    *
    * For non-boolean columns, this is only relevant for checking if the value of
    * `column` is NULL by setting `value` to `null`.
    *
    * For boolean columns, you can also set `value` to `true` or `false` and it
    * will behave the same way as `.eq()`.
    *
    * @param column - The column to filter on
    * @param value - The value to filter with
    */
    is(column, value) {
      this.url.searchParams.append(column, `is.${value}`);
      return this;
    }
    /**
    * Match only rows where `column` IS DISTINCT FROM `value`.
    *
    * Unlike `.neq()`, this treats `NULL` as a comparable value. Two `NULL` values
    * are considered equal (not distinct), and comparing `NULL` with any non-NULL
    * value returns true (distinct).
    *
    * @param column - The column to filter on
    * @param value - The value to filter with
    */
    isDistinct(column, value) {
      this.url.searchParams.append(column, `isdistinct.${value}`);
      return this;
    }
    /**
    * Match only rows where `column` is included in the `values` array.
    *
    * @param column - The column to filter on
    * @param values - The values array to filter with
    */
    in(column, values) {
      const cleanedValues = Array.from(new Set(values)).map((s) => {
        if (typeof s === "string" && PostgrestReservedCharsRegexp.test(s))
          return `"${s}"`;
        else
          return `${s}`;
      }).join(",");
      this.url.searchParams.append(column, `in.(${cleanedValues})`);
      return this;
    }
    /**
    * Match only rows where `column` is NOT included in the `values` array.
    *
    * @param column - The column to filter on
    * @param values - The values array to filter with
    */
    notIn(column, values) {
      const cleanedValues = Array.from(new Set(values)).map((s) => {
        if (typeof s === "string" && PostgrestReservedCharsRegexp.test(s))
          return `"${s}"`;
        else
          return `${s}`;
      }).join(",");
      this.url.searchParams.append(column, `not.in.(${cleanedValues})`);
      return this;
    }
    /**
    * Only relevant for jsonb, array, and range columns. Match only rows where
    * `column` contains every element appearing in `value`.
    *
    * @param column - The jsonb, array, or range column to filter on
    * @param value - The jsonb, array, or range value to filter with
    */
    contains(column, value) {
      if (typeof value === "string")
        this.url.searchParams.append(column, `cs.${value}`);
      else if (Array.isArray(value))
        this.url.searchParams.append(column, `cs.{${value.join(",")}}`);
      else
        this.url.searchParams.append(column, `cs.${JSON.stringify(value)}`);
      return this;
    }
    /**
    * Only relevant for jsonb, array, and range columns. Match only rows where
    * every element appearing in `column` is contained by `value`.
    *
    * @param column - The jsonb, array, or range column to filter on
    * @param value - The jsonb, array, or range value to filter with
    */
    containedBy(column, value) {
      if (typeof value === "string")
        this.url.searchParams.append(column, `cd.${value}`);
      else if (Array.isArray(value))
        this.url.searchParams.append(column, `cd.{${value.join(",")}}`);
      else
        this.url.searchParams.append(column, `cd.${JSON.stringify(value)}`);
      return this;
    }
    /**
    * Only relevant for range columns. Match only rows where every element in
    * `column` is greater than any element in `range`.
    *
    * @param column - The range column to filter on
    * @param range - The range to filter with
    */
    rangeGt(column, range) {
      this.url.searchParams.append(column, `sr.${range}`);
      return this;
    }
    /**
    * Only relevant for range columns. Match only rows where every element in
    * `column` is either contained in `range` or greater than any element in
    * `range`.
    *
    * @param column - The range column to filter on
    * @param range - The range to filter with
    */
    rangeGte(column, range) {
      this.url.searchParams.append(column, `nxl.${range}`);
      return this;
    }
    /**
    * Only relevant for range columns. Match only rows where every element in
    * `column` is less than any element in `range`.
    *
    * @param column - The range column to filter on
    * @param range - The range to filter with
    */
    rangeLt(column, range) {
      this.url.searchParams.append(column, `sl.${range}`);
      return this;
    }
    /**
    * Only relevant for range columns. Match only rows where every element in
    * `column` is either contained in `range` or less than any element in
    * `range`.
    *
    * @param column - The range column to filter on
    * @param range - The range to filter with
    */
    rangeLte(column, range) {
      this.url.searchParams.append(column, `nxr.${range}`);
      return this;
    }
    /**
    * Only relevant for range columns. Match only rows where `column` is
    * mutually exclusive to `range` and there can be no element between the two
    * ranges.
    *
    * @param column - The range column to filter on
    * @param range - The range to filter with
    */
    rangeAdjacent(column, range) {
      this.url.searchParams.append(column, `adj.${range}`);
      return this;
    }
    /**
    * Only relevant for array and range columns. Match only rows where
    * `column` and `value` have an element in common.
    *
    * @param column - The array or range column to filter on
    * @param value - The array or range value to filter with
    */
    overlaps(column, value) {
      if (typeof value === "string")
        this.url.searchParams.append(column, `ov.${value}`);
      else
        this.url.searchParams.append(column, `ov.{${value.join(",")}}`);
      return this;
    }
    /**
    * Only relevant for text and tsvector columns. Match only rows where
    * `column` matches the query string in `query`.
    *
    * @param column - The text or tsvector column to filter on
    * @param query - The query text to match with
    * @param options - Named parameters
    * @param options.config - The text search configuration to use
    * @param options.type - Change how the `query` text is interpreted
    */
    textSearch(column, query, { config, type } = {}) {
      let typePart = "";
      if (type === "plain")
        typePart = "pl";
      else if (type === "phrase")
        typePart = "ph";
      else if (type === "websearch")
        typePart = "w";
      const configPart = config === void 0 ? "" : `(${config})`;
      this.url.searchParams.append(column, `${typePart}fts${configPart}.${query}`);
      return this;
    }
    /**
    * Match only rows where each column in `query` keys is equal to its
    * associated value. Shorthand for multiple `.eq()`s.
    *
    * @param query - The object to filter with, with column names as keys mapped
    * to their filter values
    */
    match(query) {
      Object.entries(query).forEach(([column, value]) => {
        this.url.searchParams.append(column, `eq.${value}`);
      });
      return this;
    }
    /**
    * Match only rows which doesn't satisfy the filter.
    *
    * Unlike most filters, `opearator` and `value` are used as-is and need to
    * follow [PostgREST
    * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
    * to make sure they are properly sanitized.
    *
    * @param column - The column to filter on
    * @param operator - The operator to be negated to filter with, following
    * PostgREST syntax
    * @param value - The value to filter with, following PostgREST syntax
    */
    not(column, operator, value) {
      this.url.searchParams.append(column, `not.${operator}.${value}`);
      return this;
    }
    /**
    * Match only rows which satisfy at least one of the filters.
    *
    * Unlike most filters, `filters` is used as-is and needs to follow [PostgREST
    * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
    * to make sure it's properly sanitized.
    *
    * It's currently not possible to do an `.or()` filter across multiple tables.
    *
    * @param filters - The filters to use, following PostgREST syntax
    * @param options - Named parameters
    * @param options.referencedTable - Set this to filter on referenced tables
    * instead of the parent table
    * @param options.foreignTable - Deprecated, use `referencedTable` instead
    */
    or(filters, { foreignTable, referencedTable = foreignTable } = {}) {
      const key = referencedTable ? `${referencedTable}.or` : "or";
      this.url.searchParams.append(key, `(${filters})`);
      return this;
    }
    /**
    * Match only rows which satisfy the filter. This is an escape hatch - you
    * should use the specific filter methods wherever possible.
    *
    * Unlike most filters, `opearator` and `value` are used as-is and need to
    * follow [PostgREST
    * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
    * to make sure they are properly sanitized.
    *
    * @param column - The column to filter on
    * @param operator - The operator to filter with, following PostgREST syntax
    * @param value - The value to filter with, following PostgREST syntax
    */
    filter(column, operator, value) {
      this.url.searchParams.append(column, `${operator}.${value}`);
      return this;
    }
  };
  var PostgrestQueryBuilder = class {
    /**
    * Creates a query builder scoped to a Postgres table or view.
    *
    * @example
    * ```ts
    * import PostgrestQueryBuilder from '@supabase/postgrest-js'
    *
    * const query = new PostgrestQueryBuilder(
    *   new URL('https://xyzcompany.supabase.co/rest/v1/users'),
    *   { headers: { apikey: 'public-anon-key' } }
    * )
    * ```
    */
    constructor(url, { headers = {}, schema, fetch: fetch$1 }) {
      this.url = url;
      this.headers = new Headers(headers);
      this.schema = schema;
      this.fetch = fetch$1;
    }
    /**
    * Clone URL and headers to prevent shared state between operations.
    */
    cloneRequestState() {
      return {
        url: new URL(this.url.toString()),
        headers: new Headers(this.headers)
      };
    }
    /**
    * Perform a SELECT query on the table or view.
    *
    * @param columns - The columns to retrieve, separated by commas. Columns can be renamed when returned with `customName:columnName`
    *
    * @param options - Named parameters
    *
    * @param options.head - When set to `true`, `data` will not be returned.
    * Useful if you only need the count.
    *
    * @param options.count - Count algorithm to use to count rows in the table or view.
    *
    * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
    * hood.
    *
    * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
    * statistics under the hood.
    *
    * `"estimated"`: Uses exact count for low numbers and planned count for high
    * numbers.
    *
    * @remarks
    * When using `count` with `.range()` or `.limit()`, the returned `count` is the total number of rows
    * that match your filters, not the number of rows in the current page. Use this to build pagination UI.
    */
    select(columns, options) {
      const { head: head2 = false, count } = options !== null && options !== void 0 ? options : {};
      const method = head2 ? "HEAD" : "GET";
      let quoted = false;
      const cleanedColumns = (columns !== null && columns !== void 0 ? columns : "*").split("").map((c) => {
        if (/\s/.test(c) && !quoted)
          return "";
        if (c === '"')
          quoted = !quoted;
        return c;
      }).join("");
      const { url, headers } = this.cloneRequestState();
      url.searchParams.set("select", cleanedColumns);
      if (count)
        headers.append("Prefer", `count=${count}`);
      return new PostgrestFilterBuilder({
        method,
        url,
        headers,
        schema: this.schema,
        fetch: this.fetch
      });
    }
    /**
    * Perform an INSERT into the table or view.
    *
    * By default, inserted rows are not returned. To return it, chain the call
    * with `.select()`.
    *
    * @param values - The values to insert. Pass an object to insert a single row
    * or an array to insert multiple rows.
    *
    * @param options - Named parameters
    *
    * @param options.count - Count algorithm to use to count inserted rows.
    *
    * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
    * hood.
    *
    * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
    * statistics under the hood.
    *
    * `"estimated"`: Uses exact count for low numbers and planned count for high
    * numbers.
    *
    * @param options.defaultToNull - Make missing fields default to `null`.
    * Otherwise, use the default value for the column. Only applies for bulk
    * inserts.
    */
    insert(values, { count, defaultToNull = true } = {}) {
      var _this$fetch;
      const method = "POST";
      const { url, headers } = this.cloneRequestState();
      if (count)
        headers.append("Prefer", `count=${count}`);
      if (!defaultToNull)
        headers.append("Prefer", `missing=default`);
      if (Array.isArray(values)) {
        const columns = values.reduce((acc, x) => acc.concat(Object.keys(x)), []);
        if (columns.length > 0) {
          const uniqueColumns = [...new Set(columns)].map((column) => `"${column}"`);
          url.searchParams.set("columns", uniqueColumns.join(","));
        }
      }
      return new PostgrestFilterBuilder({
        method,
        url,
        headers,
        schema: this.schema,
        body: values,
        fetch: (_this$fetch = this.fetch) !== null && _this$fetch !== void 0 ? _this$fetch : fetch
      });
    }
    /**
    * Perform an UPSERT on the table or view. Depending on the column(s) passed
    * to `onConflict`, `.upsert()` allows you to perform the equivalent of
    * `.insert()` if a row with the corresponding `onConflict` columns doesn't
    * exist, or if it does exist, perform an alternative action depending on
    * `ignoreDuplicates`.
    *
    * By default, upserted rows are not returned. To return it, chain the call
    * with `.select()`.
    *
    * @param values - The values to upsert with. Pass an object to upsert a
    * single row or an array to upsert multiple rows.
    *
    * @param options - Named parameters
    *
    * @param options.onConflict - Comma-separated UNIQUE column(s) to specify how
    * duplicate rows are determined. Two rows are duplicates if all the
    * `onConflict` columns are equal.
    *
    * @param options.ignoreDuplicates - If `true`, duplicate rows are ignored. If
    * `false`, duplicate rows are merged with existing rows.
    *
    * @param options.count - Count algorithm to use to count upserted rows.
    *
    * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
    * hood.
    *
    * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
    * statistics under the hood.
    *
    * `"estimated"`: Uses exact count for low numbers and planned count for high
    * numbers.
    *
    * @param options.defaultToNull - Make missing fields default to `null`.
    * Otherwise, use the default value for the column. This only applies when
    * inserting new rows, not when merging with existing rows under
    * `ignoreDuplicates: false`. This also only applies when doing bulk upserts.
    *
    * @example Upsert a single row using a unique key
    * ```ts
    * // Upserting a single row, overwriting based on the 'username' unique column
    * const { data, error } = await supabase
    *   .from('users')
    *   .upsert({ username: 'supabot' }, { onConflict: 'username' })
    *
    * // Example response:
    * // {
    * //   data: [
    * //     { id: 4, message: 'bar', username: 'supabot' }
    * //   ],
    * //   error: null
    * // }
    * ```
    *
    * @example Upsert with conflict resolution and exact row counting
    * ```ts
    * // Upserting and returning exact count
    * const { data, error, count } = await supabase
    *   .from('users')
    *   .upsert(
    *     {
    *       id: 3,
    *       message: 'foo',
    *       username: 'supabot'
    *     },
    *     {
    *       onConflict: 'username',
    *       count: 'exact'
    *     }
    *   )
    *
    * // Example response:
    * // {
    * //   data: [
    * //     {
    * //       id: 42,
    * //       handle: "saoirse",
    * //       display_name: "Saoirse"
    * //     }
    * //   ],
    * //   count: 1,
    * //   error: null
    * // }
    * ```
    */
    upsert(values, { onConflict, ignoreDuplicates = false, count, defaultToNull = true } = {}) {
      var _this$fetch2;
      const method = "POST";
      const { url, headers } = this.cloneRequestState();
      headers.append("Prefer", `resolution=${ignoreDuplicates ? "ignore" : "merge"}-duplicates`);
      if (onConflict !== void 0)
        url.searchParams.set("on_conflict", onConflict);
      if (count)
        headers.append("Prefer", `count=${count}`);
      if (!defaultToNull)
        headers.append("Prefer", "missing=default");
      if (Array.isArray(values)) {
        const columns = values.reduce((acc, x) => acc.concat(Object.keys(x)), []);
        if (columns.length > 0) {
          const uniqueColumns = [...new Set(columns)].map((column) => `"${column}"`);
          url.searchParams.set("columns", uniqueColumns.join(","));
        }
      }
      return new PostgrestFilterBuilder({
        method,
        url,
        headers,
        schema: this.schema,
        body: values,
        fetch: (_this$fetch2 = this.fetch) !== null && _this$fetch2 !== void 0 ? _this$fetch2 : fetch
      });
    }
    /**
    * Perform an UPDATE on the table or view.
    *
    * By default, updated rows are not returned. To return it, chain the call
    * with `.select()` after filters.
    *
    * @param values - The values to update with
    *
    * @param options - Named parameters
    *
    * @param options.count - Count algorithm to use to count updated rows.
    *
    * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
    * hood.
    *
    * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
    * statistics under the hood.
    *
    * `"estimated"`: Uses exact count for low numbers and planned count for high
    * numbers.
    */
    update(values, { count } = {}) {
      var _this$fetch3;
      const method = "PATCH";
      const { url, headers } = this.cloneRequestState();
      if (count)
        headers.append("Prefer", `count=${count}`);
      return new PostgrestFilterBuilder({
        method,
        url,
        headers,
        schema: this.schema,
        body: values,
        fetch: (_this$fetch3 = this.fetch) !== null && _this$fetch3 !== void 0 ? _this$fetch3 : fetch
      });
    }
    /**
    * Perform a DELETE on the table or view.
    *
    * By default, deleted rows are not returned. To return it, chain the call
    * with `.select()` after filters.
    *
    * @param options - Named parameters
    *
    * @param options.count - Count algorithm to use to count deleted rows.
    *
    * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
    * hood.
    *
    * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
    * statistics under the hood.
    *
    * `"estimated"`: Uses exact count for low numbers and planned count for high
    * numbers.
    */
    delete({ count } = {}) {
      var _this$fetch4;
      const method = "DELETE";
      const { url, headers } = this.cloneRequestState();
      if (count)
        headers.append("Prefer", `count=${count}`);
      return new PostgrestFilterBuilder({
        method,
        url,
        headers,
        schema: this.schema,
        fetch: (_this$fetch4 = this.fetch) !== null && _this$fetch4 !== void 0 ? _this$fetch4 : fetch
      });
    }
  };
  var PostgrestClient = class PostgrestClient2 {
    /**
    * Creates a PostgREST client.
    *
    * @param url - URL of the PostgREST endpoint
    * @param options - Named parameters
    * @param options.headers - Custom headers
    * @param options.schema - Postgres schema to switch to
    * @param options.fetch - Custom fetch
    * @example
    * ```ts
    * import PostgrestClient from '@supabase/postgrest-js'
    *
    * const postgrest = new PostgrestClient('https://xyzcompany.supabase.co/rest/v1', {
    *   headers: { apikey: 'public-anon-key' },
    *   schema: 'public',
    * })
    * ```
    */
    constructor(url, { headers = {}, schema, fetch: fetch$1 } = {}) {
      this.url = url;
      this.headers = new Headers(headers);
      this.schemaName = schema;
      this.fetch = fetch$1;
    }
    /**
    * Perform a query on a table or a view.
    *
    * @param relation - The table or view name to query
    */
    from(relation) {
      if (!relation || typeof relation !== "string" || relation.trim() === "")
        throw new Error("Invalid relation name: relation must be a non-empty string.");
      return new PostgrestQueryBuilder(new URL(`${this.url}/${relation}`), {
        headers: new Headers(this.headers),
        schema: this.schemaName,
        fetch: this.fetch
      });
    }
    /**
    * Select a schema to query or perform an function (rpc) call.
    *
    * The schema needs to be on the list of exposed schemas inside Supabase.
    *
    * @param schema - The schema to query
    */
    schema(schema) {
      return new PostgrestClient2(this.url, {
        headers: this.headers,
        schema,
        fetch: this.fetch
      });
    }
    /**
    * Perform a function call.
    *
    * @param fn - The function name to call
    * @param args - The arguments to pass to the function call
    * @param options - Named parameters
    * @param options.head - When set to `true`, `data` will not be returned.
    * Useful if you only need the count.
    * @param options.get - When set to `true`, the function will be called with
    * read-only access mode.
    * @param options.count - Count algorithm to use to count rows returned by the
    * function. Only applicable for [set-returning
    * functions](https://www.postgresql.org/docs/current/functions-srf.html).
    *
    * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
    * hood.
    *
    * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
    * statistics under the hood.
    *
    * `"estimated"`: Uses exact count for low numbers and planned count for high
    * numbers.
    *
    * @example
    * ```ts
    * // For cross-schema functions where type inference fails, use overrideTypes:
    * const { data } = await supabase
    *   .schema('schema_b')
    *   .rpc('function_a', {})
    *   .overrideTypes<{ id: string; user_id: string }[]>()
    * ```
    */
    rpc(fn, args = {}, { head: head2 = false, get: get2 = false, count } = {}) {
      var _this$fetch;
      let method;
      const url = new URL(`${this.url}/rpc/${fn}`);
      let body;
      const _isObject = (v) => v !== null && typeof v === "object" && (!Array.isArray(v) || v.some(_isObject));
      const _hasObjectArg = head2 && Object.values(args).some(_isObject);
      if (_hasObjectArg) {
        method = "POST";
        body = args;
      } else if (head2 || get2) {
        method = head2 ? "HEAD" : "GET";
        Object.entries(args).filter(([_, value]) => value !== void 0).map(([name, value]) => [name, Array.isArray(value) ? `{${value.join(",")}}` : `${value}`]).forEach(([name, value]) => {
          url.searchParams.append(name, value);
        });
      } else {
        method = "POST";
        body = args;
      }
      const headers = new Headers(this.headers);
      if (_hasObjectArg)
        headers.set("Prefer", count ? `count=${count},return=minimal` : "return=minimal");
      else if (count)
        headers.set("Prefer", `count=${count}`);
      return new PostgrestFilterBuilder({
        method,
        url,
        headers,
        schema: this.schemaName,
        body,
        fetch: (_this$fetch = this.fetch) !== null && _this$fetch !== void 0 ? _this$fetch : fetch
      });
    }
  };

  // ../../node_modules/@supabase/realtime-js/dist/module/lib/websocket-factory.js
  var WebSocketFactory = class {
    /**
     * Static-only utility – prevent instantiation.
     */
    constructor() {
    }
    static detectEnvironment() {
      var _a;
      if (typeof WebSocket !== "undefined") {
        return { type: "native", constructor: WebSocket };
      }
      if (typeof globalThis !== "undefined" && typeof globalThis.WebSocket !== "undefined") {
        return { type: "native", constructor: globalThis.WebSocket };
      }
      if (typeof global !== "undefined" && typeof global.WebSocket !== "undefined") {
        return { type: "native", constructor: global.WebSocket };
      }
      if (typeof globalThis !== "undefined" && typeof globalThis.WebSocketPair !== "undefined" && typeof globalThis.WebSocket === "undefined") {
        return {
          type: "cloudflare",
          error: "Cloudflare Workers detected. WebSocket clients are not supported in Cloudflare Workers.",
          workaround: "Use Cloudflare Workers WebSocket API for server-side WebSocket handling, or deploy to a different runtime."
        };
      }
      if (typeof globalThis !== "undefined" && globalThis.EdgeRuntime || typeof navigator !== "undefined" && ((_a = navigator.userAgent) === null || _a === void 0 ? void 0 : _a.includes("Vercel-Edge"))) {
        return {
          type: "unsupported",
          error: "Edge runtime detected (Vercel Edge/Netlify Edge). WebSockets are not supported in edge functions.",
          workaround: "Use serverless functions or a different deployment target for WebSocket functionality."
        };
      }
      const _process = globalThis["process"];
      if (_process) {
        const processVersions = _process["versions"];
        if (processVersions && processVersions["node"]) {
          const versionString = processVersions["node"];
          const nodeVersion = parseInt(versionString.replace(/^v/, "").split(".")[0]);
          if (nodeVersion >= 22) {
            if (typeof globalThis.WebSocket !== "undefined") {
              return { type: "native", constructor: globalThis.WebSocket };
            }
            return {
              type: "unsupported",
              error: `Node.js ${nodeVersion} detected but native WebSocket not found.`,
              workaround: "Provide a WebSocket implementation via the transport option."
            };
          }
          return {
            type: "unsupported",
            error: `Node.js ${nodeVersion} detected without native WebSocket support.`,
            workaround: 'For Node.js < 22, install "ws" package and provide it via the transport option:\nimport ws from "ws"\nnew RealtimeClient(url, { transport: ws })'
          };
        }
      }
      return {
        type: "unsupported",
        error: "Unknown JavaScript runtime without WebSocket support.",
        workaround: "Ensure you're running in a supported environment (browser, Node.js, Deno) or provide a custom WebSocket implementation."
      };
    }
    /**
     * Returns the best available WebSocket constructor for the current runtime.
     *
     * @example
     * ```ts
     * const WS = WebSocketFactory.getWebSocketConstructor()
     * const socket = new WS('wss://realtime.supabase.co/socket')
     * ```
     */
    static getWebSocketConstructor() {
      const env = this.detectEnvironment();
      if (env.constructor) {
        return env.constructor;
      }
      let errorMessage = env.error || "WebSocket not supported in this environment.";
      if (env.workaround) {
        errorMessage += `

Suggested solution: ${env.workaround}`;
      }
      throw new Error(errorMessage);
    }
    /**
     * Creates a WebSocket using the detected constructor.
     *
     * @example
     * ```ts
     * const socket = WebSocketFactory.createWebSocket('wss://realtime.supabase.co/socket')
     * ```
     */
    static createWebSocket(url, protocols) {
      const WS = this.getWebSocketConstructor();
      return new WS(url, protocols);
    }
    /**
     * Detects whether the runtime can establish WebSocket connections.
     *
     * @example
     * ```ts
     * if (!WebSocketFactory.isWebSocketSupported()) {
     *   console.warn('Falling back to long polling')
     * }
     * ```
     */
    static isWebSocketSupported() {
      try {
        const env = this.detectEnvironment();
        return env.type === "native" || env.type === "ws";
      } catch (_a) {
        return false;
      }
    }
  };
  var websocket_factory_default = WebSocketFactory;

  // ../../node_modules/@supabase/realtime-js/dist/module/lib/version.js
  var version = "2.93.3";

  // ../../node_modules/@supabase/realtime-js/dist/module/lib/constants.js
  var DEFAULT_VERSION = `realtime-js/${version}`;
  var VSN_1_0_0 = "1.0.0";
  var VSN_2_0_0 = "2.0.0";
  var DEFAULT_VSN = VSN_2_0_0;
  var DEFAULT_TIMEOUT = 1e4;
  var WS_CLOSE_NORMAL = 1e3;
  var MAX_PUSH_BUFFER_SIZE = 100;
  var SOCKET_STATES;
  (function(SOCKET_STATES2) {
    SOCKET_STATES2[SOCKET_STATES2["connecting"] = 0] = "connecting";
    SOCKET_STATES2[SOCKET_STATES2["open"] = 1] = "open";
    SOCKET_STATES2[SOCKET_STATES2["closing"] = 2] = "closing";
    SOCKET_STATES2[SOCKET_STATES2["closed"] = 3] = "closed";
  })(SOCKET_STATES || (SOCKET_STATES = {}));
  var CHANNEL_STATES;
  (function(CHANNEL_STATES2) {
    CHANNEL_STATES2["closed"] = "closed";
    CHANNEL_STATES2["errored"] = "errored";
    CHANNEL_STATES2["joined"] = "joined";
    CHANNEL_STATES2["joining"] = "joining";
    CHANNEL_STATES2["leaving"] = "leaving";
  })(CHANNEL_STATES || (CHANNEL_STATES = {}));
  var CHANNEL_EVENTS;
  (function(CHANNEL_EVENTS2) {
    CHANNEL_EVENTS2["close"] = "phx_close";
    CHANNEL_EVENTS2["error"] = "phx_error";
    CHANNEL_EVENTS2["join"] = "phx_join";
    CHANNEL_EVENTS2["reply"] = "phx_reply";
    CHANNEL_EVENTS2["leave"] = "phx_leave";
    CHANNEL_EVENTS2["access_token"] = "access_token";
  })(CHANNEL_EVENTS || (CHANNEL_EVENTS = {}));
  var TRANSPORTS;
  (function(TRANSPORTS2) {
    TRANSPORTS2["websocket"] = "websocket";
  })(TRANSPORTS || (TRANSPORTS = {}));
  var CONNECTION_STATE;
  (function(CONNECTION_STATE2) {
    CONNECTION_STATE2["Connecting"] = "connecting";
    CONNECTION_STATE2["Open"] = "open";
    CONNECTION_STATE2["Closing"] = "closing";
    CONNECTION_STATE2["Closed"] = "closed";
  })(CONNECTION_STATE || (CONNECTION_STATE = {}));

  // ../../node_modules/@supabase/realtime-js/dist/module/lib/serializer.js
  var Serializer = class {
    constructor(allowedMetadataKeys) {
      this.HEADER_LENGTH = 1;
      this.USER_BROADCAST_PUSH_META_LENGTH = 6;
      this.KINDS = { userBroadcastPush: 3, userBroadcast: 4 };
      this.BINARY_ENCODING = 0;
      this.JSON_ENCODING = 1;
      this.BROADCAST_EVENT = "broadcast";
      this.allowedMetadataKeys = [];
      this.allowedMetadataKeys = allowedMetadataKeys !== null && allowedMetadataKeys !== void 0 ? allowedMetadataKeys : [];
    }
    encode(msg, callback) {
      if (msg.event === this.BROADCAST_EVENT && !(msg.payload instanceof ArrayBuffer) && typeof msg.payload.event === "string") {
        return callback(this._binaryEncodeUserBroadcastPush(msg));
      }
      let payload = [msg.join_ref, msg.ref, msg.topic, msg.event, msg.payload];
      return callback(JSON.stringify(payload));
    }
    _binaryEncodeUserBroadcastPush(message) {
      var _a;
      if (this._isArrayBuffer((_a = message.payload) === null || _a === void 0 ? void 0 : _a.payload)) {
        return this._encodeBinaryUserBroadcastPush(message);
      } else {
        return this._encodeJsonUserBroadcastPush(message);
      }
    }
    _encodeBinaryUserBroadcastPush(message) {
      var _a, _b;
      const userPayload = (_b = (_a = message.payload) === null || _a === void 0 ? void 0 : _a.payload) !== null && _b !== void 0 ? _b : new ArrayBuffer(0);
      return this._encodeUserBroadcastPush(message, this.BINARY_ENCODING, userPayload);
    }
    _encodeJsonUserBroadcastPush(message) {
      var _a, _b;
      const userPayload = (_b = (_a = message.payload) === null || _a === void 0 ? void 0 : _a.payload) !== null && _b !== void 0 ? _b : {};
      const encoder = new TextEncoder();
      const encodedUserPayload = encoder.encode(JSON.stringify(userPayload)).buffer;
      return this._encodeUserBroadcastPush(message, this.JSON_ENCODING, encodedUserPayload);
    }
    _encodeUserBroadcastPush(message, encodingType, encodedPayload) {
      var _a, _b;
      const topic = message.topic;
      const ref = (_a = message.ref) !== null && _a !== void 0 ? _a : "";
      const joinRef = (_b = message.join_ref) !== null && _b !== void 0 ? _b : "";
      const userEvent = message.payload.event;
      const rest = this.allowedMetadataKeys ? this._pick(message.payload, this.allowedMetadataKeys) : {};
      const metadata = Object.keys(rest).length === 0 ? "" : JSON.stringify(rest);
      if (joinRef.length > 255) {
        throw new Error(`joinRef length ${joinRef.length} exceeds maximum of 255`);
      }
      if (ref.length > 255) {
        throw new Error(`ref length ${ref.length} exceeds maximum of 255`);
      }
      if (topic.length > 255) {
        throw new Error(`topic length ${topic.length} exceeds maximum of 255`);
      }
      if (userEvent.length > 255) {
        throw new Error(`userEvent length ${userEvent.length} exceeds maximum of 255`);
      }
      if (metadata.length > 255) {
        throw new Error(`metadata length ${metadata.length} exceeds maximum of 255`);
      }
      const metaLength = this.USER_BROADCAST_PUSH_META_LENGTH + joinRef.length + ref.length + topic.length + userEvent.length + metadata.length;
      const header = new ArrayBuffer(this.HEADER_LENGTH + metaLength);
      let view = new DataView(header);
      let offset = 0;
      view.setUint8(offset++, this.KINDS.userBroadcastPush);
      view.setUint8(offset++, joinRef.length);
      view.setUint8(offset++, ref.length);
      view.setUint8(offset++, topic.length);
      view.setUint8(offset++, userEvent.length);
      view.setUint8(offset++, metadata.length);
      view.setUint8(offset++, encodingType);
      Array.from(joinRef, (char) => view.setUint8(offset++, char.charCodeAt(0)));
      Array.from(ref, (char) => view.setUint8(offset++, char.charCodeAt(0)));
      Array.from(topic, (char) => view.setUint8(offset++, char.charCodeAt(0)));
      Array.from(userEvent, (char) => view.setUint8(offset++, char.charCodeAt(0)));
      Array.from(metadata, (char) => view.setUint8(offset++, char.charCodeAt(0)));
      var combined = new Uint8Array(header.byteLength + encodedPayload.byteLength);
      combined.set(new Uint8Array(header), 0);
      combined.set(new Uint8Array(encodedPayload), header.byteLength);
      return combined.buffer;
    }
    decode(rawPayload, callback) {
      if (this._isArrayBuffer(rawPayload)) {
        let result2 = this._binaryDecode(rawPayload);
        return callback(result2);
      }
      if (typeof rawPayload === "string") {
        const jsonPayload = JSON.parse(rawPayload);
        const [join_ref, ref, topic, event, payload] = jsonPayload;
        return callback({ join_ref, ref, topic, event, payload });
      }
      return callback({});
    }
    _binaryDecode(buffer) {
      const view = new DataView(buffer);
      const kind = view.getUint8(0);
      const decoder = new TextDecoder();
      switch (kind) {
        case this.KINDS.userBroadcast:
          return this._decodeUserBroadcast(buffer, view, decoder);
      }
    }
    _decodeUserBroadcast(buffer, view, decoder) {
      const topicSize = view.getUint8(1);
      const userEventSize = view.getUint8(2);
      const metadataSize = view.getUint8(3);
      const payloadEncoding = view.getUint8(4);
      let offset = this.HEADER_LENGTH + 4;
      const topic = decoder.decode(buffer.slice(offset, offset + topicSize));
      offset = offset + topicSize;
      const userEvent = decoder.decode(buffer.slice(offset, offset + userEventSize));
      offset = offset + userEventSize;
      const metadata = decoder.decode(buffer.slice(offset, offset + metadataSize));
      offset = offset + metadataSize;
      const payload = buffer.slice(offset, buffer.byteLength);
      const parsedPayload = payloadEncoding === this.JSON_ENCODING ? JSON.parse(decoder.decode(payload)) : payload;
      const data = {
        type: this.BROADCAST_EVENT,
        event: userEvent,
        payload: parsedPayload
      };
      if (metadataSize > 0) {
        data["meta"] = JSON.parse(metadata);
      }
      return { join_ref: null, ref: null, topic, event: this.BROADCAST_EVENT, payload: data };
    }
    _isArrayBuffer(buffer) {
      var _a;
      return buffer instanceof ArrayBuffer || ((_a = buffer === null || buffer === void 0 ? void 0 : buffer.constructor) === null || _a === void 0 ? void 0 : _a.name) === "ArrayBuffer";
    }
    _pick(obj, keys) {
      if (!obj || typeof obj !== "object") {
        return {};
      }
      return Object.fromEntries(Object.entries(obj).filter(([key]) => keys.includes(key)));
    }
  };

  // ../../node_modules/@supabase/realtime-js/dist/module/lib/timer.js
  var Timer = class {
    constructor(callback, timerCalc) {
      this.callback = callback;
      this.timerCalc = timerCalc;
      this.timer = void 0;
      this.tries = 0;
      this.callback = callback;
      this.timerCalc = timerCalc;
    }
    reset() {
      this.tries = 0;
      clearTimeout(this.timer);
      this.timer = void 0;
    }
    // Cancels any previous scheduleTimeout and schedules callback
    scheduleTimeout() {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.tries = this.tries + 1;
        this.callback();
      }, this.timerCalc(this.tries + 1));
    }
  };

  // ../../node_modules/@supabase/realtime-js/dist/module/lib/transformers.js
  var PostgresTypes;
  (function(PostgresTypes2) {
    PostgresTypes2["abstime"] = "abstime";
    PostgresTypes2["bool"] = "bool";
    PostgresTypes2["date"] = "date";
    PostgresTypes2["daterange"] = "daterange";
    PostgresTypes2["float4"] = "float4";
    PostgresTypes2["float8"] = "float8";
    PostgresTypes2["int2"] = "int2";
    PostgresTypes2["int4"] = "int4";
    PostgresTypes2["int4range"] = "int4range";
    PostgresTypes2["int8"] = "int8";
    PostgresTypes2["int8range"] = "int8range";
    PostgresTypes2["json"] = "json";
    PostgresTypes2["jsonb"] = "jsonb";
    PostgresTypes2["money"] = "money";
    PostgresTypes2["numeric"] = "numeric";
    PostgresTypes2["oid"] = "oid";
    PostgresTypes2["reltime"] = "reltime";
    PostgresTypes2["text"] = "text";
    PostgresTypes2["time"] = "time";
    PostgresTypes2["timestamp"] = "timestamp";
    PostgresTypes2["timestamptz"] = "timestamptz";
    PostgresTypes2["timetz"] = "timetz";
    PostgresTypes2["tsrange"] = "tsrange";
    PostgresTypes2["tstzrange"] = "tstzrange";
  })(PostgresTypes || (PostgresTypes = {}));
  var convertChangeData = (columns, record, options = {}) => {
    var _a;
    const skipTypes = (_a = options.skipTypes) !== null && _a !== void 0 ? _a : [];
    if (!record) {
      return {};
    }
    return Object.keys(record).reduce((acc, rec_key) => {
      acc[rec_key] = convertColumn(rec_key, columns, record, skipTypes);
      return acc;
    }, {});
  };
  var convertColumn = (columnName, columns, record, skipTypes) => {
    const column = columns.find((x) => x.name === columnName);
    const colType = column === null || column === void 0 ? void 0 : column.type;
    const value = record[columnName];
    if (colType && !skipTypes.includes(colType)) {
      return convertCell(colType, value);
    }
    return noop(value);
  };
  var convertCell = (type, value) => {
    if (type.charAt(0) === "_") {
      const dataType = type.slice(1, type.length);
      return toArray(value, dataType);
    }
    switch (type) {
      case PostgresTypes.bool:
        return toBoolean(value);
      case PostgresTypes.float4:
      case PostgresTypes.float8:
      case PostgresTypes.int2:
      case PostgresTypes.int4:
      case PostgresTypes.int8:
      case PostgresTypes.numeric:
      case PostgresTypes.oid:
        return toNumber(value);
      case PostgresTypes.json:
      case PostgresTypes.jsonb:
        return toJson(value);
      case PostgresTypes.timestamp:
        return toTimestampString(value);
      case PostgresTypes.abstime:
      case PostgresTypes.date:
      case PostgresTypes.daterange:
      case PostgresTypes.int4range:
      case PostgresTypes.int8range:
      case PostgresTypes.money:
      case PostgresTypes.reltime:
      case PostgresTypes.text:
      case PostgresTypes.time:
      case PostgresTypes.timestamptz:
      case PostgresTypes.timetz:
      case PostgresTypes.tsrange:
      case PostgresTypes.tstzrange:
        return noop(value);
      default:
        return noop(value);
    }
  };
  var noop = (value) => {
    return value;
  };
  var toBoolean = (value) => {
    switch (value) {
      case "t":
        return true;
      case "f":
        return false;
      default:
        return value;
    }
  };
  var toNumber = (value) => {
    if (typeof value === "string") {
      const parsedValue = parseFloat(value);
      if (!Number.isNaN(parsedValue)) {
        return parsedValue;
      }
    }
    return value;
  };
  var toJson = (value) => {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch (_a) {
        return value;
      }
    }
    return value;
  };
  var toArray = (value, type) => {
    if (typeof value !== "string") {
      return value;
    }
    const lastIdx = value.length - 1;
    const closeBrace = value[lastIdx];
    const openBrace = value[0];
    if (openBrace === "{" && closeBrace === "}") {
      let arr;
      const valTrim = value.slice(1, lastIdx);
      try {
        arr = JSON.parse("[" + valTrim + "]");
      } catch (_) {
        arr = valTrim ? valTrim.split(",") : [];
      }
      return arr.map((val) => convertCell(type, val));
    }
    return value;
  };
  var toTimestampString = (value) => {
    if (typeof value === "string") {
      return value.replace(" ", "T");
    }
    return value;
  };
  var httpEndpointURL = (socketUrl) => {
    const wsUrl = new URL(socketUrl);
    wsUrl.protocol = wsUrl.protocol.replace(/^ws/i, "http");
    wsUrl.pathname = wsUrl.pathname.replace(/\/+$/, "").replace(/\/socket\/websocket$/i, "").replace(/\/socket$/i, "").replace(/\/websocket$/i, "");
    if (wsUrl.pathname === "" || wsUrl.pathname === "/") {
      wsUrl.pathname = "/api/broadcast";
    } else {
      wsUrl.pathname = wsUrl.pathname + "/api/broadcast";
    }
    return wsUrl.href;
  };

  // ../../node_modules/@supabase/realtime-js/dist/module/lib/push.js
  var Push = class {
    /**
     * Initializes the Push
     *
     * @param channel The Channel
     * @param event The event, for example `"phx_join"`
     * @param payload The payload, for example `{user_id: 123}`
     * @param timeout The push timeout in milliseconds
     */
    constructor(channel, event, payload = {}, timeout = DEFAULT_TIMEOUT) {
      this.channel = channel;
      this.event = event;
      this.payload = payload;
      this.timeout = timeout;
      this.sent = false;
      this.timeoutTimer = void 0;
      this.ref = "";
      this.receivedResp = null;
      this.recHooks = [];
      this.refEvent = null;
    }
    resend(timeout) {
      this.timeout = timeout;
      this._cancelRefEvent();
      this.ref = "";
      this.refEvent = null;
      this.receivedResp = null;
      this.sent = false;
      this.send();
    }
    send() {
      if (this._hasReceived("timeout")) {
        return;
      }
      this.startTimeout();
      this.sent = true;
      this.channel.socket.push({
        topic: this.channel.topic,
        event: this.event,
        payload: this.payload,
        ref: this.ref,
        join_ref: this.channel._joinRef()
      });
    }
    updatePayload(payload) {
      this.payload = Object.assign(Object.assign({}, this.payload), payload);
    }
    receive(status, callback) {
      var _a;
      if (this._hasReceived(status)) {
        callback((_a = this.receivedResp) === null || _a === void 0 ? void 0 : _a.response);
      }
      this.recHooks.push({ status, callback });
      return this;
    }
    startTimeout() {
      if (this.timeoutTimer) {
        return;
      }
      this.ref = this.channel.socket._makeRef();
      this.refEvent = this.channel._replyEventName(this.ref);
      const callback = (payload) => {
        this._cancelRefEvent();
        this._cancelTimeout();
        this.receivedResp = payload;
        this._matchReceive(payload);
      };
      this.channel._on(this.refEvent, {}, callback);
      this.timeoutTimer = setTimeout(() => {
        this.trigger("timeout", {});
      }, this.timeout);
    }
    trigger(status, response) {
      if (this.refEvent)
        this.channel._trigger(this.refEvent, { status, response });
    }
    destroy() {
      this._cancelRefEvent();
      this._cancelTimeout();
    }
    _cancelRefEvent() {
      if (!this.refEvent) {
        return;
      }
      this.channel._off(this.refEvent, {});
    }
    _cancelTimeout() {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = void 0;
    }
    _matchReceive({ status, response }) {
      this.recHooks.filter((h) => h.status === status).forEach((h) => h.callback(response));
    }
    _hasReceived(status) {
      return this.receivedResp && this.receivedResp.status === status;
    }
  };

  // ../../node_modules/@supabase/realtime-js/dist/module/RealtimePresence.js
  var REALTIME_PRESENCE_LISTEN_EVENTS;
  (function(REALTIME_PRESENCE_LISTEN_EVENTS2) {
    REALTIME_PRESENCE_LISTEN_EVENTS2["SYNC"] = "sync";
    REALTIME_PRESENCE_LISTEN_EVENTS2["JOIN"] = "join";
    REALTIME_PRESENCE_LISTEN_EVENTS2["LEAVE"] = "leave";
  })(REALTIME_PRESENCE_LISTEN_EVENTS || (REALTIME_PRESENCE_LISTEN_EVENTS = {}));
  var RealtimePresence = class _RealtimePresence {
    /**
     * Creates a Presence helper that keeps the local presence state in sync with the server.
     *
     * @param channel - The realtime channel to bind to.
     * @param opts - Optional custom event names, e.g. `{ events: { state: 'state', diff: 'diff' } }`.
     *
     * @example
     * ```ts
     * const presence = new RealtimePresence(channel)
     *
     * channel.on('presence', ({ event, key }) => {
     *   console.log(`Presence ${event} on ${key}`)
     * })
     * ```
     */
    constructor(channel, opts) {
      this.channel = channel;
      this.state = {};
      this.pendingDiffs = [];
      this.joinRef = null;
      this.enabled = false;
      this.caller = {
        onJoin: () => {
        },
        onLeave: () => {
        },
        onSync: () => {
        }
      };
      const events = (opts === null || opts === void 0 ? void 0 : opts.events) || {
        state: "presence_state",
        diff: "presence_diff"
      };
      this.channel._on(events.state, {}, (newState) => {
        const { onJoin, onLeave, onSync } = this.caller;
        this.joinRef = this.channel._joinRef();
        this.state = _RealtimePresence.syncState(this.state, newState, onJoin, onLeave);
        this.pendingDiffs.forEach((diff) => {
          this.state = _RealtimePresence.syncDiff(this.state, diff, onJoin, onLeave);
        });
        this.pendingDiffs = [];
        onSync();
      });
      this.channel._on(events.diff, {}, (diff) => {
        const { onJoin, onLeave, onSync } = this.caller;
        if (this.inPendingSyncState()) {
          this.pendingDiffs.push(diff);
        } else {
          this.state = _RealtimePresence.syncDiff(this.state, diff, onJoin, onLeave);
          onSync();
        }
      });
      this.onJoin((key, currentPresences, newPresences) => {
        this.channel._trigger("presence", {
          event: "join",
          key,
          currentPresences,
          newPresences
        });
      });
      this.onLeave((key, currentPresences, leftPresences) => {
        this.channel._trigger("presence", {
          event: "leave",
          key,
          currentPresences,
          leftPresences
        });
      });
      this.onSync(() => {
        this.channel._trigger("presence", { event: "sync" });
      });
    }
    /**
     * Used to sync the list of presences on the server with the
     * client's state.
     *
     * An optional `onJoin` and `onLeave` callback can be provided to
     * react to changes in the client's local presences across
     * disconnects and reconnects with the server.
     *
     * @internal
     */
    static syncState(currentState, newState, onJoin, onLeave) {
      const state = this.cloneDeep(currentState);
      const transformedState = this.transformState(newState);
      const joins = {};
      const leaves = {};
      this.map(state, (key, presences) => {
        if (!transformedState[key]) {
          leaves[key] = presences;
        }
      });
      this.map(transformedState, (key, newPresences) => {
        const currentPresences = state[key];
        if (currentPresences) {
          const newPresenceRefs = newPresences.map((m) => m.presence_ref);
          const curPresenceRefs = currentPresences.map((m) => m.presence_ref);
          const joinedPresences = newPresences.filter((m) => curPresenceRefs.indexOf(m.presence_ref) < 0);
          const leftPresences = currentPresences.filter((m) => newPresenceRefs.indexOf(m.presence_ref) < 0);
          if (joinedPresences.length > 0) {
            joins[key] = joinedPresences;
          }
          if (leftPresences.length > 0) {
            leaves[key] = leftPresences;
          }
        } else {
          joins[key] = newPresences;
        }
      });
      return this.syncDiff(state, { joins, leaves }, onJoin, onLeave);
    }
    /**
     * Used to sync a diff of presence join and leave events from the
     * server, as they happen.
     *
     * Like `syncState`, `syncDiff` accepts optional `onJoin` and
     * `onLeave` callbacks to react to a user joining or leaving from a
     * device.
     *
     * @internal
     */
    static syncDiff(state, diff, onJoin, onLeave) {
      const { joins, leaves } = {
        joins: this.transformState(diff.joins),
        leaves: this.transformState(diff.leaves)
      };
      if (!onJoin) {
        onJoin = () => {
        };
      }
      if (!onLeave) {
        onLeave = () => {
        };
      }
      this.map(joins, (key, newPresences) => {
        var _a;
        const currentPresences = (_a = state[key]) !== null && _a !== void 0 ? _a : [];
        state[key] = this.cloneDeep(newPresences);
        if (currentPresences.length > 0) {
          const joinedPresenceRefs = state[key].map((m) => m.presence_ref);
          const curPresences = currentPresences.filter((m) => joinedPresenceRefs.indexOf(m.presence_ref) < 0);
          state[key].unshift(...curPresences);
        }
        onJoin(key, currentPresences, newPresences);
      });
      this.map(leaves, (key, leftPresences) => {
        let currentPresences = state[key];
        if (!currentPresences)
          return;
        const presenceRefsToRemove = leftPresences.map((m) => m.presence_ref);
        currentPresences = currentPresences.filter((m) => presenceRefsToRemove.indexOf(m.presence_ref) < 0);
        state[key] = currentPresences;
        onLeave(key, currentPresences, leftPresences);
        if (currentPresences.length === 0)
          delete state[key];
      });
      return state;
    }
    /** @internal */
    static map(obj, func) {
      return Object.getOwnPropertyNames(obj).map((key) => func(key, obj[key]));
    }
    /**
     * Remove 'metas' key
     * Change 'phx_ref' to 'presence_ref'
     * Remove 'phx_ref' and 'phx_ref_prev'
     *
     * @example
     * // returns {
     *  abc123: [
     *    { presence_ref: '2', user_id: 1 },
     *    { presence_ref: '3', user_id: 2 }
     *  ]
     * }
     * RealtimePresence.transformState({
     *  abc123: {
     *    metas: [
     *      { phx_ref: '2', phx_ref_prev: '1' user_id: 1 },
     *      { phx_ref: '3', user_id: 2 }
     *    ]
     *  }
     * })
     *
     * @internal
     */
    static transformState(state) {
      state = this.cloneDeep(state);
      return Object.getOwnPropertyNames(state).reduce((newState, key) => {
        const presences = state[key];
        if ("metas" in presences) {
          newState[key] = presences.metas.map((presence) => {
            presence["presence_ref"] = presence["phx_ref"];
            delete presence["phx_ref"];
            delete presence["phx_ref_prev"];
            return presence;
          });
        } else {
          newState[key] = presences;
        }
        return newState;
      }, {});
    }
    /** @internal */
    static cloneDeep(obj) {
      return JSON.parse(JSON.stringify(obj));
    }
    /** @internal */
    onJoin(callback) {
      this.caller.onJoin = callback;
    }
    /** @internal */
    onLeave(callback) {
      this.caller.onLeave = callback;
    }
    /** @internal */
    onSync(callback) {
      this.caller.onSync = callback;
    }
    /** @internal */
    inPendingSyncState() {
      return !this.joinRef || this.joinRef !== this.channel._joinRef();
    }
  };

  // ../../node_modules/@supabase/realtime-js/dist/module/RealtimeChannel.js
  var REALTIME_POSTGRES_CHANGES_LISTEN_EVENT;
  (function(REALTIME_POSTGRES_CHANGES_LISTEN_EVENT2) {
    REALTIME_POSTGRES_CHANGES_LISTEN_EVENT2["ALL"] = "*";
    REALTIME_POSTGRES_CHANGES_LISTEN_EVENT2["INSERT"] = "INSERT";
    REALTIME_POSTGRES_CHANGES_LISTEN_EVENT2["UPDATE"] = "UPDATE";
    REALTIME_POSTGRES_CHANGES_LISTEN_EVENT2["DELETE"] = "DELETE";
  })(REALTIME_POSTGRES_CHANGES_LISTEN_EVENT || (REALTIME_POSTGRES_CHANGES_LISTEN_EVENT = {}));
  var REALTIME_LISTEN_TYPES;
  (function(REALTIME_LISTEN_TYPES2) {
    REALTIME_LISTEN_TYPES2["BROADCAST"] = "broadcast";
    REALTIME_LISTEN_TYPES2["PRESENCE"] = "presence";
    REALTIME_LISTEN_TYPES2["POSTGRES_CHANGES"] = "postgres_changes";
    REALTIME_LISTEN_TYPES2["SYSTEM"] = "system";
  })(REALTIME_LISTEN_TYPES || (REALTIME_LISTEN_TYPES = {}));
  var REALTIME_SUBSCRIBE_STATES;
  (function(REALTIME_SUBSCRIBE_STATES2) {
    REALTIME_SUBSCRIBE_STATES2["SUBSCRIBED"] = "SUBSCRIBED";
    REALTIME_SUBSCRIBE_STATES2["TIMED_OUT"] = "TIMED_OUT";
    REALTIME_SUBSCRIBE_STATES2["CLOSED"] = "CLOSED";
    REALTIME_SUBSCRIBE_STATES2["CHANNEL_ERROR"] = "CHANNEL_ERROR";
  })(REALTIME_SUBSCRIBE_STATES || (REALTIME_SUBSCRIBE_STATES = {}));
  var RealtimeChannel = class _RealtimeChannel {
    /**
     * Creates a channel that can broadcast messages, sync presence, and listen to Postgres changes.
     *
     * The topic determines which realtime stream you are subscribing to. Config options let you
     * enable acknowledgement for broadcasts, presence tracking, or private channels.
     *
     * @example
     * ```ts
     * import RealtimeClient from '@supabase/realtime-js'
     *
     * const client = new RealtimeClient('https://xyzcompany.supabase.co/realtime/v1', {
     *   params: { apikey: 'public-anon-key' },
     * })
     * const channel = new RealtimeChannel('realtime:public:messages', { config: {} }, client)
     * ```
     */
    constructor(topic, params = { config: {} }, socket) {
      var _a, _b;
      this.topic = topic;
      this.params = params;
      this.socket = socket;
      this.bindings = {};
      this.state = CHANNEL_STATES.closed;
      this.joinedOnce = false;
      this.pushBuffer = [];
      this.subTopic = topic.replace(/^realtime:/i, "");
      this.params.config = Object.assign({
        broadcast: { ack: false, self: false },
        presence: { key: "", enabled: false },
        private: false
      }, params.config);
      this.timeout = this.socket.timeout;
      this.joinPush = new Push(this, CHANNEL_EVENTS.join, this.params, this.timeout);
      this.rejoinTimer = new Timer(() => this._rejoinUntilConnected(), this.socket.reconnectAfterMs);
      this.joinPush.receive("ok", () => {
        this.state = CHANNEL_STATES.joined;
        this.rejoinTimer.reset();
        this.pushBuffer.forEach((pushEvent) => pushEvent.send());
        this.pushBuffer = [];
      });
      this._onClose(() => {
        this.rejoinTimer.reset();
        this.socket.log("channel", `close ${this.topic} ${this._joinRef()}`);
        this.state = CHANNEL_STATES.closed;
        this.socket._remove(this);
      });
      this._onError((reason) => {
        if (this._isLeaving() || this._isClosed()) {
          return;
        }
        this.socket.log("channel", `error ${this.topic}`, reason);
        this.state = CHANNEL_STATES.errored;
        this.rejoinTimer.scheduleTimeout();
      });
      this.joinPush.receive("timeout", () => {
        if (!this._isJoining()) {
          return;
        }
        this.socket.log("channel", `timeout ${this.topic}`, this.joinPush.timeout);
        this.state = CHANNEL_STATES.errored;
        this.rejoinTimer.scheduleTimeout();
      });
      this.joinPush.receive("error", (reason) => {
        if (this._isLeaving() || this._isClosed()) {
          return;
        }
        this.socket.log("channel", `error ${this.topic}`, reason);
        this.state = CHANNEL_STATES.errored;
        this.rejoinTimer.scheduleTimeout();
      });
      this._on(CHANNEL_EVENTS.reply, {}, (payload, ref) => {
        this._trigger(this._replyEventName(ref), payload);
      });
      this.presence = new RealtimePresence(this);
      this.broadcastEndpointURL = httpEndpointURL(this.socket.endPoint);
      this.private = this.params.config.private || false;
      if (!this.private && ((_b = (_a = this.params.config) === null || _a === void 0 ? void 0 : _a.broadcast) === null || _b === void 0 ? void 0 : _b.replay)) {
        throw `tried to use replay on public channel '${this.topic}'. It must be a private channel.`;
      }
    }
    /** Subscribe registers your client with the server */
    subscribe(callback, timeout = this.timeout) {
      var _a, _b, _c;
      if (!this.socket.isConnected()) {
        this.socket.connect();
      }
      if (this.state == CHANNEL_STATES.closed) {
        const { config: { broadcast, presence, private: isPrivate } } = this.params;
        const postgres_changes = (_b = (_a = this.bindings.postgres_changes) === null || _a === void 0 ? void 0 : _a.map((r) => r.filter)) !== null && _b !== void 0 ? _b : [];
        const presence_enabled = !!this.bindings[REALTIME_LISTEN_TYPES.PRESENCE] && this.bindings[REALTIME_LISTEN_TYPES.PRESENCE].length > 0 || ((_c = this.params.config.presence) === null || _c === void 0 ? void 0 : _c.enabled) === true;
        const accessTokenPayload = {};
        const config = {
          broadcast,
          presence: Object.assign(Object.assign({}, presence), { enabled: presence_enabled }),
          postgres_changes,
          private: isPrivate
        };
        if (this.socket.accessTokenValue) {
          accessTokenPayload.access_token = this.socket.accessTokenValue;
        }
        this._onError((e) => callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR, e));
        this._onClose(() => callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.CLOSED));
        this.updateJoinPayload(Object.assign({ config }, accessTokenPayload));
        this.joinedOnce = true;
        this._rejoin(timeout);
        this.joinPush.receive("ok", async ({ postgres_changes: postgres_changes2 }) => {
          var _a2;
          if (!this.socket._isManualToken()) {
            this.socket.setAuth();
          }
          if (postgres_changes2 === void 0) {
            callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED);
            return;
          } else {
            const clientPostgresBindings = this.bindings.postgres_changes;
            const bindingsLen = (_a2 = clientPostgresBindings === null || clientPostgresBindings === void 0 ? void 0 : clientPostgresBindings.length) !== null && _a2 !== void 0 ? _a2 : 0;
            const newPostgresBindings = [];
            for (let i = 0; i < bindingsLen; i++) {
              const clientPostgresBinding = clientPostgresBindings[i];
              const { filter: { event, schema, table, filter } } = clientPostgresBinding;
              const serverPostgresFilter = postgres_changes2 && postgres_changes2[i];
              if (serverPostgresFilter && serverPostgresFilter.event === event && _RealtimeChannel.isFilterValueEqual(serverPostgresFilter.schema, schema) && _RealtimeChannel.isFilterValueEqual(serverPostgresFilter.table, table) && _RealtimeChannel.isFilterValueEqual(serverPostgresFilter.filter, filter)) {
                newPostgresBindings.push(Object.assign(Object.assign({}, clientPostgresBinding), { id: serverPostgresFilter.id }));
              } else {
                this.unsubscribe();
                this.state = CHANNEL_STATES.errored;
                callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR, new Error("mismatch between server and client bindings for postgres changes"));
                return;
              }
            }
            this.bindings.postgres_changes = newPostgresBindings;
            callback && callback(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED);
            return;
          }
        }).receive("error", (error) => {
          this.state = CHANNEL_STATES.errored;
          callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR, new Error(JSON.stringify(Object.values(error).join(", ") || "error")));
          return;
        }).receive("timeout", () => {
          callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.TIMED_OUT);
          return;
        });
      }
      return this;
    }
    /**
     * Returns the current presence state for this channel.
     *
     * The shape is a map keyed by presence key (for example a user id) where each entry contains the
     * tracked metadata for that user.
     */
    presenceState() {
      return this.presence.state;
    }
    /**
     * Sends the supplied payload to the presence tracker so other subscribers can see that this
     * client is online. Use `untrack` to stop broadcasting presence for the same key.
     */
    async track(payload, opts = {}) {
      return await this.send({
        type: "presence",
        event: "track",
        payload
      }, opts.timeout || this.timeout);
    }
    /**
     * Removes the current presence state for this client.
     */
    async untrack(opts = {}) {
      return await this.send({
        type: "presence",
        event: "untrack"
      }, opts);
    }
    on(type, filter, callback) {
      if (this.state === CHANNEL_STATES.joined && type === REALTIME_LISTEN_TYPES.PRESENCE) {
        this.socket.log("channel", `resubscribe to ${this.topic} due to change in presence callbacks on joined channel`);
        this.unsubscribe().then(async () => await this.subscribe());
      }
      return this._on(type, filter, callback);
    }
    /**
     * Sends a broadcast message explicitly via REST API.
     *
     * This method always uses the REST API endpoint regardless of WebSocket connection state.
     * Useful when you want to guarantee REST delivery or when gradually migrating from implicit REST fallback.
     *
     * @param event The name of the broadcast event
     * @param payload Payload to be sent (required)
     * @param opts Options including timeout
     * @returns Promise resolving to object with success status, and error details if failed
     */
    async httpSend(event, payload, opts = {}) {
      var _a;
      if (payload === void 0 || payload === null) {
        return Promise.reject("Payload is required for httpSend()");
      }
      const headers = {
        apikey: this.socket.apiKey ? this.socket.apiKey : "",
        "Content-Type": "application/json"
      };
      if (this.socket.accessTokenValue) {
        headers["Authorization"] = `Bearer ${this.socket.accessTokenValue}`;
      }
      const options = {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: [
            {
              topic: this.subTopic,
              event,
              payload,
              private: this.private
            }
          ]
        })
      };
      const response = await this._fetchWithTimeout(this.broadcastEndpointURL, options, (_a = opts.timeout) !== null && _a !== void 0 ? _a : this.timeout);
      if (response.status === 202) {
        return { success: true };
      }
      let errorMessage = response.statusText;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody.error || errorBody.message || errorMessage;
      } catch (_b) {
      }
      return Promise.reject(new Error(errorMessage));
    }
    /**
     * Sends a message into the channel.
     *
     * @param args Arguments to send to channel
     * @param args.type The type of event to send
     * @param args.event The name of the event being sent
     * @param args.payload Payload to be sent
     * @param opts Options to be used during the send process
     */
    async send(args, opts = {}) {
      var _a, _b;
      if (!this._canPush() && args.type === "broadcast") {
        console.warn("Realtime send() is automatically falling back to REST API. This behavior will be deprecated in the future. Please use httpSend() explicitly for REST delivery.");
        const { event, payload: endpoint_payload } = args;
        const headers = {
          apikey: this.socket.apiKey ? this.socket.apiKey : "",
          "Content-Type": "application/json"
        };
        if (this.socket.accessTokenValue) {
          headers["Authorization"] = `Bearer ${this.socket.accessTokenValue}`;
        }
        const options = {
          method: "POST",
          headers,
          body: JSON.stringify({
            messages: [
              {
                topic: this.subTopic,
                event,
                payload: endpoint_payload,
                private: this.private
              }
            ]
          })
        };
        try {
          const response = await this._fetchWithTimeout(this.broadcastEndpointURL, options, (_a = opts.timeout) !== null && _a !== void 0 ? _a : this.timeout);
          await ((_b = response.body) === null || _b === void 0 ? void 0 : _b.cancel());
          return response.ok ? "ok" : "error";
        } catch (error) {
          if (error.name === "AbortError") {
            return "timed out";
          } else {
            return "error";
          }
        }
      } else {
        return new Promise((resolve) => {
          var _a2, _b2, _c;
          const push = this._push(args.type, args, opts.timeout || this.timeout);
          if (args.type === "broadcast" && !((_c = (_b2 = (_a2 = this.params) === null || _a2 === void 0 ? void 0 : _a2.config) === null || _b2 === void 0 ? void 0 : _b2.broadcast) === null || _c === void 0 ? void 0 : _c.ack)) {
            resolve("ok");
          }
          push.receive("ok", () => resolve("ok"));
          push.receive("error", () => resolve("error"));
          push.receive("timeout", () => resolve("timed out"));
        });
      }
    }
    /**
     * Updates the payload that will be sent the next time the channel joins (reconnects).
     * Useful for rotating access tokens or updating config without re-creating the channel.
     */
    updateJoinPayload(payload) {
      this.joinPush.updatePayload(payload);
    }
    /**
     * Leaves the channel.
     *
     * Unsubscribes from server events, and instructs channel to terminate on server.
     * Triggers onClose() hooks.
     *
     * To receive leave acknowledgements, use the a `receive` hook to bind to the server ack, ie:
     * channel.unsubscribe().receive("ok", () => alert("left!") )
     */
    unsubscribe(timeout = this.timeout) {
      this.state = CHANNEL_STATES.leaving;
      const onClose = () => {
        this.socket.log("channel", `leave ${this.topic}`);
        this._trigger(CHANNEL_EVENTS.close, "leave", this._joinRef());
      };
      this.joinPush.destroy();
      let leavePush = null;
      return new Promise((resolve) => {
        leavePush = new Push(this, CHANNEL_EVENTS.leave, {}, timeout);
        leavePush.receive("ok", () => {
          onClose();
          resolve("ok");
        }).receive("timeout", () => {
          onClose();
          resolve("timed out");
        }).receive("error", () => {
          resolve("error");
        });
        leavePush.send();
        if (!this._canPush()) {
          leavePush.trigger("ok", {});
        }
      }).finally(() => {
        leavePush === null || leavePush === void 0 ? void 0 : leavePush.destroy();
      });
    }
    /**
     * Teardown the channel.
     *
     * Destroys and stops related timers.
     */
    teardown() {
      this.pushBuffer.forEach((push) => push.destroy());
      this.pushBuffer = [];
      this.rejoinTimer.reset();
      this.joinPush.destroy();
      this.state = CHANNEL_STATES.closed;
      this.bindings = {};
    }
    /** @internal */
    async _fetchWithTimeout(url, options, timeout) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      const response = await this.socket.fetch(url, Object.assign(Object.assign({}, options), { signal: controller.signal }));
      clearTimeout(id);
      return response;
    }
    /** @internal */
    _push(event, payload, timeout = this.timeout) {
      if (!this.joinedOnce) {
        throw `tried to push '${event}' to '${this.topic}' before joining. Use channel.subscribe() before pushing events`;
      }
      let pushEvent = new Push(this, event, payload, timeout);
      if (this._canPush()) {
        pushEvent.send();
      } else {
        this._addToPushBuffer(pushEvent);
      }
      return pushEvent;
    }
    /** @internal */
    _addToPushBuffer(pushEvent) {
      pushEvent.startTimeout();
      this.pushBuffer.push(pushEvent);
      if (this.pushBuffer.length > MAX_PUSH_BUFFER_SIZE) {
        const removedPush = this.pushBuffer.shift();
        if (removedPush) {
          removedPush.destroy();
          this.socket.log("channel", `discarded push due to buffer overflow: ${removedPush.event}`, removedPush.payload);
        }
      }
    }
    /**
     * Overridable message hook
     *
     * Receives all events for specialized message handling before dispatching to the channel callbacks.
     * Must return the payload, modified or unmodified.
     *
     * @internal
     */
    _onMessage(_event, payload, _ref) {
      return payload;
    }
    /** @internal */
    _isMember(topic) {
      return this.topic === topic;
    }
    /** @internal */
    _joinRef() {
      return this.joinPush.ref;
    }
    /** @internal */
    _trigger(type, payload, ref) {
      var _a, _b;
      const typeLower = type.toLocaleLowerCase();
      const { close, error, leave, join } = CHANNEL_EVENTS;
      const events = [close, error, leave, join];
      if (ref && events.indexOf(typeLower) >= 0 && ref !== this._joinRef()) {
        return;
      }
      let handledPayload = this._onMessage(typeLower, payload, ref);
      if (payload && !handledPayload) {
        throw "channel onMessage callbacks must return the payload, modified or unmodified";
      }
      if (["insert", "update", "delete"].includes(typeLower)) {
        (_a = this.bindings.postgres_changes) === null || _a === void 0 ? void 0 : _a.filter((bind) => {
          var _a2, _b2, _c;
          return ((_a2 = bind.filter) === null || _a2 === void 0 ? void 0 : _a2.event) === "*" || ((_c = (_b2 = bind.filter) === null || _b2 === void 0 ? void 0 : _b2.event) === null || _c === void 0 ? void 0 : _c.toLocaleLowerCase()) === typeLower;
        }).map((bind) => bind.callback(handledPayload, ref));
      } else {
        (_b = this.bindings[typeLower]) === null || _b === void 0 ? void 0 : _b.filter((bind) => {
          var _a2, _b2, _c, _d, _e, _f;
          if (["broadcast", "presence", "postgres_changes"].includes(typeLower)) {
            if ("id" in bind) {
              const bindId = bind.id;
              const bindEvent = (_a2 = bind.filter) === null || _a2 === void 0 ? void 0 : _a2.event;
              return bindId && ((_b2 = payload.ids) === null || _b2 === void 0 ? void 0 : _b2.includes(bindId)) && (bindEvent === "*" || (bindEvent === null || bindEvent === void 0 ? void 0 : bindEvent.toLocaleLowerCase()) === ((_c = payload.data) === null || _c === void 0 ? void 0 : _c.type.toLocaleLowerCase()));
            } else {
              const bindEvent = (_e = (_d = bind === null || bind === void 0 ? void 0 : bind.filter) === null || _d === void 0 ? void 0 : _d.event) === null || _e === void 0 ? void 0 : _e.toLocaleLowerCase();
              return bindEvent === "*" || bindEvent === ((_f = payload === null || payload === void 0 ? void 0 : payload.event) === null || _f === void 0 ? void 0 : _f.toLocaleLowerCase());
            }
          } else {
            return bind.type.toLocaleLowerCase() === typeLower;
          }
        }).map((bind) => {
          if (typeof handledPayload === "object" && "ids" in handledPayload) {
            const postgresChanges = handledPayload.data;
            const { schema, table, commit_timestamp, type: type2, errors } = postgresChanges;
            const enrichedPayload = {
              schema,
              table,
              commit_timestamp,
              eventType: type2,
              new: {},
              old: {},
              errors
            };
            handledPayload = Object.assign(Object.assign({}, enrichedPayload), this._getPayloadRecords(postgresChanges));
          }
          bind.callback(handledPayload, ref);
        });
      }
    }
    /** @internal */
    _isClosed() {
      return this.state === CHANNEL_STATES.closed;
    }
    /** @internal */
    _isJoined() {
      return this.state === CHANNEL_STATES.joined;
    }
    /** @internal */
    _isJoining() {
      return this.state === CHANNEL_STATES.joining;
    }
    /** @internal */
    _isLeaving() {
      return this.state === CHANNEL_STATES.leaving;
    }
    /** @internal */
    _replyEventName(ref) {
      return `chan_reply_${ref}`;
    }
    /** @internal */
    _on(type, filter, callback) {
      const typeLower = type.toLocaleLowerCase();
      const binding = {
        type: typeLower,
        filter,
        callback
      };
      if (this.bindings[typeLower]) {
        this.bindings[typeLower].push(binding);
      } else {
        this.bindings[typeLower] = [binding];
      }
      return this;
    }
    /** @internal */
    _off(type, filter) {
      const typeLower = type.toLocaleLowerCase();
      if (this.bindings[typeLower]) {
        this.bindings[typeLower] = this.bindings[typeLower].filter((bind) => {
          var _a;
          return !(((_a = bind.type) === null || _a === void 0 ? void 0 : _a.toLocaleLowerCase()) === typeLower && _RealtimeChannel.isEqual(bind.filter, filter));
        });
      }
      return this;
    }
    /** @internal */
    static isEqual(obj1, obj2) {
      if (Object.keys(obj1).length !== Object.keys(obj2).length) {
        return false;
      }
      for (const k in obj1) {
        if (obj1[k] !== obj2[k]) {
          return false;
        }
      }
      return true;
    }
    /**
     * Compares two optional filter values for equality.
     * Treats undefined, null, and empty string as equivalent empty values.
     * @internal
     */
    static isFilterValueEqual(serverValue, clientValue) {
      const normalizedServer = serverValue !== null && serverValue !== void 0 ? serverValue : void 0;
      const normalizedClient = clientValue !== null && clientValue !== void 0 ? clientValue : void 0;
      return normalizedServer === normalizedClient;
    }
    /** @internal */
    _rejoinUntilConnected() {
      this.rejoinTimer.scheduleTimeout();
      if (this.socket.isConnected()) {
        this._rejoin();
      }
    }
    /**
     * Registers a callback that will be executed when the channel closes.
     *
     * @internal
     */
    _onClose(callback) {
      this._on(CHANNEL_EVENTS.close, {}, callback);
    }
    /**
     * Registers a callback that will be executed when the channel encounteres an error.
     *
     * @internal
     */
    _onError(callback) {
      this._on(CHANNEL_EVENTS.error, {}, (reason) => callback(reason));
    }
    /**
     * Returns `true` if the socket is connected and the channel has been joined.
     *
     * @internal
     */
    _canPush() {
      return this.socket.isConnected() && this._isJoined();
    }
    /** @internal */
    _rejoin(timeout = this.timeout) {
      if (this._isLeaving()) {
        return;
      }
      this.socket._leaveOpenTopic(this.topic);
      this.state = CHANNEL_STATES.joining;
      this.joinPush.resend(timeout);
    }
    /** @internal */
    _getPayloadRecords(payload) {
      const records = {
        new: {},
        old: {}
      };
      if (payload.type === "INSERT" || payload.type === "UPDATE") {
        records.new = convertChangeData(payload.columns, payload.record);
      }
      if (payload.type === "UPDATE" || payload.type === "DELETE") {
        records.old = convertChangeData(payload.columns, payload.old_record);
      }
      return records;
    }
  };

  // ../../node_modules/@supabase/realtime-js/dist/module/RealtimeClient.js
  var noop2 = () => {
  };
  var CONNECTION_TIMEOUTS = {
    HEARTBEAT_INTERVAL: 25e3,
    RECONNECT_DELAY: 10,
    HEARTBEAT_TIMEOUT_FALLBACK: 100
  };
  var RECONNECT_INTERVALS = [1e3, 2e3, 5e3, 1e4];
  var DEFAULT_RECONNECT_FALLBACK = 1e4;
  var WORKER_SCRIPT = `
  addEventListener("message", (e) => {
    if (e.data.event === "start") {
      setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
    }
  });`;
  var RealtimeClient = class {
    /**
     * Initializes the Socket.
     *
     * @param endPoint The string WebSocket endpoint, ie, "ws://example.com/socket", "wss://example.com", "/socket" (inherited host & protocol)
     * @param httpEndpoint The string HTTP endpoint, ie, "https://example.com", "/" (inherited host & protocol)
     * @param options.transport The Websocket Transport, for example WebSocket. This can be a custom implementation
     * @param options.timeout The default timeout in milliseconds to trigger push timeouts.
     * @param options.params The optional params to pass when connecting.
     * @param options.headers Deprecated: headers cannot be set on websocket connections and this option will be removed in the future.
     * @param options.heartbeatIntervalMs The millisec interval to send a heartbeat message.
     * @param options.heartbeatCallback The optional function to handle heartbeat status and latency.
     * @param options.logger The optional function for specialized logging, ie: logger: (kind, msg, data) => { console.log(`${kind}: ${msg}`, data) }
     * @param options.logLevel Sets the log level for Realtime
     * @param options.encode The function to encode outgoing messages. Defaults to JSON: (payload, callback) => callback(JSON.stringify(payload))
     * @param options.decode The function to decode incoming messages. Defaults to Serializer's decode.
     * @param options.reconnectAfterMs he optional function that returns the millsec reconnect interval. Defaults to stepped backoff off.
     * @param options.worker Use Web Worker to set a side flow. Defaults to false.
     * @param options.workerUrl The URL of the worker script. Defaults to https://realtime.supabase.com/worker.js that includes a heartbeat event call to keep the connection alive.
     * @param options.vsn The protocol version to use when connecting. Supported versions are "1.0.0" and "2.0.0". Defaults to "2.0.0".
     * @example
     * ```ts
     * import RealtimeClient from '@supabase/realtime-js'
     *
     * const client = new RealtimeClient('https://xyzcompany.supabase.co/realtime/v1', {
     *   params: { apikey: 'public-anon-key' },
     * })
     * client.connect()
     * ```
     */
    constructor(endPoint, options) {
      var _a;
      this.accessTokenValue = null;
      this.apiKey = null;
      this._manuallySetToken = false;
      this.channels = new Array();
      this.endPoint = "";
      this.httpEndpoint = "";
      this.headers = {};
      this.params = {};
      this.timeout = DEFAULT_TIMEOUT;
      this.transport = null;
      this.heartbeatIntervalMs = CONNECTION_TIMEOUTS.HEARTBEAT_INTERVAL;
      this.heartbeatTimer = void 0;
      this.pendingHeartbeatRef = null;
      this.heartbeatCallback = noop2;
      this.ref = 0;
      this.reconnectTimer = null;
      this.vsn = DEFAULT_VSN;
      this.logger = noop2;
      this.conn = null;
      this.sendBuffer = [];
      this.serializer = new Serializer();
      this.stateChangeCallbacks = {
        open: [],
        close: [],
        error: [],
        message: []
      };
      this.accessToken = null;
      this._connectionState = "disconnected";
      this._wasManualDisconnect = false;
      this._authPromise = null;
      this._heartbeatSentAt = null;
      this._resolveFetch = (customFetch) => {
        if (customFetch) {
          return (...args) => customFetch(...args);
        }
        return (...args) => fetch(...args);
      };
      if (!((_a = options === null || options === void 0 ? void 0 : options.params) === null || _a === void 0 ? void 0 : _a.apikey)) {
        throw new Error("API key is required to connect to Realtime");
      }
      this.apiKey = options.params.apikey;
      this.endPoint = `${endPoint}/${TRANSPORTS.websocket}`;
      this.httpEndpoint = httpEndpointURL(endPoint);
      this._initializeOptions(options);
      this._setupReconnectionTimer();
      this.fetch = this._resolveFetch(options === null || options === void 0 ? void 0 : options.fetch);
    }
    /**
     * Connects the socket, unless already connected.
     */
    connect() {
      if (this.isConnecting() || this.isDisconnecting() || this.conn !== null && this.isConnected()) {
        return;
      }
      this._setConnectionState("connecting");
      if (this.accessToken && !this._authPromise) {
        this._setAuthSafely("connect");
      }
      if (this.transport) {
        this.conn = new this.transport(this.endpointURL());
      } else {
        try {
          this.conn = websocket_factory_default.createWebSocket(this.endpointURL());
        } catch (error) {
          this._setConnectionState("disconnected");
          const errorMessage = error.message;
          if (errorMessage.includes("Node.js")) {
            throw new Error(`${errorMessage}

To use Realtime in Node.js, you need to provide a WebSocket implementation:

Option 1: Use Node.js 22+ which has native WebSocket support
Option 2: Install and provide the "ws" package:

  npm install ws

  import ws from "ws"
  const client = new RealtimeClient(url, {
    ...options,
    transport: ws
  })`);
          }
          throw new Error(`WebSocket not available: ${errorMessage}`);
        }
      }
      this._setupConnectionHandlers();
    }
    /**
     * Returns the URL of the websocket.
     * @returns string The URL of the websocket.
     */
    endpointURL() {
      return this._appendParams(this.endPoint, Object.assign({}, this.params, { vsn: this.vsn }));
    }
    /**
     * Disconnects the socket.
     *
     * @param code A numeric status code to send on disconnect.
     * @param reason A custom reason for the disconnect.
     */
    disconnect(code, reason) {
      if (this.isDisconnecting()) {
        return;
      }
      this._setConnectionState("disconnecting", true);
      if (this.conn) {
        const fallbackTimer = setTimeout(() => {
          this._setConnectionState("disconnected");
        }, 100);
        this.conn.onclose = () => {
          clearTimeout(fallbackTimer);
          this._setConnectionState("disconnected");
        };
        if (typeof this.conn.close === "function") {
          if (code) {
            this.conn.close(code, reason !== null && reason !== void 0 ? reason : "");
          } else {
            this.conn.close();
          }
        }
        this._teardownConnection();
      } else {
        this._setConnectionState("disconnected");
      }
    }
    /**
     * Returns all created channels
     */
    getChannels() {
      return this.channels;
    }
    /**
     * Unsubscribes and removes a single channel
     * @param channel A RealtimeChannel instance
     */
    async removeChannel(channel) {
      const status = await channel.unsubscribe();
      if (this.channels.length === 0) {
        this.disconnect();
      }
      return status;
    }
    /**
     * Unsubscribes and removes all channels
     */
    async removeAllChannels() {
      const values_1 = await Promise.all(this.channels.map((channel) => channel.unsubscribe()));
      this.channels = [];
      this.disconnect();
      return values_1;
    }
    /**
     * Logs the message.
     *
     * For customized logging, `this.logger` can be overridden.
     */
    log(kind, msg, data) {
      this.logger(kind, msg, data);
    }
    /**
     * Returns the current state of the socket.
     */
    connectionState() {
      switch (this.conn && this.conn.readyState) {
        case SOCKET_STATES.connecting:
          return CONNECTION_STATE.Connecting;
        case SOCKET_STATES.open:
          return CONNECTION_STATE.Open;
        case SOCKET_STATES.closing:
          return CONNECTION_STATE.Closing;
        default:
          return CONNECTION_STATE.Closed;
      }
    }
    /**
     * Returns `true` is the connection is open.
     */
    isConnected() {
      return this.connectionState() === CONNECTION_STATE.Open;
    }
    /**
     * Returns `true` if the connection is currently connecting.
     */
    isConnecting() {
      return this._connectionState === "connecting";
    }
    /**
     * Returns `true` if the connection is currently disconnecting.
     */
    isDisconnecting() {
      return this._connectionState === "disconnecting";
    }
    /**
     * Creates (or reuses) a {@link RealtimeChannel} for the provided topic.
     *
     * Topics are automatically prefixed with `realtime:` to match the Realtime service.
     * If a channel with the same topic already exists it will be returned instead of creating
     * a duplicate connection.
     */
    channel(topic, params = { config: {} }) {
      const realtimeTopic = `realtime:${topic}`;
      const exists = this.getChannels().find((c) => c.topic === realtimeTopic);
      if (!exists) {
        const chan = new RealtimeChannel(`realtime:${topic}`, params, this);
        this.channels.push(chan);
        return chan;
      } else {
        return exists;
      }
    }
    /**
     * Push out a message if the socket is connected.
     *
     * If the socket is not connected, the message gets enqueued within a local buffer, and sent out when a connection is next established.
     */
    push(data) {
      const { topic, event, payload, ref } = data;
      const callback = () => {
        this.encode(data, (result2) => {
          var _a;
          (_a = this.conn) === null || _a === void 0 ? void 0 : _a.send(result2);
        });
      };
      this.log("push", `${topic} ${event} (${ref})`, payload);
      if (this.isConnected()) {
        callback();
      } else {
        this.sendBuffer.push(callback);
      }
    }
    /**
     * Sets the JWT access token used for channel subscription authorization and Realtime RLS.
     *
     * If param is null it will use the `accessToken` callback function or the token set on the client.
     *
     * On callback used, it will set the value of the token internal to the client.
     *
     * When a token is explicitly provided, it will be preserved across channel operations
     * (including removeChannel and resubscribe). The `accessToken` callback will not be
     * invoked until `setAuth()` is called without arguments.
     *
     * @param token A JWT string to override the token set on the client.
     *
     * @example
     * // Use a manual token (preserved across resubscribes, ignores accessToken callback)
     * client.realtime.setAuth('my-custom-jwt')
     *
     * // Switch back to using the accessToken callback
     * client.realtime.setAuth()
     */
    async setAuth(token = null) {
      this._authPromise = this._performAuth(token);
      try {
        await this._authPromise;
      } finally {
        this._authPromise = null;
      }
    }
    /**
     * Returns true if the current access token was explicitly set via setAuth(token),
     * false if it was obtained via the accessToken callback.
     * @internal
     */
    _isManualToken() {
      return this._manuallySetToken;
    }
    /**
     * Sends a heartbeat message if the socket is connected.
     */
    async sendHeartbeat() {
      var _a;
      if (!this.isConnected()) {
        try {
          this.heartbeatCallback("disconnected");
        } catch (e) {
          this.log("error", "error in heartbeat callback", e);
        }
        return;
      }
      if (this.pendingHeartbeatRef) {
        this.pendingHeartbeatRef = null;
        this._heartbeatSentAt = null;
        this.log("transport", "heartbeat timeout. Attempting to re-establish connection");
        try {
          this.heartbeatCallback("timeout");
        } catch (e) {
          this.log("error", "error in heartbeat callback", e);
        }
        this._wasManualDisconnect = false;
        (_a = this.conn) === null || _a === void 0 ? void 0 : _a.close(WS_CLOSE_NORMAL, "heartbeat timeout");
        setTimeout(() => {
          var _a2;
          if (!this.isConnected()) {
            (_a2 = this.reconnectTimer) === null || _a2 === void 0 ? void 0 : _a2.scheduleTimeout();
          }
        }, CONNECTION_TIMEOUTS.HEARTBEAT_TIMEOUT_FALLBACK);
        return;
      }
      this._heartbeatSentAt = Date.now();
      this.pendingHeartbeatRef = this._makeRef();
      this.push({
        topic: "phoenix",
        event: "heartbeat",
        payload: {},
        ref: this.pendingHeartbeatRef
      });
      try {
        this.heartbeatCallback("sent");
      } catch (e) {
        this.log("error", "error in heartbeat callback", e);
      }
      this._setAuthSafely("heartbeat");
    }
    /**
     * Sets a callback that receives lifecycle events for internal heartbeat messages.
     * Useful for instrumenting connection health (e.g. sent/ok/timeout/disconnected).
     */
    onHeartbeat(callback) {
      this.heartbeatCallback = callback;
    }
    /**
     * Flushes send buffer
     */
    flushSendBuffer() {
      if (this.isConnected() && this.sendBuffer.length > 0) {
        this.sendBuffer.forEach((callback) => callback());
        this.sendBuffer = [];
      }
    }
    /**
     * Return the next message ref, accounting for overflows
     *
     * @internal
     */
    _makeRef() {
      let newRef = this.ref + 1;
      if (newRef === this.ref) {
        this.ref = 0;
      } else {
        this.ref = newRef;
      }
      return this.ref.toString();
    }
    /**
     * Unsubscribe from channels with the specified topic.
     *
     * @internal
     */
    _leaveOpenTopic(topic) {
      let dupChannel = this.channels.find((c) => c.topic === topic && (c._isJoined() || c._isJoining()));
      if (dupChannel) {
        this.log("transport", `leaving duplicate topic "${topic}"`);
        dupChannel.unsubscribe();
      }
    }
    /**
     * Removes a subscription from the socket.
     *
     * @param channel An open subscription.
     *
     * @internal
     */
    _remove(channel) {
      this.channels = this.channels.filter((c) => c.topic !== channel.topic);
    }
    /** @internal */
    _onConnMessage(rawMessage) {
      this.decode(rawMessage.data, (msg) => {
        if (msg.topic === "phoenix" && msg.event === "phx_reply" && msg.ref && msg.ref === this.pendingHeartbeatRef) {
          const latency = this._heartbeatSentAt ? Date.now() - this._heartbeatSentAt : void 0;
          try {
            this.heartbeatCallback(msg.payload.status === "ok" ? "ok" : "error", latency);
          } catch (e) {
            this.log("error", "error in heartbeat callback", e);
          }
          this._heartbeatSentAt = null;
          this.pendingHeartbeatRef = null;
        }
        const { topic, event, payload, ref } = msg;
        const refString = ref ? `(${ref})` : "";
        const status = payload.status || "";
        this.log("receive", `${status} ${topic} ${event} ${refString}`.trim(), payload);
        this.channels.filter((channel) => channel._isMember(topic)).forEach((channel) => channel._trigger(event, payload, ref));
        this._triggerStateCallbacks("message", msg);
      });
    }
    /**
     * Clear specific timer
     * @internal
     */
    _clearTimer(timer) {
      var _a;
      if (timer === "heartbeat" && this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = void 0;
      } else if (timer === "reconnect") {
        (_a = this.reconnectTimer) === null || _a === void 0 ? void 0 : _a.reset();
      }
    }
    /**
     * Clear all timers
     * @internal
     */
    _clearAllTimers() {
      this._clearTimer("heartbeat");
      this._clearTimer("reconnect");
    }
    /**
     * Setup connection handlers for WebSocket events
     * @internal
     */
    _setupConnectionHandlers() {
      if (!this.conn)
        return;
      if ("binaryType" in this.conn) {
        ;
        this.conn.binaryType = "arraybuffer";
      }
      this.conn.onopen = () => this._onConnOpen();
      this.conn.onerror = (error) => this._onConnError(error);
      this.conn.onmessage = (event) => this._onConnMessage(event);
      this.conn.onclose = (event) => this._onConnClose(event);
      if (this.conn.readyState === SOCKET_STATES.open) {
        this._onConnOpen();
      }
    }
    /**
     * Teardown connection and cleanup resources
     * @internal
     */
    _teardownConnection() {
      if (this.conn) {
        if (this.conn.readyState === SOCKET_STATES.open || this.conn.readyState === SOCKET_STATES.connecting) {
          try {
            this.conn.close();
          } catch (e) {
            this.log("error", "Error closing connection", e);
          }
        }
        this.conn.onopen = null;
        this.conn.onerror = null;
        this.conn.onmessage = null;
        this.conn.onclose = null;
        this.conn = null;
      }
      this._clearAllTimers();
      this._terminateWorker();
      this.channels.forEach((channel) => channel.teardown());
    }
    /** @internal */
    _onConnOpen() {
      this._setConnectionState("connected");
      this.log("transport", `connected to ${this.endpointURL()}`);
      const authPromise = this._authPromise || (this.accessToken && !this.accessTokenValue ? this.setAuth() : Promise.resolve());
      authPromise.then(() => {
        this.flushSendBuffer();
      }).catch((e) => {
        this.log("error", "error waiting for auth on connect", e);
        this.flushSendBuffer();
      });
      this._clearTimer("reconnect");
      if (!this.worker) {
        this._startHeartbeat();
      } else {
        if (!this.workerRef) {
          this._startWorkerHeartbeat();
        }
      }
      this._triggerStateCallbacks("open");
    }
    /** @internal */
    _startHeartbeat() {
      this.heartbeatTimer && clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), this.heartbeatIntervalMs);
    }
    /** @internal */
    _startWorkerHeartbeat() {
      if (this.workerUrl) {
        this.log("worker", `starting worker for from ${this.workerUrl}`);
      } else {
        this.log("worker", `starting default worker`);
      }
      const objectUrl = this._workerObjectUrl(this.workerUrl);
      this.workerRef = new Worker(objectUrl);
      this.workerRef.onerror = (error) => {
        this.log("worker", "worker error", error.message);
        this._terminateWorker();
      };
      this.workerRef.onmessage = (event) => {
        if (event.data.event === "keepAlive") {
          this.sendHeartbeat();
        }
      };
      this.workerRef.postMessage({
        event: "start",
        interval: this.heartbeatIntervalMs
      });
    }
    /**
     * Terminate the Web Worker and clear the reference
     * @internal
     */
    _terminateWorker() {
      if (this.workerRef) {
        this.log("worker", "terminating worker");
        this.workerRef.terminate();
        this.workerRef = void 0;
      }
    }
    /** @internal */
    _onConnClose(event) {
      var _a;
      this._setConnectionState("disconnected");
      this.log("transport", "close", event);
      this._triggerChanError();
      this._clearTimer("heartbeat");
      if (!this._wasManualDisconnect) {
        (_a = this.reconnectTimer) === null || _a === void 0 ? void 0 : _a.scheduleTimeout();
      }
      this._triggerStateCallbacks("close", event);
    }
    /** @internal */
    _onConnError(error) {
      this._setConnectionState("disconnected");
      this.log("transport", `${error}`);
      this._triggerChanError();
      this._triggerStateCallbacks("error", error);
      try {
        this.heartbeatCallback("error");
      } catch (e) {
        this.log("error", "error in heartbeat callback", e);
      }
    }
    /** @internal */
    _triggerChanError() {
      this.channels.forEach((channel) => channel._trigger(CHANNEL_EVENTS.error));
    }
    /** @internal */
    _appendParams(url, params) {
      if (Object.keys(params).length === 0) {
        return url;
      }
      const prefix = url.match(/\?/) ? "&" : "?";
      const query = new URLSearchParams(params);
      return `${url}${prefix}${query}`;
    }
    _workerObjectUrl(url) {
      let result_url;
      if (url) {
        result_url = url;
      } else {
        const blob = new Blob([WORKER_SCRIPT], { type: "application/javascript" });
        result_url = URL.createObjectURL(blob);
      }
      return result_url;
    }
    /**
     * Set connection state with proper state management
     * @internal
     */
    _setConnectionState(state, manual = false) {
      this._connectionState = state;
      if (state === "connecting") {
        this._wasManualDisconnect = false;
      } else if (state === "disconnecting") {
        this._wasManualDisconnect = manual;
      }
    }
    /**
     * Perform the actual auth operation
     * @internal
     */
    async _performAuth(token = null) {
      let tokenToSend;
      let isManualToken = false;
      if (token) {
        tokenToSend = token;
        isManualToken = true;
      } else if (this.accessToken) {
        try {
          tokenToSend = await this.accessToken();
        } catch (e) {
          this.log("error", "Error fetching access token from callback", e);
          tokenToSend = this.accessTokenValue;
        }
      } else {
        tokenToSend = this.accessTokenValue;
      }
      if (isManualToken) {
        this._manuallySetToken = true;
      } else if (this.accessToken) {
        this._manuallySetToken = false;
      }
      if (this.accessTokenValue != tokenToSend) {
        this.accessTokenValue = tokenToSend;
        this.channels.forEach((channel) => {
          const payload = {
            access_token: tokenToSend,
            version: DEFAULT_VERSION
          };
          tokenToSend && channel.updateJoinPayload(payload);
          if (channel.joinedOnce && channel._isJoined()) {
            channel._push(CHANNEL_EVENTS.access_token, {
              access_token: tokenToSend
            });
          }
        });
      }
    }
    /**
     * Wait for any in-flight auth operations to complete
     * @internal
     */
    async _waitForAuthIfNeeded() {
      if (this._authPromise) {
        await this._authPromise;
      }
    }
    /**
     * Safely call setAuth with standardized error handling
     * @internal
     */
    _setAuthSafely(context = "general") {
      if (!this._isManualToken()) {
        this.setAuth().catch((e) => {
          this.log("error", `Error setting auth in ${context}`, e);
        });
      }
    }
    /**
     * Trigger state change callbacks with proper error handling
     * @internal
     */
    _triggerStateCallbacks(event, data) {
      try {
        this.stateChangeCallbacks[event].forEach((callback) => {
          try {
            callback(data);
          } catch (e) {
            this.log("error", `error in ${event} callback`, e);
          }
        });
      } catch (e) {
        this.log("error", `error triggering ${event} callbacks`, e);
      }
    }
    /**
     * Setup reconnection timer with proper configuration
     * @internal
     */
    _setupReconnectionTimer() {
      this.reconnectTimer = new Timer(async () => {
        setTimeout(async () => {
          await this._waitForAuthIfNeeded();
          if (!this.isConnected()) {
            this.connect();
          }
        }, CONNECTION_TIMEOUTS.RECONNECT_DELAY);
      }, this.reconnectAfterMs);
    }
    /**
     * Initialize client options with defaults
     * @internal
     */
    _initializeOptions(options) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
      this.transport = (_a = options === null || options === void 0 ? void 0 : options.transport) !== null && _a !== void 0 ? _a : null;
      this.timeout = (_b = options === null || options === void 0 ? void 0 : options.timeout) !== null && _b !== void 0 ? _b : DEFAULT_TIMEOUT;
      this.heartbeatIntervalMs = (_c = options === null || options === void 0 ? void 0 : options.heartbeatIntervalMs) !== null && _c !== void 0 ? _c : CONNECTION_TIMEOUTS.HEARTBEAT_INTERVAL;
      this.worker = (_d = options === null || options === void 0 ? void 0 : options.worker) !== null && _d !== void 0 ? _d : false;
      this.accessToken = (_e = options === null || options === void 0 ? void 0 : options.accessToken) !== null && _e !== void 0 ? _e : null;
      this.heartbeatCallback = (_f = options === null || options === void 0 ? void 0 : options.heartbeatCallback) !== null && _f !== void 0 ? _f : noop2;
      this.vsn = (_g = options === null || options === void 0 ? void 0 : options.vsn) !== null && _g !== void 0 ? _g : DEFAULT_VSN;
      if (options === null || options === void 0 ? void 0 : options.params)
        this.params = options.params;
      if (options === null || options === void 0 ? void 0 : options.logger)
        this.logger = options.logger;
      if ((options === null || options === void 0 ? void 0 : options.logLevel) || (options === null || options === void 0 ? void 0 : options.log_level)) {
        this.logLevel = options.logLevel || options.log_level;
        this.params = Object.assign(Object.assign({}, this.params), { log_level: this.logLevel });
      }
      this.reconnectAfterMs = (_h = options === null || options === void 0 ? void 0 : options.reconnectAfterMs) !== null && _h !== void 0 ? _h : (tries) => {
        return RECONNECT_INTERVALS[tries - 1] || DEFAULT_RECONNECT_FALLBACK;
      };
      switch (this.vsn) {
        case VSN_1_0_0:
          this.encode = (_j = options === null || options === void 0 ? void 0 : options.encode) !== null && _j !== void 0 ? _j : (payload, callback) => {
            return callback(JSON.stringify(payload));
          };
          this.decode = (_k = options === null || options === void 0 ? void 0 : options.decode) !== null && _k !== void 0 ? _k : (payload, callback) => {
            return callback(JSON.parse(payload));
          };
          break;
        case VSN_2_0_0:
          this.encode = (_l = options === null || options === void 0 ? void 0 : options.encode) !== null && _l !== void 0 ? _l : this.serializer.encode.bind(this.serializer);
          this.decode = (_m = options === null || options === void 0 ? void 0 : options.decode) !== null && _m !== void 0 ? _m : this.serializer.decode.bind(this.serializer);
          break;
        default:
          throw new Error(`Unsupported serializer version: ${this.vsn}`);
      }
      if (this.worker) {
        if (typeof window !== "undefined" && !window.Worker) {
          throw new Error("Web Worker is not supported");
        }
        this.workerUrl = options === null || options === void 0 ? void 0 : options.workerUrl;
      }
    }
  };

  // ../../node_modules/iceberg-js/dist/index.mjs
  var IcebergError = class extends Error {
    constructor(message, opts) {
      super(message);
      this.name = "IcebergError";
      this.status = opts.status;
      this.icebergType = opts.icebergType;
      this.icebergCode = opts.icebergCode;
      this.details = opts.details;
      this.isCommitStateUnknown = opts.icebergType === "CommitStateUnknownException" || [500, 502, 504].includes(opts.status) && opts.icebergType?.includes("CommitState") === true;
    }
    /**
     * Returns true if the error is a 404 Not Found error.
     */
    isNotFound() {
      return this.status === 404;
    }
    /**
     * Returns true if the error is a 409 Conflict error.
     */
    isConflict() {
      return this.status === 409;
    }
    /**
     * Returns true if the error is a 419 Authentication Timeout error.
     */
    isAuthenticationTimeout() {
      return this.status === 419;
    }
  };
  function buildUrl(baseUrl, path, query) {
    const url = new URL(path, baseUrl);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== void 0) {
          url.searchParams.set(key, value);
        }
      }
    }
    return url.toString();
  }
  async function buildAuthHeaders(auth) {
    if (!auth || auth.type === "none") {
      return {};
    }
    if (auth.type === "bearer") {
      return { Authorization: `Bearer ${auth.token}` };
    }
    if (auth.type === "header") {
      return { [auth.name]: auth.value };
    }
    if (auth.type === "custom") {
      return await auth.getHeaders();
    }
    return {};
  }
  function createFetchClient(options) {
    const fetchFn = options.fetchImpl ?? globalThis.fetch;
    return {
      async request({
        method,
        path,
        query,
        body,
        headers
      }) {
        const url = buildUrl(options.baseUrl, path, query);
        const authHeaders = await buildAuthHeaders(options.auth);
        const res = await fetchFn(url, {
          method,
          headers: {
            ...body ? { "Content-Type": "application/json" } : {},
            ...authHeaders,
            ...headers
          },
          body: body ? JSON.stringify(body) : void 0
        });
        const text = await res.text();
        const isJson = (res.headers.get("content-type") || "").includes("application/json");
        const data = isJson && text ? JSON.parse(text) : text;
        if (!res.ok) {
          const errBody = isJson ? data : void 0;
          const errorDetail = errBody?.error;
          throw new IcebergError(
            errorDetail?.message ?? `Request failed with status ${res.status}`,
            {
              status: res.status,
              icebergType: errorDetail?.type,
              icebergCode: errorDetail?.code,
              details: errBody
            }
          );
        }
        return { status: res.status, headers: res.headers, data };
      }
    };
  }
  function namespaceToPath(namespace) {
    return namespace.join("");
  }
  var NamespaceOperations = class {
    constructor(client, prefix = "") {
      this.client = client;
      this.prefix = prefix;
    }
    async listNamespaces(parent) {
      const query = parent ? { parent: namespaceToPath(parent.namespace) } : void 0;
      const response = await this.client.request({
        method: "GET",
        path: `${this.prefix}/namespaces`,
        query
      });
      return response.data.namespaces.map((ns) => ({ namespace: ns }));
    }
    async createNamespace(id, metadata) {
      const request = {
        namespace: id.namespace,
        properties: metadata?.properties
      };
      const response = await this.client.request({
        method: "POST",
        path: `${this.prefix}/namespaces`,
        body: request
      });
      return response.data;
    }
    async dropNamespace(id) {
      await this.client.request({
        method: "DELETE",
        path: `${this.prefix}/namespaces/${namespaceToPath(id.namespace)}`
      });
    }
    async loadNamespaceMetadata(id) {
      const response = await this.client.request({
        method: "GET",
        path: `${this.prefix}/namespaces/${namespaceToPath(id.namespace)}`
      });
      return {
        properties: response.data.properties
      };
    }
    async namespaceExists(id) {
      try {
        await this.client.request({
          method: "HEAD",
          path: `${this.prefix}/namespaces/${namespaceToPath(id.namespace)}`
        });
        return true;
      } catch (error) {
        if (error instanceof IcebergError && error.status === 404) {
          return false;
        }
        throw error;
      }
    }
    async createNamespaceIfNotExists(id, metadata) {
      try {
        return await this.createNamespace(id, metadata);
      } catch (error) {
        if (error instanceof IcebergError && error.status === 409) {
          return;
        }
        throw error;
      }
    }
  };
  function namespaceToPath2(namespace) {
    return namespace.join("");
  }
  var TableOperations = class {
    constructor(client, prefix = "", accessDelegation) {
      this.client = client;
      this.prefix = prefix;
      this.accessDelegation = accessDelegation;
    }
    async listTables(namespace) {
      const response = await this.client.request({
        method: "GET",
        path: `${this.prefix}/namespaces/${namespaceToPath2(namespace.namespace)}/tables`
      });
      return response.data.identifiers;
    }
    async createTable(namespace, request) {
      const headers = {};
      if (this.accessDelegation) {
        headers["X-Iceberg-Access-Delegation"] = this.accessDelegation;
      }
      const response = await this.client.request({
        method: "POST",
        path: `${this.prefix}/namespaces/${namespaceToPath2(namespace.namespace)}/tables`,
        body: request,
        headers
      });
      return response.data.metadata;
    }
    async updateTable(id, request) {
      const response = await this.client.request({
        method: "POST",
        path: `${this.prefix}/namespaces/${namespaceToPath2(id.namespace)}/tables/${id.name}`,
        body: request
      });
      return {
        "metadata-location": response.data["metadata-location"],
        metadata: response.data.metadata
      };
    }
    async dropTable(id, options) {
      await this.client.request({
        method: "DELETE",
        path: `${this.prefix}/namespaces/${namespaceToPath2(id.namespace)}/tables/${id.name}`,
        query: { purgeRequested: String(options?.purge ?? false) }
      });
    }
    async loadTable(id) {
      const headers = {};
      if (this.accessDelegation) {
        headers["X-Iceberg-Access-Delegation"] = this.accessDelegation;
      }
      const response = await this.client.request({
        method: "GET",
        path: `${this.prefix}/namespaces/${namespaceToPath2(id.namespace)}/tables/${id.name}`,
        headers
      });
      return response.data.metadata;
    }
    async tableExists(id) {
      const headers = {};
      if (this.accessDelegation) {
        headers["X-Iceberg-Access-Delegation"] = this.accessDelegation;
      }
      try {
        await this.client.request({
          method: "HEAD",
          path: `${this.prefix}/namespaces/${namespaceToPath2(id.namespace)}/tables/${id.name}`,
          headers
        });
        return true;
      } catch (error) {
        if (error instanceof IcebergError && error.status === 404) {
          return false;
        }
        throw error;
      }
    }
    async createTableIfNotExists(namespace, request) {
      try {
        return await this.createTable(namespace, request);
      } catch (error) {
        if (error instanceof IcebergError && error.status === 409) {
          return await this.loadTable({ namespace: namespace.namespace, name: request.name });
        }
        throw error;
      }
    }
  };
  var IcebergRestCatalog = class {
    /**
     * Creates a new Iceberg REST Catalog client.
     *
     * @param options - Configuration options for the catalog client
     */
    constructor(options) {
      let prefix = "v1";
      if (options.catalogName) {
        prefix += `/${options.catalogName}`;
      }
      const baseUrl = options.baseUrl.endsWith("/") ? options.baseUrl : `${options.baseUrl}/`;
      this.client = createFetchClient({
        baseUrl,
        auth: options.auth,
        fetchImpl: options.fetch
      });
      this.accessDelegation = options.accessDelegation?.join(",");
      this.namespaceOps = new NamespaceOperations(this.client, prefix);
      this.tableOps = new TableOperations(this.client, prefix, this.accessDelegation);
    }
    /**
     * Lists all namespaces in the catalog.
     *
     * @param parent - Optional parent namespace to list children under
     * @returns Array of namespace identifiers
     *
     * @example
     * ```typescript
     * // List all top-level namespaces
     * const namespaces = await catalog.listNamespaces();
     *
     * // List namespaces under a parent
     * const children = await catalog.listNamespaces({ namespace: ['analytics'] });
     * ```
     */
    async listNamespaces(parent) {
      return this.namespaceOps.listNamespaces(parent);
    }
    /**
     * Creates a new namespace in the catalog.
     *
     * @param id - Namespace identifier to create
     * @param metadata - Optional metadata properties for the namespace
     * @returns Response containing the created namespace and its properties
     *
     * @example
     * ```typescript
     * const response = await catalog.createNamespace(
     *   { namespace: ['analytics'] },
     *   { properties: { owner: 'data-team' } }
     * );
     * console.log(response.namespace); // ['analytics']
     * console.log(response.properties); // { owner: 'data-team', ... }
     * ```
     */
    async createNamespace(id, metadata) {
      return this.namespaceOps.createNamespace(id, metadata);
    }
    /**
     * Drops a namespace from the catalog.
     *
     * The namespace must be empty (contain no tables) before it can be dropped.
     *
     * @param id - Namespace identifier to drop
     *
     * @example
     * ```typescript
     * await catalog.dropNamespace({ namespace: ['analytics'] });
     * ```
     */
    async dropNamespace(id) {
      await this.namespaceOps.dropNamespace(id);
    }
    /**
     * Loads metadata for a namespace.
     *
     * @param id - Namespace identifier to load
     * @returns Namespace metadata including properties
     *
     * @example
     * ```typescript
     * const metadata = await catalog.loadNamespaceMetadata({ namespace: ['analytics'] });
     * console.log(metadata.properties);
     * ```
     */
    async loadNamespaceMetadata(id) {
      return this.namespaceOps.loadNamespaceMetadata(id);
    }
    /**
     * Lists all tables in a namespace.
     *
     * @param namespace - Namespace identifier to list tables from
     * @returns Array of table identifiers
     *
     * @example
     * ```typescript
     * const tables = await catalog.listTables({ namespace: ['analytics'] });
     * console.log(tables); // [{ namespace: ['analytics'], name: 'events' }, ...]
     * ```
     */
    async listTables(namespace) {
      return this.tableOps.listTables(namespace);
    }
    /**
     * Creates a new table in the catalog.
     *
     * @param namespace - Namespace to create the table in
     * @param request - Table creation request including name, schema, partition spec, etc.
     * @returns Table metadata for the created table
     *
     * @example
     * ```typescript
     * const metadata = await catalog.createTable(
     *   { namespace: ['analytics'] },
     *   {
     *     name: 'events',
     *     schema: {
     *       type: 'struct',
     *       fields: [
     *         { id: 1, name: 'id', type: 'long', required: true },
     *         { id: 2, name: 'timestamp', type: 'timestamp', required: true }
     *       ],
     *       'schema-id': 0
     *     },
     *     'partition-spec': {
     *       'spec-id': 0,
     *       fields: [
     *         { source_id: 2, field_id: 1000, name: 'ts_day', transform: 'day' }
     *       ]
     *     }
     *   }
     * );
     * ```
     */
    async createTable(namespace, request) {
      return this.tableOps.createTable(namespace, request);
    }
    /**
     * Updates an existing table's metadata.
     *
     * Can update the schema, partition spec, or properties of a table.
     *
     * @param id - Table identifier to update
     * @param request - Update request with fields to modify
     * @returns Response containing the metadata location and updated table metadata
     *
     * @example
     * ```typescript
     * const response = await catalog.updateTable(
     *   { namespace: ['analytics'], name: 'events' },
     *   {
     *     properties: { 'read.split.target-size': '134217728' }
     *   }
     * );
     * console.log(response['metadata-location']); // s3://...
     * console.log(response.metadata); // TableMetadata object
     * ```
     */
    async updateTable(id, request) {
      return this.tableOps.updateTable(id, request);
    }
    /**
     * Drops a table from the catalog.
     *
     * @param id - Table identifier to drop
     *
     * @example
     * ```typescript
     * await catalog.dropTable({ namespace: ['analytics'], name: 'events' });
     * ```
     */
    async dropTable(id, options) {
      await this.tableOps.dropTable(id, options);
    }
    /**
     * Loads metadata for a table.
     *
     * @param id - Table identifier to load
     * @returns Table metadata including schema, partition spec, location, etc.
     *
     * @example
     * ```typescript
     * const metadata = await catalog.loadTable({ namespace: ['analytics'], name: 'events' });
     * console.log(metadata.schema);
     * console.log(metadata.location);
     * ```
     */
    async loadTable(id) {
      return this.tableOps.loadTable(id);
    }
    /**
     * Checks if a namespace exists in the catalog.
     *
     * @param id - Namespace identifier to check
     * @returns True if the namespace exists, false otherwise
     *
     * @example
     * ```typescript
     * const exists = await catalog.namespaceExists({ namespace: ['analytics'] });
     * console.log(exists); // true or false
     * ```
     */
    async namespaceExists(id) {
      return this.namespaceOps.namespaceExists(id);
    }
    /**
     * Checks if a table exists in the catalog.
     *
     * @param id - Table identifier to check
     * @returns True if the table exists, false otherwise
     *
     * @example
     * ```typescript
     * const exists = await catalog.tableExists({ namespace: ['analytics'], name: 'events' });
     * console.log(exists); // true or false
     * ```
     */
    async tableExists(id) {
      return this.tableOps.tableExists(id);
    }
    /**
     * Creates a namespace if it does not exist.
     *
     * If the namespace already exists, returns void. If created, returns the response.
     *
     * @param id - Namespace identifier to create
     * @param metadata - Optional metadata properties for the namespace
     * @returns Response containing the created namespace and its properties, or void if it already exists
     *
     * @example
     * ```typescript
     * const response = await catalog.createNamespaceIfNotExists(
     *   { namespace: ['analytics'] },
     *   { properties: { owner: 'data-team' } }
     * );
     * if (response) {
     *   console.log('Created:', response.namespace);
     * } else {
     *   console.log('Already exists');
     * }
     * ```
     */
    async createNamespaceIfNotExists(id, metadata) {
      return this.namespaceOps.createNamespaceIfNotExists(id, metadata);
    }
    /**
     * Creates a table if it does not exist.
     *
     * If the table already exists, returns its metadata instead.
     *
     * @param namespace - Namespace to create the table in
     * @param request - Table creation request including name, schema, partition spec, etc.
     * @returns Table metadata for the created or existing table
     *
     * @example
     * ```typescript
     * const metadata = await catalog.createTableIfNotExists(
     *   { namespace: ['analytics'] },
     *   {
     *     name: 'events',
     *     schema: {
     *       type: 'struct',
     *       fields: [
     *         { id: 1, name: 'id', type: 'long', required: true },
     *         { id: 2, name: 'timestamp', type: 'timestamp', required: true }
     *       ],
     *       'schema-id': 0
     *     }
     *   }
     * );
     * ```
     */
    async createTableIfNotExists(namespace, request) {
      return this.tableOps.createTableIfNotExists(namespace, request);
    }
  };

  // ../../node_modules/@supabase/storage-js/dist/index.mjs
  var StorageError = class extends Error {
    constructor(message, namespace = "storage", status, statusCode) {
      super(message);
      this.__isStorageError = true;
      this.namespace = namespace;
      this.name = namespace === "vectors" ? "StorageVectorsError" : "StorageError";
      this.status = status;
      this.statusCode = statusCode;
    }
  };
  function isStorageError(error) {
    return typeof error === "object" && error !== null && "__isStorageError" in error;
  }
  var StorageApiError = class extends StorageError {
    constructor(message, status, statusCode, namespace = "storage") {
      super(message, namespace, status, statusCode);
      this.name = namespace === "vectors" ? "StorageVectorsApiError" : "StorageApiError";
      this.status = status;
      this.statusCode = statusCode;
    }
    toJSON() {
      return {
        name: this.name,
        message: this.message,
        status: this.status,
        statusCode: this.statusCode
      };
    }
  };
  var StorageUnknownError = class extends StorageError {
    constructor(message, originalError, namespace = "storage") {
      super(message, namespace);
      this.name = namespace === "vectors" ? "StorageVectorsUnknownError" : "StorageUnknownError";
      this.originalError = originalError;
    }
  };
  var resolveFetch2 = (customFetch) => {
    if (customFetch)
      return (...args) => customFetch(...args);
    return (...args) => fetch(...args);
  };
  var isPlainObject = (value) => {
    if (typeof value !== "object" || value === null)
      return false;
    const prototype = Object.getPrototypeOf(value);
    return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in value) && !(Symbol.iterator in value);
  };
  var recursiveToCamel = (item) => {
    if (Array.isArray(item))
      return item.map((el) => recursiveToCamel(el));
    else if (typeof item === "function" || item !== Object(item))
      return item;
    const result2 = {};
    Object.entries(item).forEach(([key, value]) => {
      const newKey = key.replace(/([-_][a-z])/gi, (c) => c.toUpperCase().replace(/[-_]/g, ""));
      result2[newKey] = recursiveToCamel(value);
    });
    return result2;
  };
  var isValidBucketName = (bucketName) => {
    if (!bucketName || typeof bucketName !== "string")
      return false;
    if (bucketName.length === 0 || bucketName.length > 100)
      return false;
    if (bucketName.trim() !== bucketName)
      return false;
    if (bucketName.includes("/") || bucketName.includes("\\"))
      return false;
    return /^[\w!.\*'() &$@=;:+,?-]+$/.test(bucketName);
  };
  function _typeof(o) {
    "@babel/helpers - typeof";
    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o$1) {
      return typeof o$1;
    } : function(o$1) {
      return o$1 && "function" == typeof Symbol && o$1.constructor === Symbol && o$1 !== Symbol.prototype ? "symbol" : typeof o$1;
    }, _typeof(o);
  }
  function toPrimitive(t, r) {
    if ("object" != _typeof(t) || !t)
      return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != _typeof(i))
        return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function toPropertyKey(t) {
    var i = toPrimitive(t, "string");
    return "symbol" == _typeof(i) ? i : i + "";
  }
  function _defineProperty(e, r, t) {
    return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
      value: t,
      enumerable: true,
      configurable: true,
      writable: true
    }) : e[r] = t, e;
  }
  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function(r$1) {
        return Object.getOwnPropertyDescriptor(e, r$1).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread2(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), true).forEach(function(r$1) {
        _defineProperty(e, r$1, t[r$1]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r$1) {
        Object.defineProperty(e, r$1, Object.getOwnPropertyDescriptor(t, r$1));
      });
    }
    return e;
  }
  var _getErrorMessage = (err) => {
    var _err$error;
    return err.msg || err.message || err.error_description || (typeof err.error === "string" ? err.error : (_err$error = err.error) === null || _err$error === void 0 ? void 0 : _err$error.message) || JSON.stringify(err);
  };
  var handleError = async (error, reject, options, namespace) => {
    if (error && typeof error === "object" && "status" in error && "ok" in error && typeof error.status === "number" && !(options === null || options === void 0 ? void 0 : options.noResolveJson)) {
      const responseError = error;
      const status = responseError.status || 500;
      if (typeof responseError.json === "function")
        responseError.json().then((err) => {
          const statusCode = (err === null || err === void 0 ? void 0 : err.statusCode) || (err === null || err === void 0 ? void 0 : err.code) || status + "";
          reject(new StorageApiError(_getErrorMessage(err), status, statusCode, namespace));
        }).catch(() => {
          if (namespace === "vectors") {
            const statusCode = status + "";
            reject(new StorageApiError(responseError.statusText || `HTTP ${status} error`, status, statusCode, namespace));
          } else {
            const statusCode = status + "";
            reject(new StorageApiError(responseError.statusText || `HTTP ${status} error`, status, statusCode, namespace));
          }
        });
      else {
        const statusCode = status + "";
        reject(new StorageApiError(responseError.statusText || `HTTP ${status} error`, status, statusCode, namespace));
      }
    } else
      reject(new StorageUnknownError(_getErrorMessage(error), error, namespace));
  };
  var _getRequestParams = (method, options, parameters, body) => {
    const params = {
      method,
      headers: (options === null || options === void 0 ? void 0 : options.headers) || {}
    };
    if (method === "GET" || method === "HEAD" || !body)
      return _objectSpread2(_objectSpread2({}, params), parameters);
    if (isPlainObject(body)) {
      params.headers = _objectSpread2({ "Content-Type": "application/json" }, options === null || options === void 0 ? void 0 : options.headers);
      params.body = JSON.stringify(body);
    } else
      params.body = body;
    if (options === null || options === void 0 ? void 0 : options.duplex)
      params.duplex = options.duplex;
    return _objectSpread2(_objectSpread2({}, params), parameters);
  };
  async function _handleRequest(fetcher, method, url, options, parameters, body, namespace) {
    return new Promise((resolve, reject) => {
      fetcher(url, _getRequestParams(method, options, parameters, body)).then((result2) => {
        if (!result2.ok)
          throw result2;
        if (options === null || options === void 0 ? void 0 : options.noResolveJson)
          return result2;
        if (namespace === "vectors") {
          const contentType = result2.headers.get("content-type");
          if (result2.headers.get("content-length") === "0" || result2.status === 204)
            return {};
          if (!contentType || !contentType.includes("application/json"))
            return {};
        }
        return result2.json();
      }).then((data) => resolve(data)).catch((error) => handleError(error, reject, options, namespace));
    });
  }
  function createFetchApi(namespace = "storage") {
    return {
      get: async (fetcher, url, options, parameters) => {
        return _handleRequest(fetcher, "GET", url, options, parameters, void 0, namespace);
      },
      post: async (fetcher, url, body, options, parameters) => {
        return _handleRequest(fetcher, "POST", url, options, parameters, body, namespace);
      },
      put: async (fetcher, url, body, options, parameters) => {
        return _handleRequest(fetcher, "PUT", url, options, parameters, body, namespace);
      },
      head: async (fetcher, url, options, parameters) => {
        return _handleRequest(fetcher, "HEAD", url, _objectSpread2(_objectSpread2({}, options), {}, { noResolveJson: true }), parameters, void 0, namespace);
      },
      remove: async (fetcher, url, body, options, parameters) => {
        return _handleRequest(fetcher, "DELETE", url, options, parameters, body, namespace);
      }
    };
  }
  var defaultApi = createFetchApi("storage");
  var { get, post, put, head, remove } = defaultApi;
  var vectorsApi = createFetchApi("vectors");
  var BaseApiClient = class {
    /**
    * Creates a new BaseApiClient instance
    * @param url - Base URL for API requests
    * @param headers - Default headers for API requests
    * @param fetch - Optional custom fetch implementation
    * @param namespace - Error namespace ('storage' or 'vectors')
    */
    constructor(url, headers = {}, fetch$1, namespace = "storage") {
      this.shouldThrowOnError = false;
      this.url = url;
      this.headers = headers;
      this.fetch = resolveFetch2(fetch$1);
      this.namespace = namespace;
    }
    /**
    * Enable throwing errors instead of returning them.
    * When enabled, errors are thrown instead of returned in { data, error } format.
    *
    * @returns this - For method chaining
    */
    throwOnError() {
      this.shouldThrowOnError = true;
      return this;
    }
    /**
    * Handles API operation with standardized error handling
    * Eliminates repetitive try-catch blocks across all API methods
    *
    * This wrapper:
    * 1. Executes the operation
    * 2. Returns { data, error: null } on success
    * 3. Returns { data: null, error } on failure (if shouldThrowOnError is false)
    * 4. Throws error on failure (if shouldThrowOnError is true)
    *
    * @typeParam T - The expected data type from the operation
    * @param operation - Async function that performs the API call
    * @returns Promise with { data, error } tuple
    *
    * @example
    * ```typescript
    * async listBuckets() {
    *   return this.handleOperation(async () => {
    *     return await get(this.fetch, `${this.url}/bucket`, {
    *       headers: this.headers,
    *     })
    *   })
    * }
    * ```
    */
    async handleOperation(operation) {
      var _this = this;
      try {
        return {
          data: await operation(),
          error: null
        };
      } catch (error) {
        if (_this.shouldThrowOnError)
          throw error;
        if (isStorageError(error))
          return {
            data: null,
            error
          };
        throw error;
      }
    }
  };
  var StreamDownloadBuilder = class {
    constructor(downloadFn, shouldThrowOnError) {
      this.downloadFn = downloadFn;
      this.shouldThrowOnError = shouldThrowOnError;
    }
    then(onfulfilled, onrejected) {
      return this.execute().then(onfulfilled, onrejected);
    }
    async execute() {
      var _this = this;
      try {
        return {
          data: (await _this.downloadFn()).body,
          error: null
        };
      } catch (error) {
        if (_this.shouldThrowOnError)
          throw error;
        if (isStorageError(error))
          return {
            data: null,
            error
          };
        throw error;
      }
    }
  };
  var _Symbol$toStringTag;
  _Symbol$toStringTag = Symbol.toStringTag;
  var BlobDownloadBuilder = class {
    constructor(downloadFn, shouldThrowOnError) {
      this.downloadFn = downloadFn;
      this.shouldThrowOnError = shouldThrowOnError;
      this[_Symbol$toStringTag] = "BlobDownloadBuilder";
      this.promise = null;
    }
    asStream() {
      return new StreamDownloadBuilder(this.downloadFn, this.shouldThrowOnError);
    }
    then(onfulfilled, onrejected) {
      return this.getPromise().then(onfulfilled, onrejected);
    }
    catch(onrejected) {
      return this.getPromise().catch(onrejected);
    }
    finally(onfinally) {
      return this.getPromise().finally(onfinally);
    }
    getPromise() {
      if (!this.promise)
        this.promise = this.execute();
      return this.promise;
    }
    async execute() {
      var _this = this;
      try {
        return {
          data: await (await _this.downloadFn()).blob(),
          error: null
        };
      } catch (error) {
        if (_this.shouldThrowOnError)
          throw error;
        if (isStorageError(error))
          return {
            data: null,
            error
          };
        throw error;
      }
    }
  };
  var DEFAULT_SEARCH_OPTIONS = {
    limit: 100,
    offset: 0,
    sortBy: {
      column: "name",
      order: "asc"
    }
  };
  var DEFAULT_FILE_OPTIONS = {
    cacheControl: "3600",
    contentType: "text/plain;charset=UTF-8",
    upsert: false
  };
  var StorageFileApi = class extends BaseApiClient {
    constructor(url, headers = {}, bucketId, fetch$1) {
      super(url, headers, fetch$1, "storage");
      this.bucketId = bucketId;
    }
    /**
    * Uploads a file to an existing bucket or replaces an existing file at the specified path with a new one.
    *
    * @param method HTTP method.
    * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
    * @param fileBody The body of the file to be stored in the bucket.
    */
    async uploadOrUpdate(method, path, fileBody, fileOptions) {
      var _this = this;
      return _this.handleOperation(async () => {
        let body;
        const options = _objectSpread2(_objectSpread2({}, DEFAULT_FILE_OPTIONS), fileOptions);
        let headers = _objectSpread2(_objectSpread2({}, _this.headers), method === "POST" && { "x-upsert": String(options.upsert) });
        const metadata = options.metadata;
        if (typeof Blob !== "undefined" && fileBody instanceof Blob) {
          body = new FormData();
          body.append("cacheControl", options.cacheControl);
          if (metadata)
            body.append("metadata", _this.encodeMetadata(metadata));
          body.append("", fileBody);
        } else if (typeof FormData !== "undefined" && fileBody instanceof FormData) {
          body = fileBody;
          if (!body.has("cacheControl"))
            body.append("cacheControl", options.cacheControl);
          if (metadata && !body.has("metadata"))
            body.append("metadata", _this.encodeMetadata(metadata));
        } else {
          body = fileBody;
          headers["cache-control"] = `max-age=${options.cacheControl}`;
          headers["content-type"] = options.contentType;
          if (metadata)
            headers["x-metadata"] = _this.toBase64(_this.encodeMetadata(metadata));
          if ((typeof ReadableStream !== "undefined" && body instanceof ReadableStream || body && typeof body === "object" && "pipe" in body && typeof body.pipe === "function") && !options.duplex)
            options.duplex = "half";
        }
        if (fileOptions === null || fileOptions === void 0 ? void 0 : fileOptions.headers)
          headers = _objectSpread2(_objectSpread2({}, headers), fileOptions.headers);
        const cleanPath = _this._removeEmptyFolders(path);
        const _path = _this._getFinalPath(cleanPath);
        const data = await (method == "PUT" ? put : post)(_this.fetch, `${_this.url}/object/${_path}`, body, _objectSpread2({ headers }, (options === null || options === void 0 ? void 0 : options.duplex) ? { duplex: options.duplex } : {}));
        return {
          path: cleanPath,
          id: data.Id,
          fullPath: data.Key
        };
      });
    }
    /**
    * Uploads a file to an existing bucket.
    *
    * @category File Buckets
    * @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
    * @param fileBody The body of the file to be stored in the bucket.
    * @param fileOptions Optional file upload options including cacheControl, contentType, upsert, and metadata.
    * @returns Promise with response containing file path, id, and fullPath or error
    *
    * @example Upload file
    * ```js
    * const avatarFile = event.target.files[0]
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .upload('public/avatar1.png', avatarFile, {
    *     cacheControl: '3600',
    *     upsert: false
    *   })
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "path": "public/avatar1.png",
    *     "fullPath": "avatars/public/avatar1.png"
    *   },
    *   "error": null
    * }
    * ```
    *
    * @example Upload file using `ArrayBuffer` from base64 file data
    * ```js
    * import { decode } from 'base64-arraybuffer'
    *
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .upload('public/avatar1.png', decode('base64FileData'), {
    *     contentType: 'image/png'
    *   })
    * ```
    */
    async upload(path, fileBody, fileOptions) {
      return this.uploadOrUpdate("POST", path, fileBody, fileOptions);
    }
    /**
    * Upload a file with a token generated from `createSignedUploadUrl`.
    *
    * @category File Buckets
    * @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
    * @param token The token generated from `createSignedUploadUrl`
    * @param fileBody The body of the file to be stored in the bucket.
    * @param fileOptions HTTP headers (cacheControl, contentType, etc.).
    * **Note:** The `upsert` option has no effect here. To enable upsert behavior,
    * pass `{ upsert: true }` when calling `createSignedUploadUrl()` instead.
    * @returns Promise with response containing file path and fullPath or error
    *
    * @example Upload to a signed URL
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .uploadToSignedUrl('folder/cat.jpg', 'token-from-createSignedUploadUrl', file)
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "path": "folder/cat.jpg",
    *     "fullPath": "avatars/folder/cat.jpg"
    *   },
    *   "error": null
    * }
    * ```
    */
    async uploadToSignedUrl(path, token, fileBody, fileOptions) {
      var _this3 = this;
      const cleanPath = _this3._removeEmptyFolders(path);
      const _path = _this3._getFinalPath(cleanPath);
      const url = new URL(_this3.url + `/object/upload/sign/${_path}`);
      url.searchParams.set("token", token);
      return _this3.handleOperation(async () => {
        let body;
        const options = _objectSpread2({ upsert: DEFAULT_FILE_OPTIONS.upsert }, fileOptions);
        const headers = _objectSpread2(_objectSpread2({}, _this3.headers), { "x-upsert": String(options.upsert) });
        if (typeof Blob !== "undefined" && fileBody instanceof Blob) {
          body = new FormData();
          body.append("cacheControl", options.cacheControl);
          body.append("", fileBody);
        } else if (typeof FormData !== "undefined" && fileBody instanceof FormData) {
          body = fileBody;
          body.append("cacheControl", options.cacheControl);
        } else {
          body = fileBody;
          headers["cache-control"] = `max-age=${options.cacheControl}`;
          headers["content-type"] = options.contentType;
        }
        return {
          path: cleanPath,
          fullPath: (await put(_this3.fetch, url.toString(), body, { headers })).Key
        };
      });
    }
    /**
    * Creates a signed upload URL.
    * Signed upload URLs can be used to upload files to the bucket without further authentication.
    * They are valid for 2 hours.
    *
    * @category File Buckets
    * @param path The file path, including the current file name. For example `folder/image.png`.
    * @param options.upsert If set to true, allows the file to be overwritten if it already exists.
    * @returns Promise with response containing signed upload URL, token, and path or error
    *
    * @example Create Signed Upload URL
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .createSignedUploadUrl('folder/cat.jpg')
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "signedUrl": "https://example.supabase.co/storage/v1/object/upload/sign/avatars/folder/cat.jpg?token=<TOKEN>",
    *     "path": "folder/cat.jpg",
    *     "token": "<TOKEN>"
    *   },
    *   "error": null
    * }
    * ```
    */
    async createSignedUploadUrl(path, options) {
      var _this4 = this;
      return _this4.handleOperation(async () => {
        let _path = _this4._getFinalPath(path);
        const headers = _objectSpread2({}, _this4.headers);
        if (options === null || options === void 0 ? void 0 : options.upsert)
          headers["x-upsert"] = "true";
        const data = await post(_this4.fetch, `${_this4.url}/object/upload/sign/${_path}`, {}, { headers });
        const url = new URL(_this4.url + data.url);
        const token = url.searchParams.get("token");
        if (!token)
          throw new StorageError("No token returned by API");
        return {
          signedUrl: url.toString(),
          path,
          token
        };
      });
    }
    /**
    * Replaces an existing file at the specified path with a new one.
    *
    * @category File Buckets
    * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to update.
    * @param fileBody The body of the file to be stored in the bucket.
    * @param fileOptions Optional file upload options including cacheControl, contentType, upsert, and metadata.
    * @returns Promise with response containing file path, id, and fullPath or error
    *
    * @example Update file
    * ```js
    * const avatarFile = event.target.files[0]
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .update('public/avatar1.png', avatarFile, {
    *     cacheControl: '3600',
    *     upsert: true
    *   })
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "path": "public/avatar1.png",
    *     "fullPath": "avatars/public/avatar1.png"
    *   },
    *   "error": null
    * }
    * ```
    *
    * @example Update file using `ArrayBuffer` from base64 file data
    * ```js
    * import {decode} from 'base64-arraybuffer'
    *
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .update('public/avatar1.png', decode('base64FileData'), {
    *     contentType: 'image/png'
    *   })
    * ```
    */
    async update(path, fileBody, fileOptions) {
      return this.uploadOrUpdate("PUT", path, fileBody, fileOptions);
    }
    /**
    * Moves an existing file to a new path in the same bucket.
    *
    * @category File Buckets
    * @param fromPath The original file path, including the current file name. For example `folder/image.png`.
    * @param toPath The new file path, including the new file name. For example `folder/image-new.png`.
    * @param options The destination options.
    * @returns Promise with response containing success message or error
    *
    * @example Move file
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .move('public/avatar1.png', 'private/avatar2.png')
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "message": "Successfully moved"
    *   },
    *   "error": null
    * }
    * ```
    */
    async move(fromPath, toPath, options) {
      var _this6 = this;
      return _this6.handleOperation(async () => {
        return await post(_this6.fetch, `${_this6.url}/object/move`, {
          bucketId: _this6.bucketId,
          sourceKey: fromPath,
          destinationKey: toPath,
          destinationBucket: options === null || options === void 0 ? void 0 : options.destinationBucket
        }, { headers: _this6.headers });
      });
    }
    /**
    * Copies an existing file to a new path in the same bucket.
    *
    * @category File Buckets
    * @param fromPath The original file path, including the current file name. For example `folder/image.png`.
    * @param toPath The new file path, including the new file name. For example `folder/image-copy.png`.
    * @param options The destination options.
    * @returns Promise with response containing copied file path or error
    *
    * @example Copy file
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .copy('public/avatar1.png', 'private/avatar2.png')
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "path": "avatars/private/avatar2.png"
    *   },
    *   "error": null
    * }
    * ```
    */
    async copy(fromPath, toPath, options) {
      var _this7 = this;
      return _this7.handleOperation(async () => {
        return { path: (await post(_this7.fetch, `${_this7.url}/object/copy`, {
          bucketId: _this7.bucketId,
          sourceKey: fromPath,
          destinationKey: toPath,
          destinationBucket: options === null || options === void 0 ? void 0 : options.destinationBucket
        }, { headers: _this7.headers })).Key };
      });
    }
    /**
    * Creates a signed URL. Use a signed URL to share a file for a fixed amount of time.
    *
    * @category File Buckets
    * @param path The file path, including the current file name. For example `folder/image.png`.
    * @param expiresIn The number of seconds until the signed URL expires. For example, `60` for a URL which is valid for one minute.
    * @param options.download triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
    * @param options.transform Transform the asset before serving it to the client.
    * @returns Promise with response containing signed URL or error
    *
    * @example Create Signed URL
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .createSignedUrl('folder/avatar1.png', 60)
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "signedUrl": "https://example.supabase.co/storage/v1/object/sign/avatars/folder/avatar1.png?token=<TOKEN>"
    *   },
    *   "error": null
    * }
    * ```
    *
    * @example Create a signed URL for an asset with transformations
    * ```js
    * const { data } = await supabase
    *   .storage
    *   .from('avatars')
    *   .createSignedUrl('folder/avatar1.png', 60, {
    *     transform: {
    *       width: 100,
    *       height: 100,
    *     }
    *   })
    * ```
    *
    * @example Create a signed URL which triggers the download of the asset
    * ```js
    * const { data } = await supabase
    *   .storage
    *   .from('avatars')
    *   .createSignedUrl('folder/avatar1.png', 60, {
    *     download: true,
    *   })
    * ```
    */
    async createSignedUrl(path, expiresIn, options) {
      var _this8 = this;
      return _this8.handleOperation(async () => {
        let _path = _this8._getFinalPath(path);
        let data = await post(_this8.fetch, `${_this8.url}/object/sign/${_path}`, _objectSpread2({ expiresIn }, (options === null || options === void 0 ? void 0 : options.transform) ? { transform: options.transform } : {}), { headers: _this8.headers });
        const downloadQueryParam = (options === null || options === void 0 ? void 0 : options.download) ? `&download=${options.download === true ? "" : options.download}` : "";
        return { signedUrl: encodeURI(`${_this8.url}${data.signedURL}${downloadQueryParam}`) };
      });
    }
    /**
    * Creates multiple signed URLs. Use a signed URL to share a file for a fixed amount of time.
    *
    * @category File Buckets
    * @param paths The file paths to be downloaded, including the current file names. For example `['folder/image.png', 'folder2/image2.png']`.
    * @param expiresIn The number of seconds until the signed URLs expire. For example, `60` for URLs which are valid for one minute.
    * @param options.download triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
    * @returns Promise with response containing array of objects with signedUrl, path, and error or error
    *
    * @example Create Signed URLs
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .createSignedUrls(['folder/avatar1.png', 'folder/avatar2.png'], 60)
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": [
    *     {
    *       "error": null,
    *       "path": "folder/avatar1.png",
    *       "signedURL": "/object/sign/avatars/folder/avatar1.png?token=<TOKEN>",
    *       "signedUrl": "https://example.supabase.co/storage/v1/object/sign/avatars/folder/avatar1.png?token=<TOKEN>"
    *     },
    *     {
    *       "error": null,
    *       "path": "folder/avatar2.png",
    *       "signedURL": "/object/sign/avatars/folder/avatar2.png?token=<TOKEN>",
    *       "signedUrl": "https://example.supabase.co/storage/v1/object/sign/avatars/folder/avatar2.png?token=<TOKEN>"
    *     }
    *   ],
    *   "error": null
    * }
    * ```
    */
    async createSignedUrls(paths, expiresIn, options) {
      var _this9 = this;
      return _this9.handleOperation(async () => {
        const data = await post(_this9.fetch, `${_this9.url}/object/sign/${_this9.bucketId}`, {
          expiresIn,
          paths
        }, { headers: _this9.headers });
        const downloadQueryParam = (options === null || options === void 0 ? void 0 : options.download) ? `&download=${options.download === true ? "" : options.download}` : "";
        return data.map((datum) => _objectSpread2(_objectSpread2({}, datum), {}, { signedUrl: datum.signedURL ? encodeURI(`${_this9.url}${datum.signedURL}${downloadQueryParam}`) : null }));
      });
    }
    /**
    * Downloads a file from a private bucket. For public buckets, make a request to the URL returned from `getPublicUrl` instead.
    *
    * @category File Buckets
    * @param path The full path and file name of the file to be downloaded. For example `folder/image.png`.
    * @param options.transform Transform the asset before serving it to the client.
    * @returns BlobDownloadBuilder instance for downloading the file
    *
    * @example Download file
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .download('folder/avatar1.png')
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": <BLOB>,
    *   "error": null
    * }
    * ```
    *
    * @example Download file with transformations
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .download('folder/avatar1.png', {
    *     transform: {
    *       width: 100,
    *       height: 100,
    *       quality: 80
    *     }
    *   })
    * ```
    */
    download(path, options) {
      const renderPath = typeof (options === null || options === void 0 ? void 0 : options.transform) !== "undefined" ? "render/image/authenticated" : "object";
      const transformationQuery = this.transformOptsToQueryString((options === null || options === void 0 ? void 0 : options.transform) || {});
      const queryString = transformationQuery ? `?${transformationQuery}` : "";
      const _path = this._getFinalPath(path);
      const downloadFn = () => get(this.fetch, `${this.url}/${renderPath}/${_path}${queryString}`, {
        headers: this.headers,
        noResolveJson: true
      });
      return new BlobDownloadBuilder(downloadFn, this.shouldThrowOnError);
    }
    /**
    * Retrieves the details of an existing file.
    *
    * @category File Buckets
    * @param path The file path, including the file name. For example `folder/image.png`.
    * @returns Promise with response containing file metadata or error
    *
    * @example Get file info
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .info('folder/avatar1.png')
    * ```
    */
    async info(path) {
      var _this10 = this;
      const _path = _this10._getFinalPath(path);
      return _this10.handleOperation(async () => {
        return recursiveToCamel(await get(_this10.fetch, `${_this10.url}/object/info/${_path}`, { headers: _this10.headers }));
      });
    }
    /**
    * Checks the existence of a file.
    *
    * @category File Buckets
    * @param path The file path, including the file name. For example `folder/image.png`.
    * @returns Promise with response containing boolean indicating file existence or error
    *
    * @example Check file existence
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .exists('folder/avatar1.png')
    * ```
    */
    async exists(path) {
      var _this11 = this;
      const _path = _this11._getFinalPath(path);
      try {
        await head(_this11.fetch, `${_this11.url}/object/${_path}`, { headers: _this11.headers });
        return {
          data: true,
          error: null
        };
      } catch (error) {
        if (_this11.shouldThrowOnError)
          throw error;
        if (isStorageError(error) && error instanceof StorageUnknownError) {
          const originalError = error.originalError;
          if ([400, 404].includes(originalError === null || originalError === void 0 ? void 0 : originalError.status))
            return {
              data: false,
              error
            };
        }
        throw error;
      }
    }
    /**
    * A simple convenience function to get the URL for an asset in a public bucket. If you do not want to use this function, you can construct the public URL by concatenating the bucket URL with the path to the asset.
    * This function does not verify if the bucket is public. If a public URL is created for a bucket which is not public, you will not be able to download the asset.
    *
    * @category File Buckets
    * @param path The path and name of the file to generate the public URL for. For example `folder/image.png`.
    * @param options.download Triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
    * @param options.transform Transform the asset before serving it to the client.
    * @returns Object with public URL
    *
    * @example Returns the URL for an asset in a public bucket
    * ```js
    * const { data } = supabase
    *   .storage
    *   .from('public-bucket')
    *   .getPublicUrl('folder/avatar1.png')
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "publicUrl": "https://example.supabase.co/storage/v1/object/public/public-bucket/folder/avatar1.png"
    *   }
    * }
    * ```
    *
    * @example Returns the URL for an asset in a public bucket with transformations
    * ```js
    * const { data } = supabase
    *   .storage
    *   .from('public-bucket')
    *   .getPublicUrl('folder/avatar1.png', {
    *     transform: {
    *       width: 100,
    *       height: 100,
    *     }
    *   })
    * ```
    *
    * @example Returns the URL which triggers the download of an asset in a public bucket
    * ```js
    * const { data } = supabase
    *   .storage
    *   .from('public-bucket')
    *   .getPublicUrl('folder/avatar1.png', {
    *     download: true,
    *   })
    * ```
    */
    getPublicUrl(path, options) {
      const _path = this._getFinalPath(path);
      const _queryString = [];
      const downloadQueryParam = (options === null || options === void 0 ? void 0 : options.download) ? `download=${options.download === true ? "" : options.download}` : "";
      if (downloadQueryParam !== "")
        _queryString.push(downloadQueryParam);
      const renderPath = typeof (options === null || options === void 0 ? void 0 : options.transform) !== "undefined" ? "render/image" : "object";
      const transformationQuery = this.transformOptsToQueryString((options === null || options === void 0 ? void 0 : options.transform) || {});
      if (transformationQuery !== "")
        _queryString.push(transformationQuery);
      let queryString = _queryString.join("&");
      if (queryString !== "")
        queryString = `?${queryString}`;
      return { data: { publicUrl: encodeURI(`${this.url}/${renderPath}/public/${_path}${queryString}`) } };
    }
    /**
    * Deletes files within the same bucket
    *
    * @category File Buckets
    * @param paths An array of files to delete, including the path and file name. For example [`'folder/image.png'`].
    * @returns Promise with response containing array of deleted file objects or error
    *
    * @example Delete file
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .remove(['folder/avatar1.png'])
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": [],
    *   "error": null
    * }
    * ```
    */
    async remove(paths) {
      var _this12 = this;
      return _this12.handleOperation(async () => {
        return await remove(_this12.fetch, `${_this12.url}/object/${_this12.bucketId}`, { prefixes: paths }, { headers: _this12.headers });
      });
    }
    /**
    * Get file metadata
    * @param id the file id to retrieve metadata
    */
    /**
    * Update file metadata
    * @param id the file id to update metadata
    * @param meta the new file metadata
    */
    /**
    * Lists all the files and folders within a path of the bucket.
    *
    * @category File Buckets
    * @param path The folder path.
    * @param options Search options including limit (defaults to 100), offset, sortBy, and search
    * @param parameters Optional fetch parameters including signal for cancellation
    * @returns Promise with response containing array of files or error
    *
    * @example List files in a bucket
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .list('folder', {
    *     limit: 100,
    *     offset: 0,
    *     sortBy: { column: 'name', order: 'asc' },
    *   })
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": [
    *     {
    *       "name": "avatar1.png",
    *       "id": "e668cf7f-821b-4a2f-9dce-7dfa5dd1cfd2",
    *       "updated_at": "2024-05-22T23:06:05.580Z",
    *       "created_at": "2024-05-22T23:04:34.443Z",
    *       "last_accessed_at": "2024-05-22T23:04:34.443Z",
    *       "metadata": {
    *         "eTag": "\"c5e8c553235d9af30ef4f6e280790b92\"",
    *         "size": 32175,
    *         "mimetype": "image/png",
    *         "cacheControl": "max-age=3600",
    *         "lastModified": "2024-05-22T23:06:05.574Z",
    *         "contentLength": 32175,
    *         "httpStatusCode": 200
    *       }
    *     }
    *   ],
    *   "error": null
    * }
    * ```
    *
    * @example Search files in a bucket
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .list('folder', {
    *     limit: 100,
    *     offset: 0,
    *     sortBy: { column: 'name', order: 'asc' },
    *     search: 'jon'
    *   })
    * ```
    */
    async list(path, options, parameters) {
      var _this13 = this;
      return _this13.handleOperation(async () => {
        const body = _objectSpread2(_objectSpread2(_objectSpread2({}, DEFAULT_SEARCH_OPTIONS), options), {}, { prefix: path || "" });
        return await post(_this13.fetch, `${_this13.url}/object/list/${_this13.bucketId}`, body, { headers: _this13.headers }, parameters);
      });
    }
    /**
    * @experimental this method signature might change in the future
    *
    * @category File Buckets
    * @param options search options
    * @param parameters
    */
    async listV2(options, parameters) {
      var _this14 = this;
      return _this14.handleOperation(async () => {
        const body = _objectSpread2({}, options);
        return await post(_this14.fetch, `${_this14.url}/object/list-v2/${_this14.bucketId}`, body, { headers: _this14.headers }, parameters);
      });
    }
    encodeMetadata(metadata) {
      return JSON.stringify(metadata);
    }
    toBase64(data) {
      if (typeof Buffer !== "undefined")
        return Buffer.from(data).toString("base64");
      return btoa(data);
    }
    _getFinalPath(path) {
      return `${this.bucketId}/${path.replace(/^\/+/, "")}`;
    }
    _removeEmptyFolders(path) {
      return path.replace(/^\/|\/$/g, "").replace(/\/+/g, "/");
    }
    transformOptsToQueryString(transform) {
      const params = [];
      if (transform.width)
        params.push(`width=${transform.width}`);
      if (transform.height)
        params.push(`height=${transform.height}`);
      if (transform.resize)
        params.push(`resize=${transform.resize}`);
      if (transform.format)
        params.push(`format=${transform.format}`);
      if (transform.quality)
        params.push(`quality=${transform.quality}`);
      return params.join("&");
    }
  };
  var version2 = "2.93.3";
  var DEFAULT_HEADERS = { "X-Client-Info": `storage-js/${version2}` };
  var StorageBucketApi = class extends BaseApiClient {
    constructor(url, headers = {}, fetch$1, opts) {
      const baseUrl = new URL(url);
      if (opts === null || opts === void 0 ? void 0 : opts.useNewHostname) {
        if (/supabase\.(co|in|red)$/.test(baseUrl.hostname) && !baseUrl.hostname.includes("storage.supabase."))
          baseUrl.hostname = baseUrl.hostname.replace("supabase.", "storage.supabase.");
      }
      const finalUrl = baseUrl.href.replace(/\/$/, "");
      const finalHeaders = _objectSpread2(_objectSpread2({}, DEFAULT_HEADERS), headers);
      super(finalUrl, finalHeaders, fetch$1, "storage");
    }
    /**
    * Retrieves the details of all Storage buckets within an existing project.
    *
    * @category File Buckets
    * @param options Query parameters for listing buckets
    * @param options.limit Maximum number of buckets to return
    * @param options.offset Number of buckets to skip
    * @param options.sortColumn Column to sort by ('id', 'name', 'created_at', 'updated_at')
    * @param options.sortOrder Sort order ('asc' or 'desc')
    * @param options.search Search term to filter bucket names
    * @returns Promise with response containing array of buckets or error
    *
    * @example List buckets
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .listBuckets()
    * ```
    *
    * @example List buckets with options
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .listBuckets({
    *     limit: 10,
    *     offset: 0,
    *     sortColumn: 'created_at',
    *     sortOrder: 'desc',
    *     search: 'prod'
    *   })
    * ```
    */
    async listBuckets(options) {
      var _this = this;
      return _this.handleOperation(async () => {
        const queryString = _this.listBucketOptionsToQueryString(options);
        return await get(_this.fetch, `${_this.url}/bucket${queryString}`, { headers: _this.headers });
      });
    }
    /**
    * Retrieves the details of an existing Storage bucket.
    *
    * @category File Buckets
    * @param id The unique identifier of the bucket you would like to retrieve.
    * @returns Promise with response containing bucket details or error
    *
    * @example Get bucket
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .getBucket('avatars')
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "id": "avatars",
    *     "name": "avatars",
    *     "owner": "",
    *     "public": false,
    *     "file_size_limit": 1024,
    *     "allowed_mime_types": [
    *       "image/png"
    *     ],
    *     "created_at": "2024-05-22T22:26:05.100Z",
    *     "updated_at": "2024-05-22T22:26:05.100Z"
    *   },
    *   "error": null
    * }
    * ```
    */
    async getBucket(id) {
      var _this2 = this;
      return _this2.handleOperation(async () => {
        return await get(_this2.fetch, `${_this2.url}/bucket/${id}`, { headers: _this2.headers });
      });
    }
    /**
    * Creates a new Storage bucket
    *
    * @category File Buckets
    * @param id A unique identifier for the bucket you are creating.
    * @param options.public The visibility of the bucket. Public buckets don't require an authorization token to download objects, but still require a valid token for all other operations. By default, buckets are private.
    * @param options.fileSizeLimit specifies the max file size in bytes that can be uploaded to this bucket.
    * The global file size limit takes precedence over this value.
    * The default value is null, which doesn't set a per bucket file size limit.
    * @param options.allowedMimeTypes specifies the allowed mime types that this bucket can accept during upload.
    * The default value is null, which allows files with all mime types to be uploaded.
    * Each mime type specified can be a wildcard, e.g. image/*, or a specific mime type, e.g. image/png.
    * @param options.type (private-beta) specifies the bucket type. see `BucketType` for more details.
    *   - default bucket type is `STANDARD`
    * @returns Promise with response containing newly created bucket name or error
    *
    * @example Create bucket
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .createBucket('avatars', {
    *     public: false,
    *     allowedMimeTypes: ['image/png'],
    *     fileSizeLimit: 1024
    *   })
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "name": "avatars"
    *   },
    *   "error": null
    * }
    * ```
    */
    async createBucket(id, options = { public: false }) {
      var _this3 = this;
      return _this3.handleOperation(async () => {
        return await post(_this3.fetch, `${_this3.url}/bucket`, {
          id,
          name: id,
          type: options.type,
          public: options.public,
          file_size_limit: options.fileSizeLimit,
          allowed_mime_types: options.allowedMimeTypes
        }, { headers: _this3.headers });
      });
    }
    /**
    * Updates a Storage bucket
    *
    * @category File Buckets
    * @param id A unique identifier for the bucket you are updating.
    * @param options.public The visibility of the bucket. Public buckets don't require an authorization token to download objects, but still require a valid token for all other operations.
    * @param options.fileSizeLimit specifies the max file size in bytes that can be uploaded to this bucket.
    * The global file size limit takes precedence over this value.
    * The default value is null, which doesn't set a per bucket file size limit.
    * @param options.allowedMimeTypes specifies the allowed mime types that this bucket can accept during upload.
    * The default value is null, which allows files with all mime types to be uploaded.
    * Each mime type specified can be a wildcard, e.g. image/*, or a specific mime type, e.g. image/png.
    * @returns Promise with response containing success message or error
    *
    * @example Update bucket
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .updateBucket('avatars', {
    *     public: false,
    *     allowedMimeTypes: ['image/png'],
    *     fileSizeLimit: 1024
    *   })
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "message": "Successfully updated"
    *   },
    *   "error": null
    * }
    * ```
    */
    async updateBucket(id, options) {
      var _this4 = this;
      return _this4.handleOperation(async () => {
        return await put(_this4.fetch, `${_this4.url}/bucket/${id}`, {
          id,
          name: id,
          public: options.public,
          file_size_limit: options.fileSizeLimit,
          allowed_mime_types: options.allowedMimeTypes
        }, { headers: _this4.headers });
      });
    }
    /**
    * Removes all objects inside a single bucket.
    *
    * @category File Buckets
    * @param id The unique identifier of the bucket you would like to empty.
    * @returns Promise with success message or error
    *
    * @example Empty bucket
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .emptyBucket('avatars')
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "message": "Successfully emptied"
    *   },
    *   "error": null
    * }
    * ```
    */
    async emptyBucket(id) {
      var _this5 = this;
      return _this5.handleOperation(async () => {
        return await post(_this5.fetch, `${_this5.url}/bucket/${id}/empty`, {}, { headers: _this5.headers });
      });
    }
    /**
    * Deletes an existing bucket. A bucket can't be deleted with existing objects inside it.
    * You must first `empty()` the bucket.
    *
    * @category File Buckets
    * @param id The unique identifier of the bucket you would like to delete.
    * @returns Promise with success message or error
    *
    * @example Delete bucket
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .deleteBucket('avatars')
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "message": "Successfully deleted"
    *   },
    *   "error": null
    * }
    * ```
    */
    async deleteBucket(id) {
      var _this6 = this;
      return _this6.handleOperation(async () => {
        return await remove(_this6.fetch, `${_this6.url}/bucket/${id}`, {}, { headers: _this6.headers });
      });
    }
    listBucketOptionsToQueryString(options) {
      const params = {};
      if (options) {
        if ("limit" in options)
          params.limit = String(options.limit);
        if ("offset" in options)
          params.offset = String(options.offset);
        if (options.search)
          params.search = options.search;
        if (options.sortColumn)
          params.sortColumn = options.sortColumn;
        if (options.sortOrder)
          params.sortOrder = options.sortOrder;
      }
      return Object.keys(params).length > 0 ? "?" + new URLSearchParams(params).toString() : "";
    }
  };
  var StorageAnalyticsClient = class extends BaseApiClient {
    /**
    * @alpha
    *
    * Creates a new StorageAnalyticsClient instance
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Analytics Buckets
    * @param url - The base URL for the storage API
    * @param headers - HTTP headers to include in requests
    * @param fetch - Optional custom fetch implementation
    *
    * @example
    * ```typescript
    * const client = new StorageAnalyticsClient(url, headers)
    * ```
    */
    constructor(url, headers = {}, fetch$1) {
      const finalUrl = url.replace(/\/$/, "");
      const finalHeaders = _objectSpread2(_objectSpread2({}, DEFAULT_HEADERS), headers);
      super(finalUrl, finalHeaders, fetch$1, "storage");
    }
    /**
    * @alpha
    *
    * Creates a new analytics bucket using Iceberg tables
    * Analytics buckets are optimized for analytical queries and data processing
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Analytics Buckets
    * @param name A unique name for the bucket you are creating
    * @returns Promise with response containing newly created analytics bucket or error
    *
    * @example Create analytics bucket
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .analytics
    *   .createBucket('analytics-data')
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "name": "analytics-data",
    *     "type": "ANALYTICS",
    *     "format": "iceberg",
    *     "created_at": "2024-05-22T22:26:05.100Z",
    *     "updated_at": "2024-05-22T22:26:05.100Z"
    *   },
    *   "error": null
    * }
    * ```
    */
    async createBucket(name) {
      var _this = this;
      return _this.handleOperation(async () => {
        return await post(_this.fetch, `${_this.url}/bucket`, { name }, { headers: _this.headers });
      });
    }
    /**
    * @alpha
    *
    * Retrieves the details of all Analytics Storage buckets within an existing project
    * Only returns buckets of type 'ANALYTICS'
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Analytics Buckets
    * @param options Query parameters for listing buckets
    * @param options.limit Maximum number of buckets to return
    * @param options.offset Number of buckets to skip
    * @param options.sortColumn Column to sort by ('name', 'created_at', 'updated_at')
    * @param options.sortOrder Sort order ('asc' or 'desc')
    * @param options.search Search term to filter bucket names
    * @returns Promise with response containing array of analytics buckets or error
    *
    * @example List analytics buckets
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .analytics
    *   .listBuckets({
    *     limit: 10,
    *     offset: 0,
    *     sortColumn: 'created_at',
    *     sortOrder: 'desc'
    *   })
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": [
    *     {
    *       "name": "analytics-data",
    *       "type": "ANALYTICS",
    *       "format": "iceberg",
    *       "created_at": "2024-05-22T22:26:05.100Z",
    *       "updated_at": "2024-05-22T22:26:05.100Z"
    *     }
    *   ],
    *   "error": null
    * }
    * ```
    */
    async listBuckets(options) {
      var _this2 = this;
      return _this2.handleOperation(async () => {
        const queryParams = new URLSearchParams();
        if ((options === null || options === void 0 ? void 0 : options.limit) !== void 0)
          queryParams.set("limit", options.limit.toString());
        if ((options === null || options === void 0 ? void 0 : options.offset) !== void 0)
          queryParams.set("offset", options.offset.toString());
        if (options === null || options === void 0 ? void 0 : options.sortColumn)
          queryParams.set("sortColumn", options.sortColumn);
        if (options === null || options === void 0 ? void 0 : options.sortOrder)
          queryParams.set("sortOrder", options.sortOrder);
        if (options === null || options === void 0 ? void 0 : options.search)
          queryParams.set("search", options.search);
        const queryString = queryParams.toString();
        const url = queryString ? `${_this2.url}/bucket?${queryString}` : `${_this2.url}/bucket`;
        return await get(_this2.fetch, url, { headers: _this2.headers });
      });
    }
    /**
    * @alpha
    *
    * Deletes an existing analytics bucket
    * A bucket can't be deleted with existing objects inside it
    * You must first empty the bucket before deletion
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Analytics Buckets
    * @param bucketName The unique identifier of the bucket you would like to delete
    * @returns Promise with response containing success message or error
    *
    * @example Delete analytics bucket
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .analytics
    *   .deleteBucket('analytics-data')
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "message": "Successfully deleted"
    *   },
    *   "error": null
    * }
    * ```
    */
    async deleteBucket(bucketName) {
      var _this3 = this;
      return _this3.handleOperation(async () => {
        return await remove(_this3.fetch, `${_this3.url}/bucket/${bucketName}`, {}, { headers: _this3.headers });
      });
    }
    /**
    * @alpha
    *
    * Get an Iceberg REST Catalog client configured for a specific analytics bucket
    * Use this to perform advanced table and namespace operations within the bucket
    * The returned client provides full access to the Apache Iceberg REST Catalog API
    * with the Supabase `{ data, error }` pattern for consistent error handling on all operations.
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Analytics Buckets
    * @param bucketName - The name of the analytics bucket (warehouse) to connect to
    * @returns The wrapped Iceberg catalog client
    * @throws {StorageError} If the bucket name is invalid
    *
    * @example Get catalog and create table
    * ```js
    * // First, create an analytics bucket
    * const { data: bucket, error: bucketError } = await supabase
    *   .storage
    *   .analytics
    *   .createBucket('analytics-data')
    *
    * // Get the Iceberg catalog for that bucket
    * const catalog = supabase.storage.analytics.from('analytics-data')
    *
    * // Create a namespace
    * const { error: nsError } = await catalog.createNamespace({ namespace: ['default'] })
    *
    * // Create a table with schema
    * const { data: tableMetadata, error: tableError } = await catalog.createTable(
    *   { namespace: ['default'] },
    *   {
    *     name: 'events',
    *     schema: {
    *       type: 'struct',
    *       fields: [
    *         { id: 1, name: 'id', type: 'long', required: true },
    *         { id: 2, name: 'timestamp', type: 'timestamp', required: true },
    *         { id: 3, name: 'user_id', type: 'string', required: false }
    *       ],
    *       'schema-id': 0,
    *       'identifier-field-ids': [1]
    *     },
    *     'partition-spec': {
    *       'spec-id': 0,
    *       fields: []
    *     },
    *     'write-order': {
    *       'order-id': 0,
    *       fields: []
    *     },
    *     properties: {
    *       'write.format.default': 'parquet'
    *     }
    *   }
    * )
    * ```
    *
    * @example List tables in namespace
    * ```js
    * const catalog = supabase.storage.analytics.from('analytics-data')
    *
    * // List all tables in the default namespace
    * const { data: tables, error: listError } = await catalog.listTables({ namespace: ['default'] })
    * if (listError) {
    *   if (listError.isNotFound()) {
    *     console.log('Namespace not found')
    *   }
    *   return
    * }
    * console.log(tables) // [{ namespace: ['default'], name: 'events' }]
    * ```
    *
    * @example Working with namespaces
    * ```js
    * const catalog = supabase.storage.analytics.from('analytics-data')
    *
    * // List all namespaces
    * const { data: namespaces } = await catalog.listNamespaces()
    *
    * // Create namespace with properties
    * await catalog.createNamespace(
    *   { namespace: ['production'] },
    *   { properties: { owner: 'data-team', env: 'prod' } }
    * )
    * ```
    *
    * @example Cleanup operations
    * ```js
    * const catalog = supabase.storage.analytics.from('analytics-data')
    *
    * // Drop table with purge option (removes all data)
    * const { error: dropError } = await catalog.dropTable(
    *   { namespace: ['default'], name: 'events' },
    *   { purge: true }
    * )
    *
    * if (dropError?.isNotFound()) {
    *   console.log('Table does not exist')
    * }
    *
    * // Drop namespace (must be empty)
    * await catalog.dropNamespace({ namespace: ['default'] })
    * ```
    *
    * @remarks
    * This method provides a bridge between Supabase's bucket management and the standard
    * Apache Iceberg REST Catalog API. The bucket name maps to the Iceberg warehouse parameter.
    * All authentication and configuration is handled automatically using your Supabase credentials.
    *
    * **Error Handling**: Invalid bucket names throw immediately. All catalog
    * operations return `{ data, error }` where errors are `IcebergError` instances from iceberg-js.
    * Use helper methods like `error.isNotFound()` or check `error.status` for specific error handling.
    * Use `.throwOnError()` on the analytics client if you prefer exceptions for catalog operations.
    *
    * **Cleanup Operations**: When using `dropTable`, the `purge: true` option permanently
    * deletes all table data. Without it, the table is marked as deleted but data remains.
    *
    * **Library Dependency**: The returned catalog wraps `IcebergRestCatalog` from iceberg-js.
    * For complete API documentation and advanced usage, refer to the
    * [iceberg-js documentation](https://supabase.github.io/iceberg-js/).
    */
    from(bucketName) {
      var _this4 = this;
      if (!isValidBucketName(bucketName))
        throw new StorageError("Invalid bucket name: File, folder, and bucket names must follow AWS object key naming guidelines and should avoid the use of any other characters.");
      const catalog = new IcebergRestCatalog({
        baseUrl: this.url,
        catalogName: bucketName,
        auth: {
          type: "custom",
          getHeaders: async () => _this4.headers
        },
        fetch: this.fetch
      });
      const shouldThrowOnError = this.shouldThrowOnError;
      return new Proxy(catalog, { get(target, prop) {
        const value = target[prop];
        if (typeof value !== "function")
          return value;
        return async (...args) => {
          try {
            return {
              data: await value.apply(target, args),
              error: null
            };
          } catch (error) {
            if (shouldThrowOnError)
              throw error;
            return {
              data: null,
              error
            };
          }
        };
      } });
    }
  };
  var VectorIndexApi = class extends BaseApiClient {
    /** Creates a new VectorIndexApi instance */
    constructor(url, headers = {}, fetch$1) {
      const finalUrl = url.replace(/\/$/, "");
      const finalHeaders = _objectSpread2(_objectSpread2({}, DEFAULT_HEADERS), {}, { "Content-Type": "application/json" }, headers);
      super(finalUrl, finalHeaders, fetch$1, "vectors");
    }
    /** Creates a new vector index within a bucket */
    async createIndex(options) {
      var _this = this;
      return _this.handleOperation(async () => {
        return await vectorsApi.post(_this.fetch, `${_this.url}/CreateIndex`, options, { headers: _this.headers }) || {};
      });
    }
    /** Retrieves metadata for a specific vector index */
    async getIndex(vectorBucketName, indexName) {
      var _this2 = this;
      return _this2.handleOperation(async () => {
        return await vectorsApi.post(_this2.fetch, `${_this2.url}/GetIndex`, {
          vectorBucketName,
          indexName
        }, { headers: _this2.headers });
      });
    }
    /** Lists vector indexes within a bucket with optional filtering and pagination */
    async listIndexes(options) {
      var _this3 = this;
      return _this3.handleOperation(async () => {
        return await vectorsApi.post(_this3.fetch, `${_this3.url}/ListIndexes`, options, { headers: _this3.headers });
      });
    }
    /** Deletes a vector index and all its data */
    async deleteIndex(vectorBucketName, indexName) {
      var _this4 = this;
      return _this4.handleOperation(async () => {
        return await vectorsApi.post(_this4.fetch, `${_this4.url}/DeleteIndex`, {
          vectorBucketName,
          indexName
        }, { headers: _this4.headers }) || {};
      });
    }
  };
  var VectorDataApi = class extends BaseApiClient {
    /** Creates a new VectorDataApi instance */
    constructor(url, headers = {}, fetch$1) {
      const finalUrl = url.replace(/\/$/, "");
      const finalHeaders = _objectSpread2(_objectSpread2({}, DEFAULT_HEADERS), {}, { "Content-Type": "application/json" }, headers);
      super(finalUrl, finalHeaders, fetch$1, "vectors");
    }
    /** Inserts or updates vectors in batch (1-500 per request) */
    async putVectors(options) {
      var _this = this;
      if (options.vectors.length < 1 || options.vectors.length > 500)
        throw new Error("Vector batch size must be between 1 and 500 items");
      return _this.handleOperation(async () => {
        return await vectorsApi.post(_this.fetch, `${_this.url}/PutVectors`, options, { headers: _this.headers }) || {};
      });
    }
    /** Retrieves vectors by their keys in batch */
    async getVectors(options) {
      var _this2 = this;
      return _this2.handleOperation(async () => {
        return await vectorsApi.post(_this2.fetch, `${_this2.url}/GetVectors`, options, { headers: _this2.headers });
      });
    }
    /** Lists vectors in an index with pagination */
    async listVectors(options) {
      var _this3 = this;
      if (options.segmentCount !== void 0) {
        if (options.segmentCount < 1 || options.segmentCount > 16)
          throw new Error("segmentCount must be between 1 and 16");
        if (options.segmentIndex !== void 0) {
          if (options.segmentIndex < 0 || options.segmentIndex >= options.segmentCount)
            throw new Error(`segmentIndex must be between 0 and ${options.segmentCount - 1}`);
        }
      }
      return _this3.handleOperation(async () => {
        return await vectorsApi.post(_this3.fetch, `${_this3.url}/ListVectors`, options, { headers: _this3.headers });
      });
    }
    /** Queries for similar vectors using approximate nearest neighbor search */
    async queryVectors(options) {
      var _this4 = this;
      return _this4.handleOperation(async () => {
        return await vectorsApi.post(_this4.fetch, `${_this4.url}/QueryVectors`, options, { headers: _this4.headers });
      });
    }
    /** Deletes vectors by their keys in batch (1-500 per request) */
    async deleteVectors(options) {
      var _this5 = this;
      if (options.keys.length < 1 || options.keys.length > 500)
        throw new Error("Keys batch size must be between 1 and 500 items");
      return _this5.handleOperation(async () => {
        return await vectorsApi.post(_this5.fetch, `${_this5.url}/DeleteVectors`, options, { headers: _this5.headers }) || {};
      });
    }
  };
  var VectorBucketApi = class extends BaseApiClient {
    /** Creates a new VectorBucketApi instance */
    constructor(url, headers = {}, fetch$1) {
      const finalUrl = url.replace(/\/$/, "");
      const finalHeaders = _objectSpread2(_objectSpread2({}, DEFAULT_HEADERS), {}, { "Content-Type": "application/json" }, headers);
      super(finalUrl, finalHeaders, fetch$1, "vectors");
    }
    /** Creates a new vector bucket */
    async createBucket(vectorBucketName) {
      var _this = this;
      return _this.handleOperation(async () => {
        return await vectorsApi.post(_this.fetch, `${_this.url}/CreateVectorBucket`, { vectorBucketName }, { headers: _this.headers }) || {};
      });
    }
    /** Retrieves metadata for a specific vector bucket */
    async getBucket(vectorBucketName) {
      var _this2 = this;
      return _this2.handleOperation(async () => {
        return await vectorsApi.post(_this2.fetch, `${_this2.url}/GetVectorBucket`, { vectorBucketName }, { headers: _this2.headers });
      });
    }
    /** Lists vector buckets with optional filtering and pagination */
    async listBuckets(options = {}) {
      var _this3 = this;
      return _this3.handleOperation(async () => {
        return await vectorsApi.post(_this3.fetch, `${_this3.url}/ListVectorBuckets`, options, { headers: _this3.headers });
      });
    }
    /** Deletes a vector bucket (must be empty first) */
    async deleteBucket(vectorBucketName) {
      var _this4 = this;
      return _this4.handleOperation(async () => {
        return await vectorsApi.post(_this4.fetch, `${_this4.url}/DeleteVectorBucket`, { vectorBucketName }, { headers: _this4.headers }) || {};
      });
    }
  };
  var StorageVectorsClient = class extends VectorBucketApi {
    /**
    * @alpha
    *
    * Creates a StorageVectorsClient that can manage buckets, indexes, and vectors.
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Vector Buckets
    * @param url - Base URL of the Storage Vectors REST API.
    * @param options.headers - Optional headers (for example `Authorization`) applied to every request.
    * @param options.fetch - Optional custom `fetch` implementation for non-browser runtimes.
    *
    * @example
    * ```typescript
    * const client = new StorageVectorsClient(url, options)
    * ```
    */
    constructor(url, options = {}) {
      super(url, options.headers || {}, options.fetch);
    }
    /**
    *
    * @alpha
    *
    * Access operations for a specific vector bucket
    * Returns a scoped client for index and vector operations within the bucket
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Vector Buckets
    * @param vectorBucketName - Name of the vector bucket
    * @returns Bucket-scoped client with index and vector operations
    *
    * @example
    * ```typescript
    * const bucket = supabase.storage.vectors.from('embeddings-prod')
    * ```
    */
    from(vectorBucketName) {
      return new VectorBucketScope(this.url, this.headers, vectorBucketName, this.fetch);
    }
    /**
    *
    * @alpha
    *
    * Creates a new vector bucket
    * Vector buckets are containers for vector indexes and their data
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Vector Buckets
    * @param vectorBucketName - Unique name for the vector bucket
    * @returns Promise with empty response on success or error
    *
    * @example
    * ```typescript
    * const { data, error } = await supabase
    *   .storage
    *   .vectors
    *   .createBucket('embeddings-prod')
    * ```
    */
    async createBucket(vectorBucketName) {
      var _superprop_getCreateBucket = () => super.createBucket, _this = this;
      return _superprop_getCreateBucket().call(_this, vectorBucketName);
    }
    /**
    *
    * @alpha
    *
    * Retrieves metadata for a specific vector bucket
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Vector Buckets
    * @param vectorBucketName - Name of the vector bucket
    * @returns Promise with bucket metadata or error
    *
    * @example
    * ```typescript
    * const { data, error } = await supabase
    *   .storage
    *   .vectors
    *   .getBucket('embeddings-prod')
    *
    * console.log('Bucket created:', data?.vectorBucket.creationTime)
    * ```
    */
    async getBucket(vectorBucketName) {
      var _superprop_getGetBucket = () => super.getBucket, _this2 = this;
      return _superprop_getGetBucket().call(_this2, vectorBucketName);
    }
    /**
    *
    * @alpha
    *
    * Lists all vector buckets with optional filtering and pagination
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Vector Buckets
    * @param options - Optional filters (prefix, maxResults, nextToken)
    * @returns Promise with list of buckets or error
    *
    * @example
    * ```typescript
    * const { data, error } = await supabase
    *   .storage
    *   .vectors
    *   .listBuckets({ prefix: 'embeddings-' })
    *
    * data?.vectorBuckets.forEach(bucket => {
    *   console.log(bucket.vectorBucketName)
    * })
    * ```
    */
    async listBuckets(options = {}) {
      var _superprop_getListBuckets = () => super.listBuckets, _this3 = this;
      return _superprop_getListBuckets().call(_this3, options);
    }
    /**
    *
    * @alpha
    *
    * Deletes a vector bucket (bucket must be empty)
    * All indexes must be deleted before deleting the bucket
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Vector Buckets
    * @param vectorBucketName - Name of the vector bucket to delete
    * @returns Promise with empty response on success or error
    *
    * @example
    * ```typescript
    * const { data, error } = await supabase
    *   .storage
    *   .vectors
    *   .deleteBucket('embeddings-old')
    * ```
    */
    async deleteBucket(vectorBucketName) {
      var _superprop_getDeleteBucket = () => super.deleteBucket, _this4 = this;
      return _superprop_getDeleteBucket().call(_this4, vectorBucketName);
    }
  };
  var VectorBucketScope = class extends VectorIndexApi {
    /**
    * @alpha
    *
    * Creates a helper that automatically scopes all index operations to the provided bucket.
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Vector Buckets
    * @example
    * ```typescript
    * const bucket = supabase.storage.vectors.from('embeddings-prod')
    * ```
    */
    constructor(url, headers, vectorBucketName, fetch$1) {
      super(url, headers, fetch$1);
      this.vectorBucketName = vectorBucketName;
    }
    /**
    *
    * @alpha
    *
    * Creates a new vector index in this bucket
    * Convenience method that automatically includes the bucket name
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Vector Buckets
    * @param options - Index configuration (vectorBucketName is automatically set)
    * @returns Promise with empty response on success or error
    *
    * @example
    * ```typescript
    * const bucket = supabase.storage.vectors.from('embeddings-prod')
    * await bucket.createIndex({
    *   indexName: 'documents-openai',
    *   dataType: 'float32',
    *   dimension: 1536,
    *   distanceMetric: 'cosine',
    *   metadataConfiguration: {
    *     nonFilterableMetadataKeys: ['raw_text']
    *   }
    * })
    * ```
    */
    async createIndex(options) {
      var _superprop_getCreateIndex = () => super.createIndex, _this5 = this;
      return _superprop_getCreateIndex().call(_this5, _objectSpread2(_objectSpread2({}, options), {}, { vectorBucketName: _this5.vectorBucketName }));
    }
    /**
    *
    * @alpha
    *
    * Lists indexes in this bucket
    * Convenience method that automatically includes the bucket name
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Vector Buckets
    * @param options - Listing options (vectorBucketName is automatically set)
    * @returns Promise with response containing indexes array and pagination token or error
    *
    * @example
    * ```typescript
    * const bucket = supabase.storage.vectors.from('embeddings-prod')
    * const { data } = await bucket.listIndexes({ prefix: 'documents-' })
    * ```
    */
    async listIndexes(options = {}) {
      var _superprop_getListIndexes = () => super.listIndexes, _this6 = this;
      return _superprop_getListIndexes().call(_this6, _objectSpread2(_objectSpread2({}, options), {}, { vectorBucketName: _this6.vectorBucketName }));
    }
    /**
    *
    * @alpha
    *
    * Retrieves metadata for a specific index in this bucket
    * Convenience method that automatically includes the bucket name
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Vector Buckets
    * @param indexName - Name of the index to retrieve
    * @returns Promise with index metadata or error
    *
    * @example
    * ```typescript
    * const bucket = supabase.storage.vectors.from('embeddings-prod')
    * const { data } = await bucket.getIndex('documents-openai')
    * console.log('Dimension:', data?.index.dimension)
    * ```
    */
    async getIndex(indexName) {
      var _superprop_getGetIndex = () => super.getIndex, _this7 = this;
      return _superprop_getGetIndex().call(_this7, _this7.vectorBucketName, indexName);
    }
    /**
    *
    * @alpha
    *
    * Deletes an index from this bucket
    * Convenience method that automatically includes the bucket name
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Vector Buckets
    * @param indexName - Name of the index to delete
    * @returns Promise with empty response on success or error
    *
    * @example
    * ```typescript
    * const bucket = supabase.storage.vectors.from('embeddings-prod')
    * await bucket.deleteIndex('old-index')
    * ```
    */
    async deleteIndex(indexName) {
      var _superprop_getDeleteIndex = () => super.deleteIndex, _this8 = this;
      return _superprop_getDeleteIndex().call(_this8, _this8.vectorBucketName, indexName);
    }
    /**
    *
    * @alpha
    *
    * Access operations for a specific index within this bucket
    * Returns a scoped client for vector data operations
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Vector Buckets
    * @param indexName - Name of the index
    * @returns Index-scoped client with vector data operations
    *
    * @example
    * ```typescript
    * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
    *
    * // Insert vectors
    * await index.putVectors({
    *   vectors: [
    *     { key: 'doc-1', data: { float32: [...] }, metadata: { title: 'Intro' } }
    *   ]
    * })
    *
    * // Query similar vectors
    * const { data } = await index.queryVectors({
    *   queryVector: { float32: [...] },
    *   topK: 5
    * })
    * ```
    */
    index(indexName) {
      return new VectorIndexScope(this.url, this.headers, this.vectorBucketName, indexName, this.fetch);
    }
  };
  var VectorIndexScope = class extends VectorDataApi {
    /**
    *
    * @alpha
    *
    * Creates a helper that automatically scopes all vector operations to the provided bucket/index names.
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Vector Buckets
    * @example
    * ```typescript
    * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
    * ```
    */
    constructor(url, headers, vectorBucketName, indexName, fetch$1) {
      super(url, headers, fetch$1);
      this.vectorBucketName = vectorBucketName;
      this.indexName = indexName;
    }
    /**
    *
    * @alpha
    *
    * Inserts or updates vectors in this index
    * Convenience method that automatically includes bucket and index names
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Vector Buckets
    * @param options - Vector insertion options (bucket and index names automatically set)
    * @returns Promise with empty response on success or error
    *
    * @example
    * ```typescript
    * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
    * await index.putVectors({
    *   vectors: [
    *     {
    *       key: 'doc-1',
    *       data: { float32: [0.1, 0.2, ...] },
    *       metadata: { title: 'Introduction', page: 1 }
    *     }
    *   ]
    * })
    * ```
    */
    async putVectors(options) {
      var _superprop_getPutVectors = () => super.putVectors, _this9 = this;
      return _superprop_getPutVectors().call(_this9, _objectSpread2(_objectSpread2({}, options), {}, {
        vectorBucketName: _this9.vectorBucketName,
        indexName: _this9.indexName
      }));
    }
    /**
    *
    * @alpha
    *
    * Retrieves vectors by keys from this index
    * Convenience method that automatically includes bucket and index names
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Vector Buckets
    * @param options - Vector retrieval options (bucket and index names automatically set)
    * @returns Promise with response containing vectors array or error
    *
    * @example
    * ```typescript
    * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
    * const { data } = await index.getVectors({
    *   keys: ['doc-1', 'doc-2'],
    *   returnMetadata: true
    * })
    * ```
    */
    async getVectors(options) {
      var _superprop_getGetVectors = () => super.getVectors, _this10 = this;
      return _superprop_getGetVectors().call(_this10, _objectSpread2(_objectSpread2({}, options), {}, {
        vectorBucketName: _this10.vectorBucketName,
        indexName: _this10.indexName
      }));
    }
    /**
    *
    * @alpha
    *
    * Lists vectors in this index with pagination
    * Convenience method that automatically includes bucket and index names
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Vector Buckets
    * @param options - Listing options (bucket and index names automatically set)
    * @returns Promise with response containing vectors array and pagination token or error
    *
    * @example
    * ```typescript
    * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
    * const { data } = await index.listVectors({
    *   maxResults: 500,
    *   returnMetadata: true
    * })
    * ```
    */
    async listVectors(options = {}) {
      var _superprop_getListVectors = () => super.listVectors, _this11 = this;
      return _superprop_getListVectors().call(_this11, _objectSpread2(_objectSpread2({}, options), {}, {
        vectorBucketName: _this11.vectorBucketName,
        indexName: _this11.indexName
      }));
    }
    /**
    *
    * @alpha
    *
    * Queries for similar vectors in this index
    * Convenience method that automatically includes bucket and index names
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Vector Buckets
    * @param options - Query options (bucket and index names automatically set)
    * @returns Promise with response containing matches array of similar vectors ordered by distance or error
    *
    * @example
    * ```typescript
    * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
    * const { data } = await index.queryVectors({
    *   queryVector: { float32: [0.1, 0.2, ...] },
    *   topK: 5,
    *   filter: { category: 'technical' },
    *   returnDistance: true,
    *   returnMetadata: true
    * })
    * ```
    */
    async queryVectors(options) {
      var _superprop_getQueryVectors = () => super.queryVectors, _this12 = this;
      return _superprop_getQueryVectors().call(_this12, _objectSpread2(_objectSpread2({}, options), {}, {
        vectorBucketName: _this12.vectorBucketName,
        indexName: _this12.indexName
      }));
    }
    /**
    *
    * @alpha
    *
    * Deletes vectors by keys from this index
    * Convenience method that automatically includes bucket and index names
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Vector Buckets
    * @param options - Deletion options (bucket and index names automatically set)
    * @returns Promise with empty response on success or error
    *
    * @example
    * ```typescript
    * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
    * await index.deleteVectors({
    *   keys: ['doc-1', 'doc-2', 'doc-3']
    * })
    * ```
    */
    async deleteVectors(options) {
      var _superprop_getDeleteVectors = () => super.deleteVectors, _this13 = this;
      return _superprop_getDeleteVectors().call(_this13, _objectSpread2(_objectSpread2({}, options), {}, {
        vectorBucketName: _this13.vectorBucketName,
        indexName: _this13.indexName
      }));
    }
  };
  var StorageClient = class extends StorageBucketApi {
    /**
    * Creates a client for Storage buckets, files, analytics, and vectors.
    *
    * @category File Buckets
    * @example
    * ```ts
    * import { StorageClient } from '@supabase/storage-js'
    *
    * const storage = new StorageClient('https://xyzcompany.supabase.co/storage/v1', {
    *   apikey: 'public-anon-key',
    * })
    * const avatars = storage.from('avatars')
    * ```
    */
    constructor(url, headers = {}, fetch$1, opts) {
      super(url, headers, fetch$1, opts);
    }
    /**
    * Perform file operation in a bucket.
    *
    * @category File Buckets
    * @param id The bucket id to operate on.
    *
    * @example
    * ```typescript
    * const avatars = supabase.storage.from('avatars')
    * ```
    */
    from(id) {
      return new StorageFileApi(this.url, this.headers, id, this.fetch);
    }
    /**
    *
    * @alpha
    *
    * Access vector storage operations.
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Vector Buckets
    * @returns A StorageVectorsClient instance configured with the current storage settings.
    */
    get vectors() {
      return new StorageVectorsClient(this.url + "/vector", {
        headers: this.headers,
        fetch: this.fetch
      });
    }
    /**
    *
    * @alpha
    *
    * Access analytics storage operations using Iceberg tables.
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Analytics Buckets
    * @returns A StorageAnalyticsClient instance configured with the current storage settings.
    */
    get analytics() {
      return new StorageAnalyticsClient(this.url + "/iceberg", this.headers, this.fetch);
    }
  };

  // ../../node_modules/@supabase/auth-js/dist/module/lib/version.js
  var version3 = "2.93.3";

  // ../../node_modules/@supabase/auth-js/dist/module/lib/constants.js
  var AUTO_REFRESH_TICK_DURATION_MS = 30 * 1e3;
  var AUTO_REFRESH_TICK_THRESHOLD = 3;
  var EXPIRY_MARGIN_MS = AUTO_REFRESH_TICK_THRESHOLD * AUTO_REFRESH_TICK_DURATION_MS;
  var GOTRUE_URL = "http://localhost:9999";
  var STORAGE_KEY = "supabase.auth.token";
  var DEFAULT_HEADERS2 = { "X-Client-Info": `gotrue-js/${version3}` };
  var API_VERSION_HEADER_NAME = "X-Supabase-Api-Version";
  var API_VERSIONS = {
    "2024-01-01": {
      timestamp: Date.parse("2024-01-01T00:00:00.0Z"),
      name: "2024-01-01"
    }
  };
  var BASE64URL_REGEX = /^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}$|[a-z0-9_-]{2}$)$/i;
  var JWKS_TTL = 10 * 60 * 1e3;

  // ../../node_modules/@supabase/auth-js/dist/module/lib/errors.js
  var AuthError = class extends Error {
    constructor(message, status, code) {
      super(message);
      this.__isAuthError = true;
      this.name = "AuthError";
      this.status = status;
      this.code = code;
    }
  };
  function isAuthError(error) {
    return typeof error === "object" && error !== null && "__isAuthError" in error;
  }
  var AuthApiError = class extends AuthError {
    constructor(message, status, code) {
      super(message, status, code);
      this.name = "AuthApiError";
      this.status = status;
      this.code = code;
    }
  };
  function isAuthApiError(error) {
    return isAuthError(error) && error.name === "AuthApiError";
  }
  var AuthUnknownError = class extends AuthError {
    constructor(message, originalError) {
      super(message);
      this.name = "AuthUnknownError";
      this.originalError = originalError;
    }
  };
  var CustomAuthError = class extends AuthError {
    constructor(message, name, status, code) {
      super(message, status, code);
      this.name = name;
      this.status = status;
    }
  };
  var AuthSessionMissingError = class extends CustomAuthError {
    constructor() {
      super("Auth session missing!", "AuthSessionMissingError", 400, void 0);
    }
  };
  function isAuthSessionMissingError(error) {
    return isAuthError(error) && error.name === "AuthSessionMissingError";
  }
  var AuthInvalidTokenResponseError = class extends CustomAuthError {
    constructor() {
      super("Auth session or user missing", "AuthInvalidTokenResponseError", 500, void 0);
    }
  };
  var AuthInvalidCredentialsError = class extends CustomAuthError {
    constructor(message) {
      super(message, "AuthInvalidCredentialsError", 400, void 0);
    }
  };
  var AuthImplicitGrantRedirectError = class extends CustomAuthError {
    constructor(message, details = null) {
      super(message, "AuthImplicitGrantRedirectError", 500, void 0);
      this.details = null;
      this.details = details;
    }
    toJSON() {
      return {
        name: this.name,
        message: this.message,
        status: this.status,
        details: this.details
      };
    }
  };
  function isAuthImplicitGrantRedirectError(error) {
    return isAuthError(error) && error.name === "AuthImplicitGrantRedirectError";
  }
  var AuthPKCEGrantCodeExchangeError = class extends CustomAuthError {
    constructor(message, details = null) {
      super(message, "AuthPKCEGrantCodeExchangeError", 500, void 0);
      this.details = null;
      this.details = details;
    }
    toJSON() {
      return {
        name: this.name,
        message: this.message,
        status: this.status,
        details: this.details
      };
    }
  };
  var AuthPKCECodeVerifierMissingError = class extends CustomAuthError {
    constructor() {
      super("PKCE code verifier not found in storage. This can happen if the auth flow was initiated in a different browser or device, or if the storage was cleared. For SSR frameworks (Next.js, SvelteKit, etc.), use @supabase/ssr on both the server and client to store the code verifier in cookies.", "AuthPKCECodeVerifierMissingError", 400, "pkce_code_verifier_not_found");
    }
  };
  var AuthRetryableFetchError = class extends CustomAuthError {
    constructor(message, status) {
      super(message, "AuthRetryableFetchError", status, void 0);
    }
  };
  function isAuthRetryableFetchError(error) {
    return isAuthError(error) && error.name === "AuthRetryableFetchError";
  }
  var AuthWeakPasswordError = class extends CustomAuthError {
    constructor(message, status, reasons) {
      super(message, "AuthWeakPasswordError", status, "weak_password");
      this.reasons = reasons;
    }
  };
  var AuthInvalidJwtError = class extends CustomAuthError {
    constructor(message) {
      super(message, "AuthInvalidJwtError", 400, "invalid_jwt");
    }
  };

  // ../../node_modules/@supabase/auth-js/dist/module/lib/base64url.js
  var TO_BASE64URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split("");
  var IGNORE_BASE64URL = " 	\n\r=".split("");
  var FROM_BASE64URL = (() => {
    const charMap = new Array(128);
    for (let i = 0; i < charMap.length; i += 1) {
      charMap[i] = -1;
    }
    for (let i = 0; i < IGNORE_BASE64URL.length; i += 1) {
      charMap[IGNORE_BASE64URL[i].charCodeAt(0)] = -2;
    }
    for (let i = 0; i < TO_BASE64URL.length; i += 1) {
      charMap[TO_BASE64URL[i].charCodeAt(0)] = i;
    }
    return charMap;
  })();
  function byteToBase64URL(byte, state, emit) {
    if (byte !== null) {
      state.queue = state.queue << 8 | byte;
      state.queuedBits += 8;
      while (state.queuedBits >= 6) {
        const pos = state.queue >> state.queuedBits - 6 & 63;
        emit(TO_BASE64URL[pos]);
        state.queuedBits -= 6;
      }
    } else if (state.queuedBits > 0) {
      state.queue = state.queue << 6 - state.queuedBits;
      state.queuedBits = 6;
      while (state.queuedBits >= 6) {
        const pos = state.queue >> state.queuedBits - 6 & 63;
        emit(TO_BASE64URL[pos]);
        state.queuedBits -= 6;
      }
    }
  }
  function byteFromBase64URL(charCode, state, emit) {
    const bits = FROM_BASE64URL[charCode];
    if (bits > -1) {
      state.queue = state.queue << 6 | bits;
      state.queuedBits += 6;
      while (state.queuedBits >= 8) {
        emit(state.queue >> state.queuedBits - 8 & 255);
        state.queuedBits -= 8;
      }
    } else if (bits === -2) {
      return;
    } else {
      throw new Error(`Invalid Base64-URL character "${String.fromCharCode(charCode)}"`);
    }
  }
  function stringFromBase64URL(str) {
    const conv = [];
    const utf8Emit = (codepoint) => {
      conv.push(String.fromCodePoint(codepoint));
    };
    const utf8State = {
      utf8seq: 0,
      codepoint: 0
    };
    const b64State = { queue: 0, queuedBits: 0 };
    const byteEmit = (byte) => {
      stringFromUTF8(byte, utf8State, utf8Emit);
    };
    for (let i = 0; i < str.length; i += 1) {
      byteFromBase64URL(str.charCodeAt(i), b64State, byteEmit);
    }
    return conv.join("");
  }
  function codepointToUTF8(codepoint, emit) {
    if (codepoint <= 127) {
      emit(codepoint);
      return;
    } else if (codepoint <= 2047) {
      emit(192 | codepoint >> 6);
      emit(128 | codepoint & 63);
      return;
    } else if (codepoint <= 65535) {
      emit(224 | codepoint >> 12);
      emit(128 | codepoint >> 6 & 63);
      emit(128 | codepoint & 63);
      return;
    } else if (codepoint <= 1114111) {
      emit(240 | codepoint >> 18);
      emit(128 | codepoint >> 12 & 63);
      emit(128 | codepoint >> 6 & 63);
      emit(128 | codepoint & 63);
      return;
    }
    throw new Error(`Unrecognized Unicode codepoint: ${codepoint.toString(16)}`);
  }
  function stringToUTF8(str, emit) {
    for (let i = 0; i < str.length; i += 1) {
      let codepoint = str.charCodeAt(i);
      if (codepoint > 55295 && codepoint <= 56319) {
        const highSurrogate = (codepoint - 55296) * 1024 & 65535;
        const lowSurrogate = str.charCodeAt(i + 1) - 56320 & 65535;
        codepoint = (lowSurrogate | highSurrogate) + 65536;
        i += 1;
      }
      codepointToUTF8(codepoint, emit);
    }
  }
  function stringFromUTF8(byte, state, emit) {
    if (state.utf8seq === 0) {
      if (byte <= 127) {
        emit(byte);
        return;
      }
      for (let leadingBit = 1; leadingBit < 6; leadingBit += 1) {
        if ((byte >> 7 - leadingBit & 1) === 0) {
          state.utf8seq = leadingBit;
          break;
        }
      }
      if (state.utf8seq === 2) {
        state.codepoint = byte & 31;
      } else if (state.utf8seq === 3) {
        state.codepoint = byte & 15;
      } else if (state.utf8seq === 4) {
        state.codepoint = byte & 7;
      } else {
        throw new Error("Invalid UTF-8 sequence");
      }
      state.utf8seq -= 1;
    } else if (state.utf8seq > 0) {
      if (byte <= 127) {
        throw new Error("Invalid UTF-8 sequence");
      }
      state.codepoint = state.codepoint << 6 | byte & 63;
      state.utf8seq -= 1;
      if (state.utf8seq === 0) {
        emit(state.codepoint);
      }
    }
  }
  function base64UrlToUint8Array(str) {
    const result2 = [];
    const state = { queue: 0, queuedBits: 0 };
    const onByte = (byte) => {
      result2.push(byte);
    };
    for (let i = 0; i < str.length; i += 1) {
      byteFromBase64URL(str.charCodeAt(i), state, onByte);
    }
    return new Uint8Array(result2);
  }
  function stringToUint8Array(str) {
    const result2 = [];
    stringToUTF8(str, (byte) => result2.push(byte));
    return new Uint8Array(result2);
  }
  function bytesToBase64URL(bytes) {
    const result2 = [];
    const state = { queue: 0, queuedBits: 0 };
    const onChar = (char) => {
      result2.push(char);
    };
    bytes.forEach((byte) => byteToBase64URL(byte, state, onChar));
    byteToBase64URL(null, state, onChar);
    return result2.join("");
  }

  // ../../node_modules/@supabase/auth-js/dist/module/lib/helpers.js
  function expiresAt(expiresIn) {
    const timeNow = Math.round(Date.now() / 1e3);
    return timeNow + expiresIn;
  }
  function generateCallbackId() {
    return Symbol("auth-callback");
  }
  var isBrowser = () => typeof window !== "undefined" && typeof document !== "undefined";
  var localStorageWriteTests = {
    tested: false,
    writable: false
  };
  var supportsLocalStorage = () => {
    if (!isBrowser()) {
      return false;
    }
    try {
      if (typeof globalThis.localStorage !== "object") {
        return false;
      }
    } catch (e) {
      return false;
    }
    if (localStorageWriteTests.tested) {
      return localStorageWriteTests.writable;
    }
    const randomKey = `lswt-${Math.random()}${Math.random()}`;
    try {
      globalThis.localStorage.setItem(randomKey, randomKey);
      globalThis.localStorage.removeItem(randomKey);
      localStorageWriteTests.tested = true;
      localStorageWriteTests.writable = true;
    } catch (e) {
      localStorageWriteTests.tested = true;
      localStorageWriteTests.writable = false;
    }
    return localStorageWriteTests.writable;
  };
  function parseParametersFromURL(href) {
    const result2 = {};
    const url = new URL(href);
    if (url.hash && url.hash[0] === "#") {
      try {
        const hashSearchParams = new URLSearchParams(url.hash.substring(1));
        hashSearchParams.forEach((value, key) => {
          result2[key] = value;
        });
      } catch (e) {
      }
    }
    url.searchParams.forEach((value, key) => {
      result2[key] = value;
    });
    return result2;
  }
  var resolveFetch3 = (customFetch) => {
    if (customFetch) {
      return (...args) => customFetch(...args);
    }
    return (...args) => fetch(...args);
  };
  var looksLikeFetchResponse = (maybeResponse) => {
    return typeof maybeResponse === "object" && maybeResponse !== null && "status" in maybeResponse && "ok" in maybeResponse && "json" in maybeResponse && typeof maybeResponse.json === "function";
  };
  var setItemAsync = async (storage, key, data) => {
    await storage.setItem(key, JSON.stringify(data));
  };
  var getItemAsync = async (storage, key) => {
    const value = await storage.getItem(key);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch (_a) {
      return value;
    }
  };
  var removeItemAsync = async (storage, key) => {
    await storage.removeItem(key);
  };
  var Deferred = class _Deferred {
    constructor() {
      ;
      this.promise = new _Deferred.promiseConstructor((res, rej) => {
        ;
        this.resolve = res;
        this.reject = rej;
      });
    }
  };
  Deferred.promiseConstructor = Promise;
  function decodeJWT(token) {
    const parts2 = token.split(".");
    if (parts2.length !== 3) {
      throw new AuthInvalidJwtError("Invalid JWT structure");
    }
    for (let i = 0; i < parts2.length; i++) {
      if (!BASE64URL_REGEX.test(parts2[i])) {
        throw new AuthInvalidJwtError("JWT not in base64url format");
      }
    }
    const data = {
      // using base64url lib
      header: JSON.parse(stringFromBase64URL(parts2[0])),
      payload: JSON.parse(stringFromBase64URL(parts2[1])),
      signature: base64UrlToUint8Array(parts2[2]),
      raw: {
        header: parts2[0],
        payload: parts2[1]
      }
    };
    return data;
  }
  async function sleep(time) {
    return await new Promise((accept) => {
      setTimeout(() => accept(null), time);
    });
  }
  function retryable(fn, isRetryable) {
    const promise = new Promise((accept, reject) => {
      ;
      (async () => {
        for (let attempt = 0; attempt < Infinity; attempt++) {
          try {
            const result2 = await fn(attempt);
            if (!isRetryable(attempt, null, result2)) {
              accept(result2);
              return;
            }
          } catch (e) {
            if (!isRetryable(attempt, e)) {
              reject(e);
              return;
            }
          }
        }
      })();
    });
    return promise;
  }
  function dec2hex(dec) {
    return ("0" + dec.toString(16)).substr(-2);
  }
  function generatePKCEVerifier() {
    const verifierLength = 56;
    const array = new Uint32Array(verifierLength);
    if (typeof crypto === "undefined") {
      const charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
      const charSetLen = charSet.length;
      let verifier = "";
      for (let i = 0; i < verifierLength; i++) {
        verifier += charSet.charAt(Math.floor(Math.random() * charSetLen));
      }
      return verifier;
    }
    crypto.getRandomValues(array);
    return Array.from(array, dec2hex).join("");
  }
  async function sha256(randomString) {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(randomString);
    const hash = await crypto.subtle.digest("SHA-256", encodedData);
    const bytes = new Uint8Array(hash);
    return Array.from(bytes).map((c) => String.fromCharCode(c)).join("");
  }
  async function generatePKCEChallenge(verifier) {
    const hasCryptoSupport = typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined" && typeof TextEncoder !== "undefined";
    if (!hasCryptoSupport) {
      console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256.");
      return verifier;
    }
    const hashed = await sha256(verifier);
    return btoa(hashed).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  async function getCodeChallengeAndMethod(storage, storageKey, isPasswordRecovery = false) {
    const codeVerifier = generatePKCEVerifier();
    let storedCodeVerifier = codeVerifier;
    if (isPasswordRecovery) {
      storedCodeVerifier += "/PASSWORD_RECOVERY";
    }
    await setItemAsync(storage, `${storageKey}-code-verifier`, storedCodeVerifier);
    const codeChallenge = await generatePKCEChallenge(codeVerifier);
    const codeChallengeMethod = codeVerifier === codeChallenge ? "plain" : "s256";
    return [codeChallenge, codeChallengeMethod];
  }
  var API_VERSION_REGEX = /^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i;
  function parseResponseAPIVersion(response) {
    const apiVersion = response.headers.get(API_VERSION_HEADER_NAME);
    if (!apiVersion) {
      return null;
    }
    if (!apiVersion.match(API_VERSION_REGEX)) {
      return null;
    }
    try {
      const date = /* @__PURE__ */ new Date(`${apiVersion}T00:00:00.0Z`);
      return date;
    } catch (e) {
      return null;
    }
  }
  function validateExp(exp) {
    if (!exp) {
      throw new Error("Missing exp claim");
    }
    const timeNow = Math.floor(Date.now() / 1e3);
    if (exp <= timeNow) {
      throw new Error("JWT has expired");
    }
  }
  function getAlgorithm(alg) {
    switch (alg) {
      case "RS256":
        return {
          name: "RSASSA-PKCS1-v1_5",
          hash: { name: "SHA-256" }
        };
      case "ES256":
        return {
          name: "ECDSA",
          namedCurve: "P-256",
          hash: { name: "SHA-256" }
        };
      default:
        throw new Error("Invalid alg claim");
    }
  }
  var UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  function validateUUID(str) {
    if (!UUID_REGEX.test(str)) {
      throw new Error("@supabase/auth-js: Expected parameter to be UUID but is not");
    }
  }
  function userNotAvailableProxy() {
    const proxyTarget = {};
    return new Proxy(proxyTarget, {
      get: (target, prop) => {
        if (prop === "__isUserNotAvailableProxy") {
          return true;
        }
        if (typeof prop === "symbol") {
          const sProp = prop.toString();
          if (sProp === "Symbol(Symbol.toPrimitive)" || sProp === "Symbol(Symbol.toStringTag)" || sProp === "Symbol(util.inspect.custom)") {
            return void 0;
          }
        }
        throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Accessing the "${prop}" property of the session object is not supported. Please use getUser() instead.`);
      },
      set: (_target, prop) => {
        throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Setting the "${prop}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`);
      },
      deleteProperty: (_target, prop) => {
        throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Deleting the "${prop}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`);
      }
    });
  }
  function insecureUserWarningProxy(user, suppressWarningRef) {
    return new Proxy(user, {
      get: (target, prop, receiver) => {
        if (prop === "__isInsecureUserWarningProxy") {
          return true;
        }
        if (typeof prop === "symbol") {
          const sProp = prop.toString();
          if (sProp === "Symbol(Symbol.toPrimitive)" || sProp === "Symbol(Symbol.toStringTag)" || sProp === "Symbol(util.inspect.custom)" || sProp === "Symbol(nodejs.util.inspect.custom)") {
            return Reflect.get(target, prop, receiver);
          }
        }
        if (!suppressWarningRef.value && typeof prop === "string") {
          console.warn("Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server.");
          suppressWarningRef.value = true;
        }
        return Reflect.get(target, prop, receiver);
      }
    });
  }
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // ../../node_modules/@supabase/auth-js/dist/module/lib/fetch.js
  var _getErrorMessage2 = (err) => err.msg || err.message || err.error_description || err.error || JSON.stringify(err);
  var NETWORK_ERROR_CODES = [502, 503, 504];
  async function handleError2(error) {
    var _a;
    if (!looksLikeFetchResponse(error)) {
      throw new AuthRetryableFetchError(_getErrorMessage2(error), 0);
    }
    if (NETWORK_ERROR_CODES.includes(error.status)) {
      throw new AuthRetryableFetchError(_getErrorMessage2(error), error.status);
    }
    let data;
    try {
      data = await error.json();
    } catch (e) {
      throw new AuthUnknownError(_getErrorMessage2(e), e);
    }
    let errorCode = void 0;
    const responseAPIVersion = parseResponseAPIVersion(error);
    if (responseAPIVersion && responseAPIVersion.getTime() >= API_VERSIONS["2024-01-01"].timestamp && typeof data === "object" && data && typeof data.code === "string") {
      errorCode = data.code;
    } else if (typeof data === "object" && data && typeof data.error_code === "string") {
      errorCode = data.error_code;
    }
    if (!errorCode) {
      if (typeof data === "object" && data && typeof data.weak_password === "object" && data.weak_password && Array.isArray(data.weak_password.reasons) && data.weak_password.reasons.length && data.weak_password.reasons.reduce((a, i) => a && typeof i === "string", true)) {
        throw new AuthWeakPasswordError(_getErrorMessage2(data), error.status, data.weak_password.reasons);
      }
    } else if (errorCode === "weak_password") {
      throw new AuthWeakPasswordError(_getErrorMessage2(data), error.status, ((_a = data.weak_password) === null || _a === void 0 ? void 0 : _a.reasons) || []);
    } else if (errorCode === "session_not_found") {
      throw new AuthSessionMissingError();
    }
    throw new AuthApiError(_getErrorMessage2(data), error.status || 500, errorCode);
  }
  var _getRequestParams2 = (method, options, parameters, body) => {
    const params = { method, headers: (options === null || options === void 0 ? void 0 : options.headers) || {} };
    if (method === "GET") {
      return params;
    }
    params.headers = Object.assign({ "Content-Type": "application/json;charset=UTF-8" }, options === null || options === void 0 ? void 0 : options.headers);
    params.body = JSON.stringify(body);
    return Object.assign(Object.assign({}, params), parameters);
  };
  async function _request(fetcher, method, url, options) {
    var _a;
    const headers = Object.assign({}, options === null || options === void 0 ? void 0 : options.headers);
    if (!headers[API_VERSION_HEADER_NAME]) {
      headers[API_VERSION_HEADER_NAME] = API_VERSIONS["2024-01-01"].name;
    }
    if (options === null || options === void 0 ? void 0 : options.jwt) {
      headers["Authorization"] = `Bearer ${options.jwt}`;
    }
    const qs = (_a = options === null || options === void 0 ? void 0 : options.query) !== null && _a !== void 0 ? _a : {};
    if (options === null || options === void 0 ? void 0 : options.redirectTo) {
      qs["redirect_to"] = options.redirectTo;
    }
    const queryString = Object.keys(qs).length ? "?" + new URLSearchParams(qs).toString() : "";
    const data = await _handleRequest2(fetcher, method, url + queryString, {
      headers,
      noResolveJson: options === null || options === void 0 ? void 0 : options.noResolveJson
    }, {}, options === null || options === void 0 ? void 0 : options.body);
    return (options === null || options === void 0 ? void 0 : options.xform) ? options === null || options === void 0 ? void 0 : options.xform(data) : { data: Object.assign({}, data), error: null };
  }
  async function _handleRequest2(fetcher, method, url, options, parameters, body) {
    const requestParams = _getRequestParams2(method, options, parameters, body);
    let result2;
    try {
      result2 = await fetcher(url, Object.assign({}, requestParams));
    } catch (e) {
      console.error(e);
      throw new AuthRetryableFetchError(_getErrorMessage2(e), 0);
    }
    if (!result2.ok) {
      await handleError2(result2);
    }
    if (options === null || options === void 0 ? void 0 : options.noResolveJson) {
      return result2;
    }
    try {
      return await result2.json();
    } catch (e) {
      await handleError2(e);
    }
  }
  function _sessionResponse(data) {
    var _a;
    let session = null;
    if (hasSession(data)) {
      session = Object.assign({}, data);
      if (!data.expires_at) {
        session.expires_at = expiresAt(data.expires_in);
      }
    }
    const user = (_a = data.user) !== null && _a !== void 0 ? _a : data;
    return { data: { session, user }, error: null };
  }
  function _sessionResponsePassword(data) {
    const response = _sessionResponse(data);
    if (!response.error && data.weak_password && typeof data.weak_password === "object" && Array.isArray(data.weak_password.reasons) && data.weak_password.reasons.length && data.weak_password.message && typeof data.weak_password.message === "string" && data.weak_password.reasons.reduce((a, i) => a && typeof i === "string", true)) {
      response.data.weak_password = data.weak_password;
    }
    return response;
  }
  function _userResponse(data) {
    var _a;
    const user = (_a = data.user) !== null && _a !== void 0 ? _a : data;
    return { data: { user }, error: null };
  }
  function _ssoResponse(data) {
    return { data, error: null };
  }
  function _generateLinkResponse(data) {
    const { action_link, email_otp, hashed_token, redirect_to, verification_type } = data, rest = __rest(data, ["action_link", "email_otp", "hashed_token", "redirect_to", "verification_type"]);
    const properties = {
      action_link,
      email_otp,
      hashed_token,
      redirect_to,
      verification_type
    };
    const user = Object.assign({}, rest);
    return {
      data: {
        properties,
        user
      },
      error: null
    };
  }
  function _noResolveJsonResponse(data) {
    return data;
  }
  function hasSession(data) {
    return data.access_token && data.refresh_token && data.expires_in;
  }

  // ../../node_modules/@supabase/auth-js/dist/module/lib/types.js
  var SIGN_OUT_SCOPES = ["global", "local", "others"];

  // ../../node_modules/@supabase/auth-js/dist/module/GoTrueAdminApi.js
  var GoTrueAdminApi = class {
    /**
     * Creates an admin API client that can be used to manage users and OAuth clients.
     *
     * @example
     * ```ts
     * import { GoTrueAdminApi } from '@supabase/auth-js'
     *
     * const admin = new GoTrueAdminApi({
     *   url: 'https://xyzcompany.supabase.co/auth/v1',
     *   headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
     * })
     * ```
     */
    constructor({ url = "", headers = {}, fetch: fetch2 }) {
      this.url = url;
      this.headers = headers;
      this.fetch = resolveFetch3(fetch2);
      this.mfa = {
        listFactors: this._listFactors.bind(this),
        deleteFactor: this._deleteFactor.bind(this)
      };
      this.oauth = {
        listClients: this._listOAuthClients.bind(this),
        createClient: this._createOAuthClient.bind(this),
        getClient: this._getOAuthClient.bind(this),
        updateClient: this._updateOAuthClient.bind(this),
        deleteClient: this._deleteOAuthClient.bind(this),
        regenerateClientSecret: this._regenerateOAuthClientSecret.bind(this)
      };
    }
    /**
     * Removes a logged-in session.
     * @param jwt A valid, logged-in JWT.
     * @param scope The logout sope.
     */
    async signOut(jwt, scope = SIGN_OUT_SCOPES[0]) {
      if (SIGN_OUT_SCOPES.indexOf(scope) < 0) {
        throw new Error(`@supabase/auth-js: Parameter scope must be one of ${SIGN_OUT_SCOPES.join(", ")}`);
      }
      try {
        await _request(this.fetch, "POST", `${this.url}/logout?scope=${scope}`, {
          headers: this.headers,
          jwt,
          noResolveJson: true
        });
        return { data: null, error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    /**
     * Sends an invite link to an email address.
     * @param email The email address of the user.
     * @param options Additional options to be included when inviting.
     */
    async inviteUserByEmail(email, options = {}) {
      try {
        return await _request(this.fetch, "POST", `${this.url}/invite`, {
          body: { email, data: options.data },
          headers: this.headers,
          redirectTo: options.redirectTo,
          xform: _userResponse
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null }, error };
        }
        throw error;
      }
    }
    /**
     * Generates email links and OTPs to be sent via a custom email provider.
     * @param email The user's email.
     * @param options.password User password. For signup only.
     * @param options.data Optional user metadata. For signup only.
     * @param options.redirectTo The redirect url which should be appended to the generated link
     */
    async generateLink(params) {
      try {
        const { options } = params, rest = __rest(params, ["options"]);
        const body = Object.assign(Object.assign({}, rest), options);
        if ("newEmail" in rest) {
          body.new_email = rest === null || rest === void 0 ? void 0 : rest.newEmail;
          delete body["newEmail"];
        }
        return await _request(this.fetch, "POST", `${this.url}/admin/generate_link`, {
          body,
          headers: this.headers,
          xform: _generateLinkResponse,
          redirectTo: options === null || options === void 0 ? void 0 : options.redirectTo
        });
      } catch (error) {
        if (isAuthError(error)) {
          return {
            data: {
              properties: null,
              user: null
            },
            error
          };
        }
        throw error;
      }
    }
    // User Admin API
    /**
     * Creates a new user.
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     */
    async createUser(attributes) {
      try {
        return await _request(this.fetch, "POST", `${this.url}/admin/users`, {
          body: attributes,
          headers: this.headers,
          xform: _userResponse
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null }, error };
        }
        throw error;
      }
    }
    /**
     * Get a list of users.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     * @param params An object which supports `page` and `perPage` as numbers, to alter the paginated results.
     */
    async listUsers(params) {
      var _a, _b, _c, _d, _e, _f, _g;
      try {
        const pagination = { nextPage: null, lastPage: 0, total: 0 };
        const response = await _request(this.fetch, "GET", `${this.url}/admin/users`, {
          headers: this.headers,
          noResolveJson: true,
          query: {
            page: (_b = (_a = params === null || params === void 0 ? void 0 : params.page) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : "",
            per_page: (_d = (_c = params === null || params === void 0 ? void 0 : params.perPage) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : ""
          },
          xform: _noResolveJsonResponse
        });
        if (response.error)
          throw response.error;
        const users = await response.json();
        const total = (_e = response.headers.get("x-total-count")) !== null && _e !== void 0 ? _e : 0;
        const links = (_g = (_f = response.headers.get("link")) === null || _f === void 0 ? void 0 : _f.split(",")) !== null && _g !== void 0 ? _g : [];
        if (links.length > 0) {
          links.forEach((link) => {
            const page = parseInt(link.split(";")[0].split("=")[1].substring(0, 1));
            const rel = JSON.parse(link.split(";")[1].split("=")[1]);
            pagination[`${rel}Page`] = page;
          });
          pagination.total = parseInt(total);
        }
        return { data: Object.assign(Object.assign({}, users), pagination), error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { users: [] }, error };
        }
        throw error;
      }
    }
    /**
     * Get user by id.
     *
     * @param uid The user's unique identifier
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     */
    async getUserById(uid) {
      validateUUID(uid);
      try {
        return await _request(this.fetch, "GET", `${this.url}/admin/users/${uid}`, {
          headers: this.headers,
          xform: _userResponse
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null }, error };
        }
        throw error;
      }
    }
    /**
     * Updates the user data. Changes are applied directly without confirmation flows.
     *
     * @param attributes The data you want to update.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     */
    async updateUserById(uid, attributes) {
      validateUUID(uid);
      try {
        return await _request(this.fetch, "PUT", `${this.url}/admin/users/${uid}`, {
          body: attributes,
          headers: this.headers,
          xform: _userResponse
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null }, error };
        }
        throw error;
      }
    }
    /**
     * Delete a user. Requires a `service_role` key.
     *
     * @param id The user id you want to remove.
     * @param shouldSoftDelete If true, then the user will be soft-deleted from the auth schema. Soft deletion allows user identification from the hashed user ID but is not reversible.
     * Defaults to false for backward compatibility.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     */
    async deleteUser(id, shouldSoftDelete = false) {
      validateUUID(id);
      try {
        return await _request(this.fetch, "DELETE", `${this.url}/admin/users/${id}`, {
          headers: this.headers,
          body: {
            should_soft_delete: shouldSoftDelete
          },
          xform: _userResponse
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null }, error };
        }
        throw error;
      }
    }
    async _listFactors(params) {
      validateUUID(params.userId);
      try {
        const { data, error } = await _request(this.fetch, "GET", `${this.url}/admin/users/${params.userId}/factors`, {
          headers: this.headers,
          xform: (factors) => {
            return { data: { factors }, error: null };
          }
        });
        return { data, error };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    async _deleteFactor(params) {
      validateUUID(params.userId);
      validateUUID(params.id);
      try {
        const data = await _request(this.fetch, "DELETE", `${this.url}/admin/users/${params.userId}/factors/${params.id}`, {
          headers: this.headers
        });
        return { data, error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    /**
     * Lists all OAuth clients with optional pagination.
     * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     */
    async _listOAuthClients(params) {
      var _a, _b, _c, _d, _e, _f, _g;
      try {
        const pagination = { nextPage: null, lastPage: 0, total: 0 };
        const response = await _request(this.fetch, "GET", `${this.url}/admin/oauth/clients`, {
          headers: this.headers,
          noResolveJson: true,
          query: {
            page: (_b = (_a = params === null || params === void 0 ? void 0 : params.page) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : "",
            per_page: (_d = (_c = params === null || params === void 0 ? void 0 : params.perPage) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : ""
          },
          xform: _noResolveJsonResponse
        });
        if (response.error)
          throw response.error;
        const clients = await response.json();
        const total = (_e = response.headers.get("x-total-count")) !== null && _e !== void 0 ? _e : 0;
        const links = (_g = (_f = response.headers.get("link")) === null || _f === void 0 ? void 0 : _f.split(",")) !== null && _g !== void 0 ? _g : [];
        if (links.length > 0) {
          links.forEach((link) => {
            const page = parseInt(link.split(";")[0].split("=")[1].substring(0, 1));
            const rel = JSON.parse(link.split(";")[1].split("=")[1]);
            pagination[`${rel}Page`] = page;
          });
          pagination.total = parseInt(total);
        }
        return { data: Object.assign(Object.assign({}, clients), pagination), error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { clients: [] }, error };
        }
        throw error;
      }
    }
    /**
     * Creates a new OAuth client.
     * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     */
    async _createOAuthClient(params) {
      try {
        return await _request(this.fetch, "POST", `${this.url}/admin/oauth/clients`, {
          body: params,
          headers: this.headers,
          xform: (client) => {
            return { data: client, error: null };
          }
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    /**
     * Gets details of a specific OAuth client.
     * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     */
    async _getOAuthClient(clientId) {
      try {
        return await _request(this.fetch, "GET", `${this.url}/admin/oauth/clients/${clientId}`, {
          headers: this.headers,
          xform: (client) => {
            return { data: client, error: null };
          }
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    /**
     * Updates an existing OAuth client.
     * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     */
    async _updateOAuthClient(clientId, params) {
      try {
        return await _request(this.fetch, "PUT", `${this.url}/admin/oauth/clients/${clientId}`, {
          body: params,
          headers: this.headers,
          xform: (client) => {
            return { data: client, error: null };
          }
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    /**
     * Deletes an OAuth client.
     * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     */
    async _deleteOAuthClient(clientId) {
      try {
        await _request(this.fetch, "DELETE", `${this.url}/admin/oauth/clients/${clientId}`, {
          headers: this.headers,
          noResolveJson: true
        });
        return { data: null, error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    /**
     * Regenerates the secret for an OAuth client.
     * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     */
    async _regenerateOAuthClientSecret(clientId) {
      try {
        return await _request(this.fetch, "POST", `${this.url}/admin/oauth/clients/${clientId}/regenerate_secret`, {
          headers: this.headers,
          xform: (client) => {
            return { data: client, error: null };
          }
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
  };

  // ../../node_modules/@supabase/auth-js/dist/module/lib/local-storage.js
  function memoryLocalStorageAdapter(store = {}) {
    return {
      getItem: (key) => {
        return store[key] || null;
      },
      setItem: (key, value) => {
        store[key] = value;
      },
      removeItem: (key) => {
        delete store[key];
      }
    };
  }

  // ../../node_modules/@supabase/auth-js/dist/module/lib/locks.js
  var internals = {
    /**
     * @experimental
     */
    debug: !!(globalThis && supportsLocalStorage() && globalThis.localStorage && globalThis.localStorage.getItem("supabase.gotrue-js.locks.debug") === "true")
  };
  var LockAcquireTimeoutError = class extends Error {
    constructor(message) {
      super(message);
      this.isAcquireTimeout = true;
    }
  };
  var NavigatorLockAcquireTimeoutError = class extends LockAcquireTimeoutError {
  };
  async function navigatorLock(name, acquireTimeout, fn) {
    if (internals.debug) {
      console.log("@supabase/gotrue-js: navigatorLock: acquire lock", name, acquireTimeout);
    }
    const abortController = new globalThis.AbortController();
    if (acquireTimeout > 0) {
      setTimeout(() => {
        abortController.abort();
        if (internals.debug) {
          console.log("@supabase/gotrue-js: navigatorLock acquire timed out", name);
        }
      }, acquireTimeout);
    }
    return await Promise.resolve().then(() => globalThis.navigator.locks.request(name, acquireTimeout === 0 ? {
      mode: "exclusive",
      ifAvailable: true
    } : {
      mode: "exclusive",
      signal: abortController.signal
    }, async (lock) => {
      if (lock) {
        if (internals.debug) {
          console.log("@supabase/gotrue-js: navigatorLock: acquired", name, lock.name);
        }
        try {
          return await fn();
        } finally {
          if (internals.debug) {
            console.log("@supabase/gotrue-js: navigatorLock: released", name, lock.name);
          }
        }
      } else {
        if (acquireTimeout === 0) {
          if (internals.debug) {
            console.log("@supabase/gotrue-js: navigatorLock: not immediately available", name);
          }
          throw new NavigatorLockAcquireTimeoutError(`Acquiring an exclusive Navigator LockManager lock "${name}" immediately failed`);
        } else {
          if (internals.debug) {
            try {
              const result2 = await globalThis.navigator.locks.query();
              console.log("@supabase/gotrue-js: Navigator LockManager state", JSON.stringify(result2, null, "  "));
            } catch (e) {
              console.warn("@supabase/gotrue-js: Error when querying Navigator LockManager state", e);
            }
          }
          console.warn("@supabase/gotrue-js: Navigator LockManager returned a null lock when using #request without ifAvailable set to true, it appears this browser is not following the LockManager spec https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request");
          return await fn();
        }
      }
    }));
  }

  // ../../node_modules/@supabase/auth-js/dist/module/lib/polyfills.js
  function polyfillGlobalThis() {
    if (typeof globalThis === "object")
      return;
    try {
      Object.defineProperty(Object.prototype, "__magic__", {
        get: function() {
          return this;
        },
        configurable: true
      });
      __magic__.globalThis = __magic__;
      delete Object.prototype.__magic__;
    } catch (e) {
      if (typeof self !== "undefined") {
        self.globalThis = self;
      }
    }
  }

  // ../../node_modules/@supabase/auth-js/dist/module/lib/web3/ethereum.js
  function getAddress(address) {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error(`@supabase/auth-js: Address "${address}" is invalid.`);
    }
    return address.toLowerCase();
  }
  function fromHex(hex) {
    return parseInt(hex, 16);
  }
  function toHex(value) {
    const bytes = new TextEncoder().encode(value);
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return "0x" + hex;
  }
  function createSiweMessage(parameters) {
    var _a;
    const { chainId, domain, expirationTime, issuedAt = /* @__PURE__ */ new Date(), nonce, notBefore, requestId, resources, scheme, uri, version: version5 } = parameters;
    {
      if (!Number.isInteger(chainId))
        throw new Error(`@supabase/auth-js: Invalid SIWE message field "chainId". Chain ID must be a EIP-155 chain ID. Provided value: ${chainId}`);
      if (!domain)
        throw new Error(`@supabase/auth-js: Invalid SIWE message field "domain". Domain must be provided.`);
      if (nonce && nonce.length < 8)
        throw new Error(`@supabase/auth-js: Invalid SIWE message field "nonce". Nonce must be at least 8 characters. Provided value: ${nonce}`);
      if (!uri)
        throw new Error(`@supabase/auth-js: Invalid SIWE message field "uri". URI must be provided.`);
      if (version5 !== "1")
        throw new Error(`@supabase/auth-js: Invalid SIWE message field "version". Version must be '1'. Provided value: ${version5}`);
      if ((_a = parameters.statement) === null || _a === void 0 ? void 0 : _a.includes("\n"))
        throw new Error(`@supabase/auth-js: Invalid SIWE message field "statement". Statement must not include '\\n'. Provided value: ${parameters.statement}`);
    }
    const address = getAddress(parameters.address);
    const origin = scheme ? `${scheme}://${domain}` : domain;
    const statement = parameters.statement ? `${parameters.statement}
` : "";
    const prefix = `${origin} wants you to sign in with your Ethereum account:
${address}

${statement}`;
    let suffix = `URI: ${uri}
Version: ${version5}
Chain ID: ${chainId}${nonce ? `
Nonce: ${nonce}` : ""}
Issued At: ${issuedAt.toISOString()}`;
    if (expirationTime)
      suffix += `
Expiration Time: ${expirationTime.toISOString()}`;
    if (notBefore)
      suffix += `
Not Before: ${notBefore.toISOString()}`;
    if (requestId)
      suffix += `
Request ID: ${requestId}`;
    if (resources) {
      let content = "\nResources:";
      for (const resource of resources) {
        if (!resource || typeof resource !== "string")
          throw new Error(`@supabase/auth-js: Invalid SIWE message field "resources". Every resource must be a valid string. Provided value: ${resource}`);
        content += `
- ${resource}`;
      }
      suffix += content;
    }
    return `${prefix}
${suffix}`;
  }

  // ../../node_modules/@supabase/auth-js/dist/module/lib/webauthn.errors.js
  var WebAuthnError = class extends Error {
    constructor({ message, code, cause, name }) {
      var _a;
      super(message, { cause });
      this.__isWebAuthnError = true;
      this.name = (_a = name !== null && name !== void 0 ? name : cause instanceof Error ? cause.name : void 0) !== null && _a !== void 0 ? _a : "Unknown Error";
      this.code = code;
    }
  };
  var WebAuthnUnknownError = class extends WebAuthnError {
    constructor(message, originalError) {
      super({
        code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
        cause: originalError,
        message
      });
      this.name = "WebAuthnUnknownError";
      this.originalError = originalError;
    }
  };
  function identifyRegistrationError({ error, options }) {
    var _a, _b, _c;
    const { publicKey } = options;
    if (!publicKey) {
      throw Error("options was missing required publicKey property");
    }
    if (error.name === "AbortError") {
      if (options.signal instanceof AbortSignal) {
        return new WebAuthnError({
          message: "Registration ceremony was sent an abort signal",
          code: "ERROR_CEREMONY_ABORTED",
          cause: error
        });
      }
    } else if (error.name === "ConstraintError") {
      if (((_a = publicKey.authenticatorSelection) === null || _a === void 0 ? void 0 : _a.requireResidentKey) === true) {
        return new WebAuthnError({
          message: "Discoverable credentials were required but no available authenticator supported it",
          code: "ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT",
          cause: error
        });
      } else if (
        // @ts-ignore: `mediation` doesn't yet exist on CredentialCreationOptions but it's possible as of Sept 2024
        options.mediation === "conditional" && ((_b = publicKey.authenticatorSelection) === null || _b === void 0 ? void 0 : _b.userVerification) === "required"
      ) {
        return new WebAuthnError({
          message: "User verification was required during automatic registration but it could not be performed",
          code: "ERROR_AUTO_REGISTER_USER_VERIFICATION_FAILURE",
          cause: error
        });
      } else if (((_c = publicKey.authenticatorSelection) === null || _c === void 0 ? void 0 : _c.userVerification) === "required") {
        return new WebAuthnError({
          message: "User verification was required but no available authenticator supported it",
          code: "ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT",
          cause: error
        });
      }
    } else if (error.name === "InvalidStateError") {
      return new WebAuthnError({
        message: "The authenticator was previously registered",
        code: "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED",
        cause: error
      });
    } else if (error.name === "NotAllowedError") {
      return new WebAuthnError({
        message: error.message,
        code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
        cause: error
      });
    } else if (error.name === "NotSupportedError") {
      const validPubKeyCredParams = publicKey.pubKeyCredParams.filter((param) => param.type === "public-key");
      if (validPubKeyCredParams.length === 0) {
        return new WebAuthnError({
          message: 'No entry in pubKeyCredParams was of type "public-key"',
          code: "ERROR_MALFORMED_PUBKEYCREDPARAMS",
          cause: error
        });
      }
      return new WebAuthnError({
        message: "No available authenticator supported any of the specified pubKeyCredParams algorithms",
        code: "ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG",
        cause: error
      });
    } else if (error.name === "SecurityError") {
      const effectiveDomain = window.location.hostname;
      if (!isValidDomain(effectiveDomain)) {
        return new WebAuthnError({
          message: `${window.location.hostname} is an invalid domain`,
          code: "ERROR_INVALID_DOMAIN",
          cause: error
        });
      } else if (publicKey.rp.id !== effectiveDomain) {
        return new WebAuthnError({
          message: `The RP ID "${publicKey.rp.id}" is invalid for this domain`,
          code: "ERROR_INVALID_RP_ID",
          cause: error
        });
      }
    } else if (error.name === "TypeError") {
      if (publicKey.user.id.byteLength < 1 || publicKey.user.id.byteLength > 64) {
        return new WebAuthnError({
          message: "User ID was not between 1 and 64 characters",
          code: "ERROR_INVALID_USER_ID_LENGTH",
          cause: error
        });
      }
    } else if (error.name === "UnknownError") {
      return new WebAuthnError({
        message: "The authenticator was unable to process the specified options, or could not create a new credential",
        code: "ERROR_AUTHENTICATOR_GENERAL_ERROR",
        cause: error
      });
    }
    return new WebAuthnError({
      message: "a Non-Webauthn related error has occurred",
      code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
      cause: error
    });
  }
  function identifyAuthenticationError({ error, options }) {
    const { publicKey } = options;
    if (!publicKey) {
      throw Error("options was missing required publicKey property");
    }
    if (error.name === "AbortError") {
      if (options.signal instanceof AbortSignal) {
        return new WebAuthnError({
          message: "Authentication ceremony was sent an abort signal",
          code: "ERROR_CEREMONY_ABORTED",
          cause: error
        });
      }
    } else if (error.name === "NotAllowedError") {
      return new WebAuthnError({
        message: error.message,
        code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
        cause: error
      });
    } else if (error.name === "SecurityError") {
      const effectiveDomain = window.location.hostname;
      if (!isValidDomain(effectiveDomain)) {
        return new WebAuthnError({
          message: `${window.location.hostname} is an invalid domain`,
          code: "ERROR_INVALID_DOMAIN",
          cause: error
        });
      } else if (publicKey.rpId !== effectiveDomain) {
        return new WebAuthnError({
          message: `The RP ID "${publicKey.rpId}" is invalid for this domain`,
          code: "ERROR_INVALID_RP_ID",
          cause: error
        });
      }
    } else if (error.name === "UnknownError") {
      return new WebAuthnError({
        message: "The authenticator was unable to process the specified options, or could not create a new assertion signature",
        code: "ERROR_AUTHENTICATOR_GENERAL_ERROR",
        cause: error
      });
    }
    return new WebAuthnError({
      message: "a Non-Webauthn related error has occurred",
      code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
      cause: error
    });
  }

  // ../../node_modules/@supabase/auth-js/dist/module/lib/webauthn.js
  var WebAuthnAbortService = class {
    /**
     * Create an abort signal for a new WebAuthn operation.
     * Automatically cancels any existing operation.
     *
     * @returns {AbortSignal} Signal to pass to navigator.credentials.create() or .get()
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal MDN - AbortSignal}
     */
    createNewAbortSignal() {
      if (this.controller) {
        const abortError = new Error("Cancelling existing WebAuthn API call for new one");
        abortError.name = "AbortError";
        this.controller.abort(abortError);
      }
      const newController = new AbortController();
      this.controller = newController;
      return newController.signal;
    }
    /**
     * Manually cancel the current WebAuthn operation.
     * Useful for cleaning up when user cancels or navigates away.
     *
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort MDN - AbortController.abort}
     */
    cancelCeremony() {
      if (this.controller) {
        const abortError = new Error("Manually cancelling existing WebAuthn API call");
        abortError.name = "AbortError";
        this.controller.abort(abortError);
        this.controller = void 0;
      }
    }
  };
  var webAuthnAbortService = new WebAuthnAbortService();
  function deserializeCredentialCreationOptions(options) {
    if (!options) {
      throw new Error("Credential creation options are required");
    }
    if (typeof PublicKeyCredential !== "undefined" && "parseCreationOptionsFromJSON" in PublicKeyCredential && typeof PublicKeyCredential.parseCreationOptionsFromJSON === "function") {
      return PublicKeyCredential.parseCreationOptionsFromJSON(
        /** we assert the options here as typescript still doesn't know about future webauthn types */
        options
      );
    }
    const { challenge: challengeStr, user: userOpts, excludeCredentials } = options, restOptions = __rest(
      options,
      ["challenge", "user", "excludeCredentials"]
    );
    const challenge = base64UrlToUint8Array(challengeStr).buffer;
    const user = Object.assign(Object.assign({}, userOpts), { id: base64UrlToUint8Array(userOpts.id).buffer });
    const result2 = Object.assign(Object.assign({}, restOptions), {
      challenge,
      user
    });
    if (excludeCredentials && excludeCredentials.length > 0) {
      result2.excludeCredentials = new Array(excludeCredentials.length);
      for (let i = 0; i < excludeCredentials.length; i++) {
        const cred = excludeCredentials[i];
        result2.excludeCredentials[i] = Object.assign(Object.assign({}, cred), {
          id: base64UrlToUint8Array(cred.id).buffer,
          type: cred.type || "public-key",
          // Cast transports to handle future transport types like "cable"
          transports: cred.transports
        });
      }
    }
    return result2;
  }
  function deserializeCredentialRequestOptions(options) {
    if (!options) {
      throw new Error("Credential request options are required");
    }
    if (typeof PublicKeyCredential !== "undefined" && "parseRequestOptionsFromJSON" in PublicKeyCredential && typeof PublicKeyCredential.parseRequestOptionsFromJSON === "function") {
      return PublicKeyCredential.parseRequestOptionsFromJSON(options);
    }
    const { challenge: challengeStr, allowCredentials } = options, restOptions = __rest(
      options,
      ["challenge", "allowCredentials"]
    );
    const challenge = base64UrlToUint8Array(challengeStr).buffer;
    const result2 = Object.assign(Object.assign({}, restOptions), { challenge });
    if (allowCredentials && allowCredentials.length > 0) {
      result2.allowCredentials = new Array(allowCredentials.length);
      for (let i = 0; i < allowCredentials.length; i++) {
        const cred = allowCredentials[i];
        result2.allowCredentials[i] = Object.assign(Object.assign({}, cred), {
          id: base64UrlToUint8Array(cred.id).buffer,
          type: cred.type || "public-key",
          // Cast transports to handle future transport types like "cable"
          transports: cred.transports
        });
      }
    }
    return result2;
  }
  function serializeCredentialCreationResponse(credential) {
    var _a;
    if ("toJSON" in credential && typeof credential.toJSON === "function") {
      return credential.toJSON();
    }
    const credentialWithAttachment = credential;
    return {
      id: credential.id,
      rawId: credential.id,
      response: {
        attestationObject: bytesToBase64URL(new Uint8Array(credential.response.attestationObject)),
        clientDataJSON: bytesToBase64URL(new Uint8Array(credential.response.clientDataJSON))
      },
      type: "public-key",
      clientExtensionResults: credential.getClientExtensionResults(),
      // Convert null to undefined and cast to AuthenticatorAttachment type
      authenticatorAttachment: (_a = credentialWithAttachment.authenticatorAttachment) !== null && _a !== void 0 ? _a : void 0
    };
  }
  function serializeCredentialRequestResponse(credential) {
    var _a;
    if ("toJSON" in credential && typeof credential.toJSON === "function") {
      return credential.toJSON();
    }
    const credentialWithAttachment = credential;
    const clientExtensionResults = credential.getClientExtensionResults();
    const assertionResponse = credential.response;
    return {
      id: credential.id,
      rawId: credential.id,
      // W3C spec expects rawId to match id for JSON format
      response: {
        authenticatorData: bytesToBase64URL(new Uint8Array(assertionResponse.authenticatorData)),
        clientDataJSON: bytesToBase64URL(new Uint8Array(assertionResponse.clientDataJSON)),
        signature: bytesToBase64URL(new Uint8Array(assertionResponse.signature)),
        userHandle: assertionResponse.userHandle ? bytesToBase64URL(new Uint8Array(assertionResponse.userHandle)) : void 0
      },
      type: "public-key",
      clientExtensionResults,
      // Convert null to undefined and cast to AuthenticatorAttachment type
      authenticatorAttachment: (_a = credentialWithAttachment.authenticatorAttachment) !== null && _a !== void 0 ? _a : void 0
    };
  }
  function isValidDomain(hostname) {
    return (
      // Consider localhost valid as well since it's okay wrt Secure Contexts
      hostname === "localhost" || /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(hostname)
    );
  }
  function browserSupportsWebAuthn() {
    var _a, _b;
    return !!(isBrowser() && "PublicKeyCredential" in window && window.PublicKeyCredential && "credentials" in navigator && typeof ((_a = navigator === null || navigator === void 0 ? void 0 : navigator.credentials) === null || _a === void 0 ? void 0 : _a.create) === "function" && typeof ((_b = navigator === null || navigator === void 0 ? void 0 : navigator.credentials) === null || _b === void 0 ? void 0 : _b.get) === "function");
  }
  async function createCredential(options) {
    try {
      const response = await navigator.credentials.create(
        /** we assert the type here until typescript types are updated */
        options
      );
      if (!response) {
        return {
          data: null,
          error: new WebAuthnUnknownError("Empty credential response", response)
        };
      }
      if (!(response instanceof PublicKeyCredential)) {
        return {
          data: null,
          error: new WebAuthnUnknownError("Browser returned unexpected credential type", response)
        };
      }
      return { data: response, error: null };
    } catch (err) {
      return {
        data: null,
        error: identifyRegistrationError({
          error: err,
          options
        })
      };
    }
  }
  async function getCredential(options) {
    try {
      const response = await navigator.credentials.get(
        /** we assert the type here until typescript types are updated */
        options
      );
      if (!response) {
        return {
          data: null,
          error: new WebAuthnUnknownError("Empty credential response", response)
        };
      }
      if (!(response instanceof PublicKeyCredential)) {
        return {
          data: null,
          error: new WebAuthnUnknownError("Browser returned unexpected credential type", response)
        };
      }
      return { data: response, error: null };
    } catch (err) {
      return {
        data: null,
        error: identifyAuthenticationError({
          error: err,
          options
        })
      };
    }
  }
  var DEFAULT_CREATION_OPTIONS = {
    hints: ["security-key"],
    authenticatorSelection: {
      authenticatorAttachment: "cross-platform",
      requireResidentKey: false,
      /** set to preferred because older yubikeys don't have PIN/Biometric */
      userVerification: "preferred",
      residentKey: "discouraged"
    },
    attestation: "direct"
  };
  var DEFAULT_REQUEST_OPTIONS = {
    /** set to preferred because older yubikeys don't have PIN/Biometric */
    userVerification: "preferred",
    hints: ["security-key"],
    attestation: "direct"
  };
  function deepMerge(...sources) {
    const isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);
    const isArrayBufferLike = (val) => val instanceof ArrayBuffer || ArrayBuffer.isView(val);
    const result2 = {};
    for (const source of sources) {
      if (!source)
        continue;
      for (const key in source) {
        const value = source[key];
        if (value === void 0)
          continue;
        if (Array.isArray(value)) {
          result2[key] = value;
        } else if (isArrayBufferLike(value)) {
          result2[key] = value;
        } else if (isObject(value)) {
          const existing = result2[key];
          if (isObject(existing)) {
            result2[key] = deepMerge(existing, value);
          } else {
            result2[key] = deepMerge(value);
          }
        } else {
          result2[key] = value;
        }
      }
    }
    return result2;
  }
  function mergeCredentialCreationOptions(baseOptions, overrides) {
    return deepMerge(DEFAULT_CREATION_OPTIONS, baseOptions, overrides || {});
  }
  function mergeCredentialRequestOptions(baseOptions, overrides) {
    return deepMerge(DEFAULT_REQUEST_OPTIONS, baseOptions, overrides || {});
  }
  var WebAuthnApi = class {
    constructor(client) {
      this.client = client;
      this.enroll = this._enroll.bind(this);
      this.challenge = this._challenge.bind(this);
      this.verify = this._verify.bind(this);
      this.authenticate = this._authenticate.bind(this);
      this.register = this._register.bind(this);
    }
    /**
     * Enroll a new WebAuthn factor.
     * Creates an unverified WebAuthn factor that must be verified with a credential.
     *
     * @experimental This method is experimental and may change in future releases
     * @param {Omit<MFAEnrollWebauthnParams, 'factorType'>} params - Enrollment parameters (friendlyName required)
     * @returns {Promise<AuthMFAEnrollWebauthnResponse>} Enrolled factor details or error
     * @see {@link https://w3c.github.io/webauthn/#sctn-registering-a-new-credential W3C WebAuthn Spec - Registering a New Credential}
     */
    async _enroll(params) {
      return this.client.mfa.enroll(Object.assign(Object.assign({}, params), { factorType: "webauthn" }));
    }
    /**
     * Challenge for WebAuthn credential creation or authentication.
     * Combines server challenge with browser credential operations.
     * Handles both registration (create) and authentication (request) flows.
     *
     * @experimental This method is experimental and may change in future releases
     * @param {MFAChallengeWebauthnParams & { friendlyName?: string; signal?: AbortSignal }} params - Challenge parameters including factorId
     * @param {Object} overrides - Allows you to override the parameters passed to navigator.credentials
     * @param {PublicKeyCredentialCreationOptionsFuture} overrides.create - Override options for credential creation
     * @param {PublicKeyCredentialRequestOptionsFuture} overrides.request - Override options for credential request
     * @returns {Promise<RequestResult>} Challenge response with credential or error
     * @see {@link https://w3c.github.io/webauthn/#sctn-credential-creation W3C WebAuthn Spec - Credential Creation}
     * @see {@link https://w3c.github.io/webauthn/#sctn-verifying-assertion W3C WebAuthn Spec - Verifying Assertion}
     */
    async _challenge({ factorId, webauthn, friendlyName, signal }, overrides) {
      var _a;
      try {
        const { data: challengeResponse, error: challengeError } = await this.client.mfa.challenge({
          factorId,
          webauthn
        });
        if (!challengeResponse) {
          return { data: null, error: challengeError };
        }
        const abortSignal = signal !== null && signal !== void 0 ? signal : webAuthnAbortService.createNewAbortSignal();
        if (challengeResponse.webauthn.type === "create") {
          const { user } = challengeResponse.webauthn.credential_options.publicKey;
          if (!user.name) {
            const nameToUse = friendlyName;
            if (!nameToUse) {
              const currentUser = await this.client.getUser();
              const userData = currentUser.data.user;
              const fallbackName = ((_a = userData === null || userData === void 0 ? void 0 : userData.user_metadata) === null || _a === void 0 ? void 0 : _a.name) || (userData === null || userData === void 0 ? void 0 : userData.email) || (userData === null || userData === void 0 ? void 0 : userData.id) || "User";
              user.name = `${user.id}:${fallbackName}`;
            } else {
              user.name = `${user.id}:${nameToUse}`;
            }
          }
          if (!user.displayName) {
            user.displayName = user.name;
          }
        }
        switch (challengeResponse.webauthn.type) {
          case "create": {
            const options = mergeCredentialCreationOptions(challengeResponse.webauthn.credential_options.publicKey, overrides === null || overrides === void 0 ? void 0 : overrides.create);
            const { data, error } = await createCredential({
              publicKey: options,
              signal: abortSignal
            });
            if (data) {
              return {
                data: {
                  factorId,
                  challengeId: challengeResponse.id,
                  webauthn: {
                    type: challengeResponse.webauthn.type,
                    credential_response: data
                  }
                },
                error: null
              };
            }
            return { data: null, error };
          }
          case "request": {
            const options = mergeCredentialRequestOptions(challengeResponse.webauthn.credential_options.publicKey, overrides === null || overrides === void 0 ? void 0 : overrides.request);
            const { data, error } = await getCredential(Object.assign(Object.assign({}, challengeResponse.webauthn.credential_options), { publicKey: options, signal: abortSignal }));
            if (data) {
              return {
                data: {
                  factorId,
                  challengeId: challengeResponse.id,
                  webauthn: {
                    type: challengeResponse.webauthn.type,
                    credential_response: data
                  }
                },
                error: null
              };
            }
            return { data: null, error };
          }
        }
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        return {
          data: null,
          error: new AuthUnknownError("Unexpected error in challenge", error)
        };
      }
    }
    /**
     * Verify a WebAuthn credential with the server.
     * Completes the WebAuthn ceremony by sending the credential to the server for verification.
     *
     * @experimental This method is experimental and may change in future releases
     * @param {Object} params - Verification parameters
     * @param {string} params.challengeId - ID of the challenge being verified
     * @param {string} params.factorId - ID of the WebAuthn factor
     * @param {MFAVerifyWebauthnParams<T>['webauthn']} params.webauthn - WebAuthn credential response
     * @returns {Promise<AuthMFAVerifyResponse>} Verification result with session or error
     * @see {@link https://w3c.github.io/webauthn/#sctn-verifying-assertion W3C WebAuthn Spec - Verifying an Authentication Assertion}
     * */
    async _verify({ challengeId, factorId, webauthn }) {
      return this.client.mfa.verify({
        factorId,
        challengeId,
        webauthn
      });
    }
    /**
     * Complete WebAuthn authentication flow.
     * Performs challenge and verification in a single operation for existing credentials.
     *
     * @experimental This method is experimental and may change in future releases
     * @param {Object} params - Authentication parameters
     * @param {string} params.factorId - ID of the WebAuthn factor to authenticate with
     * @param {Object} params.webauthn - WebAuthn configuration
     * @param {string} params.webauthn.rpId - Relying Party ID (defaults to current hostname)
     * @param {string[]} params.webauthn.rpOrigins - Allowed origins (defaults to current origin)
     * @param {AbortSignal} params.webauthn.signal - Optional abort signal
     * @param {PublicKeyCredentialRequestOptionsFuture} overrides - Override options for navigator.credentials.get
     * @returns {Promise<RequestResult<AuthMFAVerifyResponseData, WebAuthnError | AuthError>>} Authentication result
     * @see {@link https://w3c.github.io/webauthn/#sctn-authentication W3C WebAuthn Spec - Authentication Ceremony}
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialRequestOptions MDN - PublicKeyCredentialRequestOptions}
     */
    async _authenticate({ factorId, webauthn: { rpId = typeof window !== "undefined" ? window.location.hostname : void 0, rpOrigins = typeof window !== "undefined" ? [window.location.origin] : void 0, signal } = {} }, overrides) {
      if (!rpId) {
        return {
          data: null,
          error: new AuthError("rpId is required for WebAuthn authentication")
        };
      }
      try {
        if (!browserSupportsWebAuthn()) {
          return {
            data: null,
            error: new AuthUnknownError("Browser does not support WebAuthn", null)
          };
        }
        const { data: challengeResponse, error: challengeError } = await this.challenge({
          factorId,
          webauthn: { rpId, rpOrigins },
          signal
        }, { request: overrides });
        if (!challengeResponse) {
          return { data: null, error: challengeError };
        }
        const { webauthn } = challengeResponse;
        return this._verify({
          factorId,
          challengeId: challengeResponse.challengeId,
          webauthn: {
            type: webauthn.type,
            rpId,
            rpOrigins,
            credential_response: webauthn.credential_response
          }
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        return {
          data: null,
          error: new AuthUnknownError("Unexpected error in authenticate", error)
        };
      }
    }
    /**
     * Complete WebAuthn registration flow.
     * Performs enrollment, challenge, and verification in a single operation for new credentials.
     *
     * @experimental This method is experimental and may change in future releases
     * @param {Object} params - Registration parameters
     * @param {string} params.friendlyName - User-friendly name for the credential
     * @param {string} params.rpId - Relying Party ID (defaults to current hostname)
     * @param {string[]} params.rpOrigins - Allowed origins (defaults to current origin)
     * @param {AbortSignal} params.signal - Optional abort signal
     * @param {PublicKeyCredentialCreationOptionsFuture} overrides - Override options for navigator.credentials.create
     * @returns {Promise<RequestResult<AuthMFAVerifyResponseData, WebAuthnError | AuthError>>} Registration result
     * @see {@link https://w3c.github.io/webauthn/#sctn-registering-a-new-credential W3C WebAuthn Spec - Registration Ceremony}
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions MDN - PublicKeyCredentialCreationOptions}
     */
    async _register({ friendlyName, webauthn: { rpId = typeof window !== "undefined" ? window.location.hostname : void 0, rpOrigins = typeof window !== "undefined" ? [window.location.origin] : void 0, signal } = {} }, overrides) {
      if (!rpId) {
        return {
          data: null,
          error: new AuthError("rpId is required for WebAuthn registration")
        };
      }
      try {
        if (!browserSupportsWebAuthn()) {
          return {
            data: null,
            error: new AuthUnknownError("Browser does not support WebAuthn", null)
          };
        }
        const { data: factor, error: enrollError } = await this._enroll({
          friendlyName
        });
        if (!factor) {
          await this.client.mfa.listFactors().then((factors) => {
            var _a;
            return (_a = factors.data) === null || _a === void 0 ? void 0 : _a.all.find((v) => v.factor_type === "webauthn" && v.friendly_name === friendlyName && v.status !== "unverified");
          }).then((factor2) => factor2 ? this.client.mfa.unenroll({ factorId: factor2 === null || factor2 === void 0 ? void 0 : factor2.id }) : void 0);
          return { data: null, error: enrollError };
        }
        const { data: challengeResponse, error: challengeError } = await this._challenge({
          factorId: factor.id,
          friendlyName: factor.friendly_name,
          webauthn: { rpId, rpOrigins },
          signal
        }, {
          create: overrides
        });
        if (!challengeResponse) {
          return { data: null, error: challengeError };
        }
        return this._verify({
          factorId: factor.id,
          challengeId: challengeResponse.challengeId,
          webauthn: {
            rpId,
            rpOrigins,
            type: challengeResponse.webauthn.type,
            credential_response: challengeResponse.webauthn.credential_response
          }
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        return {
          data: null,
          error: new AuthUnknownError("Unexpected error in register", error)
        };
      }
    }
  };

  // ../../node_modules/@supabase/auth-js/dist/module/GoTrueClient.js
  polyfillGlobalThis();
  var DEFAULT_OPTIONS = {
    url: GOTRUE_URL,
    storageKey: STORAGE_KEY,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    headers: DEFAULT_HEADERS2,
    flowType: "implicit",
    debug: false,
    hasCustomAuthorizationHeader: false,
    throwOnError: false,
    lockAcquireTimeout: 1e4
    // 10 seconds
  };
  async function lockNoOp(name, acquireTimeout, fn) {
    return await fn();
  }
  var GLOBAL_JWKS = {};
  var GoTrueClient = class _GoTrueClient {
    /**
     * The JWKS used for verifying asymmetric JWTs
     */
    get jwks() {
      var _a, _b;
      return (_b = (_a = GLOBAL_JWKS[this.storageKey]) === null || _a === void 0 ? void 0 : _a.jwks) !== null && _b !== void 0 ? _b : { keys: [] };
    }
    set jwks(value) {
      GLOBAL_JWKS[this.storageKey] = Object.assign(Object.assign({}, GLOBAL_JWKS[this.storageKey]), { jwks: value });
    }
    get jwks_cached_at() {
      var _a, _b;
      return (_b = (_a = GLOBAL_JWKS[this.storageKey]) === null || _a === void 0 ? void 0 : _a.cachedAt) !== null && _b !== void 0 ? _b : Number.MIN_SAFE_INTEGER;
    }
    set jwks_cached_at(value) {
      GLOBAL_JWKS[this.storageKey] = Object.assign(Object.assign({}, GLOBAL_JWKS[this.storageKey]), { cachedAt: value });
    }
    /**
     * Create a new client for use in the browser.
     *
     * @example
     * ```ts
     * import { GoTrueClient } from '@supabase/auth-js'
     *
     * const auth = new GoTrueClient({
     *   url: 'https://xyzcompany.supabase.co/auth/v1',
     *   headers: { apikey: 'public-anon-key' },
     *   storageKey: 'supabase-auth',
     * })
     * ```
     */
    constructor(options) {
      var _a, _b, _c;
      this.userStorage = null;
      this.memoryStorage = null;
      this.stateChangeEmitters = /* @__PURE__ */ new Map();
      this.autoRefreshTicker = null;
      this.autoRefreshTickTimeout = null;
      this.visibilityChangedCallback = null;
      this.refreshingDeferred = null;
      this.initializePromise = null;
      this.detectSessionInUrl = true;
      this.hasCustomAuthorizationHeader = false;
      this.suppressGetSessionWarning = false;
      this.lockAcquired = false;
      this.pendingInLock = [];
      this.broadcastChannel = null;
      this.logger = console.log;
      const settings = Object.assign(Object.assign({}, DEFAULT_OPTIONS), options);
      this.storageKey = settings.storageKey;
      this.instanceID = (_a = _GoTrueClient.nextInstanceID[this.storageKey]) !== null && _a !== void 0 ? _a : 0;
      _GoTrueClient.nextInstanceID[this.storageKey] = this.instanceID + 1;
      this.logDebugMessages = !!settings.debug;
      if (typeof settings.debug === "function") {
        this.logger = settings.debug;
      }
      if (this.instanceID > 0 && isBrowser()) {
        const message = `${this._logPrefix()} Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.`;
        console.warn(message);
        if (this.logDebugMessages) {
          console.trace(message);
        }
      }
      this.persistSession = settings.persistSession;
      this.autoRefreshToken = settings.autoRefreshToken;
      this.admin = new GoTrueAdminApi({
        url: settings.url,
        headers: settings.headers,
        fetch: settings.fetch
      });
      this.url = settings.url;
      this.headers = settings.headers;
      this.fetch = resolveFetch3(settings.fetch);
      this.lock = settings.lock || lockNoOp;
      this.detectSessionInUrl = settings.detectSessionInUrl;
      this.flowType = settings.flowType;
      this.hasCustomAuthorizationHeader = settings.hasCustomAuthorizationHeader;
      this.throwOnError = settings.throwOnError;
      this.lockAcquireTimeout = settings.lockAcquireTimeout;
      if (settings.lock) {
        this.lock = settings.lock;
      } else if (this.persistSession && isBrowser() && ((_b = globalThis === null || globalThis === void 0 ? void 0 : globalThis.navigator) === null || _b === void 0 ? void 0 : _b.locks)) {
        this.lock = navigatorLock;
      } else {
        this.lock = lockNoOp;
      }
      if (!this.jwks) {
        this.jwks = { keys: [] };
        this.jwks_cached_at = Number.MIN_SAFE_INTEGER;
      }
      this.mfa = {
        verify: this._verify.bind(this),
        enroll: this._enroll.bind(this),
        unenroll: this._unenroll.bind(this),
        challenge: this._challenge.bind(this),
        listFactors: this._listFactors.bind(this),
        challengeAndVerify: this._challengeAndVerify.bind(this),
        getAuthenticatorAssuranceLevel: this._getAuthenticatorAssuranceLevel.bind(this),
        webauthn: new WebAuthnApi(this)
      };
      this.oauth = {
        getAuthorizationDetails: this._getAuthorizationDetails.bind(this),
        approveAuthorization: this._approveAuthorization.bind(this),
        denyAuthorization: this._denyAuthorization.bind(this),
        listGrants: this._listOAuthGrants.bind(this),
        revokeGrant: this._revokeOAuthGrant.bind(this)
      };
      if (this.persistSession) {
        if (settings.storage) {
          this.storage = settings.storage;
        } else {
          if (supportsLocalStorage()) {
            this.storage = globalThis.localStorage;
          } else {
            this.memoryStorage = {};
            this.storage = memoryLocalStorageAdapter(this.memoryStorage);
          }
        }
        if (settings.userStorage) {
          this.userStorage = settings.userStorage;
        }
      } else {
        this.memoryStorage = {};
        this.storage = memoryLocalStorageAdapter(this.memoryStorage);
      }
      if (isBrowser() && globalThis.BroadcastChannel && this.persistSession && this.storageKey) {
        try {
          this.broadcastChannel = new globalThis.BroadcastChannel(this.storageKey);
        } catch (e) {
          console.error("Failed to create a new BroadcastChannel, multi-tab state changes will not be available", e);
        }
        (_c = this.broadcastChannel) === null || _c === void 0 ? void 0 : _c.addEventListener("message", async (event) => {
          this._debug("received broadcast notification from other tab or client", event);
          try {
            await this._notifyAllSubscribers(event.data.event, event.data.session, false);
          } catch (error) {
            this._debug("#broadcastChannel", "error", error);
          }
        });
      }
      this.initialize().catch((error) => {
        this._debug("#initialize()", "error", error);
      });
    }
    /**
     * Returns whether error throwing mode is enabled for this client.
     */
    isThrowOnErrorEnabled() {
      return this.throwOnError;
    }
    /**
     * Centralizes return handling with optional error throwing. When `throwOnError` is enabled
     * and the provided result contains a non-nullish error, the error is thrown instead of
     * being returned. This ensures consistent behavior across all public API methods.
     */
    _returnResult(result2) {
      if (this.throwOnError && result2 && result2.error) {
        throw result2.error;
      }
      return result2;
    }
    _logPrefix() {
      return `GoTrueClient@${this.storageKey}:${this.instanceID} (${version3}) ${(/* @__PURE__ */ new Date()).toISOString()}`;
    }
    _debug(...args) {
      if (this.logDebugMessages) {
        this.logger(this._logPrefix(), ...args);
      }
      return this;
    }
    /**
     * Initializes the client session either from the url or from storage.
     * This method is automatically called when instantiating the client, but should also be called
     * manually when checking for an error from an auth redirect (oauth, magiclink, password recovery, etc).
     */
    async initialize() {
      if (this.initializePromise) {
        return await this.initializePromise;
      }
      this.initializePromise = (async () => {
        return await this._acquireLock(this.lockAcquireTimeout, async () => {
          return await this._initialize();
        });
      })();
      return await this.initializePromise;
    }
    /**
     * IMPORTANT:
     * 1. Never throw in this method, as it is called from the constructor
     * 2. Never return a session from this method as it would be cached over
     *    the whole lifetime of the client
     */
    async _initialize() {
      var _a;
      try {
        let params = {};
        let callbackUrlType = "none";
        if (isBrowser()) {
          params = parseParametersFromURL(window.location.href);
          if (this._isImplicitGrantCallback(params)) {
            callbackUrlType = "implicit";
          } else if (await this._isPKCECallback(params)) {
            callbackUrlType = "pkce";
          }
        }
        if (isBrowser() && this.detectSessionInUrl && callbackUrlType !== "none") {
          const { data, error } = await this._getSessionFromURL(params, callbackUrlType);
          if (error) {
            this._debug("#_initialize()", "error detecting session from URL", error);
            if (isAuthImplicitGrantRedirectError(error)) {
              const errorCode = (_a = error.details) === null || _a === void 0 ? void 0 : _a.code;
              if (errorCode === "identity_already_exists" || errorCode === "identity_not_found" || errorCode === "single_identity_not_deletable") {
                return { error };
              }
            }
            return { error };
          }
          const { session, redirectType } = data;
          this._debug("#_initialize()", "detected session in URL", session, "redirect type", redirectType);
          await this._saveSession(session);
          setTimeout(async () => {
            if (redirectType === "recovery") {
              await this._notifyAllSubscribers("PASSWORD_RECOVERY", session);
            } else {
              await this._notifyAllSubscribers("SIGNED_IN", session);
            }
          }, 0);
          return { error: null };
        }
        await this._recoverAndRefresh();
        return { error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ error });
        }
        return this._returnResult({
          error: new AuthUnknownError("Unexpected error during initialization", error)
        });
      } finally {
        await this._handleVisibilityChange();
        this._debug("#_initialize()", "end");
      }
    }
    /**
     * Creates a new anonymous user.
     *
     * @returns A session where the is_anonymous claim in the access token JWT set to true
     */
    async signInAnonymously(credentials) {
      var _a, _b, _c;
      try {
        const res = await _request(this.fetch, "POST", `${this.url}/signup`, {
          headers: this.headers,
          body: {
            data: (_b = (_a = credentials === null || credentials === void 0 ? void 0 : credentials.options) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {},
            gotrue_meta_security: { captcha_token: (_c = credentials === null || credentials === void 0 ? void 0 : credentials.options) === null || _c === void 0 ? void 0 : _c.captchaToken }
          },
          xform: _sessionResponse
        });
        const { data, error } = res;
        if (error || !data) {
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        const session = data.session;
        const user = data.user;
        if (data.session) {
          await this._saveSession(data.session);
          await this._notifyAllSubscribers("SIGNED_IN", session);
        }
        return this._returnResult({ data: { user, session }, error: null });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        throw error;
      }
    }
    /**
     * Creates a new user.
     *
     * Be aware that if a user account exists in the system you may get back an
     * error message that attempts to hide this information from the user.
     * This method has support for PKCE via email signups. The PKCE flow cannot be used when autoconfirm is enabled.
     *
     * @returns A logged-in session if the server has "autoconfirm" ON
     * @returns A user if the server has "autoconfirm" OFF
     */
    async signUp(credentials) {
      var _a, _b, _c;
      try {
        let res;
        if ("email" in credentials) {
          const { email, password, options } = credentials;
          let codeChallenge = null;
          let codeChallengeMethod = null;
          if (this.flowType === "pkce") {
            ;
            [codeChallenge, codeChallengeMethod] = await getCodeChallengeAndMethod(this.storage, this.storageKey);
          }
          res = await _request(this.fetch, "POST", `${this.url}/signup`, {
            headers: this.headers,
            redirectTo: options === null || options === void 0 ? void 0 : options.emailRedirectTo,
            body: {
              email,
              password,
              data: (_a = options === null || options === void 0 ? void 0 : options.data) !== null && _a !== void 0 ? _a : {},
              gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken },
              code_challenge: codeChallenge,
              code_challenge_method: codeChallengeMethod
            },
            xform: _sessionResponse
          });
        } else if ("phone" in credentials) {
          const { phone, password, options } = credentials;
          res = await _request(this.fetch, "POST", `${this.url}/signup`, {
            headers: this.headers,
            body: {
              phone,
              password,
              data: (_b = options === null || options === void 0 ? void 0 : options.data) !== null && _b !== void 0 ? _b : {},
              channel: (_c = options === null || options === void 0 ? void 0 : options.channel) !== null && _c !== void 0 ? _c : "sms",
              gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
            },
            xform: _sessionResponse
          });
        } else {
          throw new AuthInvalidCredentialsError("You must provide either an email or phone number and a password");
        }
        const { data, error } = res;
        if (error || !data) {
          await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        const session = data.session;
        const user = data.user;
        if (data.session) {
          await this._saveSession(data.session);
          await this._notifyAllSubscribers("SIGNED_IN", session);
        }
        return this._returnResult({ data: { user, session }, error: null });
      } catch (error) {
        await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
        if (isAuthError(error)) {
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        throw error;
      }
    }
    /**
     * Log in an existing user with an email and password or phone and password.
     *
     * Be aware that you may get back an error message that will not distinguish
     * between the cases where the account does not exist or that the
     * email/phone and password combination is wrong or that the account can only
     * be accessed via social login.
     */
    async signInWithPassword(credentials) {
      try {
        let res;
        if ("email" in credentials) {
          const { email, password, options } = credentials;
          res = await _request(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
            headers: this.headers,
            body: {
              email,
              password,
              gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
            },
            xform: _sessionResponsePassword
          });
        } else if ("phone" in credentials) {
          const { phone, password, options } = credentials;
          res = await _request(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
            headers: this.headers,
            body: {
              phone,
              password,
              gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
            },
            xform: _sessionResponsePassword
          });
        } else {
          throw new AuthInvalidCredentialsError("You must provide either an email or phone number and a password");
        }
        const { data, error } = res;
        if (error) {
          return this._returnResult({ data: { user: null, session: null }, error });
        } else if (!data || !data.session || !data.user) {
          const invalidTokenError = new AuthInvalidTokenResponseError();
          return this._returnResult({ data: { user: null, session: null }, error: invalidTokenError });
        }
        if (data.session) {
          await this._saveSession(data.session);
          await this._notifyAllSubscribers("SIGNED_IN", data.session);
        }
        return this._returnResult({
          data: Object.assign({ user: data.user, session: data.session }, data.weak_password ? { weakPassword: data.weak_password } : null),
          error
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        throw error;
      }
    }
    /**
     * Log in an existing user via a third-party provider.
     * This method supports the PKCE flow.
     */
    async signInWithOAuth(credentials) {
      var _a, _b, _c, _d;
      return await this._handleProviderSignIn(credentials.provider, {
        redirectTo: (_a = credentials.options) === null || _a === void 0 ? void 0 : _a.redirectTo,
        scopes: (_b = credentials.options) === null || _b === void 0 ? void 0 : _b.scopes,
        queryParams: (_c = credentials.options) === null || _c === void 0 ? void 0 : _c.queryParams,
        skipBrowserRedirect: (_d = credentials.options) === null || _d === void 0 ? void 0 : _d.skipBrowserRedirect
      });
    }
    /**
     * Log in an existing user by exchanging an Auth Code issued during the PKCE flow.
     */
    async exchangeCodeForSession(authCode) {
      await this.initializePromise;
      return this._acquireLock(this.lockAcquireTimeout, async () => {
        return this._exchangeCodeForSession(authCode);
      });
    }
    /**
     * Signs in a user by verifying a message signed by the user's private key.
     * Supports Ethereum (via Sign-In-With-Ethereum) & Solana (Sign-In-With-Solana) standards,
     * both of which derive from the EIP-4361 standard
     * With slight variation on Solana's side.
     * @reference https://eips.ethereum.org/EIPS/eip-4361
     */
    async signInWithWeb3(credentials) {
      const { chain } = credentials;
      switch (chain) {
        case "ethereum":
          return await this.signInWithEthereum(credentials);
        case "solana":
          return await this.signInWithSolana(credentials);
        default:
          throw new Error(`@supabase/auth-js: Unsupported chain "${chain}"`);
      }
    }
    async signInWithEthereum(credentials) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
      let message;
      let signature;
      if ("message" in credentials) {
        message = credentials.message;
        signature = credentials.signature;
      } else {
        const { chain, wallet, statement, options } = credentials;
        let resolvedWallet;
        if (!isBrowser()) {
          if (typeof wallet !== "object" || !(options === null || options === void 0 ? void 0 : options.url)) {
            throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
          }
          resolvedWallet = wallet;
        } else if (typeof wallet === "object") {
          resolvedWallet = wallet;
        } else {
          const windowAny = window;
          if ("ethereum" in windowAny && typeof windowAny.ethereum === "object" && "request" in windowAny.ethereum && typeof windowAny.ethereum.request === "function") {
            resolvedWallet = windowAny.ethereum;
          } else {
            throw new Error(`@supabase/auth-js: No compatible Ethereum wallet interface on the window object (window.ethereum) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'ethereum', wallet: resolvedUserWallet }) instead.`);
          }
        }
        const url = new URL((_a = options === null || options === void 0 ? void 0 : options.url) !== null && _a !== void 0 ? _a : window.location.href);
        const accounts = await resolvedWallet.request({
          method: "eth_requestAccounts"
        }).then((accs) => accs).catch(() => {
          throw new Error(`@supabase/auth-js: Wallet method eth_requestAccounts is missing or invalid`);
        });
        if (!accounts || accounts.length === 0) {
          throw new Error(`@supabase/auth-js: No accounts available. Please ensure the wallet is connected.`);
        }
        const address = getAddress(accounts[0]);
        let chainId = (_b = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _b === void 0 ? void 0 : _b.chainId;
        if (!chainId) {
          const chainIdHex = await resolvedWallet.request({
            method: "eth_chainId"
          });
          chainId = fromHex(chainIdHex);
        }
        const siweMessage = {
          domain: url.host,
          address,
          statement,
          uri: url.href,
          version: "1",
          chainId,
          nonce: (_c = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _c === void 0 ? void 0 : _c.nonce,
          issuedAt: (_e = (_d = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _d === void 0 ? void 0 : _d.issuedAt) !== null && _e !== void 0 ? _e : /* @__PURE__ */ new Date(),
          expirationTime: (_f = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _f === void 0 ? void 0 : _f.expirationTime,
          notBefore: (_g = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _g === void 0 ? void 0 : _g.notBefore,
          requestId: (_h = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _h === void 0 ? void 0 : _h.requestId,
          resources: (_j = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _j === void 0 ? void 0 : _j.resources
        };
        message = createSiweMessage(siweMessage);
        signature = await resolvedWallet.request({
          method: "personal_sign",
          params: [toHex(message), address]
        });
      }
      try {
        const { data, error } = await _request(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
          headers: this.headers,
          body: Object.assign({
            chain: "ethereum",
            message,
            signature
          }, ((_k = credentials.options) === null || _k === void 0 ? void 0 : _k.captchaToken) ? { gotrue_meta_security: { captcha_token: (_l = credentials.options) === null || _l === void 0 ? void 0 : _l.captchaToken } } : null),
          xform: _sessionResponse
        });
        if (error) {
          throw error;
        }
        if (!data || !data.session || !data.user) {
          const invalidTokenError = new AuthInvalidTokenResponseError();
          return this._returnResult({ data: { user: null, session: null }, error: invalidTokenError });
        }
        if (data.session) {
          await this._saveSession(data.session);
          await this._notifyAllSubscribers("SIGNED_IN", data.session);
        }
        return this._returnResult({ data: Object.assign({}, data), error });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        throw error;
      }
    }
    async signInWithSolana(credentials) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
      let message;
      let signature;
      if ("message" in credentials) {
        message = credentials.message;
        signature = credentials.signature;
      } else {
        const { chain, wallet, statement, options } = credentials;
        let resolvedWallet;
        if (!isBrowser()) {
          if (typeof wallet !== "object" || !(options === null || options === void 0 ? void 0 : options.url)) {
            throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
          }
          resolvedWallet = wallet;
        } else if (typeof wallet === "object") {
          resolvedWallet = wallet;
        } else {
          const windowAny = window;
          if ("solana" in windowAny && typeof windowAny.solana === "object" && ("signIn" in windowAny.solana && typeof windowAny.solana.signIn === "function" || "signMessage" in windowAny.solana && typeof windowAny.solana.signMessage === "function")) {
            resolvedWallet = windowAny.solana;
          } else {
            throw new Error(`@supabase/auth-js: No compatible Solana wallet interface on the window object (window.solana) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'solana', wallet: resolvedUserWallet }) instead.`);
          }
        }
        const url = new URL((_a = options === null || options === void 0 ? void 0 : options.url) !== null && _a !== void 0 ? _a : window.location.href);
        if ("signIn" in resolvedWallet && resolvedWallet.signIn) {
          const output = await resolvedWallet.signIn(Object.assign(Object.assign(Object.assign({ issuedAt: (/* @__PURE__ */ new Date()).toISOString() }, options === null || options === void 0 ? void 0 : options.signInWithSolana), {
            // non-overridable properties
            version: "1",
            domain: url.host,
            uri: url.href
          }), statement ? { statement } : null));
          let outputToProcess;
          if (Array.isArray(output) && output[0] && typeof output[0] === "object") {
            outputToProcess = output[0];
          } else if (output && typeof output === "object" && "signedMessage" in output && "signature" in output) {
            outputToProcess = output;
          } else {
            throw new Error("@supabase/auth-js: Wallet method signIn() returned unrecognized value");
          }
          if ("signedMessage" in outputToProcess && "signature" in outputToProcess && (typeof outputToProcess.signedMessage === "string" || outputToProcess.signedMessage instanceof Uint8Array) && outputToProcess.signature instanceof Uint8Array) {
            message = typeof outputToProcess.signedMessage === "string" ? outputToProcess.signedMessage : new TextDecoder().decode(outputToProcess.signedMessage);
            signature = outputToProcess.signature;
          } else {
            throw new Error("@supabase/auth-js: Wallet method signIn() API returned object without signedMessage and signature fields");
          }
        } else {
          if (!("signMessage" in resolvedWallet) || typeof resolvedWallet.signMessage !== "function" || !("publicKey" in resolvedWallet) || typeof resolvedWallet !== "object" || !resolvedWallet.publicKey || !("toBase58" in resolvedWallet.publicKey) || typeof resolvedWallet.publicKey.toBase58 !== "function") {
            throw new Error("@supabase/auth-js: Wallet does not have a compatible signMessage() and publicKey.toBase58() API");
          }
          message = [
            `${url.host} wants you to sign in with your Solana account:`,
            resolvedWallet.publicKey.toBase58(),
            ...statement ? ["", statement, ""] : [""],
            "Version: 1",
            `URI: ${url.href}`,
            `Issued At: ${(_c = (_b = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _b === void 0 ? void 0 : _b.issuedAt) !== null && _c !== void 0 ? _c : (/* @__PURE__ */ new Date()).toISOString()}`,
            ...((_d = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _d === void 0 ? void 0 : _d.notBefore) ? [`Not Before: ${options.signInWithSolana.notBefore}`] : [],
            ...((_e = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _e === void 0 ? void 0 : _e.expirationTime) ? [`Expiration Time: ${options.signInWithSolana.expirationTime}`] : [],
            ...((_f = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _f === void 0 ? void 0 : _f.chainId) ? [`Chain ID: ${options.signInWithSolana.chainId}`] : [],
            ...((_g = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _g === void 0 ? void 0 : _g.nonce) ? [`Nonce: ${options.signInWithSolana.nonce}`] : [],
            ...((_h = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _h === void 0 ? void 0 : _h.requestId) ? [`Request ID: ${options.signInWithSolana.requestId}`] : [],
            ...((_k = (_j = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _j === void 0 ? void 0 : _j.resources) === null || _k === void 0 ? void 0 : _k.length) ? [
              "Resources",
              ...options.signInWithSolana.resources.map((resource) => `- ${resource}`)
            ] : []
          ].join("\n");
          const maybeSignature = await resolvedWallet.signMessage(new TextEncoder().encode(message), "utf8");
          if (!maybeSignature || !(maybeSignature instanceof Uint8Array)) {
            throw new Error("@supabase/auth-js: Wallet signMessage() API returned an recognized value");
          }
          signature = maybeSignature;
        }
      }
      try {
        const { data, error } = await _request(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
          headers: this.headers,
          body: Object.assign({ chain: "solana", message, signature: bytesToBase64URL(signature) }, ((_l = credentials.options) === null || _l === void 0 ? void 0 : _l.captchaToken) ? { gotrue_meta_security: { captcha_token: (_m = credentials.options) === null || _m === void 0 ? void 0 : _m.captchaToken } } : null),
          xform: _sessionResponse
        });
        if (error) {
          throw error;
        }
        if (!data || !data.session || !data.user) {
          const invalidTokenError = new AuthInvalidTokenResponseError();
          return this._returnResult({ data: { user: null, session: null }, error: invalidTokenError });
        }
        if (data.session) {
          await this._saveSession(data.session);
          await this._notifyAllSubscribers("SIGNED_IN", data.session);
        }
        return this._returnResult({ data: Object.assign({}, data), error });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        throw error;
      }
    }
    async _exchangeCodeForSession(authCode) {
      const storageItem = await getItemAsync(this.storage, `${this.storageKey}-code-verifier`);
      const [codeVerifier, redirectType] = (storageItem !== null && storageItem !== void 0 ? storageItem : "").split("/");
      try {
        if (!codeVerifier && this.flowType === "pkce") {
          throw new AuthPKCECodeVerifierMissingError();
        }
        const { data, error } = await _request(this.fetch, "POST", `${this.url}/token?grant_type=pkce`, {
          headers: this.headers,
          body: {
            auth_code: authCode,
            code_verifier: codeVerifier
          },
          xform: _sessionResponse
        });
        await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
        if (error) {
          throw error;
        }
        if (!data || !data.session || !data.user) {
          const invalidTokenError = new AuthInvalidTokenResponseError();
          return this._returnResult({
            data: { user: null, session: null, redirectType: null },
            error: invalidTokenError
          });
        }
        if (data.session) {
          await this._saveSession(data.session);
          await this._notifyAllSubscribers("SIGNED_IN", data.session);
        }
        return this._returnResult({ data: Object.assign(Object.assign({}, data), { redirectType: redirectType !== null && redirectType !== void 0 ? redirectType : null }), error });
      } catch (error) {
        await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
        if (isAuthError(error)) {
          return this._returnResult({
            data: { user: null, session: null, redirectType: null },
            error
          });
        }
        throw error;
      }
    }
    /**
     * Allows signing in with an OIDC ID token. The authentication provider used
     * should be enabled and configured.
     */
    async signInWithIdToken(credentials) {
      try {
        const { options, provider, token, access_token, nonce } = credentials;
        const res = await _request(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, {
          headers: this.headers,
          body: {
            provider,
            id_token: token,
            access_token,
            nonce,
            gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
          },
          xform: _sessionResponse
        });
        const { data, error } = res;
        if (error) {
          return this._returnResult({ data: { user: null, session: null }, error });
        } else if (!data || !data.session || !data.user) {
          const invalidTokenError = new AuthInvalidTokenResponseError();
          return this._returnResult({ data: { user: null, session: null }, error: invalidTokenError });
        }
        if (data.session) {
          await this._saveSession(data.session);
          await this._notifyAllSubscribers("SIGNED_IN", data.session);
        }
        return this._returnResult({ data, error });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        throw error;
      }
    }
    /**
     * Log in a user using magiclink or a one-time password (OTP).
     *
     * If the `{{ .ConfirmationURL }}` variable is specified in the email template, a magiclink will be sent.
     * If the `{{ .Token }}` variable is specified in the email template, an OTP will be sent.
     * If you're using phone sign-ins, only an OTP will be sent. You won't be able to send a magiclink for phone sign-ins.
     *
     * Be aware that you may get back an error message that will not distinguish
     * between the cases where the account does not exist or, that the account
     * can only be accessed via social login.
     *
     * Do note that you will need to configure a Whatsapp sender on Twilio
     * if you are using phone sign in with the 'whatsapp' channel. The whatsapp
     * channel is not supported on other providers
     * at this time.
     * This method supports PKCE when an email is passed.
     */
    async signInWithOtp(credentials) {
      var _a, _b, _c, _d, _e;
      try {
        if ("email" in credentials) {
          const { email, options } = credentials;
          let codeChallenge = null;
          let codeChallengeMethod = null;
          if (this.flowType === "pkce") {
            ;
            [codeChallenge, codeChallengeMethod] = await getCodeChallengeAndMethod(this.storage, this.storageKey);
          }
          const { error } = await _request(this.fetch, "POST", `${this.url}/otp`, {
            headers: this.headers,
            body: {
              email,
              data: (_a = options === null || options === void 0 ? void 0 : options.data) !== null && _a !== void 0 ? _a : {},
              create_user: (_b = options === null || options === void 0 ? void 0 : options.shouldCreateUser) !== null && _b !== void 0 ? _b : true,
              gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken },
              code_challenge: codeChallenge,
              code_challenge_method: codeChallengeMethod
            },
            redirectTo: options === null || options === void 0 ? void 0 : options.emailRedirectTo
          });
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        if ("phone" in credentials) {
          const { phone, options } = credentials;
          const { data, error } = await _request(this.fetch, "POST", `${this.url}/otp`, {
            headers: this.headers,
            body: {
              phone,
              data: (_c = options === null || options === void 0 ? void 0 : options.data) !== null && _c !== void 0 ? _c : {},
              create_user: (_d = options === null || options === void 0 ? void 0 : options.shouldCreateUser) !== null && _d !== void 0 ? _d : true,
              gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken },
              channel: (_e = options === null || options === void 0 ? void 0 : options.channel) !== null && _e !== void 0 ? _e : "sms"
            }
          });
          return this._returnResult({
            data: { user: null, session: null, messageId: data === null || data === void 0 ? void 0 : data.message_id },
            error
          });
        }
        throw new AuthInvalidCredentialsError("You must provide either an email or phone number.");
      } catch (error) {
        await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
        if (isAuthError(error)) {
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        throw error;
      }
    }
    /**
     * Log in a user given a User supplied OTP or TokenHash received through mobile or email.
     */
    async verifyOtp(params) {
      var _a, _b;
      try {
        let redirectTo = void 0;
        let captchaToken = void 0;
        if ("options" in params) {
          redirectTo = (_a = params.options) === null || _a === void 0 ? void 0 : _a.redirectTo;
          captchaToken = (_b = params.options) === null || _b === void 0 ? void 0 : _b.captchaToken;
        }
        const { data, error } = await _request(this.fetch, "POST", `${this.url}/verify`, {
          headers: this.headers,
          body: Object.assign(Object.assign({}, params), { gotrue_meta_security: { captcha_token: captchaToken } }),
          redirectTo,
          xform: _sessionResponse
        });
        if (error) {
          throw error;
        }
        if (!data) {
          const tokenVerificationError = new Error("An error occurred on token verification.");
          throw tokenVerificationError;
        }
        const session = data.session;
        const user = data.user;
        if (session === null || session === void 0 ? void 0 : session.access_token) {
          await this._saveSession(session);
          await this._notifyAllSubscribers(params.type == "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN", session);
        }
        return this._returnResult({ data: { user, session }, error: null });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        throw error;
      }
    }
    /**
     * Attempts a single-sign on using an enterprise Identity Provider. A
     * successful SSO attempt will redirect the current page to the identity
     * provider authorization page. The redirect URL is implementation and SSO
     * protocol specific.
     *
     * You can use it by providing a SSO domain. Typically you can extract this
     * domain by asking users for their email address. If this domain is
     * registered on the Auth instance the redirect will use that organization's
     * currently active SSO Identity Provider for the login.
     *
     * If you have built an organization-specific login page, you can use the
     * organization's SSO Identity Provider UUID directly instead.
     */
    async signInWithSSO(params) {
      var _a, _b, _c, _d, _e;
      try {
        let codeChallenge = null;
        let codeChallengeMethod = null;
        if (this.flowType === "pkce") {
          ;
          [codeChallenge, codeChallengeMethod] = await getCodeChallengeAndMethod(this.storage, this.storageKey);
        }
        const result2 = await _request(this.fetch, "POST", `${this.url}/sso`, {
          body: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, "providerId" in params ? { provider_id: params.providerId } : null), "domain" in params ? { domain: params.domain } : null), { redirect_to: (_b = (_a = params.options) === null || _a === void 0 ? void 0 : _a.redirectTo) !== null && _b !== void 0 ? _b : void 0 }), ((_c = params === null || params === void 0 ? void 0 : params.options) === null || _c === void 0 ? void 0 : _c.captchaToken) ? { gotrue_meta_security: { captcha_token: params.options.captchaToken } } : null), { skip_http_redirect: true, code_challenge: codeChallenge, code_challenge_method: codeChallengeMethod }),
          headers: this.headers,
          xform: _ssoResponse
        });
        if (((_d = result2.data) === null || _d === void 0 ? void 0 : _d.url) && isBrowser() && !((_e = params.options) === null || _e === void 0 ? void 0 : _e.skipBrowserRedirect)) {
          window.location.assign(result2.data.url);
        }
        return this._returnResult(result2);
      } catch (error) {
        await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * Sends a reauthentication OTP to the user's email or phone number.
     * Requires the user to be signed-in.
     */
    async reauthenticate() {
      await this.initializePromise;
      return await this._acquireLock(this.lockAcquireTimeout, async () => {
        return await this._reauthenticate();
      });
    }
    async _reauthenticate() {
      try {
        return await this._useSession(async (result2) => {
          const { data: { session }, error: sessionError } = result2;
          if (sessionError)
            throw sessionError;
          if (!session)
            throw new AuthSessionMissingError();
          const { error } = await _request(this.fetch, "GET", `${this.url}/reauthenticate`, {
            headers: this.headers,
            jwt: session.access_token
          });
          return this._returnResult({ data: { user: null, session: null }, error });
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        throw error;
      }
    }
    /**
     * Resends an existing signup confirmation email, email change email, SMS OTP or phone change OTP.
     */
    async resend(credentials) {
      try {
        const endpoint = `${this.url}/resend`;
        if ("email" in credentials) {
          const { email, type, options } = credentials;
          const { error } = await _request(this.fetch, "POST", endpoint, {
            headers: this.headers,
            body: {
              email,
              type,
              gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
            },
            redirectTo: options === null || options === void 0 ? void 0 : options.emailRedirectTo
          });
          return this._returnResult({ data: { user: null, session: null }, error });
        } else if ("phone" in credentials) {
          const { phone, type, options } = credentials;
          const { data, error } = await _request(this.fetch, "POST", endpoint, {
            headers: this.headers,
            body: {
              phone,
              type,
              gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
            }
          });
          return this._returnResult({
            data: { user: null, session: null, messageId: data === null || data === void 0 ? void 0 : data.message_id },
            error
          });
        }
        throw new AuthInvalidCredentialsError("You must provide either an email or phone number and a type");
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        throw error;
      }
    }
    /**
     * Returns the session, refreshing it if necessary.
     *
     * The session returned can be null if the session is not detected which can happen in the event a user is not signed-in or has logged out.
     *
     * **IMPORTANT:** This method loads values directly from the storage attached
     * to the client. If that storage is based on request cookies for example,
     * the values in it may not be authentic and therefore it's strongly advised
     * against using this method and its results in such circumstances. A warning
     * will be emitted if this is detected. Use {@link #getUser()} instead.
     */
    async getSession() {
      await this.initializePromise;
      const result2 = await this._acquireLock(this.lockAcquireTimeout, async () => {
        return this._useSession(async (result3) => {
          return result3;
        });
      });
      return result2;
    }
    /**
     * Acquires a global lock based on the storage key.
     */
    async _acquireLock(acquireTimeout, fn) {
      this._debug("#_acquireLock", "begin", acquireTimeout);
      try {
        if (this.lockAcquired) {
          const last = this.pendingInLock.length ? this.pendingInLock[this.pendingInLock.length - 1] : Promise.resolve();
          const result2 = (async () => {
            await last;
            return await fn();
          })();
          this.pendingInLock.push((async () => {
            try {
              await result2;
            } catch (e) {
            }
          })());
          return result2;
        }
        return await this.lock(`lock:${this.storageKey}`, acquireTimeout, async () => {
          this._debug("#_acquireLock", "lock acquired for storage key", this.storageKey);
          try {
            this.lockAcquired = true;
            const result2 = fn();
            this.pendingInLock.push((async () => {
              try {
                await result2;
              } catch (e) {
              }
            })());
            await result2;
            while (this.pendingInLock.length) {
              const waitOn = [...this.pendingInLock];
              await Promise.all(waitOn);
              this.pendingInLock.splice(0, waitOn.length);
            }
            return await result2;
          } finally {
            this._debug("#_acquireLock", "lock released for storage key", this.storageKey);
            this.lockAcquired = false;
          }
        });
      } finally {
        this._debug("#_acquireLock", "end");
      }
    }
    /**
     * Use instead of {@link #getSession} inside the library. It is
     * semantically usually what you want, as getting a session involves some
     * processing afterwards that requires only one client operating on the
     * session at once across multiple tabs or processes.
     */
    async _useSession(fn) {
      this._debug("#_useSession", "begin");
      try {
        const result2 = await this.__loadSession();
        return await fn(result2);
      } finally {
        this._debug("#_useSession", "end");
      }
    }
    /**
     * NEVER USE DIRECTLY!
     *
     * Always use {@link #_useSession}.
     */
    async __loadSession() {
      this._debug("#__loadSession()", "begin");
      if (!this.lockAcquired) {
        this._debug("#__loadSession()", "used outside of an acquired lock!", new Error().stack);
      }
      try {
        let currentSession = null;
        const maybeSession = await getItemAsync(this.storage, this.storageKey);
        this._debug("#getSession()", "session from storage", maybeSession);
        if (maybeSession !== null) {
          if (this._isValidSession(maybeSession)) {
            currentSession = maybeSession;
          } else {
            this._debug("#getSession()", "session from storage is not valid");
            await this._removeSession();
          }
        }
        if (!currentSession) {
          return { data: { session: null }, error: null };
        }
        const hasExpired = currentSession.expires_at ? currentSession.expires_at * 1e3 - Date.now() < EXPIRY_MARGIN_MS : false;
        this._debug("#__loadSession()", `session has${hasExpired ? "" : " not"} expired`, "expires_at", currentSession.expires_at);
        if (!hasExpired) {
          if (this.userStorage) {
            const maybeUser = await getItemAsync(this.userStorage, this.storageKey + "-user");
            if (maybeUser === null || maybeUser === void 0 ? void 0 : maybeUser.user) {
              currentSession.user = maybeUser.user;
            } else {
              currentSession.user = userNotAvailableProxy();
            }
          }
          if (this.storage.isServer && currentSession.user && !currentSession.user.__isUserNotAvailableProxy) {
            const suppressWarningRef = { value: this.suppressGetSessionWarning };
            currentSession.user = insecureUserWarningProxy(currentSession.user, suppressWarningRef);
            if (suppressWarningRef.value) {
              this.suppressGetSessionWarning = true;
            }
          }
          return { data: { session: currentSession }, error: null };
        }
        const { data: session, error } = await this._callRefreshToken(currentSession.refresh_token);
        if (error) {
          return this._returnResult({ data: { session: null }, error });
        }
        return this._returnResult({ data: { session }, error: null });
      } finally {
        this._debug("#__loadSession()", "end");
      }
    }
    /**
     * Gets the current user details if there is an existing session. This method
     * performs a network request to the Supabase Auth server, so the returned
     * value is authentic and can be used to base authorization rules on.
     *
     * @param jwt Takes in an optional access token JWT. If no JWT is provided, the JWT from the current session is used.
     */
    async getUser(jwt) {
      if (jwt) {
        return await this._getUser(jwt);
      }
      await this.initializePromise;
      const result2 = await this._acquireLock(this.lockAcquireTimeout, async () => {
        return await this._getUser();
      });
      if (result2.data.user) {
        this.suppressGetSessionWarning = true;
      }
      return result2;
    }
    async _getUser(jwt) {
      try {
        if (jwt) {
          return await _request(this.fetch, "GET", `${this.url}/user`, {
            headers: this.headers,
            jwt,
            xform: _userResponse
          });
        }
        return await this._useSession(async (result2) => {
          var _a, _b, _c;
          const { data, error } = result2;
          if (error) {
            throw error;
          }
          if (!((_a = data.session) === null || _a === void 0 ? void 0 : _a.access_token) && !this.hasCustomAuthorizationHeader) {
            return { data: { user: null }, error: new AuthSessionMissingError() };
          }
          return await _request(this.fetch, "GET", `${this.url}/user`, {
            headers: this.headers,
            jwt: (_c = (_b = data.session) === null || _b === void 0 ? void 0 : _b.access_token) !== null && _c !== void 0 ? _c : void 0,
            xform: _userResponse
          });
        });
      } catch (error) {
        if (isAuthError(error)) {
          if (isAuthSessionMissingError(error)) {
            await this._removeSession();
            await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
          }
          return this._returnResult({ data: { user: null }, error });
        }
        throw error;
      }
    }
    /**
     * Updates user data for a logged in user.
     */
    async updateUser(attributes, options = {}) {
      await this.initializePromise;
      return await this._acquireLock(this.lockAcquireTimeout, async () => {
        return await this._updateUser(attributes, options);
      });
    }
    async _updateUser(attributes, options = {}) {
      try {
        return await this._useSession(async (result2) => {
          const { data: sessionData, error: sessionError } = result2;
          if (sessionError) {
            throw sessionError;
          }
          if (!sessionData.session) {
            throw new AuthSessionMissingError();
          }
          const session = sessionData.session;
          let codeChallenge = null;
          let codeChallengeMethod = null;
          if (this.flowType === "pkce" && attributes.email != null) {
            ;
            [codeChallenge, codeChallengeMethod] = await getCodeChallengeAndMethod(this.storage, this.storageKey);
          }
          const { data, error: userError } = await _request(this.fetch, "PUT", `${this.url}/user`, {
            headers: this.headers,
            redirectTo: options === null || options === void 0 ? void 0 : options.emailRedirectTo,
            body: Object.assign(Object.assign({}, attributes), { code_challenge: codeChallenge, code_challenge_method: codeChallengeMethod }),
            jwt: session.access_token,
            xform: _userResponse
          });
          if (userError) {
            throw userError;
          }
          session.user = data.user;
          await this._saveSession(session);
          await this._notifyAllSubscribers("USER_UPDATED", session);
          return this._returnResult({ data: { user: session.user }, error: null });
        });
      } catch (error) {
        await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
        if (isAuthError(error)) {
          return this._returnResult({ data: { user: null }, error });
        }
        throw error;
      }
    }
    /**
     * Sets the session data from the current session. If the current session is expired, setSession will take care of refreshing it to obtain a new session.
     * If the refresh token or access token in the current session is invalid, an error will be thrown.
     * @param currentSession The current session that minimally contains an access token and refresh token.
     */
    async setSession(currentSession) {
      await this.initializePromise;
      return await this._acquireLock(this.lockAcquireTimeout, async () => {
        return await this._setSession(currentSession);
      });
    }
    async _setSession(currentSession) {
      try {
        if (!currentSession.access_token || !currentSession.refresh_token) {
          throw new AuthSessionMissingError();
        }
        const timeNow = Date.now() / 1e3;
        let expiresAt2 = timeNow;
        let hasExpired = true;
        let session = null;
        const { payload } = decodeJWT(currentSession.access_token);
        if (payload.exp) {
          expiresAt2 = payload.exp;
          hasExpired = expiresAt2 <= timeNow;
        }
        if (hasExpired) {
          const { data: refreshedSession, error } = await this._callRefreshToken(currentSession.refresh_token);
          if (error) {
            return this._returnResult({ data: { user: null, session: null }, error });
          }
          if (!refreshedSession) {
            return { data: { user: null, session: null }, error: null };
          }
          session = refreshedSession;
        } else {
          const { data, error } = await this._getUser(currentSession.access_token);
          if (error) {
            return this._returnResult({ data: { user: null, session: null }, error });
          }
          session = {
            access_token: currentSession.access_token,
            refresh_token: currentSession.refresh_token,
            user: data.user,
            token_type: "bearer",
            expires_in: expiresAt2 - timeNow,
            expires_at: expiresAt2
          };
          await this._saveSession(session);
          await this._notifyAllSubscribers("SIGNED_IN", session);
        }
        return this._returnResult({ data: { user: session.user, session }, error: null });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: { session: null, user: null }, error });
        }
        throw error;
      }
    }
    /**
     * Returns a new session, regardless of expiry status.
     * Takes in an optional current session. If not passed in, then refreshSession() will attempt to retrieve it from getSession().
     * If the current session's refresh token is invalid, an error will be thrown.
     * @param currentSession The current session. If passed in, it must contain a refresh token.
     */
    async refreshSession(currentSession) {
      await this.initializePromise;
      return await this._acquireLock(this.lockAcquireTimeout, async () => {
        return await this._refreshSession(currentSession);
      });
    }
    async _refreshSession(currentSession) {
      try {
        return await this._useSession(async (result2) => {
          var _a;
          if (!currentSession) {
            const { data, error: error2 } = result2;
            if (error2) {
              throw error2;
            }
            currentSession = (_a = data.session) !== null && _a !== void 0 ? _a : void 0;
          }
          if (!(currentSession === null || currentSession === void 0 ? void 0 : currentSession.refresh_token)) {
            throw new AuthSessionMissingError();
          }
          const { data: session, error } = await this._callRefreshToken(currentSession.refresh_token);
          if (error) {
            return this._returnResult({ data: { user: null, session: null }, error });
          }
          if (!session) {
            return this._returnResult({ data: { user: null, session: null }, error: null });
          }
          return this._returnResult({ data: { user: session.user, session }, error: null });
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        throw error;
      }
    }
    /**
     * Gets the session data from a URL string
     */
    async _getSessionFromURL(params, callbackUrlType) {
      try {
        if (!isBrowser())
          throw new AuthImplicitGrantRedirectError("No browser detected.");
        if (params.error || params.error_description || params.error_code) {
          throw new AuthImplicitGrantRedirectError(params.error_description || "Error in URL with unspecified error_description", {
            error: params.error || "unspecified_error",
            code: params.error_code || "unspecified_code"
          });
        }
        switch (callbackUrlType) {
          case "implicit":
            if (this.flowType === "pkce") {
              throw new AuthPKCEGrantCodeExchangeError("Not a valid PKCE flow url.");
            }
            break;
          case "pkce":
            if (this.flowType === "implicit") {
              throw new AuthImplicitGrantRedirectError("Not a valid implicit grant flow url.");
            }
            break;
          default:
        }
        if (callbackUrlType === "pkce") {
          this._debug("#_initialize()", "begin", "is PKCE flow", true);
          if (!params.code)
            throw new AuthPKCEGrantCodeExchangeError("No code detected.");
          const { data: data2, error: error2 } = await this._exchangeCodeForSession(params.code);
          if (error2)
            throw error2;
          const url = new URL(window.location.href);
          url.searchParams.delete("code");
          window.history.replaceState(window.history.state, "", url.toString());
          return { data: { session: data2.session, redirectType: null }, error: null };
        }
        const { provider_token, provider_refresh_token, access_token, refresh_token, expires_in, expires_at, token_type } = params;
        if (!access_token || !expires_in || !refresh_token || !token_type) {
          throw new AuthImplicitGrantRedirectError("No session defined in URL");
        }
        const timeNow = Math.round(Date.now() / 1e3);
        const expiresIn = parseInt(expires_in);
        let expiresAt2 = timeNow + expiresIn;
        if (expires_at) {
          expiresAt2 = parseInt(expires_at);
        }
        const actuallyExpiresIn = expiresAt2 - timeNow;
        if (actuallyExpiresIn * 1e3 <= AUTO_REFRESH_TICK_DURATION_MS) {
          console.warn(`@supabase/gotrue-js: Session as retrieved from URL expires in ${actuallyExpiresIn}s, should have been closer to ${expiresIn}s`);
        }
        const issuedAt = expiresAt2 - expiresIn;
        if (timeNow - issuedAt >= 120) {
          console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued over 120s ago, URL could be stale", issuedAt, expiresAt2, timeNow);
        } else if (timeNow - issuedAt < 0) {
          console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued in the future? Check the device clock for skew", issuedAt, expiresAt2, timeNow);
        }
        const { data, error } = await this._getUser(access_token);
        if (error)
          throw error;
        const session = {
          provider_token,
          provider_refresh_token,
          access_token,
          expires_in: expiresIn,
          expires_at: expiresAt2,
          refresh_token,
          token_type,
          user: data.user
        };
        window.location.hash = "";
        this._debug("#_getSessionFromURL()", "clearing window.location.hash");
        return this._returnResult({ data: { session, redirectType: params.type }, error: null });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: { session: null, redirectType: null }, error });
        }
        throw error;
      }
    }
    /**
     * Checks if the current URL contains parameters given by an implicit oauth grant flow (https://www.rfc-editor.org/rfc/rfc6749.html#section-4.2)
     *
     * If `detectSessionInUrl` is a function, it will be called with the URL and params to determine
     * if the URL should be processed as a Supabase auth callback. This allows users to exclude
     * URLs from other OAuth providers (e.g., Facebook Login) that also return access_token in the fragment.
     */
    _isImplicitGrantCallback(params) {
      if (typeof this.detectSessionInUrl === "function") {
        return this.detectSessionInUrl(new URL(window.location.href), params);
      }
      return Boolean(params.access_token || params.error_description);
    }
    /**
     * Checks if the current URL and backing storage contain parameters given by a PKCE flow
     */
    async _isPKCECallback(params) {
      const currentStorageContent = await getItemAsync(this.storage, `${this.storageKey}-code-verifier`);
      return !!(params.code && currentStorageContent);
    }
    /**
     * Inside a browser context, `signOut()` will remove the logged in user from the browser session and log them out - removing all items from localstorage and then trigger a `"SIGNED_OUT"` event.
     *
     * For server-side management, you can revoke all refresh tokens for a user by passing a user's JWT through to `auth.api.signOut(JWT: string)`.
     * There is no way to revoke a user's access token jwt until it expires. It is recommended to set a shorter expiry on the jwt for this reason.
     *
     * If using `others` scope, no `SIGNED_OUT` event is fired!
     */
    async signOut(options = { scope: "global" }) {
      await this.initializePromise;
      return await this._acquireLock(this.lockAcquireTimeout, async () => {
        return await this._signOut(options);
      });
    }
    async _signOut({ scope } = { scope: "global" }) {
      return await this._useSession(async (result2) => {
        var _a;
        const { data, error: sessionError } = result2;
        if (sessionError && !isAuthSessionMissingError(sessionError)) {
          return this._returnResult({ error: sessionError });
        }
        const accessToken = (_a = data.session) === null || _a === void 0 ? void 0 : _a.access_token;
        if (accessToken) {
          const { error } = await this.admin.signOut(accessToken, scope);
          if (error) {
            if (!(isAuthApiError(error) && (error.status === 404 || error.status === 401 || error.status === 403) || isAuthSessionMissingError(error))) {
              return this._returnResult({ error });
            }
          }
        }
        if (scope !== "others") {
          await this._removeSession();
          await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
        }
        return this._returnResult({ error: null });
      });
    }
    onAuthStateChange(callback) {
      const id = generateCallbackId();
      const subscription = {
        id,
        callback,
        unsubscribe: () => {
          this._debug("#unsubscribe()", "state change callback with id removed", id);
          this.stateChangeEmitters.delete(id);
        }
      };
      this._debug("#onAuthStateChange()", "registered callback with id", id);
      this.stateChangeEmitters.set(id, subscription);
      (async () => {
        await this.initializePromise;
        await this._acquireLock(this.lockAcquireTimeout, async () => {
          this._emitInitialSession(id);
        });
      })();
      return { data: { subscription } };
    }
    async _emitInitialSession(id) {
      return await this._useSession(async (result2) => {
        var _a, _b;
        try {
          const { data: { session }, error } = result2;
          if (error)
            throw error;
          await ((_a = this.stateChangeEmitters.get(id)) === null || _a === void 0 ? void 0 : _a.callback("INITIAL_SESSION", session));
          this._debug("INITIAL_SESSION", "callback id", id, "session", session);
        } catch (err) {
          await ((_b = this.stateChangeEmitters.get(id)) === null || _b === void 0 ? void 0 : _b.callback("INITIAL_SESSION", null));
          this._debug("INITIAL_SESSION", "callback id", id, "error", err);
          console.error(err);
        }
      });
    }
    /**
     * Sends a password reset request to an email address. This method supports the PKCE flow.
     *
     * @param email The email address of the user.
     * @param options.redirectTo The URL to send the user to after they click the password reset link.
     * @param options.captchaToken Verification token received when the user completes the captcha on the site.
     */
    async resetPasswordForEmail(email, options = {}) {
      let codeChallenge = null;
      let codeChallengeMethod = null;
      if (this.flowType === "pkce") {
        ;
        [codeChallenge, codeChallengeMethod] = await getCodeChallengeAndMethod(
          this.storage,
          this.storageKey,
          true
          // isPasswordRecovery
        );
      }
      try {
        return await _request(this.fetch, "POST", `${this.url}/recover`, {
          body: {
            email,
            code_challenge: codeChallenge,
            code_challenge_method: codeChallengeMethod,
            gotrue_meta_security: { captcha_token: options.captchaToken }
          },
          headers: this.headers,
          redirectTo: options.redirectTo
        });
      } catch (error) {
        await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * Gets all the identities linked to a user.
     */
    async getUserIdentities() {
      var _a;
      try {
        const { data, error } = await this.getUser();
        if (error)
          throw error;
        return this._returnResult({ data: { identities: (_a = data.user.identities) !== null && _a !== void 0 ? _a : [] }, error: null });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    async linkIdentity(credentials) {
      if ("token" in credentials) {
        return this.linkIdentityIdToken(credentials);
      }
      return this.linkIdentityOAuth(credentials);
    }
    async linkIdentityOAuth(credentials) {
      var _a;
      try {
        const { data, error } = await this._useSession(async (result2) => {
          var _a2, _b, _c, _d, _e;
          const { data: data2, error: error2 } = result2;
          if (error2)
            throw error2;
          const url = await this._getUrlForProvider(`${this.url}/user/identities/authorize`, credentials.provider, {
            redirectTo: (_a2 = credentials.options) === null || _a2 === void 0 ? void 0 : _a2.redirectTo,
            scopes: (_b = credentials.options) === null || _b === void 0 ? void 0 : _b.scopes,
            queryParams: (_c = credentials.options) === null || _c === void 0 ? void 0 : _c.queryParams,
            skipBrowserRedirect: true
          });
          return await _request(this.fetch, "GET", url, {
            headers: this.headers,
            jwt: (_e = (_d = data2.session) === null || _d === void 0 ? void 0 : _d.access_token) !== null && _e !== void 0 ? _e : void 0
          });
        });
        if (error)
          throw error;
        if (isBrowser() && !((_a = credentials.options) === null || _a === void 0 ? void 0 : _a.skipBrowserRedirect)) {
          window.location.assign(data === null || data === void 0 ? void 0 : data.url);
        }
        return this._returnResult({
          data: { provider: credentials.provider, url: data === null || data === void 0 ? void 0 : data.url },
          error: null
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: { provider: credentials.provider, url: null }, error });
        }
        throw error;
      }
    }
    async linkIdentityIdToken(credentials) {
      return await this._useSession(async (result2) => {
        var _a;
        try {
          const { error: sessionError, data: { session } } = result2;
          if (sessionError)
            throw sessionError;
          const { options, provider, token, access_token, nonce } = credentials;
          const res = await _request(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, {
            headers: this.headers,
            jwt: (_a = session === null || session === void 0 ? void 0 : session.access_token) !== null && _a !== void 0 ? _a : void 0,
            body: {
              provider,
              id_token: token,
              access_token,
              nonce,
              link_identity: true,
              gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
            },
            xform: _sessionResponse
          });
          const { data, error } = res;
          if (error) {
            return this._returnResult({ data: { user: null, session: null }, error });
          } else if (!data || !data.session || !data.user) {
            return this._returnResult({
              data: { user: null, session: null },
              error: new AuthInvalidTokenResponseError()
            });
          }
          if (data.session) {
            await this._saveSession(data.session);
            await this._notifyAllSubscribers("USER_UPDATED", data.session);
          }
          return this._returnResult({ data, error });
        } catch (error) {
          await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
          if (isAuthError(error)) {
            return this._returnResult({ data: { user: null, session: null }, error });
          }
          throw error;
        }
      });
    }
    /**
     * Unlinks an identity from a user by deleting it. The user will no longer be able to sign in with that identity once it's unlinked.
     */
    async unlinkIdentity(identity) {
      try {
        return await this._useSession(async (result2) => {
          var _a, _b;
          const { data, error } = result2;
          if (error) {
            throw error;
          }
          return await _request(this.fetch, "DELETE", `${this.url}/user/identities/${identity.identity_id}`, {
            headers: this.headers,
            jwt: (_b = (_a = data.session) === null || _a === void 0 ? void 0 : _a.access_token) !== null && _b !== void 0 ? _b : void 0
          });
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * Generates a new JWT.
     * @param refreshToken A valid refresh token that was returned on login.
     */
    async _refreshAccessToken(refreshToken) {
      const debugName = `#_refreshAccessToken(${refreshToken.substring(0, 5)}...)`;
      this._debug(debugName, "begin");
      try {
        const startedAt = Date.now();
        return await retryable(async (attempt) => {
          if (attempt > 0) {
            await sleep(200 * Math.pow(2, attempt - 1));
          }
          this._debug(debugName, "refreshing attempt", attempt);
          return await _request(this.fetch, "POST", `${this.url}/token?grant_type=refresh_token`, {
            body: { refresh_token: refreshToken },
            headers: this.headers,
            xform: _sessionResponse
          });
        }, (attempt, error) => {
          const nextBackOffInterval = 200 * Math.pow(2, attempt);
          return error && isAuthRetryableFetchError(error) && // retryable only if the request can be sent before the backoff overflows the tick duration
          Date.now() + nextBackOffInterval - startedAt < AUTO_REFRESH_TICK_DURATION_MS;
        });
      } catch (error) {
        this._debug(debugName, "error", error);
        if (isAuthError(error)) {
          return this._returnResult({ data: { session: null, user: null }, error });
        }
        throw error;
      } finally {
        this._debug(debugName, "end");
      }
    }
    _isValidSession(maybeSession) {
      const isValidSession = typeof maybeSession === "object" && maybeSession !== null && "access_token" in maybeSession && "refresh_token" in maybeSession && "expires_at" in maybeSession;
      return isValidSession;
    }
    async _handleProviderSignIn(provider, options) {
      const url = await this._getUrlForProvider(`${this.url}/authorize`, provider, {
        redirectTo: options.redirectTo,
        scopes: options.scopes,
        queryParams: options.queryParams
      });
      this._debug("#_handleProviderSignIn()", "provider", provider, "options", options, "url", url);
      if (isBrowser() && !options.skipBrowserRedirect) {
        window.location.assign(url);
      }
      return { data: { provider, url }, error: null };
    }
    /**
     * Recovers the session from LocalStorage and refreshes the token
     * Note: this method is async to accommodate for AsyncStorage e.g. in React native.
     */
    async _recoverAndRefresh() {
      var _a, _b;
      const debugName = "#_recoverAndRefresh()";
      this._debug(debugName, "begin");
      try {
        const currentSession = await getItemAsync(this.storage, this.storageKey);
        if (currentSession && this.userStorage) {
          let maybeUser = await getItemAsync(this.userStorage, this.storageKey + "-user");
          if (!this.storage.isServer && Object.is(this.storage, this.userStorage) && !maybeUser) {
            maybeUser = { user: currentSession.user };
            await setItemAsync(this.userStorage, this.storageKey + "-user", maybeUser);
          }
          currentSession.user = (_a = maybeUser === null || maybeUser === void 0 ? void 0 : maybeUser.user) !== null && _a !== void 0 ? _a : userNotAvailableProxy();
        } else if (currentSession && !currentSession.user) {
          if (!currentSession.user) {
            const separateUser = await getItemAsync(this.storage, this.storageKey + "-user");
            if (separateUser && (separateUser === null || separateUser === void 0 ? void 0 : separateUser.user)) {
              currentSession.user = separateUser.user;
              await removeItemAsync(this.storage, this.storageKey + "-user");
              await setItemAsync(this.storage, this.storageKey, currentSession);
            } else {
              currentSession.user = userNotAvailableProxy();
            }
          }
        }
        this._debug(debugName, "session from storage", currentSession);
        if (!this._isValidSession(currentSession)) {
          this._debug(debugName, "session is not valid");
          if (currentSession !== null) {
            await this._removeSession();
          }
          return;
        }
        const expiresWithMargin = ((_b = currentSession.expires_at) !== null && _b !== void 0 ? _b : Infinity) * 1e3 - Date.now() < EXPIRY_MARGIN_MS;
        this._debug(debugName, `session has${expiresWithMargin ? "" : " not"} expired with margin of ${EXPIRY_MARGIN_MS}s`);
        if (expiresWithMargin) {
          if (this.autoRefreshToken && currentSession.refresh_token) {
            const { error } = await this._callRefreshToken(currentSession.refresh_token);
            if (error) {
              console.error(error);
              if (!isAuthRetryableFetchError(error)) {
                this._debug(debugName, "refresh failed with a non-retryable error, removing the session", error);
                await this._removeSession();
              }
            }
          }
        } else if (currentSession.user && currentSession.user.__isUserNotAvailableProxy === true) {
          try {
            const { data, error: userError } = await this._getUser(currentSession.access_token);
            if (!userError && (data === null || data === void 0 ? void 0 : data.user)) {
              currentSession.user = data.user;
              await this._saveSession(currentSession);
              await this._notifyAllSubscribers("SIGNED_IN", currentSession);
            } else {
              this._debug(debugName, "could not get user data, skipping SIGNED_IN notification");
            }
          } catch (getUserError) {
            console.error("Error getting user data:", getUserError);
            this._debug(debugName, "error getting user data, skipping SIGNED_IN notification", getUserError);
          }
        } else {
          await this._notifyAllSubscribers("SIGNED_IN", currentSession);
        }
      } catch (err) {
        this._debug(debugName, "error", err);
        console.error(err);
        return;
      } finally {
        this._debug(debugName, "end");
      }
    }
    async _callRefreshToken(refreshToken) {
      var _a, _b;
      if (!refreshToken) {
        throw new AuthSessionMissingError();
      }
      if (this.refreshingDeferred) {
        return this.refreshingDeferred.promise;
      }
      const debugName = `#_callRefreshToken(${refreshToken.substring(0, 5)}...)`;
      this._debug(debugName, "begin");
      try {
        this.refreshingDeferred = new Deferred();
        const { data, error } = await this._refreshAccessToken(refreshToken);
        if (error)
          throw error;
        if (!data.session)
          throw new AuthSessionMissingError();
        await this._saveSession(data.session);
        await this._notifyAllSubscribers("TOKEN_REFRESHED", data.session);
        const result2 = { data: data.session, error: null };
        this.refreshingDeferred.resolve(result2);
        return result2;
      } catch (error) {
        this._debug(debugName, "error", error);
        if (isAuthError(error)) {
          const result2 = { data: null, error };
          if (!isAuthRetryableFetchError(error)) {
            await this._removeSession();
          }
          (_a = this.refreshingDeferred) === null || _a === void 0 ? void 0 : _a.resolve(result2);
          return result2;
        }
        (_b = this.refreshingDeferred) === null || _b === void 0 ? void 0 : _b.reject(error);
        throw error;
      } finally {
        this.refreshingDeferred = null;
        this._debug(debugName, "end");
      }
    }
    async _notifyAllSubscribers(event, session, broadcast = true) {
      const debugName = `#_notifyAllSubscribers(${event})`;
      this._debug(debugName, "begin", session, `broadcast = ${broadcast}`);
      try {
        if (this.broadcastChannel && broadcast) {
          this.broadcastChannel.postMessage({ event, session });
        }
        const errors = [];
        const promises = Array.from(this.stateChangeEmitters.values()).map(async (x) => {
          try {
            await x.callback(event, session);
          } catch (e) {
            errors.push(e);
          }
        });
        await Promise.all(promises);
        if (errors.length > 0) {
          for (let i = 0; i < errors.length; i += 1) {
            console.error(errors[i]);
          }
          throw errors[0];
        }
      } finally {
        this._debug(debugName, "end");
      }
    }
    /**
     * set currentSession and currentUser
     * process to _startAutoRefreshToken if possible
     */
    async _saveSession(session) {
      this._debug("#_saveSession()", session);
      this.suppressGetSessionWarning = true;
      await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
      const sessionToProcess = Object.assign({}, session);
      const userIsProxy = sessionToProcess.user && sessionToProcess.user.__isUserNotAvailableProxy === true;
      if (this.userStorage) {
        if (!userIsProxy && sessionToProcess.user) {
          await setItemAsync(this.userStorage, this.storageKey + "-user", {
            user: sessionToProcess.user
          });
        } else if (userIsProxy) {
        }
        const mainSessionData = Object.assign({}, sessionToProcess);
        delete mainSessionData.user;
        const clonedMainSessionData = deepClone(mainSessionData);
        await setItemAsync(this.storage, this.storageKey, clonedMainSessionData);
      } else {
        const clonedSession = deepClone(sessionToProcess);
        await setItemAsync(this.storage, this.storageKey, clonedSession);
      }
    }
    async _removeSession() {
      this._debug("#_removeSession()");
      this.suppressGetSessionWarning = false;
      await removeItemAsync(this.storage, this.storageKey);
      await removeItemAsync(this.storage, this.storageKey + "-code-verifier");
      await removeItemAsync(this.storage, this.storageKey + "-user");
      if (this.userStorage) {
        await removeItemAsync(this.userStorage, this.storageKey + "-user");
      }
      await this._notifyAllSubscribers("SIGNED_OUT", null);
    }
    /**
     * Removes any registered visibilitychange callback.
     *
     * {@see #startAutoRefresh}
     * {@see #stopAutoRefresh}
     */
    _removeVisibilityChangedCallback() {
      this._debug("#_removeVisibilityChangedCallback()");
      const callback = this.visibilityChangedCallback;
      this.visibilityChangedCallback = null;
      try {
        if (callback && isBrowser() && (window === null || window === void 0 ? void 0 : window.removeEventListener)) {
          window.removeEventListener("visibilitychange", callback);
        }
      } catch (e) {
        console.error("removing visibilitychange callback failed", e);
      }
    }
    /**
     * This is the private implementation of {@link #startAutoRefresh}. Use this
     * within the library.
     */
    async _startAutoRefresh() {
      await this._stopAutoRefresh();
      this._debug("#_startAutoRefresh()");
      const ticker = setInterval(() => this._autoRefreshTokenTick(), AUTO_REFRESH_TICK_DURATION_MS);
      this.autoRefreshTicker = ticker;
      if (ticker && typeof ticker === "object" && typeof ticker.unref === "function") {
        ticker.unref();
      } else if (typeof Deno !== "undefined" && typeof Deno.unrefTimer === "function") {
        Deno.unrefTimer(ticker);
      }
      const timeout = setTimeout(async () => {
        await this.initializePromise;
        await this._autoRefreshTokenTick();
      }, 0);
      this.autoRefreshTickTimeout = timeout;
      if (timeout && typeof timeout === "object" && typeof timeout.unref === "function") {
        timeout.unref();
      } else if (typeof Deno !== "undefined" && typeof Deno.unrefTimer === "function") {
        Deno.unrefTimer(timeout);
      }
    }
    /**
     * This is the private implementation of {@link #stopAutoRefresh}. Use this
     * within the library.
     */
    async _stopAutoRefresh() {
      this._debug("#_stopAutoRefresh()");
      const ticker = this.autoRefreshTicker;
      this.autoRefreshTicker = null;
      if (ticker) {
        clearInterval(ticker);
      }
      const timeout = this.autoRefreshTickTimeout;
      this.autoRefreshTickTimeout = null;
      if (timeout) {
        clearTimeout(timeout);
      }
    }
    /**
     * Starts an auto-refresh process in the background. The session is checked
     * every few seconds. Close to the time of expiration a process is started to
     * refresh the session. If refreshing fails it will be retried for as long as
     * necessary.
     *
     * If you set the {@link GoTrueClientOptions#autoRefreshToken} you don't need
     * to call this function, it will be called for you.
     *
     * On browsers the refresh process works only when the tab/window is in the
     * foreground to conserve resources as well as prevent race conditions and
     * flooding auth with requests. If you call this method any managed
     * visibility change callback will be removed and you must manage visibility
     * changes on your own.
     *
     * On non-browser platforms the refresh process works *continuously* in the
     * background, which may not be desirable. You should hook into your
     * platform's foreground indication mechanism and call these methods
     * appropriately to conserve resources.
     *
     * {@see #stopAutoRefresh}
     */
    async startAutoRefresh() {
      this._removeVisibilityChangedCallback();
      await this._startAutoRefresh();
    }
    /**
     * Stops an active auto refresh process running in the background (if any).
     *
     * If you call this method any managed visibility change callback will be
     * removed and you must manage visibility changes on your own.
     *
     * See {@link #startAutoRefresh} for more details.
     */
    async stopAutoRefresh() {
      this._removeVisibilityChangedCallback();
      await this._stopAutoRefresh();
    }
    /**
     * Runs the auto refresh token tick.
     */
    async _autoRefreshTokenTick() {
      this._debug("#_autoRefreshTokenTick()", "begin");
      try {
        await this._acquireLock(0, async () => {
          try {
            const now = Date.now();
            try {
              return await this._useSession(async (result2) => {
                const { data: { session } } = result2;
                if (!session || !session.refresh_token || !session.expires_at) {
                  this._debug("#_autoRefreshTokenTick()", "no session");
                  return;
                }
                const expiresInTicks = Math.floor((session.expires_at * 1e3 - now) / AUTO_REFRESH_TICK_DURATION_MS);
                this._debug("#_autoRefreshTokenTick()", `access token expires in ${expiresInTicks} ticks, a tick lasts ${AUTO_REFRESH_TICK_DURATION_MS}ms, refresh threshold is ${AUTO_REFRESH_TICK_THRESHOLD} ticks`);
                if (expiresInTicks <= AUTO_REFRESH_TICK_THRESHOLD) {
                  await this._callRefreshToken(session.refresh_token);
                }
              });
            } catch (e) {
              console.error("Auto refresh tick failed with error. This is likely a transient error.", e);
            }
          } finally {
            this._debug("#_autoRefreshTokenTick()", "end");
          }
        });
      } catch (e) {
        if (e.isAcquireTimeout || e instanceof LockAcquireTimeoutError) {
          this._debug("auto refresh token tick lock not available");
        } else {
          throw e;
        }
      }
    }
    /**
     * Registers callbacks on the browser / platform, which in-turn run
     * algorithms when the browser window/tab are in foreground. On non-browser
     * platforms it assumes always foreground.
     */
    async _handleVisibilityChange() {
      this._debug("#_handleVisibilityChange()");
      if (!isBrowser() || !(window === null || window === void 0 ? void 0 : window.addEventListener)) {
        if (this.autoRefreshToken) {
          this.startAutoRefresh();
        }
        return false;
      }
      try {
        this.visibilityChangedCallback = async () => {
          try {
            await this._onVisibilityChanged(false);
          } catch (error) {
            this._debug("#visibilityChangedCallback", "error", error);
          }
        };
        window === null || window === void 0 ? void 0 : window.addEventListener("visibilitychange", this.visibilityChangedCallback);
        await this._onVisibilityChanged(true);
      } catch (error) {
        console.error("_handleVisibilityChange", error);
      }
    }
    /**
     * Callback registered with `window.addEventListener('visibilitychange')`.
     */
    async _onVisibilityChanged(calledFromInitialize) {
      const methodName = `#_onVisibilityChanged(${calledFromInitialize})`;
      this._debug(methodName, "visibilityState", document.visibilityState);
      if (document.visibilityState === "visible") {
        if (this.autoRefreshToken) {
          this._startAutoRefresh();
        }
        if (!calledFromInitialize) {
          await this.initializePromise;
          await this._acquireLock(this.lockAcquireTimeout, async () => {
            if (document.visibilityState !== "visible") {
              this._debug(methodName, "acquired the lock to recover the session, but the browser visibilityState is no longer visible, aborting");
              return;
            }
            await this._recoverAndRefresh();
          });
        }
      } else if (document.visibilityState === "hidden") {
        if (this.autoRefreshToken) {
          this._stopAutoRefresh();
        }
      }
    }
    /**
     * Generates the relevant login URL for a third-party provider.
     * @param options.redirectTo A URL or mobile address to send the user to after they are confirmed.
     * @param options.scopes A space-separated list of scopes granted to the OAuth application.
     * @param options.queryParams An object of key-value pairs containing query parameters granted to the OAuth application.
     */
    async _getUrlForProvider(url, provider, options) {
      const urlParams = [`provider=${encodeURIComponent(provider)}`];
      if (options === null || options === void 0 ? void 0 : options.redirectTo) {
        urlParams.push(`redirect_to=${encodeURIComponent(options.redirectTo)}`);
      }
      if (options === null || options === void 0 ? void 0 : options.scopes) {
        urlParams.push(`scopes=${encodeURIComponent(options.scopes)}`);
      }
      if (this.flowType === "pkce") {
        const [codeChallenge, codeChallengeMethod] = await getCodeChallengeAndMethod(this.storage, this.storageKey);
        const flowParams = new URLSearchParams({
          code_challenge: `${encodeURIComponent(codeChallenge)}`,
          code_challenge_method: `${encodeURIComponent(codeChallengeMethod)}`
        });
        urlParams.push(flowParams.toString());
      }
      if (options === null || options === void 0 ? void 0 : options.queryParams) {
        const query = new URLSearchParams(options.queryParams);
        urlParams.push(query.toString());
      }
      if (options === null || options === void 0 ? void 0 : options.skipBrowserRedirect) {
        urlParams.push(`skip_http_redirect=${options.skipBrowserRedirect}`);
      }
      return `${url}?${urlParams.join("&")}`;
    }
    async _unenroll(params) {
      try {
        return await this._useSession(async (result2) => {
          var _a;
          const { data: sessionData, error: sessionError } = result2;
          if (sessionError) {
            return this._returnResult({ data: null, error: sessionError });
          }
          return await _request(this.fetch, "DELETE", `${this.url}/factors/${params.factorId}`, {
            headers: this.headers,
            jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
          });
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    async _enroll(params) {
      try {
        return await this._useSession(async (result2) => {
          var _a, _b;
          const { data: sessionData, error: sessionError } = result2;
          if (sessionError) {
            return this._returnResult({ data: null, error: sessionError });
          }
          const body = Object.assign({ friendly_name: params.friendlyName, factor_type: params.factorType }, params.factorType === "phone" ? { phone: params.phone } : params.factorType === "totp" ? { issuer: params.issuer } : {});
          const { data, error } = await _request(this.fetch, "POST", `${this.url}/factors`, {
            body,
            headers: this.headers,
            jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
          });
          if (error) {
            return this._returnResult({ data: null, error });
          }
          if (params.factorType === "totp" && data.type === "totp" && ((_b = data === null || data === void 0 ? void 0 : data.totp) === null || _b === void 0 ? void 0 : _b.qr_code)) {
            data.totp.qr_code = `data:image/svg+xml;utf-8,${data.totp.qr_code}`;
          }
          return this._returnResult({ data, error: null });
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    async _verify(params) {
      return this._acquireLock(this.lockAcquireTimeout, async () => {
        try {
          return await this._useSession(async (result2) => {
            var _a;
            const { data: sessionData, error: sessionError } = result2;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            const body = Object.assign({ challenge_id: params.challengeId }, "webauthn" in params ? {
              webauthn: Object.assign(Object.assign({}, params.webauthn), { credential_response: params.webauthn.type === "create" ? serializeCredentialCreationResponse(params.webauthn.credential_response) : serializeCredentialRequestResponse(params.webauthn.credential_response) })
            } : { code: params.code });
            const { data, error } = await _request(this.fetch, "POST", `${this.url}/factors/${params.factorId}/verify`, {
              body,
              headers: this.headers,
              jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
            });
            if (error) {
              return this._returnResult({ data: null, error });
            }
            await this._saveSession(Object.assign({ expires_at: Math.round(Date.now() / 1e3) + data.expires_in }, data));
            await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED", data);
            return this._returnResult({ data, error });
          });
        } catch (error) {
          if (isAuthError(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      });
    }
    async _challenge(params) {
      return this._acquireLock(this.lockAcquireTimeout, async () => {
        try {
          return await this._useSession(async (result2) => {
            var _a;
            const { data: sessionData, error: sessionError } = result2;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            const response = await _request(this.fetch, "POST", `${this.url}/factors/${params.factorId}/challenge`, {
              body: params,
              headers: this.headers,
              jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
            });
            if (response.error) {
              return response;
            }
            const { data } = response;
            if (data.type !== "webauthn") {
              return { data, error: null };
            }
            switch (data.webauthn.type) {
              case "create":
                return {
                  data: Object.assign(Object.assign({}, data), { webauthn: Object.assign(Object.assign({}, data.webauthn), { credential_options: Object.assign(Object.assign({}, data.webauthn.credential_options), { publicKey: deserializeCredentialCreationOptions(data.webauthn.credential_options.publicKey) }) }) }),
                  error: null
                };
              case "request":
                return {
                  data: Object.assign(Object.assign({}, data), { webauthn: Object.assign(Object.assign({}, data.webauthn), { credential_options: Object.assign(Object.assign({}, data.webauthn.credential_options), { publicKey: deserializeCredentialRequestOptions(data.webauthn.credential_options.publicKey) }) }) }),
                  error: null
                };
            }
          });
        } catch (error) {
          if (isAuthError(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      });
    }
    /**
     * {@see GoTrueMFAApi#challengeAndVerify}
     */
    async _challengeAndVerify(params) {
      const { data: challengeData, error: challengeError } = await this._challenge({
        factorId: params.factorId
      });
      if (challengeError) {
        return this._returnResult({ data: null, error: challengeError });
      }
      return await this._verify({
        factorId: params.factorId,
        challengeId: challengeData.id,
        code: params.code
      });
    }
    /**
     * {@see GoTrueMFAApi#listFactors}
     */
    async _listFactors() {
      var _a;
      const { data: { user }, error: userError } = await this.getUser();
      if (userError) {
        return { data: null, error: userError };
      }
      const data = {
        all: [],
        phone: [],
        totp: [],
        webauthn: []
      };
      for (const factor of (_a = user === null || user === void 0 ? void 0 : user.factors) !== null && _a !== void 0 ? _a : []) {
        data.all.push(factor);
        if (factor.status === "verified") {
          ;
          data[factor.factor_type].push(factor);
        }
      }
      return {
        data,
        error: null
      };
    }
    /**
     * {@see GoTrueMFAApi#getAuthenticatorAssuranceLevel}
     */
    async _getAuthenticatorAssuranceLevel(jwt) {
      var _a, _b, _c, _d;
      if (jwt) {
        try {
          const { payload: payload2 } = decodeJWT(jwt);
          let currentLevel2 = null;
          if (payload2.aal) {
            currentLevel2 = payload2.aal;
          }
          let nextLevel2 = currentLevel2;
          const { data: { user }, error: userError } = await this.getUser(jwt);
          if (userError) {
            return this._returnResult({ data: null, error: userError });
          }
          const verifiedFactors2 = (_b = (_a = user === null || user === void 0 ? void 0 : user.factors) === null || _a === void 0 ? void 0 : _a.filter((factor) => factor.status === "verified")) !== null && _b !== void 0 ? _b : [];
          if (verifiedFactors2.length > 0) {
            nextLevel2 = "aal2";
          }
          const currentAuthenticationMethods2 = payload2.amr || [];
          return { data: { currentLevel: currentLevel2, nextLevel: nextLevel2, currentAuthenticationMethods: currentAuthenticationMethods2 }, error: null };
        } catch (error) {
          if (isAuthError(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      const { data: { session }, error: sessionError } = await this.getSession();
      if (sessionError) {
        return this._returnResult({ data: null, error: sessionError });
      }
      if (!session) {
        return {
          data: { currentLevel: null, nextLevel: null, currentAuthenticationMethods: [] },
          error: null
        };
      }
      const { payload } = decodeJWT(session.access_token);
      let currentLevel = null;
      if (payload.aal) {
        currentLevel = payload.aal;
      }
      let nextLevel = currentLevel;
      const verifiedFactors = (_d = (_c = session.user.factors) === null || _c === void 0 ? void 0 : _c.filter((factor) => factor.status === "verified")) !== null && _d !== void 0 ? _d : [];
      if (verifiedFactors.length > 0) {
        nextLevel = "aal2";
      }
      const currentAuthenticationMethods = payload.amr || [];
      return { data: { currentLevel, nextLevel, currentAuthenticationMethods }, error: null };
    }
    /**
     * Retrieves details about an OAuth authorization request.
     * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
     *
     * Returns authorization details including client info, scopes, and user information.
     * If the API returns a redirect_uri, it means consent was already given - the caller
     * should handle the redirect manually if needed.
     */
    async _getAuthorizationDetails(authorizationId) {
      try {
        return await this._useSession(async (result2) => {
          const { data: { session }, error: sessionError } = result2;
          if (sessionError) {
            return this._returnResult({ data: null, error: sessionError });
          }
          if (!session) {
            return this._returnResult({ data: null, error: new AuthSessionMissingError() });
          }
          return await _request(this.fetch, "GET", `${this.url}/oauth/authorizations/${authorizationId}`, {
            headers: this.headers,
            jwt: session.access_token,
            xform: (data) => ({ data, error: null })
          });
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * Approves an OAuth authorization request.
     * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
     */
    async _approveAuthorization(authorizationId, options) {
      try {
        return await this._useSession(async (result2) => {
          const { data: { session }, error: sessionError } = result2;
          if (sessionError) {
            return this._returnResult({ data: null, error: sessionError });
          }
          if (!session) {
            return this._returnResult({ data: null, error: new AuthSessionMissingError() });
          }
          const response = await _request(this.fetch, "POST", `${this.url}/oauth/authorizations/${authorizationId}/consent`, {
            headers: this.headers,
            jwt: session.access_token,
            body: { action: "approve" },
            xform: (data) => ({ data, error: null })
          });
          if (response.data && response.data.redirect_url) {
            if (isBrowser() && !(options === null || options === void 0 ? void 0 : options.skipBrowserRedirect)) {
              window.location.assign(response.data.redirect_url);
            }
          }
          return response;
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * Denies an OAuth authorization request.
     * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
     */
    async _denyAuthorization(authorizationId, options) {
      try {
        return await this._useSession(async (result2) => {
          const { data: { session }, error: sessionError } = result2;
          if (sessionError) {
            return this._returnResult({ data: null, error: sessionError });
          }
          if (!session) {
            return this._returnResult({ data: null, error: new AuthSessionMissingError() });
          }
          const response = await _request(this.fetch, "POST", `${this.url}/oauth/authorizations/${authorizationId}/consent`, {
            headers: this.headers,
            jwt: session.access_token,
            body: { action: "deny" },
            xform: (data) => ({ data, error: null })
          });
          if (response.data && response.data.redirect_url) {
            if (isBrowser() && !(options === null || options === void 0 ? void 0 : options.skipBrowserRedirect)) {
              window.location.assign(response.data.redirect_url);
            }
          }
          return response;
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * Lists all OAuth grants that the authenticated user has authorized.
     * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
     */
    async _listOAuthGrants() {
      try {
        return await this._useSession(async (result2) => {
          const { data: { session }, error: sessionError } = result2;
          if (sessionError) {
            return this._returnResult({ data: null, error: sessionError });
          }
          if (!session) {
            return this._returnResult({ data: null, error: new AuthSessionMissingError() });
          }
          return await _request(this.fetch, "GET", `${this.url}/user/oauth/grants`, {
            headers: this.headers,
            jwt: session.access_token,
            xform: (data) => ({ data, error: null })
          });
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * Revokes a user's OAuth grant for a specific client.
     * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
     */
    async _revokeOAuthGrant(options) {
      try {
        return await this._useSession(async (result2) => {
          const { data: { session }, error: sessionError } = result2;
          if (sessionError) {
            return this._returnResult({ data: null, error: sessionError });
          }
          if (!session) {
            return this._returnResult({ data: null, error: new AuthSessionMissingError() });
          }
          await _request(this.fetch, "DELETE", `${this.url}/user/oauth/grants`, {
            headers: this.headers,
            jwt: session.access_token,
            query: { client_id: options.clientId },
            noResolveJson: true
          });
          return { data: {}, error: null };
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    async fetchJwk(kid, jwks = { keys: [] }) {
      let jwk = jwks.keys.find((key) => key.kid === kid);
      if (jwk) {
        return jwk;
      }
      const now = Date.now();
      jwk = this.jwks.keys.find((key) => key.kid === kid);
      if (jwk && this.jwks_cached_at + JWKS_TTL > now) {
        return jwk;
      }
      const { data, error } = await _request(this.fetch, "GET", `${this.url}/.well-known/jwks.json`, {
        headers: this.headers
      });
      if (error) {
        throw error;
      }
      if (!data.keys || data.keys.length === 0) {
        return null;
      }
      this.jwks = data;
      this.jwks_cached_at = now;
      jwk = data.keys.find((key) => key.kid === kid);
      if (!jwk) {
        return null;
      }
      return jwk;
    }
    /**
     * Extracts the JWT claims present in the access token by first verifying the
     * JWT against the server's JSON Web Key Set endpoint
     * `/.well-known/jwks.json` which is often cached, resulting in significantly
     * faster responses. Prefer this method over {@link #getUser} which always
     * sends a request to the Auth server for each JWT.
     *
     * If the project is not using an asymmetric JWT signing key (like ECC or
     * RSA) it always sends a request to the Auth server (similar to {@link
     * #getUser}) to verify the JWT.
     *
     * @param jwt An optional specific JWT you wish to verify, not the one you
     *            can obtain from {@link #getSession}.
     * @param options Various additional options that allow you to customize the
     *                behavior of this method.
     */
    async getClaims(jwt, options = {}) {
      try {
        let token = jwt;
        if (!token) {
          const { data, error } = await this.getSession();
          if (error || !data.session) {
            return this._returnResult({ data: null, error });
          }
          token = data.session.access_token;
        }
        const { header, payload, signature, raw: { header: rawHeader, payload: rawPayload } } = decodeJWT(token);
        if (!(options === null || options === void 0 ? void 0 : options.allowExpired)) {
          validateExp(payload.exp);
        }
        const signingKey = !header.alg || header.alg.startsWith("HS") || !header.kid || !("crypto" in globalThis && "subtle" in globalThis.crypto) ? null : await this.fetchJwk(header.kid, (options === null || options === void 0 ? void 0 : options.keys) ? { keys: options.keys } : options === null || options === void 0 ? void 0 : options.jwks);
        if (!signingKey) {
          const { error } = await this.getUser(token);
          if (error) {
            throw error;
          }
          return {
            data: {
              claims: payload,
              header,
              signature
            },
            error: null
          };
        }
        const algorithm = getAlgorithm(header.alg);
        const publicKey = await crypto.subtle.importKey("jwk", signingKey, algorithm, true, [
          "verify"
        ]);
        const isValid = await crypto.subtle.verify(algorithm, publicKey, signature, stringToUint8Array(`${rawHeader}.${rawPayload}`));
        if (!isValid) {
          throw new AuthInvalidJwtError("Invalid JWT signature");
        }
        return {
          data: {
            claims: payload,
            header,
            signature
          },
          error: null
        };
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
  };
  GoTrueClient.nextInstanceID = {};
  var GoTrueClient_default = GoTrueClient;

  // ../../node_modules/@supabase/auth-js/dist/module/AuthClient.js
  var AuthClient = GoTrueClient_default;
  var AuthClient_default = AuthClient;

  // ../../node_modules/@supabase/supabase-js/dist/index.mjs
  var version4 = "2.93.3";
  var JS_ENV = "";
  if (typeof Deno !== "undefined")
    JS_ENV = "deno";
  else if (typeof document !== "undefined")
    JS_ENV = "web";
  else if (typeof navigator !== "undefined" && navigator.product === "ReactNative")
    JS_ENV = "react-native";
  else
    JS_ENV = "node";
  var DEFAULT_HEADERS3 = { "X-Client-Info": `supabase-js-${JS_ENV}/${version4}` };
  var DEFAULT_GLOBAL_OPTIONS = { headers: DEFAULT_HEADERS3 };
  var DEFAULT_DB_OPTIONS = { schema: "public" };
  var DEFAULT_AUTH_OPTIONS = {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "implicit"
  };
  var DEFAULT_REALTIME_OPTIONS = {};
  function _typeof2(o) {
    "@babel/helpers - typeof";
    return _typeof2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o$1) {
      return typeof o$1;
    } : function(o$1) {
      return o$1 && "function" == typeof Symbol && o$1.constructor === Symbol && o$1 !== Symbol.prototype ? "symbol" : typeof o$1;
    }, _typeof2(o);
  }
  function toPrimitive2(t, r) {
    if ("object" != _typeof2(t) || !t)
      return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != _typeof2(i))
        return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function toPropertyKey2(t) {
    var i = toPrimitive2(t, "string");
    return "symbol" == _typeof2(i) ? i : i + "";
  }
  function _defineProperty2(e, r, t) {
    return (r = toPropertyKey2(r)) in e ? Object.defineProperty(e, r, {
      value: t,
      enumerable: true,
      configurable: true,
      writable: true
    }) : e[r] = t, e;
  }
  function ownKeys2(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function(r$1) {
        return Object.getOwnPropertyDescriptor(e, r$1).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread22(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys2(Object(t), true).forEach(function(r$1) {
        _defineProperty2(e, r$1, t[r$1]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys2(Object(t)).forEach(function(r$1) {
        Object.defineProperty(e, r$1, Object.getOwnPropertyDescriptor(t, r$1));
      });
    }
    return e;
  }
  var resolveFetch4 = (customFetch) => {
    if (customFetch)
      return (...args) => customFetch(...args);
    return (...args) => fetch(...args);
  };
  var resolveHeadersConstructor = () => {
    return Headers;
  };
  var fetchWithAuth = (supabaseKey, getAccessToken, customFetch) => {
    const fetch$1 = resolveFetch4(customFetch);
    const HeadersConstructor = resolveHeadersConstructor();
    return async (input, init) => {
      var _await$getAccessToken;
      const accessToken = (_await$getAccessToken = await getAccessToken()) !== null && _await$getAccessToken !== void 0 ? _await$getAccessToken : supabaseKey;
      let headers = new HeadersConstructor(init === null || init === void 0 ? void 0 : init.headers);
      if (!headers.has("apikey"))
        headers.set("apikey", supabaseKey);
      if (!headers.has("Authorization"))
        headers.set("Authorization", `Bearer ${accessToken}`);
      return fetch$1(input, _objectSpread22(_objectSpread22({}, init), {}, { headers }));
    };
  };
  function ensureTrailingSlash(url) {
    return url.endsWith("/") ? url : url + "/";
  }
  function applySettingDefaults(options, defaults) {
    var _DEFAULT_GLOBAL_OPTIO, _globalOptions$header;
    const { db: dbOptions, auth: authOptions, realtime: realtimeOptions, global: globalOptions } = options;
    const { db: DEFAULT_DB_OPTIONS$1, auth: DEFAULT_AUTH_OPTIONS$1, realtime: DEFAULT_REALTIME_OPTIONS$1, global: DEFAULT_GLOBAL_OPTIONS$1 } = defaults;
    const result2 = {
      db: _objectSpread22(_objectSpread22({}, DEFAULT_DB_OPTIONS$1), dbOptions),
      auth: _objectSpread22(_objectSpread22({}, DEFAULT_AUTH_OPTIONS$1), authOptions),
      realtime: _objectSpread22(_objectSpread22({}, DEFAULT_REALTIME_OPTIONS$1), realtimeOptions),
      storage: {},
      global: _objectSpread22(_objectSpread22(_objectSpread22({}, DEFAULT_GLOBAL_OPTIONS$1), globalOptions), {}, { headers: _objectSpread22(_objectSpread22({}, (_DEFAULT_GLOBAL_OPTIO = DEFAULT_GLOBAL_OPTIONS$1 === null || DEFAULT_GLOBAL_OPTIONS$1 === void 0 ? void 0 : DEFAULT_GLOBAL_OPTIONS$1.headers) !== null && _DEFAULT_GLOBAL_OPTIO !== void 0 ? _DEFAULT_GLOBAL_OPTIO : {}), (_globalOptions$header = globalOptions === null || globalOptions === void 0 ? void 0 : globalOptions.headers) !== null && _globalOptions$header !== void 0 ? _globalOptions$header : {}) }),
      accessToken: async () => ""
    };
    if (options.accessToken)
      result2.accessToken = options.accessToken;
    else
      delete result2.accessToken;
    return result2;
  }
  function validateSupabaseUrl(supabaseUrl) {
    const trimmedUrl = supabaseUrl === null || supabaseUrl === void 0 ? void 0 : supabaseUrl.trim();
    if (!trimmedUrl)
      throw new Error("supabaseUrl is required.");
    if (!trimmedUrl.match(/^https?:\/\//i))
      throw new Error("Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.");
    try {
      return new URL(ensureTrailingSlash(trimmedUrl));
    } catch (_unused) {
      throw Error("Invalid supabaseUrl: Provided URL is malformed.");
    }
  }
  var SupabaseAuthClient = class extends AuthClient_default {
    constructor(options) {
      super(options);
    }
  };
  var SupabaseClient = class {
    /**
    * Create a new client for use in the browser.
    * @param supabaseUrl The unique Supabase URL which is supplied when you create a new project in your project dashboard.
    * @param supabaseKey The unique Supabase Key which is supplied when you create a new project in your project dashboard.
    * @param options.db.schema You can switch in between schemas. The schema needs to be on the list of exposed schemas inside Supabase.
    * @param options.auth.autoRefreshToken Set to "true" if you want to automatically refresh the token before expiring.
    * @param options.auth.persistSession Set to "true" if you want to automatically save the user session into local storage.
    * @param options.auth.detectSessionInUrl Set to "true" if you want to automatically detects OAuth grants in the URL and signs in the user.
    * @param options.realtime Options passed along to realtime-js constructor.
    * @param options.storage Options passed along to the storage-js constructor.
    * @param options.global.fetch A custom fetch implementation.
    * @param options.global.headers Any additional headers to send with each network request.
    * @example
    * ```ts
    * import { createClient } from '@supabase/supabase-js'
    *
    * const supabase = createClient('https://xyzcompany.supabase.co', 'public-anon-key')
    * const { data } = await supabase.from('profiles').select('*')
    * ```
    */
    constructor(supabaseUrl, supabaseKey, options) {
      var _settings$auth$storag, _settings$global$head;
      this.supabaseUrl = supabaseUrl;
      this.supabaseKey = supabaseKey;
      const baseUrl = validateSupabaseUrl(supabaseUrl);
      if (!supabaseKey)
        throw new Error("supabaseKey is required.");
      this.realtimeUrl = new URL("realtime/v1", baseUrl);
      this.realtimeUrl.protocol = this.realtimeUrl.protocol.replace("http", "ws");
      this.authUrl = new URL("auth/v1", baseUrl);
      this.storageUrl = new URL("storage/v1", baseUrl);
      this.functionsUrl = new URL("functions/v1", baseUrl);
      const defaultStorageKey = `sb-${baseUrl.hostname.split(".")[0]}-auth-token`;
      const DEFAULTS = {
        db: DEFAULT_DB_OPTIONS,
        realtime: DEFAULT_REALTIME_OPTIONS,
        auth: _objectSpread22(_objectSpread22({}, DEFAULT_AUTH_OPTIONS), {}, { storageKey: defaultStorageKey }),
        global: DEFAULT_GLOBAL_OPTIONS
      };
      const settings = applySettingDefaults(options !== null && options !== void 0 ? options : {}, DEFAULTS);
      this.storageKey = (_settings$auth$storag = settings.auth.storageKey) !== null && _settings$auth$storag !== void 0 ? _settings$auth$storag : "";
      this.headers = (_settings$global$head = settings.global.headers) !== null && _settings$global$head !== void 0 ? _settings$global$head : {};
      if (!settings.accessToken) {
        var _settings$auth;
        this.auth = this._initSupabaseAuthClient((_settings$auth = settings.auth) !== null && _settings$auth !== void 0 ? _settings$auth : {}, this.headers, settings.global.fetch);
      } else {
        this.accessToken = settings.accessToken;
        this.auth = new Proxy({}, { get: (_, prop) => {
          throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(prop)} is not possible`);
        } });
      }
      this.fetch = fetchWithAuth(supabaseKey, this._getAccessToken.bind(this), settings.global.fetch);
      this.realtime = this._initRealtimeClient(_objectSpread22({
        headers: this.headers,
        accessToken: this._getAccessToken.bind(this)
      }, settings.realtime));
      if (this.accessToken)
        Promise.resolve(this.accessToken()).then((token) => this.realtime.setAuth(token)).catch((e) => console.warn("Failed to set initial Realtime auth token:", e));
      this.rest = new PostgrestClient(new URL("rest/v1", baseUrl).href, {
        headers: this.headers,
        schema: settings.db.schema,
        fetch: this.fetch
      });
      this.storage = new StorageClient(this.storageUrl.href, this.headers, this.fetch, options === null || options === void 0 ? void 0 : options.storage);
      if (!settings.accessToken)
        this._listenForAuthEvents();
    }
    /**
    * Supabase Functions allows you to deploy and invoke edge functions.
    */
    get functions() {
      return new FunctionsClient(this.functionsUrl.href, {
        headers: this.headers,
        customFetch: this.fetch
      });
    }
    /**
    * Perform a query on a table or a view.
    *
    * @param relation - The table or view name to query
    */
    from(relation) {
      return this.rest.from(relation);
    }
    /**
    * Select a schema to query or perform an function (rpc) call.
    *
    * The schema needs to be on the list of exposed schemas inside Supabase.
    *
    * @param schema - The schema to query
    */
    schema(schema) {
      return this.rest.schema(schema);
    }
    /**
    * Perform a function call.
    *
    * @param fn - The function name to call
    * @param args - The arguments to pass to the function call
    * @param options - Named parameters
    * @param options.head - When set to `true`, `data` will not be returned.
    * Useful if you only need the count.
    * @param options.get - When set to `true`, the function will be called with
    * read-only access mode.
    * @param options.count - Count algorithm to use to count rows returned by the
    * function. Only applicable for [set-returning
    * functions](https://www.postgresql.org/docs/current/functions-srf.html).
    *
    * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
    * hood.
    *
    * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
    * statistics under the hood.
    *
    * `"estimated"`: Uses exact count for low numbers and planned count for high
    * numbers.
    */
    rpc(fn, args = {}, options = {
      head: false,
      get: false,
      count: void 0
    }) {
      return this.rest.rpc(fn, args, options);
    }
    /**
    * Creates a Realtime channel with Broadcast, Presence, and Postgres Changes.
    *
    * @param {string} name - The name of the Realtime channel.
    * @param {Object} opts - The options to pass to the Realtime channel.
    *
    */
    channel(name, opts = { config: {} }) {
      return this.realtime.channel(name, opts);
    }
    /**
    * Returns all Realtime channels.
    */
    getChannels() {
      return this.realtime.getChannels();
    }
    /**
    * Unsubscribes and removes Realtime channel from Realtime client.
    *
    * @param {RealtimeChannel} channel - The name of the Realtime channel.
    *
    */
    removeChannel(channel) {
      return this.realtime.removeChannel(channel);
    }
    /**
    * Unsubscribes and removes all Realtime channels from Realtime client.
    */
    removeAllChannels() {
      return this.realtime.removeAllChannels();
    }
    async _getAccessToken() {
      var _this = this;
      var _data$session$access_, _data$session;
      if (_this.accessToken)
        return await _this.accessToken();
      const { data } = await _this.auth.getSession();
      return (_data$session$access_ = (_data$session = data.session) === null || _data$session === void 0 ? void 0 : _data$session.access_token) !== null && _data$session$access_ !== void 0 ? _data$session$access_ : _this.supabaseKey;
    }
    _initSupabaseAuthClient({ autoRefreshToken, persistSession, detectSessionInUrl, storage, userStorage, storageKey, flowType, lock, debug, throwOnError }, headers, fetch$1) {
      const authHeaders = {
        Authorization: `Bearer ${this.supabaseKey}`,
        apikey: `${this.supabaseKey}`
      };
      return new SupabaseAuthClient({
        url: this.authUrl.href,
        headers: _objectSpread22(_objectSpread22({}, authHeaders), headers),
        storageKey,
        autoRefreshToken,
        persistSession,
        detectSessionInUrl,
        storage,
        userStorage,
        flowType,
        lock,
        debug,
        throwOnError,
        fetch: fetch$1,
        hasCustomAuthorizationHeader: Object.keys(this.headers).some((key) => key.toLowerCase() === "authorization")
      });
    }
    _initRealtimeClient(options) {
      return new RealtimeClient(this.realtimeUrl.href, _objectSpread22(_objectSpread22({}, options), {}, { params: _objectSpread22(_objectSpread22({}, { apikey: this.supabaseKey }), options === null || options === void 0 ? void 0 : options.params) }));
    }
    _listenForAuthEvents() {
      return this.auth.onAuthStateChange((event, session) => {
        this._handleTokenChanged(event, "CLIENT", session === null || session === void 0 ? void 0 : session.access_token);
      });
    }
    _handleTokenChanged(event, source, token) {
      if ((event === "TOKEN_REFRESHED" || event === "SIGNED_IN") && this.changedAccessToken !== token) {
        this.changedAccessToken = token;
        this.realtime.setAuth(token);
      } else if (event === "SIGNED_OUT") {
        this.realtime.setAuth();
        if (source == "STORAGE")
          this.auth.signOut();
        this.changedAccessToken = void 0;
      }
    }
  };
  var createClient = (supabaseUrl, supabaseKey, options) => {
    return new SupabaseClient(supabaseUrl, supabaseKey, options);
  };
  function shouldShowDeprecationWarning() {
    if (typeof window !== "undefined")
      return false;
    const _process = globalThis["process"];
    if (!_process)
      return false;
    const processVersion = _process["version"];
    if (processVersion === void 0 || processVersion === null)
      return false;
    const versionMatch = processVersion.match(/^v(\d+)\./);
    if (!versionMatch)
      return false;
    return parseInt(versionMatch[1], 10) <= 18;
  }
  if (shouldShowDeprecationWarning())
    console.warn("\u26A0\uFE0F  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217");

  // src/background.js
  var browserAPI2 = typeof browser !== "undefined" && browser.runtime ? browser : chrome;
  globalThis.browserAPI = browserAPI2;
  console.log("CarmaClouds background service worker initialized");
  var SUPABASE_URL = "https://luiesmfjdcmpywavvfqm.supabase.co";
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWVzbWZqZGNtcHl3YXZ2ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODYxNDksImV4cCI6MjA4NTQ2MjE0OX0.oqjHFf2HhCLcanh0HVryoQH7iSV7E9dHHZJdYehxZ0U";
  var SB_AUTH_STORAGE_KEY = "cc-sb-auth";
  var chromeStorageAuthAdapter = {
    getItem: (key) => browserAPI2.storage.local.get(key).then((r) => r?.[key] ?? null),
    setItem: (key, value) => browserAPI2.storage.local.set({ [key]: value }),
    removeItem: (key) => browserAPI2.storage.local.remove(key)
  };
  var sbAuthClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: chromeStorageAuthAdapter,
      storageKey: SB_AUTH_STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  });
  async function getSupabaseAuth() {
    try {
      let { data: { session } } = await sbAuthClient.auth.getSession();
      if (!session?.access_token && typeof sbAuthClient.auth.signInAnonymously === "function") {
        const { data, error } = await sbAuthClient.auth.signInAnonymously();
        if (error) {
          console.warn("\u26A0\uFE0F getSupabaseAuth: anonymous sign-in unavailable \u2014", error.message);
          return { token: null, userId: null };
        }
        session = data?.session || null;
      }
      return { token: session?.access_token || null, userId: session?.user?.id || null };
    } catch (err) {
      console.warn("\u26A0\uFE0F getSupabaseAuth failed (using anon fallback):", err);
      return { token: null, userId: null };
    }
  }
  var keepAliveInterval;
  function keepAlive() {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
    }
    keepAliveInterval = setInterval(() => {
      if (browserAPI2.runtime?.id) {
        console.log("\u{1F504} Keep-alive ping");
      } else {
        clearInterval(keepAliveInterval);
      }
    }, 2e4);
  }
  keepAlive();
  browserAPI2.runtime.onMessage.addListener((message, sender, sendResponse) => {
    keepAlive();
    console.log("\u{1F514} Background received message:", message.type || message.action);
    if (message.action === "coyotecloudWriteback") {
      handleCoyotecloudWriteback(message.dicecloudCharacterId, message.values).then(sendResponse).catch((err) => sendResponse({ ok: false, error: String(err && err.message || err) }));
      return true;
    }
    if (message.type === "CC_AUTH_GET") {
      (async () => {
        try {
          await getSupabaseAuth();
          const { data: { session } } = await sbAuthClient.auth.getSession();
          sendResponse({
            access_token: session?.access_token || null,
            refresh_token: session?.refresh_token || null,
            userId: session?.user?.id || null,
            isAnonymous: session?.user?.is_anonymous ?? null
          });
        } catch (e) {
          sendResponse({ access_token: null, error: String(e && e.message || e) });
        }
      })();
      return true;
    }
    if (message.type === "CC_AUTH_SET") {
      (async () => {
        try {
          if (message.access_token && message.refresh_token) {
            const { data, error } = await sbAuthClient.auth.setSession({
              access_token: message.access_token,
              refresh_token: message.refresh_token
            });
            if (error)
              throw error;
            sendResponse({ ok: true, userId: data?.session?.user?.id || null });
          } else {
            await sbAuthClient.auth.signOut();
            sendResponse({ ok: true, userId: null });
          }
        } catch (e) {
          sendResponse({ ok: false, error: String(e && e.message || e) });
        }
      })();
      return true;
    }
    if (message.action === "storeDiceCloudToken") {
      browserAPI2.storage.local.set({ diceCloudToken: message.token }).then(() => sendResponse({ ok: true })).catch((err) => sendResponse({ ok: false, error: String(err && err.message || err) }));
      return true;
    }
    if (message.action === "getCharacterData") {
      console.log("\u{1F4CB} Getting character data for Roll20...");
      handleGetCharacterData(message.characterId).then((result2) => {
        console.log("\u2705 Character data retrieved:", result2);
        sendResponse(result2);
      }).catch((error) => {
        console.error("\u274C Failed to get character data:", error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }
    if (message.action === "getAllCharacterProfiles") {
      console.log("\u{1F4CB} Getting all character profiles...");
      handleGetAllCharacterProfiles(message.supabaseUserId).then((result2) => {
        console.log("\u2705 Character profiles retrieved:", result2);
        sendResponse(result2);
      }).catch((error) => {
        console.error("\u274C Failed to get character profiles:", error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }
    if (message.action === "setActiveCharacter") {
      console.log("\u{1F4CB} Setting active character:", message.characterId);
      handleSetActiveCharacter(message.characterId).then((result2) => {
        console.log("\u2705 Active character set:", result2);
        sendResponse(result2);
      }).catch((error) => {
        console.error("\u274C Failed to set active character:", error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }
    if (message.action === "requestPreparedData") {
      console.log("\u{1F4E4} Character sheet requesting prepared data");
      handleRequestPreparedData().then((result2) => {
        console.log("\u2705 Prepared data request completed:", result2.success ? "success" : "failed");
        sendResponse(result2);
      }).catch((error) => {
        console.error("\u274C Failed to handle prepared data request:", error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }
    if (message.action === "notifyPopupUpdate") {
      console.log("\u{1F514} Notifying popup sheets of character data update");
      browserAPI2.runtime.sendMessage({
        type: "UPDATE_CHARACTER_DATA",
        data: message.data
      }).catch(() => {
        console.log("\u2139\uFE0F No popup open to notify");
      });
      sendResponse({ success: true });
      return false;
    }
    if (message.action === "storeCharacterData") {
      console.log("\u{1F4BE} Storing character data to local storage:", message.data?.name);
      handleStoreCharacterData(message.data, message.slotId).then((result2) => {
        console.log("\u2705 Character data stored successfully");
        sendResponse(result2);
      }).catch((error) => {
        console.error("\u274C Failed to store character data:", error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }
    if (message.action === "relayToRoll20") {
      const roll20Patterns = ["*://app.roll20.net/*"];
      browserAPI2.tabs.query({ url: roll20Patterns }).then((tabs) => {
        if (tabs.length === 0) {
          console.warn("\u26A0\uFE0F No Roll20 tabs found to relay message to");
          sendResponse({ success: false, error: "No Roll20 tabs found" });
          return;
        }
        for (const tab of tabs) {
          browserAPI2.tabs.sendMessage(tab.id, message.data).catch((err) => {
            console.warn(`\u26A0\uFE0F Failed to relay to tab ${tab.id}:`, err);
          });
        }
        console.log(`\u{1F4E8} Relayed ${message.data.action} to ${tabs.length} Roll20 tab(s)`);
        sendResponse({ success: true });
      }).catch((err) => {
        console.error("\u274C Failed to query Roll20 tabs:", err);
        sendResponse({ success: false, error: err.message });
      });
      return true;
    }
    if (message.action === "clearAllCloudData") {
      console.log("\u{1F5D1}\uFE0F Clearing all cloud character data...");
      handleClearAllCloudData().then((result2) => {
        console.log("\u2705 Cloud data cleared successfully");
        sendResponse(result2);
      }).catch((error) => {
        console.error("\u274C Failed to clear cloud data:", error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }
    switch (message.type) {
      case "CHARACTER_UPDATED":
        handleCharacterUpdate(message.data);
        return false;
      case "SYNC_REQUEST":
        handleSyncRequest(message.data);
        return false;
      case "SYNC_CHARACTER_TO_CARMACLOUDS":
        console.log("\u{1F504} Starting SYNC_CHARACTER_TO_CARMACLOUDS handler...");
        handleSyncToCarmaClouds(message.data).then((result2) => {
          console.log("\u2705 Sync completed, sending response:", result2);
          sendResponse(result2);
        }).catch((error) => {
          console.error("\u274C Sync failed:", error);
          sendResponse({ success: false, error: error.message });
        });
        return true;
      default:
        console.warn("Unknown message type:", message.type);
        return false;
    }
  });
  async function handleGetCharacterData(requestedCharacterId) {
    try {
      const result2 = await browserAPI2.storage.local.get(["carmaclouds_characters", "activeCharacterId"]);
      const characters = result2.carmaclouds_characters || [];
      const activeCharacterId = requestedCharacterId || result2.activeCharacterId;
      let activeCharacter = null;
      if (activeCharacterId) {
        if (activeCharacterId.startsWith("slot-")) {
          const slotIndex = parseInt(activeCharacterId.replace("slot-", "")) - 1;
          if (slotIndex >= 0 && slotIndex < characters.length) {
            activeCharacter = characters[slotIndex];
          }
        } else {
          activeCharacter = characters.find((char) => char.id === activeCharacterId);
        }
      }
      if (!activeCharacter && characters.length > 0) {
        activeCharacter = characters[0];
      }
      if (activeCharacter) {
        let characterData = activeCharacter.rollcloud || activeCharacter;
        if (activeCharacter.rollcloud && !characterData.id) {
          characterData = {
            ...characterData,
            id: activeCharacter.id
          };
        }
        console.log("\u{1F4E4} Returning character data:", activeCharacter.name);
        console.log("   Using rollcloud format:", !!activeCharacter.rollcloud);
        console.log("   Character data keys:", Object.keys(characterData).slice(0, 25));
        console.log("   Has hitPoints:", !!characterData.hitPoints, "=", characterData.hitPoints);
        console.log("   Has name:", !!characterData.name, "=", characterData.name);
        console.log("   Has id:", !!characterData.id, "=", characterData.id);
        console.log("   Has spells:", Array.isArray(characterData.spells), characterData.spells?.length);
        console.log("   Has actions:", Array.isArray(characterData.actions), characterData.actions?.length);
        return {
          success: true,
          data: characterData
        };
      } else {
        console.log("\u274C No character data found in storage");
        console.log("   Characters array length:", characters.length);
        console.log("   Active character ID:", activeCharacterId);
        return {
          success: false,
          error: "No character data found"
        };
      }
    } catch (error) {
      console.error("Error getting character data:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async function handleStoreCharacterData(characterData, slotId) {
    try {
      console.log("\u{1F4BE} Storing character to slot:", slotId || "default");
      const result2 = await browserAPI2.storage.local.get("carmaclouds_characters");
      const characters = result2.carmaclouds_characters || [];
      const characterId = characterData.id || characterData.dicecloud_character_id || slotId;
      if (!characterId) {
        throw new Error("Character data missing ID and no slotId provided");
      }
      const existingIndex = characters.findIndex((char) => char.id === characterId);
      if (existingIndex >= 0) {
        console.log("\u2705 Updating existing character:", characterData.name);
        console.log("   Has hitPoints:", !!characterData.hitPoints);
        console.log("   Has spells:", Array.isArray(characterData.spells));
        console.log("   Has actions:", Array.isArray(characterData.actions));
        const existingCharacter = characters[existingIndex];
        characters[existingIndex] = {
          ...characterData,
          id: characterId,
          // Ensure ID is always set
          raw: existingCharacter.raw || characterData.raw,
          // Keep raw if it exists
          preview: existingCharacter.preview || characterData.preview
          // Keep preview if it exists
        };
        console.log("   Preserved raw data:", !!characters[existingIndex].raw);
      } else {
        console.log("\u2705 Adding new character:", characterData.name);
        characters.push({
          ...characterData,
          id: characterId
          // Ensure ID is always set
        });
      }
      await browserAPI2.storage.local.set({ carmaclouds_characters: characters });
      console.log("\u2705 Character data stored successfully to carmaclouds_characters");
      console.log("   Total characters in array:", characters.length);
      return { success: true };
    } catch (error) {
      console.error("\u274C Error storing character data:", error);
      return { success: false, error: error.message };
    }
  }
  async function handleGetAllCharacterProfiles(supabaseUserId) {
    try {
      const result2 = await browserAPI2.storage.local.get("carmaclouds_characters");
      let characters = result2.carmaclouds_characters || [];
      console.log("\u{1F50D} getAllCharacterProfiles - Total characters in storage:", characters.length);
      if (supabaseUserId) {
        console.log("\u{1F50D} Fetching characters from Supabase for user:", supabaseUserId);
        try {
          const dbResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/clouds_characters?select=*&supabase_user_id=eq.${supabaseUserId}`,
            {
              headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Content-Type": "application/json"
              }
            }
          );
          if (dbResponse.ok) {
            const dbCharacters = await dbResponse.json();
            console.log("   Found", dbCharacters.length, "characters from Supabase");
            dbCharacters.forEach((dbChar) => {
              const existingIndex = characters.findIndex((c) => c.id === dbChar.dicecloud_character_id);
              let rawData = dbChar.raw_dicecloud_data || {};
              if (typeof rawData === "string") {
                try {
                  rawData = JSON.parse(rawData);
                } catch (e) {
                  console.warn("   Failed to parse raw_dicecloud_data for:", dbChar.character_name);
                  rawData = {};
                }
              }
              const characterEntry = {
                id: dbChar.dicecloud_character_id,
                name: dbChar.character_name || "Unknown",
                level: dbChar.level || "?",
                class: dbChar.class || "No Class",
                race: dbChar.race || "Unknown",
                raw: rawData,
                lastSynced: dbChar.updated_at || (/* @__PURE__ */ new Date()).toISOString(),
                rollcloud: null,
                // Parsed on-demand when RollCloud tab is used
                owlcloud: null,
                // Parsed on-demand when OwlCloud tab is used
                foundcloud: null
                // Parsed on-demand when FoundCloud tab is used
              };
              if (existingIndex >= 0) {
                characters[existingIndex] = characterEntry;
              } else {
                characters.push(characterEntry);
              }
            });
            console.log("   Merged: now have", characters.length, "total characters");
            await browserAPI2.storage.local.set({ carmaclouds_characters: characters });
            console.log("   \u2705 Saved merged characters to local storage");
          }
        } catch (dbError) {
          console.error("   \u274C Error fetching from Supabase:", dbError);
        }
      }
      characters.forEach((char, index) => {
        console.log(`   Character ${index}:`, {
          id: char.id,
          name: char.name,
          class: char.class || char.preview?.class,
          level: char.level || char.preview?.level,
          race: char.race || char.preview?.race,
          hasRaw: !!char.raw
        });
      });
      const profiles = {};
      characters.forEach((char, index) => {
        if (char.id) {
          const profileKey = `slot-${index + 1}`;
          profiles[profileKey] = {
            id: char.id,
            name: char.name || "Unknown",
            character_name: char.name || "Unknown",
            class: char.class || char.preview?.class || "Unknown",
            level: char.level || char.preview?.level || 1,
            race: char.race || char.preview?.race || "Unknown",
            raw: char.raw,
            // Include raw data for parsing
            preview: char.preview
            // Pass through preview for adapters
          };
          console.log(`   \u2705 Created ${profileKey}:`, profiles[profileKey].name);
        } else {
          console.log(`   \u26A0\uFE0F Skipped character at index ${index} - no ID`);
        }
      });
      console.log("\u{1F4CB} Returning profiles:", Object.keys(profiles));
      return {
        success: true,
        profiles
      };
    } catch (error) {
      console.error("Error getting character profiles:", error);
      return {
        success: false,
        error: error.message,
        profiles: {}
      };
    }
  }
  async function handleSetActiveCharacter(characterId) {
    try {
      const result2 = await browserAPI2.storage.local.get("carmaclouds_characters");
      const characters = result2.carmaclouds_characters || [];
      const character = characters.find((char) => char.id === characterId);
      if (!character) {
        return {
          success: false,
          error: "Character not found"
        };
      }
      await browserAPI2.storage.local.set({ activeCharacterId: characterId });
      return {
        success: true,
        characterId
      };
    } catch (error) {
      console.error("Error setting active character:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async function handleRequestPreparedData() {
    try {
      const tabs = await browserAPI2.tabs.query({ url: "*://app.roll20.net/*" });
      if (tabs.length === 0) {
        return {
          success: false,
          error: "No Roll20 tab found. Please open Roll20 first."
        };
      }
      const response = await browserAPI2.tabs.sendMessage(tabs[0].id, {
        type: "REQUEST_PREPARED_DATA"
      });
      if (response && response.success) {
        return {
          success: true,
          data: response.data,
          timestamp: response.timestamp,
          age: response.age
        };
      } else {
        return {
          success: false,
          error: response?.error || 'No prepared character data available. Please use "Push to Roll20" first.'
        };
      }
    } catch (error) {
      console.error("Error requesting prepared data:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async function handleCharacterUpdate(data) {
    console.log("Character updated:", data);
  }
  async function handleSyncRequest(data) {
    console.log("Sync requested:", data);
  }
  async function handleSyncToCarmaClouds(characterData) {
    try {
      console.log("\u{1F4BE} Step 1: Starting sync for character:", characterData.name);
      const storageKey = `carmaclouds_character_${characterData.name || "unknown"}`;
      console.log("\u{1F4BE} Step 2: Saving individual character with key:", storageKey);
      await browserAPI2.storage.local.set({
        [storageKey]: {
          ...characterData,
          syncedAt: (/* @__PURE__ */ new Date()).toISOString(),
          platforms: ["dicecloud"]
          // Mark as available from DiceCloud
        }
      });
      console.log("\u2705 Step 2: Individual character saved");
      console.log("\u{1F4BE} Step 3: Getting characters list...");
      const result2 = await browserAPI2.storage.local.get("carmaclouds_characters");
      const characters = result2.carmaclouds_characters || [];
      console.log("\u2705 Step 3: Found", characters.length, "existing characters");
      console.log("\u{1F4BE} Step 4: Updating characters list...");
      const existingIndex = characters.findIndex((c) => c.id === characterData.id);
      if (existingIndex >= 0) {
        console.log("\u{1F4DD} Updating existing character at index", existingIndex);
        characters[existingIndex] = {
          ...characters[existingIndex],
          ...characterData,
          syncedAt: (/* @__PURE__ */ new Date()).toISOString(),
          platforms: [...characters[existingIndex].platforms || [], "dicecloud"]
        };
      } else {
        console.log("\u2795 Adding new character to list");
        characters.push({
          ...characterData,
          syncedAt: (/* @__PURE__ */ new Date()).toISOString(),
          platforms: ["dicecloud"]
        });
      }
      console.log("\u{1F4BE} Step 5: Saving updated characters list...");
      await browserAPI2.storage.local.set({ carmaclouds_characters: characters });
      console.log("\u2705 Step 5: Characters list saved");
      if (characterData.id) {
        console.log("\u{1F4BE} Step 6: Setting as active character:", characterData.id);
        await browserAPI2.storage.local.set({ activeCharacterId: characterData.id });
        console.log("\u2705 Step 6: Active character ID set");
      }
      console.log("\u{1F389} Character successfully synced to CarmaClouds storage");
      const { token: sbToken, userId: sbUserId } = await getSupabaseAuth();
      const sbAuthHeader = `Bearer ${sbToken || SUPABASE_ANON_KEY}`;
      try {
        console.log("\u{1F4BE} Step 7: Syncing to Supabase database...");
        const authResult = await browserAPI2.storage.local.get(["diceCloudUserId", "username"]);
        let parsed = null, owlParsed = null;
        try {
          parsed = parseForFoundCloud(characterData.raw, characterData.id);
        } catch (e) {
          console.warn("\u26A0\uFE0F parseForFoundCloud failed (non-fatal):", e);
        }
        try {
          owlParsed = parseForOwlCloud(characterData.raw, characterData.id);
        } catch (e) {
          console.warn("\u26A0\uFE0F parseForOwlCloud failed (non-fatal):", e);
        }
        const payload = {
          user_id_dicecloud: authResult.diceCloudUserId || null,
          dicecloud_character_id: characterData.id,
          character_name: characterData.name || "Unknown",
          level: parsed?.level ?? null,
          race: parsed?.race ?? null,
          class: parsed?.class ?? null,
          raw_dicecloud_data: characterData.raw || characterData,
          // DiceCloud API structure { creature, variables, properties }
          foundcloud_parsed_data: parsed || {},
          owlcloud_parsed_data: owlParsed || {},
          platform: ["dicecloud", "foundcloud", "rollcloud", "owlcloud", "coyotecloud"],
          supabase_user_id: sbUserId,
          // Owner = authenticated user (null falls back to legacy)
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        console.log("\u{1F4E4} Sending character to Supabase:", payload.character_name);
        const checkResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/clouds_characters?dicecloud_character_id=eq.${characterData.id}`,
          {
            method: "GET",
            headers: {
              "apikey": SUPABASE_ANON_KEY,
              "Authorization": sbAuthHeader
            }
          }
        );
        let response;
        if (checkResponse.ok) {
          const existing = await checkResponse.json();
          if (existing && existing.length > 0) {
            console.log("\u{1F4DD} Updating existing character in Supabase...");
            response = await fetch(
              `${SUPABASE_URL}/rest/v1/clouds_characters?dicecloud_character_id=eq.${characterData.id}`,
              {
                method: "PATCH",
                headers: {
                  "apikey": SUPABASE_ANON_KEY,
                  "Authorization": sbAuthHeader,
                  "Content-Type": "application/json",
                  "Prefer": "return=representation"
                },
                body: JSON.stringify(payload)
              }
            );
          } else {
            console.log("\u2795 Inserting new character to Supabase...");
            response = await fetch(
              `${SUPABASE_URL}/rest/v1/clouds_characters`,
              {
                method: "POST",
                headers: {
                  "apikey": SUPABASE_ANON_KEY,
                  "Authorization": sbAuthHeader,
                  "Content-Type": "application/json",
                  "Prefer": "return=representation"
                },
                body: JSON.stringify(payload)
              }
            );
          }
          if (response.ok) {
            const result3 = await response.json();
            console.log("\u2705 Step 7: Character synced to Supabase:", result3);
          } else {
            const errorText = await response.text();
            console.error("\u274C Supabase sync failed:", response.status, errorText);
          }
        } else {
          console.error("\u274C Failed to check if character exists:", checkResponse.status);
        }
      } catch (supabaseError) {
        console.error("\u274C Failed to sync to Supabase (non-fatal):", supabaseError);
      }
      try {
        const ir = await upsertCharacterIR(characterData.raw || characterData, {
          url: SUPABASE_URL,
          anonKey: SUPABASE_ANON_KEY,
          authToken: sbToken || void 0,
          ownerId: sbUserId || void 0
        });
        console.log(`\u2705 Step 7b: IR synced to clouds_character_ir (${ir.systemHint})`);
      } catch (irError) {
        console.warn("\u26A0\uFE0F IR sync failed (non-fatal):", irError);
      }
      try {
        const tabs = await browserAPI2.tabs.query({ active: true, currentWindow: true });
        if (tabs.length > 0) {
          await browserAPI2.tabs.sendMessage(tabs[0].id, {
            action: "dataSynced",
            characterName: characterData.name
          });
          console.log("\u{1F4E4} Sent dataSynced message to popup");
        }
      } catch (tabError) {
        console.log("\u26A0\uFE0F Could not send sync notification to popup:", tabError);
      }
      return {
        success: true,
        message: "Character synced successfully",
        characterCount: characters.length
      };
    } catch (error) {
      console.error("\u274C Error syncing character to CarmaClouds:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async function handleClearAllCloudData() {
    try {
      const result2 = await browserAPI2.storage.local.get(["diceCloudUserId"]);
      const userId = result2.diceCloudUserId;
      if (!userId) {
        throw new Error("No DiceCloud user ID found. Please log in first.");
      }
      console.log("\u{1F5D1}\uFE0F Deleting all characters for user:", userId);
      const { token: delToken } = await getSupabaseAuth();
      const response = await fetch(`${SUPABASE_URL}/rest/v1/clouds_characters?user_id_dicecloud=eq.${userId}`, {
        method: "DELETE",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${delToken || SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete cloud data: ${response.status} - ${errorText}`);
      }
      const deletedChars = await response.json();
      const count = Array.isArray(deletedChars) ? deletedChars.length : 0;
      console.log(`\u2705 Deleted ${count} characters from cloud`);
      return {
        success: true,
        message: `Deleted ${count} character(s) from cloud storage.`
      };
    } catch (error) {
      console.error("\u274C Error clearing cloud data:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      handleGetCharacterData,
      handleStoreCharacterData,
      handleClearAllCloudData
    };
  }
  browserAPI2.runtime.onInstalled.addListener((details) => {
    console.log("CarmaClouds extension installed/updated:", details.reason);
    if (details.reason === "install") {
      console.log("CarmaClouds: First time installation");
    } else if (details.reason === "update") {
      console.log("CarmaClouds: Extension updated");
    }
  });
  async function handleCoyotecloudWriteback(characterId, values) {
    if (!characterId)
      return { ok: false, error: "Missing DiceCloud character id." };
    const { diceCloudToken } = await browserAPI2.storage.local.get(["diceCloudToken"]);
    if (!diceCloudToken)
      return { ok: false, error: "no-token" };
    const v = values || {};
    const applied = [];
    const failed = [];
    const ddp = new meteor_ddp_client_default("wss://dicecloud.com/websocket");
    const tryApply = async (label, fn) => {
      try {
        await fn();
        applied.push(label);
      } catch (e) {
        failed.push(label);
        console.error("[Writeback] failed:", label, e);
      }
    };
    try {
      await ddp.connect();
      await ddp.loginWithToken(diceCloudToken);
      const sync = new dicecloud_sync_default(ddp);
      await sync.initialize(characterId);
      if (typeof v.hitPoints === "number") {
        await tryApply("Hit Points", () => sync.updateAttributeValue("Hit Points", v.hitPoints));
      }
      if (typeof v.temporaryHitPoints === "number") {
        await tryApply("Temp HP", () => sync.updateTemporaryHP(v.temporaryHitPoints));
      }
      if (typeof v.deathSuccesses === "number" || typeof v.deathFailures === "number") {
        await tryApply("Death Saves", () => sync.updateDeathSaves(v.deathSuccesses ?? 0, v.deathFailures ?? 0));
      }
      if (typeof v.inspiration === "boolean") {
        await tryApply("Inspiration", () => sync.updateInspiration(v.inspiration ? 1 : 0));
      }
      if (v.spellSlots && typeof v.spellSlots === "object") {
        for (const [lvl, remaining] of Object.entries(v.spellSlots)) {
          await tryApply(`Spell slots L${lvl}`, () => sync.updateSpellSlot(Number(lvl), remaining));
        }
      }
      return { ok: failed.length === 0, applied, failed };
    } finally {
      try {
        ddp.disconnect();
      } catch (_) {
      }
    }
  }
})();
//# sourceMappingURL=background.js.map
