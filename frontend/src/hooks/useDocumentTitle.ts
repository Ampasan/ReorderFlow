import { useEffect } from 'react'
import { SITE_DESCRIPTION, SITE_URL } from '../utils/schema'

interface DocumentTitleOptions {
  description?: string
  noIndex?: boolean
  image?: string
  imageAlt?: string
  type?: 'website' | 'article'
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string): void {
  let meta = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(attribute, key)
    document.head.appendChild(meta)
  }
  meta.content = content
}

function upsertCanonical(href: string): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = href
}

function absoluteUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value
  return `${SITE_URL}${value.startsWith('/') ? value : `/${value}`}`
}

export function useDocumentTitle(title: string, options: DocumentTitleOptions = {}) {
  useEffect(() => {
    const description = options.description ?? SITE_DESCRIPTION
    const image = absoluteUrl(options.image ?? '/logo-reorderflow.png')
    const path = window.location.pathname
    const canonical = `${SITE_URL}${path === '/' ? '/' : path}`

    document.title = title
    upsertMeta('name', 'description', description)
    upsertMeta('property', 'og:type', options.type ?? 'website')
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('property', 'og:image', image)
    upsertMeta('property', 'og:image:alt', options.imageAlt ?? 'Logo ReorderFlow')
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:image', image)
    upsertMeta(
      'name',
      'robots',
      options.noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    )
    upsertCanonical(canonical)
  }, [title, options.description, options.noIndex, options.image, options.imageAlt, options.type])
}
