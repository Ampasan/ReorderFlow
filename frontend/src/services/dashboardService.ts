import { get } from './api'
import type { DashboardSummary } from '../types/dashboard'

export function getSummary(): Promise<DashboardSummary> {
  return get<DashboardSummary>('/api/dashboard')
}
