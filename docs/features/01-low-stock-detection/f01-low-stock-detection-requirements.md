### Requirements Spec: FRD-01 Deteksi Low-Stock (ReorderFlow)

--------------------------------------------------------------------------------

##### 1. Aspek: Perilaku (Kebutuhan & AC)
*   **K-1.1 (Pemindaian Terjadwal Otomatis)** : KETIKA cron job jadwal harian aktif pada jam 08:00 WIB, sistem memicu runner detection_service.go untuk membaca seluruh baris pada tabel `stok` Supabase PostgreSQL.
    *   **AC-1.1.1** : Sistem mengeksekusi query pemindaian otomatis dan mencatat log "Executing Low-Stock Scanner...".
*   **K-1.2 (Penyaringan Reorder Point / ROP)** : KETIKA runner berjalan, sistem memfilter produk yang memiliki `stok_saat_ini <= reorder_point`.
    *   **AC-1.2.1** : SKU `SKU-BTL-01` dengan `stok_saat_ini = 3` dan `reorder_point = 10` berhasil terdeteksi dan masuk ke antrean kualifikasi low-stock dengan jumlah order disarankan sebesar `qty_min_order` (50 unit).
*   **K-1.3 (Pencegahan PO Ganda / Active PO Filter)** : KETIKA SKU memenuhi kriteria ROP, sistem memeriksa tabel `po_log` apakah SKU atau Pemasok terkait sudah memiliki PO aktif berstatus `DRAFT` atau `SENT` dalam 7 hari terakhir.
    *   **AC-1.3.1** : SKU `SKU-BTL-01` yang sudah terdaftar di `po_log` dengan nomor `PO-20261025-001` (status `DRAFT`) akan diabaikan (`has_active_po = true`) untuk mencegah pemesanan ganda.
*   **Pengecualian & Batasan (JIKA / SELAMA)** :
    *   **JIKA** `stok_saat_ini < 0` ATAU `reorder_point <= 0` ATAU `qty_min_order <= 0`, sistem menandai SKU sebagai `REQUIRES_MANUAL_REVIEW`, mengecualikannya dari pembuatan PO otomatis, dan mencatat log peringatan data abnormal.
    *   **JIKA** koneksi ke basis data Supabase terputus saat query dijalankan, sistem mencatat error di log dan melakukan retry hingga 3 kali dengan selang waktu 10 detik.
    *   **SELAMA** proses pemindaian berjalan, sistem mengunci sementara proses pembuatan PO baru (`lock:scan:active` di Redis dengan TTL 300 detik) untuk mencegah bentrokan data (*race condition*).

--------------------------------------------------------------------------------

##### 2. Aspek: Tampilan & Kondisi Layar
*   **Kondisi Memuat (Backend Service Logging)** :
    *   Mencatat log konsol: `"Executing Low-Stock Scanner..."`.
*   **Kondisi Ada Data (Data Found)** :
    *   Mencatat log konsol: `"Found N low-stock items"`.
    *   Mengembalikan daftar SKU kualifikasi yang siap diproses ke Generator PDF PO.
*   **Kondisi Kosong (Empty Result)** :
    *   Mencatat log konsol: `"No low-stock items detected"`.
    *   Cron job selesai tanpa tindakan tambahan.
*   **Kondisi Gagal (Error Logging)** :
    *   Mencatat log error dengan stack trace: `"Gagal terhubung ke database Supabase"`.

--------------------------------------------------------------------------------

##### 3. Aspek: Data & Validasi
*   **Kolom Data Utama** :
    *   `sku` (String, Primary Key, Required)
    *   `nama` (String, Required)
    *   `stok_saat_ini` (Integer, Required, Validasi: `>= 0`)
    *   `reorder_point` (Integer, Required, Validasi: `> 0`)
    *   `qty_min_order` (Integer, Required, Validasi: `> 0`)
    *   `id_pemasok` (Foreign Key ke tabel `pemasok`, Required)
*   **Pengurutan (Sorting)** :
    *   Diurutkan berdasarkan `id_pemasok` ASC, kemudian `sku` ASC.
*   **Format Data** :
    *   Response JSON standard envelope (`success`, `message`, `data`, `error`).

--------------------------------------------------------------------------------

##### 4. Aspek: Error & Pengecualian
*   **Layanan Lambat / Timeout (> 3 Detik)** :
    *   Query database dibatasi timeout 5 detik; jika melebihi batas, pemicu retry mekanisme dijalankan.
*   **Backend / Database Down (503 Service Unavailable)** :
    *   Sistem menangkap error koneksi database, mengembalikan status 503, dan menjalankan retry backoff 10 detik (maksimal 3 kali).
*   **Input Data Aneh / Abnormal** :
    *   JIKA stok bernilai negatif atau ROP `<= 0`, sistem tidak melempar panic/crash, melainkan mengubah status SKU menjadi `REQUIRES_MANUAL_REVIEW`.

--------------------------------------------------------------------------------

##### 5. Aspek: Hak Akses
*   **System Cron Runner & Service Account Go** :
    *   Hak akses: **Full Read & Internal Processing**.
    *   Eksekusi berjalan secara otomatis via jadwal cron atau internal API trigger.
*   **Staf Inventori & Manager** :
    *   Dapat melihat hasil deteksi SKU low-stock melalui antarmuka Dashboard.

--------------------------------------------------------------------------------

##### 6. Aspek: Jumlah Data & Kecepatan
*   **Volume Data** :
    *   Mampu memproses hingga 500 SKU dalam sekali pemindaian batch.
*   **Target Waktu & Performa** :
    *   Eksekusi query dan penyaringan kualifikasi selesai dalam waktu **< 1.5 detik**.
    *   Pengecekan Active PO per SKU selesai dalam waktu **< 100 ms** menggunakan DB Index.

--------------------------------------------------------------------------------

##### 7. Aspek: Bukan Bagian Ini (Out-of-Scope)
*   Modul ini **TIDAK** mencakup pengelompokan SKU ke dokumen PDF (ditangani oleh Fitur FRD-02).
*   Modul ini **TIDAK** mencakup pembuatan token persetujuan email (ditangani oleh Fitur FRD-03).
*   Modul ini **TIDAK** mencakup pembaruan ROP secara dinamis (*Dynamic ROP calculation*).
