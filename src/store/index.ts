import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { parseSchemaJson, validateFieldValue } from '../lib/schema';

export interface FileEntry {
  id: string;
  path: string;
  name: string;
  extension: string;
  is_draft: boolean;
  collection: string;
  last_modified?: number;
}

export interface MarkdownContent {
  frontmatter: Record<string, unknown>;
  content: string;
  raw_frontmatter: string;
  imports: string;
}

export interface Collection {
  name: string;
  path: string;
  schema?: string;
}

interface AppState {
  // Project state
  projectPath: string | null;
  collections: Collection[];

  // UI state
  sidebarVisible: boolean;
  frontmatterPanelVisible: boolean;
  currentFile: FileEntry | null;
  files: FileEntry[];
  selectedCollection: string | null;

  // Editor state
  editorContent: string; // Content without frontmatter and imports
  frontmatter: Record<string, unknown>; // Parsed frontmatter object
  rawFrontmatter: string; // Original frontmatter string
  imports: string; // MDX imports (hidden from editor)
  isDirty: boolean;

  // Actions
  setProject: (path: string) => void;
  loadCollections: () => Promise<void>;
  loadCollectionFiles: (collectionPath: string) => Promise<void>;
  openFile: (file: FileEntry) => Promise<void>;
  saveFile: () => Promise<void>;
  setEditorContent: (content: string) => void;
  updateFrontmatter: (frontmatter: Record<string, unknown>) => void;
  toggleSidebar: () => void;
  toggleFrontmatterPanel: () => void;
  setSelectedCollection: (collection: string | null) => void;
  startFileWatcher: () => Promise<void>;
  stopFileWatcher: () => Promise<void>;
  loadPersistedProject: () => Promise<void>;
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

  // Actions
  setProject: (path: string) => {
    set({ projectPath: path });
    // Persist project path to localStorage
    try {
      localStorage.setItem('astro-editor-last-project', path);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to persist project path:', error);
    }
    void get().loadCollections();
    void get().startFileWatcher();
  },

  loadCollections: async () => {
    const { projectPath } = get();
    console.log('=== LOADING COLLECTIONS ===');
    console.log('Project path:', projectPath);
    
    if (!projectPath) {
      console.log('No project path set, skipping collection load');
      return;
    }

    try {
      console.log('Scanning project for collections...');
      const collections = await invoke<Collection[]>('scan_project', {
        projectPath,
      });
      console.log('Collections loaded:', collections);
      console.log('Collection details:', collections.map(c => ({
        name: c.name,
        path: c.path,
        hasSchema: !!c.schema,
        schemaLength: c.schema?.length || 0,
        schemaPreview: c.schema?.substring(0, 100) + '...'
      })));
      
      set({ collections });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load collections:', error);
    }
  },

  loadCollectionFiles: async (collectionPath: string) => {
    try {
      const files = await invoke<FileEntry[]>('scan_collection_files', {
        collectionPath,
      });
      set({ files });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load collection files:', error);
    }
  },

  openFile: async (file: FileEntry) => {
    console.log('=== OPENING FILE ===');
    console.log('File:', file);
    
    try {
      const markdownContent = await invoke<MarkdownContent>(
        'parse_markdown_content',
        {
          filePath: file.path,
        }
      );
      console.log('Parsed markdown content:', {
        frontmatter: markdownContent.frontmatter,
        contentLength: markdownContent.content.length,
        rawFrontmatterLength: markdownContent.raw_frontmatter.length,
        importsLength: markdownContent.imports.length,
      });
      
      set({
        currentFile: file,
        editorContent: markdownContent.content,
        frontmatter: markdownContent.frontmatter,
        rawFrontmatter: markdownContent.raw_frontmatter,
        imports: markdownContent.imports,
        isDirty: false,
      });
      
      // Log state after setting
      const { collections } = get();
      const currentCollection = collections.find(c => c.name === file.collection);
      console.log('Current collection after opening file:', currentCollection);
      console.log('Schema available:', !!currentCollection?.schema);
      
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to open file:', error);
    }
  },

  saveFile: async () => {
    const { currentFile, editorContent, frontmatter, imports, collections } = get();
    if (!currentFile) return;

    // Validate frontmatter before saving
    const currentCollection = collections.find(c => c.name === currentFile.collection);
    const schema = currentCollection?.schema ? parseSchemaJson(currentCollection.schema) : null;
    
    if (schema) {
      const validationErrors: string[] = [];
      
      // Check all schema fields for validation errors
      schema.fields.forEach(field => {
        const value = frontmatter[field.name];
        const error = validateFieldValue(field, value);
        if (error) {
          validationErrors.push(error);
        }
      });
      
      if (validationErrors.length > 0) {
        // eslint-disable-next-line no-console
        console.error('Cannot save: Validation errors:', validationErrors);
        // TODO: Show user-friendly error dialog instead of console.error
        return;
      }
    }

    try {
      await invoke('save_markdown_content', {
        filePath: currentFile.path,
        frontmatter,
        content: editorContent,
        imports,
      });
      set({ isDirty: false });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save file:', error);
    }
  },

  setEditorContent: (content: string) => {
    set({ editorContent: content, isDirty: true });
  },

  updateFrontmatter: (frontmatter: Record<string, unknown>) => {
    set({ frontmatter, isDirty: true });
  },

  toggleSidebar: () => {
    set(state => ({ sidebarVisible: !state.sidebarVisible }));
  },

  toggleFrontmatterPanel: () => {
    set(state => ({ frontmatterPanelVisible: !state.frontmatterPanelVisible }));
  },

  setSelectedCollection: (collection: string | null) => {
    set({ selectedCollection: collection });
  },

  startFileWatcher: async () => {
    const { projectPath } = get();
    if (!projectPath) return;

    try {
      await invoke('start_watching_project', { projectPath });

      // Listen for file change events
      void listen('file-changed', (event: { payload: unknown }) => {
        // eslint-disable-next-line no-console
        console.log('File changed:', event.payload);

        // Refresh collections if a file was changed
        const { selectedCollection } = get();
        if (selectedCollection) {
          void get().loadCollections();
          // Reload files for current collection
          const collections = get().collections;
          const currentCollection = collections.find(
            c => c.name === selectedCollection
          );
          if (currentCollection) {
            void get().loadCollectionFiles(currentCollection.path);
          }
        }
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to start file watcher:', error);
    }
  },

  stopFileWatcher: async () => {
    const { projectPath } = get();
    if (!projectPath) return;

    try {
      await invoke('stop_watching_project', { projectPath });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to stop file watcher:', error);
    }
  },

  loadPersistedProject: async () => {
    try {
      const savedPath = localStorage.getItem('astro-editor-last-project');
      console.log('Persisted project path from localStorage:', savedPath);
      
      if (savedPath) {
        // Verify the project path still exists before setting it
        try {
          console.log('Verifying project path exists...');
          const collections = await invoke('scan_project', { projectPath: savedPath });
          console.log('Project scan successful, collections found:', collections);
          
          // If no error, the project path is valid, so restore it
          console.log('Setting project path:', savedPath);
          get().setProject(savedPath);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn('Saved project path no longer valid:', savedPath, error);
          // Remove invalid path from storage
          localStorage.removeItem('astro-editor-last-project');
        }
      } else {
        console.log('No persisted project path found');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load persisted project:', error);
    }
  },
}));
