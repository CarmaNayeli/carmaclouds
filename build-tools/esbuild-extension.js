/**
 * Unified esbuild configuration for browser extensions
 * Used by OwlCloud and RollCloud
 */

import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

/**
 * Copy files/directories recursively
 */
function copyRecursive(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursive(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
  }
}

/**
 * Build a browser extension with esbuild
 *
 * @param {Object} config - Build configuration
 * @param {string} config.packageDir - Package directory (e.g., 'packages/owlcloud')
 * @param {string} config.outDir - Output directory (e.g., 'dist')
 * @param {Object} config.entryPoints - Entry points to bundle
 * @param {string[]} config.copyFiles - Files/folders to copy to dist
 * @param {boolean} config.watch - Watch mode for development
 * @param {boolean} config.minify - Minify output
 */
export async function buildExtension(config) {
  const {
    packageDir,
    outDir = 'dist',
    entryPoints = {},
    copyFiles = [],
    watch = false,
    minify = false,
  } = config;

  const outPath = path.join(packageDir, outDir);

  // Clean output directory
  if (fs.existsSync(outPath)) {
    fs.rmSync(outPath, { recursive: true });
  }
  fs.mkdirSync(outPath, { recursive: true });

  console.log(`🔨 Building extension: ${packageDir}`);
  console.log(`📦 Output: ${outPath}`);

  // Build configuration
  const buildConfig = {
    entryPoints,
    bundle: true,
    outdir: outPath,
    platform: 'browser',
    target: ['chrome100', 'firefox100'],
    format: 'iife',
    minify,
    sourcemap: !minify,
    logLevel: 'info',
    define: {
      'process.env.NODE_ENV': JSON.stringify(minify ? 'production' : 'development')
    },
    banner: {
      js: '// Initialize debug globally\nif (typeof window !== "undefined" && !window.debug) { window.debug = { log: console.log, warn: console.warn, error: console.error, info: console.info, group: console.group, groupEnd: console.groupEnd, table: console.table, time: console.time, timeEnd: console.timeEnd, isEnabled: () => true }; }\nconst debug = window.debug;\n// Supabase config will be set by browser.js\nconst SUPABASE_URL = typeof window !== "undefined" ? window.SUPABASE_URL : undefined;\nconst SUPABASE_ANON_KEY = typeof window !== "undefined" ? window.SUPABASE_ANON_KEY : undefined;\n// SupabaseTokenManager will be set by browser.js\nconst SupabaseTokenManager = typeof window !== "undefined" ? window.SupabaseTokenManager : undefined;'
    }
  };

  // Build with esbuild
  if (watch) {
    // Watch mode for development
    const ctx = await esbuild.context(buildConfig);
    await ctx.watch();
    console.log('👀 Watching for changes...');
  } else {
    // One-time build
    await esbuild.build(buildConfig);
  }

  // Copy static files
  console.log('📋 Copying static files...');
  for (const file of copyFiles) {
    const srcPath = path.join(packageDir, file);
    const destPath = path.join(outPath, file);

    if (fs.existsSync(srcPath)) {
      copyRecursive(srcPath, destPath);
      console.log(`   ✓ ${file}`);
    } else {
      console.warn(`   ⚠ Not found: ${file}`);
    }
  }

  console.log('✅ Build complete!');
}

/**
 * Helper to get package directory from process.cwd()
 */
export function getPackageDir() {
  return process.cwd();
}
