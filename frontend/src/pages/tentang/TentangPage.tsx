import { Link } from 'react-router-dom'
import { JsonLd } from '../../components/JsonLd'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import {
  breadcrumbSchema,
  graph,
  organizationSchema,
  webPageSchema,
  websiteSchema,
} from '../../utils/schema'
import { LandingFooter } from '../landing/LandingFooter'
import { MarketingNav } from '../landing/MarketingNav'
import { Reveal } from '../landing/Reveal'
import { IconCheck } from '../landing/landingIcons'
import { WA_LINK } from '../landing/landingContent'

interface Sector {
  name: string
  challenge: string
  solution: string
}

interface Principle {
  title: string
  desc: string
}

interface Commitment {
  title: string
  desc: string
}

const PRINCIPLES: Principle[] = [
  {
    title: 'Otomasi Berbasis Aturan Pasti (Rule-Based, Zero Hallucination)',
    desc: 'ReorderFlow tidak menggunakan algoritma spekulatif yang sulit dipahami. Sistem bekerja murni berdasarkan batas aman persediaan (Reorder Point / ROP) dan kuantitas pesanan minimum (Minimum Order Quantity) yang Anda tentukan sendiri. Saat stok menyentuh batas aman, sistem langsung bersiap.',
  },
  {
    title: 'Kendali 100% di Tangan Manajer',
    desc: 'Sistem tidak akan pernah mengirimkan pesanan ke pemasok secara sepihak. ReorderFlow bertugas memindai inventori, mengelompokkan barang berdasarkan vendor, dan menerbitkan draf PDF PO resmi. Keputusan akhir untuk menyetujui, mengoreksi, atau menolak pemesanan tetap berada di tangan manajer, hanya melalui satu klik tautan aman di email tanpa repot login.',
  },
  {
    title: 'Praktis dan Langsung Dapat Digunakan',
    desc: 'Tidak ada konfigurasi berbelit-belit. Antarmuka dashboard dirancang bersih dengan indikator warna yang tegas sehingga staf gudang maupun pemilik usaha dapat langsung memantau kondisi persediaan dalam hitungan detik.',
  },
]

const SECTORS: Sector[] = [
  {
    name: 'Retail & Toko Modern',
    challenge: 'Ratusan SKU barang dagangan cepat habis di rak saat akhir pekan.',
    solution: 'Deteksi batas stok harian otomatis agar barang terlaris selalu dipesan sebelum kosong.',
  },
  {
    name: 'Food & Beverage',
    challenge: 'Bahan baku habis pakai terikat masa simpan dan waktu kirim.',
    solution: 'Pengelompokan draf PO otomatis ke pemasok bahan baku harian tanpa salah hitung.',
  },
  {
    name: 'Distributor Kecil & Keagenan',
    challenge: 'Mengelola alur pasokan dari prinsipal ke puluhan toko mitra.',
    solution: 'Dokumen PO PDF rapi siap kirim dengan penomoran otomatis dan riwayat terlacak.',
  },
  {
    name: 'Kesehatan & Farmasi',
    challenge: 'Pasokan obat bebas dan alat kesehatan esensial tidak boleh terlambat dipesan.',
    solution: 'Pengecekan otomatis batas aman stok untuk menjaga ketersediaan kebutuhan medis.',
  },
]

const COMMITMENTS: Commitment[] = [
  {
    title: 'Uji Coba Gratis 30 Hari Penuh',
    desc: 'Nikmati akses lengkap untuk mengelola hingga 500 SKU, 10 pemasok, dan 15 draf pesanan pertama tanpa kewajiban kartu kredit.',
  },
  {
    title: 'Biaya Berlangganan Terjangkau',
    desc: 'Paket Standard tersedia mulai Rp149.000 per bulan (atau hemat dengan paket tahunan Rp1.490.000 per tahun).',
  },
  {
    title: 'Dukungan Penuh',
    desc: 'Pendampingan penataan data inventori awal agar proses pemesanan pertama Anda berjalan lancar.',
  },
]

const PRIMARY_CTA_CLASS =
  'inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-orange px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-orange-strong hover:shadow-lg hover:shadow-brand-orange/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark'

const SECONDARY_CTA_CLASS =
  'inline-flex min-h-11 items-center justify-center rounded-lg border border-brand-shell/40 px-6 py-3 text-sm font-semibold text-brand-shell transition-all hover:-translate-y-0.5 hover:border-brand-amber hover:text-brand-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark'

const ABOUT_DESCRIPTION =
  'Cerita, prinsip kerja, dan komitmen ReorderFlow untuk membantu UMKM mengelola persediaan dan pemesanan ulang.'

const ABOUT_JSON_LD = graph(
  organizationSchema(),
  websiteSchema(),
  webPageSchema('AboutPage', '/tentang', 'Tentang ReorderFlow | ReorderFlow', ABOUT_DESCRIPTION),
  breadcrumbSchema('/tentang', [
    { name: 'Beranda', path: '/' },
    { name: 'Tentang', path: '/tentang' },
  ]),
)

export function TentangPage() {
  useDocumentTitle('Tentang ReorderFlow | ReorderFlow')

  return (
    <div className="min-h-screen bg-brand-cream font-sans text-brand-dark">
      <JsonLd data={ABOUT_JSON_LD} />
      <MarketingNav />

      <main>
        <section className="relative overflow-hidden bg-brand-dark">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -top-24 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-brand-orange/20 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-brand-amber/10 blur-3xl" />
            <div className="paper-grain absolute inset-0 opacity-20" />
          </div>

          <div className="relative mx-auto max-w-3xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pb-24 sm:pt-24">
            <div className="landing-hero-copy">
              <h1 className="font-display text-[2.5rem] font-extrabold leading-[1.08] tracking-[-0.02em] text-white sm:text-5xl">
                Menjaga bisnis Anda tetap berjalan,
                <br />
                <span className="text-brand-amber">tanpa rasa cemas kehabisan stok.</span>
              </h1>
            </div>

            <div className="landing-hero-summary">
              <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-brand-shell/90 sm:text-lg">
                Waktu pemilik dan tim operasional UMKM terlalu berharga jika hanya dihabiskan untuk
                memelototi baris spreadsheet dan mengetik surat pesanan barang setiap malam.
                ReorderFlow hadir sebagai asisten pengadaan yang bekerja tenang di latar belakang,
                mendeteksi stok yang menipis, menyusun draf Purchase Order (PO) resmi, dan
                menyerahkan kendali persetujuan seutuhnya kepada Anda.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/#harga" className={PRIMARY_CTA_CLASS}>
                  Mulai Coba Gratis 30 Hari
                </Link>
                <Link to="/#proses" className={SECONDARY_CTA_CLASS}>
                  Lihat Cara Kerja
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-brand-cream py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <Reveal>
                <h2 className="font-display text-3xl font-bold leading-snug text-brand-dark sm:text-4xl">
                  Lahir dari dapur kafe, lorong toko, dan meja kasir UMKM
                </h2>
              </Reveal>

              <Reveal delay={80}>
                <div className="space-y-4 text-base leading-relaxed text-brand-muted">
                  <p>
                    Setiap hari, ribuan pemilik kafe, toko ritel, apotek, dan bengkel lokal
                    menghadapi masalah yang sama: bahan baku atau barang dagangan utama tiba-tiba
                    habis persis di saat pelanggan sedang ramai berdatangan (stockout).
                  </p>
                  <p>
                    Pelanggan terpaksa berbalik arah karena menu kopi favorit tidak bisa diseduh,
                    stok obat yang dicari kosong di rak, atau suku cadang belum tersedia di bengkel.
                    Masalah ini bukan karena barang dagangan tidak laku, melainkan karena perputaran
                    stok fisik terlewat dicatat dalam tumpukan nota kertas, buku gudang, dan lembaran
                    tabel spreadsheet yang tercecer.
                  </p>
                  <p>
                    Untuk mencegah rak kosong, staf operasional terpaksa lembur menghitung ratusan
                    SKU satu per satu, mengira-ngira kapan harus memesan ulang, lalu mengetik dokumen
                    Purchase Order (PO) secara manual di Word sebelum meminta tanda tangan pemilik
                    usaha. Rutinitas administratif ini menguras waktu hingga berjam-jam setiap
                    minggu, waktu berharga yang seharusnya bisa digunakan untuk menyapa pelanggan,
                    melatih staf, dan mengembangkan cabang usaha baru.
                  </p>

                  <div className="rounded-2xl border border-brand-shell/60 bg-white p-6">
                    <p className="font-display text-sm font-bold text-brand-dark">
                      Jurang pemisah yang kami temukan
                    </p>
                    <p className="mt-2 text-base leading-relaxed text-brand-muted">
                      Perangkat lunak ERP korporat berskala besar di luar sana terlalu rumit, mahal,
                      dan membutuhkan pelatihan berbulan-bulan yang membebani tim kecil. Di sisi
                      lain, buku catatan manual dan spreadsheet sudah tidak sanggup lagi mengimbangi
                      cepatnya laju perputaran bisnis harian.
                    </p>
                  </div>

                  <p className="font-display text-lg font-bold leading-snug text-brand-dark">
                    Dari kegelisahan nyata di lapangan itulah, ReorderFlow dirancang.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="border-y border-brand-shell/40 bg-white/40 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal className="max-w-2xl">
              <h2 className="font-display text-3xl font-bold leading-snug text-brand-dark sm:text-4xl">
                Teknologi yang menghargai dan membantu keputusan manusia
              </h2>
              <p className="mt-4 text-base leading-relaxed text-brand-muted">
                Kami tidak percaya pada otomasi buta yang mengambil alih kendali keuangan bisnis
                Anda. Kami percaya pada sistem cerdas yang meringankan beban rutin tanpa
                menghilangkan pengawasan manusia (Human-in-the-Loop).
              </p>
            </Reveal>

            <Reveal delay={80}>
              <ol className="mt-12 divide-y divide-brand-shell/60 border-y border-brand-shell/60">
                {PRINCIPLES.map((principle, index) => (
                  <li
                    key={principle.title}
                    className="grid grid-cols-1 gap-4 py-8 sm:grid-cols-[auto_1fr] sm:gap-8"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-orange font-display text-lg font-extrabold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-display text-xl font-bold leading-snug text-brand-dark">
                        {principle.title}
                      </h3>
                      <p className="mt-2 max-w-2xl text-base leading-relaxed text-brand-muted">
                        {principle.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>

        <section className="relative overflow-hidden bg-brand-dark py-16 sm:py-24">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-orange/15 blur-3xl" />
            <div className="paper-grain absolute inset-0 opacity-15" />
          </div>

          <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
            <Reveal>
              <h2 className="font-display text-3xl font-bold leading-snug text-white sm:text-4xl">
                Misi kami: nol hari kehabisan stok (Zero Stockout)
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-brand-shell/90 sm:text-lg">
                <p>
                  Misi ReorderFlow adalah memastikan rantai pasok pelaku UMKM di Indonesia berjalan
                  mulus dan bebas dari hambatan administratif.
                </p>
                <p>
                  Kami ingin melihat para peracik kopi menyeduh minuman terbaiknya dengan tenang,
                  pemilik toko ritel dan apotek melayani pelanggan dengan etalase lengkap, serta
                  bengkel dan pengrajin lokal berproduksi tanpa henti karena keterlambatan bahan
                  baku.
                </p>
                <p>
                  Ketika urusan pengecekan stok dan pembuatan dokumen pemesanan berjalan teratur di
                  latar belakang, pelaku usaha lokal memiliki ruang bernapas untuk fokus pada hal
                  yang paling esensial: merawat pelanggan dan menumbuhkan usaha secara berkelanjutan.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="bg-brand-cream py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal className="mb-10 max-w-2xl">
              <h2 className="font-display text-3xl font-bold leading-snug text-brand-dark sm:text-4xl">
                Dibangun untuk berbagai sektor pengelola persediaan fisik
              </h2>
            </Reveal>

            <Reveal delay={80}>
              <div className="overflow-hidden rounded-2xl border border-brand-shell/60 bg-white">
                <div className="hidden gap-6 border-b border-brand-dark/10 bg-brand-cream/60 px-6 py-4 md:grid md:grid-cols-[0.7fr_1fr_1.1fr]">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                    Sektor
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                    Tantangan operasional
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                    Solusi ReorderFlow
                  </span>
                </div>

                <div className="divide-y divide-brand-dark/10">
                  {SECTORS.map((sector) => (
                    <div
                      key={sector.name}
                      className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-[0.7fr_1fr_1.1fr] md:gap-6"
                    >
                      <h3 className="font-display text-base font-bold text-brand-dark">
                        {sector.name}
                      </h3>
                      <p className="text-sm leading-relaxed text-brand-muted">
                        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-brand-muted md:hidden">
                          Tantangan operasional
                        </span>
                        {sector.challenge}
                      </p>
                      <p className="text-sm leading-relaxed text-brand-dark/80">
                        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-brand-muted md:hidden">
                          Solusi ReorderFlow
                        </span>
                        {sector.solution}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="border-y border-brand-shell/40 bg-white/40 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal className="mb-10 max-w-2xl">
              <h2 className="font-display text-3xl font-bold leading-snug text-brand-dark sm:text-4xl">
                Solusi nyata tanpa biaya tersembunyi
              </h2>
            </Reveal>

            <Reveal delay={80}>
              <div className="rounded-2xl border border-brand-shell/60 bg-white p-6 sm:p-8">
                <ul className="space-y-6">
                  {COMMITMENTS.map((item) => (
                    <li key={item.title} className="flex items-start gap-4">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-orange/10">
                        <IconCheck />
                      </span>
                      <div>
                        <h3 className="font-display text-base font-bold text-brand-dark">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-brand-muted">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="relative overflow-hidden bg-brand-dark py-16 sm:py-24">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-brand-orange/20 blur-3xl" />
            <div className="paper-grain absolute inset-0 opacity-15" />
          </div>

          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
            <Reveal>
              <h2 className="font-display text-3xl font-extrabold leading-snug text-white sm:text-4xl">
                Siap mengakhiri drama kehabisan stok di usaha Anda?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-brand-shell/90">
                Bergabunglah bersama pemilik usaha lain yang telah mengalihkan rutinitas pencatatan
                manual menjadi alur pengadaan otomatis yang tenang dan terkontrol.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3">
                <Link to="/#harga" className={PRIMARY_CTA_CLASS}>
                  Mulai Coba Gratis 30 Hari
                </Link>
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-brand-amber underline underline-offset-4 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
                >
                  Konsultasi dengan Tim ReorderFlow
                </a>
              </div>

              <p className="mt-8 text-xs leading-relaxed text-brand-shell/80">
                Tanpa biaya pendaftaran awal • Batalkan kapan saja • Data bisnis Anda tersimpan aman
              </p>
            </Reveal>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
