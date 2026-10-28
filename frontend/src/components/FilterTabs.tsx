import { Link } from 'react-router-dom'
import type { FilterOption } from '../utils/constants'

interface FilterTabsProps<T extends string> {
  options: FilterOption<T>[]
  active: T
  basePath: string
  label: string
  param?: string
}

export function FilterTabs<T extends string>({
  options,
  active,
  basePath,
  label,
  param = 'status',
}: FilterTabsProps<T>) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <nav
        aria-label={label}
        className="inline-flex min-w-max gap-1 rounded-xl border border-brand-dark/10 bg-white p-1"
      >
        {options.map((option) => {
          const isActive = option.value === active
          return (
            <Link
              key={option.value}
              to={`${basePath}?${param}=${option.value}`}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex h-8 items-center whitespace-nowrap rounded-lg px-3.5 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-brand-orange text-white'
                  : 'text-brand-muted hover:bg-brand-cream hover:text-brand-dark'
              }`}
            >
              {option.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
