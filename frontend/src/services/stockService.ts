import { get, post } from './api'
import type { ScanResult, StockFilter, StockItem } from '../types/stok'

export function listStock(status: StockFilter): Promise<StockItem[]> {
  return get<StockItem[]>('/api/stok', { status })
}

export function runScan(): Promise<ScanResult> {
  return post<ScanResult>('/api/stok/scan')
}
