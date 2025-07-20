import React, { useRef, useEffect, useState, useCallback } from 'react'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { useEditorStore } from '../../store/editorStore'
import { useComponentBuilderStore } from '../../store/componentBuilderStore'
import {
  useEditorSetup,
  useEditorHandlers,
  useTauriListeners,
} from '../../hooks/editor'
import { altKeyEffect } from '../../lib/editor/urls'
import './Editor.css'

// Extend window to include editor focus tracking
declare global {
  interface Window {
    isEditorFocused: boolean
  }
}

export const EditorViewComponent: React.FC = () => {
  const { editorContent } = useEditorStore()
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const initialContentRef = useRef<string>(editorContent)
  const [isAltPressed, setIsAltPressed] = useState(false)

  // Initialize global focus flag (menu state managed in Layout)
  useEffect(() => {
    window.isEditorFocused = false
  }, [])

  // Set up event handlers
  const { handleChange, handleFocus, handleBlur, handleSave } =
    useEditorHandlers()

  // Component builder handler for Cmd+/ shortcut
  const componentBuilderHandler = useCallback((view: EditorView) => {
    const { currentFile } = useEditorStore.getState()
    if (currentFile?.extension === 'mdx') {
      useComponentBuilderStore.getState().open(view)
      return true
    }
    return false
  }, [])

  // Set up editor extensions and commands
  const { extensions, setupCommands, cleanupCommands } = useEditorSetup(
    handleSave,
    handleFocus,
    handleBlur,
    componentBuilderHandler
  )

  // Set up Tauri listeners
  useTauriListeners(viewRef.current)

  // Track Alt key state for URL highlighting - moved back to component for timing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !isAltPressed) {
        setIsAltPressed(true)
        // Update CodeMirror state
        if (viewRef.current) {
          viewRef.current.dispatch({
            effects: altKeyEffect.of(true),
          })
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.altKey && isAltPressed) {
        setIsAltPressed(false)
        // Update CodeMirror state
        if (viewRef.current) {
          viewRef.current.dispatch({
            effects: altKeyEffect.of(false),
          })
        }
      }
    }

    // Handle window blur to reset Alt state
    const handleBlur = () => {
      setIsAltPressed(false)
      // Update CodeMirror state
      if (viewRef.current) {
        viewRef.current.dispatch({
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

  // Initialize the CodeMirror editor once - EXACTLY like DebugScreen
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return

    // Get current handlers - capture them at effect creation time
    const currentHandleChange = handleChange
    const currentSetupCommands = setupCommands
    const currentCleanupCommands = cleanupCommands

    const startState = EditorState.create({
      doc: initialContentRef.current,
      extensions: [
        ...extensions,
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            const newContent = update.state.doc.toString()
            // Use captured handler to avoid infinite loops
            currentHandleChange(newContent)
          }
        }),
      ],
    })

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    })

    viewRef.current = view

    // Set up commands once the view is ready
    currentSetupCommands(view)

    return () => {
      view.destroy()
      viewRef.current = null
      currentCleanupCommands()
    }
    // CRITICAL: Empty dependency array like DebugScreen - only create once!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update editor content when store content changes
  useEffect(() => {
    if (
      viewRef.current &&
      viewRef.current.state.doc.toString() !== editorContent
    ) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: editorContent,
        },
      })
    }
    // Update the initial content ref for future editor recreations
    initialContentRef.current = editorContent
  }, [editorContent])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupCommands()
    }
  }, [cleanupCommands])

  return (
    <div className="editor-view" style={{ padding: '0 24px' }}>
      <div
        ref={editorRef}
        className={`editor-codemirror ${isAltPressed ? 'alt-pressed' : ''}`}
      />
    </div>
  )
}
