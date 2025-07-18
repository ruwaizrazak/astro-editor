import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useAppStore } from './index'

// Mock the queryClient
vi.mock('../lib/query-client', () => ({
  queryClient: {
    invalidateQueries: vi.fn(),
  },
}))

describe('File Operations', () => {
  beforeEach(() => {
    useAppStore.setState({
      projectPath: '/test/project',
      selectedCollection: 'posts',
      currentFile: null,
      editorContent: '',
      frontmatter: {},
      isDirty: false,
    })
    globalThis.mockTauri.reset()
    vi.clearAllMocks()
  })

  describe('Editor Content Management', () => {
    it('should update editor content and mark as dirty', () => {
      const { setEditorContent } = useAppStore.getState()

      setEditorContent('# New Content')

      const state = useAppStore.getState()
      expect(state.editorContent).toBe('# New Content')
      expect(state.isDirty).toBe(true)
    })

    it('should update frontmatter field and mark as dirty', () => {
      const { updateFrontmatterField } = useAppStore.getState()

      useAppStore.setState({
        frontmatter: { title: 'Original Title' },
      })

      updateFrontmatterField('title', 'Updated Title')

      const state = useAppStore.getState()
      expect(state.frontmatter.title).toBe('Updated Title')
      expect(state.isDirty).toBe(true)
    })

    it('should remove frontmatter field when value is empty', () => {
      const { updateFrontmatterField } = useAppStore.getState()

      useAppStore.setState({
        frontmatter: { title: 'Title', draft: true },
      })

      updateFrontmatterField('draft', '')

      const state = useAppStore.getState()
      expect(state.frontmatter.draft).toBeUndefined()
      expect(Object.keys(state.frontmatter)).toEqual(['title'])
    })
  })

  describe('Auto-save Scheduling', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should schedule auto-save after content changes', () => {
      const { setEditorContent, saveFile } = useAppStore.getState()
      const originalSaveFile = saveFile
      const saveSpy = vi.fn()

      // Mock the saveFile function
      useAppStore.setState({
        saveFile: saveSpy,
        currentFile: {
          id: 'test',
          path: '/test/file.md',
          name: 'file',
          extension: 'md',
          is_draft: false,
          collection: 'posts',
        },
      })

      setEditorContent('# Updated')

      // Auto-save should not be called immediately
      expect(saveSpy).not.toHaveBeenCalled()

      // Fast-forward 2 seconds (auto-save delay)
      vi.advanceTimersByTime(2000)

      // Now auto-save should have been triggered
      expect(saveSpy).toHaveBeenCalled()

      // Restore original saveFile
      useAppStore.setState({ saveFile: originalSaveFile })
    })

    it('should clear auto-save timeout when saving manually', async () => {
      const { setEditorContent, saveFile } = useAppStore.getState()

      useAppStore.setState({
        projectPath: '/test/project',
        editorContent: '# Initial content',
        frontmatter: {},
        imports: '',
        currentFile: {
          id: 'test',
          path: '/test/file.md',
          name: 'file',
          extension: 'md',
          is_draft: false,
          collection: 'posts',
        },
        isDirty: true,
      })

      // Start auto-save timer
      setEditorContent('# Updated')

      // Save manually before auto-save triggers
      globalThis.mockTauri.invoke.mockResolvedValue(undefined)
      await saveFile()

      // Fast-forward past auto-save delay
      vi.advanceTimersByTime(3000)

      // saveFile should only have been called once (manually)
      expect(globalThis.mockTauri.invoke).toHaveBeenCalledTimes(1)
    })
  })

  describe('File State Management', () => {
    it('should close current file and clear state', () => {
      const { closeCurrentFile } = useAppStore.getState()

      useAppStore.setState({
        currentFile: {
          id: 'test',
          path: '/test/file.md',
          name: 'file',
          extension: 'md',
          is_draft: false,
          collection: 'posts',
        },
        editorContent: '# Content',
        frontmatter: { title: 'Test' },
        isDirty: true,
      })

      closeCurrentFile()

      const state = useAppStore.getState()
      expect(state.currentFile).toBeNull()
      expect(state.editorContent).toBe('')
      expect(state.frontmatter).toEqual({})
      expect(state.isDirty).toBe(false)
    })
  })

  describe('Create New File', () => {
    it('should dispatch create-new-file event when creating new file', () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

      const { createNewFile } = useAppStore.getState()
      createNewFile()

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'create-new-file',
        })
      )
    })
  })
})
