import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'
import { ApiError } from '../types/api'
import type { ApiResponse } from '../types/api'
import { API_BASE_URL } from '../utils/constants'
import { clearSession, getToken } from '../utils/authStorage'

export const UNAUTHORIZED_EVENT = 'reorderflow:unauthorized'

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { Accept: 'application/json' },
})

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    const status = error.response?.status ?? 0
    const backendMessage = error.response?.data?.message
    const message =
      backendMessage ??
      (status === 0
        ? 'Tidak dapat terhubung ke server. Periksa koneksi Anda.'
        : 'Server menolak permintaan. Coba lagi.')

    const isLoginRequest = error.config?.url?.includes('/api/auth/login') ?? false
    if (status === 401 && !isLoginRequest) {
      clearSession()
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    if (status === 403) {
      toast.error('Anda tidak memiliki akses untuk aksi ini')
    }

    return Promise.reject(new ApiError(message, status))
  },
)

export async function get<T>(url: string, params?: Record<string, string>): Promise<T> {
  const response = await client.get<ApiResponse<T>>(url, { params })
  return response.data.data
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const response = await client.post<ApiResponse<T>>(url, body)
  return response.data.data
}

export async function patch<T>(url: string, body?: unknown): Promise<T> {
  const response = await client.patch<ApiResponse<T>>(url, body)
  return response.data.data
}
