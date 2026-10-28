import type { Pemasok } from './stok'

export type POStatus = 'DRAFT' | 'SENT' | 'REJECTED' | 'REQUIRES_MANUAL_REVIEW'

export type POFilter = 'all' | POStatus

export interface POLog {
  id: number
  nomor_po: string
  id_pemasok: number
  status: POStatus
  tautan_pdf: string
  created_at: string
  updated_at: string
  pemasok?: Pemasok
}
