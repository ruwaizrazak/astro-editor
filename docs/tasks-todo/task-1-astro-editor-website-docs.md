# Task: Astro Editor Website & Docs Site

https://github.com/dannysmith/astro-editor/issues/6

Create a simple, effective website for Astro Editor that serves as the primary marketing and documentation hub, hosted using GitHub Pages with automated deployment.

## Overview

Build a minimal but professional website that showcases Astro Editor's features, provides user documentation, and maintains a changelog. The site should be simple to maintain and automatically deploy from the main repository.

## Inspiration

https://getdarkmatter.dev/

## Architecture Requirements

### Repository Integration

- Website code lives within this repository for unified maintenance
- Documentation sourced directly from `/docs` directory
- Automated deployment via GitHub Actions to GitHub Pages to astroeditor.danny.is

### Technology Stack

- One-pager
- Responsive design for desktop and mobile users

## Core Components

### Phase 1: Landing Page

**Purpose**: Primary marketing page to attract and convert users

**Requirements**:

- Hero section highlighting key value propositions
- Feature showcase with screenshots/demos
- Clear download links for macOS
- Professional, clean design that reflects the app's focus on distraction-free writing

## Subtasks

- [x] Make the icon the right size and format - it's at `website/icon.png`
- [x] Remove buttons for Download for iOS and Read the User Guide
- [x] Remove the whole dummy editor thing
- [x] Remove the whole "Built for content‑first teams" box at the bottom
- [x] Make the "Github" think in the nav just a github icon

## Updated Copy & Messaging

### Hero Section
- **Headline**: "The CMS experience your Astro content deserves"
- **Subheading**: Emphasizes schema-aware forms, Zod integration, and iA Writer-inspired interface
- **Badge**: "Made for Astro content collections" (kept)

### Feature Cards (Updated)
1. **Schema-aware frontmatter** - Reads Zod schemas, creates appropriate form fields
2. **Smart image handling** - Drag & drop with automatic asset organization
3. **Writer mode, not coder mode** - Focus mode, typewriter mode for distraction-free writing
4. **Command palette** - Cmd+K for fuzzy search and keyboard-driven workflows
5. **MDX component insertion** - Cmd+/ to insert components with visual prop configuration
6. **Auto-save & crash recovery** - Never lose work with 2-second auto-save

### How It Works Section
1. Open your Astro project (reads content.config.ts)
2. Write without friction (smart forms, hidden YAML)
3. Stay in your workflow (IDE for code, Editor for writing)

## Screenshots Needed

To properly showcase Astro Editor's unique features, we need the following screenshots:

### Priority Screenshots

1. **Frontmatter Forms Panel**
   - Show various field types: date picker, boolean toggle, enum dropdown, array tags
   - Demonstrate how it matches the Zod schema
   - Include required field indicators

2. **MDX Component Palette**
   - Show Cmd+/ component insertion dialog
   - Display component list and prop configuration
   - Show inserted component with tab-through props

3. **Command Palette**
   - Show Cmd+K palette with fuzzy search
   - Display file search across collections
   - Show command categories

4. **Clean Editor Interface**
   - Main editor with markdown syntax highlighting
   - Hidden frontmatter and imports
   - Beautiful typography (iA Writer inspired)

5. **File List Sidebar**
   - Files ordered by pubDate
   - Draft badges clearly visible
   - Context menu options

6. **Focus Mode**
   - Show editor with focus mode enabled
   - Current sentence highlighted, rest dimmed

### Additional Screenshots (if space)

7. **Copyedit Highlighting** - Different parts of speech highlighted
8. **Project Settings** - Schema field mappings
9. **Split View** - Editor + Frontmatter panel together

## Next Steps

1. Take high-quality screenshots of actual app functionality
2. Replace placeholder screenshot grid with real images
3. Consider adding brief captions to screenshots
4. Test responsive layout on mobile devices
5. Add proper alt text to all images for accessibility