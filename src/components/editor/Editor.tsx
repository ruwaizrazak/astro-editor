import React, { useRef, useEffect, useState, useCallback } from 'react'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { useEditorStore } from '../../store/editorStore'
import { useComponentBuilderStore } from '../../store/componentBuilderStore'
import { useUIStore } from '../../store/uiStore'
import {
  useEditorSetup,
  useEditorHandlers,
  useTauriListeners,
} from '../../hooks/editor'
import { altKeyEffect } from '../../lib/editor/urls'
import { toggleFocusMode } from '../../lib/editor/extensions/focus-mode'
import { toggleTypewriterMode } from '../../lib/editor/extensions/typewriter-mode'
import './Editor.css'

// Extend window to include editor focus tracking
declare global {
  interface Window {
    isEditorFocused: boolean
  }
}

const EditorViewComponent: React.FC = () => {
  // DEBUGGING: Remove ALL store subscriptions to test if they're causing cascade
  // const currentFileId = useEditorStore(state => state.currentFile?.id)
  // const focusModeEnabled = useUIStore(state => state.focusModeEnabled)
  // const typewriterModeEnabled = useUIStore(state => state.typewriterModeEnabled)
  // const sidebarVisible = useUIStore(state => state.sidebarVisible)
  // const frontmatterPanelVisible = useUIStore(state => state.frontmatterPanelVisible)
  // const distractionFreeBarsHidden = useUIStore(state => state.distractionFreeBarsHidden)
  
  // Hardcoded values for testing
  const currentFileId = "test-file"
  const focusModeEnabled = false
  const typewriterModeEnabled = false
  const sidebarVisible = true
  const frontmatterPanelVisible = true
  const distractionFreeBarsHidden = false
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  // Content initialization handled in useEffect, not via subscription
  const [isAltPressed, setIsAltPressed] = useState(false)
  const isProgrammaticUpdate = useRef(false)

  // Typing detection for distraction-free mode
  const typingCharCount = useRef(0)
  const typingResetTimeout = useRef<number | null>(null)

  // DEBUG: Add comprehensive logging to track component lifecycle
  const renderCountRef = useRef(0)
  renderCountRef.current++
  
  // Track what changed to cause this render
  const prevPropsRef = useRef({
    currentFileId,
    sidebarVisible,
    frontmatterPanelVisible,
    focusModeEnabled,
    typewriterModeEnabled,
    distractionFreeBarsHidden,
  })
  
  const currentProps = {
    currentFileId,
    sidebarVisible,
    frontmatterPanelVisible,
    focusModeEnabled,
    typewriterModeEnabled,
    distractionFreeBarsHidden,
  }
  
  const changedProps = Object.keys(currentProps).filter(key => 
    prevPropsRef.current[key as keyof typeof currentProps] !== currentProps[key as keyof typeof currentProps]
  )
  
  // eslint-disable-next-line no-console
  console.log(`[Editor] RENDER #${renderCountRef.current}`, {
    ...currentProps,
    hasEditorRef: !!editorRef.current,
    hasViewRef: !!viewRef.current,
    changedProps: changedProps.length > 0 ? changedProps : 'none',
  })
  
  prevPropsRef.current = currentProps

  // DEBUG: Track individual state changes
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[Editor] Sidebar visibility changed:', sidebarVisible)
  }, [sidebarVisible])

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[Editor] Frontmatter panel visibility changed:', frontmatterPanelVisible)
  }, [frontmatterPanelVisible])

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[Editor] Distraction-free bars hidden changed:', distractionFreeBarsHidden)
  }, [distractionFreeBarsHidden])

  // Initialize global focus flag (menu state managed in Layout)
  useEffect(() => {
    window.isEditorFocused = false
  }, [])

  // FINAL TEST: Re-enable useEditorHandlers (suspected culprit)
  const { handleChange, handleFocus, handleBlur, handleSave } = useEditorHandlers()
  
  // Remove temporary handlers - using real ones now
  
  const componentBuilderHandler = useCallback((view: EditorView) => {
    return false
  }, [])
  
  // RE-ENABLE TEST: useEditorSetup (extensions and commands)
  const { extensions, setupCommands, cleanupCommands } = useEditorSetup(
    handleSave,
    handleFocus,
    handleBlur,
    componentBuilderHandler
  )

  // RE-ENABLE TEST: Tauri listeners (least likely to cause React re-renders)
  useTauriListeners(viewRef.current)

  // Update editor effects when writing modes change
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[Editor] Focus mode effect triggered')
    // eslint-disable-next-line no-console
    console.log('[Editor] focusModeEnabled:', focusModeEnabled)
    // eslint-disable-next-line no-console
    console.log('[Editor] typewriterModeEnabled:', typewriterModeEnabled)
    // eslint-disable-next-line no-console
    console.log('[Editor] viewRef.current exists:', !!viewRef.current)

    if (viewRef.current) {
      // eslint-disable-next-line no-console
      console.log('[Editor] Dispatching focus mode effect to CodeMirror')
      viewRef.current.dispatch({
        effects: [
          toggleFocusMode.of(focusModeEnabled),
          toggleTypewriterMode.of(typewriterModeEnabled),
        ],
      })
      // eslint-disable-next-line no-console
      console.log('[Editor] Effect dispatched successfully')
    } else {
      // eslint-disable-next-line no-console
      console.log('[Editor] No editor view available to dispatch effect')
    }
  }, [focusModeEnabled, typewriterModeEnabled])

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
    // eslint-disable-next-line no-console
    console.log('[Editor] CodeMirror useEffect triggered', {
      hasEditorRef: !!editorRef.current,
      hasViewRef: !!viewRef.current,
      shouldCreateEditor: !(!editorRef.current || viewRef.current)
    })
    
    if (!editorRef.current || viewRef.current) return

    // Get current handlers - capture them at effect creation time
    const currentHandleChange = handleChange
    const currentSetupCommands = setupCommands
    const currentCleanupCommands = cleanupCommands

    // Get initial content directly from store, not from subscription
    const { editorContent } = useEditorStore.getState()
    
    const startState = EditorState.create({
      doc: editorContent,
      extensions: [
        ...extensions,
        EditorView.updateListener.of(update => {
          if (update.docChanged && !isProgrammaticUpdate.current) {
            const newContent = update.state.doc.toString()
            // Use captured handler to avoid infinite loops
            currentHandleChange(newContent)

            // TEMPORARILY DISABLED: Typing detection for distraction-free mode
            // Testing if this is causing editor re-mount issues
            /* 
            // Only count actual text insertions from user input
            if (
              update.transactions.some(
                tr =>
                  tr.isUserEvent('input.type') &&
                  tr.changes &&
                  !tr.changes.empty
              )
            ) {
              typingCharCount.current++

              // Clear existing timeout
              if (typingResetTimeout.current) {
                clearTimeout(typingResetTimeout.current)
              }

              // Reset counter after 500ms of no typing
              typingResetTimeout.current = window.setTimeout(() => {
                typingCharCount.current = 0
              }, 500)

              // Hide bars after 4 characters
              if (typingCharCount.current >= 4) {
                useUIStore.getState().handleTypingInEditor()
                typingCharCount.current = 0
              }
            }
            */
          }
        }),
      ],
    })

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    })

    viewRef.current = view
    // eslint-disable-next-line no-console
    console.log('[Editor] CodeMirror view created successfully')

    // Set up commands once the view is ready
    currentSetupCommands(view)

    return () => {
      // eslint-disable-next-line no-console
      console.log('[Editor] CodeMirror view being destroyed')
      view.destroy()
      viewRef.current = null
      currentCleanupCommands()
    }
    // CRITICAL: Empty dependency array like DebugScreen - only create once!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load content when file changes (not on every content update)
  useEffect(() => {
    if (!viewRef.current || !currentFileId) return
    
    // Get content directly from store when file changes
    const { editorContent } = useEditorStore.getState()
    
    if (viewRef.current.state.doc.toString() !== editorContent) {
      // Mark this as a programmatic update to prevent triggering the update listener
      isProgrammaticUpdate.current = true

      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: editorContent,
        },
      })

      // Reset the flag after the update is complete
      setTimeout(() => {
        isProgrammaticUpdate.current = false
      }, 0)
    }
  }, [currentFileId]) // Only trigger when file changes, not on content changes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupCommands()
      // Clean up typing detection timeout
      if (typingResetTimeout.current) {
        clearTimeout(typingResetTimeout.current)
        typingResetTimeout.current = null
      }
    }
  }, [cleanupCommands])

  return (
    <div className="editor-view" style={{ padding: '0 24px' }}>
      <div
        ref={editorRef}
        className={`editor-codemirror ${isAltPressed ? 'alt-pressed' : ''} ${typewriterModeEnabled ? 'typewriter-mode' : ''}`}
      />
    </div>
  )
}

// PERFORMANCE FIX: Memoize Editor to prevent re-renders when editorContent changes  
// Only re-render when UI state actually changes, not on every keystroke
const MemoizedEditor = React.memo(EditorViewComponent, (prevProps, nextProps) => {
  // Custom comparison - Editor has no props, so always equal unless React forces update
  return true
})

export { MemoizedEditor as EditorViewComponent }
