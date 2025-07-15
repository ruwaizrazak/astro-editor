# Claude Instructions for Astro Blog Editor

## Project Overview

Native macOS markdown editor for Astro content collections. Creates a distraction-free writing environment with seamless frontmatter editing, inspired by iA Writer.

## Core Rules

### New Sessions
- Read `docs/tasks.md` for current status and next steps
- Check git status and project structure for recent changes

### Progress Tracking
- **CRITICAL:** Update `docs/tasks.md` after completing major work - mark completed items with `[x]`
- Update planning documents when moving between phases

### Documentation Lookup
- **Always use Context7 first** for major frameworks/libraries documentation
- Use `mcp__context7__resolve-library-id` then `mcp__context7__get-library-docs`
- Only use WebSearch if Context7 lacks the needed information
- Common Context7 queries: Tauri v2, React, Zustand, CodeMirror, Tailwind, Vitest

## Current Status

**Phase 2.3 - Complete** (UI refinement and code quality)
- All core functionality implemented
- shadcn/ui components integrated
- Comprehensive test suite (121 tests passing)
- File operations: create, rename, duplicate, context menus
- Auto-save every 2 seconds
- Frontmatter panel with dynamic forms

**Next:** Phase 3 - Editor experience improvements

## Technology Stack

- **Framework:** Tauri v2 (Rust + React)
- **Frontend:** React 19 + TypeScript (strict)
- **State:** Zustand with persistence
- **Styling:** Tailwind v4 + shadcn/ui
- **Editor:** CodeMirror 6
- **Testing:** Vitest + React Testing Library, Cargo
- **Quality:** ESLint, Prettier, Clippy

**CRITICAL:** Use Tauri v2 documentation only. v1 approaches don't work.

## Architecture

### Frontend Structure
```
src/
├── components/
│   ├── Layout/           # Main app components
│   └── ui/               # shadcn/ui components (30+)
├── store/index.ts        # Zustand state management
├── lib/schema.ts         # Zod schema parsing
├── types/common.ts       # Shared interfaces
└── hooks/                # React hooks
```

### Backend Structure (Rust)
```
src-tauri/src/
├── commands/             # Tauri commands
├── models/              # Data structures
└── parser.rs            # TypeScript parsing
```

### Project Structure
```
blog-editor/
├── docs/                # Documentation
├── test/dummy-astro-project/  # Test data
├── src/                 # React app
├── src-tauri/           # Rust backend
├── components.json      # shadcn/ui config
└── package.json
```

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
**Problem:** React Hook Form + Zustand causes infinite loops.
**Solution:** Direct store access with `updateFrontmatterField`.

```tsx
// Reusable field component
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
```

**Benefits:** No infinite loops, extractable components, real-time updates, auto-save works.

### State Management
- Single Zustand store in `src/store/index.ts`
- Async actions for file operations
- State persistence for project/UI preferences
- Auto-save every 2 seconds with debouncing

### File Operations
- All I/O through Tauri commands
- File watching with change detection
- Frontmatter parsing and validation
- MDX import handling

### Form Generation
- Dynamic forms from Zod schemas
- Field types: string, number, boolean, date, enum, array
- Direct store updates (no React Hook Form)
- Components: `StringField`, `BooleanField`, `DateField`, etc.

## Code Quality

### TypeScript Requirements
- Strict mode enabled
- No `any` types
- Explicit interface definitions
- Type-safe store usage

### Component Guidelines
- Use shadcn/ui components first
- Direct Store Pattern for state modification
- Extract helper components for repeated JSX (3+ times)
- Create reusable interfaces in `src/types/common.ts`

### Styling
- Tailwind utilities over custom CSS
- Standard spacing: `p-4` panels, `gap-2` small, `gap-4` large
- Icons: `h-4 w-4` standard, `h-8` toolbar
- CSS variables: `bg-background`, `text-foreground`

## Testing Strategy

### Frontend (Vitest + React Testing Library)
- Store operations and async actions
- Component rendering and interactions
- Error handling and edge cases
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

## WebKit/Tauri Considerations
- `field-sizing: content` CSS not supported → use `AutoExpandingTextarea`
- WebKit behavior differs from Chrome DevTools
- Use JavaScript-based auto-expansion for textareas

## Best Practices

### Before Committing
1. Run `npm run check:all` - all tests/linting must pass
2. Update `docs/tasks.md` with completed work
3. Manual testing for UI changes

### Component Development
- **NEVER** use React Hook Form for new components
- **ALWAYS** use Direct Store Pattern for state changes
- **AVOID** callback props with changing dependencies
- **EXTRACT** helper components for duplicate patterns
- **TYPE** store destructuring explicitly

### Error Handling
- Graceful degradation for missing files/permissions
- User-friendly error messages
- Validation before file operations
- Recovery from file system errors

## Key Files Reference

### Essential
- `src/store/index.ts` - State management with `updateFrontmatterField`
- `src/lib/schema.ts` - Zod schema parsing and validation
- `src/types/common.ts` - Shared TypeScript interfaces
- `src/components/Layout/FrontmatterPanel.tsx` - Direct Store Pattern example

### Configuration
- `components.json` - shadcn/ui setup
- `vitest.config.ts` - Testing configuration
- `src-tauri/tauri.conf.json` - App configuration

## Troubleshooting

### Common Issues
- **Infinite loops:** Check Direct Store Pattern usage
- **Auto-save not working:** Verify `scheduleAutoSave()` calls
- **File watching issues:** Check file permissions and paths
- **Schema parsing errors:** Validate TypeScript config syntax

### Performance
- Target <2s app launch, <100ms file operations
- Use virtualization for large collections
- Debounce file watching updates
- Optimize re-renders with proper memoization

## Architecture Notes

### Limitations
- macOS only (initial version)
- Standard Astro project structures only
- Basic Zod schema types supported
- Regex-based TypeScript parsing

### Future Improvements
- Cross-platform support
- Enhanced schema parsing
- Advanced editor features
- Performance optimizations

---

*Keep this updated as the project evolves. Verify implementation matches guidance.*