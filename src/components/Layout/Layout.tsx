import React from 'react';
import { useAppStore } from '../../store';
import { Sidebar } from './Sidebar';
import { MainEditor } from './MainEditor';
import { FrontmatterPanel } from './FrontmatterPanel';
import './Layout.css';

export const Layout: React.FC = () => {
  const { sidebarVisible, frontmatterPanelVisible } = useAppStore();

  return (
    <div className="layout">
      {sidebarVisible && (
        <div className="sidebar-container">
          <Sidebar />
        </div>
      )}
      
      <div className="main-content">
        <MainEditor />
      </div>
      
      {frontmatterPanelVisible && (
        <div className="frontmatter-container">
          <FrontmatterPanel />
        </div>
      )}
    </div>
  );
};