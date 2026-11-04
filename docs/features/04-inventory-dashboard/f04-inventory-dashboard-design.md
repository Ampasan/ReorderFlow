### Design Spec: FRD-04 Inventory Dashboard UI (ReorderFlow)

--------------------------------------------------------------------------------

##### 1. TypeScript Interfaces (`src/types/`)
```typescript
export interface Pemasok {
  id: number;
  nama: string;
  email: string;
}

export type StockStatus = 'NORMAL' | 'LOW_STOCK' | 'REQUIRES_MANUAL_REVIEW';

export interface Stok {
  sku: string;
  nama: string;
  stok_saat_ini: number;
  reorder_point: number;
  qty_min_order: number;
  id_pemasok: number;
  pemasok?: Pemasok;
  updated_at?: string;
  status: StockStatus;
}

export type POStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'SENT'
  | 'REJECTED'
  | 'REQUIRES_MANUAL_REVIEW'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED';

export interface PODetail {
  id: number;
  po_id: number;
  sku: string;
  jumlah_order: number;
}

export interface POLog {
  id: number;
  nomor_po: string;
  id_pemasok: number;
  pemasok?: Pemasok;
  status: POStatus;
  tautan_pdf: string;
  submitted_at?: string;
  created_at: string;
  updated_at?: string;
  details?: PODetail[];
}

export interface DashboardSummary {
  total_sku: number;
  low_stock_count: number;
  manual_review: number;
  draft_po_count: number;
  pending_po_count: number;
  sent_po_count: number;
  rejected_po_count: number;
  partially_received_po_count: number;
  received_po_count: number;
}

export type UserRole = 'admin' | 'manager';

export interface User {
  id: number;
  email: string;
  nama: string;
  role: UserRole;
  created_at: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface DraftItem {
  sku: string;
  jumlah_order: number;
}
```

--------------------------------------------------------------------------------

##### 2. API Contract Specification (Golang Gin Backend)
Semua endpoint data memerlukan header `Authorization: Bearer <token>` dan mengembalikan envelope `{ success, message, data, error }`. Endpoint publik: `POST /api/auth/login`, `GET /api/po/approval`, `GET /health`.

###### A. POST /api/auth/login
*   **Request Body**:
```json
{ "email": "admin@example.com", "password": "your-password" }
```
*   **Response 200 OK**:
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "admin@example.com",
      "nama": "Admin",
      "role": "admin",
      "created_at": "2026-10-28T08:00:00Z"
    }
  }
}
```
*   **Response 401 Unauthorized**:
```json
{ "success": false, "message": "Email atau password salah", "data": null, "error": "email atau password salah" }
```

###### B. GET /api/auth/me
*   **Headers**: `Authorization: Bearer <token>`
*   **Response 200 OK**: envelope `success` dengan `data` berisi objek `User`.

###### C. GET /api/stok?status=all|low|manual
*   **Headers**: `Authorization: Bearer <token>`
*   **Response 200 OK**:
```json
{
  "success": true,
  "message": "Berhasil mengambil data stok",
  "data": [
    {
      "sku": "SKU-KOP-01",
      "nama": "Biji Kopi Arabika 1kg",
      "stok_saat_ini": 5,
      "reorder_point": 10,
      "qty_min_order": 20,
      "id_pemasok": 1,
      "status": "LOW_STOCK",
      "pemasok": { "id": 1, "nama": "PT Kopi Mandiri", "email": "order@kopimandiri.com" }
    }
  ],
  "error": null
}
```

###### D. POST /api/stok/scan
*   **Headers**: `Authorization: Bearer <token>`, role `admin`.
*   **Response 200 OK**: `data` berisi `scanned_items`, `low_stock_count`, `draft_po_created`, `skipped_active_po`, `manual_review`.
*   **Response 409**: pemindaian lain sedang berlangsung.
*   **Response 403**: role manager.

###### E. PATCH /api/stok/{sku}
*   **Headers**: `Authorization: Bearer <token>`, role `admin`.
*   **Request Body**:
```json
{ "stok_saat_ini": 6, "alasan": "MISCOUNT" }
```
*   **Response 200 OK**: `data` berisi `sku` dan `stok_saat_ini` terbaru.

###### F. GET /api/dashboard
*   **Headers**: `Authorization: Bearer <token>`
*   **Response 200 OK**:
```json
{
  "success": true,
  "message": "Berhasil mengambil ringkasan dashboard",
  "data": {
    "total_sku": 20,
    "low_stock_count": 6,
    "manual_review": 1,
    "draft_po_count": 2,
    "pending_po_count": 1,
    "sent_po_count": 1,
    "rejected_po_count": 0
  }
}
```

###### G. GET /api/po?status=all|DRAFT|PENDING_APPROVAL|SENT|REJECTED|REQUIRES_MANUAL_REVIEW|PARTIALLY_RECEIVED|RECEIVED
*   **Headers**: `Authorization: Bearer <token>`
*   **Response 200 OK**: array `POLog` dengan `pemasok` dan `details`.

###### H. GET /api/po-draft/{id}
*   **Headers**: `Authorization: Bearer <token>`
*   **Response 200 OK**: objek `POLog` lengkap dengan `details`.

###### I. PUT /api/po-draft/{id}
*   **Headers**: `Authorization: Bearer <token>`, role `admin`.
*   **Request Body**:
```json
{ "items": [{ "sku": "SKU-KOP-01", "jumlah_order": 20 }] }
```
*   **Response 200 OK**: objek `POLog` terbaru.

###### J. POST /api/po-draft/{id}/submit
*   **Headers**: `Authorization: Bearer <token>`, role `admin`.
*   **Response 200 OK**: status PO menjadi `PENDING_APPROVAL`, email ke manajer diantrekan.

--------------------------------------------------------------------------------

##### 3. Frontend Component Structure (React + Vite + TypeScript)
```text
src/
├── App.tsx                       # Router + lazy pages + AuthProvider
├── context/
│   ├── AuthProvider.tsx          # State token, user, login, logout, status
│   └── authContext.ts            # Context definition
├── components/
│   ├── AppShell.tsx              # Sidebar + mobile top bar + skip link
│   ├── Sidebar.tsx               # Navigasi utama + profil + logout
│   ├── ProtectedRoute.tsx        # Route guard, redirect ke /login
│   ├── PageHeader.tsx            # Judul halaman + aksi
│   ├── KpiCard.tsx               # Kartu statistik ringkasan
│   ├── StatusBadge.tsx           # Badge status stok dan PO
│   ├── FilterTabs.tsx            # Tab filter berbasis URL
│   ├── StockTable.tsx            # Tabel inventori (mode penuh dan compact)
│   ├── POLogTable.tsx            # Tabel PO + aksi Detail / edit / PDF
│   ├── TableSkeleton.tsx         # Skeleton loader
│   ├── EmptyState.tsx            # Empty state
│   ├── ErrorState.tsx            # Error state + tombol Coba Lagi
│   ├── Modal.tsx                 # Dialog dasar
│   ├── ConfirmDialog.tsx         # Konfirmasi scan dan submit
│   ├── DetailDialog.tsx          # Detail SKU / PO
│   ├── OpnameDialog.tsx          # Koreksi stok opname
│   └── icons.tsx                 # Ikon SVG
├── hooks/
│   ├── useAuth.ts
│   ├── useResource.ts            # Fetch + cache + invalidate
│   ├── useDashboard.ts
│   ├── useStock.ts
│   ├── useStockCorrection.ts
│   ├── useScan.ts
│   └── usePOLog.ts
├── services/
│   ├── api.ts                    # fetch wrapper, Bearer token, 401/403 handling
│   ├── authService.ts            # login(), me()
│   ├── dashboardService.ts       # getSummary()
│   ├── stockService.ts           # listStock(), runScan(), correctStock()
│   └── poService.ts              # listPO(), getPO(), updateDraft(), submitDraft()
├── types/
│   ├── auth.ts
│   ├── api.ts
│   ├── dashboard.ts
│   ├── stok.ts
│   └── po.ts
├── utils/
│   ├── authStorage.ts            # kunci localStorage reorderflow.token / reorderflow.user
│   ├── constants.ts              # API base URL, filter, role label
│   └── formatter.ts              # formatDateWIB, formatNumber
└── pages/
    ├── LoginPage.tsx             # Split screen, form email/password
    ├── Dashboard.tsx             # Banner, KPI, cuplikan low stock
    ├── StockList.tsx             # Tabel stok, tab, scan, opname
    ├── POLogList.tsx             # Tabel PO, 8 pilihan status, filter pemasok, detail, penerimaan
    └── PODraftEditor.tsx         # Editor draf, simpan, submit ke manajer
```

**Catatan implementasi**:
* HTTP client memakai `fetch` bawaan, bukan Axios.
* Token disimpan di `localStorage` dengan kunci `reorderflow.token` dan `reorderflow.user`.
* Respons `401` menghapus sesi dan memicu event `reorderflow:unauthorized`.
* Respons `403` menampilkan toast "Anda tidak memiliki akses untuk aksi ini".
* Base URL diambil dari `VITE_API_BASE_URL` tanpa akhiran `/api`, contoh `http://localhost:8080`.

Dashboard saat ini berada di `/app`. Rute `/` menampilkan landing page publik; artikel, FAQ, dan Tentang juga tersedia tanpa login.
