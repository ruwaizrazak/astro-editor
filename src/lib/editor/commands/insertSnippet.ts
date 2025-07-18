import { EditorView } from '@codemirror/view'

/**
 * Inserts text at the current cursor position
 * @param view The CodeMirror EditorView
 * @param text The text to insert
 *
 * Note: This currently inserts plain text. To support snippet placeholders
 * with tab navigation, we would need to integrate with CodeMirror's
 * autocomplete snippet functionality or implement a custom solution.
 */
export function insertSnippet(view: EditorView, text: string) {
  if (!view) return

  // Get the current cursor position
  const { from, to } = view.state.selection.main

  // Replace selection with the text
  view.dispatch({
    changes: { from, to, insert: text },
    scrollIntoView: true,
  })

  view.focus()
}
