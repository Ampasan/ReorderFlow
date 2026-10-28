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
│   ├── middleware/        # Auth JWT, CORS, logger, gzip
│   ├── model/             # Entity, status, DTO
│   ├── repository/        # Akses database dan redis
│   ├── service/           # Logika bisnis + auth
│   └── utils/             # PDF, email, storage, JWT, password, logger
└── migrations/            # DDL, auth, dan seed data
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

## Migrasi Database

Jalankan dua file berikut berurutan di Supabase SQL Editor:

1. `migrations/001_schema.sql` — semua tabel, index, dan constraint (termasuk `users`).
2. `migrations/002_seed.sql` — data pemasok dan stok awal.

Keduanya idempotent, jadi aman dijalankan ulang pada database yang sudah ada.

Tabel `users` diisi otomatis saat server start:
- Admin dari `ADMIN_EMAIL` + `ADMIN_PASSWORD`.
- Manager dari `MANAGER_EMAIL` + `MANAGER_PASSWORD`.

Jika `ENV=production`, `AutoMigrate` tidak berjalan, jadi migrasi SQL wajib dieksekusi manual.

## Endpoint

| Method | Path | Fungsi |
| :--- | :--- | :--- |
| GET | `/health` | Health check (publik). |
| POST | `/api/auth/login` | Login, body `{"email","password"}`, menghasilkan JWT Bearer token. |
| GET | `/api/auth/me` | Profil user terautentikasi. |
| GET | `/api/stok` | Daftar stok. Query `status=all|low|manual`. |
| POST | `/api/stok/scan` | Memicu pemindaian low-stock dan pembuatan draf PO. |
| GET | `/api/dashboard` | Ringkasan KPI dashboard. |
| GET | `/api/po` | Riwayat PO. Query `status=all|DRAFT|SENT|REJECTED`. |
| GET | `/api/po-log` | Alias dari `/api/po`. |
| GET | `/api/po/approval?token=...&action=approve|reject` | Halaman konfirmasi persetujuan dari email (publik). |

Endpoint selain `/health`, `/api/auth/login`, dan `/api/po/approval` wajib memakai header `Authorization: Bearer <token>`. `POST /api/stok/scan` hanya untuk role `admin`; role `manager` bersifat read-only.

Semua endpoint data memakai envelope JSON:

```json
{ "success": true, "message": "...", "data": ... }
```

Saat gagal, `data` bernilai `null` dan ditambah field `error`.

---
