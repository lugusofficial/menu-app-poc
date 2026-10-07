import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import i18n from '../../../shared/i18n'
import { ItemSheet } from './ItemSheet'
import type { MenuItem } from '../types'

const ITEM: MenuItem = {
  itemId: 'chopp',
  categoryId: 'bebidas',
  name: 'Chopp pilsen 300ml',
  description: 'Puro malte, bem gelado.',
  priceCents: 1600,
  emoji: '🍺',
  image: null,
  tags: [],
  available: true,
}

const AT = '2026-10-06T20:00:00.000Z'
const ANA = { dinerId: 'd1', name: 'Ana', colorIndex: 0, joinedAt: AT }
const BRUNO = { dinerId: 'd2', name: 'Bruno', colorIndex: 1, joinedAt: AT }

function renderSheet(diners = [ANA]) {
  const onAdd = vi.fn()
  const onClose = vi.fn()
  render(
    <ItemSheet
      item={ITEM}
      currency="BRL"
      locale="pt-BR"
      diners={diners}
      currentDinerId="d1"
      onAdd={onAdd}
      onClose={onClose}
    />,
  )
  return { onAdd, onClose }
}

describe('ItemSheet', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('opens as a dialog named after the item', () => {
    renderSheet()
    expect(screen.getByRole('dialog', { name: 'Chopp pilsen 300ml' })).toBeInTheDocument()
  })

  it('starts at one and shows the price of a single item', () => {
    renderSheet()
    expect(screen.getByRole('button', { name: /Add/ })).toHaveTextContent('16,00')
  })

  it('updates the total as the quantity goes up', async () => {
    renderSheet()
    await userEvent.click(screen.getByRole('button', { name: 'Increase quantity' }))
    await userEvent.click(screen.getByRole('button', { name: 'Increase quantity' }))
    expect(screen.getByRole('button', { name: /Add/ })).toHaveTextContent('48,00')
  })

  it('does not go below one', async () => {
    renderSheet()
    expect(screen.getByRole('button', { name: 'Decrease quantity' })).toBeDisabled()
  })

  it('adds the item with the quantity and the note', async () => {
    const { onAdd } = renderSheet()
    await userEvent.click(screen.getByRole('button', { name: 'Increase quantity' }))
    await userEvent.type(screen.getByLabelText('Anything to note?'), 'bem gelado')
    await userEvent.click(screen.getByRole('button', { name: /Add/ }))
    expect(onAdd).toHaveBeenCalledWith(ITEM, 2, 'bem gelado', 'd1')
  })

  it('does not ask who it is for when only one person is at the table', () => {
    renderSheet()
    expect(screen.queryByText('Who is it for?')).not.toBeInTheDocument()
  })

  it('asks who it is for once a second person is at the table', () => {
    renderSheet([ANA, BRUNO])
    expect(screen.getByText('Who is it for?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ana' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('orders on behalf of someone who is not holding the phone', async () => {
    const { onAdd } = renderSheet([ANA, BRUNO])
    await userEvent.click(screen.getByRole('button', { name: 'Bruno' }))
    await userEvent.click(screen.getByRole('button', { name: /Add/ }))
    expect(onAdd).toHaveBeenCalledWith(ITEM, 1, '', 'd2')
  })

  it('closes on the close button', async () => {
    const { onClose } = renderSheet()
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('closes on the escape key', async () => {
    const { onClose } = renderSheet()
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })
})
