# FoundCloud - Foundry VTT Module

Companion module for the FoundCloud browser extension. Syncs DiceCloud V2 characters to Foundry VTT with Discord integration.

**Version:** 2.3.0
**Compatibility:** Foundry VTT v11-v13
**System:** D&D 5e

## Overview

FoundCloud uses **cloud sync** to bring your DiceCloud characters into Foundry VTT:

- **Browser Extension**: Syncs DiceCloud characters to Supabase cloud storage
- **Foundry Module**: Imports character data from Supabase into Foundry actors

## Features

- ✅ **Cloud Sync**: Characters synced from DiceCloud via Supabase
- ✅ **One-Click Import**: Import characters directly into Foundry
- ✅ **Complete Character Data**: Abilities, skills, saves, HP, AC, initiative, and more
- ✅ **Spell Import**: Automatically import all spells with full details
- ✅ **Equipment Import**: Import weapons, armor, and items with quantities
- ✅ **Class Features**: Import actions and special abilities
- ✅ **Portrait Support**: Character images imported automatically
- ✅ **Race/Species**: Character race information preserved

## Installation

### Prerequisites

1. **Foundry VTT** (v11 or later)
2. **D&D 5e System** installed
3. **FoundCloud Browser Extension** installed and configured

### Install the Module

#### Method 1: Via Manifest URL (Recommended)
1. Open Foundry VTT
2. Go to **Add-on Modules** tab
3. Click **Install Module**
4. Paste this manifest URL:
   ```
   https://carmaclouds.vercel.app/foundry-module/module.json
   ```
5. Click **Install**

#### Method 2: Manual Installation
1. Download the latest release from [GitHub Releases](https://github.com/CarmaNayeli/foundCloud/releases)
2. Extract to `Data/modules/foundcloud/`
3. Restart Foundry VTT
4. Enable the module in your world

### Install the Browser Extension

1. Download from [carmaclouds.vercel.app](https://carmaclouds.vercel.app)
2. Install CarmaClouds in Chrome/Firefox/Edge
3. Login to DiceCloud via the extension
4. Sync your characters to the cloud
5. Your characters will be available for import in Foundry

## Usage

### First Time Setup

1. **Enable Module**: Activate FoundCloud in your world's module settings
2. **Install Extension**: Make sure the browser extension is installed and logged in
3. **Launch Foundry**: The module will detect the extension automatically

### Importing Characters

1. **Sync in Extension**: Open CarmaClouds extension → FoundCloud tab → Click "☁️ Sync to Cloud" on your character
2. **Import in Foundry**: Open the **Actors** sidebar
3. Click the orange **"Import from DiceCloud"** button
4. Select your character from the list
5. Choose import options:
   - ☑️ Import Spells
   - ☑️ Import Equipment  
   - ☑️ Import Class Features
6. Click **Import**

Your character will be created as a Foundry actor with stats, skills, spells, features, and inventory!

### Syncing Characters

Characters imported from DiceCloud have a **Sync with DiceCloud** button in their character sheet header.

Click this button to refresh the character data from DiceCloud whenever you make changes.

### Discord Integration

If you have Pip Bot configured with the browser extension, rolls and turn notifications will automatically be sent to Discord:

- **Rolls**: When you roll dice in Foundry, they appear in Discord
- **Turn Notifications**: When combat turns change, Discord gets notified
- **Combat Status**: Action economy and HP updates sent to Discord

Enable/disable in module settings: **Discord Integration**

## Module Settings

Configure FoundCloud in **Game Settings → Module Settings → FoundCloud**:

### World Settings (GM Only)
- **Auto-sync on Combat Turn**: Sync character when their turn starts
- **Discord Integration**: Enable Discord notifications
- **Import Spells**: Auto-import spells during sync
- **Import Equipment**: Auto-import items during sync
- **Import Class Features**: Auto-import features during sync
- **Override Existing Data**: Overwrite all data on sync (vs. update only missing values)

### Client Settings (Per User)
- **Show Import Notifications**: Display notifications for imports
- **Auto-detect Extension**: Automatically detect browser extension
- **Debug Mode**: Enable detailed console logging

## How It Works

### Architecture

```
DiceCloud → Browser Extension → Foundry Module → Foundry Actor
                                       ↓
                                  Discord (via Pip Bot)
```

### Communication

The module communicates with the browser extension using `window.postMessage`:

1. Module announces itself on page load
2. Extension responds with connection confirmation
3. Module requests character list from extension
4. User selects character to import
5. Module requests full character data
6. Extension fetches from DiceCloud and returns data
7. Module creates/updates Foundry actor

### Data Mapping

DiceCloud character data is mapped to Foundry's D&D 5e system:

| DiceCloud | Foundry (D&D 5e) |
|-----------|------------------|
| Abilities | `system.abilities` |
| HP, AC | `system.attributes` |
| Skills | `system.skills` |
| Spells | `system.spells` + Items |
| Equipment | Items collection |
| Features | Features collection |

## Troubleshooting

### Extension Not Detected

**Symptoms**: "Extension not connected" error

**Solutions**:
1. Install the browser extension
2. Login to DiceCloud in the extension
3. Refresh the Foundry page
4. Click the status indicator in bottom-left to retry detection

### Import Fails

**Symptoms**: Character import fails with error

**Solutions**:
1. Check browser console for errors (F12)
2. Verify character exists in DiceCloud
3. Enable Debug Mode in settings
4. Check that D&D 5e system is installed
5. Try refreshing both extension and Foundry

### Discord Not Working

**Symptoms**: Rolls don't appear in Discord

**Solutions**:
1. Verify Pip Bot is configured in extension
2. Check Discord Integration is enabled in module settings
3. Verify actor has Discord enabled (check actor flags)
4. Ensure Pip Bot has permissions in Discord server

### Character Data Outdated

**Symptoms**: Character data doesn't match DiceCloud

**Solutions**:
1. Click **Sync with DiceCloud** on character sheet
2. Enable **Override Existing Data** for full refresh
3. Delete and re-import character for clean slate

## API for Developers

### Global API

The module exposes a global API at `game.foundcloud`:

```javascript
// Check if extension is connected
game.foundcloud.isExtensionConnected();

// Get available characters
const characters = await game.foundcloud.getAvailableCharacters();

// Import a character
const actor = await game.foundcloud.importCharacter(characterId);

// Access bridge for custom communication
game.foundcloud.bridge.sendMessage('custom-type', { data: 'value' });
```

### Hooks

The module fires Foundry hooks:

```javascript
// When character data is received
Hooks.on('foundcloud.characterDataReceived', (data) => {
  console.log('Character data:', data);
});

// When a roll is received
Hooks.on('foundcloud.rollReceived', (rollData) => {
  console.log('Roll:', rollData);
});
```

## Development

### File Structure

```
foundry-module/
├── module.json              # Module manifest
├── README.md                # This file
├── scripts/
│   ├── foundcloud.js        # Main entry point
│   ├── settings.js          # Settings registration
│   ├── extension-bridge.js  # Extension communication
│   ├── dicecloud-importer.js # Character import logic
│   └── ui.js                # UI dialogs
├── styles/
│   └── foundcloud.css       # Module styles
└── lang/
    └── en.json              # English translations
```

### Building

This module is part of the larger FoundCloud project. To build:

```bash
# In project root
npm install
npm run build
```

## Support

- **GitHub Issues**: [Report bugs](https://github.com/CarmaNayeli/foundCloud/issues)
- **Discord**: Message @Carmabella
- **Documentation**: [GitHub Wiki](https://github.com/CarmaNayeli/foundCloud/wiki)

## License

See main repository for license information.

## Credits

**Developer**: CarmaNayeli (@Carmabella)
**System**: D&D 5e by Atropos
**Platform**: Foundry VTT by Atropos
**Character Sheets**: DiceCloud by ThaumRPG

---

Made with ❤️ for the D&D community
