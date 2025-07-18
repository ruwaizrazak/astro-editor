# Tauri + React Kickstarter Guide: An AI-Friendly "Walking Skeleton"

## 1. Introduction

This document outlines a "walking skeleton" for building robust, maintainable, and scalable desktop applications using Tauri and React. The goal is to establish a clear, modern, and opinionated project structure and architecture *before* writing the first feature.

This setup is designed to be highly effective for human developers and AI coding agents alike. It promotes best practices, separation of concerns, and provides clear instructions and patterns to follow, reducing ambiguity and leading to a higher-quality codebase.

---

## 2. Core Philosophy: A "Best-of-Breed" Stack

Instead of a monolithic framework like Next.js, we embrace a more flexible, "best-of-breed" approach with Vite as the foundation. We will compose our application by integrating a curated stack of powerful, focused libraries.

*   **Build Tool:** **Vite** (Fast, simple, the Tauri standard).
*   **Frontend Framework:** **React** (For building the UI).
*   **Styling:** **Tailwind CSS** (For utility-first styling).
*   **UI Components:** **Shadcn/ui** (For unstyled, accessible, and composable component primitives).
*   **State Management:** A clear, multi-layered strategy (see Section 6).
*   **Data Fetching/Caching:** **TanStack Query** (For managing data from the Rust backend).

---

## 3. Initial Project Setup

### 3.1. Scaffolding

Begin by scaffolding the application using the official Tauri CLI with the `react-ts` template.

```bash
npm create tauri-app@latest -- --template react-ts
```

### 3.2. Directory Structure

A well-organized directory structure is crucial for maintainability.

```
/
├── docs/                  # Project documentation, PRDs, tasks
│   ├── features/          # One MD file per feature PRD
│   ├── tasks-todo.md
│   ├── tasks-wip.md
│   └── tasks-done.md
├── public/                # Static assets
├── src/
│   ├── assets/            # Fonts, images, etc.
│   ├── components/
│   │   ├── layout/        # Main layout components (Sidebar, RootLayout)
│   │   └── ui/            # Shadcn-ui components (do not edit manually)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Core utilities, helpers, and command system
│   ├── services/          # The API layer (TanStack Query + Tauri invoke)
│   ├── store/             # Zustand stores for global UI state
│   └── types/             # Shared TypeScript types
├── src-tauri/             # Rust backend
└── ... (config files)
```

### 3.3. Initializing UI & Styling

1.  **Install Tailwind CSS:** Follow the official `tailwindcss` guide for Vite.
2.  **Initialize Shadcn/ui:**

    ```bash
npx shadcn-ui@latest init
    ```

    When prompted, use these settings:
    *   **Default styling:** `New York`
    *   **Base color:** `Slate`
    *   **CSS variables:** `Yes`
    *   **`tailwind.config.js`:** `tailwind.config.js`
    *   **Components alias:** `~/components`
    *   **Utils alias:** `~/lib/utils`
    *   **`React Server Components`:** `No`
    *   **`components.json`:** `Yes`

3.  **Install Core UI Components:** Pre-install a set of common components to build the skeleton.

    ```bash
npx shadcn-ui@latest add button dialog input sonner resizable-panels toast
    ```

---

## 4. Tooling & Quality Assurance

### 4.1. Linter & Formatter Configuration

Ensure `eslint.config.js`, `.prettierrc`, and `src-tauri/rustfmt.toml` are configured with sensible defaults to enforce a consistent code style.

### 4.2. The "Master" Check Script

Add a `check:all` script to `package.json`. This script is the single source of truth for code quality. It should be run before every commit and after any significant change.

```json
// package.json
"scripts": {
  // ... other scripts
  "typecheck": "tsc --noEmit",
  "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
  "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,css,md}\"",
  "rust:fmt:check": "cd src-tauri && cargo fmt --check",
  "rust:clippy": "cd src-tauri && cargo clippy -- -D warnings",
  "rust:test": "cd src-tauri && cargo test",
  "test": "vitest",
  "test:run": "vitest run",
  "check:all": "npm run typecheck && npm run lint && npm run format:check && npm run test:run && npm run rust:fmt:check && npm run rust:clippy && npm run rust:test"
},
```

### 4.3. Instructions for AI Agents

> **AI Agent Instruction:** After making any significant code modifications, you **must** run the `npm run check:all` command to verify that your changes have not introduced any regressions, type errors, or style violations. Address any reported issues before considering the task complete.

---

## 5. Core Architectural Patterns

### 5.1. Component Design Philosophy

To avoid massive, unmaintainable React files, adhere to these principles:

1.  **One Component Per File:** Each React component should be in its own `.tsx` file.
2.  **Extract Logic into Hooks:** If a component has any non-trivial logic (e.g., `useEffect`, state management, complex event handlers), extract it into a custom hook (e.g., `useFileRenaming.ts`). The component should be left with primarily presentational code.
3.  **Smart vs. Dumb Components:**
    *   **Smart (Container) Components:** These components are responsible for fetching data and managing state. They often live in the `layout` directory or are higher-level feature components.
    *   **Dumb (Presentational) Components:** These components receive data and functions via props. They are not aware of where the data comes from.

### 5.2. The State Management Onion (Strategy)

State should be stored at the most appropriate level. Think of it as an onion, from the outside in:

1.  **Level 1: Persistent User Settings (On Disk)**
    *   **What:** Data that must survive application restarts (e.g., theme preference, window size, API keys).
    *   **How:** Managed via Rust commands that read/write to a `settings.json` file in the Tauri app data directory. Create a `useSettings` hook in React to interact with it.

2.  **Level 2: Cached Server/Backend State (TanStack Query)**
    *   **What:** Data that originates from the Rust backend (e.g., file lists, project collections, file content). This data has a lifecycle of its own and needs caching, refetching, and invalidation.
    *   **How:** Use **TanStack Query**. All `invoke` calls should be wrapped in `useQuery` or `useMutation` hooks within the `src/services/` directory. This handles loading, error, and caching states automatically.

3.  **Level 3: Global UI State (Zustand)**
    *   **What:** Transient global state related to the UI (e.g., `isSidebarVisible`, `isCommandPaletteOpen`). This state does not need to be cached in the same way as backend data.
    *   **How:** Use **Zustand**. Create small, sliced stores for different UI domains (e.g., `useUIStore.ts`, `useEditorStore.ts`).

4.  **Level 4: Local Component State (`useState`)**
    *   **What:** State that is only relevant to a single component (e.g., the value of an input field, whether a dropdown is open).
    *   **How:** Use the standard `useState` and `useReducer` hooks.

---

## 6. "Walking Skeleton" Implementation

This section describes the pre-built systems to set up.

### 6.1. Resizable Layout & Title Bar

*   **`UnifiedTitleBar.tsx`:** A component that uses `data-tauri-drag-region` for a custom, draggable title bar.
*   **`RootLayout.tsx`:** Use Shadcn's `<ResizablePanelGroup>` to create a main layout with a collapsible sidebar. The collapsed state should be managed by a `useUIStore` (Zustand).

### 6.2. Settings & Recovery System (Rust -> TypeScript)

*   In `src-tauri/src/main.rs`, create Tauri commands:
    *   `get_app_data_dir()`: Returns the path to the app's data directory.
    *   `save_settings(settings: String)`: Writes a JSON string to `settings.json`.
    *   `load_settings()`: Reads and returns the `settings.json` string.
    *   `save_crash_report(report: String)`: Saves a crash report to a timestamped file.
*   In React, create a `useSettings.ts` hook that uses these commands to provide and update settings.

### 6.3. Menu & Command Bridge

*   **Tauri -> React:** In `main.rs`, define your menu items. When a menu item is clicked, emit an event to the frontend (e.g., `window.emit('menu-event', 'new-file')`). Create a `useMenuListeners.ts` hook in React to listen for these events and call the appropriate functions.
*   **React -> Tauri:** Create a command `update_menu_item(id: String, state: MenuItemState)` in Rust. In React, you can call `invoke('update_menu_item', ...)` to enable/disable menu items based on application state (e.g., disable "Save" when `isDirty` is false).
*   **Command System:** Create a `lib/commands.ts` file that defines a global command registry. This allows different parts of the app to register and execute commands (e.g., "createNewFile", "toggleTheme") without being directly coupled. The Command Palette and menu listeners can then simply execute commands from this registry.

### 6.4. Toast Notification System

*   Use the pre-installed `sonner` component from Shadcn.
*   Create a `lib/toast.ts` utility that exports a simple `toast` object (e.g., `toast.success('File saved!')`).
*   Create a Rust command `show_toast(level: String, message: String)` that emits an event to the frontend. A listener in React will then call the appropriate `toast` function. This allows your Rust backend to display notifications in the UI.

### 6.5. Settings Dialog

*   Create a `PreferencesDialog.tsx` component using the Shadcn `Dialog`.
*   Inside, create different "panes" or sections for different categories of settings (e.g., General, Editor, Account).
*   The state for the settings should be managed by the `useSettings` hook.
