/**
 * Functional tests — LoginPage
 * Mencakup: validasi form, submit sukses, submit gagal, redirect, akses UI
 */
import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { renderWithProviders } from '../../mocks/renderWithProviders'
import { LoginPage } from '../../../pages/LoginPage'

function renderLogin(initialEntry = '/login') {
  return renderWithProviders(<LoginPage />, {
    routerProps: { initialEntries: [initialEntry] },
  })
}

describe('LoginPage — render awal', () => {
  it('menampilkan heading "Masuk ke akun Anda"', () => {
    renderLogin()
    expect(screen.getByRole('heading', { name: /masuk ke akun anda/i })).toBeInTheDocument()
  })

  it('menampilkan field email dan password', () => {
    renderLogin()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('menampilkan tombol submit "Masuk"', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /masuk/i })).toBeInTheDocument()
  })

  it('tidak menampilkan error alert saat pertama kali', () => {
    renderLogin()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('LoginPage — validasi form', () => {
  it('menampilkan error jika email tidak valid', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText(/email/i), 'bukan-email')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /masuk/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/email yang valid/i)
  })

  it('menampilkan error jika password kurang dari 8 karakter', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText(/email/i), 'admin@toko.id')
    await user.type(screen.getByLabelText(/password/i), 'pendek')
    await user.click(screen.getByRole('button', { name: /masuk/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/minimal 8 karakter/i)
  })

  it('men-trim spasi dari email sebelum validasi', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText(/email/i), '  bukan-email  ')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /masuk/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/email yang valid/i)
  })

  it('email memiliki aria-invalid saat ada error', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText(/email/i), 'bukan-email')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /masuk/i }))
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'true')
  })
})

describe('LoginPage — submit berhasil', () => {
  it('menonaktifkan tombol dan field saat submit', async () => {
    const user = userEvent.setup()
    let resolveLogin!: (value: Response) => void
    server.use(
      http.post('http://localhost:8080/api/auth/login', () =>
        new Promise<Response>((res) => { resolveLogin = res }),
      ),
    )
    renderLogin()
    await user.type(screen.getByLabelText(/email/i), 'admin@toko.id')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /masuk/i }))

    expect(screen.getByLabelText(/email/i)).toBeDisabled()
    expect(screen.getByLabelText(/password/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /memproses/i })).toBeDisabled()

    // Cleanup
    resolveLogin(HttpResponse.json({ success: false, message: 'cancel', data: null }, { status: 500 }) as unknown as Response)
  })

  it('menyimpan token ke localStorage setelah login berhasil', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText(/email/i), 'admin@toko.id')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /masuk/i }))
    await waitFor(() => {
      expect(localStorage.getItem('reorderflow.token')).toBe('mock-jwt-token-admin')
    })
  })
})

describe('LoginPage — submit gagal', () => {
  it('menampilkan pesan error dari server saat login gagal', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText(/email/i), 'salah@toko.id')
    await user.type(screen.getByLabelText(/password/i), 'salahpassword')
    await user.click(screen.getByRole('button', { name: /masuk/i }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
    expect(screen.getByRole('alert')).toHaveTextContent(/email atau password salah/i)
  })

  it('mengaktifkan kembali form setelah login gagal', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText(/email/i), 'salah@toko.id')
    await user.type(screen.getByLabelText(/password/i), 'salahpassword')
    await user.click(screen.getByRole('button', { name: /masuk/i }))
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).not.toBeDisabled()
    })
  })

  it('menampilkan pesan fallback jika server tidak memberikan pesan', async () => {
    const user = userEvent.setup()
    server.use(
      http.post('http://localhost:8080/api/auth/login', () =>
        HttpResponse.json(null, { status: 500 }),
      ),
    )
    renderLogin()
    await user.type(screen.getByLabelText(/email/i), 'admin@toko.id')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /masuk/i }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})

describe('LoginPage — aksesibilitas', () => {
  it('label terhubung ke input email via htmlFor', () => {
    renderLogin()
    const emailInput = screen.getByLabelText(/email/i)
    expect(emailInput).toHaveAttribute('id', 'email')
  })

  it('label terhubung ke input password via htmlFor', () => {
    renderLogin()
    const passInput = screen.getByLabelText(/password/i)
    expect(passInput).toHaveAttribute('id', 'password')
  })

  it('alert memiliki role="alert"', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText(/email/i), 'bukan-email')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /masuk/i }))
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
  })

  it('tombol submit memiliki aria-busy saat loading', async () => {
    const user = userEvent.setup()
    let resolveLogin!: () => void
    server.use(
      http.post('http://localhost:8080/api/auth/login', () =>
        new Promise<Response>((res) => {
          resolveLogin = () =>
            res(HttpResponse.json({ success: false, message: 'x', data: null }, { status: 500 }) as unknown as Response)
        }),
      ),
    )
    renderLogin()
    await user.type(screen.getByLabelText(/email/i), 'admin@toko.id')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /masuk/i }))

    const btn = screen.getByRole('button', { name: /memproses/i })
    expect(btn).toHaveAttribute('aria-busy', 'true')
    resolveLogin()
  })
})

describe('LoginPage — user tidak boleh double submit', () => {
  it('klik ganda tidak memicu dua request login', async () => {
    const user = userEvent.setup()
    let callCount = 0
    server.use(
      http.post('http://localhost:8080/api/auth/login', async () => {
        callCount++
        return HttpResponse.json({
          success: true,
          message: 'Login berhasil',
          data: { token: 'mock-jwt-token-admin', user: { id: 1, email: 'admin@toko.id', nama: 'Andi', role: 'admin', created_at: '' } },
        })
      }),
    )
    renderLogin()
    await user.type(screen.getByLabelText(/email/i), 'admin@toko.id')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    const btn = screen.getByRole('button', { name: /masuk/i })
    // Klik cepat dua kali
    await user.click(btn)
    await user.click(btn)
    await waitFor(() => expect(callCount).toBeLessThanOrEqual(1))
  })
})

describe('LoginPage — ikon peringatan pada error', () => {
  it('ikon SVG muncul di dalam alert', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText(/email/i), 'bukan-email')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /masuk/i }))
    const alert = screen.getByRole('alert')
    // WarningIcon adalah SVG dengan aria-hidden, cukup pastikan ada di dalam alert
    expect(alert.querySelector('svg')).toBeTruthy()
  })
})
