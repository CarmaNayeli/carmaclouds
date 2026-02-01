#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔨 Building all packages...\n');
execSync('npm run build --workspaces --if-present', { stdio: 'inherit' });

console.log('\n✅ Build complete!');
console.log('\nCarmaClouds Unified Extension:');
console.log('  - packages/carmaclouds/dist/ (Firefox)');
console.log('  - packages/carmaclouds/dist-chrome/ (Chrome)');
console.log('\nFoundry VTT Module:');
console.log('  - packages/foundcloud/foundry-module/ → website/public/foundry-module/');
console.log('\nTo create release packages, run: npm run package');
