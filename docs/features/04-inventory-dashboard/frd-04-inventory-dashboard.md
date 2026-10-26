# Functional Requirement Document (FRD): Fitur 04 - Dashboard Monitoring Inventori & Log PO

## 1. Konteks
Fitur ini menyediakan antarmuka web antarmuka pengguna (*user interface*) berbasis React (TypeScript) untuk memantau status persediaan barang, indikator *badge* ROP, daftar barang *low-stock*, serta riwayat dan status pengiriman *Purchase Order* (PO). Fitur ini menurunkan Bagian 4 (Fitur 4: Monitoring Dashboard UI) dan Bagian 7 (Prioritas 4) dari PRD ReorderFlow.

---

## 2. Peran & Hak Akses

| Peran | Hak Lihat (Read) | Hak Buat (Create) | Hak Ubah (Update) | Hak Setujui (Approve) |
| :--- | :--- | :--- | :--- | :--- |
| **Staf Inventori / Admin** | Ringkasan Stok, List SKU, Log PO, File PDF | Tombol Reorder Manual | Input Opnam Stok | - |
| **Operations Manager** | Ringkasan Stok, List SKU, Log PO, File PDF | - | - | - |
| **Tamu / Public** | - | - | - | - |

---

## 3. Alur Penggunaan Dashboard

* **K-04.1:** **KETIKA** pengguna membuka URL dashboard di browser, antarmuka mengirimkan request HTTP GET ke backend Go untuk mengambil data stok dan log PO.
* **K-04.2:** **KETIKA** data berhasil diterima, dashboard menampilkan ringkasan kartu KPI (Total SKU, Jumlah SKU *Low-Stock*, PO Pending `DRAFT`, PO Terkirim `SENT`).
* **K-04.3:** **KETIKA** pengguna mengklik tab **Data Stok**, sistem menampilkan tabel seluruh SKU lengkap dengan status *badge* visual (`NORMAL` hijau, `LOW_STOCK` merah/kuning, `REQUIRES_MANUAL_REVIEW` ungu).
* **K-04.4:** **KETIKA** pengguna mengklik tab **Riwayat PO**, sistem menampilkan tabel riwayat seluruh PO beserta tautan unduh/lihat dokumen PDF.
* **K-04.5:** **KETIKA** pengguna mengklik tombol **Unduh PDF** pada baris PO, browser membuka file PDF dari Supabase Storage di tab baru.
* **K-04.6:** **JIKA** koneksi API backend Go ke frontend terputus/down, dashboard menampilkan komponen *Error State* dengan tombol "Coba Lagi" (*Retry*).
* **K-04.7:** **JIKA** tabel data stok atau PO kosong, dashboard menampilkan komponen *Empty State* dengan ilustrasi dan keterangan yang sesuai.
* **K-04.8:** **SELAMA** data sedang diunduh (*fetching*) dari API, dashboard menampilkan komponen *Skeleton Loader* pada tabel dan kartu KPI.

---

## 4. Aturan Bisnis

| No. | Kode AB | Kondisi Pemicu | Hasil / Tindakan Visual UI |
| :--- | :--- | :--- | :--- |
| 1 | AB-04.1 | `stok_saat_ini <= reorder_point` | Tampilkan *Badge* Merah **LOW STOCK** pada baris tabel SKU. |
| 2 | AB-04.2 | `stok_saat_ini > reorder_point` | Tampilkan *Badge* Hijau **NORMAL** pada baris tabel SKU. |
| 3 | AB-04.3 | Status PO = `DRAFT` | Tampilkan *Badge* Kuning **DRAFT** pada tabel PO Log. |
| 4 | AB-04.4 | Status PO = `SENT` | Tampilkan *Badge* Hijau **SENT** pada tabel PO Log. |
| 5 | AB-04.5 | Status PO = `REJECTED` | Tampilkan *Badge* Merah **REJECTED** pada tabel PO Log. |
| 6 | AB-04.6 | Status PO = `REQUIRES_MANUAL_REVIEW` | Tampilkan *Badge* Ungu **REVIEW NEEDED** pada tabel PO Log. |

---

## 5. Istilah Internal

* **Badge Status:** Indikator warna komponen visual UI yang mewakili kondisi data tertentu (misal: Merah = Kritis, Hijau = Aman).
* **Skeleton Loader:** Animasi placeholder berbentuk kotak abu-abu yang muncul saat data sedang dimuat dari server backend.
* **Empty State:** Tampilan antarmuka khusus yang dimunculkan ketika suatu tabel atau daftar tidak memuat data sama sekali.

---

## 6. Data Utama & Status

### 6.1 Data Utama UI (DTO Response)
* `total_sku`: Integer
* `low_stock_count`: Integer
* `pending_po_count`: Integer
* `stok_list`: Array of `Stok`
* `po_log_list`: Array of `POLog`

---

## 7. Daftar Fungsi & Spesifikasi 7 Aspek

Fitur ini dipecah menjadi 2 fungsi UI utama:
1. **F-04.1: Inventory & Low-Stock Summary View (Table & Cards)**
2. **F-04.2: PO Log History & Document Viewer**

---

### Spesifikasi Fungsi F-04.1: Inventory & Low-Stock Summary View

#### 1. Perilaku (Kebutuhan & AC)
* **K-F04.1a:** **KETIKA** komponen dimuat, fungsi mengambil daftar stok dari `/api/stok`, merender kartu statistik, dan menampilkan tabel data dengan pagination/filtering.
* **AC:** Given 20 SKU di database (15 Normal, 5 Low Stock). When halaman Dashboard dibuka, Then Kartu KPI "Stok Rendah" bernilai `5`, dan 5 baris pertama pada tabel menampilkan *Badge* Merah `LOW STOCK`.

#### 2. Tampilan & Kondisi Layar
* **Kondisi Memuat:** Tampilkan `TableSkeleton` (5 baris skeleton).
* **Kondisi Ada Data:** Tabel berisi kolom (SKU, Nama Barang, Stok Saat Ini, ROP, Min. Order, Pemasok, Status).
* **Kondisi Kosong:** Komponen `EmptyState` dengan pesan "Belum ada data inventori".
* **Kondisi Gagal:** Toast error "Gagal mengambil data stok" + Tombol Reload.

#### 3. Data & Validasi
* **Kolom Tabel:** SKU, Nama Produk, Stok Saat Ini, Reorder Point, Min Order, Nama Pemasok, Badge Status.
* **Urutan Default:** Sort berdasarkan `stok_saat_ini <= reorder_point` DESC (Low stock di paling atas).

#### 4. Error
* **Backend Off (500/503):** Tangkap error via Axios Interceptor, tampilkan komponen fallback error UI tanpa membuat aplikasi crash.

#### 5. Hak Akses
* Dapat diakses oleh Staf Inventori dan Operations Manager.

#### 6. Jumlah Data & Kecepatan
* Mampu menampilkan hingga 200 baris data tanpa lag (Render time UI **< 300ms**).

#### 7. Bukan Bagian Ini
* Pembuatan file PDF PO (Fitur F-02).

---

### Spesifikasi Fungsi F-04.2: PO Log History & Document Viewer

#### 1. Perilaku (Kebutuhan & AC)
* **K-F04.2a:** **KETIKA** tab PO Log dibuka, fungsi mengambil data dari `/api/po-log` dan menampilkan riwayat penerbitan PO beserta tombol tautan PDF.
* **AC:** Given PO `PO-20261025-101-001` berstatus `SENT`. When tab PO Log dibuka, Then baris PO tersebut menampilkan Badge Hijau `SENT` dan tombol "Lihat PDF" yang ketika diklik membuka URL Supabase Storage di tab baru.

#### 2. Tampilan & Kondisi Layar
* **Kondisi Memuat:** Tampilkan Skeleton Loader.
* **Kondisi Ada Data:** Tabel memuat Nomor PO, Nama Pemasok, Status, Tanggal Dibuat, Tautan Dokumen PDF.
* **Kondisi Kosong:** Pesan "Belum ada riwayat Purchase Order".

#### 3. Data & Validasi
* **Format Tanggal:** DD/MM/YYYY HH:mm WIB (misal: 25/10/2026 08:15 WIB).
* **Format Tautan PDF:** URL HTTPS valid yang mengarah ke Supabase Storage.

#### 4. Error
* Jika tautan PDF rusak (404), tampilkan notifikasi toast "File PDF tidak ditemukan di storage".

#### 5. Hak Akses
* Dapat diakses oleh Staf Inventori dan Operations Manager.

#### 6. Jumlah Data & Kecepatan
* Render tabel PO Log selesai dalam waktu **< 200ms**.

#### 7. Bukan Bagian Ini
* Pengiriman email persetujuan (Fitur F-03).

---

## 8. AC Alur Utama (Dengan Data Nyata)

* **Data Skenario:**
  * Pengguna: Admin Pengadaan.
  * Data: 1 PO DRAFT (`PO-20261025-101-001`), 1 PO SENT (`PO-20261024-102-001`).
* **Eksekusi:**
  1. Admin membuka aplikasi web dashboard.
  2. UI memanggil API `/api/stok` & `/api/po-log`.
  3. Kartu KPI menampilkan: `Total SKU: 20`, `Stok Rendah: 3`, `PO Pending: 1`.
  4. Admin berpindah ke tab **Riwayat PO**.
  5. Admin mengklik tombol **Lihat PDF** pada `PO-20261025-101-001`.
  6. Tab baru browser terbuka menampilkan dokumen PDF PO berstatus DRAFT dari Supabase Storage.

---

## 9. Tidak Termasuk
* Mode gelap (*Dark Mode*) pada antarmuka dashboard.
* Grafik analisis tren prediksi penjualan 6 bulan ke depan.
