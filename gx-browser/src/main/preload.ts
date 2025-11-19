import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload script - exposes safe IPC APIs to renderer process
 * This maintains security by not exposing the entire Node.js API
 */

// Define the API interface
export interface ElectronAPI {
  // Window controls
  windowMinimize: () => void;
  windowMaximize: () => void;
  windowClose: () => void;

  // Tabs
  saveTabs: (tabs: any[]) => Promise<void>;
  loadTabs: () => Promise<any[]>;

  // Bookmarks
  saveBookmarks: (bookmarks: any[]) => Promise<void>;
  loadBookmarks: () => Promise<any[]>;
  addBookmark: (bookmark: any) => Promise<void>;
  removeBookmark: (id: string) => Promise<void>;

  // Settings
  saveSettings: (settings: any) => Promise<void>;
  loadSettings: () => Promise<any>;

  // Theme
  saveTheme: (theme: any) => Promise<void>;
  loadTheme: () => Promise<any>;

  // Performance
  getPerformanceMetrics: () => Promise<{
    cpu: number;
    memory: number;
    processes: number;
  }>;

  // Privacy
  clearBrowsingData: () => Promise<{ success: boolean; error?: string }>;
  toggleAdBlocker: (enabled: boolean) => Promise<void>;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),

  // Tabs
  saveTabs: (tabs: any[]) => ipcRenderer.invoke('save-tabs', tabs),
  loadTabs: () => ipcRenderer.invoke('load-tabs'),

  // Bookmarks
  saveBookmarks: (bookmarks: any[]) => ipcRenderer.invoke('save-bookmarks', bookmarks),
  loadBookmarks: () => ipcRenderer.invoke('load-bookmarks'),
  addBookmark: (bookmark: any) => ipcRenderer.invoke('add-bookmark', bookmark),
  removeBookmark: (id: string) => ipcRenderer.invoke('remove-bookmark', id),

  // Settings
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings'),

  // Theme
  saveTheme: (theme: any) => ipcRenderer.invoke('save-theme', theme),
  loadTheme: () => ipcRenderer.invoke('load-theme'),

  // Performance
  getPerformanceMetrics: () => ipcRenderer.invoke('get-performance-metrics'),

  // Privacy
  clearBrowsingData: () => ipcRenderer.invoke('clear-browsing-data'),
  toggleAdBlocker: (enabled: boolean) => ipcRenderer.invoke('toggle-adblocker', enabled)
} as ElectronAPI);

// Extend Window interface for TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
