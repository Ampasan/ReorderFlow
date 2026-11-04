import fs from 'node:fs'
import path from 'node:path'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { loadEnv } from 'vite'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { ARTICLES } from './src/pages/blog/blogContent.ts'

const BLOG_DESCRIPTION =
  'Panduan praktis untuk mengelola stok, menyiapkan PO, dan memanfaatkan ReorderFlow dalam operasional toko Anda.'
const FAQ_DESCRIPTION =
  'Jawaban singkat seputar cara kerja ReorderFlow, masa percobaan, dan biaya berlangganan.'
const ABOUT_DESCRIPTION =
  'Cerita, prinsip kerja, dan komitmen ReorderFlow untuk membantu UMKM mengelola persediaan dan pemesanan ulang.'

interface PageMeta {
  title: string
  description: string
  path: string
  image: string
  imageAlt?: string
  type: 'website' | 'article'
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function withMeta(html: string, meta: PageMeta, siteUrl: string): string {
  const url = `${siteUrl}${meta.path}`
  const replace = (current: string, pattern: RegExp, value: string) =>
    current.replace(
      pattern,
      (_match, start: string, end: string) => `${start}${escapeHtml(value)}${end}`,
    )

  let result = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
  result = replace(result, /(<meta\s+name="description"\s+content=")[^"]*("\s*\/?>)/, meta.description)
  result = replace(result, /(<link\s+rel="canonical"\s+href=")[^"]*("\s*\/?>)/, url)
  result = replace(result, /(<meta\s+property="og:type"\s+content=")[^"]*("\s*\/?>)/, meta.type)
  result = replace(result, /(<meta\s+property="og:title"\s+content=")[^"]*("\s*\/?>)/, meta.title)
  result = replace(result, /(<meta\s+property="og:description"\s+content=")[^"]*("\s*\/?>)/, meta.description)
  result = replace(result, /(<meta\s+property="og:url"\s+content=")[^"]*("\s*\/?>)/, url)
  result = replace(result, /(<meta\s+property="og:image"\s+content=")[^"]*("\s*\/?>)/, meta.image)
  result = replace(
    result,
    /(<meta\s+property="og:image:alt"\s+content=")[^"]*("\s*\/?>)/,
    meta.imageAlt ?? 'Logo ReorderFlow',
  )
  result = replace(result, /(<meta\s+name="twitter:title"\s+content=")[^"]*("\s*\/?>)/, meta.title)
  result = replace(result, /(<meta\s+name="twitter:description"\s+content=")[^"]*("\s*\/?>)/, meta.description)
  result = replace(result, /(<meta\s+name="twitter:image"\s+content=")[^"]*("\s*\/?>)/, meta.image)
  return result
}

function writeShell(distDir: string, template: string, meta: PageMeta, siteUrl: string) {
  const html = withMeta(template, meta, siteUrl)
  const target = meta.path === '/' ? distDir : path.join(distDir, meta.path.replace(/^\//, ''))
  fs.mkdirSync(target, { recursive: true })
  fs.writeFileSync(path.join(target, 'index.html'), html)
}

function seoIndexPlugin(siteUrl: string): Plugin {
  return {
    name: 'reorderflow-seo-index',
    transformIndexHtml(html) {
      return html.replaceAll('%SITE_URL%', siteUrl)
    },
  }
}

function seoBuildPlugin(siteUrl: string): Plugin {
  const base = siteUrl.replace(/\/+$/, '')

  return {
    name: 'reorderflow-seo-build',
    apply: 'build',
    closeBundle() {
      const routes = [
        { path: '/', priority: '1.0', changefreq: 'weekly' },
        { path: '/artikel', priority: '0.8', changefreq: 'weekly' },
        ...ARTICLES.map((article) => ({
          path: `/artikel/${article.slug}`,
          priority: '0.8',
          changefreq: 'monthly',
        })),
        { path: '/faq', priority: '0.6', changefreq: 'monthly' },
        { path: '/tentang', priority: '0.6', changefreq: 'monthly' },
      ]

      const urls = routes
        .map(({ path: route, priority, changefreq }) =>
          [
            '  <url>',
            `    <loc>${base}${route}</loc>`,
            `    <changefreq>${changefreq}</changefreq>`,
            `    <priority>${priority}</priority>`,
            '  </url>',
          ].join('\n'),
        )
        .join('\n')

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
      const robots = `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /app\nDisallow: /stok\nDisallow: /po-log\nDisallow: /login\n\nSitemap: ${base}/sitemap.xml\n`

      const distDir = path.resolve(process.cwd(), 'dist')
      fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap)
      fs.writeFileSync(path.join(distDir, 'robots.txt'), robots)

      const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8')
      const defaultImage = `${base}/logo-reorderflow.png`
      writeShell(
        distDir,
        template,
        {
          title: 'ReorderFlow - Dashboard Inventori',
          description:
            'ReorderFlow memantau stok, membuat draf purchase order per pemasok, dan mengirim PO setelah persetujuan manajer untuk toko grosir dan ritel UMKM.',
          path: '/',
          image: defaultImage,
          type: 'website',
        },
        base,
      )
      writeShell(
        distDir,
        template,
        {
          title: 'Artikel & Panduan | ReorderFlow',
          description: BLOG_DESCRIPTION,
          path: '/artikel',
          image: defaultImage,
          type: 'website',
        },
        base,
      )
      for (const article of ARTICLES) {
        writeShell(
          distDir,
          template,
          {
            title: `${article.title} | ReorderFlow`,
            description: article.metaDescription,
            path: `/artikel/${article.slug}`,
            image: article.imageUrl,
            imageAlt: article.imageAlt,
            type: 'article',
          },
          base,
        )
      }
      writeShell(
        distDir,
        template,
        {
          title: 'Pertanyaan yang Sering Diajukan | ReorderFlow',
          description: FAQ_DESCRIPTION,
          path: '/faq',
          image: defaultImage,
          type: 'website',
        },
        base,
      )
      writeShell(
        distDir,
        template,
        {
          title: 'Tentang ReorderFlow | ReorderFlow',
          description: ABOUT_DESCRIPTION,
          path: '/tentang',
          image: defaultImage,
          type: 'website',
        },
        base,
      )
    },
  }
}

const isVitest =
  Boolean(process.env.VITEST) ||
  process.env.NODE_ENV === 'test' ||
  process.argv.some((arg) => arg.includes('vitest'))

export default defineConfig(({ mode }) => {
  const env = loadEnv(isVitest ? 'test' : mode, process.cwd(), '')
  const configuredSiteUrl = (process.env.VITE_SITE_URL || env.VITE_SITE_URL || '').trim()
  const configuredApiBaseUrl = (process.env.VITE_API_BASE_URL || env.VITE_API_BASE_URL || '').trim()
  const siteUrl = (configuredSiteUrl || 'https://reorderflow.vercel.app').replace(/\/+$/, '')

  if (!isVitest) {
    if (!configuredSiteUrl) {
      console.warn('[build] VITE_SITE_URL kosong. Canonical, sitemap, dan Open Graph memakai domain fallback.')
    }
    if (!configuredApiBaseUrl) {
      console.warn('[build] VITE_API_BASE_URL kosong. Request API akan memakai origin frontend.')
    }
  }

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      seoIndexPlugin(siteUrl),
      seoBuildPlugin(siteUrl),
    ],
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      sourcemap: false,
      reportCompressedSize: true,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
              return 'react-vendor'
            }
            if (id.includes('node_modules/react-router')) {
              return 'router-vendor'
            }
            if (id.includes('node_modules/react-hot-toast')) {
              return 'toast-vendor'
            }
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['src/test/e2e/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/test/**',
          'src/main.tsx',
          'src/**/*.d.ts',
        ],
      },
    },
  }
})
