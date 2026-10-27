### Design Spec: FRD-01 Deteksi Low-Stock (ReorderFlow)

--------------------------------------------------------------------------------

##### 1. Data Schema (PostgreSQL / Supabase DDL & Redis)
```sql
CREATE TABLE IF NOT EXISTS pemasok (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stok (
    sku VARCHAR(50) PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    stok_saat_ini INT NOT NULL DEFAULT 0,
    reorder_point INT NOT NULL DEFAULT 0,
    qty_min_order INT NOT NULL DEFAULT 1,
    id_pemasok INT NOT NULL REFERENCES pemasok(id) ON DELETE RESTRICT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stok_rop ON stok (stok_saat_ini, reorder_point);
```

```text
Redis Key Structure:
- Key: lock:scan:active
- Type: String (Expiration TTL: 300s)
- Value: "running"
```

--------------------------------------------------------------------------------

##### 2. API Contract Specification (Golang Gin)
###### A. POST /api/stok/scan
*   **Deskripsi** : Memicu pemindaian stok low-stock secara manual / via cron runner.
*   **Headers** : `Content-Type: application/json`
*   **Response 200 OK** :
```json
{
  "success": true,
  "message": "Pemindaian stok berhasil dijalankan",
  "data": {
    "scanned_items": 20,
    "low_stock_count": 3,
    "draft_po_created": 2,
    "skipped_active_po": 1
  },
  "error": null
}
```
*   **Response 500 Internal Server Error** :
```json
{
  "success": false,
  "message": "Gagal terhubung ke database Supabase",
  "data": null,
  "error": "pq: connection refused"
}
```

--------------------------------------------------------------------------------

##### 3. Backend Component Structure (Golang Gin)
```text
backend/internal/
├── job/
│   └── low_stock_job.go          # Runner robfig/cron harian jam 08:00 WIB
├── service/
│   └── detection_service.go      # Business Logic: Filter ROP & Check Active PO
├── repository/
│   ├── stok_repository.go        # Query DB: GetLowStockItems()
│   └── po_repository.go          # Query DB: HasActivePO()
└── handler/
    └── stock_handler.go          # HTTP Handler POST /api/stok/scan
```
