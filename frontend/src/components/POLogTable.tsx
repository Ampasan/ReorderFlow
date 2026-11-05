import { useState } from 'react'
import { Link } from 'react-router-dom'
import { regeneratePDF, resendSupplier } from '../services/poService'
import type { POLog } from '../types/po'
import { formatDateWIB } from '../utils/formatter'
import { StatusBadge } from './StatusBadge'

interface POLogTableProps {
  items: POLog[]
  onSelect: (po: POLog) => void
  canEdit?: boolean
  onRefresh?: () => void
  onReceive?: (po: POLog) => void
}

export function POLogTable({
  items,
  onSelect,
  canEdit = false,
  onRefresh,
  onReceive,
}: POLogTableProps) {
  const [regenerating, setRegenerating] = useState<number | null>(null)
  const [resending, setResending] = useState<number | null>(null)

  async function handleRegenerate(po: POLog) {
    setRegenerating(po.id)
    try {
      await regeneratePDF(po.id)
      onRefresh?.()
    } finally {
      setRegenerating(null)
    }
  }

  async function handleResend(po: POLog) {
    setResending(po.id)
    try {
      await resendSupplier(po.id)
      onRefresh?.()
    } finally {
      setResending(null)
    }
  }

  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0">
      <table aria-label="Riwayat Purchase Order" className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-brand-dark/8">
            <th scope="col" className="px-4 py-3 text-xs font-semibold text-brand-muted">
              Nomor PO
            </th>
            <th scope="col" className="px-4 py-3 text-xs font-semibold text-brand-muted">
              Pemasok
            </th>
            <th scope="col" className="px-4 py-3 text-xs font-semibold text-brand-muted">
              Status
            </th>
            <th scope="col" className="px-4 py-3 text-xs font-semibold text-brand-muted">
              Barang
            </th>
            <th scope="col" className="px-4 py-3 text-xs font-semibold text-brand-muted">
              Dibuat
            </th>
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Aksi</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-dark/5">
          {items.map((po) => (
            <tr key={po.id} className="transition-colors hover:bg-brand-cream/40">
              <td className="whitespace-nowrap px-4 py-3.5">
                <span className="font-mono text-xs font-medium text-brand-dark">{po.nomor_po}</span>
              </td>
              <td className="px-4 py-3.5">
                <span className="font-medium text-brand-dark">{po.pemasok?.nama ?? '-'}</span>
                {po.pemasok?.email ? (
                  <span className="mt-0.5 block text-xs text-brand-muted">{po.pemasok.email}</span>
                ) : null}
              </td>
              <td className="whitespace-nowrap px-4 py-3.5">
                <StatusBadge status={po.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-xs text-brand-muted">
                {po.details?.length ?? 0} barang
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-xs text-brand-muted">
                {formatDateWIB(po.created_at)}
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-right">
                <div className="flex items-center justify-end gap-2">
                  {onReceive &&
                  (po.status === 'SENT' || po.status === 'PARTIALLY_RECEIVED') ? (
                    <button
                      type="button"
                      onClick={() => onReceive(po)}
                      className="h-8 rounded-lg bg-brand-orange px-3 text-xs font-semibold text-white transition-colors hover:bg-brand-orange-strong"
                    >
                      Terima Barang
                    </button>
                  ) : null}
                  {canEdit &&
                  (po.status === 'DRAFT' ||
                    po.status === 'REJECTED' ||
                    po.status === 'REQUIRES_MANUAL_REVIEW') ? (
                    po.status === 'REQUIRES_MANUAL_REVIEW' ? (
                      <button
                        type="button"
                        disabled={resending === po.id}
                        onClick={() => handleResend(po)}
                        className="inline-flex h-8 items-center rounded-lg border border-brand-orange/30 bg-brand-orange/10 px-3 text-xs font-semibold text-brand-orange-strong transition-colors hover:bg-brand-orange/15 disabled:opacity-50"
                      >
                        {resending === po.id ? 'Mengirim…' : 'Proses Ulang'}
                      </button>
                    ) : (
                      <Link
                        to={`/po-log/${po.id}/draft`}
                        className="inline-flex h-8 items-center rounded-lg border border-brand-orange/30 bg-brand-orange/10 px-3 text-xs font-semibold text-brand-orange-strong transition-colors hover:bg-brand-orange/15"
                      >
                        {po.status === 'REJECTED' ? 'Revisi' : 'Edit Draf'}
                      </Link>
                    )
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onSelect(po)}
                    className="h-8 rounded-lg border border-brand-dark/12 bg-white px-3 text-xs font-semibold text-brand-dark transition-colors hover:bg-brand-cream"
                  >
                    Detail
                  </button>
                  {po.tautan_pdf ? (
                    <>
                      <a
                        href={po.tautan_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 items-center rounded-lg bg-brand-orange px-3 text-xs font-semibold text-white transition-colors hover:bg-brand-orange-strong"
                      >
                        Lihat PDF
                      </a>
                      {canEdit ? (
                        <button
                          type="button"
                          disabled={regenerating === po.id}
                          onClick={() => handleRegenerate(po)}
                          className="h-8 rounded-lg border border-brand-dark/12 bg-white px-3 text-xs font-semibold text-brand-muted transition-colors hover:bg-brand-cream disabled:opacity-50"
                        >
                          {regenerating === po.id ? 'Memproses…' : 'Perbaiki PDF'}
                        </button>
                      ) : null}
                    </>
                  ) : (
                    <span className="inline-flex h-8 items-center rounded-lg border border-dashed border-brand-dark/15 px-3 text-xs text-brand-muted">
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
