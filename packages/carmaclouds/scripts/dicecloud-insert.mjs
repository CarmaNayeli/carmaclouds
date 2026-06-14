/**
 * Proof-of-concept: author a DiceCloud property over DDP (write-back groundwork).
 *
 * Logs into dicecloud.com via DDP with the resume token from .env and inserts a
 * single property onto the non-D&D test creature. DiceCloud generates the _id and
 * recomputes (property.dirty = true), so we only supply editable fields.
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

// The property to author. A custom "stat" attribute with no D&D analog — the case
// the current importer can't represent.
const creatureProperty = {
  type: 'attribute',
  attributeType: 'stat',
  name: 'Glory (test)',
  variableName: 'gloryTest',
  baseValue: { calculation: '3' },
  description: { text: 'Inserted via DDP write-back proof-of-concept.' },
  tags: [],
  order: 1e6, // required by schema; server's rebuildNestedSets recomputes tree position
};

const ddp = new DDPClient('wss://dicecloud.com/websocket');

try {
  await ddp.connect();
  const loginResult = await ddp.loginWithToken(token);
  console.log('\n[insert] logged in as userId:', loginResult?.id);

  const newId = await ddp.call('creatureProperties.insert', {
    creatureProperty,
    parentRef: { id: creatureId, collection: 'creatures' },
  });

  console.log(`\n✅ Inserted property _id: ${newId}`);
  console.log('   Re-run fetch-dicecloud-fixtures.mjs to see how DiceCloud computed it.');
  process.exit(0);
} catch (err) {
  console.error('\n❌ Insert failed:', err?.message || err);
  process.exit(1);
}
