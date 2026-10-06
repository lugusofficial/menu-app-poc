import { describe, it, expect } from 'vitest'
import {
  allocateProportionally,
  divideCents,
  formatCents,
  parseCents,
  percentOfCents,
} from './money'

// Intl puts a non breaking space between the currency symbol and the number.
const plainSpaces = (value: string) => value.split(String.fromCharCode(160)).join(' ')

describe('formatCents', () => {
  it('formats cents as Brazilian currency', () => {
    expect(plainSpaces(formatCents(1250))).toBe('R$ 12,50')
  })

  it('formats zero', () => {
    expect(plainSpaces(formatCents(0))).toBe('R$ 0,00')
  })

  it('honours another locale and currency', () => {
    expect(formatCents(1250, 'en-US', 'USD')).toBe('$12.50')
  })
})

describe('parseCents', () => {
  it('reads a comma decimal separator', () => {
    expect(parseCents('12,50')).toBe(1250)
  })

  it('reads a dot decimal separator', () => {
    expect(parseCents('12.5')).toBe(1250)
  })

  it('ignores a currency prefix and spaces', () => {
    expect(parseCents('R$ 30')).toBe(3000)
  })

  it('returns null for empty or non numeric input', () => {
    expect(parseCents('')).toBeNull()
    expect(parseCents('abc')).toBeNull()
  })

  it('rounds to the nearest cent', () => {
    expect(parseCents('10,005')).toBe(1001)
  })
})

describe('divideCents', () => {
  it('splits evenly when it divides exactly', () => {
    expect(divideCents(900, 3)).toEqual([300, 300, 300])
  })

  it('gives the leftover cents to the first shares', () => {
    expect(divideCents(1000, 3)).toEqual([334, 333, 333])
  })

  it('always adds back up to the total', () => {
    for (const total of [1, 7, 99, 100, 12345, 99999]) {
      for (const parts of [1, 2, 3, 4, 5, 7, 11]) {
        const shares = divideCents(total, parts)
        expect(shares).toHaveLength(parts)
        expect(shares.reduce((a, b) => a + b, 0)).toBe(total)
      }
    }
  })

  it('returns an empty list when there is nobody to split between', () => {
    expect(divideCents(1000, 0)).toEqual([])
  })

  it('handles a negative total without losing cents', () => {
    expect(divideCents(-1000, 3).reduce((a, b) => a + b, 0)).toBe(-1000)
  })
})

describe('percentOfCents', () => {
  it('computes a ten percent service fee', () => {
    expect(percentOfCents(10000, 0.1)).toBe(1000)
  })

  it('rounds to the nearest cent', () => {
    expect(percentOfCents(1255, 0.1)).toBe(126)
  })
})

describe('allocateProportionally', () => {
  it('splits in proportion to the weights', () => {
    expect(allocateProportionally(1000, [1, 1, 2])).toEqual([250, 250, 500])
  })

  it('always adds back up to the total', () => {
    const cases: Array<[number, number[]]> = [
      [1000, [3333, 3333, 3334]],
      [1, [1, 1, 1]],
      [777, [100, 200, 300, 177]],
      [10, [1, 0, 0]],
    ]
    for (const [total, weights] of cases) {
      expect(allocateProportionally(total, weights).reduce((a, b) => a + b, 0)).toBe(total)
    }
  })

  it('gives the leftover cents to the largest fractions first', () => {
    expect(allocateProportionally(10, [1, 1, 1])).toEqual([4, 3, 3])
  })

  it('gives nothing to a zero weight', () => {
    expect(allocateProportionally(1000, [1, 0])).toEqual([1000, 0])
  })

  it('gives everyone zero when every weight is zero', () => {
    expect(allocateProportionally(1000, [0, 0])).toEqual([0, 0])
  })

  it('returns an empty list when there are no weights', () => {
    expect(allocateProportionally(1000, [])).toEqual([])
  })

  it('returns zeros when there is nothing to spread', () => {
    expect(allocateProportionally(0, [5, 5])).toEqual([0, 0])
  })
})
