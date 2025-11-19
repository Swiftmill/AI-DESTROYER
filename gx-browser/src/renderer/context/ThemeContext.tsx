import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Theme interface
 */
export interface Theme {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  textSecondaryColor: string;
  fontFamily: string;
  enableBlur: boolean;
}

/**
 * Theme context interface
 */
interface ThemeContextType {
  theme: Theme;
  updateTheme: (updates: Partial<Theme>) => void;
  resetTheme: () => void;
  exportTheme: () => string;
  importTheme: (themeJson: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Default theme
 */
const defaultTheme: Theme = {
  name: 'GX Purple',
  primaryColor: '#8b5cf6',
  secondaryColor: '#3b82f6',
  accentColor: '#ec4899',
  backgroundColor: '#0a0a0f',
  surfaceColor: '#1a1a24',
  textColor: '#ffffff',
  textSecondaryColor: '#a0a0b0',
  fontFamily: 'Inter, system-ui, sans-serif',
  enableBlur: true
};

/**
 * ThemeProvider - Manages application theme
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  // Load theme from storage on mount
  useEffect(() => {
    loadThemeFromStorage();
  }, []);

  // Apply theme to CSS variables whenever it changes
  useEffect(() => {
    applyThemeToDOM();
    saveThemeToStorage();
  }, [theme]);

  /**
   * Load theme from Electron storage
   */
  const loadThemeFromStorage = async () => {
    try {
      const savedTheme = await window.electronAPI.loadTheme();
      if (savedTheme) {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  /**
   * Save theme to Electron storage
   */
  const saveThemeToStorage = async () => {
    try {
      await window.electronAPI.saveTheme(theme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  /**
   * Apply theme to DOM CSS variables
   */
  const applyThemeToDOM = () => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primaryColor);
    root.style.setProperty('--secondary-color', theme.secondaryColor);
    root.style.setProperty('--accent-color', theme.accentColor);
    root.style.setProperty('--background-color', theme.backgroundColor);
    root.style.setProperty('--surface-color', theme.surfaceColor);
    root.style.setProperty('--text-color', theme.textColor);
    root.style.setProperty('--text-secondary-color', theme.textSecondaryColor);
    root.style.setProperty('--font-family', theme.fontFamily);
  };

  /**
   * Update theme properties
   */
  const updateTheme = (updates: Partial<Theme>) => {
    setTheme(prev => ({ ...prev, ...updates }));
  };

  /**
   * Reset theme to default
   */
  const resetTheme = () => {
    setTheme(defaultTheme);
  };

  /**
   * Export theme as JSON string
   */
  const exportTheme = () => {
    return JSON.stringify(theme, null, 2);
  };

  /**
   * Import theme from JSON string
   */
  const importTheme = (themeJson: string) => {
    try {
      const imported = JSON.parse(themeJson);
      setTheme({ ...defaultTheme, ...imported });
    } catch (error) {
      console.error('Failed to import theme:', error);
    }
  };

  const value: ThemeContextType = {
    theme,
    updateTheme,
    resetTheme,
    exportTheme,
    importTheme
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to use theme context
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
