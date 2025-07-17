# PRD & Technical Plan: Advanced MDX Support

## 1. Overview

**Problem**: The current editor does not properly highlight markdown syntax (e.g., `**bold**`, `_italic_`) that is nested inside of JSX/HTML blocks in MDX files. This is a significant limitation for writers who use custom components in their content.

**Goal**: To implement a robust MDX parser for the CodeMirror editor that correctly highlights both the JSX syntax and the nested markdown content within it, providing a seamless and accurate writing experience.

## 2. Ecosystem Analysis (Current State)

My research confirms the initial assessment and provides a clearer path forward:

*   **No Official CM6 Package**: There is still no official, standalone MDX language package for CodeMirror 6.
*   **`@codemirror/lang-markdown` Limitations**: The standard markdown language package correctly identifies HTML blocks but treats their content as a string, preventing nested markdown parsing.
*   **The `micromark` Ecosystem is Key**: The official MDX parser is `micromark` with the `micromark-extension-mdxjs` plugin. This is the source of truth for MDX parsing.
*   **The Bridge is the Challenge**: The primary technical challenge is bridging the output of the `micromark`-based parser (which produces an AST) with CodeMirror's Lezer-based parser (which requires a `SyntaxTree`).
*   **Precedent Exists**: The `@mdxeditor/editor` project has successfully implemented this, proving that it is feasible to create a high-quality MDX experience in CodeMirror 6 by extending the existing markdown language package and integrating `micromark`.

## 3. Implementation Plan: Options Analysis

We have three viable technical approaches, each with different trade-offs in terms of effort, robustness, and maintainability.

### Option A: The Pragmatic Fork & Extend Approach (Recommended)

This approach involves creating our own custom markdown language package by forking `@codemirror/lang-markdown` and extending it to handle MDX.

*   **Description**: We will create a new language source that uses the core Lezer grammar from `lang-markdown` but enhances it with MDX-specific features. The key will be to use `micromark` as an external parser for the content inside JSX blocks.

*   **High-Level Implementation Outline**:
    1.  **Create a New Language Package**: In `src/lib/editor/mdx/`, create a new module that will house our custom MDX language support.
    2.  **Vendor/Fork `lang-markdown`'s Grammar**: Copy the Lezer grammar file (`markdown.grammar`) from `@codemirror/lang-markdown` into our new module.
    3.  **Modify the Grammar**:
        *   Add rules to recognize MDX `import`/`export` statements at the top level.
        *   Modify the `HTMLBlock` rule to differentiate between standard HTML and JSX components (e.g., by identifying capitalized tags like `<Callout>`).
    4.  **Integrate `micromark`**:
        *   Add `micromark` and `micromark-extension-mdxjs` as dependencies.
        *   Create a `micromark` parser instance configured with the MDX extension.
    5.  **Implement Mixed Parsing**:
        *   Use CodeMirror's `parseMixed` functionality. This powerful feature allows you to "wrap" a region of the document with another parser.
        *   We will define a "wrapper" that targets the content within our identified JSX blocks.
        *   Inside this wrapper, we will re-invoke our main markdown parser, effectively allowing markdown to be parsed *inside* a JSX block.
    6.  **Create the Language Source**: Combine the modified Lezer grammar with the mixed parser configuration into a new `LanguageSupport` instance.
    7.  **Update Highlighting Style**: Extend our existing `comprehensiveHighlightStyle` to include new highlighting tags for JSX elements, attributes, and expressions.

*   **Pros**:
    *   **Robust**: Builds on the official, battle-tested `lang-markdown` foundation.
    *   **Full Control**: Gives us complete control over the parsing and highlighting logic.
    *   **Best User Experience**: Will correctly handle the vast majority of MDX features, including nested markdown.
    *   **Maintainable**: While a fork, the core grammar of markdown is stable. We are primarily *adding* to it, not changing its core.

*   **Cons**:
    *   **High Complexity**: This is a significant engineering task that requires a deep understanding of CodeMirror's Lezer and parsing systems.
    *   **Maintenance Overhead**: We are responsible for keeping our forked grammar in sync with any important upstream changes from `@codemirror/lang-markdown`.

*   **Effort/Risk Assessment**: **High Effort / Moderate Risk**. The risk is mitigated by the fact that this pattern is used by other successful projects.

---

### Option B: The "Good Enough" Incremental Approach

This approach avoids a full MDX parser and instead enhances the existing markdown parser to handle a predefined list of components.

*   **Description**: We would modify the Lezer grammar to recognize a specific, hardcoded list of component tags (e.g., `<Callout>`, `<Tabs>`, `<Accordion>`) and instruct the parser to treat their inner content as markdown.

*   **High-Level Implementation Outline**:
    1.  Fork the `lang-markdown` grammar as in Option A.
    2.  Modify the `HTMLBlock` rule to add specific rules for known components, e.g., `Callout { openTag Content closeTag }`.
    3.  Define the `Content` within these rules as being standard markdown block content.

*   **Pros**:
    *   **Low Effort**: Much simpler and faster to implement than a full MDX parser.
    *   **Low Risk**: Less likely to destabilize the existing highlighting system.
    *   **Solves 80% of the Problem**: Would immediately fix the issue for the most commonly used components in a project.

*   **Cons**:
    *   **Brittle and Inflexible**: A new component would require a grammar change and a new release of the application. This does not scale.
    *   **Not a True MDX Parser**: Does not handle JSX expressions (`{}`), `import`/`export` statements, or self-closing tags with props correctly.
    *   **Technical Debt**: This is a short-term fix that creates technical debt and will likely need to be replaced by Option A in the future.

*   **Effort/Risk Assessment**: **Low Effort / Low Risk**.

---

### Option C: The Pure Lezer Grammar Approach

This approach involves writing a complete Lezer grammar for MDX from scratch, without forking `lang-markdown`.

*   **Description**: We would write a new `mdx.grammar` file that defines the entire MDX language specification, from ESM statements to JSX blocks and markdown syntax.

*   **Pros**:
    *   **Cleanest Solution**: A single, unified parser for the entire language.
    *   **Potentially Performant**: A well-written Lezer grammar can be very fast.
    *   **High Value Open Source Contribution**: A standalone Lezer grammar for MDX would be a valuable contribution to the community.

*   **Cons**:
    *   **Extremely High Effort**: This is by far the most complex and time-consuming option. It requires expert-level knowledge of Lezer and the intricacies of the MDX specification.
    *   **High Risk of Bugs**: We would be re-implementing both a markdown parser and a JSX parser from scratch, which is a massive undertaking with a high risk of introducing subtle parsing errors.
    *   **Unnecessary**: We would be reinventing the wheel, as excellent markdown and JSX parsers already exist.

*   **Effort/Risk Assessment**: **Very High Effort / High Risk**.

## 4. Recommendation and Phased Rollout

The recommended path is a **phased rollout starting with Option B and graduating to Option A**.

**Phase 1: Implement Option B (The "Good Enough" Approach)**
*   **Action**: Immediately implement the low-effort solution to provide immediate value to users. We can identify the 5-10 most common components used in Astro/MDX content and add specific rules for them.
*   **Timeline**: This can be completed in a short development cycle.
*   **Benefit**: Solves the most pressing user-facing issue quickly and with low risk.

**Phase 2: Implement Option A (The "Pragmatic Fork & Extend" Approach)**
*   **Action**: Begin the work on the full, robust MDX parser as a follow-up feature. The work from Phase 1 is not wasted, as the experience gained from modifying the Lezer grammar will be directly applicable.
*   **Timeline**: This is a larger engineering effort that should be scheduled as a major feature.
*   **Benefit**: This will provide a complete and future-proof solution that correctly handles the entire MDX specification, positioning our editor as a best-in-class tool for MDX content creation.

This phased approach allows us to deliver value to users quickly while simultaneously working towards a more robust and complete long-term solution without the immense overhead and risk of the "pure" approach (Option C).
