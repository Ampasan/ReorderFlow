import type { POLog } from '../types/po'
import { formatDateWIB } from '../utils/formatter'
import { ChevronRightIcon } from './icons'
import { StatusBadge } from './StatusBadge'

interface POLogTableProps {
  items: POLog[]
  onSelect: (po: POLog) => void
}

export function POLogTable({ items, onSelect }: POLogTableProps) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[680px] border-collapse text-left">
        <thead>
          <tr className="border-b border-brand-dark/10 bg-brand-cream/60 text-[11px] font-bold uppercase tracking-wide text-brand-muted">
            <th scope="col" className="rounded-l-lg px-4 py-3">
              Nomor PO
            </th>
            <th scope="col" className="px-4 py-3">
              Pemasok
            </th>
            <th scope="col" className="px-4 py-3">
              Status
            </th>
            <th scope="col" className="px-4 py-3">
              Tanggal Dibuat
            </th>
            <th scope="col" className="rounded-r-lg px-4 py-3 text-right">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-dark/5 text-sm">
          {items.map((po) => (
            <tr key={po.id} className="align-top hover:bg-brand-cream/40">
              <td className="whitespace-nowrap px-4 py-4 font-mono text-xs font-medium text-brand-dark">
                {po.nomor_po}
              </td>
              <td className="px-4 py-4">
                <span className="font-semibold text-brand-dark">{po.pemasok?.nama ?? '-'}</span>
                <span className="mt-0.5 block text-xs text-brand-muted">{po.pemasok?.email ?? '-'}</span>
              </td>
              <td className="whitespace-nowrap px-4 py-4">
                <StatusBadge status={po.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-brand-dark">
                {formatDateWIB(po.created_at)}
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-right">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onSelect(po)}
                    className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-brand-dark/15 bg-white px-3 text-sm font-semibold text-brand-dark hover:bg-brand-cream"
                  >
                    Detail
                    <ChevronRightIcon className="h-3.5 w-3.5" />
                  </button>
                  {po.tautan_pdf ? (
                    <a
                      href={po.tautan_pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center rounded-lg bg-brand-orange px-3 text-sm font-semibold text-white hover:bg-brand-orange-strong"
                    >
                      Lihat PDF
                    </a>
                  ) : (
                    <span className="inline-flex min-h-11 items-center rounded-lg border border-dashed border-brand-dark/20 px-3 text-sm font-medium text-brand-muted">
                      PDF belum tersedia
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
