import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '../../../components/StatusBadge'

describe('StatusBadge', () => {
  const cases = [
    { status: 'NORMAL' as const, label: 'Normal' },
    { status: 'LOW_STOCK' as const, label: 'Low Stock' },
    { status: 'REQUIRES_MANUAL_REVIEW' as const, label: 'Review' },
    { status: 'DRAFT' as const, label: 'Draf' },
    { status: 'PENDING_APPROVAL' as const, label: 'Menunggu' },
    { status: 'SENT' as const, label: 'Terkirim' },
    { status: 'PARTIALLY_RECEIVED' as const, label: 'Diterima Sebagian' },
    { status: 'RECEIVED' as const, label: 'Diterima' },
    { status: 'REJECTED' as const, label: 'Ditolak' },
  ] as const

  for (const { status, label } of cases) {
    it(`menampilkan label "${label}" untuk status ${status}`, () => {
      render(<StatusBadge status={status} />)
      expect(screen.getByText(label)).toBeInTheDocument()
    })
  }

  it('merender sebagai elemen span', () => {
    const { container } = render(<StatusBadge status="NORMAL" />)
    expect(container.querySelector('span')).toBeInTheDocument()
  })

  it('badge REJECTED memakai warna rose (error)', () => {
    const { container } = render(<StatusBadge status="REJECTED" />)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('rose')
  })

  it('badge NORMAL memakai warna emerald (sukses)', () => {
    const { container } = render(<StatusBadge status="NORMAL" />)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('emerald')
  })

  it('badge LOW_STOCK memakai warna amber (peringatan)', () => {
    const { container } = render(<StatusBadge status="LOW_STOCK" />)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('amber')
  })
})
