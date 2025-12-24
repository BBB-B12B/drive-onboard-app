# Requirement Traceability Matrix (ตารางตรวจสอบความครบถ้วน)

ตารางนี้ใช้สำหรับติดตามว่าแต่ละ Feature (F-XXX) ถูกพัฒนาเป็น Task (T-XXX) ใด และอยู่ในไฟล์ไหน

| Feature ID | Spec Header | Tasks | Key Code Files | Status |
| :--- | :--- | :--- | :--- | :--- |
| **[F-001]** | Admin Authentication (ระบบล็อกอินแอดมิน) | [T-010] | `src/auth.ts`, `.env.local` | Done (เสร็จแล้ว) |
| **[F-002]** | Driver App Form (ฟอร์มใบสมัครคนขับ) | [T-011], [T-020] | `src/app/driver/page.tsx`, `docs/d1-summary.sql` | In Progress (กำลังทำ) |
| **[F-003]** | Document Upload R2 (อัปโหลดเอกสาร) | [T-012] | `src/lib/r2.ts` (Managed) | Done (เสร็จแล้ว) |
| **[F-004]** | Completeness Check (เช็คความครบถ้วน) | [T-021] | `src/lib/validation.ts` | Planned (วางแผน) |
| **[F-005]** | Verification Workflow (ระบบตรวจสอบ) | [T-022] | `src/app/admin/verify/page.tsx` | Planned (วางแผน) |
| **[F-006]** | Status Management (จัดการสถานะ) | [T-022] | `src/lib/status.ts` | Planned (วางแผน) |
| **[F-007]** | AI Analysis Tool (AI วิเคราะห์) | [T-030] | `src/ai/dev.ts` | Planned (วางแผน) |
| **[F-008]** | Performance Tuning (ปรับจูนระบบ) | [T-042] | `src/components/daily-report/*` | Done (เสร็จแล้ว) <br> *Note: ระวังเรื่อง Prop mismatch และ MD5 calculation order* |
| **[F-009]** | Security Cleanup (ความปลอดภัย) | [T-043] | `src/auth.ts` | Done (เสร็จแล้ว) |
