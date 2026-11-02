# ReorderFlow Frontend

Antarmuka web ReorderFlow dengan React 19, Vite, TypeScript, dan Tailwind CSS v3. Semua data diambil dari backend Go melalui `/api`.

## Menjalankan

Prasyarat: Node.js 20 atau lebih baru, dan backend ReorderFlow berjalan di `http://localhost:8080`.

```bash
npm install
cp .env.example .env   # opsional, default sudah http://localhost:8080
npm run dev
```

Perintah lain:

```bash
npm run build   # tsc -b && vite build
npm run lint    # eslint
npm run preview # menyajikan hasil build
```

`VITE_API_BASE_URL` diisi tanpa akhiran `/api`, misalnya `http://localhost:8080`. Path endpoint di kode sudah diawali `/api/...`.

## Rute

| Rute | Isi |
| :--- | :--- |
| `/login` | Form login email/password (publik) |
| `/` | Ringkasan operasional: 5 kartu KPI, banner low stock, banner data abnormal, cuplikan stok di bawah ROP |
| `/stok` | Seluruh SKU dengan filter `?status=all\|low\|manual`, aksi scan dan opname untuk admin |
| `/po-log` | Riwayat PO dengan 6 filter status dan filter pemasok |
| `/po-log/:id/draft` | Editor draf PO: ubah qty, hapus atau tambah barang, simpan, kirim ke manajer |
| `*` | Dialihkan ke `/` |

Semua rute selain `/login` dilindungi `ProtectedRoute`. Tanpa token valid pengguna diarahkan ke `/login`, lalu dikembalikan ke halaman asal setelah masuk.

Filter status PO: `all`, `DRAFT`, `PENDING_APPROVAL`, `SENT`, `REJECTED`, dan `REQUIRES_MANUAL_REVIEW`. Filter pemasok berjalan di sisi klien dari daftar PO yang sudah dimuat.

Halaman konfirmasi persetujuan manajer bukan bagian SPA: backend merendernya langsung di `GET /api/po/approval?token=...&action=...`.

## Autentikasi

- `POST /api/auth/login` mengembalikan JWT dan profil user. Token dan user disimpan di `localStorage` dengan kunci `reorderflow.token` dan `reorderflow.user`. Tidak ada cookie httpOnly atau refresh token.
- `services/api.ts` memakai `fetch`, menyisipkan `Authorization: Bearer <token>` pada setiap request, memakai timeout 20 detik, menghapus sesi dan memancarkan `reorderflow:unauthorized` saat menerima `401`, serta menampilkan toast saat menerima `403`.
- `AuthProvider` memulihkan sesi lewat `GET /api/auth/me`, menyediakan `login()` dan `logout()`, dan mendengarkan event `reorderflow:unauthorized`.
- Role `manager` bersifat read-only. Tombol scan, opname, edit draf, dan kirim ke manajer hanya dirender untuk `admin`. Halaman editor draf menampilkan panel read-only untuk manager.
- Akun dibuat backend dari variabel `ADMIN_EMAIL`/`ADMIN_PASSWORD` dan `MANAGER_EMAIL`/`MANAGER_PASSWORD` di `backend/.env`.

## Endpoint yang Dipakai

| Method | Path | Fungsi |
| :--- | :--- | :--- |
| POST | `/api/auth/login` | Login dan terima JWT |
| GET | `/api/auth/me` | Pulihkan profil user |
| GET | `/api/dashboard` | Ringkasan KPI |
| GET | `/api/stok?status=...` | Daftar stok |
| POST | `/api/stok/scan` | Jalankan pemindaian |
| PATCH | `/api/stok/:sku` | Simpan koreksi opname |
| GET | `/api/po?status=...` | Riwayat PO |
| GET | `/api/po-draft/:id` | Detail draf PO |
| PUT | `/api/po-draft/:id` | Simpan baris draf |
| POST | `/api/po-draft/:id/submit` | Kirim draf ke manajer |

## Struktur

```text
src/
├── App.tsx          # Router, lazy pages, AuthProvider
├── components/      # AppShell, Sidebar, tabel, dialog, badge, state kosong/loading/error
├── context/         # AuthProvider dan authContext
├── hooks/           # useAuth, useResource, useDashboard, useStock, useStockCorrection, useScan, usePOLog
├── pages/           # LoginPage, Dashboard, StockList, POLogList, PODraftEditor
├── services/        # api, authService, dashboardService, stockService, poService
├── types/           # tipe response backend dan auth
└── utils/           # authStorage, constants, formatter tanggal WIB
```

Tidak memakai Axios dan tidak memakai library ikon eksternal. Ikon berupa komponen SVG lokal di `components/icons.tsx`.

## State dan Interaksi

- Setiap halaman data menangani loading skeleton, empty state, dan error state dengan tombol "Coba Lagi".
- Dialog memakai `Modal` dengan focus trap, tombol `Escape`, dan klik overlay untuk menutup.
- Aksi penting memakai `ConfirmDialog`, misalnya scan stok dan kirim draf ke manajer.
- `DetailDialog` menampilkan detail SKU atau PO. `OpnameDialog` menampilkan koreksi stok.
- Tidak ada pagination, pencarian teks, filter tanggal, ekspor CSV, atau mode gelap.

## Performa

- Font `Plus Jakarta Sans` dan `JetBrains Mono` di-self-host di `public/fonts` sebagai variable font latin. Tidak ada request ke Google Fonts, jadi tidak ada third-party origin di jalur kritis.
- `Plus Jakarta Sans` di-preload di `index.html`; ilustrasi login memakai file 460px yang sudah dioptimalkan dan di-preload dengan `fetchpriority="high"`.
- Semua elemen `img` memakai `width` dan `height` eksplisit agar tidak ada layout shift.
- Jalankan `npm run build` lalu `npm run preview` (atau backend dengan `FRONTEND_DIST`) saat mengukur performa. Dev server Vite menyajikan modul yang belum diminifikasi, jadi angka Lighthouse dari `npm run dev` tidak mewakili produksi.

## Catatan Desain

- Palet mengikuti `docs/DESIGN.md`: krem `#FEF3E2`, shell `#E2CBB0`, garis `#CEB394`, tinta `#2A1A0E`, muted `#6A5B4E`, field `#A08972`.
- Tombol utama memakai `brand-orange #B85114` dan hover `#9C4410` agar teks putih lolos WCAG AA 4.5:1.
- Focus ring global memakai `#D4621A` dengan outline 2px.
- Badge status memakai label `Normal`, `Low Stock`, `Review`, `Draf`, `Menunggu`, `Terkirim`, dan `Ditolak`.
- Tidak ada mode gelap: sesuai FRD-04 bagian 7.
