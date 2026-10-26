### Tasks Roadmap: FRD-04 Inventory Dashboard UI (ReorderFlow)

--------------------------------------------------------------------------------

##### Phase 1: Frontend Setup & Types (React + TypeScript)
*  [ ] **T-4.1** : Inisialisasi project React Vite TypeScript dan install Tailwind CSS, Lucide React, Axios, dan React Router DOM.
*  [ ] **T-4.2** : Buat definisi tipe TypeScript di `src/types/stok.ts` dan `src/types/po.ts`.
*  [ ] **T-4.3** : Konfigurasi Axios client instance di `src/services/api.ts` dengan BaseURL mengarah ke backend Go.

--------------------------------------------------------------------------------

##### Phase 2: UI Component Development
*  [ ] **T-4.4** : Buat komponen layout `Sidebar.tsx` dan `Navbar.tsx`.
*  [ ] **T-4.5** : Buat komponen `StatusBadge.tsx` dengan variasi warna sesuai status stok dan status PO.
*  [ ] **T-4.6** : Buat komponen `TableSkeleton.tsx` untuk indikator memuat (*loading state*).
*  [ ] **T-4.7** : Implementasikan custom hooks `useStock.ts` dan `usePOLog.ts` untuk fetching data dari API.
*  [ ] **T-4.8** : Buat halaman `Dashboard.tsx` (Kartu KPI + Ringkasan), `StockList.tsx` (Tabel Stok), dan `POLogList.tsx` (Tabel PO + Tombol Lihat PDF).

--------------------------------------------------------------------------------

##### Phase 3: Testing & Validation Tasks
*  [ ] **T-4.9** : Uji integrasi frontend dengan backend Go lokal: verifikasi data stok dan log PO muncul di tabel dengan benar.
*  [ ] **T-4.10** : Uji respon tombol "Lihat PDF" pada tabel PO untuk memastikan file PDF terbuka di tab browser baru.
*  [ ] **T-4.11** : Verifikasi tampilan Skeleton Loader, Empty State, dan Error Alert Banner saat koneksi API dimatikan.
