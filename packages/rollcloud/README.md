# RollCloud

**Browser extension for DiceCloud character sheet management**

Enhance your DiceCloud experience with advanced character management features and Discord integration via Pip2.

---

## Features

- Browser extension for DiceCloud character management
- Enhanced character sheet interface
- Roll dice from your character sheets
- Track HP, spell slots, and resources
- Make skill checks and saving throws
- Attack rolls with automatic modifiers
- Character switching and management
- Discord integration via Pip2 bot

---

## Installation

### Browser Extension

Install from [Chrome Web Store](#) or [Firefox Add-ons](#), or visit [carmaclouds.vercel.app](https://carmaclouds.vercel.app)

### Discord Integration

RollCloud works with [Pip2](../pip/README.md), the Discord bot for CarmaClouds. [Invite Pip2 to your server](https://discord.com/oauth2/authorize?client_id=1144752568716591286) for Discord slash commands.

### Build from Source

```bash
# Clone the repository
git clone https://github.com/CarmaNayeli/carmaclouds.git
cd carmaclouds/packages/rollcloud

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Discord token and Supabase credentials

# Deploy slash commands
npm run deploy-commands

# Start the bot
npm start
```

---

## Discord Commands (via Pip2)

RollCloud integrates with Discord through the Pip2 bot. Here are the available commands:

### Character Management

- `/character` - View and switch active characters
- `/setcharacter` - Set your active character

### Dice Rolling

- `/roll [dice]` - Roll dice (e.g., 2d6+3)
- `/check [skill]` - Make a skill check
- `/save [ability]` - Make a saving throw
- `/attack [weapon]` - Roll an attack

### HP & Resources

- `/takedamage [amount]` - Reduce HP
- `/heal [amount]` - Restore HP
- `/rest [type]` - Short or long rest

---

## Development

### Project Structure

```
rollcloud/
├── src/
│   ├── commands/      # Slash command definitions
│   ├── events/        # Discord event handlers
│   ├── utils/         # Utility functions
│   └── index.js       # Bot entry point
├── manifest.json      # Browser extension manifest
├── package.json
└── README.md
```

### Environment Variables

```bash
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_client_id
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
```

### Load Extension in Browser

After building, load the extension:

**Chrome:**
1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` directory

**Firefox:**
1. Go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select the `manifest.json` file in the `dist/` directory

---

## Browser Extension

RollCloud includes a browser extension for enhanced functionality on DiceCloud and other platforms.

### Build Extension

```bash
npm run build
```

This creates the extension in the `dist/` directory, ready to load in Chrome/Firefox.

---

## Integration with CarmaClouds

RollCloud is part of the CarmaClouds ecosystem:

- Uses `@carmaclouds/core` for caching and Supabase utilities
- Shares character data with OwlCloud and FoundCloud
- Syncs with DiceCloud V2 characters
- Cross-platform character management

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
