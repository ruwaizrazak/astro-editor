import React, { useEffect, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useEditorStore } from '../../store/editorStore'
import { useProjectStore } from '../../store/projectStore'
import { useUIStore } from '../../store/uiStore'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { UnifiedTitleBar } from './UnifiedTitleBar'
import { Sidebar } from '../sidebar'
import { MainEditor } from './MainEditor'
import { FrontmatterPanel } from '../frontmatter'
import { globalCommandRegistry } from '../../lib/editor/commands'
import { CommandPalette } from '../command-palette'
import { ComponentBuilderDialog } from '../component-builder'
import { Toaster } from '../ui/sonner'
import { toast } from '../../lib/toast'
import { initializeRustToastBridge } from '../../lib/rust-toast-bridge'
import { PreferencesDialog } from '../preferences'
import { useComponentBuilderStore } from '../../store/componentBuilderStore'
import { useCreateFile } from '../../hooks/useCreateFile'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '../ui/resizable'

// Helper component to reduce duplication in Layout
const EditorAreaWithFrontmatter: React.FC<{
  frontmatterPanelVisible: boolean
}> = React.memo(({ frontmatterPanelVisible }) => {
  // PERFORMANCE TEST: Use fixed size to eliminate useResponsiveFrontmatterSize dependency
  const responsiveDefaultSize = 25

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel
        defaultSize={frontmatterPanelVisible ? 70 : 100}
        minSize={40}
        maxSize={frontmatterPanelVisible ? 80 : 100}
        className="flex flex-col min-w-96"
      >
        <MainEditor />
      </ResizablePanel>
      {/* ALWAYS render handle and panel - control visibility with CSS */}
      <ResizableHandle
        className={`!cursor-col-resize ${frontmatterPanelVisible ? '' : 'hidden'}`}
      />
      <ResizablePanel
        defaultSize={frontmatterPanelVisible ? responsiveDefaultSize : 0}
        minSize={frontmatterPanelVisible ? 20 : 0}
        maxSize={frontmatterPanelVisible ? 60 : 0}
        className={`bg-muted/10 border-l border-border overflow-hidden ${frontmatterPanelVisible ? '' : 'hidden'}`}
      >
        <FrontmatterPanel />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
})

export const Layout: React.FC = () => {
  // RE-ENABLE TEST: Start with UI store only (most critical for functionality)
  const {
    sidebarVisible,
    frontmatterPanelVisible,
    toggleSidebar,
    toggleFrontmatterPanel,
  } = useUIStore()

  // RESTORED: Editor store subscriptions (using proven patterns to avoid cascade)
  const hasCurrentFile = useEditorStore(state => !!state.currentFile)
  const { saveFile, closeCurrentFile } = useEditorStore()

  // PROJECT STORE: Restore subscriptions
  const selectedCollection = useProjectStore(state => state.selectedCollection)

  // Preferences dialog state
  const [preferencesOpen, setPreferencesOpen] = useState(false)

  // RESTORED: Get useCreateFile back for functionality 
  // We need to be careful not to cause render cascade
  const { createNewFile: createNewFileWithQuery } = useCreateFile()

  // RESTORED: Menu state management
  useEffect(() => {
    const shouldEnableMenu = Boolean(hasCurrentFile && window.isEditorFocused)
    void invoke('update_format_menu_state', { enabled: shouldEnableMenu })
  }, [hasCurrentFile])

  useEffect(() => {
    window.isEditorFocused = false
    void invoke('update_format_menu_state', { enabled: false })

    const handleEditorFocusChange = () => {
      const shouldEnableMenu = Boolean(hasCurrentFile && window.isEditorFocused)
      void invoke('update_format_menu_state', { enabled: shouldEnableMenu })
    }

    window.addEventListener('editor-focus-changed', handleEditorFocusChange)
    return () =>
      window.removeEventListener(
        'editor-focus-changed',
        handleEditorFocusChange
      )
  }, [hasCurrentFile])

  // RESTORED: Save keyboard shortcut
  useHotkeys(
    'mod+s',
    () => {
      // Cmd+S: Save File - get isDirty directly to avoid subscription
      const { currentFile, isDirty } = useEditorStore.getState()
      if (currentFile && isDirty) {
        void saveFile()
      }
    },
    { preventDefault: true }
  )

  // RE-ENABLE TEST: Basic sidebar shortcuts
  useHotkeys(
    'mod+1',
    () => {
      // Cmd+1: Toggle Sidebar
      toggleSidebar()
    },
    { preventDefault: true }
  )

  useHotkeys(
    'mod+2',
    () => {
      // Cmd+2: Toggle Frontmatter Panel
      toggleFrontmatterPanel()
    },
    { preventDefault: true }
  )

  useHotkeys(
    'mod+n',
    () => {
      // Cmd+N: Create New File (only if a collection is selected)
      if (selectedCollection) {
        // Use DOM event system to trigger the existing listener
        window.dispatchEvent(new CustomEvent('create-new-file'))
        // Fix for cursor disappearing - ensure cursor is visible
        document.body.style.cursor = 'auto'
        // Force a reflow to ensure the cursor change is applied
        void document.body.offsetHeight
      }
    },
    {
      preventDefault: true,
      enableOnFormTags: true,
      enableOnContentEditable: true,
      scopes: ['all'],
    }
  )

  useHotkeys(
    'mod+w',
    () => {
      // Cmd+W: Close Current File (only if a file is open)
      if (hasCurrentFile) {
        closeCurrentFile()
      }
    },
    {
      preventDefault: true,
      enableOnFormTags: ['input', 'textarea', 'select'],
      enableOnContentEditable: true, // Enable in contenteditable elements like CodeMirror
    }
  )

  useHotkeys(
    'mod+comma',
    () => {
      // Cmd+,: Open Preferences
      setPreferencesOpen(true)
    },
    {
      preventDefault: true,
      enableOnFormTags: ['input', 'textarea', 'select'],
      enableOnContentEditable: true, // Enable in contenteditable elements like CodeMirror
    }
  )

  // NOTE: Cmd+/ (component builder) is handled by CodeMirror keymap, not here
  // This ensures it only works when the editor is focused and can distinguish between .md and .mdx files

  // RE-ENABLE TEST: Preferences event listener
  useEffect(() => {
    const handleOpenPreferences = () => {
      setPreferencesOpen(true)
    }

    window.addEventListener('open-preferences', handleOpenPreferences)
    return () =>
      window.removeEventListener('open-preferences', handleOpenPreferences)
  }, [])

  // RESTORED: Event listener for command palette 'create-new-file' events
  useEffect(() => {
    const handleCreateNewFile = () => {
      void createNewFileWithQuery()
    }

    window.addEventListener('create-new-file', handleCreateNewFile)
    return () =>
      window.removeEventListener('create-new-file', handleCreateNewFile)
  }, [createNewFileWithQuery])

  // TEMPORARILY DISABLED: More event listeners and project loading
  // useEffect(() => {
  //   const handleToggleFocusMode = () => {
  //     useUIStore.getState().toggleFocusMode()
  //   }

  //   const handleToggleTypewriterMode = () => {
  //     useUIStore.getState().toggleTypewriterMode()
  //   }

  //   window.addEventListener('toggle-focus-mode', handleToggleFocusMode)
  //   window.addEventListener(
  //     'toggle-typewriter-mode',
  //     handleToggleTypewriterMode
  //   )

  //   return () => {
  //     window.removeEventListener('toggle-focus-mode', handleToggleFocusMode)
  //     window.removeEventListener(
  //       'toggle-typewriter-mode',
  //       handleToggleTypewriterMode
  //     )
  //   }
  // }, [])

  // MINIMAL PROJECT INITIALIZATION: Enable project loading for basic functionality
  // Remove loadPersistedProject dependency to avoid cascade - call once on mount
  useEffect(() => {
    void useProjectStore.getState().loadPersistedProject()
  }, [])

  // RE-ENABLE TEST: Rust toast bridge
  useEffect(() => {
    let cleanup: (() => void) | undefined

    void initializeRustToastBridge().then(unlisten => {
      cleanup = unlisten
    })

    return () => {
      cleanup?.()
    }
  }, [])

  // RESTORED: Menu event listeners
  useEffect(() => {
    const handleOpenProject = async () => {
      try {
        const projectPath = await invoke<string>('select_project_folder')
        if (projectPath) {
          useProjectStore.getState().setProject(projectPath)
          toast.success('Project opened successfully')
        }
      } catch (error) {
        toast.error('Failed to open project', {
          description:
            error instanceof Error ? error.message : 'Unknown error occurred',
        })
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Failed to open project:', error)
        }
      }
    }

    // Store all unlisten functions for cleanup
    const unlistenFunctions: Array<() => void> = []

    // Set up all listeners asynchronously
    const setupListeners = async () => {
      const unlisteners = await Promise.all([
        listen('menu-open-project', () => {
          void handleOpenProject()
        }),
        listen('menu-save', () => {
          const { currentFile, isDirty, saveFile } = useEditorStore.getState()
          if (currentFile && isDirty) {
            void saveFile()
          }
        }),
        listen('menu-toggle-sidebar', () => {
          useUIStore.getState().toggleSidebar()
        }),
        listen('menu-toggle-frontmatter', () => {
          useUIStore.getState().toggleFrontmatterPanel()
        }),
        // RESTORED: Native menu new file listener
        listen('menu-new-file', () => {
          const { selectedCollection } = useProjectStore.getState()
          if (selectedCollection) {
            void createNewFileWithQuery()
          }
        }),
        // Text formatting menu listeners
        listen('menu-format-bold', () => {
          const { currentFile } = useEditorStore.getState()
          if (currentFile) {
            globalCommandRegistry.execute('toggleBold')
          }
        }),
        listen('menu-format-italic', () => {
          const { currentFile } = useEditorStore.getState()
          if (currentFile) {
            globalCommandRegistry.execute('toggleItalic')
          }
        }),
        listen('menu-format-link', () => {
          const { currentFile } = useEditorStore.getState()
          if (currentFile) {
            globalCommandRegistry.execute('createLink')
          }
        }),
        listen('menu-format-h1', () => {
          const { currentFile } = useEditorStore.getState()
          if (currentFile) {
            globalCommandRegistry.execute('formatHeading', 1)
          }
        }),
        listen('menu-format-h2', () => {
          const { currentFile } = useEditorStore.getState()
          if (currentFile) {
            globalCommandRegistry.execute('formatHeading', 2)
          }
        }),
        listen('menu-format-h3', () => {
          const { currentFile } = useEditorStore.getState()
          if (currentFile) {
            globalCommandRegistry.execute('formatHeading', 3)
          }
        }),
        listen('menu-format-h4', () => {
          const { currentFile } = useEditorStore.getState()
          if (currentFile) {
            globalCommandRegistry.execute('formatHeading', 4)
          }
        }),
        listen('menu-format-paragraph', () => {
          const { currentFile } = useEditorStore.getState()
          if (currentFile) {
            globalCommandRegistry.execute('formatHeading', 0)
          }
        }),
      ])

      // Add all unlisteners to the array
      unlistenFunctions.push(...unlisteners)
    }

    // Set up listeners
    void setupListeners()

    return () => {
      // Call all unlisten functions
      unlistenFunctions.forEach(unlisten => {
        if (unlisten && typeof unlisten === 'function') {
          unlisten()
        }
      })
    }
  }, [createNewFileWithQuery]) // RESTORED: Include createNewFileWithQuery for menu listeners

  return (
    <div className="h-screen w-screen bg-[var(--editor-color-background)] font-sans flex flex-col rounded-xl overflow-hidden">
      {/* Unified titlebar */}
      <UnifiedTitleBar />

      {/* Main content area with integrated sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {sidebarVisible && (
            <>
              <ResizablePanel
                defaultSize={20}
                minSize={15}
                maxSize={35}
                className="min-w-[200px]"
              >
                <Sidebar />
              </ResizablePanel>
              <ResizableHandle className="!cursor-col-resize" />
            </>
          )}
          <ResizablePanel defaultSize={sidebarVisible ? 80 : 100} minSize={65}>
            <EditorAreaWithFrontmatter
              frontmatterPanelVisible={frontmatterPanelVisible}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Command Palette */}
      <CommandPalette />

      {/* MDX Component Builder */}
      <ComponentBuilderDialog />

      {/* Preferences Dialog */}
      <PreferencesDialog
        open={preferencesOpen}
        onOpenChange={setPreferencesOpen}
      />

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}
