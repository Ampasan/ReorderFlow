### Requirements Spec: FRD-03 Persetujuan Manajer & Email Workflow (ReorderFlow)

--------------------------------------------------------------------------------

##### 1. Aspek: Perilaku (Kebutuhan & AC)
*   **K-3.1 (Generasi Token Idempoten Aman)** : KETIKA record `po_log` berstatus `DRAFT` berhasil dibuat oleh Fitur FRD-02, sistem memicu pembentukan *one-time cryptographically secure token* (32 karakter acak).
    *   **AC-3.1.1** : Token acak `tok_a8f9c123456789012345678901234567` (32 karakter) dibuat dan disimpan pada kolom `token` di tabel `po_log`.
*   **K-3.2 (Pengiriman Email Ringkasan PO ke Manager)** : KETIKA token terbentuk, sistem menyusun email HTML ringkasan persetujuan untuk Operations Manager berisi detail nomor PO, nama pemasok, daftar barang, total estimasi, serta dua tombol aksi: **Approve** dan **Reject**.
    *   **AC-3.2.1** : Email dikirimkan via SMTP ke inbox Manager memuat tombol Approve (`action=approve`) dan Reject (`action=reject`).
*   **K-3.3 (Pemrosesan Persetujuan / Approval Action)** : KETIKA Operations Manager mengklik tombol **Approve**, request HTTP GET dikirim ke `/api/v1/po/approval?token=xxx&action=approve`. Backend Go memverifikasi token dan status PO `DRAFT`, mengubah status PO menjadi `SENT`, memicu pengiriman email resmi berlampiran PDF ke Pemasok, dan menampilkan halaman konfirmasi sukses di browser.
    *   **AC-3.3.1** : Mengklik Approve mengubah status PO di DB dari `DRAFT` ke `SENT`, mengirimkan PDF PO ke email Pemasok, dan menampilkan pesan "Persetujuan PO Berhasil Diproses".
*   **Pengecualian & Batasan (JIKA / SELAMA)** :
    *   **JIKA** Manager mengklik tombol **Reject**, sistem mengubah status PO menjadi `REJECTED`, membatalkan pengiriman ke Pemasok, dan menampilkan halaman konfirmasi penolakan.
    *   **JIKA** tautan persetujuan diklik kembali ketika status PO sudah bukan `DRAFT` (misal sudah `SENT` atau `REJECTED`), sistem menolak eksekusi (*idempotency rule*) dan menampilkan pesan "Tautan persetujuan ini sudah tidak berlaku atau pernah digunakan sebelumnya".
    *   **JIKA** pengiriman email ke Pemasok mengalami kegagalan SMTP, sistem menjalankan retry 3x. Jika tetap gagal, status PO diubah menjadi `REQUIRES_MANUAL_REVIEW`.
    *   **SELAMA** status PO berada pada `DRAFT`, dokumen PO **tidak boleh** diteruskan ke email Pemasok bawah kondisi apa pun.

--------------------------------------------------------------------------------

##### 2. Aspek: Tampilan & Kondisi Layar
*   **Kondisi Email Client Manager** :
    *   Tampilan HTML Email responsif memuat ringkasan tabel barang, tombol hijau (Approve), dan tombol merah (Reject).
*   **Kondisi Web Landing Page Response (Browser Manager)** :
    *   **Kondisi Sukses (Approve/Reject First Time)** : Pesan hijau/biru: `"Persetujuan PO-20261025-101-001 Berhasil Diproses (Status: SENT)"`.
    *   **Kondisi Re-click / Idempotent** : Pesan kuning: `"Tautan ini sudah pernah digunakan sebelumnya."`.
    *   **Kondisi Token Invalid / Expired** : Pesan merah: `"Token persetujuan tidak ditemukan atau sudah kedaluwarsa."`.

--------------------------------------------------------------------------------

##### 3. Aspek: Data & Validasi
*   **Query Parameters (HTTP Approval Request)** :
    *   `token` (String, Required, 32 Karakter Hex)
    *   `action` (String Enum, Required: `'approve'` | `'reject'`)
*   **Masa Berlaku Token (TTL)** :
    *   Masa berlaku token maksimal **48 Jam** sejak email dikirim.

--------------------------------------------------------------------------------

##### 4. Aspek: Error & Pengecualian
*   **SMTP Service Outage (Gagal Kirim Email)** :
    *   JIKA SMTP server down, catat error ke log dan jalankan retry worker (backoff 15s, 30s, 60s).
*   **Token Tidak Ditemukan / HTTP 404** :
    *   JIKA token acak tidak ada di database, kembalikan HTTP 404 Not Found dengan pesan `"Token persetujuan tidak valid"`.

--------------------------------------------------------------------------------

##### 5. Aspek: Hak Akses
*   **Public HTTP Access (Protected by Token)** :
    *   Endpoint `/api/v1/po/approval` dapat diakses tanpa login password, dilindungi oleh token acak high-entropy 32 karakter.
*   **Operations Manager** :
    *   Memiliki wewenang eksklusif untuk menyetujui (`SENT`) atau menolak (`REJECTED`) dokumen PO.

--------------------------------------------------------------------------------

##### 6. Aspek: Jumlah Data & Kecepatan
*   **Volume Data** :
    *   Menangani hingga 100 permintaan persetujuan email per hari.
*   **Target Waktu & Performa** :
    *   Generasi token & pengiriman email Manager: **< 2.5 detik**.
    *   Response time HTTP Handler sampai render halaman konfirmasi: **< 1.0 detik**.

--------------------------------------------------------------------------------

##### 7. Aspek: Bukan Bagian Ini (Out-of-Scope)
*   Modul ini **TIDAK** mencakup negosiasi harga atau revisi kuantitas PO langsung dari email.
*   Modul ini **TIDAK** mencakup tanda tangan digital biometrik/SSL PKI certificate.
