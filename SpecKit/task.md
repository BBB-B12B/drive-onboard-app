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
    - **Sub-tasks (งานย่อย)**:
        - [x] Implement Web Worker for Image Processing
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

