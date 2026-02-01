#!/usr/bin/env node

/**
 * Sync Versions Script
 * Updates all package.json files to match the root version
 * Run this before building to ensure version consistency
 */

const fs = require('fs');
const path = require('path');

// Get root version
const rootPackage = require('../package.json');
const version = rootPackage.version;

console.log(`🔄 Syncing version ${version} to all packages...\n`);

// Package directories to update
const packages = [
  'packages/core',
  'packages/carmaclouds',
  'packages/owlcloud',
  'packages/rollcloud',
  'packages/foundcloud',
  'website'
];

// Manifest files to update (browser extensions and Foundry module)
const manifests = [
  { path: 'packages/carmaclouds/manifest.json', type: 'Chrome MV3' },
  { path: 'packages/carmaclouds/manifest_firefox.json', type: 'Firefox MV2' },
  { path: 'packages/owlcloud/manifest.json', type: 'Chrome MV3' },
  { path: 'packages/owlcloud/manifest_firefox.json', type: 'Firefox MV2' },
  { path: 'packages/rollcloud/manifest.json', type: 'Chrome MV3' },
  { path: 'packages/rollcloud/manifest_firefox.json', type: 'Firefox MV2' },
  { path: 'packages/foundcloud/foundry-module/module.json', type: 'Foundry Module' }
];

let updatedCount = 0;

// Update package.json files
packages.forEach(pkg => {
  const packageJsonPath = path.join(__dirname, '..', pkg, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    console.log(`⚠️  Skipping ${pkg} (package.json not found)`);
    return;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const oldVersion = packageJson.version;

    if (oldVersion === version) {
      console.log(`✓ ${pkg} already at v${version}`);
      return;
    }

    packageJson.version = version;

    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + '\n'
    );

    console.log(`✅ ${pkg}: v${oldVersion} → v${version}`);
    updatedCount++;
  } catch (error) {
    console.error(`❌ Failed to update ${pkg}:`, error.message);
  }
});

console.log('');

// Update manifest files
manifests.forEach(({ path: manifestPath, type }) => {
  const fullPath = path.join(__dirname, '..', manifestPath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipping ${manifestPath} (not found)`);
    return;
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    const oldVersion = manifest.version;

    if (oldVersion === version) {
      console.log(`✓ ${manifestPath} already at v${version}`);
      return;
    }

    manifest.version = version;

    fs.writeFileSync(
      fullPath,
      JSON.stringify(manifest, null, 2) + '\n'
    );

    console.log(`✅ ${manifestPath} (${type}): v${oldVersion} → v${version}`);
    updatedCount++;
  } catch (error) {
    console.error(`❌ Failed to update ${manifestPath}:`, error.message);
  }
});

console.log(`\n✅ Version sync complete! Updated ${updatedCount} file(s) to v${version}`);
