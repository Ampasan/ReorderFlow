# DESIGN.md — ReorderFlow Design System & UI Specifications

## 1. Brand Overview & Persona
**ReorderFlow** adalah platform sistem otomasi Reorder Point (ROP) & pengadaan barang mandiri yang dirancang khusus bagi pemilik usaha mikro, kecil, dan menengah (UMKM) seperti toko grosir dan ritel sembako.

### Brand Personality & Core Principles:
- **Warm & Trustworthy**: Menghilangkan kesan software enterprise yang kaku dengan pendekatan warna hangat berbasis *roasted coffee & kraft paper*.
- **Ergonomic & Low Cognitive Load**: Layout didesain lapang (*generous vertical padding* `py-4`) agar staf gudang atau admin toko dapat memeriksa angka stok kritis dan batas ROP dengan sekali lirik tanpa kelelahan mata.
- **Idempotent & Decisive Action**: Alur transaksi penting (seperti persetujuan manajer melalui email publik dan pembuatan draft PO) memberikan kepastian status instan serta proteksi pemesanan ganda.

---

## 2. Color System & Design Tokens

### Primary Palette (Warm Organic Theme)
| Token Name | Hex Code | Role & Usage |
| :--- | :--- | :--- |
| **Canvas Background** | `#FEF3E2` | Latar belakang kanvas utama (*main page canvas*) yang hangat dan lembut di mata |
| **Sidebar Background** | `#EAD8C0` | Latar sidebar navigasi; turunan `#FEF3E2` yang digelapkan secara proporsional untuk kontras struktur |
| **Brand Dark (Typography & Shell)** | `#2A1A0E` | Teks judul, label primer, border kontras, dan tombol aksi netral tinggi |
| **Brand Primary / Terracotta** | `#D4621A` | Aksen tombol utama (*Primary CTA*), active menu sidebar, tautan aktif, dan penanda penting |
| **Warm Accent / Amber Gold** | `#F4AE52` | Status draf, badge penanda peringatan awal ROP, dan aksen sekunder |

### Semantic & Feedback Colors
| Status / Intent | Background | Text Color | Border Color | Makna Operasional |
| :--- | :--- | :--- | :--- | :--- |
| **LOW STOCK (Kritis)** | `bg-rose-50` (`#FFF1F2`) | `text-rose-700` (`#BE123C`) | `border-rose-200` | Stok telah mencapai atau di bawah batas ROP; butuh order segera |
| **NORMAL (Aman)** | `bg-emerald-50` (`#ECFDF5`) | `text-emerald-700` (`#047857`) | `border-emerald-200` | Ketersediaan stok berada di atas batas ROP aman |
| **DRAFT / PENDING** | `bg-amber-50` (`#FFFBEB`) | `text-amber-800` (`#92400E`) | `border-amber-200` | PO selesai dibuat sistem dan menunggu tanda tangan/persetujuan manajer |
| **REVIEW NEEDED (Anomali)** | `bg-purple-50` (`#FAF5FF`) | `text-purple-700` (`#7E22CE`) | `border-purple-200` | Terjadi anomali fisik (misal stok negatif); butuh stok opname |
| **REJECTED (Ditolak)** | `bg-rose-50` (`#FFF1F2`) | `text-rose-800` (`#9F1239`) | `border-rose-200` | Penawaran atau draf PO ditolak manajer operasional |

---

## 3. Typography Scale & Hierarchy

- **Font Family**: Modern Sans-Serif (`Inter`, `Plus Jakarta Sans`, atau sistem fallback sans-serif).
- **Monospace Font**: `JetBrains Mono` / standard monospace untuk SKU kode barang (`SKU-KOPI-01`), Nomor PO (`#PO-20261026-01-001`), dan angka nominal mata uang (`Rp 1.200.000`).

| Level | Size / Weight | Line Height | Contoh Penggunaan |
| :--- | :--- | :--- | :--- |
| **Display / Page Header** | `28px - 32px` (`text-2xl` - `text-3xl`), **Extrabold (800)** | Tight | "Ringkasan Operasional", "Kelola Data Stok", "Riwayat Purchase Order" |
| **Section Header** | `18px - 20px` (`text-lg` - `text-xl`), **Extrabold (800)** | Snug | "Low Stock", Kartu Response Persetujuan, Header Modal |
| **Card Metric Numbers** | `32px - 36px` (`text-3xl` - `text-4xl`), **Extrabold (800)** | None / Tight | "20 SKU", "3 SKU", "1 PO" |
| **Table Head / Micro Label** | `11px - 12px` (`text-xs`), **Bold (700)**, Uppercase Tracking | Wide | Kolom Header Tabel: `SKU`, `NAMA PRODUK`, `STOK SAAT INI` |
| **Body Primary** | `13px - 14px` (`text-xs` - `text-sm`), **Semibold / Medium** | Normal | Nama produk, nama supplier, catatan penerimaan |
| **Caption / Supporting Text** | `10px - 11px` (`text-[10px]` - `text-[11px]`), **Medium (500)** | Normal | Tanggal transaksi, status toko ("UMKM Aktif"), subketerangan |

---

## 4. Layout Architecture & Component Rules

### 1. Persistent App Shell (Web Dashboard Layout)
- **Left Sidebar**: 
  - Lebar tetap `w-64` (256px), `fixed h-full`, background `#EAD8C0`, border kanan `border-r border-[#2A1A0E]/10`.
  - Bagian atas: Logo brand `Logo_ReorderFlow.png` dalam kontainer putih rounded-xl dengan teks nama aplikasi `ReorderFlow` (aksen "Flow" `#D4621A`) + subjudul `Sistem Otomasi ROP`.
  - Navigasi: Menu aktif menggunakan background solid terracotta `#D4621A` dengan teks putih dan ikon 16px. Menu inaktif menggunakan teks `#2A1A0E/75` dengan efek hover `#FEF3E2/70`.
  - Bagian bawah: Profile card toko (misal *"Toko Sembako Berkah"* atau *"Kopi Kenangan UMKM"*) berlatar `#FEF3E2` dengan avatar badge oranye dan indikator aktif dot hijau `bg-emerald-500`.
- **Main Canvas**:
  - `flex-1 ml-64 p-6 sm:p-8`, background `#FEF3E2`, scroll vertikal bersih.

### 2. Data Table Standards (Ergonomic UMKM Table)
- **Container**: `bg-white rounded-2xl border border-[#2A1A0E]/10 overflow-hidden shadow-sm`.
- **Thead**: `bg-[#FEF3E2]/60 text-[#2A1A0E] text-xs font-bold uppercase tracking-wider border-b border-[#2A1A0E]/10`.
- **Row Padding**: Vertikal lega `py-4 px-4` untuk meminimalisir kesalahan klik oleh staf.
- **Zebra & Hover**: `hover:bg-[#FEF3E2]/40 transition-colors`. Baris Low Stock memiliki highlight halus `bg-rose-50/20`.
- **Action Buttons**: Tombol aksi cepat seperti `+ Buat PO` menggunakan terracotta `#D4621A text-white rounded-lg px-3 py-1.5 font-semibold text-xs`.

### 3. Metric Summary Cards
- Kartu ringkasan operasional dengan latar `bg-white p-5 rounded-2xl border border-[#2A1A0E]/10 shadow-sm`.
- Angka metrik ditampilkan bersih dan besar tanpa chart 3D dekoratif yang tidak perlu, langsung menjawab pertanyaan kunci pengguna: *"Berapa produk kritis hari ini?"*.

### 4. Document Modal & Physical Paper Simulation (A4 Standard)
- Slide-over drawer sisi kanan dengan lebar `520px - 560px` dan `backdrop-blur-xs bg-[#2A1A0E]/30`.
- Lembar dokumen meniru layout fisik kertas A4 (`bg-white rounded-2xl p-6 sm:p-8 border border-[#2A1A0E]/10`):
  - Kop surat resmi lengkap dengan logo perusahaan, NPWP, dan alamat gudang.
  - Watermark diagonal dinamis (`DRAFT / MENUNGGU PERSETUJUAN`) menggunakan teks uppercase berputar -30 derajat dengan opacity rendah.
  - Kolom tanda tangan digital berpasangan (*Staf Pengadaan* dan *Manajer Operasional*).

### 5. Idempotent Action Response Landing (Public Approval)
- Halaman tanpa autentikasi untuk manajer via link email:
  - Tata letak terpusat penuh (*Centered Card* `max-w-[560px] bg-white rounded-3xl p-8 border border-[#2A1A0E]/10 shadow-xl`).
  - Bar indikator warna status di tepi atas kartu (Hijau untuk sukses disetujui, Amber untuk tautan telah terpakai, Merah untuk token kedaluwarsa).
  - Penjelasan idempotent eksplisit agar manajer yakin pemesanan ganda tidak akan pernah terjadi.

### 6. Login Page (Public)
- **Layout**: kanvas penuh `min-h-screen bg-[#FEF3E2]` tanpa sidebar. Kartu terpusat `max-w-[420px] w-full bg-white rounded-3xl p-8 border border-[#2A1A0E]/10 shadow-xl`.
- **Brand**: logo ReorderFlow di kontainer putih rounded-xl, judul "Masuk ke ReorderFlow", subjudul "Sistem Otomasi ROP".
- **Form**:
  - Field `Email` dan `Password` dengan label `text-xs font-bold uppercase tracking-wider`.
  - Input `w-full rounded-xl border border-[#2A1A0E]/15 px-4 py-3 text-sm`, focus ring terracotta `focus:ring-2 focus:ring-[#D4621A]/30 focus:border-[#D4621A]`.
  - Tombol utama full-width `bg-[#D4621A] text-white rounded-xl py-3 font-bold` dengan label "Masuk".
- **Loading state**: tombol disabled + spinner, input disabled, teks "Memproses...".
- **Error state**: banner `bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-4 py-3 text-sm` berisi "Email atau password salah" atau pesan koneksi.
- **Session behavior**: setelah sukses simpan JWT dan redirect ke `/`; respons `401` dari request berikutnya menghapus sesi dan kembali ke `/login`.
- **Role behavior**: admin dan manager memakai halaman login yang sama. Tombol "Pindai Stok Sekarang" hanya dirender untuk role `admin`; manager melihat dashboard read-only.
