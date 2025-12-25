# Task Roadmap (แผนงาน)

## Phase 1: Setup & Infrastructure (การติดตั้งและโครงสร้างพื้นฐาน)

- [x] **[T-001] Initial Project Setup**
    - **Concept/Goal (แนวคิด)**: เริ่มต้นโปรเจกต์ Next.js พร้อมติดตั้ง Tailwind และ Shadcn UI
    - **Status**: Completed (เสร็จสิ้น)

- [x] **[T-002] Create Unified Startup Script (Server + Worker)**
    - **Concept/Goal (แนวคิด)**: สร้างคำสั่งเดียวเพื่อรันทั้ง Next.js dev server และ Cloudflare Worker พร้อมกันในเครื่อง local เพื่อความสะดวกในการพัฒนา
    - **Principles (หลักการ)**: Developer Experience (DX - ประสบการณ์นักพัฒนาต้องดี), Fail-fast (ถ้าตัวใดตัวหนึ่งพัง ให้หยุดทำงานทั้งคู่)
    - **Implementation Details (รายละเอียดการพัฒนา)**:
        - **Logic/State**: สร้าง `scripts/dev-start.sh` จัดการ kill ports (9002, 8787) และ run processes
        - **Data**: ไม่เกี่ยวข้อง
    - **Confirmed Behavior (พฤติกรรมที่ต้องทดสอบ)**: เมื่อรัน `npm run dev:all` ทั้ง Worker และ Web Server ทำงาน, Browser เปิดอัตโนมัติ, Ctrl+C หยุดทุกอย่าง
    - **Sub-tasks (งานย่อย)**:
        - [x] ค้นหาและติดตั้ง `concurrently` (ใช้ Bash script แทนเพื่อความยืดหยุ่นกว่า)
        - [x] สร้างไฟล์ `start-worker.sh` (เป็น `scripts/dev-start.sh`)
        - [x] อัปเดต `package.json` scripts (`dev:all`)

- [x] **[T-003] Establish SpecKit Standards**
    - **Concept/Goal (แนวคิด)**: วางมาตรฐานเอกสารแบบ "Paystub Model" หรือ Spec-First
    - **Principles (หลักการ)**: Single Source of Truth (ความจริงหนึ่งเดียว), Traceability (ตรวจสอบย้อนกลับได้)
    - **Implementation Details (รายละเอียดการพัฒนา)**:
        - **Logic**: สร้างโฟลเดอร์ `SpecKit` และไฟล์มาตรฐาน (`spec`, `instruction`, `task`, `traceability`)
    - **Confirmed Behavior (พฤติกรรมที่ต้องทดสอบ)**: มีไฟล์ครบทั้ง 4 ไฟล์และโครงสร้างถูกต้องตาม `AI.md`
    - **Sub-tasks (งานย่อย)**:
        - [x] สร้างไฟล์ตั้งต้น (Initial files)
        - [x] อัปเดต `task.md` เป็นแบบ Rich Schema (ขั้นตอนนี้)

## Phase 2: Core Features (ฟีเจอร์หลัก - Authentication & Data)

- [x] **[T-010] Implement Firebase Auth with Admin Claims**
    - **Concept/Goal (แนวคิด)**: ปกป้องส่วน Admin โดยใช้ Authentication (NextAuth + D1)
    - **Principles (หลักการ)**: Security First (ความปลอดภัยต้องมาก่อน), Least Privilege (ให้สิทธิ์เท่าที่จำเป็น)
    - **Implementation Details (รายละเอียดการพัฒนา)**:
        - **UI/UX**: หน้า Login (`/login`) และ Route Wrapper สำหรับป้องกันการเข้าถึง
        - **Logic/State**: ใช้ NextAuth (`src/auth.ts`) รองรับ both D1 Users & Mock Users
        - **Data**: เก็บ `role` ใน Session/JWT
    - **Confirmed Behavior (พฤติกรรมที่ต้องทดสอบ)**: User ทั่วไปเข้าหน้า `/admin` ไม่ได้, Admin สามารถ Login เข้าใช้งานได้
    - **Sub-tasks (งานย่อย)**:
        - [x] ตั้งค่า NextAuth Provider
        - [x] สร้างหน้าจอ Login
        - [x] ทำระบบ Route Protection (Middleware/AuthGuard)

- [x] **[T-011] Setup Cloudflare D1 Schema & Connections**
    - **Concept/Goal (แนวคิด)**: สร้างโครงสร้าง Database สำหรับ Daily Reports และใบสมัครคนขับ (Driver Applications)
    - **Principles (หลักการ)**: Data Integrity (ความถูกต้องของข้อมูล), Scalability (ขยายตัวได้)
    - **Implementation Details (รายละเอียดการพัฒนา)**:
        - **Logic**: เขียนไฟล์ `.sql` migration
        - **Data**: ตาราง: `drivers`, `applications`, `daily_report_summary`
    - **Confirmed Behavior (พฤติกรรมที่ต้องทดสอบ)**: ตารางถูกสร้างขึ้นจริงทั้งใน local D1 และ remote D1
    - **Sub-tasks (งานย่อย)**:
        - [x] นิยาม SQL Schema
        - [x] รันคำสั่ง D1 Migrations

- [x] **[T-012] Implement Cloudflare R2 Upload Flow**
    - **Concept/Goal (แนวคิด)**: อนุญาตให้อัปโหลดไฟล์ตรงไปที่ R2 Storage
    - **Principles (หลักการ)**: Performance (อัปโหลดตรงเพื่อลดภาระ Server), Security (ใช้ Presigned URLs)
    - **Implementation Details (รายละเอียดการพัฒนา)**:
        - **UI/UX**: ปุ่มเลือกไฟล์ พร้อม Progress Bar
        - **Logic**: Server สร้าง Presigned PUT URL -> Client ทำการ PUT ไฟล์ขึ้นไป
    - **Confirmed Behavior (พฤติกรรมที่ต้องทดสอบ)**: ไฟล์ไปโผล่ใน R2 bucket
    - **Sub-tasks (งานย่อย)**:
        - [x] สร้าง API สำหรับขอ Presigned URL
        - [x] เขียน Logic ฝั่ง Client สำหรับอัปโหลด

## Phase 3: Application Logic (Planned)

- [ ] **[T-020] Build Driver Application Wizard Form (ทำฟอร์มใบสมัคร)**
    - **Concept/Goal (แนวคิด)**: ฟอร์มหลายขั้นตอน (Wizard) สำหรับรับสมัครคนขับ
    - **Principles (หลักการ)**: User Friendly (ใช้ง่าย), Validation Feedback (แจ้งเตือนเมื่อกรอกผิด)
    - **Sub-tasks (งานย่อย)**:
        - [ ] ขั้นตอนข้อมูลส่วนตัว (Personal Info)
        - [ ] ขั้นตอนข้อมูลรถ (Vehicle Info)
        - [ ] ขั้นตอนอัปโหลดเอกสาร (Document Upload)

- [ ] **[T-021] Implement Document Completeness Logic (ตรวจสอบเอกสารครบถ้วน)**
    - **Concept/Goal (แนวคิด)**: คำนวณหาเอกสารที่ยังขาดอยู่โดยอัตโนมัติ
    - **Principles (หลักการ)**: Business Logic Isolation (แยก Logic ธุรกิจออกมาให้ชัด)

- [ ] **[T-022] Develop Admin Verification Dashboard (หน้าตรวจสอบสำหรับ Admin)**
    - **Concept/Goal (แนวคิด)**: หน้าจอให้ Admin กดอนุมัติ/ปฏิเสธเอกสาร
    - **Principles (หลักการ)**: Efficiency (ทำงานไว), Clear Feedback (ระบุเหตุผลชัดเจน)

- [x] **[T-023] Implement Daily Report Detail Popup (Popup แสดงรายละเอียดรายงาน)**
    - **Concept/Goal (แนวคิด)**: หน้าต่าง Popup สำหรับดูและแก้ไข Daily Report ของพนักงานแต่ละคนผ่านหน้า Overview โดยไม่ต้องเปลี่ยนหน้า
    - **Principles (หลักการ)**: Reusability (ใช้ Component เดิม), Consistency (หน้าตาเหมือนหน้าปกติ), Single Source of Truth (ใช้ API เดียวกัน)
    - **Implementation Details (รายละเอียดการพัฒนา)**:
        - **UI/UX**: `Dialog` (Shadcn UI) คลุม `DailyReportView` (หรือ Refactor ให้เป็น reusable component)
        - **Logic/State**: รับ `email` และ `date` เป็น Props เพื่อโหลดข้อมูล
        - **Data**: Reuse `/api/daily-reports` (GET, PUT, DELETE) ตัวเดิม
    - **Confirmed Behavior (พฤติกรรมที่ต้องทดสอบ)**:
        - กดที่แถวในตาราง Overview -> Popup แสดง
        - เห็นรูปภาพและสถานะถูกต้อง
        - สามารถอัปโหลด/ลบรูปใน Popup ได้ และผลลัพธ์บันทึกลง D1/R2 ทันที
    - **Sub-tasks (งานย่อย)**:
        - [x] Extract `DailyReportView` logic to be reusable (accept props)
        - [x] Add `onClick` handler to `DailyReportOverview` table rows
        - [x] Implement `DailyReportDialog` component
            - **Error Encountered**: Runtime Error `onSelectFile is not a function`
            - **Root Cause**: Prop Mismatch ระหว่าง `DailyReportView` (ส่ง `onUpload`) กับ `DailyReportSlotCard` (รับ `onSelectFile`)
            - **Solution**: แก้ชื่อ Prop ใน `DailyReportSlotCard` ให้เป็น `onUpload` ให้ตรงกัน
            - **Prevention**: ตรวจสอบ Interface Props ให้ดีเมื่อมีการ Refactor หรือ Reuse Component เดิม

- [x] **[T-024] Enforce Retroactive Upload Restriction (จำกัดการลงรายงานย้อนหลัง)**
    - **Concept/Goal**: ป้องกันพนักงานลงเวลาย้อนหลัง (Cheat Prevention) อนุญาตเฉพาะ Admin
    - **Principles**: Access Control (คัดกรองสิทธิ์ตาม Role และ Time), Client-Side enforcement (UX)
    - **Implementation Details**:
        - **Logic**: ใน `DailyReportView`, เช็ค `user.role`
            - ถ้าเป็น `user` -> ยอมให้แก้เฉพาะ `isSameDay(selectedDate, today)`
            - ถ้าเป็น `admin` -> แก้ได้ตลอด
    - **Confirmed Behavior**: Login user ปกติ กดเลือกวันที่เมื่อวาน -> **ไม่เห็นปุ่ม Upload/Delete เลย** (View Only)
    - **Sub-tasks**:
        - [x] Update `isReadOnly` logic in `daily-report-view.tsx`
            - **Error Encountered**: TS Error `Property 'readOnly' does not exist on type...`
            - **Root Cause**: ส่ง Prop `readOnly` ไปยัง `DailyReportSlotCard` แต่ลืมอัปเดต Interface ของลูก
            - **Solution**: เปลี่ยนชื่อ Prop ที่ส่งไปเป็น `disabled` ให้ตรงกับ Interface เดิมของลูก (ไม่ต้องแก้ลูก)
            - **Prevention**: ตรวจสอบ Interface Props ให้ดีเมื่อมีการ Refactor หรือ Reuse Component เดิม

- [x] **[T-025] Export Daily Report Data (ส่งออกข้อมูลรายงาน)**
    - **Concept/Goal**: ช่วยให้ Admin สามารถนำข้อมูลดิบออกไปวิเคราะห์ต่อใน Excel ได้ง่าย
    - **Principles**: User Convenience (สะดวกใช้), Client-side Processing (ลดภาระ Server)
    - **Implementation Details**:
        - **UI**: เพิ่มปุ่ม "Export CSV" ข้างๆ ปุ่ม Filter พร้อมไอคอน `Download`
        - **Logic**: แปลงข้อมูล `filteredRows` เป็น CSV format (UTF-8 with BOM) แล้ว trigger download
        - **Library**: ใช้ Client-side Logic (No extra libs) เพื่อลด Bundle Size
    - **Confirmed Behavior**:
        - ปุ่ม Export Disabled เมื่อไม่มีข้อมูล
        - กดแล้วได้ไฟล์ `.csv` ที่เปิดอ่านภาษาไทยรู้เรื่อง (มี BOM)
    - **Sub-tasks**:
        - [x] สร้างปุ่ม Export Component
        - [x] Implement CSV conversion logic

- [x] **[T-026] Fix D1 Database Sync on Delete (แก้บัฟลบรูปแล้ว D1 ไม่อัปเดต)**
    - **Concept/Goal**: เมื่อ User ลบรูปภาพออกจาก Daily Report, ค่า `uploaded_count` ในตาราง `daily_report_summary` ต้องลดลงทันทีเพื่อให้ข้อมูลตรงกัน
    - **Principles**: Data Consistency (ความถูกต้องของข้อมูล)
    - **Problem Description**: User รายงานว่าลบรูปแล้ว แต่ Overview ยังขึ้นจำนวนเท่าเดิม หรือ Status ไม่เปลี่ยนกลับเป็น 'partial'/'missing'
    - **Investigation Plan**:
        - ตรวจสอบ `API DELETE /api/daily-reports` -> (พบว่าทำงานถูกต้อง)
        - ดู Logic Update -> Found Frontend Stale State (ไม่ได้ Refresh List หลัง Popup ปิด)
    - **Solution**: เพิ่ม Callback `onUpdate` ให้ `DailyReportView` แจ้งเตือน Parent เมื่อมีการเปลี่ยนแปลงข้อมูล
    - **Sub-tasks**:
        - [x] Verify API Logic
        - [x] Fix Update Query (Added Frontend Refresh Logic)
        - [x] Verify with Manual Test

## Phase 4: AI Integration (Planned)

- [ ] **[T-030] Implement Genkit Flow for Incomplete Form Analysis (AI วิเคราะห์ใบสมัคร)**
    - **Concept/Goal (แนวคิด)**: ใช้ AI แนะนำผู้สมัครเมื่อกรอกข้อมูลไม่ครบ
    - **Principles (หลักการ)**: Helpful (เป็นประโยชน์), Non-intrusive (ไม่รบกวนเกินไป)

## Phase 5: Polish & Deploy (Planned)

- [ ] **[T-040] Final UI Polish (เก็บงาน UI/Mobile)**
- [ ] **[T-041] Production Deployment Setup (ตั้งค่า Deploy จริง)**

- [x] **[T-042] Performance Optimization (ปรับปรุงประสิทธิภาพ)**
    - **Concept/Goal (แนวคิด)**: ลดการใช้ทรัพยากรและแก้ปัญหาคอขวด (Bottlenecks)
    - **Principles (หลักการ)**: User Experience First (ลื่นไหล), Resource Efficiency (ประหยัดแรม/CPU)
    - **Implementation Details (รายละเอียดการพัฒนา)**:
        - **Logic/State**:
            1. **Fix Memory Leak**: ใช้ LRU Cache (Limit 20) ใน `daily-report-view.tsx`
            2. **Optimize Image Comporession**: ย้าย `compressImage` และ `md5` ไปทำใน `src/workers/image-processor.ts` (Web Worker)
        - **Data**: เปลี่ยนการเรียก D1 ให้มี Caching Strategy ที่เหมาะสม (SWR)
    - **Confirmed Behavior (พฤติกรรมที่ต้องทดสอบ)**: หน้าเว็บไม่กระตุกเมื่ออัปโหลดไฟล์ใหญ่, Memory usage ไม่พุ่งสูง
    > [!CAUTION]
    > **Interface Mismatch Warning**: เมื่อมีการปรับแก้ Component ให้ตรวจสอบชื่อ Props ให้ตรงกันเสมอ (เช่น `onUpload` vs `onSelectFile`) เพื่อป้องกัน Runtime Error ที่ตรวจสอบยาก
    > **Logic Order Warning**: ในการอัปโหลดไฟล์ที่ต้องมีการ Process (เช่น ย่อรูป) ต้องคำนวณ MD5 *หลังจาก* Process เสร็จสิ้นแล้วเสมอ ห้ามคำนวณจากไฟล์ต้นฉบับ
    - **Sub-tasks (งานย่อย)**:
        - [x] Implement Web Worker for Image Processing
            - **Error Encountered**: MD5 Mismatch on Upload (Cloudflare R2 Reject)
            - **Root Cause**: Web Worker คำนวณ MD5 จากไฟล์ต้นฉบับ *ก่อน* ทำการบีบอัด (Compress) ทำให้ Hash ไม่ตรงกับไฟล์ที่อัปจริง
            - **Solution**: สลับ Order ใน Worker ให้บีบอัดก่อนแล้วค่อยคำนวณ MD5
            - **Prevention**: Logic ที่เกี่ยวกับ File Hash ต้องทำเป็นขั้นตอนสุดท้ายก่อน Upload เสมอ
        - [x] Refactor State Cache to use proper cache manager
        - [x] Analyze/Reduce Bundle Size (e.g. optimize lodash imports)

- [x] **[T-043] Clean Up Sample Data & Hardcoded Logic (ล้างโค้ดส่วนเกิน)**
    - **Concept/Goal (แนวคิด)**: กำจัด "Dead Code" และ "Insecure Fallbacks" ก่อนขึ้น Production
    - **Principles (หลักการ)**: Security First (ห้ามมี Backdoor), Clean Code (ลดความซับซ้อน)
    - **Implementation Details (รายละเอียดการพัฒนา)**:
        - **Logic/State**:
            1. **Remove Auth Fallback**: ใน `auth.ts`, ลบ logic ที่ไปดึง `sampleAccounts` ถ้า `NODE_ENV === 'production'`
            2. **Type Cleanup**: แก้ไข Type Comparison ใน `d1-users.ts` ที่เป็น `User["role"]` ให้ถูกต้อง
    - **Confirmed Behavior (พฤติกรรมที่ต้องทดสอบ)**: Login ด้วย Sample Account ต้องไม่ได้ใน Production Mode
    - **Sub-tasks (งานย่อย)**:
        - [x] Disable Sample Auth in Production
        - [x] Fix TypeScript Errors in `d1-users.ts`

- [x] **[T-044] Dashboard Performance & Session Tuning (ปรับจูน Dashboard และ Session)**
    - **Concept/Goal**: แก้ปัญหา Dashboard หน่วงเมื่อข้อมูลเยอะ และปรับแต่ง Session
    - **Principles**: Virtualization/Pagination (แบ่งแสดงผล), Debounce (ลดการคำนวณซ้ำ)
    - **Problem**: Table Render 1,500 rows (50 users * 30 days) พร้อมกันทำให้ DOM ช้า
    - **Implementation Details**:
        - **UI**: เพิ่ม Pagination Control ใต้ตาราง
        - **Logic**:
            - Implement Client-side Pagination (limit 50 rows/page)
            - Debounce Search Input
            - Configure NextAuth Session maxAge (30 days) explicit setting
    - **Sub-tasks**:
        - [x] Add Client-side Pagination
        - [x] Debounce Name Filter
        - [x] Update NextAuth Config

- [x] **[T-045] Implement Idle Timeout Lock (ระบบล็อคหน้าจอเมื่อไม่ใช้งาน)**
    - **Concept/Goal**: ป้องกันการเปิดหน้าจอทิ้งไว้โดยไม่ได้ใช้งาน (Security & Privacy)
    - **Principles**: Client-side Activity Detection
    - **Requirement**:
        - หาก User ไม่มีการขยับเมาส์หรือกดคีย์บอร์ดเกิน 3 นาที
        - ให้แสดงหน้าจอเบลอ (Blur Screen Overlay) บังข้อมูลทั้งหมด
        - มีปุ่ม "กลับเข้าสู่ระบบ" (Resume/Unlock) เพื่อใช้งานต่อ
    - **Implementation Details**:
        - **UI**: Fullscreen fixed overlay (`z-50`), Light Backdrop Blur (`backdrop-blur-sm`), Minimal Text ("รอคุณกลับเข้าสู่ระบบ")
        - **Logic**: `useIdle` custom hook tracking `mousemove`, `keydown` events
    - **Sub-tasks**:
        - [x] Create `useIdle` hook
        - [x] Create `IdleLockScreen` component
            - **Bug**: Previously auto-unlocked on mouse move.
            - **Fix**: Modified `useIdle` to detach listeners when idle state is active, enforcing manual unlock button (Case: User Request).
        - [x] Integrate into Main Layout

- [x] **[T-046] Dashboard UX Refinement (Infinite Scroll & Sort)**
    - **Concept/Goal**: เปลี่ยนรูปแบบการแสดงผลเป็น Infinite Scroll ในกรอบ Table ที่มีความสูงคงที่ และเพิ่มความสามารถในการ Sort
    - **Constraint**:
        - **Fixed Height**: Table Container ต้องมีความสูง Fix (เช่น 600px) และมี Scroll bar ในตัว
        - **Infinite Scroll**: เลื่อนลงล่างสุดเพื่อโหลดเพิ่ม 50 รายการ (แทน Pagination เดิม)
        - **Sorting**: หัวตารางคลิกเพื่อเรียงลำดับได้
        - **Default Sort**: วันที่ล่าสุดอยู่บนสุด (Date DESC)
    - **Implementation Details**:
        - **UI**: `h-[600px] overflow-y-auto` ที่ container
        - **Logic**:
            - Remove `Pagination Controls`
            - Add `IntersectionObserver` trigger at bottom of list
            - Implement `sortConfig` state `{ key, direction }`
    - **Sub-tasks**:
        - [x] Switch to Fixed Height & Infinite Scroll
        - [x] Implement Sortable Headers
        - [x] Set Default Sort to Date DESC
        - [x] **Fix Sticky Header**: เปลี่ยนใช้ `<table>` ธรรมดาแทน Component เพื่อแก้บั๊ก Header เลื่อนตาม Scroll

