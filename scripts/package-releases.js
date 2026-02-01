#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distDir = path.join(__dirname, '../dist');
const releasesDir = path.join(__dirname, '../releases');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist/ directory not found. Run "npm run build:copy" first.');
  process.exit(1);
}

if (!fs.existsSync(releasesDir)) {
  fs.mkdirSync(releasesDir, { recursive: true });
}

// Get version from package.json
const packageJson = require('../package.json');
const version = packageJson.version;

console.log(`Creating release packages v${version}...\n`);

// Package OwlCloud for Chrome
const owlcloudDist = path.join(distDir, 'owlcloud');
if (fs.existsSync(owlcloudDist)) {
  console.log('Packaging OwlCloud for Chrome...');
  const owlcloudChromeZip = path.join(releasesDir, `owlcloud-chrome.zip`);
  execSync(`powershell Compress-Archive -Path "${owlcloudDist}\\*" -DestinationPath "${owlcloudChromeZip}" -Force`, { stdio: 'inherit' });
  console.log(`✓ Created ${owlcloudChromeZip}`);

  console.log('Packaging OwlCloud for Firefox...');
  const owlcloudFirefoxZip = path.join(releasesDir, `owlcloud-firefox.zip`);
  execSync(`powershell Compress-Archive -Path "${owlcloudDist}\\*" -DestinationPath "${owlcloudFirefoxZip}" -Force`, { stdio: 'inherit' });
  console.log(`✓ Created ${owlcloudFirefoxZip}`);
}

// Package RollCloud for Chrome
const rollcloudDist = path.join(distDir, 'rollcloud');
if (fs.existsSync(rollcloudDist)) {
  console.log('Packaging RollCloud for Chrome...');
  const rollcloudChromeZip = path.join(releasesDir, `rollcloud-chrome.zip`);
  execSync(`powershell Compress-Archive -Path "${rollcloudDist}\\*" -DestinationPath "${rollcloudChromeZip}" -Force`, { stdio: 'inherit' });
  console.log(`✓ Created ${rollcloudChromeZip}`);

  console.log('Packaging RollCloud for Firefox...');
  const rollcloudFirefoxZip = path.join(releasesDir, `rollcloud-firefox.zip`);
  execSync(`powershell Compress-Archive -Path "${rollcloudDist}\\*" -DestinationPath "${rollcloudFirefoxZip}" -Force`, { stdio: 'inherit' });
  console.log(`✓ Created ${rollcloudFirefoxZip}`);
}

// Package Website
const websiteDist = path.join(distDir, 'website');
if (fs.existsSync(websiteDist)) {
  console.log('Packaging Website...');
  const websiteZip = path.join(releasesDir, `carmaclouds-website.zip`);
  execSync(`powershell Compress-Archive -Path "${websiteDist}\\*" -DestinationPath "${websiteZip}" -Force`, { stdio: 'inherit' });
  console.log(`✓ Created ${websiteZip}`);
}

console.log(`\n✓ Release packages created in releases/`);
console.log(`\nReady for GitHub release v${version}!`);
