# Functional Requirement Document (FRD): Fitur 02 - Pembuatan Draf PDF PO

## 1. Konteks
Fitur ini bertanggung jawab untuk mengambil daftar SKU *low-stock* hasil penyaringan Fitur 01, mengelompokkannya berdasarkan pemasok masing-masing, menerbitkan nomor PO unik, menyusun dokumen PDF PO resmi, serta mengunggah file PDF tersebut ke Supabase Storage. Fitur ini menurunkan **Bagian 4 (Fitur 2: Generator Draf PO PDF)** dan **Bagian 7 (Prioritas 2)** dari PRD ReorderFlow.

---

## 2. Peran & Hak Akses

| Peran | Login Dashboard | Hak Lihat (Read) | Hak Buat (Create) | Hak Ubah (Update) | Hak Setujui (Approve) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **System PDF Builder** | Tidak | Data SKU *low-stock*, Detail Pemasok | File PDF di Supabase Storage, Record `po_log` | Status PO ke `DRAFT` | - |
| **Operations Manager** | Ya (`manager`, read-only) | Dokumen PDF PO via tautan Supabase Storage | - | - | - |
| **Staf Inventori / Admin** | Ya (`admin`) | Dokumen PDF PO via Dashboard | Trigger pembuatan draf PO lewat scan | - | - |

---

## 3. Alur Pembuatan PDF PO

* **K-02.1:** **KETIKA** daftar SKU *low-stock valid* diterima dari Fitur 01, sistem mengelompokkan SKU tersebut berdasarkan `id_pemasok`.
* **K-02.2:** **KETIKA** pengelompokan per pemasok selesai, sistem menerbitkan Nomor PO Unik dengan format `PO-YYYYMMDD-[ID_PEMASOK]-[URUTAN]`.
* **K-02.3:** **KETIKA** Nomor PO terbentuk, pustaka `gofpdf` di backend Go memproses pembuatan layout dokumen PDF PO yang berisi header UMKM, tabel daftar SKU, kuantitas order (`qty_min_order`), dan kolom tanda tangan.
* **K-02.4:** **KETIKA** file PDF selesai dibuat di memori backend, sistem mengunggah file tersebut ke Supabase Storage Bucket `po-documents`.
* **K-02.5:** **KETIKA** pengunggahan sukses, sistem menyimpan metadata pesanan ke tabel `po_log` di PostgreSQL dengan `status = 'DRAFT'` dan menyimpan URL publik file PDF pada kolom `tautan_pdf`.
* **K-02.6:** **JIKA** proses pengunggahan ke Supabase Storage gagal, sistem melakukan percobaan ulang (*retry*) maksimal 3 kali sebelum mencatat log kegagalan.
* **K-02.7:** **JIKA** detail alamat email pemasok pada tabel `pemasok` tidak terisi/kosong, sistem tetap menghasilkan PDF PO tetapi menandai status `po_log` sebagai `REQUIRES_MANUAL_REVIEW`.
* **K-02.8:** **SELAMA** file PDF PO sedang diunggah ke storage, sistem memastikan nama file di-hash/diberi timestamp unik untuk mencegah penimpaan file (*file overwriting*).

---

## 4. Aturan Bisnis

| No. | Kode AB | Kondisi Pemicu | Hasil / Tindakan Sistem |
| :--- | :--- | :--- | :--- |
| 1 | AB-02.1 | SKU terdeteksi berasal dari pemasok yang sama | Gabungkan seluruh SKU tersebut dalam 1 dokumen PDF PO yang sama. |
| 2 | AB-02.2 | SKU terdeteksi berasal dari pemasok berbeda | Terbitkan dokumen PDF PO terpisah untuk masing-masing pemasok. |
| 3 | AB-02.3 | Penentuan Kuantitas Pesanan | Gunakan nilai `qty_min_order` dari tabel `stok` sebagai kuantitas default pesanan. |
| 4 | AB-02.4 | Format Nama File PDF di Storage | `PO_[NOMOR_PO]_[TIMESTAMP].pdf` disimpan di bucket `po-documents`. |

---

## 5. Istilah Internal

* **Supabase Storage Bucket:** Layanan penyimpanan file terdistribusi (S3-compatible) untuk menyimpan dokumen PDF PO secara aman.
* **gofpdf:** Pustaka (*library*) pemrograman Go yang digunakan untuk membentuk dan me-render dokumen PDF secara terprogram.
* **Tautan PDF (Public URL):** Alamat URL HTTPS statis yang dapat diakses oleh Manager atau Pemasok untuk mengunduh dokumen PO.

---

## 6. Data Utama & Status

### 6.1 Data Utama (`po_log`)
* `id` (Serial, Primary Key)
* `nomor_po` (String, Unique)
* `id_pemasok` (Foreign Key ke `pemasok`)
* `status` (String: `DRAFT`, `SENT`, `REJECTED`, `REQUIRES_MANUAL_REVIEW`)
* `tautan_pdf` (String, URL File Supabase Storage)
* `token` (String, Idempotency Approval Token)
* `created_at` (Timestamp)

---

## 7. Daftar Fungsi & Spesifikasi 7 Aspek

Fitur ini dipecah menjadi 2 fungsi teknis:
1. **F-02.1: Grouping & PO Numbering Engine**
2. **F-02.2: PDF Layout Builder & Storage Uploader**

---

### Spesifikasi Fungsi F-02.1: Grouping & PO Numbering Engine

#### 1. Perilaku (Kebutuhan & AC)
* **K-F02.1a:** **KETIKA** menerima array SKU, fungsi mengelompokkan data berdasarkan `id_pemasok` dan menerbitkan `nomor_po` unik untuk setiap grup.
* **AC:** Given 3 SKU: SKU 1 (Supplier 101), SKU 2 (Supplier 101), SKU 3 (Supplier 102). When `F-02.1` mengeksekusi pengelompokan, Then dihasilkan 2 grup PO: Group A (Supplier 101, memuat SKU 1 & 2) dengan Nomor `PO-20261025-101-001` dan Group B (Supplier 102, memuat SKU 3) dengan Nomor `PO-20261025-102-001`.

#### 2. Tampilan & Kondisi Layar
* *Backend Log*: `"Grouped 3 items into 2 PO batches"`.

#### 3. Data & Validasi
* **Format Nomor PO:** `PO-[YYYYMMDD]-[ID_PEMASOK]-[SEQUENCE_3_DIGIT]`.

#### 4. Error
* Jika terjadi bentrok nomor PO (duplicate key), fungsi secara otomatis menambah nilai *sequence* (+1) dan mencoba ulang query insert.

#### 5. Hak Akses
* Eksekusi internal Service Backend Go.

#### 6. Jumlah Data & Kecepatan
* Pengelompokan hingga 100 SKU selesai dalam waktu **< 100ms**.

#### 7. Bukan Bagian Ini
* Pembuatan fisik file PDF (ditangani F-02.2).

---

### Spesifikasi Fungsi F-02.2: PDF Layout Builder & Storage Uploader

#### 1. Perilaku (Kebutuhan & AC)
* **K-F02.2a:** **KETIKA** grup PO dibentuk, fungsi menyusun file PDF A4 menggunakan `gofpdf`, mengunggahnya ke Supabase Storage, dan mencatat `tautan_pdf` ke `po_log`.
* **AC:** Given Group A (`PO-20261025-101-001`). When `F-02.2` me-render PDF dan mengunggah ke Supabase, Then dihasilkan file `PO-20261025-101-001.pdf` dan URL `https://example.com/storage/object/public/po-documents/PO-20261025-101-001.pdf` tercatat di DB dengan `status = 'DRAFT'`.

#### 2. Tampilan & Kondisi Layar
* *Backend Log*: `"PDF generated & uploaded: PO-20261025-101-001.pdf (Size: 42 KB)"`.

#### 3. Data & Validasi
* **Struktur Dokumen PDF:** Header Perusahaan, Nomor PO & Tanggal, Tabel SKU (Kode, Nama, Qty Order), Total Item, Area Tanda Tangan Persetujuan.

#### 4. Error
* Jika upload ke Supabase Storage timeout/gagal, jalankan exponential backoff retry (3x). Jika tetap gagal, batalkan transaksi DB dan catat log error.

#### 5. Hak Akses
* Service account backend Go dengan Supabase Storage Write Permission.

#### 6. Jumlah Data & Kecepatan
* Waktu generasi PDF + Upload ke Storage: **< 2.0 detik** per dokumen PO.

#### 7. Bukan Bagian Ini
* Pengiriman email persetujuan ke Manager (ditangani Fitur F-03).

---

## 8. AC Alur Utama (Dengan Data Nyata)

* **Data Skenario:**
  * Pemasok: "PT Plastik Jaya" (ID 202).
  * Barang: `SKU-PL-01` (Botol 500ml, Qty: 100) dan `SKU-PL-02` (Tutup Botol, Qty: 100).
* **Eksekusi:**
  1. `F-02.1` menerima `SKU-PL-01` & `SKU-PL-02`.
  2. Dihasilkan nomor PO: `PO-20261025-202-001`.
  3. `F-02.2` membuat dokumen PDF berisi tabel 2 baris barang tersebut.
  4. File diunggah ke Supabase Storage: `po-documents/PO-20261025-202-001.pdf`.
  5. Record dimasukkan ke `po_log`: Status `DRAFT`, `tautan_pdf` terisi.
* **Hasil Akhir:** Dokumen Draf PDF PO siap diproses untuk permintaan persetujuan email manajer.

---

## 9. Tidak Termasuk
* Editing layout PDF secara dinamis via WYSIWYG editor di frontend React.
* Watermarking digital signature kompleks berbasis sertifikat SSL/PKI.
