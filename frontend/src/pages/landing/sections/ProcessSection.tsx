import { Reveal } from '../Reveal'
import { AS_IS_STEPS, TO_BE_STEPS } from '../landingContent'

export function ProcessSection() {
  return (
    <section id="proses" className="relative scroll-mt-20 overflow-hidden bg-brand-dark pb-16 pt-12 sm:pb-24 sm:pt-16">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute right-0 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-brand-orange/15 blur-3xl" />
        <div className="paper-grain absolute inset-0 opacity-15" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mb-12 max-w-2xl">
          <h2 className="font-display text-3xl font-bold leading-snug text-white sm:text-4xl">
            Dari proses manual menuju alur yang terstruktur.
          </h2>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-brand-shell/20 bg-brand-dark/60 p-6 sm:p-8">
            <h3 className="font-display text-base font-bold text-brand-shell">Proses Saat Ini</h3>
            <p className="mt-1 text-sm text-brand-shell/70">Pemesanan masih dilakukan secara manual.</p>
            <ol className="mt-6 space-y-5">
              {AS_IS_STEPS.map((step, index) => (
                <li key={step.title} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-shell/30 font-display text-sm font-bold text-brand-shell/80">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-display text-sm font-bold text-brand-shell">{step.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-brand-shell/60">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-brand-orange/50 bg-gradient-to-b from-brand-orange/10 to-transparent p-6 sm:p-8">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-[2rem] bg-brand-orange/10" aria-hidden="true" />
            <h3 className="font-display text-base font-bold text-white">Dengan ReorderFlow</h3>
            <p className="mt-1 text-sm text-brand-shell/80">Proses lebih terstruktur dan efisien.</p>
            <ol className="mt-6 space-y-5">
              {TO_BE_STEPS.map((step, index) => (
                <li key={step.title} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-orange font-display text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-display text-sm font-bold text-white">{step.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-brand-shell/70">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
