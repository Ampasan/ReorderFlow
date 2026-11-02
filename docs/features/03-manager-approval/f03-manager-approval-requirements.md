### Requirements Spec: FRD-03 Persetujuan Manajer & Email Workflow (ReorderFlow)

--------------------------------------------------------------------------------

##### 1. Aspek: Perilaku (Kebutuhan & AC)
*   **K-3.1 (Submit Draf & Generasi Token Idempoten)** : KETIKA admin menekan **Kirim ke Manajer** pada PO berstatus `DRAFT`, `REJECTED`, atau `REQUIRES_MANUAL_REVIEW`, sistem memvalidasi minimal satu barang dan email pemasok, lalu membuat token 32 karakter heksadesimal dan menyimpan `submitted_at`.
    *   **AC-3.1.1** : Token acak `a8f9c123456789012345678901234567` dibuat dan disimpan pada kolom `token` di tabel `po_log`.
    *   **AC-3.1.2** : Submit tanpa barang atau dengan email pemasok tidak valid menghasilkan HTTP `400` dan status PO tidak berubah.
*   **K-3.2 (Pengiriman Email Ringkasan PO ke Manager)** : KETIKA status berubah menjadi `PENDING_APPROVAL`, sistem menyusun email HTML ringkasan untuk Operations Manager berisi nomor PO, nama pemasok, daftar barang, total qty, serta dua tombol aksi: **Approve** dan **Reject**.
    *   **AC-3.2.1** : Email dikirimkan via SMTP ke inbox Manager memuat tombol Approve (`action=approve`) dan Reject (`action=reject`).
*   **K-3.3 (Pemrosesan Persetujuan / Approval Action)** : KETIKA Operations Manager mengklik tombol **Approve** dan status PO masih `PENDING_APPROVAL`, request HTTP GET diterima di `/api/po/approval?token=xxx&action=approve`. Backend Go memverifikasi token dan TTL, mengubah status menjadi `SENT`, mengantrekan email PDF final ke Pemasok, dan menampilkan halaman konfirmasi sukses.
    *   **AC-3.3.1** : Mengklik Approve mengubah status PO dari `PENDING_APPROVAL` ke `SENT`, mengirimkan PDF PO ke email Pemasok, dan menampilkan pesan "Persetujuan PO berhasil diproses".
*   **Pengecualian & Batasan (JIKA / SELAMA)** :
    *   **JIKA** Manager mengklik tombol **Reject**, sistem mengubah status PO menjadi `REJECTED`, membatalkan pengiriman ke Pemasok, dan menampilkan halaman konfirmasi penolakan.
    *   **JIKA** tautan persetujuan diklik kembali ketika status bukan `PENDING_APPROVAL`, sistem menolak eksekusi (*idempotency rule*). Untuk status `DRAFT`, pesan yang ditampilkan adalah PO belum diajukan ke manajer.
    *   **JIKA** token melewati 48 jam sejak `submitted_at`, sistem mengubah status menjadi `REQUIRES_MANUAL_REVIEW` dan menampilkan halaman kedaluwarsa.
    *   **JIKA** pengiriman email ke Pemasok gagal, sistem mengubah status menjadi `REQUIRES_MANUAL_REVIEW` dan mencatat error.
    *   **SELAMA** status PO `DRAFT`, `REJECTED`, atau `REQUIRES_MANUAL_REVIEW`, dokumen PO **tidak boleh** diteruskan ke email Pemasok.

--------------------------------------------------------------------------------

##### 2. Aspek: Tampilan & Kondisi Layar
*   **Kondisi Editor Draf** :
    *   Tombol "Simpan Draf" dan "Kirim ke Manajer" hanya aktif jika ada minimal satu barang.
    *   Dialog konfirmasi "Kirim draf ini ke manajer?" sebelum submit.
    *   Setelah `PENDING_APPROVAL` atau `SENT`, tampilan terkunci dan tidak ada aksi edit.
*   **Kondisi Email Client Manager** :
    *   Tampilan HTML Email responsif memuat ringkasan tabel barang, tombol hijau (Approve), dan tombol merah (Reject).
*   **Kondisi Web Landing Page Response (Browser Manager)** :
    *   **Sukses**: aksen hijau dan pesan "Persetujuan PO berhasil diproses" beserta nomor PO dan status baru.
    *   **Re-click / Idempotent**: aksen amber dan pesan "Tautan persetujuan ini sudah pernah digunakan sebelumnya."
    *   **Belum diajukan**: aksen amber dan pesan "PO masih berstatus draf dan belum diajukan ke manajer."
    *   **Token Expired**: aksen merah dan pesan "Token persetujuan sudah kedaluwarsa."
    *   **Token Invalid**: aksen merah dan pesan "Token persetujuan tidak ditemukan atau sudah kedaluwarsa."

--------------------------------------------------------------------------------

##### 3. Aspek: Data & Validasi
*   **Query Parameters (HTTP Approval Request)** :
    *   `token` (String, Required, 32 karakter heksadesimal)
    *   `action` (String Enum, Required: `'approve'` | `'reject'`)
*   **Masa Berlaku Token (TTL)** :
    *   Maksimal **48 jam** sejak `submitted_at`.
*   **Status yang Boleh Di-submit** :
    *   `DRAFT`, `REJECTED`, `REQUIRES_MANUAL_REVIEW`.
*   **Status yang Boleh Di-approve / Reject** :
    *   Hanya `PENDING_APPROVAL`.

--------------------------------------------------------------------------------

##### 4. Aspek: Error & Pengecualian
*   **SMTP Service Outage (Gagal Kirim Email)** :
    *   Retry SMTP memakai satu percobaan ulang dengan backoff 2 detik lewat email queue. Jika tetap gagal, status PO menjadi `REQUIRES_MANUAL_REVIEW`.
*   **Token Tidak Ditemukan / HTTP 404** :
    *   Kembalikan HTTP 404 dengan pesan `"Token persetujuan tidak valid"`.
*   **Action Tidak Valid / HTTP 400** :
    *   Kembalikan HTTP 400 dengan pesan `"Parameter action harus approve atau reject"`.
*   **PDF Gagal Disiapkan saat Submit** :
    *   Kembalikan HTTP 502 dan status PO tidak berubah.

--------------------------------------------------------------------------------

##### 5. Aspek: Hak Akses
*   **Public HTTP Access (Protected by Token)** :
    *   Endpoint `/api/po/approval` dapat diakses tanpa login password, dilindungi token acak high-entropy 32 karakter.
    *   Endpoint ini tidak memerlukan header `Authorization: Bearer`; autentikasi JWT hanya berlaku untuk dashboard dan endpoint data.
*   **Staf Inventori / Procurement Admin** :
    *   Hanya admin yang dapat memanggil `PUT /api/po-draft/{id}` dan `POST /api/po-draft/{id}/submit`.
*   **Operations Manager** :
    *   Memiliki wewenang eksklusif untuk menyetujui (`SENT`) atau menolak (`REJECTED`) dokumen PO.
    *   Manager dapat login ke dashboard dengan role `manager` (read-only), tetapi aksi approve/reject tetap dilakukan dari tautan email, bukan dari sesi dashboard.

--------------------------------------------------------------------------------

##### 6. Aspek: Jumlah Data & Kecepatan
*   **Volume Data** :
    *   Menangani hingga 100 permintaan persetujuan email per hari.
*   **Target Waktu & Performa** :
    *   Respons submit tidak menunggu email selesai terkirim.
    *   Response time HTTP Handler sampai render halaman konfirmasi: **< 1.0 detik**.

--------------------------------------------------------------------------------

##### 7. Aspek: Bukan Bagian Ini (Out-of-Scope)
*   Modul ini **TIDAK** mencakup negosiasi harga atau revisi kuantitas PO langsung dari email.
*   Modul ini **TIDAK** mencakup tanda tangan digital biometrik/SSL PKI certificate.
*   Modul ini **TIDAK** mencakup approve/reject dari dashboard.
