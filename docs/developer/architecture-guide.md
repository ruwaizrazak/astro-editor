# Architecture Guide

## Overview

This document details the architectural patterns and principles used in the Astro Blog Editor. It serves as a reference for maintaining consistency and understanding the reasoning behind key design decisions.

## Core Architecture Principles

### 1. Separation of Concerns

The codebase follows a clear separation between different types of concerns:

- **Business Logic**: Lives in Zustand store (`src/store/index.ts`)
- **UI Orchestration**: Managed by container components (e.g., `Layout.tsx`)
- **Editor Logic**: Isolated in `src/lib/editor/` modules
- **Reusable UI Logic**: Extracted to `src/hooks/`
- **Pure UI Components**: In `src/components/`

### 2. State Management Philosophy

#### Global State (Zustand)
Use Zustand for state that:
- Represents business data (files, content, frontmatter)
- Needs persistence across sessions
- Is accessed by multiple unrelated components
- Drives core application functionality

Examples:
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

Examples:
```typescript
// UI state in Layout.tsx
const [windowWidth, setWindowWidth] = useState(window.innerWidth)
window.isEditorFocused = false // Global flag for menu coordination
```

#### Why This Split?
- **Performance**: Local state changes don't trigger global re-renders
- **Clarity**: Clear ownership of different concerns
- **Testability**: Business logic can be tested independently of UI
- **Maintainability**: Changes to UI don't affect business logic

### 3. Module Organization

#### Feature Modules (`src/lib/editor/`)

Each feature is a self-contained module with:
- `index.ts` - Public API exports
- `types.ts` - TypeScript interfaces
- Implementation files with descriptive names
- Tests alongside implementation

Example structure:
```
commands/
├── index.ts           # Public exports
├── types.ts           # Interfaces
├── CommandRegistry.ts # Core implementation
├── editorCommands.ts  # Command definitions
└── menuIntegration.ts # Menu-specific logic
```

#### When to Create a Module

Extract code into `lib/` when:
1. It's a distinct feature with 3+ functions
2. It's used by multiple components
3. It has complex logic that benefits from isolation
4. It could be tested independently
5. It might be extended in the future

### 4. Hook Patterns

#### Custom Hooks (`src/hooks/`)

Create custom hooks for:
- Encapsulating stateful logic
- Sharing behavior between components
- Managing side effects
- Integrating with external systems

Example patterns:
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

// Integration hook - external system integration
export const useTauriListeners = (editorView: EditorView | null) => {
  // Sets up and tears down external event listeners
}
```

#### Hook Best Practices
1. Prefix with `use` for clarity
2. Return stable references (use `useCallback`, `useMemo`)
3. Handle cleanup in effect returns
4. Keep focused on a single concern
5. Document dependencies clearly

## Architectural Patterns

### 1. Command Pattern

The editor uses a command registry pattern for operations:

```typescript
// Global registry instance
export const globalCommandRegistry = new CommandRegistry()

// Type-safe command execution
globalCommandRegistry.execute('toggleBold')
globalCommandRegistry.execute('formatHeading', 1)
```

Benefits:
- Decouples command definition from UI triggers
- Enables keyboard shortcuts, menus, and buttons to share logic
- Provides central place for command state management
- Facilitates testing and extensibility

### 2. Plugin Architecture (CodeMirror)

Editor functionality is composed through plugins:

```typescript
const extensions = [
  markdown({ extensions: [markdownStyleExtension] }),
  syntaxHighlighting(comprehensiveHighlightStyle),
  urlPlugin(),
  dropTargetPlugin(handleDrop),
  // ... more plugins
]
```

This allows:
- Feature isolation
- Easy enable/disable of features
- Performance optimization
- Third-party plugin integration

### 3. Event-Driven Communication

The app uses multiple event systems:

1. **Tauri Events**: For native menu/OS integration
2. **Custom DOM Events**: For component communication
3. **CodeMirror Transactions**: For editor state changes
4. **Zustand Subscriptions**: For store changes

Example:
```typescript
// Custom event for focus tracking
window.dispatchEvent(new CustomEvent('editor-focus-changed'))

// Tauri event for menu actions
listen('menu-format-bold', () => {
  globalCommandRegistry.execute('toggleBold')
})
```

## Keyboard Shortcuts

The app uses `react-hotkeys-hook` for standardized, cross-platform keyboard shortcuts. This replaces manual event handling and provides consistent behavior across operating systems.

### Implementation Pattern

```typescript
import { useHotkeys } from 'react-hotkeys-hook'

// Cross-platform shortcut (Cmd on macOS, Ctrl on Windows/Linux)
useHotkeys('mod+s', () => {
  // Save file action
}, { preventDefault: true })
```

### Key Benefits

- **Cross-platform compatibility**: `mod` key automatically maps to Cmd (macOS) or Ctrl (Windows/Linux)
- **Declarative API**: Define shortcuts where they're used, not in global event handlers
- **Performance**: Built-in event management and cleanup
- **Type safety**: Better TypeScript integration than manual event handling

### Integration with Command System

Keyboard shortcuts work seamlessly with the command registry:

```typescript
useHotkeys('mod+b', () => {
  globalCommandRegistry.execute('toggleBold')
}, { preventDefault: true })
```

This allows the same actions to be triggered from:
- Keyboard shortcuts
- Menu items
- Command palette
- Programmatic calls

## Code Extraction Guidelines

### When to Extract to `lib/`

1. **Complexity Threshold**: 50+ lines of related logic
2. **Reusability**: Used by 2+ components
3. **Testability**: Needs unit tests
4. **Domain Logic**: Business rules or algorithms
5. **External Integration**: APIs, file system, etc.

### When to Extract to `hooks/`

1. **Stateful Logic**: Uses React hooks internally
2. **Component Logic**: Tightly coupled to React lifecycle
3. **Shared Behavior**: Same logic needed in multiple components
4. **Side Effects**: Manages subscriptions, timers, etc.

### Extraction Process

1. **Identify the concern**: What single responsibility does this code have?
2. **Define the interface**: What's the minimal public API?
3. **Extract with tests**: Write tests for the extracted module
4. **Update imports**: Use index.ts for clean imports
5. **Document the module**: Add JSDoc comments for public APIs

## Performance Patterns

### 1. Memoization

Use memoization strategically:
```typescript
// Memoize expensive computations
const sortedFiles = useMemo(() => 
  files.sort((a, b) => compareDates(a, b)),
  [files]
)

// Stable callbacks for child components
const handleChange = useCallback((value: string) => {
  setEditorContent(value)
}, [setEditorContent])
```

### 2. Lazy Loading

- Defer heavy operations until needed
- Use dynamic imports for large dependencies
- Virtualize long lists

### 3. Debouncing

Critical for editor performance:
```typescript
// Auto-save debouncing
scheduleAutoSave: () => {
  clearTimeout(timeoutId)
  timeoutId = setTimeout(() => saveFile(), 2000)
}
```

## Testing Strategy

### Unit Tests (Modules)

Test extracted modules thoroughly:
```typescript
// lib/editor/markdown/formatting.test.ts
describe('toggleMarkdown', () => {
  it('should wrap selection with markers', () => {
    // Test the pure logic
  })
})
```

### Integration Tests (Hooks)

Test hooks with React Testing Library:
```typescript
// hooks/editor/useEditorHandlers.test.tsx
describe('useEditorHandlers', () => {
  it('should save on blur when dirty', () => {
    // Test the hook behavior
  })
})
```

### Component Tests

Focus on user interactions:
```typescript
// components/Layout/EditorView.test.tsx
describe('EditorView', () => {
  it('should highlight URLs on alt hover', async () => {
    // Test the integrated behavior
  })
})
```

## Future Extensibility

### Plugin System Considerations

The architecture is designed to support future plugins:

1. **Command Registry**: New commands can be registered
2. **CodeMirror Extensions**: New editor features as extensions
3. **Module Structure**: New modules follow established patterns
4. **Event System**: New integrations via event listeners

### Planned Extension Points

1. **Theme System**: Custom editor themes
2. **Language Support**: Beyond markdown
3. **AI Integration**: Via command registry
4. **Export Formats**: Via new modules
5. **Cloud Sync**: Via store middleware

## Common Pitfalls to Avoid

1. **Don't mix concerns**: Keep business logic out of components
2. **Don't over-optimize**: Measure before memoizing everything
3. **Don't bypass the store**: All business state changes go through Zustand
4. **Don't create circular dependencies**: Use index.ts exports
5. **Don't ignore TypeScript**: Leverage types for safety

## Decision Log

### Why Not React Hook Form?
- Causes infinite loops with Zustand
- Direct store pattern is simpler and more performant
- Better real-time sync with auto-save

### Why CodeMirror over Monaco?
- Better markdown support
- Lighter weight
- More extensible for our use case
- Better mobile support (future)

### Why Tauri over Electron?
- Smaller bundle size
- Better performance
- Native feel on macOS
- Rust safety for file operations

## Module Dependency Graph

```
App
├── Layout (orchestrator)
│   ├── Sidebar
│   ├── EditorView
│   │   ├── hooks/editor/* (setup, handlers)
│   │   └── lib/editor/* (commands, syntax, etc.)
│   └── FrontmatterPanel
├── store (Zustand)
│   └── lib/schema (parsing)
└── Tauri Commands (Rust)
```

This architecture ensures:
- Clear data flow
- Testable modules
- Extensible design
- Performance optimization
- Maintainable codebase