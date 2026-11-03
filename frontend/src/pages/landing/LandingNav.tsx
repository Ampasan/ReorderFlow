import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { NAV_LINKS } from './landingContent'

export function LandingNav() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <header className="sticky top-0 z-50 border-b border-brand-shell/15 bg-brand-dark/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a
          href="#beranda"
          className="flex min-h-11 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber"
        >
          <img src="/logo-reorderflow.png" alt="" className="h-9 w-9 shrink-0 object-contain" />
          <span className="font-display text-lg font-bold text-white">
            Reorder<span className="text-brand-amber">Flow</span>
          </span>
        </a>

        <nav className="hidden items-center gap-6 text-sm text-brand-shell md:flex">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="inline-flex min-h-11 items-center transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber rounded"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden min-h-11 items-center justify-center rounded-lg bg-brand-orange px-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-orange-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark md:inline-flex"
          >
            Masuk
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Tutup menu' : 'Buka menu'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-brand-shell transition-colors hover:bg-brand-shell/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber md:hidden"
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-brand-shell/15 bg-brand-dark px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col" aria-label="Menu mobile">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="inline-flex min-h-11 items-center text-sm text-brand-shell transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber rounded"
              >
                {label}
              </a>
            ))}
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-orange px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber"
            >
              Masuk
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
