# RollCloud

**Discord bot for DiceCloud character management**

Access your DiceCloud characters, roll dice, and track HP directly from Discord with slash commands.

---

## Features

- Roll dice from your DiceCloud character sheets
- Track HP, spell slots, and resources
- Make skill checks and saving throws
- Attack rolls with automatic modifiers
- Character switching and management
- Discord server integration

---

## Installation

### Add to Discord

[Invite RollCloud to your server](#) or visit [carmaclouds.vercel.app](https://carmaclouds.vercel.app)

### Self-Host

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

## Commands

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

### Deployment

RollCloud can be deployed to any Node.js hosting platform:

- **Render:** Set working directory to `carmaclouds/packages/rollcloud`
- **Railway:** Use `npm start` as the start command
- **Heroku:** Add Procfile with `worker: npm start`

Make sure to deploy slash commands before starting:
```bash
npm run deploy-commands
```

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
