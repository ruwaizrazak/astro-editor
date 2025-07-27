# Renaming and Naming Convention Recommendations

This document provides a set of recommendations for improving naming conventions across the Astro Editor codebase. The goal is to enhance readability, maintainability, and consistency, following the established architectural patterns.

Each recommendation includes the current name, a proposed new name, and a clear rationale for the change.

---

## TypeScript Frontend (`src/`)

### 1. Hooks (`src/hooks/`)

- **File:** `src/hooks/use-mobile.ts`
- **Current Name:** `use-mobile.ts`
- **Proposed Name:** `useIsMobile.ts`
- **Reason:** The function inside is `useIsMobile`. Renaming the file to match the primary hook it exports is a standard convention that improves discoverability and consistency (e.g., `useCommandPalette.ts` contains `useCommandPalette`).

### 2. Editor Component (`src/components/editor/`)

- **File:** `src/components/editor/Editor.tsx`
- **Current Name (Exported):** `EditorViewComponent` (exported as `Editor`)
- **Proposed Name (Internal):** `Editor` (and export it directly)
- **Reason:** The component is aliased to `Editor` on export (`export { EditorViewComponent as Editor }`). Renaming the component itself to `Editor` simplifies the code, removes an unnecessary layer of aliasing, and makes the component's name within its own module consistent with how it's used elsewhere.

### 3. Project Registry Utilities (`src/lib/project-registry/`)

- **File:** `src/lib/project-registry/utils-effective.ts`
- **Current Name:** `utils-effective.ts`
- **Proposed Name:** `effective-settings.ts`
- **Reason:** The current filename is slightly awkward. The file's purpose is to export `useEffectiveSettings` and `getEffectiveSettings`. Renaming it to `effective-settings.ts` more clearly communicates its responsibility of calculating and providing the "effective" (combined global and project-specific) settings.

### 4. Editor Store (`src/store/editorStore.ts`)

- **Function:** `updateCurrentFilePath`
- **Current Name:** `updateCurrentFilePath(newPath: string)`
- **Proposed Name:** `updateCurrentFileAfterRename(newPath: string)`
- **Reason:** The current name is slightly ambiguous. It implies only the path is updated, but the implementation also derives and updates the file's `name` from the new path. This action is specifically used after a file rename operation. The proposed name is more explicit about the function's purpose and context, making its usage in `LeftSidebar.tsx` clearer.

### 5. Type Definitions (`src/types/common.ts`)

- **Type:** `DateFieldName`
- **Current Definition:** `export type DateFieldName = 'pubDate' | 'date' | 'publishedDate' | 'published'`
- **Proposed Change:** Remove this type.
- **Reason:** This type is only used in one place (`LeftSidebar.tsx`) within a sorting function that has since been updated to use a more robust method (`getPublishedDate`) which takes an array of possible date field names derived from `frontmatterMappings`. The `DateFieldName` type is no longer used and can be safely removed to reduce code clutter.

---

## Rust Backend (`src-tauri/`)

The Rust backend code is generally very well-named and follows idiomatic Rust conventions. The function and module names are clear and consistent with their frontend counterparts. No significant renaming recommendations are necessary at this time. The existing structure is clean and maintainable.

---

## General Observations

- **Consistency:** The project demonstrates a high level of consistency in its naming conventions, especially with the `kebab-case` for directories, `PascalCase` for components, and `use...` for hooks.
- **Clarity:** Most names are self-documenting and clearly express their intent.
- **Architecture Adherence:** The naming largely adheres to the patterns laid out in the architecture guide, particularly with the decomposed Zustand stores and TanStack Query hooks.

The recommendations above are minor refinements to an already well-structured codebase.
