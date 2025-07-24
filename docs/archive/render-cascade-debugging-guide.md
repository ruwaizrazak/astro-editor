# React Render Cascade Debugging Guide

## Overview

This document details the complete investigation and resolution of a critical React performance issue that was discovered while implementing distraction-free mode. The render cascade caused broken auto-save, keyboard shortcuts, and severe performance degradation.

**Key Achievement**: Successfully eliminated render cascade while maintaining all functionality and improving overall architecture.

## Problem Description

### Initial Symptoms

- Complete render cascade on every keystroke: `Layout → EditorAreaWithFrontmatter → MainEditor → Editor`
- Auto-save stopped working when both sidebars were hidden
- Keyboard shortcuts became unreliable
- ResizablePanelGroup crashes when toggling frontmatter panel
- Performance degradation affecting the entire application

### The Cascade Pattern

```
User types a character →
Layout re-renders (#1-20+) →
EditorAreaWithFrontmatter re-renders →
MainEditor re-renders →
Editor re-renders →
Repeat on every keystroke
```

**Critical Issue**: Components that should NEVER re-render on editor content changes were re-rendering on every single keystroke.

## Systematic Debugging Methodology

### Phase 1: Component Tree Investigation

**Strategy**: Systematically disable components to isolate cascade source

**Key Discovery**: Adding React.memo to `EditorAreaWithFrontmatter` broke cascade propagation, proving the issue was architectural, not just performance.

**Results**:

- ✅ React.memo on `EditorAreaWithFrontmatter` → breaks parent cascade
- ❌ React.memo on `Editor` → cascade persisted (internal subscriptions still trigger re-renders)

### Phase 2: Store Subscription Analysis

**Strategy**: Remove problematic store subscriptions causing frequent re-renders

**Critical Fixes Applied**:

1. **Layout.tsx - `loadPersistedProject` Function Dependency**:

   ```typescript
   // BEFORE (caused cascade):
   const { loadPersistedProject } = useProjectStore()
   useEffect(() => {
     void loadPersistedProject()
   }, [loadPersistedProject]) // Function recreated on store changes

   // AFTER (no cascade):
   useEffect(() => {
     void useProjectStore.getState().loadPersistedProject()
   }, []) // Stable dependency array
   ```

2. **MainEditor.tsx - `currentFile` Object Subscription**:

   ```typescript
   // BEFORE (caused cascade):
   const { currentFile } = useEditorStore() // Object recreated on content changes

   // AFTER (no cascade):
   const hasCurrentFile = useEditorStore(state => !!state.currentFile) // Primitive selector
   ```

### Phase 3: Hook Elimination Strategy

**Strategy**: Systematically disable ALL hooks to find the root cause

**Breakthrough Discovery**: When ALL editor hooks were disabled → cascade COMPLETELY STOPPED

**Systematic Hook Re-enabling Results**:

- ✅ `useTauriListeners` → Safe, no cascade
- ✅ `useEditorSetup` → Safe, no cascade
- 🚨 **`useEditorHandlers` → CONFIRMED CULPRIT** - cascade returns immediately

### Phase 4: Root Cause Analysis

**File**: `src/hooks/editor/useEditorHandlers.ts`

**Problematic Pattern**:

```typescript
// Line 8 - Subscribes to frequently-changing store values
const { setEditorContent, currentFile, isDirty, saveFile } = useEditorStore()

// Lines 33, 40 - Dependencies cause function recreation on every keystroke
const handleBlur = useCallback(() => {
  if (currentFile && isDirty) {
    void saveFile()
  }
}, [currentFile, isDirty, saveFile]) // ← Re-creates on every keystroke!

const handleSave = useCallback(() => {
  if (currentFile && isDirty) {
    void saveFile()
  }
}, [currentFile, isDirty, saveFile]) // ← Re-creates on every keystroke!
```

**Cascade Mechanism**:

1. User types → `isDirty` changes in store
2. `useEditorHandlers` receives new `isDirty` → hook re-runs
3. `handleBlur`/`handleSave` get new function references (due to dependency changes)
4. Editor component receives new handler functions → Editor re-renders
5. Process repeats on every keystroke = complete render cascade

## Resolution Strategy: The `getState()` Pattern

### Core Principle

**Subscribe only to data that should trigger component re-renders. For callbacks that need current state, use `getState()` to access values without subscribing.**

### Implementation

```typescript
// BEFORE (causes cascade):
const { setEditorContent, currentFile, isDirty, saveFile } = useEditorStore()

const handleBlur = useCallback(() => {
  if (currentFile && isDirty) {
    void saveFile()
  }
}, [currentFile, isDirty, saveFile]) // ← Problematic dependencies

// AFTER (no cascade):
const { setEditorContent } = useEditorStore() // Only subscribe to what we need

const handleBlur = useCallback(() => {
  const { currentFile, isDirty, saveFile } = useEditorStore.getState()
  if (currentFile && isDirty) {
    void saveFile()
  }
}, []) // ← Stable dependency array

const handleSave = useCallback(() => {
  const { currentFile, isDirty, saveFile } = useEditorStore.getState()
  if (currentFile && isDirty) {
    void saveFile()
  }
}, []) // ← Stable dependency array
```

## Critical Architectural Patterns Discovered

### 1. Specific Selectors vs Object Destructuring

```typescript
// ❌ BAD: Object recreation triggers re-renders
const { currentFile } = useEditorStore()

// ✅ GOOD: Primitive selector only changes when needed
const hasCurrentFile = useEditorStore(state => !!state.currentFile)
const currentFileName = useEditorStore(state => state.currentFile?.name)
```

### 2. Function Dependencies in useEffect

```typescript
// ❌ BAD: Function dependencies cause re-render loops
const { someFunction } = useStore()
useEffect(() => {
  void someFunction()
}, [someFunction])

// ✅ GOOD: Direct getState() calls
useEffect(() => {
  void useStore.getState().someFunction()
}, [])
```

### 3. CSS Visibility vs Conditional Rendering

```typescript
// ❌ BAD: Conditional rendering breaks stateful components
{frontmatterVisible ? (
  <ResizablePanelGroup>
    <ResizablePanel>Content</ResizablePanel>
  </ResizablePanelGroup>
) : (
  <div>Content</div>
)}

// ✅ GOOD: CSS visibility preserves component tree
<ResizablePanelGroup>
  <ResizablePanel
    className={frontmatterVisible ? '' : 'hidden'}
  >
    Content
  </ResizablePanel>
</ResizablePanelGroup>
```

### 4. Strategic React.memo Placement

```typescript
// ✅ GOOD: Breaks cascade at component boundaries
const EditorAreaWithFrontmatter = React.memo(({ frontmatterPanelVisible }) => {
  // Component only re-renders when frontmatterPanelVisible changes
})
```

## Additional Issues Resolved

### ResizablePanelGroup Crash

**Problem**: App crashed with "Previous layout not found for panel index -1" when toggling frontmatter panel.

**Root Cause**: Conditional rendering was changing the component tree structure, breaking `react-resizable-panels` internal state.

**Solution**: Use CSS visibility (`hidden` class) instead of conditional rendering to maintain consistent component trees.

### Test Updates Required

After changing `useEditorHandlers` to use the `getState()` pattern, 15 tests needed updates to match the new implementation that no longer has reactive dependencies.

**Fixed**: Updated mock objects to include complete `EditorState` interface properties and corrected type definitions.

## Performance Impact

### Before Fixes

```
Layout:     RENDER #1-20+ per keystroke
MainEditor: RENDER #1-15+ per keystroke
Editor:     RENDER #1-30+ per keystroke
```

### After Fixes

```
Layout:     RENDER #1 only
MainEditor: RENDER #1-2 only (only on file changes)
Editor:     RENDER #1 only (only on file changes)
```

**Result**: 95%+ reduction in unnecessary re-renders, auto-save restored, all functionality working.

## Implementation Guidelines

### When to Use `getState()` Pattern

1. **In useCallback dependencies**: When you need current state but don't want re-renders
2. **In event handlers**: For accessing latest state without subscriptions
3. **In useEffect with empty deps**: When you need current state on mount only
4. **In async operations**: When state might change during async execution

### When to Use Reactive Subscriptions

1. **For rendering state**: Data that should trigger component re-renders
2. **For derived UI state**: Values that affect component appearance
3. **For conditional rendering**: Boolean flags that control component visibility

### Store Subscription Best Practices

```typescript
// ✅ GOOD: Specific primitive selectors
const isLoading = useStore(state => state.loading)
const hasError = useStore(state => !!state.error)
const itemCount = useStore(state => state.items.length)

// ❌ BAD: Object destructuring of frequently-changing data
const { currentFile, isDirty, content } = useStore()

// ✅ GOOD: Actions from store (stable references)
const { saveFile, openFile } = useStore()

// ✅ GOOD: getState() in callbacks
const handleSave = useCallback(() => {
  const { isDirty, currentFile } = useStore.getState()
  if (isDirty && currentFile) {
    saveFile()
  }
}, [saveFile])
```

## Testing Strategy

### Render Tracking

Add temporary render tracking to components during debugging:

```typescript
const renderCountRef = useRef(0)
renderCountRef.current++
console.log(`[ComponentName] RENDER #${renderCountRef.current}`)
```

**Important**: Remove render tracking after debugging is complete.

### Performance Monitoring

1. Use React DevTools Profiler to identify unnecessary re-renders
2. Monitor component render counts during typical user interactions
3. Test with both sidebars in different states
4. Verify auto-save continues working under all conditions

## Lessons Learned

### Key Insights

1. **Function dependencies in React hooks** can cause render cascades when store values change frequently
2. **Conditional rendering within stateful UI libraries** breaks internal state and causes crashes
3. **Object subscriptions** trigger re-renders even when object content hasn't meaningfully changed
4. **Systematic restoration** is critical - test each change individually to avoid regressions
5. **Store subscription patterns** have enormous performance implications

### Anti-Patterns to Avoid

1. **Subscribing to frequently-changing data** in components that don't need to re-render
2. **Using objects as dependencies** in useCallback/useEffect when you only need specific properties
3. **Conditional rendering** of complex stateful components (use CSS visibility instead)
4. **Function dependencies** in useEffect when you can use direct getState() calls

### Proven Patterns

1. **getState() pattern**: Access current state without subscribing
2. **Specific selectors**: Subscribe to primitives, not objects
3. **CSS visibility**: Maintain component trees for stateful libraries
4. **React.memo boundaries**: Strategic placement to break cascade propagation
5. **Systematic debugging**: Disable features systematically to isolate issues

## Quality Assurance

### Monitoring

Continue to monitor for:

- Unexpected re-render patterns
- Performance regressions
- Auto-save reliability
- Complex user interaction edge cases

## Conclusion

This investigation successfully eliminated a critical performance issue while:

- ✅ Maintaining all existing functionality
- ✅ Improving overall architecture
- ✅ Establishing patterns to prevent future issues
- ✅ Providing detailed documentation for maintainability

The debugging process revealed fundamental architectural patterns that will inform all future development on the project. The `getState()` pattern and other techniques discovered here should be applied consistently throughout the codebase to maintain optimal performance.

**Status**: ✅ Complete - Ready for feature implementation with optimized architecture
