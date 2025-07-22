import React from 'react'
import { useUIStore } from '../../store/uiStore'
import { UnifiedTitleBar } from './UnifiedTitleBar'
import { LeftSidebar } from './LeftSidebar'
import { MainEditor } from './MainEditor'
import { RightSidebar } from './RightSidebar'
import { StatusBar } from './StatusBar'
import { FrontmatterPanel } from '../frontmatter'
import { CommandPalette } from '../command-palette'
import { ComponentBuilderDialog } from '../component-builder'
import { Toaster } from '../ui/sonner'
import { PreferencesDialog } from '../preferences'
import { useLayoutEventListeners } from '../../hooks/useLayoutEventListeners'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '../ui/resizable'


export const Layout: React.FC = () => {
  const {
    sidebarVisible,
    frontmatterPanelVisible,
  } = useUIStore()

  // Extract all event listeners to custom hook
  const { preferencesOpen, setPreferencesOpen } = useLayoutEventListeners()


  return (
    <div className="h-screen w-screen bg-[var(--editor-color-background)] font-sans flex flex-col rounded-xl overflow-hidden">
      {/* Unified titlebar */}
      <UnifiedTitleBar />

      {/* Main content area with three-panel layout */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Left Sidebar */}
            <ResizablePanel
              defaultSize={sidebarVisible ? 20 : 0}
              minSize={sidebarVisible ? 15 : 0}
              maxSize={sidebarVisible ? 35 : 0}
              className={`min-w-[200px] ${sidebarVisible ? '' : 'hidden'}`}
            >
              <LeftSidebar />
            </ResizablePanel>
            <ResizableHandle
              className={`!cursor-col-resize ${sidebarVisible ? '' : 'hidden'}`}
            />
            
            {/* Main Editor */}
            <ResizablePanel 
              defaultSize={sidebarVisible && frontmatterPanelVisible ? 55 : sidebarVisible ? 80 : frontmatterPanelVisible ? 75 : 100}
              minSize={40}
            >
              <MainEditor />
            </ResizablePanel>
            
            {/* Right Sidebar */}
            <ResizableHandle
              className={`!cursor-col-resize ${frontmatterPanelVisible ? '' : 'hidden'}`}
            />
            <ResizablePanel
              defaultSize={frontmatterPanelVisible ? 25 : 0}
              minSize={frontmatterPanelVisible ? 20 : 0}
              maxSize={frontmatterPanelVisible ? 40 : 0}
              className={frontmatterPanelVisible ? '' : 'hidden'}
            >
              <RightSidebar>
                <FrontmatterPanel />
              </RightSidebar>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
        
        {/* Status Bar - fixed at bottom */}
        <StatusBar />
      </div>

      {/* Floating components */}
      <CommandPalette />
      <ComponentBuilderDialog />
      <PreferencesDialog
        open={preferencesOpen}
        onOpenChange={setPreferencesOpen}
      />
      <Toaster />
    </div>
  )
}
