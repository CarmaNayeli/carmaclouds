# CarmaClouds Changelog

All notable changes to the CarmaClouds extension suite will be documented in this file.

## [2.4.0] - 2025-02-12

### 🎯 Major Features

#### DiceCloud Trigger Support
- **Expanded Critical Hit Range**: Automatically detects and applies Champion Fighter's Improved Critical (19-20) and Superior Critical (18-20) features
- **Spell Damage Bonuses**: Detects Artillerist's Arcane Firearm (+1d8 to spell damage) and similar trigger-based bonuses
- **Generic Trigger Parsing**: Unknown triggers are parsed via pattern matching in descriptions, detecting crit ranges like "19 or 20" and damage bonuses like "1d8"
- **Edge Case System**: New edge case database for handling special class features that use DiceCloud's trigger system
- Added comprehensive console logging for debugging trigger detection (`⚡` emoji markers)

#### Automatic Roll Modifiers
- **Ability Modifiers**: Automatically adds appropriate ability modifier (STR/DEX) to damage rolls that are missing them
- **Proficiency Bonus**: Detects class features that add proficiency to damage (Hexblade's Curse, Kensei Weapons, Divine Strike, etc.) and applies them automatically
- **Attack Roll Modifiers**: Applies proficiency bonus and ability modifiers to attack rolls when missing
- **Finesse Weapon Detection**: Automatically uses the higher of STR or DEX for finesse weapons

### ✨ Enhancements

#### Spell Improvements
- **Description-Based Attack Detection**: Spells like Scorching Ray that only mention "ranged spell attack" in their description (not as a child property) now properly generate attack roll buttons
- Detects both "ranged spell attack" and "melee spell attack" patterns in spell descriptions and summaries

#### User Interface
- **Reset UI Positions Button**: Added button in extension settings to reset all draggable UI element positions (DiceCloud sync button, Roll20 status bar, character sheets, GM mode popup)
- Resets both localStorage data AND visual transform styles for complete position reset
- Confirmation dialog shows exactly which elements will be reset

### 🔧 Technical Improvements

#### Data Parsing
- Added trigger property extraction to `parseForRollCloud()` function
- Triggers are now included in character data with `triggers` array
- All trigger properties logged with name, condition, description, and tags for debugging

#### Roll Detection
- Enhanced critical hit detection to support expanded crit ranges (18-20, 19-20, natural 20)
- Critical hit flags now include the actual roll value for debugging
- Logs distinguish between "Natural 20" and "Expanded Crit (19)" or "Expanded Crit (18)"
- Modified `observeNextRollResult()` to accept optional `expandedCritRange` parameter

#### Edge Cases
- New Artificer section in edge case database with features: Arcane Firearm, Infuse Item, Flash of Genius, Magic Item Adept, Spell Storing Item
- Enhanced Fighter edge cases with Improved Critical and Superior Critical
- `processTriggers()` function handles both known edge cases and generic pattern matching

### 📝 Code Quality
- Added `hasProficiencyToDamageFeature()` helper function to check for special damage features
- Improved debug logging throughout with emoji indicators for easy console filtering
- Better error handling for missing character data during roll processing

### 🐛 Bug Fixes
- Fixed Scorching Ray and similar spells not showing attack roll buttons
- Fixed UI position reset only clearing localStorage but not visually moving elements back
- Fixed damage rolls missing ability modifiers when formulas don't include them
- Fixed critical hits not being detected for expanded crit ranges

### 📦 Version Updates
- CarmaClouds Chrome Extension (MV3): 2.3.1 → 2.4.0
- CarmaClouds Firefox Extension (MV2): 2.3.1 → 2.4.0
- FoundCloud Foundry Module: 2.3.2 → 2.4.0
- OwlCloud Owlbear Extension: 2.1.0 → 2.4.0

### 🔍 Known Limitations
- Spell damage bonuses (Arcane Firearm) are detected but not yet automatically applied to damage formulas (TODO)
- Generic trigger parsing relies on pattern matching and may not catch all edge cases
- Requires character re-sync from DiceCloud to pick up trigger properties

---

## [2.3.1] - Previous Release
Previous stable release before trigger support.

---

## Version Format
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

### Categories
- **Major Features**: New capabilities and significant additions
- **Enhancements**: Improvements to existing features
- **Technical Improvements**: Under-the-hood improvements
- **Code Quality**: Refactoring and code organization
- **Bug Fixes**: Fixed issues
- **Version Updates**: Component version tracking
- **Known Limitations**: Current known issues or TODOs
