### Design Spec: FRD-02 Pembuatan Draf PDF PO (ReorderFlow)

--------------------------------------------------------------------------------

##### 1. Data Schema (PostgreSQL / Supabase DDL)
```sql
CREATE TABLE IF NOT EXISTS po_log (
    id SERIAL PRIMARY KEY,
    nomor_po VARCHAR(50) NOT NULL UNIQUE,
    id_pemasok INT NOT NULL REFERENCES pemasok(id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'SENT', 'REJECTED', 'REQUIRES_MANUAL_REVIEW')),
    tautan_pdf TEXT NOT NULL,
    token VARCHAR(64) UNIQUE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_po_token ON po_log(token);
CREATE INDEX IF NOT EXISTS idx_po_supplier_status ON po_log(id_pemasok, status);
CREATE INDEX IF NOT EXISTS idx_po_status_created ON po_log(status, created_at);
CREATE INDEX IF NOT EXISTS idx_po_status_submitted ON po_log(status, submitted_at);

CREATE TABLE IF NOT EXISTS po_detail (
    id SERIAL PRIMARY KEY,
    po_id INT NOT NULL REFERENCES po_log(id) ON DELETE CASCADE,
    sku VARCHAR(50) NOT NULL REFERENCES stok(sku),
    jumlah_order INT NOT NULL CHECK (jumlah_order > 0)
);
```

--------------------------------------------------------------------------------

##### 2. API Contract Specification (Internal Go Service / Storage API)
###### A. REST Upload to Supabase Storage Bucket
*   **Endpoint** : `POST /storage/object/po-documents/filename.pdf`
*   **Headers** : `Content-Type: application/pdf`
*   **Response 200 OK** :
```json
{
  "Key": "po-documents/PO-20261025-101-001.pdf",
  "Url": "https://example.com/storage/object/public/po-documents/PO-20261025-101-001.pdf"
}
```

###### B. Draft PO Endpoints (Internal API)
*   **GET `/api/po-draft/{id}`**: mengambil draf PO beserta baris barang. Memerlukan Bearer token.
*   **PUT `/api/po-draft/{id}`**: mengganti baris barang dengan body `{ "items": [{ "sku": "...", "jumlah_order": 20 }] }`. Hanya untuk role `admin` dan status `DRAFT`, `REJECTED`, atau `REQUIRES_MANUAL_REVIEW`. Merender ulang PDF draf.
*   **POST `/api/po-draft/{id}/submit`**: memvalidasi minimal satu barang dan email pemasok, membuat token baru, merender PDF final, mengubah status ke `PENDING_APPROVAL`, lalu mengantrekan email ke manajer. Hanya untuk role `admin`.
*   **Response error**: `400` untuk body tidak valid, `403` untuk manager, `404` untuk PO tidak ditemukan, `409` untuk status yang tidak dapat diubah, `502` jika PDF gagal disiapkan.

--------------------------------------------------------------------------------

##### 3. Backend Component Structure (Golang Gin)
```text
backend/internal/
├── service/
│   ├── pdf_service.go            # Grouping, gofpdf Layout Rendering, & Storage Upload
│   ├── draft_service.go          # Update baris draf, submit ke manajer, regenerasi PDF
│   └── email_queue.go            # Antrean email in-memory (2 worker)
├── handler/
│   └── draft_handler.go          # GET/PUT/POST /api/po-draft/{id}
├── utils/
│   ├── pdf_generator.go          # gofpdf Canvas Layout & Table Builder
│   └── supabase_storage.go       # Storage API Client Uploader
└── repository/
    └── po_repository.go          # Insert po_log & po_detail, ReplaceDraftDetails, MarkSubmitted
```
