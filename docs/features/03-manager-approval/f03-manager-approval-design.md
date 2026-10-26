### Design Spec: FRD-03 Persetujuan Manajer & Email Workflow (ReorderFlow)

--------------------------------------------------------------------------------

##### 1. Data Schema (PostgreSQL / Supabase DDL & Redis)
```sql
-- Menggunakan kolom token & status dari tabel po_log yang sudah dibuat di FRD-02
ALTER TABLE po_log ADD COLUMN IF NOT EXISTS token VARCHAR(64) UNIQUE;
ALTER TABLE po_log ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_po_token ON po_log(token);
```

```text
Redis Key Structure (Optional Fast Idempotency Cache):
- Key: token:<TOKEN_STRING>
- Type: String (TTL: 48 Jam)
- Value: "DRAFT" | "SENT" | "REJECTED"
```

--------------------------------------------------------------------------------

##### 2. API Contract Specification (Golang Gin)
###### A. GET /api/v1/po/approval
*   **Deskripsi** : Endpoint publik penanganan klik tombol Approve / Reject di email Manager.
*   **Query Parameters** :
    *   token (string, required) - Token 32 karakter
    *   action (string, required) - `'approve'` atau `'reject'`
*   **Response 200 OK (Success HTML Response)** :
```html
<!DOCTYPE html>
<html>
<head><title>Persetujuan PO ReorderFlow</title></head>
<body>
  <h2>Persetujuan Berhasil Diproses</h2>
  <p>Status PO #PO-20261025-101-001 kini: <strong>SENT</strong></p>
  <p>Dokumen PDF PO telah otomatis dikirimkan ke email Pemasok.</p>
</body>
</html>
```
*   **Response 400 Bad Request (Re-click / Idempotent Block)** :
```json
{
  "success": false,
  "message": "Tautan persetujuan ini sudah pernah digunakan sebelumnya.",
  "data": { "current_status": "SENT" },
  "error": "ERR_IDEMPOTENT_ALREADY_PROCESSED"
}
```

--------------------------------------------------------------------------------

##### 3. Backend Component Structure (Golang Gin)
```text
backend/internal/
├── service/
│   ├── approval_service.go       # Token Validation & Status State Transition
│   └── email_service.go          # SMTP Email Dispatcher (Manager & Supplier)
├── utils/
│   ├── token_generator.go        # Crypto Secure Token Randomizer
│   └── email_sender.go           # SMTP Client & HTML Template Compiler
└── handler/
    └── approval_handler.go       # HTTP GET /api/v1/po/approval
```
