
import { format } from "date-fns";
import { auth } from "@/auth";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import type { AppRow } from "@/lib/types";
import type { DailyReportSummaryRow } from "@/lib/daily-report";
import type { User } from "@/lib/types";
import { startOfMonth, endOfMonth, formatISO } from "date-fns";

// Force dynamic rendering to avoid headers()/cookies() sync warnings in App Router
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const fetchCache = "force-no-store";
export const revalidate = 0;

// Helper to fetch data directly on the server
async function getApplications(): Promise<AppRow[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
  try {
    // We use fetch with cache: 'no-store' to ensure we always get fresh data
    // when this server component re-renders (e.g., after a router.refresh()).
    const res = await fetch(`${baseUrl}/api/applications`, { cache: 'no-store' });

    if (!res.ok) {
      console.error("Failed to fetch applications:", await res.text());
      return []; // Return empty array on error
    }
    return await res.json();
  } catch (error) {
    console.error("Error in getApplications:", error);
    return []; // Return empty array on network or parsing error
  }
}

async function getDailyReportSummary(email: string, month: string): Promise<DailyReportSummaryRow[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
  try {
    const res = await fetch(`${baseUrl}/api/daily-reports/summary?email=${email}&month=${month}`, { cache: 'no-store' });
    if (!res.ok) {
      console.error("Failed to fetch daily report summary:", await res.text());
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error("Error in getDailyReportSummary:", error);
    return [];
  }
}


export default async function DashboardPage() {
  const session = await auth();
  const applications = await getApplications();
  const today = new Date();
  const monthStr = format(today, "yyyy-MM");
  const startStr = formatISO(startOfMonth(today), { representation: "date" });
  const endOfMonthStr = formatISO(endOfMonth(today), { representation: "date" });
  const todayStr = formatISO(today, { representation: "date" });
  const endStr = endOfMonthStr > todayStr ? todayStr : endOfMonthStr;

  let dailyReportSummary: DailyReportSummaryRow[] = [];
  const userRole = (session?.user as User | undefined)?.role;
  if (userRole === "admin") {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
    const res = await fetch(`${baseUrl}/api/daily-reports/summary?startDate=${startStr}&endDate=${endStr}`, { cache: 'no-store' });
    if (res.ok) {
      dailyReportSummary = await res.json();
    }
  } else if (session?.user?.email) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9002"}/api/daily-reports/summary?email=${session.user.email}&startDate=${startStr}&endDate=${endStr}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      dailyReportSummary = await res.json();
    }
  }

  const debugBinding = await import("@/lib/db").then(m => m.verifyBinding());

  return (
    <div className="space-y-6">
      {/* Debug Info */}
      <div className="bg-yellow-50 p-2 text-xs border border-yellow-200 rounded text-yellow-800 font-mono">
        D1 Connection Mode: {debugBinding} <br />
        User: {session?.user?.email || "Guest"} ({userRole || "None"})
      </div>

      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">แดชบอร์ด</h1>
        <p className="text-muted-foreground">
          ภาพรวมและจัดการใบสมัครพนักงานขับรถทั้งหมด
        </p>
      </div>
      <DashboardTabs
        initialApplications={applications}
        initialDailyReportDate={monthStr}
        initialStartDate={startStr}
        initialEndDate={endStr}
        initialDailyReportSummary={dailyReportSummary}
        userEmail={session?.user?.email ?? ""}
        userRole={userRole}
      />
    </div>
  );
}
