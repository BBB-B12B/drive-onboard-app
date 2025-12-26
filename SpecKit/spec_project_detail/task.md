# Task Roadmap: Drive Onboard

## Phase 1: Core Foundation (Completed)
- [x] **[T-001] Project Setup**
    - Setup Next.js, Tailwind, TypeScript.
    - Configure D1 and R2 connections.
- [x] **[T-002] Application Form UI**
    - Implement multi-step form logic.
    - Create responsive layout.

## Phase 2: PDF & Dashboard (Active)
- [x] **[T-003] PDF Generation Engine**
    -   **Concept**: Generate legal PDFs from form data.
    -   **Implementation**: Use HTML templates + Puppeteer/GAS.
- [x] **[T-004] Dashboard View**
    -   List applications from D1.
    -   View details page.
- [/] **[T-005] Refine PDF Layout**
    -   [x] Integrate Thai Fonts (Sarabun).
    -   [x] Dynamic Filenames (e.g., `Statement_Name.pdf`).
    -   [x] Compact Layout to Single Page.
    -   [x] Group Fields (ID, Address, Name).

## Phase 3: Polish & deploy (Planned)
- [ ] **[T-006] Authentication**
    -   Implement Login/Logout for Dashboard.
    -   Protect API routes.
- [ ] **[T-007] Production Deployment**
    -   Build scripts (`deploy_prod.sh`).
    -   Cloudflare Pages configuration.

---

### Task Schema Details
- [ ] **[T-XXX] Task Name**
    - **Concept/Goal**: ...
    - **Implementation Details**: ...
