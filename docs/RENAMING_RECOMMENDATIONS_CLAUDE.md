# Naming Recommendations for Astro Editor

## Executive Summary

After a comprehensive review of the entire Astro Editor codebase (TypeScript and Rust), the project demonstrates strong naming conventions with excellent consistency. The codebase follows established conventions for both languages and maintains clear, descriptive names throughout. Only minor improvements are recommended to enhance consistency in edge cases.

## Overall Assessment

**Strengths:**
- Excellent adherence to language-specific conventions (camelCase for TypeScript, snake_case for Rust)
- Clear, descriptive names that communicate intent
- Consistent patterns within each domain (components, hooks, stores, etc.)
- Good use of prefixes (`use` for hooks, `is/has` for booleans, action verbs for methods)
- Well-structured module organization with appropriate naming

**Areas for Minor Improvement:**
- A few inconsistencies in type definitions
- Some abbreviated utility names that could be clearer
- Mixed conventions in external library integrations

## Specific Recommendations

### 1. TypeScript/JavaScript Recommendations

#### 1.1 Standardize `FileEntry` Interface Properties
**Current Issue:** The `FileEntry` interface uses snake_case for `is_draft` while the rest of the TypeScript codebase uses camelCase.

**Recommendation:** Rename to maintain consistency with TypeScript conventions:
```typescript
// Current
interface FileEntry {
  is_draft: boolean;
  // ...
}

// Recommended
interface FileEntry {
  isDraft: boolean;
  // ...
}
```

**Impact:** This change would require updates to:
- Type definitions in `src/lib/types.ts`
- Rust bindings that serialize to this type
- Any TypeScript code referencing `is_draft`

#### 1.2 Improve Utility Function Naming
**Current Issue:** The `cn()` function is too abbreviated.

**Recommendation:** Rename to be more descriptive:
```typescript
// Current
export function cn(...args) { }

// Recommended
export function classNames(...args) { }
// or
export function mergeClassNames(...args) { }
```

**Impact:** Widely used utility - would require updates across many component files.

#### 1.3 Standardize Hook File Naming
**Current Issue:** Most hook files use camelCase (e.g., `useEditorStore.ts`) but `use-mobile.ts` uses kebab-case.

**Recommendation:** Rename `use-mobile.ts` to `useMobile.ts` for consistency with other hooks.

#### 1.4 Consider More Specific Type Names
**Current Issue:** Some types could benefit from additional context.

**Recommendations:**
- `Collection` → `ContentCollection` (more specific to Astro content)
- Consider namespacing related types (e.g., `Editor.Command`, `App.Command`) if distinction becomes important

### 2. Documentation Recommendations

#### 2.1 Document UI Component Naming Exception
**Issue:** The `/components/ui/` directory uses kebab-case files (shadcn/ui convention) while other components use PascalCase files.

**Recommendation:** Add to `docs/developer/architecture-guide.md`:
```markdown
### Component File Naming Conventions
- Custom components: PascalCase files matching export name (e.g., `Layout.tsx`)
- shadcn/ui components: kebab-case files per library convention (e.g., `alert-dialog.tsx`)
  - This exception is accepted to maintain compatibility with shadcn/ui tooling
```

### 3. Code Organization Recommendations

#### 3.1 Extract Magic Strings to Constants
**Issue:** Some values like `'src/content'` appear multiple times.

**Recommendation:** Create a constants file:
```typescript
// src/lib/constants.ts
export const ASTRO_PATHS = {
  CONTENT_DIR: 'src/content',
  CONFIG_FILE: 'src/content/config.ts',
  // ...
} as const;
```

### 4. No Changes Recommended

The following areas demonstrate excellent naming and require no changes:

#### Rust Codebase
- All Rust code follows idiomatic conventions perfectly
- Function names are descriptive and consistent
- Tauri command naming is clear and maps well to TypeScript

#### TypeScript Patterns
- React hooks follow established conventions
- Store actions and state properties are well-named
- Query and mutation hooks have clear, consistent patterns
- Component names are descriptive and follow React conventions

## Implementation Priority

Given the minor nature of these recommendations and the excellent overall state of the codebase, implementation priority should be:

1. **Low Priority - Nice to Have:**
   - `cn()` → `classNames()` rename
   - `use-mobile.ts` → `useMobile.ts` rename
   - Type name improvements

2. **Documentation Only:**
   - Document UI component naming exception
   - Add note about snake_case in FileEntry if it must remain for Rust compatibility

3. **Future Considerations:**
   - Extract magic strings as encountered during feature development
   - Consider the `is_draft` → `isDraft` change only if making breaking changes to the Rust API

## Conclusion

The Astro Editor codebase demonstrates mature, thoughtful naming conventions that enhance readability and maintainability. The recommendations above are minor refinements rather than fundamental issues. The project serves as a good example of consistent naming across a TypeScript/Rust application.

The development team should be commended for maintaining such consistency across the codebase. Any new code should continue following these established patterns, with particular attention to:

- Using descriptive, unabbreviated names
- Following language-specific conventions
- Maintaining consistency within each domain
- Properly prefixing boolean variables and hook functions
- Using clear verb-noun patterns for actions

No significant refactoring is required from a naming perspective.