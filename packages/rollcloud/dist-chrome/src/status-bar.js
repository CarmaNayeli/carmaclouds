// Initialize debug globally
if (typeof window !== "undefined" && !window.debug) { window.debug = { log: console.log, warn: console.warn, error: console.error, info: console.info, group: console.group, groupEnd: console.groupEnd, table: console.table, time: console.time, timeEnd: console.timeEnd, isEnabled: () => true }; }
const debug = window.debug;
// Supabase config will be set by browser.js
const SUPABASE_URL = typeof window !== "undefined" ? window.SUPABASE_URL : undefined;
const SUPABASE_ANON_KEY = typeof window !== "undefined" ? window.SUPABASE_ANON_KEY : undefined;
// SupabaseTokenManager will be set by browser.js
const SupabaseTokenManager = typeof window !== "undefined" ? window.SupabaseTokenManager : undefined;
(() => {
  // src/status-bar.js
  var characterData = null;
  var advantageState = "normal";
  var EFFECT_ICONS = {
    // Buffs
    "Bless": "\u{1F64F}",
    "Guidance": "\u{1F9ED}",
    "Bardic Inspiration": "\u{1F3B5}",
    "Shield of Faith": "\u{1F6E1}\uFE0F",
    "Haste": "\u26A1",
    "Heroism": "\u{1F9B8}",
    "Aid": "\u{1F4AA}",
    "Protection from Evil": "\u271D\uFE0F",
    "Sanctuary": "\u{1F3DB}\uFE0F",
    "Blur": "\u{1F47B}",
    "Mirror Image": "\u{1FA9E}",
    "Invisibility": "\u{1F441}\uFE0F",
    "Greater Invisibility": "\u{1F441}\uFE0F",
    "Freedom of Movement": "\u{1F3C3}",
    "Death Ward": "\u{1F480}",
    // Debuffs
    "Bane": "\u{1F630}",
    "Poisoned": "\u{1F922}",
    "Frightened": "\u{1F631}",
    "Charmed": "\u{1F495}",
    "Stunned": "\u{1F4AB}",
    "Paralyzed": "\u{1F9CA}",
    "Blinded": "\u{1F648}",
    "Deafened": "\u{1F649}",
    "Restrained": "\u26D3\uFE0F",
    "Grappled": "\u{1F91D}",
    "Prone": "\u{1F6CF}\uFE0F",
    "Incapacitated": "\u{1F635}",
    "Exhaustion": "\u{1F62B}",
    "Unconscious": "\u{1F4A4}",
    "Petrified": "\u{1F5FF}",
    "Concentration": "\u{1F9E0}",
    "Hexed": "\u{1F52E}"
  };
  document.addEventListener("DOMContentLoaded", () => {
    if (typeof debug !== "undefined")
      debug.log("\u{1F4CA} Status bar loaded");
    document.getElementById("close-btn").addEventListener("click", () => window.close());
    document.getElementById("adv-btn").addEventListener("click", () => setAdvantage("advantage"));
    document.getElementById("norm-btn").addEventListener("click", () => setAdvantage("normal"));
    document.getElementById("dis-btn").addEventListener("click", () => setAdvantage("disadvantage"));
    document.getElementById("slots-header").addEventListener("click", () => {
      document.getElementById("slots-row").classList.toggle("open");
    });
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ action: "requestStatusData" }, "*");
    } else {
      document.getElementById("character-name").textContent = "No parent";
    }
  });
  window.addEventListener("message", (event) => {
    if (event.data && event.data.action === "updateStatusData") {
      characterData = event.data.data;
      updateDisplay();
    } else if (event.data && event.data.action === "updateAdvantageState") {
      setAdvantageUI(event.data.state);
    }
  });
  function setAdvantage(state) {
    advantageState = state;
    setAdvantageUI(state);
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ action: "setAdvantageState", state }, "*");
    }
  }
  function setAdvantageUI(state) {
    advantageState = state;
    document.querySelectorAll(".adv-btn").forEach((btn) => btn.classList.remove("active"));
    if (state === "advantage") {
      document.getElementById("adv-btn").classList.add("active");
    } else if (state === "disadvantage") {
      document.getElementById("dis-btn").classList.add("active");
    } else {
      document.getElementById("norm-btn").classList.add("active");
    }
  }
  function updateDisplay() {
    if (!characterData)
      return;
    document.getElementById("character-name").textContent = characterData.name || "Unknown";
    updateHP();
    updateConcentration();
    updateSpellSlots();
    updateResources();
    updateEffects();
  }
  function updateHP() {
    const hp = characterData.hitPoints || characterData.hit_points || {};
    const current = hp.current || 0;
    const max = hp.max || 1;
    const tempHP = characterData.temporaryHP || hp.temp || 0;
    const percentage = Math.max(0, Math.min(100, current / max * 100));
    const hpFill = document.getElementById("hp-fill");
    const hpText = document.getElementById("hp-text");
    const tempHPEl = document.getElementById("temp-hp");
    hpFill.style.width = `${percentage}%`;
    hpText.textContent = `${current}/${max}`;
    hpFill.className = "hp-fill";
    if (percentage <= 25)
      hpFill.classList.add("critical");
    else if (percentage <= 50)
      hpFill.classList.add("low");
    tempHPEl.textContent = tempHP > 0 ? `+${tempHP}` : "";
  }
  function updateConcentration() {
    const concEl = document.getElementById("concentration");
    const spellEl = document.getElementById("conc-spell");
    const spell = characterData.concentrationSpell || "";
    if (spell) {
      concEl.classList.remove("inactive");
      concEl.classList.add("active");
      spellEl.textContent = spell;
    } else {
      concEl.classList.remove("active");
      concEl.classList.add("inactive");
      spellEl.textContent = "\u2014";
    }
  }
  function updateSpellSlots() {
    const spellSlots = characterData.spellSlots || {};
    const slotsRow = document.getElementById("slots-row");
    const dropdown = document.getElementById("slots-dropdown");
    const summary = document.getElementById("slots-summary");
    const slots = [];
    let totalCurrent = 0;
    let totalMax = 0;
    for (let level = 1; level <= 9; level++) {
      const current = spellSlots[`level${level}SpellSlots`] || 0;
      const max = spellSlots[`level${level}SpellSlotsMax`] || 0;
      if (max > 0) {
        slots.push({ level, current, max, type: "regular" });
        totalCurrent += current;
        totalMax += max;
      }
    }
    const pactCurrent = spellSlots.pactMagicSlots || 0;
    const pactMax = spellSlots.pactMagicSlotsMax || 0;
    const pactLevel = spellSlots.pactMagicLevel || 0;
    if (pactMax > 0) {
      slots.push({ level: `P${pactLevel}`, current: pactCurrent, max: pactMax, type: "pact" });
      totalCurrent += pactCurrent;
      totalMax += pactMax;
    }
    if (slots.length === 0) {
      slotsRow.style.display = "none";
      return;
    }
    slotsRow.style.display = "block";
    summary.textContent = `${totalCurrent}/${totalMax}`;
    dropdown.innerHTML = slots.map((slot) => `
    <div class="slot-item ${slot.type === "pact" ? "pact" : ""}">
      <span class="lvl">${slot.type === "pact" ? "Pact" : "Lv" + slot.level}</span>
      <span class="val ${slot.current === 0 ? "empty" : ""}">${slot.current}/${slot.max}</span>
    </div>
  `).join("");
  }
  function updateResources() {
    const resources = characterData.resources || [];
    const resourcesRow = document.getElementById("resources-row");
    const resourcesList = document.getElementById("resources-list");
    const filteredResources = resources.filter((r) => {
      const name = (r.name || "").toLowerCase();
      return r.max > 0 && !name.includes("hit points") && !name.includes("lucky");
    });
    if (filteredResources.length === 0) {
      resourcesRow.style.display = "none";
      return;
    }
    resourcesRow.style.display = "block";
    resourcesList.innerHTML = filteredResources.slice(0, 4).map((r) => `
    <div class="resource-item">
      <span class="name" title="${r.name}">${r.name}</span>
      <span class="val">${r.current}/${r.max}</span>
    </div>
  `).join("");
  }
  function updateEffects() {
    const buffs = characterData.activeBuffs || [];
    const debuffs = characterData.activeDebuffs || [];
    const effectsRow = document.getElementById("effects-row");
    const allEffects = [
      ...buffs.map((b) => ({ name: typeof b === "string" ? b : b.name, type: "buff" })),
      ...debuffs.map((d) => ({ name: typeof d === "string" ? d : d.name, type: "debuff" }))
    ];
    if (allEffects.length === 0) {
      effectsRow.innerHTML = '<span class="no-effects">No effects</span>';
      return;
    }
    effectsRow.innerHTML = allEffects.map((e) => {
      const icon = EFFECT_ICONS[e.name] || (e.type === "buff" ? "\u2728" : "\u{1F480}");
      return `<span class="effect-badge" title="${e.name}">${icon}<span class="tooltip">${e.name}</span></span>`;
    }).join("");
  }
  setInterval(() => {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ action: "requestStatusData" }, "*");
    } else {
      window.close();
    }
  }, 5e3);
})();
//# sourceMappingURL=status-bar.js.map
