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
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-cream px-4 py-12">

      {/* Card */}
      <div className="w-full max-w-[420px] rounded-3xl border border-brand-dark/10 bg-white p-8 shadow-xl">

        {/* Wordmark */}
        <div className="mb-8">
          <p className="text-[17px] font-extrabold leading-none tracking-tight text-brand-dark">
            Reorder<span className="text-brand-orange">Flow</span>
          </p>
          <p className="mt-1 text-[11px] font-medium text-brand-muted">Sistem Otomasi ROP</p>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-brand-dark">
            Masuk ke akun Anda
          </h1>
          <p className="mt-1.5 text-sm text-brand-muted">
            Gunakan akun yang disiapkan admin toko.
          </p>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          {error ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              <WarningIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-brand-dark"
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
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@toko.id"
              disabled={pending}
              className="block w-full rounded-xl border border-brand-dark/12 bg-brand-cream/40 px-4 py-2.5 text-sm text-brand-dark placeholder:text-brand-muted/40 focus:border-brand-orange focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/15 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-brand-dark"
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
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              disabled={pending}
              className="block w-full rounded-xl border border-brand-dark/12 bg-brand-cream/40 px-4 py-2.5 text-sm text-brand-dark placeholder:text-brand-muted/40 focus:border-brand-orange focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/15 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-orange text-sm font-bold text-white transition-colors hover:bg-brand-orange-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {pending ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Memproses...
              </>
            ) : (
              'Masuk'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-6 border-t border-brand-dark/8" />

        {/* Footer note */}
        <p className="mt-4 text-xs text-brand-muted">
          Belum punya akun? Minta admin toko untuk membuat akses Anda.
        </p>
      </div>

      {/* Below-card footnote */}
      <p className="mt-6 text-xs text-brand-muted/50">
        Untuk ritel sembako, kafe, dan grosir UMKM Indonesia.
      </p>

    </div>
  )
}
