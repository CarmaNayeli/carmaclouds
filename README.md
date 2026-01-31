# CarmaClouds ☁️

**Unified cloud services for tabletop gaming platforms**

CarmaClouds is a monorepo containing multiple cloud-based integrations for DiceCloud character management across different virtual tabletop platforms.

---

## Packages

### 📦 @carmaclouds/core
**Shared utilities and types**

- Cache manager with configurable TTL
- Supabase field optimizations (reduces egress costs by 70%)
- Shared TypeScript types for characters
- Common utilities

[→ Documentation](./packages/core/README.md)

### 🦉 @carmaclouds/owlcloud
**Browser extension for DiceCloud with Owlbear Rodeo integration**

- Firefox/Chrome browser extension
- Sync DiceCloud characters to Owlbear Rodeo
- Real-time HP tracking
- Automated token updates

[→ Documentation](./packages/owlcloud/README.md)

### 🎲 @carmaclouds/rollcloud
**Discord bot for DiceCloud (formerly Pip2)**

- Discord slash commands for character management
- Roll dice from your character sheet
- HP tracking and resource management
- Spell casting integration

[→ Documentation](./packages/rollcloud/README.md)

### 🎭 @carmaclouds/foundcloud
**Foundry VTT module** *(Coming Soon)*

- Import DiceCloud characters into Foundry VTT
- Bi-directional sync
- Automated updates

[→ Documentation](./packages/foundcloud/README.md)

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Supabase account

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd carmaclouds

# Install all dependencies
npm install

# Build core package
npm run build -w @carmaclouds/core
```

### Development

```bash
# Run all packages in dev mode
npm run dev

# Or run specific package
npm run owlcloud:dev
npm run rollcloud:dev
npm run foundcloud:dev
```

---

## Architecture

```
carmaclouds/
├── packages/
│   ├── core/          # Shared utilities ✅
│   ├── owlcloud/      # Browser extension
│   ├── rollcloud/     # Discord bot
│   └── foundcloud/    # Foundry module
├── supabase/          # Edge functions
├── package.json       # Workspace configuration
└── tsconfig.base.json # Shared TypeScript config
```

### Technology Stack

- **Language:** TypeScript, JavaScript
- **Package Manager:** npm workspaces
- **Database:** Supabase (PostgreSQL)
- **Platforms:**
  - Browser Extensions (Firefox/Chrome)
  - Discord.js
  - Foundry VTT (planned)
  - Owlbear Rodeo

---

## Features

### 🚀 Performance Optimizations

- **Heavy Caching:** 85-95% reduction in database queries
- **Optimized Fields:** 70% less data transferred per query
- **Unified API:** Reduced edge function cold starts
- **Persistent Cache:** 24-hour localStorage for browser extension

### 🔐 Security

- Supabase Row Level Security (RLS)
- Secure token storage
- Session management
- Discord OAuth integration

### 📊 Monitoring

Built-in cache statistics:
```javascript
import { CacheManager } from '@carmaclouds/core';

const cache = new CacheManager({ debug: true });
console.log(cache.getStats());
// { hits: 234, misses: 45, hitRate: '83.87%', ... }
```

---

## Contributing

### Adding a New Package

1. Create directory: `packages/your-package`
2. Add package.json with workspace dependency:
```json
{
  "name": "@carmaclouds/your-package",
  "dependencies": {
    "@carmaclouds/core": "^1.0.0"
  }
}
```
3. Update root package.json workspaces (automatic with `packages/*`)

### Code Style

- Use TypeScript where possible
- Follow existing patterns in `@carmaclouds/core`
- Add JSDoc comments for public APIs
- Use the shared types from core package

---

## Deployment

### OwlCloud (Browser Extension)
```bash
cd packages/owlcloud
npm run build
# Upload to Firefox/Chrome web stores
```

### RollCloud (Discord Bot - Render)
```bash
# Set working directory to: carmaclouds/packages/rollcloud
# Build: npm install && npm run deploy-commands
# Start: npm start
```

### Supabase Edge Functions
```bash
cd carmaclouds
supabase functions deploy characters
```

---

## Environment Variables

### Supabase
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

### Discord (RollCloud)
```bash
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_client_id
GUILD_ID=your_guild_id
```

---

## Documentation

- [Migration Guide](./MIGRATION_GUIDE.md) - Move existing code to monorepo
- [Core Package](./packages/core/README.md) - Shared utilities
- [Egress Optimization](../EGRESS_OPTIMIZATION_COMPLETE.md) - Performance improvements

---

## License

MIT

---

## Credits

- **DiceCloud** - Character sheet management
- **Owlbear Rodeo** - Virtual tabletop
- **Discord.js** - Discord bot framework
- **Supabase** - Backend and database

---

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review the migration guide
