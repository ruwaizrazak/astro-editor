# MacOS Markdown Editor

I write content for my personal astro site using Markdown or MDX. I currently have two collections: articles for long-form and notes. These all have a mix of Markdown and MDX files. I currently edit them and write new files by opening VSCode or Cursor and writing Markdown directly in these files. I would much prefer to be able to edit these files specifically when I'm writing in an editor designed for long-form writing, not for code. An app called Darkmatter exists for this but is no longer updated.

I want to build a Mac app myself. It probably makes sense to build this in Electron Rather than natively, The React Native may also be an option.

I essentially want a simple local editor with a beautiful editing interface that allows me to see all of the content in my Markdown or MDX-based content collections Manage the front matter without having to write YAML And most importantly, edit Markdown in a beautiful app that is conducive to quality long-form writing and editing.

## Documents to Read First

- https://ia.net/writer/how-to/quick-tour - overview of iA Writer
- https://getdarkmatter.dev/ - DarkMatter website
- https://getdarkmatter.dev/blog/announcing-darkmatter - Darkmatter announcement blog post
- https://docs.astro.build/en/guides/content-collections/ - Astro docs on content collections
- https://docs.astro.build/en/guides/markdown-content/ - Astro docs on markdown content
- https://mdxjs.com/docs/what-is-mdx/ - MDX docs intro

Also look at the images in `/planning`.

## Requirements

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

### The Markdown Editor Pane

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

## Out of Scope

- Anything to do with git or publishing content - I can do this via git in VSCode/Cursor etc.
- JSON-based content collections.

## Stretch Goals

- View image: hovering over an image tag in markdown displays the image in a popover.
- Focus mode, like iA Writer has. See https://ia.net/writer/how-to/write-with-focus
- Simple writing analysis which can colour-code Adjectives are brown Nouns, Adverbs, Verbs, Conjunctions like iA Writer (see https://ia.net/writer/how-to/edit-and-polish). Also uses simple analysis tools to show writing complexity, comlex sentences etc like https://hemingwayapp.com/
- Library of specific MDX components (like `Callout` or `YouTubeVideo` which can be insertedusing a slash command. Typing slash opens a list to choose from and inserts the correct MDX. Components can be found in the `src/components/mdx` directory of the Astro site as `.astro` files. The props are available as typescript props. Some have a `<slot>` and can contain content, some are "self-closing". The components available in the slash menu can be toggled on or off in the app's settings. If an MDX componentis used it must be imported underneath the frontmatter.

## High-Level Technical Plan

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

### Implementation Phases

**Phase 1: Core Foundation (Week 1-2)**
*Goal: Basic working editor with file operations*

**Week 1:**
- [x] Set up Tauri project with React + TypeScript
- [x] Create basic window layout (header, sidebar, main content)
- [x] Implement project folder selection dialog
- [x] Basic file system commands (read directory, read file)
- [x] Simple file tree in sidebar

**Week 2:**
- [x] Integrate CodeMirror 6 with basic markdown highlighting
- [x] Implement file opening/switching
- [x] Basic file saving functionality (with auto-save)
- [x] Set up state management with Zustand
- [x] File watcher for external changes

**Deliverable:** Basic editor that can open a folder, display files, and edit/save markdown

---

**Phase 2: Astro Integration (Week 3-4)**
*Goal: Parse Astro config and handle content collections*

**Week 3:**
- [ ] Implement TypeScript parser for `src/content/config.ts`
- [ ] Extract collection definitions and Zod schemas
- [ ] Create data structures for collections and schemas
- [ ] Display collections in sidebar instead of raw files

**Week 4:**
- [ ] Parse frontmatter from markdown files
- [ ] Hide frontmatter from CodeMirror display
- [ ] Create basic frontmatter editing panel
- [ ] Implement Zod-to-form-field generation
- [ ] Sync frontmatter panel with file contents

**Deliverable:** Editor that understands Astro content collections and can edit frontmatter via forms

---

**Phase 3: Enhanced Editor Experience (Week 5-6)**
*Goal: Beautiful, iA Writer-inspired editing experience*

**Week 5:**
- [ ] Implement iA Writer-inspired typography and colors
- [ ] Create hanging hash marks for headings
- [ ] Custom CodeMirror theme matching iA Writer aesthetic
- [ ] Hide MDX imports for MDX files
- [ ] Improve markdown syntax highlighting

**Week 6:**
- [ ] Implement image drag & drop functionality
- [ ] Auto-copy images to `src/assets/[collection]/` with date prefixes
- [ ] Insert markdown image syntax at drop location
- [ ] Add keyboard shortcuts (Cmd+B, Cmd+I, Cmd+K, etc.)
- [ ] Implement auto-formatting on save

**Deliverable:** Beautiful, responsive editor with excellent UX for markdown writing

---

**Phase 4: Polish & Performance (Week 7-8)**
*Goal: Production-ready reliability and performance*

**Week 7:**
- [ ] Implement auto-save (every 30 seconds + on blur)
- [ ] Add error handling and graceful degradation
- [ ] Optimize for large collections (virtualized lists)
- [ ] Add search functionality for large collections
- [ ] Crash recovery and unsaved changes detection

**Week 8:**
- [ ] Performance optimization and profiling
- [ ] Add comprehensive keyboard shortcuts
- [ ] Implement proper macOS integration (menu bar, etc.)
- [ ] Add file operations (delete, rename, duplicate) via context menu
- [ ] Create new file functionality with auto-generated frontmatter

**Deliverable:** Stable, performant editor ready for daily use

---

**Phase 5: Stretch Goals (Week 9+)**
*Goal: Advanced features that differentiate from basic editors*

**Priority 1 (Week 9):**
- [ ] Focus mode highlighting current sentence/paragraph
- [ ] Image preview on hover over markdown image syntax
- [ ] Better error messages and user guidance

**Priority 2 (Week 10):**
- [ ] MDX component discovery from `src/components/mdx/`
- [ ] Slash command system for inserting MDX components
- [ ] Auto-import management for MDX components

**Priority 3 (Future):**
- [ ] Writing analysis (sentence complexity, readability)
- [ ] Syntax highlighting by parts of speech
- [ ] Typewriter mode (current line stays centered)

**Deliverable:** Feature-rich editor that provides unique value for Astro content creators

---

### Technical Milestones

**Week 2 Checkpoint:**
- Can open project, browse files, edit and save markdown
- Basic UI layout working

**Week 4 Checkpoint:**
- Understands Astro content collections
- Frontmatter editing works
- Collections displayed properly

**Week 6 Checkpoint:**
- Beautiful editing experience
- Image handling works
- Feels like a dedicated writing tool

**Week 8 Checkpoint:**
- Production ready
- All core features implemented
- Performance optimized

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
