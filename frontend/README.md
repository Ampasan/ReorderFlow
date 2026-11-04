# ReorderFlow Frontend

Frontend ReorderFlow memakai React 19, Vite 8, TypeScript, Tailwind CSS v3, React Router v7, dan React Hot Toast. Halaman publik menampilkan informasi produk. Dashboard admin dan manager mengambil data dari backend Go melalui `/api`.

## Menjalankan

Prasyarat: Node.js yang didukung Vite 8 dan backend lokal di `http://localhost:8080`.

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

`VITE_API_BASE_URL` mengatur origin API tanpa akhiran `/api`. Jika tidak diatur, development memakai `http://localhost:8080`. `VITE_SITE_URL` dipakai untuk canonical, Open Graph, sitemap, dan JSON-LD.

Perintah lain:

```text
npm run build    # type-check TypeScript lalu build produksi
npm run lint     # ESLint
npm run preview  # pratinjau hasil build
```

## Rute

| Rute | Akses | Isi |
| :--- | :--- | :--- |
| `/` | Publik | Landing page |
| `/artikel` | Publik | Daftar artikel |
| `/artikel/:slug` | Publik | Artikel |
| `/faq` | Publik | Pertanyaan umum |
| `/tentang` | Publik | Informasi produk |
| `/login` | Publik | Login email dan password |
| `/app` | Login | Dashboard operasional dengan 6 kartu KPI |
| `/stok` | Login | Daftar stok dan filter `all`, `low`, `manual` |
| `/po-log` | Login | Riwayat PO, 8 filter status, dan filter pemasok |
| `/po-log/:id/draft` | Login | Editor draf PO; manager melihat versi read-only |

Rute tak dikenal kembali ke `/`. Halaman persetujuan email bukan bagian dari SPA; backend menyajikannya di `/api/po/approval`.

## Autentikasi dan Akses

- Login memakai `POST /api/auth/login`. Frontend menyimpan token dan profil di `localStorage` dengan kunci `reorderflow.token` dan `reorderflow.user`.
- `services/api.ts` memakai `fetch`, menambahkan header bearer untuk request terautentikasi, dan membatalkan request setelah 20 detik.
- Respons `401` menghapus sesi dan mengarahkan pengguna ke login. Respons `403` menampilkan toast akses ditolak.
- `manager` hanya dapat membaca dashboard, stok, dan riwayat PO. Aksi scan, opname, edit draf, submit, dan penerimaan hanya tersedia untuk `admin`.

## Endpoint yang Dipakai

| Method | Path | Kegunaan |
| :--- | :--- | :--- |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Memulihkan profil |
| GET | `/api/dashboard` | Ringkasan KPI |
| GET | `/api/stok?status=...` | Daftar stok |
| POST | `/api/stok/scan` | Membuat draf PO dari stok yang perlu reorder |
| POST | `/api/stok/ai-analysis` | Penjelasan agregat stok low-stock |
| PATCH | `/api/stok/:sku` | Koreksi stok opname |
| GET | `/api/po?status=...` | Riwayat PO |
| GET | `/api/po-draft/:id` | Detail draf |
| PUT | `/api/po-draft/:id` | Menyimpan perubahan draf |
| POST | `/api/po-draft/:id/submit` | Mengirim draf ke manager |
| GET | `/api/po-penerimaan/:id` | Memuat ringkasan penerimaan |
| POST | `/api/po-penerimaan/:id` | Mencatat barang yang datang |

## Struktur

```text
src/
├── App.tsx          # Rute publik dan rute aplikasi
├── components/      # Shell, tabel, dialog, badge, dan state halaman
├── context/         # AuthProvider
├── hooks/           # Akses data dan aksi
├── pages/           # Landing, artikel, FAQ, Tentang, dan dashboard
├── services/        # Klien API dan service per fitur
├── types/           # Tipe respons API dan domain
└── utils/           # Penyimpanan sesi, konstanta, dan formatter
```

Frontend memakai `fetch` dan ikon SVG lokal, bukan Axios atau paket ikon eksternal. Tabel dashboard tidak menyediakan pagination, pencarian teks, filter tanggal, atau ekspor CSV.

## Tampilan

- Font Poppins untuk heading, Montserrat untuk teks antarmuka, dan JetBrains Mono untuk SKU serta nomor PO. File font berada di `public/fonts`.
- Token warna, status, dan aturan komponen ada di [`../docs/DESIGN.md`](../docs/DESIGN.md).
- Dashboard memakai light theme. Dialog mendukung fokus keyboard dan tombol `Escape`.

Untuk pengujian build, jalankan `npm run build`. Gunakan `npm run preview` atau atur `FRONTEND_DIST` pada backend untuk melihat hasil produksi.
