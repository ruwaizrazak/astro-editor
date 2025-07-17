import { EditorView } from '@codemirror/view'
import { EditorSelection } from '@codemirror/state'
import { HeadingLevel } from './types'

/**
 * Transform current line to a specific heading level or plain text
 * @param view - CodeMirror editor view
 * @param level - Heading level (0 for plain text, 1-4 for headings)
 * @returns true if the command was handled
 */
export const transformLineToHeading = (
  view: EditorView,
  level: HeadingLevel
): boolean => {
  const { state } = view
  const { from } = state.selection.main
  const line = state.doc.lineAt(from)
  const lineText = line.text

  // Remove existing heading markers (if any)
  const cleanedText = lineText.replace(/^#+\s*/, '')

  // Create new text based on desired level
  let newLineText: string
  if (level === 0) {
    // Plain text - just the cleaned text
    newLineText = cleanedText
  } else {
    // Add heading markers
    const markers = '#'.repeat(level)
    newLineText = `${markers} ${cleanedText}`
  }

  // Replace the entire line
  view.dispatch({
    changes: {
      from: line.from,
      to: line.to,
      insert: newLineText,
    },
    selection: EditorSelection.cursor(line.from + newLineText.length),
  })

  return true
}

/**
 * Get the current heading level of a line
 * @param lineText - Text content of the line
 * @returns Heading level (0 for plain text, 1-6 for headings)
 */
export const getHeadingLevel = (lineText: string): HeadingLevel => {
  const match = lineText.match(/^(#+)\s/)
  if (!match || !match[1]) return 0

  const level = match[1].length
  return level >= 1 && level <= 4 ? (level as HeadingLevel) : 0
}

/**
 * Check if a line is a heading
 * @param lineText - Text content of the line
 * @returns true if the line is a heading
 */
export const isHeading = (lineText: string): boolean => {
  return getHeadingLevel(lineText) > 0
}
