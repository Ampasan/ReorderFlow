/**
 * Functional tests — lapisan API client (src/services/api.ts)
 * Menguji behaviour: header auth, timeout, error handling, dsb.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { ApiError } from '../../../types/api'
import { saveSession, clearSession } from '../../../utils/authStorage'
import { get, post, patch, put } from '../../../services/api'
import type { User } from '../../../types/auth'

const BASE = 'http://localhost:8080'

const mockUser: User = {
  id: 1,
  email: 'admin@toko.id',
  nama: 'Andi Pratama',
  role: 'admin',
  created_at: '2024-01-01T00:00:00Z',
}

describe('API Client — get()', () => {
  beforeEach(() => clearSession())

  it('melakukan GET request dan mengembalikan data', async () => {
    saveSession('mock-jwt-token-admin', mockUser)
    const authed = await get<typeof mockUser>('/api/auth/me')
    expect(authed.email).toBe('admin@toko.id')
  })

  it('menyertakan Authorization header jika ada token', async () => {
    saveSession('mock-jwt-token-admin', mockUser)
    let capturedAuth = ''
    server.use(
      http.get(`${BASE}/api/auth/me`, ({ request }) => {
        capturedAuth = request.headers.get('Authorization') ?? ''
        return HttpResponse.json({ success: true, message: 'OK', data: mockUser })
      }),
    )
    await get('/api/auth/me')
    expect(capturedAuth).toBe('Bearer mock-jwt-token-admin')
  })

  it('tidak menyertakan Authorization header jika tidak ada token', async () => {
    let capturedAuth: string | null = 'not-checked'
    server.use(
      http.get(`${BASE}/api/stok`, ({ request }) => {
        capturedAuth = request.headers.get('Authorization')
        return HttpResponse.json({ success: true, message: 'OK', data: [] })
      }),
    )
    await get('/api/stok')
    expect(capturedAuth).toBeNull()
  })

  it('menyertakan Accept: application/json header', async () => {
    let acceptHeader = ''
    server.use(
      http.get(`${BASE}/api/stok`, ({ request }) => {
        acceptHeader = request.headers.get('Accept') ?? ''
        return HttpResponse.json({ success: true, message: 'OK', data: [] })
      }),
    )
    await get('/api/stok')
    expect(acceptHeader).toBe('application/json')
  })

  it('melempar ApiError saat server mengembalikan 404', async () => {
    server.use(
      http.get(`${BASE}/api/stok`, () =>
        HttpResponse.json({ success: false, message: 'Tidak ditemukan', data: null }, { status: 404 }),
      ),
    )
    await expect(get('/api/stok')).rejects.toThrow(ApiError)
  })

  it('ApiError status cocok dengan HTTP status code', async () => {
    server.use(
      http.get(`${BASE}/api/stok`, () =>
        HttpResponse.json({ success: false, message: 'Server Error', data: null }, { status: 500 }),
      ),
    )
    try {
      await get('/api/stok')
      expect.fail('seharusnya melempar error')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).status).toBe(500)
    }
  })
})

describe('API Client — post()', () => {
  it('melakukan POST dan mengembalikan data', async () => {
    const result = await post<{ token: string; user: typeof mockUser }>(
      '/api/auth/login',
      { email: 'admin@toko.id', password: 'password123' },
    )
    expect(result.token).toBe('mock-jwt-token-admin')
    expect(result.user.email).toBe('admin@toko.id')
  })

  it('menyertakan Content-Type: application/json jika ada body', async () => {
    let contentType = ''
    server.use(
      http.post(`${BASE}/api/stok/scan`, ({ request }) => {
        contentType = request.headers.get('Content-Type') ?? ''
        return HttpResponse.json({ success: true, message: 'OK', data: {} })
      }),
    )
    saveSession('mock-jwt-token-admin', mockUser)
    // Kirim body agar api.ts menyertakan Content-Type
    await post('/api/stok/scan', {})
    expect(contentType).toContain('application/json')
  })

  it('melempar ApiError 401 untuk login dengan kredensial salah', async () => {
    try {
      await post('/api/auth/login', { email: 'salah@toko.id', password: 'wrong' })
      expect.fail('seharusnya melempar error')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).status).toBe(401)
    }
  })
})

describe('API Client — patch()', () => {
  it('melakukan PATCH request dan mengembalikan data', async () => {
    saveSession('mock-jwt-token-admin', mockUser)
    const result = await patch<{ sku: string; stok_saat_ini: number }>('/api/stok/BRS-001', {
      stok_saat_ini: 50,
      alasan: 'MISCOUNT',
    })
    expect(result.sku).toBe('BRS-001')
    expect(result.stok_saat_ini).toBe(50)
  })
})

describe('API Client — put()', () => {
  it('melakukan PUT request dan mengembalikan data', async () => {
    saveSession('mock-jwt-token-admin', mockUser)
    const payload = { details: [{ sku: 'BRS-001', jumlah_order: 60 }] }
    const result = await put('/api/po-draft/1', payload)
    expect(result).toBeDefined()
  })
})

describe('API Client — 401 unauthorized event', () => {
  it('mengirim custom event reorderflow:unauthorized saat menerima 401 (bukan login)', async () => {
    saveSession('expired-token', mockUser)
    server.use(
      http.get(`${BASE}/api/stok`, () =>
        HttpResponse.json({ success: false, message: 'Token expired', data: null }, { status: 401 }),
      ),
    )
    const handler = vi.fn()
    window.addEventListener('reorderflow:unauthorized', handler)
    try {
      await get('/api/stok')
    } catch {
      // expected
    }
    window.removeEventListener('reorderflow:unauthorized', handler)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('tidak mengirim unauthorized event saat login gagal dengan 401', async () => {
    const handler = vi.fn()
    window.addEventListener('reorderflow:unauthorized', handler)
    try {
      await post('/api/auth/login', { email: 'wrong@toko.id', password: 'wrong' })
    } catch {
      // expected
    }
    window.removeEventListener('reorderflow:unauthorized', handler)
    expect(handler).not.toHaveBeenCalled()
  })
})

describe('API Client — query params', () => {
  it('menambahkan query string ke URL', async () => {
    let requestUrl = ''
    server.use(
      http.get(`${BASE}/api/stok`, ({ request }) => {
        requestUrl = request.url
        return HttpResponse.json({ success: true, message: 'OK', data: [] })
      }),
    )
    await get('/api/stok', { filter: 'low' })
    expect(requestUrl).toContain('filter=low')
  })

  it('mengabaikan parameter dengan nilai undefined', async () => {
    let requestUrl = ''
    server.use(
      http.get(`${BASE}/api/stok`, ({ request }) => {
        requestUrl = request.url
        return HttpResponse.json({ success: true, message: 'OK', data: [] })
      }),
    )
    await get('/api/stok', { filter: undefined })
    expect(requestUrl).not.toContain('filter')
  })
})
