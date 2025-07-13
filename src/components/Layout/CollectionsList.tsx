import React from 'react';
import { useAppStore } from '../../store';

export const CollectionsList: React.FC = () => {
  const { collections, setSelectedCollection, loadCollectionFiles } = useAppStore();

  const handleCollectionClick = (collection: any) => {
    setSelectedCollection(collection.name);
    loadCollectionFiles(collection.path);
  };

  return (
    <div>
      {collections.map((collection) => (
        <div
          key={collection.name}
          className="px-4 py-2 cursor-pointer border-b border-border/50 transition-colors hover:bg-accent/50"
          onClick={() => handleCollectionClick(collection)}
        >
          <div className="text-sm font-medium mb-0.5">{collection.name}</div>
          <div className="text-xs text-muted-foreground opacity-80">{collection.path}</div>
        </div>
      ))}
      
      {collections.length === 0 && (
        <div className="p-4 text-center text-muted-foreground text-sm">
          No collections found. Open an Astro project to get started.
        </div>
      )}
    </div>
  );
};