# Debugging Session Continuation - Render Cascade Issue

## Current Problem
Implementing distraction-free mode revealed a fundamental React performance issue: complete render cascade on every keystroke causing broken auto-save and keyboard shortcuts.

## Root Cause Discovered
The Layout component was re-rendering on every keystroke due to hidden subscriptions, causing this cascade:
`Layout → EditorAreaWithFrontmatter → MainEditor → Editor`

## Current Status (MAJOR BREAKTHROUGH ACHIEVED)
✅ **ISOLATED THE CULPRIT TO EDITOR HOOKS**: Complete systematic elimination revealed the cascade source is one of three Editor hooks:
- `useEditorHandlers`
- `useEditorSetup` 
- `useTauriListeners`

**Evidence**: When ALL editor hooks disabled → cascade completely STOPPED (Editor only renders once)
**Strategy**: Systematically re-enabling hooks one by one to find specific culprit

## Key Files Modified

### Layout.tsx - Current State
- All Zustand subscriptions temporarily disabled except UI store
- All keyboard shortcuts disabled except Cmd+1, Cmd+2  
- All useEffect hooks disabled except basic event listeners
- Added React.memo to EditorAreaWithFrontmatter (successfully breaks cascade)
- Added extensive render tracking/debugging

### Task Documentation
- docs/tasks-todo/task-3-distractionless-mode.md - Contains complete investigation log

## Debugging Steps Taken

### Phase 1: Suspected Store Subscriptions
1. ❌ Removed `isDirty` subscription - didn't fix
2. ❌ Removed `currentFile` object subscription - didn't fix  
3. ❌ Removed `useCreateFile` hook dependency - didn't fix

### Phase 2: Systematic Elimination 
4. ✅ **BREAKTHROUGH**: Disabled ALL hooks in Layout → render cascade STOPPED
5. 🔍 **Current**: Re-enabling hooks systematically to find culprit

## Evidence Found

### The Smoking Gun
```
// Before (cascade continues):
[Layout] RENDER #7-24 on every keystroke

// After disabling all hooks (cascade stops):  
[Layout] RENDER #1 only, then no more renders
```

### React.memo Success
```
// EditorAreaWithFrontmatter went from:
RENDER #1-25 on every keystroke

// To with React.memo:
RENDER #1 (initial) + RENDER #2 (only when frontmatterPanelVisible changes)
```

## Editor Hook Re-enabling Strategy
Systematically re-enabling Editor hooks in this order (least → most suspicious):

✅ **Phase 1 Complete**: Layout/MainEditor cascade elimination
- Fixed `loadPersistedProject` function dependency
- Fixed `currentFile` object subscription 
- Applied React.memo to `EditorAreaWithFrontmatter`

✅ **Phase 2 Complete**: Editor hook isolation
- Removed ALL store subscriptions from Editor → cascade continued
- Removed ALL editor hooks → **cascade STOPPED completely**
- **Conclusion**: One of the three editor hooks is the culprit

✅ **Phase 3 COMPLETE**: Systematic hook re-enabling
- ✅ `useTauriListeners` - **SAFE** (no cascade return)
- ✅ `useEditorSetup` - **SAFE** (no cascade return)
- 🚨 **`useEditorHandlers` - CONFIRMED CULPRIT** (cascade returns immediately)

## FINAL CULPRIT IDENTIFIED ✅

**ROOT CAUSE**: `useEditorHandlers` hook causes render cascade on every keystroke

**Evidence**: 
- All hooks disabled: Editor RENDER #1 only ✅
- With `useTauriListeners` + `useEditorSetup`: Editor RENDER #1-2 only ✅  
- With `useEditorHandlers` added: Editor RENDER #1-16+ on keystroke ❌

## SPECIFIC ROOT CAUSE IDENTIFIED IN useEditorHandlers ✅

**File**: `/Users/danny/dev/astro-editor/src/hooks/editor/useEditorHandlers.ts`

**Problematic Code (Line 8)**:
```typescript
const { setEditorContent, currentFile, isDirty, saveFile } = useEditorStore()
```

**The Problems**:
1. **`currentFile` object** - Gets recreated on every content change (same pattern we fixed in MainEditor)
2. **`isDirty`** - Changes on every keystroke (same pattern we fixed in Layout)  
3. **`saveFile` function** - Gets recreated when store state changes

**Dependency Arrays (Lines 33 & 40)**:
```typescript
}, [currentFile, isDirty, saveFile]) // ← Re-creates functions on every keystroke!
```

**The Cascade Mechanism**:
1. User types → `isDirty` changes in store
2. `useEditorHandlers` receives new `isDirty` value → hook re-runs
3. `handleBlur` and `handleSave` get new function references (due to dependencies)
4. Editor component receives new handler functions → Editor re-renders
5. Process repeats on every keystroke = render cascade

**The Fix Strategy**: Apply same patterns used for Layout/MainEditor:
- Use `getState()` calls instead of reactive subscriptions for frequently-changing data
- Only subscribe to data that should trigger re-renders
- Remove problematic dependencies from useCallback arrays

## Next Steps for Resolution

1. **Fix `useEditorHandlers`** - Remove problematic subscriptions, use `getState()` pattern
2. **Test the fix** - Ensure cascade eliminated and editor works normally
3. **Review and potentially revert unnecessary changes** made during debugging
4. **Restore all disabled functionality** across Layout, MainEditor, and Editor  
5. **Re-implement distraction-free mode** with performance-optimized architecture
6. **Clean up debugging code** and logging

## Changes Made During Debugging - Review for Reversal

**Changes That Should Be KEPT (Good Architectural Improvements)**:
1. **Layout.tsx**: `loadPersistedProject` dependency fix (line 312-314)
   - **Before**: `useEffect(() => { void loadPersistedProject() }, [loadPersistedProject])`
   - **After**: `useEffect(() => { void useProjectStore.getState().loadPersistedProject() }, [])`
   - **Reason**: Prevents function dependency re-renders, follows good React patterns

2. **MainEditor.tsx**: `currentFile` subscription optimization (line 20)
   - **Before**: `const { currentFile } = useEditorStore()`
   - **After**: `const hasCurrentFile = useEditorStore(state => !!state.currentFile)`
   - **Reason**: Prevents object recreation re-renders, more efficient selector

3. **Layout.tsx**: React.memo on EditorAreaWithFrontmatter (line 48)
   - **Added**: `React.memo(({ frontmatterPanelVisible }) => { ... })`
   - **Reason**: Breaks cascade at component boundaries, good performance practice

**Changes That Should Be REVERTED (Debugging-Only)**:
1. **Editor.tsx**: All store subscriptions currently disabled/hardcoded (lines 25-39)
2. **Editor.tsx**: All editor hooks disabled except `useEditorHandlers` (lines 108-129)  
3. **Layout.tsx**: Extensive debugging logging (lines 152-172)
4. **MainEditor.tsx**: Debugging logging (lines 25-28)
5. **Editor.tsx**: Debugging logging (lines 65-85)

**Changes That Are UNCLEAR - Need User Decision**:
1. **Layout.tsx**: Some hook/functionality disabling during debugging process
   - May have accidentally disabled legitimate functionality
   - Need to carefully restore vs. current working state

## Key Architectural Insights

### State Management Pattern (User Confirmed)
- **TanStack Query**: "Server" state (data from disk/collections)
- **Zustand**: Ephemeral app state (sidebar status, current file)
- **useState**: Component-local UI state

### Performance Anti-patterns Found
1. **Object recreation in stores** causing subscription triggers
2. **Nested conditional rendering** destroying React component trees
3. **Hook dependencies** creating cascade chains
4. **Layout subscribing to frequently-changing state**

### Successful Fixes Applied
- React.memo breaks cascade at component boundaries
- Specific selectors instead of object destructuring
- Event-based communication vs hook dependencies

## Test Commands
```bash
npm run dev  # Start dev server
# Test typing in editor with both sidebars closed
# Check for render cascade in console logs
```

## Critical Files to Monitor
- src/components/layout/Layout.tsx (main investigation site)
- src/components/layout/MainEditor.tsx (has render tracking)
- src/components/editor/Editor.tsx (has render tracking)
- docs/tasks-todo/task-3-distractionless-mode.md (complete log)

## Debugging Log Format
```
[Layout] RENDER #X - {props and changed props}
[EditorAreaWithFrontmatter] RENDER #X 
[MainEditor] RENDER #X
[Editor] RENDER #X
```

Look for Layout rendering multiple times with no changed props - that's the cascade trigger.

## Expected Outcome
Once culprit hook is found, fix it while maintaining functionality, then restore all disabled features and implement original distraction-free mode.