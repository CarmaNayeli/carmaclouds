(() => {
  // ../core/src/ir/normalize.ts
  var DND_ABILITIES = [
    "strength",
    "dexterity",
    "constitution",
    "intelligence",
    "wisdom",
    "charisma"
  ];
  function detectSystem(byVar) {
    const hasAbilities = DND_ABILITIES.every((ab) => byVar[ab]);
    const hasProfBonus = !!byVar["proficiencyBonus"];
    const hasHitDice = Object.values(byVar).some((a) => a.type === "hitDice");
    return hasAbilities && hasProfBonus && hasHitDice ? "dnd5e" : "generic";
  }
  function numOf(v) {
    if (v == null)
      return 0;
    if (typeof v === "number")
      return Number.isFinite(v) ? v : 0;
    if (typeof v === "object")
      return numOf(v.value ?? v.total ?? 0);
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  function has(v) {
    return v != null && !(typeof v === "object" && v.value == null && v.total == null);
  }
  function textOf(d) {
    if (!d)
      return void 0;
    if (typeof d === "string")
      return d || void 0;
    return d.text ?? d.value ?? void 0;
  }
  function resetOf(p) {
    return p.reset ?? null;
  }
  function isRemoved(p) {
    return !p || p.removed === true;
  }
  function activeOf(p) {
    return !p.inactive && !p.deactivatedBySelf && !p.deactivatedByAncestor;
  }
  function normalizeAttribute(p) {
    const value = numOf(p.value);
    const total = numOf(p.total);
    const damage = numOf(p.damage);
    const attr = {
      id: p._id,
      name: p.name ?? p.variableName ?? "",
      variableName: p.variableName ?? "",
      type: p.attributeType ?? "stat",
      value,
      total,
      damage,
      reset: resetOf(p),
      active: activeOf(p),
      tags: Array.isArray(p.tags) ? p.tags : [],
      description: textOf(p.description)
    };
    if (p.attributeType === "ability") {
      attr.modifier = has(p.modifier) ? numOf(p.modifier) : Math.floor((value - 10) / 2);
    }
    if (p.attributeType === "hitDice" && p.hitDiceSize) {
      attr.hitDiceSize = String(p.hitDiceSize);
    }
    if (p.attributeType === "spellSlot" && has(p.spellSlotLevel)) {
      attr.spellSlotLevel = numOf(p.spellSlotLevel);
    }
    return attr;
  }
  function normalizeSkill(p) {
    return {
      id: p._id,
      name: p.name ?? p.variableName ?? "",
      variableName: p.variableName ?? "",
      skillType: p.skillType ?? "skill",
      value: numOf(p.value),
      ability: p.ability || void 0,
      proficiency: numOf(p.proficiency),
      active: activeOf(p),
      tags: Array.isArray(p.tags) ? p.tags : []
    };
  }
  function normalizeItem(p) {
    return {
      id: p._id,
      name: p.name ?? "",
      plural: p.plural || void 0,
      quantity: p.quantity != null ? numOf(p.quantity) : 1,
      equipped: !!p.equipped,
      weight: has(p.weight) ? numOf(p.weight) : void 0,
      value: has(p.value) ? numOf(p.value) : void 0,
      description: textOf(p.description),
      tags: Array.isArray(p.tags) ? p.tags : []
    };
  }
  function consumesOf(p) {
    const consumed = p.resources?.attributesConsumed;
    if (!Array.isArray(consumed))
      return [];
    return consumed.map((c) => ({
      variableName: c.variableName || void 0,
      propertyId: c._id || c.variableId || void 0,
      amount: numOf(c.quantity ?? c.amount ?? 1)
    }));
  }
  function normalizeAction(p, damageByParent) {
    const kind = p.type === "spell" ? "spell" : p.type === "feature" ? "feature" : "action";
    const damage = (damageByParent[p._id] ?? []).map((d) => ({
      formula: d.amount?.calculation ?? String(d.amount?.value ?? ""),
      type: d.damageType || void 0
    })).filter((d) => d.formula);
    const action = {
      id: p._id,
      name: p.name ?? "",
      kind,
      active: activeOf(p),
      consumes: consumesOf(p),
      damage,
      tags: Array.isArray(p.tags) ? p.tags : [],
      description: textOf(p.description)
    };
    const max = numOf(p.uses);
    if (has(p.uses) && max > 0) {
      const current = has(p.usesLeft) ? numOf(p.usesLeft) : Math.max(0, max - numOf(p.usesUsed));
      action.uses = { current, max, reset: resetOf(p) };
    }
    if (has(p.attackRoll)) {
      action.attack = { bonus: numOf(p.attackRoll) };
    }
    if (kind === "spell") {
      action.spell = {
        level: numOf(p.level),
        school: p.school || void 0,
        castingTime: p.castingTime || void 0,
        range: p.range || void 0,
        duration: p.duration || void 0,
        components: p.components || void 0,
        concentration: p.components?.concentration ?? void 0,
        ritual: p.components?.ritual ?? void 0
      };
    }
    return action;
  }
  function isActionLike(p) {
    if (p.type === "action" || p.type === "spell")
      return true;
    if (p.type === "feature")
      return has(p.uses) && numOf(p.uses) > 0;
    return false;
  }
  function normalize(raw) {
    var _a;
    const creature = raw?.creatures?.[0] ?? raw?.creature ?? {};
    const allProps = raw?.creatureProperties ?? raw?.properties ?? [];
    const props = allProps.filter((p) => !isRemoved(p));
    const attributes = props.filter((p) => p.type === "attribute").map(normalizeAttribute);
    const skills = props.filter((p) => p.type === "skill").map(normalizeSkill);
    const damageByParent = {};
    for (const p of props) {
      if (p.type === "damage" && p.parent?.id) {
        (damageByParent[_a = p.parent.id] ?? (damageByParent[_a] = [])).push(p);
      }
    }
    const actions = props.filter(isActionLike).map((p) => normalizeAction(p, damageByParent));
    const inventory = props.filter((p) => p.type === "item").map(normalizeItem);
    const byVar = {};
    for (const a of attributes) {
      if (a.variableName)
        byVar[a.variableName] = a;
    }
    return {
      id: creature._id ?? "",
      name: creature.name ?? "",
      portrait: creature.picture || creature.avatarPicture || void 0,
      systemHint: detectSystem(byVar),
      attributes,
      skills,
      actions,
      inventory,
      byVar
    };
  }

  // ../core/src/ir/views/dnd5e.ts
  var DND_ABILITIES2 = [
    "strength",
    "dexterity",
    "constitution",
    "intelligence",
    "wisdom",
    "charisma"
  ];
  var valOf = (a) => a?.value ?? 0;
  function pool(a) {
    if (!a)
      return { current: 0, max: 0 };
    return { current: a.total - a.damage, max: a.total };
  }
  function deriveDnd(ir) {
    const { byVar } = ir;
    const abilities = {};
    for (const ab of DND_ABILITIES2) {
      const a = byVar[ab];
      if (a)
        abilities[ab] = { score: a.value, modifier: a.modifier ?? Math.floor((a.value - 10) / 2) };
    }
    const saves = {};
    const skills = {};
    for (const s of ir.skills) {
      if (s.skillType === "save")
        saves[s.ability || s.variableName] = s.value;
      else if (s.skillType === "skill")
        skills[s.variableName] = s.value;
    }
    const hitDice = ir.attributes.filter((a) => a.type === "hitDice").map((a) => ({ current: a.value, max: a.total, size: a.hitDiceSize }));
    const spellSlots = {};
    for (const a of ir.attributes) {
      if (a.type === "spellSlot" && a.spellSlotLevel) {
        spellSlots[a.spellSlotLevel] = pool(a);
      }
    }
    const hp = pool(byVar["hitPoints"]);
    return {
      abilities,
      saves,
      skills,
      hitPoints: { ...hp, temp: valOf(byVar["tempHP"] || byVar["temporaryHitPoints"]) },
      hitDice,
      spellSlots,
      proficiencyBonus: valOf(byVar["proficiencyBonus"]),
      armorClass: valOf(byVar["armorClass"]),
      speed: valOf(byVar["speed"]),
      initiative: valOf(byVar["initiative"])
    };
  }

  // ../core/src/render/h.ts
  function append(el, child) {
    if (child == null || child === false || child === true)
      return;
    if (Array.isArray(child)) {
      for (const c of child)
        append(el, c);
    } else if (child instanceof Node) {
      el.appendChild(child);
    } else {
      el.appendChild(document.createTextNode(String(child)));
    }
  }
  function h(tag, props, ...children) {
    const el = document.createElement(tag);
    if (props) {
      for (const [key, value] of Object.entries(props)) {
        if (value == null || value === false)
          continue;
        if (key === "text") {
          el.textContent = String(value);
        } else if (key === "class") {
          el.className = value;
        } else if (key === "style") {
          if (typeof value === "string")
            el.style.cssText = value;
          else
            Object.assign(el.style, value);
        } else if (key === "dataset") {
          Object.assign(el.dataset, value);
        } else if (key.length > 2 && key[0] === "o" && key[1] === "n" && key[2] === key[2].toUpperCase() && typeof value === "function") {
          el.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
          el.setAttribute(key, String(value));
        }
      }
    }
    append(el, children);
    return el;
  }
  function setChildren(el, ...children) {
    el.replaceChildren();
    append(el, children);
    return el;
  }

  // ../core/src/render/character.ts
  var RESET_LABEL = { shortRest: "SR", longRest: "LR" };
  var signed = (n) => `${n >= 0 ? "+" : ""}${n}`;
  function sectionHeader(title) {
    return h("div", { class: "section-header", text: title });
  }
  function resetBadge(reset) {
    if (!reset)
      return null;
    return h("span", { class: "cc-reset-badge", text: RESET_LABEL[reset] ?? reset });
  }
  function poolPill(current, max) {
    return h(
      "span",
      { class: "cc-pool" },
      h("span", { class: "cc-pool-current", text: String(current) }),
      " / ",
      h("span", { class: "cc-pool-max", text: String(max) })
    );
  }
  function combatStats(ir) {
    const { byVar } = ir;
    const pick = (...names) => names.map((n) => byVar[n]).find(Boolean);
    const items = [];
    const hp = pick("hitPoints", "hp");
    if (hp)
      items.push(["HP", `${hp.total - hp.damage}/${hp.total}`]);
    const ac = pick("armorClass", "armor", "ac");
    if (ac && ac.value)
      items.push(["AC", String(ac.value)]);
    const speed = pick("speed", "walkingSpeed");
    if (speed && speed.value)
      items.push(["Speed", String(speed.value)]);
    const init = pick("initiative", "initiativeBonus", "initiativeMod");
    if (init)
      items.push(["Init", signed(init.value)]);
    const prof = pick("proficiencyBonus", "proficiency");
    if (prof && prof.value)
      items.push(["Prof", signed(prof.value)]);
    if (items.length === 0)
      return null;
    return h(
      "div",
      { class: "cc-combat" },
      ...items.map(([label, val]) => h(
        "div",
        { class: "cc-stat" },
        h("div", { class: "cc-stat-label", text: label }),
        h("div", { class: "cc-stat-value", text: val })
      ))
    );
  }
  function skillsSection(ir, opts) {
    const skills = ir.skills.filter((s) => s.skillType === "skill" && s.active && s.variableName);
    if (skills.length === 0)
      return null;
    const list = h("div", { class: "cc-skill-list" });
    for (const s of skills) {
      list.appendChild(
        h(
          "div",
          {
            class: "cc-skill" + (s.proficiency > 0 ? " cc-proficient" : ""),
            title: `Roll ${s.name}`,
            onClick: () => opts.onRoll?.(s.name, s.value)
          },
          h("span", { class: "cc-skill-name", text: s.name }),
          h("span", { class: "cc-skill-bonus", text: signed(s.value) })
        )
      );
    }
    return h("div", {}, sectionHeader("Skills"), list);
  }
  function abilityGrid(ir, opts) {
    const dnd = deriveDnd(ir);
    if (Object.keys(dnd.abilities).length === 0)
      return null;
    const grid = h("div", { class: "ability-grid" });
    for (const ab of DND_ABILITIES2) {
      const a = dnd.abilities[ab];
      if (!a)
        continue;
      const label = ab.slice(0, 3).toUpperCase();
      grid.appendChild(
        h(
          "div",
          {
            class: "ability-box",
            title: `Roll ${label} check`,
            onClick: () => opts.onRoll?.(label, a.modifier)
          },
          h("div", { class: "ability-name", text: label }),
          h("div", { class: "ability-score", text: String(a.score) }),
          h("div", { class: "ability-mod", text: signed(a.modifier) })
        )
      );
    }
    return h("div", {}, sectionHeader("Abilities"), grid);
  }
  function resourcesSection(ir) {
    const isResourceLike = (a) => (a.type === "resource" || a.type === "spellSlot" || a.type === "hitDice") && a.total > 0;
    const resources = ir.attributes.filter(isResourceLike);
    if (resources.length === 0)
      return null;
    const list = h("div", { class: "cc-resource-list" });
    for (const r of resources) {
      const current = r.total - r.damage;
      const sizeNote = r.hitDiceSize ? ` ${r.hitDiceSize}` : "";
      list.appendChild(
        h(
          "div",
          { class: "cc-resource" + (r.active ? "" : " cc-inactive") },
          h("span", { class: "cc-resource-name", text: r.name + sizeNote }),
          poolPill(current, r.total),
          resetBadge(r.reset)
        )
      );
    }
    return h("div", {}, sectionHeader("Resources"), list);
  }
  function attributesSection(ir) {
    const hidden = /* @__PURE__ */ new Set([
      "ability",
      "modifier",
      "healthBar",
      "resource",
      "spellSlot",
      "hitDice",
      "utility"
    ]);
    const custom = ir.attributes.filter((a) => !hidden.has(a.type) && a.variableName && a.value !== 0);
    if (custom.length === 0)
      return null;
    const list = h("div", { class: "cc-attr-list" });
    for (const a of custom) {
      list.appendChild(
        h(
          "div",
          { class: "cc-attr" + (a.active ? "" : " cc-inactive") },
          h("span", { class: "cc-attr-name", text: a.name }),
          h("span", { class: "cc-attr-value", text: String(a.value) })
        )
      );
    }
    return h("div", {}, sectionHeader("Attributes"), list);
  }
  function actionsSection(ir, opts) {
    if (ir.actions.length === 0)
      return null;
    const list = h("div", { class: "cc-action-list" });
    for (const action of ir.actions) {
      const meta = [];
      if (action.kind === "spell" && action.spell) {
        meta.push(h("span", { class: "cc-action-tag", text: `L${action.spell.level}` }));
      }
      if (action.attack) {
        meta.push(h("span", { class: "cc-action-attack", title: "Attack bonus", text: signed(action.attack.bonus) }));
      }
      for (const d of action.damage) {
        meta.push(h("span", { class: "cc-action-damage", text: d.type ? `${d.formula} ${d.type}` : d.formula }));
      }
      const usesEl = action.uses ? h("span", { class: "cc-action-uses" }, poolPill(action.uses.current, action.uses.max), resetBadge(action.uses.reset)) : null;
      list.appendChild(
        h(
          "div",
          {
            class: `cc-action cc-action-${action.kind}` + (action.active ? "" : " cc-inactive"),
            onClick: opts.onUse ? () => opts.onUse(action) : void 0
          },
          h("span", { class: "cc-action-name", text: action.name }),
          ...meta,
          usesEl
        )
      );
    }
    return h("div", {}, sectionHeader("Actions & Spells"), list);
  }
  function inventorySection(ir) {
    if (ir.inventory.length === 0)
      return null;
    const list = h("div", { class: "cc-item-list" });
    for (const item of ir.inventory) {
      list.appendChild(
        h(
          "div",
          { class: "cc-item" + (item.equipped ? " cc-equipped" : "") },
          item.equipped ? h("span", { class: "cc-equipped-dot", title: "Equipped" }) : null,
          h("span", { class: "cc-item-name", text: item.name }),
          item.quantity !== 1 ? h("span", { class: "cc-item-qty", text: `x${item.quantity}` }) : null
        )
      );
    }
    return h("div", {}, sectionHeader("Inventory"), list);
  }
  function renderCharacterSheet(ir, opts = {}) {
    const header = h(
      "div",
      { class: "cc-header" },
      ir.portrait ? h("img", { class: "cc-portrait", src: ir.portrait, alt: ir.name }) : null,
      h(
        "div",
        { class: "cc-title" },
        h("div", { class: "cc-name", text: ir.name || "Unnamed" }),
        h("span", { class: "cc-system", text: ir.systemHint })
      )
    );
    return h(
      "div",
      { class: "cc-sheet", dataset: { system: ir.systemHint } },
      header,
      combatStats(ir),
      abilityGrid(ir, opts),
      skillsSection(ir, opts),
      resourcesSection(ir),
      actionsSection(ir, opts),
      attributesSection(ir),
      inventorySection(ir)
    );
  }

  // src/owlbear-cc-core-entry.js
  window.CarmaCloudsCore = { normalize, deriveDnd, renderCharacterSheet, h, setChildren };
})();
