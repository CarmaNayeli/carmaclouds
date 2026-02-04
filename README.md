# CarmaClouds

**Unified DiceCloud integration for your favorite VTT platforms**

One extension. Multiple VTT platforms. Seamless character sync from DiceCloud V2 to Roll20, Owlbear Rodeo, and Foundry VTT.

## [Visit the Website →](https://carmaclouds.vercel.app)

Get started with downloads, installation guides, and documentation.

---

## What is CarmaClouds?

CarmaClouds is a browser extension that syncs your DiceCloud V2 characters to virtual tabletop platforms with a single click.

### Features

- **One Extension, Three Platforms** - RollCloud (Roll20), OwlCloud (Owlbear Rodeo), FoundCloud (Foundry VTT)
- **Seamless Sync** - Click "Sync to CarmaClouds" on any DiceCloud character page
- **Push to VTT** - Send your character data directly to your active VTT tab
- **Cloud Storage** - Characters stored in Supabase for access across devices
- **Auto-Login** - Works with Google Sign-In, username/password, or any DiceCloud login method
- **Real-time Updates** - Changes on DiceCloud instantly available in the extension

---

## Installation

### Chrome/Edge

1. Visit [carmaclouds.vercel.app](https://carmaclouds.vercel.app)
2. Download the latest CarmaClouds Chrome extension
3. Extract the ZIP file
4. Open Chrome → Extensions → Enable "Developer mode"
5. Click "Load unpacked" → Select the extracted folder
6. Done! The extension is now active

### Firefox

1. Visit [carmaclouds.vercel.app](https://carmaclouds.vercel.app)
2. Download the latest CarmaClouds Firefox add-on
3. Open Firefox → Add-ons → Install from file
4. Select the downloaded `.xpi` file
5. Done! The extension is now active

---

## Quick Start

### 1. Sync Your Character

1. Go to [dicecloud.com](https://dicecloud.com) and open any character
2. Log in to DiceCloud (if not already)
3. Click the **"Sync to CarmaClouds"** button that appears on the character page
4. Your character is now synced and ready to use!

### 2. Push to Your VTT

#### Roll20 (RollCloud)

1. Open [app.roll20.net](https://app.roll20.net) in another tab
2. Click the CarmaClouds extension icon
3. Go to the **RollCloud** tab
4. Click **"Push to Roll20"**
5. Your character appears in Roll20!

#### Owlbear Rodeo (OwlCloud)

1. Open [owlbear.rodeo](https://owlbear.rodeo) in another tab
2. Click the CarmaClouds extension icon
3. Go to the **OwlCloud** tab
4. Click **"Push to Owlbear"**
5. Your character appears in Owlbear Rodeo!

#### Foundry VTT (FoundCloud)

1. Install the FoundCloud module in Foundry VTT:
   - Manifest URL: `https://carmaclouds.vercel.app/foundry-module/module.json`
2. Click the CarmaClouds extension icon
3. Go to the **FoundCloud** tab
4. Click **"☁️ Sync to Cloud"** on any character
5. In Foundry, click **"Import from DiceCloud"** in the Actors sidebar
6. Select your character and import!

Your character appears in Foundry with stats, skills, spells, features, and inventory!

---

## Additional Projects

### Pip2 Discord Bot

Brings CarmaClouds features to Discord. Roll dice, manage characters, track initiative, and more with slash commands.

- [Add to Discord](https://discord.com/oauth2/authorize?client_id=1144752568716591286)
- [Documentation](./packages/pip/README.md)

---

## For Developers

### Development Setup

### For Developers

```bash
# Clone the repository
git clone https://github.com/CarmaNayeli/carmaclouds.git
cd carmaclouds

# Install dependencies
npm install

# Build all packages
npm run build

# Run in development mode
npm run dev
```

---

## Features

- **Real-time sync** with DiceCloud V2
- **Cross-platform** support (Discord, Owlbear Rodeo, Foundry VTT)
- **Heavy caching** for fast performance and reduced API costs
- **Session management** across devices
- **Open source** and community-driven

---

## Tech Stack

- TypeScript/JavaScript
- Node.js with npm workspaces
- Supabase (PostgreSQL + Edge Functions)
- Discord.js
- Browser Extensions (Manifest V3)
- Next.js (website)

---

## Contributing

Contributions are welcome! Please check existing issues or open a new one to discuss changes.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## Support

- **Issues:** [GitHub Issues](https://github.com/CarmaNayeli/carmaclouds/issues)
- **Website:** [carmaclouds.vercel.app](https://carmaclouds.vercel.app)
- **Discord:** If all else fails, contact @Carmabella

---

## License

MIT

---

Made with <3 for the tabletop community
