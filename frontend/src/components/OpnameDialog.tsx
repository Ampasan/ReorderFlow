import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { OpnameReason, StockItem } from '../types/stok'
import { OPNAME_REASONS } from '../utils/constants'
import { formatNumber } from '../utils/formatter'
import { Modal } from './Modal'

interface OpnameDialogProps {
  open: boolean
  item: StockItem | null
  pending: boolean
  onConfirm: (stok_saat_ini: number, alasan: OpnameReason) => void
  onClose: () => void
}

export function OpnameDialog({ open, item, pending, onConfirm, onClose }: OpnameDialogProps) {
  const [newStock, setNewStock] = useState(() => (item ? String(item.stok_saat_ini) : ''))
  const [reason, setReason] = useState<OpnameReason>('DAMAGED')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!item || pending) return

    const value = Number(newStock)
    if (newStock.trim() === '' || !Number.isInteger(value) || value < 0) {
      setError('Stok hasil opname harus angka bulat minimal 0.')
      inputRef.current?.focus()
      return
    }
    if (value === item.stok_saat_ini) {
      setError('Stok hasil opname sama dengan stok saat ini.')
      inputRef.current?.focus()
      return
    }

    setError(null)
    onConfirm(value, reason)
  }

  return (
    <Modal
      open={open}
      title="Koreksi Stok Opname"
      description="Catat hasil hitung fisik untuk satu SKU. Nilai sebelum dan alasan tersimpan sebagai jejak audit."
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-brand-dark/15 bg-white px-5 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-cream disabled:cursor-not-allowed disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            form="opname-form"
            disabled={pending}
            aria-busy={pending}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-orange px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? 'Menyimpan...' : 'Simpan Koreksi'}
          </button>
        </>
      }
    >
      {item ? (
        <form id="opname-form" className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="rounded-lg border border-brand-dark/8 bg-brand-cream/40 px-4 py-3">
            <p className="font-mono text-[11px] font-semibold text-brand-muted">{item.sku}</p>
            <p className="mt-0.5 text-sm font-semibold text-brand-dark">{item.nama}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-brand-muted">Stok saat ini</p>
              <div className="mt-2 rounded-lg border border-brand-dark/8 bg-brand-cream/40 px-3 py-2.5 text-sm font-medium text-brand-dark">
                {formatNumber(item.stok_saat_ini)} unit
              </div>
            </div>

            <div>
              <label
                htmlFor="opname-stock"
                className="block text-xs font-semibold text-brand-muted"
              >
                Hasil opname
              </label>
              <input
                id="opname-stock"
                ref={inputRef}
                name="stok_saat_ini"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                data-autofocus
                disabled={pending}
                value={newStock}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'opname-stock-error' : undefined}
                onChange={(event) => {
                  setNewStock(event.target.value)
                  setError(null)
                }}
                className={`mt-2 block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-brand-dark focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-brand-cream/40 disabled:text-brand-muted ${
                  error
                    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
                    : 'border-brand-dark/15 focus:border-brand-orange focus:ring-brand-orange/15'
                }`}
              />
              {error ? (
                <p
                  id="opname-stock-error"
                  role="alert"
                  className="mt-1.5 text-xs font-medium text-rose-700"
                >
                  {error}
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <label
              htmlFor="opname-reason"
              className="block text-xs font-semibold text-brand-muted"
            >
              Alasan koreksi
            </label>
            <select
              id="opname-reason"
              name="alasan"
              value={reason}
              disabled={pending}
              onChange={(event) => setReason(event.target.value as OpnameReason)}
              className="mt-2 block w-full rounded-lg border border-brand-dark/15 bg-white px-3 py-2.5 text-sm text-brand-dark focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/15 disabled:cursor-not-allowed disabled:bg-brand-cream/40 disabled:text-brand-muted"
            >
              {OPNAME_REASONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </form>
      ) : null}
    </Modal>
  )
}
