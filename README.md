# Astro Editor

## Features

- Super-clean minimal markdown editor inspired by iA Writer, supporting markdown and MDX files. Hides YAML frontmatter and component imports so you can focus on your writing.
- User-friendly frontmatter panel based on the file's frontmatter **and the colection schema**, including validation and a specific UI for common fields like `title` and `description` (configurable).
- In MDX files `Cmd + /` opens palette to quickly insert Astro components intended for use in MDX files (eg `<Callout>`). Props can be selected and tabbed through after insertion. Available component and their props are read from your Astro project. Defaults, slots and required props are respected.
- File List sidebar ordered by `pubFate` field (not filename), with drafts clearly marked (configurable).
- Dragging images/files into the editor copies them to your astro `assets` folder (with a web-save filename) and inserts the correct markdown tag.
- Focus and typewriter mode a la iA Writer.
- Command pallete for quick access to all commands, including _Open Project/Collection/Current File_ in your configured IDE.
- Duplicate, rename and create new files easily.
- Keyboard shortcuts for inline markdown formatting, toggling headings etc. Pasting URLs over selected text inserts a link tag. Holding option makes URLs clickable. Multiple cursors a la VSCode.
- Autosave & crash recovery.

## Supported Astro Projects

- Supported Astro Versions: > 5.x
- Supported Content Collections: Astro 4+ [content collections](https://docs.astro.build/en/guides/content-collections/) defined in `content.config.ts` using the `glob` loader. Non-`.md/.mdx` files in these collections will be ignored.

By default Astro Editor expects the following structure in your Astro project:

```
my-astro-site
└── src
    ├── assets
    │   └── mycollection
    │       └── image1.png
    ├── components
    │   └── mdx
    │       └── ExampleAstroComponent.astro
    ├── content
    │   └── mycollection
    │       └── blog-post.mdx
    └── content.config.ts
```

The paths to the _Assets_, _Content_ and _MDX Components_ directories (relative to the project root) are configurable per-project, but their internal structures are not.

## Installation

Download the [latest Release](https://github.com/dannysmith/blog-editor/releases)

## User Guide

See [User Guide](docs/user-guide.md)

## Disclaimer ⚠️

If you're gonna install this, you should know...

I haven't written any JS/TS or React for ~5 years and never did much before that, so my understanding of React is shaky at best and it turns out I've forgotten a lot of JavaScript. I've **read** a bit of TypeScript recently, I've basically never written it. I've never written a line of Rust in my life. I'd never heard of Tauri before starting this project. And I haven't written production code for a real product in ~8 years.

This project started as an exercise in **learning**, the primary goal of which was to work heavily with Claude Code and Gemini for a few weeks to "mostly vibe code" an app which _just maybe_ might be useful to me at the end of it.

So I'm not kidding when I say "vibe coded"...

- I've hand-written < 1% of the code in this project.
- I've read _in detail_ < 10% of it and have maybe skim-read 50-60%.
- I've spent **a lot** of time writing detailed markdown insturctions, reviewing and editing AI-generated technical plans and course-correcting AI re technical approach & architecture as it works.
- I've intentionally avoided giving instructions about the actual code. I've been more like _"No stop, it feels like we'vemissed the root cause. That last error makes me thing `isDirty` is being messed with somehow. Maybe add some logging to `EditorView.tsx` and we can look at the console? Or look online for reference implementations?"_
- I intentionally broke my Number One Rule of New Projects: **always have a functioning walking skeleton and docs before you write features**. The test system, design patterns, UI component libraries, state management, linting & formatting tools, component architecture, docs and AI instructions were all retrofitted **AFTER** AI built the core features. This was obviously a massive headache, but I wanted to learn how Claude Code behaved without all the guardrails which those things provide.

While I'm doing my best to keep this codebase somewhat sane, secure, performant & maintainable... the primary goal of this project is still **learn by mostly vibe coding**.

So please... don't judge me on the code. And while haven't had a problem yet, it's probably best to commit regularly in your Astro project if you're writing a lot of stuff in Astro Editor.

## Feature Requests & Bug Reports

### Bug Reports

**Please** file an issue if you experience:

- Problems handling your Astro schema, frontmatter or directory structure
- Problems reading or writing your Markdown/MDX files – especially if it caused corruption or data loss in your astro site
- Problems handling your "MDX" Astro components
- Changes to how Astro works which have broken something
- Crashes or bugs
- Confusing or unexpected UI behavior or UX
- Debilitating performance issues

### Feature Requests

Feature requests are **always** welcome.

1️⃣ This project is designed to provide a pleasent user expereince when authoring or editing markdown & MDX files in the content collections of local Astro sites. It's fof when you're in "writer mode", not "coder mode". Everything else about managing an Astro site should happen when you're in "coder mode", and therefore in your text editor & terminal. Anything to do with git, publishing, deploying or code is **explicitly out of scope** and will remain so.

2️⃣ The goal of this is project is **simplicity when writing**, so the UI/UX is intentionally opinionated. Configuration options are deliberatly limited to "making it work with your astro project and no more". I'm unlikeley to accept features which add complexity to the UI or customization/extensibility.

I appreciate all feature requests which are mindful of 👆 and are written clearly enough for me to understand them.

### Pull Requests

PRs most welcome. See [CONTRIBUTING.md](docs/CONTRIBUTING.md)

## Roadmap

See the [GitHub Project]()

## Thanks 🙏

- [iA Writer](https://ia.net/writer) for the inspiration and [beautiful typefaces](https://github.com/iaolo/iA-Fonts).
- [DarkMatter](https://getdarkmatter.dev/) because [Vadim](https://vadimdemedes.com/) did this before me.

# Development

## Quick Start

### Installation

### Basic Workflow

## Developer Docs

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) and the [developer docs](docs/developer/).
