(() => {
  // src/popup/adapters/dndbeyond/adapter.js
  var browserAPI = typeof browser !== "undefined" ? browser : chrome;
  function parseCharacterId(input) {
    const s = (input || "").trim();
    if (/^\d{1,20}$/.test(s))
      return s;
    const m = s.match(/dndbeyond\.com\/(?:profile\/[^/]+\/)?characters\/(\d{1,20})/i);
    return m ? m[1] : null;
  }
  async function init(contentEl) {
    contentEl.innerHTML = `
    <div style="padding: 4px 2px;">
      <h3 style="color: #e0e0e0; margin: 0 0 8px;">D&amp;D Beyond \u2192 Cloud</h3>
      <p style="color: #b0b0b0; margin: 0 0 14px; font-size: 13px; line-height: 1.4;">
        Paste a character link (the character must be set to <b>Public</b> on D&amp;D Beyond),
        then sync it so it's available in Roll20, Owlbear, Foundry, and Coyotes &amp; Candles.
      </p>
      <input id="ddb-input" type="text" placeholder="https://www.dndbeyond.com/characters/1234567"
        style="width: 100%; box-sizing: border-box; padding: 10px; font-size: 13px; border-radius: 8px;
               border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.06); color: #e0e0e0; margin-bottom: 10px;" />
      <button id="ddb-sync-btn" class="btn btn-primary"
        style="width: 100%; padding: 12px; font-size: 14px;">Sync to CarmaClouds</button>
      <div id="ddb-status" style="color: #b0b0b0; font-size: 13px; text-align: center; margin-top: 12px; min-height: 18px;"></div>
    </div>
  `;
    const input = contentEl.querySelector("#ddb-input");
    const btn = contentEl.querySelector("#ddb-sync-btn");
    const status = contentEl.querySelector("#ddb-status");
    const setStatus = (msg, color) => {
      status.textContent = msg;
      status.style.color = color || "#b0b0b0";
    };
    const sync = async () => {
      const id = parseCharacterId(input.value);
      if (!id) {
        setStatus("Paste a D&D Beyond character link or its numeric id.", "#f0a35e");
        return;
      }
      btn.disabled = true;
      setStatus("Syncing\u2026");
      try {
        const res = await browserAPI.runtime.sendMessage({ type: "SYNC_DNDBEYOND_TO_CARMACLOUDS", characterId: id });
        if (res && res.success) {
          setStatus(`\u2713 Synced ${res.characterName || "character"}.`, "#3ddc84");
        } else {
          setStatus(`\u2717 ${res && res.error || "Sync failed"}`, "#ff6b6b");
        }
      } catch (err) {
        setStatus(`\u2717 ${err.message || "Extension error"}`, "#ff6b6b");
      } finally {
        btn.disabled = false;
      }
    };
    btn.addEventListener("click", sync);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter")
        sync();
    });
  }
})();
//# sourceMappingURL=adapter.js.map
