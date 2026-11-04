import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from '../../../components/Modal'

describe('Modal', () => {
  it('tidak dirender jika open=false', () => {
    render(
      <Modal open={false} title="Test Modal" onClose={vi.fn()}>
        <p>Isi modal</p>
      </Modal>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByText('Isi modal')).toBeNull()
  })

  it('dirender jika open=true', () => {
    render(
      <Modal open={true} title="Test Modal" onClose={vi.fn()}>
        <p>Isi modal</p>
      </Modal>,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Isi modal')).toBeInTheDocument()
  })

  it('menampilkan judul modal', () => {
    render(<Modal open={true} title="Edit Stok" onClose={vi.fn()} />)
    expect(screen.getByText('Edit Stok')).toBeInTheDocument()
  })

  it('menampilkan deskripsi jika disediakan', () => {
    render(
      <Modal open={true} title="Konfirmasi" description="Apakah Anda yakin?" onClose={vi.fn()} />,
    )
    expect(screen.getByText('Apakah Anda yakin?')).toBeInTheDocument()
  })

  it('memanggil onClose saat tombol tutup diklik', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Modal open={true} title="Test" onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /tutup dialog/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('memanggil onClose saat Escape ditekan', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Modal open={true} title="Test" onClose={onClose} />)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('memiliki aria-modal="true"', () => {
    render(<Modal open={true} title="Accessible Modal" onClose={vi.fn()} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('menampilkan footer jika disediakan', () => {
    render(
      <Modal
        open={true}
        title="Test"
        onClose={vi.fn()}
        footer={<button>Simpan</button>}
      />,
    )
    expect(screen.getByText('Simpan')).toBeInTheDocument()
  })
})
