import { Link } from 'react-router-dom'
import { EMAIL_LINK, FOOTER_RESOURCES, FOOTER_SECTIONS, WA_LINK } from './landingContent'

const FOOTER_LINK_CLASS =
  'inline-flex min-h-11 items-center text-sm text-brand-shell transition-colors hover:text-brand-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark'

interface FooterNavProps {
  heading: string
  ariaLabel: string
  links: { label: string; to: string }[]
}

function FooterNav({ heading, ariaLabel, links }: FooterNavProps) {
  return (
    <nav aria-label={ariaLabel}>
      <h2 className="mb-3 font-display text-sm font-bold text-white">{heading}</h2>
      <ul className="space-y-1">
        {links.map(({ label, to }) => (
          <li key={to}>
            <Link to={to} className={FOOTER_LINK_CLASS}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function LandingFooter() {
  return (
    <footer className="border-t border-brand-shell/30 bg-brand-dark">
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-4 sm:px-6 sm:py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.6fr_0.8fr_0.8fr_1fr] lg:gap-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-cream p-1">
                <img src="/logo-reorderflow.png" alt="" className="h-full w-full object-contain" />
              </span>
              <span className="font-display text-lg font-bold text-brand-shell">
                Reorder<span className="text-brand-amber">Flow</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-shell">
              Platform inventori untuk UMKM.
            </p>
          </div>

          <FooterNav heading="Jelajahi" ariaLabel="Navigasi bagian" links={FOOTER_SECTIONS} />
          <FooterNav heading="Informasi" ariaLabel="Informasi dan bantuan" links={FOOTER_RESOURCES} />

          <div>
            <h2 className="mb-3 font-display text-sm font-bold text-white">Hubungi kami</h2>
            <ul className="space-y-1">
              <li>
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center text-sm text-brand-shell transition-colors hover:text-brand-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
                >
                  WhatsApp: 0877-2330-5893
                </a>
              </li>
              <li>
                <a
                  href={EMAIL_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center break-words text-sm text-brand-shell transition-colors hover:text-brand-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
                >
                  n.rakan.r.2005@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-brand-shell/30 pt-5 text-xs text-brand-shell sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} ReorderFlow</p>
        </div>
      </div>
    </footer>
  )
}
