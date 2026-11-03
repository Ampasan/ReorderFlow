import { Reveal } from '../Reveal'
import { INDUSTRIES } from '../landingContent'

export function IndustriesSection() {
  return (
    <section id="industri" className="border-y border-brand-shell/40 bg-white/40 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mb-12 max-w-2xl">
          <h2 className="font-display text-3xl font-bold leading-snug text-brand-dark sm:text-4xl">
            Cocok untuk berbagai jenis UMKM
          </h2>
          <p className="mt-4 text-base leading-relaxed text-brand-muted">
            ReorderFlow dirancang untuk usaha skala kecil hingga menengah yang mengelola stok
            secara rutin dan perlu alur pemesanan ulang yang terstruktur.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {INDUSTRIES.map((item) => (
              <article
                key={item.slug}
                className="group overflow-hidden rounded-2xl border border-brand-shell/60 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-brand-orange/40 hover:shadow-lg hover:shadow-brand-orange/10"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-brand-cream">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-display text-base font-bold text-brand-dark">{item.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-brand-muted">{item.desc}</p>
                </div>
              </article>
            ))}

            <div className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-brand-orange/30 bg-gradient-to-br from-brand-orange/10 to-brand-cream p-6">
              <div>
                <h3 className="font-display text-base font-bold text-brand-dark">Jenis usaha lain?</h3>
                <p className="mt-1 text-sm leading-relaxed text-brand-muted">
                  Konsultasikan kebutuhan Anda, kami bantu sesuaikan alurnya.
                </p>
              </div>
              <a
                href="#kontak"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-orange px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-orange-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
              >
                Konsultasikan kebutuhan Anda
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
