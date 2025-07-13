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

- **Framework:** Tauri (Rust backend + React frontend)
- **Text Editor:** CodeMirror 6
- **Frontend:** React + TypeScript
- **State Management:** Zustand
- **Parsing:** Tree-sitter for TypeScript/Astro config parsing

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

---

_Remember: Update this file as the project evolves and always keep `planning.md` current with completed tasks._
