# Claude Instructions for Astro Blog Editor

## Current Status

Current Task: Ready for next task (task-0-cleanup.md completed)

## Project Overview

**Goal:** Native macOS markdown editor specifically designed for Astro content collections. Creates a distraction-free writing environment with seamless frontmatter editing, inspired by iA Writer's design philosophy.

**Purpose:** Replace the need for code editors (VSCode/Cursor) when writing content. Provides a calm, focused environment for long-form writing while understanding Astro's content structure.

**Key Features:**

- Auto-discovers Astro content collections from `src/content/config.ts`
- Dynamic frontmatter forms generated from Zod schemas
- File management: create, rename, duplicate, delete with context menus
- Real-time auto-save every 2 seconds
- CodeMirror 6 editor with markdown support and custom syntax highlighting
- Resizable panels for optimal writing layout
- Draft detection and date-based file sorting
- Advanced editor features: URL clicking, drag & drop, markdown commands
- Comprehensive keyboard shortcuts and menu integration
- Toast notification system for user feedback throughout the app

## Core Rules

### New Sessions

- Read @docs/TASKS.md for instructions on task management and the locations of the current tasks.
- Review `docs/developer/architecture-guide.md` for architectural patterns
- Check git status and project structure for recent changes

### Development Practices

**CRITICAL:** Follow these practices strictly:

1. **Read Before Editing**: Always read files before modifying them to understand context and existing patterns
2. **Follow Established Patterns**: Use design patterns from this file and `docs/developer` to inform your decisions. Only introduce new patterns when necessary and document immediately.
3. **Senior Architect Mindset**: Apply expert-level thinking considering performance, maintainability, testability, and scalability
4. **Batch Operations**: Use multiple tool calls in single responses for efficiency when possible
5. **Match Code Style**: Follow the existing formatting and patterns in the specific file being edited
6. **Test Coverage**: Write comprehensive tests for business logic, edge cases, and integration points
7. **Quality Gates**: Run `npm run check:all` after significant changes to ensure all tests pass
8. **No Dev Server**: Ask user to run dev server and report back instead of executing it yourself
9. **No Unsolicited Commits**: Only create commits when explicitly requested
10. **Documentation**: Update `docs/developer/architecture-guide.md` and this file when introducing new patterns
11. **Removing files**: Always use `rm -f` in place of `rm`

### Documentation & Versions

- **Context7 First**: Always use Context7 for framework docs before WebSearch
- **Version Requirements**: Tauri v2.x, shadcn/ui v4.x, Tailwind v4.x, React 19.x, Zustand v5.x, CodeMirror v6.x, Vitest v3.x
- **Progress Tracking**: Update the current task in `docs/tasks-todo` after completing major work. You may use `docs/tasks.md` as a scratchpad for tasks which have no document in `docs/tasks-todo`

## Notification System

### Toast Notifications

The app uses a comprehensive toast notification system for user feedback. See `@docs/toast-system.md` for complete documentation.

**Key Components:**

- `src/lib/toast.ts` - Main API for dispatching notifications
- `src/lib/theme-provider.tsx` - Custom theme provider (replaces next-themes)
- `src/lib/rust-toast-bridge.ts` - Rust-to-frontend event bridge
- `src/components/ui/sonner.tsx` - Customized shadcn/ui component

**Usage:**

```typescript
import { toast } from '../lib/toast'

toast.success('File saved successfully')
toast.error('Operation failed', {
  description: 'Detailed error message',
  action: { label: 'Retry', onClick: () => retry() },
})
```

### Theme System

The app uses a **custom theme provider** (`src/lib/theme-provider.tsx`) instead of `next-themes` for Tauri compatibility. This provider:

- Manages light/dark mode switching
- Integrates with existing CSS variables system
- Supports system theme detection
- Provides context for toast notifications

The theme provider wraps the entire app in `App.tsx` and works with our existing CSS variable system defined in `App.css`. For shadcn/ui components that expect theme context, this provider ensures compatibility.

## Technology Stack

- **Framework:** Tauri v2 (Rust + React)
- **Frontend:** React 19 + TypeScript (strict)
- **State:** Zustand with persistence + local UI state
- **Styling:** Tailwind v4 + shadcn/ui
- **Editor:** CodeMirror 6 with custom extensions
- **Testing:** Vitest + React Testing Library, Cargo
- **Quality:** ESLint, Prettier, Clippy

**CRITICAL:** Use Tauri v2 documentation only. v1 approaches don't work.

**CRITICAL:** Always use modern Rust string formatting syntax: `format!("{variable}")` not `format!("{}", variable)`. This is required by Clippy and prevents compilation errors.

## Keyboard Shortcuts

The app uses `react-hotkeys-hook` for standardized, cross-platform keyboard shortcuts. This provides consistent behavior across macOS (Cmd) and Windows/Linux (Ctrl) using the `mod` key.

**Implementation Pattern:**
```typescript
import { useHotkeys } from 'react-hotkeys-hook'

// Cross-platform shortcut (Cmd on macOS, Ctrl on Windows/Linux)
useHotkeys('mod+s', () => {
  // Save file action
}, { preventDefault: true })
```

**Available Shortcuts:**
- `mod+s` - Save current file
- `mod+1` - Toggle sidebar
- `mod+2` - Toggle frontmatter panel
- `mod+n` - Create new file
- `mod+w` - Close current file
- `mod+comma` - Open preferences

**Benefits:**
- Cross-platform compatibility (automatically maps to Cmd/Ctrl)
- Declarative API vs manual event handling
- Built-in preventDefault handling
- Better performance and memory management

## Architecture Overview

**See `docs/architecture-guide.md` for comprehensive architectural patterns.**

### Core Architecture Principles

1. **Separation of Concerns**: Business logic (Zustand) vs UI orchestration (Layout) vs Editor logic (lib/editor)
2. **Modular Design**: Feature-based modules with clear interfaces
3. **Command Pattern**: Centralized command registry for editor operations
4. **Event-Driven Communication**: Multiple event systems for different concerns
5. **Performance-First**: Memoization, debouncing, and lazy loading patterns

### App Layout Structure

- **UnifiedTitleBar:** macOS-style window chrome with menu integration
- **Layout:** Main orchestrator container with ResizablePanelGroup system
  - **Sidebar:** Collection/file navigation (collapsible)
  - **MainEditor:** CodeMirror 6 markdown editor with extracted modules
  - **FrontmatterPanel:** Dynamic forms from Zod schemas (resizable)

### State Management Philosophy

#### Global State (Zustand)

Use for state that:

- Represents business data (files, content, frontmatter)
- Needs persistence across sessions
- Is accessed by multiple unrelated components
- Drives core application functionality

```typescript
// Business state in Zustand
projectPath: string | null
currentFile: FileEntry | null
editorContent: string
frontmatter: Record<string, unknown>
isDirty: boolean
```

#### Local State (React Components)

Keep state local when it:

- Only affects UI presentation
- Is derived from props or global state
- Doesn't need persistence
- Is tightly coupled to component lifecycle

```typescript
// UI state in Layout.tsx
const [windowWidth, setWindowWidth] = useState(window.innerWidth)
window.isEditorFocused = false // Global flag for menu coordination
```

**Why This Split?**

- **Performance**: Local state changes don't trigger global re-renders
- **Clarity**: Clear ownership of different concerns
- **Testability**: Business logic can be tested independently of UI
- **Maintainability**: Changes to UI don't affect business logic

### Data Flow

1. **Project Discovery:** Parse `src/content/config.ts` → extract collections & schemas
2. **File Loading:** Read markdown → separate frontmatter/content → populate editor
3. **Editing:** Direct store updates → auto-save every 2 seconds
4. **File Operations:** Tauri commands for create/rename/duplicate/delete
5. **Editor Operations:** Command registry → CodeMirror transactions

### Frontend Structure (Updated)

```
src/
├── components/
│   ├── Layout/              # Main app components
│   │   ├── Layout.tsx       # Main orchestrator (UI state)
│   │   ├── EditorView.tsx   # Editor component (refactored)
│   │   ├── Sidebar.tsx      # File navigation
│   │   └── FrontmatterPanel.tsx
│   └── ui/                  # shadcn/ui components (30+)
├── lib/
│   ├── editor/              # Extracted editor modules
│   │   ├── commands/        # Command pattern implementation
│   │   ├── dragdrop/        # Drag & drop handling
│   │   ├── extensions/      # CodeMirror extensions
│   │   ├── markdown/        # Markdown utilities
│   │   ├── paste/           # Paste handling
│   │   ├── syntax/          # Custom syntax highlighting
│   │   └── urls/            # URL detection and handling
│   ├── toast.ts             # Toast notification API
│   ├── theme-provider.tsx   # Custom theme provider (Tauri-compatible)
│   ├── rust-toast-bridge.ts # Rust-to-frontend event bridge
│   └── schema.ts            # Zod schema parsing
├── hooks/
│   └── editor/              # Editor-specific hooks
│       ├── useEditorSetup.ts
│       ├── useEditorHandlers.ts
│       └── useTauriListeners.ts
├── store/index.ts           # Zustand state management
├── types/common.ts          # Shared interfaces
└── test/                    # Vitest test files
```

### Backend Structure (Rust)

```
src-tauri/src/
├── commands/             # Tauri commands (files.rs, project.rs)
├── models/              # Data structures (Collection, FileEntry)
└── parser.rs            # TypeScript config parsing
```

## Front-End Architect Guidelines

### Code Extraction Patterns

#### When to Extract to `lib/`

Extract code into `lib/` when:

1. **Complexity Threshold**: 50+ lines of related logic
2. **Reusability**: Used by 2+ components
3. **Testability**: Needs unit tests
4. **Domain Logic**: Business rules or algorithms
5. **External Integration**: APIs, file system, etc.

Example module structure:

```
lib/editor/commands/
├── index.ts           # Public API exports
├── types.ts           # TypeScript interfaces
├── CommandRegistry.ts # Core implementation
├── editorCommands.ts  # Command definitions
└── menuIntegration.ts # Menu-specific logic
```

#### When to Extract to `hooks/`

Create custom hooks for:

1. **Stateful Logic**: Uses React hooks internally
2. **Component Logic**: Tightly coupled to React lifecycle
3. **Shared Behavior**: Same logic needed in multiple components
4. **Side Effects**: Manages subscriptions, timers, etc.

Example hook patterns:

```typescript
// Setup hook - initialization and configuration
export const useEditorSetup = (
  onSave: () => void,
  onFocus: () => void,
  onBlur: () => void
) => {
  // Returns configured extensions and setup functions
}

// Handler hook - event management
export const useEditorHandlers = () => {
  // Returns memoized event handlers
}
```

#### Extraction Process

1. **Identify the concern**: What single responsibility does this code have?
2. **Define the interface**: What's the minimal public API?
3. **Extract with tests**: Write tests for the extracted module
4. **Update imports**: Use index.ts for clean imports
5. **Document the module**: Add JSDoc comments for public APIs

### Module Organization Best Practices

1. **Feature-Based Modules**: Group related functionality together
2. **Clear Public APIs**: Use index.ts to define what's exposed
3. **Type Safety**: Separate types.ts for interfaces
4. **Dependency Management**: Avoid circular dependencies
5. **Testing Strategy**: Test modules independently

## Development Commands

### Development

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run tauri:dev        # Alternative dev
npm run tauri:build      # Build app
```

### Quality Checks

```bash
npm run check:all        # All checks (TS + Rust + tests)
npm run fix:all          # Auto-fix all issues
npm run typecheck        # TypeScript check
npm run lint             # ESLint
npm run format           # Prettier
npm run rust:clippy      # Rust linting
```

### Testing

```bash
npm run test             # Watch mode
npm run test:run         # Run once
npm run test:all         # Frontend + backend
npm run rust:test        # Rust only
npm run test:coverage    # Coverage report
```

### Data Management

```bash
npm run reset:testdata   # Reset test project
```

## Key Patterns

### Direct Store Pattern (CRITICAL)

**Problem:** React Hook Form + Zustand causes infinite loops when extracting components.
**Solution:** Components access store directly with `updateFrontmatterField`.

```tsx
// ✅ CORRECT: Direct store pattern
const StringField: React.FC<{
  name: string
  label: string
  required?: boolean
}> = ({ name, label, required }) => {
  const { frontmatter, updateFrontmatterField } = useAppStore()

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <Input
        value={frontmatter[name] ? String(frontmatter[name]) : ''}
        onChange={e => updateFrontmatterField(name, e.target.value)}
      />
    </div>
  )
}

// ❌ WRONG: Callback dependencies cause infinite loops
const BadField = ({ name, onChange }) => {
  /* Don't do this */
}
```

**Why:** Enables component extraction, prevents infinite loops, maintains real-time updates and auto-save.

### Command Pattern (Editor Operations)

The editor uses a centralized command registry for all operations:

```typescript
// Global registry instance
export const globalCommandRegistry = new CommandRegistry()

// Type-safe command execution
globalCommandRegistry.execute('toggleBold')
globalCommandRegistry.execute('formatHeading', 1)
```

**Benefits:**

- Decouples command definition from UI triggers
- Enables keyboard shortcuts, menus, and buttons to share logic
- Provides central place for command state management
- Facilitates testing and extensibility

### Event-Driven Communication

The app uses multiple event systems:

1. **Tauri Events**: For native menu/OS integration
2. **Custom DOM Events**: For component communication
3. **CodeMirror Transactions**: For editor state changes
4. **Zustand Subscriptions**: For store changes
5. **Toast Events**: For Rust-to-frontend notifications via rust-toast-bridge

Example:

```typescript
// Custom event for focus tracking
window.dispatchEvent(new CustomEvent('editor-focus-changed'))

// Tauri event for menu actions
listen('menu-format-bold', () => {
  globalCommandRegistry.execute('toggleBold')
})

// Toast event from Rust backend
listen('rust-toast', event => {
  toast.success(event.payload.message)
})
```

### Plugin Architecture (CodeMirror)

Editor functionality is composed through plugins:

```typescript
const extensions = [
  markdown({ extensions: [markdownStyleExtension] }),
  syntaxHighlighting(comprehensiveHighlightStyle),
  urlPlugin(),
  dropTargetPlugin(handleDrop),
  keymap.of(customKeymap),
]
```

This allows:

- Feature isolation
- Easy enable/disable of features
- Performance optimization
- Third-party plugin integration

### Command Palette Architecture

The app uses a centralized command system for all user actions. This pattern ensures consistency and enables keyboard shortcuts, menu items, and command palette to share the same logic.

#### Adding New Command Groups

To add a new command group to the command palette:

1. **Update Command Types** (`src/lib/commands/types.ts`):

```typescript
export type CommandGroup =
  | 'file'
  | 'navigation'
  | 'project'
  | 'settings'
  | 'ide'
  | 'your-new-group'

export interface CommandContext {
  // Add new context function if needed
  yourNewFunction: () => void
}
```

2. **Implement Context Function** (`src/lib/commands/command-context.ts`):

```typescript
export function useCommandContext(): CommandContext {
  return {
    // ... existing context
    yourNewFunction: () => {
      // Use custom events for UI communication
      window.dispatchEvent(new CustomEvent('your-custom-event'))
    },
  }
}
```

3. **Define Commands** (`src/lib/commands/app-commands.ts`):

```typescript
export const yourNewCommands: AppCommand[] = [
  {
    id: 'your-command',
    label: 'Your Command',
    description: 'Description of what this does',
    icon: YourIcon,
    group: 'your-new-group',
    execute: (context: CommandContext) => {
      context.yourNewFunction()
    },
    isAvailable: () => true,
  },
]

// Add to getAllCommands function
export function getAllCommands(context: CommandContext): AppCommand[] {
  return [
    // ... existing commands
    ...yourNewCommands,
  ].filter(command => command.isAvailable(context))
}
```

4. **Update Group Ordering** (`src/hooks/useCommandPalette.ts`):

```typescript
const groupOrder: Array<{ key: string; heading: string }> = [
  { key: 'file', heading: 'File' },
  { key: 'navigation', heading: 'Navigation' },
  { key: 'project', heading: 'Project' },
  { key: 'settings', heading: 'Settings' },
  { key: 'your-new-group', heading: 'Your Group' },
  { key: 'ide', heading: 'IDE' },
]
```

5. **Add Event Listener** (if needed, in `src/components/Layout/Layout.tsx`):

```typescript
useEffect(() => {
  const handleYourEvent = () => {
    // Handle the custom event
  }
  window.addEventListener('your-custom-event', handleYourEvent)
  return () => window.removeEventListener('your-custom-event', handleYourEvent)
}, [])
```

#### Custom Event Communication Pattern

For UI actions that need to communicate between command palette and components:

```typescript
// In command context
yourAction: () => {
  window.dispatchEvent(
    new CustomEvent('your-action-name', {
      detail: { optionalData: 'value' },
    })
  )
}

// In Layout component
useEffect(() => {
  const handleAction = (event: CustomEvent) => {
    // Access event.detail for any passed data
    performAction(event.detail)
  }
  window.addEventListener('your-action-name', handleAction)
  return () => window.removeEventListener('your-action-name', handleAction)
}, [])
```

**Why This Pattern:**

- Decouples command definitions from UI components
- Enables command reuse across keyboard shortcuts, menus, and palette
- Provides type-safe command execution
- Allows conditional command availability based on app state

#### Component Cleanup and Refactoring Safety

**CRITICAL:** Before making changes to components, always verify what's actually being used:

1. **Check for Duplicate Logic**: Search for similar functionality across components
2. **Verify Component Usage**: Check imports and references to see if components are actually used
3. **Step-by-Step Refactoring**: Clean up unused code first, then implement new features
4. **Immediate Verification**: Test each step to ensure nothing breaks

**Example Discovery Process:**

```bash
# Find all references to a component
rg "ComponentName" --type tsx

# Check if component is exported but not imported
grep -r "import.*ComponentName" src/

# Verify no broken functionality after cleanup
npm run check:all
```

**Why This Approach:**

- Prevents accumulation of dead code
- Reduces confusion during development
- Ensures refactoring doesn't break existing functionality
- Maintains clean architecture

## Editor System Architecture

### Custom Syntax Highlighting System

The editor uses a **comprehensive custom highlighting system** that replaces CodeMirror's default highlighting entirely.

**Location:** `src/lib/editor/syntax/`

#### Two-Part Styling System

1. **Custom Markdown Tags** (`markdownTags.ts`):

```typescript
export const markdownTags = {
  heading1: Tag.define(),
  heading2: Tag.define(),
  emphasis: Tag.define(),
  strong: Tag.define(),
  inlineCode: Tag.define(),
  // ... more tags
}
```

2. **Standard Language Tags** from `@lezer/highlight`:

- `tags.tagName`, `tags.attributeName` - HTML elements
- `tags.keyword`, `tags.string`, `tags.comment` - Programming constructs

#### Comprehensive Highlight Style

**Single source of truth** for all syntax highlighting:

```typescript
const comprehensiveHighlightStyle = HighlightStyle.define([
  {
    tag: markdownTags.heading1,
    fontSize: '1.8em',
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  { tag: tags.tagName, color: '#E11D48', fontWeight: 'bold' },
  // ... 50+ comprehensive style rules
])
```

**Color Families:**

- **Purple family:** Headings (H1-H6)
- **Orange/Red family:** Emphasis, strong text
- **Green family:** Code elements
- **Blue family:** Links, images, programming constructs
- **Red/Pink family:** HTML tags
- **Gray family:** Comments, utility elements

### CSS Styling System

The editor uses a **CSS variable-based theming system** that separates concerns between CodeMirror syntax highlighting and visual styling.

**Key Files:**

- `src/components/Layout/EditorTheme.css` - Color variables and typography
- `src/components/Layout/EditorView.css` - Container setup and integration

#### Core Patterns

1. **CSS Variables for Theming**: All colors and typography defined as CSS variables for easy theme switching
2. **Semantic Color Naming**: Variables named by purpose (`--editor-color-mdtag`) not appearance
3. **Dark Mode via CSS Class**: Light/dark themes switched by adding `.dark` class
4. **Responsive Typography**: Font sizes scale with viewport width using media queries
5. **iA Writer Typography**: Custom variable fonts with specific weights and line heights

#### Integration with CodeMirror

- **Separation of Concerns**: CodeMirror identifies tokens, CSS variables provide colors
- **Class-based Styling**: Special features like inline code use CSS classes for styling
- **Container Queries Ready**: Editor container set up for future responsive features

**When working with CSS:** Check the theme files above for existing variables and patterns. All editor colors should use CSS variables, never hardcoded values.

### Editor Features

- ✅ **Markdown:** Headings, bold, italic, ~~strikethrough~~, links, lists, blockquotes, tables
- ✅ **Code:** Inline `code`, `code blocks`, syntax highlighting
- ✅ **HTML:** `<tags>`, attributes, mixed content
- ✅ **Programming:** Keywords, strings, comments, operators
- ✅ **URL Handling:** Alt+click to open URLs
- ✅ **Drag & Drop:** Files with auto-copy to assets
- ✅ **Paste Enhancement:** URL detection and link creation
- ✅ **Command System:** Keyboard shortcuts and menu integration

## Performance Patterns

### Memoization Strategy

```typescript
// Memoize expensive computations
const sortedFiles = useMemo(
  () => files.sort((a, b) => compareDates(a, b)),
  [files]
)

// Stable callbacks for child components
const handleChange = useCallback(
  (value: string) => {
    setEditorContent(value)
  },
  [setEditorContent]
)
```

### Debouncing

```typescript
// Auto-save debouncing
scheduleAutoSave: () => {
  clearTimeout(timeoutId)
  timeoutId = setTimeout(() => saveFile(), 2000)
}
```

### Lazy Loading

- Dynamic imports for large dependencies
- Defer heavy operations until needed
- Virtualize long lists (future consideration)

## Testing Strategy

### Frontend (Vitest + React Testing Library)

- **Unit Tests**: Extracted modules in `lib/editor/`
- **Integration Tests**: Custom hooks
- **Component Tests**: UI interactions
- **Store Tests**: Zustand actions and state
- Mock Tauri with `globalThis.mockTauri`

### Backend (Cargo)

- File operations with temp files
- Data structure validation
- Complete workflow integration
- Error scenarios (permissions, missing files)

### Test Data

- `test/dummy-astro-project/` contains sample Astro project
- Use `npm run reset:testdata` for clean test environment
- Covers various frontmatter configurations and content types

## Code Quality Standards

### TypeScript Requirements

- Strict mode enabled
- No `any` types
- Explicit interface definitions
- Type-safe store usage

### Component Guidelines

- Use shadcn/ui v4 components first (NOT v3)
- Direct Store Pattern for all state modification
- Extract helper components for repeated JSX (3+ times)
- Create reusable interfaces in `src/types/common.ts`
- Use `EditorAreaWithFrontmatter` pattern for layout helpers

### Module Guidelines

- Feature-based organization
- Clear public APIs via index.ts
- Separate types.ts for interfaces
- Comprehensive JSDoc comments
- Unit tests for all public functions

### Styling Standards

- Tailwind v4 utilities over custom CSS
- Standard spacing: `p-4` panels, `gap-2` small, `gap-4` large
- Icons: `h-4 w-4` standard, `h-8` toolbar
- CSS variables: `bg-background`, `text-foreground`
- ResizablePanel system for layout management

## File Operations

### File Management

- All I/O through Tauri commands
- File watching with change detection
- Frontmatter parsing and validation
- MDX import handling
- Context menu operations (create, rename, duplicate, delete)

### Frontmatter Generation

- Parse Zod schemas from `src/content/config.ts` into JSON
- Generate dynamic forms for frontmatter editing
- Field types: string, number, boolean, date, enum, array
- Auto-focus title field on new file creation
- Schema field ordering preserved in saved frontmatter

## WebKit/Tauri Considerations

- `field-sizing: content` CSS not supported → use `AutoExpandingTextarea`
- WebKit behavior differs from Chrome DevTools
- JavaScript-based auto-expansion for textareas
- Tauri v2 has different API than v1 (different import paths, command structure)

## Best Practices

### Before Committing

1. Run `npm run check:all` - all tests/linting must pass
2. Update `docs/tasks.md` with completed work
3. Manual testing for UI changes
4. Check for console errors in development

### Component Development

- **NEVER** use React Hook Form (causes infinite loops with Zustand)
- **ALWAYS** use Direct Store Pattern: `updateFrontmatterField(key, value)`
- **AVOID** callback props with changing dependencies
- **EXTRACT** helper components for duplicate patterns (see `EditorAreaWithFrontmatter`)
- **TYPE** store destructuring explicitly for IDE support

### Module Development

- **EXTRACT** complex logic into `lib/` modules
- **CREATE** hooks for stateful component logic
- **DEFINE** clear interfaces and types
- **WRITE** comprehensive tests
- **DOCUMENT** public APIs

### Performance Best Practices

- **MEMOIZE** expensive computations
- **DEBOUNCE** frequent operations (auto-save, search)
- **LAZY LOAD** heavy dependencies
- **VIRTUALIZE** long lists (future)

### Error Handling

- Graceful degradation for missing files/permissions
- Development-only console logging
- User-friendly error messages
- Validation before file operations
- Recovery from file system errors

## Key Files Reference

### Essential Files

- `src/store/index.ts` - Zustand state management
- `src/lib/editor/` - Extracted editor modules
- `src/hooks/editor/` - Editor-specific hooks
- `src/components/Layout/Layout.tsx` - Main UI orchestrator
- `src/components/Layout/EditorView.tsx` - Refactored editor component
- `src/lib/schema.ts` - Zod schema parsing and validation
- `src/types/common.ts` - Shared TypeScript interfaces

### Configuration Files

- `components.json` - shadcn/ui setup
- `vitest.config.ts` - Testing configuration
- `src-tauri/tauri.conf.json` - App configuration

### Documentation

- `docs/architecture-guide.md` - Comprehensive architecture patterns
- `docs/tasks.md` - Current roadmap and status
- `docs/ia-writer-ui.md` - UI design specifications
- `docs/toast-system.md` - Complete toast notification system documentation

## Troubleshooting

### Common Issues

- **Infinite loops:** Ensure Direct Store Pattern, not callback props
- **Auto-save not working:** Check `scheduleAutoSave()` calls and 2s interval
- **File watching issues:** Verify file permissions and project paths
- **Schema parsing errors:** Check `src/content/config.ts` syntax
- **Version conflicts:** Use Tauri v2, shadcn/ui v4, Tailwind v4 docs only
- **Editor commands not working:** Verify command registry setup
- **Toast notifications not working:** Check `@docs/toast-system.md` for troubleshooting
- **Theme switching issues:** Verify theme provider is wrapping app in `App.tsx`

### Performance Issues

- **Slow editor:** Check for unnecessary re-renders
- **Memory leaks:** Ensure proper cleanup in useEffect
- **File operations slow:** Verify Tauri command efficiency

### Debug Strategies

- Use React DevTools for component inspection
- Check browser console for errors
- Use Tauri dev tools for backend debugging
- Run tests to isolate issues

## Architecture Notes

### Current Limitations

- macOS only (initial version)
- Standard Astro project structures only
- Basic Zod schema types supported
- Regex-based TypeScript parsing

### Future Extensibility

The architecture supports:

- **Plugin System**: Command registry and extension points
- **Theme System**: Custom editor themes
- **Language Support**: Beyond markdown
- **AI Integration**: Via command registry
- **Export Formats**: Via new modules
- **Cloud Sync**: Via store middleware

### Migration Notes

- Major refactor completed: EditorView.tsx → modular lib/editor system
- Command pattern implemented for editor operations
- Custom syntax highlighting system established
- Testing infrastructure comprehensive
- Toast notification system implemented with Rust bridge
- Custom theme provider added for Tauri compatibility

---

_This document reflects the current architecture as of Phase 3.1. Update as the project evolves and new patterns emerge._
