# @carmaclouds/pip 🤖

**Pip2 - Discord bot for CarmaClouds ecosystem**

Pip2 is the unified Discord bot that powers RollCloud, OwlCloud, and FoundCloud integrations. It syncs DiceCloud characters to Discord, enables dice rolling, character management, and cross-platform features.

---

## Features

- ✅ **DiceCloud Integration** - Sync and manage characters from DiceCloud
- ✅ **Discord Commands** - Comprehensive slash commands for character management
- ✅ **RollCloud Support** - Dice rolling with character stats and modifiers
- ✅ **Heavy Caching** - 15-minute TTL cache reduces Supabase egress by 80%
- ✅ **Real-time Updates** - Character HP, spell slots, resources
- ✅ **Session Management** - Discord user pairing with DiceCloud accounts
- ✅ **Owlbear Integration** - Supports OwlCloud browser extension
- ✅ **Reaction Roles** - Automated role assignment via reactions

---

## Structure

```
pip/
├── src/
│   ├── commands/           # Discord slash commands
│   │   ├── character.js    # Set active character
│   │   ├── characters.js   # List all characters
│   │   ├── sheet.js        # View character sheet
│   │   ├── roll.js         # Dice rolling with character stats
│   │   ├── cast.js         # Spell casting
│   │   ├── heal.js         # Heal character
│   │   ├── takedamage.js   # Take damage
│   │   ├── rest.js         # Rest & recovery
│   │   ├── stats.js        # Ability scores & saves
│   │   ├── spells.js       # Spell list
│   │   └── ...             # (30+ total commands)
│   │
│   ├── events/             # Discord event handlers
│   │   ├── ready.js        # Bot startup
│   │   ├── interactionCreate.js
│   │   ├── messageReactionAdd.js
│   │   └── ...
│   │
│   ├── rollcloud/          # RollCloud-specific features
│   │   ├── turnPoller.js   # Turn order tracking
│   │   └── ...
│   │
│   ├── utils/              # Utilities
│   │   ├── characterCache.js        # Character caching system
│   │   ├── characterCacheManager.js # Cache manager wrapper
│   │   ├── reactionRoleStorage.js   # Reaction role storage
│   │   └── fetch-timeout.js         # Timeout utility
│   │
│   ├── index.js            # Bot entry point
│   └── deploy-commands.js  # Command registration
│
├── package.json
├── .env.example
└── README.md
```

---

## Installation

### Prerequisites

- Node.js 18+
- Discord Bot Token ([Discord Developer Portal](https://discord.com/developers/applications))
- Supabase account (for character storage)

### Setup

```bash
# From monorepo root
cd packages/pip

# Install dependencies (or from root: npm install)
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# - DISCORD_TOKEN
# - DISCORD_CLIENT_ID
# - SUPABASE_URL
# - SUPABASE_SERVICE_KEY
```

### Deploy Commands

```bash
# Register slash commands with Discord
npm run deploy-commands
```

### Start Bot

```bash
# Development
npm run dev

# Production
npm start
```

---

## Configuration

### Environment Variables

Create a `.env` file:

```env
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_application_id
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
```

### Discord Permissions

Required bot permissions:
- Send Messages
- Embed Links
- Add Reactions
- Use Slash Commands
- Manage Roles (for reaction roles)

Invite URL:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=274877959168&scope=bot%20applications.commands
```

---

## Usage

### Character Commands

| Command | Description |
|---------|-------------|
| `/character <name>` | Set active character |
| `/characters` | List all synced characters |
| `/sheet [section]` | View character sheet |
| `/stats` | View ability scores & saves |

### Combat Commands

| Command | Description |
|---------|-------------|
| `/roll <dice>` | Roll dice (e.g., 2d6+3) |
| `/roll check:<ability>` | Make ability/skill check |
| `/takedamage <amount>` | Take damage |
| `/heal <amount>` | Heal HP |
| `/rest [long]` | Short or long rest |

### Spell Commands

| Command | Description |
|---------|-------------|
| `/spells [level]` | View spell list |
| `/cast <spell> [level]` | Cast spell (consumes slot) |

### Utility Commands

| Command | Description |
|---------|-------------|
| `/ping` | Check bot latency |
| `/help` | Show help message |
| `/changelog` | View recent updates |

---

## Caching System

Pip2 uses **heavy caching** to reduce Supabase egress costs:

### Cache Manager

Uses `@carmaclouds/core` CacheManager with Discord-specific wrappers:

```javascript
import cacheManager from './utils/characterCacheManager.js';

// Get cached character by Discord user ID
const character = cacheManager.getByDiscordUser(discordUserId);

// Store character (caches under multiple keys)
cacheManager.store(character);

// Invalidate cache
cacheManager.invalidate(characterId, discordUserId, diceCloudUserId);
```

### Cache Configuration

- **TTL:** 15 minutes (Discord commands need fresher data than browser extensions)
- **Cleanup:** Auto-cleanup every 5 minutes
- **Multi-key storage:** Characters cached by Discord ID, DiceCloud ID, and User ID
- **Hit rate:** Typically 70-85% for active users

### Cache Statistics

```javascript
const stats = cacheManager.getStats();
// {
//   size: 42,
//   hits: 156,
//   misses: 24,
//   stores: 18,
//   invalidations: 3,
//   hitRate: '86.67%',
//   expiryMinutes: 15
// }
```

---

## Optimized Field Selection

Uses `@carmaclouds/core` field sets to reduce egress:

```javascript
import {
  CHARACTER_COMBAT,  // Combat-focused fields (50-70% smaller)
  CHARACTER_SPELLS,  // Spell-focused fields
  CHARACTER_FULL,    // Full character data
  CHARACTER_LIST     // Minimal list view
} from '@carmaclouds/core';

// Example: Fetch only combat data
const response = await fetch(
  `${SUPABASE_URL}/rest/v1/clouds_characters?discord_user_id=eq.${userId}&select=${CHARACTER_COMBAT}`
);
```

**Egress savings:** 50-70% reduction by excluding unused fields

---

## Integration with Core

Pip2 uses shared utilities from `@carmaclouds/core`:

```javascript
import {
  CacheManager,           // Generic cache manager
  CHARACTER_COMBAT,       // Field selections
  CHARACTER_FULL,
  CHARACTER_SPELLS,
  PAIRING_FIELDS
} from '@carmaclouds/core';
```

### Package Dependencies

```json
{
  "dependencies": {
    "@carmaclouds/core": "^1.0.0",
    "discord.js": "^14.14.1",
    "dotenv": "^16.3.1"
  }
}
```

---

## RollCloud Features

Pip2 powers RollCloud's Discord integrations:

- **Turn Polling** - Tracks turn order in combat
- **Dice Rolling** - d20, advantage/disadvantage, character modifiers
- **Character Checks** - Ability checks, saving throws, skill checks
- **Webhook Integration** - Sends rolls to RollCloud channels

See [@carmaclouds/rollcloud](../rollcloud/README.md) for RollCloud-specific features.

---

## Database Schema

### clouds_characters Table

Key fields Pip2 uses:

```typescript
{
  id: UUID,
  dicecloud_character_id: string,
  character_name: string,
  discord_user_id: string,
  user_id_dicecloud: string,
  is_active: boolean,
  hit_points: { current: number, max: number },
  spell_slots: Record<string, { current: number, max: number }>,
  attributes: Record<string, number>,
  // ... (see @carmaclouds/core for full schema)
}
```

### clouds_discord_links Table

Discord user pairing:

```typescript
{
  id: UUID,
  discord_user_id: string,
  dicecloud_user_id: string,
  pairing_code: string,
  status: 'pending' | 'active' | 'expired',
  created_at: timestamp,
  expires_at: timestamp
}
```

---

## Development

### Adding New Commands

1. Create command file in `src/commands/`:

```javascript
// src/commands/mycommand.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { CHARACTER_COMBAT } from '@carmaclouds/core';

export default {
  data: new SlashCommandBuilder()
    .setName('mycommand')
    .setDescription('My command description'),

  async execute(interaction) {
    await interaction.deferReply();
    // Command logic...
    await interaction.editReply({ content: 'Done!' });
  }
};
```

2. Deploy commands:

```bash
npm run deploy-commands
```

3. Restart bot

### Using Optimized Field Sets

Always use optimized field selections from `@carmaclouds/core`:

```javascript
// ❌ BAD - Fetches all fields including 50-200KB raw_dicecloud_data
const query = `${SUPABASE_URL}/rest/v1/clouds_characters?discord_user_id=eq.${userId}&select=*`;

// ✅ GOOD - Only fetch needed fields (85% smaller)
import { CHARACTER_COMBAT } from '@carmaclouds/core';
const query = `${SUPABASE_URL}/rest/v1/clouds_characters?discord_user_id=eq.${userId}&select=${CHARACTER_COMBAT}`;
```

### Testing

```bash
# Test command deployment
npm run deploy-commands

# Check bot connection
npm run dev
# Use /ping in Discord to verify
```

---

## Deployment

### Production (Render, Railway, etc.)

```bash
# Build command (if needed)
npm run build

# Start command
npm start
```

### Environment Variables

Set in deployment platform:
- `DISCORD_TOKEN`
- `DISCORD_CLIENT_ID`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

### Auto-restart

Recommended: Use PM2 or platform's auto-restart feature

---

## Troubleshooting

### Commands Not Showing

```bash
# Re-deploy commands
npm run deploy-commands

# Wait 1-2 minutes for Discord to propagate
```

### Database Connection Issues

```bash
# Test with /testdbconnection command in Discord
# Check Supabase URL and service key in .env
```

### Cache Issues

```javascript
// Clear cache for a user
cacheManager.invalidate(null, discordUserId, null);

// Clear all cache
cacheManager.clear();
```

### High Egress Costs

1. Verify optimized field selections are used
2. Check cache hit rate: `cacheManager.getStats()`
3. Ensure 15-minute cache TTL is active
4. Review Supabase dashboard for query patterns

---

## Related Packages

- [@carmaclouds/core](../core/README.md) - Shared utilities & types
- [@carmaclouds/rollcloud](../rollcloud/README.md) - RollCloud features
- [@carmaclouds/owlcloud](../owlcloud/README.md) - Browser extension
- [@carmaclouds/foundcloud](../foundcloud/README.md) - Foundry VTT module

---

## License

MIT

---

## Contributing

When making changes:

1. Follow existing code patterns
2. Use `@carmaclouds/core` for shared utilities
3. Use optimized field selections (avoid `select=*`)
4. Test with `npm run deploy-commands` before committing
5. Update this README if adding new features
