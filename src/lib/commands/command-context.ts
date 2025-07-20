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
    collections: [], // TODO: Get from TanStack Query
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
