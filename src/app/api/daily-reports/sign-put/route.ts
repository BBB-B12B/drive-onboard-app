import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client } from "@/app/api/r2/_client";
import {
  DailyReportDateSchema,
  DailyReportEmailSchema,
  dailyReportSlotIds,
  normalizeFileName,
  sanitizeEmailForPath,
} from "@/lib/daily-report";

const bodySchema = z.object({
  email: DailyReportEmailSchema,
  date: DailyReportDateSchema,
  slotId: z.enum(dailyReportSlotIds),
  fileName: z.string(),
  mime: z.string(),
  size: z.number(),
  md5: z.string().optional(),
});

const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const bucket = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME;

    // DEBUG: Check R2 Env Vars
    console.log("[DEBUG DailyReport] R2 Config Check:", {
      hasBucket: !!bucket,
      hasEndpoint: !!process.env.R2_ENDPOINT,
      hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
      hasSecret: !!process.env.R2_SECRET_ACCESS_KEY,
    });

    if (!bucket) {
      return NextResponse.json(
        {
          error:
            "ยังไม่ได้ตั้งค่า Cloudflare R2 สำหรับการเก็บรูป Daily Report โปรดกำหนดค่า R2 ก่อนใช้งานจริง",
        },
        { status: 501 }
      );
    }

    if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      console.error("[DailyReport] Missing R2 Access Keys");
      return NextResponse.json({ error: "Server Configuration Error: Missing R2 Keys" }, { status: 500 });
    }

    const { email, date, slotId, fileName, mime, size, md5 } = bodySchema.parse(
      await req.json()
    );

    if (!ACCEPTED_MIME_TYPES.includes(mime)) {
      return NextResponse.json(
        { error: "รูปจะต้องเป็นไฟล์ JPG, PNG, WEBP หรือ HEIC เท่านั้น" },
        { status: 400 }
      );
    }

    if (size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        {
          error: `ขนาดไฟล์ต้องไม่เกิน ${Math.round(
            MAX_IMAGE_SIZE / (1024 * 1024)
          )}MB`,
        },
        { status: 400 }
      );
    }

    const emailSegment = sanitizeEmailForPath(email);
    const normalizedName = normalizeFileName(fileName);
    const key = `daily-reports/${emailSegment}/${date}/${slotId}/${Date.now()}-${normalizedName}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: mime,
      ...(md5 ? { ContentMD5: md5 } : {}),
    });

    const expiresIn = Number(process.env.R2_PRESIGN_PUT_TTL || 600);
    const r2 = getR2Client();
    const url = await getSignedUrl(r2, command, { expiresIn });

    return NextResponse.json({ url, key, expiresIn });
  } catch (error) {
    console.error("[DailyReport sign-put] error", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "ไม่สามารถสร้างลิงก์อัปโหลดได้" },
      { status: 500 }
    );
  }
}
