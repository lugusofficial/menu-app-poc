import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import i18n from '../../../shared/i18n'
import { renderInTable, seedSession } from '../../../test/renderTable'
import type { OrderLine, TableSession } from '../../session/types'
import { BillPage } from './BillPage'

const AT = '2026-10-06T20:00:00.000Z'
const ana = { dinerId: 'd1', name: 'Ana', colorIndex: 0, joinedAt: AT }
const bruno = { dinerId: 'd2', name: 'Bruno', colorIndex: 1, joinedAt: AT }

function line(lineId: string, name: string, unitPriceCents: number, addedBy = 'd1'): OrderLine {
  return {
    lineId,
    itemId: lineId,
    name,
    emoji: '🍽️',
    unitPriceCents,
    quantity: 1,
    notes: '',
    addedByDinerId: addedBy,
    status: 'placed',
    placedAt: AT,
  }
}

const STEAK = line('l1', 'Bife ancho', 10000, 'd1')
const BEER = line('l2', 'Chopp', 2000, 'd2')

function renderBill(overrides: Partial<TableSession> = {}) {
  seedSession({
    diners: [ana, bruno],
    currentDinerId: 'd1',
    lines: [STEAK, BEER],
    assignments: { l1: ['d1'], l2: ['d2'] },
    ...overrides,
  })
  return renderInTable(<BillPage />)
}

/** The card of one diner, so an amount is read from the right person and not
 *  from the same name on an item row. */
function shareOf(name: string): HTMLElement {
  const shares = screen.getByRole('list', { name: 'Who pays what' })
  return within(shares).getByText(name).closest('li')!
}

/** One row of the item list, where the table taps who had what. */
function itemRow(name: RegExp): HTMLElement {
  const items = screen.getByRole('list', { name: 'Items on the bill' })
  return within(items).getByText(name).closest('li')!
}

describe('BillPage', () => {
  beforeEach(async () => {
    window.localStorage.clear()
    await i18n.changeLanguage('en')
  })

  it('says there is nothing to split on an empty table', () => {
    seedSession({ diners: [ana], currentDinerId: 'd1' })
    renderInTable(<BillPage />)
    expect(screen.getByText('There is nothing on the bill yet.')).toBeInTheDocument()
  })

  it('shows the bill subtotal, the service fee and the total', () => {
    renderBill()
    const summary = screen.getByLabelText('Bill summary')
    expect(within(summary).getByText(/120,00/)).toBeInTheDocument()
    expect(within(summary).getByText(/12,00/)).toBeInTheDocument()
    expect(within(summary).getByText(/132,00/)).toBeInTheDocument()
  })

  it('splits evenly by default and gives both diners the same share', () => {
    renderBill()
    expect(shareOf('Ana')).toHaveTextContent('66,00')
    expect(shareOf('Bruno')).toHaveTextContent('66,00')
  })

  it('drops the service fee from the bill when the table unticks it', async () => {
    renderBill()
    await userEvent.click(screen.getByLabelText('Include the 10% service fee'))
    expect(shareOf('Ana')).toHaveTextContent('60,00')
    expect(screen.queryByText('Service fee (10%)')).not.toBeInTheDocument()
  })

  it('charges each diner for their own items in the by item mode', async () => {
    renderBill()
    await userEvent.click(screen.getByRole('tab', { name: 'By item' }))

    expect(shareOf('Ana')).toHaveTextContent('110,00')
    expect(shareOf('Bruno')).toHaveTextContent('22,00')
  })

  it('splits a shared item between the diners who tapped it', async () => {
    renderBill({ assignments: { l1: ['d1', 'd2'], l2: ['d2'] }, splitMode: 'byItem' })

    expect(shareOf('Ana')).toHaveTextContent('55,00')
    expect(shareOf('Bruno')).toHaveTextContent('77,00')
    expect(screen.getByText('Split between 2')).toBeInTheDocument()
  })

  it('adds a diner to an item when their name is tapped', async () => {
    renderBill({ splitMode: 'byItem' })

    await userEvent.click(within(itemRow(/Bife ancho/)).getByRole('button', { name: 'Bruno' }))

    expect(shareOf('Ana')).toHaveTextContent('55,00')
    expect(shareOf('Bruno')).toHaveTextContent('77,00')
  })

  it('warns about items nobody has taken', async () => {
    renderBill({ splitMode: 'byItem', assignments: { l1: ['d1'], l2: [] } })
    expect(screen.getByText(/20,00 has nobody on it yet/)).toBeInTheDocument()
  })

  it('says the bill is settled once every item has an owner', () => {
    renderBill({ splitMode: 'byItem' })
    expect(screen.getByText('The bill adds up. You can go ahead and pay.')).toBeInTheDocument()
  })

  it('lists the items each diner is paying for', () => {
    renderBill({ splitMode: 'byItem' })
    expect(shareOf('Ana')).toHaveTextContent('Bife ancho')
    expect(shareOf('Bruno')).toHaveTextContent('Chopp')
  })

  it('reports what is still missing in the custom mode', async () => {
    renderBill({ splitMode: 'custom', customAmounts: { d1: 10000 } })
    expect(screen.getByText(/32,00 is still missing/)).toBeInTheDocument()
  })

  it('reports when the table has put in more than the total', () => {
    renderBill({ splitMode: 'custom', customAmounts: { d1: 10000, d2: 10000 } })
    expect(screen.getByText(/68,00 more than the total/)).toBeInTheDocument()
  })

  it('takes a typed amount for one diner', async () => {
    renderBill({ splitMode: 'custom' })
    await userEvent.type(screen.getByLabelText('How much Ana will pay'), '50')
    expect(shareOf('Ana')).toHaveTextContent('50,00')
  })

  it('fills the custom amounts evenly on request', async () => {
    renderBill({ splitMode: 'custom' })
    await userEvent.click(screen.getByRole('button', { name: 'Split what is left evenly' }))

    expect(shareOf('Ana')).toHaveTextContent('66,00')
    expect(shareOf('Bruno')).toHaveTextContent('66,00')
    expect(screen.getByText('The bill adds up. You can go ahead and pay.')).toBeInTheDocument()
  })

  it('marks a diner as paid and lets it be undone', async () => {
    renderBill()
    const anaCard = shareOf('Ana')
    await userEvent.click(within(anaCard).getByRole('button', { name: 'Mark as paid' }))

    expect(await screen.findByText('Ana marked as paid')).toBeInTheDocument()
    expect(shareOf('Ana')).toHaveTextContent('Paid')

    await userEvent.click(within(shareOf('Ana')).getByRole('button', { name: 'Undo payment' }))
    expect(shareOf('Ana')).not.toHaveTextContent('Paid')
  })

  it('keeps the chosen split mode on the table session', async () => {
    renderBill()
    await userEvent.click(screen.getByRole('tab', { name: 'Free amounts' }))

    const stored = JSON.parse(window.localStorage.getItem('mesa.session.cantina-do-porto.12') ?? '{}')
    expect(stored.splitMode).toBe('custom')
  })
})
