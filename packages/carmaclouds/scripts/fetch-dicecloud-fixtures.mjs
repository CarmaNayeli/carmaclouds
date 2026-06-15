/**
 * Pull raw DiceCloud character JSON into IR fixtures.
 *
 * Reads creds/IDs from packages/carmaclouds/.env (gitignored), calls the same
 * endpoint the extension uses (GET /api/creature/<id> with a Bearer login token),
 * and writes the raw response to packages/core/src/ir/__fixtures__/<name>.json.
 *
 * Usage:  node scripts/fetch-dicecloud-fixtures.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '..');
const fixturesDir = path.resolve(pkgRoot, '../core/src/ir/__fixtures__');

// --- minimal .env loader (no dependency) ---
function loadEnv(file) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnv(path.join(pkgRoot, '.env'));
const token = env.DICECLOUD_LOGIN_TOKEN;
if (!token) {
  console.error('Missing DICECLOUD_LOGIN_TOKEN in packages/carmaclouds/.env');
  console.error('Get it from dicecloud.com DevTools console: localStorage.getItem("Meteor.loginToken")');
  process.exit(1);
}

// Accept either a bare id or a full URL like https://dicecloud.com/character/<id>/Name
const idOf = (v) => {
  if (!v) return v;
  const m = v.match(/character\/([^/?#]+)/);
  return m ? m[1] : v.trim();
};

const targets = [
  { id: idOf(env.DICECLOUD_DND_CREATURE_ID), name: 'dnd5e-character' },
  { id: idOf(env.DICECLOUD_NONDND_CREATURE_ID), name: 'non-dnd-character' },
].filter(t => t.id);

if (targets.length === 0) {
  console.error('Set DICECLOUD_DND_CREATURE_ID and/or DICECLOUD_NONDND_CREATURE_ID in .env');
  process.exit(1);
}

fs.mkdirSync(fixturesDir, { recursive: true });

for (const { id, name } of targets) {
  const url = `https://dicecloud.com/api/creature/${id}`;
  process.stdout.write(`Fetching ${name} (${id}) ... `);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    console.error(`FAILED ${res.status} ${res.statusText}`);
    console.error(await res.text());
    process.exitCode = 1;
    continue;
  }
  const data = await res.json();
  const out = path.join(fixturesDir, `${name}.json`);
  fs.writeFileSync(out, JSON.stringify(data, null, 2));
  const props = data?.creatureProperties?.length ?? data?.properties?.length ?? '?';
  console.log(`OK -> ${path.relative(pkgRoot, out)} (${props} properties)`);
}
