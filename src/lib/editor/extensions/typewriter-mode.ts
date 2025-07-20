import { StateField, StateEffect } from '@codemirror/state'
import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'

// State effect to toggle typewriter mode
export const toggleTypewriterMode = StateEffect.define<boolean>()

// State field to track typewriter mode
export const typewriterModeState = StateField.define<boolean>({
  create() {
    // eslint-disable-next-line no-console
    console.log('[TypewriterModeState] Creating initial state: false')
    return false
  },

  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(toggleTypewriterMode)) {
        // eslint-disable-next-line no-console
        console.log(
          '[TypewriterModeState] Received toggleTypewriterMode effect:',
          effect.value
        )
        // eslint-disable-next-line no-console
        console.log(
          '[TypewriterModeState] Previous state:',
          value,
          '-> New state:',
          effect.value
        )
        return effect.value
      }
    }
    return value
  },
})

// Simple, performant typewriter scrolling utility
class TypewriterScroller {
  private lastLineNumber = -1

  scrollToCenter(view: EditorView, lineNumber: number) {
    // eslint-disable-next-line no-console
    console.log(
      '[TypewriterScroller] scrollToCenter called for line:',
      lineNumber
    )

    // Skip if same line
    if (lineNumber === this.lastLineNumber) {
      // eslint-disable-next-line no-console
      console.log('[TypewriterScroller] Skipping - same line number')
      return
    }

    // Get the line position
    const line = view.state.doc.line(lineNumber)
    const linePos = line.from

    // eslint-disable-next-line no-console
    console.log(
      '[TypewriterScroller] Scheduling scroll for line',
      lineNumber,
      'at position',
      linePos,
      'to center'
    )

    // Schedule the scroll to happen after the current update completes
    // This avoids the "update in progress" error
    setTimeout(() => {
      // eslint-disable-next-line no-console
      console.log('[TypewriterScroller] Executing scheduled scroll')
      view.dispatch({
        effects: EditorView.scrollIntoView(linePos, {
          y: 'center',
        }),
      })
    }, 0)

    this.lastLineNumber = lineNumber
    // eslint-disable-next-line no-console
    console.log('[TypewriterScroller] Scroll scheduled successfully')
  }

  clear() {
    this.lastLineNumber = -1
  }
}

// Typewriter mode plugin
export const typewriterModePlugin = ViewPlugin.fromClass(
  class {
    private scroller = new TypewriterScroller()

    constructor(public view: EditorView) {
      // eslint-disable-next-line no-console
      console.log('[TypewriterModePlugin] Plugin initialized')
    }

    update(update: ViewUpdate) {
      const typewriterEnabled = update.state.field(typewriterModeState)

      // eslint-disable-next-line no-console
      console.log(
        '[TypewriterModePlugin] Update - enabled:',
        typewriterEnabled,
        'selectionSet:',
        update.selectionSet
      )

      if (!typewriterEnabled) {
        this.scroller.clear()
        return
      }

      // Scroll when cursor moves to a different line
      if (update.selectionSet) {
        const currentLineNumber = update.state.doc.lineAt(
          update.state.selection.main.head
        ).number

        // eslint-disable-next-line no-console
        console.log('[TypewriterModePlugin] Cursor on line:', currentLineNumber)

        // Always try to scroll - let the scroller decide if it's needed
        this.scroller.scrollToCenter(this.view, currentLineNumber)
      }
    }

    destroy() {
      this.scroller.clear()
    }
  }
)

// Combined typewriter mode extension
export function createTypewriterModeExtension() {
  return [typewriterModeState, typewriterModePlugin]
}
