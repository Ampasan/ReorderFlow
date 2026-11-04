import { StatusBadge } from '../../components/StatusBadge'
import type { POLog } from '../../types/po'
import { formatDateWIB } from '../../utils/formatter'
import { LOCKED_COPY, editableBanner, isEditableStatus } from './draftCopy'

interface DraftStatusBannerProps {
  po: POLog
}

export function DraftStatusBanner({ po }: DraftStatusBannerProps) {
  const status = po.status

  if (isEditableStatus(status)) {
    const banner = editableBanner(status)
    return (
      <section
        className={`flex flex-col gap-3 rounded-xl border px-5 py-4 sm:flex-row sm:items-start sm:justify-between ${banner.tone.box}`}
      >
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${banner.tone.title}`}>{banner.title}</p>
          <p className={`mt-1 text-sm leading-relaxed ${banner.tone.body}`}>{banner.body}</p>
        </div>
        <StatusBadge status={status} />
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-brand-dark/10 bg-white px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-brand-dark">Draf ini sudah dikunci.</p>
        <p className="mt-1 text-sm leading-relaxed text-brand-muted">{LOCKED_COPY[status]}</p>
        {po.submitted_at ? (
          <p className="mt-2 text-xs text-brand-muted">
            Dikirim ke manajer: {formatDateWIB(po.submitted_at)}
          </p>
        ) : null}
      </div>
      <StatusBadge status={status} />
    </section>
  )
}
