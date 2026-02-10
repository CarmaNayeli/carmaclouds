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
  function parseForRollCloud(rawData) {
    if (!rawData || !rawData.creature || !rawData.variables || !rawData.properties) {
      throw new Error("Invalid raw data format");
    }
    const { creature, variables, properties } = rawData;
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
    const extractText = (field) => {
      if (!field)
        return "";
      if (typeof field === "string")
        return field;
      if (typeof field === "object" && field.text)
        return field.text;
      return "";
    };
    const spells = properties.filter((p) => p.type === "spell" && !p.inactive && !p.disabled).map((spell) => {
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
      const damageRolls = [];
      spellChildren.filter((c) => c.type === "damage" || c.type === "roll" && c.name && (c.name.toLowerCase().includes("damage") || c.name.toLowerCase().includes("heal"))).forEach((damageChild) => {
        let formula = "";
        if (damageChild.amount) {
          if (typeof damageChild.amount === "string") {
            formula = damageChild.amount;
          } else if (typeof damageChild.amount === "object") {
            formula = damageChild.amount.calculation || String(damageChild.amount.value || "");
          }
        } else if (damageChild.roll) {
          if (typeof damageChild.roll === "string") {
            formula = damageChild.roll;
          } else if (typeof damageChild.roll === "object") {
            formula = damageChild.roll.calculation || String(damageChild.roll.value || "");
          }
        } else if (damageChild.damage) {
          if (typeof damageChild.damage === "string") {
            formula = damageChild.damage;
          } else if (typeof damageChild.damage === "object") {
            formula = damageChild.damage.calculation || String(damageChild.damage.value || "");
          }
        }
        if (formula) {
          damageRolls.push({
            formula,
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
    const actions = properties.filter((p) => p.type === "action" && p.name && !p.inactive && !p.disabled).map((action) => {
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
    for (let level2 = 1; level2 <= 9; level2++) {
      const slotVar = variables[`slotLevel${level2}`];
      if (slotVar) {
        const current = slotVar.value || 0;
        const max = slotVar.total || slotVar.max || slotVar.value || 0;
        spellSlots[`level${level2}`] = {
          current,
          max
        };
      }
    }
    const resources = properties.filter((p) => p.type === "resource" || p.type === "attribute" && p.attributeType === "resource").map((resource) => ({
      id: resource._id,
      name: resource.name || "Unnamed Resource",
      current: resource.value || resource.currentValue || 0,
      max: resource.total || resource.max || 0,
      reset: resource.reset || "",
      variableName: resource.variableName || resource.varName || ""
    }));
    const inventory = properties.filter((p) => (p.type === "item" || p.type === "equipment" || p.type === "container") && !p.inactive).map((item) => ({
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
        current: variables.hitPoints?.currentValue ?? variables.hitPoints?.value ?? 0,
        max: variables.hitPoints?.total ?? variables.hitPoints?.max ?? 0
      },
      temporaryHP: variables.temporaryHitPoints?.value ?? variables.temporaryHitPoints?.currentValue ?? 0,
      armorClass: calculateAC(),
      speed: variables.speed?.total || variables.speed?.value || 30,
      initiative: variables.initiative?.total || variables.initiative?.value || 0,
      proficiencyBonus: variables.proficiencyBonus?.total || variables.proficiencyBonus?.value || 0,
      spellSlots,
      resources,
      inventory,
      spells,
      actions,
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
  function extractVariable(variables, varName) {
    if (!variables || !variables[varName])
      return null;
    const varData = variables[varName];
    return varData.value !== void 0 ? varData.value : varData;
  }
})();
//# sourceMappingURL=dicecloud-extraction.js.map
