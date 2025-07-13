import React from 'react';
import { useAppStore } from '../../store';
import { CollectionsList } from './CollectionsList';
import { FilesList } from './FilesList';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const { selectedCollection } = useAppStore();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Collections</h3>
      </div>
      
      <div className="sidebar-content">
        {!selectedCollection ? (
          <CollectionsList />
        ) : (
          <FilesList />
        )}
      </div>
    </div>
  );
};