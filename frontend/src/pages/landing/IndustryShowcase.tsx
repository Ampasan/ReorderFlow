import { useEffect, useState } from 'react'
import { INDUSTRIES } from './landingContent'

const ROTATION_DELAY = 3000

export function IndustryShowcase() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [loadedImageSlugs, setLoadedImageSlugs] = useState<Set<string>>(() => new Set())
  const [failedImageSlug, setFailedImageSlug] = useState<string | null>(null)

  const activeIndustry = INDUSTRIES[activeIndex]
  const imageFailed = failedImageSlug === activeIndustry.slug
  const imageLoaded = loadedImageSlugs.has(activeIndustry.slug)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setActiveIndex((index) => (index + 1) % INDUSTRIES.length)
    }, ROTATION_DELAY)

    return () => window.clearTimeout(timeoutId)
  }, [activeIndex])

  return (
    <div
      className="mx-auto w-full max-w-[42rem] pt-3 lg:pt-0"
      role="region"
      aria-label="Contoh penggunaan ReorderFlow, berganti otomatis setiap 3 detik"
      aria-roledescription="karusel"
    >
      <div>
        <div className="relative aspect-[7/5] overflow-hidden rounded-2xl bg-brand-shell">
          {imageFailed ? (
            <div
              className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-brand-dark"
              role="img"
              aria-label={`Foto ${activeIndustry.name} tidak dapat dimuat`}
            >
              <p className="font-display text-lg font-bold">Foto tidak dapat dimuat</p>
              <p className="text-sm">Periksa koneksi internet Anda, lalu pilih jenis usaha lain.</p>
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
                src={activeIndustry.imageUrl}
                alt={`${activeIndustry.name}, ${activeIndustry.businessType}`}
                loading="eager"
                decoding="async"
                fetchPriority={activeIndex === 0 ? 'high' : 'auto'}
                onLoad={() => {
                  setLoadedImageSlugs((loaded) => {
                    if (loaded.has(activeIndustry.slug)) return loaded
                    return new Set(loaded).add(activeIndustry.slug)
                  })
                }}
                onError={() => setFailedImageSlug(activeIndustry.slug)}
                className={`h-full w-full object-cover transition-opacity duration-500 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </>
          )}
        </div>

        <div className="relative z-10 -mt-7 rounded-2xl bg-white px-4 pb-4 pt-4 shadow-[0_18px_42px_-28px_rgba(42,26,14,0.55)] sm:-mt-8 sm:px-6 sm:pb-6 sm:pt-5">
          <div
            className="grid grid-cols-2 gap-1.5 rounded-xl border border-brand-dark/10 p-1.5 lg:grid-cols-4"
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
                  aria-controls="industry-showcase-slide"
                  aria-pressed={isActive}
                  onClick={() => setActiveIndex(index)}
                  className={`min-h-11 rounded-full px-2 py-2 text-xs font-semibold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 sm:text-sm ${
                    isActive
                      ? 'bg-brand-cream text-brand-orange-strong'
                      : 'text-brand-muted hover:bg-brand-cream hover:text-brand-dark'
                  }`}
                >
                  {industry.name}
                </button>
              )
            })}
          </div>

          <div
            id="industry-showcase-slide"
            key={activeIndustry.slug}
            className="industry-content-enter mt-5 min-h-[6.5rem]"
            role="group"
            aria-label={`${activeIndex + 1} dari ${INDUSTRIES.length}: ${activeIndustry.name}`}
            aria-roledescription="slide"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h2 className="font-display text-xl font-bold text-brand-dark sm:text-2xl">
                {activeIndustry.name}
              </h2>
              <span className="text-sm font-medium text-brand-muted">
                {activeIndustry.businessType}
              </span>
            </div>
            <p className="mt-1.5 text-base leading-relaxed text-brand-muted sm:text-lg">
              {activeIndustry.desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
