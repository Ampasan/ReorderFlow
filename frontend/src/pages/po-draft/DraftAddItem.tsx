import type { StockItem } from '../../types/stok'

interface DraftAddItemProps {
  addable: StockItem[]
  activeSku: string
  busy: boolean
  stockLoading: boolean
  stockError: string | null
  onSelect: (sku: string) => void
  onAdd: () => void
  onRetryStock: () => void
}

export function DraftAddItem({
  addable,
  activeSku,
  busy,
  stockLoading,
  stockError,
  onSelect,
  onAdd,
  onRetryStock,
}: DraftAddItemProps) {
  return (
    <div className="mt-5 border-t border-brand-dark/8 pt-4">
      <label
        htmlFor="tambah-barang"
        className="block text-xs font-semibold text-brand-muted"
      >
        Tambah barang dari pemasok ini
      </label>
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
        <select
          id="tambah-barang"
          value={activeSku}
          disabled={addable.length === 0 || busy}
          onChange={(event) => onSelect(event.target.value)}
          className="h-11 w-full rounded-lg border border-brand-dark/15 bg-white px-3 text-sm text-brand-dark transition-colors focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/25 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
        >
          {addable.length === 0 ? (
            <option value="">Semua barang pemasok sudah ada di draf</option>
          ) : (
            addable.map((item) => (
              <option key={item.sku} value={item.sku}>
                {item.nama} ({item.sku})
              </option>
            ))
          )}
        </select>
        <button
          type="button"
          onClick={onAdd}
          disabled={addable.length === 0 || !activeSku || busy}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-brand-dark/15 bg-white px-4 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-cream disabled:cursor-not-allowed disabled:opacity-50"
        >
          Tambah barang
        </button>
      </div>
      {stockLoading ? (
        <p className="mt-2 text-xs text-brand-muted">Memuat daftar stok pemasok...</p>
      ) : stockError ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-rose-700">
          <span>Daftar stok gagal dimuat, barang baru belum bisa ditambahkan.</span>
          <button
            type="button"
            onClick={onRetryStock}
            className="font-semibold underline underline-offset-2"
          >
            Coba lagi
          </button>
        </div>
      ) : null}
    </div>
  )
}
