import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'

interface PropInfo {
  name: string
  prop_type: string
  is_optional: boolean
  default_value?: string | null
}

interface MdxComponent {
  name: string
  file_path: string
  props: PropInfo[]
  has_slot: boolean
  description?: string | null
}

interface MdxComponentsState {
  components: MdxComponent[]
  isLoading: boolean
  error: string | null
  loadComponents: (projectPath: string, mdxDirectory?: string) => Promise<void>
  clearComponents: () => void
}

export const useMdxComponentsStore = create<MdxComponentsState>(set => ({
  components: [],
  isLoading: false,
  error: null,

  loadComponents: async (projectPath: string, mdxDirectory?: string) => {
    set({ isLoading: true, error: null })

    try {
      const components = await invoke<MdxComponent[]>('scan_mdx_components', {
        projectPath,
        mdxDirectory,
      })

      set({ components, isLoading: false })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load MDX components:', error)
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load MDX components',
        isLoading: false,
      })
    }
  },

  clearComponents: () => {
    set({ components: [], error: null })
  },
}))
