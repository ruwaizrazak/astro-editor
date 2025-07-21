# UnifiedTitleBar Component

The UnifiedTitleBar is the main toolbar that appears at the top of the application, containing navigation controls, project information, and key action buttons.

## Overview

Located at `src/components/layout/UnifiedTitleBar.tsx`, this component provides a unified interface for:
- Window controls (macOS traffic lights)
- Panel toggles (sidebar, frontmatter panel)
- File operations (new file, save)
- View modes (focus mode)
- Project context display

## Layout Structure

The toolbar is divided into three main sections:

### Left Section
- **Traffic Lights**: Custom macOS window controls (close, minimize, maximize)
- **Sidebar Toggle**: Shows/hides the file sidebar panel
- **Project Name**: Displays the current project directory name

### Center Section
- Flexible space for potential future additions
- Currently used for drag region

### Right Section
- **New File Button**: Creates new files in the selected collection (conditional)
- **Focus Mode Toggle**: Toggles distraction-free editing mode
- **Save Button**: Manual save trigger (shows dirty state)
- **Frontmatter Panel Toggle**: Shows/hides the frontmatter editing panel

## Button Patterns

### Standard Icon Buttons
Use the `size="sm"` variant with custom sizing for all icon-only buttons:

```tsx
<Button
  onClick={handleAction}
  variant="ghost"
  size="sm"
  className="size-7 p-0 [&_svg]:transform-gpu [&_svg]:scale-100"
  title="Button Description"
>
  <IconComponent className="size-4" />
</Button>
```

### Conditional Rendering
Some buttons are conditionally rendered based on application state:

```tsx
{selectedCollection && (
  <Button>
    <Plus className="size-4" />
  </Button>
)}
```

### State Toggle Buttons
For buttons that represent toggleable state, use the same Button pattern but change the icon to reflect the current state:

```tsx
<Button
  onClick={handleToggle}
  variant="ghost"
  size="sm"
  className="size-7 p-0 [&_svg]:transform-gpu [&_svg]:scale-100"
  title={isEnabled ? 'Disable Feature' : 'Enable Feature'}
>
  {isEnabled ? (
    <DisabledIcon className="size-4" />
  ) : (
    <EnabledIcon className="size-4" />
  )}
</Button>
```

## Critical Fix: SVG Icon Positioning

### Problem
SVG icons in disabled buttons experience a 1-pixel shift due to browser rendering differences when the `disabled` attribute is applied. This is a known issue with shadcn/ui buttons.

### Solution
**Always apply the CSS transform fix for ALL icon buttons (not just disabled ones):**

```tsx
<Button
  disabled={someCondition}
  className="size-7 p-0 [&_svg]:transform-gpu [&_svg]:scale-100"
>
  <Save className="size-4" />
</Button>
```

### Explanation
- `[&_svg]:transform-gpu` enables hardware acceleration for SVG rendering
- `[&_svg]:scale-100` applies `transform: scale(1)` to stabilize positioning
- This prevents pixel shifts when the button's disabled state changes
- The base Button component remains unchanged - the transform fix in UnifiedTitleBar overrides any positioning issues

## State Management

The UnifiedTitleBar connects to multiple Zustand stores:

- **EditorStore**: File operations (`saveFile`, `isDirty`, `currentFile`)
- **ProjectStore**: Project context (`projectPath`, `selectedCollection`)  
- **UIStore**: Panel visibility and view modes (`sidebarVisible`, `focusModeEnabled`, etc.)

## Styling

### Background Behavior
The toolbar background adapts based on panel visibility:
- When both panels are hidden: Uses editor background color for seamless integration
- When panels are visible: Uses standard background with border

### Drag Region
Most of the toolbar area is designated as a drag region for window manipulation using `data-tauri-drag-region`. Interactive elements explicitly exclude themselves from the drag region.

## Adding New Buttons

### Checklist for New Icon Buttons
1. Use `size="sm"` with `className="size-7 p-0"` for consistent sizing
2. Add descriptive `title` attribute for accessibility
3. **Always** apply the SVG transform fix (required for all icon buttons):
   ```tsx
   className="size-7 p-0 [&_svg]:transform-gpu [&_svg]:scale-100"
   ```
4. Use `variant="ghost"` for toolbar integration
5. Exclude from drag region (buttons are automatically excluded)
6. Consider conditional rendering based on application state

### Example Pattern
```tsx
<Button
  onClick={handleNewAction}
  variant="ghost"
  size="sm"
  disabled={!someRequiredState}
  title="Action Description"
  className="size-7 p-0 [&_svg]:transform-gpu [&_svg]:scale-100"
>
  <ActionIcon className="size-4" />
</Button>
```

## Testing Considerations

When adding new buttons:
1. Test both enabled and disabled states
2. Verify icon positioning remains stable
3. Check tooltip accessibility
4. Test keyboard navigation
5. Verify proper conditional rendering

## Related Documentation

- [Architecture Guide](./architecture-guide.md) - Overall component patterns
- [Toast System](./toast-system.md) - For operation feedback
- Store documentation in the main architecture guide