import { create } from 'zustand'

interface UIState {
  // Layout state
  sidebarVisible: boolean
  frontmatterPanelVisible: boolean

  // Actions
  toggleSidebar: () => void
  toggleFrontmatterPanel: () => void
}

export const useUIStore = create<UIState>((set) => ({
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

// Export specific selectors for performance optimization
export const useUISelectors = {
  sidebarVisible: () => useUIStore(state => state.sidebarVisible),
  frontmatterPanelVisible: () => useUIStore(state => state.frontmatterPanelVisible),
}