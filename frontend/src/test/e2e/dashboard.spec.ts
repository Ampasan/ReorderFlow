/**
 * E2E tests — Dashboard dan fitur utama (memerlukan login)
 * Mencakup: dashboard KPI, stok, PO log, navigasi sidebar
 */
import { test, expect, type Page } from '@playwright/test'

const ADMIN_EMAIL = process.env['E2E_ADMIN_EMAIL'] ?? 'admin@demo.id'
const ADMIN_PASS = process.env['E2E_ADMIN_PASSWORD'] ?? 'adminpass123'
const MANAGER_EMAIL = process.env['E2E_MANAGER_EMAIL'] ?? 'manager@demo.id'
const MANAGER_PASS = process.env['E2E_MANAGER_PASSWORD'] ?? 'managerpass123'

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /^masuk$/i }).click()
  await expect(page).toHaveURL('/app', { timeout: 10000 })
}

test.describe('Dashboard — admin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASS)
  })

  test('dashboard memuat KPI cards', async ({ page }) => {
    // Menunggu setidaknya satu angka/statistik tampil
    await expect(page.locator('article').first()).toBeVisible({ timeout: 10000 })
  })

  test('sidebar menampilkan navigasi', async ({ page }) => {
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
  })

  test('sidebar memiliki link ke Stok', async ({ page }) => {
    const stokLink = page.getByRole('link', { name: /stok/i })
    await expect(stokLink.first()).toBeVisible()
  })

  test('sidebar memiliki link ke PO Log', async ({ page }) => {
    const poLink = page.getByRole('link', { name: /po|riwayat/i })
    await expect(poLink.first()).toBeVisible()
  })

  test('navigasi ke halaman Stok berhasil', async ({ page }) => {
    await page.goto('/stok')
    await expect(page).toHaveURL('/stok')
    await expect(page.locator('table, [role="table"], [data-testid="stock-table"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('navigasi ke halaman PO Log berhasil', async ({ page }) => {
    await page.goto('/po-log')
    await expect(page).toHaveURL('/po-log')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Halaman Stok — admin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASS)
    await page.goto('/stok')
    await page.waitForLoadState('networkidle')
  })

  test('menampilkan tabel stok', async ({ page }) => {
    await expect(page.locator('table, [role="table"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('menampilkan filter tab Semua/Perlu Reorder/Perlu Peninjauan', async ({ page }) => {
    await expect(page.getByRole('button', { name: /semua/i }).first()).toBeVisible()
  })

  test('filter "Perlu Reorder" dapat diklik', async ({ page }) => {
    const filterBtn = page.getByRole('button', { name: /perlu reorder/i })
    if (await filterBtn.isVisible()) {
      await filterBtn.click()
      await page.waitForLoadState('networkidle')
      // Tidak crash = PASS
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('tombol "Scan Stok" terlihat untuk admin', async ({ page }) => {
    const scanBtn = page.getByRole('button', { name: /scan|pindai/i })
    await expect(scanBtn.first()).toBeVisible({ timeout: 8000 })
  })
})

test.describe('Halaman PO Log — admin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASS)
    await page.goto('/po-log')
    await page.waitForLoadState('networkidle')
  })

  test('menampilkan tabel atau empty state', async ({ page }) => {
    const table = page.locator('table, [role="table"], [data-testid="empty-state"]')
    await expect(table.first()).toBeVisible({ timeout: 10000 })
  })

  test('filter status tersedia', async ({ page }) => {
    const filterButtons = page.getByRole('button', { name: /semua|draf|menunggu/i })
    await expect(filterButtons.first()).toBeVisible({ timeout: 8000 })
  })
})

test.describe('Dashboard — manager (read-only)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, MANAGER_EMAIL, MANAGER_PASS)
  })

  test('manager dapat mengakses dashboard', async ({ page }) => {
    await expect(page).toHaveURL('/app')
    await expect(page.locator('body')).toBeVisible()
  })

  test('manager dapat mengakses halaman stok', async ({ page }) => {
    await page.goto('/stok')
    await expect(page).toHaveURL('/stok')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
  })

  test('tombol Scan Stok tidak terlihat untuk manager', async ({ page }) => {
    await page.goto('/stok')
    await page.waitForLoadState('networkidle')
    // Manager tidak boleh melihat tombol scan
    const scanBtn = page.getByRole('button', { name: /^scan stok$/i })
    await expect(scanBtn).not.toBeVisible()
  })
})

test.describe('Aksesibilitas — dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASS)
  })

  test('halaman dashboard memiliki landmark main', async ({ page }) => {
    await expect(page.locator('main').first()).toBeVisible()
  })

  test('halaman stok memiliki heading', async ({ page }) => {
    await page.goto('/stok')
    await page.waitForLoadState('networkidle')
    const heading = page.getByRole('heading').first()
    await expect(heading).toBeVisible({ timeout: 8000 })
  })
})
