# Claude Instructions for Astro Blog Editor

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

## Core Rules

### New Sessions
- Read `docs/tasks.md` for current status and next steps
- Review `docs/architecture-guide.md` for architectural patterns
- Check git status and project structure for recent changes

### Progress Tracking
- **CRITICAL:** Update `docs/tasks.md` after completing major work - mark completed items with `[x]`
- Update planning documents when moving between phases

### Documentation Lookup
- **Always use Context7 first** for major frameworks/libraries documentation
- Use `mcp__context7__resolve-library-id` then `mcp__context7__get-library-docs`
- Only use WebSearch if Context7 lacks the needed information
- **CRITICAL VERSION REQUIREMENTS:**
  - Tauri v2.x (NOT v1 - different API)
  - shadcn/ui v4.x with Tailwind v4.x (NOT v3)
  - React 19.x
  - Zustand v5.x
  - CodeMirror v6.x
  - Vitest v3.x

## Current Status

**Phase 3.1 - In Progress** (Advanced editor features)
- ✅ Core functionality implemented with comprehensive test suite (83 frontend, 42 Rust tests)
- ✅ Major EditorView.tsx refactor extracting functionality into modular lib/editor system
- ✅ Advanced editor features: URL clicking, drag & drop, paste handling, markdown commands
- ✅ Command registry pattern for extensible editor operations
- ✅ Custom syntax highlighting system with comprehensive markdown support
- ✅ File operations with native context menus
- ✅ Auto-save with conflict resolution
- ✅ Responsive UI with resizable panels

**Current Focus:** Polish, usability improvements, and command palette implementation

## Technology Stack

- **Framework:** Tauri v2 (Rust + React)
- **Frontend:** React 19 + TypeScript (strict)
- **State:** Zustand with persistence + local UI state
- **Styling:** Tailwind v4 + shadcn/ui
- **Editor:** CodeMirror 6 with custom extensions
- **Testing:** Vitest + React Testing Library, Cargo
- **Quality:** ESLint, Prettier, Clippy

**CRITICAL:** Use Tauri v2 documentation only. v1 approaches don't work.

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
const BadField = ({ name, onChange }) => { /* Don't do this */ }
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

Example:
```typescript
// Custom event for focus tracking
window.dispatchEvent(new CustomEvent('editor-focus-changed'))

// Tauri event for menu actions
listen('menu-format-bold', () => {
  globalCommandRegistry.execute('toggleBold')
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
  keymap.of(customKeymap)
]
```

This allows:
- Feature isolation
- Easy enable/disable of features
- Performance optimization
- Third-party plugin integration

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
  { tag: markdownTags.heading1, fontSize: '1.8em', fontWeight: 'bold', color: '#8B5CF6' },
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
- ✅ **Code:** Inline `code`, ```code blocks```, syntax highlighting
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
const sortedFiles = useMemo(() => 
  files.sort((a, b) => compareDates(a, b)),
  [files]
)

// Stable callbacks for child components
const handleChange = useCallback((value: string) => {
  setEditorContent(value)
}, [setEditorContent])
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

## Troubleshooting

### Common Issues
- **Infinite loops:** Ensure Direct Store Pattern, not callback props
- **Auto-save not working:** Check `scheduleAutoSave()` calls and 2s interval
- **File watching issues:** Verify file permissions and project paths
- **Schema parsing errors:** Check `src/content/config.ts` syntax
- **Version conflicts:** Use Tauri v2, shadcn/ui v4, Tailwind v4 docs only
- **Editor commands not working:** Verify command registry setup

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

---

*This document reflects the current architecture as of Phase 3.1. Update as the project evolves and new patterns emerge.*