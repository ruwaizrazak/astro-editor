import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mdxComponentCompletion } from './mdx-completion'
import { useMdxComponentsStore } from '../../store/mdxComponentsStore'

// Mock the store
vi.mock('../../store/mdxComponentsStore', () => ({
  useMdxComponentsStore: {
    getState: vi.fn(() => ({
      components: [],
    })),
  },
}))

describe('mdxComponentCompletion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create an autocompletion extension', () => {
    const completion = mdxComponentCompletion()
    
    // Check that it returns an Extension object
    expect(completion).toBeDefined()
    expect(typeof completion).toBe('object')
  })

  it('should work with mock components', () => {
    const mockComponents = [
      {
        name: 'Callout',
        file_path: 'src/components/mdx/Callout.astro',
        props: [
          { name: 'type', prop_type: "'warning' | 'info'", is_optional: false },
        ],
        has_slot: true,
        description: 'A callout component',
      },
    ]

    vi.mocked(useMdxComponentsStore.getState).mockReturnValue({
      components: mockComponents,
      isLoading: false,
      error: null,
      loadComponents: vi.fn(),
      clearComponents: vi.fn(),
    })

    const completion = mdxComponentCompletion()
    expect(completion).toBeDefined()
    // The getState method will be called when completion is triggered, not when the extension is created
  })

  it('should handle empty components', () => {
    vi.mocked(useMdxComponentsStore.getState).mockReturnValue({
      components: [],
      isLoading: false,
      error: null,
      loadComponents: vi.fn(),
      clearComponents: vi.fn(),
    })

    const completion = mdxComponentCompletion()
    expect(completion).toBeDefined()
  })

  it('should handle components with different prop types', () => {
    const mockComponents = [
      {
        name: 'Container',
        file_path: 'test.astro',
        props: [
          { name: 'width', prop_type: 'string', is_optional: false },
          { name: 'height', prop_type: 'number', is_optional: true },
        ],
        has_slot: true,
        description: null,
      },
    ]

    vi.mocked(useMdxComponentsStore.getState).mockReturnValue({
      components: mockComponents,
      isLoading: false,
      error: null,
      loadComponents: vi.fn(),
      clearComponents: vi.fn(),
    })

    const completion = mdxComponentCompletion()
    expect(completion).toBeDefined()
  })

  it('should handle union types in props', () => {
    const mockComponents = [
      {
        name: 'Alert',
        file_path: 'test.astro',
        props: [
          { name: 'severity', prop_type: "'error' | 'warning' | 'info'", is_optional: false },
        ],
        has_slot: false,
        description: null,
      },
    ]

    vi.mocked(useMdxComponentsStore.getState).mockReturnValue({
      components: mockComponents,
      isLoading: false,
      error: null,
      loadComponents: vi.fn(),
      clearComponents: vi.fn(),
    })

    const completion = mdxComponentCompletion()
    expect(completion).toBeDefined()
  })
})