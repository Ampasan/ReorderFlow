### Tasks Roadmap: FRD-04 Inventory Dashboard UI (ReorderFlow)

--------------------------------------------------------------------------------

##### Phase 0: Autentikasi & Session Guard
*  [ ] **T-4.0a** : Buat tipe `src/types/auth.ts` (`User`, `UserRole`, `LoginResponse`).
*  [ ] **T-4.0b** : Implementasikan `src/services/api.ts` dengan `fetch` wrapper, `VITE_API_BASE_URL`, header Bearer token, timeout 20 detik, dan penanganan `401`/`403`.
*  [ ] **T-4.0c** : Implementasikan `src/services/authService.ts` (`login`, `me`), `src/context/AuthProvider.tsx`, `src/context/authContext.ts`, dan `useAuth`.
*  [ ] **T-4.0d** : Buat `src/pages/LoginPage.tsx` dengan layout split screen, form email/password, loading state, dan error banner.
*  [ ] **T-4.0e** : Buat `src/components/ProtectedRoute.tsx` dan pasang di router; arahkan ke `/login` jika token kosong/kedaluwarsa.
*  [ ] **T-4.0f** : Sembunyikan aksi khusus admin (scan, opname, edit draf, submit) untuk role `manager`.

---

##### Phase 1: Frontend Setup & Types (React + TypeScript)
*  [ ] **T-4.1** : Inisialisasi project React Vite TypeScript dan install Tailwind CSS, React Router DOM, dan React Hot Toast. Tidak memakai Axios atau library ikon eksternal.
*  [ ] **T-4.2** : Buat definisi tipe TypeScript di `src/types/auth.ts`, `src/types/api.ts`, `src/types/dashboard.ts`, `src/types/stok.ts`, dan `src/types/po.ts`.
*  [ ] **T-4.3** : Konfigurasi `src/services/api.ts` dengan base URL dari `VITE_API_BASE_URL` tanpa akhiran `/api`.

---

##### Phase 2: UI Component Development
*  [ ] **T-4.4** : Buat komponen layout `AppShell.tsx` (sidebar, top bar mobile, skip link) dan `Sidebar.tsx`. Tidak ada komponen Navbar terpisah.
*  [ ] **T-4.5** : Buat komponen `StatusBadge.tsx` dengan label `Normal`, `Low Stock`, `Review`, `Draf`, `Menunggu`, `Terkirim`, `Ditolak`.
*  [ ] **T-4.6** : Buat komponen `TableSkeleton.tsx`, `EmptyState.tsx`, `ErrorState.tsx`, `PageHeader.tsx`, `KpiCard.tsx`, `FilterTabs.tsx`, `Modal.tsx`, `ConfirmDialog.tsx`, dan `DetailDialog.tsx`.
*  [ ] **T-4.7** : Implementasikan custom hooks `useResource.ts`, `useDashboard.ts`, `useStock.ts`, `useScan.ts`, `useStockCorrection.ts`, dan `usePOLog.ts`.
*  [ ] **T-4.8** : Buat halaman `Dashboard.tsx` (banner + 5 Kartu KPI + cuplikan low stock), `StockList.tsx` (tabel stok + tab + scan + opname), dan `POLogList.tsx` (tabel PO + 6 tab + filter pemasok + detail).

---

##### Phase 3: Editor Draf & Opname
*  [ ] **T-4.9** : Buat `src/pages/PODraftEditor.tsx` untuk rute `/po-log/:id/draft`, memuat `GET /api/po-draft/{id}` dan daftar stok, dengan aksi tambah/hapus/ubah qty, `PUT /api/po-draft/{id}`, dan `POST /api/po-draft/{id}/submit`.
*  [ ] **T-4.10** : Buat `src/components/OpnameDialog.tsx` untuk `PATCH /api/stok/{sku}` dengan alasan `DAMAGED`, `MISCOUNT`, atau `RETURN`.
*  [ ] **T-4.11** : Tambahkan tampilan terkunci untuk status `PENDING_APPROVAL` dan `SENT`, serta panel read-only untuk role `manager`.

---

##### Phase 4: Testing & Validation Tasks
*  [ ] **T-4.12** : Uji integrasi frontend dengan backend Go lokal setelah login: verifikasi data stok dan log PO muncul di tabel dengan benar.
*  [ ] **T-4.13** : Uji respon tombol "Lihat PDF" pada tabel PO untuk memastikan file PDF terbuka di tab browser baru.
*  [ ] **T-4.14** : Verifikasi tampilan Skeleton Loader, Empty State, dan Error State saat koneksi API dimatikan.
*  [ ] **T-4.15** : Uji login valid/invalid, redirect otomatis ke `/login` saat token kosong/kedaluwarsa, dan logout.
*  [ ] **T-4.16** : Uji role `manager`: dashboard read-only, tombol scan/opname/edit draf tidak tampil, editor draf read-only, dan request tulis ditolak `403`.
*  [ ] **T-4.17** : Uji alur draf end-to-end: edit qty, simpan, kirim ke manajer, dan verifikasi status menjadi `PENDING_APPROVAL`.
