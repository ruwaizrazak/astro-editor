# Task: Distractionless mode

This feature should only happen when both sidebars are closed And Only parts of the layout visible are the unified title bar, Editor and status bar.

When in this state, we've already re-styled the status bar and title bar to make them subtle. We've removed The background and made the borders transparent etc.

When a user had both sidebars hidden and they begin typing in the editor, the whole unified title bar and status bar should become invisible.
When a user moves their mouse over the unified title bar or status bar, both should reappear together and then stay there (as per normal) until they start typing again in the editor.

They should always be shown if either of the sidebars are shown.
Once a user has moused over and they've been shown, they should not disappear again if the user mouses away. They should be back in their normal state and they should only disappear again once the user has typed, so this whole thing's triggered again right?

The actual components shouldn't be removed. In other words, I should still be able to click on the title bar at the very top and be able to drag the window around. That should be possible because it should have reappeared when I move my mouse there.

I think the easiest way to do this is simply to set their opacity to zero? It's extremely important that no functionality at all is changed here. A previous attempt to solve this problem added a lot of complexity and listeners, and problems with rendering and state management. It seems to me the only state we need to store here Is whether or not the bars are currently visible. Then we need to listen for typing in the editor And set that state. The user moving their mouse over the status bar or the top should simply reset that state to its default. It would probably be good UX if we only actually set that state when the user had typed more than 3-4 characters in the editor in a short space of time. That way we won't be constantly showing and hiding this when the user is just making very quick one-character edits.

We need to think carefully about how the content is actually hidden by this state because there is potential that if the content is hidden with display:none or similar, it's not going to receive any updates it gets from elsewhere in the application when state is changed etc. This could affect things like auto-save, Toggling on and off Focus Mode via the Command Palette (which updates the button in the toolbar etc) and potentially in the future certain other things.

An attempt to solve this problem before we tried to use `isDirty` To know whether we were typing or not, which was a terrible approach because that exists only to deal with saving.

In terms of animation, I think it is suitable for the first effort here to simply have them disappear, but then we can use some CSS to have them fade away. I don't want them to slide up or down at all Because that would require moving them rather than simply making them invisible.

## Technical Implementation Plan

### Overview

We'll implement distraction-free mode by adding opacity-based hiding for the UnifiedTitleBar and StatusBar when:

1. Both sidebars are closed
2. User types in the editor (after 3-4 characters)
3. Bars reappear on mouse hover and remain visible until typing resumes

### Step-by-Step Implementation

#### 1. Add UI Store State and Logic

**File:** `src/store/uiStore.ts`

- Add new state: `distractionFreeBarsHidden: boolean` (default: false)
- Add action: `handleTypingInEditor: () => void`
  - This action checks if both panels are hidden internally
  - Only sets `distractionFreeBarsHidden: true` if conditions are met
- Add action: `setDistractionFreeBarsHidden: (hidden: boolean) => void`
  - Direct setter for mouse hover events

#### 2. Add Typing Detection to Editor

**File:** `src/components/editor/Editor.tsx`

- Create a character counter that tracks consecutive characters typed
- In the existing `EditorView.updateListener`:
  - Increment counter on each character typed
  - When counter reaches 4 characters, call a UI store action
  - Reset counter after triggering or if user stops typing for 500ms
- The editor simply reports "user is typing" - it doesn't know about sidebars

#### 3. Add Mouse Hover Detection

**Files:** `src/components/layout/UnifiedTitleBar.tsx` and `src/components/layout/StatusBar.tsx`

- Add `onMouseEnter` handlers to the root elements
- When hovered and `distractionFreeBarsHidden` is true:
  - Call `setDistractionFreeBarsHidden(false)`
  - This reveals both bars simultaneously

#### 4. Apply Opacity-Based Hiding

**Files:** `src/components/layout/UnifiedTitleBar.tsx` and `src/components/layout/StatusBar.tsx`

- Add conditional styling based on `distractionFreeBarsHidden` state:
  ```tsx
  className={cn(
    // existing classes...
    distractionFreeBarsHidden && bothPanelsHidden && 'opacity-0 transition-opacity duration-300'
  )}
  ```
- The `transition-opacity duration-300` provides smooth fade in/out

#### 5. Handle Sidebar State Changes

**File:** `src/store/uiStore.ts`

- When either sidebar is toggled to visible:
  - Automatically set `distractionFreeBarsHidden: false`
- This ensures bars always show when sidebars are open

#### 6. Handle Edge Cases

- **Window Dragging:** The title bar remains functional even when opacity is 0
- **Auto-save:** Continues working as opacity doesn't affect functionality
- **Command Palette:** Can still toggle focus mode as the button remains clickable
- **Keyboard Shortcuts:** All shortcuts continue working

### Implementation Details

#### Character Counting Logic (Editor)

```typescript
let typingCharCount = 0
let typingResetTimeout: number | null = null

// In updateListener
if (update.docChanged && !isProgrammaticUpdate.current) {
  typingCharCount++

  // Clear existing timeout
  if (typingResetTimeout) clearTimeout(typingResetTimeout)

  // Reset counter after 500ms of no typing
  typingResetTimeout = window.setTimeout(() => {
    typingCharCount = 0
  }, 500)

  // Hide bars after 4 characters
  if (typingCharCount >= 4) {
    useUIStore.getState().handleTypingInEditor()
    typingCharCount = 0
  }
}
```

#### UI Store Logic

```typescript
// In uiStore.ts
handleTypingInEditor: () => {
  const { sidebarVisible, frontmatterPanelVisible } = get()
  if (!sidebarVisible && !frontmatterPanelVisible) {
    set({ distractionFreeBarsHidden: true })
  }
}
```

#### CSS Transition

The opacity transition ensures smooth visual feedback:

- Fade out: 300ms when hiding
- Fade in: 300ms when showing on hover

### Testing Checklist

1. Close both sidebars
2. Type 4+ characters quickly → bars should fade out
3. Move mouse over title bar area → bars should fade in
4. Move mouse away → bars should remain visible
5. Type again → bars should fade out after 4 characters
6. Open a sidebar → bars should appear and stay visible
7. Test window dragging with invisible title bar
8. Verify auto-save continues working
9. Test all keyboard shortcuts work with bars hidden

### Potential Problems and Considerations

#### React-Specific Concerns

1. **Mouse Events on Opacity-0 Elements**: Elements with `opacity: 0` still receive mouse events, which is what we want. However, we need to ensure the hover detection works reliably across all browsers.

2. **Re-render Performance**: Every character typed will trigger a state update in the UI store. We should monitor if this causes performance issues, though it should be minimal since only the bars re-render.

3. **Event Listener Cleanup**: The typing detection timeout needs proper cleanup when the editor unmounts to avoid memory leaks.

#### UX Edge Cases

1. **Simultaneous Actions**: If user types and immediately moves mouse to title bar, there might be a brief flicker. The 300ms transition should minimize this.

2. **Command Palette Interaction**: When command palette opens (Cmd+K), bars should probably reappear. We may need to add: `distractionFreeBarsHidden: false` when command palette opens.

3. **Focus Loss**: If editor loses focus (e.g., user switches apps), the character counter should reset. Currently handled by the 500ms timeout, but may need explicit blur handling.

4. **Rapid Sidebar Toggling**: If user rapidly toggles sidebars while typing, the state management should handle this gracefully (current design should work).

#### Technical Considerations

1. **Character vs Change Detection**: We're counting characters, but CodeMirror's `docChanged` fires for any change (including deletions). This means backspacing counts toward the 4-character threshold, which might be unexpected.

2. **Programmatic Updates**: The `isProgrammaticUpdate` check prevents auto-save from triggering bar hiding, but we should verify this works for all programmatic changes (e.g., format commands).

3. **Window Dragging Discovery**: Users might not discover they can still drag the window when the title bar is invisible. This is acceptable for v1 as mouse hover reveals it.

#### Implementation Notes

- Start with the simplest implementation and add complexity only if needed
- The opacity approach is correct - maintains all functionality while hiding UI
- State is minimal and contained within UI store
- No need for complex event systems or listeners beyond what's proposed

## Bugs after initial attempt

- [x] ~~Background **behind** both bars is white, should be `--editor-color-background`. This can maybe just be set on one of the high-level containers, Since all of the sidebars and other stuff will have their own background set.~~ - **FIXED**: Changed Layout background from `bg-background` to `bg-[var(--editor-color-background)]`
- [x] ~~Keyboard shortcuts for showing and opening the sidebar no longer work reliably when the editor is focussed.~~ - **FIXED**: Made typing detection more specific - only counts `input.type` events from keyboard, not all document changes
- [x] ~~Opening the command palette or Component builder now triggers a "File Saved Successfully" toast. Making an edit in the document autosaves correctly, but then later when clicking out of the editor we get a "File Saved Successfully" toast. I assume this is because the toasts are somehow being saved up and appearing later. But it may be something different to that.~~ - **FIXED**: Same root cause - typing detection was too broad and counted command palette/component builder actions as "typing"
- [x] ~~Open Project in IDE no longer works from the command panel~~ - **FIXED**: Same root cause as above
- [x] ~~MOST IMPORTANTLY: When the title bar is hidden, auto-save no longer works. When I mouse over it for it to reappear, I can see that it hasn't saved changes, and crucially, I can no longer save changes to the document by clicking it.~~ - **FIXED**: Root cause was the typing detection interfering with the normal editor flow

## Root Cause Analysis

All issues stemmed from the typing detection being too aggressive. The original implementation counted **every** document change as "typing":

```typescript
// PROBLEMATIC - counted all changes
if (update.docChanged && !isProgrammaticUpdate.current) {
  typingCharCount.current++ // This counted everything!
}
```

This meant command palette opening, component builder opening, focus changes, etc. all counted as "typing", which:
1. Triggered false auto-saves
2. Interfered with normal editor operations 
3. Caused focus/event flow issues

## Fix Implementation

Changed to only count actual keyboard text input:

```typescript
// FIXED - only counts actual typing
if (update.transactions.some(tr => 
  tr.isUserEvent('input.type') && 
  tr.changes && 
  !tr.changes.empty
)) {
  typingCharCount.current++
}
```

Also added safeguards:
- Command palette and component builder now explicitly show bars when opened
- Added proper cleanup for typing detection timeout
- All checks pass and functionality restored

## Additional Issues Discovered - Deeper Architectural Problems

After fixing the typing detection, most issues persist, revealing deeper coupling problems:

### Keyboard Shortcut Inconsistency (Partially Separate Issue)
- **Outside editor**: Cmd+1 works via React event handling
- **Inside editor**: Cmd+1 triggers Tauri menu system (menu flashes), inconsistent behavior
- **After toggling once**: Subsequently works fine even in editor
- **Diagnosis**: Likely focus/listener setup issue, may be related to editor initialization

### Auto-Save Still Broken (Main Concern) - ROOT CAUSE IDENTIFIED
- Changed opacity from `0` to `0.01` to `90` - saving issues persist regardless
- **CRITICAL FINDING**: Auto-save works before hiding sidebars, breaks when both hidden, works again when sidebars shown
- **Console logs reveal**: Editor being destroyed/recreated repeatedly when both panels hidden:
  ```
  [Log] [Editor] viewRef.current exists: – false (repeated many times)
  [Log] [Editor] No editor view available to dispatch effect
  ```
- **Root Cause**: React re-render cascade from frequent `distractionFreeBarsHidden` state updates is unmounting/remounting Editor component
- **Currently testing**: Typing detection completely disabled to confirm this theory

### Architectural Red Flags

This feature should be completely isolated:
1. Typing detection → boolean state
2. Boolean state → CSS opacity
3. Mouse hover → reset boolean

**The fact that this affects auto-save and keyboard shortcuts suggests problematic coupling.**

### Potential Root Causes

1. **React Re-render Cascade**: Frequent `distractionFreeBarsHidden` updates causing excessive re-renders that interfere with other operations

2. **CodeMirror UpdateListener Interference**: Our typing detection in the `updateListener` might be disrupting normal editor event flow, even though we made it more specific

3. **State Update Timing**: Rapid state updates might cause race conditions with auto-save timers

4. **Focus Management**: The state changes might be affecting focus/blur behavior in unexpected ways

### Next Investigation Steps

1. ✅ **Test 90% opacity** - Save buttons still don't work, confirms not visibility issue
2. 🔄 **CURRENTLY TESTING: Typing detection disabled entirely** - If problems disappear, confirms re-render cascade theory
3. **If typing detection is the culprit, solutions**:
   - Add React.memo to Editor component to prevent unnecessary re-renders
   - Move distraction-free state to isolated store/context
   - Use CSS custom properties instead of React state
   - Debounce state updates significantly
4. **If problems persist even without typing detection** - Investigate other sources of re-renders

### Alternative Approaches If Current Fails

1. **CSS-Only Solution**: Use CSS custom properties updated via direct style manipulation
2. **Debounced Updates**: Reduce frequency of state changes
3. **Event-driven CSS**: Use CSS animations triggered by data attributes instead of React state

The goal is to find why a simple opacity toggle is affecting core editor functionality - this shouldn't happen in a well-architected system.
