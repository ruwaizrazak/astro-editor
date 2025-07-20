import { StateField, StateEffect } from '@codemirror/state'
import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'

// State effect to toggle typewriter mode
export const toggleTypewriterMode = StateEffect.define<boolean>()

// State field to track typewriter mode
export const typewriterModeState = StateField.define<boolean>({
  create() {
    return false
  },
  
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(toggleTypewriterMode)) {
        return effect.value
      }
    }
    return value
  }
})

// Optimized debounced scroll utility with performance improvements
class DebouncedScroller {
  private timeoutId: number | null = null
  private rafId: number | null = null
  private readonly delay = 150 // ms
  private lastLineNumber = -1
  
  scheduleScroll(view: EditorView, lineNumber: number) {
    // Performance: Skip if same line
    if (lineNumber === this.lastLineNumber) {
      return
    }
    
    // Clear existing timeouts
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId)
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
    }
    
    this.timeoutId = window.setTimeout(() => {
      this.rafId = requestAnimationFrame(() => {
        this.scrollToCenter(view, lineNumber)
        this.timeoutId = null
        this.rafId = null
        this.lastLineNumber = lineNumber
      })
    }, this.delay)
  }
  
  private scrollToCenter(view: EditorView, lineNumber: number) {
    try {
      // Performance: Only scroll if line is different from last
      if (lineNumber === this.lastLineNumber) {
        return
      }
      
      const line = view.state.doc.line(lineNumber)
      const linePos = line.from
      
      // Performance: Check if line is already roughly centered
      const viewport = view.viewport
      const lineTop = view.lineBlockAt(linePos).top
      const viewportHeight = viewport.to - viewport.from
      const center = viewport.from + viewportHeight / 2
      
      // Skip scrolling if already roughly centered (within 100px)
      if (Math.abs(lineTop - center) < 100) {
        this.lastLineNumber = lineNumber
        return
      }
      
      // Scroll to center the current line
      view.dispatch({
        effects: EditorView.scrollIntoView(
          linePos,
          { y: 'center', yMargin: 0 }
        )
      })
    } catch (error) {
      // Handle edge cases silently
      console.debug('Typewriter mode scroll error:', error)
    }
  }
  
  clear() {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.lastLineNumber = -1
  }
}

// Typewriter mode plugin
export const typewriterModePlugin = ViewPlugin.fromClass(
  class {
    private scroller = new DebouncedScroller()
    private lastLineNumber = 0
    
    constructor(public view: EditorView) {
      this.updateLastLine()
    }
    
    update(update: ViewUpdate) {
      const typewriterEnabled = update.state.field(typewriterModeState)
      
      if (!typewriterEnabled) {
        this.scroller.clear()
        return
      }
      
      // Only scroll when cursor moves to a different line
      if (update.selectionSet) {
        const currentLineNumber = update.state.doc.lineAt(
          update.state.selection.main.head
        ).number
        
        if (currentLineNumber !== this.lastLineNumber) {
          this.scroller.scheduleScroll(this.view, currentLineNumber)
          this.lastLineNumber = currentLineNumber
        }
      }
      
      // Also handle document changes that might affect line numbering
      if (update.docChanged) {
        this.updateLastLine()
      }
    }
    
    private updateLastLine() {
      this.lastLineNumber = this.view.state.doc.lineAt(
        this.view.state.selection.main.head
      ).number
    }
    
    destroy() {
      this.scroller.clear()
    }
  }
)

// Combined typewriter mode extension
export function createTypewriterModeExtension() {
  return [
    typewriterModeState,
    typewriterModePlugin
  ]
}