## Implementation Plan

Completed phases are in @tasks-archived.md

**Phase 4: Polish, Usability & Performance**
_Goal: Production-ready reliability and performance_

**Phase 4.1 - Polish, Resiliance & Usability**

- [x] Bugs
  - [x] Codemirror is showing an autocomplete menu for HTML tags when I type `<` - turn it off.
  - [x] Syntax highlighting for markdown (bold, italic etc) does not work inside HTML tags. Can we make it easily or not? - Research
- [x] Review EditorView.tsx. It is now a HUGE file and me must be able to extract a lot of the functioonality into helpers, utils, other React components etc? Think like an expert front-end architect and plan a detailed refactor to separate things. Be careful not to break or alter the functionality while doing this.
  - [x] Bugs from refactor:
    - [x] Markdown syntax highlighting is no longer working for markdown image tags. It's fine for links.
    - [x] Holding Option and hovering over a URL no longer highlights it with a blue background and changes the cursor to a pointer. It still opens fine when clicked.
    - [x] The menubar menu items for bold, italic, add link and all the heading/prargraph ones should be disabled unless a markdown file is open and focussed in the editor window. They are always enabled.
    - [x] Remove any unnececarry comments and logging (but leave those which are helpful for understanding how thigns work in the future)
    - [x] Comprehensively review CLAUDE.md and update with the current structure, features, code patterns, architectural patterns etc. We have mostly been working with the markdown code editor recently. Add instructions to Claude Code for how an when to extract code into `lib` and `hooks` and what patterns to use. Explain how and why some application state is stored in zustand, and some ui state is in `Layout.tsx`. Ensure this file is as useful as possible for future sessions. If you think it makes sense, you can create other markdown files in docs and reference them from CLAUDE.md.
    - [x] Add tests for extracted logic where needed
- [x] Update `ia-writer-ui.md` to include current size values etc from codebase. Only the line-heights and font sizes need to change, I think? Maybe also add character spacing in place of font variation settings.
- [ ] Consider Optimization for potential large content collections (virtualized lists, lazy loading etc?) - do we need to care about this? What's the simplest approach?
- [ ] Handle simple crash recovery and unsaved changes recovery - we probably only need to worry about the auto-save or save functionality breaking. If it does, we should write the current file (and frontmatter) to a temporary folder somewhere suitable (macos Application Support etc?) so it can be recovered later if needed.
- [ ] Set up easy mechanism for displaying notifications to the user in a toast. Use the shadcn component. MAke it easy to dispatch messages from anywhere in the TS code. Document this pattern in the docs. Add sensible notifications wherever there is an error the user needs to know about (parsing schema, loading a project, opening a file etc).
- [ ] Implement simple `Cmd + P` command pallete to execute common commands etc (use https://ui.shadcn.com/docs/components/command): New [Article, Note etc - based on collections in schema], Open Collection, Open Project etc. Must be easily extensible in the future and know the currently selected collection and content item (if any), and perhaps the currently selected text if in the editor pane?. This may be an opportunity to think about how we handle various Internal messaging, commands, etc.

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
