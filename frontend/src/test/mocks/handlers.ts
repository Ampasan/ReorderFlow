import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:8080'

// ─── Fixtures ──────────────────────────────────────────────────────────────

export const mockAdminUser = {
  id: 1,
  email: 'admin@toko.id',
  nama: 'Andi Pratama',
  role: 'admin' as const,
  created_at: '2024-01-01T00:00:00Z',
}

export const mockManagerUser = {
  id: 2,
  email: 'manager@toko.id',
  nama: 'Rina Anggraini',
  role: 'manager' as const,
  created_at: '2024-01-01T00:00:00Z',
}

export const mockStokItems = [
  {
    sku: 'BRS-001',
    nama: 'Beras Premium 5kg',
    stok_saat_ini: 10,
    reorder_point: 20,
    qty_min_order: 50,
    id_pemasok: 1,
    updated_at: '2024-11-01T08:00:00Z',
    status: 'LOW_STOCK',
    pemasok: { id: 1, nama: 'CV Beras Sejahtera', email: 'beras@supplier.id' },
  },
  {
    sku: 'GUL-001',
    nama: 'Gula Pasir 1kg',
    stok_saat_ini: 100,
    reorder_point: 30,
    qty_min_order: 100,
    id_pemasok: 2,
    updated_at: '2024-11-01T08:00:00Z',
    status: 'NORMAL',
    pemasok: { id: 2, nama: 'PT Gula Manis', email: 'gula@supplier.id' },
  },
  {
    sku: 'MIN-001',
    nama: 'Minyak Goreng 2L',
    stok_saat_ini: 5,
    reorder_point: 15,
    qty_min_order: 24,
    id_pemasok: 1,
    updated_at: '2024-11-01T08:00:00Z',
    status: 'REQUIRES_MANUAL_REVIEW',
    pemasok: { id: 1, nama: 'CV Beras Sejahtera', email: 'beras@supplier.id' },
  },
]

export const mockDashboardSummary = {
  total_stok: 3,
  low_stock_count: 1,
  pending_po: 2,
  total_nilai_po: 15000000,
  manual_review_count: 1,
}

export const mockPOLogs = [
  {
    id: 1,
    nomor_po: 'PO-2024-001',
    id_pemasok: 1,
    status: 'DRAFT',
    tautan_pdf: '',
    submitted_at: null,
    created_at: '2024-11-01T08:00:00Z',
    updated_at: '2024-11-01T08:00:00Z',
    pemasok: { id: 1, nama: 'CV Beras Sejahtera', email: 'beras@supplier.id' },
    details: [
      { id: 1, po_id: 1, sku: 'BRS-001', jumlah_order: 50 },
    ],
  },
  {
    id: 2,
    nomor_po: 'PO-2024-002',
    id_pemasok: 2,
    status: 'PENDING_APPROVAL',
    tautan_pdf: 'https://storage.example.com/po-2024-002.pdf',
    submitted_at: '2024-11-01T09:00:00Z',
    created_at: '2024-11-01T08:00:00Z',
    updated_at: '2024-11-01T09:00:00Z',
    pemasok: { id: 2, nama: 'PT Gula Manis', email: 'gula@supplier.id' },
    details: [
      { id: 2, po_id: 2, sku: 'GUL-001', jumlah_order: 100 },
    ],
  },
]

export const mockDraftDetail = {
  id: 1,
  nomor_po: 'PO-2024-001',
  id_pemasok: 1,
  status: 'DRAFT',
  tautan_pdf: '',
  submitted_at: null,
  created_at: '2024-11-01T08:00:00Z',
  updated_at: '2024-11-01T08:00:00Z',
  pemasok: { id: 1, nama: 'CV Beras Sejahtera', email: 'beras@supplier.id' },
  details: [
    { id: 1, po_id: 1, sku: 'BRS-001', jumlah_order: 50, ai_priority: 'TINGGI', ai_reason: 'Stok sangat rendah' },
  ],
}

// ─── Default Handlers ──────────────────────────────────────────────────────

export const handlers = [
  // Auth
  http.post(`${BASE}/api/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    if (body.email === 'admin@toko.id' && body.password === 'password123') {
      return HttpResponse.json({
        success: true,
        message: 'Login berhasil',
        data: { token: 'mock-jwt-token-admin', user: mockAdminUser },
      })
    }
    if (body.email === 'manager@toko.id' && body.password === 'password123') {
      return HttpResponse.json({
        success: true,
        message: 'Login berhasil',
        data: { token: 'mock-jwt-token-manager', user: mockManagerUser },
      })
    }
    return HttpResponse.json(
      { success: false, message: 'Email atau password salah', data: null },
      { status: 401 },
    )
  }),

  http.get(`${BASE}/api/auth/me`, ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (auth === 'Bearer mock-jwt-token-admin') {
      return HttpResponse.json({ success: true, message: 'OK', data: mockAdminUser })
    }
    if (auth === 'Bearer mock-jwt-token-manager') {
      return HttpResponse.json({ success: true, message: 'OK', data: mockManagerUser })
    }
    return HttpResponse.json(
      { success: false, message: 'Token tidak valid', data: null },
      { status: 401 },
    )
  }),

  // Stok
  http.get(`${BASE}/api/stok`, () => {
    return HttpResponse.json({ success: true, message: 'OK', data: mockStokItems })
  }),

  http.patch(`${BASE}/api/stok/:sku`, async ({ request, params }) => {
    const body = await request.json() as { stok_saat_ini: number; alasan: string }
    return HttpResponse.json({
      success: true,
      message: 'Stok berhasil dikoreksi',
      data: { sku: params.sku, stok_saat_ini: body.stok_saat_ini },
    })
  }),

  http.post(`${BASE}/api/stok/scan`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Scan selesai',
      data: {
        scanned_items: 3,
        low_stock_count: 1,
        draft_po_created: 1,
        skipped_active_po: 0,
        manual_review: 1,
        ai_recommendation_status: 'available',
      },
    })
  }),

  http.post(`${BASE}/api/stok/ai-analysis`, () => {
    return HttpResponse.json({
      success: true,
      message: 'OK',
      data: {
        item_count: 2,
        explanation: 'Dua item memerlukan perhatian segera.',
        items: [
          {
            sku: 'BRS-001',
            nama: 'Beras Premium 5kg',
            stok_saat_ini: 10,
            reorder_point: 20,
            prioritas: 'TINGGI',
            alasan: 'Stok sangat rendah',
          },
        ],
      },
    })
  }),

  // Dashboard
  http.get(`${BASE}/api/dashboard`, () => {
    return HttpResponse.json({ success: true, message: 'OK', data: mockDashboardSummary })
  }),

  // PO Log
  http.get(`${BASE}/api/po`, () => {
    return HttpResponse.json({ success: true, message: 'OK', data: mockPOLogs })
  }),

  http.get(`${BASE}/api/po-log`, () => {
    return HttpResponse.json({ success: true, message: 'OK', data: mockPOLogs })
  }),

  // PO Draft
  http.get(`${BASE}/api/po-draft/:id`, () => {
    return HttpResponse.json({ success: true, message: 'OK', data: mockDraftDetail })
  }),

  http.put(`${BASE}/api/po-draft/:id`, async ({ request }) => {
    const body = await request.json() as unknown
    return HttpResponse.json({ success: true, message: 'Draf berhasil disimpan', data: body })
  }),

  http.post(`${BASE}/api/po-draft/:id/submit`, () => {
    return HttpResponse.json({
      success: true,
      message: 'PO berhasil dikirim ke manajer',
      data: { ...mockDraftDetail, status: 'PENDING_APPROVAL' },
    })
  }),

  // Penerimaan
  http.get(`${BASE}/api/po-penerimaan/:id`, () => {
    return HttpResponse.json({
      success: true,
      message: 'OK',
      data: {
        po_id: 1,
        nomor_po: 'PO-2024-001',
        status: 'SENT',
        items: [
          { sku: 'BRS-001', nama: 'Beras Premium 5kg', jumlah_order: 50, sudah_diterima: 0, sisa: 50 },
        ],
        riwayat: [],
      },
    })
  }),

  http.post(`${BASE}/api/po-penerimaan/:id`, () => {
    return HttpResponse.json({ success: true, message: 'Penerimaan berhasil dicatat', data: {} })
  }),

  // Health
  http.get(`${BASE}/health`, () => {
    return HttpResponse.json({ status: 'ok' })
  }),
]
