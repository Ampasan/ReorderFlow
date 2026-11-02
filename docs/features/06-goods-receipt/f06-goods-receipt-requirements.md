### Requirements Spec: FRD-06 Goods Receipt (ReorderFlow)

--------------------------------------------------------------------------------

##### 1. Aspek: Perilaku (Kebutuhan & AC)
*   **K-6.0 (Akses Aksi Penerimaan)** : KETIKA pengguna membuka Riwayat PO, tombol **Terima Barang** hanya dirender untuk role `admin` pada PO berstatus `SENT` atau `PARTIALLY_RECEIVED`.
    *   **AC-6.0.1** : Role `manager` tidak melihat tombol tersebut di tabel maupun di dialog detail PO.
    *   **AC-6.0.2** : Endpoint `POST /api/po-penerimaan/{id}` menolak role `manager` dengan HTTP `403`.
*   **K-6.1 (Muat Konteks Penerimaan)** : KETIKA admin menekan **Terima Barang**, antarmuka memanggil `GET /api/po-penerimaan/{id}` dan menampilkan satu baris per SKU berisi jumlah order, sudah diterima, sisa, dan input qty datang.
    *   **AC-6.1.1** : Input qty terisi default sebesar `sisa`.
    *   **AC-6.1.2** : Baris dengan `sisa = 0` tampil redup dan inputnya dinonaktifkan.
    *   **AC-6.1.3** : Riwayat penerimaan sebelumnya ditampilkan jika sudah ada.
*   **K-6.2 (Validasi Qty)** : KETIKA admin mengubah qty, antarmuka memvalidasi input secara lokal.
    *   **AC-6.2.1** : Qty harus bilangan bulat, minimal `0`, dan tidak melebihi `sisa`.
    *   **AC-6.2.2** : Tombol **Simpan Penerimaan** tidak memproses form jika semua baris bernilai `0`.
*   **K-6.3 (Simpan Penerimaan)** : KETIKA admin menyimpan, antarmuka memanggil `POST /api/po-penerimaan/{id}` dengan daftar `{sku, qty_diterima}`.
    *   **AC-6.3.1** : Stok bertambah sesuai qty aktual, dialog tertutup, dan badge PO berubah menjadi `PARTIALLY_RECEIVED` atau `RECEIVED`.
    *   **AC-6.3.2** : Cache `po`, `penerimaan`, `stock`, dan `dashboard` dibersihkan setelah sukses.
*   **K-6.4 (Status Turunan)** : SETELAH setiap penerimaan, status PO dihitung ulang dari total qty diterima per baris.
    *   **AC-6.4.1** : Semua baris mencapai `jumlah_order` menghasilkan `RECEIVED`.
    *   **AC-6.4.2** : Baru sebagian baris yang penuh menghasilkan `PARTIALLY_RECEIVED`.
*   **K-6.5 (Editor Draf Terkunci)** : KETIKA PO berstatus `PARTIALLY_RECEIVED` atau `RECEIVED` dibuka di `/po-log/{id}/draft`, halaman menampilkan pesan terkunci dan tidak menyediakan aksi edit.
*   **Pengecualian & Batasan (JIKA / SELAMA)** :
    *   **JIKA** status PO bukan `SENT` atau `PARTIALLY_RECEIVED`, endpoint menolak dengan HTTP `409` dan stok tidak berubah.
    *   **JIKA** qty melebihi sisa, endpoint menolak dengan HTTP `400`.
    *   **SELAMA** data penerimaan dimuat, dialog menampilkan teks "Memuat data penerimaan...".

--------------------------------------------------------------------------------

##### 2. Aspek: Tampilan & Kondisi Layar
*   **Kondisi Memuat (Loading)** : Teks "Memuat data penerimaan..." di dalam dialog. Tombol simpan nonaktif.
*   **Kondisi Ada Data (Success / Data Available)** :
    *   Dialog lebar (`Modal` size `lg`) dengan tabel SKU, nama barang, order, diterima, sisa, dan input qty.
    *   Badge `PARTIALLY_RECEIVED` memakai latar terracotta tipis (`brand-orange/10`), badge `RECEIVED` memakai latar hijau (`emerald-50`).
*   **Kondisi Kosong (Empty State)** : Dialog hanya dibuka untuk PO `SENT` atau `PARTIALLY_RECEIVED`, sehingga selalu ada baris barang. Jika data gagal dimuat, tampil pesan error di dalam dialog.
*   **Kondisi Gagal (Error Fallback)** : Validasi per baris tampil di bawah input, validasi form tampil di kotak `role="alert"` di atas footer.

--------------------------------------------------------------------------------

##### 3. Aspek: Data & Validasi
*   **Kolom Tabel Penerimaan** : Barang (SKU + nama), Order, Diterima, Sisa, Qty datang.
*   **Payload Request** : `{"items":[{"sku":"SKU-BRS-01","qty_diterima":12}]}`. Hanya baris dengan qty lebih dari `0` yang dikirim.
*   **Validasi Backend** :
    *   SKU harus milik PO tersebut.
    *   `0 <= qty_diterima <= sisa`.
    *   Minimal satu baris lebih dari `0`.
    *   Tidak ada SKU duplikat dalam satu request.
*   **Penyimpanan** : Header di `po_penerimaan`, baris di `po_penerimaan_detail`. Tidak memakai tabel `stok_opname`.

--------------------------------------------------------------------------------

##### 4. Aspek: Error & Pengecualian
*   **400 Bad Request** : Qty melebihi sisa, SKU bukan milik PO, atau tidak ada qty lebih dari 0.
*   **403 Forbidden** : Role bukan admin.
*   **404 Not Found** : PO tidak ditemukan.
*   **409 Conflict** : Status PO bukan `SENT` atau `PARTIALLY_RECEIVED`.
*   **Kegagalan Jaringan** : Toast error dari hook `usePenerimaan`, dialog tetap terbuka agar admin bisa mencoba lagi.

--------------------------------------------------------------------------------

##### 5. Aspek: Hak Akses
*   **Staf Inventori / Procurement Admin (`admin`)** : Dapat melihat konteks penerimaan dan mencatat penerimaan.
*   **Operations Manager (`manager`)** : Hanya melihat status PO dan detailnya. Tanpa tombol penerimaan.

--------------------------------------------------------------------------------

##### 6. Aspek: Jumlah Data & Kecepatan
*   **Volume Data** : Satu PO umumnya berisi 5 sampai 20 baris. Riwayat penerimaan per PO jarang melebihi 10 entri.
*   **Target Waktu & Performa** :
    *   Respons `GET /api/po-penerimaan/{id}`: **< 300 ms** untuk 20 baris.
    *   Respons `POST /api/po-penerimaan/{id}`: **< 500 ms** karena satu transaksi dan beberapa update stok.

--------------------------------------------------------------------------------

##### 7. Aspek: Bukan Bagian Ini (Out-of-Scope)
*   Modul ini **TIDAK** mencakup penerimaan melebihi jumlah order (over-receipt). Kelebihan fisik diselesaikan lewat opname.
*   Modul ini **TIDAK** mencakup pembatalan PO sebagian atau state "dibatalkan sebagian".
*   Modul ini **TIDAK** mencakup unggah bukti terima, nomor surat jalan, atau lampiran foto.
*   Modul ini **TIDAK** mencakup penilaian harga, pajak, atau nilai nominal barang yang datang.
