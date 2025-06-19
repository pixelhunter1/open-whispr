const { app, BrowserWindow, globalShortcut, ipcMain, clipboard, shell } = require("electron")
const path = require("path")
const { spawn } = require("child_process")
require('dotenv').config() // Load .env

let mainWindow

function createWindow() {
  // Check if we're in development mode
  const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development'
  
  mainWindow = new BrowserWindow({
    width: 400,
    height: 300,
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
    show: isDev, // Show window by default in development mode
  })

  mainWindow.loadFile("index.html")

  // Pass environment variables to renderer process
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      window.OPENAI_API_KEY = '${process.env.OPENAI_API_KEY || ''}';
      console.log('API Key loaded:', window.OPENAI_API_KEY ? 'Present' : 'Missing');
    `);
  });

  // Register global shortcut for activation - using F13 (Fn key on Mac)
  globalShortcut.register("F13", () => {
    console.log("Global shortcut activated!")
    if (mainWindow.isVisible()) {
      mainWindow.hide()
      console.log("Window hidden")
    } else {
      mainWindow.show()
      mainWindow.focus()
      console.log("Window shown")
    }
  })

  // Alternative: Use Cmd+` (backtick) which is easier to reach
  globalShortcut.register("CommandOrControl+`", () => {
    console.log("Alternative shortcut activated!")
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

app.whenReady().then(() => {
  createWindow()
  console.log("🎤 Open Scribe started!")
  console.log("📋 Shortcuts:")
  console.log("   - Fn key (F13) to toggle window")
  console.log("   - Cmd+` (backtick) to toggle window")
  console.log("   - Space to start/stop recording")
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
  // Hide the window first
  mainWindow.hide()

  // Wait a bit for the window to hide
  await new Promise((resolve) => setTimeout(resolve, 100))

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
