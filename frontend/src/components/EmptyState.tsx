import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-brand-dark/15 bg-brand-cream/40 px-5 py-8">
      <p className="text-sm font-bold text-brand-dark">{title}</p>
      <p className="max-w-xl text-sm text-brand-muted">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
