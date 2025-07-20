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

// Hook to get responsive default size for frontmatter panel
const useResponsiveFrontmatterSize = () => {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  )

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Return smaller default size on wider screens
  if (windowWidth >= 1400) return 20 // Very wide screens
  if (windowWidth >= 1024) return 25 // Large screens
  return 30 // Default for smaller screens
}

// Helper component to reduce duplication in Layout
const EditorAreaWithFrontmatter: React.FC<{
  frontmatterPanelVisible: boolean
}> = ({ frontmatterPanelVisible }) => {
  const responsiveDefaultSize = useResponsiveFrontmatterSize()
  if (frontmatterPanelVisible) {
    return (
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel
          defaultSize={70}
          minSize={40}
          maxSize={80}
          className="flex flex-col min-w-96"
        >
          <MainEditor />
        </ResizablePanel>
        <ResizableHandle className="!cursor-col-resize" />
        <ResizablePanel
          defaultSize={responsiveDefaultSize}
          minSize={20}
          maxSize={60}
          className="bg-muted/10 border-l border-border overflow-hidden"
        >
          <FrontmatterPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  return (
    <div className="h-full flex flex-col min-w-96">
      <MainEditor />
    </div>
  )
}

export const Layout: React.FC = () => {
  // Editor store
  const { currentFile, isDirty, saveFile, closeCurrentFile } = useEditorStore()

  // Project store
  const { loadPersistedProject, selectedCollection } = useProjectStore()

  // UI store
  const {
    sidebarVisible,
    frontmatterPanelVisible,
    toggleSidebar,
    toggleFrontmatterPanel,
  } = useUIStore()

  // Preferences dialog state
  const [preferencesOpen, setPreferencesOpen] = useState(false)

  // Get the createNewFile function from our custom hook
  const { createNewFile: createNewFileWithQuery } = useCreateFile()

  // Centralized menu state management - this is where file state lives
  useEffect(() => {
    const shouldEnableMenu = Boolean(currentFile && window.isEditorFocused)
    void invoke('update_format_menu_state', { enabled: shouldEnableMenu })
  }, [currentFile])

  // Initialize menu as disabled and set up focus tracking
  useEffect(() => {
    window.isEditorFocused = false
    void invoke('update_format_menu_state', { enabled: false })

    // Listen for editor focus changes
    const handleEditorFocusChange = () => {
      const shouldEnableMenu = Boolean(currentFile && window.isEditorFocused)
      void invoke('update_format_menu_state', { enabled: shouldEnableMenu })
    }

    window.addEventListener('editor-focus-changed', handleEditorFocusChange)
    return () =>
      window.removeEventListener(
        'editor-focus-changed',
        handleEditorFocusChange
      )
  }, [currentFile])

  // Keyboard shortcuts using react-hotkeys-hook
  useHotkeys(
    'mod+s',
    () => {
      // Cmd+S: Save File
      if (currentFile && isDirty) {
        void saveFile()
      }
    },
    { preventDefault: true }
  )

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
        void createNewFileWithQuery()
        // Fix for cursor disappearing - ensure cursor is visible
        document.body.style.cursor = 'auto'
        // Force a reflow to ensure the cursor change is applied
        void document.body.offsetHeight
      }
    },
    { preventDefault: true }
  )

  useHotkeys(
    'mod+w',
    () => {
      // Cmd+W: Close Current File (only if a file is open)
      if (currentFile) {
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

  useHotkeys(
    'mod+/',
    () => {
      // Cmd+/: Open MDX Component Builder (only for .mdx files)
      if (currentFile?.path.endsWith('.mdx')) {
        const editorView = globalCommandRegistry.getEditorView()
        if (editorView) {
          useComponentBuilderStore.getState().open(editorView)
        }
      }
    },
    {
      preventDefault: true,
      enableOnContentEditable: true,
    }
  )

  // Listen for open preferences events from command palette
  useEffect(() => {
    const handleOpenPreferences = () => {
      setPreferencesOpen(true)
    }

    window.addEventListener('open-preferences', handleOpenPreferences)
    return () =>
      window.removeEventListener('open-preferences', handleOpenPreferences)
  }, [])

  // Listen for create new file events
  useEffect(() => {
    const handleCreateNewFile = () => {
      void createNewFileWithQuery()
    }

    window.addEventListener('create-new-file', handleCreateNewFile)
    return () =>
      window.removeEventListener('create-new-file', handleCreateNewFile)
  }, [createNewFileWithQuery])

  // Listen for focus and typewriter mode toggle events
  useEffect(() => {
    const handleToggleFocusMode = () => {
      useUIStore.getState().toggleFocusMode()
    }
    
    const handleToggleTypewriterMode = () => {
      useUIStore.getState().toggleTypewriterMode()
    }
    
    window.addEventListener('toggle-focus-mode', handleToggleFocusMode)
    window.addEventListener('toggle-typewriter-mode', handleToggleTypewriterMode)
    
    return () => {
      window.removeEventListener('toggle-focus-mode', handleToggleFocusMode)
      window.removeEventListener('toggle-typewriter-mode', handleToggleTypewriterMode)
    }
  }, [])

  // Load persisted project on app start
  useEffect(() => {
    void loadPersistedProject()
  }, [loadPersistedProject])

  // Initialize Rust toast bridge
  useEffect(() => {
    let cleanup: (() => void) | undefined

    void initializeRustToastBridge().then(unlisten => {
      cleanup = unlisten
    })

    return () => {
      cleanup?.()
    }
  }, [])

  // Menu event listeners - use empty dependency array to avoid cleanup issues
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
  }, [createNewFileWithQuery])

  return (
    <div className="h-screen w-screen bg-background font-sans flex flex-col rounded-xl overflow-hidden">
      {/* Unified titlebar */}
      <UnifiedTitleBar />

      {/* Main content area with integrated sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {sidebarVisible ? (
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            <ResizablePanel
              defaultSize={20}
              minSize={15}
              maxSize={35}
              className="min-w-[200px]"
            >
              <Sidebar />
            </ResizablePanel>
            <ResizableHandle className="!cursor-col-resize" />
            <ResizablePanel defaultSize={80} minSize={65}>
              <EditorAreaWithFrontmatter
                frontmatterPanelVisible={frontmatterPanelVisible}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="flex-1">
            <EditorAreaWithFrontmatter
              frontmatterPanelVisible={frontmatterPanelVisible}
            />
          </div>
        )}
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
