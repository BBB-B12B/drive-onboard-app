"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, subDays, parse, differenceInDays, startOfDay } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { DailyReportSlotCard } from "./daily-report-slot-card";
import type {
  DailyReportResponse,
  DailyReportResponseSlot,
} from "@/lib/daily-report";
import { dailyReportSlotOrder, TOTAL_DAILY_REPORT_SLOTS } from "@/lib/daily-report";
import { getSampleDailyReport } from "@/data/sample-data";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Loader2, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

type SlotUploadingState = Record<string, boolean>;

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

async function md5Base64(file: File) {
  const SparkMD5 = (await import("spark-md5")).default;
  const buffer = await file.arrayBuffer();
  const hash = new SparkMD5.ArrayBuffer().append(buffer).end();
  const bytes = hash.match(/.{2}/g);
  if (!bytes) {
    throw new Error("ไม่สามารถคำนวณ MD5 ของไฟล์ได้");
  }
  const binary = bytes
    .map((pair) => String.fromCharCode(parseInt(pair, 16)))
    .join("");
  return btoa(binary);
}

export function DailyReportView() {

  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [userOptions, setUserOptions] = useState<{ email: string; name: string }[]>([]);

  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const [completedDates, setCompletedDates] = useState<Date[]>([]);



  const [reportCache, setReportCache] = useState<Record<string, DailyReportResponse>>({});

  const [loading, setLoading] = useState(false);

  const [fetchError, setFetchError] = useState<string | null>(null);

  const [slotUploading, setSlotUploading] = useState<SlotUploadingState>({});

  const [slotDeleting, setSlotDeleting] = useState<SlotUploadingState>({});

  const [isSampleData, setIsSampleData] = useState(false);



    const selectedDateStr = useMemo(



      () => format(selectedDate, "yyyy-MM-dd"),



      [selectedDate]



    );



  



    const isReadOnly = useMemo(() => {
      if (isAdmin) return false;
      return differenceInDays(startOfDay(new Date()), startOfDay(selectedDate)) > 2;
    }, [selectedDate, isAdmin]);



  



    const cacheKey = `${selectedEmail ?? ""}:${selectedDateStr}`;
    const report = reportCache[cacheKey] ?? null;



  useEffect(() => {
    if (selectedEmail && !selectedEmail) {
      setSelectedEmail(user.email ?? null);
    }
  }, [selectedEmail, selectedEmail]);

  useEffect(() => {
    if (isAdmin) {
      const loadUsers = async () => {
        try {
          const res = await fetch("/api/users", { cache: "no-store" });
          if (!res.ok) return;
          const list = (await res.json()) as { email: string; name: string }[];
          setUserOptions(list);
          if (!selectedEmail && list.length > 0) {
            setSelectedEmail(list[0].email);
          }
        } catch (error) {
          console.error("Failed to load users", error);
        }
      };
      void loadUsers();
    }
  }, [isAdmin, selectedEmail]);

  useEffect(() => {

    if (!selectedEmail) return;

    const fetchSummary = async () => {

      const monthStr = format(calendarMonth, "yyyy-MM");

      const query = new URLSearchParams({

        email: selectedEmail,

        month: monthStr,

      });



      try {

        const res = await fetch(`/api/daily-reports/summary?${query.toString()}`);

        if (res.ok) {

          const payload = await res.json().catch(() => null);
          const datesStr: string[] = Array.isArray(payload?.completedDates)
            ? payload.completedDates
            : Array.isArray(payload)
            ? payload
                .filter((row: any) => (row?.uploadedCount ?? 0) > 0)
                .map((row: any) => row?.date)
                .filter(Boolean)
            : [];
          const dates = datesStr.map((dateStr) => parse(dateStr, "yyyy-MM-dd", new Date()));

          setCompletedDates(dates);

        }

      } catch (error) {

        console.error("Failed to fetch report summary", error);

        // Do not block user, just log error

      }

    };



    void fetchSummary();

  }, [selectedEmail, calendarMonth]);





  const emptySlots = useMemo(

    () =>

      dailyReportSlotOrder.map((slot) => ({

        id: slot.id,

        label: slot.label,

        group: slot.group,

      })) as DailyReportResponseSlot[],

    []

  );



  const slots = report?.slots ?? emptySlots;



  const beforeSlots = slots.filter(

    (slot) => slot.group === "before" || slot.id.startsWith("start")

  );

  const afterSlots = slots.filter(

    (slot) => slot.group === "after" || slot.id.startsWith("end")

  );



  const loadReport = useCallback(async () => {

    if (!selectedEmail) return;



    if (reportCache[selectedDateStr]) {

      return;

    }



    setLoading(true);

    setFetchError(null);

    setIsSampleData(false);

    try {

      const query = new URLSearchParams({

        email: selectedEmail,

        date: selectedDateStr,

      });

      const res = await fetch(`/api/daily-reports?${query.toString()}`, {

        method: "GET",

        cache: "no-store",

      });

      if (!res.ok) {

        const body = await res.json().catch(() => ({}));

        throw new Error(body.error || "ไม่สามารถโหลดข้อมูลรายงานได้");

      }

      const data: DailyReportResponse = await res.json();

      setReportCache(prev => ({ ...prev, [cacheKey]: data }));

    } catch (error) {

      console.error("[DailyReport] load error", error);

      if (selectedEmail) {

        const sample = getSampleDailyReport(selectedEmail, selectedDateStr);

        setReportCache(prev => ({ ...prev, [cacheKey]: sample }));

        setIsSampleData(true);

        toast({

          title: "แสดงข้อมูลตัวอย่าง",

          description: "ไม่สามารถเชื่อมต่อแหล่งข้อมูลจริงได้ ระบบจึงแสดงข้อมูลจำลองสำหรับการทดลอง",

        });

      } else {

        setReportCache(prev => {

          const newCache = { ...prev };

          delete newCache[cacheKey];

          return newCache;

        });

      }

    } finally {

      setLoading(false);

    }

  }, [selectedDateStr, selectedEmail, toast, cacheKey]);



  useEffect(() => {

    void loadReport();

  }, [loadReport]);



  const handleFileUpload = useCallback(

    async (slotId: string, file: File) => {

      if (!selectedEmail) return;



      if (isSampleData) {

        toast({

          variant: "destructive",

          title: "ไม่สามารถอัปโหลดไฟล์ได้",

          description: "โหมดทดลองใช้งานแสดงข้อมูลตัวอย่างเท่านั้น กรุณาตั้งค่า Cloudflare R2 เพื่อใช้งานอัปโหลดจริง",

        });

        return;

      }



      if (!ACCEPTED_TYPES.includes(file.type)) {

        toast({

          variant: "destructive",

          title: "รูปแบบไฟล์ไม่ถูกต้อง",

          description: "รองรับเฉพาะไฟล์ JPG, PNG, WEBP หรือ HEIC",

        });

        return;

      }



      if (file.size > MAX_IMAGE_SIZE) {

        toast({

          variant: "destructive",

          title: "ไฟล์ใหญ่เกินไป",

          description: "ขนาดไฟล์ต้องไม่เกิน 5MB",

        });

        return;

      }



      setSlotUploading((prev) => ({ ...prev, [slotId]: true }));



      try {

        const md5 = await md5Base64(file);



        const signRes = await fetch("/api/daily-reports/sign-put", {

          method: "POST",

            headers: { "Content-Type": "application/json" },

            body: JSON.stringify({

            email: selectedEmail,

            date: selectedDateStr,

            slotId,

            fileName: file.name,

            mime: file.type,

            size: file.size,

            md5,

          }),

        });



        if (!signRes.ok) {

          const body = await signRes.json().catch(() => ({}));

          throw new Error(body.error || "ไม่สามารถสร้างลิงก์อัปโหลดได้");

        }



        const { url, key } = await signRes.json();



        const uploadRes = await fetch(url, {

          method: "PUT",

          body: file,

          headers: {

            "Content-Type": file.type,

            "Content-MD5": md5,

          },

        });



        if (!uploadRes.ok) {

          const text = await uploadRes.text();

          throw new Error(

            text || `อัปโหลดไม่สำเร็จ (${uploadRes.status.toString()})`

          );

        }



        const saveRes = await fetch("/api/daily-reports", {

          method: "POST",

            headers: { "Content-Type": "application/json" },

            body: JSON.stringify({

            email: selectedEmail,

            date: selectedDateStr,

            slotId,

            r2Key: key,

            fileName: file.name,

          }),

        });



        if (!saveRes.ok) {

          const body = await saveRes.json().catch(() => ({}));

          throw new Error(body.error || "ไม่สามารถบันทึกข้อมูลได้");

        }



        const updated: DailyReportResponse = await saveRes.json();

        setReportCache(prev => ({ ...prev, [cacheKey]: updated }));



        const uploadedCount = updated.slots.filter(s => s.r2Key).length;

        if (uploadedCount >= TOTAL_DAILY_REPORT_SLOTS) {

          setCompletedDates(prev => {

            if (!prev.find(d => format(d, 'yyyy-MM-dd') === selectedDateStr)) {

              return [...prev, selectedDate];

            }

            return prev;

          });

        }



        toast({

          title: "บันทึกเรียบร้อย",

          description: `${slots.find((slot) => slot.id === slotId)?.label || "รายการ"} ถูกอัปเดตแล้ว`,

        });

      } catch (error) {

        console.error("[DailyReport] upload error", error);

        toast({

          variant: "destructive",

          title: "เกิดข้อผิดพลาดระหว่างการอัปโหลด",

          description:

            error instanceof Error

              ? error.message

              : "ไม่สามารถอัปโหลดรูปภาพได้",

        });

      } finally {

        setSlotUploading((prev) => ({ ...prev, [slotId]: false }));

      }

    },

    [isSampleData, selectedDate, selectedDateStr, slots, toast, selectedEmail, setReportCache]

  );



  const handleFileDelete = useCallback(

    async (slotId: string) => {

      if (!selectedEmail) return;



      if (isSampleData) {

        toast({

          variant: "destructive",

          title: "ไม่สามารถลบไฟล์ได้",

          description: "โหมดทดลองใช้งานแสดงข้อมูลตัวอย่างเท่านั้น",

        });

        return;

      }



      setSlotDeleting((prev) => ({ ...prev, [slotId]: true }));



      try {

        const res = await fetch("/api/daily-reports", {

          method: "DELETE",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify({

            email: selectedEmail,

            date: selectedDateStr,

            slotId,

          }),

        });



        if (!res.ok) {

          const body = await res.json().catch(() => ({}));

          throw new Error(body.error || "ไม่สามารถลบไฟล์ได้");

        }



        const updated: DailyReportResponse = await res.json();

        setReportCache(prev => ({ ...prev, [cacheKey]: updated }));



        const uploadedCount = updated.slots.filter(s => s.r2Key).length;

        if (uploadedCount < TOTAL_DAILY_REPORT_SLOTS) {

          setCompletedDates(prev => prev.filter(d => format(d, 'yyyy-MM-dd') !== selectedDateStr));

        }



        toast({

          title: "ลบรูปภาพเรียบร้อย",

          description: `${slots.find((slot) => slot.id === slotId)?.label || "รายการ"} ถูกลบแล้ว`,

        });

      } catch (error) {

        console.error("[DailyReport] delete error", error);

        toast({

          variant: "destructive",

          title: "เกิดข้อผิดพลาดระหว่างการลบ",

          description:

            error instanceof Error ? error.message : "ไม่สามารถลบรูปภาพได้",

        });

      } finally {

        setSlotDeleting((prev) => ({ ...prev, [slotId]: false }));

      }

    },

    [isSampleData, selectedDateStr, slots, toast, selectedEmail, setReportCache]

  );



  if (!selectedEmail) {

    return (

      <div className="mx-auto max-w-3xl py-12 text-center">

        <h1 className="text-2xl font-semibold">จำเป็นต้องเข้าสู่ระบบ</h1>

        <p className="mt-2 text-muted-foreground">

          กรุณาเข้าสู่ระบบด้วยบัญชีพนักงานเพื่อบันทึก Daily Report

        </p>

      </div>

    );

  }



  return (

    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">

      <div>

        <h1 className="text-3xl font-semibold tracking-tight text-foreground">

          Daily Report

        </h1>

        <p className="mt-2 text-sm text-muted-foreground">

          บันทึกข้อมูลพร้อมรูปภาพประกอบของการปฏิบัติงานแต่ละขั้นตอน สามารถอัปโหลดเพิ่มได้ตลอดวัน

        </p>

      </div>



      <div className="grid gap-4 rounded-lg border bg-card p-4 shadow-sm md:grid-cols-[1fr_auto] md:items-end">

        <div className="space-y-2">

          <Label htmlFor="daily-report-date">เลือกวันที่</Label>

          <Popover>

            <PopoverTrigger asChild>

              <Button

                variant={"outline"}

                className={cn(

                  "w-[280px] justify-start text-left font-normal",

                  !selectedDate && "text-muted-foreground"

                )}

              >

                <CalendarIcon className="mr-2 h-4 w-4" />

                {selectedDate ? (

                  format(selectedDate, "PPP")

                ) : (

                  <span>เลือกวันที่</span>

                )}

              </Button>

            </PopoverTrigger>

            <PopoverContent className="w-auto p-0">

              <Calendar

                mode="single"

                selected={selectedDate}

                                onSelect={(date) => date && setSelectedDate(date)}

                                disabled={{

                                  after: new Date(),

                                }}

                                initialFocus

                                month={calendarMonth}

                                onMonthChange={setCalendarMonth}

                                modifiers={{ completed: completedDates }}

                                modifiersClassNames={{ completed: 'rdp-day_completed' }}

                              />

                            </PopoverContent>

                        </Popover>

                        <p className="text-xs text-muted-foreground">

                          ระบบจะแยกบันทึกตามวันที่ที่เลือก

                        </p>

                      </div>

                      {isAdmin && (
                        <div className="space-y-2">
                          <Label>เลือกผู้ขับ</Label>
                          <Select
                            value={selectedEmail ?? ""}
                            onValueChange={(val) => {
                              setSelectedEmail(val);
                              setReportCache({});
                              setCompletedDates([]);
                            }}
                          >
                            <SelectTrigger className="w-[220px]">
                              <SelectValue placeholder="เลือกผู้ขับ" />
                            </SelectTrigger>
                            <SelectContent>
                              {userOptions.map((u) => (
                                <SelectItem key={u.email} value={u.email}>
                                  {u.name || u.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="flex gap-2">

                          <Button

                            type="button"

                            variant="outline"

                            onClick={() => {

                              setReportCache(prev => {

                                const newCache = { ...prev };

                                delete newCache[selectedDateStr];

                                return newCache;

                              });

                              void loadReport();

                            }}

                            disabled={loading}

                          >

                            {loading ? (

                              <>

                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />

                                กำลังโหลด...

                              </>

                            ) : (

                              <>

                                <RefreshCcw className="mr-2 h-4 w-4" />

                                โหลดข้อมูลใหม่

                              </>

                            )}

                          </Button>

                        </div>

                      </div>

                

                      {fetchError && (

                        <Alert variant="destructive">

                          <AlertTitle>ไม่สามารถโหลดข้อมูลได้</AlertTitle>

                          <AlertDescription>{fetchError}</AlertDescription>

                        </Alert>

                      )}

                      {isSampleData && (

                        <Alert>

                          <AlertTitle>กำลังแสดงข้อมูลตัวอย่าง</AlertTitle>

                          <AlertDescription>

                            ระบบไม่สามารถเชื่อมต่อ Cloudflare R2 ได้ในขณะนี้ จึงแสดงข้อมูลจำลองสำหรับการทดลองใช้งาน Daily Report

                          </AlertDescription>

                        </Alert>

                      )}

                

                      {loading && !report ? (

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                          {Array.from({ length: TOTAL_DAILY_REPORT_SLOTS }).map((_, index) => (

                            <DailyReportSlotCard.Skeleton key={index} />

                          ))}

                        </div>

                      ) : (

                        <>

                          <div>

                            <h2 className="text-xl font-semibold tracking-tight">

                              ก่อนออกเดินทาง

                            </h2>

                            <p className="text-sm text-muted-foreground">

                              บันทึกข้อมูล ณ เวลาที่เริ่มงาน เช่น สภาพรถ, เอกสาร, และการแต่งกาย

                            </p>

                          </div>

                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                            {beforeSlots.map((slot) => (

                              <DailyReportSlotCard

                                key={slot.id}

                                slot={slot}

                                uploading={slotUploading[slot.id]}

                                deleting={slotDeleting[slot.id]}

                                onSelectFile={(file) => handleFileUpload(slot.id, file)}

                                onDelete={() => handleFileDelete(slot.id)}

                                disabled={isSampleData || isReadOnly}

                                disabledReason={

                                  isSampleData

                                    ? "ไม่สามารถอัปโหลดในโหมดตัวอย่างได้"

                                    : isReadOnly

                                    ? "ไม่สามารถแก้ไขข้อมูลย้อนหลังเกิน 3 วันได้ (เฉพาะพนักงาน)"

                                    : undefined

                                }

                              />

                            ))}

                          </div>

                          <div>

                            <h2 className="text-xl font-semibold tracking-tight">

                              หลังเดินทางกลับ

                            </h2>

                            <p className="text-sm text-muted-foreground">

                              บันทึกข้อมูล ณ เวลาที่จบงาน เช่น สภาพรถ, คืนเอกสาร, และสรุปงาน

                            </p>

                          </div>

                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                            {afterSlots.map((slot) => (

                              <DailyReportSlotCard

                                key={slot.id}

                                slot={slot}

                                uploading={slotUploading[slot.id]}

                                deleting={slotDeleting[slot.id]}

                                onSelectFile={(file) => handleFileUpload(slot.id, file)}

                                onDelete={() => handleFileDelete(slot.id)}

                                disabled={isSampleData || isReadOnly}

                                disabledReason={

                                  isSampleData

                                    ? "ไม่สามารถอัปโหลดในโหมดตัวอย่างได้"

                                    : isReadOnly

                                    ? "ไม่สามารถแก้ไขข้อมูลย้อนหลังเกิน 3 วันได้"

                                    : undefined

                                }

                              />

                            ))}

                          </div>

                        </>

                      )}

    </div>

  );

}
