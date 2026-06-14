/**
 * Author DiceCloud properties over DDP (fixture authoring + write-back groundwork).
 *
 * Logs into dicecloud.com via DDP with the resume token from .env and inserts a
 * batch of properties onto the non-D&D test creature. DiceCloud generates the _id
 * and recomputes (property.dirty = true), so we only supply editable fields plus a
 * required `order`.
 *
 *   creatureProperties.insert({ creatureProperty, parentRef: { id, collection } })
 *
 * Usage:  node scripts/dicecloud-insert.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import DDPClient from '../src/lib/meteor-ddp-client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '..');

function loadEnv(file) {
  const env = {};
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return env;
}
const idOf = (v) => (v?.match(/character\/([^/?#]+)/)?.[1] ?? v?.trim());

const env = loadEnv(path.join(pkgRoot, '.env'));
const token = env.DICECLOUD_LOGIN_TOKEN;
const creatureId = idOf(env.DICECLOUD_NONDND_CREATURE_ID);
if (!token || !creatureId) {
  console.error('Need DICECLOUD_LOGIN_TOKEN and DICECLOUD_NONDND_CREATURE_ID in .env');
  process.exit(1);
}

const rootRef = { id: creatureId, collection: 'creatures' };
const SPELL_LIST_ID = 'DhPfdr5A2m8nc4J7s'; // PF-Test "Spell List"

// Batch of fixture properties: each is { creatureProperty, parentRef }.
// Covers the generic cases the current importer can't represent.
const batch = [
  // A resource pool with a reset period (charges).
  {
    creatureProperty: {
      type: 'attribute', attributeType: 'resource',
      name: 'Mythic Power (test)', variableName: 'mythicPower',
      baseValue: { calculation: '3' }, reset: 'longRest', tags: [], order: 1e6,
    },
    parentRef: rootRef,
  },
  // A charge-based spell: 2 uses, recharge on long rest, consuming the resource above.
  {
    creatureProperty: {
      type: 'spell',
      name: 'Surge of Glory (test)', level: 1, school: 'evocation',
      uses: { calculation: '2' }, reset: 'longRest',
      castingTime: 'action', range: 'Self', duration: 'Instantaneous',
      components: { verbal: true, somatic: false, material: false, concentration: false, ritual: false },
      description: { text: 'Charge-based spell: 2 uses, recharge on long rest. DDP fixture.' },
      tags: [], order: 1e6 + 1,
    },
    parentRef: { id: SPELL_LIST_ID, collection: 'creatureProperties' },
  },
];

const ddp = new DDPClient('wss://dicecloud.com/websocket');

try {
  await ddp.connect();
  const loginResult = await ddp.loginWithToken(token);
  console.log('\n[insert] logged in as userId:', loginResult?.id);

  for (const { creatureProperty, parentRef } of batch) {
    try {
      const newId = await ddp.call('creatureProperties.insert', { creatureProperty, parentRef });
      console.log(`  ✅ ${creatureProperty.type}/${creatureProperty.name} -> ${newId}`);
    } catch (err) {
      console.error(`  ❌ ${creatureProperty.type}/${creatureProperty.name}: ${err?.message || err}`);
    }
  }

  console.log('\nDone. Re-run fetch-dicecloud-fixtures.mjs to capture computed results.');
  process.exit(0);
} catch (err) {
  console.error('\n❌ DDP error:', err?.message || err);
  process.exit(1);
}
