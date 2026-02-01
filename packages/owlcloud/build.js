/**
 * OwlCloud Browser Extension Build Script
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
    'src/content/dicecloud': './src/content/dicecloud.js',
    'src/content/owlbear': './src/content/owlbear.js',

    // Owlbear extension
    'owlbear-extension/popover': './owlbear-extension/popover.js',
    'owlbear-extension/chat': './owlbear-extension/chat.js',
  },
  copyFiles: [
    'manifest.json',
    'icons',
    'src/popup/popup.html',
    'src/popup/popup.css',
    'src/options/welcome.html',
    'owlbear-extension/manifest.json',
    'owlbear-extension/icon.svg',
    'owlbear-extension/dicecloud-logo.svg',
    'owlbear-extension/popover.html',
    'owlbear-extension/chat.html',
  ],
  watch,
  minify
});

// Build Chrome version (Manifest V3)
console.log('📦 Building Chrome version (Manifest V3)...');
await buildExtension({
  packageDir: '.',
  outDir: 'dist-chrome',
  entryPoints: {
    // Main extension files - Chrome uses background-chrome.js
    'src/background-chrome': './src/background-chrome.js',
    'src/popup/popup': './src/popup/popup.js',
    'src/content/dicecloud': './src/content/dicecloud.js',
    'src/content/owlbear': './src/content/owlbear.js',

    // Owlbear extension
    'owlbear-extension/popover': './owlbear-extension/popover.js',
    'owlbear-extension/chat': './owlbear-extension/chat.js',
  },
  copyFiles: [
    'manifest-chrome.json',
    'icons',
    'src/popup/popup.html',
    'src/popup/popup.css',
    'src/options/welcome.html',
    'owlbear-extension/manifest.json',
    'owlbear-extension/icon.svg',
    'owlbear-extension/dicecloud-logo.svg',
    'owlbear-extension/popover.html',
    'owlbear-extension/chat.html',
  ],
  watch,
  minify
});

// Rename Chrome manifest
const chromeDist = path.join('.', 'dist-chrome');
if (fs.existsSync(path.join(chromeDist, 'manifest-chrome.json'))) {
  fs.renameSync(
    path.join(chromeDist, 'manifest-chrome.json'),
    path.join(chromeDist, 'manifest.json')
  );
  console.log('✅ Renamed manifest-chrome.json to manifest.json in dist-chrome');
}

console.log('✅ Both builds complete!');
console.log('   - Firefox (MV2): dist/');
console.log('   - Chrome (MV3):  dist-chrome/');
