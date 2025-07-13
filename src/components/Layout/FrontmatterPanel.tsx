import React from 'react';
import { useAppStore } from '../../store';
import { Button } from '../ui/button';
import { PanelRightClose } from 'lucide-react';

export const FrontmatterPanel: React.FC = () => {
  const { currentFile, toggleFrontmatterPanel } = useAppStore();

  return (
    <div className="h-full flex flex-col bg-muted/20">
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground m-0">Frontmatter</h3>
        <Button 
          onClick={toggleFrontmatterPanel}
          variant="ghost" 
          size="sm"
          className="h-6 w-6 p-0"
          title="Close Frontmatter Panel"
        >
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        {currentFile ? (
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-xs">
              Frontmatter editing will be implemented in Phase 2.
            </p>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-foreground">Title</label>
              <input 
                type="text" 
                placeholder="Post title..." 
                className="px-2 py-2 border border-border rounded text-xs bg-background"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-foreground">Draft</label>
              <input 
                type="checkbox" 
                className="w-auto"
              />
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground text-xs mt-10">
            Select a file to edit its frontmatter.
          </div>
        )}
      </div>
    </div>
  );
};