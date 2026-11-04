import { get, patch, post } from './api'
import type {
  ScanResult,
  StockAnalysis,
  StockCorrectionRequest,
  StockCorrectionResult,
  StockFilter,
  StockItem,
} from '../types/stok'

function isStockAnalysisItem(value: unknown): value is StockAnalysis['items'][number] {
  if (typeof value !== 'object' || value === null) return false
  return (
    'sku' in value &&
    typeof value.sku === 'string' &&
    'nama' in value &&
    typeof value.nama === 'string' &&
    'stok_saat_ini' in value &&
    typeof value.stok_saat_ini === 'number' &&
    'reorder_point' in value &&
    typeof value.reorder_point === 'number' &&
    'prioritas' in value &&
    (value.prioritas === 'TINGGI' || value.prioritas === 'SEDANG' || value.prioritas === 'RENDAH') &&
    'alasan' in value &&
    typeof value.alasan === 'string' &&
    value.alasan.length > 0
  )
}

function isStockAnalysis(value: unknown): value is StockAnalysis {
  if (typeof value !== 'object' || value === null) return false
  return (
    'item_count' in value &&
    typeof value.item_count === 'number' &&
    'explanation' in value &&
    typeof value.explanation === 'string' &&
    'items' in value &&
    Array.isArray(value.items) &&
    value.items.every(isStockAnalysisItem)
  )
}

const AI_TIMEOUT_MS = 60_000
const SCAN_TIMEOUT_MS = 90_000

export function listStock(status: StockFilter): Promise<StockItem[]> {
  return get<StockItem[]>('/api/stok', { status })
}

export function runScan(): Promise<ScanResult> {
  return post<ScanResult>('/api/stok/scan', undefined, SCAN_TIMEOUT_MS)
}

export async function analyzeLowStock(): Promise<StockAnalysis> {
  const analysis = await post<unknown>('/api/stok/ai-analysis', undefined, AI_TIMEOUT_MS)
  if (!isStockAnalysis(analysis)) {
    throw new Error('Respons analisis stok tidak sesuai format. Periksa versi backend dan coba lagi.')
  }
  return analysis
}

export function correctStock(sku: string, payload: StockCorrectionRequest): Promise<StockCorrectionResult> {
  return patch<StockCorrectionResult>(`/api/stok/${sku}`, payload)
}
