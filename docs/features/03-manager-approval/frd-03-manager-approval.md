# Functional Requirement Document (FRD): Fitur 03 - Persetujuan Manajer & Email Workflow

## 1. Konteks

Fitur ini mengelola alur persetujuan pemesanan ulang (*Human-in-the-Loop*) setelah admin meninjau draf. PO hasil pemindaian berhenti di status `DRAFT` dan belum mengirim email ke siapa pun. Admin dapat mengubah baris barang, lalu menekan **Kirim ke Manajer**, yang mengubah status menjadi `PENDING_APPROVAL` dan mengirim email persetujuan.

Persetujuan atau penolakan manajer hanya berlaku untuk status `PENDING_APPROVAL`. Selama `DRAFT` atau `REJECTED`, tidak ada email ke manajer maupun pemasok.

Fitur ini menurunkan **Bagian 4 (Fitur 3: Persetujuan Manajer)** dan **Bagian 7 (Prioritas 3)** dari PRD ReorderFlow.

---

## 2. Peran & Hak Akses

| Peran | Login Dashboard | Hak Lihat (Read) | Hak Buat (Create) | Hak Ubah (Update) | Hak Setujui (Approve) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Staf Inventori / Procurement Admin** | Ya (`admin`) | Draf PO, riwayat PO | Token persetujuan saat submit | Baris draf PO, status ke `PENDING_APPROVAL` | Tidak Boleh |
| **Operations Manager** | Ya (`manager`, read-only) | Email ringkasan PO & tautan action | - | - | Ya (Approve / Reject via Email) |
| **System Mailer & Handler** | Tidak (service account) | Data `po_log`, token persetujuan | Token, pesan email SMTP | Status PO ke `SENT` / `REJECTED` | - |
| **Pemasok / Vendor** | Tidak | Dokumen PDF PO via lampiran email | - | - | - |

Persetujuan PO tidak memerlukan login dashboard: tautan email bersifat publik dan dilindungi token sekali pakai.

---

## 3. Alur Persetujuan & Pengiriman Email

* **K-03.1:** **KETIKA** admin menekan **Kirim ke Manajer** pada PO berstatus `DRAFT`, `REJECTED`, atau `REQUIRES_MANUAL_REVIEW`, sistem memvalidasi minimal satu barang dan email pemasok yang valid.
* **K-03.2:** **KETIKA** validasi lolos, sistem membuat token baru 32 karakter heksadesimal, menyimpan `token` dan `submitted_at`, merender PDF final, mengunggahnya ke Supabase Storage, dan mengubah status menjadi `PENDING_APPROVAL`.
* **K-03.3:** **KETIKA** status berubah, sistem mengantrekan email HTML ringkasan ke Operations Manager berisi nomor PO, nama pemasok, daftar barang, total qty, serta tombol **Approve** dan **Reject**.
* **K-03.4:** **KETIKA** Operations Manager mengklik **Approve** dan status PO masih `PENDING_APPROVAL`, sistem mengubah status menjadi `SENT` dan mengantrekan email PDF final ke pemasok.
* **K-03.5:** **JIKA** Operations Manager mengklik **Reject**, sistem mengubah status menjadi `REJECTED` dan membatalkan pengiriman ke pemasok.
* **K-03.6:** **JIKA** token tidak ditemukan, sistem menampilkan halaman error dengan HTTP `404`.
* **K-03.7:** **JIKA** tautan diklik kembali ketika status bukan `PENDING_APPROVAL`, sistem menampilkan halaman idempotensi. Untuk status `DRAFT`, pesan yang ditampilkan adalah PO belum diajukan ke manajer.
* **K-03.8:** **JIKA** token melewati masa berlaku 48 jam sejak `submitted_at`, sistem mengubah status menjadi `REQUIRES_MANUAL_REVIEW` dan menampilkan halaman tautan kedaluwarsa.
* **K-03.9:** **JIKA** pengiriman email ke pemasok gagal, sistem mengubah status PO menjadi `REQUIRES_MANUAL_REVIEW` dan mencatat error.
* **K-03.10:** **SELAMA** status PO `DRAFT`, `REJECTED`, atau `REQUIRES_MANUAL_REVIEW`, dokumen PO tidak boleh diteruskan ke email pemasok.
* **K-03.11:** **SELAMA** proses approval berjalan, sistem memakai lock Redis `token:{token}` dengan TTL 1 menit. Perubahan status memakai conditional update `status = PENDING_APPROVAL` sebagai idempotensi di database.
* **K-03.12:** **SELAMA** pengiriman email, sistem memakai antrean in-memory dengan 2 worker dan buffer 64 task. Retry SMTP memakai satu percobaan ulang dengan backoff 2 detik.

---

## 4. Aturan Bisnis

| No. | Kode AB | Kondisi Pemicu | Hasil / Tindakan Sistem |
| :--- | :--- | :--- | :--- |
| 1 | AB-03.1 | Manager klik `Approve` DAN status DB = `PENDING_APPROVAL` | Ubah status `po_log` -> `SENT` dan antrekan email PDF PO ke Pemasok. |
| 2 | AB-03.2 | Manager klik `Reject` DAN status DB = `PENDING_APPROVAL` | Ubah status `po_log` -> `REJECTED` dan hentikan alur pengiriman. |
| 3 | AB-03.3 | Manager klik link DAN status DB != `PENDING_APPROVAL` | Tampilkan halaman status idempotency, aksi ditolak. |
| 4 | AB-03.4 | Token tidak ditemukan / token invalid di DB | Kembalikan HTTP `404` dengan pesan "Token persetujuan tidak valid". |
| 5 | AB-03.5 | Masa berlaku token melewati 48 jam | Ubah status PO -> `REQUIRES_MANUAL_REVIEW` dan tampilkan halaman kedaluwarsa. |
| 6 | AB-03.6 | Submit draf tanpa barang atau email pemasok tidak valid | Kembalikan HTTP `400`, status PO tidak berubah. |
| 7 | AB-03.7 | Pengiriman email pemasok gagal setelah retry | Ubah status PO -> `REQUIRES_MANUAL_REVIEW`. |

---

## 5. Istilah Internal

* **Human-in-the-Loop (HITL):** Mekanisme di mana keputusan penting (pengeluaran uang/pemesanan) membutuhkan konfirmasi manusia sebelum eksekusi otomatis berlanjut.
* **Idempotent Action:** Sifat operasi di mana eksekusi berulang kali dengan parameter yang sama tidak akan mengubah hasil setelah eksekusi pertama.
* **SMTP (Simple Mail Transfer Protocol):** Protokol standar pengiriman email dari server backend ke alamat email tujuan.
* **Email Queue:** Antrean in-memory yang memproses pengiriman email secara asinkron dengan worker terbatas.

---

## 6. Data Utama & Status

### 6.1 Data Utama (`po_log` & Token)
* `token`: String (32 karakter heksadesimal, unique)
* `submitted_at`: Timestamp saat draf dikirim ke manajer
* `status`: Enum (`DRAFT`, `PENDING_APPROVAL`, `SENT`, `REJECTED`, `REQUIRES_MANUAL_REVIEW`, `PARTIALLY_RECEIVED`, `RECEIVED`)

### 6.2 Alur Perubahan Status PO
```text
DRAFT --(Admin klik Kirim ke Manajer)--> PENDING_APPROVAL (Email ke Manajer)
REJECTED / REQUIRES_MANUAL_REVIEW --(Admin edit + kirim ulang)--> PENDING_APPROVAL
PENDING_APPROVAL --(Manager Approve)--> SENT (Email PDF ke Pemasok)
PENDING_APPROVAL --(Manager Reject) --> REJECTED (Alur Berhenti)
PENDING_APPROVAL --(Token Re-clicked) --> Response: Already Processed
PENDING_APPROVAL --(Token > 48 jam)  --> REQUIRES_MANUAL_REVIEW
```

---

## 7. Daftar Fungsi & Spesifikasi 7 Aspek

Fitur ini dipecah menjadi 2 fungsi teknis:
1. **F-03.1: Draft Submit, Token Generator & Manager Email Dispatcher**
2. **F-03.2: Approval HTTP Handler & Supplier Dispatcher**

---

### Spesifikasi Fungsi F-03.1: Draft Submit, Token Generator & Manager Email Dispatcher

#### 1. Perilaku (Kebutuhan & AC)
* **K-F03.1a:** **KETIKA** admin mengirim draf, fungsi memvalidasi isi draf dan email pemasok, membuat token acak, merender PDF final, mengubah status ke `PENDING_APPROVAL`, lalu mengantrekan email ke Operations Manager.
* **AC:** Given `PO-20261025-101-001` berstatus `DRAFT` dan memiliki dua baris barang. When admin menekan **Kirim ke Manajer**, Then token `a8f9c123...` tersimpan, `submitted_at` terisi, status menjadi `PENDING_APPROVAL`, dan email masuk ke inbox `manager@example.com` berisi tautan `https://example.com/api/po/approval?token=a8f9c123...&action=approve`.

#### 2. Tampilan & Kondisi Layar
* *Editor Draf*: tombol "Simpan Draf" dan "Kirim ke Manajer", dialog konfirmasi, dan tampilan terkunci setelah status `PENDING_APPROVAL` atau `SENT`.
* *Email Client Manager*: tampilan HTML dengan tombol hijau (Approve) dan merah (Reject).

#### 3. Data & Validasi
* **Format Token:** 32 karakter heksadesimal dari `crypto/rand` (16 byte).
* **Validasi Submit:** minimal satu barang, `jumlah_order > 0`, SKU milik pemasok PO, email pemasok valid.
* **Header Email:** Subject: `[Action Required] Persetujuan PO #PO-20261025-101-001 - PT Kopi Nusantara`.

#### 4. Error
* Submit tanpa barang atau email invalid menghasilkan HTTP `400` dan status PO tidak berubah.
* Jika PDF gagal disiapkan, submit menghasilkan HTTP `502`.
* Jika SMTP gagal, email dicoba ulang satu kali dengan backoff 2 detik. Jika tetap gagal, status menjadi `REQUIRES_MANUAL_REVIEW`.

#### 5. Hak Akses
* `PUT /api/po-draft/{id}` dan `POST /api/po-draft/{id}/submit` hanya untuk role `admin`. Manager mendapat HTTP `403`.

#### 6. Jumlah Data & Kecepatan
* Antrean email memakai 2 worker dan buffer 64 task.
* Respons submit mengembalikan data PO tanpa menunggu email selesai terkirim.

#### 7. Bukan Bagian Ini
* Pemrosesan klik link persetujuan (ditangani F-03.2).

---

### Spesifikasi Fungsi F-03.2: Approval HTTP Handler & Supplier Dispatcher

#### 1. Perilaku (Kebutuhan & AC)
* **K-F03.2a:** **KETIKA** Manager mengklik link, HTTP Handler memvalidasi token, memeriksa TTL dan status `PENDING_APPROVAL`, mengubah status PO, dan mengantrekan PDF final ke email Pemasok jika disetujui.
* **AC:** Given PO `PO-20261025-101-001` status `PENDING_APPROVAL` dan token valid. When Manager mengklik link Approve, Then status PO berubah menjadi `SENT`, email terkirim ke `supplier@example.com` dengan lampiran PDF, dan browser menampilkan halaman "Persetujuan Berhasil".

#### 2. Tampilan & Kondisi Layar
* *Landing Page Response Browser*:
  * Sukses: aksen hijau, pesan "Persetujuan PO berhasil diproses" beserta nomor PO dan status baru.
  * Sudah digunakan: aksen amber, pesan "Tautan persetujuan ini sudah pernah digunakan sebelumnya".
  * Belum diajukan: aksen amber, pesan "PO masih berstatus draf dan belum diajukan ke manajer".
  * Kedaluwarsa: aksen merah, pesan "Token persetujuan sudah kedaluwarsa".
  * Token invalid: aksen merah, pesan "Token persetujuan tidak ditemukan atau sudah kedaluwarsa".

#### 3. Data & Validasi
* **Parameter Query HTTP:** `token` (string, required), `action` (string: `approve` | `reject`, required).
* **TTL Token:** 48 jam sejak `submitted_at`.
* **Idempotensi:** update hanya berhasil jika status masih `PENDING_APPROVAL`.

#### 4. Error
* Action selain `approve`/`reject` menghasilkan HTTP `400`.
* Token tidak ditemukan menghasilkan HTTP `404`.
* Jika email Pemasok bounce/invalid, status PO diubah menjadi `REQUIRES_MANUAL_REVIEW` dan error dicatat.

#### 5. Hak Akses
* Dapat diakses via public HTTP GET tanpa Bearer token, dilindungi token 32 karakter.

#### 6. Jumlah Data & Kecepatan
* Respons handler sampai render halaman konfirmasi ditargetkan **< 1.0 detik**. Pengiriman email berjalan asinkron.

#### 7. Bukan Bagian Ini
* Pengelompokan SKU ke PDF dan editor draf (Fitur F-02).

---

## 8. AC Alur Utama (Dengan Data Nyata)

* **Data Skenario:**
  * PO ID: `PO-20261025-303-001`.
  * Manager Email: `manager@example.com`.
  * Supplier Email: `sales@supplier303.com`.
  * Token: `tok_xyz98765432101234567890123456789`.
* **Eksekusi:**
  1. Admin membuka draf, memeriksa barang, lalu menekan **Kirim ke Manajer**.
  2. Backend menyimpan token baru, mengubah status menjadi `PENDING_APPROVAL`, dan mengantrekan email ke `manager@example.com`.
  3. Manager membuka email pada pukul 09:00 WIB dan mengklik tombol **Approve**.
  4. `F-03.2` menerima request `GET /api/po/approval?token=tok_xyz...&action=approve`.
  5. Database diperbarui: `status = 'SENT'`.
  6. `F-03.2` mengantrekan SMTP untuk mengirim email ke `sales@supplier303.com` dengan lampiran PDF PO.
  7. Manager melihat halaman web konfirmasi: "Status PO-20261025-303-001 kini SENT dan telah dikirim ke Pemasok."

---

## 9. Tidak Termasuk
* Fitur negosiasi harga atau revisi kuantitas PO langsung dari halaman email.
* Tanda tangan digital berbasis biometrik.
* Approve/Reject dari dashboard. Aksi hanya lewat tautan email.
