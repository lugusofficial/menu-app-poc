import { describe, it, expect } from 'vitest'
import { computeSplit, lineTotalCents, subtotalOf, suggestCustomAmounts } from './split'
import type { Diner, OrderLine, SplitMode, TableSession } from '../session/types'

const SERVICE_FEE = 0.1
const AT = '2026-10-06T20:00:00.000Z'

function diner(dinerId: string, name: string, colorIndex: number): Diner {
  return { dinerId, name, colorIndex, joinedAt: AT }
}

function line(lineId: string, unitPriceCents: number, quantity = 1, addedBy = 'd1'): OrderLine {
  return {
    lineId,
    itemId: `item-${lineId}`,
    name: `Item ${lineId}`,
    emoji: '🍽️',
    unitPriceCents,
    quantity,
    notes: '',
    addedByDinerId: addedBy,
    status: 'placed',
    placedAt: AT,
  }
}

function session(overrides: Partial<TableSession> = {}): TableSession {
  return {
    venueSlug: 'cantina',
    tableId: '7',
    openedAt: AT,
    diners: [],
    currentDinerId: null,
    lines: [],
    assignments: {},
    splitMode: 'equal' as SplitMode,
    customAmounts: {},
    serviceFeeIncluded: true,
    paidDinerIds: [],
    ...overrides,
  }
}

const sumShares = (shares: { totalCents: number }[]) =>
  shares.reduce((sum, share) => sum + share.totalCents, 0)

describe('lineTotalCents and subtotalOf', () => {
  it('multiplies the unit price by the quantity', () => {
    expect(lineTotalCents(line('l1', 1600, 3))).toBe(4800)
  })

  it('adds every line of the bill', () => {
    expect(subtotalOf([line('l1', 1600, 3), line('l2', 8900)])).toBe(13700)
  })

  it('is zero for an empty table', () => {
    expect(subtotalOf([])).toBe(0)
  })
})

describe('the bill itself', () => {
  it('adds the ten percent service fee on top of the subtotal', () => {
    const result = computeSplit(
      session({ diners: [diner('d1', 'Ana', 0)], lines: [line('l1', 10000)] }),
      SERVICE_FEE,
    )
    expect(result.billSubtotalCents).toBe(10000)
    expect(result.billServiceFeeCents).toBe(1000)
    expect(result.billTotalCents).toBe(11000)
  })

  it('drops the service fee when the table declines it', () => {
    const result = computeSplit(
      session({
        diners: [diner('d1', 'Ana', 0)],
        lines: [line('l1', 10000)],
        serviceFeeIncluded: false,
      }),
      SERVICE_FEE,
    )
    expect(result.billServiceFeeCents).toBe(0)
    expect(result.billTotalCents).toBe(10000)
  })

  it('reports the whole bill as missing when nobody has joined the table', () => {
    const result = computeSplit(session({ lines: [line('l1', 10000)] }), SERVICE_FEE)
    expect(result.shares).toEqual([])
    expect(result.differenceCents).toBe(11000)
  })
})

describe('equal split', () => {
  const threeDiners = [diner('d1', 'Ana', 0), diner('d2', 'Bruno', 1), diner('d3', 'Caio', 2)]

  it('gives everyone the same share when it divides exactly', () => {
    const result = computeSplit(
      session({ diners: threeDiners, lines: [line('l1', 9000)], serviceFeeIncluded: false }),
      SERVICE_FEE,
    )
    expect(result.shares.map((s) => s.totalCents)).toEqual([3000, 3000, 3000])
  })

  it('splits the service fee along with the food', () => {
    const result = computeSplit(
      session({ diners: threeDiners, lines: [line('l1', 9000)] }),
      SERVICE_FEE,
    )
    expect(result.shares.map((s) => s.subtotalCents)).toEqual([3000, 3000, 3000])
    expect(result.shares.map((s) => s.serviceFeeCents)).toEqual([300, 300, 300])
    expect(result.shares.map((s) => s.totalCents)).toEqual([3300, 3300, 3300])
  })

  it('never loses a cent when the total does not divide evenly', () => {
    const result = computeSplit(
      session({ diners: threeDiners, lines: [line('l1', 10000)] }),
      SERVICE_FEE,
    )
    expect(sumShares(result.shares)).toBe(result.billTotalCents)
    expect(result.differenceCents).toBe(0)
  })

  it('gives the leftover cents to the first diners, deterministically', () => {
    const result = computeSplit(
      session({ diners: threeDiners, lines: [line('l1', 10000)], serviceFeeIncluded: false }),
      SERVICE_FEE,
    )
    expect(result.shares.map((s) => s.totalCents)).toEqual([3334, 3333, 3333])
  })

  it('charges one diner the whole bill', () => {
    const result = computeSplit(
      session({ diners: [diner('d1', 'Ana', 0)], lines: [line('l1', 8900)] }),
      SERVICE_FEE,
    )
    expect(result.shares).toHaveLength(1)
    expect(result.shares[0].totalCents).toBe(9790)
  })

  it('leaves everyone at zero when nothing was ordered', () => {
    const result = computeSplit(session({ diners: threeDiners }), SERVICE_FEE)
    expect(result.shares.map((s) => s.totalCents)).toEqual([0, 0, 0])
    expect(result.billTotalCents).toBe(0)
  })
})

describe('split by item', () => {
  const ana = diner('d1', 'Ana', 0)
  const bruno = diner('d2', 'Bruno', 1)
  const caio = diner('d3', 'Caio', 2)

  it('charges each diner only for what they took', () => {
    const result = computeSplit(
      session({
        diners: [ana, bruno],
        splitMode: 'byItem',
        serviceFeeIncluded: false,
        lines: [line('l1', 8900, 1, 'd1'), line('l2', 1600, 2, 'd2')],
        assignments: { l1: ['d1'], l2: ['d2'] },
      }),
      SERVICE_FEE,
    )
    expect(result.shares[0].totalCents).toBe(8900)
    expect(result.shares[1].totalCents).toBe(3200)
  })

  it('splits a shared item between everyone on it', () => {
    const result = computeSplit(
      session({
        diners: [ana, bruno],
        splitMode: 'byItem',
        serviceFeeIncluded: false,
        lines: [line('l1', 5600)],
        assignments: { l1: ['d1', 'd2'] },
      }),
      SERVICE_FEE,
    )
    expect(result.shares.map((s) => s.totalCents)).toEqual([2800, 2800])
  })

  it('splits a shared item to the cent when it does not divide evenly', () => {
    const result = computeSplit(
      session({
        diners: [ana, bruno, caio],
        splitMode: 'byItem',
        serviceFeeIncluded: false,
        lines: [line('l1', 1000)],
        assignments: { l1: ['d1', 'd2', 'd3'] },
      }),
      SERVICE_FEE,
    )
    expect(result.shares.map((s) => s.totalCents)).toEqual([334, 333, 333])
    expect(sumShares(result.shares)).toBe(1000)
  })

  it('charges the service fee on what each person consumed', () => {
    const result = computeSplit(
      session({
        diners: [ana, bruno],
        splitMode: 'byItem',
        lines: [line('l1', 10000, 1, 'd1'), line('l2', 2000, 1, 'd2')],
        assignments: { l1: ['d1'], l2: ['d2'] },
      }),
      SERVICE_FEE,
    )
    expect(result.shares[0]).toMatchObject({ subtotalCents: 10000, serviceFeeCents: 1000, totalCents: 11000 })
    expect(result.shares[1]).toMatchObject({ subtotalCents: 2000, serviceFeeCents: 200, totalCents: 2200 })
  })

  it('spreads the service fee so the shares add back up to the bill exactly', () => {
    const result = computeSplit(
      session({
        diners: [ana, bruno, caio],
        splitMode: 'byItem',
        lines: [line('l1', 3333, 1, 'd1'), line('l2', 3333, 1, 'd2'), line('l3', 3334, 1, 'd3')],
        assignments: { l1: ['d1'], l2: ['d2'], l3: ['d3'] },
      }),
      SERVICE_FEE,
    )
    expect(sumShares(result.shares)).toBe(result.billTotalCents)
    expect(result.differenceCents).toBe(0)
  })

  it('charges no service fee to a diner who took nothing', () => {
    const result = computeSplit(
      session({
        diners: [ana, bruno],
        splitMode: 'byItem',
        lines: [line('l1', 10000, 1, 'd1')],
        assignments: { l1: ['d1'] },
      }),
      SERVICE_FEE,
    )
    expect(result.shares[1]).toMatchObject({ subtotalCents: 0, serviceFeeCents: 0, totalCents: 0 })
  })

  it('reports what nobody claimed instead of hiding it', () => {
    const result = computeSplit(
      session({
        diners: [ana, bruno],
        splitMode: 'byItem',
        serviceFeeIncluded: false,
        lines: [line('l1', 8900, 1, 'd1'), line('l2', 3400, 1, 'd2')],
        assignments: { l1: ['d1'], l2: [] },
      }),
      SERVICE_FEE,
    )
    expect(result.unassignedCents).toBe(3400)
    expect(sumShares(result.shares)).toBe(8900)
    expect(result.differenceCents).toBe(3400)
  })

  it('does not charge the table a service fee on food nobody claimed', () => {
    const result = computeSplit(
      session({
        diners: [ana, bruno],
        splitMode: 'byItem',
        lines: [line('l1', 10000, 1, 'd1'), line('l2', 5000, 1, 'd2')],
        assignments: { l1: ['d1'], l2: [] },
      }),
      SERVICE_FEE,
    )
    // Ana pays for her dish plus 10% of it, and nothing towards the orphan line.
    expect(result.shares[0].totalCents).toBe(11000)
    expect(result.unassignedCents).toBe(5000)
    expect(result.differenceCents).toBe(5500)
  })

  it('treats a line with no assignment entry at all as unclaimed', () => {
    const result = computeSplit(
      session({
        diners: [ana],
        splitMode: 'byItem',
        serviceFeeIncluded: false,
        lines: [line('l1', 2500)],
        assignments: {},
      }),
      SERVICE_FEE,
    )
    expect(result.unassignedCents).toBe(2500)
  })

  it('ignores an assignment to someone who is not at the table', () => {
    const result = computeSplit(
      session({
        diners: [ana],
        splitMode: 'byItem',
        serviceFeeIncluded: false,
        lines: [line('l1', 2000)],
        assignments: { l1: ['d1', 'ghost'] },
      }),
      SERVICE_FEE,
    )
    expect(result.shares[0].totalCents).toBe(2000)
    expect(result.unassignedCents).toBe(0)
  })

  it('lists the lines each diner is paying for', () => {
    const result = computeSplit(
      session({
        diners: [ana, bruno],
        splitMode: 'byItem',
        lines: [line('l1', 5600), line('l2', 1600, 1, 'd2')],
        assignments: { l1: ['d1', 'd2'], l2: ['d2'] },
      }),
      SERVICE_FEE,
    )
    expect(result.shares[0].lineIds).toEqual(['l1'])
    expect(result.shares[1].lineIds).toEqual(['l1', 'l2'])
  })

  it('covers the whole bill once every line is claimed', () => {
    const result = computeSplit(
      session({
        diners: [ana, bruno, caio],
        splitMode: 'byItem',
        lines: [line('l1', 8900), line('l2', 1633), line('l3', 777)],
        assignments: { l1: ['d1', 'd2'], l2: ['d3'], l3: ['d1', 'd2', 'd3'] },
      }),
      SERVICE_FEE,
    )
    expect(result.unassignedCents).toBe(0)
    expect(sumShares(result.shares)).toBe(result.billTotalCents)
  })
})

describe('custom split', () => {
  const ana = diner('d1', 'Ana', 0)
  const bruno = diner('d2', 'Bruno', 1)

  it('uses exactly the amounts the diners typed', () => {
    const result = computeSplit(
      session({
        diners: [ana, bruno],
        splitMode: 'custom',
        lines: [line('l1', 10000)],
        customAmounts: { d1: 7000, d2: 4000 },
      }),
      SERVICE_FEE,
    )
    expect(result.shares.map((s) => s.totalCents)).toEqual([7000, 4000])
    expect(result.differenceCents).toBe(0)
  })

  it('reports how much is still missing', () => {
    const result = computeSplit(
      session({
        diners: [ana, bruno],
        splitMode: 'custom',
        lines: [line('l1', 10000)],
        customAmounts: { d1: 5000 },
      }),
      SERVICE_FEE,
    )
    expect(result.differenceCents).toBe(6000)
  })

  it('reports a negative difference when the table typed too much', () => {
    const result = computeSplit(
      session({
        diners: [ana, bruno],
        splitMode: 'custom',
        lines: [line('l1', 10000)],
        customAmounts: { d1: 9000, d2: 9000 },
      }),
      SERVICE_FEE,
    )
    expect(result.differenceCents).toBe(-7000)
  })

  it('treats a missing amount as zero', () => {
    const result = computeSplit(
      session({ diners: [ana, bruno], splitMode: 'custom', customAmounts: {} }),
      SERVICE_FEE,
    )
    expect(result.shares.map((s) => s.totalCents)).toEqual([0, 0])
  })
})

describe('suggestCustomAmounts', () => {
  it('spreads the total evenly and keeps every cent', () => {
    const amounts = suggestCustomAmounts(
      [diner('d1', 'Ana', 0), diner('d2', 'Bruno', 1), diner('d3', 'Caio', 2)],
      10000,
    )
    expect(Object.values(amounts).reduce((a, b) => a + b, 0)).toBe(10000)
    expect(amounts).toEqual({ d1: 3334, d2: 3333, d3: 3333 })
  })
})

describe('the money always adds up', () => {
  const diners = [diner('d1', 'Ana', 0), diner('d2', 'Bruno', 1), diner('d3', 'Caio', 2)]
  const lines = [line('l1', 8933), line('l2', 1617, 3), line('l3', 777), line('l4', 10001)]

  it('equal split adds back up to the bill, fee on or off', () => {
    for (const serviceFeeIncluded of [true, false]) {
      const result = computeSplit(session({ diners, lines, serviceFeeIncluded }), SERVICE_FEE)
      expect(sumShares(result.shares)).toBe(result.billTotalCents)
    }
  })

  it('a bill split by item adds back up to the bill once every line is claimed', () => {
    for (const serviceFeeIncluded of [true, false]) {
      const result = computeSplit(
        session({
          diners,
          lines,
          serviceFeeIncluded,
          splitMode: 'byItem',
          assignments: { l1: ['d1'], l2: ['d2', 'd3'], l3: ['d1', 'd2', 'd3'], l4: ['d3'] },
        }),
        SERVICE_FEE,
      )
      expect(result.unassignedCents).toBe(0)
      expect(sumShares(result.shares)).toBe(result.billTotalCents)
      expect(result.differenceCents).toBe(0)
    }
  })
})
