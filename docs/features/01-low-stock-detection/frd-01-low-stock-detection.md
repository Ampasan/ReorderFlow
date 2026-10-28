# Functional Requirement Document (FRD): Fitur 01 - Deteksi Low-Stock

## 1. Konteks
Fitur ini bertujuan untuk memindai basis data persediaan secara otomatis dan mengidentifikasi produk (SKU) yang persediaannya telah mencapai atau berada di bawah batas aman pemesanan ulang (*Reorder Point / ROP*). Fitur ini menurunkan **Bagian 4 (Fitur 1: Deteksi Low-Stock)** dan **Bagian 7 (Prioritas 1)** dari PRD ReorderFlow.

---

## 2. Peran & Hak Akses

| Peran | Login Dashboard | Hak Lihat (Read) | Hak Buat (Create) | Hak Ubah (Update) | Hak Setujui (Approve) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **System Cron Runner** | Tidak | Seluruh data pada tabel `stok` & `po_log` | Draf entri di memori / antrean | - | - |
| **Staf Inventori / Admin** | Ya (`admin`) | Daftar SKU terdeteksi *Low-Stock* | Trigger scan (`POST /api/stok/scan`) | Nilai `stok_saat_ini` (Koreksi) | - |
| **Operations Manager** | Ya (`manager`, read-only) | Ringkasan statistik barang *Low-Stock* | - | - | - |

---

## 3. Alur Deteksi Low-Stock

* **K-01.1:** **KETIKA** *scheduled cron job* harian aktif pada jam 08.00 WIB, sistem memicu runner `detection_service.go`.
* **K-01.2:** **KETIKA** runner berjalan, sistem membaca seluruh baris pada tabel `stok` di Supabase PostgreSQL.
* **K-01.3:** **KETIKA** ditemukan baris dengan `stok_saat_ini <= reorder_point`, sistem mengecek apakah SKU tersebut memiliki PO aktif (berstatus `DRAFT` atau `SENT` dalam 7 hari terakhir) pada tabel `po_log`.
* **K-01.4:** **KETIKA** SKU tidak memiliki PO aktif, sistem memasukkan SKU tersebut ke dalam daftar *Low-Stock Valid* yang siap diproses ke tahap pembuatan PO.
* **K-01.5:** **JIKA** `stok_saat_ini < 0` ATAU `reorder_point <= 0` ATAU `qty_min_order <= 0`, sistem menandai SKU sebagai `REQUIRES_MANUAL_REVIEW` dan mengecualikannya dari daftar otomatisasi.
* **K-01.6:** **JIKA** SKU sudah memiliki PO aktif berstatus `DRAFT` atau `SENT`, sistem mengabaikan SKU tersebut untuk mencegah pemesanan ganda (*duplicate order*).
* **K-01.7:** **JIKA** koneksi ke basis data Supabase terputus saat query dijalankan, sistem mencatat error di log dan melakukan *retry* hingga 3 kali dengan selang waktu 10 detik.
* **K-01.8:** **SELAMA** proses pemindaian berjalan, sistem mengunci sementara proses pembuatan PO baru agar tidak terjadi bentrokan data (*race condition*).

---

## 4. Aturan Bisnis

| No. | Kode AB | Kondisi Pemicu | Hasil / Tindakan Sistem |
| :--- | :--- | :--- | :--- |
| 1 | AB-01.1 | `stok_saat_ini <= reorder_point` AND PO_aktif = False | SKU dimasukkan ke daftar kualifikasi *Low-Stock*. |
| 2 | AB-01.2 | `stok_saat_ini <= reorder_point` AND PO_aktif = True | SKU diabaikan (mencegah PO ganda). |
| 3 | AB-01.3 | `stok_saat_ini < 0` OR `reorder_point <= 0` OR `qty_min_order <= 0` | Set status SKU ke `REQUIRES_MANUAL_REVIEW` & log peringatan data abnormal. |
| 4 | AB-01.4 | Pemindaian menemukan 0 SKU *low-stock* | Cron job selesai tanpa tindakan dan mencatat log: "Pemindaian selesai: 0 item butuh reorder". |

---

## 5. Istilah Internal

* **Reorder Point (ROP):** Batas minimal jumlah stok di mana pemesanan ulang ke pemasok harus segera dilakukan.
* **PO Aktif:** Pesanan pembelian yang berstatus `DRAFT` atau `SENT` yang belum selesai dikirim atau dibatalkan.
* **Race Condition:** Kondisi persaingan eksekusi di mana dua proses mencoba memperbarui data stok/PO secara bersamaan.

---

## 6. Data Utama & Status

### 6.1 Data Utama (`stok`)
* `sku` (String, Primary Key)
* `nama` (String)
* `stok_saat_ini` (Integer)
* `reorder_point` (Integer)
* `qty_min_order` (Integer)
* `id_pemasok` (Foreign Key ke `pemasok`)

### 6.2 Status SKU
* `NORMAL`: Stok di atas ROP (`stok_saat_ini > reorder_point`).
* `LOW_STOCK`: Stok di bawah atau sama dengan ROP (`stok_saat_ini <= reorder_point`).
* `REQUIRES_MANUAL_REVIEW`: Anomali data (stok negatif atau ROP <= 0).

---

## 7. Daftar Fungsi & Spesifikasi 7 Aspek

Fitur ini dipecah menjadi 2 fungsi teknis utama:
1. **F-01.1: Scanner & Filter Low-Stock (Backend Engine)**
2. **F-01.2: Check Duplicate Active PO (Idempotency Filter)**

---

### Spesifikasi Fungsi F-01.1: Scanner & Filter Low-Stock

#### 1. Perilaku (Kebutuhan & AC)
* **K-F01.1a:** **KETIKA** pemicu cron aktif, fungsi mengambil seluruh SKU yang memenuhi `stok_saat_ini <= reorder_point`.
* **AC:** Given SKU `SKU-BTL-01` dengan `stok_saat_ini = 3` dan `reorder_point = 10`. When `F-01.1` mengeksekusi query, Then `SKU-BTL-01` masuk ke dalam array hasil scanner dengan jumlah order disarankan = `qty_min_order` (misal: 50 unit).

#### 2. Tampilan & Kondisi Layar
* *Backend Service (Non-UI)*: 
  * Kondisi Memuat: Log console `"Executing Low-Stock Scanner..."`.
  * Kondisi Ada Data: Log console `"Found N low-stock items"`.
  * Kondisi Kosong: Log console `"No low-stock items detected"`.
  * Kondisi Gagal: Log error dengan stack trace.

#### 3. Data & Validasi
* **Kolom Wajib:** `sku`, `stok_saat_ini`, `reorder_point`, `qty_min_order`, `id_pemasok`.
* **Validasi Tipe Data:** `stok_saat_ini` integer >= 0, `reorder_point` integer > 0.
* **Urutan Data:** Diurutkan berdasarkan `id_pemasok` ASC, `sku` ASC.

#### 4. Error
* **Kondisi Supabase Down:** Return `503 Service Unavailable`, pemicu retry mekanisme (backoff 10s).
* **Kondisi Input Aneh:** Jika stok bernilai string/null, fungsi melemparkan exception validasi data dan mengubah status ke `REQUIRES_MANUAL_REVIEW`.

#### 5. Hak Akses
* Hanya dapat dieksekusi oleh internal Service Account Go backend (Railway) dengan API Service Key Supabase.

#### 6. Jumlah Data & Kecepatan
* **Volume Data:** Mampu memproses hingga 500 SKU dalam sekali pemindaian.
* **Target Kecepatan:** Eksekusi query & penyaringan selesai dalam waktu **< 1.5 detik**.

#### 7. Bukan Bagian Ini
* Pengelompokan barang ke dokumen PDF (ditangani oleh Fitur F-02).

---

### Spesifikasi Fungsi F-01.2: Check Duplicate Active PO

#### 1. Perilaku (Kebutuhan & AC)
* **K-F01.2a:** **KETIKA** SKU lolos dari `F-01.1`, fungsi memeriksa tabel `po_log` untuk melihat apakah ada PO berstatus `DRAFT` atau `SENT` yang memuat SKU atau Pemasok terkait dalam 7 hari terakhir.
* **AC:** Given `SKU-BTL-01` sudah ada di `po_log` nomor `PO-20261025-001` dengan status `DRAFT`. When `F-01.2` memeriksa status `SKU-BTL-01`, Then fungsi mengembalikan nilai `has_active_po = true` dan mengeluarkannya dari antrean.

#### 2. Tampilan & Kondisi Layar
* *Backend Service Log*: Log penolakan `"SKU-BTL-01 skipped: Active PO exists (PO-20261025-001)"`.

#### 3. Data & Validasi
* **Filter Query:** `WHERE id_pemasok = X AND status IN ('DRAFT', 'SENT') AND created_at >= NOW() - INTERVAL '7 days'`.

#### 4. Error
* Jika Redis/Cache atau DB timeout, kembalikan nilai default safe `has_active_po = true` untuk mencegah duplikasi pesanan tak disengaja.

#### 5. Hak Akses
* Eksekusi internal backend Go.

#### 6. Jumlah Data & Kecepatan
* Pengecekan per SKU / Pemasok dilakukan dalam waktu **< 100ms** menggunakan index DB pada kolom `id_pemasok` dan `status`.

#### 7. Bukan Bagian Ini
* Pembuatan token persetujuan email (ditangani oleh Fitur F-03).

---

## 8. AC Alur Utama (Dengan Data Nyata)

* **Data Skenario:**
  * SKU A: `SKU-TEH-01`, `stok = 2`, `ROP = 5`, `min_order = 20`, Active PO = None.
  * SKU B: `SKU-TEH-02`, `stok = 1`, `ROP = 5`, `min_order = 20`, Active PO = `PO-20261024-002` (`DRAFT`).
  * SKU C: `SKU-TEH-03`, `stok = -2`, `ROP = 10`, `min_order = 10`, Active PO = None.
* **Eksekusi:**
  1. Cron memicu `F-01.1` pada pukul 08:00 WIB.
  2. `F-01.1` mendeteksi SKU A, B, C memenuhi `stok <= ROP`.
  3. `F-01.2` memeriksa SKU A: Tidak ada active PO -> **Lolos (Masuk Draf)**.
  4. `F-01.2` memeriksa SKU B: Ditemukan active PO -> **Dikeluarkan (Mencegah PO ganda)**.
  5. `F-01.1` memeriksa SKU C: Stok bernilai `-2` -> **Dikeluarkan (Status: REQUIRES_MANUAL_REVIEW)**.
* **Hasil Akhir:** Hanya SKU A (`SKU-TEH-01`) yang diteruskan ke Generator PDF PO.

---

## 9. Tidak Termasuk
* Pembaruan tingkat ROP secara otomatis (*Dynamic ROP calculation*).
* Pemrosesan langsung saat terjadi transaksi kasir POS (fitur ini khusus batch cron harian).
