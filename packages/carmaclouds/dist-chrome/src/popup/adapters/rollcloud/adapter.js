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
    const extractText = (field) => {
      if (!field)
        return "";
      if (typeof field === "string")
        return field;
      if (typeof field === "object" && field.text)
        return field.text;
      return "";
    };
    const spells = properties.filter((p) => p.type === "spell").map((spell) => {
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
        damageRolls
      };
    });
    const actions = properties.filter((p) => p.type === "action" && p.name && !p.inactive && !p.disabled).map((action) => {
      let attackRoll = "";
      if (action.attackRoll) {
        attackRoll = typeof action.attackRoll === "string" ? action.attackRoll : String(action.attackRoll.value || action.attackRoll.calculation || "");
      }
      let damage = "";
      let damageType = "";
      if (action.damage) {
        damage = typeof action.damage === "string" ? action.damage : String(action.damage.value || action.damage.calculation || "");
      }
      if (action.damageType) {
        damageType = action.damageType;
      }
      return {
        id: action._id,
        name: action.name,
        actionType: action.actionType || "action",
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
        spellSlots[`level${level2}SpellSlots`] = current;
        spellSlots[`level${level2}SpellSlotsMax`] = max;
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
      actions
    };
  }

  // src/popup/adapters/rollcloud/raw-data-parser.js
  function parseRawCharacterData(rawData, characterId) {
    if (!rawData || !rawData.creature || !rawData.variables || !rawData.properties) {
      throw new Error("Invalid raw data format: missing creature, variables, or properties");
    }
    const { creature, variables, properties } = rawData;
    const name = creature.name || "Unknown Character";
    let race = "Unknown";
    let characterClass = "";
    let level = 0;
    const uniqueClasses = /* @__PURE__ */ new Set();
    let raceFound = false;
    for (const prop of properties) {
      if (!prop)
        continue;
      if (!raceFound && prop.type === "folder" && prop.name) {
        const commonRaces = ["half-elf", "half-orc", "dragonborn", "tiefling", "aarakocra", "lizardfolk", "warforged", "changeling", "kalashtar", "goliath", "firbolg", "genasi", "yuan-ti", "bugbear", "hobgoblin", "halfling", "tortle", "kobold", "tabaxi", "goblin", "kenku", "human", "dwarf", "gnome", "triton", "elf", "orc", "shifter"];
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
        if (cleanName) {
          uniqueClasses.add(cleanName);
          level += prop.level || 1;
        }
      }
    }
    characterClass = Array.from(uniqueClasses).join(" / ") || "No Class";
    const getVar = (name2) => {
      const varName = name2.toLowerCase();
      return variables[varName] !== void 0 ? variables[varName] : 0;
    };
    const abilities = {
      strength: getVar("strength"),
      dexterity: getVar("dexterity"),
      constitution: getVar("constitution"),
      intelligence: getVar("intelligence"),
      wisdom: getVar("wisdom"),
      charisma: getVar("charisma")
    };
    const abilityMods = {
      strengthMod: getVar("strengthMod"),
      dexterityMod: getVar("dexterityMod"),
      constitutionMod: getVar("constitutionMod"),
      intelligenceMod: getVar("intelligenceMod"),
      wisdomMod: getVar("wisdomMod"),
      charismaMod: getVar("charismaMod")
    };
    const hitPoints = {
      current: getVar("hitPoints"),
      max: getVar("hitPoints"),
      temp: 0
    };
    const armorClass = getVar("armorClass") || 10;
    const proficiencyBonus = getVar("proficiencyBonus") || Math.floor((level - 1) / 4) + 2;
    const initiative = getVar("initiative") || abilityMods.dexterityMod;
    const speed = getVar("speed") || 30;
    const hitDiceUsed = getVar("hitDiceUsed") || 0;
    const hitDice = {
      current: Math.max(0, level - hitDiceUsed),
      max: level,
      die: "d10"
      // Default, should be extracted from class
    };
    const saves = {
      strength: getVar("strengthSave"),
      dexterity: getVar("dexteritySave"),
      constitution: getVar("constitutionSave"),
      intelligence: getVar("intelligenceSave"),
      wisdom: getVar("wisdomSave"),
      charisma: getVar("charismaSave")
    };
    const skills = {
      acrobatics: getVar("acrobatics"),
      animalHandling: getVar("animalHandling"),
      arcana: getVar("arcana"),
      athletics: getVar("athletics"),
      deception: getVar("deception"),
      history: getVar("history"),
      insight: getVar("insight"),
      intimidation: getVar("intimidation"),
      investigation: getVar("investigation"),
      medicine: getVar("medicine"),
      nature: getVar("nature"),
      perception: getVar("perception"),
      performance: getVar("performance"),
      persuasion: getVar("persuasion"),
      religion: getVar("religion"),
      sleightOfHand: getVar("sleightOfHand"),
      stealth: getVar("stealth"),
      survival: getVar("survival")
    };
    const actions = [];
    const spells = [];
    const features = [];
    const resources = [];
    for (const prop of properties) {
      if (!prop || prop.inactive || prop.disabled)
        continue;
      if (prop.type === "action" && prop.name) {
        actions.push({
          name: prop.name,
          description: prop.description || "",
          actionType: prop.actionType || "action",
          attackBonus: prop.attackBonus,
          damage: prop.damage,
          uses: prop.uses
        });
      }
      if (prop.type === "spell" && prop.name) {
        spells.push({
          name: prop.name,
          level: prop.level || 0,
          school: prop.school || "",
          castingTime: prop.castingTime || "",
          range: prop.range || "",
          duration: prop.duration || "",
          description: prop.description || "",
          prepared: prop.prepared !== false
        });
      }
      if (prop.type === "feature" && prop.name) {
        features.push({
          name: prop.name,
          description: prop.description || "",
          uses: prop.uses
        });
      }
      if (prop.type === "resource" && prop.name) {
        resources.push({
          name: prop.name,
          value: prop.value || 0,
          max: prop.max || 0,
          reset: prop.reset || "longRest"
        });
      }
    }
    const spellSlots = {};
    for (let i = 1; i <= 9; i++) {
      const maxSlots = getVar(`level${i}SpellSlots`) || 0;
      const usedSlots = getVar(`level${i}SpellSlotsUsed`) || 0;
      if (maxSlots > 0) {
        spellSlots[i] = {
          max: maxSlots,
          used: usedSlots,
          available: maxSlots - usedSlots
        };
      }
    }
    return {
      id: characterId,
      name,
      character_name: name,
      class: characterClass,
      level,
      race,
      // Combat stats
      hitPoints: hitPoints.current,
      hit_points: hitPoints.current,
      maxHitPoints: hitPoints.max,
      temporaryHP: hitPoints.temp,
      temporary_hp: hitPoints.temp,
      armorClass,
      armor_class: armorClass,
      initiative,
      speed,
      proficiencyBonus,
      proficiency_bonus: proficiencyBonus,
      // Hit dice
      hitDice: `${hitDice.current}/${hitDice.max} ${hitDice.die}`,
      hit_dice: hitDice,
      // Death saves
      deathSaves: {
        successes: 0,
        failures: 0
      },
      death_saves: {
        successes: 0,
        failures: 0
      },
      // Abilities
      abilities,
      attributeMods: abilityMods,
      attribute_mods: abilityMods,
      // Saves and skills
      saves,
      skills,
      // Actions, spells, features
      actions,
      spells,
      features,
      resources,
      // Spell slots
      spellSlots,
      spell_slots: spellSlots,
      // Keep raw data for reference
      raw: rawData,
      // Metadata
      lastSynced: (/* @__PURE__ */ new Date()).toISOString(),
      source: "rollcloud"
    };
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
                raw: rawData,
                lastSynced: dbChar.updated_at || (/* @__PURE__ */ new Date()).toISOString()
              };
              if (existingIndex >= 0) {
                characters[existingIndex] = characterEntry;
              } else {
                characters.push(characterEntry);
              }
            });
            console.log("Merged characters list now has", characters.length, "total characters");
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
      if (syncBox)
        syncBox.classList.remove("hidden");
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
      const fullCharacterData = parseRawCharacterData(rawData, activeCharacterId);
      const parsedChar = parseCharacterData(charData, activeCharacterId);
      await browserAPI.runtime.sendMessage({
        action: "storeCharacterData",
        data: fullCharacterData,
        slotId: `slot-${allCharacters.length + 1}`
      });
      const characterEntry = {
        id: activeCharacterId,
        name: parsedChar.name || "Unknown",
        level: parsedChar.preview?.level || parsedChar.level || "?",
        class: parsedChar.preview?.class || parsedChar.class || "No Class",
        race: parsedChar.preview?.race || parsedChar.race || "Unknown",
        raw: rawData,
        lastSynced: (/* @__PURE__ */ new Date()).toISOString()
      };
      const existingIndex = allCharacters.findIndex((c) => c.id === activeCharacterId);
      if (existingIndex >= 0) {
        allCharacters[existingIndex] = characterEntry;
      } else {
        allCharacters.push(characterEntry);
      }
      pushBtn.textContent = "\u2713 Synced!";
      pushBtn.style.background = "linear-gradient(135deg, #28a745 0%, #1e7e34 100%)";
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
