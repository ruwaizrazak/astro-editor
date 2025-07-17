import { EditorView } from '@codemirror/view'
import { isValidUrl } from '../urls/detection'

/**
 * Handle paste events to create markdown links when pasting URLs over selected text
 * @param view - CodeMirror editor view
 * @param event - ClipboardEvent from paste
 * @returns true if the event was handled, false to allow default behavior
 */
export const handlePaste = (
  view: EditorView,
  event: ClipboardEvent
): boolean => {
  const clipboardText = event.clipboardData?.getData('text/plain')
  if (!clipboardText || !isValidUrl(clipboardText)) {
    return false // Let default paste behavior handle non-URLs
  }

  const { state } = view
  const { from, to } = state.selection.main
  const selectedText = state.sliceDoc(from, to)

  if (selectedText.trim()) {
    // Create markdown link with selected text and pasted URL
    const linkText = `[${selectedText}](${clipboardText.trim()})`
    view.dispatch({
      changes: { from, to, insert: linkText },
    })
    return true // Prevent default paste
  }

  return false // Let default paste behavior handle if no text selected
}

/**
 * Check if clipboard contains a URL
 * @param clipboardText - Text from clipboard
 * @returns true if clipboard contains a valid URL
 */
export const isClipboardUrl = (clipboardText: string | null): boolean => {
  if (!clipboardText) return false
  return isValidUrl(clipboardText)
}
