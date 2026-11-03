export const WA_LINK =
  'https://wa.me/6287723305893?text=Halo%2C%20saya%20ingin%20tahu%20lebih%20lanjut%20tentang%20ReorderFlow'

export const EMAIL_LINK =
  'https://mail.google.com/mail/?view=cm&fs=1&to=n.rakan.r.2005%40gmail.com'

export type FeatureIconKey = 'search' | 'pdf' | 'mail' | 'send' | 'list'
export type ValueIconKey = 'clock' | 'shield' | 'chart' | 'gear'

export interface FeatureItem {
  icon: FeatureIconKey
  title: string
  desc: string
}

export interface ValueItem {
  icon: ValueIconKey
  title: string
  desc: string
}

export interface StepItem {
  title: string
  desc: string
}

export const HERO_POINTS = [
  'Pantau stok mendekati batas minimum secara otomatis',
  'Buat draft PO langsung dari data stok dan pemasok',
  'Kirim PO ke pemasok setelah manajer menyetujui',
  'Lacak riwayat dan status setiap pesanan dalam satu tempat',
]

export const VALUE_PROPS: ValueItem[] = [
  {
    icon: 'clock',
    title: 'Hemat Waktu',
    desc: 'Kurangi pekerjaan pemesanan manual yang berulang setiap harinya.',
  },
  {
    icon: 'shield',
    title: 'Minim Kesalahan',
    desc: 'Kurangi risiko salah catat dan salah buat PO.',
  },
  {
    icon: 'chart',
    title: 'Stok Lebih Terjaga',
    desc: 'Cegah kehabisan maupun penumpukan stok berlebih.',
  },
  {
    icon: 'gear',
    title: 'Proses Terstruktur',
    desc: 'Persetujuan PO, pengiriman ke pemasok, dan riwayat pesanan dalam satu alur.',
  },
]

export const FEATURES: FeatureItem[] = [
  {
    icon: 'search',
    title: 'Pemantauan Stok',
    desc: 'Pantau stok berdasarkan batas minimum yang Anda tentukan.',
  },
  {
    icon: 'pdf',
    title: 'Pembuatan PO Otomatis',
    desc: 'Buat draft PO secara otomatis berdasarkan kebutuhan stok dan data pemasok.',
  },
  {
    icon: 'mail',
    title: 'Persetujuan via Email',
    desc: 'Manajer dapat menyetujui atau menolak PO langsung dari email.',
  },
  {
    icon: 'send',
    title: 'Pengiriman PO Otomatis',
    desc: 'PO dikirim ke pemasok secara otomatis setelah mendapat persetujuan.',
  },
  {
    icon: 'list',
    title: 'Pelacakan Status PO',
    desc: 'Catat dan pantau status serta riwayat setiap pemesanan dalam satu tampilan.',
  },
]

export const AS_IS_STEPS: StepItem[] = [
  {
    title: 'Pencatatan Stok Manual',
    desc: 'Barang masuk dan keluar dicatat di Excel atau rekap manual.',
  },
  {
    title: 'Pengecekan Stok Satu per Satu',
    desc: 'Memeriksa jumlah stok secara visual satu per satu.',
  },
  {
    title: 'Pembuatan PO Manual',
    desc: 'Input data pemasok dan mengisi SKU ke dalam PO.',
  },
  {
    title: 'Menunggu Persetujuan PO',
    desc: 'Mengirimkan PO ke manajer untuk diperiksa dan disetujui.',
  },
  {
    title: 'Pengiriman PO ke Pemasok',
    desc: 'Meneruskan PO yang telah disetujui kepada pemasok.',
  },
]

export const TO_BE_STEPS: StepItem[] = [
  {
    title: 'Pencatatan Stok Terorganisir',
    desc: 'Data barang tersimpan dalam satu sumber pencatatan.',
  },
  {
    title: 'Pemantauan Stok Lebih Teratur',
    desc: 'Kondisi stok dipantau berdasarkan batas minimum yang ditentukan.',
  },
  {
    title: 'Persiapan PO Lebih Praktis',
    desc: 'Dokumen disiapkan berdasarkan kebutuhan stok dan data pemasok.',
  },
  {
    title: 'Persetujuan Lebih Terstruktur',
    desc: 'Proses pemeriksaan dan persetujuan PO dalam satu alur.',
  },
  {
    title: 'Pengiriman Tepat Waktu',
    desc: 'PO diteruskan ke pemasok setelah mendapat persetujuan.',
  },
]

export const ABOUT_POINTS = [
  'Mempermudah pekerjaan operasional bisnis.',
  'Menghadirkan sistem teknologi otomasi yang sederhana, terjangkau, dan mudah digunakan.',
  'Mengurangi pekerjaan manual sehingga meminimalkan kesalahan.',
]

export const BASIC_FEATURES = [
  'Pantau ketersediaan stok',
  'Kirim PO ke pemasok setelah disetujui',
  'Status pesanan terpantau',
]

export const STANDARD_FEATURES = [
  'Pantau ketersediaan stok',
  'Buat draf pesanan pembelian (PO)',
  'Minta persetujuan PO ke user',
  'Kirim PO ke pemasok setelah disetujui',
  'Status pesanan terpantau',
]

export const BASIC_LIMITS = [
  { value: '500', label: 'produk (SKU)' },
  { value: '10', label: 'pemasok' },
  { value: '15', label: 'pesanan' },
]

export interface IndustryItem {
  slug: string
  name: string
  desc: string
  imageUrl: string
}

export const INDUSTRIES: IndustryItem[] = [
  {
    slug: 'retail',
    name: 'Toko Ritel',
    desc: 'Kelola stok produk kebutuhan sehari-hari dengan pemantauan otomatis agar rak toko selalu terisi.',
    imageUrl: 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1793683703/f19djre8e5uw6ojvm3ad.png',
  },
  {
    slug: 'fnb',
    name: 'Food & Beverages',
    desc: 'Pantau bahan baku kafe dan restoran sebelum kehabisan sehingga dapur beroperasi tanpa gangguan.',
    imageUrl: 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1793683701/mkngxcgamowkzrpoa5yp.png',
  },
  {
    slug: 'manufacturing',
    name: 'Manufaktur',
    desc: 'Pastikan bahan produksi selalu tersedia sesuai jadwal dan hindari penundaan lini produksi.',
    imageUrl: 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1793683701/tua0pfxgicm1liqkarkh.png',
  },
  {
    slug: 'apotek',
    name: 'Apotek',
    desc: 'Jaga ketersediaan obat dan suplemen agar resep pelanggan bisa langsung terlayani.',
    imageUrl: 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1793696577/fsda2ogdnv7hk5jbvpbq.png',
  },
  {
    slug: 'distributor',
    name: 'Distributor',
    desc: 'Atur pemesanan ulang stok gudang secara terpusat untuk memenuhi permintaan dari banyak pelanggan.',
    imageUrl: 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1793683702/fspux9wekvc0duuwl460.png',
  },
]

export const NAV_LINKS = [
  { label: 'Fitur', href: '#fitur' },
  { label: 'Cara Kerja', href: '#proses' },
  { label: 'Harga', href: '#harga' },
  { label: 'Kontak', href: '#kontak' },
]
