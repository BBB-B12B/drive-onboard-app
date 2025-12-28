
const fs = require('fs');
const { execSync } = require('child_process');

const PROJECT_NAME = 'drive-onboard-app'; // Based on screenshot
const ENV_FILE = '.env.final';

try {
    // 1. Read .env file
    const envContent = fs.readFileSync(ENV_FILE, 'utf-8');
    const secrets = {};

    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=').replace(/^"|"$/g, ''); // Remove quotes if any
            if (key && value) {
                secrets[key] = value;
            }
        }
    });

    // 2. Write to JSON
    fs.writeFileSync('secrets.json', JSON.stringify(secrets, null, 2));
    console.log(`✅ Converted ${Object.keys(secrets).length} secrets to JSON.`);

    // 3. Upload
    console.log(`🚀 Uploading secrets to Cloudflare Pages project: ${PROJECT_NAME}...`);
    execSync(`npx wrangler pages secret bulk secrets.json --project-name ${PROJECT_NAME}`, { stdio: 'inherit' });
    console.log('🎉 Secrets uploaded successfully!');

    // 4. Cleanup
    fs.unlinkSync('secrets.json');

} catch (error) {
    console.error('❌ Error:', error.message);
}
