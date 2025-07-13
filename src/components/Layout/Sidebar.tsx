import React from 'react';
import { useAppStore } from '../../store';
import { CollectionsList } from './CollectionsList';
import { FilesList } from './FilesList';

export const Sidebar: React.FC = () => {
  const { selectedCollection } = useAppStore();

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-muted/30">
        <h3 className="text-sm font-semibold text-foreground m-0">Collections</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2">
        {!selectedCollection ? (
          <CollectionsList />
        ) : (
          <FilesList />
        )}
      </div>
    </div>
  );
};