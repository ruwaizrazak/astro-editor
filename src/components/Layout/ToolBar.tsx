import React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../../store';
import './ToolBar.css';

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
        <button onClick={handleOpenProject} className="toolbar-button">
          Open Project
        </button>
        <button onClick={toggleSidebar} className="toolbar-button">
          Toggle Sidebar
        </button>
      </div>
      
      <div className="toolbar-center">
        {projectPath && (
          <span className="project-path">{projectPath}</span>
        )}
      </div>
      
      <div className="toolbar-right">
        <button onClick={toggleFrontmatterPanel} className="toolbar-button">
          Frontmatter
        </button>
        <button 
          onClick={handleSave} 
          className={`toolbar-button ${isDirty ? 'save-needed' : ''}`}
          disabled={!currentFile || !isDirty}
        >
          Save {isDirty ? '•' : ''}
        </button>
      </div>
    </div>
  );
};