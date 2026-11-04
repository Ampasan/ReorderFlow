import type { DraftItemInput, PODetail } from '../../types/po'
import type { StockItem } from '../../types/stok'
import { formatNumber } from '../../utils/formatter'

interface DraftLineRowProps {
  line: DraftItemInput
  recommendation?: PODetail
  stock?: StockItem
  busy: boolean
  onQuantityChange: (sku: string, value: string) => void
  onRemove: (sku: string) => void
}

export function DraftLineRow({
  line,
  recommendation,
  stock,
  busy,
  onQuantityChange,
  onRemove,
}: DraftLineRowProps) {
  return (
    <li className="rounded-lg border border-brand-dark/8 bg-brand-cream/25 px-3 py-3 sm:px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-xs font-medium text-brand-dark">{line.sku}</p>
          <p className="mt-0.5 truncate text-sm font-medium text-brand-dark">
            {stock?.nama ?? 'Nama barang tidak ditemukan'}
          </p>
          <p className="mt-0.5 text-xs text-brand-muted">
            {stock
              ? `Stok ${formatNumber(stock.stok_saat_ini)} unit, min order ${formatNumber(stock.qty_min_order)} unit`
              : 'Data stok barang ini tidak tersedia'}
          </p>
          {recommendation?.ai_priority && recommendation.ai_reason ? (
            <div className="mt-2 space-y-0.5">
              <p className="text-xs font-semibold text-brand-orange-strong">
                Prioritas Gemini: {recommendation.ai_priority.toLowerCase()}
              </p>
              <p className="break-words text-xs leading-5 text-brand-muted">{recommendation.ai_reason}</p>
            </div>
          ) : null}
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label
              htmlFor={`qty-${line.sku}`}
              className="block text-[11px] font-semibold text-brand-muted"
            >
              Qty order
            </label>
            <input
              id={`qty-${line.sku}`}
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={line.jumlah_order}
              disabled={busy}
              onChange={(event) => onQuantityChange(line.sku, event.target.value)}
              className="mt-1 h-11 w-24 rounded-lg border border-brand-dark/15 bg-white px-3 text-sm font-semibold tabular-nums text-brand-dark transition-colors focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/25 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
          <button
            type="button"
            onClick={() => onRemove(line.sku)}
            disabled={busy}
            className="h-11 rounded-lg border border-brand-dark/15 bg-white px-3 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-cream disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hapus
          </button>
        </div>
      </div>
    </li>
  )
}
