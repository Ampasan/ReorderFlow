/**
 * Functional tests — ProtectedRoute
 * Menguji redirect ke /login jika tidak terautentikasi, dan render child jika terautentikasi
 */
import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders } from '../../mocks/renderWithProviders'
import { ProtectedRoute } from '../../../components/ProtectedRoute'
import { saveSession } from '../../../utils/authStorage'
import type { User } from '../../../types/auth'

const mockAdminUser: User = {
  id: 1,
  email: 'admin@toko.id',
  nama: 'Andi Pratama',
  role: 'admin',
  created_at: '2024-01-01T00:00:00Z',
}

function AppWithProtectedRoute() {
  return (
    <Routes>
      <Route path="/login" element={<div data-testid="login-page">Halaman Login</div>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<div data-testid="protected-page">Dashboard</div>} />
      </Route>
    </Routes>
  )
}

describe('ProtectedRoute — tidak terautentikasi', () => {
  it('redirect ke /login jika tidak ada sesi', async () => {
    renderWithProviders(<AppWithProtectedRoute />, {
      routerProps: { initialEntries: ['/app'] },
    })
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })

  it('tidak merender halaman yang dilindungi jika anonim', () => {
    renderWithProviders(<AppWithProtectedRoute />, {
      routerProps: { initialEntries: ['/app'] },
    })
    expect(screen.queryByTestId('protected-page')).toBeNull()
  })
})

describe('ProtectedRoute — terautentikasi', () => {
  it('merender halaman dilindungi jika ada sesi valid', async () => {
    saveSession('mock-jwt-token-admin', mockAdminUser)
    renderWithProviders(<AppWithProtectedRoute />, {
      routerProps: { initialEntries: ['/app'] },
    })
    await waitFor(() => {
      expect(screen.getByTestId('protected-page')).toBeInTheDocument()
    })
  })

  it('tidak redirect ke login jika sudah terautentikasi', async () => {
    saveSession('mock-jwt-token-admin', mockAdminUser)
    renderWithProviders(<AppWithProtectedRoute />, {
      routerProps: { initialEntries: ['/app'] },
    })
    await waitFor(() => {
      expect(screen.queryByTestId('login-page')).toBeNull()
    })
  })
})

describe('ProtectedRoute — status loading', () => {
  it('akhirnya merender halaman terlindungi setelah token diverifikasi', async () => {
    saveSession('mock-jwt-token-admin', mockAdminUser)
    renderWithProviders(<AppWithProtectedRoute />, {
      routerProps: { initialEntries: ['/app'] },
    })
    await waitFor(() => {
      expect(screen.getByTestId('protected-page')).toBeInTheDocument()
    })
  })
})
