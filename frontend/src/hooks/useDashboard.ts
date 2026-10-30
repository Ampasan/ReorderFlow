import { useCallback } from 'react'
import { getSummary } from '../services/dashboardService'
import { listStock } from '../services/stockService'
import type { DashboardSummary } from '../types/dashboard'
import type { StockItem } from '../types/stok'
import { useResource } from './useResource'

export interface DashboardData {
  summary: DashboardSummary
  lowStock: StockItem[]
}

export function useDashboard() {
  const fetcher = useCallback(async (): Promise<DashboardData> => {
    const [summary, lowStock] = await Promise.all([getSummary(), listStock('low')])
    return { summary, lowStock }
  }, [])

  return useResource<DashboardData>('dashboard', fetcher)
}
