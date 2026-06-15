/**
 * CarmaClouds Unified Extension Build Script
 * Builds both Chrome (MV3) and Firefox (MV2) versions
 */

import { buildExtension } from '../../build-tools/esbuild-extension.js';
import fs from 'fs';
import path from 'path';

const watch = process.argv.includes('--watch');
const minify = process.argv.includes('--minify');

// Compile @carmaclouds/core first so its ./ir and ./render exports (now pointing
// at dist) resolve for esbuild. Keeps the package publishable (compiled JS+types)
// while the extension bundles the same dist.
console.log('📦 Building @carmaclouds/core (tsc)...');
{
  const { execSync } = await import('child_process');
  execSync('npm run build', { cwd: path.join('..', 'core'), stdio: 'inherit' });
}

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
    'src/content/coyotecandles': './src/content/coyotecandles.js',
    // Shared modules (for dynamic imports)
    'src/content/dicecloud-extraction': './src/content/dicecloud-extraction.js',
    // Adapters (lazy loaded, but need to be bundled)
    'src/popup/adapters/rollcloud/adapter': './src/popup/adapters/rollcloud/adapter.js',
    'src/popup/adapters/rollcloud/rollcloud-popup': './src/popup/adapters/rollcloud/rollcloud-popup.js',
    'src/popup/adapters/owlcloud/adapter': './src/popup/adapters/owlcloud/adapter.js',
    'src/popup/adapters/owlcloud/owlcloud-popup': './src/popup/adapters/owlcloud/owlcloud-popup.js',
    'src/popup/adapters/foundcloud/adapter': './src/popup/adapters/foundcloud/adapter.js',
    'src/popup/adapters/foundcloud/foundcloud-popup': './src/popup/adapters/foundcloud/foundcloud-popup.js',
    'src/popup/adapters/coyotecloud/adapter': './src/popup/adapters/coyotecloud/adapter.js',
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
    // Copy CarmaClouds-specific modules if they exist
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
    // Main extension files
    'src/background': './src/background.js',
    'src/popup/popup': './src/popup/popup.js',
    'src/popup/supabase-init': './src/popup/supabase-init.js',
    'src/content/dicecloud': './src/content/dicecloud.js',
    'src/content/roll20': './src/content/roll20.js',
    'src/content/character-sheet-overlay': './src/content/character-sheet-overlay.js',
    'src/content/owlbear': './src/content/owlbear.js',
    'src/content/coyotecandles': './src/content/coyotecandles.js',
    // Shared modules (for dynamic imports)
    'src/content/dicecloud-extraction': './src/content/dicecloud-extraction.js',
    // Adapters (lazy loaded, but need to be bundled)
    'src/popup/adapters/rollcloud/adapter': './src/popup/adapters/rollcloud/adapter.js',
    'src/popup/adapters/rollcloud/rollcloud-popup': './src/popup/adapters/rollcloud/rollcloud-popup.js',
    'src/popup/adapters/owlcloud/adapter': './src/popup/adapters/owlcloud/adapter.js',
    'src/popup/adapters/owlcloud/owlcloud-popup': './src/popup/adapters/owlcloud/owlcloud-popup.js',
    'src/popup/adapters/foundcloud/adapter': './src/popup/adapters/foundcloud/adapter.js',
    'src/popup/adapters/foundcloud/foundcloud-popup': './src/popup/adapters/foundcloud/foundcloud-popup.js',
    'src/popup/adapters/coyotecloud/adapter': './src/popup/adapters/coyotecloud/adapter.js',
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
    // Copy CarmaClouds-specific modules if they exist
    'src/modules',
  ],
  watch,
  minify
});

console.log('✅ Both builds complete!');
console.log('   - Firefox (MV2): dist/');
console.log('   - Chrome (MV3):  dist-chrome/');

// Bundle the rebuild's IR + render layer (@carmaclouds/core) into the Owlbear
// extension as a window global, since the popover loads as a classic script.
console.log('\n📦 Bundling cc-core.js for the Owlbear extension...');
const esbuild = (await import('esbuild')).default;
for (const out of ['dist', 'dist-chrome']) {
  // Owlbear extension copy (loaded by its popover; also synced to the website).
  await esbuild.build({
    entryPoints: ['src/owlbear-cc-core-entry.js'],
    bundle: true, format: 'iife', platform: 'browser', target: 'es2020',
    outfile: path.join(out, 'owlbear-extension', 'cc-core.js'),
    logLevel: 'silent',
  });
  // Shared copy at the dist root for other classic-script extension pages
  // (e.g. src/popup-sheet.html -> ../cc-core.js). cc-sheet.css alongside it.
  await esbuild.build({
    entryPoints: ['src/owlbear-cc-core-entry.js'],
    bundle: true, format: 'iife', platform: 'browser', target: 'es2020',
    outfile: path.join(out, 'cc-core.js'),
    logLevel: 'silent',
  });
  fs.copyFileSync(
    path.join('owlbear-extension', 'cc-sheet.css'),
    path.join(out, 'cc-sheet.css'),
  );
}
console.log('✅ Bundled cc-core.js (owlbear-extension/ + dist root) and cc-sheet.css');

// Bundle the IR + render layer for the Foundry module (ESM, imported by the
// FoundCloud sheet), and provide cc-sheet.css as a module style.
await esbuild.build({
  entryPoints: ['src/foundry-cc-core-entry.js'],
  bundle: true, format: 'esm', platform: 'browser', target: 'es2020',
  outfile: path.join('foundry-module', 'scripts', 'cc-core.js'),
  logLevel: 'silent',
});
fs.copyFileSync(
  path.join('owlbear-extension', 'cc-sheet.css'),
  path.join('foundry-module', 'styles', 'cc-sheet.css'),
);
console.log('✅ Bundled cc-core.js + cc-sheet.css into the Foundry module');

// Sync Foundry module to website directory
console.log('\n📋 Syncing Foundry module to website...');
const foundryModuleSource = path.join('.', 'foundry-module');
const foundryModuleDest = path.join('..', '..', 'website', 'public', 'foundry-module');

if (fs.existsSync(foundryModuleSource)) {
  // Remove existing destination if it exists
  if (fs.existsSync(foundryModuleDest)) {
    fs.rmSync(foundryModuleDest, { recursive: true, force: true });
  }

  // Copy foundry module to website
  fs.cpSync(foundryModuleSource, foundryModuleDest, { recursive: true });
  console.log('✅ Synced Foundry module to website/public/foundry-module/');

  // Create zip file for Foundry manifest download URL
  console.log('\n📦 Creating foundry-module.zip for Vercel deployment...');
  const { execSync } = await import('child_process');
  const websitePublicDir = path.join('..', '..', 'website', 'public');
  const zipPath = path.join(websitePublicDir, 'foundry-module.zip');

  // Remove old zip if it exists
  if (fs.existsSync(zipPath)) {
    fs.rmSync(zipPath);
  }

  try {
    // Create fresh zip using 7z (cross-platform)
    execSync(`7z a -tzip foundry-module.zip foundry-module/*`, {
      cwd: websitePublicDir,
      stdio: 'inherit'
    });
    console.log('✅ Created website/public/foundry-module.zip');
  } catch (error) {
    console.error('⚠️  Failed to create zip (is 7z installed?):', error.message);
    console.log('   You can manually create it with: cd website/public && 7z a -tzip foundry-module.zip foundry-module/*');
  }
} else {
  console.log('⚠️  Foundry module not found at foundry-module/');
}

// Create Chrome and Firefox extension zips for Vercel download
console.log('\n📦 Creating extension zips for Vercel deployment...');
const { execSync: execSyncForZips } = await import('child_process');
const extensionPublicDir = path.join('..', '..', 'website', 'public');
const chromeZipPath = path.join(extensionPublicDir, 'carmaclouds-chrome.zip');
const firefoxZipPath = path.join(extensionPublicDir, 'carmaclouds-firefox.zip');

if (fs.existsSync(chromeZipPath)) fs.rmSync(chromeZipPath);
if (fs.existsSync(firefoxZipPath)) fs.rmSync(firefoxZipPath);

try {
  execSyncForZips(`7z a -tzip carmaclouds-chrome.zip ${path.resolve('dist-chrome')}/*`, {
    cwd: extensionPublicDir,
    stdio: 'inherit'
  });
  console.log('✅ Created website/public/carmaclouds-chrome.zip');
} catch (error) {
  console.error('⚠️  Failed to create Chrome zip:', error.message);
}

try {
  execSyncForZips(`7z a -tzip carmaclouds-firefox.zip ${path.resolve('dist')}/*`, {
    cwd: extensionPublicDir,
    stdio: 'inherit'
  });
  console.log('✅ Created website/public/carmaclouds-firefox.zip');
} catch (error) {
  console.error('⚠️  Failed to create Firefox zip:', error.message);
}

// Sync Owlbear extension to website directory
console.log('\n📋 Syncing Owlbear extension to website...');
const owlbearExtensionSource = path.join('.', 'dist-chrome', 'owlbear-extension');
const owlbearExtensionDest = path.join('..', '..', 'website', 'public', 'extension', 'owlbear-extension');

if (fs.existsSync(owlbearExtensionSource)) {
  // Remove existing destination if it exists
  if (fs.existsSync(owlbearExtensionDest)) {
    fs.rmSync(owlbearExtensionDest, { recursive: true, force: true });
  }

  // Ensure parent directory exists
  const owlbearExtensionParent = path.dirname(owlbearExtensionDest);
  if (!fs.existsSync(owlbearExtensionParent)) {
    fs.mkdirSync(owlbearExtensionParent, { recursive: true });
  }

  // Copy owlbear extension to website
  fs.cpSync(owlbearExtensionSource, owlbearExtensionDest, { recursive: true });
  console.log('✅ Synced Owlbear extension to website/public/extension/owlbear-extension/');
} else {
  console.log('⚠️  Owlbear extension not found at dist-chrome/owlbear-extension/');
}
