import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { receivePO } from '../services/poService'
import type { PenerimaanItemInput } from '../types/po'
import { invalidateResourceCache } from './useResource'

export function usePenerimaan(onFinished: () => void) {
  const [pending, setPending] = useState(false)

  const receive = useCallback(
    async (poID: number, items: PenerimaanItemInput[]): Promise<boolean> => {
      setPending(true)
      try {
        await receivePO(poID, items)
        invalidateResourceCache('po')
        invalidateResourceCache('penerimaan')
        invalidateResourceCache('stock')
        invalidateResourceCache('dashboard')
        toast.success('Penerimaan barang berhasil dicatat')
        onFinished()
        return true
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Gagal mencatat penerimaan barang.',
        )
        return false
      } finally {
        setPending(false)
      }
    },
    [onFinished],
  )

  return { receive, pending }
}
