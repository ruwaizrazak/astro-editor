import React from 'react';
import { useAppStore } from '../../store';

export const FilesList: React.FC = () => {
  const { 
    files, 
    currentFile, 
    selectedCollection, 
    setSelectedCollection, 
    openFile 
  } = useAppStore();

  const handleBackClick = () => {
    setSelectedCollection(null);
  };

  const handleFileClick = (file: any) => {
    openFile(file);
  };

  return (
    <div>
      <button className="back-button" onClick={handleBackClick}>
        ← Back to Collections
      </button>
      
      <div style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '600', color: '#666' }}>
        {selectedCollection}
      </div>
      
      {files.map((file) => (
        <div
          key={file.id}
          className={`file-item ${file.is_draft ? 'draft' : ''} ${
            currentFile?.id === file.id ? 'selected' : ''
          }`}
          onClick={() => handleFileClick(file)}
        >
          <div className="file-name">{file.name}</div>
          <div className="file-path">.{file.extension}</div>
        </div>
      ))}
      
      {files.length === 0 && (
        <div style={{ padding: '16px', textAlign: 'center', color: '#666' }}>
          No files found in this collection.
        </div>
      )}
    </div>
  );
};