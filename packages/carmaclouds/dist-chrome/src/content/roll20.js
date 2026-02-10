(() => {
  // src/content/roll20.js
  (function() {
    "use strict";
    const browserAPI = typeof browser !== "undefined" && browser.runtime ? browser : chrome;
    const debug = {
      log: (...args) => console.log("[RollCloud]", ...args),
      warn: (...args) => console.warn("[RollCloud]", ...args),
      error: (...args) => console.error("[RollCloud]", ...args)
    };
    debug.log("RollCloud: Roll20 content script loaded");
    function processTriggers(triggers) {
      if (!triggers || !Array.isArray(triggers) || triggers.length === 0) {
        return { expandedCritRange: null, spellDamageBonuses: [] };
      }
      const result = {
        expandedCritRange: null,
        spellDamageBonuses: []
      };
      debug.log(`\u26A1 Processing ${triggers.length} triggers...`);
      triggers.forEach((trigger) => {
        const triggerName = (trigger.name || "").toLowerCase();
        const desc = (trigger.description || "").toLowerCase();
        const summary = (trigger.summary || "").toLowerCase();
        if (triggerName.includes("critical") || triggerName.includes("crit")) {
          const fullText = `${triggerName} ${desc} ${summary}`;
          const critPatterns = [
            /\b(1[89])[- ]?(?:or[- ])?20\b/,
            /\b(1[89])[- ]?to[- ]?20\b/,
            /critical.*?on.*?(?:a|an)\s+(1[89]|20)/,
            /improved critical/i,
            /superior critical/i
          ];
          for (const pattern of critPatterns) {
            const match = fullText.match(pattern);
            if (match) {
              let minCrit = match[1] ? parseInt(match[1]) : null;
              if (!minCrit) {
                if (fullText.includes("superior critical")) {
                  minCrit = 18;
                } else if (fullText.includes("improved critical")) {
                  minCrit = 19;
                }
              }
              if (minCrit && (!result.expandedCritRange || minCrit < result.expandedCritRange)) {
                result.expandedCritRange = minCrit;
                debug.log(`\u26A1 Detected expanded crit range: ${minCrit}-20 from "${trigger.name}"`);
              }
              break;
            }
          }
        }
        if (triggerName.includes("damage") || triggerName.includes("bonus") || triggerName.includes("firearm")) {
          const fullText = `${desc} ${summary}`;
          const dicePattern = /(\d+d\d+)/;
          const match = fullText.match(dicePattern);
          if (match) {
            result.spellDamageBonuses.push({
              name: trigger.name,
              formula: match[1],
              description: trigger.description
            });
            debug.log(`\u26A1 Detected spell damage bonus: ${match[1]} from "${trigger.name}"`);
          }
        }
      });
      debug.log("\u26A1 Trigger processing complete:", result);
      return result;
    }
    function postChatMessage(message) {
      try {
        const chatInput = document.querySelector("#textchat-input textarea");
        if (!chatInput) {
          debug.error("\u274C Could not find Roll20 chat input textarea (#textchat-input textarea)");
          return false;
        }
        debug.log("\u{1F4DD} Setting chat input value:", message.substring(0, 80) + (message.length > 80 ? "..." : ""));
        chatInput.focus();
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          "value"
        ).set;
        nativeInputValueSetter.call(chatInput, message);
        try {
          if (typeof cloneInto === "function") {
            const eventInit = cloneInto({ bubbles: true, cancelable: true }, window);
            chatInput.dispatchEvent(new window.wrappedJSObject.Event("input", eventInit));
            chatInput.dispatchEvent(new window.wrappedJSObject.Event("change", eventInit));
          } else {
            chatInput.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
            chatInput.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
          }
        } catch (eventError) {
          debug.warn("\u26A0\uFE0F Event dispatch encountered an error (non-fatal):", eventError.message);
        }
        const sendButton = document.querySelector("#textchat-input .btn");
        if (!sendButton) {
          debug.error("\u274C Could not find Roll20 chat send button (#textchat-input .btn)");
          return false;
        }
        sendButton.click();
        debug.log("\u2705 Message posted to Roll20 chat");
        return true;
      } catch (error) {
        debug.error("\u274C Error posting to Roll20 chat:", error);
        return false;
      }
    }
    async function handleDiceCloudRoll(rollData) {
      try {
        debug.log("\u{1F3B2} Handling roll:", rollData);
        debug.log("\u{1F3B2} Roll data keys:", Object.keys(rollData || {}));
        if (rollData && rollData.source === "discord") {
          debug.log("\u{1F4E1} Roll originated from Discord command");
        }
        if (!rollData) {
          debug.error("\u274C No roll data provided");
          return { success: false, error: "No roll data provided" };
        }
        const hasDiceInFormula = rollData.formula && /\dd\d+/.test(rollData.formula);
        const hasD20 = rollData.formula && rollData.formula.toLowerCase().includes("d20");
        const hasDamageInName = rollData.name && rollData.name.toLowerCase().includes("damage");
        const hasAttackInName = rollData.name && rollData.name.toLowerCase().includes("attack");
        const isDamageRoll = hasDiceInFormula && !hasD20 || hasDamageInName;
        const isAttackRoll = hasD20 && hasAttackInName && !hasDamageInName;
        debug.log("\u{1F50D} Checking roll type:", {
          formula: rollData.formula,
          name: rollData.name,
          hasDiceInFormula,
          hasD20,
          hasDamageInName,
          hasAttackInName,
          isDamageRoll,
          isAttackRoll
        });
        let expandedCritRange = null;
        try {
          const storage = await browserAPI.storage.local.get("characterProfiles");
          const characterProfiles = storage.characterProfiles || {};
          let characterData = null;
          const characterNameLower = (rollData.characterName || "").toLowerCase();
          for (const [key, profile] of Object.entries(characterProfiles)) {
            if (profile.name && profile.name.toLowerCase() === characterNameLower) {
              characterData = profile;
              break;
            }
          }
          if (characterData) {
            debug.log("\u{1F4CA} Found character data for modifier application:", characterData.name);
            if (characterData.triggers && Array.isArray(characterData.triggers)) {
              const triggerEffects = processTriggers(characterData.triggers);
              expandedCritRange = triggerEffects.expandedCritRange;
              if (expandedCritRange) {
                debug.log(`\u26A1 Character has expanded crit range: ${expandedCritRange}-20`);
              }
            }
            const hasModifier = /[+\-]\s*\d+/.test(rollData.formula);
            if (isDamageRoll && !hasModifier) {
              const attributeMods = characterData.attributeMods || {};
              const strMod = attributeMods.strength || attributeMods.strengthMod || 0;
              const dexMod = attributeMods.dexterity || attributeMods.dexterityMod || 0;
              const proficiencyBonus = characterData.proficiencyBonus || 0;
              const rollNameLower = rollData.name.toLowerCase();
              const isRangedOrFinesse = rollNameLower.includes("bow") || rollNameLower.includes("crossbow") || rollNameLower.includes("dart") || rollNameLower.includes("sling") || rollNameLower.includes("rapier") || rollNameLower.includes("shortsword") || rollNameLower.includes("scimitar") || rollNameLower.includes("dagger") || rollNameLower.includes("whip");
              const abilityMod = isRangedOrFinesse ? dexMod : Math.max(strMod, dexMod);
              const addProficiency = hasProficiencyToDamageFeature(characterData, rollData.name);
              const totalModifier = addProficiency ? abilityMod + proficiencyBonus : abilityMod;
              if (totalModifier !== 0) {
                if (totalModifier > 0) {
                  rollData.formula = `${rollData.formula} + ${totalModifier}`;
                  if (addProficiency) {
                    debug.log(`\u2728 Added +${totalModifier} (ability + proficiency) to damage roll (feature detected)`);
                  } else {
                    debug.log(`\u2728 Added +${totalModifier} ability modifier to damage roll`);
                  }
                } else {
                  rollData.formula = `${rollData.formula} - ${Math.abs(totalModifier)}`;
                  debug.log(`\u2728 Added ${totalModifier} modifier to damage roll`);
                }
              }
            }
            if (isAttackRoll && !hasModifier) {
              const proficiencyBonus = characterData.proficiencyBonus || 0;
              const attributeMods = characterData.attributeMods || {};
              const strMod = attributeMods.strength || attributeMods.strengthMod || 0;
              const dexMod = attributeMods.dexterity || attributeMods.dexterityMod || 0;
              const rollNameLower = rollData.name.toLowerCase();
              const isRangedOrFinesse = rollNameLower.includes("bow") || rollNameLower.includes("crossbow") || rollNameLower.includes("dart") || rollNameLower.includes("sling") || rollNameLower.includes("rapier") || rollNameLower.includes("shortsword") || rollNameLower.includes("scimitar") || rollNameLower.includes("dagger") || rollNameLower.includes("whip");
              const abilityMod = isRangedOrFinesse ? dexMod : Math.max(strMod, dexMod);
              const totalModifier = abilityMod + proficiencyBonus;
              if (totalModifier !== 0) {
                if (totalModifier > 0) {
                  rollData.formula = `${rollData.formula} + ${totalModifier}`;
                  debug.log(`\u2728 Added +${totalModifier} (ability + proficiency) to attack roll`);
                } else {
                  rollData.formula = `${rollData.formula} - ${Math.abs(totalModifier)}`;
                  debug.log(`\u2728 Added ${totalModifier} (ability + proficiency) to attack roll`);
                }
              }
            }
          } else {
            debug.log("\u26A0\uFE0F No character data found for modifier application");
          }
        } catch (error) {
          debug.warn("\u26A0\uFE0F Error retrieving character data for modifiers:", error);
        }
        let isCriticalHit = false;
        if (isDamageRoll) {
          debug.log("\u2705 Identified as damage roll, checking for crit flag...");
          try {
            const storage = await browserAPI.storage.local.get("criticalHitPending");
            debug.log("\u{1F4E6} Storage check:", storage);
            if (storage.criticalHitPending) {
              const critData = storage.criticalHitPending;
              const critAge = Date.now() - critData.timestamp;
              debug.log(`\u23F1\uFE0F Crit flag age: ${critAge}ms (max 30000ms)`);
              if (critAge < 3e4) {
                debug.log("\u{1F4A5} Critical hit active! Doubling damage dice for:", rollData.name);
                debug.log("\u{1F4A5} Original formula:", rollData.formula);
                rollData.formula = doubleDamageDice(rollData.formula);
                debug.log("\u{1F4A5} Doubled formula:", rollData.formula);
                isCriticalHit = true;
                await browserAPI.storage.local.remove("criticalHitPending");
                debug.log("\u2705 Crit flag cleared after use");
              } else {
                debug.log("\u23F1\uFE0F Critical hit flag expired, clearing");
                await browserAPI.storage.local.remove("criticalHitPending");
              }
            } else {
              debug.log("\u274C No crit flag found in storage");
            }
          } catch (storageError) {
            debug.warn("\u26A0\uFE0F Could not check critical hit flag:", storageError);
          }
        } else {
          debug.log("\u23E9 Not a damage roll, skipping crit check");
        }
        if (isCriticalHit) {
          rollData.name = `\u{1F4A5} CRITICAL HIT! ${rollData.name}`;
        }
        let formattedMessage;
        try {
          formattedMessage = rollData.message || formatRollForRoll20(rollData);
        } catch (formatError) {
          debug.error("\u274C Error formatting roll:", formatError);
          formattedMessage = `&{template:default} {{name=${rollData.name || "Roll"}}} {{Roll=[[${rollData.formula || "1d20"}]]}}`;
        }
        debug.log("\u{1F3B2} Formatted message:", formattedMessage);
        const success = postChatMessage(formattedMessage);
        if (success) {
          debug.log("\u2705 Roll successfully posted to Roll20");
          try {
            observeNextRollResult(rollData, expandedCritRange);
          } catch (observeError) {
            debug.warn("\u26A0\uFE0F Could not set up roll observer:", observeError.message);
          }
          return { success: true };
        } else {
          debug.error("\u274C Failed to post roll to Roll20 - chat input or send button not found");
          return { success: false, error: "Roll20 chat not ready. Make sure you are in a Roll20 game." };
        }
      } catch (error) {
        debug.error("\u274C Unexpected error in handleDiceCloudRoll:", error);
        return { success: false, error: "Unexpected error: " + error.message };
      }
    }
    function doubleDamageDice(formula) {
      if (!formula)
        return formula;
      return formula.replace(/(\d+)d(\d+)/g, (match, count, sides) => {
        const doubledCount = parseInt(count) * 2;
        return `${doubledCount}d${sides}`;
      });
    }
    function hasProficiencyToDamageFeature(characterData, rollName) {
      if (!characterData)
        return false;
      const actions = characterData.actions || [];
      const rollNameLower = rollName.toLowerCase();
      const proficiencyDamageFeatures = [
        "hexblade",
        "hex warrior",
        "kensei",
        "divine strike",
        "potent cantrip",
        "deft strike",
        "sharpshooter",
        // -5/+10 feature, but some tables use proficiency instead
        "great weapon master"
        // Similar to sharpshooter
      ];
      for (const feature of proficiencyDamageFeatures) {
        if (rollNameLower.includes(feature)) {
          return true;
        }
      }
      for (const action of actions) {
        const actionName = (action.name || "").toLowerCase();
        const actionSummary = (action.summary || "").toLowerCase();
        const actionDescription = (action.description || "").toLowerCase();
        const actionTags = action.tags || [];
        for (const feature of proficiencyDamageFeatures) {
          if (actionName.includes(feature) || actionSummary.includes(feature) || actionDescription.includes(feature) || actionTags.some((tag) => typeof tag === "string" && tag.toLowerCase().includes(feature))) {
            return true;
          }
        }
      }
      return false;
    }
    function observeNextRollResult(originalRollData, expandedCritRange = null) {
      debug.log("\u{1F440} Setting up observer for Roll20 roll result...");
      if (expandedCritRange) {
        debug.log(`\u26A1 Using expanded crit range: ${expandedCritRange}-20`);
      }
      const chatLog = document.querySelector("#textchat .content");
      if (!chatLog) {
        debug.error("\u274C Could not find Roll20 chat log");
        return;
      }
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const inlineRoll = node.querySelector(".inlinerollresult");
              if (inlineRoll) {
                debug.log("\u{1F3B2} Found new Roll20 inline roll:", inlineRoll);
                const rollResult = parseRoll20InlineRoll(inlineRoll, originalRollData);
                if (rollResult) {
                  debug.log("\u{1F3B2} Parsed Roll20 roll result:", rollResult);
                  if (rollResult.baseRoll === 1 || rollResult.baseRoll === 20) {
                    const rollType = rollResult.baseRoll === 1 ? "Natural 1" : "Natural 20";
                    debug.log(`\u{1F3AF} ${rollType} detected in Roll20 roll!`);
                    debug.log(`\u{1F3AF} Roll data:`, originalRollData);
                    const name = originalRollData.name?.toLowerCase() || "";
                    const formula = originalRollData.formula?.toLowerCase() || "";
                    const hasD20 = formula.includes("d20");
                    const hasAttackKeyword = name.includes("attack");
                    const isDamageRoll = name.includes("damage");
                    const isSkillOrSave = name.includes("check") || name.includes("save") || name.includes("saving throw") || name.includes("skill") || name.includes("ability");
                    const isAttackRoll = hasD20 && hasAttackKeyword && !isDamageRoll && !isSkillOrSave;
                    const critThreshold = expandedCritRange || 20;
                    const isCritical = rollResult.baseRoll >= critThreshold && rollResult.baseRoll === 20;
                    const isExpandedCrit = expandedCritRange && rollResult.baseRoll >= expandedCritRange;
                    if ((isCritical || isExpandedCrit) && isAttackRoll) {
                      const critType = rollResult.baseRoll === 20 ? "Natural 20" : `Expanded Crit (${rollResult.baseRoll})`;
                      debug.log(`\u{1F4A5} Critical hit detected! ${critType} - Setting crit flag for next damage roll`);
                      debug.log("\u{1F4A5} Attack name:", originalRollData.name);
                      debug.log(`\u{1F4A5} Roll: ${rollResult.baseRoll}, Threshold: ${critThreshold}`);
                      browserAPI.storage.local.set({
                        criticalHitPending: {
                          timestamp: Date.now(),
                          attackName: originalRollData.name,
                          critRoll: rollResult.baseRoll
                        }
                      });
                      setTimeout(() => {
                        browserAPI.storage.local.remove("criticalHitPending");
                        debug.log("\u23F1\uFE0F Critical hit flag expired");
                      }, 3e4);
                    } else if (rollResult.baseRoll === 20) {
                      debug.log("\u26A0\uFE0F Natural 20 detected but not identified as attack roll");
                      debug.log("\u26A0\uFE0F Formula:", originalRollData.formula);
                      debug.log("\u26A0\uFE0F Name:", originalRollData.name);
                    }
                    browserAPI.runtime.sendMessage({
                      action: "rollResult",
                      rollResult: rollResult.total.toString(),
                      baseRoll: rollResult.baseRoll.toString(),
                      rollType: originalRollData.formula,
                      rollName: originalRollData.name,
                      checkRacialTraits: true
                    });
                    debug.log(`\u{1F9EC} Sent ${rollType} result to popup`);
                  }
                }
                observer.disconnect();
                break;
              }
            }
          }
        }
      });
      observer.observe(chatLog, { childList: true, subtree: true });
      debug.log("\u2705 Observer set up for Roll20 chat");
      setTimeout(() => {
        observer.disconnect();
        debug.log("\u23F1\uFE0F Roll observer timed out and disconnected");
      }, 5e3);
    }
    function parseRoll20InlineRoll(inlineRollElement, originalRollData) {
      try {
        const title = inlineRollElement.getAttribute("title") || "";
        debug.log("\u{1F4CA} Roll20 inline roll title:", title);
        const plainTitle = title.replace(/<[^>]*>/g, "");
        debug.log("\u{1F4CA} Plain title:", plainTitle);
        const baseRollMatch = plainTitle.match(/=\s*\(\s*(\d+)\s*\)/);
        const baseRoll = baseRollMatch ? parseInt(baseRollMatch[1]) : null;
        const totalText = inlineRollElement.textContent?.trim() || "";
        const total = parseInt(totalText);
        debug.log(`\u{1F4CA} Extracted: baseRoll=${baseRoll}, total=${total}`);
        if (baseRoll && baseRoll >= 1 && baseRoll <= 20) {
          return {
            baseRoll,
            total,
            formula: originalRollData.formula,
            name: originalRollData.name
          };
        }
        return null;
      } catch (error) {
        debug.error("\u274C Error parsing Roll20 inline roll:", error);
        return null;
      }
    }
    function calculateBaseRoll(formula, result) {
      try {
        debug.log(`\u{1F9EE} Calculating base roll - Formula: "${formula}", Result: "${result}"`);
        const modifierMatch = formula.match(/1d20([+-]\d+)/i);
        if (modifierMatch) {
          const modifier = parseInt(modifierMatch[1]);
          const totalResult = parseInt(result);
          const baseRoll = totalResult - modifier;
          debug.log(`\u{1F9EE} Calculation: ${totalResult} - (${modifier}) = ${baseRoll}`);
          if (baseRoll >= 1 && baseRoll <= 20) {
            return baseRoll;
          } else {
            debug.warn(`\u26A0\uFE0F Calculated base roll ${baseRoll} is outside valid d20 range (1-20)`);
            return baseRoll;
          }
        } else {
          debug.log(`\u{1F9EE} No modifier found in formula, using result as base roll: ${result}`);
          return parseInt(result);
        }
      } catch (error) {
        debug.error("\u274C Error calculating base roll:", error);
        return parseInt(result);
      }
    }
    function checkRoll20InlineRolls(characterName) {
      debug.log("\u{1F50D} Checking Roll20 inline rolls for natural 1s for:", characterName);
      const inlineRolls = document.querySelectorAll(".inlinerollresult, .rollresult");
      debug.log(`\u{1F50D} Found ${inlineRolls.length} inline roll elements`);
      inlineRolls.forEach((rollElement, index) => {
        try {
          const rollData = getRoll20RollData(rollElement);
          debug.log(`\u{1F50D} Checking inline roll ${index + 1}:`, rollData);
          if (rollData && rollData.baseRoll === 1 && rollData.name.includes(characterName)) {
            debug.log("\u{1F340} Natural 1 detected in Roll20 inline roll!");
            debug.log("\u{1F340} Roll data:", rollData);
            browserAPI.runtime.sendMessage({
              action: "rollResult",
              rollResult: rollData.total.toString(),
              baseRoll: rollData.baseRoll.toString(),
              rollType: rollData.formula,
              rollName: rollData.name,
              checkRacialTraits: true
            });
            debug.log("\u{1F9EC} Sent natural 1 result to popup for Halfling Luck");
          }
        } catch (error) {
          debug.warn("\u26A0\uFE0F Error checking inline roll:", error);
        }
      });
      debug.log("\u{1F50D} Finished checking inline rolls");
    }
    function getRoll20RollData(rollElement) {
      try {
        const rollName = rollElement.closest(".message")?.querySelector(".message-name")?.textContent || rollElement.closest(".message")?.textContent?.split("\n")[0]?.trim() || "";
        const formulaElement = rollElement.querySelector(".formula") || rollElement;
        const formula = formulaElement.textContent?.trim() || "";
        const rollDetails = rollElement.textContent || rollElement.innerText || "";
        const baseRollMatch = rollDetails.match(/^(\d+)/);
        const baseRoll = baseRollMatch ? parseInt(baseRollMatch[1]) : null;
        const totalMatch = rollDetails.match(/(\d+)\s*$/);
        const total = totalMatch ? parseInt(totalMatch[1]) : baseRoll;
        debug.log(`\u{1F50D} Extracted roll data - Name: ${rollName}, Formula: ${formula}, Base: ${baseRoll}, Total: ${total}`);
        return {
          name: rollName,
          formula,
          baseRoll,
          total
        };
      } catch (error) {
        debug.warn("\u26A0\uFE0F Error extracting roll data:", error);
        return null;
      }
    }
    function isOurCharacter(characterName) {
      if (!characterName)
        return false;
      if (characterPopups && characterPopups[characterName]) {
        return true;
      }
      if (playerData && playerData[characterName]) {
        return true;
      }
      const hasAnyCharacters = characterPopups && Object.keys(characterPopups).length > 0 || playerData && Object.keys(playerData).length > 0;
      if (!hasAnyCharacters) {
        debug.log(`\u2705 Allowing ${characterName} (no characters registered yet)`);
        return true;
      }
      return false;
    }
    function getColorEmoji(color) {
      const colorEmojiMap = {
        "#3498db": "\u{1F535}",
        // Blue
        "#e74c3c": "\u{1F534}",
        // Red
        "#c2185b": "\u{1F7E2}",
        // Green
        "#9b59b6": "\u{1F7E3}",
        // Purple
        "#e67e22": "\u{1F7E0}",
        // Orange
        "#f1c40f": "\u{1F7E1}",
        // Yellow
        "#95a5a6": "\u26AA",
        // Grey
        "#34495e": "\u26AB",
        // Black
        "#8b4513": "\u{1F7E4}"
        // Brown
      };
      return colorEmojiMap[color] || "\u{1F535}";
    }
    function formatRollForRoll20(rollData) {
      const { name, formula, characterName, advantage, disadvantage, checkType, prerolledResult, color } = rollData;
      let rollFormula = formula;
      let rollType = "";
      if ((advantage || disadvantage) && formula.includes("d20")) {
        if (advantage && !disadvantage) {
          rollFormula = formula.replace("1d20", "2d20kh1");
          rollType = " (Advantage)";
        } else if (disadvantage && !advantage) {
          rollFormula = formula.replace("1d20", "2d20kl1");
          rollType = " (Disadvantage)";
        }
      }
      const colorEmoji = color ? getColorEmoji(color) : "";
      const colorPrefix = colorEmoji ? `${colorEmoji} ` : "";
      let displayName = name;
      if (characterName && !name.includes(characterName)) {
        displayName = `${colorPrefix}${characterName} - ${name}`;
      } else {
        displayName = `${colorPrefix}${name}`;
      }
      if (prerolledResult !== null && prerolledResult !== void 0) {
        debug.log(`\u{1F3B2} Using prerolled result: ${prerolledResult} instead of rolling ${rollFormula}`);
        return `&{template:default} {{name=${displayName}${rollType}}} {{Roll=${prerolledResult}}}`;
      }
      return `&{template:default} {{name=${displayName}${rollType}}} {{Roll=[[${rollFormula}]]}}`;
    }
    function normalizePopupSpellData(eventData) {
      const spell = eventData.spellData || {};
      let castLevel = eventData.castLevel || parseInt(spell.level) || 0;
      if (typeof castLevel === "string" && castLevel.startsWith("pact:")) {
        castLevel = parseInt(castLevel.split(":")[1]) || 0;
      } else {
        castLevel = parseInt(castLevel) || 0;
      }
      const spellLevel = parseInt(spell.level) || 0;
      const characterName = eventData.characterName || "Character";
      const notificationColor = eventData.color || eventData.notificationColor || "#3498db";
      return {
        // Basic spell info
        name: spell.name || eventData.spellName || "Unknown Spell",
        characterName,
        level: spellLevel,
        castLevel,
        school: spell.school,
        // Spell details
        castingTime: spell.castingTime,
        range: spell.range,
        duration: spell.duration,
        components: spell.components,
        source: spell.source,
        summary: spell.summary,
        description: spell.description,
        // Tags and modifiers
        concentration: spell.concentration,
        ritual: spell.ritual,
        isCantrip: spellLevel === 0,
        isFreecast: false,
        isUpcast: castLevel > spellLevel,
        // Metamagic and effects (popup doesn't send these yet, but prepared for future)
        metamagicUsed: eventData.metamagicUsed || [],
        effects: eventData.effects || [],
        // Resource usage (popup doesn't send these yet, but prepared for future)
        slotUsed: eventData.slotUsed,
        resourceChanges: eventData.resourceChanges || [],
        // Rolls (popup sends these separately via roll() function, but prepared for future)
        attackRoll: spell.attackRoll,
        damageRolls: spell.damageRolls || [],
        fallbackDamage: spell.damage,
        fallbackDamageType: spell.damageType,
        // Visual
        notificationColor
      };
    }
    function normalizeDiscordSpellData(spellData) {
      const spell = spellData.spell_data || spellData.spell || {};
      const castLevel = parseInt(spellData.cast_level) || parseInt(spell.level) || 0;
      const spellLevel = parseInt(spell.level) || 0;
      return {
        // Basic spell info
        name: spell.name || "Unknown Spell",
        characterName: spellData.character_name || "Character",
        level: spellLevel,
        castLevel,
        school: spell.school,
        // Spell details
        castingTime: spell.castingTime || spell.casting_time,
        range: spell.range,
        duration: spell.duration,
        components: spell.components,
        source: spell.source,
        summary: spell.summary || spellData.summary,
        description: spell.description || spellData.description,
        // Tags and modifiers
        concentration: spell.concentration,
        ritual: spell.ritual,
        isCantrip: spellData.isCantrip || spellLevel === 0,
        isFreecast: spellData.isFreecast || false,
        isUpcast: spellData.isUpcast || castLevel > spellLevel,
        // Metamagic and effects
        metamagicUsed: spellData.metamagicUsed || [],
        effects: spellData.effects || [],
        // Resource usage
        slotUsed: spellData.slotUsed,
        resourceChanges: spellData.resourceChanges || [],
        // Rolls
        attackRoll: spell.attackRoll || spell.attack_roll,
        damageRolls: spellData.damageRolls || spellData.damage_rolls || [],
        fallbackDamage: spell.damage,
        fallbackDamageType: spell.damageType || spell.damage_type,
        // Visual - check multiple possible field names
        notificationColor: spellData.notification_color || spellData.notificationColor || spell.notification_color || spell.notificationColor || "#3498db"
      };
    }
    function postSpellToRoll20(normalizedSpellData) {
      const {
        name,
        characterName,
        level,
        castLevel,
        school,
        castingTime,
        range,
        duration,
        components,
        source,
        summary,
        description,
        concentration,
        ritual,
        isCantrip,
        isFreecast,
        isUpcast,
        metamagicUsed,
        effects,
        slotUsed,
        resourceChanges,
        attackRoll,
        damageRolls,
        fallbackDamage,
        fallbackDamageType,
        notificationColor
      } = normalizedSpellData;
      const colorEmoji = getColorEmoji(notificationColor);
      let tags = "";
      if (concentration)
        tags += " \u{1F9E0} Concentration";
      if (ritual)
        tags += " \u{1F4D6} Ritual";
      if (metamagicUsed && metamagicUsed.length > 0) {
        const metamagicNames = metamagicUsed.map((m) => m.name).join(", ");
        tags += ` \u2728 ${metamagicNames}`;
      }
      if (isCantrip)
        tags += " \u{1F3AF} Cantrip";
      if (isFreecast)
        tags += " \u{1F193} Free Cast";
      if (isUpcast)
        tags += ` \u2B06\uFE0F Upcast to Level ${castLevel}`;
      let announcement = `&{template:default} {{name=${colorEmoji} ${characterName} casts ${name}!${tags}}}`;
      if (level > 0) {
        let levelText = `Level ${level}`;
        if (school)
          levelText += ` ${school}`;
        if (isUpcast) {
          levelText += ` (Upcast to Level ${castLevel})`;
        }
        announcement += ` {{Level=${levelText}}}`;
      } else if (school) {
        announcement += ` {{Level=${school} cantrip}}`;
      }
      if (castingTime)
        announcement += ` {{Casting Time=${castingTime}}}`;
      if (range)
        announcement += ` {{Range=${range}}}`;
      if (duration)
        announcement += ` {{Duration=${duration}}}`;
      if (components)
        announcement += ` {{Components=${components}}}`;
      if (source)
        announcement += ` {{Source=${source}}}`;
      if (slotUsed && !isCantrip && !isFreecast) {
        announcement += ` {{Slot Used=${slotUsed.level} (${slotUsed.remaining}/${slotUsed.total} remaining)}}`;
      }
      if (resourceChanges && resourceChanges.length > 0) {
        const resourceText = resourceChanges.map(
          (change) => `${change.resource}: ${change.current}/${change.max}`
        ).join(", ");
        announcement += ` {{Resources=${resourceText}}}`;
      }
      if (effects && effects.length > 0) {
        const effectsText = effects.map((effect) => effect.description || effect.type).join(", ");
        announcement += ` {{Effects=${effectsText}}}`;
      }
      if (summary) {
        announcement += ` {{Summary=${summary}}}`;
      }
      if (description) {
        announcement += ` {{Description=${description}}}`;
      }
      postChatMessage(announcement);
      const scaleFormulaForUpcast = (formula, baseLevel, actualCastLevel) => {
        if (!formula || baseLevel <= 0 || actualCastLevel <= baseLevel)
          return formula;
        let scaledFormula = formula.replace(/slotLevel/gi, actualCastLevel);
        if (scaledFormula === formula) {
          const levelDiff = actualCastLevel - baseLevel;
          const diceMatch = formula.match(/^(\d+)d(\d+)/);
          if (diceMatch && levelDiff > 0) {
            const baseDice = parseInt(diceMatch[1]);
            const dieSize = parseInt(diceMatch[2]);
            const scaledDice = baseDice + levelDiff;
            scaledFormula = formula.replace(/^(\d+)d(\d+)/, `${scaledDice}d${dieSize}`);
            debug.log(`\u{1F4C8} Scaled formula from ${formula} to ${scaledFormula} (upcast by ${levelDiff} levels)`);
          }
        }
        return scaledFormula;
      };
      if (attackRoll && attackRoll !== "(none)") {
        setTimeout(() => {
          try {
            const attackMsg = formatRollForRoll20({
              name: `${name} - Attack`,
              formula: attackRoll,
              characterName
            });
            postChatMessage(attackMsg);
          } catch (attackError) {
            debug.error(`\u274C Failed to roll attack for ${name}:`, attackError);
            postChatMessage(`&{template:default} {{name=\u26A0\uFE0F Roll Failed}} {{error=Attack roll for ${name} failed: ${attackError.message}}}`);
          }
        }, 100);
      }
      if (damageRolls && Array.isArray(damageRolls) && damageRolls.length > 0) {
        damageRolls.forEach((roll, index) => {
          if (roll.damage) {
            setTimeout(() => {
              try {
                const damageType = roll.damageType || "damage";
                const isHealing = damageType.toLowerCase() === "healing";
                const isTempHP = damageType.toLowerCase().includes("temp");
                let rollName;
                if (isHealing) {
                  rollName = `${name} - Healing`;
                } else if (isTempHP) {
                  rollName = `${name} - Temp HP`;
                } else {
                  rollName = roll.name || `${name} - ${damageType}`;
                }
                const scaledFormula = scaleFormulaForUpcast(roll.damage, level, castLevel);
                const damageMsg = formatRollForRoll20({
                  name: rollName,
                  formula: scaledFormula,
                  characterName
                });
                postChatMessage(damageMsg);
              } catch (damageError) {
                debug.error(`\u274C Failed to roll damage for ${name}:`, damageError);
                postChatMessage(`&{template:default} {{name=\u26A0\uFE0F Roll Failed}} {{error=Damage roll ${index + 1} for ${name} failed: ${damageError.message}}}`);
              }
            }, 200 + index * 100);
          }
        });
      } else if (fallbackDamage) {
        setTimeout(() => {
          try {
            const damageType = fallbackDamageType || "damage";
            const isHealing = damageType.toLowerCase() === "healing";
            const rollName = isHealing ? `${name} - Healing` : `${name} - ${damageType}`;
            const scaledFormula = scaleFormulaForUpcast(fallbackDamage, level, castLevel);
            const damageMsg = formatRollForRoll20({
              name: rollName,
              formula: scaledFormula,
              characterName
            });
            postChatMessage(damageMsg);
          } catch (damageError) {
            debug.error(`\u274C Failed to roll damage for ${name}:`, damageError);
            postChatMessage(`&{template:default} {{name=\u26A0\uFE0F Roll Failed}} {{error=Damage roll for ${name} failed: ${damageError.message}}}`);
          }
        }, 200);
      }
    }
    browserAPI.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
      try {
        debug.log("\u{1F4E8} Roll20 content script received message:", request.action, request);
        if (request.action === "postRollToChat") {
          try {
            const result = handleDiceCloudRoll(request.roll);
            sendResponse(result || { success: true });
          } catch (rollError) {
            debug.error("\u274C Error handling postRollToChat:", rollError);
            sendResponse({ success: false, error: rollError.message });
          }
          return true;
        } else if (request.action === "sendRollToRoll20") {
          debug.log("\u{1F3B2} Received sendRollToRoll20 message:", request.roll);
          try {
            const result = handleDiceCloudRoll(request.roll);
            sendResponse(result || { success: true });
          } catch (rollError) {
            debug.error("\u274C Error handling sendRollToRoll20:", rollError);
            sendResponse({ success: false, error: rollError.message || "Failed to process roll" });
          }
          return true;
        } else if (request.action === "rollFromPopout") {
          if (request.roll && request.roll.action === "announceSpell") {
            debug.log("\u2728 Detected announceSpell wrapped in rollFromPopout, routing to announcement handler");
            if (request.roll.message) {
              postChatMessage(request.roll.message);
              sendResponse({ success: true });
            } else if (request.roll.spellData) {
              const normalizedSpellData = normalizePopupSpellData(request.roll);
              postSpellToRoll20(normalizedSpellData);
              sendResponse({ success: true });
            }
            return true;
          }
          debug.log("\u{1F3B2} Received roll request from popup:", request);
          const rollData = {
            name: request.name || request.roll?.name,
            formula: request.formula || request.roll?.formula,
            characterName: request.characterName || request.roll?.characterName,
            color: request.color || request.roll?.color
          };
          (async () => {
            const hasDiceInFormula = rollData.formula && /\dd\d+/.test(rollData.formula);
            const hasD20 = rollData.formula && rollData.formula.toLowerCase().includes("d20");
            const hasDamageInName = rollData.name && rollData.name.toLowerCase().includes("damage");
            const hasAttackInName = rollData.name && rollData.name.toLowerCase().includes("attack");
            const isDamageRoll = hasDiceInFormula && !hasD20 || hasDamageInName;
            const isAttackRoll = hasD20 && hasAttackInName && !hasDamageInName;
            debug.log("\u{1F50D} Checking roll type (rollFromPopout):", {
              formula: rollData.formula,
              name: rollData.name,
              isDamageRoll,
              isAttackRoll
            });
            try {
              const storage = await browserAPI.storage.local.get("characterProfiles");
              const characterProfiles = storage.characterProfiles || {};
              let characterData = null;
              const characterNameLower = (rollData.characterName || "").toLowerCase();
              for (const [key, profile] of Object.entries(characterProfiles)) {
                if (profile.name && profile.name.toLowerCase() === characterNameLower) {
                  characterData = profile;
                  break;
                }
              }
              if (characterData) {
                debug.log("\u{1F4CA} Found character data for modifier application:", characterData.name);
                const hasModifier = /[+\-]\s*\d+/.test(rollData.formula);
                if (isDamageRoll && !hasModifier) {
                  const attributeMods = characterData.attributeMods || {};
                  const strMod = attributeMods.strength || attributeMods.strengthMod || 0;
                  const dexMod = attributeMods.dexterity || attributeMods.dexterityMod || 0;
                  const proficiencyBonus = characterData.proficiencyBonus || 0;
                  const rollNameLower = rollData.name.toLowerCase();
                  const isRangedOrFinesse = rollNameLower.includes("bow") || rollNameLower.includes("crossbow") || rollNameLower.includes("dart") || rollNameLower.includes("sling") || rollNameLower.includes("rapier") || rollNameLower.includes("shortsword") || rollNameLower.includes("scimitar") || rollNameLower.includes("dagger") || rollNameLower.includes("whip");
                  const abilityMod = isRangedOrFinesse ? dexMod : Math.max(strMod, dexMod);
                  const addProficiency = hasProficiencyToDamageFeature(characterData, rollData.name);
                  const totalModifier = addProficiency ? abilityMod + proficiencyBonus : abilityMod;
                  if (totalModifier !== 0) {
                    if (totalModifier > 0) {
                      rollData.formula = `${rollData.formula} + ${totalModifier}`;
                      if (addProficiency) {
                        debug.log(`\u2728 Added +${totalModifier} (ability + proficiency) to damage roll (feature detected)`);
                      } else {
                        debug.log(`\u2728 Added +${totalModifier} ability modifier to damage roll`);
                      }
                    } else {
                      rollData.formula = `${rollData.formula} - ${Math.abs(totalModifier)}`;
                      debug.log(`\u2728 Added ${totalModifier} modifier to damage roll`);
                    }
                  }
                }
                if (isAttackRoll && !hasModifier) {
                  const proficiencyBonus = characterData.proficiencyBonus || 0;
                  const attributeMods = characterData.attributeMods || {};
                  const strMod = attributeMods.strength || attributeMods.strengthMod || 0;
                  const dexMod = attributeMods.dexterity || attributeMods.dexterityMod || 0;
                  const rollNameLower = rollData.name.toLowerCase();
                  const isRangedOrFinesse = rollNameLower.includes("bow") || rollNameLower.includes("crossbow") || rollNameLower.includes("dart") || rollNameLower.includes("sling") || rollNameLower.includes("rapier") || rollNameLower.includes("shortsword") || rollNameLower.includes("scimitar") || rollNameLower.includes("dagger") || rollNameLower.includes("whip");
                  const abilityMod = isRangedOrFinesse ? dexMod : Math.max(strMod, dexMod);
                  const totalModifier = abilityMod + proficiencyBonus;
                  if (totalModifier !== 0) {
                    if (totalModifier > 0) {
                      rollData.formula = `${rollData.formula} + ${totalModifier}`;
                      debug.log(`\u2728 Added +${totalModifier} (ability + proficiency) to attack roll`);
                    } else {
                      rollData.formula = `${rollData.formula} - ${Math.abs(totalModifier)}`;
                      debug.log(`\u2728 Added ${totalModifier} (ability + proficiency) to attack roll`);
                    }
                  }
                }
              } else {
                debug.log("\u26A0\uFE0F No character data found for modifier application");
              }
            } catch (error) {
              debug.warn("\u26A0\uFE0F Error retrieving character data for modifiers:", error);
            }
            if (isDamageRoll) {
              try {
                const storage = await browserAPI.storage.local.get("criticalHitPending");
                debug.log("\u{1F4E6} Storage check (rollFromPopout):", storage);
                if (storage.criticalHitPending) {
                  const critData = storage.criticalHitPending;
                  const critAge = Date.now() - critData.timestamp;
                  if (critAge < 3e4) {
                    debug.log("\u{1F4A5} Critical hit active! Doubling damage dice (rollFromPopout)");
                    debug.log("\u{1F4A5} Original formula:", rollData.formula);
                    rollData.formula = doubleDamageDice(rollData.formula);
                    rollData.name = `\u{1F4A5} CRITICAL HIT! ${rollData.name}`;
                    debug.log("\u{1F4A5} Doubled formula:", rollData.formula);
                    await browserAPI.storage.local.remove("criticalHitPending");
                    debug.log("\u2705 Crit flag cleared (rollFromPopout)");
                  } else {
                    debug.log("\u23F1\uFE0F Crit flag expired (rollFromPopout)");
                    await browserAPI.storage.local.remove("criticalHitPending");
                  }
                }
              } catch (error) {
                debug.warn("\u26A0\uFE0F Error checking crit flag (rollFromPopout):", error);
              }
            }
            if (silentRollsEnabled) {
              debug.log("\u{1F507} Silent rolls active - hiding roll instead of posting");
              const hiddenRoll = {
                id: Date.now() + Math.random(),
                // Unique ID
                name: rollData.name,
                formula: rollData.formula,
                characterName: rollData.characterName,
                timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
                result: null
                // Will be filled when revealed
              };
              hiddenRolls.push(hiddenRoll);
              updateHiddenRollsDisplay();
              sendResponse({ success: true, hidden: true });
            } else {
              const formattedMessage = formatRollForRoll20(rollData);
              const success = postChatMessage(formattedMessage);
              if (success) {
                debug.log("\u2705 Roll posted directly to Roll20 (no DiceCloud!)");
                observeNextRollResult(rollData);
              }
              sendResponse({ success });
            }
          })();
        } else if (request.action === "announceSpell") {
          if (request.spellData) {
            debug.log("\u{1F52E} Received structured spell data from background script:", request);
            const normalizedSpellData = normalizePopupSpellData(request);
            postSpellToRoll20(normalizedSpellData);
          } else if (request.message) {
            postChatMessage(request.message);
          } else {
            handleDiceCloudRoll(request);
          }
          sendResponse({ success: true });
        } else if (request.action === "postChatMessageFromPopup") {
          if (request.message) {
            debug.log("\u{1F4E8} Received postChatMessageFromPopup:", request.message);
            const success = postChatMessage(request.message);
            sendResponse({ success });
          } else {
            debug.warn("\u26A0\uFE0F postChatMessageFromPopup missing message");
            sendResponse({ success: false, error: "No message provided" });
          }
        } else if (request.action === "testRoll20Connection") {
          const chatInput = document.querySelector("#textchat-input textarea");
          sendResponse({
            success: !!chatInput,
            message: chatInput ? "Roll20 chat accessible" : "Roll20 chat not found"
          });
        } else if (request.action === "showCharacterSheet") {
          debug.log("\u{1F50D} showCharacterSheet called, checking playerData:", playerData);
          debug.log("\u{1F50D} playerData keys:", Object.keys(playerData || {}));
          if (!playerData || Object.keys(playerData).length === 0) {
            debug.log("\u26A0\uFE0F No character data found - asking user about GM mode");
            const userConfirmed = confirm("No character data found.\n\nWould you like to open GM mode instead?");
            if (userConfirmed) {
              try {
                postChatMessage("\u{1F451} Opening GM mode...");
                debug.log("\u2705 Chat message posted successfully");
              } catch (error) {
                debug.error("\u274C Error posting chat message:", error);
              }
              try {
                toggleGMMode(true);
                debug.log("\u2705 GM panel opened successfully");
              } catch (error) {
                debug.error("\u274C Error opening GM panel:", error);
              }
              sendResponse({ success: true, message: "GM mode opened" });
            } else {
              debug.log("\u2139\uFE0F User cancelled GM mode opening");
              sendResponse({ success: false, error: "No character data found" });
            }
            return;
          }
          try {
            const overlayElement = document.getElementById("rollcloud-character-overlay");
            if (overlayElement) {
              overlayElement.style.display = "block";
              sendResponse({ success: true });
            } else {
              const event = new CustomEvent("showRollCloudSheet");
              document.dispatchEvent(event);
              sendResponse({ success: true });
            }
          } catch (error) {
            debug.error("Error showing character sheet:", error);
            sendResponse({ success: false, error: error.message });
          }
        } else if (request.action === "forwardToPopup") {
          debug.log("\u{1F9EC} Forwarding roll result to popup:", request);
          debug.log("\u{1F9EC} Available popups:", Object.keys(characterPopups));
          Object.keys(characterPopups).forEach((characterName) => {
            const popup = characterPopups[characterName];
            try {
              if (popup && !popup.closed) {
                debug.log(`\u{1F9EC} Sending to popup for ${characterName}:`, popup);
                popup.postMessage({
                  action: "rollResult",
                  rollResult: request.rollResult,
                  baseRoll: request.baseRoll,
                  rollType: request.rollType,
                  rollName: request.rollName,
                  checkRacialTraits: request.checkRacialTraits
                }, "*");
                debug.log(`\u{1F4E4} Sent rollResult to popup for ${characterName}`);
              } else {
                delete characterPopups[characterName];
                debug.log(`\u{1F5D1}\uFE0F Removed closed popup for ${characterName}`);
              }
            } catch (error) {
              debug.warn(`\u26A0\uFE0F Error sending rollResult to popup "${characterName}":`, error);
              delete characterPopups[characterName];
            }
          });
          sendResponse({ success: true });
        } else if (request.action === "setAutoBackwardsSync") {
          debug.log("\u{1F504} Setting auto backwards sync:", request.enabled);
          if (window.diceCloudSync) {
            if (request.enabled) {
              window.diceCloudSync.enable();
              debug.log("\u2705 Auto backwards sync enabled");
            } else {
              window.diceCloudSync.disable();
              debug.log("\u274C Auto backwards sync disabled");
            }
            sendResponse({ success: true });
          } else {
            debug.warn("\u26A0\uFE0F diceCloudSync not available (not experimental build?)");
            sendResponse({ success: false, error: "Sync not available" });
          }
        } else if (request.action === "useActionFromDiscord") {
          try {
            debug.log("\u2694\uFE0F Received useActionFromDiscord:", request);
            const actionName = request.actionName || "Unknown Action";
            const commandData = request.commandData || {};
            const charName = commandData.character_name || "Character";
            if (!isOurCharacter(charName)) {
              debug.log(`\u23ED\uFE0F Ignoring Discord action for ${charName} (not our character)`);
              sendResponse({ success: true, ignored: true });
              return true;
            }
            const actionData = commandData.action_data || commandData || {};
            debug.log("\u2694\uFE0F Action data:", actionData);
            let announcement = `&{template:default} {{name=${charName} uses ${actionData.name || actionName}!}}`;
            if (actionData.actionType) {
              announcement += ` {{Type=${actionData.actionType}}}`;
            }
            if (actionData.description) {
              announcement += ` {{Description=${actionData.description}}}`;
            }
            postChatMessage(announcement);
            const attackRoll = actionData.attackRoll || actionData.attackBonus;
            if (attackRoll) {
              setTimeout(() => {
                const attackFormula = attackRoll.includes("d") ? attackRoll : `1d20+${attackRoll}`;
                const attackMsg = formatRollForRoll20({
                  name: `${actionData.name || actionName} - Attack`,
                  formula: attackFormula,
                  characterName: charName
                });
                postChatMessage(attackMsg);
              }, 100);
            }
            const damageRoll = actionData.damage || actionData.damageRoll;
            if (damageRoll) {
              setTimeout(() => {
                const damageType = actionData.damageType || "damage";
                const damageMsg = formatRollForRoll20({
                  name: `${actionData.name || actionName} - ${damageType}`,
                  formula: damageRoll,
                  characterName: charName
                });
                postChatMessage(damageMsg);
              }, 200);
            }
            sendResponse({ success: true });
          } catch (useActionError) {
            debug.error("\u274C Error in useActionFromDiscord:", useActionError);
            sendResponse({ success: false, error: useActionError.message });
          }
        } else if (request.action === "castSpellFromDiscord") {
          try {
            debug.log("\u{1F52E} Received castSpellFromDiscord:", request);
            const characterName = request.spellData?.character_name;
            if (characterName && !isOurCharacter(characterName)) {
              debug.log(`\u23ED\uFE0F Ignoring Discord spell for ${characterName} (not our character)`);
              sendResponse({ success: true, ignored: true });
              return true;
            }
            const normalizedSpellData = normalizeDiscordSpellData(request.spellData || {});
            postSpellToRoll20(normalizedSpellData);
            sendResponse({ success: true });
          } catch (castError) {
            debug.error("\u274C Error in castSpellFromDiscord:", castError);
            sendResponse({ success: false, error: castError.message });
          }
        } else if (request.action === "useAbilityFromDiscord") {
          try {
            debug.log("\u2728 Received useAbilityFromDiscord:", request);
            const abilityName = request.abilityName || "Unknown Ability";
            const abilityData = request.abilityData || {};
            const charName = abilityData.character_name || "Character";
            if (!isOurCharacter(charName)) {
              debug.log(`\u23ED\uFE0F Ignoring Discord ability for ${charName} (not our character)`);
              sendResponse({ success: true, ignored: true });
              return true;
            }
            const action = abilityData.action_data || abilityData.action || {};
            const notificationColor = abilityData.notification_color || "#3498db";
            const colorEmoji = getColorEmoji(notificationColor);
            let announcement = `&{template:default} {{name=${colorEmoji} ${charName} uses ${action.name || abilityName}!}}`;
            if (action.actionType) {
              announcement += ` {{Type=${action.actionType}}}`;
            }
            if (action.range) {
              announcement += ` {{Range=${action.range}}}`;
            }
            if (action.description) {
              announcement += ` {{Description=${action.description}}}`;
            }
            postChatMessage(announcement);
            if (action.attackRoll || action.attackBonus) {
              setTimeout(() => {
                try {
                  const attackFormula = action.attackRoll || `1d20+${action.attackBonus}`;
                  const attackMsg = formatRollForRoll20({
                    name: `${action.name || abilityName} - Attack`,
                    formula: attackFormula,
                    characterName: charName
                  });
                  postChatMessage(attackMsg);
                } catch (attackError) {
                  debug.error(`\u274C Failed to roll attack for ${action.name || abilityName}:`, attackError);
                  postChatMessage(`&{template:default} {{name=\u26A0\uFE0F Roll Failed}} {{error=Attack roll for ${action.name || abilityName} failed: ${attackError.message}}}`);
                }
              }, 100);
            }
            if (action.damageRoll || action.damage) {
              setTimeout(() => {
                try {
                  const damageFormula = action.damageRoll || action.damage;
                  const damageType = action.damageType || "damage";
                  const isHealing = damageType.toLowerCase() === "healing";
                  const rollName = isHealing ? `${action.name || abilityName} - Healing` : `${action.name || abilityName} - ${damageType}`;
                  const damageMsg = formatRollForRoll20({
                    name: rollName,
                    formula: damageFormula,
                    characterName: charName
                  });
                  postChatMessage(damageMsg);
                } catch (damageError) {
                  debug.error(`\u274C Failed to roll damage for ${action.name || abilityName}:`, damageError);
                  postChatMessage(`&{template:default} {{name=\u26A0\uFE0F Roll Failed}} {{error=Damage roll for ${action.name || abilityName} failed: ${damageError.message}}}`);
                }
              }, 200);
            }
            sendResponse({ success: true });
          } catch (abilityError) {
            debug.error("\u274C Error in useAbilityFromDiscord:", abilityError);
            sendResponse({ success: false, error: abilityError.message });
          }
        } else if (request.action === "healFromDiscord") {
          try {
            debug.log("\u{1F49A} Received healFromDiscord:", request);
            const amount = request.amount || 0;
            const isTemp = request.isTemp || false;
            const charName = request.characterName || "Character";
            if (!isOurCharacter(charName)) {
              debug.log(`\u23ED\uFE0F Ignoring Discord heal for ${charName} (not our character)`);
              sendResponse({ success: true, ignored: true });
              return true;
            }
            const healType = isTemp ? "Temporary HP" : "HP";
            const emoji = isTemp ? "\u{1F6E1}\uFE0F" : "\u{1F49A}";
            const announcement = `&{template:default} {{name=${emoji} ${charName} ${isTemp ? "gains" : "is healed"}}} {{${healType}=+${amount}}}`;
            postChatMessage(announcement);
            sendResponse({ success: true });
          } catch (healError) {
            debug.error("\u274C Error in healFromDiscord:", healError);
            sendResponse({ success: false, error: healError.message });
          }
        } else if (request.action === "takeDamageFromDiscord") {
          try {
            debug.log("\u{1F494} Received takeDamageFromDiscord:", request);
            const amount = request.amount || 0;
            const damageType = request.damageType || "untyped";
            const charName = request.characterName || "Character";
            if (!isOurCharacter(charName)) {
              debug.log(`\u23ED\uFE0F Ignoring Discord damage for ${charName} (not our character)`);
              sendResponse({ success: true, ignored: true });
              return true;
            }
            const damageTypeDisplay = damageType !== "untyped" ? ` (${damageType})` : "";
            const announcement = `&{template:default} {{name=\u{1F494} ${charName} takes damage}} {{Damage=${amount}${damageTypeDisplay}}}`;
            postChatMessage(announcement);
            sendResponse({ success: true });
          } catch (damageError) {
            debug.error("\u274C Error in takeDamageFromDiscord:", damageError);
            sendResponse({ success: false, error: damageError.message });
          }
        } else if (request.action === "restFromDiscord") {
          try {
            debug.log("\u{1F6CF}\uFE0F Received restFromDiscord:", request);
            const restType = request.restType || "short";
            const charName = request.characterName || "Character";
            if (!isOurCharacter(charName)) {
              debug.log(`\u23ED\uFE0F Ignoring Discord rest for ${charName} (not our character)`);
              sendResponse({ success: true, ignored: true });
              return true;
            }
            const emoji = restType === "short" ? "\u2615" : "\u{1F6CF}\uFE0F";
            const restName = restType === "short" ? "Short Rest" : "Long Rest";
            const announcement = `&{template:default} {{name=${emoji} ${charName} takes a ${restName}}} {{Rest Type=${restName}}}`;
            postChatMessage(announcement);
            sendResponse({ success: true });
          } catch (restError) {
            debug.error("\u274C Error in restFromDiscord:", restError);
            sendResponse({ success: false, error: restError.message });
          }
        } else if (request.action === "endTurnFromDiscord") {
          try {
            debug.log("\u23ED\uFE0F Received endTurnFromDiscord");
            postChatMessage("/e ends their turn.");
            sendResponse({ success: true });
          } catch (endTurnError) {
            debug.error("\u274C Error in endTurnFromDiscord:", endTurnError);
            sendResponse({ success: false, error: endTurnError.message });
          }
        } else if (request.action === "resetUIPositions") {
          try {
            debug.log("\u{1F504} Resetting UI positions");
            const positionKeys = [
              "rollcloud-sheet-toggle_position",
              "rollcloud-status-bar_position",
              "rollcloud-status-bar_size",
              "rollcloud-status-bar_hidden",
              "rollcloud-sheet-toggle_hidden",
              "rollcloud-gm-mode-button_position"
            ];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.includes("_position") || key.includes("_hidden")) && key.includes("rollcloud")) {
                positionKeys.push(key);
              }
            }
            positionKeys.forEach((key) => localStorage.removeItem(key));
            const statusBar = document.querySelector("#rollcloud-status-bar");
            if (statusBar) {
              statusBar.style.transform = "translate(0px, 0px)";
              statusBar.style.width = "";
              statusBar.style.height = "";
              debug.log("\u2705 Reset status bar visual position");
            }
            const sheetToggle = document.querySelector("#rollcloud-sheet-toggle");
            if (sheetToggle) {
              sheetToggle.style.transform = "translate(0px, 0px)";
              debug.log("\u2705 Reset sheet toggle visual position");
            }
            const gmModeButton = document.querySelector("#rollcloud-gm-mode-button");
            if (gmModeButton) {
              gmModeButton.style.transform = "translate(0px, 0px)";
              debug.log("\u2705 Reset GM mode button visual position");
            }
            const characterSheets = document.querySelectorAll('[id^="rollcloud-character-sheet-"]');
            characterSheets.forEach((sheet) => {
              sheet.style.transform = "translate(0px, 0px)";
            });
            if (characterSheets.length > 0) {
              debug.log(`\u2705 Reset ${characterSheets.length} character sheet position(s)`);
            }
            debug.log("\u2705 Reset all positions:", positionKeys);
            sendResponse({ success: true, message: "UI positions reset" });
          } catch (resetError) {
            debug.error("\u274C Error resetting positions:", resetError);
            sendResponse({ success: false, error: resetError.message });
          }
        }
      } catch (outerError) {
        debug.error("\u274C Unexpected error in message listener:", outerError);
        try {
          sendResponse({ success: false, error: "Unexpected error: " + outerError.message });
        } catch (e) {
        }
        return true;
      }
    });
    window.addEventListener("message", (event) => {
      if (event.data && event.data.action) {
        debug.log("\u{1F4E8} [Roll20] Received message with action:", event.data.action, event.data);
      }
      if (event.data.action === "postRollToChat") {
        handleDiceCloudRoll(event.data.roll);
      } else if (event.data.action === "postChat") {
        postChatMessage(event.data.message);
      } else if (event.data.action === "rollFromPopout") {
        debug.log("\u{1F3B2} Received roll request from popup via postMessage:", event.data);
        const rollData = {
          name: event.data.name,
          formula: event.data.formula,
          characterName: event.data.characterName
        };
        if (silentRollsEnabled) {
          debug.log("\u{1F507} Silent rolls active - hiding roll instead of posting");
          const hiddenRoll = {
            id: Date.now() + Math.random(),
            // Unique ID
            name: rollData.name,
            formula: rollData.formula,
            characterName: rollData.characterName,
            timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
            result: null
            // Will be filled when revealed
          };
          hiddenRolls.push(hiddenRoll);
          updateHiddenRollsDisplay();
          if (event.source) {
            event.source.postMessage({
              action: "rollHidden",
              roll: hiddenRoll
            }, "*");
          }
        } else {
          const formattedMessage = formatRollForRoll20(rollData);
          const success = postChatMessage(formattedMessage);
          if (success) {
            debug.log("\u2705 Roll posted directly to Roll20 (no DiceCloud!)");
            observeNextRollResult(rollData);
          }
        }
      } else if (event.data.action === "announceSpell") {
        if (silentRollsEnabled) {
          debug.log("\u{1F507} Silent rolls active - suppressing spell/action announcement");
          return;
        }
        if (event.data.spellData) {
          debug.log("\u{1F52E} Received structured spell data from popup:", event.data);
          const normalizedSpellData = normalizePopupSpellData(event.data);
          postSpellToRoll20(normalizedSpellData);
        } else if (event.data.message) {
          postChatMessage(event.data.message);
        } else {
          handleDiceCloudRoll(event.data);
        }
      }
    });
    let gmModeEnabled = false;
    let silentRollsEnabled = false;
    let gmPanel = null;
    const characterPopups = {};
    let combatStarted = false;
    let initiativeTracker = {
      combatants: [],
      currentTurnIndex: 0,
      round: 1,
      delayedCombatants: []
      // Track combatants who have delayed their turn
    };
    let hiddenRolls = [];
    let turnHistory = [];
    let playerData = {};
    function createGMPanel() {
      if (gmPanel)
        return gmPanel;
      gmPanel = document.createElement("div");
      gmPanel.id = "gm-panel";
      gmPanel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 500px;
      height: 600px;
      min-width: 400px;
      min-height: 400px;
      max-width: 90vw;
      max-height: 90vh;
      background: #1e1e1e;
      border: 2px solid #FC57F9;
      border-radius: 12px;
      z-index: 999998;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      color: #fff;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      display: none;
      flex-direction: column;
      overflow: hidden;
      resize: both;
      visibility: visible;
      opacity: 1;
    `;
      const initiativeTab = document.createElement("div");
      initiativeTab.className = "gm-tab-content";
      initiativeTab.dataset.tab = "initiative";
      initiativeTab.style.display = "block";
      const hiddenRollsTab = document.createElement("div");
      hiddenRollsTab.className = "gm-tab-content";
      hiddenRollsTab.dataset.tab = "hidden-rolls";
      hiddenRollsTab.style.display = "none";
      const playersTab = document.createElement("div");
      playersTab.className = "gm-tab-content";
      playersTab.dataset.tab = "players";
      playersTab.style.display = "none";
      const historyTab = document.createElement("div");
      historyTab.className = "gm-tab-content";
      historyTab.dataset.tab = "history";
      historyTab.style.display = "none";
      const controls = document.createElement("div");
      controls.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 15px;
    `;
      controls.innerHTML = `
      <button id="start-combat-btn" style="padding: 12px; background: #c2185b; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1em; grid-column: span 2; box-shadow: 0 2px 8px rgba(39, 174, 96, 0.3);">\u2694\uFE0F Start Combat</button>
      <button id="prev-turn-btn" style="padding: 8px 12px; background: #3498db; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85em; display: none;">\u2190 Prev</button>
      <button id="next-turn-btn" style="padding: 8px 12px; background: #FC57F9; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85em; display: none;">Next \u2192</button>
      <button id="clear-all-btn" style="padding: 8px 12px; background: #e74c3c; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85em; grid-column: span 2;">\u{1F5D1}\uFE0F Clear All</button>
    `;
      const roundDisplay = document.createElement("div");
      roundDisplay.id = "round-display";
      roundDisplay.style.cssText = `
      text-align: center;
      padding: 8px;
      background: #34495e;
      border-radius: 6px;
      margin-bottom: 15px;
      font-weight: bold;
    `;
      roundDisplay.textContent = "Round 1";
      const initiativeList = document.createElement("div");
      initiativeList.id = "initiative-list";
      initiativeList.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 15px;
    `;
      const addFormSection = document.createElement("div");
      addFormSection.style.cssText = `
      margin-top: 15px;
      padding-top: 15px;
      border-top: 2px solid #34495e;
    `;
      const addFormHeader = document.createElement("div");
      addFormHeader.style.cssText = `
      cursor: pointer;
      user-select: none;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      margin-bottom: 10px;
      background: #34495e;
      border-radius: 6px;
      font-weight: bold;
      transition: background 0.2s;
    `;
      addFormHeader.innerHTML = `
      <span>\u2795 Add Combatant</span>
      <span id="add-form-toggle" style="transition: transform 0.3s; transform: rotate(-90deg);">\u25BC</span>
    `;
      const addForm = document.createElement("div");
      addForm.id = "add-combatant-form";
      addForm.style.cssText = `
      display: block;
      transition: max-height 0.3s ease-out, opacity 0.3s ease-out;
      overflow: hidden;
      max-height: 0;
      opacity: 0;
    `;
      addForm.innerHTML = `
      <input type="text" id="combatant-name-input" placeholder="Combatant name" style="width: 100%; padding: 8px; margin-bottom: 8px; border: 2px solid #34495e; border-radius: 4px; background: #34495e; color: #fff; font-size: 0.9em;" />
      <input type="number" id="combatant-init-input" placeholder="Initiative" style="width: 100%; padding: 8px; margin-bottom: 8px; border: 2px solid #34495e; border-radius: 4px; background: #34495e; color: #fff; font-size: 0.9em;" />
      <button id="add-combatant-btn" style="width: 100%; padding: 8px 12px; background: #3498db; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">\u2795 Add</button>
    `;
      addFormSection.appendChild(addFormHeader);
      addFormSection.appendChild(addForm);
      const endCombatBtn = document.createElement("button");
      endCombatBtn.id = "end-combat-btn";
      endCombatBtn.style.cssText = `
      padding: 12px;
      background: #e74c3c;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      font-size: 1em;
      margin-top: 15px;
      box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
      display: none;
    `;
      endCombatBtn.textContent = "\u{1F6D1} End Combat";
      initiativeTab.appendChild(controls);
      initiativeTab.appendChild(roundDisplay);
      initiativeTab.appendChild(initiativeList);
      initiativeTab.appendChild(addFormSection);
      initiativeTab.appendChild(endCombatBtn);
      hiddenRollsTab.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #888;">
        <div style="font-size: 3em; margin-bottom: 10px;">\u{1F3B2}</div>
        <p style="margin: 0;">No hidden rolls yet</p>
        <p style="font-size: 0.85em; margin-top: 8px;">Rolls made while GM Mode is active will appear here</p>
      </div>
      <div id="hidden-rolls-list" style="display: flex; flex-direction: column; gap: 8px;"></div>
    `;
      playersTab.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0; font-size: 1.2em; color: #FC57F9;">Party Overview</h3>
        <div style="display: flex; gap: 8px;">
          <!-- <button id="import-players-btn" style="padding: 8px 14px; background: #c2185b; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.95em; font-weight: bold;">\u{1F4E5} Import</button> -->
          <button id="refresh-players-btn" style="padding: 8px 14px; background: #9b59b6; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.95em; font-weight: bold;">\u{1F504} Refresh</button>
        </div>
      </div>
      <div style="text-align: center; padding: 20px; color: #888;">
        <div style="font-size: 3em; margin-bottom: 10px;">\u{1F465}</div>
        <p style="margin: 0; font-size: 1.1em;">No players tracked yet</p>
        <p style="font-size: 1em; margin-top: 8px;">Click Import to load character data from storage</p>
      </div>
      <div id="player-overview-list" style="display: flex; flex-direction: column; gap: 10px;"></div>
    `;
      historyTab.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0; font-size: 1em; color: #FC57F9;">Last 10 Turns</h3>
        <button id="export-history-btn" style="padding: 6px 12px; background: #3498db; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.8em;">\u{1F4CB} Copy</button>
      </div>
      <div id="turn-history-empty-state" style="text-align: center; padding: 20px; color: #888;">
        <div style="font-size: 3em; margin-bottom: 10px;">\u{1F4DC}</div>
        <p style="margin: 0;">No turn history yet</p>
        <p style="font-size: 0.85em; margin-top: 8px;">Combat actions will be logged here</p>
      </div>
      <div id="turn-history-list" style="display: flex; flex-direction: column; gap: 8px;"></div>
    `;
      const header = document.createElement("div");
      header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background: #1e1e1e;
      border-bottom: 2px solid #FC57F9;
      cursor: move;
      user-select: none;
    `;
      header.innerHTML = `
      <div>
        <h2 style="margin: 0; font-size: 1.2em; color: #FC57F9;">\u{1F451} GM Panel</h2>
        <div style="display: flex; align-items: center; gap: 15px; margin-top: 8px;">
          <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9em; color: #aaa; cursor: pointer;">
            <input type="checkbox" id="silent-rolls-toggle" style="width: 16px; height: 16px; cursor: pointer;" />
            <span>\u{1F507} Silent Rolls</span>
          </label>
        </div>
      </div>
      <button id="gm-panel-close" style="background: #e74c3c; color: #fff; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.9em;">\u2716</button>
    `;
      const tabNav = document.createElement("div");
      tabNav.style.cssText = `
      display: flex;
      gap: 0;
      background: #1e1e1e;
      border-bottom: 1px solid #34495e;
    `;
      tabNav.innerHTML = `
      <button class="gm-tab-btn" data-tab="initiative" style="flex: 1; padding: 12px; background: #2a2a2a; color: #FC57F9; border: none; border-bottom: 3px solid #FC57F9; cursor: pointer; font-weight: bold; font-size: 0.9em; transition: all 0.2s;">\u2694\uFE0F Initiative</button>
      <button class="gm-tab-btn" data-tab="history" style="flex: 1; padding: 12px; background: transparent; color: #888; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-weight: bold; font-size: 0.9em; transition: all 0.2s;">\u{1F4DC} History</button>
      <button class="gm-tab-btn" data-tab="hidden-rolls" style="flex: 1; padding: 12px; background: transparent; color: #888; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-weight: bold; font-size: 0.9em; transition: all 0.2s;">\u{1F3B2} Hidden Rolls</button>
      <button class="gm-tab-btn" data-tab="players" style="flex: 1; padding: 12px; background: transparent; color: #888; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-weight: bold; font-size: 0.9em; transition: all 0.2s;">\u{1F465} Players</button>
    `;
      const contentWrapper = document.createElement("div");
      contentWrapper.style.cssText = `
      padding: 15px;
      background: #2a2a2a;
      color: #fff;
      border-radius: 0 0 12px 12px;
      overflow-y: auto;
      flex: 1;
    `;
      contentWrapper.appendChild(initiativeTab);
      contentWrapper.appendChild(hiddenRollsTab);
      contentWrapper.appendChild(playersTab);
      contentWrapper.appendChild(historyTab);
      gmPanel.appendChild(header);
      gmPanel.appendChild(tabNav);
      gmPanel.appendChild(contentWrapper);
      document.body.appendChild(gmPanel);
      makeDraggable(gmPanel, header);
      startCharacterBroadcastListener();
      loadPlayerDataFromStorage();
      debug.log("\u{1F9EA} Testing storage functionality...");
      if (browserAPI.storage.local.get instanceof Function) {
        browserAPI.storage.local.get(["characterProfiles"]).then((result) => {
          debug.log("\u{1F9EA} Promise storage test result:", result);
          if (result.characterProfiles) {
            debug.log("\u{1F9EA} Found characterProfiles:", Object.keys(result.characterProfiles));
            Object.keys(result.characterProfiles).forEach((key) => {
              debug.log(`\u{1F9EA} Profile ${key}:`, result.characterProfiles[key].type);
            });
          } else {
            debug.log("\u{1F9EA} No characterProfiles found in storage (Promise)");
          }
        }).catch((error) => {
          debug.error("\u{1F9EA} Promise storage error:", error);
        });
      }
      try {
        browserAPI.storage.local.get(["characterProfiles"], (result) => {
          debug.log("\u{1F9EA} Callback storage test result:", result);
          if (browserAPI.runtime.lastError) {
            debug.error("\u{1F9EA} Callback storage error:", browserAPI.runtime.lastError);
          } else if (result.characterProfiles) {
            debug.log("\u{1F9EA} Found characterProfiles (callback):", Object.keys(result.characterProfiles));
          } else {
            debug.log("\u{1F9EA} No characterProfiles found in storage (callback)");
          }
        });
      } catch (error) {
        debug.error("\u{1F9EA} Callback storage test failed:", error);
      }
      attachGMPanelListeners();
      debug.log("\u2705 GM Panel created");
      return gmPanel;
    }
    function startCharacterBroadcastListener() {
      const chatObserver2 = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const messageContent = node.textContent || node.innerText || "";
              debug.log("\u{1F50D} Chat message detected:", messageContent.substring(0, 100));
              if (messageContent.includes("\u{1F451}[ROLLCLOUD:CHARACTER:") && messageContent.includes("]\u{1F451}")) {
                debug.log("\u{1F451} Detected character broadcast in chat");
                parseCharacterBroadcast(messageContent);
              }
            }
          });
        });
      });
      const chatContainer = document.querySelector(".chat-content") || document.querySelector(".chatlog") || document.querySelector("#textchat") || document.querySelector(".chat");
      if (chatContainer) {
        chatObserver2.observe(chatContainer, {
          childList: true,
          subtree: true
        });
        debug.log("\u{1F451} Started listening for character broadcasts in chat");
      } else {
        debug.warn("\u26A0\uFE0F Could not find chat container for character broadcast listener");
      }
    }
    function parseCharacterBroadcast(message) {
      try {
        const match = message.match(/👑\[ROLLCLOUD:CHARACTER:(.+?)\]👑/);
        if (!match) {
          debug.warn("\u26A0\uFE0F Invalid character broadcast format");
          return;
        }
        const encodedData = match[1];
        const decodedData = JSON.parse(decodeURIComponent(escape(atob(encodedData))));
        if (decodedData.type !== "ROLLCLOUD_CHARACTER_BROADCAST") {
          debug.warn("\u26A0\uFE0F Not a character broadcast message");
          return;
        }
        const character = decodedData.character;
        const fullSheet = decodedData.fullSheet || character;
        debug.log("\u{1F451} Received character broadcast:", character.name);
        debug.log("\u{1F50D} Full sheet data keys:", fullSheet ? Object.keys(fullSheet) : "null");
        debug.log("\u{1F50D} Full sheet sample:", fullSheet ? JSON.stringify(fullSheet, null, 2).substring(0, 500) + "..." : "null");
        updatePlayerData(character.name, fullSheet);
        debug.log(`\u2705 ${character.name} shared their character sheet! \u{1F451}`);
      } catch (error) {
        debug.error("\u274C Error parsing character broadcast:", error);
      }
    }
    function makeDraggable(element, handle) {
      let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      handle.onmousedown = dragMouseDown;
      function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
      }
      function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        requestAnimationFrame(() => {
          const offsetTop = element.offsetTop;
          const offsetLeft = element.offsetLeft;
          const offsetWidth = element.offsetWidth;
          const offsetHeight = element.offsetHeight;
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          let newTop = offsetTop - pos2;
          let newLeft = offsetLeft - pos1;
          const minTop = 0;
          const minLeft = 0;
          const maxLeft = viewportWidth - offsetWidth;
          const maxTop = viewportHeight - offsetHeight;
          newTop = Math.max(minTop, Math.min(newTop, maxTop));
          newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
          element.style.top = newTop + "px";
          element.style.left = newLeft + "px";
          element.style.right = "auto";
        });
      }
      function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
      }
    }
    function attachGMPanelListeners() {
      const silentRollsToggle = document.getElementById("silent-rolls-toggle");
      if (silentRollsToggle) {
        silentRollsToggle.addEventListener("change", (e) => {
          silentRollsEnabled = e.target.checked;
          debug.log(`\u{1F507} Silent rolls ${silentRollsEnabled ? "enabled" : "disabled"}`);
          const hiddenRollsTab = gmPanel.querySelector('[data-tab="hidden-rolls"]');
          if (hiddenRollsTab) {
            const description = hiddenRollsTab.querySelector("p:nth-child(2)");
            if (description) {
              description.textContent = silentRollsEnabled ? "Rolls made while silent rolls is enabled will appear here" : "Rolls made while GM Mode is active will appear here";
            }
          }
        });
      }
      const tabButtons = gmPanel.querySelectorAll(".gm-tab-btn");
      const tabContents = gmPanel.querySelectorAll(".gm-tab-content");
      tabButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const targetTab = btn.dataset.tab;
          tabButtons.forEach((b) => {
            if (b.dataset.tab === targetTab) {
              b.style.background = "#2a2a2a";
              b.style.color = "#FC57F9";
              b.style.borderBottom = "3px solid #FC57F9";
            } else {
              b.style.background = "transparent";
              b.style.color = "#888";
              b.style.borderBottom = "3px solid transparent";
            }
          });
          tabContents.forEach((content) => {
            content.style.display = content.dataset.tab === targetTab ? "block" : "none";
          });
          debug.log(`\u{1F4D1} Switched to GM tab: ${targetTab}`);
        });
      });
      const closeBtn = document.getElementById("gm-panel-close");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => toggleGMMode(false));
      }
      const startCombatBtn = document.getElementById("start-combat-btn");
      const nextBtn = document.getElementById("next-turn-btn");
      const prevBtn = document.getElementById("prev-turn-btn");
      const clearAllBtn = document.getElementById("clear-all-btn");
      const endCombatBtn = document.getElementById("end-combat-btn");
      debug.log("\u{1F50D} GM Panel controls found:", {
        startCombatBtn: !!startCombatBtn,
        nextBtn: !!nextBtn,
        prevBtn: !!prevBtn,
        clearAllBtn: !!clearAllBtn,
        endCombatBtn: !!endCombatBtn
      });
      if (startCombatBtn)
        startCombatBtn.addEventListener("click", startCombat);
      if (nextBtn)
        nextBtn.addEventListener("click", nextTurn);
      if (prevBtn)
        prevBtn.addEventListener("click", prevTurn);
      if (clearAllBtn)
        clearAllBtn.addEventListener("click", clearAllCombatants);
      if (endCombatBtn)
        endCombatBtn.addEventListener("click", endCombat);
      const addFormHeader = gmPanel.querySelector('div[style*="cursor: pointer"]');
      const addForm = document.getElementById("add-combatant-form");
      const addFormToggle = document.getElementById("add-form-toggle");
      let isFormCollapsed = true;
      if (addFormHeader && addForm && addFormToggle) {
        addFormHeader.addEventListener("click", () => {
          isFormCollapsed = !isFormCollapsed;
          if (isFormCollapsed) {
            addForm.style.maxHeight = "0";
            addForm.style.opacity = "0";
            addFormToggle.style.transform = "rotate(-90deg)";
          } else {
            addForm.style.maxHeight = "500px";
            addForm.style.opacity = "1";
            addFormToggle.style.transform = "rotate(0deg)";
          }
        });
      }
      const addBtn = document.getElementById("add-combatant-btn");
      const nameInput = document.getElementById("combatant-name-input");
      const initInput = document.getElementById("combatant-init-input");
      if (addBtn && nameInput && initInput) {
        addBtn.addEventListener("click", () => {
          const name = nameInput.value.trim();
          const initiative = parseInt(initInput.value);
          if (name && !isNaN(initiative)) {
            addCombatant(name, initiative, "manual");
            nameInput.value = "";
            initInput.value = "";
          }
        });
        initInput.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            addBtn.click();
          }
        });
      }
      const exportHistoryBtn = document.getElementById("export-history-btn");
      if (exportHistoryBtn) {
        exportHistoryBtn.addEventListener("click", exportTurnHistory);
      }
      const importPlayersBtn = document.getElementById("import-players-btn");
      if (importPlayersBtn) {
        importPlayersBtn.addEventListener("click", importPlayerData);
      }
      const refreshPlayersBtn = document.getElementById("refresh-players-btn");
      if (refreshPlayersBtn) {
        refreshPlayersBtn.addEventListener("click", () => {
          updatePlayerOverviewDisplay();
          debug.log("\u{1F504} Refreshed player overview");
        });
      }
      debug.log("\u2705 GM Panel listeners attached");
    }
    function updateHiddenRollsDisplay() {
      const hiddenRollsList = document.getElementById("hidden-rolls-list");
      if (!hiddenRollsList)
        return;
      if (hiddenRolls.length === 0) {
        hiddenRollsList.innerHTML = "";
        const tabContent2 = gmPanel.querySelector('[data-tab="hidden-rolls"]');
        if (tabContent2) {
          const emptyState = tabContent2.querySelector('div[style*="text-align: center"]');
          if (emptyState)
            emptyState.style.display = "block";
        }
        return;
      }
      const tabContent = gmPanel.querySelector('[data-tab="hidden-rolls"]');
      if (tabContent) {
        const emptyState = tabContent.querySelector('div[style*="text-align: center"]');
        if (emptyState)
          emptyState.style.display = "none";
      }
      hiddenRollsList.innerHTML = hiddenRolls.map((roll, index) => `
      <div style="background: #34495e; padding: 12px; border-radius: 8px; border-left: 4px solid #f39c12;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
          <div style="flex: 1;">
            <div style="font-weight: bold; color: #f39c12; margin-bottom: 4px;">${roll.characterName}</div>
            <div style="font-size: 0.9em; color: #ccc;">${roll.name}</div>
            <div style="font-size: 0.85em; color: #888; margin-top: 4px;">${roll.timestamp}</div>
          </div>
          <div style="font-size: 1.2em; color: #f39c12;">\u{1F512}</div>
        </div>
        <div style="background: #2c3e50; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 0.9em; margin-bottom: 10px;">
          ${roll.formula}
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="reveal-roll-btn" data-roll-id="${roll.id}" style="flex: 1; padding: 8px; background: #c2185b; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85em;">
            \u{1F4E2} Publish Roll
          </button>
          <button class="delete-roll-btn" data-roll-id="${roll.id}" style="padding: 8px 12px; background: #e74c3c; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85em;">
            \u{1F5D1}\uFE0F
          </button>
        </div>
      </div>
    `).join("");
      const revealRollBtns = hiddenRollsList.querySelectorAll(".reveal-roll-btn");
      const deleteRollBtns = hiddenRollsList.querySelectorAll(".delete-roll-btn");
      revealRollBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const rollId = btn.dataset.rollId;
          revealHiddenRoll(rollId);
        });
      });
      deleteRollBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const rollId = btn.dataset.rollId;
          deleteHiddenRoll(rollId);
        });
      });
      debug.log(`\u{1F4CB} Updated hidden rolls display: ${hiddenRolls.length} rolls`);
    }
    window.revealHiddenRoll = function(rollId) {
      const rollIndex = hiddenRolls.findIndex((r) => r.id === rollId);
      if (rollIndex === -1)
        return;
      const roll = hiddenRolls[rollIndex];
      debug.log("\u{1F513} Revealing hidden roll:", roll);
      const formattedMessage = `GM roll: **${roll.characterName}** rolled ${roll.name}! **[[${roll.formula}]]**`;
      const success = postChatMessage(formattedMessage);
      if (success) {
        debug.log("\u2705 Hidden roll revealed to Roll20");
        hiddenRolls.splice(rollIndex, 1);
        updateHiddenRollsDisplay();
      } else {
        debug.error("\u274C Failed to reveal hidden roll");
      }
    };
    window.deleteHiddenRoll = function(rollId) {
      const rollIndex = hiddenRolls.findIndex((r) => r.id === rollId);
      if (rollIndex === -1)
        return;
      hiddenRolls.splice(rollIndex, 1);
      updateHiddenRollsDisplay();
      debug.log("\u{1F5D1}\uFE0F Deleted hidden roll");
    };
    function createPlayerHeader(name, player, playerId) {
      const hpPercent = player.maxHp > 0 ? player.hp / player.maxHp * 100 : 0;
      const hpColor = hpPercent > 50 ? "#c2185b" : hpPercent > 25 ? "#f39c12" : "#e74c3c";
      return `
      <div style="background: #34495e; border-radius: 8px; border-left: 4px solid ${hpColor}; overflow: hidden;">
        <!-- Player Header (always visible) -->
        <div class="player-header-btn" data-player-name="${name}" style="padding: 12px; cursor: pointer; user-select: none; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s;" onmouseover="this.style.background='#3d5a6e'" onmouseout="this.style.background='transparent'">
          <div style="flex: 1;">
            <div style="font-weight: bold; font-size: 1.1em; color: #FC57F9; margin-bottom: 4px;">${name}</div>
            <div style="display: flex; gap: 12px; font-size: 0.95em; color: #ccc;">
              <span>HP: ${player.hp}/${player.maxHp}</span>
              <span>AC: ${player.ac || "\u2014"}</span>
              <span>Init: ${player.initiative || "\u2014"}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span id="${playerId}-toggle" style="transition: transform 0.3s; transform: rotate(-90deg); color: #888; font-size: 1.1em;">\u25BC</span>
            <button class="player-delete-btn" data-player-name="${name}" style="padding: 4px 8px; background: #e74c3c; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8em; font-weight: bold;" title="Remove player">\u{1F5D1}\uFE0F</button>
          </div>
        </div>
    `;
    }
    function updatePlayerOverviewDisplay() {
      const playerOverviewList = document.getElementById("player-overview-list");
      if (!playerOverviewList)
        return;
      const players = Object.keys(playerData);
      if (players.length === 0) {
        playerOverviewList.innerHTML = "";
        const tabContent2 = gmPanel.querySelector('[data-tab="players"]');
        if (tabContent2) {
          const emptyState = tabContent2.querySelector('div[style*="text-align: center"]');
          if (emptyState)
            emptyState.style.display = "block";
        }
        return;
      }
      const tabContent = gmPanel.querySelector('[data-tab="players"]');
      if (tabContent) {
        const emptyState = tabContent.querySelector('div[style*="text-align: center"]');
        if (emptyState)
          emptyState.style.display = "none";
      }
      playerOverviewList.innerHTML = players.map((name, index) => {
        const player = playerData[name];
        const playerId = `player-${index}`;
        const hpPercent = player.maxHp > 0 ? player.hp / player.maxHp * 100 : 0;
        const hpColor = hpPercent > 50 ? "#c2185b" : hpPercent > 25 ? "#f39c12" : "#e74c3c";
        return createPlayerHeader(name, player, playerId) + `

          <!-- Detailed View (collapsible) -->
          <div id="${playerId}-details" style="max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.3s ease-out, opacity 0.3s ease-out;">
            <div style="padding: 0 12px 12px 12px;">
              <!-- Character Sub-tabs -->
              <div style="display: flex; gap: 4px; margin-bottom: 10px; border-bottom: 1px solid #2c3e50;">
                <button class="player-subtab-btn" data-player="${playerId}" data-subtab="overview" style="padding: 8px 12px; background: transparent; color: #FC57F9; border: none; border-bottom: 2px solid #FC57F9; cursor: pointer; font-size: 0.9em; font-weight: bold;">Overview</button>
                <button class="player-subtab-btn" data-player="${playerId}" data-subtab="combat" style="padding: 8px 12px; background: transparent; color: #888; border: none; border-bottom: 2px solid transparent; cursor: pointer; font-size: 0.9em;">Combat</button>
                <button class="player-subtab-btn" data-player="${playerId}" data-subtab="status" style="padding: 8px 12px; background: transparent; color: #888; border: none; border-bottom: 2px solid transparent; cursor: pointer; font-size: 0.9em;">Status</button>
              </div>

              <!-- Overview Tab -->
              <div class="player-subtab-content" data-player="${playerId}" data-subtab="overview" style="display: block;">
                <!-- HP Bar -->
                <div style="margin-bottom: 10px;">
                  <div style="display: flex; justify-content: space-between; font-size: 0.95em; color: #ccc; margin-bottom: 4px;">
                    <span>Hit Points</span>
                    <span>${player.hp}/${player.maxHp}</span>
                  </div>
                  <div style="width: 100%; height: 12px; background: #2c3e50; border-radius: 5px; overflow: hidden;">
                    <div style="width: ${hpPercent}%; height: 100%; background: ${hpColor}; transition: width 0.3s;"></div>
                  </div>
                </div>

                <!-- Stats Grid -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                  <div style="background: #2c3e50; padding: 8px; border-radius: 4px; text-align: center;">
                    <div style="font-size: 0.85em; color: #888;">Armor Class</div>
                    <div style="font-weight: bold; color: #fff; font-size: 1.3em;">${player.ac || "\u2014"}</div>
                  </div>
                  <div style="background: #2c3e50; padding: 8px; border-radius: 4px; text-align: center;">
                    <div style="font-size: 0.85em; color: #888;">Passive Perception</div>
                    <div style="font-weight: bold; color: #fff; font-size: 1.3em;">${player.passivePerception || "\u2014"}</div>
                  </div>
                  <div style="background: #2c3e50; padding: 8px; border-radius: 4px; text-align: center;">
                    <div style="font-size: 0.85em; color: #888;">Initiative</div>
                    <div style="font-weight: bold; color: #fff; font-size: 1.3em;">${player.initiative || "\u2014"}</div>
                  </div>
                </div>
              </div>

              <!-- Combat Tab -->
              <div class="player-subtab-content" data-player="${playerId}" data-subtab="combat" style="display: none;">
                <div style="background: #2c3e50; padding: 10px; border-radius: 4px; margin-bottom: 8px;">
                  <div style="font-size: 0.95em; color: #888; margin-bottom: 6px;">Attack Roll</div>
                  <div style="font-size: 0.9em; color: #ccc;">Click character sheet to make attacks</div>
                </div>
                <div style="background: #2c3e50; padding: 10px; border-radius: 4px;">
                  <div style="font-size: 0.95em; color: #888; margin-bottom: 6px;">Combat Stats</div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="font-size: 0.9em; color: #ccc;">AC:</span>
                    <span style="font-size: 0.9em; color: #fff; font-weight: bold;">${player.ac || "\u2014"}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="font-size: 0.9em; color: #ccc;">Initiative:</span>
                    <span style="font-size: 0.9em; color: #fff; font-weight: bold;">${player.initiative || "\u2014"}</span>
                  </div>
                </div>
              </div>

              <!-- Status Tab -->
              <div class="player-subtab-content" data-player="${playerId}" data-subtab="status" style="display: none;">
                <!-- Conditions -->
                ${player.conditions && player.conditions.length > 0 ? `
                  <div style="margin-bottom: 10px;">
                    <div style="font-size: 0.95em; color: #888; margin-bottom: 6px;">Active Conditions</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                      ${player.conditions.map((c) => `<span style="background: #e74c3c; padding: 5px 12px; border-radius: 4px; font-size: 0.9em; font-weight: bold;">${c}</span>`).join("")}
                    </div>
                  </div>
                ` : '<div style="padding: 10px; text-align: center; color: #888; font-size: 0.95em;">No active conditions</div>'}

                <!-- Concentration -->
                ${player.concentrationSpell ? `
                  <div style="background: #9b59b6; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
                    <div style="font-size: 0.95em; font-weight: bold; margin-bottom: 4px;">\u{1F9E0} Concentrating</div>
                    <div style="font-size: 0.9em;">${player.concentrationSpell}</div>
                  </div>
                ` : ""}

                <!-- Death Saves (if unconscious) -->
                ${player.deathSaves ? `
                  <div style="background: #c0392b; padding: 10px; border-radius: 4px;">
                    <div style="font-size: 0.95em; font-weight: bold; margin-bottom: 6px;">\u{1F480} Death Saving Throws</div>
                    <div style="display: flex; justify-content: space-around; font-size: 0.9em;">
                      <div>
                        <div style="color: #c2185b; font-weight: bold;">Successes</div>
                        <div style="font-size: 1.3em; text-align: center;">\u2713 ${player.deathSaves.successes || 0}</div>
                      </div>
                      <div>
                        <div style="color: #e74c3c; font-weight: bold;">Failures</div>
                        <div style="font-size: 1.3em; text-align: center;">\u2717 ${player.deathSaves.failures || 0}</div>
                      </div>
                    </div>
                  </div>
                ` : ""}
              </div>
            </div>
          </div>
        </div>
      `;
      }).join("");
      debug.log(`\u{1F465} Updated player overview: ${players.length} players`);
      document.querySelectorAll(".player-header-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const playerName = btn.dataset.playerName;
          showFullCharacterModal(playerName);
        });
      });
      document.querySelectorAll(".player-delete-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const playerName = btn.dataset.playerName;
          deletePlayerFromGM(playerName);
        });
      });
    }
    function updatePlayerData(characterName, data) {
      if (!playerData[characterName]) {
        playerData[characterName] = {};
      }
      Object.assign(playerData[characterName], data);
      savePlayerDataToStorage();
      if (gmModeEnabled) {
        updatePlayerOverviewDisplay();
      }
      debug.log(`\u{1F464} Updated player data for ${characterName}:`, playerData[characterName]);
    }
    function savePlayerDataToStorage() {
      debug.log("\u{1F4BE} Attempting to save player data:", Object.keys(playerData));
      return browserAPI.storage.local.get(["characterProfiles"]).then((result) => {
        const existingProfiles = result.characterProfiles || {};
        Object.keys(existingProfiles).forEach((key) => {
          if (existingProfiles[key].type === "rollcloudPlayer") {
            delete existingProfiles[key];
          }
        });
        Object.keys(playerData).forEach((playerName) => {
          existingProfiles[playerName] = {
            ...playerData[playerName],
            type: "rollcloudPlayer",
            lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
          };
          debug.log(`\u{1F4BE} Preparing to save player: ${playerName}, type: rollcloudPlayer`);
        });
        return new Promise((resolve, reject) => {
          browserAPI.storage.local.set({
            characterProfiles: existingProfiles
          }, () => {
            if (browserAPI.runtime.lastError) {
              debug.error("\u274C Error saving to storage:", browserAPI.runtime.lastError);
              reject(browserAPI.runtime.lastError);
            } else {
              debug.log("\u2705 Successfully saved player data to characterProfiles storage");
              debug.log("\u{1F4BE} Total profiles in storage:", Object.keys(existingProfiles).length);
              resolve();
            }
          });
        });
      }).catch((error) => {
        debug.error("\u274C Error reading existing profiles before save:", error);
        throw error;
      });
    }
    function loadPlayerDataFromStorage() {
      return browserAPI.storage.local.get(["characterProfiles"]).then((result) => {
        if (result.characterProfiles) {
          playerData = {};
          Object.keys(result.characterProfiles).forEach((key) => {
            const profile = result.characterProfiles[key];
            if (profile.type === "rollcloudPlayer") {
              playerData[key] = profile;
            }
          });
          debug.log(`\u{1F4C2} Loaded ${Object.keys(playerData).length} GM players from storage`);
          if (gmModeEnabled) {
            updatePlayerOverviewDisplay();
          }
        }
      }).catch((error) => {
        debug.error("\u274C Error loading player data from storage:", error);
      });
    }
    function deletePlayerData(characterName) {
      if (playerData[characterName]) {
        delete playerData[characterName];
        savePlayerDataToStorage();
        if (gmModeEnabled) {
          updatePlayerOverviewDisplay();
        }
        debug.log(`\u{1F5D1}\uFE0F Deleted player data for ${characterName}`);
      }
    }
    window.deletePlayerFromGM = function(characterName) {
      if (confirm(`Remove ${characterName} from GM Panel?`)) {
        deletePlayerData(characterName);
      }
    };
    window.togglePlayerDetails = function(playerId) {
      const details = document.getElementById(`${playerId}-details`);
      const toggle = document.getElementById(`${playerId}-toggle`);
      if (!details || !toggle)
        return;
      const isExpanded = details.style.maxHeight && details.style.maxHeight !== "0px";
      if (isExpanded) {
        details.style.maxHeight = "0";
        details.style.opacity = "0";
        toggle.style.transform = "rotate(-90deg)";
      } else {
        details.style.maxHeight = "1000px";
        details.style.opacity = "1";
        toggle.style.transform = "rotate(0deg)";
        attachPlayerSubtabListeners(playerId);
      }
    };
    window.showFullCharacterModal = function(playerName) {
      const player = playerData[playerName];
      if (!player) {
        debug.warn(`\u26A0\uFE0F No data found for player: ${playerName}`);
        return;
      }
      const openPopups = Object.entries(characterPopups).filter(([name, popup2]) => popup2 && !popup2.closed);
      if (openPopups.length > 0) {
        const [existingPlayerName, existingPopup] = openPopups[0];
        if (existingPlayerName === playerName) {
          existingPopup.focus();
          debug.log(`\u{1F441}\uFE0F Focused existing character popup for ${playerName}`);
          return;
        }
        debug.log(`\u{1F504} Closing popup for ${existingPlayerName} to open ${playerName}`);
        existingPopup.close();
        delete characterPopups[existingPlayerName];
      }
      const popup = window.open(browserAPI.runtime.getURL("src/popup-sheet.html"), `character-${playerName}`, "width=900,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no");
      if (!popup) {
        debug.error("\u274C Failed to open popup window - please allow popups for this site");
        return;
      }
      characterPopups[playerName] = popup;
      window.currentPopoutPlayer = player;
      window.currentPopoutPlayerName = playerName;
      window.addEventListener("message", function(event) {
        if (event.data && event.data.action === "requestCharacterData") {
          popup.postMessage({
            action: "loadCharacterData",
            characterData: window.currentPopoutPlayer
          }, "*");
        }
      });
      debug.log(`\u{1FA9F} Opened character popup for ${playerName}`);
    };
    function attachPlayerSubtabListeners(playerId) {
      const subtabBtns = document.querySelectorAll(`.player-subtab-btn[data-player="${playerId}"]`);
      const subtabContents = document.querySelectorAll(`.player-subtab-content[data-player="${playerId}"]`);
      subtabBtns.forEach((btn) => {
        btn.replaceWith(btn.cloneNode(true));
      });
      const newSubtabBtns = document.querySelectorAll(`.player-subtab-btn[data-player="${playerId}"]`);
      newSubtabBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const targetSubtab = btn.dataset.subtab;
          newSubtabBtns.forEach((b) => {
            if (b.dataset.subtab === targetSubtab) {
              b.style.color = "#FC57F9";
              b.style.borderBottom = "2px solid #FC57F9";
            } else {
              b.style.color = "#888";
              b.style.borderBottom = "2px solid transparent";
            }
          });
          subtabContents.forEach((content) => {
            content.style.display = content.dataset.subtab === targetSubtab ? "block" : "none";
          });
        });
      });
    }
    function importPlayerData() {
      debug.log("\u{1F4E5} Importing player data from storage...");
      chrome.storage.local.get(["characterProfiles"], (result) => {
        if (chrome.runtime.lastError) {
          debug.error("\u274C Failed to import player data:", chrome.runtime.lastError);
          postChatMessage("\u274C Failed to import character data");
          return;
        }
        const characterProfiles = result.characterProfiles || {};
        const profileKeys = Object.keys(characterProfiles);
        if (profileKeys.length === 0) {
          debug.log("\u26A0\uFE0F No character profiles found in storage");
          postChatMessage("\u26A0\uFE0F No character data found. Please sync a character from Dice Cloud first.");
          return;
        }
        playerData = {};
        profileKeys.forEach((profileId) => {
          const character = characterProfiles[profileId];
          if (!character || !character.name) {
            debug.warn(`\u26A0\uFE0F Skipping invalid character profile: ${profileId}`);
            return;
          }
          playerData[character.name] = {
            // Basic stats
            hp: character.hp?.current ?? character.hitPoints?.current ?? 0,
            maxHp: character.hp?.max ?? character.hitPoints?.max ?? 0,
            ac: character.armorClass ?? character.ac ?? 10,
            initiative: character.initiative ?? 0,
            passivePerception: character.passivePerception ?? 10,
            proficiency: character.proficiency ?? 0,
            speed: character.speed ?? "30 ft",
            // Character info
            name: character.name,
            class: character.class || "Unknown",
            level: character.level || 1,
            race: character.race || "Unknown",
            hitDice: character.hitDice || "10",
            // Abilities
            attributes: character.attributes || {
              strength: 10,
              dexterity: 10,
              constitution: 10,
              intelligence: 10,
              wisdom: 10,
              charisma: 10
            },
            // Skills
            skills: character.skills || [],
            // Actions
            actions: character.actions || [],
            // Combat status
            conditions: character.conditions || [],
            concentration: character.concentration || null,
            deathSaves: character.deathSaves || null,
            // Type marking for storage
            type: "rollcloudPlayer",
            lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
          };
          debug.log(`\u2705 Imported player: ${character.name} (HP: ${character.hp?.current ?? character.hitPoints?.current ?? 0}/${character.hp?.max ?? character.hitPoints?.max ?? 0}, AC: ${character.armorClass ?? character.ac ?? 10})`);
        });
        updatePlayerOverviewDisplay();
        const playerCount = Object.keys(playerData).length;
        debug.log(`\u2705 Successfully imported ${playerCount} player(s)`);
        postChatMessage(`\u2705 GM imported ${playerCount} character(s) to party overview`);
      });
    }
    function exportPlayerData() {
      if (Object.keys(playerData).length === 0) {
        debug.log("\u26A0\uFE0F No player data to export");
        return;
      }
      const exportText = Object.keys(playerData).map((name) => {
        const player = playerData[name];
        return `**${name}**
HP: ${player.hp}/${player.maxHp}
AC: ${player.ac || "\u2014"}
Initiative: ${player.initiative || "\u2014"}
Passive Perception: ${player.passivePerception || "\u2014"}
${player.conditions && player.conditions.length > 0 ? `Conditions: ${player.conditions.join(", ")}` : ""}
${player.concentration ? `Concentrating: ${player.concentration}` : ""}
${player.deathSaves ? `Death Saves: \u2713${player.deathSaves.successes || 0} / \u2717${player.deathSaves.failures || 0}` : ""}
`;
      }).join("\n---\n\n");
      navigator.clipboard.writeText(exportText).then(() => {
        debug.log("\u2705 Player data copied to clipboard");
        postChatMessage("\u{1F4CB} GM exported party overview to clipboard");
      }).catch((err) => {
        debug.error("\u274C Failed to copy player data:", err);
      });
    }
    function logTurnAction(action) {
      const historyEntry = {
        timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
        round: initiativeTracker.round,
        turnIndex: initiativeTracker.currentTurnIndex,
        combatant: getCurrentCombatant()?.name || "Unknown",
        ...action
      };
      turnHistory.unshift(historyEntry);
      if (turnHistory.length > 10) {
        turnHistory = turnHistory.slice(0, 10);
      }
      updateTurnHistoryDisplay();
      debug.log("\u{1F4DC} Logged turn action:", historyEntry);
    }
    function updateTurnHistoryDisplay() {
      const turnHistoryList = document.getElementById("turn-history-list");
      const emptyState = document.getElementById("turn-history-empty-state");
      if (!turnHistoryList)
        return;
      if (turnHistory.length === 0) {
        turnHistoryList.innerHTML = "";
        if (emptyState)
          emptyState.style.display = "block";
        return;
      }
      if (emptyState)
        emptyState.style.display = "none";
      turnHistoryList.innerHTML = turnHistory.map((entry, index) => {
        const actionIcon = entry.action === "attack" ? "\u2694\uFE0F" : entry.action === "spell" ? "\u2728" : entry.action === "damage" ? "\u{1F494}" : entry.action === "healing" ? "\u{1F49A}" : entry.action === "condition" ? "\u{1F3AF}" : entry.action === "turn" ? "\u{1F504}" : "\u{1F4DD}";
        return `
        <div style="background: #34495e; padding: 10px; border-radius: 6px; border-left: 4px solid #3498db;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
            <div>
              <span style="font-weight: bold; color: #FC57F9;">${entry.combatant}</span>
              <span style="font-size: 0.75em; color: #888; margin-left: 8px;">Round ${entry.round}</span>
            </div>
            <span style="font-size: 0.75em; color: #888;">${entry.timestamp}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 0.9em;">
            <span style="font-size: 1.2em;">${actionIcon}</span>
            <span style="color: #ccc;">${entry.description}</span>
          </div>
          ${entry.damage ? `<div style="margin-top: 4px; font-size: 0.85em; color: #e74c3c;">Damage: ${entry.damage}</div>` : ""}
          ${entry.healing ? `<div style="margin-top: 4px; font-size: 0.85em; color: #c2185b;">Healing: ${entry.healing}</div>` : ""}
          ${entry.condition ? `<div style="margin-top: 4px; font-size: 0.85em; color: #f39c12;">Condition: ${entry.condition}</div>` : ""}
        </div>
      `;
      }).join("");
      debug.log(`\u{1F4DC} Updated turn history: ${turnHistory.length} entries`);
    }
    function exportTurnHistory() {
      const historyText = turnHistory.map((entry) => {
        let text = `[Round ${entry.round}] ${entry.combatant} - ${entry.description}`;
        if (entry.damage)
          text += ` (Damage: ${entry.damage})`;
        if (entry.healing)
          text += ` (Healing: ${entry.healing})`;
        if (entry.condition)
          text += ` (Condition: ${entry.condition})`;
        return text;
      }).join("\n");
      navigator.clipboard.writeText(historyText).then(() => {
        postChatMessage("\u{1F4CB} Turn history copied to clipboard");
        debug.log("\u{1F4CB} Turn history exported to clipboard");
      }).catch((err) => {
        debug.error("\u274C Failed to copy turn history:", err);
      });
    }
    function toggleGMMode(enabled) {
      const previousState = gmModeEnabled;
      gmModeEnabled = enabled !== void 0 ? enabled : !gmModeEnabled;
      debug.log(`\u{1F451} toggleGMMode called with enabled=${enabled}, previousState=${previousState}, newState=${gmModeEnabled}`);
      if (!gmPanel) {
        debug.log("\u{1F451} Creating GM panel...");
        createGMPanel();
      }
      if (!gmPanel) {
        debug.error("\u274C Failed to create GM panel!");
        return;
      }
      gmPanel.style.display = gmModeEnabled ? "flex" : "none";
      if (gmModeEnabled) {
        debug.log("\u{1F50D} GM Panel display set to flex");
        debug.log("\u{1F50D} GM Panel offsetWidth:", gmPanel.offsetWidth);
        debug.log("\u{1F50D} GM Panel offsetHeight:", gmPanel.offsetHeight);
        debug.log("\u{1F50D} GM Panel computed display:", window.getComputedStyle(gmPanel).display);
        debug.log("\u{1F50D} GM Panel parent:", gmPanel.parentElement);
        debug.log("\u{1F50D} GM Panel style:", gmPanel.style.cssText);
        const rect = gmPanel.getBoundingClientRect();
        debug.log("\u{1F50D} GM Panel bounding rect:", rect);
        debug.log("\u{1F50D} Is panel in viewport:", rect.width > 0 && rect.height > 0);
        setTimeout(() => {
          debug.log("\u{1F50D} Delayed check - GM Panel display:", window.getComputedStyle(gmPanel).display);
          debug.log("\u{1F50D} Delayed check - GM Panel visible:", gmPanel.offsetWidth > 0);
          if (gmPanel.offsetWidth === 0) {
            debug.warn("\u26A0\uFE0F GM Panel has zero width, trying to force visibility...");
            gmPanel.style.visibility = "visible";
            gmPanel.style.opacity = "1";
            gmPanel.style.display = "flex";
            gmPanel.style.width = "500px";
            gmPanel.style.height = "600px";
            debug.log("\u{1F50D} Forced visibility styles applied");
          }
        }, 100);
      }
      if (gmModeEnabled) {
        gmPanel.style.borderColor = "#FC57F9";
        gmPanel.style.boxShadow = "0 8px 32px rgba(78, 205, 196, 0.6)";
      } else {
        gmPanel.style.borderColor = "#FC57F9";
        gmPanel.style.boxShadow = "0 8px 32px rgba(0,0,0,0.5)";
      }
      if (gmModeEnabled) {
        startChatMonitoring();
      } else {
        stopChatMonitoring();
        Object.keys(characterPopups).forEach((characterName) => {
          const popup = characterPopups[characterName];
          try {
            if (popup && !popup.closed) {
              popup.close();
              debug.log(`\u{1F512} Closed shared character sheet for: ${characterName}`);
            }
          } catch (error) {
            debug.warn(`\u26A0\uFE0F Error closing popup for ${characterName}:`, error);
          }
          delete characterPopups[characterName];
        });
        debug.log("\u{1F512} All shared character sheets closed");
      }
      if (previousState !== gmModeEnabled) {
        const message = gmModeEnabled ? "\u{1F451} GM Panel is now active" : "\u{1F451} GM Panel deactivated";
        setTimeout(() => {
          postChatMessage(message);
        }, 100);
      }
      debug.log(`\u{1F451} GM Mode ${gmModeEnabled ? "enabled" : "disabled"}`);
    }
    function addCombatant(name, initiative, source = "chat") {
      debug.log(`\u{1F3B2} addCombatant called: name="${name}", initiative=${initiative}, source=${source}`);
      debug.log(`\u{1F3B2} Current combatants:`, initiativeTracker.combatants.map((c) => c.name));
      const exists = initiativeTracker.combatants.find((c) => c.name === name);
      if (exists) {
        debug.log(`\u26A0\uFE0F Combatant "${name}" already in tracker, updating initiative from ${exists.initiative} to ${initiative}`);
        exists.initiative = initiative;
        initiativeTracker.combatants.sort((a, b) => b.initiative - a.initiative);
        updateInitiativeDisplay();
        return;
      }
      initiativeTracker.combatants.push({
        name,
        initiative,
        source
      });
      initiativeTracker.combatants.sort((a, b) => b.initiative - a.initiative);
      updateInitiativeDisplay();
      debug.log(`\u2705 Added combatant: "${name}" (Init: ${initiative})`);
      debug.log(`\u2705 Total combatants now: ${initiativeTracker.combatants.length}`);
    }
    function removeCombatant(name) {
      const index = initiativeTracker.combatants.findIndex((c) => c.name === name);
      if (index !== -1) {
        initiativeTracker.combatants.splice(index, 1);
        if (initiativeTracker.currentTurnIndex >= initiativeTracker.combatants.length) {
          initiativeTracker.currentTurnIndex = 0;
        }
        updateInitiativeDisplay();
        debug.log(`\u{1F5D1}\uFE0F Removed combatant: ${name}`);
      }
    }
    function clearAllCombatants() {
      if (confirm("Clear all combatants from initiative tracker?")) {
        initiativeTracker.combatants = [];
        initiativeTracker.currentTurnIndex = 0;
        initiativeTracker.round = 1;
        combatStarted = false;
        const startBtn = document.getElementById("start-combat-btn");
        const prevBtn = document.getElementById("prev-turn-btn");
        const nextBtn = document.getElementById("next-turn-btn");
        if (startBtn)
          startBtn.style.display = "block";
        if (prevBtn)
          prevBtn.style.display = "none";
        if (nextBtn)
          nextBtn.style.display = "none";
        updateInitiativeDisplay();
        postChatMessage("\u{1F6D1} Combat ended. Initiative tracker cleared.");
        debug.log("\u{1F5D1}\uFE0F All combatants cleared");
      }
    }
    function startCombat() {
      if (initiativeTracker.combatants.length === 0) {
        debug.warn("\u26A0\uFE0F Cannot start combat with no combatants");
        return;
      }
      initiativeTracker.currentTurnIndex = 0;
      initiativeTracker.round = 1;
      combatStarted = true;
      document.getElementById("round-display").textContent = "Round 1";
      const startBtn = document.getElementById("start-combat-btn");
      const prevBtn = document.getElementById("prev-turn-btn");
      const nextBtn = document.getElementById("next-turn-btn");
      const endBtn = document.getElementById("end-combat-btn");
      if (startBtn) {
        startBtn.style.display = "none";
      }
      if (prevBtn)
        prevBtn.style.display = "block";
      if (nextBtn)
        nextBtn.style.display = "block";
      if (endBtn)
        endBtn.style.display = "block";
      updateInitiativeDisplay();
      notifyCurrentTurn();
      postChatMessage("\u2694\uFE0F Combat has begun! Round 1 starts!");
      announceTurn();
      debug.log("\u2694\uFE0F Combat started!");
    }
    function endCombat() {
      if (!combatStarted) {
        debug.warn("\u26A0\uFE0F Combat is not active");
        return;
      }
      combatStarted = false;
      initiativeTracker.currentTurnIndex = 0;
      initiativeTracker.round = 1;
      const startBtn = document.getElementById("start-combat-btn");
      const prevBtn = document.getElementById("prev-turn-btn");
      const nextBtn = document.getElementById("next-turn-btn");
      const endBtn = document.getElementById("end-combat-btn");
      if (startBtn)
        startBtn.style.display = "block";
      if (prevBtn)
        prevBtn.style.display = "none";
      if (nextBtn)
        nextBtn.style.display = "none";
      if (endBtn)
        endBtn.style.display = "none";
      document.getElementById("round-display").textContent = "Round 1";
      Object.keys(characterPopups).forEach((characterName) => {
        const popup = characterPopups[characterName];
        if (popup && !popup.closed) {
          try {
            popup.postMessage({
              action: "deactivateTurn",
              combatant: characterName
            }, "*");
            debug.log(`\u{1F4E4} Sent deactivateTurn to "${characterName}" (combat ended)`);
          } catch (error) {
            debug.warn(`\u26A0\uFE0F Could not send deactivateTurn to ${characterName}:`, error);
          }
        }
      });
      updateInitiativeDisplay();
      postChatMessage("\u{1F6D1} Combat has ended!");
      debug.log("\u{1F6D1} Combat ended - combatants preserved for next encounter");
    }
    function nextTurn() {
      if (initiativeTracker.combatants.length === 0)
        return;
      initiativeTracker.currentTurnIndex++;
      if (initiativeTracker.currentTurnIndex >= initiativeTracker.combatants.length) {
        initiativeTracker.currentTurnIndex = 0;
        initiativeTracker.round++;
        document.getElementById("round-display").textContent = `Round ${initiativeTracker.round}`;
        postChatMessage(`\u2694\uFE0F Round ${initiativeTracker.round} begins!`);
        postRoundChangeToDiscord(initiativeTracker.round);
      }
      updateInitiativeDisplay();
      notifyCurrentTurn();
      announceTurn();
      const current = getCurrentCombatant();
      if (current) {
        logTurnAction({
          action: "turn",
          description: `${current.name}'s turn begins`
        });
      }
      debug.log(`\u23ED\uFE0F Next turn: ${getCurrentCombatant()?.name}`);
    }
    function prevTurn() {
      if (initiativeTracker.combatants.length === 0)
        return;
      initiativeTracker.currentTurnIndex--;
      if (initiativeTracker.currentTurnIndex < 0) {
        initiativeTracker.currentTurnIndex = initiativeTracker.combatants.length - 1;
        initiativeTracker.round = Math.max(1, initiativeTracker.round - 1);
        document.getElementById("round-display").textContent = `Round ${initiativeTracker.round}`;
      }
      updateInitiativeDisplay();
      notifyCurrentTurn();
      announceTurn();
      debug.log(`\u23EE\uFE0F Prev turn: ${getCurrentCombatant()?.name}`);
    }
    function getCurrentCombatant() {
      return initiativeTracker.combatants[initiativeTracker.currentTurnIndex];
    }
    function delayTurn(combatantIndex) {
      const combatant = initiativeTracker.combatants[combatantIndex];
      if (!combatant)
        return;
      debug.log(`\u23F8\uFE0F Delaying turn for: ${combatant.name}`);
      initiativeTracker.delayedCombatants.push({
        name: combatant.name,
        initiative: combatant.initiative,
        originalIndex: combatantIndex
      });
      logTurnAction({
        action: "turn",
        description: `${combatant.name} delays their turn`
      });
      postChatMessage(`\u23F8\uFE0F ${combatant.name} delays their turn`);
      nextTurn();
      updateInitiativeDisplay();
    }
    function undelayTurn(combatantName) {
      const delayedIndex = initiativeTracker.delayedCombatants.findIndex((d) => d.name === combatantName);
      if (delayedIndex === -1)
        return;
      debug.log(`\u25B6\uFE0F Undelaying: ${combatantName}`);
      initiativeTracker.delayedCombatants.splice(delayedIndex, 1);
      logTurnAction({
        action: "turn",
        description: `${combatantName} resumes their turn`
      });
      postChatMessage(`\u25B6\uFE0F ${combatantName} resumes their turn`);
      updateInitiativeDisplay();
    }
    function insertDelayedTurn(combatantName) {
      const delayedIndex = initiativeTracker.delayedCombatants.findIndex((d) => d.name === combatantName);
      if (delayedIndex === -1)
        return;
      const delayed = initiativeTracker.delayedCombatants[delayedIndex];
      debug.log(`\u25B6\uFE0F Inserting delayed turn for: ${delayed.name}`);
      initiativeTracker.delayedCombatants.splice(delayedIndex, 1);
      logTurnAction({
        action: "turn",
        description: `${delayed.name} acts on delayed turn`
      });
      postChatMessage(`\u25B6\uFE0F ${delayed.name} acts now (delayed turn)`);
      notifyCurrentTurn();
      updateInitiativeDisplay();
    }
    function updateInitiativeDisplay() {
      const list = document.getElementById("initiative-list");
      if (!list)
        return;
      if (initiativeTracker.combatants.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: #7f8c8d; padding: 20px;">No combatants yet. Add manually or roll initiative in Roll20 chat!</div>';
        return;
      }
      list.innerHTML = initiativeTracker.combatants.map((combatant, index) => {
        const isActive = index === initiativeTracker.currentTurnIndex;
        const isDelayed = initiativeTracker.delayedCombatants.some((d) => d.name === combatant.name);
        return `
        <div style="padding: 10px; background: ${isActive ? "#FC57F9" : isDelayed ? "#9b59b6" : "#34495e"}; border: 2px solid ${isActive ? "#FC57F9" : isDelayed ? "#8e44ad" : "#2c3e50"}; border-radius: 6px; ${isActive ? "box-shadow: 0 0 15px rgba(78, 205, 196, 0.4);" : ""}">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: ${isActive ? "8px" : "0"};">
            <div style="font-weight: bold; font-size: 1.2em; min-width: 30px; text-align: center;">${combatant.initiative}</div>
            <div style="flex: 1; font-weight: bold;">
              ${combatant.name}
              ${isDelayed ? '<span style="font-size: 0.85em; color: #f39c12; margin-left: 8px;">\u23F8\uFE0F Delayed</span>' : ""}
            </div>
            <button class="rollcloud-remove-combatant" data-combatant-name="${combatant.name}" style="background: #e74c3c; color: #fff; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 0.85em;">\u2715</button>
          </div>
          ${isActive && !isDelayed ? `
            <button class="rollcloud-delay-turn" data-combatant-index="${index}" style="width: 100%; background: #f39c12; color: #fff; border: none; border-radius: 4px; padding: 6px; cursor: pointer; font-weight: bold; font-size: 0.85em;">\u23F8\uFE0F Delay Turn</button>
          ` : ""}
          ${isActive && isDelayed ? `
            <button class="rollcloud-undelay-turn" data-combatant-name="${combatant.name}" style="width: 100%; background: #c2185b; color: #fff; border: none; border-radius: 4px; padding: 6px; cursor: pointer; font-weight: bold; font-size: 0.85em;">\u25B6\uFE0F Resume Turn</button>
          ` : ""}
        </div>
      `;
      }).join("");
      if (initiativeTracker.delayedCombatants.length > 0) {
        list.innerHTML += `
        <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #34495e;">
          <div style="font-weight: bold; color: #f39c12; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
            <span>\u23F8\uFE0F</span> Delayed Actions
          </div>
          ${initiativeTracker.delayedCombatants.map((delayed) => `
            <div style="padding: 8px; background: #9b59b6; border-radius: 6px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
              <div style="flex: 1;">
                <div style="font-weight: bold;">${delayed.name}</div>
                <div style="font-size: 0.75em; opacity: 0.8;">Initiative: ${delayed.initiative}</div>
              </div>
              <button class="rollcloud-insert-delayed" data-delayed-name="${delayed.name}" style="background: #c2185b; color: #fff; border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer; font-weight: bold; font-size: 0.85em;">\u25B6\uFE0F Act Now</button>
            </div>
          `).join("")}
        </div>
      `;
      }
      const removeButtons = list.querySelectorAll(".rollcloud-remove-combatant");
      removeButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const name = button.getAttribute("data-combatant-name");
          removeCombatant(name);
        });
      });
      const delayButtons = list.querySelectorAll(".rollcloud-delay-turn");
      delayButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const index = parseInt(button.getAttribute("data-combatant-index"));
          delayTurn(index);
        });
      });
      const undelayButtons = list.querySelectorAll(".rollcloud-undelay-turn");
      undelayButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const name = button.getAttribute("data-combatant-name");
          undelayTurn(name);
        });
      });
      const insertDelayedButtons = list.querySelectorAll(".rollcloud-insert-delayed");
      insertDelayedButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const name = button.getAttribute("data-delayed-name");
          insertDelayedTurn(name);
        });
      });
    }
    function notifyCurrentTurn() {
      const current = getCurrentCombatant();
      if (!current)
        return;
      debug.log(`\u{1F3AF} Notifying turn for: "${current.name}"`);
      debug.log(`\u{1F4CB} Registered popups: ${Object.keys(characterPopups).map((n) => `"${n}"`).join(", ")}`);
      function normalizeName(name) {
        return name.replace(/^(?:🔵|🔴|⚪|⚫|🟢|🟡|🟠|🟣|🟤)\s*/, "").replace(/^It's\s+/i, "").replace(/'s\s+turn.*$/i, "").trim();
      }
      const normalizedCurrentName = normalizeName(current.name);
      debug.log(`\u{1F50D} Normalized current combatant: "${normalizedCurrentName}"`);
      Object.keys(characterPopups).forEach((characterName) => {
        const popup = characterPopups[characterName];
        try {
          if (popup && !popup.closed) {
            const normalizedCharName = normalizeName(characterName);
            const isTheirTurn = normalizedCharName === normalizedCurrentName;
            debug.log(`\u{1F50D} Comparing: "${characterName}" (normalized: "${normalizedCharName}") vs "${current.name}" (normalized: "${normalizedCurrentName}") \u2192 ${isTheirTurn ? "ACTIVATE" : "DEACTIVATE"}`);
            debug.log(`\u{1F50D} Raw comparison: "${characterName}" === "${current.name}" \u2192 ${characterName === current.name}`);
            popup.postMessage({
              action: isTheirTurn ? "activateTurn" : "deactivateTurn",
              combatant: current.name
            }, "*");
            debug.log(`\u{1F4E4} Sent ${isTheirTurn ? "activateTurn" : "deactivateTurn"} to "${characterName}"`);
          } else {
            delete characterPopups[characterName];
            debug.log(`\u{1F5D1}\uFE0F Removed closed popup for ${characterName}`);
          }
        } catch (error) {
          debug.warn(`\u26A0\uFE0F Error sending message to popup "${characterName}":`, error);
          delete characterPopups[characterName];
        }
      });
      postTurnToDiscord(current);
    }
    function postTurnToDiscord(combatant) {
      if (!combatant)
        return;
      browserAPI.runtime.sendMessage({
        action: "postToDiscord",
        payload: {
          type: "turnStart",
          characterName: combatant.name,
          combatant: combatant.name,
          initiative: combatant.initiative,
          round: initiativeTracker.round
        }
      }).then((response) => {
        if (response && response.success) {
          debug.log(`\u{1F3AE} Discord: Posted turn for ${combatant.name}`);
        }
      }).catch((err) => {
        debug.log("Discord webhook not configured or failed:", err.message);
      });
    }
    function postRoundChangeToDiscord(round) {
      const current = getCurrentCombatant();
      browserAPI.runtime.sendMessage({
        action: "postToDiscord",
        payload: {
          type: "roundChange",
          round,
          combatant: current ? current.name : null
        }
      }).then((response) => {
        if (response && response.success) {
          debug.log(`\u{1F3AE} Discord: Posted round ${round} change`);
        }
      }).catch((err) => {
        debug.log("Discord webhook not configured or failed:", err.message);
      });
    }
    function announceTurn() {
      const current = getCurrentCombatant();
      if (!current)
        return;
      postChatMessage(`\u{1F3AF} It's ${current.name}'s turn! (Initiative: ${current.initiative})`);
    }
    let chatObserver = null;
    function startChatMonitoring() {
      const chatLog = document.getElementById("textchat");
      if (!chatLog) {
        debug.warn("\u26A0\uFE0F Roll20 chat not found, cannot monitor for initiative");
        return;
      }
      chatObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.classList && node.classList.contains("message")) {
              checkForInitiativeRoll(node);
              checkForPlayerRoll(node);
            }
          });
        });
      });
      chatObserver.observe(chatLog, {
        childList: true,
        subtree: true
      });
      debug.log("\u{1F440} Monitoring Roll20 chat for initiative rolls and player tracking");
    }
    function stopChatMonitoring() {
      if (chatObserver) {
        chatObserver.disconnect();
        chatObserver = null;
        debug.log("\u{1F6D1} Stopped monitoring chat");
      }
    }
    function checkForInitiativeRoll(messageNode) {
      const text = messageNode.textContent || "";
      const innerHTML = messageNode.innerHTML || "";
      debug.log("\u{1F4E8} Chat message (text):", text);
      debug.log("\u{1F4E8} Chat message (html):", innerHTML);
      const ownAnnouncementPrefixes = ["\u{1F3AF}", "\u2694\uFE0F", "\u{1F451} GM Mode"];
      const trimmedText = text.trim();
      for (const prefix of ownAnnouncementPrefixes) {
        if (trimmedText.startsWith(prefix)) {
          debug.log("\u23ED\uFE0F Skipping own announcement message");
          return;
        }
      }
      if (trimmedText.includes("\u{1F451}[ROLLCLOUD:CHARACTER:") && trimmedText.includes("]\u{1F451}")) {
        debug.log("\u{1F451} Detected character broadcast in chat");
        parseCharacterBroadcast(trimmedText);
        return;
      }
      const inlineRolls = messageNode.querySelectorAll(".inlinerollresult");
      if (inlineRolls.length > 0) {
        const lowerText = text.toLowerCase();
        if (lowerText.includes("initiative") || lowerText.includes("init")) {
          let characterName = null;
          const rollTemplate = messageNode.querySelector(".sheet-rolltemplate-default, .sheet-rolltemplate-custom");
          if (rollTemplate) {
            const caption = rollTemplate.querySelector("caption, .sheet-template-name, .charname");
            if (caption) {
              const captionText = caption.textContent.trim();
              const nameMatch = captionText.match(/^(?:🔵|🔴|⚪|⚫|🟢|🟡|🟠|🟣|🟤)?\s*(.+?)\s+(?:rolls?\s+)?[Ii]nitiative/i);
              if (nameMatch) {
                characterName = nameMatch[1].trim();
              }
            }
          }
          if (!characterName) {
            const byElement = messageNode.querySelector(".by");
            characterName = byElement ? byElement.textContent.trim().replace(/:/g, "") : null;
          }
          const lastRoll = inlineRolls[inlineRolls.length - 1];
          const rollResult = lastRoll.textContent.trim();
          const initiative = parseInt(rollResult);
          if (characterName && !isNaN(initiative) && initiative >= 0 && initiative <= 50) {
            debug.log(`\u{1F3B2} Detected initiative roll (inline): ${characterName} = ${initiative}`);
            addCombatant(characterName, initiative, "chat");
            return;
          }
        }
      }
      const initiativePatterns = [
        // Pattern 1: "Name rolls Initiative Roll 21" or "Name: rolls Initiative 21"
        /^(.+?)(?::)?\s+rolls?\s+[Ii]nitiative.*?(\d+)/,
        // Pattern 2: "Name rolled 15 for initiative"
        /^(.+?)\s+rolled?\s+(?:a\s+)?(\d+)\s+for\s+[Ii]nitiative/,
        // Pattern 3: Generic "Name ... initiative ... 15" (case insensitive)
        /^(.+?).*?[Ii]nitiative.*?(\d+)/,
        // Pattern 4: "Name ... Init ... 15"
        /^(.+?).*?[Ii]nit.*?(\d+)/
      ];
      for (const pattern of initiativePatterns) {
        const match = text.match(pattern);
        if (match) {
          let name = match[1].trim();
          name = name.replace(/\s*:?\s*rolls?$/i, "").trim();
          const initiative = parseInt(match[2]);
          if (name && !isNaN(initiative) && initiative >= 0 && initiative <= 50) {
            debug.log(`\u{1F3B2} Detected initiative roll (text): ${name} = ${initiative}`);
            addCombatant(name, initiative, "chat");
            return;
          }
        }
      }
    }
    function checkForPlayerRoll(messageNode) {
      const text = messageNode.textContent || "";
      const ownAnnouncementPrefixes = ["\u{1F3AF}", "\u2694\uFE0F", "\u{1F451}", "\u{1F513}", "\u23F8\uFE0F", "\u25B6\uFE0F", "\u{1F4CB}"];
      const trimmedText = text.trim();
      for (const prefix of ownAnnouncementPrefixes) {
        if (trimmedText.includes(prefix)) {
          return;
        }
      }
      if (text.includes("created the character") || text.includes("Welcome to Roll20") || text.includes("has joined the game")) {
        return;
      }
      if (/\binitiative\b/i.test(text) || /\binit\b/i.test(text)) {
        debug.log("\u23ED\uFE0F Skipping initiative roll for player tracking");
        return;
      }
      const inlineRolls = messageNode.querySelectorAll(".inlinerollresult");
      if (inlineRolls.length === 0) {
        return;
      }
      let characterName = null;
      const rollTemplate = messageNode.querySelector('.sheet-rolltemplate-default, .sheet-rolltemplate-custom, [class*="rolltemplate"]');
      if (rollTemplate) {
        const caption = rollTemplate.querySelector('caption, .sheet-template-name, .charname, [class*="charname"]');
        if (caption) {
          const captionText = caption.textContent.trim();
          const nameMatch = captionText.match(/^(?:🔵|🔴|⚪|⚫|🟢|🟡|🟠|🟣|🟤)?\s*(.+?)\s*(?:rolls?\s+|\s*:\s*|$)/i);
          if (nameMatch) {
            characterName = nameMatch[1].trim();
          }
        }
      }
      if (!characterName) {
        const byElement = messageNode.querySelector(".by");
        if (byElement) {
          characterName = byElement.textContent.trim();
        }
      }
      if (!characterName) {
        const patterns = [
          /^(?:🔵|🔴|⚪|⚫|🟢|🟡|🟠|🟣|🟤)?\s*(.+?)\s*:/,
          /^(?:🔵|🔴|⚪|⚫|🟢|🟡|🟠|🟣|🟤)?\s*(.+?)\s+rolls?/i
        ];
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match) {
            characterName = match[1].trim();
            break;
          }
        }
      }
      if (characterName && characterName.length > 0) {
        const skipNames = ["gm", "dm", "roll20", "system", "the", "a ", "an "];
        const lowerName = characterName.toLowerCase();
        if (skipNames.some((skip) => lowerName === skip || lowerName.startsWith(skip + " "))) {
          return;
        }
        if (!playerData[characterName]) {
          debug.log(`\u{1F465} New player detected from roll: ${characterName}`);
          playerData[characterName] = {
            hp: null,
            // Will be updated when popup sends data
            maxHp: null,
            ac: null,
            passivePerception: null,
            initiative: null,
            conditions: [],
            concentration: null,
            deathSaves: null
          };
          updatePlayerOverviewDisplay();
          logTurnAction({
            action: "turn",
            description: `${characterName} detected in combat`
          });
        }
      }
    }
    window.rollcloudRegisterPopup = function(characterName, popupWindow) {
      if (characterName && popupWindow) {
        characterPopups[characterName] = popupWindow;
        debug.log(`\u2705 Registered popup for: ${characterName}`);
      }
    };
    function checkRecentChatForCurrentTurn(characterName, popupWindow) {
      try {
        let normalizeName = function(name) {
          return name.replace(/^(?:🔵|🔴|⚪|⚫|🟢|🟡|🟠|🟣|🟤)\s*/, "").replace(/^It's\s+/i, "").replace(/'s\s+turn.*$/i, "").trim();
        };
        const chatLog = document.getElementById("textchat");
        if (!chatLog) {
          debug.warn("\u26A0\uFE0F Roll20 chat not found for turn check");
          return;
        }
        const messages = chatLog.querySelectorAll(".message");
        const recentMessages = Array.from(messages).slice(-20);
        debug.log(`\u{1F50D} Checking recent ${recentMessages.length} messages for current turn of: ${characterName}`);
        const normalizedCharacterName = normalizeName(characterName);
        for (let i = recentMessages.length - 1; i >= 0; i--) {
          const message = recentMessages[i];
          const text = message.textContent || "";
          const turnMatch = text.match(/🎯 It's (.+?)'s turn! \(Initiative: (\d+)\)/);
          if (turnMatch) {
            const announcedCharacter = normalizeName(turnMatch[1]);
            const initiative = parseInt(turnMatch[2]);
            debug.log(`\u{1F50D} Found turn announcement: "${turnMatch[1]}" (normalized: "${announcedCharacter}") vs "${characterName}" (normalized: "${normalizedCharacterName}")`);
            if (announcedCharacter === normalizedCharacterName) {
              debug.log(`\u2705 It's ${characterName}'s turn! Activating action economy...`);
              popupWindow.postMessage({
                action: "activateTurn",
                combatant: characterName
              }, "*");
              return;
            } else {
              debug.log(`\u23F8\uFE0F It's ${turnMatch[1]}'s turn, not ${characterName}. Deactivating...`);
              popupWindow.postMessage({
                action: "deactivateTurn",
                combatant: characterName
              }, "*");
              return;
            }
          }
        }
        debug.log(`\u{1F50D} No recent turn announcement found for ${characterName}`);
      } catch (error) {
        debug.error("Error checking recent chat for current turn:", error);
      }
    }
    window.addEventListener("message", (event) => {
      debug.log("\u{1F4E8} Received message:", event.data);
      if (event.data && event.data.action === "toggleGMMode") {
        debug.log("\u{1F451} Processing toggleGMMode message:", event.data.enabled);
        toggleGMMode(event.data.enabled);
      } else if (event.data && event.data.action === "shareCharacterWithGM") {
        debug.log("\u{1F451} Processing shareCharacterWithGM message");
        try {
          postChatMessage(event.data.message);
          debug.log("\u2705 Character broadcast posted to chat");
          if (gmPanel && event.data.message) {
            debug.log("\u{1F451} GM panel is open, parsing broadcast directly");
            parseCharacterBroadcast(event.data.message);
          }
        } catch (error) {
          debug.error("\u274C Error posting character broadcast:", error);
        }
      } else if (event.data && event.data.action === "registerPopup") {
        if (event.data.characterName && event.source) {
          window.rollcloudRegisterPopup(event.data.characterName, event.source);
          debug.log(`\u2705 Registered popup via message for: ${event.data.characterName}`);
        }
      } else if (event.data && event.data.action === "postChatMessageFromPopup") {
        postChatMessage(event.data.message);
      } else if (event.data && event.data.action === "checkCurrentTurn") {
        if (event.data.characterName) {
          checkRecentChatForCurrentTurn(event.data.characterName, event.source);
        }
      } else if (event.data && event.data.action === "updatePlayerData") {
        if (event.data.characterName && event.data.data) {
          updatePlayerData(event.data.characterName, event.data.data);
        }
      } else if (event.data && event.data.action === "postToDiscordFromPopup") {
        if (event.data.payload) {
          browserAPI.runtime.sendMessage({
            action: "postToDiscord",
            payload: event.data.payload
          }).then((response) => {
            if (response && response.success) {
              debug.log(`\u{1F3AE} Discord: Forwarded action update from popup`);
            }
          }).catch((err) => {
            debug.log("Discord webhook not configured or failed:", err.message);
          });
        }
      }
    });
    browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "toggleGMMode") {
        toggleGMMode(request.enabled);
        sendResponse({ success: true });
      }
    });
    function startCharacterSelectionMonitor() {
      debug.log("\u{1F50D} Starting character selection monitor...");
      let lastSelectedCharacter = null;
      function checkSelectedCharacter() {
        try {
          let selectedCharacter = null;
          const selectedTokens = document.querySelectorAll(".token.selected, .token.selected-token");
          if (selectedTokens.length > 0) {
            const token = selectedTokens[0];
            const tokenName = token.getAttribute("data-name") || token.getAttribute("title") || token.querySelector(".token-name")?.textContent || token.textContent;
            if (tokenName && tokenName.trim()) {
              selectedCharacter = tokenName.trim();
              debug.log(`\u{1F3AF} Detected selected token: ${selectedCharacter}`);
            }
          }
          if (!selectedCharacter) {
            const activeCharElement = document.querySelector(".character-item.active, .character.active, [data-character-id].active");
            if (activeCharElement) {
              selectedCharacter = activeCharElement.textContent?.trim() || activeCharElement.getAttribute("data-character-name");
              debug.log(`\u{1F3AF} Detected active character in UI: ${selectedCharacter}`);
            }
          }
          if (!selectedCharacter && typeof window !== "undefined" && window.Campaign) {
            try {
              const activeCharacter = window.Campaign.activeCharacter();
              if (activeCharacter && activeCharacter.attributes && activeCharacter.attributes.name) {
                selectedCharacter = activeCharacter.attributes.name;
                debug.log(`\u{1F3AF} Detected active character from Campaign: ${selectedCharacter}`);
              }
            } catch (e) {
            }
          }
          if (selectedCharacter && selectedCharacter !== lastSelectedCharacter) {
            debug.log(`\u2705 Character selection changed: "${lastSelectedCharacter}" \u2192 "${selectedCharacter}"`);
            lastSelectedCharacter = selectedCharacter;
            markCharacterAsActive(selectedCharacter);
          }
        } catch (error) {
          debug.warn("\u26A0\uFE0F Error checking selected character:", error);
        }
      }
      checkSelectedCharacter();
      const checkInterval = setInterval(checkSelectedCharacter, 2e3);
      document.addEventListener("click", () => {
        setTimeout(checkSelectedCharacter, 100);
      });
      window.addEventListener("beforeunload", () => {
        clearInterval(checkInterval);
      });
      debug.log("\u2705 Character selection monitor started");
    }
    async function markCharacterAsActive(characterName) {
      try {
        debug.log(`\u{1F3AF} Marking character as active: ${characterName}`);
        const result = await browserAPI.storage.local.get(["characterProfiles"]);
        const characterProfiles = result.characterProfiles || {};
        let characterId = null;
        for (const [id, profile] of Object.entries(characterProfiles)) {
          if (profile.name === characterName || profile.character_name === characterName) {
            characterId = id;
            break;
          }
        }
        if (characterId) {
          const response = await browserAPI.runtime.sendMessage({
            action: "setActiveCharacter",
            characterId
          });
          if (response && response.success) {
            debug.log(`\u2705 Successfully marked ${characterName} as active`);
          } else {
            debug.warn(`\u26A0\uFE0F Failed to mark ${characterName} as active:`, response);
          }
        } else {
          debug.warn(`\u26A0\uFE0F Could not find character ID for ${characterName} in local storage`);
        }
      } catch (error) {
        debug.error(`\u274C Error marking character as active:`, error);
      }
    }
    document.addEventListener("openGMMode", () => {
      debug.log("\u2705 Received openGMMode event - opening GM panel");
      try {
        postChatMessage("\u{1F451} Opening GM mode...");
      } catch (error) {
        debug.error(" Error posting chat message:", error);
      }
      toggleGMMode(true);
    });
    loadPlayerDataFromStorage();
    startCharacterSelectionMonitor();
    debug.log("\u2705 Roll20 script ready - listening for roll announcements and GM mode");
    async function refreshCharacterData() {
      try {
        const result = await browserAPI.storage.local.get("carmaclouds_characters");
        const characters = result.carmaclouds_characters || [];
        if (characters.length === 0) {
          return null;
        }
        return characters[0];
      } catch (error) {
        debug.error("\u274C Error refreshing character data:", error);
        return null;
      }
    }
  })();
})();
//# sourceMappingURL=roll20.js.map
