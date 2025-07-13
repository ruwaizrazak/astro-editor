import React from 'react';
import { useAppStore } from '../../store';
import { Sidebar } from './Sidebar';
import { MainEditor } from './MainEditor';
import { FrontmatterPanel } from './FrontmatterPanel';

export const Layout: React.FC = () => {
  const { sidebarVisible, frontmatterPanelVisible } = useAppStore();

  return (
    <div className="flex h-screen w-screen bg-background font-sans">
      {sidebarVisible && (
        <div
          className="w-70 min-w-50 max-w-100 bg-muted/20 border-r border-border resize-x overflow-hidden"
          style={{
            width: '280px',
            minWidth: '200px',
            maxWidth: '400px',
            resize: 'horizontal',
          }}
        >
          <Sidebar />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-96">
        <MainEditor />
      </div>

      {frontmatterPanelVisible && (
        <div
          className="w-75 min-w-62.5 max-w-125 bg-muted/10 border-l border-border resize-x overflow-hidden"
          style={{
            width: '300px',
            minWidth: '250px',
            maxWidth: '500px',
            resize: 'horizontal',
          }}
        >
          <FrontmatterPanel />
        </div>
      )}
    </div>
  );
};
