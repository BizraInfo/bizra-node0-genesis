/**
 * BIZRA NODE0 - Electron Preload Script
 * احسان Standard: Secure Context Bridge
 *
 * Security:
 * - contextIsolation: true
 * - nodeIntegration: false
 * - Exposes only safe APIs via contextBridge
 */

const { contextBridge, ipcRenderer } = require("electron");

/**
 * احسان API - Secure renderer-main communication
 */
contextBridge.exposeInMainWorld("احسانAPI", {
  // Metrics
  fetchMetrics: () => ipcRenderer.invoke("fetch-metrics"),

  // Evidence Collection
  exportEvidence: () => ipcRenderer.invoke("export-evidence"),

  // Drop Zone
  getDropZoneFiles: () => ipcRenderer.invoke("get-drop-zone-files"),
  openDropZone: () => ipcRenderer.invoke("open-drop-zone"),

  // Event Listeners
  onRefreshMetrics: (callback) => {
    ipcRenderer.on("refresh-metrics", callback);
  },
  removeRefreshMetricsListener: (callback) => {
    ipcRenderer.removeListener("refresh-metrics", callback);
  },

  // Platform Info
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
});

// احسان: Log preload initialization
console.log("احسان Preload initialized - Context bridge established");
