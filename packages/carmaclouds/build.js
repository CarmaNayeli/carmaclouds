/**
 * CarmaClouds Unified Extension Build Script
 * Builds both Chrome (MV3) and Firefox (MV2) versions
 */

import { buildExtension } from '../../build-tools/esbuild-extension.js';
import fs from 'fs';
import path from 'path';

const watch = process.argv.includes('--watch');
const minify = process.argv.includes('--minify');

// Build Firefox version (Manifest V2)
console.log('📦 Building Firefox version (Manifest V2)...');
await buildExtension({
  packageDir: '.',
  outDir: 'dist',
  entryPoints: {
    // Main extension files
    'src/background': './src/background.js',
    'src/popup/popup': './src/popup/popup.js',
    'src/popup/supabase-init': './src/popup/supabase-init.js',
    'src/content/dicecloud': './src/content/dicecloud.js',
    'src/content/roll20': './src/content/roll20.js',
    'src/content/character-sheet-overlay': './src/content/character-sheet-overlay.js',
    'src/content/owlbear': './src/content/owlbear.js',
    // Shared modules (for dynamic imports)
    'src/content/dicecloud-extraction': './src/content/dicecloud-extraction.js',
    // Adapters (lazy loaded, but need to be bundled)
    'src/popup/adapters/rollcloud/adapter': './src/popup/adapters/rollcloud/adapter.js',
    'src/popup/adapters/rollcloud/rollcloud-popup': './src/popup/adapters/rollcloud/rollcloud-popup.js',
    'src/popup/adapters/owlcloud/adapter': './src/popup/adapters/owlcloud/adapter.js',
    'src/popup/adapters/owlcloud/owlcloud-popup': './src/popup/adapters/owlcloud/owlcloud-popup.js',
    'src/popup/adapters/foundcloud/adapter': './src/popup/adapters/foundcloud/adapter.js',
    'src/popup/adapters/foundcloud/foundcloud-popup': './src/popup/adapters/foundcloud/foundcloud-popup.js',
  },
  copyFiles: [
    'manifest_firefox.json',
    'icons',
    'images',
    'src/popup/popup.html',
    'src/popup/popup.css',
    'src/popup-sheet.html',
    'src/popup-sheet.js',
    'src/popup/adapters/rollcloud/popup.html',
    'src/popup/adapters/rollcloud/popup.css',
    'src/popup/adapters/owlcloud/popup.html',
    'src/popup/adapters/owlcloud/popup.css',
    'src/popup/adapters/foundcloud/popup.html',
    'src/popup/adapters/foundcloud/popup.css',
    'owlbear-extension',
    // Copy popup-sheet dependencies from core package
    { from: '../core/src/common', to: 'common' },
    { from: '../core/src/modules', to: 'modules' },
    { from: '../core/src/supabase/client.js', to: 'common/supabase-client.js' },
  ],
  watch,
  minify
});

// Rename Firefox manifest
const firefoxDist = path.join('.', 'dist');
if (fs.existsSync(path.join(firefoxDist, 'manifest_firefox.json'))) {
  fs.renameSync(
    path.join(firefoxDist, 'manifest_firefox.json'),
    path.join(firefoxDist, 'manifest.json')
  );
  console.log('✅ Renamed manifest_firefox.json to manifest.json in dist');
}

// Build Chrome version (Manifest V3)
console.log('📦 Building Chrome version (Manifest V3)...');
await buildExtension({
  packageDir: '.',
  outDir: 'dist-chrome',
  entryPoints: {
    // Main extension files
    'src/background': './src/background.js',
    'src/popup/popup': './src/popup/popup.js',
    'src/popup/supabase-init': './src/popup/supabase-init.js',
    'src/content/dicecloud': './src/content/dicecloud.js',
    'src/content/roll20': './src/content/roll20.js',
    'src/content/character-sheet-overlay': './src/content/character-sheet-overlay.js',
    'src/content/owlbear': './src/content/owlbear.js',
    // Shared modules (for dynamic imports)
    'src/content/dicecloud-extraction': './src/content/dicecloud-extraction.js',
    // Adapters (lazy loaded, but need to be bundled)
    'src/popup/adapters/rollcloud/adapter': './src/popup/adapters/rollcloud/adapter.js',
    'src/popup/adapters/rollcloud/rollcloud-popup': './src/popup/adapters/rollcloud/rollcloud-popup.js',
    'src/popup/adapters/owlcloud/adapter': './src/popup/adapters/owlcloud/adapter.js',
    'src/popup/adapters/owlcloud/owlcloud-popup': './src/popup/adapters/owlcloud/owlcloud-popup.js',
    'src/popup/adapters/foundcloud/adapter': './src/popup/adapters/foundcloud/adapter.js',
    'src/popup/adapters/foundcloud/foundcloud-popup': './src/popup/adapters/foundcloud/foundcloud-popup.js',
  },
  copyFiles: [
    'manifest.json',
    'icons',
    'images',
    'src/popup/popup.html',
    'src/popup/popup.css',
    'src/popup-sheet.html',
    'src/popup-sheet.js',
    'src/popup/adapters/rollcloud/popup.html',
    'src/popup/adapters/rollcloud/popup.css',
    'src/popup/adapters/owlcloud/popup.html',
    'src/popup/adapters/owlcloud/popup.css',
    'src/popup/adapters/foundcloud/popup.html',
    'src/popup/adapters/foundcloud/popup.css',
    'owlbear-extension',
    // Copy popup-sheet dependencies from core package
    { from: '../core/src/common', to: 'common' },
    { from: '../core/src/modules', to: 'modules' },
    { from: '../core/src/supabase/client.js', to: 'common/supabase-client.js' },
  ],
  watch,
  minify
});

console.log('✅ Both builds complete!');
console.log('   - Firefox (MV2): dist/');
console.log('   - Chrome (MV3):  dist-chrome/');
