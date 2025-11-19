import React from 'react';
import { PanelType } from './AppShell';
import './Sidebar.css';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activePanel: PanelType;
  onPanelSelect: (panel: PanelType) => void;
}

/**
 * Sidebar - GX-style vertical navigation bar
 * Provides quick access to home, GX control, music player, and settings
 */
function Sidebar({ collapsed, onToggleCollapse, activePanel, onPanelSelect }: SidebarProps) {
  const sidebarItems = [
    {
      id: 'home',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="9 22 9 12 15 12 15 22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      label: 'Home',
      panel: null as PanelType
    },
    {
      id: 'gx-control',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="3" strokeWidth="2" />
          <path d="M12 1v6m0 6v6m8.66-15.66l-4.24 4.24m-4.24 4.24l-4.24 4.24m15.66-8.66l-4.24-4.24m-4.24-4.24l-4.24-4.24" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      label: 'GX Control',
      panel: 'gx-control' as PanelType
    },
    {
      id: 'music',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M9 18V5l12-2v13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="6" cy="18" r="3" strokeWidth="2" />
          <circle cx="18" cy="16" r="3" strokeWidth="2" />
        </svg>
      ),
      label: 'Music Player',
      panel: 'music' as PanelType
    },
    {
      id: 'settings',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="3" strokeWidth="2" />
          <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      label: 'Settings',
      panel: 'settings' as PanelType
    }
  ];

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-items">
        {sidebarItems.map(item => (
          <button
            key={item.id}
            className={`sidebar-item ${activePanel === item.panel ? 'active' : ''}`}
            onClick={() => onPanelSelect(item.panel)}
            title={item.label}
          >
            <div className="sidebar-item-icon">{item.icon}</div>
            {!collapsed && <span className="sidebar-item-label">{item.label}</span>}
          </button>
        ))}
      </div>

      <button
        className="sidebar-toggle"
        onClick={onToggleCollapse}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }}
        >
          <polyline points="15 18 9 12 15 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

export default Sidebar;
