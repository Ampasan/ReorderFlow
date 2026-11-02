### Tasks Roadmap: FRD-06 Goods Receipt (ReorderFlow)

--------------------------------------------------------------------------------

##### Phase 0: Skema Data & Migrasi
*  [ ] **T-6.0a** : Tambah konstanta `POStatusPartiallyReceived` dan `POStatusReceived` di `backend/internal/model/po_log.go`.
*  [ ] **T-6.0b** : Buat model `Penerimaan` dan `PenerimaanDetail` di `backend/internal/model/penerimaan.go`.
*  [ ] **T-6.0c** : Perbarui `backend/migrations/001_schema.sql`: constraint `po_log_status_check` dengan dua status baru, tabel `po_penerimaan` dan `po_penerimaan_detail`, serta index-nya. Tabel penerimaan diletakkan setelah tabel `users` karena ada FK `actor_id`.
*  [ ] **T-6.0d** : Tambahkan `db.AutoMigrate(&model.Penerimaan{}, &model.PenerimaanDetail{})` sebagai call terpisah di blok `cfg.Env != "production"` pada `backend/cmd/server/main.go`.
*  [ ] **T-6.0e** : Perbarui `backend/migrations/002_seed.sql` agar ikut mengosongkan `po_penerimaan_detail` dan `po_penerimaan`.

---

##### Phase 1: Repository & Service
*  [ ] **T-6.1a** : Buat `backend/internal/repository/penerimaan_repository.go` dengan `GetSummary`, `RecordReceipt`, helper `receivedTotals`, dan `stokNames`.
*  [ ] **T-6.1b** : Tulis `RecordReceipt` sebagai satu transaksi: lock baris PO, validasi status, validasi SKU dan qty, insert header dan detail, increment `stok_saat_ini` dengan `gorm.Expr`, lalu hitung status baru.
*  [ ] **T-6.1c** : Definisikan sentinel error `ErrPONotReceivable`, `ErrPenerimaanEmpty`, `ErrPenerimaanItemInvalid`, dan `ErrQtyOverRemaining` di paket repository.
*  [ ] **T-6.1d** : Tambahkan `model.POStatusPartiallyReceived` ke `activeStatuses` dan `openStatuses` pada `PORepository.GetActiveReferences`.
*  [ ] **T-6.1e** : Buat `backend/internal/service/penerimaan_service.go` dengan `Get` dan `Record` (memanggil `cache.Invalidate()` setelah sukses).

---

##### Phase 2: Handler, Route, dan Dashboard
*  [ ] **T-6.2a** : Buat `backend/internal/handler/penerimaan_handler.go` dengan `Get`, `Create`, parsing `:id`, dan pemetaan error 400/403/404/409/500.
*  [ ] **T-6.2b** : Daftarkan route `GET /api/po-penerimaan/:id` dan `POST /api/po-penerimaan/:id` (admin) di `backend/cmd/server/main.go`, lalu wiring repo, service, dan handler.
*  [ ] **T-6.2c** : Tambah dua status baru ke `cache.keys` dan switch `cache.POKey`.
*  [ ] **T-6.2d** : Tambah `PartiallyReceivedPOCount` dan `ReceivedPOCount` di `model.DashboardSummary`, lalu isi dari `poCounts` di `dashboard_handler.go`.

---

##### Phase 3: Frontend Tipe, Service, dan Hook
*  [ ] **T-6.3a** : Perluas `POStatus` di `frontend/src/types/po.ts` dan tambah tipe `PenerimaanItem`, `PenerimaanRiwayatItem`, `PenerimaanRiwayat`, `PenerimaanView`, `PenerimaanItemInput`.
*  [ ] **T-6.3b** : Tambah dua field KPI di `frontend/src/types/dashboard.ts`.
*  [ ] **T-6.3c** : Tambah dua filter dan dua status di `frontend/src/utils/constants.ts`.
*  [ ] **T-6.3d** : Tambah `getPenerimaan()` dan `receivePO()` di `frontend/src/services/poService.ts`.
*  [ ] **T-6.3e** : Buat `frontend/src/hooks/usePenerimaan.ts` dengan pola `useStockCorrection`.
*  [ ] **T-6.3f** : Tambah prop `size?: 'md' | 'lg'` di `frontend/src/components/Modal.tsx` tanpa mengubah tampilan default dialog lain.

---

##### Phase 4: Komponen dan Halaman
*  [ ] **T-6.4a** : Tambah label dan style `PARTIALLY_RECEIVED` serta `RECEIVED` di `StatusBadge.tsx`.
*  [ ] **T-6.4b** : Buat `frontend/src/components/TerimaBarangDialog.tsx` dengan tabel qty, riwayat penerimaan, validasi per baris, dan footer aksi.
*  [ ] **T-6.4c** : Tambah prop `onReceive` dan tombol **Terima Barang** di `POLogTable.tsx` untuk status `SENT` dan `PARTIALLY_RECEIVED`.
*  [ ] **T-6.4d** : Integrasikan dialog di `POLogList.tsx`: state `receiveTarget`, fetch `GET /api/po-penerimaan/{id}`, tombol di footer `DetailDialog`, dan `EMPTY_COPY` untuk dua status baru.
*  [ ] **T-6.4e** : Tambah entri `PARTIALLY_RECEIVED` dan `RECEIVED` di `LOCKED_COPY` `PODraftEditor.tsx`.
*  [ ] **T-6.4f** : Tambah kartu KPI keenam di `Dashboard.tsx`, ubah grid ke `xl:grid-cols-6`, dan sesuaikan jumlah skeleton menjadi 6.

---

##### Phase 5: Dokumentasi
*  [ ] **T-6.5a** : Perbarui `docs/PRD.md` (lingkup dan daftar fitur), `docs/FRD.md` (hak akses, aturan, istilah, data, lifecycle, fungsi, AC, out-of-scope), `docs/IA.md` (sitemap, flow, entity map, screen state, component tree), dan `docs/DESIGN.md` (badge, kartu KPI, dialog).
*  [ ] **T-6.5b** : Perbarui `backend/README.md` (endpoint, migrasi, alur) dan `PRODUCT.md` (capabilities, evidence).
*  [ ] **T-6.5c** : Rapikan butir out-of-scope di `docs/features/04-inventory-dashboard/frd-04-inventory-dashboard.md` pada F-04.4.

---

##### Phase 6: Testing & Validasi
*  [ ] **T-6.6a** : `go build ./...` dan `go test ./...` di `backend`.
*  [ ] **T-6.6b** : Jalankan ulang `001_schema.sql` lalu pastikan tabel penerimaan dan constraint baru terbentuk.
*  [ ] **T-6.6c** : Uji API manual: terima sebagian (`PARTIALLY_RECEIVED`), terima sisanya (`RECEIVED`), qty melebihi sisa (400), PO `DRAFT` (409), role manager (403).
*  [ ] **T-6.6d** : Verifikasi `POST /api/stok/scan` tidak membuat draf duplikat saat PO `PARTIALLY_RECEIVED`, dan tidak lagi menahan SKU setelah `RECEIVED`.
*  [ ] **T-6.6e** : `npm run build` di `frontend` untuk memastikan semua `Record` exhaustive lolos.
*  [ ] **T-6.6f** : Uji UI di `/po-log?status=SENT`: dialog tampil di desktop dan mobile, input tervalidasi, badge berubah, dan stok di `/stok` bertambah.
