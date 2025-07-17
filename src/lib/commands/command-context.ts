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
    collections,
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
    loadCollections,
    loadCollectionFiles,
  } = useAppStore()

  return {
    currentFile,
    selectedCollection,
    collections,
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
    loadCollections,
    loadCollectionFiles,
    // Future: editor selection context could be added here
  }
}
