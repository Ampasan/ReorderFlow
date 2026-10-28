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
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-dark/15 bg-white px-4 text-sm font-semibold text-brand-dark hover:bg-brand-cream"
          >
            Tutup
          </button>
        )
      }
    >
      <dl className="divide-y divide-brand-dark/10 overflow-hidden rounded-xl border border-brand-dark/10 bg-brand-cream/30">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2.5">
            <dt className="text-[11px] font-bold uppercase tracking-wide text-brand-muted">{row.label}</dt>
            <dd className="text-sm font-medium text-brand-dark">{row.value}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  )
}
