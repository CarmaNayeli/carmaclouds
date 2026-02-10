---
title: OwlCloud - DiceCloud Character Sync
description: Sync your DiceCloud V2 characters to Owlbear Rodeo with real-time cloud storage via CarmaClouds
author: Carmabella
image: https://carmaclouds.vercel.app/owlcloud-hero.png
icon: https://carmaclouds.vercel.app/owlcloud-die.png
tags:
  - character
  - integration
  - utility
manifest: https://carmaclouds.vercel.app/extension/owlbear-extension/manifest.json
learn-more: https://carmaclouds.vercel.app
---

# OwlCloud - DiceCloud Character Sync

Seamlessly sync your DiceCloud V2 characters to Owlbear Rodeo with OwlCloud, part of the CarmaClouds ecosystem.

## Features

- **One-Click Sync**: Push your complete DiceCloud character to Owlbear Rodeo instantly
- **Cloud Storage**: Characters stored securely in Supabase for access anywhere
- **Real-Time Updates**: Changes sync across devices automatically
- **Full Character Data**: Attributes, skills, saves, spells, inventory, and more
- **Unified Extension**: Works with RollCloud (Roll20) and FoundCloud (Foundry VTT)

## How to Use

### 1. Install the CarmaClouds Browser Extension

Download the CarmaClouds extension for Chrome/Edge or Firefox:
- [Chrome/Edge ZIP](https://github.com/CarmaNayeli/carmaclouds/releases/latest/download/carmaclouds-chrome.zip)
- [Firefox ZIP](https://github.com/CarmaNayeli/carmaclouds/releases/latest/download/carmaclouds-firefox.zip)

Load the extension manually (not yet on browser stores):
- **Chrome/Edge**: Go to `chrome://extensions`, enable Developer mode, click "Load unpacked"
- **Firefox**: Go to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on"

### 2. Sync from DiceCloud

1. Visit [dicecloud.com](https://dicecloud.com) and open your character
2. Click the CarmaClouds extension icon
3. Click "☁️ Sync to Cloud" in the OwlCloud tab

### 3. Push to Owlbear Rodeo

1. Open Owlbear Rodeo and join your game
2. The OwlCloud popover will appear automatically
3. Select your character and click "Push to Owlbear"
4. Your character sheet will appear as a popover in the scene

## What Gets Synced

- **Core Stats**: Abilities, saves, proficiency bonus, AC, HP, initiative
- **Skills**: All skill proficiencies and modifiers
- **Spells**: Full spell list with levels, schools, and casting details
- **Inventory**: Equipped items, weapons, and armor
- **Features & Traits**: Class features, racial traits, and special abilities
- **Background**: Character biography and personality

## Authentication

OwlCloud uses Supabase for secure cloud storage. Sign in with:
- Google Sign-In (recommended)
- Email and password

## Support

- **Website**: [carmaclouds.vercel.app](https://carmaclouds.vercel.app)
- **GitHub**: [github.com/CarmaNayeli/carmaclouds](https://github.com/CarmaNayeli/carmaclouds)
- **Issues**: [Report bugs on GitHub](https://github.com/CarmaNayeli/carmaclouds/issues)

## Open Source

OwlCloud is part of the open-source CarmaClouds project. Contributions welcome!

---

**Note**: CarmaClouds is a unified extension that also supports:
- **RollCloud**: DiceCloud → Roll20 sync
- **FoundCloud**: DiceCloud → Foundry VTT sync (in development)
