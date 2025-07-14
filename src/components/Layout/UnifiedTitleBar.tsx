import React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useAppStore } from '../../store';
import { Button } from '../ui/button';
import {
  Save,
  PanelRight,
  PanelLeft,
  PanelLeftClose,
  PanelRightClose,
} from 'lucide-react';

export const UnifiedTitleBar: React.FC = () => {
  const {
    projectPath,
    toggleFrontmatterPanel,
    frontmatterPanelVisible,
    toggleSidebar,
    sidebarVisible,
    saveFile,
    isDirty,
    currentFile,
  } = useAppStore();

  const handleSave = () => {
    if (currentFile && isDirty) {
      void saveFile();
    }
  };

  const handleMinimize = async () => {
    const window = getCurrentWindow();
    await window.minimize();
  };

  const handleToggleMaximize = async () => {
    const window = getCurrentWindow();
    const isFullscreen = await window.isFullscreen();
    await window.setFullscreen(!isFullscreen);
  };

  const handleClose = async () => {
    const window = getCurrentWindow();
    await window.hide();
  };

  return (
    <div
      className="h-11 w-full bg-background border-b border-border flex items-center justify-between px-3 select-none"
      data-tauri-drag-region
    >
      {/* Left: Traffic lights + left sidebar toggle */}
      <div className="flex items-center gap-2" data-tauri-drag-region>
        {/* Custom traffic lights - no drag region on these */}
        <div className="flex items-center gap-2 mr-3">
          <button
            onClick={() => void handleClose()}
            className="traffic-light traffic-light-close"
          >
            <span className="symbol">×</span>
          </button>
          <button
            onClick={() => void handleMinimize()}
            className="traffic-light traffic-light-minimize"
          >
            <span className="symbol">−</span>
          </button>
          <button
            onClick={() => void handleToggleMaximize()}
            className="traffic-light traffic-light-maximize"
          >
            <span className="symbol">+</span>
          </button>
        </div>

        {/* Left sidebar toggle - no drag region */}
        <Button
          onClick={toggleSidebar}
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          title={sidebarVisible ? 'Close Sidebar' : 'Open Sidebar'}
        >
          {sidebarVisible ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Center: Project path or app title - draggable */}
      <div
        className="flex-1 text-center overflow-hidden"
        data-tauri-drag-region
      >
        {projectPath ? (
          <span className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-xs block">
            {projectPath}
          </span>
        ) : (
          <span className="text-sm font-medium text-muted-foreground">
            Astro Editor
          </span>
        )}
      </div>

      {/* Right: Save button + Right sidebar toggle */}
      <div className="flex items-center gap-2" data-tauri-drag-region>
        {/* Save button - no drag region */}
        <Button
          onClick={handleSave}
          variant={isDirty ? 'default' : 'ghost'}
          size="sm"
          disabled={!currentFile || !isDirty}
          className="h-7 w-7 p-0"
          title={`Save${isDirty ? ' (unsaved changes)' : ''}`}
        >
          <Save className="h-4 w-4" />
        </Button>

        {/* Right sidebar toggle - no drag region */}
        <Button
          onClick={toggleFrontmatterPanel}
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          title={
            frontmatterPanelVisible
              ? 'Close Frontmatter Panel'
              : 'Open Frontmatter Panel'
          }
        >
          {frontmatterPanelVisible ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRight className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
