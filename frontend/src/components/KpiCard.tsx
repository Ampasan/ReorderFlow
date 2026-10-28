import type { ReactNode } from 'react'

interface KpiCardProps {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'alert' | 'warning' | 'success'
  icon?: ReactNode
}

const TONE_STYLES = {
  default: {
    iconBg: 'bg-brand-dark/6 text-brand-dark/60',
    value: 'text-brand-dark',
  },
  alert: {
    iconBg: 'bg-brand-orange/10 text-brand-orange',
    value: 'text-brand-orange',
  },
  warning: {
    iconBg: 'bg-amber-100 text-amber-700',
    value: 'text-amber-700',
  },
  success: {
    iconBg: 'bg-emerald-50 text-emerald-600',
    value: 'text-emerald-700',
  },
}

export function KpiCard({ label, value, hint, tone = 'default', icon }: KpiCardProps) {
  const styles = TONE_STYLES[tone]

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-brand-dark/10 bg-white px-5 py-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-brand-muted">{label}</span>
        {icon ? (
          <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${styles.iconBg}`}>
            {icon}
          </span>
        ) : null}
      </div>
      <div>
        <div className={`text-2xl font-bold tabular-nums tracking-tight ${styles.value}`}>
          {value}
        </div>
        {hint ? <p className="mt-1 text-xs text-brand-muted">{hint}</p> : null}
      </div>
    </article>
  )
}
