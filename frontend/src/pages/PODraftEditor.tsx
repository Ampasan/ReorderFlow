import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ErrorState } from '../components/ErrorState'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../hooks/useAuth'
import { useResource } from '../hooks/useResource'
import { getPO, submitDraft, updateDraft } from '../services/poService'
import { listStock } from '../services/stockService'
import type { DraftItemInput, POLog, POStatus } from '../types/po'
import type { StockItem } from '../types/stok'
import { formatDateWIB, formatNumber } from '../utils/formatter'

type EditableStatus = 'DRAFT' | 'REJECTED'

const LOCKED_COPY: Record<Exclude<POStatus, EditableStatus>, string> = {
  PENDING_APPROVAL:
    'Draf sudah dikirim ke manajer. Pemasok baru menerima PO setelah manajer menyetujui tautan di email.',
  SENT: 'PO sudah disetujui manajer dan dokumennya sudah dikirim ke email pemasok.',
  REQUIRES_MANUAL_REVIEW:
    'PO ini ditandai untuk peninjauan manual. Periksa data pemasok dan pengiriman email sebelum memproses ulang.',
}

function isEditableStatus(status: POStatus): status is EditableStatus {
  return status === 'DRAFT' || status === 'REJECTED'
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Terjadi kesalahan tidak terduga.'
}

interface DraftFormProps {
  po: POLog
  stockData: StockItem[] | null
  stockLoading: boolean
  stockError: string | null
  onRetryStock: () => void
  onRefresh: () => void
  backLink: ReactNode
}

function DraftForm({
  po,
  stockData,
  stockLoading,
  stockError,
  onRetryStock,
  onRefresh,
  backLink,
}: DraftFormProps) {
  const navigate = useNavigate()
  const [lines, setLines] = useState<DraftItemInput[]>(() =>
    (po.details ?? []).map((detail) => ({
      sku: detail.sku,
      jumlah_order: detail.jumlah_order,
    })),
  )
  const [selectedSku, setSelectedSku] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const stockBySku = useMemo(() => {
    const map = new Map<string, StockItem>()
    for (const item of stockData ?? []) {
      map.set(item.sku, item)
    }
    return map
  }, [stockData])

  const addable = useMemo(
    () =>
      (stockData ?? []).filter(
        (item) =>
          item.id_pemasok === po.id_pemasok &&
          !lines.some((line) => line.sku === item.sku),
      ),
    [stockData, po.id_pemasok, lines],
  )

  const activeSku = addable.some((item) => item.sku === selectedSku)
    ? selectedSku
    : (addable[0]?.sku ?? '')

  const totalQty = lines.reduce((total, line) => total + line.jumlah_order, 0)
  const busy = saving || submitting
  const isEditable = isEditableStatus(po.status)
  const isRejected = po.status === 'REJECTED'
  const lockedMessage = isEditableStatus(po.status) ? '' : LOCKED_COPY[po.status]
  const canAct = isEditable && lines.length > 0 && !busy

  function handleQuantityChange(sku: string, value: string) {
    const parsed = Math.floor(Number(value))
    const quantity = Number.isFinite(parsed) ? Math.max(1, parsed) : 1
    setLines((current) =>
      current.map((line) =>
        line.sku === sku ? { ...line, jumlah_order: quantity } : line,
      ),
    )
  }

  function handleRemove(sku: string) {
    setLines((current) => current.filter((line) => line.sku !== sku))
  }

  function handleAdd() {
    const item = addable.find((stock) => stock.sku === activeSku)
    if (!item) return
    setLines((current) => [
      ...current,
      {
        sku: item.sku,
        jumlah_order: item.qty_min_order > 0 ? item.qty_min_order : 1,
      },
    ])
    setSelectedSku('')
  }

  async function handleSave() {
    if (!canAct) {
      toast.error('Tambahkan minimal satu barang sebelum menyimpan.')
      return
    }

    setSaving(true)
    setActionError(null)
    try {
      await updateDraft(po.id, lines)
      toast.success('Perubahan tersimpan. Periksa lagi sebelum dikirim ke manajer.')
    } catch (err) {
      const message = errorMessage(err)
      setActionError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit() {
    if (!canAct) {
      toast.error('Tambahkan minimal satu barang sebelum mengirim.')
      return
    }

    setSubmitting(true)
    setActionError(null)
    try {
      await updateDraft(po.id, lines)
      await submitDraft(po.id)
      toast.success(
        isRejected
          ? 'PO dikirim ulang ke manajer untuk disetujui.'
          : 'Draf dikirim ke manajer untuk disetujui.',
      )
      setConfirmOpen(false)
      navigate('/po-log?status=PENDING_APPROVAL')
    } catch (err) {
      const message = errorMessage(err)
      setActionError(message)
      toast.error(message)
      setConfirmOpen(false)
      onRefresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        title={isRejected ? 'Revisi PO Ditolak' : 'Periksa Draf PO'}
        subtitle={`${po.nomor_po} untuk ${po.pemasok?.nama ?? '-'}`}
        actions={backLink}
      />

      {isEditable ? (
        <section
          className={`flex flex-col gap-3 rounded-xl border px-5 py-4 sm:flex-row sm:items-start sm:justify-between ${
            isRejected ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'
          }`}
        >
          <div className="min-w-0">
            <p
              className={`text-sm font-semibold ${
                isRejected ? 'text-rose-900' : 'text-amber-900'
              }`}
            >
              {isRejected
                ? 'PO ini dikembalikan manajer untuk direvisi.'
                : 'Draf ini belum dikirim ke manajer maupun pemasok.'}
            </p>
            <p
              className={`mt-1 text-sm leading-relaxed ${
                isRejected ? 'text-rose-800' : 'text-amber-800'
              }`}
            >
              {isRejected
                ? 'Periksa jumlah order, simpan perubahan, lalu kirim ulang ke manajer. Pemasok belum menerima dokumen ini dan tautan persetujuan lama sudah tidak berlaku.'
                : 'Periksa jumlah order, lalu kirim ke manajer. Pemasok baru menerima PO setelah manajer menyetujui tautan di email.'}
            </p>
          </div>
          <StatusBadge status={po.status} />
        </section>
      ) : (
        <section className="flex flex-col gap-3 rounded-xl border border-brand-dark/10 bg-white px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-dark">Draf ini sudah dikunci.</p>
            <p className="mt-1 text-sm leading-relaxed text-brand-muted">{lockedMessage}</p>
            {po.submitted_at ? (
              <p className="mt-2 text-xs text-brand-muted">
                Dikirim ke manajer: {formatDateWIB(po.submitted_at)}
              </p>
            ) : null}
          </div>
          <StatusBadge status={po.status} />
        </section>
      )}

      <section className="rounded-xl border border-brand-dark/10 bg-white">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-brand-dark/8 px-5 py-4">
          <h2 className="text-sm font-semibold text-brand-dark">Barang dalam draf</h2>
          <span className="text-xs font-medium text-brand-muted">
            {formatNumber(lines.length)} barang, {formatNumber(totalQty)} unit
          </span>
        </div>

        {isEditable ? (
          <div className="p-4 sm:p-5">
            {lines.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <p className="text-sm font-bold text-brand-dark">Draf ini belum punya barang</p>
                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-brand-muted">
                  Tambahkan barang dari daftar di bawah. Draf tanpa barang tidak bisa dikirim ke
                  manajer.
                </p>
              </div>
            ) : (
              <ul className="space-y-3" role="list">
                {lines.map((line) => {
                  const stock = stockBySku.get(line.sku)
                  return (
                    <li
                      key={line.sku}
                      className="rounded-lg border border-brand-dark/8 bg-brand-cream/25 px-3 py-3 sm:px-4"
                    >
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
                              onChange={(event) =>
                                handleQuantityChange(line.sku, event.target.value)
                              }
                              className="mt-1 h-11 w-24 rounded-lg border border-brand-dark/15 bg-white px-3 text-sm font-semibold tabular-nums text-brand-dark transition-colors focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/25 disabled:cursor-not-allowed disabled:opacity-60"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemove(line.sku)}
                            disabled={busy}
                            className="h-11 rounded-lg border border-brand-dark/15 bg-white px-3 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-cream disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            <div className="mt-5 border-t border-brand-dark/8 pt-4">
              <label
                htmlFor="tambah-barang"
                className="block text-xs font-semibold text-brand-muted"
              >
                Tambah barang dari pemasok ini
              </label>
              <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                <select
                  id="tambah-barang"
                  value={activeSku}
                  disabled={addable.length === 0 || busy}
                  onChange={(event) => setSelectedSku(event.target.value)}
                  className="h-11 w-full rounded-lg border border-brand-dark/15 bg-white px-3 text-sm text-brand-dark transition-colors focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/25 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
                >
                  {addable.length === 0 ? (
                    <option value="">Semua barang pemasok sudah ada di draf</option>
                  ) : (
                    addable.map((item) => (
                      <option key={item.sku} value={item.sku}>
                        {item.nama} ({item.sku})
                      </option>
                    ))
                  )}
                </select>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={addable.length === 0 || !activeSku || busy}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-brand-dark/15 bg-white px-4 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-cream disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Tambah barang
                </button>
              </div>
              {stockLoading ? (
                <p className="mt-2 text-xs text-brand-muted">Memuat daftar stok pemasok...</p>
              ) : stockError ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-rose-700">
                  <span>Daftar stok gagal dimuat, barang baru belum bisa ditambahkan.</span>
                  <button
                    type="button"
                    onClick={onRetryStock}
                    className="font-semibold underline underline-offset-2"
                  >
                    Coba lagi
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-brand-dark/8" role="list">
            {lines.length === 0 ? (
              <li className="px-5 py-6 text-sm text-brand-muted">
                Draf ini tidak memiliki barang.
              </li>
            ) : (
              lines.map((line) => {
                const stock = stockBySku.get(line.sku)
                return (
                  <li
                    key={line.sku}
                    className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-medium text-brand-dark">{line.sku}</p>
                      <p className="mt-0.5 truncate text-sm text-brand-dark">
                        {stock?.nama ?? 'Nama barang tidak ditemukan'}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-brand-dark">
                      {formatNumber(line.jumlah_order)} unit
                    </span>
                  </li>
                )
              })
            )}
          </ul>
        )}
      </section>

      {isEditable ? (
        <section
          aria-label="Aksi draf"
          className="flex flex-col gap-3 rounded-xl border border-brand-dark/10 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-xs leading-relaxed text-brand-muted">
            Perubahan ikut tersimpan saat Anda menekan{' '}
            {isRejected ? 'Kirim Ulang ke Manajer' : 'Kirim ke Manajer'}. Setelah terkirim, PO tidak
            bisa diedit sampai manajer memutuskan.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleSave}
              disabled={!canAct}
              aria-busy={saving}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-brand-dark/15 bg-white px-5 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-cream disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : isRejected ? 'Simpan Perubahan' : 'Simpan Draf'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={!canAct}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-orange px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRejected ? 'Kirim Ulang ke Manajer' : 'Kirim ke Manajer'}
            </button>
          </div>
        </section>
      ) : null}

      {actionError ? (
        <p
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {actionError}
        </p>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title={isRejected ? 'Kirim ulang PO ini ke manajer?' : 'Kirim draf ini ke manajer?'}
        description={
          isRejected
            ? 'Email persetujuan baru akan dikirim ke manajer dengan tautan baru. Tautan lama tidak berlaku, dan pemasok baru menerima PO setelah manajer menyetujui.'
            : 'Email persetujuan akan dikirim ke manajer. Setelah terkirim, draf tidak bisa diedit lagi dan pemasok baru menerima PO setelah manajer menyetujui.'
        }
        confirmLabel={isRejected ? 'Ya, kirim ulang' : 'Ya, kirim ke manajer'}
        pending={submitting}
        onConfirm={handleSubmit}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  )
}

export function PODraftEditor() {
  const { id } = useParams()
  const { user } = useAuth()
  const poId = Number(id)
  const validId = Number.isInteger(poId) && poId > 0
  const isAdmin = user?.role === 'admin'

  const fetchPO = useCallback(() => {
    if (!validId) return Promise.reject(new Error('ID draf PO tidak valid.'))
    return getPO(poId)
  }, [poId, validId])

  const fetchStock = useCallback(() => listStock('all'), [])

  const { data: po, loading, error, refetch } = useResource(fetchPO)
  const {
    data: stockData,
    loading: stockLoading,
    error: stockError,
    refetch: refetchStock,
  } = useResource(fetchStock)

  const backLink = (
    <Link
      to={
        po?.status === 'DRAFT'
          ? '/po-log?status=DRAFT'
          : po?.status === 'REJECTED'
            ? '/po-log?status=REJECTED'
            : '/po-log'
      }
      className="inline-flex h-9 items-center justify-center rounded-lg border border-brand-dark/12 bg-white px-3 text-xs font-semibold text-brand-dark transition-colors hover:bg-brand-cream"
    >
      Kembali ke Riwayat PO
    </Link>
  )

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <PageHeader title="Periksa Draf PO" actions={backLink} />
        <div className="rounded-xl border border-brand-dark/10 bg-white px-5 py-8 text-center">
          <p className="text-sm font-bold text-brand-dark">
            Hanya admin inventori yang dapat mengubah draf
          </p>
          <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-brand-muted">
            Akun manajer bersifat read-only. Persetujuan dilakukan lewat tautan Approve atau Reject
            di email.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <PageHeader title="Periksa Draf PO" actions={backLink} />
        <p role="status" className="sr-only">
          Memuat draf PO
        </p>
        <div className="rounded-xl border border-brand-dark/10 bg-white p-5">
          <div className="skeleton-bar h-4 w-40" />
          <div className="skeleton-bar mt-3 h-3 w-64" />
          <div className="mt-6 space-y-3">
            <div className="skeleton-bar h-14 w-full" />
            <div className="skeleton-bar h-14 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !po) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <PageHeader title="Periksa Draf PO" actions={backLink} />
        <ErrorState message={error ?? 'Draf PO tidak ditemukan.'} onRetry={refetch} />
      </div>
    )
  }

  return (
    <DraftForm
      key={po.id}
      po={po}
      stockData={stockData}
      stockLoading={stockLoading}
      stockError={stockError}
      onRetryStock={refetchStock}
      onRefresh={refetch}
      backLink={backLink}
    />
  )
}
