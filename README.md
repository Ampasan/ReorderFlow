# ReorderFlow

Platform otomasi Reorder Point (ROP) dan pengadaan barang untuk UMKM. ReorderFlow memindai stok harian, membuat draf Purchase Order (PO) per pemasok, memberi admin ruang meninjau draf, lalu mengirim PO ke pemasok setelah manajer menyetujui lewat tautan email.

## Fitur Utama

- Deteksi low-stock otomatis setiap hari pukul 08:00 WIB, plus pemindaian manual oleh admin.
- Pembuatan draf PO PDF per pemasok, tersimpan di Supabase Storage.
- Editor draf PO: ubah kuantitas, hapus barang, tambah barang dari pemasok yang sama, simpan, lalu kirim ke manajer.
- Persetujuan manajer lewat email bertoken, berlaku 48 jam dan hanya dapat dipakai sekali.
- Pengiriman PDF final ke email pemasok setelah disetujui.
- Dashboard stok dengan tab Semua, Perlu Reorder, dan Perlu Peninjauan.
- Riwayat PO dengan 6 filter status, filter pemasok, detail barang, dan tautan PDF.
- Koreksi stok opname dengan alasan `DAMAGED`, `MISCOUNT`, atau `RETURN` dan jejak audit.
- Autentikasi JWT dengan dua role: `admin` dan `manager` (read-only di dashboard).

## Arsitektur

| Lapisan | Teknologi |
| :--- | :--- |
| Frontend | React 19, Vite 8, TypeScript, Tailwind CSS v3, React Router, React Hot Toast |
| Backend | Go 1.26, Gin, GORM |
| Database | PostgreSQL (Supabase) |
| Storage | Supabase Storage bucket `po-documents` |
| Cache dan lock | Redis, dengan fallback cache in-memory dan lock proses lokal |
| Email | SMTP, diproses lewat antrean in-memory 2 worker |
| PDF | `gofpdf` |

Struktur repositori:

```text
reorderflow/
├── backend/     # API Go, cron, layanan PDF, email, dan migrasi SQL
├── frontend/    # SPA React untuk dashboard admin dan manager
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

## Menjalankan Proyek

Prasyarat:

- Go 1.26 atau lebih baru.
- Node.js 20 atau lebih baru.
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

1. `backend/migrations/001_schema.sql`
2. `backend/migrations/002_seed.sql` (opsional, untuk data demo)

`002_seed.sql` mengosongkan riwayat PO, stok opname, stok, dan pemasok, lalu mengisi ulang data demo. Akun `users` tidak direset karena dibuat dari environment variable saat server start.

Akun dashboard dibuat otomatis saat startup:

- Admin dari `ADMIN_EMAIL` dan `ADMIN_PASSWORD`.
- Manager dari `MANAGER_EMAIL` dan `MANAGER_PASSWORD`.

`MANAGER_EMAIL` juga dipakai sebagai alamat penerima email persetujuan.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # default VITE_API_BASE_URL=http://localhost:8080
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
| `REDIS_ADDR`, `REDIS_PASSWORD` | Redis untuk cache dan lock. Opsional. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_EMAIL`, `SMTP_PASSWORD` | Konfigurasi pengiriman email. |

Untuk Gmail, aktifkan 2-Step Verification dan gunakan App Password 16 karakter pada `SMTP_PASSWORD`.

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
| POST | `/api/stok/scan` | Admin |
| PATCH | `/api/stok/:sku` | Admin |
| PUT | `/api/po-draft/:id` | Admin |
| POST | `/api/po-draft/:id/submit` | Admin |

Detail kontrak dan contoh respons ada di `backend/README.md`.

## Dokumentasi

- `docs/PRD.md`: masalah, tujuan, lingkup, dan daftar fitur.
- `docs/FRD.md`: aturan fungsional, alur end-to-end, dan aturan bisnis.
- `docs/IA.md`: sitemap, user flow, entity mapping, dan component tree.
- `docs/DESIGN.md`: token warna, tipografi, layout, dan komponen UI.
- `docs/ReorderFlow.md`: proposal konsep, riset, kompetitor, dan roadmap.
- `docs/features/01-low-stock-detection` sampai `05-auth`: FRD, requirements, design, dan tasks per fitur.
- `backend/README.md`: setup backend, migrasi, dan endpoint.
- `frontend/README.md`: setup frontend, rute, dan struktur komponen.

## Catatan Operasional

- Email diproses lewat antrean in-memory. Jika server restart, task yang belum terkirim hilang dan PO terkait perlu diproses ulang.
- Tautan PDF memakai public URL Supabase Storage, jadi bucket `po-documents` harus dapat dibaca publik.
- Tanpa Redis, cache memakai memori proses dan pemindaian memakai lock lokal. Konfigurasi ini aman untuk satu instance, tetapi tidak untuk beberapa instance paralel.
- Frontend hanya menyediakan light theme. Tidak ada dark mode.
- PO hanya menyimpan kuantitas. Harga satuan, subtotal, pajak, dan total nominal belum termasuk lingkup.
