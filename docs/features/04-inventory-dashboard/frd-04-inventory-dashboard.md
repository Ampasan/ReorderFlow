# Functional Requirement Document (FRD): Fitur 04 - Dashboard Monitoring Inventori & Log PO

## 1. Konteks
Fitur ini menyediakan antarmuka web berbasis React (TypeScript) untuk memantau status persediaan barang, indikator badge ROP, daftar barang low-stock, riwayat Purchase Order (PO), editor draf PO, dan koreksi stok opname. Fitur ini menurunkan Bagian 4 (Fitur 4: Monitoring Dashboard UI) dan Bagian 7 (Prioritas 4) dari PRD ReorderFlow.

---

## 2. Peran & Hak Akses

| Peran | Hak Lihat (Read) | Hak Buat (Create) | Hak Ubah (Update) | Hak Setujui (Approve) |
| :--- | :--- | :--- | :--- | :--- |
| **Staf Inventori / Procurement Admin** | Ringkasan Stok, List SKU, Log PO, File PDF, Editor Draf | Tombol scan dan "Buat Draf PO" | Opname Stok, Baris Draf PO, Kirim ke Manajer | - |
| **Operations Manager** | Ringkasan Stok, List SKU, Log PO, File PDF, Editor Draf (read-only) | - | - | Via tautan email, bukan dashboard |
| **Tamu / Public** | - | - | - | - |

---

## 3. Alur Penggunaan Dashboard

* **K-04.1:** **KETIKA** pengguna membuka dashboard, frontend memeriksa JWT di `localStorage`. Jika tidak ada atau invalid, pengguna diarahkan ke `/login`.
* **K-04.2:** **KETIKA** data berhasil diterima, dashboard menampilkan 5 kartu KPI: Total SKU, Stok Rendah, Draf PO, Menunggu Persetujuan, dan PO Terkirim. Banner low stock dan banner data abnormal muncul jika angkanya lebih dari nol.
* **K-04.3:** **KETIKA** pengguna membuka tab **Data Stok**, sistem menampilkan tabel seluruh SKU dengan tab filter Semua, Perlu Reorder, dan Perlu Peninjauan.
* **K-04.4:** **KETIKA** admin menekan **Pindai Stok** atau **Buat Draf PO**, sistem menampilkan dialog konfirmasi, menjalankan `POST /api/stok/scan`, lalu menampilkan toast hasil.
* **K-04.5:** **KETIKA** admin membuka dialog Opname, sistem menampilkan stok saat ini, input hasil opname, dan pilihan alasan. Aksi simpan memanggil `PATCH /api/stok/{sku}`.
* **K-04.6:** **KETIKA** pengguna membuka tab **Riwayat PO**, sistem menampilkan tabel PO dengan 6 filter status: Semua, Draf, Menunggu, Terkirim, Ditolak, Perlu Tinjauan.
* **K-04.7:** **KETIKA** pengguna memilih pemasok pada filter pemasok, tabel langsung menyaring PO dari pemasok tersebut. Filter ini berjalan di sisi klien dari daftar PO yang sudah dimuat.
* **K-04.8:** **KETIKA** pengguna menekan **Detail**, sistem menampilkan nomor PO, pemasok, email, status, tanggal, dan daftar barang.
* **K-04.9:** **KETIKA** pengguna menekan **Lihat PDF**, browser membuka `tautan_pdf` Supabase Storage di tab baru. Jika PDF belum tersedia, aksi ditampilkan nonaktif.
* **K-04.10:** **KETIKA** admin menekan **Edit Draf**, **Revisi**, atau **Proses Ulang**, sistem membuka `/po-log/{id}/draft`.
* **K-04.11:** **JIKA** koneksi API backend terputus, halaman menampilkan `ErrorState` dengan pesan error dan tombol "Coba Lagi".
* **K-04.12:** **JIKA** tabel kosong, halaman menampilkan `EmptyState` dengan copy sesuai filter.
* **K-04.13:** **SELAMA** data dimuat, halaman menampilkan skeleton loader pada kartu KPI dan tabel.

---

## 4. Aturan Bisnis

| No. | Kode AB | Kondisi Pemicu | Hasil / Tindakan Visual UI |
| :--- | :--- | :--- | :--- |
| 1 | AB-04.1 | `stok_saat_ini <= reorder_point` dan data valid | Badge amber **Low Stock** pada baris tabel SKU. |
| 2 | AB-04.2 | `stok_saat_ini > reorder_point` dan data valid | Badge hijau **Normal** pada baris tabel SKU. |
| 3 | AB-04.3 | `stok_saat_ini < 0` ATAU `reorder_point <= 0` ATAU `qty_min_order <= 0` | Badge ungu **Review** dan masuk tab Perlu Peninjauan. |
| 4 | AB-04.4 | Status PO = `DRAFT` | Badge cream **Draf**. |
| 5 | AB-04.5 | Status PO = `PENDING_APPROVAL` | Badge amber **Menunggu**. |
| 6 | AB-04.6 | Status PO = `SENT` | Badge dark **Terkirim**. |
| 7 | AB-04.7 | Status PO = `REJECTED` | Badge rose **Ditolak**. |
| 8 | AB-04.8 | Status PO = `REQUIRES_MANUAL_REVIEW` | Badge ungu **Review**. |
| 9 | AB-04.9 | Role `manager` membuka editor draf | Tampilan read-only, tanpa tombol simpan atau kirim. |

---

## 5. Istilah Internal

* **Badge Status:** Indikator warna komponen visual UI yang mewakili kondisi data tertentu.
* **Skeleton Loader:** Animasi placeholder yang muncul saat data sedang dimuat.
* **Empty State:** Tampilan khusus ketika tabel atau daftar tidak memuat data.
* **Editor Draf:** Halaman untuk mengubah baris barang PO sebelum dikirim ke manajer.

---

## 6. Data Utama & Status

### 6.1 Data Utama UI (DTO Response)
* `total_sku`: Integer
* `low_stock_count`: Integer
* `manual_review`: Integer
* `draft_po_count`: Integer (status `DRAFT`)
* `pending_po_count`: Integer (status `PENDING_APPROVAL`)
* `sent_po_count`: Integer (status `SENT`)
* `rejected_po_count`: Integer (status `REJECTED`)
* `stok_list`: Array of `Stok` dengan relasi `pemasok`
* `po_log_list`: Array of `POLog` dengan relasi `pemasok` dan `details`

### 6.2 Status yang Ditampilkan
* Stok: `NORMAL`, `LOW_STOCK`, `REQUIRES_MANUAL_REVIEW`.
* PO: `DRAFT`, `PENDING_APPROVAL`, `SENT`, `REJECTED`, `REQUIRES_MANUAL_REVIEW`.

---

## 7. Daftar Fungsi & Spesifikasi 7 Aspek

Fitur ini dipecah menjadi 4 fungsi UI utama:
1. **F-04.1: Inventory & Low-Stock Summary View**
2. **F-04.2: PO Log History & Document Viewer**
3. **F-04.3: PO Draft Editor**
4. **F-04.4: Stock Opname Correction**

---

### Spesifikasi Fungsi F-04.1: Inventory & Low-Stock Summary View

#### 1. Perilaku (Kebutuhan & AC)
* **K-F04.1a:** **KETIKA** komponen dimuat, fungsi mengambil daftar stok dari `/api/stok`, merender kartu statistik, dan menampilkan tabel data dengan filter tab.
* **AC:** Given 20 SKU di database (15 Normal, 5 Low Stock). When halaman Dashboard dibuka, Then Kartu KPI "Stok Rendah" bernilai `5`, dan tabel menampilkan badge amber `Low Stock` pada baris terkait.

#### 2. Tampilan & Kondisi Layar
* **Kondisi Memuat:** Skeleton kartu KPI dan `TableSkeleton`.
* **Kondisi Ada Data:** Tabel berisi kolom SKU, Produk, Stok, ROP, Min Order, Pemasok, Status, dan Aksi.
* **Kondisi Kosong:** Copy per tab: "Belum ada data inventori", "Tidak ada produk di bawah ROP", "Tidak ada produk yang perlu peninjauan".
* **Kondisi Gagal:** `ErrorState` dengan tombol "Coba Lagi".

#### 3. Data & Validasi
* **Kolom Tabel:** SKU, Nama Produk, Stok Saat Ini, Reorder Point, Min Order, Nama Pemasok, Badge Status.
* **Urutan Default:** Backend mengurutkan SKU low-stock lebih dulu, lalu `sku ASC`.
* **Filter:** `?status=all|low|manual` disimpan di URL.
* **Pagination:** Tidak tersedia. Seluruh baris yang dikembalikan API dirender.

#### 4. Error
* **Backend Off (500/503):** `ErrorState` dengan pesan dari API dan tombol "Coba Lagi".

#### 5. Hak Akses
* Dapat diakses oleh Staf Inventori dan Operations Manager. Aksi Opname hanya untuk admin.

#### 6. Jumlah Data & Kecepatan
* Mampu menampilkan hingga 200 baris data tanpa pagination.
* Target render UI **< 300 ms**.

#### 7. Bukan Bagian Ini
* Pembuatan file PDF PO (Fitur F-02).

---

### Spesifikasi Fungsi F-04.2: PO Log History & Document Viewer

#### 1. Perilaku (Kebutuhan & AC)
* **K-F04.2a:** **KETIKA** tab Riwayat PO dibuka, fungsi mengambil data dari `/api/po` dan menampilkan riwayat PO beserta status dan tautan PDF.
* **AC:** Given PO `PO-20261025-101-001` berstatus `SENT`. When tab Riwayat PO dibuka, Then baris PO menampilkan badge `Terkirim` dan tautan "Lihat PDF" yang membuka URL Supabase Storage di tab baru.

#### 2. Tampilan & Kondisi Layar
* **Kondisi Memuat:** Skeleton loader.
* **Kondisi Ada Data:** Tabel memuat Nomor PO, Pemasok, Status, Barang, Dibuat, dan Aksi.
* **Kondisi Kosong:** Copy per status, misalnya "Belum ada riwayat Purchase Order" dan "Tidak ada PO berstatus draf".
* **Filter:** 6 tab status dan filter pemasok client-side.

#### 3. Data & Validasi
* **Format Tanggal:** `DD/MM/YYYY HH:mm WIB`.
* **Format Tautan PDF:** URL HTTPS ke Supabase Storage.
* **Detail PO:** Menampilkan isi `details` dan nama barang dari `/api/stok?status=all`.

#### 4. Error
* Jika tautan PDF belum tersedia, tampilkan teks "PDF belum tersedia".
* Jika data gagal dimuat, tampilkan `ErrorState` dengan tombol "Coba Lagi".

#### 5. Hak Akses
* Dapat diakses oleh Staf Inventori dan Operations Manager. Tautan edit draf hanya untuk admin.

#### 6. Jumlah Data & Kecepatan
* Render tabel PO Log ditargetkan **< 200 ms**.

#### 7. Bukan Bagian Ini
* Pengiriman email persetujuan (Fitur F-03).
* Preview PDF di dalam aplikasi.

---

### Spesifikasi Fungsi F-04.3: PO Draft Editor

#### 1. Perilaku (Kebutuhan & AC)
* **K-F04.3a:** **KETIKA** admin membuka `/po-log/{id}/draft`, fungsi mengambil `GET /api/po-draft/{id}` dan `GET /api/stok?status=all`, lalu menampilkan baris barang yang dapat diubah.
* **AC:** Given draf berisi 3 barang. When admin mengubah qty dan menekan **Simpan Draf**, Then `PUT /api/po-draft/{id}` dipanggil dan total qty diperbarui.

#### 2. Tampilan & Kondisi Layar
* **Kondisi Memuat:** Skeleton halaman dan teks "Memuat daftar stok pemasok...".
* **Kondisi Kosong:** "Draf ini belum punya barang" dan form tambah barang.
* **Kondisi Terkunci:** Status `PENDING_APPROVAL` atau `SENT` menampilkan baris read-only dan pesan terkunci.
* **Kondisi Gagal:** `ErrorState` atau kotak `role="alert"` untuk error aksi.

#### 3. Data & Validasi
* Qty minimal 1, bilangan bulat.
* Barang yang dapat ditambahkan hanya SKU dari pemasok yang sama dan belum ada di draf.
* Tombol simpan dan kirim nonaktif jika draf kosong.
* Tidak ada validasi harga, maksimum qty, atau duplikasi SKU di UI. Duplikasi dan kepemilikan pemasok divalidasi backend.

#### 4. Error
* `400` untuk body tidak valid atau email pemasok invalid.
* `409` jika status PO tidak dapat diubah.
* `502` jika PDF gagal disiapkan.

#### 5. Hak Akses
* Admin dapat mengubah dan mengirim. Manager melihat tampilan read-only.

#### 6. Jumlah Data & Kecepatan
* Editor memuat data PO dan daftar stok secara paralel.

#### 7. Bukan Bagian Ini
* Approve/reject dari dashboard.

---

### Spesifikasi Fungsi F-04.4: Stock Opname Correction

#### 1. Perilaku (Kebutuhan & AC)
* **K-F04.4a:** **KETIKA** admin menyimpan opname, fungsi memanggil `PATCH /api/stok/{sku}` dengan `stok_saat_ini` dan `alasan`.
* **AC:** Given stok saat ini 8 dan hasil opname 6 dengan alasan `MISCOUNT`. When disimpan, Then stok menjadi 6 dan satu baris `stok_opname` tercatat.

#### 2. Tampilan & Kondisi Layar
* Dialog "Koreksi Stok Opname" berisi stok saat ini (read-only), input hasil opname, dan select alasan.
* Tombol "Batal" dan "Simpan Koreksi". Saat pending, label menjadi "Menyimpan...".

#### 3. Data & Validasi
* `stok_saat_ini` wajib bilangan bulat minimal 0.
* `alasan` wajib salah satu dari `DAMAGED`, `MISCOUNT`, `RETURN`.
* Nilai yang sama dengan stok saat ini ditolak di UI.

#### 4. Error
* `400` untuk input tidak valid.
* `404` jika SKU tidak ditemukan.

#### 5. Hak Akses
* Hanya role `admin`.

#### 6. Jumlah Data & Kecepatan
* Satu koreksi per request, tanpa bulk update.

#### 7. Bukan Bagian Ini
* Penyesuaian stok otomatis setelah PO diterima. Alur tersebut dicakup fitur terpisah pada `docs/features/06-goods-receipt/`.

---

## 8. AC Alur Utama (Dengan Data Nyata)

* **Data Skenario:**
  * Pengguna: Admin Pengadaan.
  * Data: 1 PO DRAFT (`PO-20261025-101-001`), 1 PO SENT (`PO-20261024-102-001`), 20 SKU.
* **Eksekusi:**
  1. Admin membuka aplikasi web dashboard.
  2. UI memanggil `/api/dashboard`, `/api/stok?status=low`, dan `/api/po`.
  3. Kartu KPI menampilkan Total SKU, Stok Rendah, Draf PO, Menunggu, dan Terkirim.
  4. Admin berpindah ke tab **Riwayat PO**, memfilter status `Draf`, lalu memilih pemasok.
  5. Admin menekan **Edit Draf**, mengubah qty, menyimpan, lalu menekan **Kirim ke Manajer**.
  6. Admin mengklik **Lihat PDF** pada PO berstatus `SENT`, dan tab baru browser membuka dokumen dari Supabase Storage.

---

## 9. Tidak Termasuk
* Mode gelap (*Dark Mode*) pada antarmuka dashboard.
* Grafik analisis tren prediksi penjualan 6 bulan ke depan.
* Pagination, pencarian teks, filter tanggal, dan ekspor CSV.
* Approve/reject dari dalam dashboard.
