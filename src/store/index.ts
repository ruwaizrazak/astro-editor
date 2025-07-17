import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import {
  parseSchemaJson,
  validateFieldValue,
  getDefaultValueForField,
} from '../lib/schema'
import { saveRecoveryData, saveCrashReport } from '../lib/recovery'
import { toast } from '../lib/toast'

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

    if (!projectPath) {
      return
    }

    try {
      const collections = await invoke<Collection[]>('scan_project', {
        projectPath,
      })
      set({ collections })
    } catch (error) {
      toast.error('Failed to load collections', {
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
      })
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
      toast.error('Failed to load collection files', {
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
      })
      // eslint-disable-next-line no-console
      console.error('Failed to load collection files:', error)
    }
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
        toast.error('Cannot save: Validation errors', {
          description: validationErrors.join(', '),
        })
        // eslint-disable-next-line no-console
        console.error('Cannot save: Validation errors:', validationErrors)
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
      const savedPath = localStorage.getItem('astro-editor-last-project')

      if (savedPath) {
        // Verify the project path still exists before setting it
        try {
          await invoke('scan_project', {
            projectPath: savedPath,
          })
          // If no error, the project path is valid, so restore it
          get().setProject(savedPath)
        } catch (error) {
          toast.info('Previous project no longer available', {
            description: 'The last opened project could not be found.',
          })
          // eslint-disable-next-line no-console
          console.warn('Saved project path no longer valid:', savedPath, error)
          localStorage.removeItem('astro-editor-last-project')
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load persisted project:', error)
    }
  },

  createNewFile: async () => {
    const { selectedCollection, collections } = get()
    if (!selectedCollection) return

    const collection = collections.find(c => c.name === selectedCollection)
    if (!collection) return

    // Helper function to singularize collection name
    const singularize = (word: string): string => {
      const pluralRules = [
        { suffix: 'ies', replacement: 'y' }, // stories -> story
        { suffix: 'es', replacement: 'e' }, // articles -> article (not articl)
        { suffix: 's', replacement: '' }, // notes -> note
      ]

      for (const rule of pluralRules) {
        if (word.endsWith(rule.suffix)) {
          return word.slice(0, -rule.suffix.length) + rule.replacement
        }
      }
      return word
    }

    try {
      // Generate filename based on today's date
      const today = new Date().toISOString().split('T')[0]
      let filename = `${today}.md`
      let counter = 1

      // Check if file exists and increment counter if needed
      const collectionFiles = await invoke<FileEntry[]>(
        'scan_collection_files',
        {
          collectionPath: collection.path,
        }
      )

      const existingNames = new Set(
        collectionFiles.map(f =>
          f.extension ? `${f.name}.${f.extension}` : f.name
        )
      )

      while (existingNames.has(filename)) {
        filename = `${today}-${counter}.md`
        counter++
      }

      // Generate default frontmatter from schema
      const schema = collection.schema
        ? parseSchemaJson(collection.schema)
        : null
      const defaultFrontmatter: Record<string, unknown> = {}

      // Track if we have a title field in the schema
      let hasTitleField = false

      // Generate default title
      const singularName = singularize(selectedCollection)
      const defaultTitle = `New ${singularName.charAt(0).toUpperCase() + singularName.slice(1)}`

      if (schema?.fields) {
        for (const field of schema.fields) {
          // Check if this is a title field
          if (field.name.toLowerCase() === 'title') {
            hasTitleField = true
            // Always include title field with default value
            defaultFrontmatter[field.name] = defaultTitle
          }
          // Check for date fields (pubDate, date, publishedDate)
          else if (
            field.type === 'Date' &&
            (field.name.toLowerCase() === 'pubdate' ||
              field.name.toLowerCase() === 'date' ||
              field.name.toLowerCase() === 'publisheddate')
          ) {
            // Only add date fields if they exist in the schema
            defaultFrontmatter[field.name] = today
          }
          // Include other required fields
          else if (!field.optional) {
            defaultFrontmatter[field.name] = getDefaultValueForField(field)
          }
        }
      }

      // Create YAML frontmatter with proper type formatting
      const frontmatterYaml =
        Object.keys(defaultFrontmatter).length > 0
          ? `---\n${Object.entries(defaultFrontmatter)
              .map(([key, value]) => {
                if (typeof value === 'string') {
                  return `${key}: "${value}"`
                } else if (typeof value === 'boolean') {
                  return `${key}: ${value}` // Don't quote booleans
                } else if (Array.isArray(value)) {
                  return `${key}: []` // Empty array
                } else if (typeof value === 'number') {
                  return `${key}: ${value}` // Don't quote numbers
                }
                return `${key}: ${String(value)}`
              })
              .join('\n')}\n---\n\n`
          : ''

      // Create the file
      const directory = collection.path
      const filenameOnly = filename
      await invoke('create_file', {
        directory,
        filename: filenameOnly,
        content: frontmatterYaml,
      })

      // Refresh the collection files
      await get().loadCollectionFiles(collection.path)

      // Find and open the newly created file
      const updatedFiles = await invoke<FileEntry[]>('scan_collection_files', {
        collectionPath: collection.path,
      })

      const newFile = updatedFiles.find(
        f => (f.extension ? `${f.name}.${f.extension}` : f.name) === filename
      )

      if (newFile) {
        await get().openFile(newFile)

        // Show success toast
        toast.success('New file created successfully')

        // Open frontmatter panel if we have a title field
        const { frontmatterPanelVisible, toggleFrontmatterPanel } = get()
        if (hasTitleField && !frontmatterPanelVisible) {
          toggleFrontmatterPanel()
        }

        // Focus the appropriate element after a delay to allow UI to update
        setTimeout(() => {
          if (hasTitleField) {
            // Try to find and focus the title field by ID
            const titleField = document.getElementById(
              'frontmatter-title-field'
            ) as HTMLTextAreaElement
            if (titleField) {
              titleField.focus()
              titleField.select()
            }
          } else {
            // No title field, focus the main editor
            const cmEditor = document.querySelector(
              '.cm-editor .cm-content'
            ) as HTMLElement
            if (cmEditor) {
              cmEditor.focus()
            }
          }
        }, 200)
      }
    } catch (error) {
      toast.error('Failed to create new file', {
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
      })
      // eslint-disable-next-line no-console
      console.error('Failed to create new file:', error)
    }
  },
}))
