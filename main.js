const { app, BrowserWindow, globalShortcut, ipcMain, clipboard, shell, screen, Menu, Tray } = require("electron")
const path = require("path")
const { spawn } = require("child_process")
require('dotenv').config() // Load .env

let mainWindow
let tray = null
let controlPanelWindow = null

// Function to check if dev server is ready
async function waitForDevServer(url, maxAttempts = 30, delay = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`Dev server ready after ${i + 1} attempts`);
        return true;
      }
    } catch (error) {
      console.log(`Waiting for dev server... attempt ${i + 1}/${maxAttempts}`);
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  console.error('Dev server failed to start within timeout');
  return false;
}

function getAppUrl(isControlPanel = false) {
  if (process.env.NODE_ENV === 'development') {
    // Vite dev server
    return isControlPanel 
      ? 'http://localhost:5174/?panel=true'
      : 'http://localhost:5174/';
  } else {
    // Production build - files are in asar package
    // __dirname in packaged app points to the root of app.asar
    const htmlPath = path.join(__dirname, 'src', 'dist', 'index.html');
    
    console.log('Loading HTML from:', htmlPath);
    console.log('__dirname:', __dirname);
    console.log('process.resourcesPath:', process.resourcesPath);
    
    return isControlPanel
      ? `file://${htmlPath}?panel=true`
      : `file://${htmlPath}`;
  }
}

async function createWindow() {
  // Always show window by default
  const display = screen.getPrimaryDisplay();
  const width = 120;
  const height = 80;
  const x = display.bounds.x + Math.round((display.workArea.width - width) / 2);
  const y = Math.max(0, display.workArea.height); // Position above the dock/menu bar with padding
  
  console.log('Display info:', {
    bounds: display.bounds,
    workArea: display.workArea,
    windowPosition: { x, y, width, height }
  });

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
  

  // Load URL with retry logic for development
  const loadMainWindow = async () => {
    const appUrl = getAppUrl(false);
    console.log('Loading main window URL:', appUrl);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: waiting for dev server...');
      const isReady = await waitForDevServer('http://localhost:5174/');
      if (!isReady) {
        console.error('Dev server not ready, loading anyway...');
      }
    }
    
    mainWindow.loadURL(appUrl);
  };
  
  loadMainWindow();
  
  // Add error handling for failed loads with retry
  mainWindow.webContents.on('did-fail-load', async (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load main window:', errorCode, errorDescription, validatedURL);
    
    if (process.env.NODE_ENV === 'development' && validatedURL.includes('localhost:5174')) {
      console.log('Retrying connection to dev server in 2 seconds...');
      setTimeout(async () => {
        const isReady = await waitForDevServer('http://localhost:5174/');
        if (isReady) {
          console.log('Dev server ready, reloading...');
          mainWindow.reload();
        }
      }, 2000);
    }
  });

  // Pass environment variables to renderer process
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      window.OPENAI_API_KEY = '${process.env.OPENAI_API_KEY || ''}';
      console.log('API Key loaded:', window.OPENAI_API_KEY ? 'Present' : 'Missing');
    `);
    
    // Ensure window is visible after load
    setTimeout(() => {
      if (!mainWindow.isVisible()) {
        console.log('Window not visible, forcing show...');
        mainWindow.show();
        mainWindow.focus();
      }
    }, 1000);
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

async function createControlPanelWindow() {
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
  
  // Load control panel with same retry logic
  const loadControlPanel = async () => {
    const appUrl = getAppUrl(true);
    console.log('Loading control panel URL:', appUrl);
    
    if (process.env.NODE_ENV === 'development') {
      const isReady = await waitForDevServer('http://localhost:5174/');
      if (!isReady) {
        console.error('Dev server not ready for control panel, loading anyway...');
      }
    }
    
    controlPanelWindow.loadURL(appUrl);
  };
  
  loadControlPanel();
  
  controlPanelWindow.on('closed', () => {
    controlPanelWindow = null;
  });
}

app.whenReady().then(async () => {
  console.log('Electron app ready, creating window...');
  console.log('__dirname:', __dirname);
  console.log('process.resourcesPath:', process.resourcesPath);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  // In development, add a small delay to let Vite start properly
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode: waiting 2 seconds for Vite to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  try {
    await createWindow();
    console.log('Main window created successfully');
  } catch (error) {
    console.error('Error creating main window:', error);
  }

  // Create tray icon on macOS
  if (process.platform === 'darwin') {
    try {
      // For Electron apps, use nativeImage to load from resources properly
      const { nativeImage } = require('electron');
      let trayIcon;
      
      if (process.env.NODE_ENV === 'development') {
        // Development mode - load from assets folder
        const iconPath = path.join(__dirname, 'assets', 'iconTemplate.png');
        console.log('Development: Loading tray icon from:', iconPath);
        trayIcon = nativeImage.createFromPath(iconPath);
             } else {
         // Production mode - try different locations for the icon
         const possiblePaths = [
           // First try extraResources (most likely for packaged app)
           path.join(process.resourcesPath, 'assets', 'iconTemplate.png'),
           // Then try asar.unpacked
           path.join(process.resourcesPath, 'app.asar.unpacked', 'assets', 'iconTemplate.png'),
           // Then try within app bundle
           path.join(__dirname, 'assets', 'iconTemplate.png'),
           // Legacy path
           path.join(process.resourcesPath, 'app', 'assets', 'iconTemplate.png')
         ];
        
        let iconPath = null;
        for (const testPath of possiblePaths) {
          try {
            if (require('fs').existsSync(testPath)) {
              iconPath = testPath;
              break;
            }
          } catch (e) {
            // Ignore and try next path
          }
        }
        
        if (iconPath) {
          console.log('Production: Loading tray icon from:', iconPath);
          trayIcon = nativeImage.createFromPath(iconPath);
        } else {
          console.error('Could not find tray icon in any expected location');
          return; // Exit early if no icon found
        }
      }
      
      // Check if the image loaded successfully
      if (trayIcon.isEmpty()) {
        console.error('Tray icon is empty - failed to load');
        return;
      }
      
      // Ensure it's marked as a template image for macOS
      trayIcon.setTemplateImage(true);
      
      tray = new Tray(trayIcon);
      const contextMenu = Menu.buildFromTemplate([
        { label: 'Show', click: () => { mainWindow.show(); } },
        { label: 'Open Control Panel', click: () => { createControlPanelWindow(); } },
        { label: 'Quit', click: () => { app.quit(); } }
      ]);
      tray.setToolTip('OpenScribe');
      tray.setContextMenu(contextMenu);
      tray.on('click', () => {
        // Always ensure the dictation panel is visible and focused
        if (!mainWindow.isVisible()) {
          mainWindow.show();
        }
        mainWindow.focus();
      });
      console.log('Tray icon created successfully');
    } catch (error) {
      console.error('Error creating tray icon:', error);
      console.log('Tray will not be available');
    }
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
