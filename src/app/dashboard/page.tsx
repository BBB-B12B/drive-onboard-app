
import { format } from "date-fns";
import { auth } from "@/auth";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import type { AppRow } from "@/lib/types";
import type { DailyReportSummaryRow } from "@/lib/daily-report";

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
  const todayStr = format(today, "yyyy-MM-dd");
  const monthStr = format(today, "yyyy-MM");

  let dailyReportSummary: DailyReportSummaryRow[] = [];
  if (session?.user?.email) {
    dailyReportSummary = await getDailyReportSummary(session.user.email, monthStr);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">แดชบอร์ด</h1>
        <p className="text-muted-foreground">
          ภาพรวมและจัดการใบสมัครพนักงานขับรถทั้งหมด
        </p>
      </div>
      <DashboardTabs
        initialApplications={applications}
        initialDailyReportDate={todayStr}
        initialDailyReportSummary={dailyReportSummary}
      />
    </div>
  );
}
