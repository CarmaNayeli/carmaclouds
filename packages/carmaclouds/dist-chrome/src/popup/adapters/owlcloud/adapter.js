(() => {
  // src/popup/adapters/owlcloud/adapter.js
  var browserAPI = typeof browser !== "undefined" && browser.runtime ? browser : chrome;
  async function init(containerEl) {
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
                  const supabase = window.supabaseClient;
                  let supabaseUserId = null;
                  if (supabase) {
                    const { data: { session } } = await supabase.auth.getSession();
                    supabaseUserId = session?.user?.id;
                  }
                  const characterData = {
                    dicecloud_character_id: character.id,
                    character_name: character.name || "Unknown",
                    user_id_dicecloud: diceCloudUserId,
                    level: character.preview?.level || null,
                    class: character.preview?.class || null,
                    race: character.preview?.race || null,
                    raw_dicecloud_data: character.raw,
                    is_active: true,
                    updated_at: (/* @__PURE__ */ new Date()).toISOString()
                  };
                  if (supabaseUserId) {
                    characterData.supabase_user_id = supabaseUserId;
                    console.log("\u2705 Including Supabase user ID for cross-device sync:", supabaseUserId);
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
                      body: JSON.stringify(characterData)
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
                    statusText.innerHTML = `<div style="color: #fff;">Character synced to database!</div>`;
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
