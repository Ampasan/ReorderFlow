import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorState } from '../../components/ErrorState'
import { PageHeader } from '../../components/PageHeader'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAuth } from '../../hooks/useAuth'
import { useResource } from '../../hooks/useResource'
import { getPO } from '../../services/poService'
import { listStock } from '../../services/stockService'
import { DraftForm } from './DraftForm'

export function PODraftEditor() {
  useDocumentTitle('Periksa Draf PO | ReorderFlow')

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

  const { data: po, loading, error, refetch } = useResource(`po-draft:${poId}`, fetchPO)
  const {
    data: stockData,
    loading: stockLoading,
    error: stockError,
    refetch: refetchStock,
  } = useResource('stock:all', fetchStock)

  const backLink = (
    <div className="flex flex-wrap items-center gap-2">
      {po?.tautan_pdf ? (
        <a
          href={po.tautan_pdf}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center justify-center rounded-lg border border-brand-dark/12 bg-white px-3 text-xs font-semibold text-brand-dark transition-colors hover:bg-brand-cream"
        >
          Lihat PDF Dokumen
        </a>
      ) : null}
      <Link
        to={
          po?.status === 'DRAFT'
            ? '/po-log?status=DRAFT'
            : po?.status === 'REJECTED'
              ? '/po-log?status=REJECTED'
              : po?.status === 'REQUIRES_MANUAL_REVIEW'
                ? '/po-log?status=REQUIRES_MANUAL_REVIEW'
                : '/po-log'
        }
        className="inline-flex h-9 items-center justify-center rounded-lg border border-brand-dark/12 bg-white px-3 text-xs font-semibold text-brand-dark transition-colors hover:bg-brand-cream"
      >
        Kembali ke Riwayat PO
      </Link>
    </div>
  )

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <PageHeader title="Periksa Draf PO" actions={backLink} />
        <div className="rounded-xl border border-brand-dark/10 bg-white px-5 py-8 text-center">
          <p className="font-display text-sm font-bold text-brand-dark">
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
