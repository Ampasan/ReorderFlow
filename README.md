# ReorderFlow

ReorderFlow membantu toko UMKM memantau stok dan menyiapkan Purchase Order (PO). Aplikasi publik berisi halaman produk, artikel, FAQ, dan Tentang. Dashboard staf memungkinkan admin meninjau draf sebelum manajer menyetujui PO lewat tautan email.

## Fitur Utama

- Deteksi low-stock otomatis setiap hari pukul 08:00 WIB, plus pemindaian manual oleh admin.
- Pembuatan draf PO PDF per pemasok, tersimpan di Supabase Storage.
- Editor draf PO: ubah kuantitas, hapus barang, tambah barang dari pemasok yang sama, simpan, lalu kirim ke manajer.
- Persetujuan manajer lewat email bertoken, berlaku 48 jam dan hanya dapat dipakai sekali.
- Pengiriman PDF final ke email pemasok setelah disetujui.
- Situs publik dengan halaman beranda, artikel, FAQ, dan Tentang.
- Dashboard stok dengan tab Semua, Perlu Reorder, dan Perlu Peninjauan.
- Riwayat PO dengan 8 filter status, filter pemasok, detail barang, penerimaan, dan tautan PDF.
- Koreksi stok opname dengan alasan `DAMAGED`, `MISCOUNT`, atau `RETURN` dan jejak audit.
- Gemini memberi prioritas pemeriksaan dan alasan pada barang low-stock saat pemindaian; jumlah draf tetap memakai aturan minimum order dan perlu ditinjau admin.
- Autentikasi JWT dengan dua role: `admin` dan `manager` (read-only di dashboard).

## Arsitektur

| Lapisan | Teknologi |
| :--- | :--- |
| Frontend | React 19, Vite 8, TypeScript, Tailwind CSS v3, React Router v7, React Hot Toast |
| Backend | Go 1.26, Gin, GORM |
| Database | PostgreSQL (Supabase) |
| Storage | Supabase Storage bucket `po-documents` |
| Cache dan lock | Redis opsional, dengan fallback cache in-memory dan lock proses lokal |
| Email | SMTP, diproses lewat antrean in-memory 2 worker |
| PDF | `gofpdf` |

Struktur repositori:

```text
reorderflow/
├── backend/     # API Go, cron, layanan PDF, email, dan migrasi SQL
├── frontend/    # SPA React untuk situs publik dan dashboard admin/manager
└── docs/        # PRD, FRD, IA, DESIGN, dan dokumen per fitur
```

Alur status PO:

```text
[Scan] -> DRAFT -> (Admin kirim) -> PENDING_APPROVAL
                                      ├── (Manager approve) -> SENT
                                      ├── (Manager reject)  -> REJECTED
                                      ├── (Token 48 jam)    -> REQUIRES_MANUAL_REVIEW
                                      └── (Gagal kirim)     -> REQUIRES_MANUAL_REVIEW
```

`DRAFT` berarti PO sudah dibuat tetapi belum dikirim ke siapa pun. Email ke manajer baru dikirim saat admin menekan **Kirim ke Manajer**.
Pemindaian terjadwal berjalan setiap hari pukul 08.00 WIB. Penerimaan barang dapat mengubah status `SENT` menjadi `PARTIALLY_RECEIVED`, lalu `RECEIVED`.

## Menjalankan Proyek

Prasyarat:

- Go 1.26 atau lebih baru.
- Node.js yang didukung Vite 8.
- PostgreSQL Supabase dan bucket storage `po-documents`.
- Redis opsional. Tanpa Redis, cache dan lock memakai memori proses.
- Akun SMTP dengan App Password untuk pengiriman email.

### 1. Backend

```bash
cd backend
cp .env.example .env
# isi kredensial Supabase, JWT, admin/manager, Redis, dan SMTP
go run ./cmd/server
```

Cek kesehatan server:

```bash
curl http://localhost:8080/health
```

Jalankan migrasi di Supabase SQL Editor secara berurutan:

1. `backend/migrations/001_schema.sql` — skema lengkap, termasuk kolom rekomendasi Gemini.
2. `backend/migrations/002_seed.sql` (opsional, untuk data demo).

`002_seed.sql` dapat dijalankan berulang kali. Setiap kali dijalankan, seluruh data demo lama dikosongkan lalu diisi ulang dari kondisi awal. Akun `users` tidak direset karena dibuat dari environment variable saat server start.

Akun dashboard dibuat otomatis saat startup:

- Admin dari `ADMIN_EMAIL` dan `ADMIN_PASSWORD`.
- Manager dari `MANAGER_EMAIL` dan `MANAGER_PASSWORD`.

`MANAGER_EMAIL` juga dipakai sebagai alamat penerima email persetujuan.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # default VITE_API_BASE_URL=http://localhost:8080
# VITE_SITE_URL opsional, dipakai untuk URL absolut di JSON-LD
npm run dev
```

Perintah lain:

```bash
npm run build   # tsc -b && vite build
npm run lint    # eslint
npm run preview # menyajikan hasil build
```

Base URL frontend tidak memakai akhiran `/api`. Path endpoint di frontend sudah diawali `/api/...`.

### 3. Produksi (satu origin)

Build frontend lebih dulu, lalu arahkan backend ke hasil build:

```bash
cd frontend
npm run build
```

Di `backend/.env`:

```bash
ENV=production
FRONTEND_DIST=../frontend/dist
```

Backend lalu menyajikan `index.html`, `/assets`, `/fonts`, dan file publik lain dari origin yang sama. Aset ber-hash dan font memakai cache `immutable`; `index.html` memakai `no-cache`. Jalankan Lighthouse terhadap `http://localhost:8080`, bukan dev server Vite, supaya yang diukur adalah bundle produksi yang sudah diminifikasi.

## Environment Backend

| Variabel | Keterangan |
| :--- | :--- |
| `PORT` | Port server, default `8080`. |
| `ENV` | `development` atau `production`. |
| `APP_URL` | Base URL backend untuk tautan approval di email. |
| `FRONTEND_DIST` | Opsional. Path ke hasil `npm run build` agar backend menyajikan SPA. Kosongkan saat development. |
| `JWT_SECRET` | Secret JWT, wajib diganti di production. |
| `JWT_TTL_HOURS` | Masa berlaku JWT, default 24 jam. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Akun admin inventori. |
| `MANAGER_EMAIL`, `MANAGER_PASSWORD` | Akun manager dan alamat penerima email persetujuan. |
| `SUPABASE_DB_*` | Koneksi PostgreSQL Supabase. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET_NAME` | Konfigurasi Supabase Storage. |
| `REDIS_ADDR`, `REDIS_PASSWORD` | Redis untuk cache, lock, dan rate limit. Opsional. |
| `RATE_LIMIT_LOGIN` | Batas percobaan login per IP dan per email dalam 15 menit, default `10`. `0` menonaktifkan. |
| `RATE_LIMIT_APPROVAL` | Batas permintaan tautan approval per IP per menit, default `30`. |
| `RATE_LIMIT_API` | Batas permintaan `/api` per IP per menit, default `120`. |
| `GEMINI_API_KEY` | Opsional. API key Google AI Studio untuk endpoint penjelasan stok low-stock. |
| `TRUSTED_PROXIES` | Daftar CIDR/IP proxy yang dipisahkan koma agar `ClientIP` membaca `X-Forwarded-For` dengan benar. |
| `EMAIL_PROVIDER` | `auto` (default), `resend`, atau `smtp`. `auto` memakai Resend bila `RESEND_API_KEY` terisi. |
| `RESEND_API_KEY`, `RESEND_FROM` | Kredensial Resend (HTTP API). Dipakai di Railway Free/Trial/Hobby karena SMTP diblokir. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_EMAIL`, `SMTP_PASSWORD` | Konfigurasi pengiriman email lewat SMTP. |

Railway Free, Trial, dan Hobby memblokir koneksi SMTP keluar. Di plan tersebut isi `RESEND_API_KEY` dan `RESEND_FROM` (domain terverifikasi di Resend) agar email dikirim lewat HTTP API, atau upgrade ke Pro untuk tetap memakai SMTP. Untuk Gmail di plan Pro, aktifkan 2-Step Verification dan gunakan App Password 16 karakter pada `SMTP_PASSWORD`.

## Endpoint Ringkas

| Method | Path | Akses |
| :--- | :--- | :--- |
| GET | `/health` | Publik |
| POST | `/api/auth/login` | Publik |
| GET | `/api/po/approval?token=...&action=approve\|reject` | Publik, token sekali pakai |
| GET | `/api/auth/me` | Semua role |
| GET | `/api/stok?status=all\|low\|manual` | Semua role |
| GET | `/api/dashboard` | Semua role |
| GET | `/api/po?status=...` dan `/api/po-log` | Semua role |
| GET | `/api/po-draft/:id` | Semua role |
| POST | `/api/po-draft/:id/regenerate-pdf` | Admin |
| POST | `/api/stok/scan` | Admin |
| POST | `/api/stok/ai-analysis` | Role terautentikasi, maksimal 5 permintaan per menit per IP |
| PATCH | `/api/stok/:sku` | Admin |
| PUT | `/api/po-draft/:id` | Admin |
| POST | `/api/po-draft/:id/submit` | Admin |
| GET | `/api/po-penerimaan/:id` | Semua role |
| POST | `/api/po-penerimaan/:id` | Admin |

Detail kontrak dan contoh respons ada di `backend/README.md`.

Rute publik frontend mencakup `/`, `/artikel`, `/artikel/:slug`, `/faq`, `/tentang`, dan `/login`. Dashboard yang dilindungi login berada di `/app`, `/stok`, `/po-log`, dan `/po-log/:id/draft`.

Gemini juga memberi prioritas pemeriksaan pada pemindaian stok otomatis atau manual. Gemini menerima stok, ROP, dan minimum order per barang dengan nomor urut sementara, tanpa nama, SKU, atau pemasok. Jumlah PO tetap ditetapkan backend dan draf perlu diperiksa admin. Google dapat menggunakan data yang dikirim melalui layanan gratis untuk peningkatan produk dan peninjauan manusia, jadi periksa ketentuan Gemini sebelum mengirim data produksi. Analisis penjelasan di halaman stok tetap memakai hitungan agregat saja.

## Dokumentasi

- `docs/PRD.md`: masalah, tujuan, lingkup, dan daftar fitur.
- `docs/FRD.md`: aturan fungsional, alur end-to-end, dan aturan bisnis.
- `docs/IA.md`: sitemap, user flow, entity mapping, dan component tree.
- `docs/DESIGN.md`: token warna, tipografi, layout, dan komponen UI.
- `docs/features/01-low-stock-detection` sampai `06-goods-receipt`: FRD, requirements, design, dan status implementasi per fitur.
- `backend/README.md`: setup backend, migrasi, dan endpoint.
- `frontend/README.md`: setup frontend, rute, dan struktur komponen.

## Catatan Operasional

- Email diproses lewat antrean in-memory. Jika server restart, task yang belum terkirim hilang dan PO terkait perlu diproses ulang.
- Tautan PDF memakai public URL Supabase Storage, jadi bucket `po-documents` harus dapat dibaca publik.
- Tanpa Redis, cache memakai memori proses dan pemindaian memakai lock lokal. Konfigurasi ini aman untuk satu instance, tetapi tidak untuk beberapa instance paralel.
- Frontend hanya menyediakan light theme. Tidak ada dark mode.
- PO hanya menyimpan kuantitas. Harga satuan, subtotal, pajak, dan total nominal belum termasuk lingkup.
