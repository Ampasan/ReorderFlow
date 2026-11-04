# Functional Requirement Document (FRD): Fitur 06 - Penerimaan Barang (Goods Receipt)

## 1. Konteks
Fitur ini menambahkan alur penerimaan barang setelah PO berstatus `SENT`. Admin mencatat qty aktual yang datang per SKU, sistem menambah `stok_saat_ini`, dan status PO diperbarui menjadi `PARTIALLY_RECEIVED` atau `RECEIVED`. Fitur ini menurunkan F-07 pada FRD utama dan Prioritas 7 pada PRD ReorderFlow.

---

## 2. Peran & Hak Akses

| Peran | Hak Lihat (Read) | Hak Buat (Create) | Hak Ubah (Update) | Hak Setujui (Approve) |
| :--- | :--- | :--- | :--- | :--- |
| **Staf Inventori / Procurement Admin** | Konteks penerimaan per PO, riwayat penerimaan | Catat penerimaan barang | Stok dan status PO hasil penerimaan | - |
| **Operations Manager** | Status PO dan detail PO (read-only) | - | - | Via tautan email, bukan dashboard |
| **Tamu / Public** | - | - | - | - |

---

## 3. Alur Penggunaan

* **K-06.1:** **KETIKA** admin membuka Riwayat PO, tombol **Terima Barang** ditampilkan pada PO berstatus `SENT` atau `PARTIALLY_RECEIVED`.
* **K-06.2:** **KETIKA** tombol ditekan, frontend memanggil `GET /api/po-penerimaan/{id}` dan menampilkan dialog berisi jumlah order, sudah diterima, sisa, dan input qty per SKU.
* **K-06.3:** **KETIKA** admin mengisi qty, frontend memvalidasi nilai bulat pada rentang `0` sampai `sisa`.
* **K-06.4:** **KETIKA** admin menyimpan, frontend memanggil `POST /api/po-penerimaan/{id}` dengan daftar SKU dan qty.
* **K-06.5:** **SETELAH** transaksi sukses, stok bertambah, status PO dihitung ulang, cache dibersihkan, dan dialog ditutup.
* **K-06.6:** **JIKA** qty melebihi sisa atau semua baris bernilai `0`, sistem menolak dengan HTTP `400`.
* **K-06.7:** **JIKA** status PO bukan `SENT` atau `PARTIALLY_RECEIVED`, sistem menolak dengan HTTP `409`.
* **K-06.8:** **JIKA** role bukan admin, sistem menolak dengan HTTP `403`.
* **K-06.9:** **JIKA** data penerimaan gagal dimuat, dialog menampilkan pesan error tanpa menutup form.

---

## 4. Aturan Bisnis

| No. | Kode AB | Kondisi Pemicu | Hasil / Tindakan Sistem |
| :--- | :--- | :--- | :--- |
| 1 | AB-06.1 | Status PO `SENT` atau `PARTIALLY_RECEIVED` | Penerimaan diterima dan diproses dalam satu transaksi database. |
| 2 | AB-06.2 | `qty_diterima` per baris lebih dari `sisa` | Tolak request dengan HTTP `400`; stok tidak berubah. |
| 3 | AB-06.3 | Semua baris pada request bernilai `0` | Tolak request dengan HTTP `400` dan pesan minimal satu barang. |
| 4 | AB-06.4 | Semua baris mencapai `jumlah_order` setelah penerimaan | Status PO menjadi `RECEIVED`. |
| 5 | AB-06.5 | Baru sebagian baris yang mencapai `jumlah_order` | Status PO menjadi `PARTIALLY_RECEIVED`. |
| 6 | AB-06.6 | SKU pada request bukan milik PO tersebut | Tolak request dengan HTTP `400`. |
| 7 | AB-06.7 | PO `PARTIALLY_RECEIVED` saat pemindaian low-stock | SKU tetap dianggap punya PO aktif sampai status menjadi `RECEIVED`. |

---

## 5. Istilah Internal

* **Penerimaan Barang (Goods Receipt):** Pencatatan qty aktual barang yang datang per SKU pada satu PO.
* **Qty Diterima:** Jumlah unit yang benar-benar datang pada satu aksi penerimaan.
* **Sisa:** `jumlah_order` dikurangi total qty yang sudah diterima untuk SKU tersebut.
* **Status Turunan:** Status PO yang dihitung sistem dari total penerimaan, bukan dipilih manual.

---

## 6. Data Utama & Status

### 6.1 Data Utama
* `po_penerimaan`: `id`, `po_id`, `actor_id`, `created_at`.
* `po_penerimaan_detail`: `id`, `penerimaan_id`, `sku`, `qty_diterima`.
* Header dan detail ditulis dalam satu transaksi bersama update `stok.stok_saat_ini` dan `po_log.status`.

### 6.2 Status yang Ditampilkan
* PO: `SENT`, `PARTIALLY_RECEIVED`, `RECEIVED`.
* Badge `PARTIALLY_RECEIVED` memakai latar terracotta tipis dan badge `RECEIVED` memakai latar hijau.

---

## 7. Daftar Fungsi & Spesifikasi 7 Aspek

Fitur ini dipecah menjadi 2 fungsi UI utama:
1. **F-06.1: Goods Receipt Context View**
2. **F-06.2: Record Receipt Action**

---

### Spesifikasi Fungsi F-06.1: Goods Receipt Context View

#### 1. Perilaku (Kebutuhan & AC)
* **K-F06.1a:** **KETIKA** admin membuka dialog penerimaan, frontend memuat `GET /api/po-penerimaan/{id}` dan menampilkan baris per SKU.
* **AC:** Given PO `PO-20261027-103-001` berisi 10 unit `SKU-MKN-01` dan 4 unit sudah diterima. When dialog dibuka, Then baris menampilkan order `10`, diterima `4`, sisa `6`, dan input qty default `6`.

#### 2. Tampilan & Kondisi Layar
* **Kondisi Memuat:** teks "Memuat data penerimaan..." dan tombol simpan nonaktif.
* **Kondisi Ada Data:** tabel dengan kolom Barang, Order, Diterima, Sisa, Qty datang. Riwayat penerimaan tampil di bawah tabel jika ada.
* **Kondisi Kosong:** tidak berlaku karena dialog hanya dibuka untuk PO yang masih bisa menerima barang.
* **Kondisi Gagal:** pesan "Data penerimaan gagal dimuat. Tutup dialog lalu coba lagi."

#### 3. Data & Validasi
* **Sumber Data:** `GET /api/po-penerimaan/{id}`.
* **Kolom:** SKU, nama, jumlah order, sudah diterima, sisa.
* **Tanpa Pagination:** seluruh baris PO dirender.

#### 4. Error
* **404:** PO tidak ditemukan, dialog menampilkan pesan gagal.
* **Jaringan Putus:** pesan gagal dimuat, admin bisa menutup dan membuka ulang.

#### 5. Hak Akses
* `admin` dan `manager` boleh membaca. Tombol simpan hanya untuk `admin`.

#### 6. Jumlah Data & Kecepatan
* Sampai 20 baris per PO, target respons di bawah 300 ms.

#### 7. Bukan Bagian Ini
* Tidak menampilkan harga, subtotal, atau pajak.

---

### Spesifikasi Fungsi F-06.2: Record Receipt Action

#### 1. Perilaku (Kebutuhan & AC)
* **K-F06.2a:** **KETIKA** admin menyimpan penerimaan, frontend mengirim baris dengan qty lebih dari `0` ke `POST /api/po-penerimaan/{id}`.
* **AC:** Given sisa `6` dan admin mengisi `6`. When disimpan, Then stok bertambah `6`, status PO menjadi `RECEIVED`, dan dialog tertutup.

#### 2. Tampilan & Kondisi Layar
* **Kondisi Memuat:** tombol berubah menjadi "Menyimpan..." dan input nonaktif.
* **Kondisi Sukses:** toast "Penerimaan barang berhasil dicatat", dialog tertutup, badge PO dan stok ikut diperbarui.
* **Kondisi Gagal:** error per baris dan kotak `role="alert"` di atas footer.

#### 3. Data & Validasi
* **Validasi Lokal:** bilangan bulat, `0 <= qty <= sisa`, minimal satu baris lebih dari `0`.
* **Payload:** `{"items":[{"sku":"...","qty_diterima":12}]}`.
* **Validasi Backend:** SKU milik PO, tidak ada duplikat, batas sisa, status PO.

#### 4. Error
* **400:** qty melebihi sisa atau tidak ada qty lebih dari 0.
* **403:** role bukan admin.
* **409:** status PO tidak bisa menerima barang.

#### 5. Hak Akses
* Hanya `admin`. `manager` tidak melihat tombol dan mendapat `403` jika memanggil endpoint.

#### 6. Jumlah Data & Kecepatan
* Satu transaksi dengan update stok per baris, target respons di bawah 500 ms.

#### 7. Bukan Bagian Ini
* Tidak mencakup pembatalan PO sebagian, over-receipt, atau unggah bukti terima.

---

## 8. AC Alur Utama (End-to-End)

* **Data Awal:** PO `PO-20261027-103-001` berstatus `SENT`, satu baris `SKU-MKN-01` dengan `jumlah_order = 10`, stok saat ini `7`.
* **Kejadian 1:** Admin membuka `/po-log?status=SENT`, menekan **Terima Barang**. Dialog menampilkan order `10`, diterima `0`, sisa `10`.
* **Kejadian 2:** Admin mengisi `4` lalu menyimpan. Stok menjadi `11` dan status PO menjadi `PARTIALLY_RECEIVED`.
* **Kejadian 3:** Pemindaian low-stock berjalan, SKU `SKU-MKN-01` tidak menghasilkan draf PO baru karena PO masih aktif.
* **Kejadian 4:** Admin menerima sisa `6`. Stok menjadi `17` dan status PO menjadi `RECEIVED`.
* **Kejadian 5:** Pemindaian berikutnya bebas membuat draf baru untuk SKU tersebut jika stok kembali di bawah ROP.

---

## 9. Bukan Bagian Ini (Out of Scope)
* Penerimaan melebihi jumlah order (over-receipt).
* Pembatalan PO sebagian atau state "dibatalkan sebagian".
* Surat jalan, bukti terima, atau lampiran foto.
* Harga satuan, pajak, dan nilai nominal barang yang datang.
