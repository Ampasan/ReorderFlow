import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { PageHeader } from '../../components/PageHeader'
import { invalidateResourceCache } from '../../hooks/useResource'
import { submitDraft, updateDraft } from '../../services/poService'
import type { POLog } from '../../types/po'
import type { StockItem } from '../../types/stok'
import { formatNumber } from '../../utils/formatter'
import { DraftActions } from './DraftActions'
import { DraftAddItem } from './DraftAddItem'
import { DraftLineRow } from './DraftLineRow'
import { DraftReadOnlyList } from './DraftReadOnlyList'
import { DraftStatusBanner } from './DraftStatusBanner'
import { errorMessage, isEditableStatus, isResubmitStatus } from './draftCopy'
import { useDraftLines } from './useDraftLines'

export interface DraftFormProps {
  po: POLog
  stockData: StockItem[] | null
  stockLoading: boolean
  stockError: string | null
  onRetryStock: () => void
  onRefresh: () => void
  backLink: ReactNode
}

export function DraftForm({
  po,
  stockData,
  stockLoading,
  stockError,
  onRetryStock,
  onRefresh,
  backLink,
}: DraftFormProps) {
  const navigate = useNavigate()
  const {
    lines,
    stockBySku,
    addable,
    activeSku,
    setSelectedSku,
    totalQty,
    handleQuantityChange,
    handleRemove,
    handleAdd,
  } = useDraftLines(po, stockData)

  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const busy = saving || submitting
  const isEditable = isEditableStatus(po.status)
  const isResubmit = isResubmitStatus(po.status)
  const canAct = isEditable && lines.length > 0 && !busy
  const recommendationsBySku = new Map((po.details ?? []).map((detail) => [detail.sku, detail]))
  const hasAiRecommendations = (po.details ?? []).some((detail) => detail.ai_priority && detail.ai_reason)

  const title =
    po.status === 'REJECTED'
      ? 'Revisi PO Ditolak'
      : po.status === 'REQUIRES_MANUAL_REVIEW'
        ? 'Proses Ulang PO'
        : 'Periksa Draf PO'

  async function handleSave() {
    if (!canAct) {
      toast.error('Tambahkan minimal satu barang sebelum menyimpan.')
      return
    }

    setSaving(true)
    setActionError(null)
    try {
      await updateDraft(po.id, lines)
      invalidateResourceCache('po')
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
      invalidateResourceCache('po')
      invalidateResourceCache('dashboard')
      toast.success(
        isResubmit
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
        title={title}
        subtitle={`${po.nomor_po} untuk ${po.pemasok?.nama ?? '-'}`}
        actions={backLink}
      />

      <DraftStatusBanner po={po} />

      <section className="rounded-xl border border-brand-dark/10 bg-white">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-brand-dark/8 px-5 py-4">
          <h2 className="font-display text-sm font-semibold text-brand-dark">Barang dalam draf</h2>
          <span className="text-xs font-medium text-brand-muted">
            {formatNumber(lines.length)} barang, {formatNumber(totalQty)} unit
          </span>
        </div>
        {hasAiRecommendations ? (
          <p className="border-b border-brand-dark/8 px-5 py-3 text-xs leading-5 text-brand-muted">
            Prioritas Gemini adalah saran berdasarkan stok saat pemindaian. Jumlah awal mengikuti
            minimum order; admin dapat meninjau dan mengubahnya selama draf masih bisa diedit.
          </p>
        ) : null}

        {isEditable ? (
          <div className="p-4 sm:p-5">
            {lines.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <p className="font-display text-sm font-bold text-brand-dark">Draf ini belum punya barang</p>
                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-brand-muted">
                  Tambahkan barang dari daftar di bawah. Draf tanpa barang tidak bisa dikirim ke
                  manajer.
                </p>
              </div>
            ) : (
              <ul className="space-y-3" role="list">
                {lines.map((line) => (
                  <DraftLineRow
                    key={line.sku}
                    line={line}
                    recommendation={recommendationsBySku.get(line.sku)}
                    stock={stockBySku.get(line.sku)}
                    busy={busy}
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleRemove}
                  />
                ))}
              </ul>
            )}

            <DraftAddItem
              addable={addable}
              activeSku={activeSku}
              busy={busy}
              stockLoading={stockLoading}
              stockError={stockError}
              onSelect={setSelectedSku}
              onAdd={handleAdd}
              onRetryStock={onRetryStock}
            />
          </div>
        ) : (
          <DraftReadOnlyList
            lines={lines}
            stockBySku={stockBySku}
            recommendationsBySku={recommendationsBySku}
          />
        )}
      </section>

      {isEditable ? (
        <DraftActions
          saving={saving}
          canAct={canAct}
          isResubmit={isResubmit}
          onSave={handleSave}
          onSubmit={() => setConfirmOpen(true)}
        />
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
        title={
          isResubmit
            ? 'Kirim ulang PO ini ke manajer?'
            : 'Kirim draf ini ke manajer?'
        }
        description={
          isResubmit
            ? 'Email persetujuan baru akan dikirim ke manajer dengan tautan baru. Tautan lama tidak berlaku, dan pemasok baru menerima PO setelah manajer menyetujui.'
            : 'Email persetujuan akan dikirim ke manajer. Setelah terkirim, draf tidak bisa diedit lagi dan pemasok baru menerima PO setelah manajer menyetujui.'
        }
        confirmLabel={isResubmit ? 'Ya, kirim ulang' : 'Ya, kirim ke manajer'}
        pending={submitting}
        onConfirm={handleSubmit}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  )
}
