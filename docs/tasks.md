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
- [x] Consider Optimization for potential large content collections (virtualized lists, lazy loading etc?) - do we need to care about this? What's the simplest approach?
- [x] Handle simple crash recovery and unsaved changes recovery - we probably only need to worry about the auto-save or save functionality breaking. If it does, we should write the current file (and frontmatter) to a temporary folder somewhere suitable (macos Application Support etc?) so it can be recovered later if needed.
- [x] Set up easy mechanism for displaying notifications to the user in a toast. Use the shadcn component. MAke it easy to dispatch messages from anywhere in the TS code. Document this pattern in the docs. Add sensible notifications wherever there is an error the user needs to know about (parsing schema, loading a project, opening a file etc).

**Deliverable:** Stable, performant editor ready for daily use

---

**Phase 5: Advanced Features**
_Goal: Advanced features that differentiate from basic editors_

**Phase 5.1 - User Preferences Settings & Open in IDE Button**

- [ ] Add simple preferences/settings window. Should use standard shadcn/tailwind layout and existing patterns for doing this. We should use a Suitable component from Shadcn to keep this all within the React app. Settings panel should have "tabs" down the left for different panes on the right. We only need three panes right now -> General, Project Settings, Frontmatter Mappings. We will add more later. We may want to separate these into global settings and project settings somehow, perhaps with headings in the "tabs" sidebar. For now, we should only display project settings for the currently open project. Or if no project is open, display none of them. The right-hand panes should have a standard way of displaying form controls as you would expect in any other app settings panel. Again, use standard components. Think like an experienced front-end architect when designing the various React components for this.
- [ ] We must have an easy-to-use and repeatable way to read and write settings from our React components using the preferences system we have built. It should not be complicated and should follow an easy-to-understand pattern. To begin with, let's test this simply by writing one global setting From an appropriate form.
- [ ] Settings panel should be opened with `Cmd+,` keyboard shortcut, via a menu item in the apps osx menubar or via the command pallette.
- [ ] Path Overides pane allows user to optionally override Astro deaults paths for various things. Will need to update all code that usees these paths in the appropriate places. The defaults should be hard-coded as fallbacks in case there are no saved user preferences. These paths should be relative to the project root so they still work if a user moves their whole astro repo and reopens it.
  - Path to Astro content directory (default: `src/content/`)
  - Path to Astro assets directory (default: `src/assets/`)
  - Path to Astro components for use in MDX files (default: `src/components/mdx/`) [Not yet used]
- [ ] Frontmatter mappings pane allows users to override the default "special" frontmatter names we use in the app. These should look at the project's schema and only show valid options in dropdowns. Currently there are only four we care about:
  - "Published Date" used for ordering in the file list (default: `date`, `pubDate` or `publishedDate`) - must of type date in the schema
  - "Title" gets special treatment in the frontmatter panel (default: `title`) - must of type text in the schema
  - "Description" gets special treatment in the frontmatter panel (default: `description`) - must of type text in the schema
  - "Draft" gets a special marker in the file list (default: `draft`) - must of type boolean in the schema
- [ ] General panel only needs one setting for now:
  - Command for "Open in IDE" (default: ''), recommended setting: "code" or "cursor"
- [ ] If above setting is set, add three commands to the command palette.:
  - Opens Project in IDE -> eg `code /path/to/project/root`
  - Open collection in IDE -> eg `code /path/to/project/root/src/content/collectionname`. Only available when a collection is open.
  - Open file in IDE -> eg `code /path/to/currently/openfile.md`. Only available when a file is selected.

**Phase 5.2 - Improved Writing Experience**

- [ ] "Typewriter mode" (much like iA Writer)
- [ ] Small image preview popover when hovering over local image URL for >1.5 seconds -> use shadcn components for this

**Phase 5.3 - Insert Astro Components into MDX files**

- [ ] Discovery of Astro components intended for use in MDX files (from `src/components/mdx/`)
- [ ] Pane in settings to view all discovered Astro components and toggle on and off. Those switched _off_ are saved in the project settings.
- [ ] Slash command system for inserting Astro components in MDX files easily

**Phase 5.4: Copyediting and Analysis Mode**

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
