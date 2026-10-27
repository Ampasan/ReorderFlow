### Design Spec: FRD-02 Pembuatan Draf PDF PO (ReorderFlow)

--------------------------------------------------------------------------------

##### 1. Data Schema (PostgreSQL / Supabase DDL)
```sql
CREATE TABLE IF NOT EXISTS po_log (
    id SERIAL PRIMARY KEY,
    nomor_po VARCHAR(50) NOT NULL UNIQUE,
    id_pemasok INT NOT NULL REFERENCES pemasok(id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL CHECK (status IN ('DRAFT', 'SENT', 'REJECTED', 'REQUIRES_MANUAL_REVIEW')),
    tautan_pdf TEXT NOT NULL,
    token VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

--------------------------------------------------------------------------------

##### 3. Backend Component Structure (Golang Gin)
```text
backend/internal/
├── service/
│   └── pdf_service.go            # Grouping, gofpdf Layout Rendering, & Storage Upload
├── utils/
│   ├── pdf_generator.go          # gofpdf Canvas Layout & Table Builder
│   └── supabase_storage.go       # Storage API Client Uploader
└── repository/
    └── po_repository.go          # Insert po_log & po_detail
```
