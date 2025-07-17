# Possible future Tasks

## Potential Future Features

- [ ] Add very simple search functionality (by filename and title [if present] only)
- [ ] "hang" header hashes in the left margin as per iA Writer
- [ ] AI Editing assistant
- [ ] MDX Support with Nested Markdown Highlighting

## Referenc Notes

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

2. **HTML-First with Nested Markdown**:
   - Switch to `@codemirror/lang-html` as base parser
   - Configure nested markdown parsers for specific component tags
   - Would require restructuring current highlighting system

3. **Decoration Overlays**:
   - Create decorations that detect markdown patterns inside HTML tags
   - Apply styling through mark decorations
   - Less robust but simpler implementation

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

**Alternative Approaches**:

- Use standard markdown syntax outside HTML components
- Create helper components that accept markdown props
- Wait for community MDX support development

**Recommendation**:
Defer until after core editor features are complete. When implemented, should be done as a comprehensive custom MDX parser that could benefit the broader CodeMirror community. The current markdown highlighting system already handles the vast majority of use cases effectively.
