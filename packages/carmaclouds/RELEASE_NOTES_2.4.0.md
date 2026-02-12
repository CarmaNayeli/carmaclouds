# CarmaClouds v2.4.0 - Trigger Support & Auto Modifiers

**Release Date**: February 12, 2025

## 🎯 What's New

### DiceCloud Trigger Support
Never miss a critical hit again! CarmaClouds now automatically detects and applies DiceCloud trigger properties:

- **Champion Fighter**: Improved Critical (19-20) and Superior Critical (18-20) automatically expand your crit range
- **Artillerist Artificer**: Arcane Firearm detected (spell damage bonuses coming soon!)
- **Generic Triggers**: Unknown triggers are parsed from descriptions using pattern matching

### Automatic Roll Modifiers
Stop doing mental math! CarmaClouds now intelligently adds missing modifiers:

- **Ability Modifiers**: STR/DEX automatically added to damage rolls
- **Finesse Weapons**: Uses higher of STR or DEX
- **Proficiency to Damage**: Detects features like Hexblade's Curse, Kensei Weapons, and Divine Strike
- **Attack Rolls**: Adds proficiency + ability mod when missing

### Spell Fixes
- **Scorching Ray** and similar spells now properly detect attack rolls from spell descriptions
- No more "only damage, no attack" issues!

### Quality of Life
- **Reset UI Positions**: New button in settings to reset all draggable elements (sync button, status bar, character sheets, etc.)
- Better console logging with emoji indicators for easy debugging

## 📋 How to Use

### Trigger Support
1. Make sure your character has trigger properties in DiceCloud (e.g., Champion's "Improved Critical")
2. Sync your character from DiceCloud
3. Make attack rolls in Roll20
4. Watch for console logs: `⚡ Detected expanded crit range: 19-20`
5. Roll 19 or 20 on attack → automatic critical hit!

### Reset UI Positions
1. Open extension popup → Settings (⚙️)
2. Scroll to "Data Management"
3. Click "🔄 Reset UI Positions"
4. Confirm → All UI elements return to default positions

## 🔍 Console Debugging

Look for these emoji indicators in your browser console:
- `⚡` - Trigger processing and detection
- `💥` - Critical hit detection
- `✨` - Automatic modifier application
- `🔮` - Spell parsing

## 🐛 Known Issues

- Spell damage bonuses (Arcane Firearm) are detected but not yet applied to formulas
- Requires character re-sync to pick up trigger properties
- Generic trigger parsing may not catch unusual formatting

## 📦 Installation

### Browser Extension
- **Chrome**: Reload extension in `chrome://extensions`
- **Firefox**: Reload extension in `about:addons`

### Foundry VTT Module
- Foundry will auto-update if installed via manifest URL
- Or manually download from: `https://carmaclouds.vercel.app/foundry-module.zip`

### Owlbear Rodeo Extension
- Refresh Owlbear Rodeo page to load new version

## 🎉 Full Version Alignment

All components now at **v2.4.0**:
- ✅ CarmaClouds Chrome Extension
- ✅ CarmaClouds Firefox Extension
- ✅ FoundCloud Foundry Module
- ✅ OwlCloud Owlbear Extension

## 💬 Feedback & Support

Found a bug? Have a feature request?
- GitHub Issues: https://github.com/CarmaNayeli/carmaclouds/issues
- Discord: Carmabella

## 🙏 Special Thanks

Special thanks to all users who reported the Scorching Ray issue, requested automatic modifiers, and provided feedback on Champion Fighter crit ranges!

---

**Previous Version**: 2.3.1
**Download**: Available via Chrome Web Store, Firefox Add-ons, and Foundry VTT module manifest
