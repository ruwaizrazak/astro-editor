import React, { useRef, useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { EditorView } from '@codemirror/view'
import { useAppStore } from '../../store'
import {
  useEditorSetup,
  useEditorHandlers,
  useTauriListeners,
} from '../../hooks/editor'
import { altKeyEffect } from '../../lib/editor/urls'
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
  const [isAltPressed, setIsAltPressed] = useState(false)

  // Initialize global focus flag (menu state managed in Layout)
  useEffect(() => {
    window.isEditorFocused = false
  }, [])

  // Track Alt key state for URL highlighting - moved back to component for timing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !isAltPressed) {
        setIsAltPressed(true)
        // Update CodeMirror state
        if (editorRef.current?.view) {
          editorRef.current.view.dispatch({
            effects: altKeyEffect.of(true),
          })
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.altKey && isAltPressed) {
        setIsAltPressed(false)
        // Update CodeMirror state
        if (editorRef.current?.view) {
          editorRef.current.view.dispatch({
            effects: altKeyEffect.of(false),
          })
        }
      }
    }

    // Handle window blur to reset Alt state
    const handleBlur = () => {
      setIsAltPressed(false)
      // Update CodeMirror state
      if (editorRef.current?.view) {
        editorRef.current.view.dispatch({
          effects: altKeyEffect.of(false),
        })
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [isAltPressed])

  // Set up event handlers
  const { handleChange, handleFocus, handleBlur, handleSave } =
    useEditorHandlers()

  // Set up editor extensions and commands
  const { extensions, basicSetup, setupCommands, cleanupCommands } =
    useEditorSetup(handleSave, handleFocus, handleBlur)

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
        indentWithTab={false} // Disable tab indentation to allow snippet navigation
      />
    </div>
  )
}
