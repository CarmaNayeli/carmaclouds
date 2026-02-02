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
      const SUPABASE_URL = "https://luiesmfjdcmpywavvfqm.supabase.co";
      const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWVzbWZqZGNtcHl3YXZ2ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODYxNDksImV4cCI6MjA4NTQ2MjE0OX0.oqjHFf2HhCLcanh0HVryoQH7iSV7E9dHHZJdYehxZ0U";
      const loginPrompt = wrapper.querySelector("#loginPrompt");
      const syncBox = wrapper.querySelector("#syncBox");
      const pushedCharactersList = wrapper.querySelector("#pushedCharactersList");
      const noPushedCharacters = wrapper.querySelector("#noPushedCharacters");
      async function loadPushedCharacters() {
        if (!diceCloudUserId || !pushedCharactersList)
          return;
        try {
          const response2 = await fetch(
            `${SUPABASE_URL}/rest/v1/clouds_characters?user_id_dicecloud=eq.${diceCloudUserId}&select=dicecloud_character_id,character_name,level,class,race`,
            {
              headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
              }
            }
          );
          if (response2.ok) {
            const pushedChars = await response2.json();
            pushedCharactersList.innerHTML = "";
            if (pushedChars.length > 0) {
              if (noPushedCharacters)
                noPushedCharacters.classList.add("hidden");
              pushedChars.forEach((char) => {
                const card = document.createElement("div");
                card.style.cssText = "background: #1a1a1a; padding: 12px; border-radius: 8px; border: 1px solid #333;";
                card.innerHTML = `
                <h4 style="color: #16a75a; margin: 0 0 6px 0; font-size: 14px;">${char.character_name || "Unknown"}</h4>
                <div style="display: flex; gap: 8px; font-size: 12px; color: #888;">
                  <span>Lvl ${char.level || "?"}</span>
                  <span>\u2022</span>
                  <span>${char.class || "Unknown"}</span>
                  <span>\u2022</span>
                  <span>${char.race || "Unknown"}</span>
                </div>
              `;
                pushedCharactersList.appendChild(card);
              });
            } else {
              if (noPushedCharacters)
                noPushedCharacters.classList.remove("hidden");
            }
          }
        } catch (error) {
          console.error("Failed to load pushed characters:", error);
        }
      }
      if (!diceCloudUserId) {
        if (loginPrompt)
          loginPrompt.classList.remove("hidden");
        if (syncBox)
          syncBox.classList.add("hidden");
        const openAuthBtn = wrapper.querySelector("#openAuthModalBtn");
        if (openAuthBtn) {
          openAuthBtn.addEventListener("click", () => {
            const authButton = document.querySelector("#dicecloud-auth-button");
            if (authButton)
              authButton.click();
          });
        }
      } else if (characters.length > 0 && characters[0]?.raw) {
        const character2 = characters[0];
        if (loginPrompt)
          loginPrompt.classList.add("hidden");
        if (syncBox)
          syncBox.classList.remove("hidden");
        const nameEl = wrapper.querySelector("#syncCharName");
        const levelEl = wrapper.querySelector("#syncCharLevel");
        const classEl = wrapper.querySelector("#syncCharClass");
        const raceEl = wrapper.querySelector("#syncCharRace");
        if (nameEl)
          nameEl.textContent = character2.name || "Unknown";
        if (levelEl)
          levelEl.textContent = `Lvl ${character2.preview?.level || "?"}`;
        if (classEl)
          classEl.textContent = character2.preview?.class || "Unknown";
        if (raceEl)
          raceEl.textContent = character2.preview?.race || "Unknown";
        const pushBtn = wrapper.querySelector("#pushToVttBtn");
        if (pushBtn) {
          pushBtn.addEventListener("click", async () => {
            const originalText = pushBtn.innerHTML;
            try {
              pushBtn.disabled = true;
              pushBtn.innerHTML = "\u23F3 Pushing...";
              const supabase = window.supabaseClient;
              let supabaseUserId = null;
              if (supabase) {
                const { data: { session } } = await supabase.auth.getSession();
                supabaseUserId = session?.user?.id;
              }
              const characterData = {
                dicecloud_character_id: character2.id,
                character_name: character2.name || "Unknown",
                user_id_dicecloud: diceCloudUserId,
                level: character2.preview?.level || null,
                class: character2.preview?.class || null,
                race: character2.preview?.race || null,
                raw_dicecloud_data: character2.raw,
                is_active: false,
                updated_at: (/* @__PURE__ */ new Date()).toISOString()
              };
              if (supabaseUserId) {
                characterData.supabase_user_id = supabaseUserId;
                console.log("\u2705 Including Supabase user ID:", supabaseUserId);
              }
              const response2 = await fetch(
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
              if (response2.ok) {
                console.log("\u2705 Character pushed:", character2.name);
                pushBtn.innerHTML = "\u2705 Pushed!";
                await loadPushedCharacters();
                setTimeout(() => {
                  pushBtn.innerHTML = originalText;
                  pushBtn.disabled = false;
                }, 2e3);
              } else {
                const errorText = await response2.text();
                throw new Error(`Push failed: ${errorText}`);
              }
            } catch (error) {
              console.error("Error pushing character:", error);
              pushBtn.innerHTML = "\u274C Failed";
              alert(`Failed to push: ${error.message}`);
              setTimeout(() => {
                pushBtn.innerHTML = originalText;
                pushBtn.disabled = false;
              }, 2e3);
            }
          });
        }
        await loadPushedCharacters();
      } else {
        if (loginPrompt)
          loginPrompt.classList.add("hidden");
        if (syncBox)
          syncBox.classList.add("hidden");
        if (noPushedCharacters) {
          noPushedCharacters.textContent = "No character data found. Sync a character from DiceCloud first.";
          noPushedCharacters.classList.remove("hidden");
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
