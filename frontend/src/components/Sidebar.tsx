import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ROLE_LABELS } from '../utils/constants'
import { BoxIcon, DashboardIcon, DocumentIcon, LogOutIcon } from './icons'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard Overview', icon: DashboardIcon, end: true },
  { to: '/stok', label: 'Data Stok', icon: BoxIcon, end: false },
  { to: '/po-log', label: 'Riwayat PO', icon: DocumentIcon, end: false },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-brand-dark/40 lg:hidden ${open ? 'block' : 'hidden'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        id="app-sidebar"
        aria-label="Navigasi utama"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col justify-between border-r border-brand-line bg-brand-shell p-5 transition-transform duration-200 lg:translate-x-0 ${
          open ? 'visible translate-x-0' : 'invisible -translate-x-full lg:visible'
        }`}
      >
        <div>
          <div className="mb-8 rounded-xl border border-brand-line/70 bg-white/85 p-3">
            <img src="/logo-reorderflow.png" alt="ReorderFlow" className="mx-auto h-auto w-3/4" />
            <p className="mt-1 text-center text-[11px] font-semibold text-brand-muted">
              Sistem Otomasi ROP
            </p>
          </div>

          <nav className="space-y-2" aria-label="Menu utama">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm transition-colors ${
                      isActive
                        ? 'bg-brand-orange font-semibold text-white shadow-sm'
                        : 'font-medium text-brand-dark/85 hover:bg-brand-cream/70 hover:text-brand-dark'
                    }`
                  }
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>

        <div className="border-t border-brand-line/70 pt-4">
          <div className="rounded-xl border border-brand-line/60 bg-brand-cream/80 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-brand-orange/30 bg-brand-orange/15 text-sm font-bold text-brand-orange-strong">
                {user ? initialsOf(user.nama) : '-'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-brand-dark">{user?.nama ?? '-'}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-brand-muted">
                  {user ? ROLE_LABELS[user.role] : '-'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-brand-dark/15 bg-white px-3 text-sm font-semibold text-brand-dark hover:bg-brand-cream"
            >
              <LogOutIcon />
              Keluar
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
