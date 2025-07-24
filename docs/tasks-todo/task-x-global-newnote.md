# Task: Global New Note Window and Editor

https://github.com/dannysmith/astro-editor/issues/4

Implement a global quick-entry window that can be summoned from anywhere on the system via keyboard shortcut, allowing users to rapidly capture notes without opening the main application.

## Overview

Create a lightweight, floating note capture window that appears on top of all other applications when triggered by a global keyboard shortcut. This "quick entry panel" should provide immediate access to note creation with minimal friction.

## Core Requirements

### Window Behavior

- Global keyboard shortcut activation (system-wide, works when app is closed)
- Floating window that appears on top of all other applications
- Compact, focused interface optimized for quick text entry
- Auto-saves and closes when user presses designated save shortcut
- Can be dismissed/canceled without saving

### Editor Features

- Simplified markdown editor (subset of main editor features)
- Basic frontmatter editing capabilities
- Auto-completion for common fields
- Real-time preview of markdown formatting

### Collection Management

- User preference to set default "quick notes" collection
- Option to switch between collections within the quick entry window
- Remembers last-used collection for subsequent quick entries
- Validates that selected collection exists and is accessible

### User Experience

- Instant appearance with keyboard focus in the editor
- Minimal UI chrome to maximize writing space
- Clear visual indication of which collection will receive the note
- Smooth animations for window appearance/dismissal

## Technical Notes

- Utilizes Tauri v2 Global Shortcut plugin
- Separate window instance from main application
- Lightweight bundle to ensure fast startup time

## References

- [Tauri v2 Global Shortcut Plugin](https://v2.tauri.app/plugin/global-shortcut/)
