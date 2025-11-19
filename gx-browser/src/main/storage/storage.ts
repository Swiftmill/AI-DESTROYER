import { app } from 'electron';
import fs from 'fs';
import path from 'path';

/**
 * StorageManager - Handles all persistent data storage
 * Uses JSON files in the app's userData directory
 */
export class StorageManager {
  private userDataPath: string;
  private tabsPath: string;
  private bookmarksPath: string;
  private settingsPath: string;
  private themePath: string;

  constructor() {
    this.userDataPath = app.getPath('userData');
    this.tabsPath = path.join(this.userDataPath, 'tabs.json');
    this.bookmarksPath = path.join(this.userDataPath, 'bookmarks.json');
    this.settingsPath = path.join(this.userDataPath, 'settings.json');
    this.themePath = path.join(this.userDataPath, 'theme.json');
  }

  /**
   * Initialize storage - create default files if they don't exist
   */
  initialize() {
    // Ensure userData directory exists
    if (!fs.existsSync(this.userDataPath)) {
      fs.mkdirSync(this.userDataPath, { recursive: true });
    }

    // Initialize tabs file
    if (!fs.existsSync(this.tabsPath)) {
      this.saveTabs([]);
    }

    // Initialize bookmarks file
    if (!fs.existsSync(this.bookmarksPath)) {
      this.saveBookmarks([]);
    }

    // Initialize settings file with defaults
    if (!fs.existsSync(this.settingsPath)) {
      this.saveSettings(this.getDefaultSettings());
    }

    // Initialize theme file with defaults
    if (!fs.existsSync(this.themePath)) {
      this.saveTheme(this.getDefaultTheme());
    }
  }

  /**
   * Default settings configuration
   */
  private getDefaultSettings() {
    return {
      general: {
        startupBehavior: 'restore', // 'new-tab' | 'restore' | 'custom'
        startupPages: [],
        searchEngine: 'google', // 'google' | 'duckduckgo' | 'custom'
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
        inactiveTabTimeout: 30 // minutes
      },
      privacy: {
        adBlockerEnabled: true
      }
    };
  }

  /**
   * Default theme configuration
   */
  private getDefaultTheme() {
    return {
      name: 'GX Purple',
      primaryColor: '#8b5cf6', // Purple
      secondaryColor: '#3b82f6', // Blue
      accentColor: '#ec4899', // Pink
      backgroundColor: '#0a0a0f',
      surfaceColor: '#1a1a24',
      textColor: '#ffffff',
      textSecondaryColor: '#a0a0b0',
      fontFamily: 'Inter, system-ui, sans-serif',
      enableBlur: true
    };
  }

  /**
   * Tabs persistence
   */
  saveTabs(tabs: any[]) {
    try {
      fs.writeFileSync(this.tabsPath, JSON.stringify(tabs, null, 2));
    } catch (error) {
      console.error('Failed to save tabs:', error);
    }
  }

  loadTabs(): any[] {
    try {
      if (fs.existsSync(this.tabsPath)) {
        const data = fs.readFileSync(this.tabsPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load tabs:', error);
    }
    return [];
  }

  /**
   * Bookmarks persistence
   */
  saveBookmarks(bookmarks: any[]) {
    try {
      fs.writeFileSync(this.bookmarksPath, JSON.stringify(bookmarks, null, 2));
    } catch (error) {
      console.error('Failed to save bookmarks:', error);
    }
  }

  loadBookmarks(): any[] {
    try {
      if (fs.existsSync(this.bookmarksPath)) {
        const data = fs.readFileSync(this.bookmarksPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    }
    return [];
  }

  /**
   * Settings persistence
   */
  saveSettings(settings: any) {
    try {
      fs.writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  getSettings(): any {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return this.getDefaultSettings();
  }

  /**
   * Theme persistence
   */
  saveTheme(theme: any) {
    try {
      fs.writeFileSync(this.themePath, JSON.stringify(theme, null, 2));
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }

  loadTheme(): any {
    try {
      if (fs.existsSync(this.themePath)) {
        const data = fs.readFileSync(this.themePath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
    return this.getDefaultTheme();
  }
}
