interface DraftActionsProps {
  saving: boolean
  canAct: boolean
  isResubmit: boolean
  onSave: () => void
  onSubmit: () => void
}

export function DraftActions({
  saving,
  canAct,
  isResubmit,
  onSave,
  onSubmit,
}: DraftActionsProps) {
  return (
    <section
      aria-label="Aksi draf"
      className="flex flex-col gap-3 rounded-xl border border-brand-dark/10 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-xs leading-relaxed text-brand-muted">
        Perubahan ikut tersimpan saat Anda menekan{' '}
        {isResubmit ? 'Kirim Ulang ke Manajer' : 'Kirim ke Manajer'}. Setelah terkirim, PO tidak
        bisa diedit sampai manajer memutuskan.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onSave}
          disabled={!canAct}
          aria-busy={saving}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-brand-dark/15 bg-white px-5 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-cream disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Menyimpan...' : isResubmit ? 'Simpan Perubahan' : 'Simpan Draf'}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canAct}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-orange px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-strong disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isResubmit ? 'Kirim Ulang ke Manajer' : 'Kirim ke Manajer'}
        </button>
      </div>
    </section>
  )
}
