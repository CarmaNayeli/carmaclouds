# FoundCloud Side Tab Implementation

## Overview

Replaced the traditional sidebar import button with a modern collapsible side tab interface that provides quick access to FoundCloud characters and their sheets.

## Features

### 1. Collapsible Side Tab
- **Location**: Fixed to the left side of the screen, vertically centered
- **Default State**: Shows only the FoundCloud logo (50px wide)
- **Hover State**: Expands to 220px showing "Import from FoundCloud" text
- **Styling**: Orange gradient background (#ff6b35 to #ff8c5a) matching FoundCloud theme
- **Animation**: Smooth 0.3s transition on hover

### 2. Character Selection Menu
**Opens when clicking the side tab**

**Menu Structure:**
- **Header**: "FoundCloud Characters" with close button
- **Character List**: Scrollable list of synced characters
  - Shows character name, level, and class
  - Click to select (highlights with orange border)
  - Double-click to open import dialog
- **Actions**: "Open Character Sheet" button

**Menu Features:**
- Fixed position next to the side tab
- 350px wide, max 500px height
- Dark theme (#2d2d2d background)
- Orange border and accents
- Custom scrollbar styling
- Click outside to close

### 3. Character Management

**Character List Display:**
- Fetches characters from Supabase via `getAvailableCharacters()`
- Shows loading state while fetching
- Empty state if no characters found
- Error state if fetch fails

**Character Actions:**
- **Single Click**: Select character (visual highlight)
- **Double Click**: Open import dialog (existing functionality)
- **"Open Character Sheet" Button**: 
  - If character already imported: Opens existing sheet
  - If not imported: Imports character first, then opens sheet

### 4. Smart Behavior

**Auto-Import on Sheet Open:**
- Checks if actor exists in Foundry
- If exists: Opens sheet immediately
- If not: Imports from Supabase, then opens sheet
- Shows notification during import process

**Menu Management:**
- Closes when clicking outside
- Closes after opening a character sheet
- Refreshes character list each time opened
- Prevents duplicate tabs

## Technical Implementation

### Files Modified

**`foundcloud.js`:**
- Removed `renderActorDirectory` hook (old sidebar button)
- Added side tab creation in `ready` hook
- Added character list loading logic
- Added sheet opening logic with auto-import

**`module.json`:**
- Added `foundcloud-side-tab.css` to styles array

### Files Created

**`foundcloud-side-tab.css`:**
- Complete styling for side tab and popup menu
- Responsive hover states
- Custom scrollbar styling
- Orange theme matching FoundCloud branding

## User Workflow

### Before (Old):
1. Click "Import from DiceCloud" button in Actors sidebar
2. Select character from import dialog
3. Configure import options
4. Click import
5. Manually open character sheet from Actors directory

### After (New):
1. Hover over FoundCloud tab on left side
2. Click to open character menu
3. Select character from list
4. Click "Open Character Sheet"
5. Character auto-imports (if needed) and sheet opens immediately

**OR**

1. Hover over FoundCloud tab
2. Click to open menu
3. Double-click character
4. Opens import dialog (for advanced options)

## Benefits

1. **Better UX**: Side tab is always accessible, doesn't clutter sidebar
2. **Faster Workflow**: Direct access to character sheets without multiple dialogs
3. **Visual Appeal**: Modern collapsible design with smooth animations
4. **Space Efficient**: Collapses to just logo when not in use
5. **Smart Import**: Auto-imports characters when opening sheets
6. **Consistent Branding**: Orange theme throughout

## Future Enhancements

Possible additions:
- Character portraits in list
- Quick sync button per character
- Recent characters section
- Search/filter characters
- Character stats preview on hover
- Drag character to Actors directory to import
