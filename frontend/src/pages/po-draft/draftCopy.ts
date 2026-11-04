import type { POStatus } from '../../types/po'

export type EditableStatus = 'DRAFT' | 'REJECTED' | 'REQUIRES_MANUAL_REVIEW'

export const LOCKED_COPY: Record<Exclude<POStatus, EditableStatus>, string> = {
  PENDING_APPROVAL:
    'Draf sudah dikirim ke manajer. Pemasok baru menerima PO setelah manajer menyetujui tautan di email.',
  SENT: 'PO sudah disetujui manajer dan dokumennya sudah dikirim ke email pemasok.',
  PARTIALLY_RECEIVED:
    'Sebagian barang sudah diterima dan stoknya sudah ditambah. Sisa kiriman bisa dicatat dari Riwayat PO.',
  RECEIVED:
    'Seluruh barang sudah diterima dan stok sudah diperbarui. PO ini selesai dan tidak bisa diedit.',
}

export function isEditableStatus(status: POStatus): status is EditableStatus {
  return status === 'DRAFT' || status === 'REJECTED' || status === 'REQUIRES_MANUAL_REVIEW'
}

export function isResubmitStatus(status: POStatus): boolean {
  return status === 'REJECTED' || status === 'REQUIRES_MANUAL_REVIEW'
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Terjadi kesalahan tidak terduga.'
}

interface BannerTone {
  box: string
  title: string
  body: string
}

interface BannerCopy {
  tone: BannerTone
  title: string
  body: string
}

export function editableBanner(status: EditableStatus): BannerCopy {
  if (status === 'REJECTED') {
    return {
      tone: {
        box: 'border-rose-200 bg-rose-50',
        title: 'text-rose-900',
        body: 'text-rose-800',
      },
      title: 'PO ini dikembalikan manajer untuk direvisi.',
      body: 'Periksa jumlah order, simpan perubahan, lalu kirim ulang ke manajer. Pemasok belum menerima dokumen ini dan tautan persetujuan lama sudah tidak berlaku.',
    }
  }

  if (status === 'REQUIRES_MANUAL_REVIEW') {
    return {
      tone: {
        box: 'border-purple-200 bg-purple-50',
        title: 'text-purple-900',
        body: 'text-purple-800',
      },
      title: 'PO ini perlu diproses ulang karena pengiriman sebelumnya gagal.',
      body: 'Periksa jumlah order, lalu kirim ulang ke manajer. Sistem akan membuat tautan persetujuan baru dan mengirim ulang email.',
    }
  }

  return {
    tone: {
      box: 'border-amber-200 bg-amber-50',
      title: 'text-amber-900',
      body: 'text-amber-800',
    },
    title: 'Draf ini belum dikirim ke manajer maupun pemasok.',
    body: 'Periksa jumlah order, lalu kirim ke manajer. Pemasok baru menerima PO setelah manajer menyetujui tautan di email.',
  }
}
