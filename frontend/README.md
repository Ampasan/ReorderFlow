# ReorderFlow Frontend

Antarmuka web ReorderFlow (React 19 + Vite + TypeScript + Tailwind CSS v3). Semua data diambil dari backend Go melalui `/api`.

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

## Rute

| Rute | Isi |
| :--- | :--- |
| `/login` | Form login email/password (publik) |
| `/` | Ringkasan operasional: kartu KPI, banner reorder, tabel low stock |
| `/stok` | Seluruh SKU dengan filter `?status=all\|low\|manual` |
| `/po-log` | Riwayat PO dengan filter `?status=all\|DRAFT\|SENT\|REJECTED\|REQUIRES_MANUAL_REVIEW` |
| `*` | Dialihkan ke `/` |

Semua rute selain `/login` dilindungi `ProtectedRoute`. Tanpa token valid pengguna diarahkan ke `/login`, lalu dikembalikan ke halaman asal setelah masuk.

Halaman konfirmasi persetujuan manajer bukan bagian SPA: backend merendernya langsung di `GET /api/po/approval?token=...&action=...`.

## Autentikasi

- `POST /api/auth/login` mengembalikan JWT dan profil user. Token disimpan di `localStorage` bersama profil, sesuai FRD-05 yang tidak memakai cookie httpOnly atau refresh token.
- `services/api.ts` menyisipkan `Authorization: Bearer <token>` pada setiap request, menghapus sesi dan memancarkan `reorderflow:unauthorized` saat menerima `401`, serta menampilkan toast saat menerima `403`.
- `AuthContext` memulihkan sesi lewat `GET /api/auth/me`, menyediakan `login()` dan `logout()`.
- Peran `manager` tidak melihat aksi tulis: tombol "Buat PO Sekaligus" dan "Pindai Stok Sekarang" hanya dirender untuk `admin`.
- Akun dibuat backend dari variabel `ADMIN_EMAIL`/`ADMIN_PASSWORD` dan `MANAGER_EMAIL`/`MANAGER_PASSWORD` di `backend/.env`.

## Struktur

```text
src/
├── components/   # shell, tabel, dialog, badge, route guard, state kosong/loading/error
├── context/      # AuthProvider: token, user, login, logout
├── hooks/        # useAuth, useResource, useDashboard, useStock, usePOLog, useScan
├── pages/        # LoginPage, Dashboard, StockList, POLogList
├── services/     # axios client, auth, dashboard, stok, PO
├── types/        # tipe response backend dan auth
└── utils/        # authStorage, formatter tanggal WIB, konstanta filter
```

## Catatan desain

- Palet mengikuti `docs/DESIGN.md`: krem `#FEF3E2`, shell `#E2CBB0`, tinta `#2A1A0E`, terracotta.
- Terracotta `#D4621A` dipakai sebagai aksen (focus ring, titik status). Permukaan tombol dan teks memakai `#B85114` dan `#9C4410` supaya teks putih dan teks terracotta tetap lolos WCAG AA 4.5:1.
- Tidak ada mode gelap: sesuai FRD-04 bagian 7.
