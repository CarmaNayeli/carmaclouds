# FoundCloud Sheet Redesign Plan

## Problem Statement

The current FoundCloud sheet extends the D&D 5e base ActorSheet, which creates unnecessary complexity and makes it harder to maintain consistency with RollCloud. 

**Goal**: Create a standalone FoundCloud sheet that matches RollCloud's structure exactly, just with orange accents instead of pink. This will make future updates simple - when we upgrade one sheet, the other will be a straightforward color swap.

## Current Issues

1. **Extends D&D 5e base sheet**: Inherits unnecessary complexity and dependencies
2. **Different structure**: Template and logic differ from RollCloud
3. **Hard to maintain**: Changes to RollCloud don't easily translate to FoundCloud
4. **Overcomplicated**: More code than necessary for what we need

## Solution: Standalone Sheet Matching RollCloud

### Architecture Change

**Before:**
```javascript
class FoundCloudSheet extends ActorSheet5eCharacter {
  // Complex inheritance, D&D 5e dependencies
}
```

**After:**
```javascript
class FoundCloudSheet extends ActorSheet {
  // Simple base class, no D&D 5e dependencies
  // Direct control over all functionality
}
```

### Design Principles

1. **Match RollCloud exactly**: Same HTML structure, same CSS classes, same JavaScript patterns
2. **Orange theme**: Replace pink (#FC57F9) with orange (#FF6400)
3. **Standalone**: No dependencies on D&D 5e system internals
4. **Simple data mapping**: Get data from actor.system, display it
5. **Foundry integration**: Use Foundry's roll system, but keep UI identical

### Implementation Plan

#### Phase 1: Template Conversion
- [ ] Copy RollCloud's popup-sheet.html structure
- [ ] Convert to Handlebars (.hbs) template
- [ ] Replace pink theme with orange theme
- [ ] Keep all sections identical (stats, abilities, spells, actions, inventory)

#### Phase 2: Stylesheet Conversion
- [ ] Copy RollCloud's CSS from popup-sheet.html
- [ ] Extract to foundcloud-sheet.css
- [ ] Replace all pink colors with orange
- [ ] Keep all layout and styling identical

#### Phase 3: JavaScript Conversion
- [ ] Create new FoundCloudSheet class extending base ActorSheet
- [ ] Implement getData() to map actor.system to template context
- [ ] Copy RollCloud's event handlers
- [ ] Adapt roll logic to use Foundry's roll system instead of Roll20's

#### Phase 4: Testing
- [ ] Test with various character levels
- [ ] Test all interactive elements
- [ ] Verify rolls work correctly
- [ ] Compare side-by-side with RollCloud

## Color Mapping

### RollCloud (Pink Theme)
```css
--accent-primary: #FC57F9;
--border-card: #FC57F9;
```

### FoundCloud (Orange Theme)
```css
--accent-primary: #FF6400;
--border-card: #FF6400;
```

## Benefits

1. **Easy maintenance**: Update RollCloud, copy changes to FoundCloud, swap colors
2. **Consistent UX**: Users get the same experience across platforms
3. **Simpler code**: No complex inheritance, easier to understand
4. **Better performance**: Less overhead from base class
5. **More control**: Direct control over all functionality

## File Structure

```
foundry-module/
├── templates/
│   └── foundcloud-sheet.hbs          # Matches RollCloud structure
├── scripts/
│   └── foundcloud-sheet.js           # Simple ActorSheet extension
└── styles/
    └── foundcloud-sheet.css          # Matches RollCloud CSS with orange theme
```

## Migration Strategy

1. Create new sheet files alongside old ones
2. Test new sheet thoroughly
3. Switch default to new sheet
4. Keep old sheet as fallback for one release
5. Remove old sheet after confirming stability

## Success Criteria

- [ ] FoundCloud sheet looks identical to RollCloud (except orange theme)
- [ ] All functionality works in Foundry
- [ ] Code is simple and maintainable
- [ ] Future RollCloud updates can be easily ported
- [ ] No dependencies on D&D 5e system internals
