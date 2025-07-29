import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { error as logError } from '@tauri-apps/plugin-log'
import { toast } from '../lib/toast'
import { ASTRO_PATHS } from '../lib/constants'
import {
  projectRegistryManager,
  GlobalSettings,
  ProjectSettings,
} from '../lib/project-registry'

interface ProjectState {
  // Core identifiers
  projectPath: string | null
  currentProjectId: string | null
  selectedCollection: string | null

  // Settings
  globalSettings: GlobalSettings | null
  currentProjectSettings: ProjectSettings | null

  // Actions
  setProject: (path: string) => void
  setSelectedCollection: (collection: string | null) => void
  loadPersistedProject: () => Promise<void>
  initializeProjectRegistry: () => Promise<void>
  updateGlobalSettings: (settings: Partial<GlobalSettings>) => Promise<void>
  updateProjectSettings: (settings: Partial<ProjectSettings>) => Promise<void>
  startFileWatcher: () => Promise<void>
  stopFileWatcher: () => Promise<void>
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  // Initial state
  projectPath: null,
  currentProjectId: null,
  selectedCollection: null,
  globalSettings: null,
  currentProjectSettings: null,

  // Actions
  setProject: (path: string) => {
    void (async () => {
      try {
        // Register the project and get its ID
        const projectId = await projectRegistryManager.registerProject(path)

        // Load project settings
        const projectSettings =
          await projectRegistryManager.getEffectiveSettings(projectId)

        set({
          projectPath: path,
          currentProjectId: projectId,
          currentProjectSettings: projectSettings,
        })

        // Project persistence is now handled by the project registry system

        await get().startFileWatcher()
      } catch (error) {
        toast.error('Failed to set project', {
          description:
            error instanceof Error ? error.message : 'Unknown error occurred',
        })
        await logError(`Failed to set project: ${String(error)}`)
      }
    })()
  },

  setSelectedCollection: (collection: string | null) => {
    set({ selectedCollection: collection })
  },

  startFileWatcher: async () => {
    const { projectPath, currentProjectSettings } = get()
    if (!projectPath) return

    try {
      // Use path override if configured
      const contentDirectory =
        currentProjectSettings?.pathOverrides?.contentDirectory

      if (contentDirectory && contentDirectory !== ASTRO_PATHS.CONTENT_DIR) {
        await invoke('start_watching_project_with_content_dir', {
          projectPath,
          contentDirectory,
        })
      } else {
        await invoke('start_watching_project', { projectPath })
      }

      // Listen for file change events
      const unlistenFileChanged = listen(
        'file-changed',
        (event: { payload: unknown }) => {
          // File refresh is now handled by TanStack Query invalidation
          // This event is kept for future use

          // Dispatch custom event for editor store to handle recently saved file logic
          window.dispatchEvent(
            new CustomEvent('file-changed', {
              detail: event.payload,
            })
          )
        }
      )

      // Store the unlisten function for cleanup (though we don't currently clean it up)
      void unlistenFileChanged
    } catch (error) {
      toast.warning('File watcher failed to start', {
        description: 'Changes to files may not be automatically detected.',
      })
      await logError(`Failed to start file watcher: ${String(error)}`)
    }
  },

  stopFileWatcher: async () => {
    const { projectPath } = get()
    if (!projectPath) return

    try {
      await invoke('stop_watching_project', { projectPath })
    } catch (error) {
      toast.warning('Failed to stop file watcher', {
        description: 'File watcher may still be running in the background.',
      })
      await logError(`Failed to stop file watcher: ${String(error)}`)
    }
  },

  loadPersistedProject: async () => {
    try {
      await get().initializeProjectRegistry()

      // Try to load the last opened project from registry
      const lastProjectId = projectRegistryManager.getLastOpenedProjectId()
      if (lastProjectId) {
        const projectData =
          await projectRegistryManager.getProjectData(lastProjectId)
        if (projectData) {
          try {
            // Verify the project path still exists before setting it
            await invoke('scan_project', {
              projectPath: projectData.metadata.path,
            })
            // If no error, the project path is valid, so restore it
            get().setProject(projectData.metadata.path)
          } catch (error) {
            toast.info('Previous project no longer available', {
              description: 'The last opened project could not be found.',
            })
            // eslint-disable-next-line no-console
            console.warn(
              'Saved project path no longer valid:',
              projectData.metadata.path,
              error
            )
          }
        }
      }

      // Project persistence is now fully handled by the file-based project registry
      // Clean up any legacy localStorage entries to prevent conflicts
      try {
        localStorage.removeItem('astro-editor-last-project')
      } catch {
        // Ignore errors - localStorage cleanup is optional
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load persisted project:', error)
    }
  },

  initializeProjectRegistry: async () => {
    try {
      await projectRegistryManager.initialize()
      const globalSettings = projectRegistryManager.getGlobalSettings()
      set({ globalSettings })
    } catch (error) {
      toast.error('Failed to initialize project registry', {
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
      })
      // eslint-disable-next-line no-console
      console.error('Failed to initialize project registry:', error)
    }
  },

  updateGlobalSettings: async (settings: Partial<GlobalSettings>) => {
    try {
      await projectRegistryManager.updateGlobalSettings(settings)
      const updatedSettings = projectRegistryManager.getGlobalSettings()
      set({ globalSettings: updatedSettings })
    } catch (error) {
      toast.error('Failed to update global settings', {
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
      })
      await logError(`Failed to update global settings: ${String(error)}`)
    }
  },

  updateProjectSettings: async (settings: Partial<ProjectSettings>) => {
    const { currentProjectId } = get()
    if (!currentProjectId) {
      toast.error('No project is currently open')
      return
    }

    try {
      await projectRegistryManager.updateProjectSettings(
        currentProjectId,
        settings
      )
      const updatedSettings =
        await projectRegistryManager.getEffectiveSettings(currentProjectId)
      set({ currentProjectSettings: updatedSettings })
    } catch (error) {
      toast.error('Failed to update project settings', {
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
      })
      await logError(`Failed to update project settings: ${String(error)}`)
    }
  },
}))

// Components can use direct selectors like:
// const projectPath = useProjectStore(state => state.projectPath)
