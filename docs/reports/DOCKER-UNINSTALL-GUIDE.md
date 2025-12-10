# Docker Uninstall Guide - Windows

**Date:** 2025-10-19
**Reason:** Multiple Docker Desktop installations detected (3 copies)
**Impact:** Alpha Testnet deployment halted

---

## ⚠️ IMPORTANT: Deployment Status

**Deployment was halted at user request to uninstall Docker.**

- Phase completed: 1/7 (Pre-deployment validation)
- Phase interrupted: 2/7 (Docker image build - Rust compilation)
- Containers stopped: All BIZRA monitoring containers
- Status: **DEPLOYMENT SUSPENDED**

---

## Step 1: Stop Docker Desktop

**Option A: Via Windows GUI**

1. Right-click Docker Desktop icon in system tray
2. Click "Quit Docker Desktop"
3. Wait for Docker to fully shut down

**Option B: Via PowerShell (Run as Administrator)**

```powershell
# Stop Docker Desktop service
Stop-Service -Name "com.docker.service" -Force

# Stop Docker Desktop process
Get-Process "*docker*" | Stop-Process -Force
```

---

## Step 2: Uninstall All Docker Desktop Installations

### Method 1: Windows Settings (Recommended)

**For each Docker installation:**

1. Open **Windows Settings** (Win + I)
2. Go to **Apps** → **Installed apps**
3. Search for "Docker"
4. Click the three dots (**...**) next to each Docker installation
5. Click **Uninstall**
6. Follow the uninstall wizard
7. Repeat for all 3 Docker installations

**Expected entries:**

- Docker Desktop
- Docker Desktop (if duplicate)
- Docker Desktop (if second duplicate)

---

### Method 2: PowerShell (Run as Administrator)

```powershell
# List all Docker-related programs
Get-WmiObject -Class Win32_Product | Where-Object { $_.Name -like "*Docker*" } | Select-Object Name, Version

# Uninstall each Docker installation
# Note: This will prompt for each installation
Get-WmiObject -Class Win32_Product | Where-Object { $_.Name -like "*Docker*" } | ForEach-Object {
    Write-Host "Uninstalling: $($_.Name) - Version $($_.Version)"
    $_.Uninstall()
}
```

---

### Method 3: Control Panel (Traditional)

1. Open **Control Panel**
2. Go to **Programs** → **Programs and Features**
3. Find all "Docker Desktop" entries
4. Right-click each → **Uninstall**
5. Follow the uninstall wizard for each

---

## Step 3: Remove Docker Residual Files

**After uninstalling, clean up leftover files:**

### PowerShell Commands (Run as Administrator)

```powershell
# Remove Docker program data
Remove-Item -Path "$env:ProgramData\Docker" -Recurse -Force -ErrorAction SilentlyContinue

# Remove Docker roaming data
Remove-Item -Path "$env:APPDATA\Docker" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:APPDATA\Docker Desktop" -Recurse -Force -ErrorAction SilentlyContinue

# Remove Docker local data
Remove-Item -Path "$env:LOCALAPPDATA\Docker" -Recurse -Force -ErrorAction SilentlyContinue

# Remove Docker WSL2 data
wsl --unregister docker-desktop
wsl --unregister docker-desktop-data

# Remove Docker .docker folder from user directory
Remove-Item -Path "$env:USERPROFILE\.docker" -Recurse -Force -ErrorAction SilentlyContinue

# Clean up Windows features (if Docker installed Hyper-V)
# Note: Only run if you don't use Hyper-V for other purposes
# Disable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All -NoRestart
```

---

## Step 4: Verify Complete Removal

### Check for Remaining Docker Processes

```powershell
# Check for Docker processes
Get-Process "*docker*" -ErrorAction SilentlyContinue

# Should return: "Get-Process : Cannot find a process with the name"
# If processes found, force terminate:
Get-Process "*docker*" | Stop-Process -Force
```

### Check for Docker Services

```powershell
# Check for Docker services
Get-Service "*docker*" -ErrorAction SilentlyContinue

# If services found, remove them:
sc.exe delete "com.docker.service"
sc.exe delete "Docker"
```

### Check for Docker Network Adapters

```powershell
# List network adapters
Get-NetAdapter | Where-Object { $_.Name -like "*Docker*" }

# Remove Docker network adapters if found
Get-NetAdapter | Where-Object { $_.Name -like "*Docker*" } | Remove-NetAdapter -Confirm:$false
```

---

## Step 5: Clean Registry (Optional - Advanced)

**⚠️ WARNING: Editing registry can be dangerous. Back up first!**

```powershell
# Backup registry
reg export HKLM\SOFTWARE\Docker C:\docker-registry-backup.reg

# Remove Docker registry keys
reg delete "HKLM\SOFTWARE\Docker" /f
reg delete "HKCU\SOFTWARE\Docker Inc." /f
reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Docker Desktop" /f
```

---

## Step 6: Restart Computer

**Recommended:** Restart Windows to complete the uninstallation.

```powershell
# Restart computer
Restart-Computer -Force
```

---

## Verification Checklist

After restart, verify complete removal:

- [ ] No Docker Desktop icon in system tray
- [ ] No Docker in Start Menu
- [ ] No Docker in "Installed apps"
- [ ] No Docker processes running: `Get-Process "*docker*"`
- [ ] No Docker services: `Get-Service "*docker*"`
- [ ] No Docker folders:
  - [ ] `C:\Program Files\Docker`
  - [ ] `C:\ProgramData\Docker`
  - [ ] `%APPDATA%\Docker`
  - [ ] `%LOCALAPPDATA%\Docker`
  - [ ] `%USERPROFILE%\.docker`
- [ ] WSL distributions removed: `wsl --list`

---

## Post-Uninstall: Deployment Options

### Option 1: Reinstall Docker Desktop (Single Clean Installation)

**If you want to continue with containerized deployment:**

1. Download latest Docker Desktop: https://www.docker.com/products/docker-desktop
2. Install once (avoid multiple installations)
3. Restart computer
4. Resume deployment from Phase 2 (Docker build)

**Resume command:**

```bash
cd C:\BIZRA-NODE0
docker build -t bizra-node:v2.2.0-rc1 \
  --build-arg BIZRA_USE_RUST=true \
  --build-arg GIT_COMMIT=a8dc831 \
  .
```

---

### Option 2: Deploy Without Docker (Native Deployment)

**Alternative: Deploy directly to Kubernetes without local Docker:**

1. Build Rust workspace locally:

   ```bash
   cd C:\BIZRA-NODE0\rust
   cargo build --release --workspace
   ```

2. Use pre-built images or remote Docker builder
3. Deploy directly to Kubernetes cluster with remote images

---

### Option 3: Use Alternative Container Runtime

**Instead of Docker Desktop, use:**

- **Podman Desktop** (Docker-compatible)
- **Rancher Desktop** (includes k3s Kubernetes)
- **Colima** (lightweight container runtime)

---

## Troubleshooting

### "Access Denied" Errors

**Solution:** Run PowerShell as Administrator

```powershell
Start-Process powershell -Verb RunAs
```

### Uninstall Fails

**Solution:** Use Docker's official uninstall tool

```powershell
# Download Docker uninstall utility
Invoke-WebRequest -Uri "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe" -OutFile "DockerInstaller.exe"

# Run with uninstall flag
.\DockerInstaller.exe uninstall
```

### WSL Issues After Removal

**Solution:** Reset WSL

```powershell
wsl --shutdown
wsl --unregister docker-desktop
wsl --unregister docker-desktop-data
```

---

## Files Affected by This Change

### Deployment Files (Preserved)

- ✅ All Rust source code (rust/)
- ✅ Kubernetes manifests (k8s/)
- ✅ Documentation (docs/)
- ✅ Build scripts (scripts/)
- ✅ Git repository (complete history)

### Deployment State (Lost)

- ❌ Docker image build (was in progress)
- ❌ Running containers (stopped and removed)
- ❌ Docker networks
- ❌ Docker volumes

---

## Re-Deployment After Docker Cleanup

**When ready to resume deployment with clean Docker installation:**

```bash
# Verify single Docker installation
docker --version

# Resume from Phase 2
cd C:\BIZRA-NODE0
./scripts/docker-build.ps1

# Or follow full deployment guide
cat DEPLOYMENT-STATUS-REALTIME.md
```

---

## احسان (Ihsan) Principle

**Cleanliness is part of excellence.**

Removing duplicate installations ensures:

- Reduced system resource usage
- No version conflicts
- Cleaner deployment environment
- Easier troubleshooting

---

## Summary

**What This Does:**

1. ✅ Stops all Docker containers
2. ✅ Uninstalls all 3 Docker Desktop installations
3. ✅ Removes Docker residual files
4. ✅ Cleans up WSL distributions
5. ✅ Frees up disk space
6. ✅ Prepares for clean reinstallation

**What This Preserves:**

- ✅ All BIZRA-NODE0 source code
- ✅ Git repository and history
- ✅ Documentation and guides
- ✅ Kubernetes manifests
- ✅ Deployment scripts

**Impact:**

- ⚠️ Alpha Testnet deployment suspended
- ⚠️ Monitoring containers stopped
- ℹ️ Can resume after clean Docker installation

---

**Status:** Ready to execute Docker uninstall.

**Next Action:** Follow steps 1-6 in this guide.

**احسان Compliance:** Clean system, clean deployment. ✨
