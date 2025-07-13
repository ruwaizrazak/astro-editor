import React from 'react';
import { useAppStore } from '../../store';
import './StatusBar.css';

export const StatusBar: React.FC = () => {
  const { currentFile, editorContent, isDirty } = useAppStore();

  const wordCount = editorContent.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = editorContent.length;

  return (
    <div className="status-bar">
      <div className="status-left">
        {currentFile && (
          <span className="file-info">
            {currentFile.name}.{currentFile.extension}
            {isDirty && <span className="dirty-indicator"> •</span>}
          </span>
        )}
      </div>
      
      <div className="status-right">
        {currentFile && (
          <>
            <span className="word-count">{wordCount} words</span>
            <span className="char-count">{charCount} characters</span>
          </>
        )}
      </div>
    </div>
  );
};