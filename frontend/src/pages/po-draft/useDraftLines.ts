import { useMemo, useState } from 'react'
import type { DraftItemInput, POLog } from '../../types/po'
import type { StockItem } from '../../types/stok'

export function useDraftLines(po: POLog, stockData: StockItem[] | null) {
  const [lines, setLines] = useState<DraftItemInput[]>(() =>
    (po.details ?? []).map((detail) => ({
      sku: detail.sku,
      jumlah_order: detail.jumlah_order,
    })),
  )
  const [selectedSku, setSelectedSku] = useState('')

  const stockBySku = useMemo(() => {
    const map = new Map<string, StockItem>()
    for (const item of stockData ?? []) {
      map.set(item.sku, item)
    }
    return map
  }, [stockData])

  const addable = useMemo(
    () =>
      (stockData ?? []).filter(
        (item) =>
          item.id_pemasok === po.id_pemasok &&
          !lines.some((line) => line.sku === item.sku),
      ),
    [stockData, po.id_pemasok, lines],
  )

  const activeSku = addable.some((item) => item.sku === selectedSku)
    ? selectedSku
    : (addable[0]?.sku ?? '')

  const totalQty = lines.reduce((total, line) => total + line.jumlah_order, 0)

  function handleQuantityChange(sku: string, value: string) {
    const parsed = Math.floor(Number(value))
    const quantity = Number.isFinite(parsed) ? Math.max(1, parsed) : 1
    setLines((current) =>
      current.map((line) =>
        line.sku === sku ? { ...line, jumlah_order: quantity } : line,
      ),
    )
  }

  function handleRemove(sku: string) {
    setLines((current) => current.filter((line) => line.sku !== sku))
  }

  function handleAdd() {
    const item = addable.find((stock) => stock.sku === activeSku)
    if (!item) return
    setLines((current) => [
      ...current,
      {
        sku: item.sku,
        jumlah_order: item.qty_min_order > 0 ? item.qty_min_order : 1,
      },
    ])
    setSelectedSku('')
  }

  return {
    lines,
    stockBySku,
    addable,
    activeSku,
    selectedSku,
    setSelectedSku,
    totalQty,
    handleQuantityChange,
    handleRemove,
    handleAdd,
  }
}
