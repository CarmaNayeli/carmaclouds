(() => {
  // src/popup-sheet.js
  debug.log("\u2705 Popup HTML loaded");
  function cropToCircle(imageUrl, size = 200) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const borderWidth = Math.max(8, size * 0.04);
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.save();
        const radius = size / 2 - borderWidth / 2;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        const scale = Math.max(size / img.width, size / img.height);
        const x = size / 2 - img.width / 2 * scale;
        const y = size / 2 - img.height / 2 * scale;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        ctx.restore();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
        ctx.strokeStyle = "#FC57F9";
        ctx.lineWidth = borderWidth;
        ctx.stroke();
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => {
        debug.warn("Failed to load image for circular crop, using original");
        resolve(imageUrl);
      };
      img.src = imageUrl;
    });
  }
  if (typeof ThemeManager !== "undefined") {
    ThemeManager.init().then(() => {
      debug.log("\u{1F3A8} Theme system initialized");
      const themeButtons = document.querySelectorAll(".theme-btn");
      themeButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const theme = btn.dataset.theme;
          ThemeManager.setTheme(theme);
          themeButtons.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
        });
      });
      const currentTheme = ThemeManager.getCurrentTheme();
      const activeBtn = document.querySelector(`[data-theme="${currentTheme}"]`);
      if (activeBtn) {
        themeButtons.forEach((b) => b.classList.remove("active"));
        activeBtn.classList.add("active");
      }
    });
  } else {
    debug.warn("\u26A0\uFE0F ThemeManager not available");
  }
  var characterData = null;
  var domReady = false;
  var pendingOperations = [];
  window.addEventListener("message", async (event) => {
    debug.log("\u2705 Received message in popup:", event.data);
    if (event.data && event.data.action === "initCharacterSheet") {
      debug.log("\u2705 Initializing character sheet with data:", event.data.data.name);
      const isFromGMPanel = event.data.source === "gm-panel";
      if (isFromGMPanel) {
        debug.log("\u{1F451} Popup opened from GM panel - hiding GM controls");
        hideGMControls();
        setTimeout(() => {
          deactivateTurn();
          debug.log("\u23F8\uFE0F Action economy initialized as disabled (combat may be active)");
        }, 100);
      }
      const initSheet = async () => {
        characterData = event.data.data;
        const hasSpells = Array.isArray(characterData.spells);
        const hasActions = Array.isArray(characterData.actions);
        if (!hasSpells || !hasActions) {
          debug.warn("\u26A0\uFE0F Character data from initCharacterSheet is incomplete");
          debug.warn(`Missing data: spells=${!hasSpells}, actions=${!hasActions}`);
          showNotification("\u26A0\uFE0F Character data incomplete. Please resync from DiceCloud.", "error");
          return;
        }
        globalThis.currentSlotId = await getActiveCharacterId();
        debug.log("\u{1F4CB} Current slot ID set to:", globalThis.currentSlotId);
        await loadAndBuildTabs();
        if (typeof buildSheet === "function") {
          buildSheet(characterData);
        } else {
          debug.warn("\u26A0\uFE0F buildSheet function not available");
        }
        initRacialTraits();
        initFeatTraits();
        initClassFeatures();
        if (characterData.concentrationSpell) {
          concentratingSpell = characterData.concentrationSpell;
          if (typeof updateConcentrationDisplay === "function") {
            updateConcentrationDisplay();
          }
          debug.log(`\u{1F9E0} Restored concentration: ${characterData.concentrationSpell}`);
        }
        if (characterData && characterData.id) {
          characterCache.set(characterData.id, JSON.parse(JSON.stringify(characterData)));
          debug.log(`\u{1F4C2} Initialized cache for character: ${characterData.name}`);
        }
        if (window.opener) {
          window.opener.postMessage({
            action: "registerPopup",
            characterName: event.data.data.name
          }, "*");
          debug.log(`\u2705 Sent registration message for: ${event.data.data.name}`);
          setTimeout(() => {
            checkCurrentTurnFromChat(event.data.data.name);
          }, 500);
        } else {
          debug.warn(`\u26A0\uFE0F No window.opener available for: ${event.data.data.name}`);
        }
      };
      if (domReady) {
        await initSheet();
      } else {
        debug.log("\u23F3 DOM not ready yet, queuing initialization...");
        pendingOperations.push(initSheet);
      }
    } else if (event.data && event.data.action === "loadCharacterData") {
      debug.log("\u{1F4CB} Loading character data from GM panel:", event.data.characterData.name);
      hideGMControls();
      characterData = event.data.characterData;
      const hasSpells = Array.isArray(characterData.spells);
      const hasActions = Array.isArray(characterData.actions);
      if (!hasSpells || !hasActions) {
        debug.warn("\u26A0\uFE0F Shared character data is incomplete");
        debug.warn(`Missing data: spells=${!hasSpells}, actions=${!hasActions}`);
        showNotification("\u26A0\uFE0F Shared character data incomplete. Player needs to resync from DiceCloud.", "error");
        return;
      }
      const initSheetFromGM = async () => {
        const tabsContainer = document.getElementById("character-tabs");
        if (tabsContainer) {
          tabsContainer.style.display = "none";
          debug.log("\u{1F512} Hidden character tabs for standalone GM view");
        }
        if (typeof buildSheet === "function") {
          buildSheet(characterData);
        } else {
          debug.warn("\u26A0\uFE0F buildSheet function not available");
        }
        initRacialTraits();
        initFeatTraits();
        initClassFeatures();
        if (characterData.concentrationSpell) {
          concentratingSpell = characterData.concentrationSpell;
          if (typeof updateConcentrationDisplay === "function") {
            updateConcentrationDisplay();
          }
          debug.log(`\u{1F9E0} Restored concentration: ${characterData.concentrationSpell}`);
        }
        if (characterData && characterData.id) {
          characterCache.set(characterData.id, JSON.parse(JSON.stringify(characterData)));
          debug.log(`\u{1F4C2} Initialized cache for character: ${characterData.name}`);
        }
        if (window.opener) {
          window.opener.postMessage({
            action: "registerPopup",
            characterName: characterData.name
          }, "*");
          debug.log(`\u2705 Sent registration message for: ${characterData.name}`);
        } else {
          debug.log(`\u2139\uFE0F Standalone sheet (no window.opener) for: ${characterData.name}`);
        }
      };
      if (domReady) {
        await initSheetFromGM();
      } else {
        debug.log("\u23F3 DOM not ready yet, queuing GM panel initialization...");
        pendingOperations.push(initSheetFromGM);
      }
    } else if (event.data && event.data.action === "requestStatusData") {
      debug.log("\u{1F4CA} Status bar requesting data");
      sendStatusUpdate(event.source);
    }
  });
  function notifyParentReady() {
    try {
      if (window.opener && !window.opener.closed) {
        debug.log("\u2705 Sending ready message to parent window...");
        window.opener.postMessage({ action: "popupReady" }, "*");
      } else {
        debug.warn("\u26A0\uFE0F No parent window available, waiting for postMessage...");
      }
    } catch (error) {
      debug.warn("\u26A0\uFE0F Could not notify parent (this is normal):", error.message);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", async () => {
      debug.log("\u2705 DOM is ready");
      domReady = true;
      notifyParentReady();
      for (const operation of pendingOperations) {
        await operation();
      }
      pendingOperations = [];
    });
  } else {
    debug.log("\u2705 DOM already ready");
    domReady = true;
    notifyParentReady();
  }
  debug.log("\u2705 Waiting for character data via postMessage...");
  setTimeout(() => {
    if (!characterData && domReady) {
      debug.log("\u23F1\uFE0F No data received via postMessage, loading from storage...");
      loadCharacterWithTabs();
    } else if (!characterData && !domReady) {
      debug.log("\u23F3 DOM not ready yet, will retry fallback...");
      setTimeout(() => {
        if (!characterData) {
          debug.log("\u23F1\uFE0F Retry: Loading from storage...");
          loadCharacterWithTabs();
        }
      }, 500);
    }
  }, 1500);
  setTimeout(() => {
    if (!characterData) {
      debug.warn("\u23F0 Loading timeout - no character data after 10 seconds");
      showLoadingError();
    }
  }, 1e4);
  function showLoadingError() {
    const loadingOverlay = document.getElementById("loading-overlay");
    if (!loadingOverlay)
      return;
    loadingOverlay.innerHTML = `
    <div style="text-align: center; color: var(--text-primary); max-width: 450px; padding: 20px;">
      <div style="font-size: 4em; margin-bottom: 20px;">\u26A0\uFE0F</div>
      <div style="font-size: 1.3em; font-weight: bold; margin-bottom: 15px; color: var(--accent-danger);">
        No Valid Character Data Found
      </div>
      <div style="font-size: 0.95em; color: var(--text-secondary); line-height: 1.6; margin-bottom: 25px;">
        No character data could be loaded. This might happen if you haven't synced a character yet, or if the character data is outdated.
      </div>
      <div style="background: var(--background-secondary); padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid var(--accent-info);">
        <p style="margin: 0 0 12px 0; font-weight: bold; color: var(--text-primary); font-size: 0.95em;">To fix this:</p>
        <ol style="text-align: left; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 0.9em; color: var(--text-secondary);">
          <li>Use the <strong>Refresh Characters</strong> button in the extension popup</li>
          <li>Or visit your character on <a href="https://dicecloud.com" target="_blank" style="color: var(--accent-info);">DiceCloud.com</a> and click <strong>Sync to Extension</strong></li>
        </ol>
      </div>
      <button id="try-again-btn" style="
        padding: 14px 28px;
        background: linear-gradient(135deg, var(--accent-info) 0%, #2980b9 100%);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        font-size: 1em;
        box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
        transition: transform 0.2s, box-shadow 0.2s;
      " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(52, 152, 219, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(52, 152, 219, 0.3)';">
        \u{1F504} Try Again
      </button>
    </div>
  `;
    const tryAgainBtn = document.getElementById("try-again-btn");
    if (tryAgainBtn) {
      tryAgainBtn.addEventListener("click", () => {
        debug.log("\u{1F504} Try again button clicked - reloading character data...");
        loadingOverlay.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; width: 80px; height: 80px; margin: 0 auto 20px;">
          <div style="width: 100%; height: 100%; border: 4px solid var(--border-subtle); border-top: 4px solid var(--accent-primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
        </div>
        <div style="text-align: center; color: var(--text-primary);">
          <div style="font-size: 1.2em; font-weight: bold; margin-bottom: 10px;">
            Loading Characters...
          </div>
          <div style="font-size: 0.9em; color: var(--text-secondary); max-width: 300px; line-height: 1.4;">
            Attempting to reload character data...
          </div>
        </div>
      `;
        characterData = null;
        loadCharacterWithTabs();
        setTimeout(() => {
          if (!characterData) {
            debug.warn("\u23F0 Retry timeout - still no character data");
            showLoadingError();
          }
        }, 1e4);
      });
    }
  }
  async function loadAndBuildTabs() {
    try {
      debug.log("\u{1F4CB} Loading character profiles for tabs...");
      const profilesResponse = await browserAPI.runtime.sendMessage({ action: "getAllCharacterProfiles" });
      const profiles = profilesResponse.success ? profilesResponse.profiles : {};
      debug.log("\u{1F4CB} Profiles loaded:", Object.keys(profiles));
      const activeCharacterId = await getActiveCharacterId();
      debug.log("\u{1F4CB} Active character ID:", activeCharacterId);
      buildCharacterTabs(profiles, activeCharacterId);
    } catch (error) {
      debug.error("\u274C Failed to load and build tabs:", error);
    }
  }
  async function loadCharacterWithTabs() {
    if (!domReady) {
      debug.log("\u23F3 DOM not ready, queuing loadCharacterWithTabs...");
      pendingOperations.push(loadCharacterWithTabs);
      return;
    }
    try {
      await loadAndBuildTabs();
      globalThis.currentSlotId = await getActiveCharacterId();
      debug.log("\u{1F4CB} Current slot ID set to:", globalThis.currentSlotId);
      let activeCharacter = null;
      if (globalThis.currentSlotId && globalThis.currentSlotId.startsWith("db-")) {
        const characterId = globalThis.currentSlotId.replace("db-", "");
        try {
          const dbResponse = await browserAPI.runtime.sendMessage({
            action: "getCharacterDataFromDatabase",
            characterId
          });
          if (dbResponse.success) {
            activeCharacter = dbResponse.data;
            debug.log("\u2705 Loaded character from database:", activeCharacter.name);
          }
        } catch (dbError) {
          debug.warn("\u26A0\uFE0F Failed to load database character:", dbError);
        }
      } else {
        const activeResponse = await browserAPI.runtime.sendMessage({ action: "getCharacterData" });
        activeCharacter = activeResponse.success ? activeResponse.data : null;
      }
      if (activeCharacter) {
        characterData = activeCharacter;
        const hasSpells = Array.isArray(characterData.spells);
        const hasActions = Array.isArray(characterData.actions);
        if (!hasSpells || !hasActions) {
          debug.warn("\u26A0\uFE0F Character data is incomplete or outdated");
          debug.warn(`Missing data: spells=${!hasSpells}, actions=${!hasActions}`);
          const characterName = characterData.name || characterData.character_name || "this character";
          const missingData = [];
          if (!hasSpells)
            missingData.push("spells");
          if (!hasActions)
            missingData.push("actions");
          const errorContainer = document.getElementById("main-content");
          if (errorContainer) {
            errorContainer.innerHTML = `
            <div style="padding: 40px; text-align: center; color: var(--text-primary);">
              <h2 style="color: #e74c3c; margin-bottom: 20px;">\u26A0\uFE0F Incomplete Character Data</h2>
              <p style="margin-bottom: 15px; font-size: 1.1em;">
                The character data for <strong>${characterName}</strong> is missing ${missingData.join(" and ")}.
              </p>
              <p style="margin-bottom: 15px; color: var(--text-secondary);">
                This usually happens when loading old cloud data that was saved before spells and actions were synced.
              </p>
              <div style="background: #2c3e50; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin-bottom: 10px; font-weight: bold;">To fix this:</p>
                <ol style="text-align: left; max-width: 500px; margin: 0 auto; line-height: 1.8;">
                  <li>Go to your character on <a href="https://dicecloud.com" target="_blank" style="color: #FC57F9;">DiceCloud.com</a></li>
                  <li>Click the <strong>"Sync to Extension"</strong> button on the character page</li>
                  <li>Wait for the sync to complete</li>
                  <li>Reopen this character sheet</li>
                </ol>
              </div>
              <p style="color: var(--text-secondary); font-size: 0.9em;">
                Character ID: ${characterData.id || characterData.dicecloud_character_id || "unknown"}
              </p>
            </div>
          `;
          }
          return;
        }
        if (typeof buildSheet === "function") {
          buildSheet(characterData);
        } else {
          debug.warn("\u26A0\uFE0F buildSheet function not available");
        }
        const portraitElement = document.getElementById("char-portrait");
        debug.log("\u{1F5BC}\uFE0F Portrait element found:", portraitElement);
        debug.log("\u{1F5BC}\uFE0F Character data for portrait:", characterData?.picture, characterData?.avatarPicture);
        if (portraitElement && characterData) {
          const portraitUrl = characterData.picture || characterData.avatarPicture;
          if (portraitUrl) {
            debug.log("\u{1F5BC}\uFE0F Cropping portrait from URL:", portraitUrl);
            cropToCircle(portraitUrl, 120).then((croppedUrl) => {
              portraitElement.src = croppedUrl;
              portraitElement.style.display = "block";
              debug.log("\u2705 Portrait displayed successfully");
            }).catch((err) => {
              debug.warn("\u26A0\uFE0F Failed to crop portrait:", err);
              portraitElement.src = portraitUrl;
              portraitElement.style.display = "block";
              debug.log("\u2705 Portrait displayed (uncropped fallback)");
            });
          } else {
            debug.log("\u2139\uFE0F No portrait URL available in character data");
          }
        } else {
          if (!portraitElement)
            debug.warn("\u26A0\uFE0F Portrait element not found");
          if (!characterData)
            debug.warn("\u26A0\uFE0F No character data for portrait");
        }
        initRacialTraits();
        initFeatTraits();
        initClassFeatures();
      } else {
        debug.error("\u274C No character data found");
        const loadingOverlay = document.getElementById("loading-overlay");
        if (loadingOverlay) {
          loadingOverlay.innerHTML = `
          <div style="text-align: center; color: var(--text-primary); max-width: 400px;">
            <div style="font-size: 3em; margin-bottom: 20px;">\u{1F4CB}</div>
            <div style="font-size: 1.2em; font-weight: bold; margin-bottom: 10px;">
              No Character Found
            </div>
            <div style="font-size: 0.9em; color: var(--text-secondary); line-height: 1.4;">
              Use the <strong>Refresh Characters</strong> button in the extension popup to sync your characters from DiceCloud
            </div>
          </div>
        `;
        }
      }
    } catch (error) {
      debug.error("\u274C Failed to load characters:", error);
      const loadingOverlay = document.getElementById("loading-overlay");
      if (loadingOverlay) {
        loadingOverlay.innerHTML = `
        <div style="text-align: center; color: var(--text-primary); max-width: 400px;">
          <div style="font-size: 3em; margin-bottom: 20px;">\u26A0\uFE0F</div>
          <div style="font-size: 1.2em; font-weight: bold; margin-bottom: 10px;">
            Failed to Load Character
          </div>
          <div style="font-size: 0.9em; color: var(--text-secondary); line-height: 1.4; margin-bottom: 15px;">
            ${error.message || "Unknown error"}
          </div>
          <div style="font-size: 0.9em; color: var(--text-secondary); line-height: 1.4;">
            Try using the <strong>Refresh Characters</strong> button in the extension popup
          </div>
        </div>
      `;
      }
    }
  }
  async function getActiveCharacterId() {
    const result = await browserAPI.storage.local.get(["activeCharacterId"]);
    return result.activeCharacterId || null;
  }
  function checkCurrentTurnFromChat(characterName) {
    try {
      if (!window.opener) {
        debug.warn("\u26A0\uFE0F No window.opener available for turn check");
        return;
      }
      window.opener.postMessage({
        action: "checkCurrentTurn",
        characterName
      }, "*");
      debug.log(`\u{1F50D} Requested turn check for: ${characterName}`);
    } catch (error) {
      debug.warn("\u26A0\uFE0F Error checking current turn:", error);
    }
  }
  var advantageState = "normal";
  document.addEventListener("DOMContentLoaded", () => {
    const shortRestBtn = document.getElementById("short-rest-btn");
    const longRestBtn = document.getElementById("long-rest-btn");
    if (shortRestBtn) {
      shortRestBtn.addEventListener("click", takeShortRest);
    }
    if (longRestBtn) {
      longRestBtn.addEventListener("click", takeLongRest);
    }
    const advantageBtn = document.getElementById("advantage-btn");
    const normalBtn = document.getElementById("normal-btn");
    const disadvantageBtn = document.getElementById("disadvantage-btn");
    if (advantageBtn) {
      advantageBtn.addEventListener("click", () => setAdvantageState("advantage"));
    }
    if (normalBtn) {
      normalBtn.addEventListener("click", () => setAdvantageState("normal"));
    }
    if (disadvantageBtn) {
      disadvantageBtn.addEventListener("click", () => setAdvantageState("disadvantage"));
    }
  });
  function setAdvantageState(state) {
    advantageState = state;
    const advantageBtn = document.getElementById("advantage-btn");
    const normalBtn = document.getElementById("normal-btn");
    const disadvantageBtn = document.getElementById("disadvantage-btn");
    [advantageBtn, normalBtn, disadvantageBtn].forEach((btn) => {
      if (btn) {
        btn.classList.remove("active");
        const color = btn.id.includes("advantage") ? "var(--accent-success)" : btn.id.includes("normal") ? "#FC57F9" : "var(--accent-danger)";
        btn.style.background = "transparent";
        btn.style.color = color;
        btn.style.borderColor = color;
      }
    });
    const activeBtn = state === "advantage" ? advantageBtn : state === "normal" ? normalBtn : disadvantageBtn;
    if (activeBtn) {
      activeBtn.classList.add("active");
      const color = state === "advantage" ? "var(--accent-success)" : state === "normal" ? "#FC57F9" : "var(--accent-danger)";
      activeBtn.style.background = color;
      activeBtn.style.color = "white";
    }
    debug.log(`\u{1F3B2} Advantage state set to: ${state}`);
    showNotification(`\u{1F3B2} ${state === "advantage" ? "Advantage" : state === "disadvantage" ? "Disadvantage" : "Normal"} rolls selected`);
    const stateEmoji = state === "advantage" ? "\u{1F3AF}" : state === "disadvantage" ? "\u{1F3B2}" : "\u2696\uFE0F";
    const announcement = `&{template:default} {{name=${getColoredBanner(characterData)}${characterData.name} sets roll mode}} {{${stateEmoji}=${state === "advantage" ? "Advantage" : state === "disadvantage" ? "Disadvantage" : "Normal"} rolls selected}}`;
    const messageData = {
      action: "announceSpell",
      message: announcement,
      color: characterData.notificationColor
    };
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage(messageData, "*");
      } catch (error) {
        debug.warn("\u26A0\uFE0F Could not send advantage state via window.opener:", error.message);
        browserAPI.runtime.sendMessage({
          action: "relayRollToRoll20",
          roll: messageData
        });
      }
    } else {
      browserAPI.runtime.sendMessage({
        action: "relayRollToRoll20",
        roll: messageData
      });
    }
  }
  window.addEventListener("beforeunload", () => {
    if (characterData && globalThis.currentSlotId) {
      debug.log("\u{1F4BE} Saving character data before window closes");
      browserAPI.runtime.sendMessage({
        action: "storeCharacterData",
        data: characterData,
        slotId: globalThis.currentSlotId
        // CRITICAL: Pass slotId for proper persistence
      });
      debug.log(`\u2705 Saved character data: ${characterData.name} (slotId: ${globalThis.currentSlotId})`);
    }
  });
  var isMyTurn = false;
  function activateTurn() {
    isMyTurn = true;
    const actionIndicators = document.querySelectorAll(".action-economy-item");
    actionIndicators.forEach((indicator) => {
      indicator.style.opacity = "1";
      indicator.style.pointerEvents = "auto";
      indicator.style.cursor = "pointer";
    });
    debug.log("\u2705 Turn activated - action economy enabled");
  }
  function deactivateTurn() {
    isMyTurn = false;
    const actionIndicators = document.querySelectorAll(".action-economy-item");
    actionIndicators.forEach((indicator) => {
      indicator.style.opacity = "0.3";
      indicator.style.pointerEvents = "none";
      indicator.style.cursor = "not-allowed";
    });
    debug.log("\u23F8\uFE0F Turn deactivated - action economy disabled");
  }
  window.addEventListener("message", (event) => {
    if (event.data && event.data.action === "activateTurn") {
      debug.log("\u{1F3AF} Your turn! Activating action economy...");
      debug.log("\u{1F3AF} Received activateTurn event:", event.data);
      activateTurn();
      const actionIndicator = document.getElementById("action-indicator");
      const bonusActionIndicator = document.getElementById("bonus-action-indicator");
      const movementIndicator = document.getElementById("movement-indicator");
      [actionIndicator, bonusActionIndicator, movementIndicator].forEach((indicator) => {
        if (indicator) {
          indicator.dataset.used = "false";
          debug.log(`\u{1F504} Reset ${indicator.id} to unused`);
        }
      });
      debug.log("\u{1F504} Turn reset: Action, Bonus Action, Movement restored (automatic)");
      showNotification("\u2694\uFE0F Your turn!", "success");
    } else if (event.data && event.data.action === "deactivateTurn") {
      debug.log("\u23F8\uFE0F Turn ended. Deactivating action economy...");
      debug.log("\u23F8\uFE0F Received deactivateTurn event:", event.data);
      deactivateTurn();
    } else if (event.data && event.data.action === "rollResult") {
      debug.log("\u{1F9EC} Received rollResult message:", event.data);
      if (event.data.checkRacialTraits && (activeRacialTraits.length > 0 || activeFeatTraits.length > 0)) {
        const { rollResult, baseRoll, rollType, rollName } = event.data;
        debug.log(`\u{1F9EC} Checking racial traits for roll: ${baseRoll} (${rollType}) - ${rollName}`);
        debug.log(`\u{1F9EC} Active racial traits count: ${activeRacialTraits.length}`);
        debug.log(`\u{1F396}\uFE0F Active feat traits count: ${activeFeatTraits.length}`);
        debug.log(`\u{1F9EC} Roll details - Total: ${rollResult}, Base: ${baseRoll}`);
        const racialTraitTriggered = checkRacialTraits(baseRoll, rollType, rollName);
        const triggeredRacialTraits = [];
        const featTraitTriggered = checkFeatTraits(baseRoll, rollType, rollName);
        const triggeredFeatTraits = [];
        if (racialTraitTriggered) {
          triggeredRacialTraits.push(...activeRacialTraits.filter((trait) => {
            const testResult = trait.onRoll(baseRoll, rollType, rollName);
            return testResult === true;
          }));
          debug.log(`\u{1F9EC} Racial trait triggered for roll: ${baseRoll}`);
        }
        if (featTraitTriggered) {
          triggeredFeatTraits.push(...activeFeatTraits.filter((trait) => {
            const testResult = trait.onRoll(baseRoll, rollType, rollName);
            return testResult === true;
          }));
          debug.log(`\u{1F396}\uFE0F Feat trait triggered for roll: ${baseRoll}`);
        }
        if (triggeredRacialTraits.length > 0 || triggeredFeatTraits.length > 0) {
          const allTriggeredTraits = [...triggeredRacialTraits, ...triggeredFeatTraits];
          if (allTriggeredTraits.length === 1) {
            const trait = allTriggeredTraits[0];
            if (trait.name === "Halfling Luck") {
              showHalflingLuckPopup({
                rollResult: baseRoll,
                baseRoll,
                rollType,
                rollName
              });
            } else if (trait.name === "Lucky") {
              const luckyResource = getLuckyResource();
              showLuckyPopup({
                rollResult: baseRoll,
                baseRoll,
                rollType,
                rollName,
                luckPointsRemaining: luckyResource?.current || 0
              });
            }
          } else {
            showTraitChoicePopup({
              rollResult: baseRoll,
              baseRoll,
              rollType,
              rollName,
              racialTraits: triggeredRacialTraits,
              featTraits: triggeredFeatTraits
            });
          }
        }
        if (!racialTraitTriggered && !featTraitTriggered) {
          debug.log(`\u{1F9EC}\u{1F396}\uFE0F No traits triggered for roll: ${baseRoll}`);
        }
      } else {
        debug.log(`\u{1F9EC} Skipping traits check - checkRacialTraits: ${event.data.checkRacialTraits}, racialTraits: ${activeRacialTraits.length}, featTraits: ${activeFeatTraits.length}`);
      }
    } else if (event.data && event.data.action === "showHalflingLuckPopup") {
      showHalflingLuckPopup(event.data.rollData);
    }
  });
  setTimeout(() => {
    initConditionsManager();
    initConcentrationTracker();
  }, 100);
  if (window.opener && !characterData) {
    window.opener.postMessage({ action: "requestCharacterData" }, "*");
    debug.log("\u{1F4CB} Requested character data from parent window");
  }
  if (domReady) {
    initCustomMacros();
    initSettingsButton();
    initStatusBarButton();
    initGMMode();
    initShowToGM();
  } else {
    pendingOperations.push(initCustomMacros);
    pendingOperations.push(initSettingsButton);
    pendingOperations.push(initStatusBarButton);
    pendingOperations.push(initGMMode);
    pendingOperations.push(initShowToGM);
  }
})();
//# sourceMappingURL=popup-sheet.js.map
