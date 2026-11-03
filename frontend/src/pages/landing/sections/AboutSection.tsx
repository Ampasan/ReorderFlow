import { Reveal } from '../Reveal'
import { IconCheck } from '../landingIcons'
import { ABOUT_POINTS } from '../landingContent'

export function AboutSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <Reveal>
        <div className="grid items-start gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <h2 className="font-display text-3xl font-bold leading-snug text-brand-dark sm:text-4xl">
              Berawal dari kebutuhan nyata di lapangan.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-brand-muted">
              ReorderFlow berawal dari kebutuhan untuk menyederhanakan pengelolaan persediaan dan
              pemesanan ulang yang masih banyak dilakukan secara manual. Pengecekan stok, penyusunan
              Purchase Order, hingga proses persetujuan pembelian dapat menyita waktu dan membuat
              pekerjaan operasional menjadi kurang efisien.
            </p>
            <p className="mt-4 text-base leading-relaxed text-brand-muted">
              Dengan pendekatan yang praktis, mudah dipelajari, dan harga yang terjangkau, ReorderFlow
              ingin membantu UMKM mengelola persediaan tanpa terbebani sistem yang terlalu kompleks.
            </p>
          </div>

          <div className="rounded-2xl border border-brand-shell/60 bg-white p-6 sm:p-8">
            <h3 className="font-display text-xl font-bold text-brand-dark">
              Mempermudah operasional, mendukung pertumbuhan.
            </h3>
            <ul className="mt-5 space-y-4">
              {ABOUT_POINTS.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0">
                    <IconCheck />
                  </span>
                  <p className="text-sm leading-relaxed text-brand-muted">{item}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
