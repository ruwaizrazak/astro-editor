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

    a.  **Read the File:** Read the file content into a string.
    b.  **Isolate the Frontmatter:** Extract the TypeScript code between the `---` fences.
    c.  **Parse with `swc`:** Use the `swc_ecma_parser` crate to parse the extracted script into a TypeScript AST.
    d.  **Traverse the AST:** Walk the AST to find an `export interface Props` declaration.
    e.  **Extract Prop Info:** Iterate through the `Props` interface members to extract the name, type annotation (as a string), and whether it's optional (by checking for the `?` token).
    f.  **Check for `<slot />`:** In the HTML part of the file (outside the `---` fences), perform a simple and efficient string search for the substring `<slot />`. An AST for the HTML is overkill; a string `contains` check is sufficient and performant.
    g.  **Construct and Return:** Assemble the extracted information into the `MdxComponent` struct and add it to the vector that will be returned to the frontend.

---

### **Part 2: The Frontend - Editor Integration with CodeMirror**

The frontend is responsible for triggering the UI and inserting the text. The best tool for this is **CodeMirror's built-in autocompletion system**.

#### 2.2. Implementation Plan (TypeScript)

1.  **Store Component Data:**
    On project load, call the `scan_mdx_components` command. Store the returned array of `MdxComponent` objects in a new Zustand store (e.g., `src/store/mdxComponentsStore.ts`).

2.  **Create a Custom CodeMirror Autocompletion Source:**
    This is the core of the frontend logic. Create a new CodeMirror extension in a file like `src/lib/editor/mdx-completion.ts`.

    ```typescript
    // src/lib/editor/mdx-completion.ts
    import { autocompletion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
    import { useMdxComponentsStore } from '../../store/mdxComponentsStore'; // Assuming this store exists

    export function mdxComponentCompletion() {
      const components = useMdxComponentsStore.getState().components;

      return autocompletion({
        override: [
          (context: CompletionContext): CompletionResult | null => {
            // Check if the character before the cursor is a '/'
            const trigger = context.state.sliceDoc(context.pos - 1, context.pos);
            if (trigger !== '/') {
              return null;
            }

            // TODO: Add logic to check if we are inside a URL or HTML tag
            // by inspecting the CodeMirror syntax tree at the current position.
            // If so, return null.

            return {
              from: context.pos, // Start the completion from the current cursor position
              options: components.map(comp => ({
                label: comp.name,
                type: 'class', // Gives it a nice icon
                apply: createSnippet(comp),
              })),
            };
          },
        ],
      });
    }
    ```

3.  **Generate the Insertion Snippet:**
    The `apply` function should generate the text to be inserted.

    ```typescript
    function createSnippet(component: MdxComponent): string {
      const propsString = component.props
        .filter(p => !p.is_optional) // Only include required props initially
        .map(p => `${p.name}="${getPlaceholderForType(p.prop_type)}"`)
        .join(' ');

      if (component.has_slot) {
        return `<${component.name} ${propsString}></${component.name}>`;
      } else {
        return `<${component.name} ${propsString} />`;
      }
    }

    function getPlaceholderForType(type: string): string {
      // Return a helpful placeholder, e.g., 'string', 'true|false', etc.
      if (type.includes('|')) return type.split('|')[0].replace(/'/g, ''); // 'warning' | 'info' -> 'warning'
      return type; // 'string' -> 'string'
    }
    ```

4.  **Add to Editor:**
    Add the `mdxComponentCompletion()` extension to your CodeMirror setup in `EditorView.tsx`. The autocompletion panel will automatically handle the fuzzy searching and filtering.

## 3. Data Flow Summary

1.  On project load, the frontend calls the `scan_mdx_components` Tauri command.
2.  Rust parses all relevant `.astro` files and returns a structured list of component data.
3.  The frontend stores this list in a Zustand store.
4.  The user, while editing an MDX file, types `/`.
5.  The custom CodeMirror `autocompletion` extension triggers.
6.  It reads the component list from the Zustand store and presents the options in a pop-up menu.
7.  The user selects a component.
8.  The `apply` function generates the corresponding tag with placeholder props and inserts it into the editor.
