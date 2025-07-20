import { invoke } from '@tauri-apps/api/core'
import { Command } from '@tauri-apps/plugin-shell'
import {
  FileText,
  FolderOpen,
  Save,
  X,
  Sidebar,
  PanelRight,
  RefreshCw,
  Plus,
  ExternalLink,
  Code,
  Folder,
  Settings,
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
    execute: (context: CommandContext) => {
      context.createNewFile()
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
    execute: (context: CommandContext) => {
      context.loadCollections()
      toast.success('Collections reloaded')
    },
    isAvailable: (context: CommandContext) => {
      return Boolean(context.projectPath)
    },
  },
]

/**
 * Settings-related commands
 */
export const settingsCommands: AppCommand[] = [
  {
    id: 'open-preferences',
    label: 'Open Preferences',
    description: 'Open application preferences and settings',
    icon: Settings,
    group: 'settings',
    execute: (context: CommandContext) => {
      context.openPreferences()
    },
    isAvailable: () => true,
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
      context.loadCollectionFiles()
    },
    isAvailable: (context: CommandContext) => {
      return context.selectedCollection !== collection.name
    },
  }))
}

/**
 * Helper function to execute IDE commands
 */
async function executeIdeCommand(ideCommand: string, path: string) {
  try {
    const command = Command.create(ideCommand, [path])
    await command.execute()
    toast.success(`Opened in ${ideCommand}`)
  } catch (error) {
    toast.error('Failed to open in IDE', {
      description:
        error instanceof Error ? error.message : 'Unknown error occurred',
    })
  }
}

/**
 * IDE-related commands
 */
export const ideCommands: AppCommand[] = [
  {
    id: 'open-project-in-ide',
    label: 'Open Project in IDE',
    description: 'Open the current project in your preferred IDE',
    icon: Code,
    group: 'ide',
    execute: async (context: CommandContext) => {
      const ideCommand = context.globalSettings?.general?.ideCommand
      if (ideCommand && context.projectPath) {
        await executeIdeCommand(ideCommand, context.projectPath)
      }
    },
    isAvailable: (context: CommandContext) => {
      return Boolean(
        context.globalSettings?.general?.ideCommand && context.projectPath
      )
    },
  },
  {
    id: 'open-collection-in-ide',
    label: 'Open Collection in IDE',
    description: 'Open the current collection directory in your preferred IDE',
    icon: Folder,
    group: 'ide',
    execute: async (context: CommandContext) => {
      const ideCommand = context.globalSettings?.general?.ideCommand
      if (ideCommand && context.selectedCollection && context.projectPath) {
        // Find the collection to get its path
        const collection = context.collections.find(
          c => c.name === context.selectedCollection
        )
        if (collection) {
          await executeIdeCommand(ideCommand, collection.path)
        }
      }
    },
    isAvailable: (context: CommandContext) => {
      return Boolean(
        context.globalSettings?.general?.ideCommand &&
          context.selectedCollection &&
          context.projectPath
      )
    },
  },
  {
    id: 'open-file-in-ide',
    label: 'Open File in IDE',
    description: 'Open the current file in your preferred IDE',
    icon: ExternalLink,
    group: 'ide',
    execute: async (context: CommandContext) => {
      const ideCommand = context.globalSettings?.general?.ideCommand
      if (ideCommand && context.currentFile) {
        await executeIdeCommand(ideCommand, context.currentFile.path)
      }
    },
    isAvailable: (context: CommandContext) => {
      return Boolean(
        context.globalSettings?.general?.ideCommand && context.currentFile
      )
    },
  },
]

/**
 * Get all available commands based on current context
 */
export function getAllCommands(context: CommandContext): AppCommand[] {
  const collectionCommands = generateCollectionCommands(context.collections)

  return [
    ...fileCommands,
    ...navigationCommands,
    ...projectCommands,
    ...settingsCommands,
    ...ideCommands,
    ...collectionCommands,
  ].filter(command => command.isAvailable(context))
}
