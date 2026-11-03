import { useState } from 'react'
import { Reveal } from '../Reveal'
import { INDUSTRIES } from '../landingContent'

export function IndustriesSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [loadedImageSlugs, setLoadedImageSlugs] = useState<Set<string>>(() => new Set())
  const [failedImageSlugs, setFailedImageSlugs] = useState<Set<string>>(() => new Set())

  const activeIndustry = INDUSTRIES[activeIndex]
  const imageLoaded = loadedImageSlugs.has(activeIndustry.slug)
  const imageFailed = failedImageSlugs.has(activeIndustry.slug)

  return (
    <section id="industri" className="scroll-mt-20 border-y border-brand-shell/40 bg-white/40 pb-16 pt-12 sm:pb-24 sm:pt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mb-12">
          <h2 className="font-display text-3xl font-bold leading-snug text-brand-dark sm:text-4xl">
            Cocok untuk berbagai jenis UMKM
          </h2>
          <p className="mt-4 text-base leading-relaxed text-brand-muted">
            Untuk usaha skala kecil hingga menengah yang mengelola stok
            secara rutin dan perlu alur pemesanan ulang yang terstruktur.
          </p>
        </Reveal>

        <div
          className="mb-8 grid grid-cols-2 gap-2 rounded-2xl bg-brand-cream p-2 sm:mx-auto sm:flex sm:w-fit sm:rounded-full"
          role="group"
          aria-label="Pilih jenis usaha"
        >
          {INDUSTRIES.map((industry, index) => {
            const isActive = index === activeIndex

            return (
              <button
                key={industry.slug}
                type="button"
                aria-label={`Tampilkan ${industry.name}`}
                aria-controls="industries-section-slide"
                aria-pressed={isActive}
                onClick={() => setActiveIndex(index)}
                className={`min-h-11 rounded-xl px-3 py-2 text-xs font-semibold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 sm:rounded-full sm:px-5 sm:text-sm ${
                  isActive
                    ? 'bg-white text-brand-orange-strong shadow-sm'
                    : 'text-brand-muted hover:bg-white/70 hover:text-brand-dark'
                }`}
              >
                {industry.name}
              </button>
            )
          })}
        </div>

        <Reveal delay={80}>
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-14">
            <div
              id="industries-section-slide"
              key={activeIndustry.slug}
              className="industry-content-enter min-w-0"
              aria-live="polite"
              aria-atomic="true"
            >
              <h3 className="font-display text-2xl font-bold text-brand-dark sm:text-3xl">
                {activeIndustry.name}
              </h3>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-brand-muted">
                {activeIndustry.industryDesc}
              </p>
              <a
                href="#kontak"
                className="mt-7 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-orange px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
              >
                Konsultasikan kebutuhan Anda
              </a>
            </div>

            <div className="relative aspect-[7/5] overflow-hidden rounded-2xl bg-brand-cream sm:rounded-3xl">
              {imageFailed ? (
                <div
                  className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-brand-dark"
                  role="img"
                  aria-label={`Foto ${activeIndustry.name} tidak dapat dimuat`}
                >
                  <p className="font-display text-lg font-bold">Foto tidak dapat dimuat</p>
                  <p className="text-sm">Pilih jenis usaha lain atau periksa koneksi internet Anda.</p>
                </div>
              ) : (
                <>
                  {!imageLoaded && (
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-brand-shell text-sm font-medium text-brand-dark"
                      aria-hidden="true"
                    >
                      Memuat foto...
                    </div>
                  )}
                  <img
                    key={activeIndustry.slug}
                    src={activeIndustry.industryImageUrl}
                    alt={activeIndustry.name}
                    loading="eager"
                    decoding="async"
                    onLoad={() => {
                      setLoadedImageSlugs((loaded) => new Set(loaded).add(activeIndustry.slug))
                    }}
                    onError={() => {
                      setFailedImageSlugs((failed) => new Set(failed).add(activeIndustry.slug))
                    }}
                    className={`h-full w-full object-cover transition-opacity duration-300 ${
                      imageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
