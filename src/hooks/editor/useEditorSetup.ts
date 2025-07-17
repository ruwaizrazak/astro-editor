import { useCallback } from 'react'
import { EditorView } from '@codemirror/view'
import {
  createExtensions,
  EDITOR_BASIC_SETUP,
} from '../../lib/editor/extensions'
import {
  globalCommandRegistry,
  createEditorCommandRegistry,
  exportMenuCommands,
  cleanupMenuCommands,
} from '../../lib/editor/commands'

/**
 * Hook for setting up editor extensions and commands
 */
export const useEditorSetup = (
  onSave: () => void,
  onFocus: () => void,
  onBlur: () => void
) => {
  // Create extensions with current configuration
  const extensions = createExtensions({
    onSave,
    onFocus,
    onBlur,
  })

  // Set up editor commands when editor view is available
  const setupCommands = useCallback(
    (editorView: EditorView) => {
      const commands = createEditorCommandRegistry(onSave)
      globalCommandRegistry.register(commands, editorView)
      exportMenuCommands()
    },
    [onSave]
  )

  // Cleanup commands
  const cleanupCommands = useCallback(() => {
    globalCommandRegistry.unregister()
    cleanupMenuCommands()
  }, [])

  return {
    extensions,
    basicSetup: EDITOR_BASIC_SETUP,
    setupCommands,
    cleanupCommands,
  }
}
