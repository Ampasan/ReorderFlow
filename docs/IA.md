# Information Architecture (IA): ReorderFlow

**Nama Sistem:** ReorderFlow (Automasi Pembelian Inventori UMKM)
**Tipe Dokumen:** Information Architecture (IA)

---

## 1. Hirarki Navigasi & Sitemap (Website Dashboard)

Aplikasi ReorderFlow memakai struktur navigasi datar dengan sidebar persisten. Navigasi utama hanya berisi tiga menu: Dashboard, Data Stok, dan Riwayat PO. Halaman detail dan editor draf dibuka dari dalam tabel.

```text
[ReorderFlow Web App]
├── 0.0 Login (/login) [Public]
│   ├── 0.1 Form Email & Password
│   ├── 0.2 State Loading / Error Login
│   └── 0.3 Redirect ke halaman asal atau Dashboard setelah JWT tersimpan
│
├── 1.0 Dashboard Utama (/) [Protected]
│   ├── 1.1 Ringkasan KPI (Total SKU, Stok Rendah, Draf PO, Menunggu Persetujuan, PO Terkirim, PO Diterima)
│   ├── 1.2 Banner Peringatan Stok Rendah + tombol "Buat Draf PO" [Admin only]
│   ├── 1.3 Banner Data Abnormal (REQUIRES_MANUAL_REVIEW) + tautan "Periksa Data"
│   └── 1.4 Tabel Cuplikan Stok di Bawah ROP (maksimal 5 baris)
│
├── 2.0 Data Inventori & ROP (/stok) [Protected]
│   ├── 2.1 Tab: Semua (/stok?status=all)
│   ├── 2.2 Tab: Perlu Reorder (/stok?status=low)
│   ├── 2.3 Tab: Perlu Peninjauan (/stok?status=manual)
│   ├── 2.4 Tombol "Pindai Stok" + dialog konfirmasi [Admin only]
│   ├── 2.5 Dialog Detail SKU
│   └── 2.6 Dialog Koreksi Stok Opname (alasan DAMAGED / MISCOUNT / RETURN) [Admin only]
│
├── 3.0 Riwayat Purchase Order (/po-log) [Protected]
│   ├── 3.1 Tab Status: Semua | Draf | Menunggu | Terkirim | Diterima Sebagian | Diterima | Ditolak | Perlu Tinjauan
│   ├── 3.2 Filter Pemasok (client-side dari daftar PO yang dimuat)
│   ├── 3.3 Tabel PO (Nomor PO, Pemasok, Status, Barang, Dibuat)
│   ├── 3.4 Dialog Detail PO + daftar barang
│   ├── 3.5 Aksi "Lihat PDF" (membuka URL Supabase Storage di tab baru)
│   ├── 3.6 Aksi "Edit Draf" / "Revisi" / "Proses Ulang" [Admin only]
│   ├── 3.7 Halaman Editor Draf (/po-log/:id/draft) [Protected]
│   └── 3.8 Aksi "Terima Barang" + dialog penerimaan per SKU [Admin only]
│
└── 4.0 Halaman Konfirmasi Persetujuan Manager (/api/po/approval?token={token}&action={action}) [Public/External Landing, HTML dari backend]
    ├── 4.1 State Success (Approve/Reject terproses)
    ├── 4.2 State Already Used (Token sudah dipakai)
    ├── 4.3 State Not Submitted (PO masih DRAFT)
    ├── 4.4 State Expired (Token melewati 48 jam)
    └── 4.5 State Error (Token tidak ditemukan / action tidak valid / server error)
```

Rute `1.0` sampai `3.0` dilindungi login. Akses tanpa JWT valid diarahkan ke `/login`. Rute `0.0` dan `4.0` bersifat publik.

---

## 2. Peta Alur Pengguna (User Flows)

### Flow 0: Login & Session Guard (Admin / Manager)

```text
[Pengguna Buka Dashboard (/)]
        │
        ├── JIKA token valid di localStorage ──► [Dashboard]
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
Alur berjalan di latar belakang tanpa intervensi manual pengguna. Hasil pemindaian berhenti di `DRAFT` dan belum mengirim email.

```text
[Start: Cron Job 08:00 WIB]
        │
        ▼
[Backend: Scan Tabel Stok]
        │
        ├── JIKA stok_saat_ini <= reorder_point ──► [Cek PO Aktif per SKU & Pemasok]
        │                                                     │
        │                                                     ├── JIKA Ada PO Aktif ──► [SKIP: Catat Log]
        │                                                     │
        │                                                     └── JIKA Tidak Ada PO Aktif ──► [Group SKU per Pemasok]
        │                                                                                           │
        │                                                                                           ▼
        │                                                                               [Generate PDF & Upload Supabase]
        │                                                                                           │
        │                                                                                           ▼
        │                                                                               [Simpan PO_Log Status DRAFT]
        │                                                                                           │
        │                                                                                           ▼
        │                                                                               [Selesai, tanpa email]
        │
        └── JIKA stok < 0 ATAU ROP <= 0 ATAU min order <= 0 ──► [Set Status SKU: REQUIRES_MANUAL_REVIEW]
```

---

### Flow 2: Alur Peninjauan Draf & Pemindaian Manual (Admin Inventori Flow)

```text
[Admin Login (/login)] ──► [Masuk Dashboard (/)]
        │
        ├──────────────────────────────────────────────────────┐
        ▼                                                      ▼
[Buka Halaman Data Stok (/stok)]                      [Klik "Pindai Stok" / "Buat Draf PO"]
        │                                                      │
        ▼                                                      ▼
[Filter Tab: "Perlu Reorder"]                         [Backend Jalankan ExecScan()]
        │                                                      │
        ▼                                                      ▼
[Lihat Daftar Barang Low Stock & Supplier]             [Toast Notifikasi: "N PO Draf Dibuat"]
        │                                                      │
        ▼                                                      ▼
[Navigasi ke Riwayat PO (/po-log)] ◄───────────────────────────┘
        │
        ▼
[Lihat PO Berstatus "DRAF"]
        │
        ▼
[Buka Editor Draf (/po-log/:id/draft)]
        │
        ├── [Ubah Qty / Hapus Barang / Tambah Barang] ──► [Simpan Draf]
        │
        └── [Klik "Kirim ke Manajer"] ──► [Status PENDING_APPROVAL + Email ke Manager]
```

---

### Flow 3: Alur Persetujuan & Pengiriman PO (Operations Manager Flow)

```text
[Manager Menerima Email Ringkasan PO]
        │
        ├── [Membaca Ringkasan & Daftar Barang]
        │
        ▼
[Manager Klik Tombol di Email]
        │
        ├── Tombol [APPROVE] ──► GET /api/po/approval?token=xxx&action=approve
        └── Tombol [REJECT]  ──► GET /api/po/approval?token=xxx&action=reject
                                        │
                                        ▼
                        [Backend: Validasi Token, TTL 48 Jam, Redis Lock]
                                        │
                                        ├── JIKA Token Valid & Status PENDING_APPROVAL
                                        │         │
                                        │         ├── Action = APPROVE ──► [Update Status: SENT]
                                        │         │                             │
                                        │         │                             ▼
                                        │         │                   [Antrekan Email PDF ke Supplier]
                                        │         │
                                        │         └── Action = REJECT  ──► [Update Status: REJECTED]
                                        │
                                        ├── JIKA Status DRAFT ──► [Halaman "Belum Diajukan"]
                                        ├── JIKA Status Lain ──► [Halaman "Sudah Digunakan"]
                                        └── JIKA TTL Lewat ──► [Status REQUIRES_MANUAL_REVIEW + Halaman Kedaluwarsa]
                                        │
                                        ▼
                        [Render Halaman Konfirmasi dari Backend (/api/po/approval)]
```

---

### Flow 4: Penerimaan Barang (Admin Inventori Flow)

```text
[Admin Buka Riwayat PO (/po-log)]
        │
        ├── Tab "Terkirim" atau "Diterima Sebagian"
        │
        ▼
[Klik "Terima Barang" di tabel atau detail PO]
        │
        ▼
[GET /api/po-penerimaan/{id}]
        │
        ▼
[Dialog menampilkan per SKU: jumlah order, sudah diterima, sisa, input qty]
        │
        ▼
[Admin Isi Qty Aktual] (0 berarti barang belum datang)
        │
        ├── JIKA qty bukan bilangan bulat / melebihi sisa / semua 0 ──► [Pesan validasi di dialog]
        │
        ▼
[POST /api/po-penerimaan/{id}]
        │
        ├── HTTP 400 JIKA qty melebihi sisa atau tidak ada qty lebih dari 0
        ├── HTTP 409 JIKA status PO bukan SENT / PARTIALLY_RECEIVED
        ├── HTTP 403 JIKA role bukan admin
        │
        ▼
[Stok bertambah, status PO diperbarui, cache dashboard/stok/PO dibersihkan]
        │
        ▼
[Dialog Tertutup] ──► [Badge PO: Diterima Sebagian / Diterima]
```

---

## 3. Peta Entitas & Hirarki Data (Entity Mapping)

```text
+------------------------+          1 : N          +------------------------+
|        PEMASOK         | ----------------------- |          STOK          |
+------------------------+                         +------------------------+
| id (PK)                |                         | sku (PK)               |
| nama                   |                         | nama                   |
| email                  |                         | stok_saat_ini          |
| created_at             |                         | reorder_point          |
+------------------------+                         | qty_min_order          |
            |                                      | id_pemasok (FK)        |
            | 1 : N                                | updated_at             |
            ▼                                      +------------------------+
+------------------------+                                     |
|         PO_LOG         |                                     | 1 : N
+------------------------+                                     |
| id (PK)                |                                     ▼
| nomor_po (UNIQUE)      |                         +------------------------+
| id_pemasok (FK)        | ----------------------- |       PO_DETAIL        |
| status                 |          1 : N          +------------------------+
| tautan_pdf             |                         | id (PK)                |
| token (UNIQUE)         |                         | po_id (FK)             |
| submitted_at           |                         | sku (FK)               |
| created_at             |                         | jumlah_order           |
| updated_at             |                         +------------------------+
+------------------------+

+------------------------+          1 : N          +------------------------+
|     PO_PENERIMAAN      | ----------------------- |  PO_PENERIMAAN_DETAIL  |
+------------------------+                         +------------------------+
| id (PK)                |                         | id (PK)                |
| po_id (FK po_log)      |                         | penerimaan_id (FK)     |
| actor_id (FK users)    |                         | sku (FK stok)          |
| created_at             |                         | qty_diterima           |
+------------------------+                         +------------------------+

+------------------------+          1 : N          +------------------------+
|         USERS          | ----------------------- |      STOK_OPNAME       |
+------------------------+                         +------------------------+
| id (PK)                |                         | id (PK)                |
| email (UNIQUE)         |                         | sku (FK)               |
| password_hash          |                         | stok_sebelum           |
| nama                   |                         | stok_sesudah           |
| role (admin/manager)   |                         | alasan                 |
| created_at             |                         | actor_id (FK users)    |
+------------------------+                         | created_at             |
                                                   +------------------------+
```

Nilai status PO: `DRAFT`, `PENDING_APPROVAL`, `SENT`, `REJECTED`, `REQUIRES_MANUAL_REVIEW`, `PARTIALLY_RECEIVED`, `RECEIVED`.
Nilai status SKU turunan: `NORMAL`, `LOW_STOCK`, `REQUIRES_MANUAL_REVIEW`.

---

## 4. Peta Kondisi Layar (Screen State Map)

| Halaman | Condition: Loading | Condition: Empty State | Condition: Data Available | Condition: Error State |
| :--- | :--- | :--- | :--- | :--- |
| **Login (/login)** | Tombol submit disabled + spinner saat request login. | - | Form email/password, redirect ke halaman asal atau dashboard setelah sukses. | Pesan merah "Email atau password salah" / pesan koneksi. |
| **Dashboard (/)** | Skeleton 6 kartu KPI + skeleton tabel. | KPI bernilai 0, tabel "Semua stok di atas ROP". | Kartu KPI terisi, banner low stock dan banner data abnormal jika ada. | `ErrorState`: "Gagal memuat data dari server" + tombol "Coba Lagi". |
| **Data Stok (/stok)** | Skeleton baris tabel. | Copy berbeda per tab: "Belum ada data inventori", "Tidak ada produk di bawah ROP", "Tidak ada produk yang perlu peninjauan". | Tabel SKU dengan badge status, aksi Opname (admin) dan Detail. | `ErrorState` dengan tombol "Coba Lagi". |
| **Riwayat PO (/po-log)** | Skeleton baris tabel. | Copy per status: "Belum ada riwayat Purchase Order", "Tidak ada PO berstatus draf", dan seterusnya. | Tabel PO, filter pemasok, aksi Detail dan Lihat PDF, tautan edit dan tombol "Terima Barang" untuk admin. | `ErrorState` dengan tombol "Coba Lagi". |
| **Dialog Terima Barang (Riwayat PO)** | "Memuat data penerimaan..." di dalam dialog. | Dialog hanya dibuka untuk PO `SENT` atau `PARTIALLY_RECEIVED`, jadi selalu ada baris barang. | Tabel qty per SKU, riwayat penerimaan sebelumnya, dan tombol Simpan Penerimaan. | Pesan "Data penerimaan gagal dimuat" atau validasi per baris saat qty melebihi sisa. |
| **Editor Draf (/po-log/:id/draft)** | Skeleton halaman + "Memuat daftar stok pemasok...". | "Draf ini belum punya barang" + form tambah barang. | Baris barang editable, total qty, tombol Simpan Draf dan Kirim ke Manajer. Status `PENDING_APPROVAL`, `SENT`, `PARTIALLY_RECEIVED`, dan `RECEIVED` menampilkan tampilan terkunci. | `ErrorState` dari loader, atau kotak `role="alert"` untuk error aksi. Manager melihat panel read-only. |
| **Approval Landing (/api/po/approval)** | Halaman HTML backend menampilkan hasil proses. | - | Card hijau (sukses), amber (sudah dipakai / belum diajukan), merah (kedaluwarsa / token invalid). | Card merah "Token persetujuan tidak ditemukan atau sudah kedaluwarsa." |

Catatan: tidak ada dark mode, pagination, pencarian, atau filter tanggal di kedua tabel.

---

## 5. Matriks Struktur Komponen Web (React Component Tree)

```text
<App>
  ├── <AuthProvider /> (token, user, login, logout, status)
  └── <Routes>
        ├── <LoginPage />
        │     └── form email/password + banner error
        │
        ├── <ProtectedRoute /> (redirect /login jika token kosong / 401)
        │     └── <AppShell /> (sidebar + mobile top bar + skip link)
        │           ├── <Sidebar /> (Dashboard, Data Stok, Riwayat PO)
        │           │     └── profil user + tombol logout
        │           │
        │           ├── <Dashboard>
        │           │     ├── <PageHeader />
        │           │     ├── banner low stock + <ConfirmDialog /> scan
        │           │     ├── banner data abnormal
        │           │     ├── <KpiCard /> x6
        │           │     ├── <StockTable compact />
        │           │     └── <DetailDialog />
        │           │
        │           ├── <StockList>
        │           │     ├── <PageHeader /> + tombol "Pindai Stok"
        │           │     ├── <FilterTabs /> (Semua | Perlu Reorder | Perlu Peninjauan)
        │           │     ├── <StockTable>
        │           │     │     └── <StatusBadge />
        │           │     ├── <OpnameDialog /> [Admin only]
        │           │     ├── <DetailDialog />
        │           │     └── <ConfirmDialog /> scan
        │           │
        │           ├── <POLogList>
        │           │     ├── <PageHeader />
        │           │     ├── <FilterTabs /> (8 status)
        │           │     ├── filter pemasok <select>
        │           │     ├── <POLogTable>
        │           │     │     ├── <StatusBadge />
        │           │     │     ├── tombol "Terima Barang" [Admin only, SENT / PARTIALLY_RECEIVED]
        │           │     │     ├── tautan Edit Draf / Revisi / Proses Ulang [Admin only]
        │           │     │     ├── tombol Detail
        │           │     │     └── tautan Lihat PDF
        │           │     ├── <DetailDialog />
        │           │     └── <TerimaBarangDialog /> (Modal size lg) [Admin only]
        │           │
        │           └── <PODraftEditor>
        │                 ├── <PageHeader /> + tombol kembali
        │                 ├── baris barang editable (qty, hapus, tambah)
        │                 ├── <ConfirmDialog /> kirim ke manajer
        │                 └── tampilan terkunci untuk PENDING_APPROVAL, SENT, PARTIALLY_RECEIVED, RECEIVED
        │
        └── (Approval tidak punya route React; link email diarahkan ke HTML backend /api/po/approval)
```

Komponen pendukung: `Modal`, `ConfirmDialog`, `DetailDialog`, `OpnameDialog`, `TerimaBarangDialog`, `StatusBadge`, `FilterTabs`, `PageHeader`, `KpiCard`, `StockTable`, `POLogTable`, `TableSkeleton`, `EmptyState`, `ErrorState`.
