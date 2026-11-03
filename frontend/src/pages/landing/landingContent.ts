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
  businessType: string
  desc: string
  industryDesc: string
  imageUrl: string
  industryImageUrl: string
}

export const INDUSTRIES: IndustryItem[] = [
  {
    slug: 'retail',
    name: 'Toko Ritel',
    businessType: 'Minimarket',
    desc: 'Kelola stok produk kebutuhan sehari-hari dengan pemantauan otomatis agar rak toko selalu terisi.',
    industryDesc: 'Pantau barang kebutuhan harian dan siapkan draf PO saat stok mencapai batas minimum.',
    imageUrl: 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1793720633/d42jqq63umt5dhxgev9y.png',
    industryImageUrl: 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1793683703/f19djre8e5uw6ojvm3ad.png',
  },
  {
    slug: 'fnb',
    name: 'Food & Beverages',
    businessType: 'Restoran',
    desc: 'Pantau bahan baku kafe dan restoran sebelum kehabisan sehingga dapur beroperasi tanpa gangguan.',
    industryDesc: 'Kelola persediaan bahan baku dan tinjau kebutuhan pesanan sebelum PO dikirim ke pemasok.',
    imageUrl: 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1793720631/yuorhvuj9oxuaqz5wr02.png',
    industryImageUrl: 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1793683701/mkngxcgamowkzrpoa5yp.png',
  },
  {
    slug: 'kesehatan-farmasi',
    name: 'Kesehatan & Farmasi',
    businessType: 'Klinik',
    desc: 'Jaga ketersediaan obat dan suplemen agar resep pelanggan bisa langsung terlayani.',
    industryDesc: 'Catat stok obat dan suplemen per SKU, lalu ajukan PO untuk persetujuan manajer.',
    imageUrl: 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1793720630/dkxcprin5whqp5fg1noo.png',
    industryImageUrl: 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1793696577/fsda2ogdnv7hk5jbvpbq.png',
  },
  {
    slug: 'distributor',
    name: 'Distributor',
    businessType: 'Distributor Bahan Pokok',
    desc: 'Atur pemesanan ulang stok gudang secara terpusat untuk memenuhi permintaan dari banyak pelanggan.',
    industryDesc: 'Kelompokkan kebutuhan stok gudang berdasarkan pemasok untuk menyiapkan draf PO.',
    imageUrl: 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1793683702/fspux9wekvc0duuwl460.png',
    industryImageUrl: 'https://res.cloudinary.com/drrmbeiyk/image/upload/v1793720633/seowrp9arodx3q28vp2t.png',
  },
]

export const NAV_LINKS = [
  { label: 'Fitur', href: '#fitur' },
  { label: 'Industri', href: '#industri' },
  { label: 'Cara Kerja', href: '#proses' },
  { label: 'Harga', href: '#harga' },
  { label: 'Kontak', href: '#kontak' },
]

export const FOOTER_SECTIONS = [
  { label: 'Fitur', to: '/#fitur' },
  { label: 'Industri', to: '/#industri' },
  { label: 'Cara Kerja', to: '/#proses' },
  { label: 'Harga', to: '/#harga' },
  { label: 'Kontak', to: '/#kontak' },
]

export const FOOTER_RESOURCES = [
  { label: 'Tentang', to: '/tentang' },
  { label: 'Artikel', to: '/artikel' },
  { label: 'FAQ', to: '/faq' },
]
