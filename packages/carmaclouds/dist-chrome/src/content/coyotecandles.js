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
      race: c.preview?.race ?? c.race ?? null
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
    if (d && d.source === "coyotes-meet" && d.type === "coyotecloud:request") {
      postRoster();
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
