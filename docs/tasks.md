## Implementation Plan

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

- [x] Pull in basic shadui components we're probably gonna need so they're available for us to use (see https://ui.shadcn.com/docs/components).
- [x] Manual refactoring and cleaning up of codebase, upgrade to React 19 and Tailwind 4. Reinstall all shadCN packages manually.
- [x] Ensure we are set up for Tailwind v4 in accordance with this guide: https://ui.shadcn.com/docs/tailwind-v4
- [x] Bug: When saving, the whole app refreshes back to its initial state (but the save works)
- [x] Bug: When saving changes to frontmatter, the frontmatter is reordered in the markdown docs. The easiest solution here is to ensure it is always ordered as per the order in the schema, with any extra fields not in the schema in their original order.
- [x] Refine frontmatter sidebar panel UI
  - [x] Use shadcn components and refactor to use the shadcn Form structures
  - [x] Remove the header completely - we don't need it (frontmatter using X schema)
  - [x] If title field exists, make it a slightly bigger text size
  - [x] Ensure the switches work properly with the labels - the labels for these should not be above the input but next to them. Likle in most settings apps.
  - [ ] The two textareas do not expand vetically with their content. I think this should be the default behaviour of shadcn's <Textarea> so let's work out what's preventing it working.
  - [x] Add a way to clear datepicker fields - currently if a date is set it cannot be removed.
  - [x] Implement https://github.com/JaleelB/emblor for handling array fields. Make it work with the latest tailwind and shadcn if needed (more at https://emblor.jaleelbennett.com/introduction).
  - [x] Platform is an enum field in the astro schema. So it shuold render a dropdown not a textbox. The dropdown should have a blank option which removes the property (same behavior as blank fields for other things.)
  - [ ] Ensure properties which are arrays of strings in the schema (or frontmatter) use the `tag-input.tsx` element we defined and check it works properly.
- [ ] Make the frontmatter panel resizeable (using the shadcn `redizable` component maybe?) Should have sensible min and max widths.
- [ ] Improvement to macos menubar: Replace our custom implementation of the "traffic light" window controls with https://github.com/agmmnn/tauri-controls.
- [ ] Bug: Cmd + F does not open proper fullscreen. Cmd + Q does not quit the app. The menubars should properly include these.
- [ ] Left sidebar UI improvements
  - [ ] Completely rebuild the left sidebar with shadcn's components (see https://ui.shadcn.com/docs/components/sidebar). The sidebar header "Collections" should only say "Collections" when not inside a collection. Once the user has clicked into a collection it should use the name of the collection, capitalised. Eg "Articles" or "Notes". When inside a collection there should be a back arrow which takes you back up to the collections list. We can then remove everything bar the list of items in the collection from the scrollable area of the sidebar. We can maybe use Shadcn's sidebar patterns to make this UI work a bit better.
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
  - Move this new structure into `test/dummy-astro-project` and add an `npm run reset:testdata` command to copy this to `/temp-dummy-astro-project`. The temp version should be gitignored - it will be used for local manual testing and can be modified freely via the app interface by the developer. Both of these firectories should be ignored by all linting, testing and build tools, including vite. Look for existing `dummy-astro-project` strings in the project for this bit.
- [ ] Review all non-shadci React code for opportunities to extract reusable components or simplify to make things more readable/understandable etc. Refactor as needed.
- [ ] Review all typescript code to ensure we're making full use of the various types and interfaces we've defined in `store/index.ts` and elsewhere. Can we improve simplicity and type safety elsewhere in the app by using typescript types well?
- [ ] Review our approach to parsing `content.config.js` - I think we currently use RegEx, but if we're able to execute JS/TS in the compiled Tauri app it may be possible to use `zod` to read and understand the schema in a more robust/efficient/safe way. Could we use the md/mdx files and zon schemas to creat our own typesafe objects, which our UI components can read? This would probably involve the the rust backend talking more with the TS front-end etc.
- [ ] Rework (or add to) the tests so they actually test all the weird little bits of business logic we've now got in our code. Our tests must encode our business logic effectively and not be over-bloated testing obvious things.
- [ ] Update `CLAUDE.md` with clear descriptions of the new design patterns etc we have introduced, current project structure, examples, npm commands etc. Add instructions to check the shadcn docs when needed (with the appropriate tool calls to do so). Make sure LAUDE.md is the best it can be.

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
