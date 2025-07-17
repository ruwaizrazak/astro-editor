import React, { useRef, useEffect } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { EditorView } from '@codemirror/view'
import { useAppStore } from '../../store'
import {
  useEditorSetup,
  useEditorHandlers,
  useAltKeyTracking,
  useTauriListeners,
} from '../../hooks/editor'
import './EditorView.css'
import './EditorTheme.css'

// Extend window to include editor focus tracking
declare global {
  interface Window {
    isEditorFocused: boolean
  }
}

/**
 * Refactored EditorView component - much simpler and more focused
 *
 * This component has been reduced from 1200+ lines to ~100 lines by
 * extracting functionality into focused modules:
 * - Syntax highlighting -> lib/editor/syntax
 * - Markdown utilities -> lib/editor/markdown
 * - URL handling -> lib/editor/urls
 * - Drag & drop -> lib/editor/dragdrop
 * - Paste handling -> lib/editor/paste
 * - Commands -> lib/editor/commands
 * - Extensions -> lib/editor/extensions
 * - Hooks -> hooks/editor
 */
export const EditorViewComponent: React.FC = () => {
  const { editorContent } = useAppStore()
  const editorRef = useRef<{ view?: EditorView }>(null)

  // Initialize global focus flag
  useEffect(() => {
    window.isEditorFocused = false
  }, [])

  // Set up event handlers
  const { handleChange, handleFocus, handleBlur, handleSave } =
    useEditorHandlers()

  // Set up editor extensions and commands
  const {
    extensions,
    basicSetup,
    isAltPressed,
    handleAltKeyChange,
    setupCommands,
    cleanupCommands,
  } = useEditorSetup(handleSave, handleFocus, handleBlur)

  // Track Alt key state
  useAltKeyTracking(
    isAltPressed,
    handleAltKeyChange,
    editorRef.current?.view || null
  )

  // Set up Tauri listeners
  useTauriListeners(editorRef.current?.view || null)

  // Handle editor ready
  const handleEditorReady = (editor: { view?: EditorView }) => {
    if (editor?.view) {
      setupCommands(editor.view)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupCommands()
    }
  }, [cleanupCommands])

  return (
    <div className="editor-view" style={{ padding: '0 24px' }}>
      <CodeMirror
        className={`editor-codemirror ${isAltPressed ? 'alt-pressed' : ''}`}
        ref={editor => {
          if (editorRef.current !== editor) {
            // @ts-expect-error - ref assignment is necessary for editor access
            editorRef.current = editor
            if (editor) {
              handleEditorReady(editor)
            }
          }
        }}
        value={editorContent}
        onChange={handleChange}
        extensions={extensions}
        basicSetup={basicSetup}
      />
    </div>
  )
}

// For backward compatibility
export const getEditorCommands = () => {
  // This can now be removed - use globalCommandRegistry instead
  return null
}
