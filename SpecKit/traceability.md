# Requirement Traceability Matrix (ตารางตรวจสอบความครบถ้วน)

ตารางนี้ใช้สำหรับติดตามว่าแต่ละ Feature (F-XXX) ถูกพัฒนาเป็น Task (T-XXX) ใด และอยู่ในไฟล์ไหน

| Feature ID | Spec Header | Tasks | Key Code Files | Status |
| :--- | :--- | :--- | :--- | :--- |
| **[F-001]** | Admin Authentication (ระบบล็อกอินแอดมิน) | [T-010] | `src/auth.ts`, `.env.local` | Done (เสร็จแล้ว) |
| **[F-002]** | Driver App Form (ฟอร์มใบสมัครคนขับ) | [T-011], [T-020], [T-047] | `src/app/driver/*`, `src/app/api/applications/*`, `docs/d1-summary.sql` | Done (Merged) |
| **[F-003]** | Document Upload R2 (อัปโหลดเอกสาร) | [T-012], [T-048], [T-049], [T-050] | `src/lib/r2.ts`, `docs/worker-d1-summary.js` | Done (เสร็จแล้ว) <br> *Fix: CORS & Auth logic for /files/* <br> *Support: English (new) & Thai (legacy) folder paths* |
| **[F-004]** | Completeness Check (เช็คความครบถ้วน) | [T-021] | `src/lib/validation.ts` | Planned (วางแผน) |
| **[F-005]** | Verification Workflow (ระบบตรวจสอบ) | [T-022] | `src/app/admin/verify/page.tsx` | Planned (วางแผน) |
| **[F-006]** | Status Management (จัดการสถานะ) | [T-022] | `src/lib/status.ts` | Planned (วางแผน) |
| **[F-007]** | AI Analysis Tool (AI วิเคราะห์) | [T-030] | `src/ai/dev.ts` | Planned (วางแผน) |
| **[F-008]** | Performance Tuning (ปรับจูนระบบ) | [T-042] | `src/components/daily-report/*` | Done (เสร็จแล้ว) <br> *Note: ระวังเรื่อง Prop mismatch และ MD5 calculation order* |
| **[F-009]** | Security Cleanup (ความปลอดภัย) | [T-043] | `src/auth.ts` | Done (เสร็จแล้ว) |
| **[F-010]** | Daily Report Review (ตรวจรายงาน) | [T-023], [T-024], [T-026] | `src/components/daily-report-overview/*` | Phase 2 Done, Bug Fixing |
| **[F-011]** | Data Export (ส่งออกข้อมูล) | [T-025] | `dashboard/daily-report-tracker.tsx` | Done (เสร็จแล้ว) |
| **[F-012]** | Idle Timeout Protection (ระบบล็อคเมื่อไม่ใช้งาน) | [T-045] | `components/idle-lock.tsx` | Done (เสร็จแล้ว) |
| **[F-013]** | Dashboard UX Refinement (ปรับปรุงการใช้งาน Dashboard) | [T-046] | `components/dashboard/daily-report-tracker.tsx` | Done (เสร็จแล้ว) |

## Data/Variable Traceability (โครงข่ายตัวแปรและแหล่งข้อมูล)
ตารางนี้ใช้ Map ระหว่าง Entity <-> ตัวแปรใน Code เพื่อให้ง่ายต่อการ Debug และพัฒนาต่อ

| ข้อมูลหลัก (Entity) | ชื่อ Interface/Type | ตัวแปร State หลัก (Key State Variables) | ไฟล์ที่เกี่ยวข้อง (Related Files) | หมายเหตุ (Notes) |
| :--- | :--- | :--- | :--- | :--- |
| **Application** | `AppRow` | `applications`, `filteredApplications` | `dashboard/applications-client.tsx`, `lib/types.ts` | ใช้ `D1` เป็นหลัก |
| **User** | `User` | `user` | `hooks/use-auth.ts`, `src/auth.ts` | Role-based (admin/user) |
| **DailyReport** | `DailyReportResponse` | `report`, `reportCache` | `daily-report/daily-report-view.tsx`, `lib/daily-report.ts` | มี LRU Cache |
| **DailyReportSlot** | `DailyReportResponseSlot` | `slots` | `daily-report/daily-report-view.tsx` | ใช้ `id` เป็น Key |
| **DailyReportSummary** | `DailyReportSummaryRow` | `rows`, `filteredRows` | `dashboard/daily-report-tracker.tsx`, `lib/daily-report.ts` | หน้า Overview |
