import { useEffect } from 'react'
import { EditorView } from '@codemirror/view'

/**
 * Hook for tracking Alt key state across the application
 */
export const useAltKeyTracking = (
  isAltPressed: boolean,
  onAltKeyChange: (pressed: boolean, editorView: EditorView | null) => void,
  editorView: EditorView | null
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !isAltPressed) {
        onAltKeyChange(true, editorView)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.altKey && isAltPressed) {
        onAltKeyChange(false, editorView)
      }
    }

    // Handle window blur to reset Alt state
    const handleBlur = () => {
      onAltKeyChange(false, editorView)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [isAltPressed, onAltKeyChange, editorView])
}
