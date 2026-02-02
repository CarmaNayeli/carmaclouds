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

  // src/popup/adapters/foundcloud/adapter.js
  var adapter_exports = {};
  __export(adapter_exports, {
    init: () => init
  });
  async function init(containerEl) {
    console.log("FoundCloud adapter - not yet implemented");
    containerEl.innerHTML = `
    <div style="padding: 40px 20px; text-align: center; color: #b0b0b0;">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#16a75a" stroke-width="2" style="margin-bottom: 20px; opacity: 0.5;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
      <h2 style="color: #e0e0e0; margin-bottom: 12px;">FoundCloud - Coming Soon</h2>
      <p style="margin-bottom: 20px; font-size: 14px; line-height: 1.6;">
        Foundry VTT integration is currently under development.
      </p>
      <p style="font-size: 13px; opacity: 0.7;">
        For now, use RollCloud or OwlCloud to sync your characters.
      </p>
    </div>
  `;
  }
  var init_adapter = __esm({
    "src/popup/adapters/foundcloud/adapter.js"() {
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
      const result = await browserAPI.storage.local.get(["carmaclouds_characters", "diceCloudUserId"]) || {};
      const characters = result.carmaclouds_characters || [];
      const diceCloudUserId = result.diceCloudUserId;
      console.log("Found", characters.length, "synced characters");
      console.log("DiceCloud User ID:", diceCloudUserId);
      const character = characters.length > 0 ? characters[0] : null;
      const htmlPath = browserAPI.runtime.getURL("src/popup/adapters/owlcloud/popup.html");
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
      const cssPath = browserAPI.runtime.getURL("src/popup/adapters/owlcloud/popup.css");
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
      if (character && character.raw) {
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
                pushBtn.innerHTML = "\u23F3 Syncing...";
                if (!diceCloudUserId) {
                  throw new Error("DiceCloud User ID not found. Please log in to DiceCloud first.");
                }
                console.log("\u{1F4BE} Storing raw character data to database...");
                const SUPABASE_URL = "https://luiesmfjdcmpywavvfqm.supabase.co";
                const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWVzbWZqZGNtcHl3YXZ2ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODYxNDksImV4cCI6MjA4NTQ2MjE0OX0.oqjHFf2HhCLcanh0HVryoQH7iSV7E9dHHZJdYehxZ0U";
                try {
                  console.log("\u{1F4DD} Deactivating other characters...");
                  const deactivateResponse = await fetch(
                    `${SUPABASE_URL}/rest/v1/clouds_characters?user_id_dicecloud=eq.${diceCloudUserId}`,
                    {
                      method: "PATCH",
                      headers: {
                        "apikey": SUPABASE_ANON_KEY,
                        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                        "Content-Type": "application/json"
                      },
                      body: JSON.stringify({
                        is_active: false
                      })
                    }
                  );
                  if (!deactivateResponse.ok) {
                    console.warn("\u26A0\uFE0F Failed to deactivate other characters, continuing anyway...");
                  }
                  const updateResponse = await fetch(
                    `${SUPABASE_URL}/rest/v1/clouds_characters?on_conflict=user_id_dicecloud,dicecloud_character_id`,
                    {
                      method: "POST",
                      headers: {
                        "apikey": SUPABASE_ANON_KEY,
                        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                        "Content-Type": "application/json",
                        "Prefer": "resolution=merge-duplicates,return=representation"
                      },
                      body: JSON.stringify({
                        dicecloud_character_id: character.id,
                        character_name: character.name || "Unknown",
                        user_id_dicecloud: diceCloudUserId,
                        level: character.preview?.level || null,
                        class: character.preview?.class || null,
                        race: character.preview?.race || null,
                        raw_dicecloud_data: character.raw,
                        is_active: true,
                        updated_at: (/* @__PURE__ */ new Date()).toISOString()
                      })
                    }
                  );
                  if (updateResponse.ok) {
                    console.log("\u2705 Raw character data stored in database");
                  } else {
                    const errorText = await updateResponse.text();
                    console.warn("\u26A0\uFE0F Failed to store character data:", errorText);
                    throw new Error(`Database sync failed: ${errorText}`);
                  }
                } catch (dbError) {
                  console.error("\u26A0\uFE0F Database update failed:", dbError);
                  throw dbError;
                }
                pushBtn.innerHTML = "\u2705 Synced!";
                if (statusSection) {
                  const statusIcon = statusSection.querySelector("#statusIcon");
                  const statusText = statusSection.querySelector("#statusText");
                  if (statusIcon)
                    statusIcon.textContent = "\u2705";
                  if (statusText) {
                    statusText.innerHTML = `
                    <div style="margin-bottom: 12px; color: #fff;">Character synced to database!</div>
                    <div style="padding: 0; font-family: monospace;">
                      <div style="margin-bottom: 8px; font-size: 12px; color: rgba(255, 255, 255, 0.7);">Your DiceCloud User ID:</div>
                      <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="text" value="${diceCloudUserId}" readonly style="flex: 1; padding: 8px; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 4px; font-family: monospace; font-size: 14px; background: transparent; color: #fff; cursor: text;" onclick="this.select()">
                        <button id="copyUserIdBtn" style="padding: 8px 16px; background: #16a75a; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; white-space: nowrap;">Copy</button>
                      </div>
                      <div style="margin-top: 8px; font-size: 11px; color: rgba(255, 255, 255, 0.6);">Paste this into the Owlbear extension to link your character.</div>
                    </div>
                  `;
                    const copyBtn2 = statusSection.querySelector("#copyUserIdBtn");
                    if (copyBtn2) {
                      copyBtn2.addEventListener("click", async () => {
                        try {
                          await navigator.clipboard.writeText(diceCloudUserId);
                          copyBtn2.textContent = "\u2713 Copied!";
                          setTimeout(() => {
                            copyBtn2.textContent = "Copy";
                          }, 2e3);
                        } catch (err) {
                          console.error("Failed to copy:", err);
                        }
                      });
                    }
                  }
                }
                setTimeout(() => {
                  pushBtn.innerHTML = originalText;
                  pushBtn.disabled = false;
                }, 3e3);
              } catch (error) {
                console.error("Error syncing to database:", error);
                pushBtn.innerHTML = "\u274C Failed";
                alert(`Failed to sync to database: ${error.message}`);
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
            statusIcon.textContent = "\u{1F4CB}";
          if (statusText)
            statusText.textContent = `Ready to sync: ${character.name}`;
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
      browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "dataSynced") {
          console.log("\u{1F4E5} OwlCloud adapter received data sync notification:", message.characterName);
          init2(containerEl);
        }
      });
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
  var browserAPI;
  var init_adapter2 = __esm({
    "src/popup/adapters/owlcloud/adapter.js"() {
      browserAPI = typeof browser !== "undefined" && browser.runtime ? browser : chrome;
    }
  });

  // src/content/dicecloud-extraction.js
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

  // src/popup/adapters/rollcloud/adapter.js
  var adapter_exports3 = {};
  __export(adapter_exports3, {
    init: () => init3
  });
  async function init3(containerEl) {
    console.log("Initializing RollCloud adapter...");
    try {
      containerEl.innerHTML = '<div class="loading">Loading RollCloud...</div>';
      const result = await browserAPI2.storage.local.get("carmaclouds_characters") || {};
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
      const htmlPath = browserAPI2.runtime.getURL("src/popup/adapters/rollcloud/popup.html");
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
      const cssPath = browserAPI2.runtime.getURL("src/popup/adapters/rollcloud/popup.css");
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
                  await browserAPI2.runtime.sendMessage({
                    action: "storeCharacterData",
                    data: dataToStore,
                    slotId: character.slotId || "slot-1"
                  });
                  console.log("\u2705 Local storage updated with parsed Roll20 data");
                  browserAPI2.runtime.sendMessage({
                    action: "dataSynced",
                    characterName: dataToStore.name || "Character"
                  }).catch(() => {
                    console.log("\u2139\uFE0F No popup open to notify (normal)");
                  });
                } catch (storageError) {
                  console.warn("\u26A0\uFE0F Local storage update failed (non-fatal):", storageError);
                }
                const tabs = await browserAPI2.tabs.query({ url: "*://app.roll20.net/*" });
                if (tabs.length === 0) {
                  throw new Error("No Roll20 tab found. Please open Roll20 first.");
                }
                await browserAPI2.tabs.sendMessage(tabs[0].id, {
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
      browserAPI2.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "dataSynced") {
          console.log("\u{1F4E5} RollCloud adapter received data sync notification:", message.characterName);
          init3(containerEl);
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
  var browserAPI2;
  var init_adapter3 = __esm({
    "src/popup/adapters/rollcloud/adapter.js"() {
      init_dicecloud_extraction();
      browserAPI2 = typeof browser !== "undefined" && browser.runtime ? browser : chrome;
    }
  });

  // import("./adapters/**/*/adapter.js") in src/popup/popup.js
  var globImport_adapters_adapter_js = __glob({
    "./adapters/foundcloud/adapter.js": () => Promise.resolve().then(() => (init_adapter(), adapter_exports)),
    "./adapters/owlcloud/adapter.js": () => Promise.resolve().then(() => (init_adapter2(), adapter_exports2)),
    "./adapters/rollcloud/adapter.js": () => Promise.resolve().then(() => (init_adapter3(), adapter_exports3))
  });

  // src/popup/popup.js
  var browserAPI3 = typeof browser !== "undefined" && browser.runtime ? browser : chrome;
  var loadedAdapters = {
    rollcloud: null,
    owlcloud: null,
    foundcloud: null
  };
  async function getSettings() {
    const result = await browserAPI3.storage.local.get("carmaclouds_settings") || {};
    return result.carmaclouds_settings || {
      lastActiveTab: "rollcloud",
      enabledVTTs: ["rollcloud", "owlcloud", "foundcloud"]
    };
  }
  async function saveSettings(settings) {
    await browserAPI3.storage.local.set({ carmaclouds_settings: settings });
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
    const result = await browserAPI3.storage.local.get("dicecloud_auth_token");
    return result?.dicecloud_auth_token || null;
  }
  async function saveAuthToken(token, userId = null, username = null) {
    console.log("\u{1F4BE} Saving auth token with userId:", userId || "not provided", "username:", username || "not provided");
    const storageData = { dicecloud_auth_token: token };
    if (userId) {
      storageData.diceCloudUserId = userId;
    }
    if (username) {
      storageData.username = username;
    }
    await browserAPI3.storage.local.set(storageData);
    await updateAuthStatus();
    await updateAuthView();
    try {
      if (typeof SupabaseTokenManager !== "undefined") {
        const supabaseManager = new SupabaseTokenManager();
        const result = await browserAPI3.storage.local.get(["username", "diceCloudUserId"]);
        console.log("\u{1F4E4} Syncing to database with data:", {
          hasToken: !!token,
          userId: userId || result.diceCloudUserId || "none",
          username: username || result.username || "none"
        });
        const dbResult = await supabaseManager.storeToken({
          token,
          userId: userId || result.diceCloudUserId,
          tokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString(),
          // 24 hours from now
          username: username || result.username || "DiceCloud User"
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
    await browserAPI3.storage.local.remove("dicecloud_auth_token");
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
      const tabs = await browserAPI3.tabs.query({ url: "*://*.dicecloud.com/*" });
      if (!tabs || tabs.length === 0) {
        errorDiv.innerHTML = '<div style="background: #0d4a30; color: #16a75a; padding: 12px; border-radius: 6px; border: 1px solid #16a75a;"><strong>Navigate to DiceCloud First</strong><br>Open <a href="https://dicecloud.com" target="_blank" style="color: #1bc76b; text-decoration: underline;">dicecloud.com</a> in a tab, log in, then click this button to connect.</div>';
        errorDiv.classList.remove("hidden");
        btn.disabled = false;
        btn.textContent = "\u{1F510} Connect with DiceCloud";
        return;
      }
      try {
        let results;
        if (typeof chrome !== "undefined" && browserAPI3.scripting) {
          results = await browserAPI3.scripting.executeScript({
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
              const meteorUserId = localStorage.getItem("Meteor.userId");
              const meteorLoginToken = localStorage.getItem("Meteor.loginToken");
              if (meteorUserId || meteorLoginToken) {
                authData2.meteor = {
                  userId: meteorUserId,
                  loginToken: meteorLoginToken
                };
                if (window.Meteor && window.Meteor.user) {
                  try {
                    const user = window.Meteor.user();
                    if (user) {
                      authData2.meteor.username = user.username || user.emails?.[0]?.address || user.profile?.username || user.profile?.name || null;
                    }
                  } catch (e) {
                  }
                }
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
            (() => {
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
              // Meteor stores auth data in localStorage with specific keys
              const meteorUserId = localStorage.getItem('Meteor.userId');
              const meteorLoginToken = localStorage.getItem('Meteor.loginToken');

              if (meteorUserId || meteorLoginToken) {
                authData.meteor = {
                  userId: meteorUserId,
                  loginToken: meteorLoginToken
                };

                // TODO: Fix username extraction - currently still returns 'DiceCloud User' as fallback
                // Need to investigate why Meteor.user() doesn't return username properly
                // May need to check localStorage for serialized user data or use different approach
                // Try to get username from Meteor.user() if available
                if (window.Meteor && window.Meteor.user) {
                  try {
                    const user = window.Meteor.user();
                    if (user) {
                      authData.meteor.username = user.username ||
                                                 user.emails?.[0]?.address ||
                                                 user.profile?.username ||
                                                 user.profile?.name ||
                                                 null;
                    }
                  } catch (e) {
                    // Meteor.user() might not be available, that's okay
                  }
                }
              }

              // Check for any global auth variables
              if (window.authToken) authData.authToken = window.authToken;
              if (window.token) authData.authToken = window.token;

              return authData;
            })();
          `
          });
        } else {
          throw new Error("No scripting API available");
        }
        const authData = typeof chrome !== "undefined" && browserAPI3.scripting ? results[0]?.result : results[0];
        console.log("Auth data from DiceCloud page:", authData);
        let token = null;
        let userId = null;
        let username = null;
        if (authData?.meteor?.loginToken) {
          token = authData.meteor.loginToken;
          userId = authData.meteor.userId;
          username = authData.meteor.username;
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
        console.log("\u{1F511} Extracted from DiceCloud:", {
          hasToken: !!token,
          userId: userId || "not found",
          username: username || "not found"
        });
        if (token) {
          await saveAuthToken(token, userId, username);
          errorDiv.classList.add("hidden");
          closeAuthModal();
          return;
        }
      } catch (scriptError) {
        console.warn("Could not inject script:", scriptError);
      }
      const cookies = await browserAPI3.cookies.getAll({ domain: ".dicecloud.com" });
      console.log("Available DiceCloud cookies:", cookies.map((c) => ({ name: c.name, domain: c.domain, value: c.value ? "***" : "empty" })));
      const authCookie = cookies.find(
        (c) => c.name === "dicecloud_auth" || c.name === "meteor_login_token" || c.name === "authToken" || c.name === "loginToken" || c.name === "userId" || c.name === "token" || c.name === "x_mtok" || // Meteor token cookie used by DiceCloud
        c.name.includes("auth") || c.name.includes("token")
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
      const result = await browserAPI3.storage.local.get(["diceCloudToken", "dicecloud_auth_token", "username", "tokenExpires", "diceCloudUserId", "authId"]);
      console.log("\u{1F50D} Storage contents:", {
        diceCloudToken: result.diceCloudToken ? "***found***" : "NOT FOUND",
        dicecloud_auth_token: result.dicecloud_auth_token ? "***found***" : "NOT FOUND",
        username: result.username,
        diceCloudUserId: result.diceCloudUserId
      });
      const token = result.diceCloudToken || result.dicecloud_auth_token;
      if (!token) {
        console.log("\u26A0\uFE0F No auth token found, skipping auth token check");
        return;
      }
      console.log("\u{1F50D} Checking auth token validity...");
      console.log("\u{1F511} Using token:", token ? "***found***" : "NOT FOUND");
      try {
        const syncResult = await supabaseManager.storeToken({
          token,
          userId: result.diceCloudUserId || result.username,
          tokenExpires: result.tokenExpires || new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString(),
          username: result.username || "DiceCloud User"
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
          await browserAPI3.storage.local.set({
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
      browserAPI3.tabs.create({ url: "https://carmaclouds.vercel.app" });
    });
    document.getElementById("open-github").addEventListener("click", (e) => {
      e.preventDefault();
      browserAPI3.tabs.create({ url: "https://github.com/CarmaNayeli/carmaclouds" });
    });
    document.getElementById("open-issues").addEventListener("click", (e) => {
      e.preventDefault();
      browserAPI3.tabs.create({ url: "https://github.com/CarmaNayeli/carmaclouds/issues" });
    });
    document.getElementById("open-sponsor").addEventListener("click", (e) => {
      e.preventDefault();
      browserAPI3.tabs.create({ url: "https://github.com/sponsors/CarmaNayeli/" });
    });
    const syncBtn = document.getElementById("syncToCarmaCloudsBtn");
    if (syncBtn) {
      syncBtn.addEventListener("click", handleSyncToCarmaClouds);
    }
    await switchTab(lastTab);
  }
  async function handleSyncToCarmaClouds() {
    const btn = document.getElementById("syncToCarmaCloudsBtn");
    const statusDiv = document.getElementById("syncStatus");
    if (!btn || !statusDiv)
      return;
    const originalText = btn.innerHTML;
    try {
      btn.disabled = true;
      btn.innerHTML = "\u23F3 Syncing...";
      statusDiv.textContent = "Fetching character data from DiceCloud...";
      statusDiv.style.color = "#b0b0b0";
      const response = await browserAPI3.runtime.sendMessage({ action: "getCharacterData" });
      if (!response || !response.success || !response.data) {
        throw new Error("No character data available. Please sync from DiceCloud first.");
      }
      const characterData = response.data;
      console.log("\u{1F4E6} Character data received:", characterData);
      statusDiv.textContent = "Storing character locally...";
      const existingData = await browserAPI3.storage.local.get("carmaclouds_characters");
      const characters = existingData.carmaclouds_characters || [];
      const existingIndex = characters.findIndex((c) => c.id === characterData.id);
      if (existingIndex >= 0) {
        characters[existingIndex] = characterData;
      } else {
        characters.unshift(characterData);
      }
      await browserAPI3.storage.local.set({ carmaclouds_characters: characters });
      console.log("\u2705 Character stored in local storage");
      statusDiv.textContent = "Syncing to database...";
      if (typeof SupabaseTokenManager !== "undefined") {
        const supabaseManager = new SupabaseTokenManager();
        const authResult = await browserAPI3.storage.local.get(["diceCloudUserId", "username"]);
        const dbResult = await supabaseManager.storeCharacter({
          ...characterData,
          user_id_dicecloud: authResult.diceCloudUserId,
          username: authResult.username
        });
        if (dbResult.success) {
          console.log("\u2705 Character synced to database");
          statusDiv.textContent = "\u2705 Character synced successfully!";
          statusDiv.style.color = "#16a75a";
          btn.innerHTML = "\u2705 Synced!";
          const activeTab = document.querySelector(".tab-button.active");
          if (activeTab) {
            await switchTab(activeTab.dataset.tab);
          }
        } else {
          throw new Error(dbResult.error || "Failed to store character");
        }
      } else {
        throw new Error("SupabaseTokenManager not available");
      }
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 2e3);
    } catch (error) {
      console.error("\u274C Sync error:", error);
      statusDiv.textContent = `\u274C Error: ${error.message}`;
      statusDiv.style.color = "#ff6b6b";
      btn.innerHTML = "\u274C Failed";
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 3e3);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init4);
  } else {
    init4();
  }
})();
//# sourceMappingURL=popup.js.map
