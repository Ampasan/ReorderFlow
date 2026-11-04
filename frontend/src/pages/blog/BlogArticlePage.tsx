import { Link, useParams } from 'react-router-dom'
import { JsonLd } from '../../components/JsonLd'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import {
  blogPostingSchema,
  breadcrumbSchema,
  graph,
  organizationSchema,
  webPageSchema,
  websiteSchema,
} from '../../utils/schema'
import { LandingFooter } from '../landing/LandingFooter'
import { MarketingNav } from '../landing/MarketingNav'
import { ArticleBody } from './ArticleBody'
import { ArticleCard } from './ArticleCard'
import { ARTICLES } from './blogContent'

export function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const article = ARTICLES.find((item) => item.slug === slug)

  useDocumentTitle(article ? `${article.title} | ReorderFlow` : 'Artikel tidak ditemukan | ReorderFlow')

  if (!article) {
    return (
      <div className="min-h-screen bg-brand-cream font-sans text-brand-dark">
        <MarketingNav />
        <main className="mx-auto flex max-w-3xl flex-col items-start px-4 py-20 sm:px-6">
          <h1 className="font-display text-3xl font-extrabold text-brand-dark">Artikel tidak ditemukan</h1>
          <p className="mt-4 text-base text-brand-muted">
            Halaman yang Anda cari tidak tersedia atau tautannya sudah berubah.
          </p>
          <Link
            to="/artikel"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-orange px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
          >
            Lihat semua artikel
          </Link>
        </main>
        <LandingFooter />
      </div>
    )
  }

  const otherArticles = ARTICLES.filter((item) => item.slug !== article.slug)
  const articlePath = `/artikel/${article.slug}`
  const articleJsonLd = graph(
    organizationSchema(),
    websiteSchema(),
    webPageSchema(
      'WebPage',
      articlePath,
      `${article.title} | ReorderFlow`,
      article.metaDescription,
    ),
    blogPostingSchema(article),
    breadcrumbSchema(articlePath, [
      { name: 'Beranda', path: '/' },
      { name: 'Artikel', path: '/artikel' },
      { name: article.title, path: articlePath },
    ]),
  )

  return (
    <div className="min-h-screen bg-brand-cream font-sans text-brand-dark">
      <JsonLd data={articleJsonLd} />
      <MarketingNav />

      <main>
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <Link
            to="/artikel"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-orange transition-colors hover:text-brand-orange-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded"
          >
            Kembali ke semua artikel
          </Link>

          <h1 className="mt-6 font-display text-3xl font-extrabold leading-tight tracking-[-0.02em] text-brand-dark sm:text-4xl">
            {article.title}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-brand-muted">{article.metaDescription}</p>

          <img
            src={article.imageUrl}
            alt={article.imageAlt}
            className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover"
          />

          <ArticleBody blocks={article.blocks} />
        </article>

        <section className="border-t border-brand-shell/40 bg-white/40">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <h2 className="font-display text-2xl font-bold text-brand-dark">Artikel lainnya</h2>
            <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {otherArticles.map((item) => (
                <ArticleCard key={item.slug} article={item} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
