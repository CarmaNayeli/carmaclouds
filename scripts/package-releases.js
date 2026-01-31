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

// Package OwlCloud
const owlcloudDist = path.join(distDir, 'owlcloud');
if (fs.existsSync(owlcloudDist)) {
  console.log('Packaging OwlCloud...');
  const owlcloudZip = path.join(releasesDir, `owlcloud-v${version}.zip`);
  execSync(`powershell Compress-Archive -Path "${owlcloudDist}\\*" -DestinationPath "${owlcloudZip}" -Force`, { stdio: 'inherit' });
  console.log(`✓ Created ${owlcloudZip}`);
}

// Package RollCloud
const rollcloudDist = path.join(distDir, 'rollcloud');
if (fs.existsSync(rollcloudDist)) {
  console.log('Packaging RollCloud...');
  const rollcloudZip = path.join(releasesDir, `rollcloud-v${version}.zip`);
  execSync(`powershell Compress-Archive -Path "${rollcloudDist}\\*" -DestinationPath "${rollcloudZip}" -Force`, { stdio: 'inherit' });
  console.log(`✓ Created ${rollcloudZip}`);
}

// Package Website
const websiteDist = path.join(distDir, 'website');
if (fs.existsSync(websiteDist)) {
  console.log('Packaging Website...');
  const websiteZip = path.join(releasesDir, `carmaclouds-website-v${version}.zip`);
  execSync(`powershell Compress-Archive -Path "${websiteDist}\\*" -DestinationPath "${websiteZip}" -Force`, { stdio: 'inherit' });
  console.log(`✓ Created ${websiteZip}`);
}

console.log(`\n✓ Release packages created in releases/`);
console.log(`\nReady for GitHub release v${version}!`);
