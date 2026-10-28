import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DetailDialog } from '../components/DetailDialog'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { FilterTabs } from '../components/FilterTabs'
import { OpnameDialog } from '../components/OpnameDialog'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { StockTable } from '../components/StockTable'
import { TableSkeleton } from '../components/TableSkeleton'
import { PlusIcon } from '../components/icons'
import { useAuth } from '../hooks/useAuth'
import { useScan } from '../hooks/useScan'
import { useStock } from '../hooks/useStock'
import { useStockCorrection } from '../hooks/useStockCorrection'
import type { OpnameReason, StockFilter, StockItem } from '../types/stok'
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
  const [opnameItem, setOpnameItem] = useState<StockItem | null>(null)
  const { scan, pending } = useScan(refetch)
  const { correct, pending: opnamePending } = useStockCorrection(refetch)
  const { user } = useAuth()
  const canScan = user?.role === 'admin'

  const items = data ?? []

  async function handleScan() {
    const success = await scan()
    if (success) setConfirmOpen(false)
  }

  async function handleOpname(stokSaatIni: number, alasan: OpnameReason) {
    if (!opnameItem) return
    const success = await correct(opnameItem.sku, { stok_saat_ini: stokSaatIni, alasan })
    if (success) setOpnameItem(null)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Data Stok"
        subtitle="Seluruh SKU beserta stok saat ini, Reorder Point, dan pemasoknya."
        actions={
          canScan ? (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-orange px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-strong"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Pindai Stok
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

      <section className="rounded-xl border border-brand-dark/10 bg-white">
        <div className="flex items-center justify-between border-b border-brand-dark/8 px-5 py-4">
          <h2 className="text-sm font-semibold text-brand-dark">Daftar SKU</h2>
          {!loading && !error ? (
            <span className="text-xs font-medium text-brand-muted">
              {formatNumber(items.length)} produk
            </span>
          ) : null}
        </div>

        <div className="px-1 py-2">
          {loading ? (
            <div className="px-3 py-2">
              <TableSkeleton label="Memuat data stok" columns={7} />
            </div>
          ) : error ? (
            <p className="px-5 py-8 text-sm text-brand-muted">
              Tabel tidak dapat ditampilkan karena data gagal dimuat.
            </p>
          ) : items.length === 0 ? (
            <EmptyState
              title={EMPTY_COPY[status].title}
              description={EMPTY_COPY[status].description}
            />
          ) : (
            <StockTable items={items} onSelect={setSelected} onOpname={canScan ? setOpnameItem : undefined} />
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
                { label: 'Diperbarui', value: formatDateWIB(selected.updated_at) },
              ]
            : []
        }
      />

      <OpnameDialog
        key={opnameItem?.sku ?? 'closed'}
        open={opnameItem !== null}
        item={opnameItem}
        pending={opnamePending}
        onConfirm={handleOpname}
        onClose={() => setOpnameItem(null)}
      />
    </div>
  )
}
