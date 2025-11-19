import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'path';
import { ElectronBlocker } from '@cliqz/adblocker-electron';
import fetch from 'cross-fetch';
import { setupIpcHandlers } from './ipc/handlers';
import { StorageManager } from './storage/storage';

// Global reference to prevent garbage collection
let mainWindow: BrowserWindow | null = null;
let blocker: ElectronBlocker | null = null;

// Storage manager instance
const storage = new StorageManager();

/**
 * Creates the main browser window with custom styling
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Frameless for custom title bar
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true, // Enable webview for browsing
      sandbox: false
    },
    show: false // Don't show until ready
  });

  // Show window when ready to prevent flickering
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

/**
 * Initialize adblocker
 */
async function initializeAdBlocker() {
  try {
    const settings = storage.getSettings();
    if (settings.privacy.adBlockerEnabled) {
      blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
      blocker.enableBlockingInSession(session.defaultSession);
      console.log('Adblocker initialized');
    }
  } catch (error) {
    console.error('Failed to initialize adblocker:', error);
  }
}

/**
 * Toggle adblocker on/off
 */
function toggleAdBlocker(enabled: boolean) {
  if (enabled && !blocker) {
    initializeAdBlocker();
  } else if (!enabled && blocker) {
    blocker.disableBlockingInSession(session.defaultSession);
    blocker = null;
  }
}

// App lifecycle events
app.whenReady().then(async () => {
  // Initialize storage
  storage.initialize();

  // Create main window
  createWindow();

  // Setup IPC handlers
  setupIpcHandlers(storage, toggleAdBlocker);

  // Initialize adblocker
  await initializeAdBlocker();

  // macOS: Re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle window controls from renderer
ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

// Get performance metrics
ipcMain.handle('get-performance-metrics', async () => {
  const metrics = app.getAppMetrics();
  const cpuUsage = process.getCPUUsage();
  const memoryUsage = process.memoryUsage();

  return {
    cpu: cpuUsage.percentCPUUsage,
    memory: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
    processes: metrics.length
  };
});

// Clear cache and cookies
ipcMain.handle('clear-browsing-data', async () => {
  try {
    await session.defaultSession.clearCache();
    await session.defaultSession.clearStorageData({
      storages: ['cookies', 'localstorage']
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});
