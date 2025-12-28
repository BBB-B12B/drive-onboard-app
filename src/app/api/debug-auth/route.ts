import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const debug: any = {
        step: "Start",
        env: process.env.NODE_ENV,
        runtime: process.release?.name || "unknown",
        check_accounts: [],
        fix_applied: false
    };

    const fixMode = req.nextUrl.searchParams.get("fix") === "true";

    try {
        const db = await getDb();
        if (!db) {
            debug.db_binding = "Missing getDb() result";
            return NextResponse.json(debug);
        }
        debug.db_binding = "Connected";

        // 1. Get Known Good Hash (from p.pongsada)
        const pongsada = await db.select().from(users).where(eq(users.email, "p.pongsada@gmail.com")).limit(1).then(r => r[0]);
        let knownGoodHash = "";

        if (pongsada && pongsada.password_hash) {
            knownGoodHash = pongsada.password_hash;
            debug.source_hash_user = "p.pongsada@gmail.com";
        }

        // 2. Check & Fix Targets
        const targetEmails = [
            "admin@drivetoonboard.co",
            "admin@driveonboard.test" // Also check this one
        ];

        const testPassword = "123456";

        for (const email of targetEmails) {
            let user = await db.select().from(users).where(eq(users.email, email)).limit(1).then(r => r[0]);

            // Auto-fix if user exists and we have a good hash and fixMode is ON
            if (user && fixMode && knownGoodHash) {
                try {
                    await db.update(users)
                        .set({ password_hash: knownGoodHash })
                        .where(eq(users.email, email));
                    debug.fix_applied = true;
                    debug.fix_details = `Updated hash for ${email} to match p.pongsada`;
                    // Re-fetch
                    user = await db.select().from(users).where(eq(users.email, email)).limit(1).then(r => r[0]);
                } catch (err: any) {
                    debug.fix_error = err.message;
                }
            }

            const result: any = { email, found: !!user };

            if (user) {
                result.role = user.role;
                result.hash_preview = user.password_hash ? user.password_hash.substring(0, 10) + "..." : "null";

                if (user.password_hash) {
                    // Try verify
                    try {
                        const [saltHex, keyHex] = user.password_hash.split(":");
                        const salt = Buffer.from(saltHex, "hex");
                        const key = Buffer.from(keyHex, "hex");

                        const derived = await new Promise<Buffer>((resolve, reject) => {
                            crypto.scrypt(testPassword, salt, key.length, (err, derivedKey) => {
                                if (err) reject(err);
                                else resolve(derivedKey as Buffer);
                            });
                        });

                        const match = crypto.timingSafeEqual(key, derived);
                        result.verify_123456 = match ? "MATCH" : "MISMATCH";
                    } catch (e: any) {
                        result.verify_error = e.message;
                    }
                }
            }
            debug.check_accounts.push(result);
        }

        return NextResponse.json(debug);

    } catch (error: any) {
        debug.error = error.message;
        debug.stack = error.stack;
        return NextResponse.json(debug, { status: 500 });
    }
}
