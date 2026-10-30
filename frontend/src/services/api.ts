import toast from 'react-hot-toast'
import { ApiError } from '../types/api'
import type { ApiResponse } from '../types/api'
import { API_BASE_URL } from '../utils/constants'
import { clearSession, getToken } from '../utils/authStorage'

export const UNAUTHORIZED_EVENT = 'reorderflow:unauthorized'

const TIMEOUT_MS = 20_000

type QueryParams = Record<string, string | undefined>

function buildUrl(path: string, params?: QueryParams): string {
  const base = API_BASE_URL.replace(/\/+$/, '')
  if (!params) return `${base}${path}`

  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, value)
  }

  const suffix = query.toString()
  return suffix ? `${base}${path}?${suffix}` : `${base}${path}`
}

async function request<T>(path: string, init: RequestInit, params?: QueryParams): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body !== undefined) headers.set('Content-Type', 'application/json')

  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  try {
    const response = await fetch(buildUrl(path, params), {
      ...init,
      headers,
      signal: controller.signal,
    })
    const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null

    if (!response.ok) {
      const isLoginRequest = path.includes('/api/auth/login')
      if (response.status === 401 && !isLoginRequest) {
        clearSession()
        window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
      }
      if (response.status === 403) {
        toast.error('Anda tidak memiliki akses untuk aksi ini')
      }

      throw new ApiError(
        payload?.message ?? 'Server menolak permintaan. Coba lagi.',
        response.status,
      )
    }

    if (!payload) {
      throw new ApiError('Respons server tidak valid.', response.status)
    }

    return payload.data
  } catch (error) {
    if (error instanceof ApiError) throw error

    const message =
      error instanceof DOMException && error.name === 'AbortError'
        ? 'Permintaan melebihi batas waktu. Coba lagi.'
        : 'Tidak dapat terhubung ke server. Periksa koneksi Anda.'
    throw new ApiError(message, 0)
  } finally {
    clearTimeout(timeoutId)
  }
}

function jsonBody(body: unknown): string | undefined {
  return body === undefined ? undefined : JSON.stringify(body)
}

export function get<T>(url: string, params?: QueryParams): Promise<T> {
  return request<T>(url, { method: 'GET' }, params)
}

export function post<T>(url: string, body?: unknown): Promise<T> {
  return request<T>(url, { method: 'POST', body: jsonBody(body) })
}

export function patch<T>(url: string, body?: unknown): Promise<T> {
  return request<T>(url, { method: 'PATCH', body: jsonBody(body) })
}

export function put<T>(url: string, body?: unknown): Promise<T> {
  return request<T>(url, { method: 'PUT', body: jsonBody(body) })
}
