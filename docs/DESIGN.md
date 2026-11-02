# DESIGN.md: ReorderFlow Design System & UI Specifications

## 1. Brand Overview & Persona

**ReorderFlow** adalah platform sistem otomasi Reorder Point (ROP) dan pengadaan barang mandiri yang dirancang bagi pemilik usaha mikro, kecil, dan menengah (UMKM) seperti toko grosir dan ritel sembako.

### Brand Personality & Core Principles:
- **Warm & Trustworthy**: Menghindari kesan software enterprise yang kaku dengan pendekatan warna hangat berbasis *roasted coffee & kraft paper*.
- **Ergonomic & Low Cognitive Load**: Layout lapang agar staf gudang atau admin toko dapat memeriksa angka stok kritis dan batas ROP dengan cepat.
- **Idempotent & Decisive Action**: Alur draf, persetujuan manajer lewat email publik, dan pengiriman ke pemasok memberi kepastian status serta mencegah pemesanan ganda.

---

## 2. Color System & Design Tokens

Token warna didefinisikan di `frontend/tailwind.config.js` dan dipakai lewat kelas `brand-*`.

### Primary Palette (Warm Organic Theme)

| Token Tailwind | Hex | Role & Usage |
| :--- | :--- | :--- |
| `brand-cream` | `#FEF3E2` | Latar kanvas utama dan latar halaman login kiri |
| `brand-shell` | `#E2CBB0` | Latar sidebar, dipakai sebagai `bg-brand-shell/50` |
| `brand-line` | `#CEB394` | Border pemisah sidebar dan skeleton bar |
| `brand-dark` | `#2A1A0E` | Teks judul, label primer, border kontras, dan badge `SENT` |
| `brand-muted` | `#6A5B4E` | Teks sekunder dan keterangan |
| `brand-field` | `#A08972` | Outline field input dan select |
| `brand-orange` | `#B85114` | Tombol utama, menu aktif, tautan aksi, dan fokus |
| `brand-orange-strong` | `#9C4410` | Hover tombol utama |
| `brand-amber` | `#F4AE52` | Aksen sekunder |

Warna fokus global tetap memakai `#D4621A` dengan `outline: 2px solid` dan offset 2px di `src/index.css`.

### Semantic & Feedback Colors

| Status | Background | Text | Border | Label Badge |
| :--- | :--- | :--- | :--- | :--- |
| `NORMAL` | `bg-emerald-50` | `text-emerald-700` | `border-emerald-200` | `Normal` |
| `LOW_STOCK` | `bg-amber-50` | `text-amber-800` | `border-amber-200` | `Low Stock` |
| `REQUIRES_MANUAL_REVIEW` | `bg-purple-50` | `text-purple-700` | `border-purple-200` | `Review` |
| `DRAFT` | `bg-brand-cream` | `text-brand-muted` | `border-brand-dark/15` | `Draf` |
| `PENDING_APPROVAL` | `bg-amber-50` | `text-amber-800` | `border-amber-200` | `Menunggu` |
| `SENT` | `bg-brand-dark` | `text-white` | `border-brand-dark/30` | `Terkirim` |
| `REJECTED` | `bg-rose-50` | `text-rose-700` | `border-rose-200` | `Ditolak` |

Badge memakai `inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide`.

---

## 3. Typography Scale & Hierarchy

- **Font Sans**: `Plus Jakarta Sans`, fallback `ui-sans-serif`, `system-ui`.
- **Font Mono**: `JetBrains Mono`, dipakai untuk SKU, nomor PO, dan angka.

| Level | Size / Weight | Penggunaan |
| :--- | :--- | :--- |
| **Page Header** | `text-xl` sampai `text-2xl`, Bold | "Ringkasan Operasional", "Data Stok", "Riwayat PO" |
| **Section Header** | `text-sm` sampai `text-lg`, Semibold | "Stok di bawah ROP", "Daftar SKU", "Daftar Purchase Order" |
| **Card Metric Numbers** | `text-2xl`, Bold, tabular nums | Angka KPI |
| **Table Head / Micro Label** | `text-[11px]` sampai `text-xs`, Bold, Uppercase | Header tabel |
| **Body** | `text-xs` sampai `text-sm`, Medium/Semibold | Isi tabel dan form |
| **Caption** | `text-[10px]` sampai `text-xs`, Medium | Tanggal, role, subketerangan |

---

## 4. Layout Architecture & Component Rules

### 1. Persistent App Shell

- **Sidebar**: lebar tetap `w-64`, `fixed inset-y-0 left-0`, `bg-brand-shell/50`, `border-r border-brand-dark/10`.
  - Brand: logo `logo-reorderflow.png` dalam kontainer putih `rounded-xl`, teks `ReorderFlow` dengan aksen `Flow` berwarna `text-brand-orange`, subjudul "Sistem Otomasi ROP".
  - Navigasi: hanya tiga item, yaitu Dashboard (`/`), Data Stok (`/stok`), dan Riwayat PO (`/po-log`). Item aktif memakai `bg-brand-orange text-white`.
  - Profil: kartu putih berisi inisial user, nama, label role (`Admin Inventori` / `Operations Manager`), dan tombol logout.
  - Mobile: sidebar menjadi drawer dengan backdrop dan tombol hamburger di top bar `lg:hidden`.
- **Main Canvas**: `lg:pl-64`, kontainer `max-w-7xl` dengan padding `px-4 py-8 sm:px-6 lg:px-8`.
- **Skip link**: "Lewati ke konten utama" menuju `#main`.

### 2. Data Table Standards

- **Container**: `bg-white rounded-xl border border-brand-dark/10`.
- **Thead**: teks `text-[11px]` atau `text-xs`, `font-semibold`, uppercase.
- **Row Padding**: `py-3` sampai `py-4`, nyaman untuk staf yang memeriksa banyak baris.
- **Hover**: `hover:bg-brand-cream/40`.
- **Aksi**: tombol dan tautan kecil `text-xs font-semibold`, aksi admin memakai `text-brand-orange`.

### 3. Metric Summary Cards

- `KpiCard` memakai `bg-white rounded-xl border border-brand-dark/10 px-5 py-5`.
- Angka besar dan bersih tanpa chart dekoratif.
- Dashboard menampilkan 5 kartu: Total SKU, Stok Rendah, Draf PO, Menunggu Persetujuan, PO Terkirim.

### 4. Banner Operasional

- **Low stock**: `border-amber-200 bg-amber-50`, teks `text-amber-900`, tombol "Buat Draf PO" untuk admin.
- **Data abnormal**: `border-purple-200 bg-purple-50`, teks `text-purple-800`, tautan "Periksa Data" ke `/stok?status=manual`.

### 5. Dialog & Modal

- `Modal` memakai overlay `bg-brand-dark/50 backdrop-blur-sm` dan panel `bg-white rounded-2xl max-w-md`. Pada mobile panel muncul sebagai bottom sheet (`rounded-t-2xl`), pada `sm` ke atas menjadi dialog tengah.
- Fokus dikunci di dalam dialog, `Escape` menutup, dan fokus kembali ke elemen pemicu setelah dialog ditutup.
- `ConfirmDialog` untuk konfirmasi scan dan pengiriman draf ke manajer.
- `DetailDialog` menampilkan pasangan label dan nilai, termasuk daftar barang PO.
- `OpnameDialog` berisi stok saat ini (read-only), input hasil opname, dan pilihan alasan `Rusak`, `Salah hitung`, `Retur`.
- Semua dialog dapat ditutup dengan tombol, klik overlay, dan tombol `Escape`.

### 6. Editor Draf PO (`/po-log/:id/draft`)

- Baris barang editable dengan input qty `min=1`, tombol "Hapus", dan select "Tambah barang" yang hanya menampilkan SKU dari pemasok yang sama.
- Ringkasan menampilkan jumlah barang dan total unit. Tidak ada harga, subtotal, atau pajak.
- Tombol "Simpan Draf" dan "Kirim ke Manajer", dengan dialog konfirmasi sebelum pengiriman.
- Status `PENDING_APPROVAL` dan `SENT` menampilkan tampilan terkunci.
- Role `manager` melihat panel read-only dengan pesan bahwa persetujuan dilakukan lewat tautan email.

### 7. Idempotent Action Response Landing (Public Approval)

- Halaman HTML dari backend, bukan route React.
- Kartu terpusat `max-w-[560px] bg-white`, `border-radius: 16px`, dengan bar aksen atas:
  - Hijau `#047857` untuk sukses.
  - Amber `#D97706` untuk tautan sudah digunakan atau PO belum diajukan.
  - Merah `#BE123C` untuk token invalid atau kedaluwarsa.
- Menampilkan nomor PO dan status terbaru jika tersedia.

### 8. Login Page (Public)

- Layout dua kolom pada desktop:
  - Panel kiri `lg:w-[60%]`, latar `#EAD8C0`, berisi brand, headline "Tahu kapan harus order, sebelum kehabisan.", dan ilustrasi `illustration.webp`.
  - Panel kanan `bg-white` dengan form `max-w-[340px]`.
- Pada mobile, panel kiri disembunyikan dan logo muncul di atas form.
- Judul form: "Masuk ke akun Anda", subjudul "Gunakan akun yang disiapkan admin toko."
- Field email dan password memakai `rounded-xl border border-brand-field bg-brand-cream/40 px-4 py-3 text-sm`.
- Tombol utama full-width `h-11 bg-brand-orange text-white rounded-xl font-bold` dengan label "Masuk".
- Loading: tombol disabled, spinner, teks "Memproses...".
- Error: banner `border-rose-200 bg-rose-50 text-rose-700`.
- Validasi klien: format email dan password minimal 8 karakter.

### 9. PDF Access

- Aksi PDF berupa tautan "Lihat PDF" yang membuka `tautan_pdf` Supabase Storage di tab baru.
- Tidak ada modal preview PDF, slide-over A4, watermark, atau blok tanda tangan digital di UI.

### 10. Theme & Motion

- Hanya light theme. Tidak ada toggle dark mode.
- Animasi dibatasi pada transisi hover, overlay, dan modal (`overlay-in`, `modal-in`).
- `prefers-reduced-motion` menonaktifkan animasi dan transisi.
