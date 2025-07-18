import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { queryClient } from '../main'
// Schema imports removed temporarily until TanStack Query integration is complete
import { saveRecoveryData, saveCrashReport } from '../lib/recovery'
import { toast } from '../lib/toast'
import { queryKeys } from '../lib/query-keys'
import {
  projectRegistryManager,
  GlobalSettings,
  ProjectSettings,
} from '../lib/project-registry'

export interface FileEntry {
  id: string
  path: string
  name: string
  extension: string
  is_draft: boolean
  collection: string
  last_modified?: number
  frontmatter?: Record<string, unknown>
}

export interface MarkdownContent {
  frontmatter: Record<string, unknown>
  content: string
  raw_frontmatter: string
  imports: string
}

export interface Collection {
  name: string
  path: string
  schema?: string
}

interface AppState {
  // Project state
  projectPath: string | null
  currentProjectId: string | null

  // Settings state
  globalSettings: GlobalSettings | null
  currentProjectSettings: ProjectSettings | null

  // UI state
  sidebarVisible: boolean
  frontmatterPanelVisible: boolean
  currentFile: FileEntry | null
  selectedCollection: string | null

  // Editor state - Zustand as single source of truth for editing
  editorContent: string // Content without frontmatter and imports
  frontmatter: Record<string, unknown> // Current frontmatter being edited
  rawFrontmatter: string // Original frontmatter string from disk
  imports: string // MDX imports (hidden from editor)
  isDirty: boolean // True if changes need to be saved
  recentlySavedFile: string | null // Track recently saved file to ignore file watcher
  autoSaveTimeoutId: number | null // Auto-save timeout ID

  // Actions
  setProject: (path: string) => void
  openFile: (file: FileEntry) => Promise<void>
  closeCurrentFile: () => void
  saveFile: () => Promise<void>
  createNewFile: () => Promise<void>
  setEditorContent: (content: string) => void
  updateFrontmatter: (frontmatter: Record<string, unknown>) => void
  updateFrontmatterField: (key: string, value: unknown) => void
  scheduleAutoSave: () => void
  toggleSidebar: () => void
  toggleFrontmatterPanel: () => void
  setSelectedCollection: (collection: string | null) => void
  startFileWatcher: () => Promise<void>
  stopFileWatcher: () => Promise<void>
  loadPersistedProject: () => Promise<void>
  initializeProjectRegistry: () => Promise<void>
  updateGlobalSettings: (settings: Partial<GlobalSettings>) => Promise<void>
  updateProjectSettings: (settings: Partial<ProjectSettings>) => Promise<void>
  updateCurrentFilePath: (newPath: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  projectPath: null,
  currentProjectId: null,
  globalSettings: null,
  currentProjectSettings: null,
  sidebarVisible: true,
  frontmatterPanelVisible: true,
  currentFile: null,
  selectedCollection: null,
  editorContent: '',
  frontmatter: {},
  rawFrontmatter: '',
  imports: '',
  isDirty: false,
  recentlySavedFile: null,
  autoSaveTimeoutId: null,

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

        // Persist project path to localStorage as fallback
        try {
          localStorage.setItem('astro-editor-last-project', path)
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn('Failed to persist project path:', error)
        }

        await get().startFileWatcher()
      } catch (error) {
        toast.error('Failed to set project', {
          description:
            error instanceof Error ? error.message : 'Unknown error occurred',
        })
        // eslint-disable-next-line no-console
        console.error('Failed to set project:', error)
      }
    })()
  },


  openFile: async (file: FileEntry) => {
    try {
      const markdownContent = await invoke<MarkdownContent>(
        'parse_markdown_content',
        {
          filePath: file.path,
        }
      )

      set({
        currentFile: file,
        editorContent: markdownContent.content,
        frontmatter: markdownContent.frontmatter,
        rawFrontmatter: markdownContent.raw_frontmatter,
        imports: markdownContent.imports,
        isDirty: false,
      })
    } catch (error) {
      toast.error('Failed to open file', {
        description: `Could not open ${file.name}: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
      })
      // eslint-disable-next-line no-console
      console.error('Failed to open file:', error)

      // Save crash report for critical file parsing failures
      await saveCrashReport(error as Error, {
        currentFile: file.path,
        projectPath: get().projectPath || undefined,
        action: 'open_file',
      })
    }
  },

  closeCurrentFile: () => {
    // Clear auto-save timeout if it exists
    const { autoSaveTimeoutId } = get()
    if (autoSaveTimeoutId) {
      clearTimeout(autoSaveTimeoutId)
    }

    // Clear all file-related state
    set({
      currentFile: null,
      editorContent: '',
      frontmatter: {},
      rawFrontmatter: '',
      imports: '',
      isDirty: false,
      autoSaveTimeoutId: null,
    })
  },

  saveFile: async () => {
    const { currentFile, editorContent, frontmatter, imports } = get()
    if (!currentFile) return

    // Note: Schema validation is temporarily disabled until we integrate
    // TanStack Query for collections. This will be re-enabled once we
    // have a proper way to access collection schemas.

    try {
      // Schema field order is not available without collections
      const schemaFieldOrder = null

      // Track this file as recently saved to ignore file watcher events
      set({ recentlySavedFile: currentFile.path })

      await invoke('save_markdown_content', {
        filePath: currentFile.path,
        frontmatter,
        content: editorContent,
        imports,
        schemaFieldOrder,
      })

      // Clear auto-save timeout since we just saved
      const { autoSaveTimeoutId } = get()
      if (autoSaveTimeoutId) {
        clearTimeout(autoSaveTimeoutId)
        set({ autoSaveTimeoutId: null })
      }

      set({ isDirty: false })

      // Invalidate queries to update UI with new frontmatter
      const { projectPath } = get()
      if (projectPath && currentFile.collection) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.collectionFiles(projectPath, currentFile.collection),
        })
      }

      // Show success toast
      toast.success('File saved successfully')

      // Clear the recently saved file after a delay
      setTimeout(() => {
        set({ recentlySavedFile: null })
      }, 1000)
    } catch (error) {
      toast.error('Save failed', {
        description: `Could not save file: ${error instanceof Error ? error.message : 'Unknown error occurred'}. Recovery data has been saved.`,
      })
      // eslint-disable-next-line no-console
      console.error('Save failed:', error)
      // eslint-disable-next-line no-console
      console.log('Attempting to save recovery data...')

      // Save recovery data
      const state = get()
      await saveRecoveryData({
        currentFile: state.currentFile,
        projectPath: state.projectPath,
        editorContent: state.editorContent,
        frontmatter: state.frontmatter,
      })

      // Save crash report
      await saveCrashReport(error as Error, {
        currentFile: state.currentFile?.path,
        projectPath: state.projectPath || undefined,
        action: 'save',
      })

      // Keep the file marked as dirty since save failed
      set({ isDirty: true, recentlySavedFile: null })
    }
  },

  setEditorContent: (content: string) => {
    set({ editorContent: content, isDirty: true })
    get().scheduleAutoSave()
  },

  updateFrontmatter: (frontmatter: Record<string, unknown>) => {
    set({ frontmatter, isDirty: true })
    get().scheduleAutoSave()
  },

  updateFrontmatterField: (key: string, value: unknown) => {
    const { frontmatter } = get()
    const newFrontmatter = { ...frontmatter }

    // Remove field if value is empty
    const isEmpty =
      value === null ||
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)

    if (isEmpty) {
      delete newFrontmatter[key]
    } else {
      newFrontmatter[key] = value
    }

    set({ frontmatter: newFrontmatter, isDirty: true })
    get().scheduleAutoSave()
  },

  scheduleAutoSave: () => {
    const store = get()

    // Clear existing timeout
    if (store.autoSaveTimeoutId) {
      clearTimeout(store.autoSaveTimeoutId)
    }

    // Schedule new auto-save
    const timeoutId = setTimeout(() => {
      void store.saveFile()
    }, 2000)

    set({ autoSaveTimeoutId: timeoutId })
  },

  toggleSidebar: () => {
    set(state => ({ sidebarVisible: !state.sidebarVisible }))
  },

  toggleFrontmatterPanel: () => {
    set(state => ({ frontmatterPanelVisible: !state.frontmatterPanelVisible }))
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

      if (contentDirectory && contentDirectory !== 'src/content') {
        await invoke('start_watching_project_with_content_dir', {
          projectPath,
          contentDirectory,
        })
      } else {
        await invoke('start_watching_project', { projectPath })
      }

      // Listen for file change events
      void listen('file-changed', (event: { payload: unknown }) => {
        const { recentlySavedFile } = get()

        // Skip refresh if this is the file we just saved
        if (recentlySavedFile && typeof event.payload === 'string') {
          const eventPath = event.payload.replace(/\\/g, '/')
          const savedPath = recentlySavedFile.replace(/\\/g, '/')

          if (
            eventPath === savedPath ||
            eventPath.endsWith(savedPath) ||
            savedPath.endsWith(eventPath)
          ) {
            return
          }
        }

        // File refresh is now handled by TanStack Query invalidation
        // This event is kept for future use
      })
    } catch (error) {
      toast.warning('File watcher failed to start', {
        description: 'Changes to files may not be automatically detected.',
      })
      // eslint-disable-next-line no-console
      console.error('Failed to start file watcher:', error)
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
      // eslint-disable-next-line no-console
      console.error('Failed to stop file watcher:', error)
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

      // Fallback to localStorage if no registry data
      if (!get().projectPath) {
        const savedPath = localStorage.getItem('astro-editor-last-project')
        if (savedPath) {
          try {
            await invoke('scan_project', {
              projectPath: savedPath,
            })
            get().setProject(savedPath)
          } catch (error) {
            toast.info('Previous project no longer available', {
              description: 'The last opened project could not be found.',
            })
            // eslint-disable-next-line no-console
            console.warn(
              'Saved project path no longer valid:',
              savedPath,
              error
            )
            localStorage.removeItem('astro-editor-last-project')
          }
        }
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

      // Log the app data directory for debugging
      try {
        const appDataDir = await invoke<string>('get_app_data_dir')
        // eslint-disable-next-line no-console
        console.log('App data directory:', appDataDir)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to get app data directory:', error)
      }
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
      // eslint-disable-next-line no-console
      console.error('Failed to update global settings:', error)
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
      // eslint-disable-next-line no-console
      console.error('Failed to update project settings:', error)
    }
  },

  createNewFile: async () => {
    // Dispatch event to be handled by components that have access to TanStack Query
    window.dispatchEvent(new CustomEvent('create-new-file'))
  },

  updateCurrentFilePath: (newPath: string) => {
    const { currentFile } = get()
    if (currentFile) {
      set({
        currentFile: {
          ...currentFile,
          path: newPath,
          name: newPath.substring(newPath.lastIndexOf('/') + 1).replace(/\.[^.]+$/, ''),
        },
      })
    }
  },
}))
