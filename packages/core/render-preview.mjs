// Render both fixtures with the real CSS into a static HTML file you can open in
// a browser, to eyeball the rebuild's render before wiring the live popover.
// Run (from packages/core):
//   npx esbuild render-preview.mjs --bundle --platform=node --format=esm --external:linkedom --outfile=.p.mjs && node .p.mjs
import fs from 'node:fs';
import { parseHTML } from 'linkedom';

const dom = parseHTML('<!DOCTYPE html><html><body></body></html>');
const { document } = dom;
for (const n of ['document', 'Node', 'Event', 'HTMLElement', 'Element', 'Text']) if (dom[n]) globalThis[n] = dom[n];

const { normalize } = await import('./src/ir/normalize.ts');
const { renderCharacterSheet } = await import('./src/render/character.ts');

const css = fs.readFileSync('../carmaclouds/owlbear-extension/cc-sheet.css', 'utf8');
const load = (n) => JSON.parse(fs.readFileSync(`./src/ir/__fixtures__/${n}.json`, 'utf8'));

const panels = ['dnd5e-character', 'non-dnd-character'].map((f) => {
  const el = renderCharacterSheet(normalize(load(f)), {});
  return `<div class="panel"><h2>${f}</h2>${el.outerHTML}</div>`;
}).join('\n');

const html = `<!DOCTYPE html><html><head><meta charset="utf8"><style>
:root{--theme-primary:#8B5CF6;--theme-primary-light:#A78BFA;--theme-primary-lighter:#C4B5FD;
--theme-text-primary:#e0e0e0;--theme-text-muted:#9ca3af;--theme-border:rgba(139,92,246,0.3);
--theme-bg-card:rgba(139,92,246,0.08);--theme-bg-hover:rgba(139,92,246,0.18);--theme-bg-accent:rgba(139,92,246,0.18);}
body{margin:0;padding:20px;background:#13131f;font-family:-apple-system,Segoe UI,Roboto,sans-serif;}
.wrap{display:flex;gap:24px;align-items:flex-start;}
.panel{width:360px;background:rgba(26,26,46,0.8);border-radius:12px;padding:16px;}
.panel h2{color:#A78BFA;font-size:13px;margin:0 0 12px;}
${css}
</style></head><body><div class="wrap">${panels}</div></body></html>`;

const out = 'C:/tmp/ir-preview.html';
fs.writeFileSync(out, html);
console.log('Wrote preview to', out);
