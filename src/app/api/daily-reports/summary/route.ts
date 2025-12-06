import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { r2 } from "@/app/api/r2/_client";
import {
  DailyReportDateSchema,
  DailyReportEmailSchema,
  countUploadedSlots,
  normalizeDailyReportRecord,
  sanitizeEmailForPath,
  TOTAL_DAILY_REPORT_SLOTS,
} from "@/lib/daily-report";

const summaryQuerySchema = z.object({
  email: DailyReportEmailSchema,
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
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
    // Don't re-throw, just return null and log
    console.error(`Failed to get JSON for ${key}`, error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const queryParseResult = summaryQuerySchema.safeParse({
    email: searchParams.get("email"),
    month: searchParams.get("month"),
  });

  if (!queryParseResult.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: queryParseResult.error.issues },
      { status: 400 }
    );
  }

  const { email, month } = queryParseResult.data;
  const bucket = process.env.R2_BUCKET;
  if (!bucket) {
    return NextResponse.json(
      {
        error: "R2_BUCKET environment variable is not set",
      },
      { status: 501 }
    );
  }

  try {
    const emailSegment = sanitizeEmailForPath(email);
    const prefix = `daily-reports/${emailSegment}/${month}-`;

    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    });

    const listResponse = await r2.send(listCommand);
    if (!listResponse.Contents) {
      return NextResponse.json({ completedDates: [] });
    }

    const reportKeys = listResponse.Contents
      .map((obj) => obj.Key)
      .filter((key): key is string => !!key && key.endsWith("report.json"));

    const completedDates: string[] = [];

    for (const key of reportKeys) {
        // Extract date from key: "daily-reports/email/YYYY-MM-DD/report.json"
        const date = key.split('/')[2];
        if (!date) continue;

        const data = await getJson(bucket, key);
        if (!data) continue;

        const record = normalizeDailyReportRecord(email, date, data);
        const uploadedCount = countUploadedSlots(record);

        if (uploadedCount >= TOTAL_DAILY_REPORT_SLOTS) {
            completedDates.push(date);
        }
    }

    return NextResponse.json({ completedDates });

  } catch (error) {
    console.error("[DailyReport Summary GET] error", error);
    return NextResponse.json(
      { error: "Failed to fetch daily report summary" },
      { status: 500 }
    );
  }
}