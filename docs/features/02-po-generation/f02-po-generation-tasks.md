### Tasks Roadmap: FRD-02 Pembuatan Draf PDF PO (ReorderFlow)

--------------------------------------------------------------------------------

##### Phase 1: Database & Storage Setup (Supabase)
*  [ ] **T-2.1** : Jalankan DDL SQL tabel `po_log` dan `po_detail` di Supabase SQL Editor.
*  [ ] **T-2.2** : Buat Storage Bucket `po-documents` di Supabase Dashboard dengan akses Public Read.

--------------------------------------------------------------------------------

##### Phase 2: Backend Development (Golang)
*  [ ] **T-2.3** : Buat file domain model `internal/model/po_log.go`.
*  [ ] **T-2.4** : Implementasikan utilitas layout PDF di `internal/utils/pdf_generator.go` menggunakan `github.com/jung-kurt/gofpdf`.
*  [ ] **T-2.5** : Buat helper pengunggah file di `internal/utils/supabase_storage.go` untuk mengunggah byte PDF ke Supabase Storage.
*  [ ] **T-2.6** : Implementasikan `PDFService` di `internal/service/pdf_service.go` yang menangani pengelompokan SKU per pemasok, pembuatan nomor PO, rendering PDF, dan penyimpanan ke `po_log`.
*  [ ] **T-2.7** : Tambahkan penanganan retry exponential backoff (3x) jika pengunggahan PDF gagal.

--------------------------------------------------------------------------------

##### Phase 3: Testing & Validation Tasks
*  [ ] **T-2.8** : Lakukan pengujian pembuatan PDF dengan data 5 SKU dan verifikasi tampilan layout file PDF A4.
*  [ ] **T-2.9** : Uji akses tautan URL publik PDF di browser untuk memastikan dokumen dapat diunduh tanpa error 403/404.
*  [ ] **T-2.10** : Verifikasi `GET /api/po` memerlukan Bearer token (admin/manager) dan URL PDF tetap dapat dibuka langsung dari Supabase Storage.
