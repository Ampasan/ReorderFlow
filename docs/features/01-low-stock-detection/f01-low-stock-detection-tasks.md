### Implementasi dan Validasi: FRD-01 Deteksi Low-Stock

Implementasi backend untuk pemindaian, pencegahan duplikasi, dan jadwal harian sudah ada. Checklist pengujian manual tetap terbuka karena hasilnya belum dicatat di repositori.

--------------------------------------------------------------------------------

##### Phase 1: Database & Backend Tasks (Golang)
*  [ ] **T-1.1** : Jalankan DDL SQL tabel `pemasok` dan `stok` di Supabase SQL Editor.
*  [x] **T-1.2** : Model stok dan pemasok tersedia di `internal/model/`.
*  [x] **T-1.3** : `StokRepository` mengambil SKU yang mencapai ROP.
*  [x] **T-1.4** : `DetectionService` menerapkan aturan ROP dan lock Redis dengan fallback lock proses lokal.
*  [x] **T-1.5** : `GetActiveReferences()` memeriksa PO aktif per SKU dan pemasok. `DRAFT`, `PENDING_APPROVAL`, `REJECTED`, dan `PARTIALLY_RECEIVED` selalu aktif; `SENT` aktif selama 7 hari.
*  [x] **T-1.6** : Cron memakai timezone `Asia/Jakarta` dan berjalan setiap hari pukul 08.00.
*  [x] **T-1.7** : Handler `POST /api/stok/scan` tersedia dan hanya menerima role `admin`.

--------------------------------------------------------------------------------

##### Phase 2: Testing & Validation Tasks
*  [ ] **T-1.8** : Lakukan pengujian unit/manual pada endpoint `POST /api/stok/scan` via Postman/cURL dengan Bearer token admin.
*  [ ] **T-1.9** : Uji skenario duplikasi: jalankan scan 2x berturut-turut untuk memastikan `skipped_active_po` berfungsi.
*  [ ] **T-1.10** : Verifikasi penanganan anomali data (stok negatif & ROP `<= 0`) dengan status `REQUIRES_MANUAL_REVIEW`.
*  [ ] **T-1.11** : Verifikasi `POST /api/stok/scan` tanpa token menghasilkan `401` dan dengan token manager menghasilkan `403`.
