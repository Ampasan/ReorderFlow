import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DetailDialog } from '../components/DetailDialog'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { FilterTabs } from '../components/FilterTabs'
import { POLogTable } from '../components/POLogTable'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { TableSkeleton } from '../components/TableSkeleton'
import { useAuth } from '../hooks/useAuth'
import { usePOLog } from '../hooks/usePOLog'
import type { POFilter, POLog } from '../types/po'
import { PO_FILTERS, isPOFilter } from '../utils/constants'
import { formatDateWIB, formatNumber } from '../utils/formatter'

const EMPTY_COPY: Record<POFilter, { title: string; description: string }> = {
  all: {
    title: 'Belum ada riwayat Purchase Order',
    description:
      'PO muncul di sini setelah pemindaian menemukan produk di bawah ROP dan sistem membuat draf per pemasok.',
  },
  DRAFT: {
    title: 'Tidak ada PO berstatus draf',
    description:
      'Draf baru muncul setelah pemindaian menemukan produk di bawah ROP. Draf bisa diperiksa dan diedit sebelum dikirim ke manajer.',
  },
  PENDING_APPROVAL: {
    title: 'Belum ada PO yang menunggu persetujuan',
    description: 'PO berstatus ini sudah dikirim ke email manajer dan menunggu keputusan.',
  },
  SENT: {
    title: 'Belum ada PO terkirim',
    description: 'PO berubah menjadi terkirim setelah manajer menyetujui tautan di email.',
  },
  REJECTED: {
    title: 'Belum ada PO ditolak',
    description:
      'PO yang ditolak manajer muncul di sini. Buka detailnya untuk merevisi lalu mengirim ulang.',
  },
  REQUIRES_MANUAL_REVIEW: {
    title: 'Tidak ada PO yang perlu tinjauan',
    description:
      'Status ini dipakai ketika email pemasok gagal dikirim, token kedaluwarsa, atau PDF tidak dapat diunduh.',
  },
}

export function POLogList() {
  const [params] = useSearchParams()
  const rawStatus = params.get('status')
  const status: POFilter = isPOFilter(rawStatus) ? rawStatus : 'all'

  const { data, loading, error, refetch } = usePOLog(status)
  const [selected, setSelected] = useState<POLog | null>(null)
  const { user } = useAuth()

  const items = data ?? []
  const canEdit = user?.role === 'admin'

  return (
    <div className="space-y-5">
      <PageHeader
        title="Riwayat PO"
        subtitle="Semua Purchase Order beserta status persetujuan dan dokumen PDF-nya."
      />

      <FilterTabs options={PO_FILTERS} active={status} basePath="/po-log" label="Filter status PO" />

      {error ? <ErrorState message={error} onRetry={refetch} /> : null}

      <section className="rounded-xl border border-brand-dark/10 bg-white">
        <div className="flex items-center justify-between border-b border-brand-dark/8 px-5 py-4">
          <h2 className="text-sm font-semibold text-brand-dark">Daftar Purchase Order</h2>
          {!loading && !error ? (
            <span className="text-xs font-medium text-brand-muted">
              {formatNumber(items.length)} PO
            </span>
          ) : null}
        </div>

        <div className="px-1 py-2">
          {loading ? (
            <div className="px-3 py-2">
              <TableSkeleton label="Memuat riwayat PO" columns={5} />
            </div>
          ) : error ? (
            <p className="px-5 py-8 text-sm text-brand-muted">
              Tabel tidak dapat ditampilkan karena data gagal dimuat.
            </p>
          ) : items.length === 0 ? (
            <EmptyState
              title={EMPTY_COPY[status].title}
              description={EMPTY_COPY[status].description}
              action={
                <Link
                  to="/stok"
                  className="inline-flex h-10 items-center rounded-lg border border-brand-dark/15 bg-white px-4 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-cream"
                >
                  Buka Data Stok
                </Link>
              }
            />
          ) : (
            <POLogTable items={items} onSelect={setSelected} canEdit={canEdit} />
          )}
        </div>
      </section>

      <DetailDialog
        open={selected !== null}
        title={selected?.nomor_po ?? 'Detail Purchase Order'}
        description="Draf bisa diperiksa dan diedit dulu sebelum dikirim ke manajer. PO yang ditolak manajer bisa direvisi lalu dikirim ulang. Persetujuan dilakukan lewat tautan sekali pakai di email."
        onClose={() => setSelected(null)}
        rows={
          selected
            ? [
                { label: 'Nomor PO', value: <span className="font-mono text-xs">{selected.nomor_po}</span> },
                { label: 'Pemasok', value: selected.pemasok?.nama ?? '-' },
                { label: 'Email pemasok', value: selected.pemasok?.email ?? '-' },
                { label: 'Status', value: <StatusBadge status={selected.status} /> },
                { label: 'Dibuat', value: formatDateWIB(selected.created_at) },
                { label: 'Dikirim ke manajer', value: formatDateWIB(selected.submitted_at) },
                { label: 'Diperbarui', value: formatDateWIB(selected.updated_at) },
              ]
            : []
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-brand-dark/15 bg-white px-5 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-cream"
            >
              Tutup
            </button>
            {selected?.status === 'DRAFT' || selected?.status === 'REJECTED' ? (
              canEdit ? (
                <Link
                  to={`/po-log/${selected.id}/draft`}
                  onClick={() => setSelected(null)}
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-orange px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-strong"
                >
                  {selected.status === 'REJECTED' ? 'Revisi Draf' : 'Edit Draf'}
                </Link>
              ) : null
            ) : null}
            {selected?.tautan_pdf ? (
              <a
                href={selected.tautan_pdf}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-orange px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-strong"
              >
                Lihat PDF
              </a>
            ) : (
              <span className="inline-flex h-11 items-center justify-center rounded-lg border border-dashed border-brand-dark/20 px-5 text-sm font-medium text-brand-muted">
                PDF belum tersedia
              </span>
            )}
          </>
        }
      />
    </div>
  )
}
