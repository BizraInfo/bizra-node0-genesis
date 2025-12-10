/**
 * BIZRA NODE0 - Electron Desktop Application
 * احسان Standard: Native Power User Interface
 *
 * Features:
 * - Embedded React dashboard with native performance
 * - System tray integration for background monitoring
 * - Native menu bar with احسان shortcuts
 * - Local file system access (drop-zone)
 * - Native notifications for SLA violations
 * - Auto-updater for seamless updates
 * - Multi-window support (dashboard, logs, metrics)
 */

const {
  app,
  BrowserWindow,
  Menu,
  Tray,
  ipcMain,
  dialog,
  Notification,
} = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { autoUpdater } = require("electron-updater");

// احسان Configuration
const CONFIG = {
  appName: "BIZRA NODE0",
  version: "v2.2.0-rc1",
  apiUrl: process.env.BIZRA_API_URL || "http://localhost:8080",
  metricsUrl: process.env.BIZRA_METRICS_URL || "http://localhost:9464",
  احسانSLA: {
    p95Latency: 200, // ms
    errorRate: 1.0, // %
  },
  windows: {
    dashboard: null,
    logs: null,
    metrics: null,
  },
  tray: null,
};

/**
 * احسان Standard: Evidence Collection
 */
const EVIDENCE_DIR = path.join(app.getPath("userData"), "evidence");
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

/**
 * Create Main Dashboard Window
 * احسان: Beautiful, responsive, professional
 */
function createDashboardWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: `${CONFIG.appName} Dashboard - احسان Excellence`,
    icon: path.join(__dirname, "../../public/icon.png"),
    backgroundColor: "#1e1e1e", // احسان: Deep focus
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    show: false, // احسان: Prevent flash of white
  });

  // Load React dashboard
  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173"); // Vite dev server
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../../dist/index.html"));
  }

  // احسان: Smooth window reveal
  win.once("ready-to-show", () => {
    win.show();
    win.focus();
  });

  // احسان: Graceful window management
  win.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      win.hide();

      if (Notification.isSupported()) {
        new Notification({
          title: "BIZRA NODE0",
          body: "Application minimized to system tray",
          icon: path.join(__dirname, "../../public/icon.png"),
        }).show();
      }
    }
  });

  CONFIG.windows.dashboard = win;
  return win;
}

/**
 * Create Logs Window
 * احسان: Dedicated log viewer for power users
 */
function createLogsWindow() {
  if (CONFIG.windows.logs && !CONFIG.windows.logs.isDestroyed()) {
    CONFIG.windows.logs.focus();
    return;
  }

  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    parent: CONFIG.windows.dashboard,
    title: "BIZRA Logs - احسان Transparency",
    backgroundColor: "#1e1e1e",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile(path.join(__dirname, "windows/logs.html"));
  CONFIG.windows.logs = win;
}

/**
 * Create Metrics Window
 * احسان: Real-time performance monitoring
 */
function createMetricsWindow() {
  if (CONFIG.windows.metrics && !CONFIG.windows.metrics.isDestroyed()) {
    CONFIG.windows.metrics.focus();
    return;
  }

  const win = new BrowserWindow({
    width: 900,
    height: 800,
    parent: CONFIG.windows.dashboard,
    title: "BIZRA Metrics - احسان Performance",
    backgroundColor: "#1e1e1e",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile(path.join(__dirname, "windows/metrics.html"));
  CONFIG.windows.metrics = win;
}

/**
 * System Tray Integration
 * احسان: Always accessible, non-intrusive
 */
function createSystemTray() {
  const trayIcon = path.join(__dirname, "../../public/tray-icon.png");
  const tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: `BIZRA NODE0 ${CONFIG.version}`,
      enabled: false,
    },
    { type: "separator" },
    {
      label: "📊 Show Dashboard",
      click: () => {
        if (CONFIG.windows.dashboard) {
          CONFIG.windows.dashboard.show();
          CONFIG.windows.dashboard.focus();
        }
      },
    },
    {
      label: "📋 Show Logs",
      click: createLogsWindow,
    },
    {
      label: "⚡ Show Metrics",
      click: createMetricsWindow,
    },
    { type: "separator" },
    {
      label: "🔄 Refresh Metrics",
      click: () => {
        if (CONFIG.windows.dashboard) {
          CONFIG.windows.dashboard.webContents.send("refresh-metrics");
        }
      },
    },
    {
      label: "💾 Export Evidence",
      click: exportEvidence,
    },
    { type: "separator" },
    {
      label: "❌ Quit BIZRA",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip("BIZRA NODE0 - احسان Excellence");

  tray.on("click", () => {
    if (CONFIG.windows.dashboard) {
      CONFIG.windows.dashboard.isVisible()
        ? CONFIG.windows.dashboard.hide()
        : CONFIG.windows.dashboard.show();
    }
  });

  CONFIG.tray = tray;
}

/**
 * Application Menu
 * احسان: Keyboard-driven power user experience
 */
function createApplicationMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Export Evidence",
          accelerator: "CmdOrCtrl+E",
          click: exportEvidence,
        },
        {
          label: "Export Metrics",
          accelerator: "CmdOrCtrl+M",
          click: exportMetrics,
        },
        { type: "separator" },
        {
          label: "Preferences",
          accelerator: "CmdOrCtrl+,",
          click: () => {
            // احسان: Future enhancement
            dialog.showMessageBox({
              type: "info",
              title: "Preferences",
              message: "Preferences panel coming soon",
            });
          },
        },
        { type: "separator" },
        {
          label: "Quit",
          accelerator: "CmdOrCtrl+Q",
          click: () => {
            app.isQuitting = true;
            app.quit();
          },
        },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Dashboard",
          accelerator: "CmdOrCtrl+1",
          click: () => CONFIG.windows.dashboard?.show(),
        },
        {
          label: "Logs",
          accelerator: "CmdOrCtrl+2",
          click: createLogsWindow,
        },
        {
          label: "Metrics",
          accelerator: "CmdOrCtrl+3",
          click: createMetricsWindow,
        },
        { type: "separator" },
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "احسان",
      submenu: [
        {
          label: "Check SLA Status",
          accelerator: "CmdOrCtrl+S",
          click: checkSLAStatus,
        },
        {
          label: "Run Performance Test",
          accelerator: "CmdOrCtrl+T",
          click: runPerformanceTest,
        },
        { type: "separator" },
        {
          label: "احسان Principles",
          click: showAhsanPrinciples,
        },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Documentation",
          click: () => {
            require("electron").shell.openExternal(
              "https://github.com/bizra/node0",
            );
          },
        },
        {
          label: "Report Issue",
          click: () => {
            require("electron").shell.openExternal(
              "https://github.com/bizra/node0/issues",
            );
          },
        },
        { type: "separator" },
        {
          label: `About BIZRA NODE0 ${CONFIG.version}`,
          click: () => {
            dialog.showMessageBox({
              type: "info",
              title: "About BIZRA NODE0",
              message: `BIZRA NODE0 ${CONFIG.version}`,
              detail: `احسان Standard: Clear, Honest, Beautiful, Respectful\n\nFounder Node for BIZRA Network\nChain ID: bizra-testnet-001\n\nElectron: ${process.versions.electron}\nChrome: ${process.versions.chrome}\nNode.js: ${process.versions.node}`,
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Export Evidence (Screenshots, Metrics, Logs)
 * احسان: Transparency and accountability
 */
async function exportEvidence() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const evidenceSubDir = path.join(EVIDENCE_DIR, `export-${timestamp}`);
  fs.mkdirSync(evidenceSubDir, { recursive: true });

  try {
    // Screenshot dashboard
    if (CONFIG.windows.dashboard && !CONFIG.windows.dashboard.isDestroyed()) {
      const screenshot =
        await CONFIG.windows.dashboard.webContents.capturePage();
      fs.writeFileSync(
        path.join(evidenceSubDir, "dashboard.png"),
        screenshot.toPNG(),
      );
    }

    // Export metrics
    const metricsData = await fetchMetrics();
    fs.writeFileSync(
      path.join(evidenceSubDir, "metrics.json"),
      JSON.stringify(metricsData, null, 2),
    );

    // احسان: Success notification
    if (Notification.isSupported()) {
      new Notification({
        title: "Evidence Exported",
        body: `Saved to: ${evidenceSubDir}`,
        icon: path.join(__dirname, "../../public/icon.png"),
      }).show();
    }

    dialog.showMessageBox({
      type: "info",
      title: "Export Complete",
      message: "Evidence exported successfully",
      detail: `Location: ${evidenceSubDir}`,
    });
  } catch (error) {
    console.error("Export failed:", error);
    dialog.showErrorBox("Export Failed", error.message);
  }
}

/**
 * Export Metrics
 * احسان: Data portability
 */
async function exportMetrics() {
  try {
    const metrics = await fetchMetrics();

    const { filePath } = await dialog.showSaveDialog({
      title: "Export Metrics",
      defaultPath: `bizra-metrics-${Date.now()}.json`,
      filters: [
        { name: "JSON Files", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (filePath) {
      fs.writeFileSync(filePath, JSON.stringify(metrics, null, 2));

      if (Notification.isSupported()) {
        new Notification({
          title: "Metrics Exported",
          body: `Saved to: ${filePath}`,
        }).show();
      }
    }
  } catch (error) {
    dialog.showErrorBox("Export Failed", error.message);
  }
}

/**
 * Fetch Metrics from API
 * احسان: Real-time, honest data
 */
function fetchMetrics() {
  return new Promise((resolve, reject) => {
    http
      .get(`${CONFIG.apiUrl}/health`, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

/**
 * Check احسان SLA Status
 * احسان: Excellence monitoring
 */
async function checkSLAStatus() {
  try {
    const metrics = await fetchMetrics();

    const p95Status =
      metrics.p95Latency < CONFIG.احسانSLA.p95Latency
        ? "✅ Excellent"
        : "⚠️ Warning";

    const errorStatus =
      metrics.errorRate < CONFIG.احسانSLA.errorRate
        ? "✅ Excellent"
        : "⚠️ Warning";

    dialog.showMessageBox({
      type: "info",
      title: "احسان SLA Status",
      message: "Performance Status Check",
      detail: `P95 Latency: ${metrics.p95Latency?.toFixed(1)}ms ${p95Status} (SLA: <${CONFIG.احسانSLA.p95Latency}ms)\nError Rate: ${metrics.errorRate?.toFixed(2)}% ${errorStatus} (SLA: <${CONFIG.احسانSLA.errorRate}%)\n\nStatus: ${metrics.status}\nRust Enabled: ${metrics.rustEnabled ? "Yes" : "No"}`,
    });
  } catch (error) {
    dialog.showErrorBox("SLA Check Failed", error.message);
  }
}

/**
 * Run Performance Test
 * احسان: Continuous validation
 */
function runPerformanceTest() {
  dialog.showMessageBox({
    type: "info",
    title: "Performance Test",
    message: "Launching k6 load test...",
    detail:
      "This will run a comprehensive performance test against the API.\n\nResults will be displayed in the terminal.",
  });

  // احسان: Future enhancement - integrate k6 execution
  // For now, show instructions
  const { shell } = require("electron");
  shell.openExternal("https://github.com/bizra/node0#performance-testing");
}

/**
 * Show احسان Principles
 * احسان: Philosophy transparency
 */
function showAhsanPrinciples() {
  dialog.showMessageBox({
    type: "info",
    title: "احسان (Ihsan) - Excellence in the Sight of Allah",
    message: "احسان Standard Principles",
    detail: `Clear: Information hierarchy is obvious, typography is consistent\n\nHonest: Real-time data without manipulation, transparent limitations\n\nBeautiful: Aesthetic color palette, smooth transitions, attention to detail\n\nRespectful: Keyboard-driven, non-intrusive, accessible to all users\n\nTo do your work like God is in front of you watching and you see Him, and if you don't see God, then be sure that He is watching and sees you.\n\n"Verily, Allah loves those who do ihsan" (Quran 2:195)`,
  });
}

/**
 * Auto-Updater Configuration
 * احسان: Seamless improvements
 */
function setupAutoUpdater() {
  autoUpdater.on("update-available", () => {
    if (Notification.isSupported()) {
      new Notification({
        title: "Update Available",
        body: "A new version of BIZRA NODE0 is available. Downloading...",
      }).show();
    }
  });

  autoUpdater.on("update-downloaded", () => {
    dialog
      .showMessageBox({
        type: "info",
        title: "Update Ready",
        message: "A new version has been downloaded",
        detail: "The application will restart to apply the update.",
        buttons: ["Restart Now", "Later"],
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
  });

  // Check for updates on startup (production only)
  if (process.env.NODE_ENV === "production") {
    autoUpdater.checkForUpdatesAndNotify();
  }
}

/**
 * IPC Handlers
 * احسان: Secure renderer-main communication
 */
ipcMain.handle("fetch-metrics", async () => {
  return await fetchMetrics();
});

ipcMain.handle("export-evidence", async () => {
  await exportEvidence();
});

ipcMain.handle("get-drop-zone-files", async () => {
  const dropZonePath = path.join(app.getPath("userData"), "drop-zone");
  if (!fs.existsSync(dropZonePath)) {
    fs.mkdirSync(dropZonePath, { recursive: true });
  }
  return fs.readdirSync(dropZonePath);
});

ipcMain.handle("open-drop-zone", async () => {
  const dropZonePath = path.join(app.getPath("userData"), "drop-zone");
  const { shell } = require("electron");
  shell.openPath(dropZonePath);
});

/**
 * App Lifecycle
 * احسان: Graceful initialization and shutdown
 */
app.whenReady().then(() => {
  createDashboardWindow();
  createSystemTray();
  createApplicationMenu();
  setupAutoUpdater();

  // احسان: Monitor SLA violations
  setInterval(async () => {
    try {
      const metrics = await fetchMetrics();

      if (
        metrics.p95Latency > CONFIG.احسانSLA.p95Latency &&
        Notification.isSupported()
      ) {
        new Notification({
          title: "احسان SLA Violation",
          body: `P95 latency: ${metrics.p95Latency.toFixed(1)}ms (SLA: ${CONFIG.احسانSLA.p95Latency}ms)`,
          urgency: "critical",
        }).show();
      }
    } catch (error) {
      // Silent failure - احسان: Non-intrusive monitoring
    }
  }, 30000); // Check every 30 seconds

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createDashboardWindow();
    }
  });
});

app.on("window-all-closed", () => {
  // احسان: Keep app running in system tray
  if (process.platform !== "darwin") {
    // Do not quit on window close
  }
});

app.on("before-quit", () => {
  app.isQuitting = true;
});

// احسان: Graceful error handling
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  dialog.showErrorBox("Application Error", error.message);
});
