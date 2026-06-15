// End-to-end persistence test: normalize the fixtures, upsert into the live
// clouds_character_ir table, read back, and verify. Run (from packages/core):
//   npx esbuild ir-sync-test.mjs --bundle --platform=node --format=esm --outfile=.t.mjs && node .t.mjs
import fs from 'node:fs';
import { normalize, toIRRow } from './src/ir/index.ts';

const SUPABASE_URL = 'https://luiesmfjdcmpywavvfqm.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWVzbWZqZGNtcHl3YXZ2ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODYxNDksImV4cCI6MjA4NTQ2MjE0OX0.oqjHFf2HhCLcanh0HVryoQH7iSV7E9dHHZJdYehxZ0U';
const headers = {
  apikey: ANON,
  Authorization: `Bearer ${ANON}`,
  'Content-Type': 'application/json',
};

const load = (n) => JSON.parse(fs.readFileSync(`./src/ir/__fixtures__/${n}.json`, 'utf8'));

for (const fixture of ['dnd5e-character', 'non-dnd-character']) {
  const ir = normalize(load(fixture));
  const row = toIRRow(ir); // IR only (skip raw to keep the row small)

  // Upsert on the unique dicecloud_character_id.
  const up = await fetch(`${SUPABASE_URL}/rest/v1/clouds_character_ir?on_conflict=dicecloud_character_id`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(row),
  });
  if (!up.ok) {
    console.error(`UPSERT FAILED for ${fixture}: ${up.status} ${await up.text()}`);
    process.exit(1);
  }

  // Read back.
  const sel = `select=character_name,system_hint,ir_version,ir`;
  const back = await fetch(
    `${SUPABASE_URL}/rest/v1/clouds_character_ir?dicecloud_character_id=eq.${ir.id}&${sel}`,
    { headers },
  );
  const [stored] = await back.json();
  const okName = stored?.character_name === ir.name;
  const okSystem = stored?.system_hint === ir.systemHint;
  const okAttrs = Array.isArray(stored?.ir?.attributes) && stored.ir.attributes.length === ir.attributes.length;
  console.log(
    `${okName && okSystem && okAttrs ? ' ok ' : 'FAIL'} ${fixture}: ` +
    `${stored?.character_name} | ${stored?.system_hint} | v${stored?.ir_version} | ` +
    `${stored?.ir?.attributes?.length} attrs, ${stored?.ir?.actions?.length} actions, ${stored?.ir?.skills?.length} skills`,
  );
}
