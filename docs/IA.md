# Information Architecture (IA): ReorderFlow

**Nama Sistem:** ReorderFlow (Automasi Pembelian Inventori UMKM)  
**Tipe Dokumen:** Information Architecture (IA)   

---

## 1. Hirarki Navigasi & Sitemap (Website Dashboard)

Aplikasi ReorderFlow menggunakan struktur navigasi datar (*flat hierarchy*) dengan bilah samping (*Sidebar*) yang selalu tampil (*persistent*) pada antarmuka web, serta halaman khusus untuk aksi dari luar sistem (landing page persetujuan email).

```text
[ReorderFlow Web App]
├── 0.0 Login (`/login`) [Public]
│   ├── 0.1 Form Email & Password
│   ├── 0.2 State Loading / Error Login
│   └── 0.3 Redirect ke Dashboard setelah JWT tersimpan
│
├── 1.0 Dashboard Utama (`/`) [Protected]
│   ├── 1.1 Ringkasan KPI (Total SKU, Low-Stock Alert, PO Pending, PO Sent)
│   ├── 1.2 Banner Peringatan Anomali (`REQUIRES_MANUAL_REVIEW`)
│   ├── 1.3 Tabel Cepat SKU Kritis (Top 5 Low Stock)
│   └── 1.4 Aktivitas Terakhir PO (Recent PO Stream)
│
├── 2.0 Data Inventori & ROP (`/stok`) [Protected]
│   ├── 2.1 Tab: Semua Barang
│   ├── 2.2 Tab: Perlu Reorder (`stok <= ROP`)
│   ├── 2.3 Tab: Perlu Peninjauan Manual (`REQUIRES_MANUAL_REVIEW`)
│   ├── 2.4 Pemicu Pemindaian Manual ("Pindai Stok Sekarang") [Admin only]
│   └── 2.5 Modal Detail SKU & Riwayat Pemasok
│
├── 3.0 Riwayat Purchase Order (`/po-log`) [Protected]
│   ├── 3.1 Tab Filter Status: All | DRAFT | SENT | REJECTED
│   ├── 3.2 Tabel Log PO (Nomor PO, Pemasok, Jumlah SKU, Total Qty, Status, Tanggal)
│   ├── 3.3 Aksi: Unduh PDF PO
│   └── 3.4 Modal Preview PDF Dokumentasi PO
│
└── 4.0 Halaman Konfirmasi Persetujuan Manager (`/api/po/approval?token={token}&action={action}`) [Public/External Landing, HTML dari backend]
    ├── 4.1 State Processing (Validasi Token)
    ├── 4.2 State Success (Konfirmasi Approve/Reject Terproses)
    ├── 4.3 State Expired / Used (Token Kadaluarsa atau Sudah Digunakan)
    └── 4.4 State Error (Token Tidak Valid / Server Connection Error)
```

Rute `1.0` sampai `3.0` dilindungi login. Akses tanpa JWT valid diarahkan ke `/login`. Rute `0.0` dan `4.0` bersifat publik.

---

## 2. Peta Alur Pengguna (User Flows)

### Flow 0: Login & Session Guard (Admin / Manager)

```text
[Pengguna Buka Dashboard (/)]
        │
        ├── JIKA token valid di storage ──► [Dashboard]
        │
        └── JIKA tidak ada / token kedaluwarsa ──► [Redirect /login]
                                                    │
                                                    ▼
                                     [Isi Email & Password]
                                                    │
                                                    ▼
                                     [POST /api/auth/login]
                                                    │
                        ┌───────────────────────────┴───────────────────────────┐
                        ▼                                                       ▼
                [200: Simpan JWT + user]                              [401: Tampilkan error]
                        │                                                       │
                        ▼                                                       ▼
                [Redirect Dashboard]                                   [Tetap di /login]
                        │
                        ▼
        [Request data dengan Authorization: Bearer <token>]
                        │
                        ├── 401 ──► [Hapus token, redirect /login]
                        └── 403 ──► [Tampilkan pesan akses ditolak]
```

---

### Flow 1: Alur Kerja Otomatisasi Harian (System-Driven Flow)
Alur berjalan di latar belakang (*background job*) tanpa intervensi manual pengguna.

```text
[Start: Cron Job 08:00 WIB]
        │
        ▼
[Backend: Scan Tabel Stok]
        │
        ├── JIKA stok_saat_ini <= reorder_point ──► [Cek Active PO di PO_Log]
        │                                                     │
        │                                                     ├── JIKA Ada PO Active (DRAFT/SENT) ──► [SKIP: Catat Log]
        │                                                     │
        │                                                     └── JIKA Tidak Ada PO Active ──► [Group SKU per Pemasok]
        │                                                                                           │
        │                                                                                           ▼
        │                                                                               [Generate PDF & Upload Supabase]
        │                                                                                           │
        │                                                                                           ▼
        │                                                                               [Simpan PO_Log Status DRAFT]
        │                                                                                           │
        │                                                                                           ▼
        │                                                                               [Kirim Email Draf ke Manager]
        │
        └── JIKA stok < 0 ATAU ROP == 0 ────────► [Set Status SKU: REQUIRES_MANUAL_REVIEW]
```

---

### Flow 2: Alur Peninjauan & Pemindaian Manual (Admin Inventori Flow)
Alur kerja staf admin saat menggunakan dashboard web.

```text
[Admin Login (/login)] ──► [Masuk Dashboard (/)]
        │
        ├──────────────────────────────────────────────────────┐
        ▼                                                      ▼
[Buka Halaman Data Stok (/stok)]                      [Klik "Pindai Stok Sekarang"]
        │                                                      │
        ▼                                                      ▼
[Filter Tab: "Perlu Reorder"]                         [Backend Jalankan ExecScan()]
        │                                                      │
        ▼                                                      ▼
[Lihat Daftar Barang Low Stock & Supplier]             [Toast Notifikasi: "2 PO Draf Dibuat"]
        │                                                      │
        ▼                                                      ▼
[Navigasi ke Riwayat PO (/po-log)] ◄───────────────────────────┘
        │
        ▼
[Lihat PO Berstatus "DRAFT" (Menunggu Persetujuan Manager)]
```

---

### Flow 3: Alur Persetujuan & Pengiriman PO (Operations Manager Flow)
Alur kerja manajer saat menerima email notifikasi dari sistem.

```text
[Manager Menerima Email Ringkasan Draf PO]
        │
        ├── [Membaca Ringkasan & Mengunduh Draf PDF]
        │
        ▼
[Manager Klik Tombol di Email]
        │
        ├── Tombol [APPROVE] ──► GET /api/po/approval?token=xxx&action=approve
        └── Tombol [REJECT]  ──► GET /api/po/approval?token=xxx&action=reject
                                        │
                                        ▼
                        [Backend: Validasi Token & Redis Lock]
                                        │
                                        ├── JIKA Token Valid & Unused (Status DRAFT)
                                        │         │
                                        │         ├── Action = APPROVE ──► [Update Status: SENT]
                                        │         │                             │
                                        │         │                             ▼
                                        │         │                   [Dispatch Email PDF ke Supplier]
                                        │         │
                                        │         └── Action = REJECT  ──► [Update Status: REJECTED]
                                        │
                                        └── JIKA Token Invalid / Already Used ──► [Tampilkan Error Page]
                                        │
                                        ▼
                        [Render Halaman Konfirmasi dari Backend (/api/po/approval)]
```

---

## 3. Peta Entitas & Hirarki Data (Entity Mapping)

Hubungan antar entitas utama dalam antarmuka dan struktur informasi sistem:

```text
+------------------------+          1 : N          +------------------------+
|        PEMASOK         | ----------------------- |          STOK          |
+------------------------+                         +------------------------+
| id (PK)                |                         | sku (PK)               |
| nama                   |                         | nama                   |
| email                  |                         | stok_saat_ini          |
+------------------------+                         | reorder_point          |
            |                                      | qty_min_order          |
            | 1 : N                                | id_pemasok (FK)        |
            ▼                                      +------------------------+
+------------------------+                                     |
|         PO_LOG         |                                     | N : M
+------------------------+                                     |
| id (PK)                |                                     ▼
| nomor_po               |                         +------------------------+
| id_pemasok (FK)        | ----------------------- |       PO_DETAIL        |
| status (DRAFT/SENT...) |          1 : N          +------------------------+
| tautan_pdf             |                         | id (PK)                |
| token                  |                         | id_po (FK)             |
| created_at             |                         | sku (FK)               |
+------------------------+                         | qty_order              |
                                                   +------------------------+
```

Tabel `users` berdiri sendiri (tidak berelasi ke entitas inventori) dan dipakai untuk autentikasi dashboard: `id`, `email`, `password_hash`, `nama`, `role` (`admin` / `manager`).

---

## 4. Peta Kondisi Layar (Screen State Map)

Setiap halaman pada ReorderFlow wajib menangani 4 kondisi visual standar (*UI States*):

| Halaman | Condition: Loading | Condition: Empty State | Condition: Data Available | Condition: Error State |
| :--- | :--- | :--- | :--- | :--- |
| **Login (`/login`)** | Tombol submit disabled + spinner saat request login. | - | Form email/password, redirect ke dashboard setelah sukses. | Pesan merah "Email atau password salah" / "Gagal terhubung ke server". |
| **Dashboard (`/`)** | Skeleton card KPI & skeleton table. | KPI bernilai `0`, tabel "Semua Stok Aman". | Kartu KPI terisi, alert banner jika ada anomali. | Banner Merah: "Gagal memuat data dashboard". |
| **Data Stok (`/stok`)** | Table Skeleton Rows (5 baris). | "Tidak ada barang yang perlu reorder". | Tabel data SKU lengkap dengan badge status ROP. | "Gagal menghubungkan ke Supabase Database". |
| **Riwayat PO (`/po-log`)** | Table Skeleton Rows (5 baris). | "Belum ada riwayat Purchase Order". | Tabel daftar PO dengan tombol unduh PDF. | "Gagal memuat riwayat PO". |
| **Approval Landing (`/api/po/approval`)** | Halaman HTML backend menampilkan status proses. | - | Card Hijau (Approve Success) / Card Merah (Reject Success). | Card Kuning: "Tautan tidak valid atau sudah kadaluarsa". |

---

## 5. Matriks Struktur Komponen Web (React Component Tree)

```text
<App>
  ├── <AuthProvider /> (token, user, login, logout, loading)
  └── <Routes>
        ├── <LoginPage />
        │     ├── <LoginForm />
        │     └── <LoginErrorBanner />
        │
        ├── <ProtectedRoute /> (redirect /login jika 401 / token kosong)
        │     ├── <Sidebar /> (Navigasi Kiri)
        │     ├── <Navbar /> (Header, Indikator Sistem & Refresh, Logout)
        │     └── <AppRoutes>
        │           ├── <DashboardPage>
        │           │     ├── <KPICardGroup />
        │           │     ├── <AnomalyAlertBanner />
        │           │     └── <LowStockQuickTable />
        │           │
        │           ├── <StockListPage>
        │           │     ├── <TabFilterGroup /> (All | Need Reorder | Manual Review)
        │           │     ├── <ScanTriggerButton /> [Admin only]
        │           │     └── <StockTable>
        │           │           └── <ROPBadge />
        │           │
        │           └── <POLogListPage>
        │                 ├── <POStatusTabFilter />
        │                 └── <POLogTable>
        │                       ├── <StatusBadge />
        │                       └── <PDFDownloadButton />
        │
        └── (Approval tidak punya route React; link email diarahkan ke HTML backend `/api/po/approval`)
```
