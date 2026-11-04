import { describe, it, expect } from 'vitest'
import { isStockFilter, isPOFilter, STOCK_FILTERS, PO_FILTERS, OPNAME_REASONS } from '../../../utils/constants'

describe('isStockFilter', () => {
  it('mengembalikan true untuk nilai valid: all, low, manual', () => {
    expect(isStockFilter('all')).toBe(true)
    expect(isStockFilter('low')).toBe(true)
    expect(isStockFilter('manual')).toBe(true)
  })

  it('mengembalikan false untuk nilai tidak valid', () => {
    expect(isStockFilter('invalid')).toBe(false)
    expect(isStockFilter('')).toBe(false)
    expect(isStockFilter(null)).toBe(false)
  })
})

describe('isPOFilter', () => {
  it('mengembalikan true untuk semua status PO valid', () => {
    const validFilters = [
      'all', 'DRAFT', 'PENDING_APPROVAL', 'SENT',
      'REJECTED', 'REQUIRES_MANUAL_REVIEW', 'PARTIALLY_RECEIVED', 'RECEIVED',
    ]
    for (const f of validFilters) {
      expect(isPOFilter(f)).toBe(true)
    }
  })

  it('mengembalikan false untuk nilai tidak valid', () => {
    expect(isPOFilter('UNKNOWN')).toBe(false)
    expect(isPOFilter('')).toBe(false)
    expect(isPOFilter(null)).toBe(false)
  })
})

describe('STOCK_FILTERS', () => {
  it('memiliki 3 opsi filter', () => {
    expect(STOCK_FILTERS).toHaveLength(3)
  })

  it('opsi pertama adalah "all"', () => {
    expect(STOCK_FILTERS[0].value).toBe('all')
  })
})

describe('PO_FILTERS', () => {
  it('memiliki 8 opsi filter (all + 7 status)', () => {
    expect(PO_FILTERS).toHaveLength(8)
  })
})

describe('OPNAME_REASONS', () => {
  it('memiliki 3 alasan: DAMAGED, MISCOUNT, RETURN', () => {
    const values = OPNAME_REASONS.map((r) => r.value)
    expect(values).toContain('DAMAGED')
    expect(values).toContain('MISCOUNT')
    expect(values).toContain('RETURN')
  })
})
