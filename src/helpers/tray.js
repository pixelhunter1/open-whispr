const { Tray, Menu, nativeImage, app } = require("electron");
const path = require("path");
const fs = require("fs");

class TrayManager {
  constructor() {
    this.tray = null;
    this.mainWindow = null;
    this.controlPanelWindow = null;
    this.windowManager = null;
    this.attachedControlPanels = new WeakSet();
  }

  setWindows(mainWindow, controlPanelWindow) {
    this.mainWindow = mainWindow;
    this.controlPanelWindow = controlPanelWindow;

    if (this.mainWindow) {
      this.mainWindow.on("show", () => this.updateTrayMenu?.());
      this.mainWindow.on("hide", () => this.updateTrayMenu?.());
      this.mainWindow.on("minimize", () => this.updateTrayMenu?.());
      this.mainWindow.on("restore", () => this.updateTrayMenu?.());
    }

    if (this.controlPanelWindow) {
      this.attachControlPanelListeners(this.controlPanelWindow);
    }

    this.updateTrayMenu?.();
  }

  setWindowManager(windowManager) {
    this.windowManager = windowManager;
  }

  setCreateControlPanelCallback(callback) {
    this.createControlPanelCallback = callback;
  }

  attachControlPanelListeners(window) {
    if (!window || this.attachedControlPanels.has(window)) {
      return;
    }

    this.attachedControlPanels.add(window);

    window.on("show", () => {
      if (process.platform === "win32") {
        window.setSkipTaskbar(false);
      }
      this.updateTrayMenu?.();
    });

    window.on("hide", () => {
      this.updateTrayMenu?.();
    });

    window.on("destroyed", () => {
      this.controlPanelWindow = null;
      this.updateTrayMenu?.();
    });
  }

  async showControlPanelFromTray() {
    try {
      if (this.windowManager) {
        this.controlPanelWindow = this.windowManager.controlPanelWindow || this.controlPanelWindow;
      }
      this.attachControlPanelListeners(this.controlPanelWindow);

      if (this.controlPanelWindow && !this.controlPanelWindow.isDestroyed()) {
        if (process.platform === "win32") {
          this.controlPanelWindow.setSkipTaskbar(false);
        }
        if (!this.controlPanelWindow.isVisible()) {
          this.controlPanelWindow.show();
        }
        this.controlPanelWindow.focus();
        return;
      }

      if (this.createControlPanelCallback) {
        await this.createControlPanelCallback();
        if (this.windowManager) {
          this.controlPanelWindow =
            this.windowManager.controlPanelWindow || this.controlPanelWindow;
        }
        this.attachControlPanelListeners(this.controlPanelWindow);

        if (this.controlPanelWindow && !this.controlPanelWindow.isDestroyed()) {
          if (process.platform === "win32") {
            this.controlPanelWindow.setSkipTaskbar(false);
          }
          this.controlPanelWindow.show();
          this.controlPanelWindow.focus();
        }
        return;
      }

      console.error("No control panel callback available");
    } catch (error) {
      console.error("Failed to open control panel:", error);
    }
  }

  async createTray() {
    if (process.platform !== "darwin" && process.platform !== "win32") return;

    try {
      const trayIcon = await this.loadTrayIcon();
      if (!trayIcon || trayIcon.isEmpty()) {
        console.error("Failed to load tray icon");
        return;
      }

      this.tray = new Tray(trayIcon);

      if (process.platform === "darwin") {
        this.tray.setIgnoreDoubleClickEvents(true);
      }

      this.updateTrayMenu();
      this.setupTrayEventHandlers();
    } catch (error) {
      console.error("Error creating tray icon:", error.message);
    }
  }

  async loadTrayIcon() {
    const platform = process.platform;
    const isDevelopment = process.env.NODE_ENV === "development";

    const candidatePaths = [];

    if (platform === "darwin") {
      if (isDevelopment) {
        candidatePaths.push(path.join(__dirname, "..", "assets", "iconTemplate@3x.png"));
      } else {
        candidatePaths.push(
          path.join(process.resourcesPath, "src", "assets", "iconTemplate@3x.png"),
          path.join(process.resourcesPath, "assets", "iconTemplate@3x.png"),
          path.join(
            process.resourcesPath,
            "app.asar.unpacked",
            "src",
            "assets",
            "iconTemplate@3x.png"
          ),
          path.join(__dirname, "..", "..", "src", "assets", "iconTemplate@3x.png"),
          path.join(app.getAppPath(), "src", "assets", "iconTemplate@3x.png")
        );
      }
    } else {
      const fileName = platform === "win32" ? "icon.ico" : "icon.png";
      if (isDevelopment) {
        candidatePaths.push(
          path.join(__dirname, "..", "assets", fileName),
          path.join(__dirname, "..", "assets", "icon.png")
        );
      } else {
        candidatePaths.push(
          path.join(process.resourcesPath, "src", "assets", fileName),
          path.join(process.resourcesPath, "assets", fileName),
          path.join(process.resourcesPath, "app.asar.unpacked", "src", "assets", fileName),
          path.join(__dirname, "..", "..", "src", "assets", fileName),
          path.join(app.getAppPath(), "src", "assets", fileName)
        );
      }
    }

    for (const testPath of candidatePaths) {
      try {
        if (fs.existsSync(testPath)) {
          const icon = nativeImage.createFromPath(testPath);
          if (icon && !icon.isEmpty()) {
            if (platform === "darwin") {
              icon.setTemplateImage(true);
            }
            console.log("Using tray icon:", testPath);
            return icon;
          }
        }
      } catch (error) {
        console.error("Error checking tray icon path:", testPath, error.message);
      }
    }

    console.error("Could not find tray icon in any expected location");
    return this.createFallbackIcon();
  }

  createFallbackIcon() {
    try {
      // Create a simple 16x16 PNG icon programmatically
      const { createCanvas } = require("canvas");
      const canvas = createCanvas(16, 16);
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(8, 8, 6, 0, 2 * Math.PI);
      ctx.fill();

      const buffer = canvas.toBuffer("image/png");
      const fallbackIcon = nativeImage.createFromBuffer(buffer);
      console.log("✅ Created fallback tray icon");
      return fallbackIcon;
    } catch (fallbackError) {
      console.warn("Canvas not available, creating minimal fallback icon");
      // Create a minimal 16x16 black square PNG as fallback
      const pngData = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
        0x52, 0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90,
        0x91, 0x68, 0x36, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x28, 0x53, 0x63, 0x08,
        0x05, 0x00, 0x00, 0x02, 0x00, 0x01, 0xe5, 0x27, 0xde, 0xfc, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ]);

      const fallbackIcon = nativeImage.createFromBuffer(pngData);
      console.log("✅ Created minimal fallback tray icon");
      return fallbackIcon;
    }
  }

  buildContextMenuTemplate() {
    const dictationVisible = this.windowManager?.isDictationPanelVisible?.() ?? false;

    return [
      {
        label: dictationVisible ? "Hide Dictation Panel" : "Show Dictation Panel",
        click: () => {
          if (!this.windowManager) return;
          if (this.windowManager.isDictationPanelVisible()) {
            this.windowManager.hideDictationPanel();
          } else {
            this.windowManager.showDictationPanel({ focus: true });
          }
          this.updateTrayMenu();
        },
      },
      {
        label: "Open Control Panel",
        click: async () => {
          await this.showControlPanelFromTray();
        },
      },
      { type: "separator" },
      {
        label: "Quit OpenWhispr",
        click: () => {
          console.log("Quitting app via tray menu");
          app.quit();
        },
      },
    ];
  }

  updateTrayMenu() {
    if (!this.tray) return;

    const contextMenu = Menu.buildFromTemplate(this.buildContextMenuTemplate());
    this.tray.setToolTip("OpenWhispr - Voice Dictation");
    this.tray.setContextMenu(contextMenu);
  }

  setupTrayEventHandlers() {
    if (!this.tray) {
      return;
    }

    if (process.platform === "win32") {
      this.tray.on("click", () => {
        void this.showControlPanelFromTray();
      });
      this.tray.on("right-click", () => {
        this.tray?.popUpContextMenu();
      });
    } else {
      this.tray.on("click", () => {
        this.tray?.popUpContextMenu();
      });
    }

    this.tray.on("destroyed", () => {
      console.log("Tray icon destroyed");
      this.tray = null;
    });
  }
}

module.exports = TrayManager;
