/**
 * Release @carmaclouds/core: bump version, build (via prepublishOnly), publish to
 * npm, and commit the bump. Optionally bump + reinstall the dependency in the
 * Coyotes & Candles app so it picks up the new version.
 *
 * Usage (from packages/core):
 *   node scripts/publish.mjs [patch|minor|major]   # default: patch
 *   node scripts/publish.mjs minor --cc            # also update C&C's dependency
 *
 * The npm publish uses your stored npm auth (run `npm login` once). publishConfig
 * already sets access:public.
 *
 * Why this exists: carmaclouds consumes core from the local workspace, but the C&C
 * app consumes the npm REGISTRY version - so any core change needs a publish before
 * C&C sees it. See the system-agnostic-ir-rebuild memory.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const coreDir = path.resolve(__dirname, '..');
const run = (cmd, cwd = coreDir) => execSync(cmd, { cwd, stdio: 'inherit' });

const args = process.argv.slice(2);
const bump = args.find((a) => ['patch', 'minor', 'major'].includes(a)) || 'patch';
const withCC = args.includes('--cc');
// C&C repo: ../../../coyotesandcandles from packages/core, or $CC_DIR.
const ccDir = process.env.CC_DIR || path.resolve(coreDir, '../../../coyotesandcandles');

const readVersion = () =>
  JSON.parse(fs.readFileSync(path.join(coreDir, 'package.json'), 'utf8')).version;

console.log(`\n=== Releasing @carmaclouds/core (${bump}) ===`);

// 1. Bump package.json only (no git tag/commit yet).
run(`npm version ${bump} --no-git-tag-version`);
const version = readVersion();
console.log(`\n-> @carmaclouds/core@${version}`);

// 2. Publish (prepublishOnly runs tsc). If this throws, the bump is left
//    uncommitted so you can retry or `git checkout -- package.json`.
console.log('\nPublishing to npm...');
run('npm publish');

// 3. Record the published version in git (package.json only).
try {
  run(`git commit package.json -m "core: publish @carmaclouds/core@${version}"`);
  console.log(`\nCommitted version bump. (push when ready)`);
} catch {
  console.warn('\nCould not auto-commit package.json - commit it manually.');
}

// 4. Optionally update the C&C dependency so it picks up the new version.
if (withCC) {
  if (fs.existsSync(path.join(ccDir, 'package.json'))) {
    console.log(`\nUpdating C&C dependency in ${ccDir} ...`);
    run(`npm pkg set "dependencies.@carmaclouds/core=^${version}"`, ccDir);
    run('npm install', ccDir);
    console.log('Updated C&C dependency + installed. Commit/push C&C to deploy.');
  } else {
    console.warn(`\n--cc requested but no package.json at ${ccDir}. Set $CC_DIR.`);
  }
}

console.log(`\nDone: @carmaclouds/core@${version} published.`);
if (!withCC) {
  console.log('Reminder: bump "@carmaclouds/core" in the C&C app + npm install so it');
  console.log('picks up this version (or re-run with --cc).');
}
