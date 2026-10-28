### Tasks Roadmap: FRD-05 Autentikasi & Kontrol Akses (ReorderFlow)

--------------------------------------------------------------------------------

##### Phase 1: Backend Auth Foundation (Golang)
*  [ ] **T-5.1** : Tambahkan dependency `github.com/golang-jwt/jwt/v5` dan gunakan `golang.org/x/crypto/bcrypt`.
*  [ ] **T-5.2** : Tambahkan konfigurasi `JWT_SECRET`, `JWT_TTL_HOURS`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `MANAGER_PASSWORD` di `config/config.go` dan `.env.example`.
*  [ ] **T-5.3** : Buat model `User` (`admin` / `manager`), `UserRepository`, dan migrasi tabel `users`.
*  [ ] **T-5.4** : Implementasikan `HashPassword`, `CheckPassword`, `GenerateJWT`, dan `ParseJWT` di `internal/utils`.
*  [ ] **T-5.5** : Implementasikan `AuthService.Login` dan `AuthService.EnsureUser` (bootstrap akun dari env).
*  [ ] **T-5.6** : Implementasikan `AuthHandler.Login` dan `AuthHandler.Me`.
*  [ ] **T-5.7** : Implementasikan middleware `Auth(secret)` dan `RequireRole(role)`.

--------------------------------------------------------------------------------

##### Phase 2: Routing & Otorisasi
*  [ ] **T-5.8** : Daftarkan `POST /api/auth/login` sebagai publik.
*  [ ] **T-5.9** : Proteksi `/api/auth/me`, `/api/stok`, `/api/dashboard`, `/api/po`, `/api/po-log` dengan middleware JWT.
*  [ ] **T-5.10** : Batasi `POST /api/stok/scan` hanya untuk role `admin`.
*  [ ] **T-5.11** : Pastikan `/health` dan `/api/po/approval` tetap publik.
*  [ ] **T-5.12** : Jalankan `EnsureUser` untuk admin dan manager saat startup; log error tanpa membocorkan password.

--------------------------------------------------------------------------------

##### Phase 3: Frontend Auth
*  [ ] **T-5.13** : Buat `src/types/auth.ts`, `src/services/auth.ts`, dan `src/context/AuthContext.tsx`.
*  [ ] **T-5.14** : Konfigurasi Axios `baseURL` dari `VITE_API_BASE_URL` dan interceptor Bearer token.
*  [ ] **T-5.15** : Buat `LoginPage.tsx` dengan loading state dan error banner.
*  [ ] **T-5.16** : Buat `ProtectedRoute.tsx`; redirect ke `/login` jika token kosong atau respons `401`.
*  [ ] **T-5.17** : Sembunyikan aksi khusus admin (scan) dari UI untuk role `manager`.

--------------------------------------------------------------------------------

##### Phase 4: Testing & Validation
*  [ ] **T-5.18** : Unit test `HashPassword`/`CheckPassword` dan round-trip `GenerateJWT`/`ParseJWT`.
*  [ ] **T-5.19** : Uji login valid, password salah, email tidak terdaftar, dan body tidak valid.
*  [ ] **T-5.20** : Uji akses endpoint data tanpa token, token invalid, dan token kedaluwarsa (`401`).
*  [ ] **T-5.21** : Uji manager memanggil `POST /api/stok/scan` (`403`) dan admin berhasil (`200`).
*  [ ] **T-5.22** : Uji `/api/po/approval` tetap bisa diakses tanpa login.
*  [ ] **T-5.23** : Uji `AutoMigrate` membuat tabel `users` di non-production dan migrasi SQL di production.
