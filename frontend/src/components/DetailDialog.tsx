import type { ReactNode } from 'react'
import { Modal } from './Modal'

export interface DetailRow {
  label: string
  value: ReactNode
}

interface DetailDialogProps {
  open: boolean
  title: string
  description?: string
  rows: DetailRow[]
  footer?: ReactNode
  onClose: () => void
}

export function DetailDialog({ open, title, description, rows, footer, onClose }: DetailDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      footer={
        footer ?? (
          <button
            type="button"
            data-autofocus
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-brand-dark/15 bg-white px-5 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-cream"
          >
            Tutup
          </button>
        )
      }
    >
      <dl className="divide-y divide-brand-dark/8 rounded-lg border border-brand-dark/8 bg-brand-cream/30 overflow-hidden">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 px-4 py-3">
            <dt className="flex-shrink-0 text-xs font-medium text-brand-muted">{row.label}</dt>
            <dd className="text-sm font-medium text-brand-dark text-right">{row.value}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  )
}
