import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ROLE_LABELS } from '../utils/constants'
import { BoxIcon, DashboardIcon, DocumentIcon, LogOutIcon } from './icons'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, end: true },
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
      {/* Mobile backdrop */}
      {open ? (
        <div
          className="fixed inset-0 z-30 bg-brand-dark/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}

      <aside
        id="app-sidebar"
        aria-label="Navigasi utama"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-brand-dark/10 bg-brand-shell/50 transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand header */}
        <div className="flex-shrink-0 border-b border-brand-line px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-auto flex-shrink-0 items-center justify-center rounded-xl bg-white p-1">
              <img
                src="/Logo_ReorderFlow.png"
                alt=""
                aria-hidden="true"
                className="h-8 w-auto"
              />
            </span>
            <div>
              <p className="text-sm font-bold leading-none text-brand-dark">
                Reorder<span className="text-brand-orange">Flow</span>
              </p>
              <p className="mt-0.5 text-[10px] text-brand-muted">Sistem Otomasi ROP</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Menu utama">
          <ul className="space-y-0.5" role="list">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isActive
                          ? 'bg-brand-orange font-semibold text-white'
                          : 'font-medium text-brand-dark/70 hover:bg-brand-dark/6 hover:text-brand-dark'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Profile + logout */}
        <div className="flex-shrink-0 border-t border-brand-line p-3">
          <div className="flex items-center gap-3 rounded-xl border border-brand-line bg-white px-3 py-2.5 shadow-sm">
            <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-orange text-[11px] font-bold text-white">
              {user ? initialsOf(user.nama) : '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-brand-dark">{user?.nama ?? '-'}</p>
              <p className="truncate text-[10px] font-medium text-brand-muted">
                {user ? ROLE_LABELS[user.role] : '-'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Keluar"
              aria-label="Keluar dari akun"
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-brand-muted transition-colors hover:bg-brand-dark/8 hover:text-brand-dark"
            >
              <LogOutIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
