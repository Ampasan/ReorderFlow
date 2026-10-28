import { RefreshIcon, WarningIcon } from './icons'

interface ErrorStateProps {
  message: string
  onRetry: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
          <WarningIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-rose-800">Gagal memuat data dari server</p>
          <p className="mt-0.5 text-sm text-rose-600">{message}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-9 items-center justify-center gap-2 self-start rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-rose-800 sm:self-auto"
      >
        <RefreshIcon />
        Coba Lagi
      </button>
    </div>
  )
}
