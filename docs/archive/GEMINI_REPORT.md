# Gemini Architect's Report: Astro Blog Editor

## 1. Executive Summary

This report provides a comprehensive architectural review of the Astro Blog Editor application. The project is well-structured, leveraging a modern technology stack with clear patterns. The existing documentation (`CLAUDE.md`, `initial-prd.md`) is excellent and provides a strong foundation.

This review identifies several opportunities to further enhance the architecture by improving separation of concerns, simplifying complex components, and increasing long-term maintainability. The following recommendations do not add or remove features but instead refactor the existing codebase to be more modular and robust.

**Key Recommendations:**

1.  **Refactor `Layout.tsx` by extracting complex logic into custom hooks.**
2.  **Decompose `FrontmatterPanel.tsx` by creating a dedicated module for form field components.**
3.  **Simplify `Sidebar.tsx` by extracting file renaming logic into a custom hook.**
4.  **Improve `EditorView.tsx` by encapsulating `altKey` tracking in its dedicated hook.**
5.  **Enhance the Zustand store by creating memoized selectors for derived state.**

---

## 2. Implementation Strategy & Risk Assessment

The following recommendations are grouped into two categories to help with prioritization and planning.

### Low-Risk Refinements

This group consists of recommendations **2.1 through 2.5**.

- **Risk & Difficulty:** The risk of breaking existing functionality is **very low**, and the implementation effort is also **low**. These tasks primarily involve moving code into new modules (hooks, components) and updating imports. They can be implemented incrementally and safely.
- **Justification:** These changes **reduce complexity** by creating smaller, more focused modules. This directly improves readability, testability, and long-term maintainability with minimal effort. They are considered "quick wins."

### High-Impact Architectural Changes

This group consists of the deeper recommendations **3.1 through 3.3**.

- **Risk & Difficulty:** The risk is **moderate to high** during implementation, and the effort required is **significant**.
  - **Service Layer & Slices (3.1, 3.2):** These changes touch the core state management and data flow of the entire application. They require a systematic refactoring of the Zustand store and all components that interact with it.
  - **AST Parser (3.3):** This is the most difficult and highest-risk task. It requires specialized knowledge of Rust and AST manipulation. It demands thorough testing to ensure it correctly handles all possible configurations and does not introduce a critical failure in project loading.
- **Justification:** While the implementation is more complex, these changes address fundamental architectural weaknesses. They introduce **necessary complexity** (like a service layer) to create clean boundaries, drastically simplify the state logic, and replace a brittle, high-maintenance component (the regex parser) with a robust, reliable one. These changes are a crucial investment in the application's long-term health and scalability.

---

## 3. Architectural Recommendations

### 2.1. Refactor `Layout.tsx` with Custom Hooks

**Observation:**
The `Layout.tsx` component is currently a major orchestrator, containing extensive `useEffect` hooks for managing global keyboard shortcuts and Tauri menu event listeners. This concentration of logic makes the component difficult to read, maintain, and test. The dependency arrays for these effects are large, increasing the risk of performance issues and bugs.

**Recommendation:**
Extract the complex logic into two dedicated custom hooks: `useGlobalShortcuts` and `useMenuListeners`.

**`src/hooks/useGlobalShortcuts.ts`**
This hook will manage all global keyboard shortcuts (e.g., `Cmd+S`, `Cmd+N`).

```typescript
// src/hooks/useGlobalShortcuts.ts
import { useEffect } from 'react'
import { useAppStore } from '../store'

export const useGlobalShortcuts = () => {
  const {
    currentFile,
    isDirty,
    saveFile,
    toggleSidebar,
    toggleFrontmatterPanel,
    selectedCollection,
    createNewFile,
    closeCurrentFile,
  } = useAppStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault()
            if (currentFile && isDirty) void saveFile()
            break
          // ... other shortcuts
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    currentFile,
    isDirty,
    saveFile,
    toggleSidebar,
    toggleFrontmatterPanel,
    selectedCollection,
    createNewFile,
    closeCurrentFile,
  ])
}
```

**`src/hooks/useMenuListeners.ts`**
This hook will manage all Tauri menu event listeners.

```typescript
// src/hooks/useMenuListeners.ts
import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { useAppStore } from '../store'
import { globalCommandRegistry } from '../lib/editor/commands'

export const useMenuListeners = () => {
  const {
    currentFile,
    isDirty,
    saveFile,
    setProject,
    // ... other store actions
  } = useAppStore()

  useEffect(() => {
    const unlistenPromises = [
      listen('menu-save', () => {
        if (currentFile && isDirty) void saveFile()
      }),
      listen('menu-format-bold', () => {
        if (currentFile) globalCommandRegistry.execute('toggleBold')
      }),
      // ... other listeners
    ]

    return () => {
      Promise.all(unlistenPromises).then(unlisteners => {
        unlisteners.forEach(unlisten => unlisten())
      })
    }
  }, [currentFile, isDirty, saveFile, setProject /* ... */])
}
```

**`Layout.tsx` (Refactored)**
The `Layout` component becomes much cleaner and more focused on presentation.

```typescript
// src/components/Layout/Layout.tsx
import React from 'react'
import { useGlobalShortcuts } from '../../hooks/useGlobalShortcuts'
import { useMenuListeners } from '../../hooks/useMenuListeners'
// ... other imports

export const Layout: React.FC = () => {
  const { sidebarVisible, frontmatterPanelVisible } = useAppStore()

  useGlobalShortcuts()
  useMenuListeners()

  // ... JSX remains the same
}
```

**Benefits:**

- **Separation of Concerns:** `Layout.tsx` is no longer responsible for complex event handling logic.
- **Maintainability:** Hooks are easier to read, update, and debug.
- **Reusability:** These hooks could be reused if the layout structure changes.
- **Testability:** Hooks can be tested in isolation more easily than a large component.

---

### 2.2. Decompose `FrontmatterPanel.tsx`

**Observation:**
`FrontmatterPanel.tsx` is a large component that includes the logic for rendering the panel itself, as well as the definitions for all the individual field components (`StringField`, `BooleanField`, etc.). This makes the file long and couples the layout logic with the field implementation.

**Recommendation:**
Extract the individual field components into a dedicated `src/components/FrontmatterFields` directory. `FrontmatterPanel.tsx` will then be responsible only for fetching the schema and mapping over the fields.

**Directory Structure:**

```
src/components/
├── FrontmatterFields/
│   ├── ArrayField.tsx
│   ├── BooleanField.tsx
│   ├── DateField.tsx
│   ├── EnumField.tsx
│   ├── FrontmatterField.tsx  // The delegating component
│   ├── index.ts              // Exports all field components
│   ├── NumberField.tsx
│   ├── StringField.tsx
│   └── TextareaField.tsx
└── Layout/
    └── FrontmatterPanel.tsx // Now simplified
```

**`FrontmatterPanel.tsx` (Refactored)**

```typescript
// src/components/Layout/FrontmatterPanel.tsx
import React from 'react';
import { useAppStore } from '../../store';
import { parseSchemaJson } from '../../lib/schema';
import { FrontmatterField } from '../FrontmatterFields'; // New import

export const FrontmatterPanel: React.FC = () => {
  const { currentFile, frontmatter, collections } = useAppStore();

  const currentCollection = currentFile
    ? collections.find(c => c.name === currentFile.collection) || null
    : null;

  const schema = currentCollection?.schema
    ? parseSchemaJson(currentCollection.schema)
    : null;

  const allFields = React.useMemo(() => {
    // ... logic to determine fields remains the same
  }, [frontmatter, schema]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-4 overflow-y-auto">
        {currentFile ? (
          <div className="space-y-6">
            {allFields.map(({ fieldName, schemaField }) => (
              <FrontmatterField
                key={fieldName}
                name={fieldName}
                label={camelCaseToTitleCase(fieldName)}
                field={schemaField}
              />
            ))}
          </div>
        ) : (
          // ... placeholder UI
        )}
      </div>
    </div>
  );
};
```

**Benefits:**

- **Improved Organization:** Field components are logically grouped and separated from the panel layout.
- **Maintainability:** Smaller, focused files are easier to manage.
- **Scalability:** Adding new field types is cleaner and more organized.

---

### 2.3. Simplify `Sidebar.tsx` with a Custom Hook

**Observation:**
The `Sidebar.tsx` component contains both the UI for displaying collections and files, as well as the state and logic for handling file renaming. This co-location of concerns makes the component more complex than necessary.

**Recommendation:**
Extract the file renaming logic into a `useFileRenaming` custom hook.

**`src/hooks/useFileRenaming.ts`**

```typescript
// src/hooks/useFileRenaming.ts
import { useState, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useAppStore, type FileEntry } from '../store'

export const useFileRenaming = () => {
  const { collections, selectedCollection, loadCollectionFiles } = useAppStore()
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const startRenaming = useCallback((file: FileEntry) => {
    setRenamingFileId(file.id)
    const fullName = file.extension
      ? `${file.name}.${file.extension}`
      : file.name
    setRenameValue(fullName || '')
  }, [])

  const cancelRenaming = useCallback(() => {
    setRenamingFileId(null)
    setRenameValue('')
  }, [])

  const submitRename = useCallback(
    async (file: FileEntry) => {
      if (!renameValue.trim() || renameValue === file.name) {
        cancelRenaming()
        return
      }
      // ... invoke logic to rename file
      // ... refresh file list
      cancelRenaming()
    },
    [
      renameValue,
      selectedCollection,
      collections,
      loadCollectionFiles,
      cancelRenaming,
    ]
  )

  return {
    renamingFileId,
    renameValue,
    setRenameValue,
    startRenaming,
    cancelRenaming,
    submitRename,
  }
}
```

**Benefits:**

- **Simplified Component:** `Sidebar.tsx` becomes primarily a presentational component.
- **Logic Encapsulation:** The renaming logic is self-contained, making it easier to test and reason about.
- **Reusability:** The hook could be used elsewhere if renaming functionality is needed in another context.

---

### 2.4. Refine `EditorView.tsx` and `useAltKeyTracking`

**Observation:**
The `EditorView.tsx` component contains logic for tracking the `Alt` key state. While a comment explains this is for "timing reasons," it feels out of place in what should be a primarily presentational component. The `useEffect` hook for this logic also has a missing dependency array, causing it to run on every render. The `useAltKeyTracking.ts` hook exists but is not used.

**Recommendation:**
Move the `altKey` tracking logic into the `useAltKeyTracking.ts` hook and fix the `useEffect` dependency.

**`src/hooks/editor/useAltKeyTracking.ts` (Refactored)**

```typescript
// src/hooks/editor/useAltKeyTracking.ts
import { useState, useEffect } from 'react'
import { EditorView } from '@codemirror/view'
import { altKeyEffect } from '../../lib/editor/urls'

export const useAltKeyTracking = (view: EditorView | null | undefined) => {
  const [isAltPressed, setIsAltPressed] = useState(false)

  useEffect(() => {
    const dispatchAltState = (isPressed: boolean) => {
      if (view) {
        view.dispatch({ effects: altKeyEffect.of(isPressed) })
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !isAltPressed) {
        setIsAltPressed(true)
        dispatchAltState(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.altKey && isAltPressed) {
        setIsAltPressed(false)
        dispatchAltState(false)
      }
    }

    // ... add window blur handler

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    // ... add blur listener

    return () => {
      // ... remove listeners
    }
  }, [isAltPressed, view])

  return isAltPressed
}
```

**`EditorView.tsx` (Refactored)**

```typescript
// src/components/Layout/EditorView.tsx
import { useAltKeyTracking } from '../../hooks/editor';
// ...

export const EditorViewComponent: React.FC = () => {
  const { editorContent } = useAppStore();
  const editorRef = useRef<{ view?: EditorView }>(null);
  const isAltPressed = useAltKeyTracking(editorRef.current?.view);

  // ... other hooks and logic

  return (
    <div className="editor-view">
      <CodeMirror
        className={`editor-codemirror ${isAltPressed ? 'alt-pressed' : ''}`}
        // ... other props
      />
    </div>
  );
};
```

**Benefits:**

- **Correctness:** Fixes a potential performance issue by adding the missing dependency array.
- **Encapsulation:** The `EditorView` component is cleaner and the `altKey` logic is properly encapsulated in its dedicated hook.

---

### 2.5. Create Memoized Selectors in Zustand Store

**Observation:**
The `Sidebar.tsx` component contains a `React.useMemo` hook to sort files.

```typescript
// src/components/Layout/Sidebar.tsx
const sortedFiles = React.useMemo((): FileEntry[] => {
  return [...files].sort((a, b) => {
    // ... sorting logic
  })
}, [files])
```

This is a good practice, but if this sorting logic is needed elsewhere, it would have to be duplicated. For state that is derived from the store, it's often better to define the selector once.

**Recommendation:**
While Zustand doesn't have built-in memoized selectors like Redux/Reselect, we can achieve a similar pattern by creating selector functions that can be used with `useAppStore`. For more complex scenarios, integrating a library like `proxy-memoize` is an option, but for now, we can define them as simple functions.

A better approach is to move this logic into a dedicated selector that can be reused. While Zustand doesn't have built-in memoization like `reselect`, we can use `proxy-memoize` or simply define the selector logic alongside the store.

**`src/store/selectors.ts`**

```typescript
// src/store/selectors.ts
import { AppState, FileEntry } from './index'

const getPublishedDate = (
  frontmatter: Record<string, unknown>
): Date | null => {
  // ... date extraction logic
}

export const selectSortedFiles = (state: AppState): FileEntry[] => {
  return [...state.files].sort((a, b) => {
    const dateA = getPublishedDate(a.frontmatter || {})
    const dateB = getPublishedDate(b.frontmatter || {})
    if (!dateA && !dateB) return 0
    if (!dateA) return -1
    if (!dateB) return 1
    return dateB.getTime() - dateA.getTime()
  })
}
```

**Usage in `Sidebar.tsx`:**

```typescript
// src/components/Layout/Sidebar.tsx
import { useAppStore } from '../../store'
import { selectSortedFiles } from '../../store/selectors'

export const Sidebar: React.FC = () => {
  const sortedFiles = useAppStore(selectSortedFiles)
  // ...
}
```

**Benefits:**

- **Centralized Logic:** The sorting logic is defined in one place and can be easily tested.
- **Consistency:** Ensures that files are sorted consistently across the application.
- **Performance:** Memoization (if added with a library) can prevent unnecessary re-calculations.

## 3. Deeper Architectural Review & Recommendations

After a more detailed analysis, several deeper architectural issues have been identified, primarily concerning state management complexity, the robustness of the configuration parser, and opportunities for better code structure.

### 3.1. Decouple State from Side Effects with a Service Layer

**Observation:**
The Zustand store (`src/store/index.ts`) is currently overloaded. Actions like `saveFile`, `loadCollections`, and `createNewFile` contain significant business logic, including direct calls to the Tauri `invoke` API, state manipulation, and even DOM interactions (e.g., focusing elements in `createNewFile`). This makes the store difficult to test and violates the principle of separation of concerns. The store becomes a mix of state container, API client, and business logic orchestrator.

**Recommendation:**
Introduce a dedicated "service layer" to handle all interactions with the backend (Tauri commands). The Zustand store should only be responsible for managing state. Actions in the store will call these services, and the services will return data that can be used to update the state.

**`src/services/tauriApi.ts`**
This module will wrap all `invoke` calls, providing a clean, typed API for the rest of the application.

```typescript
// src/services/tauriApi.ts
import { invoke } from '@tauri-apps/api/core'
import type { Collection, FileEntry, MarkdownContent } from '../store'

export const tauriApi = {
  scanProject: (projectPath: string): Promise<Collection[]> =>
    invoke('scan_project', { projectPath }),

  scanCollectionFiles: (collectionPath: string): Promise<FileEntry[]> =>
    invoke('scan_collection_files', { collectionPath }),

  parseMarkdownContent: (filePath: string): Promise<MarkdownContent> =>
    invoke('parse_markdown_content', { filePath }),

  saveMarkdownContent: (payload: {
    filePath: string
    frontmatter: Record<string, unknown>
    content: string
    imports: string
    schemaFieldOrder: string[] | null
  }): Promise<void> => invoke('save_markdown_content', payload),

  createFile: (payload: {
    directory: string
    filename: string
    content: string
  }): Promise<void> => invoke('create_file', payload),

  // ... other API calls
}
```

**`src/store/index.ts` (Refactored Action)**
Store actions become much simpler. They call the service and then update the state with the result.

```typescript
// src/store/index.ts (example action)
import { tauriApi } from '../services/tauriApi';

// ...
  loadCollections: async () => {
    const { projectPath } = get();
    if (!projectPath) return;

    try {
      const collections = await tauriApi.scanProject(projectPath);
      set({ collections });
    } catch (error) {
      console.error('Failed to load collections:', error);
      set({ collections: [] }); // Reset state on error
    }
  },
// ...
```

**Benefits:**

- **Clear Separation of Concerns:** The store manages state; the service layer manages backend communication.
- **Improved Testability:** The store can be tested without mocking Tauri `invoke` calls. The service layer can be mocked easily, or tested independently.
- **Maintainability:** The API surface with the backend is clearly defined in one place.

### 3.2. Introduce Zustand Slices for Better State Organization

**Observation:**
The `AppState` interface is growing large and contains several distinct areas of concern: project/file data, UI state, and editor content. As the application grows, this single state object will become harder to manage.

**Recommendation:**
Split the Zustand store into logical "slices," each with its own state and actions. While Zustand doesn't have a built-in `combineReducers` like Redux, this pattern can be implemented by creating separate slice creators and combining them in the main store.

**`src/store/slices/uiSlice.ts`**

```typescript
// src/store/slices/uiSlice.ts
import { StateCreator } from 'zustand'

export interface UiSlice {
  sidebarVisible: boolean
  frontmatterPanelVisible: boolean
  toggleSidebar: () => void
  toggleFrontmatterPanel: () => void
}

export const createUiSlice: StateCreator<UiSlice> = set => ({
  sidebarVisible: true,
  frontmatterPanelVisible: true,
  toggleSidebar: () =>
    set(state => ({ sidebarVisible: !state.sidebarVisible })),
  toggleFrontmatterPanel: () =>
    set(state => ({ frontmatterPanelVisible: !state.frontmatterPanelVisible })),
})
```

**`src/store/index.ts` (Refactored)**

```typescript
// src/store/index.ts
import { create } from 'zustand'
import { createUiSlice, UiSlice } from './slices/uiSlice'
import { createFileSlice, FileSlice } from './slices/fileSlice'
// ... other slices

export type AppState = UiSlice & FileSlice

export const useAppStore = create<AppState>()((...a) => ({
  ...createUiSlice(...a),
  ...createFileSlice(...a),
  // ... other slices
}))
```

**Benefits:**

- **Modularity:** State is organized by feature/domain.
- **Scalability:** It's easier to add new sections of state without bloating the main store file.
- **Readability:** The code is easier to navigate and understand.

### 3.3. Replace Regex Parser with a Robust AST Parser in Rust

**Observation:**
The `src-tauri/src/parser.rs` file uses a complex set of regular expressions and manual string parsing to extract collection definitions and schemas from `content.config.ts`. The code itself notes the limitations of this approach. Regex-based parsers for code are notoriously brittle and can easily break with minor changes in formatting, comments, or syntax.

**Recommendation:**
Replace the regex-based parser with a proper JavaScript/TypeScript AST (Abstract Syntax Tree) parser. A great option in the Rust ecosystem is `swc` (Speedy Web Compiler). By parsing the config file into an AST, we can reliably and robustly traverse the code structure to find the `defineCollection` calls and their `z.object` schemas.

**High-Level Implementation Steps (in Rust):**

1.  Add `swc_ecma_parser` to `Cargo.toml`.
2.  In `parser.rs`, use `swc_ecma_parser` to parse the TypeScript file content into an AST.
3.  Implement a visitor pattern to traverse the AST. The visitor would look for `CallExpression` nodes.
4.  Inside the visitor, identify calls to `defineCollection`.
5.  Once a `defineCollection` call is found, inspect its arguments to find the `schema` property and the `z.object` call.
6.  Traverse the `z.object` properties to extract field names, types (`z.string`, `z.number`, etc.), and chained methods (`.optional()`, `.min()`, etc.).
7.  This provides a highly reliable way to extract the schema information, immune to formatting changes.

**Benefits:**

- **Robustness:** An AST-based approach is not sensitive to whitespace, comments, or code style. It understands the code structure.
- **Maintainability:** It's far easier to maintain and extend the traversal logic than to debug complex regular expressions.
- **Accuracy:** It can correctly handle complex nested structures, variable assignments, and other language features that would break a regex parser.
- **Future-Proofing:** It can be extended to support more complex configurations, such as importing schemas from other files.

## 4. Conclusion

The Astro Blog Editor is a well-architected application with a strong foundation. By implementing the recommendations in this report, the development team can further improve the codebase's modularity, maintainability, and scalability. These refactorings will lead to a simpler and more robust architecture, making it easier to add new features and maintain the application over the long term.

---

## 5. State Management Deep Dive: From Monolith to Slices

This analysis focuses on the application's state management and data flow, as requested. The current implementation uses Zustand for centralized state management, which is a solid choice. However, the current architecture employs a single, monolithic store for the entire application's state, which is the primary source of the maintainability and potential performance issues you've intuited.

### 5.1. Current State Analysis

The application centralizes all state and logic into a single, large `useAppStore` in `src/store/index.ts`.

**What's Working Well:**

- **Single Source of Truth:** There is one predictable place to find and update application state.
- **Co-location:** Actions are co-located with the state they modify, which is a good practice.

**Identified Issues:**

1.  **The "God Store" Antipattern:** The `useAppStore` manages everything: project data, file lists, volatile editor content, UI visibility, and application settings. This creates a tightly coupled monolith that is difficult to maintain and reason about.
2.  **Performance Bottlenecks:** Components often subscribe to more state than they need. For example, the `Layout.tsx` component subscribes to nearly the entire store. This means it will re-render whenever _any_ piece of state changes, such as `editorContent` on every keystroke, even if the layout itself doesn't depend on the editor's content. This causes widespread, unnecessary re-renders.
3.  **Mixed Concerns:** The store mixes several distinct domains of state with different lifecycles:
    - **Project State:** `projectPath`, `collections` (changes infrequently).
    - **Document State:** `editorContent`, `isDirty` (changes very frequently).
    - **UI State:** `sidebarVisible` (changes on user interaction).
    - **Settings State:** `globalSettings` (changes rarely).
      Lumping these together means that a high-frequency change in one domain (Document) can trigger updates in components that only care about a low-frequency domain (UI or Settings).
4.  **Poor Scalability:** As new features are added, this single store will continue to grow, exacerbating all the issues above and making the codebase harder to navigate.

### 5.2. Core Recommendation: Split the Store into Slices

The most effective architectural improvement is to **refactor the monolithic store into multiple, smaller, domain-specific stores (or "slices")**. This approach retains the benefits of Zustand while solving the identified problems. Each store will be responsible for a specific domain of the application's state.

### 5.3. Proposed Store Structure

I recommend splitting the `useAppStore` into the following four distinct stores:

**1. `useProjectStore`**

- **Responsibility:** Manages the core project data, collections, and file lists.
- **State:** `projectPath`, `collections`, `files`, `selectedCollection`, `currentProjectId`.
- **Actions:** `setProject`, `loadCollections`, `loadCollectionFiles`, `createNewFile`.
- **File:** `src/store/projectStore.ts`

**2. `useEditorStore`**

- **Responsibility:** Manages the state of the currently open file. This is the most volatile state and should be isolated.
- **State:** `currentFile`, `editorContent`, `frontmatter`, `rawFrontmatter`, `imports`, `isDirty`, `autoSaveTimeoutId`.
- **Actions:** `openFile`, `closeCurrentFile`, `saveFile`, `setEditorContent`, `updateFrontmatter`.
- **File:** `src/store/editorStore.ts`

**3. `useSettingsStore`**

- **Responsibility:** Manages global and project-specific settings. This state changes infrequently.
- **State:** `globalSettings`, `currentProjectSettings`.
- **Actions:** `initializeProjectRegistry`, `loadPersistedProject`, `updateGlobalSettings`, `updateProjectSettings`.
- **File:** `src/store/settingsStore.ts`

**4. `useUIStore`**

- **Responsibility:** Manages transient UI state.
- **State:** `sidebarVisible`, `frontmatterPanelVisible`.
- **Actions:** `toggleSidebar`, `toggleFrontmatterPanel`.
- **File:** `src/store/uiStore.ts`

### 5.4. The Refactoring in Practice

Let's look at how this change would simplify a component like `Layout.tsx`.

**Before (Current State):**
The component subscribes to the entire monolithic store, causing it to re-render on any state change.

```typescript
// src/components/Layout/Layout.tsx (Current)
export const Layout: React.FC = () => {
  const {
    sidebarVisible,
    frontmatterPanelVisible,
    currentFile,
    editorContent, // Unnecessary dependency
    isDirty, // Unnecessary dependency
    saveFile,
    // ...and many more
  } = useAppStore()

  // ... logic that uses all these pieces of state
}
```

**After (With Sliced Stores):**
The component now subscribes to only the specific stores it needs. A change to `editorContent` in `useEditorStore` will no longer cause `Layout` to re-render.

```typescript
// src/components/Layout/Layout.tsx (Refactored)
import { useUIStore } from '../../store/uiStore'
import { useProjectStore } from '../../store/projectStore'
// ... other hooks for shortcuts and listeners

export const Layout: React.FC = () => {
  const sidebarVisible = useUIStore(state => state.sidebarVisible)
  const frontmatterPanelVisible = useUIStore(
    state => state.frontmatterPanelVisible
  )
  const currentFile = useEditorStore(state => state.currentFile) // From editor store now

  // The component no longer knows about `editorContent` or `isDirty`.
  // The keyboard shortcut hook (`useGlobalShortcuts`) would now pull
  // `isDirty` and `saveFile` from the `useEditorStore` directly.

  // ... JSX using only the necessary state
}
```

### 5.5. Implementation Guide

1.  **Create New Store Files:** Create the new files: `projectStore.ts`, `editorStore.ts`, `settingsStore.ts`, and `uiStore.ts` inside `src/store/`.
2.  **Migrate Logic:** Systematically move the relevant state, types, and actions from `src/store/index.ts` into the appropriate new slice file.
3.  **Cross-Store Communication:** For actions that need to trigger effects in another store (e.g., `openFile` in `editorStore` might need to update `selectedFile` in `projectStore`), you can call another store's actions directly: `useProjectStore.getState().setSelectedFile(...)`.
4.  **Update Components:** Go through the components and hooks (`Layout`, `Sidebar`, `EditorView`, `FrontmatterPanel`, etc.) and update their `useAppStore` calls to use the new, more specific stores. Ensure you only subscribe to the minimal state required.
5.  **Clean Up:** Once the migration is complete, the original `src/store/index.ts` can be removed or repurposed as a barrel file to export all the new store hooks for cleaner imports.

This refactoring is a direct investment in the application's long-term health. It will make the codebase significantly easier to maintain, test, and scale, while also providing immediate and noticeable performance improvements.
