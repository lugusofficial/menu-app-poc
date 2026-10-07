import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import i18n from '../../../shared/i18n'
import { renderInTable, seedSession } from '../../../test/renderTable'
import type { OrderLine } from '../types'
import { PeopleSheet } from './PeopleSheet'

const AT = '2026-10-06T20:00:00.000Z'
const ana = { dinerId: 'd1', name: 'Ana', colorIndex: 0, joinedAt: AT }
const bruno = { dinerId: 'd2', name: 'Bruno', colorIndex: 1, joinedAt: AT }

function line(addedBy: string): OrderLine {
  return {
    lineId: 'l1',
    itemId: 'chopp',
    name: 'Chopp',
    emoji: '🍺',
    image: null,
    unitPriceCents: 1600,
    quantity: 1,
    notes: '',
    addedByDinerId: addedBy,
    status: 'cart',
    placedAt: null,
  }
}

const stored = () =>
  JSON.parse(window.localStorage.getItem('mesa.session.cantina-do-porto.12') ?? '{}')

function rowFor(name: string): HTMLElement {
  return screen.getByText(name).closest('li')!
}

describe('PeopleSheet', () => {
  beforeEach(async () => {
    window.localStorage.clear()
    await i18n.changeLanguage('en')
  })

  it('lists everyone at the table and marks who holds the phone', () => {
    seedSession({ diners: [ana, bruno], currentDinerId: 'd1' })
    renderInTable(<PeopleSheet onClose={vi.fn()} />)

    expect(within(rowFor('Ana')).getByText('You')).toBeInTheDocument()
    expect(within(rowFor('Bruno')).getByRole('button', { name: 'This is me' })).toBeInTheDocument()
  })

  it('adds someone without taking over the phone', async () => {
    seedSession({ diners: [ana], currentDinerId: 'd1' })
    renderInTable(<PeopleSheet onClose={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('Add someone'), 'Bruno')
    await userEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(await screen.findByText('Bruno')).toBeInTheDocument()
    expect(stored().diners.map((d: { name: string }) => d.name)).toEqual(['Ana', 'Bruno'])
    expect(stored().currentDinerId).toBe('d1')
  })

  it('announces the new row instead of covering the button with a toast', async () => {
    seedSession({ diners: [ana], currentDinerId: 'd1' })
    renderInTable(<PeopleSheet onClose={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('Add someone'), 'Bruno')
    await userEvent.click(screen.getByRole('button', { name: 'Add' }))

    const list = screen.getByRole('list')
    expect(list).toHaveAttribute('aria-live', 'polite')
    expect(within(list).getByText('Bruno')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toHaveTextContent('Bruno')
  })

  it('stays ready for the next name, so a table is entered in one go', async () => {
    seedSession({ diners: [ana], currentDinerId: 'd1' })
    renderInTable(<PeopleSheet onClose={vi.fn()} />)

    const field = screen.getByLabelText('Add someone')
    for (const name of ['Bruno', 'Caio', 'Dani']) {
      await userEvent.type(field, name)
      await userEvent.click(screen.getByRole('button', { name: 'Add' }))
    }

    expect(stored().diners).toHaveLength(4)
    expect(field).toHaveValue('')
    expect(field).toHaveFocus()
  })

  it('cannot add an empty name', () => {
    seedSession({ diners: [ana], currentDinerId: 'd1' })
    renderInTable(<PeopleSheet onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
  })

  it('hands the phone to someone else at the table', async () => {
    seedSession({ diners: [ana, bruno], currentDinerId: 'd1' })
    renderInTable(<PeopleSheet onClose={vi.fn()} />)

    await userEvent.click(within(rowFor('Bruno')).getByRole('button', { name: 'This is me' }))
    expect(stored().currentDinerId).toBe('d2')
  })

  it('removes someone added by mistake', async () => {
    seedSession({ diners: [ana, bruno], currentDinerId: 'd1' })
    renderInTable(<PeopleSheet onClose={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Take Bruno off the table' }))
    expect(stored().diners.map((d: { name: string }) => d.name)).toEqual(['Ana'])
  })

  it('will not remove someone who already ordered', () => {
    seedSession({ diners: [ana, bruno], currentDinerId: 'd1', lines: [line('d2')] })
    renderInTable(<PeopleSheet onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Take Bruno off the table' })).toBeDisabled()
  })

  it('will not let the person holding the phone remove themselves', () => {
    seedSession({ diners: [ana, bruno], currentDinerId: 'd1' })
    renderInTable(<PeopleSheet onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Take Ana off the table' })).toBeDisabled()
  })

  it('closes on done and on escape', async () => {
    const onClose = vi.fn()
    seedSession({ diners: [ana], currentDinerId: 'd1' })
    renderInTable(<PeopleSheet onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(onClose).toHaveBeenCalledTimes(1)

    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
