
import crypto from "crypto";

async function verifyPassword(password: string, hash: string | undefined | null): Promise<boolean> {
    console.log("[Debug] Hash:", hash);
    if (!hash) return false;
    const [saltHex, keyHex] = hash.split(":");
    if (!saltHex || !keyHex) {
        console.log("[Debug] Invalid hash format");
        return false;
    }
    const salt = Buffer.from(saltHex, "hex");
    const key = Buffer.from(keyHex, "hex");

    try {
        const derived = await new Promise<Buffer>((resolve, reject) => {
            // Logic from d1-users.ts
            crypto.scrypt(password, salt, key.length, (err, derivedKey) => {
                if (err) reject(err);
                else resolve(derivedKey as Buffer);
            });
        });

        const match = crypto.timingSafeEqual(key, derived);
        console.log("[Debug] Derived key matches:", match);
        return match;
    } catch (error) {
        console.error("[Debug] Scrypt error:", error);
        return false;
    }
}

const targetHash = "2806da76fd3bf2adfb14c3d408747f19:47f3b22c483931160ddd52fdfbd84c1424a7d75a3204ee5cca577b44961db25745dfc3a1796b9982af0c4c5d4d45a41a18f8cc368cfde3d282752da6ce59e6ed";
const password = "123456";

console.log(`Testing password '${password}' against hash...`);
verifyPassword(password, targetHash).then(result => {
    console.log("Final Result:", result);
});
