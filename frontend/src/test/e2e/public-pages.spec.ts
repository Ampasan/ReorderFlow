/**
 * E2E tests — Halaman Publik (tanpa autentikasi)
 * Mencakup: landing, blog, faq, tentang, dan navigasi
 */
import { test, expect } from '@playwright/test'

test.describe('Halaman Landing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('memuat halaman tanpa error', async ({ page }) => {
    await expect(page).not.toHaveURL(/error/i)
    await expect(page.locator('body')).toBeVisible()
  })

  test('memiliki judul halaman yang relevan', async ({ page }) => {
    await expect(page).toHaveTitle(/reorderflow/i)
  })

  test('memiliki link navigasi ke /login', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /masuk|login|dashboard/i }).first()
    await expect(loginLink).toBeVisible()
  })

  test('memiliki link ke halaman Artikel', async ({ page }) => {
    const artikelLink = page.getByRole('link', { name: /artikel/i }).first()
    await expect(artikelLink).toBeVisible()
  })

  test('memiliki link ke halaman FAQ', async ({ page }) => {
    const faqLink = page.getByRole('link', { name: /faq/i }).first()
    await expect(faqLink).toBeVisible()
  })
})

test.describe('Halaman Blog/Artikel', () => {
  test('memuat daftar artikel', async ({ page }) => {
    await page.goto('/artikel')
    await expect(page).not.toHaveURL(/error/i)
    await expect(page.locator('body')).toBeVisible()
  })

  test('memiliki judul halaman', async ({ page }) => {
    await page.goto('/artikel')
    await expect(page).toHaveTitle(/.+/)
  })
})

test.describe('Halaman FAQ', () => {
  test('memuat halaman FAQ', async ({ page }) => {
    await page.goto('/faq')
    await expect(page.locator('body')).toBeVisible()
  })

  test('memiliki konten FAQ', async ({ page }) => {
    await page.goto('/faq')
    // Halaman harus memuat konten FAQ
    await expect(page.locator('main, article, section').first()).toBeVisible()
  })
})

test.describe('Halaman Tentang', () => {
  test('memuat halaman Tentang', async ({ page }) => {
    await page.goto('/tentang')
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Navigasi — rute tidak ditemukan', () => {
  test('rute tidak dikenal diarahkan ke halaman landing', async ({ page }) => {
    await page.goto('/halaman-tidak-ada-xyzabc')
    // App memakai <Navigate to="/" replace /> untuk rute tidak dikenal
    await expect(page).toHaveURL('/')
  })
})

test.describe('SEO dan metadata', () => {
  test('halaman landing memiliki meta description', async ({ page }) => {
    await page.goto('/')
    const metaDesc = page.locator('meta[name="description"]')
    const content = await metaDesc.getAttribute('content')
    expect(content).toBeTruthy()
    expect(content!.length).toBeGreaterThan(10)
  })

  test('halaman login memiliki meta noindex', async ({ page }) => {
    await page.goto('/login')
    const metaRobots = page.locator('meta[name="robots"]')
    const content = await metaRobots.getAttribute('content')
    expect(content).toContain('noindex')
  })
})
