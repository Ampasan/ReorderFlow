import { describe, it, expect } from 'vitest'
import { formatNumber, formatDateWIB, formatLongDate } from '../../../utils/formatter'

describe('formatNumber', () => {
  it('memformat angka dengan separator ribuan id-ID', () => {
    // id-ID memakai titik sebagai separator ribuan
    const result = formatNumber(1000000)
    expect(result).toBe('1.000.000')
  })

  it('memformat angka kecil tanpa separator', () => {
    expect(formatNumber(500)).toBe('500')
  })

  it('memformat nol', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('memformat bilangan negatif', () => {
    const result = formatNumber(-5000)
    expect(result).toContain('5.000')
  })
})

describe('formatDateWIB', () => {
  it('mengembalikan tanda minus untuk nilai null', () => {
    expect(formatDateWIB(null)).toBe('-')
  })

  it('mengembalikan tanda minus untuk nilai undefined', () => {
    expect(formatDateWIB(undefined)).toBe('-')
  })

  it('mengembalikan tanda minus untuk string kosong', () => {
    expect(formatDateWIB('')).toBe('-')
  })

  it('mengembalikan tanda minus untuk tanggal sebelum tahun 1900', () => {
    // Tanggal "zero" dari Go: 0001-01-01T00:00:00Z
    expect(formatDateWIB('0001-01-01T00:00:00Z')).toBe('-')
  })

  it('mengembalikan tanda minus untuk string bukan tanggal', () => {
    expect(formatDateWIB('bukan-tanggal')).toBe('-')
  })

  it('memformat tanggal valid dengan zona WIB', () => {
    // 2024-11-01T01:00:00Z = 2024-11-01 08:00 WIB
    const result = formatDateWIB('2024-11-01T01:00:00Z')
    expect(result).toContain('2024')
    expect(result).toContain('WIB')
  })
})

describe('formatLongDate', () => {
  it('mengembalikan string tanggal panjang format id-ID', () => {
    const result = formatLongDate(new Date('2024-11-01T00:00:00Z'))
    // id-ID long date: "1 November 2024" atau serupa
    expect(result).toMatch(/November/i)
    expect(result).toMatch(/2024/)
  })

  it('menggunakan tanggal hari ini jika tidak ada argumen', () => {
    const result = formatLongDate()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
