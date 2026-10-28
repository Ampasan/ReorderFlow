import { RefreshIcon, WarningIcon } from './icons'

interface ErrorStateProps {
  message: string
  onRetry: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-700">
          <WarningIcon />
        </span>
        <div>
          <p className="text-sm font-bold text-rose-800">Gagal memuat data dari server</p>
          <p className="mt-0.5 text-sm text-rose-700">{message}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-800 sm:self-auto"
      >
        <RefreshIcon />
        Coba Lagi
      </button>
    </div>
  )
}
