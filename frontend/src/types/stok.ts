export interface Pemasok {
  id: number
  nama: string
  email: string
}

export type StockStatus = 'NORMAL' | 'LOW_STOCK' | 'REQUIRES_MANUAL_REVIEW'

export type StockFilter = 'all' | 'low' | 'manual'

export interface StockItem {
  sku: string
  nama: string
  stok_saat_ini: number
  reorder_point: number
  qty_min_order: number
  id_pemasok: number
  updated_at: string
  pemasok?: Pemasok
  status: StockStatus
}

export interface ScanResult {
  scanned_items: number
  low_stock_count: number
  draft_po_created: number
  skipped_active_po: number
  manual_review: number
}

export type OpnameReason = 'DAMAGED' | 'MISCOUNT' | 'RETURN'

export interface StockCorrectionRequest {
  stok_saat_ini: number
  alasan: OpnameReason
}

export interface StockCorrectionResult {
  sku: string
  stok_saat_ini: number
}
