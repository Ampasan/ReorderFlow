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
import { ROLE_LABELS } from '../utils/constants'
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
  const roleLabel = user ? ROLE_LABELS[user.role] : null

  const summary = data?.summary
  const lowStock = data?.lowStock ?? []
  const preview = lowStock.slice(0, 5)

  async function handleScan() {
    const success = await scan()
    if (success) setConfirmOpen(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ringkasan Operasional"
        subtitle="Pantau stok harian dan status persetujuan PO dalam satu tempat."
        actions={
          <>
            <span className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-brand-dark/10 bg-white px-3 text-sm font-medium text-brand-dark">
              <CalendarIcon />
              {formatLongDate()}
            </span>
            {roleLabel ? (
              <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-brand-orange/25 bg-brand-orange/10 px-3 text-xs font-semibold text-brand-orange-strong">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" aria-hidden="true" />
                {roleLabel}
              </span>
            ) : null}
          </>
        }
      />

      {error ? <ErrorState message={error} onRetry={refetch} /> : null}

      {!error && summary && summary.low_stock_count > 0 ? (
        <section className="flex flex-col gap-4 rounded-2xl border border-brand-amber bg-brand-amber/20 p-4 shadow-sm sm:p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-brand-orange/25 bg-brand-orange/10 text-brand-orange">
              <WarningIcon />
            </span>
            <p className="text-sm font-semibold leading-snug text-brand-dark sm:text-base">
              Ada{' '}
              <span className="text-brand-orange-strong">{formatNumber(summary.low_stock_count)} produk</span>{' '}
              di bawah Reorder Point dan perlu dipesan ulang.
            </p>
          </div>
          {canScan ? (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-brand-orange px-5 text-sm font-semibold text-white hover:bg-brand-orange-strong md:self-auto"
            >
              <PlusIcon />
              Buat PO Sekaligus
            </button>
          ) : null}
        </section>
      ) : null}

      {!error && summary && summary.manual_review > 0 ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-purple-200 bg-purple-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <p className="text-sm font-semibold text-purple-900">
            {formatNumber(summary.manual_review)} produk punya data stok tidak wajar (stok negatif
            atau ROP tidak valid) dan dilewati dari pembuatan PO otomatis.
          </p>
          <Link
            to="/stok?status=manual"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-purple-300 bg-white px-4 text-sm font-semibold text-purple-900 hover:bg-purple-100"
          >
            Periksa Data
          </Link>
        </section>
      ) : null}

      {error ? null : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan angka">
        {loading || !summary ? (
          <>
            <p role="status" className="sr-only">
              Memuat ringkasan operasional
            </p>
            {[0, 1, 2, 3].map((key) => (
              <div key={key} className="rounded-2xl border border-brand-dark/10 bg-white p-5 shadow-sm">
                <div className="skeleton-bar h-4 w-2/3" />
                <div className="skeleton-bar mt-4 h-8 w-1/2" />
              </div>
            ))}
          </>
        ) : (
          <>
            <KpiCard
              label="Total Produk (SKU)"
              value={`${formatNumber(summary.total_sku)} SKU`}
              hint="Seluruh SKU yang dipantau sistem"
            />
            <KpiCard
              label="Stok Rendah (Butuh Reorder)"
              value={`${formatNumber(summary.low_stock_count)} SKU`}
              hint="Stok mencapai atau di bawah ROP"
              tone="alert"
            />
            <KpiCard
              label="Draf PO Menunggu"
              value={`${formatNumber(summary.pending_po_count)} PO`}
              hint="Menunggu persetujuan manajer"
            />
            <KpiCard
              label="PO Terkirim"
              value={`${formatNumber(summary.sent_po_count)} PO`}
              hint="Sudah diteruskan ke pemasok"
            />
          </>
        )}
        </section>
      )}

      <section className="rounded-2xl border border-brand-dark/10 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-1 border-b border-brand-dark/10 pb-4">
          <h2 className="text-lg font-extrabold tracking-tight">Low Stock</h2>
          <p className="text-xs text-brand-muted">
            Produk yang sudah mencapai atau berada di bawah Reorder Point dan perlu dipesan ulang.
          </p>
        </div>

        <div className="pt-4">
          {loading ? (
            <TableSkeleton label="Memuat produk di bawah ROP" columns={5} />
          ) : error ? (
            <p className="py-6 text-sm text-brand-muted">
              Daftar low stock tidak tersedia karena data gagal dimuat.
            </p>
          ) : preview.length === 0 ? (
            <EmptyState
              title="Semua stok di atas ROP"
              description="Tidak ada produk yang perlu dipesan ulang saat ini. Daftar ini terisi otomatis ketika pemindaian menemukan stok di bawah ROP."
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
            <StockTable items={preview} compact onSelect={setSelected} />
          )}
        </div>

        {loading || error ? null : (
          <div className="mt-4 flex flex-col gap-2 border-t border-brand-dark/10 pt-4 text-xs text-brand-muted sm:flex-row sm:items-center sm:justify-between">
            <span>
              {lowStock.length > 0
                ? `Menampilkan ${preview.length} dari ${lowStock.length} produk di bawah ROP.`
                : 'Belum ada produk di bawah ROP.'}
            </span>
            <Link to="/stok?status=low" className="font-semibold text-brand-orange hover:underline">
              Lihat semua stok
            </Link>
          </div>
        )}
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
