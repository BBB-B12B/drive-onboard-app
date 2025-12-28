const crypto = require('crypto');

async function hashPassword(password) {
    const salt = crypto.randomBytes(16);
    const derived = await new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            else resolve(derivedKey);
        });
    });
    return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

hashPassword("123456").then(console.log);
