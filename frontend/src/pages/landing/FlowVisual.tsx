export function FlowVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="relative overflow-hidden rounded-2xl border border-brand-shell/70 bg-[#FFF8ED] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)]">
        <div className="paper-grain absolute inset-0 opacity-40" aria-hidden="true" />

        <div className="relative border-b border-brand-shell/50 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-sm font-bold text-brand-dark">Monitor Stok</p>
            <span className="rounded-md bg-brand-dark px-2 py-1 font-mono text-[10px] font-medium text-brand-shell">
              Hari ini
            </span>
          </div>
        </div>

        <div className="relative px-5 pt-4 pb-6">
          <svg
            viewBox="0 0 440 260"
            className="h-auto w-full"
            role="img"
            aria-label="Grafik stok yang menurun melewati batas minimum ROP"
          >
            <rect x="20" y="150" width="400" height="90" fill="#B85114" opacity="0.08" />
            <line x1="20" y1="150" x2="420" y2="150" stroke="#B85114" strokeWidth="1.5" strokeDasharray="6 6" />
            <path
              d="M20 60 C80 60 120 90 165 118 C190 136 200 180 220 205 C240 180 250 130 300 110 C340 95 390 78 420 70"
              fill="none"
              stroke="#2A1A0E"
              strokeWidth="3"
              strokeLinecap="round"
              pathLength={1}
              className="flow-draw"
            />
            <circle cx="220" cy="205" r="5" fill="#B85114" />
            <circle cx="220" cy="205" r="5" fill="#B85114" className="flow-pulse" />
            <text x="20" y="136" fill="#6A5B4E" fontSize="12" fontFamily="Montserrat, sans-serif">
              Batas ROP
            </text>
            <text x="30" y="40" fill="#6A5B4E" fontSize="12" fontFamily="Montserrat, sans-serif">
              Stok
            </text>
          </svg>

          <div className="absolute right-4 top-1/2 flex items-center gap-1.5 rounded-full bg-brand-orange px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
            PO Siap
          </div>
        </div>
      </div>

      <div
        className="relative z-10 -mt-4 ml-auto w-fit rounded-xl border border-brand-dark/10 bg-brand-dark px-4 py-3 text-left shadow-[0_18px_40px_-18px_rgba(42,26,14,0.8)]"
        style={{ animation: 'landing-fade-up 640ms cubic-bezier(0.16,1,0.3,1) 1.5s both' }}
      >
        <p className="font-mono text-[10px] uppercase tracking-wide text-brand-shell/60">Purchase Order</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="font-mono text-sm font-medium text-brand-shell">PO-2026-001</span>
          <span className="rounded-md bg-brand-orange px-1.5 py-0.5 text-[10px] font-semibold text-white">Terkirim</span>
        </div>
      </div>
    </div>
  )
}
