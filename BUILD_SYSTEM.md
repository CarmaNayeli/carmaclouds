# CarmaClouds Build System

**Unified build system for browser extensions using esbuild**

## Overview

All browser extensions in the CarmaClouds monorepo now use **esbuild** for bundling. This allows extensions to import from `@carmaclouds/core` and provides faster, more reliable builds.

## Features

✅ **Fast builds** - esbuild is written in Go and extremely fast
✅ **Module bundling** - Import from `@carmaclouds/core` in your extension code
✅ **Watch mode** - Auto-rebuild on file changes during development
✅ **Minification** - Production builds are minified for smaller file size
✅ **Source maps** - Debugging support in development mode
✅ **Static asset copying** - HTML, CSS, icons, and manifest files copied automatically

---

## Build Tools Package

Location: `build-tools/`

This workspace package provides shared build utilities:

```javascript
import { buildExtension } from '@carmaclouds/build-tools';

await buildExtension({
  packageDir: '.',
  outDir: 'dist',
  entryPoints: {
    'src/background': './src/background.js',
    'src/content/main': './src/content/main.js',
  },
  copyFiles: [
    'manifest.json',
    'icons',
    'src/**/*.html',
    'src/**/*.css',
  ],
  watch: false,
  minify: false
});
```

---

## Package Structure

Each extension package has:

```
packages/owlcloud/
├── src/                    # Source files
│   ├── background.js       # Service worker (entry point)
│   ├── content/           # Content scripts (entry points)
│   ├── popup/             # Popup HTML/CSS/JS
│   └── ...
├── manifest.json          # Extension manifest
├── icons/                 # Extension icons
├── build.js              # Build script
├── package.json          # NPM scripts
└── dist/                 # Build output (gitignored)
```

---

## Build Scripts

### OwlCloud

```bash
# Development build (unminified, with source maps)
cd packages/owlcloud
npm run build

# Watch mode (auto-rebuild on changes)
npm run build:watch

# Production build (minified, no source maps)
npm run build:prod

# Package for distribution
npm run package

# Clean build artifacts
npm run clean
```

### RollCloud

```bash
# Same commands work for rollcloud
cd rollcloud
npm run build
npm run build:watch
npm run build:prod
npm run clean
```

---

## How It Works

### 1. Entry Points

Entry points are JavaScript files that esbuild will bundle:

```javascript
entryPoints: {
  'src/background': './src/background.js',      // → dist/src/background.js
  'src/content/main': './src/content/main.js',  // → dist/src/content/main.js
}
```

Each entry point becomes a bundled JavaScript file in the output directory.

### 2. Bundling

esbuild:
- Resolves all `import` statements
- Bundles dependencies from `@carmaclouds/core`
- Bundles npm packages (if any)
- Outputs a single file per entry point

### 3. Static Files

Files listed in `copyFiles` are copied as-is to the dist directory:

```javascript
copyFiles: [
  'manifest.json',        // → dist/manifest.json
  'icons',               // → dist/icons/ (entire folder)
  'src/popup/popup.html' // → dist/src/popup/popup.html
]
```

### 4. Output Structure

After building, the `dist/` directory mirrors the source structure:

```
dist/
├── manifest.json          # Copied from source
├── icons/                 # Copied from source
├── src/
│   ├── background.js      # Bundled
│   ├── background.js.map  # Source map
│   ├── content/
│   │   ├── main.js        # Bundled
│   │   └── main.js.map    # Source map
│   └── popup/
│       ├── popup.js       # Bundled
│       ├── popup.html     # Copied
│       └── popup.css      # Copied
└── ...
```

---

## Using @carmaclouds/core

Now that extensions are bundled, you can import from the core package:

```javascript
// Before (direct file imports)
import { debug } from './common/debug.js';
import { CacheManager } from './lib/cache.js';

// After (import from @carmaclouds/core)
import { CacheManager } from '@carmaclouds/core';

const cache = new CacheManager({
  expiryMs: 60 * 60 * 1000, // 1 hour
  debug: true
});
```

### Available Exports

From `@carmaclouds/core`:

```javascript
// Types
import { Character, CacheStats } from '@carmaclouds/core';

// Cache Manager
import { CacheManager } from '@carmaclouds/core';

// Supabase Field Definitions
import {
  CHARACTER_FULL,
  CHARACTER_COMBAT,
  CHARACTER_SPELLS,
  CHARACTER_RESOURCES,
  PAIRING_FIELDS,
  FIELD_SETS
} from '@carmaclouds/core';
```

---

## Development Workflow

### 1. Make Changes

Edit source files in `src/`:

```bash
packages/owlcloud/src/content/dicecloud.js
```

### 2. Build

```bash
npm run build:watch
```

This will:
1. Bundle your JavaScript with dependencies
2. Copy static files
3. Watch for changes and rebuild automatically

### 3. Load Extension

Load the `dist/` directory in your browser:

**Firefox:**
- Open `about:debugging#/runtime/this-firefox`
- Click "Load Temporary Add-on"
- Select `dist/manifest.json`

**Chrome:**
- Open `chrome://extensions`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `dist/` folder

### 4. Reload on Changes

When you make changes:
1. The build watch process automatically rebuilds
2. Click "Reload" in the browser's extension page
3. Test your changes

---

## Production Builds

For distribution:

```bash
# Build minified version
npm run build:prod

# Package into .zip (OwlCloud only)
npm run package
```

This creates optimized, minified builds in `dist/` or `web-ext-artifacts/`.

---

## Troubleshooting

### Build Fails with "Cannot resolve module"

**Problem:** esbuild can't find an imported module

**Solution:**
1. Make sure the file path is correct
2. Use relative imports: `./file.js` not `file.js`
3. Check if the module is in `package.json` dependencies

### Extension Doesn't Load

**Problem:** Browser can't load the extension

**Solution:**
1. Make sure you're loading from `dist/`, not root
2. Check that `manifest.json` was copied to `dist/`
3. Verify manifest paths point to bundled files

### Changes Not Reflecting

**Problem:** Code changes don't appear in extension

**Solution:**
1. Make sure build:watch is running and rebuilt
2. Click "Reload" in browser extensions page
3. Hard refresh the page if testing content scripts (Ctrl+Shift+R)

### Import Errors in Browser Console

**Problem:** `Cannot use import statement outside a module`

**Solution:**
- esbuild bundles everything as IIFE format (not ES modules)
- The bundled files should not have `type="module"` in manifest
- Check that manifest.json references the bundled `.js` files correctly

---

## Manifest Updates

**Important:** After setting up the build system, you may need to update `manifest.json` to reference bundled files instead of individual modules.

### Before (unbundled)

```json
{
  "content_scripts": [
    {
      "js": [
        "src/common/browser-polyfill.js",
        "src/common/debug.js",
        "src/content/dicecloud.js"
      ]
    }
  ]
}
```

### After (bundled)

```json
{
  "content_scripts": [
    {
      "js": [
        "src/content/dicecloud.js"
      ]
    }
  ]
}
```

The bundled file includes all dependencies, so you only need one reference.

---

## Next Steps

1. ✅ OwlCloud builds successfully
2. ✅ RollCloud build script ready
3. ⬜ Test RollCloud build
4. ⬜ Update manifests to use bundled files
5. ⬜ Convert extension code to use `@carmaclouds/core` imports
6. ⬜ Remove duplicated files from extension packages

---

## Reference

- [esbuild Documentation](https://esbuild.github.io/)
- [Browser Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [@carmaclouds/core Package](packages/core/README.md)

---

**Last Updated:** 2026-01-31
