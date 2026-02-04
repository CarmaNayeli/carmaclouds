/**
 * RollCloud Browser Extension Build Script
 * Bundles extension with @carmaclouds/core
 * Creates both Chrome (MV3) and Firefox (MV2) builds
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
    'src/popup-sheet': './src/popup-sheet.js',
    'src/status-bar': './src/status-bar.js',
    'src/content/dicecloud': './src/content/dicecloud.js',
    'src/content/roll20': './src/content/roll20.js',
    'src/content/character-sheet-overlay': './src/content/character-sheet-overlay.js',
  },
  copyFiles: [
    'manifest_firefox.json',
    'icons',
    'src/popup/popup.html',
    'src/popup/popup.css',
    'src/popup-sheet.html',
    'src/status-bar.html',
    'src/options/welcome.html',
    'src/modules',
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
    // Main extension files - uses same background.js for both
    'src/background': './src/background.js',
    'src/popup/popup': './src/popup/popup.js',
    'src/popup-sheet': './src/popup-sheet.js',
    'src/status-bar': './src/status-bar.js',
    'src/content/dicecloud': './src/content/dicecloud.js',
    'src/content/roll20': './src/content/roll20.js',
    'src/content/character-sheet-overlay': './src/content/character-sheet-overlay.js',
  },
  copyFiles: [
    'manifest.json',
    'icons',
    'src/popup/popup.html',
    'src/popup/popup.css',
    'src/popup-sheet.html',
    'src/status-bar.html',
    'src/options/welcome.html',
    'src/modules',
  ],
  watch,
  minify
});

console.log('✅ Both builds complete!');
console.log('   - Firefox (MV2): dist/');
console.log('   - Chrome (MV3):  dist-chrome/');
