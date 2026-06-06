/**
 * Spell Action Modals
 *
 * action-display.js routes ~95 spells/features to dedicated show*Modal()
 * handlers, almost none of which were implemented. This module provides a
 * single data-driven dispatcher: each spell has a compact definition in
 * SPELL_DEFS and is rendered by a small set of templates (damage, damage-type
 * choice, healing, concentration/buff, utility). Spells without a definition
 * yet fall back to a plain chat announcement, so nothing ever crashes.
 *
 * Loaded as a plain script (exports to globalThis). Must load AFTER
 * feature-modals.js (so createThemedModal etc. exist) and after its fallback
 * loop, which this overwrites with the smarter dispatcher.
 */
(function () {
  'use strict';

  const dbg = () => window.debug || console;

  // ── small helpers ────────────────────────────────────────────────────────
  function abilityScore(ability) {
    const a = (globalThis.characterData && characterData.attributes) || {};
    const v = a[ability];
    return typeof v === 'number' ? v : 10;
  }
  function abilityMod(ability) {
    const mods = (globalThis.characterData && characterData.attributeMods) || {};
    if (typeof mods[ability] === 'number') return mods[ability];
    return Math.floor((abilityScore(ability) - 10) / 2);
  }
  function profBonus() {
    const cd = globalThis.characterData || {};
    return Number(cd.proficiencyBonus) || (Math.floor(((Number(cd.level) || 1) - 1) / 4) + 2);
  }
  function spellcastingAbility() {
    const cls = ((globalThis.characterData && characterData.class) || '').toLowerCase();
    if (/cleric|druid|ranger/.test(cls)) return 'wisdom';
    if (/wizard|artificer/.test(cls)) return 'intelligence';
    if (/bard|paladin|sorcerer|warlock/.test(cls)) return 'charisma';
    return 'wisdom';
  }
  function spellMod() { return abilityMod(spellcastingAbility()); }
  const fmtMod = (m) => (m >= 0 ? `+${m}` : `${m}`);

  // Available regular spell slots (flat keys), level >= minLevel, with max > 0.
  function availableSlots(minLevel) {
    const out = [];
    const slots = (globalThis.characterData && characterData.spellSlots) || {};
    for (let l = Math.max(1, minLevel || 1); l <= 9; l++) {
      const max = Number(slots[`level${l}SpellSlotsMax`]) || 0;
      if (max > 0) out.push({ level: l, current: Number(slots[`level${l}SpellSlots`]) || 0, max });
    }
    return out;
  }
  function spendSlot(level) {
    const slots = characterData.spellSlots || (characterData.spellSlots = {});
    const key = `level${level}SpellSlots`;
    const cur = Number(slots[key]) || 0;
    if (cur > 0) slots[key] = cur - 1;
    const nested = slots[`level${level}`];
    if (nested && typeof nested === 'object') nested.current = slots[key];
  }
  function persist() {
    if (typeof saveCharacterData === 'function') saveCharacterData();
    if (typeof buildSheet === 'function') buildSheet(characterData);
  }
  function announce(name, description) {
    if (typeof announceAction === 'function') announceAction({ name, description });
  }
  function notify(msg, type) {
    if (typeof showNotification === 'function') showNotification(msg, type);
  }
  function doRoll(label, formula) {
    if (typeof roll === 'function' && formula) roll(label, formula);
  }

  // Add `perLevel` dice for each level the slot is above the spell's base level.
  // e.g. base "3d8" + perLevel "1d8" cast at level 5 (base 3) -> "5d8".
  function scaleDice(baseDice, perLevel, baseLevel, castLevel) {
    if (!perLevel || castLevel <= baseLevel) return baseDice;
    const steps = castLevel - baseLevel;
    const b = /^(\d+)d(\d+)(.*)$/.exec(baseDice.replace(/\s+/g, ''));
    const p = /^(\d+)d(\d+)$/.exec(perLevel.replace(/\s+/g, ''));
    if (b && p && b[2] === p[2]) {
      return `${parseInt(b[1], 10) + parseInt(p[1], 10) * steps}d${b[2]}${b[3] || ''}`;
    }
    return `${baseDice} + ${steps}×(${perLevel})`;
  }
  // Replace MOD / SPELLMOD tokens in a dice string with the spellcasting modifier.
  function resolveMod(dice) {
    if (!dice) return dice;
    return dice.replace(/SPELLMOD|MOD/g, () => String(spellMod()));
  }

  // ── modal shell ──────────────────────────────────────────────────────────
  function openModal(icon, title, bodyHTML) {
    const { modal, modalContent } = createThemedModal();
    modalContent.innerHTML =
      `<h2 style="margin:0 0 12px;font-size:1.4em;">${icon} ${title}</h2>${bodyHTML}`;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    const close = () => {
      if (modal.parentNode) document.body.removeChild(modal);
      document.removeEventListener('keydown', onEsc);
    };
    const onEsc = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onEsc);
    return { modal, content: modalContent, close };
  }
  const BTN = 'padding:10px 18px;font-size:0.95em;font-weight:bold;border:none;border-radius:6px;cursor:pointer;';
  const cancelBtn = `<button data-cc-cancel style="${BTN}background:var(--accent-danger);color:#fff;">Cancel</button>`;
  function metaLine(def) {
    const bits = [];
    if (def.level != null) bits.push(def.level === 0 ? 'Cantrip' : `Level ${def.level}`);
    if (def.school) bits.push(def.school);
    if (def.conc) bits.push('Concentration');
    if (def.duration) bits.push(def.duration);
    if (def.ritual) bits.push('Ritual');
    return bits.length ? `<div style="font-size:0.8em;opacity:0.7;margin:-6px 0 12px;">${bits.join(' · ')}</div>` : '';
  }

  // ── templates ──────────────────────────────────────────────────────────────
  function tplDamage(def, name) {
    const slots = def.level > 0 ? availableSlots(def.level) : [];
    const slotSel = ((def.perLevel || def.perLevelRays) && slots.length)
      ? `<label style="display:block;font-size:0.85em;opacity:0.85;margin-bottom:6px;">Cast at level</label>
         <select data-cc-slot style="width:100%;padding:8px;border:2px solid var(--accent-info);border-radius:6px;background:rgba(0,0,0,0.2);color:inherit;margin-bottom:14px;">
           ${slots.map(s => `<option value="${s.level}" ${s.current <= 0 ? 'disabled' : ''}>Level ${s.level} (${s.current}/${s.max})</option>`).join('')}
         </select>` : '';
    const save = def.save ? ` <span style="opacity:0.8;">(${def.save} save${def.half ? ', half on success' : ''})</span>` : '';
    const body = `${metaLine(def)}
      <p style="font-size:0.9em;line-height:1.4;margin:0 0 14px;">${def.effect || ''}</p>
      ${slotSel}
      <div style="font-size:1.1em;margin-bottom:14px;">Damage: <strong data-cc-dmg></strong> ${def.type || ''}${save}</div>
      <div style="display:flex;gap:10px;justify-content:center;">
        <button data-cc-cast style="${BTN}background:var(--accent-warning);color:#fff;">🎲 Roll Damage</button>
        ${cancelBtn}
      </div>`;
    const m = openModal(def.icon || '✨', name, body);
    const slotEl = m.content.querySelector('[data-cc-slot]');
    const dmgEl = m.content.querySelector('[data-cc-dmg]');
    const curLevel = () => slotEl ? parseInt(slotEl.value, 10) : def.level;
    const curDice = () => {
      let d = scaleDice(def.dice || '0', def.perLevel, def.level, curLevel());
      d = resolveMod(d);
      if (def.rays) {
        const extra = slotEl ? Math.max(0, curLevel() - def.level) * (def.perLevelRays || 0) : 0;
        return { dice: d, count: def.rays + extra };
      }
      return { dice: d, count: 1 };
    };
    const refresh = () => {
      const { dice, count } = curDice();
      dmgEl.textContent = count > 1 ? `${count} × ${dice}` : dice;
    };
    refresh();
    if (slotEl) slotEl.addEventListener('change', refresh);
    m.content.querySelector('[data-cc-cast]').addEventListener('click', () => {
      const lvl = curLevel();
      if (def.level > 0 && slotEl) {
        const s = availableSlots(def.level).find(x => x.level === lvl);
        if (!s || s.current <= 0) { notify('❌ No spell slot remaining at that level!', 'error'); return; }
        spendSlot(lvl);
      }
      const { dice, count } = curDice();
      const upcast = lvl > def.level ? ` (upcast L${lvl})` : '';
      announce(name, `${count > 1 ? count + ' × ' : ''}${dice} ${def.type || ''} damage${def.save ? ` — ${def.save} save` : ''}${upcast}`);
      const total = count > 1 ? `${count}×(${dice})` : dice;
      doRoll(`${name} damage`, count > 1 ? Array(count).fill(`(${dice})`).join('+') : dice);
      if (def.conc && typeof setConcentration === 'function') setConcentration(name);
      m.close();
      persist();
    });
    m.content.querySelector('[data-cc-cancel]').addEventListener('click', m.close);
  }

  function tplChoice(def, name) {
    const slots = def.level > 0 ? availableSlots(def.level) : [];
    const slotSel = (def.perLevel && slots.length)
      ? `<label style="display:block;font-size:0.85em;opacity:0.85;margin-bottom:6px;">Cast at level</label>
         <select data-cc-slot style="width:100%;padding:8px;border:2px solid var(--accent-info);border-radius:6px;background:rgba(0,0,0,0.2);color:inherit;margin-bottom:14px;">
           ${slots.map(s => `<option value="${s.level}" ${s.current <= 0 ? 'disabled' : ''}>Level ${s.level} (${s.current}/${s.max})</option>`).join('')}
         </select>` : '';
    const body = `${metaLine(def)}
      <p style="font-size:0.9em;line-height:1.4;margin:0 0 14px;">${def.effect || ''}</p>
      ${slotSel}
      <p style="font-size:0.85em;opacity:0.85;margin:0 0 8px;">${def.prompt || 'Choose:'}</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:14px;">
        ${def.choices.map((c, i) => `<button data-cc-choice="${i}" style="${BTN}background:${c.color || 'var(--accent-info)'};color:#fff;">${c.label}</button>`).join('')}
      </div>
      <div style="text-align:center;">${cancelBtn}</div>`;
    const m = openModal(def.icon || '✨', name, body);
    const slotEl = m.content.querySelector('[data-cc-slot]');
    m.content.querySelectorAll('[data-cc-choice]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const c = def.choices[parseInt(btn.dataset.ccChoice, 10)];
        const lvl = slotEl ? parseInt(slotEl.value, 10) : def.level;
        if (def.level > 0 && slotEl) {
          const s = availableSlots(def.level).find(x => x.level === lvl);
          if (!s || s.current <= 0) { notify('❌ No spell slot remaining at that level!', 'error'); return; }
          spendSlot(lvl);
        }
        if (def.dice) {
          const dice = resolveMod(scaleDice(def.dice, def.perLevel, def.level, lvl));
          announce(name, `${c.label}: ${dice} ${c.type || def.type || ''} damage${lvl > def.level ? ` (upcast L${lvl})` : ''}`);
          doRoll(`${name} (${c.label})`, dice);
        } else {
          announce(name, `${c.label}${c.effect ? ': ' + c.effect : ''}`);
        }
        if (def.conc && typeof setConcentration === 'function') setConcentration(name);
        m.close();
        persist();
      });
    });
    m.content.querySelector('[data-cc-cancel]').addEventListener('click', m.close);
  }

  function tplHealing(def, name) {
    const slots = def.level > 0 ? availableSlots(def.level) : [];
    const slotSel = (def.healPerLevel && slots.length)
      ? `<label style="display:block;font-size:0.85em;opacity:0.85;margin-bottom:6px;">Cast at level</label>
         <select data-cc-slot style="width:100%;padding:8px;border:2px solid var(--accent-info);border-radius:6px;background:rgba(0,0,0,0.2);color:inherit;margin-bottom:14px;">
           ${slots.map(s => `<option value="${s.level}" ${s.current <= 0 ? 'disabled' : ''}>Level ${s.level} (${s.current}/${s.max})</option>`).join('')}
         </select>` : '';
    const body = `${metaLine(def)}
      <p style="font-size:0.9em;line-height:1.4;margin:0 0 14px;">${def.effect || ''}</p>
      ${slotSel}
      <div style="font-size:1.1em;margin-bottom:14px;">Healing: <strong data-cc-heal></strong></div>
      <div style="display:flex;gap:10px;justify-content:center;">
        <button data-cc-cast style="${BTN}background:var(--accent-success);color:#fff;">💚 Roll Healing</button>
        ${cancelBtn}
      </div>`;
    const m = openModal(def.icon || '💚', name, body);
    const slotEl = m.content.querySelector('[data-cc-slot]');
    const healEl = m.content.querySelector('[data-cc-heal]');
    const curLevel = () => slotEl ? parseInt(slotEl.value, 10) : def.level;
    const curHeal = () => resolveMod(scaleDice(def.heal, def.healPerLevel, def.level, curLevel()));
    const refresh = () => { healEl.textContent = curHeal(); };
    refresh();
    if (slotEl) slotEl.addEventListener('change', refresh);
    m.content.querySelector('[data-cc-cast]').addEventListener('click', () => {
      const lvl = curLevel();
      if (def.level > 0 && slotEl) {
        const s = availableSlots(def.level).find(x => x.level === lvl);
        if (!s || s.current <= 0) { notify('❌ No spell slot remaining at that level!', 'error'); return; }
        spendSlot(lvl);
      }
      announce(name, `Restores ${curHeal()} hit points${lvl > def.level ? ` (upcast L${lvl})` : ''}`);
      doRoll(`${name} healing`, curHeal());
      m.close();
      persist();
    });
    m.content.querySelector('[data-cc-cancel]').addEventListener('click', m.close);
  }

  // Buff / utility: a single Cast button that announces (and handles slot +
  // concentration for buffs). Used for everything without dice to roll.
  function tplCast(def, name, accent) {
    const slots = (def.level > 0 && def.useSlot !== false) ? availableSlots(def.level) : [];
    const slotSel = (def.useSlot !== false && def.level > 0 && slots.length)
      ? `<label style="display:block;font-size:0.85em;opacity:0.85;margin-bottom:6px;">Cast at level</label>
         <select data-cc-slot style="width:100%;padding:8px;border:2px solid var(--accent-info);border-radius:6px;background:rgba(0,0,0,0.2);color:inherit;margin-bottom:14px;">
           ${slots.map(s => `<option value="${s.level}" ${s.current <= 0 ? 'disabled' : ''}>Level ${s.level} (${s.current}/${s.max})</option>`).join('')}
         </select>` : '';
    const body = `${metaLine(def)}
      <p style="font-size:0.92em;line-height:1.45;margin:0 0 14px;">${def.effect || ''}</p>
      ${slotSel}
      <div style="display:flex;gap:10px;justify-content:center;">
        <button data-cc-cast style="${BTN}background:${accent || 'var(--accent-info)'};color:#fff;">${def.castLabel || '✨ Cast'}</button>
        ${cancelBtn}
      </div>`;
    const m = openModal(def.icon || '✨', name, body);
    const slotEl = m.content.querySelector('[data-cc-slot]');
    m.content.querySelector('[data-cc-cast]').addEventListener('click', () => {
      const lvl = slotEl ? parseInt(slotEl.value, 10) : def.level;
      if (def.useSlot !== false && def.level > 0 && slotEl) {
        const s = availableSlots(def.level).find(x => x.level === lvl);
        if (!s || s.current <= 0) { notify('❌ No spell slot remaining at that level!', 'error'); return; }
        spendSlot(lvl);
      }
      announce(name, `${def.effect || ''}${lvl > def.level ? ` (upcast L${lvl})` : ''}`);
      if (def.conc && typeof setConcentration === 'function') setConcentration(name);
      notify(`${def.icon || '✨'} ${name}`);
      m.close();
      persist();
    });
    m.content.querySelector('[data-cc-cancel]').addEventListener('click', m.close);
  }

  // ── dispatcher ───────────────────────────────────────────────────────────
  function showSpellActionModal(action) {
    if (typeof globalThis.characterData === 'undefined' || !characterData) return;
    const name = (action && action.name) || '';
    const def = SPELL_DEFS[name] || SPELL_DEFS[Object.keys(SPELL_DEFS).find(k => name.toLowerCase().includes(k.toLowerCase())) || ''];
    if (!def) { announce(name || 'Action', (action && (action.summary || action.description)) || ''); return; }
    try {
      switch (def.kind) {
        case 'damage': return tplDamage(def, def.title || name);
        case 'choice': return tplChoice(def, def.title || name);
        case 'healing': return tplHealing(def, def.title || name);
        case 'buff': return tplCast(def, def.title || name, 'var(--accent-success)');
        default: return tplCast(def, def.title || name, 'var(--accent-info)');
      }
    } catch (e) {
      dbg().warn('Spell modal failed, announcing instead:', e);
      announce(name, def.effect || '');
    }
  }

  // ── spell definitions (grow this list over time) ─────────────────────────
  const SPELL_DEFS = {
    'Absorb Elements': { kind: 'choice', icon: '🛡️', level: 1, school: 'Abjuration', duration: '1 round',
      effect: 'Reaction when you take acid/cold/fire/lightning/thunder damage: resistance to that type until your next turn, and your next melee hit deals +1d6 of it (+1d6 per slot level above 1).',
      perLevel: '1d6', dice: '1d6', prompt: 'Triggering damage type:',
      choices: [{ label: 'Acid', type: 'acid' }, { label: 'Cold', type: 'cold' }, { label: 'Fire', type: 'fire' }, { label: 'Lightning', type: 'lightning' }, { label: 'Thunder', type: 'thunder' }] },
    'Aid': { kind: 'buff', icon: '➕', level: 2, school: 'Abjuration', duration: '8 hours',
      effect: 'Up to three creatures each gain +5 max and current HP (+5 per slot level above 2) for 8 hours.' },
    'Animate Objects': { kind: 'buff', icon: '🪑', level: 5, school: 'Transmutation', conc: true, duration: '1 minute',
      effect: 'Animate up to 10 nonmagical objects to attack at your command (bonus action to direct).' },
    'Armor of Agathys': { kind: 'buff', icon: '🧊', level: 1, school: 'Abjuration', duration: '1 hour',
      effect: 'Gain 5 temp HP and a cold aura (+5 temp HP / +5 cold per slot level above 1). A creature hitting you in melee takes 5 cold while you have the temp HP.' },
    'Astral Projection': { icon: '🌌', level: 9, school: 'Necromancy',
      effect: 'Project the astral bodies of you and up to 8 willing creatures into the Astral Plane.' },
    'Augury': { icon: '🔮', level: 2, school: 'Divination', ritual: true,
      effect: 'Learn whether a course of action over the next 30 minutes will bring weal, woe, both, or nothing.', castLabel: '🔮 Consult' },
    'Bane': { kind: 'buff', icon: '💀', level: 1, school: 'Enchantment', conc: true, duration: '1 minute',
      effect: 'Up to 3 creatures (Cha save) subtract 1d4 from attack rolls and saving throws (+1 target per slot level above 1).' },
    "Bigby's Hand": { kind: 'buff', icon: '✊', level: 5, school: 'Evocation', conc: true, duration: '1 minute', title: "Bigby's Hand",
      effect: 'Create a Large force hand (AC 20, HP = your max). Bonus action: Clenched Fist (4d8 force), Forceful Hand (shove), Grasping Hand (grapple/crush 2d6+Str), or Interposing Hand.' },
    'Bless': { kind: 'buff', icon: '🙏', level: 1, school: 'Enchantment', conc: true, duration: '1 minute',
      effect: 'Up to 3 creatures add 1d4 to attack rolls and saving throws (+1 target per slot level above 1).' },
    'Booming Blade': { kind: 'damage', icon: '⚡', level: 0, school: 'Evocation', useSlot: false,
      effect: 'Melee attack; on hit, target is sheathed in booming energy. If it moves before your next turn it takes thunder damage. Extra/move damage scales at levels 5/11/17.',
      dice: '1d8', type: 'thunder (if it moves)', note: 'cantrip' },
    'Chaos Bolt': { kind: 'damage', icon: '🎲', level: 1, school: 'Evocation',
      effect: 'Ranged spell attack; 2d8 + 1d6 damage. The d6 determines the type (1 acid,2 cold,3 fire,4 force,5 lightning,6 poison,7 psychic,8 thunder). On doubles it can leap to another target. +1d6 per slot level above 1.',
      dice: '2d8+1d6', type: '(roll d8 for type)', perLevel: '1d6' },
    'Chromatic Orb': { kind: 'choice', icon: '🔴', level: 1, school: 'Evocation',
      effect: 'Ranged spell attack, 3d8 of a chosen type (+1d8 per slot level above 1).',
      dice: '3d8', perLevel: '1d8', prompt: 'Damage type:',
      choices: [{ label: 'Acid', type: 'acid' }, { label: 'Cold', type: 'cold' }, { label: 'Fire', type: 'fire' }, { label: 'Lightning', type: 'lightning' }, { label: 'Poison', type: 'poison' }, { label: 'Thunder', type: 'thunder' }] },
    'Clone': { icon: '🧬', level: 8, school: 'Necromancy',
      effect: 'Grow an inert duplicate of a creature as a safeguard against death (120 days to mature).' },
    'Cloud of Daggers': { kind: 'damage', icon: '🗡️', level: 2, school: 'Conjuration', conc: true, duration: '1 minute',
      effect: 'Fill a 5-ft cube with spinning daggers; 4d4 slashing on entry/start of turn (+2d4 per slot level above 2).',
      dice: '4d4', type: 'slashing', perLevel: '2d4' },
    'Commune': { icon: '🕊️', level: 5, school: 'Divination', ritual: true,
      effect: 'Ask your deity up to three yes/no questions.', castLabel: '🕊️ Commune' },
    'Contact Other Plane': { icon: '👁️', level: 5, school: 'Divination', ritual: true,
      effect: 'Contact an extraplanar intellect (Int DC 15 save or take 6d6 psychic and be insane for a time); ask up to five one-word-answer questions.' },
    'Contingency': { icon: '⏳', level: 6, school: 'Evocation',
      effect: 'Store a spell (≤5th, casting time ≤1 action) to trigger on a circumstance you describe.' },
    'Counterspell': { kind: 'buff', icon: '🚫', level: 3, school: 'Abjuration', conc: false, useSlot: true,
      effect: 'Reaction to interrupt a creature casting a spell. Automatically stops a spell of ≤3rd level; otherwise make an ability check (DC 10 + spell level), or upcast to that level to auto-succeed.' },
    'Delayed Blast Fireball': { kind: 'damage', icon: '💥', level: 7, school: 'Evocation', conc: true,
      effect: 'A bead that grows 1d6 each of your turns (max 12d6), then detonates for 12d6 fire (Dex save half). Base 12d6 +1d6 per slot level above 7.',
      dice: '12d6', type: 'fire', perLevel: '1d6', save: 'DEX', half: true },
    'Detect Magic': { icon: '✨', level: 1, school: 'Divination', conc: true, ritual: true, duration: '10 minutes',
      effect: 'Sense the presence of magic within 30 ft; an action to study an aura reveals its school.' },
    'Dispel Evil and Good': { kind: 'buff', icon: '☯️', level: 5, school: 'Abjuration', conc: true, duration: '1 minute',
      effect: 'Celestials/elementals/fey/fiends/undead have disadvantage to hit you; you can use an action to Break Enchantment, Dismissal, or end a possession/charm.' },
    'Dispel Magic': { kind: 'buff', icon: '🌀', level: 3, school: 'Abjuration', useSlot: true,
      effect: 'End one spell on a target. Spells of ≤ the slot level used end automatically; for higher, make an ability check (DC 10 + that spell’s level).' },
    'Divination': { icon: '🔮', level: 4, school: 'Divination', ritual: true,
      effect: 'A short truthful reply about a goal/event within 7 days (a word, phrase, or omen).' },
    "Dragon's Breath": { kind: 'choice', icon: '🐲', level: 2, school: 'Transmutation', conc: true, duration: '1 minute', title: "Dragon's Breath",
      effect: 'A willing creature can use an action to exhale a 15-ft cone: 3d6 of a chosen type (Dex save half), +1d6 per slot level above 2.',
      dice: '3d6', perLevel: '1d6', save: 'DEX', prompt: 'Breath type:',
      choices: [{ label: 'Acid', type: 'acid' }, { label: 'Cold', type: 'cold' }, { label: 'Fire', type: 'fire' }, { label: 'Lightning', type: 'lightning' }, { label: 'Poison', type: 'poison' }] },
    'Dream': { icon: '💤', level: 5, school: 'Illusion',
      effect: 'Shape the dreams of a creature you know; a messenger can deliver a message or haunt to deny rest (3d6 psychic).' },
    'Elemental Weapon': { kind: 'choice', icon: '🗡️', level: 3, school: 'Transmutation', conc: true, duration: '1 hour',
      effect: 'A nonmagical weapon gains +1 (scales) and +1d4 of a chosen type. +2/+2d4 at 5th–6th, +3/+3d4 at 7th+.',
      dice: '1d4', type: '', prompt: 'Damage type:',
      choices: [{ label: 'Acid', type: 'acid' }, { label: 'Cold', type: 'cold' }, { label: 'Fire', type: 'fire' }, { label: 'Lightning', type: 'lightning' }, { label: 'Thunder', type: 'thunder' }] },
    'Etherealness': { icon: '👻', level: 7, school: 'Transmutation', duration: 'Up to 8 hours',
      effect: 'Step into the Ethereal Plane (Border Ethereal). +2 creatures per slot level above 7.' },
    'Feather Fall': { kind: 'buff', icon: '🪶', level: 1, school: 'Transmutation', useSlot: true,
      effect: 'Reaction: up to 5 falling creatures descend 60 ft/round and take no falling damage for 1 minute.' },
    'Find the Path': { icon: '🧭', level: 6, school: 'Divination', conc: true, duration: 'Up to 1 day',
      effect: 'Know the shortest, most direct route to a location familiar to you.' },
    'Fire Shield': { kind: 'choice', icon: '🔥', level: 4, school: 'Evocation', duration: '10 minutes',
      effect: 'A warm shield (resist cold) or chill shield (resist fire). A creature hitting you in melee takes 2d8 of the opposite type.',
      dice: '2d8', prompt: 'Shield:',
      choices: [{ label: 'Warm (resist cold, deals fire)', type: 'fire' }, { label: 'Chill (resist fire, deals cold)', type: 'cold' }] },
    'Flaming Sphere': { kind: 'damage', icon: '🔥', level: 2, school: 'Conjuration', conc: true, duration: '1 minute',
      effect: 'A 5-ft fiery sphere you move (bonus action). 2d6 fire (Dex save half) to creatures it ends adjacent to or rams. +1d6 per slot level above 2.',
      dice: '2d6', type: 'fire', perLevel: '1d6', save: 'DEX', half: true },
    'Forcecage': { icon: '🔲', level: 7, school: 'Evocation', duration: '1 hour',
      effect: 'A 20-ft cube cage or 10-ft box of force; escape only by teleport (Cha save) or planar travel.' },
    'Freedom of Movement': { kind: 'buff', icon: '🏃', level: 4, school: 'Abjuration', duration: '1 hour',
      effect: 'A creature is unaffected by difficult terrain, and most paralysis/restraint; can spend 5 ft to escape nonmagical restraints/grapples.' },
    'Gate': { icon: '🌀', level: 9, school: 'Conjuration', conc: true,
      effect: 'Open a portal to another plane and optionally pull a named creature through.' },
    'Geas': { kind: 'buff', icon: '⛓️', level: 5, school: 'Enchantment', duration: '30 days',
      effect: 'Command a creature (Wis save). While charmed it must obey; disobeying deals 5d10 psychic (once/day). Longer duration at higher slots.' },
    'Glyph of Warding': { icon: '🔣', level: 3, school: 'Abjuration',
      effect: 'Inscribe a glyph that triggers an explosive rune (5d8, +1d8 per slot above 3) or a stored spell.' },
    'Greater Restoration': { kind: 'buff', icon: '✨', level: 5, school: 'Abjuration',
      effect: 'End one: a charm/petrification, a curse, reduced ability score, or reduced max HP.' },
    'Green-Flame Blade': { kind: 'damage', icon: '🟢', level: 0, school: 'Evocation', useSlot: false,
      effect: 'Melee attack; on hit, green fire leaps to a second creature within 5 ft for fire = your spellcasting mod (scales at 5/11/17, which also adds fire to the primary target).',
      dice: 'MOD', type: 'fire (to a second target)' },
    'Guidance': { kind: 'buff', icon: '🌟', level: 0, school: 'Divination', conc: true, useSlot: false, duration: '1 minute',
      effect: 'Touch a willing creature; once before the spell ends it can add 1d10 to one ability check.' },
    'Haste': { kind: 'buff', icon: '⚡', level: 3, school: 'Transmutation', conc: true, duration: '1 minute',
      effect: 'A willing creature gains +2 AC, advantage on Dex saves, double speed, and one extra action (Attack/Dash/Disengage/Hide/Use). Ends with 1 lost turn of lethargy.' },
    'Healing Spirit': { kind: 'healing', icon: '🧚', level: 2, school: 'Conjuration', conc: true, duration: '1 minute',
      effect: 'A spirit in a 5-ft cube heals 1d6 to a creature that enters/starts its turn there (+1d6 per slot level above 2). Limited uses = 1 + spellcasting mod.',
      heal: '1d6', healPerLevel: '1d6' },
    'Hellish Rebuke': { kind: 'damage', icon: '🔥', level: 1, school: 'Evocation',
      effect: 'Reaction when damaged by a creature you can see: 2d10 fire (Dex save half), +1d10 per slot level above 1.',
      dice: '2d10', type: 'fire', perLevel: '1d10', save: 'DEX', half: true },
    'Hex': { kind: 'choice', icon: '🟣', level: 1, school: 'Enchantment', conc: true, duration: '1 hour',
      effect: 'Curse a creature: your attacks deal +1d6 necrotic to it, and it has disadvantage on checks with a chosen ability. Moves on a kill (bonus action).',
      dice: '1d6', type: 'necrotic', prompt: 'Ability with disadvantage:',
      choices: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(a => ({ label: a, effect: `disadvantage on ${a} checks`, type: 'necrotic' })) },
    "Hunter's Mark": { kind: 'buff', icon: '🎯', level: 1, school: 'Divination', conc: true, duration: '1 hour', title: "Hunter's Mark",
      effect: 'Mark a creature: +1d6 damage from your weapon attacks against it, and advantage on Perception/Survival to find it. Moves on a kill (bonus action). Longer duration at 3rd/5th.' },
    'Identify': { icon: '🔎', level: 1, school: 'Divination', ritual: true,
      effect: 'Learn a magic item’s properties and attunement, or what spells affect a creature/object.' },
    'Imprisonment': { icon: '⛓️', level: 9, school: 'Abjuration',
      effect: 'Bind a creature (Wis save): Chain, Minimus Containment, Burial, Hedged Prison, or Slumber.' },
    'Legend Lore': { icon: '📜', level: 5, school: 'Divination',
      effect: 'Learn significant lore about a famous person, place, or object you name.' },
    'Life Transference': { kind: 'damage', icon: '❤️', level: 3, school: 'Necromancy',
      effect: 'Sacrifice 4d8 of your own HP to heal another creature twice that much (+1d8 per slot level above 3).',
      dice: '4d8', type: 'necrotic (to self)', perLevel: '1d8' },
    'Magic Circle': { icon: '⭕', level: 3, school: 'Abjuration', duration: '1 hour',
      effect: 'A 10-ft cylinder that keeps a chosen creature type out (or trapped in). Hampers entry, blocks charm/fright/possession.' },
    'Magic Jar': { icon: '🏺', level: 6, school: 'Necromancy',
      effect: 'Move your soul to a prepared vessel, then attempt to possess nearby creatures (Cha save).' },
    'Magic Missile': { kind: 'damage', icon: '🔹', level: 1, school: 'Evocation',
      effect: 'Three darts each automatically hit for 1d4+1 force (split as you like). +1 dart per slot level above 1.',
      dice: '1d4+1', type: 'force', rays: 3, perLevelRays: 1 },
    'Maze': { icon: '🌀', level: 8, school: 'Conjuration', conc: true, duration: '10 minutes',
      effect: 'Banish a creature to a labyrinthine demiplane (Int check DC to escape).' },
    'Meld into Stone': { icon: '🪨', level: 3, school: 'Transmutation', ritual: true, duration: '8 hours',
      effect: 'Step into a stone object/surface large enough to fit you.' },
    'Mirage Arcane': { icon: '🏜️', level: 7, school: 'Illusion', duration: '10 days',
      effect: 'Make terrain (up to 1 sq mile) look, sound, smell, and feel like a different sort of terrain.' },
    'Moonbeam': { kind: 'damage', icon: '🌙', level: 2, school: 'Evocation', conc: true, duration: '1 minute',
      effect: 'A 5-ft beam (move with an action). 2d10 radiant (Con save half) on entry/start of turn; shapechangers have disadvantage. +1d10 per slot level above 2.',
      dice: '2d10', type: 'radiant', perLevel: '1d10', save: 'CON', half: true },
    'Nondetection': { kind: 'buff', icon: '🚫', level: 3, school: 'Abjuration', duration: '8 hours',
      effect: 'Hide a target from divination magic and scrying for 8 hours.' },
    'Polymorph': { kind: 'buff', icon: '🐸', level: 4, school: 'Transmutation', conc: true, duration: '1 hour',
      effect: 'Transform a creature into a beast (CR ≤ its level, Wis save to resist). It gains the beast’s stats and temp HP; reverts at 0 HP.' },
    'Programmed Illusion': { icon: '🎭', level: 6, school: 'Illusion',
      effect: 'Create an illusion (≤30-ft cube) that activates on a trigger you specify.' },
    'Protection from Energy': { kind: 'choice', icon: '🛡️', level: 3, school: 'Abjuration', conc: true, duration: '1 hour',
      effect: 'A willing creature gains resistance to one damage type.', prompt: 'Resist:',
      choices: [{ label: 'Acid', effect: 'resistance to acid' }, { label: 'Cold', effect: 'resistance to cold' }, { label: 'Fire', effect: 'resistance to fire' }, { label: 'Lightning', effect: 'resistance to lightning' }, { label: 'Thunder', effect: 'resistance to thunder' }] },
    'Protection from Evil and Good': { kind: 'buff', icon: '✝️', level: 1, school: 'Abjuration', conc: true, duration: '10 minutes',
      effect: 'A willing creature is protected from aberrations/celestials/elementals/fey/fiends/undead: they have disadvantage to hit it, and it can’t be charmed, frightened, or possessed by them.' },
    'Raise Dead': { kind: 'buff', icon: '⚰️', level: 5, school: 'Necromancy',
      effect: 'Return a creature dead ≤10 days to life with 1 HP (−4 penalty to all d20 rolls, recovering over days).' },
    'Remove Curse': { kind: 'buff', icon: '🧿', level: 3, school: 'Abjuration',
      effect: 'End all curses on a creature, or break attunement to a cursed item.' },
    'Resistance': { kind: 'buff', icon: '🛡️', level: 0, school: 'Abjuration', conc: true, useSlot: false, duration: '1 minute',
      effect: 'Touch a willing creature; once before the spell ends it can add 1d4 to one saving throw.' },
    'Resurrection': { kind: 'buff', icon: '⚰️', level: 7, school: 'Necromancy',
      effect: 'Return a creature dead ≤100 years (not of old age) to life with full HP.' },
    'Revivify': { kind: 'buff', icon: '💖', level: 3, school: 'Necromancy',
      effect: 'Return a creature that died within the last minute to life with 1 HP (needs diamonds worth 300 gp).' },
    'Sanctuary': { kind: 'buff', icon: '🛡️', level: 1, school: 'Abjuration', useSlot: true, duration: '1 minute',
      effect: 'Ward a creature: anyone targeting it with an attack/harmful spell must make a Wis save or choose a new target.' },
    'Scorching Ray': { kind: 'damage', icon: '☄️', level: 2, school: 'Evocation',
      effect: 'Three rays, each a ranged spell attack for 2d6 fire. +1 ray per slot level above 2.',
      dice: '2d6', type: 'fire', rays: 3, perLevelRays: 1 },
    'Scrying': { icon: '🔮', level: 5, school: 'Divination', conc: true, duration: '10 minutes',
      effect: 'Spy on a creature (Wis save) via an invisible sensor; penalty depends on your knowledge/connection.' },
    'Sending': { icon: '📨', level: 3, school: 'Evocation',
      effect: 'Send a 25-word message to a creature you’re familiar with, who can reply in kind.' },
    'Sequester': { icon: '📦', level: 7, school: 'Transmutation',
      effect: 'Hide a creature/object from divination and render it invisible and in suspended animation until a trigger.' },
    'Shield': { kind: 'buff', icon: '🛡️', level: 1, school: 'Abjuration', useSlot: true, duration: '1 round',
      effect: 'Reaction: +5 AC until your next turn (including against the triggering attack) and no damage from Magic Missile.' },
    'Silence': { kind: 'buff', icon: '🔇', level: 2, school: 'Illusion', conc: true, ritual: true, duration: '10 minutes',
      effect: 'A 20-ft radius sphere where no sound can be created or pass; blocks verbal-component casting and deafens.' },
    'Simulacrum': { icon: '👥', level: 7, school: 'Illusion',
      effect: 'Create an obedient illusory duplicate of a beast/humanoid (half its HP, can’t recover slots).' },
    'Speak with Animals': { icon: '🐾', level: 1, school: 'Divination', ritual: true, duration: '10 minutes',
      effect: 'Comprehend and verbally communicate with beasts.' },
    'Speak with Dead': { icon: '💀', level: 3, school: 'Necromancy', duration: '10 minutes',
      effect: 'Ask a corpse (with a mouth, dead ≤10 days) up to five questions.' },
    'Speak with Plants': { icon: '🌿', level: 3, school: 'Transmutation', duration: '10 minutes',
      effect: 'Question and lightly command plants within 30 ft.' },
    'Spike Growth': { kind: 'buff', icon: '🌵', level: 2, school: 'Transmutation', conc: true, duration: '10 minutes',
      effect: 'A 20-ft radius becomes difficult terrain dealing 2d4 piercing per 5 ft moved through it; camouflaged (Perception/Survival to spot).' },
    'Spirit Guardians': { kind: 'damage', icon: '👼', level: 3, school: 'Conjuration', conc: true, duration: '10 minutes',
      effect: 'Spirits fill a 15-ft radius around you (half speed for enemies). 3d8 radiant or necrotic (Wis save half) on entry/start of turn. +1d8 per slot level above 3.',
      dice: '3d8', type: 'radiant/necrotic', perLevel: '1d8', save: 'WIS', half: true },
    'Spiritual Weapon': { kind: 'damage', icon: '🗡️', level: 2, school: 'Evocation', duration: '1 minute',
      effect: 'A floating spectral weapon (bonus action to move + attack): melee spell attack for 1d8 + spellcasting mod force. +1d8 per two slot levels above 2.',
      dice: '1d8+MOD', type: 'force', perLevel: '1d8' },
    'Symbol': { icon: '🔣', level: 7, school: 'Abjuration',
      effect: 'Inscribe a harmful glyph (Death, Discord, Fear, Hopelessness, Insanity, Pain, Sleep, or Stunning) triggered by conditions you set.' },
    'Teleport': { icon: '✨', level: 7, school: 'Conjuration',
      effect: 'Instantly transport you and up to 8 willing creatures (or one object) to a destination you know; accuracy depends on familiarity.' },
    'Time Stop': { icon: '⏱️', level: 9, school: 'Transmutation',
      effect: 'Take 1d4+1 turns in a row; ends if you affect another creature or move >1,000 ft from where you cast it.' },
    'True Resurrection': { kind: 'buff', icon: '⚰️', level: 9, school: 'Necromancy',
      effect: 'Return a creature dead ≤200 years to life with full HP, curing all conditions; can even recreate a destroyed body.' },
    'Vampiric Touch': { kind: 'damage', icon: '🩸', level: 3, school: 'Necromancy', conc: true, duration: '1 minute',
      effect: 'Melee spell attack: 3d6 necrotic and you regain half that. Recast as an action each turn. +1d6 per slot level above 3.',
      dice: '3d6', type: 'necrotic', perLevel: '1d6' },
    'Wall of Fire': { kind: 'damage', icon: '🔥', level: 4, school: 'Evocation', conc: true, duration: '1 minute',
      effect: 'A wall of fire (one side chosen). 5d8 fire (Dex save half) to creatures within 10 ft of the hot side and on entry/start of turn. +1d8 per slot level above 4.',
      dice: '5d8', type: 'fire', perLevel: '1d8', save: 'DEX', half: true },
    'Wish': { icon: '🌠', level: 9, school: 'Conjuration',
      effect: 'Duplicate any ≤8th-level spell, or alter reality per the listed safe uses (other uses risk never casting it again + 1d4 exhaustion).' },
    'Word of Recall': { icon: '🏠', level: 6, school: 'Conjuration',
      effect: 'Instantly teleport you and up to 5 willing creatures to a sanctuary you designated.' },
    'Zone of Truth': { kind: 'buff', icon: '⚖️', level: 2, school: 'Enchantment', duration: '10 minutes',
      effect: 'A 15-ft radius where creatures (Cha save) can’t speak deliberate lies; you know who saved.' },
  };

  // ── route every dangling spell modal name to the dispatcher ──────────────
  [
    'showAbsorbElementsModal','showAidModal','showAnimateObjectsModal','showArmorOfAgathysModal',
    'showAstralProjectionModal','showAuguryModal','showBaneModal','showBigbysHandModal','showBlessModal',
    'showBoomingBladeModal','showChaosBoltModal','showChromaticOrbModal','showCloneModal','showCloudOfDaggersModal',
    'showCommuneModal','showConjureModal','showContactOtherPlaneModal','showContingencyModal','showCounterspellModal',
    'showDelayedBlastFireballModal','showDetectMagicModal','showDispelEvilAndGoodModal','showDispelMagicModal',
    'showDivinationModal','showDragonsBreathModal','showDreamModal','showElementalWeaponModal','showEtherealnessModal',
    'showFeatherFallModal','showFindThePathModal','showFireShieldModal','showFlamingSphereModal','showForcecageModal',
    'showFreedomOfMovementModal','showGateModal','showGeasModal','showGlyphOfWardingModal','showGreaterRestorationModal',
    'showGreenFlameBladeModal','showGuidanceModal','showHasteModal','showHealingSpiritModal','showHellishRebukeModal',
    'showHexModal','showHuntersMarkModal','showIdentifyModal','showImprisonmentModal','showLegendLoreModal',
    'showLifeTransferenceModal','showMagicCircleModal','showMagicJarModal','showMagicMissileModal','showMazeModal',
    'showMeldIntoStoneModal','showMirageArcaneModal','showMoonbeamModal','showNondetectionModal','showPolymorphModal',
    'showProgrammedIllusionModal','showProtectionFromEnergyModal','showProtectionFromEvilAndGoodModal','showRaiseDeadModal',
    'showRemoveCurseModal','showResistanceModal','showResurrectionModal','showRevivifyModal','showSanctuaryModal',
    'showScorchingRayModal','showScryingModal','showSendingModal','showSequesterModal','showShieldModal','showSilenceModal',
    'showSimulacrumModal','showSpeakWithAnimalsModal','showSpeakWithDeadModal','showSpeakWithPlantsModal','showSpikeGrowthModal',
    'showSpiritGuardiansModal','showSpiritualWeaponModal','showSymbolModal','showTeleportModal','showTimeStopModal',
    'showTrueResurrectionModal','showVampiricTouchModal','showWallOfFireModal','showWishModal','showWordOfRecallModal',
    'showZoneOfTruthModal',
  ].forEach((name) => { globalThis[name] = showSpellActionModal; });

  globalThis.showSpellActionModal = showSpellActionModal;
  globalThis.SPELL_ACTION_DEFS = SPELL_DEFS;

  (window.debug || console).log(`✅ Spell Action Modals loaded (${Object.keys(SPELL_DEFS).length} spell definitions)`);
})();
