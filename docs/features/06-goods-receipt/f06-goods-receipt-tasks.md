# Implementasi dan Validasi: FRD-06 Penerimaan Barang

## Status Implementasi

Penerimaan barang sudah tersedia di backend dan antarmuka riwayat PO.

- `GET /api/po-penerimaan/:id` menampilkan jumlah order, jumlah diterima, sisa, dan riwayat.
- Admin mencatat qty aktual lewat `POST /api/po-penerimaan/:id`.
- Backend menolak penerimaan untuk PO selain `SENT` dan `PARTIALLY_RECEIVED`, SKU yang tidak termasuk PO, qty melebihi sisa, atau request tanpa qty positif.
- Stok bertambah sesuai qty aktual. Status PO menjadi `PARTIALLY_RECEIVED` atau `RECEIVED`.
- PO yang diterima sebagian tetap dianggap aktif saat pemindaian; PO yang sudah diterima penuh tidak lagi menahan SKU.
- Dashboard menggabungkan kedua status penerimaan dalam kartu PO Diterima.

## Validasi

Perintah pemeriksaan backend dan frontend:

```text
go test ./...
npm run build
```

Uji alur penerimaan dan migrasi pada database terpasang belum dicatat di repositori. Pastikan migrasi database production sudah dijalankan sebelum menggunakan endpoint ini.
