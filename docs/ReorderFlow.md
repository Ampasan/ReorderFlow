# Proposal Konsep Proyek: ReorderFlow

---

## 1. Ringkasan Eksekutif & Konsep Utama

| Bagian | Keterangan |
| :--- | :--- |
| **Industri** | Business Operations (Logistics & Supply Chain, Retail/SME workflows) |
| **Nama Konsep** | *ReorderFlow* |
| **Konsep** | Automasi berbasis aturan yang membaca data stok di Supabase, mendeteksi barang yang mencapai batas pemesanan ulang (*Reorder Point* / ROP), lalu menerbitkan draf Purchase Order (PDF) per pemasok. Draf dikirim ke manajer untuk disetujui; hanya setelah persetujuan, PO dikirim ke email pemasok. |
| **Pain Point** | Staf inventori/pengadaan UMKM memantau stok secara manual di spreadsheet. Akibatnya, barang yang sudah di bawah batas aman sering terlambat disadari, PO diketik ulang manual, dan *stockout* baru ketahuan ketika pelanggan sudah ingin membeli. Dampaknya: penjualan hilang, pesanan mendesak yang lebih mahal, dan waktu admin terbuang. |

---

## 2. Bukti Masalah & Sumber Riset

### Bukti Masalah Utama
1. **Judul Masalah 1: Stockout dan Overstock Merugikan Ritel secara Global**
   - **Sumber**: IHL Group, *The 2026 Inventory Distortion Study* (16 Okt 2026).
   - **Kutipan**: Biaya *out-of-stocks* dan *overstocks* ritel mencapai sekitar US$1,7 triliun per tahun (~6,2% penjualan ritel global).
   - **Keterbatasan**: Berfokus pada skala enterprise (min. 50 lokasi), hasil model estimasi.

2. **Judul Masalah 2: UMKM Ritel Masih Menghitung Stok Manual & Sadar Stockout Saat Pelanggan Datang**
   - **Sumber**: Global Payments, *2025 Retail Inventory Report* oleh Aly Kostka (24 Nov 2025).
   - **Kutipan**: "Over half of retailers still rely on manual counts." Hampir 1 dari 4 peritel baru mengetahui stok habis saat pelanggan mencoba membeli.
   - **Keterbatasan**: Survei 200 bisnis ritel kecil oleh penyedia POS (potensi bias vendor).

3. **Judul Masalah 3: Pencatatan Manual di UMKM Menimbulkan Selisih Stok & Stockout Rutin**
   - **Sumber**: Christopher Petro Chimbuto, IJISRT vol. 11 no. 2, hlm. 3119–3124 (2026).
   - **Kutipan**: Dari 30 operator UMKM, 63,3% memakai pelacakan manual dengan selisih stok rata-rata 22%, dan 60% mengalami *stockout* setiap bulan.
   - **Keterbatasan**: Sampel kecil (n=30 Mzuzu, Malawi).

### Sumber Pendukung Otoritatif / Peer-Review
- **Panigrahi & Shrivastava (2024)**, *International Journal of Productivity and Performance Management* (Emerald): UMKM menghadapi risiko lebih tinggi pada arus kas, ruang simpan, dan *stockout* karena sumber daya terbatas.
- **Panigrahi et al. (2022)**, *Global Knowledge, Memory and Communication* (Emerald): Pengetahuan praktik inventori berpengaruh langsung pada kinerja operasional UMKM manufaktur.
- **OECD (2021)**, *Trade finance for SMEs in the digital era*: Semakin kecil perusahaan, semakin kecil kemungkinan memakai sistem rantai pasok digital/ERP.

### Kasus Organisasi
- **PT Genta Trikarya**: Produsen alat musik yang menggunakan metode EOQ dan ROP. Penulis menyebut "manual inventory tracking, outdated technology" dan pemasok tidak andal masih menghambat kinerja.

---

## 3. Target User / Persona

| Persona | Peran / Jabatan | Kebutuhan / Tujuan | Masalah / Hambatan |
| :--- | :--- | :--- | :--- |
| **Target User 1** | Staf Inventori / Procurement Admin (UMKM ritel, distributor kecil, manufaktur kecil) | Mengetahui lebih awal barang yang harus dipesan ulang dan menyiapkan PO dengan cepat tanpa salah ketik SKU/kuantitas. | Stok diperbarui manual di spreadsheet, pengecekan ROP dilakukan manual, PO diketik ulang di Word/Excel. |
| **Target User 2** | Pemilik Usaha / Operations Manager (Penyetuju PO) | Menyetujui pembelian dengan cepat dan tetap mengontrol pengeluaran operasional. | Permintaan persetujuan datang lewat chat/lisan tanpa ringkasan jelas, sehingga keputusan tertunda/tidak terdokumentasi. |

---

## 4. Proses Saat Ini (AS-IS)

1. Staf mencatat barang masuk/keluar ke Google Sheets / Excel secara manual.
2. Secara berkala, staf memeriksa kolom stok dan membandingkannya dengan ROP secara manual.
3. Untuk barang yang rendah, staf membuka data pemasok dan mengetik PO di Word/Excel.
4. PO dikirim ke manajer lewat chat atau email untuk persetujuan.
5. Setelah disetujui, staf mengirim PO ke pemasok via email atau WhatsApp.

> **Risiko Kegagalan AS-IS**: Pengecekan terlewat, barang habis sebelum PO terkirim, SKU/kuantitas salah ketik, atau PO menumpuk tanpa pengingat persetujuan.

---

## 5. Solusi Automasi (ReorderFlow)

Seluruh logika berbasis aturan (*rule-based* tanpa AI) untuk keandalan maksimal dan bebas risiko halusinasi:

### Fitur 1: Deteksi Low-Stock Otomatis
- **Input**: Tabel `stok` (SKU, nama, stok_saat_ini, reorder_point, qty_min_order, id_pemasok) dan tabel `pemasok`.
- **Proses**: Job terjadwal harian di backend Go (Gin) membaca data Supabase, memvalidasi data, memilih SKU dengan `stok_saat_ini <= reorder_point`, dan melewati SKU yang sudah punya PO aktif (mencegah PO ganda).
- **Output**: Daftar SKU *low-stock* dan baris PO berstatus `DRAFT` di tabel `po_log`.
- **Penanganan Gagal**: Jika stok negatif, kosong, atau ROP tidak diisi, SKU diberi status `REQUIRES_MANUAL_REVIEW`.

### Fitur 2: Draf PO PDF Per Pemasok
- **Input**: SKU *low-stock* yang lolos validasi + data pemasok.
- **Proses**: Mengelompokkan SKU per pemasok, membuat nomor PO unik, me-render PDF di backend Go (`gofpdf`), dan mengunggahnya ke Supabase Storage.
- **Output**: File PDF PO dan tautannya di tabel `po_log`.
- **Penanganan Gagal**: Jika email pemasok kosong/tidak valid, alur berhenti untuk pemasok tersebut dan mengirim peringatan. Gagal pembuat PDF akan di-retry otomatis maks. 3 kali.

### Fitur 3: Persetujuan & Pengiriman ke Pemasok (Human-in-the-Loop)
- **Input**: PO PDF berstatus `DRAFT`.
- **Proses**: Mengirim email ke manajer berisi ringkasan PO, lampiran PDF, dan link *Approve/Reject* satu kali pakai (32-char crypto token). Setelah *Approve*, PO PDF dikirim otomatis ke email pemasok dan status berubah menjadi `SENT`.
- **Output**: Email ke pemasok, status dan timestamp tercatat di `po_log`.
- **Penanganan Gagal**: Link kedaluwarsa/diklik ganda ditolak (idempotency). *Reject* mengubah status menjadi `REJECTED`. Retry pengiriman email maks. 3 kali.

---

## 6. Analisis Kompetitor & Alternatif

| Kompetitor / Tools | Target User | Model Bisnis / Harga | Fitur Utama | Gap / Keunggulan ReorderFlow |
| :--- | :--- | :--- | :--- | :--- |
| **Zoho Inventory** | UMKM & E-commerce | Freemium (50 order/bln); Berbayar US$29–US$249/bln | Pelacakan stok, PO, reorder, integrasi toko online | Pengguna harus migrasi total dari spreadsheet; alur persetujuan PO spesifik per pemasok terbatas. |
| **Zapier (Sheets + Gmail)** | Non-developer | Free (100 task); Pro US$19,99/bln; Team US$69/bln | Trigger Sheets, kirim email, 9000+ integrasi | Pengguna harus merancang alur sendiri; tiap aksi memakan kuota task (mahal untuk multi-step). |
| **Spreadsheet Manual / Apps Script** | UMKM pengguna Sheets | Gratis (kuota Apps Script) | Notifikasi sederhana formula/skrip | Berhenti di notifikasi; tidak ada PDF PO standar, persetujuan terstruktur, dan log error. |
| **Majoo (POS Lokal)** | Ritel, FnB, Jasa | Starter Rp249rb, Advance Rp499rb, Prime Rp999rb/outlet/bln | Notifikasi stok minimum, PO & Invoice (Advance+) | Fitur cetak PDF A4 masih coming soon; belum ada draf PO otomatis per pemasok & persetujuan via email. |
| **Moka POS** | Restoran, Ritel | Basic Rp299rb, Pro Rp499rb, Enterprise Rp799rb/outlet/bln | Stok real-time, Stock Alert, PO (Enterprise) | Membutuhkan migrasi POS; belum ada bukti pengiriman PO otomatis ke email pemasok. |
| **Olsera** | UMKM FMCG & FnB | Basic Rp1,288jt, Premium Rp1,988jt, Pro Rp2,688jt/thn | Peringatan sisa stok, Pembelian (Premium+) | Alur PDF PO per pemasok dan persetujuan masih dalam riset. |

---

## 7. Dampak Bisnis & Metrik Keberhasilan

### Dampak Bisnis Utama
1. Mencegah penjualan hilang dan penurunan retensi pelanggan akibat *stockout*.
2. Memangkas biaya pengiriman pesanan mendesak.
3. Menghemat waktu admin untuk pengecekan stok manual dan pengetikan ulang PO.
4. Menghilangkan kesalahan pengetikan (*human error*) SKU dan kuantitas.

### Metrik Keberhasilan (Uji Simulasi)
- **Akurasi Deteksi**: Target 100% pada dataset uji 20 SKU.
- **Waktu Penyiapan PO**: Pengurangan waktu penyiapan PO per pemasok sebesar >= 50% dibanding manual.
- **Pass Rate Test Case**: Target >= 90% dari total test case fungsional.
- **PO Ganda**: 0 PO ganda untuk SKU yang sama dalam satu siklus.

---

## 8. Arsitektur Teknis & Biaya

- **Frontend**: React (Vite) + Tailwind CSS, di-deploy ke **Vercel**.
- **Backend**: Go (Gin Framework), di-deploy ke **Railway**.
- **Database & Storage**: PostgreSQL Supabase & Supabase Storage Bucket (`po-documents`).
- **Cache & Locking**: Redis (Upstash / Redis Cloud) untuk *distributed lock* (`lock:scan:active`, TTL 300s).
- **Email Dispatcher**: SMTP Provider dengan *exponential backoff retry* (3x).
- **Data Uji**: Dataset sintetis 20 SKU dan 3–4 pemasok (SIMULASI).

---

## 9. Kelayakan & Roadmap MVP (2 Minggu Build)

**Periode Build**: 26 Oktober – 6 November 2026

- **Minggu 1 (26–30 Okt 2026)**:
  - Struktur tabel Supabase & data model.
  - Job terjadwal backend Go (Gin), deteksi & validasi ROP.
  - Pembuat PDF PO (`gofpdf`) & Supabase Storage Uploader.
  - *Checkpoint 30 Okt*: Jalur kritis berjalan dengan data uji.
- **Minggu 2 (2–6 Nov 2026)**:
  - Alur persetujuan email manager (token 32-char & handler idempotensi).
  - Penanganan error, retry logic, & structured logging.
  - *4–5 Nov*: UAT sintetis, dokumentasi, landing page.
  - *Jumat 6 Nov*: Demo langsung dengan 20 SKU sintetis.

---

## 10. Status Keputusan & Blocker

- **Sudah Terdukung**: Bukti masalah *stockout* dan pencatatan manual UMKM, perbandingan harga kompetitor resmi, batas kuota infrastruktur.
- **Scope MVP**: Terkunci pada 1 alur utama (*Supabase -> Deteksi ROP -> Draf PO PDF -> Email Manager -> Approve -> Kirim Email Pemasok -> Log Status*).
- **Integritas Riset**: Data 20 SKU dan pengukuran waktu bertanda **SIMULASI** untuk validasi internal.
