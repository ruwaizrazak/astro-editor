import { EditorView } from '@codemirror/view'
import { EditorSelection } from '@codemirror/state'
import { MarkdownLinkMatch } from './types'

/**
 * Toggle markdown formatting around selected text
 * @param view - CodeMirror editor view
 * @param marker - Markdown marker (e.g., '**', '*', '`')
 * @returns true if the command was handled
 */
export const toggleMarkdown = (view: EditorView, marker: string): boolean => {
  const { state } = view
  const { from, to } = state.selection.main
  const selectedText = state.sliceDoc(from, to)

  // Check if selection is already wrapped with this marker
  const beforeStart = Math.max(0, from - marker.length)
  const afterEnd = Math.min(state.doc.length, to + marker.length)
  const beforeText = state.sliceDoc(beforeStart, from)
  const afterText = state.sliceDoc(to, afterEnd)

  if (beforeText.endsWith(marker) && afterText.startsWith(marker)) {
    // Remove existing markers
    view.dispatch({
      changes: [
        { from: beforeStart, to: from, insert: '' },
        { from: to, to: afterEnd, insert: '' },
      ],
      selection: EditorSelection.range(
        beforeStart,
        beforeStart + selectedText.length
      ),
    })
  } else {
    // Add markers
    const newText = `${marker}${selectedText}${marker}`
    view.dispatch({
      changes: { from, to, insert: newText },
      selection: EditorSelection.range(
        from + marker.length,
        to + marker.length
      ),
    })
  }

  return true
}

/**
 * Parse markdown links from a line of text
 * @param lineText - Text content of the line
 * @returns Array of markdown link matches
 */
export const parseMarkdownLinks = (lineText: string): MarkdownLinkMatch[] => {
  const matches: MarkdownLinkMatch[] = []
  const linkRegex = /\[([^\]]*)\]\(([^)]*)\)/g
  let match

  while ((match = linkRegex.exec(lineText)) !== null) {
    const linkStart = match.index
    const linkEnd = match.index + match[0].length
    const linkText = match[1] || ''
    const linkUrl = match[2] || ''
    const urlStart = match.index + linkText.length + 3 // after "]("
    const urlEnd = linkEnd - 1 // before ")"

    matches.push({
      linkText,
      linkUrl,
      linkStart,
      linkEnd,
      urlStart,
      urlEnd,
    })
  }

  return matches
}

/**
 * Create or modify markdown link at cursor position
 * @param view - CodeMirror editor view
 * @returns true if the command was handled
 */
export const createMarkdownLink = (view: EditorView): boolean => {
  const { state } = view
  const { from, to } = state.selection.main
  const selectedText = state.sliceDoc(from, to)

  // Check if cursor is inside an existing markdown link
  const lineText = state.doc.lineAt(from).text
  const lineStart = state.doc.lineAt(from).from
  const posInLine = from - lineStart

  const linkMatches = parseMarkdownLinks(lineText)

  // Find if cursor is within any existing link
  for (const match of linkMatches) {
    if (posInLine >= match.linkStart && posInLine <= match.linkEnd) {
      // Select the URL portion for editing
      view.dispatch({
        selection: EditorSelection.range(
          lineStart + match.urlStart,
          lineStart + match.urlEnd
        ),
      })
      return true
    }
  }

  if (selectedText.trim()) {
    // If text is selected, create link with text as anchor and cursor in URL position
    const linkText = `[${selectedText}]()`
    view.dispatch({
      changes: { from, to, insert: linkText },
      selection: EditorSelection.range(
        from + selectedText.length + 3,
        from + selectedText.length + 3
      ),
    })
  } else {
    // If no text selected, create empty link template with cursor on text
    const linkText = `[text]()`
    view.dispatch({
      changes: { from, to, insert: linkText },
      selection: EditorSelection.range(from + 1, from + 5),
    })
  }

  return true
}
