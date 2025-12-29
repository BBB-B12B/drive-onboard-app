# AI Implementation Protocol (ขั้นตอนการทำงานสำหรับ AI)

> **CRITICAL ENFORCEMENT (ข้อบังคับสูงสุด)**:
> 1.  **Strict Sequential Execution (ทำตามลำดับอย่างเคร่งครัด)**:
>     *   In any operation, you must proceed step-by-step as defined in `task.md` and this Protocol. **Do NOT skip steps.**
>     *   (ในการดำเนินการใดๆ ต้องทำทีละขั้นตอน (Step-by-Step) ตามที่ระบุไว้ใน `task.md` และ Protocol นี้ **ห้ามข้ามขั้นตอนเด็ดขาด**)
> 2.  **Verify Before Proceeding (ตรวจสอบก่อนไปต่อ)**:
>     *   Do not proceed to the next step until the current step is **Verified** and **Confirmed**.
>     *   (ห้ามข้ามไปขั้นตอนถัดไปจนกว่าขั้นตอนปัจจุบันจะได้รับการยืนยันผลลัพธ์)
> 3.  **Mandatory Reference (ต้องอ้างอิงเสมอ)**:
>     *   Every time you receive an "Implement" or "Fix" command, you **MUST** read and follow this Protocol.
>     *   (ทุกครั้งที่ได้รับคำสั่ง "Implement" หรือ "Fix", AI ต้องอ่านและปฏิบัติตาม Protocol นี้อย่างเคร่งครัด)
> 4.  **Language Requirement**:
>     *    explanations in `task.md` must be in **Thai-English Hybrid**.
>     *   (การอธิบายแผนงานและผลลัพธ์ใน `task.md` ต้องใช้ภาษาไทยผสมศัพท์เทคนิค (Thai-English Hybrid) เสมอ)

This document serves as the Standard Operating Procedure (SOP) for development, debugging, and system improvements, ensuring consistency with SpecKit standards.
(เอกสารนี้ใช้เป็นแนวทางปฏิบัติ เมื่อ AI เริ่มต้นทำงานพัฒนา แก้ไข หรือปรับปรุงระบบ เพื่อให้งานเป็นไปอย่างมีระบบและสอดคล้องกับมาตรฐาน SpecKit)

> **Language Note**: When recording data in all `SpecKit` documents, use **Mixed English-Thai** not English Only Plase. format to ensure clarity for the Thai development team.
> **ในการบันทึกข้อมูลลงในเอกสาร `SpecKit` ทั้งหมด ให้ใช้รูปแบบ **Mixed English-Thai** เพื่อความเข้าใจที่ชัดเจนสำหรับทีมพัฒนาชาวไทย**

---

## -1. Context Loading (กลยุทธ์การโหลดข้อมูล)
> **Mandatory Action**: At the start of every session or new task, you **MUST read these files** to load context:
> (ในทุกๆ Session หรือการเริ่มงานใหม่ **ต้องอ่านไฟล์เหล่านี้ก่อนเสมอ** เพื่อโหลด Context เข้าสู่ Memory:)

1.  `SpecKit/instruction.md` (Tech Stack & Constraints)
2.  `SpecKit/spec.md` (Scope & Features)
3.  `SpecKit/task.md` (Current Status & Error Logs)
4.  **`.env.final`** (Secrets & Environment Variables) -> **Source of Truth**
    *   **Note**: Validate all Configs and Secrets against this file ONLY. Do not use hardcoded values or stale memory.
    *   (ตรวจสอบค่า Config และ Secret ทั้งหมดจากไฟล์นี้เท่านั้น ห้ามใช้ค่า Hardcode หรือค่าเก่าใน Memory)
5.  `SpecKit/traceability.md` (File Locations & Data Map)

---

## 0. Infrastructure Check (ตรวจสอบโครงสร้างพื้นฐาน)
*   **Source**: `SpecKit/instruction.md`
*   **Action**:
    *   Understand the Infrastructure, Tech Stack, and System Constraints.
    *   Evaluate if the task is compatible with the current system or requires new installations.
    *   (ทำความเข้าใจโครงสร้าง Infrastructure, Tech Stack, และข้อจำกัดของระบบ เพื่อประเมินว่างานที่จะทำรองรับหรือไม่ หรือต้องมีการติดตั้งอะไรเพิ่ม)

---

## 1. Project Context & Scope (เข้าใจภาพรวมและขอบเขต)
*   **Source**: `SpecKit/spec.md`
*   **Action**:
    *   Review Project Scope, Theme, and Core Requirements.
    *   Ensure design and development align with the Spec.
    *   (ทบทวนขอบเขตของ Project ธีม และข้อกำหนดหลัก เพื่อให้การออกแบบและพัฒนาไปในทิศทางเดียวกัน)

---

## 2. Task Details (รายละเอียดงาน)
*   **Source**: `SpecKit/task.md`
*   **Action**:
    *   Read the delegated Task details thoroughly (Concept, Principles, Implementation Details).
    *   (อ่านรายละเอียดของ Task ที่ได้รับมอบหมายอย่างละเอียด เพื่อดำเนินการได้ถูกต้องครบถ้วน)

---

## 3. Documentation Update (การอัปเดตเอกสาร)
Whenever there is development, a fix, or a change, you **MUST** update the relevant documents to keep them Up-to-Date:
(เมื่อมีการพัฒนา แก้ไข หรือเปลี่ยนแปลงใดๆ **ต้อง** ทำการอัปเดตเอกสารที่เกี่ยวข้องเสมอ ดังนี้:)

*   **`SpecKit/task.md`**
    *   **Trigger**: Adding sub-tasks, fixing bugs, or recording Case Studies.
    *   **Action**: Update details, root causes, solutions, and precautions.
*   **`SpecKit/traceability.md`**
    *   **Trigger**: Adding/Removing Features, referencing new Key Variables, or linking new Code.
    *   **Action**: Update the Matrix and Variable Map to match the current Code.
*   **`SpecKit/instruction.md`**
    *   **Trigger**: New Folder/Architecture, Config values, or Command lines.
    *   **Action**: Update the Usage Manual and Project Structure.
*   **`SpecKit/spec.md`**
    *   **Trigger**: New Guidelines, Constraints, or Scope expansion.
    *   **Action**: Update Requirements and Scope to reflect reality.

---

## 4. Critical Verification (การตรวจสอบความถูกต้อง)
*   **Action**: Before delivering work, you **MUST** perform the following:
    *   (ก่อนส่งงาน **ต้อง** ดำเนินการดังนี้:)
    1.  **Build Check**: Run `npm run build` (or relevant command) to ensure no Syntax Errors.
    2.  **Requirement Check**: Verify against `SpecKit/task.md` that all Sub-tasks are complete.
    3.  **Self-Correction**: If a Bug is found, fix it immediately. Do not ignore it.

---

## 5. Error Logging Protocol (การรับมือกับปัญหา)
*   **Trigger**: If an Error persists or an interesting Bug is found.
*   **Action**: Log it in `SpecKit/task.md` immediately using this format:
    *   **Error**: Symptoms observed (อาการที่พบ)
    *   **Root Cause**: The actual cause (สาเหตุที่แท้จริง)
    *   **Solution**: How it was fixed (วิธีแก้ไข)
    *   **Prevention**: How to prevent recurrence (วิธีป้องกันไม่ให้เกิดซ้ำ)

---

## 6. File Naming Standard (มาตรฐานการตั้งชื่อไฟล์)
*   **Principle**: Do NOT use user-provided filenames to avoid Encoding/Spacing/Special Character issues.
    *   (ห้ามใช้ชื่อไฟล์จาก User โดยตรงเพื่อป้องกันปัญหา Encoding/Spacing/Special Characters)
*   **Format**: `[Timestamp]_[DocType]_[RandomString].[Ext]`
    *   Example: `1701234567890_id_card_a1b2c3.jpg`
*   **Enforcement**: Always Rename on the Server side (API Route) before saving to D1 or Uploading to R2.
*   **Signature Updates**: Treat signature updates as **Replacement**. Delete the old file or Overwrite with a new name. Do not leave garbage files in R2.

---

## 7. Incident Log & Case Studies (บันทึกปัญหาและกรณีศึกษา)
> **Goal**: Record interesting cases to prevent recurrence.
> (บันทึก Case ที่น่าสนใจเพื่อป้องกันไม่ให้เกิดซ้ำ)

### Case Study: R2 `fs.readFile` Error in Cloudflare Pages
*   **Date**: 2025-12-27
*   **Symptom**:
    *   API `POST /api/r2/sign-put` Return 500
    *   Log: `Error: [unenv] fs.readFile is not implemented yet!`
*   **Root Cause**:
    *   Node.js Runtime in Cloudflare Pages tried to load AWS Credentials from a file (`~/.aws/credentials`) because Env Vars were missing.
    *   AWS SDK V3 falls back to filesystem (which doesn't exist on Edge) when Env Vars are missing.
*   **Resolution**:
    1.  Confirm Env Vars via `console.log`.
    2.  Update Secrets using `wrangler pages secret put`.
    3.  Redeploy.
*   **Prevention Rule**:
    *   **Check Env Vars** before initializing AWS Client in Edge Environment.
    *   Use `requireR2Bucket()` or a fail-fast helper.
    *   **Global Search**: When fixing a bug, search for similar patterns across the entire project.

*   **Incident 2: Deployment 404**
    *   **Root Cause**: User Error (Agent) - Deployed wrong directory (`.open-next/assets`).
    *   **Resolution**: Deploy the correct folder logic.

*   **Incident 3: Data Discrepancy**
    *   **Root Cause**: OpenNext Env hides Bindings (`env.DB`).
    *   **Fix**: Use `getCloudflareContext()` to access `env.DB`.

*   **Incident 4: Stale Deployment**
    *   **Root Cause**: `wrangler pages deploy` does NOT build the project.
    *   **Fix**: Always run `npx @opennextjs/cloudflare build` before deploy.

*   **Incident 5: Build Failure & Native Modules**
    *   **Root Cause**: `better-sqlite3` traced into production build.
    *   **Fix**: Use Dynamic Import + `serverExternalPackages`.

*   **Incident 6: "Upload Failed" (Deployment Blocked by Localhost)**
    *   **Date**: 2025-12-28
    *   **Symptom**: `npm run build` fails with `rm: .next: Directory not empty` or `copyTracedFiles` error.
    *   **Root Cause 1 (File Lock)**: `npm run dev` (Localhost) locks `.next` folder, preventing Build Script from cleaning it.
    *   **Root Cause 2 (Native Module)**: `better-sqlite3` (used for Local D1) gets traced into Production Build, causing OpenNext to fail on Edge.
    *   **Resolution**:
        1.  **Stop Localhost** (Kill Port 9002) before Building.
        2.  **Webpack Alias**: Set `better-sqlite3: false` in `next.config.mjs` to forcibly exclude it.
    *   **Prevention**:
        *   Do not run Build and Dev Server simultaneously.
        *   Always check `next.config.mjs` exclusion rules if Build fails on `copyTracedFiles`.

*   **Incident 7: macOS Metadata Files (._*) Breaking OpenNext Build**
    *   **Date**: 2025-12-28
    *   **Symptom**: Build fails with `WARN Unknown file extension` and `Error: app/._page cannot use the edge runtime`.
    *   **Root Cause**: macOS creates hidden `._` files on external drives (AppleDouble). OpenNext tries to bundle them as source files.
    *   **Fix**: Run `find . -type f -name "._*" -delete` before building.
    *   **Prevention**: Added cleanup step to `deploy_prod.sh`.

---

## 8. Environment Synchronization Protocol (การรักษาฐานข้อมูลเดียวกัน)
*   **Concept**: Reduce confusion between Local and Production by enforcing **"Same Entity"**.
*   **Protocol**:
    1.  **Use Remote Mode**: Developers must use `dev:remote` (`npm run dev:remote`) to see real data.
    2.  **Verify Secrets**: Local `.dev.vars` must match Cloudflare Pages Settings (`.env.final`).
    3.  **Data Parity**: If data mismatch occurs, verify Connection String first. Do not modify code blindly.
    4.  **Deployment Verification**: After every Deploy, Re-login to hydrate the session.
