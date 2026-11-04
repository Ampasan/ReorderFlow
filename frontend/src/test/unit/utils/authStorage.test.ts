import { describe, it, expect, beforeEach } from 'vitest'
import { getToken, getUser, saveSession, clearSession } from '../../../utils/authStorage'
import type { User } from '../../../types/auth'

const mockUser: User = {
  id: 1,
  email: 'admin@toko.id',
  nama: 'Andi Pratama',
  role: 'admin',
  created_at: '2024-01-01T00:00:00Z',
}

describe('authStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('getToken', () => {
    it('mengembalikan null jika tidak ada token tersimpan', () => {
      expect(getToken()).toBeNull()
    })

    it('mengembalikan token setelah saveSession', () => {
      saveSession('my-jwt-token', mockUser)
      expect(getToken()).toBe('my-jwt-token')
    })
  })

  describe('getUser', () => {
    it('mengembalikan null jika tidak ada user tersimpan', () => {
      expect(getUser()).toBeNull()
    })

    it('mengembalikan user setelah saveSession', () => {
      saveSession('token', mockUser)
      const user = getUser()
      expect(user).toEqual(mockUser)
    })

    it('mengembalikan null jika data user rusak (invalid JSON)', () => {
      localStorage.setItem('reorderflow.user', 'invalid-json{')
      expect(getUser()).toBeNull()
    })
  })

  describe('saveSession', () => {
    it('menyimpan token dan user ke localStorage', () => {
      saveSession('abc123', mockUser)
      expect(localStorage.getItem('reorderflow.token')).toBe('abc123')
      const stored = JSON.parse(localStorage.getItem('reorderflow.user') ?? '{}')
      expect(stored.email).toBe('admin@toko.id')
    })
  })

  describe('clearSession', () => {
    it('menghapus token dan user dari localStorage', () => {
      saveSession('abc123', mockUser)
      clearSession()
      expect(getToken()).toBeNull()
      expect(getUser()).toBeNull()
    })

    it('tidak error saat dipanggil tanpa session aktif', () => {
      expect(() => clearSession()).not.toThrow()
    })
  })
})
