/**
 * Release @carmaclouds/core: bump version, build (via prepublishOnly), publish to
 * npm, and commit the bump. With --cc, also bump the dependency in the Coyotes &
 * Candles app, npm install, and commit + push C&C (triggering its deploy).
 *
 * Usage (from packages/core):
 *   node scripts/publish.mjs [patch|minor|major]   # default: patch
 *   node scripts/publish.mjs minor --cc            # also bump + push the C&C app
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

// 4. Optionally update the C&C dependency, then commit + push C&C so it picks up
//    the new version and deploys.
if (withCC) {
  if (fs.existsSync(path.join(ccDir, 'package.json'))) {
    console.log(`\nUpdating C&C dependency in ${ccDir} ...`);
    run(`npm pkg set "dependencies.@carmaclouds/core=^${version}"`, ccDir);
    run('npm install', ccDir);

    // Commit only the dependency files (not unrelated WIP), then push -> deploy.
    const lockfiles = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']
      .filter((f) => fs.existsSync(path.join(ccDir, f)));
    const paths = ['package.json', ...lockfiles].join(' ');
    try {
      run(`git commit ${paths} -m "deps: @carmaclouds/core@${version}"`, ccDir);
      run('git push', ccDir);
      console.log('Committed + pushed C&C (deploy triggered).');
    } catch {
      console.warn('C&C commit/push skipped (nothing to commit, or push failed) - check manually.');
    }
  } else {
    console.warn(`\n--cc requested but no package.json at ${ccDir}. Set $CC_DIR.`);
  }
}

console.log(`\nDone: @carmaclouds/core@${version} published.`);
if (!withCC) {
  console.log('Reminder: re-run with --cc to bump + push the C&C app to this version,');
  console.log('or do it manually (npm pkg set + npm install + commit + push).');
}
