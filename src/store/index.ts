import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface FileEntry {
  id: string;
  path: string;
  name: string;
  extension: string;
  is_draft: boolean;
  collection: string;
  last_modified?: number;
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
  editorContent: string;
  isDirty: boolean;

  // Actions
  setProject: (path: string) => void;
  loadCollections: () => Promise<void>;
  loadCollectionFiles: (collectionPath: string) => Promise<void>;
  openFile: (file: FileEntry) => Promise<void>;
  saveFile: () => Promise<void>;
  setEditorContent: (content: string) => void;
  toggleSidebar: () => void;
  toggleFrontmatterPanel: () => void;
  setSelectedCollection: (collection: string | null) => void;
  startFileWatcher: () => Promise<void>;
  stopFileWatcher: () => Promise<void>;
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
  isDirty: false,

  // Actions
  setProject: (path: string) => {
    set({ projectPath: path });
    void get().loadCollections();
    void get().startFileWatcher();
  },

  loadCollections: async () => {
    const { projectPath } = get();
    if (!projectPath) return;

    try {
      const collections = await invoke<Collection[]>('scan_project', {
        projectPath,
      });
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
    try {
      const content = await invoke<string>('read_file', {
        filePath: file.path,
      });
      set({
        currentFile: file,
        editorContent: content,
        isDirty: false,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to open file:', error);
    }
  },

  saveFile: async () => {
    const { currentFile, editorContent } = get();
    if (!currentFile) return;

    try {
      await invoke('write_file', {
        filePath: currentFile.path,
        content: editorContent,
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
}));
