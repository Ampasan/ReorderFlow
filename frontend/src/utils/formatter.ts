const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const longDateFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  dateStyle: 'long',
})

const numberFormatter = new Intl.NumberFormat('id-ID')

export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

export function formatDateWIB(value?: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  // Backend mengirim zero time untuk baris yang belum pernah diperbarui.
  if (Number.isNaN(date.getTime()) || date.getUTCFullYear() < 1900) return '-'
  return `${dateFormatter.format(date)} ${timeFormatter.format(date)} WIB`
}

export function formatLongDate(value: Date = new Date()): string {
  return longDateFormatter.format(value)
}
