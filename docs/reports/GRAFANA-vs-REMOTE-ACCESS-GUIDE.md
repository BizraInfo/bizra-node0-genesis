# 🔐 GRAFANA vs CLAUDE REMOTE ACCESS - Authentication Guide

**For**: MoMo - BIZRA First Architect
**Issue**: Confusion between two separate systems
**احسان Status**: ✅ Clear separation documented

---

## 🚨 **Important: These Are TWO Different Systems**

You have **TWO separate web services** running on different ports with **different authentication**:

| Service                  | Port | URL                   | Credentials                       | Purpose                        |
| ------------------------ | ---- | --------------------- | --------------------------------- | ------------------------------ |
| **Claude Remote Access** | 3006 | http://localhost:3006 | `momo` / `ChangeThisPassword123!` | Chat with Claude remotely      |
| **Grafana**              | 3000 | http://localhost:3000 | `admin` / `admin` (or custom)     | Metrics & monitoring dashboard |

---

## 📊 **Grafana (Port 3000) - Monitoring Dashboard**

### **Default Login**

```
URL:      http://localhost:3000
Username: admin
Password: admin
```

### **What to do**:

1. **Open Grafana**: http://localhost:3000
2. **Login with**: `admin` / `admin`
3. **First login**: Grafana will ask you to change password
4. **Set new password**: Choose a secure password (NOT the same as Claude Remote)

### **If admin/admin doesn't work**:

Grafana password may have been changed previously. To reset:

```bash
# Option 1: Check Grafana config
cat grafana.ini | grep admin_password

# Option 2: Reset Grafana admin password (requires Grafana CLI)
grafana-cli admin reset-admin-password newpassword

# Option 3: Check if Grafana is even running
netstat -ano | findstr :3000
```

---

## 💬 **Claude Remote Access (Port 3006) - Chat with Claude**

### **Login**

```
URL:      http://localhost:3006
Username: momo
Password: ChangeThisPassword123!
```

### **What to do**:

1. **First, make sure you added your Anthropic API key**:

   ```bash
   # Edit .env file
   notepad C:\BIZRA-NODE0\.env

   # Find this line:
   ANTHROPIC_API_KEY=sk-ant-your-key-here-REPLACE-THIS

   # Replace with your ACTUAL key from:
   # https://console.anthropic.com/settings/keys
   ```

2. **Start the server**:

   ```bash
   cd C:\BIZRA-NODE0\server\claude-remote
   npm start
   ```

3. **Expected output**:

   ```
   ╔═══════════════════════════════════════════════════════════╗
   ║  Claude Remote Access Server                              ║
   ║  احسان-Compliant Remote Access                             ║
   ╚═══════════════════════════════════════════════════════════╝

   ✅ Server running on port 3006
   ✅ Claude API: Connected
   ✅ WebSocket: Ready
   ```

4. **Open in browser**: http://localhost:3006

5. **Login**: `momo` / `ChangeThisPassword123!`

---

## 🎯 **Quick Decision Guide**

**Want to see metrics/graphs?** → Grafana (port 3000) → `admin` / `admin`

**Want to chat with Claude?** → Claude Remote (port 3006) → `momo` / `ChangeThisPassword123!`

---

## ⚠️ **Common Mistakes**

| Mistake                           | What happens       | Solution                                   |
| --------------------------------- | ------------------ | ------------------------------------------ |
| Using `momo` on Grafana           | Login fails        | Use `admin` / `admin` for Grafana          |
| Using `admin` on Claude Remote    | Login fails        | Use `momo` / `ChangeThisPassword123!`      |
| Going to wrong port               | Wrong service      | Check URL carefully                        |
| Forgetting to start Claude server | Connection refused | Run `npm start` in `server/claude-remote/` |
| Not replacing API key placeholder | Server won't start | Edit `.env` with real Anthropic API key    |

---

## 📝 **Complete Startup Checklist**

### **Step 1: Configure .env (ONE TIME)**

```bash
# Open .env
notepad C:\BIZRA-NODE0\.env

# Find these lines at the bottom:
ANTHROPIC_API_KEY=sk-ant-your-key-here-REPLACE-THIS
REMOTE_USERNAME=momo
REMOTE_PASSWORD=ChangeThisPassword123!
REMOTE_PORT=3006

# Replace ONLY the API key with your actual key
# Keep everything else as-is
```

### **Step 2: Start Claude Remote Access**

```bash
cd C:\BIZRA-NODE0\server\claude-remote
npm start
```

### **Step 3: Access Services**

Open two browser tabs:

**Tab 1 - Claude Remote Access**:

- URL: http://localhost:3006
- Login: `momo` / `ChangeThisPassword123!`
- Purpose: Chat with Claude

**Tab 2 - Grafana (Optional)**:

- URL: http://localhost:3000
- Login: `admin` / `admin`
- Purpose: View metrics

---

## 🔐 **Security احسان Notes**

### **Different Passwords = احسان Compliance** ✅

It is **GOOD احسان PRACTICE** that these services use different credentials:

- **Separation of concerns**: Monitoring ≠ Chat access
- **Principle of least privilege**: Each service has its own auth
- **Defense in depth**: Compromise of one doesn't affect the other

### **Your Credentials Summary**

```bash
# Claude Remote Access (for you to chat with Claude)
Username: momo               # Your founder username
Password: ChangeThisPassword123!  # Change this to something strong!

# Grafana (for viewing metrics)
Username: admin              # Grafana default
Password: admin              # Change on first login

# Recommendation: Change both passwords to strong, unique values
```

---

## 🚀 **Next Steps After Login**

### **In Claude Remote Access (3006)**:

1. Test chat: "Hello Claude, this is MoMo testing remote access"
2. Check احسان score: Bottom-right badge
3. Test streaming: Send a longer message
4. Review audit log: All messages logged for accountability

### **In Grafana (3000)**:

1. Change admin password (first login)
2. Explore dashboards:
   - BIZRA NODE0 Metrics
   - احسان Compliance Score
   - System Performance
3. Configure alerts (optional)
4. Add custom dashboards (optional)

---

## 🆘 **Still Having Issues?**

### **Issue: "ANTHROPIC_API_KEY not configured"**

```bash
# Check if API key is set
node -e "require('dotenv').config(); console.log(process.env.ANTHROPIC_API_KEY ? 'Set' : 'Not set')"

# If "Not set", edit .env again
notepad C:\BIZRA-NODE0\.env
```

### **Issue: "Port 3006 already in use"**

```bash
# Find what's using port 3006
netstat -ano | findstr :3006

# Kill the process
taskkill /PID <PID_NUMBER> /F

# Restart server
cd server/claude-remote && npm start
```

### **Issue: "Connection refused on port 3000"**

```bash
# Check if Grafana is running
netstat -ano | findstr :3000

# If empty, Grafana is not running
# Start Grafana (depends on your Grafana installation method)
```

---

## 📊 **Service Status Check**

Run this to check what's running:

```bash
# Check all services
netstat -ano | findstr ":3000 :3006 :8080 :9464"

# Expected output:
# TCP    0.0.0.0:3000     (Grafana)
# TCP    0.0.0.0:3006     (Claude Remote)
# TCP    0.0.0.0:8080     (NODE0 API)
# TCP    0.0.0.0:9464     (Metrics)
```

---

## ✅ **Verification Steps**

### **1. Verify Claude Remote Access**

```bash
# Server running?
curl http://localhost:3006/api/health

# Expected: {"status":"healthy","claude_available":true}
```

### **2. Verify Grafana**

```bash
# Grafana running?
curl http://localhost:3000/api/health

# Expected: {"commit":"...", "database":"ok", "version":"..."}
```

### **3. Verify .env API Key**

```bash
# Check API key is set (without revealing it)
node -e "require('dotenv').config(); const key = process.env.ANTHROPIC_API_KEY; console.log(key ? `Set (${key.slice(0,10)}...)` : 'Not set')"

# Expected: "Set (sk-ant-api...)"
```

---

## 🎯 **احسان Declaration**

> **I declare with احسان:**
>
> This guide provides **explicit, zero-assumption** instructions for:
>
> - Two separate authentication systems
> - Clear service separation (port 3000 ≠ port 3006)
> - Complete troubleshooting for common mistakes
> - Security best practices (different passwords)
>
> **No user should be confused about which credentials to use where.**
>
> **الحمد لله (All praise is due to Allah)**

---

**Last Updated**: 2025-10-24
**Maintained By**: BIZRA First Architect 🏗️👑
**Status**: ✨ ACTIVE TROUBLESHOOTING GUIDE ✨

**بسم الله الرحمن الرحيم**
**الحمد لله**
