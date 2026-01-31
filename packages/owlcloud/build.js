/**
 * OwlCloud Browser Extension Build Script
 * Bundles extension with @carmaclouds/core
 */

import { buildExtension } from '../../build-tools/esbuild-extension.js';

const watch = process.argv.includes('--watch');
const minify = process.argv.includes('--minify');

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
