import { useCallback, useEffect, useRef } from 'react'
import { listPO } from '../services/poService'
import type { POFilter, POLog } from '../types/po'
import { useResource } from './useResource'

const POLL_INTERVAL = 15_000

export function usePOLog(status: POFilter) {
  const fetcher = useCallback(() => listPO(status), [status])

  const resource = useResource<POLog[]>(`po:${status}`, fetcher)

  const refetchRef = useRef(resource.refetch)
  refetchRef.current = resource.refetch

  // Poll setiap 15 detik agar status PO terupdate secara real-time
  useEffect(() => {
    const id = setInterval(() => {
      refetchRef.current()
    }, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [])

  return resource
}
