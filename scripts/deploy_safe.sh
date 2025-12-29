#!/bin/bash
# deploy_safe.sh - Build in a clean /tmp directory to avoid macOS metadata (._ files) from external drives

set -e # Exit on error

SOURCE_DIR=$(pwd)
BUILD_DIR="/tmp/driver_daily_report_build_$(date +%s)"

echo "🚀 Starting Safe Zone Deployment..."
echo "📂 Source: $SOURCE_DIR"
echo "Target: $BUILD_DIR"

# 1. Create Clean Build Zone
mkdir -p "$BUILD_DIR"

# 2. Copy Project Files (Excluding node_modules, .next, .git to be fast and clean)
echo "📦 Copying source code to Safe Zone..."
rsync -av --exclude 'node_modules' --exclude '.next' --exclude '.open-next' --exclude '.git' --exclude '._*' "$SOURCE_DIR/" "$BUILD_DIR/"

# 3. Enter Safe Zone
cd "$BUILD_DIR"

# 4. Clean any residual metadata (just in case rsync brought some)
echo "👻 Scrubbing Safe Zone..."
find . -name "._*" -delete

# 5. Install Dependencies (Fast Install)
echo "⚡ Installing dependencies in Safe Zone..."
npm install --no-audit --no-fund

# 6. Build
echo "🏗️ Building Project..."
# Remove better-sqlite3 just in case
rm -rf node_modules/better-sqlite3 
npx @opennextjs/cloudflare build

# 6.5 Prepare for Cloudflare Pages (Bundle Everything into 'assets')
echo "🔧 Preparing Cloudflare Pages Bundle..."
if [ -f ".open-next/worker.js" ]; then
    # 1. Move/Rename Worker
    cp .open-next/worker.js .open-next/assets/_worker.js
    
    # 2. Copy Dependencies (Server Functions & Build Artifacts)
    # The worker imports from relative paths "../server-functions" typically, 
    # but relative path resolution depends on where it sits.
    # If OpenNext generates worker.js at root, it expects folders at root.
    # So if we put it in assets/, we need folders in assets/.
    
    # DEBUG: List structure to verify existence
    echo "🔎 Listing .open-next structure:"
    find .open-next -maxdepth 2 -not -path '*/.*'
    
    # 2. Copy Dependencies (Force Copy, No Silent Fail)
    echo "   📦 Merging backend folders into assets/..."
    cp -r .open-next/server-functions .open-next/assets/
    cp -r .open-next/middleware .open-next/assets/
    cp -r .open-next/cloudflare .open-next/assets/
    # Don't forget .build (hidden folder)
    cp -r .open-next/.build .open-next/assets/
    
    echo "   ✅ Bundled _worker.js + dependencies (server, middleware, cf, .build)"
else
    echo "   ⚠️ WARNING: worker.js not found! This deployment might be static-only."
fi

# 6.6 Generate _routes.json (CRITICAL for Static Assets)
# In "Advanced Mode" (_worker.js exists), all requests go to Worker by default.
# The generated worker DOES NOT fallback to env.ASSETS for static files automatically.
# We MUST use _routes.json to tell Cloudflare to serve static assets directly.
echo "routes: Generating _routes.json..."
cat > .open-next/assets/_routes.json <<EOF
{
  "version": 1,
  "include": ["/*"],
  "exclude": [
    "/_next/static/*",
    "/fonts/*",
    "/forms/*",
    "/favicon.ico"
  ]
}
EOF
echo "   ✅ Generated _routes.json (Excluding /_next/static/*, /fonts/*, etc.)"

# 7. Deploy
echo "☁️ Deploying to Cloudflare Pages..."
# Ensure we are in the right directory structure for the relative imports to work
npx wrangler pages deploy .open-next/assets --project-name drive-onboard-app --branch main

# 8. Cleanup
echo "🧹 Cleaning up Safe Zone..."
cd "$SOURCE_DIR"
rm -rf "$BUILD_DIR"

echo "✅ Safe Deployment Complete!"
