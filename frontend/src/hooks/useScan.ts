import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { runScan } from '../services/stockService'
import { invalidateResourceCache } from './useResource'

export function useScan(onFinished: () => void) {
  const [pending, setPending] = useState(false)

  const scan = useCallback(async (): Promise<boolean> => {
    setPending(true)
    try {
      const result = await runScan()
      invalidateResourceCache()
      toast.success(
        `Pemindaian selesai: ${result.draft_po_created} draf PO dibuat, ${result.skipped_active_po} dilewati karena sudah punya PO aktif, ${result.manual_review} perlu peninjauan manual. Buka Riwayat PO untuk memeriksa draf sebelum dikirim ke manajer.`,
      )
      onFinished()
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Pemindaian gagal dijalankan.'
      toast.error(message)
      return false
    } finally {
      setPending(false)
    }
  }, [onFinished])

  return { scan, pending }
}
