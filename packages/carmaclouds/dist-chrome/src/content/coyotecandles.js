(() => {
  // src/content/coyotecandles.js
  var browserAPI = typeof browser !== "undefined" && browser.runtime ? browser : chrome;
  async function getBridgePayload() {
    const result = await browserAPI.storage.local.get(["diceCloudUserId", "carmaclouds_characters"]) || {};
    const dicecloudUserId = result.diceCloudUserId || null;
    const characters = (result.carmaclouds_characters || []).map((c) => ({
      dicecloud_character_id: c.id,
      character_name: c.name || "Unknown",
      level: c.preview?.level ?? c.level ?? null,
      class: c.preview?.class ?? c.class ?? null,
      race: c.preview?.race ?? c.race ?? null,
      // Each character carries its own DiceCloud owner id (from the raw creature),
      // so the C&C import can look it up even if the global login was cleared.
      user_id_dicecloud: c.raw?.creature?.owner || dicecloudUserId || null
    }));
    return { dicecloudUserId, characters };
  }
  async function postRoster() {
    const { dicecloudUserId, characters } = await getBridgePayload();
    window.postMessage({ source: "carmaclouds", type: "coyotecloud:characters", dicecloudUserId, characters }, window.location.origin);
  }
  window.addEventListener("message", (e) => {
    if (e.source !== window)
      return;
    const d = e.data;
    if (!d || d.source !== "coyotes-meet")
      return;
    if (d.type === "coyotecloud:request") {
      postRoster();
      return;
    }
    if (d.type === "coyotecloud:writeback") {
      const { requestId, dicecloudCharacterId, values } = d;
      const reply = (payload) => window.postMessage(
        { source: "carmaclouds", type: "coyotecloud:writeback-result", requestId, ...payload },
        window.location.origin
      );
      browserAPI.runtime.sendMessage({ action: "coyotecloudWriteback", dicecloudCharacterId, values }).then((res) => reply({
        ok: !!(res && res.ok),
        error: res && res.error,
        applied: res && res.applied,
        failed: res && res.failed
      })).catch((err) => reply({ ok: false, error: String(err && err.message || err) }));
    }
  });
  postRoster();
  browserAPI.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes.carmaclouds_characters || changes.diceCloudUserId)) {
      postRoster();
    }
  });
})();
//# sourceMappingURL=coyotecandles.js.map
