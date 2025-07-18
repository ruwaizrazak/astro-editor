import React, { useEffect, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useAppStore } from '../../store'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { UnifiedTitleBar } from './UnifiedTitleBar'
import { Sidebar } from './Sidebar'
import { MainEditor } from './MainEditor'
import { FrontmatterPanel } from './FrontmatterPanel'
import { globalCommandRegistry } from '../../lib/editor/commands'
import { CommandPalette } from '../CommandPalette'
import { ComponentBuilderDialog } from '../ComponentBuilder'
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
  const {
    sidebarVisible,
    frontmatterPanelVisible,
    currentFile,
    isDirty,
    saveFile,
    setProject,
    toggleSidebar,
    toggleFrontmatterPanel,
    loadPersistedProject,
    selectedCollection,
    createNewFile,
    closeCurrentFile,
  } = useAppStore()

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
        void createNewFile()
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

  // Menu event listeners
  useEffect(() => {
    const handleOpenProject = async () => {
      try {
        const projectPath = await invoke<string>('select_project_folder')
        if (projectPath) {
          setProject(projectPath)
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

    const unlistenOpenProject = listen('menu-open-project', () => {
      void handleOpenProject()
    })
    const unlistenSave = listen('menu-save', () => {
      if (currentFile && isDirty) {
        void saveFile()
      }
    })
    const unlistenToggleSidebar = listen('menu-toggle-sidebar', toggleSidebar)
    const unlistenToggleFrontmatter = listen(
      'menu-toggle-frontmatter',
      toggleFrontmatterPanel
    )
    const unlistenNewFile = listen('menu-new-file', () => {
      if (selectedCollection) {
        void createNewFile()
      }
    })

    // Text formatting menu listeners
    const unlistenFormatBold = listen('menu-format-bold', () => {
      if (currentFile) {
        globalCommandRegistry.execute('toggleBold')
      }
    })
    const unlistenFormatItalic = listen('menu-format-italic', () => {
      if (currentFile) {
        globalCommandRegistry.execute('toggleItalic')
      }
    })
    const unlistenFormatLink = listen('menu-format-link', () => {
      if (currentFile) {
        globalCommandRegistry.execute('createLink')
      }
    })
    const unlistenFormatH1 = listen('menu-format-h1', () => {
      if (currentFile) {
        globalCommandRegistry.execute('formatHeading', 1)
      }
    })
    const unlistenFormatH2 = listen('menu-format-h2', () => {
      if (currentFile) {
        globalCommandRegistry.execute('formatHeading', 2)
      }
    })
    const unlistenFormatH3 = listen('menu-format-h3', () => {
      if (currentFile) {
        globalCommandRegistry.execute('formatHeading', 3)
      }
    })
    const unlistenFormatH4 = listen('menu-format-h4', () => {
      if (currentFile) {
        globalCommandRegistry.execute('formatHeading', 4)
      }
    })
    const unlistenFormatParagraph = listen('menu-format-paragraph', () => {
      if (currentFile) {
        globalCommandRegistry.execute('formatHeading', 0)
      }
    })

    return () => {
      void unlistenOpenProject.then(fn => fn())
      void unlistenSave.then(fn => fn())
      void unlistenToggleSidebar.then(fn => fn())
      void unlistenToggleFrontmatter.then(fn => fn())
      void unlistenNewFile.then(fn => fn())
      void unlistenFormatBold.then(fn => fn())
      void unlistenFormatItalic.then(fn => fn())
      void unlistenFormatLink.then(fn => fn())
      void unlistenFormatH1.then(fn => fn())
      void unlistenFormatH2.then(fn => fn())
      void unlistenFormatH3.then(fn => fn())
      void unlistenFormatH4.then(fn => fn())
      void unlistenFormatParagraph.then(fn => fn())
    }
  }, [
    currentFile,
    isDirty,
    saveFile,
    setProject,
    toggleSidebar,
    toggleFrontmatterPanel,
    selectedCollection,
    createNewFile,
  ])

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
