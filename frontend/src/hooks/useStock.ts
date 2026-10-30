import { useCallback } from 'react'
import { listStock } from '../services/stockService'
import type { StockFilter, StockItem } from '../types/stok'
import { useResource } from './useResource'

export function useStock(status: StockFilter) {
  const fetcher = useCallback(() => listStock(status), [status])

  return useResource<StockItem[]>(`stock:${status}`, fetcher)
}
