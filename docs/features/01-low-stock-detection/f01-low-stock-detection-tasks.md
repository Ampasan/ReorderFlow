### Tasks Roadmap: FRD-01 Deteksi Low-Stock (ReorderFlow)

--------------------------------------------------------------------------------

##### Phase 1: Database & Backend Tasks (Golang)
*  [ ] **T-1.1** : Jalankan DDL SQL tabel `pemasok` dan `stok` di Supabase SQL Editor.
*  [ ] **T-1.2** : Buat file domain model `internal/model/stok.go` dan `internal/model/pemasok.go`.
*  [ ] **T-1.3** : Implementasikan `StokRepository` di `internal/repository/stok_repository.go` untuk query GORM `GetLowStockItems()`.
*  [ ] **T-1.4** : Implementasikan `DetectionService` di `internal/service/detection_service.go` lengkap dengan filter ROP (`stok <= reorder_point`) dan Redis Lock (`lock:scan:active`).
*  [ ] **T-1.5** : Buat fungsi `HasActivePO()` di `internal/repository/po_repository.go` untuk mengecek status `DRAFT`/`SENT` 7 hari terakhir.
*  [ ] **T-1.6** : Inisialisasi cron job `low_stock_job.go` menggunakan `robfig/cron/v3` di `internal/job/`.
*  [ ] **T-1.7** : Buat HTTP Handler `POST /api/v1/stok/scan` pada `internal/handler/stock_handler.go` dan daftarkan route.

--------------------------------------------------------------------------------

##### Phase 2: Testing & Validation Tasks
*  [ ] **T-1.8** : Lakukan pengujian unit/manual pada endpoint `POST /api/v1/stok/scan` via Postman/cURL.
*  [ ] **T-1.9** : Uji skenario duplikasi: jalankan scan 2x berturut-turut untuk memastikan `skipped_active_po` berfungsi.
*  [ ] **T-1.10** : Verifikasi penanganan anomali data (stok negatif & ROP `<= 0`) dengan status `REQUIRES_MANUAL_REVIEW`.
