import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { POLog, PenerimaanItemInput, PenerimaanView } from '../types/po'
import { formatDateWIB, formatNumber } from '../utils/formatter'
import { Modal } from './Modal'
import { StatusBadge } from './StatusBadge'

interface TerimaBarangDialogProps {
  open: boolean
  po: POLog | null
  view: PenerimaanView | null
  loading: boolean
  pending: boolean
  onConfirm: (items: PenerimaanItemInput[]) => void
  onClose: () => void
}

interface LineState {
  qty: string
  error: string | null
}

export function TerimaBarangDialog({
  open,
  po,
  view,
  loading,
  pending,
  onConfirm,
  onClose,
}: TerimaBarangDialogProps) {
  const [lines, setLines] = useState<Record<string, LineState>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const items = view?.items ?? []
  const firstOpenSku = useMemo(
    () => items.find((item) => item.sisa > 0)?.sku ?? '',
    [items],
  )

  useEffect(() => {
    if (!view) return
    const initial: Record<string, LineState> = {}
    for (const item of view.items) {
      initial[item.sku] = { qty: String(item.sisa), error: null }
    }
    setLines(initial)
    setFormError(null)
  }, [view])

  function updateQty(sku: string, raw: string, sisa: number) {
    let nextError: string | null = null
    if (raw.trim() !== '') {
      const value = Number(raw)
      if (!Number.isInteger(value)) {
        nextError = 'Isi dengan angka bulat.'
      } else if (value < 0) {
        nextError = 'Qty tidak boleh negatif.'
      } else if (value > sisa) {
        nextError = `Maksimal ${formatNumber(sisa)} unit.`
      }
    }

    setLines((current) => ({
      ...current,
      [sku]: { qty: raw, error: nextError },
    }))
    setFormError(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!view || pending) return

    const payload: PenerimaanItemInput[] = []
    let hasError = false
    let totalQty = 0

    for (const item of view.items) {
      const line = lines[item.sku]
      const raw = line?.qty.trim() ?? ''
      if (raw === '') continue

      const value = Number(raw)
      if (!Number.isInteger(value) || value < 0 || value > item.sisa) {
        hasError = true
        setLines((current) => ({
          ...current,
          [item.sku]: {
            qty: raw,
            error:
              value > item.sisa
                ? `Maksimal ${formatNumber(item.sisa)} unit.`
                : 'Isi dengan angka bulat minimal 0.',
          },
        }))
        continue
      }

      if (value > 0) {
        payload.push({ sku: item.sku, qty_diterima: value })
        totalQty += value
      }
    }

    if (hasError) {
      setFormError('Periksa kembali qty yang ditandai.')
      return
    }
    if (payload.length === 0 || totalQty === 0) {
      setFormError('Isi minimal satu barang dengan qty lebih dari 0.')
      return
    }

    setFormError(null)
    onConfirm(payload)
  }

  const description =
    'Catat jumlah barang yang benar-benar datang. Barang yang belum datang biarkan 0, sisanya bisa diterima lain kali.'

  return (
    <Modal
      open={open}
      size="lg"
      title="Terima Barang"
      description={description}
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
            form="terima-barang-form"
            disabled={pending || loading || !view || items.length === 0}
            aria-busy={pending}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-orange px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? 'Menyimpan...' : 'Simpan Penerimaan'}
          </button>
        </>
      }
    >
      {po ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-dark/8 bg-brand-cream/40 px-4 py-3">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-semibold text-brand-muted">{po.nomor_po}</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-brand-dark">
              {po.pemasok?.nama ?? 'Pemasok tidak tersedia'}
            </p>
          </div>
          <StatusBadge status={po.status} />
        </div>
      ) : null}

      {loading && !view ? (
        <p role="status" className="py-6 text-center text-sm text-brand-muted">
          Memuat data penerimaan...
        </p>
      ) : null}

      {!loading && !view ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Data penerimaan gagal dimuat. Tutup dialog lalu coba lagi.
        </p>
      ) : null}

      {view ? (
        <form id="terima-barang-form" onSubmit={handleSubmit} noValidate>
          <div className="-mx-5 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-brand-dark/8">
                  <th scope="col" className="px-4 py-2 text-xs font-semibold text-brand-muted">
                    Barang
                  </th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-semibold text-brand-muted">
                    Order
                  </th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-semibold text-brand-muted">
                    Diterima
                  </th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-semibold text-brand-muted">
                    Sisa
                  </th>
                  <th scope="col" className="px-4 py-2 text-right text-xs font-semibold text-brand-muted">
                    Qty datang
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-dark/5">
                {view.items.map((item) => {
                  const line = lines[item.sku] ?? { qty: '', error: null }
                  const done = item.sisa === 0
                  return (
                    <tr key={item.sku} className={done ? 'opacity-60' : undefined}>
                      <td className="px-4 py-3">
                        <p className="font-mono text-[11px] font-medium text-brand-dark">{item.sku}</p>
                        <p className="mt-0.5 text-xs text-brand-muted">{item.nama || '-'}</p>
                      </td>
                      <td className="px-3 py-3 text-right text-xs tabular-nums text-brand-muted">
                        {formatNumber(item.jumlah_order)}
                      </td>
                      <td className="px-3 py-3 text-right text-xs tabular-nums text-brand-muted">
                        {formatNumber(item.sudah_diterima)}
                      </td>
                      <td className="px-3 py-3 text-right text-xs font-semibold tabular-nums text-brand-dark">
                        {formatNumber(item.sisa)}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={item.sisa}
                          step={1}
                          disabled={pending || done}
                          data-autofocus={item.sku === firstOpenSku ? true : undefined}
                          aria-label={`Qty datang ${item.nama || item.sku}`}
                          aria-invalid={line.error ? true : undefined}
                          value={line.qty}
                          onChange={(event) => updateQty(item.sku, event.target.value, item.sisa)}
                          className={`h-11 w-24 rounded-lg border bg-white px-3 text-right text-sm font-semibold tabular-nums text-brand-dark transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-brand-cream/40 disabled:text-brand-muted ${
                            line.error
                              ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
                              : 'border-brand-dark/15 focus:border-brand-orange focus:ring-brand-orange/25'
                          }`}
                        />
                        {line.error ? (
                          <p role="alert" className="mt-1 text-[11px] font-medium text-rose-700">
                            {line.error}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {formError ? (
            <p
              role="alert"
              className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700"
            >
              {formError}
            </p>
          ) : null}

          {view.riwayat.length > 0 ? (
            <section aria-label="Riwayat penerimaan" className="mt-5 border-t border-brand-dark/8 pt-4">
              <h3 className="font-display text-xs font-semibold text-brand-dark">
                Penerimaan sebelumnya
              </h3>
              <ul className="mt-2 space-y-2" role="list">
                {view.riwayat.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-lg border border-brand-dark/8 bg-brand-cream/25 px-3 py-2.5"
                  >
                    <p className="text-[11px] font-medium text-brand-muted">
                      {formatDateWIB(entry.created_at)}
                    </p>
                    <ul className="mt-1 space-y-0.5" role="list">
                      {entry.items.map((line) => (
                        <li
                          key={`${entry.id}-${line.sku}`}
                          className="flex items-baseline justify-between gap-3 text-xs"
                        >
                          <span className="min-w-0 truncate text-brand-dark">
                            <span className="font-mono text-[11px] text-brand-muted">{line.sku}</span>{' '}
                            {line.nama || '-'}
                          </span>
                          <span className="whitespace-nowrap font-semibold tabular-nums text-brand-dark">
                            {formatNumber(line.qty_diterima)} unit
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </form>
      ) : null}
    </Modal>
  )
}
