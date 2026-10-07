import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import i18n from '../../../shared/i18n'
import { renderInTable, seedSession } from '../../../test/renderTable'
import type { OrderLine, SplitMode, TableSession } from '../../session/types'
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
    image: null,
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

/** The split mode is view state, so it arrives through the URL, not the session. */
function renderBill({ mode, ...overrides }: Partial<TableSession> & { mode?: SplitMode } = {}) {
  seedSession({
    diners: [ana, bruno],
    currentDinerId: 'd1',
    lines: [STEAK, BEER],
    assignments: { l1: ['d1'], l2: ['d2'] },
    ...overrides,
  })
  const route = `/t/cantina-do-porto/12/bill${mode ? `?split=${mode}` : ''}`
  return renderInTable(<BillPage />, { route })
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
    renderBill({ assignments: { l1: ['d1', 'd2'], l2: ['d2'] }, mode: 'byItem' })

    expect(shareOf('Ana')).toHaveTextContent('55,00')
    expect(shareOf('Bruno')).toHaveTextContent('77,00')
    expect(screen.getByText('Split between 2')).toBeInTheDocument()
  })

  it('adds a diner to an item when their name is tapped', async () => {
    renderBill({ mode: 'byItem' })

    await userEvent.click(within(itemRow(/Bife ancho/)).getByRole('button', { name: 'Bruno' }))

    expect(shareOf('Ana')).toHaveTextContent('55,00')
    expect(shareOf('Bruno')).toHaveTextContent('77,00')
  })

  it('warns about items nobody has taken', async () => {
    renderBill({ mode: 'byItem', assignments: { l1: ['d1'], l2: [] } })
    expect(screen.getByText(/20,00 has nobody on it yet/)).toBeInTheDocument()
  })

  it('says the bill is settled once every item has an owner', () => {
    renderBill({ mode: 'byItem' })
    expect(screen.getByText('The bill adds up. You can go ahead and pay.')).toBeInTheDocument()
  })

  it('lists the items each diner is paying for', () => {
    renderBill({ mode: 'byItem' })
    expect(shareOf('Ana')).toHaveTextContent('Bife ancho')
    expect(shareOf('Bruno')).toHaveTextContent('Chopp')
  })

  it('reports what is still missing in the custom mode', async () => {
    renderBill({ mode: 'custom', customAmounts: { d1: 10000 } })
    expect(screen.getByText(/32,00 is still missing/)).toBeInTheDocument()
  })

  it('reports when the table has put in more than the total', () => {
    renderBill({ mode: 'custom', customAmounts: { d1: 10000, d2: 10000 } })
    expect(screen.getByText(/68,00 more than the total/)).toBeInTheDocument()
  })

  it('takes a typed amount for one diner', async () => {
    renderBill({ mode: 'custom' })
    await userEvent.type(screen.getByLabelText('How much Ana will pay'), '50')
    expect(shareOf('Ana')).toHaveTextContent('50,00')
  })

  it('fills the custom amounts evenly on request', async () => {
    renderBill({ mode: 'custom' })
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

  it('opens on the mode named in the URL', () => {
    renderBill({ mode: 'custom' })
    expect(screen.getByRole('tab', { name: 'Free amounts' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByLabelText('How much Ana will pay')).toBeInTheDocument()
  })

  it('falls back to the even split when the URL names no mode', () => {
    renderBill()
    expect(screen.getByRole('tab', { name: 'Evenly' })).toHaveAttribute('aria-selected', 'true')
  })

  it('falls back to the even split when the URL names a mode that does not exist', () => {
    seedSession({ diners: [ana, bruno], currentDinerId: 'd1', lines: [STEAK, BEER] })
    renderInTable(<BillPage />, { route: '/t/cantina-do-porto/12/bill?split=nonsense' })
    expect(screen.getByRole('tab', { name: 'Evenly' })).toHaveAttribute('aria-selected', 'true')
  })

  it('switches the split shown when another tab is picked', async () => {
    renderBill()
    await userEvent.click(screen.getByRole('tab', { name: 'Free amounts' }))

    expect(screen.getByRole('tab', { name: 'Free amounts' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByLabelText('How much Ana will pay')).toBeInTheDocument()
  })
})
