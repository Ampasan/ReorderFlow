### Implementasi dan Validasi: FRD-03 Persetujuan Manajer

Alur submit, token persetujuan, halaman publik, transisi status, dan antrean email sudah ada di backend. Pengujian SMTP dan penerimaan email perlu diverifikasi pada konfigurasi yang digunakan.

--------------------------------------------------------------------------------

##### Phase 1: Backend Service & Utility Setup (Golang)
*  [x] **T-3.1** : Token persetujuan dibuat secara acak.
*  [x] **T-3.2** : Backend mengirim email HTML ke manager dan email PO ke pemasok.
*  [x] **T-3.3** : `DraftService` menangani perubahan draf dan submit ke status `PENDING_APPROVAL`.
*  [x] **T-3.3b** : `ApprovalService` menangani status approve/reject, masa berlaku 48 jam, lock Redis opsional, dan conditional update untuk idempotensi.
*  [x] **T-3.4** : `ApprovalHandler` menyajikan halaman HTML dari `GET /api/po/approval`.
*  [x] **T-3.5** : Route persetujuan publik dan route draf terautentikasi terdaftar. Hanya operasi perubahan draf dan submit yang memerlukan role `admin`.

--------------------------------------------------------------------------------

##### Phase 2: Testing & Validation Tasks
*  [ ] **T-3.6** : Lakukan pengujian pengiriman email menggunakan Mailtrap / SMTP Test Server.
*  [ ] **T-3.7** : Uji skenario persetujuan: klik tombol Approve di email dan verifikasi status DB berubah menjadi `SENT` serta email terkirim ke Pemasok.
*  [ ] **T-3.8** : Uji skenario idempotency: klik ulang tautan persetujuan dan pastikan sistem menolak eksekusi ganda dengan pesan warning.
*  [ ] **T-3.9** : Verifikasi `/api/po/approval` tetap dapat diakses tanpa login/Bearer token.
*  [ ] **T-3.10** : Verifikasi login manager (role `manager`) tidak membuka akses approve/reject dari dashboard; aksi tetap hanya lewat tautan email.
