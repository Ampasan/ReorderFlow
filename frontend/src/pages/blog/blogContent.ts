export type ArticleBlock =
  | { kind: 'p'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'table'; headers: string[]; rows: string[][] }
  | { kind: 'formula'; text: string }
  | { kind: 'note'; text: string }
  | { kind: 'cta'; text: string; action: { label: string; to: string } }

export interface Article {
  slug: string
  title: string
  metaDescription: string
  imageUrl: string
  imageAlt: string
  blocks: ArticleBlock[]
}

export const ARTICLES: Article[] = [
  {
    slug: 'pengelolaan-stok-umkm',
    title: 'Pengelolaan Stok UMKM: Cara Mencegah Barang Habis Tanpa Disadari',
    metaDescription:
      'Pelajari cara mengelola stok UMKM, mengenali tanda stok menipis, dan menentukan reorder point agar barang penting tidak terlambat dipesan.',
    imageUrl: 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1793708173/cfowuzj6zxhttdmafhny.png',
    imageAlt: 'Ilustrasi pengelolaan stok UMKM',
    blocks: [
      {
        kind: 'p',
        text: 'Pelanggan datang untuk membeli barang yang biasanya tersedia. Namun, saat dicek, stok ternyata sudah habis. Catatan masih menunjukkan barang tersedia karena belum diperbarui.',
      },
      {
        kind: 'p',
        text: 'Kejadian seperti ini bisa terjadi ketika pengecekan stok masih mengandalkan ingatan atau dilakukan satu per satu. Ada beberapa langkah sederhana yang bisa membantu UMKM mengelola persediaan dengan lebih teratur.',
      },
      { kind: 'h2', text: 'Mengapa stok sering terlambat diketahui?' },
      {
        kind: 'p',
        text: 'Mencatat barang di buku atau spreadsheet sebenarnya tidak masalah. Tantangannya muncul ketika data jarang diperiksa atau tidak langsung diperbarui. Saat toko sedang ramai, pengecekan stok juga mudah tertunda.',
      },
      {
        kind: 'ul',
        items: [
          'Stok hanya diperiksa pada waktu tertentu, sehingga perubahan di antara jadwal pengecekan bisa terlewat.',
          'Staf harus mengecek banyak barang satu per satu.',
          'Keputusan untuk memesan ulang bergantung pada ingatan dan kebiasaan.',
        ],
      },
      { kind: 'h2', text: 'Tiga masalah yang bisa muncul' },
      {
        kind: 'ol',
        items: [
          '**Barang habis sebelum sempat dipesan** Jika stok baru diperiksa setelah barang kosong, bisnis masih harus menunggu pemasok mengirimkan barang. Selama itu, pelanggan bisa memilih membeli di tempat lain.',
          '**Salah mencatat barang atau jumlah** Kesalahan memasukkan kode barang (SKU) atau jumlah pesanan bisa terjadi, terutama jika data harus diketik ulang ke dokumen Purchase Order (PO).',
          '**Pekerjaan administrasi menumpuk** Staf perlu membagi waktu untuk memeriksa stok, mencari data pemasok, dan menyiapkan PO. Pekerjaan tersebut bisa menyita waktu yang seharusnya digunakan untuk tugas operasional lain.',
        ],
      },
      { kind: 'h2', text: 'Kenali reorder point sebelum stok habis' },
      {
        kind: 'p',
        text: 'Reorder point (ROP) adalah batas stok minimum yang menjadi tanda bahwa barang perlu dipesan ulang. Ketika jumlah stok sudah sama dengan atau lebih rendah dari batas tersebut, bisnis perlu menyiapkan pemesanan.',
      },
      { kind: 'p', text: 'Salah satu cara sederhana menghitungnya adalah:' },
      { kind: 'formula', text: 'ROP = (Penjualan rata-rata per hari × Lama pengiriman) + Stok pengaman' },
      {
        kind: 'note',
        text: 'Contoh: sebuah toko menjual rata-rata 3 unit beras per hari. Pemasok membutuhkan waktu 3 hari untuk mengirim, dan toko menyiapkan stok pengaman 3 unit. Maka ROP-nya adalah (3 × 3) + 3 = 12 unit. Artinya, pemesanan perlu disiapkan ketika stok mencapai 12 unit.',
      },
      { kind: 'h2', text: 'Mulai dari langkah sederhana' },
      {
        kind: 'ul',
        items: [
          'Pilih 10–20 barang yang paling sering terjual.',
          'Tentukan batas minimum untuk setiap barang berdasarkan penjualan dan waktu pengiriman.',
          'Gunakan satu sumber pencatatan stok agar data tidak tersebar.',
          'Tentukan siapa yang bertanggung jawab memperbarui dan memeriksa stok.',
          'Gunakan format PO yang konsisten agar data barang dan pemasok tidak selalu diketik ulang.',
        ],
      },
      { kind: 'h2', text: 'Jika pengecekan dan PO mulai menyita waktu' },
      {
        kind: 'p',
        text: 'Ketika jumlah barang bertambah, memeriksa stok satu per satu bisa semakin merepotkan. ReorderFlow dirancang untuk membantu memantau stok berdasarkan batas minimum yang ditentukan, menyiapkan draf PO, lalu meminta persetujuan manajer sebelum pesanan dikirim ke pemasok.',
      },
      {
        kind: 'p',
        text: 'Pengelolaan stok yang lebih teratur dimulai dari data yang rapi dan batas minimum yang jelas. Setelah itu, bisnis bisa mempertimbangkan otomasi untuk membantu pekerjaan pemesanan yang berulang.',
      },
      {
        kind: 'cta',
        text: 'Kenali cara kerja ReorderFlow untuk membantu proses pemesanan ulang.',
        action: { label: 'Lihat Cara Kerja', to: '/#proses' },
      },
    ],
  },
  {
    slug: 'otomasi-pemesanan-ulang-stok',
    title: 'Otomasi Pemesanan Ulang Stok: Dari Stok Menipis hingga PO Terkirim',
    metaDescription:
      'Pahami cara kerja otomasi pemesanan ulang stok, mulai dari reorder point, pembuatan draf PO, persetujuan manajer, hingga pengiriman ke pemasok.',
    imageUrl: 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1793708172/e8lyo23encdotzbqbwde.png',
    imageAlt: 'Ilustrasi otomasi pemesanan ulang stok',
    blocks: [
      {
        kind: 'p',
        text: 'Saat stok mulai menipis, staf biasanya perlu mengecek data barang, mencari pemasok, membuat PO, lalu meminta persetujuan manajer. Proses ini bisa memakan waktu karena beberapa langkah dilakukan secara terpisah.',
      },
      {
        kind: 'p',
        text: 'Otomasi pemesanan ulang membantu menangani pekerjaan berulang tersebut. Namun, keputusan pembelian tetap bisa berada di tangan manajer.',
      },
      { kind: 'h2', text: 'Bagaimana alur pemesanan ulang bisa dibuat lebih teratur?' },
      {
        kind: 'table',
        headers: ['Tahap', 'Cara manual', 'Dengan otomasi'],
        rows: [
          ['**Pencatatan**', 'Barang masuk dan keluar dicatat di spreadsheet atau rekap manual.', 'Data stok disimpan dalam satu sumber pencatatan.'],
          ['**Pengecekan**', 'Staf memeriksa stok satu per satu.', 'Stok dibandingkan dengan batas minimum.'],
          ['**Pembuatan PO**', 'SKU dan jumlah barang diketik ulang.', 'Draf PO disiapkan dari data stok dan pemasok.'],
          ['**Persetujuan**', 'PO dikirim melalui chat atau email.', 'Persetujuan dilakukan melalui alur yang tercatat.'],
          ['**Pengiriman**', 'Staf meneruskan PO ke pemasok.', 'PO dikirim setelah disetujui.'],
        ],
      },
      { kind: 'h2', text: 'Peran reorder point dalam proses ini' },
      {
        kind: 'p',
        text: 'Reorder point (ROP) adalah batas minimum stok yang menjadi pemicu pemesanan ulang. Jika stok sama dengan atau di bawah ROP, barang masuk ke daftar yang perlu dipesan.',
      },
      {
        kind: 'p',
        text: 'ROP tetap perlu ditentukan oleh bisnis berdasarkan kebutuhan dan waktu pengiriman pemasok. ReorderFlow tidak memprediksi permintaan atau menentukan ROP secara otomatis; sistem mengikuti batas yang sudah dimasukkan pengguna.',
      },
      { kind: 'h2', text: 'Bagian mana yang dikerjakan sistem?' },
      {
        kind: 'ul',
        items: [
          'Staf mengisi dan memperbarui data stok, pemasok, serta reorder point.',
          'Sistem memeriksa stok terhadap batas minimum setiap hari.',
          'Sistem menyiapkan draf PO PDF dan mengelompokkan barang berdasarkan pemasok.',
          'Manajer memeriksa draf lalu memilih setuju atau tolak melalui email.',
          'Jika disetujui, PO dikirim ke pemasok dan statusnya dicatat.',
        ],
      },
      { kind: 'h2', text: 'Mengenal ReorderFlow' },
      {
        kind: 'p',
        text: 'ReorderFlow membantu UMKM retail dan distributor kecil mengelola proses pemesanan ulang. Fokusnya bukan menggantikan keputusan pembelian, melainkan membantu pekerjaan administratif yang berulang.',
      },
      {
        kind: 'ul',
        items: [
          'Pemantauan stok berdasarkan batas minimum.',
          'Pembuatan draf PO PDF per pemasok.',
          'Persetujuan atau penolakan PO oleh manajer melalui email.',
          'Pengiriman PO ke pemasok setelah disetujui.',
          'Pencatatan status dan riwayat PO.',
        ],
      },
      { kind: 'h2', text: 'Apakah otomasi berarti manajer kehilangan kendali?' },
      {
        kind: 'p',
        text: 'Tidak. Manajer tetap memeriksa isi PO dan menentukan apakah pesanan disetujui atau ditolak. Sistem baru mengirimkan PO ke pemasok setelah persetujuan diberikan. Dengan begitu, pekerjaan persiapan bisa dibantu sistem tanpa menghilangkan keputusan manusia.',
      },
      {
        kind: 'p',
        text: 'Jika Anda ingin melihat alurnya secara langsung, pelajari demo ReorderFlow dan perhatikan bagaimana stok yang mencapai batas minimum diproses menjadi draf PO.',
      },
      {
        kind: 'cta',
        text: 'Lihat demo produk dan pelajari cara kerja ReorderFlow.',
        action: { label: 'Lihat Cara Kerja', to: '/#proses' },
      },
    ],
  },
  {
    slug: 'coba-gratis-reorderflow',
    title: 'Coba ReorderFlow Gratis 30 Hari untuk Mengelola Pemesanan Ulang',
    metaDescription:
      'Coba ReorderFlow gratis 30 hari untuk memantau stok, menyiapkan draf PO, dan mengirim pesanan setelah disetujui. Paket Standard mulai Rp149.000/bulan.',
    imageUrl: 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1793708173/zevmrb7fhlgbgujbif0j.png',
    imageAlt: 'Ilustrasi uji coba gratis ReorderFlow',
    blocks: [
      {
        kind: 'p',
        text: 'Apakah staf masih harus mengecek stok satu per satu dan mengetik PO setiap kali barang perlu dipesan? Jika proses ini mulai menyita waktu, Anda bisa mencoba alur pemesanan yang lebih teratur.',
      },
      {
        kind: 'p',
        text: 'ReorderFlow membantu memantau stok berdasarkan batas minimum, menyiapkan draf PO, dan mengirimkannya ke pemasok setelah disetujui manajer. Anda bisa mencoba alurnya melalui Free Trial selama 30 hari.',
      },
      { kind: 'h2', text: 'Kapan bisnis perlu mempertimbangkan otomasi?' },
      {
        kind: 'ul',
        items: [
          'Stok sering terlambat diketahui sudah menipis.',
          'PO untuk pemasok yang sama harus dibuat berulang kali.',
          'Kesalahan SKU atau jumlah barang masih terjadi.',
          'Persetujuan pembelian tersebar di chat dan sulit ditelusuri.',
          'Staf menghabiskan banyak waktu untuk pekerjaan administrasi stok.',
        ],
      },
      { kind: 'h2', text: 'Apa yang bisa dibantu ReorderFlow?' },
      {
        kind: 'table',
        headers: ['Kendala', 'Bantuan ReorderFlow'],
        rows: [
          ['**Stok menipis terlambat diketahui**', 'Memeriksa stok terhadap batas minimum setiap hari.'],
          ['**PO perlu diketik ulang**', 'Menyiapkan draf PO PDF berdasarkan data stok dan pemasok.'],
          ['**Persetujuan sulit ditelusuri**', 'Manajer menyetujui atau menolak melalui tautan email.'],
          ['**PO belum dikirim ke pemasok**', 'PO dikirim setelah mendapat persetujuan.'],
          ['**Riwayat pesanan tersebar**', 'Status dan riwayat PO tercatat.'],
        ],
      },
      { kind: 'h2', text: 'Contoh penggunaan dalam kegiatan toko' },
      {
        kind: 'p',
        text: 'Misalnya, stok beras di toko tersisa 8 unit, sementara batas minimum yang ditetapkan adalah 10. Minyak goreng tersisa 6 unit dengan batas minimum 12. Karena kedua barang sudah mencapai batasnya, ReorderFlow menyiapkan draf PO berdasarkan data barang dan pemasok.',
      },
      {
        kind: 'p',
        text: 'Pemilik toko menerima email berisi ringkasan dan dokumen PO. Setelah memeriksa barang serta jumlahnya, pemilik dapat menyetujui atau menolak. Jika disetujui, PO dikirim ke pemasok dan status pesanan tercatat.',
      },
      { kind: 'h2', text: 'Apa yang didapat selama Free Trial?' },
      { kind: 'p', text: 'Selama 30 hari, Anda dapat mencoba fitur utama ReorderFlow:' },
      {
        kind: 'ul',
        items: [
          'Memantau stok berdasarkan batas minimum.',
          'Menyiapkan draf PO PDF per pemasok.',
          'Meminta persetujuan manajer dan mengirim PO setelah disetujui.',
          'Melihat status serta riwayat pemesanan.',
        ],
      },
      { kind: 'note', text: 'Batas penggunaan trial: maksimal 500 SKU, 10 pemasok, dan 15 pesanan selama 30 hari.' },
      { kind: 'h2', text: 'Pilihan paket setelah masa trial' },
      {
        kind: 'table',
        headers: ['Paket', 'Harga', 'Keterangan'],
        rows: [
          ['**Free Trial**', 'Gratis 30 hari', 'Maks. 500 SKU, 10 pemasok, 15 pesanan.'],
          ['**Standard Bulanan**', 'Rp149.000/bulan', 'Semua fitur; tanpa batasan jumlah produk, pemasok, dan pesanan untuk penggunaan wajar.'],
          ['**Standard Tahunan**', 'Rp1.490.000/tahun', 'Hemat Rp298.000 dibanding pembayaran bulanan selama 12 bulan.'],
        ],
      },
      { kind: 'h2', text: 'Mulai dengan beberapa langkah' },
      {
        kind: 'ol',
        items: [
          'Daftar Free Trial selama 30 hari.',
          'Masukkan data stok dan pemasok sesuai format.',
          'Tentukan reorder point untuk barang yang ingin dipantau.',
          'Periksa dan selesaikan PO pertama bersama manajer.',
          'Evaluasi apakah alur ini sesuai dengan kebutuhan bisnis Anda.',
        ],
      },
      {
        kind: 'p',
        text: 'Anda tidak perlu langsung memutuskan untuk berlangganan. Gunakan masa trial untuk mencoba alurnya dengan data yang relevan, lalu tentukan apakah ReorderFlow cocok untuk operasional bisnis.',
      },
      {
        kind: 'cta',
        text: 'Coba gratis 30 hari.',
        action: { label: 'Mulai Gratis 30 Hari', to: '/#harga' },
      },
    ],
  },
  {
    slug: 'cara-menggunakan-reorderflow-po-pertama',
    title: 'Panduan ReorderFlow: Siapkan Data dan Buat PO Pertama',
    metaDescription:
      'Ikuti panduan ReorderFlow untuk menyiapkan data stok, menentukan reorder point, memeriksa draf PO, dan menyelesaikan pesanan pertama selama trial.',
    imageUrl: 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1793708173/zchl0t9vzmpakxkkkoe9.png',
    imageAlt: 'Ilustrasi panduan penggunaan ReorderFlow',
    blocks: [
      {
        kind: 'p',
        text: 'Sudah mendaftar Free Trial ReorderFlow? Mulailah dengan satu target sederhana: menyiapkan dan menyelesaikan PO pertama. Setelah mencoba satu siklus pemesanan, Anda akan lebih mudah menilai apakah alurnya sesuai dengan kebutuhan bisnis.',
      },
      { kind: 'h2', text: '1. Siapkan data sebelum mulai' },
      {
        kind: 'p',
        text: 'Pastikan informasi barang dan pemasok sudah tersedia. Data yang perlu disiapkan antara lain:',
      },
      {
        kind: 'ul',
        items: [
          'SKU atau kode unik setiap barang dan nama barang.',
          'Jumlah stok saat ini yang sudah diperbarui.',
          'Reorder point dan jumlah minimum pemesanan.',
          'Nama pemasok serta alamat email yang masih aktif.',
          'Alamat email manajer yang akan menyetujui PO.',
        ],
      },
      {
        kind: 'p',
        text: 'Untuk percobaan awal, mulai dari 10–20 barang yang paling sering terjual. Setelah alurnya dipahami, Anda bisa menambahkan barang lain. Batas trial adalah 500 SKU dan 10 pemasok.',
      },
      { kind: 'h2', text: '2. Tentukan reorder point' },
      {
        kind: 'p',
        text: 'Reorder point (ROP) adalah batas stok yang menjadi tanda untuk menyiapkan pemesanan ulang. ReorderFlow menggunakan angka yang Anda masukkan, bukan menghitung atau memprediksi kebutuhan stok secara otomatis.',
      },
      { kind: 'formula', text: 'ROP = (Penjualan rata-rata per hari × Lama pengiriman) + Stok pengaman' },
      {
        kind: 'note',
        text: 'Contoh: barang terjual 4 unit per hari, waktu pengiriman 2 hari, dan stok pengaman 4 unit. ROP = (4 × 2) + 4 = 12 unit.',
      },
      {
        kind: 'p',
        text: 'Jika ROP terlalu rendah, pemesanan bisa terlambat. Jika terlalu tinggi, sistem bisa lebih sering menyiapkan PO. Tinjau kembali angka ini ketika pola penjualan atau waktu pengiriman berubah.',
      },
      { kind: 'h2', text: '3. Periksa draf PO yang dibuat' },
      {
        kind: 'p',
        text: 'ReorderFlow memeriksa stok secara terjadwal setiap hari. Barang dengan stok sama dengan atau di bawah ROP akan dikelompokkan berdasarkan pemasok dan disiapkan menjadi dokumen PO PDF. Barang yang masih memiliki PO aktif tidak dibuatkan PO baru.',
      },
      { kind: 'p', text: 'Sebelum meminta persetujuan, periksa tiga hal berikut:' },
      {
        kind: 'ul',
        items: [
          'Nama pemasok sudah benar.',
          'SKU dan jumlah barang sesuai kebutuhan.',
          'Barang yang tercantum memang perlu dipesan.',
        ],
      },
      { kind: 'h2', text: '4. Pahami persetujuan dan status PO' },
      {
        kind: 'p',
        text: 'Manajer menerima email berisi ringkasan PO, lampiran PDF, serta pilihan Setujui atau Tolak. PO hanya dikirim ke pemasok setelah disetujui.',
      },
      {
        kind: 'table',
        headers: ['Status', 'Artinya'],
        rows: [
          ['**Draft**', 'PO sudah disiapkan dan menunggu keputusan manajer. Belum dikirim.'],
          ['**Terkirim**', 'PO telah disetujui dan dikirim ke email pemasok.'],
          ['**Ditolak**', 'Manajer menolak PO sehingga pesanan tidak dikirim.'],
          ['**Perlu diperiksa manual**', 'Ada data yang belum valid dan perlu diperbaiki.'],
        ],
      },
      { kind: 'h2', text: 'Jika data perlu diperiksa' },
      { kind: 'p', text: 'Beberapa hal yang perlu dicek ketika data tidak dapat diproses:' },
      {
        kind: 'ul',
        items: [
          'Stok tercatat negatif.',
          'Reorder point atau jumlah minimum pemesanan kosong atau nol.',
          'Email pemasok belum diisi atau formatnya tidak valid.',
        ],
      },
      { kind: 'p', text: 'Perbaiki data tersebut, lalu biarkan pemeriksaan terjadwal berikutnya memprosesnya kembali.' },
      { kind: 'h2', text: '5. Bangun kebiasaan penggunaan' },
      {
        kind: 'ul',
        items: [
          'Perbarui data stok secara rutin agar hasil pemantauan tetap sesuai kondisi barang.',
          'Minta manajer memeriksa email persetujuan pada waktu yang disepakati.',
          'Tinjau riwayat PO setidaknya seminggu sekali.',
          'Catat waktu yang dibutuhkan untuk menyiapkan PO sebagai bahan evaluasi trial.',
        ],
      },
      { kind: 'h2', text: 'Atur waktu trial agar PO pertama tidak terlewat' },
      {
        kind: 'table',
        headers: ['Periode', 'Fokus'],
        rows: [
          ['**Hari 1–3**', 'Siapkan dan masukkan data barang serta pemasok.'],
          ['**Hari 4–7**', 'Tentukan ROP dan coba selesaikan PO pertama.'],
          ['**Minggu 2–3**', 'Gunakan alur pemesanan sebagai rutinitas.'],
          ['**Minggu 4**', 'Evaluasi penggunaan dan putuskan apakah ingin melanjutkan.'],
        ],
      },
      {
        kind: 'p',
        text: 'Free Trial berlangsung 30 hari dengan batas maksimal 15 pesanan. Jika alurnya sesuai kebutuhan, Anda dapat melanjutkan ke Standard seharga Rp149.000 per bulan atau Rp1.490.000 per tahun.',
      },
      {
        kind: 'p',
        text: 'Mulailah dari data yang rapi, tentukan ROP yang sesuai, lalu selesaikan satu PO sampai terkirim. Dari pengalaman pertama itu, Anda bisa menilai manfaat ReorderFlow untuk kegiatan pemesanan berikutnya.',
      },
      {
        kind: 'cta',
        text: 'Selesaikan PO Pertama Anda.',
        action: { label: 'Masuk ke ReorderFlow', to: '/login' },
      },
    ],
  },
]

export interface FaqItem {
  question: string
  answer: string
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Apa itu ReorderFlow?',
    answer:
      'ReorderFlow adalah solusi otomasi pemesanan ulang yang membantu UMKM memantau stok dan mengelola proses pembuatan PO.',
  },
  {
    question: 'Siapa yang cocok menggunakan ReorderFlow?',
    answer:
      'UMKM retail dan distributor kecil yang ingin mengelola stok serta pemesanan barang dengan lebih praktis.',
  },
  {
    question: 'Bagaimana cara kerja ReorderFlow?',
    answer:
      'ReorderFlow memantau stok berdasarkan batas minimum, menyiapkan draf PO, lalu mengirimkannya setelah disetujui manajer.',
  },
  {
    question: 'Apakah PO langsung dikirim ke pemasok secara otomatis?',
    answer: 'Tidak. PO hanya dikirim setelah manajer operasional memberikan persetujuan.',
  },
  {
    question: 'Apakah ReorderFlow dapat menentukan batas minimum stok secara otomatis?',
    answer: 'Tidak. Pengguna menentukan reorder point sesuai kebutuhan masing-masing barang.',
  },
  {
    question: 'Apakah tersedia masa percobaan gratis?',
    answer:
      'Ya. ReorderFlow menyediakan Free Trial selama 30 hari dengan batas maksimal 500 SKU, 10 pemasok, dan 15 pesanan.',
  },
  {
    question: 'Berapa biaya berlangganan ReorderFlow setelah masa trial?',
    answer: 'Paket Standard tersedia mulai Rp149.000 per bulan atau Rp1.490.000 per tahun.',
  },
]
