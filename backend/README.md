# ReorderFlow Backend

Backend Go untuk automasi pembelian inventori UMKM. Menggunakan Clean Architecture (handler, service, repository, model), Gin, GORM, PostgreSQL (Supabase), Redis, SMTP, dan gofpdf.


## Struktur Direktori

```text
backend/
├── cmd/server/            # Entry point, wiring, graceful shutdown
├── config/                # Env, database, redis, smtp
├── internal/
│   ├── handler/           # HTTP handler + JSON envelope
│   ├── job/               # Cron harian 08:00 WIB
│   ├── middleware/        # CORS, logger, gzip
│   ├── model/             # Entity, status, DTO
│   ├── repository/        # Akses database dan redis
│   ├── service/           # Logika bisnis
│   └── utils/             # PDF, email, storage, token, logger
└── migrations/            # DDL dan seed data
```


## Menjalankan

```bash
cd backend
go run ./cmd/server
```

Cek kesehatan server:

```bash
curl http://localhost:8080/health
```

## Endpoint

| Method | Path | Fungsi |
| :--- | :--- | :--- |
| GET | `/health` | Health check. |
| GET | `/api/stok` | Daftar stok. Query `status=all|low|manual`. |
| POST | `/api/stok/scan` | Memicu pemindaian low-stock dan pembuatan draf PO. |
| GET | `/api/dashboard` | Ringkasan KPI dashboard. |
| GET | `/api/po` | Riwayat PO. Query `status=all|DRAFT|SENT|REJECTED`. |
| GET | `/api/po-log` | Alias dari `/api/po`. |
| GET | `/api/po/approval?token=...&action=approve|reject` | Halaman konfirmasi persetujuan dari email. |

Semua endpoint data memakai envelope JSON:

```json
{ "success": true, "message": "...", "data": ... }
```

Saat gagal, `data` bernilai `null` dan ditambah field `error`.

---
