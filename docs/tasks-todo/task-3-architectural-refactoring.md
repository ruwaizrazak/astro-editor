# Task 3: Architectural Refactoring & State Management Consolidation

## 1. Objective

With TanStack Query now managing server state and the MDX Component Inserter establishing new UI patterns, this task focuses on a deep architectural refactoring of the remaining client state. The primary goal is to simplify state management by decomposing the monolithic `useAppStore` into smaller, domain-specific stores, aligning the entire application with best practices for performance and maintainability.

This task will leverage the insights from the original `GEMINI_REPORT.md`, adapting them to the application's new state.

---

## 2. Core Task: Decompose the Monolithic Zustand Store

The most critical piece of technical debt is the monolithic `useAppStore` in `src/store/index.ts`. It currently manages multiple, unrelated domains of state (UI state, editor content, project settings), leading to poor performance (unnecessary re-renders) and difficulty in maintenance.

This task will refactor the "God Store" into logical, feature-based slices.

### 2.1. Implementation Plan: Store Slicing

We will split `useAppStore` into three distinct, more focused stores.

**1. `useEditorStore`**

- **Responsibility:** Manages the state of the currently open file. This is the most volatile state and must be isolated to prevent unnecessary re-renders in other parts of the UI.
- **State to Migrate:** `currentFile`, `editorContent`, `frontmatter`, `rawFrontmatter`, `imports`, `isDirty`, `autoSaveTimeoutId`.
- **Actions to Migrate:** `openFile`, `closeCurrentFile`, `saveFile`, `setEditorContent`, `updateFrontmatter`.
- **New File:** `src/store/editorStore.ts`

**2. `useProjectStore`**

- **Responsibility:** Manages the core project data, collections, and file lists. This state changes much less frequently than the editor's state.
- **State to Migrate:** `projectPath`, `collections`, `files`, `selectedCollection`.
- **Actions to Migrate:** `setProject`, `loadCollections`, `loadCollectionFiles`, `createNewFile`.
- **Note:** After `task-1`, these actions will be simple wrappers around `useQuery` or `useMutation` hooks, or they may be removed entirely in favor of direct component-level data fetching. This store will primarily hold the _identifiers_ (like `projectPath` and `selectedCollection`) that the rest of the app needs to derive its queries.
- **New File:** `src/store/projectStore.ts`

**3. `useUIStore`**

- **Responsibility:** Manages transient UI state that affects the global layout.
- **State to Migrate:** `sidebarVisible`, `frontmatterPanelVisible`.
- **Actions to Migrate:** `toggleSidebar`, `toggleFrontmatterPanel`.
- **New File:** `src/store/uiStore.ts`

### 2.2. Component Refactoring

After the stores are sliced, all components currently using `useAppStore` must be updated to subscribe to the new, more granular stores. This will significantly improve performance.

**Key Components to Update:**

- `Layout.tsx`: Will now subscribe to `useUIStore` and `useEditorStore` (only for `currentFile`).
- `Sidebar.tsx`: Will subscribe to `useProjectStore`.
- `MainEditor.tsx`: Will subscribe to `useEditorStore`.
- `FrontmatterPanel.tsx`: Will subscribe to `useEditorStore`.
- All hooks (like the newly refactored `useHotkeys` setup) must also be updated to pull state and actions from the correct new stores.

---

## 3. Secondary Task: Decompose UI Components

With the state logic cleaned up, we can now apply the same principles to the UI components as recommended in the original report.

### 3.1. Decompose `FrontmatterPanel.tsx`

- **Action:** Extract the individual field components (`StringField`, `BooleanField`, etc.) from `FrontmatterPanel.tsx` into a dedicated directory: `src/components/FrontmatterFields/`.
- **Rationale:** This separates the panel's layout logic from the implementation of its form fields, making both easier to manage and extend. `FrontmatterPanel.tsx` will become a cleaner orchestrator component.

### 3.2. Simplify `Sidebar.tsx` with a Custom Hook

- **Action:** Extract the file renaming logic (state and handlers) from `Sidebar.tsx` into a new `useFileRenaming` custom hook.
- **Rationale:** This simplifies the `Sidebar` component, making it more focused on presentation. The renaming logic becomes an encapsulated, reusable, and independently testable unit.

---

## 4. Expected Outcome

Upon completion of this task, the application's frontend architecture will be significantly more robust, performant, and maintainable.

- State management will be modular and domain-driven.
- Component re-renders will be minimized.
- The codebase will be easier to navigate and for new developers to understand.
- The foundation for future feature development will be much stronger.
