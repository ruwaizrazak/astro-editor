# Product Requirements Document: Astro Content Editor for macOS

## Executive Summary

A native-feeling macOS markdown editor specifically designed for managing and editing Astro content collections. Unlike general-purpose code editors, this app prioritizes the writing experience while seamlessly integrating with Astro's content management structure. This editor aims to replace the now-defunct DarkMatter app, drawing heavy inspiration from iA Writer's design philosophy and writing experience.

## Required Reading for Implementation

Before beginning development, thoroughly review these resources:

- **iA Writer Overview**: https://ia.net/writer/how-to/quick-tour - Essential for understanding the UX patterns we're emulating
- **DarkMatter**: https://getdarkmatter.dev/ and https://getdarkmatter.dev/blog/announcing-darkmatter - Shows the market need and prior art
- **Astro Content Collections**: https://docs.astro.build/en/guides/content-collections/ - Critical for understanding the data structure
- **Astro Markdown**: https://docs.astro.build/en/guides/markdown-content/ - Markdown handling specifics
- **MDX Introduction**: https://mdxjs.com/docs/what-is-mdx/ - Understanding MDX component syntax
- **Visual References**: Review all images in `/planning` directory for UI/UX guidance

## Problem Statement

Content creators working with Astro sites currently lack a dedicated writing environment. They're forced to use code editors (VSCode/Cursor) which are optimized for programming, not prose. While these editors work, they lack the calm, focused environment conducive to quality long-form writing. The discontinued DarkMatter app demonstrated clear market demand for this solution but is no longer maintained or updated.

## Target Users

- **Primary**: Content creators and bloggers using Astro for their personal sites who write long-form articles and notes
- **Secondary**: Technical writers managing documentation in Astro projects
- **Characteristics**: Users comfortable with markdown but seeking a distraction-free, beautiful writing environment

## Core Value Proposition

A beautiful, performant markdown editor that understands Astro content collections, allowing writers to focus on writing—not file management, YAML frontmatter syntax, or code editor complexity. The app should feel like a dedicated writing tool, not a code editor.

## Functional Requirements

### 1. Project Management

- **Project Selection**: User selects the root Astro project directory when opening the app
- **Collection Discovery**: Parse `src/content/config.ts` to identify content collections
  - Only show collections containing local `.md` or `.mdx` files
  - Extract the Zod schema for each collection's frontmatter
  - Identify the path to each collection's content
- **Collection Types**: Support for any collection types (e.g., "articles" for long-form, "notes" for shorter content)

### 2. Navigation & Organization

#### Dual Sidebar Structure

- **Primary Sidebar**:
  - Lists all discovered content collections
  - Can be hidden via keyboard shortcut or button for distraction-free writing
- **Secondary Sidebar**:
  - Shows content pieces within the selected collection
  - **Draft Marking**: Content with `draft: true` frontmatter must be clearly marked with a visual label
  - Can be hidden independently of primary sidebar
- **Keyboard Navigation**: Full support for standard macOS conventions

### 3. Content Management

- **Create New Content**:
  - Files automatically prefixed with ISO date format: `YYYY-MM-DD-[title].md`
  - "Blank" frontmatter template automatically inserted based on collection schema
  - Cursor positioned after frontmatter for immediate writing
- **File Operations** (via context menu in sidebar):
  - Delete with confirmation dialog
  - Rename (including changing between .md and .mdx extensions)
  - Duplicate
- **File Handling**: Direct filesystem operations, no abstraction layer

### 4. Editor Pane (Primary Feature)

**This is the most important part of the application**. It must feel calm, joyful, fast, and performant.

#### Content Display Rules

- **Hidden Frontmatter**: Never display YAML frontmatter in the editor (edited via right sidebar)
- **Hidden MDX Imports**: For MDX files, hide TypeScript imports that immediately follow frontmatter
  - These imports are preserved in the file but not shown in editor
  - Used for importing MDX components referenced later in the document
- **MDX Components**: Full syntax highlighting for JSX-style components in MDX files

#### Typography & Visual Design

- **Font**: iA Writer's Duo font (see https://ia.net/topics/a-typographic-christmas)
- **Heading Treatment**:
  - Hash symbols (#) "hang" in the left margin
  - First word of heading aligns with body text (like iA Writer)
  - Different weights/sizes for different heading levels
- **Inline Styles**: Visual differentiation following iA Writer patterns:
  - Bold text appears heavier
  - Italic text properly italicized
  - Code in monospace with subtle background
- **Overall Feel**: Minimal, beautiful, conducive to long-form writing

#### Markdown Support

- **Full GitHub Flavored Markdown** with proper rendering
- **Syntax Highlighting**: For fenced code blocks with language detection
- **Minimal Auto-formatting on Save** (can be disabled in preferences):
  - Trim trailing whitespace from all lines
  - Ensure single blank line between paragraphs (no more than one)
  - Fix list indentation to use consistent spaces (2 or 4, configurable)
  - Normalize heading syntax (ensure space after #)
  - No other formatting changes - preserve author's intentional styling
- **Lists & Checklists**: Full support with proper indentation behavior

#### Keyboard Shortcuts & Text Manipulation

- **Standard Shortcuts**:
  - Cmd+B for bold
  - Cmd+I for italic
  - Cmd+K for links
  - Tab/Shift+Tab for list indentation
- **Smart Link Creation**: When text is selected and URL pasted, automatically create markdown link
- **Standard macOS text editing**: All system shortcuts work as expected

#### Image Management

- **Drag & Drop Behavior**:
  1. Image dropped into editor triggers file copy
  2. Copy destination: `src/assets/[collection-name]/`
  3. File renamed to: `YYYY-MM-DD-kebab-case-original-name.ext`
  4. If file exists, append number: `YYYY-MM-DD-name-2.jpg`
  5. Insert markdown image syntax at cursor: `![](path/to/image.jpg)`
- **Supported Formats**: All common image formats (jpg, png, gif, svg, webp)

### 5. Frontmatter Management

- **Right Sidebar Panel**:
  - Toggle-able with keyboard shortcut or button
  - Remains in sync with file edits
- **Dynamic Field Generation**:
  - Fields generated from collection's Zod schema
  - Support for all common types: string, number, boolean, date, enum/select
  - Array fields for tags, categories, etc.
- **User-Friendly Editing**:
  - No YAML syntax required
  - Date pickers for date fields
  - Checkboxes for booleans
  - Dropdowns for enums
  - Multi-select for arrays
- **Validation**: Real-time validation against Zod schema with clear error messages

### 6. Performance Requirements

- **App Launch**: < 2 seconds to functional UI
- **File Opening**: < 100ms for files under 1MB
- **Typing Latency**: Zero perceptible delay (native editor feel)
- **Auto-save**: Every 30 seconds or on blur/focus change
- **Large Files**: Graceful handling of files up to 10MB

#### Large Collection Handling

- **Lazy Loading**: Load only visible items in sidebar (virtualized scrolling for 100+ items)
- **Search**: Add simple filename/title search when collection exceeds 50 items
- **Indexing**: Build search index asynchronously on first load
- **File Watching**: Debounce filesystem events to prevent overwhelming the app

### 7. Error Handling & Graceful Degradation

- **Config Parsing Failures**:

  - If `config.ts` cannot be parsed, show alert: "Unable to parse collection configuration. Some features may be limited.
  - If the schema for content collections includes unusual or custom properties where the correct UI input is hard to know, fallback to a text input.
  - Treat all `.md`/`.mdx` files as generic content without schema validation

- **Schema Interpretation Limits**:

  - Support only these Zod types: string, number, boolean, date, enum, array of strings, image (See Astro docs)
  - For unsupported types, show field as disabled text input with message: "This field type is not supported"
  - Log unsupported types to console for future reference

- **Component Parsing Failures** (Stretch goal):
  - If component parsing fails, exclude from slash command menu
  - Never block core editing functionality due to component issues
  -

## User Stories

### Writer Workflow

1. **As a writer**, I want to open my Astro project and immediately see all my content organized by collection so I can start writing without friction
2. **As a writer**, I want to create new posts without manually writing YAML frontmatter or worrying about file naming conventions
3. **As a writer**, I want to drag images into my posts without thinking about file organization or paths

### Editor Experience

4. **As a writer**, I want a distraction-free environment where markdown syntax enhances rather than clutters my writing
5. **As a writer**, I want to edit metadata through form fields instead of error-prone YAML syntax
6. **As a writer**, I want standard macOS keyboard shortcuts to work exactly as they do in other Mac apps
7. **As a writer**, I want the app to feel fast and responsive like a native Mac application

## Non-Functional Requirements

### Design Principles

- **Minimalism**: Heavily inspired by iA Writer's philosophy - nothing unnecessary
- **Native Feel**: Strict adherence to macOS Human Interface Guidelines
- **Speed**: Every interaction must feel instant
- **Reliability**: Auto-save with crash recovery, never lose work
- **Beauty**: The app should be a joy to use and look at

### Technical Constraints

- **Platform**: macOS only for initial release
- **Framework**: Tauri or maybe Electron.
- **File Access**: Direct filesystem access with file watching for external changes (use Chokidar?)
- **No Cloud**: All operations are local
- **Parser Limitations**: TypeScript/JavaScript parsing via tree-sitter or similar AST parser only
- **No Build Chain**: Assumes direct file access without build tools or bundlers
- **Standard Structures**: Optimized for conventional Astro project layouts only

## Out of Scope (Explicitly Excluded)

- Git integration or version control features
- Publishing workflows or deployment
- Preview/rendering of final MDX output (too complex with custom components)
- JSON-based content collections
- Cross-platform support (initial version)
- Cloud sync or backup
- Collaboration features

## Known Limitations

This editor is optimized for standard Astro setups. The following scenarios have limited support:

- Complex Zod schemas with custom validators or transforms
- Monorepo setups with unusual import paths
- Projects using path aliases or custom build configurations
- MDX files with complex component imports beyond `src/components/mdx/*`
- Content collections defined outside standard locations

When these scenarios are detected, the editor will gracefully degrade to basic markdown editing functionality.

## Future Enhancements (Stretch Goals)

### Enhanced Writing Features

1. **Focus Mode**: Like iA Writer (https://ia.net/writer/how-to/write-with-focus)

   - Highlight current sentence
   - Fade out other paragraphs
   - Typewriter mode (current line stays centered)

2. **Image Preview**: Hover over markdown image syntax to preview in popover

3. **Writing Analysis** (https://ia.net/writer/how-to/edit-and-polish):
   - **Syntax Highlighting by Part of Speech**:
     - Adjectives: brown
     - Nouns: blue
     - Adverbs: purple
     - Verbs: green
     - Conjunctions: orange
   - **Complexity Analysis**: Similar to hemingwayapp.com
     - Highlight complex sentences
     - Readability score
     - Sentence length indicators

### MDX Component Support

4. **Slash Command System**:
   - Type `/` to open component picker
   - Components discovered from `src/components/mdx/*.astro` files
   - Parse TypeScript props from component files
   - Show description and required props
5. **Component Intelligence**:
   - Differentiate between self-closing and slot-based components
   - Auto-add import statement below frontmatter when component used
   - Only import each component once
6. **Configuration**: Toggle which components appear in slash menu via app settings

## Success Metrics

- Time from app launch to writing first word: < 5 seconds
- Complete writing session without needing code editor: 100% of time
- Zero data loss from crashes or unexpected quits
- File operations feel instant (< 50ms perceived latency)
- Memory usage remains under 500MB for typical projects

## Competitive Analysis

- **iA Writer**: Gold standard for markdown UX, primary inspiration for editor experience
- **DarkMatter**: Proved specific demand for Astro content editing but now abandoned
- **Ulysses/Bear**: Beautiful general markdown editors but lack Astro-specific features
- **Obsidian**: Powerful but overcomplicated for simple content authoring

## Implementation Notes for AI Agents

This PRD is designed to give you comprehensive context for building this application. Pay special attention to:

1. The iA Writer references - study their UX patterns carefully
2. The specific hidden elements in MDX files (frontmatter and imports)
3. The hanging hash marks for headings - this is a key visual feature
4. The automatic file naming and organization patterns
5. The importance of native macOS feel and performance

The editor pane is the heart of this application. Everything else exists to support a beautiful, distraction-free writing experience.
