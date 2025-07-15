import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAppStore } from './index'

// Mock timers for testing auto-save behavior
vi.useFakeTimers()

describe('Auto-save Business Logic', () => {
  beforeEach(() => {
    vi.clearAllTimers()
    useAppStore.setState({
      currentFile: {
        id: 'posts/test',
        path: '/test/posts/test.md',
        name: 'test',
        extension: 'md',
        is_draft: false,
        collection: 'posts',
      },
      editorContent: '# Test Content',
      frontmatter: { title: 'Test Post' },
      isDirty: false,
      autoSaveTimeoutId: null,
    })
    globalThis.mockTauri.reset()
  })

  it('should auto-save after content changes when dirty', () => {
    const mockSaveFile = vi.fn().mockImplementation(() => {
      // Simulate what the real saveFile does - set isDirty to false
      useAppStore.setState({ isDirty: false })
      return Promise.resolve()
    })

    // Override the saveFile method
    useAppStore.setState({
      saveFile: mockSaveFile,
    })

    // Simulate content change
    const { setEditorContent } = useAppStore.getState()
    setEditorContent('# Updated Content')

    // Verify content is marked as dirty
    expect(useAppStore.getState().isDirty).toBe(true)

    // Fast-forward time to trigger auto-save (2 seconds is the hardcoded interval)
    vi.advanceTimersByTime(2000)

    // Auto-save should have been called
    expect(mockSaveFile).toHaveBeenCalledTimes(1)
    expect(useAppStore.getState().isDirty).toBe(false)
  })

  it('should not auto-save when content is not dirty', () => {
    const mockSaveFile = vi.fn().mockResolvedValue(undefined)

    useAppStore.setState({
      saveFile: mockSaveFile,
      isDirty: false,
    })

    // Fast-forward time
    vi.advanceTimersByTime(2000)

    // Auto-save should not have been called
    expect(mockSaveFile).not.toHaveBeenCalled()
  })

  it('should not auto-save when no file is open', () => {
    const mockSaveFile = vi.fn().mockResolvedValue(undefined)

    useAppStore.setState({
      saveFile: mockSaveFile,
      currentFile: null,
      isDirty: true,
    })

    // Fast-forward time
    vi.advanceTimersByTime(2000)

    // Auto-save should not have been called
    expect(mockSaveFile).not.toHaveBeenCalled()
  })

  it('should debounce auto-save when content changes rapidly', () => {
    const mockSaveFile = vi.fn().mockResolvedValue(undefined)

    useAppStore.setState({
      saveFile: mockSaveFile,
    })

    const { setEditorContent } = useAppStore.getState()

    // Simulate rapid content changes
    setEditorContent('# Change 1')
    vi.advanceTimersByTime(1000) // Don't trigger auto-save yet

    setEditorContent('# Change 2')
    vi.advanceTimersByTime(1000) // Don't trigger auto-save yet

    setEditorContent('# Change 3')
    vi.advanceTimersByTime(1000) // Don't trigger auto-save yet

    // Auto-save should not have been called yet (debounced)
    expect(mockSaveFile).not.toHaveBeenCalled()

    // Fast-forward to trigger auto-save after the last change
    vi.advanceTimersByTime(2000) // Total 5 seconds, should trigger after last change

    // Auto-save should have been called only once
    expect(mockSaveFile).toHaveBeenCalledTimes(1)
  })

  it('should handle auto-save errors gracefully', () => {
    const mockSaveFile = vi.fn().mockRejectedValue(new Error('Save failed'))

    useAppStore.setState({
      saveFile: mockSaveFile,
      isDirty: true,
    })

    // Simulate content change to trigger auto-save
    const { setEditorContent } = useAppStore.getState()
    setEditorContent('# Updated Content')

    // Fast-forward time to trigger auto-save
    vi.advanceTimersByTime(2000)

    // Auto-save should have been attempted
    expect(mockSaveFile).toHaveBeenCalledTimes(1)

    // File should remain dirty after failed save
    expect(useAppStore.getState().isDirty).toBe(true)
  })
})
