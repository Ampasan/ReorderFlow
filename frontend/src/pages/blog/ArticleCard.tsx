import { Link } from 'react-router-dom'
import type { Article } from './blogContent'

export function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-brand-shell/60 bg-white transition-colors duration-300 hover:border-brand-orange/40">
      <Link
        to={`/artikel/${article.slug}`}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
        aria-label={article.title}
      >
        <img
          src={article.imageUrl}
          alt={article.imageAlt}
          width={1200}
          height={675}
          loading="lazy"
          decoding="async"
          className="aspect-[16/9] w-full object-cover"
        />
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <h2 className="font-display text-xl font-bold leading-snug text-brand-dark">
          <Link
            to={`/artikel/${article.slug}`}
            className="transition-colors hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded"
          >
            {article.title}
          </Link>
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-brand-muted">{article.metaDescription}</p>
        <Link
          to={`/artikel/${article.slug}`}
          className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-brand-orange transition-colors hover:text-brand-orange-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded"
        >
          Baca artikel
        </Link>
      </div>
    </article>
  )
}
