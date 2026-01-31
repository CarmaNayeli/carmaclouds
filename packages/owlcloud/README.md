# @carmaclouds/owlcloud 🦉

**Browser extension for DiceCloud with Owlbear Rodeo integration**

---

## Features

- ✅ Firefox/Chrome browser extension
- ✅ Sync DiceCloud characters to Owlbear Rodeo
- ✅ Real-time HP tracking
- ✅ Automated token updates
- ✅ Heavy caching (1hr memory + 24hr localStorage)
- ✅ Session management across browsers
- ✅ Discord integration support

---

## Structure

```
owlcloud/
├── src/                          # Browser extension source
│   ├── background.js             # Service worker
│   ├── popup/                    # Extension popup
│   ├── content/                  # Content scripts
│   ├── lib/
│   │   └── supabase-client.js   # Optimized Supabase client with heavy caching
│   └── utils/
│
├── owlbear-extension/            # Owlbear Rodeo integration
│   ├── popover.js               # Character selector UI
│   ├── chat.js                  # Chat integration
│   └── manifest.json            # Owlbear manifest
│
├── installer/                    # Native messaging installer
├── icons/                        # Extension icons
├── manifest.json                 # WebExtension manifest
└── package.json
```

---

## Installation

### Development

```bash
# From monorepo root
cd packages/owlcloud

# Install dependencies
npm install

# Run in Firefox
npm run dev

# Run in Firefox Developer Edition
npm run dev:firefox-dev
```

### Build for Production

```bash
npm run build
```

This creates a `.zip` file in `web-ext-artifacts/` ready for submission to:
- Firefox Add-ons (AMO)
- Chrome Web Store

---

## Key Features

### Heavy Caching System

The extension uses an optimized caching system to reduce Supabase egress costs:

**Cache Tiers:**
1. **Memory Cache:** 1 hour TTL (fast access)
2. **localStorage Cache:** 24 hour TTL (survives browser restarts)

**Impact:** ~95% reduction in database queries

```javascript
// From src/lib/supabase-client.js
class SupabaseTokenManager {
  constructor() {
    this.cacheExpiryMs = 60 * 60 * 1000; // 1 hour
    this.persistentCacheExpiryMs = 24 * 60 * 60 * 1000; // 24 hours
  }
}
```

### Owlbear Rodeo Integration

The extension includes a custom Owlbear Rodeo extension that:
- Syncs character data to Owlbear scenes
- Updates tokens automatically
- Tracks HP in real-time
- Manages multiple characters

---

## Configuration

### Manifest (manifest.json)

Update version and permissions as needed:
```json
{
  "manifest_version": 3,
  "name": "OwlCloud",
  "version": "1.0.0"
}
```

### Supabase Configuration

**Location:** `src/lib/supabase-client.js`

```javascript
const SUPABASE_URL = 'https://luiesmfjdcmpywavvfqm.supabase.co';
const SUPABASE_ANON_KEY = 'your_anon_key';
```

---

## Development

### File Watcher

The extension uses web-ext's built-in file watcher:
```bash
npm run dev
```

This will:
- Load the extension in Firefox
- Auto-reload on file changes
- Show console output

### Debugging

1. **Background Script:** Open `about:debugging#/runtime/this-firefox`
2. **Popup:** Right-click extension icon → Inspect
3. **Content Scripts:** Use browser DevTools on the page

---

## Integration with Core

Currently, OwlCloud uses its own optimized caching implementation. Future improvements could include:

- [ ] Use `@carmaclouds/core` types for character data
- [ ] Share Supabase field definitions with other packages
- [ ] Unified cache manager (optional - current implementation is already optimized)

**Note:** OwlCloud's caching is the reference implementation and is already fully optimized. Other packages (RollCloud, FoundCloud) should follow this pattern.

---

## API Endpoints

### Supabase Edge Functions

The extension uses the unified `characters` edge function:

**GET Active Character:**
```
GET /functions/v1/characters?owlbear_player_id={id}&fields=full
```

**Set Active Character:**
```
POST /functions/v1/characters
Body: { owlbearPlayerId, character }
```

---

## Deployment

### Firefox Add-ons (AMO)

```bash
# Build
npm run build

# Sign (requires AMO API keys)
export AMO_JWT_ISSUER=your_issuer
export AMO_JWT_SECRET=your_secret
npm run sign
```

### Chrome Web Store

```bash
# Build creates a .zip in web-ext-artifacts/
npm run build

# Upload to Chrome Web Store dashboard
```

---

## Permissions

The extension requires these permissions:

- `storage` - For caching and settings
- `tabs` - For content script injection
- `activeTab` - For interacting with current tab
- Host permissions for:
  - `https://dicecloud.com/*`
  - `https://www.owlbear.rodeo/*`
  - `https://luiesmfjdcmpywavvfqm.supabase.co/*`

---

## Cache Statistics

View cache performance in the console:

```javascript
// In browser console or background script
const supabase = new SupabaseTokenManager();
console.log(supabase.getCacheStats());

// Output:
// {
//   size: 15,
//   memoryExpiryMs: 3600000,
//   persistentExpiryMs: 86400000,
//   entries: ['character_abc123', ...]
// }
```

---

## Troubleshooting

### Cache Issues

Clear cache:
```javascript
await supabase.clearCharacterCache();
```

### Connection Issues

Check Supabase URL and keys in `src/lib/supabase-client.js`

### Owlbear Integration

Verify the Owlbear extension manifest is correctly configured in `owlbear-extension/manifest.json`

---

## Contributing

When making changes:

1. Follow existing code patterns
2. Test in both Firefox and Chrome
3. Update manifest version
4. Run linter: `npm run lint`
5. Test caching behavior

---

## Related Packages

- [@carmaclouds/core](../core/README.md) - Shared utilities
- [@carmaclouds/rollcloud](../rollcloud/README.md) - Discord bot
- [@carmaclouds/foundcloud](../foundcloud/README.md) - Foundry VTT module

---

## License

MIT
