import { useCallback } from 'react'
import { listPO } from '../services/poService'
import type { POFilter, POLog } from '../types/po'
import { useResource } from './useResource'

export function usePOLog(status: POFilter) {
  const fetcher = useCallback(() => listPO(status), [status])

  return useResource<POLog[]>(`po:${status}`, fetcher)
}
