### Requirements Spec: FRD-02 Pembuatan Draf PDF PO (ReorderFlow)

--------------------------------------------------------------------------------

##### 1. Aspek: Perilaku (Kebutuhan & AC)
*   **K-2.1 (Pengelompokan Per Pemasok)** : KETIKA daftar SKU low-stock valid diterima dari Fitur FRD-01, sistem mengelompokkan SKU tersebut berdasarkan `id_pemasok`.
    *   **AC-2.1.1** : 3 SKU (2 dari Supplier A, 1 dari Supplier B) dikelompokkan menjadi 2 batch dokumen PO terpisah.
*   **K-2.2 (Penomoran PO Unik)** : KETIKA pengelompokan per pemasok selesai, sistem menerbitkan Nomor PO Unik dengan format `PO-YYYYMMDD-[ID_PEMASOK]-[URUTAN]`.
    *   **AC-2.2.1** : Pemasok ID 101 pada tanggal 25 Okt 2026 mendapatkan nomor PO `PO-20261025-101-001`.
*   **K-2.3 (Penuangan Layout PDF via gofpdf)** : KETIKA Nomor PO terbentuk, pustaka `gofpdf` di backend Go memproses pembuatan layout dokumen PDF PO yang berisi header UMKM, tabel daftar SKU, kuantitas order (`qty_min_order`), dan kolom tanda tangan.
    *   **AC-2.3.1** : Dokumen PDF A4 dibuat di memori backend memuat tabel SKU, kuantitas, dan area tanda tangan persetujuan.
*   **K-2.4 (Unggah ke Supabase Storage)** : KETIKA file PDF selesai dibuat di memori, sistem mengunggah file ke Supabase Storage Bucket `po-documents` dan mencatat URL publiknya ke kolom `tautan_pdf` pada tabel `po_log` dengan status `DRAFT`.
    *   **AC-2.4.1** : File `PO-20261025-101-001.pdf` tersimpan di bucket dan URL `https://.../po-documents/PO-20261025-101-001.pdf` tercatat di database dengan status `DRAFT`.
*   **Pengecualian & Batasan (JIKA / SELAMA)** :
    *   **JIKA** proses pengunggahan ke Supabase Storage gagal/timeout, sistem melakukan retry exponential backoff maksimal 3 kali sebelum membatalkan transaksi dan mencatat log error.
    *   **JIKA** detail email pemasok kosong, sistem tetap menghasilkan PDF PO tetapi menandai status `po_log` sebagai `REQUIRES_MANUAL_REVIEW`.
    *   **SELAMA** file PDF PO sedang diunggah, sistem memastikan nama file di-hash/diberi timestamp unik (`PO_[NOMOR_PO]_[TIMESTAMP].pdf`) untuk mencegah penimpaan file (*file overwriting*).

--------------------------------------------------------------------------------

##### 2. Aspek: Tampilan & Kondisi Layar
*   **Kondisi Memuat (Backend Service Logging)** :
    *   Mencatat log konsol: `"Rendering PDF PO for Supplier ID 101..."`.
*   **Kondisi Ada Data (PDF Render & Upload Success)** :
    *   Mencatat log konsol: `"PDF generated & uploaded: PO-20261025-101-001.pdf (Size: 42 KB)"`.
*   **Kondisi Gagal (Storage / Render Error)** :
    *   Mencatat log error: `"Gagal mengunggah PDF PO ke Supabase Storage, retrying (1/3)..."`.

--------------------------------------------------------------------------------

##### 3. Aspek: Data & Validasi
*   **Kolom Data Utama (`po_log`)** :
    *   `id` (Serial, Primary Key)
    *   `nomor_po` (String, Unique, Format: `PO-YYYYMMDD-[ID_PEMASOK]-[SEQ]`)
    *   `id_pemasok` (Foreign Key ke `pemasok`)
    *   `status` (Enum: `'DRAFT'`, `'SENT'`, `'REJECTED'`, `'REQUIRES_MANUAL_REVIEW'`)
    *   `tautan_pdf` (String URL, Supabase Storage Public URL)
    *   `token` (String, Idempotency Token)
    *   `created_at` (Timestamp)
*   **Format Dokumen PDF** :
    *   Ukuran kertas: A4 Portrait.
    *   Elemen: Header Perusahaan, Nomor PO & Tanggal, Tabel Barang (SKU, Nama, Qty), Area Tanda Tangan.

--------------------------------------------------------------------------------

##### 4. Aspek: Error & Pengecualian
*   **Storage Service Timeout / Outage** :
    *   JIKA Supabase Storage mengalami gangguan, retry worker berjalan 3x. Jika tetap gagal, batalkan pembuatan record PO dan catat log error.
*   **Penomoran Bentrok (Duplicate Key)** :
    *   JIKA terjadi bentrok `nomor_po`, fungsi menambah nilai urutan (+1) dan mencoba ulang penyimpan data.

--------------------------------------------------------------------------------

##### 5. Aspek: Hak Akses
*   **Backend PDF Builder Service** :
    *   Memiliki izin Service Role Key untuk menulis ke Supabase Storage Bucket `po-documents` dan tabel `po_log`.
*   **Manager & Admin** :
    *   Dapat mengakses tautan URL publik PDF untuk membaca/mengunduh dokumen.

--------------------------------------------------------------------------------

##### 6. Aspek: Jumlah Data & Kecepatan
*   **Volume Data** :
    *   Mampu memproses generasi PDF untuk 50 batch PO per eksekusi.
*   **Target Waktu & Performa** :
    *   Waktu generasi PDF + Upload ke Supabase Storage: **< 2.0 detik** per dokumen PO.

--------------------------------------------------------------------------------

##### 7. Aspek: Bukan Bagian Ini (Out-of-Scope)
*   Modul ini **TIDAK** mencakup pengiriman email persetujuan ke Manager (ditangani oleh Fitur FRD-03).
*   Modul ini **TIDAK** mencakup editor WYSIWYG untuk mengubah template PDF secara langsung di UI React.
