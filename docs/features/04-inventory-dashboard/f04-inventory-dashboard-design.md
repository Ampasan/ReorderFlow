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
```

--------------------------------------------------------------------------------

##### 2. API Contract Specification (Golang Gin Backend)
###### A. GET /api/stok
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
###### B. GET /api/po
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

--------------------------------------------------------------------------------

##### 3. Frontend Component Structure (React + Vite + TypeScript)
```text
src/
├── components/
│   ├── Sidebar.tsx               # Navigasi utama (Dashboard, Data Stok, Riwayat PO)
│   ├── KPICard.tsx               # Kartu statistik ringkasan
│   ├── StatusBadge.tsx           # Badge warna (LOW STOCK, NORMAL, DRAFT, SENT, REJECTED)
│   ├── StockTable.tsx            # Tabel daftar inventori SKU
│   ├── POLogTable.tsx            # Tabel riwayat Purchase Order + Tautan PDF
│   └── TableSkeleton.tsx         # Skeleton loader saat fetching data
├── hooks/
│   ├── useStock.ts               # Custom React hook untuk fetch stok
│   └── usePOLog.ts               # Custom React hook untuk fetch log PO
├── services/
│   └── api.ts                    # Axios client instance
└── pages/
    ├── Dashboard.tsx             # Halaman utama ringkasan KPI
    ├── StockList.tsx             # Halaman manajemen tabel stok
    └── POLogList.tsx             # Halaman tabel riwayat PO
```
