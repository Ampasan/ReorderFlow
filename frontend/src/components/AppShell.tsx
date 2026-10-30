import { Suspense, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { MenuIcon } from './icons'
import { Sidebar } from './Sidebar'

function PageFallback() {
  return (
    <div className="space-y-5" role="status">
      <span className="sr-only">Memuat halaman</span>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="skeleton-bar h-6 w-52" />
          <div className="skeleton-bar h-3 w-72" />
        </div>
        <div className="skeleton-bar h-9 w-32" />
      </div>
      <div className="rounded-xl border border-brand-dark/10 bg-white px-5 py-6">
        <div className="skeleton-bar h-4 w-40" />
        <div className="mt-4 space-y-3">
          <div className="skeleton-bar h-12 w-full" />
          <div className="skeleton-bar h-12 w-full" />
          <div className="skeleton-bar h-12 w-full" />
        </div>
      </div>
    </div>
  )
}

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-brand-cream">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
      >
        Lewati ke konten utama
      </a>

      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="lg:pl-64">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-brand-dark/8 bg-brand-cream/95 px-4 backdrop-blur-sm lg:hidden">
          <span className="flex items-center gap-2">
            <span className="flex h-9 w-auto flex-shrink-0 items-center justify-center rounded-lg bg-white p-1">
              <img
                src="/logo-reorderflow.png"
                alt="logo ReorderFlow"
                aria-hidden="true"
                className="h-7 w-auto"
              />
            </span>
            <span className="text-sm font-bold tracking-tight text-brand-dark">
              Reorder<span className="text-brand-orange">Flow</span>
            </span>
          </span>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-controls="app-sidebar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-dark/12 bg-white text-brand-dark transition-colors hover:bg-brand-cream"
            aria-label="Buka menu navigasi"
          >
            <MenuIcon className="h-4 w-4" />
          </button>
        </header>

        <main id="main" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-8">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
