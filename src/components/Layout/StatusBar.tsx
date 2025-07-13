import React from 'react';
import { useAppStore } from '../../store';

export const StatusBar: React.FC = () => {
  const { currentFile, editorContent, isDirty } = useAppStore();

  const wordCount = editorContent.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = editorContent.length;

  return (
    <div className="flex justify-between items-center px-4 py-1 bg-muted/50 border-t text-xs text-muted-foreground h-6">
      <div className="flex items-center">
        {currentFile && (
          <span>
            {currentFile.name}.{currentFile.extension}
            {isDirty && <span className="text-primary font-bold"> •</span>}
          </span>
        )}
      </div>
      
      <div className="flex gap-4">
        {currentFile && (
          <>
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
          </>
        )}
      </div>
    </div>
  );
};