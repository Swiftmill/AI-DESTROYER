import React, { useState } from 'react';
import TitleBar from './TitleBar';
import Sidebar from './Sidebar';
import TabBar from './TabBar';
import NavigationBar from './NavigationBar';
import WebViewContainer from './WebViewContainer';
import BookmarksBar from './BookmarksBar';
import GXControlPanel from './GXControlPanel';
import SettingsPanel from './SettingsPanel';
import MusicPlayerPanel from './MusicPlayerPanel';
import { useSettings } from '../context/SettingsContext';
import './AppShell.css';

/**
 * Panel types that can be opened from sidebar
 */
export type PanelType = 'gx-control' | 'music' | 'settings' | null;

/**
 * AppShell - Main application layout container
 * Manages the overall structure: title bar, sidebar, tab bar, navigation, webview, and panels
 */
function AppShell() {
  const { settings } = useSettings();
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /**
   * Toggle panel visibility
   */
  const togglePanel = (panel: PanelType) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  /**
   * Close active panel
   */
  const closePanel = () => {
    setActivePanel(null);
  };

  return (
    <div className="app-shell">
      {/* Custom title bar with window controls */}
      <TitleBar />

      <div className="app-content">
        {/* Left sidebar with navigation icons */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          activePanel={activePanel}
          onPanelSelect={togglePanel}
        />

        {/* Main browser area */}
        <div className="browser-area">
          {/* Tab bar */}
          <TabBar />

          {/* Navigation bar (back, forward, URL, etc.) */}
          <NavigationBar />

          {/* Bookmarks bar (optional) */}
          {settings.appearance.showBookmarksBar && <BookmarksBar />}

          {/* Webview container */}
          <WebViewContainer />
        </div>

        {/* Side panels */}
        {activePanel === 'gx-control' && (
          <GXControlPanel onClose={closePanel} />
        )}
        {activePanel === 'music' && (
          <MusicPlayerPanel onClose={closePanel} />
        )}
        {activePanel === 'settings' && (
          <SettingsPanel onClose={closePanel} />
        )}
      </div>
    </div>
  );
}

export default AppShell;
