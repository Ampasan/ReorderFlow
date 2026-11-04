import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KpiCard } from '../../../components/KpiCard'

describe('KpiCard', () => {
  it('menampilkan label dan value', () => {
    render(<KpiCard label="Total Stok" value="150" />)
    expect(screen.getByText('Total Stok')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
  })

  it('menampilkan hint jika disediakan', () => {
    render(<KpiCard label="Total Stok" value="150" hint="Dari 3 produk" />)
    expect(screen.getByText('Dari 3 produk')).toBeInTheDocument()
  })

  it('tidak menampilkan hint jika tidak disediakan', () => {
    const { container } = render(<KpiCard label="Total Stok" value="150" />)
    const hint = container.querySelector('p')
    expect(hint).toBeNull()
  })

  it('menampilkan icon jika disediakan', () => {
    render(
      <KpiCard
        label="Total Stok"
        value="150"
        icon={<span data-testid="test-icon">📦</span>}
      />,
    )
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('merender sebagai article', () => {
    const { container } = render(<KpiCard label="Total Stok" value="150" />)
    expect(container.querySelector('article')).toBeInTheDocument()
  })

  it('tone "alert" mengubah warna value ke brand-orange', () => {
    const { container } = render(<KpiCard label="Low Stock" value="5" tone="alert" />)
    const valueEl = container.querySelector('[class*="text-brand-orange"]')
    expect(valueEl).toBeInTheDocument()
  })

  it('tone "success" mengubah warna value ke emerald', () => {
    const { container } = render(<KpiCard label="Normal" value="10" tone="success" />)
    const valueEl = container.querySelector('[class*="emerald"]')
    expect(valueEl).toBeInTheDocument()
  })

  it('tone "warning" mengubah warna value ke amber', () => {
    const { container } = render(<KpiCard label="Review" value="2" tone="warning" />)
    const valueEl = container.querySelector('[class*="amber"]')
    expect(valueEl).toBeInTheDocument()
  })

  it('tone default tidak memakai warna khusus', () => {
    const { container } = render(<KpiCard label="Total" value="0" />)
    const valueEl = container.querySelector('[class*="text-brand-dark"]')
    expect(valueEl).toBeInTheDocument()
  })
})
