# OpenWhispr Troubleshooting Guide

## Quick Diagnostic Commands

```bash
# Check your system architecture
uname -m          # Should show: arm64 (on Apple Silicon)

# Check Node.js architecture
node -p "process.arch"  # Should show: arm64 (on Apple Silicon)

# Check better-sqlite3 architecture
file node_modules/better-sqlite3/build/Release/better_sqlite3.node
# Should show: Mach-O 64-bit bundle arm64 (on Apple Silicon)

# Check OpenWhispr data location
ls -la "$HOME/Library/Application Support/OpenWhispr"
```

---

## Common Issues

### 1. Architecture Mismatch Error (Apple Silicon)

**Error Message:**
```
Database initialization failed: dlopen(...better_sqlite3.node...)
(mach-o file, but is an incompatible architecture (have 'x86_64', need 'arm64'))
```

**Cause:** Node.js or npm is running under Rosetta (Intel emulation) instead of native ARM64.

**Solution:**

1. **Check if Node is running in x64 mode:**
   ```bash
   node -p "process.arch"
   ```
   If it shows `x64` or `x86_64`, continue to step 2.

2. **Check if Terminal is using Rosetta:**
   - Quit Terminal
   - Go to Applications → Utilities → Terminal
   - Right-click Terminal → Get Info
   - **Uncheck** "Open using Rosetta"
   - Reopen Terminal

3. **Install ARM64 Node.js:**
   ```bash
   # Using nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc  # or ~/.zshrc
   nvm install --lts
   nvm use --lts

   # Verify
   node -p "process.arch"  # Should show: arm64
   ```

4. **Clean rebuild:**
   ```bash
   cd /path/to/open-whispr
   rm -rf node_modules package-lock.json
   npm install
   npm run dev
   ```

**For pnpm users:**
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm store prune
pnpm install
pnpm run dev
```

---

### 2. Microphone Prints "you" Instead of Transcription

**Symptoms:**
- Every recording transcribes to just "you"
- Works in production DMG but not in dev
- Started after installing production app

**Cause:** Corrupted database or settings conflict between production and dev environments.

**Solution:**

Run the complete cleanup script:
```bash
cd /path/to/open-whispr
bash scripts/complete-uninstall.sh
```

Then choose ONE mode:
- **Production**: Download fresh DMG
- **Development**: Clean install with `npm install && npm run dev`

See [CLEANUP_INSTRUCTIONS.md](CLEANUP_INSTRUCTIONS.md) for detailed steps.

---

### 3. FFmpeg Not Found

**Error Message:**
```
FFmpeg not available: Unknown error
```

**Cause:** FFmpeg bundled with the app is not being found or is not executable.

**Solution:**

1. **Check FFmpeg exists:**
   ```bash
   # In development
   ls -la node_modules/ffmpeg-static

   # In production
   ls -la /Applications/OpenWhispr.app/Contents/Resources/app.asar.unpacked/node_modules/ffmpeg-static
   ```

2. **Check if executable:**
   ```bash
   # Make sure it's executable
   chmod +x node_modules/ffmpeg-static/ffmpeg
   ```

3. **Run with debug mode:**
   ```bash
   npm run dev -- --debug
   ```
   Check logs in `~/Library/Application Support/OpenWhispr/logs/`

4. **Install FFmpeg globally (fallback):**
   ```bash
   # macOS with Homebrew
   brew install ffmpeg

   # Verify
   which ffmpeg
   ffmpeg -version
   ```

---

### 4. Python/Whisper Not Installed

**Error Message:**
```
Python executable not found
Whisper installation check failed
```

**Solution:**

1. **Auto-install Python:**
   OpenWhispr should auto-install Python on first run. If it fails:

   ```bash
   # Manually trigger Python installation via the app
   # Go to Settings → Local Whisper → Install Python
   ```

2. **Manual Python setup:**
   ```bash
   # Check if Python 3 exists
   which python3
   python3 --version

   # Install openai-whisper
   pip3 install openai-whisper

   # Verify
   python3 -c "import whisper; print('Whisper installed')"
   ```

3. **Check Python path:**
   ```bash
   # OpenWhispr looks for Python in these locations:
   # 1. ~/.openwhispr-python/bin/python3
   # 2. /usr/local/bin/python3
   # 3. /usr/bin/python3
   # 4. python3 in PATH
   ```

---

### 5. Production App Works, Dev Doesn't (or vice versa)

**Cause:** They share the same data directories but have different configurations.

**Solution:**

1. **Decide which mode you want:**
   - Development: Uninstall production app first
   - Production: Stop dev server and close project

2. **Run cleanup:**
   ```bash
   bash scripts/complete-uninstall.sh
   ```

3. **Fresh start:**
   ```bash
   # For development
   rm -rf node_modules package-lock.json
   npm install
   npm run dev

   # For production
   # Download and install fresh DMG
   ```

**Explanation:**

Both modes use the same data locations:
- `~/Library/Application Support/OpenWhispr/` (databases, settings, logs)
- `~/Library/Preferences/com.openwhispr.app.plist` (system prefs)
- `~/.cache/whisper/` (downloaded models)

Running both simultaneously or switching between them can cause conflicts.

---

### 6. Database Locked Error

**Error Message:**
```
Database is locked
SQLITE_BUSY
```

**Cause:** Another instance of OpenWhispr is running.

**Solution:**

1. **Kill all instances:**
   ```bash
   pkill -f "OpenWhispr"
   pkill -f "open-whispr"
   pkill -f "electron"
   ```

2. **Check for orphaned processes:**
   ```bash
   ps aux | grep -i whispr
   ps aux | grep -i electron
   ```

3. **Remove lock file:**
   ```bash
   rm -f "$HOME/Library/Application Support/OpenWhispr/"*.db-wal
   rm -f "$HOME/Library/Application Support/OpenWhispr/"*.db-shm
   ```

4. **Restart:**
   ```bash
   npm run dev  # or open production app
   ```

---

### 7. Hotkey Not Working

**Symptoms:**
- Global hotkey doesn't trigger recording
- No response when pressing configured key

**Solution:**

1. **Check accessibility permissions:**
   - System Settings → Privacy & Security → Accessibility
   - Make sure "OpenWhispr" or "Terminal" (for dev) is checked
   - Toggle it off and back on if needed

2. **Check hotkey configuration:**
   - Open Settings in OpenWhispr
   - Go to Hotkey section
   - Try changing to a different key combination
   - Avoid keys used by system shortcuts

3. **Common conflicts:**
   - `Cmd+Space`: Spotlight Search
   - `Cmd+Tab`: App Switcher
   - `Ctrl+Space`: Input Source switching

   Try using: `Cmd+Shift+Space` or `Option+Space`

4. **Reset permissions using tccutil:**
   ```bash
   # Reset accessibility permission
   tccutil reset Accessibility com.openwhispr.app
   # Or for dev mode:
   tccutil reset Accessibility com.apple.Terminal

   # Then restart the app - it will prompt for permission again
   ```

---

### 8. Clipboard Paste Not Working (macOS)

**Symptoms:**
- Transcription completes but doesn't paste into active app
- Works manually but not automatically

**Solution:**

1. **Check accessibility permissions:**
   - System Settings → Privacy & Security → Accessibility
   - Enable "OpenWhispr" or "Terminal" (for dev mode)
   - Toggle off and back on if already enabled

2. **Use AppleScript fallback:**
   OpenWhispr automatically tries AppleScript if direct clipboard fails.
   Make sure you allow it when prompted.

3. **Manual workaround:**
   - Go to Settings → disable "Auto-paste"
   - Copy from history and paste manually with Cmd+V

---

### 9. Vite Dev Server Issues

**Error Message:**
```
EADDRINUSE: address already in use :::5174
Port 5174 is already in use
```

**Solution:**

1. **Kill process using port 5174:**
   ```bash
   lsof -ti:5174 | xargs kill -9
   ```

2. **Or change Vite port:**
   Edit `src/vite.config.js`:
   ```javascript
   server: {
     port: 5175  // Change to different port
   }
   ```

---

### 10. Electron Build Fails

**Error Message:**
```
Error: Cannot find module 'better-sqlite3'
Error: Application entry file "main.js" does not exist
```

**Solution:**

1. **Run postinstall:**
   ```bash
   npm run postinstall
   ```

2. **Check electron-builder config:**
   Verify `package.json` has:
   ```json
   {
     "build": {
       "files": [
         "main.js",
         "src/**/*",
         "whisper_bridge.py"
       ],
       "asarUnpack": [
         "node_modules/better-sqlite3/**/*",
         "node_modules/ffmpeg-static/**/*",
         "whisper_bridge.py"
       ]
     }
   }
   ```

3. **Clean build:**
   ```bash
   npm run clean  # if available
   rm -rf dist build
   npm run build
   ```

---

## Debug Mode

Enable detailed logging to diagnose issues:

```bash
# Development
npm run dev -- --debug

# Or set environment variable
export OPENWHISPR_DEBUG=true
npm run dev

# Production
# Create debug trigger file
touch "$HOME/Library/Application Support/OpenWhispr/ENABLE_DEBUG"
# Then open the app
```

**Log locations:**
- **Dev**: `~/Library/Application Support/OpenWhispr/logs/debug-*.log`
- **Production**: Same location

**View logs:**
```bash
tail -f "$HOME/Library/Application Support/OpenWhispr/logs/debug-"*.log
```

---

## Clean State Checklist

If you want to completely reset OpenWhispr:

```bash
# 1. Run automated cleanup
cd /path/to/open-whispr
bash scripts/complete-uninstall.sh

# 2. Verify cleanup
ls "$HOME/Library/Application Support/" | grep -i whispr
ls "$HOME/Library/Caches/" | grep -i whispr
ls "$HOME/Library/Preferences/" | grep -i whispr

# 3. Fresh install
# For dev:
npm install && npm run dev

# For production:
# Download fresh DMG from releases
```

See [CLEANUP_INSTRUCTIONS.md](CLEANUP_INSTRUCTIONS.md) for detailed cleanup steps.

---

## Platform-Specific Issues

### macOS Apple Silicon (M1/M2/M3)

**Always verify:**
```bash
uname -m  # Should show: arm64
node -p "process.arch"  # Should show: arm64
```

If either shows `x86_64` or `x64`, you're running under Rosetta. See Issue #1 above.

### macOS Intel

```bash
uname -m  # Should show: x86_64
node -p "process.arch"  # Should show: x64
```

Everything should work normally. If you see `arm64`, you have the wrong Node.js version.

### Windows

- Use PowerShell or Command Prompt, not Git Bash
- Check Node.js is 64-bit: `node -p "process.arch"`
- FFmpeg path uses backslashes: `C:\path\to\ffmpeg.exe`

### Linux

- Check dependencies: `ffmpeg`, `python3`, `python3-pip`
- May need to install alsa/pulseaudio dev packages for audio
- Check permissions for `/tmp/` directory

---

## Getting Help

If none of these solutions work:

1. **Gather diagnostic info:**
   ```bash
   echo "System: $(uname -m)"
   echo "Node: $(node -p 'process.arch')"
   echo "Node Version: $(node -v)"
   echo "npm Version: $(npm -v)"
   echo "Electron: $(npm list electron | grep electron)"
   ```

2. **Enable debug mode** and reproduce the issue

3. **Get logs:**
   ```bash
   cat "$HOME/Library/Application Support/OpenWhispr/logs/debug-"*.log
   ```

4. **Report issue** with:
   - Error message
   - Diagnostic info from step 1
   - Relevant log excerpts
   - Steps to reproduce

**Report at:** [GitHub Issues](https://github.com/your-repo/open-whispr/issues)

---

## Useful Commands Reference

```bash
# View all OpenWhispr files on system
find ~ -iname "*whispr*" 2>/dev/null

# Check running processes
ps aux | grep -i whispr

# View database
sqlite3 "$HOME/Library/Application Support/OpenWhispr/transcriptions.db" "SELECT * FROM transcriptions ORDER BY timestamp DESC LIMIT 10;"

# Check disk space used
du -sh "$HOME/Library/Application Support/OpenWhispr"
du -sh "$HOME/.cache/whisper"

# Test microphone
# In dev console (Cmd+Option+I):
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => console.log('Microphone access granted', stream))
  .catch(err => console.error('Microphone error', err))

# Test Whisper locally
python3 whisper_bridge.py /path/to/audio.wav base
```
