import type { Pemasok } from './stok'

export type POStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'SENT'
  | 'REJECTED'
  | 'REQUIRES_MANUAL_REVIEW'

export type POFilter = 'all' | POStatus

export interface PODetail {
  id: number
  po_id: number
  sku: string
  jumlah_order: number
}

export interface POLog {
  id: number
  nomor_po: string
  id_pemasok: number
  status: POStatus
  tautan_pdf: string
  submitted_at?: string | null
  created_at: string
  updated_at: string
  pemasok?: Pemasok
  details?: PODetail[]
}

export interface DraftItemInput {
  sku: string
  jumlah_order: number
}
