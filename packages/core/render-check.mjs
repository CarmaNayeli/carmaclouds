// Render smoke test: build the sheet DOM from each fixture's IR and assert the
// structure (using linkedom as the DOM). Run (from packages/core):
//   npx esbuild render-check.mjs --bundle --platform=node --format=esm --external:linkedom --outfile=.r.mjs && node .r.mjs
import fs from 'node:fs';
import { parseHTML } from 'linkedom';

// Provide a DOM before importing the render layer's runtime usage.
const dom = parseHTML('<!DOCTYPE html><html><body></body></html>');
const { document } = dom;
// Expose the browser globals the render layer expects.
for (const name of ['document', 'Node', 'Event', 'HTMLElement', 'Element', 'Text']) {
  if (dom[name]) globalThis[name] = dom[name];
}

const { normalize } = await import('./src/ir/normalize.ts');
const { renderCharacterSheet } = await import('./src/render/character.ts');

const load = (n) => JSON.parse(fs.readFileSync(`./src/ir/__fixtures__/${n}.json`, 'utf8'));
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '  ok  ' : ' FAIL '} ${msg}`); if (!cond) failures++; };

for (const fixture of ['dnd5e-character', 'non-dnd-character']) {
  const ir = normalize(load(fixture));
  let rolls = 0;
  const el = renderCharacterSheet(ir, { onRoll: () => rolls++, onUse: () => {} });
  console.log(`\n=== ${fixture} (${ir.systemHint}) ===`);

  ok(el.classList.contains('cc-sheet'), 'returns a .cc-sheet element');
  ok(!el.outerHTML.includes('<script'), 'no <script> in output (DOM-built, safe)');

  if (fixture === 'dnd5e-character') {
    const boxes = el.querySelectorAll('.ability-grid .ability-box');
    ok(boxes.length === 6, `6 ability boxes (got ${boxes.length})`);
    // Clicking an ability box fires onRoll.
    boxes[0].dispatchEvent(new globalThis.Event('click'));
    ok(rolls === 1, 'clicking an ability box fires onRoll');
    ok(el.querySelector('.cc-resource-list'), 'has a Resources section');
    ok(el.querySelectorAll('.cc-skill-list .cc-skill').length >= 15, `has a Skills list (${el.querySelectorAll('.cc-skill').length} skills)`);
    ok(el.querySelector('.cc-item-list'), 'has an Inventory section');
    const combat = el.querySelector('.cc-combat')?.textContent || '';
    ok(/HP/.test(combat) && /Prof/.test(combat), `combat strip shows HP + Prof (${combat.replace(/\s+/g, ' ').trim().slice(0, 50)})`);
    const dmg = el.querySelectorAll('.cc-action-damage');
    ok(dmg.length >= 1, `actions show damage (${dmg.length}, e.g. "${dmg[0]?.textContent || ''}")`);
  }

  if (fixture === 'non-dnd-character') {
    // The custom stat must appear.
    const attrText = el.querySelector('.cc-attr-list')?.textContent || '';
    ok(/Glory/.test(attrText), `custom stat shown in Attributes (${attrText.replace(/\s+/g, ' ').trim().slice(0, 60)})`);
    // The reset resource must appear with an LR badge.
    const resText = el.querySelector('.cc-resource-list')?.textContent || '';
    ok(/Mythic Power/.test(resText) && /LR/.test(resText), `reset resource shown with LR badge (${resText.replace(/\s+/g, ' ').trim().slice(0, 60)})`);
    // The charge spell must appear with 2 / 2 uses and an LR badge.
    const action = [...el.querySelectorAll('.cc-action')].find((a) => /Surge of Glory/.test(a.textContent));
    ok(!!action, 'charge spell present in Actions');
    ok(action && /2/.test(action.querySelector('.cc-pool-current')?.textContent || '') && /LR/.test(action.textContent),
       `charge spell shows 2/2 + LR (${action?.textContent.replace(/\s+/g, ' ').trim().slice(0, 60)})`);
  }
}

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
