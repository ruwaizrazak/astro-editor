import React, { useEffect } from 'react'
import { useAppStore } from '../../store'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { UnifiedTitleBar } from './UnifiedTitleBar'
import { Sidebar } from './Sidebar'
import { MainEditor } from './MainEditor'
import { FrontmatterPanel } from './FrontmatterPanel'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '../ui/resizable'

export const Layout: React.FC = () => {
  const {
    sidebarVisible,
    frontmatterPanelVisible,
    currentFile,
    editorContent,
    isDirty,
    saveFile,
    setProject,
    toggleSidebar,
    toggleFrontmatterPanel,
    loadPersistedProject,
  } = useAppStore()

  // macOS keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // macOS uses metaKey (Cmd key)
      if (e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault()
            // Cmd+S: Save File
            if (currentFile && isDirty) {
              void saveFile()
            }
            break
          case '1':
            e.preventDefault()
            // Cmd+1: Toggle Sidebar
            toggleSidebar()
            break
          case '2':
            e.preventDefault()
            // Cmd+2: Toggle Frontmatter Panel
            toggleFrontmatterPanel()
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    currentFile,
    editorContent,
    isDirty,
    saveFile,
    toggleSidebar,
    toggleFrontmatterPanel,
  ])

  // Load persisted project on app start
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('=== APP INITIALIZATION ===')
    // eslint-disable-next-line no-console
    console.log('Loading persisted project...')
    void loadPersistedProject()
  }, [loadPersistedProject])

  // Menu event listeners
  useEffect(() => {
    const handleOpenProject = async () => {
      try {
        const projectPath = await invoke<string>('select_project_folder')
        if (projectPath) {
          setProject(projectPath)
        }
      } catch (error) {
        // Handle error in production apps appropriately
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

    return () => {
      void unlistenOpenProject.then(fn => fn())
      void unlistenSave.then(fn => fn())
      void unlistenToggleSidebar.then(fn => fn())
      void unlistenToggleFrontmatter.then(fn => fn())
    }
  }, [
    currentFile,
    isDirty,
    saveFile,
    setProject,
    toggleSidebar,
    toggleFrontmatterPanel,
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
              className="min-w-[200px] max-w-[400px]"
            >
              <Sidebar />
            </ResizablePanel>
            <ResizableHandle className="!cursor-col-resize" />
            <ResizablePanel defaultSize={80} minSize={65}>
              <div className="h-full">
                {frontmatterPanelVisible ? (
                  <ResizablePanelGroup
                    direction="horizontal"
                    className="h-full"
                  >
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
                      defaultSize={30}
                      minSize={20}
                      maxSize={60}
                      className="bg-muted/10 border-l border-border overflow-hidden"
                    >
                      <FrontmatterPanel />
                    </ResizablePanel>
                  </ResizablePanelGroup>
                ) : (
                  <div className="h-full flex flex-col min-w-96">
                    <MainEditor />
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="flex-1">
            {frontmatterPanelVisible ? (
              <ResizablePanelGroup direction="horizontal" className="flex-1">
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
                  defaultSize={30}
                  minSize={20}
                  maxSize={60}
                  className="bg-muted/10 border-l border-border overflow-hidden"
                >
                  <FrontmatterPanel />
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <div className="flex-1 flex flex-col min-w-96">
                <MainEditor />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
