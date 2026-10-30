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
  children?: ReactNode
  onClose: () => void
}

export function DetailDialog({
  open,
  title,
  description,
  rows,
  footer,
  children,
  onClose,
}: DetailDialogProps) {
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
            className="inline-flex h-11 items-center justify-center rounded-lg border border-brand-dark/15 bg-white px-5 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-cream"
          >
            Tutup
          </button>
        )
      }
    >
      <dl className="divide-y divide-brand-dark/8 overflow-hidden rounded-lg border border-brand-dark/8 bg-brand-cream/30">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
          >
            <dt className="text-xs font-medium text-brand-muted">{row.label}</dt>
            <dd className="min-w-0 break-words text-sm font-medium text-brand-dark sm:text-right">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      {children ? <div className="mt-4">{children}</div> : null}
    </Modal>
  )
}
