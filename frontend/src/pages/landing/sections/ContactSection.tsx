import { Reveal } from '../Reveal'
import { EMAIL_LINK, WA_LINK } from '../landingContent'
import { IconWhatsApp } from '../landingIcons'

export function ContactSection() {
  return (
    <section id="kontak" className="scroll-mt-20 border-y border-brand-shell/40 bg-white/40 px-4 py-16 text-center sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h2 className="font-display text-3xl font-extrabold leading-snug text-brand-dark sm:text-4xl">
            Siap memulai ReorderFlow?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-brand-muted">
            Hubungi kami via WhatsApp atau email untuk mulai coba gratis atau tanyakan lebih lanjut.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-orange px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-orange-strong hover:shadow-lg hover:shadow-brand-orange/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
            >
              <IconWhatsApp />
              Chat via WhatsApp
            </a>
            <a
              href={EMAIL_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-brand-shell px-6 py-3 text-sm font-semibold text-brand-dark transition-all hover:-translate-y-0.5 hover:border-brand-orange hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Kirim Email
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
