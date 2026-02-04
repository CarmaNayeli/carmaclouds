# FoundCloud Custom Sheet Enhancement Roadmap

## Quick Wins (1-2 hours each)

### 1. Character Portrait Display
**Priority**: High  
**Effort**: Low  
**Impact**: High visual improvement

Add character portrait to the header section, similar to OwlCloud's popover.

**Changes needed**:
- Add portrait image element to template
- Style portrait with circular frame and border
- Position next to character name
- Handle missing portrait gracefully

### 2. Enhanced Hover Effects
**Priority**: Medium  
**Effort**: Low  
**Impact**: Better UX

Improve visual feedback on interactive elements.

**Changes needed**:
- Add smooth transitions to all clickable cards
- Enhance button hover states
- Add tooltips with more detailed information
- Scale effects on spell/action cards

### 3. Collapsible Sections with State Persistence
**Priority**: High  
**Effort**: Medium  
**Impact**: Better organization for large character sheets

Allow users to collapse sections and remember their preferences.

**Changes needed**:
- Add collapse/expand icons to section headers
- Store collapsed state in actor flags
- Animate section collapse/expand
- Default collapsed state for less-used sections

### 4. Quick Roll Modifiers
**Priority**: High  
**Effort**: Medium  
**Impact**: Faster gameplay

Support keyboard modifiers for quick advantage/disadvantage rolls.

**Changes needed**:
- Shift+click = advantage
- Ctrl+click = disadvantage  
- Alt+click = roll twice (for comparison)
- Update all roll handlers to check for modifier keys

### 5. Favorites/Pinned Items
**Priority**: Medium  
**Effort**: Medium  
**Impact**: Quick access to commonly used abilities

Pin favorite spells, actions, and items to the top.

**Changes needed**:
- Add star icon to spell/action cards
- Store favorites in actor flags
- Create "Favorites" section at top
- Filter favorites from main lists

## Medium Enhancements (3-5 hours each)

### 6. Class-Specific Resource Tracking
**Priority**: High  
**Effort**: High  
**Impact**: Better class support

Automatic tracking for class-specific resources.

**Features**:
- Barbarian: Rage counter
- Bard: Bardic Inspiration
- Cleric: Channel Divinity
- Druid: Wild Shape
- Fighter: Action Surge, Second Wind
- Monk: Ki Points
- Paladin: Lay on Hands
- Ranger: Hunter's Mark tracking
- Rogue: Sneak Attack indicator
- Sorcerer: Sorcery Points, Metamagic
- Warlock: Pact Magic, Invocations
- Wizard: Arcane Recovery

### 7. Spell Preparation Interface
**Priority**: High  
**Effort**: High  
**Impact**: Better spell management

Visual interface for preparing spells.

**Features**:
- Drag-and-drop spell preparation
- Visual indicator of prepared vs known spells
- Preparation limit counter
- Quick prepare/unprepare buttons
- Filter by preparation status

### 8. Combat Log & History
**Priority**: Medium  
**Effort**: Medium  
**Impact**: Better combat tracking

Track rolls and actions during combat.

**Features**:
- Recent rolls history (last 10)
- Damage taken/healed tracker
- Action history for current combat
- Clear on combat end
- Export combat log

### 9. Encumbrance & Currency Tracker
**Priority**: Low  
**Effort**: Low  
**Impact**: Better inventory management

Visual weight and currency tracking.

**Features**:
- Weight bar with capacity
- Currency converter
- Encumbrance status indicator
- Quick add/remove currency

### 10. Macro System
**Priority**: Medium  
**Effort**: High  
**Impact**: Power user feature

Create custom macros for common actions.

**Features**:
- Macro bar at top of sheet
- Drag actions/spells to create macros
- Custom macro editor
- Share macros between characters

## Advanced Features (5+ hours each)

### 11. Companion/Familiar Management
**Priority**: Medium  
**Effort**: High  
**Impact**: Better summoner support

Manage summoned creatures and companions.

**Features**:
- Quick summon interface
- Companion stat blocks
- HP tracking for companions
- Action sharing with companion
- Multiple companion support

### 12. Spell Slot Conversion
**Priority**: Medium  
**Effort**: Medium  
**Impact**: Better Warlock/multiclass support

Convert spell slots between levels.

**Features**:
- Warlock pact magic conversion
- Divine Smite slot conversion
- Flexible casting (Sorcerer)
- Visual slot conversion interface

### 13. Advanced Concentration Tracking
**Priority**: Medium  
**Effort**: Medium  
**Impact**: Better spell management

Enhanced concentration mechanics.

**Features**:
- Auto-calculate concentration DC
- Quick concentration save button
- Concentration save history
- Visual indicator on token
- Auto-drop on unconscious

### 14. Custom Resource Builder
**Priority**: Low  
**Effort**: High  
**Impact**: Flexibility for homebrew

Create custom resources for homebrew classes.

**Features**:
- Resource template builder
- Custom recovery rules
- Custom icons
- Formula-based max values
- Conditional availability

### 15. Sheet Configuration Presets
**Priority**: Low  
**Effort**: High  
**Impact**: Easier setup

Pre-configured sheet layouts for different playstyles.

**Features**:
- Combat-focused preset
- Spellcaster preset
- Exploration preset
- Roleplay preset
- Custom preset builder
- Import/export presets

## Performance Optimizations

### 16. Lazy Loading
Load sections only when visible.

### 17. Virtual Scrolling
For large spell/item lists.

### 18. Debounced Search
Optimize search performance.

### 19. Cached Computations
Cache frequently computed values.

### 20. Optimized Re-renders
Only re-render changed sections.

## Integration Features

### 21. Enhanced DiceCloud Sync
- Real-time sync indicator
- Conflict resolution
- Selective sync options
- Sync history

### 22. Export/Import
- Export to JSON
- Import from D&D Beyond
- Import from other character tools
- Backup/restore functionality

### 23. Multi-character Management
- Quick character switcher
- Character comparison view
- Party overview
- Shared resources

## Recommended Implementation Order

### Sprint 1: Visual Polish (Week 1)
1. Character Portrait Display
2. Enhanced Hover Effects
3. Quick Roll Modifiers

### Sprint 2: Core UX (Week 2)
4. Collapsible Sections with State Persistence
5. Favorites/Pinned Items
6. Encumbrance & Currency Tracker

### Sprint 3: Class Features (Week 3-4)
7. Class-Specific Resource Tracking
8. Spell Preparation Interface

### Sprint 4: Combat (Week 5)
9. Combat Log & History
10. Advanced Concentration Tracking

### Sprint 5: Power Features (Week 6+)
11. Macro System
12. Companion Management
13. Custom Resource Builder

### Sprint 6: Polish & Optimization (Week 7+)
14. Performance Optimizations
15. Sheet Configuration Presets
16. Enhanced DiceCloud Sync

## Testing Strategy

### Unit Tests
- Test each event handler
- Test data preparation methods
- Test filter logic
- Test search functionality

### Integration Tests
- Test with D&D 5e system
- Test with various character levels
- Test with multiclass characters
- Test with different classes

### User Testing
- Test with actual play sessions
- Gather feedback from players
- Identify pain points
- Iterate on UX

## Success Metrics

1. **Adoption Rate**: % of players using FoundCloud sheet vs default
2. **Performance**: Sheet render time < 100ms
3. **User Satisfaction**: Survey feedback > 4.5/5
4. **Bug Reports**: < 5 critical bugs per release
5. **Feature Usage**: Track most-used features

## Notes

- All enhancements should maintain backward compatibility
- Keep mobile responsiveness in mind
- Follow Foundry VTT best practices
- Maintain code quality and documentation
- Regular releases with changelog
