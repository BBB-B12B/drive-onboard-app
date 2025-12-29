import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";
// import { getR2Client } from "../_client"; // Removed AWS SDK dependency
// import { PutObjectCommand } from "@aws-sdk/client-s3"; // Removed
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner"; // Removed
import { assertApplicantOwner } from "../_auth";
import { requireR2Bucket } from "@/lib/r2/env";
import { createPresignedUrl } from "@/lib/r2/signer";

const Body = z.object({
  applicationId: z.string(),
  docType: z.string(),
  fileName: z.string(),
  mime: z.string(),
  size: z.number(),
  md5: z.string().optional(),
  turnstileToken: z.string().optional()
});

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    const bucket = requireR2Bucket();

    if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_ENDPOINT) {
      console.error("[R2 Error] Missing Environment Variables");
      throw new Error("R2 Configuration Missing");
    }

    const { applicationId, docType, fileName, mime, size, md5 } = Body.parse(await req.json());
    await assertApplicantOwner(applicationId, req);

    const ACCEPTED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"];
    if (!ACCEPTED_MIMES.includes(mime)) {
      return NextResponse.json({ error: "Invalid file type. Accepted: JPG, PNG, PDF." }, { status: 400 });
    }

    if (mime.startsWith('image/') && size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: `Image size cannot exceed ${MAX_IMAGE_SIZE / 1024 / 1024}MB.` }, { status: 400 });
    }

    if (mime === 'application/pdf' && size > MAX_PDF_SIZE) {
      return NextResponse.json({ error: `PDF size cannot exceed ${MAX_PDF_SIZE / 1024 / 1024}MB.` }, { status: 400 });
    }

    const ext = fileName.split('.').pop()?.toLowerCase() || 'bin';
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const safeFileName = `${Date.now()}_${docType}_${randomSuffix}.${ext}`;
    const key = `applications/${applicationId}/${docType}/${safeFileName}`;

    console.log("[R2] Generating Signed URL (Native) for:", key);

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
    console.error("[R2 Sign PUT Error]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body", details: error.issues }, { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ error: `Could not create upload URL. Reason: ${errorMessage}` }, { status: 500 });
  }
}


