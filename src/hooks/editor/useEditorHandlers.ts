import { useCallback } from 'react'
import { useEditorStore } from '../../store/editorStore'

/**
 * Hook for creating editor event handlers
 */
export const useEditorHandlers = () => {
  const { setEditorContent, currentFile, saveFile, isDirty } = useEditorStore()

  // Handle content changes
  const handleChange = useCallback(
    (value: string) => {
      setEditorContent(value)
    },
    [setEditorContent]
  )

  // Handle editor focus - just set flag, menu state managed in Layout
  const handleFocus = useCallback(() => {
    window.isEditorFocused = true
    window.dispatchEvent(new CustomEvent('editor-focus-changed'))
  }, [])

  // Handle editor blur - just clear flag, menu state managed in Layout
  const handleBlur = useCallback(() => {
    window.isEditorFocused = false
    window.dispatchEvent(new CustomEvent('editor-focus-changed'))

    // Manual save on blur for immediate feedback
    if (currentFile && isDirty) {
      void saveFile()
    }
  }, [currentFile, isDirty, saveFile])

  // Handle manual save
  const handleSave = useCallback(() => {
    if (currentFile && isDirty) {
      void saveFile()
    }
  }, [currentFile, isDirty, saveFile])

  return {
    handleChange,
    handleFocus,
    handleBlur,
    handleSave,
  }
}
