# 🔧 QUICK FIX: Server Not Working

**Issue**: Claude Remote Access server won't start
**Root Cause**: Missing environment variables in `.env`
**احسان Status**: ✅ Easy fix (2 minutes)

---

## ❌ **The Problem**

Your `.env` file is missing these required variables:

```
ANTHROPIC_API_KEY=     ← MISSING
REMOTE_USERNAME=       ← MISSING
REMOTE_PASSWORD=       ← MISSING
```

The server **requires** these to start.

---

## ✅ **The Solution (2 Minutes)**

### **Step 1: Get Your Anthropic API Key**

1. Go to: https://console.anthropic.com/settings/keys
2. Create a new key (or use existing)
3. Copy the key (starts with `sk-ant-...`)

### **Step 2: Add Variables to .env**

Open `C:\BIZRA-NODE0\.env` and add these lines at the **bottom**:

```bash
# Claude Remote Access Configuration
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
REMOTE_USERNAME=momo
REMOTE_PASSWORD=YourSecurePassword123!
REMOTE_PORT=3006
```

**Important**:

- Replace `sk-ant-your-actual-key-here` with your **actual** Anthropic API key
- Replace `YourSecurePassword123!` with a **strong password** (min 12 chars)
- Keep `REMOTE_USERNAME=momo` (your founder username)

### **Step 3: Save and Start Server**

```bash
cd server/claude-remote
npm start
```

**Expected Output**:

```
╔═══════════════════════════════════════════════════════════╗
║  Claude Remote Access Server                              ║
║  احسان-Compliant Remote Access                             ║
╚═══════════════════════════════════════════════════════════╝

✅ Server running on port 3006
✅ Claude API: Connected
✅ WebSocket: Ready
✅ Authentication: JWT (7 day expiration)
✅ احسان monitoring: Enabled
```

### **Step 4: Access from Browser**

Open: http://localhost:3006

**Login**:

- Username: `momo`
- Password: (whatever you set for REMOTE_PASSWORD)

---

## 🚀 **Quick Commands**

```bash
# Add variables (manual edit)
notepad .env

# Or copy template
echo. >> .env
echo # Claude Remote Access Configuration >> .env
echo ANTHROPIC_API_KEY=sk-ant-your-key-here >> .env
echo REMOTE_USERNAME=momo >> .env
echo REMOTE_PASSWORD=YourPassword123! >> .env
echo REMOTE_PORT=3006 >> .env

# Start server
cd server/claude-remote && npm start
```

---

## ✅ **Verification Checklist**

After adding variables, verify:

```bash
# Check .env has the variables
grep "ANTHROPIC_API_KEY" .env
grep "REMOTE_USERNAME" .env
grep "REMOTE_PASSWORD" .env

# All three should return lines (not empty)
```

---

## 🔐 **Security Reminder**

**احسان Compliance**:

- ✅ Never commit `.env` to git (already in `.gitignore`)
- ✅ Use strong password (12+ characters, mix of letters/numbers/symbols)
- ✅ Keep API key secret
- ✅ Rotate credentials regularly

---

## 📝 **Complete .env Example**

Your `.env` should look like this (with your actual values):

```bash
NODE_ENV=development
PORT=8080

# ... (your existing variables)

# Claude Remote Access Configuration
ANTHROPIC_API_KEY=sk-ant-api03-abc123xyz789...  ← YOUR KEY
REMOTE_USERNAME=momo
REMOTE_PASSWORD=MyStrongPassword123!           ← YOUR PASSWORD
REMOTE_PORT=3006
JWT_SECRET=bizra-remote-jwt-secret-32-chars-minimum
```

---

## ❓ **Still Not Working?**

### **Issue: "ANTHROPIC_API_KEY not configured"**

- Check you saved `.env` file
- Check no typos in variable name
- Check API key is complete (starts with `sk-ant-`)
- Try: `node -e "require('dotenv').config(); console.log(process.env.ANTHROPIC_API_KEY)"`

### **Issue: "Port 3006 already in use"**

```bash
# Find what's using port 3006
netstat -ano | findstr :3006

# Kill the process
taskkill /PID <PID_NUMBER> /F
```

### **Issue: "Invalid credentials"**

- Check `REMOTE_USERNAME=momo` (lowercase)
- Check `REMOTE_PASSWORD` matches what you set
- Try changing password to something simple for testing

---

## 🎯 **Next Steps After Fix**

Once server is running:

1. **Access UI**: http://localhost:3006
2. **Login**: momo / (your password)
3. **Test Claude**: Send a message
4. **Check احسان**: Bottom-right badge shows احسان score
5. **Celebrate**: You now have remote Claude access! 🎉

---

**الحمد لله**

**Need more help? Check**:

- `server/claude-remote/SETUP-GUIDE.md` - Full setup guide
- `OPERATIONAL-EXCELLENCE-RUNBOOK.md` - Troubleshooting section
