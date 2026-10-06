import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import i18n from '../../../shared/i18n'
import { renderInTable, seedSession } from '../../../test/renderTable'
import type { OrderLine } from '../../session/types'
import { OrderPage } from './OrderPage'

const AT = '2026-10-06T20:00:00.000Z'
const ana = { dinerId: 'd1', name: 'Ana', colorIndex: 0, joinedAt: AT }
const bruno = { dinerId: 'd2', name: 'Bruno', colorIndex: 1, joinedAt: AT }

function line(overrides: Partial<OrderLine> = {}): OrderLine {
  return {
    lineId: 'l1',
    itemId: 'chopp',
    name: 'Chopp pilsen 300ml',
    emoji: '🍺',
    unitPriceCents: 1600,
    quantity: 1,
    notes: '',
    addedByDinerId: 'd1',
    status: 'cart',
    placedAt: null,
    ...overrides,
  }
}

/** The amount shown next to a totals label, so `10,00` never matches `110,00`. */
function amountFor(label: string): string {
  return screen.getByText(label).parentElement?.querySelector('dd')?.textContent ?? ''
}

describe('OrderPage', () => {
  beforeEach(async () => {
    window.localStorage.clear()
    await i18n.changeLanguage('en')
  })

  it('points an empty table back to the menu', () => {
    seedSession({ diners: [ana], currentDinerId: 'd1' })
    renderInTable(<OrderPage />)
    expect(screen.getByText('The order is empty. Go back to the menu to start.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'See the menu' })).toBeInTheDocument()
  })

  it('lists the items with who ordered them', () => {
    seedSession({
      diners: [ana, bruno],
      currentDinerId: 'd1',
      lines: [line(), line({ lineId: 'l2', name: 'Tiramisù', addedByDinerId: 'd2' })],
    })
    renderInTable(<OrderPage />)
    expect(screen.getByText('Ordered by Ana')).toBeInTheDocument()
    expect(screen.getByText('Ordered by Bruno')).toBeInTheDocument()
  })

  it('shows the note a diner left on a line', () => {
    seedSession({ diners: [ana], currentDinerId: 'd1', lines: [line({ notes: 'bem gelado' })] })
    renderInTable(<OrderPage />)
    expect(screen.getByText('bem gelado')).toBeInTheDocument()
  })

  it('adds up the subtotal, the service fee and the total', () => {
    seedSession({
      diners: [ana],
      currentDinerId: 'd1',
      lines: [line({ unitPriceCents: 10000 })],
    })
    renderInTable(<OrderPage />)
    expect(amountFor('Subtotal')).toMatch(/100,00/)
    expect(amountFor('Service fee (10%)')).toMatch(/10,00/)
    expect(amountFor('Total')).toMatch(/110,00/)
  })

  it('leaves the service fee out of the totals when the table declined it', () => {
    seedSession({
      diners: [ana],
      currentDinerId: 'd1',
      serviceFeeIncluded: false,
      lines: [line({ unitPriceCents: 10000 })],
    })
    renderInTable(<OrderPage />)
    expect(screen.queryByText('Service fee (10%)')).not.toBeInTheDocument()
  })

  it('raises and lowers the quantity of a line that has not been sent', async () => {
    seedSession({ diners: [ana], currentDinerId: 'd1', lines: [line()] })
    renderInTable(<OrderPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Increase quantity' }))
    expect(amountFor('Subtotal')).toMatch(/32,00/)

    await userEvent.click(screen.getByRole('button', { name: 'Decrease quantity' }))
    expect(amountFor('Subtotal')).toMatch(/16,00/)
  })

  it('removes a line when its quantity drops to zero', async () => {
    seedSession({ diners: [ana], currentDinerId: 'd1', lines: [line()] })
    renderInTable(<OrderPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Decrease quantity' }))
    expect(await screen.findByText('The order is empty. Go back to the menu to start.')).toBeInTheDocument()
  })

  it('sends the order to the kitchen and says so', async () => {
    seedSession({ diners: [ana], currentDinerId: 'd1', lines: [line()] })
    renderInTable(<OrderPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Send to the kitchen' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Order sent to the kitchen')
    expect(screen.getByRole('heading', { name: 'In the kitchen' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Send to the kitchen' })).not.toBeInTheDocument()
  })

  it('does not let a line already in the kitchen be edited', () => {
    seedSession({
      diners: [ana],
      currentDinerId: 'd1',
      lines: [line({ status: 'placed', placedAt: AT, quantity: 2 })],
    })
    renderInTable(<OrderPage />)
    expect(screen.queryByRole('button', { name: 'Increase quantity' })).not.toBeInTheDocument()
    expect(screen.getByText('×2')).toBeInTheDocument()
  })
})
