import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  pending?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pending = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={() => {
        if (!pending) onClose()
      }}
      footer={
        <>
          <button
            type="button"
            data-autofocus
            onClick={onClose}
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-dark/15 bg-white px-4 text-sm font-semibold text-brand-dark hover:bg-brand-cream disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-strong disabled:opacity-60"
          >
            {pending ? 'Memproses pemindaian...' : confirmLabel}
          </button>
        </>
      }
    />
  )
}
