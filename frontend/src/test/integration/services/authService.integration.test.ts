/**
 * Integration tests — authService (login + me)
 * Menguji integrasi antara authService → api client → MSW mock
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { login, getMe } from '../../../services/authService'
import { ApiError } from '../../../types/api'
import { saveSession, clearSession } from '../../../utils/authStorage'

const BASE = 'http://localhost:8080'

describe('authService.login()', () => {
  it('login admin berhasil mengembalikan token dan data user', async () => {
    const result = await login({ email: 'admin@toko.id', password: 'password123' })
    expect(result.token).toBe('mock-jwt-token-admin')
    expect(result.user.email).toBe('admin@toko.id')
    expect(result.user.role).toBe('admin')
    expect(result.user.id).toBe(1)
  })

  it('login manager berhasil mengembalikan token manager', async () => {
    const result = await login({ email: 'manager@toko.id', password: 'password123' })
    expect(result.token).toBe('mock-jwt-token-manager')
    expect(result.user.role).toBe('manager')
  })

  it('login gagal melempar ApiError dengan status 401', async () => {
    try {
      await login({ email: 'salah@toko.id', password: 'salahpassword' })
      expect.fail('harus melempar error')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).status).toBe(401)
      expect((err as ApiError).message).toBe('Email atau password salah')
    }
  })

  it('login dengan server error melempar ApiError', async () => {
    server.use(
      http.post(`${BASE}/api/auth/login`, () => {
        return HttpResponse.json({ success: false, message: 'Internal error', data: null }, { status: 500 })
      }),
    )
    try {
      await login({ email: 'admin@toko.id', password: 'password123' })
      expect.fail('harus melempar error')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).status).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('authService.getMe()', () => {
  beforeEach(() => clearSession())

  it('getMe() dengan token valid mengembalikan data user', async () => {
    saveSession('mock-jwt-token-admin', {
      id: 1, email: 'admin@toko.id', nama: 'Andi', role: 'admin', created_at: ''
    })
    const user = await getMe()
    expect(user.email).toBe('admin@toko.id')
    expect(user.role).toBe('admin')
  })

  it('getMe() dengan token expired melempar ApiError 401', async () => {
    saveSession('expired-token', {
      id: 1, email: 'admin@toko.id', nama: 'Andi', role: 'admin', created_at: ''
    })
    server.use(
      http.get(`${BASE}/api/auth/me`, () =>
        HttpResponse.json({ success: false, message: 'Token expired', data: null }, { status: 401 }),
      ),
    )
    try {
      await getMe()
      expect.fail('harus melempar error')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).status).toBe(401)
    }
  })

  it('getMe() tanpa token melempar ApiError 401', async () => {
    server.use(
      http.get(`${BASE}/api/auth/me`, () =>
        HttpResponse.json({ success: false, message: 'Unauthorized', data: null }, { status: 401 }),
      ),
    )
    try {
      await getMe()
      expect.fail('harus melempar error')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).status).toBe(401)
    }
  })
})
