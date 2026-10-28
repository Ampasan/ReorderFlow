# Product Requirement Document (PRD): ReorderFlow

### 1. Masalah
Staf inventori dan pengadaan UMKM saat ini memantau persediaan stok secara manual menggunakan lembar kerja (*spreadsheet*). Akibatnya, produk yang telah berada di bawah batas aman (*Reorder Point / ROP*) sering kali terlambat disadari, pembuatan *Purchase Order* (PO) harus diketik ulang satu per satu secara manual, dan kondisi kehabisan stok (*stockout*) baru diketahui ketika pelanggan mencoba membeli. Hambatan operasional ini mengakibatkan potensi penjualan hilang (*lost sales*), timbulnya biaya tambahan untuk pengiriman kilat mendesak, serta pemborosan waktu administratif harian.

### 2. Pengguna
Target pengguna sistem **ReorderFlow** terdiri dari dua peran utama pada UMKM ritel, distributor kecil, dan manufaktur berskala kecil (asumsi profil: 10–50 karyawan dan 50–500 SKU):
* **Staf Inventori / Admin Pengadaan:** Bertanggung jawab memantau ketersediaan stok serta menyiapkan pesanan barang ke pemasok dengan cepat tanpa risiko salah ketik SKU atau kuantitas.
* **Pemilik Usaha / Operations Manager:** Bertanggung jawab meninjau, mengontrol pengeluaran, dan memberikan persetujuan resmi dokumen PO sebelum dikirim ke pemasok.

### 3. Tujuan
Keberhasilan produk **ReorderFlow** pada tahap MVP diukur melalui indikator berikut:
* **Akurasi Deteksi:** Mencapai akurasi **100%** dalam mengidentifikasi SKU yang berada di bawah ROP pada dataset pengujian.
* **Efisiensi Waktu:** Pengurangan waktu penyiapan dokumen PO per pemasok minimal sebesar **≥50%** dibandingkan proses manual.
* **Keandalan & Beban Kerja:** *Pass rate test case* mencapai **≥90%** tanpa adanya *bug* kritis, serta menghasilkan **0 PO ganda** untuk SKU yang sama dalam satu siklus.

### 4. Lingkup
* **Yang Dibuat (In-Scope):**
  1. Deteksi otomatis persediaan barang yang mencapai kondisi `stok_saat_ini ≤ reorder_point`.
  2. Pembuatan draf dokumen PO berbentuk PDF secara otomatis terkelompok per pemasok.
  3. Alur persetujuan manajer via email (*Human-in-the-Loop*) sebelum dokumen PO dikirimkan ke email pemasok.
  4. Antarmuka monitoring status inventori dan pencatatan riwayat status PO.
  5. Autentikasi login staf admin dan operations manager dengan email/password serta token JWT untuk melindungi dashboard dan endpoint data.
* **Yang Tidak Dibuat (Out-of-Scope):**
  1. Prediksi stok atau estimasi persediaan berbasis kecerdasan buatan (*AI / Machine Learning*).
  2. Integrasi langsung ke API marketplace, e-commerce, atau aplikasi POS pihak ketiga.
  3. Sistem manajemen pembayaran *invoice* dan pengelolaan gudang multi-cabang kompleks.

### 5. Batasan
* **Pendekatan Sistem:** Wajib menggunakan automasi berbasis aturan (*rule-based*) tanpa AI guna menjamin kepastian logika dan menghindari risiko halusinasi data.
* **Arsitektur Teknis:** Backend wajib menggunakan Go (Gin) yang di-deploy ke Railway; Frontend menggunakan React (Vite) yang di-deploy ke Vercel; basis data PostgreSQL dan penyimpanan PDF menggunakan Supabase; serta Redis untuk *cache* dan *retry logic*.
* **Keamanan Persetujuan:** Tautan persetujuan manajer wajib menggunakan token acak sekali pakai (*idempotent*) dengan masa berlaku terbatas.
* **Autentikasi Dashboard:** Endpoint data dan dashboard wajib dilindungi login email/password dengan token JWT. Endpoint persetujuan via email tetap publik dan hanya dilindungi token sekali pakai.
* **Penanganan Data Abnormal:** Data stok yang bernilai negatif, kosong, atau ROP yang tidak terisi wajib dialihkan ke status `REQUIRES_MANUAL_REVIEW` dan tidak diproses otomatis.
* **Dataset:** Pengembangan dan pengujian dilakukan menggunakan dataset sintetis 20 SKU dan kredensial aman di *environment variables*.

### 6. Skala
* **Skala Pengujian:** Sistem dikembangkan dan diuji menggunakan dataset sintetis 20 SKU dan 3–4 pemasok uji dalam durasi pengembangan MVP 2 minggu (26 Oktober – 6 November 2026).
* **Tingkat Kepentingan:** Sangat krusial bagi kelangsungan operasional UMKM untuk mencegah keterlambatan pengadaan barang yang berdampak langsung pada penurunan pendapatan dan hilangnya kepercayaan pelanggan.

### 7. Daftar Fitur
1. **[Prioritas 1] Deteksi Low-Stock Otomatis:** Pemindaian jadwal harian pada database untuk mendeteksi `stok ≤ ROP` dan mengabaikan SKU yang sudah memiliki PO aktif.
2. **[Prioritas 2] Generator Draf PO PDF Per Pemasok:** Mengelompokkan barang *low-stock* per pemasok, menerbitkan nomor PO unik, dan memicu penuangan dokumen ke file PDF di Supabase Storage.
3. **[Prioritas 3] Persetujuan & Pengiriman Otomatis:** Pengiriman email draf ke manajer berisi tautan *Approve/Reject*, serta penerusan PDF PO ke email pemasok secara otomatis setelah disetujui.
4. **[Prioritas 4] Monitoring Status Inventori & Log PO:** Dashboard antarmuka untuk memantau ringkasan kondisi stok dan riwayat status pengiriman PO.
5. **[Prioritas 5] Autentikasi & Kontrol Akses:** Login email/password untuk admin dan manager, proteksi endpoint data dengan JWT, serta pembatasan aksi pemindaian stok hanya untuk role admin.

### 8. Keputusan Terbuka
* **Validasi Dampak Lapangan:** Pengukuran tingkat penghematan waktu dan penurunan biaya operasional secara riil pada operasional UMKM nyata (saat ini masih berupa data simulasi).
* **Konfirmasi Fitur Kompetitor:** Verifikasi teknis mengenai ketersediaan fitur pembuatan PDF PO per pemasok dan pengiriman email otomatis pada aplikasi POS/inventori lokal di pasar.
* **Layanan Email Produksi:** Penentuan penyedia layanan SMTP definitif dan konfigurasi kuota pengiriman email untuk penggunaan jangka panjang di luar fase MVP.
