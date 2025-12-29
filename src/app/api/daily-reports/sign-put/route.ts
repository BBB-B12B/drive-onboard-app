import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireR2Bucket } from "@/lib/r2/env";
import { createPresignedUrl } from "@/lib/r2/signer";
import { DailyReportDateSchema, DailyReportEmailSchema, sanitizeEmailForPath } from "@/lib/daily-report";

const Body = z.object({
    email: DailyReportEmailSchema,
    date: DailyReportDateSchema,
    slotId: z.string(),
    fileName: z.string(),
    mime: z.string(),
    size: z.number(),
    md5: z.string().optional(),
});

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
    try {
        const bucket = requireR2Bucket();

        if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_ENDPOINT) {
            console.error("[R2 Error] Missing Environment Variables");
            throw new Error("R2 Configuration Missing");
        }

        const { email, date, slotId, fileName, mime, size, md5 } = Body.parse(await req.json());

        // Validate User Auth (Optional: check if req.auth.user.email matches or is admin)
        // For now, trusting the client-side check + maybe add server session check later if needed.
        // The previous implementation didn't seem to strictly enforce ownership here beyond client context.

        const ACCEPTED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
        if (!ACCEPTED_MIMES.includes(mime)) {
            return NextResponse.json({ error: "Invalid file type. Accepted: JPG, PNG, WEBP, HEIC." }, { status: 400 });
        }

        if (size > MAX_IMAGE_SIZE) {
            return NextResponse.json({ error: `Image size cannot exceed ${MAX_IMAGE_SIZE / 1024 / 1024}MB.` }, { status: 400 });
        }

        const ext = fileName.split('.').pop()?.toLowerCase() || 'bin';
        const emailSegment = sanitizeEmailForPath(email);
        // Unique key to prevent caching issues if re-uploaded
        const timestamp = Date.now();
        // Use folder structure: check-in/1234.webp
        const key = `daily-reports/${emailSegment}/${date}/${slotId}/${timestamp}.${ext}`;

        console.log("[DailyReport] Generating Signed URL for:", key);

        const url = await createPresignedUrl({
            method: "PUT",
            bucket,
            key,
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
            endpoint: process.env.R2_ENDPOINT,
            contentType: mime,
            contentMD5: md5,
            expiresIn: Number(process.env.R2_PRESIGN_PUT_TTL || 600)
        });

        return NextResponse.json({ url, key });

    } catch (error: any) {
        console.error("[DailyReport Sign PUT Error]", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid request body", details: error.issues }, { status: 400 });
        }
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return NextResponse.json({ error: `Could not create upload URL. Reason: ${errorMessage}` }, { status: 500 });
    }
}
