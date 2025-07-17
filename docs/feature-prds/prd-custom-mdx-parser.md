### MDX Support with Nested Markdown Highlighting

**Problem**: Currently, markdown syntax (bold, italic, links, etc.) inside HTML/JSX components appears as plain text instead of being properly highlighted. For example, `**markdown**` inside `<Callout>` tags doesn't get styled.

**Current State**:

- CodeMirror 6 has no built-in MDX support
- Our current `@codemirror/lang-markdown` treats content inside HTML tags as plain text
- The MDX ecosystem uses micromark extensions but these aren't integrated with CodeMirror 6
- No existing community solutions for CodeMirror 6 MDX support

**Technical Approaches Identified**:

1. **Custom MDX Parser (Recommended)**:
   - Fork `@codemirror/lang-markdown` to create a custom MDX parser
   - Use CodeMirror's `parseMixed` functionality to handle nested parsing
   - Integrate with micromark MDX extensions for robust MDX parsing
   - Handle JSX components, expressions, and markdown content properly

**Implementation Complexity**:

- **High**: Requires deep CodeMirror parsing knowledge
- **Significant refactoring**: Current comprehensive highlighting system would need updates
- **Ongoing maintenance**: Custom parser would need updates as CodeMirror evolves

**Benefits of Custom MDX Parser**:

- Complete control over MDX syntax handling
- Could solve other syntax highlighting edge cases we've encountered
- Potential open-source contribution to CodeMirror ecosystem
- Would properly handle MDX expressions, JSX components, and nested markdown
- Future-proof solution for advanced MDX features

**Challenges**:

- MDX has known issues with markdown in nested HTML structures
- Complex interaction between markdown and JSX parsing
- Need to handle edge cases like tables with markdown content
- Risk of destabilizing current robust highlighting system

**Recommendation**:
Defer until after core editor features are complete. When implemented, should be done as a comprehensive custom MDX parser that could benefit the broader CodeMirror community. The current markdown highlighting system already handles the vast majority of use cases effectively.
