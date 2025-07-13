import React from 'react';
import { useAppStore } from '../../store';
import { ToolBar } from './ToolBar';
import { EditorView } from './index';
import { StatusBar } from './StatusBar';
import { Button } from '../ui/button';
import { PanelLeft } from 'lucide-react';

export const MainEditor: React.FC = () => {
  const { currentFile, sidebarVisible, toggleSidebar } = useAppStore();

  return (
    <div className="flex flex-col h-full relative">
      {!sidebarVisible && (
        <Button
          onClick={toggleSidebar}
          variant="ghost"
          size="sm"
          className="absolute top-2 left-2 z-10 h-8 w-8 p-0"
          title="Open Sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      )}
      <ToolBar />

      <div className="flex-1 overflow-hidden">
        {currentFile ? (
          <EditorView />
        ) : (
          <div className="flex items-center justify-center h-full bg-background">
            <div className="text-center text-muted-foreground">
              <h2 className="m-0 mb-4 text-2xl font-light">
                Welcome to Astro Editor
              </h2>
              <p className="m-0 text-sm">
                Select a project folder to get started, then choose a file to
                edit.
              </p>
            </div>
          </div>
        )}
      </div>

      <StatusBar />
    </div>
  );
};
