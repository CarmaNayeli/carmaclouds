// Smoke test: run normalize() against the real fixtures and assert the generic cases.
// Run (from packages/core):
//   npx esbuild ir-check.mjs --bundle --platform=node --format=esm --outfile=.ir-check.bundle.mjs && node .ir-check.bundle.mjs
import fs from 'node:fs';
import { normalize } from './src/ir/normalize.ts';
import { deriveDnd } from './src/ir/views/dnd5e.ts';

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

  console.log(`  skills: ${ir.skills.length}`);

  if (fixture === 'dnd5e-character') {
    ok(ir.systemHint === 'dnd5e', 'detected as dnd5e');
    ok(ir.byVar.strength && typeof ir.byVar.strength.modifier === 'number', 'strength has a modifier');
    ok(ir.attributes.some(a => a.type === 'hitDice' && a.hitDiceSize), 'has a hitDice attribute with a size');

    // Derived D&D view
    const dnd = deriveDnd(ir);
    ok(Object.keys(dnd.abilities).length === 6, `derived 6 abilities (got ${Object.keys(dnd.abilities).length})`);
    ok(typeof dnd.abilities.strength?.score === 'number' && typeof dnd.abilities.strength?.modifier === 'number',
       `derived strength = ${JSON.stringify(dnd.abilities.strength)}`);
    ok(Object.keys(dnd.saves).length >= 6, `derived saves (${Object.keys(dnd.saves).length})`);
    ok(Object.keys(dnd.skills).length >= 15, `derived skills (${Object.keys(dnd.skills).length})`);
    ok(dnd.hitDice.length >= 1 && dnd.hitDice[0].size, `derived hit dice ${JSON.stringify(dnd.hitDice)}`);
    ok(dnd.hitPoints.max > 0, `derived HP ${JSON.stringify(dnd.hitPoints)}`);
    ok(dnd.proficiencyBonus > 0, `derived proficiencyBonus = ${dnd.proficiencyBonus}`);
    console.log(`     spellSlots: ${JSON.stringify(dnd.spellSlots)}`);
  }

  if (fixture === 'non-dnd-character') {
    ok(ir.systemHint === 'generic', `non-D&D detected as generic (got ${ir.systemHint})`);
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
