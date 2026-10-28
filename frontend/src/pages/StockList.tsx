import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DetailDialog } from '../components/DetailDialog'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { FilterTabs } from '../components/FilterTabs'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { StockTable } from '../components/StockTable'
import { TableSkeleton } from '../components/TableSkeleton'
import { PlusIcon } from '../components/icons'
import { useAuth } from '../hooks/useAuth'
import { useScan } from '../hooks/useScan'
import { useStock } from '../hooks/useStock'
import type { StockFilter, StockItem } from '../types/stok'
import { STOCK_FILTERS, isStockFilter } from '../utils/constants'
import { formatDateWIB, formatNumber } from '../utils/formatter'

const SCAN_DESCRIPTION =
  'Sistem memindai stok dan membuat draf PO untuk produk yang berada di bawah ROP, dikelompokkan per pemasok. Produk yang sudah punya PO aktif akan dilewati.'

const EMPTY_COPY: Record<StockFilter, { title: string; description: string }> = {
  all: {
    title: 'Belum ada data inventori',
    description:
      'Tabel ini membaca seluruh SKU dari backend. Isi data stok terlebih dahulu, lalu jalankan pemindaian untuk melihat status ROP.',
  },
  low: {
    title: 'Tidak ada produk di bawah ROP',
    description:
      'Semua stok berada di atas Reorder Point. Jalankan pemindaian untuk memeriksa ulang data terbaru.',
  },
  manual: {
    title: 'Tidak ada produk yang perlu peninjauan',
    description:
      'Data stok saat ini wajar. Baris muncul di sini hanya jika stok negatif atau ROP dan min order tidak valid.',
  },
}

export function StockList() {
  const [params] = useSearchParams()
  const rawStatus = params.get('status')
  const status: StockFilter = isStockFilter(rawStatus) ? rawStatus : 'all'

  const { data, loading, error, refetch } = useStock(status)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selected, setSelected] = useState<StockItem | null>(null)
  const { scan, pending } = useScan(refetch)
  const { user } = useAuth()
  const canScan = user?.role === 'admin'

  const items = data ?? []

  async function handleScan() {
    const success = await scan()
    if (success) setConfirmOpen(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Stok"
        subtitle="Seluruh SKU beserta stok saat ini, Reorder Point, dan pemasoknya."
        actions={
          canScan ? (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-strong"
            >
              <PlusIcon />
              Pindai Stok Sekarang
            </button>
          ) : null
        }
      />

      <FilterTabs
        options={STOCK_FILTERS}
        active={status}
        basePath="/stok"
        label="Filter status stok"
      />

      {error ? <ErrorState message={error} onRetry={refetch} /> : null}

      <section className="rounded-2xl border border-brand-dark/10 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-1 border-b border-brand-dark/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-extrabold tracking-tight">Daftar SKU</h2>
          {!loading && !error ? (
            <p className="text-xs font-medium text-brand-muted">
              {formatNumber(items.length)} produk ditampilkan
            </p>
          ) : null}
        </div>

        <div className="pt-4">
          {loading ? (
            <TableSkeleton label="Memuat data stok" columns={7} />
          ) : error ? (
            <p className="py-6 text-sm text-brand-muted">
              Tabel tidak dapat ditampilkan karena data gagal dimuat.
            </p>
          ) : items.length === 0 ? (
            <EmptyState title={EMPTY_COPY[status].title} description={EMPTY_COPY[status].description} />
          ) : (
            <StockTable items={items} onSelect={setSelected} />
          )}
        </div>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Pindai stok sekarang?"
        description={SCAN_DESCRIPTION}
        confirmLabel="Ya, jalankan pemindaian"
        pending={pending}
        onConfirm={handleScan}
        onClose={() => setConfirmOpen(false)}
      />

      <DetailDialog
        open={selected !== null}
        title={selected?.nama ?? 'Detail produk'}
        description="PO dibuat per pemasok lewat pemindaian, bukan per produk."
        onClose={() => setSelected(null)}
        rows={
          selected
            ? [
                { label: 'SKU', value: <span className="font-mono text-xs">{selected.sku}</span> },
                { label: 'Pemasok', value: selected.pemasok?.nama ?? '-' },
                { label: 'Email pemasok', value: selected.pemasok?.email ?? '-' },
                { label: 'Stok saat ini', value: `${formatNumber(selected.stok_saat_ini)} unit` },
                { label: 'Reorder point', value: `${formatNumber(selected.reorder_point)} unit` },
                { label: 'Min order', value: `${formatNumber(selected.qty_min_order)} unit` },
                { label: 'Status', value: <StatusBadge status={selected.status} /> },
                {
                  label: 'Diperbarui',
                  value: formatDateWIB(selected.updated_at),
                },
              ]
            : []
        }
      />
    </div>
  )
}
