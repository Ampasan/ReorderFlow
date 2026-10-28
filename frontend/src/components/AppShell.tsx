import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { MenuIcon } from './icons'
import { Sidebar } from './Sidebar'

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
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-brand-line/70 bg-brand-cream px-4 py-3 lg:hidden">
          <span className="text-base font-extrabold tracking-tight text-brand-dark">
            Reorder<span className="text-brand-orange">Flow</span>
          </span>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-controls="app-sidebar"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-brand-dark/15 bg-white px-3 text-sm font-semibold text-brand-dark"
          >
            <MenuIcon />
            Menu
          </button>
        </header>

        <main id="main" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
