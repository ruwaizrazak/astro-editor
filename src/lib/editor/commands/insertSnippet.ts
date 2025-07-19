import { EditorView } from '@codemirror/view'
import { snippet, hasNextSnippetField } from '@codemirror/autocomplete'

/**
 * Test function to check if snippet functionality is enabled
 */
export function testSnippetFunctionality(view: EditorView) {
  console.log('=== SNIPPET FUNCTIONALITY TEST ===')
  console.log('hasNextSnippetField before:', hasNextSnippetField(view.state))
  
  // Try inserting a simple test snippet
  const testTemplate = 'Hello ${1:world}!'
  console.log('Test template:', testTemplate)
  
  try {
    const { dispatch, state } = view
    const { from, to } = state.selection.main
    
    snippet(testTemplate)(
      { dispatch, state },
      null,
      from,
      to
    )
    
    setTimeout(() => {
      console.log('hasNextSnippetField after:', hasNextSnippetField(view.state))
      console.log('Current selection:', view.state.selection.main)
      console.log('Document content:', view.state.doc.sliceString(
        Math.max(0, view.state.selection.main.from - 10),
        Math.min(view.state.doc.length, view.state.selection.main.to + 10)
      ))
    }, 50)
  } catch (error) {
    console.error('Test failed:', error)
  }
}

/**
 * Inserts a snippet at the current cursor position with tab navigation support
 * @param view The CodeMirror EditorView
 * @param template The snippet template string with ${} placeholders
 */
export function insertSnippet(view: EditorView, template: string) {
  if (!view) return

  console.log('Inserting snippet:', template)
  
  // First test snippet functionality
  testSnippetFunctionality(view)

  try {
    const { dispatch, state } = view
    const { from, to } = state.selection.main
    
    // Use the basic snippet function as documented
    snippet(template)(
      { dispatch, state },
      null,
      from,
      to
    )
    
    view.focus()
  } catch (error) {
    console.error('Error inserting snippet:', error)
  }
}
