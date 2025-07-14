import React, { useEffect } from 'react';
import { useAppStore } from '../../store';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { UnifiedTitleBar } from './UnifiedTitleBar';
import { Sidebar } from './Sidebar';
import { MainEditor } from './MainEditor';
import { FrontmatterPanel } from './FrontmatterPanel';

export const Layout: React.FC = () => {
  const { 
    sidebarVisible, 
    frontmatterPanelVisible, 
    currentFile,
    editorContent,
    isDirty,
    openFile,
    saveFile,
    setProject,
    toggleSidebar,
    toggleFrontmatterPanel 
  } = useAppStore();

  // macOS keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // macOS uses metaKey (Cmd key)
      if (e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            // Cmd+S: Save File
            if (currentFile && isDirty) {
              void saveFile();
            }
            break;
          case '1':
            e.preventDefault();
            // Cmd+1: Toggle Sidebar
            toggleSidebar();
            break;
          case '2':
            e.preventDefault();
            // Cmd+2: Toggle Frontmatter Panel
            toggleFrontmatterPanel();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentFile, editorContent, isDirty, saveFile, toggleSidebar, toggleFrontmatterPanel]);

  // Menu event listeners
  useEffect(() => {
    const handleOpenProject = async () => {
      try {
        const projectPath = await invoke<string>('select_project_folder');
        if (projectPath) {
          setProject(projectPath);
        }
      } catch (error) {
        console.error('Failed to open project:', error);
      }
    };

    const unlistenOpenProject = listen('menu-open-project', handleOpenProject);
    const unlistenSave = listen('menu-save', () => {
      if (currentFile && isDirty) {
        void saveFile();
      }
    });
    const unlistenToggleSidebar = listen('menu-toggle-sidebar', toggleSidebar);
    const unlistenToggleFrontmatter = listen('menu-toggle-frontmatter', toggleFrontmatterPanel);

    return () => {
      void unlistenOpenProject.then(fn => fn());
      void unlistenSave.then(fn => fn());
      void unlistenToggleSidebar.then(fn => fn());
      void unlistenToggleFrontmatter.then(fn => fn());
    };
  }, [currentFile, isDirty, saveFile, setProject, toggleSidebar, toggleFrontmatterPanel]);

  return (
    <div className="h-screen w-screen bg-background font-sans flex flex-col rounded-xl overflow-hidden">
      {/* Unified titlebar */}
      <UnifiedTitleBar />
      
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {sidebarVisible && (
          <div
            className="w-70 min-w-50 max-w-100 bg-muted/20 border-r border-border resize-x overflow-hidden"
            style={{
              width: '280px',
              minWidth: '200px',
              maxWidth: '400px',
              resize: 'horizontal',
            }}
          >
            <Sidebar />
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-96">
          <MainEditor />
        </div>

        {frontmatterPanelVisible && (
          <div
            className="w-75 min-w-62.5 max-w-125 bg-muted/10 border-l border-border resize-x overflow-hidden"
            style={{
              width: '300px',
              minWidth: '250px',
              maxWidth: '500px',
              resize: 'horizontal',
            }}
          >
            <FrontmatterPanel />
          </div>
        )}
      </div>
    </div>
  );
};
