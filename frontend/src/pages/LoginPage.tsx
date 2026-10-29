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
    <main className="flex min-h-screen">

      {/* ── Panel kiri: brand + ilustrasi (60%) ── */}
      <div className="hidden flex-col border-r border-brand-dark/10 bg-[#EAD8C0] px-14 py-10 lg:flex lg:w-[60%]">

        {/* Zona 1: Wordmark + teks */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-auto flex-shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-sm">
              <img src="/Logo_ReorderFlow.png" alt="" className="h-8 w-auto" />
            </span>
            <div>
              <p className="text-sm font-bold leading-none text-brand-dark">
                Reorder<span className="text-brand-orange">Flow</span>
              </p>
              <p className="mt-0.5 text-[11px] text-brand-muted">Sistem Otomasi ROP</p>
            </div>
          </div>

          <div className="max-w-[34rem] space-y-2">
            <p className="text-[1.75rem] font-extrabold leading-[1.2] tracking-tight text-brand-dark">
              Tahu kapan harus order,{' '}
              <span className="text-brand-orange">sebelum kehabisan.</span>
            </p>
            <p className="text-sm leading-relaxed text-brand-muted">
              Deteksi stok kritis, buat draf PO, dan kirim ke pemasok, semuanya berjalan otomatis setiap hari.
            </p>
          </div>
        </div>

        {/* Zona 2: Ilustrasi — menyerap sisa ruang, terpusat */}
        <div className="flex flex-1 items-center justify-center py-4">
          <img
            src="/illustration.png"
            alt=""
            aria-hidden="true"
            width={579}
            height={431}
            className="h-auto w-full max-w-[460px] object-contain"
            draggable={false}
          />
        </div>

        {/* Zona 3: Footer */}
        <p className="text-xs text-brand-muted">
          Untuk toko grosir dan ritel sembako UMKM Indonesia.
        </p>
      </div>

      {/* ── Panel kanan: form (40%) ── */}
      <div className="flex flex-1 flex-col bg-white">
        <div className="flex flex-1 items-center justify-center px-8 py-12 sm:px-12">
          <div className="w-full max-w-[340px]">

            {/* Mobile-only: wordmark */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="flex h-10 w-auto flex-shrink-0 items-center justify-center rounded-xl border border-brand-dark/8 bg-white p-1 shadow-sm">
                <img src="/Logo_ReorderFlow.png" alt="" className="h-8 w-auto" />
              </span>
              <div>
                <p className="text-sm font-bold leading-none text-brand-dark">
                  Reorder<span className="text-brand-orange">Flow</span>
                </p>
                <p className="mt-0.5 text-[11px] text-brand-muted">Sistem Otomasi ROP</p>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-7">
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
                  id="login-error"
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                  <WarningIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-semibold text-brand-dark">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@toko.id"
                  disabled={pending}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'login-error' : undefined}
                  className="block w-full rounded-xl border border-brand-field bg-brand-cream/40 px-4 py-3 text-sm text-brand-dark caret-brand-orange transition-colors placeholder:text-brand-muted focus:border-brand-orange focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-brand-dark">
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
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'login-error' : undefined}
                  className="block w-full rounded-xl border border-brand-field bg-brand-cream/40 px-4 py-3 text-sm text-brand-dark caret-brand-orange transition-colors placeholder:text-brand-muted focus:border-brand-orange focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={pending}
                aria-busy={pending}
                className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-orange text-sm font-bold text-white transition-colors hover:bg-brand-orange-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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

            <div className="mt-6 border-t border-brand-dark/10" />
            <p className="mt-4 text-xs text-brand-muted">
              Belum punya akun? Minta admin toko untuk membuat akses Anda.
            </p>

          </div>
        </div>
      </div>

    </main>
  )
}
