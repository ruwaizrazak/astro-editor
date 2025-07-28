# Task: Global New Note Window and Editor

Prompt: "Use technical-prd-generator to turn this document into a better task description. Seek advice from tauri-v2-expert if needed to understand how the Tauri parts work. Then use the designer agent to design a beautiful minimal UI and pass that to macos-ui-engineer for refinement and a practical implementation. When you are done, pass that to a react-performance-engineer for a review of the front-end implementation. If you need you may also use codemirror-6-specialist for advice on implementing codemirror, but I don;t think you'll need it. After each stage of thisyou should write comprehensive notes to this document. When you are done, use the main thread with all your context of how this app works to ensure you have a super solid expecution plan for this feature which can be executed sequentially to create this feature With minimal impact from me. Do not begin executing; your job here is to make sure your plan is as solid as possible. It's okay if this document ends up being quite long."

https://github.com/dannysmith/astro-editor/issues/4

Implement a global quick-entry window that can be summoned from anywhere on the system via keyboard shortcut, allowing users to rapidly capture notes without opening the main application.

## Overview

Create a lightweight, floating note capture window that appears on top of all other applications when triggered by a global keyboard shortcut. This "quick entry panel" should provide immediate access to note creation with minimal friction.

## Core Requirements

### Window Behavior

- Global keyboard shortcut activation (system-wide, works when app is closed)
- Floating window that appears on top of all other applications. Remains until manually dismissed
- Compact, focused interface optimized for quick text entry
- Auto-saves and closes when user presses designated save shortcut
- Can be dismissed/canceled without saving

### Editor Features

- Simplified markdown editor (subset of main editor features) - should just do normal markdown highlighting. No need for slash commands and the like. Design based on current editor tho.
- Basic frontmatter editing capabilities
- Auto-completion for common fields
- Real-time preview of markdown formatting

### Collection Management

- User preference to set default "quick notes" collection
- Validates that selected collection exists and is accessible

### User Experience

- Instant appearance with keyboard focus in the editor
- Minimal UI chrome to maximize writing space
- Clear visual indication of which collection will receive the note
- Smooth animations for window appearance/dismissal
- Global Keyboard shortcut can be customised in Preferences

## Technical Notes

- Utilizes Tauri v2 Global Shortcut plugin
- Separate window instance from main application
- Lightweight bundle to ensure fast startup time

## References

- [Tauri v2 Global Shortcut Plugin](https://v2.tauri.app/plugin/global-shortcut/)
