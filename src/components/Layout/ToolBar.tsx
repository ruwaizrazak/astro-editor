import React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../../store';
import { Button } from '../ui/button';
import { FolderOpen, Save } from 'lucide-react';

export const ToolBar: React.FC = () => {
  const { 
    projectPath, 
    setProject, 
    toggleSidebar, 
    toggleFrontmatterPanel,
    saveFile,
    isDirty,
    currentFile
  } = useAppStore();

  const handleOpenProject = async () => {
    try {
      const result = await invoke<string | null>('select_project_folder');
      if (result) {
        setProject(result);
      }
    } catch (error) {
      console.error('Failed to open project:', error);
    }
  };

  const handleSave = () => {
    if (currentFile && isDirty) {
      saveFile();
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <Button 
          onClick={handleOpenProject} 
          variant="ghost" 
          size="sm"
          className="gap-2"
        >
          <FolderOpen className="h-4 w-4" />
          Open Project
        </Button>
        <Button 
          onClick={toggleSidebar} 
          variant="ghost" 
          size="sm"
        >
          Toggle Sidebar
        </Button>
      </div>
      
      <div className="toolbar-center">
        {projectPath && (
          <span className="project-path text-sm text-muted-foreground">{projectPath}</span>
        )}
      </div>
      
      <div className="toolbar-right">
        <Button 
          onClick={toggleFrontmatterPanel} 
          variant="ghost" 
          size="sm"
        >
          Frontmatter
        </Button>
        <Button 
          onClick={handleSave} 
          variant={isDirty ? "default" : "ghost"}
          size="sm"
          disabled={!currentFile || !isDirty}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Save {isDirty ? '•' : ''}
        </Button>
      </div>
    </div>
  );
};