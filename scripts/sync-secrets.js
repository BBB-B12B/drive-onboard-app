const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const envPath = path.join(__dirname, '../.env.final');
const content = fs.readFileSync(envPath, 'utf-8');

const secrets = {};
content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const parts = line.split('=');
    const key = parts[0].trim();
    let value = parts.slice(1).join('=').trim();
    if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
    }
    if (key && value) {
        secrets[key] = value;
    }
});

console.log('Secrets to upload:', Object.keys(secrets));

// Create JSON for bulk upload
const jsonPath = path.join(__dirname, '../secrets-temp.json');
fs.writeFileSync(jsonPath, JSON.stringify(secrets, null, 2));

try {
    console.log('Uploading secrets to Cloudflare Pages (driver-daily-report)...');
    execSync(`npx wrangler pages secret bulk ${jsonPath} --project-name=driver-daily-report`, { stdio: 'inherit' });
    console.log('✅ Secrets uploaded successfully!');
} catch (error) {
    console.error('❌ Failed to upload secrets:', error.message);
} finally {
    if (fs.existsSync(jsonPath)) {
        fs.unlinkSync(jsonPath);
    }
}
