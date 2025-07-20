# Task: Focus and Typewriter Mode

## Focus Mode (Sentence Highlighting)

**Goal**: Current sentence appears normal, everything else is dimmed/greyed out (like iA Writer).

### Technical Approach

**Sentence Detection Strategy**:
- CodeMirror's markdown parser doesn't provide sentence boundaries (it's designed for code, not NLP)
- **Recommended**: Start with simple regex-based detection: `/[.!?]+\s+/g`
- **Optional upgrade**: Use `sbd` library for better sentence boundary detection
- Handle markdown-specific cases (don't treat headers, code blocks as sentences)

**CodeMirror Integration**:
- Use `ViewPlugin` to track cursor position changes in real-time
- Use `StateField` to store current sentence range data
- Use `EditorView.decorations` facet with `Decoration.mark()` to apply styling
- Create two decoration classes: `.cm-sentence-dimmed` and `.cm-sentence-focused`

**Implementation Pattern**:
```javascript
// Track cursor position and update sentence decorations
const focusModePlugin = ViewPlugin.fromClass(class {
  update(update) {
    if (update.selectionSet || update.docChanged) {
      // Detect current sentence, update decorations
    }
  }
})
```

### Challenges Solved
- **Performance**: Only recalculate on cursor/content changes
- **Markdown compatibility**: Exclude headers, code blocks, lists from sentence detection
- **Edge cases**: Handle abbreviations, ellipses, quotations properly

## Typewriter Mode (Centered Scrolling)

**Goal**: Current line stays vertically centered as you type (like iA Writer).

### Technical Approach

**Auto-scrolling Implementation**:
- Use `EditorView.scrollIntoView(selection, { y: "center" })` API
- Track cursor line changes via `ViewUpdate.selectionSet`
- **Key insight**: Only scroll when cursor moves to different line (not every character)
- Debounce scroll operations (100-200ms delay) for smooth experience

**Performance Optimizations**:
- Skip scrolling during rapid typing or large text selections
- Use `requestAnimationFrame` for smooth scrolling animations
- Optional: Add `EditorView.scrollMargins` for additional spacing

**Implementation Pattern**:
```javascript
// Auto-scroll to keep current line centered
const typewriterPlugin = ViewPlugin.fromClass(class {
  update(update) {
    if (update.selectionSet && this.shouldScroll(update)) {
      this.scheduleScroll(update.view)
    }
  }
  
  scheduleScroll(view) {
    // Debounced scrolling to center current line
  }
})
```

### Challenges Solved
- **Smooth experience**: Debouncing prevents jarring scroll behavior
- **Performance**: Only scroll on line changes, not character changes
- **User control**: Works well with existing scroll behavior and window resizing

## CSS Gradient Enhancement (Optional)

Add subtle gradients at top/bottom of editor to create fade effect as text scrolls off screen:
```css
.cm-editor.typewriter-mode::before,
.cm-editor.typewriter-mode::after {
  /* Gradient overlays for fade effect */
}
```

## Implementation Priority

1. **Phase 1**: Basic sentence detection with regex + CodeMirror decorations
2. **Phase 2**: Typewriter mode with `scrollIntoView` centering
3. **Phase 3**: Enhanced sentence detection with `sbd` library
4. **Phase 4**: CSS gradient fade effects and polish

## External Dependencies

**Optional**: `sbd` library (~2KB) for improved sentence boundary detection
- Handles edge cases like "Dr. Smith went to the U.S." correctly
- More accurate than regex for complex text
- Can be added later without changing core architecture

This approach leverages CodeMirror's built-in capabilities while avoiding complex custom text parsing, providing a solid foundation for both features.
