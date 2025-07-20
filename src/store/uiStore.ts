import { create } from 'zustand'

interface UIState {
  // Layout state
  sidebarVisible: boolean
  frontmatterPanelVisible: boolean

  // Actions
  toggleSidebar: () => void
  toggleFrontmatterPanel: () => void
}

export const useUIStore = create<UIState>(set => ({
  // Initial state
  sidebarVisible: true,
  frontmatterPanelVisible: true,

  // Actions
  toggleSidebar: () => {
    set(state => ({ sidebarVisible: !state.sidebarVisible }))
  },

  toggleFrontmatterPanel: () => {
    set(state => ({ frontmatterPanelVisible: !state.frontmatterPanelVisible }))
  },
}))

// Components can use direct selectors like:
// const sidebarVisible = useUIStore(state => state.sidebarVisible)
