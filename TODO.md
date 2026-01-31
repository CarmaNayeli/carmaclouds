# CarmaClouds TODO List

Generated: 2026-01-31

## 🔴 High Priority

### Owlbear Extension Integration TODOs

**Location:** `packages/owlcloud/owlbear-extension/popover.js`

1. **Dynamic viewport height** (Lines 78, 1359)
   - Currently hardcoded, should calculate based on actual viewport

2. **Save character state before switching** (Line 293)
   - Currently switches without saving local HP/spell slot changes
   - Need to persist state when changing active character

3. **Short/Long Rest Resource Recovery** (Lines 2256-2257, 2319)
   - Implement resource recovery for short rests
   - Save rest data to Supabase

4. **Custom roll display** (Line 1507)
   - Future enhancement for scene items or custom roll UI

### Owlbear Content Script TODOs

**Location:** `packages/owlcloud/src/content/owlbear.js`

1. **Character sheet display** (Line 147)
   - Implement using extension popup modules

2. **Roll communication** (Lines 783, 785)
   - Display rolls in Owlbear UI
   - Currently just logging

### Popup Integration TODOs

**Location:** `packages/owlcloud/src/popup/popup.js`

1. **Owlbear Rodeo integration** (Lines 1311, 1339, 1346, 1678)
   - Multiple places marked for integration
   - Some features disabled pending completion

---

## 🟡 Medium Priority

### Character Trait Integration

**Location:** `packages/core/src/modules/character-trait-popups.js`

1. **Halfling Luck rerolls** (Line 180)
   - Add Owlbear Rodeo integration

2. **Lucky feat rerolls** (Line 332)
   - Add Owlbear Rodeo integration

3. **Wild Magic Surge announcements** (Line 625)
   - Add Owlbear Rodeo integration

4. **Bardic Inspiration rolls** (Line 800)
   - Add Owlbear Rodeo integration

5. **Elven Accuracy rerolls** (Line 937)
   - Add Owlbear Rodeo integration

### Action Announcements

**Location:** `packages/core/src/modules/action-announcements.js`

1. **VTT action announcements** (Lines 20, 68)
   - Send action announcements to Owlbear Rodeo

---

## 🟢 Low Priority / Nice to Have

### Supabase Integration

**Location:** `packages/core/src/supabase/client.js`

1. **Pairing ID field** (Line 622)
   - Requires database migration
   - Currently commented out

### Backup File Cleanup

**Location:** `packages/owlcloud/src/popup-sheet.js.backup`

1. **Multiple TODOs in backup file**
   - File is a backup - review if still needed
   - Contains: Sorcery points, combat mechanics restoration (line 8289)
   - Consider deleting if no longer needed

---

## 📊 TODO Summary by Category

### Integration Work
- **Owlbear Rodeo Integration:** ~15 TODOs
  - Character traits (5)
  - UI/Display (4)
  - Rolls & announcements (3)
  - Resource management (3)

### Features
- **Dynamic UI:** 2 TODOs (viewport height)
- **State Management:** 3 TODOs (save before switch, rest recovery)
- **Database:** 1 TODO (pairing_id migration)

### Cleanup
- **Backup files:** Consider removing `.backup` files if no longer needed

---

## 🎯 Recommended Next Steps

1. **Immediate:**
   - Test the newly bundled extensions
   - Remove backup files if confirmed not needed

2. **Short-term (1-2 weeks):**
   - Implement basic Owlbear roll display (line 783)
   - Add character state saving before switch (line 293)
   - Make viewport height dynamic (lines 78, 1359)

3. **Medium-term (1 month):**
   - Complete Owlbear Rodeo integration for character traits
   - Implement short/long rest resource recovery with Supabase sync
   - Add action announcements to VTT

4. **Long-term (as needed):**
   - Pairing ID database migration
   - Advanced roll UI/scene integration

---

## 📝 Notes

- Most TODOs are related to Owlbear Rodeo integration
- Core functionality is working, these are enhancements
- Character traits TODOs are similar - could be tackled as a group
- Consider creating GitHub issues from these TODOs for tracking

---

## 🔍 How to Find TODOs

Search the codebase:
```bash
# All TODOs
grep -rn "TODO" --include="*.js" --include="*.ts"

# Specific type
grep -rn "FIXME" --include="*.js" --include="*.ts"
```

Or use the Grep tool:
```javascript
Grep pattern: "TODO|FIXME|XXX|HACK"
```
