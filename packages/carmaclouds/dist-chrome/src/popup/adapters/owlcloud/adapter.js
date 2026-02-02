(() => {
  // src/popup/adapters/owlcloud/adapter.js
  async function init(containerEl) {
    console.log("Initializing OwlCloud adapter...");
    try {
      containerEl.innerHTML = '<div class="loading">Loading OwlCloud...</div>';
      const result = await chrome.storage.local.get(["carmaclouds_characters", "diceCloudUserId"]);
      const characters = result.carmaclouds_characters || [];
      const diceCloudUserId = result.diceCloudUserId;
      console.log("Found", characters.length, "synced characters");
      console.log("DiceCloud User ID:", diceCloudUserId);
      const character = characters.length > 0 ? characters[0] : null;
      const htmlPath = chrome.runtime.getURL("src/popup/adapters/owlcloud/popup.html");
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
      const cssPath = chrome.runtime.getURL("src/popup/adapters/owlcloud/popup.css");
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
                  const updateResponse = await fetch(
                    `${SUPABASE_URL}/rest/v1/clouds_characters`,
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
                        raw_dicecloud_data: character.raw,
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
                    <div style="margin-bottom: 10px;">Character synced to database!</div>
                    <div style="background: var(--bg-secondary, #f5f5f5); padding: 10px; border-radius: 4px; font-family: monospace;">
                      <div style="margin-bottom: 5px; font-size: 12px; opacity: 0.8;">Your DiceCloud User ID:</div>
                      <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="text" value="${diceCloudUserId}" readonly style="flex: 1; padding: 8px; border: 1px solid var(--border-color, #ddd); border-radius: 4px; font-family: monospace; font-size: 14px; background: white;">
                        <button id="copyUserIdBtn" style="padding: 8px 12px; background: #16a75a; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Copy</button>
                      </div>
                      <div style="margin-top: 8px; font-size: 11px; opacity: 0.7;">Paste this into the Owlbear extension to link your character.</div>
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
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "dataSynced") {
          console.log("\u{1F4E5} OwlCloud adapter received data sync notification:", message.characterName);
          init(containerEl);
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
})();
//# sourceMappingURL=adapter.js.map
