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

## Email / SMTP

Gmail menolak password akun biasa untuk SMTP. Aktifkan 2-Step Verification pada akun pengirim, buat App Password 16 karakter, lalu isi `SMTP_PASSWORD` dengan App Password tersebut. Jika autentikasi gagal, log server menampilkan `535 5.7.8 Username and Password not accepted` dan PO otomatis masuk `REQUIRES_MANUAL_REVIEW`.

Pengiriman dibatasi 15 detik per percobaan dengan dua percobaan. Error 5xx dari SMTP dianggap permanen, jadi tidak diulang.

## Migrasi Database

Jalankan dua file berikut berurutan di Supabase SQL Editor:

1. `migrations/001_schema.sql`: semua tabel, index, dan constraint.
2. `migrations/002_seed.sql`: reset data demo lalu isi ulang pemasok dan stok grosir/sembako.

Keduanya aman dijalankan berulang. `002_seed.sql` selalu mengosongkan riwayat PO, stok opname, stok, dan pemasok lebih dulu, jadi bisa dipakai untuk mengembalikan demo ke kondisi awal. Akun `users` tidak direset karena dibuat dari `ADMIN_EMAIL` dan `MANAGER_EMAIL` saat server start.

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
| POST | `/api/stok/scan` | Memicu pemindaian low-stock dan pembuatan draf PO. Draf belum dikirim ke manajer. |
| GET | `/api/dashboard` | Ringkasan KPI dashboard. |
| GET | `/api/po` | Riwayat PO. Query `status=all|DRAFT|PENDING_APPROVAL|SENT|REJECTED|REQUIRES_MANUAL_REVIEW`. |
| GET | `/api/po-log` | Alias dari `/api/po`. |
| GET | `/api/po-draft/:id` | Detail draf PO beserta barang dan pemasok. |
| PUT | `/api/po-draft/:id` | Simpan perubahan barang draf. Body `{"items":[{"sku":"...","jumlah_order":10}]}`. |
| POST | `/api/po-draft/:id/submit` | Kirim draf ke manajer: PDF dibuat ulang dan email persetujuan dikirim. |
| GET | `/api/po/approval?token=...&action=approve|reject` | Halaman konfirmasi persetujuan dari email (publik). |

Endpoint selain `/health`, `/api/auth/login`, dan `/api/po/approval` wajib memakai header `Authorization: Bearer <token>`. `POST /api/stok/scan`, `PUT /api/po-draft/:id`, dan `POST /api/po-draft/:id/submit` hanya untuk role `admin`; role `manager` bersifat read-only.

Alur draf PO: pemindaian membuat `DRAFT` tanpa mengirim email, admin dapat mengubah barang, lalu submit mengubah status ke `PENDING_APPROVAL` dan mengirim email ke manajer. Persetujuan manajer mengubah status ke `SENT` dan mengirim PDF ke pemasok.

Semua endpoint data memakai envelope JSON:

```json
{ "success": true, "message": "...", "data": ... }
```

Saat gagal, `data` bernilai `null` dan ditambah field `error`.

---
