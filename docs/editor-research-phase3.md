# Phase 3.1 Editor Research - CodeMirror Setup Review

*Generated during Phase 3.1 preparation - CodeMirror editor review and configuration*

## Current Editor Implementation Analysis

### 1. Main EditorView Component
**File:** `src/components/Layout/EditorView.tsx`

**Current State:**
- Uses `@uiw/react-codemirror` wrapper with CodeMirror 6
- Basic markdown language support via `@codemirror/lang-markdown`
- Placeholder keyboard shortcuts (Cmd+B, Cmd+I, Cmd+K, Cmd+S) - **not implemented**
- Auto-save integration with 2-second debouncing
- Manual save on blur
- Custom theme with iA Writer-inspired typography foundation

**Current Extensions:**
- `markdown()` - Basic markdown syntax highlighting
- `history()` - Undo/redo functionality  
- `keymap` - Custom keyboard shortcuts (placeholders)
- `EditorView.lineWrapping` - Text wrapping
- Custom theme with basic typography and markdown styling

### 2. Styling Implementation
**Files:** 
- `src/components/Layout/EditorView.css` (editor-specific)
- `src/App.css` (global styles)

**Current Styling Features:**
- SF Pro Text font family with fallbacks
- 16px font size, 1.6 line height
- 65ch max-width for optimal reading
- Centered content with 20-40px padding
- Custom markdown token styling (headings, bold, italic, links, code)
- macOS-style colors and spacing
- iA Writer Duo font referenced but **not properly loaded**

**Styling Conflicts:**
- EditorView.tsx theme conflicts with EditorView.css
- Font declarations in both files (iA Writer Duo vs SF Pro Text)
- Background color conflicts (#fafafa vs transparent)

### 3. CodeMirror Dependencies (Current)
```json
"@uiw/react-codemirror": "^4.24.1",
"@codemirror/lang-markdown": "^6.3.3",
"@codemirror/commands": "^6.8.1",
"@codemirror/view": "^6.38.0",
"@codemirror/search": "^6.5.11",
"@codemirror/autocomplete": "^6.18.6",
"@codemirror/theme-one-dark": "^6.1.3" // not used
```

### 4. Missing Features for Phase 3.1

**Critical Missing:**
1. **iA Writer Duo font** - Referenced but not loaded/available
2. **Actual markdown shortcuts** - Currently just placeholder functions
3. **GitHub Flavored Markdown (GFM)** - Only basic markdown support
4. **Hanging hash marks** - Mentioned in comments but not implemented
5. **Link creation functionality** - Cmd+K does nothing
6. **Advanced syntax highlighting** - Basic token styling only
7. **Image handling** - No drag & drop or image support
8. **Code block improvements** - Basic monospace styling only

**Implementation Needed:**
- Real Cmd+B (bold), Cmd+I (italic), Cmd+K (link) functionality
- iA Writer-style typography and spacing
- Enhanced GFM support (tables, strikethrough, task lists, etc.)
- Hanging indentation for headings
- Better code block syntax highlighting
- Focus mode and typewriter mode (future phases)

### 5. GitHub Flavored Markdown Research

**CodeMirror 6 GFM Support:**
- Core `@codemirror/lang-markdown` package provides basic GFM
- Supports: strikethrough (~~text~~), task lists (- [ ]), emoji (:emoji:), GitHub spice (hashes, issues)
- **Missing advanced features**: Tables, better code block language detection
- May need additional extensions for full GFM compliance

**Available GFM Extensions:**
- CodeMirror 5 had dedicated GFM mode
- CodeMirror 6 includes GFM in base markdown package
- Table support still limited in some implementations
- Code block language highlighting depends on additional language packages

### 6. Integration Points (Working Well)

**Store Integration:**
- `editorContent` - Current editor text ✅
- `setEditorContent` - Updates content and triggers auto-save ✅
- `saveFile` - Manual save function ✅
- `isDirty` - Tracks unsaved changes ✅

**Auto-save System:**
- 2-second debounced auto-save ✅
- Manual save on blur ✅
- Keyboard shortcut save (Cmd+S) ✅

## ✅ COMPLETED: Phase 3.1 Implementation Status

### ✅ Priority 1: Foundation Cleanup - COMPLETED
1. **✅ Resolved font conflicts** - Now using iA Writer Duo consistently
2. **✅ Added iA Writer Duo Variable fonts** - Proper @font-face declarations in App.css
3. **✅ Consolidated styling** - Moved all CodeMirror styles to .tsx theme, minimal CSS container
4. **✅ Cleaned up unused imports** - Removed `@codemirror/theme-one-dark` package

### ✅ Priority 2: Core Functionality - COMPLETED
1. **✅ Implemented real markdown shortcuts**:
   - ✅ Cmd+B: Wrap selection in `**bold**` (with toggle functionality)
   - ✅ Cmd+I: Wrap selection in `*italic*` (with toggle functionality)
   - ✅ Cmd+K: Create/edit links `[text](url)` (smart cursor positioning)
2. **✅ Enhanced GFM support** - Current `@codemirror/lang-markdown` package verified adequate
3. **✅ URL paste behavior** - Pasting URL over selection creates markdown link

### Implementation Details Completed

**Font Setup:**
- Added Variable font declarations for both iA Writer Duo and iA Writer Mono
- Proper fallback chains and font-display: swap for performance
- Using Variable fonts for better typographic control

**Styling Consolidation:**
- Removed conflicts between EditorView.css and TypeScript theme
- All CodeMirror-specific styles now in TypeScript theme
- Container styles minimal and CSS-variable based
- Improved typography with better spacing and weights

**Markdown Shortcuts:**
- Smart toggle functionality (adds/removes formatting)
- Intelligent cursor positioning
- No-selection behavior (inserts markers with cursor in between)
- Link editing functionality (Cmd+K on existing links selects URL)

**URL Paste Enhancement:**
- Automatic URL detection (protocol-based and www. patterns)
- Creates proper markdown links when pasting over selected text
- Falls back to default paste behavior for non-URLs

### Priority 3: Typography & Aesthetics
1. **Hanging hash marks** - Custom decorations for headings
2. **Improved code block styling** - Better syntax highlighting
3. **iA Writer-inspired spacing and colors**
4. **Custom theme refinement** - Build on existing foundation

### Priority 4: Advanced Features (Later phases)
1. **Image drag & drop functionality**
2. **Focus mode and typewriter mode**
3. **Advanced syntax highlighting**
4. **Performance optimizations**

## Technical Notes

**CodeMirror 6 Architecture:**
- Extension-based system - all features are extensions
- Custom decorations for visual enhancements (hanging hash marks)
- Keymap system for keyboard shortcuts
- Theme system for styling (conflicts need resolution)

**Current Strengths:**
- Solid foundation with working auto-save
- Good store integration
- Basic markdown support functional
- ResizablePanel integration working

**Current Weaknesses:**
- Placeholder implementations everywhere
- Font loading issues
- Styling conflicts
- Missing core editing features

## Files Requiring Changes

**High Priority:**
- `src/components/Layout/EditorView.tsx` - Implement real shortcuts, fix theme
- `src/components/Layout/EditorView.css` - Resolve conflicts, add fonts
- Font files - Add iA Writer Duo to assets

**Medium Priority:**
- CodeMirror extensions - Enhanced GFM, decorations
- Test files - Update tests for new functionality

**Low Priority:**
- Documentation updates
- Performance optimizations