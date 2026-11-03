type JsonLdNode = Record<string, unknown>

interface FaqEntry {
  question: string
  answer: string
}

interface ArticleEntry {
  slug: string
  title: string
  metaDescription: string
  imageUrl: string
}

const configuredSiteUrl = import.meta.env.VITE_SITE_URL
const runtimeOrigin = typeof window === 'undefined' ? '' : window.location.origin

export const SITE_URL = (configuredSiteUrl ?? runtimeOrigin).replace(/\/+$/, '')
export const SITE_NAME = 'ReorderFlow'
export const SITE_LANGUAGE = 'id-ID'
export const SITE_DESCRIPTION =
  'ReorderFlow memantau stok, membuat draf purchase order per pemasok, dan mengirim PO setelah persetujuan manajer untuk toko grosir dan ritel UMKM.'

const ORGANIZATION_ID = `${SITE_URL}/#organization`
const WEBSITE_ID = `${SITE_URL}/#website`
const LOGO_URL = `${SITE_URL}/logo-reorderflow.png`

function absolute(path: string) {
  if (path === '/') return `${SITE_URL}/`
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function organizationSchema(): JsonLdNode {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE_NAME,
    url: absolute('/'),
    logo: {
      '@type': 'ImageObject',
      url: LOGO_URL,
    },
    description: SITE_DESCRIPTION,
    email: 'n.rakan.r.2005@gmail.com',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        telephone: '+6287723305893',
        email: 'n.rakan.r.2005@gmail.com',
        availableLanguage: ['id'],
      },
    ],
  }
}

export function websiteSchema(): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: absolute('/'),
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: SITE_LANGUAGE,
    publisher: {
      '@id': ORGANIZATION_ID,
    },
  }
}

export function softwareApplicationSchema(): JsonLdNode {
  return {
    '@type': 'SoftwareApplication',
    '@id': `${SITE_URL}/#software`,
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Inventory Management Software',
    operatingSystem: 'Web',
    url: absolute('/'),
    description: SITE_DESCRIPTION,
    inLanguage: SITE_LANGUAGE,
    publisher: {
      '@id': ORGANIZATION_ID,
    },
    featureList: [
      'Pemantauan stok berdasarkan batas minimum',
      'Pembuatan draf PO otomatis per pemasok',
      'Persetujuan PO oleh manajer melalui email',
      'Pengiriman PO ke pemasok setelah disetujui',
      'Pelacakan status dan riwayat PO',
    ],
    offers: [
      {
        '@type': 'Offer',
        name: 'Free Trial',
        price: '0',
        priceCurrency: 'IDR',
        description: 'Gratis 30 hari dengan batas maksimal 500 SKU, 10 pemasok, dan 15 pesanan.',
        url: absolute('/#harga'),
      },
      {
        '@type': 'Offer',
        name: 'Standard Bulanan',
        price: '149000',
        priceCurrency: 'IDR',
        description: 'Paket Standard dengan pembayaran bulanan untuk penggunaan rutin.',
        url: absolute('/#harga'),
      },
      {
        '@type': 'Offer',
        name: 'Standard Tahunan',
        price: '1490000',
        priceCurrency: 'IDR',
        description: 'Paket Standard dengan pembayaran tahunan.',
        url: absolute('/#harga'),
      },
    ],
  }
}

export function webPageSchema(
  type: 'WebPage' | 'AboutPage' | 'FAQPage',
  path: string,
  name: string,
  description: string,
): JsonLdNode {
  const url = absolute(path)

  return {
    '@type': type,
    '@id': `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: SITE_LANGUAGE,
    isPartOf: {
      '@id': WEBSITE_ID,
    },
    publisher: {
      '@id': ORGANIZATION_ID,
    },
  }
}

export function breadcrumbSchema(
  path: string,
  items: { name: string; path: string }[],
): JsonLdNode {
  const url = absolute(path)

  return {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  }
}

export function faqPageSchema(path: string, items: FaqEntry[]): JsonLdNode {
  const url = absolute(path)

  return {
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    url,
    inLanguage: SITE_LANGUAGE,
    isPartOf: {
      '@id': WEBSITE_ID,
    },
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

export function blogSchema(path: string, articles: ArticleEntry[]): JsonLdNode {
  const url = absolute(path)

  return {
    '@type': 'Blog',
    '@id': `${url}#blog`,
    url,
    name: 'Artikel & Panduan | ReorderFlow',
    description:
      'Panduan praktis untuk mengelola stok, menyiapkan PO, dan memanfaatkan ReorderFlow dalam operasional toko Anda.',
    inLanguage: SITE_LANGUAGE,
    publisher: {
      '@id': ORGANIZATION_ID,
    },
    blogPost: articles.map((article) => ({
      '@type': 'BlogPosting',
      headline: article.title,
      description: article.metaDescription,
      image: article.imageUrl,
      url: absolute(`/artikel/${article.slug}`),
    })),
  }
}

export function blogPostingSchema(article: ArticleEntry): JsonLdNode {
  const url = absolute(`/artikel/${article.slug}`)

  return {
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: article.title,
    description: article.metaDescription,
    image: [article.imageUrl],
    url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    inLanguage: SITE_LANGUAGE,
    author: {
      '@id': ORGANIZATION_ID,
    },
    publisher: {
      '@id': ORGANIZATION_ID,
    },
  }
}

export function graph(...nodes: JsonLdNode[]): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes,
  }
}
