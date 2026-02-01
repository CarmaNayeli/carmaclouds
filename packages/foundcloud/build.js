/**
 * FoundCloud Browser Extension Build Script
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
    'src/options/welcome.html',
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
    'src/options/welcome.html',
  ],
  watch,
  minify
});

console.log('✅ Both builds complete!');
console.log('   - Firefox (MV2): dist/');
console.log('   - Chrome (MV3):  dist-chrome/');

// Copy Foundry module to website for Vercel deployment
console.log('\n📋 Syncing Foundry module to website...');
const websiteFoundryDir = path.join('..', '..', 'website', 'public', 'foundry-module');
const foundryModuleDir = path.join('.', 'foundry-module');

if (fs.existsSync(foundryModuleDir)) {
  // Create website foundry-module directory if it doesn't exist
  if (!fs.existsSync(websiteFoundryDir)) {
    fs.mkdirSync(websiteFoundryDir, { recursive: true });
  }

  // Copy all files from foundry-module to website
  fs.cpSync(foundryModuleDir, websiteFoundryDir, { recursive: true });
  console.log('✅ Synced Foundry module to website/public/foundry-module/');
} else {
  console.warn('⚠️  Foundry module directory not found, skipping website sync');
}
