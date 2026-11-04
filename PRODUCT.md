# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Frontend: React 19, Vite 8, TypeScript, Tailwind CSS v3, React Router v7, React Hot Toast, and the browser `fetch` API. Backend: Go 1.26, Gin, GORM, JWT, `gofpdf`, and `robfig/cron`. Data: PostgreSQL and PDF files in Supabase. Redis is optional for cache, rate limits, and distributed locks; the application falls back to in-process behavior. Authentication uses JWT with email and password. Email uses configurable SMTP. Gemini is optional.

## Users

**Staf Inventori / Procurement Admin** — warehouse or procurement staff at an Indonesian UMKM (10–50 employees, 50–500 SKUs). Works at a desk or warehouse counter; needs to scan stock conditions and trigger purchase orders fast without risking typos on SKU codes or quantities.

**Pemilik Usaha / Manajer Operasional** — business owner or operations manager. Reviews, controls spending, and gives formal approval on PO documents before they go to suppliers. Approves via a one-time secure email link — no login required for that action.

## Product Purpose

ReorderFlow supports the reorder-point (ROP) workflow for Indonesian UMKM. A daily scan identifies eligible SKUs where `stok_saat_ini ≤ reorder_point`, groups them by supplier, and creates draft PDF POs. An admin reviews and submits each draft; the manager then approves or rejects it through a one-time email link. Approval starts delivery of the final PO to the supplier. The 100% detection accuracy, zero duplicate POs, and at least 50% reduction in PO preparation time are targets, not measured results.

## Positioning

Rule-based ROP automation for UMKM operators, not enterprise ERP, demand forecasting, or POS integration. Optional Gemini recommendations can explain aggregate low-stock counts and prioritize eligible items. The backend still determines eligibility and quantities, and admins review drafts before submission.

## Operating Context

- **Daily cycle:** cron scans stock at 08:00 WIB, groups eligible items per supplier, and creates PDF PO drafts. It does not email the manager until an admin submits a draft.
- **Approval flow:** manager receives email with Approve/Reject link; clicking Approve auto-sends PO PDF to supplier email; links are single-use tokens with expiry; idempotency is shown explicitly on the response page so managers trust no double-order will occur.
- **Dashboard usage:** admin monitors stock status (Normal / Low Stock / Requires Review), views PO history and draft PDFs, and triggers manual scans. Manager sees dashboard read-only.
- **Edge cases routed away from automation:** negative stock values, blank ROP fields, or other anomalies are flagged REQUIRES_MANUAL_REVIEW and not processed by the auto-order pipeline.
- The repository includes synthetic seed data. No production customer data or measured customer outcomes are documented here.

## Capabilities and Constraints

- Automatic daily ROP detection (`stok ≤ ROP`); SKUs with an active open PO are skipped.
- Draft PO PDF generation grouped per supplier, unique PO number per document, stored in Supabase Storage.
- Manager approval/rejection via public (no-auth) idempotent token link in email.
- Auto-send approved PO PDF to supplier email.
- Per-SKU goods receipt: admin records the actual received qty (partial deliveries allowed), stock increments by that qty, and the PO moves to `PARTIALLY_RECEIVED` or `RECEIVED`. Over-receipt is blocked; a partially received PO still counts as active so scanning does not create a duplicate draft.
- JWT-protected dashboard and API endpoints; public-only endpoint is the approval/rejection page.
- Role-based action restriction: "Pindai Stok Sekarang" (manual scan trigger) visible to admin role only; manager sees read-only dashboard.
- Gemini can explain aggregate low-stock counts on request. During scans, it can also prioritize eligible items using per-item stock, ROP, and minimum-order values sent without SKU, item name, or supplier identity.
- Gemini recommendations are advisory: the backend still sets PO quantity from its minimum-order rule, creates drafts if Gemini is unavailable, and requires an admin to review before manager approval. Gemini cannot change stock or approve/send POs.
- Out of scope: AI/ML demand forecasting, third-party marketplace/POS integration, invoice payment management, and multi-branch warehouse management.
- ROP eligibility and PO quantities remain rule-based. Gemini contributes priority and explanation text, not demand forecasts.
- Approval tokens: random one-time-use, time-limited.

## Brand Commitments

- **Name:** ReorderFlow (logotype treatment: "Reorder" neutral, "Flow" in terracotta `#D4621A`).
- **Language:** Indonesian (Bahasa Indonesia) for user-facing UI copy, labels, and status text. Technical documentation uses Indonesian and English.
- **Visual identity:** warm organic theme anchored in roasted-coffee and kraft-paper tones (`#FEF3E2` canvas, `#E2CBB0` sidebar, `#B85114` primary, `#2A1A0E` brand dark). See `docs/DESIGN.md` for the full token set.
- **Personality:** warm, trustworthy, and direct. Action results identify whether a PO is pending, sent, rejected, or needs manual review.
- **Typography:** Poppins Bold/ExtraBold for headings; Montserrat for body and UI text; JetBrains Mono for SKU codes and PO numbers.
- **Logo asset:** `logo-reorderflow.png` (existing asset, do not invent substitutes).

## Evidence on Hand

- PRD at `docs/PRD.md` — confirmed users, purpose, scope, constraints, success metrics, and feature priority list.
- DESIGN.md at `docs/DESIGN.md` — full color token set, typography scale, component rules for all major surfaces.
- FRD at `docs/FRD.md`, IA at `docs/IA.md`, feature docs in `docs/features/`.
- Implemented public frontend routes: landing page, article list and details, FAQ, About, and login. Protected app routes: dashboard at `/app`, stock list, PO history, and draft editor. The approval page is rendered by the backend at `GET /api/po/approval`.
- Implemented frontend components: AppShell, Sidebar, KpiCard, StockTable, POLogTable, StatusBadge, FilterTabs, Modal, ConfirmDialog, DetailDialog, OpnameDialog, TerimaBarangDialog, EmptyState, ErrorState, TableSkeleton, PageHeader, ProtectedRoute.
- Backend (Go/Gin): handler, service, repository, model, middleware, job, cache, utils directories implemented.
- Synthetic dataset only; no real customer data on hand.

## Product Principles

1. **Certainty over cleverness.** Every automated action (PO creation, approval, send) produces a deterministic, verifiable outcome. Ambiguity is surfaced as a review flag, not silently resolved.
2. **Minimum viable friction for field staff.** Staf dapat memeriksa angka stok penting dan memulai tindakan dari halaman yang sama.
3. **The manager's trust is the product's immune system.** The approval link UX must make idempotency visually obvious; a manager who worries about double-orders will not approve.
4. **Scope discipline.** Reorder eligibility and order quantities stay rule-based. Forecasting, POS integrations, and multi-branch support remain out of scope.
5. **UMKM-scale precision.** Design and data density are calibrated for 20–500 SKUs and a small operations team — not an enterprise grid of thousands of rows.

## Accessibility & Inclusion

WCAG 2.1 AA contrast compliance required on all text and interactive elements. Warm palette choices (low-saturation backgrounds with high-contrast brand dark `#2A1A0E`) support readability for staff working in variable lighting (warehouse, shop floor). Large touch targets (`py-4` row padding) reduce mis-tap risk for staff using the dashboard on tablets.
