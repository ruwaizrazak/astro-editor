import React from 'react';
import { useAppStore } from '../../store';
import { ToolBar } from './ToolBar';
import { EditorView } from './EditorView';
import { StatusBar } from './StatusBar';
import './MainEditor.css';

export const MainEditor: React.FC = () => {
  const { currentFile } = useAppStore();

  return (
    <div className="main-editor">
      <ToolBar />
      
      <div className="editor-container">
        {currentFile ? (
          <EditorView />
        ) : (
          <div className="editor-placeholder">
            <div className="placeholder-content">
              <h2>Welcome to Astro Editor</h2>
              <p>Select a project folder to get started, then choose a file to edit.</p>
            </div>
          </div>
        )}
      </div>
      
      <StatusBar />
    </div>
  );
};