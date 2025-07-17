import { useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useAppStore } from '../../store'

/**
 * Hook for creating editor event handlers
 */
export const useEditorHandlers = () => {
  const { setEditorContent, currentFile, saveFile, isDirty } = useAppStore()

  // Handle content changes
  const handleChange = useCallback(
    (value: string) => {
      setEditorContent(value)
    },
    [setEditorContent]
  )

  // Handle editor focus
  const handleFocus = useCallback(() => {
    // Set global flag for menu state
    window.isEditorFocused = true
    if (currentFile) {
      void invoke('update_format_menu_state', { enabled: true })
    }
  }, [currentFile])

  // Handle editor blur
  const handleBlur = useCallback(() => {
    // Clear global flag for menu state
    window.isEditorFocused = false
    void invoke('update_format_menu_state', { enabled: false })

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
