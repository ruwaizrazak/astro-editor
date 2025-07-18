import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAppStore } from './index'
import { queryClient } from '../lib/query-client'

// Mock the queryClient
vi.mock('../lib/query-client', () => ({
  queryClient: {
    invalidateQueries: vi.fn(),
  },
}))

describe('Store Async Operations', () => {
  beforeEach(() => {
    useAppStore.setState({
      projectPath: null,
      currentFile: null,
      editorContent: '',
      frontmatter: {},
      imports: '',
      isDirty: false,
    })
    globalThis.mockTauri.reset()
    vi.clearAllMocks()
  })

  describe('setProject', () => {
    it('should set project path and start file watcher', async () => {
      const { setProject } = useAppStore.getState()

      // Mock successful project setup
      globalThis.mockTauri.invoke.mockResolvedValue('project-id-123')

      setProject('/test/project')

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(useAppStore.getState().projectPath).toBe('/test/project')
      expect(globalThis.mockTauri.invoke).toHaveBeenCalledWith(
        'start_watching_project_with_content_dir',
        {
          projectPath: '/test/project',
          contentDirectory: 'src/content/',
        }
      )
    })

    it('should handle project setup error gracefully', async () => {
      const { setProject } = useAppStore.getState()

      globalThis.mockTauri.invoke.mockRejectedValue(
        new Error('Failed to start file watcher')
      )

      setProject('/test/project')

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0))

      // Project path should still be set even if file watcher fails
      expect(useAppStore.getState().projectPath).toBe('/test/project')
    })
  })

  describe('openFile', () => {
    it('should open file and update editor state', async () => {
      const mockFile = {
        id: 'posts/hello',
        path: '/project/posts/hello.md',
        name: 'hello',
        extension: 'md',
        is_draft: false,
        collection: 'posts',
      }
      const mockMarkdownContent = {
        frontmatter: { title: 'Hello World', draft: false },
        content: '# Hello World\n\nThis is a test post.',
        raw_frontmatter: 'title: Hello World\ndraft: false',
        imports: '',
      }

      globalThis.mockTauri.invoke.mockResolvedValue(mockMarkdownContent)

      const { openFile } = useAppStore.getState()
      await openFile(mockFile)

      expect(globalThis.mockTauri.invoke).toHaveBeenCalledWith(
        'parse_markdown_content',
        {
          filePath: '/project/posts/hello.md',
        }
      )

      const state = useAppStore.getState()
      expect(state.currentFile).toEqual(mockFile)
      expect(state.editorContent).toBe(mockMarkdownContent.content)
      expect(state.frontmatter).toEqual(mockMarkdownContent.frontmatter)
      expect(state.rawFrontmatter).toBe(mockMarkdownContent.raw_frontmatter)
      expect(state.imports).toBe(mockMarkdownContent.imports)
      expect(state.isDirty).toBe(false)
    })

    it('should handle file read error gracefully', async () => {
      const mockFile = {
        id: 'posts/missing',
        path: '/project/posts/missing.md',
        name: 'missing',
        extension: 'md',
        is_draft: false,
        collection: 'posts',
      }

      globalThis.mockTauri.invoke.mockRejectedValue(new Error('File not found'))

      const { openFile } = useAppStore.getState()
      await openFile(mockFile)

      // Should not update currentFile or content on error
      expect(useAppStore.getState().currentFile).toBeNull()
      expect(useAppStore.getState().editorContent).toBe('')
    })
  })

  describe('saveFile', () => {
    it('should save file and clear dirty state', async () => {
      const mockFile = {
        id: 'posts/test',
        path: '/project/posts/test.md',
        name: 'test',
        extension: 'md',
        is_draft: false,
        collection: 'posts',
      }

      const mockFrontmatter = { title: 'Test Post', draft: false }

      useAppStore.setState({
        projectPath: '/test/project',
        currentFile: mockFile,
        editorContent: '# Updated Content',
        frontmatter: mockFrontmatter,
        imports: '',
        isDirty: true,
      })

      globalThis.mockTauri.invoke.mockResolvedValue(undefined)

      const { saveFile } = useAppStore.getState()
      await saveFile()

      expect(globalThis.mockTauri.invoke).toHaveBeenCalledWith(
        'save_markdown_content',
        {
          filePath: '/project/posts/test.md',
          frontmatter: mockFrontmatter,
          content: '# Updated Content',
          imports: '',
          schemaFieldOrder: null,
        }
      )
      expect(useAppStore.getState().isDirty).toBe(false)

      // Should invalidate queries for UI updates
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['project', '/test/project', 'collections', 'posts', 'files'],
      })
    })

    it('should handle save error gracefully', async () => {
      const mockFile = {
        id: 'posts/test',
        path: '/project/posts/readonly.md',
        name: 'readonly',
        extension: 'md',
        is_draft: false,
        collection: 'posts',
      }

      useAppStore.setState({
        currentFile: mockFile,
        editorContent: '# Updated Content',
        frontmatter: {},
        imports: '',
        isDirty: true,
      })

      globalThis.mockTauri.invoke.mockRejectedValue(
        new Error('Permission denied')
      )

      const { saveFile } = useAppStore.getState()
      await saveFile()

      // Should remain dirty on error
      expect(useAppStore.getState().isDirty).toBe(true)
    })

    it('should not save when no current file', async () => {
      useAppStore.setState({
        currentFile: null,
        editorContent: '# Content',
        frontmatter: {},
        imports: '',
        isDirty: true,
      })

      const { saveFile } = useAppStore.getState()
      await saveFile()

      expect(globalThis.mockTauri.invoke).not.toHaveBeenCalled()
    })
  })

  describe('createNewFile', () => {
    it('should dispatch create-new-file event', () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')

      const { createNewFile } = useAppStore.getState()
      createNewFile()

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'create-new-file',
        })
      )
    })
  })

  describe('updateCurrentFilePath', () => {
    it('should update current file path after rename', () => {
      const mockFile = {
        id: 'posts/old-name',
        path: '/project/posts/old-name.md',
        name: 'old-name',
        extension: 'md',
        is_draft: false,
        collection: 'posts',
      }

      useAppStore.setState({
        currentFile: mockFile,
      })

      const { updateCurrentFilePath } = useAppStore.getState()
      updateCurrentFilePath('/project/posts/new-name.md')

      const state = useAppStore.getState()
      expect(state.currentFile?.path).toBe('/project/posts/new-name.md')
      expect(state.currentFile?.name).toBe('new-name')
    })
  })
})
