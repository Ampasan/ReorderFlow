import { Reveal } from '../Reveal'
import { BASIC_FEATURES, BASIC_LIMITS, STANDARD_FEATURES, WA_LINK } from '../landingContent'
import { IconCheck, IconCheckWhite } from '../landingIcons'

export function PricingSection() {
  return (
    <section id="harga" className="scroll-mt-20 border-y border-brand-shell/40 bg-white/40 pb-16 pt-12 sm:pb-24 sm:pt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mb-12 max-w-2xl">
          <h2 className="font-display text-3xl font-bold leading-snug text-brand-dark sm:text-4xl">
            Pilih paket yang sesuai kebutuhan toko Anda
          </h2>
        </Reveal>

        <Reveal delay={80}>
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col rounded-2xl border border-brand-shell/70 bg-brand-cream p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-shell/40 sm:p-8">
              <div>
                <p className="font-display text-xl font-bold text-brand-dark">Basic</p>
                <p className="mt-1 text-sm text-brand-muted">Coba sekarang, tanpa biaya.</p>
              </div>
              <p className="mt-5 font-display text-3xl font-extrabold text-brand-orange">Gratis 30 Hari</p>
              <p className="mt-1 text-xs text-brand-muted">Mulai coba ReorderFlow dan rasakan kemudahan mengelola persediaan.</p>

              <ul className="mt-5 flex-grow space-y-2">
                {BASIC_FEATURES.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-brand-muted">
                    <span className="mt-0.5 flex-shrink-0"><IconCheck /></span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-5 grid grid-cols-3 gap-2 rounded-lg bg-brand-shell/40 p-3 text-center text-xs text-brand-muted">
                {BASIC_LIMITS.map((limit) => (
                  <div key={limit.label}>
                    <span className="block font-bold text-brand-dark">{limit.value}</span>
                    {limit.label}
                  </div>
                ))}
              </div>

              <a
                href="#kontak"
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg border-2 border-brand-orange px-4 py-3 text-sm font-semibold text-brand-orange transition-all hover:-translate-y-0.5 hover:bg-brand-orange hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
              >
                Mulai Gratis 30 Hari
              </a>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-center text-xs text-brand-muted underline underline-offset-2 transition-colors hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 rounded"
              >
                Konsultasi Gratis
              </a>
            </div>

            <div className="relative flex flex-col overflow-hidden rounded-2xl bg-brand-dark p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-dark/25 sm:p-8">
              <div className="paper-grain absolute inset-0 opacity-10" aria-hidden="true" />
              <div className="relative">
                <p className="font-display text-xl font-bold text-white">Standard</p>
                <p className="mt-1 text-sm text-brand-shell/80">Solusi lengkap untuk penggunaan rutin.</p>
              </div>
              <div className="relative mt-5">
                <span className="font-display text-3xl font-extrabold text-brand-amber">Rp149.000</span>
                <span className="ml-1 text-sm text-brand-shell/70">/ bulan</span>
              </div>
              <p className="relative mt-1 text-xs text-brand-amber/80">
                Tersedia paket tahunan: Rp1.490.000/tahun, hemat Rp298.000.
              </p>

              <ul className="relative mt-5 flex-grow space-y-2">
                {STANDARD_FEATURES.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-brand-shell/80">
                    <span className="mt-0.5 flex-shrink-0"><IconCheckWhite /></span>
                    {item}
                  </li>
                ))}
              </ul>

              <p className="relative mt-5 flex items-center gap-1.5 text-xs text-brand-shell/60">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 4v16M4 12h16" stroke="#F4AE52" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                Tanpa batasan jumlah produk, pemasok, dan pesanan untuk penggunaan wajar.
              </p>

              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="relative mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-brand-orange px-4 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-orange-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
              >
                Pilih Paket Standard
              </a>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="relative mt-3 block text-center text-xs text-brand-shell/60 underline underline-offset-2 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark rounded"
              >
                Konsultasi Gratis
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
