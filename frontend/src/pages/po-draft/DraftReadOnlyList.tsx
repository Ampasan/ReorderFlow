import type { DraftItemInput, PODetail } from '../../types/po'
import type { StockItem } from '../../types/stok'
import { formatNumber } from '../../utils/formatter'

interface DraftReadOnlyListProps {
  lines: DraftItemInput[]
  stockBySku: Map<string, StockItem>
  recommendationsBySku: Map<string, PODetail>
}

export function DraftReadOnlyList({ lines, stockBySku, recommendationsBySku }: DraftReadOnlyListProps) {
  return (
    <ul className="divide-y divide-brand-dark/8" role="list">
      {lines.length === 0 ? (
        <li className="px-5 py-6 text-sm text-brand-muted">
          Draf ini tidak memiliki barang.
        </li>
      ) : (
        lines.map((line) => {
          const stock = stockBySku.get(line.sku)
          const recommendation = recommendationsBySku.get(line.sku)
          return (
            <li
              key={line.sku}
              className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="min-w-0">
                <p className="font-mono text-xs font-medium text-brand-dark">{line.sku}</p>
                <p className="mt-0.5 truncate text-sm text-brand-dark">
                  {stock?.nama ?? 'Nama barang tidak ditemukan'}
                </p>
              </div>
              <div className="min-w-0 sm:text-right">
                <span className="text-sm font-semibold tabular-nums text-brand-dark">
                  {formatNumber(line.jumlah_order)} unit
                </span>
                {recommendation?.ai_priority && recommendation.ai_reason ? (
                  <p className="mt-1 break-words text-xs leading-5 text-brand-muted">
                    Prioritas Gemini: {recommendation.ai_priority.toLowerCase()}. {recommendation.ai_reason}
                  </p>
                ) : null}
              </div>
            </li>
          )
        })
      )}
    </ul>
  )
}
