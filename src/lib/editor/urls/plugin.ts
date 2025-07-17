import {
  EditorView,
  ViewPlugin,
  ViewUpdate,
  Decoration,
  DecorationSet,
} from '@codemirror/view'
import { StateField, StateEffect } from '@codemirror/state'
import { findUrlsInText } from './detection'

/**
 * State effect for Alt key changes
 */
export const altKeyEffect = StateEffect.define<boolean>()

/**
 * State field to track Alt key state
 */
export const altKeyState = StateField.define<boolean>({
  create: () => false,
  update: (value, tr) => {
    for (const effect of tr.effects) {
      if (effect.is(altKeyEffect)) {
        return effect.value
      }
    }
    return value
  },
})

/**
 * Plugin that adds hover styling to URLs when Alt key is pressed
 */
export const urlHoverPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view)
    }

    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.viewportChanged ||
        update.state.field(altKeyState) !== update.startState.field(altKeyState)
      ) {
        this.decorations = this.buildDecorations(update.view)
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const isAltPressed = view.state.field(altKeyState)
      if (!isAltPressed) return Decoration.none

      const widgets: Array<{ from: number; to: number }> = []

      // Scan through visible lines for URLs
      for (const { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to)
        const urls = findUrlsInText(text, from)
        widgets.push(...urls)
      }

      // Sort widgets by position before creating decorations - CodeMirror requires sorted ranges
      widgets.sort((a, b) => a.from - b.from)

      return Decoration.set(
        widgets.map(({ from, to }) =>
          Decoration.mark({
            class: 'url-alt-hover',
          }).range(from, to)
        )
      )
    }
  },
  {
    decorations: v => v.decorations,
  }
)
