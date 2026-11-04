import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DetailDialog } from '../components/DetailDialog'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { FilterTabs } from '../components/FilterTabs'
import { Modal } from '../components/Modal'
import { OpnameDialog } from '../components/OpnameDialog'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { StockTable } from '../components/StockTable'
import { TableSkeleton } from '../components/TableSkeleton'
import { PlusIcon } from '../components/icons'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAuth } from '../hooks/useAuth'
import { useScan } from '../hooks/useScan'
import { useStock } from '../hooks/useStock'
import { useStockCorrection } from '../hooks/useStockCorrection'
import { analyzeLowStock } from '../services/stockService'
import type { OpnameReason, StockAnalysis, StockFilter, StockItem } from '../types/stok'
import { STOCK_FILTERS, isStockFilter } from '../utils/constants'
import { formatDateWIB, formatNumber } from '../utils/formatter'

const SCAN_DESCRIPTION =
  'Sistem memindai stok dan membuat draf PO untuk produk yang berada di bawah ROP, dikelompokkan per pemasok. Produk yang sudah punya PO aktif akan dilewati. Jika Gemini aktif, angka stok, ROP, dan minimum order per barang dikirim untuk rekomendasi prioritas. Nama, SKU, dan pemasok tidak dikirim; jumlah order tetap mengikuti aturan sistem.'

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
  useDocumentTitle('Data Stok | ReorderFlow', {
    description: 'Daftar inventori dan status reorder point untuk setiap SKU.',
    noIndex: true,
  })

  const [params] = useSearchParams()
  const rawStatus = params.get('status')
  const status: StockFilter = isStockFilter(rawStatus) ? rawStatus : 'all'

  const { data, loading, error, refetch } = useStock(status)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selected, setSelected] = useState<StockItem | null>(null)
  const [opnameItem, setOpnameItem] = useState<StockItem | null>(null)
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analysisPending, setAnalysisPending] = useState(false)
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const { scan, pending } = useScan(refetch)
  const { correct, pending: opnamePending } = useStockCorrection(refetch)
  const { user } = useAuth()
  const canScan = user?.role === 'admin'

  const items = data ?? []

  async function handleScan() {
    const success = await scan()
    if (success) setConfirmOpen(false)
  }

  async function handleAnalyzeLowStock() {
    setAnalysisOpen(false)
    setAnalysisPending(true)
    setAnalysis(null)
    setAnalysisError(null)
    try {
      setAnalysis(await analyzeLowStock())
      setAnalysisOpen(true)
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Analisis stok gagal. Coba lagi.')
      setAnalysisOpen(true)
    } finally {
      setAnalysisPending(false)
    }
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
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-orange px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-strong"
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

      {status !== 'manual' ? (
        <section
          aria-busy={analysisPending}
          className="rounded-xl border border-brand-dark/10 bg-white p-4 sm:p-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-display text-sm font-semibold text-brand-dark">
                Penjelasan stok low-stock
              </h2>
              <p className="mt-1 text-sm text-brand-muted">
                Dapatkan penjelasan tentang barang yang sudah mencapai
                batas reorder point. Saat pemindaian, menerima angka stok, ROP, dan
                minimum order untuk memberi prioritas, tanpa nama, SKU, atau pemasok.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAnalyzeLowStock}
              disabled={analysisPending || loading}
              className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-strong disabled:cursor-wait disabled:opacity-70 sm:w-auto"
            >
              {analysisPending ? 'Menganalisis stok...' : 'Minta penjelasan'}
            </button>
          </div>

        </section>
      ) : null}

      {error ? <ErrorState message={error} onRetry={refetch} /> : null}

      <section className="rounded-xl border border-brand-dark/10 bg-white">
        <div className="flex items-center justify-between border-b border-brand-dark/8 px-5 py-4">
          <h2 className="font-display text-sm font-semibold text-brand-dark">Daftar SKU</h2>
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

      <Modal
        open={analysisOpen}
        title="Hasil analisis"
        description="Ringkasan, prioritas, dan alasan dibuat otomatis dari data stok terbaru."
        onClose={() => setAnalysisOpen(false)}
        size="lg"
        footer={
          <button
            type="button"
            data-autofocus
            onClick={() => setAnalysisOpen(false)}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-brand-dark/15 bg-white px-5 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-cream"
          >
            Tutup
          </button>
        }
      >
        {analysisError ? (
          <div className="space-y-3">
            <p role="alert" className="text-sm leading-6 text-rose-700">
              {analysisError}
            </p>
            <button
              type="button"
              onClick={handleAnalyzeLowStock}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-strong"
            >
              Coba lagi
            </button>
          </div>
        ) : null}
        {analysis && !analysisError ? (
          <div className="space-y-5">
            <section aria-labelledby="gemini-summary-title">
              <h3 id="gemini-summary-title" className="mb-2 text-sm font-semibold text-brand-dark">
                Ringkasan
              </h3>
              <p className="whitespace-pre-wrap text-sm leading-6 text-brand-dark">
                {analysis.explanation}
              </p>
            </section>

            {analysis.items.length > 0 ? (
              <section aria-labelledby="stock-breakdown-title">
                <h3
                  id="stock-breakdown-title"
                  className="mb-2 text-sm font-semibold text-brand-dark"
                >
                  Penilaian Gemini per barang
                </h3>
                <ul className="divide-y divide-brand-dark/10 rounded-lg border border-brand-dark/10">
                  {analysis.items.map((item) => (
                    <li key={item.sku} className="space-y-2 p-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <span className="break-words text-sm font-semibold text-brand-dark">
                          {item.nama}
                        </span>
                        <span className="font-mono text-xs text-brand-muted">{item.sku}</span>
                      </div>
                      <p className="text-sm leading-6 text-brand-dark">
                        Prioritas <strong>{item.prioritas}</strong>. {item.alasan}
                      </p>
                      <p className="text-xs leading-5 text-brand-muted">
                        Stok {formatNumber(item.stok_saat_ini)} unit, ROP{' '}
                        {formatNumber(item.reorder_point)} unit.
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        ) : null}
      </Modal>

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
