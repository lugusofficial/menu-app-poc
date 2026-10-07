import { describe, it, expect } from 'vitest'
import type { MenuItem } from '../menu/types'
import { sessionReducer } from './sessionReducer'
import type { SessionAction } from './sessionReducer'
import { emptySession } from './storage'
import type { TableSession } from './types'

const AT = '2026-10-06T20:00:00.000Z'

const CHOPP: MenuItem = {
  itemId: 'chopp',
  categoryId: 'bebidas',
  name: 'Chopp pilsen 300ml',
  description: '',
  priceCents: 1600,
  emoji: '🍺',
  image: null,
  tags: [],
  available: true,
}

const SOLD_OUT: MenuItem = { ...CHOPP, itemId: 'carpaccio', name: 'Carpaccio', available: false }

function newSession(): TableSession {
  return emptySession('cantina', '7', () => AT)
}

function apply(state: TableSession, ...actions: SessionAction[]): TableSession {
  return actions.reduce(sessionReducer, state)
}

const join = (dinerId: string, name: string): SessionAction => ({
  type: 'joinDiner',
  dinerId,
  name,
  joinedAt: AT,
})

const add = (lineId: string, dinerId: string, quantity = 1, notes = ''): SessionAction => ({
  type: 'addLine',
  lineId,
  item: CHOPP,
  quantity,
  notes,
  dinerId,
})

describe('joinDiner', () => {
  it('adds a diner and makes them the current one', () => {
    const state = apply(newSession(), join('d1', 'Ana'))
    expect(state.diners).toHaveLength(1)
    expect(state.diners[0]).toMatchObject({ dinerId: 'd1', name: 'Ana', colorIndex: 0 })
    expect(state.currentDinerId).toBe('d1')
  })

  it('gives each diner their own colour index', () => {
    const state = apply(newSession(), join('d1', 'Ana'), join('d2', 'Bruno'))
    expect(state.diners.map((d) => d.colorIndex)).toEqual([0, 1])
  })

  it('trims the typed name', () => {
    const state = apply(newSession(), join('d1', '  Ana  '))
    expect(state.diners[0].name).toBe('Ana')
  })

  it('ignores an empty name', () => {
    const state = apply(newSession(), join('d1', '   '))
    expect(state.diners).toEqual([])
    expect(state.currentDinerId).toBeNull()
  })

  it('reuses the diner instead of creating a twin when the name is already at the table', () => {
    const state = apply(newSession(), join('d1', 'Ana'), join('d2', 'ana'))
    expect(state.diners).toHaveLength(1)
    expect(state.currentDinerId).toBe('d1')
  })
})

describe('switchDiner', () => {
  it('changes who is holding the phone', () => {
    const state = apply(newSession(), join('d1', 'Ana'), join('d2', 'Bruno'), {
      type: 'switchDiner',
      dinerId: 'd1',
    })
    expect(state.currentDinerId).toBe('d1')
  })

  it('ignores a diner who is not at the table', () => {
    const state = apply(newSession(), join('d1', 'Ana'), { type: 'switchDiner', dinerId: 'ghost' })
    expect(state.currentDinerId).toBe('d1')
  })
})

describe('addLine', () => {
  it('adds a cart line and assigns it to whoever ordered it', () => {
    const state = apply(newSession(), join('d1', 'Ana'), add('l1', 'd1', 2))
    expect(state.lines).toHaveLength(1)
    expect(state.lines[0]).toMatchObject({
      lineId: 'l1',
      itemId: 'chopp',
      quantity: 2,
      status: 'cart',
      addedByDinerId: 'd1',
      unitPriceCents: 1600,
    })
    expect(state.assignments['l1']).toEqual(['d1'])
  })

  it('merges into the existing cart line for the same item, note and diner', () => {
    const state = apply(newSession(), join('d1', 'Ana'), add('l1', 'd1', 1), add('l2', 'd1', 2))
    expect(state.lines).toHaveLength(1)
    expect(state.lines[0].quantity).toBe(3)
  })

  it('keeps a separate line when the note differs', () => {
    const state = apply(
      newSession(),
      join('d1', 'Ana'),
      add('l1', 'd1', 1),
      add('l2', 'd1', 1, 'sem gelo'),
    )
    expect(state.lines).toHaveLength(2)
  })

  it('keeps a separate line for another diner', () => {
    const state = apply(
      newSession(),
      join('d1', 'Ana'),
      join('d2', 'Bruno'),
      add('l1', 'd1'),
      add('l2', 'd2'),
    )
    expect(state.lines).toHaveLength(2)
  })

  it('does not merge into a line that already went to the kitchen', () => {
    const state = apply(
      newSession(),
      join('d1', 'Ana'),
      add('l1', 'd1'),
      { type: 'placeOrder', placedAt: AT },
      add('l2', 'd1'),
    )
    expect(state.lines).toHaveLength(2)
  })

  it('ignores an item that is sold out', () => {
    const state = apply(newSession(), join('d1', 'Ana'), {
      type: 'addLine',
      lineId: 'l1',
      item: SOLD_OUT,
      quantity: 1,
      notes: '',
      dinerId: 'd1',
    })
    expect(state.lines).toEqual([])
  })

  it('ignores a quantity of zero', () => {
    const state = apply(newSession(), join('d1', 'Ana'), add('l1', 'd1', 0))
    expect(state.lines).toEqual([])
  })
})

describe('setQuantity and removeLine', () => {
  it('changes the quantity of a line', () => {
    const state = apply(newSession(), join('d1', 'Ana'), add('l1', 'd1'), {
      type: 'setQuantity',
      lineId: 'l1',
      quantity: 4,
    })
    expect(state.lines[0].quantity).toBe(4)
  })

  it('removes the line when the quantity drops to zero', () => {
    const state = apply(newSession(), join('d1', 'Ana'), add('l1', 'd1'), {
      type: 'setQuantity',
      lineId: 'l1',
      quantity: 0,
    })
    expect(state.lines).toEqual([])
    expect(state.assignments['l1']).toBeUndefined()
  })

  it('drops the assignment together with the line', () => {
    const state = apply(newSession(), join('d1', 'Ana'), add('l1', 'd1'), {
      type: 'removeLine',
      lineId: 'l1',
    })
    expect(state.assignments).toEqual({})
  })
})

describe('restoreLine', () => {
  it('puts a removed line back with the people who were sharing it', () => {
    const start = apply(newSession(), join('d1', 'Ana'), join('d2', 'Bruno'), add('l1', 'd1'))
    const removed = sessionReducer(start, { type: 'removeLine', lineId: 'l1' })
    const restored = sessionReducer(removed, {
      type: 'restoreLine',
      line: start.lines[0],
      sharedBy: ['d1', 'd2'],
    })

    expect(restored.lines).toHaveLength(1)
    expect(restored.lines[0].lineId).toBe('l1')
    expect(restored.assignments['l1']).toEqual(['d1', 'd2'])
  })

  it('does nothing when that line is already back', () => {
    const start = apply(newSession(), join('d1', 'Ana'), add('l1', 'd1'))
    const again = sessionReducer(start, {
      type: 'restoreLine',
      line: start.lines[0],
      sharedBy: ['d1'],
    })
    expect(again).toBe(start)
  })
})

describe('placeOrder', () => {
  it('marks every cart line as placed and stamps the time', () => {
    const state = apply(newSession(), join('d1', 'Ana'), add('l1', 'd1'), {
      type: 'placeOrder',
      placedAt: AT,
    })
    expect(state.lines[0]).toMatchObject({ status: 'placed', placedAt: AT })
  })

  it('does nothing when the cart is empty', () => {
    const before = apply(newSession(), join('d1', 'Ana'))
    expect(sessionReducer(before, { type: 'placeOrder', placedAt: AT })).toBe(before)
  })
})

describe('toggleAssignment', () => {
  it('adds a diner to a shared line', () => {
    const state = apply(
      newSession(),
      join('d1', 'Ana'),
      join('d2', 'Bruno'),
      add('l1', 'd1'),
      { type: 'toggleAssignment', lineId: 'l1', dinerId: 'd2' },
    )
    expect(state.assignments['l1']).toEqual(['d1', 'd2'])
  })

  it('removes a diner who was sharing the line', () => {
    const state = apply(
      newSession(),
      join('d1', 'Ana'),
      add('l1', 'd1'),
      { type: 'toggleAssignment', lineId: 'l1', dinerId: 'd1' },
    )
    expect(state.assignments['l1']).toEqual([])
  })
})

describe('custom amounts, service fee and payment', () => {
  it('stores a custom amount in cents', () => {
    const state = apply(newSession(), { type: 'setCustomAmount', dinerId: 'd1', cents: 3050 })
    expect(state.customAmounts['d1']).toBe(3050)
  })

  it('never stores a negative custom amount', () => {
    const state = apply(newSession(), { type: 'setCustomAmount', dinerId: 'd1', cents: -500 })
    expect(state.customAmounts['d1']).toBe(0)
  })

  it('toggles the service fee off and back on', () => {
    const off = apply(newSession(), { type: 'toggleServiceFee' })
    expect(off.serviceFeeIncluded).toBe(false)
    expect(apply(off, { type: 'toggleServiceFee' }).serviceFeeIncluded).toBe(true)
  })

  it('toggles a diner between paid and unpaid', () => {
    const paid = apply(newSession(), { type: 'togglePaid', dinerId: 'd1' })
    expect(paid.paidDinerIds).toEqual(['d1'])
    expect(apply(paid, { type: 'togglePaid', dinerId: 'd1' }).paidDinerIds).toEqual([])
  })
})

describe('reset', () => {
  it('clears the table but keeps venue and table', () => {
    const state = apply(newSession(), join('d1', 'Ana'), add('l1', 'd1'), { type: 'reset' })
    expect(state).toMatchObject({ venueSlug: 'cantina', tableId: '7', diners: [], lines: [] })
  })
})
