/**
 * Integration tests — stockService
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { listStock, runScan, analyzeLowStock, correctStock } from '../../../services/stockService'
import { ApiError } from '../../../types/api'
import { saveSession, clearSession } from '../../../utils/authStorage'
import { mockAdminUser, mockStokItems } from '../../mocks/handlers'

const BASE = 'http://localhost:8080'

beforeEach(() => {
  clearSession()
  saveSession('mock-jwt-token-admin', mockAdminUser)
})

describe('listStock()', () => {
  it('mengembalikan array stok dari server', async () => {
    const items = await listStock('all')
    expect(Array.isArray(items)).toBe(true)
    expect(items.length).toBe(3)
  })

  it('stok item memiliki field yang benar', async () => {
    const items = await listStock('all')
    const first = items[0]
    expect(first).toHaveProperty('sku')
    expect(first).toHaveProperty('nama')
    expect(first).toHaveProperty('stok_saat_ini')
    expect(first).toHaveProperty('reorder_point')
    expect(first).toHaveProperty('status')
  })

  it('mengirim parameter status ke query string', async () => {
    let capturedUrl = ''
    server.use(
      http.get(`${BASE}/api/stok`, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ success: true, message: 'OK', data: [] })
      }),
    )
    await listStock('low')
    expect(capturedUrl).toContain('status=low')
  })

  it('melempar ApiError saat server error', async () => {
    server.use(
      http.get(`${BASE}/api/stok`, () =>
        HttpResponse.json({ success: false, message: 'DB Error', data: null }, { status: 500 }),
      ),
    )
    await expect(listStock('all')).rejects.toBeInstanceOf(ApiError)
  })
})

describe('runScan()', () => {
  it('mengembalikan scan result', async () => {
    const result = await runScan()
    expect(result).toHaveProperty('scanned_items')
    expect(result).toHaveProperty('low_stock_count')
    expect(result).toHaveProperty('draft_po_created')
    expect(result).toHaveProperty('ai_recommendation_status')
  })

  it('melempar ApiError jika scan gagal', async () => {
    server.use(
      http.post(`${BASE}/api/stok/scan`, () =>
        HttpResponse.json({ success: false, message: 'Gagal', data: null }, { status: 500 }),
      ),
    )
    await expect(runScan()).rejects.toBeInstanceOf(ApiError)
  })
})

describe('analyzeLowStock()', () => {
  it('mengembalikan StockAnalysis dengan item_count, explanation, items', async () => {
    const analysis = await analyzeLowStock()
    expect(analysis).toHaveProperty('item_count')
    expect(analysis).toHaveProperty('explanation')
    expect(analysis).toHaveProperty('items')
    expect(Array.isArray(analysis.items)).toBe(true)
  })

  it('setiap item analisis memiliki field yang benar', async () => {
    const analysis = await analyzeLowStock()
    if (analysis.items.length > 0) {
      const item = analysis.items[0]
      expect(item).toHaveProperty('sku')
      expect(item).toHaveProperty('nama')
      expect(item).toHaveProperty('prioritas')
      expect(item).toHaveProperty('alasan')
      expect(['TINGGI', 'SEDANG', 'RENDAH']).toContain(item.prioritas)
    }
  })

  it('melempar Error jika format respons tidak sesuai', async () => {
    server.use(
      http.post(`${BASE}/api/stok/ai-analysis`, () =>
        HttpResponse.json({
          success: true,
          message: 'OK',
          data: { invalid_format: true },
        }),
      ),
    )
    await expect(analyzeLowStock()).rejects.toThrow(/format/i)
  })
})

describe('correctStock()', () => {
  it('mengirim PATCH request dengan SKU dan payload yang benar', async () => {
    let capturedBody: unknown = null
    let capturedSku = ''
    server.use(
      http.patch(`${BASE}/api/stok/:sku`, async ({ request, params }) => {
        capturedSku = params.sku as string
        capturedBody = await request.json()
        return HttpResponse.json({
          success: true,
          message: 'OK',
          data: { sku: params.sku, stok_saat_ini: 50 },
        })
      }),
    )
    const result = await correctStock('BRS-001', { stok_saat_ini: 50, alasan: 'MISCOUNT' })
    expect(capturedSku).toBe('BRS-001')
    expect(capturedBody).toMatchObject({ stok_saat_ini: 50, alasan: 'MISCOUNT' })
    expect(result.sku).toBe('BRS-001')
  })

  it('melempar ApiError jika tidak ada izin (403)', async () => {
    server.use(
      http.patch(`${BASE}/api/stok/:sku`, () =>
        HttpResponse.json({ success: false, message: 'Forbidden', data: null }, { status: 403 }),
      ),
    )
    await expect(correctStock('BRS-001', { stok_saat_ini: 50, alasan: 'DAMAGED' })).rejects.toBeInstanceOf(ApiError)
  })
})

describe('stok item status validation', () => {
  it('semua status item valid dari mock data', async () => {
    const items = await listStock('all')
    const validStatuses = ['NORMAL', 'LOW_STOCK', 'REQUIRES_MANUAL_REVIEW']
    for (const item of items) {
      expect(validStatuses).toContain(item.status)
    }
  })

  it('item LOW_STOCK memiliki stok <= reorder_point', async () => {
    const items = await listStock('all')
    const lowStockItems = items.filter((i) => i.status === 'LOW_STOCK')
    for (const item of lowStockItems) {
      // Logika: stok <= reorder_point → LOW_STOCK (dari mock data)
      expect(item.stok_saat_ini).toBeLessThanOrEqual(item.reorder_point)
    }
  })
})

// Verifikasi mock data konsisten dengan types
describe('mock data shape', () => {
  it('mockStokItems sesuai dengan StockItem interface', () => {
    for (const item of mockStokItems) {
      expect(typeof item.sku).toBe('string')
      expect(typeof item.nama).toBe('string')
      expect(typeof item.stok_saat_ini).toBe('number')
      expect(typeof item.reorder_point).toBe('number')
      expect(typeof item.qty_min_order).toBe('number')
      expect(typeof item.id_pemasok).toBe('number')
      expect(['NORMAL', 'LOW_STOCK', 'REQUIRES_MANUAL_REVIEW']).toContain(item.status)
    }
  })
})
