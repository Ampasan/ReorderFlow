### Design Spec: FRD-05 Autentikasi & Kontrol Akses (ReorderFlow)

--------------------------------------------------------------------------------

##### 1. Data Schema (PostgreSQL / Supabase DDL)
```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nama VARCHAR(150),
    role VARCHAR(30) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'manager')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));
```

Bootstrap akun dilakukan saat startup dari environment variable (`ADMIN_EMAIL`/`ADMIN_PASSWORD`, `MANAGER_EMAIL`/`MANAGER_PASSWORD`), bukan dari seed SQL, agar tidak ada password default di repository.

--------------------------------------------------------------------------------

##### 2. API Contract Specification (Golang Gin)
###### A. POST /api/auth/login
*   **Deskripsi** : Login email/password dan penerbitan JWT. Endpoint publik.
*   **Request Body** :
```json
{ "email": "admin@example.com", "password": "your-password" }
```
*   **Response 200 OK** :
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "admin@example.com",
      "nama": "Admin",
      "role": "admin",
      "created_at": "2026-10-28T08:00:00Z"
    }
  }
}
```
*   **Response 400 Bad Request (validasi)** :
```json
{ "success": false, "message": "Email dan password wajib diisi dengan format benar", "data": null, "error": "validation error" }
```
*   **Response 401 Unauthorized** :
```json
{ "success": false, "message": "Email atau password salah", "data": null, "error": "email atau password salah" }
```

###### B. GET /api/auth/me
*   **Headers** : `Authorization: Bearer <token>`
*   **Response 200 OK** :
```json
{
  "success": true,
  "message": "Berhasil mengambil data pengguna",
  "data": { "id": 1, "email": "admin@gmail.com", "nama": "Admin", "role": "admin", "created_at": "2026-10-28T08:00:00Z" }
}
```
*   **Response 401 Unauthorized** : token kosong, invalid, atau kedaluwarsa.

###### C. Proteksi Endpoint Data
*   Semua endpoint berikut memakai middleware JWT:
```text
GET   /api/auth/me
GET   /api/stok
GET   /api/dashboard
GET   /api/po
GET   /api/po-log
GET   /api/po-draft/{id}
POST  /api/stok/scan                  (role admin)
PATCH /api/stok/{sku}                 (role admin)
PUT   /api/po-draft/{id}              (role admin)
POST  /api/po-draft/{id}/submit       (role admin)
```
*   Endpoint publik: `/health`, `/api/auth/login`, `/api/po/approval`.

--------------------------------------------------------------------------------

##### 3. Backend Component Structure (Golang Gin)
```text
backend/
├── config/
│   └── config.go                 # JWT_SECRET, JWT_TTL_HOURS, ADMIN_*, MANAGER_*
├── internal/
│   ├── handler/
│   │   └── auth_handler.go       # Login, Me
│   ├── middleware/
│   │   └── auth.go               # Auth(secret), RequireRole(...)
│   ├── model/
│   │   └── user.go               # User, RoleAdmin, RoleManager, LoginRequest/Response
│   ├── repository/
│   │   └── user_repository.go    # GetByEmail, GetByID, Create
│   ├── service/
│   │   └── auth_service.go       # Login, EnsureUser
│   └── utils/
│       ├── jwt.go                # GenerateJWT, ParseJWT
│       └── password.go           # HashPassword, CheckPassword
└── cmd/server/main.go            # Wiring + route protection
```

Dependency tambahan: `github.com/golang-jwt/jwt/v5` dan `golang.org/x/crypto/bcrypt`.

--------------------------------------------------------------------------------

##### 4. Frontend Component Structure (React + Vite + TypeScript)
```text
src/
├── context/
│   ├── AuthProvider.tsx          # token, user, login(), logout(), status
│   └── authContext.ts            # Context definition
├── components/
│   └── ProtectedRoute.tsx        # Redirect ke /login jika tidak ada token
├── services/
│   ├── api.ts                    # fetch wrapper, timeout, 401/403 handling
│   └── authService.ts            # login(), me()
├── types/
│   └── auth.ts                   # User, UserRole, LoginResponse
└── pages/
    └── LoginPage.tsx             # Form login split screen
```

**HTTP client** :
*   Request: baca token dari `localStorage` (`reorderflow.token`) dan set `Authorization: Bearer <token>`.
*   Response `401`: hapus sesi, dispatch event `reorderflow:unauthorized`, reset auth state, redirect `/login`.
*   Response `403`: tampilkan toast "Anda tidak memiliki akses untuk aksi ini".
*   Timeout request: 20 detik.

**Environment frontend** :
```text
VITE_API_BASE_URL=http://localhost:8080
```
Base URL tidak memakai akhiran `/api`. Path endpoint sudah diawali `/api/...`.

**Route frontend** :
```text
/login                  -> LoginPage
/                       -> Dashboard
/stok                   -> StockList
/po-log                 -> POLogList
/po-log/:id/draft       -> PODraftEditor
*                       -> redirect ke /
```

--------------------------------------------------------------------------------

##### 5. Sequence Login
```text
User -> LoginPage: submit email/password
LoginPage -> API: POST /api/auth/login
API -> DB: SELECT user WHERE LOWER(email) = ...
DB --> API: user + password_hash
API -> API: bcrypt compare + GenerateJWT
API --> LoginPage: 200 { token, user }
LoginPage -> Storage: simpan token
LoginPage -> Router: redirect /
Router -> API: GET /api/dashboard (Authorization: Bearer ...)
```
