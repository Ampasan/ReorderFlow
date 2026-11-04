# Implementasi dan Validasi: FRD-04 Inventory Dashboard

## Status Implementasi

Fitur dashboard saat ini tersedia di frontend. `/` adalah landing page publik; dashboard aplikasi berada di `/app`.

- Halaman publik: beranda, daftar dan detail artikel, FAQ, Tentang, dan login.
- Dashboard berisi enam KPI. Kartu PO Diterima menjumlahkan PO `PARTIALLY_RECEIVED` dan `RECEIVED`.
- Data stok memiliki filter `all`, `low`, dan `manual`, serta aksi scan dan opname untuk admin.
- Riwayat PO memiliki pilihan Semua dan tujuh status PO, filter pemasok, detail, tautan PDF, dan aksi penerimaan.
- Editor draf tersedia di `/po-log/:id/draft`; manager hanya dapat melihatnya.
- Halaman data menyediakan loading, empty, dan error state.

## Validasi

Perintah pemeriksaan frontend:

```text
npm run build
npm run lint
```

Uji alur end-to-end dengan backend dan layanan eksternal belum dicatat di repositori. Jalankan pengujian tersebut pada environment yang memiliki database, Supabase Storage, dan SMTP sebelum rilis.
