import React from 'react';
import { useAppStore } from '../../store';
import './FrontmatterPanel.css';

export const FrontmatterPanel: React.FC = () => {
  const { currentFile } = useAppStore();

  return (
    <div className="frontmatter-panel">
      <div className="panel-header">
        <h3>Frontmatter</h3>
      </div>
      
      <div className="panel-content">
        {currentFile ? (
          <div className="frontmatter-form">
            <p style={{ color: '#666', fontSize: '12px' }}>
              Frontmatter editing will be implemented in Phase 2.
            </p>
            <div className="form-field">
              <label>Title</label>
              <input type="text" placeholder="Post title..." />
            </div>
            <div className="form-field">
              <label>Draft</label>
              <input type="checkbox" />
            </div>
          </div>
        ) : (
          <div className="no-file-message">
            Select a file to edit its frontmatter.
          </div>
        )}
      </div>
    </div>
  );
};