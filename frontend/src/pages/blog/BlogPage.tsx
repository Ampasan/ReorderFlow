import { useEffect } from 'react'
import { JsonLd } from '../../components/JsonLd'
import {
  blogSchema,
  breadcrumbSchema,
  graph,
  organizationSchema,
  webPageSchema,
  websiteSchema,
} from '../../utils/schema'
import { LandingFooter } from '../landing/LandingFooter'
import { MarketingNav } from '../landing/MarketingNav'
import { ArticleCard } from './ArticleCard'
import { ARTICLES } from './blogContent'

const BLOG_DESCRIPTION =
  'Panduan praktis untuk mengelola stok, menyiapkan PO, dan memanfaatkan ReorderFlow dalam operasional toko Anda.'

const BLOG_JSON_LD = graph(
  organizationSchema(),
  websiteSchema(),
  webPageSchema('WebPage', '/artikel', 'Artikel & Panduan | ReorderFlow', BLOG_DESCRIPTION),
  blogSchema('/artikel', ARTICLES),
  breadcrumbSchema('/artikel', [
    { name: 'Beranda', path: '/' },
    { name: 'Artikel', path: '/artikel' },
  ]),
)

export function BlogPage() {
  useEffect(() => {
    document.title = 'Artikel & Panduan | ReorderFlow'
  }, [])

  return (
    <div className="min-h-screen bg-brand-cream font-sans text-brand-dark">
      <JsonLd data={BLOG_JSON_LD} />
      <MarketingNav />

      <main>
        <section className="border-b border-brand-shell/40 bg-brand-cream py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-[-0.02em] text-brand-dark sm:text-4xl">
              Artikel &amp; Panduan
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-brand-muted">
              Panduan praktis untuk mengelola stok, menyiapkan PO, dan memanfaatkan ReorderFlow dalam
              operasional toko Anda.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {ARTICLES.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
