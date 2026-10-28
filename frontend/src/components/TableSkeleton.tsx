interface TableSkeletonProps {
  label: string
  rows?: number
  columns?: number
}

export function TableSkeleton({ label, rows = 5, columns = 5 }: TableSkeletonProps) {
  return (
    <div role="status" aria-live="polite">
      <p className="sr-only">{label}</p>
      <div className="space-y-0">
        {/* Fake thead */}
        <div className="border-b border-brand-dark/8 bg-brand-cream/50 px-4 py-3">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="skeleton-bar h-3 w-16" />
            ))}
          </div>
        </div>
        {/* Fake rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="border-b border-brand-dark/5 px-4 py-4 last:border-0"
          >
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {Array.from({ length: columns }).map((__, columnIndex) => (
                <div key={columnIndex} className={`skeleton-bar h-4 ${columnIndex === 1 ? 'w-full' : 'w-4/5'}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
