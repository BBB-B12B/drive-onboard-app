# Functional Specification: Drive Onboard

## 1. System Features
| ID | Feature Name | Description |
| :--- | :--- | :--- |
| **[F-001]** | **Applicant Registration** | Dynamic multi-step form for driver application (Personal, Address, Vehicle, Guarantor). |
| **[F-002]** | **Dashboard** | Admin view to list, filter, and manage applications. |
| **[F-003]** | **PDF Generation** | Generate PDF contracts (Application, Transport, Guarantee) with signatures embedded. |
| **[F-004]** | **Digital Signature** | Canvas-based signature pad for applicants and guarantors. |
| **[F-005]** | **Document Upload** | Upload supporting documents (ID Card, License, etc.) to R2. |

## 2. Data Models
### `applications` (D1)
- `id`: PK
- `firstName`, `lastName`, `nationalId`: Basic Info
- `status`: draft, submitted, approved, rejected
- `data`: JSON blob (full application manifest)
  - Includes: `applicant`, `applicationDetails`, `contractDetails`, `guarantor` (now includes `phone`, `occupation`), `vehicle`, `docs`.
- `createdAt`, `updatedAt`

### `signatures` (R2)
- Stores signature images (PNG) keyed by application ID.

## 3. User Flows
### Driver Application
1. Landing Page -> Fill Personal Info -> Fill Address -> Fill Vehicle -> Fill Guarantor.
2. Sign Document (Canvas).
3. Submit Application -> Status updates to 'submitted'.

### Admin Review
1. Login -> Dashboard.
2. Click Application -> View Details (Read-only mode).
3. Download PDF (Generated on-the-fly).
4. Approve/Reject Application.

## 4. Architecture
**Frontend**: Next.js 14 (App Router)
**Backend**: Next.js API Routes / Cloudflare Workers (Future)
**Database**: Cloudflare D1 (SQLite)
**Storage**: Cloudflare R2 (Object Storage)
**PDF Engine**: Google Apps Script (Legacy/Current) or Puppeteer (Local/Edge)

## 5. Sitemap
```mermaid
graph TD
    A[Home /] --> B[Application Form /apply]
    A --> C[Login /login]
    C --> D[Dashboard /dashboard]
    D --> E[Application Details /dashboard/application/[id]]
    E --> F[Download PDF]
```
