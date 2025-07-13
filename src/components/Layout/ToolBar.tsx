import React from 'react';
import { useAppStore } from '../../store';
import { Button } from '../ui/button';
import { Save, PanelRight } from 'lucide-react';

export const ToolBar: React.FC = () => {
  const {
    projectPath,
    toggleFrontmatterPanel,
    frontmatterPanelVisible,
    saveFile,
    isDirty,
    currentFile,
  } = useAppStore();

  const handleSave = () => {
    if (currentFile && isDirty) {
      void saveFile();
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-background border-b border-border h-11">
      <div className="flex items-center gap-2">
        {/* Left side intentionally empty - open project moved to sidebar */}
      </div>

      <div className="flex-1 text-center overflow-hidden">
        {projectPath && (
          <span className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-xs block">
            {projectPath}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={handleSave}
          variant={isDirty ? 'default' : 'ghost'}
          size="sm"
          disabled={!currentFile || !isDirty}
          className="h-8 w-8 p-0"
          title={`Save${isDirty ? ' (unsaved changes)' : ''}`}
        >
          <Save className="h-4 w-4" />
        </Button>
        {!frontmatterPanelVisible && (
          <Button
            onClick={toggleFrontmatterPanel}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Open Frontmatter Panel"
          >
            <PanelRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
