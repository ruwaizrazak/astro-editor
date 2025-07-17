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
    createNewFile,
    setSelectedCollection,
    setProject,
    toggleSidebar,
    toggleFrontmatterPanel,
    saveFile,
    closeCurrentFile,
    loadCollections,
  } = useAppStore()

  return {
    currentFile,
    selectedCollection,
    collections,
    projectPath,
    isDirty,
    createNewFile,
    setSelectedCollection,
    setProject,
    toggleSidebar,
    toggleFrontmatterPanel,
    saveFile,
    closeCurrentFile,
    loadCollections,
    // Future: editor selection context could be added here
  }
}
