# PRD: MDX Component Inserter

This document outlines the technical approach for implementing a feature that allows users to quickly insert Astro components into MDX files.

## 1. Feature Overview

The user interface for this should be simple. When editing an MDX file, typing a forward slash (`/`) when not inside a URL or HTML tag should open a quick insert menu under the cursor. This menu should list all available MDX components and be fuzzy-searchable. Choosing a component and pressing Enter should insert the correct component structure with its required props.

**Example:** Typing `/call` might suggest `<Callout />`. Selecting it would insert `<Callout type="warning"></Callout>`.

## 2. Recommended Architecture

This feature should be implemented as a two-part system: a **robust backend parser** in Rust and a **smart frontend integration** using CodeMirror's extension system. This provides a clean separation of concerns and uses the best tool for each job.

---

### **Part 1: The Backend - Reliably Parsing Astro Components**

The most critical part of this feature is reliably extracting the necessary information from the `.astro` component files. Using regular expressions for this is brittle and should be avoided. The correct approach is to use an Abstract Syntax Tree (AST) parser.

#### 2.1. Implementation Plan (Rust)

1.  **Create a New Tauri Command:**
    Define a new command in `src-tauri/src/main.rs`:

    ```rust
    #[tauri::command]
    fn scan_mdx_components(project_path: String) -> Result<Vec<MdxComponent>, String> {
        // ... implementation ...
    }
    ```

2.  **Define the Data Structure:**
    Create a Rust struct that will be serialized and sent to the frontend. This should live in a new `src-tauri/src/models/mdx_component.rs` file.

    ```rust
    // src-tauri/src/models/mdx_component.rs
    use serde::Serialize;

    #[derive(Serialize, Clone, Debug)]
    pub struct PropInfo {
        name: String,
        prop_type: String, // e.g., "'warning' | 'info'", "string", "boolean"
        is_optional: bool,
    }

    #[derive(Serialize, Clone, Debug)]
    pub struct MdxComponent {
        name: String,       // e.g., "Callout"
        props: Vec<PropInfo>,
        has_slot: bool,
    }
    ```

3.  **Implement the Parser Logic:**
    The command will scan the `[project_path]/src/components/mdx/` directory for `.astro` files. For each file, it will perform the following steps:

    a. **Read the File:** Read the file content into a string.
    b. **Isolate the Frontmatter:** Extract the TypeScript code between the `---` fences.
    c. **Parse with `swc`:** Use the `swc_ecma_parser` crate to parse the extracted script into a TypeScript AST.
    d. **Traverse the AST:** Walk the AST to find an `export interface Props` declaration.
    e. **Extract Prop Info:** Iterate through the `Props` interface members to extract the name, type annotation (as a string), and whether it's optional (by checking for the `?` token).
    f. **Check for `<slot />`:** In the HTML part of the file (outside the `---` fences), perform a simple and efficient string search for the substring `<slot />`. An AST for the HTML is overkill; a string `contains` check is sufficient and performant.
    g. **Construct and Return:** Assemble the extracted information into the `MdxComponent` struct and add it to the vector that will be returned to the frontend.

---

### **Part 2: The Frontend - The Component Builder Dialog**

The frontend is responsible for providing a user-friendly interface to select, configure, and insert MDX components.

After initial consideration, an approach using CodeMirror's built-in `autocompletion` functionality was deemed insufficient for the desired user experience. While functional for simple text insertion, it would be complex to style and ill-suited for the multi-step configuration process (selecting a component, then toggling its props).

Therefore, the chosen architecture is a **dedicated modal dialog**, which we will call the **Component Builder**. This approach decouples the insertion logic from the editor's direct input handling, allowing us to use our existing `shadcn/ui` and `Tailwind` infrastructure to build a rich, fully-interactive, and visually consistent UI.

### 3. Data Flow and User Experience

The revised data flow is centered around the Component Builder dialog:

1.  **Project Load:** The frontend calls the `scan_mdx_components` Tauri command. Rust parses all relevant `.astro` files and returns a structured list of component data.
2.  **Store Component Data:** The frontend stores this list in the `useMdxComponentsStore` Zustand store for global access.
3.  **Trigger:** The user, while focused on the editor, presses a dedicated keyboard shortcut (`Cmd+I`).
4.  **Launch Dialog:** The shortcut triggers a function that opens the `ComponentBuilderDialog` and passes it a reference to the active CodeMirror `EditorView`.
5.  **Select Component:** The user is presented with a searchable list of available components (e.g., `Callout`, `Figure`). They select one.
6.  **Configure Props:** The dialog transitions to a new view where the user can see all the props for the selected component. They can toggle optional props on or off using switches.
7.  **Build & Insert Snippet:** Upon confirming, a utility function generates a CodeMirror-compatible snippet string with placeholders (e.g., `<Callout title="\${1}">\${2}</Callout>`).
8.  **Dispatch to Editor:** A CodeMirror command is dispatched, inserting the snippet at the user's cursor position and activating snippet-mode, allowing the user to `Tab` between the placeholders.

---

## 4. Pre-Implementation Tasks

To ensure a clean and stable foundation for the new feature, two architectural pre-tasks must be completed first.

### 4.1. Pre-Task 1: Remove Obsolete "Slash Command" Feature

The codebase currently contains a partially implemented feature for component insertion triggered by a `/` (slash) command. This approach has been superseded by the "Component Builder Dialog" and must be removed.

**Removal Plan:**

The following files and logic, introduced in commits `8f8ddbac` and `3e6d4f9b`, must be removed or reverted:

1.  **Delete Frontend Files:**
    *   `src/lib/editor/mdx-completion.ts`: The core CodeMirror extension for the slash command.
    *   `src/store/mdxComponentsStore.test.ts`: The test file for the related store.

2.  **Modify Editor Setup:**
    *   **File:** `src/hooks/editor/useEditorSetup.ts`
    *   **Action:** Remove the logic that conditionally adds the `mdxComponentCompletion()` extension for `.mdx` files.

3.  **Modify `useAppStore`:**
    *   **File:** `src/store/index.ts`
    *   **Action:** Remove the `loadMdxComponents` call from the `setProject` action. This will also involve removing the `mdxComponents` state and the `loadMdxComponents` action itself from the main app store, as this logic is now managed by `mdxComponentsStore`.

4.  **Retain but Isolate `mdxComponentsStore`:**
    *   **File:** `src/store/mdxComponentsStore.ts`
    *   **Action:** This store is still needed for the new approach to hold the component data. However, ensure it is no longer coupled to the main `useAppStore`'s project loading lifecycle. It should be a standalone store that is populated once and then read by the Component Builder.

5.  **Revert Backend Changes (Optional but Recommended):**
    *   The changes to the `scan_mdx_components` Rust command to accept a path override are no longer strictly necessary but are harmless. For a clean implementation, reverting this to the simpler version from the first commit (`8f8ddbac`) is recommended. This is a lower priority task.

### 4.2. Pre-Task 2: Standardize Keyboard Shortcuts

It is critical to establish a single, robust pattern for handling keyboard shortcuts. The current implementation in `src/components/Layout/Layout.tsx` uses a manual approach that lacks cross-platform support. We will adopt `react-hotkeys-hook` as the standard.

**Implementation Plan:**

1.  **Install Dependency:**
    *   Run `npm install react-hotkeys-hook`.

2.  **Refactor `Layout.tsx`:**
    *   Open `src/components/Layout/Layout.tsx`.
    *   Import `useHotkeys` from `react-hotkeys-hook`.
    *   Remove the entire `useEffect` hook that contains the `handleKeyDown` function and the `switch (e.key)` statement.
    *   Replace it with a series of declarative `useHotkeys` calls for each global shortcut (`mod+s`, `mod+1`, `mod+2`, `mod+n`, `mod+w`, `mod+,`).
    *   Use the `mod` key to ensure cross-platform (`Cmd`/`Ctrl`) compatibility.

Completing these pre-tasks will establish a clean, maintainable, and architecturally sound foundation for the Component Builder.

## 5. Implementation Plan: The MDX Component Builder Dialog

With the preliminary refactoring complete, we can proceed with building the Component Builder.

### 5.1. File & Component Architecture

To ensure a clean separation of concerns, the feature will be composed of the following new files:

*   `src/store/componentBuilderStore.ts`: A Zustand store to manage the entire state of the component building workflow.
*   `src/components/ComponentBuilder/index.ts`: Barrel export file.
*   `src/components/ComponentBuilder/ComponentBuilderDialog.tsx`: The main React component for the dialog UI.
*   `src/lib/editor/snippet-builder.ts`: A pure utility file for generating the final CodeMirror snippet string.
*   `src/lib/editor/commands.ts`: This file will be augmented with a new command to dispatch the snippet to the editor.

### 5.2. State Management (`useComponentBuilderStore`)

The Zustand store is the brain of the operation.

**File:** `src/store/componentBuilderStore.ts`

```typescript
import { EditorView } from '@codemirror/view';
import { create } from 'zustand';
import { MdxComponent } from '@/types/common'; // Adjust path as needed
import { buildSnippet } from '@/lib/editor/snippet-builder';
import { insertSnippet } from '@/lib/editor/commands';

// Define State and Actions
interface ComponentBuilderState {
  isOpen: boolean;
  step: 'list' | 'configure';
  selectedComponent: MdxComponent | null;
  enabledProps: Set<string>;
  editorView: EditorView | null;
}

interface ComponentBuilderActions {
  open: (view: EditorView) => void;
  close: () => void;
  selectComponent: (component: MdxComponent) => void;
  toggleProp: (propName: string) => void;
  insert: () => void;
  back: () => void;
}

const initialState: ComponentBuilderState = {
  isOpen: false,
  step: 'list',
  selectedComponent: null,
  enabledProps: new Set(),
  editorView: null,
};

// Create Store
export const useComponentBuilderStore = create<ComponentBuilderState & ComponentBuilderActions>((set, get) => ({
  ...initialState,

  open: (editorView) => set({ isOpen: true, editorView }),

  close: () => set({ ...initialState }), // Fully reset on close

  selectComponent: (component) => {
    const requiredProps = new Set(
      component.props.filter(p => !p.is_optional).map(p => p.name)
    );
    set({ selectedComponent: component, step: 'configure', enabledProps: requiredProps });
  },

  toggleProp: (propName) => {
    set(state => {
      const newEnabledProps = new Set(state.enabledProps);
      if (newEnabledProps.has(propName)) {
        newEnabledProps.delete(propName);
      } else {
        newEnabledProps.add(propName);
      }
      return { enabledProps: newEnabledProps };
    });
  },

  insert: () => {
    const { selectedComponent, enabledProps, editorView } = get();
    if (!selectedComponent || !editorView) return;

    const snippetString = buildSnippet(selectedComponent, enabledProps);
    insertSnippet(editorView, snippetString);
    get().close(); // Close and reset after insertion
  },

  back: () => set({ step: 'list', selectedComponent: null, enabledProps: new Set() }),
}));
```

### 5.3. UI Implementation (`ComponentBuilderDialog.tsx`)

This component orchestrates the entire UI using `shadcn/ui`.

**File:** `src/components/ComponentBuilder/ComponentBuilderDialog.tsx`

**Key Implementation Points:**

1.  **Global Shortcut:** In `src/components/Layout/Layout.tsx`, after completing the refactor, add the new hotkey.
    ```tsx
    import { useHotkeys } from 'react-hotkeys-hook';
    import { useComponentBuilderStore } from '@/store/componentBuilderStore';
    // Assume editorView is accessible here from a state or ref
    useHotkeys('mod+i', (e) => {
        e.preventDefault();
        useComponentBuilderStore.getState().open(editorView);
    }, [editorView]);
    ```

2.  **Dialog Structure:**
    *   Use `CommandDialog` from `shadcn/ui`. Its `open` and `onOpenChange` props will be bound to `store.isOpen` and `store.close`.
    *   A conditional render based on `store.step` will show either the component list or the props configurator.

3.  **Component List (`step === 'list'`):**
    *   Render `Command.Input`, `Command.List`, etc.
    *   Map over components from `useMdxComponentsStore` to create `Command.Item` elements.
    *   `onSelect` for each item should call `store.selectComponent(component)`.

4.  **Props Configurator (`step === 'configure'`):**
    *   This view takes over the dialog content when `step` changes.
    *   **Layout:** Use a `Card` component for structure.
    *   **Header:** `CardHeader` should contain the `Card.Title` (e.g., "Configure `<Callout />`") and a `Button` (variant="ghost") for "Back", which calls `store.back()`.
    *   **Content:** `CardContent` will map over `store.selectedComponent.props`. Each prop is rendered in a `div` with `flex items-center justify-between`.
        *   `Label`: Displays the prop name. Link it to the Switch using `htmlFor`.
        *   `Switch`:
            *   `id`: The prop name.
            *   `checked`: `store.enabledProps.has(prop.name)`.
            *   `onCheckedChange`: `() => store.toggleProp(prop.name)`.
            *   `disabled`: `!prop.is_optional`. This provides a clear visual cue for required props.
    *   **Footer:** `CardFooter` contains a `Button` that reads "Insert Component" and calls `store.insert()`. The entire form should be wrappable in a `<form>` tag whose `onSubmit` also calls `store.insert()` to allow `Enter` key submission.

### 5.4. Snippet Logic & Editor Command

This part connects the UI to the CodeMirror editor.

1.  **Snippet Builder (`snippet-builder.ts`):**
    *   Create a pure function to maximize testability and separation of concerns.

    **File:** `src/lib/editor/snippet-builder.ts`
    ```typescript
    import { MdxComponent } from '@/types/common';

    export function buildSnippet(component: MdxComponent, enabledProps: Set<string>): string {
      let propIndex = 1;
      const propsString = component.props
        .filter(p => enabledProps.has(p.name))
        .map(p => `${p.name}="\${${propIndex++}}"`)
        .join(' ');

      if (component.has_slot) {
        return `<${component.name} ${propsString}>\${${propIndex}}</${component.name}>`;
      }
      return `<${component.name} ${propsString} />`;
    }
    ```

2.  **Editor Command (`commands.ts`):**
    *   This function will execute the CodeMirror transaction. Note the corrected import path for `snippet`.

    **File:** `src/lib/editor/commands.ts`
    ```typescript
    import { snippet } from '@codemirror/autocomplete';
    import { EditorView } from '@codemirror/view';

    export function insertSnippet(view: EditorView, template: string) {
      if (!view) return;
      // The snippet function returns a command that can be dispatched
      const snippetCommand = snippet(template);
      snippetCommand(view); // Execute the command
      view.focus();
    }
    ```

This refined plan provides a clear, step-by-step guide that is technically accurate and architecturally sound, making it much easier to implement correctly.
