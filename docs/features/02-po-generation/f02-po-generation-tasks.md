### Implementasi dan Validasi: FRD-02 Pembuatan Draf PDF PO

Backend saat ini membuat PDF draf per pemasok, menyimpannya ke Supabase Storage, dan menyediakan aksi regenerasi. Pengaturan bucket dan migrasi pada environment tertentu perlu diverifikasi di environment tersebut. Checklist uji manual tetap terbuka.

--------------------------------------------------------------------------------

##### Phase 1: Database & Storage Setup (Supabase)
*  [ ] **T-2.1** : Jalankan DDL SQL tabel `po_log` dan `po_detail` di Supabase SQL Editor.
*  [ ] **T-2.2** : Buat Storage Bucket `po-documents` di Supabase Dashboard dengan akses Public Read.

--------------------------------------------------------------------------------

##### Phase 2: Backend Development (Golang)
*  [x] **T-2.3** : Model PO dan detail PO tersedia di `internal/model/`.
*  [x] **T-2.4** : Generator PDF menggunakan `gofpdf`.
*  [x] **T-2.5** : Helper Supabase Storage mengunggah PDF.
*  [x] **T-2.6** : `PDFService` mengelompokkan SKU per pemasok, membuat nomor PO, merender PDF, dan menyimpan PO.
*  [x] **T-2.7** : Upload PDF memakai retry dengan backoff.
*  [x] **T-2.7b** : PDF dapat dibuat ulang saat draf diperbarui, diminta melalui `POST /api/po-draft/:id/regenerate-pdf`, atau dikirim ke manager.

--------------------------------------------------------------------------------

##### Phase 3: Testing & Validation Tasks
*  [ ] **T-2.8** : Lakukan pengujian pembuatan PDF dengan data 5 SKU dan verifikasi tampilan layout file PDF A4.
*  [ ] **T-2.9** : Uji akses tautan URL publik PDF di browser untuk memastikan dokumen dapat diunduh tanpa error 403/404.
*  [ ] **T-2.10** : Verifikasi `GET /api/po` memerlukan Bearer token (admin/manager) dan URL PDF tetap dapat dibuka langsung dari Supabase Storage.
