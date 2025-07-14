import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { parseSchemaJson, validateFieldValue } from '../lib/schema'

export interface FileEntry {
  id: string
  path: string
  name: string
  extension: string
  is_draft: boolean
  collection: string
  last_modified?: number
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
  collections: Collection[]

  // UI state
  sidebarVisible: boolean
  frontmatterPanelVisible: boolean
  currentFile: FileEntry | null
  files: FileEntry[]
  selectedCollection: string | null

  // Editor state - Zustand as single source of truth
  editorContent: string // Content without frontmatter and imports
  frontmatter: Record<string, unknown> // Current frontmatter being edited
  rawFrontmatter: string // Original frontmatter string from disk
  imports: string // MDX imports (hidden from editor)
  isDirty: boolean // True if changes need to be saved
  recentlySavedFile: string | null // Track recently saved file to ignore file watcher
  autoSaveTimeoutId: number | null // Auto-save timeout ID

  // Actions
  setProject: (path: string) => void
  loadCollections: () => Promise<void>
  loadCollectionFiles: (collectionPath: string) => Promise<void>
  openFile: (file: FileEntry) => Promise<void>
  saveFile: () => Promise<void>
  setEditorContent: (content: string) => void
  updateFrontmatter: (frontmatter: Record<string, unknown>) => void
  scheduleAutoSave: () => void
  toggleSidebar: () => void
  toggleFrontmatterPanel: () => void
  setSelectedCollection: (collection: string | null) => void
  startFileWatcher: () => Promise<void>
  stopFileWatcher: () => Promise<void>
  loadPersistedProject: () => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  projectPath: null,
  collections: [],
  sidebarVisible: true,
  frontmatterPanelVisible: true,
  currentFile: null,
  files: [],
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
    set({ projectPath: path })
    // Persist project path to localStorage
    try {
      localStorage.setItem('astro-editor-last-project', path)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to persist project path:', error)
    }
    void get().loadCollections()
    void get().startFileWatcher()
  },

  loadCollections: async () => {
    const { projectPath } = get()
    /* eslint-disable no-console */
    console.log('=== LOADING COLLECTIONS ===')
    console.log('Project path:', projectPath)

    if (!projectPath) {
      console.log('No project path set, skipping collection load')
      return
    }

    try {
      console.log('Scanning project for collections...')
      const collections = await invoke<Collection[]>('scan_project', {
        projectPath,
      })
      console.log('Collections loaded:', collections)
      console.log(
        'Collection details:',
        collections.map(c => ({
          name: c.name,
          path: c.path,
          hasSchema: !!c.schema,
          schemaLength: c.schema?.length || 0,
          schemaPreview: c.schema?.substring(0, 100) + '...',
        }))
      )
      /* eslint-enable no-console */

      set({ collections })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load collections:', error)
    }
  },

  loadCollectionFiles: async (collectionPath: string) => {
    try {
      const files = await invoke<FileEntry[]>('scan_collection_files', {
        collectionPath,
      })
      set({ files })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load collection files:', error)
    }
  },

  openFile: async (file: FileEntry) => {
    /* eslint-disable no-console */
    console.log('=== OPENING FILE ===')
    console.log('File:', file)

    try {
      const markdownContent = await invoke<MarkdownContent>(
        'parse_markdown_content',
        {
          filePath: file.path,
        }
      )
      console.log('Parsed markdown content:', {
        frontmatter: markdownContent.frontmatter,
        contentLength: markdownContent.content.length,
        rawFrontmatterLength: markdownContent.raw_frontmatter.length,
        importsLength: markdownContent.imports.length,
      })

      set({
        currentFile: file,
        editorContent: markdownContent.content,
        frontmatter: markdownContent.frontmatter,
        rawFrontmatter: markdownContent.raw_frontmatter,
        imports: markdownContent.imports,
        isDirty: false,
      })

      // Log state after setting
      const { collections } = get()
      const currentCollection = collections.find(
        c => c.name === file.collection
      )
      console.log('Current collection after opening file:', currentCollection)
      console.log('Schema available:', !!currentCollection?.schema)
      /* eslint-enable no-console */
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to open file:', error)
    }
  },

  saveFile: async () => {
    const { currentFile, editorContent, frontmatter, imports, collections } =
      get()
    if (!currentFile) return

    // Validate frontmatter before saving
    const currentCollection = collections.find(
      c => c.name === currentFile.collection
    )
    const schema = currentCollection?.schema
      ? parseSchemaJson(currentCollection.schema)
      : null

    if (schema) {
      const validationErrors: string[] = []

      // Check all schema fields for validation errors
      schema.fields.forEach(field => {
        const value = frontmatter[field.name]
        const error = validateFieldValue(field, value)
        if (error) {
          validationErrors.push(error)
        }
      })

      if (validationErrors.length > 0) {
        // eslint-disable-next-line no-console
        console.error('Cannot save: Validation errors:', validationErrors)
        // TODO: Show user-friendly error dialog instead of console.error
        return
      }
    }

    try {
      // Extract schema field order if available
      const schemaFieldOrder = schema?.fields.map(field => field.name) || null

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

      // Clear the recently saved file after a delay
      setTimeout(() => {
        set({ recentlySavedFile: null })
      }, 1000)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save file:', error)
      set({ recentlySavedFile: null })
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
    const { projectPath } = get()
    if (!projectPath) return

    try {
      await invoke('start_watching_project', { projectPath })

      // Listen for file change events - only update file lists, never interrupt editing
      void listen('file-changed', (event: { payload: unknown }) => {
        const { recentlySavedFile, selectedCollection, collections } = get()

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

        // Only refresh file list for current collection - never touch editing state
        if (selectedCollection) {
          const currentCollection = collections.find(
            c => c.name === selectedCollection
          )
          if (currentCollection) {
            void get().loadCollectionFiles(currentCollection.path)
          }
        }
      })
    } catch (error) {
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
      // eslint-disable-next-line no-console
      console.error('Failed to stop file watcher:', error)
    }
  },

  loadPersistedProject: async () => {
    try {
      const savedPath = localStorage.getItem('astro-editor-last-project')
      /* eslint-disable no-console */
      console.log('Persisted project path from localStorage:', savedPath)

      if (savedPath) {
        // Verify the project path still exists before setting it
        try {
          console.log('Verifying project path exists...')
          const collections = await invoke('scan_project', {
            projectPath: savedPath,
          })
          console.log(
            'Project scan successful, collections found:',
            collections
          )

          // If no error, the project path is valid, so restore it
          console.log('Setting project path:', savedPath)
          /* eslint-enable no-console */
          get().setProject(savedPath)
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn('Saved project path no longer valid:', savedPath, error)
          // Remove invalid path from storage
          localStorage.removeItem('astro-editor-last-project')
        }
      } else {
        // eslint-disable-next-line no-console
        console.log('No persisted project path found')
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load persisted project:', error)
    }
  },
}))
