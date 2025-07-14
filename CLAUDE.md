# Claude Instructions for Astro Blog Editor Project

## Project Overview

This is a macOS markdown editor specifically designed for managing and editing Astro content collections. The goal is to create a beautiful, distraction-free writing environment that understands Astro's content structure and provides seamless frontmatter editing.

## Core Rules

### Progress Tracking

- **CRITICAL:** After completing any major piece of work, you MUST update `planning.md` and check off completed items in the implementation phases
- Mark tasks as completed using `[x]` instead of `[ ]` in the planning document
- When moving between phases, update the planning document to reflect current status
- If you complete multiple related tasks, update them all at once to keep the plan current

### Development Approach

- Follow the implementation roadmap outlined in `planning.md`
- Start with Phase 1 (Core Foundation) and work sequentially through phases
- Each phase has specific deliverables - ensure these are met before moving to the next phase
- Prioritize the editor experience above all else - this is the heart of the application

### Technology Stack (DECIDED - Do Not Change)

- **Framework:** Tauri v2 (Rust backend + React frontend)
- **Text Editor:** CodeMirror 6
- **Frontend:** React + TypeScript
- **State Management:** Zustand
- **Styling:** Tailwind CSS + shadcn/ui components
- **Icons:** Lucide React
- **Parsing:** Tree-sitter for TypeScript/Astro config parsing

**CRITICAL:** This project uses Tauri v2. Always refer to Tauri v2 documentation and patterns. Many Tauri v1 approaches and APIs do NOT work in v2. When searching for solutions or examples, specifically look for "Tauri v2" or "Tauri 2.x" content.

### Code Quality

- Always use TypeScript with strict typing
- Follow the architecture patterns outlined in `planning.md`
- Implement proper error handling and graceful degradation
- Write performant code - target < 2 second app launch, < 100ms file operations

### Design Philosophy

- Follow iA Writer's design principles for typography and layout
- Implement hanging hash marks for headings (key visual feature)
- Hide frontmatter and MDX imports from the editor view
- Focus on distraction-free writing experience

### File Organization

- Keep the planning document updated as the source of truth
- Use the backend structure outlined in `planning.md` for Rust code
- Follow the frontend component hierarchy for React components
- Document major architectural decisions in `planning.md`

## Current Status

**Phase:** Planning Complete
**Next Step:** Begin Phase 1 - Core Foundation (Week 1-2)

## Key Implementation Notes

1. **Frontmatter Hiding:** Must parse markdown to identify frontmatter boundaries and hide from CodeMirror while preserving in file
2. **Astro Config Parsing:** Need to parse TypeScript `src/content/config.ts` and extract Zod schemas
3. **Performance Critical:** File watching, editor responsiveness, and startup time are non-negotiable
4. **macOS Integration:** Must feel native with proper keyboard shortcuts and UI conventions

## Styling Guidelines

### Tailwind CSS + shadcn/ui Best Practices

**Component Strategy:**
- Only install shadcn/ui components as needed - avoid bulk installation
- Use `npx shadcn@latest add [component]` to add individual components
- Prefer Tailwind utilities over custom CSS (except for complex editor styling)

**Button Styling Patterns:**
```tsx
// Standard button with icon
<Button variant="ghost" size="sm" className="h-8 px-3 gap-2">
  <Icon className="h-4 w-4" />
  Label
</Button>

// Icon-only button
<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
  <Icon className="h-4 w-4" />
</Button>
```

**Layout Consistency:**
- Use `h-8` for toolbar buttons and controls
- Use `px-3` for button horizontal padding
- Use `gap-2` between icon and text
- Use `h-4 w-4` for standard icons

**Color Tokens:**
- `bg-background` - Main background
- `bg-muted/20` - Subtle backgrounds (sidebars, panels)
- `text-foreground` - Primary text
- `text-muted-foreground` - Secondary text
- `border-border` - All borders

**Spacing Scale:**
- Use Tailwind's spacing scale consistently
- Prefer `p-4` for panel padding
- Use `gap-2` for small spacing, `gap-4` for larger spacing

**Responsive Behavior:**
- Use `overflow-hidden` with `text-ellipsis` for long text
- Implement resize handles with CSS `resize: horizontal`
- Use `min-w-*` and `max-w-*` for panel constraints

## Code Quality Tools

### TypeScript Linting & Formatting

**ESLint Configuration:**
- Configured with TypeScript strict rules and React hooks
- Excludes build files and config files from linting
- Warns on console statements, requires proper async/await handling

**Available Commands:**
```bash
npm run lint          # Check for linting errors
npm run lint:fix      # Auto-fix linting issues
npm run format        # Format code with Prettier
npm run format:check  # Check if code is formatted
npm run typecheck     # TypeScript type checking
```

**Key Rules:**
- No unused variables (prefix with `_` to ignore)
- Proper async/await usage required
- React hooks rules enforced
- Console statements generate warnings

### Rust Linting & Formatting

**rustfmt Configuration:**
- 100 character line width
- 4-space indentation
- Unix line endings
- Stable features only (no nightly required)

**Clippy Configuration:**
- MSRV: 1.70
- Cognitive complexity threshold: 30
- Treats warnings as errors in CI

**Available Commands:**
```bash
npm run rust:fmt         # Format Rust code
npm run rust:fmt:check   # Check Rust formatting
npm run rust:clippy      # Run Clippy linting
npm run rust:clippy:fix  # Auto-fix Clippy issues
```

### Combined Commands

```bash
npm run check-all  # Run all linting and formatting checks
npm run fix-all    # Auto-fix all linting and formatting issues
```

**Pre-commit Workflow:**
1. Always run `npm run check-all` before committing
2. Use `npm run fix-all` to auto-fix issues
3. Address any remaining linting errors manually
4. TypeScript compilation must pass without errors

## Testing Framework

### TypeScript Testing (Vitest + React Testing Library)

**Setup:**
- **Vitest** for fast unit testing with native ESM support
- **React Testing Library** for component testing
- **jsdom** environment for DOM simulation
- **Mocked Tauri APIs** for testing without backend

**Available Commands:**
```bash
npm run test          # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:ui       # Run tests with UI
npm run test:coverage # Run tests with coverage report
```

**Testing Patterns:**
- **Store tests**: State management, actions, and async operations
- **Component tests**: Rendering, user interactions, button states, and integration
- **Error handling**: API failures, file system errors, edge cases
- **Utility tests**: Helper functions and UI utilities
- **Tauri API mocking**: Use `globalThis.mockTauri` for API calls
- **Reset state**: Use `beforeEach` to reset store and mocks

### Rust Testing (cargo test)

**Setup:**
- Built-in Rust testing framework
- Unit tests in `#[cfg(test)]` modules
- Integration tests for command functions

**Available Commands:**
```bash
npm run rust:test  # Run all Rust tests
npm run test:all   # Run both TS and Rust tests
```

**Testing Patterns:**
- **Model tests**: Test struct creation, validation, and utility methods
- **Command tests**: Test file operations (read, write, create, delete)
- **Error scenarios**: File not found, permission denied, file exists
- **Integration tests**: Test complete workflows with temporary files
- **Edge cases**: Special characters, empty files, invalid paths

### Combined Testing

```bash
npm run test:all   # Run all tests (TS + Rust)
npm run check-all  # Run all checks including tests
```

**Test Performance:**
- **Vitest**: ~800ms for 46 tests (very fast)
- **Cargo test**: ~2-3s for 13 tests (fast compilation)
- **Total**: ~4-5s for full test suite

**Development Workflow:**
1. Write tests alongside features for TDD
2. Run `npm run test` during development (watch mode)
3. Run `npm run test:all` before commits
4. Maintain >90% test coverage for critical paths

---

_Remember: Update this file as the project evolves and always keep `planning.md` current with completed tasks._
