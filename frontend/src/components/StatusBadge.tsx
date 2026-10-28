import type { POStatus } from '../types/po'
import type { StockStatus } from '../types/stok'

type BadgeStatus = StockStatus | POStatus

const LABELS: Record<BadgeStatus, string> = {
  NORMAL: 'Normal',
  LOW_STOCK: 'Low Stock',
  REQUIRES_MANUAL_REVIEW: 'Review',
  DRAFT: 'Draft',
  SENT: 'Sent',
  REJECTED: 'Rejected',
}

const STYLES: Record<BadgeStatus, string> = {
  NORMAL:
    'border-emerald-200 bg-emerald-50 text-emerald-700',
  LOW_STOCK:
    'border-amber-200 bg-amber-50 text-amber-800',
  REQUIRES_MANUAL_REVIEW:
    'border-purple-200 bg-purple-50 text-purple-700',
  DRAFT:
    'border-brand-dark/15 bg-brand-cream text-brand-muted',
  SENT:
    'border-brand-dark/30 bg-brand-dark text-white',
  REJECTED:
    'border-rose-200 bg-rose-50 text-rose-700',
}

export function StatusBadge({ status }: { status: BadgeStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  )
}
