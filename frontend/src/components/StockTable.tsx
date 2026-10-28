import type { StockItem } from '../types/stok'
import { formatNumber } from '../utils/formatter'
import { ChevronRightIcon } from './icons'
import { StatusBadge } from './StatusBadge'

interface StockTableProps {
  items: StockItem[]
  onSelect: (item: StockItem) => void
  onOpname?: (item: StockItem) => void
  compact?: boolean
}

export function StockTable({ items, onSelect, onOpname, compact = false }: StockTableProps) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-brand-dark/10 bg-brand-cream/60 text-[11px] font-bold uppercase tracking-wide text-brand-muted">
            <th scope="col" className="rounded-l-lg px-4 py-3">
              SKU
            </th>
            <th scope="col" className="px-4 py-3">
              Nama Produk
            </th>
            <th scope="col" className="px-4 py-3">
              Stok Saat Ini
            </th>
            <th scope="col" className="px-4 py-3">
              Reorder Point
            </th>
            {compact ? null : (
              <>
                <th scope="col" className="px-4 py-3">
                  Min Order
                </th>
                <th scope="col" className="px-4 py-3">
                  Pemasok
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
              </>
            )}
            <th scope="col" className="rounded-r-lg px-4 py-3 text-right">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-dark/5 text-sm">
          {items.map((item) => {
            const isLow = item.status === 'LOW_STOCK'
            const secondary = compact ? item.pemasok?.nama : item.pemasok?.email
            return (
              <tr key={item.sku} className="align-top hover:bg-brand-cream/40">
                <td className="whitespace-nowrap px-4 py-4 font-mono text-xs font-medium text-brand-dark">
                  {item.sku}
                </td>
                <td className="px-4 py-4">
                  <span className="font-semibold text-brand-dark">{item.nama}</span>
                  <span className="mt-0.5 block text-xs text-brand-muted">{secondary ?? '-'}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className={isLow ? 'text-base font-bold text-rose-700' : 'font-semibold text-brand-dark'}>
                    {formatNumber(item.stok_saat_ini)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 font-medium text-brand-dark">
                  {formatNumber(item.reorder_point)}
                </td>
                {compact ? null : (
                  <>
                    <td className="whitespace-nowrap px-4 py-4 text-brand-dark">
                      {formatNumber(item.qty_min_order)}
                    </td>
                    <td className="px-4 py-4 text-brand-dark">{item.pemasok?.nama ?? '-'}</td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                  </>
                )}
                <td className="whitespace-nowrap px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onOpname ? (
                      <button
                        type="button"
                        onClick={() => onOpname(item)}
                        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-brand-dark/15 bg-white px-3 text-sm font-semibold text-brand-dark hover:bg-brand-cream"
                      >
                        Opname
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onSelect(item)}
                      className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-brand-orange px-3 text-sm font-semibold text-white hover:bg-brand-orange-strong"
                    >
                      Detail
                      <ChevronRightIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
