"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApplicationsClient } from "@/components/dashboard/applications-client";
import { DailyReportTracker } from "@/components/dashboard/daily-report-tracker";
import type { AppRow } from "@/lib/types";
import type { DailyReportSummaryRow } from "@/lib/daily-report";

interface DashboardTabsProps {
  initialApplications: AppRow[];
  initialDailyReportDate: string;
  initialDailyReportSummary: DailyReportSummaryRow[];
}

export function DashboardTabs({
  initialApplications,
  initialDailyReportDate,
  initialDailyReportSummary,
}: DashboardTabsProps) {
  return (
    <Tabs defaultValue="applications" className="space-y-6">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="applications">ข้อมูลใบสมัคร</TabsTrigger>
        <TabsTrigger value="daily-report">Daily Report</TabsTrigger>
      </TabsList>

      <TabsContent value="applications" className="space-y-6">
        <ApplicationsClient initialApplications={initialApplications} />
      </TabsContent>

      <TabsContent value="daily-report">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Daily Report Overview
            </h2>
            <p className="text-sm text-muted-foreground">
              ตรวจสอบความคืบหน้าการแนบรูปประจำวันของพนักงานทั้งหมด
            </p>
          </div>
          <DailyReportTracker
            initialDate={initialDailyReportDate}
            initialRows={initialDailyReportSummary}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
