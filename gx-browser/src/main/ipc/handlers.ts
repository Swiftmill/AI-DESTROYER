import { ipcMain } from 'electron';
import { StorageManager } from '../storage/storage';

/**
 * Setup all IPC handlers for communication between main and renderer processes
 */
export function setupIpcHandlers(
  storage: StorageManager,
  toggleAdBlocker: (enabled: boolean) => void
) {
  // Tabs handlers
  ipcMain.handle('save-tabs', async (_event, tabs) => {
    storage.saveTabs(tabs);
  });

  ipcMain.handle('load-tabs', async () => {
    return storage.loadTabs();
  });

  // Bookmarks handlers
  ipcMain.handle('save-bookmarks', async (_event, bookmarks) => {
    storage.saveBookmarks(bookmarks);
  });

  ipcMain.handle('load-bookmarks', async () => {
    return storage.loadBookmarks();
  });

  ipcMain.handle('add-bookmark', async (_event, bookmark) => {
    const bookmarks = storage.loadBookmarks();
    bookmarks.push(bookmark);
    storage.saveBookmarks(bookmarks);
  });

  ipcMain.handle('remove-bookmark', async (_event, id) => {
    const bookmarks = storage.loadBookmarks();
    const filtered = bookmarks.filter((b: any) => b.id !== id);
    storage.saveBookmarks(filtered);
  });

  // Settings handlers
  ipcMain.handle('save-settings', async (_event, settings) => {
    storage.saveSettings(settings);
  });

  ipcMain.handle('load-settings', async () => {
    return storage.getSettings();
  });

  // Theme handlers
  ipcMain.handle('save-theme', async (_event, theme) => {
    storage.saveTheme(theme);
  });

  ipcMain.handle('load-theme', async () => {
    return storage.loadTheme();
  });

  // Adblocker toggle
  ipcMain.handle('toggle-adblocker', async (_event, enabled) => {
    toggleAdBlocker(enabled);
    const settings = storage.getSettings();
    settings.privacy.adBlockerEnabled = enabled;
    storage.saveSettings(settings);
  });
}
