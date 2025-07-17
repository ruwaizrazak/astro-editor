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
  - [x] Ensure properties which are arrays of strings in the schema (or frontmatter) use the `tag-input.tsx` element we defined and check it works properly.
- [x] Make the frontmatter panel resizeable (using the shadcn `redizable` component maybe?) Should have sensible min and max widths.
- [x] Bug: Cmd + F does not open proper fullscreen. Cmd + Q does not quit the app. The menubars should properly include these.
- [x] Left sidebar UI improvements
  - [x] Completely rebuild the left sidebar with shadcn's components (see https://ui.shadcn.com/docs/components/sidebar). The sidebar header "Collections" should only say "Collections" when not inside a collection. Once the user has clicked into a collection it should use the name of the collection, capitalised. Eg "Articles" or "Notes". When inside a collection there should be a back arrow which takes you back up to the collections list. We can then remove everything bar the list of items in the collection from the scrollable area of the sidebar. We can maybe use Shadcn's sidebar patterns to make this UI work a bit better.
  - [x] Each content item in the left sidebar should display:
    - Title: use the "title" frontmatter field if it exists, otherwise use the filename
    - Filename (small, subdued, in monospace font)
    - Published date (if present): check for `pubDate` or `date` or `publishedDate` etc if present in the frontmatter, otherwise do not render anything.
    - A small grey "MDX" badge if the file extension is MDX
    - A small orange "Draft" badge if the frontmatter has `draft:true` set.
  - [x] The content items should be ordered according to published date in reverse chronological order. Use `pubdate` or `date` or `publishedDate` if present in the frontmatter. Ignore dates in filenames. Items without a published date should appear at the top.
  - [x] If not done already: fix hover and selected states
  - [x] Backend enhancement: Added frontmatter parsing to FileEntry for proper title display, draft detection, and date-based sorting
  - [x] Sidebar positioning: Fixed sidebar to be inside main content container with proper clipping
  - [x] Sidebar resizing: Integrated with ResizablePanel system with sensible min/max defaults
  - [x] Enhanced selected state: Made selected items more visible with primary accent colors
- [x] Improve the dummy data in `dummy-astro-project` so its's easier for us to test (both manually and automated):
  - [x] Keep a few of the real examples and the styleguides but clear out some of theother stuff.
  - [x] Add some more dummy content pieces into the two collections with differring frontmatter, content, filename formats etc. Ensure all features of (GitHub-flavoured) markdown are present so we can easily test the markdown editor later on. Maybe add another collection? Do not change the `notes` or `articles` collection schemas in `content.config.json` - they are exact copies of the schema for my personal blog.
  - [x] Move this new structure into `test/dummy-astro-project` and add an `npm run reset:testdata` command to copy this to `/temp-dummy-astro-project`. The temp version should be gitignored - it will be used for local manual testing and can be modified freely via the app interface by the developer. Both of these firectories should be ignored by all linting, testing and build tools, including vite. Look for existing `dummy-astro-project` strings in the project for this bit.
- [x] Review all non-shadci React components for opportunities to extract reusable components or simplify to make things more readable/understandable etc. Refactor as needed.
- [x] Review all typescript code to ensure we're making full use of the various types and interfaces we've defined in `store/index.ts` and elsewhere. Can we improve simplicity and type safety elsewhere in the app by using typescript types well?
- [x] Add native context menu actions to files in FileList:
  - [x] Reveal in Finder - opens directory in finder
  - [x] Copy path to file - copies the absolute path to the file
  - [x] Delete - Deletes the file after confirmation. If easy, use the OS file deletion (so it goes to trash)
  - [x] Add "duplicate" to FileList context menu (append `-1` etc to filename before extension for new file)
- [x] Add ability to rename files in the FileList. This needs to work as seemlessly and easily as possible so it can be done quickly.
- [x] Create new file functionality for easy creation of new content items within collections. New files should be created with the mandatory frontmatter as per the schema and if pubDate, date or PublishedDate is a property it should be set to today's date.
  - [x] It should focus the "title" field in the frontmatter panel with its contents selected.
  - [x] We should add handling for cases where we're in a collection and there is no field named 'title' in the schema, in which case we shouldn't set one and should just focus the main editor window instead. Likewise if there is no date, pubDate or publishedDate field in the schema we should not create it in the frontmatter of the new file.
  - [x] Add a Cmd + N shortcut which creates a new file in the currently open collection. It should be disabled if no collection is selected.
- [x] Comprehensively review our approach to parsing `content.config.js` - I think we currently use RegEx, but if we're able to execute JS/TS in the compiled Tauri app it may be possible to use `zod` to read and understand the schema in a more robust/efficient/safe way. Could we use the md/mdx files and zod schemas to creat our own typesafe objects as representations of frontmatter/schema etc, which our UI components can read? This would probably involve the the rust backend talking more with the TS front-end etc. It may not be worth the effort to do this.
- [x] Comprehensively review our whole test suite so it actually test all the weird little bits of business logic we've now got in our code. Our tests must encode our business logic effectively and not be over-bloated testing obvious things.
- [x] Comprehensively review and reqrite `CLAUDE.md` with clear descriptions of the current design patterns, architecture, technology, examples, npm commands etc. Add instructions to check the docs when needed (with the appropriate Context7 tool calls to do so). Make sure CLAUDE.md is the best it can be. Also look for opportunities to gently optimise for token use without affecting its effectiveness.

---

**Phase 3: The Editor Experience (Week 5-6)**
_Goal: Beautiful, iA Writer-inspired editing experience_

**Phase 3.1 - The Markdown Editor**

- [x] Review our `EditorView` and configure CodeMirror so we're in the best possible starting point for working on the markdown editor.
- [x] Implement iA Writer-inspired typography (add iA Writer Duo variable font - https://github.com/iaolo/iA-Fonts)
- [x] Add editor keyboard shortcuts (Cmd+B, Cmd+I, Cmd+K, etc.)
- [x] Add: Pasting a URL over selected text inserts a markdown link properly
- [x] Ensure undo and redo work with the usual keyboard shortcuts.
- [x] Ensure all GFM features are fully supported
- [x] Hide initial MDX imports for MDX files
- [x] Set up to style markdown etc sensibly in editor
- [x] Add More Editor Keyboard Shortcuts
  - `Opt+Cmd+1` - Turn current line to H1
  - `Opt+Cmd+2` - Turn current line to H2
  - `Opt+Cmd+3` - Turn current line to H3
  - `Opt+Cmd+4` - Turn current line to H4
  - `Opt+Cmd+0` - Turn current line to plain paragraph
- [x] **MANUAL WORK FOR DANNY** - Codify iA Writer style in `/docs/ia-writer-ui.md` (See Figma)
  - [x] Extract Colours out
  - [x] Measure all breakpoints and associated line-heights etc.
  - [x] Recreate views in Figma sith a sensible base font-size -> identify all variables, breakpoints etc.
  - [x] Write up `/docs/ia-writer-ui.md` with final detailed UI specifications.
- [ ] Create theme for editor based on `/docs/ia-writer-ui.md` and current best practice for codemirror
  - [x] Set up reusable editor colour palette variables (see `/docs/ia-writer-ui.md`) in a way which makse it easy to add a dark mode later. Set editor background colour etc.
  - [x] Set default typography: size, weight, font-variant etc for all basic elements (text, headings, bold, italic). Remove or override any unwanted pre-existing styles.
  - [x] Add proper line-height etc and responsive typography (text size, line-height, max measure etc) for all viewport width breakpoints (see `/docs/ia-writer-ui.md`).
  - [x] Style carat and text-selection.
  - [x] Add MD syntax highlighting colours for all other elements (links, images, footnotes, strikethrough, inline code, code blocks, blockquotes etc)
  - [x] Style blockquotes niceley
  - [x] Add (or retain) colours for HTML/JSX tags which appear in the markdown (not in code blocks) - keep this very simple. Suggest:
- [x] Opening URLs via Opt Click
  - Hovering any URL while holding `Opt` changes the underline to the carat colour and the text to normal text colour and the pointer to a hand.
  - Clicking while holding `Opt` opens URL in the default browser.

**Phase 3.2 - Drag & Drop Images and Files**

- [ ] Implement image/file drag & drop functionality
  - Auto-copy to `src/assets/[collection]/` with auto-rename to kebabcase and date prefix etc.
  - If image: insert markdown image tag at drop location and focus alt text
  - If non-image file: insert markdown link tag and focus link text

**Deliverable:** Beautiful, responsive editor with excellent UX for markdown writing

---

**Phase 4: Polish, Usability & Performance**
_Goal: Production-ready reliability and performance_

**Phase 4.1 - Polish, Resiliance & Usability**

- [ ] Review EditorView.tsx. It is now a HUGE file and me must be able to extract a lot of the functioonality into helpers, utils, other React components etc? Think like an expert front-end architect and plan a detailed refactor to separate things. Be careful not to break or alter the functionality while doing this.
- [ ] Implement simple `Cmd + P` command pallete to execute common commands etc (use https://ui.shadcn.com/docs/components/command): New [Article, Note etc - based on collections in schema], Open Collection, Open Project etc. Must be easily extensible in the future and know the currently selected collection and content item (if any), and perhaps the currently selected text if in the editor pane?. This may be an opportunity to think about how we handle various Internal messaging, commands, etc.
- [ ] Consider Optimization for potential large content collections (virtualized lists, lazy loading etc?)
- [ ] Handle crash recovery and unsaved changes detection somehow? Probably just needs some temporary storage if the auto-save fails so users don't loose loads of work if they don't notice?
- [ ] Better error messages, toasts, empty states etc where needed
- [ ] Check keyboard shortcuts are comprehensive and all work. Review all right-click context menus, menubar menus etc and remove anything not implemented and conform to macOS norms
- [ ] Review all code for opportunities to simplify, refactor, make more readable/maintainable etc **without affecting functionality**.

**Deliverable:** Stable, performant editor ready for daily use

---

**Phase 5: Advanced Features**
_Goal: Advanced features that differentiate from basic editors_

**Phase 5.1 - Improved Writing Experience**

- [ ] Focus mode which greys out all but the current sentence/paragraph
- [ ] "Typewriter mode" (much like iA Writer)
- [ ] Image preview popover on hover over local image URL

**Phase 5.2 - Insert Astro Components into MDX files**

- [ ] Discovery of Astro components intended for use in MDX files (from `src/components/mdx/`)
- [ ] Slash command system for inserting Astro components in MDX files easily

**Phase 5.3 - User Preferences Settings & Open in IDE**

- [ ] Add simple preferences/settings window with `Cmd + ,` keyboard shortcut, menu item, cog icon in `UnifiedTitleBar.tsx` etc.
- [ ] User preferences should be saved to disk somewhere appropriate so they persist between launches.
- [ ] Section in app settings to view all discovered Astro components and toggle on and off.
- [ ] Section in settings to optionally override Astro deaults:
  - Path to Astro components for use in MDX files (default: `src/components/mdx/`)
  - Path to content directory (default: `src/content/`)
  - Path to assets directory (default: `src/assets/[collection name]/`)
  - "Published Date" frontmatter proeperty name (default: `date`, `pubDate` or `publishedDate`) - must be of type Date
  - "Title" frontmatter property name (default: `title`) - must be of type String
  - "Draft" frontmatter property name (default: `draft`) - must be of type Boolean
  - Command for "Open in IDE" button (default: ''), recommended setting: "code" or "cursor"
- [ ] Button in `UnifiedTitleBar.tsx` to "Open Project in IDE". Only appears if "Open in IDE" command is set in settings. Opens current project in IDE by passing its path to the command (eg. `code /Users/bob/dev/astrosite/` -> opens `astrosite` project in VSCode)

**Phase 5.4: Editor/Analysis Mode**

- [ ] Toggleable "editor mode" which enables text analysis features...
  - [ ] Coloured Nouns, Adverbs, Verbs, Conjunctions like iA Writer (see https://ia.net/writer/how-to/edit-and-polish) to help with editing. Should ignore code blocks, links, HTML/Astro tags, inline code etc.
  - [ ] Basic writing analysis algorithms (eg. sentence complexity, readability etc as per Hemmingway App).
- [ ] Ability to toggle OS-native spelling and grammar checking on and off.

**Deliverable:** Feature-rich writing & editing app with seamless astro integration.

**Phase 6: Pre-Release Tasks**

- [ ] Add custom App icons and confirm all package/app metadata is correct
- [ ] Add "About" dialog and menu item etc
- [ ] Series of Extensive Code Reviews with specific, focussed goals: "Look for opportunities to..."
  - Remove any shadcn UI components which are not used
  - Rename components, methods, variables etc for better readability: eg `comprehensiveMArkdownSyntaxParser` -> `MDSyntaxParser`
  - Refactor any overly "clever" TS code so it's easier to understand.
  - Extract TS functions into reusable helper/utility methods so React components easier for developers to parse without distraction.
  - Extract React components into their own files, aim for only one React component per file in most cases.
  - Remove all unnececarry wrapper divs (and wrapper React components which add no value).
  - Remove all redundant or unnececarry tailwind classes.
  - Remove all unnececary `console.log` and code comments.
  - Expert review of entire codebase for potential security issues.
- [ ] Performance optimization & profiling
- [ ] Automated production buld & Release for macOS (via GitHub actions?)
- [ ] Update all docs:
  - Create `docs/developer_guide.md` with comprehensive documentation on the project and how everything works, written for a human audience.
  - Move all working documentation/notes/specs/prds etc to `docs/archive` and mark as no longer relevant.
  - Update CLAUDE.md to remove all info on roadmap/planning etc and just contain optimal instuctions for working effectively on this project in the future.
  - Write a short, punchy README.md

## Potential Future Features

- [ ] AI Editing assistant
- [ ] "hang" header hashes in the left margin as per iA Writer
- [ ] Add very simple search functionality (by filename and title [if present] only)
