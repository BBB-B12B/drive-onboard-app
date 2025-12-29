#!/bin/bash
echo "🚀 Starting Safe Production Deployment..."

# 1. Kill Localhost (Prevent File Locks)
echo "🛑 Stopping Localhost (Port 9002)..."
lsof -ti:9002 | xargs kill -9 2>/dev/null || true
sleep 2 # Wait for process to release locks

# 1.5 Clean macOS Metadata (Ghost Files)
echo "👻 Removing macOS '._' ghost files..."
if command -v dot_clean &> /dev/null; then
    echo "   Running dot_clean..."
    dot_clean -m .
fi
find . -type f -name "._*" -delete

# 2. Nuke Build-Breaking Dependencies
echo "💣 Removing native modules (better-sqlite3) to allow Cloudflare Build..."
rm -rf node_modules/better-sqlite3

# 3. Clean Caches
echo "🧹 Cleaning Global Caches..."
rm -rf .next .open-next

# 4. Build
echo "🏗️ Building Project..."
npx @opennextjs/cloudflare build
BUILD_STATUS=$?

if [ $BUILD_STATUS -eq 0 ]; then
    echo "✅ Build Successful!"
    # 5. Deploy
    echo "☁️ Deploying to Cloudflare Pages..."
    npx wrangler pages deploy .open-next/assets --project-name drive-onboard-app --branch main
else
    echo "❌ Build Failed!"
    exit 1
fi

echo "🔄 Deployment Complete."
echo "💡 To restart Localhost, run: npm run dev:remote"
