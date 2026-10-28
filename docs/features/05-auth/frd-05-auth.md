# Functional Requirement Document (FRD): Fitur 05 - Autentikasi & Kontrol Akses

## 1. Konteks
Fitur ini melindungi dashboard dan endpoint data ReorderFlow dengan login email/password dan token JWT. Fitur ini menurunkan **PRD Bagian 4 (Fitur 5)** dan **FRD Bagian 2 (Peran & Hak Akses)**. Persetujuan PO lewat email tetap publik dan tidak memerlukan login.

---

## 2. Peran & Hak Akses

| Peran | Login Dashboard | Endpoint Read | Endpoint Write | Approve via Email |
| :--- | :--- | :--- | :--- | :--- |
| **Staf Inventori / Admin** | Ya (`admin`) | Semua data | `POST /api/stok/scan` | Tidak |
| **Operations Manager** | Ya (`manager`) | Semua data | Tidak (`403`) | Ya |
| **System Cron / Worker** | Tidak | Internal | Internal | - |
| **Pemasok / Vendor** | Tidak | - | - | - |

---

## 3. Alur Autentikasi

* **K-05.1:** **KETIKA** pengguna mengirim `email` dan `password` ke `POST /api/auth/login`, sistem mencari user berdasarkan email (case-insensitive) dan memverifikasi password dengan bcrypt.
* **K-05.2:** **KETIKA** kredensial valid, sistem mengembalikan JWT HS256 berisi `user_id`, `email`, `role`, `iat`, dan `exp`.
* **K-05.3:** **KETIKA** kredensial tidak valid, sistem mengembalikan HTTP `401` dengan pesan generik "Email atau password salah".
* **K-05.4:** **KETIKA** pengguna mengakses endpoint terproteksi, middleware memvalidasi header `Authorization: Bearer <token>`.
* **K-05.5:** **JIKA** token tidak ada, tidak valid, atau kedaluwarsa, sistem mengembalikan HTTP `401` dan frontend menghapus sesi lalu redirect ke `/login`.
* **K-05.6:** **JIKA** role `manager` mengakses endpoint khusus admin, sistem mengembalikan HTTP `403`.
* **K-05.7:** **SELAMA** pengguna memiliki token valid, `GET /api/auth/me` mengembalikan profil user tanpa `password_hash`.
* **K-05.8:** **KETIKA** pengguna logout, frontend menghapus token dari storage; backend bersifat stateless dan tidak menyimpan session.

---

## 4. Aturan Bisnis

| No. | Kode AB | Kondisi Pemicu | Hasil / Tindakan Sistem |
| :--- | :--- | :--- | :--- |
| 1 | AB-05.1 | Email tidak terdaftar atau password salah | HTTP `401`, pesan generik, tidak membocorkan apakah email ada. |
| 2 | AB-05.2 | Bearer token kosong / signature salah / `exp` lewat | HTTP `401`, frontend redirect `/login`. |
| 3 | AB-05.3 | Role `manager` memanggil `POST /api/stok/scan` | HTTP `403`, pemindaian tidak dijalankan. |
| 4 | AB-05.4 | `JWT_SECRET` masih default saat `ENV=production` | Server mencatat warning; secret wajib diganti sebelum deploy. |
| 5 | AB-05.5 | Akun admin/manager belum ada saat startup | Akun dibuat dari `ADMIN_EMAIL`/`ADMIN_PASSWORD` dan `MANAGER_EMAIL`/`MANAGER_PASSWORD`. |
| 6 | AB-05.6 | Password kurang dari 8 karakter saat pembuatan akun | Akun tidak dibuat dan error dicatat di log. |

---

## 5. Istilah Internal

* **JWT (JSON Web Token):** Token bertanda tangan HMAC-SHA256 yang membawa identitas user dan masa berlaku.
* **Bearer Token:** Format header `Authorization: Bearer <token>` untuk mengirim JWT.
* **Bcrypt:** Algoritma hashing password dengan salt otomatis.
* **Role:** Peran user (`admin` atau `manager`) yang menentukan akses endpoint.

---

## 6. Data Utama

### 6.1 Tabel `users`
* `id`: Serial primary key.
* `email`: Varchar(150), unik, case-insensitive.
* `password_hash`: Varchar(255), hash bcrypt, tidak pernah dikembalikan API.
* `nama`: Varchar(150).
* `role`: Varchar(30), `admin` atau `manager`.
* `created_at`: Timestamp.

### 6.2 Environment Variable
* `JWT_SECRET`, `JWT_TTL_HOURS`.
* `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
* `MANAGER_EMAIL`, `MANAGER_PASSWORD`.

---

## 7. Daftar Fungsi Utama

1. **F-05.1 (Login & Token Issuer):** Verifikasi kredensial dan penerbitan JWT.
2. **F-05.2 (Auth Middleware):** Validasi Bearer token dan injeksi identitas user ke context.
3. **F-05.3 (Role Guard):** Pembatasan endpoint tulis berdasarkan role.
4. **F-05.4 (Profil User):** Endpoint `GET /api/auth/me`.
5. **F-05.5 (Bootstrap Akun):** Pembuatan akun admin/manager dari environment variable saat startup.

---

## 8. AC Alur Utama

* **Data Awal:**
  * Admin: `admin@gmail.com` / password dari `ADMIN_PASSWORD`.
  * Manager: email dari `MANAGER_EMAIL` / `MANAGER_PASSWORD`.
* **Skenario Login Admin:**
  1. `POST /api/auth/login` dengan kredensial admin.
  2. Response `200` berisi `token` dan `user.role = "admin"`.
  3. `GET /api/auth/me` dengan Bearer token mengembalikan profil admin.
  4. `POST /api/stok/scan` berhasil (`200`).
* **Skenario Manager:**
  1. Login manager berhasil dan `user.role = "manager"`.
  2. `GET /api/dashboard` berhasil (`200`).
  3. `POST /api/stok/scan` ditolak (`403`).
* **Skenario Negatif:**
  1. Password salah → `401`.
  2. Tanpa header Authorization → `401`.
  3. Token kedaluwarsa → `401`.

---

## 9. Tidak Termasuk
* SSO, MFA/2FA, login sosial.
* Reset password via email.
* Manajemen user (CRUD) dari dashboard.
* Refresh token dan session server-side.
