import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * Tab interface
 */
export interface Tab {
  id: string;
  url: string;
  title: string;
  favicon: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

/**
 * Tabs context interface
 */
interface TabsContextType {
  tabs: Tab[];
  activeTabId: string | null;
  addTab: (url?: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, updates: Partial<Tab>) => void;
  duplicateTab: (id: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  getActiveTab: () => Tab | undefined;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

/**
 * TabsProvider - Manages all browser tabs state
 */
export function TabsProvider({ children }: { children: React.ReactNode }) {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Load tabs from storage on mount
  useEffect(() => {
    loadTabsFromStorage();
  }, []);

  // Save tabs to storage whenever they change
  useEffect(() => {
    if (tabs.length > 0) {
      saveTabsToStorage();
    }
  }, [tabs]);

  /**
   * Load tabs from Electron storage
   */
  const loadTabsFromStorage = async () => {
    try {
      const savedTabs = await window.electronAPI.loadTabs();
      if (savedTabs && savedTabs.length > 0) {
        setTabs(savedTabs);
        setActiveTabId(savedTabs[0].id);
      } else {
        // Create initial tab if no saved tabs
        addTab('https://www.google.com');
      }
    } catch (error) {
      console.error('Failed to load tabs:', error);
      addTab('https://www.google.com');
    }
  };

  /**
   * Save tabs to Electron storage
   */
  const saveTabsToStorage = async () => {
    try {
      await window.electronAPI.saveTabs(tabs);
    } catch (error) {
      console.error('Failed to save tabs:', error);
    }
  };

  /**
   * Generate unique tab ID
   */
  const generateTabId = () => {
    return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * Add a new tab
   */
  const addTab = useCallback((url: string = 'https://www.google.com') => {
    const newTab: Tab = {
      id: generateTabId(),
      url,
      title: 'New Tab',
      favicon: '',
      isLoading: true,
      canGoBack: false,
      canGoForward: false
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  /**
   * Close a tab
   */
  const closeTab = useCallback((id: string) => {
    setTabs(prev => {
      const filtered = prev.filter(tab => tab.id !== id);
      
      // If closing active tab, switch to another tab
      if (id === activeTabId) {
        const closedIndex = prev.findIndex(tab => tab.id === id);
        const newActiveTab = filtered[closedIndex] || filtered[closedIndex - 1] || filtered[0];
        setActiveTabId(newActiveTab?.id || null);
      }

      // If no tabs left, create a new one
      if (filtered.length === 0) {
        const newTab: Tab = {
          id: generateTabId(),
          url: 'https://www.google.com',
          title: 'New Tab',
          favicon: '',
          isLoading: true,
          canGoBack: false,
          canGoForward: false
        };
        return [newTab];
      }

      return filtered;
    });
  }, [activeTabId]);

  /**
   * Set active tab
   */
  const setActiveTab = useCallback((id: string) => {
    setActiveTabId(id);
  }, []);

  /**
   * Update tab properties
   */
  const updateTab = useCallback((id: string, updates: Partial<Tab>) => {
    setTabs(prev =>
      prev.map(tab =>
        tab.id === id ? { ...tab, ...updates } : tab
      )
    );
  }, []);

  /**
   * Duplicate a tab
   */
  const duplicateTab = useCallback((id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (tab) {
      addTab(tab.url);
    }
  }, [tabs, addTab]);

  /**
   * Reorder tabs (for drag and drop)
   */
  const reorderTabs = useCallback((fromIndex: number, toIndex: number) => {
    setTabs(prev => {
      const newTabs = [...prev];
      const [removed] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, removed);
      return newTabs;
    });
  }, []);

  /**
   * Get active tab
   */
  const getActiveTab = useCallback(() => {
    return tabs.find(tab => tab.id === activeTabId);
  }, [tabs, activeTabId]);

  const value: TabsContextType = {
    tabs,
    activeTabId,
    addTab,
    closeTab,
    setActiveTab,
    updateTab,
    duplicateTab,
    reorderTabs,
    getActiveTab
  };

  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>;
}

/**
 * Hook to use tabs context
 */
export function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabs must be used within TabsProvider');
  }
  return context;
}
