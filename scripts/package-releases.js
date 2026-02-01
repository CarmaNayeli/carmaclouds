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

// Package OwlCloud for Chrome (from dist-chrome)
const owlcloudChromeDist = path.join(__dirname, '../packages/owlcloud/dist-chrome');
if (fs.existsSync(owlcloudChromeDist)) {
  console.log('Packaging OwlCloud for Chrome...');
  const owlcloudChromeZip = path.join(releasesDir, `owlcloud-chrome.zip`);
  execSync(`powershell Compress-Archive -Path "${owlcloudChromeDist}\\*" -DestinationPath "${owlcloudChromeZip}" -Force`, { stdio: 'inherit' });
  console.log(`✓ Created ${owlcloudChromeZip}`);
}

// Package OwlCloud for Firefox (from dist)
const owlcloudFirefoxDist = path.join(__dirname, '../packages/owlcloud/dist');
if (fs.existsSync(owlcloudFirefoxDist)) {
  console.log('Packaging OwlCloud for Firefox...');
  const owlcloudFirefoxZip = path.join(releasesDir, `owlcloud-firefox.zip`);
  execSync(`powershell Compress-Archive -Path "${owlcloudFirefoxDist}\\*" -DestinationPath "${owlcloudFirefoxZip}" -Force`, { stdio: 'inherit' });
  console.log(`✓ Created ${owlcloudFirefoxZip}`);
}

// Package RollCloud for Chrome (from dist-chrome)
const rollcloudChromeDist = path.join(__dirname, '../packages/rollcloud/dist-chrome');
if (fs.existsSync(rollcloudChromeDist)) {
  console.log('Packaging RollCloud for Chrome...');
  const rollcloudChromeZip = path.join(releasesDir, `rollcloud-chrome.zip`);
  execSync(`powershell Compress-Archive -Path "${rollcloudChromeDist}\\*" -DestinationPath "${rollcloudChromeZip}" -Force`, { stdio: 'inherit' });
  console.log(`✓ Created ${rollcloudChromeZip}`);
}

// Package RollCloud for Firefox (from dist)
const rollcloudFirefoxDist = path.join(__dirname, '../packages/rollcloud/dist');
if (fs.existsSync(rollcloudFirefoxDist)) {
  console.log('Packaging RollCloud for Firefox...');
  const rollcloudFirefoxZip = path.join(releasesDir, `rollcloud-firefox.zip`);
  execSync(`powershell Compress-Archive -Path "${rollcloudFirefoxDist}\\*" -DestinationPath "${rollcloudFirefoxZip}" -Force`, { stdio: 'inherit' });
  console.log(`✓ Created ${rollcloudFirefoxZip}`);
}

// Package Website (from website/out)
const websiteDist = path.join(__dirname, '../website/out');
if (fs.existsSync(websiteDist)) {
  console.log('Packaging Website...');
  const websiteZip = path.join(releasesDir, `carmaclouds-website.zip`);
  execSync(`powershell Compress-Archive -Path "${websiteDist}\\*" -DestinationPath "${websiteZip}" -Force`, { stdio: 'inherit' });
  console.log(`✓ Created ${websiteZip}`);
}

console.log(`\n✓ Release packages created in releases/`);
console.log(`\nReady for GitHub release v${version}!`);
