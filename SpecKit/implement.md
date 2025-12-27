# AI Implementation Protocol (ขั้นตอนการทำงานสำหรับ AI)

เอกสารนี้ใช้เป็นแนวทางปฏิบัติ (Standard Operating Procedure) เมื่อ AI เริ่มต้นทำงานพัฒนา แก้ไข หรือปรับปรุงระบบ เพื่อให้งานเป็นไปอย่างมีระบบและสอดคล้องกับมาตรฐาน SpecKit

> **Language Note**: ในการบันทึกข้อมูลลงในเอกสาร `SpecKit` ทั้งหมด ให้ใช้รูปแบบ **Mixed English-Thai** (ศัพท์เทคนิคภาษาอังกฤษ + คำอธิบายภาษาไทย) เพื่อความเข้าใจที่ชัดเจนสำหรับทีมพัฒนาชาวไทย

## -1. Context Loading (อ่านข้อมูลตั้งต้น)
> **Mandatory Action**: ในทุกๆ Session หรือการเริ่มงานใหม่ **ต้องอ่านไฟล์เหล่านี้ก่อนเสมอ** เพื่อโหลด Context เข้าสู่ Memory:
> 1.  `SpecKit/instruction.md` (Tech Stack & Constraints)
> 2.  `SpecKit/spec.md` (Scope & Features)
> 3.  `SpecKit/task.md` (Current Status & Error Logs)
>     *   **Note**: `WORKER_SECRET` ต้องเป็น Secret เดียวกับใน Worker (`94bb41dcd135eb8672ece1bfbc2271e2ac5cd46365f382fa1a29e164b9d84e0e`) และต้องตรงกันทั้ง Pages และ Worker
> 4.  `SpecKit/traceability.md` (File Locations & Data Map)

## 0. Infrastructure Check (ตรวจสอบโครงสร้างระบบ)
*   **Source**: `SpecKit/instruction.md`
*   **Action**: ทำความเข้าใจโครงสร้าง Infrastructure, Tech Stack, และข้อจำกัดของระบบ เพื่อประเมินว่างานที่จะทำรองรับหรือไม่ หรือต้องมีการติดตั้งอะไรเพิ่ม (Infastructure Compatibility Check)

## 1. Project Context & Scope (เข้าใจภาพรวมและขอบเขต)
*   **Source**: `SpecKit/spec.md`
*   **Action**: ทบทวนขอบเขตของ Project (Project Scope) ธีม (Theme) และข้อกำหนดหลัก เพื่อให้การออกแบบและพัฒนาไปในทิศทางเดียวกัน ไม่หลุดจาก Spec ที่วางไว้

## 2. Task Details (รายละเอียดงาน)
*   **Source**: `SpecKit/task.md`
*   **Action**: อ่านรายละเอียดของ Task ที่ได้รับมอบหมายอย่างละเอียด (Concept, Principles, Implementation Details) เพื่อดำเนินการได้ถูกต้องครบถ้วน

## 3. Documentation Update (การอัปเดตเอกสาร)
เมื่อมีการพัฒนา แก้ไข หรือเปลี่ยนแปลงใดๆ **ต้อง** ทำการอัปเดตเอกสารที่เกี่ยวข้องเสมอ เพื่อให้เอกสารเป็นปัจจุบัน (Up-to-date) ดังนี้:

*   **`SpecKit/task.md`**
    *   **Trigger**: เพิ่มรายละเอียดงานย่อย, มีการแก้ไข Bug, หรือต้องการบันทึก Case Study
    *   **Action**: Update รายละเอียด, สาเหตุ, วิธีแก้, และจุดที่ควรระวัง (Precautions) เพื่อป้องกันปัญหาในอนาคต
*   **`SpecKit/traceability.md`**
    *   **Trigger**: มีการเพิ่ม/ลบ Feature, เพิ่มตัวแปรสำคัญ (Key Variables), หรือเชื่อมโยง Code ใหม่
    *   **Action**: Update ตาราง Matrix และ Variable Map ให้ตรงกับ Code ปัจจุบัน
*   **`SpecKit/instruction.md`**
    *   **Trigger**: มีการเพิ่มโครงสร้างหลัก (New Folder/Architecture), ค่า Config, หรือ Command line ใหม่
    *   **Action**: Update คู่มือการใช้งานและโครงสร้างโปรเจกต์
*   **`SpecKit/spec.md`**
    *   **Trigger**: มีการกำหนดแนวทางใหม่ (New Guidelines), เพิ่มข้อจำกัด (Constraints), หรือขยายขอบเขตงาน
    *   **Action**: Update ข้อกำหนดและขอบเขตให้สะท้อนความเป็นจริง

## 4. Critical Verification (การตรวจสอบความถูกต้อง)
*   **Action**: ก่อนส่งงาน **ต้อง** ดำเนินการดังนี้:
    1.  **Build Check**: รัน `npm run build` (หรือคำสั่งที่เกี่ยวข้อง) เพื่อให้แน่ใจว่าไม่มี Syntax Error
    2.  **Requirement Check**: ตรวจสอบกับ `SpecKit/task.md` ว่าทำครบทุก Sub-task หรือไม่
    3.  **Self-Correction**: หากพบ Bug ต้องแก้ทันที และห้ามปล่อยผ่านโดยไม่แจ้ง

## 5. Error Logging Protocol (การรับมือกับปัญหา)
*   **Trigger**: หากเจอ Error ที่แก้ไม่ได้ในครั้งแรก หรือเป็น Bug ที่น่าสนใจ
*   **Action**: บันทึกลงใน `SpecKit/task.md` ทันที ตาม Format:
    *   **Error**: อาการที่พบ
    *   **Root Cause**: สาเหตุที่แท้จริง
    *   **Solution**: วิธีแก้ไข
    *   **Prevention**: วิธีป้องกันไม่ให้เกิดซ้ำ

---

## 6. File Naming Standard (มาตรฐานการตั้งชื่อไฟล์)
*   **Principle**: ห้ามใช้ชื่อไฟล์จาก User โดยตรงเพื่อป้องกันปัญหา Encoding/Spacing/Special Characters
*   **Format**: `[Timestamp]_[DocType]_[RandomString].[Ext]`
    *   Example: `1701234567890_id_card_a1b2c3.jpg`
*   **Enforcement**: ต้องทำการ Rename ที่ฝั่ง Server (API Route) ก่อนบันทึกลง D1 หรือ Upload R2 เสมอ
*   **Signature Updates**: กรณีมีการแก้ไขลายเซ็น ให้ถือเป็น **Replacement** เสมอ (ลบไฟล์เก่า หรือ Overwrite ด้วยชื่อใหม่) ห้ามเก็บไฟล์ขยะค้างไว้ใน R2

---

## 7. Incident Log & Case Studies (บันทึกปัญหาและกรณีศึกษา)
> **Goal**: บันทึก Case ที่น่าสนใจเพื่อป้องกันไม่ให้เกิดซ้ำ

### Case Study: R2 `fs.readFile` Error in Cloudflare Pages
*   **Date**: 2025-12-27
*   **Symptom**:
    *   API `POST /api/r2/sign-put` Return 500
    *   Log: `Error: [unenv] fs.readFile is not implemented yet!`
*   **Root Cause**:
    *   Node.js Runtime ใน Cloudflare Pages พยายามโหลด AWS Credentials จากไฟล์ (`~/.aws/credentials`) เนื่องจากไม่พบ Environment Variables (`R2_ACCESS_KEY_ID`, ฯลฯ) ใน Runtime
    *   AWS SDK V3 มีพฤติกรรม Fallback ไปอ่านไฟล์เมื่อไม่เจอ Env Vars ซึ่งไฟล์ System ไม่มีจริงบน Edge Worker
*   **Resolution**:
    1.  Confirm Env Vars: เพิ่ม `console.log` เช็คว่า `process.env.R2_ACCESS_KEY_ID` เป็น `undefined` หรือไม่
    2.  Update Secrets: ใช้คำสั่ง `wrangler pages secret put` อัปโหลด R2 Keys ขึ้น Production Pages Project (ไม่ใช่แค่ Worker Protocol)
    3.  Redeploy: สั่ง Deploy ใหม่เพื่อให้ Secrets มีผล
*   **Prevention Rule**:
    *   เมื่อใช้งาน AWS SDK ใน Edge Environment **ต้องเช็ค Env Vars ก่อน init Client เสมอ**
    *   ใช้ `requireR2Bucket()` หรือ helper function ที่ Throw Error ทันทีถ้า Environment ไม่ครบ (Fail Fast)
    *   **Audit Scope**: เมื่อแก้ Bug จุดหนึ่งสำเร็จ **ต้องค้นหา (Global Search)** โค้ดที่มี Pattern เดียวกันทั้งโปรเจกต์ด้วย (เช่นแก้ที่ `applicant` แล้วต้องเช็ค `daily-reports` ด้วย) เพื่อไม่ให้เกิดปัญหาส่วนอื่นที่ยังไม่ได้แก้ ("It failed initially" scenario).

*   **Incident 2: Deployment 404 (2025-12-27)**
    *   **Symptom**: Deployment `ff2e81ba` ใช้งานไม่ได้ เปิดหน้าเว็บแล้วเจอ 404
    *   **Root Cause**: User Error (Agent) - สั่ง Deploy ผิด Directory (`.open-next/assets`) ทำให้ไม่มีไฟล์ Worker Script ขึ้นไปด้วย
    *   **Protocol Violation**: ไม่ได้ตรวจสอบ Build Output ก่อน Deploy และพยายามอธิบายทฤษฎี (Deflection) แทนที่จะตรวจสอบผลลัพธ์จริง
    *   **Resolution**: ตรวจสอบโครงสร้างโฟลเดอร์ `.open-next` และ Deploy โฟลเดอร์ที่ถูกต้อง
    *   **Prevention**: ต้อง run `ls -R .open-next` ดูโครงสร้างก่อน Deploy เสมอ หากไม่มั่นใจ

*   **Incident 3: Data Discrepancy (2025-12-27)**
    *   **Symptom**: หน้าเว็บ Production แสดงข้อมูล 0 รายการ (แต่ Local 9002 มี 3 รายการ)
    *   **Root Cause**: OpenNext Environment ซ่อน Cloudflare Bindings (`env.DB`) ไว้ ไม่เหมือน Worker ปกติ ทำให้ `getDb()` สร้าง SQLite เปล่าๆ ขึ้นมาใช้แทน (Silent Fail)
    *   **Fix**: ใช้ `@opennextjs/cloudflare` ดึง `getCloudflareContext()` เพื่อเข้าถึง `env.DB`
    *   **Lesson**: ใน OpenNext/Pages Functions, `process.env` มีแค่ String Variables ส่วน Bindings (DB, R2) ต้องดึงผ่าน Request Context เท่านั้น

*   **Incident 4: Stale Deployment (2025-12-27)**
    *   **Symptom**: แก้โค้ดแล้ว แต่ Deploy ไปไม่เห็นผล (เช่น Debug Box ไม่ขึ้น)
    *   **Root Cause**: เข้าใจผิดว่า `wrangler pages deploy` ทำการ Build ให้ แต่จริงๆ มันแค่อัปโหลดโฟลเดอร์ `.open-next` เดิม
    *   **Fix**: ต้องรัน `npx @opennextjs/cloudflare build` ก่อน Deploy ทุกครั้งที่มีการแก้โค้ด

*   **Incident 5: Build Failure & Native Modules (2025-12-27)**
    *   **Symptom**: `npx @opennextjs/cloudflare build` พังด้วย error `copyTracedFiles`
    *   **Root Cause**: `better-sqlite3` (Native Module) ถูก Trace เข้าไปใน Production Build ทั้งที่ไม่ได้ใช้
    *   **Fix**: ย้าย `better-sqlite3` ไป Dynamic Import และเพิ่ม `serverExternalPackages` ใน `next.config.mjs`

*   **Incident 6: Dependency Hell (2025-12-27)**
    *   **Symptom**: `npm install` พังเพราะ `eslint-config-next@16` ตีกับ `next@15`
    *   **Fix**: ใช้ `npm install --legacy-peer-deps` เพื่อแก้ขัด (ควร downgrade eslint ในภายหลัง)

