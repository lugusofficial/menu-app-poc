import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import i18n from '../../../shared/i18n'
import { renderInTable, seedSession } from '../../../test/renderTable'
import { MenuPage } from './MenuPage'

const AT = '2026-10-06T20:00:00.000Z'
const ana = { dinerId: 'd1', name: 'Ana', colorIndex: 0, joinedAt: AT }

function renderMenu() {
  seedSession({ diners: [ana], currentDinerId: 'd1' })
  return renderInTable(<MenuPage />, { route: '/t/cantina-do-porto/12/menu' })
}

describe('MenuPage', () => {
  beforeEach(async () => {
    window.localStorage.clear()
    await i18n.changeLanguage('en')
  })

  it('groups the dishes under their category', () => {
    renderMenu()
    expect(screen.getByRole('heading', { name: /Massas/ })).toBeInTheDocument()
    expect(screen.getByText('Cacio e pepe')).toBeInTheDocument()
  })

  it('filters the menu as the diner types, ignoring accents', async () => {
    renderMenu()
    await userEvent.type(screen.getByLabelText('Search the menu'), 'ragu')
    expect(screen.getByText(/ragù de costela/)).toBeInTheDocument()
    expect(screen.queryByText('Cacio e pepe')).not.toBeInTheDocument()
  })

  it('explains when a search matches nothing', async () => {
    renderMenu()
    await userEvent.type(screen.getByLabelText('Search the menu'), 'sushi')
    expect(screen.getByText('Nothing matches that search.')).toBeInTheDocument()
  })

  it('adds an item to the order through the sheet and confirms it', async () => {
    renderMenu()
    await userEvent.click(screen.getByText('Chopp pilsen 300ml'))

    const sheet = screen.getByRole('dialog', { name: 'Chopp pilsen 300ml' })
    await userEvent.click(within(sheet).getByRole('button', { name: /Add/ }))

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Chopp pilsen 300ml added to the order',
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the cart bar with the running total once something is added', async () => {
    renderMenu()
    await userEvent.click(screen.getByText('Chopp pilsen 300ml'))
    const sheet = screen.getByRole('dialog')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Increase quantity' }))
    await userEvent.click(within(sheet).getByRole('button', { name: /Add/ }))

    // The cart bar is a link, so middle click and open-in-new-tab work on it.
    const cartBar = await screen.findByRole('link', { name: /View order/ })
    expect(cartBar).toHaveTextContent('2 items')
    expect(cartBar).toHaveTextContent('32,00')
    expect(cartBar).toHaveAttribute('href', '/t/cantina-do-porto/12/order')
  })

  it('shows no cart bar before anything is ordered', () => {
    renderMenu()
    expect(screen.queryByRole('link', { name: /View order/ })).not.toBeInTheDocument()
  })

  it('does not open the sheet for a sold out dish', async () => {
    renderMenu()
    await userEvent.click(screen.getByText('Carpaccio de filé'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
