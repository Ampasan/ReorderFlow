interface TableSkeletonProps {
  label: string
  rows?: number
  columns?: number
}

export function TableSkeleton({ label, rows = 5, columns = 5 }: TableSkeletonProps) {
  return (
    <div role="status" aria-live="polite" className="space-y-3 py-4">
      <p className="text-sm font-medium text-brand-muted">{label}</p>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <div key={columnIndex} className="skeleton-bar h-5" />
          ))}
        </div>
      ))}
    </div>
  )
}
