import type { ReactNode } from 'react'
import { Reveal } from '../Reveal'
import { IconBarChart, IconClock, IconGear, IconShield } from '../landingIcons'
import { VALUE_PROPS } from '../landingContent'
import type { ValueIconKey } from '../landingContent'

const VALUE_ICONS: Record<ValueIconKey, ReactNode> = {
  clock: <IconClock />,
  shield: <IconShield />,
  chart: <IconBarChart />,
  gear: <IconGear />,
}

export function ValuePropsSection() {
  return (
    <section className="border-b border-brand-shell/40 bg-brand-cream pb-16 pt-12 sm:pb-20 sm:pt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
            <div>
              <h2 className="font-display text-3xl font-bold leading-snug text-brand-dark sm:text-4xl">
                Kurangi kerja manual yang makan waktu.
              </h2>
              <p className="mt-4 max-w-sm text-base leading-relaxed text-brand-muted">
                Pengecekan stok dan penyusunan PO secara manual menyita waktu dan rentan salah.
                ReorderFlow mengambil alih bagian yang berulang.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
              {VALUE_PROPS.map((item) => (
                <div key={item.title} className="group flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-orange/10 transition-all duration-300 group-hover:scale-105 group-hover:bg-brand-orange/15">
                    {VALUE_ICONS[item.icon]}
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-brand-dark">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-brand-muted">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
