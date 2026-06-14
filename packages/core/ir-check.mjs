// Smoke test: run normalize() against the real fixtures and assert the generic cases.
// Run (from packages/core):
//   npx esbuild ir-check.mjs --bundle --platform=node --format=esm --outfile=.ir-check.bundle.mjs && node .ir-check.bundle.mjs
import fs from 'node:fs';
import { normalize } from './src/ir/normalize.ts';

const load = (name) =>
  JSON.parse(fs.readFileSync(`./src/ir/__fixtures__/${name}.json`, 'utf8'));

let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '  ok  ' : ' FAIL '} ${msg}`); if (!cond) failures++; };

for (const fixture of ['dnd5e-character', 'non-dnd-character']) {
  const ir = normalize(load(fixture));
  const types = {};
  for (const a of ir.attributes) types[a.type] = (types[a.type] || 0) + 1;
  console.log(`\n=== ${fixture} ===`);
  console.log(`  name: ${ir.name} | system: ${ir.systemHint}`);
  console.log(`  attributes: ${ir.attributes.length}  ${JSON.stringify(types)}`);
  console.log(`  actions: ${ir.actions.length} (spells: ${ir.actions.filter(a => a.kind === 'spell').length})`);

  if (fixture === 'dnd5e-character') {
    ok(ir.systemHint === 'dnd5e', 'detected as dnd5e');
    ok(ir.byVar.strength && typeof ir.byVar.strength.modifier === 'number', 'strength has a modifier');
    ok(ir.attributes.some(a => a.type === 'hitDice' && a.hitDiceSize), 'has a hitDice attribute with a size');
  }

  if (fixture === 'non-dnd-character') {
    const glory = ir.byVar.gloryTest;
    ok(glory && glory.type === 'stat' && glory.value === 3, 'custom stat gloryTest = 3 surfaced');
    const mythic = ir.byVar.mythicPower;
    ok(mythic && mythic.type === 'resource' && mythic.reset === 'longRest', 'resource mythicPower has reset=longRest');
    const surge = ir.actions.find(a => a.name?.includes('Surge of Glory'));
    ok(surge && surge.kind === 'spell', 'charge spell present as a spell action');
    ok(surge?.uses && surge.uses.max === 2 && surge.uses.reset === 'longRest',
       `charge spell uses = ${JSON.stringify(surge?.uses)} (expect max 2, reset longRest)`);
  }
}

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
