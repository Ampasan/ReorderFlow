### Design Spec: FRD-03 Persetujuan Manajer & Email Workflow (ReorderFlow)

--------------------------------------------------------------------------------

##### 1. Data Schema (PostgreSQL / Supabase DDL & Redis)
```sql
-- Kolom token, submitted_at, dan status sudah dibuat di FRD-02. Tambahan bila belum ada:
ALTER TABLE po_log ADD COLUMN IF NOT EXISTS token VARCHAR(64) UNIQUE;
ALTER TABLE po_log ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE po_log ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE po_log DROP CONSTRAINT IF EXISTS po_log_status_check;
ALTER TABLE po_log ADD CONSTRAINT po_log_status_check
    CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'SENT', 'REJECTED', 'REQUIRES_MANUAL_REVIEW', 'PARTIALLY_RECEIVED', 'RECEIVED'));

CREATE INDEX IF NOT EXISTS idx_po_token ON po_log(token);
CREATE INDEX IF NOT EXISTS idx_po_status_submitted ON po_log(status, submitted_at);
```

```text
Redis Lock (Idempotency Guard):
- Key: token:<TOKEN_STRING>
- Type: String dengan TTL 1 menit
- Fungsi: mencegah dua request approval memproses token yang sama secara bersamaan.
- Idempotensi utama tetap memakai conditional update di database:
  UPDATE po_log SET status = 'SENT' WHERE id = ? AND status = 'PENDING_APPROVAL';
```

--------------------------------------------------------------------------------

##### 2. API Contract Specification (Golang Gin)

###### A. PUT /api/po-draft/{id}
*   **Deskripsi**: Menyimpan perubahan baris barang draf.
*   **Headers**: `Authorization: Bearer <token>`, role `admin`.
*   **Request Body**:
```json
{ "items": [{ "sku": "SKU-KOP-01", "jumlah_order": 20 }] }
```
*   **Response 200 OK**: envelope `success` dengan `data` berupa objek PO terbaru.
*   **Response error**: `400` body tidak valid, `403` manager, `404` PO tidak ditemukan, `409` status tidak dapat diubah, `502` PDF gagal disiapkan.

###### B. POST /api/po-draft/{id}/submit
*   **Deskripsi**: Mengirim draf ke manajer, membuat token baru, dan mengantrekan email.
*   **Headers**: `Authorization: Bearer <token>`, role `admin`.
*   **Response 200 OK**: envelope `success`, status PO menjadi `PENDING_APPROVAL`.
*   **Response error**: sama dengan endpoint sebelumnya, ditambah `400` jika draf kosong atau email pemasok tidak valid.

###### C. GET /api/po/approval
*   **Deskripsi**: Endpoint publik penanganan klik tombol Approve / Reject di email Manager.
*   **Headers**: tidak memerlukan `Authorization`; endpoint dikecualikan dari middleware JWT.
*   **Query Parameters**:
    *   token (string, required) - token 32 karakter
    *   action (string, required) - `'approve'` atau `'reject'`
*   **Response 200 OK (Success HTML Response)**:
```html
<!DOCTYPE html>
<html lang="id">
<head><title>Persetujuan PO ReorderFlow</title></head>
<body>
  <h2>Persetujuan Berhasil</h2>
  <p>Status PO <strong>#PO-20261025-101-001</strong>: <strong>SENT</strong></p>
  <p>Persetujuan PO berhasil diproses. Email ke pemasok sedang dikirim.</p>
</body>
</html>
```
*   **Response 200 OK (Idempotent / Status Tidak Sesuai)**:
```html
<h2>Tautan Sudah Digunakan</h2>
<p>Tautan persetujuan ini sudah pernah digunakan sebelumnya.</p>
<p>Status PO <strong>#PO-20261025-101-001</strong>: <strong>SENT</strong></p>
```
*   **Response 200 OK (Belum Diajukan)**:
```html
<h2>Belum Diajukan</h2>
<p>PO masih berstatus draf dan belum diajukan ke manajer.</p>
```
*   **Response 200 OK (Kedaluwarsa)**:
```html
<h2>Tautan Kedaluwarsa</h2>
<p>Token persetujuan sudah kedaluwarsa. PO ditandai untuk peninjauan manual.</p>
```
*   **Response 404 Not Found**:
```html
<h2>Token Tidak Valid</h2>
<p>Token persetujuan tidak ditemukan atau sudah kedaluwarsa.</p>
```

--------------------------------------------------------------------------------

##### 3. Backend Component Structure (Golang Gin)
```text
backend/internal/
├── service/
│   ├── draft_service.go          # Update draf, submit, token baru, PDF final
│   ├── approval_service.go       # Validasi token, TTL, transisi status, supplier dispatch
│   ├── email_service.go          # Template email Manager & Pemasok
│   └── email_queue.go            # Antrean email in-memory (2 worker, buffer 64)
├── utils/
│   ├── token_generator.go        # crypto/rand 16 byte -> 32 karakter hex
│   └── email_sender.go           # SMTP client dan MIME builder
└── handler/
    ├── draft_handler.go          # GET/PUT/POST /api/po-draft/{id}
    └── approval_handler.go       # GET /api/po/approval + render HTML
```
