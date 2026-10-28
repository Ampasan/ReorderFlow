import type { StockItem } from '../types/stok'
import { formatNumber } from '../utils/formatter'
import { StatusBadge } from './StatusBadge'

interface StockTableProps {
  items: StockItem[]
  onSelect: (item: StockItem) => void
  onOpname?: (item: StockItem) => void
  compact?: boolean
}

export function StockTable({ items, onSelect, onOpname, compact = false }: StockTableProps) {
  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-brand-dark/8">
            <th scope="col" className="px-4 py-3 text-xs font-semibold text-brand-muted">
              SKU
            </th>
            <th scope="col" className="px-4 py-3 text-xs font-semibold text-brand-muted">
              Produk
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-brand-muted">
              Stok
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-brand-muted">
              ROP
            </th>
            {compact ? null : (
              <>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-brand-muted">
                  Min Order
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-semibold text-brand-muted">
                  Pemasok
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-semibold text-brand-muted">
                  Status
                </th>
              </>
            )}
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Aksi</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-dark/5">
          {items.map((item) => {
            const isLow = item.status === 'LOW_STOCK'
            const secondary = compact ? item.pemasok?.nama : item.pemasok?.email
            return (
              <tr
                key={item.sku}
                className={`transition-colors ${isLow ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-brand-cream/40'}`}
              >
                <td className="whitespace-nowrap px-4 py-3.5">
                  <span className="font-mono text-xs text-brand-muted">{item.sku}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="font-medium text-brand-dark">{item.nama}</span>
                  {secondary ? (
                    <span className="mt-0.5 block text-xs text-brand-muted">{secondary}</span>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-right">
                  <span className={isLow ? 'font-semibold text-amber-700' : 'font-medium text-brand-dark'}>
                    {formatNumber(item.stok_saat_ini)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-right font-medium text-brand-dark">
                  {formatNumber(item.reorder_point)}
                </td>
                {compact ? null : (
                  <>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right font-medium text-brand-dark">
                      {formatNumber(item.qty_min_order)}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-brand-dark">
                      {item.pemasok?.nama ?? '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <StatusBadge status={item.status} />
                    </td>
                  </>
                )}
                <td className="whitespace-nowrap px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onOpname ? (
                      <button
                        type="button"
                        onClick={() => onOpname(item)}
                        className="h-8 rounded-lg border border-brand-dark/12 bg-white px-3 text-xs font-semibold text-brand-dark transition-colors hover:bg-brand-cream"
                      >
                        Opname
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onSelect(item)}
                      className="h-8 rounded-lg bg-brand-orange px-3 text-xs font-semibold text-white transition-colors hover:bg-brand-orange-strong"
                    >
                      Detail
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
