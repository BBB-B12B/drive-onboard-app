import { d1Request, isD1Enabled } from "./d1-client";
import type { DailyReportSummaryRow, DailyReportProgressStatus } from "./daily-report";

export type D1DailyReportRow = {
  email: string;
  date: string;
  full_name?: string | null;
  app_id?: string | null;
  uploaded_count: number;
  total_slots: number;
  last_updated?: string | null;
  status: DailyReportProgressStatus;
  notes?: string | null;
};

const TABLE = "daily_report_summary";

export function isD1DailyReportEnabled() {
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
  if (!isD1DailyReportEnabled()) return;
  const res = await d1Request(`/api/${TABLE}`, {
    method: "POST",
    body: {
      email: row.email,
      date: row.date,
      full_name: row.fullName ?? row.email,
      app_id: row.appId ?? row.email,
      uploaded_count: row.uploadedCount,
      total_slots: row.totalSlots,
      last_updated: row.lastUpdated ?? new Date().toISOString(),
      status: row.status,
      notes: row.notes,
    },
  });
  if (res.error) {
    console.error("[D1] upsertDailyReportSummary error:", res.error);
  }
}

export async function deleteDailyReportSummary(email: string, date: string) {
  if (!isD1DailyReportEnabled()) return;
  const res = await d1Request(`/api/${TABLE}?email=${encodeURIComponent(email)}&date=${encodeURIComponent(date)}`, {
    method: "DELETE",
  });
  if (res.error) {
    console.error("[D1] deleteDailyReportSummary error:", res.error);
  }
}

export async function fetchDailyReportSummaryRange(
  startDate: string,
  endDate: string,
  email?: string
): Promise<DailyReportSummaryRow[] | null> {
  if (!isD1DailyReportEnabled()) return null;
  const search = new URLSearchParams({ startDate, endDate });
  if (email) search.set("email", email);

  const res = await d1Request<D1DailyReportRow[]>(`/api/${TABLE}?${search.toString()}`);
  if (res.error || !res.data) {
    console.error("[D1] fetchDailyReportSummaryRange error:", res.error);
    return null;
  }

  return res.data.map((row) => ({
    appId: row.app_id ?? row.email,
    fullName: row.full_name ?? row.email,
    email: row.email,
    phone: null,
    date: row.date,
    uploadedCount: row.uploaded_count,
    totalSlots: row.total_slots,
    lastUpdated: row.last_updated ?? undefined,
    status: row.status,
    notes: row.notes ?? undefined,
  }));
}
