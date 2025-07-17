import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEditorHandlers } from './useEditorHandlers'

// Mock the store
vi.mock('../../store', () => ({
  useAppStore: vi.fn(),
}))

const mockUseAppStore = vi.mocked(await import('../../store')).useAppStore

describe('useEditorHandlers', () => {
  let mockStore: {
    setEditorContent: ReturnType<typeof vi.fn>
    currentFile: { id: string; name: string } | null
    saveFile: ReturnType<typeof vi.fn>
    isDirty: boolean
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockStore = {
      setEditorContent: vi.fn(),
      currentFile: { id: 'test', name: 'test.md' },
      saveFile: vi.fn(),
      isDirty: false,
    }

    mockUseAppStore.mockReturnValue(mockStore)

    // Mock window global
    Object.defineProperty(window, 'isEditorFocused', {
      value: false,
      writable: true,
    })

    // Mock dispatchEvent
    window.dispatchEvent = vi.fn()
  })

  describe('handleChange', () => {
    it('should call setEditorContent with the new value', () => {
      const { result } = renderHook(() => useEditorHandlers())

      act(() => {
        result.current.handleChange('new content')
      })

      expect(mockStore.setEditorContent).toHaveBeenCalledWith('new content')
    })

    it('should be stable across re-renders', () => {
      const { result, rerender } = renderHook(() => useEditorHandlers())
      const firstHandler = result.current.handleChange

      rerender()

      expect(result.current.handleChange).toBe(firstHandler)
    })
  })

  describe('handleFocus', () => {
    it('should set window.isEditorFocused to true', () => {
      const { result } = renderHook(() => useEditorHandlers())

      act(() => {
        result.current.handleFocus()
      })

      expect(window.isEditorFocused).toBe(true)
    })

    it('should dispatch editor-focus-changed event', () => {
      const { result } = renderHook(() => useEditorHandlers())

      act(() => {
        result.current.handleFocus()
      })

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'editor-focus-changed',
        })
      )
    })

    it('should be stable across re-renders', () => {
      const { result, rerender } = renderHook(() => useEditorHandlers())
      const firstHandler = result.current.handleFocus

      rerender()

      expect(result.current.handleFocus).toBe(firstHandler)
    })
  })

  describe('handleBlur', () => {
    it('should set window.isEditorFocused to false', () => {
      window.isEditorFocused = true
      const { result } = renderHook(() => useEditorHandlers())

      act(() => {
        result.current.handleBlur()
      })

      expect(window.isEditorFocused).toBe(false)
    })

    it('should dispatch editor-focus-changed event', () => {
      const { result } = renderHook(() => useEditorHandlers())

      act(() => {
        result.current.handleBlur()
      })

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'editor-focus-changed',
        })
      )
    })

    it('should save file when current file exists and is dirty', () => {
      mockStore.isDirty = true
      const { result } = renderHook(() => useEditorHandlers())

      act(() => {
        result.current.handleBlur()
      })

      expect(mockStore.saveFile).toHaveBeenCalledTimes(1)
    })

    it('should not save file when no current file', () => {
      mockStore.currentFile = null
      mockStore.isDirty = true
      const { result } = renderHook(() => useEditorHandlers())

      act(() => {
        result.current.handleBlur()
      })

      expect(mockStore.saveFile).not.toHaveBeenCalled()
    })

    it('should not save file when not dirty', () => {
      mockStore.isDirty = false
      const { result } = renderHook(() => useEditorHandlers())

      act(() => {
        result.current.handleBlur()
      })

      expect(mockStore.saveFile).not.toHaveBeenCalled()
    })

    it('should update dependencies when currentFile changes', () => {
      const { result, rerender } = renderHook(() => useEditorHandlers())
      const firstHandler = result.current.handleBlur

      // Change currentFile
      mockStore.currentFile = { id: 'new', name: 'new.md' }
      mockUseAppStore.mockReturnValue(mockStore)

      rerender()

      expect(result.current.handleBlur).not.toBe(firstHandler)
    })

    it('should update dependencies when isDirty changes', () => {
      const { result, rerender } = renderHook(() => useEditorHandlers())
      const firstHandler = result.current.handleBlur

      // Change isDirty
      mockStore.isDirty = true
      mockUseAppStore.mockReturnValue(mockStore)

      rerender()

      expect(result.current.handleBlur).not.toBe(firstHandler)
    })

    it('should update dependencies when saveFile changes', () => {
      const { result, rerender } = renderHook(() => useEditorHandlers())
      const firstHandler = result.current.handleBlur

      // Change saveFile
      mockStore.saveFile = vi.fn()
      mockUseAppStore.mockReturnValue(mockStore)

      rerender()

      expect(result.current.handleBlur).not.toBe(firstHandler)
    })
  })

  describe('handleSave', () => {
    it('should save file when current file exists and is dirty', () => {
      mockStore.isDirty = true
      const { result } = renderHook(() => useEditorHandlers())

      act(() => {
        result.current.handleSave()
      })

      expect(mockStore.saveFile).toHaveBeenCalledTimes(1)
    })

    it('should not save file when no current file', () => {
      mockStore.currentFile = null
      mockStore.isDirty = true
      const { result } = renderHook(() => useEditorHandlers())

      act(() => {
        result.current.handleSave()
      })

      expect(mockStore.saveFile).not.toHaveBeenCalled()
    })

    it('should not save file when not dirty', () => {
      mockStore.isDirty = false
      const { result } = renderHook(() => useEditorHandlers())

      act(() => {
        result.current.handleSave()
      })

      expect(mockStore.saveFile).not.toHaveBeenCalled()
    })

    it('should update dependencies when currentFile changes', () => {
      const { result, rerender } = renderHook(() => useEditorHandlers())
      const firstHandler = result.current.handleSave

      // Change currentFile
      mockStore.currentFile = { id: 'new', name: 'new.md' }
      mockUseAppStore.mockReturnValue(mockStore)

      rerender()

      expect(result.current.handleSave).not.toBe(firstHandler)
    })

    it('should update dependencies when isDirty changes', () => {
      const { result, rerender } = renderHook(() => useEditorHandlers())
      const firstHandler = result.current.handleSave

      // Change isDirty
      mockStore.isDirty = true
      mockUseAppStore.mockReturnValue(mockStore)

      rerender()

      expect(result.current.handleSave).not.toBe(firstHandler)
    })

    it('should update dependencies when saveFile changes', () => {
      const { result, rerender } = renderHook(() => useEditorHandlers())
      const firstHandler = result.current.handleSave

      // Change saveFile
      mockStore.saveFile = vi.fn()
      mockUseAppStore.mockReturnValue(mockStore)

      rerender()

      expect(result.current.handleSave).not.toBe(firstHandler)
    })
  })

  describe('return value', () => {
    it('should return all handler functions', () => {
      const { result } = renderHook(() => useEditorHandlers())

      expect(result.current).toHaveProperty('handleChange')
      expect(result.current).toHaveProperty('handleFocus')
      expect(result.current).toHaveProperty('handleBlur')
      expect(result.current).toHaveProperty('handleSave')

      expect(typeof result.current.handleChange).toBe('function')
      expect(typeof result.current.handleFocus).toBe('function')
      expect(typeof result.current.handleBlur).toBe('function')
      expect(typeof result.current.handleSave).toBe('function')
    })
  })
})
