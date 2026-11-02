### Design Spec: FRD-06 Goods Receipt (ReorderFlow)

--------------------------------------------------------------------------------

##### 1. TypeScript Interfaces (`src/types/po.ts`)
```typescript
export type POStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'SENT'
  | 'REJECTED'
  | 'REQUIRES_MANUAL_REVIEW'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED';

export interface PenerimaanItem {
  sku: string;
  nama: string;
  jumlah_order: number;
  sudah_diterima: number;
  sisa: number;
}

export interface PenerimaanRiwayatItem {
  sku: string;
  nama: string;
  qty_diterima: number;
}

export interface PenerimaanRiwayat {
  id: number;
  created_at: string;
  items: PenerimaanRiwayatItem[];
}

export interface PenerimaanView {
  po_id: number;
  nomor_po: string;
  status: POStatus;
  items: PenerimaanItem[];
  riwayat: PenerimaanRiwayat[];
}

export interface PenerimaanItemInput {
  sku: string;
  qty_diterima: number;
}
```

`DashboardSummary` di `src/types/dashboard.ts` bertambah dua field:
```typescript
partially_received_po_count: number;
received_po_count: number;
```

--------------------------------------------------------------------------------

##### 2. API Contract Specification (Golang Gin Backend)
Semua endpoint memerlukan `Authorization: Bearer <token>` dan mengembalikan envelope `{ success, message, data, error }`.

###### A. GET /api/po-penerimaan/{id}
*   **Role**: `admin` dan `manager` (read-only).
*   **Response 200 OK**:
```json
{
  "success": true,
  "message": "Berhasil mengambil data penerimaan",
  "data": {
    "po_id": 1002,
    "nomor_po": "PO-20261027-103-001",
    "status": "SENT",
    "items": [
      {
        "sku": "SKU-MKN-01",
        "nama": "Mie Instan Goreng (dus isi 40)",
        "jumlah_order": 10,
        "sudah_diterima": 4,
        "sisa": 6
      }
    ],
    "riwayat": [
      {
        "id": 1,
        "created_at": "2026-11-02T06:00:00Z",
        "items": [
          { "sku": "SKU-MKN-01", "nama": "Mie Instan Goreng (dus isi 40)", "qty_diterima": 4 }
        ]
      }
    ]
  }
}
```
*   **Response 404**: PO tidak ditemukan.

###### B. POST /api/po-penerimaan/{id}
*   **Role**: `admin`.
*   **Request Body**:
```json
{ "items": [{ "sku": "SKU-MKN-01", "qty_diterima": 6 }] }
```
*   **Response 200 OK**: objek `POLog` terbaru dengan status `PARTIALLY_RECEIVED` atau `RECEIVED`.
*   **Response 400**: qty melebihi sisa, SKU bukan milik PO, atau tidak ada qty lebih dari 0.
*   **Response 403**: role bukan admin.
*   **Response 404**: PO tidak ditemukan.
*   **Response 409**: status PO bukan `SENT` atau `PARTIALLY_RECEIVED`.

###### C. GET /api/po?status=PARTIALLY_RECEIVED|RECEIVED
*   Filter status baru diteruskan ke `po_repository.List` dan di-cache dengan key `cache:po:PARTIALLY_RECEIVED` serta `cache:po:RECEIVED`.

###### D. GET /api/dashboard
*   `data` bertambah `partially_received_po_count` dan `received_po_count`.

--------------------------------------------------------------------------------

##### 3. Frontend Component Structure
```text
src/
├── components/
│   ├── Modal.tsx                 # Tambah prop size?: 'md' | 'lg' (default md)
│   ├── TerimaBarangDialog.tsx    # BARU: tabel qty per SKU + riwayat + validasi
│   ├── POLogTable.tsx            # Tambah prop onReceive + tombol "Terima Barang"
│   └── StatusBadge.tsx           # Tambah label dan style dua status baru
├── hooks/
│   └── usePenerimaan.ts          # BARU: receive(), pending, invalidate cache
├── services/
│   └── poService.ts              # Tambah getPenerimaan(), receivePO()
├── pages/
│   ├── POLogList.tsx             # State receiveTarget + fetch konteks + dialog
│   ├── PODraftEditor.tsx         # LOCKED_COPY untuk dua status baru
│   └── Dashboard.tsx             # Kartu KPI keenam + grid 6 kolom + skeleton 6
├── types/
│   ├── po.ts                     # Tipe penerimaan dan status baru
│   └── dashboard.ts              # Dua field KPI baru
└── utils/
    └── constants.ts              # PO_FILTERS dan PO_STATUSES bertambah
```

**Catatan implementasi**:
*   Dialog memakai `Modal` dengan `size="lg"` (`max-w-2xl`). Dialog lain tetap memakai default `md`.
*   Tabel di dalam dialog dibungkus `overflow-x-auto` dengan `min-w-[560px]` agar bisa digeser di layar sempit.
*   `usePenerimaan` meng-invalidate prefix `po`, `penerimaan`, `stock`, dan `dashboard`.
*   `POLogList` mengambil konteks penerimaan lewat `useResource(\`penerimaan:${id}\`, fetcher, { enabled: receiveTarget !== null })`.
*   Tidak ada perubahan pada `POLogTable` kolom. Tombol penerimaan berada di sel aksi agar tabel tetap enam kolom.
