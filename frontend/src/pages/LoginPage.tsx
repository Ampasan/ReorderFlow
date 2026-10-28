import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { WarningIcon } from '../components/icons'
import { useAuth } from '../hooks/useAuth'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginPage() {
  const { status, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (status === 'authenticated' || status === 'loading') {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return

    const trimmedEmail = email.trim()
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError('Masukkan alamat email yang valid.')
      return
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter.')
      return
    }

    setError(null)
    setPending(true)
    try {
      await login(trimmedEmail, password)
      navigate(from, { replace: true })
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Gagal masuk. Periksa koneksi Anda.',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-5 rounded-2xl border border-brand-line/70 bg-white p-4 shadow-sm">
          <img src="/logo-reorderflow.png" alt="ReorderFlow" className="mx-auto h-24 w-auto" />
        </div>

        <div className="rounded-2xl border border-brand-dark/10 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-extrabold tracking-tight">Masuk ke ReorderFlow</h1>
          <p className="mt-1 text-sm text-brand-muted">
            Gunakan akun inventori atau manajer operasional untuk membuka dashboard.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            {error ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800"
              >
                <WarningIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-bold uppercase tracking-wide text-brand-muted"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@toko.id"
                className="mt-1.5 block w-full rounded-xl border border-brand-dark/20 bg-white px-3 py-2.5 text-sm text-brand-dark placeholder:text-brand-muted focus:border-brand-orange"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-bold uppercase tracking-wide text-brand-muted"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimal 8 karakter"
                className="mt-1.5 block w-full rounded-xl border border-brand-dark/20 bg-white px-3 py-2.5 text-sm text-brand-dark placeholder:text-brand-muted focus:border-brand-orange"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-strong disabled:opacity-60"
            >
              {pending ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
