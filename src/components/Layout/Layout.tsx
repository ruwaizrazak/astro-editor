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
}> = React.memo(({ frontmatterPanelVisible }) => {
  // PERFORMANCE TEST: Use fixed size to eliminate useResponsiveFrontmatterSize dependency
  const responsiveDefaultSize = 25
  
  // DEBUG: Track EditorAreaWithFrontmatter renders
  const renderCountRef = React.useRef(0)
  renderCountRef.current++
  // eslint-disable-next-line no-console
  console.log(`[EditorAreaWithFrontmatter] RENDER #${renderCountRef.current}`, { 
    frontmatterPanelVisible,
    responsiveDefaultSize
  })
  
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
      {frontmatterPanelVisible && (
        <>
          <ResizableHandle className="!cursor-col-resize" />
          <ResizablePanel
            defaultSize={responsiveDefaultSize}
            minSize={20}
            maxSize={60}
            className="bg-muted/10 border-l border-border overflow-hidden"
          >
            <FrontmatterPanel />
          </ResizablePanel>
        </>
      )}
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
  
  // Keep editor store disabled for render cascade testing
  // const hasCurrentFile = useEditorStore(state => !!state.currentFile)
  // const currentFileName = useEditorStore(state => state.currentFile?.name)
  // const { saveFile, closeCurrentFile } = useEditorStore()
  
  // PROJECT STORE: All subscriptions disabled to avoid cascade
  
  // Temporary hardcoded values for remaining stores
  const hasCurrentFile = true
  const currentFileName = "test"
  const selectedCollection = "articles"

  // DEBUG: Track Layout renders and what's causing them
  const renderCountRef = React.useRef(0)
  renderCountRef.current++
  
  const prevPropsRef = React.useRef({
    hasCurrentFile,
    fileName: currentFileName,
    sidebarVisible,
    frontmatterPanelVisible,
    selectedCollection,
  })
  
  const currentProps = {
    hasCurrentFile,
    fileName: currentFileName,
    sidebarVisible,
    frontmatterPanelVisible,
    selectedCollection,
  }
  
  const changedProps = Object.keys(currentProps).filter(key => 
    prevPropsRef.current[key as keyof typeof currentProps] !== currentProps[key as keyof typeof currentProps]
  )
  
  // eslint-disable-next-line no-console
  console.log(`[Layout] RENDER #${renderCountRef.current}`, {
    ...currentProps,
    changedProps: changedProps.length > 0 ? changedProps : 'none',
  })
  
  if (changedProps.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`[Layout] CHANGED PROPS:`, changedProps)
  }
  
  prevPropsRef.current = currentProps

  // Preferences dialog state
  const [preferencesOpen, setPreferencesOpen] = useState(false)

  // PERFORMANCE FIX: Don't subscribe to useCreateFile, get it only when needed
  // Use existing event system instead

  // TEMPORARILY DISABLED: Menu state management
  // useEffect(() => {
  //   const shouldEnableMenu = Boolean(hasCurrentFile && window.isEditorFocused)
  //   void invoke('update_format_menu_state', { enabled: shouldEnableMenu })
  // }, [hasCurrentFile])

  // useEffect(() => {
  //   window.isEditorFocused = false
  //   void invoke('update_format_menu_state', { enabled: false })

  //   const handleEditorFocusChange = () => {
  //     const shouldEnableMenu = Boolean(hasCurrentFile && window.isEditorFocused)
  //     void invoke('update_format_menu_state', { enabled: shouldEnableMenu })
  //   }

  //   window.addEventListener('editor-focus-changed', handleEditorFocusChange)
  //   return () =>
  //     window.removeEventListener(
  //       'editor-focus-changed',
  //       handleEditorFocusChange
  //     )
  // }, [hasCurrentFile])

  // TEMPORARILY DISABLED: Keyboard shortcuts
  // useHotkeys(
  //   'mod+s',
  //   () => {
  //     // Cmd+S: Save File - get isDirty and currentFile directly to avoid subscription
  //     const { currentFile, isDirty } = useEditorStore.getState()
  //     if (currentFile && isDirty) {
  //       void saveFile()
  //     }
  //   },
  //   { preventDefault: true }
  // )

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

  // TEMPORARILY DISABLED: All remaining shortcuts
  // useHotkeys(
  //   'mod+n',
  //   () => {
  //     // Cmd+N: Create New File (only if a collection is selected)  
  //     if (selectedCollection) {
  //       // Use existing menu event system to avoid createNewFile dependency
  //       window.dispatchEvent(new CustomEvent('menu-new-file'))
  //       // Fix for cursor disappearing - ensure cursor is visible
  //       document.body.style.cursor = 'auto'
  //       // Force a reflow to ensure the cursor change is applied
  //       void document.body.offsetHeight
  //     }
  //   },
  //   { preventDefault: true }
  // )

  // useHotkeys(
  //   'mod+w',
  //   () => {
  //     // Cmd+W: Close Current File (only if a file is open)
  //     if (hasCurrentFile) {
  //       closeCurrentFile()
  //     }
  //   },
  //   {
  //     preventDefault: true,
  //     enableOnFormTags: ['input', 'textarea', 'select'],
  //     enableOnContentEditable: true, // Enable in contenteditable elements like CodeMirror
  //   }
  // )

  // useHotkeys(
  //   'mod+comma',
  //   () => {
  //     // Cmd+,: Open Preferences
  //     setPreferencesOpen(true)
  //   },
  //   {
  //     preventDefault: true,
  //     enableOnFormTags: ['input', 'textarea', 'select'],
  //     enableOnContentEditable: true, // Enable in contenteditable elements like CodeMirror
  //   }
  // )

  // useHotkeys(
  //   'mod+/',
  //   () => {
  //     // Cmd+/: Open MDX Component Builder (only for .mdx files)
  //     const { currentFile } = useEditorStore.getState()
  //     if (currentFile?.path.endsWith('.mdx')) {
  //       const editorView = globalCommandRegistry.getEditorView()
  //       if (editorView) {
  //         useComponentBuilderStore.getState().open(editorView)
  //       }
  //     }
  //   },
  //   {
  //     preventDefault: true,
  //     enableOnContentEditable: true,
  //   }
  // )

  // RE-ENABLE TEST: Preferences event listener
  useEffect(() => {
    const handleOpenPreferences = () => {
      setPreferencesOpen(true)
    }

    window.addEventListener('open-preferences', handleOpenPreferences)
    return () =>
      window.removeEventListener('open-preferences', handleOpenPreferences)
  }, [])

  // PERFORMANCE FIX: Removed create-new-file event listener to avoid useCreateFile dependency
  // This is now handled by the menu system via 'menu-new-file' event

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

  // TEMPORARILY DISABLED: Menu event listeners
  /* 
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
        // TEMPORARILY DISABLED: Fix render cascade by removing useCreateFile dependency
        // listen('menu-new-file', () => {
        //   const { selectedCollection } = useProjectStore.getState()
        //   if (selectedCollection) {
        //     void createNewFileWithQuery()
        //   }
        // }),
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
  }, []) // PERFORMANCE FIX: Removed createNewFileWithQuery dependency
  */

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
