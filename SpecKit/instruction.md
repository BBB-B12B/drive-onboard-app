# Instruction & Standards (คู่มือและมาตรฐานการพัฒนา)

## 1. Tech Stack (เทคโนโลยีที่ใช้)
- **Framework**: Next.js 15.3.3 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI (Radix Primitives)
- **Auth**: Firebase Auth (`next-auth` หรือ Firebase SDK โดยตรง)
- **Database**: Cloudflare D1
- **Storage**: Cloudflare R2
- **AI Engine**: Genkit (Google Vertex AI)
- **Package Manager**: npm

## 2. Folder Structure (โครงสร้างไฟล์)
```
/
├── .idx/                   # การตั้งค่า Project IDX
├── .next/                  # ไฟล์ที่ Build แล้วของ Next.js
├── docs/                   # เอกสารเก่า & SQL
├── SpecKit/                # ศูนย์รวมเอกสารของโปรเจกต์ (โฟลเดอร์นี้)
│   ├── spec.md             # Functional Requirements (ความต้องการระบบ)
│   ├── instruction.md      # Tech Stack & Rules (กฎและเทคโนโลยี)
│   ├── task.md             # Project Management (แผนงาน)
│   └── traceability.md     # Requirement Mapping (ตารางตรวจสอบความครบถ้วน)
├── src/
│   ├── app/                # Next.js App Router Pages (หน้าเว็บ)
│   ├── components/         # React Components (UI และชิ้นส่วนต่างๆ)
│   ├── lib/                # Utility functions, DB clients (ฟังก์ชันกลาง)
│   ├── hooks/              # Custom React Hooks
│   └── ai/                 # Genkit Flows & AI Logic
├── public/                 # Static Assets (รูปภาพ, ไอคอน)
└── [Config Files]          # next.config.ts, tailwind.config.ts, ฯลฯ
```

## 3. Conventions (ข้อตกลงร่วมกัน)
- **Naming (การตั้งชื่อ)**: 
  - Files: `kebab-case.ts` / `kebab-case.tsx` (ตัวพิมพ์เล็กคั่นด้วยขีด)
  - Components: `PascalCase` (ขึ้นต้นด้วยตัวใหญ่)
  - Functions: `camelCase` (ตัวเล็กขึ้นต้น คำต่อไปตัวใหญ่)
- **State Management**: เน้นใช้ React Server Components (RSC) เป็นหลัก; ใช้ Client state (Hooks/Context) เฉพาะส่วนที่ต้องโต้ตอบกับผู้ใช้จริงๆ
- **Strict Rules (กฎเหล็ก)**:
  - **ต้อง** อัปเดต `SpecKit/task.md` เมื่อทำงานเสร็จทุกครั้ง
  - **ต้อง** ปฏิบัติตามตาราง `traceability.md` เมื่อมีการเพิ่มฟีเจอร์ใหม่
  - ใช้ `npm run dev` สำหรับการพัฒนาในเครื่อง (Local Development)
