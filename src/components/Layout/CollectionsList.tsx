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
          className="collection-item"
          onClick={() => handleCollectionClick(collection)}
        >
          <div className="collection-name">{collection.name}</div>
          <div className="collection-path">{collection.path}</div>
        </div>
      ))}
      
      {collections.length === 0 && (
        <div style={{ padding: '16px', textAlign: 'center', color: '#666' }}>
          No collections found. Open an Astro project to get started.
        </div>
      )}
    </div>
  );
};