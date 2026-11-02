import type { Pemasok } from './stok'

export type POStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'SENT'
  | 'REJECTED'
  | 'REQUIRES_MANUAL_REVIEW'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'

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

export interface PenerimaanItem {
  sku: string
  nama: string
  jumlah_order: number
  sudah_diterima: number
  sisa: number
}

export interface PenerimaanRiwayatItem {
  sku: string
  nama: string
  qty_diterima: number
}

export interface PenerimaanRiwayat {
  id: number
  created_at: string
  items: PenerimaanRiwayatItem[]
}

export interface PenerimaanView {
  po_id: number
  nomor_po: string
  status: POStatus
  items: PenerimaanItem[]
  riwayat: PenerimaanRiwayat[]
}

export interface PenerimaanItemInput {
  sku: string
  qty_diterima: number
}
