import { useEditorStore } from '../../store/editorStore'
import { useProjectStore } from '../../store/projectStore'
import { useUIStore } from '../../store/uiStore'
import { CommandContext } from './types'

/**
 * Creates command context from current app state
 * This provides all the information and actions commands need
 */
export function useCommandContext(): CommandContext {
  const { currentFile, isDirty, saveFile, closeCurrentFile } = useEditorStore()

  const {
    selectedCollection,
    projectPath,
    globalSettings,
    setSelectedCollection,
    setProject,
  } = useProjectStore()

  const { toggleSidebar, toggleFrontmatterPanel } = useUIStore()

  return {
    currentFile,
    selectedCollection,
    collections: [], // Available through TanStack Query in components
    projectPath,
    isDirty,
    globalSettings,
    createNewFile: () => {
      // Dispatch a custom event that Layout can listen to
      window.dispatchEvent(new CustomEvent('create-new-file'))
    },
    setSelectedCollection,
    setProject,
    toggleSidebar,
    toggleFrontmatterPanel,
    saveFile,
    closeCurrentFile,
    loadCollections: () => {
      // Use custom event pattern since command context can't use React hooks
      window.dispatchEvent(new CustomEvent('reload-collections'))
    },
    loadCollectionFiles: () => {
      // Use custom event pattern since command context can't use React hooks
      window.dispatchEvent(new CustomEvent('reload-collection-files'))
    },
    openPreferences: () => {
      // Dispatch a custom event that Layout can listen to
      window.dispatchEvent(new CustomEvent('open-preferences'))
    },
    toggleFocusMode: () => {
      window.dispatchEvent(new CustomEvent('toggle-focus-mode'))
    },
    toggleTypewriterMode: () => {
      window.dispatchEvent(new CustomEvent('toggle-typewriter-mode'))
    },
    // Future: editor selection context could be added here
  }
}
