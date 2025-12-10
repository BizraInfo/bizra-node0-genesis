# BIZRA NODE0 - Desktop Application

**احسان Standard: Native Power User Interface**

## Overview

The BIZRA NODE0 desktop application is a native Electron-based power user interface that embeds the React dashboard with additional desktop-specific features:

- **System Tray Integration**: Background monitoring with quick access
- **Native Menu Bar**: Keyboard shortcuts for احسان workflows
- **Multi-Window Support**: Dedicated windows for dashboard, logs, and metrics
- **Local File System Access**: Drop-zone integration
- **Native Notifications**: احسان SLA violation alerts
- **Auto-Updater**: Seamless version updates
- **Evidence Collection**: Screenshot and export capabilities

## Architecture

```
src/desktop/
├── main.js              # Electron main process (Node.js)
├── preload.js           # Secure context bridge
├── windows/
│   ├── metrics.html     # Dedicated metrics window
│   └── logs.html        # Dedicated logs window
└── README.md            # This file
```

**Security Model**:

- `nodeIntegration: false` (no Node.js in renderer)
- `contextIsolation: true` (isolated contexts)
- `preload.js` exposes only safe APIs via `contextBridge`

**Multi-Process Architecture**:

- **Main Process**: `main.js` (Electron/Node.js)
- **Renderer Processes**:
  - Dashboard (React from `dist/index.html`)
  - Metrics window (`windows/metrics.html`)
  - Logs window (`windows/logs.html`)

## Installation

### Development

```bash
# Install dependencies
npm install

# Start with dashboard dev server
npm run dashboard:dev    # Terminal 1: Start Vite dev server
npm run desktop:dev      # Terminal 2: Start Electron
```

### Build for Production

```bash
# Build React dashboard first
npm run dashboard:build

# Build desktop app for all platforms
npm run desktop:build

# Or platform-specific builds:
npm run desktop:build:win      # Windows (NSIS + Portable)
npm run desktop:build:mac      # macOS (DMG + ZIP)
npm run desktop:build:linux    # Linux (AppImage + DEB)
```

**Output**: `dist-desktop/` directory with installers

**Supported Platforms**:

- Windows (x64, arm64) - NSIS installer + Portable executable
- macOS (x64, arm64) - DMG installer + ZIP archive
- Linux (x64, arm64) - AppImage + DEB package

## Usage

### Keyboard Shortcuts

احسان Standard: Keyboard-driven power user experience

**File Menu**:

- `Ctrl/Cmd + E` - Export Evidence (screenshots + metrics)
- `Ctrl/Cmd + M` - Export Metrics (JSON)
- `Ctrl/Cmd + ,` - Preferences
- `Ctrl/Cmd + Q` - Quit Application

**View Menu**:

- `Ctrl/Cmd + 1` - Show Dashboard
- `Ctrl/Cmd + 2` - Show Logs Window
- `Ctrl/Cmd + 3` - Show Metrics Window
- `Ctrl/Cmd + R` - Reload Window
- `Ctrl/Cmd + Shift + R` - Force Reload
- `F12` - Toggle Developer Tools
- `Ctrl/Cmd + 0` - Reset Zoom
- `Ctrl/Cmd + +` - Zoom In
- `Ctrl/Cmd + -` - Zoom Out
- `F11` - Toggle Fullscreen

**احسان Menu**:

- `Ctrl/Cmd + S` - Check احسان SLA Status
- `Ctrl/Cmd + T` - Run Performance Test

### System Tray

The application runs in the system tray for background monitoring:

**Tray Icon Features**:

- Click to show/hide dashboard
- Right-click for context menu:
  - Show Dashboard
  - Show Logs
  - Show Metrics
  - Refresh Metrics
  - Export Evidence
  - Quit BIZRA

**احسان SLA Monitoring**:

- Automatic background monitoring every 30 seconds
- Native notifications on SLA violations (p95 > 200ms)
- Non-intrusive design (احسان: Respectful)

### Windows

**1. Dashboard Window** (Main)

- Embedded React dashboard with draggable panels
- Real-time metrics visualization
- Dark/Light theme toggle
- Auto-refresh every 2 seconds

**2. Metrics Window** (`Ctrl/Cmd + 3`)

- Dedicated performance metrics view
- Chart.js line charts for P95/P99 latency
- احسان SLA color coding (green/yellow/red)
- Performance history (last 30 samples)

**3. Logs Window** (`Ctrl/Cmd + 2`)

- Real-time log streaming
- Filter by level (INFO, SUCCESS, WARNING, ERROR, DEBUG)
- Text search filtering
- Export logs to file
- Auto-scroll (disables on manual scroll)

### احسان Features

**1. Evidence Collection** (`Ctrl/Cmd + E`)

```
evidence/
└── export-2025-10-20T09-30-00Z/
    ├── dashboard.png          # Dashboard screenshot
    └── metrics.json           # Full metrics snapshot
```

احسان Standard: Transparency and accountability through automated evidence collection.

**2. احسان SLA Status** (`Ctrl/Cmd + S`)

- Real-time SLA compliance check
- P95 Latency: ✅ Excellent (<200ms) or ⚠️ Warning
- Error Rate: ✅ Excellent (<1%) or ⚠️ Warning
- Rust PoI: Enabled/Disabled status

**3. احسان Principles Dialog**

- Access via: احسان Menu → احسان Principles
- Displays full احسان philosophy
- Quran citation: "Verily, Allah loves those who do ihsan" (2:195)

## Configuration

### Environment Variables

```bash
# API endpoints
BIZRA_API_URL=http://localhost:8080          # HTTP API
BIZRA_METRICS_URL=http://localhost:9464      # Prometheus metrics

# Development mode
NODE_ENV=development                         # Enable dev tools + Vite
```

### Drop Zone

The application exposes a local drop-zone directory:

**Location**: `<userData>/drop-zone`

- Windows: `%APPDATA%\bizra-node-0\drop-zone`
- macOS: `~/Library/Application Support/bizra-node-0/drop-zone`
- Linux: `~/.config/bizra-node-0/drop-zone`

**Access**:

- Via IPC: `window.احسانAPI.getDropZoneFiles()`
- Via native: `window.احسانAPI.openDropZone()` (opens in file explorer)

### Evidence Directory

احسان Standard: All evidence is stored locally for audit purposes.

**Location**: `<userData>/evidence`

- Windows: `%APPDATA%\bizra-node-0\evidence`
- macOS: `~/Library/Application Support/bizra-node-0/evidence`
- Linux: `~/.config/bizra-node-0/evidence`

**Contents**:

- Dashboard screenshots (PNG)
- Metrics snapshots (JSON)
- Exported logs (TXT)

## Auto-Updates

The application supports seamless auto-updates via GitHub Releases:

**Update Flow**:

1. On startup, check GitHub for new releases
2. If update available, show notification
3. Download update in background
4. Prompt user to restart (non-intrusive)
5. On restart, install update

**Configuration**:

- Updates enabled in production only (`NODE_ENV=production`)
- Update channel: GitHub Releases (ghcr.io/bizra/node-0)
- Update check interval: On startup + every 24 hours

احسان Standard: Updates enhance excellence without disruption.

## IPC Communication

The preload script (`preload.js`) exposes a secure احسانAPI:

```javascript
// Fetch metrics
const metrics = await window.احسانAPI.fetchMetrics();

// Export evidence
await window.احسانAPI.exportEvidence();

// Drop zone
const files = await window.احسانAPI.getDropZoneFiles();
await window.احسانAPI.openDropZone();

// Event listeners
window.احسانAPI.onRefreshMetrics((callback) => {
  console.log("Refresh event received");
});

// Platform info
console.log(window.احسانAPI.platform); // 'win32', 'darwin', 'linux'
console.log(window.احسانAPI.versions); // { electron, chrome, node }
```

احسان Standard: Security through context isolation and explicit APIs.

## Troubleshooting

### Common Issues

**1. "Application won't start"**

```bash
# Check Node.js version (requires >=16.0.0)
node --version

# Check Electron installation
npm list electron

# Reinstall dependencies
rm -rf node_modules
npm install
```

**2. "Dashboard not loading"**

```bash
# Build React dashboard first
npm run dashboard:build

# Check dist/ directory exists
ls dist/

# Development: Ensure Vite dev server is running
npm run dashboard:dev  # Port 5173
```

**3. "Metrics not updating"**

```bash
# Check API is running
curl http://localhost:8080/health

# Check firewall/network permissions
# Electron requires localhost:8080 and localhost:9464
```

**4. "Auto-updater not working"**

```bash
# Auto-updates only work in production
NODE_ENV=production npm run desktop

# Check GitHub releases configuration
# publish.provider=github, owner=bizra, repo=node-0
```

### Debug Mode

```bash
# Enable verbose logging
DEBUG=electron* npm run desktop:dev

# Open DevTools on startup (add to main.js)
win.webContents.openDevTools();
```

احسان Standard: Honest error reporting for rapid debugging.

## Development Guidelines

### احسان Principles

**Clear**: UI hierarchy is obvious, shortcuts are documented
**Honest**: Real-time data without manipulation, transparent errors
**Beautiful**: Native OS integration, smooth animations
**Respectful**: Keyboard-driven, non-intrusive notifications

### Code Style

```javascript
// احسان: Always add descriptive comments
function createDashboardWindow() {
  // احسان: Prevent flash of white background
  const win = new BrowserWindow({
    show: false,
    backgroundColor: "#1e1e1e",
  });

  // احسان: Smooth window reveal
  win.once("ready-to-show", () => {
    win.show();
  });
}
```

### Security Checklist

- ✅ `nodeIntegration: false` in all windows
- ✅ `contextIsolation: true` in all windows
- ✅ Preload script with `contextBridge` only
- ✅ No `remote` module usage
- ✅ Input validation on all IPC handlers
- ✅ CSP headers for web content

## Building for Distribution

### Prerequisites

**Windows**:

```bash
# Install NSIS (for installer creation)
choco install nsis

# Or download from: https://nsis.sourceforge.io/
```

**macOS**:

```bash
# Install code signing certificate (for distribution)
# Or use --mac.identity=null for unsigned builds
```

**Linux**:

```bash
# Install dependencies for AppImage creation
sudo apt-get install -y fuse libfuse2
```

### Build Commands

```bash
# 1. Build React dashboard (required first)
npm run dashboard:build

# 2. Build desktop app
npm run desktop:build          # All platforms
npm run desktop:build:win      # Windows only
npm run desktop:build:mac      # macOS only
npm run desktop:build:linux    # Linux only

# 3. Output location
ls dist-desktop/

# Example output:
# dist-desktop/
# ├── BIZRA NODE0-v2.2.0-rc1-win-x64.exe      (Windows installer)
# ├── BIZRA NODE0-v2.2.0-rc1-mac.dmg          (macOS installer)
# └── BIZRA NODE0-v2.2.0-rc1-linux-x64.AppImage
```

احسان Standard: Multi-platform excellence through Electron.

## احسان Design Tokens

The desktop app inherits احسان design tokens from the web dashboard:

```javascript
const COLORS = {
  primary: "#3498db", // Trust blue
  success: "#27ae60", // Growth green
  warning: "#f39c12", // Attention orange
  danger: "#e74c3c", // Alert red
  احسان: "#2ecc71", // Excellence green
  background: "#1e1e1e", // Deep focus
};
```

## Performance

**Startup Time**: ~1.5s (development), ~0.8s (production)
**Memory Usage**: ~150MB (base), ~300MB (with all windows)
**CPU Usage**: <5% (idle), ~10% (active metrics refresh)

احسان SLA: Desktop app maintains same p95 < 200ms target as web.

## License

MIT License - Copyright © 2025 BIZRA Team

## Support

- **Documentation**: https://github.com/bizra/node-0
- **Issues**: https://github.com/bizra/node-0/issues
- **Discord**: https://discord.gg/bizra

---

**احسان Standard**: Clear, Honest, Beautiful, Respectful

_"Verily, Allah loves those who do ihsan" (Quran 2:195)_
