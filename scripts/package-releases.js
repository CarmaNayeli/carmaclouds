#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const releasesDir = path.join(__dirname, '../releases');

if (!fs.existsSync(releasesDir)) {
  fs.mkdirSync(releasesDir, { recursive: true });
}

// Get version from package.json
const packageJson = require('../package.json');
const version = packageJson.version;

console.log(`Creating release packages v${version}...\n`);

// Package CarmaClouds Unified for Chrome (from dist-chrome)
const carmacloudsChromeDist = path.join(__dirname, '../packages/carmaclouds/dist-chrome');
if (fs.existsSync(carmacloudsChromeDist)) {
  console.log('📦 Packaging CarmaClouds for Chrome...');
  const carmacloudsChrome = path.join(releasesDir, 'carmaclouds-chrome.zip');
  execSync(`powershell Compress-Archive -Path "${carmacloudsChromeDist}\\*" -DestinationPath "${carmacloudsChrome}" -Force`, { stdio: 'inherit' });
  console.log(`✓ Created ${carmacloudsChrome}`);
}

// Package CarmaClouds Unified for Firefox (from dist)
const carmacloudsFirefoxDist = path.join(__dirname, '../packages/carmaclouds/dist');
if (fs.existsSync(carmacloudsFirefoxDist)) {
  console.log('📦 Packaging CarmaClouds for Firefox...');
  const carmacloudsFirefox = path.join(releasesDir, 'carmaclouds-firefox.zip');
  execSync(`powershell Compress-Archive -Path "${carmacloudsFirefoxDist}\\*" -DestinationPath "${carmacloudsFirefox}" -Force`, { stdio: 'inherit' });
  console.log(`✓ Created ${carmacloudsFirefox}`);
}

// Package FoundCloud Foundry Module (from website/public/foundry-module)
const foundryModuleDir = path.join(__dirname, '../website/public/foundry-module');
if (fs.existsSync(foundryModuleDir)) {
  console.log('📦 Packaging FoundCloud Foundry Module...');
  const foundryModuleZipRelease = path.join(releasesDir, 'foundcloud-foundry.zip');
  const foundryModuleZipPublic = path.join(__dirname, '../website/public/foundry-module.zip');

  // Create zip in releases/ directory
  execSync(`powershell Compress-Archive -Path "${foundryModuleDir}\\*" -DestinationPath "${foundryModuleZipRelease}" -Force`, { stdio: 'inherit' });
  console.log(`✓ Created ${foundryModuleZipRelease}`);

  // Copy to website/public/ for Vercel deployment (keep as foundry-module.zip for stable URL)
  if (fs.existsSync(foundryModuleZipRelease)) {
    fs.copyFileSync(foundryModuleZipRelease, foundryModuleZipPublic);
    console.log(`✓ Copied to ${foundryModuleZipPublic}`);
  }
}

// Package Website (from website/out)
const websiteDist = path.join(__dirname, '../website/out');
if (fs.existsSync(websiteDist)) {
  console.log('📦 Packaging Website...');
  const websiteZip = path.join(releasesDir, 'carmaclouds-website.zip');
  execSync(`powershell Compress-Archive -Path "${websiteDist}\\*" -DestinationPath "${websiteZip}" -Force`, { stdio: 'inherit' });
  console.log(`✓ Created ${websiteZip}`);
}

console.log(`\n✅ Release packages created in releases/`);
console.log(`\n📋 Release contents (v${version}):`);
console.log(`  - carmaclouds-chrome.zip (Unified Browser Extension)`);
console.log(`  - carmaclouds-firefox.zip (Unified Browser Extension)`);
console.log(`  - foundcloud-foundry.zip (Foundry VTT Module)`);
console.log(`  - carmaclouds-website.zip (Website Build)`);
console.log(`\n🚀 Ready for GitHub release v${version}!`);
