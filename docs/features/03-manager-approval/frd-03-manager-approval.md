# Functional Requirement Document (FRD): Fitur 03 - Persetujuan Manajer & Email Workflow

## 1. Konteks
Fitur ini mengelola alur kerja persetujuan persetujuan pemesanan ulang (*Human-in-the-Loop*). Fitur ini membuat token persetujuan aman sekali pakai (*one-time idempotent token*), mengirimkan email ringkasan PO ke Operations Manager, memproses respon tindakan (Approve/Reject) dari tautan email, serta meneruskan dokumen PDF PO ke email Pemasok jika disetujui. Fitur ini menurunkan **Bagian 4 (Fitur 3: Persetujuan Manajer)** dan **Bagian 7 (Prioritas 3)** dari PRD ReorderFlow.

---

## 2. Peran & Hak Akses

| Peran | Hak Lihat (Read) | Hak Buat (Create) | Hak Ubah (Update) | Hak Setujui (Approve) |
| :--- | :--- | :--- | :--- | :--- |
| **Operations Manager** | Email Ringkasan PO & Tautan Action | - | - | Ya (Mengklik Approve / Reject di Email) |
| **System Mailer & Handler** | Data `po_log`, Token Persetujuan | Token Acak, Pesan Email SMTP | Status PO ke `SENT` / `REJECTED` | - |
| **Pemasok / Vendor** | Dokumen PDF PO (via Lampiran Email) | - | - | - |

---

## 3. Alur Persetujuan & Pengiriman Email

* **K-03.1:** **KETIKA** record `po_log` berstatus `DRAFT` berhasil dibuat oleh Fitur 02, sistem memicu pembentukan *one-time cryptographically secure token* (32 karakter acak).
* **K-03.2:** **KETIKA** token terbentuk, sistem menyimpan token pada kolom `token` di tabel `po_log` dan menyusun email HTML ringkasan persetujuan untuk Operations Manager.
* **K-03.3:** **KETIKA** email dikirimkan via SMTP, email memuat detail nomor PO, nama pemasok, daftar barang, total estimasi, serta dua tombol aksi: **Approve** dan **Reject**.
* **K-03.4:** **KETIKA** Operations Manager mengklik tombol **Approve**, request HTTP GET dikirimkan ke endpoint `/api/po/approval?token=xxx&action=approve`.
* **K-03.5:** **KETIKA** backend Go memverifikasi bahwa token valid dan status PO masih `DRAFT`, sistem mengubah status PO menjadi `SENT`, memicu pengiriman email resmi berlampiran PDF ke email Pemasok, dan menampilkan halaman konfirmasi sukses di browser Manager.
* **K-03.6:** **JIKA** Operations Manager mengklik tombol **Reject**, sistem mengubah status PO menjadi `REJECTED`, membatalkan pengiriman ke Pemasok, dan menampilkan halaman konfirmasi penolakan.
* **K-03.7:** **JIKA** tautan persetujuan diklik kembali ketika status PO sudah bukan `DRAFT` (misal sudah `SENT` atau `REJECTED`), sistem menolak eksekusi dan menampilkan pesan: *"Tautan persetujuan ini sudah tidak berlaku atau pernah digunakan sebelumnya."*
* **K-03.8:** **JIKA** pengiriman email ke Pemasok mengalami kegagalan SMTP, sistem menjalankan mekanisme *retry* hingga 3 kali. Jika tetap gagal, status PO diubah ke `REQUIRES_MANUAL_REVIEW`.
* **K-03.9:** **SELAMA** status PO berada pada `DRAFT`, dokumen PO tidak boleh diteruskan ke email Pemasok bawah kondisi apa pun.

---

## 4. Aturan Bisnis

| No. | Kode AB | Kondisi Pemicu | Hasil / Tindakan Sistem |
| :--- | :--- | :--- | :--- |
| 1 | AB-03.1 | Manager klik `Approve` DAN status DB = `DRAFT` | Ubah status `po_log` -> `SENT` & Kirim email PDF PO ke Pemasok. |
| 2 | AB-03.2 | Manager klik `Reject` DAN status DB = `DRAFT` | Ubah status `po_log` -> `REJECTED` & Hentikan alur pengiriman. |
| 3 | AB-03.3 | Manager klik link DAN status DB != `DRAFT` | Tampilkan halaman status idempotency (Aksi ditolak, status tetap). |
| 4 | AB-03.4 | Token tidak ditemukan / Token Invalid di DB | Kembalikan HTTP `404 Not Found` dengan pesan: "Token tidak valid". |
| 5 | AB-03.5 | Masa berlaku token melewati 48 jam | Tandai token kedaluwarsa, ubah status PO -> `REQUIRES_MANUAL_REVIEW`. |

---

## 5. Istilah Internal

* **Human-in-the-Loop (HITL):** Mekanisme di mana keputusan penting (pengeluaran uang/pemesanan) membutuhkan konfirmasi manusia sebelum eksekusi otomatis berlanjut.
* **Idempotent Action:** Sifat operasi di mana eksekusi berulang kali dengan parameter yang sama tidak akan mengubah hasil setelah eksekusi pertama.
* **SMTP (Simple Mail Transfer Protocol):** Protokol standar pengiriman email dari server backend ke alamat email tujuan.

---

## 6. Data Utama & Status

### 6.1 Data Utama (`po_log` & Token)
* `token`: String (32 karakter, Unique)
* `status`: Enum (`DRAFT`, `SENT`, `REJECTED`, `REQUIRES_MANUAL_REVIEW`)

### 6.2 Alur Perubahan Status PO
```text
DRAFT --(Manager Klik Approve)--> SENT (Email Terkirim ke Pemasok)
DRAFT --(Manager Klik Reject) --> REJECTED (Alur Berhenti)
DRAFT --(Token Re-clicked)   --> Response: Already Processed
```

---

## 7. Daftar Fungsi & Spesifikasi 7 Aspek

Fitur ini dipecah menjadi 2 fungsi teknis:
1. **F-03.1: Token Generator & Manager Email Dispatcher**
2. **F-03.2: Approval HTTP Handler & Supplier Dispatcher**

---

### Spesifikasi Fungsi F-03.1: Token Generator & Manager Email Dispatcher

#### 1. Perilaku (Kebutuhan & AC)
* **K-F03.1a:** **KETIKA** PO DRAFT terbentuk, fungsi meregenerasi token acak, menyusun template email HTML, dan mengirimkannya ke email Operations Manager.
* **AC:** Given `PO-20261025-101-001` baru saja dibuat. When `F-03.1` berjalan, Then token `a8f9c123...` tersimpan di DB dan email masuk ke inbox `manager@example.com` berisi tautan `https://example.com/api/po/approval?token=a8f9c123...&action=approve`.

#### 2. Tampilan & Kondisi Layar
* *Email Client Manager*: Tampilan HTML Email responsif dengan tombol hijau (Approve) dan tombol merah (Reject).

#### 3. Data & Validasi
* **Format Token:** 32-character Hex String (`crypto/rand`).
* **Header Email:** Subject: `[Action Required] Persetujuan PO #PO-20261025-101-001 - PT Kopi Nusantara`.

#### 4. Error
* Jika SMTP Server down, catat error ke log, pemicu retry worker (backoff 15s, 30s, 60s).

#### 5. Hak Akses
* Eksekusi internal Service Backend Go.

#### 6. Jumlah Data & Kecepatan
* Generasi token & pengiriman email selesai dalam waktu **< 2.5 detik**.

#### 7. Bukan Bagian Ini
* Pemrosesan klik link persetujuan (ditangani F-03.2).

---

### Spesifikasi Fungsi F-03.2: Approval HTTP Handler & Supplier Dispatcher

#### 1. Perilaku (Kebutuhan & AC)
* **K-F03.2a:** **KETIKA** Manager mengklik link, HTTP Handler memvalidasi token, mengupdate status PO di DB, dan meneruskan PDF PO ke email Pemasok jika disetujui.
* **AC:** Given PO `PO-20261025-101-001` status `DRAFT`. When Manager mengklik link Approve (`action=approve`), Then status PO di DB berubah menjadi `SENT`, email terkirim ke `supplier@example.com` dengan lampiran PDF, dan browser menampilkan halaman: *"Persetujuan PO Berhasil Di-Approve"*.

#### 2. Tampilan & Kondisi Layar
* *Landing Page Response Browser*:
  * Kondisi Sukses: Pesan hijau "Persetujuan PO Berhasil Diproses".
  * Kondisi Re-click: Pesan kuning "Tautan Ini Sudah Pernah Digunakan".
  * Kondisi Error: Pesan merah "Token Tidak Valid".

#### 3. Data & Validasi
* **Parameter Query HTTP:** `token` (string, required), `action` (string: `approve` | `reject`, required).

#### 4. Error
* Jika email Pemasok bounce/invalid, ubah status PO menjadi `REQUIRES_MANUAL_REVIEW` dan kirim notifikasi ke Manager.

#### 5. Hak Akses
* Accessible via Public HTTP GET (Aman karena dilindungi oleh 32-character high-entropy token).

#### 6. Jumlah Data & Kecepatan
* Response time HTTP Handler sampai render halaman konfirmasi: **< 1.0 detik**.

#### 7. Bukan Bagian Ini
* Pengelompokan SKU ke PDF (Fitur F-02).

---

## 8. AC Alur Utama (Dengan Data Nyata)

* **Data Skenario:**
  * PO ID: `PO-20261025-303-001`.
  * Manager Email: `manager@example.com`.
  * Supplier Email: `sales@supplier303.com`.
  * Token: `tok_xyz98765432101234567890123456789`.
* **Eksekusi:**
  1. `F-03.1` mengirim email draf ke `manager@example.com`.
  2. Manager membuka email pada pukul 09:00 WIB dan mengklik tombol **Approve**.
  3. `F-03.2` menerima request `GET /api/po/approval?token=tok_xyz...&action=approve`.
  4. Database diperbarui: `status = 'SENT'`.
  5. `F-03.2` memicu SMTP untuk mengirim email ke `sales@supplier303.com` dengan membawa lampiran PDF PO.
  6. Manager melihat halaman web konfirmasi: *"Status PO-20261025-303-001 kini SENT dan telah dikirim ke Pemasok."*

---

## 9. Tidak Termasuk
* Fitur negosiasi harga atau revisi kuantitas PO langsung dari halaman email.
* Tanda tangan digital berbasis biometrik.
