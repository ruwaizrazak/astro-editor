import { invoke } from '@tauri-apps/api/core'
import {
  FileText,
  FolderOpen,
  Save,
  X,
  Sidebar,
  PanelRight,
  RefreshCw,
  Plus,
} from 'lucide-react'
import { AppCommand, CommandContext } from './types'
import { Collection } from '../../store'
import { toast } from '../toast'

/**
 * File-related commands
 */
export const fileCommands: AppCommand[] = [
  {
    id: 'new-file',
    label: 'New File',
    description: 'Create a new file in the selected collection',
    icon: Plus,
    group: 'file',
    execute: async (context: CommandContext) => {
      await context.createNewFile()
    },
    isAvailable: (context: CommandContext) => {
      return Boolean(context.selectedCollection && context.projectPath)
    },
  },
  {
    id: 'save-file',
    label: 'Save File',
    description: 'Save the current file',
    icon: Save,
    group: 'file',
    execute: async (context: CommandContext) => {
      await context.saveFile()
    },
    isAvailable: (context: CommandContext) => {
      return Boolean(context.currentFile && context.isDirty)
    },
  },
  {
    id: 'close-file',
    label: 'Close File',
    description: 'Close the current file',
    icon: X,
    group: 'file',
    execute: (context: CommandContext) => {
      context.closeCurrentFile()
    },
    isAvailable: (context: CommandContext) => {
      return Boolean(context.currentFile)
    },
  },
]

/**
 * Navigation-related commands
 */
export const navigationCommands: AppCommand[] = [
  {
    id: 'toggle-sidebar',
    label: 'Toggle Sidebar',
    description: 'Show or hide the sidebar',
    icon: Sidebar,
    group: 'navigation',
    execute: (context: CommandContext) => {
      context.toggleSidebar()
    },
    isAvailable: () => true,
  },
  {
    id: 'toggle-frontmatter-panel',
    label: 'Toggle Frontmatter Panel',
    description: 'Show or hide the frontmatter panel',
    icon: PanelRight,
    group: 'navigation',
    execute: (context: CommandContext) => {
      context.toggleFrontmatterPanel()
    },
    isAvailable: () => true,
  },
]

/**
 * Project-related commands
 */
export const projectCommands: AppCommand[] = [
  {
    id: 'open-project',
    label: 'Open Project',
    description: 'Select a new project folder',
    icon: FolderOpen,
    group: 'project',
    execute: async (context: CommandContext) => {
      try {
        const projectPath = await invoke<string>('select_project_folder')
        if (projectPath) {
          context.setProject(projectPath)
          toast.success('Project opened successfully')
        }
      } catch (error) {
        toast.error('Failed to open project', {
          description:
            error instanceof Error ? error.message : 'Unknown error occurred',
        })
      }
    },
    isAvailable: () => true,
  },
  {
    id: 'reload-collections',
    label: 'Reload Collections',
    description: 'Refresh the project structure',
    icon: RefreshCw,
    group: 'project',
    execute: async (context: CommandContext) => {
      await context.loadCollections()
      toast.success('Collections reloaded')
    },
    isAvailable: (context: CommandContext) => {
      return Boolean(context.projectPath)
    },
  },
]

/**
 * Generate dynamic collection commands based on available collections
 */
export function generateCollectionCommands(
  collections: Collection[]
): AppCommand[] {
  return collections.map(collection => ({
    id: `open-collection-${collection.name}`,
    label: `Open Collection: ${collection.name}`,
    description: `Switch to the ${collection.name} collection`,
    icon: FileText,
    group: 'navigation' as const,
    execute: (context: CommandContext) => {
      context.setSelectedCollection(collection.name)
    },
    isAvailable: (context: CommandContext) => {
      return context.selectedCollection !== collection.name
    },
  }))
}

/**
 * Get all available commands based on current context
 */
export function getAllCommands(context: CommandContext): AppCommand[] {
  const collectionCommands = generateCollectionCommands(context.collections)

  return [
    ...fileCommands,
    ...navigationCommands,
    ...projectCommands,
    ...collectionCommands,
  ].filter(command => command.isAvailable(context))
}
