import type { POStatus } from '../types/po'
import type { StockStatus } from '../types/stok'

type BadgeStatus = StockStatus | POStatus

const LABELS: Record<BadgeStatus, string> = {
  NORMAL: 'NORMAL',
  LOW_STOCK: 'LOW STOCK',
  REQUIRES_MANUAL_REVIEW: 'REVIEW NEEDED',
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  REJECTED: 'REJECTED',
}

const STYLES: Record<BadgeStatus, string> = {
  NORMAL: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  LOW_STOCK: 'border-rose-200 bg-rose-50 text-rose-800',
  REQUIRES_MANUAL_REVIEW: 'border-purple-200 bg-purple-50 text-purple-800',
  DRAFT: 'border-amber-200 bg-amber-50 text-amber-900',
  SENT: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-800',
}

export function StatusBadge({ status }: { status: BadgeStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-bold tracking-wide ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  )
}
