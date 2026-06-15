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

  // ../core/src/ir/normalize.ts
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
  function normalizeAction(p) {
    const kind = p.type === "spell" ? "spell" : p.type === "feature" ? "feature" : "action";
    const action = {
      id: p._id,
      name: p.name ?? "",
      kind,
      active: activeOf(p),
      consumes: consumesOf(p),
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
    const creature = raw?.creatures?.[0] ?? raw?.creature ?? {};
    const allProps = raw?.creatureProperties ?? raw?.properties ?? [];
    const props = allProps.filter((p) => !isRemoved(p));
    const attributes = props.filter((p) => p.type === "attribute").map(normalizeAttribute);
    const skills = props.filter((p) => p.type === "skill").map(normalizeSkill);
    const actions = props.filter(isActionLike).map(normalizeAction);
    const inventory = props.filter((p) => p.type === "item").map(normalizeItem);
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
      byVar
    };
  }

  // ../core/src/ir/persistence.ts
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

  // ../core/src/ir/sync.ts
  async function upsertCharacterIR(raw, target) {
    const ir = normalize(raw);
    if (!ir.id)
      throw new Error("upsertCharacterIR: normalized IR has no character id");
    const res = await fetch(
      `${target.url}/rest/v1/clouds_character_ir?on_conflict=dicecloud_character_id`,
      {
        method: "POST",
        headers: {
          apikey: target.anonKey,
          Authorization: `Bearer ${target.anonKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal"
        },
        body: JSON.stringify(toIRRow(ir))
      }
    );
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

  // src/background.js
  var browserAPI2 = typeof browser !== "undefined" && browser.runtime ? browser : chrome;
  globalThis.browserAPI = browserAPI2;
  console.log("CarmaClouds background service worker initialized");
  var SUPABASE_URL = "https://luiesmfjdcmpywavvfqm.supabase.co";
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWVzbWZqZGNtcHl3YXZ2ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODYxNDksImV4cCI6MjA4NTQ2MjE0OX0.oqjHFf2HhCLcanh0HVryoQH7iSV7E9dHHZJdYehxZ0U";
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
          supabase_user_id: null,
          // Auth-based sync happens through FoundCloud tab
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        console.log("\u{1F4E4} Sending character to Supabase:", payload.character_name);
        const checkResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/clouds_characters?dicecloud_character_id=eq.${characterData.id}`,
          {
            method: "GET",
            headers: {
              "apikey": SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
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
                  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
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
                  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
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
          anonKey: SUPABASE_ANON_KEY
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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/clouds_characters?user_id_dicecloud=eq.${userId}`, {
        method: "DELETE",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
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
