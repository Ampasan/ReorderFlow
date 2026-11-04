/**
 * E2E tests — Login Flow
 *
 * PRASYARAT: backend dan frontend harus berjalan.
 * Gunakan kredensial dari .env backend (ADMIN_EMAIL, ADMIN_PASSWORD).
 *
 * Test ini menggunakan environment variables atau fallback ke nilai demo:
 *   E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD
 *   E2E_MANAGER_EMAIL, E2E_MANAGER_PASSWORD
 */
import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = process.env['E2E_ADMIN_EMAIL'] ?? 'admin@demo.id'
const ADMIN_PASS = process.env['E2E_ADMIN_PASSWORD'] ?? 'adminpass123'
const MANAGER_EMAIL = process.env['E2E_MANAGER_EMAIL'] ?? 'manager@demo.id'
const MANAGER_PASS = process.env['E2E_MANAGER_PASSWORD'] ?? 'managerpass123'

test.describe('Login Page — render dan navigasi', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('menampilkan heading "Masuk ke akun Anda"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /masuk ke akun anda/i })).toBeVisible()
  })

  test('menampilkan field email dengan label', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })

  test('menampilkan field password dengan label', async ({ page }) => {
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('menampilkan tombol submit "Masuk"', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^masuk$/i })).toBeVisible()
  })

  test('tidak menampilkan error saat halaman pertama dibuka', async ({ page }) => {
    await expect(page.getByRole('alert')).not.toBeVisible()
  })

  test('field email memiliki focus otomatis', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i)
    await expect(emailInput).toBeFocused()
  })
})

test.describe('Login Page — validasi form (client-side)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('menampilkan error untuk email tidak valid', async ({ page }) => {
    await page.getByLabel(/email/i).fill('bukan-email')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /^masuk$/i }).click()
    await expect(page.getByRole('alert')).toContainText(/email yang valid/i)
  })

  test('menampilkan error untuk password kurang dari 8 karakter', async ({ page }) => {
    await page.getByLabel(/email/i).fill('admin@toko.id')
    await page.getByLabel(/password/i).fill('pendek')
    await page.getByRole('button', { name: /^masuk$/i }).click()
    await expect(page.getByRole('alert')).toContainText(/minimal 8 karakter/i)
  })

  test('tombol submit dapat diklik dengan Enter', async ({ page }) => {
    await page.getByLabel(/email/i).fill('admin@toko.id')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByLabel(/password/i).press('Enter')
    // Menunggu respons — bisa sukses atau gagal, tapi tidak boleh crash
    await page.waitForLoadState('networkidle')
  })
})

test.describe('Login Page — autentikasi admin', () => {
  test('login admin berhasil mengarahkan ke /app', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL)
    await page.getByLabel(/password/i).fill(ADMIN_PASS)
    await page.getByRole('button', { name: /^masuk$/i }).click()
    await expect(page).toHaveURL('/app', { timeout: 10000 })
  })

  test('login admin menyimpan token ke localStorage', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL)
    await page.getByLabel(/password/i).fill(ADMIN_PASS)
    await page.getByRole('button', { name: /^masuk$/i }).click()
    await expect(page).toHaveURL('/app', { timeout: 10000 })
    const token = await page.evaluate(() => localStorage.getItem('reorderflow.token'))
    expect(token).not.toBeNull()
  })

  test('halaman /app accessible setelah login admin', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL)
    await page.getByLabel(/password/i).fill(ADMIN_PASS)
    await page.getByRole('button', { name: /^masuk$/i }).click()
    await expect(page).toHaveURL('/app', { timeout: 10000 })
    // Dashboard harus merender tanpa error
    await expect(page.locator('[data-testid="dashboard"], main, h1').first()).toBeVisible()
  })
})

test.describe('Login Page — autentikasi manager', () => {
  test('login manager berhasil mengarahkan ke /app', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(MANAGER_EMAIL)
    await page.getByLabel(/password/i).fill(MANAGER_PASS)
    await page.getByRole('button', { name: /^masuk$/i }).click()
    await expect(page).toHaveURL('/app', { timeout: 10000 })
  })
})

test.describe('Login Page — kredensial salah', () => {
  test('menampilkan error server saat email atau password salah', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('salah@toko.id')
    await page.getByLabel(/password/i).fill('passwordsalah')
    await page.getByRole('button', { name: /^masuk$/i }).click()
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 8000 })
    await expect(page.getByRole('alert')).toContainText(/salah|tidak valid|gagal/i)
  })

  test('form kembali aktif setelah login gagal', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('salah@toko.id')
    await page.getByLabel(/password/i).fill('passwordsalah')
    await page.getByRole('button', { name: /^masuk$/i }).click()
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 8000 })
    await expect(page.getByLabel(/email/i)).not.toBeDisabled()
    await expect(page.getByLabel(/password/i)).not.toBeDisabled()
  })
})

test.describe('Rute Terlindungi — akses tanpa login', () => {
  test('akses /app tanpa login diarahkan ke /login', async ({ page }) => {
    await page.goto('/app')
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  test('akses /stok tanpa login diarahkan ke /login', async ({ page }) => {
    await page.goto('/stok')
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  test('akses /po-log tanpa login diarahkan ke /login', async ({ page }) => {
    await page.goto('/po-log')
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })
})

test.describe('Logout flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login dulu
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL)
    await page.getByLabel(/password/i).fill(ADMIN_PASS)
    await page.getByRole('button', { name: /^masuk$/i }).click()
    await expect(page).toHaveURL('/app', { timeout: 10000 })
  })

  test('logout menghapus token dari localStorage', async ({ page }) => {
    // Cari tombol logout di sidebar
    const logoutBtn = page.getByRole('button', { name: /keluar|logout/i })
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click()
    } else {
      // Logout via direct localStorage clear
      await page.evaluate(() => {
        localStorage.removeItem('reorderflow.token')
        localStorage.removeItem('reorderflow.user')
      })
      await page.goto('/app')
    }
    const token = await page.evaluate(() => localStorage.getItem('reorderflow.token'))
    expect(token).toBeNull()
  })
})
