import { useRef, useState, useEffect } from 'react'

// ─── Brand SVG logo mark (bicycle-loop icon from brand identity) ───────────
function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8" cy="22" r="6" stroke="#B85114" strokeWidth="2.5" />
      <circle cx="24" cy="22" r="6" stroke="#B85114" strokeWidth="2.5" />
      <path
        d="M8 22 L14 10 L20 16 L24 10"
        stroke="#B85114"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M14 10 L20 10"
        stroke="#B85114"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ─── Minimal check icon ──────────────────────────────────────────────────────
function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.5L6.5 12L13 5" stroke="#B85114" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconCheckWhite() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.5L6.5 12L13 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Feature icons ────────────────────────────────────────────────────────────
function IconSearch() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="#B85114" strokeWidth="2" />
      <path d="M20 20l-3-3" stroke="#B85114" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
function IconPDF() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="2" width="12" height="16" rx="2" stroke="#B85114" strokeWidth="2" />
      <path d="M4 18h16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" stroke="#B85114" strokeWidth="2" />
      <path d="M8 7h6M8 11h4" stroke="#B85114" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
function IconMail() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#B85114" strokeWidth="2" />
      <path d="M3 7l9 6 9-6" stroke="#B85114" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
function IconSend() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 2L11 13" stroke="#B85114" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 2L15 22 11 13 2 9l20-7z" stroke="#B85114" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconList() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 6h13M8 12h13M8 18h13" stroke="#B85114" strokeWidth="2" strokeLinecap="round" />
      <circle cx="4" cy="6" r="1.5" fill="#B85114" />
      <circle cx="4" cy="12" r="1.5" fill="#B85114" />
      <circle cx="4" cy="18" r="1.5" fill="#B85114" />
    </svg>
  )
}

// ─── Value icons ─────────────────────────────────────────────────────────────
function IconClock() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="#B85114" strokeWidth="2" />
      <path d="M12 7v5l3 3" stroke="#B85114" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconShield() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l8 3v5c0 5-4 9-8 10C8 20 4 16 4 11V6l8-3z" stroke="#B85114" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="#B85114" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconBarChart() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="14" width="4" height="7" rx="1" stroke="#B85114" strokeWidth="2" />
      <rect x="10" y="9" width="4" height="12" rx="1" stroke="#B85114" strokeWidth="2" />
      <rect x="17" y="5" width="4" height="16" rx="1" stroke="#B85114" strokeWidth="2" />
    </svg>
  )
}
function IconGear() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="#B85114" strokeWidth="2" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="#B85114" strokeWidth="2" />
    </svg>
  )
}

// ─── WhatsApp icon ────────────────────────────────────────────────────────────
function IconWhatsApp() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.556 4.116 1.529 5.845L.057 23.5l5.832-1.529A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.817 9.817 0 01-5.003-1.373l-.357-.213-3.714.974.991-3.617-.234-.373A9.818 9.818 0 1112 21.818z" />
    </svg>
  )
}

// ─── Simple in-view fade hook ────────────────────────────────────────────────
function useFadeIn(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

// ─── Section fade wrapper ─────────────────────────────────────────────────────
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useFadeIn()
  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(18px)',
        transition: 'opacity 480ms ease, transform 480ms ease',
      }}
    >
      {children}
    </div>
  )
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-white/60 p-4 border border-brand-line/30">
      <div className="mt-0.5 flex-shrink-0 rounded-lg bg-brand-cream p-2 border border-brand-shell/60">
        {icon}
      </div>
      <div>
        <p className="font-display font-bold text-sm text-brand-dark mb-1">{title}</p>
        <p className="text-sm text-brand-muted leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// ─── Process step ─────────────────────────────────────────────────────────────
function ProcessStep({ n, title, desc, accent = false }: { n: number; title: string; desc: string; accent?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-display font-bold ${
          accent
            ? 'bg-brand-orange text-white'
            : 'bg-brand-shell text-brand-dark'
        }`}
      >
        {n}
      </span>
      <div className="pt-1">
        <p className="font-display font-bold text-sm text-brand-dark leading-snug">{title}</p>
        <p className="text-xs text-brand-muted mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// ─── Value card ───────────────────────────────────────────────────────────────
function ValueCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 p-5 rounded-2xl bg-white/50 border border-brand-line/30">
      <div className="w-12 h-12 rounded-full bg-brand-cream border border-brand-shell/70 flex items-center justify-center">
        {icon}
      </div>
      <p className="font-display font-bold text-brand-dark text-sm">{title}</p>
      <p className="text-xs text-brand-muted leading-relaxed">{desc}</p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function LandingPage() {
  const waLink = 'https://wa.me/6287723305893?text=Halo%2C%20saya%20ingin%20tahu%20lebih%20lanjut%20tentang%20ReorderFlow'
  const emailLink = 'mailto:n.rakan.r.2005@gmail.com'

  return (
    <div className="min-h-screen bg-brand-cream font-sans text-brand-dark">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-brand-shell/50 bg-brand-cream/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="#beranda" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded-md">
            <LogoMark size={26} />
            <span className="font-display font-bold text-lg text-brand-dark">
              Reorder<span className="text-brand-orange">Flow</span>
            </span>
          </a>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-brand-muted">
            <a href="#fitur" className="hover:text-brand-dark transition-colors">Fitur</a>
            <a href="#proses" className="hover:text-brand-dark transition-colors">Cara Kerja</a>
            <a href="#harga" className="hover:text-brand-dark transition-colors">Harga</a>
          </nav>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
          >
            <IconWhatsApp />
            <span className="hidden sm:inline">Konsultasi Gratis</span>
            <span className="sm:hidden">Kontak</span>
          </a>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section id="beranda" className="mx-auto max-w-6xl px-4 pt-16 pb-10 sm:px-6 sm:pt-20 sm:pb-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16 items-center">

          {/* Left: copy */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-orange mb-3">
              Platform Inventori UMKM
            </p>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl leading-tight text-brand-dark mb-4">
              Persediaan Terkelola<br />
              <span className="text-brand-orange">Otomatis.</span>
            </h1>
            <p className="text-base text-brand-muted leading-relaxed mb-6 max-w-md">
              ReorderFlow membantu toko grosir dan ritel sembako UMKM memantau stok, menyiapkan Purchase Order, dan mengirimkannya ke pemasok setelah persetujuan manajer, tanpa kerja manual yang berulang.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-orange px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
              >
                <IconWhatsApp />
                Mulai Gratis 30 Hari
              </a>
              <a
                href="#harga"
                className="inline-flex items-center rounded-lg border border-brand-shell px-5 py-3 text-sm font-semibold text-brand-dark transition-colors hover:border-brand-orange hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
              >
                Lihat Harga
              </a>
            </div>
          </div>

          {/* Right: key value callout card */}
          <div className="rounded-2xl border border-brand-shell bg-white/60 p-6 shadow-sm">
            <p className="font-display font-bold text-brand-dark text-base mb-4">Dengan ReorderFlow, toko Anda bisa:</p>
            <ul className="space-y-3">
              {[
                'Pantau stok mendekati batas minimum secara otomatis',
                'Buat draft PO langsung dari data stok dan pemasok',
                'Kirim PO ke pemasok setelah manajer menyetujui',
                'Lacak riwayat dan status setiap pesanan dalam satu tempat',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-brand-muted leading-relaxed">
                  <span className="mt-0.5 flex-shrink-0"><IconCheck /></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Nilai Utama (value props) ──────────────────────────────────────── */}
      <section className="bg-white/40 border-y border-brand-shell/40 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeIn>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <ValueCard icon={<IconClock />} title="Hemat Waktu" desc="Kurangi pekerjaan pemesanan manual yang berulang setiap harinya." />
              <ValueCard icon={<IconShield />} title="Minim Kesalahan" desc="Kurangi risiko salah catat dan salah buat PO." />
              <ValueCard icon={<IconBarChart />} title="Stok Lebih Terjaga" desc="Cegah kehabisan maupun penumpukan stok berlebih." />
              <ValueCard icon={<IconGear />} title="Proses Terstruktur" desc="Persetujuan PO, pengiriman ke pemasok, dan riwayat pesanan dalam satu alur." />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Fitur Utama ────────────────────────────────────────────────────── */}
      <section id="fitur" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <FadeIn>
          <div className="mb-10 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-orange mb-2">Fitur Utama</p>
            <h2 className="font-display font-bold text-3xl text-brand-dark">
              Semua yang dibutuhkan untuk kelola stok dan PO
            </h2>
          </div>
        </FadeIn>
        <FadeIn delay={80}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<IconSearch />}
              title="Stock Monitoring"
              desc="Pantau stok berdasarkan batas minimum yang Anda tentukan."
            />
            <FeatureCard
              icon={<IconPDF />}
              title="Automatic PO Generation"
              desc="Buat draft PO secara otomatis berdasarkan kebutuhan stok dan data pemasok."
            />
            <FeatureCard
              icon={<IconMail />}
              title="Email Approval"
              desc="Manajer dapat menyetujui atau menolak PO langsung dari email."
            />
            <FeatureCard
              icon={<IconSend />}
              title="Automatic PO Delivery"
              desc="PO dikirim ke pemasok secara otomatis setelah mendapat persetujuan."
            />
            <FeatureCard
              icon={<IconList />}
              title="PO Status Tracking"
              desc="Catat dan pantau status serta riwayat setiap pemesanan dalam satu tampilan."
            />
          </div>
        </FadeIn>
      </section>

      {/* ── Proses: AS-IS vs TO-BE ─────────────────────────────────────────── */}
      <section id="proses" className="bg-white/40 border-y border-brand-shell/40 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeIn>
            <div className="mb-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-orange mb-2">Cara Kerja</p>
              <h2 className="font-display font-bold text-3xl text-brand-dark max-w-lg mx-auto leading-snug">
                Dari proses manual menuju alur yang terstruktur
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* AS-IS */}
            <FadeIn delay={0}>
              <div className="rounded-2xl border border-brand-shell bg-brand-cream p-6 h-full">
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted mb-1">Proses Saat Ini</p>
                <p className="font-display font-bold text-brand-dark text-base mb-5">Pemesanan masih dilakukan secara manual.</p>
                <div className="space-y-4">
                  <ProcessStep n={1} title="Pencatatan Stok Manual" desc="Barang masuk dan keluar dicatat di Excel atau rekap manual." />
                  <ProcessStep n={2} title="Pengecekan Stok Satu per Satu" desc="Memeriksa jumlah stok secara visual satu per satu." />
                  <ProcessStep n={3} title="Pembuatan PO Manual" desc="Input data pemasok dan mengisi SKU ke dalam PO." />
                  <ProcessStep n={4} title="Menunggu Persetujuan PO" desc="Mengirimkan PO ke manajer untuk diperiksa dan disetujui." />
                  <ProcessStep n={5} title="Pengiriman PO ke Pemasok" desc="Meneruskan PO yang telah disetujui kepada pemasok." />
                </div>
              </div>
            </FadeIn>

            {/* TO-BE */}
            <FadeIn delay={100}>
              <div className="rounded-2xl border border-brand-orange/30 bg-[#FEF3E2] p-6 h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full bg-brand-orange/8 pointer-events-none" aria-hidden="true" />
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-orange mb-1">Dengan ReorderFlow</p>
                <p className="font-display font-bold text-brand-dark text-base mb-5">Proses lebih terstruktur dan efisien.</p>
                <div className="space-y-4">
                  <ProcessStep n={1} title="Pencatatan Stok Terorganisir" desc="Data barang tersimpan dalam satu sumber pencatatan." accent />
                  <ProcessStep n={2} title="Pemantauan Stok Lebih Teratur" desc="Kondisi stok dipantau berdasarkan batas minimum yang ditentukan." accent />
                  <ProcessStep n={3} title="Persiapan PO Lebih Praktis" desc="Dokumen disiapkan berdasarkan kebutuhan stok dan data pemasok." accent />
                  <ProcessStep n={4} title="Persetujuan Lebih Terstruktur" desc="Proses pemeriksaan dan persetujuan PO dalam satu alur." accent />
                  <ProcessStep n={5} title="Pengiriman Tepat Waktu" desc="PO diteruskan ke pemasok setelah mendapat persetujuan." accent />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Tentang ────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 items-start">
          <FadeIn>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-orange mb-2">Tentang ReorderFlow</p>
              <h2 className="font-display font-bold text-3xl text-brand-dark mb-4 leading-snug">
                Berawal dari kebutuhan nyata di lapangan.
              </h2>
              <p className="text-sm text-brand-muted leading-relaxed mb-3">
                ReorderFlow berawal dari kebutuhan untuk menyederhanakan proses pengelolaan persediaan dan pemesanan ulang yang masih banyak dilakukan secara manual. Pengecekan stok, penyusunan Purchase Order, hingga proses persetujuan pembelian dapat menyita waktu dan membuat pekerjaan operasional menjadi kurang efisien.
              </p>
              <p className="text-sm text-brand-muted leading-relaxed">
                Dengan pendekatan yang praktis, mudah dipelajari, dan harga yang terjangkau, ReorderFlow ingin membantu UMKM mengelola kebutuhan persediaan tanpa harus terbebani oleh sistem yang terlalu kompleks.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={80}>
            <div className="rounded-2xl border border-brand-shell bg-white/60 p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-orange mb-2">Tujuan Kami</p>
              <h3 className="font-display font-bold text-xl text-brand-dark mb-5 leading-snug">
                Mempermudah operasional, mendukung pertumbuhan.
              </h3>
              <ul className="space-y-4">
                {[
                  'Mempermudah pekerjaan operasional bisnis.',
                  'Menghadirkan sistem teknologi otomasi yang sederhana, terjangkau, dan mudah digunakan.',
                  'Mengurangi pekerjaan manual sehingga meminimalkan kesalahan.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-orange text-white text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-brand-muted leading-relaxed">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Harga ──────────────────────────────────────────────────────────── */}
      <section id="harga" className="bg-white/40 border-y border-brand-shell/40 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeIn>
            <div className="mb-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-orange mb-2">Harga</p>
              <h2 className="font-display font-bold text-3xl text-brand-dark">
                Pilih paket yang sesuai kebutuhan toko Anda
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 max-w-3xl mx-auto">

            {/* Basic */}
            <FadeIn delay={0}>
              <div className="rounded-2xl border border-brand-shell bg-brand-cream p-6 flex flex-col h-full">
                <div className="mb-4">
                  <p className="font-display font-bold text-xl text-brand-dark">Basic</p>
                  <p className="text-sm text-brand-muted mt-0.5">Coba sekarang, tanpa biaya.</p>
                </div>
                <p className="font-display font-extrabold text-3xl text-brand-orange mb-1">Gratis 30 Hari</p>
                <p className="text-xs text-brand-muted mb-5">Mulai coba ReorderFlow dan rasakan kemudahan mengelola persediaan.</p>

                <ul className="space-y-2 mb-5 flex-grow">
                  {[
                    'Pantau ketersediaan stok',
                    'Kirim PO ke pemasok setelah disetujui',
                    'Status pesanan terpantau',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-brand-muted">
                      <span className="mt-0.5 flex-shrink-0"><IconCheck /></span>
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="rounded-lg bg-brand-shell/40 p-3 mb-5 grid grid-cols-3 gap-2 text-center text-xs text-brand-muted">
                  <div><span className="block font-bold text-brand-dark text-sm">500</span>produk (SKU)</div>
                  <div><span className="block font-bold text-brand-dark text-sm">10</span>pemasok</div>
                  <div><span className="block font-bold text-brand-dark text-sm">15</span>pesanan</div>
                </div>

                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-lg border-2 border-brand-orange px-4 py-3 text-center text-sm font-semibold text-brand-orange transition-colors hover:bg-brand-orange hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
                >
                  Mulai Gratis 30 Hari
                </a>
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="mt-3 block text-center text-xs text-brand-muted underline hover:text-brand-orange">
                  Konsultasi Gratis
                </a>
              </div>
            </FadeIn>

            {/* Standard */}
            <FadeIn delay={80}>
              <div className="rounded-2xl border-2 border-brand-orange bg-brand-dark p-6 flex flex-col h-full relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <span className="rounded-full bg-brand-orange px-3 py-1 text-xs font-semibold text-white">
                    Rekomendasi
                  </span>
                </div>
                <div className="mb-4 pr-24">
                  <p className="font-display font-bold text-xl text-white">Standard</p>
                  <p className="text-sm text-brand-shell/80 mt-0.5">Solusi lengkap untuk penggunaan rutin.</p>
                </div>
                <div className="mb-1">
                  <span className="font-display font-extrabold text-3xl text-brand-amber">Rp149.000</span>
                  <span className="text-sm text-brand-shell/70 ml-1">/ bulan</span>
                </div>
                <p className="text-xs text-brand-amber/80 mb-5">Tersedia paket tahunan: Rp1.490.000/tahun, hemat Rp298.000.</p>

                <ul className="space-y-2 mb-5 flex-grow">
                  {[
                    'Pantau ketersediaan stok',
                    'Buat draf pesanan pembelian (PO)',
                    'Minta persetujuan PO ke user',
                    'Kirim PO ke pemasok setelah disetujui',
                    'Status pesanan terpantau',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-brand-shell/80">
                      <span className="mt-0.5 flex-shrink-0"><IconCheckWhite /></span>
                      {item}
                    </li>
                  ))}
                </ul>

                <p className="text-xs text-brand-shell/60 mb-5 flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4v16M4 12h16" stroke="#F4AE52" strokeWidth="2.5" strokeLinecap="round"/></svg>
                  Tanpa batasan jumlah produk, pemasok, dan pesanan untuk penggunaan wajar.
                </p>

                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-lg bg-brand-orange px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-orange-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
                >
                  Pilih Paket Standard
                </a>
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="mt-3 block text-center text-xs text-brand-shell/60 underline hover:text-white">
                  Konsultasi Gratis
                </a>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 text-center">
        <FadeIn>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-brand-dark mb-3">
            Siap kelola stok lebih mudah?
          </h2>
          <p className="text-base text-brand-muted max-w-md mx-auto mb-8">
            Hubungi kami via WhatsApp atau email untuk mulai coba gratis atau tanyakan lebih lanjut.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-orange px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
            >
              <IconWhatsApp />
              Chat via WhatsApp
            </a>
            <a
              href={emailLink}
              className="inline-flex items-center gap-2 rounded-lg border border-brand-shell px-6 py-3 text-sm font-semibold text-brand-dark transition-colors hover:border-brand-orange hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              Kirim Email
            </a>
          </div>
        </FadeIn>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-brand-shell/50 bg-brand-dark py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <LogoMark size={22} />
              <span className="font-display font-bold text-white">
                Reorder<span className="text-brand-orange">Flow</span>
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-brand-shell/60">
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp: 0877-2330-5893</a>
              <a href={emailLink} className="hover:text-white transition-colors">n.rakan.r.2005@gmail.com</a>
            </div>
            <p className="text-xs text-brand-shell/40">
              &copy; {new Date().getFullYear()} ReorderFlow
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
