import { EditorView } from '@codemirror/view'
import { snippet } from '@codemirror/autocomplete'

/**
 * Inserts a snippet at the current cursor position with tab navigation support
 * @param view The CodeMirror EditorView
 * @param template The snippet template string with ${} placeholders
 */
export function insertSnippet(view: EditorView, template: string) {
  if (!view) return

  // Get the current cursor position
  const { from, to } = view.state.selection.main

  // Create a snippet completion that can be applied to the editor
  const snippetCompletion = snippet(template)

  // Apply the snippet to the editor
  snippetCompletion(
    {
      state: view.state,
      dispatch: view.dispatch.bind(view),
    },
    null, // completion object (not needed for programmatic insertion)
    from,
    to
  )

  // Ensure the editor is focused after insertion
  view.focus()
}
