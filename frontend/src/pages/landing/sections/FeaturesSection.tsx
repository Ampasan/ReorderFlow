import type { ReactNode } from 'react'
import { Reveal } from '../Reveal'
import { IconList, IconMail, IconPDF, IconSearch, IconSend } from '../landingIcons'
import { FEATURES } from '../landingContent'
import type { FeatureIconKey } from '../landingContent'

const FEATURE_ICONS: Record<FeatureIconKey, ReactNode> = {
  search: <IconSearch />,
  pdf: <IconPDF />,
  mail: <IconMail />,
  send: <IconSend />,
  list: <IconList />,
}

export function FeaturesSection() {
  return (
    <section id="fitur" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
      <Reveal className="mb-12 max-w-2xl">
        <h2 className="font-display text-3xl font-bold leading-snug text-brand-dark sm:text-4xl">
          Satu alur, dari stok menipis sampai PO terkirim.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-brand-muted">
          Lima langkah yang bekerja berurutan, tanpa Anda mengetik ulang data yang sama.
        </p>
      </Reveal>

      <div className="relative">
        <div className="absolute inset-x-0 top-7 hidden h-px bg-brand-line/70 lg:block" aria-hidden="true" />
        <div className="absolute bottom-7 left-7 top-7 w-px bg-brand-line/70 lg:hidden" aria-hidden="true" />

        <ol className="grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-4">
          {FEATURES.map((item) => (
            <li
              key={item.title}
              className="group relative flex items-start gap-4 lg:flex-col lg:items-center lg:text-center"
            >
              <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-brand-line bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-brand-orange group-hover:shadow-md group-hover:shadow-brand-orange/15">
                {FEATURE_ICONS[item.icon]}
              </div>
              <div className="lg:mt-4">
                <h3 className="font-display text-sm font-bold text-brand-dark">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-brand-muted">{item.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
