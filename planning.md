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
