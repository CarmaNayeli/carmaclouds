# FoundCloud Custom Character Sheet - Status & Enhancement Plan

## Current Implementation Status

### ✅ Fully Functional Features

#### Template Structure (`foundcloud-sheet.hbs`)
- **Systems Bar**: Theme switcher (light/dark), character name, settings, close button
- **Character Header**:
  - Layer 1: Class, Level, Race, Hit Dice
  - Layer 2: AC, Speed, Proficiency, Death Saves, Inspiration
  - Layer 3: HP (current/max/temp), Initiative
  - Layer 4: Rest buttons (Short/Long)
  - Advantage/Normal/Disadvantage toggle
- **Combat Section**:
  - Action Economy tracker (Action, Bonus, Movement, Reaction)
  - Turn/Round reset buttons
  - Concentration tracking with drop button
  - Conditions manager (20+ conditions with icons)
- **Main Content Area**:
  - Resources grid with use/restore buttons
  - Spell slots grid (levels 1-9)
  - Abilities grid (all 6 abilities with modifiers)
  - Saving throws (with proficiency indicators)
  - Skills (with proficiency/expertise indicators)
  - Actions & Attacks with filters (type, category)
  - Spells with multi-level filters (level, category, casting time)
  - Inventory with filters (equipped, attuned, containers)

#### Event Handlers (`foundcloud-sheet.js`)
All event handlers are fully implemented:
- HP modification (click for dialog, right-click for quick -1)
- Initiative rolls
- Short/long rest
- Advantage state management
- Action economy toggles
- Concentration dropping
- Condition add/remove
- Death save rolls
- Inspiration toggle
- Ability/Save/Skill rolls with advantage support
- Spell slot use/restore
- Resource tracking
- Attack/damage rolls
- Spell casting
- Search functionality (actions, spells, inventory)
- Filter system (multiple filter types)
- Section collapsing
- Inventory management (equip, edit, delete)

#### Styling (`foundcloud-sheet.css`)
- Complete CSS with theming support
- Dark theme (default)
- Light theme
- CSS variables for easy customization
- Responsive design
- Card-based layouts
- Hover effects
- Color-coded sections (spells, actions, resources)

### 🎯 Enhancement Opportunities

#### 1. Visual Polish
- [ ] Add character portrait display
- [ ] Enhance card animations and transitions
- [ ] Add more visual feedback for interactions
- [ ] Improve mobile/small screen responsiveness
- [ ] Add custom icons for abilities and skills
- [ ] Enhance spell school color coding
- [ ] Add rarity colors for items

#### 2. Advanced Features
- [ ] Drag-and-drop spell preparation
- [ ] Quick roll buttons (shift-click for advantage, ctrl-click for disadvantage)
- [ ] Macro support for common actions
- [ ] Custom resource tracking (Ki points, Sorcery points, etc.)
- [ ] Spell slot conversion (Warlock pact magic)
- [ ] Wild Shape tracker
- [ ] Class-specific features (Rage, Bardic Inspiration, etc.)
- [ ] Companion/familiar management
- [ ] Vehicle/mount stats

#### 3. Quality of Life
- [ ] Collapsible sections with saved state
- [ ] Customizable section order
- [ ] Favorites/pinned spells and actions
- [ ] Recent rolls history
- [ ] Quick notes section
- [ ] Encumbrance calculator
- [ ] Currency tracker
- [ ] Attunement slot tracker
- [ ] Prepared spell counter

#### 4. Integration Features
- [ ] Better DiceCloud sync indicators
- [ ] Auto-update on character changes
- [ ] Export character data
- [ ] Import from other sources
- [ ] Share sheet configuration
- [ ] Template presets for different classes

#### 5. Combat Enhancements
- [ ] Turn timer
- [ ] Combat log
- [ ] Damage history
- [ ] Healing received tracker
- [ ] Legendary actions tracker
- [ ] Lair actions display
- [ ] Initiative modifier quick adjust

#### 6. Spell Enhancements
- [ ] Spell preparation interface
- [ ] Ritual casting indicator
- [ ] Spell component tracker
- [ ] Spell scroll management
- [ ] Upcast level selector
- [ ] Concentration save calculator

#### 7. Performance
- [ ] Optimize re-renders
- [ ] Lazy load sections
- [ ] Cache computed values
- [ ] Debounce search inputs
- [ ] Virtual scrolling for large lists

## Comparison to RollCloud

### RollCloud Features (Roll20 Custom Sheet)
- Full character sheet overlay in Roll20
- Real-time sync with DiceCloud
- Custom UI with tabs and sections
- Spell management with filters
- Action tracking
- Resource management
- Inventory system
- Theme support

### FoundCloud Features (Current)
✅ All RollCloud core features
✅ Plus additional Foundry-specific features:
  - Native Foundry integration
  - D&D 5e system compatibility
  - Drag-and-drop support
  - Foundry roll system
  - Combat tracker integration
  - Token integration
  - Journal integration

### FoundCloud Advantages
1. **Native Foundry Integration**: Works seamlessly with Foundry's systems
2. **Better Performance**: No iframe/overlay needed
3. **More Features**: Action economy, concentration tracking, conditions
4. **Extensible**: Can be enhanced with Foundry modules
5. **Multi-user**: Works in multiplayer games
6. **Token Integration**: Syncs with character tokens

## Recommended Next Steps

### Phase 1: Visual Polish (Quick Wins)
1. Add character portrait to header
2. Enhance hover effects and animations
3. Add loading states for async operations
4. Improve mobile responsiveness

### Phase 2: Quality of Life
1. Add collapsible sections with state persistence
2. Implement favorites/pinned items
3. Add quick notes section
4. Improve search with fuzzy matching

### Phase 3: Advanced Features
1. Class-specific resource tracking
2. Spell preparation interface
3. Macro system for common actions
4. Companion management

### Phase 4: Integration
1. Enhanced DiceCloud sync
2. Character export/import
3. Sheet configuration presets
4. Template system

## Technical Notes

### Architecture
- Extends `ActorSheet5eCharacter` from D&D 5e system
- Uses Handlebars templates
- CSS variables for theming
- Event-driven architecture
- State management in sheet class

### Compatibility
- Foundry VTT v11+
- D&D 5e system v3.0+
- Works with existing actors
- Optional sheet (doesn't replace default)

### File Structure
```
foundry-module/
├── templates/
│   └── foundcloud-sheet.hbs (448 lines)
├── scripts/
│   ├── foundcloud-sheet.js (1051 lines)
│   ├── foundcloud.js (294 lines)
│   ├── settings.js
│   ├── ui.js
│   ├── supabase-bridge.js
│   └── dicecloud-importer.js
└── styles/
    ├── foundcloud-sheet.css (1033 lines)
    └── foundcloud.css
```

## Conclusion

The FoundCloud custom character sheet is **already fully functional** and feature-complete. It matches or exceeds RollCloud's capabilities while providing native Foundry integration. The sheet is production-ready and can be used immediately.

Enhancement work should focus on:
1. Visual polish and UX improvements
2. Class-specific features
3. Advanced quality-of-life features
4. Performance optimizations

The foundation is solid and well-architected for future expansion.
