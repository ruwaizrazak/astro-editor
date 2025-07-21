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

// Simple, performant typewriter scrolling utility using Y coordinates
class TypewriterScroller {
  private lastCursorY = -1

  scrollToCenter(view: EditorView, cursorPos: number) {
    // eslint-disable-next-line no-console
    console.log(
      '[TypewriterScroller] scrollToCenter called for position:',
      cursorPos
    )

    // Schedule both coordinate reading AND scrolling to happen after the current update completes
    // This avoids the "reading layout during update" error
    setTimeout(() => {
      // Now we can safely read coordinates
      const coords = view.coordsAtPos(cursorPos)
      if (!coords) {
        // eslint-disable-next-line no-console
        console.log('[TypewriterScroller] No coordinates found for position')
        return
      }

      const cursorY = coords.top
      // eslint-disable-next-line no-console
      console.log(
        '[TypewriterScroller] Cursor Y coordinate:',
        cursorY,
        'Previous Y:',
        this.lastCursorY
      )

      // Only scroll if cursor moved vertically by more than 20px
      // This handles both line changes and wrapped line movement
      const yDifference = Math.abs(cursorY - this.lastCursorY)
      if (this.lastCursorY !== -1 && yDifference < 20) {
        // eslint-disable-next-line no-console
        console.log(
          '[TypewriterScroller] Skipping - cursor Y movement too small:',
          yDifference + 'px'
        )
        return
      }

      // eslint-disable-next-line no-console
      console.log(
        '[TypewriterScroller] Executing scroll for Y coordinate change:',
        yDifference + 'px'
      )

      view.dispatch({
        effects: EditorView.scrollIntoView(cursorPos, {
          y: 'center',
        }),
      })

      this.lastCursorY = cursorY
      // eslint-disable-next-line no-console
      console.log('[TypewriterScroller] Scroll executed successfully')
    }, 0)
  }

  clear() {
    this.lastCursorY = -1
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

      // Scroll when cursor moves (including within wrapped lines)
      if (update.selectionSet) {
        const cursorPos = update.state.selection.main.head

        // eslint-disable-next-line no-console
        console.log('[TypewriterModePlugin] Cursor at position:', cursorPos)

        // Try to scroll based on cursor position (handles wrapped lines)
        this.scroller.scrollToCenter(this.view, cursorPos)
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
