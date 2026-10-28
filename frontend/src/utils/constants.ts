import type { POFilter, POStatus } from '../types/po'
import type { StockFilter } from '../types/stok'
import type { UserRole } from '../types/auth'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin Inventori',
  manager: 'Operations Manager',
}

export interface FilterOption<T extends string> {
  value: T
  label: string
}

export const STOCK_FILTERS: FilterOption<StockFilter>[] = [
  { value: 'all', label: 'Semua' },
  { value: 'low', label: 'Perlu Reorder' },
  { value: 'manual', label: 'Perlu Peninjauan' },
]

export const PO_FILTERS: FilterOption<POFilter>[] = [
  { value: 'all', label: 'Semua' },
  { value: 'DRAFT', label: 'Draf' },
  { value: 'SENT', label: 'Terkirim' },
  { value: 'REJECTED', label: 'Ditolak' },
  { value: 'REQUIRES_MANUAL_REVIEW', label: 'Perlu Tinjauan' },
]

const PO_STATUSES: POStatus[] = ['DRAFT', 'SENT', 'REJECTED', 'REQUIRES_MANUAL_REVIEW']

export function isStockFilter(value: string | null): value is StockFilter {
  return value === 'all' || value === 'low' || value === 'manual'
}

export function isPOFilter(value: string | null): value is POFilter {
  if (value === 'all') return true
  return value !== null && PO_STATUSES.some((status) => status === value)
}
