import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { correctStock } from '../services/stockService'
import type { StockCorrectionRequest } from '../types/stok'
import { invalidateResourceCache } from './useResource'

export function useStockCorrection(onFinished: () => void) {
  const [pending, setPending] = useState(false)

  const correct = useCallback(
    async (sku: string, payload: StockCorrectionRequest): Promise<boolean> => {
      setPending(true)
      try {
        await correctStock(sku, payload)
        invalidateResourceCache('stock')
        invalidateResourceCache('dashboard')
        toast.success(`Stok ${sku} berhasil dikoreksi`)
        onFinished()
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Gagal mengoreksi stok.'
        toast.error(message)
        return false
      } finally {
        setPending(false)
      }
    },
    [onFinished],
  )

  return { correct, pending }
}
