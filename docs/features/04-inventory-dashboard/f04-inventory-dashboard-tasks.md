### Tasks Roadmap: FRD-04 Inventory Dashboard UI (ReorderFlow)

--------------------------------------------------------------------------------

##### Phase 0: Autentikasi & Session Guard
*  [ ] **T-4.0a** : Buat tipe `src/types/auth.ts` (`User`, `UserRole`, `LoginResponse`).
*  [ ] **T-4.0b** : Implementasikan `src/services/api.ts` dengan Axios instance, `VITE_API_BASE_URL`, request interceptor Bearer token, dan response interceptor `401`/`403`.
*  [ ] **T-4.0c** : Implementasikan `src/services/auth.ts` (`login`, `me`, `logout`) dan `src/context/AuthContext.tsx` + `useAuth`.
*  [ ] **T-4.0d** : Buat `src/pages/LoginPage.tsx` dengan form email/password, loading state, dan error banner.
*  [ ] **T-4.0e** : Buat `src/components/ProtectedRoute.tsx` dan pasang di router; arahkan ke `/login` jika token kosong/kedaluwarsa.
*  [ ] **T-4.0f** : Sembunyikan tombol "Pindai Stok Sekarang" untuk role `manager`.

---

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
*  [ ] **T-4.9** : Uji integrasi frontend dengan backend Go lokal setelah login: verifikasi data stok dan log PO muncul di tabel dengan benar.
*  [ ] **T-4.10** : Uji respon tombol "Lihat PDF" pada tabel PO untuk memastikan file PDF terbuka di tab browser baru.
*  [ ] **T-4.11** : Verifikasi tampilan Skeleton Loader, Empty State, dan Error Alert Banner saat koneksi API dimatikan.
*  [ ] **T-4.12** : Uji login valid/invalid, redirect otomatis ke `/login` saat token kosong/kedaluwarsa, dan logout.
*  [ ] **T-4.13** : Uji role `manager`: dashboard read-only, tombol scan tidak tampil, dan request `POST /api/stok/scan` ditolak `403`.
