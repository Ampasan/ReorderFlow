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

## Menyajikan Frontend Produksi

Isi `FRONTEND_DIST` di `.env` dengan path hasil `npm run build` (misalnya `../frontend/dist`). Backend lalu menyajikan SPA dari origin yang sama lewat fallback SPA, dengan `Cache-Control` immutable untuk `assets` dan `fonts` serta `no-cache` untuk `index.html`. Jika variabel kosong atau folder tidak ada, perilaku tetap seperti sebelumnya (API saja).

## Email / SMTP

Gmail menolak password akun biasa untuk SMTP. Aktifkan 2-Step Verification pada akun pengirim, buat App Password 16 karakter, lalu isi `SMTP_PASSWORD` dengan App Password tersebut. Jika autentikasi gagal, log server menampilkan `535 5.7.8 Username and Password not accepted` dan PO otomatis masuk `REQUIRES_MANUAL_REVIEW`.

Pengiriman dibatasi 15 detik per percobaan dengan dua percobaan. Error 5xx dari SMTP dianggap permanen, jadi tidak diulang.

## Migrasi Database

Jalankan file berikut berurutan di Supabase SQL Editor:

1. `migrations/001_schema.sql`: semua tabel, index, dan constraint. Versi terbaru juga menambah tabel `po_penerimaan` dan `po_penerimaan_detail` serta dua nilai status PO (`PARTIALLY_RECEIVED`, `RECEIVED`) pada `po_log_status_check`. Aman dijalankan ulang karena constraint lama di-drop lebih dulu.
2. `migrations/003_ai_stock_recommendations.sql`: menambah kolom prioritas dan alasan Gemini ke detail PO. Aman dijalankan ulang.
3. `migrations/002_seed.sql` (opsional): reset data demo lalu isi ulang pemasok, stok grosir/sembako, dua PO `DRAFT`, dan satu PO `SENT`.

Ketiga migrasi dapat dijalankan berulang. `002_seed.sql` selalu mengosongkan riwayat PO, stok opname, stok, dan pemasok lebih dulu, jadi hanya jalankan jika ingin mengembalikan demo ke kondisi awal. Akun `users` tidak direset karena dibuat dari `ADMIN_EMAIL` dan `MANAGER_EMAIL` saat server start.

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
| POST | `/api/stok/ai-analysis` | Penjelasan Gemini untuk barang low-stock. JWT wajib; maksimal 5 permintaan per menit per IP. |
| POST | `/api/stok/scan` | Memicu pemindaian low-stock dan pembuatan draf PO. Draf belum dikirim ke manajer. |
| GET | `/api/dashboard` | Ringkasan KPI dashboard. |
| GET | `/api/po` | Riwayat PO. Query `status=all|DRAFT|PENDING_APPROVAL|SENT|REJECTED|REQUIRES_MANUAL_REVIEW|PARTIALLY_RECEIVED|RECEIVED`. |
| GET | `/api/po-log` | Alias dari `/api/po`. |
| GET | `/api/po-draft/:id` | Detail draf PO beserta barang dan pemasok. |
| PUT | `/api/po-draft/:id` | Simpan perubahan barang draf. Body `{"items":[{"sku":"...","jumlah_order":10}]}`. |
| POST | `/api/po-draft/:id/submit` | Kirim draf ke manajer: PDF dibuat ulang dan email persetujuan dikirim. |
| GET | `/api/po-penerimaan/:id` | Konteks penerimaan: qty order, sudah diterima, sisa per SKU, dan riwayat penerimaan. |
| POST | `/api/po-penerimaan/:id` | Catat penerimaan barang. Body `{"items":[{"sku":"...","qty_diterima":12}]}`. Hanya untuk PO `SENT`/`PARTIALLY_RECEIVED`. |
| GET | `/api/po/approval?token=...&action=approve|reject` | Halaman konfirmasi persetujuan dari email (publik). |

Endpoint selain `/health`, `/api/auth/login`, dan `/api/po/approval` wajib memakai header `Authorization: Bearer <token>`. `POST /api/stok/scan`, `PUT /api/po-draft/:id`, `POST /api/po-draft/:id/submit`, dan `POST /api/po-penerimaan/:id` hanya untuk role `admin`; role `manager` bersifat read-only.

Endpoint analisis Gemini juga dapat dipakai admin dan manager setelah login. Saat pemindaian stok terjadwal atau manual berjalan dan `GEMINI_API_KEY` tersedia, Gemini menilai prioritas pemeriksaan barang yang memenuhi syarat untuk draf PO. Backend hanya mengirim nomor urut sementara, stok, ROP, dan minimum order. Nama barang, SKU, pemasok, serta identitas tidak dikirim. Gemini memberi tingkat prioritas dan alasan, tetapi tidak menentukan jumlah order. Backend tetap memakai aturan minimum order untuk jumlah PO. Jika Gemini gagal, pemindaian tetap membuat draf dengan aturan yang sama dan respons/log menandai rekomendasi tidak tersedia. Admin tetap memeriksa dan mengirim draf ke manajer; Gemini tidak mengubah stok atau menyetujui/mengirim PO.

Endpoint `/api/stok/ai-analysis` tetap memakai hitungan agregat saja untuk penjelasan umum dan tidak membuat PO.

Permintaan rekomendasi mengirim angka stok dan ROP per barang ke Google, meski tanpa nama atau SKU. Google dapat menggunakan konten pada layanan gratis untuk peningkatan produk dan peninjauan manusia. Periksa ketentuan serta kuota terkini Gemini API sebelum mengirim data produksi.

Alur draf PO: pemindaian membuat `DRAFT` tanpa mengirim email, admin dapat mengubah barang, lalu submit mengubah status ke `PENDING_APPROVAL` dan mengirim email ke manajer. Persetujuan manajer mengubah status ke `SENT` dan mengirim PDF ke pemasok. Setelah barang datang, admin mencatat penerimaan per SKU: stok bertambah sesuai qty aktual dan status berubah ke `PARTIALLY_RECEIVED` atau `RECEIVED`.

Semua endpoint data memakai envelope JSON:

```json
{ "success": true, "message": "...", "data": ... }
```

Saat gagal, `data` bernilai `null` dan ditambah field `error`.

---
