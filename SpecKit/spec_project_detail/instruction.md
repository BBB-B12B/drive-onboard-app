# Instructions & Standards: Drive Onboard

## 1. Tech Stack
-   **Framework**: Next.js 14+ (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS + Shadcn UI (Radix)
-   **Database**: Cloudflare D1
-   **Storage**: Cloudflare R2
-   **Deployment**: Cloudflare Pages / Vercel (TBD)

## 2. Folder Structure
```
/
├── .env                  # Local secrets
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # Backend API Routes
│   │   ├── dashboard/    # Admin Pages
│   │   └── page.tsx      # Landing Page
│   ├── components/       # React Components
│   │   ├── ui/           # Reusable UI (Button, Input)
│   │   └── dashboard/    # Feature-specific components
│   ├── lib/              # Utilities
│   │   ├── db.ts         # D1 Connection
│   │   ├── r2.ts         # R2 Connection
│   │   └── types.ts      # TypeScript Intefaces
│   └── styles/
├── Speckit/              # Documentation
│   └── spec_project_detail/ # This folder
```

## 3. Conventions
### Naming
-   **Files**: `kebab-case.tsx` (e.g., `application-details.tsx`)
-   **Components**: `PascalCase` (e.g., `ApplicationDetails`)
-   **Functions**: `camelCase` (e.g., `handleDownload`)
-   **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_UPLOAD_SIZE`)

### State Management
-   Prefer Server Actions/Components for data fetching where possible.
-   Use `useState` for local UI state (forms, toggles).
-   Avoid global state libraries unless necessary (Context API is preferred).

### Strict Rules
-   **No `any`**: Avoid `any` type in TypeScript. Define interfaces in `types.ts`.
-   **Server/Client Boundary**: Clearly mark `'use client'` at the top of client components.
-   **Environment Variables**: Access via `process.env`. Do not hardcode secrets.
