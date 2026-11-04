# ReorderFlow Backend

API Go untuk pemantauan inventori, pembuatan draf PO, persetujuan, dan penerimaan barang. Backend memakai Gin, GORM, PostgreSQL, Supabase Storage, SMTP, dan PDF `gofpdf`. Redis dan Gemini bersifat opsional.

## Menjalankan

Prasyarat: Go sesuai versi pada `go.mod`, PostgreSQL, dan konfigurasi Supabase Storage.

```powershell
Copy-Item .env.example .env
# Isi kredensial di .env, lalu:
go run ./cmd/server
```

Server berjalan pada port `8080` secara default. Periksa statusnya di `http://localhost:8080/health`.

Untuk menyajikan frontend hasil build dari backend yang sama, build frontend lalu isi `FRONTEND_DIST` dengan direktori `frontend/dist` relatif terhadap proses backend, misalnya `../frontend/dist`. Backend menyajikan SPA hanya jika direktori tersebut tersedia.

## Konfigurasi

Atur nilai di `backend/.env`:

| Variabel | Fungsi |
| :--- | :--- |
| `PORT`, `ENV`, `APP_URL` | Port, mode aplikasi, dan origin untuk tautan persetujuan. |
| `FRONTEND_DIST` | Opsional, direktori frontend hasil build. |
| `JWT_SECRET`, `JWT_TTL_HOURS` | Secret dan masa berlaku JWT. Ganti secret default sebelum produksi. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Akun admin yang dibuat saat startup. |
| `MANAGER_EMAIL`, `MANAGER_PASSWORD` | Akun manager yang dibuat saat startup. |
| `SUPABASE_DB_*` atau `DATABASE_URL` | Koneksi PostgreSQL. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET_NAME` | Unggah PDF ke bucket Supabase Storage. |
| `REDIS_ADDR`, `REDIS_PASSWORD` | Cache, rate limit, dan lock terdistribusi. Redis opsional; fallback hanya berlaku dalam satu proses. |
| `RATE_LIMIT_LOGIN`, `RATE_LIMIT_APPROVAL`, `RATE_LIMIT_API` | Batas request per IP. Nilai `0` menonaktifkan batas terkait. |
| `TRUSTED_PROXIES` | IP/CIDR proxy tepercaya untuk membaca alamat client. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_EMAIL`, `SMTP_PASSWORD`, `MANAGER_EMAIL` | Pengiriman email persetujuan dan PO. |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Opsional, untuk penjelasan dan prioritas stok. |

Untuk Gmail, gunakan App Password, bukan password akun biasa.

## Migrasi Database

Jalankan file berikut secara berurutan di Supabase SQL Editor:

1. `migrations/001_schema.sql` membuat tabel, index, constraint, kolom rekomendasi Gemini, dan tabel penerimaan.
2. `migrations/002_seed.sql` opsional untuk memuat ulang data demo.

`002_seed.sql` dapat dijalankan berulang kali. Setiap kali dijalankan, seluruh data demo lama dikosongkan lalu diisi ulang dari kondisi awal dalam satu transaksi. Jangan jalankan pada database yang berisi data yang perlu dipertahankan. Akun `users` tidak direset karena dibuat dari environment variable saat server mulai. Dalam mode `production`, backend tidak menjalankan `AutoMigrate`; jalankan migrasi SQL sebelum deploy.

## Endpoint

Semua endpoint selain `/health`, `POST /api/auth/login`, dan `/api/po/approval` memerlukan `Authorization: Bearer <JWT>`.

| Method | Path | Akses |
| :--- | :--- | :--- |
| GET | `/health` | Publik |
| POST | `/api/auth/login` | Publik |
| GET | `/api/po/approval?token=...&action=approve\|reject` | Publik, token terbatas waktu |
| GET | `/api/auth/me` | Semua role |
| GET | `/api/stok?status=all\|low\|manual` | Semua role |
| POST | `/api/stok/ai-analysis` | Semua role, maksimal 5 request per menit per IP |
| POST | `/api/stok/scan` | Admin |
| PATCH | `/api/stok/:sku` | Admin |
| GET | `/api/dashboard` | Semua role |
| GET | `/api/po?status=...`, `/api/po-log` | Semua role |
| GET | `/api/po-draft/:id` | Semua role |
| PUT | `/api/po-draft/:id` | Admin |
| POST | `/api/po-draft/:id/regenerate-pdf` | Admin |
| POST | `/api/po-draft/:id/submit` | Admin |
| GET | `/api/po-penerimaan/:id` | Semua role |
| POST | `/api/po-penerimaan/:id` | Admin |

Role `manager` hanya dapat membaca data. Endpoint analisis stok memakai hitungan agregat; rekomendasi pemindaian mengirim nilai stok, ROP, dan minimum order dengan nomor sementara, tanpa SKU, nama barang, atau pemasok. Gemini tidak menentukan jumlah PO, mengubah stok, atau menyetujui pesanan. Jika Gemini tidak tersedia, pemindaian tetap membuat draf dengan aturan yang sama.

Data angka per barang tetap dikirim ke Google saat fitur rekomendasi pemindaian digunakan. Periksa ketentuan layanan Gemini sebelum mengirim data produksi.

## Alur PO

Pemindaian harian pukul 08.00 WIB atau pemindaian admin membuat draf berstatus `DRAFT`. Admin dapat mengubah draf dan mengirimkannya ke manager. Submit mengubah status menjadi `PENDING_APPROVAL` dan mengirim tautan email. Persetujuan manager mengubah status menjadi `SENT` dan memulai pengiriman PDF ke pemasok. Admin mencatat barang yang datang melalui endpoint penerimaan; status menjadi `PARTIALLY_RECEIVED` atau `RECEIVED`.

Email diproses lewat antrean in-memory. Tugas yang belum selesai tidak tersimpan jika proses backend berhenti.

Semua endpoint API mengembalikan envelope JSON. Respons sukses berisi `success`, `message`, dan `data`; respons gagal juga menyertakan `error`.
