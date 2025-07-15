import React, { useCallback } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import { keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { searchKeymap } from '@codemirror/search'
import { EditorSelection } from '@codemirror/state'
import { useAppStore } from '../../store'
import './EditorView.css'

// Markdown formatting helper functions
const toggleMarkdown = (view: EditorView, marker: string): boolean => {
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

const createMarkdownLink = (view: EditorView): boolean => {
  const { state } = view
  const { from, to } = state.selection.main
  const selectedText = state.sliceDoc(from, to)

  if (selectedText.trim()) {
    // If text is selected, create link with text as anchor
    const linkText = `[${selectedText}](url)`
    view.dispatch({
      changes: { from, to, insert: linkText },
      selection: EditorSelection.range(
        from + selectedText.length + 3,
        from + selectedText.length + 6
      ),
    })
  } else {
    // If no text selected, create empty link template
    const linkText = `[text](url)`
    view.dispatch({
      changes: { from, to, insert: linkText },
      selection: EditorSelection.range(from + 1, from + 5),
    })
  }

  return true
}

// URL detection regex
const urlRegex = /^https?:\/\/[^\s]+$/

const handlePaste = (view: EditorView, event: ClipboardEvent): boolean => {
  const clipboardText = event.clipboardData?.getData('text/plain')
  if (!clipboardText || !urlRegex.test(clipboardText.trim())) {
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

export const EditorViewComponent: React.FC = () => {
  const { editorContent, setEditorContent, currentFile, saveFile, isDirty } =
    useAppStore()

  // Store handles auto-save, just update content
  const onChange = useCallback(
    (value: string) => {
      setEditorContent(value)
    },
    [setEditorContent]
  )

  // Manual save on blur for immediate feedback
  const handleBlur = useCallback(() => {
    if (currentFile && isDirty) {
      void saveFile()
    }
  }, [saveFile, currentFile, isDirty])

  // Enhanced extensions for better writing experience
  const extensions = [
    markdown(),
    history(),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap,
      // Custom markdown shortcuts
      {
        key: 'Mod-b',
        run: view => toggleMarkdown(view, '**'),
      },
      {
        key: 'Mod-i',
        run: view => toggleMarkdown(view, '*'),
      },
      {
        key: 'Mod-k',
        run: view => createMarkdownLink(view),
      },
      {
        key: 'Mod-s',
        run: () => {
          // Save shortcut
          if (currentFile && isDirty) {
            void saveFile()
          }
          return true
        },
      },
    ]),
    // Paste event handler for URL link creation
    EditorView.domEventHandlers({
      paste: (event, view) => handlePaste(view, event),
    }),
    EditorView.theme({
      '&': {
        fontSize: '16px',
        fontFamily:
          "'iA Writer Duo', -apple-system, 'Segoe UI', 'Roboto', sans-serif;",
        padding: '20px 40px',
      },
      '.cm-content': {
        lineHeight: '1.7',
        minHeight: '100vh',
        maxWidth: '65ch',
        margin: '0 auto',
      },
      '.cm-focused': {
        outline: 'none',
      },
      '.cm-editor': {
        borderRadius: '0',
      },
      '.cm-scroller': {
        fontVariantLigatures: 'common-ligatures',
      },
      '.cm-line': {},
    }),
    EditorView.lineWrapping,
  ]

  return (
    <div className="editor-view">
      <CodeMirror
        value={editorContent}
        onChange={onChange}
        onBlur={handleBlur}
        extensions={extensions}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          highlightSelectionMatches: false,
          highlightActiveLine: false,
        }}
        className="editor-codemirror"
      />
    </div>
  )
}
