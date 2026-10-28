import { useState } from 'react'
import type { FormEvent } from 'react'
import toast from 'react-hot-toast'
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!item || pending) return

    const value = Number(newStock)
    if (newStock.trim() === '' || !Number.isInteger(value) || value < 0) {
      toast.error('Stok hasil opname harus angka bulat minimal 0')
      return
    }
    if (value === item.stok_saat_ini) {
      toast.error('Stok hasil opname sama dengan stok saat ini')
      return
    }

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
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-dark/15 bg-white px-4 text-sm font-semibold text-brand-dark hover:bg-brand-cream disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="submit"
            form="opname-form"
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-strong disabled:opacity-60"
          >
            {pending ? 'Menyimpan...' : 'Simpan Koreksi'}
          </button>
        </>
      }
    >
      {item ? (
        <form id="opname-form" className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="rounded-xl border border-brand-dark/10 bg-brand-cream/40 px-4 py-3">
            <p className="font-mono text-xs font-semibold text-brand-muted">{item.sku}</p>
            <p className="mt-0.5 text-sm font-bold text-brand-dark">{item.nama}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-brand-muted">
                Stok saat ini
              </p>
              <p className="mt-1.5 rounded-xl border border-brand-dark/10 bg-brand-cream/40 px-3 py-2.5 text-sm font-semibold text-brand-dark">
                {formatNumber(item.stok_saat_ini)} unit
              </p>
            </div>

            <div>
              <label
                htmlFor="opname-stock"
                className="block text-[11px] font-bold uppercase tracking-wide text-brand-muted"
              >
                Stok hasil opname
              </label>
              <input
                id="opname-stock"
                name="stok_saat_ini"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                data-autofocus
                value={newStock}
                onChange={(event) => setNewStock(event.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-brand-dark/20 bg-white px-3 py-2.5 text-sm text-brand-dark focus:border-brand-orange"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="opname-reason"
              className="block text-[11px] font-bold uppercase tracking-wide text-brand-muted"
            >
              Alasan koreksi
            </label>
            <select
              id="opname-reason"
              name="alasan"
              value={reason}
              onChange={(event) => setReason(event.target.value as OpnameReason)}
              className="mt-1.5 block w-full rounded-xl border border-brand-dark/20 bg-white px-3 py-2.5 text-sm text-brand-dark focus:border-brand-orange"
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
