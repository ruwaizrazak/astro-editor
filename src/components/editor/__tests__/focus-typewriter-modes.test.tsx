import { describe, test, expect, vi, beforeEach } from 'vitest'
import { useUIStore } from '../../../store/uiStore'

// Mock Tauri
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
  emit: vi.fn(),
}))

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

describe('Focus and Typewriter Modes Integration', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUIStore.setState({
      sidebarVisible: true,
      frontmatterPanelVisible: true,
      focusModeEnabled: false,
      typewriterModeEnabled: false,
    })
  })

  describe('UI Store Integration', () => {
    test('toggles focus mode state correctly', () => {
      const { toggleFocusMode } = useUIStore.getState()
      
      // Initial state should be false
      expect(useUIStore.getState().focusModeEnabled).toBe(false)
      
      // Toggle on
      toggleFocusMode()
      expect(useUIStore.getState().focusModeEnabled).toBe(true)
      
      // Toggle off
      toggleFocusMode()
      expect(useUIStore.getState().focusModeEnabled).toBe(false)
    })
    
    test('toggles typewriter mode state correctly', () => {
      const { toggleTypewriterMode } = useUIStore.getState()
      
      // Initial state should be false
      expect(useUIStore.getState().typewriterModeEnabled).toBe(false)
      
      // Toggle on
      toggleTypewriterMode()
      expect(useUIStore.getState().typewriterModeEnabled).toBe(true)
      
      // Toggle off
      toggleTypewriterMode()
      expect(useUIStore.getState().typewriterModeEnabled).toBe(false)
    })

    test('both modes can be enabled simultaneously', () => {
      const { toggleFocusMode, toggleTypewriterMode } = useUIStore.getState()
      
      // Enable both modes
      toggleFocusMode()
      toggleTypewriterMode()
      
      const state = useUIStore.getState()
      expect(state.focusModeEnabled).toBe(true)
      expect(state.typewriterModeEnabled).toBe(true)
    })

    test('modes can be toggled independently', () => {
      const { toggleFocusMode, toggleTypewriterMode } = useUIStore.getState()
      
      // Enable focus mode only
      toggleFocusMode()
      
      let state = useUIStore.getState()
      expect(state.focusModeEnabled).toBe(true)
      expect(state.typewriterModeEnabled).toBe(false)
      
      // Enable typewriter mode (focus mode still on)
      toggleTypewriterMode()
      
      state = useUIStore.getState()
      expect(state.focusModeEnabled).toBe(true)
      expect(state.typewriterModeEnabled).toBe(true)
      
      // Disable focus mode (typewriter mode still on)
      toggleFocusMode()
      
      state = useUIStore.getState()
      expect(state.focusModeEnabled).toBe(false)
      expect(state.typewriterModeEnabled).toBe(true)
    })
  })

  describe('State Persistence', () => {
    test('maintains state across multiple operations', () => {
      const { toggleFocusMode, toggleTypewriterMode, toggleSidebar } = useUIStore.getState()
      
      // Perform multiple operations
      toggleFocusMode() // Enable focus mode
      toggleSidebar() // Toggle sidebar (unrelated)
      toggleTypewriterMode() // Enable typewriter mode
      toggleSidebar() // Toggle sidebar again
      
      // Verify writing modes are still enabled
      const state = useUIStore.getState()
      expect(state.focusModeEnabled).toBe(true)
      expect(state.typewriterModeEnabled).toBe(true)
    })
  })

  describe('Event System Integration', () => {
    test('custom events can trigger mode toggles', () => {
      // Simulate event listeners that would be in Layout component
      const handleToggleFocusMode = () => {
        useUIStore.getState().toggleFocusMode()
      }
      
      const handleToggleTypewriterMode = () => {
        useUIStore.getState().toggleTypewriterMode()
      }
      
      // Attach listeners
      window.addEventListener('toggle-focus-mode', handleToggleFocusMode)
      window.addEventListener('toggle-typewriter-mode', handleToggleTypewriterMode)
      
      // Initial state
      expect(useUIStore.getState().focusModeEnabled).toBe(false)
      expect(useUIStore.getState().typewriterModeEnabled).toBe(false)
      
      // Trigger events
      window.dispatchEvent(new CustomEvent('toggle-focus-mode'))
      expect(useUIStore.getState().focusModeEnabled).toBe(true)
      
      window.dispatchEvent(new CustomEvent('toggle-typewriter-mode'))
      expect(useUIStore.getState().typewriterModeEnabled).toBe(true)
      
      // Cleanup
      window.removeEventListener('toggle-focus-mode', handleToggleFocusMode)
      window.removeEventListener('toggle-typewriter-mode', handleToggleTypewriterMode)
    })
  })

  describe('Store Selectors', () => {
    test('individual selectors work correctly', () => {
      // Test that individual state selectors work
      const initialState = useUIStore.getState()
      
      expect(initialState.focusModeEnabled).toBe(false)
      expect(initialState.typewriterModeEnabled).toBe(false)
      
      // Toggle and test again
      useUIStore.getState().toggleFocusMode()
      
      const newState = useUIStore.getState()
      expect(newState.focusModeEnabled).toBe(true)
    })

    test('combined selectors work correctly', () => {
      // Test combined state selector
      const { focusModeEnabled, typewriterModeEnabled } = useUIStore.getState()
      
      expect(focusModeEnabled).toBe(false)
      expect(typewriterModeEnabled).toBe(false)
    })
  })

  describe('Error Handling', () => {
    test('handles rapid toggle calls gracefully', () => {
      const { toggleFocusMode, toggleTypewriterMode } = useUIStore.getState()
      
      // Rapid toggling should not cause issues
      for (let i = 0; i < 10; i++) {
        toggleFocusMode()
        toggleTypewriterMode()
      }
      
      // Final state should be consistent (even number of toggles = false)
      const state = useUIStore.getState()
      expect(state.focusModeEnabled).toBe(false)
      expect(state.typewriterModeEnabled).toBe(false)
    })

    test('store methods are always available', () => {
      const store = useUIStore.getState()
      
      // All required methods should exist
      expect(typeof store.toggleFocusMode).toBe('function')
      expect(typeof store.toggleTypewriterMode).toBe('function')
      expect(typeof store.toggleSidebar).toBe('function')
      expect(typeof store.toggleFrontmatterPanel).toBe('function')
    })
  })
})