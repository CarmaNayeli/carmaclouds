# CarmaClouds

**Cloud services for tabletop gaming**

Bring your DiceCloud characters to Discord, Owlbear Rodeo, and Foundry VTT with seamless integrations.

## [Visit the Dashboard →](https://carmaclouds.vercel.app)

Get started with downloads, installation guides, and documentation for all CarmaClouds projects.

---

## Projects

### 🦉 OwlCloud
**Browser extension + Owlbear Rodeo integration**

View and manage your DiceCloud characters directly in Owlbear Rodeo. Real-time HP tracking, dice rolling, and character sheet integration.

- [Chrome Extension](#) | [Firefox Add-on](#)
- [Documentation](./packages/owlcloud/README.md)

### 🎲 RollCloud
**Browser extension for character sheet management**

Manage your DiceCloud characters with enhanced features and Discord integration. Track HP, roll dice, and manage resources across platforms.

- [Chrome Extension](#) | [Firefox Add-on](#)
- [Documentation](./packages/rollcloud/README.md)

### 🎭 FoundCloud
**Foundry VTT module** *(Coming Soon)*

Import and sync DiceCloud characters into Foundry VTT with automated updates.

- [Documentation](./packages/foundcloud/README.md)

### 🤖 Pip2
**Discord integration bot for CarmaClouds**

Brings all CarmaClouds features to Discord. Roll dice, manage characters, track initiative, and more with simple slash commands.

- [Add to Discord](https://discord.com/oauth2/authorize?client_id=1144752568716591286)
- [Documentation](./packages/pip/README.md)

---

## Installation

### For Users

Visit [carmaclouds.vercel.app](https://carmaclouds.vercel.app) for installation instructions and downloads.

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
