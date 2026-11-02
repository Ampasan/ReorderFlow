### Requirements Spec: FRD-04 Inventory Dashboard UI (ReorderFlow)

--------------------------------------------------------------------------------

##### 1. Aspek: Perilaku (Kebutuhan & AC)
*   **K-4.0 (Autentikasi Dashboard)** : KETIKA pengguna membuka halaman dashboard, antarmuka memeriksa JWT di `localStorage`. Jika tidak ada atau sudah kedaluwarsa, pengguna diarahkan ke `/login`.
    *   **AC-4.0.1** : Login sukses menyimpan JWT dan menampilkan dashboard sesuai role (`admin` / `manager`).
    *   **AC-4.0.2** : Setiap request data mengirim header `Authorization: Bearer <token>`; respons `401` menghapus sesi dan redirect ke `/login`.
*   **K-4.1 (Pemuatan Kartu KPI Ringkasan)** : KETIKA pengguna membuka Dashboard, antarmuka mengirim request `GET /api/dashboard`, `GET /api/stok?status=low`, dan `GET /api/po`.
    *   **AC-4.1.1** : Dashboard merender 5 Kartu KPI: Total SKU, Stok Rendah, Draf PO (`DRAFT`), Menunggu Persetujuan (`PENDING_APPROVAL`), dan PO Terkirim (`SENT`).
    *   **AC-4.1.2** : Banner low stock dan banner data abnormal muncul hanya jika angkanya lebih dari nol.
*   **K-4.2 (Tabel Data Stok & Badge ROP)** : KETIKA pengguna membuka tab **Data Stok**, sistem menampilkan tabel seluruh SKU dengan tab Semua, Perlu Reorder, dan Perlu Peninjauan.
    *   **AC-4.2.1** : SKU dengan `stok_saat_ini <= reorder_point` dan data valid menampilkan badge amber `Low Stock`. SKU aman menampilkan badge hijau `Normal`.
    *   **AC-4.2.2** : SKU dengan stok negatif atau ROP/min order tidak valid menampilkan badge ungu `Review`.
*   **K-4.3 (Koreksi Stok Opname)** : KETIKA admin menyimpan opname, antarmuka memanggil `PATCH /api/stok/{sku}` dengan `stok_saat_ini` dan `alasan`.
    *   **AC-4.3.1** : Stok tabel diperbarui dan dialog ditutup setelah respons sukses.
*   **K-4.4 (Tabel Riwayat PO & File Viewer)** : KETIKA pengguna membuka tab **Riwayat PO**, sistem menampilkan tabel PO dengan 6 filter status dan tautan "Lihat PDF".
    *   **AC-4.4.1** : Mengklik "Lihat PDF" membuka URL Supabase Storage di tab browser baru.
    *   **AC-4.4.2** : Filter pemasok menyaring tabel di sisi klien berdasarkan daftar PO yang sudah dimuat.
*   **K-4.5 (Detail PO)** : KETIKA pengguna menekan **Detail**, sistem menampilkan nomor PO, pemasok, email, status, tanggal, dan daftar barang.
*   **K-4.6 (Editor Draf PO)** : KETIKA admin membuka `/po-log/{id}/draft`, sistem memuat `GET /api/po-draft/{id}` dan daftar stok, lalu menampilkan baris barang editable.
    *   **AC-4.6.1** : Admin dapat mengubah qty, menghapus barang, menambah barang dari pemasok yang sama, menyimpan draf (`PUT`), dan mengirim ke manajer (`POST /submit`).
    *   **AC-4.6.2** : Role `manager` melihat tampilan read-only tanpa tombol simpan atau kirim.
    *   **AC-4.6.3** : Status `PENDING_APPROVAL` dan `SENT` menampilkan tampilan terkunci.
*   **Pengecualian & Batasan (JIKA / SELAMA)** :
    *   **JIKA** koneksi API backend terputus, halaman menampilkan `ErrorState` dengan pesan error dan tombol "Coba Lagi".
    *   **JIKA** tabel data stok atau PO kosong, halaman menampilkan `EmptyState` dengan copy sesuai filter.
    *   **SELAMA** data sedang dimuat, halaman menampilkan skeleton loader pada tabel dan kartu KPI.

--------------------------------------------------------------------------------

##### 2. Aspek: Tampilan & Kondisi Layar
*   **Kondisi Memuat (Loading)** :
    *   5 box skeleton pada Kartu KPI dan `TableSkeleton` pada area tabel.
*   **Kondisi Ada Data (Success / Data Available)** :
    *   Layout responsif: sidebar di kiri dan konten di kanan. Pada mobile, sidebar menjadi drawer dan top bar menampilkan tombol menu.
    *   Badge aktual: hijau `Normal`, amber `Low Stock`, ungu `Review`, cream `Draf`, amber `Menunggu`, dark `Terkirim`, rose `Ditolak`.
*   **Kondisi Kosong (Empty State)** :
    *   Copy per konteks, misalnya "Belum ada data inventori", "Tidak ada produk di bawah ROP", "Belum ada riwayat Purchase Order".
*   **Kondisi Gagal (Error Fallback)** :
    *   `ErrorState` dengan pesan "Gagal memuat data dari server" dan tombol "Coba Lagi".

--------------------------------------------------------------------------------

##### 3. Aspek: Data & Validasi
*   **Kolom Tabel Data Stok** :
    *   SKU, Produk, Stok, ROP, Min Order, Pemasok, Status, Aksi.
*   **Kolom Tabel Riwayat PO** :
    *   Nomor PO, Pemasok, Status, Barang, Dibuat (`DD/MM/YYYY HH:mm WIB`), Aksi.
*   **Pengurutan (Sorting)** :
    *   Tabel Stok: backend mengurutkan SKU low-stock lebih dulu, lalu `sku ASC`.
    *   Tabel PO: backend mengurutkan `created_at DESC`.
*   **Pagination** :
    *   Tidak tersedia. Seluruh baris yang dikembalikan API dirender.
*   **Penyimpanan Sesi** :
    *   `localStorage` dengan kunci `reorderflow.token` dan `reorderflow.user`.

--------------------------------------------------------------------------------

##### 4. Aspek: Error & Pengecualian
*   **Backend Off / 500 Server Error** :
    *   `ErrorState` muncul tanpa membuat aplikasi React crash.
*   **401 Unauthorized (Token Kosong / Kedaluwarsa)** :
    *   Sesi dihapus dan pengguna diarahkan ke `/login`.
*   **403 Forbidden (Role Tidak Cukup)** :
    *   Toast "Anda tidak memiliki akses untuk aksi ini". Tombol khusus admin tidak dirender untuk manager.
*   **Tautan PDF Belum Tersedia** :
    *   Aksi "Lihat PDF" tidak ditampilkan atau diganti teks "PDF belum tersedia".

--------------------------------------------------------------------------------

##### 5. Aspek: Hak Akses
*   **Staf Inventori / Procurement Admin (`admin`)** :
    *   Login wajib. Dapat melihat dashboard, tabel SKU, riwayat PO, mengunduh PDF, memicu scan, menyimpan opname, mengedit draf, dan mengirim draf ke manajer.
*   **Operations Manager (`manager`)** :
    *   Login wajib. Hak akses read-only: dashboard, tabel SKU, riwayat PO, detail, dan PDF. Editor draf tampil read-only.

--------------------------------------------------------------------------------

##### 6. Aspek: Jumlah Data & Kecepatan
*   **Volume Data** :
    *   Mampu menampilkan hingga 200 baris data stok dan log PO tanpa pagination.
*   **Target Waktu & Performa** :
    *   Render time UI Frontend React: **< 300 ms**.
    *   First Contentful Paint (FCP): **< 1.0 detik**.

--------------------------------------------------------------------------------

##### 7. Aspek: Bukan Bagian Ini (Out-of-Scope)
*   Modul ini **TIDAK** mencakup grafik analisis tren penjualan 6 bulan ke depan.
*   Modul ini **TIDAK** mencakup Dark Mode toggle switcher.
*   Modul ini **TIDAK** mencakup pagination, pencarian teks, filter tanggal, ekspor CSV, atau approve/reject dari dashboard.
