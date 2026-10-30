import { useCallback, useMemo, useState } from 'react'
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
import { useResource } from '../hooks/useResource'
import { listStock } from '../services/stockService'
import type { POFilter, POLog } from '../types/po'
import type { StockItem } from '../types/stok'
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

  const items = useMemo(() => data ?? [], [data])
  const canEdit = user?.role === 'admin'

  const [supplierId, setSupplierId] = useState('all')

  const fetchStock = useCallback(() => listStock('all'), [])
  const { data: stockData } = useResource('stock:all', fetchStock, {
    enabled: selected !== null,
  })

  const suppliers = useMemo(() => {
    const map = new Map<number, { id: number; nama: string; count: number }>()
    for (const po of items) {
      if (!po.pemasok) continue
      const current = map.get(po.pemasok.id)
      if (current) {
        current.count += 1
      } else {
        map.set(po.pemasok.id, { id: po.pemasok.id, nama: po.pemasok.nama, count: 1 })
      }
    }
    return Array.from(map.values()).sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
  }, [items])

  const activeSupplierId = suppliers.some((supplier) => String(supplier.id) === supplierId)
    ? supplierId
    : 'all'

  const visibleItems =
    activeSupplierId === 'all'
      ? items
      : items.filter((po) => String(po.pemasok?.id) === activeSupplierId)

  const stockBySku = useMemo(() => {
    const map = new Map<string, StockItem>()
    for (const item of stockData ?? []) {
      map.set(item.sku, item)
    }
    return map
  }, [stockData])

  const selectedDetails = selected?.details ?? []
  const selectedTotalQty = selectedDetails.reduce(
    (total, detail) => total + detail.jumlah_order,
    0,
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title="Riwayat PO"
        subtitle="Semua Purchase Order beserta status persetujuan dan dokumen PDF-nya."
      />

      <FilterTabs options={PO_FILTERS} active={status} basePath="/po-log" label="Filter status PO" />

      {error ? <ErrorState message={error} onRetry={refetch} /> : null}

      <section className="rounded-xl border border-brand-dark/10 bg-white">
        <div className="flex flex-col gap-3 border-b border-brand-dark/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-semibold text-brand-dark">Daftar Purchase Order</h2>
            {!loading && !error ? (
              <span className="text-xs font-medium text-brand-muted">
                {formatNumber(visibleItems.length)} PO
              </span>
            ) : null}
          </div>
          {suppliers.length > 0 ? (
            <div className="flex items-center gap-2">
              <label
                htmlFor="filter-pemasok"
                className="whitespace-nowrap text-xs font-semibold text-brand-muted"
              >
                Pemasok
              </label>
              <select
                id="filter-pemasok"
                value={activeSupplierId}
                onChange={(event) => setSupplierId(event.target.value)}
                className="h-10 min-w-0 flex-1 rounded-lg border border-brand-dark/15 bg-white px-3 text-sm text-brand-dark transition-colors focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/15 sm:w-56 sm:flex-none"
              >
                <option value="all">Semua pemasok ({items.length})</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.nama} ({supplier.count})
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <div className="px-1 py-2">
          {loading ? (
            <div className="px-3 py-2">
              <TableSkeleton label="Memuat riwayat PO" columns={6} />
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
            <POLogTable items={visibleItems} onSelect={setSelected} canEdit={canEdit} />
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
      >
        {selected ? (
          <section aria-label="Barang dalam PO">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-xs font-semibold text-brand-dark">Barang dalam PO</h3>
              <span className="text-xs font-medium text-brand-muted">
                {formatNumber(selectedDetails.length)} barang, {formatNumber(selectedTotalQty)} unit
              </span>
            </div>
            {selectedDetails.length === 0 ? (
              <p className="mt-2 rounded-lg border border-dashed border-brand-dark/15 px-3 py-4 text-center text-xs text-brand-muted">
                PO ini belum memiliki barang.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-brand-dark/8 overflow-hidden rounded-lg border border-brand-dark/8">
                {selectedDetails.map((detail) => (
                  <li
                    key={detail.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] font-medium text-brand-dark">
                        {detail.sku}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-brand-dark">
                        {stockBySku.get(detail.sku)?.nama ?? 'Nama barang tidak tersedia'}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-sm font-semibold tabular-nums text-brand-dark">
                      {formatNumber(detail.jumlah_order)} unit
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </DetailDialog>
    </div>
  )
}
