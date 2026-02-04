# FoundCloud vs RollCloud Feature Comparison

## Core Features (Both Have)

### Character Header
- ✅ Character name display
- ✅ Class, Level, Race, Hit Dice
- ✅ AC, Speed, Proficiency
- ✅ Death Saves
- ✅ Inspiration
- ✅ HP (current/max/temp)
- ✅ Initiative

### Combat & Actions
- ✅ Rest buttons (Short/Long)
- ✅ Advantage/Normal/Disadvantage toggle
- ✅ Action economy tracker (Action, Bonus, Movement, Reaction)
- ✅ Turn/Round reset buttons
- ✅ Concentration tracking with drop button
- ✅ Conditions manager (20+ conditions)

### Character Stats
- ✅ Abilities grid (STR, DEX, CON, INT, WIS, CHA)
- ✅ Saving throws with proficiency indicators
- ✅ Skills with proficiency/expertise indicators

### Resources & Spells
- ✅ Resources section with use/restore
- ✅ Spell slots grid (levels 1-9)
- ✅ Spells section with filters:
  - Level filter (Cantrips, 1st-9th)
  - Category filter (Damage, Healing, Utility)
  - Casting time filter (Action, Bonus, Reaction)
- ✅ Concentration tags
- ✅ Ritual tags

### Actions & Attacks
- ✅ Actions section with filters:
  - Action type filter (Action, Bonus, Reaction, Free)
  - Category filter (Damage, Healing, Utility)
- ✅ Attack rolls
- ✅ Damage rolls
- ✅ Action descriptions (expandable)

### Inventory
- ✅ Inventory section with filters:
  - All items
  - Equipped
  - Attuned
  - Containers
- ✅ Search functionality

### UI Features
- ✅ Theme switcher (Light/Dark)
- ✅ Collapsible sections
- ✅ Search bars for actions, spells, inventory
- ✅ Settings button
- ✅ Close button

## RollCloud-Specific Features (Roll20 Only)

### Roll20 Integration
- ❌ **GM Mode toggle** - Opens GM panel on Roll20 page
- ❌ **Share with GM button** - Shares character with GM in Roll20
- ❌ **Status Bar button** - Opens status bar overlay on Roll20 page
- ❌ **Color picker** - Changes Roll20 notification colors
- ❌ **Character tabs** - Multiple characters in one popup window (Roll20 specific)

### Roll20 Specific Features
- ❌ **Companions section** - Displays companion creatures (RollCloud has this, FoundCloud doesn't explicitly show it yet)
- ❌ **Feline Agility button** - Race-specific feature for Tabaxi (Roll20 specific)

## FoundCloud-Specific Features (Foundry Only)

### Foundry Integration
- ✅ **Native Foundry sheet** - Registered as ActorSheet
- ✅ **Foundry roll system** - Uses Foundry's native dice roller
- ✅ **Token integration** - Syncs with character tokens
- ✅ **Combat tracker integration** - Works with Foundry combat
- ✅ **Journal integration** - Can link to journal entries
- ✅ **Drag-and-drop support** - Native Foundry item management

### Current FoundCloud Implementation Issues
- ⚠️ **Extends D&D 5e base sheet** - Unnecessary complexity
- ⚠️ **Different structure than RollCloud** - Hard to maintain in sync
- ⚠️ **Missing companions section** - Should add this

## Features to Add to FoundCloud

1. **Companions section** - Add explicit companions display like RollCloud
2. **Simplify architecture** - Remove D&D 5e base sheet dependency
3. **Match RollCloud structure exactly** - Same HTML/CSS with orange theme
4. **Keep Foundry-specific integrations** - Roll system, token sync, etc.

## Features NOT to Port (Platform-Specific)

### Don't Port to FoundCloud (Roll20 Specific)
- GM Mode toggle (Roll20 page manipulation)
- Share with GM (Roll20 API)
- Status Bar (Roll20 overlay)
- Color picker (Roll20 notifications)
- Character tabs (Foundry has separate sheets)
- Feline Agility button (handled by D&D 5e system)

### Don't Port to RollCloud (Foundry Specific)
- Token integration
- Combat tracker integration
- Journal integration
- Native Foundry drag-and-drop

## Conclusion

**RollCloud and FoundCloud should have identical UI/UX**, just with:
- Different colors (Pink vs Orange)
- Different platform integrations (Roll20 vs Foundry)
- Same core features and layout

**The only feature FoundCloud is missing from RollCloud:**
- **Companions section** - Should be added

**The simplification plan:**
1. Remove D&D 5e base sheet dependency
2. Match RollCloud's HTML structure exactly
3. Use orange theme instead of pink
4. Keep Foundry-specific roll/token integrations
5. Add companions section
6. Future updates: copy RollCloud changes, swap colors
