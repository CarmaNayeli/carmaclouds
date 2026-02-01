# FoundCloud: DiceCloud + VTT + Discord Integration

A browser extension that bridges DiceCloud V2 characters to your VTT with Discord turn notifications via Pip 2.

**Version 1.2.3**

## Platform Support

**✅ Currently Supported:**
- **Roll20**: Full support with all features

**🚧 In Development:**
- **Foundry VTT**: Planned hybrid approach (browser extension + companion Foundry module)
  - See [FOUNDRY_MODULE_AUDIT.md](./FOUNDRY_MODULE_AUDIT.md) for detailed roadmap

> **Note:** Despite the "FoundCloud" branding, Foundry VTT support is not yet implemented. The extension currently only works with Roll20. Foundry support is planned using a hybrid architecture where the browser extension handles DiceCloud sync and a companion Foundry module handles VTT integration.

## Features

### Character Import
- **API-Powered**: Uses DiceCloud's official REST API to get your character data
- **Smart Parsing**: Leverages DiceCloud's standardized variable names
- **Secure Authentication**: Login with DiceCloud credentials (stored locally)
- **Auto-Connect**: Automatically extracts authentication token from logged-in session
- **One-Click Export**: Extract character data with a single click
- **Data Persistence**: Character data stored locally between sessions

### Interactive Character Sheet & Dice Rolling
- **Character Sheet Overlay**: Interactive overlay displays character data on your VTT
- **Click-to-Roll**: Click any ability, skill, or save to roll dice
- **Direct VTT Integration**: Rolls posted directly to VTT chat
- **Roll Options**: Support for advantage/disadvantage and custom modifiers
- **Character Attribution**: Rolls appear under character's name
- **Guidance & Bless**: Automatic +1d4 for ability checks and attacks/saves

### GM Combat Management
- **GM Initiative Tracker**: Combat management with automatic turn detection
- **Action Economy Tracking**: Automatic action/bonus action/reaction tracking
- **Turn-Based Visual Indicators**: Action economy lights up for current character
- **D&D 5e Rules Compliance**: Enforces one reaction per round, proper tracking
- **Hidden Rolls**: GM Mode hides rolls until revealed
- **Player Overview**: Track party member HP, AC, and conditions
- **Discord Integration**: Real-time turn and combat updates in Discord

### Discord Integration
- **Real-Time Combat Updates**: Turn changes and action economy updates sent to Discord
- **Pip Bot Connection**: Pip Bot handles Discord integration
- **One-Click Setup**: Generate connection code in extension, enter in Discord
- **Web Dashboard**: Manage integration and view status
- **Server Management**: Support for multiple Discord servers
- **Combat Notifications**: Automatic turn announcements and action economy status

### D&D 5e Mechanics
- **Spell Edge Cases**: 200+ spells with special handling
- **Class Features**: Lucky feat, Lay on Hands, action surge, and more
- **Racial Features**: Special ability handling
- **Combat Maneuvers**: Battle actions and resource tracking
- **Metamagic Detection**: Sorcery points and resource tracking

### Lucky Feat System
- **Lucky Feat Integration**: Manual action button with modal interface
- **Character State Preservation**: Cache system prevents resource refreshing
- **Resource Management**: Lucky points tracking without duplication

### Effects & Buffs System
- **Buffs & Debuffs**: System for managing active effects
- **Auto-Apply**: Automatic modifiers for rolls based on active effects
- **Effect Persistence**: Effects maintained across character switching

## Foundry VTT Roadmap

FoundCloud is adopting a **hybrid architecture** for Foundry VTT support:

### Architecture Decision: Hybrid Approach

**Component 1: Browser Extension** (existing)
- Handles DiceCloud authentication and character data sync
- Stores character data in browser storage
- Provides API for Foundry module to access

**Component 2: Foundry Module** (in development)
- Native Foundry VTT module installed in Foundry
- Reads character data from browser extension
- Uses Foundry's native API for rolls, chat, and character sheets
- Full integration with Foundry's actor system

### Implementation Phases

**Phase 1: Research & Planning** (Current)
- ✅ Architectural decision made (hybrid approach)
- ⏳ Foundry API research and prototyping
- ⏳ Technical specification creation

**Phase 2: Minimal Viable Integration** (2-3 weeks)
- Browser extension enhancement for Foundry communication
- Basic Foundry module with DiceCloud data import
- Simple roll posting to Foundry chat

**Phase 3: Character Integration** (2-3 weeks)
- Character data mapping to Foundry actors
- Character sheet overlay in Foundry
- Click-to-roll functionality

**Phase 4: Advanced Features** (3-4 weeks)
- Spell casting and slot tracking
- Action economy and combat tracker
- Effects and buffs system
- Resource management

**Phase 5: Discord Integration** (1-2 weeks)
- Pip Bot updates for Foundry
- Turn notifications and combat updates

**Estimated Timeline:** 8-10 weeks for full feature parity with Roll20

For detailed technical analysis, see [FOUNDRY_MODULE_AUDIT.md](./FOUNDRY_MODULE_AUDIT.md)

## Installation

### Chrome / Edge / Brave
1. Clone or download this repository
2. Open `chrome://extensions/` (or `edge://extensions/`)
3. Enable "Developer mode" toggle
4. Click "Load unpacked" and select the project folder
5. The FoundCloud icon appears in your toolbar

### Firefox
1. Clone or download this repository
2. Open `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select any file from the project folder

## Usage

### First Time Setup

1. **Login to DiceCloud**
   - Click the extension icon in your browser toolbar
   - Enter your DiceCloud username/email and password
   - Click "Login to DiceCloud"
   - Your API token will be stored securely in the browser

**Security Note**: Your password is sent directly to DiceCloud's API and is not stored. Only the API token is saved locally.

### Discord Integration Setup

1. **Add Pip Bot to Discord**: Click "Discord Integration" in the FoundCloud extension and follow the invite link
2. **Generate Connection Code**: In the extension, click "Setup Discord Integration" to get a 6-character code
3. **Connect in Discord**: Type `/rollcloud [your-code]` in your Discord server
4. **Verify**: Extension shows "Connected to Discord" status

## Project Structure

```
src/
  background.js          - Service worker / background script
  popup-sheet.html/js    - Character sheet UI
  common/                - Shared utilities (debug, polyfill, theme)
  content/               - Content scripts (dicecloud, roll20, overlay)
                           Note: roll20.js is currently the only VTT integration
  lib/                   - Libraries (supabase client, DDP client)
  modules/               - D&D mechanics (actions, spells, class features)
  popup/                 - Extension popup UI
  options/               - Welcome/onboarding page
Pip2/                    - Discord bot (Pip Bot)
installer/               - Desktop installer (Electron)
experimental/            - Two-way sync (DDP protocol)
supabase/                - Database schema & migrations
scripts/                 - Build scripts
foundry-module/          - (Planned) Companion Foundry VTT module
```

## Building

```bash
npm install

# Full build
npm run build

# Extension only
npm run build:extension

# Signed build
npm run build:signed
```

## Troubleshooting

### DiceCloud Issues
- **"Not logged in to DiceCloud"**: Click extension icon and login again
- **"API token expired"**: Your session expired; login again via the popup

### Roll20 Issues
- **Rolls not appearing in Roll20**: Ensure Roll20 tab is open and chat is visible
- **Character overlay not showing**: Refresh the Roll20 page after loading your character

### Discord Integration Issues
- **Discord bot not responding**: Ensure Pip Bot is online and has message permissions
- **Invalid pairing code**: Generate a new code (codes expire after 5 minutes)

### Foundry VTT
- **Foundry support**: Not yet available - see roadmap above

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Try clearing the extension data and re-extracting
3. Open an issue on GitHub
4. **Message me on Discord @Carmabella**

---

Made with love for the D&D community
