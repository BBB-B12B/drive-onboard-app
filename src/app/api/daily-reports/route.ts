import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { differenceInDays, startOfDay } from "date-fns";
import { r2 } from "@/app/api/r2/_client";
import {
  DailyReportDateSchema,
  DailyReportEmailSchema,
  dailyReportSlotIds,
  dailyReportSlotOrder,
  DailyReportRecord,
  DailyReportResponse,
  normalizeDailyReportRecord,
  sanitizeEmailForPath,
  countUploadedSlots,
  getDailyReportProgressStatus,
} from "@/lib/daily-report";
import { getSampleDailyReport } from "@/data/sample-data";
import { upsertDailyReportSummary } from "@/lib/d1-daily-report";

const putSchema = z.object({
  email: DailyReportEmailSchema,
  date: DailyReportDateSchema,
  slotId: z.enum(dailyReportSlotIds),
  r2Key: z.string(),
  fileName: z.string(),
});

const deleteSchema = z.object({
  email: DailyReportEmailSchema,
  date: DailyReportDateSchema,
  slotId: z.enum(dailyReportSlotIds),
});

async function getJson(bucket: string, key: string): Promise<any | null> {
  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await r2.send(command);
    const content = await response.Body?.transformToString();
    if (!content) return null;
    return JSON.parse(content);
  } catch (error: any) {
    if (error.name === "NoSuchKey") {
      return null;
    }
    throw error;
  }
}

async function putJson(bucket: string, key: string, data: unknown) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: JSON.stringify(data),
    ContentType: "application/json",
  });
  await r2.send(command);
}

async function toResponse(
  record: DailyReportRecord,
  bucket: string
): Promise<DailyReportResponse> {
  const expiresIn = Number(process.env.R2_PRESIGN_GET_TTL || 600);
  const slots = await Promise.all(
    dailyReportSlotOrder.map(async (slot) => {
      const slotData = record.slots[slot.id] ?? {
        id: slot.id,
        label: slot.label,
      };

      let url: string | undefined;
      if (slotData.r2Key) {
        try {
          const signed = await getSignedUrl(
            r2,
            new GetObjectCommand({ Bucket: bucket, Key: slotData.r2Key }),
            { expiresIn }
          );
          url = signed;
        } catch (error) {
          console.error(
            `[DailyReport] Failed to sign GET URL for ${record.userEmail} ${record.date} ${slot.id}`,
            error
          );
        }
      }

      return {
        id: slotData.id,
        label: slotData.label || slot.label,
        r2Key: slotData.r2Key,
        fileName: slotData.fileName,
        uploadedAt: slotData.uploadedAt,
        group: slotData.group ?? slot.group,
        url,
      };
    })
  );

  return {
    userEmail: record.userEmail,
    date: record.date,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    slots,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = DailyReportEmailSchema.parse(searchParams.get("email"));
  const date = DailyReportDateSchema.parse(searchParams.get("date"));
  const bucket = process.env.R2_BUCKET;
  if (!bucket) {
    console.warn(
      "R2_BUCKET environment variable is not set. Using sample daily report response."
    );
    const sample = getSampleDailyReport(email, date);
    return NextResponse.json(sample);
  }

  try {

    const emailSegment = sanitizeEmailForPath(email);
    const reportKey = `daily-reports/${emailSegment}/${date}/report.json`;
    const data = await getJson(bucket, reportKey);

    const record = normalizeDailyReportRecord(email, date, data);
    const response = await toResponse(record, bucket);

    return NextResponse.json(response);
  } catch (error) {
    console.error("[DailyReport GET] error", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    const sample = getSampleDailyReport(email, date);
    return NextResponse.json(sample);
  }
}

export async function POST(req: NextRequest) {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) {
    return NextResponse.json(
      {
        error:
          "R2_BUCKET environment variable is not set. การอัปโหลด Daily Report ต้องตั้งค่า Cloudflare R2 ก่อน",
      },
      { status: 501 }
    );
  }

  try {
    const input = putSchema.parse(await req.json());

    const { email, date, slotId, r2Key, fileName } = input;

    const emailSegment = sanitizeEmailForPath(email);
    const reportKey = `daily-reports/${emailSegment}/${date}/report.json`;
    const existing = await getJson(bucket, reportKey);
    const record = normalizeDailyReportRecord(email, date, existing);

    record.slots[slotId] = {
      id: slotId,
      label:
        dailyReportSlotOrder.find((slot) => slot.id === slotId)?.label ??
        record.slots[slotId]?.label ??
        slotId,
      group:
        dailyReportSlotOrder.find((slot) => slot.id === slotId)?.group ??
        record.slots[slotId]?.group,
      r2Key,
      fileName,
      uploadedAt: new Date().toISOString(),
    };

    if (!record.createdAt) {
      record.createdAt = new Date().toISOString();
    }
    record.updatedAt = new Date().toISOString();

    await putJson(bucket, reportKey, record);

    // Fire-and-forget: update D1 summary index if configured
    try {
      const uploadedCount = countUploadedSlots(record);
      await upsertDailyReportSummary({
        email,
        date,
        uploadedCount,
        totalSlots: dailyReportSlotOrder.length,
        lastUpdated: record.updatedAt,
        status: getDailyReportProgressStatus(uploadedCount, dailyReportSlotOrder.length),
      });
    } catch (e) {
      console.warn("[DailyReport] failed to upsert D1 summary index", e);
    }

    const response = await toResponse(record, bucket);
    return NextResponse.json(response);
  } catch (error) {
    console.error("[DailyReport POST] error", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update daily report" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) {
    return NextResponse.json(
      {
        error:
          "R2_BUCKET environment variable is not set. การลบไฟล์ใน Daily Report ต้องตั้งค่า Cloudflare R2 ก่อน",
      },
      { status: 501 }
    );
  }

  try {
    const input = deleteSchema.parse(await req.json());
    const { email, date, slotId } = input;

    const emailSegment = sanitizeEmailForPath(email);
    const reportKey = `daily-reports/${emailSegment}/${date}/report.json`;
    const existing = await getJson(bucket, reportKey);
    const record = normalizeDailyReportRecord(email, date, existing);

    const slotToDelete = record.slots[slotId];

    if (slotToDelete?.r2Key) {
      const deleteCmd = new DeleteObjectCommand({
        Bucket: bucket,
        Key: slotToDelete.r2Key,
      });
      await r2.send(deleteCmd);
    }

    record.slots[slotId] = {
      id: slotId,
      label:
        dailyReportSlotOrder.find((slot) => slot.id === slotId)?.label ??
        record.slots[slotId]?.label ??
        slotId,
      group:
        dailyReportSlotOrder.find((slot) => slot.id === slotId)?.group ??
        record.slots[slotId]?.group,
      r2Key: undefined,
      fileName: undefined,
      uploadedAt: undefined,
    };
    record.updatedAt = new Date().toISOString();

    await putJson(bucket, reportKey, record);

    // Fire-and-forget: update D1 summary index if configured
    try {
      const uploadedCount = countUploadedSlots(record);
      await upsertDailyReportSummary({
        email,
        date,
        uploadedCount,
        totalSlots: dailyReportSlotOrder.length,
        lastUpdated: record.updatedAt,
        status: getDailyReportProgressStatus(uploadedCount, dailyReportSlotOrder.length),
      });
    } catch (e) {
      console.warn("[DailyReport] failed to upsert D1 summary index after delete", e);
    }

    const response = await toResponse(record, bucket);
    return NextResponse.json(response);
  } catch (error) {
    console.error("[DailyReport DELETE] error", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete from daily report" },
      { status: 500 }
    );
  }
}
