#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create dist and releases directories
const distDir = path.join(__dirname, '../dist');
const releasesDir = path.join(__dirname, '../releases');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}
if (!fs.existsSync(releasesDir)) {
  fs.mkdirSync(releasesDir, { recursive: true });
}

console.log('Building all packages...');
execSync('npm run build --workspaces --if-present', { stdio: 'inherit' });

console.log('\nCopying build outputs to dist/...');

// Copy website build
const websiteDist = path.join(__dirname, '../website/out');
const websiteTarget = path.join(distDir, 'website');
if (fs.existsSync(websiteDist)) {
  console.log('Copying website build...');
  execSync(`xcopy /E /I /Y "${websiteDist}" "${websiteTarget}"`, { stdio: 'inherit' });
}

// Copy OwlCloud extension
const owlcloudDist = path.join(__dirname, '../packages/owlcloud/dist');
const owlcloudTarget = path.join(distDir, 'owlcloud');
if (fs.existsSync(owlcloudDist)) {
  console.log('Copying OwlCloud extension...');
  execSync(`xcopy /E /I /Y "${owlcloudDist}" "${owlcloudTarget}"`, { stdio: 'inherit' });

  // Also copy Owlbear extension to website/public for Vercel deployment
  const owlbearExtDist = path.join(owlcloudDist, 'owlbear-extension');
  const owlbearExtTarget = path.join(__dirname, '../website/public/extension/owlbear-extension');
  if (fs.existsSync(owlbearExtDist)) {
    console.log('Copying Owlbear extension to website/public for Vercel...');
    execSync(`xcopy /E /I /Y "${owlbearExtDist}" "${owlbearExtTarget}"`, { stdio: 'inherit' });
  }
}

// Copy RollCloud extension
const rollcloudDist = path.join(__dirname, '../packages/rollcloud/dist');
const rollcloudTarget = path.join(distDir, 'rollcloud');
if (fs.existsSync(rollcloudDist)) {
  console.log('Copying RollCloud extension...');
  execSync(`xcopy /E /I /Y "${rollcloudDist}" "${rollcloudTarget}"`, { stdio: 'inherit' });
}

console.log('\nBuild complete! Outputs copied to dist/');
console.log('\nTo create release packages, run: npm run package');
