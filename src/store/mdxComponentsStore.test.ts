import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMdxComponentsStore } from './mdxComponentsStore'

// Mock the Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

describe('useMdxComponentsStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    const { result } = renderHook(() => useMdxComponentsStore())
    act(() => {
      result.current.clearComponents()
    })
    vi.clearAllMocks()
  })

  it('should start with empty components', () => {
    const { result } = renderHook(() => useMdxComponentsStore())
    
    expect(result.current.components).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('should load components successfully', async () => {
    const mockComponents = [
      {
        name: 'Callout',
        file_path: 'src/components/mdx/Callout.astro',
        props: [
          { name: 'type', prop_type: "'warning' | 'info'", is_optional: false },
          { name: 'title', prop_type: 'string', is_optional: true },
        ],
        has_slot: true,
        description: null,
      },
    ]

    const { invoke } = await import('@tauri-apps/api/core')
    vi.mocked(invoke).mockResolvedValueOnce(mockComponents)

    const { result } = renderHook(() => useMdxComponentsStore())

    await act(async () => {
      await result.current.loadComponents('/test/project')
    })

    expect(result.current.components).toEqual(mockComponents)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(invoke).toHaveBeenCalledWith('scan_mdx_components', {
      projectPath: '/test/project',
      mdxDirectory: undefined,
    })
  })

  it('should handle loading errors', async () => {
    const { invoke } = await import('@tauri-apps/api/core')
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Failed to scan'))

    const { result } = renderHook(() => useMdxComponentsStore())

    await act(async () => {
      await result.current.loadComponents('/test/project')
    })

    expect(result.current.components).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe('Failed to scan')
  })

  it('should clear components', async () => {
    const mockComponents = [
      {
        name: 'TestComponent',
        file_path: 'test.astro',
        props: [],
        has_slot: false,
        description: null,
      },
    ]

    const { invoke } = await import('@tauri-apps/api/core')
    vi.mocked(invoke).mockResolvedValueOnce(mockComponents)

    const { result } = renderHook(() => useMdxComponentsStore())

    // First load some components
    await act(async () => {
      await result.current.loadComponents('/test/project')
    })

    expect(result.current.components).toHaveLength(1)

    // Then clear them
    act(() => {
      result.current.clearComponents()
    })

    expect(result.current.components).toEqual([])
    expect(result.current.error).toBe(null)
  })
})