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
    description: 'Semua PO sudah diputuskan. Draf baru muncul setelah pemindaian berikutnya.',
  },
  SENT: {
    title: 'Belum ada PO terkirim',
    description: 'PO berubah menjadi terkirim setelah manajer menyetujui tautan di email.',
  },
  REJECTED: {
    title: 'Belum ada PO ditolak',
    description: 'PO yang ditolak manajer akan tercatat di sini.',
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

  const items = data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat PO"
        subtitle="Semua Purchase Order beserta status persetujuan dan dokumen PDF-nya."
      />

      <FilterTabs options={PO_FILTERS} active={status} basePath="/po-log" label="Filter status PO" />

      {error ? <ErrorState message={error} onRetry={refetch} /> : null}

      <section className="rounded-2xl border border-brand-dark/10 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-1 border-b border-brand-dark/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-extrabold tracking-tight">Daftar Purchase Order</h2>
          {!loading && !error ? (
            <p className="text-xs font-medium text-brand-muted">
              {formatNumber(items.length)} PO ditampilkan
            </p>
          ) : null}
        </div>

        <div className="pt-4">
          {loading ? (
            <TableSkeleton label="Memuat riwayat PO" columns={5} />
          ) : error ? (
            <p className="py-6 text-sm text-brand-muted">
              Tabel tidak dapat ditampilkan karena data gagal dimuat.
            </p>
          ) : items.length === 0 ? (
            <EmptyState
              title={EMPTY_COPY[status].title}
              description={EMPTY_COPY[status].description}
              action={
                <Link
                  to="/stok"
                  className="inline-flex min-h-11 items-center rounded-xl border border-brand-dark/15 bg-white px-4 text-sm font-semibold text-brand-dark hover:bg-brand-cream"
                >
                  Buka Data Stok
                </Link>
              }
            />
          ) : (
            <POLogTable items={items} onSelect={setSelected} />
          )}
        </div>
      </section>

      <DetailDialog
        open={selected !== null}
        title={selected?.nomor_po ?? 'Detail Purchase Order'}
        description="Persetujuan dilakukan manajer lewat tautan sekali pakai di email. Status di halaman ini mengikuti hasilnya."
        onClose={() => setSelected(null)}
        rows={
          selected
            ? [
                { label: 'Nomor PO', value: <span className="font-mono text-xs">{selected.nomor_po}</span> },
                { label: 'Pemasok', value: selected.pemasok?.nama ?? '-' },
                { label: 'Email pemasok', value: selected.pemasok?.email ?? '-' },
                { label: 'Status', value: <StatusBadge status={selected.status} /> },
                { label: 'Dibuat', value: formatDateWIB(selected.created_at) },
                { label: 'Diperbarui', value: formatDateWIB(selected.updated_at) },
              ]
            : []
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-dark/15 bg-white px-4 text-sm font-semibold text-brand-dark hover:bg-brand-cream"
            >
              Tutup
            </button>
            {selected?.tautan_pdf ? (
              <a
                href={selected.tautan_pdf}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-strong"
              >
                Lihat PDF
              </a>
            ) : (
              <span className="inline-flex min-h-11 items-center justify-center rounded-xl border border-dashed border-brand-dark/20 px-4 text-sm font-medium text-brand-muted">
                PDF belum tersedia
              </span>
            )}
          </>
        }
      />
    </div>
  )
}
