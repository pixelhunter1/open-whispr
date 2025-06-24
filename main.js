const { app, BrowserWindow, globalShortcut, ipcMain, clipboard, shell, screen, Menu, Tray } = require("electron")
const path = require("path")
const { spawn } = require("child_process")
const Database = require('better-sqlite3')

// Load .env file with better error handling and production support
function loadEnvironmentVariables() {
  // In production, try multiple locations for .env file
  const possibleEnvPaths = [
    // Development path
    path.join(__dirname, '.env'),
    // Production packaged app paths
    path.join(process.resourcesPath, '.env'),
    path.join(process.resourcesPath, 'app.asar.unpacked', '.env'),
    path.join(app.getPath('userData'), '.env'), // User data directory
    // Legacy paths
    path.join(process.resourcesPath, 'app', '.env'),
  ];

  let envLoaded = false;
  
  for (const envPath of possibleEnvPaths) {
    try {
      const fs = require('fs');
      if (fs.existsSync(envPath)) {
        console.log(`📁 Trying to load .env from: ${envPath}`);
        const result = require('dotenv').config({ path: envPath });
        if (!result.error) {
          console.log(`✅ .env file loaded successfully from: ${envPath}`);
          envLoaded = true;
          break;
        } else {
          console.log(`⚠️ .env file found but failed to parse: ${envPath}`, result.error);
        }
      }
    } catch (error) {
      console.log(`❌ Could not load .env from ${envPath}:`, error.message);
    }
  }

  if (!envLoaded) {
    console.log('⚠️ No .env file found in any expected location');
    console.log('💡 You can still set the API key via the Control Panel');
    console.log('📁 Expected locations:', possibleEnvPaths);
  }

  console.log('🔑 Environment:', process.env.NODE_ENV || 'production');
  console.log('🔑 OpenAI API Key present:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');
  if (process.env.OPENAI_API_KEY) {
    console.log('🔑 OpenAI API Key preview:', process.env.OPENAI_API_KEY.substring(0, 10) + '...');
  }
}

// Load environment variables
loadEnvironmentVariables();

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
  const width = 400;
  const height = 400;
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

  // Ensure window is visible after load
  mainWindow.webContents.on('did-finish-load', () => {
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
      sandbox: false, // Disable sandbox for control panel to allow clipboard access
      webSecurity: false, // Disable web security for clipboard access
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

// Database setup
let db;

function initDatabase() {
  // Use different database files for development vs production
  const dbFileName = process.env.NODE_ENV === 'development' 
    ? 'transcriptions-dev.db' 
    : 'transcriptions.db';
  
  const dbPath = path.join(app.getPath('userData'), dbFileName);
  console.log(`🗄️ Database environment: ${process.env.NODE_ENV || 'production'}`);
  console.log('📁 Database path:', dbPath);
  
  db = new Database(dbPath);
  
  // Create transcriptions table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS transcriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Get count of existing transcriptions
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM transcriptions');
  const { count } = countStmt.get();
  
  console.log(`✅ Database initialized successfully (${count} existing transcriptions)`);
}

app.whenReady().then(async () => {
  console.log('Electron app ready, creating window...');
  console.log('__dirname:', __dirname);
  console.log('process.resourcesPath:', process.resourcesPath);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  // Initialize database
  try {
    initDatabase();
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
  
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

// Function to check and request accessibility permissions on macOS
async function checkAccessibilityPermissions() {
  if (process.platform !== 'darwin') return true;
  
  return new Promise((resolve) => {
    const { spawn } = require("child_process");
    
    console.log('🔍 Checking accessibility permissions...');
    
    // First, let's check if we can perform a simple accessibility action
    const testProcess = spawn("osascript", [
      "-e", 
      'tell application "System Events" to get name of first process'
    ]);
    
    let testOutput = '';
    let testError = '';
    
    testProcess.stdout.on('data', (data) => {
      testOutput += data.toString();
    });
    
    testProcess.stderr.on('data', (data) => {
      testError += data.toString();
    });
    
    testProcess.on('close', (code) => {
      console.log('Initial accessibility test - Code:', code);
      console.log('Test output:', testOutput);
      console.log('Test error:', testError);
      
      if (code === 0) {
        console.log('✅ Accessibility permissions: GRANTED');
        resolve(true);
      } else {
        // Permission denied - but let's check if this might be a "stuck permission" issue
        console.log('❌ Accessibility permissions: DENIED');
        
        // Check if the error suggests we need to reset permissions
        const isStuckPermission = testError.includes('not allowed assistive access') || 
                                 testError.includes('(-1719)') ||
                                 testError.includes('(-25006)');
        
        let dialogMessage;
        if (isStuckPermission) {
          dialogMessage = `🔒 OpenScribe needs Accessibility permissions, but it looks like you may have OLD PERMISSIONS from a previous version.

❗ COMMON ISSUE: If you've rebuilt/reinstalled OpenScribe, the old permissions may be "stuck" and preventing new ones.

🔧 To fix this:
1. Open System Settings → Privacy & Security → Accessibility
2. Look for ANY old "OpenScribe" entries and REMOVE them (click the - button)
3. Also remove any entries that say "Electron" or have unclear names
4. Click the + button and manually add the NEW OpenScribe app
5. Make sure the checkbox is enabled
6. Restart OpenScribe

⚠️ This is especially common during development when rebuilding the app.

📝 Without this permission, text will only copy to clipboard (no automatic pasting).

Would you like to open System Settings now?`;
        } else {
          dialogMessage = `🔒 OpenScribe needs Accessibility permissions to paste text into other applications.

📋 Current status: Clipboard copy works, but pasting (Cmd+V simulation) fails.

🔧 To fix this:
1. Open System Settings (or System Preferences on older macOS)
2. Go to Privacy & Security → Accessibility
3. Click the lock icon and enter your password
4. Add OpenScribe to the list and check the box
5. Restart OpenScribe

⚠️ Without this permission, dictated text will only be copied to clipboard but won't paste automatically.

💡 In production builds, this permission is required for full functionality.

Would you like to open System Settings now?`;
        }
        
        const permissionDialog = spawn("osascript", [
          "-e",
          `display dialog "${dialogMessage}" buttons {"Cancel", "Open System Settings"} default button "Open System Settings"`
        ]);
        
        permissionDialog.on('close', (dialogCode) => {
          if (dialogCode === 0) {
            // User clicked "Open System Settings" - try modern path first, then legacy
            const settingsCommands = [
              ["open", ["x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"]],
              ["open", ["-b", "com.apple.systempreferences"]],
              ["open", ["/System/Library/PreferencePanes/Security.prefPane"]]
            ];
            
            let commandIndex = 0;
            const tryNextCommand = () => {
              if (commandIndex < settingsCommands.length) {
                const [cmd, args] = settingsCommands[commandIndex];
                const settingsProcess = spawn(cmd, args);
                
                settingsProcess.on('error', (error) => {
                  console.log(`Settings command ${commandIndex + 1} failed:`, error);
                  commandIndex++;
                  tryNextCommand();
                });
                
                settingsProcess.on('close', (settingsCode) => {
                  if (settingsCode !== 0) {
                    console.log(`Settings command ${commandIndex + 1} failed with code:`, settingsCode);
                    commandIndex++;
                    tryNextCommand();
                  } else {
                    console.log(`✅ Opened System Settings with command ${commandIndex + 1}`);
                  }
                });
              } else {
                console.log('❌ All settings commands failed, user will need to open manually');
                // Try one more fallback - just open System Settings/Preferences
                spawn("open", ["-a", "System Preferences"]).on('error', () => {
                  spawn("open", ["-a", "System Settings"]).on('error', () => {
                    console.log('Could not open settings app');
                  });
                });
              }
            };
            
            tryNextCommand();
          }
          resolve(false);
        });
        
        permissionDialog.on('error', (error) => {
          console.error('Error showing permission dialog:', error);
          console.log('Fallback: User needs to manually grant accessibility permissions');
          console.log('💡 TIP: If this is a rebuilt app, remove old OpenScribe entries from Accessibility settings first');
          resolve(false);
        });
      }
    });
    
    testProcess.on('error', (error) => {
      console.error('Error checking accessibility permissions:', error);
      console.log('Fallback: Assuming permissions are needed');
      resolve(false);
    });
  });
}

// IPC handlers
ipcMain.handle("paste-text", async (event, text) => {
  try {
    // Copy text to clipboard first - this always works
    clipboard.writeText(text);
    console.log('📋 Text copied to clipboard:', text.substring(0, 50) + '...');

    if (process.platform === "darwin") {
      // Check accessibility permissions first
      console.log('🔍 Checking accessibility permissions for paste operation...');
      const hasPermissions = await checkAccessibilityPermissions();
      
      if (!hasPermissions) {
        console.log('⚠️ No accessibility permissions - text copied to clipboard only');
        const errorMsg = 'Accessibility permissions required for automatic pasting. Text has been copied to clipboard - please paste manually with Cmd+V.';
        throw new Error(errorMsg);
      }
      
      console.log('✅ Permissions granted, attempting to paste...');
      
      // Use AppleScript to paste with better error handling and timeout
      const { spawn } = require("child_process");
      return new Promise((resolve, reject) => {
        // Add a small delay to ensure clipboard is ready
        setTimeout(() => {
          const pasteProcess = spawn("osascript", [
            "-e", 
            'tell application "System Events" to keystroke "v" using command down'
          ]);
          
          let errorOutput = '';
          let hasTimedOut = false;
          
          pasteProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
          });
          
          pasteProcess.on('close', (code) => {
            if (hasTimedOut) return; // Ignore if already timed out
            
            if (code === 0) {
              console.log('✅ Text pasted successfully via Cmd+V simulation');
              resolve();
            } else {
              console.error('❌ Failed to paste text, code:', code);
              console.error('Error output:', errorOutput);
              const errorMsg = `Paste failed (code ${code}). Text is copied to clipboard - please paste manually with Cmd+V.`;
              reject(new Error(errorMsg));
            }
          });
          
          pasteProcess.on('error', (error) => {
            if (hasTimedOut) return; // Ignore if already timed out
            
            console.error('❌ Error running paste command:', error);
            const errorMsg = `Paste command failed: ${error.message}. Text is copied to clipboard - please paste manually with Cmd+V.`;
            reject(new Error(errorMsg));
          });
          
          // Add timeout with cleanup
          const timeoutId = setTimeout(() => {
            hasTimedOut = true;
            pasteProcess.kill('SIGKILL');
            console.error('⏰ Paste operation timed out');
            const errorMsg = 'Paste operation timed out. Text is copied to clipboard - please paste manually with Cmd+V.';
            reject(new Error(errorMsg));
          }, 3000); // Reduced timeout for better UX
          
          // Clear timeout if process completes normally
          pasteProcess.on('close', () => {
            clearTimeout(timeoutId);
          });
          
        }, 100); // Small delay to ensure clipboard is ready
      });
      
    } else if (process.platform === "win32") {
      console.log("Simulating Ctrl+V on Windows");
      return new Promise((resolve, reject) => {
        const pasteProcess = spawn("powershell", [
          "-Command",
          'Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait("^v")',
        ]);
        
        pasteProcess.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Text pasted successfully on Windows');
            resolve();
          } else {
            console.error('❌ Failed to paste on Windows, code:', code);
            reject(new Error(`Windows paste failed with code ${code}. Text is copied to clipboard.`));
          }
        });
        
        pasteProcess.on('error', (error) => {
          console.error('❌ Windows paste error:', error);
          reject(new Error(`Windows paste failed: ${error.message}. Text is copied to clipboard.`));
        });
      });
    } else {
      // Linux
      console.log("Simulating Ctrl+V on Linux");
      return new Promise((resolve, reject) => {
        const pasteProcess = spawn("xdotool", ["key", "ctrl+v"]);
        
        pasteProcess.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Text pasted successfully on Linux');
            resolve();
          } else {
            console.error('❌ Failed to paste on Linux, code:', code);
            reject(new Error(`Linux paste failed with code ${code}. Text is copied to clipboard.`));
          }
        });
        
        pasteProcess.on('error', (error) => {
          console.error('❌ Linux paste error:', error);
          reject(new Error(`Linux paste failed: ${error.message}. Text is copied to clipboard.`));
        });
      });
    }
  } catch (error) {
    console.error('❌ Paste error:', error);
    throw error;
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

// Database IPC handlers
ipcMain.handle('db-save-transcription', async (event, text) => {
  try {
    const stmt = db.prepare('INSERT INTO transcriptions (text) VALUES (?)');
    const result = stmt.run(text);
    
    const truncatedText = text.length > 50 ? text.substring(0, 50) + '...' : text;
    console.log(`📝 Transcription saved to ${process.env.NODE_ENV || 'production'} DB:`, { 
      id: result.lastInsertRowid, 
      text: truncatedText,
      length: text.length 
    });
    
    return { id: result.lastInsertRowid, success: true };
  } catch (error) {
    console.error('❌ Error saving transcription:', error);
    throw error;
  }
});

ipcMain.handle('db-get-transcriptions', async (event, limit = 50) => {
  try {
    const stmt = db.prepare('SELECT * FROM transcriptions ORDER BY timestamp DESC LIMIT ?');
    const transcriptions = stmt.all(limit);
    console.log(`📚 Retrieved ${transcriptions.length} transcriptions from ${process.env.NODE_ENV || 'production'} DB (limit: ${limit})`);
    return transcriptions;
  } catch (error) {
    console.error('❌ Error getting transcriptions:', error);
    throw error;
  }
});

ipcMain.handle('db-clear-transcriptions', async (event) => {
  try {
    const stmt = db.prepare('DELETE FROM transcriptions');
    const result = stmt.run();
    console.log(`🗑️ Cleared ${result.changes} transcriptions from ${process.env.NODE_ENV || 'production'} DB`);
    return { cleared: result.changes, success: true };
  } catch (error) {
    console.error('❌ Error clearing transcriptions:', error);
    throw error;
  }
});

ipcMain.handle('db-delete-transcription', async (event, id) => {
  try {
    const stmt = db.prepare('DELETE FROM transcriptions WHERE id = ?');
    const result = stmt.run(id);
    console.log(`🗑️ Deleted transcription ${id}, affected rows: ${result.changes}`);
    return { success: result.changes > 0 };
  } catch (error) {
    console.error('❌ Error deleting transcription:', error);
    throw error;
  }
});

// Environment variable handlers
ipcMain.handle('get-openai-key', async (event) => {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('🔑 OpenAI API Key requested:', apiKey ? 'Present' : 'Missing');
  return apiKey || '';
});

ipcMain.handle('save-openai-key', async (event, key) => {
  try {
    // Update the environment variable in memory for immediate use
    process.env.OPENAI_API_KEY = key;
    console.log('🔑 OpenAI API Key updated in memory');
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving OpenAI API key:', error);
    throw error;
  }
});

// Clipboard handler for better paste support
ipcMain.handle('read-clipboard', async (event) => {
  try {
    const text = clipboard.readText();
    console.log('📋 Clipboard read:', text ? 'Text found' : 'Empty');
    return text;
  } catch (error) {
    console.error('❌ Error reading clipboard:', error);
    throw error;
  }
});

// Production .env file creation handler
ipcMain.handle('create-production-env-file', async (event, apiKey) => {
  try {
    const fs = require('fs');
    const envPath = path.join(app.getPath('userData'), '.env');
    
    const envContent = `# OpenScribe Environment Variables
# This file was created automatically for production use
OPENAI_API_KEY=${apiKey}
`;
    
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('✅ Production .env file created at:', envPath);
    
    // Reload environment variables
    require('dotenv').config({ path: envPath });
    console.log('🔄 Environment variables reloaded from production .env file');
    
    return { success: true, path: envPath };
  } catch (error) {
    console.error('❌ Error creating production .env file:', error);
    throw error;
  }
});
