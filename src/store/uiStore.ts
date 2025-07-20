import { create } from 'zustand'

interface UIState {
  // Layout state
  sidebarVisible: boolean
  frontmatterPanelVisible: boolean
  focusModeEnabled: boolean
  typewriterModeEnabled: boolean

  // Actions
  toggleSidebar: () => void
  toggleFrontmatterPanel: () => void
  toggleFocusMode: () => void
  toggleTypewriterMode: () => void
}

export const useUIStore = create<UIState>(set => ({
  // Initial state
  sidebarVisible: true,
  frontmatterPanelVisible: true,
  focusModeEnabled: false,
  typewriterModeEnabled: false,

  // Actions
  toggleSidebar: () => {
    set(state => ({ sidebarVisible: !state.sidebarVisible }))
  },

  toggleFrontmatterPanel: () => {
    set(state => ({ frontmatterPanelVisible: !state.frontmatterPanelVisible }))
  },

  toggleFocusMode: () => {
    set(state => {
      const newState = !state.focusModeEnabled
      // eslint-disable-next-line no-console
      console.log('[UIStore] toggleFocusMode called')
      // eslint-disable-next-line no-console
      console.log('[UIStore] Current state:', state.focusModeEnabled)
      // eslint-disable-next-line no-console
      console.log('[UIStore] New state:', newState)
      return { focusModeEnabled: newState }
    })
  },

  toggleTypewriterMode: () => {
    set(state => ({ typewriterModeEnabled: !state.typewriterModeEnabled }))
  },
}))

// Components can use direct selectors like:
// const sidebarVisible = useUIStore(state => state.sidebarVisible)
