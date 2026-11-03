import { useCallback, useEffect } from 'react'
import { listPO } from '../services/poService'
import type { POFilter, POLog } from '../types/po'
import { useResource } from './useResource'

const POLL_INTERVAL = 15_000

export function usePOLog(status: POFilter) {
  const fetcher = useCallback(() => listPO(status), [status])

  const resource = useResource<POLog[]>(`po:${status}`, fetcher)
  const { refetch } = resource

  // Poll setiap 15 detik agar status PO terupdate secara real-time
  useEffect(() => {
    const id = setInterval(() => {
      refetch()
    }, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [refetch])

  return resource
}
