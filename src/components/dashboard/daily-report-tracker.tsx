"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon, CheckCircle2, CircleAlert, Loader2, PhoneCall, Mail } from "lucide-react";
import { DailyReportSummaryRow } from "@/lib/daily-report";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type StatusFilter = "all" | "uploaded" | "partial" | "missing" | "complete";

interface DailyReportTrackerProps {
  initialDate: string;
  initialRows: DailyReportSummaryRow[];
}

export function DailyReportTracker({
  initialDate,
  initialRows,
}: DailyReportTrackerProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [rows, setRows] = useState<DailyReportSummaryRow[]>(initialRows);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const { toast } = useToast();

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const fetchSummary = async (date: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/daily-reports/summary?date=${date}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "ไม่สามารถโหลดข้อมูลได้");
      }
      const data: DailyReportSummaryRow[] = await res.json();
      setRows(data);
    } catch (error) {
      console.error("[DailyReportTracker] summary fetch error", error);
      toast({
        variant: "destructive",
        title: "โหลดข้อมูลสรุปไม่สำเร็จ",
        description:
          error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = async (value: string) => {
    setSelectedDate(value);
    if (!value) {
      setRows([]);
      return;
    }
    await fetchSummary(value);
  };

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      switch (statusFilter) {
        case "uploaded":
          return row.uploadedCount > 0;
        case "partial":
          return row.status === "partial";
        case "missing":
          return row.status === "missing";
        case "complete":
          return row.status === "complete";
        default:
          return true;
      }
    });
  }, [rows, statusFilter]);

  const statusBadge = (row: DailyReportSummaryRow) => {
    switch (row.status) {
      case "complete":
        return (
          <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-500">
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            ครบแล้ว
          </Badge>
        );
      case "partial":
        return (
          <Badge variant="secondary">
            <CalendarIcon className="mr-1 h-3.5 w-3.5" />
            ยังไม่ครบ
          </Badge>
        );
      default:
        return (
          <Badge variant="destructive">
            <CircleAlert className="mr-1 h-3.5 w-3.5" />
            ยังไม่มีข้อมูล
          </Badge>
        );
    }
  };

  return (
    <section className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="daily-report-summary-date">เลือกวันที่</Label>
          <Input
            id="daily-report-summary-date"
            type="date"
            value={selectedDate}
            onChange={(event) => void handleDateChange(event.target.value)}
            className="max-w-xs"
          />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Label>กรองสถานะ</Label>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="เลือกตัวกรอง" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="uploaded">แนบแล้ว</SelectItem>
              <SelectItem value="partial">แนบแล้วยังไม่ครบ</SelectItem>
              <SelectItem value="missing">ยังไม่มีข้อมูล</SelectItem>
              <SelectItem value="complete">ครบแล้ว</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => selectedDate && void fetchSummary(selectedDate)}
            disabled={loading || !selectedDate}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังรีเฟรช...
              </>
            ) : (
              "รีเฟรชข้อมูล"
            )}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">วันที่</TableHead>
              <TableHead>ชื่อ-นามสกุล</TableHead>
              <TableHead className="w-[140px] text-center">จำนวนรูป</TableHead>
              <TableHead className="w-[140px] text-center">สถานะ</TableHead>
              <TableHead className="w-[200px]">อัปเดตล่าสุด</TableHead>
              <TableHead>หมายเหตุ</TableHead>
              <TableHead className="w-[140px] text-center">ติดต่อ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <TableRow key={`skeleton-${idx}`}>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="mx-auto h-4 w-16" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="mx-auto h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="mx-auto h-9 w-24" />
                    </TableCell>
                  </TableRow>
                ))
              : filteredRows.length > 0
              ? filteredRows.map((row) => (
                  <TableRow key={row.appId}>
                    <TableCell>
                      {format(parseISO(row.date), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {row.fullName}
                        </span>
                        {row.email && (
                          <span className="text-xs text-muted-foreground">
                            {row.email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium text-foreground">
                      {row.uploadedCount}/{row.totalSlots}
                    </TableCell>
                    <TableCell className="text-center">
                      {statusBadge(row)}
                    </TableCell>
                    <TableCell>
                      {row.lastUpdated
                        ? format(parseISO(row.lastUpdated), "dd MMM yyyy HH:mm")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.notes ??
                        (row.uploadedCount === row.totalSlots
                          ? "ครบถ้วน"
                          : row.uploadedCount === 0
                          ? "ยังไม่มีการอัปโหลด"
                          : "ยังอัปโหลดไม่ครบ")}
                    </TableCell>
                    <TableCell className="text-center">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            ข้อมูลติดต่อ
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>ข้อมูลติดต่อ</DialogTitle>
                            <DialogDescription>
                              รายละเอียดการติดต่อของ {row.fullName}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-3 py-2">
                            <div className="flex items-start gap-3">
                              <PhoneCall className="h-4 w-4 text-muted-foreground mt-1" />
                              <div>
                                <p className="text-sm font-medium text-foreground">เบอร์โทร</p>
                                <p className="text-sm text-muted-foreground">
                                  {row.phone && row.phone.trim().length > 0 ? row.phone : "ไม่มีข้อมูล"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                              <div>
                                <p className="text-sm font-medium text-foreground">อีเมล</p>
                                <p className="text-sm text-muted-foreground">
                                  {row.email ?? "ไม่มีข้อมูล"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button type="button" variant="secondary">
                                ปิดหน้าต่าง
                              </Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              : (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                    ไม่มีข้อมูลสำหรับวันที่เลือก
                  </TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
