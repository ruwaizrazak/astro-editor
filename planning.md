# MacOS Astro Editor Planning & Tasks Doc

This doc contains my initial notes on requirements, and the working project plan. The initial notes have been synthesised into a PRD (See: `astro-editor-prd.md`).

## Initial Notes

I write content for my personal astro site using Markdown or MDX. I currently have two collections: articles for long-form and notes. These all have a mix of Markdown and MDX files. I currently edit them and write new files by opening VSCode or Cursor and writing Markdown directly in these files. I would much prefer to be able to edit these files specifically when I'm writing in an editor designed for long-form writing, not for code. An app called Darkmatter exists for this but is no longer updated.

I want to build a Mac app myself. It probably makes sense to build this in Electron Rather than natively, The React Native may also be an option.

I essentially want a simple local editor with a beautiful editing interface that allows me to see all of the content in my Markdown or MDX-based content collections Manage the front matter without having to write YAML And most importantly, edit Markdown in a beautiful app that is conducive to quality long-form writing and editing.

### Documents to Read First

The docs and sites below provide background context on this project

- https://ia.net/writer/how-to/quick-tour - overview of iA Writer
- https://getdarkmatter.dev/ - DarkMatter website
- https://getdarkmatter.dev/blog/announcing-darkmatter - Darkmatter announcement blog post
- https://docs.astro.build/en/guides/content-collections/ - Astro docs on content collections
- https://docs.astro.build/en/guides/markdown-content/ - Astro docs on markdown content
- https://mdxjs.com/docs/what-is-mdx/ - MDX docs intro

Also look at the images in `/planning`.

### Initial Requirements

- The root astro project directory is selected by the user when opening the app.
  Astro content collections are defined in `src/content.config.ts`. We are only interested in those which contain local md or mdx files. These definitions include the path to the content and a zod schema for the frontmatter.
- Content collections are shown in the sidebar, with content pieces in another sidebar next to it.Sidebars can be hidden when writing with a keyboard shortcut or button. Draft content (ones with `draft:true` frontmatter) should be clearly marked as such with a label of some sort.
- Selecting a content piece opens it in the markdown editor pane.
- The main editing pane is the **most important** bit of the application. It should feel calm and joyful to write in markdown, be fast and performant and work like any other text editor.
- The frontmatter should be displayed as editable fields in a sidebar on the right (which can be toggled). The fields should be based on the content collection schema.
- No preview mode nececarry (it would be too hard to render MDX properly)
- The app must feel fast and performant and stick to standard macOS UX conventions about keyboard navigation, shortcuts etc.
- New content pieces can be created in their collections. The filename should be prefixed with an ISO date. The "blank" frontmatter should be automatically inserted into the new file.
- Content files can be deleted, renamed (incl file extension) etc via context menu in the sidebar.

#### The Markdown Editor Pane

- Should not dispay frontmatter
- For MDX files: should not display any typescript imports imemdiatly after the frontmatter. These are used for importing MDX components which are later used in the file.
- For MDX files: Should support MDX components and syntax highlight them as you would HTML components in MD files.
- Fully supports Github Flavoured Markdown with syntax highlighting for fenced code blocks support syntax highlighting.
- Supports simple auto-formating on save (removing extra vertical space etc and auto-format tables etc).
- Extremely Beautiful and minimal simple drawing on iA Writer's design.
- Should use iA writer's Duo font (see https://ia.net/topics/a-typographic-christmas).
- Headings and inline styles (bold etc) are styled in a similar way to iA Writer.
- The hashes in front of headings "hang" in the margin, so the first word of the heading is left-aligned, as with iA Writer
- Keyboard shortcuts for bold, italic, links etc work as expected. Lists, checklists etc work as expected. Pasting a URL with text selected adds a link.
- Images: Dragging an image into the editor copies the image to `src/assets/[name of content collection]/` while renaming it to kebab-case and prefixing todays date. If an image already exists with the same filename it appens a number to the end. A makrdown image link is then inserted wherever the file was dropped.

### Out of Scope

- Anything to do with git or publishing content - I can do this via git in VSCode/Cursor etc.
- JSON-based content collections.

### Stretch Goals

- View image: hovering over an image tag in markdown displays the image in a popover.
- Focus mode, like iA Writer has. See https://ia.net/writer/how-to/write-with-focus
- Simple writing analysis which can colour-code Adjectives are brown Nouns, Adverbs, Verbs, Conjunctions like iA Writer (see https://ia.net/writer/how-to/edit-and-polish). Also uses simple analysis tools to show writing complexity, comlex sentences etc like https://hemingwayapp.com/
- Library of specific MDX components (like `Callout` or `YouTubeVideo` which can be insertedusing a slash command. Typing slash opens a list to choose from and inserts the correct MDX. Components can be found in the `src/components/mdx` directory of the Astro site as `.astro` files. The props are available as typescript props. Some have a `<slot>` and can contain content, some are "self-closing". The components available in the slash menu can be toggled on or off in the app's settings. If an MDX componentis used it must be imported underneath the frontmatter.

## Initial High-Level Technical Plan (generated by AI tooling)

### Research Summary (Completed)

**Technology Stack Research:**

1. **Framework:** Tauri vs Electron
   - Tauri: Rust backend, web frontend, smaller bundle size, better performance
   - Electron: Node.js backend, larger but more mature ecosystem
2. **Text Editor:** Monaco Editor vs CodeMirror
   - Monaco: VS Code's editor, excellent TypeScript support, heavy
   - CodeMirror: Lightweight, highly customizable, extensible
3. **Astro Integration:** Content Collections structure
   - Uses Zod schemas for frontmatter validation
   - Config in `src/content/config.ts`
   - Collections defined with `defineCollection()`

### Core Technology Decisions

**Primary Framework: Tauri**

- **Rationale:**
  - Better performance and smaller bundle size critical for editor responsiveness
  - Rust backend provides excellent file system performance for file watching
  - Native macOS integration superior to Electron
  - Modern architecture better suited for this type of application

**Frontend Framework: React + TypeScript**

- **Rationale:**
  - Large ecosystem of UI components
  - Excellent TypeScript support crucial for type-safe Astro content collection integration
  - Good integration with both text editor options

**Text Editor: CodeMirror 6**

- **Rationale:**
  - More suitable for markdown-focused editing (Monaco is better for code)
  - Lighter weight crucial for startup performance
  - Excellent theming system to match iA Writer aesthetic
  - Better support for markdown extensions and custom syntax highlighting
  - More flexible for implementing hanging hash marks for headings

**State Management: Zustand**

- **Rationale:**
  - Lightweight, TypeScript-first
  - Good for managing file state, sidebar visibility, etc.
  - Simpler than Redux for this use case

**File Parsing: Tree-sitter**

- **Rationale:**
  - Robust TypeScript/Astro config parsing
  - Can parse Astro components for MDX slash commands (stretch goal)
  - Industry standard for syntax analysis

### Application Architecture

**High-Level Structure:**

```
┌─────────────────────────────────────────┐
│                Frontend                 │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │   Sidebar   │  │   Editor Pane    │  │
│  │             │  │                  │  │
│  │ Collections │  │   CodeMirror     │  │
│  │    Files    │  │                  │  │
│  └─────────────┘  └──────────────────┘  │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │         Frontmatter Panel          │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
              │ Tauri Commands
┌─────────────────────────────────────────┐
│                Backend                  │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │  File Ops   │  │  Astro Parser    │  │
│  │             │  │                  │  │
│  │  - Watch    │  │  - Config.ts     │  │
│  │  - Read     │  │  - Zod Schemas   │  │
│  │  - Write    │  │  - Collections   │  │
│  │  - Create   │  │                  │  │
│  └─────────────┘  └──────────────────┘  │
└─────────────────────────────────────────┘
```

**Detailed Architecture:**

**Frontend Components:**

```
App
├── Layout
│   ├── Sidebar
│   │   ├── CollectionsList
│   │   └── FilesList (per collection)
│   ├── MainEditor
│   │   ├── ToolBar
│   │   ├── EditorView (CodeMirror)
│   │   └── StatusBar
│   └── FrontmatterPanel (toggle-able)
│       ├── FormField components (generated from Zod)
│       └── ValidationErrors
└── Dialogs
    ├── ProjectPicker
    ├── NewFile
    └── ErrorDialog
```

**State Management (Zustand):**

```typescript
interface AppState {
  // Project state
  projectPath: string | null;
  collections: Collection[];

  // UI state
  sidebarVisible: boolean;
  frontmatterPanelVisible: boolean;
  currentFile: FileEntry | null;

  // Editor state
  editorContent: string;
  isDirty: boolean;

  // Actions
  setProject: (path: string) => void;
  loadCollections: () => Promise<void>;
  openFile: (file: FileEntry) => Promise<void>;
  saveFile: () => Promise<void>;
  updateFrontmatter: (data: any) => void;
}
```

**Data Flow:**

1. **Project Loading:**

   ```
   User selects project → Backend parses config.ts →
   Extract collections & schemas → Update frontend state
   ```

2. **File Operations:**

   ```
   User clicks file → Backend reads file →
   Parse frontmatter/content → Update editor state →
   Hide frontmatter in editor → Show in panel
   ```

3. **File Editing:**

   ```
   User types in editor → Update state →
   Auto-save timer → Backend writes file →
   File watcher confirms change
   ```

4. **Frontmatter Editing:**
   ```
   User edits form → Validate against Zod →
   Update file content → Sync with backend
   ```

**Backend (Rust) Components:**

```
src/
├── main.rs              # Tauri app entry
├── commands/
│   ├── project.rs       # Project selection, config parsing
│   ├── files.rs         # File CRUD operations
│   ├── collections.rs   # Collection management
│   └── parser.rs        # Astro config & markdown parsing
├── models/
│   ├── collection.rs    # Collection data structures
│   ├── file_entry.rs    # File metadata
│   └── schema.rs        # Zod schema representations
├── utils/
│   ├── file_watcher.rs  # Filesystem monitoring
│   ├── markdown.rs      # Markdown/MDX parsing
│   └── astro_parser.rs  # TypeScript config parsing
└── error.rs             # Error handling
```

### Key Technical Challenges

1. **Astro Config Parsing**
   - Parse TypeScript `src/content/config.ts`
   - Extract Zod schemas dynamically
   - Convert Zod schemas to UI form components

2. **Frontmatter Hiding**
   - Parse markdown to identify frontmatter boundaries
   - Hide from CodeMirror display while preserving in file
   - Sync frontmatter panel with file contents

3. **MDX Import Hiding**
   - Parse MDX files to identify TypeScript imports after frontmatter
   - Hide from display while preserving in file
   - Auto-add imports when MDX components are used

4. **Performance**
   - File watching without overwhelming the system
   - Efficient markdown parsing and syntax highlighting
   - Responsive editor for large files

## Implementation Plan (regularly updated)

**Phase 1: Core Foundation**
_Goal: Basic working editor with file operations_

**Phase 1.1**

- [x] Set up Tauri project with React + TypeScript
- [x] Create basic window layout (header, sidebar, main content)
- [x] Implement project folder selection dialog
- [x] Basic file system commands (read directory, read file)
- [x] Simple file tree in sidebar

**Phase 1.2**

- [x] Integrate CodeMirror 6 with basic markdown highlighting
- [x] Implement file opening/switching
- [x] Basic file saving functionality (with auto-save)
- [x] Set up state management with Zustand
- [x] File watcher for external changes

**Deliverable:** Basic editor that can open a folder, display files, and edit/save markdown

**Phase 1.3 - End of Phase Two Additional Tasks**

- [x] Add ESLint and/or prettier with suitable configs to help prevent errors? Plus similar linters and checkers for the rust part?
- [x] Add a simple test framework (both TS and Rust?) and write some basic tests for what we've done so far. So we don't break things later on?
- [x] Consider using an appropriate UI framework and tailwind. I'd prefer one with no external deps like shadcn, but there may be better options. We only really need UI components like this for the window "chrome" and settings etc. We'll probably have to hand-write CSS for the markdown editor to makeit really beautiful. There may be beter optionsfor our use case than shadcn?
- [x] Bring in an icon library for when we need icons. Suggest: https://www.radix-ui.com/icons
- [x] Update CLAUDE.md with details of the project structure, tech etc and instructions to run checks and tests to verify work, as well as guidance on the other patterns we've developed so far. Should also include a note about using Context7 to access docs etc
- [x] Check Tauri is configured in the most optimal way for nice-looking macos apps
  - [x] Transparent titlebar (https://v2.tauri.app/learn/window-customization/#macos-transparent-titlebar-with-custom-window-background-color)
  - [x] Sensible window menu with Open Project and the minimum usual stuff youd expect
  - [x] Any other "boilerplateish" Tauri stuff we should do

---

**Phase 2: Astro Integration**
_Goal: Parse Astro config and handle content collections_

**Phase 2.1**

- [x] Implement TypeScript parser for `src/content/config.ts`
- [x] Extract collection definitions and Zod schemas
- [x] Create data structures for collections and schemas
- [x] Display collections in sidebar instead of raw files

**Phase 2.2:**

- [x] Parse frontmatter from markdown files
- [x] Hide frontmatter from CodeMirror display
- [x] Create basic frontmatter editing panel
- [x] Implement Zod-to-form-field generation
- [x] Sync frontmatter panel with file contents

**Deliverable:** Editor that understands Astro content collections and can edit frontmatter via forms

**Phase 2.3 - End of Phase Two Additional Tasks**

### Phase 2.3 Implementation Plan

This phase focuses on UI refinement, code quality improvements, and setting up the foundation for a more polished application. Here's the execution order:

#### Step 1: shadcn/ui Components Setup (Foundation)
Install the required shadcn/ui components that will be used throughout the UI improvements:
- Badge, Card, Input, Select, Separator, Switch, Textarea, Tooltip (basic UI elements)
- Dialog (for modals and confirmations)
- DatePicker (for date frontmatter fields)
- RadioGroup, Toggle, Toggle Group (for various field types)
- Sonner (for toast notifications)
- Breadcrumb (for navigation)
- Scroll-area (potentially for long lists)

#### Step 2: Frontmatter Panel UI Refinement
Using the newly available components, enhance the frontmatter editing experience:
- Create custom AutoGrowingInput component for title fields
- Implement auto-growing Textarea for description fields
- Replace checkboxes with Switch components for booleans
- Integrate DatePicker for date fields
- Build a custom Tags input component with create/remove functionality

#### Step 3: Left Sidebar Improvements
Enhance the file browser experience:
- Implement collection navigation with breadcrumb-style header
- Create rich file list items showing title, filename, date, and badges
- Add MDX and Draft badges using the Badge component
- Implement date-based sorting with undated items at top
- Polish hover and selected states

#### Step 4: Test Data Enhancement
Improve dummy-astro-project for better testing:
- Clean up existing content while keeping useful examples
- Add diverse content with various frontmatter configurations
- Include all GitHub Flavored Markdown features
- Consider adding a third collection for testing

#### Step 5: Code Quality Review
- Extract reusable React components where beneficial
- Create proper TypeScript types for domain objects (Collection, Document, etc.)
- Review and improve type safety throughout the codebase

#### Step 6: Config Parsing Enhancement
Investigate alternatives to regex-based parsing:
- Research executing TypeScript in Tauri for direct Zod schema access
- Consider hybrid approach with better type safety
- Evaluate trade-offs and implementation complexity

#### Step 7: Test Suite Enhancement
- Add comprehensive unit tests for business logic
- Create test fixtures with various content configurations
- Ensure edge cases are covered

#### Step 8: Build System Cleanup
- Standardize npm script naming conventions
- Group related commands logically
- Ensure consistency across all scripts

#### Step 9: Documentation Update
- Update CLAUDE.md with new patterns and conventions
- Document component usage guidelines
- Add examples of new UI patterns

### Tasks List

- [x] Pull in basic shadui components we're probably gonna need so they're available for us to use (see https://ui.shadcn.com/docs/components). Suggestions:
  - Badge ✓
  - Breadcrumb ✓
  - Card ✓
  - Checkbox ✓
  - DatePicker ✓ (created custom component using Calendar + Popover)
  - Dialog ✓
  - (maybe) React Hook Form - skipped for now
  - Input ✓
  - RadioGroup ✓
  - (maybe) Scroll-area ✓
  - Select ✓
  - Separator ✓
  - Sonner (for toasts - position them bottom right of editor) ✓
  - Switch ✓
  - Textarea ✓
  - Toggle ✓
  - Toggle Group ✓
  - Tooltip ✓
- [ ] Refine frontmatter sidebar panel UI
  - [ ] Use shadci components
  - [ ] If there is a field called "title" of type text, use a slightly bigger input field which auto-wraps content and grows vertically if the content wraps to more than one line. Should probably be implemented as a simple react component in case we need to reuse it later? Goal: make the title field stand out more than the others.
  - [ ] If there is a field called "description" with type text, use a textarea which wraps content and grows with the text in it. The shadcn Textarea component should do this for us.
  - [ ] Use toggles instead of checkboxes for booleans - use the shadcn component.
  - [ ] Use shadcn's date picker rather than the native browser one for dates
  - [ ] Use a better UI component for tags. Should be able to create new tags in it.
- [ ] Left sidebar UI improvements
  - [ ] Consider rebuilding the left sidebar with shadcn's sidebar components (see https://ui.shadcn.com/docs/components/sidebar).
  - [ ] The sidebar header "Collections" should only say "Collections" when not inside a collection. Once the user has clicked into a collection it should use the name of the collection, capitalised. Eg "Articles" or "Notes". When inside a collection there should be a back arrow icon before the collection name which takes you back up to the collections list. We can then remove everything bar the list of items in the collection from the scrollable area of the sidebar. We can maybe use Shadcn's sidebar patterns to make this work a bit better.
  - [ ] Each content item in the left sidebar should display:
    - Title: use the "title" frontmatter field if it exists, otherwise use the filename
    - Filename (small, subdued, in monospace font)
    - Published date (if present): check for `pubDate` or `date` or `publishedDate` etc if present in the frontmatter, otherwise do not render anything.
    - A small grey "MDX" badge if the file extension is MDX
    - A small orange "Draft" badge if the frontmatter has `draft:true` set.
  - [ ] The content items should be ordered according to published date in reverse chronological order. Use `pubdate` or `date` or `publishedDate` if present in the frontmatter. Ignore dates in filenames. Items without a published date should appear at the top.
  - [ ] If not done already: fix hover and selected states
- [ ] Improve the dummy data in `dummy-astro-project` so its's easier for us to test (both manually and automated):
  - Keep a few of the real examples and the styleguides but clear out some of theother stuff.
  - Add some more dummy content pieces into the two collections with differring frontmatter, content, filename formats etc. Ensure all features of (GitHub-flavoured) markdown are present so we can easily test the markdown editor later on. Maybe add another collection? Do not change the `notes` or `articles` collection schemas in `content.config.json` - they are exact copies of the schema for my personal blog.
- [ ] Review all React code for opportunities to extract components. Refactor as needed.
- [ ] Review all typescript code for opportunities to leverage typescript for better type safety in our front-end - are there opportunities to create custom types for things like `Collection`, `Project`, `Document`, `FrontMatterField` etc **without overcomplicateing the codebase**.
- [ ] Review our approach to parsing `content.config.js` - We currently use RegEx, but if we're able to execute JS/TS in the compiled Tauri app it may be possible to use `zod` to read and understand the schema in a more robust/efficient/safe way. Could we use the md/mdx files and zon schemas to creat our own typesafe objects, which our UI components can read? This would probably involve the the rust backend talking more with the TS front-end etc.
- [ ] Rework (or add to) the tests so they actually test all the weird little bits of business logic we've now got in our code. We could have the tests try to a couple of different dummy `content.config.json` and `content/[collection]` directories. Our tests must encode our business logic effectively.
- [ ] Refactor the `npm run` commands in `package.json` so there is consistency in their naming etc.
- [ ] Update `CLAUDE.md` with clear descriptions of any new design patterns etc we have introduced, current project structure, examples, npm commands etc.

---

**Phase 3: The Editor Experience (Week 5-6)**
_Goal: Beautiful, iA Writer-inspired editing experience_

**Phase 3.1**

- [ ] Refactor our `EditorView` and configure CodeMirror so we're in the best possible starting point for working on the markdown editor.
- [ ] Implement iA Writer-inspired typography and colors (add iA Writer Duo variable font - https://github.com/iaolo/iA-Fonts)
- [ ] Create hanging hash marks for headings
- [ ] Custom CodeMirror theme matching iA Writer aesthetic
- [ ] Add editor keyboard shortcuts (Cmd+B, Cmd+I, Cmd+K, etc.)
- [ ] Add: Pasting a URL over selected text inserts a markdown link properly
- [ ] Ensure all GFM features are fully supported
- [x] Hide initial MDX imports for MDX files
- [ ] Improve markdown syntax highlighting and code block display

**Phase 3.2**

- [ ] Implement image drag & drop functionality
  - [ ] Auto-copy images to `src/assets/[collection]/` with auto-rename to kebabcase and date prefix etc.
  - [ ] Insert markdown image syntax at drop location
- [ ] Implement basic auto-formatting on save

**Deliverable:** Beautiful, responsive editor with excellent UX for markdown writing

---

**Phase 4: Polish & Performance**
_Goal: Production-ready reliability and performance_

**Phase 4.1**

- [ ] Add simple (currently empty) preferences/settings window/dialog with `Cmd + ,` keyboard shortcut, menu item, cog icon in `UnifiedTitleBar.tsx` etc.
- [ ] Add error handling and graceful degradation where appropriate
- [ ] Optimize for large content collections (virtualized lists, laxy loading etc)
- [ ] Add simple search functionality for large collections (by filename only)
- [ ] Crash recovery and unsaved changes detection

**Phase 4.2**

- [ ] Add comprehensive keyboard shortcuts
- [ ] Review all right-click context menus, menubar menus etc. Remove anything not implemented and conform to macOS norms
- [ ] Add file operations (delete, rename, duplicate etc) via context menu
- [ ] Create new file functionality for easy creation of new content items within collections
- [ ] Implement simple command pallete to execute common commands etc (use https://ui.shadcn.com/docs/components/command)
- [ ] Review all code for opportunities to simplify, refactor, make more readable etc **without affecting functionality**
- [ ] Performance optimization and profiling

**Deliverable:** Stable, performant editor ready for daily use

---

**Phase 5: Stretch Goals**
_Goal: Advanced features that differentiate from basic editors_

**Stretch Goals Priority 1:**

- [ ] Focus mode highlighting current sentence/paragraph
- [ ] "Typewriter mode" (much like iA Writer)
- [ ] Image preview on hover over markdown image syntax
- [ ] Better error messages, toasts etc where needed

**Stretch Goals Priority 2:**

- [ ] Discovery of Astro components intended for use in MDX files (from `src/components/mdx/`)
- [ ] Slash command system for inserting Astro components in MDX files easily
- [ ] Auto-add typescript imports for MDX components at top of MDX files (only if easy - this can easily be done in Cursor/VSCode before publishing)
- [ ] Section in app settings to view all discovered Astro components and toggle on and off
- [ ] Section in settings to optionally override:
  - Path to Astro components for use in MDX files (default: `src/components/mdx/`)
  - Path to content directory (default: `src/content/`)
  - Path to assets directory (default: `src/assets/[collection name]/`)
  - "Published Date" frontmatter proeperty (default: `date`, `pubDate` or `publishedDate`) - must be of type Date
  - "Title" frontmatter property (default: `title`) - must be of type String
  - "Draft" frontmatter property (default: `draft`) - must be of type Boolean

**Stretch Goals Priority 3:**

- [ ] Toggleable "review mode" which enables analysis features...
- [ ] Syntax highlighting (colours) by parts of speech (Nouns, Adverbs, Verbs, Conjunctions like iA Writer (see https://ia.net/writer/how-to/edit-and-polish). Should ignore code blocks for this.
- [ ] Simple, performant writing analysis algorithms (eg. sentence complexity, readability etc) - like Hemmingway App.

**Deliverable:** Feature-rich editor that provides unique value for Astro content creators

---

### Risk Mitigation

**High Risk Items:**

1. **Astro config parsing complexity** → Start with simple cases, add complexity gradually
2. **CodeMirror customization difficulties** → Research extensively, have fallback plans
3. **File watching performance** → Use debouncing, limit to relevant directories
4. **Frontmatter/content synchronization** → Implement robust parsing and validation

**Success Criteria:**

- App launches in < 2 seconds
- File operations feel instant (< 100ms)
- Zero data loss from crashes
- Handles projects with 100+ content files smoothly
- Writing experience feels better than VSCode for markdown

## Potential Future Features
