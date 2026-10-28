### Design Spec: FRD-04 Inventory Dashboard UI (ReorderFlow)

--------------------------------------------------------------------------------

##### 1. TypeScript Interfaces (`src/types/`)
```typescript
export interface Pemasok {
  id: number;
  nama: string;
  email: string;
}

export interface Stok {
  sku: string;
  nama: string;
  stok_saat_ini: number;
  reorder_point: number;
  qty_min_order: number;
  id_pemasok: number;
  pemasok?: Pemasok;
  updated_at?: string;
}

export type POStatus = 'DRAFT' | 'SENT' | 'REJECTED' | 'REQUIRES_MANUAL_REVIEW';

export interface POLog {
  id: number;
  nomor_po: string;
  id_pemasok: number;
  pemasok?: Pemasok;
  status: POStatus;
  tautan_pdf: string;
  created_at: string;
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
```

--------------------------------------------------------------------------------

##### 2. API Contract Specification (Golang Gin Backend)
Semua endpoint data memerlukan header `Authorization: Bearer <token>`. Endpoint `/api/auth/login` bersifat publik.

###### A. POST /api/auth/login
*   **Request Body** :
```json
{ "email": "admin@example.com", "password": "your-password" }
```
*   **Response 200 OK** :
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
*   **Response 401 Unauthorized** :
```json
{ "success": false, "message": "Email atau password salah", "data": null, "error": "email atau password salah" }
```

###### B. GET /api/auth/me
*   **Headers** : `Authorization: Bearer <token>`
*   **Response 200 OK** : envelope `success` dengan `data` berisi objek `User`.

###### C. GET /api/stok
*   **Headers** : `Authorization: Bearer <token>`
*   **Response 200 OK** :
```json
{
  "success": true,
  "message": "Berhasil mengambil data stok",
  "data": [
    {
      "sku": "SKU-KOPI-01",
      "nama": "Biji Kopi Arabika 1kg",
      "stok_saat_ini": 5,
      "reorder_point": 10,
      "qty_min_order": 20,
      "id_pemasok": 1,
      "pemasok": { "id": 1, "nama": "PT Kopi Mandiri", "email": "order@kopimandiri.com" }
    }
  ],
  "error": null
}
```
###### D. GET /api/po
*   **Headers** : `Authorization: Bearer <token>`
*   **Response 200 OK** :
```json
{
  "success": true,
  "message": "Berhasil mengambil riwayat PO",
  "data": [
    {
      "id": 1,
      "nomor_po": "PO-20261025-01-001",
      "id_pemasok": 1,
      "pemasok": { "id": 1, "nama": "PT Kopi Mandiri", "email": "order@kopimandiri.com" },
      "status": "SENT",
      "tautan_pdf": "https://example.com/storage/object/public/po-documents/PO-20261025-01-001.pdf",
      "created_at": "2026-10-25T08:15:00Z"
    }
  ],
  "error": null
}
```

###### E. GET /api/dashboard
*   **Headers** : `Authorization: Bearer <token>`
*   **Response 200 OK** :
```json
{
  "success": true,
  "message": "Berhasil mengambil ringkasan dashboard",
  "data": {
    "total_sku": 20,
    "low_stock_count": 6,
    "manual_review": 1,
    "pending_po_count": 2,
    "sent_po_count": 1,
    "rejected_po_count": 0
  }
}
```

--------------------------------------------------------------------------------

##### 3. Frontend Component Structure (React + Vite + TypeScript)
```text
src/
├── components/
│   ├── Sidebar.tsx               # Navigasi utama (Dashboard, Data Stok, Riwayat PO)
│   ├── Navbar.tsx                # Header + indikator sistem + logout
│   ├── ProtectedRoute.tsx        # Route guard, redirect ke /login jika 401
│   ├── KPICard.tsx               # Kartu statistik ringkasan
│   ├── StatusBadge.tsx           # Badge warna (LOW STOCK, NORMAL, DRAFT, SENT, REJECTED)
│   ├── StockTable.tsx            # Tabel daftar inventori SKU
│   ├── POLogTable.tsx            # Tabel riwayat Purchase Order + Tautan PDF
│   └── TableSkeleton.tsx         # Skeleton loader saat fetching data
├── context/
│   └── AuthContext.tsx           # State token, user, login, logout
├── hooks/
│   ├── useAuth.ts                # Konsumsi AuthContext
│   ├── useStock.ts               # Custom React hook untuk fetch stok
│   └── usePOLog.ts               # Custom React hook untuk fetch log PO
├── services/
│   ├── api.ts                    # Axios instance + request/response interceptor
│   └── auth.ts                   # login(), me(), logout()
├── types/
│   ├── auth.ts                   # User, UserRole, LoginResponse
│   ├── stok.ts
│   └── po.ts
└── pages/
    ├── LoginPage.tsx             # Form login email/password
    ├── Dashboard.tsx             # Halaman utama ringkasan KPI
    ├── StockList.tsx             # Halaman manajemen tabel stok
    └── POLogList.tsx             # Halaman tabel riwayat PO
```

**Axios interceptor**:
- Request: sisipkan `Authorization: Bearer <token>` dari storage.
- Response `401`: hapus token, reset `AuthContext`, redirect `/login`.
- Response `403`: tampilkan toast "Anda tidak memiliki akses untuk aksi ini".
