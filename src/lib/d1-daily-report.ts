import { isD1Enabled } from "./d1-client"; // Keep for legacy local check if needed
import { getDb } from "@/lib/db";
import { dailyReportSummary } from "@/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import type { DailyReportProgressStatus } from "./daily-report";

// Type matching existing usage if needed (though we return explicit objects)
export type { DailyReportProgressStatus };

export function isD1DailyReportEnabled() {
  if (process.env.NODE_ENV === "production") return true;
  return isD1Enabled();
}

export async function upsertDailyReportSummary(
  row: {
    email: string;
    date: string;
    fullName?: string;
    appId?: string;
    uploadedCount: number;
    totalSlots: number;
    lastUpdated?: string;
    status: DailyReportProgressStatus;
    notes?: string;
  }
) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(dailyReportSummary).values({
      email: row.email,
      date: row.date,
      fullName: row.fullName ?? row.email,
      appId: row.appId ?? row.email,
      uploadedCount: row.uploadedCount,
      totalSlots: row.totalSlots,
      lastUpdated: row.lastUpdated ?? new Date().toISOString(),
      status: row.status,
      notes: row.notes,
    }).onConflictDoUpdate({
      target: [dailyReportSummary.email, dailyReportSummary.date],
      set: {
        fullName: row.fullName ?? row.email,
        appId: row.appId ?? row.email,
        uploadedCount: row.uploadedCount,
        totalSlots: row.totalSlots,
        lastUpdated: row.lastUpdated ?? new Date().toISOString(),
        status: row.status,
        notes: row.notes,
      },
    });
  } catch (error) {
    console.error("[D1] upsertDailyReportSummary error:", error);
  }
}

export async function deleteDailyReportSummary(email: string, date: string) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.delete(dailyReportSummary).where(
      and(eq(dailyReportSummary.email, email), eq(dailyReportSummary.date, date))
    );
  } catch (error) {
    console.error("[D1] deleteDailyReportSummary error:", error);
  }
}

export async function fetchDailyReportSummaryRange(
  startDate: string,
  endDate: string,
  email?: string
) {
  const db = await getDb();
  if (!db) return null;

  try {
    const conditions = [
      gte(dailyReportSummary.date, startDate),
      lte(dailyReportSummary.date, endDate)
    ];

    if (email) {
      conditions.push(eq(dailyReportSummary.email, email));
    }

    const rows = await db.select().from(dailyReportSummary).where(and(...conditions));

    return rows.map((row) => ({
      appId: row.appId ?? row.email,
      fullName: row.fullName ?? row.email,
      email: row.email,
      phone: null,
      date: row.date,
      uploadedCount: row.uploadedCount,
      totalSlots: row.totalSlots,
      lastUpdated: row.lastUpdated || undefined,
      status: row.status as DailyReportProgressStatus,
      notes: row.notes || undefined,
    }));
  } catch (error) {
    console.error("[D1] fetchDailyReportSummaryRange error:", error);
    return null;
  }
}
