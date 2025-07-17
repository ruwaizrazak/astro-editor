import { type FileEntry, type Collection } from '../../store'

/**
 * Command system types for the application command palette
 */

export interface CommandContext {
  // Current application state
  currentFile: FileEntry | null
  selectedCollection: string | null
  collections: Collection[]
  projectPath: string | null
  isDirty: boolean

  // Store actions
  createNewFile: () => Promise<void>
  setSelectedCollection: (collection: string | null) => void
  setProject: (path: string) => void
  toggleSidebar: () => void
  toggleFrontmatterPanel: () => void
  saveFile: () => Promise<void>
  closeCurrentFile: () => void
  loadCollections: () => Promise<void>
  loadCollectionFiles: (collectionPath: string) => Promise<void>

  // Future extensibility
  editorSelection?: {
    text: string
    from: number
    to: number
  }
}

export interface AppCommand {
  id: string
  label: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  group: 'file' | 'navigation' | 'project'
  execute: (context: CommandContext) => void | Promise<void>
  isAvailable: (context: CommandContext) => boolean
}

export interface CommandGroup {
  heading: string
  commands: AppCommand[]
}
