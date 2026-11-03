import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { JsonLd } from '../../components/JsonLd'
import {
  breadcrumbSchema,
  faqPageSchema,
  graph,
  organizationSchema,
  webPageSchema,
  websiteSchema,
} from '../../utils/schema'
import { LandingFooter } from '../landing/LandingFooter'
import { MarketingNav } from '../landing/MarketingNav'
import { FAQ_ITEMS } from '../blog/blogContent'

const FAQ_DESCRIPTION =
  'Jawaban singkat seputar cara kerja ReorderFlow, masa percobaan, dan biaya berlangganan.'

const FAQ_JSON_LD = graph(
  organizationSchema(),
  websiteSchema(),
  webPageSchema('WebPage', '/faq', 'Pertanyaan yang Sering Diajukan | ReorderFlow', FAQ_DESCRIPTION),
  faqPageSchema('/faq', FAQ_ITEMS),
  breadcrumbSchema('/faq', [
    { name: 'Beranda', path: '/' },
    { name: 'FAQ', path: '/faq' },
  ]),
)

export function FaqPage() {
  useEffect(() => {
    document.title = 'Pertanyaan yang Sering Diajukan | ReorderFlow'
  }, [])

  return (
    <div className="min-h-screen bg-brand-cream font-sans text-brand-dark">
      <JsonLd data={FAQ_JSON_LD} />
      <MarketingNav />

      <main>
        <section className="border-b border-brand-shell/40 bg-brand-cream py-12 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-[-0.02em] text-brand-dark sm:text-4xl">
              Pertanyaan yang Sering Diajukan
            </h1>
            <p className="mt-4 text-base leading-relaxed text-brand-muted">
              Jawaban singkat seputar cara kerja ReorderFlow, masa percobaan, dan biaya berlangganan.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-brand-shell/60 bg-white transition-colors hover:border-brand-orange/40"
              >
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-display text-sm font-semibold text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 sm:text-base">
                  <span>{item.question}</span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    className="shrink-0 text-brand-orange transition-transform duration-200 group-open:rotate-180"
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-brand-muted sm:text-base">{item.answer}</p>
              </details>
            ))}
          </div>

          <div className="mt-10 rounded-2xl bg-brand-dark p-6 sm:p-8">
            <p className="font-display text-lg font-bold text-white">
              Masih ada pertanyaan lain?
            </p>
            <p className="mt-2 text-sm leading-relaxed text-brand-shell/90">
              Hubungi kami lewat WhatsApp atau lihat panduan artikel untuk mulai menggunakan ReorderFlow.
            </p>
            <Link
              to="/artikel"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-orange px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
            >
              Baca Artikel &amp; Panduan
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
