import { useAppStore } from '../../store'
import { CommandContext } from './types'

/**
 * Creates command context from current app state
 * This provides all the information and actions commands need
 */
export function useCommandContext(): CommandContext {
  const {
    currentFile,
    selectedCollection,
    projectPath,
    isDirty,
    globalSettings,
    createNewFile,
    setSelectedCollection,
    setProject,
    toggleSidebar,
    toggleFrontmatterPanel,
    saveFile,
    closeCurrentFile,
  } = useAppStore()

  return {
    currentFile,
    selectedCollection,
    collections: [], // TODO: Get from TanStack Query
    projectPath,
    isDirty,
    globalSettings,
    createNewFile,
    setSelectedCollection,
    setProject,
    toggleSidebar,
    toggleFrontmatterPanel,
    saveFile,
    closeCurrentFile,
    loadCollections: async () => {
      /* TODO: Refetch query */
    },
    loadCollectionFiles: async () => {
      /* TODO: Refetch query */
    },
    openPreferences: () => {
      // Dispatch a custom event that Layout can listen to
      window.dispatchEvent(new CustomEvent('open-preferences'))
    },
    // Future: editor selection context could be added here
  }
}
