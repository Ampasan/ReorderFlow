# Functional Requirement Document (FRD): ReorderFlow

## 1. Konteks
Dokumen ini merupakan Functional Requirement Document (FRD) untuk sistem **ReorderFlow**. Dokumen ini merincikan spesifikasi fungsional global, arsitektur data, alur sistem end-to-end, dan aturan bisnis utama yang menurunkan Bagian 4 (Lingkup) dan Bagian 7 (Daftar Fitur) dari PRD ReorderFlow.

---

## 2. Peran & Hak Akses

| Peran | Hak Lihat (Read) | Hak Buat (Create) | Hak Ubah (Update) | Hak Setujui (Approve) |
| :--- | :--- | :--- | :--- | :--- |
| **Staf Inventori / Admin** | Data Stok, Data Pemasok, Riwayat PO_Log | Draf Reorder Manual | Data Stok (Koreksi Opnam) | Tidak Boleh |
| **Operations Manager** | Dashboard, Data Stok, Riwayat PO_Log, Email Ringkasan | - | - | Ya (Approve / Reject PO via Email Link) |
| **System Cron / Worker** | Pemindaian Tabel Stok & Pemasok | Record PO_Log, File PDF PO di Storage | Status PO_Log (`DRAFT` -> `SENT`/`REJECTED`) | - |

---

## 3. Alur Utama Sistem

* **K-IND-1.1:** **KETIKA** *scheduled cron job* harian berjalan pada pukul 08:00 WIB, sistem memindai tabel `stok` di Supabase untuk mengidentifikasi SKU yang memenuhi kriteria `stok_saat_ini <= reorder_point`.
* **K-IND-1.2:** **KETIKA** ditemukan SKU *low-stock* yang tidak memiliki PO aktif, sistem mengelompokkan SKU tersebut berdasarkan `id_pemasok`.
* **K-IND-1.3:** **KETIKA** pengelompokan selesai, sistem menerbitkan nomor PO unik, menghasilkan dokumen PDF PO, mengunggah file ke Supabase Storage `po-documents`, dan membuat record `PO_Log` berstatus `DRAFT`.
* **K-IND-1.4:** **KETIKA** record `PO_Log` terbentuk, sistem membuat *one-time idempotency token* dan mengirimkan email ringkasan persetujuan ke Operations Manager.
* **K-IND-1.5:** **KETIKA** Operations Manager mengklik tombol **Approve** pada email, sistem mengubah status `PO_Log` menjadi `SENT` dan meneruskan dokumen PDF PO ke email Pemasok.
* **K-IND-1.6:** **JIKA** Operations Manager mengklik tombol **Reject**, sistem mengubah status `PO_Log` menjadi `REJECTED` dan menghentikan pengiriman email ke Pemasok.
* **K-IND-1.7:** **JIKA** data `stok_saat_ini < 0`, `reorder_point` kosong/nol, atau email Pemasok tidak terdaftar, sistem mengubah status menjadi `REQUIRES_MANUAL_REVIEW` dan mengirimkan notifikasi peringatan ke log sistem.
* **K-IND-1.8:** **JIKA** tautan persetujuan diklik kembali setelah status PO berubah dari `DRAFT`, sistem menolak permintaan dan menampilkan pesan bahwa tautan sudah tidak berlaku.
* **K-IND-1.9:** **JIKA** layanan pengiriman email SMTP atau Supabase Storage mengalami gangguan koneksi, sistem melakukan percobaan ulang (*retry*) maksimal 3 kali sebelum mencatat log kegagalan.
* **K-IND-1.10:** **SELAMA** status `PO_Log` bernilai `DRAFT`, dokumen PDF PO tidak boleh dikirimkan ke email Pemasok.
* **K-IND-1.11:** **SELAMA** status `PO_Log` bernilai `SENT` atau `REJECTED`, token persetujuan terkait terkunci dan tidak dapat diubah kembali.

---

## 4. Aturan Bisnis

| No. | Kode AB | Kondisi Pemicu | Hasil / Tindakan Sistem |
| :--- | :--- | :--- | :--- |
| 1 | AB-IND-01 | `stok_saat_ini <= reorder_point` DAN tidak ada PO aktif (`DRAFT`/`SENT`) untuk SKU tersebut | Masukkan SKU ke daftar item yang wajib dipesan ulang (reorder). |
| 2 | AB-IND-02 | Terdapat PO aktif berstatus `DRAFT` atau `SENT` (dalam kurun waktu 7 hari terakhir) untuk SKU tersebut | Abaikan SKU dari pemindaian otomatis untuk mencegah duplikasi PO. |
| 3 | AB-IND-03 | `stok_saat_ini < 0` ATAU `reorder_point <= 0` ATAU `qty_min_order <= 0` | Tandai baris data dengan status `REQUIRES_MANUAL_REVIEW` dan lewati pemrosesan otomatis. |
| 4 | AB-IND-04 | Email Pemasok kosong / format email tidak valid pada tabel `pemasok` | Buat PDF PO, tetapi ubah status PO menjadi `REQUIRES_MANUAL_REVIEW` dan kirimkan notifikasi email tidak valid ke Manager. |
| 5 | AB-IND-05 | Token persetujuan diklik ketika status PO di DB != `DRAFT` | Buka halaman konfirmasi dengan status: "Tautan persetujuan ini sudah pernah digunakan sebelumnya." |
| 6 | AB-IND-06 | Kegagalan koneksi SMTP / Storage saat pengiriman | Jalankan *exponential backoff retry* (15s, 30s, 60s) hingga maksimal 3 kali percobaan. |

---

## 5. Istilah Internal

* **ROP (Reorder Point):** Ambang batas minimum jumlah stok yang memicu pembuatan pesanan ulang otomatis.
* **PO (Purchase Order):** Dokumen resmi pemesanan barang dari pembeli (UMKM) kepada pemasok/vendor.
* **Idempotency Token:** Kode unik acak sekali pakai (*one-time use token*) yang digunakan pada tautan persetujuan email guna menjamin tindakan persetujuan tidak dieksekusi berulang kali.
* **Human-in-the-Loop:** Skema alur kerja di mana sistem otomatis menyiapkan draf dan keputusan akhir pengiriman tetap berada di tangan manusia (Operations Manager).
* **PO Aktif:** Record PO yang memiliki status `DRAFT` atau `SENT` yang belum diselesaikan/diterima barangnya.

---

## 6. Data Utama & Status

### 6.1 Data Utama
1. **`stok`**: Menampung katalog SKU, jumlah persediaan, ROP, minimum order, dan relasi pemasok.
2. **`pemasok`**: Menyimpan master data vendor/pemasok dan alamat email resmi.
3. **`po_log`**: Mencatat riwayat penerbitan PO, nomor PO, status, tautan dokumen PDF, dan token persetujuan.

### 6.2 Status PO (POStatus Lifecycle)
```text
[Cron Job] --> DRAFT --> (Manager Approve) --> SENT
                    --> (Manager Reject)  --> REJECTED
                    --> (Data Invalid)   --> REQUIRES_MANUAL_REVIEW
```

---

## 7. Daftar Fungsi Utama

1. **F-01 (Deteksi Low-Stock):** Memindai dan menyaring SKU yang memenuhi kriteria ROP tanpa duplikasi.
2. **F-02 (PDF PO Generator):** Mengelompokkan SKU per pemasok, menghitung total pesanan, dan mengunggah PDF PO ke Supabase Storage.
3. **F-03 (Persetujuan & Workflow Email):** Mengirimkan email draf ke Manager, mengesahkan action link, dan meneruskan PO ke Pemasok.
4. **F-04 (Dashboard UI Monitoring):** Menyajikan visibilitas data stok, indikator badge ROP, dan tabel riwayat PO.

---

## 8. AC Alur Utama (End-to-End dengan Data Nyata)

### Skenario Uji End-to-End:
* **Data Awal:** 
  * SKU: `SKU-KOP-01` ("Kopi Arabika 250g"), `stok_saat_ini = 5`, `reorder_point = 10`, `qty_min_order = 20`, `id_pemasok = 101`.
  * Pemasok ID `101`: "PT Kopi Nusantara", email: `supplier@example.com`.
  * Operations Manager: `manager@example.com`.
* **Kejadian 1 (Pukul 08.00 WIB):**
  * Cron job terpicu. Sistem mendeteksi `SKU-KOP-01` (`stok_saat_ini 5 <= ROP 10`) dan tidak ada PO aktif.
* **Kejadian 2 (Sistem Eksekusi):**
  * Sistem membuat nomor PO: `PO-20261025-101-001`.
  * File PDF diterbitkan dan diunggah ke Supabase Storage: `https://example.com/po-documents/PO-20261025-101-001.pdf`.
  * Token persetujuan dibuat: `token_sample123`. Record `po_log` tersimpan dengan status `DRAFT`.
* **Kejadian 3 (Email ke Manager):**
  * System SMTP mengirim email ke `manager@example.com` dengan tombol **Approve**: `https://example.com/po/approval?token=token_sample123&action=approve`.
* **Kejadian 4 (Aksi Manager):**
  * Manager mengklik **Approve** pada pukul 08:15 WIB.
  * Backend Go menerima request, memverifikasi `token_sample123`, mengubah status `po_log` menjadi `SENT`, dan mengirimkan email berisi lampiran PDF ke `supplier@example.com`.
* **Kejadian 5 (Verifikasi Idempotency):**
  * Manager mengklik kembali tombol **Approve** pada pukul 08:20 WIB.
  * Sistem merespon dengan halaman konfirmasi: *"Tautan persetujuan ini sudah pernah digunakan sebelumnya (Status: SENT)."*

---

## 9. Tidak Termasuk (Out of Scope)
* Fitur penerimaan barang (*goods receipt*) dan penyesuaian stok otomatis setelah PO disetujui.
* Pengiriman notifikasi persetujuan via WhatsApp / SMS API.
* Integrasi otomatisasi pembayaran atau pencatatan utang usaha (*Accounts Payable*).
