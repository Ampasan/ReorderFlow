# Dokumentasi Testing — ReorderFlow

> Dokumen ini mencakup semua jenis testing yang diterapkan pada proyek ReorderFlow:
> unit tests, functional tests, integration tests, end-to-end (E2E) tests, dan UAT (User Acceptance Testing).

---

## Daftar Isi

1. [Ringkasan Testing Stack](#1-ringkasan-testing-stack)
2. [Cara Menjalankan Tests](#2-cara-menjalankan-tests)
3. [Unit Tests — Backend (Go)](#3-unit-tests--backend-go)
4. [Unit Tests — Frontend (Vitest)](#4-unit-tests--frontend-vitest)
5. [Functional Tests — Frontend](#5-functional-tests--frontend)
6. [Integration Tests — Frontend](#6-integration-tests--frontend)
7. [End-to-End (E2E) Tests — Playwright](#7-end-to-end-e2e-tests--playwright)
8. [UAT — User Acceptance Testing](#8-uat--user-acceptance-testing)
9. [Coverage Report](#9-coverage-report)
10. [CI/CD](#10-cicd)

---

## 1. Ringkasan Testing Stack

| Layer | Framework | Lokasi |
|---|---|---|
| Backend unit & integration | Go `testing` (stdlib) | `backend/internal/**/*_test.go` |
| Frontend unit | Vitest + Testing Library | `frontend/src/test/unit/` |
| Frontend functional | Vitest + Testing Library + MSW | `frontend/src/test/functional/` |
| Frontend integration | Vitest + Testing Library + MSW | `frontend/src/test/integration/` |
| E2E | Playwright | `frontend/src/test/e2e/` |
| UAT | Dokumen manual | Seksi 8 di bawah |

---

## 2. Cara Menjalankan Tests

### Backend (Go)

```bash
cd backend

# Jalankan semua test
go test ./...

# Verbose output
go test ./... -v

# Coverage
go test ./... -cover

# HTML coverage report
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out
```

### Frontend — Unit, Functional, Integration (Vitest)

```bash
cd frontend

# Jalankan sekali (CI/non-watch mode)
npm run test
# atau
npx vitest run

# Watch mode (development)
npm run test:watch

# Dengan coverage report
npm run test:coverage
# Laporan tersedia di frontend/coverage/index.html
```

### Frontend — E2E (Playwright)

```bash
# Prasyarat: backend dan frontend harus berjalan
# Terminal 1:
cd backend && go run ./cmd/server

# Terminal 2:
cd frontend && npm run dev

# Terminal 3 — jalankan E2E:
cd frontend
npm run test:e2e

# Mode headed (browser terlihat):
npm run test:e2e:headed

# Lihat laporan HTML:
npm run test:e2e:report
```

**Environment variables untuk E2E:**

```bash
# Buat file frontend/.env.test atau export langsung:
E2E_ADMIN_EMAIL=admin@demo.id
E2E_ADMIN_PASSWORD=adminpass123
E2E_MANAGER_EMAIL=manager@demo.id
E2E_MANAGER_PASSWORD=managerpass123
```

---

## 3. Unit Tests — Backend (Go)

### 3.1 Model Tests (`backend/internal/model/`)

**File:** `stok_test.go`, `user_test.go`

| Test | Deskripsi | Hasil |
|---|---|---|
| `TestStokStatus_Normal` | Stok di atas reorder point → NORMAL | ✅ |
| `TestStokStatus_LowStock` | Stok ≤ reorder point → LOW_STOCK | ✅ |
| `TestStokStatus_ManualReview` | Stok negatif / reorder=0 / min=0 → MANUAL_REVIEW | ✅ |
| `TestStokStatus_LowStockWhenStokIsZeroWithValidConfig` | Stok=0 dengan config valid → LOW_STOCK | ✅ |
| `TestPOStatusConstants` | Nilai konstanta status PO sesuai spec | ✅ |
| `TestStokTableName` | TableName() stok = "stok" | ✅ |
| `TestPOLogTableName` | TableName() po_log = "po_log" | ✅ |
| `TestPODetailTableName` | TableName() po_detail = "po_detail" | ✅ |
| `TestUserTableName` | TableName() users = "users" | ✅ |
| `TestRoleConstants` | RoleAdmin = "admin", RoleManager = "manager" | ✅ |

### 3.2 Cache Tests (`backend/internal/cache/`)

| Test | Deskripsi |
|---|---|
| `TestMemoryCacheGetSet` | Set/Get nilai di in-memory cache |
| `TestMemoryCacheInvalidate` | Invalidasi key spesifik |
| `TestMemoryCacheExpiration` | Entry expired tidak dikembalikan |

### 3.3 Auth/JWT Utils Tests (`backend/internal/utils/`)

| Test | Deskripsi |
|---|---|
| `TestHashAndCheckPassword` | bcrypt hash dan verifikasi |
| `TestGenerateAndParseJWT` | Generate JWT dan parse kembali |
| `TestParseJWTRejectsWrongSecret` | JWT dengan secret salah ditolak |
| `TestGenerateToken` | Random token generator |

### 3.4 Middleware Tests (`backend/internal/middleware/`)

| Test | Deskripsi |
|---|---|
| `TestCORSAllowsConfiguredOriginAndPreservesVary` | CORS mengizinkan origin terdaftar |
| `TestCORSRejectsUnconfiguredOrigin` | CORS menolak origin tidak terdaftar |
| `TestSecurityHeadersAndNoStore` | Security headers dan Cache-Control: no-store |
| `TestGzipCompressesJSON` | Gzip mengompresi respons JSON |
| `TestGzipPassthroughWithoutAcceptEncoding` | Tanpa Accept-Encoding → tidak dikompresi |
| `TestRateLimitBlocksAfterLimit` | Blokir setelah melebihi limit |
| `TestLoginRateLimitSeparatesEmailFromIP` | Rate limit login per kombinasi email+IP |

### 3.5 Rate Limiter Tests (`backend/internal/ratelimit/`)

| Test | Deskripsi |
|---|---|
| `TestAllowWithinLimit` | Request dalam limit → diizinkan |
| `TestAllowResetsAfterWindow` | Counter reset setelah window |
| `TestAllowSeparatesKeys` | Key berbeda tidak saling mempengaruhi |
| `TestAllowWithRedis` | Integrasi dengan Redis mock |

### 3.6 Service Tests (`backend/internal/service/`)

| Test | Deskripsi |
|---|---|
| `TestEnsureUser_RejectsShortPassword` | Password < 8 karakter ditolak |
| `TestEnsureUser_RejectsInvalidRole` | Role tidak valid ditolak |
| `TestEnsureUser_SkipsWhenEmailOrPasswordEmpty` | Email/password kosong → skip |
| `TestLogin_Sukses` | Login dengan kredensial benar berhasil |
| `TestLogin_PasswordSalah` | Password salah → ErrInvalidCredentials |
| `TestLogin_EmailTidakDitemukan` | Email tidak ada → ErrInvalidCredentials |
| `TestLogin_TokenMengandungUserID` | JWT berisi user_id dan role yang benar |
| `TestEmailQueueRunsTask` | Queue memproses task email |
| `TestRetryStopsOnPermanentError` | Retry berhenti saat error permanen |
| `TestStockInsightPromptIncludesAnonymousItemData` | Prompt Gemini menyertakan data item |
| `TestParseStockAnalysisMapsGeminiRecommendationsToStock` | Parse hasil Gemini ke struct stock |

### 3.7 Handler Tests (`backend/internal/handler/`)

| Test | Deskripsi |
|---|---|
| `TestApprovalGETRequiresExplicitPOSTConfirmation` | GET approval menampilkan form konfirmasi |
| `TestApprovalConfirmationEscapesToken` | Token di-escape di HTML (XSS prevention) |
| `TestRegisterFrontend` | SPA files dilayani dengan benar |
| `TestErrorHidesInternalServerDetails` | Error 500 tidak mengekspos detail internal |
| `TestAnalyzeLowStockRequiresGeminiKey` | Endpoint AI butuh GEMINI_API_KEY |

---

## 4. Unit Tests — Frontend (Vitest)

### 4.1 Utils

**`formatter.test.ts`** — `src/utils/formatter.ts`

| Test | Skenario |
|---|---|
| formatNumber | angka besar, kecil, nol, negatif dengan format id-ID |
| formatDateWIB | null/undefined/kosong → "-", tanggal Go zero time → "-", string invalid → "-", tanggal valid → format dengan "WIB" |
| formatLongDate | tanggal spesifik mengandung bulan dan tahun, tanpa argumen → hari ini |

**`authStorage.test.ts`** — `src/utils/authStorage.ts`

| Test | Skenario |
|---|---|
| getToken | null saat kosong, dikembalikan setelah saveSession |
| getUser | null saat kosong, user setelah saveSession, null untuk JSON rusak |
| saveSession | menyimpan token dan user ke localStorage |
| clearSession | menghapus keduanya, tidak error saat dipanggil tanpa sesi |

**`constants.test.ts`** — `src/utils/constants.ts`

| Test | Skenario |
|---|---|
| isStockFilter | valid: all/low/manual; invalid: string lain/null |
| isPOFilter | semua 8 status valid, invalid values |
| STOCK_FILTERS | 3 opsi, opsi pertama "all" |
| PO_FILTERS | 8 opsi |
| OPNAME_REASONS | DAMAGED, MISCOUNT, RETURN |

**`apiError.test.ts`** — `src/types/api.ts`

| Test | Skenario |
|---|---|
| ApiError | membuat error dengan message dan status, instanceof Error |

### 4.2 Components

**`StatusBadge.test.tsx`**

| Test | Skenario |
|---|---|
| 9 status badges | setiap status menampilkan label yang benar dalam bahasa Indonesia |
| merender sebagai span | elemen yang benar |
| warna sesuai tone | REJECTED=rose, NORMAL=emerald, LOW_STOCK=amber |

**`KpiCard.test.tsx`**

| Test | Skenario |
|---|---|
| label dan value | teks ditampilkan |
| hint | opsional, tidak tampil jika tidak ada |
| icon | opsional |
| merender sebagai article | elemen semantik benar |
| tone alert/success/warning/default | kelas warna yang tepat |

**`EmptyState.test.tsx`**

| Test | Skenario |
|---|---|
| title dan description | teks ditampilkan |
| action | opsional, dapat diklik |
| SVG icon | selalu ditampilkan |

**`Modal.test.tsx`**

| Test | Skenario |
|---|---|
| open=false | tidak dirender sama sekali |
| open=true | dialog dan konten dirender |
| judul dan deskripsi | teks ditampilkan |
| tutup via tombol | onClose dipanggil |
| tutup via Escape | onClose dipanggil |
| aria-modal="true" | aksesibilitas |
| footer | opsional |

---

## 5. Functional Tests — Frontend

### 5.1 API Client (`api.test.ts`)

Menguji `src/services/api.ts` secara end-to-end dengan MSW mock.

| Test Group | Skenario |
|---|---|
| get() | GET request berhasil, Authorization header, Accept header, ApiError 404/500 |
| post() | POST berhasil, Content-Type header, ApiError 401 |
| patch() | PATCH berhasil |
| put() | PUT berhasil |
| Unauthorized event | event `reorderflow:unauthorized` dikirim saat 401 (bukan login) |
| Query params | parameter ditambahkan ke URL, nilai undefined diabaikan |

### 5.2 LoginPage (`LoginPage.test.tsx`)

Menguji seluruh flow LoginPage dengan user interaction.

| Test Group | Skenario |
|---|---|
| Render awal | heading, field, tombol, tidak ada error |
| Validasi | email tidak valid, password < 8 karakter, trim email, aria-invalid |
| Submit berhasil | disable form saat loading, simpan token ke localStorage |
| Submit gagal | pesan error server, form aktif kembali, fallback message |
| Aksesibilitas | label/htmlFor, role="alert", aria-busy saat loading |
| Double submit | klik ganda tidak memicu dua request |
| Ikon | SVG WarningIcon muncul di dalam alert |

### 5.3 AuthProvider (`AuthProvider.test.tsx`)

| Test Group | Skenario |
|---|---|
| Status awal | anonymous tanpa token, authenticated dengan token valid |
| Session restore | memverifikasi token ke /api/auth/me, hapus sesi jika expired |
| Logout | status → anonymous, hapus localStorage |
| Unauthorized event | sesi direset saat event `reorderflow:unauthorized` diterima |

### 5.4 ProtectedRoute (`ProtectedRoute.test.tsx`)

| Test Group | Skenario |
|---|---|
| Tidak terautentikasi | redirect ke /login, child tidak dirender |
| Terautentikasi | child dirender, tidak redirect ke login |
| Loading | akhirnya merender halaman setelah token diverifikasi |

---

## 6. Integration Tests — Frontend

Menguji integrasi penuh: komponen → service → API client → MSW mock.

### 6.1 Auth Service (`authService.integration.test.ts`)

| Test | Skenario |
|---|---|
| login() sukses admin | token dan user data benar |
| login() sukses manager | token manager dikembalikan |
| login() gagal 401 | ApiError dengan status 401 dan message benar |
| login() server error | ApiError dilempar |
| getMe() token valid | user data dikembalikan |
| getMe() token expired | ApiError 401 |
| getMe() tanpa token | ApiError 401 |

### 6.2 Stock Service (`stockService.integration.test.ts`)

| Test | Skenario |
|---|---|
| listStock() | array stok, field yang benar, query string status |
| runScan() | scan result dengan field yang benar, error handling |
| analyzeLowStock() | StockAnalysis dengan validasi format, error format tidak valid |
| correctStock() | PATCH request dengan SKU dan payload, ApiError 403 |
| Status validation | semua status valid, LOW_STOCK memiliki stok ≤ reorder_point |

### 6.3 PO Service (`poService.integration.test.ts`)

| Test | Skenario |
|---|---|
| listPO() | array PO, field yang benar, query string status |
| getPO() | detail PO berdasarkan ID, ApiError 404 |
| updateDraft() | PUT request dengan items, error handling |
| submitDraft() | POST ke endpoint submit, status berubah ke PENDING_APPROVAL |
| getPenerimaan() | view dengan items dan riwayat |
| receivePO() | POST dengan items penerimaan |
| FSM validation | semua status PO valid |

---

## 7. End-to-End (E2E) Tests — Playwright

E2E test berjalan terhadap aplikasi yang sudah berjalan (backend + frontend).
Browser: Chromium.

### 7.1 Login Flow (`login.spec.ts`)

| Test Group | Skenario |
|---|---|
| Render dan navigasi | heading, field email/password, tombol, tidak ada error, autofocus |
| Validasi form | email tidak valid, password < 8, submit via Enter |
| Auth admin | login berhasil → /app, token di localStorage, dashboard accessible |
| Auth manager | login berhasil → /app |
| Kredensial salah | pesan error tampil, form aktif kembali |
| Rute terlindungi | /app, /stok, /po-log tanpa login → redirect ke /login |
| Logout | token dihapus dari localStorage |

### 7.2 Halaman Publik (`public-pages.spec.ts`)

| Test Group | Skenario |
|---|---|
| Landing | memuat tanpa error, judul relevan, link navigasi |
| Blog/Artikel | memuat daftar artikel |
| FAQ | memuat halaman, konten ada |
| Tentang | memuat halaman |
| Rute tidak ditemukan | redirect ke / |
| SEO | meta description di landing, noindex di login |

### 7.3 Dashboard dan Fitur (`dashboard.spec.ts`)

| Test Group | Skenario |
|---|---|
| Dashboard admin | KPI cards muncul, sidebar dengan navigasi |
| Halaman Stok admin | tabel stok, filter tab, tombol Scan Stok |
| Halaman PO Log admin | tabel atau empty state, filter status |
| Dashboard manager | accessible, halaman stok accessible |
| Aksesibilitas manager | Scan Stok tidak tersedia untuk manager |
| Aksesibilitas landmark | main landmark, heading pada setiap halaman |

---

## 8. UAT — User Acceptance Testing

### 8.1 Scope

UAT dilakukan oleh pengguna akhir (staf admin dan manager) dengan skenario penggunaan nyata terhadap aplikasi yang sudah di-deploy.

### 8.2 Acceptance Criteria

#### UC-01: Login Admin

| # | Langkah | Expected Result | Status |
|---|---|---|---|
| 1 | Buka `/login` | Halaman login ditampilkan dengan form email dan password | ☐ |
| 2 | Masukkan email admin yang valid | Field terisi tanpa error | ☐ |
| 3 | Masukkan password minimal 8 karakter | Field terisi tanpa error | ☐ |
| 4 | Klik tombol "Masuk" | Loading state muncul (spinner + "Memproses...") | ☐ |
| 5 | Login berhasil | Diarahkan ke `/app` (Dashboard) | ☐ |
| 6 | Token tersimpan di localStorage | Bisa diverifikasi via DevTools | ☐ |

#### UC-02: Validasi Login

| # | Langkah | Expected Result | Status |
|---|---|---|---|
| 1 | Masukkan email format tidak valid (contoh: "abc") | Pesan error "Masukkan alamat email yang valid" muncul | ☐ |
| 2 | Masukkan password 5 karakter | Pesan error "Password minimal 8 karakter" muncul | ☐ |
| 3 | Masukkan email/password salah, klik Masuk | Pesan error dari server tampil dalam kotak alert merah | ☐ |
| 4 | Setelah error, form kembali aktif | Bisa mengetik ulang | ☐ |

#### UC-03: Proteksi Rute

| # | Langkah | Expected Result | Status |
|---|---|---|---|
| 1 | Akses `/app` tanpa login | Diarahkan ke `/login` | ☐ |
| 2 | Akses `/stok` tanpa login | Diarahkan ke `/login` | ☐ |
| 3 | Akses `/po-log` tanpa login | Diarahkan ke `/login` | ☐ |
| 4 | Setelah login, akses `/login` | Diarahkan ke `/app` (tidak menampilkan form login) | ☐ |

#### UC-04: Dashboard Admin

| # | Langkah | Expected Result | Status |
|---|---|---|---|
| 1 | Login sebagai admin, buka `/app` | Dashboard dengan KPI cards ditampilkan | ☐ |
| 2 | KPI cards menampilkan angka | Total Stok, Low Stock, PO Pending ditampilkan | ☐ |
| 3 | Sidebar tersedia | Link ke Dashboard, Stok, PO Log | ☐ |
| 4 | Klik "Stok" di sidebar | Navigasi ke `/stok` | ☐ |
| 5 | Klik "PO Log" di sidebar | Navigasi ke `/po-log` | ☐ |

#### UC-05: Manajemen Stok

| # | Langkah | Expected Result | Status |
|---|---|---|---|
| 1 | Buka `/stok` | Tabel stok ditampilkan dengan kolom SKU, Nama, Stok, Reorder Point, Status | ☐ |
| 2 | Filter "Perlu Reorder" | Tabel hanya menampilkan stok LOW_STOCK | ☐ |
| 3 | Filter "Perlu Peninjauan" | Tabel hanya menampilkan REQUIRES_MANUAL_REVIEW | ☐ |
| 4 | Filter "Semua" | Semua item stok ditampilkan | ☐ |
| 5 | Klik tombol "Scan Stok" | Konfirmasi muncul | ☐ |
| 6 | Konfirmasi scan | Proses scan dimulai, hasil ditampilkan (item dipindai, PO dibuat) | ☐ |
| 7 | Klik tombol koreksi stok (opname) | Dialog opname muncul dengan field stok baru dan alasan | ☐ |
| 8 | Isi stok baru dan pilih alasan MISCOUNT | Klik Simpan → toast sukses muncul | ☐ |

#### UC-06: Koreksi Stok Opname

| # | Langkah | Expected Result | Status |
|---|---|---|---|
| 1 | Pilih item stok, klik tombol koreksi | Dialog OpnameDialog muncul | ☐ |
| 2 | Masukkan stok baru yang valid | Field terisi | ☐ |
| 3 | Pilih alasan: DAMAGED / MISCOUNT / RETURN | Salah satu dipilih | ☐ |
| 4 | Klik Simpan | Stok diperbarui, dialog ditutup, toast sukses | ☐ |
| 5 | Nilai stok baru bukan angka | Validasi mencegah submit | ☐ |

#### UC-07: Riwayat PO (PO Log)

| # | Langkah | Expected Result | Status |
|---|---|---|---|
| 1 | Buka `/po-log` | Tabel PO Log dengan kolom Nomor PO, Pemasok, Status, Tanggal | ☐ |
| 2 | Filter status "DRAFT" | Hanya PO berstatus DRAFT ditampilkan | ☐ |
| 3 | Filter status "Menunggu" | Hanya PO berstatus PENDING_APPROVAL ditampilkan | ☐ |
| 4 | Filter status "Semua" | Semua PO ditampilkan | ☐ |
| 5 | Klik detail PO | Detail dialog muncul dengan daftar item | ☐ |
| 6 | Klik link "Edit Draf" pada PO DRAFT | Navigasi ke halaman editor draf `/po-log/:id/draft` | ☐ |

#### UC-08: Editor Draf PO

| # | Langkah | Expected Result | Status |
|---|---|---|---|
| 1 | Buka draf PO dari PO Log | Halaman editor draf muncul dengan daftar item | ☐ |
| 2 | Ubah jumlah order pada salah satu item | Nilai berubah di field input | ☐ |
| 3 | Hapus salah satu item | Item dihapus dari daftar | ☐ |
| 4 | Tambah item dari pemasok yang sama | Item baru muncul di daftar | ☐ |
| 5 | Klik "Simpan Draf" | Data tersimpan, toast sukses muncul | ☐ |
| 6 | Klik "Kirim ke Manajer" | Konfirmasi muncul | ☐ |
| 7 | Konfirmasi kirim | Status berubah ke PENDING_APPROVAL, diarahkan ke halaman yang sesuai | ☐ |

#### UC-09: Login Manager

| # | Langkah | Expected Result | Status |
|---|---|---|---|
| 1 | Login sebagai manager | Diarahkan ke `/app` | ☐ |
| 2 | Buka halaman Stok | Tabel ditampilkan, tetapi tombol "Scan Stok" tidak ada | ☐ |
| 3 | Buka draf PO | Mode read-only, tidak ada tombol edit/kirim | ☐ |
| 4 | Coba akses PATCH /api/stok/:sku via DevTools | HTTP 403 Forbidden | ☐ |

#### UC-10: Persetujuan PO via Email (Approval Flow)

| # | Langkah | Expected Result | Status |
|---|---|---|---|
| 1 | Admin kirim draf ke manajer | Email dikirim ke MANAGER_EMAIL berisi link approval | ☐ |
| 2 | Manajer klik link "Setuju" di email | Halaman konfirmasi muncul di browser | ☐ |
| 3 | Manajer klik tombol konfirmasi persetujuan | Status PO berubah ke SENT, PDF dikirim ke pemasok | ☐ |
| 4 | Manajer klik link "Tolak" di email | Status PO berubah ke REJECTED | ☐ |
| 5 | Token dipakai kedua kali | Halaman menampilkan error "token sudah dipakai" | ☐ |
| 6 | Token sudah kadaluarsa (>48 jam) | Status berubah ke REQUIRES_MANUAL_REVIEW | ☐ |

#### UC-11: Penerimaan Barang

| # | Langkah | Expected Result | Status |
|---|---|---|---|
| 1 | Buka detail PO dengan status SENT | Ada opsi "Catat Penerimaan" | ☐ |
| 2 | Klik "Catat Penerimaan" | Dialog penerimaan muncul dengan daftar item dan qty yang harus diterima | ☐ |
| 3 | Isi qty diterima untuk tiap item | Field terisi | ☐ |
| 4 | Klik Simpan | Penerimaan dicatat, status PO berubah ke PARTIALLY_RECEIVED atau RECEIVED | ☐ |
| 5 | Catat penerimaan sisa | Status berubah ke RECEIVED | ☐ |

#### UC-12: Analisis AI (Gemini)

| # | Langkah | Expected Result | Status |
|---|---|---|---|
| 1 | Buka halaman Stok, klik "Analisis AI" | Request dikirim ke Gemini | ☐ |
| 2 | Hasil analisis muncul | Daftar item dengan prioritas (TINGGI/SEDANG/RENDAH) dan alasan | ☐ |
| 3 | Gemini tidak dikonfigurasi | Pesan informasi bahwa AI tidak tersedia | ☐ |

#### UC-13: Halaman Publik

| # | Langkah | Expected Result | Status |
|---|---|---|---|
| 1 | Buka `/` (landing) | Halaman marketing ditampilkan dengan konten lengkap | ☐ |
| 2 | Navigasi ke `/artikel` | Daftar artikel ditampilkan | ☐ |
| 3 | Klik artikel | Konten artikel ditampilkan | ☐ |
| 4 | Navigasi ke `/faq` | FAQ ditampilkan | ☐ |
| 5 | Navigasi ke `/tentang` | Halaman Tentang ditampilkan | ☐ |
| 6 | Buka rute tidak dikenal `/xyz` | Diarahkan ke landing (`/`) | ☐ |

#### UC-14: Logout

| # | Langkah | Expected Result | Status |
|---|---|---|---|
| 1 | Klik tombol "Keluar" di sidebar | Toast "Anda telah keluar" muncul | ☐ |
| 2 | Setelah logout | Diarahkan ke halaman login | ☐ |
| 3 | Akses `/app` setelah logout | Diarahkan ke `/login` | ☐ |

#### UC-15: Token Expired (Sesi Kadaluarsa)

| # | Langkah | Expected Result | Status |
|---|---|---|---|
| 1 | Token expired, buka halaman manapun | Secara otomatis redirect ke `/login` | ☐ |
| 2 | API request dengan token expired | Event `reorderflow:unauthorized` dikirim, sesi direset | ☐ |

### 8.3 Persyaratan Non-Fungsional (UAT)

#### Performa

| # | Kriteria | Target | Status |
|---|---|---|---|
| P-01 | Waktu pertama tampil (FCP) halaman landing | < 2 detik pada koneksi 3G fast | ☐ |
| P-02 | Waktu muat dashboard setelah login | < 3 detik | ☐ |
| P-03 | Tabel stok 100+ item tetap responsif | Scroll tanpa lag | ☐ |
| P-04 | Endpoint `/api/stok` merespons | < 1 detik | ☐ |

#### Aksesibilitas

| # | Kriteria | Target | Status |
|---|---|---|---|
| A-01 | Navigasi keyboard pada form login | Tab order logis, Enter submit form | ☐ |
| A-02 | Error messages menggunakan role="alert" | Screen reader mengumumkan error | ☐ |
| A-03 | Modal mengunci fokus di dalam dialog | Tab tidak melarikan diri dari modal | ☐ |
| A-04 | Tombol dengan ikon saja memiliki sr-only label | "Tutup dialog" dapat dibaca screen reader | ☐ |
| A-05 | Kontras warna memenuhi WCAG AA | Rasio kontras ≥ 4.5:1 untuk teks normal | ☐ |

#### Keamanan

| # | Kriteria | Target | Status |
|---|---|---|---|
| S-01 | Password tidak ditampilkan di network log | Type="password" | ☐ |
| S-02 | Token tidak diekspos di URL | Hanya di localStorage | ☐ |
| S-03 | Role admin/manager diverifikasi di server | Endpoint PATCH stok menolak manager dengan 403 | ☐ |
| S-04 | HTML approval meng-escape token | XSS tidak bisa diinjeksi via token | ☐ |
| S-05 | Rate limit login aktif | 5 percobaan/15 menit per kombinasi IP+email | ☐ |
| S-06 | Security headers aktif | X-Frame-Options, X-Content-Type-Options, dll | ☐ |
| S-07 | CORS hanya mengizinkan origin terdaftar | Origin lain mendapat 403 | ☐ |

#### Responsivitas

| # | Kriteria | Target | Status |
|---|---|---|---|
| R-01 | Halaman landing di mobile (375px) | Tidak ada horizontal scroll | ☐ |
| R-02 | Halaman login di mobile | Form terpusat dan dapat digunakan | ☐ |
| R-03 | Modal di mobile | Muncul dari bawah (bottom sheet style) | ☐ |
| R-04 | Tabel stok di tablet (768px) | Dapat discroll secara horizontal | ☐ |

### 8.4 Tanda Tangan UAT

| Peran | Nama | Tanggal | Tanda Tangan |
|---|---|---|---|
| QA Lead | | | |
| Product Owner | | | |
| Admin User | | | |
| Manager User | | | |

### 8.5 Definisi "Done"

Fitur dinyatakan **done** jika:
1. Semua unit tests, functional tests, dan integration tests **lulus (green)**.
2. E2E tests untuk fitur tersebut **lulus**.
3. Semua acceptance criteria UAT di atas **diceklis**.
4. Tidak ada regresi pada fitur yang sudah ada.
5. Code review telah dilakukan dan disetujui.

---

## 9. Coverage Report

### Frontend (Vitest)

```bash
cd frontend && npm run test:coverage
# Laporan HTML: frontend/coverage/index.html
```

Target coverage minimum:

| Layer | Statement | Branch | Function |
|---|---|---|---|
| utils/ | 90% | 85% | 90% |
| services/ | 80% | 75% | 80% |
| components/ | 70% | 65% | 70% |
| hooks/ | 70% | 65% | 70% |

### Backend (Go)

```bash
cd backend && go test ./... -cover
```

Target coverage minimum:

| Package | Target |
|---|---|
| internal/model | 80% |
| internal/service | 70% |
| internal/middleware | 85% |
| internal/utils | 90% |

---

## 10. CI/CD

Untuk mengintegrasikan testing ke pipeline CI/CD (GitHub Actions atau sejenisnya):

```yaml
# .github/workflows/test.yml (contoh)
jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.26'
      - name: Run backend tests
        run: cd backend && go test ./... -cover

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: cd frontend && npm ci
      - name: Run unit + functional + integration tests
        run: cd frontend && npm run test
      - name: Run coverage
        run: cd frontend && npm run test:coverage

  e2e-test:
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
      - uses: actions/setup-node@v4
      - name: Start backend
        run: cd backend && go run ./cmd/server &
        env:
          # Set env vars dari GitHub Secrets
          POSTGRES_URL: ${{ secrets.TEST_POSTGRES_URL }}
          JWT_SECRET: ${{ secrets.TEST_JWT_SECRET }}
          # ...
      - name: Install frontend deps
        run: cd frontend && npm ci
      - name: Start frontend
        run: cd frontend && npm run dev &
      - name: Wait for services
        run: sleep 5
      - name: Run Playwright E2E tests
        run: cd frontend && npm run test:e2e
        env:
          E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
          E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

---

*Dokumen ini diperbarui setiap kali ada penambahan fitur atau perubahan skenario testing.*
