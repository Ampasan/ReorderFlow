import { FlowVisual } from '../FlowVisual'

export function HeroSection() {
  return (
    <section id="beranda" className="relative overflow-hidden bg-brand-dark">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-24 right-0 h-[26rem] w-[26rem] rounded-full bg-brand-orange/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-brand-amber/10 blur-3xl" />
        <div className="paper-grain absolute inset-0 opacity-20" />
      </div>

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:pb-28 lg:pt-24">
        <div className="landing-hero-copy">
          <h1 className="font-display text-[2.75rem] font-extrabold leading-[1.05] tracking-[-0.02em] text-white sm:text-5xl">
            Stok menipis,
            <br />
            <span className="text-brand-amber">PO mengalir otomatis.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-brand-shell/90 sm:text-lg">
            ReorderFlow memantau stok setiap hari. Begitu stok menyentuh batas minimum, draft
            Purchase Order tersusun otomatis, siap Anda setujui dan kirim ke pemasok.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#kontak"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-orange px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-orange-strong hover:shadow-lg hover:shadow-brand-orange/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
            >
              Mulai Gratis 30 Hari
            </a>
            <a
              href="#proses"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-brand-shell/40 px-6 py-3 text-sm font-semibold text-brand-shell transition-all hover:-translate-y-0.5 hover:border-brand-amber hover:text-brand-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
            >
              Lihat Cara Kerja
            </a>
          </div>
        </div>

        <div className="landing-hero-summary">
          <FlowVisual />
        </div>
      </div>
    </section>
  )
}
