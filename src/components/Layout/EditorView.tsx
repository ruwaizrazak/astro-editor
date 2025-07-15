import React, { useCallback } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import { keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { searchKeymap } from '@codemirror/search'
import { useAppStore } from '../../store'
import './EditorView.css'

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
        run: () => {
          // Bold shortcut - will implement markdown formatting
          return true
        },
      },
      {
        key: 'Mod-i',
        run: () => {
          // Italic shortcut - will implement markdown formatting
          return true
        },
      },
      {
        key: 'Mod-k',
        run: () => {
          // Link shortcut - will implement markdown link creation
          return true
        },
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
        }}
        className="editor-codemirror"
      />
    </div>
  )
}
