#!/bin/bash

# Project Name
PROJECT_NAME="drive-onboard-app"

# Helper function
upload_secret() {
    local key=$1
    local value=$2
    echo "Uploading $key..."
    echo "$value" | npx wrangler pages secret put "$key" --project-name "$PROJECT_NAME"
}

# 1. Auth & Integrity
upload_secret "WORKER_SECRET" "94bb41dcd135eb8672ece1bfbc2271e2ac5cd46365f382fa1a29e164b9d84e0e"
upload_secret "NEXTAUTH_SECRET" "94bb41dcd135eb8672ece1bfbc2271e2ac5cd46365f382fa1a29e164b9d84e0e"

# 2. URLs (Correcting NEXTAUTH_URL to match project)
upload_secret "WORKER_URL" "https://daily-report-worker.tangnam15573.workers.dev"
upload_secret "D1_API_BASE" "https://daily-report-worker.tangnam15573.workers.dev"
upload_secret "NEXTAUTH_URL" "https://drive-onboard-app.pages.dev" 

# 3. R2 Config
upload_secret "R2_BUCKET" "driveonboard-stg"
upload_secret "R2_BUCKET_NAME" "driveonboard-stg"
upload_secret "R2_ENDPOINT" "https://163c853878b1523c1fcd721650c21d0e.r2.cloudflarestorage.com"
upload_secret "R2_ACCOUNT_ID" "163c853878b1523c1fcd721650c21d0e"
upload_secret "R2_PUBLIC_URL" "https://163c853878b1523c1fcd721650c21d0e.r2.cloudflarestorage.com"

# 4. R2 Credentials
upload_secret "R2_ACCESS_KEY_ID" "3974b0518fe075c21caf926298cc0171"
upload_secret "R2_SECRET_ACCESS_KEY" "ffab84dd663a6814d737170d5e63851a78ab88f4308ff82053ec5eff11f3804d"

# 5. Options
upload_secret "R2_PRESIGN_PUT_TTL" "600"
upload_secret "R2_PRESIGN_GET_TTL" "300"

echo "All secrets uploaded successfully!"
