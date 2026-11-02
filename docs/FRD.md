# Functional Requirement Document (FRD): ReorderFlow

## 1. Konteks
Dokumen ini merupakan Functional Requirement Document (FRD) untuk sistem **ReorderFlow**. Dokumen ini merincikan spesifikasi fungsional global, arsitektur data, alur sistem end-to-end, dan aturan bisnis utama yang menurunkan Bagian 4 (Lingkup) dan Bagian 7 (Daftar Fitur) dari PRD ReorderFlow.

Alur saat ini memakai tahap peninjauan draf: hasil pemindaian berhenti di `DRAFT`, staf inventori dapat mengoreksi baris barang, lalu mengirim draf ke manajer (`PENDING_APPROVAL`). Email persetujuan baru dikirim pada tahap pengiriman tersebut.

---

## 2. Peran & Hak Akses

| Peran | Login Dashboard | Hak Lihat (Read) | Hak Buat (Create) | Hak Ubah (Update) | Hak Setujui (Approve) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Staf Inventori / Procurement Admin** | Ya (`admin`) | Data Stok, Data Pemasok, Riwayat PO_Log, Draf PO | Draf Reorder Manual (trigger scan) | Data Stok (Koreksi Opnam), Baris Barang Draf PO, Penerimaan Barang | Tidak Boleh |
| **Operations Manager** | Ya (`manager`) | Dashboard, Data Stok, Riwayat PO_Log, Email Ringkasan | - | - | Ya (Approve / Reject PO via Email Link) |
| **System Cron / Worker** | Tidak (service account) | Pemindaian Tabel Stok & Pemasok | Record PO_Log, File PDF PO di Storage | Status PO_Log (`DRAFT` -> `PENDING_APPROVAL` -> `SENT`/`REJECTED`) | - |

Catatan: login dashboard memakai email/password dan menghasilkan JWT. Persetujuan PO tetap dilakukan lewat tautan email publik bertoken, bukan lewat sesi login. Role `manager` bersifat read-only di dashboard, termasuk pada halaman editor draf.

---

## 3. Alur Utama Sistem

### 3.1 Autentikasi & Sesi

* **K-AUTH-1.1:** **KETIKA** pengguna membuka dashboard tanpa sesi aktif, sistem mengarahkan ke halaman `/login`.
* **K-AUTH-1.2:** **KETIKA** pengguna mengirim email dan password ke `POST /api/auth/login`, sistem memverifikasi hash bcrypt dan mengembalikan JWT Bearer beserta profil pengguna.
* **K-AUTH-1.3:** **KETIKA** pengguna mengakses endpoint data tanpa header `Authorization: Bearer <token>` atau dengan token tidak valid/kedaluwarsa, sistem mengembalikan HTTP `401`.
* **K-AUTH-1.4:** **SELAMA** token berlaku, pengguna dapat mengakses `GET /api/auth/me`, `/api/stok`, `/api/dashboard`, `/api/po`, `/api/po-log`, `GET /api/po-draft/{id}`, `PUT /api/po-draft/{id}`, `POST /api/po-draft/{id}/submit`, dan `PATCH /api/stok/{sku}` sesuai role.
* **K-AUTH-1.5:** **JIKA** role `manager` memicu `POST /api/stok/scan`, `PATCH /api/stok/{sku}`, `PUT /api/po-draft/{id}`, atau `POST /api/po-draft/{id}/submit`, sistem menolak dengan HTTP `403`.
* **K-AUTH-1.6:** **SELAMA** proses persetujuan PO, endpoint `/api/po/approval` tetap publik dan hanya dilindungi token sekali pakai, tanpa memerlukan login.
* **K-AUTH-1.7:** **KETIKA** pengguna logout, frontend menghapus token dari penyimpanan dan mengarahkan kembali ke `/login`.

### 3.2 Alur Otomasi, Draf, dan Persetujuan

* **K-IND-1.1:** **KETIKA** *scheduled cron job* harian berjalan pada pukul 08:00 WIB, sistem memindai tabel `stok` untuk mengidentifikasi SKU yang memenuhi kriteria `stok_saat_ini <= reorder_point`.
* **K-IND-1.2:** **KETIKA** ditemukan SKU *low-stock* yang tidak memiliki PO aktif, sistem mengelompokkan SKU tersebut berdasarkan `id_pemasok`.
* **K-IND-1.3:** **KETIKA** pengelompokan selesai, sistem menerbitkan nomor PO unik, menghasilkan dokumen PDF draf, mengunggah file ke Supabase Storage `po-documents`, dan membuat record `PO_Log` berstatus `DRAFT`. Pada tahap ini belum ada email ke manajer maupun pemasok.
* **K-IND-1.4:** **KETIKA** admin membuka `/po-log/{id}/draft`, sistem menampilkan baris barang draf yang dapat diubah selama status `DRAFT`, `REJECTED`, atau `REQUIRES_MANUAL_REVIEW`. Perubahan disimpan lewat `PUT /api/po-draft/{id}` dan PDF draf ikut diregenerasi.
* **K-IND-1.5:** **KETIKA** admin mengirim draf lewat `POST /api/po-draft/{id}/submit`, sistem memvalidasi minimal satu barang dan email pemasok yang valid, membuat token persetujuan baru, merender PDF final, mengubah status menjadi `PENDING_APPROVAL`, lalu mengantrekan email ringkasan ke Operations Manager.
* **K-IND-1.6:** **KETIKA** Operations Manager mengklik **Approve** dan status PO masih `PENDING_APPROVAL`, sistem mengubah status menjadi `SENT` dan mengantrekan email PDF final ke pemasok.
* **K-IND-1.7:** **JIKA** Operations Manager mengklik **Reject**, sistem mengubah status menjadi `REJECTED` dan menghentikan pengiriman email ke pemasok.
* **K-IND-1.8:** **JIKA** data `stok_saat_ini < 0`, `reorder_point` kosong/nol, atau `qty_min_order` kosong/nol, sistem menandai SKU atau PO sebagai `REQUIRES_MANUAL_REVIEW` dan mencatat peringatan. **JIKA** email pemasok tidak valid saat scan, PO dibuat dengan status `REQUIRES_MANUAL_REVIEW` dan notifikasi dikirim ke manajer. **JIKA** email pemasok tidak valid saat submit, sistem menolak dengan HTTP `400` tanpa mengubah status.
* **K-IND-1.9:** **JIKA** tautan persetujuan diklik ketika status PO bukan `PENDING_APPROVAL`, sistem menampilkan halaman idempotensi. Untuk status `DRAFT`, pesan yang ditampilkan adalah PO belum diajukan ke manajer.
* **K-IND-1.10:** **JIKA** token persetujuan melewati masa berlaku 48 jam sejak `submitted_at`, sistem mengubah status PO menjadi `REQUIRES_MANUAL_REVIEW` dan menampilkan halaman tautan kedaluwarsa.
* **K-IND-1.11:** **SELAMA** status `PO_Log` bernilai `DRAFT` atau `REJECTED`, dokumen PDF tidak boleh dikirimkan ke email pemasok.
* **K-IND-1.12:** **JIKA** pengiriman email atau unggahan storage gagal, sistem menjalankan retry. Storage memakai backoff 2, 5, dan 10 detik, SMTP memakai satu retry dengan backoff 2 detik, dan query database memakai jeda 10 detik. Email diproses oleh antrean in-memory dengan 2 worker. Jika pengiriman tetap gagal, status PO diubah menjadi `REQUIRES_MANUAL_REVIEW`.
* **K-IND-1.13:** **KETIKA** admin menyimpan koreksi opname lewat `PATCH /api/stok/{sku}`, sistem memperbarui `stok_saat_ini` dan mencatat jejak audit pada tabel `stok_opname` berisi nilai sebelum, nilai sesudah, alasan, dan aktor.
* **K-IND-1.14:** **KETIKA** admin mencatat penerimaan lewat `POST /api/po-penerimaan/{id}`, sistem memvalidasi status PO `SENT` atau `PARTIALLY_RECEIVED`, memastikan setiap SKU milik PO tersebut, menambah `stok_saat_ini` sebesar qty aktual, dan mencatat header `po_penerimaan` beserta barisnya di `po_penerimaan_detail`.
* **K-IND-1.15:** **SETELAH** setiap penerimaan, sistem menghitung total qty diterima per baris. Jika semua baris sudah mencapai `jumlah_order`, status PO menjadi `RECEIVED`; jika baru sebagian, status menjadi `PARTIALLY_RECEIVED`.
* **K-IND-1.16:** **JIKA** PO tidak berstatus `SENT` atau `PARTIALLY_RECEIVED`, sistem menolak penerimaan dengan HTTP `409` tanpa mengubah stok.

---

## 4. Aturan Bisnis

| No. | Kode AB | Kondisi Pemicu | Hasil / Tindakan Sistem |
| :--- | :--- | :--- | :--- |
| 1 | AB-IND-01 | `stok_saat_ini <= reorder_point` DAN tidak ada PO aktif untuk SKU tersebut | Masukkan SKU ke daftar item yang wajib dipesan ulang (reorder). |
| 2 | AB-IND-02 | Terdapat PO aktif untuk SKU atau pemasok tersebut. Status `DRAFT`, `PENDING_APPROVAL`, `REJECTED`, dan `PARTIALLY_RECEIVED` selalu dianggap aktif. Status `SENT` dianggap aktif dalam 7 hari terakhir. | Abaikan SKU dari pemindaian otomatis untuk mencegah duplikasi PO. |
| 3 | AB-IND-03 | `stok_saat_ini < 0` ATAU `reorder_point <= 0` ATAU `qty_min_order <= 0` | Tandai baris data dengan status `REQUIRES_MANUAL_REVIEW` dan lewati pemrosesan otomatis. |
| 4 | AB-IND-04 | Email Pemasok kosong / format email tidak valid pada tabel `pemasok` | Buat PDF PO, ubah status PO menjadi `REQUIRES_MANUAL_REVIEW`, dan kirimkan notifikasi email tidak valid ke Manager. |
| 5 | AB-IND-05 | Token persetujuan diklik ketika status PO bukan `PENDING_APPROVAL` | Tampilkan halaman konfirmasi: tautan sudah pernah digunakan. Jika status `DRAFT`, tampilkan bahwa PO belum diajukan. |
| 6 | AB-IND-06 | Kegagalan koneksi SMTP / Storage / database | Storage memakai backoff 2, 5, dan 10 detik. SMTP memakai satu retry dengan backoff 2 detik. Database memakai jeda 10 detik. |
| 7 | AB-AUTH-01 | Request ke endpoint data tanpa Bearer token / token tidak valid / kedaluwarsa | Kembalikan HTTP `401` dan arahkan frontend ke `/login`. |
| 8 | AB-AUTH-02 | Role `manager` memicu endpoint khusus admin | Kembalikan HTTP `403` tanpa menjalankan aksi. |
| 9 | AB-AUTH-03 | Password salah atau email tidak terdaftar pada login | Kembalikan HTTP `401` dengan pesan generik "Email atau password salah". |
| 10 | AB-IND-07 | Submit draf tanpa barang atau email pemasok tidak valid | Kembalikan HTTP `400` dengan pesan validasi yang sesuai. |
| 11 | AB-IND-08 | Admin menyimpan koreksi opname dengan stok bulat minimal 0 dan alasan `DAMAGED`, `MISCOUNT`, atau `RETURN` | Perbarui stok dan catat baris `stok_opname`. |
| 12 | AB-IND-09 | Admin mencatat penerimaan dengan qty per SKU di rentang `0` sampai `sisa`, dan minimal satu baris lebih dari 0 | Tambah stok sesuai qty aktual, catat `po_penerimaan`, lalu perbarui status PO. |
| 13 | AB-IND-10 | PO berstatus `PARTIALLY_RECEIVED` saat pemindaian low-stock berjalan | Anggap PO masih aktif sehingga SKU tersebut tidak memicu draf PO baru sampai sisa kiriman diterima penuh. |

---

## 5. Istilah Internal

* **ROP (Reorder Point):** Ambang batas minimum jumlah stok yang memicu pembuatan pesanan ulang otomatis.
* **PO (Purchase Order):** Dokumen resmi pemesanan barang dari pembeli (UMKM) kepada pemasok/vendor.
* **Draf PO:** Record PO berstatus `DRAFT` yang masih dapat diperiksa dan diubah admin. Belum ada email yang dikirim.
* **PENDING_APPROVAL:** Status PO yang sudah dikirim admin ke manajer dan menunggu keputusan lewat tautan email.
* **Idempotency Token:** Kode unik acak 32 karakter heksadesimal sekali pakai yang digunakan pada tautan persetujuan email.
* **Human-in-the-Loop:** Skema alur kerja di mana sistem otomatis menyiapkan draf dan keputusan akhir pengiriman tetap berada di tangan manusia (Operations Manager).
* **PO Aktif:** Record PO berstatus `DRAFT`, `PENDING_APPROVAL`, `REJECTED`, atau `PARTIALLY_RECEIVED`, serta `SENT` yang dibuat dalam 7 hari terakhir.
* **Penerimaan Barang (Goods Receipt):** Pencatatan qty aktual barang yang datang per SKU pada PO berstatus `SENT` atau `PARTIALLY_RECEIVED`, yang menambah stok dan memperbarui status PO.
* **Stok Opname:** Koreksi stok manual oleh admin disertai alasan dan jejak audit.

---

## 6. Data Utama & Status

### 6.1 Data Utama
1. **`stok`**: Menampung katalog SKU, jumlah persediaan, ROP, minimum order, dan relasi pemasok.
2. **`pemasok`**: Menyimpan master data vendor/pemasok dan alamat email resmi.
3. **`po_log`**: Mencatat riwayat penerbitan PO, nomor PO, status, tautan dokumen PDF, token persetujuan, dan `submitted_at`.
4. **`po_detail`**: Menyimpan baris barang per PO (`sku`, `jumlah_order`).
5. **`users`**: Menyimpan akun login dashboard (`email`, `password_hash` bcrypt, `nama`, `role`).
6. **`stok_opname`**: Menyimpan jejak audit koreksi stok (`stok_sebelum`, `stok_sesudah`, `alasan`, `actor_id`).
7. **`po_penerimaan`**: Header satu aksi penerimaan barang (`po_id`, `actor_id`, `created_at`).
8. **`po_penerimaan_detail`**: Baris qty aktual yang datang per SKU pada satu penerimaan (`penerimaan_id`, `sku`, `qty_diterima`).

### 6.2 Status PO (POStatus Lifecycle)
```text
[Scan] --> DRAFT --(Admin Kirim ke Manajer)--> PENDING_APPROVAL
                                                    |
                                    (Manager Approve) --> SENT
                                    (Manager Reject)  --> REJECTED
                                    (Token 48 jam)    --> REQUIRES_MANUAL_REVIEW
                                    (Gagal kirim)     --> REQUIRES_MANUAL_REVIEW
REJECTED / REQUIRES_MANUAL_REVIEW --(Admin edit + kirim ulang)--> PENDING_APPROVAL
SENT --(Admin catat penerimaan sebagian)--> PARTIALLY_RECEIVED
SENT --(Admin catat penerimaan penuh)--> RECEIVED
PARTIALLY_RECEIVED --(Admin catat sisa kiriman)--> RECEIVED
```

---

## 7. Daftar Fungsi Utama

1. **F-01 (Deteksi Low-Stock):** Memindai dan menyaring SKU yang memenuhi kriteria ROP tanpa duplikasi.
2. **F-02 (PDF PO Generator):** Mengelompokkan SKU per pemasok, menghitung total pesanan, membuat draf PDF berstatus `DRAFT`, dan mengunggahnya ke Supabase Storage.
3. **F-03 (Editor Draf & Persetujuan Email):** Memungkinkan admin mengubah baris draf, mengirim draf ke manajer sebagai `PENDING_APPROVAL`, memproses Approve/Reject, dan meneruskan PO ke pemasok.
4. **F-04 (Dashboard UI Monitoring):** Menyajikan visibilitas data stok, indikator badge ROP, tabel riwayat PO, filter status dan pemasok, serta detail PO.
5. **F-05 (Autentikasi & Kontrol Akses):** Login JWT untuk admin dan manager, proteksi endpoint data, serta pembatasan aksi tulis berdasarkan role.
6. **F-06 (Koreksi Stok Opname):** Koreksi stok oleh admin dengan alasan dan jejak audit.
7. **F-07 (Penerimaan Barang):** Admin mencatat qty aktual yang datang per SKU (boleh bertahap), sistem menambah stok dan memperbarui status PO menjadi `PARTIALLY_RECEIVED` atau `RECEIVED`.

---

## 8. AC Alur Utama (End-to-End dengan Data Nyata)

### Skenario Uji End-to-End:
* **Data Awal:**
  * SKU: `SKU-KOP-01` ("Kopi Arabika 250g"), `stok_saat_ini = 5`, `reorder_point = 10`, `qty_min_order = 20`, `id_pemasok = 101`.
  * Pemasok ID `101`: "PT Kopi Nusantara", email: `supplier@example.com`.
  * Operations Manager: `manager@example.com`.
* **Kejadian 0 (Login Admin):**
  * Admin membuka `/login`, mengirim email/password, lalu menerima JWT dan diarahkan ke dashboard.
* **Kejadian 1 (Pukul 08.00 WIB):**
  * Cron job terpicu. Sistem mendeteksi `SKU-KOP-01` (`stok_saat_ini 5 <= ROP 10`) dan tidak ada PO aktif.
* **Kejadian 2 (Sistem Eksekusi):**
  * Sistem membuat nomor PO: `PO-20261025-101-001`.
  * File PDF draf diterbitkan dan diunggah ke Supabase Storage: `https://example.com/po-documents/PO-20261025-101-001.pdf`.
  * Record `po_log` tersimpan dengan status `DRAFT`. Belum ada email terkirim.
* **Kejadian 3 (Admin Meninjau Draf):**
  * Admin membuka `/po-log/1001/draft`, menyesuaikan jumlah order, lalu menekan **Kirim ke Manajer**.
  * Backend membuat token `token_sample123`, merender PDF final, mengubah status menjadi `PENDING_APPROVAL`, dan mengirim email ke `manager@example.com` dengan tombol **Approve**: `https://example.com/api/po/approval?token=token_sample123&action=approve`.
* **Kejadian 4 (Aksi Manager):**
  * Manager mengklik **Approve** pada pukul 08:15 WIB.
  * Backend Go memverifikasi `token_sample123`, mengubah status `po_log` menjadi `SENT`, dan mengantrekan email berisi lampiran PDF ke `supplier@example.com`.
* **Kejadian 5 (Verifikasi Idempotency):**
  * Manager mengklik kembali tombol **Approve** pada pukul 08:20 WIB.
  * Sistem merespon dengan halaman konfirmasi: "Tautan persetujuan ini sudah pernah digunakan sebelumnya (Status: SENT)."
* **Kejadian 6 (Barang Datang dan Dicatat Admin):**
  * Pukul 13:00 WIB barang tiba, tetapi hanya 12 dari 20 unit yang dikirim pemasok.
  * Admin membuka `/po-log?status=SENT`, menekan **Terima Barang**, dan mengisi qty datang `12` untuk `SKU-KOP-01`.
  * `POST /api/po-penerimaan/1001` menambah `stok_saat_ini` dari 5 menjadi 17 dan mengubah status PO menjadi `PARTIALLY_RECEIVED`.
  * Saat sisa 8 unit datang, admin mencatatnya lagi. Stok menjadi 25 dan status PO menjadi `RECEIVED`, sehingga SKU tersebut tidak lagi dianggap memiliki PO aktif.

---

## 9. Tidak Termasuk (Out of Scope)
* Pembatalan PO secara sebagian setelah barang datang kurang dari jumlah order. Kekurangan kiriman diselesaikan lewat koreksi stok opname manual oleh admin.
* Pengiriman notifikasi persetujuan via WhatsApp / SMS API.
* Integrasi otomatisasi pembayaran atau pencatatan utang usaha (*Accounts Payable*).
* SSO, MFA/2FA, login sosial, dan alur reset password via email.
* Manajemen pengguna (tambah/ubah/hapus akun) dari dashboard; akun dibuat dari environment variable saat startup.
* Harga satuan, subtotal, pajak, dan total nominal pada PO. Saat ini hanya kuantitas yang dihitung.
