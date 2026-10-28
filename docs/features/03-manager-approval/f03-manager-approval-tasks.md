### Tasks Roadmap: FRD-03 Persetujuan Manajer & Email Workflow (ReorderFlow)

--------------------------------------------------------------------------------

##### Phase 1: Backend Service & Utility Setup (Golang)
*  [ ] **T-3.1** : Implementasikan generator token acak `token_generator.go` menggunakan pustaka `crypto/rand`.
*  [ ] **T-3.2** : Buat compiler template email HTML untuk ringkasan PO ke Manager dan lampiran PDF ke Pemasok di `internal/utils/email_sender.go`.
*  [ ] **T-3.3** : Implementasikan `ApprovalService` di `internal/service/approval_service.go` untuk menangani perubahan status state transition (`DRAFT` -> `SENT` / `REJECTED`) dan validasi *idempotency*.
*  [ ] **T-3.4** : Implementasikan `ApprovalHandler` di `internal/handler/approval_handler.go` untuk mengeksekusi request HTTP GET `/api/po/approval` dan merender halaman HTML respon.
*  [ ] **T-3.5** : Daftarkan route `/api/po/approval` di `cmd/server/main.go`.

--------------------------------------------------------------------------------

##### Phase 2: Testing & Validation Tasks
*  [ ] **T-3.6** : Lakukan pengujian pengiriman email menggunakan Mailtrap / SMTP Test Server.
*  [ ] **T-3.7** : Uji skenario persetujuan: klik tombol Approve di email dan verifikasi status DB berubah menjadi `SENT` serta email terkirim ke Pemasok.
*  [ ] **T-3.8** : Uji skenario idempotency: klik ulang tautan persetujuan dan pastikan sistem menolak eksekusi ganda dengan pesan warning.
*  [ ] **T-3.9** : Verifikasi `/api/po/approval` tetap dapat diakses tanpa login/Bearer token.
*  [ ] **T-3.10** : Verifikasi login manager (role `manager`) tidak membuka akses approve/reject dari dashboard; aksi tetap hanya lewat tautan email.
