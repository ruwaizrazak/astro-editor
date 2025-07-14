import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './index';

describe('Store Async Operations', () => {
  beforeEach(() => {
    useAppStore.setState({
      projectPath: null,
      collections: [],
      files: [],
      currentFile: null,
      editorContent: '',
      isDirty: false,
    });
    globalThis.mockTauri.reset();
  });

  describe('loadCollections', () => {
    it('should load collections successfully', async () => {
      const mockCollections = [
        { name: 'posts', path: '/project/posts', schema: null },
        { name: 'blog', path: '/project/blog', schema: null },
      ];

      globalThis.mockTauri.invoke.mockResolvedValue(mockCollections);
      useAppStore.setState({ projectPath: '/test/project' });

      const { loadCollections } = useAppStore.getState();
      await loadCollections();

      expect(globalThis.mockTauri.invoke).toHaveBeenCalledWith('scan_project', {
        projectPath: '/test/project',
      });
      expect(useAppStore.getState().collections).toEqual(mockCollections);
    });

    it('should handle loadCollections error gracefully', async () => {
      globalThis.mockTauri.invoke.mockRejectedValue(
        new Error('Project not found')
      );
      useAppStore.setState({ projectPath: '/invalid/project' });

      const { loadCollections } = useAppStore.getState();
      await loadCollections();

      // Should not throw and collections should remain empty
      expect(useAppStore.getState().collections).toEqual([]);
    });

    it('should not load collections when no project path is set', async () => {
      const { loadCollections } = useAppStore.getState();
      await loadCollections();

      expect(globalThis.mockTauri.invoke).not.toHaveBeenCalled();
    });
  });

  describe('openFile', () => {
    it('should open file and update editor state', async () => {
      const mockFile = {
        id: 'posts/hello',
        path: '/project/posts/hello.md',
        name: 'hello',
        extension: 'md',
        is_draft: false,
        collection: 'posts',
      };
      const mockMarkdownContent = {
        frontmatter: { title: 'Hello World', draft: false },
        content: '# Hello World\n\nThis is a test post.',
        raw_frontmatter: 'title: Hello World\ndraft: false',
      };

      globalThis.mockTauri.invoke.mockResolvedValue(mockMarkdownContent);

      const { openFile } = useAppStore.getState();
      await openFile(mockFile);

      expect(globalThis.mockTauri.invoke).toHaveBeenCalledWith('parse_markdown_content', {
        filePath: '/project/posts/hello.md',
      });

      const state = useAppStore.getState();
      expect(state.currentFile).toEqual(mockFile);
      expect(state.editorContent).toBe(mockMarkdownContent.content);
      expect(state.frontmatter).toEqual(mockMarkdownContent.frontmatter);
      expect(state.rawFrontmatter).toBe(mockMarkdownContent.raw_frontmatter);
      expect(state.isDirty).toBe(false);
    });

    it('should handle file read error gracefully', async () => {
      const mockFile = {
        id: 'posts/missing',
        path: '/project/posts/missing.md',
        name: 'missing',
        extension: 'md',
        is_draft: false,
        collection: 'posts',
      };

      globalThis.mockTauri.invoke.mockRejectedValue(
        new Error('File not found')
      );

      const { openFile } = useAppStore.getState();
      await openFile(mockFile);

      // Should not update currentFile or content on error
      expect(useAppStore.getState().currentFile).toBeNull();
      expect(useAppStore.getState().editorContent).toBe('');
    });
  });

  describe('saveFile', () => {
    it('should save file and clear dirty state', async () => {
      const mockFile = {
        id: 'posts/test',
        path: '/project/posts/test.md',
        name: 'test',
        extension: 'md',
        is_draft: false,
        collection: 'posts',
      };

      const mockFrontmatter = { title: 'Test Post', draft: false };

      useAppStore.setState({
        currentFile: mockFile,
        editorContent: '# Updated Content',
        frontmatter: mockFrontmatter,
        isDirty: true,
      });

      globalThis.mockTauri.invoke.mockResolvedValue(undefined);

      const { saveFile } = useAppStore.getState();
      await saveFile();

      expect(globalThis.mockTauri.invoke).toHaveBeenCalledWith('save_markdown_content', {
        filePath: '/project/posts/test.md',
        frontmatter: mockFrontmatter,
        content: '# Updated Content',
      });
      expect(useAppStore.getState().isDirty).toBe(false);
    });

    it('should handle save error gracefully', async () => {
      const mockFile = {
        id: 'posts/test',
        path: '/project/posts/readonly.md',
        name: 'readonly',
        extension: 'md',
        is_draft: false,
        collection: 'posts',
      };

      useAppStore.setState({
        currentFile: mockFile,
        editorContent: '# Updated Content',
        isDirty: true,
      });

      globalThis.mockTauri.invoke.mockRejectedValue(
        new Error('Permission denied')
      );

      const { saveFile } = useAppStore.getState();
      await saveFile();

      // Should remain dirty on error
      expect(useAppStore.getState().isDirty).toBe(true);
    });

    it('should not save when no current file', async () => {
      useAppStore.setState({
        currentFile: null,
        editorContent: '# Content',
        isDirty: true,
      });

      const { saveFile } = useAppStore.getState();
      await saveFile();

      expect(globalThis.mockTauri.invoke).not.toHaveBeenCalled();
    });
  });

  describe('loadCollectionFiles', () => {
    it('should load files for collection', async () => {
      const mockFiles = [
        {
          id: 'posts/hello',
          path: '/project/posts/hello.md',
          name: 'hello',
          extension: 'md',
          is_draft: false,
          collection: 'posts',
        },
        {
          id: 'posts/world',
          path: '/project/posts/world.md',
          name: 'world',
          extension: 'md',
          is_draft: true,
          collection: 'posts',
        },
      ];

      globalThis.mockTauri.invoke.mockResolvedValue(mockFiles);

      const { loadCollectionFiles } = useAppStore.getState();
      await loadCollectionFiles('/project/posts');

      expect(globalThis.mockTauri.invoke).toHaveBeenCalledWith(
        'scan_collection_files',
        {
          collectionPath: '/project/posts',
        }
      );
      expect(useAppStore.getState().files).toEqual(mockFiles);
    });

    it('should handle collection scan error gracefully', async () => {
      globalThis.mockTauri.invoke.mockRejectedValue(
        new Error('Directory not found')
      );

      const { loadCollectionFiles } = useAppStore.getState();
      await loadCollectionFiles('/invalid/path');

      expect(useAppStore.getState().files).toEqual([]);
    });
  });
});
