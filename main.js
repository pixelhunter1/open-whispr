const { app, BrowserWindow, globalShortcut, ipcMain, clipboard, shell, screen, Menu, Tray } = require("electron")
const path = require("path")
const { spawn } = require("child_process")
require('dotenv').config() // Load .env

let mainWindow
let tray = null
let controlPanelWindow = null

function getAppUrl(isControlPanel = false) {
  if (process.env.NODE_ENV === 'development') {
    // Vite dev server
    return isControlPanel 
      ? 'http://localhost:5174/?panel=true'
      : 'http://localhost:5174/';
  } else {
    // Production build
    return isControlPanel
      ? `file://${path.join(__dirname, 'src', 'dist', 'index.html')}?panel=true`
      : `file://${path.join(__dirname, 'src', 'dist', 'index.html')}`;
  }
}

function createWindow() {
  // Always show window by default
  const display = screen.getPrimaryDisplay();
  const width = 120;
  const height = 80;
  const x = display.bounds.x + Math.round((display.workArea.width - width) / 2);
  const y = display.workArea.height; // Position above the dock/menu bar

  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
    },
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    transparent: true,
    show: true, // Always show
  })
  

  mainWindow.loadURL(getAppUrl(false));

  // Pass environment variables to renderer process
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      window.OPENAI_API_KEY = '${process.env.OPENAI_API_KEY || ''}';
      console.log('API Key loaded:', window.OPENAI_API_KEY ? 'Present' : 'Missing');
    `);
  });

  // Remove all previous shortcuts
  globalShortcut.unregisterAll();

  // Register global shortcut for backtick (`) key to toggle dictation
  globalShortcut.register('`', () => {
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
    mainWindow.webContents.send('toggle-dictation');
  });

  // Ensure window is always on top, even above fullscreen apps
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.on('show', () => {
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  });

  // Add a working Quit menu item for macOS
  if (process.platform === 'darwin') {
    const template = [
      {
        label: 'OpenScribe',
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'quit', label: 'Quit OpenScribe' }
        ]
      }
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
}

function createControlPanelWindow() {
  if (controlPanelWindow) {
    controlPanelWindow.focus();
    return;
  }
  controlPanelWindow = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
    },
    title: 'OpenScribe Control Panel',
    resizable: true,
    show: true,
  });
  controlPanelWindow.loadURL(getAppUrl(true));
  controlPanelWindow.on('closed', () => {
    controlPanelWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow()

  // Create tray icon on macOS
  if (process.platform === 'darwin') {
    tray = new Tray(path.join(__dirname, 'assets/iconTemplate.png'));
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show', click: () => { mainWindow.show(); } },
      { label: 'Open Control Panel', click: () => { createControlPanelWindow(); } },
      { label: 'Quit', click: () => { app.quit(); } }
    ]);
    tray.setToolTip('OpenScribe');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    });
  }
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on("will-quit", () => {
  globalShortcut.unregisterAll()
})

// IPC handlers
ipcMain.handle("paste-text", async (event, text) => {
  // Copy text to clipboard and simulate paste
  clipboard.writeText(text)

  // Simulate Ctrl+V (or Cmd+V on Mac)
  const { spawn } = require("child_process")
  if (process.platform === "darwin") {
    spawn("osascript", ["-e", 'tell application "System Events" to keystroke "v" using command down'])
  } else if (process.platform === "win32") {
    console.log("Simulating Ctrl+V on Windows")
    spawn("powershell", [
      "-Command",
      'Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait("^v")',
    ])
  } else {
    // Linux
    spawn("xdotool", ["key", "ctrl+v"])
  }
})

ipcMain.handle("hide-window", () => {
  if (process.platform === "darwin") {
    mainWindow.minimize();
    if (app.dock) app.dock.show();
  } else {
    mainWindow.hide();
  }
})
