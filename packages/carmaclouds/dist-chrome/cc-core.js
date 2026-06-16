(() => {
  // ../core/dist/ir/normalize.js
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
    let t;
    if (typeof d === "string")
      t = d;
    else
      t = typeof d.value === "string" && d.value.trim() ? d.value : d.text || void 0;
    if (!t)
      return void 0;
    return t.replace(/\*\*/g, "") || void 0;
  }
  function descOf(p) {
    const s = textOf(p.summary);
    const d = textOf(p.description);
    if (s && d && s !== d)
      return `${s}

${d}`;
    return s ?? d;
  }
  function evalArith(s) {
    let i = 0;
    const skip = () => {
      while (i < s.length && /\s/.test(s[i]))
        i++;
    };
    const FNS = ["max", "min", "floor", "ceil", "round", "abs"];
    function expr() {
      let v = term();
      skip();
      while (s[i] === "+" || s[i] === "-") {
        const o = s[i++];
        const r = term();
        v = o === "+" ? v + r : v - r;
        skip();
      }
      return v;
    }
    function term() {
      let v = factor();
      skip();
      while (s[i] === "*" || s[i] === "/") {
        const o = s[i++];
        const r = factor();
        v = o === "*" ? v * r : v / r;
        skip();
      }
      return v;
    }
    function factor() {
      skip();
      if (s[i] === "(") {
        i++;
        const v = expr();
        skip();
        if (s[i] === ")")
          i++;
        return v;
      }
      if (s[i] === "-") {
        i++;
        return -factor();
      }
      if (s[i] === "+") {
        i++;
        return factor();
      }
      const fn = /^([a-zA-Z_]\w*)\s*\(/.exec(s.slice(i));
      if (fn && FNS.includes(fn[1])) {
        i += fn[0].length;
        const args = [expr()];
        skip();
        while (s[i] === ",") {
          i++;
          args.push(expr());
          skip();
        }
        if (s[i] === ")")
          i++;
        switch (fn[1]) {
          case "max":
            return Math.max(...args);
          case "min":
            return Math.min(...args);
          case "floor":
            return Math.floor(args[0]);
          case "ceil":
            return Math.ceil(args[0]);
          case "round":
            return Math.round(args[0]);
          default:
            return Math.abs(args[0]);
        }
      }
      const num = /^\d+(\.\d+)?/.exec(s.slice(i));
      if (num) {
        i += num[0].length;
        return parseFloat(num[0]);
      }
      throw new Error("parse");
    }
    try {
      const v = expr();
      skip();
      return i >= s.length && Number.isFinite(v) ? v : null;
    } catch {
      return null;
    }
  }
  function resolveInline(text, vars) {
    if (!text || !text.includes("{"))
      return text || void 0;
    const out = text.replace(/\{([^}]*)\}/g, (_m, e) => {
      const sub = e.replace(/[a-zA-Z_]\w*/g, (id) => ["max", "min", "floor", "ceil", "round", "abs"].includes(id) ? id : id in vars ? String(vars[id]) : id);
      const v = evalArith(sub);
      return v == null ? "" : String(Number.isInteger(v) ? v : +v.toFixed(2));
    });
    return out.replace(/\s{2,}/g, " ").trim() || void 0;
  }
  function metaStr(field, vars) {
    const t = field && typeof field === "object" ? textOf(field) : field || void 0;
    return resolveInline(t, vars);
  }
  function buildVars(raw) {
    const vars = {};
    const rv = raw?.variables ?? raw?.creatureVariables;
    if (Array.isArray(rv)) {
      for (const v of rv)
        if (v?.variableName)
          vars[v.variableName] = numOf(v.value ?? v);
    } else if (rv && typeof rv === "object") {
      for (const [k, val] of Object.entries(rv))
        vars[k] = numOf(val);
    }
    return vars;
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
      description: descOf(p)
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
      description: descOf(p),
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
  function normalizeAction(p, damageByParent, attackByParent, vars) {
    const kind = p.type === "spell" ? "spell" : p.type === "feature" ? "feature" : "action";
    const damage = (damageByParent[p._id] ?? []).map((d) => ({
      formula: d.amount?.calculation ?? String(d.amount?.value ?? ""),
      type: d.damageType || void 0
    })).filter((d) => d.formula);
    const action = {
      id: p._id,
      name: p.name ?? "",
      kind,
      actionType: p.actionType || void 0,
      active: activeOf(p),
      consumes: consumesOf(p),
      damage,
      tags: Array.isArray(p.tags) ? p.tags : [],
      description: descOf(p)
    };
    const max = numOf(p.uses);
    if (has(p.uses) && max > 0) {
      const current = has(p.usesLeft) ? numOf(p.usesLeft) : Math.max(0, max - numOf(p.usesUsed));
      action.uses = { current, max, reset: resetOf(p) };
    }
    if (has(p.attackRoll)) {
      action.attack = { bonus: numOf(p.attackRoll) };
    } else if (p.type === "attack" && has(p.roll)) {
      action.attack = { bonus: numOf(p.roll) };
    } else {
      const atk = attackByParent[p._id]?.[0];
      if (atk && (has(atk.attackRoll) || has(atk.roll))) {
        action.attack = { bonus: numOf(atk.attackRoll ?? atk.roll) };
      }
    }
    if (kind === "spell") {
      action.spell = {
        level: numOf(p.level),
        school: p.school || void 0,
        castingTime: metaStr(p.castingTime, vars),
        range: metaStr(p.range, vars),
        duration: metaStr(p.duration, vars),
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
    const creature = raw?.creatures?.[0] ?? raw?.creature ?? {};
    const allProps = raw?.creatureProperties ?? raw?.properties ?? [];
    const props = allProps.filter((p) => !isRemoved(p));
    const attributes = props.filter((p) => p.type === "attribute").map(normalizeAttribute);
    const skills = props.filter((p) => p.type === "skill").map(normalizeSkill);
    const damageByParent = {};
    const attackByParent = {};
    for (const p of props) {
      const pid = p.parent?.id;
      if (!pid)
        continue;
      if (p.type === "damage")
        (damageByParent[pid] ?? (damageByParent[pid] = [])).push(p);
      else if (p.type === "attack")
        (attackByParent[pid] ?? (attackByParent[pid] = [])).push(p);
    }
    const vars = buildVars(raw);
    const actions = props.filter(isActionLike).map((p) => normalizeAction(p, damageByParent, attackByParent, vars));
    const haveAction = new Set(actions.filter((a) => a.active).map((a) => a.name.toLowerCase()));
    const weaponActions = props.filter((p) => p.type === "item" && p.equipped && ((attackByParent[p._id]?.length ?? 0) > 0 || (damageByParent[p._id]?.length ?? 0) > 0)).filter((p) => !haveAction.has((p.name ?? "").toLowerCase())).map((p) => normalizeAction({ ...p, type: "action" }, damageByParent, attackByParent, vars));
    actions.push(...weaponActions);
    const inventory = props.filter((p) => p.type === "item").map(normalizeItem);
    const conditions = props.filter((p) => p.type === "buff" || p.type === "toggle").map((p) => ({
      id: p._id,
      name: p.name ?? "",
      kind: p.type,
      active: activeOf(p),
      description: descOf(p)
    })).filter((c) => c.name);
    const classes = props.filter((p) => p.type === "class").map((p) => ({ name: p.name ?? "", level: numOf(p.level) })).filter((c) => c.name);
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
      conditions,
      classes,
      byVar
    };
  }

  // ../core/dist/ir/views/dnd5e.js
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

  // ../core/dist/render/h.js
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

  // ../core/dist/render/character.js
  function actionChoices(action, opts) {
    const choices = [];
    const isSpell = action.kind === "spell";
    const hasRolls = !!action.attack || action.damage.length > 0;
    if (opts.onUse && (isSpell || !hasRolls)) {
      choices.push({ label: isSpell ? "Cast" : "Use", kind: "use", run: () => opts.onUse(action) });
    }
    if (action.attack && opts.onRoll) {
      const bonus = action.attack.bonus;
      choices.push({
        label: `${isSpell ? "Spell " : ""}Attack ${signed(bonus)}`,
        kind: "attack",
        run: () => opts.onRoll(`${action.name} attack`, bonus)
      });
    }
    if (opts.onRollFormula) {
      for (const d of action.damage) {
        choices.push({
          label: d.type ? `${d.formula} ${d.type}` : d.formula,
          kind: "damage",
          run: () => opts.onRollFormula(`${action.name} damage`, d.formula)
        });
      }
    }
    return choices;
  }
  function openActionModal(action, choices) {
    const close = () => overlay.remove();
    const btn = (c) => h("button", {
      class: `cc-modal-choice cc-modal-${c.kind}`,
      text: c.label,
      onClick: () => {
        c.run();
        close();
      }
    });
    const dialog = h("div", { class: "cc-modal" }, h("div", { class: "cc-modal-title", text: action.name }), action.kind === "spell" && action.spell ? h("div", { class: "cc-modal-sub", text: action.spell.level === 0 ? "Cantrip" : `Level ${action.spell.level} spell` }) : null, h("div", { class: "cc-modal-choices" }, ...choices.map(btn)), h("button", { class: "cc-modal-cancel", text: "Cancel", onClick: close }));
    const overlay = h("div", { class: "cc-modal-overlay", onClick: (e) => {
      if (e.target === overlay)
        close();
    } }, dialog);
    document.body.appendChild(overlay);
  }
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
    return h("span", { class: "cc-pool" }, h("span", { class: "cc-pool-current", text: String(current) }), " / ", h("span", { class: "cc-pool-max", text: String(max) }));
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
    const spellDC = pick("spellSaveDC", "spellSaveDc", "spellDifficultyClass", "spellDc");
    if (spellDC && spellDC.value)
      items.push(["Spell DC", String(spellDC.value)]);
    const spellAtk = pick("spellAttack", "spellAttackBonus", "spellAttackMod", "spellAttackRoll");
    if (spellAtk && spellAtk.value)
      items.push(["Spell Atk", signed(spellAtk.value)]);
    if (items.length === 0)
      return null;
    return h("div", { class: "cc-combat" }, ...items.map(([label, val]) => h("div", { class: "cc-stat" }, h("div", { class: "cc-stat-label", text: label }), h("div", { class: "cc-stat-value", text: val }))));
  }
  function skillsSection(ir, opts) {
    const skills = ir.skills.filter((s) => s.skillType === "skill" && s.active && s.variableName);
    if (skills.length === 0)
      return null;
    const list = h("div", { class: "cc-skill-list" });
    for (const s of skills) {
      list.appendChild(h("div", {
        class: "cc-skill" + (s.proficiency > 0 ? " cc-proficient" : ""),
        title: `Roll ${s.name}`,
        onClick: () => opts.onRoll?.(s.name, s.value)
      }, h("span", { class: "cc-skill-name", text: s.name }), h("span", { class: "cc-skill-bonus", text: signed(s.value) })));
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
      const save = dnd.saves[ab];
      const rollCell = (kind, value) => h("div", {
        class: "cc-ability-roll",
        title: `Roll ${label} ${kind === "CHK" ? "check" : "save"}`,
        onClick: () => opts.onRoll?.(`${label} ${kind === "CHK" ? "check" : "save"}`, value)
      }, h("div", { class: "cc-roll-label", text: kind }), h("div", { class: "cc-roll-val", text: signed(value) }));
      grid.appendChild(h("div", { class: "ability-box" }, h("div", { class: "ability-name", text: label }), h("div", { class: "ability-score", text: String(a.score) }), h("div", { class: "cc-ability-rolls" }, rollCell("CHK", a.modifier), save !== void 0 ? rollCell("SAV", save) : null)));
    }
    return h("div", {}, sectionHeader("Abilities"), grid);
  }
  function resourcesSection(ir) {
    const isResourceLike = (a) => (a.type === "resource" || a.type === "spellSlot" || a.type === "hitDice") && a.total > 0;
    const resources = ir.attributes.filter(isResourceLike);
    if (resources.length === 0)
      return null;
    const rank = (a) => a.type === "hitDice" ? 0 : a.type === "spellSlot" ? 1 : 2;
    resources.sort((a, b) => rank(a) - rank(b) || (a.spellSlotLevel ?? 0) - (b.spellSlotLevel ?? 0) || a.name.localeCompare(b.name));
    const list = h("div", { class: "cc-resource-list" });
    for (const r of resources) {
      const current = r.total - r.damage;
      const sizeNote = r.hitDiceSize ? ` ${r.hitDiceSize}` : "";
      list.appendChild(h("div", { class: "cc-resource" + (r.active ? "" : " cc-inactive") }, h("span", { class: "cc-resource-name", text: r.name + sizeNote }), poolPill(current, r.total), resetBadge(r.reset)));
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
      list.appendChild(h("div", { class: "cc-attr" + (a.active ? "" : " cc-inactive") }, h("span", { class: "cc-attr-name", text: a.name }), h("span", { class: "cc-attr-value", text: String(a.value) })));
    }
    return h("div", {}, sectionHeader("Attributes"), list);
  }
  function componentsStr(c) {
    if (!c)
      return "";
    return [c.verbal && "V", c.somatic && "S", c.material && "M"].filter(Boolean).join(", ");
  }
  function spellDetailRows(s) {
    const rows = [];
    if (s.castingTime)
      rows.push(["Casting Time", s.castingTime]);
    if (s.range)
      rows.push(["Range", s.range]);
    if (s.duration)
      rows.push(["Duration", s.duration]);
    if (s.school)
      rows.push(["School", s.school]);
    const comp = componentsStr(s.components);
    if (comp)
      rows.push(["Components", comp]);
    return rows;
  }
  var TIMING_LABEL = {
    action: "Action",
    bonus: "Bonus Action",
    reaction: "Reaction",
    free: "Free",
    long: "Long Action"
  };
  function detailRows(action) {
    if (action.kind === "spell" && action.spell) {
      const rows2 = spellDetailRows(action.spell);
      if (rows2.length === 0) {
        rows2.push(["Level", action.spell.level === 0 ? "Cantrip" : String(action.spell.level)]);
      }
      return rows2;
    }
    const t = action.actionType;
    const rows = [["Type", t && (TIMING_LABEL[t] ?? t) || "Action"]];
    if (action.consumes.length) {
      rows.push(["Consumes", action.consumes.map((c) => `${c.amount}${c.variableName ? " " + c.variableName : ""}`).join(", ")]);
    }
    return rows;
  }
  function actionEl(action, opts) {
    const meta = [];
    if (action.kind === "spell" && action.spell) {
      const s = action.spell;
      meta.push(h("span", { class: "cc-action-tag", text: s.level === 0 ? "Cantrip" : `L${s.level}` }));
      if (s.school)
        meta.push(h("span", { class: "cc-action-meta", text: s.school }));
      if (s.range)
        meta.push(h("span", { class: "cc-action-meta", text: s.range }));
      if (s.concentration)
        meta.push(h("span", { class: "cc-action-flag", title: "Concentration", text: "C" }));
      if (s.ritual)
        meta.push(h("span", { class: "cc-action-flag", title: "Ritual", text: "R" }));
    }
    const usesEl = action.uses ? h("span", { class: "cc-action-uses" }, poolPill(action.uses.current, action.uses.max), resetBadge(action.uses.reset)) : null;
    const desc = (action.description || "").trim();
    const rows = detailRows(action);
    const detailEls = [
      h("div", { class: "cc-detail-grid" }, ...rows.map(([k, v]) => h("div", { class: "cc-detail-row" }, h("span", { class: "cc-detail-key", text: k }), h("span", { class: "cc-detail-val", text: v }))))
    ];
    if (desc)
      detailEls.push(h("div", { class: "cc-detail-desc", text: desc }));
    const descPanel = h("div", { class: "cc-action-desc", style: "display:none;" }, ...detailEls);
    const detailsBtn = h("button", {
      class: "cc-btn cc-btn-details",
      text: "Details",
      onClick: () => {
        const open = descPanel.style.display === "none";
        descPanel.style.display = open ? "block" : "none";
        detailsBtn.textContent = open ? "Hide" : "Details";
      }
    });
    const choices = actionChoices(action, opts);
    let doBtn = null;
    if (choices.length === 1) {
      const c = choices[0];
      doBtn = h("button", { class: `cc-btn cc-btn-${c.kind}`, text: c.label, onClick: c.run });
    } else if (choices.length > 1) {
      const label = action.kind === "spell" ? "Cast" : action.attack || action.damage.length ? "Roll" : "Use";
      doBtn = h("button", { class: "cc-btn cc-btn-do", text: label, onClick: () => openActionModal(action, choices) });
    }
    const row = h("div", { class: "cc-action-row" }, h("span", { class: "cc-action-name", text: action.name }), ...meta, usesEl, h("div", { class: "cc-action-controls" }, doBtn, detailsBtn));
    return h("div", {
      class: `cc-action cc-action-${action.kind}` + (action.active ? "" : " cc-inactive"),
      dataset: { name: action.name.toLowerCase(), timing: action.actionType || "" }
    }, row, descPanel);
  }
  function filterControls(body, placeholder, groups = []) {
    const search = h("input", { class: "cc-search", type: "text", placeholder });
    const active = {};
    const rows = () => Array.from(body.querySelectorAll(".cc-action, .cc-item"));
    const apply = () => {
      const q = search.value.trim().toLowerCase();
      for (const row of rows()) {
        const nameHit = !q || (row.dataset.name || "").includes(q);
        const chipHit = groups.every((g) => !active[g.key] || row.dataset[g.key] === active[g.key]);
        row.style.display = nameHit && chipHit ? "" : "none";
      }
      for (const grp of Array.from(body.querySelectorAll(".cc-spell-group"))) {
        const any = Array.from(grp.querySelectorAll(".cc-action")).some((r) => r.style.display !== "none");
        grp.style.display = any ? "" : "none";
      }
    };
    search.addEventListener("input", apply);
    const chipRows = groups.map((g) => {
      const chipEls = [];
      const allChip = h("button", { class: "cc-chip cc-chip-active", text: "All" });
      const setActive = (el, val) => {
        active[g.key] = val;
        for (const c of chipEls)
          c.classList.toggle("cc-chip-active", c === el);
        apply();
      };
      allChip.addEventListener("click", () => setActive(allChip, ""));
      chipEls.push(allChip);
      for (const c of g.chips) {
        const el = h("button", { class: "cc-chip", text: c.label });
        el.addEventListener("click", () => setActive(el, c.val));
        chipEls.push(el);
      }
      return h("div", { class: "cc-chip-row" }, ...chipEls);
    });
    return h("div", { class: "cc-controls" }, search, ...chipRows);
  }
  function actionsSection(ir, opts) {
    const acts = ir.actions.filter((a) => a.kind !== "spell" && a.active);
    if (acts.length === 0)
      return null;
    const list = h("div", { class: "cc-action-list" }, ...acts.map((a) => actionEl(a, opts)));
    const controls = filterControls(list, "Search actions...", [
      { key: "timing", chips: [
        { label: "Action", val: "action" },
        { label: "Bonus", val: "bonus" },
        { label: "Reaction", val: "reaction" },
        { label: "Free", val: "free" }
      ] }
    ]);
    return h("div", {}, sectionHeader("Actions"), controls, list);
  }
  function spellsSection(ir, opts) {
    const spells = ir.actions.filter((a) => a.kind === "spell" && a.active);
    if (spells.length === 0)
      return null;
    const byLevel = /* @__PURE__ */ new Map();
    for (const s of spells) {
      const lvl = s.spell?.level ?? 0;
      if (!byLevel.has(lvl))
        byLevel.set(lvl, []);
      byLevel.get(lvl).push(s);
    }
    const groups = [];
    for (const lvl of [...byLevel.keys()].sort((a, b) => a - b)) {
      const label = lvl === 0 ? "Cantrips" : `Level ${lvl}`;
      groups.push(h("div", { class: "cc-spell-group" }, h("div", { class: "cc-spell-group-label", text: label }), h("div", { class: "cc-action-list" }, ...byLevel.get(lvl).map((s) => actionEl(s, opts)))));
    }
    const wrap = h("div", { class: "cc-spell-groups" }, ...groups);
    const controls = filterControls(wrap, "Search spells...");
    return h("div", {}, sectionHeader("Spells"), controls, wrap);
  }
  function conditionsSection(ir) {
    const active = (ir.conditions || []).filter((c) => c.active && c.kind === "buff");
    if (active.length === 0)
      return null;
    const list = h("div", { class: "cc-condition-list" });
    for (const c of active) {
      list.appendChild(h("div", { class: "cc-condition", title: c.description || void 0 }, h("span", { class: "cc-condition-dot cc-on" }), h("span", { class: "cc-condition-name", text: c.name })));
    }
    return h("div", {}, sectionHeader("Active Effects"), list);
  }
  function inventorySection(ir) {
    if (ir.inventory.length === 0)
      return null;
    const list = h("div", { class: "cc-item-list" });
    for (const item of ir.inventory) {
      list.appendChild(h("div", {
        class: "cc-item" + (item.equipped ? " cc-equipped" : ""),
        dataset: { name: item.name.toLowerCase(), equip: item.equipped ? "equipped" : "" }
      }, item.equipped ? h("span", { class: "cc-equipped-dot", title: "Equipped" }) : null, h("span", { class: "cc-item-name", text: item.name }), item.quantity !== 1 ? h("span", { class: "cc-item-qty", text: `x${item.quantity}` }) : null));
    }
    const controls = filterControls(list, "Search inventory...", [
      { key: "equip", chips: [{ label: "Equipped", val: "equipped" }] }
    ]);
    return h("div", {}, sectionHeader("Inventory"), controls, list);
  }
  function renderCharacterSheet(ir, opts = {}) {
    const classLine = (ir.classes || []).map((c) => c.level ? `${c.name} ${c.level}` : c.name).join(" / ");
    const header = h("div", { class: "cc-header" }, ir.portrait ? h("img", { class: "cc-portrait", src: ir.portrait, alt: ir.name }) : null, h("div", { class: "cc-title" }, h("div", { class: "cc-name", text: ir.name || "Unnamed" }), classLine ? h("div", { class: "cc-classes", text: classLine }) : null, h("span", { class: "cc-system", text: ir.systemHint })));
    return h("div", { class: "cc-sheet", dataset: { system: ir.systemHint } }, header, combatStats(ir), attributesSection(ir), conditionsSection(ir), abilityGrid(ir, opts), skillsSection(ir, opts), resourcesSection(ir), actionsSection(ir, opts), spellsSection(ir, opts), inventorySection(ir));
  }

  // ../core/dist/render/mount.js
  async function fetchCharacterIR(charId, target, auth = {}) {
    if (auth.shareToken) {
      const res2 = await fetch(`${target.url}/rest/v1/rpc/get_character_ir`, {
        method: "POST",
        headers: {
          apikey: target.anonKey,
          Authorization: `Bearer ${target.anonKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ p_dicecloud_character_id: charId, p_share_token: auth.shareToken })
      });
      if (!res2.ok)
        return null;
      return await res2.json().catch(() => null) ?? null;
    }
    const bearer = auth.accessToken || target.anonKey;
    const res = await fetch(`${target.url}/rest/v1/clouds_character_ir?dicecloud_character_id=eq.${encodeURIComponent(charId)}&select=ir`, { headers: { apikey: target.anonKey, Authorization: `Bearer ${bearer}` } });
    if (!res.ok)
      return null;
    const rows = await res.json().catch(() => []);
    return rows?.[0]?.ir ?? null;
  }
  async function mountCharacterIR(container, charId, target, opts = {}, auth = {}) {
    try {
      const ir = await fetchCharacterIR(charId, target, auth);
      if (!ir) {
        container.replaceChildren(h("div", {
          class: "cc-empty",
          style: "padding: 10px; font-size: 12px; opacity: 0.7;",
          text: "No IR stored yet - re-sync this character from DiceCloud."
        }));
        return null;
      }
      container.replaceChildren(renderCharacterSheet(ir, opts));
      return ir;
    } catch (e) {
      container.replaceChildren(h("div", {
        class: "cc-empty",
        style: "padding: 10px; font-size: 12px; opacity: 0.7;",
        text: "Failed to load IR view."
      }));
      return null;
    }
  }
  function mountIRToggle(host, getCharId, target, opts = {}, getAuth, label = "\u2697\uFE0F IR view (beta)") {
    const btn = h("button", { class: "cc-ir-toggle", text: label });
    const panel = h("div", { class: "cc-ir-panel", style: "display:none; margin-top:8px;" });
    let loaded = false;
    btn.addEventListener("click", async () => {
      const open = panel.style.display === "none";
      panel.style.display = open ? "block" : "none";
      if (open && !loaded) {
        const id = getCharId();
        if (!id) {
          panel.replaceChildren(h("div", { class: "cc-empty", text: "No character loaded yet." }));
          return;
        }
        let auth = {};
        try {
          if (getAuth)
            auth = await getAuth() || {};
        } catch {
          auth = {};
        }
        loaded = true;
        await mountCharacterIR(panel, id, target, opts, auth);
      }
    });
    host.append(btn, panel);
    return { panel, reload: () => {
      loaded = false;
    } };
  }

  // src/owlbear-cc-core-entry.js
  window.CarmaCloudsCore = {
    normalize,
    deriveDnd,
    renderCharacterSheet,
    h,
    setChildren,
    mountCharacterIR,
    fetchCharacterIR,
    mountIRToggle
  };
})();
