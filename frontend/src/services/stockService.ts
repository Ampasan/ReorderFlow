import { get, patch, post } from './api'
import type {
  ScanResult,
  StockCorrectionRequest,
  StockCorrectionResult,
  StockFilter,
  StockItem,
} from '../types/stok'

export function listStock(status: StockFilter): Promise<StockItem[]> {
  return get<StockItem[]>('/api/stok', { status })
}

export function runScan(): Promise<ScanResult> {
  return post<ScanResult>('/api/stok/scan')
}

export function correctStock(sku: string, payload: StockCorrectionRequest): Promise<StockCorrectionResult> {
  return patch<StockCorrectionResult>(`/api/stok/${sku}`, payload)
}
