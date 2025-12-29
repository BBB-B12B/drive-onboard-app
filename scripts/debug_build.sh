#!/bin/bash
# debug_build.sh - Replicates deploy_safe.sh build but stops before deploy to inspect files

set -e

SOURCE_DIR=$(pwd)
BUILD_DIR="/tmp/driver_daily_report_debug_$(date +%s)"

echo "🚀 Starting Debug Build..."
echo "📂 Source: $SOURCE_DIR"
echo "Target: $BUILD_DIR"

# 1. Create Clean Build Zone
mkdir -p "$BUILD_DIR"

# 2. Copy Project Files
echo "📦 Copying to Safe Zone..."
rsync -av --exclude 'node_modules' --exclude '.next' --exclude '.open-next' --exclude '.git' --exclude '._*' "$SOURCE_DIR/" "$BUILD_DIR/"

# 3. Enter Safe Zone
cd "$BUILD_DIR"

# 4. Clean metadata
find . -name "._*" -delete

# 5. Install
echo "⚡ Installing..."
npm install --no-audit --no-fund

# 6. Build
echo "🏗️ Building..."
rm -rf node_modules/better-sqlite3
npx @opennextjs/cloudflare build

# 7. Analyze Structure
echo "🔎 ANALYZING BUILD OUTPUT..."
echo "---------------------------------------------------"
echo "Checking .open-next root:"
ls -F .open-next/
echo "---------------------------------------------------"
echo "Checking .open-next/assets (This is what gets uploaded):"
if [ -d ".open-next/assets" ]; then
    ls -F .open-next/assets/
else
    echo "❌ .open-next/assets does not exist!"
fi
echo "---------------------------------------------------"
echo "Checking for _next/static inside assets:"
if [ -d ".open-next/assets/_next" ]; then
    find .open-next/assets/_next -maxdepth 2
else
    echo "❌ .open-next/assets/_next not found!"
fi
echo "---------------------------------------------------"
echo "Checking .open-next/assets structure recursively (depth 3):"
if [ -d ".open-next/assets" ]; then
    find .open-next/assets -maxdepth 3 -not -path '*/.*'
fi
echo "---------------------------------------------------"

# Cleanup (Optional - comment out to keep for manual inspection)
# rm -rf "$BUILD_DIR"
echo "✅ Debug Build Complete. Check output above."
