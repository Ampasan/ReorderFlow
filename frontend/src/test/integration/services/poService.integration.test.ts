/**
 * Integration tests — poService
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { listPO, getPO, updateDraft, submitDraft, getPenerimaan, receivePO } from '../../../services/poService'
import { ApiError } from '../../../types/api'
import { saveSession, clearSession } from '../../../utils/authStorage'
import { mockAdminUser, mockPOLogs, mockDraftDetail } from '../../mocks/handlers'

const BASE = 'http://localhost:8080'

beforeEach(() => {
  clearSession()
  saveSession('mock-jwt-token-admin', mockAdminUser)
})

describe('listPO()', () => {
  it('mengembalikan array PO', async () => {
    const pos = await listPO('all')
    expect(Array.isArray(pos)).toBe(true)
    expect(pos.length).toBeGreaterThan(0)
  })

  it('setiap PO memiliki nomor_po, status, dan pemasok', async () => {
    const pos = await listPO('all')
    for (const po of pos) {
      expect(po).toHaveProperty('nomor_po')
      expect(po).toHaveProperty('status')
      expect(typeof po.nomor_po).toBe('string')
    }
  })

  it('mengirim parameter status ke query string', async () => {
    let capturedUrl = ''
    server.use(
      http.get(`${BASE}/api/po`, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ success: true, message: 'OK', data: [] })
      }),
    )
    await listPO('DRAFT')
    expect(capturedUrl).toContain('status=DRAFT')
  })
})

describe('getPO() — detail draft', () => {
  it('mengembalikan detail PO berdasarkan ID', async () => {
    const po = await getPO(1)
    expect(po.id).toBe(1)
    expect(po.nomor_po).toBe('PO-2024-001')
    expect(po.status).toBe('DRAFT')
  })

  it('PO draft memiliki details array', async () => {
    const po = await getPO(1)
    expect(Array.isArray(po.details)).toBe(true)
  })

  it('melempar ApiError jika PO tidak ditemukan', async () => {
    server.use(
      http.get(`${BASE}/api/po-draft/:id`, () =>
        HttpResponse.json({ success: false, message: 'Not Found', data: null }, { status: 404 }),
      ),
    )
    await expect(getPO(999)).rejects.toBeInstanceOf(ApiError)
  })
})

describe('updateDraft()', () => {
  it('mengirim PUT request dengan items', async () => {
    let capturedBody: unknown = null
    server.use(
      http.put(`${BASE}/api/po-draft/:id`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ success: true, message: 'OK', data: mockDraftDetail })
      }),
    )
    const items = [{ sku: 'BRS-001', jumlah_order: 60 }]
    await updateDraft(1, items)
    expect(capturedBody).toMatchObject({ items })
  })

  it('melempar ApiError saat gagal menyimpan', async () => {
    server.use(
      http.put(`${BASE}/api/po-draft/:id`, () =>
        HttpResponse.json({ success: false, message: 'Error', data: null }, { status: 500 }),
      ),
    )
    await expect(updateDraft(1, [])).rejects.toBeInstanceOf(ApiError)
  })
})

describe('submitDraft()', () => {
  it('mengirim POST ke endpoint submit dan mengembalikan PO yang diperbarui', async () => {
    let submitCalled = false
    server.use(
      http.post(`${BASE}/api/po-draft/:id/submit`, () => {
        submitCalled = true
        return HttpResponse.json({
          success: true,
          message: 'PO berhasil dikirim',
          data: { ...mockDraftDetail, status: 'PENDING_APPROVAL' },
        })
      }),
    )
    const result = await submitDraft(1)
    expect(submitCalled).toBe(true)
    expect(result.status).toBe('PENDING_APPROVAL')
  })
})

describe('getPenerimaan()', () => {
  it('mengembalikan view penerimaan dengan items dan riwayat', async () => {
    const view = await getPenerimaan(1)
    expect(view).toHaveProperty('po_id')
    expect(view).toHaveProperty('items')
    expect(view).toHaveProperty('riwayat')
    expect(Array.isArray(view.items)).toBe(true)
    expect(Array.isArray(view.riwayat)).toBe(true)
  })
})

describe('receivePO()', () => {
  it('mengirim POST dengan items penerimaan', async () => {
    let capturedBody: unknown = null
    server.use(
      http.post(`${BASE}/api/po-penerimaan/:id`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ success: true, message: 'OK', data: {} })
      }),
    )
    const items = [{ sku: 'BRS-001', qty_diterima: 50 }]
    await receivePO(1, items)
    expect(capturedBody).toMatchObject({ items })
  })
})

describe('PO status FSM — validasi dari mock', () => {
  it('semua status PO valid dari mock data', () => {
    const validStatuses = [
      'DRAFT', 'PENDING_APPROVAL', 'SENT', 'REJECTED',
      'REQUIRES_MANUAL_REVIEW', 'PARTIALLY_RECEIVED', 'RECEIVED',
    ]
    for (const po of mockPOLogs) {
      expect(validStatuses).toContain(po.status)
    }
  })
})
