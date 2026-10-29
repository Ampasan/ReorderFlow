# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 19 + Vite (TypeScript, Tailwind CSS, React Router v7, Axios, Lucide React, react-hot-toast) — deployed to Vercel. Backend: Go 1.26 with Gin, GORM, JWT, gofpdf, robfig/cron — deployed to Railway. Database: PostgreSQL via Supabase. File storage: Supabase Storage (PDF PO). Cache + retry logic: Redis. Authentication: JWT (email/password). Email delivery: SMTP (provider TBD for production; synthetic credentials in MVP env vars).

## Users

**Staf Inventori / Admin Pengadaan** — warehouse or procurement staff at an Indonesian UMKM (10–50 employees, 50–500 SKUs). Works at a desk or warehouse counter; needs to scan stock conditions and trigger purchase orders fast without risking typos on SKU codes or quantities.

**Pemilik Usaha / Manajer Operasional** — business owner or operations manager. Reviews, controls spending, and gives formal approval on PO documents before they go to suppliers. Approves via a one-time secure email link — no login required for that action.

## Product Purpose

ReorderFlow automates the reorder-point (ROP) detection and purchase-order preparation cycle for Indonesian UMKM. Instead of a staff member manually checking a spreadsheet and retyping PO data, the system runs a daily scan, identifies every SKU where `stok_saat_ini ≤ reorder_point`, groups them by supplier, generates a draft PDF PO for each supplier, routes it to the manager for approval via a secure email link, and sends the approved PO to the supplier automatically. Success means zero stockouts caused by late detection, zero duplicate POs per SKU per cycle, and PO preparation time reduced ≥50% versus the manual process.

## Positioning

Rule-based ROP automation specifically designed for UMKM operators — not enterprise ERP, not AI predictions, not POS integration. The certainty guarantee (0 duplicate POs, idempotent approval links, explicit REQUIRES_MANUAL_REVIEW for anomalies) is the mechanism a general-purpose inventory app or spreadsheet cannot truthfully copy.

## Operating Context

- **Daily cycle:** cron job scans stock → groups low-stock items per supplier → generates PDF PO drafts → emails manager approval links.
- **Approval flow:** manager receives email with Approve/Reject link; clicking Approve auto-sends PO PDF to supplier email; links are single-use tokens with expiry; idempotency is shown explicitly on the response page so managers trust no double-order will occur.
- **Dashboard usage:** admin monitors stock status (Normal / Low Stock / Requires Review), views PO history and draft PDFs, and triggers manual scans. Manager sees dashboard read-only.
- **Edge cases routed away from automation:** negative stock values, blank ROP fields, or other anomalies are flagged REQUIRES_MANUAL_REVIEW and not processed by the auto-order pipeline.
- **MVP dataset:** 20 synthetic SKUs, 3–4 test suppliers, development window 26 Oct – 6 Nov 2026.

## Capabilities and Constraints

- Automatic daily ROP detection (`stok ≤ ROP`); SKUs with an active open PO are skipped.
- Draft PO PDF generation grouped per supplier, unique PO number per document, stored in Supabase Storage.
- Manager approval/rejection via public (no-auth) idempotent token link in email.
- Auto-send approved PO PDF to supplier email.
- JWT-protected dashboard and API endpoints; public-only endpoint is the approval/rejection page.
- Role-based action restriction: "Pindai Stok Sekarang" (manual scan trigger) visible to admin role only; manager sees read-only dashboard.
- Out of scope for MVP: AI/ML stock prediction, third-party marketplace/POS API integration, invoice payment management, multi-branch warehouse management.
- Rule-based logic only — no AI to avoid hallucinated data.
- Approval tokens: random one-time-use, time-limited.

## Brand Commitments

- **Name:** ReorderFlow (logotype treatment: "Reorder" neutral, "Flow" in terracotta `#D4621A`).
- **Language:** Indonesian (Bahasa Indonesia) — all UI copy, labels, status text, and documentation.
- **Visual identity:** warm organic theme anchored in roasted-coffee and kraft-paper tones (`#FEF3E2` canvas, `#EAD8C0` sidebar, `#D4621A` terracotta primary, `#2A1A0E` brand dark). See DESIGN.md for full token set.
- **Personality:** warm and trustworthy, ergonomic, low cognitive load, decisive (idempotent, no ambiguity on action outcomes).
- **Typography:** Inter / Plus Jakarta Sans; JetBrains Mono for SKU codes, PO numbers, and currency figures.
- **Logo asset:** `Logo_ReorderFlow.png` (existing asset, do not invent substitutes).

## Evidence on Hand

- PRD at `docs/PRD.md` — confirmed users, purpose, scope, constraints, success metrics, and feature priority list.
- DESIGN.md at `docs/DESIGN.md` — full color token set, typography scale, component rules for all major surfaces.
- FRD at `docs/FRD.md`, IA at `docs/IA.md`, feature docs in `docs/features/`.
- Implemented frontend pages: LoginPage, Dashboard, StockList, POLogList, PODraftEditor, ApprovalStatus.
- Implemented frontend components: AppShell, Sidebar, KpiCard, StockTable, POLogTable, StatusBadge, FilterTabs, Modal, ConfirmDialog, DetailDialog, OpnameDialog, EmptyState, ErrorState, TableSkeleton, PageHeader, ProtectedRoute.
- Backend (Go/Gin): handler, service, repository, model, middleware, job, cache, utils directories implemented.
- Synthetic dataset only; no real customer data on hand.

## Product Principles

1. **Certainty over cleverness.** Every automated action (PO creation, approval, send) produces a deterministic, verifiable outcome. Ambiguity is surfaced as a review flag, not silently resolved.
2. **Minimum viable friction for field staff.** Staf mengecek angka kritis dan bertindak dalam satu lirik — no multi-step wizards, no hidden states.
3. **The manager's trust is the product's immune system.** The approval link UX must make idempotency visually obvious; a manager who worries about double-orders will not approve.
4. **Scope discipline is a feature.** Saying no to AI, POS integration, and multi-branch in MVP keeps the rule logic auditable and the test pass rate at ≥90%.
5. **UMKM-scale precision.** Design and data density are calibrated for 20–500 SKUs and a small operations team — not an enterprise grid of thousands of rows.

## Accessibility & Inclusion

WCAG 2.1 AA contrast compliance required on all text and interactive elements. Warm palette choices (low-saturation backgrounds with high-contrast brand dark `#2A1A0E`) support readability for staff working in variable lighting (warehouse, shop floor). Large touch targets (`py-4` row padding) reduce mis-tap risk for staff using the dashboard on tablets.
