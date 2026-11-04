import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { EmptyState } from '../../../components/EmptyState'

describe('EmptyState', () => {
  it('menampilkan title dan description', () => {
    render(<EmptyState title="Tidak ada data" description="Belum ada stok yang terdaftar." />)
    expect(screen.getByText('Tidak ada data')).toBeInTheDocument()
    expect(screen.getByText('Belum ada stok yang terdaftar.')).toBeInTheDocument()
  })

  it('menampilkan action jika disediakan', () => {
    const onClick = vi.fn()
    render(
      <EmptyState
        title="Kosong"
        description="Tidak ada PO."
        action={<button onClick={onClick}>Buat PO</button>}
      />,
    )
    expect(screen.getByText('Buat PO')).toBeInTheDocument()
  })

  it('action dapat diklik', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <EmptyState
        title="Kosong"
        description="Tidak ada PO."
        action={<button onClick={onClick}>Tambah</button>}
      />,
    )
    await user.click(screen.getByText('Tambah'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('tidak merender action jika tidak disediakan', () => {
    const { container } = render(
      <EmptyState title="Kosong" description="Tidak ada data." />,
    )
    const actionDiv = container.querySelector('.mt-5')
    expect(actionDiv).toBeNull()
  })

  it('merender ikon SVG', () => {
    const { container } = render(<EmptyState title="Kosong" description="Tidak ada data." />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
