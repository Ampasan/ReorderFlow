import { describe, it, expect } from 'vitest'
import { ApiError } from '../../../types/api'

describe('ApiError', () => {
  it('membuat error dengan message dan status', () => {
    const err = new ApiError('Server error', 500)
    expect(err.message).toBe('Server error')
    expect(err.status).toBe(500)
    expect(err.name).toBe('ApiError')
  })

  it('merupakan instance dari Error', () => {
    const err = new ApiError('Not found', 404)
    expect(err instanceof Error).toBe(true)
    expect(err instanceof ApiError).toBe(true)
  })

  it('status 0 berarti network error', () => {
    const err = new ApiError('Tidak dapat terhubung ke server.', 0)
    expect(err.status).toBe(0)
  })
})
