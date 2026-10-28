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
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = option.value === active
        return (
          <Link
            key={option.value}
            to={`${basePath}?${param}=${option.value}`}
            aria-current={isActive ? 'page' : undefined}
            className={`inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-semibold transition-colors ${
              isActive
                ? 'border-transparent bg-brand-orange text-white'
                : 'border-brand-dark/10 bg-white text-brand-dark hover:bg-brand-shell/40'
            }`}
          >
            {option.label}
          </Link>
        )
      })}
    </nav>
  )
}
