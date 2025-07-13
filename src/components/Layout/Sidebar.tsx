import React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../../store';
import { CollectionsList } from './CollectionsList';
import { FilesList } from './FilesList';
import { Button } from '../ui/button';
import { PanelLeftClose, FolderOpen } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { selectedCollection, toggleSidebar, setProject } = useAppStore();

  const handleOpenProject = async () => {
    try {
      const result = await invoke<string | null>('select_project_folder');
      if (result) {
        setProject(result);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to open project:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => void handleOpenProject()}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            title="Open Project"
          >
            <FolderOpen className="h-4 w-4" />
          </Button>
          <h3 className="text-sm font-semibold text-foreground m-0">
            Collections
          </h3>
        </div>
        <Button
          onClick={toggleSidebar}
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          title="Close Sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {!selectedCollection ? <CollectionsList /> : <FilesList />}
      </div>
    </div>
  );
};
