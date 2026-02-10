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

  // src/popup/adapters/rollcloud/adapter.js
  var browserAPI = typeof browser !== "undefined" && browser.runtime ? browser : chrome;
  async function init(containerEl) {
    console.log("Initializing RollCloud adapter...");
    try {
      containerEl.innerHTML = '<div class="loading">Loading RollCloud...</div>';
      const result = await browserAPI.storage.local.get("carmaclouds_characters") || {};
      let characters = result.carmaclouds_characters || [];
      console.log("Found", characters.length, "synced characters from local storage");
      let needsUpdate = false;
      characters = characters.map((char) => {
        if (char.raw && !char.rollcloud && (char.hitPoints || char.spells || char.actions)) {
          console.log("\u{1F504} Migrating old format character:", char.name);
          needsUpdate = true;
          let rollcloudData = null;
          try {
            rollcloudData = parseForRollCloud(char.raw, char.id);
            console.log("   \u2705 Parsed rollcloud format:", rollcloudData.spells?.length, "spells,", rollcloudData.actions?.length, "actions");
          } catch (err) {
            console.warn("   \u274C Failed to parse:", err);
          }
          return {
            id: char.id,
            name: char.name,
            level: char.level,
            class: char.class,
            race: char.race,
            lastSynced: char.lastSynced,
            raw: char.raw,
            rollcloud: rollcloudData,
            owlcloud: null,
            foundcloud: null
          };
        }
        return char;
      });
      if (needsUpdate) {
        await browserAPI.storage.local.set({ carmaclouds_characters: characters });
        console.log("\u2705 Migrated characters saved to storage");
      }
      const supabase = window.supabaseClient;
      let supabaseUserId = null;
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          supabaseUserId = session?.user?.id;
        } catch (err) {
          console.warn("Failed to get Supabase session:", err);
        }
      }
      if (supabaseUserId) {
        console.log("User authenticated to Supabase, fetching characters from database...");
        containerEl.innerHTML = '<div class="loading">Fetching characters from database...</div>';
        try {
          const SUPABASE_URL = "https://luiesmfjdcmpywavvfqm.supabase.co";
          const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWVzbWZqZGNtcHl3YXZ2ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODYxNDksImV4cCI6MjA4NTQ2MjE0OX0.oqjHFf2HhCLcanh0HVryoQH7iSV7E9dHHZJdYehxZ0U";
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
            console.log("Found", dbCharacters.length, "characters from Supabase");
            if (dbCharacters.length > 0) {
              containerEl.innerHTML = `<div class="loading">Parsing ${dbCharacters.length} character${dbCharacters.length > 1 ? "s" : ""}...</div>`;
            }
            dbCharacters.forEach((dbChar) => {
              const existingIndex = characters.findIndex((c) => c.id === dbChar.dicecloud_character_id);
              let rawData = dbChar.raw_dicecloud_data || {};
              if (typeof rawData === "string") {
                try {
                  rawData = JSON.parse(rawData);
                } catch (e) {
                  console.warn("Failed to parse raw_dicecloud_data for character:", dbChar.character_name, e);
                  rawData = {};
                }
              }
              console.log("Character from DB:", dbChar.character_name);
              console.log("Raw data structure:", {
                hasCreature: !!rawData.creature,
                hasVariables: !!rawData.variables,
                hasProperties: !!rawData.properties,
                keys: Object.keys(rawData),
                sample: rawData
              });
              const characterEntry = {
                id: dbChar.dicecloud_character_id,
                name: dbChar.character_name || "Unknown",
                level: dbChar.level || "?",
                class: dbChar.class || "No Class",
                race: dbChar.race || "Unknown",
                lastSynced: dbChar.updated_at || (/* @__PURE__ */ new Date()).toISOString(),
                raw: rawData,
                rollcloud: null,
                owlcloud: null,
                foundcloud: null
              };
              if (rawData.creature && rawData.variables && rawData.properties) {
                try {
                  characterEntry.rollcloud = parseForRollCloud(rawData, dbChar.dicecloud_character_id);
                  console.log("\u2705 Parsed RollCloud format for:", characterEntry.name);
                  console.log("   Spells:", characterEntry.rollcloud.spells?.length || 0);
                  console.log("   Actions:", characterEntry.rollcloud.actions?.length || 0);
                } catch (parseError) {
                  console.warn("Failed to parse RollCloud format for:", dbChar.character_name, parseError);
                }
              }
              if (existingIndex >= 0) {
                characters[existingIndex] = characterEntry;
              } else {
                characters.push(characterEntry);
              }
            });
            console.log("Merged characters list now has", characters.length, "total characters");
            await browserAPI.storage.local.set({ carmaclouds_characters: characters });
            console.log("\u2705 Saved merged characters to local storage");
          }
        } catch (dbError) {
          console.warn("Failed to fetch from Supabase (non-fatal):", dbError);
        }
      }
      console.log("Final character count:", characters.length);
      const character = characters.length > 0 ? characters[0] : null;
      let parsedData = null;
      if (character && character.raw) {
        containerEl.innerHTML = '<div class="loading">Parsing character data...</div>';
        console.log("Parsing character for Roll20:", character.name);
        console.log("Raw data structure before parsing:", {
          hasCreature: !!character.raw.creature,
          hasVariables: !!character.raw.variables,
          hasProperties: !!character.raw.properties,
          keys: Object.keys(character.raw),
          rawSample: character.raw
        });
        parsedData = parseForRollCloud(character.raw);
        console.log("Parsed data:", parsedData);
      }
      const htmlPath = browserAPI.runtime.getURL("src/popup/adapters/rollcloud/popup.html");
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
      const cssPath = browserAPI.runtime.getURL("src/popup/adapters/rollcloud/popup.css");
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
      await initializeRollCloudUI(wrapper, characters);
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
                console.log("\u{1F4BE} Storing Roll20 parsed data to database...");
                const SUPABASE_URL = "https://luiesmfjdcmpywavvfqm.supabase.co";
                const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWVzbWZqZGNtcHl3YXZ2ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODYxNDksImV4cCI6MjA4NTQ2MjE0OX0.oqjHFf2HhCLcanh0HVryoQH7iSV7E9dHHZJdYehxZ0U";
                try {
                  const updateResponse = await fetch(
                    `${SUPABASE_URL}/rest/v1/clouds_characters?dicecloud_character_id=eq.${character.id}`,
                    {
                      method: "PATCH",
                      headers: {
                        "apikey": SUPABASE_ANON_KEY,
                        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                        "Content-Type": "application/json",
                        "Prefer": "return=representation"
                      },
                      body: JSON.stringify({
                        roll20_data: parsedData,
                        updated_at: (/* @__PURE__ */ new Date()).toISOString()
                      })
                    }
                  );
                  if (updateResponse.ok) {
                    console.log("\u2705 Roll20 data stored in database");
                  } else {
                    console.warn("\u26A0\uFE0F Failed to store Roll20 data:", await updateResponse.text());
                  }
                } catch (dbError) {
                  console.warn("\u26A0\uFE0F Database update failed (non-fatal):", dbError);
                }
                console.log("\u{1F4BE} Updating local storage with parsed data...");
                try {
                  const dataToStore = {
                    ...parsedData,
                    id: character.id,
                    dicecloud_character_id: character.id
                  };
                  await browserAPI.runtime.sendMessage({
                    action: "storeCharacterData",
                    data: dataToStore,
                    slotId: character.slotId || "slot-1"
                  });
                  console.log("\u2705 Local storage updated with parsed Roll20 data");
                  browserAPI.runtime.sendMessage({
                    action: "dataSynced",
                    characterName: dataToStore.name || "Character"
                  }).catch(() => {
                    console.log("\u2139\uFE0F No popup open to notify (normal)");
                  });
                } catch (storageError) {
                  console.warn("\u26A0\uFE0F Local storage update failed (non-fatal):", storageError);
                }
                const tabs = await browserAPI.tabs.query({ url: "*://app.roll20.net/*" });
                if (tabs.length === 0) {
                  throw new Error("No Roll20 tab found. Please open Roll20 first.");
                }
                await browserAPI.tabs.sendMessage(tabs[0].id, {
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
      browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "dataSynced") {
          console.log("\u{1F4E5} RollCloud adapter received data sync notification:", message.characterName);
          init(containerEl);
        }
      });
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
  async function initializeRollCloudUI(wrapper, characters) {
    try {
      const loginPrompt = wrapper.querySelector("#loginPrompt");
      const syncBox = wrapper.querySelector("#syncBox");
      const pushedCharactersSection = wrapper.querySelector("#pushedCharactersSection");
      const pushToRoll20Btn = wrapper.querySelector("#pushToRoll20Btn");
      const openAuthModalBtn = wrapper.querySelector("#openAuthModalBtn");
      const result = await browserAPI.storage.local.get(["diceCloudToken", "dicecloud_auth_token", "activeCharacterId"]);
      const hasDiceCloudToken = !!(result.diceCloudToken || result.dicecloud_auth_token);
      const token = result.diceCloudToken || result.dicecloud_auth_token;
      console.log("RollCloud auth check:", { hasDiceCloudToken, hasActiveChar: !!result.activeCharacterId });
      if (!hasDiceCloudToken) {
        if (loginPrompt)
          loginPrompt.classList.remove("hidden");
        if (syncBox)
          syncBox.classList.add("hidden");
        if (pushedCharactersSection)
          pushedCharactersSection.classList.add("hidden");
        if (openAuthModalBtn) {
          openAuthModalBtn.addEventListener("click", () => {
            browserAPI.tabs.create({ url: "https://dicecloud.com" });
          });
        }
        return;
      }
      if (loginPrompt)
        loginPrompt.classList.add("hidden");
      if (characters.length > 0) {
        if (syncBox)
          syncBox.classList.remove("hidden");
      } else {
        if (syncBox)
          syncBox.classList.add("hidden");
      }
      if (pushedCharactersSection)
        pushedCharactersSection.classList.remove("hidden");
      if (result.activeCharacterId && characters.length > 0) {
        const activeChar = characters.find((c) => c.id === result.activeCharacterId) || characters[0];
        const syncCharName = wrapper.querySelector("#syncCharName");
        const syncCharLevel = wrapper.querySelector("#syncCharLevel");
        const syncCharClass = wrapper.querySelector("#syncCharClass");
        const syncCharRace = wrapper.querySelector("#syncCharRace");
        let displayName = activeChar.name || "Unknown";
        let displayLevel = "?";
        let displayClass = "No Class";
        let displayRace = "Unknown";
        if (activeChar.raw) {
          try {
            const fakeApiResponse = {
              creatures: [activeChar.raw.creature || {}],
              creatureVariables: [activeChar.raw.variables || {}],
              creatureProperties: activeChar.raw.properties || []
            };
            const parsed = parseCharacterData(fakeApiResponse, activeChar.id);
            displayName = parsed.name || displayName;
            displayLevel = parsed.preview?.level || parsed.level || displayLevel;
            displayClass = parsed.preview?.class || parsed.class || displayClass;
            displayRace = parsed.preview?.race || parsed.race || displayRace;
          } catch (parseError) {
            console.warn("Failed to re-parse character for sync box:", parseError);
            displayLevel = activeChar.level || displayLevel;
            displayClass = activeChar.class || displayClass;
            displayRace = activeChar.race || displayRace;
          }
        } else {
          displayLevel = activeChar.level || displayLevel;
          displayClass = activeChar.class || displayClass;
          displayRace = activeChar.race || displayRace;
        }
        if (syncCharName)
          syncCharName.textContent = displayName;
        if (syncCharLevel)
          syncCharLevel.textContent = `Lvl ${displayLevel}`;
        if (syncCharClass)
          syncCharClass.textContent = displayClass;
        if (syncCharRace)
          syncCharRace.textContent = displayRace;
      }
      if (pushToRoll20Btn) {
        pushToRoll20Btn.addEventListener("click", () => handlePushToRoll20(token, result.activeCharacterId, wrapper, characters));
      }
      displaySyncedCharacters(wrapper, characters);
    } catch (error) {
      console.error("Error initializing RollCloud UI:", error);
    }
  }
  async function handlePushToRoll20(token, activeCharacterId, wrapper, allCharacters) {
    const pushBtn = wrapper.querySelector("#pushToRoll20Btn");
    if (!pushBtn)
      return;
    const originalText = pushBtn.textContent;
    try {
      pushBtn.disabled = true;
      pushBtn.textContent = "\u23F3 Syncing...";
      if (!activeCharacterId) {
        throw new Error("No active character selected");
      }
      const response = await fetch(`https://dicecloud.com/api/creature/${activeCharacterId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok)
        throw new Error(`Failed to fetch character: ${response.status}`);
      const charData = await response.json();
      const rawData = {
        creature: charData.creatures?.[0] || {},
        variables: charData.creatureVariables?.[0] || {},
        properties: charData.creatureProperties || []
      };
      const parsedChar = parseCharacterData(charData, activeCharacterId);
      const characterEntry = {
        id: activeCharacterId,
        name: parsedChar.name || "Unknown",
        level: parsedChar.preview?.level || parsedChar.level || "?",
        class: parsedChar.preview?.class || parsedChar.class || "No Class",
        race: parsedChar.preview?.race || parsedChar.race || "Unknown",
        lastSynced: (/* @__PURE__ */ new Date()).toISOString(),
        raw: rawData,
        rollcloud: parseForRollCloud(rawData, activeCharacterId),
        owlcloud: null,
        // Can be parsed later by OwlCloud adapter
        foundcloud: null
        // Can be parsed later by FoundCloud adapter
      };
      await browserAPI.runtime.sendMessage({
        action: "storeCharacterData",
        data: characterEntry,
        slotId: `slot-${allCharacters.length + 1}`
      });
      const existingIndex = allCharacters.findIndex((c) => c.id === activeCharacterId);
      if (existingIndex >= 0) {
        allCharacters[existingIndex] = characterEntry;
      } else {
        allCharacters.push(characterEntry);
      }
      pushBtn.textContent = "\u2713 Synced!";
      pushBtn.style.background = "linear-gradient(135deg, #28a745 0%, #1e7e34 100%)";
      await browserAPI.storage.local.remove("activeCharacterId");
      const syncBox = wrapper.querySelector("#syncBox");
      if (syncBox)
        syncBox.classList.add("hidden");
      displaySyncedCharacters(wrapper, allCharacters);
      setTimeout(() => {
        pushBtn.textContent = originalText;
        pushBtn.style.background = "";
        pushBtn.disabled = false;
      }, 2e3);
    } catch (error) {
      console.error("Sync current error:", error);
      pushBtn.textContent = "\u274C Failed";
      alert(`Sync failed: ${error.message}`);
      setTimeout(() => {
        pushBtn.textContent = originalText;
        pushBtn.disabled = false;
      }, 2e3);
    }
  }
  function displaySyncedCharacters(wrapper, characters) {
    const pushedCharactersList = wrapper.querySelector("#pushedCharactersList");
    const noPushedCharacters = wrapper.querySelector("#noPushedCharacters");
    if (!pushedCharactersList || !noPushedCharacters)
      return;
    if (characters.length === 0) {
      pushedCharactersList.innerHTML = "";
      noPushedCharacters.classList.remove("hidden");
      return;
    }
    noPushedCharacters.classList.add("hidden");
    pushedCharactersList.innerHTML = "";
    characters.forEach((char) => {
      const card = document.createElement("div");
      card.style.cssText = "position: relative; padding: 16px; background: #1a1a1a; border-radius: 8px; border: 1px solid #2a2a2a;";
      const name = char.name || "Unknown";
      const level = char.level || "?";
      const charClass = char.class || "No Class";
      const race = char.race || "Unknown";
      card.innerHTML = `
      <button class="delete-char-btn" data-char-id="${char.id}" style="position: absolute; top: 8px; right: 8px; background: #dc3545; border: 1px solid #c82333; color: white; border-radius: 4px; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; line-height: 1;">\xD7</button>
      <h4 style="color: #16a75a; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${name}</h4>
      <div style="display: flex; gap: 8px; font-size: 13px; color: #b0b0b0;">
        <span>Lvl ${level}</span>
        <span>\u2022</span>
        <span>${charClass}</span>
        <span>\u2022</span>
        <span>${race}</span>
      </div>
    `;
      const deleteBtn = card.querySelector(".delete-char-btn");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (confirm(`Delete ${name}?`)) {
            const updatedChars = characters.filter((c) => c.id !== char.id);
            await browserAPI.storage.local.set({ carmaclouds_characters: updatedChars });
            displaySyncedCharacters(wrapper, updatedChars);
          }
        });
      }
      pushedCharactersList.appendChild(card);
    });
  }
})();
//# sourceMappingURL=adapter.js.map
