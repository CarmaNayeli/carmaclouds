#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔨 Building all packages...\n');
execSync('npm run build --workspaces --if-present', { stdio: 'inherit' });

console.log('\n✅ Build complete!');
console.log('\nPackage builds are located in:');
console.log('  - packages/owlcloud/dist/ (Firefox)');
console.log('  - packages/owlcloud/dist-chrome/ (Chrome)');
console.log('  - packages/rollcloud/dist/ (Firefox)');
console.log('  - packages/rollcloud/dist-chrome/ (Chrome)');
console.log('\nTo create release packages, run: npm run package');
