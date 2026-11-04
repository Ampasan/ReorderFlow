export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  error?: unknown
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}
