### Requirements Spec: FRD-04 Inventory Dashboard UI (ReorderFlow)

--------------------------------------------------------------------------------

##### 1. Aspek: Perilaku (Kebutuhan & AC)
*   **K-4.1 (Pemuatan Kartu KPI Ringkasan)** : KETIKA pengguna membuka halaman Dashboard di browser, antarmuka mengirimkan request HTTP GET ke `/api/stok` dan `/api/po` untuk memuat statistik ringkasan.
    *   **AC-4.1.1** : Dashboard merender 4 Kartu KPI: Total SKU, Jumlah Low Stock, Pending PO (DRAFT), dan PO Terkirim (SENT).
*   **K-4.2 (Tabel Data Stok & Badge ROP)** : KETIKA pengguna membuka tab **Data Stok**, sistem menampilkan tabel seluruh SKU lengkap dengan status badge visual.
    *   **AC-4.2.1** : SKU dengan `stok_saat_ini <= reorder_point` menampilkan Badge Merah `LOW STOCK`. SKU dengan stok aman menampilkan Badge Hijau `NORMAL`.
*   **K-4.3 (Tabel Riwayat PO & File Viewer)** : KETIKA pengguna membuka tab **Riwayat PO**, sistem menampilkan tabel riwayat seluruh PO beserta tombol tautan "Lihat PDF".
    *   **AC-4.3.1** : Mengklik tombol "Lihat PDF" membuka URL Supabase Storage file PDF PO di tab browser baru.
*   **Pengecualian & Batasan (JIKA / SELAMA)** :
    *   **JIKA** koneksi API backend Go ke frontend terputus, dashboard menampilkan komponen *Error State* dengan banner alert merah dan tombol "Coba Lagi" (*Retry*).
    *   **JIKA** tabel data stok atau PO kosong, dashboard menampilkan komponen *Empty State* dengan ilustrasi dan pesan "Belum ada data inventori / PO".
    *   **SELAMA** data sedang diunduh (*fetching*) dari API, dashboard wajib menampilkan komponen *Skeleton Loader* berdenyut pada tabel dan kartu KPI.

--------------------------------------------------------------------------------

##### 2. Aspek: Tampilan & Kondisi Layar
*   **Kondisi Memuat (Loading)** :
    *   Menampilkan 4 box Skeleton Loader pada Kartu KPI dan 5 baris `TableSkeleton` berdenyut pada area tabel.
*   **Kondisi Ada Data (Success / Data Available)** :
    *   Layout responsif: Sidebar Navigasi di sisi kiri, Header Banner di atas, dan Konten Tabel di tengah.
    *   Color-coded Badges: Merah (`LOW STOCK`), Hijau (`NORMAL` / `SENT`), Kuning (`DRAFT`), Ungu (`REVIEW NEEDED`).
*   **Kondisi Kosong (Empty State)** :
    *   Menampilkan komponen `EmptyState` dengan pesan "Belum ada data inventori/PO".
*   **Kondisi Gagal (Error Fallback)** :
    *   Menampilkan Banner Alert Merah: `"Gagal mengambil data dari server. Silakan periksa koneksi Anda."` dengan tombol "Muat Ulang".

--------------------------------------------------------------------------------

##### 3. Aspek: Data & Validasi
*   **Kolom Tabel Data Stok** :
    *   SKU, Nama Produk, Stok Saat Ini, Reorder Point, Min Order, Nama Pemasok, Badge Status.
*   **Kolom Tabel Riwayat PO** :
    *   Nomor PO, Nama Pemasok, Status PO, Tanggal Dibuat (`DD/MM/YYYY HH:mm WIB`), Tautan PDF.
*   **Pengurutan (Sorting)** :
    *   Default Tabel Stok: Item `LOW STOCK` diurutkan paling atas (`stok_saat_ini <= reorder_point` DESC).
    *   Default Tabel PO: Diurutkan berdasarkan `created_at` DESC (terbaru terlebih dahulu).

--------------------------------------------------------------------------------

##### 4. Aspek: Error & Pengecualian
*   **Backend Off / 500 Server Error** :
    *   Frontend menangkap error via Axios Interceptor dan memunculkan notifikasi Toast Error tanpa menyebabkan aplikasi React crash.
*   **Tautan PDF Broken (404 Not Found)** :
    *   JIKA URL PDF tidak ditemukan, munculkan toast "File PDF tidak ditemukan di Supabase Storage".

--------------------------------------------------------------------------------

##### 5. Aspek: Hak Akses
*   **Staf Inventori & Operations Manager** :
    *   Hak akses: **Read-Only Dashboard View** (Dapat melihat ringkasan stok, tabel SKU, riwayat PO, dan mengunduh PDF).

--------------------------------------------------------------------------------

##### 6. Aspek: Jumlah Data & Kecepatan
*   **Volume Data** :
    *   Mampu menampilkan hingga 200 baris data stok dan log PO tanpa penurunan performa.
*   **Target Waktu & Performa** :
    *   Render time UI Frontend React: **< 300 ms**.
    *   First Contentful Paint (FCP): **< 1.0 detik**.

--------------------------------------------------------------------------------

##### 7. Aspek: Bukan Bagian Ini (Out-of-Scope)
*   Modul ini **TIDAK** mencakup grafik analisis tren penjualan 6 bulan ke depan.
*   Modul ini **TIDAK** mencakup Dark Mode toggle switcher.
