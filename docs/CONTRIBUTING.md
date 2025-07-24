# Contributing to Astro Editor

This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Rust 1.70+
- macOS development environment (for Tauri)

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```

## Development Workflow

### Before Making Changes

1. Read the project documentation in `/docs/developer/`
2. Check the current task status in `CLAUDE.md`
3. Review existing patterns in the codebase

### Code Quality

Run quality checks before committing:

```bash
npm run check:all  # TypeScript + Rust + tests
npm run fix:all    # Auto-fix issues
```

### Architecture Guidelines

- Follow patterns documented in `docs/developer/architecture-guide.md`
- Use the Direct Store Pattern for Zustand integration
- Extract complex logic to `lib/` modules
- Write tests for business logic
- Use TanStack Query for server state, Zustand for client state

### Technology Stack

- **Framework:** Tauri v2 (Rust + React)
- **Frontend:** React 19 + TypeScript
- **State:** TanStack Query v5 + Zustand v5
- **Styling:** Tailwind v4 + shadcn/ui
- **Editor:** CodeMirror 6
- **Testing:** Vitest + React Testing Library

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following the established patterns
3. Run `npm run check:all` and ensure all checks pass
4. Write or update tests as needed
5. Update documentation if you're adding new patterns
6. Submit a pull request with a clear description

## Code Style

### TypeScript/React

- Use strict TypeScript configuration
- Follow existing component organization patterns
- Use the Direct Store Pattern for form components
- Prefer functional components with hooks

### Rust

- Use modern Rust formatting: `format!("{variable}")`
- Follow Clippy recommendations
- Use Tauri v2 APIs only

### File Organization

- Components: `kebab-case` directories, `PascalCase` files
- Use barrel exports via `index.ts`
- Group by domain, not technical concerns

## Testing

- Write unit tests for `lib/` modules
- Write integration tests for user workflows
- Test complex field components
- Use Vitest and React Testing Library patterns

## Common Patterns

### Adding New Commands

1. Update types in `src/lib/commands/types.ts`
2. Add context function in `src/lib/commands/command-context.ts`
3. Define commands in `src/lib/commands/app-commands.ts`
4. Update group order in `src/hooks/useCommandPalette.ts`

### State Management

- "Server" state: Use TanStack Query hooks
- Client state: Use Zustand stores (decomposed architecture)
- Local state: Keep in components for UI presentation

### Component Extraction

Extract to `lib/` when:

- 50+ lines of related logic
- Used by 2+ components
- Needs unit tests
- Contains business rules

## Documentation

- Update `docs/developer/architecture-guide.md` for new patterns
- Document public APIs with JSDoc
- Keep `CLAUDE.md` current with major architectural changes

## Questions?

- Check existing documentation in `/docs/developer/`
- Review similar patterns in the codebase
- Open an issue for architectural questions

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
