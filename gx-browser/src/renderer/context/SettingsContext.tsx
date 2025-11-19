import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Settings interface
 */
export interface Settings {
  general: {
    startupBehavior: 'new-tab' | 'restore' | 'custom';
    startupPages: string[];
    searchEngine: 'google' | 'duckduckgo' | 'custom';
    customSearchUrl: string;
  };
  appearance: {
    enableAnimations: boolean;
    borderRadius: number;
    showBookmarksBar: boolean;
  };
  performance: {
    maxCpuPercent: number;
    maxRamMB: number;
    autoCloseInactiveTabs: boolean;
    inactiveTabTimeout: number;
  };
  privacy: {
    adBlockerEnabled: boolean;
  };
}

/**
 * Settings context interface
 */
interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  resetSettings: () => void;
  clearBrowsingData: () => Promise<void>;
  toggleAdBlocker: (enabled: boolean) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * Default settings
 */
const defaultSettings: Settings = {
  general: {
    startupBehavior: 'restore',
    startupPages: [],
    searchEngine: 'google',
    customSearchUrl: ''
  },
  appearance: {
    enableAnimations: true,
    borderRadius: 8,
    showBookmarksBar: true
  },
  performance: {
    maxCpuPercent: 80,
    maxRamMB: 2048,
    autoCloseInactiveTabs: false,
    inactiveTabTimeout: 30
  },
  privacy: {
    adBlockerEnabled: true
  }
};

/**
 * SettingsProvider - Manages application settings
 */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // Load settings from storage on mount
  useEffect(() => {
    loadSettingsFromStorage();
  }, []);

  // Save settings to storage whenever they change
  useEffect(() => {
    saveSettingsToStorage();
  }, [settings]);

  /**
   * Load settings from Electron storage
   */
  const loadSettingsFromStorage = async () => {
    try {
      const savedSettings = await window.electronAPI.loadSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  /**
   * Save settings to Electron storage
   */
  const saveSettingsToStorage = async () => {
    try {
      await window.electronAPI.saveSettings(settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  /**
   * Update settings
   */
  const updateSettings = (updates: Partial<Settings>) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      
      // Deep merge for nested objects
      if (updates.general) {
        newSettings.general = { ...prev.general, ...updates.general };
      }
      if (updates.appearance) {
        newSettings.appearance = { ...prev.appearance, ...updates.appearance };
      }
      if (updates.performance) {
        newSettings.performance = { ...prev.performance, ...updates.performance };
      }
      if (updates.privacy) {
        newSettings.privacy = { ...prev.privacy, ...updates.privacy };
      }

      return newSettings;
    });
  };

  /**
   * Reset settings to default
   */
  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  /**
   * Clear browsing data (cache, cookies)
   */
  const clearBrowsingData = async () => {
    try {
      await window.electronAPI.clearBrowsingData();
    } catch (error) {
      console.error('Failed to clear browsing data:', error);
    }
  };

  /**
   * Toggle adblocker
   */
  const toggleAdBlocker = async (enabled: boolean) => {
    try {
      await window.electronAPI.toggleAdBlocker(enabled);
      updateSettings({ privacy: { adBlockerEnabled: enabled } });
    } catch (error) {
      console.error('Failed to toggle adblocker:', error);
    }
  };

  const value: SettingsContextType = {
    settings,
    updateSettings,
    resetSettings,
    clearBrowsingData,
    toggleAdBlocker
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

/**
 * Hook to use settings context
 */
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
