import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import i18n from '../../../shared/i18n'
import { MenuItemCard } from './MenuItemCard'
import type { MenuItem } from '../types'

const ITEM: MenuItem = {
  itemId: 'ancho',
  categoryId: 'principais',
  name: 'Bife ancho 300g',
  description: 'Grelhado na brasa, batata rustica e chimichurri.',
  priceCents: 12900,
  emoji: '🥩',
  tags: ['popular'],
  available: true,
}

function renderCard(item: MenuItem, onSelect = vi.fn()) {
  render(<MenuItemCard item={item} currency="BRL" locale="pt-BR" onSelect={onSelect} />)
  return onSelect
}

describe('MenuItemCard', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('shows the name, the description and the price', () => {
    renderCard(ITEM)
    expect(screen.getByText('Bife ancho 300g')).toBeInTheDocument()
    expect(screen.getByText(/chimichurri/)).toBeInTheDocument()
    expect(screen.getByText(/129,00/)).toBeInTheDocument()
  })

  it('shows the translated tags', () => {
    renderCard(ITEM)
    expect(screen.getByText('Most ordered')).toBeInTheDocument()
  })

  it('calls onSelect with the item when tapped', async () => {
    const onSelect = renderCard(ITEM)
    await userEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith(ITEM)
  })

  it('shows sold out and cannot be tapped when the item is unavailable', async () => {
    const onSelect = renderCard({ ...ITEM, available: false })
    expect(screen.getByText('Sold out')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
    await userEvent.click(screen.getByRole('button'))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('hides the price of an unavailable item', () => {
    renderCard({ ...ITEM, available: false })
    expect(screen.queryByText(/129,00/)).not.toBeInTheDocument()
  })
})
