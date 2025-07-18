import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAppStore } from './index'

describe('App Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
      projectPath: null,
      collections: [],
      sidebarVisible: true,
      frontmatterPanelVisible: true,
      currentFile: null,
      files: [],
      selectedCollection: null,
      editorContent: '',
      isDirty: false,
    })
    // Clear localStorage
    localStorage.clear()
    globalThis.mockTauri.reset()
  })

  it('should initialize with default state', () => {
    const state = useAppStore.getState()
    expect(state.projectPath).toBeNull()
    expect(state.collections).toEqual([])
    expect(state.sidebarVisible).toBe(true)
    expect(state.frontmatterPanelVisible).toBe(true)
    expect(state.editorContent).toBe('')
    expect(state.isDirty).toBe(false)
  })

  it('should set project path', async () => {
    const { setProject } = useAppStore.getState()
    setProject('/test/project/path')

    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0))

    const state = useAppStore.getState()
    expect(state.projectPath).toBe('/test/project/path')
  })

  it('should toggle sidebar visibility', () => {
    const { toggleSidebar } = useAppStore.getState()

    expect(useAppStore.getState().sidebarVisible).toBe(true)
    toggleSidebar()
    expect(useAppStore.getState().sidebarVisible).toBe(false)
    toggleSidebar()
    expect(useAppStore.getState().sidebarVisible).toBe(true)
  })

  it('should toggle frontmatter panel visibility', () => {
    const { toggleFrontmatterPanel } = useAppStore.getState()

    expect(useAppStore.getState().frontmatterPanelVisible).toBe(true)
    toggleFrontmatterPanel()
    expect(useAppStore.getState().frontmatterPanelVisible).toBe(false)
    toggleFrontmatterPanel()
    expect(useAppStore.getState().frontmatterPanelVisible).toBe(true)
  })

  it('should set editor content and mark as dirty', () => {
    const { setEditorContent } = useAppStore.getState()

    setEditorContent('# Test Content')

    const state = useAppStore.getState()
    expect(state.editorContent).toBe('# Test Content')
    expect(state.isDirty).toBe(true)
  })

  it('should set selected collection', () => {
    const { setSelectedCollection } = useAppStore.getState()

    setSelectedCollection('blog')
    expect(useAppStore.getState().selectedCollection).toBe('blog')

    setSelectedCollection(null)
    expect(useAppStore.getState().selectedCollection).toBeNull()
  })

  it('should persist project path to localStorage when setting project', async () => {
    const testPath = '/test/project'

    useAppStore.getState().setProject(testPath)

    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(localStorage.getItem('astro-editor-last-project')).toBe(testPath)
    expect(useAppStore.getState().projectPath).toBe(testPath)
  })

  it('should handle localStorage errors gracefully when setting project', async () => {
    const testPath = '/test/project'
    // Mock localStorage to throw an error
    const originalSetItem = localStorage.setItem.bind(localStorage)
    localStorage.setItem = vi.fn(() => {
      throw new Error('Storage quota exceeded')
    })

    // Should not throw error
    expect(() => useAppStore.getState().setProject(testPath)).not.toThrow()

    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(useAppStore.getState().projectPath).toBe(testPath)

    // Restore original function
    localStorage.setItem = originalSetItem
  })

  it('should load persisted project when valid', async () => {
    const testPath = '/test/valid/project'
    localStorage.setItem('astro-editor-last-project', testPath)

    // Mock successful project scan
    globalThis.mockTauri.invoke.mockResolvedValue([])

    await useAppStore.getState().loadPersistedProject()

    // Wait for any additional async operations (setProject is async)
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(useAppStore.getState().projectPath).toBe(testPath)
    expect(globalThis.mockTauri.invoke).toHaveBeenCalledWith('scan_project', {
      projectPath: testPath,
    })
  })

  it('should remove invalid persisted project path', async () => {
    const testPath = '/test/invalid/project'
    localStorage.setItem('astro-editor-last-project', testPath)

    // Mock failed project scan
    globalThis.mockTauri.invoke.mockRejectedValue(
      new Error('Project not found')
    )

    await useAppStore.getState().loadPersistedProject()

    expect(useAppStore.getState().projectPath).toBeNull()
    expect(localStorage.getItem('astro-editor-last-project')).toBeNull()
    expect(globalThis.mockTauri.invoke).toHaveBeenCalledWith('scan_project', {
      projectPath: testPath,
    })
  })

  it('should handle loadPersistedProject when no saved path exists', async () => {
    localStorage.removeItem('astro-editor-last-project')

    await useAppStore.getState().loadPersistedProject()

    expect(useAppStore.getState().projectPath).toBeNull()
  })
})
