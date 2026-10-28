import { get } from './api'
import type { POFilter, POLog } from '../types/po'

export function listPO(status: POFilter): Promise<POLog[]> {
  return get<POLog[]>('/api/po', { status })
}
