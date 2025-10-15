#!/bin/bash

# OpenWhispr Complete Uninstall Script for macOS
# This script removes ALL traces of OpenWhispr from your system

set -e

echo "🗑️  OpenWhispr Complete Uninstall Script"
echo "=========================================="
echo ""
echo "⚠️  WARNING: This will delete ALL OpenWhispr data including:"
echo "   - Application data and databases"
echo "   - Settings and configurations"
echo "   - Downloaded Whisper models"
echo "   - Debug logs"
echo "   - Temp files"
echo "   - The installed application"
echo ""
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Starting cleanup..."
echo ""

# Function to safely remove directory/file
safe_remove() {
    if [ -e "$1" ]; then
        echo "✓ Removing: $1"
        rm -rf "$1"
    else
        echo "⊘ Not found: $1"
    fi
}

# 1. Kill any running instances
echo "1. Stopping OpenWhispr processes..."
pkill -f "OpenWhispr" 2>/dev/null || echo "  No running processes found"
pkill -f "open-whispr" 2>/dev/null || echo "  No dev processes found"
sleep 1

# 2. Remove Application
echo ""
echo "2. Removing application..."
safe_remove "/Applications/OpenWhispr.app"

# 3. Remove Application Support data
echo ""
echo "3. Removing application data..."
safe_remove "$HOME/Library/Application Support/OpenWhispr"
safe_remove "$HOME/Library/Application Support/open-whispr"

# 4. Remove Preferences
echo ""
echo "4. Removing preferences..."
safe_remove "$HOME/Library/Preferences/com.openwhispr.app.plist"
safe_remove "$HOME/Library/Preferences/com.electron.openwhispr.plist"

# 5. Remove Caches
echo ""
echo "5. Removing caches..."
safe_remove "$HOME/Library/Caches/OpenWhispr"
safe_remove "$HOME/Library/Caches/open-whispr"
safe_remove "$HOME/Library/Caches/com.openwhispr.app"
safe_remove "$HOME/Library/Caches/com.electron.openwhispr"

# 6. Remove Logs
echo ""
echo "6. Removing logs..."
safe_remove "$HOME/Library/Logs/OpenWhispr"
safe_remove "$HOME/Library/Logs/open-whispr"

# 7. Remove Saved Application State
echo ""
echo "7. Removing saved state..."
safe_remove "$HOME/Library/Saved Application State/com.openwhispr.app.savedState"
safe_remove "$HOME/Library/Saved Application State/com.electron.openwhispr.savedState"

# 8. Remove Whisper models cache (optional - user may want to keep these)
echo ""
read -p "Remove downloaded Whisper models? (~2-3GB) (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    safe_remove "$HOME/.cache/whisper"
    safe_remove "$HOME/.cache/huggingface"
else
    echo "⊘ Keeping Whisper models"
fi

# 9. Remove temp files
echo ""
echo "8. Removing temp files..."
find /tmp -name "whisper_audio_*" -delete 2>/dev/null || true
find /tmp -name "openwhispr_*" -delete 2>/dev/null || true

# 10. Remove .env file if in dev environment
if [ -f ".env" ]; then
    echo ""
    read -p "Remove .env file with API keys? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        safe_remove ".env"
    else
        echo "⊘ Keeping .env file"
    fi
fi

echo ""
echo "=========================================="
echo "✅ OpenWhispr has been completely removed!"
echo ""
echo "⚠️  NOTE: macOS system permissions are NOT removed by this script."
echo "Microphone/Accessibility permissions will persist in macOS settings."
echo "This is normal - they'll automatically apply to a fresh install."
echo ""
echo "If you need to fully reset permissions (rare):"
echo "  tccutil reset Microphone com.openwhispr.app"
echo "  tccutil reset Accessibility com.openwhispr.app"
echo ""
echo "To reinstall:"
echo "  - Production: Download fresh DMG from releases"
echo "  - Development: Run 'npm install && npm run dev'"
echo ""
