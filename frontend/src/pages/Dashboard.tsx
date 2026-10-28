import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DetailDialog } from '../components/DetailDialog'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { KpiCard } from '../components/KpiCard'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { StockTable } from '../components/StockTable'
import { TableSkeleton } from '../components/TableSkeleton'
import { CalendarIcon, PlusIcon, WarningIcon } from '../components/icons'
import { useAuth } from '../hooks/useAuth'
import { useDashboard } from '../hooks/useDashboard'
import { useScan } from '../hooks/useScan'
import type { StockItem } from '../types/stok'
import { formatDateWIB, formatLongDate, formatNumber } from '../utils/formatter'

const SCAN_DESCRIPTION =
  'Sistem memindai stok dan membuat draf PO untuk produk yang berada di bawah ROP, dikelompokkan per pemasok. Produk yang sudah punya PO aktif akan dilewati.'

export function Dashboard() {
  const { data, loading, error, refetch } = useDashboard()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selected, setSelected] = useState<StockItem | null>(null)
  const { scan, pending } = useScan(refetch)
  const { user } = useAuth()

  const canScan = user?.role === 'admin'

  const summary = data?.summary
  const lowStock = data?.lowStock ?? []
  const preview = lowStock.slice(0, 5)

  async function handleScan() {
    const success = await scan()
    if (success) setConfirmOpen(false)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ringkasan Operasional"
        subtitle="Pantau stok harian dan status persetujuan PO."
        actions={
          <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-brand-dark/10 bg-white px-3 text-xs font-medium text-brand-muted">
            <CalendarIcon className="h-3.5 w-3.5" />
            {formatLongDate()}
          </span>
        }
      />

      {error ? <ErrorState message={error} onRetry={refetch} /> : null}

      {/* Low-stock alert banner */}
      {!error && summary && summary.low_stock_count > 0 ? (
        <section className="flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <WarningIcon className="h-4 w-4" />
            </span>
            <p className="text-sm font-medium text-amber-900">
              <span className="font-semibold">{formatNumber(summary.low_stock_count)} produk</span> di bawah Reorder Point dan perlu dipesan ulang.
            </p>
          </div>
          {canScan ? (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-lg bg-brand-orange px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-strong sm:self-auto"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Buat PO Sekaligus
            </button>
          ) : null}
        </section>
      ) : null}

      {/* Manual review banner */}
      {!error && summary && summary.manual_review > 0 ? (
        <section className="flex flex-col gap-3 rounded-xl border border-purple-200 bg-purple-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-purple-800">
            <span className="font-semibold">{formatNumber(summary.manual_review)} produk</span> punya data stok tidak wajar dan dilewati dari pembuatan PO otomatis.
          </p>
          <Link
            to="/stok?status=manual"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-purple-200 bg-white px-4 text-sm font-semibold text-purple-700 transition-colors hover:bg-purple-50"
          >
            Periksa Data
          </Link>
        </section>
      ) : null}

      {/* KPI cards */}
      {error ? null : (
        <section
          className="grid grid-cols-2 gap-3 xl:grid-cols-4"
          aria-label="Ringkasan angka"
        >
          {loading || !summary ? (
            <>
              <p role="status" className="sr-only">Memuat ringkasan operasional</p>
              {[0, 1, 2, 3].map((key) => (
                <div key={key} className="rounded-xl border border-brand-dark/10 bg-white px-5 py-5">
                  <div className="skeleton-bar h-3 w-24" />
                  <div className="skeleton-bar mt-5 h-7 w-20" />
                </div>
              ))}
            </>
          ) : (
            <>
              <KpiCard
                label="Total Produk (SKU)"
                value={`${formatNumber(summary.total_sku)} SKU`}
                hint="Seluruh SKU yang dipantau"
              />
              <KpiCard
                label="Stok Rendah"
                value={`${formatNumber(summary.low_stock_count)} SKU`}
                hint="Di bawah Reorder Point"
                tone="alert"
              />
              <KpiCard
                label="Draf PO Menunggu"
                value={`${formatNumber(summary.pending_po_count)} PO`}
                hint="Menunggu persetujuan manajer"
                tone="warning"
              />
              <KpiCard
                label="PO Terkirim"
                value={`${formatNumber(summary.sent_po_count)} PO`}
                hint="Sudah diteruskan ke pemasok"
                tone="success"
              />
            </>
          )}
        </section>
      )}

      {/* Low stock preview table */}
      <section className="rounded-xl border border-brand-dark/10 bg-white">
        <div className="flex items-center justify-between border-b border-brand-dark/8 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-brand-dark">Stok di bawah ROP</h2>
            <p className="mt-0.5 text-xs text-brand-muted">
              Produk yang mencapai atau di bawah Reorder Point.
            </p>
          </div>
          {!loading && !error && lowStock.length > 0 ? (
            <Link
              to="/stok?status=low"
              className="text-xs font-semibold text-brand-orange hover:text-brand-orange-strong hover:underline underline-offset-2"
            >
              Lihat semua ({formatNumber(lowStock.length)})
            </Link>
          ) : null}
        </div>

        <div className="px-1 py-2">
          {loading ? (
            <div className="px-3 py-2">
              <TableSkeleton label="Memuat produk di bawah ROP" columns={5} />
            </div>
          ) : error ? (
            <p className="px-5 py-8 text-sm text-brand-muted">
              Daftar low stock tidak tersedia karena data gagal dimuat.
            </p>
          ) : preview.length === 0 ? (
            <EmptyState
              title="Semua stok di atas ROP"
              description="Tidak ada produk yang perlu dipesan ulang saat ini."
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
            <StockTable items={preview} compact onSelect={setSelected} />
          )}
        </div>

        {!loading && !error && lowStock.length > 0 ? (
          <div className="border-t border-brand-dark/8 px-5 py-3">
            <p className="text-xs text-brand-muted">
              Menampilkan {preview.length} dari {lowStock.length} produk di bawah ROP.
            </p>
          </div>
        ) : null}
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Buat draf PO sekaligus?"
        description={SCAN_DESCRIPTION}
        confirmLabel="Ya, buat draf PO"
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
    </div>
  )
}
