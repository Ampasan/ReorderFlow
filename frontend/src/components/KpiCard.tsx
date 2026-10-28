interface KpiCardProps {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'alert'
}

export function KpiCard({ label, value, hint, tone = 'default' }: KpiCardProps) {
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-brand-dark/10 bg-white p-5 shadow-sm">
      <span className="text-sm font-medium text-brand-muted">{label}</span>
      <div className="mt-4">
        <div
          className={`text-3xl font-extrabold tracking-tight ${
            tone === 'alert' ? 'text-brand-orange' : 'text-brand-dark'
          }`}
        >
          {value}
        </div>
        {hint ? <p className="mt-1 text-xs font-medium text-brand-muted">{hint}</p> : null}
      </div>
    </article>
  )
}
