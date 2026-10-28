### Requirements Spec: FRD-05 Autentikasi & Kontrol Akses (ReorderFlow)

--------------------------------------------------------------------------------

##### 1. Aspek: Perilaku (Kebutuhan & AC)
*   **K-5.1 (Login Email/Password)** : KETIKA pengguna mengirim `email` dan `password` ke `POST /api/auth/login`, sistem memverifikasi kredensial terhadap hash bcrypt di tabel `users`.
    *   **AC-5.1.1** : Kredensial valid menghasilkan HTTP `200` dengan `data.token` (JWT) dan `data.user` (`id`, `email`, `nama`, `role`, `created_at`).
    *   **AC-5.1.2** : Kredensial salah menghasilkan HTTP `401` dengan pesan "Email atau password salah".
*   **K-5.2 (Proteksi Endpoint Data)** : KETIKA pengguna mengakses `/api/auth/me`, `/api/stok`, `/api/dashboard`, `/api/po`, atau `/api/po-log` tanpa header `Authorization: Bearer <token>`, sistem menolak request.
    *   **AC-5.2.1** : Tanpa token, token tidak valid, atau token kedaluwarsa menghasilkan HTTP `401`.
*   **K-5.3 (Kontrol Role)** : KETIKA role `manager` memanggil `POST /api/stok/scan`, sistem menolak eksekusi.
    *   **AC-5.3.1** : Request dari manager menghasilkan HTTP `403` dan pemindaian tidak dijalankan.
*   **K-5.4 (Profil User)** : KETIKA `GET /api/auth/me` dipanggil dengan token valid, sistem mengembalikan profil user tanpa `password_hash`.
*   **K-5.5 (Endpoint Publik)** : SELAMA proses persetujuan PO, `/api/po/approval` tetap dapat diakses tanpa login dan hanya divalidasi lewat token sekali pakai.
*   **Pengecualian & Batasan (JIKA / SELAMA)** :
    *   **JIKA** akun admin/manager belum ada saat startup, sistem membuatnya dari environment variable.
    *   **JIKA** password dari environment variable kurang dari 8 karakter, akun tidak dibuat dan error dicatat di log.
    *   **JIKA** `JWT_SECRET` masih default saat `ENV=production`, sistem mencatat warning di log.

--------------------------------------------------------------------------------

##### 2. Aspek: Tampilan & Kondisi Layar
*   **Halaman Login (`/login`)** :
    *   Form `Email` dan `Password`, tombol "Masuk".
    *   **Loading** : tombol disabled + spinner, teks "Memproses...".
    *   **Error** : banner merah "Email atau password salah" atau "Gagal terhubung ke server".
    *   **Success** : simpan JWT, tampilkan toast "Login berhasil", redirect ke `/`.
*   **Session Guard** :
    *   Akses ke route terproteksi tanpa token valid diarahkan ke `/login`.
    *   Respons `401` dari API menghapus token dan mengembalikan pengguna ke `/login`.
*   **Role UI** :
    *   Role `manager` tidak melihat tombol "Pindai Stok Sekarang" dan item aksi tulis lainnya.

--------------------------------------------------------------------------------

##### 3. Aspek: Data & Validasi
*   **Request Login** :
    *   `email` (string, required, format email).
    *   `password` (string, required, minimal 8 karakter).
*   **Response Login** :
    *   `token` (string JWT HS256).
    *   `user` (`id`, `email`, `nama`, `role`, `created_at`).
*   **Klaim JWT** :
    *   `user_id`, `email`, `role`, `iat`, `exp`.
*   **Masa Berlaku** :
    *   Default 24 jam, dikonfigurasi lewat `JWT_TTL_HOURS`.
*   **Penyimpanan Password** :
    *   Hash bcrypt (`bcrypt.DefaultCost`), tidak pernah dikirim ke client.

--------------------------------------------------------------------------------

##### 4. Aspek: Error & Pengecualian
*   **Kredensial Salah / Email Tidak Terdaftar** :
    *   HTTP `401`, pesan generik, tidak membedakan email ada atau tidak.
*   **Token Tidak Valid / Kedaluwarsa** :
    *   HTTP `401` dengan `error: "invalid or expired token"`.
*   **Role Tidak Cukup** :
    *   HTTP `403` dengan `error: "insufficient role"`.
*   **Database Error saat Login** :
    *   HTTP `500`, pesan generik tanpa detail internal.
*   **Konfigurasi Tidak Aman** :
    *   `JWT_SECRET` default di produksi memicu log warning.

--------------------------------------------------------------------------------

##### 5. Aspek: Hak Akses
*   **Publik** :
    *   `POST /api/auth/login`, `GET /health`, `GET /api/po/approval`.
*   **Semua Role Terautentikasi (`admin`, `manager`)** :
    *   `GET /api/auth/me`, `GET /api/stok`, `GET /api/dashboard`, `GET /api/po`, `GET /api/po-log`.
*   **Khusus `admin`** :
    *   `POST /api/stok/scan`.
*   **System Cron** :
    *   Menjalankan pemindaian internal tanpa JWT.

--------------------------------------------------------------------------------

##### 6. Aspek: Jumlah Data & Kecepatan
*   **Volume** :
    *   Hingga 100 akun dashboard dan 1.000 login per hari.
*   **Target Waktu** :
    *   Verifikasi bcrypt + penerbitan JWT: **< 300 ms**.
    *   Validasi middleware JWT per request: **< 5 ms**.

--------------------------------------------------------------------------------

##### 7. Aspek: Bukan Bagian Ini (Out-of-Scope)
*   SSO, MFA/2FA, login Google/Microsoft.
*   Reset password via email dan verifikasi email.
*   Refresh token, session server-side, dan daftar perangkat aktif.
*   CRUD user dari dashboard.
