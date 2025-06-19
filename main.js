const { app, BrowserWindow, globalShortcut, ipcMain, clipboard, shell, screen } = require("electron")
const path = require("path")
const { spawn } = require("child_process")
require('dotenv').config() // Load .env

let mainWindow

function createWindow() {
  // Always show window by default
  const display = screen.getPrimaryDisplay();
  const width = 80;
  const height = 20;
  const x = display.bounds.x + Math.round((display.workArea.width - width) / 2);
  const y = display.bounds.y + display.workArea.height; // 2px margin from bottom

  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    transparent: true,
    show: true, // Always show
  })
  

  mainWindow.loadFile("index.html")

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
}

app.whenReady().then(() => {
  createWindow()
  console.log("🎤 Open Scribe started!")
  console.log("📋 Shortcuts:")
  console.log("   - Press ` (backtick) to start/stop dictation and auto-paste")
  console.log("   - ESC to close window")
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
  console.log("Pasting text:", text)

  // Copy text to clipboard and simulate paste
  clipboard.writeText(text)
  console.log("Text copied to clipboard")

  // Simulate Ctrl+V (or Cmd+V on Mac)
  const { spawn } = require("child_process")
  if (process.platform === "darwin") {
    console.log("Simulating Cmd+V on macOS")
    spawn("osascript", ["-e", 'tell application "System Events" to keystroke "v" using command down'])
  } else if (process.platform === "win32") {
    console.log("Simulating Ctrl+V on Windows")
    spawn("powershell", [
      "-Command",
      'Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait("^v")',
    ])
  } else {
    console.log("Simulating Ctrl+V on Linux")
    // Linux
    spawn("xdotool", ["key", "ctrl+v"])
  }
})

ipcMain.handle("hide-window", () => {
  mainWindow.hide()
})
