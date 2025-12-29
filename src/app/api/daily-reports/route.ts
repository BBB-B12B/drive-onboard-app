import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { differenceInDays, startOfDay } from "date-fns";
import { getR2Binding } from "@/lib/r2/binding";
import { getWorkerFileUrl } from "@/lib/worker-url";
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

async function getJson(bucket: any, key: string): Promise<any | null> {
  try {
    const object = await bucket.get(key);
    if (!object) return null;
    return await object.json();
  } catch (error: any) {
    console.warn(`[DailyReport] Failed to get JSON for ${key}`, error);
    return null;
  }
}

async function putJson(bucket: any, key: string, data: unknown) {
  await bucket.put(key, JSON.stringify(data), {
    httpMetadata: { contentType: "application/json" }
  });
}

function toResponse(
  record: DailyReportRecord
): DailyReportResponse {
  // const expiresIn = Number(process.env.R2_PRESIGN_GET_TTL || 600);
  const slots = dailyReportSlotOrder.map((slot) => {
    const slotData = record.slots[slot.id] ?? {
      id: slot.id,
      label: slot.label,
    };

    let url: string | undefined;
    if (slotData.r2Key) {
      // Use Worker Proxy URL instead of Signed URL
      url = getWorkerFileUrl(slotData.r2Key);
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
  });

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

  try {
    const bucket = await getR2Binding();
    const emailSegment = sanitizeEmailForPath(email);
    const reportKey = `daily-reports/${emailSegment}/${date}/report.json`;
    const data = await getJson(bucket, reportKey);

    const record = normalizeDailyReportRecord(email, date, data);
    const response = toResponse(record);

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
  try {
    const bucket = await getR2Binding();
    const input = putSchema.parse(await req.json());
    const { email, date, slotId, r2Key, fileName } = input;

    const emailSegment = sanitizeEmailForPath(email);
    const reportKey = `daily-reports/${emailSegment}/${date}/report.json`;
    const existing = await getJson(bucket, reportKey);
    const record = normalizeDailyReportRecord(email, date, existing);

    const existingSlot = record.slots[slotId];
    if (existingSlot?.r2Key && existingSlot.r2Key !== r2Key) {
      try {
        console.log(`[DailyReport] Deleting old file: ${existingSlot.r2Key} to replace with ${r2Key}`);
        await bucket.delete(existingSlot.r2Key);
      } catch (delErr) {
        console.warn(`[DailyReport] Failed to delete old file ${existingSlot.r2Key}`, delErr);
      }
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

    const response = toResponse(record);
    return NextResponse.json(response);
  } catch (error) {
    console.error("[DailyReport POST] error", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message.includes("Binding")) {
      return NextResponse.json(
        { error: "R2 Configuration Error. Please contact admin." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update daily report" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const bucket = await getR2Binding();
    const input = deleteSchema.parse(await req.json());
    const { email, date, slotId } = input;

    const emailSegment = sanitizeEmailForPath(email);
    const reportKey = `daily-reports/${emailSegment}/${date}/report.json`;
    const existing = await getJson(bucket, reportKey);
    const record = normalizeDailyReportRecord(email, date, existing);

    const slotToDelete = record.slots[slotId];

    if (slotToDelete?.r2Key) {
      await bucket.delete(slotToDelete.r2Key);
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

    const response = toResponse(record);
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
